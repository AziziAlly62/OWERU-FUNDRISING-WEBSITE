<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\Donation;
use App\Models\FollowupTask;
use App\Models\FundingRequest;
use App\Models\Report;
use Illuminate\Support\Facades\DB;

/**
 * Time-driven work that previously only ran lazily on page reads. Centralised
 * here so the web controllers and the `app:maintenance` scheduled command
 * share one implementation. In this environment the command is registered
 * with the scheduler in bootstrap/app.php (`schedule:run` + cron); the lazy
 * controller calls keep behaviour correct even when no scheduler is running.
 */
class MaintenanceService
{
    public function runAll(): array
    {
        return [
            'overdue_reports' => $this->markOverdueReports(),
            'closed_funding' => $this->closeExpiredFunding(),
            'expired_donations' => $this->expireStalePendingDonations(),
        ];
    }

    /**
     * All-or-nothing funding window: when every item of a published request
     * has passed its 60-day funding deadline, close the request's funding.
     */
    public function closeExpiredFunding(): int
    {
        $today = now()->toDateString();
        $closed = 0;

        FundingRequest::with('items')
            ->where('status', 'published')
            ->get()
            ->filter(function ($req) use ($today) {
                $items = $req->items;
                if ($items->isEmpty()) {
                    return false;
                }
                return $items->every(fn ($i) => $i->funding_deadline && $i->funding_deadline->format('Y-m-d') < $today);
            })
            ->each(function ($req) use (&$closed) {
                $req->update(['status' => 'funding_closed']);
                $closed++;
                AuditLog::record('request.status_changed', 'FundingRequest', $req->id, 'published', 'funding_closed');

                if ($req->applicant_id) {
                    AppNotification::create([
                        'user_id' => $req->applicant_id,
                        'type' => 'request.status',
                        'title' => 'Funding window closed',
                        'body' => 'The funding window for "' . $req->title . '" has closed. Partially funded items will be reviewed by the Foundation.',
                        'url' => '/track/' . $req->track_token,
                    ]);
                }
            });

        return $closed;
    }

    /**
     * Flag overdue reports, notify the recipient, the endorsing organisation
     * and OWERU staff, record repeated non-compliance (overdue_count), and
     * leave a follow-up task in the admin queue so it is not lost.
     */
    public function markOverdueReports(): int
    {
        $now = now()->toDateString();
        $count = 0;

        $reports = Report::with('item.request.organization')->where('status', 'upcoming')
            ->whereNotNull('due_date')
            ->where('due_date', '<', $now)
            ->get();

        foreach ($reports as $report) {
            $report->update([
                'status' => 'overdue',
                'overdue_count' => ((int) $report->overdue_count) + 1,
            ]);
            $count++;
            AuditLog::record('report.overdue', 'Report', $report->id, 'upcoming', 'overdue');

            $request = $report->item?->request;

            if ($report->recipient_id) {
                AppNotification::create([
                    'user_id' => $report->recipient_id,
                    'type' => 'report.overdue',
                    'title' => 'Report overdue',
                    'body' => 'Your ' . str_replace('_', ' ', $report->type) . ' report is overdue as of ' . $report->due_date->toDateString() . '. Please submit it as soon as possible.',
                    'url' => null,
                ]);

                // Notify the endorsing organisation too (SRS §11/§24).
                if ($request?->organization_id) {
                    $orgUsers = \App\Models\User::where('organization_id', $request->organization_id)
                        ->where('role', 'endorser')
                        ->pluck('id');
                    foreach ($orgUsers as $orgUserId) {
                        AppNotification::create([
                            'user_id' => $orgUserId,
                            'type' => 'report.overdue',
                            'title' => 'Report overdue',
                            'body' => 'The ' . str_replace('_', ' ', $report->type) . ' report for "' . $request->title . '" is overdue. Please help the recipient submit it.',
                            'url' => '/portal/church',
                        ]);
                    }
                }
            }

            // Notify OWERU staff so someone can follow up / submit on their behalf.
            foreach (\App\Models\User::whereIn('role', ['admin', 'manager'])->pluck('id') as $adminId) {
                AppNotification::create([
                    'user_id' => $adminId,
                    'type' => 'report.overdue',
                    'title' => 'Report overdue',
                    'body' => ($report->item?->name ?: 'Item') . ' · ' . str_replace('_', ' ', $report->type) . ' report is overdue (due ' . $report->due_date->toDateString() . ').',
                    'url' => '/portal/reports',
                ]);
            }

            // Leave an open follow-up task (one open task per report at a time).
            if (! FollowupTask::where('report_id', $report->id)->where('status', 'open')->exists()) {
                FollowupTask::create([
                    'report_id' => $report->id,
                    'status' => 'open',
                    'note' => 'Report became overdue on ' . now()->toDateString() . '. Track and close after submission.',
                ]);
            }
        }

        return $count;
    }

    /**
     * Donations stuck 'pending' for more than 24h lose their reservation so
     * other donors can give. Staff may still confirm them manually later.
     */
    public function expireStalePendingDonations(int $hours = 24): int
    {
        $affected = Donation::where('status', 'pending')
            ->where('created_at', '<', now()->subHours($hours))
            ->update([
                'status' => 'expired',
                'mpesa_status' => DB::raw("CASE WHEN mpesa_status = 'pending_stk' THEN 'expired' ELSE mpesa_status END"),
            ]);

        return $affected;
    }
}
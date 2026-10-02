<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Donation;
use App\Models\Equipment;
use App\Models\FollowupTask;
use App\Models\FundingRequest;
use App\Models\Quote;
use App\Models\Report;
use App\Models\RequestItem;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * Business KPIs for the admin dashboard: donor behaviour, funding pace
     * and fulfilment progress. Cheap aggregate queries, safe for dashboards.
     */
    public function kpi()
    {
        $donorKey = "COALESCE(IF(donor_id IS NOT NULL, CONCAT('u', donor_id), NULL), IF(mpesa_phone IS NOT NULL AND mpesa_phone != '', CONCAT('p', mpesa_phone), CONCAT('n', COALESCE(donor_name, 'anon'))))";

        $donorsTotal = (int) DB::table('donations')
            ->where('status', 'confirmed')
            ->distinct()
            ->selectRaw(DB::raw("COUNT(DISTINCT {$donorKey}) AS total"))
            ->value('total');

        $repeatDonors = (int) DB::table('donations')
            ->where('status', 'confirmed')
            ->selectRaw('COUNT(*) AS total')
            ->selectRaw("{$donorKey} AS dk")
            ->groupBy('dk')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->count();

        $donationStats = DB::table('donations')
            ->where('status', 'confirmed')
            ->selectRaw(
                'COUNT(*) AS count,
                 COALESCE(AVG(COALESCE(amount_tzs, amount)), 0) AS avg,
                 COALESCE(MAX(COALESCE(amount_tzs, amount)), 0) AS max,
                 COALESCE(SUM(COALESCE(amount_tzs, amount)), 0) AS total'
            )
            ->first();

        $last30d = DB::table('donations')
            ->where('status', 'confirmed')
            ->where('donated_at', '>=', now()->subDays(30))
            ->selectRaw('COUNT(*) AS count, COALESCE(SUM(COALESCE(amount_tzs, amount)), 0) AS total')
            ->first();

        $fundingDays = DB::table('audit_logs as a')
            ->join('requests as r', 'r.id', '=', 'a.entity_id')
            ->where('a.entity', 'FundingRequest')
            ->where('a.action', 'request.status_changed')
            ->where('a.new_value', 'funding_closed')
            ->whereNotNull('r.submitted_at')
            ->selectRaw('COALESCE(AVG(DATEDIFF(a.created_at, r.submitted_at)), NULL) AS avg_days')
            ->first();

        $fulfilment = RequestItem::selectRaw(
            "COUNT(*) AS total,
             COALESCE(SUM(status IN ('ordered', 'delivered', 'verified', 'in_use')), 0) AS fulfilled,
             COALESCE(SUM(status IN ('pending_funding', 'funded') AND target_amount > 0
                AND (SELECT COALESCE(SUM(donations.amount_tzs), SUM(donations.amount), 0) FROM donations WHERE donations.item_id = request_items.id AND donations.status = 'confirmed') >= target_amount), 0) AS fully_funded_awaiting"
        )->first();

        // Queue of items that need staff attention now (drives dashboard cards).
        $attention = [
            'pending_endorsements' => (int) FundingRequest::where('status', 'endorsement_pending')->count(),
            'pending_quotes' => (int) Quote::where('status', 'pending')->count(),
            'overdue_reports' => (int) Report::where('status', 'overdue')->count(),
            'open_followups' => (int) FollowupTask::where('status', 'open')->count(),
            'drafts' => (int) FundingRequest::where('status', 'draft')->count(),
        ];

        return response()->json([
            'donors' => [
                'total' => $donorsTotal,
                'repeat' => $repeatDonors,
                'retention_rate' => $donorsTotal > 0 ? round($repeatDonors / $donorsTotal * 100, 1) : 0,
            ],
            'donations' => [
                'count' => (int) $donationStats->count,
                'avg' => (float) round($donationStats->avg, 0),
                'max' => (float) round($donationStats->max, 0),
                'total' => (float) round($donationStats->total, 0),
                'last_30d_count' => (int) $last30d->count,
                'last_30d_total' => (float) round($last30d->total, 0),
            ],
            'funding' => [
                'avg_days_to_close' => $fundingDays->avg_days !== null ? round((float) $fundingDays->avg_days, 1) : null,
            ],
            'fulfilment' => [
                'items_total' => (int) $fulfilment->total,
                'items_fulfilled' => (int) $fulfilment->fulfilled,
                'fully_funded_awaiting' => (int) $fulfilment->fully_funded_awaiting,
                'fulfilment_rate' => $fulfilment->total > 0 ? round($fulfilment->fulfilled / $fulfilment->total * 100, 1) : 0,
            ],
            'attention' => $attention,
            'charts' => [
                'trend_30d' => $this->donationTrend30d(),
                'by_status' => $this->donationByStatus(),
                'top_requests' => $this->topRequests(),
            ],
        ]);
    }

    /**
     * Confirmed donation count per day for the last 30 days (zero-filled).
     */
    private function donationTrend30d(): array
    {
        $trend = [];
        for ($i = 29; $i >= 0; $i--) {
            $trend[now()->subDays($i)->toDateString()] = 0;
        }

        $rows = DB::table('donations')
            ->where('status', 'confirmed')
            ->where('donated_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw('DATE(donated_at) AS day, COUNT(*) AS c')
            ->groupBy(DB::raw('DATE(donated_at)'))
            ->get();

        foreach ($rows as $row) {
            if (isset($trend[$row->day])) {
                $trend[$row->day] = (int) $row->c;
            }
        }

        return [
            'labels' => array_keys($trend),
            'values' => array_values($trend),
        ];
    }

    /**
     * Confirmed donation totals grouped by payment status for a donut viz.
     */
    private function donationByStatus(): array
    {
        return DB::table('donations')
            ->selectRaw('status, COUNT(*) AS count, COALESCE(SUM(COALESCE(amount_tzs, amount)), 0) AS total')
            ->groupBy('status')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => ['status' => $r->status, 'count' => (int) $r->count, 'total' => (float) round($r->total, 0)])
            ->values()
            ->toArray();
    }

    /**
     * Top request items by confirmed donations raised (drives the admin
     * funding-progress bars). Virtual `raised` computed then filtered in PHP
     * to keep the query simple and portable.
     */
    private function topRequests(): array
    {
        $items = RequestItem::with('request:id,title')
            ->withCount(['donations as raised' => function ($q) {
                $q->where('status', 'confirmed')
                    ->select(DB::raw('COALESCE(SUM(COALESCE(amount_tzs, amount)), 0)'));
            }])
            ->get()
            ->map(fn (RequestItem $item) => [
                'request_id' => $item->request_id,
                'title' => $item->request?->title ?: $item->name,
                'item_name' => $item->name,
                'target' => (float) round((float) $item->target_amount, 0),
                'raised' => (float) round($item->raised ?? 0, 0),
            ])
            ->filter(fn ($i) => $i['raised'] > 0)
            ->sortByDesc('raised')
            ->take(6)
            ->values()
            ->toArray();

        return $items;
    }

    /**
     * CSV export of admin datasets for offline reporting / accountability.
     * Only OWERU staff (admin/manager) may download these.
     */
    public function export(Request $request, string $type)
    {
        $this->authorizeStaff($request);

        if (! in_array($type, ['requests', 'donations', 'reports', 'invoices', 'board-summary'], true)) {
            abort(404, 'Unknown export type.');
        }

        $rows = match ($type) {
            'requests' => FundingRequest::with('organization', 'applicant')->orderByDesc('created_at')->get()->map(fn ($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'sw_title' => $r->sw_title,
                'status' => $r->status,
                'region' => $r->region,
                'category' => $r->category,
                'program_type' => $r->program_type,
                'exposure_level' => $r->exposure_level,
                'church' => $r->organization?->name ?: $r->church_name,
                'applicant' => $r->applicant?->name ?: $r->applicant_name,
                'applicant_phone' => $r->applicant_phone,
                'created_at' => $r->created_at?->toDateTimeString(),
            ]),
            'donations' => Donation::with('item.request')->orderByDesc('created_at')->get()->map(fn ($d) => [
                'id' => $d->id,
                'donor' => $d->donor_name ?: 'Guest',
                'item' => $d->item?->name,
                'request' => $d->item?->request?->title,
                'amount_tzs' => $d->amount_tzs ?: $d->amount,
                'method' => $d->payment_method,
                'network' => $d->network,
                'status' => $d->status,
                'payment_reference' => $d->payment_reference,
                'mpesa_receipt' => $d->mpesa_receipt,
                'donated_at' => $d->donated_at?->toDateTimeString(),
            ]),
            'reports' => Report::with('item.request')->orderByDesc('created_at')->get()->map(fn ($rp) => [
                'id' => $rp->id,
                'item' => $rp->item?->name,
                'request' => $rp->item?->request?->title,
                'type' => $rp->type,
                'status' => $rp->status,
                'submitted_at' => $rp->submitted_at?->toDateTimeString(),
                'content' => $rp->content,
            ]),
            'invoices' => \App\Models\Invoice::with('supplier', 'item.request')->orderByDesc('created_at')->get()->map(fn ($i) => [
                'id' => $i->id,
                'supplier' => $i->supplier?->name,
                'item' => $i->item?->name,
                'request' => $i->item?->request?->title,
                'amount' => $i->amount,
                'status' => $i->status,
                'payment_ref' => $i->payment_reference,
                'paid_at' => $i->paid_at?->toDateTimeString(),
            ]),
            'board-summary' => $this->boardSummary(),
        };

        $rows = collect($rows);
        $headers = $rows->isEmpty() ? [] : array_keys($rows->first());
        $csv = fopen('php://temp', 'r+');
        fputcsv($csv, $headers);

        foreach ($rows as $row) {
            fputcsv($csv, array_map(fn ($v) => is_string($v) ? mb_convert_encoding($v, 'UTF-8') : $v, $row));
        }
        rewind($csv);
        $output = stream_get_contents($csv);
        fclose($csv);

        return response($output, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="oweru-' . $type . '-' . now()->format('Ymd-His') . '.csv"',
            'Cache-Control' => 'no-store',
        ]);
    }

    public function overview()
    {
        $donations = Donation::selectRaw(
            'COUNT(*) as total_count,
            COALESCE(SUM(status = ?), 0) as confirmed_count,
            COALESCE(SUM(status = ? AND is_guest = 1), 0) as guest_count,
            COALESCE(SUM(COALESCE(amount_tzs, amount) * (status = ?)), 0) as confirmed_total'
        )->setBindings(['confirmed', 'confirmed', 'confirmed'])->first();

        $requests = FundingRequest::selectRaw(
            'COUNT(*) as total,
            COALESCE(SUM(status = ?), 0) as published,
            COALESCE(SUM(status IN (?, ?, ?, ?)), 0) as active,
            COALESCE(SUM(status = ?), 0) as approved'
        )->setBindings(['published', 'funding_closed', 'procurement', 'delivered', 'active_reporting', 'approved'])->first();

        $items = RequestItem::selectRaw(
            'COUNT(*) as total,
            COALESCE(SUM(IF(target_amount > 0 AND (SELECT COALESCE(SUM(COALESCE(amount_tzs, amount)), 0)
                FROM donations WHERE donations.item_id = request_items.id AND donations.status = ?) >= target_amount, 1, 0)), 0) as fully_funded'
        )->setBindings(['confirmed'])->first();

        $suppliers = Supplier::selectRaw(
            'COUNT(*) as total,
            COALESCE(SUM(verification_status = ?), 0) as verified'
        )->setBindings(['verified'])->first();

        $equipment = Equipment::selectRaw(
            'COUNT(*) as total,
            COALESCE(SUM(status = ?), 0) as in_use,
            COALESCE(SUM(status = ?), 0) as delivered,
            COALESCE(SUM(status = ?), 0) as verified'
        )->setBindings(['in_use', 'delivered', 'verified'])->first();

        return response()->json([
            'requests' => [
                'total' => (int) $requests->total,
                'published' => (int) $requests->published,
                'active' => (int) $requests->active,
                'approved' => (int) $requests->approved,
            ],
            'items' => [
                'total' => (int) $items->total,
                'fully_funded' => (int) $items->fully_funded,
            ],
            'donations' => [
                'count' => (int) $donations->confirmed_count,
                'guest_count' => (int) $donations->guest_count,
                'total' => (float) $donations->confirmed_total,
            ],
            'suppliers' => [
                'total' => (int) $suppliers->total,
                'verified' => (int) $suppliers->verified,
            ],
            'equipment' => [
                'total' => (int) $equipment->total,
                'in_use' => (int) $equipment->in_use,
                'delivered' => (int) $equipment->delivered,
                'verified' => (int) $equipment->verified,
            ],
        ]);
    }

    public function auditLogs(Request $request)
    {
        $query = AuditLog::with('user')->orderByDesc('created_at');

        return response()->json($query->paginate($request->per_page ?? 50));
    }

    /**
     * Board-facing summary rows (SRS §25): a single accountability sheet the
     * Board can open as CSV during a review meeting.
     */
    private function boardSummary(): array
    {
        $confirmed = DB::table('donations')->where('status', 'confirmed');
        $totalRaised = (float) round((clone $confirmed)->selectRaw('COALESCE(SUM(COALESCE(amount_tzs, amount)), 0) AS t')->value('t'), 0);
        $donationCount = (int) (clone $confirmed)->count();

        $last30 = DB::table('donations')->where('status', 'confirmed')
            ->where('donated_at', '>=', now()->subDays(30))
            ->selectRaw('COUNT(*) AS c, COALESCE(SUM(COALESCE(amount_tzs, amount)), 0) AS t')
            ->first();

        $statusCounts = FundingRequest::selectRaw('status, COUNT(*) AS c')
            ->groupBy('status')->get()->pluck('c', 'status');

        $fulfilment = RequestItem::selectRaw(
            "COUNT(*) AS total,
             COALESCE(SUM(status IN ('ordered', 'delivered', 'verified', 'in_use')), 0) AS fulfilled"
        )->first();

        $donorKey = "COALESCE(IF(donor_id IS NOT NULL, CONCAT('u', donor_id), NULL), IF(mpesa_phone IS NOT NULL AND mpesa_phone != '', CONCAT('p', mpesa_phone), CONCAT('n', COALESCE(donor_name, 'anon'))))";
        $donorsTotal = (int) DB::table('donations')->where('status', 'confirmed')->distinct()
            ->selectRaw(DB::raw("COUNT(DISTINCT {$donorKey}) AS t"))->value('t');

        $rows = [
            ['metric' => 'Report generated', 'value' => now()->format('Y-m-d H:i'), 'note' => ''],
            ['metric' => 'Confirmed donations', 'value' => $donationCount, 'note' => ''],
            ['metric' => 'Total raised (TZS)', 'value' => $totalRaised, 'note' => 'confirmed only'],
            ['metric' => 'Donations last 30 days', 'value' => (int) $last30->c, 'note' => 'total: '.round((float) $last30->t)],
            ['metric' => 'Unique donors (est.)', 'value' => $donorsTotal, 'note' => ''],
            ['metric' => 'Average donation (TZS)', 'value' => $donationCount > 0 ? (int) round($totalRaised / $donationCount) : 0, 'note' => ''],
            ['metric' => 'Items requested', 'value' => (int) $fulfilment->total, 'note' => ''],
            ['metric' => 'Items fulfilled', 'value' => (int) $fulfilment->fulfilled, 'note' => (int) $fulfilment->total > 0 ? round($fulfilment->fulfilled / $fulfilment->total * 100, 1).'%' : ''],
        ];

        foreach (['published', 'funding_closed', 'approved', 'endorsement_pending', 'under_review', 'submitted'] as $st) {
            if (($statusCounts[$st] ?? 0) > 0) {
                $rows[] = ['metric' => 'Requests: '.str_replace('_', ' ', $st), 'value' => (int) ($statusCounts[$st] ?? 0), 'note' => ''];
            }
        }

        $rows[] = ['metric' => 'Pending supplier quotes', 'value' => (int) Quote::where('status', 'pending')->count(), 'note' => ''];
        $rows[] = ['metric' => 'Overdue reports', 'value' => (int) Report::where('status', 'overdue')->count(), 'note' => ''];
        $rows[] = ['metric' => 'Open follow-up tasks', 'value' => (int) FollowupTask::where('status', 'open')->count(), 'note' => ''];

        return $rows;
    }
}
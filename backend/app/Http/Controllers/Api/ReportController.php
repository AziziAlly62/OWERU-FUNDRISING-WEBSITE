<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\Equipment;
use App\Models\FundingRequest;
use App\Models\Report;
use App\Support\DeliveryConfirmationService;
use App\Support\MediaStore;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Public, browsable impact stories. Returns submitted, acknowledged, or
     * completed reports with the organisation and region - never personal
     * contact details, per the exposure rules in the operating document.
     */
    public function publicIndex(Request $request)
    {
        $query = Report::with(['item.request.organization'])
            ->whereIn('status', ['submitted', 'acknowledged', 'completed'])
            ->whereNotNull('content')
            ->where('content', '!=', '');

        $reports = $query->orderByDesc('submitted_at')->get()->map(function ($report) {
            $req = $report->item?->request;
            $publicEvidence = $this->hasPublicImage($report);
            return [
                'id' => $report->id,
                'type' => $report->type,
                'content' => $report->content,
                'submitted_at' => $report->submitted_at,
                'public_evidence' => $publicEvidence,
                'public_evidence_url' => $publicEvidence ? '/reports/' . $report->id . '/public-evidence' : null,
                'item' => $report->item?->name,
                'sw_item' => $report->item?->sw_name,
                'sw_item' => $report->item?->sw_name,
                'region' => $req?->region,
                'church' => $req?->organization?->name ?: $req?->church_name,
                'category' => $req?->category,
            ];
        });

        return response()->json($reports);
    }

    public function publicEvidence(Report $report)
    {
        if (! in_array($report->status, ['submitted', 'acknowledged', 'completed'], true) || ! $this->hasPublicImage($report)) {
            abort(404, 'Public evidence not found.');
        }

        return MediaStore::servePublicImage($report->evidence_path);
    }

    public function index(Request $request)
    {
        Report::markOverdue();

        $user = $request->user();

        $query = Report::with('item.request', 'recipient')
            ->when($request->item_id, fn ($q) => $q->where('item_id', $request->item_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status));

        if ($user->role === 'applicant' && ! $request->has('all')) {
            $query->where(function ($q) use ($user) {
                $q->where('recipient_id', $user->id)
                  ->orWhereHas('item.request', fn ($q) => $q->where('applicant_id', $user->id));
            });
        }

        $reports = $query->orderByDesc('created_at')->paginate($request->per_page ?? 20);
        $reports->getCollection()->each(function (Report $report) {
            $report->setAttribute('evidence_is_image', MediaStore::isPublicImage($report->evidence_path));
        });

        return response()->json($reports);
    }

    public function store(Request $request)
    {
        if (! in_array($request->user()->role, ['applicant', 'admin', 'manager'], true)) {
            abort(403, 'Only applicants or OWERU staff can submit reports');
        }

        $request->validate([
            'item_id' => 'required|exists:request_items,id',
            'type' => 'required|in:delivery,30_day,90_day,incident',
            'due_date' => 'nullable|date',
            'content' => 'nullable|string',
            'evidence' => 'nullable|string',
        ]);

        $evidencePath = $request->filled('evidence') && $request->evidence
            ? MediaStore::fromBase64($request->evidence, 'reports')
            : null;

        $report = Report::create([
            'item_id' => $request->item_id,
            'recipient_id' => $request->user()->id,
            'type' => $request->type,
            'due_date' => $request->due_date,
            'submitted_at' => now(),
            'status' => 'submitted',
            'content' => $request->content,
            'evidence_path' => $evidencePath,
        ]);

        \App\Models\AuditLog::record('report.submitted', 'Report', $report->id, null, $report->toArray());

        // A delivery confirmation from the applicant verifies the received equipment
        // and moves the parent request into the active reporting phase.
        if ($request->type === 'delivery') {
            $this->onDeliveryConfirmed($report);
        }

        return response()->json($report->load('item', 'recipient'), 201);
    }

    protected function onDeliveryConfirmed(Report $report)
    {
        $equipment = Equipment::where('item_id', $report->item_id)->first();
        if ($equipment) {
            DeliveryConfirmationService::record($equipment, 'recipient', $report->recipient_id, $report->content);
        }

        $request = $report->item?->request;
        if (! $request || $request->status !== 'delivered') {
            return;
        }

        $pending = $request->items()
            ->where(function ($q) {
                $q->whereDoesntHave('equipment')
                    ->whereNotIn('status', ['ordered', 'delivered', 'verified', 'in_use'])
                    ->orWhereHas('equipment', fn ($eq) => $eq->where('status', '!=', 'verified'));
            })
            ->count();

        if ($pending > 0) {
            return;
        }

        $request->update(['status' => 'active_reporting']);

        AuditLog::record('request.status_changed', 'FundingRequest', $request->id, 'delivered', 'active_reporting');

        if ($request->applicant_id) {
            AppNotification::create([
                'user_id' => $request->applicant_id,
                'type' => 'request.status',
                'title' => 'Reporting phase started',
                'body' => 'Your request "' . $request->title . '" is now in the active reporting phase. Please submit your 30/90-day reports.',
                'url' => '/track/' . $request->track_token,
            ]);
        }
    }

    public function getEvidence(Request $request, Report $report)
    {
        $user = $request->user();

        $canView = in_array($user->role, ['admin', 'manager'], true)
            || $report->recipient_id === $user->id
            || (bool) \App\Models\FundingRequest::where('id', $report->item?->request_id)
                ->where('applicant_id', $user->id)->exists();

        if (! $canView) {
            abort(403, 'Not allowed to view this evidence.');
        }

        return MediaStore::serve($report->evidence_path, 'report-' . $report->id . '-' . $report->type . '.bin');
    }

    public function update(Request $request, Report $report)
    {
        $this->authorizeStaff($request);

        $request->validate([
            'type' => 'nullable|in:delivery,30_day,90_day,incident',
            'due_date' => 'nullable|date',
            'content' => 'nullable|string',
            'status' => 'nullable|in:submitted,acknowledged,in_review,completed,overdue',
            'public_evidence' => 'sometimes|boolean',
        ]);

        $changes = array_filter([
            'type' => $request->type ?? null,
            'due_date' => $request->due_date ?? null,
            'content' => $request->content ?? null,
            'status' => $request->status ?? null,
        ], fn ($v) => $v !== null);

        if ($request->has('public_evidence')) {
            $approved = $request->boolean('public_evidence');
            if ($approved && ! MediaStore::isPublicImage($report->evidence_path)) {
                return response()->json([
                    'message' => 'Only an attached JPG, PNG, or WebP image can be approved for public display.',
                    'errors' => ['public_evidence' => ['Attach a supported image before approving public evidence.']],
                ], 422);
            }

            $changes['public_evidence'] = $approved;
            $changes['evidence_approved_by'] = $approved ? $request->user()->id : null;
            $changes['evidence_approved_at'] = $approved ? now() : null;
        }

        $report->update($changes);

        \App\Models\AuditLog::record('report.updated', 'Report', $report->id, null, $report->toArray());

        return response()->json($report->load('item', 'recipient'));
    }

    public function destroy(Request $request, Report $report)
    {
        $this->authorizeStaff($request);

        $id = $report->id;
        $report->delete();

        \App\Models\AuditLog::record('report.deleted', 'Report', $id);

        return response()->json(['message' => 'Report deleted']);
    }

    private function hasPublicImage(Report $report): bool
    {
        return $report->public_evidence
            && $report->evidence_approved_by
            && $report->evidence_approved_at
            && MediaStore::isPublicImage($report->evidence_path);
    }
}

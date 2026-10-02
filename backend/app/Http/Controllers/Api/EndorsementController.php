<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\Endorsement;
use App\Models\FundingRequest;
use Illuminate\Http\Request;

class EndorsementController extends Controller
{
    /**
     * Church confirmation. A registered church (endorser user of the request's
     * church organization) vouches for the applicant; staff may also record one.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'request_id' => 'required|exists:requests,id',
            'notes' => 'nullable|string|max:2000',
        ]);

        $fundingRequest = FundingRequest::with('organization')->findOrFail($request->request_id);

        if ($user->role === 'endorser') {
            if (! $fundingRequest->organization_id || $user->organization_id !== $fundingRequest->organization_id) {
                abort(403, 'Your church is not listed as the support organization for this request.');
            }
            $organization = $fundingRequest->organization;
            if ($organization && $organization->verification_status !== 'verified') {
                abort(403, 'Your church has not been verified by OWERU yet. You can confirm requests once it is approved.');
            }
            $organizationId = $user->organization_id;
            $endorserName = $user->name;
        } elseif (in_array($user->role, ['admin', 'manager'], true)) {
            $organizationId = $request->input('organization_id')
                ?? $fundingRequest->organization_id
                ?? null;
            $endorserName = $request->input('endorser_name', $user->name);
        } else {
            abort(403, 'Only churches or OWERU staff can confirm requests.');
        }

        if (! $organizationId) {
            abort(422, 'No church organization is linked to this request. Assign one before confirming.');
        }

        // Staff cannot bypass the church approval gate: confirmations for a
        // church that has not been approved by OWERU are blocked for everyone.
        $targetOrg = \App\Models\Organization::find($organizationId);
        if ($targetOrg && $targetOrg->type === 'church' && $targetOrg->verification_status !== 'verified') {
            abort(403, 'This church has not been approved by OWERU yet. Approve it before recording a confirmation.');
        }

        $existing = Endorsement::where('request_id', $fundingRequest->id)
            ->where('organization_id', $organizationId)
            ->whereIn('status', ['pending', 'complete'])
            ->first();

        if ($existing) {
            if ($existing->status === 'complete' && ! in_array($user->role, ['admin', 'manager'], true)) {
                abort(422, 'This church has already confirmed this request.');
            }

            $organizationId = $existing->organization_id;
            $endorserName = $existing->endorser_name;
        }

        $recordedByStaff = in_array($user->role, ['admin', 'manager'], true);
        $notes = $request->input('notes');
        if ($recordedByStaff) {
            $notes = trim(($notes ? $notes . ' ' : '') . '(Recorded by OWERU staff: ' . $user->name . '.)');
        }

        $endorsement = Endorsement::firstOrCreate(
            ['request_id' => $fundingRequest->id, 'organization_id' => $organizationId],
            [
                'endorser_name' => $endorserName,
                'status' => 'pending',
                'notes' => $notes,
            ]
        );

        if ($endorsement->wasRecentlyCreated) {
            AuditLog::record('endorsement.created', 'Endorsement', $endorsement->id, null, $endorsement->toArray());

            if ($fundingRequest->applicant_id) {
                AppNotification::create([
                    'user_id' => $fundingRequest->applicant_id,
                    'type' => 'endorsement.pending',
                    'title' => 'Church confirmation pending',
                    'body' => 'Your church has been asked to confirm your request "' . $fundingRequest->title . '".',
                    'url' => null,
                ]);
            }
        }

        return response()->json($endorsement->load('organization', 'request'), 201);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $query = Endorsement::with('request.applicant', 'organization');

        if ($user->role === 'endorser') {
            $query->where('organization_id', $user->organization_id);
        } elseif (! in_array($user->role, ['admin', 'manager'], true)) {
            abort(403, 'You cannot view church confirmations.');
        }

        return response()->json($query->orderByDesc('created_at')->paginate($request->per_page ?? 20));
    }

    /**
     * The church answers the confirmation request: complete or declined.
     */
    public function respond(Request $request, Endorsement $endorsement)
    {
        $user = $request->user();

        if (! in_array($user->role, ['admin', 'manager'], true)) {
            if ($endorsement->status !== 'pending') {
                abort(422, 'This confirmation has already been answered.');
            }
            if ($user->organization_id !== $endorsement->organization_id) {
                abort(403, 'You cannot answer a confirmation for another church.');
            }
            $org = $endorsement->organization;
            if ($org && $org->verification_status !== 'verified') {
                abort(403, 'Your church has not been verified by OWERU yet. You can answer confirmations once it is approved.');
            }
        }

        $request->validate([
            'status' => 'required|in:complete,declined',
            'notes' => 'nullable|string|max:2000',
        ]);

        $old = $endorsement->status;

        $endorsement->update([
            'status' => $request->status,
            'endorsed_date' => $request->status === 'complete' ? now() : $endorsement->endorsed_date,
            'notes' => $request->input('notes') ?? $endorsement->notes,
        ]);

        AuditLog::record('endorsement.updated', 'Endorsement', $endorsement->id, $old, $request->status);

        $fundingRequest = $endorsement->request;
        if ($request->status === 'complete' && $fundingRequest) {
            // FR-04: a completed endorsement moves a waiting request into
            // staff review (it may only be approved once it clears review).
            if ($fundingRequest->status === 'endorsement_pending') {
                $oldStatus = $fundingRequest->status;
                $fundingRequest->update([
                    'status' => 'submitted',
                    'submitted_at' => $fundingRequest->submitted_at ?? now(),
                ]);
                AuditLog::record('request.status_changed', 'FundingRequest', $fundingRequest->id, $oldStatus, 'submitted');
            }

            if ($fundingRequest->applicant_id) {
                AppNotification::create([
                    'user_id' => $fundingRequest->applicant_id,
                    'type' => 'endorsement.complete',
                    'title' => 'Church confirmed your request',
                    'body' => 'The church confirmed "' . $fundingRequest->title . '". Your request can now move to the Board for review.',
                    'url' => null,
                ]);
            }
        }

        return response()->json($endorsement->load('organization', 'request'));
    }
}
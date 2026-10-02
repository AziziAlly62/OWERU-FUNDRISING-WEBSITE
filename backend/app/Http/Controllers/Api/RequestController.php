<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\Endorsement;
use App\Models\FundingRequest;
use App\Models\RequestItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RequestController extends Controller
{
    public function storeLetter(Request $request)
    {
        if (! in_array($request->user()->role, ['admin', 'manager'], true)) {
            abort(403, 'Only staff can upload letters');
        }

        $request->validate([
            'data' => 'required|string',
            'name' => 'nullable|string|max:255',
        ]);

        $raw = $request->input('data');
        if (preg_match('/^data:([a-zA-Z0-9.+\-\/]+);base64,(.+)$/', $raw, $m)) {
            $mime = $m[1];
            $contents = base64_decode($m[2], true);
        } else {
            $contents = base64_decode($raw, true);
            $mime = null;
        }

        if ($contents === false || strlen($contents) > 8 * 1024 * 1024) {
            abort(422, 'Invalid or too large file (max 8MB).');
        }

        $allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if ($mime && ! in_array($mime, $allowed, true)) {
            abort(422, 'Only PDF or image files (JPG/PNG/WebP) are allowed.');
        }

        $ext = 'pdf';
        foreach (['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'] as $k => $v) {
            if ($mime === $k) { $ext = $v; break; }
        }

        $name = 'letter-' . now()->format('YmdHis') . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
        Storage::disk('public')->put('letters/' . $name, $contents);

        return response()->json([
            'letter_path' => 'letters/' . $name,
        ]);
    }

    public function viewLetter(Request $request, FundingRequest $requestItem)
    {
        if (! $requestItem->letter_path || ! Storage::disk('public')->exists($requestItem->letter_path)) {
            abort(404, 'Letter not found');
        }

        // SRS §22: uploaded documents are access-controlled and never public.
        // Access is limited to OWERU staff, the request's applicant, or the
        // possession holder of the private tracking token (guest applicants).
        $user = auth('sanctum')->user();

        if ($user && in_array($user->role, ['admin', 'manager'], true)) {
            // staff
        } elseif ($user && $user->role === 'applicant' && $user->id === $requestItem->applicant_id) {
            // owner
        } elseif ($user && $user->role === 'endorser' && $user->organization_id === $requestItem->organization_id) {
            // supporting church
        } elseif ($requestItem->track_token && $request->filled('token')
            && hash_equals((string) $requestItem->track_token, (string) $request->token)) {
            // guest applicant holding their private tracking link
        } else {
            abort(403, 'You are not allowed to view this letter.');
        }

        $mime = Storage::disk('public')->mimeType($requestItem->letter_path);
        return response(Storage::disk('public')->get($requestItem->letter_path), 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="letter-' . $requestItem->id . '"',
        ]);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $query = FundingRequest::with('applicant.verification', 'organization', 'items.donations', 'endorsements.organization', 'boardReviewer')
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->exposure, fn ($q) => $q->where('exposure_level', $request->exposure))
            ->when($request->category, fn ($q) => $q->where('category', $request->category))
            ->when($request->program, fn ($q) => $q->where('program_type', $request->program))
            ->when($request->region, fn ($q) => $q->where('region', $request->region))
            ->when($request->q, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->q}%")
                  ->orWhere('sw_title', 'like', "%{$request->q}%")
                  ->orWhere('story', 'like', "%{$request->q}%");
            }));

        if (in_array($user->role, ['admin', 'manager'], true)) {
            // all
        } elseif ($user->role === 'endorser') {
            $query->where('organization_id', $user->organization_id);
        } else {
            $query->whereRaw('1 = 0');
        }

        $page = $query->orderByDesc('created_at')->paginate($request->per_page ?? 20);
        $page->getCollection()->each(function ($r) {
            $r->items->each(function ($item) {
                $item->setAttribute('amount_raised', $item->raisedAmount());
            });
        });

        return response()->json($page);
    }

    /**
     * OWERU Board review queue: requests that have reached the Board stage.
     */
    public function reviewQueue(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role, ['admin', 'manager', 'reviewer'], true)) {
            abort(403, 'Only the OWERU Board and staff can view the review queue.');
        }

        $query = FundingRequest::with('applicant.verification', 'organization', 'items', 'endorsements.organization', 'boardReviewer')
            ->whereIn('status', ['submitted', 'under_review', 'more_info_needed']);

        $rows = $query->orderByDesc(
            \DB::raw('COALESCE(updated_at, created_at)')
        )->paginate($request->per_page ?? 50);

        $rows->getCollection()->transform(function ($r) {
            $verifiedApplicant = $r->applicant && $r->applicant->verification?->status === 'verified';
            $churchConfirmed = $r->endorsements()->where('status', 'complete')->exists();
            $r->setAttribute('verified_applicant', $verifiedApplicant);
            $r->setAttribute('church_confirmed', $churchConfirmed);
            $r->setAttribute('trust_anchors', array_values(array_filter([
                $r->board_approved ? 'board' : null,
                $verifiedApplicant ? 'verified_applicant' : null,
                $churchConfirmed ? 'church_confirmed' : null,
            ])));
            return $r;
        });

        return response()->json($rows);
    }

    /**
     * The final Board decision (Board/reviewer role only). A Board approval is
     * itself the decision that clears a request for publishing — no further
     * trust anchor is required.
     */
    public function boardDecision(Request $request, FundingRequest $requestItem)
    {
        $request->validate([
            'status' => 'required|string|in:approved,declined,more_info_needed',
            'decision_note' => 'nullable|string|max:3000',
        ]);

        $current = $requestItem->status;
        if (! in_array($current, ['submitted', 'under_review', 'more_info_needed'], true)) {
            abort(422, "This request is not in the Board review queue (current status: {$current}).");
        }

        if ($request->status === $current) {
            abort(422, 'No change requested.');
        }

        $requestItem->update([
            'status' => $request->status,
            'decision_note' => $request->input('decision_note') ?? $requestItem->decision_note,
        ]);

        if ($request->status === 'approved') {
            $requestItem->update([
                'board_approved' => true,
                'board_reviewed_at' => now(),
                'board_reviewed_by' => $request->user()->id,
            ]);
        }

        AuditLog::record('request.board_decision', 'FundingRequest', $requestItem->id, $current, $request->status);

        if ($requestItem->applicant_id) {
            $detail = ($request->status === 'declined' && $requestItem->decision_note)
                ? ' Reason: ' . $requestItem->decision_note
                : '';
            AppNotification::create([
                'user_id' => $requestItem->applicant_id,
                'type' => 'request.board',
                'title' => 'Board decision on your request',
                'body' => 'The Board ' . str_replace('_', ' ', $request->status) . ' your request "' . $requestItem->title . '".' . $detail,
                'url' => '/track/' . $requestItem->track_token,
            ]);
        }

        return response()->json($requestItem->load('applicant.verification', 'organization', 'items', 'endorsements.organization', 'boardReviewer'));
    }

    public function getItems(Request $request)
    {
        $this->authorizeStaff($request);

        $items = RequestItem::with('request.applicant', 'request.organization')
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 100);

        $items->getCollection()->transform(function ($item) {
            $item->setAttribute('amount_raised', $item->raisedAmount());
            return $item;
        });

        return response()->json($items);
    }

    public function featured(Request $request)
    {
        $this->closeExpiredFunding();

        $query = FundingRequest::with('organization', 'items.donations')
            ->whereIn('status', ['published', 'funding_closed', 'procurement', 'delivered', 'active_reporting'])
            ->where(fn ($q) => $q->whereNull('exposure_level')->orWhere('exposure_level', '!=', 'protected'))
            ->orderByRaw("FIELD(status, 'published', 'funding_closed', 'procurement', 'delivered', 'active_reporting')")
            ->orderByDesc('created_at');

        return response()->json(
            $query->paginate($request->per_page ?? 6)->through(fn ($r) => $this->privacyScrub($r))
        );
    }

    public function published(Request $request)
    {
        $this->closeExpiredFunding();

        $query = FundingRequest::with('organization', 'items.donations')
            ->where('status', 'published')
            ->where(fn ($q) => $q->whereNull('exposure_level')->orWhere('exposure_level', '!=', 'protected'))
            ->when($request->category, fn ($q) => $q->where('category', $request->category))
            ->when($request->program, fn ($q) => $q->where('program_type', $request->program))
            ->when($request->region, fn ($q) => $q->where('region', $request->region))
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('sw_title', 'like', "%{$request->search}%");
            }))
            ->orderByDesc('created_at');

        return response()->json(
            $query->paginate($request->per_page ?? 20)->through(fn ($r) => $this->privacyScrub($r))
        );
    }

    public function show(Request $request, FundingRequest $requestItem)
    {
        $this->closeExpiredFunding();

        $user = auth('sanctum')->user();

        $with = ['organization', 'items.donations', 'endorsements.organization', 'comments.author'];
        if ($user && in_array($user->role, ['admin', 'manager'], true)) {
            $with[] = 'items.invoices';
        }
        $requestItem->load($with);

        $exposure = $requestItem->exposure_level ?? 'open';

        if ($exposure === 'protected') {
            if (! $user) {
                abort(401, 'This request requires authentication');
            }
            if ($user->role === 'applicant'
                && $user->id !== $requestItem->applicant_id
                && $user->organization_id !== $requestItem->organization_id) {
                abort(403, 'This request is restricted');
            }
        }

        if ($user && in_array($user->role, ['admin', 'manager'], true)) {
            return response()->json($requestItem);
        }

        return response()->json($this->privacyScrub($requestItem));
    }

    /**
     * Remove personal/contact data before a request is sent to any
     * non-staff viewer, per the exposure rules in the operating document:
     *   - phone, email and the applicant record are NEVER shown publicly;
     *   - the personal name appears in full only for "open" exposure,
     *     as a first name for "partial", and never for "protected";
     *   - payment/internal fields on donations are never exposed.
     */
    protected function privacyScrub(FundingRequest $requestItem)
    {
        $exposure = $requestItem->exposure_level ?? 'open';

        $requestItem->setHidden(array_merge($requestItem->getHidden(), [
            'applicant', 'applicant_id', 'applicant_phone', 'applicant_email', 'boardReviewer',
            'letter_path', 'letter_status', 'letter_notes',
        ]));

        if ($exposure === 'protected') {
            $requestItem->setHidden(array_merge($requestItem->getHidden(), ['applicant_name']));
        } elseif ($exposure === 'partial' && $requestItem->applicant_name) {
            $requestItem->setAttribute(
                'applicant_name',
                preg_split('/\s+/', trim($requestItem->applicant_name))[0]
            );
        }

        $requestItem->items->each(function ($item) {
            $item->setHidden(array_merge($item->getHidden(), ['invoices']));

            if ($item->relationLoaded('donations')) {
                $item->donations->each(function ($donation) {
                    $donation->setHidden(array_merge($donation->getHidden(), [
                        'mpesa_phone', 'card_last4', 'card_brand',
                        'mpesa_checkout_request_id', 'mpesa_merchant_request_id',
                    ]));
                });
            }
        });

        return $requestItem;
    }

    /**
     * Create a funding request. Guests may apply phone-only (no permanent
     * account); the church confirmation (endorsement) is their trust anchor.
     */
    public function store(Request $request)
    {
        $user = auth('sanctum')->user();
        $isGuest = ! $user;

        if ($isGuest) {
            $request->validate([
                'applicant_name' => 'required|string|max:255',
                'applicant_phone' => 'required|string|max:20',
            ]);
        } elseif (! in_array($user->role, ['admin', 'manager', 'applicant'], true)) {
            abort(403, 'Only applicants and staff can submit funding requests');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'sw_title' => 'nullable|string|max:255',
            'story' => 'nullable|string',
            'sw_story' => 'nullable|string',
            'region' => 'nullable|string|max:255',
            'church_name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'program_type' => 'nullable|in:general,church_equipment,orphan_support,charity,transport',
            'exposure_level' => 'nullable|in:open,partial,protected',
            'letter_path' => 'nullable|string|max:255',
            'letter' => 'nullable|string',
            'organization_id' => 'nullable|exists:organizations,id',
            'applicant_phone' => 'sometimes|nullable|string|max:20',
            'applicant_email' => 'nullable|email|max:255',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.category' => 'nullable|string|max:255',
            'items.*.item_kind' => 'nullable|in:item,transport_option',
            'items.*.target_amount' => 'required|numeric|min:0',
            'items.*.funding_deadline' => 'nullable|date',
        ]);

        $trackToken = 'trk_' . bin2hex(random_bytes(16));

        $letterPath = $request->input('letter_path');
        if (! $letterPath && $request->filled('letter') && $request->letter) {
            $letterPath = \App\Support\MediaStore::fromBase64($request->letter, 'letters');
        }

        // A request paired with a church organisation enters the "endorsement
        // pending" state until the church confirms it (FR-04). Requests without
        // a church anchor go straight to "submitted" for staff review.
        $churchLinked = false;
        if ($request->organization_id) {
            $org = \App\Models\Organization::find($request->organization_id);
            $churchLinked = $org && $org->type === 'church';
        }
        $status = $churchLinked ? 'endorsement_pending' : 'submitted';

        $fundingRequest = FundingRequest::create([
            'applicant_id' => $isGuest ? null : $user->id,
            'organization_id' => $request->organization_id
                ?? ($user ? $user->organization_id : null)
                ?? null,
            'applicant_name' => $isGuest ? $request->applicant_name : $user->name,
            'applicant_phone' => $isGuest
                ? $request->applicant_phone
                : ($request->filled('applicant_phone') ? $request->applicant_phone : ($user->verification?->phone ?? null)),
            'applicant_email' => $isGuest
                ? ($request->applicant_email ?: null)
                : ($request->filled('applicant_email') ? $request->applicant_email : $user->email),
            'title' => $request->title,
            'sw_title' => $request->sw_title,
            'story' => $request->story,
            'sw_story' => $request->sw_story,
            'region' => $request->region,
            'church_name' => $request->church_name,
            'category' => $request->category,
            'program_type' => $request->program_type ?? 'general',
            'exposure_level' => $request->exposure_level ?? 'open',
            'letter_path' => $letterPath,
            'letter_status' => $letterPath ? 'pending' : 'missing',
            'status' => $status,
            'track_token' => $trackToken,
        ]);

        foreach ($request->items as $item) {
            RequestItem::create([
                'request_id' => $fundingRequest->id,
                'name' => $item['name'],
                'description' => $item['description'] ?? null,
                'category' => $item['category'] ?? null,
                'item_kind' => $item['item_kind'] ?? 'item',
                'target_amount' => $item['target_amount'],
                'share_price' => RequestItem::defaultSharePrice($item['target_amount']),
                'funding_deadline' => $item['funding_deadline'] ?? now()->addDays(60)->toDateString(),
                'status' => 'pending_funding',
            ]);
        }

        AuditLog::record('request.created', 'FundingRequest', $fundingRequest->id, null, $fundingRequest->toArray());

        // Ask the linked church to confirm the new request (idempotent; the
        // public /apply and applicant portal forms pass organization_id).
        Endorsement::askChurch($fundingRequest);

        return response()->json($fundingRequest->load('items', 'endorsements')->makeVisible('track_token'), 201);
    }

    /**
     * Public, token-based status page for a guest applicant. The person who
     * submitted the request keeps this private link to follow its approval.
     */
    public function track(Request $request, string $trackToken)
    {
        $this->closeExpiredFunding();

        $fundingRequest = FundingRequest::with('organization', 'items.donations', 'endorsements.organization')
            ->where('track_token', $trackToken)
            ->first();

        if (! $fundingRequest) {
            abort(404, 'Tracking link not found. Check the link or contact OWERU.');
        }

        $fundingRequest->items->each(function ($item) {
            $item->setAttribute('amount_raised', $item->raisedAmount());
        });

        return response()->json(
            $this->privacyScrub($fundingRequest)->setHidden(array_merge($fundingRequest->getHidden(), ['track_token']))
        );
    }

    /**
     * Link a guest request to an authenticated account (closes the "guest
     * applicant has no account/notifications" gap). The caller must prove
     * possession of the private tracking token they received on submit.
     */
    public function claim(Request $request, FundingRequest $requestItem)
    {
        $user = $request->user();

        $request->validate([
            'track_token' => 'required|string',
        ]);

        abort_unless(
            hash_equals((string) $requestItem->track_token, (string) $request->track_token),
            403,
            'Tracking token does not match this request.'
        );

        if ($requestItem->applicant_id && $requestItem->applicant_id !== $user->id) {
            abort(409, 'This request is already linked to another account.');
        }

        $requestItem->applicant_id = $user->id;
        $requestItem->save();

        AuditLog::record('request.claimed', 'FundingRequest', $requestItem->id, null, ['applicant_id' => $user->id]);

        return response()->json($requestItem->load('items', 'endorsements'));
    }

    /**
     * Applicant portal: the signed-in applicant sees their own requests
     * (including pre-publication status) with items and endorsements.
     */
    public function mine(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'applicant') {
            abort(403, 'Applicant portal only.');
        }

        $query = FundingRequest::with('organization', 'items.donations', 'endorsements.organization', 'applicant.verification')
            ->where('applicant_id', $user->id)
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function update(Request $request, FundingRequest $requestItem)
    {
        $this->authorizeStaff($request);

        $request->validate([
            'title' => 'nullable|string|max:255',
            'sw_title' => 'nullable|string|max:255',
            'story' => 'nullable|string',
            'sw_story' => 'nullable|string',
            'region' => 'nullable|string|max:255',
            'church_name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'program_type' => 'nullable|in:general,church_equipment,orphan_support,charity,transport',
            'exposure_level' => 'nullable|in:open,partial,protected',
            'letter_status' => 'nullable|in:missing,pending,approved,rejected',
            'applicant_name' => 'nullable|string|max:255',
            'applicant_phone' => 'nullable|string|max:20',
        ]);

        $requestItem->update(array_filter($request->only([
            'title', 'sw_title', 'story', 'sw_story', 'region', 'church_name', 'category', 'program_type', 'exposure_level', 'letter_status', 'applicant_name', 'applicant_phone',
        ]), fn ($v) => $v !== null));

        AuditLog::record('request.updated', 'FundingRequest', $requestItem->id, null, $requestItem->toArray());

        return response()->json($requestItem->load('items'));
    }

    public function destroy(Request $request, FundingRequest $requestItem)
    {
        $this->authorizeStaff($request);

        $itemIds = $requestItem->items()->pluck('id');
        \App\Models\FundTransaction::whereIn('item_id', $itemIds)->delete();
        \App\Models\Donation::whereIn('item_id', $itemIds)->delete();
        \App\Models\Invoice::whereIn('item_id', $itemIds)->delete();
        \App\Models\Equipment::whereIn('item_id', $itemIds)->delete();
        \App\Models\Report::whereIn('item_id', $itemIds)->delete();
        \App\Models\Endorsement::where('request_id', $requestItem->id)->delete();

        $id = $requestItem->id;
        $requestItem->delete();

        AuditLog::record('request.deleted', 'FundingRequest', $id);

        return response()->json(['message' => 'Request deleted']);
    }

    public function updateItem(Request $request, RequestItem $item)
    {
        $this->authorizeStaff($request);

        $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:255',
            'item_kind' => 'nullable|in:item,transport_option',
            'target_amount' => 'nullable|numeric|min:0',
            'funding_deadline' => 'nullable|date',
        ]);

        $item->update(array_filter($request->only([
            'name', 'description', 'category', 'item_kind', 'target_amount', 'funding_deadline',
        ]), fn ($v) => $v !== null));

        AuditLog::record('item.updated', 'RequestItem', $item->id, null, $item->toArray());

        return response()->json($item->load('request'));
    }

    public function destroyItem(Request $request, RequestItem $item)
    {
        $this->authorizeStaff($request);

        \App\Models\FundTransaction::where('item_id', $item->id)->delete();
        \App\Models\Donation::where('item_id', $item->id)->delete();
        \App\Models\Invoice::where('item_id', $item->id)->delete();
        \App\Models\Equipment::where('item_id', $item->id)->delete();
        \App\Models\Report::where('item_id', $item->id)->delete();

        $id = $item->id;
        $item->delete();

        AuditLog::record('item.deleted', 'RequestItem', $id);

        return response()->json(['message' => 'Item deleted']);
    }

    public function updateStatus(Request $request, FundingRequest $requestItem)
    {
        $user = $request->user();
        $this->authorizeStaff($request);

        $request->validate([
            'status' => 'required|string|in:draft,endorsement_pending,submitted,under_review,more_info_needed,approved,declined,published,funding_closed,procurement,delivered,active_reporting,closed',
            'decision_note' => 'nullable|string|max:3000',
        ]);

        $pipeline = [
            'draft' => ['submitted'],
            'endorsement_pending' => ['submitted', 'under_review', 'more_info_needed', 'declined'],
            'submitted' => ['more_info_needed', 'under_review', 'declined'],
            'under_review' => ['approved', 'more_info_needed', 'declined'],
            'more_info_needed' => ['submitted', 'under_review', 'approved', 'declined', 'published'],
            'approved' => ['published'],
            'declined' => [],
            'published' => ['funding_closed'],
            'funding_closed' => ['procurement'],
            'procurement' => ['delivered'],
            'delivered' => ['active_reporting'],
            'active_reporting' => ['closed'],
            'closed' => [],
        ];

        $current = $requestItem->status;
        $next = $request->status;

        if ($next !== $current && $current !== 'draft' && ! in_array($next, $pipeline[$current] ?? [], true)) {
            abort(422, "Invalid status transition: {$current} -> {$next}");
        }

        // Approval / publishing requires at least ONE trust anchor:
        // - a recorded Board decision, OR
        // - an OWERU-verified (5-step DD) applicant, OR
        // - a completed church confirmation (endorsement).
        if (in_array($next, ['approved', 'published'], true)) {
            $verifiedApplicant = $requestItem->applicant
                && $requestItem->applicant->verification?->status === 'verified';
            $churchConfirmed = $requestItem->endorsements()
                ->where('status', 'complete')
                ->exists();

            if (! $requestItem->board_approved && ! $verifiedApplicant && ! $churchConfirmed) {
                abort(422, 'This request cannot be approved yet. It needs a recorded Board decision, OR an OWERU-verified applicant, OR a completed church confirmation.');
            }
        }

        $statusUpdate = ['status' => $next];
        if ($request->filled('decision_note')) {
            $statusUpdate['decision_note'] = $request->decision_note;
        }
        $requestItem->update($statusUpdate);

        if (in_array($next, ['submitted', 'under_review', 'approved', 'published'])) {
            $requestItem->submitted_at = now();
            $requestItem->save();
        }

        // The Board decision (approve/publish) is recorded with the acting staff user.
        if (in_array($next, ['approved', 'published'], true) && ! $requestItem->board_approved) {
            $requestItem->update([
                'board_approved' => true,
                'board_reviewed_at' => now(),
                'board_reviewed_by' => $user->id,
            ]);
        }

        AuditLog::record('request.status_changed', 'FundingRequest', $requestItem->id, $current, $next);

        // If publishing when every item is already fully funded (e.g. donations
        // were confirmed before the request went public), close funding right away.
        if ($next === 'published') {
            $allFunded = $requestItem->items()
                ->get()
                ->every(fn ($i) => (float) $i->donations()
                    ->where('status', 'confirmed')
                    ->sum(DB::raw('COALESCE(amount_tzs, amount)')) >= (float) $i->target_amount);

            if ($allFunded) {
                $requestItem->update(['status' => 'funding_closed']);
                AuditLog::record('request.status_changed', 'FundingRequest', $requestItem->id, $next, 'funding_closed');
            }
        }

        if ($requestItem->applicant_id && $next !== $current) {
            $detail = $next === 'declined' && $requestItem->decision_note
                ? ' Reason: ' . $requestItem->decision_note
                : '';
            AppNotification::create([
                'user_id' => $requestItem->applicant_id,
                'type' => 'request.status',
                'title' => 'Request status updated',
                'body' => 'Your request "' . $requestItem->title . '" status changed to ' . str_replace('_', ' ', $next) . '.' . $detail,
                'url' => '/track/' . $requestItem->track_token,
            ]);
        }

        return response()->json($requestItem);
    }

    /**
     * All-or-nothing funding window: when every item of a published request
     * has passed its 60-day funding deadline, close the request's funding so
     * no further contributions are accepted. Runs lazily on public reads.
     */
    protected function closeExpiredFunding(): void
    {
        app(\App\Services\MaintenanceService::class)->closeExpiredFunding();
    }

    /**
     * Public comment thread on a funding request. Guests can comment too
     * (consistent with the phone-only, no-permanent-account philosophy);
     * their name is taken from the submission.
     */
    public function storeComment(Request $request, FundingRequest $requestItem)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'body' => 'required|string|max:2000',
        ]);

        $user = auth('sanctum')->user();

        $comment = $requestItem->comments()->create([
            'author_id' => $user?->id,
            'author_name' => $user && $user->name ? $user->name : $request->name,
            'body' => $request->body,
        ]);

        return response()->json($comment->load('author'), 201);
    }
}
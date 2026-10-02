<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Support\DeliveryConfirmationService;
use App\Support\MediaStore;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Equipment::with('item.request', 'supplier', 'invoice', 'recipient')
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->item_id, fn ($q) => $q->where('item_id', $request->item_id))
            ->when($request->applicant_id, fn ($q) => $q->whereHas('item.request', fn ($sub) => $sub->where('applicant_id', $request->applicant_id)));

        if ($user->role === 'applicant' && ! $request->has('all')) {
            $query->whereHas('item.request', fn ($q) => $q->where('applicant_id', $user->id));
        }

        $query->orderByDesc('created_at');

        $items = $query->paginate($request->per_page ?? 20);

        $items->getCollection()->transform(function (Equipment $equipment) {
            $equipment->setAttribute('parties_confirmed', DeliveryConfirmationService::partiesConfirmed($equipment));
            $equipment->setAttribute('delivery_complete', DeliveryConfirmationService::isComplete($equipment));
            return $equipment;
        });

        return response()->json($items);
    }

public function show(Request $request, Equipment $equipment)
    {
        $equipment->load('item.request.applicant', 'supplier', 'invoice', 'recipient', 'deliveryConfirmations.confirmer');

        $equipment->setAttribute('parties_confirmed', DeliveryConfirmationService::partiesConfirmed($equipment));
        $equipment->setAttribute('delivery_complete', DeliveryConfirmationService::isComplete($equipment));

        return response()->json($equipment);
    }

    /**
     * Record a delivery confirmation for one of the three parties
     * (recipient, supplier, church). Equipment is verified only once all
     * three have confirmed, which also advances the parent request.
     */
    public function confirmDelivery(Request $request, Equipment $equipment)
    {
        $this->authorizeStaff($request);

        $party = $request->input('party');

        if (! in_array($party, DeliveryConfirmationService::PARTIES, true)) {
            abort(422, "Party must be one of: " . implode(', ', DeliveryConfirmationService::PARTIES));
        }

        $evidencePath = $request->filled('evidence') && $request->evidence
            ? MediaStore::fromBase64($request->evidence, 'delivery')
            : null;

        $confirmation = DeliveryConfirmationService::record(
            $equipment,
            $party,
            $request->user()->id,
            $request->input('notes'),
            $evidencePath
        );

        $equipment->refresh();
        $equipment->setAttribute('parties_confirmed', DeliveryConfirmationService::partiesConfirmed($equipment));
        $equipment->setAttribute('delivery_complete', DeliveryConfirmationService::isComplete($equipment));

        return response()->json($confirmation, 201);
    }

    public function getEvidence(Request $request, Equipment $equipment)
    {
        $this->authorizeStaff($request);

        $path = $request->query('party')
            ? $equipment->deliveryConfirmations()->where('party', $request->query('party'))->value('evidence_path')
            : null;

        return MediaStore::serve($path ?: '', 'delivery-' . $equipment->register_number . '.bin');
    }

    public function store(Request $request)
    {
        $this->authorizeStaff($request);

        $request->validate([
            'item_id' => 'required|exists:request_items,id',
            'register_number' => 'required|string|max:255|unique:equipment,register_number',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'invoice_id' => 'nullable|exists:invoices,id',
            'amount' => 'nullable|numeric|min:0',
            'recipient_id' => 'nullable|exists:users,id',
            'location' => 'nullable|string|max:255',
            'delivery_date' => 'nullable|date',
            'warranty_until' => 'nullable|string|max:255',
        ]);

        $equipment = Equipment::create([
            'item_id' => $request->item_id,
            'register_number' => $request->register_number,
            'model' => $request->model,
            'serial_number' => $request->serial_number,
            'supplier_id' => $request->supplier_id,
            'invoice_id' => $request->invoice_id,
            'amount' => $request->amount,
            'recipient_id' => $request->recipient_id,
            'location' => $request->location,
            'status' => 'delivered',
            'delivery_date' => $request->delivery_date ?? now(),
        ]);

        \App\Models\AuditLog::record('equipment.created', 'Equipment', $equipment->id, null, $equipment->toArray());

        return response()->json($equipment->load('item', 'supplier', 'invoice', 'recipient'), 201);
    }

    public function updateStatus(Request $request, Equipment $equipment)
    {
        $this->authorizeStaff($request);

        $request->validate([
            'status' => 'required|in:delivered,verified,in_use,in_repair,returned,transferred,lost',
            'location' => 'nullable|string|max:255',
        ]);

        if ($request->status === 'verified'
            && ! DeliveryConfirmationService::isComplete($equipment)) {
            abort(422, 'Equipment cannot be marked verified until the recipient, supplier and church have all confirmed delivery.');
        }

        $old = $equipment->toArray();
        $equipment->update([
            'status' => $request->status,
            'location' => $request->location ?? $equipment->location,
        ]);

        if ($request->status === 'verified') {
            $equipment->verified_date = now();
            $equipment->save();
        }
        if ($request->status === 'transferred') {
            $equipment->transfer_date = now();
            $equipment->save();
        }

        \App\Models\AuditLog::record('equipment.status_changed', 'Equipment', $equipment->id, $old['status'], $request->status);

        return response()->json($equipment);
    }

    public function update(Request $request, Equipment $equipment)
    {
        $this->authorizeStaff($request);

        $request->validate([
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'amount' => 'nullable|numeric|min:0',
            'location' => 'nullable|string|max:255',
            'status' => 'nullable|in:delivered,verified,in_use,in_repair,returned,transferred,lost',
            'warranty_until' => 'nullable|string|max:255',
            'recipient_id' => 'nullable|exists:users,id',
        ]);

        $equipment->update($request->only(['model', 'serial_number', 'amount', 'location', 'status', 'warranty_until', 'recipient_id']));

        \App\Models\AuditLog::record('equipment.updated', 'Equipment', $equipment->id, null, $equipment->toArray());

        return response()->json($equipment->load('item', 'supplier', 'invoice', 'recipient'));
    }

    public function destroy(Request $request, Equipment $equipment)
    {
        $this->authorizeStaff($request);

        $id = $equipment->id;
        $equipment->delete();

        \App\Models\AuditLog::record('equipment.deleted', 'Equipment', $id);

        return response()->json(['message' => 'Equipment deleted']);
    }
}

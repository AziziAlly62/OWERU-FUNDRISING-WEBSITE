<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Quote;
use App\Models\RequestItem;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function index(Request $request)
    {
        $query = Quote::with('item.request', 'supplier', 'creator')
            ->when($request->request_item_id, fn ($q) => $q->where('request_item_id', $request->request_item_id))
            ->when($request->supplier_id, fn ($q) => $q->where('supplier_id', $request->supplier_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->per_page ?? 50));
    }

    public function store(Request $request)
    {
        $this->authorizeStaff($request);

        $request->validate([
            'request_item_id' => 'required|exists:request_items,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'amount' => 'required|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'valid_until' => 'nullable|date',
            'notes' => 'nullable|string|max:2000',
        ]);

        $quote = Quote::create([
            'request_item_id' => $request->request_item_id,
            'supplier_id' => $request->supplier_id,
            'amount' => $request->amount,
            'currency' => strtoupper($request->currency ?? 'TZS'),
            'valid_until' => $request->valid_until,
            'notes' => $request->notes,
            'status' => 'pending',
            'created_by' => $request->user()->id,
        ]);

        AuditLog::record('quote.created', 'Quote', $quote->id, null, $quote->toArray());

        return response()->json($quote->load('item.request', 'supplier', 'creator'), 201);
    }

    /**
     * Approve the selected quote for an item: it becomes the funded price and
     * every other pending quote for the same item is rejected (single source
     * of truth avoids two suppliers being asked for payment simultaneously).
     */
    public function approve(Request $request, Quote $quote)
    {
        $this->authorizeStaff($request);

        if ($quote->status !== 'pending') {
            abort(422, 'Only pending quotes can be approved.');
        }

        $old = $quote->status;

        Quote::where('request_item_id', $quote->request_item_id)
            ->where('status', 'pending')
            ->where('id', '!=', $quote->id)
            ->update(['status' => 'rejected']);

        $quote->update(['status' => 'approved']);

        $item = RequestItem::find($quote->request_item_id);
        if ($item) {
            $item->target_amount = $quote->amount;
            $item->share_price = RequestItem::defaultSharePrice($quote->amount);
            $item->save();
        }

        AuditLog::record('quote.approved', 'Quote', $quote->id, $old, 'approved');

        return response()->json($quote->load('item.request', 'supplier', 'creator'));
    }

    public function reject(Request $request, Quote $quote)
    {
        $this->authorizeStaff($request);

        if ($quote->status !== 'pending') {
            abort(422, 'Only pending quotes can be rejected.');
        }

        $old = $quote->status;
        $quote->update(['status' => 'rejected']);

        AuditLog::record('quote.rejected', 'Quote', $quote->id, $old, 'rejected');

        return response()->json($quote->load('item.request', 'supplier', 'creator'));
    }

    public function update(Request $request, Quote $quote)
    {
        $this->authorizeStaff($request);

        $request->validate([
            'supplier_id' => 'nullable|exists:suppliers,id',
            'amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'valid_until' => 'nullable|date',
            'notes' => 'nullable|string|max:2000',
        ]);

        $quote->update(array_filter([
            'supplier_id' => $request->supplier_id ?? null,
            'amount' => $request->has('amount') ? $request->amount : null,
            'currency' => $request->currency ? strtoupper($request->currency) : null,
            'valid_until' => $request->valid_until ?? null,
            'notes' => $request->notes ?? null,
        ], fn ($v) => $v !== null));

        AuditLog::record('quote.updated', 'Quote', $quote->id, null, $quote->toArray());

        return response()->json($quote->load('item.request', 'supplier', 'creator'));
    }

    public function destroy(Request $request, Quote $quote)
    {
        $this->authorizeStaff($request);

        $id = $quote->id;
        $quote->delete();

        AuditLog::record('quote.deleted', 'Quote', $id);

        return response()->json(['message' => 'Quote deleted']);
    }
}
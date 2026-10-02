<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\Equipment;
use App\Models\FundingRequest;
use App\Models\FundTransaction;
use App\Models\Invoice;
use App\Models\Report;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::with('item', 'supplier')
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function ledger(Request $request)
    {
        $query = Invoice::with(['item', 'supplier'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('created_at');

        $ledger = $query->paginate($request->per_page ?? 20)->through(function ($invoice) {
            /* `receipt_url` stays visible: the site promises every payment is
               backed by a public receipt, and the public ledger links to it.
               Internal documents stay private. */
            $invoice->setHidden(array_merge($invoice->getHidden(), [
                'document_path',
            ]));
            if ($invoice->relationLoaded('supplier') && $invoice->supplier) {
                $invoice->supplier->setHidden(['contact_email', 'contact_phone']);
            }
            return $invoice;
        });

        return response()->json($ledger);
    }

    public function store(Request $request)
    {
        $this->authorizeStaff($request);

        $request->validate([
            'item_id' => 'required|exists:request_items,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'invoice_number' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
        ]);

        $invoice = Invoice::create([
            'item_id' => $request->item_id,
            'supplier_id' => $request->supplier_id,
            'invoice_number' => $request->invoice_number ?? 'INV-' . strtoupper(uniqid()),
            'amount' => $request->amount,
            'status' => 'pending',
        ]);

        AuditLog::record('invoice.created', 'Invoice', $invoice->id, null, $invoice->toArray());

        return response()->json($invoice->load('item', 'supplier'), 201);
    }

    public function markPaid(Request $request, Invoice $invoice)
    {
        $this->authorizeStaff($request);

        if (in_array($invoice->status, ['paid', 'awaiting_receipt'])) {
            return response()->json($invoice->load('item', 'supplier'));
        }

        $invoice->update(['status' => 'awaiting_receipt']);

        AuditLog::record('invoice.sent', 'Invoice', $invoice->id, 'pending', 'awaiting_receipt');

        $item = $invoice->item;
        if ($item && $item->request && $item->request->applicant_id) {
            AppNotification::create([
                'user_id' => $item->request->applicant_id,
                'type' => 'invoice.sent',
                'title' => 'Payment sent',
                'body' => 'Payment for ' . $item->name . ' has been sent to supplier. Awaiting receipt confirmation.',
                'url' => null,
            ]);
        }

        return response()->json($invoice->load('item', 'supplier'));
    }

    public function uploadReceipt(Request $request, Invoice $invoice)
    {
        $this->authorizeStaff($request);

        if (!in_array($invoice->status, ['awaiting_receipt', 'receipt_uploaded'])) {
            abort(400, 'Invoice is not awaiting receipt');
        }

        $request->validate([
            'receipt' => 'required|image|max:5120',
        ]);

        $path = $request->file('receipt')->store('receipts', 'public');

        $invoice->update([
            'receipt_url' => $path,
            'status' => 'receipt_uploaded',
        ]);

        AuditLog::record('invoice.receipt_uploaded', 'Invoice', $invoice->id, 'awaiting_receipt', 'receipt_uploaded');

        return response()->json($invoice->load('item', 'supplier'));
    }

    public function approve(Request $request, Invoice $invoice)
    {
        $this->authorizeStaff($request);

        if ($invoice->status !== 'receipt_uploaded') {
            abort(400, 'Invoice has no receipt uploaded');
        }

        $balance = FundTransaction::balanceForItem($invoice->item_id);
        $allowUnfunded = (bool) config('gateway.demo.allow_unfunded_approve', false);
        $unfundedApprove = $allowUnfunded && $balance < (float) $invoice->amount;
        if (! $unfundedApprove && $balance < (float) $invoice->amount) {
            abort(422, 'Insufficient confirmed funds for this item');
        }

        \DB::transaction(function () use ($invoice, $request, $unfundedApprove) {
            $balance = FundTransaction::balanceForItem($invoice->item_id) - (float) $invoice->amount;

            FundTransaction::create([
                'item_id' => $invoice->item_id,
                'type' => 'debit',
                'source_type' => Invoice::class,
                'source_id' => $invoice->id,
                'amount' => $invoice->amount,
                'currency' => 'TZS',
                'fx_rate' => 1,
                'amount_tzs' => $invoice->amount,
                'balance_after' => $balance,
                'notes' => 'Supplier payment for ' . $invoice->invoice_number . ($unfundedApprove ? ' (DEMO: unfunded approve)' : ''),
            ]);

            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
                'paid_currency' => 'TZS',
                'paid_amount' => $invoice->amount,
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            $invoice->item()->update(['status' => 'ordered']);
        });

        AuditLog::record($unfundedApprove ? 'invoice.approved_unfunded' : 'invoice.approved', 'Invoice', $invoice->id, 'receipt_uploaded', 'paid');

        // Automatically register the purchased item in the equipment register.
        $this->registerEquipment($invoice);

        $item = $invoice->item;
        if ($item && $item->request && $item->request->applicant_id) {
            AppNotification::create([
                'user_id' => $item->request->applicant_id,
                'type' => 'invoice.paid',
                'title' => 'Payment confirmed',
                'body' => 'Payment for ' . $item->name . ' has been confirmed and completed.',
                'url' => null,
            ]);
        }

        return response()->json($invoice->load('item', 'supplier', 'approver'));
    }

    protected function registerEquipment(Invoice $invoice)
    {
        $item = $invoice->item;
        if (! $item) {
            return;
        }

        if (Equipment::where('item_id', $item->id)->exists()) {
            return;
        }

        $request = $item->request;
        $recipientId = $request ? $request->applicant_id : null;

        $equipment = Equipment::create([
            'item_id' => $item->id,
            'register_number' => 'EQ-' . str_pad((string) ($item->id + 1000), 4, '0', STR_PAD_LEFT),
            'model' => $item->name,
            'serial_number' => null,
            'supplier_id' => $invoice->supplier_id,
            'invoice_id' => $invoice->id,
            'amount' => $invoice->amount,
            'recipient_id' => $recipientId,
            'location' => $request?->region,
            'status' => 'delivered',
            'delivery_date' => now(),
        ]);

        // Auto-generate the monitoring report schedule (30 & 90 day).
        $types = ['30_day' => 30, '90_day' => 90];
        foreach ($types as $type => $days) {
            if (! Report::where('item_id', $item->id)->where('type', $type)->exists()) {
                Report::create([
                    'item_id' => $item->id,
                    'recipient_id' => $recipientId,
                    'type' => $type,
                    'due_date' => now()->addDays($days),
                    'status' => 'upcoming',
                    'content' => null,
                ]);
            }
        }

        AuditLog::record('equipment.created', 'Equipment', $equipment->id, null, $equipment->toArray());
    }

    public function update(Request $request, Invoice $invoice)
    {
        $this->authorizeStaff($request);

        $request->validate([
            'invoice_number' => 'nullable|string|max:255',
            'amount' => 'nullable|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'item_id' => 'nullable|exists:request_items,id',
        ]);

        $wasPaid = $invoice->status === 'paid';

        $invoice->update(array_filter([
            'invoice_number' => $request->invoice_number ?? null,
            'amount' => $request->has('amount') ? $request->amount : null,
            'supplier_id' => $request->supplier_id ?? null,
            'item_id' => $request->item_id ?? null,
        ], fn ($v) => $v !== null));

        \App\Models\AuditLog::record('invoice.updated', 'Invoice', $invoice->id, null, $invoice->toArray());

        return response()->json($invoice->load('item', 'supplier'));
    }

    public function destroy(Request $request, Invoice $invoice)
    {
        $this->authorizeStaff($request);

        $id = $invoice->id;

        FundTransaction::where('source_type', Invoice::class)
            ->where('source_id', $invoice->id)
            ->delete();

        $invoice->delete();

        AuditLog::record('invoice.deleted', 'Invoice', $id);

        return response()->json(['message' => 'Invoice deleted']);
    }
}

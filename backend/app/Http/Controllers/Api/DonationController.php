<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\Donation;
use App\Models\FundTransaction;
use App\Models\RequestItem;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DonationController extends Controller
{
    public function fund(Request $request)
    {
        $isMpesa = $request->payment_method === 'mpesa';
        $isCard = $request->payment_method === 'card';
        $isMobileManual = in_array($request->payment_method, ['mobile', 'bank'], true);

        $rules = [
            'item_id' => 'required|exists:request_items,id',
            'amount' => 'required|numeric|min:1',
            'donor_name' => 'required_if:is_guest,true|string|max:255',
            'is_guest' => 'nullable|boolean',
            'payment_method' => 'nullable|in:mpesa,mobile,bank,card',
            'network' => 'nullable|in:mpesa,tigo,airtel,other',
            'currency' => 'nullable|string|size:3',
            'fx_rate' => 'nullable|numeric|gt:0',
            'card_last4' => 'nullable|string|max:4',
            'card_brand' => 'nullable|string|max:20',
        ];

        if ($isMpesa) {
            $rules['mpesa_phone'] = 'required|string|max:20';
        } elseif ($isCard) {
            $rules['currency'] = 'required|string|size:3';
            $rules['fx_rate'] = 'required|numeric|gt:0';
            $rules['card_last4'] = 'required|string|max:4';
        } elseif ($isMobileManual) {
            $rules['payment_reference'] = 'required|string|max:255';
        }

        $request->validate($rules);

        $donor = $request->is_guest ? null : auth('sanctum')->user();

        $donation = DB::transaction(function () use ($request, $isCard, $isMpesa, $donor) {
            // Kipengee kimefungwa ili kusimamisha mbio (race) ya michango inayofika pamoja.
            $item = RequestItem::whereKey($request->item_id)->lockForUpdate()->first();

            // Salimisha michango ya zamani iliyokwama (pending) ndipo pesa irudi kwa wafadhili wengine.
            $this->expireStalePendingDonations();

            if (! $item || ! in_array($item->status, ['pending_funding'], true)) {
                abort(409, 'This item is no longer accepting donations.');
            }

            // Michango inakubalika tu wakati ombi limechapishwa kwa umma.
            if ($item->request && $item->request->status !== 'published') {
                abort(409, 'This request is not accepting donations right now.');
            }

            // All-or-nothing: 60-day funding window, enforced at donation time.
            if ($item->funding_deadline && $item->funding_deadline->lt(now()->startOfDay())) {
                abort(409, 'The funding window for this item has closed. No further contributions can be accepted.');
            }

            $needAmount = $isCard ? (float) $request->amount * $request->fx_rate : (float) $request->amount;

            $target = (float) $item->target_amount;
            $reserved = (float) DB::table('donations')
                ->where('item_id', $item->id)
                ->where(function ($q) {
                    $q->where('status', 'confirmed')
                      ->orWhere(function ($q) {
                          $q->where('status', 'pending')
                            ->where(function ($q) {
                                $q->whereNull('mpesa_status')->orWhere('mpesa_status', '!=', 'failed');
                            });
                      });
                })
                ->sum(DB::raw('COALESCE(amount_tzs, amount)'));

            $remaining = $target - $reserved;
            if ($remaining <= 0) {
                abort(409, 'This item is fully funded already.');
            }
            if ((float) $request->amount > $remaining) {
                abort(422, 'This item only needs ' . number_format($remaining, 0) . ' TZS more. Please give ' . number_format($remaining, 0) . ' or less.');
            }
            if ($isCard && $needAmount > $remaining) {
                abort(422, 'This item only needs ' . number_format($remaining / max(1, (float) $request->fx_rate), 2) . ' ' . strtoupper($request->currency) . ' more.');
            }

            $currency = strtoupper($request->currency ?? 'TZS');
            $fxRate = $currency === 'TZS' ? 1 : (float) ($request->fx_rate ?? 1);
            $amountTzs = round((float) $request->amount * $fxRate, 2);

            $donation = Donation::create([
                'item_id' => $item->id,
                'donor_id' => $donor?->id,
                'donor_name' => $donor?->name ?? ($request->donor_name ?: null),
                'is_guest' => $request->is_guest ?? true,
                'amount' => $request->amount,
                'payment_reference' => $request->payment_reference ??
                    ($isCard ? 'CARD-' . strtoupper(uniqid()) : 'MM-' . strtoupper(uniqid())),
                'payment_method' => $request->payment_method ?? 'mobile',
                'network' => $request->network ?? null,
                'currency' => $currency,
                'fx_rate' => $fxRate,
                'amount_tzs' => $amountTzs,
                'card_last4' => $isCard ? $request->card_last4 : null,
                'card_brand' => $isCard ? $request->card_brand : null,
                'status' => 'pending',
                'donated_at' => now(),
                'mpesa_phone' => $isMpesa ? $request->mpesa_phone : null,
                'mpesa_status' => in_array($request->payment_method, ['mpesa', 'card'], true) ? 'pending_stk' : 'none',
                'mpesa_checkout_request_id' => in_array($request->payment_method, ['mpesa', 'card'], true)
                    ? 'SIM-' . strtoupper(uniqid())
                    : null,
            ]);

            return $donation;
        });

        AuditLog::record('donation.created', 'Donation', $donation->id, null, $donation->toArray());

        if (in_array($request->payment_method, ['mpesa', 'card'], true)) {
            // Vigezo vya gate (Flutterwave kwa prod, Simulated kwa demo/sandbox).
            $gateway = app(PaymentGatewayManager::class)->driver();

            try {
                $result = $gateway->initiate($donation);
            } catch (\Throwable $e) {
                Log::error('Payment gateway initiation failed', ['donation' => $donation->id, 'error' => $e->getMessage()]);
                $donation->update(['mpesa_status' => 'failed']);
                AuditLog::record('donation.gateway_failed', 'Donation', $donation->id, null, ['message' => $e->getMessage()]);
                return response()->json(['message' => 'Payment request could not be started. Please try again.'], 422);
            }

            $donation->update([
                'mpesa_checkout_request_id' => $result['external_id'] ?? $donation->mpesa_checkout_request_id,
                'mpesa_status' => $result['success'] ? 'pending_stk' : 'failed',
                'status' => $result['success'] ? 'pending' : $donation->status,
            ]);

            if (! $result['success']) {
                AuditLog::record('donation.gateway_failed', 'Donation', $donation->id, null, ['message' => $result['message']]);
                return response()->json([
                    'message' => $result['message'] ?? 'Payment request failed.',
                    'payment' => $result,
                ], 422);
            }
        }

        // Do NOT attach the applicant record here: a donor must never receive
        // the applicant's contact details (privacy rule, see privacyScrub).
        return response()->json(
            $donation->load('item', 'item.request'),
            201
        );
    }

    /**
     * Ongea hali ya STK push (Daraja). Inatumika kwa polling kutoka frontend.
     * Kuona hali kwa donation id ni hatari ndogo (inajulisha tu hali ya malipo).
     */
    public function mpesaStatus(Request $request, Donation $donation)
    {

        $this->expireStalePendingDonations();

        if ($donation->mpesa_status === 'paid' || $donation->status === 'confirmed') {
            return response()->json([
                'status' => 'paid',
                'mpesa_status' => $donation->mpesa_status,
                'receipt' => $donation->mpesa_receipt,
                'donation_confirm' => $donation->status,
            ]);
        }

        // Endeleza hali kupitia gate ya malipo (simulated sasa; Flutterwave P1).
        if ($donation->mpesa_status === 'pending_stk' && $donation->mpesa_checkout_request_id) {
            try {
                $gateway = app(PaymentGatewayManager::class)->driver();
                $state = $gateway->verify($donation);

                if (($state['status'] ?? '') === 'paid') {
                    $this->applyConfirmation($donation->fresh(), 'simulated');
                    $donation->refresh();
                }
            } catch (\Throwable $e) {
                Log::error('Gateway verify failed in polling', ['donation' => $donation->id, 'error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'status' => $donation->mpesa_status,
            'mpesa_status' => $donation->mpesa_status,
            'receipt' => $donation->mpesa_receipt,
            'donation_confirm' => $donation->status,
        ]);
    }

    /**
     * Michango iliyosalia 'pending' zaidi ya masaa 24 hupoteza hifadhi yake
     * (reserved) ili pesa irudi kwa wafadhili wengine. Honey: bado inaweza
     * kuthibitishwa kwa mkono na staff (confirm) ikitokea malipo halisi.
     */
    protected function expireStalePendingDonations(int $hours = 24): void
    {
        app(\App\Services\MaintenanceService::class)->expireStalePendingDonations($hours);
    }

    public function confirm(Request $request, Donation $donation)
    {
        $this->authorizeStaff($request);

        if ($donation->status === 'confirmed') {
            return response()->json($donation->load('item.request'));
        }

        $this->applyConfirmation($donation, 'manual');

        return response()->json($donation->load('item.request'));
    }

    protected function applyConfirmation(Donation $donation, string $source)
    {
        $donation->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);

        if ($source === 'mpesa' || $source === 'simulated') {
            $donation->update(['mpesa_status' => 'paid']);
        }

        $tzsAmount = (float) ($donation->amount_tzs ?? $donation->amount);

        FundTransaction::create([
            'type' => 'credit',
            'source_type' => Donation::class,
            'source_id' => $donation->id,
            'item_id' => $donation->item_id,
            'amount' => $tzsAmount,
            'currency' => 'TZS',
            'fx_rate' => 1,
            'amount_tzs' => $tzsAmount,
            'balance_after' => (float) FundTransaction::where('item_id', $donation->item_id)
                ->sum(\DB::raw('CASE WHEN type = "credit" THEN amount ELSE -amount END')),
        ]);

        $item = RequestItem::find($donation->item_id);
        $raised = (float) $item->donations()->where('status', 'confirmed')
            ->sum(\DB::raw('COALESCE(amount_tzs, amount)'));
        $target = (float) $item->target_amount;

        if ($raised >= $target) {
            $item->update(['status' => 'fully_funded']);

            if ($item->request) {
                AppNotification::create([
                    'user_id' => $item->request->applicant_id,
                    'type' => 'item.funded',
                    'title' => 'Item fully funded',
                    'body' => 'Your item ' . $item->name . ' has reached its funding target.',
                    'url' => null,
                ]);
            }

            // Auto-close funding when every item of the request is fully funded
            $requestItem = $item->request;
            if ($requestItem && $requestItem->status === 'published') {
                $allFunded = $requestItem->items()
                    ->get()
                    ->every(fn ($i) => (float) $i->donations()->where('status', 'confirmed')->sum('amount') >= (float) $i->target_amount);
                if ($allFunded) {
                    $oldStatus = $requestItem->status;
                    $requestItem->update(['status' => 'funding_closed']);
                    AuditLog::record('request.status_changed', 'FundingRequest', $requestItem->id, $oldStatus, 'funding_closed');
                }
            }
        }

        if ($donation->donor_id) {
            AppNotification::create([
                'user_id' => $donation->donor_id,
                'type' => 'donation.confirmed',
                'title' => 'Donation confirmed',
                'body' => 'Your donation of ' . number_format($donation->amount, 2) . ' has been confirmed.',
                'url' => null,
            ]);
        }

        // Live donor + applicant alerts per donation (M-Changa §2.4 #6).
        // Sandbox: NOTIFICATION_DRIVER=log prints to storage/logs/alerts.log.
        $notifier = app(\App\Services\Notifications\NotificationManager::class);
        $donorEmail = $donation->donor?->email;
        $applicantUser = $item->request?->applicant;
        $applicantPhone = $applicantUser?->verification?->phone;
        $amountText = number_format($donation->amount_tzs ?? $donation->amount, 0);

        $notifier->send('email', $donorEmail ?: '', 'Donation confirmed',
            'Dear ' . ($donation->donor_name ?: 'Supporter') . ', your donation of TSh '
            . $amountText . ' for "' . $item->name . '" is confirmed. Receipt issued. Thank you for supporting OWERU.');

        $notifier->send('email', $applicantUser?->email ?: '', 'New donation received',
            'You received a donation of TSh ' . $amountText
            . ' toward "' . $item->name . '". Progress updates live on your request page.');

        $notifier->send('sms', $applicantPhone ?: '', 'New donation received',
            'A donor gave TSh ' . $amountText . ' for "' . $item->name . '". Progress updates live on OWERU.');

        AuditLog::record('donation.confirmed', 'Donation', $donation->id, $donation->status, 'confirmed');
    }

    public function update(Request $request, Donation $donation)
    {
        $this->authorizeStaff($request);

        $request->validate([
            'amount' => 'nullable|numeric|min:0',
            'donor_name' => 'nullable|string|max:255',
            'payment_reference' => 'nullable|string|max:255',
            'status' => 'nullable|in:pending,confirmed',
        ]);

        $wasConfirmed = $donation->status === 'confirmed';

        $donation->update(array_filter([
            'amount' => $request->has('amount') ? $request->amount : null,
            'donor_name' => $request->donor_name ?? null,
            'payment_reference' => $request->payment_reference ?? null,
            'status' => $request->status ?? null,
        ], fn ($v) => $v !== null));

        // If a confirmed donation amount changed, adjust the linked fund credit.
        if ($wasConfirmed && $request->has('amount')) {
            FundTransaction::where('source_type', Donation::class)
                ->where('source_id', $donation->id)
                ->update(['amount' => $donation->amount]);
        }

        AuditLog::record('donation.updated', 'Donation', $donation->id, null, $donation->toArray());

        return response()->json($donation->load('item.request'));
    }

    public function destroy(Request $request, Donation $donation)
    {
        $this->authorizeStaff($request);

        $id = $donation->id;

        FundTransaction::where('source_type', Donation::class)
            ->where('source_id', $donation->id)
            ->delete();

        $donation->delete();

        AuditLog::record('donation.deleted', 'Donation', $id);

        return response()->json(['message' => 'Donation deleted']);
    }

    /**
     * Callback ya STK Push kutoka Safaricom Daraja (public webhook).
     *
     * Muundo wa callback (STK):
     * {
     *   "Body": {
     *     "stkCallback": {
     *       "MerchantRequestID": "...",
     *       "CheckoutRequestID": "...",
     *       "ResultCode": 0,
     *       "ResultDesc": "The service request is processed successfully.",
     *       "CallbackMetadata": { "Item": [ {Name,Value}... ] }
     *     }
     *   }
     * }
     */
    public function mpesaCallback(Request $request)
    {
        $callback = data_get($request->all(), 'Body.stkCallback');
        $checkoutRequestId = data_get($callback, 'CheckoutRequestID');
        $resultCode = data_get($callback, 'ResultCode');

        $donation = Donation::where('mpesa_checkout_request_id', $checkoutRequestId)->first();

        if (! $donation) {
            Log::warning('Mpesa callback: no matching donation', ['checkout' => $checkoutRequestId]);
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Not found']);
        }

        if ((int) $resultCode === 0) {
            $receipt = null;
            $paidAmount = null;
            foreach (data_get($callback, 'CallbackMetadata.Item', []) as $item) {
                if (($item['Name'] ?? '') === 'MpesaReceiptNumber') $receipt = $item['Value'] ?? null;
                if (($item['Name'] ?? '') === 'Amount') $paidAmount = $item['Value'] ?? null;
            }
            $donation->update([
                'mpesa_receipt' => $receipt,
                'mpesa_status' => 'paid',
            ]);
            $this->applyConfirmation($donation->fresh(), 'mpesa');
            Log::info('Mpesa callback: confirmed donation ' . $donation->id . ' receipt=' . $receipt);
        } else {
            $donation->update(['mpesa_status' => 'failed']);
            Log::info('Mpesa callback: failed for donation ' . $donation->id . ' code=' . $resultCode);
        }

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Success']);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $query = Donation::with('item.request', 'donor')
            ->when($request->item_id, fn ($q) => $q->where('item_id', $request->item_id))
            ->when(! in_array($user->role, ['admin', 'manager'], true), fn ($q) => $q->where('donor_id', $user->id))
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->per_page ?? 50));
    }

    public function total(Request $request)
    {
        $total = Donation::where('status', 'confirmed')
            ->when($request->item_id, fn ($q) => $q->where('item_id', $request->item_id))
            ->sum(\DB::raw('COALESCE(amount_tzs, amount)'));

        return response()->json(['total' => (float) $total]);
    }
}

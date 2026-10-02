<?php

namespace App\Services\Payments;

use App\Models\Donation;
use App\Services\Payments\Contracts\PaymentGateway;

/**
 * Sandbox driver: never moves real money.
 * Accepts any mobile-money force-push (SIM-PUSH) and any card (SIM-CARD),
 * then auto-confirms configuration('gateway.simulated.confirm_seconds') after initiation.
 */
class SimulatedGateway implements PaymentGateway
{
    public function initiate(Donation $donation): array
    {
        if ($donation->payment_method === 'card') {
            return [
                'success' => true,
                'external_id' => 'SIM-CARD-' . strtoupper(bin2hex(random_bytes(5))),
                'simulated' => true,
                'message' => 'Payment recorded (simulation)',
            ];
        }

        // M-Pesa / Tigo / Airtel — simulated STK force-push.
        return [
            'success' => true,
            'external_id' => 'SIM-PUSH-' . strtoupper(bin2hex(random_bytes(5))),
            'simulated' => true,
            'message' => 'Payment recorded (simulation)',
        ];
    }

    public function verify(Donation $donation): array
    {
        $confirmAfter = (int) config('gateway.simulated.confirm_seconds', 4);
        $elapsed = $donation->created_at->diffInSeconds(now());
        $paid = $elapsed >= $confirmAfter;

        return [
            'status' => $paid ? 'paid' : 'pending',
            'provider_ref' => $donation->mpesa_checkout_request_id,
        ];
    }

    public function isConfigured(): bool
    {
        return true;
    }

    public function name(): string
    {
        return 'simulated';
    }
}
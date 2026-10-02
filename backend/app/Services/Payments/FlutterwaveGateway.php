<?php

namespace App\Services\Payments;

use App\Models\Donation;
use App\Services\Payments\Contracts\PaymentGateway;
use RuntimeException;

/**
 * Real rails driver — P1 target.
 * Requires FLW_PUBLIC_KEY / FLW_SECRET_KEY. Implements STK push + card charge
 * + webhook verification against the Flutterwave API. Until credentials are
 * provisioned this driver refuses to run so the money-flow invariant holds.
 */
class FlutterwaveGateway implements PaymentGateway
{
    public function initiate(Donation $donation): array
    {
        $this->assertConfigured();

        // P1: implement Transfers/charges v3 API calls here (dale la STK push / card).
        throw new RuntimeException('FlutterwaveGateway::initiate not implemented yet (P1).');
    }

    public function verify(Donation $donation): array
    {
        $this->assertConfigured();

        // P1: query transaction status via GET /v3/transactions/{id}.
        throw new RuntimeException('FlutterwaveGateway::verify not implemented yet (P1).');
    }

    public function isConfigured(): bool
    {
        return config('gateway.flutterwave.secret_key') !== '';
    }

    public function name(): string
    {
        return 'flutterwave';
    }

    private function assertConfigured(): void
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException(
                'Flutterwave gateway is not configured. Set FLW_PUBLIC_KEY and FLW_SECRET_KEY (sandbox) in .env.'
            );
        }
    }
}
<?php

namespace App\Services\Payments\Contracts;

use App\Models\Donation;

interface PaymentGateway
{
    /**
     * Kick off a payment on the provider rails (STK push / card charge).
     *
     * @return array{success: bool, external_id: ?string, simulated: bool, message: string}
     */
    public function initiate(Donation $donation): array;

    /**
     * Poll the provider for settlement status.
     *
     * @return array{status: 'paid'|'pending'|'failed', provider_ref: ?string}
     */
    public function verify(Donation $donation): array;

    public function isConfigured(): bool;

    public function name(): string;
}
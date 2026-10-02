<?php

namespace App\Services\Payments;

use App\Services\Payments\Contracts\PaymentGateway;

class PaymentGatewayManager
{
    public function driver(?string $name = null): PaymentGateway
    {
        $name = $name ?? config('gateway.default', 'simulated');

        return match ($name) {
            'flutterwave' => new FlutterwaveGateway(),
            default => new SimulatedGateway(),
        };
    }
}
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default payment gateway driver
    |--------------------------------------------------------------------------
    | simulated  -> demo/sandbox: auto-confirms after a few seconds, no secrets.
    | flutterwave -> real rails (P1): STK push + card checkout + webhook.
    */

    'default' => env('PAYMENT_GATEWAY', 'simulated'),

    'simulated' => [
        'confirm_seconds' => env('GATEWAY_SIMULATED_CONFIRM_SECONDS', 4),
    ],

    'flutterwave' => [
        'public_key' => env('FLW_PUBLIC_KEY', ''),
        'secret_key' => env('FLW_SECRET_KEY', ''),
        'webhook_secret' => env('FLW_WEBHOOK_SECRET', ''),
        'sandbox' => env('FLW_SANDBOX', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Demo mode overrides (kwa maonyesho pekee)
    |--------------------------------------------------------------------------
    | allow_unfunded_approve=true  -> wawezesha approve ya invoice hata kama
    | item haina confirmed funds. Guard ya fedha inabaki ACTIVE production.
    | Hii NI LAZIMA iwe false kabla ya kuanza kutumia pesa halisi.
    */

    'demo' => [
        'allow_unfunded_approve' => (bool) env('DEMO_ALLOW_UNFUNDED_APPROVE', false),
    ],
];
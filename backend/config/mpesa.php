<?php

return [
    /*
    |--------------------------------------------------------------------------
    | M-PESA Daraja API (Lipa na M-Pesa Online / STK Push)
    |--------------------------------------------------------------------------
    |
    | Sifa hizi huja kutoka Daraja la Safaricom (Daraja la Wasanidi Programu).
    | Acha consumer_key na consumer_secret wakiwa 'undefined' ili kutumia
    | "simulation mode" - basi mchango unathibitishwa moja kwa moja bila kupiga
    | Safaricom. Hii hufanya mfumo kuwa rahisi kujaribu na kutengeneza demo,
    | na inabadilika kuwa halisi mara tu sifa halisi zinapowekwa kwenye .env.
    |
    */

    'environment' => env('MPESA_ENVIRONMENT', 'sandbox'), // sandbox | live

    'consumer_key' => env('MPESA_CONSUMER_KEY', ''),

    'consumer_secret' => env('MPESA_CONSUMER_SECRET', ''),

    // Passkey ya Lipa na M-Pesa (online).
    'passkey' => env('MPESA_PASSKEY', ''),

    // Nambari ya Biashara (shortcode) au Business number.
    'shortcode' => env('MPESA_SHORTCODE', '174379'),

    'till_number' => env('MPESA_TILL_NUMBER', '174379'),

    'transaction_type' => env('MPESA_TRANSACTION_TYPE', 'CustomerPayBillOnline'),

    'callback_url' => env('MPESA_CALLBACK_URL', 'http://127.0.0.1:8001/api/v1/webhooks/mpesa'),

    // Simulated: ikiwa hakuna sifa halisi, ongeza muda (sec) wa 'kuthibitisha'.
    'simulation_confirm_seconds' => (int) env('MPESA_SIMULATION_CONFIRM_SECONDS', 3),

    /**
     * Basi za Daraja (sandbox & live).
     */
    'base_url' => [
        'sandbox' => 'https://sandbox.safaricom.co.ke',
        'live' => 'https://api.safaricom.co.ke',
    ][env('MPESA_ENVIRONMENT', 'sandbox')],

    'endpoints' => [
        'token' => '/oauth/v1/generate?grant_type=client_credentials',
        'stkpush' => '/mpesa/stkpush/v1/processrequest',
        'query' => '/mpesa/stkpushquery/v1/query',
    ],
];

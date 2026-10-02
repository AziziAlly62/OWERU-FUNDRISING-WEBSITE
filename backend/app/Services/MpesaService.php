<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * M-PESA Daraja API - Lipa na M-Pesa Online (STK Push).
 *
 * Ikiwa hakuna sifa halisi za Daraja (consumer_key/secret) servisi hii
 * inaingia kwenye "simulation mode": inarudisha majibu yenye fomu sahihi
 * na "kuthibitisha" mchango baada ya sekunde chache bila kupiga Safaricom.
 * Hii inalinganisha na kushughulikia Daraja halisi bila sifa.
 */
class MpesaService
{
    protected string $baseUrl;
    protected string $consumerKey;
    protected string $consumerSecret;
    protected string $passkey;
    protected string $shortcode;
    protected string $tillNumber;
    protected string $transactionType;
    protected string $callbackUrl;

    public function __construct()
    {
        $this->baseUrl = config('mpesa.base_url');
        $this->consumerKey = (string) config('mpesa.consumer_key', '');
        $this->consumerSecret = (string) config('mpesa.consumer_secret', '');
        $this->passkey = (string) config('mpesa.passkey', '');
        $this->shortcode = (string) config('mpesa.shortcode', '174379');
        $this->tillNumber = (string) config('mpesa.till_number', '174379');
        $this->transactionType = (string) config('mpesa.transaction_type', 'CustomerPayBillOnline');
        $this->callbackUrl = (string) config('mpesa.callback_url', '');
    }

    /**
     * Je, tuna sifa halisi za kupiga Safaricom?
     */
    public function isConfigured(): bool
    {
        return $this->consumerKey !== '' && $this->consumerSecret !== '' && $this->passkey !== '';
    }

    /**
     * Pata access token kutoka OAuth ya Daraja.
     */
    protected function getAccessToken(): string
    {
        if (! $this->isConfigured()) {
            return 'SIMULATED_TOKEN';
        }

        $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
            ->withHeaders(['cache-control' => 'no-cache'])
            ->get($this->baseUrl . config('mpesa.endpoints.token'))
            ->json();

        $token = $response['access_token'] ?? '';
        if ($token === '') {
            Log::error('Mpesa: failed to get access token', $response);
        }

        return $token;
    }

    /**
     * Lipa na M-Pesa Online (STK Push).
     *
     * @param string $phone   Nambari ya simu kwenye mfumo wa kimataifa, mf. 2557XXXXXXXXX
     * @param float  $amount
     * @param string $accountReference  Hii inaweza kuwa donation id (max 12 chars)
     * @param string $transactionDesc
     * @return array{success: bool, checkout_request_id?: string, merchant_request_id?: string, message: string, simulated: bool}
     */
    public function stkPush(string $phone, float $amount, string $accountReference, string $transactionDesc = 'OWERU donation'): array
    {
        $phone = $this->normalizePhone($phone);
        $timestamp = date('YmdHis');
        $password = base64_encode($this->shortcode . $this->passkey . $timestamp);

        if (! $this->isConfigured()) {
            Log::info('Mpesa: simulation mode - STK simulated for ' . $phone);
            return [
                'success' => true,
                'checkout_request_id' => 'SIM-' . strtoupper(uniqid()),
                'merchant_request_id' => 'MRR-' . strtoupper(uniqid()),
                'message' => 'Simulation mode: STK push simulated.',
                'simulated' => true,
            ];
        }

        $payload = [
            'BusinessShortCode' => (int) $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => $this->transactionType,
            'Amount' => (int) round($amount),
            'PartyA' => (int) $phone,
            'PartyB' => (int) $this->shortcode,
            'PhoneNumber' => (int) $phone,
            'CallBackURL' => $this->callbackUrl,
            'AccountReference' => substr($accountReference, 0, 12),
            'TransactionDesc' => substr($transactionDesc, 0, 20),
        ];

        try {
            $response = Http::withToken($this->getAccessToken())
                ->post($this->baseUrl . config('mpesa.endpoints.stkpush'), $payload)
                ->json();
        } catch (\Throwable $e) {
            Log::error('Mpesa: STK push request failed: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Unable to reach M-Pesa: ' . $e->getMessage(), 'simulated' => false];
        }

        $success = ($response['ResponseCode'] ?? '') === '0';
        Log::info('Mpesa: STK push response', $response);

        return [
            'success' => $success,
            'checkout_request_id' => $response['CheckoutRequestID'] ?? null,
            'merchant_request_id' => $response['MerchantRequestID'] ?? null,
            'response_code' => $response['ResponseCode'] ?? null,
            'response_description' => $response['ResponseDescription'] ?? '',
            'customer_message' => $response['CustomerMessage'] ?? '',
            'message' => $response['ResponseDescription'] ?? 'M-Pesa request failed.',
            'simulated' => false,
        ];
    }

    /**
     * Uliza hali ya STK push (Daraja halisi pekee).
     */
    public function queryStatus(string $checkoutRequestId): array
    {
        if (! $this->isConfigured()) {
            return ['success' => true, 'result_code' => '0', 'result_desc' => 'Simulated success', 'simulated' => true];
        }

        $timestamp = date('YmdHis');
        $password = base64_encode($this->shortcode . $this->passkey . $timestamp);

        $payload = [
            'BusinessShortCode' => (int) $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'CheckoutRequestID' => $checkoutRequestId,
        ];

        $response = Http::withToken($this->getAccessToken())
            ->post($this->baseUrl . config('mpesa.endpoints.query'), $payload)
            ->json();

        return [
            'success' => ($response['ResultCode'] ?? '') === '0',
            'result_code' => $response['ResultCode'] ?? null,
            'result_desc' => $response['ResultDesc'] ?? '',
            'mpesa_receipt' => $response['MpesaReceiptNumber'] ?? null,
            'raw' => $response,
            'simulated' => false,
        ];
    }

    /**
     * Kubadilisha '+' na '0' kuwa mfumo wa kimataifa (255...).
     */
    public function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/\D+/', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '255' . substr($phone, 1);
        } elseif (str_starts_with($phone, '+')) {
            $phone = ltrim($phone, '+');
        }
        return $phone;
    }
}

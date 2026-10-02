<?php

namespace App\Services\Notifications;

use App\Services\Notifications\Contracts\NotificationDriver;
use Illuminate\Support\Facades\Log;

/**
 * SMS driver. Sandbox logs the message; at go-live wire a TZ aggregator
 * (e.g. Daraja SMS / Twilio / Beyonic) behind the same interface.
 */
class SmsNotificationDriver implements NotificationDriver
{
    public function send(string $channel, string $to, string $title, string $body): void
    {
        Log::channel('oweru_alerts')->info('SMS [' . $channel . '] to ' . ($to ?: '—') . ': ' . $title . ' — ' . $body);
    }

    public function name(): string
    {
        return 'sms';
    }
}
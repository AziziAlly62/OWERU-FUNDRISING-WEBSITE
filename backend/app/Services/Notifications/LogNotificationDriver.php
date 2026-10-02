<?php

namespace App\Services\Notifications;

use App\Services\Notifications\Contracts\NotificationDriver;
use Illuminate\Support\Facades\Log;

/**
 * Sandbox driver: prints every alert to the application log.
 * Honest default for the demo; swap to real SMTP/SMS at go-live.
 */
class LogNotificationDriver implements NotificationDriver
{
    public function send(string $channel, string $to, string $title, string $body): void
    {
        Log::channel('oweru_alerts')->info('ALERT [' . strtoupper($channel) . '] to ' . ($to ?: '—') . ': ' . $title . ' — ' . $body);
    }

    public function name(): string
    {
        return 'log';
    }
}
<?php

namespace App\Services\Notifications;

use App\Services\Notifications\Contracts\NotificationDriver;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Email driver. In sandbox it relies on the framework mailer
 * (MAIL_MAILER=log outputs to storage/logs), so no real mail is sent.
 * At go-live point MAIL_MAILER at a real SMTP (e.g. Mailgun/SES).
 */
class MailNotificationDriver implements NotificationDriver
{
    public function send(string $channel, string $to, string $title, string $body): void
    {
        if (! $to || ! str_contains($to, '@')) {
            Log::channel('oweru_alerts')->warning('MAIL skipped (no valid address) for ' . $title);
            return;
        }

        if (config('mail.default') === 'log' || ! $to) {
            Log::channel('oweru_alerts')->info('MAIL [' . $channel . '] would send to ' . $to . ': ' . $title . ' — ' . $body);
            return;
        }

        Mail::raw($body, function ($message) use ($to, $title) {
            $message->to($to)->subject('OWERU: ' . $title);
        });
    }

    public function name(): string
    {
        return 'mail';
    }
}
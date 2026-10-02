<?php

namespace App\Services\Notifications;

use App\Services\Notifications\Contracts\NotificationDriver;

class NotificationManager
{
    public function driver(?string $name = null): NotificationDriver
    {
        return match ($name ?? config('notifications.default', 'log')) {
            'mail' => new MailNotificationDriver(),
            'sms' => new SmsNotificationDriver(),
            default => new LogNotificationDriver(),
        };
    }

    /**
     * Route one alert through the configured channel stack.
     */
    public function send(string $channel, string $to, string $title, string $body): void
    {
        foreach ((array) config('notifications.channels', ['email' => 'mail', 'sms' => 'sms']) as $kind => $driver) {
            if ($channel === 'both' || $channel === $kind) {
                $this->driver($driver)->send($kind, $to, $title, $body);
            }
        }
    }
}
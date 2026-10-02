<?php

namespace App\Services\Notifications\Contracts;

interface NotificationDriver
{
    /**
     * @param array{email?: ?string, phone?: ?string} $to
     */
    public function send(string $channel, string $to, string $title, string $body): void;

    public function name(): string;
}
<?php

return [

    'default' => env('NOTIFICATION_DRIVER', 'log'),

    // Channel -> driver mapping. 'both' sends email + sms.
    'channels' => [
        'email' => env('NOTIFICATION_EMAIL_DRIVER', 'mail'),
        'sms' => env('NOTIFICATION_SMS_DRIVER', 'sms'),
    ],
];
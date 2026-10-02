<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Donation extends Model
{
    protected $fillable = [
        'item_id',
        'donor_id',
        'donor_name',
        'is_guest',
        'amount',
        'payment_reference',
        'payment_method',
        'network',
        'currency',
        'fx_rate',
        'amount_tzs',
        'card_last4',
        'card_brand',
        'status',
        'donated_at',
        'confirmed_at',
        'mpesa_phone',
        'mpesa_checkout_request_id',
        'mpesa_merchant_request_id',
        'mpesa_receipt',
        'mpesa_status',
    ];

    protected $casts = [
        'is_guest' => 'boolean',
        'donated_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'amount' => 'decimal:2',
        'fx_rate' => 'decimal:6',
        'amount_tzs' => 'decimal:2',
    ];

    public function item()
    {
        return $this->belongsTo(RequestItem::class, 'item_id');
    }

    public function donor()
    {
        return $this->belongsTo(User::class, 'donor_id');
    }
}

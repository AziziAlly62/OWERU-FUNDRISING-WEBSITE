<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    protected $fillable = [
        'item_id',
        'register_number',
        'model',
        'serial_number',
        'supplier_id',
        'invoice_id',
        'amount',
        'recipient_id',
        'location',
        'status',
        'delivery_date',
        'verified_date',
        'transfer_date',
        'warranty_until',
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'verified_date' => 'date',
        'transfer_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function item()
    {
        return $this->belongsTo(RequestItem::class, 'item_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    public function deliveryConfirmations()
    {
        return $this->hasMany(DeliveryConfirmation::class);
    }
}

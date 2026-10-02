<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'item_id',
        'supplier_id',
        'invoice_number',
        'amount',
        'status',
        'document_path',
        'paid_at',
        'paid_currency',
        'paid_amount',
        'receipt_url',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'approved_at' => 'datetime',
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function item()
    {
        return $this->belongsTo(RequestItem::class, 'item_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

}

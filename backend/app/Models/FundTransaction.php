<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FundTransaction extends Model
{
    protected $fillable = [
        'item_id',
        'type',
        'source_type',
        'source_id',
        'amount',
        'currency',
        'fx_rate',
        'amount_tzs',
        'balance_after',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fx_rate' => 'decimal:6',
        'amount_tzs' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    public function item()
    {
        return $this->belongsTo(RequestItem::class, 'item_id');
    }

    public function source()
    {
        return $this->morphTo();
    }

    public static function balanceForItem($itemId)
    {
        return (float) static::where('item_id', $itemId)
            ->sum(\DB::raw('CASE WHEN type = "credit" THEN amount ELSE -amount END'));
    }
}

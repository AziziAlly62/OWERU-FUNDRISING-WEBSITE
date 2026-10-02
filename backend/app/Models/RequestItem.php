<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestItem extends Model
{
    protected $fillable = [
        'request_id',
        'name',
        'sw_name',
        'description',
        'sw_description',
        'category',
        'item_kind',
        'target_amount',
        'share_price',
        'funding_deadline',
        'status',
    ];

    protected $casts = [
        'funding_deadline' => 'date',
        'target_amount' => 'decimal:2',
        'share_price' => 'decimal:2',
    ];

    protected $appends = ['shares_total', 'shares_funded', 'share_price_value'];

    public function request()
    {
        return $this->belongsTo(FundingRequest::class, 'request_id');
    }

    public function donations()
    {
        return $this->hasMany(Donation::class, 'item_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'item_id');
    }

    public function equipment()
    {
        return $this->hasOne(Equipment::class, 'item_id');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'item_id');
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class, 'request_item_id');
    }

    public function raisedAmount()
    {
        return (float) $this->donations()->where('status', 'confirmed')
            ->sum(\Illuminate\Support\Facades\DB::raw('COALESCE(amount_tzs, amount)'));
    }

    protected function effectiveSharePrice(): float
    {
        $target = (float) $this->target_amount;
        $stored = (float) ($this->share_price ?? 0);
        if ($stored > 0) return $stored;
        return (float) min(5000, max(2000, $target / 100));
    }

    public static function defaultSharePrice($target): float
    {
        $target = (float) $target;
        if ($target <= 0) return 2000;
        return (float) min(5000, max(2000, $target / 100));
    }

    public function getSharePriceValueAttribute()
    {
        return $this->effectiveSharePrice();
    }

    public function getSharesTotalAttribute()
    {
        $sp = $this->effectiveSharePrice();
        return max(1, (int) ceil((float) $this->target_amount / $sp));
    }

    public function getSharesFundedAttribute()
    {
        $sp = $this->effectiveSharePrice();
        return max(0, (int) floor($this->raisedAmount() / $sp));
    }
}

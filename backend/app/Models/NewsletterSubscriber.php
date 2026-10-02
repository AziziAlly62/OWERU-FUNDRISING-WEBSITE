<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsletterSubscriber extends Model
{
    protected $fillable = ['email', 'name', 'status', 'subscribed_at', 'ip_address'];

    protected function casts(): array
    {
        return ['subscribed_at' => 'datetime'];
    }

    public function scopeSubscribed($query)
    {
        return $query->where('status', 'subscribed');
    }
}

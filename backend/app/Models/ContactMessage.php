<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $table = 'contact_messages';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'organisation',
        'intent',
        'subject',
        'message',
        'details',
        'status',
        'ip_address',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function scopeUnread($query)
    {
        return $query->where('status', 'new');
    }

    public function scopeWithIntent($query, $intent)
    {
        return $query->where('intent', $intent);
    }
}

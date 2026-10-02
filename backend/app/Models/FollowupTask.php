<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FollowupTask extends Model
{
    protected $fillable = [
        'report_id',
        'status',
        'note',
        'created_by_id',
        'resolved_at',
        'resolved_by_id',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by_id');
    }
}
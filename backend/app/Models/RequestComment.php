<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequestComment extends Model
{
    use HasFactory;

    protected $fillable = ['request_id', 'author_id', 'author_name', 'body'];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function request()
    {
        return $this->belongsTo(FundingRequest::class, 'request_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
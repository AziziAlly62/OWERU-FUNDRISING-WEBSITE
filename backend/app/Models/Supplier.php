<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'contact_person',
        'contact_phone',
        'contact_email',
        'region',
        'verification_status',
    ];

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}

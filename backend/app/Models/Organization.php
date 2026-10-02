<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = [
        'name',
        'type',
        'region',
        'contact_email',
        'contact_phone',
        'verification_status',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function endorsements()
    {
        return $this->hasMany(Endorsement::class);
    }
}

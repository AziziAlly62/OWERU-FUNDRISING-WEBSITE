<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryConfirmation extends Model
{
    protected $fillable = [
        'equipment_id',
        'party',
        'confirmed_by',
        'notes',
        'evidence_path',
        'confirmed_at',
    ];

    protected $casts = [
        'confirmed_at' => 'datetime',
    ];

    public function equipment()
    {
        return $this->belongsTo(Equipment::class);
    }

    public function confirmer()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }
}
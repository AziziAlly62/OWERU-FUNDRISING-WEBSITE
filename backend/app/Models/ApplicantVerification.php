<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicantVerification extends Model
{
    public const STEPS = [
        'identity_verified' => 'National ID verified',
        'phone_verified' => 'Phone number verified',
        'residence_verified' => 'Residence confirmed',
        'reference_verified' => 'Church / organization reference confirmed',
        'documents_verified' => 'Supporting documents (letter, quotes) verified',
    ];

    protected $fillable = [
        'user_id',
        'national_id_number',
        'national_id_path',
        'phone',
        'region',
        'location',
        'status',
        'identity_verified',
        'phone_verified',
        'residence_verified',
        'reference_verified',
        'documents_verified',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'identity_verified' => 'boolean',
        'phone_verified' => 'boolean',
        'residence_verified' => 'boolean',
        'reference_verified' => 'boolean',
        'documents_verified' => 'boolean',
        'verified_at' => 'datetime',
    ];

    protected $appends = ['steps_completed'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getStepsCompletedAttribute(): array
    {
        $completed = 0;
        foreach (array_keys(self::STEPS) as $key) {
            if ($this->{$key}) $completed++;
        }
        return [
            'completed' => $completed,
            'total' => count(self::STEPS),
            'verified' => $this->status === 'verified',
        ];
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FundingRequest extends Model
{
    protected $table = 'requests';

    protected $fillable = [
        'applicant_id',
        'organization_id',
        'applicant_name',
        'applicant_phone',
        'applicant_email',
        'board_approved',
        'board_reviewed_at',
        'board_reviewed_by',
        'title',
        'sw_title',
        'story',
        'sw_story',
        'region',
        'church_name',
        'category',
        'program_type',
        'exposure_level',
        'status',
        'submitted_at',
        'letter_path',
        'letter_status',
        'letter_notes',
        'decision_note',
        'track_token',
    ];

    protected $hidden = ['track_token'];

    protected $casts = [
        'submitted_at' => 'datetime',
        'board_approved' => 'boolean',
        'board_reviewed_at' => 'datetime',
    ];

    protected $appends = ['approval_ready'];

    public function applicant()
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function items()
    {
        return $this->hasMany(RequestItem::class, 'request_id');
    }

    public function endorsements()
    {
        return $this->hasMany(Endorsement::class, 'request_id');
    }

    public function comments()
    {
        return $this->hasMany(RequestComment::class, 'request_id')->latest();
    }

    public function boardReviewer()
    {
        return $this->belongsTo(User::class, 'board_reviewed_by');
    }

    public function getApprovalReadyAttribute(): bool
    {
        if ($this->board_approved) {
            return true;
        }

        $verifiedApplicant = $this->applicant
            && $this->applicant->verification?->status === 'verified';

        $churchConfirmed = $this->endorsements()
            ->where('status', 'complete')
            ->exists();

        return (bool) ($verifiedApplicant || $churchConfirmed);
    }
}

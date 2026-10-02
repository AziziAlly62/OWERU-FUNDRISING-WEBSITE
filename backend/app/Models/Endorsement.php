<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Endorsement extends Model
{
    protected $fillable = [
        'request_id',
        'organization_id',
        'endorser_name',
        'status',
        'endorsed_date',
        'notes',
    ];

    protected $casts = [
        'endorsed_date' => 'date',
    ];

    public function request()
    {
        return $this->belongsTo(FundingRequest::class, 'request_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Automatically ask the linked church to confirm a newly submitted request,
     * so the church portal shows a pending confirmation immediately. Only
     * church-type organizations are asked (church confirmation is the trust
     * anchor for the Board). Idempotent: never duplicates a pending/complete ask.
     */
    public static function askChurch(FundingRequest $fundingRequest): ?Endorsement
    {
        $organizationId = $fundingRequest->organization_id;
        if (! $organizationId) {
            return null;
        }

        $organization = $fundingRequest->organization;
        if (! $organization || $organization->type !== 'church') {
            return null;
        }

        $existing = static::where('request_id', $fundingRequest->id)
            ->where('organization_id', $organizationId)
            ->whereIn('status', ['pending', 'complete'])
            ->first();

        if ($existing) {
            return $existing;
        }

        $endorsement = static::create([
            'request_id' => $fundingRequest->id,
            'organization_id' => $organizationId,
            'endorser_name' => $organization->name,
            'status' => 'pending',
            'notes' => null,
        ]);

        AuditLog::record('endorsement.created', 'Endorsement', $endorsement->id, null, $endorsement->toArray());

        if ($fundingRequest->applicant_id) {
            AppNotification::create([
                'user_id' => $fundingRequest->applicant_id,
                'type' => 'endorsement.pending',
                'title' => 'Church confirmation pending',
                'body' => 'Your church has been asked to confirm your request "' . $fundingRequest->title . '".',
                'url' => '/track/' . $fundingRequest->track_token,
            ]);
        }

        // Also notify the church's own portal users so the pending confirmation
        // is not missed (endorser deep-link: opens the church confirmation view).
        $endorserUsers = \App\Models\User::where('organization_id', $organizationId)
            ->where('role', 'endorser')
            ->pluck('id');

        foreach ($endorserUsers as $endorserId) {
            AppNotification::create([
                'user_id' => $endorserId,
                'type' => 'endorsement.pending',
                'title' => 'New request needs church confirmation',
                'body' => 'Please confirm request "' . $fundingRequest->title . '" so it can proceed to review.',
                'url' => '/portal/church',
            ]);
        }

        return $endorsement;
    }
}

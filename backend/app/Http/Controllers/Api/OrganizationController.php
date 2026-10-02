<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Organization;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function index(Request $request)
    {
        $isStaff = false;
        if ($u = auth('sanctum')->user()) {
            $isStaff = in_array($u->role, ['admin', 'manager'], true);
        }

        $query = Organization::orderBy('name')
            ->when($request->verified === '1', fn ($q) => $q->where('verification_status', 'verified'))
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"));

        $orgs = $query->paginate($request->per_page ?? 100)->through(function ($org) use ($isStaff) {
            if (! $isStaff) {
                $org->setHidden(array_merge($org->getHidden(), ['contact_email', 'contact_phone']));
            }
            return $org;
        });

        return response()->json($orgs);
    }

    public function show(Organization $organization)
    {
        $organization->setHidden(array_merge($organization->getHidden(), ['contact_email', 'contact_phone']));

        return response()->json($organization);
    }

    /**
     * The authenticated user's own organization (church portal status banner).
     */
    public function mine(Request $request)
    {
        $org = $request->user()->organization;

        abort_if(! $org, 404, 'Your account is not linked to an organization.');

        $org->setHidden(array_merge($org->getHidden(), ['contact_email', 'contact_phone']));

        return response()->json($org);
    }

    /**
     * Staff only: approve / reject a church organization (verification flow).
     */
    public function update(Request $request, Organization $organization)
    {
        $request->validate([
            'verification_status' => 'required|in:verified,rejected,pending',
            'region' => 'nullable|string|max:255',
        ]);

        $old = $organization->verification_status;

        $organization->update([
            'verification_status' => $request->verification_status,
            'region' => $request->region ?? $organization->region,
        ]);

        AuditLog::record('organization.verification', 'Organization', $organization->id, $old, $request->verification_status);

        return response()->json($organization);
    }
}

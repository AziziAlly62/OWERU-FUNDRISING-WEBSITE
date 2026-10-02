<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApplicantVerification;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ApplicantVerificationController extends Controller
{
    /**
     * Applicant hujaza au kubadilisha taarifa zake za uthibitisho (KYC).
     */
    public function submit(Request $request)
    {
        $request->validate([
            'national_id_number' => 'required|string|max:64',
            'phone' => 'required|string|max:20',
            'region' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'document' => 'nullable|array',
            'document.data' => 'required_with:document|string',
            'document.name' => 'nullable|string|max:255',
        ]);

        $document = $request->file ?: $request->input('document');
        $nationalIdPath = null;

        if ($request->has('document')) {
            $data = $request->input('document.data');
            $name = $request->input('document.name', 'national_id.' . (str_starts_with($data, 'data:application/pdf') ? 'pdf' : 'jpg'));
            $nationalIdPath = $this->storeBase64Document($data, $name);
        }

        $verification = ApplicantVerification::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'national_id_number' => $request->national_id_number,
                'phone' => $request->phone,
                'region' => $request->region,
                'location' => $request->location,
                'national_id_path' => $nationalIdPath ?: ApplicantVerification::where('user_id', $request->user()->id)->value('national_id_path'),
                'status' => 'pending',
                'identity_verified' => false,
                'phone_verified' => false,
                'residence_verified' => false,
                'reference_verified' => false,
                'documents_verified' => false,
                'verified_by' => null,
                'verified_at' => null,
            ]
        );

        if ($verification->wasRecentlyCreated) {
            AuditLog::record('verification.submitted', 'ApplicantVerification', $verification->id, null, $verification->toArray());
        } else {
            AuditLog::record('verification.updated', 'ApplicantVerification', $verification->id, null, $verification->toArray());
        }

        return response()->json($verification->load('user'), 201);
    }

    public function mine(Request $request)
    {
        $verification = ApplicantVerification::where('user_id', $request->user()->id)->first();

        return response()->json($verification ?? null);
    }

    public function index(Request $request)
    {
        $this->authorizeStaff($request);

        $verifications = ApplicantVerification::with('user')
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('updated_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($verifications);
    }

    /**
     * Admin DD checklist: tick the 5 steps, then approve / reject.
     */
    public function review(Request $request, ApplicantVerification $verification)
    {
        $this->authorizeStaff($request);

        $request->validate([
            'status' => 'nullable|in:in_review,verified,rejected',
            'identity_verified' => 'nullable|boolean',
            'phone_verified' => 'nullable|boolean',
            'residence_verified' => 'nullable|boolean',
            'reference_verified' => 'nullable|boolean',
            'documents_verified' => 'nullable|boolean',
        ]);

        $data = array_filter($request->only([
            'status', 'identity_verified', 'phone_verified', 'residence_verified', 'reference_verified', 'documents_verified',
        ]), fn ($v) => $v !== null);

        $data['verified_by'] = null;
        $data['verified_at'] = null;

        $nextStatus = $data['status'] ?? $verification->status;

        if ($nextStatus === 'verified') {
            $steps = ['identity_verified', 'phone_verified', 'residence_verified', 'reference_verified', 'documents_verified'];
            foreach ($steps as $step) {
                $data[$step] = (bool) ($data[$step] ?? $verification->{$step});
            }
            if (collect($steps)->every(fn ($s) => $data[$s])) {
                $data['verified_by'] = $request->user()->id;
                $data['verified_at'] = now();
            } else {
                abort(422, 'All 5 due-diligence steps must be checked before verifying the applicant.');
            }
        }

        $verification->update($data);

        AuditLog::record('verification.reviewed', 'ApplicantVerification', $verification->id, null, $verification->toArray());

        return response()->json($verification->load('user'));
    }

    protected function storeBase64Document(string $data, string $name): string
    {
        $mime = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        $ext = $mime[$this->mimeOf($data)] ?? 'bin';

        if (preg_match('/^data:([a-z0-9+\/.-]+);base64,(.+)$/i', $data, $m)) {
            $data = $m[2];
        }

        $path = 'verifications/' . uniqid('nv-', true) . '.' . $ext;
        Storage::disk('public')->put($path, base64_decode($data));

        return $path;
    }

    protected function mimeOf(string $data): string
    {
        if (preg_match('/^data:([a-z0-9+\/.-]+);base64,/', $data, $m)) {
            return $m[1];
        }
        return 'application/octet-stream';
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status === 'inactive') {
            return response()->json(['message' => 'Account is disabled.'], 403);
        }

        $token = $user->createToken('oweru-token')->plainTextToken;

        AuditLog::record('auth.login', 'User', $user->id);

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'sometimes|in:donor,applicant,endorser',
            'organization_id' => 'nullable|integer|exists:organizations,id',
            'church_name' => 'nullable|string|max:255',
            'church_region' => 'nullable|string|max:255',
        ]);

        // Security: public self-registration can only ever create low
        // privilege accounts (donor, applicant, church endorser). Staff
        // accounts (admin / manager) are created exclusively by an existing
        // admin through the staff user management endpoint, so a visitor can
        // never escalate themselves to staff. Applicants may register to
        // link (claim) a guest request they submitted with its private
        // tracking token.
        $role = $request->input('role', 'donor');

        // A church (endorser) account must be linked to a registered church.
        // The registrant may pick an existing church (organization_id) or
        // register their church for the first time (church_name), which
        // creates the organisation and immediately makes it available in the
        // applicant's church dropdown.
        $organizationId = $request->organization_id;
        if ($role === 'endorser') {
            if ($request->filled('organization_id')) {
                $org = \App\Models\Organization::find($organizationId);
            } else {
                $request->validate([
                    'church_name' => 'required|string|max:255',
                ]);
                $org = \App\Models\Organization::where('name', $request->church_name)->first();
                if (! $org) {
                    $org = \App\Models\Organization::create([
                        'name' => trim($request->church_name),
                        'type' => 'church',
                        'region' => $request->church_region,
                        'contact_email' => $request->email,
                        'contact_phone' => $request->phone ?? null,
                        'verification_status' => 'pending',
                    ]);
                }
                $organizationId = $org->id;
            }
            if (! $org || $org->type !== 'church') {
                abort(422, 'Church accounts must be linked to a registered church.');
            }
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'role' => $role,
            'status' => 'active',
            'organization_id' => $organizationId,
        ]);

        $token = $user->createToken('oweru-token')->plainTextToken;

        AuditLog::record('auth.register', 'User', $user->id, null, ['role' => $role, 'organization_id' => $organizationId]);

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ], 201);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Honest, identical response whether or not the account exists, so
        // the endpoint cannot be used to enumerate registered emails.
        $user = User::where('email', $request->email)->first();

        if ($user && $user->status === 'active') {
            try {
                $status = Password::sendResetLink(['email' => $request->email]);
            } catch (\Throwable $e) {
                $status = Password::INVALID_USER;
            }
        } else {
            $status = Password::RESET_LINK_SENT;
        }

        AuditLog::record('auth.forgot_password_requested', 'User', $user?->id ?? 0);

        $payload = ['message' => 'If that email is registered, a password reset link has been sent.'];

        // Demo-mode convenience: APP_ENV=local and log mailer, so show where
        // the reset token was written instead of pretending email was sent.
        if (app()->environment('local')) {
            $payload['status'] = ($status === Password::RESET_LINK_SENT) ? 'sent' : 'error';
            if ($user && $status === Password::RESET_LINK_SENT) {
                $payload['reset_token'] = app('auth.password.broker')->createToken($user);
            }
        }

        return response()->json($payload);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only(['email', 'token', 'password']),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
                'token' => [__($status)],
            ]);
        }

        $user = User::where('email', $request->email)->first();
        AuditLog::record('auth.password_reset', 'User', $user?->id ?? 0);

        return response()->json(['message' => 'Password updated. You can now sign in.']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        return response()->json($this->userPayload($request->user()));
    }

    protected function userPayload(User $user)
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'organization_id' => $user->organization_id,
        ];
    }
}

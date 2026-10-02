<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    protected function authorizeAdmin(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Only the main administrator can manage staff accounts.');
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $query = User::with('organization')
            ->whereIn('role', ['admin', 'manager', 'reviewer', 'endorser'])
            ->when($request->search, fn ($q) => $q->where(function ($w) use ($request) {
                $w->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->orderBy('role')
            ->orderBy('name');

        return response()->json($query->paginate($request->per_page ?? 100));
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,manager,reviewer,endorser',
            'status' => 'nullable|in:active,inactive',
            'organization_id' => 'nullable|integer|exists:organizations,id',
        ]);

        if ($data['role'] === 'endorser' && empty($data['organization_id'])) {
            throw ValidationException::withMessages([
                'organization_id' => ['A church account must be linked to a church.'],
            ]);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
            'status' => $data['status'] ?? 'active',
            'organization_id' => $data['organization_id'] ?? null,
        ]);

        AuditLog::record('user.created', 'User', $user->id, null, ['role' => $user->role]);

        return response()->json($this->payload($user), 201);
    }

    public function update(Request $request, User $user)
    {
        $this->authorizeAdmin($request);

        if (!in_array($user->role, ['admin', 'manager', 'reviewer', 'endorser'])) {
            abort(403, 'This account cannot be managed here.');
        }

        if ($user->id === $request->user()->id && ($request->input('status') === 'inactive' || $request->input('role') !== 'admin')) {
            throw ValidationException::withMessages([
                'user' => ['You cannot disable or demote your own account.'],
            ]);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'role' => 'sometimes|in:admin,manager,reviewer,endorser',
            'status' => 'sometimes|in:active,inactive',
            'organization_id' => 'nullable|integer|exists:organizations,id',
            'password' => 'nullable|string|min:8',
        ]);

        if (($data['role'] ?? $user->role) === 'endorser' && !$request->filled('organization_id')) {
            if (! $user->organization_id) {
                throw ValidationException::withMessages([
                    'organization_id' => ['A church account must be linked to a church.'],
                ]);
            }
        }

        if (array_key_exists('password', $data) && $data['password']) {
            $user->password = $data['password'];
            unset($data['password']);
        }

        $user->fill(array_intersect_key($data, array_flip(['name', 'role', 'status', 'organization_id'])))->save();

        AuditLog::record('user.updated', 'User', $user->id, null, $user->fresh()->toArray());

        return response()->json($this->payload($user->fresh('organization')));
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorizeAdmin($request);

        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => ['You cannot delete your own account.'],
            ]);
        }

        if (!in_array($user->role, ['admin', 'manager', 'reviewer', 'endorser'])) {
            abort(403, 'This account cannot be managed here.');
        }

        $user->delete();

        AuditLog::record('user.deleted', 'User', $user->id);

        return response()->json(['message' => 'Account deleted.'], 200);
    }

    public function resetPassword(Request $request, User $user)
    {
        $this->authorizeAdmin($request);

        if (!in_array($user->role, ['admin', 'manager', 'reviewer', 'endorser'])) {
            abort(403, 'This account cannot be managed here.');
        }

        $data = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->password = $data['password'];
        $user->save();
        $user->tokens()->delete();

        AuditLog::record('user.password_reset', 'User', $user->id);

        return response()->json(['message' => 'Password changed for ' . $user->name . '. All active sessions were revoked.']);
    }

    protected function payload(User $user)
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'organization_id' => $user->organization_id,
            'organization' => $user->organization ? ['id' => $user->organization->id, 'name' => $user->organization->name] : null,
            'created_at' => $user->created_at,
        ];
    }
}

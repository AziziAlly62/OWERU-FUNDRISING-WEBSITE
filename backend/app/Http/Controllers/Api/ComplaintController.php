<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Complaint;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'nullable|string|max:120',
            'contact' => 'nullable|string|max:190',
            'category' => 'nullable|string|in:general,safeguarding,financial|max:30',
            'message' => 'required|string|max:5000',
        ]);

        $complaint = Complaint::create([
            'name' => $data['name'] ?? null,
            'contact' => $data['contact'] ?? null,
            'category' => $data['category'] ?? 'general',
            'message' => $data['message'],
            'status' => 'open',
            'ip_address' => $request->ip(),
        ]);

        AuditLog::record('complaint.received', 'Complaint', $complaint->id, null, ['category' => $complaint->category, 'ip' => $complaint->ip_address]);

        return response()->json([
            'message' => 'Complaint received',
            'id' => $complaint->id,
        ], 201);
    }

    public function index(Request $request)
    {
        return response()->json(
            Complaint::orderBy('created_at', 'desc')
                ->paginate($request->per_page ?? 100)
        );
    }

    public function update(Request $request, Complaint $complaint)
    {
        $request->validate([
            'status' => 'required|string|in:open,in_progress,resolved',
        ]);

        $complaint->update(['status' => $request->status]);

        AuditLog::record('complaint.updated', 'Complaint', $complaint->id, null, ['status' => $request->status]);

        return response()->json($complaint);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = AppNotification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->per_page ?? 50));
    }

    public function markRead(Request $request, AppNotification $notification)
    {
        $this->authorizeOwner($notification, $request);
        $notification->update(['is_read' => true]);
        return response()->json($notification);
    }

    public function markAllRead(Request $request)
    {
        AppNotification::where('user_id', $request->user()->id)->update(['is_read' => true]);
        return response()->json(['ok' => true]);
    }

    private function authorizeOwner(AppNotification $notification, Request $request)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }
    }
}

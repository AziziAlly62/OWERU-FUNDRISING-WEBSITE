<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ContactMessage;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'nullable|string|max:120',
            'email' => 'nullable|email|max:190',
            'phone' => 'nullable|string|max:40',
            'organisation' => 'nullable|string|max:160',
            'intent' => 'nullable|string|in:partner,goods,volunteer',
            'subject' => 'nullable|string|max:160',
            // Required for a plain enquiry. For a partner/goods/volunteer form
            // the substance lives in `details`, so the generic message is
            // optional there and both cannot be empty.
            'message' => 'nullable|string|max:5000',
            'details' => 'nullable|string|max:5000',
        ]);

        if (blank($data['message'] ?? null) && blank($data['details'] ?? null)) {
            // Point at whichever box the visitor should have filled, so the
            // form can highlight it.
            $field = blank($data['details'] ?? null) ? 'details' : 'message';

            return response()->json([
                'message' => 'Please tell us how you would like to help.',
                'errors' => [$field => ['This field is required.']],
            ], 422);
        }

        // A message needs at least one way for us to reply to.
        if (empty($data['email'])) {
            return response()->json([
                'message' => 'Please provide an email address so we can reply.',
                'errors' => ['email' => ['An email address is required.']],
            ], 422);
        }

        $contact = ContactMessage::create([
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'organisation' => $data['organisation'] ?? null,
            'intent' => $data['intent'] ?? null,
            'subject' => $data['subject'] ?? null,
            // Nullable: when an intent is chosen the answers live in `details`
            // and there is nothing left to write in the generic box. The check
            // above guarantees at least one of the two is filled.
            'message' => $data['message'] ?? null,
            'details' => $data['details'] ?? null,
            'status' => 'new',
            'ip_address' => $request->ip(),
        ]);

        AuditLog::record('contact.received', 'ContactMessage', $contact->id, null, [
            'subject' => $contact->subject,
            'intent' => $contact->intent,
        ]);

        return response()->json([
            'message' => 'Message sent',
            'id' => $contact->id,
        ], 201);
    }

    public function index(Request $request)
    {
        $query = ContactMessage::orderBy('created_at', 'desc');

        // optional filters, so an inbox can separate the three intake types
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('intent')) {
            $query->withIntent($request->intent);
        }

        return response()->json($query->paginate($request->per_page ?? 100));
    }

    public function update(Request $request, ContactMessage $contactMessage)
    {
        $request->validate([
            'status' => 'required|string|in:new,read,replied',
        ]);

        $contactMessage->update(['status' => $request->status]);

        AuditLog::record('contact.updated', 'ContactMessage', $contactMessage->id, null, ['status' => $contactMessage->status]);

        return response()->json(['message' => 'Updated', 'contact' => $contactMessage]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class NewsletterController extends Controller
{
    /** Public signup from the About page newsletter bar. */
    public function store(Request $request)
    {
        // 'dns' is deliberately not used: it does a live MX lookup, which
        // fails on internal domains and offline servers. Matches the rule
        // already used by ContactController.
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:190'],
            'name'  => ['nullable', 'string', 'max:120'],
        ]);

        $email = Str::lower(trim($data['email']));

        $existing = NewsletterSubscriber::where('email', $email)->first();

        // Signing up twice is a normal thing to do, not an error worth
        // showing a red validation message for. Re-subscribe silently.
        if ($existing) {
            if ($existing->status !== 'subscribed') {
                $existing->update(['status' => 'subscribed', 'subscribed_at' => now()]);
            }

            return response()->json(['message' => 'You are already subscribed.'], 200);
        }

        $subscriber = NewsletterSubscriber::create([
            'email'         => $email,
            'name'          => $data['name'] ?? null,
            'status'        => 'subscribed',
            'subscribed_at' => now(),
            'ip_address'    => $request->ip(),
        ]);

        AuditLog::record('newsletter.subscribed', 'NewsletterSubscriber', $subscriber->id, null, [
            'email' => $subscriber->email,
        ]);

        RateLimiter::clear($request->ip());

        return response()->json([
            'message' => 'Subscribed. Thank you for keeping up with Oweru.',
            'id'      => $subscriber->id,
        ], 201);
    }
}

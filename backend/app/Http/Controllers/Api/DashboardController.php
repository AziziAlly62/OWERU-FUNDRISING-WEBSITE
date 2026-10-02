<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Donor dashboard aggregates. Everything is scoped to the signed-in
     * donor and only counts `confirmed` donations for money totals.
     */
    public function donor(Request $request)
    {
        $user = $request->user();
        $userId = $user->id;

        $confirmedCount = DB::table('donations')
            ->where('donor_id', $userId)->where('status', 'confirmed')->count();

        $confirmedTotal = (float) DB::table('donations')
            ->where('donor_id', $userId)->where('status', 'confirmed')
            ->sum(DB::raw('COALESCE(amount_tzs, amount)'));

        $pendingCount = DB::table('donations')
            ->where('donor_id', $userId)->where('status', 'pending')->count();

        $failedCount = DB::table('donations')
            ->where('donor_id', $userId)->whereIn('status', ['failed', 'cancelled', 'expired'])->count();

        $requestsFunded = (int) DB::table('donations as d')
            ->join('request_items as i', 'i.id', '=', 'd.item_id')
            ->where('d.donor_id', $userId)->where('d.status', 'confirmed')
            ->distinct()->count('i.request_id');

        $trend = [];
        for ($i = 29; $i >= 0; $i--) {
            $trend[now()->subDays($i)->toDateString()] = 0;
        }

        $rows = DB::table('donations')
            ->where('donor_id', $userId)->where('status', 'confirmed')
            ->where('donated_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw('DATE(donated_at) AS day, COUNT(*) AS c')
            ->groupBy(DB::raw('DATE(donated_at)'))
            ->get();

        foreach ($rows as $row) {
            if (isset($trend[$row->day])) {
                $trend[$row->day] = (int) $row->c;
            }
        }

        $byStatus = DB::table('donations')
            ->where('donor_id', $userId)
            ->selectRaw('status, COUNT(*) AS count, COALESCE(SUM(COALESCE(amount_tzs, amount)), 0) AS total')
            ->groupBy('status')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => ['status' => $r->status, 'count' => (int) $r->count, 'total' => (float) round($r->total, 0)])
            ->values();

        return response()->json([
            'confirmed_total' => round($confirmedTotal, 0),
            'confirmed_count' => (int) $confirmedCount,
            'pending_count' => (int) $pendingCount,
            'failed_count' => (int) $failedCount,
            'requests_funded' => $requestsFunded,
            'trend_30d' => [
                'labels' => array_keys($trend),
                'values' => array_values($trend),
            ],
            'by_status' => $byStatus,
        ]);
    }
}
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('request_items', function (Blueprint $table) {
            $table->decimal('share_price', 14, 2)->nullable()->after('target_amount');
        });

        // Backfill: share_price = target/100, clamped to the TZS 2,000–5,000 unit zone.
        // PHP-side computation keeps the migration portable across SQLite (tests) and MySQL.
        foreach (DB::table('request_items')->whereNotNull('target_amount')->get(['id', 'target_amount']) as $row) {
            $target = (float) $row->target_amount;
            $price = (float) min(5000, max(2000, $target / 100));
            DB::table('request_items')->where('id', $row->id)->update(['share_price' => $price]);
        }
    }

    public function down(): void
    {
        Schema::table('request_items', function (Blueprint $table) {
            $table->dropColumn(['share_price']);
        });
    }
};
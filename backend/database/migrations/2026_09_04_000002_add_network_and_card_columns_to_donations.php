<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->string('network')->nullable()->after('payment_method'); // mpesa | tigo | airtel | other
            $table->decimal('amount_tzs', 14, 2)->nullable()->after('fx_rate');
            $table->string('card_last4')->nullable()->after('network');
            $table->string('card_brand')->nullable()->after('card_last4');
        });
    }

    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropColumn(['network', 'amount_tzs', 'card_last4', 'card_brand']);
        });
    }
};
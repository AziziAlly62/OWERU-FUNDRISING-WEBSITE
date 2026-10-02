<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->string('mpesa_phone')->nullable()->after('payment_method');
            $table->string('mpesa_checkout_request_id')->nullable()->after('mpesa_phone');
            $table->string('mpesa_merchant_request_id')->nullable()->after('mpesa_checkout_request_id');
            $table->string('mpesa_receipt')->nullable()->after('mpesa_merchant_request_id');
            $table->string('mpesa_status')->default('none')->after('mpesa_receipt'); // none | pending_stk | paid | failed | cancelled
        });
    }

    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropColumn([
                'mpesa_phone',
                'mpesa_checkout_request_id',
                'mpesa_merchant_request_id',
                'mpesa_receipt',
                'mpesa_status',
            ]);
        });
    }
};

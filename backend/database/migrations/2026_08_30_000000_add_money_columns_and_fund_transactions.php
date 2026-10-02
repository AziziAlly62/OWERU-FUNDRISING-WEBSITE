<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('payment_reference');
            $table->string('currency')->default('TZS')->after('payment_method');
            $table->decimal('fx_rate', 12, 6)->default(1)->after('currency');
            $table->timestamp('confirmed_at')->nullable()->after('donated_at');
        });

        Schema::create('fund_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('request_items')->cascadeOnDelete();
            $table->enum('type', ['credit', 'debit']);
            $table->morphs('source'); // Donation (credit) | Invoice (debit)
            $table->decimal('amount', 14, 2);
            $table->string('currency')->default('TZS');
            $table->decimal('fx_rate', 12, 6)->default(1);
            $table->decimal('amount_tzs', 14, 2)->nullable();
            $table->decimal('balance_after', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fund_transactions');
        Schema::table('donations', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'currency', 'fx_rate', 'confirmed_at']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('request_items')->cascadeOnDelete();
            $table->string('register_number')->unique();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->decimal('amount', 14, 2)->nullable();
            $table->foreignId('recipient_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('location')->nullable();
            $table->string('status')->default('delivered'); // delivered | verified | in_use | in_repair | returned | transferred | lost
            $table->date('delivery_date')->nullable();
            $table->date('verified_date')->nullable();
            $table->date('transfer_date')->nullable();
            $table->string('warranty_until')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment');
    }
};

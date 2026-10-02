<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('requests')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->decimal('target_amount', 14, 2);
            $table->date('funding_deadline')->nullable();
            $table->string('status')->default('pending_funding'); // pending_funding | fully_funded | ordered | delivered | verified | in_use | in_repair | returned | transferred | lost
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_items');
    }
};

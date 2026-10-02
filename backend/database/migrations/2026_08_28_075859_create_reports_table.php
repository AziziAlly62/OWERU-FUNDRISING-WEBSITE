<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('request_items')->cascadeOnDelete();
            $table->foreignId('recipient_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type'); // delivery | 30_day | 90_day | incident
            $table->date('due_date')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->string('status')->default('not_submitted'); // not_submitted | submitted | overdue
            $table->text('content')->nullable();
            $table->string('evidence_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};

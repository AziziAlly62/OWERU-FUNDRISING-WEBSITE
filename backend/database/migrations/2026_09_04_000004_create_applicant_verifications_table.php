<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applicant_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('national_id_number')->nullable();
            $table->string('national_id_path')->nullable();
            $table->string('phone')->nullable();
            $table->string('region')->nullable();
            $table->string('location')->nullable();
            $table->string('status')->default('pending'); // pending|in_review|verified|rejected
            $table->boolean('identity_verified')->default(false);
            $table->boolean('phone_verified')->default(false);
            $table->boolean('residence_verified')->default(false);
            $table->boolean('reference_verified')->default(false);
            $table->boolean('documents_verified')->default(false);
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applicant_verifications');
    }
};
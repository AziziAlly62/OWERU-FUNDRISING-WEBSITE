<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Candidate rows filtered by status (applicant portal query: WHERE applicant_id = ? ORDER BY created_at DESC)
        Schema::table('requests', function (Blueprint $table) {
            $table->index(['applicant_id', 'status']);
        });

        // Admin filters donations solely by status (pending confirmation queue)
        Schema::table('donations', function (Blueprint $table) {
            $table->index('status');
        });

        // Notification inbox query: WHERE user_id = ? AND is_read = 0
        Schema::table('app_notifications', function (Blueprint $table) {
            $table->index(['user_id', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            $table->dropIndex(['applicant_id', 'status']);
        });

        Schema::table('donations', function (Blueprint $table) {
            $table->dropIndex('status');
        });

        Schema::table('app_notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_read']);
        });
    }
};
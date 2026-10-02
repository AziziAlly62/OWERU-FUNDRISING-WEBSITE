<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            $table->index(['status', 'created_at']);
        });

        Schema::table('request_items', function (Blueprint $table) {
            $table->index(['request_id', 'status']);
        });

        Schema::table('donations', function (Blueprint $table) {
            $table->index(['item_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
        });

        Schema::table('request_items', function (Blueprint $table) {
            $table->dropIndex(['request_id', 'status']);
        });

        Schema::table('donations', function (Blueprint $table) {
            $table->dropIndex(['item_id', 'status']);
        });
    }
};
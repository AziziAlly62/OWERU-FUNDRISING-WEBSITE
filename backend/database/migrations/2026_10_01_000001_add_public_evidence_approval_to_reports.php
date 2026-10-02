<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->boolean('public_evidence')->default(false)->after('evidence_path');
            $table->foreignId('evidence_approved_by')->nullable()->after('public_evidence')->constrained('users')->nullOnDelete();
            $table->timestamp('evidence_approved_at')->nullable()->after('evidence_approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('evidence_approved_by');
            $table->dropColumn(['public_evidence', 'evidence_approved_at']);
        });
    }
};
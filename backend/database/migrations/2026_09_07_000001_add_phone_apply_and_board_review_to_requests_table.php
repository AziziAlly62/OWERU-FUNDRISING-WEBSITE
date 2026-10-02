<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            $table->dropForeign(['applicant_id']);
        });

        Schema::table('requests', function (Blueprint $table) {
            $table->foreignId('applicant_id')->nullable()->change();
            $table->string('applicant_name')->nullable()->after('applicant_id');
            $table->string('applicant_phone')->nullable()->after('applicant_name');
            $table->string('applicant_email')->nullable()->after('applicant_phone');
            $table->boolean('board_approved')->default(false)->after('letter_status');
            $table->timestamp('board_reviewed_at')->nullable();
            $table->unsignedBigInteger('board_reviewed_by')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            $table->dropColumn(['applicant_name', 'applicant_phone', 'applicant_email', 'board_approved', 'board_reviewed_at', 'board_reviewed_by']);
        });

        Schema::table('requests', function (Blueprint $table) {
            $table->foreignId('applicant_id')->nullable(false)->change();
            $table->foreign('applicant_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });
    }
};
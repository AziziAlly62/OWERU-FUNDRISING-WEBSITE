<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('title');
            $table->string('sw_title')->nullable();
            $table->text('story')->nullable();
            $table->text('sw_story')->nullable();
            $table->string('region')->nullable();
            $table->string('category')->nullable();
            $table->string('exposure_level')->default('open'); // open | partial | protected
            $table->string('status')->default('draft'); // draft | submitted | endorsement_pending | under_review | more_info_needed | approved | published | funding_closed | procurement | delivered | active_reporting | closed
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requests');
    }
};

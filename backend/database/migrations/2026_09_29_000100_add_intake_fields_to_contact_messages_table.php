<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The public contact page is now the single intake point for the three removed
 * pages (partner, donate goods, volunteer). A free-text "subject" could not be
 * filtered or reported on, so the intent is stored as its own column and the
 * answers that only matter for a given intent go in `details`.
 *
 * All four columns are nullable: a plain enquiry still has to work, and the
 * older rows in the table do not have them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            // partner | goods | volunteer | null (general enquiry)
            $table->string('intent', 20)->nullable()->after('subject');
            $table->string('phone', 40)->nullable()->after('email');
            $table->string('organisation', 160)->nullable()->after('phone');
            $table->text('details')->nullable()->after('message');

            // the inbox lists newest first and filters by intent
            $table->index(['intent', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->dropIndex(['intent', 'created_at']);
            $table->dropColumn(['intent', 'phone', 'organisation', 'details']);
        });
    }
};

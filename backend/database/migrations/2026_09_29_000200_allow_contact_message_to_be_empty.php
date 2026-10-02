<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The partner, donate-goods and volunteer pages were removed, so the contact
 * form is now the single intake for those three. Each of them collects its
 * own questions in `details`, which means a visitor who picks one no longer
 * has anything to put in the generic `message` box.
 *
 * `message` was NOT NULL, which made those submissions impossible to save.
 * It becomes nullable here; the controller still refuses a submission where
 * both `message` and `details` are empty, so a contact row always has
 * something in it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->text('message')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Only safe if every row still has a message. Anything that came in
        // through an intent form has its content in `details`, so fold that
        // in before restoring the constraint.
        DB::table('contact_messages')
            ->whereNull('message')
            ->whereNotNull('details')
            ->update(['message' => DB::raw('details')]);

        Schema::table('contact_messages', function (Blueprint $table) {
            $table->text('message')->nullable(false)->change();
        });
    }
};

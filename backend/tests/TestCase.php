<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Hard guard: tests must NEVER touch the real `oweru` database.
        $this->assertTestDatabaseSafe();
    }

    /**
     * Tests run `migrate:fresh`, which wipes whatever database is connected.
     * Some contributors run `php artisan test` directly (ignoring phpunit.xml
     * DB vars) and destroy the dev database. Refuse loudly instead.
     */
    protected function assertTestDatabaseSafe(): void
    {
        $connection = config('database.default');
        $database = DB::connection($connection)->getDatabaseName();
        $allowed = in_array($database, ['oweru_testing', ':memory:'], true);
        $appEnv = config('app.env');

        if (!$allowed) {
            throw new RuntimeException(
                "Refusing to run tests against database '{$database}' (env: {$appEnv}). " .
                "Configure DB_DATABASE=oweru_testing (or :memory:) via phpunit.xml or --env."
            );
        }
    }
}
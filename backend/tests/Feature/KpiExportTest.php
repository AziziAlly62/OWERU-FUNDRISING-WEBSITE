<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KpiExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_kpi_requires_staff_auth(): void
    {
        $this->getJson('/api/v1/stats/kpi')->assertStatus(401);
    }

    public function test_export_requires_staff_auth(): void
    {
        $this->getJson('/api/v1/export/requests')->assertStatus(401);
    }

    public function test_kpi_returns_donor_metrics_for_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->getJson('/api/v1/stats/kpi')
            ->assertOk()
            ->assertJsonStructure([
                'donors' => ['total', 'repeat', 'retention_rate'],
                'donations' => ['count', 'avg', 'max', 'total', 'last_30d_count', 'last_30d_total'],
                'funding' => ['avg_days_to_close'],
                'fulfilment' => ['items_total', 'items_fulfilled', 'fully_funded_awaiting', 'fulfilment_rate'],
            ]);
    }

    public function test_export_returns_csv_attachment_for_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get('/api/v1/export/requests')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    public function test_export_rejects_unknown_type(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->getJson('/api/v1/export/nope')
            ->assertStatus(404);
    }
}
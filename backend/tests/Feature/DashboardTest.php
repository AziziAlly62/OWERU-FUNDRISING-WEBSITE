<?php

namespace Tests\Feature;

use App\Models\Donation;
use App\Models\FundingRequest;
use App\Models\RequestItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private function seedDonorDonations(): array
    {
        $donor = User::create([
            'name' => 'Donor',
            'email' => 'donor@test.tz',
            'password' => bcrypt('password'),
            'role' => 'donor',
            'status' => 'active',
        ]);

        $applicant = User::create([
            'name' => 'Neema',
            'email' => 'neema@test.tz',
            'password' => bcrypt('password'),
            'role' => 'applicant',
            'status' => 'active',
        ]);

        $request = FundingRequest::create([
            'applicant_id' => $applicant->id,
            'title' => 'Test request',
            'status' => 'published',
            'submitted_at' => now(),
        ]);

        $item = RequestItem::create([
            'request_id' => $request->id,
            'name' => 'Test item',
            'target_amount' => 500000,
            'share_price' => RequestItem::defaultSharePrice(500000),
            'status' => 'pending_funding',
        ]);

        Donation::create([
            'item_id' => $item->id,
            'donor_id' => $donor->id,
            'is_guest' => false,
            'amount' => 100000,
            'amount_tzs' => 100000,
            'payment_method' => 'mobile',
            'status' => 'confirmed',
            'donated_at' => now(),
        ]);
        Donation::create([
            'item_id' => $item->id,
            'donor_id' => $donor->id,
            'is_guest' => false,
            'amount' => 50000,
            'amount_tzs' => 50000,
            'payment_method' => 'mpesa',
            'status' => 'pending',
            'donated_at' => now(),
        ]);

        return [$donor, $item];
    }

    public function test_donor_dashboard_returns_only_confirmed_totals(): void
    {
        [$donor, $item] = $this->seedDonorDonations();

        $response = $this->actingAs($donor)->getJson('/api/v1/dashboard/donor')
            ->assertOk();

        $data = $response->json();

        $this->assertEquals(100000.0, $data['confirmed_total']);
        $this->assertSame(1, $data['confirmed_count']);
        $this->assertSame(1, $data['pending_count']);
        $this->assertSame(1, $data['requests_funded']);
        $this->assertCount(30, $data['trend_30d']['labels']);
        $this->assertCount(30, $data['trend_30d']['values']);
        $this->assertSame(1, array_sum($data['trend_30d']['values'] ?? []));
        $this->assertContains('confirmed', array_column($data['by_status'], 'status'));
    }

    public function test_donor_dashboard_excludes_other_donors_donations(): void
    {
        [$donor] = $this->seedDonorDonations();

        $other = User::create([
            'name' => 'Other',
            'email' => 'other@test.tz',
            'password' => bcrypt('password'),
            'role' => 'donor',
            'status' => 'active',
        ]);

        $response = $this->actingAs($other)->getJson('/api/v1/dashboard/donor')
            ->assertOk()
            ->json();

        $this->assertEquals(0.0, $response['confirmed_total']);
        $this->assertSame(0, $response['confirmed_count']);
    }

    public function test_kpi_includes_chart_blocks(): void
    {
        $this->seedDonorDonations();

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@test.tz',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/v1/stats/kpi')
            ->assertOk()
            ->json();

        $this->assertCount(30, $response['charts']['trend_30d']['labels']);
        $this->assertNotEmpty($response['charts']['by_status']);
        $this->assertNotEmpty($response['charts']['top_requests']);
        $this->assertGreaterThan(0, $response['charts']['top_requests'][0]['raised']);
    }
}
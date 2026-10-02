<?php

namespace Tests\Feature;

use App\Models\ApplicantVerification;
use App\Models\AuditLog;
use App\Models\Donation;
use App\Models\FundingRequest;
use App\Models\RequestItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class DonationFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['gateway.simulated.confirm_seconds' => 0]);
    }

    private function makeItem(float $target = 100000): RequestItem
    {
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

        return RequestItem::create([
            'request_id' => $request->id,
            'name' => 'Test item',
            'target_amount' => $target,
            'share_price' => RequestItem::defaultSharePrice($target),
            'status' => 'pending_funding',
        ]);
    }

    public function test_guest_mpesa_donation_creates_record_with_network_and_tzs(): void
    {
        $item = $this->makeItem();

        $response = $this->postJson('/api/v1/donations/fund', [
            'item_id' => $item->id,
            'amount' => 25000,
            'donor_name' => 'Guest Giver',
            'is_guest' => true,
            'payment_method' => 'mpesa',
            'network' => 'tigo',
            'mpesa_phone' => '0655551111',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('donations', [
            'item_id' => $item->id,
            'network' => 'tigo',
            'amount_tzs' => 25000.00,
            'payment_method' => 'mpesa',
        ]);
    }

    public function test_donation_above_remaining_target_is_rejected(): void
    {
        $item = $this->makeItem(50000);

        $response = $this->postJson('/api/v1/donations/fund', [
            'item_id' => $item->id,
            'amount' => 90000,
            'donor_name' => 'Over Giver',
            'is_guest' => true,
            'payment_method' => 'mobile',
            'payment_reference' => 'REF-OVERCAP',
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'This item only needs 50,000 TZS more. Please give 50,000 or less.']);
    }

    private function fundMpesaAndConfirm(int $itemId, float $amount, string $phone = '0745551111', string $ref = null): array
    {
        $response = $this->postJson('/api/v1/donations/fund', [
            'item_id' => $itemId,
            'amount' => $amount,
            'donor_name' => 'STK Giver',
            'is_guest' => true,
            'payment_method' => 'mpesa',
            'network' => 'mpesa',
            'mpesa_phone' => $phone,
        ]);
        $response->assertStatus(201);

        $donation = Donation::orderByDesc('id')->first();
        $this->getJson("/api/v1/donations/{$donation->id}/mpesa-status")->assertOk();
        $donation->refresh();

        return ['donation' => $donation, 'item' => RequestItem::find($itemId)];
    }

    public function test_exact_remaining_amount_is_accepted(): void
    {
        $item = $this->makeItem(50000);

        $this->fundMpesaAndConfirm($item->id, 20000);
        $this->fundMpesaAndConfirm($item->id, 30000);

        $item->refresh();
        $this->assertEquals('fully_funded', $item->status);
    }

    public function test_card_donation_records_fx_and_auto_confirms(): void
    {
        $item = $this->makeItem(500000);

        $response = $this->postJson('/api/v1/donations/fund', [
            'item_id' => $item->id,
            'amount' => 100,
            'donor_name' => 'Card Giver',
            'is_guest' => true,
            'payment_method' => 'card',
            'currency' => 'EUR',
            'fx_rate' => 2800,
            'card_last4' => '4242',
            'card_brand' => 'visa',
        ]);

        $response->assertStatus(201);
        $donation = Donation::where('amount_tzs', 280000.00)->first();
        $this->assertNotNull($donation);

        $status = $this->getJson("/api/v1/donations/{$donation->id}/mpesa-status")
            ->assertOk()
            ->json();

        $this->assertEquals('paid', $status['mpesa_status']);
        $this->assertEquals('confirmed', $status['donation_confirm']);
    }

    public function test_mpesa_validation_requires_phone_and_network(): void
    {
        $item = $this->makeItem();

        $this->postJson('/api/v1/donations/fund', [
            'item_id' => $item->id,
            'amount' => 5000,
            'donor_name' => 'X',
            'is_guest' => true,
            'payment_method' => 'mpesa',
            'network' => 'mpesa',
        ])->assertStatus(422);
    }

    public function test_publish_gate_requires_verified_applicant(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@test.tz',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $applicant = User::create([
            'name' => 'Unverified',
            'email' => 'unv@test.tz',
            'password' => bcrypt('password'),
            'role' => 'applicant',
            'status' => 'active',
        ]);

        $request = FundingRequest::create([
            'applicant_id' => $applicant->id,
            'title' => 'Gate request',
            'status' => 'under_review',
            'submitted_at' => now(),
        ]);

        // Unverified -> approved must be blocked.
        $this->actingAs($admin)->patchJson("/api/v1/requests/{$request->id}/status", [
            'status' => 'approved',
        ])->assertStatus(422);

        // Verify applicant, then approval is allowed.
        ApplicantVerification::create([
            'user_id' => $applicant->id,
            'national_id_number' => 'TZ-1',
            'phone' => '+255700000000',
            'status' => 'verified',
            'identity_verified' => true,
            'phone_verified' => true,
            'residence_verified' => true,
            'reference_verified' => true,
            'documents_verified' => true,
            'verified_by' => $admin->id,
            'verified_at' => now(),
        ]);

        $this->actingAs($admin)->patchJson("/api/v1/requests/{$request->id}/status", [
            'status' => 'approved',
        ])->assertOk();
    }

    public function test_confirmation_writes_audit_and_fund_transaction(): void
    {
        $item = $this->makeItem(200000);

        $result = $this->fundMpesaAndConfirm($item->id, 50000);
        $donation = $result['donation'];

        $this->assertTrue($donation->status === 'confirmed');
        $this->assertDatabaseHas('fund_transactions', ['source_id' => $donation->id]);
        $this->assertDatabaseHas('audit_logs', ['entity' => 'Donation', 'action' => 'donation.confirmed']);
    }
}
<?php

namespace Tests\Feature;

use App\Models\FundingRequest;
use App\Models\Report;
use App\Models\RequestItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReportPublicEvidenceTest extends TestCase
{
    use RefreshDatabase;

    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/q3sAAAAASUVORK5CYII=';

    private function makeReport(string $evidencePath): Report
    {
        $applicant = User::create([
            'name' => 'Report Applicant',
            'email' => 'report-applicant@example.test',
            'password' => bcrypt('password'),
            'role' => 'applicant',
            'status' => 'active',
        ]);

        $request = FundingRequest::create([
            'applicant_id' => $applicant->id,
            'title' => 'Delivery evidence test',
            'status' => 'published',
            'submitted_at' => now(),
        ]);

        $item = RequestItem::create([
            'request_id' => $request->id,
            'name' => 'Delivered item',
            'target_amount' => 100000,
            'share_price' => RequestItem::defaultSharePrice(100000),
            'status' => 'delivered',
        ]);

        return Report::create([
            'item_id' => $item->id,
            'recipient_id' => $applicant->id,
            'type' => 'delivery',
            'submitted_at' => now(),
            'status' => 'submitted',
            'content' => 'The item was delivered and installed.',
            'evidence_path' => $evidencePath,
        ]);
    }

    private function storePng(): string
    {
        Storage::disk('public')->put('reports/proof.png', base64_decode(self::PNG, true));
        return 'reports/proof.png';
    }

    public function test_unapproved_evidence_is_not_exposed_by_the_public_report_or_image_route(): void
    {
        Storage::fake('public');
        $report = $this->makeReport($this->storePng());

        $this->getJson('/api/v1/reports/public')
            ->assertOk()
            ->assertJsonPath('0.public_evidence', false)
            ->assertJsonPath('0.public_evidence_url', null)
            ->assertJsonMissingPath('0.evidence_path');

        $this->get('/api/v1/reports/' . $report->id . '/public-evidence')->assertNotFound();
    }

    public function test_staff_can_publish_an_image_and_revoke_public_access(): void
    {
        Storage::fake('public');
        $report = $this->makeReport($this->storePng());
        $admin = User::create([
            'name' => 'Evidence Reviewer',
            'email' => 'evidence-reviewer@example.test',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->patchJson('/api/v1/reports/' . $report->id, ['public_evidence' => true])
            ->assertOk()
            ->assertJsonPath('public_evidence', true)
            ->assertJsonPath('evidence_approved_by', $admin->id);

        $this->getJson('/api/v1/reports/public')
            ->assertOk()
            ->assertJsonPath('0.public_evidence', true)
            ->assertJsonPath('0.public_evidence_url', '/reports/' . $report->id . '/public-evidence');

        $this->get('/api/v1/reports/' . $report->id . '/public-evidence')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png')
            ->assertHeader('X-Content-Type-Options', 'nosniff');

        $this->actingAs($admin)
            ->patchJson('/api/v1/reports/' . $report->id, ['public_evidence' => false])
            ->assertOk()
            ->assertJsonPath('public_evidence', false)
            ->assertJsonPath('evidence_approved_by', null);

        $this->get('/api/v1/reports/' . $report->id . '/public-evidence')->assertNotFound();
    }

    public function test_approved_image_is_publicly_readable_without_authentication(): void
    {
        Storage::fake('public');
        $report = $this->makeReport($this->storePng());
        $admin = User::create([
            'name' => 'Evidence Reviewer',
            'email' => 'public-evidence-reviewer@example.test',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);
        $report->update([
            'public_evidence' => true,
            'evidence_approved_by' => $admin->id,
            'evidence_approved_at' => now(),
        ]);

        $this->assertGuest();
        $response = $this->get('/api/v1/reports/' . $report->id . '/public-evidence')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png');
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    public function test_pdf_evidence_cannot_be_approved_for_public_display(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('reports/private.pdf', '%PDF-1.4 private evidence');
        $report = $this->makeReport('reports/private.pdf');
        $admin = User::create([
            'name' => 'Evidence Reviewer',
            'email' => 'pdf-reviewer@example.test',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->patchJson('/api/v1/reports/' . $report->id, ['public_evidence' => true])
            ->assertUnprocessable();

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'public_evidence' => false,
            'evidence_approved_by' => null,
        ]);
        $this->get('/api/v1/reports/' . $report->id . '/public-evidence')->assertNotFound();
    }

    public function test_non_staff_cannot_approve_public_evidence(): void
    {
        Storage::fake('public');
        $report = $this->makeReport($this->storePng());
        $applicant = User::where('role', 'applicant')->firstOrFail();

        $this->actingAs($applicant)
            ->patchJson('/api/v1/reports/' . $report->id, ['public_evidence' => true])
            ->assertForbidden();

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'public_evidence' => false,
            'evidence_approved_by' => null,
        ]);
    }
}

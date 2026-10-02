<?php

namespace Database\Seeders;

use App\Models\Donation;
use App\Models\Endorsement;
use App\Models\Equipment;
use App\Models\FundingRequest;
use App\Models\Invoice;
use App\Models\Organization;
use App\Models\Report;
use App\Models\RequestItem;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = 'password';

        $admin = User::create([
            'name' => 'OWERU Admin',
            'email' => 'admin@oweru.org',
            'password' => Hash::make($password),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $clinic = Organization::create([
            'name' => 'Matumaini Health Clinic',
            'type' => 'clinic',
            'region' => 'Morogoro',
            'contact_email' => 'info@matumaini.org',
            'contact_phone' => '+255713000001',
            'verification_status' => 'verified',
        ]);

        $school = Organization::create([
            'name' => 'Juhudi Primary School',
            'type' => 'school',
            'region' => 'Mbeya',
            'contact_email' => 'info@juhudi.ac.tz',
            'contact_phone' => '+255714000002',
            'verification_status' => 'verified',
        ]);

        $church = Organization::create([
            'name' => 'Arusha Youth Mission',
            'type' => 'church',
            'region' => 'Arusha',
            'contact_email' => 'endorser@arushayouth.org',
            'contact_phone' => '+255717000006',
            'verification_status' => 'verified',
        ]);

        $endorser = User::create([
            'name' => 'Arusha Youth Mission (Endorser)',
            'email' => 'endorser@arushayouth.org',
            'password' => Hash::make($password),
            'role' => 'endorser',
            'status' => 'active',
            'organization_id' => $church->id,
        ]);

        $applicant = User::create([
            'name' => 'Neema Mwanga',
            'email' => 'neema@matumaini.org',
            'password' => Hash::make($password),
            'role' => 'applicant',
            'status' => 'active',
            'organization_id' => $clinic->id,
        ]);

        $donor = User::create([
            'name' => 'David Kimaro',
            'email' => 'donor@example.com',
            'password' => Hash::make($password),
            'role' => 'donor',
            'status' => 'active',
        ]);

        User::create([
            'name' => 'Baraka Shule',
            'email' => 'baraka@juhudi.ac.tz',
            'password' => Hash::make($password),
            'role' => 'recipient',
            'status' => 'active',
            'organization_id' => $school->id,
        ]);

        $supplierMed = Supplier::create([
            'name' => 'Duka la Vifaa vya Tiba Ltd',
            'contact_person' => 'James Mgonja',
            'contact_phone' => '+255715000004',
            'contact_email' => 'orders@dukatiba.co.tz',
            'region' => 'Dar es Salaam',
            'verification_status' => 'verified',
        ]);

        $supplierSch = Supplier::create([
            'name' => 'Shule Supplies Company',
            'contact_person' => 'Anna Kilangi',
            'contact_phone' => '+255716000005',
            'contact_email' => 'sales@shulesupplies.co.tz',
            'region' => 'Arusha',
            'verification_status' => 'verified',
        ]);

        $supplierUser = User::create([
            'name' => 'James Mgonja (Duka la Vifaa vya Tiba)',
            'email' => 'supplier@dukatiba.co.tz',
            'password' => Hash::make($password),
            'role' => 'supplier',
            'status' => 'active',
        ]);

        $req1 = FundingRequest::create([
            'applicant_id' => $applicant->id,
            'organization_id' => $clinic->id,
            'title' => 'Portable Ultrasound Machine',
            'sw_title' => 'Mashine ya Ultrasound ya Kubebeka',
            'story' => 'Our clinic serves over 15,000 people in Morogoro region but lacks an ultrasound machine. Pregnant women must travel 120km to the regional hospital for scans, often delaying critical care.',
            'sw_story' => 'Kliniki yetu inatumikia watu zaidi ya 15,000 wilayani Morogoro lakini haina mashine ya ultrasound. Wanawake wajawazito husafiri kilomita 120 kwenda hospitali ya mkoa kwa uchunguzi, mara nyingi wakichelewa kupata huduma muhimu.',
            'region' => 'Morogoro',
            'category' => 'Medical',
            'exposure_level' => 'open',
            'status' => 'published',
            'submitted_at' => now()->subDays(5),
        ]);

        $item1 = RequestItem::create([
            'request_id' => $req1->id,
            'name' => 'Portable Ultrasound Scanner',
            'sw_name' => 'Kifaa cha ultrasound kinachobebeka',
            'description' => 'A portable, battery-operated ultrasound scanner with 3.5MHz curvilinear probe for obstetric imaging.',
            'sw_description' => 'Kifaa cha ultrasound kinachobebeka na kutumia betri, chenye kichunguzi cha 3.5MHz kwa huduma za uzazi.',
            'category' => 'Medical Equipment',
            'target_amount' => 45000000,
            'funding_deadline' => now()->addMonths(3)->toDateString(),
            'status' => 'pending_funding',
        ]);

        $req2 = FundingRequest::create([
            'applicant_id' => $applicant->id,
            'organization_id' => $school->id,
            'title' => 'Science Laboratory Equipment',
            'sw_title' => 'Vifaa vya Maabara ya Sayansi',
            'story' => 'Juhudi Primary School has no functioning science lab. Students learn science only from textbooks without practical experiments, limiting their understanding and future STEM opportunities.',
            'sw_story' => 'Shule ya Msingi Juhudi haina maabara ya sayansi inayofanya kazi. Wanafunzi hujifunza sayansi kupitia vitabu pekee bila majaribio ya vitendo, jambo linalopunguza uelewa wao na fursa za baadaye za sayansi.',
            'region' => 'Mbeya',
            'category' => 'Education',
            'exposure_level' => 'open',
            'status' => 'published',
            'submitted_at' => now()->subDays(2),
        ]);

        $item2 = RequestItem::create([
            'request_id' => $req2->id,
            'name' => 'Microscope Set (x20)',
            'sw_name' => 'Seti ya hadubini (20)',
            'description' => 'Twenty laboratory microscopes with slides and prepared samples for primary school biology lessons.',
            'sw_description' => 'Hadubini 20 pamoja na vioo na vielelezo kwa masomo ya baiolojia ya shule ya msingi.',
            'category' => 'Lab Equipment',
            'target_amount' => 18000000,
            'funding_deadline' => now()->addMonths(2)->toDateString(),
            'status' => 'pending_funding',
        ]);

        $req3 = FundingRequest::create([
            'applicant_id' => $applicant->id,
            'organization_id' => $clinic->id,
            'title' => 'Maternal Delivery Beds',
            'sw_story' => 'Kliniki yetu inawahudumia wanawake wajawazito lakini tumeondoa vitanda vya zamani kutokana na kutu.',
            'sw_title' => 'Vitanda vya Kujifungua',
            'story' => 'Our clinic attends deliveries but the current beds are rusted and unsafe. New adjustable delivery beds will improve safety for mothers and midwives.',
            'region' => 'Morogoro',
            'category' => 'Medical',
            'exposure_level' => 'partial',
            'status' => 'approved',
            'submitted_at' => now()->subDays(12),
        ]);

        $item3 = RequestItem::create([
            'request_id' => $req3->id,
            'name' => 'Adjustable Delivery Beds (x3)',
            'sw_name' => 'Vitanda vya kujifungulia vinavyorekebishika (3)',
            'description' => 'Three adjustable, stainless-steel delivery beds suitable for rural clinic maternity wards.',
            'sw_description' => 'Vitanda vitatu vya kujifungulia vinavyorekebishika, vilivyotengenezwa kwa chuma cha pua kwa wodi za uzazi za kliniki za vijijini.',
            'category' => 'Medical Equipment',
            'target_amount' => 24000000,
            'funding_deadline' => now()->addMonths(1)->toDateString(),
            'status' => 'fully_funded',
        ]);

        Donation::create([
            'item_id' => $item1->id,
            'donor_id' => $donor->id,
            'donor_name' => $donor->name,
            'is_guest' => false,
            'amount' => 5000000,
            'payment_reference' => 'PAY-' . strtoupper(uniqid()),
            'status' => 'confirmed',
            'donated_at' => now()->subDays(4),
        ]);

        Donation::create([
            'item_id' => $item1->id,
            'donor_name' => 'Anonymous Supporter',
            'is_guest' => true,
            'amount' => 2500000,
            'payment_reference' => 'PAY-' . strtoupper(uniqid()),
            'status' => 'confirmed',
            'donated_at' => now()->subDays(3),
        ]);

        Donation::create([
            'item_id' => $item2->id,
            'donor_name' => 'Samweli of Arusha',
            'is_guest' => true,
            'amount' => 3000000,
            'payment_reference' => 'PAY-' . strtoupper(uniqid()),
            'status' => 'confirmed',
            'donated_at' => now()->subDays(2),
        ]);

        for ($i = 0; $i < 8; $i++) {
            Donation::create([
                'item_id' => $item3->id,
                'donor_name' => 'Guest Donor ' . ($i + 1),
                'is_guest' => true,
                'amount' => 3000000,
                'payment_reference' => 'PAY-' . strtoupper(uniqid()),
                'status' => 'confirmed',
                'donated_at' => now()->subDays(rand(1, 10)),
            ]);
        }

        $invoice = Invoice::create([
            'item_id' => $item3->id,
            'supplier_id' => $supplierMed->id,
            'invoice_number' => 'INV-' . strtoupper(uniqid()),
            'amount' => 23500000,
            'status' => 'paid',
            'paid_at' => now()->subDays(1),
        ]);

        Equipment::create([
            'item_id' => $item3->id,
            'register_number' => 'OWR-2026-0001',
            'model' => 'Manual Delivery Bed 3000',
            'serial_number' => 'MDB-3000-XYZ',
            'supplier_id' => $supplierMed->id,
            'invoice_id' => $invoice->id,
            'amount' => 23500000,
            'recipient_id' => $applicant->id,
            'location' => $clinic->name,
            'status' => 'in_use',
            'delivery_date' => now()->toDateString(),
            'verified_date' => now()->toDateString(),
            'warranty_until' => now()->addYears(2)->toDateString(),
        ]);

        Report::create([
            'item_id' => $item3->id,
            'recipient_id' => $applicant->id,
            'type' => 'delivery',
            'due_date' => now()->addDays(30)->toDateString(),
            'submitted_at' => now(),
            'status' => 'submitted',
            'content' => 'Delivery beds installed and in daily use at the maternity ward.',
        ]);

        Endorsement::create([
            'request_id' => $req1->id,
            'organization_id' => $clinic->id,
            'endorser_name' => 'Ministry of Health - Regional Office',
            'status' => 'complete',
            'endorsed_date' => now()->toDateString(),
            'notes' => 'Verified clinic needs and supporting documentation.',
        ]);

        $this->command->info('Database seeded successfully.');
    }
}

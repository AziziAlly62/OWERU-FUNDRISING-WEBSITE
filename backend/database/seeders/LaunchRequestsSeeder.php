<?php

namespace Database\Seeders;

use App\Models\ApplicantVerification;
use App\Models\Donation;
use App\Models\Endorsement;
use App\Models\FundingRequest;
use App\Models\Organization;
use App\Models\RequestItem;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Launch content (decision §13 #8): 5–8 endorsed + published requests,
 * quote-priced, with verified applicants + endorsements + partial donations.
 * Idempotent: safe to re-run on a seeded DB.
 */
class LaunchRequestsSeeder extends Seeder
{
    public function run(): void
    {
        $password = 'password';

        $orgs = [
            'imani' => Organization::firstOrCreate(['contact_email' => 'info@imani-dodoma.org'], [
                'name' => 'Imani Community Church',
                'type' => 'church',
                'region' => 'Dodoma',
                'contact_email' => 'info@imani-dodoma.org',
                'contact_phone' => '+255728000021',
                'verification_status' => 'verified',
            ]),
            'upendo' => Organization::firstOrCreate(['contact_email' => 'info@upendo-mwanza.org'], [
                'name' => 'Upendo Youth Centre',
                'type' => 'charity',
                'region' => 'Mwanza',
                'contact_email' => 'info@upendo-mwanza.org',
                'contact_phone' => '+255729000022',
                'verification_status' => 'verified',
            ]),
            'benki' => Organization::firstOrCreate(['contact_email' => 'info@benki-arusha.org'], [
                'name' => 'Benki AAC Church',
                'type' => 'church',
                'region' => 'Arusha',
                'contact_email' => 'info@benki-arusha.org',
                'contact_phone' => '+255730000023',
                'verification_status' => 'verified',
            ]),
        ];

        // Endorser accounts for the launch churches (idempotent).
        User::firstOrCreate(['email' => 'endorser@imani-dodoma.org'], [
            'name' => 'Imani Community Church (Endorser)',
            'password' => Hash::make($password),
            'role' => 'endorser',
            'status' => 'active',
            'organization_id' => $orgs['imani']->id,
        ]);
        User::firstOrCreate(['email' => 'endorser@benki-arusha.org'], [
            'name' => 'Benki AAC Church (Endorser)',
            'password' => Hash::make($password),
            'role' => 'endorser',
            'status' => 'active',
            'organization_id' => $orgs['benki']->id,
        ]);

        $applicants = [
            'mama' => User::firstOrCreate(['email' => 'mama@imani-dodoma.org'], [
                'name' => 'Upendo Mushi',
                'email' => 'mama@imani-dodoma.org',
                'password' => Hash::make($password),
                'role' => 'applicant',
                'status' => 'active',
                'organization_id' => $orgs['imani']->id,
            ]),
            'yosia' => User::firstOrCreate(['email' => 'yosia@upendo-mwanza.org'], [
                'name' => 'Yosia Mnanka',
                'email' => 'yosia@upendo-mwanza.org',
                'password' => Hash::make($password),
                'role' => 'applicant',
                'status' => 'active',
                'organization_id' => $orgs['upendo']->id,
            ]),
            'rehema' => User::firstOrCreate(['email' => 'rehema@benki-arusha.org'], [
                'name' => 'Rehema Kileo',
                'email' => 'rehema@benki-arusha.org',
                'password' => Hash::make($password),
                'role' => 'applicant',
                'status' => 'active',
                'organization_id' => $orgs['benki']->id,
            ]),
        ];

        // Verified KYC for every launching applicant (coherent with the publish gate).
        $applicantRegions = ['mama' => 'Dodoma', 'yosia' => 'Mwanza', 'rehema' => 'Arusha'];
        foreach ($applicants as $key => $app) {
            ApplicantVerification::updateOrCreate(['user_id' => $app['id']], [
                'national_id_number' => 'TZ-SD-' . chr(rand(65, 90)) . str_pad((string) rand(1, 999999), 6, '0', STR_PAD_LEFT),
                'phone' => '+2557' . rand(10000000, 99999999),
                'region' => $applicantRegions[$key],
                'location' => 'Seed District',
                'status' => 'verified',
                'identity_verified' => true,
                'phone_verified' => true,
                'residence_verified' => true,
                'reference_verified' => true,
                'documents_verified' => true,
                'verified_by' => User::where('role', 'admin')->value('id'),
                'verified_at' => now()->subDays(6),
            ]);
        }

        $requests = [
            [
                'applicant' => 'mama', 'org' => 'imani',
                'title' => 'Outdoor PA Sound System for Village Preaching',
                'sw_title' => 'Spika za Kutaniko kwa Mihadhara',
                'story' => 'Our evangelism team of 700 holds open-air meetings under a tree every week. A 500W battery PA system will let the preaching reach the whole village without hiring noisy generators.',
                'sw_story' => 'Kila wiki, timu yetu ya uinjilisti yenye watu 700 hukutana chini ya mti. Mfumo wa sauti wa 500W unaotumia betri utasaidia ujumbe wa Injili kuwafikia watu wengi zaidi kijijini bila kukodi jenereta lenye kelele.',
                'region' => 'Dodoma', 'category' => 'Sound Equipment', 'exposure' => 'open',
                'items' => [
                    ['name' => 'Portable PA System 500W (battery)', 'sw_name' => 'Mfumo wa sauti wa kubebeka wa 500W (betri)', 'description' => 'Battery-powered 500W public-address system for open-air meetings.', 'sw_description' => 'Mfumo wa sauti wa 500W unaotumia betri kwa mikutano ya wazi.', 'category' => 'Sound Equipment', 'qty' => 1, 'price' => 2600000],
                    ['name' => 'Wireless Microphones (x2)', 'sw_name' => 'Maikrofoni zisizotumia waya (2)', 'description' => 'Two wireless microphones for clear speech during community meetings.', 'sw_description' => 'Maikrofoni mbili zisizotumia waya kwa ajili ya kusikika vizuri kwenye mikutano ya jamii.', 'category' => 'Sound Equipment', 'qty' => 2, 'price' => 450000],
                ],
                'endorser' => 'Imani Community Church Council',
                'donations' => 485000,
            ],
            [
                'applicant' => 'mama', 'org' => 'imani',
                'title' => 'Solar Power for Outdoor Evangelistic Outreach',
                'sw_title' => 'Nishati ya Jua kwa Utume wa Nje',
                'story' => 'Repeated open-air meetings in villages without electricity need reliable power to project the Word and run the sound system. A 3.5kW solar kit keeps outreach running off-grid.',
                'sw_story' => 'Mikutano ya uinjilisti ya mara kwa mara hufanyika vijijini ambako hakuna umeme. Seti ya sola ya 3.5kW itatoa umeme wa kuendesha mfumo wa sauti na kusaidia huduma hizi kuendelea.',
                'region' => 'Dodoma', 'category' => 'Power Equipment', 'exposure' => 'partial',
                'items' => [
                    ['name' => 'Solar Kit 3.5kW (panels + inverter + batteries)', 'sw_name' => 'Seti ya sola ya 3.5kW (paneli, inverter na betri)', 'description' => '3.5kW solar kit with panels, inverter and batteries for off-grid meetings.', 'sw_description' => 'Seti ya sola ya 3.5kW yenye paneli, inverter na betri kwa mikutano isiyo na umeme wa gridi.', 'category' => 'Power Equipment', 'qty' => 1, 'price' => 8400000],
                ],
                'endorser' => 'Imani Community Church Council',
                'donations' => 1200000,
            ],
            [
                'applicant' => 'yosia', 'org' => 'upendo',
                'title' => 'Printing Press + Bibles for Distribution Outreach',
                'sw_title' => 'Uchapishaji na Biblia kwa Utume',
                'story' => 'We distribute Gospel materials at truck-stop and market outreach each month. A printing unit lets us produce tracts locally and travellers receive Bibles at a fraction of imported cost.',
                'sw_story' => 'Kila mwezi tunasambaza machapisho ya Injili kwenye vituo vya malori na masoko. Mashine ya uchapishaji itatuwezesha kuchapisha vipeperushi hapa nchini na kuwapatia wasafiri Biblia kwa gharama nafuu.',
                'region' => 'Mwanza', 'category' => 'Printing & Materials', 'exposure' => 'open',
                'items' => [
                    ['name' => 'Portable printing unit (printer + supplies)', 'sw_name' => 'Kifaa cha uchapishaji (printa na vifaa)', 'description' => 'Portable printer and essential supplies for producing outreach materials locally.', 'sw_description' => 'Printa inayobebeka na vifaa muhimu vya kuchapisha machapisho ya huduma hapa nchini.', 'category' => 'Printing & Materials', 'qty' => 1, 'price' => 1500000],
                    ['name' => 'Gospel tract paper & ink cartridge sets', 'sw_name' => 'Karatasi za vipeperushi vya Injili na katriji za wino', 'description' => 'Paper and ink supplies for printing Gospel tracts.', 'sw_description' => 'Karatasi na wino kwa ajili ya kuchapisha vipeperushi vya Injili.', 'category' => 'Printing & Materials', 'qty' => 20, 'price' => 45000],
                ],
                'endorser' => 'Upendo Youth Centre Board',
                'donations' => 620000,
            ],
            [
                'applicant' => 'rehema', 'org' => 'benki',
                'title' => 'Transport Van for Rural Outreach Campaigns',
                'sw_title' => 'Gari la Usafiri kwa Utume wa Vijijini',
                'story' => 'Our evangelism team travels to remote villages every month but unreliable hired transport cancels half our trips. A roadworthy 18-seater van will make outreach campaigns dependable.',
                'sw_story' => 'Kila mwezi timu yetu ya uinjilisti husafiri kwenda vijiji vya mbali, lakini usafiri wa kukodi usioaminika husababisha baadhi ya ziara kufutwa. Gari la viti 18 lililo katika hali nzuri litasaidia ziara hizi kufanyika kwa mpangilio.',
                'region' => 'Arusha', 'category' => 'Transport', 'exposure' => 'open',
                'items' => [
                    ['name' => '18-seater van (roadworthy + reg)', 'sw_name' => 'Gari la abiria 18, lililosajiliwa na linalofaa barabarani', 'description' => 'Roadworthy, registered 18-seater van for monthly rural outreach visits.', 'sw_description' => 'Gari la viti 18 lililosajiliwa na linalofaa barabarani kwa ziara za kila mwezi vijijini.', 'category' => 'Transport', 'qty' => 1, 'price' => 14500000],
                ],
                'endorser' => 'Benki AAC Church Pastor\u2019s Office',
                'donations' => 2250000,
            ],
            [
                'applicant' => 'rehema', 'org' => 'benki',
                'title' => 'Tents & Seating for Open-Air Gospel Campaigns',
                'sw_title' => 'Hema na Viti kwa Kampeni za Nje',
                'story' => 'Our annual open-air campaign hosts several hundred people but we lack weather cover and seating. Tents, benches and a transport canopy will shelter both the crowd and the PA equipment.',
                'sw_story' => 'Kampeni yetu ya kila mwaka ya Injili hukusanya mamia ya watu, lakini hatuna mahema wala viti vya kutosha. Mahema, madawati na kifuniko cha kusafirisha vifaa vitasaidia kulinda watu na mfumo wa sauti dhidi ya hali ya hewa.',
                'region' => 'Arusha', 'category' => 'Shelter', 'exposure' => 'open',
                'items' => [
                    ['name' => 'Large event tent (10m x 5m)', 'sw_name' => 'Hema kubwa la mikutano (mita 10 x 5)', 'description' => 'Large weather-resistant event tent for open-air community gatherings.', 'sw_description' => 'Hema kubwa linalokinga dhidi ya hali ya hewa kwa mikutano ya jamii ya wazi.', 'category' => 'Shelter', 'qty' => 2, 'price' => 1800000],
                    ['name' => 'Folding benches (seats 8 x2)', 'sw_name' => 'Madawati ya kukunjika (viti 8 kila moja)', 'description' => 'Folding benches that provide seating for community campaign attendees.', 'sw_description' => 'Madawati ya kukunjika kwa ajili ya watu wanaohudhuria mikutano ya jamii.', 'category' => 'Shelter', 'qty' => 10, 'price' => 120000],
                ],
                'endorser' => 'Benki AAC Church Pastor\u2019s Office',
                'donations' => 350000,
            ],
            [
                'applicant' => 'yosia', 'org' => 'upendo',
                'title' => 'Mobile Battery Chainsaws for Community Forestry Outreach',
                'sw_title' => 'Msumeno wa Kielektroniki kwa Utume wa Misitu',
                'story' => 'Our team serves farming communities clearing bush for shared meeting spaces and firewood hauling. Reliable battery chainsaws speed up service work and avoid petrol costs.',
                'sw_story' => 'Timu yetu hushirikiana na jamii za wakulima kusafisha maeneo ya mikutano na kusaidia kazi za kuni. Misumeno ya betri itawezesha kazi hizi kufanyika kwa ufanisi zaidi na kupunguza gharama za mafuta.',
                'region' => 'Mwanza', 'category' => 'Power Equipment', 'exposure' => 'open',
                'items' => [
                    ['name' => 'Battery chainsaw (with 2 spare batteries)', 'sw_name' => 'Msumeno wa betri wenye betri mbili za ziada', 'description' => 'Battery-powered chainsaw with two spare batteries for community forestry work.', 'sw_description' => 'Msumeno wa betri wenye betri mbili za ziada kwa kazi za huduma ya misitu katika jamii.', 'category' => 'Power Equipment', 'qty' => 2, 'price' => 850000],
                ],
                'endorser' => 'Upendo Youth Centre Board',
                'donations' => 1100000,
            ],
        ];

        $adminId = User::where('role', 'admin')->value('id');

        foreach ($requests as $k => $r) {
            $req = FundingRequest::firstOrCreate(
                ['title' => $r['title']],
                [
                    'applicant_id' => $applicants[$r['applicant']]->id,
                    'organization_id' => $orgs[$r['org']]->id,
                    'title' => $r['title'],
                    'sw_title' => $r['sw_title'],
                    'story' => $r['story'],
                    'sw_story' => $r['sw_story'] ?? $r['story'],
                    'region' => $r['region'],
                    'category' => $r['category'],
                    'program_type' => 'church_equipment',
                    'exposure_level' => $r['exposure'],
                    'letter_status' => 'approved',
                    'status' => 'published',
                    'submitted_at' => now()->subDays(20 - $k * 2),
                ]
            );

            if (! empty($r['sw_story']) && $req->sw_story !== $r['sw_story']) {
                $req->update(['sw_story' => $r['sw_story']]);
            }

            foreach ($r['items'] as $it) {
                $target = $it['qty'] * $it['price'];
                RequestItem::updateOrCreate(
                    ['request_id' => $req->id, 'name' => $it['name']],
                    [
                        'description' => 'Quote-priced from a vetted supplier.',
                        'sw_name' => $it['sw_name'] ?? null,
                        'sw_description' => $it['sw_description'] ?? null,
                        'category' => $it['category'],
                        'target_amount' => $target,
                        'share_price' => RequestItem::defaultSharePrice($target),
                        'funding_deadline' => now()->addMonths(2)->toDateString(),
                        'status' => 'pending_funding',
                    ]
                );
            }

            Endorsement::updateOrCreate(
                ['request_id' => $req->id, 'organization_id' => $orgs[$r['org']]->id],
                [
                    'endorser_name' => $r['endorser'],
                    'status' => 'complete',
                    'endorsed_date' => now()->subDays(8)->toDateString(),
                    'notes' => 'Endorsed after applicant verification review. Church letter on file.',
                ]
            );

            if ($r['donations'] > 0) {
                $item = $req->items()->first();
                if ($item) {
                    Donation::firstOrCreate(
                        ['payment_reference' => 'PAY-DEMO-' . $req->id . '-1'],
                        [
                            'item_id' => $item->id,
                            'donor_name' => 'Launch Supporter',
                            'is_guest' => true,
                            'amount' => $r['donations'],
                            'amount_tzs' => $r['donations'],
                            'payment_reference' => 'PAY-DEMO-' . $req->id . '-1',
                            'payment_method' => 'mobile',
                            'status' => 'confirmed',
                            'confirmed_at' => now()->subDays(3),
                            'mpesa_status' => 'paid',
                            'donated_at' => now()->subDays(3),
                        ]
                    );
                }
            }
        }

        $this->command->info('Launch requests seeded: ' . count($requests) . ' published, endorsed, quote-priced.');
    }
}
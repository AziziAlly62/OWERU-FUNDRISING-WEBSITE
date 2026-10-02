<?php

namespace Database\Seeders;

use App\Models\Report;
use App\Models\RequestItem;
use Illuminate\Database\Seeder;

class ExampleImpactReportsSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->error('Example impact reports can only be seeded in local or testing environments.');
            return;
        }

        $item = RequestItem::query()
            ->with('request')
            ->where('name', 'Adjustable Delivery Beds (x3)')
            ->first();

        if (! $item) {
            $this->command?->error('Seed the local demo database first; the delivery-bed example item was not found.');
            return;
        }

        $deliveredAt = now()->subDays(35);
        $followUpAt = now()->subDays(2);

        Report::updateOrCreate(
            ['item_id' => $item->id, 'type' => 'delivery'],
            [
                'recipient_id' => $item->request?->applicant_id,
                'submitted_at' => $deliveredAt,
                'status' => 'submitted',
                'content' => 'DEMO EXAMPLE: Three adjustable delivery beds were received at Matumaini Health Clinic and placed in service in the maternity ward.',
            ]
        );

        Report::updateOrCreate(
            ['item_id' => $item->id, 'type' => '30_day'],
            [
                'recipient_id' => $item->request?->applicant_id,
                'submitted_at' => $followUpAt,
                'status' => 'submitted',
                'content' => 'DEMO EXAMPLE: At the 30-day follow-up, the clinic confirmed the beds remained in daily use in the maternity ward.',
            ]
        );

        $this->command?->info('Local example impact reports seeded successfully.');
    }
}

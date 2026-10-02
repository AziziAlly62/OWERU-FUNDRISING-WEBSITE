<?php

namespace Database\Seeders;

use App\Models\FundingRequest;
use App\Models\RequestItem;
use Illuminate\Database\Seeder;

class SyncLaunchRequestSwahiliSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->error('Sample story translations can only be synced in local or testing environments.');
            return;
        }

        $stories = [
            'Outdoor PA Sound System for Village Preaching' => 'Kila wiki, timu yetu ya uinjilisti yenye watu 700 hukutana chini ya mti. Mfumo wa sauti wa 500W unaotumia betri utasaidia ujumbe wa Injili kuwafikia watu wengi zaidi kijijini bila kukodi jenereta lenye kelele.',
            'Solar Power for Outdoor Evangelistic Outreach' => 'Mikutano ya uinjilisti ya mara kwa mara hufanyika vijijini ambako hakuna umeme. Seti ya sola ya 3.5kW itatoa umeme wa kuendesha mfumo wa sauti na kusaidia huduma hizi kuendelea.',
            'Printing Press + Bibles for Distribution Outreach' => 'Kila mwezi tunasambaza machapisho ya Injili kwenye vituo vya malori na masoko. Mashine ya uchapishaji itatuwezesha kuchapisha vipeperushi hapa nchini na kuwapatia wasafiri Biblia kwa gharama nafuu.',
            'Transport Van for Rural Outreach Campaigns' => 'Kila mwezi timu yetu ya uinjilisti husafiri kwenda vijiji vya mbali, lakini usafiri wa kukodi usioaminika husababisha baadhi ya ziara kufutwa. Gari la viti 18 lililo katika hali nzuri litasaidia ziara hizi kufanyika kwa mpangilio.',
            'Tents & Seating for Open-Air Gospel Campaigns' => 'Kampeni yetu ya kila mwaka ya Injili hukusanya mamia ya watu, lakini hatuna mahema wala viti vya kutosha. Mahema, madawati na kifuniko cha kusafirisha vifaa vitasaidia kulinda watu na mfumo wa sauti dhidi ya hali ya hewa.',
            'Mobile Battery Chainsaws for Community Forestry Outreach' => 'Timu yetu hushirikiana na jamii za wakulima kusafisha maeneo ya mikutano na kusaidia kazi za kuni. Misumeno ya betri itawezesha kazi hizi kufanyika kwa ufanisi zaidi na kupunguza gharama za mafuta.',
        ];

        $items = [
            'Portable PA System 500W (battery)' => ['Mfumo wa sauti wa kubebeka wa 500W (betri)', 'Mfumo wa sauti wa 500W unaotumia betri kwa mikutano ya wazi.'],
            'Wireless Microphones (x2)' => ['Maikrofoni zisizotumia waya (2)', 'Maikrofoni mbili zisizotumia waya kwa ajili ya mikutano ya jamii.'],
            'Solar Kit 3.5kW (panels + inverter + batteries)' => ['Seti ya sola ya 3.5kW (paneli, inverter na betri)', 'Seti ya sola ya 3.5kW kwa mikutano ya vijijini isiyo na umeme wa gridi.'],
            'Portable printing unit (printer + supplies)' => ['Kifaa cha uchapishaji (printa na vifaa)', 'Printa inayobebeka na vifaa muhimu vya kuchapisha machapisho hapa nchini.'],
            'Gospel tract paper & ink cartridge sets' => ['Karatasi za vipeperushi vya Injili na katriji za wino', 'Karatasi na wino kwa ajili ya kuchapisha vipeperushi vya Injili.'],
            '18-seater van (roadworthy + reg)' => ['Gari la abiria 18, lililosajiliwa na linalofaa barabarani', 'Gari la viti 18 kwa ziara za kila mwezi katika vijiji vya mbali.'],
            'Large event tent (10m x 5m)' => ['Hema kubwa la mikutano (mita 10 x 5)', 'Hema linalokinga watu dhidi ya hali ya hewa wakati wa mikutano ya wazi.'],
            'Folding benches (seats 8 x2)' => ['Madawati ya kukunjika (viti 8 kila moja)', 'Madawati ya kukunjika kwa ajili ya watu wanaohudhuria mikutano ya jamii.'],
            'Battery chainsaw (with 2 spare batteries)' => ['Msumeno wa betri wenye betri mbili za ziada', 'Msumeno wa betri kwa kazi za huduma ya misitu katika jamii.'],
        ];

        $updated = 0;
        foreach ($stories as $title => $story) {
            $updated += FundingRequest::where('title', $title)->update(['sw_story' => $story]);
        }

        $translatedItems = 0;
        foreach ($items as $name => [$swName, $swDescription]) {
            $translatedItems += RequestItem::where('name', $name)->update([
                'sw_name' => $swName,
                'sw_description' => $swDescription,
            ]);
        }

        $this->command?->info("Updated Swahili stories for {$updated} launch requests and translated {$translatedItems} items.");
    }
}

<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

try {
  if (!Schema::hasTable('requests')) {
    Schema::create('requests', function (Blueprint $t) {
      $t->id();
      $t->string('title');
      $t->string('category')->nullable();
      $t->string('status')->default('open');
      $t->string('church_name')->nullable();
      $t->string('region')->nullable();
      $t->text('story')->nullable();
      $t->decimal('target_amount', 14, 2)->default(0);
      $t->decimal('amount_raised', 14, 2)->default(0);
      $t->date('funding_deadline')->nullable();
      $t->timestamps();
    });
    $r1 = DB::table('requests')->insertGetId([
      'title' => 'Hosteli ya Chuo cha Kanisa',
      'category' => 'Elimu',
      'status' => 'in-progress',
      'church_name' => 'Kanisa la Mt. Fransisko',
      'region' => 'Dar es Salaam',
      'target_amount' => 15000000,
      'amount_raised' => 6000000,
      'funding_deadline' => '2026-12-31',
    ]);
    DB::table('requests')->insert([
      ['title' => 'Bomba la Maji Kijijini', 'category' => 'Maji', 'status' => 'in-progress', 'church_name' => 'Kanisa Huruma', 'region' => 'Mwanza', 'target_amount' => 8000000, 'amount_raised' => 2500000, 'funding_deadline' => '2026-11-30'],
      ['title' => 'Chakula cha Wikendi', 'category' => 'Chakula', 'status' => 'open', 'church_name' => 'Kanisa Njombe', 'region' => 'Njombe', 'target_amount' => 2500000, 'amount_raised' => 750000, 'funding_deadline' => '2026-11-15'],
      ['title' => 'Vifaa vya Shule', 'category' => 'Elimu', 'status' => 'in-progress', 'church_name' => 'Kanisa Arusha', 'region' => 'Arusha', 'target_amount' => 6000000, 'amount_raised' => 3000000, 'funding_deadline' => '2026-12-01'],
      ['title' => 'Madirisha na Paa kwa Jengo la Kanisa', 'category' => 'Ujenzi', 'status' => 'in-progress', 'church_name' => 'Kanisa Mbeya', 'region' => 'Mbeya', 'target_amount' => 20000000, 'amount_raised' => 8000000, 'funding_deadline' => '2027-01-15'],
      ['title' => 'Kifaa cha Kupimia Damu', 'category' => 'Afya', 'status' => 'open', 'church_name' => 'Kanisa Dodoma', 'region' => 'Dodoma', 'target_amount' => 12000000, 'amount_raised' => 0, 'funding_deadline' => '2027-02-28'],
    ]);
    echo 'requests created=' . DB::table('requests')->count() . PHP_EOL;
  } else {
    echo 'requests exists=' . DB::table('requests')->count() . PHP_EOL;
  }

  if (!Schema::hasTable('items')) {
    Schema::create('items', function (Blueprint $t) {
      $t->id();
      $t->unsignedBigInteger('request_id')->nullable();
      $t->string('name');
      $t->text('description')->nullable();
      $t->string('category')->nullable();
      $t->decimal('target_amount', 14, 2)->default(0);
      $t->decimal('amount_raised', 14, 2)->default(0);
      $t->string('status')->default('in-progress');
      $t->date('fund_deadline')->nullable();
      $t->timestamps();
    });
    DB::table('items')->insert([
      ['request_id' => 1, 'name' => 'Madawati 40', 'description' => 'Madawati ya bweni', 'category' => 'Fanicha', 'target_amount' => 6000000, 'amount_raised' => 3000000, 'status' => 'in-progress'],
      ['request_id' => 1, 'name' => 'Vitabu 200', 'description' => 'Vitabu vya shule', 'category' => 'Vitabu', 'target_amount' => 4000000, 'amount_raised' => 1000000, 'status' => 'in-progress'],
      ['request_id' => 2, 'name' => 'Bomba na Vipuri', 'description' => 'Mrija kuu wa maji', 'category' => 'Maji', 'target_amount' => 5000000, 'amount_raised' => 1900000, 'status' => 'in-progress'],
      ['request_id' => 4, 'name' => 'Seti za Maabara', 'description' => 'Vifaa vya sayansi', 'category' => 'Elimu', 'target_amount' => 3000000, 'amount_raised' => 1500000, 'status' => 'in-progress'],
      ['request_id' => 5, 'name' => 'Mbao na Karatasi', 'description' => 'Nyenzo za paa', 'category' => 'Fanicha', 'target_amount' => 9000000, 'amount_raised' => 3500000, 'status' => 'in-progress'],
      ['request_id' => 6, 'name' => 'Kifaa cha Glukosi Damu', 'description' => 'Kifaa cha kupimia sukari', 'category' => 'Afya', 'target_amount' => 7000000, 'amount_raised' => 0, 'status' => 'in-progress'],
    ]);
    echo 'items created=6' . PHP_EOL;
  } else {
    echo 'items exists=' . DB::table('items')->count() . PHP_EOL;
  }

  if (!Schema::hasTable('donations')) {
    Schema::create('donations', function (Blueprint $t) {
      $t->id();
      $t->unsignedBigInteger('request_id')->nullable();
      $t->unsignedBigInteger('item_id')->nullable();
      $t->string('donor_name')->nullable();
      $t->decimal('amount', 14, 2)->default(0);
      $t->string('currency')->default('TZS');
      $t->string('status')->default('confirmed');
      $t->timestamps();
    });
    DB::table('donations')->insert([
      ['request_id' => 1, 'item_id' => 1, 'donor_name' => 'Mfadhili A', 'amount' => 2000000, 'currency' => 'TZS', 'status' => 'confirmed'],
      ['request_id' => 1, 'item_id' => 2, 'donor_name' => 'Mfadhili B', 'amount' => 1000000, 'currency' => 'TZS', 'status' => 'confirmed'],
      ['request_id' => 2, 'item_id' => 3, 'donor_name' => 'Mfadhili C', 'amount' => 1900000, 'currency' => 'TZS', 'status' => 'confirmed'],
      ['request_id' => 4, 'item_id' => 4, 'donor_name' => 'Mfadhili D', 'amount' => 1500000, 'currency' => 'TZS', 'status' => 'confirmed'],
      ['request_id' => 5, 'item_id' => 5, 'donor_name' => 'Mfadhili E', 'amount' => 1000000, 'currency' => 'TZS', 'status' => 'confirmed'],
      ['request_id' => 3, 'item_id' => null, 'donor_name' => 'Mfadhili F', 'amount' => 750000, 'currency' => 'TZS', 'status' => 'confirmed'],
    ]);
    echo 'donations created=6' . PHP_EOL;
  } else {
    echo 'donations exists=' . DB::table('donations')->count() . PHP_EOL;
  }

  echo PHP_EOL . 'FINAL: requests=' . DB::table('requests')->count()
     . ' items=' . DB::table('items')->count()
     . ' donations=' . DB::table('donations')->count() . PHP_EOL;
} catch (\Throwable $e) {
  echo 'FAIL: ' . $e->getMessage() . PHP_EOL;
}

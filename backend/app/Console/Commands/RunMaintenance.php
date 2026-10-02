<?php

namespace App\Console\Commands;

use App\Services\MaintenanceService;
use Illuminate\Console\Command;

class RunMaintenance extends Command
{
    protected $signature = 'app:maintenance';

    protected $description = 'Run time-driven maintenance: overdue reports, funding-window closure and stale donation expiry.';

    public function handle(): int
    {
        $results = app(MaintenanceService::class)->runAll();

        foreach ($results as $key => $count) {
            $this->info(sprintf('%-20s %d', str_replace('_', ' ', $key), $count));
        }

        return self::SUCCESS;
    }
}
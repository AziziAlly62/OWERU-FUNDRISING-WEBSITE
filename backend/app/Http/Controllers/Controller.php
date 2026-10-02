<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    protected function authorizeStaff(Request $request): void
    {
        if (! in_array($request->user()->role, ['admin', 'manager'], true)) {
            abort(403, 'You do not have permission to perform this action.');
        }
    }
}

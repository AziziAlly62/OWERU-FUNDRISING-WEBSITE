<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\ApplicantVerificationController;
use App\Http\Controllers\Api\ComplaintController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DonationController;
use App\Http\Controllers\Api\EndorsementController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\NewsletterController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\QuoteController;
use App\Http\Controllers\Api\StatsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Public (browsable transparency data only)
    Route::get('organizations', [OrganizationController::class, 'index']);
    Route::get('requests/published', [RequestController::class, 'published']);
    Route::get('requests/featured', [RequestController::class, 'featured']);
    Route::get('requests/overview', [StatsController::class, 'overview']);
    Route::get('reports/public', [ReportController::class, 'publicIndex']);
    Route::get('reports/{report}/public-evidence', [ReportController::class, 'publicEvidence']);
    Route::get('requests/track/{trackToken}', [RequestController::class, 'track']);
    Route::get('requests/{requestItem}', [RequestController::class, 'show'])->whereNumber('requestItem');
    Route::post('donations/fund', [DonationController::class, 'fund'])->middleware('throttle:10,1');
    Route::post('complaints', [ComplaintController::class, 'store'])->middleware('throttle:10,1');
    Route::post('contact', [ContactController::class, 'store'])->middleware('throttle:6,1');
    Route::post('newsletter', [NewsletterController::class, 'store'])->middleware('throttle:5,1');
    Route::get('donations/total', [DonationController::class, 'total']);
    Route::get('donations/{donation}/mpesa-status', [DonationController::class, 'mpesaStatus'])->middleware('throttle:30,1');
    Route::post('webhooks/mpesa', [DonationController::class, 'mpesaCallback']);
    Route::get('invoices/ledger', [InvoiceController::class, 'ledger']);
    Route::get('letters/{requestItem}', [RequestController::class, 'viewLetter'])->whereNumber('requestItem');

    // Phone-only application (guests can apply without a permanent account)
    Route::post('requests', [RequestController::class, 'store'])->middleware('throttle:20,1');

    // Public comment thread on a funding request
    Route::post('requests/{requestItem}/comments', [RequestController::class, 'storeComment'])->middleware('throttle:10,1');

    // Auth (rate limited)
    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:5,10');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

// Authenticated (any registered role)
    Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::get('organizations/mine', [OrganizationController::class, 'mine']);

        // Donations: staff see all, donors only their own
        Route::get('donations', [DonationController::class, 'index']);

        // Requests: scoped per role inside the controller
        Route::get('requests', [RequestController::class, 'index']);
        Route::get('requests/mine', [RequestController::class, 'mine']);
        Route::post('requests/{requestItem}/claim', [RequestController::class, 'claim'])->whereNumber('requestItem');
        Route::post('letters', [RequestController::class, 'storeLetter'])->middleware('throttle:20,1');

        // Equipment: applicants view their delivered items in the portal
        Route::get('equipment', [EquipmentController::class, 'index']);

    // OWERU Board (reviewer role): independent final decision on reviewed requests
    Route::middleware(['auth:sanctum', 'role:reviewer'])->group(function () {
        Route::get('requests/review', [RequestController::class, 'reviewQueue']);
        Route::patch('requests/{requestItem}/board-status', [RequestController::class, 'boardDecision'])->whereNumber('requestItem');
    });

        // Suppliers: readable by authenticated users, managed by staff
        Route::get('suppliers', [SupplierController::class, 'index']);

        // Reports: applicants submit reports; staff manage
        Route::get('reports', [ReportController::class, 'index']);
        Route::post('reports', [ReportController::class, 'store']);
        Route::get('reports/{report}/evidence', [ReportController::class, 'getEvidence']);

        // Church confirmation (endorsement) flow
        Route::get('endorsements', [EndorsementController::class, 'index']);
        Route::post('endorsements', [EndorsementController::class, 'store']);
        Route::patch('endorsements/{endorsement}', [EndorsementController::class, 'respond']);

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
        Route::patch('notifications/{notification}', [NotificationController::class, 'markRead']);

        Route::get('dashboard/donor', [DashboardController::class, 'donor']);

        Route::post('applicant-verification', [ApplicantVerificationController::class, 'submit'])->middleware('throttle:20,1');
        Route::get('applicant-verification/mine', [ApplicantVerificationController::class, 'mine']);
    });

    // OWERU staff only (admin + manager): money and management routes
    Route::middleware(['auth:sanctum', 'role:admin,manager'])->group(function () {
        Route::patch('donations/{donation}/confirm', [DonationController::class, 'confirm'])->middleware('throttle:60,1');
        Route::patch('donations/{donation}', [DonationController::class, 'update']);
        Route::delete('donations/{donation}', [DonationController::class, 'destroy']);

        Route::patch('organizations/{organization}', [OrganizationController::class, 'update']);

        Route::patch('requests/{requestItem}', [RequestController::class, 'update'])->whereNumber('requestItem');
        Route::delete('requests/{requestItem}', [RequestController::class, 'destroy'])->whereNumber('requestItem');
        Route::patch('requests/{requestItem}/status', [RequestController::class, 'updateStatus'])->whereNumber('requestItem');

        Route::get('items', [RequestController::class, 'getItems']);
        Route::patch('items/{item}', [RequestController::class, 'updateItem']);
        Route::delete('items/{item}', [RequestController::class, 'destroyItem']);

        // Supplier quotes against fundable items (SRS §10 procurement steps 2-3)
        Route::get('quotes', [QuoteController::class, 'index']);
        Route::post('quotes', [QuoteController::class, 'store']);
        Route::patch('quotes/{quote}', [QuoteController::class, 'update']);
        Route::post('quotes/{quote}/approve', [QuoteController::class, 'approve']);
        Route::post('quotes/{quote}/reject', [QuoteController::class, 'reject']);
        Route::delete('quotes/{quote}', [QuoteController::class, 'destroy']);

        Route::get('invoices', [InvoiceController::class, 'index']);
        Route::post('invoices', [InvoiceController::class, 'store']);
        Route::patch('invoices/{invoice}/paid', [InvoiceController::class, 'markPaid']);
        Route::post('invoices/{invoice}/receipt', [InvoiceController::class, 'uploadReceipt']);
        Route::post('invoices/{invoice}/approve', [InvoiceController::class, 'approve']);
        Route::patch('invoices/{invoice}', [InvoiceController::class, 'update']);
        Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy']);

        Route::post('equipment', [EquipmentController::class, 'store']);
        Route::get('equipment/{equipment}', [EquipmentController::class, 'show']);
        Route::post('equipment/{equipment}/delivery-confirm', [EquipmentController::class, 'confirmDelivery']);
        Route::get('equipment/{equipment}/evidence', [EquipmentController::class, 'getEvidence']);
        Route::patch('equipment/{equipment}/status', [EquipmentController::class, 'updateStatus']);
        Route::patch('equipment/{equipment}', [EquipmentController::class, 'update']);
        Route::delete('equipment/{equipment}', [EquipmentController::class, 'destroy']);

        Route::post('suppliers', [SupplierController::class, 'store']);
        Route::patch('suppliers/{supplier}', [SupplierController::class, 'update']);
        Route::patch('suppliers/{supplier}/verify', [SupplierController::class, 'verify']);
        Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy']);

        Route::patch('reports/{report}', [ReportController::class, 'update']);
        Route::delete('reports/{report}', [ReportController::class, 'destroy']);

        Route::get('applicant-verifications', [ApplicantVerificationController::class, 'index']);
        Route::post('applicant-verifications/{verification}/review', [ApplicantVerificationController::class, 'review']);

        Route::get('audit-logs', [StatsController::class, 'auditLogs']);
        Route::get('complaints', [ComplaintController::class, 'index']);
        Route::patch('complaints/{complaint}', [ComplaintController::class, 'update']);
        Route::get('contact', [ContactController::class, 'index']);
        Route::patch('contact/{contactMessage}', [ContactController::class, 'update']);
        Route::get('stats/kpi', [StatsController::class, 'kpi']);
        Route::get('export/{type}', [StatsController::class, 'export']);
    });

    // Main admin only (staff account management)
    Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::get('users', [AdminUserController::class, 'index']);
        Route::post('users', [AdminUserController::class, 'store']);
        Route::patch('users/{user}', [AdminUserController::class, 'update']);
        Route::patch('users/{user}/reset-password', [AdminUserController::class, 'resetPassword']);
        Route::delete('users/{user}', [AdminUserController::class, 'destroy']);
    });
});
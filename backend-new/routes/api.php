<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\DraftController;

Route::post('/auth/login', [AuthController::class, 'login'])->name('login');

Route::get('/branches', [BranchController::class, 'index']);
Route::get('/branches/{id}', [BranchController::class, 'show']);
Route::post('/drafts', [DraftController::class, 'store']);











Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    
    // Branches Management
    Route::post('/branches', [BranchController::class, 'store']);
    Route::patch('/branches/{id}', [BranchController::class, 'update']);
    Route::delete('/branches/{id}', [BranchController::class, 'destroy']);

    
    Route::get('/drafts', [DraftController::class, 'index']);

    Route::patch('/drafts/{id}', [DraftController::class, 'update']);
    Route::post('/drafts/{id}/approve', [DraftController::class, 'approve']);
    Route::post('/drafts/{id}/reject', [DraftController::class, 'reject']);
    Route::get('/statistics/comprehensive', [App\Http\Controllers\StatisticsController::class, 'comprehensive']);
    
    // Reports
    Route::get('/reports/monthly', [App\Http\Controllers\ReportsController::class, 'monthly']);
    Route::get('/reports/net-profit', [App\Http\Controllers\ReportsController::class, 'netProfit']);
    Route::get('/net-profit/all-months', [App\Http\Controllers\ReportsController::class, 'netProfitAllMonths']);
    Route::get('/reports/budget', [App\Http\Controllers\ReportsController::class, 'budget']);

    // Contracts
    Route::get('/contracts', [App\Http\Controllers\ContractsController::class, 'index']);
    Route::get('/contracts/search', [App\Http\Controllers\ContractsController::class, 'search']); // Must be before {id}
    Route::post('/contracts', [App\Http\Controllers\ContractsController::class, 'store']);
    Route::get('/contracts/{id}', [App\Http\Controllers\ContractsController::class, 'show']);
    Route::patch('/contracts/{id}', [App\Http\Controllers\ContractsController::class, 'update']);
    Route::delete('/contracts/{id}', [App\Http\Controllers\ContractsController::class, 'destroy']);
    Route::post('/contracts/{id}/payments', [App\Http\Controllers\ContractsController::class, 'addPayment']);

    // Sales
    Route::get('/sales-staff', [App\Http\Controllers\SalesController::class, 'staffIndex']);
    Route::get('/sales-staff/{id}', [App\Http\Controllers\SalesController::class, 'staffShow']);
    Route::post('/sales-staff', [App\Http\Controllers\SalesController::class, 'staffStore']);
    Route::patch('/sales-staff/{id}', [App\Http\Controllers\SalesController::class, 'staffUpdate']);
    Route::delete('/sales-staff/{id}', [App\Http\Controllers\SalesController::class, 'staffDestroy']);

    Route::get('/daily-sales-reports', [App\Http\Controllers\SalesController::class, 'dailyReportsIndex']);
    Route::get('/daily-sales-reports/{id}', [App\Http\Controllers\SalesController::class, 'dailyReportsShow']);
    Route::post('/daily-sales-reports', [App\Http\Controllers\SalesController::class, 'dailyReportsStore']);
    Route::patch('/daily-sales-reports/{id}', [App\Http\Controllers\SalesController::class, 'dailyReportsUpdate']);
    Route::delete('/daily-sales-reports/{id}', [App\Http\Controllers\SalesController::class, 'dailyReportsDestroy']);

    // Sales Visits
    Route::post('/sales-visits', [App\Http\Controllers\SalesVisitController::class, 'store']);
    Route::get('/sales-visits/{report_id}', [App\Http\Controllers\SalesVisitController::class, 'index']);
    Route::patch('/sales-visits/{id}', [App\Http\Controllers\SalesVisitController::class, 'update']);
    Route::delete('/sales-visits/{id}', [App\Http\Controllers\SalesVisitController::class, 'destroy']);

    // Lookups & Operations
    Route::get('/courses', [App\Http\Controllers\LookupController::class, 'courses']);
    Route::post('/courses', [App\Http\Controllers\LookupController::class, 'createCourse']);
    Route::patch('/courses/{id}', [App\Http\Controllers\LookupController::class, 'updateCourse']);
    Route::delete('/courses/{id}', [App\Http\Controllers\LookupController::class, 'deleteCourse']);

    Route::get('/payment-methods', [App\Http\Controllers\LookupController::class, 'paymentMethods']);
    Route::post('/payment-methods', [App\Http\Controllers\LookupController::class, 'createPaymentMethod']);
    Route::patch('/payment-methods/{id}', [App\Http\Controllers\LookupController::class, 'updatePaymentMethod']);
    Route::delete('/payment-methods/{id}', [App\Http\Controllers\LookupController::class, 'deletePaymentMethod']);
    Route::get('/expenses', [App\Http\Controllers\LookupController::class, 'expenses']);
    Route::post('/expenses', [App\Http\Controllers\LookupController::class, 'createExpense']);
    Route::patch('/expenses/{id}', [App\Http\Controllers\LookupController::class, 'updateExpense']);
    Route::delete('/expenses/{id}', [App\Http\Controllers\LookupController::class, 'deleteExpense']);
    
    // Sessions
    Route::get('/sessions/all', [App\Http\Controllers\SessionController::class, 'index']);
    Route::patch('/sessions/{id}', [App\Http\Controllers\SessionController::class, 'update']);
    Route::delete('/sessions/{id}', [App\Http\Controllers\SessionController::class, 'destroy']);
    Route::get('/teachers/names', [App\Http\Controllers\SessionController::class, 'getTeacherNames']);
    Route::post('/teachers/merge', [App\Http\Controllers\SessionController::class, 'mergeTeachers']);

    // Account Management
    Route::get('/operation-accounts', [App\Http\Controllers\LookupController::class, 'accountsIndex']);
    Route::post('/operation-accounts', [App\Http\Controllers\LookupController::class, 'createAccount']);
    Route::patch('/operation-accounts/{id}', [App\Http\Controllers\LookupController::class, 'updateAccount']);
    Route::delete('/operation-accounts/{id}', [App\Http\Controllers\LookupController::class, 'deleteAccount']);

    // Expenses Alias
    Route::get('/expenses/monthly', [App\Http\Controllers\LookupController::class, 'expenses']);

    // Admin & Maintenance
    Route::get('/health', [App\Http\Controllers\AdminController::class, 'health']);
    Route::get('/check-db-structure', [App\Http\Controllers\AdminController::class, 'checkDbStructure']);
    Route::post('/admin/remove-contract-dates', [App\Http\Controllers\AdminController::class, 'removeContractDates']);
    Route::post('/admin/execute-sql', [App\Http\Controllers\AdminController::class, 'executeSql']);
    Route::post('/admin/fix-contracts-branch-id', [App\Http\Controllers\AdminController::class, 'fixContractsBranchId']);
    Route::get('/admin/database-schema', [App\Http\Controllers\AdminController::class, 'getDatabaseSchema']);
    Route::post('/admin/clear-and-seed', [App\Http\Controllers\AdminController::class, 'clearAndSeed']);

});

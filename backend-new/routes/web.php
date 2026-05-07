<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/setup-storage', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('storage:link');
        return 'Storage link created successfully! You can now view the certificates.';
    } catch (\Exception $e) {
        return 'Error creating storage link: ' . $e->getMessage();
    }
});

Route::get('/debug-certificates', function () {
    $firstCert = \App\Models\Certificate::whereNotNull('file_path')->first();
    if (!$firstCert) {
        return 'No certificates with files found in DB.';
    }
    
    $path = storage_path('app/public/' . $firstCert->file_path);
    $exists = file_exists($path);
    
    return [
        'cert_id' => $firstCert->id,
        'db_file_path' => $firstCert->file_path,
        'absolute_server_path' => $path,
        'file_exists' => $exists ? 'YES' : 'NO'
    ];
});

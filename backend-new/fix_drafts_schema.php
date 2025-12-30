<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "Checking session_drafts table...\n";

if (Schema::hasTable('session_drafts')) {
    Schema::table('session_drafts', function (Blueprint $table) {
        if (!Schema::hasColumn('session_drafts', 'created_at')) {
            echo "Adding created_at...\n";
            $table->timestamp('created_at')->nullable();
        }
        if (!Schema::hasColumn('session_drafts', 'updated_at')) {
            echo "Adding updated_at...\n";
            $table->timestamp('updated_at')->nullable();
        }
    });
    echo "Schema updated successfully.\n";
} else {
    echo "Table session_drafts does not exist.\n";
}

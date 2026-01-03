<?php

// Load Laravel Bootstrap
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Branch;
use App\Models\SessionDraft;
use Carbon\Carbon;

echo "Step 1: Unsetting event dispatcher...\n";
SessionDraft::unsetEventDispatcher();

try {
    echo "Step 2: Fetching branches...\n";
    $branches = Branch::all();
    echo "Found " . $branches->count() . " branches.\n";

    if ($branches->count() === 0) {
        echo "No branches found! Seeding aborted.\n";
        exit(0);
    }

    $date = Carbon::now()->format('Y-m-d');
    $count = 0;

    foreach ($branches as $branch) {
        echo "Processing branch: " . $branch->name . " (ID: " . $branch->id . ")...\n";
        for ($i = 1; $i <= 3; $i++) {
            SessionDraft::create([
                'branch_id' => $branch->id,
                'teacher_name' => "Teacher Auto {$i}",
                'student_name' => "Student Auto {$i}",
                'session_date' => $date,
                'start_time' => '10:00',
                'end_time' => '11:30',
                'duration_hours' => 1.5,
                'duration_text' => 'ساعة ونصف',
                'status' => 'pending'
            ]);
            $count++;
            echo ".";
        }
        echo "\n";
    }

    echo "Done. Inserted $count drafts.\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

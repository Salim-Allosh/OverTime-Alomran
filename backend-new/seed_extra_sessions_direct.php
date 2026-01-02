<?php

// Load Laravel Bootstrap
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Branch;
use App\Models\SessionDraft;
use Carbon\Carbon;

echo "Starting seeding...\n";

// Disable event dispatcher to speed up if there are observers
SessionDraft::unsetEventDispatcher();

$branches = Branch::all();
$date = Carbon::now()->format('Y-m-d');
$count = 0;

foreach ($branches as $branch) {
    echo "Processing branch: " . $branch->name . "\n";
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
    }
}

echo "Done. Inserted $count drafts.\n";

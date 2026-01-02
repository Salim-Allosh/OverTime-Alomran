<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\SessionDraft;
use Carbon\Carbon;

class ExtraSessionDraftsSeeder extends Seeder
{
    public function run()
    {
        $branches = Branch::all();
        $date = Carbon::now()->format('Y-m-d');

        foreach ($branches as $branch) {
            // Create 3 drafts per branch as an example
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
            }
        }
    }
}

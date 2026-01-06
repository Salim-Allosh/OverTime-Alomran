<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Session;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    public function index(Request $request)
    {
        $query = Session::query();

        // Filters
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }
        
        $user = $request->user();
        if (!$user->is_super_admin && !$user->is_backdoor) {
             // If local branch user/manager, restrict
             if ($user->branch_id) {
                 $query->where('branch_id', $user->branch_id);
             } else {
                 // Safety: If no branch assigned and not admin, see nothing.
                 return response()->json([]);
             }
        }

        return $query->orderBy('session_date', 'desc')->get();
    }

    public function update(Request $request, $id)
    {
        $session = Session::findOrFail($id);
        
        $data = $request->all();
        
        // Recalculate calculated_amount if hourly_rate or duration_hours is changed
        if (isset($data['hourly_rate']) || isset($data['duration_hours'])) {
            $rate = $data['hourly_rate'] ?? $session->hourly_rate;
            $hours = $data['duration_hours'] ?? $session->duration_hours;
            $data['calculated_amount'] = $rate * $hours;
        }

        $session->update($data);
        return $session;
    }

    public function destroy($id)
    {
        Session::destroy($id);
        return response()->noContent();
    }

    public function mergeTeachers(Request $request)
    {
        $validated = $request->validate([
            'old_name' => 'required',
            'new_name' => 'required',
            'session_ids' => 'array'
        ]);

        $query = Session::where('teacher_name', $validated['old_name']);
        
        if (!empty($validated['session_ids'])) {
            $query->whereIn('id', $validated['session_ids']);
        }
        
        $count = $query->update(['teacher_name' => $validated['new_name']]);

        // Also update Expenses? Python version does.
        \App\Models\Expense::where('teacher_name', $validated['old_name'])
                ->update(['teacher_name' => $validated['new_name']]);

        return response()->json(['updated_count' => $count]);
    }

    public function getTeacherNames(Request $request)
    {
        $sessionNames = Session::distinct()->pluck('teacher_name')->toArray();
        $expenseNames = \App\Models\Expense::whereNotNull('teacher_name')->distinct()->pluck('teacher_name')->toArray();
        // $draftNames = \App\Models\SessionDraft::distinct()->pluck('teacher_name')->toArray();

        $allNames = array_unique(array_merge($sessionNames, $expenseNames));
        sort($allNames);
        return array_values($allNames);
    }
}

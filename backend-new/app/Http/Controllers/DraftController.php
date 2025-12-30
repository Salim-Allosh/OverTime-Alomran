<?php

namespace App\Http\Controllers;

use App\Models\SessionDraft;
use App\Models\Branch;
use Illuminate\Http\Request;

class DraftController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['branch_id' => 'required|integer']);

        $query = SessionDraft::where('branch_id', $request->branch_id);

        if ($request->has('status_filter')) {
            $query->where('status', $request->status_filter);
        }
        if ($request->has('teacher_name')) {
            $query->where('teacher_name', $request->teacher_name);
        }
        if ($request->has('date_value')) {
            $query->where('session_date', $request->date_value);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'teacher_name' => 'required|string',
            'student_name' => 'required|string',
            'session_date' => 'required|date',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'duration_hours' => 'required|numeric',
            'duration_text' => 'required|string',
        ]);

        $draft = SessionDraft::create($validated);
        return response()->json($draft, 201);
    }

    public function update(Request $request, $id)
    {
        $draft = SessionDraft::findOrFail($id);
        
        if ($draft->status !== 'pending') {
            return response()->json(['message' => 'Cannot update processed draft'], 400);
        }

        $draft->update($request->all());
        return response()->json($draft);
    }

    public function approve(Request $request, $id)
    {
        $draft = SessionDraft::findOrFail($id);
        
        if ($draft->status !== 'pending') {
            return response()->json(['message' => 'Draft already processed'], 400);
        }

        $validated = $request->validate([
            'contract_number' => 'required|string',
            'hourly_rate' => 'required|numeric',
            'location' => 'required|string'
        ]);

        // Calculate amount
        $calculatedAmount = $draft->duration_hours * $validated['hourly_rate'];

        // Create Session
        \App\Models\Session::create([
            'branch_id' => $draft->branch_id,
            'teacher_name' => $draft->teacher_name,
            'student_name' => $draft->student_name,
            'session_date' => $draft->session_date,
            'start_time' => $draft->start_time,
            'end_time' => $draft->end_time,
            'duration_hours' => $draft->duration_hours,
            'duration_text' => $draft->duration_text,
            'contract_number' => $validated['contract_number'],
            'hourly_rate' => $validated['hourly_rate'],
            'calculated_amount' => $calculatedAmount,
            'location' => $validated['location'],
            'approved_by' => $request->user()->id // Operation Account ID
        ]);

        $draft->delete();
        return response()->json(['message' => 'Approved']);
    }
    
    public function reject(Request $request, $id)
    {
         $draft = SessionDraft::findOrFail($id);
         $request->validate(['rejection_reason' => 'required|string']);
         
         $draft->status = 'rejected';
         $draft->rejection_reason = $request->rejection_reason;
         $draft->save();
         
         return response()->json($draft);
    }
}

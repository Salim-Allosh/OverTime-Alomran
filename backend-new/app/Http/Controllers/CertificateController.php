<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CertificateController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Certificate::with('branch');

        // Filtering by month and year
        if ($request->has('year')) {
            $years = (array) $request->year;
            $query->whereIn('year', $years);
        }
        if ($request->has('month')) {
            $months = (array) $request->month;
            $query->whereIn('month', $months);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_name_ar', 'like', "%{$search}%")
                  ->orWhere('student_name_en', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%")
                  ->orWhere('contract_number', 'like', "%{$search}%");
            });
        }

        // Role-based filtering
        if ($user->is_super_admin || $user->is_hr_manager) {
            if ($request->has('branch_id')) {
                $branches = (array) $request->branch_id;
                $query->whereIn('branch_id', $branches);
            }
        } elseif ($user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'student_name_ar' => 'required|string',
            'student_name_en' => 'required|string',
            'phone_number' => 'nullable|string',
            'contract_number' => 'nullable|string',
            'id_passport_number' => 'required|string',
            'certificate_name' => 'required|string',
            'course_type' => 'required|string',
            'duration' => 'required|string',
            'certificate_type' => 'required|in:local,international,knowledge_authority',
            'branch_id' => 'required|exists:branches,id',
            'month' => 'required|integer',
            'year' => 'required|integer',
        ]);

        $validated['operation_account_id'] = $user->id;
        $validated['status'] = 'requested';

        $certificate = Certificate::create($validated);
        return response()->json($certificate, 201);
    }

    public function update(Request $request, $id)
    {
        $certificate = Certificate::findOrFail($id);
        
        $validated = $request->validate([
            'student_name_ar' => 'sometimes|string',
            'student_name_en' => 'sometimes|string',
            'phone_number' => 'sometimes|string|nullable',
            'contract_number' => 'sometimes|string|nullable',
            'id_passport_number' => 'sometimes|string',
            'certificate_name' => 'sometimes|string',
            'course_type' => 'sometimes|string',
            'duration' => 'sometimes|string',
            'certificate_type' => 'sometimes|in:local,international,knowledge_authority',
            'branch_id' => 'sometimes|exists:branches,id',
            'month' => 'sometimes|integer',
            'year' => 'sometimes|integer',
            'status' => 'sometimes|in:requested,uploaded',
        ]);

        $certificate->update($validated);

        return response()->json($certificate);
    }

    public function upload(Request $request, $id)
    {
        $certificate = Certificate::findOrFail($id);

        $request->validate([
            'certificate_pdf' => 'required|file|mimes:pdf|max:10240', // 10MB limit
        ]);

        if ($request->hasFile('certificate_pdf')) {
            // Delete old file if exists
            if ($certificate->file_path) {
                Storage::disk('public')->delete($certificate->file_path);
            }

            $path = $request->file('certificate_pdf')->store('certificates', 'public');
            $certificate->file_path = $path;
            $certificate->status = 'uploaded';
            $certificate->save();
        }

        return response()->json($certificate);
    }

    public function deliver($id)
    {
        $certificate = Certificate::findOrFail($id);
        $certificate->status = 'delivered';
        $certificate->save();

        return response()->json($certificate);
    }

    public function destroy($id)
    {
        $certificate = Certificate::findOrFail($id);
        
        if ($certificate->file_path) {
            Storage::disk('public')->delete($certificate->file_path);
        }
        
        $certificate->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    public function download($id)
    {
        $certificate = \App\Models\Certificate::findOrFail($id);

        if (!$certificate->file_path) {
            return response()->json(['message' => 'No file attached to this certificate'], 404);
        }

        // Assuming file_path stores 'certificates/filename.pdf', inside 'public' disk
        $path = storage_path('app/public/' . $certificate->file_path);

        if (!file_exists($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $filename = "{$certificate->student_name_ar}-{$certificate->certificate_name}-{$certificate->duration}.pdf";

        return response()->download($path, $filename);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index()
    {
        return Branch::all();
    }

    public function show($id)
    {
        return Branch::findOrFail($id);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || (!$user->is_super_admin && !$user->is_backdoor)) {
            abort(403, 'غير مصرح');
        }

        $validated = $request->validate([
            'name' => 'required|unique:branches,name',
            'default_hourly_rate' => 'required|numeric'
        ]);

        return Branch::create($validated);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || (!$user->is_super_admin && !$user->is_backdoor)) {
            abort(403, 'غير مصرح');
        }

        $branch = Branch::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|unique:branches,name,' . $id,
            'default_hourly_rate' => 'required|numeric'
        ]);

        $branch->update($validated);
        return $branch;
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || (!$user->is_super_admin && !$user->is_backdoor)) {
            abort(403, 'غير مصرح');
        }

        Branch::destroy($id);
        return response()->noContent();
    }
}

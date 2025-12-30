<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Contract;
use App\Models\ContractPayment;
use Illuminate\Support\Facades\DB;

class ContractsController extends Controller
{
    public function index(Request $request)
    {
        $query = Contract::with(['branch', 'salesStaff', 'course', 'paymentMethod']);
        
        $user = $request->user();
        if ($user->is_sales_manager || $user->is_operation_manager) {
            $query->where('branch_id', $user->branch_id);
        } elseif ($user->is_branch_account) {
             $query->where('branch_id', $user->branch_id);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }
        
        return $query->orderBy('created_at', 'desc')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contract_number' => 'required',
            'student_name' => 'required',
            'branch_id' => 'required|exists:branches,id',
            'total_amount' => 'nullable|numeric',
            'payment_amount' => 'nullable|numeric',
            'payment_method_id' => 'nullable|exists:payment_methods,id'
        ]);

        $contract = Contract::create($request->all());
        return $contract;
    }

    public function show($id)
    {
        return Contract::with(['payments', 'branch', 'salesStaff', 'course'])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $contract = Contract::findOrFail($id);
        $contract->update($request->all());
        return $contract;
    }

    public function destroy($id)
    {
        Contract::destroy($id);
        return response()->noContent();
    }

    public function search(Request $request)
    {
        $query = Contract::query();
        
        if ($request->has('contract_number')) {
            $query->where('contract_number', 'like', '%' . $request->contract_number . '%');
        }
        
        if ($request->has('student_name')) {
            $query->where('student_name', 'like', '%' . $request->student_name . '%');
        }
        
        // Match Python logic: Exclude SHARED suffix if needed, and sort
        $query->where('contract_number', 'not like', '%-SHARED');
        
        return $query->orderBy('created_at', 'desc')->limit(20)->get();
    }

    public function addPayment(Request $request, $id)
    {
        $contract = Contract::findOrFail($id);
        
        $payment = new ContractPayment($request->all());
        $payment->contract_id = $contract->id;
        $payment->save();
        
        // Update contract totals logic if needed (e.g. remaining amount)
        $totalPaid = $contract->payment_amount + $contract->payments()->sum('payment_amount');
        $contract->remaining_amount = $contract->total_amount - $totalPaid;
        $contract->save();

        return $payment;
    }
}

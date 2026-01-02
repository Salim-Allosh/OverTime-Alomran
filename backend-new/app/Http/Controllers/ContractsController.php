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
        $query = Contract::with(['branch', 'salesStaff', 'course', 'paymentMethod', 'payments']);
        
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

    private function calculateNetAmount($paymentAmount, $paymentMethodId)
    {
        if (!$paymentAmount || $paymentAmount <= 0) return 0;
        
        $paymentMethod = \App\Models\PaymentMethod::find($paymentMethodId);
        if (!$paymentMethod) {
            // Default: just remove VAT 5%
            return $paymentAmount / 1.05;
        }

        $methodName = strtoupper($paymentMethod->name);
        $baseAmount = $paymentAmount / 1.05; // Remove 5% VAT

        $discount = 0;
        if ($methodName === 'TABBY LINK') {
            $discount = $paymentAmount * 0.0685;
        } elseif ($methodName === 'TABBY CARD') {
            $discount = $paymentAmount * 0.05;
        } elseif ($methodName === 'TAMARA') {
            $discount = $paymentAmount * 0.07;
        } elseif ($paymentMethod->discount_percentage) {
            $discount = $paymentAmount * $paymentMethod->discount_percentage;
        }

        return $baseAmount - $discount;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contract_number' => 'required',
            'student_name' => 'required',
            'branch_id' => 'required|exists:branches,id',
            'total_amount' => 'nullable|numeric',
            'payments' => 'nullable|array',
            'payments.*.payment_amount' => 'required_with:payments|numeric',
            'payments.*.payment_method_id' => 'required_with:payments|exists:payment_methods,id',
        ]);

        // Create the contract
        $contract = Contract::create($request->except('payments'));

        // Handle payments
        $totalPaid = 0;
        $totalNet = 0;
        $firstPayment = null;

        if ($request->has('payments') && is_array($request->payments)) {
            foreach ($request->payments as $index => $paymentData) {
                if (!empty($paymentData['payment_amount'])) {
                    $amount = floatval($paymentData['payment_amount']);
                    $methodId = $paymentData['payment_method_id'];
                    
                    $net = $this->calculateNetAmount($amount, $methodId);
                    
                    $payment = new ContractPayment($paymentData);
                    $payment->contract_id = $contract->id;
                    $payment->net_amount = $net;
                    $payment->save();

                    $totalPaid += $amount;
                    $totalNet += $net;

                    if ($index === 0) $firstPayment = $paymentData;
                }
            }
        }

        // Update main contract calculated fields
        $contract->payment_amount = $totalPaid;
        $contract->net_amount = $totalNet;
        $contract->remaining_amount = ($contract->total_amount ?? 0) - $totalPaid;
        
        // Store first payment details for legacy/display compatibility
        if ($firstPayment) {
             $contract->payment_method_id = $firstPayment['payment_method_id'] ?? null;
             $contract->payment_number = $firstPayment['payment_number'] ?? null;
        }
        
        $contract->save();

        return $contract->load('payments');
    }

    public function show($id)
    {
        return Contract::with(['payments', 'branch', 'salesStaff', 'course'])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $contract = Contract::findOrFail($id);
        $contract->update($request->except('payments'));

        // Handle payments update (Simple sync: Delete all and recreate)
        if ($request->has('payments') && is_array($request->payments)) {
            $contract->payments()->delete(); // Remove old payments
            
            $totalPaid = 0;
            $totalNet = 0;
            $firstPayment = null;

            foreach ($request->payments as $index => $paymentData) {
                if (!empty($paymentData['payment_amount'])) {
                    $amount = floatval($paymentData['payment_amount']);
                    $methodId = $paymentData['payment_method_id'];
                    
                    $net = $this->calculateNetAmount($amount, $methodId);

                    $payment = new ContractPayment($paymentData);
                    $payment->contract_id = $contract->id;
                    $payment->net_amount = $net;
                    $payment->save();

                    $totalPaid += $amount;
                    $totalNet += $net;
                    
                    if ($index === 0) $firstPayment = $paymentData;
                }
            }

            // Update main contract calculated fields
            $contract->payment_amount = $totalPaid;
            $contract->net_amount = $totalNet;
            $contract->remaining_amount = ($contract->total_amount ?? 0) - $totalPaid;
            
            if ($firstPayment) {
                 $contract->payment_method_id = $firstPayment['payment_method_id'] ?? null;
                 $contract->payment_number = $firstPayment['payment_number'] ?? null;
            }

            $contract->save();
        }

        return $contract->load('payments');
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

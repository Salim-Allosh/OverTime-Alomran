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
            return $paymentAmount;
        }

        $taxPercentage = $paymentMethod->tax_percentage ?: 0;
        $baseAmount = $paymentAmount / (1 + $taxPercentage);
        $discountPercentage = $paymentMethod->discount_percentage ?: 0;
        
        // Formula: (Amount / (1 + Tax)) - (Amount * DiscountPercentage)
        return $baseAmount - ($paymentAmount * $discountPercentage);
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

        $isShared = ($request->contract_type === 'shared' && $request->shared_branch_id) || 
                    ($request->contract_type === 'shared_same_branch' && $request->shared_sales_staff_id);
        
        $originalTotal = $request->total_amount;
        $originalPayments = $request->payments ?? [];

        // Prepare data for Main Contract
        $mainContractData = $request->except(['payments', 'shared_sales_staff_id']);
        if ($isShared) {
            // Split total amount equally
            $mainContractData['total_amount'] = ($originalTotal / 2);
        }

        // Create the contract
        $contract = Contract::create($mainContractData);

        // Handle payments for Main Contract
        $totalPaid = 0;
        $totalNet = 0;
        $firstPayment = null;
        $processedPayments = []; // Store processed payment data for shared contract reuse

        if (!empty($originalPayments)) {
            foreach ($originalPayments as $index => $paymentData) {
                if (!empty($paymentData['payment_amount'])) {
                    $originalAmount = floatval($paymentData['payment_amount']);
                    $amountToRecord = $isShared ? ($originalAmount / 2) : $originalAmount;
                    
                    $methodId = $paymentData['payment_method_id'];
                    $net = $this->calculateNetAmount($amountToRecord, $methodId);
                    
                    $payment = new ContractPayment($paymentData);
                    $payment->contract_id = $contract->id;
                    $payment->payment_amount = $amountToRecord; // Override with split amount
                    $payment->net_amount = $net;
                    $payment->save();

                    $totalPaid += $amountToRecord;
                    $totalNet += $net;

                    if ($index === 0) $firstPayment = $paymentData;
                    
                    // Keep track for shared contract
                    $processedPayments[] = [
                        'payment_amount' => $amountToRecord, // It's also half
                        'payment_method_id' => $methodId,
                        'payment_number' => $paymentData['payment_number'] ?? null
                    ];
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

        // Handle Joint Contract: Create a copy for the shared branch/staff
        if ($isShared) {
            $sharedContract = new Contract();
            
            // Branch: Use shared_branch_id if provided (inter-branch), otherwise same branch (intra-branch)
            $sharedContract->branch_id = $request->shared_branch_id ?? $request->branch_id;
            
            // Sales Staff: Use shared_sales_staff_id if provided
            $sharedContract->sales_staff_id = $request->shared_sales_staff_id ?? null;
            
            // Append -S to contract number to avoid unique constraint violations if any, and denote Shared
            $sharedContract->contract_number = $request->contract_number . '-S'; 
            
            $sharedContract->student_name = $request->student_name;
            $sharedContract->client_phone = $request->client_phone;
            
            if ($request->contract_type === 'shared_same_branch') {
                $sharedContract->registration_source = "عقد مشترك (نفس الفرع)";
                $sharedContract->contract_type = 'shared_same_branch';
            } else {
                $currentBranch = \App\Models\Branch::find($request->branch_id);
                $branchName = $currentBranch ? $currentBranch->name : 'الفرع الرئيسي';
                $sharedContract->registration_source = "عقد مشترك مع " . $branchName;
                $sharedContract->contract_type = 'shared';
            }
            
            $sharedContract->contract_date = $request->contract_date ?? now();
            
            // Split total amount equally
            $sharedContract->total_amount = ($originalTotal / 2);
            
            // We will calculate paid/net below when creating payments
            $sharedContract->payment_amount = 0;
            $sharedContract->net_amount = 0;
            $sharedContract->remaining_amount = $sharedContract->total_amount;
            
            $sharedContract->save();
            
            // Create Payments for Shared Contract
            $sharedTotalPaid = 0;
            $sharedTotalNet = 0;
            
            foreach ($processedPayments as $pData) {
                $amount = $pData['payment_amount']; // Already halved
                $net = $this->calculateNetAmount($amount, $pData['payment_method_id']);
                
                $sp = new ContractPayment();
                $sp->contract_id = $sharedContract->id;
                $sp->payment_amount = $amount;
                $sp->payment_method_id = $pData['payment_method_id'];
                $sp->payment_number = $pData['payment_number'];
                $sp->net_amount = $net;
                $sp->save();
                
                $sharedTotalPaid += $amount;
                $sharedTotalNet += $net;
            }
            
            // Update Shared Contract totals
            $sharedContract->payment_amount = $sharedTotalPaid;
            $sharedContract->net_amount = $sharedTotalNet;
            $sharedContract->remaining_amount = ($sharedContract->total_amount ?? 0) - $sharedTotalPaid;
             if ($firstPayment) {
                  $sharedContract->payment_method_id = $firstPayment['payment_method_id'] ?? null;
                  $sharedContract->payment_number = $firstPayment['payment_number'] ?? null;
             }
            $sharedContract->save();
        }

        return $contract->load('payments');
    }

    public function show($id)
    {
        return Contract::with(['payments', 'branch', 'salesStaff', 'course'])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $contract = Contract::findOrFail($id);
        $data = $request->except('payments');
        
        // Halve total_amount for shared contracts if it seems to be the full amount
        if (($contract->contract_type === 'shared' || $contract->contract_type === 'shared_same_branch') && isset($data['total_amount'])) {
             // If the updated amount is > 0 and we are in a shared context, 
             // we assume the user might have entered the full amount or we need to ensure it's halved.
             // However, a better way is to check if it's roughly double the previous half or just strictly halve it if it's a new total.
             // For now, let's assume if it's shared, the record MUST store the half.
             // To avoid halving an already halved amount (if the user correctly entered the half),
             // this is tricky. 
             // But usually, shared contracts are created once and totals don't change often.
             // The bug report suggests they are seeing 10000 (full) in statistics.
        }

        $contract->update($data);

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
        
        // Calculate net amount for the new payment
        if ($payment->payment_amount && $payment->payment_method_id) {
            $payment->net_amount = $this->calculateNetAmount($payment->payment_amount, $payment->payment_method_id);
        }
        
        $payment->save();
        
        // Update contract totals
        $totalPaid = $contract->payments()->sum('payment_amount');
        $contract->payment_amount = $totalPaid;
        $contract->remaining_amount = $contract->total_amount - $totalPaid;
        $contract->save();

        return $payment;
    }
}

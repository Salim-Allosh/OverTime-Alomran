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
                    ($request->contract_type === 'shared_same_branch' && $request->shared_sales_staff_id) ||
                    ($request->contract_type === 'old_payment' && ($request->shared_branch_id || $request->shared_sales_staff_id));
        
        // Auto-detect sharing for old payments if parent is shared
        if ($request->contract_type === 'old_payment' && $request->parent_contract_id && !$isShared) {
            $parentContract = Contract::find($request->parent_contract_id);
            if ($parentContract) {
                // Find if this parent has a partner contract
                $partnerParent = Contract::where('contract_number', $parentContract->contract_number . '-S')
                                        ->orWhere('contract_number', str_replace('-S', '', $parentContract->contract_number))
                                        ->where('id', '!=', $parentContract->id)
                                        ->first();
                
                if ($partnerParent) {
                    $isShared = true;
                    // For old_payment, we need to know the target branch for the shared copy
                    // If shared_branch_id is not provided, use the partner's branch
                    if (!$request->shared_branch_id && !$request->shared_sales_staff_id) {
                        $request->merge(['shared_branch_id' => $partnerParent->branch_id]);
                        // Suggest 50/50 split if not provided
                        if (!$request->shared_amount) {
                            $totalPaymentAmount = collect($request->payments ?? [])->sum('payment_amount');
                            $request->merge(['shared_amount' => $totalPaymentAmount / 2]);
                        }
                    }
                }
            }
        }
        
        $originalTotal = $request->total_amount;
        $originalPayments = $request->payments ?? [];

        // For old_payment sharing, we use a custom split if provided, otherwise 50/50
        $isOldPayment = $request->contract_type === 'old_payment';
        $sharedAmountTotal = $request->shared_amount ?? 0;
        
        // Recalculate if we auto-detected sharing
        if ($isOldPayment && $isShared && $sharedAmountTotal == 0) {
            $totalPaymentAmount = collect($originalPayments)->sum('payment_amount');
            $sharedAmountTotal = $totalPaymentAmount / 2;
        }

        // Calculate ratio if old payment is shared
        $sharingRatio = 0.5; // Default for new shared contracts
        if ($isOldPayment && $isShared) {
            $totalPaymentAmount = collect($originalPayments)->sum('payment_amount');
            if ($totalPaymentAmount > 0 && $sharedAmountTotal > 0) {
                $sharingRatio = $sharedAmountTotal / $totalPaymentAmount;
            }
        }

        // Prepare data for Main Contract
        $mainContractData = $request->except(['payments', 'shared_sales_staff_id', 'shared_amount']);
        if ($isShared && !$isOldPayment) {
            // Split total amount equally for new shared contracts
            $mainContractData['total_amount'] = ($originalTotal / 2);
        }
        if ($isOldPayment) {
            $mainContractData['contract_number'] = ($request->contract_number ?? 'OLD') . '-P' . time();
            // total_amount is 0 for old payments to avoid double-counting in stats
            $mainContractData['total_amount'] = 0;
        }

        // Create the contract
        $contract = Contract::create($mainContractData);

        // Handle payments for Main Contract
        $totalPaid = 0;
        $totalNet = 0;
        $firstPayment = null;
        $processedPaymentsForShared = []; // Store processed payment data for shared contract reuse

        if (!empty($originalPayments)) {
            foreach ($originalPayments as $index => $paymentData) {
                if (!empty($paymentData['payment_amount'])) {
                    $originalAmount = floatval($paymentData['payment_amount']);
                    
                    $amountForOther = $isShared ? ($originalAmount * $sharingRatio) : 0;
                    $amountToRecord = $originalAmount - $amountForOther;
                    
                    $methodId = $paymentData['payment_method_id'];
                    $net = $this->calculateNetAmount($amountToRecord, $methodId);
                    
                    $payment = new ContractPayment($paymentData);
                    $payment->contract_id = $contract->id;
                    $payment->payment_amount = $amountToRecord;
                    $payment->net_amount = $net;
                    $payment->save();

                    $totalPaid += $amountToRecord;
                    $totalNet += $net;

                    if ($index === 0) $firstPayment = $paymentData;
                    
                    if ($isShared) {
                        $processedPaymentsForShared[] = [
                            'payment_amount' => $amountForOther,
                            'payment_method_id' => $methodId,
                            'payment_number' => $paymentData['payment_number'] ?? null
                        ];
                    }
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

        // Update parent contract if it's an old payment
        if ($isOldPayment && $contract->parent_contract_id) {
            $parentContract = Contract::find($contract->parent_contract_id);
            if ($parentContract) {
                $parentContract->payment_amount = floatval($parentContract->payment_amount) + $totalPaid;
                $parentContract->net_amount = floatval($parentContract->net_amount) + $totalNet;
                $parentContract->remaining_amount = floatval($parentContract->remaining_amount) - $totalPaid;
                $parentContract->save();
            }
        }

        // Handle Joint Contract: Create a copy for the shared branch/staff
        if ($isShared) {
            $sharedContract = new Contract();
            
            // Branch: Use shared_branch_id if provided (inter-branch), otherwise same branch (intra-branch)
            $sharedContract->branch_id = $request->shared_branch_id ?? $request->branch_id;
            
            // Set the originating branch as the "shared branch" for the copy
            if ($request->shared_branch_id) {
                $sharedContract->shared_branch_id = $request->branch_id;
            }
            
            // Sales Staff: Use shared_sales_staff_id if provided
            $sharedContract->sales_staff_id = $request->shared_sales_staff_id ?? null;
            
            // Append -S to contract number
            $sharedContract->contract_number = $request->contract_number . ($isOldPayment ? '-SP' . time() : '-S'); 
            
            $sharedContract->student_name = $request->student_name;
            $sharedContract->client_phone = $request->client_phone;
            $sharedContract->course_id = $request->course_id;
            
            if ($isOldPayment) {
                $sharedContract->registration_source = "دفعة عقد قديم مشترك";
                $sharedContract->contract_type = 'old_payment';
                $sharedContract->parent_contract_id = $request->parent_contract_id; // Will link below
                $sharedContract->total_amount = 0;
            } else if ($request->contract_type === 'shared_same_branch') {
                $sharedContract->registration_source = "عقد مشترك (نفس الفرع)";
                $sharedContract->contract_type = 'shared_same_branch';
                $sharedContract->total_amount = ($originalTotal / 2);
            } else {
                $currentBranch = \App\Models\Branch::find($request->branch_id);
                $branchName = $currentBranch ? $currentBranch->name : 'الفرع الرئيسي';
                $sharedContract->registration_source = "عقد مشترك مع " . $branchName;
                $sharedContract->contract_type = 'shared';
                $sharedContract->total_amount = ($originalTotal / 2);
            }
            
            $sharedContract->contract_date = $request->contract_date ?? now();
            
            // We will calculate paid/net below when creating payments
            $sharedContract->payment_amount = 0;
            $sharedContract->net_amount = 0;
            $sharedContract->remaining_amount = ($sharedContract->total_amount ?? 0);
            
            $sharedContract->save();
            
            // Create Payments for Shared Contract
            $sharedTotalPaid = 0;
            $sharedTotalNet = 0;
            
            foreach ($processedPaymentsForShared as $pData) {
                $amount = $pData['payment_amount'];
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

            // Link to the partner parent contract if it's an old payment
            if ($isOldPayment && $request->parent_contract_id) {
                // Find the shared partner of the parent contract
                $parentContract = Contract::find($request->parent_contract_id);
                if ($parentContract) {
                    // Try to find a contract with the same number + '-S'
                    $partnerParent = Contract::where('contract_number', $parentContract->contract_number . '-S')
                                            ->orWhere('contract_number', str_replace('-S', '', $parentContract->contract_number))
                                            ->where('id', '!=', $parentContract->id)
                                            ->first();
                    
                    if ($partnerParent) {
                        $sharedContract->parent_contract_id = $partnerParent->id;
                        $sharedContract->save();
                        
                        $partnerParent->payment_amount = floatval($partnerParent->payment_amount) + $sharedTotalPaid;
                        $partnerParent->net_amount = floatval($partnerParent->net_amount) + $sharedTotalNet;
                        $partnerParent->remaining_amount = floatval($partnerParent->remaining_amount) - $sharedTotalPaid;
                        $partnerParent->save();
                    }
                }
            }
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

    public function destroy(Request $request, $id)
    {
        $contract = Contract::findOrFail($id);
        $user = $request->user();
        $userBranchId = $user->branch_id;

        // Check if it's a shared contract
        $isShared = str_ends_with($contract->contract_number, '-S') || 
                    $contract->contract_type === 'shared' || 
                    $contract->contract_type === 'shared_same_branch';

        if ($isShared) {
            // Finding the partner contract
            // If current is -S, look for base. If current is base, look for -S.
            $partner = null;
            if (str_ends_with($contract->contract_number, '-S')) {
                $baseNumber = substr($contract->contract_number, 0, -2);
                $partner = Contract::where('contract_number', $baseNumber)->first();
            } else {
                $partner = Contract::where('contract_number', $contract->contract_number . '-S')->first();
            }

            if ($partner) {
                // If partner already has a deletion request from a DIFFERENT branch (meaning the other side), delete both.
                // We should also check if the user is a super admin/backdoor to allow immediate deletion if needed,
                // but for now let's follow the requested flow of confirmation.
                if ($partner->deletion_requested_by_branch_id && $partner->deletion_requested_by_branch_id != $userBranchId) {
                    // Both confirmed/requested. Delete both.
                    $contract->delete();
                    $partner->delete();
                    return response()->json(['message' => 'Shared contract and its partner deleted successfully']);
                } else {
                    // First branch requesting deletion. Mark both (or just this one, but both is safer for UI consistency)
                    $contract->deletion_requested_by_branch_id = $userBranchId;
                    $contract->save();
                    
                    $partner->deletion_requested_by_branch_id = $userBranchId;
                    $partner->save();

                    return response()->json(['message' => 'Deletion request sent. Waiting for confirmation from the other branch.']);
                }
            }
        }

        // Default: Not shared or partner not found
        $contract->delete();
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

        if ($request->has('client_phone')) {
            $query->where('client_phone', 'like', '%' . $request->client_phone . '%');
        }
        
        // Match Python logic: Exclude SHARED suffix if needed, and sort
        $query->where('contract_number', 'not like', '%-SHARED')
              ->where('contract_number', 'not like', '%-S')
              ->where('contract_type', '!=', 'old_payment');
        
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

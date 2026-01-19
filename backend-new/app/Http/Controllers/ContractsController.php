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
                // Use findPartner helper to identify related contract
                $partnerParent = $this->findPartner($parentContract);
                
                if ($partnerParent) {
                    $isShared = true;
                    // For old_payment, we need to know the target branch or staff for the shared copy
                    // If no sharing info provided, use the partner's details
                    if (!$request->shared_branch_id && !$request->shared_sales_staff_id) {
                        if ($partnerParent->branch_id == $parentContract->branch_id) {
                            $request->merge(['shared_sales_staff_id' => $partnerParent->sales_staff_id]);
                        } else {
                            $request->merge(['shared_branch_id' => $partnerParent->branch_id]);
                        }
                        
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
        $sharedTimestamp = time(); // Synchronized timestamp for both copies
        
        if ($isShared && !$isOldPayment) {
            // Split total amount equally for new shared contracts
            $mainContractData['total_amount'] = ($originalTotal / 2);
        }
        if ($isOldPayment) {
            $mainContractData['contract_number'] = ($request->contract_number ?? 'OLD') . '-P' . $sharedTimestamp;
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

        // Unified synchronization for the main contract
        $this->syncContractHeader($contract);

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
            
            // Append -S or -SP to contract number
            $sharedContract->contract_number = $request->contract_number . ($isOldPayment ? '-SP' . $sharedTimestamp : '-S'); 
            
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
            
            // Unified synchronization for the shared contract copy
            $this->syncContractHeader($sharedContract);

            // Link to the partner parent contract if it's an old payment
            if ($isOldPayment && $request->parent_contract_id) {
                // Find the shared partner of the parent contract
                $parentContract = Contract::find($request->parent_contract_id);
                if ($parentContract) {
                    $partnerParent = $this->findPartner($parentContract);
                    if ($partnerParent) {
                        $sharedContract->parent_contract_id = $partnerParent->id;
                        $sharedContract->save();
                        
                        // Syncing the shared contract will trigger sync for partnerParent automatically
                        $this->syncContractHeader($sharedContract);
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
        
        $contract->update($data);

        // Handle payments update (Simple sync: Delete all and recreate)
        if ($request->has('payments') && is_array($request->payments)) {
            $contract->payments()->delete(); // Remove old payments
            
            foreach ($request->payments as $index => $paymentData) {
                if (!empty($paymentData['payment_amount'])) {
                    $amount = floatval($paymentData['payment_amount']);
                    $methodId = $paymentData['payment_method_id'];
                    
                    $net = $this->calculateNetAmount($amount, $methodId);

                    $payment = new ContractPayment($paymentData);
                    $payment->contract_id = $contract->id;
                    $payment->net_amount = $net;
                    $payment->save();
                }
            }
        }

        // Unified financial sync for this contract (including its parents/children)
        $this->syncContractHeader($contract);

        // Synchronize with partner if it's a shared contract
        $partner = $this->findPartner($contract);
        if ($partner) {
            // Sync core fields to partner record
            $partner->update([
                'student_name' => $contract->student_name,
                'client_phone' => $contract->client_phone,
                'course_id'   => $contract->course_id,
                'contract_date' => $contract->contract_date,
                'total_amount' => $contract->total_amount,
                // Note: registration_source is usually branch-specific (Shared with X), so we don't sync it.
            ]);
            
            // If payments were updated here, should we mirror them to the partner?
            // For shared contracts, payments are SPLIT 50/50 during creation/addPayment.
            // If the user is editing the list of payments in the 10-payment grid, we need to decide.
            // But usually, only the assignment (sales_staff_id) is updated via this form.
            
            $this->syncContractHeader($partner);
        }

        return $contract->load('payments');
    }

    public function destroy(Request $request, $id)
    {
        $contract = Contract::findOrFail($id);
        $user = $request->user();
        $userBranchId = $user->branch_id;

        // Check if it's a shared contract
        $isSharedSuffix = str_ends_with($contract->contract_number, '-S');
        $isOldPaymentMain = str_contains($contract->contract_number, '-P');
        $isOldPaymentShared = str_contains($contract->contract_number, '-SP');
        
        $isShared = $isSharedSuffix || 
                    $contract->contract_type === 'shared' || 
                    $contract->contract_type === 'shared_same_branch' ||
                    $isOldPaymentMain ||
                    $isOldPaymentShared;

        if ($isShared) {
            $partner = $this->findPartner($contract);

            if ($partner) {
                // If partner belongs to the SAME branch as the contract, delete immediately
                if ($partner->branch_id == $contract->branch_id) {
                    DB::transaction(function () use ($contract, $partner) {
                        $this->revertParentTotals($contract);
                        $this->revertParentTotals($partner);
                        
                        $contract->delete();
                        $partner->delete();
                    });
                    
                    return response()->json(['message' => 'Shared contract deleted successfully (intra-branch)']);
                }

                // If partner already has a deletion request from a DIFFERENT branch, delete both.
                if ($partner->deletion_requested_by_branch_id && $partner->deletion_requested_by_branch_id != $userBranchId) {
                    
                    DB::transaction(function () use ($contract, $partner) {
                        // If these are old payments, update the parent contract totals first
                        $this->revertParentTotals($contract);
                        $this->revertParentTotals($partner);
                        
                        $contract->delete();
                        $partner->delete();
                    });
                    
                    return response()->json(['message' => 'Shared contract and its partner deleted successfully']);
                } else {
                    // First branch requesting deletion.
                    $contract->deletion_requested_by_branch_id = $userBranchId;
                    $contract->save();
                    
                    $partner->deletion_requested_by_branch_id = $userBranchId;
                    $partner->save();

                    return response()->json(['message' => 'Deletion request sent. Waiting for confirmation from the other branch.']);
                }
            }
        }

        // Default: Not shared or partner not found
        DB::transaction(function () use ($contract) {
            $this->revertParentTotals($contract);
            $contract->delete();
        });
        
        return response()->noContent();
    }

    public function cancelDeletion(Request $request, $id)
    {
        $contract = Contract::findOrFail($id);
        $partner = $this->findPartner($contract);

        $contract->deletion_requested_by_branch_id = null;
        $contract->save();

        if ($partner) {
            $partner->deletion_requested_by_branch_id = null;
            $partner->save();
        }

        return response()->json(['message' => 'Deletion request cancelled successfully']);
    }

    private function findPartner(Contract $contract)
    {
        $isSharedSuffix = str_ends_with($contract->contract_number, '-S');
        $isOldPaymentMain = str_contains($contract->contract_number, '-P');
        $isOldPaymentShared = str_contains($contract->contract_number, '-SP');

        if ($isSharedSuffix) {
            $baseNumber = substr($contract->contract_number, 0, -2);
            return Contract::where('contract_number', $baseNumber)->first();
        } else if ($isOldPaymentMain) {
            $partnerNumber = str_replace('-P', '-SP', $contract->contract_number);
            return Contract::where('contract_number', $partnerNumber)->first();
        } else if ($isOldPaymentShared) {
            $partnerNumber = str_replace('-SP', '-P', $contract->contract_number);
            return Contract::where('contract_number', $partnerNumber)->first();
        } else {
            // Fallback for contract_type (base contract)
            return Contract::where('contract_number', $contract->contract_number . '-S')->first();
        }
    }

    private function revertParentTotals(Contract $contract)
    {
        if ($contract->contract_type === 'old_payment' && $contract->parent_contract_id) {
            $parentContract = Contract::find($contract->parent_contract_id);
            if ($parentContract) {
                $paymentAmount = floatval($contract->payment_amount);
                $netAmount = floatval($contract->net_amount);
                
                $parentContract->payment_amount = max(0, floatval($parentContract->payment_amount) - $paymentAmount);
                $parentContract->net_amount = max(0, floatval($parentContract->net_amount) - $netAmount);
                $parentContract->remaining_amount = floatval($parentContract->remaining_amount) + $paymentAmount;
                $parentContract->save();
            }
        }
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
        
        $originalAmount = floatval($request->payment_amount);
        
        // Detect if shared
        $isSharedSuffix = str_ends_with($contract->contract_number, '-S');
        $isOldPaymentMain = str_contains($contract->contract_number, '-P') && !str_contains($contract->contract_number, '-SP');
        $isOldPaymentShared = str_contains($contract->contract_number, '-SP');
        
        $isShared = $isSharedSuffix || 
                    $contract->contract_type === 'shared' || 
                    $contract->contract_type === 'shared_same_branch' ||
                    $isOldPaymentMain ||
                    $isOldPaymentShared;

        $partner = null;
        if ($isShared) {
            if ($isSharedSuffix) {
                $baseNumber = substr($contract->contract_number, 0, -2);
                $partner = Contract::where('contract_number', $baseNumber)->first();
            } else if ($isOldPaymentMain) {
                $partnerNumber = str_replace('-P', '-SP', $contract->contract_number);
                $partner = Contract::where('contract_number', $partnerNumber)->first();
            } else if ($isOldPaymentShared) {
                $partnerNumber = str_replace('-SP', '-P', $contract->contract_number);
                $partner = Contract::where('contract_number', $partnerNumber)->first();
            } else {
                $partner = Contract::where('contract_number', $contract->contract_number . '-S')->first();
            }
        }

        $amountForCurrent = $isShared ? ($originalAmount / 2) : $originalAmount;
        
        $payment = new ContractPayment($request->all());
        $payment->contract_id = $contract->id;
        $payment->payment_amount = $amountForCurrent;
        
        if ($payment->payment_amount && $payment->payment_method_id) {
            $payment->net_amount = $this->calculateNetAmount($payment->payment_amount, $payment->payment_method_id);
        }
        
        $payment->save();
        $this->syncContractHeader($contract);

        if ($isShared && $partner) {
            $partnerPayment = new ContractPayment($request->all());
            $partnerPayment->contract_id = $partner->id;
            $partnerPayment->payment_amount = $originalAmount - $amountForCurrent;
            if ($partnerPayment->payment_amount && $partnerPayment->payment_method_id) {
                $partnerPayment->net_amount = $this->calculateNetAmount($partnerPayment->payment_amount, $partnerPayment->payment_method_id);
            }
            $partnerPayment->save();
            $this->syncContractHeader($partner);
        }

        return $payment;
    }

    private function syncContractHeader(Contract $contract)
    {
        // Get directly attached payments
        $directPaid = floatval($contract->payments()->sum('payment_amount'));
        $directNet = floatval($contract->payments()->sum('net_amount'));
        
        // Add payments from child contracts (old_payment records)
        $childPaid = 0;
        $childNet = 0;
        
        $children = $contract->childContracts;
        foreach ($children as $child) {
            $childPaid += floatval($child->payments()->sum('payment_amount'));
            $childNet += floatval($child->payments()->sum('net_amount'));
        }

        $totalPaid = $directPaid + $childPaid;
        $totalNet = $directNet + $childNet;
        
        $contract->payment_amount = $totalPaid;
        $contract->net_amount = $totalNet;
        $contract->remaining_amount = ($contract->total_amount ?? 0) - $totalPaid;
        
        // Compatibility: Store details from the first payment if available
        $firstPayment = $contract->payments()->orderBy('created_at', 'asc')->first();
        if ($firstPayment) {
            $contract->payment_method_id = $firstPayment->payment_method_id;
            $contract->payment_number = $firstPayment->payment_number;
        }

        $contract->save();
        
        // If this is a child contract (old_payment), update the parent too
        if ($contract->contract_type === 'old_payment' && $contract->parent_contract_id) {
            $parent = Contract::find($contract->parent_contract_id);
            if ($parent) {
                $this->syncContractHeader($parent);
            }
        }
    }
}

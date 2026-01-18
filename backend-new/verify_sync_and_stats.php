<?php

use App\Models\Contract;
use App\Models\Branch;
use App\Models\PaymentMethod;
use App\Models\ContractPayment;
use App\Http\Controllers\StatisticsController;
use Illuminate\Http\Request;

function verify() {
    $branch1 = Branch::first();
    $branch2 = Branch::skip(1)->first() ?: $branch1;
    $method = PaymentMethod::first();

    if (!$branch1 || !$method) {
        echo "Missing base data\n";
        return;
    }

    echo "1. Testing Shared Payment Sync...\n";
    $mainContract = Contract::create([
        'contract_number' => 'SYNC-TEST-' . time(),
        'student_name' => 'Sync Student',
        'branch_id' => $branch1->id,
        'contract_type' => 'shared',
        'total_amount' => 1000, // This is already halved in store logic usually, but here we test the addPayment split
        'contract_date' => now(),
    ]);

    $partnerContract = Contract::create([
        'contract_number' => $mainContract->contract_number . '-S',
        'student_name' => 'Sync Student',
        'branch_id' => $branch2->id,
        'contract_type' => 'shared',
        'total_amount' => 1000,
        'contract_date' => now(),
    ]);

    echo "Adding a payment of 200 to Main Contract...\n";
    $controller = app(\App\Http\Controllers\ContractsController::class);
    $request = new Request([
        'payment_amount' => 200,
        'payment_method_id' => $method->id,
        'payment_number' => 'REF123',
    ]);
    
    $controller->addPayment($request, $mainContract->id);

    $mainContract->refresh();
    $partnerContract->refresh();

    echo "Main Contract Paid: " . $mainContract->payment_amount . "\n";
    echo "Partner Contract Paid: " . $partnerContract->payment_amount . "\n";

    if ($mainContract->payment_amount == 100 && $partnerContract->payment_amount == 100) {
        echo "SUCCESS: Payment split correctly (100 / 100).\n";
    } else {
        echo "FAILURE: Payment split failed.\n";
    }

    echo "\n2. Testing Statistics Cashflow Accuracy...\n";
    $statsController = app(StatisticsController::class);
    $statsRequest = new Request([
        'year' => date('Y'),
        'month' => date('m'),
        'branch_id' => $branch1->id
    ]);
    
    $statsResponse = $statsController->comprehensive($statsRequest);
    $stats = json_decode($statsResponse->getContent(), true);

    $branchStats = collect($stats['branches_comprehensive'])->where('branch_id', $branch1->id)->first();
    echo "Branch 1 Total Paid in Period: " . $branchStats['total_paid_amount'] . "\n";
    
    if ($branchStats['total_paid_amount'] >= 100) {
        echo "SUCCESS: Statistics included the new payment.\n";
    } else {
        echo "FAILURE: Statistics missed the payment.\n";
    }
}

verify();

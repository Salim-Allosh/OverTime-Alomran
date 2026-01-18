<?php

use App\Models\Contract;
use App\Models\Branch;

function verify() {
    $branch = Branch::first();
    if (!$branch) {
        echo "No branch found\n";
        return;
    }

    echo "Creating parent contract...\n";
    $parent = Contract::create([
        'contract_number' => 'TEST-PARENT-' . time(),
        'student_name' => 'Test Student',
        'branch_id' => $branch->id,
        'total_amount' => 1000,
    ]);

    echo "Creating child contract...\n";
    $child = Contract::create([
        'contract_number' => $parent->contract_number . '-CHILD',
        'student_name' => 'Test Student',
        'branch_id' => $branch->id,
        'parent_contract_id' => $parent->id,
        'total_amount' => 500,
    ]);

    echo "Deleting parent contract...\n";
    $parent->delete();

    $parentExists = Contract::find($parent->id);
    $childExists = Contract::find($child->id);

    if (!$parentExists && !$childExists) {
        echo "SUCCESS: Both parent and child contracts deleted recursively.\n";
    } else {
        echo "FAILURE: Contracts still exist.\n";
        if ($parentExists) echo "Parent still exists.\n";
        if ($childExists) echo "Child still exists.\n";
    }
}

verify();

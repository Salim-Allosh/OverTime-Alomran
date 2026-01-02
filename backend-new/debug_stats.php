<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Contract;
use App\Models\ContractPayment;
use Illuminate\Support\Facades\DB;

$year = 2026;

echo "--- Debugging Stats for Year $year ---\n";

// 1. Total Contracts Value (excluding 'payment' type)
$totalValue = Contract::whereYear('contract_date', $year)
    ->where('contract_type', '!=', 'payment')
    ->sum('total_amount');

echo "Total Contract Value (excluding 'payment'): " . number_format($totalValue, 2) . "\n";

// 2. Total Paid (Initial + Payments)
// Initial
$initialPaid = Contract::whereYear('contract_date', $year)->sum('payment_amount');
// Secondary Payments (created in 2026)
$secondaryPaid = ContractPayment::whereYear('created_at', $year)->sum('payment_amount');

$totalPaid = $initialPaid + $secondaryPaid;
echo "Total Paid (Initial: $initialPaid + Secondary: $secondaryPaid): " . number_format($totalPaid, 2) . "\n";

// 3. Total Net (Initial + Payments)
$initialNet = Contract::whereYear('contract_date', $year)->sum('net_amount');
$secondaryNet = ContractPayment::whereYear('created_at', $year)->sum('net_amount');
$totalNet = $initialNet + $secondaryNet;

echo "Total Net (Initial: $initialNet + Secondary: $secondaryNet): " . number_format($totalNet, 2) . "\n";

// 4. Fees
$fees = $totalPaid - $totalNet;
echo "Calculated Fees (Paid - Net): " . number_format($fees, 2) . "\n";

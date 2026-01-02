<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Contract;
use Illuminate\Support\Facades\DB;

$year = 2026;
echo "--- Verifying Logic Fix for Year $year ---\n";

$contracts = Contract::whereYear('contract_date', $year)->get();

$totalValue = 0;
$totalPaid = 0;
$totalNet = 0;

foreach ($contracts as $contract) {
    // 1. Value
    if ($contract->contract_type !== 'payment') {
        $totalValue += $contract->total_amount;
    }

    // 2. Paid & Net (Strictly from payments relation)
    foreach ($contract->payments as $payment) {
        $totalPaid += $payment->payment_amount;
        $totalNet += $payment->net_amount;
    }
}

echo "Total Contract Value: " . number_format($totalValue, 2) . "\n";
echo "Total Paid (From Payments Only): " . number_format($totalPaid, 2) . "\n";
echo "Total Net (From Payments Only): " . number_format($totalNet, 2) . "\n";
echo "Fees (Paid - Net): " . number_format($totalPaid - $totalNet, 2) . "\n";

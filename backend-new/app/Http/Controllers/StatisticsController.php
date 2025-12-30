<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Contract;
use App\Models\ContractPayment;
use App\Models\DailySalesReport;
use App\Models\SalesStaff;
use App\Models\Branch;
use App\Models\Course;
use App\Models\PaymentMethod;

class StatisticsController extends Controller
{
    public function comprehensive(Request $request)
    {
        $year = $request->input('year');
        $month = $request->input('month');
        $branchId = $request->input('branch_id');
        $salesStaffId = $request->input('sales_staff_id');

        // --- 1. total_unique_days (Based on Daily Sales Reports) ---
        $uniqueDaysQuery = DailySalesReport::query();
        if ($year) $uniqueDaysQuery->whereYear('report_date', $year);
        if ($month) $uniqueDaysQuery->whereMonth('report_date', $month);
        if ($branchId) $uniqueDaysQuery->where('branch_id', $branchId);
        if ($salesStaffId) $uniqueDaysQuery->where('sales_staff_id', $salesStaffId);
        $totalUniqueDays = $uniqueDaysQuery->distinct('report_date')->count('report_date');

        // --- 2. branches_comprehensive (Contracts Aggregation) ---
        // We really just need the totals, the frontend seems to iterate but the logic simplifies to "Total across filtered scope"
        // actually looking at frontend: branches_comprehensive might be expected to be ONE object or List? 
        // Logic: "reduce((sum, b) => sum + b.total_monthly_contracts, 0)" implies it expects an array of branch stats.
        // But if filtered by branch, it's array of 1.
        
        $contractsQuery = Contract::query();
        if ($year) $contractsQuery->whereYear('contract_date', $year);
        if ($month) $contractsQuery->whereMonth('contract_date', $month);
        if ($branchId) $contractsQuery->where('branch_id', $branchId);
        if ($salesStaffId) $contractsQuery->where('sales_staff_id', $salesStaffId);

        // We can group by branch to give the "branches_comprehensive" array
        // However, we also need to account for payments in this period.
        // Frontend logic uses: total_monthly_contracts, total_contracts_value, total_paid_amount, total_remaining_amount, total_net_amount
        
        // IMPORTANT: "total_paid_amount" usually includes initial payment + subsquent payments made in that period?
        // OR does it mean "Contracts created in that period, what is their total paid so far?"
        // Usually statistics dashboards show "Cashflow in this period" vs "Sales in this period".
        // Let's assume standard Sales Report logic:
        // - Contracts Value: Sum of total_amount of contracts created in this period.
        // - Paid Amount: Sum of initial payments of contracts in this period + ContractPayments in this period?
        // Let's stick to "Contracts created in this period" for simplicity and consistency with "total_contracts_value".
        // So total_paid_amount = sum(payment_amount) from contracts created in this period + sum(payments) belonging to these contracts?
        // OR is it ALL payments received in this period regardless of when contract was created?
        // Given it's a "Comprehensive" report with "Net Profit" pages etc, usually "Paid" means Cash In.
        // But the frontend groups it under "branches_comprehensive" which seems derived from Contracts list.
        
        // Let's use the simple interpretation first: Aggregates of Contracts created in the filter period.
        
        $branchStats = $contractsQuery->select(
            'branch_id',
            DB::raw('COUNT(*) as total_monthly_contracts'),
            DB::raw('SUM(total_amount) as total_contracts_value'),
            DB::raw('SUM(payment_amount) as total_initial_paid'),  // Only initial payment stored in contract
            DB::raw('SUM(remaining_amount) as total_remaining_amount'),
            DB::raw('SUM(net_amount) as total_net_amount')
        )->groupBy('branch_id')->get();

        // Now we need to add "Total Paid" correctly. 
        // If we strictly follow "Contracts created in this period", then "Total Paid" = initial_payment + subsequent_payments_of_these_contracts.
        // But extracting subsequent payments for THESE specific contracts efficiently?
        
        // Let's return the initial paid for now + calculate payments separately if needed.
        // Wait, `Contract` has `payment_amount` (initial).
        // Let's fetch all relevant contracts and their payments to get exact numbers? No, too heavy.
        
        // For now, I will approximate `total_paid_amount` as `total_amount - remaining_amount` (for the contracts in this period).
        // valid since remaining_amount is updated.
        
        $branchesComprehensive = $branchStats->map(function($stat) {
            return [
                'branch_id' => $stat->branch_id,
                'total_monthly_contracts' => $stat->total_monthly_contracts,
                'total_contracts_value' => $stat->total_contracts_value,
                'total_paid_amount' => $stat->total_contracts_value - $stat->total_remaining_amount, // Derived
                'total_remaining_amount' => $stat->total_remaining_amount,
                'total_net_amount' => $stat->total_net_amount
            ];
        });


        // --- 3. daily_reports_details ---
        $dailyQuery = DailySalesReport::query();
        if ($year) $dailyQuery->whereYear('report_date', $year);
        if ($month) $dailyQuery->whereMonth('report_date', $month);
        if ($branchId) $dailyQuery->where('branch_id', $branchId);
        if ($salesStaffId) $dailyQuery->where('sales_staff_id', $salesStaffId);
        
        $dailyStats = $dailyQuery->select(
            DB::raw('SUM(daily_calls) as total_calls'),
            DB::raw('SUM(hot_calls) as total_hot_calls'),
            DB::raw('SUM(branch_leads) as total_branch_leads'),
            DB::raw('SUM(online_leads) as total_online_leads'),
            DB::raw('SUM(number_of_visits) as total_visits')
        )->first();
        
        // Total Discounted? From PaymentMethod discount?
        // Or is it `total_amount - net_amount` from Contracts?
        // Let's calculate it from Contracts.
        $totalDiscounted = Contract::query();
        if ($year) $totalDiscounted->whereYear('contract_date', $year);
        if ($month) $totalDiscounted->whereMonth('contract_date', $month);
        if ($branchId) $totalDiscounted->where('branch_id', $branchId);
        if ($salesStaffId) $totalDiscounted->where('sales_staff_id', $salesStaffId);
        $discountValue = $totalDiscounted->sum(DB::raw('total_amount - net_amount')); // Assuming net_amount is after discount

        $dailyReportsDetails = [
            'total_calls' => (int)$dailyStats->total_calls,
            'total_hot_calls' => (int)$dailyStats->total_hot_calls,
            'total_branch_leads' => (int)$dailyStats->total_branch_leads,
            'total_online_leads' => (int)$dailyStats->total_online_leads,
            'total_visits' => (int)$dailyStats->total_visits,
            'total_discounted' => $discountValue
        ];


        // --- 4. payment_methods_details ---
        // Group initial payments (Contract)
        $initialPayments = Contract::query();
        if ($year) $initialPayments->whereYear('contract_date', $year);
        if ($month) $initialPayments->whereMonth('contract_date', $month);
        if ($branchId) $initialPayments->where('branch_id', $branchId);
        if ($salesStaffId) $initialPayments->where('sales_staff_id', $salesStaffId);
        
        $initialStats = $initialPayments->select(
            'payment_method_id',
            DB::raw('COUNT(*) as count'),
            DB::raw('SUM(payment_amount) as total_paid'),
            DB::raw('SUM(net_amount) as total_net') // Is net_amount per payment? No, per contract. 
            // Warning: Associating full contract Net Amount with initial payment method is wrong if there are multiple payments.
            // But usually initial payment defines the "Method" for the contract start.
            // Let's assume we sum `payment_amount` (Cash in) and calculate "Net" proportional to payment? 
            // Or just use the Contract's Net Amount logic?
            // "Net" usually means "After fees/discounts".
            // Let's use `payment_amount` and apply discount % from method?
            // Or use the stored `net_amount`?
            // Contract table has `net_amount`.
            // Let's sum `payment_amount` as total_paid.
        )->groupBy('payment_method_id')->get();

        // Group additional payments (ContractPayment)
        $additionalPayments = ContractPayment::query()->whereHas('contract', function($q) use ($year, $month, $branchId, $salesStaffId) {
             // Filter by Contract date or Payment date? Usually Payment Date for cash flow.
             // But existing logic seemed to filter by Contract Date for "Comprehensive stats for contracts in X".
             // Let's stick to Payment Date for this part if possible, BUT we are combining with initial payments which utilize Contract Date. 
             // To be consistent with "Contracts Report", we often look at "Everything related to contracts created in Jan".
             // Let's filter ContractPayment by created_at year/month? Or filter their parent Contract?
             // Let's filter by Payment Date (created_at of payment) for true cash flow.
             // BUT wait, Contract initial payment date IS contract_date.
             
             if ($year) $q->whereYear('contract_date', $year);
             if ($month) $q->whereMonth('contract_date', $month);
             if ($branchId) $q->where('branch_id', $branchId);
             if ($salesStaffId) $q->where('sales_staff_id', $salesStaffId);
        });
        
        // Actually, let's simplify. Just use Contracts for "Payment Methods used in Contracts"
        // This is what usually users want "How many contracts via Cash?".
        
        $paymentMethodsMap = [];
        
        foreach($initialStats as $stat) {
             if(!$stat->payment_method_id) continue;
             if(!isset($paymentMethodsMap[$stat->payment_method_id])) {
                 $paymentMethodsMap[$stat->payment_method_id] = [
                     'transactions_count' => 0,
                     'total_paid' => 0,
                     'total_net' => 0 // This is ambiguous, let's just sum paid for now
                 ];
             }
             $paymentMethodsMap[$stat->payment_method_id]['transactions_count'] += $stat->count;
             $paymentMethodsMap[$stat->payment_method_id]['total_paid'] += $stat->total_paid;
             // For net, let's assume it means "Money after payment gateway fees" or similar.
             // Since we don't have fee logic here, let's make total_net = total_paid
             $paymentMethodsMap[$stat->payment_method_id]['total_net'] += $stat->total_paid; 
        }

        $paymentMethodsDetails = [];
        $allMethods = PaymentMethod::all()->keyBy('id');
        
        foreach($paymentMethodsMap as $id => $data) {
            $name = $allMethods[$id]->name ?? 'Unknown';
            $paymentMethodsDetails[] = [
                'payment_method_id' => $id,
                'payment_method_name' => $name,
                'total_paid' => $data['total_paid'],
                'transactions_count' => $data['transactions_count'],
                'total_net' => $data['total_net']
            ];
        }


        // --- 5. sales_staff_details ---
        // Join SalesStaff, Contract, DailySalesReport
        // We need all staff, or just active ones?
        $staffQuery = SalesStaff::query();
        if ($branchId) $staffQuery->where('branch_id', $branchId);
        if ($salesStaffId) $staffQuery->where('id', $salesStaffId);
        $staffMembers = $staffQuery->with('branch')->get(); // Eager load branch
        
        $salesStaffDetails = [];
        foreach($staffMembers as $staff) {
            // Contracts stats
            $cQuery = Contract::query()->where('sales_staff_id', $staff->id);
            if ($year) $cQuery->whereYear('contract_date', $year);
            if ($month) $cQuery->whereMonth('contract_date', $month);
            
            $cStats = $cQuery->select(
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total_amount) as total_sales'), // total_sales = contract value?
                DB::raw('SUM(net_amount) as total_net_amount')
            )->first();

            // Daily Report Stats
            $dQuery = DailySalesReport::query()->where('sales_staff_id', $staff->id);
            if ($year) $dQuery->whereYear('report_date', $year);
            if ($month) $dQuery->whereMonth('report_date', $month);
            
            $dStats = $dQuery->select(
                DB::raw('COUNT(*) as reports_count'),
                DB::raw('SUM(daily_calls) as total_calls'),
                DB::raw('SUM(number_of_visits) as total_visits'),
                DB::raw('SUM(branch_leads + online_leads + extra_leads) as total_leads')
            )->first();

            $salesStaffDetails[] = [
                'staff_id' => $staff->id,
                'staff_name' => $staff->name,
                'branch_name' => $staff->branch->name ?? '',
                'total_sales' => (float)$cStats->total_sales,
                'contracts_count' => (int)$cStats->count,
                'contracts_value' => (float)$cStats->total_sales,
                'total_net_amount' => (float)$cStats->total_net_amount,
                'total_calls' => (int)$dStats->total_calls,
                'total_visits' => (int)$dStats->total_visits,
                'total_leads' => (int)$dStats->total_leads,
                'reports_count' => (int)$dStats->reports_count
            ];
        }


        // --- 6. incomplete_payment_contracts ---
        $incQuery = Contract::query()->where('remaining_amount', '>', 0);
        if ($year) $incQuery->whereYear('contract_date', $year);
        if ($month) $incQuery->whereMonth('contract_date', $month);
        if ($branchId) $incQuery->where('branch_id', $branchId);
        if ($salesStaffId) $incQuery->where('sales_staff_id', $salesStaffId);
        
        $incompleteContracts = $incQuery->with(['branch', 'salesStaff', 'course'])->get()->map(function($c) {
            return [
                'contract_id' => $c->id,
                'contract_number' => $c->contract_number,
                'student_name' => $c->student_name,
                'branch_name' => $c->branch->name ?? '',
                'sales_staff_name' => $c->salesStaff->name ?? '',
                'course_name' => $c->course->name ?? '',
                'registration_source' => $c->registration_source,
                'total_amount' => $c->total_amount,
                'paid_amount' => $c->total_amount - $c->remaining_amount,
                'remaining_amount' => $c->remaining_amount,
                'net_amount' => $c->net_amount
            ];
        });


        // --- 7. course_registration_details ---
        // Group contracts by course
        $courseQuery = Contract::query();
        if ($year) $courseQuery->whereYear('contract_date', $year);
        if ($month) $courseQuery->whereMonth('contract_date', $month);
        if ($branchId) $courseQuery->where('branch_id', $branchId);
        if ($salesStaffId) $courseQuery->where('sales_staff_id', $salesStaffId);

        $courseStats = $courseQuery->select(
            'course_id',
            DB::raw('COUNT(*) as total_registrations'),
            DB::raw('COUNT(DISTINCT branch_id) as branches_count'),
            DB::raw('SUM(total_amount) as total_value'),
            DB::raw('SUM(remaining_amount) as total_remaining'),
            DB::raw('SUM(net_amount) as total_net')
        )->groupBy('course_id')->get();
        
        $courseDetails = [];
        $allCourses = Course::all()->keyBy('id');
        
        foreach($courseStats as $stat) {
             if(!$stat->course_id) continue;
             $name = $allCourses[$stat->course_id]->name ?? 'Unknown';
             $courseDetails[] = [
                 'course_id' => $stat->course_id,
                 'course_name' => $name,
                 'branches_count' => $stat->branches_count,
                 'total_registrations' => $stat->total_registrations,
                 'total_value' => $stat->total_value,
                 'paid_amount' => $stat->total_value - $stat->total_remaining,
                 'remaining_amount' => $stat->total_remaining,
                 'net_amount' => $stat->total_net
             ];
        }

        return response()->json([
            'total_unique_days' => $totalUniqueDays,
            'branches_comprehensive' => $branchesComprehensive,
            'daily_reports_details' => $dailyReportsDetails,
            'payment_methods_details' => $paymentMethodsDetails,
            'sales_staff_details' => $salesStaffDetails,
            'incomplete_payment_contracts' => $incompleteContracts,
            'course_registration_details' => $courseDetails
        ]);
    }
}

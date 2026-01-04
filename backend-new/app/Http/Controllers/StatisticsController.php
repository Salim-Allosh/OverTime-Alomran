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

        $user = $request->user();
        if (!$user->is_super_admin && !$user->is_backdoor) {
            $branchId = $user->branch_id;
        }

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
        
        // We can group by branch to give the "branches_comprehensive" array
        // Logic Refactoring based on User Request:
        // 1. Total Contract Value = Sum(total_amount) WHERE contract_type != 'payment'
        // 2. Total Paid = Sum(payment_amount) (Initial) + Sum(ContractPayment amount)
        // 3. Total Remaining = Total Contract Value - Total Paid (Approximate, or sum remaining_amount directly)
        //    * Better: Sum(remaining_amount) from contracts.
        // 4. Total Net = Sum(net_amount) based on PAYMENTS.
        //    * Contract has initial net_amount. ContractPayment has net_amount.
        // 5. Total Fees = Total Paid - Total Net.

        // Step 1: Get base contracts statistics
        $contractsStats = $contractsQuery->get();

        // Initialize stats for ALL branches relevant to the query context
        $allBranchesQuery = Branch::query();
        if ($branchId) {
            $allBranchesQuery->where('id', $branchId);
        }
        $allBranches = $allBranchesQuery->get();

        $branchStats = [];
        foreach ($allBranches as $branch) {
            $branchStats[$branch->id] = [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'total_monthly_contracts' => 0,
                'total_contracts_value' => 0,
                'total_paid_amount' => 0,
                'total_remaining_amount' => 0,
                'total_net_amount' => 0,
                'total_daily_reports' => 0,
                'total_calls' => 0,
                'total_hot_calls' => 0,
                'total_walk_ins' => 0,
                'total_branch_leads' => 0,
                'total_online_leads' => 0,
                'total_extra_leads' => 0,
                'total_visits' => 0,
                'total_fees' => 0,
                'total_discounted' => 0
            ];
        }

        // Calculate Daily Reports detailed stats per branch
        $reportsQuery = DailySalesReport::query();
        if ($year) $reportsQuery->whereYear('report_date', $year);
        if ($month) $reportsQuery->whereMonth('report_date', $month);
        if ($salesStaffId) $reportsQuery->where('sales_staff_id', $salesStaffId);
        
        $reportsPerBranch = $reportsQuery->select(
            'branch_id', 
            DB::raw('count(*) as total'),
            DB::raw('SUM(daily_calls) as total_calls'),
            DB::raw('SUM(hot_calls) as total_hot_calls'),
            DB::raw('SUM(walk_ins) as total_walk_ins'),
            DB::raw('SUM(branch_leads) as total_branch_leads'),
            DB::raw('SUM(online_leads) as total_online_leads'),
            DB::raw('SUM(extra_leads) as total_extra_leads'),
            DB::raw('SUM(number_of_visits) as total_visits')
        )
            ->groupBy('branch_id')
            ->get()
            ->keyBy('branch_id');

        foreach ($reportsPerBranch as $bId => $stats) {
             if (isset($branchStats[$bId])) {
                 $branchStats[$bId]['total_daily_reports'] = $stats->total;
                 $branchStats[$bId]['total_calls'] = (int)$stats->total_calls;
                 $branchStats[$bId]['total_hot_calls'] = (int)$stats->total_hot_calls;
                 $branchStats[$bId]['total_walk_ins'] = (int)$stats->total_walk_ins;
                 $branchStats[$bId]['total_branch_leads'] = (int)$stats->total_branch_leads;
                 $branchStats[$bId]['total_online_leads'] = (int)$stats->total_online_leads;
                 $branchStats[$bId]['total_extra_leads'] = (int)$stats->total_extra_leads;
                 $branchStats[$bId]['total_visits'] = (int)$stats->total_visits;
             }
        }
        
        foreach ($contractsStats as $contract) {
            $bId = $contract->branch_id;
            // Fallback: This theoretically shouldn't happen if all branches are active, 
            // but if a contract belongs to an inactive/deleted branch we ignore it or add it safely.
            if (!isset($branchStats[$bId])) {
                 // Option: Skip or add. Let's add to be safe so numbers match totals.
                 $branchStats[$bId] = [
                    'branch_id' => $bId,
                    'branch_name' => 'Unknown Branch ' . $bId,
                    'total_monthly_contracts' => 0,
                    'total_contracts_value' => 0,
                    'total_paid_amount' => 0,
                    'total_remaining_amount' => 0,
                    'total_net_amount' => 0,
                    'total_daily_reports' => 0,
                    'total_fees' => 0
                ];
            }

            // 1. Total Contracts Value: Exclude 'payment' type (if exists) from "Sales Value"
            // Assuming 'payment' type or similar indicates a standalone payment record not a new sale.
            // If contract_type is 'payment', we skip adding to total_contracts_value, but we might count it in payments?
            // User said: "if contract type is payment do not count value again in total".
            if ($contract->contract_type !== 'payment') {
                $branchStats[$bId]['total_monthly_contracts']++;
                $branchStats[$bId]['total_contracts_value'] += $contract->total_amount;
                $branchStats[$bId]['total_remaining_amount'] += $contract->remaining_amount; // Remaining is usually attached to the main contract
                // Calculate Discount per branch: Total - Net
                $branchStats[$bId]['total_discounted'] += ($contract->total_amount - $contract->net_amount);
            }

            // 2. Total Paid & Net
            // Logic Fix: Avoid double counting. 
            // The ContractPayment table ("payments" relation) is the ledger.
            // We sum strictly from the related payments.
            
            $paymentsSum = 0;
            $netSum = 0;
            
            foreach ($contract->payments as $payment) {
                $paymentsSum += $payment->payment_amount;
                $netSum += $payment->net_amount;
            }

            // Fallback: If no payment records exist but the contract has a recorded `payment_amount` (Migration/Legacy case),
            // and we haven't counted anything yet, we might consider adding it.
            // However, based on "Systematic Data", we expect payment records.
            // To be safe against double counting: If we found payments, we trust the payments sum.
            // If we found NO payments, but contract says it has paid amount?
            if ($contractsStats->isEmpty() && $contract->payment_amount > 0) {
                 // decide whether to trust contract header. 
                 // For now, let's rely on the ledger (ContractPayment). 
                 // If the seeded data has payment records, this loop works.
            }

            $branchStats[$bId]['total_paid_amount'] += $paymentsSum;
            $branchStats[$bId]['total_net_amount'] += $netSum;
        }

        // Calculate Fees: Paid - Net
        foreach ($branchStats as &$stat) {
            $stat['total_fees'] = $stat['total_paid_amount'] - $stat['total_net_amount'];
            
            // Nested Daily Reports Stats for PDF Detailed Section
            $stat['daily_reports_stats'] = [
                'total_calls' => $stat['total_calls'],
                'total_hot_calls' => $stat['total_hot_calls'],
                'total_walk_ins' => $stat['total_walk_ins'],
                'total_branch_leads' => $stat['total_branch_leads'],
                'total_online_leads' => $stat['total_online_leads'],
                'total_extra_leads' => $stat['total_extra_leads'],
                'total_visits' => $stat['total_visits']
            ];
            
            // Initialize other nested stats
            $stat['payment_methods_stats'] = [];
            $stat['sales_staff_stats'] = [];
            $stat['incomplete_contracts_stats'] = [];
            $stat['course_registration_stats'] = [];
        }
        unset($stat); // CRITICAL: Sever reference to prevent overwriting in later loops

        $branchesComprehensive = array_values($branchStats);


        // --- 3. daily_reports_details ---
        $dailyQuery = DailySalesReport::query();
        if ($year) $dailyQuery->whereYear('report_date', $year);
        if ($month) $dailyQuery->whereMonth('report_date', $month);
        if ($branchId) $dailyQuery->where('branch_id', $branchId);
        if ($salesStaffId) $dailyQuery->where('sales_staff_id', $salesStaffId);
        
        $dailyStats = $dailyQuery->select(
            DB::raw('SUM(daily_calls) as total_calls'),
            DB::raw('SUM(hot_calls) as total_hot_calls'),
            DB::raw('SUM(walk_ins) as total_walk_ins'),
            DB::raw('SUM(branch_leads) as total_branch_leads'),
            DB::raw('SUM(online_leads) as total_online_leads'),
            DB::raw('SUM(extra_leads) as total_extra_leads'),
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
            'total_walk_ins' => (int)$dailyStats->total_walk_ins,
            'total_branch_leads' => (int)$dailyStats->total_branch_leads,
            'total_online_leads' => (int)$dailyStats->total_online_leads,
            'total_extra_leads' => (int)$dailyStats->total_extra_leads,
            'total_visits' => (int)$dailyStats->total_visits,
            'total_discounted' => $discountValue
        ];


        // --- 4. payment_methods_details & per-branch payment stats ---
        $initialPayments = Contract::query();
        if ($year) $initialPayments->whereYear('contract_date', $year);
        if ($month) $initialPayments->whereMonth('contract_date', $month);
        if ($branchId) $initialPayments->where('branch_id', $branchId);
        if ($salesStaffId) $initialPayments->where('sales_staff_id', $salesStaffId);
        
        $initialStatsPerBranch = $initialPayments->select(
            'branch_id',
            'payment_method_id',
            DB::raw('COUNT(*) as count'),
            DB::raw('SUM(payment_amount) as total_paid'),
            DB::raw('SUM(net_amount) as total_net')
        )->groupBy('branch_id', 'payment_method_id')->get();

        $paymentMethodsDetails = [];
        $allMethods = PaymentMethod::all()->keyBy('id');
        $globalPaymentMap = [];

        foreach ($initialStatsPerBranch as $stat) {
            if (!$stat->payment_method_id) continue;
            $mId = $stat->payment_method_id;
            $bId = $stat->branch_id;
            $mName = $allMethods[$mId]->name ?? 'Unknown';

            $item = [
                'payment_method_id' => $mId,
                'payment_method_name' => $mName,
                'total_paid' => (float)$stat->total_paid,
                'transactions_count' => (int)$stat->count,
                'total_net' => (float)$stat->total_net
            ];

            if (isset($branchStats[$bId])) {
                $branchStats[$bId]['payment_methods_stats'][] = $item;
            }

            if (!isset($globalPaymentMap[$mId])) {
                $globalPaymentMap[$mId] = [
                    'payment_method_id' => $mId,
                    'payment_method_name' => $mName,
                    'total_paid' => 0,
                    'transactions_count' => 0,
                    'total_net' => 0
                ];
            }
            $globalPaymentMap[$mId]['total_paid'] += $stat->total_paid;
            $globalPaymentMap[$mId]['transactions_count'] += $stat->count;
            $globalPaymentMap[$mId]['total_net'] += $stat->total_net;
        }
        $paymentMethodsDetails = array_values($globalPaymentMap);


        // --- 5. sales_staff_details & per-branch staff stats ---
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
                DB::raw('SUM(hot_calls) as total_hot_calls'),
                DB::raw('SUM(walk_ins) as total_walk_ins'),
                DB::raw('SUM(branch_leads) as total_branch_leads'),
                DB::raw('SUM(online_leads) as total_online_leads'),
                DB::raw('SUM(extra_leads) as total_extra_leads'),
                DB::raw('SUM(number_of_visits) as total_visits')
            )->first();

            $staffItem = [
                'staff_id' => $staff->id,
                'staff_name' => $staff->name,
                'branch_id' => $staff->branch_id,
                'branch_name' => $staff->branch->name ?? '',
                'total_sales' => (float)$cStats->total_sales,
                'contracts_count' => (int)$cStats->count,
                'contracts_value' => (float)$cStats->total_sales,
                'total_net_amount' => (float)$cStats->total_net_amount,
                'total_calls' => (int)$dStats->total_calls,
                'total_hot_calls' => (int)$dStats->total_hot_calls,
                'total_walk_ins' => (int)$dStats->total_walk_ins,
                'total_branch_leads' => (int)$dStats->total_branch_leads,
                'total_online_leads' => (int)$dStats->total_online_leads,
                'total_extra_leads' => (int)$dStats->total_extra_leads,
                'total_visits' => (int)$dStats->total_visits,
                'reports_count' => (int)$dStats->reports_count
            ];

            $salesStaffDetails[] = $staffItem;
            if (isset($branchStats[$staff->branch_id])) {
                $branchStats[$staff->branch_id]['sales_staff_stats'][] = $staffItem;
            }
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
                'branch_id' => $c->branch_id,
                'branch_name' => $c->branch->name ?? '',
                'sales_staff_name' => $c->salesStaff->name ?? '',
                'course_name' => $c->course->name ?? '',
                'registration_source' => $c->registration_source,
                'total_amount' => (float)$c->total_amount,
                'paid_amount' => (float)($c->total_amount - $c->remaining_amount),
                'remaining_amount' => (float)$c->remaining_amount,
                'net_amount' => (float)$c->net_amount
            ];
        });

        foreach($incompleteContracts as $inc) {
            if (isset($branchStats[$inc['branch_id']])) {
                $branchStats[$inc['branch_id']]['incomplete_contracts_stats'][] = $inc;
            }
        }


        // --- 7. course_registration_details ---
        // Group contracts by course
        $courseQuery = Contract::query();
        if ($year) $courseQuery->whereYear('contract_date', $year);
        if ($month) $courseQuery->whereMonth('contract_date', $month);
        if ($branchId) $courseQuery->where('branch_id', $branchId);
        if ($salesStaffId) $courseQuery->where('sales_staff_id', $salesStaffId);

        $courseStatsRaw = $courseQuery->select(
            'branch_id',
            'course_id',
            DB::raw('COUNT(*) as total_registrations'),
            DB::raw('SUM(total_amount) as total_value'),
            DB::raw('SUM(remaining_amount) as total_remaining'),
            DB::raw('SUM(net_amount) as total_net')
        )->groupBy('branch_id', 'course_id')->get();
        
        $allCourses = Course::all()->keyBy('id');
        $courseDetails = [];
        $globalCourseMap = [];

        foreach($courseStatsRaw as $stat) {
             if(!$stat->course_id) continue;
             $cId = $stat->course_id;
             $bId = $stat->branch_id;
             $name = $allCourses[$cId]->name ?? 'Unknown';

             $item = [
                 'course_id' => $cId,
                 'course_name' => $name,
                 'total_registrations' => (int)$stat->total_registrations,
                 'total_value' => (float)$stat->total_value,
                 'paid_amount' => (float)($stat->total_value - $stat->total_remaining),
                 'remaining_amount' => (float)$stat->total_remaining,
                 'net_amount' => (float)$stat->total_net
             ];

             if (isset($branchStats[$bId])) {
                 $branchStats[$bId]['course_registration_stats'][] = $item;
             }

             if (!isset($globalCourseMap[$cId])) {
                 $globalCourseMap[$cId] = [
                     'course_id' => $cId,
                     'course_name' => $name,
                     'branches_count' => 0,
                     'total_registrations' => 0,
                     'total_value' => 0,
                     'paid_amount' => 0,
                     'remaining_amount' => 0,
                     'net_amount' => 0
                 ];
             }
             $globalCourseMap[$cId]['branches_count']++;
             $globalCourseMap[$cId]['total_registrations'] += $stat->total_registrations;
             $globalCourseMap[$cId]['total_value'] += $stat->total_value;
             $globalCourseMap[$cId]['paid_amount'] += ($stat->total_value - $stat->total_remaining);
             $globalCourseMap[$cId]['remaining_amount'] += $stat->total_remaining;
             $globalCourseMap[$cId]['net_amount'] += $stat->total_net;
        }
        $courseDetails = array_values($globalCourseMap);

        // --- 8. visits_details ---
        $visitsQuery = DailySalesReport::with(['visits', 'salesStaff', 'branch']);
        if ($year) $visitsQuery->whereYear('report_date', $year);
        if ($month) $visitsQuery->whereMonth('report_date', $month);
        if ($branchId) $visitsQuery->where('branch_id', $branchId);
        if ($salesStaffId) $visitsQuery->where('sales_staff_id', $salesStaffId);

        $reportsWithVisits = $visitsQuery->get();
        $visitsDetails = [];

        foreach ($reportsWithVisits as $report) {
            foreach ($report->visits as $visit) {
                $visitsDetails[] = [
                    'date' => $report->report_date,
                    'sales_staff_name' => $report->salesStaff->name ?? '',
                    'branch_name' => $report->branch->name ?? '',
                    'customer_name' => $visit->customer_name ?? 'N/A', // Assuming visits have customer_name or we use update_details
                    'details' => $visit->update_details ?? '-',
                    'visit_time' => $visit->visit_time ?? '-'
                ];
            }
        }

        \Illuminate\Support\Facades\Log::info('Final Branch Stats:', $branchesComprehensive);

        return response()->json([
            'total_unique_days' => $totalUniqueDays,
            'branches_comprehensive' => $branchesComprehensive,
            'daily_reports_details' => $dailyReportsDetails,
            'payment_methods_details' => $paymentMethodsDetails,
            'sales_staff_details' => $salesStaffDetails,
            'incomplete_payment_contracts' => $incompleteContracts,
            'course_registration_details' => $courseDetails,
            'visits_details' => $visitsDetails
        ]);
    }
}

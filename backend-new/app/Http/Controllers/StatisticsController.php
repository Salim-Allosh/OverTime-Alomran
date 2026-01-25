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

        // Step 1: Get base contracts statistics for Deal counts and Sales Value
        $contractsStats = $contractsQuery->get();

        // Step 2: Get Payment Ledger statistics for accurate Cashflow/Net Profit
        $paymentLedgerQuery = ContractPayment::query()
            ->join('contracts', 'contract_payments.contract_id', '=', 'contracts.id');
        
        if ($year) $paymentLedgerQuery->whereYear('contract_payments.created_at', $year);
        if ($month) $paymentLedgerQuery->whereMonth('contract_payments.created_at', $month);
        if ($branchId) $paymentLedgerQuery->where('contracts.branch_id', $branchId);
        if ($salesStaffId) $paymentLedgerQuery->where('contracts.sales_staff_id', $salesStaffId);

        $paymentsInPeriod = $paymentLedgerQuery->select(
            'contracts.branch_id',
            DB::raw('SUM(contract_payments.payment_amount) as total_paid'),
            DB::raw('SUM(contract_payments.net_amount) as total_net')
        )->groupBy('contracts.branch_id')->get()->keyBy('branch_id');

        // Initialize stats...
        $allBranchesQuery = Branch::query();
        if ($branchId) $allBranchesQuery->where('id', $branchId);
        $allBranches = $allBranchesQuery->get();

        $branchStats = [];
        foreach ($allBranches as $branch) {
            $bId = $branch->id;
            $pStats = $paymentsInPeriod->get($bId);

            $branchStats[$bId] = [
                'branch_id' => $bId,
                'branch_name' => $branch->name,
                'total_monthly_contracts' => 0,
                'total_contracts_value' => 0,
                'total_paid_amount' => (float)($pStats->total_paid ?? 0),
                'total_remaining_amount' => 0,
                'total_net_amount' => (float)($pStats->total_net ?? 0),
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
        $reportsQuery = \App\Models\DailySalesReport::query();
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
            if (!isset($branchStats[$bId])) continue;

            // 1. Deals & Sales Value (Based on Contract creation)
            if ($contract->contract_type !== 'payment' && $contract->contract_type !== 'old_payment' && $contract->contract_type !== 'cancellation') {
                $branchStats[$bId]['total_monthly_contracts']++;
                $branchStats[$bId]['total_contracts_value'] += (float)$contract->total_amount;
                $branchStats[$bId]['total_remaining_amount'] += (float)$contract->remaining_amount;
                // total_discounted for contracts created in this period
                $branchStats[$bId]['total_discounted'] += (float)($contract->total_amount - $contract->net_amount);
            }
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
        $totalDiscounted = Contract::query()->where('contract_type', '!=', 'old_payment')
                                            ->where('contract_type', '!=', 'cancellation');
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
        $paymentMethodsQuery = ContractPayment::query()
            ->join('contracts', 'contract_payments.contract_id', '=', 'contracts.id')
            ->select(
                'contracts.branch_id',
                'contract_payments.payment_method_id',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(contract_payments.payment_amount) as total_paid'),
                DB::raw('SUM(contract_payments.net_amount) as total_net')
            );

        if ($year) $paymentMethodsQuery->whereYear('contract_payments.created_at', $year);
        if ($month) $paymentMethodsQuery->whereMonth('contract_payments.created_at', $month);
        if ($branchId) $paymentMethodsQuery->where('contracts.branch_id', $branchId);
        if ($salesStaffId) $paymentMethodsQuery->where('contracts.sales_staff_id', $salesStaffId);
        
        $paymentStats = $paymentMethodsQuery->groupBy('contracts.branch_id', 'contract_payments.payment_method_id')->get();

        $paymentMethodsDetails = [];
        $allMethods = PaymentMethod::all()->keyBy('id');
        $globalPaymentMap = [];

        foreach ($paymentStats as $stat) {
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
            // Contracts (Deals) count for this staff in period
            $cQuery = Contract::query()->where('sales_staff_id', $staff->id)
                ->where('contract_type', '!=', 'old_payment')
                ->where('contract_type', '!=', 'payment')
                ->where('contract_type', '!=', 'cancellation');
            if ($year) $cQuery->whereYear('contract_date', $year);
            if ($month) $cQuery->whereMonth('contract_date', $month);
            
            $cStats = $cQuery->select(
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total_amount) as total_sales_value')
            )->first();

            // Payments (Cashflow) for this staff in period
            // We query payments where the contract is assigned to this staff, 
            // and the payment itself was made in the target period.
            $pQuery = ContractPayment::query()
                ->join('contracts', 'contract_payments.contract_id', '=', 'contracts.id')
                ->where('contracts.sales_staff_id', $staff->id);
                
            if ($year) $pQuery->whereYear('contract_payments.created_at', $year);
            if ($month) $pQuery->whereMonth('contract_payments.created_at', $month);
            
            $pStats = $pQuery->select(
                DB::raw('SUM(contract_payments.payment_amount) as total_paid'),
                DB::raw('SUM(contract_payments.net_amount) as total_net')
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
                'total_sales' => (float)$cStats->total_sales_value, // Maintain compatibility
                'contracts_count' => (int)$cStats->count,
                'contracts_value' => (float)$cStats->total_sales_value,
                'total_net_amount' => (float)($pStats->total_net ?? 0), // Use actual payments net
                'total_paid_amount' => (float)($pStats->total_paid ?? 0),
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
        // We show contracts that are either created in the period OR had a payment in the period
        // AND still have a balance.
        $incQuery = Contract::where('remaining_amount', '>', 0);
        $incQuery->where(function($q) use ($year, $month) {
            $q->where(function($sq) use ($year, $month) {
                if ($year) $sq->whereYear('contract_date', $year);
                if ($month) $sq->whereMonth('contract_date', $month);
            })->orWhereHas('payments', function($pq) use ($year, $month) {
                if ($year) $pq->whereYear('created_at', $year);
                if ($month) $pq->whereMonth('created_at', $month);
            })->orWhereHas('childContracts.payments', function($pq) use ($year, $month) {
                if ($year) $pq->whereYear('created_at', $year);
                if ($month) $pq->whereMonth('created_at', $month);
            });
        });

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
                'paid_amount' => (float)($c->payment_amount), // Use the synced header field
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
        // We need TWO aggregations to be accurate:
        // A. Sales (Contracts created in period) -> Total Value, Remaining, Counts
        // B. Cashflow (Payments made in period) -> Paid, Net

        // A. Sales Aggregation
        $courseSalesQuery = Contract::query()
            ->select(
                'branch_id',
                'course_id',
                DB::raw('COUNT(*) as total_registrations'),
                DB::raw('SUM(total_amount) as total_value'),
                DB::raw('SUM(remaining_amount) as total_remaining')
            )
            ->where('contract_type', '!=', 'old_payment')
            ->where('contract_type', '!=', 'payment')
            ->where('contract_type', '!=', 'cancellation');

        if ($year) $courseSalesQuery->whereYear('contract_date', $year);
        if ($month) $courseSalesQuery->whereMonth('contract_date', $month);
        if ($branchId) $courseSalesQuery->where('branch_id', $branchId);
        if ($salesStaffId) $courseSalesQuery->where('sales_staff_id', $salesStaffId);

        $courseSalesRaw = $courseSalesQuery->groupBy('branch_id', 'course_id')->get()->keyBy(function($item) {
            return $item->branch_id . '-' . $item->course_id;
        });

        // B. Cashflow Aggregation (Payments in period)
        $courseCashflowQuery = ContractPayment::query()
            ->join('contracts', 'contract_payments.contract_id', '=', 'contracts.id')
            ->select(
                'contracts.branch_id',
                'contracts.course_id',
                DB::raw('SUM(contract_payments.payment_amount) as total_paid'),
                DB::raw('SUM(contract_payments.net_amount) as total_net')
            );
            
        if ($year) $courseCashflowQuery->whereYear('contract_payments.created_at', $year);
        if ($month) $courseCashflowQuery->whereMonth('contract_payments.created_at', $month);
        if ($branchId) $courseCashflowQuery->where('contracts.branch_id', $branchId);
        if ($salesStaffId) $courseCashflowQuery->where('contracts.sales_staff_id', $salesStaffId);

        $courseCashflowRaw = $courseCashflowQuery->groupBy('contracts.branch_id', 'contracts.course_id')->get()->keyBy(function($item) {
            return $item->branch_id . '-' . $item->course_id;
        });
        
        // Merge Keys (All unique pairs of Branch-Course from both Sales and Cashflow)
        $allKeys = $courseSalesRaw->keys()->merge($courseCashflowRaw->keys())->unique();

        $allCourses = Course::all()->keyBy('id');
        $globalCourseMap = [];

        foreach($allKeys as $key) {
             $sales = $courseSalesRaw->get($key);
             $cash = $courseCashflowRaw->get($key);
             
             $bId = $sales ? $sales->branch_id : ($cash ? $cash->branch_id : null);
             $cId = $sales ? $sales->course_id : ($cash ? $cash->course_id : null);
             
             if (!$cId || !$bId) continue;
             
             $name = $allCourses[$cId]->name ?? 'Unknown';

             $item = [
                 'course_id' => $cId,
                 'course_name' => $name,
                 'total_registrations' => (int)($sales->total_registrations ?? 0),
                 'total_value' => (float)($sales->total_value ?? 0),
                 'paid_amount' => (float)($cash->total_paid ?? 0),
                 'remaining_amount' => (float)($sales->total_remaining ?? 0),
                 'net_amount' => (float)($cash->total_net ?? 0),
                 'total_paid' => (float)($cash->total_paid ?? 0), // compatibility
                 'total_net' => (float)($cash->total_net ?? 0)    // compatibility
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
             $globalCourseMap[$cId]['total_registrations'] += $item['total_registrations'];
             $globalCourseMap[$cId]['total_value'] += $item['total_value'];
             $globalCourseMap[$cId]['paid_amount'] += $item['paid_amount'];
             $globalCourseMap[$cId]['remaining_amount'] += $item['remaining_amount'];
             $globalCourseMap[$cId]['net_amount'] += $item['net_amount'];
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
                $vItem = [
                    'date' => $report->report_date,
                    'sales_staff_name' => $report->salesStaff->name ?? '',
                    'branch_id' => $report->branch_id,
                    'branch_name' => $report->branch->name ?? '',
                    'customer_name' => $visit->customer_name ?? 'N/A', 
                    'details' => $visit->update_details ?? '-',
                    'visit_time' => $visit->visit_time ?? '-'
                ];
                $visitsDetails[] = $vItem;
                
                if (isset($branchStats[$report->branch_id])) {
                    if (!isset($branchStats[$report->branch_id]['visits_details'])) {
                        $branchStats[$report->branch_id]['visits_details'] = [];
                    }
                    $branchStats[$report->branch_id]['visits_details'][] = $vItem;
                }
            }
        }

        // --- 9. registration_sources_details ---
        $registrationSourcesGlobal = $this->getRegistrationSourcesDetails($year, $month, $branchId, $salesStaffId);
        foreach ($registrationSourcesGlobal as $source) {
            $bId = $source['branch_id'];
            if (isset($branchStats[$bId])) {
                if (!isset($branchStats[$bId]['registration_sources_stats'])) {
                    $branchStats[$bId]['registration_sources_stats'] = [];
                }
                $branchStats[$bId]['registration_sources_stats'][] = $source;
            }
        }

        $branchesComprehensive = array_values($branchStats);

        return response()->json([
            'total_unique_days' => $totalUniqueDays,
            'branches_comprehensive' => $branchesComprehensive,
            'daily_reports_details' => $dailyReportsDetails,
            'payment_methods_details' => $paymentMethodsDetails,
            'sales_staff_details' => $salesStaffDetails,
            'incomplete_payment_contracts' => $incompleteContracts,
            'course_registration_details' => $courseDetails,
            'visits_details' => $visitsDetails,
            'registration_sources_details' => $registrationSourcesGlobal
        ]);
    }

    private function getRegistrationSourcesDetails($year, $month, $branchId, $salesStaffId)
    {
        $query = Contract::query();
        if ($year) $query->whereYear('contract_date', $year);
        if ($month) $query->whereMonth('contract_date', $month);
        if ($branchId) $query->where('branch_id', $branchId);
        if ($salesStaffId) $query->where('sales_staff_id', $salesStaffId);

        // We exclude 'old_payment' if we want to focus on "Sales Sources" for new contracts, 
        // but often users want to see ALL sources. Let's include all for now unless specified.
        // Actually, 'old_payment' is a type, not a source. Source is like 'Facebook', 'Walk-in', etc.

        $statsRaw = ContractPayment::query()
            ->join('contracts', 'contract_payments.contract_id', '=', 'contracts.id')
            ->select(
                'contracts.branch_id',
                'contracts.registration_source',
                DB::raw('COUNT(DISTINCT contracts.id) as total_contracts'),
                DB::raw('SUM(contract_payments.payment_amount) as total_paid'),
                DB::raw('SUM(contract_payments.net_amount) as total_net')
            );
            
        if ($year) $statsRaw->whereYear('contract_payments.created_at', $year);
        if ($month) $statsRaw->whereMonth('contract_payments.created_at', $month);
        if ($branchId) $statsRaw->where('contracts.branch_id', $branchId);
        if ($salesStaffId) $statsRaw->where('contracts.sales_staff_id', $salesStaffId);

        $statsRaw = $statsRaw->groupBy('contracts.branch_id', 'contracts.registration_source')
            ->get();

        $allBranches = Branch::all()->keyBy('id');
        $details = [];

        foreach ($statsRaw as $stat) {
            $source = $stat->registration_source ?: 'Unknown';
            $bId = $stat->branch_id;
            $bName = $allBranches[$bId]->name ?? 'Unknown';

            $details[] = [
                'registration_source' => $source,
                'branch_id' => $bId,
                'branch_name' => $bName,
                'total_contracts' => (int)$stat->total_contracts,
                'total_paid' => (float)$stat->total_paid,
                'total_net' => (float)$stat->total_net
            ];
        }

        return $details;
    }
}

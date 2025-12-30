<?php

namespace App\Services;

use App\Models\Session;
use App\Models\SessionDraft;
use App\Models\Expense;
use App\Models\Contract;
use App\Models\Branch;
use Carbon\Carbon;

class ReportService
{
    public function getMonthlyReport($year, $month, $branchId)
    {
        // 1. Get Drafts
        $draftsQuery = SessionDraft::query();
        if ($branchId) $draftsQuery->where('branch_id', $branchId);
        if ($year) $draftsQuery->whereYear('created_at', $year);
        if ($month) $draftsQuery->whereMonth('created_at', $month);
        $allDrafts = $draftsQuery->orderBy('created_at', 'desc')->get();

        // 2. Get Approved Sessions
        $sessionsQuery = Session::query();
        if ($branchId) $sessionsQuery->where('branch_id', $branchId);
        if ($year) $sessionsQuery->whereYear('created_at', $year);
        if ($month) $sessionsQuery->whereMonth('created_at', $month);
        $allSessions = $sessionsQuery->orderBy('created_at', 'desc')->get();

        // 3. Get Expenses
        $expensesQuery = Expense::query();
        if ($branchId) $expensesQuery->where('branch_id', $branchId);
        if ($year) $expensesQuery->whereYear('created_at', $year);
        if ($month) $expensesQuery->whereMonth('created_at', $month);
        $allExpenses = $expensesQuery->orderBy('created_at', 'desc')->get();

        // Group by Month (Year-Month key)
        $monthlyData = [];

        $initMonth = function($date) use (&$monthlyData) {
            $key = $date->format('Y-n'); 
            if (!isset($monthlyData[$key])) {
                $monthlyData[$key] = [
                    'year' => $date->year,
                    'month' => $date->month,
                    'month_name' => '',
                    'approved' => [],
                    'rejected' => [],
                    'pending' => [],
                    'expenses' => 0
                ];
            }
            return $key;
        };

        foreach ($allDrafts as $draft) {
            $key = $initMonth($draft->created_at);
            if ($draft->status == 'rejected') {
                $monthlyData[$key]['rejected'][] = $draft;
            } elseif ($draft->status == 'pending') {
                $monthlyData[$key]['pending'][] = $draft;
            }
        }

        foreach ($allSessions as $session) {
            $key = $initMonth($session->created_at);
            $monthlyData[$key]['approved'][] = $session;
        }

        foreach ($allExpenses as $expense) {
            $key = $initMonth($expense->created_at);
            $monthlyData[$key]['expenses'] += $expense->amount;
        }

        return $this->formatMonthlyResponse($monthlyData);
    }

    private function formatMonthlyResponse($monthlyData)
    {
        $reports = [];
        $monthNames = [
            1 => "يناير", 2 => "فبراير", 3 => "مارس", 4 => "أبريل",
            5 => "مايو", 6 => "يونيو", 7 => "يوليو", 8 => "أغسطس",
            9 => "سبتمبر", 10 => "أكتوبر", 11 => "نوفمبر", 12 => "ديسمبر"
        ];

        foreach ($monthlyData as $data) {
            $teacherStats = [];
            $totalHours = 0;
            $totalRevenue = 0;

            foreach ($data['approved'] as $session) {
                $teacher = $session->teacher_name;
                if (!isset($teacherStats[$teacher])) {
                    $teacherStats[$teacher] = [
                        'teacher_name' => $teacher,
                        'total_hours' => 0,
                        'total_amount' => 0,
                        'session_count' => 0
                    ];
                }
                $teacherStats[$teacher]['total_hours'] += $session->duration_hours;
                $teacherStats[$teacher]['total_amount'] += $session->calculated_amount;
                $teacherStats[$teacher]['session_count']++;

                $totalHours += $session->duration_hours;
                $totalRevenue += $session->calculated_amount;
            }

            $teacherSummaries = array_values($teacherStats);
            usort($teacherSummaries, function($a, $b) {
                return strcmp($a['teacher_name'], $b['teacher_name']);
            });

            $reports[] = [
                'year' => $data['year'],
                'month' => $data['month'],
                'month_name' => $monthNames[$data['month']] ?? '',
                'total_drafts' => count($data['approved']) + count($data['rejected']) + count($data['pending']),
                'approved_count' => count($data['approved']),
                'rejected_count' => count($data['rejected']),
                'pending_count' => count($data['pending']),
                'approved_sessions' => $data['approved'],
                'rejected_drafts' => $data['rejected'],
                'pending_drafts' => $data['pending'],
                'teacher_summaries' => $teacherSummaries,
                'total_hours' => $totalHours,
                'total_revenue' => $totalRevenue,
                'total_expenses' => $data['expenses'],
                'net_profit' => $totalRevenue - $data['expenses']
            ];
        }

        usort($reports, function($a, $b) {
            if ($a['year'] != $b['year']) return $b['year'] - $a['year'];
            return $b['month'] - $a['month'];
        });

        return $reports;
    }

    public function getNetProfitAllMonths($year)
    {
        if (!$year) return [];

        $contracts = Contract::whereYear('contract_date', $year)->get();
        // Expenses are fetched but currently excluded from calculation per requirement
        $branches = Branch::all()->keyBy('id');
        $data = [];

        $getGroup = function($month) use (&$data, $year) {
            $key = "$year-$month";
            if (!isset($data[$key])) {
                $data[$key] = [
                    'year' => $year,
                    'month' => $month,
                    'month_name' => '',
                    'branches' => []
                ];
            }
            return $key;
        };

        foreach ($contracts as $contract) {
            $date = $contract->contract_date ?? $contract->created_at;
            if (!$date) continue;

            $month = $date->month;
            $key = $getGroup($month);
            $bId = $contract->branch_id;
            
            if (!isset($data[$key]['branches'][$bId])) {
                $data[$key]['branches'][$bId] = [
                    'branch_id' => $bId,
                    'branch_name' => $branches[$bId]->name ?? "Unknown",
                    'revenue' => 0,
                    'expenses' => 0,
                    'net_profit' => 0,
                    'expenses_list' => []
                ];
            }
            $data[$key]['branches'][$bId]['revenue'] += $contract->net_amount; 
        }

        // NOTE: Expenses processing removed as per "Clean Architecture" refactor of existing applied logic.
        
        $monthNames = [
            1 => "يناير", 2 => "فبراير", 3 => "مارس", 4 => "أبريل",
            5 => "مايو", 6 => "يونيو", 7 => "يوليو", 8 => "أغسطس",
            9 => "سبتمبر", 10 => "أكتوبر", 11 => "نوفمبر", 12 => "ديسمبر"
        ];

        $final = [];
        foreach ($data as $group) {
            $group['month_name'] = $monthNames[$group['month']];
            foreach ($group['branches'] as &$bData) {
                // Net Profit = Revenue (since expenses are excluded for now)
                $bData['net_profit'] = $bData['revenue'] - $bData['expenses'];
            }
            $group['branches'] = array_values($group['branches']);
            $final[] = $group;
        }

        usort($final, function($a, $b) {
            return $b['month'] - $a['month'];
        });

        return $final;
    }
}

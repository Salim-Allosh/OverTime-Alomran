<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Salary;
use App\Models\SalaryItem;
use App\Models\Employee;
use App\Models\Branch;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SalaryController extends Controller
{
    public function allMonthsData(Request $request)
    {
        $year = $request->query('year', now()->year);
        $branches = Branch::all();
        
        $monthsData = [];
        
        $monthNames = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل',
            5 => 'مايو', 6 => 'يونيو', 7 => 'يوليو', 8 => 'أغسطس',
            9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر'
        ];

        for ($m = 12; $m >= 1; $m--) {
            // Get all salaries for this month/year
            $salaries = Salary::where('year', $year)
                ->where('month', $m)
                ->get();
            
            if ($salaries->isEmpty()) {
                // If it's a future month, maybe skip or show as empty
                if ($year == now()->year && $m > now()->month) continue;
            }

            $branchSummary = $branches->map(function($branch) use ($salaries) {
                $branchSalaries = $salaries->where('branch_id', $branch->id);
                return [
                    'branch_id' => $branch->id,
                    'branch_name' => $branch->name,
                    'total_net' => $branchSalaries->sum('net_salary'),
                    'employee_count' => $branchSalaries->count(),
                    'processed_count' => $branchSalaries->where('is_processed', true)->count(),
                    'total_employees' => Employee::where('branch_id', $branch->id)->where('is_active', true)->count()
                ];
            });

            $monthsData[] = [
                'year' => (int)$year,
                'month' => $m,
                'month_name' => $monthNames[$m],
                'branches' => $branchSummary,
                'total_salary' => $salaries->sum('net_salary')
            ];
        }

        return response()->json($monthsData);
    }

    public function getBranchSalaries(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer'
        ]);

        $branchId = $request->branch_id;
        $month = $request->month;
        $year = $request->year;

        // Get all active employees for this branch
        $employees = Employee::where('branch_id', $branchId)
            ->where('is_active', true)
            ->get();

        $data = $employees->map(function($employee) use ($month, $year) {
            $salaryRecord = Salary::with('items')
                ->where('employee_id', $employee->id)
                ->where('month', $month)
                ->where('year', $year)
                ->first();

            return [
                'employee' => $employee,
                'salary_record' => $salaryRecord
            ];
        });

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'branch_id' => 'required|exists:branches,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer',
            'base_salary' => 'required|numeric',
            'working_days' => 'required|integer',
            'entitled_salary' => 'required|numeric',
            'net_salary' => 'required|numeric',
            'notes' => 'nullable|string',
            'items' => 'array'
        ]);

        return DB::transaction(function() use ($validated) {
            $employee = Employee::findOrFail($validated['employee_id']);

            $salary = Salary::updateOrCreate(
                [
                    'employee_id' => $validated['employee_id'],
                    'month' => $validated['month'],
                    'year' => $validated['year']
                ],
                [
                    'employee_name' => $employee->name,
                    'employment_number' => $employee->employment_number,
                    'branch_id' => $validated['branch_id'],
                    'base_salary' => $validated['base_salary'],
                    'working_days' => $validated['working_days'],
                    'entitled_salary' => $validated['entitled_salary'],
                    'net_salary' => $validated['net_salary'],
                    'notes' => $validated['notes'],
                    'is_processed' => true
                ]
            );

            // Clear old items and add new ones
            $salary->items()->delete();
            
            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $salary->items()->create([
                        'type' => $item['type'],
                        'amount' => $item['amount'],
                        'reason' => $item['reason'],
                        'is_automatic' => $item['is_automatic'] ?? false,
                        'days' => $item['days'] ?? null,
                    ]);
                }
            }

            return $salary->load('items');
        });
    }

    public function getMonthlyReportData(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer'
        ]);

        $month = $request->month;
        $year = $request->year;

        $branches = Branch::all();
        $reportData = [];

        foreach ($branches as $branch) {
            $salaries = Salary::with('items', 'employee')
                ->where('branch_id', $branch->id)
                ->where('month', $month)
                ->where('year', $year)
                ->where('is_processed', true)
                ->get();

            if ($salaries->isNotEmpty()) {
                $reportData[] = [
                    'branch_name' => $branch->name,
                    'salaries' => $salaries
                ];
            }
        }

        return response()->json([
            'month' => $month,
            'year' => $year,
            'data' => $reportData
        ]);
    }
}

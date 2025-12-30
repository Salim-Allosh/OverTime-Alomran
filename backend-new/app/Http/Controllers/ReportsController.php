<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Session;
use App\Models\SessionDraft;
use App\Models\Expense;
use App\Models\Branch;
use App\Models\Contract;
use Carbon\Carbon;

class ReportsController extends Controller
{
    protected $reportService;

    public function __construct(\App\Services\ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    public function monthly(Request $request)
    {
        $year = $request->input('year');
        $month = $request->input('month');
        $branchId = $request->input('branch_id');
        
        $user = $request->user();
        if (!$user->is_super_admin) {
            $branchId = $user->branch_id;
        }

        return response()->json($this->reportService->getMonthlyReport($year, $month, $branchId));
    }

    public function netProfit(Request $request)
    {
        return $this->monthly($request); 
    }

    public function netProfitAllMonths(Request $request)
    {
        try {
            $year = $request->input('year');
            return response()->json($this->reportService->getNetProfitAllMonths($year));
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}

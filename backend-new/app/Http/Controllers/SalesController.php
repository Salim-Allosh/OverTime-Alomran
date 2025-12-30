<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SalesStaff;
use App\Models\DailySalesReport;
use App\Models\SalesVisit;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    protected $salesService;

    public function __construct(\App\Services\SalesService $salesService)
    {
        $this->salesService = $salesService;
    }

    // Sales Staff
    public function staffIndex(Request $request)
    {
        return $this->salesService->getStaff($request->user(), $request->branch_id);
    }

    public function staffShow($id)
    {
        return $this->salesService->getStaffById($id);
    }

    public function staffStore(Request $request)
    {
        $user = $request->user();
        $this->authorizeStaffManage($user);
        
        $data = $request->validate([
            'name' => 'required',
            'branch_id' => 'required|exists:branches,id',
            'phone' => 'nullable',
            'email' => 'nullable',
            'is_active' => 'boolean'
        ]);

        $this->authorizeBranchAccess($user, $data['branch_id']);

        return $this->salesService->createStaff($data);
    }

    public function staffUpdate(Request $request, $id)
    {
        $user = $request->user();
        $this->authorizeStaffManage($user);

        $staff = $this->salesService->getStaffById($id);
        $this->authorizeBranchAccess($user, $staff->branch_id);

        return $this->salesService->updateStaff($id, $request->all());
    }

    public function staffDestroy(Request $request, $id)
    {
        $user = $request->user();
        $this->authorizeStaffManage($user);
        
        $staff = $this->salesService->getStaffById($id);
        $this->authorizeBranchAccess($user, $staff->branch_id);
        
        $this->salesService->deleteStaff($id);
        return response()->noContent();
    }
    
    // Daily Reports
    public function dailyReportsIndex(Request $request)
    {
        $filters = $request->only(['branch_id', 'date_from', 'date_to']);
        return $this->salesService->getDailyReports($request->user(), $filters);
    }

    public function dailyReportsShow($id)
    {
        return $this->salesService->getDailyReportById($id);
    }

    public function dailyReportsStore(Request $request)
    {
        $user = $request->user();
        if ($request->branch_id) {
            $this->authorizeBranchAccess($user, $request->branch_id);
        }

        try {
            return $this->salesService->createDailyReport($request->all());
        } catch (\Exception $e) {
            $code = $e->getCode() ?: 500;
            return response()->json(['message' => $e->getMessage()], $code >= 400 && $code < 600 ? $code : 500);
        }
    }

    public function dailyReportsUpdate(Request $request, $id)
    {
        $user = $request->user();
        $report = $this->salesService->getDailyReportById($id);
        $this->authorizeBranchAccess($user, $report->branch_id);
        
        return $this->salesService->updateDailyReport($id, $request->all());
    }

    public function dailyReportsDestroy(Request $request, $id)
    {
        $user = $request->user();
        $report = $this->salesService->getDailyReportById($id);
        $this->authorizeBranchAccess($user, $report->branch_id);

        $this->salesService->deleteDailyReport($id);
        return response()->noContent();
    }

    // Helpers for Auth within Controller
    private function authorizeStaffManage($user)
    {
        if (!$user->is_super_admin && !$user->is_sales_manager) {
            abort(403, 'غير مصرح');
        }
    }

    private function authorizeBranchAccess($user, $targetBranchId)
    {
        if (!$user->is_super_admin && !$user->is_backdoor) {
             if ($user->branch_id && $user->branch_id != $targetBranchId) {
                 abort(403, 'غير مصرح لهذا الفرع');
             }
        }
    }
}

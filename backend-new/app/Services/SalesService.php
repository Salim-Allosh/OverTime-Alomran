<?php

namespace App\Services;

use App\Models\SalesStaff;
use App\Models\DailySalesReport;
use App\Models\SalesVisit;
use Illuminate\Support\Facades\DB;

class SalesService
{
    // --- Sales Staff ---

    public function getStaff($user, $branchId = null, $includeTrashed = false)
    {
        $query = SalesStaff::with('branch');
        
        if ($includeTrashed) {
            $query->withTrashed();
        }

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }
        
        // RBAC Filter
        if (!$user->is_super_admin && !$user->is_backdoor) {
             if ($user->branch_id) {
                 $query->where('branch_id', $user->branch_id);
             } else {
                 // If not a super admin and has no branch assigned, return nothing to be safe
                 $query->whereRaw('0 = 1');
             }
        }

        return $query->get();
    }

    public function getStaffById($id)
    {
        return SalesStaff::with('branch')->findOrFail($id);
    }

    public function createStaff($data)
    {
        return SalesStaff::create($data);
    }

    public function updateStaff($id, $data)
    {
        $staff = SalesStaff::findOrFail($id);
        $staff->update($data);
        return $staff;
    }

    public function deleteStaff($id)
    {
        $staff = SalesStaff::findOrFail($id);
        $staff->is_active = false;
        $staff->save();
        $staff->delete();
    }

    // --- Daily Reports ---

    public function getDailyReports($user, $filters = [])
    {
        $query = DailySalesReport::with(['salesStaff', 'visits', 'branch']);
        
        if (isset($filters['branch_id'])) {
             $query->where('branch_id', $filters['branch_id']);
        }
        
        if (!$user->is_super_admin && !$user->is_backdoor) {
             if ($user->branch_id) {
                 $query->where('branch_id', $user->branch_id);
             }
        }
        
        if (isset($filters['date_from'])) {
            $query->where('report_date', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to'])) {
            $query->where('report_date', '<=', $filters['date_to']);
        }

        $today = now()->format('Y-m-d');
        $query->orderByRaw("CASE WHEN report_date = ? THEN 0 ELSE 1 END", [$today])
              ->orderBy('report_date', 'desc')
              ->orderBy('created_at', 'desc');

        return $query->get();
    }

    public function getDailyReportById($id)
    {
        return DailySalesReport::with(['salesStaff', 'visits', 'branch'])->findOrFail($id);
    }

    public function createDailyReport($data)
    {
        // Business Logic: Check duplicate
        $exists = DailySalesReport::where('sales_staff_id', $data['sales_staff_id'])
            ->where('report_date', $data['report_date'])
            ->exists();
            
        if ($exists) {
            throw new \Exception("يوجد تقرير يومي بالفعل لهذا الموظف في نفس التاريخ", 400);
        }

        return DB::transaction(function () use ($data) {
            $report = DailySalesReport::create(collect($data)->except('visits')->toArray());

            if (isset($data['visits']) && is_array($data['visits'])) {
                foreach ($data['visits'] as $visitData) {
                    $visitData['daily_sales_report_id'] = $report->id;
                    SalesVisit::create($visitData);
                }
            }
            return $report->load(['visits', 'salesStaff']);
        });
    }

    public function updateDailyReport($id, $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $report = DailySalesReport::findOrFail($id);
            $report->update(collect($data)->except('visits')->toArray());

            if (isset($data['visits']) && is_array($data['visits'])) {
                // Delete old visits and recreate
                $report->visits()->delete();
                foreach ($data['visits'] as $visitData) {
                    $visitData['daily_sales_report_id'] = $report->id;
                    SalesVisit::create($visitData);
                }
            }

            return $report->load(['visits', 'salesStaff']);
        });
    }

    public function deleteDailyReport($id)
    {
        $report = DailySalesReport::findOrFail($id);
        $report->delete();
    }
}

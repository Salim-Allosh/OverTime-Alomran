<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SalesVisit;
use App\Models\DailySalesReport;

class SalesVisitController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'report_id' => 'required|exists:daily_sales_reports,id',
            'branch_id' => 'required',
            // other fields...
        ]);

        $visit = SalesVisit::create([
            'daily_sales_report_id' => $request->report_id,
            'branch_id' => $request->branch_id,
            'update_details' => $request->update_details,
            'visit_order' => $request->visit_order ?? 1,
        ]);

        return $visit;
    }

    public function index($reportId)
    {
        return SalesVisit::where('daily_sales_report_id', $reportId)
            ->orderBy('visit_order')
            ->get();
    }

    public function update(Request $request, $id)
    {
        $visit = SalesVisit::findOrFail($id);
        $visit->update($request->all());
        return $visit;
    }

    public function destroy($id)
    {
        SalesVisit::destroy($id);
        return response()->noContent();
    }
}

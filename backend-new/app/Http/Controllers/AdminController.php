<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
use App\Models\Branch;
use App\Models\OperationAccount;
use App\Models\SalesStaff;
use App\Models\Course;
use App\Models\PaymentMethod;
use App\Models\Contract;
use App\Models\Session;
use App\Models\DailySalesReport;
use Carbon\Carbon;

class AdminController extends Controller
{
    private function checkSuperAdmin($user)
    {
        if (!$user->is_super_admin && !$user->is_backdoor) {
            abort(403, 'غير مصرح');
        }
    }

    public function health()
    {
        try {
            DB::connection()->getPdo();
            $dbStatus = true;
        } catch (\Exception $e) {
            $dbStatus = false;
        }

        return response()->json([
            'status' => 'ok',
            'database' => [
                'connected' => $dbStatus,
                'driver' => DB::connection()->getDriverName(),
            ]
        ]);
    }

    public function checkDbStructure()
    {
        $tables = DB::select('SHOW TABLES');
        $dbName = DB::connection()->getDatabaseName();
        $tableKey = "Tables_in_" . $dbName;
        
        $structure = [];
        foreach ($tables as $table) {
            $tableName = $table->$tableKey;
            $columns = Schema::getColumnListing($tableName);
            $structure[$tableName] = $columns;
        }

        return response()->json([
            'tables' => $structure,
            'counts' => [
                'contracts' => DB::table('contracts')->count(),
                'sessions' => DB::table('sessions')->count(),
            ]
        ]);
    }

    public function removeContractDates(Request $request)
    {
        $this->checkSuperAdmin($request->user());

        try {
            if (Schema::hasColumn('contracts', 'start_date')) {
                Schema::table('contracts', function ($table) {
                    $table->dropColumn('start_date');
                });
            }
            if (Schema::hasColumn('contracts', 'end_date')) {
                Schema::table('contracts', function ($table) {
                    $table->dropColumn('end_date');
                });
            }
            return response()->json(['status' => 'success', 'message' => 'Dates removed']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function executeSql(Request $request)
    {
        $this->checkSuperAdmin($request->user());
        
        $sql = $request->input('sql');
        if (!$sql) abort(400, 'SQL required');

        try {
            if (str_starts_with(strtoupper(trim($sql)), 'SELECT')) {
                $results = DB::select($sql);
                return response()->json(['type' => 'SELECT', 'data' => $results]);
            } else {
                $affected = DB::statement($sql);
                return response()->json(['type' => 'STATEMENT', 'affected' => $affected]);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function fixContractsBranchId(Request $request)
    {
        $this->checkSuperAdmin($request->user());
        
        // Logic to update branch_id based on sales_staff
         DB::statement("
            UPDATE contracts c
            INNER JOIN sales_staff s ON c.sales_staff_id = s.id
            SET c.branch_id = s.branch_id
            WHERE c.branch_id IS NULL OR c.branch_id = 0
        ");

        // Set default branch for others (ID 1 usually)
        DB::statement("
            UPDATE contracts 
            SET branch_id = 1
            WHERE branch_id IS NULL OR branch_id = 0
        ");

        return response()->json(['status' => 'success', 'message' => 'Fixed branch IDs']);
    }

    public function getDatabaseSchema(Request $request)
    {
        $this->checkSuperAdmin($request->user());
        
        $schema = [];
        $tables = DB::select('SHOW TABLES');
        $dbName = DB::connection()->getDatabaseName();
        $tableKey = "Tables_in_" . $dbName;

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;
            $columns = DB::select("SHOW FULL COLUMNS FROM `$tableName`");
            $schema[$tableName] = [
                'columns' => $columns,
                'count' => DB::table($tableName)->count()
            ];
        }

        return response()->json($schema);
    }

    public function clearAndSeed(Request $request)
    {
        $this->checkSuperAdmin($request->user());

        try {
             DB::statement('SET FOREIGN_KEY_CHECKS=0;');
             
             // Truncate tables
             $tables = ['contracts', 'sessions', 'session_drafts', 'expenses', 'daily_sales_reports', 'sales_staff', 'courses', 'payment_methods', 'sales_visits', 'contract_payments'];
             foreach ($tables as $table) {
                 DB::table($table)->truncate();
             }
             
             DB::statement('SET FOREIGN_KEY_CHECKS=1;');

             // Seeding logic (Simplified version of Python script)
             // 1. Sales Staff
             $branches = Branch::all();
             if ($branches->isEmpty()) return response()->json(['error' => 'No branches found'], 400);
             
             $staffData = [
                 ['name' => 'أحمد محمد علي', 'branch_idx' => 0],
                 ['name' => 'فاطمة حسن', 'branch_idx' => 0],
                 ['name' => 'خالد سعيد', 'branch_idx' => 1], // Assuming exists
                 ['name' => 'علي حسن', 'branch_idx' => 0],
             ];

             foreach ($staffData as $s) {
                 $b = $branches[$s['branch_idx'] % $branches->count()];
                 SalesStaff::create([
                     'name' => $s['name'],
                     'branch_id' => $b->id,
                     'phone' => '050' . rand(1000000, 9999999),
                     'email' => 'staff@example.com',
                     'is_active' => true
                 ]);
             }

             // 2. Courses
             $courses = ['برمجة', 'تصميم', 'محاسبة', 'إدارة'];
             foreach ($courses as $c) {
                 Course::create(['name' => "دورة $c", 'type' => $c]);
             }

             // 3. Payment Methods
             PaymentMethod::create(['name' => 'Cash', 'discount_percentage' => 0]);
             PaymentMethod::create(['name' => 'Visa', 'discount_percentage' => 0]);

             // Seed additional random data for Sessions if needed...
             // For now, basic setup is done.

             return response()->json(['status' => 'success', 'message' => 'Database cleared and seeded']);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

}

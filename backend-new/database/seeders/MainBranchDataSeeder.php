<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Branch;
use App\Models\OperationAccount;
use App\Models\SalesStaff;
use App\Models\Course;
use App\Models\PaymentMethod;
use App\Models\Contract;
use App\Models\ContractPayment;
use App\Models\DailySalesReport;
use App\Models\SalesVisit;
use Carbon\Carbon;

class MainBranchDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // 1. Create Main Branch
        $branch = Branch::firstOrCreate(
            ['name' => 'Main Branch'],
            ['default_hourly_rate' => 150.00]
        );

        $this->command->info('Main Branch created/found: ' . $branch->name);

        // 2. Create Admin Account
        $admin = OperationAccount::firstOrCreate(
            ['username' => 'jad'],
            [
                'password_hash' => Hash::make('jad'),
                'branch_id' => $branch->id,
                'is_super_admin' => true,
                'is_sales_manager' => true,
                'is_operation_manager' => true,
                'is_branch_account' => true,
                'is_backdoor' => false,
                'is_active' => true,
            ]
        );
        $this->command->info('Admin user created (username: admin, password: password)');

        // 3. Create Sales Staff
        $staffNames = ['Ahmed Sales', 'Sara Sales', 'Mohamed Sales'];
        $salesStaffIds = [];

        foreach ($staffNames as $name) {
            $staff = SalesStaff::firstOrCreate(
                ['name' => $name, 'branch_id' => $branch->id],
                [
                    'phone' => '050' . rand(1000000, 9999999),
                    'email' => strtolower(str_replace(' ', '.', $name)) . '@example.com',
                    'is_active' => true
                ]
            );
            $salesStaffIds[] = $staff->id;
        }
        $this->command->info('Sales Staff created: ' . implode(', ', $staffNames));

        // 4. Create Lookups (Courses & Payment Methods)
        $courses = [
            ['name' => 'General English', 'type' => 'Language'],
            ['name' => 'IELTS Preparation', 'type' => 'Exam Prep'],
            ['name' => 'Business English', 'type' => 'Professional'],
            ['name' => 'Kids Club', 'type' => 'Young Learners'],
        ];

        $courseIds = [];
        foreach ($courses as $c) {
            $course = Course::firstOrCreate(['name' => $c['name']], ['type' => $c['type'], 'is_active' => true]);
            $courseIds[] = $course->id;
        }

        $paymentMethods = [
            ['name' => 'Cash', 'discount' => 0],
            ['name' => 'Visa', 'discount' => 0],
            ['name' => 'Tabby', 'discount' => 0],
            ['name' => 'Tamara', 'discount' => 0],
        ];

        $pmIds = [];
        foreach ($paymentMethods as $pm) {
            $method = PaymentMethod::firstOrCreate(
                ['name' => $pm['name']],
                ['discount_percentage' => $pm['discount'], 'is_active' => true]
            );
            $pmIds[] = $method->id;
        }

        // 5. Create Contracts (3 Months in 2025, 10 per month, multiples of 100)
        $this->command->info('Creating 30 Contracts (Jan-Mar 2025)...');
        
        $months = [1, 2, 3]; // January, February, March
        $contractCounter = 1;

        foreach ($months as $month) {
            for ($i = 1; $i <= 10; $i++) {
                $contractNumber = 'CNT-2025-' . str_pad($contractCounter++, 4, '0', STR_PAD_LEFT);
                
                // Total Amount: Multiple of 100 (e.g., 1000 to 5000)
                $totalAmount = rand(10, 50) * 100;
                
                // Payment Logic
                $rand = rand(1, 10);
                if ($rand <= 5) {
                    // Full Payment
                    $paymentAmount = $totalAmount;
                    $status = 'active';
                } elseif ($rand <= 8) {
                    // Partial Payment (Multiple of 100)
                    // Ensure remaining is at least 100
                    $maxPartial = ($totalAmount / 100) - 1;
                    $paymentAmount = rand(1, $maxPartial) * 100;
                    $status = 'active';
                } else {
                    // Unpaid
                    $paymentAmount = 0;
                    $status = 'new';
                }

                $remaining = $totalAmount - $paymentAmount;
                $pmId = $pmIds[array_rand($pmIds)];

                $contractDate = Carbon::create(2025, $month, rand(1, 28));

                $contract = Contract::create([
                    'contract_number' => $contractNumber,
                    'student_name' => 'Student 2025-' . $contractCounter,
                    'client_phone' => '050' . rand(1111111, 9999999),
                    'registration_source' => 'Walk-in',
                    'branch_id' => $branch->id,
                    'sales_staff_id' => $salesStaffIds[array_rand($salesStaffIds)],
                    'course_id' => $courseIds[array_rand($courseIds)],
                    'total_amount' => $totalAmount,
                    'payment_amount' => $paymentAmount,
                    'payment_method_id' => $paymentAmount > 0 ? $pmId : null,
                    'remaining_amount' => $remaining,
                    'net_amount' => $paymentAmount, // Simplification: Net = Paid
                    'contract_type' => $status,
                    'contract_date' => $contractDate,
                    'notes' => 'Seeded 2025 contract',
                ]);

                // Create Payment Record if paid
                if ($paymentAmount > 0) {
                    ContractPayment::create([
                        'contract_id' => $contract->id,
                        'payment_amount' => $paymentAmount,
                        'payment_method_id' => $pmId,
                        // For multiple of 100 verification, net equals payment here
                        'net_amount' => $paymentAmount,
                        'created_at' => $contractDate,
                        'updated_at' => $contractDate,
                    ]);
                }
            }
        }

        // 6. Create Daily Sales Reports (Last 7 days)
        $this->command->info('Creating Sales Reports...');
        $startDate = Carbon::now()->subDays(6);

        foreach ($salesStaffIds as $staffId) {
            for ($d = 0; $d < 7; $d++) {
                $date = $startDate->copy()->addDays($d);
                
                $report = DailySalesReport::create([
                    'branch_id' => $branch->id,
                    'sales_staff_id' => $staffId,
                    'report_date' => Carbon::create(2026, 1, 1)->addDays($d),
                    'sales_amount' => rand(0, 5000),
                    'number_of_deals' => rand(0, 3),
                    'daily_calls' => rand(10, 30),
                    'hot_calls' => rand(1, 5),
                    'walk_ins' => rand(0, 5),
                    'branch_leads' => rand(5, 15),
                    'number_of_visits' => rand(0, 2),
                ]);

                // Create visits
                if ($report->number_of_visits > 0) {
                    for ($v = 0; $v < $report->number_of_visits; $v++) {
                        SalesVisit::create([
                            'daily_sales_report_id' => $report->id,
                            'branch_id' => $branch->id,
                            'update_details' => 'Visit to client ' . rand(1, 100),
                            'visit_order' => $v + 1
                        ]);
                    }
                }
            }
        }
        
        $this->command->info('Seeding Completed Succesfully!');
    }
}

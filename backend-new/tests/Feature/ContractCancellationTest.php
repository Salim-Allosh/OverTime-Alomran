<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Branch;
use App\Models\SalesStaff;
use App\Models\Course;
use App\Models\PaymentMethod;
use App\Models\Contract;
use App\Models\ContractPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ContractCancellationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $branch;
    protected $staff;
    protected $course;
    protected $paymentMethod;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->branch = Branch::create(['name' => 'Main Branch']);
        $this->user = User::factory()->create([
            'branch_id' => $this->branch->id,
            'is_super_admin' => true
        ]);
        $this->staff = SalesStaff::create([
            'name' => 'John Doe',
            'branch_id' => $this->branch->id,
            'is_active' => true
        ]);
        $this->course = Course::create(['name' => 'PHP Course', 'is_active' => true]);
        $this->paymentMethod = PaymentMethod::create([
            'name' => 'Cash',
            'tax_percentage' => 0,
            'discount_percentage' => 0
        ]);
    }

    public function test_cancellation_reduces_parent_total_and_records_negative_payment()
    {
        // 1. Create a contract
        $contract = Contract::create([
            'contract_number' => 'CON-101',
            'student_name' => 'Student A',
            'branch_id' => $this->branch->id,
            'sales_staff_id' => $this->staff->id,
            'course_id' => $this->course->id,
            'total_amount' => 1000,
            'contract_date' => now(),
            'contract_type' => 'new'
        ]);

        ContractPayment::create([
            'contract_id' => $contract->id,
            'payment_amount' => 500,
            'payment_method_id' => $this->paymentMethod->id,
            'net_amount' => 500
        ]);

        // Sync header
        $contract->payment_amount = 500;
        $contract->remaining_amount = 500;
        $contract->net_amount = 500;
        $contract->save();

        $this->assertEquals(1000, $contract->total_amount);
        $this->assertEquals(500, $contract->payment_amount);

        // 2. Perform cancellation
        $response = $this->actingAs($this->user)->postJson('/api/contracts', [
            'contract_type' => 'cancellation',
            'parent_contract_id' => $contract->id,
            'branch_id' => $this->branch->id,
            'sales_staff_id' => $this->staff->id,
            'student_name' => $contract->student_name,
            'course_id' => $contract->course_id,
            'payments' => [
                [
                    'payment_amount' => 200,
                    'payment_method_id' => $this->paymentMethod->id
                ]
            ],
            'contract_date' => now()->format('Y-m-d')
        ]);

        $response->assertStatus(201);
        
        // 3. Verify parent contract
        $contract->refresh();
        // total_amount should be 1000 - 200 = 800
        $this->assertEquals(800, $contract->total_amount);
        // payment_amount should be 500 - 200 = 300
        $this->assertEquals(300, $contract->payment_amount);
        // remaining_amount should be 800 - 300 = 500
        $this->assertEquals(500, $contract->remaining_amount);

        // 4. Verify cancellation record (child)
        $cancellation = Contract::where('parent_contract_id', $contract->id)
            ->where('contract_type', 'cancellation')
            ->first();
        
        $this->assertNotNull($cancellation);
        $this->assertEquals(0, $cancellation->total_amount);
        
        $payment = $cancellation->payments()->first();
        $this->assertEquals(-200, $payment->payment_amount);
    }
}

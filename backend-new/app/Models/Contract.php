<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    use HasFactory;

    protected $table = 'contracts';

    protected $fillable = [
        'contract_number',
        'student_name',
        'client_phone',
        'registration_source',
        'branch_id',
        'sales_staff_id',
        'course_id',
        'total_amount',
        'payment_amount',
        'payment_method_id',
        'payment_number',
        'remaining_amount',
        'net_amount',
        'contract_type', // new, shared, old_payment
        'shared_branch_id',
        'shared_amount',
        'parent_contract_id',
        'contract_date',
        'notes',
    ];

    protected $casts = [
        'contract_date' => 'date',
        'total_amount' => 'decimal:2',
        'payment_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'shared_amount' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function salesStaff()
    {
        return $this->belongsTo(SalesStaff::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function sharedBranch()
    {
        return $this->belongsTo(Branch::class, 'shared_branch_id');
    }

    public function parentContract()
    {
        return $this->belongsTo(Contract::class, 'parent_contract_id');
    }

    public function payments()
    {
        return $this->hasMany(ContractPayment::class);
    }
}

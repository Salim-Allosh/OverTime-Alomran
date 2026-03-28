<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Salary extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'employee_name',
        'employment_number',
        'branch_id',
        'month',
        'year',
        'base_salary',
        'working_days',
        'entitled_salary',
        'net_salary',
        'notes',
        'is_processed',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class)->withTrashed();
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function items()
    {
        return $this->hasMany(SalaryItem::class);
    }
}

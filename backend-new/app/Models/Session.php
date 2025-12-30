<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    protected $fillable = [
        'branch_id', 'teacher_name', 'student_name', 'session_date',
        'start_time', 'end_time', 'duration_hours', 'duration_text',
        'contract_number', 'hourly_rate', 'calculated_amount', 'location',
        'approved_by'
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function approver()
    {
        return $this->belongsTo(OperationAccount::class, 'approved_by');
    }
}

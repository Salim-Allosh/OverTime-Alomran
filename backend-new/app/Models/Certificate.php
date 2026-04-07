<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_name_ar',
        'student_name_en',
        'phone_number',
        'contract_number',
        'id_passport_number',
        'certificate_name',
        'course_type',
        'duration',
        'certificate_type',
        'status',
        'file_path',
        'branch_id',
        'operation_account_id',
        'month',
        'year',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function operationAccount()
    {
        return $this->belongsTo(OperationAccount::class);
    }
}

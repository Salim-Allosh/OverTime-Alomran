<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class OperationAccount extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'username', 'password_hash', 'branch_id', 'is_super_admin',
        'is_sales_manager', 'is_operation_manager', 'is_branch_account',
        'is_backdoor', 'is_active'
    ];

    protected $hidden = ['password_hash'];

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}

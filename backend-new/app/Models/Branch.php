<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = ['name', 'default_hourly_rate'];

    public function operationAccounts()
    {
        return $this->hasMany(OperationAccount::class);
    }
}

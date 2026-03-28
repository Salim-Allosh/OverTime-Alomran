<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalaryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'salary_id',
        'type',
        'amount',
        'reason',
        'is_automatic',
        'days',
    ];

    protected $casts = [
        'is_automatic' => 'boolean',
    ];

    public function salary()
    {
        return $this->belongsTo(Salary::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NetProfitExpense extends Model
{
    use HasFactory;

    protected $table = 'net_profit_expenses';

    protected $fillable = [
        'branch_id',
        'title',
        'amount',
        'expense_date',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}

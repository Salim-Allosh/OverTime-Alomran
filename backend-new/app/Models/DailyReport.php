<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyReport extends Model
{
    use HasFactory;

    protected $table = 'daily_reports';

    protected $fillable = [
        'branch_id',
        'report_date',
        'total_sessions',
        'total_hours',
        'total_amount',
        'internal_sessions',
        'external_sessions',
        'internal_amount',
        'external_amount',
        'total_expenses',
        'net_profit',
        'notes',
    ];

    protected $casts = [
        'report_date' => 'date',
        'total_hours' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'internal_amount' => 'decimal:2',
        'external_amount' => 'decimal:2',
        'total_expenses' => 'decimal:2',
        'net_profit' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}

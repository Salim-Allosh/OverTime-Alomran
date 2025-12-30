<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailySalesReport extends Model
{
    use HasFactory;

    protected $table = 'daily_sales_reports';
    public $timestamps = false; // Based on Python code, only created_at is manually set or defaulted

    protected $fillable = [
        'branch_id',
        'sales_staff_id',
        'report_date',
        'sales_amount',
        'number_of_deals',
        'daily_calls',
        'hot_calls',
        'walk_ins',
        'branch_leads',
        'online_leads',
        'extra_leads',
        'number_of_visits',
        'notes',
        'created_at'
    ];

    protected $casts = [
        'report_date' => 'date',
        'sales_amount' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function salesStaff()
    {
        return $this->belongsTo(SalesStaff::class);
    }

    public function visits()
    {
        return $this->hasMany(SalesVisit::class);
    }
}

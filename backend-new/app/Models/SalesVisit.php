<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesVisit extends Model
{
    use HasFactory;

    protected $table = 'sales_visits';
    public $timestamps = false;

    protected $fillable = [
        'daily_sales_report_id',
        'branch_id',
        'update_details',
        'visit_order',
        'created_at'
    ];

    public function dailySalesReport()
    {
        return $this->belongsTo(DailySalesReport::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}

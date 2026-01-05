<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $table = 'payment_methods';

    protected $fillable = [
        'name',
        'discount_percentage',
        'tax_percentage',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'discount_percentage' => 'decimal:4',
        'tax_percentage' => 'decimal:4',
    ];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContractPayment extends Model
{
    use HasFactory;

    protected $table = 'contract_payments';
    public $timestamps = true;

    protected $fillable = [
        'contract_id',
        'payment_amount',
        'payment_method_id',
        'payment_number',
        'net_amount',
        'created_at',
    ];

    protected $casts = [
        'payment_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }
}

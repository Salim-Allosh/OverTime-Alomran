<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNetProfitExpensesTable extends Migration
{
    public function up()
    {
        Schema::create('net_profit_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->string('title');
            $table->decimal('amount', 12, 2);
            $table->timestamp('expense_date')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('net_profit_expenses');
    }
}

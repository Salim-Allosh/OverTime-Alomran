<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('payment_methods', function (Blueprint $input) {
            $input->decimal('tax_percentage', 10, 4)->default(0.05)->after('discount_percentage');
        });
    }

    public function down()
    {
        Schema::table('payment_methods', function (Blueprint $input) {
            $input->dropColumn('tax_percentage');
        });
    }
};

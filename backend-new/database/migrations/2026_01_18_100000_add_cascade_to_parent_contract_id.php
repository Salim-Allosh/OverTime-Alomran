<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCascadeToParentContractId extends Migration
{
    public function up()
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropForeign(['parent_contract_id']);
            $table->foreignId('parent_contract_id')->nullable()->change()->constrained('contracts')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropForeign(['parent_contract_id']);
            $table->foreignId('parent_contract_id')->nullable()->change()->constrained('contracts');
        });
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIsHrManagerToOperationAccountsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('operation_accounts', function (Blueprint $table) {
            $table->boolean('is_hr_manager')->default(false)->after('is_backdoor');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('operation_accounts', function (Blueprint $table) {
            $table->dropColumn('is_hr_manager');
        });
    }
}

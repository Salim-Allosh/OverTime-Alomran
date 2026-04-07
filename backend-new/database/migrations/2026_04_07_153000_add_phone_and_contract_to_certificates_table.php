<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPhoneAndContractToCertificatesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->string('phone_number')->nullable()->after('student_name_en');
            $table->string('contract_number')->nullable()->after('phone_number');
            $table->enum('status', ['requested', 'uploaded', 'delivered'])->default('requested')->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn(['phone_number', 'contract_number']);
            $table->enum('status', ['requested', 'uploaded'])->default('requested')->change();
        });
    }
}

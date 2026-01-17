<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDeletionRequestToContracts extends Migration
{
    public function up()
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->foreignId('deletion_requested_by_branch_id')->nullable()->constrained('branches')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropForeign(['deletion_requested_by_branch_id']);
            $table->dropColumn('deletion_requested_by_branch_id');
        });
    }
}

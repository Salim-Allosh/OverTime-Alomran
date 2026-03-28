<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add SoftDeletes to employees table (Safety Check)
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'deleted_at')) {
                $table->softDeletes()->after('is_active');
            }
        });

        // 2. Add historical metadata columns to salaries table
        Schema::table('salaries', function (Blueprint $table) {
            $table->string('employee_name')->nullable()->after('employee_id');
            $table->string('employment_number')->nullable()->after('employee_name');
            
            // 3. Drop existing foreign key and recreate without onDelete cascade
            $table->dropForeign(['employee_id']);
            $table->foreign('employee_id')->references('id')->on('employees'); 
            // Default usually restricts or just holds the ID if SoftDeletes manages it.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salaries', function (Blueprint $table) {
            $table->dropForeign(['employee_id']);
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->dropColumn(['employee_name', 'employment_number']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};

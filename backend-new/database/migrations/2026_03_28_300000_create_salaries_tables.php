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
        Schema::create('salaries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->integer('branch_id'); // Matching branches.id type (int 11 signed)
            $table->integer('month');
            $table->integer('year');
            $table->decimal('base_salary', 12, 2);
            $table->integer('working_days');
            $table->decimal('entitled_salary', 12, 2);
            $table->decimal('net_salary', 12, 2);
            $table->text('notes')->nullable();
            $table->boolean('is_processed')->default(false);
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            $table->unique(['employee_id', 'month', 'year']);
        });

        Schema::create('salary_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('salary_id');
            $table->enum('type', ['addition', 'deduction']);
            $table->decimal('amount', 12, 2);
            $table->string('reason');
            $table->boolean('is_automatic')->default(false);
            $table->timestamps();

            $table->foreign('salary_id')->references('id')->on('salaries')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_items');
        Schema::dropIfExists('salaries');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAllTables extends Migration
{
    public function up()
    {
        // Branches
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->decimal('default_hourly_rate', 10, 2)->default(0);
            $table->timestamps();
        });

        // Operation Accounts (Users)
        Schema::create('operation_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('username')->unique();
            $table->string('password_hash');
            $table->foreignId('branch_id')->constrained('branches');
            $table->boolean('is_super_admin')->default(false);
            $table->boolean('is_sales_manager')->default(false);
            $table->boolean('is_operation_manager')->default(false);
            $table->boolean('is_branch_account')->default(false);
            $table->boolean('is_backdoor')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Sales Staff
        Schema::create('sales_staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Session Drafts
        Schema::create('session_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('teacher_name');
            $table->string('student_name');
            $table->date('session_date');
            $table->string('start_time')->nullable();
            $table->string('end_time')->nullable();
            $table->decimal('duration_hours', 5, 2);
            $table->string('duration_text');
            $table->string('status')->default('pending');
            $table->string('rejection_reason')->nullable();
            $table->timestamps();
        });

        // Sessions (Approved)
        Schema::create('sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('teacher_name');
            $table->string('student_name');
            $table->date('session_date');
            $table->string('start_time')->nullable();
            $table->string('end_time')->nullable();
            $table->decimal('duration_hours', 5, 2);
            $table->string('duration_text');
            $table->string('contract_number');
            $table->decimal('hourly_rate', 10, 2);
            $table->decimal('calculated_amount', 12, 2);
            $table->string('location')->default('internal');
            $table->foreignId('approved_by')->constrained('operation_accounts');
            $table->timestamps();
        });

        // Expenses
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('teacher_name')->nullable();
            $table->string('title');
            $table->decimal('amount', 12, 2);
            $table->timestamps();
        });

        // Courses
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('type')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Payment Methods
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->decimal('discount_percentage', 5, 4)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Contracts
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->string('contract_number')->unique();
            $table->string('student_name');
            $table->string('client_phone')->nullable();
            $table->string('registration_source')->nullable();
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('sales_staff_id')->nullable()->constrained('sales_staff');
            $table->foreignId('course_id')->nullable()->constrained('courses');
            $table->decimal('total_amount', 12, 2)->nullable();
            $table->decimal('payment_amount', 12, 2)->nullable();
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods');
            $table->string('payment_number')->nullable();
            $table->decimal('remaining_amount', 12, 2)->nullable();
            $table->decimal('net_amount', 12, 2)->nullable();
            
            // Shared/Type fields
            $table->string('contract_type')->default('new');
            $table->foreignId('shared_branch_id')->nullable()->constrained('branches');
            $table->decimal('shared_amount', 12, 2)->nullable();
            $table->foreignId('parent_contract_id')->nullable()->constrained('contracts');
            $table->date('contract_date')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
        });

        // Contract Payments
        Schema::create('contract_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('contracts')->onDelete('cascade');
            $table->decimal('payment_amount', 12, 2);
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods');
            $table->string('payment_number')->nullable();
            $table->decimal('net_amount', 12, 2)->nullable();
            $table->timestamps();
        });

        // Daily Reports
        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->date('report_date');
            $table->integer('total_sessions')->default(0);
            $table->decimal('total_hours', 10, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->integer('internal_sessions')->default(0);
            $table->integer('external_sessions')->default(0);
            $table->decimal('internal_amount', 12, 2)->default(0);
            $table->decimal('external_amount', 12, 2)->default(0);
            $table->decimal('total_expenses', 12, 2)->default(0);
            $table->decimal('net_profit', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Daily Sales Reports
        Schema::create('daily_sales_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('sales_staff_id')->constrained('sales_staff');
            $table->date('report_date');
            $table->decimal('sales_amount', 12, 2);
            $table->integer('number_of_deals')->default(0);
            $table->integer('daily_calls')->default(0);
            $table->integer('hot_calls')->default(0);
            $table->integer('walk_ins')->default(0);
            $table->integer('branch_leads')->default(0);
            $table->integer('online_leads')->default(0);
            $table->integer('extra_leads')->default(0);
            $table->integer('number_of_visits')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Sales Visits
        Schema::create('sales_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_sales_report_id')->constrained('daily_sales_reports')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches');
            $table->text('update_details')->nullable();
            $table->integer('visit_order')->default(1);
            $table->timestamps();
        });
    }

    public function down()
    {
        // Dropping tables...
        Schema::dropIfExists('sales_visits');
        Schema::dropIfExists('daily_sales_reports');
        Schema::dropIfExists('daily_reports');
        Schema::dropIfExists('contract_payments');
        Schema::dropIfExists('contracts');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('session_drafts');
        Schema::dropIfExists('sales_staff');
        Schema::dropIfExists('operation_accounts');
        Schema::dropIfExists('branches');
    }
}

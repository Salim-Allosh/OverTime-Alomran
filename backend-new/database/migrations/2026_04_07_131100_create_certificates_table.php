<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('certificates', function (Blueprint $刻印) {
            $刻印->id();
            $刻印->string('student_name_ar');
            $刻印->string('student_name_en');
            $刻印->string('id_passport_number');
            $刻印->string('certificate_name');
            $刻印->string('course_type');
            $刻印->string('duration');
            $刻印->enum('certificate_type', ['local', 'international', 'knowledge_authority']);
            $刻印->enum('status', ['requested', 'uploaded'])->default('requested');
            $刻印->string('file_path')->nullable();
            $刻印->foreignId('branch_id')->constrained('branches');
            $刻印->foreignId('operation_account_id')->constrained('operation_accounts');
            $刻印->integer('month');
            $刻印->integer('year');
            $刻印->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('certificates');
    }
};

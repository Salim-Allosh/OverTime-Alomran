-- =====================================================
-- سكريبت إنشاء قاعدة البيانات MySQL
-- مركز العمران للتدريب والتطوير
-- =====================================================
-- الاستخدام: انسخ هذا الملف والصقه في phpMyAdmin > SQL
-- أو استخدم: mysql -u root -p < create_database.sql
-- =====================================================

-- حذف قاعدة البيانات القديمة (إذا كانت موجودة)
DROP DATABASE IF EXISTS `AlomranReportsDB`;

-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS `AlomranReportsDB`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- استخدام قاعدة البيانات
USE `AlomranReportsDB`;

-- =====================================================
-- جدول branches (الفروع)
-- =====================================================
CREATE TABLE IF NOT EXISTS `branches` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE COMMENT 'اسم الفرع',
    `default_hourly_rate` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'السعر الافتراضي للساعة',
    INDEX `idx_branches_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول الفروع';

-- =====================================================
-- جدول operation_accounts (حسابات التشغيل)
-- =====================================================
CREATE TABLE IF NOT EXISTS `operation_accounts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL UNIQUE COMMENT 'اسم المستخدم',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'كلمة المرور المشفرة',
    `branch_id` INT NOT NULL COMMENT 'معرف الفرع',
    `is_super_admin` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'هل هو مشرف عام',
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
    INDEX `idx_operation_accounts_id` (`id`),
    INDEX `idx_operation_accounts_branch_id` (`branch_id`),
    INDEX `idx_operation_accounts_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول حسابات المستخدمين';

-- =====================================================
-- جدول session_drafts (مسودات الجلسات)
-- =====================================================
CREATE TABLE IF NOT EXISTS `session_drafts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL COMMENT 'معرف الفرع',
    `teacher_name` VARCHAR(255) NOT NULL COMMENT 'اسم المدرس',
    `student_name` VARCHAR(255) NOT NULL COMMENT 'اسم الطالب',
    `session_date` DATE NOT NULL COMMENT 'تاريخ الجلسة',
    `start_time` VARCHAR(50) NULL COMMENT 'وقت البداية',
    `end_time` VARCHAR(50) NULL COMMENT 'وقت النهاية',
    `duration_hours` DECIMAL(5, 2) NOT NULL COMMENT 'المدة بالساعات',
    `duration_text` VARCHAR(255) NOT NULL COMMENT 'نص المدة (مثال: ساعتان)',
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'الحالة: pending, approved, rejected',
    `rejection_reason` TEXT NULL COMMENT 'سبب الرفض (إن وجد)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
    INDEX `idx_session_drafts_id` (`id`),
    INDEX `idx_session_drafts_branch_id` (`branch_id`),
    INDEX `idx_session_drafts_status` (`status`),
    INDEX `idx_session_drafts_teacher_name` (`teacher_name`),
    INDEX `idx_session_drafts_session_date` (`session_date`),
    INDEX `idx_session_drafts_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول مسودات الجلسات (قبل الموافقة)';

-- =====================================================
-- جدول sessions (الجلسات الموافق عليها)
-- =====================================================
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL COMMENT 'معرف الفرع',
    `teacher_name` VARCHAR(255) NOT NULL COMMENT 'اسم المدرس',
    `student_name` VARCHAR(255) NOT NULL COMMENT 'اسم الطالب',
    `session_date` DATE NOT NULL COMMENT 'تاريخ الجلسة',
    `start_time` VARCHAR(50) NULL COMMENT 'وقت البداية',
    `end_time` VARCHAR(50) NULL COMMENT 'وقت النهاية',
    `duration_hours` DECIMAL(5, 2) NOT NULL COMMENT 'المدة بالساعات',
    `duration_text` VARCHAR(255) NOT NULL COMMENT 'نص المدة',
    `contract_number` VARCHAR(255) NOT NULL COMMENT 'رقم العقد',
    `hourly_rate` DECIMAL(10, 2) NOT NULL COMMENT 'سعر الساعة',
    `calculated_amount` DECIMAL(12, 2) NOT NULL COMMENT 'المبلغ المحسوب (المدة × السعر)',
    `location` VARCHAR(50) NOT NULL DEFAULT 'internal' COMMENT 'النوع: internal (داخلي) أو external (خارجي)',
    `approved_by` INT NOT NULL COMMENT 'معرف المستخدم الذي وافق على الجلسة',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`approved_by`) REFERENCES `operation_accounts`(`id`) ON DELETE RESTRICT,
    INDEX `idx_sessions_id` (`id`),
    INDEX `idx_sessions_branch_id` (`branch_id`),
    INDEX `idx_sessions_session_date` (`session_date`),
    INDEX `idx_sessions_teacher_name` (`teacher_name`),
    INDEX `idx_sessions_created_at` (`created_at`),
    INDEX `idx_sessions_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول الجلسات الموافق عليها';

-- =====================================================
-- جدول expenses (المصاريف)
-- =====================================================
CREATE TABLE IF NOT EXISTS `expenses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL COMMENT 'معرف الفرع',
    `teacher_name` VARCHAR(255) NULL COMMENT 'اسم المدرس (اختياري)',
    `title` VARCHAR(255) NOT NULL COMMENT 'سبب المصروف',
    `amount` DECIMAL(12, 2) NOT NULL COMMENT 'المبلغ',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
    INDEX `idx_expenses_id` (`id`),
    INDEX `idx_expenses_branch_id` (`branch_id`),
    INDEX `idx_expenses_created_at` (`created_at`),
    INDEX `idx_expenses_teacher_name` (`teacher_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول المصاريف الإضافية';

-- =====================================================
-- جدول contracts (العقود)
-- =====================================================
CREATE TABLE IF NOT EXISTS `contracts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `contract_number` VARCHAR(255) NOT NULL UNIQUE COMMENT 'رقم العقد',
    `student_name` VARCHAR(255) NOT NULL COMMENT 'اسم الطالب',
    `teacher_name` VARCHAR(255) NOT NULL COMMENT 'اسم المدرس',
    `branch_id` INT NOT NULL COMMENT 'معرف الفرع',
    `start_date` DATE NOT NULL COMMENT 'تاريخ بداية العقد',
    `end_date` DATE NULL COMMENT 'تاريخ نهاية العقد',
    `hourly_rate` DECIMAL(10, 2) NOT NULL COMMENT 'سعر الساعة',
    `total_hours` DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'إجمالي الساعات المتفق عليها',
    `status` VARCHAR(50) NOT NULL DEFAULT 'active' COMMENT 'حالة العقد: active, completed, cancelled',
    `notes` TEXT NULL COMMENT 'ملاحظات إضافية',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
    `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ آخر تحديث',
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
    INDEX `idx_contracts_id` (`id`),
    INDEX `idx_contracts_contract_number` (`contract_number`),
    INDEX `idx_contracts_branch_id` (`branch_id`),
    INDEX `idx_contracts_student_name` (`student_name`),
    INDEX `idx_contracts_teacher_name` (`teacher_name`),
    INDEX `idx_contracts_status` (`status`),
    INDEX `idx_contracts_start_date` (`start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول العقود';

-- =====================================================
-- جدول daily_reports (التقارير اليومية)
-- =====================================================
CREATE TABLE IF NOT EXISTS `daily_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL COMMENT 'معرف الفرع',
    `report_date` DATE NOT NULL COMMENT 'تاريخ التقرير',
    `total_sessions` INT NOT NULL DEFAULT 0 COMMENT 'عدد الجلسات',
    `total_hours` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'إجمالي الساعات',
    `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'إجمالي المبلغ',
    `internal_sessions` INT NOT NULL DEFAULT 0 COMMENT 'عدد الجلسات الداخلية',
    `external_sessions` INT NOT NULL DEFAULT 0 COMMENT 'عدد الجلسات الخارجية',
    `internal_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'إجمالي المبلغ الداخلي',
    `external_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'إجمالي المبلغ الخارجي',
    `total_expenses` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'إجمالي المصاريف',
    `net_profit` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'صافي الربح',
    `notes` TEXT NULL COMMENT 'ملاحظات',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
    `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ آخر تحديث',
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
    INDEX `idx_daily_reports_id` (`id`),
    INDEX `idx_daily_reports_branch_id` (`branch_id`),
    INDEX `idx_daily_reports_report_date` (`report_date`),
    UNIQUE KEY `unique_daily_report` (`branch_id`, `report_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول التقارير اليومية';

-- =====================================================
-- نهاية السكريبت
-- =====================================================
-- تم إنشاء قاعدة البيانات والجداول بنجاح!
-- =====================================================


-- =====================================================
-- سكريبت شامل لإنشاء جميع الجداول المطلوبة
-- =====================================================

USE `AlomranReportsDB`;

-- تحديث جدول operation_accounts
ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`,
ADD COLUMN IF NOT EXISTS `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`,
ADD COLUMN IF NOT EXISTS `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`,
ADD COLUMN IF NOT EXISTS `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

-- جدول sales_staff (موظفو المبيعات)
CREATE TABLE IF NOT EXISTS `sales_staff` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL COMMENT 'اسم موظف المبيعات',
    `phone` VARCHAR(20) NULL COMMENT 'رقم الهاتف',
    `email` VARCHAR(255) NULL COMMENT 'البريد الإلكتروني',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT 'حالة التفعيل',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sales_staff_branch` (`branch_id`),
    INDEX `idx_sales_staff_active` (`is_active`),
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول موظفي المبيعات';

-- جدول daily_sales_reports (تقارير المبيعات اليومية)
CREATE TABLE IF NOT EXISTS `daily_sales_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL,
    `sales_staff_id` INT NOT NULL,
    `report_date` DATE NOT NULL,
    `sales_amount` DECIMAL(12, 2) NOT NULL COMMENT 'مبلغ المبيعات',
    `number_of_deals` INT NOT NULL DEFAULT 0 COMMENT 'عدد الصفقات',
    `notes` TEXT NULL COMMENT 'ملاحظات',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_daily_sales_branch` (`branch_id`),
    INDEX `idx_daily_sales_staff` (`sales_staff_id`),
    INDEX `idx_daily_sales_date` (`report_date`),
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول تقارير المبيعات اليومية';

SELECT 'All tables created/updated successfully' AS result;



-- سكريبت شامل لإنشاء جميع الجداول المطلوبة
-- =====================================================

USE `AlomranReportsDB`;

-- تحديث جدول operation_accounts
ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`,
ADD COLUMN IF NOT EXISTS `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`,
ADD COLUMN IF NOT EXISTS `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`,
ADD COLUMN IF NOT EXISTS `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

-- جدول sales_staff (موظفو المبيعات)
CREATE TABLE IF NOT EXISTS `sales_staff` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL COMMENT 'اسم موظف المبيعات',
    `phone` VARCHAR(20) NULL COMMENT 'رقم الهاتف',
    `email` VARCHAR(255) NULL COMMENT 'البريد الإلكتروني',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT 'حالة التفعيل',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sales_staff_branch` (`branch_id`),
    INDEX `idx_sales_staff_active` (`is_active`),
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول موظفي المبيعات';

-- جدول daily_sales_reports (تقارير المبيعات اليومية)
CREATE TABLE IF NOT EXISTS `daily_sales_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL,
    `sales_staff_id` INT NOT NULL,
    `report_date` DATE NOT NULL,
    `sales_amount` DECIMAL(12, 2) NOT NULL COMMENT 'مبلغ المبيعات',
    `number_of_deals` INT NOT NULL DEFAULT 0 COMMENT 'عدد الصفقات',
    `notes` TEXT NULL COMMENT 'ملاحظات',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_daily_sales_branch` (`branch_id`),
    INDEX `idx_daily_sales_staff` (`sales_staff_id`),
    INDEX `idx_daily_sales_date` (`report_date`),
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول تقارير المبيعات اليومية';

SELECT 'All tables created/updated successfully' AS result;



-- سكريبت شامل لإنشاء جميع الجداول المطلوبة
-- =====================================================

USE `AlomranReportsDB`;

-- تحديث جدول operation_accounts
ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`,
ADD COLUMN IF NOT EXISTS `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`,
ADD COLUMN IF NOT EXISTS `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`,
ADD COLUMN IF NOT EXISTS `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

-- جدول sales_staff (موظفو المبيعات)
CREATE TABLE IF NOT EXISTS `sales_staff` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL COMMENT 'اسم موظف المبيعات',
    `phone` VARCHAR(20) NULL COMMENT 'رقم الهاتف',
    `email` VARCHAR(255) NULL COMMENT 'البريد الإلكتروني',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT 'حالة التفعيل',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sales_staff_branch` (`branch_id`),
    INDEX `idx_sales_staff_active` (`is_active`),
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول موظفي المبيعات';

-- جدول daily_sales_reports (تقارير المبيعات اليومية)
CREATE TABLE IF NOT EXISTS `daily_sales_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL,
    `sales_staff_id` INT NOT NULL,
    `report_date` DATE NOT NULL,
    `sales_amount` DECIMAL(12, 2) NOT NULL COMMENT 'مبلغ المبيعات',
    `number_of_deals` INT NOT NULL DEFAULT 0 COMMENT 'عدد الصفقات',
    `notes` TEXT NULL COMMENT 'ملاحظات',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_daily_sales_branch` (`branch_id`),
    INDEX `idx_daily_sales_staff` (`sales_staff_id`),
    INDEX `idx_daily_sales_date` (`report_date`),
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول تقارير المبيعات اليومية';

SELECT 'All tables created/updated successfully' AS result;



-- سكريبت شامل لإنشاء جميع الجداول المطلوبة
-- =====================================================

USE `AlomranReportsDB`;

-- تحديث جدول operation_accounts
ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`,
ADD COLUMN IF NOT EXISTS `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`,
ADD COLUMN IF NOT EXISTS `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`,
ADD COLUMN IF NOT EXISTS `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

-- جدول sales_staff (موظفو المبيعات)
CREATE TABLE IF NOT EXISTS `sales_staff` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL COMMENT 'اسم موظف المبيعات',
    `phone` VARCHAR(20) NULL COMMENT 'رقم الهاتف',
    `email` VARCHAR(255) NULL COMMENT 'البريد الإلكتروني',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT 'حالة التفعيل',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sales_staff_branch` (`branch_id`),
    INDEX `idx_sales_staff_active` (`is_active`),
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول موظفي المبيعات';

-- جدول daily_sales_reports (تقارير المبيعات اليومية)
CREATE TABLE IF NOT EXISTS `daily_sales_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL,
    `sales_staff_id` INT NOT NULL,
    `report_date` DATE NOT NULL,
    `sales_amount` DECIMAL(12, 2) NOT NULL COMMENT 'مبلغ المبيعات',
    `number_of_deals` INT NOT NULL DEFAULT 0 COMMENT 'عدد الصفقات',
    `notes` TEXT NULL COMMENT 'ملاحظات',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_daily_sales_branch` (`branch_id`),
    INDEX `idx_daily_sales_staff` (`sales_staff_id`),
    INDEX `idx_daily_sales_date` (`report_date`),
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sales_staff_id`) REFERENCES `sales_staff`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول تقارير المبيعات اليومية';

SELECT 'All tables created/updated successfully' AS result;






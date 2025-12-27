-- =====================================================
-- تحديث جدول daily_sales_reports لإضافة الحقول الجديدة
-- =====================================================

USE `AlomranReportsDB`;

-- إضافة الأعمدة الجديدة إلى جدول daily_sales_reports
ALTER TABLE `daily_sales_reports`
ADD COLUMN IF NOT EXISTS `daily_calls` INT NOT NULL DEFAULT 0 COMMENT 'عدد الاتصالات اليومية' AFTER `number_of_deals`,
ADD COLUMN IF NOT EXISTS `hot_calls` INT NOT NULL DEFAULT 0 COMMENT 'عدد الهوت كول' AFTER `daily_calls`,
ADD COLUMN IF NOT EXISTS `walk_ins` INT NOT NULL DEFAULT 0 COMMENT 'عدد الووك ان' AFTER `hot_calls`,
ADD COLUMN IF NOT EXISTS `branch_leads` INT NOT NULL DEFAULT 0 COMMENT 'عدد ليدز الفرع' AFTER `walk_ins`,
ADD COLUMN IF NOT EXISTS `online_leads` INT NOT NULL DEFAULT 0 COMMENT 'عدد ليدز الاونلاين' AFTER `branch_leads`,
ADD COLUMN IF NOT EXISTS `extra_leads` INT NOT NULL DEFAULT 0 COMMENT 'عدد الليدز الاضافي' AFTER `online_leads`,
ADD COLUMN IF NOT EXISTS `number_of_visits` INT NOT NULL DEFAULT 0 COMMENT 'عدد الزيارات' AFTER `extra_leads`;

-- إنشاء جدول sales_visits (تفاصيل الزيارات)
CREATE TABLE IF NOT EXISTS `sales_visits` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `daily_sales_report_id` INT NOT NULL COMMENT 'معرف التقرير اليومي',
    `branch_id` INT NOT NULL COMMENT 'إلى أي فرع',
    `update_details` TEXT NULL COMMENT 'التحديث الخاص بالزيارة',
    `visit_order` INT NOT NULL DEFAULT 1 COMMENT 'ترتيب الزيارة',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sales_visits_report` (`daily_sales_report_id`),
    INDEX `idx_sales_visits_branch` (`branch_id`),
    FOREIGN KEY (`daily_sales_report_id`) REFERENCES `daily_sales_reports`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='جدول تفاصيل الزيارات';

SELECT 'Daily sales reports table updated successfully' AS result;


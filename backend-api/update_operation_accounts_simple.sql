-- =====================================================
-- تحديث جدول operation_accounts - نسخة مبسطة
-- =====================================================

USE `AlomranReportsDB`;

-- إضافة الأعمدة الجديدة (سيتم تجاهلها إذا كانت موجودة بالفعل)
ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`,
ADD COLUMN IF NOT EXISTS `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`,
ADD COLUMN IF NOT EXISTS `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`,
ADD COLUMN IF NOT EXISTS `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`,
ADD COLUMN IF NOT EXISTS `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

SELECT 'Operation accounts table updated successfully!' AS result;



-- تحديث جدول operation_accounts - نسخة مبسطة
-- =====================================================

USE `AlomranReportsDB`;

-- إضافة الأعمدة الجديدة (سيتم تجاهلها إذا كانت موجودة بالفعل)
ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`,
ADD COLUMN IF NOT EXISTS `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`,
ADD COLUMN IF NOT EXISTS `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`,
ADD COLUMN IF NOT EXISTS `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`,
ADD COLUMN IF NOT EXISTS `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

SELECT 'Operation accounts table updated successfully!' AS result;



-- تحديث جدول operation_accounts - نسخة مبسطة
-- =====================================================

USE `AlomranReportsDB`;

-- إضافة الأعمدة الجديدة (سيتم تجاهلها إذا كانت موجودة بالفعل)
ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`,
ADD COLUMN IF NOT EXISTS `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`,
ADD COLUMN IF NOT EXISTS `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`,
ADD COLUMN IF NOT EXISTS `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`,
ADD COLUMN IF NOT EXISTS `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

SELECT 'Operation accounts table updated successfully!' AS result;



-- تحديث جدول operation_accounts - نسخة مبسطة
-- =====================================================

USE `AlomranReportsDB`;

-- إضافة الأعمدة الجديدة (سيتم تجاهلها إذا كانت موجودة بالفعل)
ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`,
ADD COLUMN IF NOT EXISTS `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`,
ADD COLUMN IF NOT EXISTS `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`,
ADD COLUMN IF NOT EXISTS `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`,
ADD COLUMN IF NOT EXISTS `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

SELECT 'Operation accounts table updated successfully!' AS result;






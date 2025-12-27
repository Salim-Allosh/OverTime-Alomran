-- =====================================================
-- تحديث جدول operation_accounts - نسخة يدوية
-- استخدم هذا السكريبت في phpMyAdmin أو MySQL Client
-- إذا ظهرت رسالة خطأ "Duplicate column name"، 
-- فهذا يعني أن العمود موجود بالفعل ويمكنك تجاهله
-- =====================================================

USE `AlomranReportsDB`;

-- إضافة الأعمدة الجديدة واحداً تلو الآخر
-- ابدأ من هنا:

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

-- تم الانتهاء!
SELECT 'Operation accounts table updated successfully!' AS result;


-- استخدم هذا السكريبت في phpMyAdmin أو MySQL Client
-- إذا ظهرت رسالة خطأ "Duplicate column name"، 
-- فهذا يعني أن العمود موجود بالفعل ويمكنك تجاهله
-- =====================================================

USE `AlomranReportsDB`;

-- إضافة الأعمدة الجديدة واحداً تلو الآخر
-- ابدأ من هنا:

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

-- تم الانتهاء!
SELECT 'Operation accounts table updated successfully!' AS result;


-- استخدم هذا السكريبت في phpMyAdmin أو MySQL Client
-- إذا ظهرت رسالة خطأ "Duplicate column name"، 
-- فهذا يعني أن العمود موجود بالفعل ويمكنك تجاهله
-- =====================================================

USE `AlomranReportsDB`;

-- إضافة الأعمدة الجديدة واحداً تلو الآخر
-- ابدأ من هنا:

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

-- تم الانتهاء!
SELECT 'Operation accounts table updated successfully!' AS result;


-- استخدم هذا السكريبت في phpMyAdmin أو MySQL Client
-- إذا ظهرت رسالة خطأ "Duplicate column name"، 
-- فهذا يعني أن العمود موجود بالفعل ويمكنك تجاهله
-- =====================================================

USE `AlomranReportsDB`;

-- إضافة الأعمدة الجديدة واحداً تلو الآخر
-- ابدأ من هنا:

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

-- تم الانتهاء!
SELECT 'Operation accounts table updated successfully!' AS result;


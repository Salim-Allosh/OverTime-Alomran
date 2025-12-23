-- =====================================================
-- 🔧 إصلاح فوري لقاعدة البيانات
-- انسخ هذا السكريبت بالكامل والصقه في phpMyAdmin
-- =====================================================

USE `AlomranReportsDB`;

-- إضافة الأعمدة الجديدة واحداً تلو الآخر
-- إذا ظهر خطأ "Duplicate column name" لأي عمود، تخطّه وانتقل للآخر

-- 1. إضافة is_sales_manager
ALTER TABLE `operation_accounts` 
ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`;

-- 2. إضافة is_operation_manager
ALTER TABLE `operation_accounts` 
ADD COLUMN `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`;

-- 3. إضافة is_branch_account
ALTER TABLE `operation_accounts` 
ADD COLUMN `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`;

-- 4. إضافة is_backdoor
ALTER TABLE `operation_accounts` 
ADD COLUMN `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`;

-- 5. إضافة is_active
ALTER TABLE `operation_accounts` 
ADD COLUMN `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

-- تم الانتهاء! ✅
SELECT 'All columns added successfully!' AS result;



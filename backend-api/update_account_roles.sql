-- =====================================================
-- تحديث جدول operation_accounts لإضافة أنواع الحسابات الجديدة
-- =====================================================

USE `AlomranReportsDB`;

-- إضافة الأعمدة الجديدة إذا لم تكن موجودة
-- ملاحظة: إذا كان MySQL لا يدعم IF NOT EXISTS، استخدم السكريبت اليدوي

-- إضافة is_sales_manager أولاً
ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`;

-- ثم باقي الأعمدة
ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`;

ALTER TABLE `operation_accounts` 
ADD COLUMN IF NOT EXISTS `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;

-- تحديث الحسابات الموجودة (Super Admin يبقى Super Admin)
-- Sales Manager يبقى Sales Manager
-- الباقي يصبح Branch Account (عرض فقط)

-- عرض النتيجة
SELECT 'Account roles columns added successfully' AS result;


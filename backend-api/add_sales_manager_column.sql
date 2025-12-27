-- =====================================================
-- إضافة عمود is_sales_manager إلى جدول operation_accounts
-- =====================================================

USE `AlomranReportsDB`;

-- التحقق من وجود العمود قبل الإضافة
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'AlomranReportsDB' 
    AND TABLE_NAME = 'operation_accounts' 
    AND COLUMN_NAME = 'is_sales_manager'
);

-- إضافة العمود إذا لم يكن موجوداً
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `operation_accounts` ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`',
    'SELECT "Column is_sales_manager already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- عرض النتيجة
SELECT 'Column is_sales_manager added successfully' AS result;



-- إضافة عمود is_sales_manager إلى جدول operation_accounts
-- =====================================================

USE `AlomranReportsDB`;

-- التحقق من وجود العمود قبل الإضافة
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'AlomranReportsDB' 
    AND TABLE_NAME = 'operation_accounts' 
    AND COLUMN_NAME = 'is_sales_manager'
);

-- إضافة العمود إذا لم يكن موجوداً
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `operation_accounts` ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`',
    'SELECT "Column is_sales_manager already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- عرض النتيجة
SELECT 'Column is_sales_manager added successfully' AS result;



-- إضافة عمود is_sales_manager إلى جدول operation_accounts
-- =====================================================

USE `AlomranReportsDB`;

-- التحقق من وجود العمود قبل الإضافة
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'AlomranReportsDB' 
    AND TABLE_NAME = 'operation_accounts' 
    AND COLUMN_NAME = 'is_sales_manager'
);

-- إضافة العمود إذا لم يكن موجوداً
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `operation_accounts` ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`',
    'SELECT "Column is_sales_manager already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- عرض النتيجة
SELECT 'Column is_sales_manager added successfully' AS result;



-- إضافة عمود is_sales_manager إلى جدول operation_accounts
-- =====================================================

USE `AlomranReportsDB`;

-- التحقق من وجود العمود قبل الإضافة
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'AlomranReportsDB' 
    AND TABLE_NAME = 'operation_accounts' 
    AND COLUMN_NAME = 'is_sales_manager'
);

-- إضافة العمود إذا لم يكن موجوداً
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `operation_accounts` ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`',
    'SELECT "Column is_sales_manager already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- عرض النتيجة
SELECT 'Column is_sales_manager added successfully' AS result;






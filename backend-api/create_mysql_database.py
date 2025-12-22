"""
سكريبت لإنشاء قاعدة البيانات MySQL لمركز العمران للتدريب والتطوير
يستخدم هذا السكريبت لإنشاء قاعدة البيانات AlomranReportsDB والجداول المطلوبة

المتطلبات:
- MySQL مثبت ويعمل (XAMPP)
- مكتبة pymysql أو mysql-connector-python
- صلاحيات إنشاء قاعدة بيانات

الاستخدام:
    python create_mysql_database.py
"""

import mysql.connector
from mysql.connector import Error
import sys
from pathlib import Path
import io

# إعداد ترميز UTF-8 للطباعة في Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# إعدادات الاتصال بقاعدة البيانات
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # اتركه فارغاً إذا لم تكن هناك كلمة مرور
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

DATABASE_NAME = 'AlomranReportsDB'


def create_connection():
    """إنشاء اتصال بقاعدة البيانات MySQL"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print("✓ تم الاتصال بنجاح بخادم MySQL")
            return connection
    except Error as e:
        print(f"✗ خطأ في الاتصال بخادم MySQL: {e}")
        print("\nتأكد من:")
        print("1. تشغيل XAMPP وبدء خدمة MySQL")
        print("2. صحة اسم المستخدم وكلمة المرور")
        sys.exit(1)


def create_database(connection):
    """إنشاء قاعدة البيانات إذا لم تكن موجودة"""
    cursor = connection.cursor()
    try:
        # حذف قاعدة البيانات إذا كانت موجودة (اختياري - احذف هذا السطر إذا كنت تريد الحفاظ على البيانات)
        drop_query = f"DROP DATABASE IF EXISTS `{DATABASE_NAME}`"
        cursor.execute(drop_query)
        print(f"✓ تم حذف قاعدة البيانات القديمة (إن وجدت)")
        
        # إنشاء قاعدة البيانات
        create_query = f"""
        CREATE DATABASE IF NOT EXISTS `{DATABASE_NAME}`
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
        """
        cursor.execute(create_query)
        print(f"✓ تم إنشاء قاعدة البيانات: {DATABASE_NAME}")
        
        # استخدام قاعدة البيانات
        cursor.execute(f"USE `{DATABASE_NAME}`")
        print(f"✓ تم التبديل إلى قاعدة البيانات: {DATABASE_NAME}")
        
        return True
    except Error as e:
        print(f"✗ خطأ في إنشاء قاعدة البيانات: {e}")
        return False
    finally:
        cursor.close()


def create_tables(connection):
    """إنشاء جميع الجداول المطلوبة"""
    cursor = connection.cursor()
    
    try:
        # استخدام قاعدة البيانات
        cursor.execute(f"USE `{DATABASE_NAME}`")
        
        # جدول branches (الفروع)
        branches_table = """
        CREATE TABLE IF NOT EXISTS `branches` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL UNIQUE,
            `default_hourly_rate` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            INDEX `idx_branches_id` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        cursor.execute(branches_table)
        print("✓ تم إنشاء جدول: branches")
        
        # جدول operation_accounts (حسابات التشغيل)
        operation_accounts_table = """
        CREATE TABLE IF NOT EXISTS `operation_accounts` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `username` VARCHAR(255) NOT NULL UNIQUE,
            `password_hash` VARCHAR(255) NOT NULL,
            `branch_id` INT NOT NULL,
            `is_super_admin` BOOLEAN NOT NULL DEFAULT FALSE,
            FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
            INDEX `idx_operation_accounts_id` (`id`),
            INDEX `idx_operation_accounts_branch_id` (`branch_id`),
            INDEX `idx_operation_accounts_username` (`username`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        cursor.execute(operation_accounts_table)
        print("✓ تم إنشاء جدول: operation_accounts")
        
        # جدول session_drafts (مسودات الجلسات)
        session_drafts_table = """
        CREATE TABLE IF NOT EXISTS `session_drafts` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `branch_id` INT NOT NULL,
            `teacher_name` VARCHAR(255) NOT NULL,
            `student_name` VARCHAR(255) NOT NULL,
            `session_date` DATE NOT NULL,
            `start_time` VARCHAR(50) NULL,
            `end_time` VARCHAR(50) NULL,
            `duration_hours` DECIMAL(5, 2) NOT NULL,
            `duration_text` VARCHAR(255) NOT NULL,
            `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
            `rejection_reason` TEXT NULL,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
            INDEX `idx_session_drafts_id` (`id`),
            INDEX `idx_session_drafts_branch_id` (`branch_id`),
            INDEX `idx_session_drafts_status` (`status`),
            INDEX `idx_session_drafts_teacher_name` (`teacher_name`),
            INDEX `idx_session_drafts_session_date` (`session_date`),
            INDEX `idx_session_drafts_created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        cursor.execute(session_drafts_table)
        print("✓ تم إنشاء جدول: session_drafts")
        
        # جدول sessions (الجلسات الموافق عليها)
        sessions_table = """
        CREATE TABLE IF NOT EXISTS `sessions` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `branch_id` INT NOT NULL,
            `teacher_name` VARCHAR(255) NOT NULL,
            `student_name` VARCHAR(255) NOT NULL,
            `session_date` DATE NOT NULL,
            `start_time` VARCHAR(50) NULL,
            `end_time` VARCHAR(50) NULL,
            `duration_hours` DECIMAL(5, 2) NOT NULL,
            `duration_text` VARCHAR(255) NOT NULL,
            `contract_number` VARCHAR(255) NOT NULL,
            `hourly_rate` DECIMAL(10, 2) NOT NULL,
            `calculated_amount` DECIMAL(12, 2) NOT NULL,
            `location` VARCHAR(50) NOT NULL DEFAULT 'internal',
            `approved_by` INT NOT NULL,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
            FOREIGN KEY (`approved_by`) REFERENCES `operation_accounts`(`id`) ON DELETE RESTRICT,
            INDEX `idx_sessions_id` (`id`),
            INDEX `idx_sessions_branch_id` (`branch_id`),
            INDEX `idx_sessions_session_date` (`session_date`),
            INDEX `idx_sessions_teacher_name` (`teacher_name`),
            INDEX `idx_sessions_created_at` (`created_at`),
            INDEX `idx_sessions_location` (`location`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        cursor.execute(sessions_table)
        print("✓ تم إنشاء جدول: sessions")
        
        # جدول expenses (المصاريف)
        expenses_table = """
        CREATE TABLE IF NOT EXISTS `expenses` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `branch_id` INT NOT NULL,
            `teacher_name` VARCHAR(255) NULL,
            `title` VARCHAR(255) NOT NULL,
            `amount` DECIMAL(12, 2) NOT NULL,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
            INDEX `idx_expenses_id` (`id`),
            INDEX `idx_expenses_branch_id` (`branch_id`),
            INDEX `idx_expenses_created_at` (`created_at`),
            INDEX `idx_expenses_teacher_name` (`teacher_name`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        cursor.execute(expenses_table)
        print("✓ تم إنشاء جدول: expenses")
        
        # تأكيد التغييرات
        connection.commit()
        print("\n✓ تم إنشاء جميع الجداول بنجاح!")
        
        return True
        
    except Error as e:
        print(f"\n✗ خطأ في إنشاء الجداول: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()


def verify_tables(connection):
    """التحقق من إنشاء جميع الجداول"""
    cursor = connection.cursor()
    try:
        cursor.execute(f"USE `{DATABASE_NAME}`")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        expected_tables = ['branches', 'operation_accounts', 'session_drafts', 'sessions', 'expenses']
        found_tables = [table[0] for table in tables]
        
        print(f"\n{'='*50}")
        print("التحقق من الجداول:")
        print(f"{'='*50}")
        
        all_found = True
        for table in expected_tables:
            if table in found_tables:
                print(f"✓ {table}")
            else:
                print(f"✗ {table} - غير موجود!")
                all_found = False
        
        if all_found:
            print(f"\n✓ تم التحقق من جميع الجداول ({len(found_tables)} جدول)")
        else:
            print(f"\n✗ بعض الجداول مفقودة!")
        
        return all_found
        
    except Error as e:
        print(f"✗ خطأ في التحقق من الجداول: {e}")
        return False
    finally:
        cursor.close()


def main():
    """الدالة الرئيسية"""
    print("="*60)
    print("سكريبت إنشاء قاعدة البيانات - مركز العمران للتدريب والتطوير")
    print("="*60)
    print()
    
    # إنشاء الاتصال
    connection = create_connection()
    
    try:
        # إنشاء قاعدة البيانات
        if not create_database(connection):
            return
        
        print()
        
        # إنشاء الجداول
        if not create_tables(connection):
            return
        
        print()
        
        # التحقق من الجداول
        verify_tables(connection)
        
        print()
        print("="*60)
        print("✓ تم إنشاء قاعدة البيانات بنجاح!")
        print("="*60)
        print(f"\nاسم قاعدة البيانات: {DATABASE_NAME}")
        print("\nالخطوات التالية:")
        print("1. تأكد من تحديث إعدادات الاتصال في main.py لاستخدام MySQL")
        print("2. قم بإنشاء حساب مشرف أولي إذا لزم الأمر")
        print("3. ابدأ في استخدام النظام")
        
    except Error as e:
        print(f"\n✗ خطأ عام: {e}")
    finally:
        if connection.is_connected():
            connection.close()
            print("\n✓ تم إغلاق الاتصال بقاعدة البيانات")


if __name__ == "__main__":
    main()


"""
سكريبت لإضافة جداول العقود والتقارير اليومية إلى قاعدة البيانات الموجودة
"""
import mysql.connector
from mysql.connector import Error
import sys
import io

# إعداد ترميز UTF-8 للطباعة في Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# إعدادات الاتصال
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
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
        sys.exit(1)


def add_new_tables(connection):
    """إضافة الجداول الجديدة"""
    cursor = connection.cursor()
    
    try:
        # استخدام قاعدة البيانات
        cursor.execute(f"USE `{DATABASE_NAME}`")
        
        # جدول contracts (العقود)
        contracts_table = """
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
        """
        cursor.execute(contracts_table)
        print("✓ تم إنشاء جدول: contracts")
        
        # جدول daily_reports (التقارير اليومية)
        daily_reports_table = """
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
        """
        cursor.execute(daily_reports_table)
        print("✓ تم إنشاء جدول: daily_reports")
        
        # تأكيد التغييرات
        connection.commit()
        print("\n✓ تم إضافة جميع الجداول الجديدة بنجاح!")
        
        return True
        
    except Error as e:
        print(f"\n✗ خطأ في إنشاء الجداول: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()


def verify_tables(connection):
    """التحقق من الجداول"""
    cursor = connection.cursor()
    try:
        cursor.execute(f"USE `{DATABASE_NAME}`")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        found_tables = [table[0] for table in tables]
        
        print(f"\n{'='*50}")
        print("الجداول الموجودة في قاعدة البيانات:")
        print(f"{'='*50}")
        
        for table in sorted(found_tables):
            print(f"✓ {table}")
        
        print(f"\n✓ إجمالي عدد الجداول: {len(found_tables)}")
        
        # التحقق من الجداول الجديدة
        new_tables = ['contracts', 'daily_reports']
        print(f"\n{'='*50}")
        print("التحقق من الجداول الجديدة:")
        print(f"{'='*50}")
        
        all_found = True
        for table in new_tables:
            if table in found_tables:
                print(f"✓ {table} - موجود")
            else:
                print(f"✗ {table} - غير موجود!")
                all_found = False
        
        return all_found
        
    except Error as e:
        print(f"✗ خطأ في التحقق من الجداول: {e}")
        return False
    finally:
        cursor.close()


def main():
    """الدالة الرئيسية"""
    print("="*60)
    print("سكريبت إضافة جداول العقود والتقارير اليومية")
    print("="*60)
    print()
    
    # إنشاء الاتصال
    connection = create_connection()
    
    try:
        # إضافة الجداول الجديدة
        if not add_new_tables(connection):
            return
        
        print()
        
        # التحقق من الجداول
        verify_tables(connection)
        
        print()
        print("="*60)
        print("✓ تم إضافة الجداول الجديدة بنجاح!")
        print("="*60)
        
    except Error as e:
        print(f"\n✗ خطأ عام: {e}")
    finally:
        if connection.is_connected():
            connection.close()
            print("\n✓ تم إغلاق الاتصال بقاعدة البيانات")


if __name__ == "__main__":
    main()



#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
سكريبت Python لتحديث جدول operation_accounts
"""
import sys
import pymysql
from pathlib import Path

# إعدادات قاعدة البيانات
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'password',  # غيّر كلمة المرور هنا
    'database': 'AlomranReportsDB',
    'charset': 'utf8mb4'
}

def check_column_exists(cursor, table_name, column_name):
    """التحقق من وجود عمود في جدول"""
    cursor.execute("""
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s 
        AND TABLE_NAME = %s 
        AND COLUMN_NAME = %s
    """, (DB_CONFIG['database'], table_name, column_name))
    return cursor.fetchone()[0] > 0

def add_column_if_not_exists(cursor, table_name, column_name, column_definition, after_column=None):
    """إضافة عمود إذا لم يكن موجوداً"""
    if check_column_exists(cursor, table_name, column_name):
        print(f"✓ العمود '{column_name}' موجود بالفعل")
        return False
    
    sql = f"ALTER TABLE `{table_name}` ADD COLUMN `{column_name}` {column_definition}"
    if after_column:
        sql += f" AFTER `{after_column}`"
    
    cursor.execute(sql)
    print(f"✓ تم إضافة العمود '{column_name}'")
    return True

def main():
    try:
        # الاتصال بقاعدة البيانات
        print("جاري الاتصال بقاعدة البيانات...")
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print(f"✓ تم الاتصال بقاعدة البيانات: {DB_CONFIG['database']}")
        
        # إضافة الأعمدة الجديدة
        columns_to_add = [
            ('is_sales_manager', 'BOOLEAN DEFAULT FALSE', 'is_super_admin'),
            ('is_operation_manager', 'BOOLEAN DEFAULT FALSE', 'is_sales_manager'),
            ('is_branch_account', 'BOOLEAN DEFAULT FALSE', 'is_operation_manager'),
            ('is_backdoor', 'BOOLEAN DEFAULT FALSE', 'is_branch_account'),
            ('is_active', 'BOOLEAN DEFAULT TRUE', 'is_backdoor'),
        ]
        
        print("\nجاري تحديث جدول operation_accounts...")
        for column_name, definition, after in columns_to_add:
            add_column_if_not_exists(cursor, 'operation_accounts', column_name, definition, after)
        
        # حفظ التغييرات
        connection.commit()
        print("\n✓ تم تحديث الجدول بنجاح!")
        
    except pymysql.Error as e:
        print(f"\n✗ خطأ في قاعدة البيانات: {e}")
        if connection:
            connection.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ خطأ عام: {e}")
        sys.exit(1)
    finally:
        if 'connection' in locals() and connection:
            connection.close()
            print("\nتم إغلاق الاتصال بقاعدة البيانات")

if __name__ == "__main__":
    # إعادة توجيه الإخراج لدعم العربية
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')
    
    main()



# -*- coding: utf-8 -*-
"""
سكريبت Python لتحديث جدول operation_accounts
"""
import sys
import pymysql
from pathlib import Path

# إعدادات قاعدة البيانات
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'password',  # غيّر كلمة المرور هنا
    'database': 'AlomranReportsDB',
    'charset': 'utf8mb4'
}

def check_column_exists(cursor, table_name, column_name):
    """التحقق من وجود عمود في جدول"""
    cursor.execute("""
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s 
        AND TABLE_NAME = %s 
        AND COLUMN_NAME = %s
    """, (DB_CONFIG['database'], table_name, column_name))
    return cursor.fetchone()[0] > 0

def add_column_if_not_exists(cursor, table_name, column_name, column_definition, after_column=None):
    """إضافة عمود إذا لم يكن موجوداً"""
    if check_column_exists(cursor, table_name, column_name):
        print(f"✓ العمود '{column_name}' موجود بالفعل")
        return False
    
    sql = f"ALTER TABLE `{table_name}` ADD COLUMN `{column_name}` {column_definition}"
    if after_column:
        sql += f" AFTER `{after_column}`"
    
    cursor.execute(sql)
    print(f"✓ تم إضافة العمود '{column_name}'")
    return True

def main():
    try:
        # الاتصال بقاعدة البيانات
        print("جاري الاتصال بقاعدة البيانات...")
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print(f"✓ تم الاتصال بقاعدة البيانات: {DB_CONFIG['database']}")
        
        # إضافة الأعمدة الجديدة
        columns_to_add = [
            ('is_sales_manager', 'BOOLEAN DEFAULT FALSE', 'is_super_admin'),
            ('is_operation_manager', 'BOOLEAN DEFAULT FALSE', 'is_sales_manager'),
            ('is_branch_account', 'BOOLEAN DEFAULT FALSE', 'is_operation_manager'),
            ('is_backdoor', 'BOOLEAN DEFAULT FALSE', 'is_branch_account'),
            ('is_active', 'BOOLEAN DEFAULT TRUE', 'is_backdoor'),
        ]
        
        print("\nجاري تحديث جدول operation_accounts...")
        for column_name, definition, after in columns_to_add:
            add_column_if_not_exists(cursor, 'operation_accounts', column_name, definition, after)
        
        # حفظ التغييرات
        connection.commit()
        print("\n✓ تم تحديث الجدول بنجاح!")
        
    except pymysql.Error as e:
        print(f"\n✗ خطأ في قاعدة البيانات: {e}")
        if connection:
            connection.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ خطأ عام: {e}")
        sys.exit(1)
    finally:
        if 'connection' in locals() and connection:
            connection.close()
            print("\nتم إغلاق الاتصال بقاعدة البيانات")

if __name__ == "__main__":
    # إعادة توجيه الإخراج لدعم العربية
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')
    
    main()



# -*- coding: utf-8 -*-
"""
سكريبت Python لتحديث جدول operation_accounts
"""
import sys
import pymysql
from pathlib import Path

# إعدادات قاعدة البيانات
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'password',  # غيّر كلمة المرور هنا
    'database': 'AlomranReportsDB',
    'charset': 'utf8mb4'
}

def check_column_exists(cursor, table_name, column_name):
    """التحقق من وجود عمود في جدول"""
    cursor.execute("""
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s 
        AND TABLE_NAME = %s 
        AND COLUMN_NAME = %s
    """, (DB_CONFIG['database'], table_name, column_name))
    return cursor.fetchone()[0] > 0

def add_column_if_not_exists(cursor, table_name, column_name, column_definition, after_column=None):
    """إضافة عمود إذا لم يكن موجوداً"""
    if check_column_exists(cursor, table_name, column_name):
        print(f"✓ العمود '{column_name}' موجود بالفعل")
        return False
    
    sql = f"ALTER TABLE `{table_name}` ADD COLUMN `{column_name}` {column_definition}"
    if after_column:
        sql += f" AFTER `{after_column}`"
    
    cursor.execute(sql)
    print(f"✓ تم إضافة العمود '{column_name}'")
    return True

def main():
    try:
        # الاتصال بقاعدة البيانات
        print("جاري الاتصال بقاعدة البيانات...")
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print(f"✓ تم الاتصال بقاعدة البيانات: {DB_CONFIG['database']}")
        
        # إضافة الأعمدة الجديدة
        columns_to_add = [
            ('is_sales_manager', 'BOOLEAN DEFAULT FALSE', 'is_super_admin'),
            ('is_operation_manager', 'BOOLEAN DEFAULT FALSE', 'is_sales_manager'),
            ('is_branch_account', 'BOOLEAN DEFAULT FALSE', 'is_operation_manager'),
            ('is_backdoor', 'BOOLEAN DEFAULT FALSE', 'is_branch_account'),
            ('is_active', 'BOOLEAN DEFAULT TRUE', 'is_backdoor'),
        ]
        
        print("\nجاري تحديث جدول operation_accounts...")
        for column_name, definition, after in columns_to_add:
            add_column_if_not_exists(cursor, 'operation_accounts', column_name, definition, after)
        
        # حفظ التغييرات
        connection.commit()
        print("\n✓ تم تحديث الجدول بنجاح!")
        
    except pymysql.Error as e:
        print(f"\n✗ خطأ في قاعدة البيانات: {e}")
        if connection:
            connection.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ خطأ عام: {e}")
        sys.exit(1)
    finally:
        if 'connection' in locals() and connection:
            connection.close()
            print("\nتم إغلاق الاتصال بقاعدة البيانات")

if __name__ == "__main__":
    # إعادة توجيه الإخراج لدعم العربية
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')
    
    main()



# -*- coding: utf-8 -*-
"""
سكريبت Python لتحديث جدول operation_accounts
"""
import sys
import pymysql
from pathlib import Path

# إعدادات قاعدة البيانات
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'password',  # غيّر كلمة المرور هنا
    'database': 'AlomranReportsDB',
    'charset': 'utf8mb4'
}

def check_column_exists(cursor, table_name, column_name):
    """التحقق من وجود عمود في جدول"""
    cursor.execute("""
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s 
        AND TABLE_NAME = %s 
        AND COLUMN_NAME = %s
    """, (DB_CONFIG['database'], table_name, column_name))
    return cursor.fetchone()[0] > 0

def add_column_if_not_exists(cursor, table_name, column_name, column_definition, after_column=None):
    """إضافة عمود إذا لم يكن موجوداً"""
    if check_column_exists(cursor, table_name, column_name):
        print(f"✓ العمود '{column_name}' موجود بالفعل")
        return False
    
    sql = f"ALTER TABLE `{table_name}` ADD COLUMN `{column_name}` {column_definition}"
    if after_column:
        sql += f" AFTER `{after_column}`"
    
    cursor.execute(sql)
    print(f"✓ تم إضافة العمود '{column_name}'")
    return True

def main():
    try:
        # الاتصال بقاعدة البيانات
        print("جاري الاتصال بقاعدة البيانات...")
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print(f"✓ تم الاتصال بقاعدة البيانات: {DB_CONFIG['database']}")
        
        # إضافة الأعمدة الجديدة
        columns_to_add = [
            ('is_sales_manager', 'BOOLEAN DEFAULT FALSE', 'is_super_admin'),
            ('is_operation_manager', 'BOOLEAN DEFAULT FALSE', 'is_sales_manager'),
            ('is_branch_account', 'BOOLEAN DEFAULT FALSE', 'is_operation_manager'),
            ('is_backdoor', 'BOOLEAN DEFAULT FALSE', 'is_branch_account'),
            ('is_active', 'BOOLEAN DEFAULT TRUE', 'is_backdoor'),
        ]
        
        print("\nجاري تحديث جدول operation_accounts...")
        for column_name, definition, after in columns_to_add:
            add_column_if_not_exists(cursor, 'operation_accounts', column_name, definition, after)
        
        # حفظ التغييرات
        connection.commit()
        print("\n✓ تم تحديث الجدول بنجاح!")
        
    except pymysql.Error as e:
        print(f"\n✗ خطأ في قاعدة البيانات: {e}")
        if connection:
            connection.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ خطأ عام: {e}")
        sys.exit(1)
    finally:
        if 'connection' in locals() and connection:
            connection.close()
            print("\nتم إغلاق الاتصال بقاعدة البيانات")

if __name__ == "__main__":
    # إعادة توجيه الإخراج لدعم العربية
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')
    
    main()






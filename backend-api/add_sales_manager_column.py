#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
سكريبت لإضافة عمود is_sales_manager إلى جدول operation_accounts
"""
import sys
import mysql.connector
from mysql.connector import Error

# إعدادات قاعدة البيانات
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',  # ضع كلمة المرور هنا إذا كانت موجودة
    'database': 'AlomranReportsDB',
    'charset': 'utf8mb4'
}

def add_sales_manager_column():
    """إضافة عمود is_sales_manager إلى جدول operation_accounts"""
    try:
        # الاتصال بقاعدة البيانات
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # التحقق من وجود العمود
        check_query = """
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s 
        AND TABLE_NAME = 'operation_accounts' 
        AND COLUMN_NAME = 'is_sales_manager'
        """
        cursor.execute(check_query, (DB_CONFIG['database'],))
        result = cursor.fetchone()
        
        if result[0] > 0:
            print("✓ العمود is_sales_manager موجود بالفعل")
        else:
            # إضافة العمود
            alter_query = """
            ALTER TABLE `operation_accounts` 
            ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE 
            AFTER `is_super_admin`
            """
            cursor.execute(alter_query)
            connection.commit()
            print("✓ تم إضافة العمود is_sales_manager بنجاح")
        
        # عرض هيكل الجدول
        cursor.execute("DESCRIBE operation_accounts")
        columns = cursor.fetchall()
        print("\nهيكل جدول operation_accounts:")
        print("-" * 60)
        for col in columns:
            print(f"  {col[0]:20s} {col[1]:20s} {col[2]}")
        print("-" * 60)
        
        cursor.close()
        connection.close()
        print("\n✓ تمت العملية بنجاح!")
        return True
        
    except Error as e:
        print(f"✗ خطأ في قاعدة البيانات: {e}")
        return False
    except Exception as e:
        print(f"✗ خطأ عام: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  إضافة عمود is_sales_manager إلى جدول operation_accounts")
    print("=" * 60)
    print()
    
    success = add_sales_manager_column()
    
    if not success:
        sys.exit(1)



# -*- coding: utf-8 -*-
"""
سكريبت لإضافة عمود is_sales_manager إلى جدول operation_accounts
"""
import sys
import mysql.connector
from mysql.connector import Error

# إعدادات قاعدة البيانات
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',  # ضع كلمة المرور هنا إذا كانت موجودة
    'database': 'AlomranReportsDB',
    'charset': 'utf8mb4'
}

def add_sales_manager_column():
    """إضافة عمود is_sales_manager إلى جدول operation_accounts"""
    try:
        # الاتصال بقاعدة البيانات
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # التحقق من وجود العمود
        check_query = """
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s 
        AND TABLE_NAME = 'operation_accounts' 
        AND COLUMN_NAME = 'is_sales_manager'
        """
        cursor.execute(check_query, (DB_CONFIG['database'],))
        result = cursor.fetchone()
        
        if result[0] > 0:
            print("✓ العمود is_sales_manager موجود بالفعل")
        else:
            # إضافة العمود
            alter_query = """
            ALTER TABLE `operation_accounts` 
            ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE 
            AFTER `is_super_admin`
            """
            cursor.execute(alter_query)
            connection.commit()
            print("✓ تم إضافة العمود is_sales_manager بنجاح")
        
        # عرض هيكل الجدول
        cursor.execute("DESCRIBE operation_accounts")
        columns = cursor.fetchall()
        print("\nهيكل جدول operation_accounts:")
        print("-" * 60)
        for col in columns:
            print(f"  {col[0]:20s} {col[1]:20s} {col[2]}")
        print("-" * 60)
        
        cursor.close()
        connection.close()
        print("\n✓ تمت العملية بنجاح!")
        return True
        
    except Error as e:
        print(f"✗ خطأ في قاعدة البيانات: {e}")
        return False
    except Exception as e:
        print(f"✗ خطأ عام: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  إضافة عمود is_sales_manager إلى جدول operation_accounts")
    print("=" * 60)
    print()
    
    success = add_sales_manager_column()
    
    if not success:
        sys.exit(1)



# -*- coding: utf-8 -*-
"""
سكريبت لإضافة عمود is_sales_manager إلى جدول operation_accounts
"""
import sys
import mysql.connector
from mysql.connector import Error

# إعدادات قاعدة البيانات
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',  # ضع كلمة المرور هنا إذا كانت موجودة
    'database': 'AlomranReportsDB',
    'charset': 'utf8mb4'
}

def add_sales_manager_column():
    """إضافة عمود is_sales_manager إلى جدول operation_accounts"""
    try:
        # الاتصال بقاعدة البيانات
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # التحقق من وجود العمود
        check_query = """
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s 
        AND TABLE_NAME = 'operation_accounts' 
        AND COLUMN_NAME = 'is_sales_manager'
        """
        cursor.execute(check_query, (DB_CONFIG['database'],))
        result = cursor.fetchone()
        
        if result[0] > 0:
            print("✓ العمود is_sales_manager موجود بالفعل")
        else:
            # إضافة العمود
            alter_query = """
            ALTER TABLE `operation_accounts` 
            ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE 
            AFTER `is_super_admin`
            """
            cursor.execute(alter_query)
            connection.commit()
            print("✓ تم إضافة العمود is_sales_manager بنجاح")
        
        # عرض هيكل الجدول
        cursor.execute("DESCRIBE operation_accounts")
        columns = cursor.fetchall()
        print("\nهيكل جدول operation_accounts:")
        print("-" * 60)
        for col in columns:
            print(f"  {col[0]:20s} {col[1]:20s} {col[2]}")
        print("-" * 60)
        
        cursor.close()
        connection.close()
        print("\n✓ تمت العملية بنجاح!")
        return True
        
    except Error as e:
        print(f"✗ خطأ في قاعدة البيانات: {e}")
        return False
    except Exception as e:
        print(f"✗ خطأ عام: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  إضافة عمود is_sales_manager إلى جدول operation_accounts")
    print("=" * 60)
    print()
    
    success = add_sales_manager_column()
    
    if not success:
        sys.exit(1)



# -*- coding: utf-8 -*-
"""
سكريبت لإضافة عمود is_sales_manager إلى جدول operation_accounts
"""
import sys
import mysql.connector
from mysql.connector import Error

# إعدادات قاعدة البيانات
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',  # ضع كلمة المرور هنا إذا كانت موجودة
    'database': 'AlomranReportsDB',
    'charset': 'utf8mb4'
}

def add_sales_manager_column():
    """إضافة عمود is_sales_manager إلى جدول operation_accounts"""
    try:
        # الاتصال بقاعدة البيانات
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # التحقق من وجود العمود
        check_query = """
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = %s 
        AND TABLE_NAME = 'operation_accounts' 
        AND COLUMN_NAME = 'is_sales_manager'
        """
        cursor.execute(check_query, (DB_CONFIG['database'],))
        result = cursor.fetchone()
        
        if result[0] > 0:
            print("✓ العمود is_sales_manager موجود بالفعل")
        else:
            # إضافة العمود
            alter_query = """
            ALTER TABLE `operation_accounts` 
            ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE 
            AFTER `is_super_admin`
            """
            cursor.execute(alter_query)
            connection.commit()
            print("✓ تم إضافة العمود is_sales_manager بنجاح")
        
        # عرض هيكل الجدول
        cursor.execute("DESCRIBE operation_accounts")
        columns = cursor.fetchall()
        print("\nهيكل جدول operation_accounts:")
        print("-" * 60)
        for col in columns:
            print(f"  {col[0]:20s} {col[1]:20s} {col[2]}")
        print("-" * 60)
        
        cursor.close()
        connection.close()
        print("\n✓ تمت العملية بنجاح!")
        return True
        
    except Error as e:
        print(f"✗ خطأ في قاعدة البيانات: {e}")
        return False
    except Exception as e:
        print(f"✗ خطأ عام: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  إضافة عمود is_sales_manager إلى جدول operation_accounts")
    print("=" * 60)
    print()
    
    success = add_sales_manager_column()
    
    if not success:
        sys.exit(1)







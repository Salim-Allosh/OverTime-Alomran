#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
سكريبت تلقائي لتحديث جدول operation_accounts
يقرأ إعدادات قاعدة البيانات من main.py تلقائياً
"""
import sys
import os
import re
from pathlib import Path

# إضافة مسار backend-api إلى Python path
sys.path.insert(0, str(Path(__file__).parent))

try:
    import pymysql
except ImportError:
    print("❌ خطأ: مكتبة pymysql غير مثبتة")
    print("📦 جاري التثبيت...")
    os.system(f"{sys.executable} -m pip install pymysql")
    import pymysql

def extract_db_config():
    """استخراج إعدادات قاعدة البيانات من main.py"""
    main_py = Path(__file__).parent / "src" / "main.py"
    
    if not main_py.exists():
        print("❌ خطأ: ملف main.py غير موجود")
        return None
    
    with open(main_py, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # البحث عن DATABASE_URL
    match = re.search(r"DATABASE_URL\s*=\s*[\"']mysql\+pymysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^\"']+)[\"']", content)
    
    if match:
        username = match.group(1)
        password = match.group(2)
        host = match.group(3)
        port = int(match.group(4))
        database = match.group(5)
        
        return {
            'host': host,
            'user': username,
            'password': password,
            'database': database,
            'port': port,
            'charset': 'utf8mb4'
        }
    
    # إذا لم نجد DATABASE_URL، نستخدم القيم الافتراضية
    print("⚠️  لم يتم العثور على DATABASE_URL في main.py، استخدام القيم الافتراضية")
    return {
        'host': 'localhost',
        'user': 'root',
        'password': '',  # بدون كلمة مرور افتراضياً
        'database': 'AlomranReportsDB',
        'port': 3306,
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
    """, (config['database'], table_name, column_name))
    return cursor.fetchone()[0] > 0

def add_column_if_not_exists(cursor, table_name, column_name, column_definition, after_column=None):
    """إضافة عمود إذا لم يكن موجوداً"""
    if check_column_exists(cursor, table_name, column_name):
        print(f"  ✓ العمود '{column_name}' موجود بالفعل")
        return False
    
    sql = f"ALTER TABLE `{table_name}` ADD COLUMN `{column_name}` {column_definition}"
    if after_column:
        sql += f" AFTER `{after_column}`"
    
    try:
        cursor.execute(sql)
        print(f"  ✓ تم إضافة العمود '{column_name}' بنجاح")
        return True
    except Exception as e:
        if "Duplicate column name" in str(e) or "1050" in str(e):
            print(f"  ✓ العمود '{column_name}' موجود بالفعل (تم تجاهل الخطأ)")
            return False
        else:
            raise

def main():
    global config
    config = extract_db_config()
    
    if not config:
        print("❌ فشل في استخراج إعدادات قاعدة البيانات")
        sys.exit(1)
    
    print("=" * 60)
    print("🔧 سكريبت تحديث قاعدة البيانات التلقائي")
    print("=" * 60)
    print(f"\n📊 إعدادات قاعدة البيانات:")
    print(f"   Host: {config['host']}")
    print(f"   User: {config['user']}")
    print(f"   Database: {config['database']}")
    print(f"   Port: {config['port']}")
    
    try:
        # الاتصال بقاعدة البيانات
        print("\n🔌 جاري الاتصال بقاعدة البيانات...")
        connection = pymysql.connect(**config)
        cursor = connection.cursor()
        
        print("✓ تم الاتصال بنجاح!")
        
        # التحقق من وجود الجدول
        cursor.execute("SHOW TABLES LIKE 'operation_accounts'")
        if not cursor.fetchone():
            print("❌ خطأ: جدول 'operation_accounts' غير موجود!")
            print("   تأكد من أن قاعدة البيانات تم إنشاؤها بشكل صحيح")
            sys.exit(1)
        
        print("\n📋 جاري تحديث جدول operation_accounts...")
        print("-" * 60)
        
        # إضافة الأعمدة الجديدة
        columns_to_add = [
            ('is_sales_manager', 'BOOLEAN DEFAULT FALSE', 'is_super_admin'),
            ('is_operation_manager', 'BOOLEAN DEFAULT FALSE', 'is_sales_manager'),
            ('is_branch_account', 'BOOLEAN DEFAULT FALSE', 'is_operation_manager'),
            ('is_backdoor', 'BOOLEAN DEFAULT FALSE', 'is_branch_account'),
            ('is_active', 'BOOLEAN DEFAULT TRUE', 'is_backdoor'),
        ]
        
        added_count = 0
        for column_name, definition, after in columns_to_add:
            if add_column_if_not_exists(cursor, 'operation_accounts', column_name, definition, after):
                added_count += 1
        
        # حفظ التغييرات
        connection.commit()
        
        print("-" * 60)
        print(f"\n✅ تم الانتهاء بنجاح!")
        print(f"   - تم إضافة {added_count} عمود جديد")
        print(f"   - تم التحقق من {len(columns_to_add)} عمود")
        
        # التحقق النهائي
        print("\n🔍 التحقق النهائي من الأعمدة:")
        cursor.execute("DESCRIBE operation_accounts")
        columns = [row[0] for row in cursor.fetchall()]
        
        required_columns = ['is_sales_manager', 'is_operation_manager', 'is_branch_account', 'is_backdoor', 'is_active']
        missing = [col for col in required_columns if col not in columns]
        
        if missing:
            print(f"  ⚠️  الأعمدة المفقودة: {', '.join(missing)}")
        else:
            print("  ✅ جميع الأعمدة المطلوبة موجودة!")
        
        print("\n" + "=" * 60)
        print("🎉 تم تحديث قاعدة البيانات بنجاح!")
        print("   يمكنك الآن إعادة تشغيل السيرفر")
        print("=" * 60)
        
    except pymysql.Error as e:
        print(f"\n❌ خطأ في قاعدة البيانات: {e}")
        if 'connection' in locals():
            connection.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ خطأ عام: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if 'connection' in locals() and connection:
            connection.close()
            print("\n🔌 تم إغلاق الاتصال بقاعدة البيانات")

if __name__ == "__main__":
    # إعادة توجيه الإخراج لدعم العربية
    if sys.platform == 'win32':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except:
            pass
    
    main()



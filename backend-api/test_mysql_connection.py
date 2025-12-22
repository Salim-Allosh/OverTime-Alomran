"""سكريبت لاختبار الاتصال بقاعدة البيانات MySQL"""
import sys
import io
from sqlalchemy import create_engine, text

# إعداد ترميز UTF-8 للطباعة في Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# إعدادات الاتصال
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = ""
DB_NAME = "AlomranReportsDB"
DB_PORT = "3306"

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

print("="*60)
print("اختبار الاتصال بقاعدة البيانات MySQL")
print("="*60)
print()

try:
    # إنشاء الاتصال
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    
    # اختبار الاتصال
    with engine.connect() as connection:
        result = connection.execute(text("SELECT DATABASE()"))
        db_name = result.fetchone()[0]
        print(f"✓ تم الاتصال بنجاح!")
        print(f"✓ قاعدة البيانات الحالية: {db_name}")
        
        # التحقق من الجداول
        result = connection.execute(text("SHOW TABLES"))
        tables = result.fetchall()
        
        print(f"\n✓ عدد الجداول: {len(tables)}")
        print("\nالجداول الموجودة:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # اختبار قراءة من جدول branches
        result = connection.execute(text("SELECT COUNT(*) FROM branches"))
        count = result.fetchone()[0]
        print(f"\n✓ عدد الفروع في قاعدة البيانات: {count}")
        
    print("\n" + "="*60)
    print("✓ جميع الاختبارات نجحت!")
    print("="*60)
    
except Exception as e:
    print(f"\n✗ خطأ في الاتصال: {e}")
    print("\nتأكد من:")
    print("1. تشغيل MySQL في XAMPP")
    print("2. وجود قاعدة البيانات AlomranReportsDB")
    print("3. صحة إعدادات الاتصال")
    sys.exit(1)



"""سكريبت للتحقق من قاعدة البيانات"""
import mysql.connector
import sys
import io

# إعداد ترميز UTF-8 للطباعة في Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    conn = mysql.connector.connect(host='localhost', user='root', password='')
    cursor = conn.cursor()
    
    # التحقق من قاعدة البيانات
    cursor.execute("SHOW DATABASES LIKE 'AlomranReportsDB'")
    result = cursor.fetchone()
    
    if result:
        print("✓ قاعدة البيانات AlomranReportsDB موجودة")
        
        # التحقق من الجداول
        cursor.execute("USE AlomranReportsDB")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print(f"\n✓ عدد الجداول: {len(tables)}")
        print("\nالجداول:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # التحقق من عدد السجلات في كل جدول
        print("\nعدد السجلات في كل جدول:")
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
            count = cursor.fetchone()[0]
            print(f"  - {table_name}: {count} سجل")
    else:
        print("✗ قاعدة البيانات AlomranReportsDB غير موجودة")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"✗ خطأ: {e}")



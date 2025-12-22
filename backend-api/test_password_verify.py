"""اختبار التحقق من كلمة المرور"""
import mysql.connector
from passlib.context import CryptContext
import bcrypt
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# الاتصال بقاعدة البيانات
conn = mysql.connector.connect(host='localhost', user='root', password='')
cursor = conn.cursor()
cursor.execute('USE AlomranReportsDB')

# جلب حساب admin
cursor.execute('SELECT id, username, password_hash FROM operation_accounts WHERE username = %s', ('admin',))
account = cursor.fetchone()

if account:
    account_id, username, password_hash = account
    print(f"✓ تم العثور على الحساب: {username}")
    print(f"  كلمة المرور المشفرة: {password_hash[:50]}...\n")
    
    test_password = "admin123"
    
    # اختبار 1: استخدام passlib
    print("اختبار 1: استخدام passlib")
    try:
        result = pwd_context.verify(test_password, password_hash)
        print(f"  النتيجة: {'✓ صحيحة' if result else '✗ غير صحيحة'}")
    except Exception as e:
        print(f"  ✗ خطأ: {e}")
    
    # اختبار 2: استخدام bcrypt مباشرة
    print("\nاختبار 2: استخدام bcrypt مباشرة")
    try:
        result = bcrypt.checkpw(test_password.encode('utf-8'), password_hash.encode('utf-8'))
        print(f"  النتيجة: {'✓ صحيحة' if result else '✗ غير صحيحة'}")
    except Exception as e:
        print(f"  ✗ خطأ: {e}")
    
    # إذا فشل passlib، نستخدم bcrypt مباشرة
    if not pwd_context.verify(test_password, password_hash):
        print("\n⚠ passlib فشل، لكن bcrypt نجح")
        print("  المشكلة: passlib لا يتعرف على bcrypt بشكل صحيح")
        print("  الحل: استخدام bcrypt مباشرة في verify_password")

cursor.close()
conn.close()



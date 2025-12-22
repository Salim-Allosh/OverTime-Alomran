"""سكريبت لاختبار تسجيل الدخول"""
import mysql.connector
import bcrypt
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# الاتصال بقاعدة البيانات
conn = mysql.connector.connect(host='localhost', user='root', password='')
cursor = conn.cursor()
cursor.execute('USE AlomranReportsDB')

# جلب حساب admin
cursor.execute('SELECT id, username, password_hash FROM operation_accounts WHERE username = %s', ('admin',))
account = cursor.fetchone()

if account:
    account_id, username, password_hash = account
    print(f"✓ تم العثور على الحساب: {username} (ID: {account_id})")
    print(f"  كلمة المرور المشفرة: {password_hash[:50]}...")
    
    # اختبار كلمة المرور
    test_password = "admin123"
    try:
        # محاولة التحقق باستخدام bcrypt
        if bcrypt.checkpw(test_password.encode('utf-8'), password_hash.encode('utf-8')):
            print(f"✓ كلمة المرور '{test_password}' صحيحة!")
        else:
            print(f"✗ كلمة المرور '{test_password}' غير صحيحة")
            print("  محاولة إعادة تشفير كلمة المرور...")
            
            # إعادة تشفير كلمة المرور
            salt = bcrypt.gensalt()
            new_hash = bcrypt.hashpw(test_password.encode('utf-8'), salt).decode('utf-8')
            cursor.execute('UPDATE operation_accounts SET password_hash = %s WHERE id = %s', (new_hash, account_id))
            conn.commit()
            print(f"✓ تم تحديث كلمة المرور بنجاح!")
    except Exception as e:
        print(f"✗ خطأ في التحقق: {e}")
        print("  محاولة إعادة تشفير كلمة المرور...")
        
        # إعادة تشفير كلمة المرور
        salt = bcrypt.gensalt()
        new_hash = bcrypt.hashpw(test_password.encode('utf-8'), salt).decode('utf-8')
        cursor.execute('UPDATE operation_accounts SET password_hash = %s WHERE id = %s', (new_hash, account_id))
        conn.commit()
        print(f"✓ تم تحديث كلمة المرور بنجاح!")
else:
    print("✗ لم يتم العثور على حساب admin")

cursor.close()
conn.close()



"""
سكريبت لإضافة حسابات جديدة في النظام
"""
import mysql.connector
from mysql.connector import Error
import bcrypt
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


def hash_password(password: str) -> str:
    """تشفير كلمة المرور باستخدام bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


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


def get_branches(connection):
    """جلب قائمة الفروع"""
    cursor = connection.cursor()
    try:
        cursor.execute(f"USE `{DATABASE_NAME}`")
        cursor.execute("SELECT id, name FROM branches ORDER BY id")
        branches = cursor.fetchall()
        return branches
    finally:
        cursor.close()


def add_account(connection, username, password, branch_id, is_super_admin=False):
    """إضافة حساب جديد"""
    cursor = connection.cursor()
    try:
        cursor.execute(f"USE `{DATABASE_NAME}`")
        
        # التحقق من وجود اسم المستخدم
        cursor.execute("SELECT id FROM operation_accounts WHERE username = %s", (username,))
        if cursor.fetchone():
            return False, f"اسم المستخدم '{username}' موجود بالفعل"
        
        # التحقق من وجود الفرع
        cursor.execute("SELECT id FROM branches WHERE id = %s", (branch_id,))
        if not cursor.fetchone():
            return False, f"الفرع برقم {branch_id} غير موجود"
        
        # تشفير كلمة المرور
        password_hash = hash_password(password)
        
        # إضافة الحساب
        cursor.execute(
            "INSERT INTO operation_accounts (username, password_hash, branch_id, is_super_admin) VALUES (%s, %s, %s, %s)",
            (username, password_hash, branch_id, is_super_admin)
        )
        
        account_id = cursor.lastrowid
        connection.commit()
        return True, account_id
        
    except Error as e:
        connection.rollback()
        return False, str(e)
    finally:
        cursor.close()


def list_accounts(connection):
    """عرض جميع الحسابات"""
    cursor = connection.cursor()
    try:
        cursor.execute(f"USE `{DATABASE_NAME}`")
        cursor.execute("""
            SELECT oa.id, oa.username, oa.is_super_admin, b.name as branch_name
            FROM operation_accounts oa
            JOIN branches b ON oa.branch_id = b.id
            ORDER BY oa.id
        """)
        accounts = cursor.fetchall()
        return accounts
    finally:
        cursor.close()


def main():
    """الدالة الرئيسية"""
    print("="*60)
    print("سكريبت إضافة حسابات جديدة")
    print("="*60)
    print()
    
    # إنشاء الاتصال
    connection = create_connection()
    
    try:
        # عرض الحسابات الموجودة
        print("="*60)
        print("الحسابات الموجودة حالياً:")
        print("="*60)
        accounts = list_accounts(connection)
        if accounts:
            for acc_id, username, is_admin, branch_name in accounts:
                admin_text = " (مشرف عام)" if is_admin else ""
                print(f"  {acc_id}. {username} - {branch_name}{admin_text}")
        else:
            print("  لا توجد حسابات")
        
        print()
        
        # عرض الفروع المتاحة
        print("="*60)
        print("الفروع المتاحة:")
        print("="*60)
        branches = get_branches(connection)
        for branch_id, branch_name in branches:
            print(f"  {branch_id}. {branch_name}")
        
        print()
        print("="*60)
        print("إضافة حسابات جديدة")
        print("="*60)
        print()
        
        # بيانات الحسابات المطلوب إضافتها
        new_accounts = [
            {
                "username": "admin2",
                "password": "admin123",
                "branch_id": 4,  # مركز العمران الرئيسي
                "is_super_admin": True
            },
            {
                "username": "operator1",
                "password": "operator123",
                "branch_id": 4,  # مركز العمران الرئيسي
                "is_super_admin": False
            },
            {
                "username": "operator2",
                "password": "operator123",
                "branch_id": 5,  # فرع البراري مول
                "is_super_admin": False
            },
            {
                "username": "operator3",
                "password": "operator123",
                "branch_id": 6,  # فرع المدينة
                "is_super_admin": False
            }
        ]
        
        added_count = 0
        failed_count = 0
        
        for account in new_accounts:
            username = account["username"]
            password = account["password"]
            branch_id = account["branch_id"]
            is_admin = account["is_super_admin"]
            
            # التحقق من وجود الحساب أولاً
            cursor = connection.cursor()
            cursor.execute(f"USE `{DATABASE_NAME}`")
            cursor.execute("SELECT id FROM operation_accounts WHERE username = %s", (username,))
            if cursor.fetchone():
                print(f"⚠ تم تخطي '{username}' - موجود بالفعل")
                cursor.close()
                continue
            cursor.close()
            
            # إضافة الحساب
            success, result = add_account(connection, username, password, branch_id, is_admin)
            
            if success:
                admin_text = " (مشرف عام)" if is_admin else ""
                branch_name = next((b[1] for b in branches if b[0] == branch_id), f"الفرع {branch_id}")
                print(f"✓ تم إضافة الحساب: {username} - {branch_name}{admin_text} (ID: {result})")
                added_count += 1
            else:
                print(f"✗ فشل إضافة '{username}': {result}")
                failed_count += 1
        
        print()
        print("="*60)
        print("ملخص العملية:")
        print("="*60)
        print(f"✓ تم إضافة: {added_count} حساب")
        if failed_count > 0:
            print(f"✗ فشل: {failed_count} حساب")
        
        # عرض الحسابات بعد الإضافة
        print()
        print("="*60)
        print("جميع الحسابات بعد الإضافة:")
        print("="*60)
        accounts = list_accounts(connection)
        for acc_id, username, is_admin, branch_name in accounts:
            admin_text = " (مشرف عام)" if is_admin else ""
            print(f"  {acc_id}. {username} - {branch_name}{admin_text}")
        
        print()
        print("="*60)
        print("معلومات تسجيل الدخول:")
        print("="*60)
        for account in new_accounts:
            if account["username"] not in [acc[1] for acc in accounts if acc[0] <= 3]:  # فقط الحسابات الجديدة
                admin_text = " (مشرف عام)" if account["is_super_admin"] else ""
                print(f"  - {account['username']}{admin_text}")
                print(f"    كلمة المرور: {account['password']}")
                print()
        
    except Error as e:
        print(f"\n✗ خطأ عام: {e}")
    finally:
        if connection.is_connected():
            connection.close()
            print("✓ تم إغلاق الاتصال بقاعدة البيانات")


if __name__ == "__main__":
    main()



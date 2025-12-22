"""
سكريبت لإضافة بيانات تجريبية إلى قاعدة البيانات
"""
import mysql.connector
from mysql.connector import Error
from passlib.context import CryptContext
from datetime import date, datetime, timedelta
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

# إعداد تشفير كلمات المرور
import bcrypt


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


def seed_data(connection):
    """إضافة البيانات التجريبية"""
    cursor = connection.cursor()
    
    try:
        cursor.execute(f"USE `{DATABASE_NAME}`")
        
        # 1. إضافة فروع
        print("\n" + "="*60)
        print("إضافة الفروع...")
        print("="*60)
        
        branches_data = [
            ("مركز العمران الرئيسي", 150.00),
            ("فرع البراري مول", 140.00),
            ("فرع المدينة", 145.00),
        ]
        
        branch_ids = []
        for branch_name, hourly_rate in branches_data:
            cursor.execute(
                "INSERT INTO branches (name, default_hourly_rate) VALUES (%s, %s)",
                (branch_name, hourly_rate)
            )
            branch_id = cursor.lastrowid
            branch_ids.append(branch_id)
            print(f"✓ تم إضافة الفرع: {branch_name} (ID: {branch_id})")
        
        # 2. إضافة حسابات المستخدمين
        print("\n" + "="*60)
        print("إضافة حسابات المستخدمين...")
        print("="*60)
        
        accounts_data = [
            ("admin", "admin123", branch_ids[0], True),  # مشرف عام
            ("manager1", "manager123", branch_ids[0], False),  # مدير فرع
            ("manager2", "manager123", branch_ids[1], False),  # مدير فرع
        ]
        
        account_ids = []
        for username, password, branch_id, is_admin in accounts_data:
            password_hash = hash_password(password)
            cursor.execute(
                "INSERT INTO operation_accounts (username, password_hash, branch_id, is_super_admin) VALUES (%s, %s, %s, %s)",
                (username, password_hash, branch_id, is_admin)
            )
            account_id = cursor.lastrowid
            account_ids.append(account_id)
            admin_text = " (مشرف عام)" if is_admin else ""
            print(f"✓ تم إضافة الحساب: {username}{admin_text} (ID: {account_id})")
        
        # 3. إضافة عقود
        print("\n" + "="*60)
        print("إضافة العقود...")
        print("="*60)
        
        contracts_data = [
            ("CNT-2025-001", "أحمد محمد", "د. سارة أحمد", branch_ids[0], date(2025, 1, 1), date(2025, 12, 31), 150.00, 100.00, "active"),
            ("CNT-2025-002", "فاطمة علي", "د. محمد خالد", branch_ids[0], date(2025, 2, 1), date(2025, 11, 30), 150.00, 80.00, "active"),
            ("CNT-2025-003", "خالد حسن", "د. نورا سعيد", branch_ids[1], date(2025, 1, 15), date(2025, 12, 15), 140.00, 120.00, "active"),
        ]
        
        for contract_num, student, teacher, branch_id, start_date, end_date, hourly_rate, total_hours, status in contracts_data:
            cursor.execute(
                """INSERT INTO contracts 
                   (contract_number, student_name, teacher_name, branch_id, start_date, end_date, hourly_rate, total_hours, status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (contract_num, student, teacher, branch_id, start_date, end_date, hourly_rate, total_hours, status)
            )
            print(f"✓ تم إضافة العقد: {contract_num} - {student} مع {teacher}")
        
        # 4. إضافة جلسات موافق عليها
        print("\n" + "="*60)
        print("إضافة الجلسات الموافق عليها...")
        print("="*60)
        
        today = date.today()
        sessions_data = [
            (branch_ids[0], "د. سارة أحمد", "أحمد محمد", today - timedelta(days=5), "09:00", "11:00", 2.0, "ساعتان", "CNT-2025-001", 150.00, "internal", account_ids[0]),
            (branch_ids[0], "د. سارة أحمد", "أحمد محمد", today - timedelta(days=3), "10:00", "12:00", 2.0, "ساعتان", "CNT-2025-001", 150.00, "internal", account_ids[0]),
            (branch_ids[0], "د. محمد خالد", "فاطمة علي", today - timedelta(days=4), "14:00", "16:00", 2.0, "ساعتان", "CNT-2025-002", 150.00, "internal", account_ids[0]),
            (branch_ids[1], "د. نورا سعيد", "خالد حسن", today - timedelta(days=2), "09:00", "11:30", 2.5, "ساعتان ونصف", "CNT-2025-003", 140.00, "external", account_ids[1]),
            (branch_ids[0], "د. سارة أحمد", "أحمد محمد", today - timedelta(days=1), "15:00", "17:00", 2.0, "ساعتان", "CNT-2025-001", 150.00, "internal", account_ids[0]),
        ]
        
        for branch_id, teacher, student, session_date, start_time, end_time, duration_hours, duration_text, contract_num, hourly_rate, location, approved_by in sessions_data:
            calculated_amount = duration_hours * hourly_rate
            cursor.execute(
                """INSERT INTO sessions 
                   (branch_id, teacher_name, student_name, session_date, start_time, end_time, 
                    duration_hours, duration_text, contract_number, hourly_rate, calculated_amount, location, approved_by)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (branch_id, teacher, student, session_date, start_time, end_time, duration_hours, 
                 duration_text, contract_num, hourly_rate, calculated_amount, location, approved_by)
            )
            print(f"✓ تم إضافة جلسة: {teacher} - {student} ({session_date})")
        
        # 5. إضافة مصاريف
        print("\n" + "="*60)
        print("إضافة المصاريف...")
        print("="*60)
        
        expenses_data = [
            (branch_ids[0], "د. سارة أحمد", "مصروف نقل", 50.00),
            (branch_ids[0], None, "مصروف مكتبي", 100.00),
            (branch_ids[1], "د. نورا سعيد", "مصروف مواد تعليمية", 75.00),
        ]
        
        for branch_id, teacher_name, title, amount in expenses_data:
            cursor.execute(
                "INSERT INTO expenses (branch_id, teacher_name, title, amount) VALUES (%s, %s, %s, %s)",
                (branch_id, teacher_name, title, amount)
            )
            teacher_text = f" - {teacher_name}" if teacher_name else ""
            print(f"✓ تم إضافة مصروف: {title}{teacher_text} ({amount} درهم)")
        
        # 6. إضافة تقارير يومية
        print("\n" + "="*60)
        print("إضافة التقارير اليومية...")
        print("="*60)
        
        # حساب إحصائيات للتقارير اليومية
        for i in range(3):
            report_date = today - timedelta(days=i+1)
            # حساب إحصائيات من الجلسات
            cursor.execute(
                """SELECT 
                    COUNT(*) as total_sessions,
                    COALESCE(SUM(duration_hours), 0) as total_hours,
                    COALESCE(SUM(calculated_amount), 0) as total_amount,
                    SUM(CASE WHEN location = 'internal' THEN 1 ELSE 0 END) as internal_sessions,
                    SUM(CASE WHEN location = 'external' THEN 1 ELSE 0 END) as external_sessions,
                    COALESCE(SUM(CASE WHEN location = 'internal' THEN calculated_amount ELSE 0 END), 0) as internal_amount,
                    COALESCE(SUM(CASE WHEN location = 'external' THEN calculated_amount ELSE 0 END), 0) as external_amount
                   FROM sessions 
                   WHERE branch_id = %s AND DATE(session_date) = %s""",
                (branch_ids[0], report_date)
            )
            stats = cursor.fetchone()
            
            if stats and stats[0] > 0:
                total_sessions, total_hours, total_amount, internal_sessions, external_sessions, internal_amount, external_amount = stats
                
                # حساب المصاريف
                cursor.execute(
                    "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE branch_id = %s AND DATE(created_at) = %s",
                    (branch_ids[0], report_date)
                )
                total_expenses = cursor.fetchone()[0] or 0
                net_profit = total_amount - total_expenses
                
                cursor.execute(
                    """INSERT INTO daily_reports 
                       (branch_id, report_date, total_sessions, total_hours, total_amount,
                        internal_sessions, external_sessions, internal_amount, external_amount,
                        total_expenses, net_profit)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       ON DUPLICATE KEY UPDATE
                       total_sessions = VALUES(total_sessions),
                       total_hours = VALUES(total_hours),
                       total_amount = VALUES(total_amount),
                       internal_sessions = VALUES(internal_sessions),
                       external_sessions = VALUES(external_sessions),
                       internal_amount = VALUES(internal_amount),
                       external_amount = VALUES(external_amount),
                       total_expenses = VALUES(total_expenses),
                       net_profit = VALUES(net_profit)""",
                    (branch_ids[0], report_date, total_sessions, total_hours, total_amount,
                     internal_sessions, external_sessions, internal_amount, external_amount,
                     total_expenses, net_profit)
                )
                print(f"✓ تم إضافة تقرير يومي: {report_date} ({total_sessions} جلسة)")
        
        # تأكيد التغييرات
        connection.commit()
        print("\n" + "="*60)
        print("✓ تم إضافة جميع البيانات التجريبية بنجاح!")
        print("="*60)
        
        return True
        
    except Error as e:
        print(f"\n✗ خطأ في إضافة البيانات: {e}")
        import traceback
        traceback.print_exc()
        connection.rollback()
        return False
    finally:
        cursor.close()


def verify_data(connection):
    """التحقق من البيانات المضافة"""
    cursor = connection.cursor()
    try:
        cursor.execute(f"USE `{DATABASE_NAME}`")
        
        print("\n" + "="*60)
        print("ملخص البيانات المضافة:")
        print("="*60)
        
        # عدد الفروع
        cursor.execute("SELECT COUNT(*) FROM branches")
        branches_count = cursor.fetchone()[0]
        print(f"✓ الفروع: {branches_count}")
        
        # عدد الحسابات
        cursor.execute("SELECT COUNT(*) FROM operation_accounts")
        accounts_count = cursor.fetchone()[0]
        print(f"✓ الحسابات: {accounts_count}")
        
        # عدد العقود
        cursor.execute("SELECT COUNT(*) FROM contracts")
        contracts_count = cursor.fetchone()[0]
        print(f"✓ العقود: {contracts_count}")
        
        # عدد الجلسات
        cursor.execute("SELECT COUNT(*) FROM sessions")
        sessions_count = cursor.fetchone()[0]
        print(f"✓ الجلسات: {sessions_count}")
        
        # عدد المصاريف
        cursor.execute("SELECT COUNT(*) FROM expenses")
        expenses_count = cursor.fetchone()[0]
        print(f"✓ المصاريف: {expenses_count}")
        
        # عدد التقارير اليومية
        cursor.execute("SELECT COUNT(*) FROM daily_reports")
        reports_count = cursor.fetchone()[0]
        print(f"✓ التقارير اليومية: {reports_count}")
        
        print("\n" + "="*60)
        print("معلومات تسجيل الدخول:")
        print("="*60)
        print("المشرف العام:")
        print("  - اسم المستخدم: admin")
        print("  - كلمة المرور: admin123")
        print("\nالمديرين:")
        print("  - اسم المستخدم: manager1")
        print("  - كلمة المرور: manager123")
        print("  - اسم المستخدم: manager2")
        print("  - كلمة المرور: manager123")
        
    except Error as e:
        print(f"✗ خطأ في التحقق: {e}")
    finally:
        cursor.close()


def main():
    """الدالة الرئيسية"""
    print("="*60)
    print("سكريبت إضافة بيانات تجريبية")
    print("="*60)
    
    # إنشاء الاتصال
    connection = create_connection()
    
    try:
        # إضافة البيانات
        if not seed_data(connection):
            return
        
        # التحقق من البيانات
        verify_data(connection)
        
        print("\n" + "="*60)
        print("✓ تم إكمال العملية بنجاح!")
        print("="*60)
        
    except Error as e:
        print(f"\n✗ خطأ عام: {e}")
    finally:
        if connection.is_connected():
            connection.close()
            print("\n✓ تم إغلاق الاتصال بقاعدة البيانات")


if __name__ == "__main__":
    main()


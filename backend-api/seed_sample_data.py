"""
سكريبت لإضافة بيانات تجريبية كثيرة إلى قاعدة البيانات
"""
import sys
import io
import random
from datetime import date, datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import bcrypt

# إعداد ترميز UTF-8 للطباعة في Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# إعدادات الاتصال
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASSWORD = ''
DB_NAME = 'AlomranReportsDB'
DB_PORT = '3306'

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

def hash_password(password: str) -> str:
    """تشفير كلمة المرور باستخدام bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def seed_data():
    """إضافة البيانات التجريبية"""
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # 1. إضافة فروع
        print("\n" + "="*60)
        print("إضافة الفروع...")
        print("="*60)
        
        from sqlalchemy import text
        
        branches_data = [
            ("مركز العمران الرئيسي", 150.00),
            ("فرع البراري مول", 140.00),
            ("فرع المدينة", 145.00),
            ("فرع الخليج", 135.00),
            ("فرع النهدة", 142.00),
        ]
        
        branch_ids = []
        for branch_name, hourly_rate in branches_data:
            # التحقق من وجود الفرع
            result = db.execute(
                text("SELECT id FROM branches WHERE name = :name"),
                {"name": branch_name}
            )
            existing = result.fetchone()
            
            if existing:
                branch_id = existing[0]
                print(f"✓ الفرع موجود: {branch_name} (ID: {branch_id})")
            else:
                result = db.execute(
                    text("INSERT INTO branches (name, default_hourly_rate) VALUES (:name, :rate)"),
                    {"name": branch_name, "rate": hourly_rate}
                )
                db.commit()
                branch_id = result.lastrowid
                print(f"✓ تم إضافة الفرع: {branch_name} (ID: {branch_id})")
            
            branch_ids.append(branch_id)
        
        # 2. إضافة حسابات المستخدمين
        print("\n" + "="*60)
        print("إضافة حسابات المستخدمين...")
        print("="*60)
        
        accounts_data = [
            ("admin", "admin123", branch_ids[0], True, False, False, False, False, True),
            ("manager1", "manager123", branch_ids[0], False, False, True, False, False, True),
            ("manager2", "manager123", branch_ids[1], False, False, True, False, False, True),
            ("sales1", "sales123", branch_ids[0], False, True, False, False, False, True),
            ("sales2", "sales123", branch_ids[1], False, True, False, False, False, True),
            ("branch1", "branch123", branch_ids[0], False, False, False, True, False, True),
            ("branch2", "branch123", branch_ids[1], False, False, False, True, False, True),
        ]
        
        account_ids = []
        for username, password, branch_id, is_super, is_sales, is_op, is_branch, is_backdoor, is_active in accounts_data:
            # التحقق من وجود الحساب
            result = db.execute(
                text("SELECT id FROM operation_accounts WHERE username = :username"),
                {"username": username}
            )
            existing = result.fetchone()
            
            if existing:
                account_id = existing[0]
                account_ids.append(account_id)
                role_text = " (مشرف عام)" if is_super else (" (مدير أوبريشن)" if is_op else (" (مدير مبيعات)" if is_sales else " (حساب فرع)"))
                print(f"✓ الحساب موجود: {username}{role_text} (ID: {account_id})")
            else:
                password_hash = hash_password(password)
                result = db.execute(
                    text("""INSERT INTO operation_accounts 
                       (username, password_hash, branch_id, is_super_admin, is_sales_manager, 
                        is_operation_manager, is_branch_account, is_backdoor, is_active) 
                       VALUES (:username, :password, :branch_id, :is_super, :is_sales, :is_op, :is_branch, :is_backdoor, :is_active)"""),
                    {
                        "username": username, "password": password_hash, "branch_id": branch_id,
                        "is_super": is_super, "is_sales": is_sales, "is_op": is_op,
                        "is_branch": is_branch, "is_backdoor": is_backdoor, "is_active": is_active
                    }
                )
                db.commit()
                account_id = result.lastrowid
                account_ids.append(account_id)
                role_text = " (مشرف عام)" if is_super else (" (مدير أوبريشن)" if is_op else (" (مدير مبيعات)" if is_sales else " (حساب فرع)"))
                print(f"✓ تم إضافة الحساب: {username}{role_text} (ID: {account_id})")
        
        # 3. إضافة موظفي المبيعات
        print("\n" + "="*60)
        print("إضافة موظفي المبيعات...")
        print("="*60)
        
        sales_staff_names = [
            "أحمد محمد علي", "فاطمة حسن", "خالد سعيد", "نورا أحمد", "محمد خالد",
            "سارة علي", "علي حسن", "ليلى محمد", "يوسف أحمد", "مريم خالد",
            "حسن سعيد", "هدى علي", "طارق محمد", "رانيا أحمد", "باسم خالد",
            "سامية علي", "عمر حسن", "نادية محمد", "محمود أحمد", "سوسن خالد",
            "إبراهيم علي", "هند حسن", "وليد محمد", "ريم أحمد", "جمال خالد",
            "دينا علي", "كمال حسن", "لينا محمد", "نادر أحمد", "تغريد خالد",
            "عبدالله علي", "سلمى حسن", "زياد محمد", "غادة أحمد", "رامي خالد",
            "نور علي", "مازن حسن", "رنا محمد", "بسام أحمد", "سهام خالد",
            "وليد علي", "نورا حسن", "طارق محمد", "هالة أحمد", "بسام خالد",
            "سامر علي", "هند حسن", "مروان محمد", "سمر أحمد", "بسام خالد",
            "علي علي", "سارة حسن", "خالد محمد", "نورا أحمد", "محمد خالد",
            "فاطمة علي", "أحمد حسن", "ليلى محمد", "يوسف أحمد", "مريم خالد",
        ]
        
        sales_staff_ids = []
        for i, name in enumerate(sales_staff_names[:70]):
            branch_id = branch_ids[i % len(branch_ids)]
            phone = f"050{random.randint(1000000, 9999999)}"
            email = f"sales{i+1}@alomran.com"
            
            result = db.execute(
                text("""INSERT INTO sales_staff 
                   (name, branch_id, phone, email, is_active)
                   VALUES (:name, :branch_id, :phone, :email, :is_active)"""),
                {"name": name, "branch_id": branch_id, "phone": phone, "email": email, "is_active": True}
            )
            db.commit()
            staff_id = result.lastrowid
            sales_staff_ids.append(staff_id)
            if (i + 1) % 10 == 0:
                print(f"✓ تم إضافة {i + 1} موظف مبيعات...")
        
        print(f"✓ تم إضافة {len(sales_staff_ids)} موظف مبيعات")
        
        # 4. إضافة عقود
        print("\n" + "="*60)
        print("إضافة العقود...")
        print("="*60)
        
        student_names = [
            "أحمد محمد", "فاطمة علي", "خالد حسن", "نورا أحمد", "محمد خالد",
            "سارة علي", "علي حسن", "ليلى محمد", "يوسف أحمد", "مريم خالد",
            "حسن سعيد", "هدى علي", "طارق محمد", "رانيا أحمد", "باسم خالد",
            "سامية علي", "عمر حسن", "نادية محمد", "محمود أحمد", "سوسن خالد",
            "إبراهيم علي", "هند حسن", "وليد محمد", "ريم أحمد", "جمال خالد",
            "دينا علي", "كمال حسن", "لينا محمد", "نادر أحمد", "تغريد خالد",
            "عبدالله علي", "سلمى حسن", "زياد محمد", "غادة أحمد", "رامي خالد",
            "نور علي", "مازن حسن", "رنا محمد", "بسام أحمد", "سهام خالد",
            "وليد علي", "نورا حسن", "طارق محمد", "هالة أحمد", "بسام خالد",
            "سامر علي", "هند حسن", "مروان محمد", "سمر أحمد", "بسام خالد",
            "علي علي", "سارة حسن", "خالد محمد", "نورا أحمد", "محمد خالد",
            "فاطمة علي", "أحمد حسن", "ليلى محمد", "يوسف أحمد", "مريم خالد",
        ]
        
        teacher_names = [
            "د. سارة أحمد", "د. محمد خالد", "د. نورا سعيد", "د. أحمد علي",
            "د. فاطمة حسن", "د. خالد محمد", "د. ليلى أحمد", "د. يوسف خالد",
            "د. مريم علي", "د. حسن سعيد", "د. هدى محمد", "د. طارق أحمد",
            "د. رانيا خالد", "د. باسم علي", "د. سامية حسن", "د. عمر محمد",
        ]
        
        contract_statuses = ["active", "completed", "suspended", "cancelled"]
        
        contracts_added = 0
        for i in range(70):
            contract_num = f"CNT-2025-{str(i+1).zfill(3)}"
            
            # التحقق من وجود العقد
            result = db.execute(
                text("SELECT id FROM contracts WHERE contract_number = :contract_num"),
                {"contract_num": contract_num}
            )
            if result.fetchone():
                continue  # تخطي إذا كان موجوداً
            
            student = student_names[i % len(student_names)]
            teacher = teacher_names[i % len(teacher_names)]
            branch_id = branch_ids[i % len(branch_ids)]
            
            start_date = date(2025, 1, 1) + timedelta(days=random.randint(0, 300))
            end_date = start_date + timedelta(days=random.randint(30, 365))
            
            result = db.execute(
                text("SELECT default_hourly_rate FROM branches WHERE id = :branch_id"),
                {"branch_id": branch_id}
            )
            branch_rate = result.fetchone()[0]
            hourly_rate = float(branch_rate) + random.uniform(-10, 20)
            hourly_rate = round(hourly_rate, 2)
            
            total_hours = round(random.uniform(20, 200), 2)
            status = random.choice(contract_statuses)
            
            db.execute(
                text("""INSERT INTO contracts 
                   (contract_number, student_name, teacher_name, branch_id, start_date, end_date, hourly_rate, total_hours, status)
                   VALUES (:contract_num, :student, :teacher, :branch_id, :start_date, :end_date, :hourly_rate, :total_hours, :status)"""),
                {
                    "contract_num": contract_num, "student": student, "teacher": teacher,
                    "branch_id": branch_id, "start_date": start_date, "end_date": end_date,
                    "hourly_rate": hourly_rate, "total_hours": total_hours, "status": status
                }
            )
            db.commit()
            contracts_added += 1
            if contracts_added % 10 == 0:
                print(f"✓ تم إضافة {contracts_added} عقد...")
        
        print(f"✓ تم إضافة 70 عقد")
        
        # 5. إضافة جلسات موافق عليها
        print("\n" + "="*60)
        print("إضافة الجلسات الموافق عليها...")
        print("="*60)
        
        result = db.execute(
            text("SELECT contract_number, student_name, teacher_name, branch_id, hourly_rate FROM contracts WHERE status = 'active'")
        )
        active_contracts = result.fetchall()
        
        if not active_contracts:
            print("⚠ لا توجد عقود نشطة لإضافة جلسات")
        else:
            sessions_count = 0
            start_date_range = date.today() - timedelta(days=180)
            
            for i in range(80):
                contract = active_contracts[i % len(active_contracts)]
                contract_num, student, teacher, branch_id, hourly_rate = contract
                
                days_offset = random.randint(0, 180)
                session_date = start_date_range + timedelta(days=days_offset)
                
                start_hour = random.randint(8, 18)
                start_min = random.choice([0, 30])
                end_hour = start_hour + random.randint(1, 3)
                end_min = random.choice([0, 30])
                
                start_time = f"{start_hour:02d}:{start_min:02d}"
                end_time = f"{end_hour:02d}:{end_min:02d}"
                
                duration_hours = round((end_hour - start_hour) + (end_min - start_min) / 60.0, 2)
                if duration_hours < 1:
                    duration_hours = 1.0
                
                duration_text = f"{int(duration_hours)} ساعة"
                if duration_hours % 1 != 0:
                    duration_text = f"{int(duration_hours)} ساعة ونصف"
                
                calculated_amount = round(float(hourly_rate) * duration_hours, 2)
                location = random.choice(["internal", "external"])
                approved_by = account_ids[0]
                
                db.execute(
                    text("""INSERT INTO sessions 
                       (branch_id, teacher_name, student_name, session_date, start_time, end_time, 
                        duration_hours, duration_text, contract_number, hourly_rate, calculated_amount, location, approved_by)
                       VALUES (:branch_id, :teacher, :student, :session_date, :start_time, :end_time, 
                        :duration_hours, :duration_text, :contract_num, :hourly_rate, :calculated_amount, :location, :approved_by)"""),
                    {
                        "branch_id": branch_id, "teacher": teacher, "student": student,
                        "session_date": session_date, "start_time": start_time, "end_time": end_time,
                        "duration_hours": duration_hours, "duration_text": duration_text,
                        "contract_num": contract_num, "hourly_rate": hourly_rate,
                        "calculated_amount": calculated_amount, "location": location, "approved_by": approved_by
                    }
                )
                db.commit()
                sessions_count += 1
                if sessions_count % 20 == 0:
                    print(f"✓ تم إضافة {sessions_count} جلسة...")
            
            print(f"✓ تم إضافة {sessions_count} جلسة")
        
        # 6. إضافة مصاريف
        print("\n" + "="*60)
        print("إضافة المصاريف...")
        print("="*60)
        
        expense_titles = [
            "مصروف نقل", "مصروف مكتبي", "مصروف مواد تعليمية", "مصروف إعلانات",
            "مصروف صيانة", "مصروف كهرباء", "مصروف مياه", "مصروف إنترنت",
            "مصروف تنظيف", "مصروف أمن", "مصروف تأمين", "مصروف استشارات",
            "مصروف تدريب", "مصروف معدات", "مصروف أثاث", "مصروف برمجيات",
        ]
        
        for i in range(70):
            branch_id = branch_ids[i % len(branch_ids)]
            teacher_name = random.choice(teacher_names) if random.random() > 0.3 else None
            title = random.choice(expense_titles)
            amount = round(random.uniform(20, 500), 2)
            expense_date = date.today() - timedelta(days=random.randint(0, 180))
            
            db.execute(
                text("""INSERT INTO expenses (branch_id, teacher_name, title, amount, created_at) 
                   VALUES (:branch_id, :teacher_name, :title, :amount, :created_at)"""),
                {
                    "branch_id": branch_id, "teacher_name": teacher_name,
                    "title": title, "amount": amount,
                    "created_at": datetime.combine(expense_date, datetime.min.time())
                }
            )
            db.commit()
            if (i + 1) % 10 == 0:
                print(f"✓ تم إضافة {i + 1} مصروف...")
        
        print(f"✓ تم إضافة 70 مصروف")
        
        # 7. إضافة تقارير يومية
        print("\n" + "="*60)
        print("إضافة التقارير اليومية...")
        print("="*60)
        
        today = date.today()
        reports_added = 0
        
        for days_ago in range(90):
            report_date = today - timedelta(days=days_ago)
            
            for branch_id in branch_ids:
                result = db.execute(
                    text("""SELECT 
                        COUNT(*) as total_sessions,
                        COALESCE(SUM(duration_hours), 0) as total_hours,
                        COALESCE(SUM(calculated_amount), 0) as total_amount,
                        SUM(CASE WHEN location = 'internal' THEN 1 ELSE 0 END) as internal_sessions,
                        SUM(CASE WHEN location = 'external' THEN 1 ELSE 0 END) as external_sessions,
                        COALESCE(SUM(CASE WHEN location = 'internal' THEN calculated_amount ELSE 0 END), 0) as internal_amount,
                        COALESCE(SUM(CASE WHEN location = 'external' THEN calculated_amount ELSE 0 END), 0) as external_amount
                       FROM sessions 
                       WHERE branch_id = :branch_id AND DATE(session_date) = :report_date"""),
                    {"branch_id": branch_id, "report_date": report_date}
                )
                stats = result.fetchone()
                
                total_sessions = stats[0] or 0
                total_hours = float(stats[1] or 0)
                total_amount = float(stats[2] or 0)
                internal_sessions = stats[3] or 0
                external_sessions = stats[4] or 0
                internal_amount = float(stats[5] or 0)
                external_amount = float(stats[6] or 0)
                
                result = db.execute(
                    text("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE branch_id = :branch_id AND DATE(created_at) = :report_date"),
                    {"branch_id": branch_id, "report_date": report_date}
                )
                total_expenses = float(result.fetchone()[0] or 0)
                net_profit = total_amount - total_expenses
                
                db.execute(
                    text("""INSERT INTO daily_reports 
                       (branch_id, report_date, total_sessions, total_hours, total_amount,
                        internal_sessions, external_sessions, internal_amount, external_amount,
                        total_expenses, net_profit)
                       VALUES (:branch_id, :report_date, :total_sessions, :total_hours, :total_amount,
                        :internal_sessions, :external_sessions, :internal_amount, :external_amount,
                        :total_expenses, :net_profit)
                       ON DUPLICATE KEY UPDATE
                       total_sessions = VALUES(total_sessions),
                       total_hours = VALUES(total_hours),
                       total_amount = VALUES(total_amount),
                       internal_sessions = VALUES(internal_sessions),
                       external_sessions = VALUES(external_sessions),
                       internal_amount = VALUES(internal_amount),
                       external_amount = VALUES(external_amount),
                       total_expenses = VALUES(total_expenses),
                       net_profit = VALUES(net_profit)"""),
                    {
                        "branch_id": branch_id, "report_date": report_date,
                        "total_sessions": total_sessions, "total_hours": total_hours, "total_amount": total_amount,
                        "internal_sessions": internal_sessions, "external_sessions": external_sessions,
                        "internal_amount": internal_amount, "external_amount": external_amount,
                        "total_expenses": total_expenses, "net_profit": net_profit
                    }
                )
                db.commit()
                reports_added += 1
        
        print(f"✓ تم إضافة {reports_added} تقرير يومي")
        
        # 8. إضافة تقارير المبيعات اليومية
        print("\n" + "="*60)
        print("إضافة تقارير المبيعات اليومية...")
        print("="*60)
        
        result = db.execute(text("SELECT id, branch_id FROM sales_staff WHERE is_active = 1"))
        active_staff = result.fetchall()
        
        if active_staff:
            sales_reports_added = 0
            for days_ago in range(90):
                report_date = today - timedelta(days=days_ago)
                
                staff_to_report = random.sample(active_staff, min(10, len(active_staff)))
                
                for staff_id, branch_id in staff_to_report:
                    number_of_deals = random.randint(0, 5)
                    sales_amount = round(random.uniform(0, 10000), 2) if number_of_deals > 0 else 0
                    
                    db.execute(
                        text("""INSERT INTO daily_sales_reports 
                           (sales_staff_id, branch_id, report_date, sales_amount, number_of_deals)
                           VALUES (:staff_id, :branch_id, :report_date, :sales_amount, :number_of_deals)
                           ON DUPLICATE KEY UPDATE
                           sales_amount = VALUES(sales_amount),
                           number_of_deals = VALUES(number_of_deals)"""),
                        {
                            "staff_id": staff_id, "branch_id": branch_id, "report_date": report_date,
                            "sales_amount": sales_amount, "number_of_deals": number_of_deals
                        }
                    )
                    db.commit()
                    sales_reports_added += 1
            
            print(f"✓ تم إضافة {sales_reports_added} تقرير مبيعات يومي")
        
        # 9. إضافة الميزانيات (إذا كان الجدول موجوداً)
        print("\n" + "="*60)
        print("إضافة الميزانيات...")
        print("="*60)
        
        try:
            # التحقق من وجود الجدول
            result = db.execute(text("SHOW TABLES LIKE 'budgets'"))
            if result.fetchone():
                budget_types = ["monthly", "quarterly", "yearly"]
                budget_categories = ["income", "expense"]
                
                for year in [2024, 2025]:
                    for month in range(1, 13):
                        budget_date = date(year, month, 1)
                        
                        for branch_id in branch_ids:
                            for budget_type in budget_types:
                                for category in budget_categories:
                                    budgeted_amount = round(random.uniform(1000, 50000), 2)
                                    
                                    db.execute(
                                        text("""INSERT INTO budgets 
                                           (branch_id, budget_date, budget_type, category, budgeted_amount)
                                           VALUES (:branch_id, :budget_date, :budget_type, :category, :budgeted_amount)
                                           ON DUPLICATE KEY UPDATE
                                           budgeted_amount = VALUES(budgeted_amount)"""),
                                        {
                                            "branch_id": branch_id, "budget_date": budget_date,
                                            "budget_type": budget_type, "category": category,
                                            "budgeted_amount": budgeted_amount
                                        }
                                    )
                                    db.commit()
                
                print(f"✓ تم إضافة الميزانيات")
                
                # 10. إضافة عناصر الميزانية
                print("\n" + "="*60)
                print("إضافة عناصر الميزانية...")
                print("="*60)
                
                item_names = [
                    "راتب الموظفين", "إيجار المكتب", "كهرباء ومياه", "إنترنت واتصالات",
                    "مواد تعليمية", "صيانة وأصلاح", "إعلانات وتسويق", "نقل ومواصلات",
                    "تأمين", "ضرائب", "استشارات قانونية", "تدريب الموظفين",
                    "معدات وأجهزة", "أثاث", "برمجيات", "تنظيف وصيانة",
                ]
                
                result = db.execute(text("SELECT id, branch_id FROM budgets LIMIT 100"))
                budgets_list = result.fetchall()
                
                items_added = 0
                for budget_id, branch_id in budgets_list:
                    for i in range(random.randint(3, 8)):
                        item_name = random.choice(item_names)
                        planned_amount = round(random.uniform(100, 5000), 2)
                        actual_amount = round(planned_amount * random.uniform(0.8, 1.2), 2)
                        
                        db.execute(
                            text("""INSERT INTO budget_items 
                               (budget_id, branch_id, item_name, planned_amount, actual_amount)
                               VALUES (:budget_id, :branch_id, :item_name, :planned_amount, :actual_amount)"""),
                            {
                                "budget_id": budget_id, "branch_id": branch_id,
                                "item_name": item_name, "planned_amount": planned_amount,
                                "actual_amount": actual_amount
                            }
                        )
                        db.commit()
                        items_added += 1
                
                print(f"✓ تم إضافة {items_added} عنصر ميزانية")
            else:
                print("⚠ جدول budgets غير موجود - تم تخطي إضافة الميزانيات")
        except Exception as e:
            print(f"⚠ خطأ في إضافة الميزانيات: {e} - تم تخطيها")
        
        print("\n" + "="*60)
        print("✓ تم إضافة جميع البيانات التجريبية بنجاح!")
        print("="*60)
        
        # التحقق من البيانات
        print("\n" + "="*60)
        print("ملخص البيانات المضافة:")
        print("="*60)
        
        result = db.execute(text("SELECT COUNT(*) FROM branches"))
        print(f"✓ الفروع: {result.fetchone()[0]}")
        
        result = db.execute(text("SELECT COUNT(*) FROM operation_accounts"))
        print(f"✓ الحسابات: {result.fetchone()[0]}")
        
        result = db.execute(text("SELECT COUNT(*) FROM sales_staff"))
        print(f"✓ موظفي المبيعات: {result.fetchone()[0]}")
        
        result = db.execute(text("SELECT COUNT(*) FROM contracts"))
        print(f"✓ العقود: {result.fetchone()[0]}")
        
        result = db.execute(text("SELECT COUNT(*) FROM sessions"))
        print(f"✓ الجلسات: {result.fetchone()[0]}")
        
        result = db.execute(text("SELECT COUNT(*) FROM expenses"))
        print(f"✓ المصاريف: {result.fetchone()[0]}")
        
        result = db.execute(text("SELECT COUNT(*) FROM daily_reports"))
        print(f"✓ التقارير اليومية: {result.fetchone()[0]}")
        
        result = db.execute(text("SELECT COUNT(*) FROM daily_sales_reports"))
        print(f"✓ تقارير المبيعات اليومية: {result.fetchone()[0]}")
        
        try:
            result = db.execute(text("SELECT COUNT(*) FROM budgets"))
            print(f"✓ الميزانيات: {result.fetchone()[0]}")
        except:
            print("✓ الميزانيات: الجدول غير موجود")
        
        try:
            result = db.execute(text("SELECT COUNT(*) FROM budget_items"))
            print(f"✓ عناصر الميزانية: {result.fetchone()[0]}")
        except:
            print("✓ عناصر الميزانية: الجدول غير موجود")
        
        print("\n" + "="*60)
        print("معلومات تسجيل الدخول:")
        print("="*60)
        print("المشرف العام:")
        print("  - اسم المستخدم: admin")
        print("  - كلمة المرور: admin123")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"\n✗ خطأ في إضافة البيانات: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """الدالة الرئيسية"""
    print("="*60)
    print("سكريبت إضافة بيانات تجريبية كثيرة")
    print("="*60)
    
    if not seed_data():
        return
    
    print("\n" + "="*60)
    print("✓ تم إكمال العملية بنجاح!")
    print("="*60)


if __name__ == "__main__":
    main()

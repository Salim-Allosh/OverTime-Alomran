# دليل إنشاء قاعدة البيانات - مركز العمران للتدريب والتطوير

هذا الدليل يشرح كيفية إعادة إنشاء قاعدة البيانات MySQL بعد حذفها.

## المتطلبات

1. **XAMPP مثبت ويعمل**
   - تأكد من تشغيل خدمة MySQL في XAMPP
   - عادة ما يكون المنفذ 3306

2. **مكتبات Python** (للسكريبت Python)
   ```bash
   pip install mysql-connector-python
   ```
   أو
   ```bash
   pip install pymysql
   ```

## الطريقة الأولى: استخدام سكريبت Python (الأسهل)

### الخطوة 1: تعديل إعدادات الاتصال

افتح ملف `create_mysql_database.py` وعدّل إعدادات الاتصال إذا لزم الأمر:

```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # ضع كلمة المرور هنا إذا كانت موجودة
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}
```

### الخطوة 2: تشغيل السكريبت

```bash
cd backend-api
python create_mysql_database.py
```

### النتيجة المتوقعة

```
============================================================
سكريبت إنشاء قاعدة البيانات - مركز العمران للتدريب والتطوير
============================================================

✓ تم الاتصال بنجاح بخادم MySQL
✓ تم حذف قاعدة البيانات القديمة (إن وجدت)
✓ تم إنشاء قاعدة البيانات: AlomranReportsDB
✓ تم التبديل إلى قاعدة البيانات: AlomranReportsDB

✓ تم إنشاء جدول: branches
✓ تم إنشاء جدول: operation_accounts
✓ تم إنشاء جدول: session_drafts
✓ تم إنشاء جدول: sessions
✓ تم إنشاء جدول: expenses

✓ تم إنشاء جميع الجداول بنجاح!

==================================================
التحقق من الجداول:
==================================================
✓ branches
✓ operation_accounts
✓ session_drafts
✓ sessions
✓ expenses

✓ تم التحقق من جميع الجداول (5 جدول)

============================================================
✓ تم إنشاء قاعدة البيانات بنجاح!
============================================================
```

---

## الطريقة الثانية: استخدام ملف SQL (phpMyAdmin)

### الخطوة 1: فتح phpMyAdmin

1. تأكد من تشغيل XAMPP وبدء خدمة MySQL
2. افتح المتصفح وانتقل إلى: `http://localhost/phpmyadmin`

### الخطوة 2: تنفيذ ملف SQL

1. في phpMyAdmin، اضغط على تبويب **"SQL"** في الأعلى
2. افتح ملف `create_database.sql` من مجلد `backend-api`
3. انسخ المحتوى بالكامل والصقه في نافذة SQL
4. اضغط على زر **"Go"** أو **"تنفيذ"**

### الخطوة 3: التحقق

في القائمة الجانبية، يجب أن ترى قاعدة البيانات **AlomranReportsDB** مع 5 جداول:
- `branches`
- `operation_accounts`
- `session_drafts`
- `sessions`
- `expenses`

---

## الطريقة الثالثة: استخدام سطر الأوامر MySQL

```bash
mysql -u root -p < backend-api/create_database.sql
```

أو بدون كلمة مرور:

```bash
mysql -u root < backend-api/create_database.sql
```

---

## هيكل قاعدة البيانات

### الجداول والعلاقات

```
branches (الفروع)
  ├── id (PK)
  ├── name
  └── default_hourly_rate
      │
      ├── operation_accounts (حسابات المستخدمين)
      │   ├── id (PK)
      │   ├── username
      │   ├── password_hash
      │   ├── branch_id (FK → branches.id)
      │   └── is_super_admin
      │
      ├── session_drafts (مسودات الجلسات)
      │   ├── id (PK)
      │   ├── branch_id (FK → branches.id)
      │   ├── teacher_name
      │   ├── student_name
      │   ├── session_date
      │   ├── start_time
      │   ├── end_time
      │   ├── duration_hours
      │   ├── duration_text
      │   ├── status
      │   ├── rejection_reason
      │   └── created_at
      │
      ├── sessions (الجلسات الموافق عليها)
      │   ├── id (PK)
      │   ├── branch_id (FK → branches.id)
      │   ├── teacher_name
      │   ├── student_name
      │   ├── session_date
      │   ├── start_time
      │   ├── end_time
      │   ├── duration_hours
      │   ├── duration_text
      │   ├── contract_number
      │   ├── hourly_rate
      │   ├── calculated_amount
      │   ├── location (internal/external)
      │   ├── approved_by (FK → operation_accounts.id)
      │   └── created_at
      │
      └── expenses (المصاريف)
          ├── id (PK)
          ├── branch_id (FK → branches.id)
          ├── teacher_name (اختياري)
          ├── title
          ├── amount
          └── created_at
```

### العلاقات (Foreign Keys)

1. **operation_accounts.branch_id** → **branches.id** (ON DELETE CASCADE)
2. **session_drafts.branch_id** → **branches.id** (ON DELETE CASCADE)
3. **sessions.branch_id** → **branches.id** (ON DELETE CASCADE)
4. **sessions.approved_by** → **operation_accounts.id** (ON DELETE RESTRICT)
5. **expenses.branch_id** → **branches.id** (ON DELETE CASCADE)

### الفهارس (Indexes)

جميع الجداول تحتوي على فهارس محسّنة للبحث السريع:
- فهرس على `id` (Primary Key)
- فهرس على `branch_id` (لجميع الجداول المرتبطة بالفروع)
- فهرس على `teacher_name` (لجداول الجلسات والمصاريف)
- فهرس على `created_at` (للبحث حسب التاريخ)
- فهرس على `status` (لجدول session_drafts)
- فهرس على `location` (لجدول sessions)

---

## الخطوات التالية بعد إنشاء قاعدة البيانات

### 1. تحديث إعدادات الاتصال في main.py

إذا كان النظام يستخدم SQLite حالياً، يجب تحديثه لاستخدام MySQL:

```python
# في main.py، استبدل:
DATABASE_URL = f"sqlite:///{str(DB_PATH).replace(chr(92), '/')}"

# بـ:
DATABASE_URL = "mysql+pymysql://root:@localhost/AlomranReportsDB?charset=utf8mb4"
```

أو استخدم متغيرات البيئة:

```python
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:@localhost/AlomranReportsDB?charset=utf8mb4"
)
```

### 2. تثبيت مكتبة MySQL لـ SQLAlchemy

```bash
pip install pymysql
```

أو

```bash
pip install mysql-connector-python
```

### 3. إنشاء حساب مشرف أولي

بعد إنشاء قاعدة البيانات، ستحتاج إلى:
1. إنشاء فرع أولي
2. إنشاء حساب مشرف عام

يمكنك استخدام API أو إضافة البيانات يدوياً.

---

## استكشاف الأخطاء

### خطأ: "Access denied for user 'root'@'localhost'"

**الحل:**
- تأكد من أن MySQL يعمل في XAMPP
- تحقق من اسم المستخدم وكلمة المرور في `create_mysql_database.py`
- جرب إضافة كلمة المرور إذا كانت موجودة

### خطأ: "Can't connect to MySQL server"

**الحل:**
- تأكد من تشغيل خدمة MySQL في XAMPP
- تحقق من أن المنفذ 3306 مفتوح
- جرب تغيير `host` من `localhost` إلى `127.0.0.1`

### خطأ: "Database already exists"

**الحل:**
- السكريبت يحذف قاعدة البيانات القديمة تلقائياً
- إذا استمرت المشكلة، احذف قاعدة البيانات يدوياً من phpMyAdmin

### خطأ: "Table already exists"

**الحل:**
- الجداول تستخدم `CREATE TABLE IF NOT EXISTS`، لذا لن تظهر مشكلة إلا إذا كان هناك تضارب في البنية
- إذا استمرت المشكلة، احذف الجداول يدوياً من phpMyAdmin

---

## ملاحظات مهمة

1. **الترميز**: جميع الجداول تستخدم `utf8mb4_unicode_ci` لدعم اللغة العربية بشكل كامل
2. **Foreign Keys**: الجداول مرتبطة ببعضها، لذا يجب إنشاء `branches` أولاً
3. **البيانات**: بعد إنشاء قاعدة البيانات، ستكون فارغة. ستحتاج إلى إضافة البيانات يدوياً أو عبر API
4. **النسخ الاحتياطي**: يُنصح بعمل نسخة احتياطية من قاعدة البيانات بانتظام

---

## الدعم

إذا واجهت أي مشاكل، تحقق من:
1. سجلات الأخطاء في السكريبت
2. سجلات MySQL في XAMPP
3. ملف `create_database.sql` للتأكد من صحة الأوامر

---

**تم إنشاء هذا الدليل بواسطة النظام**  
**تاريخ الإنشاء**: 2024



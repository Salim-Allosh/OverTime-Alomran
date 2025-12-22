# تعليمات إنشاء قاعدة البيانات AlomranReportsDB على phpMyAdmin

## المتطلبات
- XAMPP مثبت ويعمل
- MySQL يعمل على المنفذ 3306
- الوصول إلى phpMyAdmin عبر: `http://localhost/phpmyadmin`

---

## الطريقة الأولى: استخدام واجهة phpMyAdmin (الأسهل)

### الخطوة 1: فتح phpMyAdmin
1. تأكد من تشغيل XAMPP وبدء خدمة MySQL
2. افتح المتصفح وانتقل إلى: `http://localhost/phpmyadmin`
3. سجل الدخول (عادة بدون كلمة مرور للمستخدم `root`)

### الخطوة 2: إنشاء قاعدة البيانات
1. في الشريط العلوي، اضغط على تبويب **"Databases"** أو **"قواعد البيانات"**
2. في حقل **"Create database"** أو **"إنشاء قاعدة بيانات"**، اكتب:
   ```
   AlomranReportsDB
   ```
3. من القائمة المنسدلة **"Collation"** أو **"ترتيب"**، اختر:
   ```
   utf8mb4_unicode_ci
   ```
4. اضغط على زر **"Create"** أو **"إنشاء"**

### الخطوة 3: إنشاء الجداول
بعد إنشاء قاعدة البيانات، ستفتح تلقائياً. اتبع الخطوات التالية:

#### أ) استخدام تبويب SQL
1. اضغط على تبويب **"SQL"** في الأعلى
2. انسخ والصق محتوى ملف `backend-api/create_database.sql` بالكامل
3. اضغط على زر **"Go"** أو **"تنفيذ"**

#### ب) أو إنشاء الجداول يدوياً
إذا كنت تفضل إنشاء الجداول واحداً تلو الآخر، استخدم الأوامر التالية:

**جدول branches:**
```sql
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    default_hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
    INDEX idx_branches_id (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**جدول operation_accounts:**
```sql
CREATE TABLE IF NOT EXISTS operation_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    branch_id INT NOT NULL,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX idx_operation_accounts_id (id),
    INDEX idx_operation_accounts_branch_id (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**جدول session_drafts:**
```sql
CREATE TABLE IF NOT EXISTS session_drafts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    teacher_name VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL,
    start_time VARCHAR(50) NULL,
    end_time VARCHAR(50) NULL,
    duration_hours DECIMAL(5, 2) NOT NULL,
    duration_text VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    rejection_reason TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX idx_session_drafts_id (id),
    INDEX idx_session_drafts_branch_id (branch_id),
    INDEX idx_session_drafts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**جدول sessions:**
```sql
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    teacher_name VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL,
    start_time VARCHAR(50) NULL,
    end_time VARCHAR(50) NULL,
    duration_hours DECIMAL(5, 2) NOT NULL,
    duration_text VARCHAR(255) NOT NULL,
    contract_number VARCHAR(255) NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    calculated_amount DECIMAL(12, 2) NOT NULL,
    location VARCHAR(50) NOT NULL DEFAULT 'internal',
    approved_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES operation_accounts(id) ON DELETE RESTRICT,
    INDEX idx_sessions_id (id),
    INDEX idx_sessions_branch_id (branch_id),
    INDEX idx_sessions_session_date (session_date),
    INDEX idx_sessions_teacher_name (teacher_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**جدول expenses:**
```sql
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    teacher_name VARCHAR(255) NULL,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX idx_expenses_id (id),
    INDEX idx_expenses_branch_id (branch_id),
    INDEX idx_expenses_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## الطريقة الثانية: استخدام سكريبت Python

### الخطوة 1: إنشاء قاعدة البيانات
```bash
cd backend-api
python create_mysql_database.py
```

### الخطوة 2: إنشاء الجداول
```bash
python create_mysql_tables.py
```

---

## التحقق من نجاح العملية

### في phpMyAdmin:
1. في القائمة الجانبية، اضغط على قاعدة البيانات **AlomranReportsDB**
2. يجب أن ترى 5 جداول:
   - `branches`
   - `operation_accounts`
   - `session_drafts`
   - `sessions`
   - `expenses`

### عبر Terminal/Command Prompt:
```bash
cd backend-api
python create_mysql_database.py
python create_mysql_tables.py
```

إذا لم تظهر أخطاء، فالعملية نجحت.

---

## ملاحظات مهمة

1. **ترميز الأحرف**: تأكد من استخدام `utf8mb4_unicode_ci` لدعم اللغة العربية بشكل كامل
2. **Foreign Keys**: الجداول مرتبطة ببعضها، لذا يجب إنشاء `branches` أولاً، ثم `operation_accounts`، ثم باقي الجداول
3. **البيانات الافتراضية**: بعد إنشاء الجداول، يمكنك تشغيل `seed_sample_data.py` لإضافة بيانات تجريبية

---

## استكشاف الأخطاء

### خطأ: "Access denied"
- تأكد من أن MySQL يعمل في XAMPP
- تأكد من اسم المستخدم وكلمة المرور (عادة `root` بدون كلمة مرور)

### خطأ: "Database already exists"
- إذا كانت قاعدة البيانات موجودة بالفعل، يمكنك:
  - حذفها من phpMyAdmin وإعادة إنشائها
  - أو استخدام `DROP DATABASE AlomranReportsDB;` ثم إعادة الإنشاء

### خطأ: "Table already exists"
- الجداول تستخدم `CREATE TABLE IF NOT EXISTS`، لذا لن تظهر مشكلة إلا إذا كان هناك تضارب في البنية

---

## الخطوات التالية

بعد إنشاء قاعدة البيانات والجداول:
1. قم بتشغيل `seed_sample_data.py` لإضافة بيانات تجريبية (اختياري)
2. تأكد من أن ملف `.env` أو متغيرات البيئة تشير إلى `AlomranReportsDB`
3. شغّل السيرفر باستخدام `run.bat`

---

**تم إنشاء هذا الملف بواسطة النظام**
**تاريخ الإنشاء**: 2024


# هيكل قاعدة البيانات - مركز العمران للتدريب والتطوير

## ✅ تم تحديث النظام لاستخدام MySQL

تم تحديث `main.py` لاستخدام قاعدة البيانات MySQL بدلاً من SQLite.

---

## 📊 الجداول الموجودة حالياً

### 1. `branches` (الفروع)
- **الوصف**: جدول الفروع
- **الحقول**:
  - `id` (PK)
  - `name` (اسم الفرع)
  - `default_hourly_rate` (السعر الافتراضي للساعة)

### 2. `operation_accounts` (حسابات المستخدمين)
- **الوصف**: جدول حسابات المستخدمين والمشرفين
- **الحقول**:
  - `id` (PK)
  - `username` (اسم المستخدم)
  - `password_hash` (كلمة المرور المشفرة)
  - `branch_id` (FK → branches.id)
  - `is_super_admin` (هل هو مشرف عام)

### 3. `session_drafts` (مسودات الجلسات)
- **الوصف**: جدول مسودات الجلسات قبل الموافقة
- **الحقول**:
  - `id` (PK)
  - `branch_id` (FK → branches.id)
  - `teacher_name` (اسم المدرس)
  - `student_name` (اسم الطالب)
  - `session_date` (تاريخ الجلسة)
  - `start_time` (وقت البداية)
  - `end_time` (وقت النهاية)
  - `duration_hours` (المدة بالساعات)
  - `duration_text` (نص المدة)
  - `status` (الحالة: pending, approved, rejected)
  - `rejection_reason` (سبب الرفض)
  - `created_at` (تاريخ الإنشاء)

### 4. `sessions` (الجلسات الموافق عليها)
- **الوصف**: جدول الجلسات الموافق عليها (يحتوي على معلومات العقود)
- **الحقول**:
  - `id` (PK)
  - `branch_id` (FK → branches.id)
  - `teacher_name` (اسم المدرس)
  - `student_name` (اسم الطالب)
  - `session_date` (تاريخ الجلسة)
  - `start_time` (وقت البداية)
  - `end_time` (وقت النهاية)
  - `duration_hours` (المدة بالساعات)
  - `duration_text` (نص المدة)
  - **`contract_number`** (رقم العقد) ⭐
  - `hourly_rate` (سعر الساعة)
  - `calculated_amount` (المبلغ المحسوب)
  - `location` (النوع: internal/external)
  - `approved_by` (FK → operation_accounts.id)
  - `created_at` (تاريخ الإنشاء)

### 5. `expenses` (المصاريف)
- **الوصف**: جدول المصاريف الإضافية
- **الحقول**:
  - `id` (PK)
  - `branch_id` (FK → branches.id)
  - `teacher_name` (اسم المدرس - اختياري)
  - `title` (سبب المصروف)
  - `amount` (المبلغ)
  - `created_at` (تاريخ الإنشاء)

---

## 📋 التقارير والعقود والتقارير اليومية

### ✅ التقارير الشهرية
- **الوضع**: ✅ موجودة
- **كيفية العمل**: يتم إنشاؤها ديناميكياً من الجداول الموجودة
- **API Endpoint**: `GET /reports/monthly`
- **المصدر**: 
  - جدول `sessions` (الجلسات الموافق عليها)
  - جدول `expenses` (المصاريف)
  - جدول `session_drafts` (المسودات)

### ✅ معلومات العقود
- **الوضع**: ✅ موجودة
- **الموقع**: حقل `contract_number` في جدول `sessions`
- **ملاحظة**: لا يوجد جدول منفصل للعقود، ولكن كل جلسة موافق عليها مرتبطة برقم عقد

### ⚠️ التقارير اليومية
- **الوضع**: ⚠️ لا يوجد جدول منفصل
- **كيفية العمل**: يمكن إنشاؤها من جدول `sessions` باستخدام `session_date`
- **الاقتراح**: يمكن إضافة endpoint جديد `/reports/daily` لإنشاء تقارير يومية

---

## 🔄 العلاقات بين الجداول

```
branches
  ├── operation_accounts (branch_id → branches.id)
  ├── session_drafts (branch_id → branches.id)
  ├── sessions (branch_id → branches.id)
  └── expenses (branch_id → branches.id)

operation_accounts
  └── sessions (approved_by → operation_accounts.id)
```

---

## 📝 ملاحظات مهمة

1. **التقارير**: لا يوجد جدول منفصل للتقارير، يتم إنشاؤها ديناميكياً عند الطلب
2. **العقود**: معلومات العقود موجودة في حقل `contract_number` في جدول `sessions`
3. **التقارير اليومية**: يمكن إنشاؤها من البيانات الموجودة، لكن لا يوجد endpoint مخصص حالياً

---

## 🚀 إمكانيات التطوير المستقبلية

إذا كنت تريد إضافة جداول منفصلة:

### 1. جدول العقود (contracts)
```sql
CREATE TABLE contracts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contract_number VARCHAR(255) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    teacher_name VARCHAR(255) NOT NULL,
    branch_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    total_hours DECIMAL(5, 2),
    status VARCHAR(50) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);
```

### 2. جدول التقارير اليومية (daily_reports)
```sql
CREATE TABLE daily_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    report_date DATE NOT NULL,
    total_sessions INT DEFAULT 0,
    total_hours DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    UNIQUE KEY unique_daily_report (branch_id, report_date)
);
```

---

## ✅ تم التحديث

- ✅ تم تحديث `main.py` لاستخدام MySQL
- ✅ تم تحديث دوال التاريخ لاستخدام MySQL functions (YEAR, MONTH)
- ✅ تم إضافة `pymysql` إلى requirements.txt
- ✅ تم اختبار الاتصال بنجاح

---

**تاريخ التحديث**: 2024



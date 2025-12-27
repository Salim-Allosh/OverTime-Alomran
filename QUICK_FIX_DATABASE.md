# 🔧 إصلاح سريع لقاعدة البيانات

## المشكلة
قاعدة البيانات لا تحتوي على الأعمدة الجديدة في جدول `operation_accounts`:
- `is_sales_manager`
- `is_operation_manager`
- `is_branch_account`
- `is_backdoor`
- `is_active`

## الحل السريع

### الطريقة 1: استخدام phpMyAdmin (الأسهل)

1. افتح phpMyAdmin
2. اختر قاعدة البيانات `AlomranReportsDB`
3. انقر على جدول `operation_accounts`
4. انقر على تبويب "SQL"
5. انسخ والصق السكريبت التالي:

```sql
USE `AlomranReportsDB`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;
```

6. انقر على "Go" أو "تنفيذ"

**ملاحظة:** إذا ظهرت رسالة "Duplicate column name" لأي عمود، فهذا يعني أنه موجود بالفعل ويمكنك تجاهله.

### الطريقة 2: استخدام سكريبت Python

1. افتح Terminal/Command Prompt
2. انتقل إلى مجلد `backend-api`:
   ```bash
   cd backend-api
   ```

3. عدّل كلمة المرور في ملف `update_database.py` (السطر 15)

4. شغّل السكريبت:
   ```bash
   python update_database.py
   ```

### الطريقة 3: استخدام MySQL Command Line

```bash
mysql -u root -p AlomranReportsDB < update_operation_accounts_manual.sql
```

## التحقق من النجاح

بعد تنفيذ السكريبت، تحقق من أن الأعمدة موجودة:

```sql
DESCRIBE operation_accounts;
```

يجب أن ترى الأعمدة الجديدة:
- `is_sales_manager`
- `is_operation_manager`
- `is_branch_account`
- `is_backdoor`
- `is_active`

## بعد التحديث

أعد تشغيل السيرفر:
```bash
run.bat
```

---

**ملف SQL الكامل:** `backend-api/update_operation_accounts_manual.sql`




## المشكلة
قاعدة البيانات لا تحتوي على الأعمدة الجديدة في جدول `operation_accounts`:
- `is_sales_manager`
- `is_operation_manager`
- `is_branch_account`
- `is_backdoor`
- `is_active`

## الحل السريع

### الطريقة 1: استخدام phpMyAdmin (الأسهل)

1. افتح phpMyAdmin
2. اختر قاعدة البيانات `AlomranReportsDB`
3. انقر على جدول `operation_accounts`
4. انقر على تبويب "SQL"
5. انسخ والصق السكريبت التالي:

```sql
USE `AlomranReportsDB`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;
```

6. انقر على "Go" أو "تنفيذ"

**ملاحظة:** إذا ظهرت رسالة "Duplicate column name" لأي عمود، فهذا يعني أنه موجود بالفعل ويمكنك تجاهله.

### الطريقة 2: استخدام سكريبت Python

1. افتح Terminal/Command Prompt
2. انتقل إلى مجلد `backend-api`:
   ```bash
   cd backend-api
   ```

3. عدّل كلمة المرور في ملف `update_database.py` (السطر 15)

4. شغّل السكريبت:
   ```bash
   python update_database.py
   ```

### الطريقة 3: استخدام MySQL Command Line

```bash
mysql -u root -p AlomranReportsDB < update_operation_accounts_manual.sql
```

## التحقق من النجاح

بعد تنفيذ السكريبت، تحقق من أن الأعمدة موجودة:

```sql
DESCRIBE operation_accounts;
```

يجب أن ترى الأعمدة الجديدة:
- `is_sales_manager`
- `is_operation_manager`
- `is_branch_account`
- `is_backdoor`
- `is_active`

## بعد التحديث

أعد تشغيل السيرفر:
```bash
run.bat
```

---

**ملف SQL الكامل:** `backend-api/update_operation_accounts_manual.sql`




## المشكلة
قاعدة البيانات لا تحتوي على الأعمدة الجديدة في جدول `operation_accounts`:
- `is_sales_manager`
- `is_operation_manager`
- `is_branch_account`
- `is_backdoor`
- `is_active`

## الحل السريع

### الطريقة 1: استخدام phpMyAdmin (الأسهل)

1. افتح phpMyAdmin
2. اختر قاعدة البيانات `AlomranReportsDB`
3. انقر على جدول `operation_accounts`
4. انقر على تبويب "SQL"
5. انسخ والصق السكريبت التالي:

```sql
USE `AlomranReportsDB`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;
```

6. انقر على "Go" أو "تنفيذ"

**ملاحظة:** إذا ظهرت رسالة "Duplicate column name" لأي عمود، فهذا يعني أنه موجود بالفعل ويمكنك تجاهله.

### الطريقة 2: استخدام سكريبت Python

1. افتح Terminal/Command Prompt
2. انتقل إلى مجلد `backend-api`:
   ```bash
   cd backend-api
   ```

3. عدّل كلمة المرور في ملف `update_database.py` (السطر 15)

4. شغّل السكريبت:
   ```bash
   python update_database.py
   ```

### الطريقة 3: استخدام MySQL Command Line

```bash
mysql -u root -p AlomranReportsDB < update_operation_accounts_manual.sql
```

## التحقق من النجاح

بعد تنفيذ السكريبت، تحقق من أن الأعمدة موجودة:

```sql
DESCRIBE operation_accounts;
```

يجب أن ترى الأعمدة الجديدة:
- `is_sales_manager`
- `is_operation_manager`
- `is_branch_account`
- `is_backdoor`
- `is_active`

## بعد التحديث

أعد تشغيل السيرفر:
```bash
run.bat
```

---

**ملف SQL الكامل:** `backend-api/update_operation_accounts_manual.sql`




## المشكلة
قاعدة البيانات لا تحتوي على الأعمدة الجديدة في جدول `operation_accounts`:
- `is_sales_manager`
- `is_operation_manager`
- `is_branch_account`
- `is_backdoor`
- `is_active`

## الحل السريع

### الطريقة 1: استخدام phpMyAdmin (الأسهل)

1. افتح phpMyAdmin
2. اختر قاعدة البيانات `AlomranReportsDB`
3. انقر على جدول `operation_accounts`
4. انقر على تبويب "SQL"
5. انسخ والصق السكريبت التالي:

```sql
USE `AlomranReportsDB`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_sales_manager` BOOLEAN DEFAULT FALSE AFTER `is_super_admin`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_operation_manager` BOOLEAN DEFAULT FALSE AFTER `is_sales_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_branch_account` BOOLEAN DEFAULT FALSE AFTER `is_operation_manager`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_backdoor` BOOLEAN DEFAULT FALSE AFTER `is_branch_account`;

ALTER TABLE `operation_accounts` 
ADD COLUMN `is_active` BOOLEAN DEFAULT TRUE AFTER `is_backdoor`;
```

6. انقر على "Go" أو "تنفيذ"

**ملاحظة:** إذا ظهرت رسالة "Duplicate column name" لأي عمود، فهذا يعني أنه موجود بالفعل ويمكنك تجاهله.

### الطريقة 2: استخدام سكريبت Python

1. افتح Terminal/Command Prompt
2. انتقل إلى مجلد `backend-api`:
   ```bash
   cd backend-api
   ```

3. عدّل كلمة المرور في ملف `update_database.py` (السطر 15)

4. شغّل السكريبت:
   ```bash
   python update_database.py
   ```

### الطريقة 3: استخدام MySQL Command Line

```bash
mysql -u root -p AlomranReportsDB < update_operation_accounts_manual.sql
```

## التحقق من النجاح

بعد تنفيذ السكريبت، تحقق من أن الأعمدة موجودة:

```sql
DESCRIBE operation_accounts;
```

يجب أن ترى الأعمدة الجديدة:
- `is_sales_manager`
- `is_operation_manager`
- `is_branch_account`
- `is_backdoor`
- `is_active`

## بعد التحديث

أعد تشغيل السيرفر:
```bash
run.bat
```

---

**ملف SQL الكامل:** `backend-api/update_operation_accounts_manual.sql`







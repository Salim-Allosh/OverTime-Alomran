# 📋 تعليمات تحديث جدول operation_accounts في phpMyAdmin

## ⚠️ المشكلة
قاعدة البيانات لا تحتوي على الأعمدة الجديدة المطلوبة للنظام:
- `is_sales_manager`
- `is_operation_manager`
- `is_branch_account`
- `is_backdoor`
- `is_active`

## ✅ الحل: إضافة الأعمدة يدوياً في phpMyAdmin

### الخطوة 1: فتح phpMyAdmin
1. افتح المتصفح واذهب إلى: `http://localhost/phpmyadmin`
2. سجّل الدخول (عادة username: `root` بدون كلمة مرور)

### الخطوة 2: اختيار قاعدة البيانات
1. من القائمة الجانبية اليسرى، انقر على: **`AlomranReportsDB`**
2. ستظهر جميع الجداول في القاعدة

### الخطوة 3: فتح جدول operation_accounts
1. انقر على جدول **`operation_accounts`** من قائمة الجداول
2. ستفتح صفحة تفاصيل الجدول

### الخطوة 4: تنفيذ سكريبت SQL
1. انقر على تبويب **"SQL"** في الأعلى (أو **"SQL"** في شريط الأدوات)
2. ستفتح نافذة لإدخال أوامر SQL

### الخطوة 5: نسخ ولصق السكريبت
انسخ **كل** السكريبت التالي والصقه في نافذة SQL:

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

### الخطوة 6: تنفيذ السكريبت
1. انقر على زر **"Go"** أو **"تنفيذ"** في الأسفل
2. انتظر حتى تظهر رسالة النجاح

### الخطوة 7: التحقق من النجاح
بعد التنفيذ، يجب أن ترى رسالة مثل:
```
5 rows affected
```

أو إذا كان بعض الأعمدة موجودة بالفعل، قد ترى:
```
Duplicate column name 'is_sales_manager'
```
**لا تقلق!** هذا يعني أن العمود موجود بالفعل ويمكنك المتابعة.

### الخطوة 8: التحقق من الأعمدة
1. انقر على تبويب **"Structure"** أو **"الهيكل"**
2. تحقق من وجود الأعمدة التالية:
   - ✅ `is_sales_manager`
   - ✅ `is_operation_manager`
   - ✅ `is_branch_account`
   - ✅ `is_backdoor`
   - ✅ `is_active`

## 🎯 بعد التحديث

1. **أعد تشغيل السيرفر:**
   - أوقف السيرفر (Ctrl+C)
   - شغّل `run.bat` مرة أخرى

2. **جرّب تسجيل الدخول:**
   - يجب أن يعمل الآن بدون أخطاء

## ❓ حل المشاكل

### المشكلة: "Duplicate column name"
**الحل:** هذا طبيعي! يعني أن العمود موجود بالفعل. تابع باقي الأوامر.

### المشكلة: "Table doesn't exist"
**الحل:** تأكد من أنك اخترت قاعدة البيانات `AlomranReportsDB` الصحيحة.

### المشكلة: "Access denied"
**الحل:** تأكد من أنك سجّلت الدخول إلى phpMyAdmin بشكل صحيح.

## 📸 صورة توضيحية للخطوات

```
phpMyAdmin → AlomranReportsDB → operation_accounts → SQL Tab → Paste Script → Go
```

---

**ملاحظة مهمة:** 
- إذا فشل السكريبت كاملاً، نفّذ كل أمر SQL على حدة
- ابدأ بالأول (`is_sales_manager`) ثم الثاني وهكذا
- إذا ظهر خطأ "Duplicate column name" لأي عمود، تخطّه وانتقل للآخر

---

**تاريخ الإنشاء:** 22 ديسمبر 2025
**الملف الأصلي:** `backend-api/update_operation_accounts_manual.sql`




## ⚠️ المشكلة
قاعدة البيانات لا تحتوي على الأعمدة الجديدة المطلوبة للنظام:
- `is_sales_manager`
- `is_operation_manager`
- `is_branch_account`
- `is_backdoor`
- `is_active`

## ✅ الحل: إضافة الأعمدة يدوياً في phpMyAdmin

### الخطوة 1: فتح phpMyAdmin
1. افتح المتصفح واذهب إلى: `http://localhost/phpmyadmin`
2. سجّل الدخول (عادة username: `root` بدون كلمة مرور)

### الخطوة 2: اختيار قاعدة البيانات
1. من القائمة الجانبية اليسرى، انقر على: **`AlomranReportsDB`**
2. ستظهر جميع الجداول في القاعدة

### الخطوة 3: فتح جدول operation_accounts
1. انقر على جدول **`operation_accounts`** من قائمة الجداول
2. ستفتح صفحة تفاصيل الجدول

### الخطوة 4: تنفيذ سكريبت SQL
1. انقر على تبويب **"SQL"** في الأعلى (أو **"SQL"** في شريط الأدوات)
2. ستفتح نافذة لإدخال أوامر SQL

### الخطوة 5: نسخ ولصق السكريبت
انسخ **كل** السكريبت التالي والصقه في نافذة SQL:

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

### الخطوة 6: تنفيذ السكريبت
1. انقر على زر **"Go"** أو **"تنفيذ"** في الأسفل
2. انتظر حتى تظهر رسالة النجاح

### الخطوة 7: التحقق من النجاح
بعد التنفيذ، يجب أن ترى رسالة مثل:
```
5 rows affected
```

أو إذا كان بعض الأعمدة موجودة بالفعل، قد ترى:
```
Duplicate column name 'is_sales_manager'
```
**لا تقلق!** هذا يعني أن العمود موجود بالفعل ويمكنك المتابعة.

### الخطوة 8: التحقق من الأعمدة
1. انقر على تبويب **"Structure"** أو **"الهيكل"**
2. تحقق من وجود الأعمدة التالية:
   - ✅ `is_sales_manager`
   - ✅ `is_operation_manager`
   - ✅ `is_branch_account`
   - ✅ `is_backdoor`
   - ✅ `is_active`

## 🎯 بعد التحديث

1. **أعد تشغيل السيرفر:**
   - أوقف السيرفر (Ctrl+C)
   - شغّل `run.bat` مرة أخرى

2. **جرّب تسجيل الدخول:**
   - يجب أن يعمل الآن بدون أخطاء

## ❓ حل المشاكل

### المشكلة: "Duplicate column name"
**الحل:** هذا طبيعي! يعني أن العمود موجود بالفعل. تابع باقي الأوامر.

### المشكلة: "Table doesn't exist"
**الحل:** تأكد من أنك اخترت قاعدة البيانات `AlomranReportsDB` الصحيحة.

### المشكلة: "Access denied"
**الحل:** تأكد من أنك سجّلت الدخول إلى phpMyAdmin بشكل صحيح.

## 📸 صورة توضيحية للخطوات

```
phpMyAdmin → AlomranReportsDB → operation_accounts → SQL Tab → Paste Script → Go
```

---

**ملاحظة مهمة:** 
- إذا فشل السكريبت كاملاً، نفّذ كل أمر SQL على حدة
- ابدأ بالأول (`is_sales_manager`) ثم الثاني وهكذا
- إذا ظهر خطأ "Duplicate column name" لأي عمود، تخطّه وانتقل للآخر

---

**تاريخ الإنشاء:** 22 ديسمبر 2025
**الملف الأصلي:** `backend-api/update_operation_accounts_manual.sql`




## ⚠️ المشكلة
قاعدة البيانات لا تحتوي على الأعمدة الجديدة المطلوبة للنظام:
- `is_sales_manager`
- `is_operation_manager`
- `is_branch_account`
- `is_backdoor`
- `is_active`

## ✅ الحل: إضافة الأعمدة يدوياً في phpMyAdmin

### الخطوة 1: فتح phpMyAdmin
1. افتح المتصفح واذهب إلى: `http://localhost/phpmyadmin`
2. سجّل الدخول (عادة username: `root` بدون كلمة مرور)

### الخطوة 2: اختيار قاعدة البيانات
1. من القائمة الجانبية اليسرى، انقر على: **`AlomranReportsDB`**
2. ستظهر جميع الجداول في القاعدة

### الخطوة 3: فتح جدول operation_accounts
1. انقر على جدول **`operation_accounts`** من قائمة الجداول
2. ستفتح صفحة تفاصيل الجدول

### الخطوة 4: تنفيذ سكريبت SQL
1. انقر على تبويب **"SQL"** في الأعلى (أو **"SQL"** في شريط الأدوات)
2. ستفتح نافذة لإدخال أوامر SQL

### الخطوة 5: نسخ ولصق السكريبت
انسخ **كل** السكريبت التالي والصقه في نافذة SQL:

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

### الخطوة 6: تنفيذ السكريبت
1. انقر على زر **"Go"** أو **"تنفيذ"** في الأسفل
2. انتظر حتى تظهر رسالة النجاح

### الخطوة 7: التحقق من النجاح
بعد التنفيذ، يجب أن ترى رسالة مثل:
```
5 rows affected
```

أو إذا كان بعض الأعمدة موجودة بالفعل، قد ترى:
```
Duplicate column name 'is_sales_manager'
```
**لا تقلق!** هذا يعني أن العمود موجود بالفعل ويمكنك المتابعة.

### الخطوة 8: التحقق من الأعمدة
1. انقر على تبويب **"Structure"** أو **"الهيكل"**
2. تحقق من وجود الأعمدة التالية:
   - ✅ `is_sales_manager`
   - ✅ `is_operation_manager`
   - ✅ `is_branch_account`
   - ✅ `is_backdoor`
   - ✅ `is_active`

## 🎯 بعد التحديث

1. **أعد تشغيل السيرفر:**
   - أوقف السيرفر (Ctrl+C)
   - شغّل `run.bat` مرة أخرى

2. **جرّب تسجيل الدخول:**
   - يجب أن يعمل الآن بدون أخطاء

## ❓ حل المشاكل

### المشكلة: "Duplicate column name"
**الحل:** هذا طبيعي! يعني أن العمود موجود بالفعل. تابع باقي الأوامر.

### المشكلة: "Table doesn't exist"
**الحل:** تأكد من أنك اخترت قاعدة البيانات `AlomranReportsDB` الصحيحة.

### المشكلة: "Access denied"
**الحل:** تأكد من أنك سجّلت الدخول إلى phpMyAdmin بشكل صحيح.

## 📸 صورة توضيحية للخطوات

```
phpMyAdmin → AlomranReportsDB → operation_accounts → SQL Tab → Paste Script → Go
```

---

**ملاحظة مهمة:** 
- إذا فشل السكريبت كاملاً، نفّذ كل أمر SQL على حدة
- ابدأ بالأول (`is_sales_manager`) ثم الثاني وهكذا
- إذا ظهر خطأ "Duplicate column name" لأي عمود، تخطّه وانتقل للآخر

---

**تاريخ الإنشاء:** 22 ديسمبر 2025
**الملف الأصلي:** `backend-api/update_operation_accounts_manual.sql`




## ⚠️ المشكلة
قاعدة البيانات لا تحتوي على الأعمدة الجديدة المطلوبة للنظام:
- `is_sales_manager`
- `is_operation_manager`
- `is_branch_account`
- `is_backdoor`
- `is_active`

## ✅ الحل: إضافة الأعمدة يدوياً في phpMyAdmin

### الخطوة 1: فتح phpMyAdmin
1. افتح المتصفح واذهب إلى: `http://localhost/phpmyadmin`
2. سجّل الدخول (عادة username: `root` بدون كلمة مرور)

### الخطوة 2: اختيار قاعدة البيانات
1. من القائمة الجانبية اليسرى، انقر على: **`AlomranReportsDB`**
2. ستظهر جميع الجداول في القاعدة

### الخطوة 3: فتح جدول operation_accounts
1. انقر على جدول **`operation_accounts`** من قائمة الجداول
2. ستفتح صفحة تفاصيل الجدول

### الخطوة 4: تنفيذ سكريبت SQL
1. انقر على تبويب **"SQL"** في الأعلى (أو **"SQL"** في شريط الأدوات)
2. ستفتح نافذة لإدخال أوامر SQL

### الخطوة 5: نسخ ولصق السكريبت
انسخ **كل** السكريبت التالي والصقه في نافذة SQL:

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

### الخطوة 6: تنفيذ السكريبت
1. انقر على زر **"Go"** أو **"تنفيذ"** في الأسفل
2. انتظر حتى تظهر رسالة النجاح

### الخطوة 7: التحقق من النجاح
بعد التنفيذ، يجب أن ترى رسالة مثل:
```
5 rows affected
```

أو إذا كان بعض الأعمدة موجودة بالفعل، قد ترى:
```
Duplicate column name 'is_sales_manager'
```
**لا تقلق!** هذا يعني أن العمود موجود بالفعل ويمكنك المتابعة.

### الخطوة 8: التحقق من الأعمدة
1. انقر على تبويب **"Structure"** أو **"الهيكل"**
2. تحقق من وجود الأعمدة التالية:
   - ✅ `is_sales_manager`
   - ✅ `is_operation_manager`
   - ✅ `is_branch_account`
   - ✅ `is_backdoor`
   - ✅ `is_active`

## 🎯 بعد التحديث

1. **أعد تشغيل السيرفر:**
   - أوقف السيرفر (Ctrl+C)
   - شغّل `run.bat` مرة أخرى

2. **جرّب تسجيل الدخول:**
   - يجب أن يعمل الآن بدون أخطاء

## ❓ حل المشاكل

### المشكلة: "Duplicate column name"
**الحل:** هذا طبيعي! يعني أن العمود موجود بالفعل. تابع باقي الأوامر.

### المشكلة: "Table doesn't exist"
**الحل:** تأكد من أنك اخترت قاعدة البيانات `AlomranReportsDB` الصحيحة.

### المشكلة: "Access denied"
**الحل:** تأكد من أنك سجّلت الدخول إلى phpMyAdmin بشكل صحيح.

## 📸 صورة توضيحية للخطوات

```
phpMyAdmin → AlomranReportsDB → operation_accounts → SQL Tab → Paste Script → Go
```

---

**ملاحظة مهمة:** 
- إذا فشل السكريبت كاملاً، نفّذ كل أمر SQL على حدة
- ابدأ بالأول (`is_sales_manager`) ثم الثاني وهكذا
- إذا ظهر خطأ "Duplicate column name" لأي عمود، تخطّه وانتقل للآخر

---

**تاريخ الإنشاء:** 22 ديسمبر 2025
**الملف الأصلي:** `backend-api/update_operation_accounts_manual.sql`






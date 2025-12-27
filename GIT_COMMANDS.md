# أوامر Git الأساسية للمشروع

## 📋 الأوامر اليومية

### عند إجراء تغييرات جديدة:

```bash
# 1. عرض التغييرات
git status

# 2. إضافة جميع التغييرات
git add .

# 3. حفظ التغييرات مع رسالة وصفية
git commit -m "وصف التغييرات - مثال: إضافة ميزة جديدة للعقود"

# 4. رفع التغييرات إلى GitHub
git push
```

### عند سحب التحديثات من GitHub:

```bash
git pull
```

## 🔍 أوامر مفيدة

### عرض التاريخ:
```bash
git log --oneline -10    # آخر 10 commits
git log --graph --oneline --all    # عرض بياني للفروع
```

### عرض التغييرات:
```bash
git diff                    # التغييرات غير المحفوظة
git diff --staged           # التغييرات المحفوظة
```

### إلغاء التغييرات:
```bash
git restore <file>          # إلغاء تغييرات ملف معين
git restore .                # إلغاء جميع التغييرات غير المحفوظة
```

### معلومات المشروع:
```bash
git remote -v               # عرض روابط GitHub
git branch                  # عرض الفروع
git status                  # حالة المشروع
```

## 📝 أمثلة على رسائل Commit

```bash
git commit -m "إضافة صفحة العقود والتقارير اليومية"
git commit -m "إصلاح مشكلة تسجيل الدخول"
git commit -m "تحديث واجهة المستخدم"
git commit -m "إضافة API endpoints للعقود"
git commit -m "تحسين الأداء"
```

## ⚠️ نصائح مهمة

1. **احفظ التغييرات دائماً**: استخدم `git add .` و `git commit` قبل `git push`
2. **اكتب رسائل واضحة**: اشرح ما تم تغييره في رسالة commit
3. **اعمل pull قبل push**: إذا كان هناك عدة أشخاص يعملون على المشروع
4. **لا ترفع ملفات حساسة**: تأكد من وجود `.gitignore`

## 🔗 رابط المشروع على GitHub

https://github.com/Salim-Allosh/OverTime-Alomran

---

**تم إعداد Git بنجاح! 🎉**




## 📋 الأوامر اليومية

### عند إجراء تغييرات جديدة:

```bash
# 1. عرض التغييرات
git status

# 2. إضافة جميع التغييرات
git add .

# 3. حفظ التغييرات مع رسالة وصفية
git commit -m "وصف التغييرات - مثال: إضافة ميزة جديدة للعقود"

# 4. رفع التغييرات إلى GitHub
git push
```

### عند سحب التحديثات من GitHub:

```bash
git pull
```

## 🔍 أوامر مفيدة

### عرض التاريخ:
```bash
git log --oneline -10    # آخر 10 commits
git log --graph --oneline --all    # عرض بياني للفروع
```

### عرض التغييرات:
```bash
git diff                    # التغييرات غير المحفوظة
git diff --staged           # التغييرات المحفوظة
```

### إلغاء التغييرات:
```bash
git restore <file>          # إلغاء تغييرات ملف معين
git restore .                # إلغاء جميع التغييرات غير المحفوظة
```

### معلومات المشروع:
```bash
git remote -v               # عرض روابط GitHub
git branch                  # عرض الفروع
git status                  # حالة المشروع
```

## 📝 أمثلة على رسائل Commit

```bash
git commit -m "إضافة صفحة العقود والتقارير اليومية"
git commit -m "إصلاح مشكلة تسجيل الدخول"
git commit -m "تحديث واجهة المستخدم"
git commit -m "إضافة API endpoints للعقود"
git commit -m "تحسين الأداء"
```

## ⚠️ نصائح مهمة

1. **احفظ التغييرات دائماً**: استخدم `git add .` و `git commit` قبل `git push`
2. **اكتب رسائل واضحة**: اشرح ما تم تغييره في رسالة commit
3. **اعمل pull قبل push**: إذا كان هناك عدة أشخاص يعملون على المشروع
4. **لا ترفع ملفات حساسة**: تأكد من وجود `.gitignore`

## 🔗 رابط المشروع على GitHub

https://github.com/Salim-Allosh/OverTime-Alomran

---

**تم إعداد Git بنجاح! 🎉**




## 📋 الأوامر اليومية

### عند إجراء تغييرات جديدة:

```bash
# 1. عرض التغييرات
git status

# 2. إضافة جميع التغييرات
git add .

# 3. حفظ التغييرات مع رسالة وصفية
git commit -m "وصف التغييرات - مثال: إضافة ميزة جديدة للعقود"

# 4. رفع التغييرات إلى GitHub
git push
```

### عند سحب التحديثات من GitHub:

```bash
git pull
```

## 🔍 أوامر مفيدة

### عرض التاريخ:
```bash
git log --oneline -10    # آخر 10 commits
git log --graph --oneline --all    # عرض بياني للفروع
```

### عرض التغييرات:
```bash
git diff                    # التغييرات غير المحفوظة
git diff --staged           # التغييرات المحفوظة
```

### إلغاء التغييرات:
```bash
git restore <file>          # إلغاء تغييرات ملف معين
git restore .                # إلغاء جميع التغييرات غير المحفوظة
```

### معلومات المشروع:
```bash
git remote -v               # عرض روابط GitHub
git branch                  # عرض الفروع
git status                  # حالة المشروع
```

## 📝 أمثلة على رسائل Commit

```bash
git commit -m "إضافة صفحة العقود والتقارير اليومية"
git commit -m "إصلاح مشكلة تسجيل الدخول"
git commit -m "تحديث واجهة المستخدم"
git commit -m "إضافة API endpoints للعقود"
git commit -m "تحسين الأداء"
```

## ⚠️ نصائح مهمة

1. **احفظ التغييرات دائماً**: استخدم `git add .` و `git commit` قبل `git push`
2. **اكتب رسائل واضحة**: اشرح ما تم تغييره في رسالة commit
3. **اعمل pull قبل push**: إذا كان هناك عدة أشخاص يعملون على المشروع
4. **لا ترفع ملفات حساسة**: تأكد من وجود `.gitignore`

## 🔗 رابط المشروع على GitHub

https://github.com/Salim-Allosh/OverTime-Alomran

---

**تم إعداد Git بنجاح! 🎉**




## 📋 الأوامر اليومية

### عند إجراء تغييرات جديدة:

```bash
# 1. عرض التغييرات
git status

# 2. إضافة جميع التغييرات
git add .

# 3. حفظ التغييرات مع رسالة وصفية
git commit -m "وصف التغييرات - مثال: إضافة ميزة جديدة للعقود"

# 4. رفع التغييرات إلى GitHub
git push
```

### عند سحب التحديثات من GitHub:

```bash
git pull
```

## 🔍 أوامر مفيدة

### عرض التاريخ:
```bash
git log --oneline -10    # آخر 10 commits
git log --graph --oneline --all    # عرض بياني للفروع
```

### عرض التغييرات:
```bash
git diff                    # التغييرات غير المحفوظة
git diff --staged           # التغييرات المحفوظة
```

### إلغاء التغييرات:
```bash
git restore <file>          # إلغاء تغييرات ملف معين
git restore .                # إلغاء جميع التغييرات غير المحفوظة
```

### معلومات المشروع:
```bash
git remote -v               # عرض روابط GitHub
git branch                  # عرض الفروع
git status                  # حالة المشروع
```

## 📝 أمثلة على رسائل Commit

```bash
git commit -m "إضافة صفحة العقود والتقارير اليومية"
git commit -m "إصلاح مشكلة تسجيل الدخول"
git commit -m "تحديث واجهة المستخدم"
git commit -m "إضافة API endpoints للعقود"
git commit -m "تحسين الأداء"
```

## ⚠️ نصائح مهمة

1. **احفظ التغييرات دائماً**: استخدم `git add .` و `git commit` قبل `git push`
2. **اكتب رسائل واضحة**: اشرح ما تم تغييره في رسالة commit
3. **اعمل pull قبل push**: إذا كان هناك عدة أشخاص يعملون على المشروع
4. **لا ترفع ملفات حساسة**: تأكد من وجود `.gitignore`

## 🔗 رابط المشروع على GitHub

https://github.com/Salim-Allosh/OverTime-Alomran

---

**تم إعداد Git بنجاح! 🎉**







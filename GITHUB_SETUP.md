# إرشادات ربط المشروع بـ GitHub

## الخطوات المطلوبة

### 1. إنشاء Repository جديد على GitHub

1. اذهب إلى [GitHub.com](https://github.com)
2. اضغط على زر **"New"** أو **"+"** في الأعلى
3. اختر **"New repository"**
4. املأ التفاصيل:
   - **Repository name**: `OverTime-Alomran` (أو أي اسم تفضله)
   - **Description**: "نظام إدارة الوقت الإضافي - مركز العمران للتدريب والتطوير"
   - **Visibility**: اختر Private (خاص) أو Public (عام)
   - **لا** تضع علامة على "Initialize with README" (لأننا لدينا ملفات بالفعل)
5. اضغط **"Create repository"**

### 2. ربط المشروع المحلي بـ GitHub

بعد إنشاء الـ Repository، سيعرض GitHub الأوامر التالية. استخدم هذه الأوامر:

```bash
# إضافة Remote Repository
git remote add origin https://github.com/YOUR_USERNAME/OverTime-Alomran.git

# أو إذا كنت تستخدم SSH:
git remote add origin git@github.com:YOUR_USERNAME/OverTime-Alomran.git

# رفع الكود إلى GitHub
git branch -M main
git push -u origin main
```

### 3. الأوامر الكاملة (نسخ ولصق)

**استبدل `YOUR_USERNAME` باسم المستخدم الخاص بك على GitHub:**

```bash
# إضافة Remote
git remote add origin https://github.com/YOUR_USERNAME/OverTime-Alomran.git

# تغيير اسم الفرع إلى main
git branch -M main

# رفع الكود
git push -u origin main
```

### 4. التحقق من الربط

```bash
# التحقق من Remote
git remote -v

# يجب أن ترى:
# origin  https://github.com/YOUR_USERNAME/OverTime-Alomran.git (fetch)
# origin  https://github.com/YOUR_USERNAME/OverTime-Alomran.git (push)
```

## الأوامر المستقبلية

### عند إجراء تغييرات:

```bash
# إضافة التغييرات
git add .

# حفظ التغييرات
git commit -m "وصف التغييرات"

# رفع التغييرات إلى GitHub
git push
```

### عند سحب التحديثات:

```bash
git pull
```

## نصائح مهمة

1. **احفظ التغييرات دائماً**: استخدم `git add .` و `git commit` قبل `git push`
2. **اكتب رسائل commit واضحة**: اشرح ما تم تغييره
3. **لا ترفع ملفات حساسة**: تأكد من وجود `.gitignore` لحماية المعلومات الحساسة
4. **اعمل pull قبل push**: إذا كان هناك عدة أشخاص يعملون على المشروع

## استكشاف الأخطاء

### خطأ: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/OverTime-Alomran.git
```

### خطأ: "failed to push"
- تأكد من تسجيل الدخول إلى GitHub
- تحقق من صلاحيات الوصول إلى الـ Repository

### خطأ: "authentication failed"
- استخدم Personal Access Token بدلاً من كلمة المرور
- أو استخدم SSH keys

---

**تم إعداد المشروع بنجاح! 🎉**




## الخطوات المطلوبة

### 1. إنشاء Repository جديد على GitHub

1. اذهب إلى [GitHub.com](https://github.com)
2. اضغط على زر **"New"** أو **"+"** في الأعلى
3. اختر **"New repository"**
4. املأ التفاصيل:
   - **Repository name**: `OverTime-Alomran` (أو أي اسم تفضله)
   - **Description**: "نظام إدارة الوقت الإضافي - مركز العمران للتدريب والتطوير"
   - **Visibility**: اختر Private (خاص) أو Public (عام)
   - **لا** تضع علامة على "Initialize with README" (لأننا لدينا ملفات بالفعل)
5. اضغط **"Create repository"**

### 2. ربط المشروع المحلي بـ GitHub

بعد إنشاء الـ Repository، سيعرض GitHub الأوامر التالية. استخدم هذه الأوامر:

```bash
# إضافة Remote Repository
git remote add origin https://github.com/YOUR_USERNAME/OverTime-Alomran.git

# أو إذا كنت تستخدم SSH:
git remote add origin git@github.com:YOUR_USERNAME/OverTime-Alomran.git

# رفع الكود إلى GitHub
git branch -M main
git push -u origin main
```

### 3. الأوامر الكاملة (نسخ ولصق)

**استبدل `YOUR_USERNAME` باسم المستخدم الخاص بك على GitHub:**

```bash
# إضافة Remote
git remote add origin https://github.com/YOUR_USERNAME/OverTime-Alomran.git

# تغيير اسم الفرع إلى main
git branch -M main

# رفع الكود
git push -u origin main
```

### 4. التحقق من الربط

```bash
# التحقق من Remote
git remote -v

# يجب أن ترى:
# origin  https://github.com/YOUR_USERNAME/OverTime-Alomran.git (fetch)
# origin  https://github.com/YOUR_USERNAME/OverTime-Alomran.git (push)
```

## الأوامر المستقبلية

### عند إجراء تغييرات:

```bash
# إضافة التغييرات
git add .

# حفظ التغييرات
git commit -m "وصف التغييرات"

# رفع التغييرات إلى GitHub
git push
```

### عند سحب التحديثات:

```bash
git pull
```

## نصائح مهمة

1. **احفظ التغييرات دائماً**: استخدم `git add .` و `git commit` قبل `git push`
2. **اكتب رسائل commit واضحة**: اشرح ما تم تغييره
3. **لا ترفع ملفات حساسة**: تأكد من وجود `.gitignore` لحماية المعلومات الحساسة
4. **اعمل pull قبل push**: إذا كان هناك عدة أشخاص يعملون على المشروع

## استكشاف الأخطاء

### خطأ: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/OverTime-Alomran.git
```

### خطأ: "failed to push"
- تأكد من تسجيل الدخول إلى GitHub
- تحقق من صلاحيات الوصول إلى الـ Repository

### خطأ: "authentication failed"
- استخدم Personal Access Token بدلاً من كلمة المرور
- أو استخدم SSH keys

---

**تم إعداد المشروع بنجاح! 🎉**




## الخطوات المطلوبة

### 1. إنشاء Repository جديد على GitHub

1. اذهب إلى [GitHub.com](https://github.com)
2. اضغط على زر **"New"** أو **"+"** في الأعلى
3. اختر **"New repository"**
4. املأ التفاصيل:
   - **Repository name**: `OverTime-Alomran` (أو أي اسم تفضله)
   - **Description**: "نظام إدارة الوقت الإضافي - مركز العمران للتدريب والتطوير"
   - **Visibility**: اختر Private (خاص) أو Public (عام)
   - **لا** تضع علامة على "Initialize with README" (لأننا لدينا ملفات بالفعل)
5. اضغط **"Create repository"**

### 2. ربط المشروع المحلي بـ GitHub

بعد إنشاء الـ Repository، سيعرض GitHub الأوامر التالية. استخدم هذه الأوامر:

```bash
# إضافة Remote Repository
git remote add origin https://github.com/YOUR_USERNAME/OverTime-Alomran.git

# أو إذا كنت تستخدم SSH:
git remote add origin git@github.com:YOUR_USERNAME/OverTime-Alomran.git

# رفع الكود إلى GitHub
git branch -M main
git push -u origin main
```

### 3. الأوامر الكاملة (نسخ ولصق)

**استبدل `YOUR_USERNAME` باسم المستخدم الخاص بك على GitHub:**

```bash
# إضافة Remote
git remote add origin https://github.com/YOUR_USERNAME/OverTime-Alomran.git

# تغيير اسم الفرع إلى main
git branch -M main

# رفع الكود
git push -u origin main
```

### 4. التحقق من الربط

```bash
# التحقق من Remote
git remote -v

# يجب أن ترى:
# origin  https://github.com/YOUR_USERNAME/OverTime-Alomran.git (fetch)
# origin  https://github.com/YOUR_USERNAME/OverTime-Alomran.git (push)
```

## الأوامر المستقبلية

### عند إجراء تغييرات:

```bash
# إضافة التغييرات
git add .

# حفظ التغييرات
git commit -m "وصف التغييرات"

# رفع التغييرات إلى GitHub
git push
```

### عند سحب التحديثات:

```bash
git pull
```

## نصائح مهمة

1. **احفظ التغييرات دائماً**: استخدم `git add .` و `git commit` قبل `git push`
2. **اكتب رسائل commit واضحة**: اشرح ما تم تغييره
3. **لا ترفع ملفات حساسة**: تأكد من وجود `.gitignore` لحماية المعلومات الحساسة
4. **اعمل pull قبل push**: إذا كان هناك عدة أشخاص يعملون على المشروع

## استكشاف الأخطاء

### خطأ: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/OverTime-Alomran.git
```

### خطأ: "failed to push"
- تأكد من تسجيل الدخول إلى GitHub
- تحقق من صلاحيات الوصول إلى الـ Repository

### خطأ: "authentication failed"
- استخدم Personal Access Token بدلاً من كلمة المرور
- أو استخدم SSH keys

---

**تم إعداد المشروع بنجاح! 🎉**




## الخطوات المطلوبة

### 1. إنشاء Repository جديد على GitHub

1. اذهب إلى [GitHub.com](https://github.com)
2. اضغط على زر **"New"** أو **"+"** في الأعلى
3. اختر **"New repository"**
4. املأ التفاصيل:
   - **Repository name**: `OverTime-Alomran` (أو أي اسم تفضله)
   - **Description**: "نظام إدارة الوقت الإضافي - مركز العمران للتدريب والتطوير"
   - **Visibility**: اختر Private (خاص) أو Public (عام)
   - **لا** تضع علامة على "Initialize with README" (لأننا لدينا ملفات بالفعل)
5. اضغط **"Create repository"**

### 2. ربط المشروع المحلي بـ GitHub

بعد إنشاء الـ Repository، سيعرض GitHub الأوامر التالية. استخدم هذه الأوامر:

```bash
# إضافة Remote Repository
git remote add origin https://github.com/YOUR_USERNAME/OverTime-Alomran.git

# أو إذا كنت تستخدم SSH:
git remote add origin git@github.com:YOUR_USERNAME/OverTime-Alomran.git

# رفع الكود إلى GitHub
git branch -M main
git push -u origin main
```

### 3. الأوامر الكاملة (نسخ ولصق)

**استبدل `YOUR_USERNAME` باسم المستخدم الخاص بك على GitHub:**

```bash
# إضافة Remote
git remote add origin https://github.com/YOUR_USERNAME/OverTime-Alomran.git

# تغيير اسم الفرع إلى main
git branch -M main

# رفع الكود
git push -u origin main
```

### 4. التحقق من الربط

```bash
# التحقق من Remote
git remote -v

# يجب أن ترى:
# origin  https://github.com/YOUR_USERNAME/OverTime-Alomran.git (fetch)
# origin  https://github.com/YOUR_USERNAME/OverTime-Alomran.git (push)
```

## الأوامر المستقبلية

### عند إجراء تغييرات:

```bash
# إضافة التغييرات
git add .

# حفظ التغييرات
git commit -m "وصف التغييرات"

# رفع التغييرات إلى GitHub
git push
```

### عند سحب التحديثات:

```bash
git pull
```

## نصائح مهمة

1. **احفظ التغييرات دائماً**: استخدم `git add .` و `git commit` قبل `git push`
2. **اكتب رسائل commit واضحة**: اشرح ما تم تغييره
3. **لا ترفع ملفات حساسة**: تأكد من وجود `.gitignore` لحماية المعلومات الحساسة
4. **اعمل pull قبل push**: إذا كان هناك عدة أشخاص يعملون على المشروع

## استكشاف الأخطاء

### خطأ: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/OverTime-Alomran.git
```

### خطأ: "failed to push"
- تأكد من تسجيل الدخول إلى GitHub
- تحقق من صلاحيات الوصول إلى الـ Repository

### خطأ: "authentication failed"
- استخدم Personal Access Token بدلاً من كلمة المرور
- أو استخدم SSH keys

---

**تم إعداد المشروع بنجاح! 🎉**







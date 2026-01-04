@echo off
chcp 65001 >nul
echo ========================================
echo   ربط المشروع بـ GitHub
echo ========================================
echo.

echo الخطوة 1: إنشاء Repository جديد على GitHub
echo.
echo 1. اذهب إلى https://github.com
echo 2. اضغط على زر "New" أو "+" في الأعلى
echo 3. اختر "New repository"
echo 4. املأ التفاصيل:
echo    - Repository name: OverTime-Alomran
echo    - Description: نظام إدارة الوقت الإضافي - مركز العمران
echo    - Visibility: Private أو Public
echo    - لا تضع علامة على "Initialize with README"
echo 5. اضغط "Create repository"
echo.
pause

echo.
echo الخطوة 2: أدخل رابط الـ Repository
echo مثال: https://github.com/YOUR_USERNAME/OverTime-Alomran.git
set /p REPO_URL="أدخل رابط الـ Repository: "

if "%REO_URL%"=="" (
    echo خطأ: يجب إدخال رابط الـ Repository
    pause
    exit /b 1
)

echo.
echo الخطوة 3: ربط المشروع بـ GitHub...
git remote add origin %REPO_URL%
if errorlevel 1 (
    echo تحذير: قد يكون الـ remote موجود بالفعل
    git remote set-url origin %REPO_URL%
)

echo.
echo الخطوة 4: تغيير اسم الفرع إلى main...
git branch -M main

echo.
echo الخطوة 5: رفع الكود إلى GitHub...
echo قد يطلب منك تسجيل الدخول إلى GitHub
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo   حدث خطأ أثناء الرفع
    echo ========================================
    echo.
    echo الأسباب المحتملة:
    echo 1. لم تقم بإنشاء الـ Repository على GitHub بعد
    echo 2. مشكلة في المصادقة (Authentication)
    echo 3. لا تملك صلاحيات الوصول
    echo.
    echo الحلول:
    echo - تأكد من إنشاء الـ Repository على GitHub
    echo - استخدم Personal Access Token بدلاً من كلمة المرور
    echo - أو استخدم SSH keys
    echo.
    echo راجع ملف GITHUB_SETUP.md للتفاصيل الكاملة
) else (
    echo.
    echo ========================================
    echo   تم ربط المشروع بـ GitHub بنجاح! ✓
    echo ========================================
    echo.
    echo يمكنك الآن زيارة المشروع على:
    echo %REPO_URL%
)

echo.
pause



chcp 65001 >nul
echo ========================================
echo   ربط المشروع بـ GitHub
echo ========================================
echo.

echo الخطوة 1: إنشاء Repository جديد على GitHub
echo.
echo 1. اذهب إلى https://github.com
echo 2. اضغط على زر "New" أو "+" في الأعلى
echo 3. اختر "New repository"
echo 4. املأ التفاصيل:
echo    - Repository name: OverTime-Alomran
echo    - Description: نظام إدارة الوقت الإضافي - مركز العمران
echo    - Visibility: Private أو Public
echo    - لا تضع علامة على "Initialize with README"
echo 5. اضغط "Create repository"
echo.
pause

echo.
echo الخطوة 2: أدخل رابط الـ Repository
echo مثال: https://github.com/YOUR_USERNAME/OverTime-Alomran.git
set /p REPO_URL="أدخل رابط الـ Repository: "

if "%REO_URL%"=="" (
    echo خطأ: يجب إدخال رابط الـ Repository
    pause
    exit /b 1
)

echo.
echo الخطوة 3: ربط المشروع بـ GitHub...
git remote add origin %REPO_URL%
if errorlevel 1 (
    echo تحذير: قد يكون الـ remote موجود بالفعل
    git remote set-url origin %REPO_URL%
)

echo.
echo الخطوة 4: تغيير اسم الفرع إلى main...
git branch -M main

echo.
echo الخطوة 5: رفع الكود إلى GitHub...
echo قد يطلب منك تسجيل الدخول إلى GitHub
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo   حدث خطأ أثناء الرفع
    echo ========================================
    echo.
    echo الأسباب المحتملة:
    echo 1. لم تقم بإنشاء الـ Repository على GitHub بعد
    echo 2. مشكلة في المصادقة (Authentication)
    echo 3. لا تملك صلاحيات الوصول
    echo.
    echo الحلول:
    echo - تأكد من إنشاء الـ Repository على GitHub
    echo - استخدم Personal Access Token بدلاً من كلمة المرور
    echo - أو استخدم SSH keys
    echo.
    echo راجع ملف GITHUB_SETUP.md للتفاصيل الكاملة
) else (
    echo.
    echo ========================================
    echo   تم ربط المشروع بـ GitHub بنجاح! ✓
    echo ========================================
    echo.
    echo يمكنك الآن زيارة المشروع على:
    echo %REPO_URL%
)

echo.
pause



chcp 65001 >nul
echo ========================================
echo   ربط المشروع بـ GitHub
echo ========================================
echo.

echo الخطوة 1: إنشاء Repository جديد على GitHub
echo.
echo 1. اذهب إلى https://github.com
echo 2. اضغط على زر "New" أو "+" في الأعلى
echo 3. اختر "New repository"
echo 4. املأ التفاصيل:
echo    - Repository name: OverTime-Alomran
echo    - Description: نظام إدارة الوقت الإضافي - مركز العمران
echo    - Visibility: Private أو Public
echo    - لا تضع علامة على "Initialize with README"
echo 5. اضغط "Create repository"
echo.
pause

echo.
echo الخطوة 2: أدخل رابط الـ Repository
echo مثال: https://github.com/YOUR_USERNAME/OverTime-Alomran.git
set /p REPO_URL="أدخل رابط الـ Repository: "

if "%REO_URL%"=="" (
    echo خطأ: يجب إدخال رابط الـ Repository
    pause
    exit /b 1
)

echo.
echo الخطوة 3: ربط المشروع بـ GitHub...
git remote add origin %REPO_URL%
if errorlevel 1 (
    echo تحذير: قد يكون الـ remote موجود بالفعل
    git remote set-url origin %REPO_URL%
)

echo.
echo الخطوة 4: تغيير اسم الفرع إلى main...
git branch -M main

echo.
echo الخطوة 5: رفع الكود إلى GitHub...
echo قد يطلب منك تسجيل الدخول إلى GitHub
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo   حدث خطأ أثناء الرفع
    echo ========================================
    echo.
    echo الأسباب المحتملة:
    echo 1. لم تقم بإنشاء الـ Repository على GitHub بعد
    echo 2. مشكلة في المصادقة (Authentication)
    echo 3. لا تملك صلاحيات الوصول
    echo.
    echo الحلول:
    echo - تأكد من إنشاء الـ Repository على GitHub
    echo - استخدم Personal Access Token بدلاً من كلمة المرور
    echo - أو استخدم SSH keys
    echo.
    echo راجع ملف GITHUB_SETUP.md للتفاصيل الكاملة
) else (
    echo.
    echo ========================================
    echo   تم ربط المشروع بـ GitHub بنجاح! ✓
    echo ========================================
    echo.
    echo يمكنك الآن زيارة المشروع على:
    echo %REPO_URL%
)

echo.
pause



chcp 65001 >nul
echo ========================================
echo   ربط المشروع بـ GitHub
echo ========================================
echo.

echo الخطوة 1: إنشاء Repository جديد على GitHub
echo.
echo 1. اذهب إلى https://github.com
echo 2. اضغط على زر "New" أو "+" في الأعلى
echo 3. اختر "New repository"
echo 4. املأ التفاصيل:
echo    - Repository name: OverTime-Alomran
echo    - Description: نظام إدارة الوقت الإضافي - مركز العمران
echo    - Visibility: Private أو Public
echo    - لا تضع علامة على "Initialize with README"
echo 5. اضغط "Create repository"
echo.
pause

echo.
echo الخطوة 2: أدخل رابط الـ Repository
echo مثال: https://github.com/YOUR_USERNAME/OverTime-Alomran.git
set /p REPO_URL="أدخل رابط الـ Repository: "

if "%REO_URL%"=="" (
    echo خطأ: يجب إدخال رابط الـ Repository
    pause
    exit /b 1
)

echo.
echo الخطوة 3: ربط المشروع بـ GitHub...
git remote add origin %REPO_URL%
if errorlevel 1 (
    echo تحذير: قد يكون الـ remote موجود بالفعل
    git remote set-url origin %REPO_URL%
)

echo.
echo الخطوة 4: تغيير اسم الفرع إلى main...
git branch -M main

echo.
echo الخطوة 5: رفع الكود إلى GitHub...
echo قد يطلب منك تسجيل الدخول إلى GitHub
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo   حدث خطأ أثناء الرفع
    echo ========================================
    echo.
    echo الأسباب المحتملة:
    echo 1. لم تقم بإنشاء الـ Repository على GitHub بعد
    echo 2. مشكلة في المصادقة (Authentication)
    echo 3. لا تملك صلاحيات الوصول
    echo.
    echo الحلول:
    echo - تأكد من إنشاء الـ Repository على GitHub
    echo - استخدم Personal Access Token بدلاً من كلمة المرور
    echo - أو استخدم SSH keys
    echo.
    echo راجع ملف GITHUB_SETUP.md للتفاصيل الكاملة
) else (
    echo.
    echo ========================================
    echo   تم ربط المشروع بـ GitHub بنجاح! ✓
    echo ========================================
    echo.
    echo يمكنك الآن زيارة المشروع على:
    echo %REPO_URL%
)

echo.
pause
















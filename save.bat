@echo off
chcp 65001 >nul
cls
echo ========================================
echo   حفظ ورفع التحديثات إلى GitHub
echo ========================================
echo.

:: التحقق من وجود Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [خطأ] Git غير مثبت على النظام!
    echo يرجى تثبيت Git من: https://git-scm.com/downloads
    pause
    exit /b 1
)

:: التحقق من وجود .git
if not exist ".git" (
    echo [خطأ] هذا المجلد ليس Git repository!
    echo يرجى تشغيل: git init
    pause
    exit /b 1
)

:: التحقق من ربط GitHub
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [تحذير] المشروع غير مربوط بـ GitHub
    echo.
    set /p REPO_URL="أدخل رابط الـ Repository (أو اضغط Enter للتخطي): "
    if not "!REPO_URL!"=="" (
        git remote add origin !REPO_URL!
        if errorlevel 1 (
            git remote set-url origin !REPO_URL!
        )
        git branch -M main 2>nul
        echo ✓ تم ربط المشروع بـ GitHub
        echo.
    ) else (
        echo [تحذير] سيتم حفظ التغييرات محلياً فقط بدون رفع إلى GitHub
        echo.
    )
)

echo [1/4] جاري فحص التغييرات...
git status --short >nul 2>&1
if errorlevel 1 (
    echo [خطأ] حدث خطأ أثناء فحص التغييرات
    pause
    exit /b 1
)

:: عرض التغييرات
echo.
echo التغييرات المكتشفة:
git status --short
echo.

:: التحقق من وجود تغييرات
git diff --quiet --exit-code
if %errorlevel% == 0 (
    git diff --cached --quiet --exit-code
    if %errorlevel% == 0 (
        echo [معلومة] لا توجد تغييرات جديدة لحفظها
        echo.
        goto :check_remote
    )
)

echo [2/4] جاري إضافة جميع التغييرات...
git add .
if errorlevel 1 (
    echo [خطأ] فشل إضافة الملفات
    pause
    exit /b 1
)
echo ✓ تم إضافة جميع الملفات
echo.

:: إنشاء رسالة commit تلقائية
set "COMMIT_MSG=تحديث تلقائي - %date% %time%"
set "COMMIT_MSG=!COMMIT_MSG: =!"

:: محاولة إنشاء رسالة أفضل بناءً على التغييرات
for /f "tokens=*" %%i in ('git diff --cached --name-only') do (
    set "FILE_NAME=%%i"
    if "!FILE_NAME:frontend=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث واجهة المستخدم - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:backend=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث Backend API - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:contracts=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث نظام العقود - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:daily-reports=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث التقارير اليومية - %date%"
        goto :commit_done
    )
)

:commit_done
echo [3/4] جاري حفظ التغييرات...
git commit -m "!COMMIT_MSG!"
if errorlevel 1 (
    echo [تحذير] لا توجد تغييرات جديدة لحفظها أو حدث خطأ
    echo.
    goto :check_remote
)
echo ✓ تم حفظ التغييرات بنجاح
echo.

:check_remote
:: التحقق من وجود remote
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [معلومة] المشروع غير مربوط بـ GitHub
    echo التغييرات محفوظة محلياً فقط
    echo.
    goto :success
)

echo [4/4] جاري رفع التحديثات إلى GitHub...
echo.

:: محاولة push
git push origin main 2>&1
if errorlevel 1 (
    :: محاولة push مع set-upstream
    git push -u origin main 2>&1
    if errorlevel 1 (
        echo.
        echo [تحذير] فشل رفع التحديثات إلى GitHub
        echo الأسباب المحتملة:
        echo - مشكلة في الاتصال بالإنترنت
        echo - مشكلة في المصادقة (Authentication)
        echo - لا تملك صلاحيات الوصول
        echo.
        echo التغييرات محفوظة محلياً ويمكن رفعها لاحقاً باستخدام:
        echo   git push
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   ✓ تم بنجاح!
echo ========================================
echo.
echo ✓ تم حفظ جميع التغييرات محلياً
echo ✓ تم رفع التحديثات إلى GitHub
echo.
echo رابط المشروع:
git remote get-url origin
echo.
echo آخر commit:
git log -1 --oneline
echo.

:success
echo ========================================
echo   العملية اكتملت بنجاح! ✓
echo ========================================
echo.
timeout /t 3 >nul
exit /b 0



chcp 65001 >nul
cls
echo ========================================
echo   حفظ ورفع التحديثات إلى GitHub
echo ========================================
echo.

:: التحقق من وجود Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [خطأ] Git غير مثبت على النظام!
    echo يرجى تثبيت Git من: https://git-scm.com/downloads
    pause
    exit /b 1
)

:: التحقق من وجود .git
if not exist ".git" (
    echo [خطأ] هذا المجلد ليس Git repository!
    echo يرجى تشغيل: git init
    pause
    exit /b 1
)

:: التحقق من ربط GitHub
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [تحذير] المشروع غير مربوط بـ GitHub
    echo.
    set /p REPO_URL="أدخل رابط الـ Repository (أو اضغط Enter للتخطي): "
    if not "!REPO_URL!"=="" (
        git remote add origin !REPO_URL!
        if errorlevel 1 (
            git remote set-url origin !REPO_URL!
        )
        git branch -M main 2>nul
        echo ✓ تم ربط المشروع بـ GitHub
        echo.
    ) else (
        echo [تحذير] سيتم حفظ التغييرات محلياً فقط بدون رفع إلى GitHub
        echo.
    )
)

echo [1/4] جاري فحص التغييرات...
git status --short >nul 2>&1
if errorlevel 1 (
    echo [خطأ] حدث خطأ أثناء فحص التغييرات
    pause
    exit /b 1
)

:: عرض التغييرات
echo.
echo التغييرات المكتشفة:
git status --short
echo.

:: التحقق من وجود تغييرات
git diff --quiet --exit-code
if %errorlevel% == 0 (
    git diff --cached --quiet --exit-code
    if %errorlevel% == 0 (
        echo [معلومة] لا توجد تغييرات جديدة لحفظها
        echo.
        goto :check_remote
    )
)

echo [2/4] جاري إضافة جميع التغييرات...
git add .
if errorlevel 1 (
    echo [خطأ] فشل إضافة الملفات
    pause
    exit /b 1
)
echo ✓ تم إضافة جميع الملفات
echo.

:: إنشاء رسالة commit تلقائية
set "COMMIT_MSG=تحديث تلقائي - %date% %time%"
set "COMMIT_MSG=!COMMIT_MSG: =!"

:: محاولة إنشاء رسالة أفضل بناءً على التغييرات
for /f "tokens=*" %%i in ('git diff --cached --name-only') do (
    set "FILE_NAME=%%i"
    if "!FILE_NAME:frontend=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث واجهة المستخدم - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:backend=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث Backend API - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:contracts=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث نظام العقود - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:daily-reports=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث التقارير اليومية - %date%"
        goto :commit_done
    )
)

:commit_done
echo [3/4] جاري حفظ التغييرات...
git commit -m "!COMMIT_MSG!"
if errorlevel 1 (
    echo [تحذير] لا توجد تغييرات جديدة لحفظها أو حدث خطأ
    echo.
    goto :check_remote
)
echo ✓ تم حفظ التغييرات بنجاح
echo.

:check_remote
:: التحقق من وجود remote
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [معلومة] المشروع غير مربوط بـ GitHub
    echo التغييرات محفوظة محلياً فقط
    echo.
    goto :success
)

echo [4/4] جاري رفع التحديثات إلى GitHub...
echo.

:: محاولة push
git push origin main 2>&1
if errorlevel 1 (
    :: محاولة push مع set-upstream
    git push -u origin main 2>&1
    if errorlevel 1 (
        echo.
        echo [تحذير] فشل رفع التحديثات إلى GitHub
        echo الأسباب المحتملة:
        echo - مشكلة في الاتصال بالإنترنت
        echo - مشكلة في المصادقة (Authentication)
        echo - لا تملك صلاحيات الوصول
        echo.
        echo التغييرات محفوظة محلياً ويمكن رفعها لاحقاً باستخدام:
        echo   git push
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   ✓ تم بنجاح!
echo ========================================
echo.
echo ✓ تم حفظ جميع التغييرات محلياً
echo ✓ تم رفع التحديثات إلى GitHub
echo.
echo رابط المشروع:
git remote get-url origin
echo.
echo آخر commit:
git log -1 --oneline
echo.

:success
echo ========================================
echo   العملية اكتملت بنجاح! ✓
echo ========================================
echo.
timeout /t 3 >nul
exit /b 0



chcp 65001 >nul
cls
echo ========================================
echo   حفظ ورفع التحديثات إلى GitHub
echo ========================================
echo.

:: التحقق من وجود Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [خطأ] Git غير مثبت على النظام!
    echo يرجى تثبيت Git من: https://git-scm.com/downloads
    pause
    exit /b 1
)

:: التحقق من وجود .git
if not exist ".git" (
    echo [خطأ] هذا المجلد ليس Git repository!
    echo يرجى تشغيل: git init
    pause
    exit /b 1
)

:: التحقق من ربط GitHub
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [تحذير] المشروع غير مربوط بـ GitHub
    echo.
    set /p REPO_URL="أدخل رابط الـ Repository (أو اضغط Enter للتخطي): "
    if not "!REPO_URL!"=="" (
        git remote add origin !REPO_URL!
        if errorlevel 1 (
            git remote set-url origin !REPO_URL!
        )
        git branch -M main 2>nul
        echo ✓ تم ربط المشروع بـ GitHub
        echo.
    ) else (
        echo [تحذير] سيتم حفظ التغييرات محلياً فقط بدون رفع إلى GitHub
        echo.
    )
)

echo [1/4] جاري فحص التغييرات...
git status --short >nul 2>&1
if errorlevel 1 (
    echo [خطأ] حدث خطأ أثناء فحص التغييرات
    pause
    exit /b 1
)

:: عرض التغييرات
echo.
echo التغييرات المكتشفة:
git status --short
echo.

:: التحقق من وجود تغييرات
git diff --quiet --exit-code
if %errorlevel% == 0 (
    git diff --cached --quiet --exit-code
    if %errorlevel% == 0 (
        echo [معلومة] لا توجد تغييرات جديدة لحفظها
        echo.
        goto :check_remote
    )
)

echo [2/4] جاري إضافة جميع التغييرات...
git add .
if errorlevel 1 (
    echo [خطأ] فشل إضافة الملفات
    pause
    exit /b 1
)
echo ✓ تم إضافة جميع الملفات
echo.

:: إنشاء رسالة commit تلقائية
set "COMMIT_MSG=تحديث تلقائي - %date% %time%"
set "COMMIT_MSG=!COMMIT_MSG: =!"

:: محاولة إنشاء رسالة أفضل بناءً على التغييرات
for /f "tokens=*" %%i in ('git diff --cached --name-only') do (
    set "FILE_NAME=%%i"
    if "!FILE_NAME:frontend=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث واجهة المستخدم - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:backend=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث Backend API - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:contracts=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث نظام العقود - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:daily-reports=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث التقارير اليومية - %date%"
        goto :commit_done
    )
)

:commit_done
echo [3/4] جاري حفظ التغييرات...
git commit -m "!COMMIT_MSG!"
if errorlevel 1 (
    echo [تحذير] لا توجد تغييرات جديدة لحفظها أو حدث خطأ
    echo.
    goto :check_remote
)
echo ✓ تم حفظ التغييرات بنجاح
echo.

:check_remote
:: التحقق من وجود remote
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [معلومة] المشروع غير مربوط بـ GitHub
    echo التغييرات محفوظة محلياً فقط
    echo.
    goto :success
)

echo [4/4] جاري رفع التحديثات إلى GitHub...
echo.

:: محاولة push
git push origin main 2>&1
if errorlevel 1 (
    :: محاولة push مع set-upstream
    git push -u origin main 2>&1
    if errorlevel 1 (
        echo.
        echo [تحذير] فشل رفع التحديثات إلى GitHub
        echo الأسباب المحتملة:
        echo - مشكلة في الاتصال بالإنترنت
        echo - مشكلة في المصادقة (Authentication)
        echo - لا تملك صلاحيات الوصول
        echo.
        echo التغييرات محفوظة محلياً ويمكن رفعها لاحقاً باستخدام:
        echo   git push
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   ✓ تم بنجاح!
echo ========================================
echo.
echo ✓ تم حفظ جميع التغييرات محلياً
echo ✓ تم رفع التحديثات إلى GitHub
echo.
echo رابط المشروع:
git remote get-url origin
echo.
echo آخر commit:
git log -1 --oneline
echo.

:success
echo ========================================
echo   العملية اكتملت بنجاح! ✓
echo ========================================
echo.
timeout /t 3 >nul
exit /b 0



chcp 65001 >nul
cls
echo ========================================
echo   حفظ ورفع التحديثات إلى GitHub
echo ========================================
echo.

:: التحقق من وجود Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [خطأ] Git غير مثبت على النظام!
    echo يرجى تثبيت Git من: https://git-scm.com/downloads
    pause
    exit /b 1
)

:: التحقق من وجود .git
if not exist ".git" (
    echo [خطأ] هذا المجلد ليس Git repository!
    echo يرجى تشغيل: git init
    pause
    exit /b 1
)

:: التحقق من ربط GitHub
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [تحذير] المشروع غير مربوط بـ GitHub
    echo.
    set /p REPO_URL="أدخل رابط الـ Repository (أو اضغط Enter للتخطي): "
    if not "!REPO_URL!"=="" (
        git remote add origin !REPO_URL!
        if errorlevel 1 (
            git remote set-url origin !REPO_URL!
        )
        git branch -M main 2>nul
        echo ✓ تم ربط المشروع بـ GitHub
        echo.
    ) else (
        echo [تحذير] سيتم حفظ التغييرات محلياً فقط بدون رفع إلى GitHub
        echo.
    )
)

echo [1/4] جاري فحص التغييرات...
git status --short >nul 2>&1
if errorlevel 1 (
    echo [خطأ] حدث خطأ أثناء فحص التغييرات
    pause
    exit /b 1
)

:: عرض التغييرات
echo.
echo التغييرات المكتشفة:
git status --short
echo.

:: التحقق من وجود تغييرات
git diff --quiet --exit-code
if %errorlevel% == 0 (
    git diff --cached --quiet --exit-code
    if %errorlevel% == 0 (
        echo [معلومة] لا توجد تغييرات جديدة لحفظها
        echo.
        goto :check_remote
    )
)

echo [2/4] جاري إضافة جميع التغييرات...
git add .
if errorlevel 1 (
    echo [خطأ] فشل إضافة الملفات
    pause
    exit /b 1
)
echo ✓ تم إضافة جميع الملفات
echo.

:: إنشاء رسالة commit تلقائية
set "COMMIT_MSG=تحديث تلقائي - %date% %time%"
set "COMMIT_MSG=!COMMIT_MSG: =!"

:: محاولة إنشاء رسالة أفضل بناءً على التغييرات
for /f "tokens=*" %%i in ('git diff --cached --name-only') do (
    set "FILE_NAME=%%i"
    if "!FILE_NAME:frontend=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث واجهة المستخدم - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:backend=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث Backend API - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:contracts=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث نظام العقود - %date%"
        goto :commit_done
    )
    if "!FILE_NAME:daily-reports=!" neq "!FILE_NAME!" (
        set "COMMIT_MSG=تحديث التقارير اليومية - %date%"
        goto :commit_done
    )
)

:commit_done
echo [3/4] جاري حفظ التغييرات...
git commit -m "!COMMIT_MSG!"
if errorlevel 1 (
    echo [تحذير] لا توجد تغييرات جديدة لحفظها أو حدث خطأ
    echo.
    goto :check_remote
)
echo ✓ تم حفظ التغييرات بنجاح
echo.

:check_remote
:: التحقق من وجود remote
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [معلومة] المشروع غير مربوط بـ GitHub
    echo التغييرات محفوظة محلياً فقط
    echo.
    goto :success
)

echo [4/4] جاري رفع التحديثات إلى GitHub...
echo.

:: محاولة push
git push origin main 2>&1
if errorlevel 1 (
    :: محاولة push مع set-upstream
    git push -u origin main 2>&1
    if errorlevel 1 (
        echo.
        echo [تحذير] فشل رفع التحديثات إلى GitHub
        echo الأسباب المحتملة:
        echo - مشكلة في الاتصال بالإنترنت
        echo - مشكلة في المصادقة (Authentication)
        echo - لا تملك صلاحيات الوصول
        echo.
        echo التغييرات محفوظة محلياً ويمكن رفعها لاحقاً باستخدام:
        echo   git push
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   ✓ تم بنجاح!
echo ========================================
echo.
echo ✓ تم حفظ جميع التغييرات محلياً
echo ✓ تم رفع التحديثات إلى GitHub
echo.
echo رابط المشروع:
git remote get-url origin
echo.
echo آخر commit:
git log -1 --oneline
echo.

:success
echo ========================================
echo   العملية اكتملت بنجاح! ✓
echo ========================================
echo.
timeout /t 3 >nul
exit /b 0







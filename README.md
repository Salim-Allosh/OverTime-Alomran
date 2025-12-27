# نظام إدارة الوقت الإضافي - مركز العمران للتدريب والتطوير

## نظرة عامة

نظام شامل لإدارة الجلسات الإضافية، العقود، والتقارير اليومية والشهرية لمركز العمران للتدريب والتطوير.

## المميزات

### 🎯 الوظائف الرئيسية

- **إدارة الجلسات الإضافية**: تسجيل وموافقة على الجلسات الإضافية
- **إدارة العقود**: إنشاء وإدارة عقود المدرسين والطلاب
- **التقارير اليومية**: تتبع الإحصائيات اليومية لكل فرع
- **التقارير الشهرية**: تقارير شاملة مع إحصائيات مفصلة
- **لوحة تحكم المشرف**: إدارة الفروع والحسابات
- **نظام المصاريف**: تتبع المصاريف الشهرية
- **تصدير PDF**: تصدير التقارير بصيغة PDF

### 🛠️ التقنيات المستخدمة

**Backend:**
- FastAPI (Python)
- SQLAlchemy (ORM)
- MySQL Database
- bcrypt (Password Hashing)
- Uvicorn (ASGI Server)

**Frontend:**
- React.js
- React Router
- Vite
- HTML2Canvas & jsPDF (PDF Export)

## 📋 المتطلبات

- Python 3.8+
- Node.js 16+
- MySQL 5.7+ أو MariaDB
- XAMPP (اختياري - لتشغيل MySQL)

## 🚀 التثبيت والتشغيل

### 1. إعداد قاعدة البيانات

#### الطريقة الأولى: استخدام Python Script
```bash
cd backend-api
python create_mysql_database.py
python seed_sample_data.py
```

#### الطريقة الثانية: استخدام phpMyAdmin
1. افتح phpMyAdmin
2. استورد ملف `backend-api/create_database.sql`
3. شغّل `backend-api/seed_sample_data.py` لإضافة البيانات التجريبية

### 2. إعداد Backend

```bash
cd backend-api
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 3. إعداد Frontend

```bash
cd frontend
npm install
```

### 4. تشغيل المشروع

#### Windows:
```bash
run.bat
```

#### يدوياً:
```bash
# Terminal 1 - Backend
cd backend-api
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🔐 الحسابات التجريبية

جميع الحسابات موجودة في `backend-api/ACCOUNTS_LIST.md`

**مشرف عام:**
- Username: `admin` / Password: `admin123`
- Username: `admin2` / Password: `admin123`

**مدير:**
- Username: `manager1` / Password: `manager123`
- Username: `manager2` / Password: `manager123`

**مشغل:**
- Username: `operator1` / Password: `operator123`
- Username: `operator2` / Password: `operator123`
- Username: `operator3` / Password: `operator123`

## 📁 هيكل المشروع

```
OverTime/
├── backend-api/
│   ├── src/
│   │   └── main.py          # FastAPI application
│   ├── create_mysql_database.py
│   ├── seed_sample_data.py
│   ├── add_accounts.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # React components
│   │   └── api.js           # API utilities
│   └── package.json
├── run.bat                   # تشغيل السيرفرات
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - تسجيل الدخول
- `GET /auth/me` - معلومات المستخدم الحالي

### Branches
- `GET /branches` - قائمة الفروع
- `POST /branches` - إنشاء فرع جديد
- `PATCH /branches/{id}` - تحديث فرع
- `DELETE /branches/{id}` - حذف فرع

### Contracts
- `GET /contracts` - قائمة العقود
- `POST /contracts` - إنشاء عقد جديد
- `GET /contracts/{id}` - الحصول على عقد
- `PATCH /contracts/{id}` - تحديث عقد
- `DELETE /contracts/{id}` - حذف عقد

### Daily Reports
- `GET /daily-reports` - قائمة التقارير اليومية
- `POST /daily-reports` - إنشاء تقرير يومي
- `GET /daily-reports/{id}` - الحصول على تقرير
- `PATCH /daily-reports/{id}` - تحديث تقرير
- `DELETE /daily-reports/{id}` - حذف تقرير

### Sessions & Drafts
- `GET /drafts` - قائمة المسودات
- `POST /drafts` - إنشاء مسودة
- `POST /drafts/{id}/approve` - الموافقة على مسودة
- `POST /drafts/{id}/reject` - رفض مسودة
- `GET /sessions/all` - جميع الجلسات الموافق عليها

### Reports
- `GET /reports/monthly` - التقارير الشهرية
- `GET /teachers/list` - قائمة المدرسين

## 📊 قاعدة البيانات

### الجداول الرئيسية:
- `branches` - الفروع
- `operation_accounts` - حسابات المستخدمين
- `contracts` - العقود
- `session_drafts` - مسودات الجلسات
- `sessions` - الجلسات الموافق عليها
- `expenses` - المصاريف
- `daily_reports` - التقارير اليومية

## 🐛 استكشاف الأخطاء

### مشكلة الاتصال بقاعدة البيانات
- تأكد من تشغيل MySQL في XAMPP
- تحقق من إعدادات الاتصال في `backend-api/src/main.py`

### مشكلة CORS
- تأكد من أن Frontend يعمل على `http://localhost:5173`
- تحقق من إعدادات CORS في `backend-api/src/main.py`

### مشكلة تسجيل الدخول
- تأكد من تشغيل Backend على المنفذ 8000
- تحقق من وجود البيانات في قاعدة البيانات

## 📝 التحديثات

### الإصدار الحالي (22 ديسمبر 2025)
- ✅ إضافة نظام العقود
- ✅ إضافة نظام التقارير اليومية
- ✅ تحديث قاعدة البيانات لاستخدام MySQL
- ✅ إصلاح مشاكل تسجيل الدخول
- ✅ تحسين واجهة المستخدم
- ✅ إضافة API endpoints كاملة

## 👨‍💻 المطور

تم التطوير بواسطة: **Salim Alu**

## 📄 الترخيص

هذا المشروع خاص بمركز العمران للتدريب والتطوير.

---

**ملاحظة:** تأكد من حفظ جميع التغييرات في Git قبل إجراء أي تعديلات كبيرة!




## نظرة عامة

نظام شامل لإدارة الجلسات الإضافية، العقود، والتقارير اليومية والشهرية لمركز العمران للتدريب والتطوير.

## المميزات

### 🎯 الوظائف الرئيسية

- **إدارة الجلسات الإضافية**: تسجيل وموافقة على الجلسات الإضافية
- **إدارة العقود**: إنشاء وإدارة عقود المدرسين والطلاب
- **التقارير اليومية**: تتبع الإحصائيات اليومية لكل فرع
- **التقارير الشهرية**: تقارير شاملة مع إحصائيات مفصلة
- **لوحة تحكم المشرف**: إدارة الفروع والحسابات
- **نظام المصاريف**: تتبع المصاريف الشهرية
- **تصدير PDF**: تصدير التقارير بصيغة PDF

### 🛠️ التقنيات المستخدمة

**Backend:**
- FastAPI (Python)
- SQLAlchemy (ORM)
- MySQL Database
- bcrypt (Password Hashing)
- Uvicorn (ASGI Server)

**Frontend:**
- React.js
- React Router
- Vite
- HTML2Canvas & jsPDF (PDF Export)

## 📋 المتطلبات

- Python 3.8+
- Node.js 16+
- MySQL 5.7+ أو MariaDB
- XAMPP (اختياري - لتشغيل MySQL)

## 🚀 التثبيت والتشغيل

### 1. إعداد قاعدة البيانات

#### الطريقة الأولى: استخدام Python Script
```bash
cd backend-api
python create_mysql_database.py
python seed_sample_data.py
```

#### الطريقة الثانية: استخدام phpMyAdmin
1. افتح phpMyAdmin
2. استورد ملف `backend-api/create_database.sql`
3. شغّل `backend-api/seed_sample_data.py` لإضافة البيانات التجريبية

### 2. إعداد Backend

```bash
cd backend-api
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 3. إعداد Frontend

```bash
cd frontend
npm install
```

### 4. تشغيل المشروع

#### Windows:
```bash
run.bat
```

#### يدوياً:
```bash
# Terminal 1 - Backend
cd backend-api
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🔐 الحسابات التجريبية

جميع الحسابات موجودة في `backend-api/ACCOUNTS_LIST.md`

**مشرف عام:**
- Username: `admin` / Password: `admin123`
- Username: `admin2` / Password: `admin123`

**مدير:**
- Username: `manager1` / Password: `manager123`
- Username: `manager2` / Password: `manager123`

**مشغل:**
- Username: `operator1` / Password: `operator123`
- Username: `operator2` / Password: `operator123`
- Username: `operator3` / Password: `operator123`

## 📁 هيكل المشروع

```
OverTime/
├── backend-api/
│   ├── src/
│   │   └── main.py          # FastAPI application
│   ├── create_mysql_database.py
│   ├── seed_sample_data.py
│   ├── add_accounts.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # React components
│   │   └── api.js           # API utilities
│   └── package.json
├── run.bat                   # تشغيل السيرفرات
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - تسجيل الدخول
- `GET /auth/me` - معلومات المستخدم الحالي

### Branches
- `GET /branches` - قائمة الفروع
- `POST /branches` - إنشاء فرع جديد
- `PATCH /branches/{id}` - تحديث فرع
- `DELETE /branches/{id}` - حذف فرع

### Contracts
- `GET /contracts` - قائمة العقود
- `POST /contracts` - إنشاء عقد جديد
- `GET /contracts/{id}` - الحصول على عقد
- `PATCH /contracts/{id}` - تحديث عقد
- `DELETE /contracts/{id}` - حذف عقد

### Daily Reports
- `GET /daily-reports` - قائمة التقارير اليومية
- `POST /daily-reports` - إنشاء تقرير يومي
- `GET /daily-reports/{id}` - الحصول على تقرير
- `PATCH /daily-reports/{id}` - تحديث تقرير
- `DELETE /daily-reports/{id}` - حذف تقرير

### Sessions & Drafts
- `GET /drafts` - قائمة المسودات
- `POST /drafts` - إنشاء مسودة
- `POST /drafts/{id}/approve` - الموافقة على مسودة
- `POST /drafts/{id}/reject` - رفض مسودة
- `GET /sessions/all` - جميع الجلسات الموافق عليها

### Reports
- `GET /reports/monthly` - التقارير الشهرية
- `GET /teachers/list` - قائمة المدرسين

## 📊 قاعدة البيانات

### الجداول الرئيسية:
- `branches` - الفروع
- `operation_accounts` - حسابات المستخدمين
- `contracts` - العقود
- `session_drafts` - مسودات الجلسات
- `sessions` - الجلسات الموافق عليها
- `expenses` - المصاريف
- `daily_reports` - التقارير اليومية

## 🐛 استكشاف الأخطاء

### مشكلة الاتصال بقاعدة البيانات
- تأكد من تشغيل MySQL في XAMPP
- تحقق من إعدادات الاتصال في `backend-api/src/main.py`

### مشكلة CORS
- تأكد من أن Frontend يعمل على `http://localhost:5173`
- تحقق من إعدادات CORS في `backend-api/src/main.py`

### مشكلة تسجيل الدخول
- تأكد من تشغيل Backend على المنفذ 8000
- تحقق من وجود البيانات في قاعدة البيانات

## 📝 التحديثات

### الإصدار الحالي (22 ديسمبر 2025)
- ✅ إضافة نظام العقود
- ✅ إضافة نظام التقارير اليومية
- ✅ تحديث قاعدة البيانات لاستخدام MySQL
- ✅ إصلاح مشاكل تسجيل الدخول
- ✅ تحسين واجهة المستخدم
- ✅ إضافة API endpoints كاملة

## 👨‍💻 المطور

تم التطوير بواسطة: **Salim Alu**

## 📄 الترخيص

هذا المشروع خاص بمركز العمران للتدريب والتطوير.

---

**ملاحظة:** تأكد من حفظ جميع التغييرات في Git قبل إجراء أي تعديلات كبيرة!




## نظرة عامة

نظام شامل لإدارة الجلسات الإضافية، العقود، والتقارير اليومية والشهرية لمركز العمران للتدريب والتطوير.

## المميزات

### 🎯 الوظائف الرئيسية

- **إدارة الجلسات الإضافية**: تسجيل وموافقة على الجلسات الإضافية
- **إدارة العقود**: إنشاء وإدارة عقود المدرسين والطلاب
- **التقارير اليومية**: تتبع الإحصائيات اليومية لكل فرع
- **التقارير الشهرية**: تقارير شاملة مع إحصائيات مفصلة
- **لوحة تحكم المشرف**: إدارة الفروع والحسابات
- **نظام المصاريف**: تتبع المصاريف الشهرية
- **تصدير PDF**: تصدير التقارير بصيغة PDF

### 🛠️ التقنيات المستخدمة

**Backend:**
- FastAPI (Python)
- SQLAlchemy (ORM)
- MySQL Database
- bcrypt (Password Hashing)
- Uvicorn (ASGI Server)

**Frontend:**
- React.js
- React Router
- Vite
- HTML2Canvas & jsPDF (PDF Export)

## 📋 المتطلبات

- Python 3.8+
- Node.js 16+
- MySQL 5.7+ أو MariaDB
- XAMPP (اختياري - لتشغيل MySQL)

## 🚀 التثبيت والتشغيل

### 1. إعداد قاعدة البيانات

#### الطريقة الأولى: استخدام Python Script
```bash
cd backend-api
python create_mysql_database.py
python seed_sample_data.py
```

#### الطريقة الثانية: استخدام phpMyAdmin
1. افتح phpMyAdmin
2. استورد ملف `backend-api/create_database.sql`
3. شغّل `backend-api/seed_sample_data.py` لإضافة البيانات التجريبية

### 2. إعداد Backend

```bash
cd backend-api
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 3. إعداد Frontend

```bash
cd frontend
npm install
```

### 4. تشغيل المشروع

#### Windows:
```bash
run.bat
```

#### يدوياً:
```bash
# Terminal 1 - Backend
cd backend-api
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🔐 الحسابات التجريبية

جميع الحسابات موجودة في `backend-api/ACCOUNTS_LIST.md`

**مشرف عام:**
- Username: `admin` / Password: `admin123`
- Username: `admin2` / Password: `admin123`

**مدير:**
- Username: `manager1` / Password: `manager123`
- Username: `manager2` / Password: `manager123`

**مشغل:**
- Username: `operator1` / Password: `operator123`
- Username: `operator2` / Password: `operator123`
- Username: `operator3` / Password: `operator123`

## 📁 هيكل المشروع

```
OverTime/
├── backend-api/
│   ├── src/
│   │   └── main.py          # FastAPI application
│   ├── create_mysql_database.py
│   ├── seed_sample_data.py
│   ├── add_accounts.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # React components
│   │   └── api.js           # API utilities
│   └── package.json
├── run.bat                   # تشغيل السيرفرات
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - تسجيل الدخول
- `GET /auth/me` - معلومات المستخدم الحالي

### Branches
- `GET /branches` - قائمة الفروع
- `POST /branches` - إنشاء فرع جديد
- `PATCH /branches/{id}` - تحديث فرع
- `DELETE /branches/{id}` - حذف فرع

### Contracts
- `GET /contracts` - قائمة العقود
- `POST /contracts` - إنشاء عقد جديد
- `GET /contracts/{id}` - الحصول على عقد
- `PATCH /contracts/{id}` - تحديث عقد
- `DELETE /contracts/{id}` - حذف عقد

### Daily Reports
- `GET /daily-reports` - قائمة التقارير اليومية
- `POST /daily-reports` - إنشاء تقرير يومي
- `GET /daily-reports/{id}` - الحصول على تقرير
- `PATCH /daily-reports/{id}` - تحديث تقرير
- `DELETE /daily-reports/{id}` - حذف تقرير

### Sessions & Drafts
- `GET /drafts` - قائمة المسودات
- `POST /drafts` - إنشاء مسودة
- `POST /drafts/{id}/approve` - الموافقة على مسودة
- `POST /drafts/{id}/reject` - رفض مسودة
- `GET /sessions/all` - جميع الجلسات الموافق عليها

### Reports
- `GET /reports/monthly` - التقارير الشهرية
- `GET /teachers/list` - قائمة المدرسين

## 📊 قاعدة البيانات

### الجداول الرئيسية:
- `branches` - الفروع
- `operation_accounts` - حسابات المستخدمين
- `contracts` - العقود
- `session_drafts` - مسودات الجلسات
- `sessions` - الجلسات الموافق عليها
- `expenses` - المصاريف
- `daily_reports` - التقارير اليومية

## 🐛 استكشاف الأخطاء

### مشكلة الاتصال بقاعدة البيانات
- تأكد من تشغيل MySQL في XAMPP
- تحقق من إعدادات الاتصال في `backend-api/src/main.py`

### مشكلة CORS
- تأكد من أن Frontend يعمل على `http://localhost:5173`
- تحقق من إعدادات CORS في `backend-api/src/main.py`

### مشكلة تسجيل الدخول
- تأكد من تشغيل Backend على المنفذ 8000
- تحقق من وجود البيانات في قاعدة البيانات

## 📝 التحديثات

### الإصدار الحالي (22 ديسمبر 2025)
- ✅ إضافة نظام العقود
- ✅ إضافة نظام التقارير اليومية
- ✅ تحديث قاعدة البيانات لاستخدام MySQL
- ✅ إصلاح مشاكل تسجيل الدخول
- ✅ تحسين واجهة المستخدم
- ✅ إضافة API endpoints كاملة

## 👨‍💻 المطور

تم التطوير بواسطة: **Salim Alu**

## 📄 الترخيص

هذا المشروع خاص بمركز العمران للتدريب والتطوير.

---

**ملاحظة:** تأكد من حفظ جميع التغييرات في Git قبل إجراء أي تعديلات كبيرة!




## نظرة عامة

نظام شامل لإدارة الجلسات الإضافية، العقود، والتقارير اليومية والشهرية لمركز العمران للتدريب والتطوير.

## المميزات

### 🎯 الوظائف الرئيسية

- **إدارة الجلسات الإضافية**: تسجيل وموافقة على الجلسات الإضافية
- **إدارة العقود**: إنشاء وإدارة عقود المدرسين والطلاب
- **التقارير اليومية**: تتبع الإحصائيات اليومية لكل فرع
- **التقارير الشهرية**: تقارير شاملة مع إحصائيات مفصلة
- **لوحة تحكم المشرف**: إدارة الفروع والحسابات
- **نظام المصاريف**: تتبع المصاريف الشهرية
- **تصدير PDF**: تصدير التقارير بصيغة PDF

### 🛠️ التقنيات المستخدمة

**Backend:**
- FastAPI (Python)
- SQLAlchemy (ORM)
- MySQL Database
- bcrypt (Password Hashing)
- Uvicorn (ASGI Server)

**Frontend:**
- React.js
- React Router
- Vite
- HTML2Canvas & jsPDF (PDF Export)

## 📋 المتطلبات

- Python 3.8+
- Node.js 16+
- MySQL 5.7+ أو MariaDB
- XAMPP (اختياري - لتشغيل MySQL)

## 🚀 التثبيت والتشغيل

### 1. إعداد قاعدة البيانات

#### الطريقة الأولى: استخدام Python Script
```bash
cd backend-api
python create_mysql_database.py
python seed_sample_data.py
```

#### الطريقة الثانية: استخدام phpMyAdmin
1. افتح phpMyAdmin
2. استورد ملف `backend-api/create_database.sql`
3. شغّل `backend-api/seed_sample_data.py` لإضافة البيانات التجريبية

### 2. إعداد Backend

```bash
cd backend-api
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 3. إعداد Frontend

```bash
cd frontend
npm install
```

### 4. تشغيل المشروع

#### Windows:
```bash
run.bat
```

#### يدوياً:
```bash
# Terminal 1 - Backend
cd backend-api
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🔐 الحسابات التجريبية

جميع الحسابات موجودة في `backend-api/ACCOUNTS_LIST.md`

**مشرف عام:**
- Username: `admin` / Password: `admin123`
- Username: `admin2` / Password: `admin123`

**مدير:**
- Username: `manager1` / Password: `manager123`
- Username: `manager2` / Password: `manager123`

**مشغل:**
- Username: `operator1` / Password: `operator123`
- Username: `operator2` / Password: `operator123`
- Username: `operator3` / Password: `operator123`

## 📁 هيكل المشروع

```
OverTime/
├── backend-api/
│   ├── src/
│   │   └── main.py          # FastAPI application
│   ├── create_mysql_database.py
│   ├── seed_sample_data.py
│   ├── add_accounts.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # React components
│   │   └── api.js           # API utilities
│   └── package.json
├── run.bat                   # تشغيل السيرفرات
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - تسجيل الدخول
- `GET /auth/me` - معلومات المستخدم الحالي

### Branches
- `GET /branches` - قائمة الفروع
- `POST /branches` - إنشاء فرع جديد
- `PATCH /branches/{id}` - تحديث فرع
- `DELETE /branches/{id}` - حذف فرع

### Contracts
- `GET /contracts` - قائمة العقود
- `POST /contracts` - إنشاء عقد جديد
- `GET /contracts/{id}` - الحصول على عقد
- `PATCH /contracts/{id}` - تحديث عقد
- `DELETE /contracts/{id}` - حذف عقد

### Daily Reports
- `GET /daily-reports` - قائمة التقارير اليومية
- `POST /daily-reports` - إنشاء تقرير يومي
- `GET /daily-reports/{id}` - الحصول على تقرير
- `PATCH /daily-reports/{id}` - تحديث تقرير
- `DELETE /daily-reports/{id}` - حذف تقرير

### Sessions & Drafts
- `GET /drafts` - قائمة المسودات
- `POST /drafts` - إنشاء مسودة
- `POST /drafts/{id}/approve` - الموافقة على مسودة
- `POST /drafts/{id}/reject` - رفض مسودة
- `GET /sessions/all` - جميع الجلسات الموافق عليها

### Reports
- `GET /reports/monthly` - التقارير الشهرية
- `GET /teachers/list` - قائمة المدرسين

## 📊 قاعدة البيانات

### الجداول الرئيسية:
- `branches` - الفروع
- `operation_accounts` - حسابات المستخدمين
- `contracts` - العقود
- `session_drafts` - مسودات الجلسات
- `sessions` - الجلسات الموافق عليها
- `expenses` - المصاريف
- `daily_reports` - التقارير اليومية

## 🐛 استكشاف الأخطاء

### مشكلة الاتصال بقاعدة البيانات
- تأكد من تشغيل MySQL في XAMPP
- تحقق من إعدادات الاتصال في `backend-api/src/main.py`

### مشكلة CORS
- تأكد من أن Frontend يعمل على `http://localhost:5173`
- تحقق من إعدادات CORS في `backend-api/src/main.py`

### مشكلة تسجيل الدخول
- تأكد من تشغيل Backend على المنفذ 8000
- تحقق من وجود البيانات في قاعدة البيانات

## 📝 التحديثات

### الإصدار الحالي (22 ديسمبر 2025)
- ✅ إضافة نظام العقود
- ✅ إضافة نظام التقارير اليومية
- ✅ تحديث قاعدة البيانات لاستخدام MySQL
- ✅ إصلاح مشاكل تسجيل الدخول
- ✅ تحسين واجهة المستخدم
- ✅ إضافة API endpoints كاملة

## 👨‍💻 المطور

تم التطوير بواسطة: **Salim Alu**

## 📄 الترخيص

هذا المشروع خاص بمركز العمران للتدريب والتطوير.

---

**ملاحظة:** تأكد من حفظ جميع التغييرات في Git قبل إجراء أي تعديلات كبيرة!







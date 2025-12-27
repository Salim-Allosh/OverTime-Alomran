# تعليمات إضافة خط Cairo للغة العربية في pdfmake

## المشكلة
النص العربي يظهر كمربعات لأن خط Cairo غير مضمن داخل pdfmake.vfs.

## الحل الإلزامي

### 1️⃣ تحميل ملفات الخط

يجب استخدام ملفات TTF فقط:
- **Cairo-Regular.ttf**
- **Cairo-Bold.ttf**

**مصدر الخط الرسمي:**
https://fonts.google.com/specimen/Cairo

**خطوات التحميل:**
1. اذهب إلى الرابط أعلاه
2. اضغط على "Download family"
3. استخرج الملفات من الأرشيف
4. احفظ الملفين المطلوبين في مكان يمكنك الوصول إليه

### 2️⃣ تحويل الخط إلى Base64

#### الطريقة الأولى: استخدام أداة عبر الإنترنت
1. اذهب إلى: https://www.base64encode.org/
2. اختر ملف `Cairo-Regular.ttf`
3. اضغط "Encode"
4. انسخ النص الناتج (سيكون طويلاً جداً)
5. كرر العملية لملف `Cairo-Bold.ttf`

#### الطريقة الثانية: استخدام Node.js
```javascript
const fs = require('fs');

// قراءة ملفات الخط
const fontRegular = fs.readFileSync('Cairo-Regular.ttf');
const fontBold = fs.readFileSync('Cairo-Bold.ttf');

// تحويل إلى base64
const regularBase64 = fontRegular.toString('base64');
const boldBase64 = fontBold.toString('base64');

console.log('Cairo-Regular.ttf base64:');
console.log(regularBase64);
console.log('\nCairo-Bold.ttf base64:');
console.log(boldBase64);
```

### 3️⃣ إضافة Base64 إلى الملف

1. افتح الملف: `frontend/src/fonts/vfs_fonts_custom.js`
2. ابحث عن:
   ```javascript
   "Cairo-Regular.ttf": "", // TODO: Add Cairo-Regular.ttf base64 string here
   "Cairo-Bold.ttf": "" // TODO: Add Cairo-Bold.ttf base64 string here
   ```
3. الصق نص Base64 داخل علامات الاقتباس:
   ```javascript
   "Cairo-Regular.ttf": "BASE64_STRING_HERE",
   "Cairo-Bold.ttf": "BASE64_STRING_HERE"
   ```

**ملاحظة:** النص Base64 سيكون طويلاً جداً (عدة آلاف من الأحرف). تأكد من نسخه بالكامل.

### 4️⃣ التحقق من العمل

بعد إضافة الخطوط:
1. أعد تشغيل خادم التطوير (`npm run dev`)
2. جرّب إنشاء تقرير PDF
3. يجب أن تظهر النصوص العربية بشكل صحيح بدلاً من المربعات

## ممنوع تمامًا

❌ الاعتماد على CSS  
❌ Google Fonts  
❌ أسماء خطوط بدون TTF  
❌ ترك pdfmake بدون fonts  
❌ Canvas أو jsPDF  

## استكشاف الأخطاء

### المشكلة: لا يزال النص يظهر كمربعات
- تأكد من أن نص Base64 مكتمل (لا يوجد قطع)
- تأكد من عدم وجود مسافات أو أسطر جديدة في نص Base64
- تحقق من أن الملف `vfs_fonts_custom.js` يتم استيراده بشكل صحيح

### المشكلة: خطأ في الاستيراد
- تأكد من أن المسار `../fonts/vfs_fonts_custom` صحيح
- تأكد من أن الملف موجود في `frontend/src/fonts/`

### المشكلة: حجم الملف كبير جداً
- هذا طبيعي، ملفات الخطوط كبيرة
- Base64 يزيد الحجم بنسبة ~33% عن الملف الأصلي
- يمكنك ضغط الملفات قبل التحويل لتقليل الحجم



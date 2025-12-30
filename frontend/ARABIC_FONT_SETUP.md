# إعداد خط Cairo للغة العربية في pdfmake

## الخطوات المطلوبة:

1. **تحميل خط Cairo:**
   - اذهب إلى: https://fonts.google.com/specimen/Cairo
   - حمّل ملفات الخطوط:
     - Cairo-Regular.ttf
     - Cairo-Bold.ttf

2. **تحويل الخطوط إلى Base64:**
   - استخدم أداة مثل: https://www.base64encode.org/
   - أو استخدم هذا الأمر في Node.js:
     ```javascript
     const fs = require('fs');
     const fontRegular = fs.readFileSync('Cairo-Regular.ttf');
     const fontBold = fs.readFileSync('Cairo-Bold.ttf');
     console.log('Regular:', fontRegular.toString('base64'));
     console.log('Bold:', fontBold.toString('base64'));
     ```

3. **إضافة الخطوط إلى الكود:**
   - افتح `frontend/src/pages/ReportsPage.jsx`
   - ابحث عن التعليق `// If you have Cairo font files in base64`
   - أضف الخطوط المحولة إلى base64 في المكان المحدد

## حل بديل سريع:

يمكنك استخدام مكتبة `pdfmake-rtl` التي تدعم العربية تلقائياً:
```bash
npm install pdfmake-rtl
```

ثم استبدل الاستيراد في `ReportsPage.jsx`:
```javascript
import pdfMake from 'pdfmake-rtl';
```



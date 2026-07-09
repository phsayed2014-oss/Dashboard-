# PharmaDash

لوحة تحليل محلية لملفات كتابات الأطباء بصيغ Excel وCSV وPDF. الإصدار النهائي يظل ملف HTML واحدًا قابلًا للفتح في المتصفح، بينما المصدر والاختبارات منفصلة لتقليل أخطاء التعديل اليدوي.

## الاستخدام

1. حمّل `PharmaDash-v3-medical-ready.html`.
2. افتحه من خادم محلي أو استضافة HTTPS لضمان عمل Web Crypto وملفات PDF بصورة مستقرة:

   ```bash
   python3 -m http.server 8123
   ```

3. افتح `http://localhost:8123/PharmaDash-v3-medical-ready.html`.
4. ارفع ملف الفرع من بطاقات T1/T2/T3. تتم المعالجة والتخزين محليًا في المتصفح.

## الخصوصية

ملفات الكتابات قد تحتوي بيانات مرضى حقيقية. لا ترفع الملف أو ملف المشاركة إلى خدمة عامة. التخزين المحلي (`IndexedDB`) غير مشفر بواسطة التطبيق، لذا يجب استخدام جهاز مشفر ومغلق. تسجيل الدخول داخل ملف HTML هو حاجز استخدام محلي وليس مصادقة خادم.

## التطوير

```bash
npm install
npm run build
npm run test:unit
npm run test:e2e
npm run verify
```

مصدر الحقيقة:

```text
src/PharmaDash.template.html  HTML shell
src/styles.css                styles
src/app.js                    dashboard application
src/core/index.mjs            tested core utilities
scripts/build.mjs             builds the portable HTML
```

ينتج البناء ثلاثة ملفات متطابقة:

- `PharmaDash-v3-medical-ready.html`
- `pharmdash v3 medical.html` (اسم توافق)
- `dist/PharmaDash-v3-medical-ready.html`

لا تُعدّل الملفات المولدة يدويًا؛ عدّل `src/` ثم نفّذ `npm run build`.

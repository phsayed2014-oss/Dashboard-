# «الكتابة مقابل الصرف» — سجل التسليم

الملف المعدَّل: `PharmaDash_Pro_offline_3.html` (نفس الاسم). عُدِّل الـ `__bundler/template` فقط —
اللودر والـ manifest والـ ext_resources وpage_order وذيل الملف **مطابقة بالبايت** للأصل
(تحقّق: head=1722337 بايت متطابق، tail=25 بايت متطابق، manifest متطابق).

## قائمة الـ anchors المعدَّلة (كلٌّ ظهر مرة واحدة)
1. `TITLES` — إضافة `rxsales:'الكتابة مقابل الصرف'`.
2. `showSection` — فرع `else if(k==='rxsales'){ renderRxSales(); ... }`.
3. `STATE` — إضافة الحقل `sales:null`.
4. `onFile-json` — توجيه ملفات `.json` إلى `onSalesFile(f)` قبل حارس ALL.
5. `insert-block` — كتلة rxsales الكاملة + `restoreSales()` عند الإقلاع (داخل blk index 4).
6. `nav-item` — عنصر تنقّل جديد `data-k="rxsales"` بأيقونة ميزان بنفس نمط ICO.
7. `fileInput-accept` — `accept=".pdf,.xlsx,.xls,.csv,.json"`.
8. `css` — كتل ‎`.rx-*`‎ داخل `<style>` الرئيسي بنفس توكنز الثيم (نموذج `.alert-card`).

## سلامة الكتل
- الكتل الـ7 تعدّي `node --check` بلا أخطاء.
- لا دوال مكرّرة الاسم عبر الكتل.

## fixture (jsdom على الملف النهائي المسلَّم) — النتائج كما ظهرت فعليًا
رفع `01-07_to_20-07.csv` (AHMED ALI×REFLEX CREAM ×10 · SARA HASSAN×ORACURE GEL ×5 · OMAR SAID×PANADOL ×5)
+ ملف مبيعات JSON (reflex units6 price40 cost22 · oracure units5 price30 cost18 · إدخال 2026-06-25 خارج النافذة · إدخال «صيدلية 7»). فرع T1:

```
KPI كتابات الفترة            = 15
KPI وحدات مصروفة             = 11
KPI معدل التحويل             = 73.3%
KPI فجوة التسرب (وحدات)      = 4
KPI إيراد مُهدَر (ج.م)        = 160
KPI هامش مُهدَر (ج.م)         = 72
نافذة المطابقة: 1–20 يوليو · التعاون الأول
صف reflex : 10/6 · 60.0% (كهرماني) · فجوة 4 · إيراد 160 · هامش 72
صف oracure: 5/5 · 100.0% (أخضر) · فجوة 0
شريحة الطبيب: AHMED ALI (10) — الضغط يفتح ملف الطبيب ✓
إدخال 2026-06-25 (خارج النافذة) لا يُحتسب (مصروف=11) ✓
إدخال «صيدلية 7» لا يُحتسب مع T1 · يُحتسب مع ALL (reflex مصروف=13 · إجمالي=18) ✓
```

## اختبارات السلامة العامة
- 15 عنصر تنقّل (14+1) + جولة كاملة + تبديل الثيم = **صفر أخطاء console**.
- `STATE.sales` يُستعاد من `localStorage['pharmaDash.sales.v1']` بعد إعادة التحميل (JSDOM جديدة بنفس الـ url) ✓.
- الشاشات القديمة (نظرة عامة/الأطباء/المقارنات…) تُرندَر بلا أخطاء بعد التعديل.

## كيفية إعادة التشغيل
```
cd tools_rxsales && npm install jsdom@24
node test_rxsales.js   # fixture
node test_safety.js    # nav round-trip + persistence
```
(`patch.py` يعيد تطبيق التعديل من الأصل عند الحاجة؛ `bundle.py check` يفحص الكتل السبع.)

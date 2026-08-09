/*
 * parser.js — مُحلِّل تقرير "مبيعات أصناف المورد" (PDF)
 * ------------------------------------------------------------------
 * يقرأ ملف PDF الصادر من نظام الصيدلية ويُخرج بيانات مبيعات كل صيدلي.
 *
 * بنية التقرير (تم فك ترميزها بالإحداثيات):
 *   - التقرير مُجمَّع حسب "المستخدم" (الصيدلي): لكل صيدلي كود واسم.
 *   - تحت كل صيدلي أسطر أصناف، وكل سطر يحمل الأعمدة التالية (من اليسار):
 *       القيمة بسعر البيع | قيمة التكلفة | الكمية الحالية | الكمية المباعة
 *       | اسم المادة | كود المادة | اسم المورد | كود المورد
 *   - سطر "إجمالي المستخدم" يُتجاهَل، و"إجمالي الحركة" في الآخر يُتجاهَل.
 *   - تاريخ التقرير يُقرأ من سطر "من تاريخ / إلى تاريخ" (صيغة dd-mm-yyyy).
 *
 * التحقق: مجاميع المُحلِّل تطابق سطر "إجمالي الحركة" في الملف المرجعي
 *   (41 حبة، 2,175.00 بيع، 253.25 تكلفة، 26 صيدلي).
 */
(function (global) {
  'use strict';

  const ITEMCODE = /^\d-\d{2}-\d{3}-\d{3}$/;          // مثال: 1-09-118-050
  const USERCODE = /^\d{6}$/;                          // مثال: 107003
  const NUMERIC  = /^[\d,]+\.\d+$|^\d+$/;              // 65.000 أو 1,292.00 أو 1
  const ARABIC   = /[؀-ۿﭐ-﷿ﹰ-﻿]/;

  // مراكز الأعمدة الرقمية (إحداثي x) — مستنتجة من التقرير
  const COL = { sell: 55, cost: 125, currentQty: 170, sold: 255 };

  function toNum(s) { return parseFloat(String(s).replace(/,/g, '')) || 0; }
  function nearest(x, c) { return Math.abs(x - c); }

  // يحوّل مجموعة عناصر النص إلى صفوف مرتّبة حسب y ثم x
  function groupRows(items) {
    const rows = {};
    for (const it of items) {
      const s = (it.str || '').trim();
      if (!s) continue;
      const x = Math.round(it.transform[4]);
      const y = Math.round(it.transform[5]);
      (rows[y] = rows[y] || []).push([x, s]);
    }
    return Object.keys(rows)
      .map(Number)
      .sort((a, b) => b - a) // من أعلى الصفحة لأسفلها
      .map((y) => rows[y].sort((a, b) => a[0] - b[0]));
  }

  // يستخرج التاريخ (dd-mm-yyyy) ويحوّله إلى ISO (yyyy-mm-dd)
  function findDate(toks) {
    for (const [, s] of toks) {
      const m = s.match(/(\d{2})-(\d{2})-(\d{4})/);
      if (m) return m[3] + '-' + m[2] + '-' + m[1];
    }
    return null;
  }

  /**
   * يحلّل مستند pdf.js ويُعيد كائن اليوم.
   * @param {PDFDocumentProxy} doc
   * @returns {Promise<{date, pharmacists, totals}>}
   */
  async function parseDocument(doc) {
    let reportDate = null;
    const users = {};     // code -> pharmacist
    let cur = null;       // الصيدلي الحالي

    for (let pn = 1; pn <= doc.numPages; pn++) {
      const page = await doc.getPage(pn);
      const tc = await page.getTextContent();
      const rows = groupRows(tc.items);

      for (const toks of rows) {
        if (!reportDate) {
          const d = findDate(toks);
          if (d) reportDate = d;
        }

        const hasItem = toks.some(([, s]) => ITEMCODE.test(s));

        // صف رأس الصيدلي: كود من 6 أرقام عند x بين 630 و720، وبدون سطر صنف
        const codeTok = toks.find(([x, s]) => USERCODE.test(s) && x >= 630 && x <= 720);
        if (codeTok && !hasItem) {
          const name = toks
            .filter(([x, s]) => x < 620 && ARABIC.test(s))
            .map(([, s]) => s)
            .join(' ')
            .normalize('NFKC')      // تحويل أشكال العرض العربية إلى حروف قياسية
            .replace(/\s+/g, ' ')
            .trim();
          const code = codeTok[1];
          cur = code;
          if (!users[code]) {
            users[code] = { code, name, qty: 0, sell: 0, cost: 0, lines: 0, items: {} };
          } else if (name && !users[code].name) {
            users[code].name = name;
          }
          continue;
        }

        // صف صنف: يُنسب للصيدلي الحالي
        if (hasItem && cur && users[cur]) {
          const nums = toks.filter(([x, s]) => x < 300 && NUMERIC.test(s.replace(/,/g, '')));
          const pick = (center) => {
            let best = null, bd = Infinity;
            for (const [x, s] of nums) {
              const d = nearest(x, center);
              if (d < bd) { bd = d; best = s; }
            }
            return best ? toNum(best) : 0;
          };
          const sell = pick(COL.sell);
          const cost = pick(COL.cost);
          const sold = pick(COL.sold);

          const nameTok = toks.find(([x, s]) => x >= 350 && x <= 480 && /[A-Za-z]/.test(s));
          const codeM = toks.find(([, s]) => ITEMCODE.test(s));
          const itemCode = codeM ? codeM[1] : '';
          const itemName = nameTok ? nameTok[1].replace(/\s+/g, ' ').trim() : itemCode;

          const u = users[cur];
          u.qty += sold; u.sell += sell; u.cost += cost; u.lines += 1;
          if (!u.items[itemCode]) u.items[itemCode] = { code: itemCode, name: itemName, qty: 0, sell: 0, cost: 0 };
          u.items[itemCode].qty += sold;
          u.items[itemCode].sell += sell;
          u.items[itemCode].cost += cost;
        }
      }
    }

    const pharmacists = Object.values(users).map((u) => ({
      code: u.code,
      name: u.name || u.code,
      qty: round2(u.qty),
      sell: round2(u.sell),
      cost: round2(u.cost),
      profit: round2(u.sell - u.cost),
      items: Object.values(u.items).map((i) => ({
        code: i.code, name: i.name,
        qty: round2(i.qty), sell: round2(i.sell), cost: round2(i.cost),
      })),
    })).sort((a, b) => b.sell - a.sell);

    const totals = pharmacists.reduce(
      (t, p) => ({ qty: t.qty + p.qty, sell: t.sell + p.sell, cost: t.cost + p.cost }),
      { qty: 0, sell: 0, cost: 0 }
    );
    totals.qty = round2(totals.qty);
    totals.sell = round2(totals.sell);
    totals.cost = round2(totals.cost);
    totals.profit = round2(totals.sell - totals.cost);

    return { date: reportDate, pharmacists, totals };
  }

  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  /**
   * يقرأ ArrayBuffer لملف PDF ويحلّله.
   */
  async function parsePdfBuffer(arrayBuffer, pdfjsLib) {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const result = await parseDocument(doc);
    try { await doc.destroy(); } catch (e) {}
    return result;
  }

  global.PharmaSalesParser = { parsePdfBuffer, parseDocument, round2 };
})(typeof window !== 'undefined' ? window : this);

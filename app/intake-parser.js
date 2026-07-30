/* Client-side PDF intake parser — Stores Issuing And Receiving Query */
(function (global) {
  const SUP_RE = /Source\s*:\s*\[SUPPLIERS\]\s*(\d{5,6})-(.+?)\s*,\s*Dest/;
  const SUP_ALT_RE = /Dest\s*:\s*\[STORES\][^,]+,\s*(.+?)\s*-Source\s*:\s*\[SUPPLIERS\]\s*(\d{5,6})\s+\d+\s*$/;
  const CORE_RE = /(\d{4})\s+(\d{2}-\d{2}-\d{4})\s+([\d.]+)\s+(\S+)\s+/;
  const CODE_RE = /(\d{1,2}-\d{2}-\d{3}-\d{3}|\d{10,11})\s+/;

  function fixSupplierName(name) {
    return (name || '').trim();
  }

  function fixSupplier(code, name) {
    const fixed = fixSupplierName(name);
    return `${code} - ${fixed}`.replace(/\s*-\s*-\s*/g, ' - ');
  }

  function preprocessLine(line) {
    return line
      .replace(/\s+/g, ' ')
      .replace(/(\d),(\d{3})\s+(\d{2}-\d{2}-\d{4})/g, '$1$2 $3')
      .replace(/([A-Za-z/])(\d{4})\s+(\d{2}-\d{2}-\d{4})/g, '$1 $2 $3');
  }

  function groupRows(items, yTol = 4) {
    if (!items.length) return [];
    const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
    const rows = [];
    for (const item of sorted) {
      const y = item.transform[5];
      let row = rows.find((r) => Math.abs(r.y - y) <= yTol);
      if (!row) {
        row = { y, parts: [] };
        rows.push(row);
      }
      row.parts.push({ x: item.transform[4], str: item.str });
    }
    return rows.map((r) => r.parts.sort((a, b) => a.x - b.x).map((p) => p.str).join(' ').trim());
  }

  function parseTextLine(line) {
    line = preprocessLine((line || '').trim());
    if (!line || !line.includes('[SUPPLIERS]')) return null;

    let supplierCode;
    let supplierName;
    let itemPart;

    const sm = line.match(SUP_RE);
    if (sm) {
      supplierCode = sm[1];
      supplierName = sm[2].trim();
      itemPart = line.slice(0, sm.index);
    } else {
      const am = line.match(SUP_ALT_RE);
      if (!am) return null;
      supplierName = am[1].trim();
      supplierCode = am[2];
      const destIdx = line.indexOf('Dest :');
      itemPart = destIdx >= 0 ? line.slice(0, destIdx) : line;
    }

    const supplier = fixSupplier(supplierCode, supplierName);
    const tm = itemPart.match(CORE_RE);
    if (!tm) return null;

    const head = itemPart.slice(0, tm.index);
    const codeIdx = head.search(CODE_RE);
    if (codeIdx < 0) return null;

    const cm = head.slice(codeIdx).match(/^(\d{1,2}-\d{2}-\d{3}-\d{3}|\d{10,11})\s+(.+)$/);
    if (!cm) return null;

    return {
      item_code: cm[1],
      item_name: cm[2].trim(),
      qty: tm[3],
      unit: tm[4],
      supplier,
      supplier_code: supplierCode,
    };
  }

  function buildSupplierList(items) {
    const byCode = {};
    items.forEach((item) => {
      const code = item.supplier_code;
      if (!byCode[code]) byCode[code] = { names: new Set(), items: [] };
      byCode[code].names.add(item.supplier);
      byCode[code].items.push(item);
    });

    return Object.entries(byCode).map(([code, info]) => {
      const name = [...info.names].sort((a, b) => b.length - a.length)[0];
      info.items.forEach((item) => { item.supplier = name; });
      return {
        name,
        code,
        items: info.items,
        item_count: info.items.length,
      };
    }).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }

  function buildDataFromLines(lines) {
    const items = [];
    for (const line of lines) {
      const parsed = parseTextLine(line);
      if (parsed) items.push(parsed);
    }
    const suppliers = buildSupplierList(items);
    return {
      meta: {
        total_items: items.length,
        total_suppliers: suppliers.length,
        source: 'ملف إدخال مرفوع',
      },
      suppliers,
      items,
    };
  }

  async function parsePdfBuffer(arrayBuffer, onProgress) {
    if (!global.pdfjsLib) throw new Error('مكتبة PDF غير محمّلة — تأكد من الاتصال بالإنترنت');
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const allLines = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      allLines.push(...groupRows(content.items));
      if (onProgress) onProgress(i, pdf.numPages);
    }
    const data = buildDataFromLines(allLines);
    if (!data.meta.total_suppliers) {
      throw new Error('لم يتم التعرف على بيانات في الملف — تأكد أنه ملف إدخال المستودع PDF بالصيغة الصحيحة');
    }
    return data;
  }

  global.IntakeParser = { parsePdfBuffer, parseTextLine, fixSupplier, buildSupplierList };
})(window);

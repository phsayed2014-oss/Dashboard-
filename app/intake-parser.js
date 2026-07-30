/* Client-side PDF intake parser — Stores Issuing And Receiving Query */
(function (global) {
  const SUP_RE = /Source\s*:\s*\[SUPPLIERS\]\s*(\d{5,6})-(.+?)\s*,\s*Dest/;
  const CORE_RE = /(\d{4})\s+(\d{2}-\d{2}-\d{4})\s+([\d.]+)\s+(\S+)\s+/;

  function fixSupplierName(name) {
    name = (name || '').trim();
    if (/[\u0600-\u06FF]/.test(name)) return name.split('').reverse().join('');
    return name;
  }

  function fixSupplier(code, name) {
    const fixed = fixSupplierName(name);
    return `${code} - ${fixed}`.replace(/\s*-\s*-\s*/g, ' - ');
  }

  function preprocessLine(line) {
    return line
      .replace(/(\d),(\d{3})\s+(\d{2}-\d{2}-\d{4})/g, '$1$2 $3')
      .replace(/([A-Za-z/])(\d{4})\s+(\d{2}-\d{2}-\d{4})/g, '$1 $2 $3');
  }

  function groupTextLines(items) {
    if (!items.length) return [];
    const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
    const lines = [];
    let current = { y: sorted[0].transform[5], parts: [] };
    for (const item of sorted) {
      const y = item.transform[5];
      if (Math.abs(y - current.y) > 6) {
        if (current.parts.length) lines.push(current.parts.join(' ').trim());
        current = { y, parts: [item.str] };
      } else {
        current.parts.push(item.str);
      }
    }
    if (current.parts.length) lines.push(current.parts.join(' ').trim());
    return lines;
  }

  function mergeBrokenLines(lines) {
    const merged = [];
    for (const line of lines) {
      const trimmed = (line || '').trim();
      if (!trimmed) continue;
      if (merged.length && !merged[merged.length - 1].includes('[SUPPLIERS]')) {
        merged[merged.length - 1] += ' ' + trimmed;
      } else {
        merged.push(trimmed);
      }
    }
    return merged;
  }

  function parseTextLine(line) {
    line = preprocessLine((line || '').trim());
    if (!line || !line.includes('[SUPPLIERS]')) return null;

    const sm = line.match(SUP_RE);
    if (!sm) return null;

    const supplierCode = sm[1];
    const supplier = fixSupplier(supplierCode, sm[2]);
    const before = line.slice(0, sm.index);
    const tm = before.match(CORE_RE);
    if (!tm) return null;

    const head = before.slice(0, tm.index).trim();
    const cm = head.match(/^([\d-]+)\s+(.+)$/);
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
    for (const line of mergeBrokenLines(lines)) {
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
      allLines.push(...groupTextLines(content.items));
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

/* Client-side PDF order parser — tuned for pdf.js text extraction */
(function (global) {
  const START_RE = /^(\d+)\s+(\d*)\s+([\d-]+)\s+(.+)$/;

  function fixSupplier(text) {
    text = (text || '').trim();
    if (/^\d{5,6}\s*-\s*/.test(text)) return text.replace(/\s*-\s*-\s*/g, ' - ');
    const m = text.match(/^(.+?)\s*-\s*(\d{5,6})$/);
    if (m) return `${m[2]} - ${m[1].trim()}`;
    const rev = text.match(/^(\d+)\s*-\s*(.+)$/);
    if (rev) {
      const name = rev[2].split('').reverse().join('').trim();
      return `${rev[1]} - ${name}`.replace(/\s*-\s*-\s*/g, ' - ');
    }
    return text;
  }

  function cleanOrderNo(orderNo) {
    const m = String(orderNo || '').match(/(PO-[\d-]+)/);
    return m ? m[1] : String(orderNo || '').trim();
  }

  function preprocessRest(rest) {
    return rest
      .replace(/(\d+Tablet\/)B(\d+)(\s)/g, '$1Box $2$3')
      .replace(/(\/Applicator\/)Applic(\d+)(\s)/g, '$1 $2$3')
      .replace(/(\d+Capsule\/Box)(\d+)(\s)/gi, '$1 $2$3')
      .replace(/(\d+TABLET\/BOX)(\d+)(\s)/gi, '$1 $2$3')
      .replace(/(\d+Tablet\/Box)(\d+)(\s)/g, '$1 $2$3')
      .replace(/(\d+MG\/1Tablet,\s*\d+)(\d+)(\s)/g, '$1 $2$3');
  }

  function completeNameSuffix(name) {
    name = name.replace(/\s+$/, '');
    if (name.endsWith('/Applic') && !name.endsWith('/Applicator')) {
      return name.endsWith('1Applicator/Applic') ? name.slice(0, -7) + '/Applicator' : name + 'ator';
    }
    if (name.endsWith('t/B') && !name.endsWith('t/Box')) return name.slice(0, -3) + 't/Box';
    if (name.endsWith('/B') && !name.endsWith('/Box')) return name.slice(0, -2) + '/Box';
    return name;
  }

  function fixQtyField(itemName, qty, bonus, totalQty) {
    let qtyS = String(qty ?? '').trim();
    const bonusS = String(bonus ?? '0').trim();
    const totalS = String(totalQty ?? '0').trim();
    if (/^[\d.]+$/.test(qtyS)) return [completeNameSuffix(itemName), qtyS, bonusS, totalS];
    let m = qtyS.match(/^([A-Za-z/]+?)(\d+(?:\.\d+)?)$/);
    if (m) return [completeNameSuffix(itemName + m[1]), m[2], bonusS, totalS];
    m = qtyS.match(/(\d+(?:\.\d+)?)$/);
    if (m) {
      const prefix = qtyS.slice(0, m.index);
      if (prefix) itemName += prefix;
      return [completeNameSuffix(itemName), m[1], bonusS, totalS];
    }
    return [completeNameSuffix(itemName), qtyS, bonusS, totalS];
  }

  function parseTail(rest) {
    rest = rest.trim();
    const po = rest.match(/\s+(PO-[\d-]+)\s+/);
    if (!po) return null;

    const order_no = cleanOrderNo(po[1]);
    const before = rest.slice(0, po.index).trim();
    const after = rest.slice(po.index + po[0].length).trim();
    const sup = after.match(/^(.+?)\s*-\s*(\d{5,6})\s*$/);
    if (!sup) return null;

    const nums = before.match(
      /([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d{2}-\d{2}-\d{4})\s*$/
    );
    if (!nums) return null;

    let itemName = before.slice(0, nums.index).trim();
    let qty = nums[1];
    let bonus = nums[2];
    let total_qty = nums[3];
    [itemName, qty, bonus, total_qty] = fixQtyField(itemName, qty, bonus, total_qty);

    return {
      qty, bonus, total_qty,
      dis1: nums[4], dis2: nums[5], sell_price: nums[6], unit_cost: nums[7],
      total_price: nums[8], total_cost: nums[9], po_date: nums[10],
      supplier: fixSupplier(`${sup[2]} - ${sup[1].trim()}`),
      order_no,
      item_name: itemName,
    };
  }

  function parseTextLine(line) {
    line = (line || '').trim();
    if (!line || line.startsWith('#') || !line.includes('PO-')) return null;
    const sm = line.match(START_RE);
    if (!sm) return null;
    const tail = parseTail(preprocessRest(sm[4]));
    if (!tail) return null;
    return {
      num: sm[1],
      intl_code: sm[2],
      item_code: sm[3],
      ...tail,
    };
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

  function buildSupplierList(orders) {
    const byCode = {};
    Object.entries(orders).forEach(([orderNo, order]) => {
      const code = order.supplier_code || (order.supplier || '').split(' - ')[0];
      if (!byCode[code]) byCode[code] = { names: new Set(), orders: [] };
      byCode[code].names.add(fixSupplier(order.supplier));
      if (!byCode[code].orders.includes(orderNo)) byCode[code].orders.push(orderNo);
    });
    return Object.entries(byCode).map(([code, info]) => {
      const name = [...info.names].sort((a, b) => b.length - a.length)[0];
      info.orders.forEach((orderNo) => {
        orders[orderNo].supplier = name;
        orders[orderNo].supplier_code = code;
      });
      return {
        name, code, orders: info.orders,
        order_count: info.orders.length,
        item_count: info.orders.reduce((s, o) => s + (orders[o]?.items.length || 0), 0),
      };
    }).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }

  function buildDataFromLines(lines) {
    const orders = {};
    for (const line of lines) {
      const parsed = parseTextLine(line);
      if (!parsed) continue;
      const { order_no: orderNo } = parsed;
      if (!orders[orderNo]) {
        orders[orderNo] = {
          order_no: orderNo,
          supplier: parsed.supplier,
          supplier_code: parsed.supplier.split(' - ')[0] || '',
          po_date: parsed.po_date,
          items: [],
        };
      }
      orders[orderNo].items.push({
        num: parsed.num,
        intl_code: parsed.intl_code,
        item_code: parsed.item_code,
        item_name: parsed.item_name,
        qty: parsed.qty,
        bonus: parsed.bonus,
        total_qty: parsed.total_qty,
        dis1: parsed.dis1,
        dis2: parsed.dis2,
        sell_price: parsed.sell_price,
        unit_cost: parsed.unit_cost,
        total_price: parsed.total_price,
        total_cost: parsed.total_cost,
      });
    }

    const supplierList = buildSupplierList(orders);
    return {
      meta: {
        total_orders: Object.keys(orders).length,
        total_suppliers: supplierList.length,
        total_items: Object.values(orders).reduce((s, o) => s + o.items.length, 0),
        source: 'ملف مرفوع',
      },
      suppliers: supplierList,
      orders,
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
      throw new Error('لم يتم التعرف على بيانات في الملف — تأكد أنه ملف طلبيات PDF بالصيغة الصحيحة');
    }
    return data;
  }

  global.OrdersParser = { parsePdfBuffer, parseTextLine, cleanOrderNo, fixSupplier, buildSupplierList };
})(window);

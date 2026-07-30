/* Client-side PDF order parser — mirrors scripts/extract_orders.py */
(function (global) {
  const TAIL_RE = new RegExp(
    '(?<qty>[\\d.]+)\\s+' +
    '(?<bonus>[\\d.]+)\\s+' +
    '(?<total_qty>[\\d.]+)\\s+' +
    '(?<dis1>[\\d.]+)\\s+' +
    '(?<dis2>[\\d.]+)\\s+' +
    '(?<sell_price>[\\d.]+)\\s+' +
    '(?<unit_cost>[\\d.]+)\\s+' +
    '(?<total_price>[\\d.]+)\\s+' +
    '(?<total_cost>[\\d.]+)\\s+' +
    '(?<po_date>\\d{2}-\\d{2}-\\d{4})\\s*' +
    '(?<supplier_code>\\d+)\\s*-\\s*' +
    '(?<supplier_raw>.+?)\\s+' +
    '(?<order_no>PO-[\\d-]+)$'
  );

  const START_RE = /^(\d+)\s+(\d*)\s+([\d-]+)\s+(.+)$/;

  function fixSupplier(text) {
    text = (text || '').trim();
    if (!text) return text;
    const m = text.match(/^(\d+)\s*-\s*(.+)$/);
    if (m) {
      let name = m[2].split('').reverse().join('').trim();
      name = name.replace(/\s*-\s*-\s*/g, ' - ');
      return `${m[1]} - ${name}`.replace(/\s*-\s*-\s*/g, ' - ');
    }
    if (/[\u0600-\u06FF]/.test(text)) return text.split('').reverse().join('');
    return text;
  }

  function cleanOrderNo(orderNo) {
    orderNo = (orderNo || '').trim();
    const m = orderNo.match(/(PO-[\d-]+)/);
    return m ? m[1] : orderNo;
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
      if (name.endsWith('1Applicator/Applic')) return name.slice(0, -'/Applic'.length) + '/Applicator';
      return name + 'ator';
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

    if (/^[\d.]+$/.test(totalS) && /^[\d.]+$/.test(bonusS)) {
      const derived = parseFloat(totalS) - parseFloat(bonusS);
      if (derived >= 0) qtyS = Number.isInteger(derived) ? String(derived) : String(derived);
    }
    return [completeNameSuffix(itemName), qtyS, bonusS, totalS];
  }

  function parseTextLine(line) {
    line = line.trim();
    if (!line || line.startsWith('#') || !line.includes('PO-')) return null;
    const sm = line.match(START_RE);
    if (!sm) return null;
    const [, num, intlCode, itemCode, restRaw] = sm;
    const rest = preprocessRest(restRaw);
    const tm = rest.match(TAIL_RE);
    if (!tm) return null;
    const t = tm.groups;
    let itemName = rest.slice(0, tm.index).trim();
    [itemName, t.qty, t.bonus, t.total_qty] = fixQtyField(itemName, t.qty, t.bonus, t.total_qty);
    return {
      num, intl_code: intlCode, item_code: itemCode, item_name: itemName,
      qty: t.qty, bonus: t.bonus, total_qty: t.total_qty,
      dis1: t.dis1, dis2: t.dis2, sell_price: t.sell_price, unit_cost: t.unit_cost,
      total_price: t.total_price, total_cost: t.total_cost,
      po_date: t.po_date,
      supplier: fixSupplier(`${t.supplier_code} - ${t.supplier_raw}`),
      order_no: cleanOrderNo(t.order_no),
    };
  }

  function groupTextLines(items) {
    if (!items.length) return [];
    const lines = [];
    let current = { y: items[0].transform[5], parts: [] };
    const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
    for (const item of sorted) {
      const y = item.transform[5];
      if (Math.abs(y - current.y) > 3) {
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
    const textLookup = {};
    for (const line of lines) {
      const parsed = parseTextLine(line);
      if (!parsed) continue;
      textLookup[`${parsed.order_no}|${parsed.item_code}|${parsed.num}`] = parsed;
    }

    const orders = {};
    const suppliers = {};
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
        if (!suppliers[parsed.supplier]) suppliers[parsed.supplier] = [];
        if (!suppliers[parsed.supplier].includes(orderNo)) suppliers[parsed.supplier].push(orderNo);
      }
      const key = `${parsed.order_no}|${parsed.item_code}|${parsed.num}`;
      const item = textLookup[key] || parsed;
      orders[orderNo].items.push({
        num: item.num, intl_code: item.intl_code, item_code: item.item_code,
        item_name: item.item_name, qty: item.qty, bonus: item.bonus, total_qty: item.total_qty,
        dis1: item.dis1, dis2: item.dis2, sell_price: item.sell_price, unit_cost: item.unit_cost,
        total_price: item.total_price, total_cost: item.total_cost,
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
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const allLines = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      allLines.push(...groupTextLines(content.items));
      if (onProgress) onProgress(i, pdf.numPages);
    }
    return buildDataFromLines(allLines);
  }

  global.OrdersParser = { parsePdfBuffer, parseTextLine, cleanOrderNo, fixSupplier, buildSupplierList };
})(window);

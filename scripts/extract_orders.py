#!/usr/bin/env python3
"""Extract purchase orders from PDF with column-alignment fixes."""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import pdfplumber

PDF_PATH = Path(sys.argv[1] if len(sys.argv) > 1 else
    "/home/ubuntu/.cursor/projects/workspace/uploads/_______d8c9.pdf")
OUT_JSON = Path(sys.argv[2] if len(sys.argv) > 2 else "/workspace/app/orders-data.json")


def fix_supplier(text):
    text = (text or "").strip()
    if not text:
        return text
    m = re.match(r"^(\d+)\s*-\s*(.+)$", text)
    if m:
        code, name = m.groups()
        name = name[::-1].strip()
        return re.sub(r"\s*-\s*-\s*", " - ", f"{code} - {name}")
    if re.search(r"[\u0600-\u06FF]", text):
        return text[::-1]
    return text


def supplier_code(name):
    name = fix_supplier(name)
    return name.split(" - ")[0] if " - " in name else ""


def build_supplier_list(orders):
    by_code = defaultdict(lambda: {"names": set(), "orders": []})
    for order_no, order in orders.items():
        code = order.get("supplier_code") or supplier_code(order.get("supplier", ""))
        canonical = fix_supplier(order.get("supplier", ""))
        by_code[code]["names"].add(canonical)
        if order_no not in by_code[code]["orders"]:
            by_code[code]["orders"].append(order_no)

    supplier_list = []
    for code, info in by_code.items():
        name = max(info["names"], key=len)
        for order_no in info["orders"]:
            orders[order_no]["supplier"] = name
            orders[order_no]["supplier_code"] = code
        supplier_list.append(
            {
                "name": name,
                "code": code,
                "order_count": len(info["orders"]),
                "item_count": sum(len(orders[o]["items"]) for o in info["orders"]),
                "total_price": round(
                    sum(
                        sum(to_num(i["total_price"]) for i in orders[o]["items"])
                        for o in info["orders"]
                    ),
                    2,
                ),
                "orders": info["orders"],
            }
        )
    return sorted(supplier_list, key=lambda x: x["name"])


def clean_order_no(order_no):
    order_no = (order_no or "").strip()
    m = re.search(r"(PO-[\d-]+)", order_no)
    return m.group(1) if m else order_no


def preprocess_rest(rest):
    rest = re.sub(r"(\d+Tablet/)B(\d+)(\s)", r"\1Box \2\3", rest)
    rest = re.sub(r"(/Applicator/)Applic(\d+)(\s)", r"\1 \2\3", rest)
    rest = re.sub(r"(\d+Capsule/Box)(\d+)(\s)", r"\1 \2\3", rest, flags=re.I)
    rest = re.sub(r"(\d+TABLET/BOX)(\d+)(\s)", r"\1 \2\3", rest, flags=re.I)
    rest = re.sub(r"(\d+Tablet/Box)(\d+)(\s)", r"\1 \2\3", rest)
    rest = re.sub(r"(\d+MG/1Tablet,\s*\d+)(\d+)(\s)", r"\1 \2\3", rest)
    return rest


def complete_name_suffix(name):
    name = name.rstrip()
    if name.endswith("/Applic") and not name.endswith("/Applicator"):
        if name.endswith("1Applicator/Applic"):
            return name[:-len("/Applic")] + "/Applicator"
        return name + "ator"
    if name.endswith("t/B") and not name.endswith("t/Box"):
        return name[:-3] + "t/Box"
    if name.endswith("/B") and not name.endswith("/Box"):
        return name[:-2] + "/Box"
    return name


def fix_qty_field(item_name, qty, bonus, total_qty):
    qty_s = str(qty or "").strip()
    bonus_s = str(bonus or "0").strip()
    total_s = str(total_qty or "0").strip()

    if re.fullmatch(r"[\d.]+", qty_s):
        return complete_name_suffix(item_name), qty_s, bonus_s, total_s

    m = re.match(r"^([A-Za-z/]+?)(\d+(?:\.\d+)?)$", qty_s)
    if m:
        prefix, num = m.groups()
        return complete_name_suffix(item_name + prefix), num, bonus_s, total_s

    m2 = re.search(r"(\d+(?:\.\d+)?)$", qty_s)
    if m2:
        num = m2.group(1)
        prefix = qty_s[: m2.start()]
        if prefix:
            item_name = item_name + prefix
        return complete_name_suffix(item_name), num, bonus_s, total_s

    if re.fullmatch(r"[\d.]+", total_s) and re.fullmatch(r"[\d.]+", bonus_s):
        try:
            derived = float(total_s) - float(bonus_s)
            if derived >= 0:
                qty_s = str(int(derived)) if derived == int(derived) else str(derived)
        except ValueError:
            pass
    return complete_name_suffix(item_name), qty_s, bonus_s, total_s


TAIL_RE = re.compile(
    r"(?P<qty>[\d.]+)\s+"
    r"(?P<bonus>[\d.]+)\s+"
    r"(?P<total_qty>[\d.]+)\s+"
    r"(?P<dis1>[\d.]+)\s+"
    r"(?P<dis2>[\d.]+)\s+"
    r"(?P<sell_price>[\d.]+)\s+"
    r"(?P<unit_cost>[\d.]+)\s+"
    r"(?P<total_price>[\d.]+)\s+"
    r"(?P<total_cost>[\d.]+)\s+"
    r"(?P<po_date>\d{2}-\d{2}-\d{4})\s*"
    r"(?P<supplier_code>\d+)\s*-\s*"
    r"(?P<supplier_raw>.+?)\s+"
    r"(?P<order_no>PO-[\d-]+)$"
)
START_RE = re.compile(r"^(?P<num>\d+)\s+(?P<intl_code>\d*)\s+(?P<item_code>[\d-]+)\s+(?P<rest>.+)$")


def parse_text_line(line):
    line = line.strip()
    if not line or line.startswith("#") or "PO-" not in line:
        return None
    sm = START_RE.match(line)
    if not sm:
        return None
    d = sm.groupdict()
    rest = preprocess_rest(d["rest"])
    tm = TAIL_RE.search(rest)
    if not tm:
        return None
    t = tm.groupdict()
    item_name = rest[: tm.start()].strip()
    item_name, qty, bonus, total_qty = fix_qty_field(
        item_name, t["qty"], t["bonus"], t["total_qty"]
    )
    return {
        "num": d["num"],
        "intl_code": d["intl_code"],
        "item_code": d["item_code"],
        "item_name": item_name,
        "qty": qty,
        "bonus": bonus,
        "total_qty": total_qty,
        "dis1": t["dis1"],
        "dis2": t["dis2"],
        "sell_price": t["sell_price"],
        "unit_cost": t["unit_cost"],
        "total_price": t["total_price"],
        "total_cost": t["total_cost"],
        "po_date": t["po_date"],
        "supplier": fix_supplier(t["supplier_code"] + " - " + t["supplier_raw"]),
        "order_no": clean_order_no(t["order_no"]),
    }


def is_header_row(row):
    return not row or not row[0] or row[0] in ("#", "International Code")


def is_empty_row(row):
    return not row or all(c is None or str(c).strip() == "" for c in row)


def to_num(v):
    try:
        return float(str(v).replace(",", ""))
    except ValueError:
        return 0


def extract():
    text_lookup = {}
    with pdfplumber.open(PDF_PATH) as pdf:
        for page in pdf.pages:
            for line in (page.extract_text() or "").split("\n"):
                parsed = parse_text_line(line)
                if parsed:
                    key = (parsed["order_no"], parsed["item_code"], parsed["num"])
                    text_lookup[key] = parsed

    orders, suppliers = {}, defaultdict(list)

    with pdfplumber.open(PDF_PATH) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            for table in page.extract_tables() or []:
                for row in table:
                    if is_header_row(row) or is_empty_row(row) or len(row) < 16:
                        continue
                    item_name = (row[3] or "").strip()
                    order_no = clean_order_no(row[15])
                    item_code = (row[2] or "").strip()
                    num = str(row[0] or "").strip()
                    if not order_no or not item_name:
                        continue

                    key = (order_no, item_code, num)
                    if key in text_lookup:
                        src = text_lookup[key]
                        item = {k: src[k] for k in [
                            "num", "intl_code", "item_code", "item_name", "qty", "bonus",
                            "total_qty", "dis1", "dis2", "sell_price", "unit_cost",
                            "total_price", "total_cost",
                        ]}
                        supplier_name = src["supplier"]
                        po_date = src["po_date"]
                    else:
                        item_name, qty, bonus, total_qty = fix_qty_field(
                            item_name, row[4], row[5], row[6]
                        )
                        item = {
                            "num": num,
                            "intl_code": row[1] or "",
                            "item_code": item_code,
                            "item_name": item_name,
                            "qty": qty,
                            "bonus": bonus,
                            "total_qty": total_qty,
                            "dis1": row[7] or "0",
                            "dis2": row[8] or "0",
                            "sell_price": row[9] or "0",
                            "unit_cost": row[10] or "0",
                            "total_price": row[11] or "0",
                            "total_cost": row[12] or "0",
                        }
                        supplier_name = fix_supplier(row[14])
                        po_date = row[13] or ""

                    if order_no not in orders:
                        orders[order_no] = {
                            "order_no": order_no,
                            "supplier": supplier_name,
                            "supplier_code": supplier_name.split(" - ")[0]
                            if " - " in supplier_name
                            else "",
                            "po_date": po_date,
                            "items": [],
                            "page": page_num,
                        }
                        suppliers[supplier_name].append(order_no)
                    orders[order_no]["items"].append(item)

    supplier_list = build_supplier_list(orders)

    return {
        "meta": {
            "total_orders": len(orders),
            "total_suppliers": len(supplier_list),
            "total_items": sum(len(o["items"]) for o in orders.values()),
            "source": "ملف الطلبيات",
        },
        "suppliers": supplier_list,
        "orders": orders,
    }


def main():
    data = extract()
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    js_path = OUT_JSON.with_suffix(".js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("window.ORDERS_DATA=")
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";")

    bad_qty = sum(
        1
        for o in data["orders"].values()
        for i in o["items"]
        if not re.fullmatch(r"[\d.]+", str(i["qty"]))
    )
    bad_orders = [k for k in data["orders"] if not k.startswith("PO-")]
    print("saved", data["meta"], "bad_qty", bad_qty, "bad_orders", len(bad_orders))


if __name__ == "__main__":
    main()

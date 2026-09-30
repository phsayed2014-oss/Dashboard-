# -*- coding: utf-8 -*-
"""يحسب المعادلات بمكتبة formulas ويكتب النتائج كقيم مخزنة داخل ملف xlsx (مع بقاء المعادلات)."""
import re
import shutil
import tempfile
import zipfile
from xml.sax.saxutils import escape

import formulas
import openpyxl


def _values(path):
    sol = formulas.ExcelModel().loads(path).finish().calculate()
    out = {}
    for k, v in sol.items():
        m = re.match(r"^'\[[^\]]+\](.+)'!([A-Z]+\d+)$", k)
        if not m:
            continue
        val = v.value[0][0] if hasattr(v, "value") else v
        out[(m.group(1).upper(), m.group(2))] = val
    return out


def embed(path):
    vals = _values(path)
    wb = openpyxl.load_workbook(path)
    # sheetN.xml -> sheet title (openpyxl writes them in order)
    titles = {f"xl/worksheets/sheet{i}.xml": ws.title.upper() for i, ws in enumerate(wb.worksheets, 1)}
    tmp = tempfile.mktemp(suffix=".xlsx")
    with zipfile.ZipFile(path) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename in titles:
                title = titles[item.filename]
                xml = data.decode("utf-8")

                def fix(m):
                    ref, attrs, formula = m.group(1), m.group(2), m.group(3)
                    v = vals.get((title, ref))
                    if v is None or (isinstance(v, str) and v == ""):
                        v_xml, t = "", ' t="str"'
                    elif isinstance(v, str):
                        v_xml, t = escape(v), ' t="str"'
                    else:
                        try:
                            f = float(v)
                        except (TypeError, ValueError):
                            return m.group(0)
                        v_xml, t = (str(int(f)) if f == int(f) else repr(f)), ""
                    attrs = re.sub(r'\s+t="[^"]*"', "", attrs)
                    return f'<c r="{ref}"{attrs}{t}><f>{formula}</f><v>{v_xml}</v></c>'

                xml = re.sub(r'<c r="([A-Z]+\d+)"([^>]*)><f>(.*?)</f><v\s*/>(?:</v>)?</c>', fix, xml)
                data = xml.encode("utf-8")
            zout.writestr(item, data)
    shutil.move(tmp, path)

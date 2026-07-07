"""Oracle Reports PDF parser — port of PharmaDash parsePDF() (X-anchors, NBSP, splitDS)."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import pdfplumber

from .normalize import normalize_section, normalize_status

SEC_WORDS = [
    "GASTROENTEROLOGY", "ENDOCRINOLOGY", "OPHTHALMOLOGY", "OPTHALMOLOGY",
    "RHEUMATOLOGY", "PULMONOLOGY", "PARACITIONER", "DERMATOLOGY", "ORTHOPAEDIC",
    "PSYCHIATRY", "OBSTETRICS", "PAEDIATRIC", "CARDIOLOGY", "NEPHROLOGY",
    "NEUROLOGY", "ONCOLOGY", "INTERNAL", "UROLOGY", "GENERAL", "SURGERY",
    "DENTAL", "RADIOLOGY", "GYNECOLOGY", "MEDICINE", "ENT",
]

COL_P = (0, 75)
COL_PN = (75, 243)
COL_SVC = (243, 476)
COL_ORD = (476, 535)
COL_ST = (535, 596)
COL_DS = (596, 1200)

HEADER_RE = re.compile(
    r"Patient No|Medication Orders|From Date|To Date|Doctor Name"
)
PATIENT_RE = re.compile(r"^\d{5,7}$")


def split_doctor_section(text: str) -> dict[str, str]:
    """Two-word / fused-word section matching — mirrors splitDS()."""
    words = text.split()
    if not words:
        return {"doctor": "", "section": ""}

    # Pass 1: fused word e.g. AbdelmoneemGENERAL
    for i, w in enumerate(words):
        wu = w.upper()
        if wu in SEC_WORDS:
            continue
        for sec in SEC_WORDS:
            idx = wu.find(sec)
            if idx > 0:
                doctor = " ".join(words[:i] + [w[:idx]]).strip()
                section = (w[idx:] + " " + " ".join(words[i + 1 :])).strip()
                return {"doctor": doctor, "section": section}

    # Pass 2: standalone section keyword
    for i, w in enumerate(words):
        if w.upper() in SEC_WORDS:
            return {
                "doctor": " ".join(words[:i]).strip(),
                "section": " ".join(words[i:]).strip(),
            }

    return {"doctor": text.strip(), "section": ""}


def _col_text(words: list[dict[str, Any]], col: tuple[int, int]) -> str:
    lo, hi = col
    parts = [w["text"] for w in words if lo <= w["x0"] < hi]
    return " ".join(parts).strip()


def _line_words(page: pdfplumber.page.Page, y_tol: float = 3.0) -> list[list[dict[str, Any]]]:
    """Group pdfplumber words into lines (Y-bucketed like JS round(y/3)*3)."""
    words = page.extract_words(x_tolerance=2, y_tolerance=2, keep_blank_chars=False)
    if not words:
        return []

    # pdfplumber top increases downward; bucket by top
    buckets: dict[float, list[dict[str, Any]]] = {}
    for w in words:
        text = (w.get("text") or "").strip()
        if not text:
            continue
        key = round(w["top"] / y_tol) * y_tol
        buckets.setdefault(key, []).append({"x0": w["x0"], "text": text})

    lines: list[list[dict[str, Any]]] = []
    for y in sorted(buckets.keys()):
        line = sorted(buckets[y], key=lambda x: x["x0"])
        lines.append(line)
    return lines


def parse_pdf_path(path: str | Path) -> list[dict[str, str]]:
    path = Path(path)
    rows: list[dict[str, str]] = []

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            for ws in _line_words(page):
                if not ws:
                    continue
                line_text = " ".join(w["text"] for w in ws)
                if HEADER_RE.search(line_text):
                    continue
                first = ws[0]["text"]
                if not PATIENT_RE.match(first):
                    continue

                ds = split_doctor_section(_col_text(ws, COL_DS))
                row = {
                    "patient": _col_text(ws, COL_P),
                    "patientName": _col_text(ws, COL_PN),
                    "service": _col_text(ws, COL_SVC),
                    "orderNo": _col_text(ws, COL_ORD),
                    "status": normalize_status(_col_text(ws, COL_ST)),
                    "doctor": ds["doctor"],
                    "section": normalize_section(ds["section"]),
                }
                if row["service"] or row["doctor"]:
                    rows.append(row)

    if not rows:
        raise ValueError(
            "لم أتمكن من تحليل الـ PDF — تأكد من أن الملف من Oracle Reports"
        )
    return rows


def package_branch_json(
    rows: list[dict[str, str]],
    *,
    branch: str = "T1",
    report_name: str = "",
    report_date: str = "",
    source_file: str = "",
) -> dict[str, Any]:
    from datetime import datetime, timezone

    return {
        "schema": "pharmaops/branch-data/v1",
        "branch": branch,
        "reportName": report_name or source_file or "Oracle PDF",
        "reportDate": report_date,
        "sourceFile": source_file,
        "parsedAt": datetime.now(timezone.utc).isoformat(),
        "rowCount": len(rows),
        "rows": rows,
    }

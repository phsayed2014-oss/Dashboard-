#!/usr/bin/env python3
"""PharmaOps parser CLI — deterministic PDF/Excel/CSV → clean JSON."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .excel_csv import parse_csv_path, parse_excel_path
from .pdf_oracle import package_branch_json, parse_pdf_path


def ingest_file(path: Path, branch: str) -> dict:
    name = path.name.lower()
    if name.endswith(".pdf"):
        rows = parse_pdf_path(path)
    elif name.endswith((".xlsx", ".xls")):
        rows = parse_excel_path(path)
    elif name.endswith(".csv"):
        rows = parse_csv_path(path)
    elif name.endswith(".json"):
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict) and "rows" in data:
            return data
        if isinstance(data, list):
            rows = data
        else:
            raise ValueError("JSON must be {rows:[...]} or a row array")
    else:
        raise ValueError("Unsupported format — pdf, xlsx, csv, json")

    return package_branch_json(
        rows,
        branch=branch,
        report_name=path.stem,
        source_file=path.name,
    )


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="PharmaOps: file → branch JSON")
    p.add_argument("input", type=Path, help="PDF, Excel, CSV, or JSON")
    p.add_argument("-o", "--output", type=Path, help="Output JSON path")
    p.add_argument("-b", "--branch", default="T1", choices=["T1", "T2", "T3"])
    p.add_argument("--pretty", action="store_true")
    args = p.parse_args(argv)

    try:
        payload = ingest_file(args.input, args.branch)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    out = args.output or args.input.with_suffix(".json")
    text = json.dumps(payload, ensure_ascii=False, indent=2 if args.pretty else None)
    out.write_text(text + "\n", encoding="utf-8")
    print(f"OK {payload['rowCount']} rows → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

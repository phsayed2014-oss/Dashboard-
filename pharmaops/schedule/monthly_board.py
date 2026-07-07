#!/usr/bin/env python3
"""Monthly board loop — aggregate outbox JSON → board report draft."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent))


def load_config() -> dict:
    cfg_path = ROOT / "schedule" / "config.yaml"
    if cfg_path.exists():
        return yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    example = ROOT / "schedule" / "config.example.yaml"
    if example.exists():
        return yaml.safe_load(example.read_text(encoding="utf-8")) or {}
    return {}


def aggregate_branch(rows_list: list[list[dict]]) -> dict:
    total = sum(len(r) for r in rows_list)
    doctors = set()
    drugs = set()
    for rows in rows_list:
        for r in rows:
            if r.get("doctor"):
                doctors.add(r["doctor"])
            if r.get("service"):
                drugs.add(r["service"])
    return {"totalRows": total, "uniqueDoctors": len(doctors), "uniqueDrugs": len(drugs)}


def run_monthly() -> int:
    cfg = load_config()
    outbox = Path(cfg.get("outbox", ROOT / "data" / "outbox"))
    board_dir = Path(cfg.get("board", ROOT / "data" / "board"))
    board_dir.mkdir(parents=True, exist_ok=True)

    by_branch: dict[str, list[list[dict]]] = {"T1": [], "T2": [], "T3": []}
    for path in sorted(outbox.glob("*.json")):
        if path.name.startswith("daily_log_") or path.name.startswith("board_"):
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        branch = data.get("branch", "T1")
        rows = data.get("rows") or []
        if branch in by_branch and rows:
            by_branch[branch].append(rows)

    month = datetime.now(timezone.utc).strftime("%Y-%m")
    draft = {
        "schema": "pharmaops/board-draft/v1",
        "month": month,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "branches": {b: aggregate_branch(rs) for b, rs in by_branch.items()},
        "sources": [p.name for p in outbox.glob("*.json") if not p.name.startswith(("daily_log_", "board_"))],
    }

    out = board_dir / f"board_draft_{month}.json"
    out.write_text(json.dumps(draft, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Board draft → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(run_monthly())

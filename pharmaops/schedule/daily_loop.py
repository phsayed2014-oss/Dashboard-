#!/usr/bin/env python3
"""
Daily loop — process inbox PDFs/Excel → JSON outbox + anomaly alerts.
Run via cron / Cursor schedule every morning.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent))

from pharmaops.parser.cli import ingest_file
from pharmaops.schedule.anomaly_detector import detect_zero_match_drugs, write_alerts

DEFAULT_WATCHLIST = [
    "XYLOMET", "REFLEX", "RIZER", "ORACURE", "INTIMO", "NOSTRIDERM",
    "JARDIANCE", "GLUCOPHAGE", "OMEPREX",
]


def load_config() -> dict:
    cfg_path = ROOT / "schedule" / "config.yaml"
    if cfg_path.exists():
        return yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    example = ROOT / "schedule" / "config.example.yaml"
    if example.exists():
        return yaml.safe_load(example.read_text(encoding="utf-8")) or {}
    return {}


def run_daily() -> int:
    cfg = load_config()
    inbox = Path(cfg.get("inbox", ROOT / "data" / "inbox"))
    outbox = Path(cfg.get("outbox", ROOT / "data" / "outbox"))
    alerts_dir = Path(cfg.get("alerts", ROOT / "data" / "alerts"))
    watchlist = cfg.get("watchlist", DEFAULT_WATCHLIST)
    branch_map = cfg.get("branch_file_prefix", {"T1": "t1", "T2": "t2", "T3": "t3"})

    inbox.mkdir(parents=True, exist_ok=True)
    outbox.mkdir(parents=True, exist_ok=True)

    processed = 0
    all_alerts = []
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    for path in sorted(inbox.iterdir()):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".pdf", ".xlsx", ".xls", ".csv"}:
            continue

        branch = "T1"
        name_lower = path.name.lower()
        for b, prefix in branch_map.items():
            if name_lower.startswith(prefix):
                branch = b
                break

        try:
            payload = ingest_file(path, branch)
            out = outbox / f"{branch}_{stamp}_{path.stem}.json"
            out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            processed += 1
            all_alerts.extend(detect_zero_match_drugs(payload["rows"], watchlist))
            print(f"OK {path.name} → {out.name} ({payload['rowCount']} rows)")
        except Exception as exc:
            print(f"FAIL {path.name}: {exc}", file=sys.stderr)

    alert_path = write_alerts(all_alerts, alerts_dir)
    if alert_path:
        print(f"ALERTS {len(all_alerts)} → {alert_path}")

    log = {
        "run": "daily",
        "date": stamp,
        "processed": processed,
        "alertCount": len(all_alerts),
    }
    (outbox / f"daily_log_{stamp}.json").write_text(
        json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return 0 if processed or not list(inbox.glob("*")) else 1


if __name__ == "__main__":
    raise SystemExit(run_daily())

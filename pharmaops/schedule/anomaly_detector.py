"""Anomaly detection — zero-match drugs (e.g. XYLOMET) → alerts."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def load_rows(path: Path) -> list[dict[str, str]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        return data.get("rows") or []
    return data


def detect_zero_match_drugs(
    rows: list[dict[str, str]],
    watchlist: list[str],
) -> list[dict[str, Any]]:
    alerts: list[dict[str, Any]] = []
    services = [(r.get("service") or "").lower() for r in rows]
    for drug in watchlist:
        key = drug.lower()
        matches = sum(1 for s in services if key in s)
        if matches == 0:
            alerts.append({
                "type": "zero_match",
                "drug": drug,
                "message": f"تنبيه: {drug} — صفر مطابقات في التقرير",
                "severity": "high",
            })
    return alerts


def write_alerts(alerts: list[dict[str, Any]], out_dir: Path) -> Path | None:
    if not alerts:
        return None
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    path = out_dir / f"alerts_{stamp}.json"
    path.write_text(
        json.dumps({"alerts": alerts, "generatedAt": datetime.now(timezone.utc).isoformat()},
                   ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return path

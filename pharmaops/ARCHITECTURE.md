# PharmaOps Architecture

Merged upgrade plan: **Canvas Premium UI** + **deterministic parser** + **scheduled loops** + **modular dashboard**.

## Principles

1. **Parser isolation** — PDF/Excel/CSV logic lives in `pharmaops/parser/` (Python) and `js/pharmaops-parser.js` (browser). UI files never re-implement X-anchors or splitDS.
2. **JSON handoff** — Python CLI: `file → branch.json`. Dashboard ingests JSON without re-parsing.
3. **No feature loss** — all existing sections, upload flows, charts, and themes remain.
4. **Loops need modules** — small files enable daily/monthly automation and safer agent edits.

## Data flow

```
┌─────────────┐     pharmaops/parser/cli.py      ┌──────────────┐
│ PDF / xlsx  │ ───────────────────────────────► │ branch.json  │
└─────────────┘                                    └──────┬───────┘
                                                          │
┌─────────────┐     js/pharmaops-parser.js (fallback)     │
│ Browser     │ ────────────────────────────────────────────┤
│ upload      │                                           ▼
└─────────────┘                                    ┌──────────────┐
                                                   │  Dashboard   │
                                                   │  aggregate() │
                                                   │  renderAll() │
                                                   └──────────────┘
```

## Directory layout

```
pharmaops/
├── ARCHITECTURE.md          ← this file
├── parser/                  ← Python — source of truth for scheduled jobs
│   ├── pdf_oracle.py        ← Oracle PDF (X-anchors, splitDS, NBSP)
│   ├── normalize.py
│   ├── excel_csv.py
│   ├── cli.py               ← python -m pharmaops.parser.cli file.pdf -b T1
│   └── tests/
├── schedule/
│   ├── daily_loop.py        ← morning: inbox → outbox + alerts
│   ├── monthly_board.py     ← month-end: board draft JSON
│   ├── anomaly_detector.py  ← zero-match drugs (XYLOMET, etc.)
│   └── config.example.yaml
├── data/
│   ├── inbox/               ← drop PDFs here for daily loop
│   ├── outbox/              ← parsed JSON
│   ├── alerts/
│   └── board/
└── scripts/
    └── bundle_dashboard.py  ← optional single-file HTML build

js/
├── pharmaops-parser.js      ← browser parser (same contract as Python)
└── auth.config.example.js   ← copy to auth.config.js (not committed)

pharmadash-visualization.html  ← shell (loads js modules)
```

## Schedule loops

| Loop | Script | When |
|------|--------|------|
| Daily report | `schedule/daily_loop.py` | Every morning — process inbox, update JSON, flag anomalies |
| Monthly board | `schedule/monthly_board.py` | 1st of month — aggregate outbox → board draft |
| Anomaly | `anomaly_detector.py` | Called by daily loop — `matches == 0` → alert file |

## Dashboard phases (UI)

| Phase | Status |
|-------|--------|
| Canvas Premium design | ✅ overview + upload bar |
| Parser externalized | ✅ `js/pharmaops-parser.js` |
| JSON upload | ✅ `.json` branch files |
| Dark + light theme | ✅ respects `rx-theme` localStorage |
| Auth externalized | ✅ optional `auth.config.js` |
| CSS/JS full split | 🔜 incremental — `bundle_dashboard.py` |

## Commands

```bash
# Parse PDF → JSON
python3 -m pharmaops.parser.cli report.pdf -b T1 -o out/T1.json --pretty

# Run tests
pytest pharmaops/parser/tests -q

# Daily loop
python3 pharmaops/schedule/daily_loop.py

# Monthly board
python3 pharmaops/schedule/monthly_board.py
```

## Quality gates

- Parser changes require `pytest pharmaops/parser/tests`
- UI changes must not touch `pharmaops/parser/` or `js/pharmaops-parser.js` unless parsing bug
- Both dark and light themes checked before merge

# PharmaOps

PharmaDash operational layer — **parser**, **schedules**, **modular dashboard**.

## Quick start

```bash
pip install -r pharmaops/parser/requirements.txt

# PDF → JSON (deterministic, tested)
python3 -m pharmaops.parser.cli report.pdf -b T1 -o pharmaops/data/outbox/T1.json --pretty

# Tests
PYTHONPATH=. python3 -m pytest pharmaops/parser/tests -q

# Daily morning loop (drop files in pharmaops/data/inbox/)
python3 pharmaops/schedule/daily_loop.py
```

## Dashboard

Open `pharmadash-visualization.html` in a browser (requires `js/pharmaops-parser.js` alongside).

Upload **PDF / Excel / CSV / JSON** per branch (التعاون 1–3).

Optional: copy `js/auth.config.example.js` → `js/auth.config.js` for credentials.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full merged plan.

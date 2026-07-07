#!/usr/bin/env python3
"""Inline external JS into pharmadash-visualization.html for single-file distribution."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT.parent / "pharmadash-visualization.html"
PARSER = ROOT.parent / "js" / "pharmaops-parser.js"
MARKER = "/* PHARMAOPS_PARSER_INLINE */"


def bundle() -> None:
    html = HTML.read_text(encoding="utf-8")
    parser_src = PARSER.read_text(encoding="utf-8")
    inline = f"<script>\n{MARKER}\n{parser_src}\n</script>"

    if 'src="js/pharmaops-parser.js"' in html:
        html = re.sub(
            r'<script[^>]*src="js/pharmaops-parser\.js"[^>]*></script>',
            inline,
            html,
            count=1,
        )
    elif MARKER not in html:
        html = html.replace("</head>", inline + "\n</head>", 1)

    HTML.write_text(html, encoding="utf-8")
    print(f"Bundled parser into {HTML}")


if __name__ == "__main__":
    bundle()

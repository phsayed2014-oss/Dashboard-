"""Apply the rxsales feature to PharmaDash bundle via anchored replacements."""
import re, json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bundle import read_app, write_app, inline_blocks

bundle, m, app = read_app()

edits = []
def rep(old, new, label):
    global app
    n = app.count(old)
    assert n == 1, 'ANCHOR FAIL [%s]: found %d' % (label, n)
    app = app.replace(old, new)
    edits.append(label)

def repN(old, new, label, expect=None):
    """Replace all occurrences; assert at least one (or an exact count)."""
    global app
    n = app.count(old)
    assert n >= 1, 'ANCHOR FAIL [%s]: found 0' % label
    if expect is not None:
        assert n == expect, 'COUNT [%s]: found %d expected %d' % (label, n, expect)
    app = app.replace(old, new)
    edits.append('%s(x%d)' % (label, n))

JS = open(os.path.join(os.path.dirname(__file__), 'rxsales_block.js'), encoding='utf-8').read()
CSS = open(os.path.join(os.path.dirname(__file__), 'rxsales_css.txt'), encoding='utf-8').read()

# 1) TITLES map — add rxsales title
rep(
    "    branches:'مقارنة الفروع', periods:'مقارنة زمنية'\n  };",
    "    branches:'مقارنة الفروع', periods:'مقارنة زمنية', rxsales:'الكتابة مقابل الصرف'\n  };",
    'TITLES')

# 2) showSection router — add rxsales branch before the final else
rep(
    "    else if(k==='periods'){ renderComparePeriods(); stub.classList.add('active'); }\n"
    "    else { stub.innerHTML = stubHtml(TITLES[k]||''); stub.classList.add('active'); }",
    "    else if(k==='periods'){ renderComparePeriods(); stub.classList.add('active'); }\n"
    "    else if(k==='rxsales'){ renderRxSales(); stub.classList.add('active'); }\n"
    "    else { stub.innerHTML = stubHtml(TITLES[k]||''); stub.classList.add('active'); }",
    'showSection')

# 3) STATE object — add sales slot
rep(
    "  const STATE = { T1:{periods:[]}, T2:{periods:[]}, T3:{periods:[]}, ALL:{periods:[]}, active:'T1' };",
    "  const STATE = { T1:{periods:[]}, T2:{periods:[]}, T3:{periods:[]}, ALL:{periods:[]}, active:'T1', sales:null };",
    'STATE')

# 4) onFile — route JSON to sales importer before the ALL guard
rep(
    "  async function onFile(f){\n"
    "    if(STATE.active==='ALL'){ alert('العرض المجمّع للقراءة فقط — اختر «التعاون الأول/الثاني/الثالث» لرفع ملف.'); return; }",
    "  async function onFile(f){\n"
    "    if(/\\.json$/i.test(f && f.name || '')){ onSalesFile(f); return; }\n"
    "    if(STATE.active==='ALL'){ alert('العرض المجمّع للقراءة فقط — اختر «التعاون الأول/الثاني/الثالث» لرفع ملف.'); return; }",
    'onFile-json')

# 5) insert rxsales block + boot restore just before the "// init" line
rep(
    "  // init\n"
    "  renderSelector(); renderBranchBody();\n"
    "})();",
    JS +
    "\n  // init\n"
    "  restoreSales();\n"
    "  renderSelector(); renderBranchBody();\n"
    "})();",
    'insert-block')

# 6) nav item — after "periods" button, before </nav>
NAV_ICON = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'
            '<path d="M12 3v18"></path><path d="M4 7h16"></path>'
            '<path d="M7 7 4 13a3 3 0 0 0 6 0z"></path><path d="M17 7l-3 6a3 3 0 0 0 6 0z"></path>'
            '<path d="M8 21h8"></path></svg>')
rep(
    "        <span>مقارنة زمنية</span>\n      </button>\n    </nav>",
    "        <span>مقارنة زمنية</span>\n      </button>\n"
    '      <button class="nav-item" data-k="rxsales">\n'
    '        <span class="ico">' + NAV_ICON + '</span>\n'
    "        <span>الكتابة مقابل الصرف</span>\n"
    "      </button>\n    </nav>",
    'nav-item')

# 7) fileInput accept — add .json
rep(
    'accept=".pdf,.xlsx,.xls,.csv"',
    'accept=".pdf,.xlsx,.xls,.csv,.json"',
    'fileInput-accept')

# 8) CSS — prepend rxsales styles before .alert-card block
rep(
    ".alert-card{ background:var(--rose-bg); border:1px solid var(--rose-fg);",
    CSS + "\n.alert-card{ background:var(--rose-bg); border:1px solid var(--rose-fg);",
    'css')

# 9) near-expiry comparison: collapse duplicate inventory batches to one row per
#    product (writings are per-product, so per-batch rows were identical duplicates).
#    Keep the most-urgent (fewest days remaining) batch as the representative.
rep(
    "      const rows = items.map(it=>{ const k=neKey(it.name); return { ...it, before:wB.get(k)||0, after:wN.get(k)||0 }; });",
    "      const _neUniq = new Map();\n"
    "      items.forEach(it=>{ const k=neKey(it.name); const ex=_neUniq.get(k); if(!ex || it.days<ex.days) _neUniq.set(k, it); });\n"
    "      const rows = [..._neUniq.values()].map(it=>{ const k=neKey(it.name); return { ...it, before:wB.get(k)||0, after:wN.get(k)||0 }; });",
    'ne-dedup')

# 10) THEME — Ocean Depths (teal accent · navy dark bg · seafoam/cream tints).
#     Recolours the design-system tokens + the accent hexes used in charts so the
#     whole UI (incl. rxsales) takes on the maritime palette. Semantic status
#     colours (blue/amber/rose/green/violet) are intentionally left intact.
# accent family (CSS token + charts + rxsales line/bar)
repN('#1d4ed8', '#2d8b8b', 'theme-accent')          # Deep teal
repN('#1741ab', '#236e6e', 'theme-accent-600')      # darker teal (hover)
repN('#3b6ef0', '#4ba3a3', 'theme-accent-2')        # secondary teal (charts)
repN('29,78,216', '45,139,139', 'theme-accent-rgb')  # every blue-accent tint → teal
repN('91,140,255', '84,184,184', 'theme-dark-accent-rgb')  # dark accent ring
# light palette tints
rep('--accent-soft:#eaf0ff;', '--accent-soft:#e6f4f3;', 'theme-accent-soft')
rep('--bg:#eef1f5;', '--bg:#eef5f4;', 'theme-bg')
rep('--surface-2:#f7f9fb;', '--surface-2:#f4faf8;', 'theme-surface2')
rep('linear-gradient(135deg,#eff7fd,#dcecf8 45%,#cfe4f4)',
    'linear-gradient(135deg,#eefaf9,#d6eeed 45%,#c3e6e5)', 'theme-canvas')
# dark palette → deep navy (#1a2332) surfaces + bright teal accent
rep('--bg:#0b1120;', '--bg:#0f1a24;', 'theme-dark-bg')
rep('--surface:rgba(17,24,39,.62);', '--surface:rgba(26,35,50,.62);', 'theme-dark-surface')
rep('--surface-2:#0f1626;', '--surface-2:#1a2332;', 'theme-dark-surface2')
rep('--line:#242c3d;', '--line:#2c3a48;', 'theme-dark-line')
rep('--line-soft:#1b2230;', '--line-soft:#212e3b;', 'theme-dark-line-soft')
rep('--accent:#5b8cff;', '--accent:#54b8b8;', 'theme-dark-accent')
rep('--accent-600:#4a76e6;', '--accent-600:#3f9c9c;', 'theme-dark-accent-600')
rep('--accent-soft:#182642;', '--accent-soft:#16302f;', 'theme-dark-accent-soft')

write_app(app, bundle, m)
print('Applied edits:', edits)
print('new app len', len(app))

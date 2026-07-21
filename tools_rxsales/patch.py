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

write_app(app, bundle, m)
print('Applied edits:', edits)
print('new app len', len(app))

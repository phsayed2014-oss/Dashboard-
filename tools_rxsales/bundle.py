"""Helpers to extract/repack the PharmaDash bundle template and run checks."""
import re, json, os, subprocess, sys

BUNDLE = os.environ.get('BUNDLE', 'PharmaDash_Pro_offline_3.html')

def read_app(path=BUNDLE):
    bundle = open(path, encoding='utf-8').read()
    m = re.search(r'(<script type="__bundler/template">)(.*?)(</script>)', bundle, re.S)
    app = json.loads(m.group(2).strip())
    return bundle, m, app

def write_app(app, bundle, m, path=BUNDLE):
    tpl = json.dumps(app, ensure_ascii=False).replace('</', '<\\/')
    assert json.loads(tpl) == app
    out = bundle[:m.start(2)] + '\n' + tpl + '\n' + bundle[m.end(2):]
    got = re.search(r'<script type="__bundler/template">(.*?)</script>', out, re.S).group(1).strip()
    assert json.loads(got) == app
    open(path, 'w', encoding='utf-8').write(out)

def inline_blocks(app):
    """Return list of (start, end, code) for each inline <script>...</script> block."""
    blocks = []
    for mm in re.finditer(r'<script>', app):
        s = mm.end()
        e = app.index('</script>', s)
        blocks.append((s, e, app[s:e]))
    return blocks

def node_check_all(app, workdir):
    os.makedirs(workdir, exist_ok=True)
    ok = True
    for i, (s, e, code) in enumerate(inline_blocks(app)):
        f = os.path.join(workdir, f'blk{i}.js')
        open(f, 'w', encoding='utf-8').write(code)
        r = subprocess.run(['node', '--check', f], capture_output=True, text=True)
        status = 'OK' if r.returncode == 0 else 'FAIL'
        if r.returncode != 0:
            ok = False
            print(f'blk{i} ({len(code)} chars): {status}')
            print(r.stderr[:2000])
        else:
            print(f'blk{i} ({len(code)} chars): {status}')
    return ok

if __name__ == '__main__':
    bundle, m, app = read_app()
    print('app len', len(app))
    blocks = inline_blocks(app)
    print('num inline blocks', len(blocks))
    if len(sys.argv) > 1 and sys.argv[1] == 'dump':
        wd = 'tools_rxsales/blocks'
        os.makedirs(wd, exist_ok=True)
        for i, (s, e, code) in enumerate(blocks):
            open(os.path.join(wd, f'blk{i}.js'), 'w', encoding='utf-8').write(code)
            print(f'blk{i}: {len(code)} chars -> {wd}/blk{i}.js')
    if len(sys.argv) > 1 and sys.argv[1] == 'check':
        node_check_all(app, 'tools_rxsales/blocks')

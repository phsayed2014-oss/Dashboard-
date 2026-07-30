import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const outputPaths = [
  join(root, 'PharmaDash-v3-medical-ready.html'),
  join(root, 'pharmdash v3 medical.html'),
  join(root, 'dist', 'PharmaDash-v3-medical-ready.html'),
];

function replaceExactlyOnce(source, marker, value) {
  const first = source.indexOf(marker);
  const last = source.lastIndexOf(marker);
  if (first < 0 || first !== last) throw new Error(`Expected one ${marker} marker`);
  return source.slice(0, first) + value + source.slice(first + marker.length);
}

export async function renderDashboard() {
  const [template, styles, app] = await Promise.all([
    readFile(join(root, 'src', 'PharmaDash.template.html'), 'utf8'),
    readFile(join(root, 'src', 'styles.css'), 'utf8'),
    readFile(join(root, 'src', 'app.js'), 'utf8'),
  ]);
  const coreBuild = await build({
    entryPoints: [join(root, 'src', 'core', 'index.mjs')],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'PharmaCore',
    target: ['es2020'],
    minify: false,
    legalComments: 'none',
    sourcemap: false,
  });
  const core = coreBuild.outputFiles[0].text.trim();
  const script = `${core}\n\n${app.trim()}\n//# sourceURL=pharmadash-app.js`;
  let html = replaceExactlyOnce(template, '/*__PHARMADASH_STYLES__*/', styles.trim());
  html = replaceExactlyOnce(html, '/*__PHARMADASH_APP__*/', script);
  return html.endsWith('\n') ? html : `${html}\n`;
}

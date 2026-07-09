import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const templatePath = join(root, 'src', 'PharmaDash.template.html');
const stylesPath = join(root, 'src', 'styles.css');
const appPath = join(root, 'src', 'app.js');
const canonicalPath = join(root, 'PharmaDash-v3-medical-ready.html');
const compatibilityPath = join(root, 'pharmdash v3 medical.html');
const distPath = join(root, 'dist', 'PharmaDash-v3-medical-ready.html');

function replaceExactlyOnce(source, marker, value) {
  const first = source.indexOf(marker);
  const last = source.lastIndexOf(marker);
  if (first < 0 || first !== last) throw new Error(`Expected one ${marker} marker`);
  return source.slice(0, first) + value + source.slice(first + marker.length);
}

const [template, styles, app] = await Promise.all([
  readFile(templatePath, 'utf8'),
  readFile(stylesPath, 'utf8'),
  readFile(appPath, 'utf8'),
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
html = html.endsWith('\n') ? html : `${html}\n`;

await mkdir(dirname(distPath), { recursive: true });
await Promise.all([
  writeFile(canonicalPath, html, 'utf8'),
  writeFile(compatibilityPath, html, 'utf8'),
  writeFile(distPath, html, 'utf8'),
]);

console.log(`Built ${distPath} (${Buffer.byteLength(html).toLocaleString('en-US')} bytes)`);

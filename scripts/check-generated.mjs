import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);
const paths = [
  join(root, 'PharmaDash-v3-medical-ready.html'),
  join(root, 'pharmdash v3 medical.html'),
  join(root, 'dist', 'PharmaDash-v3-medical-ready.html'),
];
const files = await Promise.all(paths.map((path) => readFile(path, 'utf8')));

if (!files.every((file) => file === files[0])) {
  throw new Error('Generated dashboard files are not byte-identical');
}
if (files[0].includes('/*__PHARMADASH_STYLES__*/') || files[0].includes('/*__PHARMADASH_APP__*/')) {
  throw new Error('Generated dashboard still contains a build marker');
}

const inlineScripts = [...files[0].matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
if (inlineScripts.length < 2) throw new Error(`Expected at least two inline scripts, got ${inlineScripts.length}`);

const temp = await mkdtemp(join(tmpdir(), 'pharmadash-check-'));
try {
  for (let index = 0; index < inlineScripts.length; index += 1) {
    const file = join(temp, `inline-${index}.js`);
    await writeFile(file, inlineScripts[index], 'utf8');
    const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (check.status !== 0) throw new Error(check.stderr || `Syntax check failed for inline script ${index}`);
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}

console.log(`Generated files match; ${inlineScripts.length} inline scripts passed syntax checks.`);

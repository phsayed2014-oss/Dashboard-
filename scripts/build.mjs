import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { outputPaths, renderDashboard } from './build-dashboard.mjs';

const html = await renderDashboard();
await mkdir(dirname(outputPaths.at(-1)), { recursive: true });
await Promise.all(outputPaths.map((path) => writeFile(path, html, 'utf8')));

console.log(`Built ${outputPaths.at(-1)} (${Buffer.byteLength(html).toLocaleString('en-US')} bytes)`);

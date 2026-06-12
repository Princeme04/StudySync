import { gzipSync } from 'node:zlib';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const distDir = resolve('dist');
const assetsDir = join(distDir, 'assets');
const files = readdirSync(assetsDir).map((name) => join(assetsDir, name));

const totals = files.reduce((result, file) => {
  const extension = extname(file);
  const bytes = readFileSync(file);
  if (extension === '.js') {
    result.jsRaw += bytes.length;
    result.jsGzip += gzipSync(bytes).length;
  }
  if (extension === '.css') {
    result.cssRaw += bytes.length;
    result.cssGzip += gzipSync(bytes).length;
  }
  return result;
}, { jsRaw: 0, jsGzip: 0, cssRaw: 0, cssGzip: 0 });

const budgets = {
  jsRaw: 450 * 1024,
  jsGzip: 130 * 1024,
  cssRaw: 70 * 1024,
  cssGzip: 15 * 1024,
  indexHtml: 10 * 1024
};
const measured = { ...totals, indexHtml: statSync(join(distDir, 'index.html')).size };
const failures = Object.entries(budgets)
  .filter(([key, budget]) => measured[key as keyof typeof measured] > budget)
  .map(([key, budget]) => `${key}: ${measured[key as keyof typeof measured]} bytes exceeds ${budget} bytes`);

console.log(JSON.stringify({ measured, budgets }, null, 2));
if (failures.length) throw new Error(`Performance budgets failed:\n${failures.join('\n')}`);

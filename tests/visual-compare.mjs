/**
 * Compares two directories of screenshots produced by visual-capture.mjs.
 *
 * Usage: node tests/visual-compare.mjs <expected-dir> <actual-dir>
 *
 * Exits with a non-zero status when any image differs by more than the tolerance.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const pixelmatchModule = require('pixelmatch');
const pixelmatch = pixelmatchModule.default ?? pixelmatchModule;

const MAX_DIFFERING_PIXELS = 25;

const [expectedDirectory, actualDirectory] = process.argv
  .slice(2)
  .map((value) => path.resolve(value));
const screenshotNames = fs.readdirSync(expectedDirectory).filter((name) => name.endsWith('.png'));
let failures = 0;

for (const name of screenshotNames) {
  const expected = PNG.sync.read(fs.readFileSync(path.join(expectedDirectory, name)));
  const actual = PNG.sync.read(fs.readFileSync(path.join(actualDirectory, name)));
  const sameSize = expected.width === actual.width && expected.height === actual.height;
  const differingPixels = sameSize
    ? pixelmatch(expected.data, actual.data, null, expected.width, expected.height, {
        threshold: 0.1,
      })
    : Infinity;
  const passed = differingPixels <= MAX_DIFFERING_PIXELS;

  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}  (${differingPixels} differing pixels)`);
  failures += passed ? 0 : 1;
}

process.exit(failures === 0 ? 0 : 1);

/**
 * Runs the complete regression suite against a fresh build.
 *
 * Steps:
 *   1. Build dist/microverse.html.
 *   2. Fingerprint every specimen model and compare with tests/baseline/fingerprints.json.
 *   3. Capture screenshots and compare them with tests/baseline/screenshots.
 *   4. Record computed styles and compare them with tests/baseline/computed-styles.json.gz.
 *
 * Usage: node tests/run-all.mjs
 * Requires Playwright (set NODE_PATH to its location if it is installed globally).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselineDirectory = path.join(projectRoot, 'tests', 'baseline');
const builtPage = path.join(projectRoot, 'dist', 'microverse.html');
const workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'microverse-tests-'));

/**
 * Runs a node script, streaming its output, and returns whether it succeeded.
 *
 * @param {string} label Name shown in the summary.
 * @param {string[]} nodeArguments
 * @returns {boolean}
 */
function runStep(label, nodeArguments) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, nodeArguments, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  return result.status === 0;
}

/**
 * Compares two fingerprint files, including the order of the specimen library.
 *
 * @returns {boolean}
 */
function compareFingerprints(expectedPath, actualPath) {
  const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
  const actual = JSON.parse(fs.readFileSync(actualPath, 'utf8'));
  const expectedIds = Object.keys(expected.fingerprints);
  const actualIds = Object.keys(actual.fingerprints);
  const mismatched = expectedIds.filter(
    (id) => JSON.stringify(expected.fingerprints[id]) !== JSON.stringify(actual.fingerprints[id]),
  );
  const sameOrder = JSON.stringify(expectedIds) === JSON.stringify(actualIds);

  mismatched.forEach((id) => console.log(`  DIFF ${id}`));
  console.log(`  ${expectedIds.length} specimens, library order identical: ${sameOrder}`);
  console.log(`  runtime errors: ${JSON.stringify(actual.errors)}`);
  return mismatched.length === 0 && sameOrder && actual.errors.length === 0;
}

const fingerprintsPath = path.join(workDirectory, 'fingerprints.json');
const screenshotsPath = path.join(workDirectory, 'screenshots');
const computedStylesPath = path.join(workDirectory, 'computed-styles.json');
const expectedStylesPath = path.join(workDirectory, 'expected-computed-styles.json');

fs.writeFileSync(
  expectedStylesPath,
  zlib.gunzipSync(fs.readFileSync(path.join(baselineDirectory, 'computed-styles.json.gz'))),
);

const results = [];

results.push(['build', runStep('Build', ['scripts/build.mjs'])]);
results.push([
  'behaviour',
  runStep('Model fingerprints', ['tests/behaviour.mjs', builtPage, fingerprintsPath]),
]);
console.log('\n=== Fingerprint comparison ===');
results.push([
  'fingerprint comparison',
  compareFingerprints(path.join(baselineDirectory, 'fingerprints.json'), fingerprintsPath),
]);
results.push([
  'screenshots',
  runStep('Capture screenshots', ['tests/visual-capture.mjs', builtPage, screenshotsPath]),
]);
results.push([
  'visual comparison',
  runStep('Compare screenshots', [
    'tests/visual-compare.mjs',
    path.join(baselineDirectory, 'screenshots'),
    screenshotsPath,
  ]),
]);
results.push([
  'computed styles',
  runStep('Record computed styles', ['tests/computed-styles.mjs', builtPage, computedStylesPath]),
]);
results.push([
  'style comparison',
  runStep('Compare computed styles', [
    'tests/computed-styles-compare.mjs',
    expectedStylesPath,
    computedStylesPath,
  ]),
]);

fs.rmSync(workDirectory, { recursive: true, force: true });

console.log('\n=== Summary ===');
results.forEach(([label, passed]) => console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}`));
process.exit(results.every(([, passed]) => passed) ? 0 : 1);

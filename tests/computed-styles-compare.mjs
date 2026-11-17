/**
 * Compares two files written by computed-styles.mjs.
 *
 * Usage: node tests/computed-styles-compare.mjs <expected.json> <actual.json>
 *
 * Prints every element group whose computed style differs, with the changed properties,
 * and exits with a non-zero status when anything differs.
 */
import fs from 'node:fs';
import path from 'node:path';

const [expectedPath, actualPath] = process.argv.slice(2).map((value) => path.resolve(value));
const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
const actual = JSON.parse(fs.readFileSync(actualPath, 'utf8'));
const MAX_REPORTED = 25;

/** @returns {string[]} property: value pairs that differ between two serialised styles. */
function describeDifferences(expectedText, actualText) {
  const toMap = (text) =>
    new Map(
      text
        .split(';')
        .map((pair) => [pair.slice(0, pair.indexOf(':')), pair.slice(pair.indexOf(':') + 1)]),
    );
  const expectedStyle = toMap(expectedText);
  const actualStyle = toMap(actualText);
  const differences = [];

  for (const [property, value] of expectedStyle) {
    if (actualStyle.get(property) !== value) {
      differences.push(`${property}: ${value} -> ${actualStyle.get(property)}`);
    }
  }

  return differences;
}

const problems = [];

for (const key of Object.keys(expected)) {
  const match = actual[key];

  if (!match) {
    problems.push(`missing in new build: ${key}`);
  } else if (
    expected[key].checksums.slice().sort().join() !== match.checksums.slice().sort().join()
  ) {
    problems.push(
      `${key}\n      ${describeDifferences(expected[key].sample, match.sample).slice(0, 6).join('\n      ') || '(differs in repeated elements)'}`,
    );
  }
}

for (const key of Object.keys(actual)) {
  if (!expected[key]) {
    problems.push(`new element group: ${key}`);
  }
}

console.log(`  ${Object.keys(expected).length} element groups compared, ${problems.length} differ`);
problems.slice(0, MAX_REPORTED).forEach((problem) => console.log(`  - ${problem}`));
process.exit(problems.length === 0 ? 0 : 1);

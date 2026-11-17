/**
 * Builds MICROVERSE into a single self-contained HTML file.
 *
 * Usage: node scripts/build.mjs [--unminified] [--output <file>]
 *
 *   1. Concatenates the stylesheets in styles/ (order is fixed below).
 *   2. Bundles the JavaScript (and three.js) with esbuild.
 *   3. Inlines both into src/index.template.html.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE_PATH = path.join(PROJECT_ROOT, 'src', 'index.template.html');
const STYLES_DIRECTORY = path.join(PROJECT_ROOT, 'styles');
const DEFAULT_OUTPUT_PATH = path.join(PROJECT_ROOT, 'dist', 'microverse.html');

/**
 * Stylesheet order matters: later files may override earlier ones.
 * Tokens come first because every other file reads them.
 */
const STYLESHEET_ORDER = [
  'tokens',
  'base',
  'layout',
  'navigation-bar',
  'specimen-library',
  'viewer-stage',
  'info-panel',
  'size-comparison',
  'overlays',
  'welcome-screen',
];

const STYLES_PLACEHOLDER = '/* build:styles */';
const SCRIPT_PLACEHOLDER = '<!-- build:script -->';

/** Reads the command line flags. */
function parseArguments(argumentList) {
  const outputIndex = argumentList.indexOf('--output');

  return {
    shouldMinify: !argumentList.includes('--unminified'),
    outputPath:
      outputIndex === -1 ? DEFAULT_OUTPUT_PATH : path.resolve(argumentList[outputIndex + 1]),
  };
}

/** Returns the stylesheets joined in cascade order. */
function readStyles() {
  const unlisted = fs
    .readdirSync(STYLES_DIRECTORY)
    .map((fileName) => path.basename(fileName, '.css'))
    .filter((name) => !STYLESHEET_ORDER.includes(name));

  if (unlisted.length > 0) {
    throw new Error(`Stylesheets missing from STYLESHEET_ORDER: ${unlisted.join(', ')}`);
  }

  return STYLESHEET_ORDER.map((name) =>
    fs.readFileSync(path.join(STYLES_DIRECTORY, `${name}.css`), 'utf8'),
  ).join('\n');
}

/** Bundles the application entry point and returns the JavaScript text. */
async function bundleScript(shouldMinify) {
  const result = await build({
    entryPoints: [path.join(PROJECT_ROOT, 'src', 'main.js')],
    bundle: true,
    write: false,
    format: 'iife',
    target: 'es2020',
    minify: shouldMinify,
    logLevel: 'warning',
  });

  // "</script" inside the bundle would end the inline script element early.
  return result.outputFiles[0].text.replaceAll('</script', '<\\/script');
}

async function main() {
  const { shouldMinify, outputPath } = parseArguments(process.argv.slice(2));
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const script = await bundleScript(shouldMinify);
  const page = template
    .replace(STYLES_PLACEHOLDER, () => readStyles())
    .replace(SCRIPT_PLACEHOLDER, () => `<script>\n${script}\n</script>`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, page);
  console.log(
    `Wrote ${path.relative(PROJECT_ROOT, outputPath)} (${Math.round(page.length / 1024)} KB)`,
  );
}

await main();

/**
 * Shared Playwright helpers for the MICROVERSE test-suite.
 *
 * Playwright is resolved from the project's node_modules first and from the
 * globally installed packages (NODE_PATH) second, so the suite also runs in
 * environments where a browser has been pre-installed.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const DEFAULT_BUILD_PATH = path.join(PROJECT_ROOT, 'dist', 'microverse.html');

/** Chromium flags that enable software WebGL so the 3D scene renders without a GPU. */
const SOFTWARE_WEBGL_FLAGS = [
  '--use-gl=swiftshader',
  '--enable-webgl',
  '--ignore-gpu-blocklist',
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
];

/** Console messages that are caused by the sandbox (blocked web-font requests), not by the app. */
const IGNORED_CONSOLE_ERRORS = /ERR_TUNNEL|Failed to load resource/;

/**
 * Launches Chromium with software WebGL enabled.
 * @returns {Promise<import('playwright').Browser>}
 */
export function launchBrowser() {
  return chromium.launch({ args: SOFTWARE_WEBGL_FLAGS });
}

/**
 * Opens a page and records every uncaught exception and console error.
 * @param {import('playwright').Browser | import('playwright').BrowserContext} browserOrContext
 * @returns {Promise<{ page: import('playwright').Page, errors: string[] }>}
 */
export async function openRecordedPage(browserOrContext) {
  const page = await browserOrContext.newPage();
  const errors = [];

  page.on('pageerror', (error) => {
    errors.push(`PAGE ERROR: ${error.message.slice(0, 400)}`);
  });

  page.on('console', (message) => {
    const isError = message.type() === 'error';

    if (isError && !IGNORED_CONSOLE_ERRORS.test(message.text())) {
      errors.push(`CONSOLE: ${message.text().slice(0, 300)}`);
    }
  });

  return { page, errors };
}

/**
 * Loads the build, optionally deep-linking to a specimen (which skips the welcome screen),
 * and waits until the explorer has a specimen on screen.
 * @param {import('playwright').Page} page
 * @param {string} buildPath Absolute path to the built HTML file.
 * @param {string} [specimenId] Specimen to open directly.
 */
export async function openExplorer(page, buildPath, specimenId) {
  const hash = specimenId ? `#${specimenId}` : '';

  // Thumbnails are rendered asynchronously, so they are switched off for repeatable screenshots.
  await page.addInitScript(() => {
    window.__noThumbs = true;
  });

  await page.goto(`file://${buildPath}${hash}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__mv && window.__mv.cur, null, { timeout: 120000 });
}

/**
 * Prints a labelled result line and returns whether the check passed.
 * @param {string} label
 * @param {boolean} passed
 * @param {string} [detail]
 * @returns {boolean}
 */
export function report(label, passed, detail = '') {
  const status = passed ? 'PASS' : 'FAIL';
  const suffix = detail ? `  (${detail})` : '';

  console.log(`  [${status}] ${label}${suffix}`);

  return passed;
}

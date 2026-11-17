/**
 * Records the computed CSS of every element in every major UI state.
 *
 * Usage: node tests/computed-styles.mjs <build.html> <output.json>
 *
 * Screenshots catch visible regressions; this catches everything else (hover-free,
 * but including hidden panels and overlays). Elements are grouped by their tag,
 * id, classes and ancestry, and each group stores a checksum per distinct style.
 * Custom properties are skipped so that renaming them is not reported as a change.
 */
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser, openRecordedPage, openExplorer } from './support/browser.mjs';

const [buildPath, outputPath] = process.argv.slice(2).map((value) => path.resolve(value));

const DESKTOP_VIEWPORT = { width: 1440, height: 860 };
const NARROW_VIEWPORT = { width: 900, height: 800 };
const PHONE_VIEWPORT = { width: 390, height: 800 };

/**
 * Runs inside the page. Returns { key: { checksums: string[], sample: string } }.
 * @param {string} stateName Prefix added to every key.
 */
function collectComputedStyles(stateName) {
  const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'HEAD', 'CANVAS']);
  const records = {};

  function checksumOf(text) {
    let hash = 2166136261;

    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16);
  }

  function signatureOf(element) {
    const id = element.id ? `#${element.id}` : '';
    const classes = [...element.classList].sort().join('.');

    return `${element.tagName.toLowerCase()}${id}${classes ? `.${classes}` : ''}`;
  }

  function ancestrySignature(element) {
    const signatures = [];

    for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
      signatures.unshift(signatureOf(node));
    }

    return signatures.join(' > ');
  }

  function styleText(element) {
    const computed = getComputedStyle(element);
    const declarations = [];

    for (let index = 0; index < computed.length; index += 1) {
      const property = computed[index];

      if (!property.startsWith('--')) {
        declarations.push(`${property}:${computed.getPropertyValue(property)}`);
      }
    }

    return declarations.sort().join(';');
  }

  for (const element of document.body.querySelectorAll('*')) {
    if (
      IGNORED_TAGS.has(element.tagName) ||
      (element.closest('svg') !== null && element.tagName !== 'svg')
    ) {
      continue;
    }

    const key = `${stateName} :: ${ancestrySignature(element)}`;
    const text = styleText(element);
    const checksum = checksumOf(text);
    records[key] ||= { checksums: [], sample: text };

    if (!records[key].checksums.includes(checksum)) {
      records[key].checksums.push(checksum);
    }
  }

  return records;
}

/** Hides animated pixels and stops CSS animation so values that change over time are stable. */
async function freeze(page) {
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });
  await page.waitForTimeout(500);
}

async function record(page, stateName, results) {
  Object.assign(results, await page.evaluate(collectComputedStyles, stateName));
}

async function recordDesktopStates(browser, results) {
  const { page } = await openRecordedPage(browser);

  await page.setViewportSize(DESKTOP_VIEWPORT);
  await page.addInitScript(() => {
    window.__noThumbs = true;
  });
  await page.goto(`file://${buildPath}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('#intro');
  await freeze(page);
  await record(page, 'welcome', results);
  await page.close();

  const { page: explorer } = await openRecordedPage(browser);

  await explorer.setViewportSize(DESKTOP_VIEWPORT);
  await openExplorer(explorer, buildPath, 'diatom');
  await freeze(explorer);
  await record(explorer, 'explorer', results);

  for (const view of ['library', 'compare', 'journal', 'about', 'anatomy']) {
    await explorer.evaluate((viewName) => window.__mv.setView(viewName), view);
    await explorer.waitForTimeout(300);
    await record(explorer, `view-${view}`, results);
  }

  await explorer.evaluate(() => window.__mv.setView('explore'));
  await explorer.evaluate(() => {
    ['btnLib', 'btnPanel', 'btnNav'].forEach((id) => document.getElementById(id).click());
  });
  await record(explorer, 'collapsed', results);
  await explorer.close();
}

async function recordResponsiveStates(browser, results) {
  const { page: narrow } = await openRecordedPage(browser);

  await narrow.setViewportSize(NARROW_VIEWPORT);
  await openExplorer(narrow, buildPath, 'diatom');
  await freeze(narrow);
  await record(narrow, 'narrow', results);
  await narrow.close();

  const phoneContext = await browser.newContext({
    viewport: PHONE_VIEWPORT,
    isMobile: true,
    hasTouch: true,
  });
  const { page: phone } = await openRecordedPage(phoneContext);

  await openExplorer(phone, buildPath, 'diatom');
  await freeze(phone);
  await record(phone, 'phone', results);
  await phone.evaluate(() => document.getElementById('btnSpecs').click());
  await record(phone, 'phone-library-open', results);
  await phone.evaluate(() => document.getElementById('btnInfo').click());
  await record(phone, 'phone-details-open', results);
  await phoneContext.close();
}

const results = {};
const browser = await launchBrowser();

await recordDesktopStates(browser, results);
await recordResponsiveStates(browser, results);
await browser.close();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(results)}\n`);

console.log(`${Object.keys(results).length} element groups recorded`);

/**
 * Captures a fixed set of UI screenshots from a built page.
 *
 * Usage: node tests/visual-capture.mjs <build.html> <output-directory>
 *
 * The 3D canvas is animated, so the viewer stage is hidden before every
 * screenshot. What remains (navigation, panels, overlays) is deterministic and
 * can be compared pixel-for-pixel between two builds with visual-compare.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser, openRecordedPage, openExplorer } from './support/browser.mjs';

const [buildPath, outputDirectory] = process.argv.slice(2).map((value) => path.resolve(value));

const DESKTOP_VIEWPORT = { width: 1440, height: 860 };
const NARROW_VIEWPORT = { width: 900, height: 800 };
const PHONE_VIEWPORT = { width: 390, height: 800 };

/** Stops CSS animations and hides every animated canvas so that screenshots are repeatable. */
const FREEZE_STYLES = `
  #stage canvas, #gl, #introCv, #tip, .halo { visibility: hidden !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
`;

/** Hides everything that animates so screenshots are repeatable. */
async function freezeAnimatedContent(page) {
  await page.addStyleTag({
    content: FREEZE_STYLES,
  });
}

async function capture(page, fileName) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outputDirectory, fileName), timeout: 180000 });
}

async function captureWelcomeScreens(browser) {
  for (const [name, viewport] of [
    ['desktop', DESKTOP_VIEWPORT],
    ['phone', PHONE_VIEWPORT],
  ]) {
    const { page } = await openRecordedPage(browser);

    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      window.__noThumbs = true;
    });
    await page.goto(`file://${buildPath}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('#intro');
    await page.addStyleTag({ content: FREEZE_STYLES });
    await capture(page, `${name}-welcome.png`);
    await page.close();
  }
}

async function captureDesktopViews(browser) {
  const { page } = await openRecordedPage(browser);

  await page.setViewportSize(DESKTOP_VIEWPORT);
  await openExplorer(page, buildPath, 'diatom');
  await freezeAnimatedContent(page);
  await capture(page, 'desktop-explorer.png');

  for (const view of ['compare', 'journal', 'about']) {
    await page.evaluate((viewName) => window.__mv.setView(viewName), view);
    await capture(page, `desktop-${view}.png`);
    await page.evaluate(() => document.querySelector('.ov.show [data-close]')?.click());
  }

  await page.evaluate(() => {
    ['btnLib', 'btnPanel', 'btnNav'].forEach((id) => document.getElementById(id).click());
  });
  await capture(page, 'desktop-collapsed.png');
  await page.close();
}

async function captureResponsiveViews(browser) {
  const { page: narrowPage } = await openRecordedPage(browser);

  await narrowPage.setViewportSize(NARROW_VIEWPORT);
  await openExplorer(narrowPage, buildPath, 'diatom');
  await freezeAnimatedContent(narrowPage);
  await capture(narrowPage, 'narrow-explorer.png');
  await narrowPage.close();

  const phoneContext = await browser.newContext({
    viewport: PHONE_VIEWPORT,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const { page: phonePage } = await openRecordedPage(phoneContext);

  await openExplorer(phonePage, buildPath, 'diatom');
  await freezeAnimatedContent(phonePage);
  await capture(phonePage, 'phone-explorer.png');
  await phonePage.evaluate(() => document.getElementById('btnSpecs').click());
  await capture(phonePage, 'phone-library-open.png');
  await phoneContext.close();
}

fs.mkdirSync(outputDirectory, { recursive: true });

const browser = await launchBrowser();

await captureWelcomeScreens(browser);
await captureDesktopViews(browser);
await captureResponsiveViews(browser);
await browser.close();

console.log(`Screenshots written to ${outputDirectory}`);

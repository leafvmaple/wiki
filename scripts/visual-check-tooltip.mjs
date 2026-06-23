import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const repoRoot = resolve(import.meta.dirname, '..');
const distRoot = join(repoRoot, 'dist');
const screenshotRoot = join(process.env.TEMP ?? repoRoot, 'leafwiki-tests');

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml',
};

const knownBrowserPaths = [
  process.env.PLAYWRIGHT_CHROME_PATH,
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge Beta/Application/msedge.exe',
].filter(Boolean);

const findBrowserPath = () => knownBrowserPaths.find((filePath) => existsSync(filePath));

const serveDist = async () => {
  if (!existsSync(distRoot)) {
    throw new Error('dist folder is missing. Run npm run build first.');
  }

  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    const pathname = decodeURIComponent(requestUrl.pathname);
    let filePath = normalize(join(distRoot, pathname));

    if (!filePath.startsWith(distRoot)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    if (!existsSync(filePath)) {
      filePath = normalize(join(distRoot, pathname, 'index.html'));
    }

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    if (!existsSync(filePath)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
    });
    createReadStream(filePath).pipe(response);
  });

  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Cannot start local preview server.');
  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
  };
};

const inspectTooltip = async (page, origin, mode) => {
  await page.goto(`${origin}/games/stardew-valley/crops/`, { waitUntil: 'networkidle' });
  await page.evaluate((theme) => document.documentElement.setAttribute('data-theme', theme), mode);

  const target = page.locator('[data-sv-card]').first();
  await target.scrollIntoViewIfNeeded();
  await target.hover();
  const tooltip = page.locator('.sv-entity-tooltip:not([hidden])');
  await tooltip.waitFor({ state: 'visible', timeout: 5000 });

  const screenshotPath = join(screenshotRoot, `tooltip-${mode}-crops.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const result = await page.evaluate(() => {
    const tooltip = document.querySelector('.sv-entity-tooltip');
    const title = document.querySelector('.sv-entity-tooltip-title');
    const titleText = document.querySelector('.sv-entity-tooltip-title strong');
    const kicker = document.querySelector('.sv-entity-tooltip-kicker');
    const stats = [...document.querySelectorAll('.sv-entity-tooltip-stats span')];
    const style = (element) => (element ? getComputedStyle(element) : null);
    const tagBackgrounds = stats.map((tag) => getComputedStyle(tag).backgroundColor);

    return {
      visible: Boolean(tooltip && !tooltip.hidden),
      text: tooltip?.textContent?.trim().replace(/\s+/g, ' ') ?? '',
      titleGapPx: Number.parseFloat(style(title)?.gap ?? '0'),
      titleLineHeightPx: Number.parseFloat(style(titleText)?.lineHeight ?? '0'),
      kickerBackground: style(kicker)?.backgroundColor ?? '',
      tagCount: stats.length,
      tagBackgroundCount: new Set(tagBackgrounds).size,
      tagBackgrounds: tagBackgrounds.slice(0, 3),
    };
  });

  const failures = [
    result.visible ? '' : 'tooltip is not visible',
    result.text.includes('胡萝卜种子') ? '' : 'tooltip text is not populated',
    result.titleGapPx >= 3 ? '' : `title gap is too small: ${result.titleGapPx}px`,
    result.titleLineHeightPx >= 19 ? '' : `title line-height is too tight: ${result.titleLineHeightPx}px`,
    result.tagCount >= 3 ? '' : `expected at least 3 tags, got ${result.tagCount}`,
    result.tagBackgroundCount >= 2 ? '' : 'tag colors are not visually distinct',
  ].filter(Boolean);

  return {
    mode,
    screenshotPath,
    ...result,
    failures,
  };
};

const main = async () => {
  mkdirSync(screenshotRoot, { recursive: true });
  const { server, origin } = await serveDist();
  const browserPath = findBrowserPath();
  const browser = await chromium.launch({
    headless: true,
    ...(browserPath ? { executablePath: browserPath } : {}),
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const results = [];
    for (const mode of ['dark', 'light']) {
      results.push(await inspectTooltip(page, origin, mode));
    }

    const failures = results.flatMap((result) => result.failures.map((failure) => `${result.mode}: ${failure}`));
    console.log(JSON.stringify({ origin, browserPath: browserPath ?? 'playwright-managed', results }, null, 2));
    if (failures.length) {
      throw new Error(`Tooltip visual check failed:\n${failures.join('\n')}`);
    }
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

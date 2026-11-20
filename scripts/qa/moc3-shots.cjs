// Chụp bộ ảnh của Mốc 3: trang chủ sáng/tối, bài học tối, con dấu chương, Query Theater tối, trang tiến trình tối.
// Dùng: BASE=http://127.0.0.1:4173 node scripts/qa/moc3-shots.cjs <thư mục ra>. Mặc định BASE là dev server 5173.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:5173';
const SOLUTION = 'SELECT name, price\nFROM products\nWHERE price > 30000\nORDER BY price\nLIMIT 3;';
const dark = { fn: () => localStorage.setItem('ldb:theme', 'dark') };

(async () => {
  const out = process.argv[2] || 'shots';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  // Mở trang, gom lỗi console và page error kèm URL.
  const open = async (width, url, ...inits) => {
    const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 950 }, deviceScaleFactor: 2 });
    page.on('console', (m) => m.type() === 'error' && console.log(`console error [${page.url()}]: ${m.text()}`));
    page.on('pageerror', (e) => console.log(`page error [${page.url()}]: ${e.message}`));
    for (const init of inits) await page.addInitScript(init.fn, init.arg);
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '.hdr{position:static!important}.lesson-bar{display:none!important}' });
    await page.waitForTimeout(500);
    return page;
  };
  const shot = (page, name, width) => page.screenshot({ path: `${out}/${name}-${width}.png` });

  // Mọi bài của Chương 1 tính là xong.
  const ids = fs.readdirSync(path.join(__dirname, '../../src/content/lessons')).filter((f) => /^c1-/.test(f)).map((f) => f.replace('.ts', '')).sort();
  const now = Date.now();
  const seed = { fn: (v) => localStorage.setItem('ldb:progress', v), arg: JSON.stringify({ v: 1, lessons: Object.fromEntries(ids.map((i) => [i, now])), exercises: {} }) };
  const last = ids[ids.length - 1];

  for (const width of [1440, 390]) {
    let page = await open(width, '/');
    await shot(page, 'trang-chu', width);
    await page.close();

    page = await open(width, '/', dark);
    await shot(page, 'trang-chu-toi', width);
    await page.close();

    page = await open(width, '/bai/c2-b2', dark);
    await page.locator('.scene').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await shot(page, 'bai-hoc-toi', width);
    await page.close();

    page = await open(width, `/bai/${last}`, seed);
    await page.locator('.chapter-stamp').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await shot(page, 'con-dau-chuong', width);
    await page.close();

    page = await open(width, '/tap/c3-e6', dark);
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.insertText(SOLUTION);
    await page.getByRole('button', { name: /^Chạy/ }).click();
    await page.waitForSelector('.qt-clause:not([disabled])', { timeout: 20000 });
    await page.getByRole('button', { name: 'Tạm dừng' }).click().catch(() => {});
    await page.locator('.qt-clause', { hasText: 'ORDER BY' }).first().click();
    for (let i = 0; i < 2; i++) {
      await page.waitForTimeout(700);
      await page.locator('.qt-controls button[aria-label="Tới một bước"]').click();
    }
    await page.waitForTimeout(900);
    await page.locator('.qt').first().scrollIntoViewIfNeeded();
    await shot(page, 'theater-toi', width);
    await page.close();
  }

  const page = await open(390, '/tien-trinh', dark, seed);
  await shot(page, 'tien-trinh-toi', 390);
  await page.close();
  await browser.close();
  console.log('xong');
})();

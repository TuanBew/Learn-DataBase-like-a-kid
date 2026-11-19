// Chụp bộ ảnh của Mốc 2: Query Theater với JOIN và GROUP BY, vài dạng bài tập, mục lục, giấy chứng nhận.
// Dùng: node scripts/qa/moc2-shots.cjs <thư mục ra>. Cần dev server ở http://127.0.0.1:5173.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:5173';
const JOIN = "SELECT o.order_id, c.full_name\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nWHERE o.status = 'cancelled'\nORDER BY o.order_id;";
const GROUP = "SELECT store_id, COUNT(*) AS total_orders\nFROM orders\nWHERE status = 'done'\nGROUP BY store_id\nORDER BY store_id;";

(async () => {
  const out = process.argv[2] || 'shots';
  const browser = await chromium.launch();
  const open = async (width, url, init) => {
    const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 950 }, deviceScaleFactor: 2 });
    if (init) await page.addInitScript(init.fn, init.arg);
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '.hdr{position:static!important}.lesson-bar{display:none!important}' });
    await page.waitForTimeout(500);
    return page;
  };
  const theater = async (width, id, sql, clause, steps, name) => {
    const page = await open(width, `/tap/${id}`);
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.insertText(sql);
    await page.getByRole('button', { name: /^Chạy/ }).click();
    await page.waitForSelector('.qt-clause:not([disabled])', { timeout: 20000 });
    await page.getByRole('button', { name: 'Tạm dừng' }).click().catch(() => {});
    await page.locator('.qt-clause', { hasText: clause }).first().click();
    for (let i = 0; i < steps; i++) {
      await page.waitForTimeout(700);
      await page.locator('.qt-controls button[aria-label="Tới một bước"]').click();
    }
    await page.waitForTimeout(900);
    await page.locator('.qt').first().screenshot({ path: `${out}/${name}-${width}.png` });
    await page.close();
  };

  await theater(1440, 'c6-e1', JOIN, 'FROM', 2, 'theater-join');
  await theater(390, 'c6-e1', JOIN, 'FROM', 2, 'theater-join');
  await theater(1440, 'c5-e3', GROUP, 'GROUP BY', 0, 'theater-group-by');
  await theater(390, 'c5-e3', GROUP, 'GROUP BY', 1, 'theater-group-by');

  for (const [id, name] of [['c3-e4', 'bai-tap-xep-thu-tu'], ['c3-e3', 'bai-tap-doan-ket-qua'], ['c1-e1', 'bai-tap-quiz']]) {
    for (const width of [1440, 390]) {
      const page = await open(width, `/tap/${id}`);
      await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
      await page.close();
    }
  }
  for (const width of [1440, 390]) {
    const page = await open(width, '/tap/c7-e1');
    await page.getByRole('button', { name: /^Chạy/ }).click();
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `${out}/bai-tap-dien-tap-${width}.png`, fullPage: true });
    await page.close();
  }

  const ids = fs.readdirSync(path.join(__dirname, '../../src/content/lessons')).filter((f) => /^c\d/.test(f)).map((f) => f.replace('.ts', ''));
  const now = Date.now();
  const full = { v: 1, lessons: Object.fromEntries(ids.map((i) => [i, now])), exercises: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((n) => [`c${n}-boss`, { mysql: now }])) };
  const seed = { fn: (v) => localStorage.setItem('ldb:progress', v), arg: JSON.stringify(full) };
  for (const width of [1440, 390]) {
    let page = await open(width, '/chung-nhan', seed);
    await page.fill('#cert-name', 'Nguyễn Thị Thanh Hường');
    await page.waitForTimeout(2600);
    await page.screenshot({ path: `${out}/giay-chung-nhan-${width}.png`, fullPage: true });
    await page.close();
    page = await open(width, '/', seed);
    await page.locator('#muc-luc').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('#muc-luc').screenshot({ path: `${out}/muc-luc-${width}.png` });
    await page.close();
    page = await open(width, '/tien-trinh', seed);
    await page.screenshot({ path: `${out}/tien-trinh-${width}.png`, fullPage: true });
    await page.close();
  }
  await browser.close();
  console.log('xong');
})();

// Chụp trang chủ và bài học. Dùng: node scripts/qa/page-shots.cjs <thư mục> <chiều rộng> [scale]
const { chromium } = require('playwright');

(async () => {
  const [out = 'shots', widthArg = '1440', scale = '1'] = process.argv.slice(2);
  const width = Number(widthArg);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: Number(scale) });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  const base = process.env.BASE || 'http://127.0.0.1:5173';

  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/home-top-${width}.png` });
  await page.locator('.hero-piece').nth(0).click();
  await page.waitForTimeout(250);
  await page.locator('.hero-piece').nth(1).click();
  await page.waitForTimeout(250);
  await page.locator('.hero-piece').nth(2).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/home-played-${width}.png` });
  await page.screenshot({ path: `${out}/home-full-${width}.png`, fullPage: true });

  await page.goto(base + '/bai/c1-b1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/lesson-top-${width}.png` });
  // Ảnh chụp riêng từng cảnh: cho đầu trang đứng yên để không che cảnh.
  await page.addStyleTag({ content: '.hdr{position:static!important}.lesson-bar{display:none!important}' });
  for (const b of await page.locator('.place__btn').all()) {
    await b.click();
    await page.waitForTimeout(250);
  }
  await page.locator('.place__btn').first().click();
  await page.waitForTimeout(700);
  await page.locator('.street').scrollIntoViewIfNeeded();
  await page.locator('.scene').first().screenshot({ path: `${out}/lesson-street-${width}.png` });
  await page.locator('.ophone__order').click();
  await page.waitForTimeout(300);
  await page.locator('.ophone__drink').nth(1).click();
  await page.locator('.ophone__order').click();
  await page.waitForTimeout(300);
  await page.locator('.ophone__drink').nth(3).click();
  await page.locator('.ophone__order').click();
  await page.waitForTimeout(800);
  await page.locator('.scene').nth(1).screenshot({ path: `${out}/lesson-phone-${width}.png` });
  await page.screenshot({ path: `${out}/lesson-full-${width}.png`, fullPage: true });
  console.log(JSON.stringify({ errors }));
  await browser.close();
})();

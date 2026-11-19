// Chụp vài khoảnh khắc của Query Theater. Dùng: node scripts/qa/theater-shots.mjs <thư mục> <chiều rộng> [dialect]
const { chromium } = require('playwright');

(async () => {
const [out = 'shots', widthArg = '1440', dialect = 'mysql'] = process.argv.slice(2);
const width = Number(widthArg);
const SQL = {
  mysql: 'SELECT name, price\nFROM products\nWHERE price > 30000\nORDER BY price\nLIMIT 3;',
  oracle: 'SELECT name, price\nFROM products\nWHERE price > 30000\nORDER BY price\nFETCH FIRST 3 ROWS ONLY;',
};
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://127.0.0.1:5173/tap/c3-e6', { waitUntil: 'networkidle' });
if (dialect === 'oracle') await page.getByRole('button', { name: 'Oracle' }).click();
const shot = (name) => page.screenshot({ path: `${out}/${name}-${dialect}-${width}.png`, fullPage: false });
await shot('ex-0-open');
await page.locator('.cm-content').click();
await page.keyboard.press('ControlOrMeta+a');
await page.keyboard.insertText(SQL[dialect]);
await page.getByRole('button', { name: /^Chạy/ }).click();
await page.waitForTimeout(900);
await shot('ex-1-written');
await page.waitForTimeout(1600);
await shot('ex-2-run');
await page.waitForTimeout(2600);
await shot('ex-3-from');
await page.waitForTimeout(4600);
await shot('ex-4-where');
  console.log('scrollY at where', await page.evaluate(() => window.scrollY));
// nhảy tới cuối WHERE bằng cách bấm clause SELECT
await page.locator('.qt-clause', { hasText: 'SELECT' }).click();
await page.waitForTimeout(700);
await shot('ex-5-select');
await page.locator('.qt-clause', { hasText: 'ORDER BY' }).click();
await page.waitForTimeout(700);
await shot('ex-6-order');
await page.getByRole('button', { name: 'Tới một bước' }).click();
await page.waitForTimeout(900);
await page.getByRole('button', { name: 'Tới một bước' }).click();
await page.waitForTimeout(700);
await shot('ex-7-gate-open');
await page.getByRole('button', { name: 'Tới một bước' }).click();
await page.waitForTimeout(500);
await shot('ex-8-gate-closing');
await page.getByRole('button', { name: /Bỏ qua/ }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/ex-9-done-${dialect}-${width}.png`, fullPage: true });
console.log(JSON.stringify({ errors, scrollY: await page.evaluate(() => window.scrollY) }));
await browser.close();
})();

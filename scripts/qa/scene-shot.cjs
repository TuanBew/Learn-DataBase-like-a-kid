// Chụp một cảnh motion trong bài học sau một chuỗi thao tác.
// Dùng: node scripts/qa/scene-shot.cjs <bài> <chiều rộng> <file ra không đuôi> [thao tác...]
// Thao tác: "click:<chữ trên nút>", "css:<selector>", "wait:<ms>", "shot" (chụp thêm một ảnh giữa chừng).
const { chromium } = require('playwright');

(async () => {
  const [lesson, widthArg, out, ...acts] = process.argv.slice(2);
  const width = Number(widthArg);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference' });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  const base = process.env.BASE || 'http://127.0.0.1:5173';
  await page.goto(`${base}/bai/${lesson}`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.hdr{position:static!important}.lesson-bar{display:none!important}' });
  const scene = page.locator('.scene').nth(Number(process.env.NTH || 0));
  await scene.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  let n = 0;
  const shot = async () => scene.screenshot({ path: `${out}-${width}${n++ ? '-' + n : ''}.png` });
  for (const a of acts) {
    const [kind, ...rest] = a.split(':');
    const arg = rest.join(':');
    if (kind === 'click') await scene.getByRole('button', { name: arg, exact: false }).or(scene.getByRole('radio', { name: arg, exact: false })).first().click();
    else if (kind === 'css') await scene.locator(arg).first().click();
    else if (kind === 'wait') await page.waitForTimeout(Number(arg));
    else if (kind === 'shot') await shot();
  }
  await page.waitForTimeout(300);
  await shot();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(JSON.stringify({ lesson, width, overflow, errors }));
  await browser.close();
})();

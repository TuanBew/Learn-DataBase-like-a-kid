// Chụp toàn trang mọi màn hình ở 1440px và 390px, để soi bằng mắt.
// Dùng: node scripts/qa/all-shots.cjs <thư mục ra> [lọc]
// "lọc" là một chuỗi, ví dụ "c3-" chỉ chụp bài học và bài tập của Chương 3, "trang" chỉ chụp các trang phụ.
// Cần dev server ở http://127.0.0.1:5173 (hoặc đặt BASE). Đặt THEME=dark để chụp giao diện tối.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:5173';
const root = path.resolve(__dirname, '../../src/content');
const ids = (dir) => fs.readdirSync(path.join(root, dir)).filter((f) => /^c\d.*\.ts$/.test(f)).map((f) => f.replace('.ts', '')).sort();

(async () => {
  const [out = 'shots', filter = ''] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const pages = [
    ...ids('lessons').map((id) => ({ name: `bai-${id}`, url: `/bai/${id}`, key: id })),
    ...ids('exercises').map((id) => ({ name: `tap-${id}`, url: `/tap/${id}`, key: id })),
    { name: 'trang-chu', url: '/', key: 'trang' },
    { name: 'trang-tien-trinh', url: '/tien-trinh', key: 'trang' },
    { name: 'trang-hoc-tiep', url: '/hoc-tiep', key: 'trang' },
    { name: 'trang-nguon', url: '/nguon', key: 'trang' },
    { name: 'trang-chung-nhan', url: '/chung-nhan', key: 'trang' },
  ].filter((p) => !filter || p.key.startsWith(filter) || p.name.includes(filter));

  const browser = await chromium.launch();
  const problems = [];
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
    if (process.env.THEME) await context.addInitScript((t) => localStorage.setItem('ldb:theme', t), process.env.THEME);
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    for (const p of pages) {
      errors.length = 0;
      try {
        await page.goto(BASE + p.url, { waitUntil: 'networkidle' });
        // Đầu trang đứng yên để không che nội dung trong ảnh toàn trang.
        await page.addStyleTag({ content: '.hdr{position:static!important}.lesson-bar{display:none!important}' });
        // Cuộn hết trang một lượt để các cảnh và Playground tải lười kịp hiện.
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < height; y += 800) {
          await page.evaluate((v) => window.scrollTo(0, v), y);
          await page.waitForTimeout(90);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(350);
        await page.screenshot({ path: path.join(out, `${p.name}-${width}.png`), fullPage: true });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 1 || errors.length) problems.push({ page: p.url, width, overflow, errors: errors.slice(0, 3) });
      } catch (e) {
        problems.push({ page: p.url, width, error: String(e).slice(0, 200) });
      }
    }
    await context.close();
  }
  await browser.close();
  console.log(JSON.stringify({ pages: pages.length, shots: pages.length * 2, problems }));
})();

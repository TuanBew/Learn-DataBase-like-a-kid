const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:5173';
const THEME = process.env.THEME || '';
const filter = process.argv[2] || '';
const outFile = process.argv[3] || '';
const root = path.resolve(__dirname, '../..');
const ids = (dir) =>
  fs.readdirSync(path.join(root, 'src/content', dir))
    .filter((f) => /^c.*\.ts$/.test(f))
    .map((f) => f.replace(/\.ts$/, ''));

const pages = [
  '/', '/tien-trinh', '/hoc-tiep', '/tra-cuu', '/nguon', '/chung-nhan',
  ...ids('lessons').map((i) => `/bai/${i}`),
  ...ids('exercises').map((i) => `/tap/${i}`),
].filter((p) => p.includes(filter));

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

(async () => {
  const browser = await chromium.launch();
  const rules = {};
  const details = [];
  const errors = [];
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    if (THEME) {
      await context.addInitScript((t) => {
        try { localStorage.setItem('ldb:theme', t); } catch (e) {}
      }, THEME);
    }
    for (const p of pages) {
      const page = await context.newPage();
      try {
        await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 90000 });
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += 800) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 100));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(300);
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        const res = await page.evaluate((tags) =>
          // eslint-disable-next-line no-undef
          axe.run(document, { runOnly: { type: 'tag', values: tags } }), TAGS);
        for (const v of res.violations) {
          const r = (rules[v.id] ||= { id: v.id, impact: v.impact, nodes: 0, pages: new Set(), examples: [] });
          r.nodes += v.nodes.length;
          r.pages.add(p);
          for (const n of v.nodes) {
            const d = { page: p, width, target: n.target.join(' '), html: (n.html || '').slice(0, 160) };
            if (v.id === 'color-contrast') {
              const data = (n.any && n.any[0] && n.any[0].data) || {};
              d.ratio = data.contrastRatio; d.fg = data.fgColor; d.bg = data.bgColor;
            }
            details.push({ rule: v.id, ...d });
            if (r.examples.length < 5) r.examples.push(d);
          }
        }
      } catch (e) {
        errors.push({ page: p, width, error: String(e.message).split('\n')[0] });
      }
      await page.close();
    }
    await context.close();
  }
  await browser.close();
  const list = Object.values(rules).map((r) => ({ ...r, pages: [...r.pages] }));
  console.log(`Trang quet: ${pages.length} x 2 chieu rong, loi chay: ${errors.length}`);
  console.table(list.map((r) => ({ id: r.id, impact: r.impact, nodes: r.nodes, pages: r.pages.length })));
  for (const e of errors) console.log('LOI', e.page, e.width, e.error);
  if (outFile) fs.writeFileSync(outFile, JSON.stringify({ pages, rules: list, details, errors }, null, 1));
})();

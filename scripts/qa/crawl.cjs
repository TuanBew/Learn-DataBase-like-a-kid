const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = (process.env.BASE || process.argv[2] || 'http://127.0.0.1:5173').replace(/\/$/, '');
const root = path.resolve(__dirname, '../../src/content');
const ids = (d, re) => fs.readdirSync(path.join(root, d)).filter((f) => f.endsWith('.ts') && re.test(f)).map((f) => f.slice(0, -3));
const lessons = ids('lessons', /^(?!index\.)/);
const exercises = ids('exercises', /^c.*\.ts$/);
const sizes = [{ w: 1440, h: 900 }, { w: 390, h: 844 }];

(async () => {
  const browser = await chromium.launch();
  let total = 0, bad = 0;
  for (const s of sizes) {
    const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h } });
    const page = await ctx.newPage();
    let errs = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
    page.on('pageerror', (e) => errs.push('pageerror: ' + String(e.message).slice(0, 200)));
    // ONLY là regex lọc theo `bai/<id>` hoặc `tap/<id>`, để chạy lại một phần.
    const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
    const targets = [...lessons.map((i) => ['bai', i]), ...exercises.map((i) => ['tap', i])].filter(([k, i]) => !only || only.test(`${k}/${i}`));
    for (const [kind, id] of targets) {
      const url = `${BASE}/${kind}/${id}`;
      errs = [];
      const issues = {};
      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        const h = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < h + 700; y += 700) {
          await page.evaluate((v) => window.scrollTo(0, v), y);
          await page.waitForTimeout(120);
        }
        await page.waitForTimeout(300);
        const info = await page.evaluate(() => {
          const de = document.documentElement;
          const r = { overflow: de.scrollWidth - de.clientWidth > 1 };
          if (r.overflow) {
            r.culprits = [...document.querySelectorAll('body *')]
              .map((e) => ({ tag: e.tagName, cls: String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).slice(0, 60), right: Math.round(e.getBoundingClientRect().right) }))
              .filter((x) => x.right > de.clientWidth + 1).sort((a, b) => b.right - a.right).slice(0, 3);
          }
          const main = document.querySelector('main');
          r.blank = !main || !main.querySelector('h1') || (main.innerText || '').trim().length < 200;
          const sc = [...document.querySelectorAll('.scene')];
          r.scenes = sc.length;
          r.shortScenes = sc.filter((e) => e.getBoundingClientRect().height < 120).length;
          return r;
        });
        if (info.overflow) { issues.overflow = true; issues.culprits = info.culprits; }
        if (info.blank) issues.blank = true;
        if (kind === 'bai' && info.shortScenes > 0) issues.shortScenes = `${info.shortScenes}/${info.scenes}`;
        const btn = page.getByRole('button', { name: 'Chạy', exact: true }).first();
        if (kind === 'tap' && (await btn.count()) > 0) {
          const before = errs.length;
          try { await btn.click({ timeout: 3000 }); } catch (e) { issues.runClick = 'click failed'; }
          await page.waitForTimeout(1500);
          if (errs.length > before) issues.runErrors = errs.slice(before);
        }
      } catch (e) {
        issues.navError = String(e.message).slice(0, 200);
      }
      total++;
      if (errs.length && !issues.runErrors) issues.errors = errs.slice();
      else if (errs.length) issues.errors = errs.slice(0, errs.length - issues.runErrors.length);
      if (issues.errors && !issues.errors.length) delete issues.errors;
      if (Object.keys(issues).length) { bad++; console.log(JSON.stringify({ url, width: s.w, ...issues })); }
    }
    await ctx.close();
  }
  await browser.close();
  console.log(`TOTAL pages=${total} withIssues=${bad}`);
})();

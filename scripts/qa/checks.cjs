const { chromium } = require('playwright');
const B = 'http://127.0.0.1:5173';
const MY = 'SELECT name, price FROM products WHERE price > 30000 ORDER BY price LIMIT 3;';
const OR = 'SELECT name, price FROM products WHERE price > 30000 ORDER BY price FETCH FIRST 3 ROWS ONLY;';
const WRONG = 'SELECT name, price FROM products WHERE price >= 30000 ORDER BY price LIMIT 3';
const out = {};
const rec = (k, v) => { out[k] = v; console.log(k, JSON.stringify(v)); };
async function type(page, sql) {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText(sql);
  await page.getByRole('button', { name: /^Chạy/ }).click();
}
(async () => {
  const br = await chromium.launch();
  // 3 font
  {
    const p = await br.newPage(); await p.goto(B + '/', { waitUntil: 'networkidle' });
    const r = await p.evaluate(async () => {
      const text = 'Nguyễn Thị Hường, ỷ ỹ ự ữ ẵ'; const res = {};
      const c = document.createElement('canvas').getContext('2d');
      const w = (f, ch) => { c.font = `40px ${f}`; return c.measureText(ch).width; };
      for (const f of ["'Baloo 2'", "'Be Vietnam Pro'", "'JetBrains Mono'", "'Patrick Hand'"]) {
        const miss = [];
        for (const wt of [400, 600]) {
          await document.fonts.load(`${wt} 40px ${f}`, text);
        }
        for (const ch of new Set([...text].filter(x => x !== ' '))) {
          if (w(`${f}, serif`, ch) === w(`${f}, monospace`, ch)) { /* has glyph */ } else miss.push(ch);
        }
        res[f] = miss.join('');
      }
      return res;
    });
    rec('3.fontFallbackChars', r); await p.close();
  }
  // 4 console + overflow
  for (const w of [1440, 390]) {
    for (const path of ['/', '/bai/c1-b1', '/tap/c3-e6']) {
      const p = await br.newPage({ viewport: { width: w, height: 844 } }); const errs = [];
      p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 100))); p.on('pageerror', e => errs.push(String(e).slice(0, 100)));
      await p.goto(B + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
      let sw = await p.evaluate(() => document.documentElement.scrollWidth);
      let sw2 = null;
      if (w === 390 && path === '/tap/c3-e6') {
        await p.getByRole('button', { name: 'Oracle' }).click(); await type(p, OR); await p.waitForTimeout(1500);
        sw2 = await p.evaluate(() => document.documentElement.scrollWidth);
        await p.getByRole('button', { name: /Bỏ qua/ }).click(); await p.waitForTimeout(800);
        sw2 = Math.max(sw2, await p.evaluate(() => document.documentElement.scrollWidth));
      }
      rec(`4.${w}${path}`, { errs, sw, sw2 }); await p.close();
    }
  }
  // 5 reduced motion
  {
    const ctx = await br.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage(); await p.goto(B + '/tap/c3-e6', { waitUntil: 'networkidle' });
    await type(p, MY); await p.waitForTimeout(3000);
    const prog = () => p.locator('.qt [role=progressbar]').first().getAttribute('aria-valuenow');
    const r = { step0: await prog(), note: await p.locator('.qt-reduced').count() };
    const nxt = p.getByRole('button', { name: 'Tới một bước' });
    let n = 0; while (n < 60 && await nxt.isEnabled().catch(() => false)) { await nxt.click(); await p.waitForTimeout(150); n++; }
    r.clicks = n; r.last = await prog(); r.max = await p.locator('.qt [role=progressbar]').first().getAttribute('aria-valuemax');
    r.correct = await p.getByText('Đúng rồi').count();
    const h = await ctx.newPage(); await h.goto(B + '/', { waitUntil: 'networkidle' }); await h.waitForTimeout(800);
    r.homeRows = await h.locator('.hero-play .chip b').first().textContent();
    r.homeTableRows = await h.locator('.hero-play tbody tr').count();
    rec('5', r); await ctx.close();
  }
  // 6 mute
  {
    const ctx = await br.newContext(); const p = await ctx.newPage(); await p.goto(B + '/', { waitUntil: 'networkidle' });
    await p.locator('.hdr__nav button[aria-pressed]').click(); await p.reload({ waitUntil: 'networkidle' });
    rec('6', { ls: await p.evaluate(() => localStorage.getItem('ldb:muted')), pressed: await p.locator('.hdr__nav button[aria-pressed]').getAttribute('aria-pressed') });
    await ctx.close();
  }
  // 7 progress
  {
    const ctx = await br.newContext(); const p = await ctx.newPage(); await p.goto(B + '/bai/c1-b1', { waitUntil: 'networkidle' });
    const fin = p.getByRole('button', { name: 'Xong bài' }); const r = { finBtn: await fin.count() };
    if (r.finBtn) { await fin.click(); await p.waitForTimeout(500); }
    await p.reload({ waitUntil: 'networkidle' }); await p.goto(B + '/', { waitUntil: 'networkidle' });
    r.doneOnHome = await p.locator('text=Dữ liệu ở quanh ta').first().evaluate(e => (e.closest('li,article,a,div[class]')?.parentElement?.textContent || '').includes('Đã xong'));
    r.doneAny = await p.getByText('Đã xong').count();
    await p.goto(B + '/tap/c3-e6', { waitUntil: 'networkidle' }); await type(p, MY); await p.waitForTimeout(500);
    await p.getByRole('button', { name: /Bỏ qua/ }).click(); await p.waitForTimeout(1500);
    r.correct = await p.getByText('Đúng rồi').count();
    r.progress = await p.evaluate(() => localStorage.getItem('ldb:progress'));
    rec('7', r); await ctx.close();
  }
  // 8 wrong + error
  {
    const ctx = await br.newContext(); const p = await ctx.newPage(); await p.goto(B + '/tap/c3-e6', { waitUntil: 'networkidle' });
    await type(p, WRONG); await p.waitForTimeout(500); await p.getByRole('button', { name: /Bỏ qua/ }).click(); await p.waitForTimeout(1500);
    const r = { rcmp: await p.locator('.rcmp').count(), muoi: await p.locator('.rcmp').getByText(/Cà phê muối/).count() };
    const hl = p.locator('.hlad'); const btns = hl.getByRole('button');
    let opened = 0; for (let i = 0; i < 6; i++) { const b = hl.getByRole('button', { name: /^Mở/ }).first(); if (!(await b.count())) break; await b.click(); opened++; await p.waitForTimeout(100); }
    r.hintOpened = opened; r.hintBodies = await p.locator('.hlad__body').count();
    await p.getByRole('button', { name: 'Oracle' }).click(); await p.waitForTimeout(300);
    await type(p, WRONG); await p.waitForTimeout(1200);
    r.ora = await p.getByText(/ORA-00933/).count(); r.sqlerr = await p.locator('.cm-sqlerr').count();
    rec('8', r); await ctx.close();
  }
  // 9 keyboard
  {
    const p = await br.newPage({ viewport: { width: 1440, height: 900 } }); await p.goto(B + '/', { waitUntil: 'networkidle' });
    const rows = () => p.locator('.hero-play .chip b').first().textContent();
    const r = { before: await rows() };
    let hit = false;
    for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); const t = await p.evaluate(() => document.activeElement?.textContent || ''); if (t.includes('WHERE price > 30000')) { hit = true; break; } }
    r.tabbed = hit;
    r.outline = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return [s.outlineStyle, s.outlineWidth]; });
    await p.keyboard.press('Enter'); await p.waitForTimeout(500); r.after = await rows();
    rec('9', r); await p.close();
  }
  await br.close();
})();

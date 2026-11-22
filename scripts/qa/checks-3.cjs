const { chromium } = require('playwright');
const B = 'http://127.0.0.1:5173';
const rec = (k, v) => console.log(k, JSON.stringify(v));
const chipNum = (p, n) => p.locator(`.flow__chips .chip:nth-child(${n}) b`).textContent();
(async () => {
  const br = await chromium.launch();
  // 1
  for (const w of [1440, 390]) {
    const p = await br.newPage({ viewport: { width: w, height: 844 } }); const errs = [];
    p.on('console', m => m.type() === 'error' && errs.push(p.url() + ' ' + m.text().slice(0, 100)));
    p.on('pageerror', e => errs.push(p.url() + ' ' + String(e).slice(0, 100)));
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    rec('1.' + w, { errs, sw: await p.evaluate(() => document.documentElement.scrollWidth) }); await p.close();
  }
  // 2
  {
    const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(B + '/', { waitUntil: 'networkidle' });
    const say0 = await p.locator('.flow__say .says__bubble').innerText();
    const apps = p.locator('.flow-app');
    for (let i = 0; i < 4; i++) { await apps.nth(i).click(); await p.waitForTimeout(400); }
    await p.waitForTimeout(3000);
    rec('2', { n: await apps.count(), req: await chipNum(p, 2), rows: await chipNum(p, 3), flowRow: await p.locator('.flow-row').count(), dots: await p.locator('.flow-dot').count(), sayChanged: say0 !== await p.locator('.flow__say .says__bubble').innerText() });
    await p.close();
  }
  // 3
  {
    const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(B + '/', { waitUntil: 'networkidle' });
    let ok = false;
    for (let i = 0; i < 80; i++) { await p.keyboard.press('Tab'); if (await p.evaluate(() => document.activeElement?.classList.contains('flow-app'))) { ok = true; break; } }
    const outline = ok ? await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle) : null;
    if (ok) await p.keyboard.press('Enter');
    await p.waitForTimeout(3000);
    rec('3', { focused: ok, outline, rows: await chipNum(p, 3) }); await p.close();
  }
  // 4
  {
    const ctx = await br.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage(); await p.goto(B + '/', { waitUntil: 'networkidle' });
    await p.evaluate(() => { window.__dot = 0; new MutationObserver(() => { if (document.querySelector('.flow-dot')) window.__dot++; }).observe(document.body, { childList: true, subtree: true, attributes: true }); });
    await p.locator('.flow-app').first().click(); await p.waitForTimeout(400);
    rec('4', { flowRow: await p.locator('.flow-row').count(), dotSeen: await p.evaluate(() => window.__dot) }); await ctx.close();
  }
  // 5
  {
    const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(B + '/', { waitUntil: 'networkidle' });
    const b = p.locator('.inside__part').nth(1);
    const on = () => p.locator('.inside__table tr.is-on').allInnerTexts();
    await b.click(); await p.waitForTimeout(200); const a = await on();
    await b.click(); await p.waitForTimeout(200); const c = await on();
    rec('5', { pressed: await b.getAttribute('aria-pressed'), first: a, second: c, differ: JSON.stringify(a) !== JSON.stringify(c) }); await p.close();
  }
  // 6
  {
    const p = await br.newPage(); await p.goto(B + '/', { waitUntil: 'networkidle' });
    const links = p.locator('a[href="/tap/c4-e6"]');
    const r = { count: await links.count(), tapLinks: await p.locator('a[href*="/tap/"]').count() };
    if (r.count) { r.text = (await links.first().innerText()).replace(/\s+/g, ' '); r.chapter = await links.first().evaluate(e => e.closest('.toc-ch')?.querySelector('.toc-ch__num')?.textContent); }
    r.heroTap = await p.locator('.home-hero a[href*="/tap/"]').count();
    rec('6', r); await p.close();
  }
  // 7
  for (const path of ['/', '/bai/c1-b1', '/tap/c4-e6']) {
    const p = await br.newPage(); await p.goto(B + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    const t = await p.evaluate(() => document.body.innerText);
    rec('7' + path, { title: await p.title(), likeAKid: /like a kid/i.test(t), chau: (t.replace(/trân châu/gi, '').match(/Châu/g) || []).length }); await p.close();
  }
  await br.close();
})();

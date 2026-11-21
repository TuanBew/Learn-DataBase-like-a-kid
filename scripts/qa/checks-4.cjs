const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:5173';
const SHOTS = '/tmp/claude-0/-home-user-Learn-DataBase-like-a-kid/d3b10267-15d8-57ef-b48b-b75d4add6e4b/scratchpad/qa4/';
require('fs').mkdirSync(SHOTS, { recursive: true });

let pass = 0, fail = 0;
const errors = [];
const ok = (n) => { pass++; console.log('PASS ' + n); };
const bad = (n, why) => { fail++; console.log('FAIL ' + n + ': ' + String(why).replace(/\s+/g, ' ').slice(0, 220)); };
async function check(name, fn, page) {
  try { const r = await fn(); if (r === true || r === undefined) ok(name); else bad(name, r); }
  catch (e) { bad(name, e.message); if (page) await page.screenshot({ path: SHOTS + name.replace(/\W+/g, '_') + '.png' }).catch(() => {}); }
}

let browser;
async function newCtx() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  ctx.on('page', (p) => {
    p.on('console', (m) => m.type() === 'error' && errors.push(`console.error ${p.url()} ${m.text().slice(0, 120)}`));
    p.on('pageerror', (e) => errors.push(`pageerror ${p.url()} ${String(e).slice(0, 120)}`));
  });
  const page = await ctx.newPage();
  return { ctx, page };
}
const go = async (page, path) => { await page.goto(BASE + path, { waitUntil: 'networkidle' }); };
const nums = async (page) => (await page.locator('.prg-stat__num b').allInnerTexts()).map(Number);
const activeInfo = (page) => page.evaluate(() => { const e = document.activeElement; return e ? { tag: e.tagName.toLowerCase(), cls: (e.getAttribute('class') || '').slice(0, 60), text: (e.textContent || '').trim().slice(0, 30) } : null; });
async function tabUntil(page, sel, max) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((s) => !!document.activeElement && document.activeElement.matches(s), sel)) return i + 1;
  }
  throw new Error(`Tab ${max} lần không tới ${sel}`);
}

async function focusTour(page, path, n, label) {
  await go(page, path);
  await page.waitForTimeout(500);
  const missing = [];
  for (let i = 0; i < n; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return { body: true };
      const cs = getComputedStyle(e);
      const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
      const shadow = cs.boxShadow;
      const info = { tag: e.tagName.toLowerCase(), cls: (e.getAttribute('class') || '').slice(0, 50) };
      return { outline, shadow, info };
    });
    if (r.body) continue;
    if (r.outline) continue;
    let differs = false;
    if (r.shadow !== 'none') {
      differs = await page.evaluate(() => {
        const e = document.activeElement; const a = getComputedStyle(e).boxShadow;
        e.blur(); const b = getComputedStyle(e).boxShadow; e.focus({ focusVisible: true });
        return a !== b;
      });
    }
    if (!differs) missing.push(`${r.info.tag}.${r.info.cls}`);
  }
  return missing.length ? `${label}: ${missing.length} phần tử không có dấu focus: ${[...new Set(missing)].join(' | ')}` : true;
}

(async () => {
  browser = await chromium.launch();
  const A = await newCtx();
  const pA = A.page;

  // A1
  await check('A1 bai-xong-giu-sau-reload', async () => {
    await go(pA, '/bai/c1-b2');
    await pA.locator('button.lesson-end__btn').click();
    await pA.locator('a.lesson-end__btn').first().waitFor({ timeout: 5000 });
    await pA.reload({ waitUntil: 'networkidle' });
    await pA.locator('.lesson-end').waitFor();
    if (await pA.locator('button.lesson-end__btn').count()) return 'nút xong bài vẫn còn sau reload';
    const href = await pA.locator('a.lesson-end__btn').first().getAttribute('href');
    if (!/^\/bai\//.test(href || '')) return 'không có link bài tiếp: ' + href;
    await go(pA, '/');
    const row = pA.locator('.toc-l__link[href="/bai/c1-b2"] .toc-l__go--done');
    if ((await row.count()) !== 1) return 'dòng c1-b2 ở mục lục chưa ở trạng thái đã xong';
  }, pA);

  // A2
  await check('A2 bai-tap-c1-e6', async () => {
    await go(pA, '/tap/c1-e6');
    await pA.locator('.ex-run').click();
    await pA.locator('.ex-verdict--ok').waitFor({ timeout: 40000 });
    await pA.reload({ waitUntil: 'networkidle' });
    await go(pA, '/bai/c1-b5');
    await pA.locator('.exlink.is-done').first().waitFor({ timeout: 5000 });
    const href = await pA.locator('.exlink.is-done').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    if (!href.includes('/tap/c1-e6')) return 'exlink.is-done không gồm c1-e6: ' + href;
    const v = await pA.evaluate(() => JSON.parse(localStorage['ldb:progress']).v);
    if (v !== 1) return 'v=' + v;
  }, pA);

  // A3
  const C3 = await newCtx();
  await check('A3 json-rac', async () => {
    const before = errors.length;
    await go(C3.page, '/');
    await C3.page.evaluate(() => { localStorage['ldb:progress'] = 'rác không phải json'; });
    await go(C3.page, '/');
    await C3.page.locator('h1').first().waitFor();
    const pe = errors.slice(before).filter((e) => e.startsWith('pageerror'));
    if (pe.length) return pe.join(' ; ');
    if (!(await C3.page.locator('.toc-l').count())) return 'mục lục không hiện';
  }, C3.page);
  await C3.ctx.close();

  // B4
  let code, nA;
  await check('B4 xuat-nhap-ma', async () => {
    await go(pA, '/tien-trinh');
    nA = await nums(pA);
    await pA.getByRole('button', { name: 'Tạo mã' }).click();
    code = await pA.locator('#prg-code').inputValue();
    if (!code.startsWith('LDB1-')) return 'mã không bắt đầu bằng LDB1-: ' + code.slice(0, 12);
    const B = await newCtx();
    await go(B.page, '/tien-trinh');
    await B.page.locator('#prg-paste').fill(code);
    await B.page.getByRole('button', { name: 'Nhập mã' }).click();
    await B.page.locator('.prg-says').waitFor();
    const n1 = await nums(B.page);
    if (JSON.stringify(n1) !== JSON.stringify(nA) || n1[0] + n1[1] === 0) return `số sau nhập ${n1} khác ${nA}`;
    await B.page.reload({ waitUntil: 'networkidle' });
    const n2 = await nums(B.page);
    await B.ctx.close();
    if (JSON.stringify(n2) !== JSON.stringify(nA)) return `sau reload ${n2} khác ${nA}`;
  }, pA);

  // B5
  await check('B5 ma-sai-dang', async () => {
    const B = await newCtx();
    const before = errors.length;
    await go(B.page, '/tien-trinh');
    const p0 = await B.page.evaluate(() => localStorage['ldb:progress'] ?? null);
    const n0 = await nums(B.page);
    await B.page.locator('#prg-paste').fill('abc');
    await B.page.getByRole('button', { name: 'Nhập mã' }).click();
    const txt = await B.page.locator('.prg-says').innerText({ timeout: 3000 });
    const p1 = await B.page.evaluate(() => localStorage['ldb:progress'] ?? null);
    const n1 = await nums(B.page);
    await B.ctx.close();
    if (!/sai dạng/.test(txt)) return 'lời báo lạ: ' + txt.slice(0, 60);
    if (errors.slice(before).some((e) => e.startsWith('pageerror'))) return 'có pageerror';
    if (p0 !== p1 || JSON.stringify(n0) !== JSON.stringify(n1)) return 'tiến trình đổi';
  });

  // B6
  await check('B6 xoa-tien-trinh', async () => {
    await go(pA, '/tien-trinh');
    await pA.getByRole('button', { name: 'Xóa hết tiến trình' }).click();
    await pA.getByRole('button', { name: 'Xóa thật' }).click();
    await pA.waitForTimeout(300);
    const n1 = await nums(pA);
    if (n1.some((x) => x !== 0)) return 'sau xóa còn ' + n1;
    await pA.reload({ waitUntil: 'networkidle' });
    const n2 = await nums(pA);
    if (n2.some((x) => x !== 0)) return 'sau reload còn ' + n2;
  }, pA);
  await A.ctx.close();

  // C7
  const C = await newCtx();
  await check('C7 tat-tieng', async () => {
    const p = C.page;
    // nút tắt tiếng là nút aria-pressed cuối nav (nút giao diện tối đứng trước)
    const btn = () => p.locator('.hdr__nav button[aria-pressed]').last();
    await go(p, '/');
    await btn().click();
    if ((await btn().getAttribute('aria-pressed')) !== 'true') return 'aria-pressed không thành true';
    if ((await p.evaluate(() => localStorage['ldb:muted'])) !== '1') return 'ldb:muted khác 1';
    await p.reload({ waitUntil: 'networkidle' });
    if ((await btn().getAttribute('aria-pressed')) !== 'true') return 'reload mất trạng thái tắt';
    await btn().click();
    if ((await p.evaluate(() => localStorage['ldb:muted'])) !== '0') return 'ldb:muted khác 0';
    await p.reload({ waitUntil: 'networkidle' });
    if ((await btn().getAttribute('aria-pressed')) !== 'false') return 'reload mất trạng thái bật';
  }, C.page);
  await C.ctx.close();

  // D
  const D = await newCtx();
  const pD = D.page;
  await check('D8 skip-link', async () => {
    await go(pD, '/');
    await pD.waitForTimeout(500);
    await pD.keyboard.press('Tab');
    const a = await activeInfo(pD);
    if (!a || !/hdr__skip/.test(a.cls)) return 'Tab đầu tới ' + JSON.stringify(a);
    await pD.keyboard.press('Enter');
    await pD.waitForTimeout(300);
    const h = await pD.evaluate(() => location.hash);
    if (h !== '#main') return 'hash=' + h;
  }, pD);
  await check('D9 focus-visible /', () => focusTour(pD, '/', 15, '/'), pD);
  await check('D10a focus-visible /bai/c2-b4', () => focusTour(pD, '/bai/c2-b4', 30, '/bai/c2-b4'), pD);
  await check('D10b focus-visible /tap/c3-e4', () => focusTour(pD, '/tap/c3-e4', 20, '/tap/c3-e4'), pD);

  await check('D11 quiz-ban-phim', async () => {
    await go(pD, '/tap/c1-e1');
    await tabUntil(pD, '.qz-opt', 60);
    await pD.keyboard.press('Enter');
    await pD.locator('.qz .says__bubble').first().waitFor({ timeout: 3000 });
  }, pD);

  await check('D12 theater-ban-phim', async () => {
    await go(pD, '/tap/c3-e6');
    await pD.waitForTimeout(500);
    // CodeMirror có thể giữ Tab: nếu kẹt trong editor thì Escape rồi Tab (quy ước của CodeMirror)
    let n = 0;
    for (let i = 0; i < 80 && !n; i++) {
      await pD.keyboard.press('Tab');
      if (await pD.evaluate(() => document.activeElement.matches('.ex-run'))) n = i + 1;
      else if (await pD.evaluate(() => !!document.activeElement.closest('.cm-editor'))) await pD.keyboard.press('Escape');
    }
    if (!n) throw new Error('không tới được nút Chạy bằng Tab');
    await pD.keyboard.press('Enter');
    await pD.locator('.qt').waitFor({ timeout: 10000 });
    await pD.waitForFunction(() => { const c = document.querySelector('.qt-clause'); return c && !c.disabled; }, null, { timeout: 40000 });
    await tabUntil(pD, '.qt-playbtn', 60);
    const label = (await pD.locator('.qt-playbtn').innerText()).trim();
    if (/Tạm dừng/.test(label)) await pD.keyboard.press('Enter');
    await tabUntil(pD, '.qt-speed__opt', 10);
    const val = () => pD.locator('.qt-progress').getAttribute('aria-valuenow').then(Number);
    const max = Number(await pD.locator('.qt-progress').getAttribute('aria-valuemax'));
    if ((await val()) >= max - 1) { await pD.keyboard.press('ArrowLeft'); await pD.keyboard.press('ArrowLeft'); await pD.keyboard.press('ArrowLeft'); }
    const v0 = await val();
    await pD.keyboard.press('ArrowRight');
    await pD.keyboard.press('ArrowRight');
    await pD.waitForTimeout(200);
    const v1 = await val();
    if (!(v1 > v0)) return `aria-valuenow ${v0} -> ${v1} (label nút: ${label})`;
  }, pD);

  await check('D13 hop-qua-ban-phim', async () => {
    await go(pD, '/bai/c2-b4');
    await pD.locator('.nbx').waitFor({ timeout: 10000 });
    await tabUntil(pD, '.nbx .sk-pick', 200);
    await pD.keyboard.press('Space');
    await tabUntil(pD, '.nbx__eq', 40);
    await pD.keyboard.press('Enter');
    await pD.waitForTimeout(300);
    if (!(await pD.locator('.nbx-card.is-open').count())) return 'nbx-card không có is-open';
  }, pD);
  await D.ctx.close();

  // E14
  if (errors.length) bad('E14 console', `${errors.length} lỗi: ` + [...new Set(errors)].slice(0, 6).join(' ;; '));
  else ok('E14 console');

  console.log(`TỔNG: ${pass} PASS, ${fail} FAIL`);
  await browser.close();
})().catch((e) => { console.error('script lỗi', e); process.exit(1); });

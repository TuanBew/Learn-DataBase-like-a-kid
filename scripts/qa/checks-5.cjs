// Kiểm chế độ reduced motion. Chạy: BASE=http://127.0.0.1:4173 node scripts/qa/checks-5.cjs
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:5173';
let pass = 0, fail = 0, warn = 0;
const ok = (n) => { pass++; console.log(`PASS ${n}`); };
const bad = (n, why) => { fail++; console.log(`FAIL ${n}: ${why}`); };
const wrn = (n, why) => { warn++; console.log(`WARN ${n}: ${why}`); };
const check = (n, cond, why) => (cond ? ok(n) : bad(n, why));

// Thao tác: một mảng bước. Chuỗi = bấm nút có aria-label hoặc chữ chứa chuỗi đó. {fill: số} = kéo thanh trượt.
// marker: 'reset' = nút "Làm lại" từ disabled/vắng sang enabled; chuỗi = selector, nội dung chữ của nó phải đổi; không có = chữ cả cảnh (trừ bong bóng) phải đổi.
const SCENES = [
  { id: 'c1-b1', idx: 0, name: 'data-street', steps: ['Đặt một ly'], marker: '.street__count' },
  { id: 'c1-b1', idx: 1, name: 'order-phone', steps: ['Đặt món'], marker: '.ophone__tablehead' },
  { id: 'c1-b2', idx: 0, name: 'excel-vs-db', steps: ['Hai người cùng bấm Lưu'], marker: 'reset' },
  { id: 'c1-b2', idx: 0, name: 'excel-vs-db/rule', steps: ['Luật giữ dữ liệu đúng', '-5000'] },
  { id: 'c1-b2', idx: 0, name: 'excel-vs-db/scale', steps: ['Dữ liệu rất lớn', { fill: 'max' }] },
  { id: 'c1-b3', idx: 0, name: 'table-anatomy', steps: ['price'] /* tiêu đề column không còn aria-label, tên là chữ hiển thị */, marker: '[aria-pressed="true"]' },
  { id: 'c1-b4', idx: 0, name: 'warehouse', steps: ['Đưa phiếu cho Bi'], marker: 'reset' },
  { id: 'c1-b5', idx: 0, name: 'client-server', steps: ['Bước tiếp'], marker: 'reset' },
  { id: 'c2-b1', idx: 0, name: 'pk-bonk', steps: ['17', 'Thêm row'], marker: 'reset' },
  { id: 'c2-b2', idx: 0, name: 'fk-rope', steps: ['1 Lý', 'Xóa khách này'], marker: 'reset' },
  { id: 'c2-b3', idx: 0, name: 'split-table', steps: ['Hường đổi số điện thoại'], marker: 'reset' },
  { id: 'c2-b4', idx: 0, name: 'null-box', steps: ['So sánh bằng'], marker: 'reset' },
  { id: 'c2-b5', idx: 0, name: 'constraint-gate', steps: ['4 Bánh flan', 'Đưa qua cổng'], marker: 'reset' },
  { id: 'c2-b6', idx: 0, name: 'erd', steps: ['stores'], marker: '.erd__box.is-sel' },
  { id: 'c3-b5', idx: 0, name: 'clause-order', steps: ['FROM:', 'WHERE:', 'GROUP BY:', 'HAVING:', 'SELECT:', 'ORDER BY:', 'LIMIT:', 'Kiểm tra'] },
  { id: 'c7-b1', idx: 0, name: 'dml-rehearsal', steps: ['UPDATE quên WHERE', 'Chạy'] },
  { id: 'c7-b2', idx: 0, name: 'tx-cart', steps: ['Đổi giá món 2', 'COMMIT'], marker: 'reset' },
  { id: 'c7-b3', idx: 0, name: 'index-race', steps: ['1.000.000', 'Chạy'], marker: 'reset' },
  { id: 'c7-b4', idx: 0, name: 'dialect-table', steps: ['Chạy cả hai'] },
];

const label = (b) => ((b.getAttribute('aria-label') || b.innerText) || '').replace(/\s+/g, ' ').trim();

async function clickBtn(scope, text) {
  const bs = scope.locator('button');
  const n = await bs.count();
  for (let i = 0; i < n; i++) {
    const b = bs.nth(i);
    const t = (((await b.getAttribute('aria-label')) || (await b.innerText())) || '').replace(/\s+/g, ' ').trim();
    if (t === text || t.startsWith(text)) { await b.click({ timeout: 4000 }); return; }
  }
  for (let i = 0; i < n; i++) {
    const b = bs.nth(i);
    const t = (((await b.getAttribute('aria-label')) || (await b.innerText())) || '').replace(/\s+/g, ' ').trim();
    if (t.includes(text)) { await b.click({ timeout: 4000 }); return; }
  }
  throw new Error(`không thấy nút "${text}"`);
}

// Trạng thái để so trước/sau.
const snapshot = (scope, marker) => scope.evaluate((root, marker) => {
  const bub = root.querySelector('.says__bubble');
  const say = bub ? bub.innerText.trim() : null;
  let state;
  if (marker === 'reset') {
    const r = [...root.querySelectorAll('button')].find((b) => /^Làm lại/.test(b.innerText.trim()));
    state = r ? (r.disabled ? 'reset-off' : 'reset-on') : 'reset-none';
  } else if (marker) {
    const els = [...root.querySelectorAll(marker)];
    state = els.length + '|' + els.map((e) => e.innerText).join('~');
  } else {
    const c = root.cloneNode(true);
    c.querySelectorAll('.says__bubble').forEach((e) => e.remove());
    state = c.innerText.replace(/\s+/g, ' ');
  }
  return { say, state };
}, marker);

// Animation dài còn chạy trong scope.
const longAnims = (scope) => scope.evaluate((root) => {
  const cls = (a) => {
    const t = a.effect && a.effect.target;
    if (!t) return '?';
    const c = (t.getAttribute && t.getAttribute('class')) || '';
    const name = a.animationName || a.transitionProperty || a.constructor.name;
    return `${t.tagName.toLowerCase()}${c ? '.' + c.trim().split(/\s+/).join('.') : ''} [${name}]`;
  };
  const finite = [], infinite = [];
  for (const a of root.getAnimations({ subtree: true })) {
    if (a.playState !== 'running') continue;
    const t = a.effect.getComputedTiming();
    const dur = typeof t.duration === 'number' ? t.duration : 0;
    if (dur <= 300) continue;
    (t.iterations === Infinity ? infinite : finite).push(`${cls(a)} ${Math.round(dur)}ms`);
  }
  return { finite, infinite };
}, null);

async function runScene(page, tag, scope, steps, marker, bubbleRequired = true) {
  await scope.scrollIntoViewIfNeeded();
  await scope.evaluate((r) => r.scrollIntoView({ block: 'center' }));
  const before = await snapshot(scope, marker);
  for (const s of steps) {
    if (typeof s === 'string') await clickBtn(scope, s);
    else if (s.fill !== undefined) { const r = scope.locator('input[type=range]').first(); await r.fill(s.fill === 'max' ? await r.getAttribute('max') : String(s.fill)); }
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(500);
  const after = await snapshot(scope, marker);
  if (bubbleRequired) {
    check(`${tag} bong bóng đổi`, !!after.say && after.say !== before.say, !after.say ? 'bong bóng rỗng hoặc không có' : 'chữ không đổi');
  }
  check(`${tag} kết quả hiện`, after.state !== before.state, `dấu hiệu không đổi (${String(before.state).slice(0, 40)})`);
  const an = await longAnims(scope);
  if (an.finite.length) bad(`${tag} không còn animation dài`, [...new Set(an.finite)].slice(0, 4).join('; '));
  else ok(`${tag} không còn animation dài`);
  if (an.infinite.length) wrn(`${tag} animation lặp vô hạn`, [...new Set(an.infinite)].join('; '));
}

(async () => {
  const br = await chromium.launch();
  for (const w of [1440, 390]) {
    const ctx = await br.newContext({ reducedMotion: 'reduce', viewport: { width: w, height: w === 390 ? 844 : 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => m.type() === 'error' && errs.push(`${page.url()} console: ${m.text().slice(0, 100)}`));
    page.on('pageerror', (e) => errs.push(`${page.url()} pageerror: ${String(e).slice(0, 100)}`));

    // Trang chủ
    {
      const tag = `[${w}] home`;
      try {
        await page.goto(BASE + '/', { waitUntil: 'networkidle' });
        const scope = page.locator('.home-hero__play').first();
        await scope.evaluate((r) => r.scrollIntoView({ block: 'center' }));
        const sel = '.flow__chips .chip:nth-child(3) b';
        const sayLoc = scope.locator('.says__bubble').first();
        const say0 = await sayLoc.innerText();
        const chip0 = await scope.locator(sel).first().innerText().catch(() => null);
        await scope.locator('.flow-app').first().click();
        await page.waitForTimeout(500);
        const say1 = await sayLoc.innerText();
        const chip1 = await scope.locator(sel).first().innerText().catch(() => null);
        check(`${tag} bong bóng đổi`, !!say1.trim() && say1 !== say0, 'chữ không đổi hoặc rỗng');
        check(`${tag} số row đổi`, chip1 !== chip0, `chip vẫn ${chip0}`);
        const an = await longAnims(scope);
        if (an.finite.length) bad(`${tag} không còn animation dài`, [...new Set(an.finite)].slice(0, 4).join('; '));
        else ok(`${tag} không còn animation dài`);
        if (an.infinite.length) wrn(`${tag} animation lặp vô hạn`, [...new Set(an.infinite)].join('; '));
      } catch (e) { bad(tag, String(e.message).split('\n')[0]); }
    }

    // 17 cảnh trong bài
    let loaded = null;
    for (const sc of SCENES) {
      const tag = `[${w}] ${sc.id}/${sc.name}`;
      try {
        if (loaded !== sc.id + (sc.name.includes('/') ? sc.name : '')) {
          await page.goto(`${BASE}/bai/${sc.id}`, { waitUntil: 'networkidle' });
          loaded = sc.id + (sc.name.includes('/') ? sc.name : '');
        }
        const scope = page.locator('section.scene').nth(sc.idx);
        if ((await scope.count()) === 0) { bad(tag, 'không có section.scene'); continue; }
        await runScene(page, tag, scope, sc.steps, sc.marker);
      } catch (e) {
        bad(tag, String(e.message).split('\n')[0]);
        loaded = null;
      }
      // Cảnh c1-b2 có ba tab dùng chung một trang: nạp lại cho chắc.
      if (sc.id === 'c1-b2') loaded = null;
    }

    // Query Theater
    {
      const tag = `[${w}] theater c3-e6`;
      try {
        await page.goto(`${BASE}/tap/c3-e6`, { waitUntil: 'networkidle' });
        await clickBtn(page.locator('main'), 'Chạy');
        await page.waitForSelector('.qt-progress', { timeout: 5000 });
        check(`${tag} có .qt-reduced`, (await page.locator('.qt-reduced').count()) > 0, 'không có dòng .qt-reduced');
        const val = () => page.locator('.qt-progress').getAttribute('aria-valuenow').then(Number);
        const v0 = await val();
        await page.waitForTimeout(2500);
        const v1 = await val();
        check(`${tag} không tự chạy`, v0 === v1, `aria-valuenow ${v0} thành ${v1}`);
        const next = page.locator('[aria-label="Tới một bước"]').first();
        for (let i = 0; i < 3; i++) { await next.click(); await page.waitForTimeout(100); }
        const v2 = await val();
        check(`${tag} 3 lần Tới một bước`, v2 === v1 + 3, `aria-valuenow ${v1} thành ${v2}`);
        const cap0 = await page.locator('.qt-caption').innerText();
        await clickBtn(page.locator('.qt'), 'Bỏ qua animation');
        await page.waitForTimeout(300);
        const max = Number(await page.locator('.qt-progress').getAttribute('aria-valuemax'));
        const v3 = await val();
        const capEnd = await page.locator('.qt-caption').innerText();
        check(`${tag} bỏ qua tới kết quả cuối`, v3 === max && capEnd !== cap0 && capEnd.trim() !== '', `valuenow ${v3}/${max}`);
        const an = await longAnims(page.locator('.qt'));
        if (an.finite.length) bad(`${tag} không còn animation dài`, [...new Set(an.finite)].slice(0, 4).join('; '));
        else ok(`${tag} không còn animation dài`);
        if (an.infinite.length) wrn(`${tag} animation lặp vô hạn`, [...new Set(an.infinite)].join('; '));
      } catch (e) { bad(tag, String(e.message).split('\n')[0]); }
    }

    if (errs.length) errs.forEach((e) => bad(`[${w}] lỗi console/page`, e)); else ok(`[${w}] không có lỗi console/page`);
    await ctx.close();
  }
  await br.close();
  console.log(`\nTổng: ${pass} PASS, ${fail} FAIL, ${warn} WARN`);
  process.exit(fail ? 1 : 0);
})();

// Đo tín hiệu của 15 hiệu ứng âm thanh. Cần dev server (import module nguồn): node scripts/qa/sfx-check.cjs
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:5173';
const NAMES = ['tap', 'pop', 'tick', 'drop', 'fly', 'whoosh', 'gate', 'ting', 'bonk', 'ok', 'bad', 'hint', 'lesson', 'chapter', 'alarm'];
let pass = 0, fail = 0;
const ok = (n) => { pass++; console.log(`PASS ${n}`); };
const bad = (n, why) => { fail++; console.log(`FAIL ${n}: ${why}`); };

const INIT = () => {
  window.__acCount = 0;
  window.__an = null;
  window.__acs = [];
  const Orig = window.AudioContext;
  window.AudioContext = function (...a) {
    const c = new Orig(...a);
    window.__acCount++;
    window.__acs.push(c);
    return c;
  };
  window.AudioContext.prototype = Orig.prototype;
  const origConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    const r = origConnect.call(this, dest, ...rest);
    if (dest instanceof AudioDestinationNode) {
      if (!window.__an || window.__an.context !== this.context) {
        window.__an = this.context.createAnalyser();
        window.__an.fftSize = 2048;
      }
      origConnect.call(this, window.__an);
    }
    return r;
  };
};

// Đo trong trang: mỗi 10ms đọc biên độ lớn nhất, trong 1,8 giây.
const MEASURE = async (name) => {
  const m = await import('/src/sfx/sfx.ts');
  m.play(name);
  const an = window.__an;
  if (!an) return { peak: 0, audibleMs: 0, noAnalyser: true, state: window.__acs[0] && window.__acs[0].state };
  const buf = new Float32Array(an.fftSize);
  let peak = 0, audible = 0, last = performance.now();
  const end = last + 1800;
  while (performance.now() < end) {
    await new Promise((r) => setTimeout(r, 10));
    const now = performance.now();
    an.getFloatTimeDomainData(buf);
    let mx = 0;
    for (let i = 0; i < buf.length; i++) { const v = Math.abs(buf[i]); if (v > mx) mx = v; }
    if (mx > peak) peak = mx;
    if (mx > 0.005) audible += now - last;
    last = now;
  }
  return { peak, audibleMs: audible, state: window.__acs[0] && window.__acs[0].state };
};

(async () => {
  const launch = async (args) => chromium.launch(args ? { args } : undefined);
  let br = await launch();
  const run = async () => {
    const ctx = await br.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => m.type() === 'error' && errs.push(`${page.url()} console: ${m.text().slice(0, 100)}`));
    page.on('pageerror', (e) => errs.push(`${page.url()} pageerror: ${String(e).slice(0, 100)}`));
    await page.addInitScript(INIT);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    return { ctx, page, errs };
  };

  let { ctx, page, errs } = await run();

  // 2. Chưa chạm: không được tạo AudioContext.
  await page.evaluate(async () => { const m = await import('/src/sfx/sfx.ts'); m.play('tap'); });
  const c0 = await page.evaluate(() => window.__acCount);
  if (c0 === 0) ok('chưa chạm thì không tạo AudioContext'); else bad('chưa chạm thì không tạo AudioContext', `__acCount = ${c0}`);

  // 3. Chạm rồi đo.
  await page.mouse.click(700, 400);
  await page.waitForTimeout(200);
  let results = [];
  for (const n of NAMES) {
    results.push({ n, ...(await page.evaluate(MEASURE, n)) });
    await page.waitForTimeout(300);
  }
  let method = 'launch mặc định';
  if (results.every((r) => r.peak === 0)) {
    console.log(`Mọi peak bằng 0 (state=${results[0].state}, noAnalyser=${!!results[0].noAnalyser}). Thử lại với --autoplay-policy=no-user-gesture-required.`);
    await ctx.close(); await br.close();
    br = await launch(['--autoplay-policy=no-user-gesture-required']);
    ({ ctx, page, errs } = await run());
    await page.mouse.click(700, 400);
    await page.waitForTimeout(200);
    results = [];
    for (const n of NAMES) {
      results.push({ n, ...(await page.evaluate(MEASURE, n)) });
      await page.waitForTimeout(300);
    }
    method = 'launch với --autoplay-policy=no-user-gesture-required';
  }
  console.log(`(cách chạy: ${method}; ctx.state=${results[0].state})`);
  console.log('tên       peak    ms     kết quả');
  for (const r of results) {
    const reasons = [];
    if (!(r.peak >= 0.01 && r.peak <= 0.6)) reasons.push(`peak ${r.peak.toFixed(3)} ngoài 0.01-0.6`);
    if (!(r.audibleMs >= 30 && r.audibleMs <= 2000)) reasons.push(`nghe được ${Math.round(r.audibleMs)}ms ngoài 30-2000`);
    console.log(`${r.n.padEnd(9)} ${r.peak.toFixed(3)}  ${String(Math.round(r.audibleMs)).padStart(5)}  ${reasons.length ? 'FAIL' : 'PASS'}`);
    if (reasons.length) bad(`âm ${r.n}`, reasons.join(', ')); else ok(`âm ${r.n}`);
  }

  // 4. Tắt tiếng.
  await page.evaluate(async () => { const m = await import('/src/sfx/sfx.ts'); m.setMuted(true); });
  await page.waitForTimeout(500);
  const mu = await page.evaluate(MEASURE, 'ok');
  if (mu.peak < 0.001) ok(`tắt tiếng thì im (peak ${mu.peak.toFixed(4)})`); else bad('tắt tiếng thì im', `peak ${mu.peak.toFixed(4)}`);
  await page.evaluate(async () => { const m = await import('/src/sfx/sfx.ts'); m.setMuted(false); });

  if (errs.length) errs.forEach((e) => bad('lỗi console/page', e)); else ok('không có lỗi console/page');
  await br.close();
  console.log(`\nTổng: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})();

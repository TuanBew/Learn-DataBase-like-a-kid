// Giải mọi bài tập trong giao diện thật. Dùng: BASE=... node scripts/qa/solve-all.cjs [lọc]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:5173';
const FILTER = process.argv[2] || '';
const SHOTS = '/tmp/claude-0/-home-user-Learn-DataBase-like-a-kid/d3b10267-15d8-57ef-b48b-b75d4add6e4b/scratchpad/solve';
const DIALECT_LABEL = { mysql: 'MySQL', oracle: 'Oracle' };
fs.mkdirSync(SHOTS, { recursive: true });

const ids = fs
  .readdirSync(path.join(__dirname, '../../src/content/exercises'))
  .filter((f) => /^c.*\.ts$/.test(f))
  .map((f) => f.replace(/\.ts$/, ''))
  .filter((id) => id.includes(FILTER))
  .sort();

const OK = '.ex-verdict--ok';
const norm = (s) => s.replace(/\s+/g, ' ').trim();

async function selectDialect(page, exercise, d) {
  if (exercise.dialects.length < 2) return;
  await page.locator('.ex-dialect button', { hasText: DIALECT_LABEL[d] }).click();
}

async function skipTheater(page) {
  const skip = page.locator('.qt-skip');
  try {
    await skip.waitFor({ state: 'visible', timeout: 5000 });
    for (let i = 0; i < 5 && (await skip.isEnabled().catch(() => false)); i++) {
      await skip.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(150);
    }
  } catch {}
}

async function typeSql(page, sql) {
  const ed = page.locator('.cm-content').first();
  await ed.waitFor({ state: 'visible', timeout: 15000 });
  // Gõ rồi đọc lại editor; nếu editor chưa nhận (gắn lazy) thì gõ lại.
  for (let i = 0; i < 4; i++) {
    await ed.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText(sql);
    const got = await ed.innerText();
    if (norm(got) === norm(sql)) return;
    await page.waitForTimeout(300);
  }
  throw new Error('editor không nhận đúng lời giải sau 4 lần gõ (closeBrackets hoặc editor chưa sẵn sàng)');
}

async function doSql(page, ex, d) {
  await typeSql(page, ex.solution[d]);
  await page.locator('.ex-run').click();
  if (ex.kind !== 'rehearsal') await skipTheater(page);
  await page.waitForSelector(OK, { timeout: 20000 });
}

async function doBuild(page, ex, d) {
  await typeSql(page, ex.solution[d]);
  await page.locator('.ex-run').click();
  await page.waitForSelector(OK, { timeout: 20000 });
  const open = await page.locator('.bw-ask.is-ok').count();
  const all = await page.locator('.bw-ask').count();
  if (open !== all) throw new Error(`chỉ ${open}/${all} ô tích bật`);
}

async function doOrder(page, ex, d) {
  for (const p of ex.pieces[d]) {
    const pool = page.locator('.opieces__piece--pool');
    const texts = await pool.allInnerTexts();
    const idx = texts.findIndex((t) => norm(t) === norm(p.replace(/\*\*|`/g, '')));
    if (idx < 0) throw new Error(`không thấy mẩu "${p}" ở khay`);
    await pool.nth(idx).click();
  }
  await page.locator('.opieces__bar .btn--matcha').click();
  await skipTheater(page);
  await page.waitForSelector(OK, { timeout: 20000 });
}

async function doPredict(page, ex, d) {
  const idxs = await page.evaluate(
    async ({ ex, d }) => {
      const { run } = await import('/src/engine/index.ts');
      const db = await (await import('/src/data/index.ts')).databases[ex.database]();
      const sol = run(ex.solution[d], db, d);
      if (!sol.ok) throw new Error('lời giải lỗi: ' + sol.error.message);
      const base = run(`SELECT * FROM ${ex.tables[0]}`, db, d);
      const want = new Set(sol.result.rowIds);
      return base.result.rowIds.map((id, i) => (want.has(id) ? i : -1)).filter((i) => i >= 0);
    },
    { ex, d },
  );
  const rows = page.locator('.ex-pick__row');
  for (const i of idxs) await rows.nth(i).click();
  await page.locator('.ex-run').click();
  await skipTheater(page);
  await page.waitForSelector(OK, { timeout: 20000 });
}

async function doQuiz(page, ex) {
  const sections = page.locator('.ex-work');
  for (let i = 0; i < ex.items.length; i++) {
    const q = ex.items[i];
    const sec = sections.nth(i);
    if (q.kind === 'choice') {
      const k = q.options.findIndex((o) => o.correct);
      await sec.locator('.qz-opt').nth(k).click();
    } else {
      for (let p = 0; p < q.pairs.length; p++) {
        await sec.locator('.qz-match__col').nth(0).locator('button').nth(p).click();
        const rights = sec.locator('.qz-match__col').nth(1).locator('button');
        const texts = await rights.locator('.qz-cell__text').allInnerTexts();
        const j = texts.findIndex((t) => t.trim() === q.pairs[p].right.trim());
        if (j < 0) throw new Error(`không thấy ô phải "${q.pairs[p].right}"`);
        await rights.nth(j).click();
      }
    }
  }
  await page.waitForSelector(OK, { timeout: 20000 });
}

async function main() {
  const browser = await chromium.launch();
  const boot = await browser.newPage();
  await boot.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const data = await boot.evaluate(async (ids) => {
    const out = {};
    for (const id of ids) out[id] = (await import('/src/content/exercises/' + id + '.ts')).exercise;
    return out;
  }, ids);
  await boot.close();

  let pass = 0;
  let fail = 0;
  for (const id of ids) {
    const ex = data[id];
    const dialects = ex.kind === 'quiz' ? ['mysql'] : ex.dialects;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(`console.error ${page.url()}: ${m.text().slice(0, 150)}`));
    page.on('pageerror', (e) => errors.push(`pageerror ${page.url()}: ${String(e.message).slice(0, 150)}`));
    for (const d of dialects) {
      const label = ex.kind === 'quiz' ? 'quiz' : d;
      try {
        // Mỗi lượt bắt đầu từ trình duyệt sạch: bỏ Database của bạn mà lượt trước (dialect kia) đã lưu.
        await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => localStorage.removeItem('ldb:mydb'));
        await page.goto(`${BASE}/tap/${id}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.ex-title', { timeout: 15000 });
        await page.waitForTimeout(400); // chờ editor lazy gắn xong, tránh đua với nút đổi dialect
        if (ex.kind !== 'quiz') await selectDialect(page, ex, d);
        // Bài start 'mine' mở trong trình duyệt sạch thì thiếu table của bài trước: bấm "Dựng theo mẫu".
        const useBase = page.locator('button', { hasText: 'Dựng theo mẫu' });
        if (ex.kind === 'build' && ex.start === 'mine') {
          await useBase.waitFor({ state: 'visible', timeout: 5000 });
          await useBase.click();
        } else if (await useBase.isVisible().catch(() => false)) await useBase.click();
        if (ex.kind === 'quiz') await doQuiz(page, ex);
        else if (ex.kind === 'build') await doBuild(page, ex, d);
        else if (ex.kind === 'order') await doOrder(page, ex, d);
        else if (ex.kind === 'predict') await doPredict(page, ex, d);
        else await doSql(page, ex, d);
        const prog = await page.evaluate(() => JSON.parse(localStorage.getItem('ldb:progress') || '{}'));
        const rec = prog.exercises && prog.exercises[id];
        if (!rec || !rec[ex.kind === 'quiz' ? 'mysql' : d]) throw new Error('progress không ghi bài đã xong');
        if (errors.length) throw new Error('lỗi trình duyệt: ' + errors.join(' | '));
        console.log(`PASS ${id} ${label}`);
        pass++;
      } catch (e) {
        fail++;
        console.log(`FAIL ${id} ${label}: ${String(e.message).split('\n')[0].slice(0, 200)}`);
        await page.screenshot({ path: path.join(SHOTS, `${id}-${label}.png`) }).catch(() => {});
        errors.length = 0;
      }
    }
    await ctx.close();
  }
  console.log(`Tổng: ${pass + fail} lượt, PASS ${pass}, FAIL ${fail}`);
  await browser.close();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => {
  console.error('Script lỗi:', e.message);
  process.exit(2);
});

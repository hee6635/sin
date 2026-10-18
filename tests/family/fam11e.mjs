import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = '/home/user/sin/app/src/main/assets';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript' };
const srv = http.createServer((req, res) => {
  let f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' });
  if (f.endsWith('.html')) return res.end(fs.readFileSync(f, 'utf8').replace("https://raw.githubusercontent.com; frame-src", "https://raw.githubusercontent.com http://127.0.0.1:9099 http://127.0.0.1:8080; frame-src"));   // 보안 잠금(CSP)을 켠 채로 시험: 에뮬레이터 주소만 더함
  fs.createReadStream(f).pipe(res);
}).listen(8211, '127.0.0.1');
const SC = '/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/v17/e2e11/';
fs.mkdirSync(SC, { recursive: true });
const log = (...a) => console.log(...a);
const EMU = { apiKey: 'fake-key', authDomain: 'demo-eonjeswieo.firebaseapp.com', projectId: 'demo-eonjeswieo', appId: '1:1:web:1', emulator: { auth: 'http://127.0.0.1:9099', firestore: ['127.0.0.1', 8080] } };
const b = await chromium.launch(); const errs = [];
let okN = 0, ngN = 0;
const check = (name, cond, extra = '') => { if (cond) { okN++; log('  ✓', name); } else { ngN++; log('  ✕', name, extra); } };
const T = +new Date('2026-10-12T10:00:00');
async function phone(name, state) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route('**/firebase/config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.FIREBASE_CONFIG=' + JSON.stringify(EMU) }));
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(name + ': ' + e.stack)); p.on('dialog', d => d.accept());
  await p.addInitScript(([st, T]) => { const D = Date; globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [T])); } static now() { return T; } };
    if (st && !localStorage.getItem('eonjeswieo:v1')) localStorage.setItem('eonjeswieo:v1', JSON.stringify(st));
    window.AndroidBridge = { status: () => '', setAlarms() {}, setReminders() {}, shareText: (t, m) => { window.__shared = m; } }; }, [state, T]);
  await p.goto('http://127.0.0.1:8211/index.html'); await p.waitForTimeout(600);
  return p;
}
const S = p => p.evaluate(() => JSON.parse(localStorage.getItem('eonjeswieo:v1')));
const wait = async (p, fn, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch (e) {} await p.waitForTimeout(250); } return false; };
const base = (anchor, team, extra = {}) => ({ addonNote: 'done', addons: { comp: false, cheer: false, together: false, colleague: false, stats: false, status: false }, onboarded: true, anchor, myTeam: team, patternName: '4조2교대', overrides: {}, ...extra });
const restRead = async (path_) => (await fetch(`http://127.0.0.1:8080/v1/projects/demo-eonjeswieo/databases/(default)/documents/${path_}`, { headers: { Authorization: 'Bearer owner' } })).json();
const closeAll = p => p.evaluate(() => { document.querySelector('#sheet [data-act="close"]')?.click(); const pop = document.getElementById('pop'); pop.className = ''; pop.innerHTML = ''; });

// ───── 아빠(호스트) · 엄마(own) · 할머니(view)
const H = await phone('host', base('2026-10-02', 1));
await H.click('#nav [data-tab="set"]'); await H.click('[data-act="link-open"]'); await H.waitForTimeout(1500);
const mkCode = async (who) => { await H.click('#page [data-act="link-invite"]'); await H.waitForTimeout(300);
  if (await H.$('#invHost')) await H.fill('#invHost', '아빠'); await H.fill('#invName', who);
  await H.click('#pop [data-act="inv-make"]'); await H.waitForSelector('.codebig', { timeout: 15000 });
  const c = (await H.$eval('.codebig', e => e.textContent)).replace('-', ''); await H.click('#pop [data-act="pop-close"]'); await H.waitForTimeout(800); return c; };
const codeA = await mkCode('엄마'), codeB = await mkCode('할머니');
const hostUid = await H.evaluate(() => window.__fbx.uid);
const join = async (P, code, name, mode) => { await P.click('#nav [data-tab="set"]'); await P.click('[data-act="link-open"]'); await P.waitForTimeout(800);
  await P.click('#page [data-act="link-join"]'); await P.fill('#joinCode', code); await P.click('#pop [data-act="join-check"]'); await P.waitForSelector('#joinName', { timeout: 15000 });
  if (mode === 'view') await P.click('.jopt[data-v="view"]'); await P.fill('#joinName', name); await P.click('#pop [data-act="join-go"]');
  await wait(P, async () => (await S(P)).link, 20000); return P.evaluate(() => window.__fbx.uid); };
const A = await phone('mom', base('2026-10-06', 2, { memos: {} })); const momUid = await join(A, codeA, '엄마', 'own');
const B = await phone('gma', base('2026-10-06', 2)); const gmaUid = await join(B, codeB, '할머니', 'view');
await H.evaluate(() => window.__onBack && window.__onBack());
check('호스트에게 엄마 근무표가 도착', await wait(H, async () => !!(await S(H)).fam2.scheds[momUid]));

// ───── 가족 메모: 엄마가 ♥ 메모를 쓰면 아빠 · 할머니 폰에 보임

// ───── 받는 사람 고르기: 엄마가 할머니를 빼고 메모를 보냄
await A.evaluate(() => window.__onBack && window.__onBack()); await A.click('#nav [data-tab="cal"]'); await A.waitForTimeout(300);
await A.click('.track .panel:nth-child(2) .cell[data-k="2026-10-17"] .bwrap'); await A.waitForTimeout(400);
await A.click('#sheet [data-act="memo-detail"]'); await A.waitForTimeout(300);
await A.fill('#mdText', '이모 결혼식 가자'); await A.click('#page [data-act="md-share"][data-v="1"]'); await A.click('#page [data-act="md-save"]'); await A.waitForTimeout(500);
const chips = await A.$$eval('#pop [data-act="cfm-to"]', a => a.map(x => x.textContent + ':' + x.classList.contains('on')));
check('확인창에 받는 사람 칩(아빠 · 할머니, 처음엔 모두 선택)', chips.length === 2 && chips.every(c => c.endsWith(':true')), JSON.stringify(chips));
await A.click(`#pop [data-act="cfm-to"][data-u="${gmaUid}"]`); await A.waitForTimeout(200);
check('할머니를 누르면 빠짐', await A.$eval(`#pop [data-act="cfm-to"][data-u="${gmaUid}"]`, e => !e.classList.contains('on')));
await A.click(`#pop [data-act="cfm-to"][data-u="${hostUid}"]`); await A.waitForTimeout(200);
check('한 명은 남아야 해서 아빠는 안 빠짐', await A.$eval(`#pop [data-act="cfm-to"][data-u="${hostUid}"]`, e => e.classList.contains('on')));
await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(600);
check('엄마 폰: 메모가 서버에 올라감', await wait(A, async () => Object.keys((await S(A)).fam2.memos).length === 1, 20000));
let docs = await restRead(`households/${hostUid}/memos`); for (let i = 0; i < 10 && (docs.documents || []).length !== 1; i++) { await A.waitForTimeout(800); docs = await restRead(`households/${hostUid}/memos`); }
const toList = ((docs.documents || [])[0]?.fields?.to?.arrayValue?.values || []).map(v => v.stringValue).sort();
check('서버 메모의 받는 사람 = 엄마 + 아빠', JSON.stringify(toList) === JSON.stringify([hostUid, momUid].sort()), JSON.stringify(toList));
check('아빠 폰에는 도착', await wait(H, async () => Object.keys((await S(H)).fam2.memos).length === 1, 20000));
await B.waitForTimeout(3500);
check('할머니 폰에는 안 옴(목록에도 없음)', Object.keys((await S(B)).fam2.memos).length === 0);
const gmaCards = await (async () => { await B.evaluate(() => window.__onBack && window.__onBack()); await B.click('#nav [data-tab="cal"]'); await B.waitForTimeout(400); return B.$$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-17"] .pl.fam', a => a.length); })();
check('할머니 달력 17일 칸에도 보라 메모 없음', gmaCards === 0, String(gmaCards));
check('엄마 폰의 그 메모에 받는 사람이 기억됨', (await S(A)).memos['2026-10-17'].some(m => Array.isArray(m.to) && m.to.length === 1 && m.to[0] === hostUid));

// ───── 옛 메모(to 없음)는 쓴 폰이 다시 열 때 채워 넣음
const docName = docs.documents[0].name;
await fetch(`http://127.0.0.1:8080/v1/${docName}?updateMask.fieldPaths=to`, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'content-type': 'application/json' }, body: JSON.stringify({ fields: {} }) });
let docs2 = await restRead(`households/${hostUid}/memos`);
check('(준비) 서버 메모에서 받는 사람을 지워 "옛 메모"로 만듦', !((docs2.documents || [])[0]?.fields?.to));
await A.reload(); await A.waitForTimeout(1500);
check('엄마가 앱을 다시 열면 받는 사람이 다시 채워짐', await wait(A, async () => { const d = await restRead(`households/${hostUid}/memos`); return !!(d.documents || [])[0]?.fields?.to; }, 25000));

log('\nERRORS', errs.length ? errs : 'none');
log(`${okN}개 통과, ${ngN}개 실패`);
await b.close(); srv.close();
process.exit(ngN || errs.length ? 1 : 0);

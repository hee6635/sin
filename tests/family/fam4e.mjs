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
}).listen(8127, '127.0.0.1');
const SC = '/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/v17/e2e4/';
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
  await p.goto('http://127.0.0.1:8127/index.html'); await p.waitForTimeout(600);
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
await A.evaluate(() => window.__onBack && window.__onBack()); await A.click('#nav [data-tab="cal"]'); await A.waitForTimeout(300);
await A.click('.track .panel:nth-child(2) .cell[data-k="2026-10-17"] .bwrap'); await A.waitForTimeout(400);
await A.click('#sheet [data-act="memo-detail"]'); await A.waitForTimeout(300);
await A.fill('#mdText', '장모님 생신 저녁 7시'); await A.click('#page [data-act="md-share"][data-v="1"]'); await A.click('#page [data-act="md-save"]'); await A.waitForTimeout(500); await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(500);
check('엄마 폰: 가족 메모가 서버에 올라감 + 횟수 1건 사용', await wait(A, async () => Object.keys((await S(A)).fam2.memos).length === 1 && (await S(A)).fam2.me.sent === 1, 20000), JSON.stringify((await S(A)).fam2.me));
let memoDocs = await restRead(`households/${hostUid}/memos`); for (let i = 0; i < 10 && (memoDocs.documents || []).length !== 1; i++) { await A.waitForTimeout(800); memoDocs = await restRead(`households/${hostUid}/memos`); }
check('서버 memos 에 1개', (memoDocs.documents || []).length === 1);
check('아빠 폰에 엄마 가족 메모가 도착 (달력 칸 · 날짜 화면)', await wait(H, async () => !!Object.keys((await S(H)).fam2.memos).length, 20000));
await H.click('#nav [data-tab="cal"]'); await H.waitForTimeout(500);
const hostPill = await H.$$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-17"] .pl.fam', a => a.map(x => x.textContent));
check('아빠 달력 17일 칸에 보라 메모 알약', hostPill.some(x => x.includes('장모님')), JSON.stringify(hostPill));
check('아빠 폰 소식에 "엄마님이 17일에 메모를 남겼어요"', (await S(H)).events.some(e => e.kind === 'memo' && e.text.includes('엄마')));
await H.click('.track .panel:nth-child(2) .cell[data-k="2026-10-17"] .bwrap'); await H.waitForTimeout(400);
const hcard = await H.$$eval('.mcard', a => a.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
check('아빠 날짜 화면에 "장모님 생신 저녁 7시 · 엄마"', hcard.some(x => x.includes('장모님') && x.includes('엄마')), JSON.stringify(hcard));
await H.screenshot({ path: SC + 'h_memo.png' }); await closeAll(H);
check('할머니(view) 폰에도 도착', await wait(B, async () => !!Object.keys((await S(B)).fam2.memos).length, 20000));
// 메모 수정 · 나만 보기로 바꾸기 → 서버 반영
await A.evaluate(() => { document.querySelector('[data-act="mm-edit"]'); });
await A.click('.mcard.fam'); await A.waitForTimeout(300);
await A.fill('#memoInput', '장모님 생신 저녁 8시'); await A.click('#sheet [data-act="memo-send"]'); await A.waitForTimeout(500); await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(500);
check('수정한 글이 서버에 반영', await wait(H, async () => Object.values((await S(H)).fam2.memos).some(m => m.text.includes('8시')), 20000));
// 지우기
await A.evaluate(() => { document.querySelector('#pop')?.click(); });
await A.evaluate(() => { const s = JSON.parse(localStorage.getItem('eonjeswieo:v1')); });
await closeAll(A);

// ───── 근무 요청: 엄마가 아빠 달력에서 31일 휴 요청 → 아빠가 수락 → 적용
await A.click('#nav [data-tab="fam"]'); await A.waitForTimeout(400);
await A.click('.vchip'); await A.waitForSelector('#page .cell[data-k="2026-10-31"]', { timeout: 8000 });
await A.click('#page .cell[data-k="2026-10-31"]'); await A.waitForTimeout(400);
const comp = await A.$eval('#sheet', e => e.innerText.replace(/\s+/g, ' '));
check('엄마: 아빠 31일 시트에 요청 쓰기 + 무료 남은 횟수', comp.includes('근무 요청') && comp.includes('무료 9건'), comp.slice(0, 140));
await A.screenshot({ path: SC + 'a_compose.png' });
await A.fill('#rqm2', '아이 할로윈 파티라 같이 가자'); await A.click('#sheet [data-act="vc-send"]'); await A.waitForTimeout(500); await A.click('#pop [data-act="cfm-ok"]');
check('아빠 폰에 요청 도착 · 소식 · 달력 링(주황) · 답할 1', await wait(H, async () => (await S(H)).requests.some(r => r.srv && r.dir === 'in' && r.date === '2026-10-31' && r.st === 'pending'), 20000));
await H.waitForTimeout(500);
const ring = await H.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-31"]', e => e.className);
check('아빠 31일 칸에 rq-ask 링', ring.includes('rq-ask'), ring);
const hr = await H.$eval('#top .hr', e => e.textContent.replace(/\s+/g, ' ').trim());
check('아빠 달력 위에 "답할 1"', hr.includes('1'), hr);
check('아빠 소식에 "엄마가 31일 휴 요청해요"', (await S(H)).events.some(e => e.kind === 'req' && e.text.includes('엄마가 31일 휴 요청해요')));
await H.screenshot({ path: SC + 'h_cal_ask.png' });
// 보류
await H.click('.rqmail'); await H.waitForTimeout(500); await H.click('.mtabs [data-v="req"]'); await H.waitForTimeout(300);
await H.screenshot({ path: SC + 'h_feed.png' });
await H.click('#sheet .ev [data-act="rq-go"]'); await H.waitForTimeout(500);
await H.click('#sheet [data-act="rqreply"][data-s="pending"]'); await H.waitForTimeout(400);
await H.click('#sheet [data-act="rqsend-reply"]'); await H.waitForTimeout(800);
check('아빠가 보류 → 엄마 폰에 보류 상태 · 소식', await wait(A, async () => (await S(A)).requests.some(r => r.srv && r.dir === 'out' && r.st === 'pending' && r.held), 20000));
check('엄마 소식에 "아빠가 31일 휴 요청을 보류했어요"', (await S(A)).events.some(e => e.text.includes('보류')));
const hold = await H.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-31"]', e => e.className).catch(() => '');
await closeAll(H); await H.waitForTimeout(300);
// 수락 + 적용
await H.click('#nav [data-tab="cal"]').catch(() => {}); await H.waitForTimeout(300);
check('보류 후 아빠 칸은 rq-hold', (await H.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-31"]', e => e.className)).includes('rq-hold'));
await H.click('.rqmail'); await H.waitForTimeout(500); await H.click('.mtabs [data-v="req"]'); await H.waitForTimeout(300);
await H.click('#sheet .ev [data-act="rq-go"]'); await H.waitForTimeout(500);
await H.click('#sheet [data-act="rqreply"][data-s="accepted"]'); await H.waitForTimeout(400);
await H.click('#sheet [data-act="rqsend-reply"]'); await H.waitForTimeout(800);
check('수락하고 근무 적용 → 아빠 31일이 휴로', (await S(H)).overrides['2026-10-31'] === '휴');
check('엄마 폰에 승인 상태', await wait(A, async () => (await S(A)).requests.some(r => r.srv && r.dir === 'out' && (r.st === 'applied' || r.st === 'accepted')), 20000));
check('엄마가 보는 아빠 달력도 바로 휴로 (근무표 다시 올림)', await wait(A, async () => (await S(A)).fam2.scheds[hostUid]?.overrides?.['2026-10-31'] === '휴', 20000));
await A.click('#page [data-act="page-close"]').catch(() => {}); await A.waitForTimeout(300);
await A.screenshot({ path: SC + 'a_after.png' });

// ───── 무료 횟수: 엄마는 이미 2건(메모 1 + 요청 1) → 8건 더 쓰면 막힘
const rem = async () => 10 - (await S(A)).fam2.me.sent;
check('남은 횟수 8건', await wait(A, async () => (await rem()) === 8, 10000), String(await rem()));
await closeAll(A);
// ───── 나가면 쓴 메모 · 요청도 사라짐
await A.click('#nav [data-tab="set"]'); await A.click('[data-act="link-open"]'); await A.waitForTimeout(1500);
await A.click('#page [data-act="link-leave"]');
check('엄마가 나가면 서버에서 메모 · 요청도 삭제', await wait(A, async () => { const m = await restRead(`households/${hostUid}/memos`), r = await restRead(`households/${hostUid}/requests`); return (!m.documents || !m.documents.length) && (!r.documents || !r.documents.length); }, 20000));
check('아빠 폰의 가족 메모 · 요청 복사본도 정리', await wait(H, async () => Object.keys((await S(H)).fam2.memos).length === 0 && !(await S(H)).requests.some(r => r.srv), 20000));
{ // 보안 잠금(CSP)에 막힌 것이 하나도 없어야 함 (앱이 막힌 요청을 폰 안 오류 기록에 적어 둠)
  const logs = []; for (const [n, P] of [['host', H], ['mom', A], ['gma', B]]) { const e = await P.evaluate(() => localStorage.getItem('eonjeswieo:err') || '[]'); if (/CSP/.test(e)) logs.push(n + ': ' + e.slice(0, 200)); }
  check('보안 잠금(CSP)에 막힌 요청 없음', logs.length === 0, logs.join(' | ')); }
log('\nERRORS', errs.length ? errs : 'none');
log(`${okN}개 통과, ${ngN}개 실패`);
await b.close(); srv.close();
process.exit(ngN || errs.length ? 1 : 0);

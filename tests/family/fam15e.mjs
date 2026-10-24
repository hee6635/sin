// v0.92 가족 포스트잇 E2E: 방장이 ♥ 가족 포스트잇을 붙이면 가족 폰에 보임 · 가족이 줄 체크(누가 했는지) · 동시에 다른 줄을 고쳐도 안 덮임 · 🔒 나만은 안 올라감 · 가족 → 나만 되돌리기 · 작은 점 · 가족방 5명
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = '/home/user/sin/app/src/main/assets';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript' };
http.createServer((req, res) => {
  let f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' });
  if (f.endsWith('.html')) return res.end(fs.readFileSync(f, 'utf8').replace("https://raw.githubusercontent.com; frame-src", "https://raw.githubusercontent.com http://127.0.0.1:9099 http://127.0.0.1:8080; frame-src"));   // 보안 잠금(CSP)을 켠 채로 시험
  fs.createReadStream(f).pipe(res);
}).listen(8215, '127.0.0.1');
const SC = '/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/e2e15/';
fs.mkdirSync(SC, { recursive: true });
const log = (...a) => console.log(...a);
const EMU = { apiKey: 'fake-key', authDomain: 'demo-eonjeswieo.firebaseapp.com', projectId: 'demo-eonjeswieo', appId: '1:1:web:1', emulator: { auth: 'http://127.0.0.1:9099', firestore: ['127.0.0.1', 8080] } };
const b = await chromium.launch(); const errs = [];
let okN = 0, ngN = 0;
const check = (name, cond, extra = '') => { if (cond) { okN++; log('  ✓', name); } else { ngN++; log('  ✕', name, extra, errs.length ? '| ERR: ' + errs.slice(-2).join(' // ').slice(0, 500) : ''); } };
const T = Date.now();   // 서버(에뮬레이터)의 실제 시각과 맞춤: 초대 코드 만료 규칙이 서버 시각을 씀
async function phone(name, state) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route('**/firebase/config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.FIREBASE_CONFIG=' + JSON.stringify(EMU) }));
  const p = await ctx.newPage(); p.ctx = ctx; p.dlg = []; p.ans = [];
  p.on('pageerror', e => errs.push(name + ': ' + e.stack));
  p.on('dialog', d => { p.dlg.push(d.message()); const a = p.ans.length ? p.ans.shift() : true; return a ? d.accept() : d.dismiss(); });
  await p.addInitScript(([st, T, nm]) => { const D = Date; globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [T])); } static now() { return T; } };
    if (st && !localStorage.getItem('eonjeswieo:v1')) localStorage.setItem('eonjeswieo:v1', JSON.stringify(st));
    window.AndroidBridge = { status: () => '', setAlarms() {}, setReminders() {}, shareText: (t, m) => { window.__shared = m; }, fcmToken: () => 'tok-' + nm + '-' + 'x'.repeat(30), notifEnabled: () => true }; }, [state, T, name]);
  await p.addInitScript(() => { setInterval(() => { const b = document.querySelector('#pop.open [data-act="stkshare-no"]'); if (b) b.click(); }, 300); });   // 가족 스티커 묻는 창이 시험을 가로막지 않게
  await p.goto('http://127.0.0.1:8215/index.html'); await p.waitForTimeout(700);
  return p;
}
const S = p => p.evaluate(() => JSON.parse(localStorage.getItem('eonjeswieo:v1')));
const wait = async (p, fn, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch (e) {} await p.waitForTimeout(250); } return false; };
const base = (anchor, team, extra = {}) => ({ addonNote: 'done', addons: { comp: false, cheer: false, together: false, colleague: false, stats: false, status: false }, onboarded: true, anchor, myTeam: team, patternName: '4조2교대', overrides: {}, ...extra });
const DB = 'http://127.0.0.1:8080/v1/projects/demo-eonjeswieo/databases/(default)/documents/';
const restRead = async (path_) => (await fetch(DB + path_, { headers: { Authorization: 'Bearer owner' } })).json();
const exists = async (path_) => { const r = await restRead(path_); return !r.error && !!r.fields; };
const ids = async (path_) => ((await restRead(path_)).documents || []).map(d => d.name.split('/').pop());
const accts = async () => ((await (await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-eonjeswieo/accounts:batchGet?maxResults=500', { headers: { Authorization: 'Bearer owner' } })).json()).users || []).map(u => u.localId);
const openLink = async (P) => { await P.click('#nav [data-tab="set"]'); await P.click('[data-act="link-open"]'); await P.waitForTimeout(1200); };
const mkCode = async (H, who) => { await H.click('#page [data-act="link-invite"]'); await H.waitForTimeout(300);
  if (await H.$('#invHost')) await H.fill('#invHost', '아빠'); await H.fill('#invName', who);
  await H.click('#pop [data-act="inv-make"]'); try { await H.waitForSelector('.codebig', { timeout: 15000 }); } catch (e) { log('DEBUG pop:', (await H.evaluate(() => document.getElementById('pop').innerText)).slice(0, 300), '| toast:', await H.evaluate(() => document.getElementById('toast').innerText), '| errs:', errs.slice(-3)); await H.screenshot({ path: SC + 'dbg.png' }); throw e; }
  const c = (await H.$eval('.codebig', e => e.textContent)).replace('-', ''); await H.click('#pop [data-act="pop-close"]'); await H.waitForTimeout(800); return c; };
const join = async (P, code, name, mode) => { await openLink(P); await P.click('#page [data-act="link-join"]'); await P.fill('#joinCode', code); await P.click('#pop [data-act="join-check"]'); await P.waitForSelector('#joinName', { timeout: 15000 });
  if (mode === 'view') await P.click('.jopt[data-v="view"]'); await P.fill('#joinName', name); await P.click('#pop [data-act="join-go"]');
  await wait(P, async () => (await S(P)).link, 20000); await P.evaluate(() => window.__onBack && window.__onBack()); return P.evaluate(() => window.__fbx.uid); };

const H = await phone('host', base('2026-10-02', 1));
await openLink(H);
const codeMom = await mkCode(H, '엄마');
const hostUid = await H.evaluate(() => window.__fbx.uid);
await H.evaluate(() => window.__onBack && window.__onBack());
const A = await phone('mom', base('2026-10-06', 2));
const momUid = await join(A, codeMom, '엄마', 'own');
check('준비: 가족방에 아빠 · 엄마', await wait(H, async () => (await S(H)).fam2.members.length === 2, 20000));
const toCal = async (P) => { const pt = await P.evaluate(() => { const p = document.getElementById('pop'); return p.classList.contains('open') ? p.innerText.slice(0, 80) : ''; }); if (pt) { log('   (열린 창 닫음: ' + pt.replace(/\s+/g, ' ') + ')'); await P.evaluate(() => { const p = document.getElementById('pop'); p.className = ''; p.innerHTML = ''; }); }
  await P.evaluate(() => { window.__onBack && window.__onBack(); }); await P.waitForTimeout(200);
  const pt2 = await P.evaluate(() => { const p = document.getElementById('pop'); return p.classList.contains('open') ? p.innerText.slice(0, 120) : ''; }); if (pt2) log('   (뒤로 뒤 열린 창: ' + pt2.replace(/\s+/g, ' ') + ')');
  await P.evaluate(() => { const p = document.getElementById('pop'); if (p.classList.contains('open')) { p.className = ''; p.innerHTML = ''; } document.querySelector('#nav [data-tab="cal"]').click(); }); await P.waitForTimeout(400); };
const board = async (P) => { await toCal(P); await P.evaluate(() => document.querySelector('[data-act="open-board"]').click()); await P.waitForTimeout(600); };
const closeBoard = async (P) => { await P.evaluate(() => { const x = document.querySelector('#page [data-act="page-close"]'); x && x.click(); }); await P.waitForTimeout(300); };
const docs = async () => ((await restRead(`households/${hostUid}/board`)).documents || []);
const F = (d) => d.fields;

// 1) 방장: ♥ 가족 할 일 포스트잇 "장보기" (우유 · 계란)
await board(H);
await H.click('#page [data-act="pi-new"]'); await H.waitForTimeout(300);
await H.click('#pop [data-act="pi-type"][data-v="list"]'); await H.fill('#piTitle', '장보기');
for (const x of ['우유', '계란']) { await H.fill('#piLine', x); await H.click('#pop [data-act="pi-ladd"]'); await H.waitForTimeout(150); }
await H.click('#pop [data-act="pi-share"][data-v="1"]'); await H.click('#pop [data-act="pi-save"]'); await H.waitForTimeout(500);
check('서버에 가족 포스트잇이 올라감(문서 id = 방장uid_…)', await wait(H, async () => (await docs()).some(d => d.name.split('/').pop().startsWith(hostUid + '_') && F(d).title.stringValue === '장보기'), 20000), JSON.stringify(await docs()).slice(0, 300));
const pidDoc = (await docs()).find(d => F(d).title.stringValue === '장보기'); const PID = pidDoc.name.split('/').pop();
check('올라간 뒤 방장 폰의 원본(S.board)은 지워지고 서버 복사본으로 보임', await wait(H, async () => { const s = await S(H); return !Object.values(s.board).flat().some(n => n.title === '장보기') && !!s.fam2.board[PID]; }, 10000));
// 🔒 나만 포스트잇은 안 올라감
await H.click('#page [data-act="pi-new"]'); await H.waitForTimeout(300);
await H.fill('#piText', '비밀 메모'); await H.click('#pop [data-act="pi-save"]'); await H.waitForTimeout(3500);
check('🔒 나만 포스트잇은 서버에 없음', !(await docs()).some(d => (F(d).text?.stringValue || '').includes('비밀')));

// 2) 엄마 폰에 보임 + 체크
check('엄마 폰에 가족 포스트잇이 내려옴', await wait(A, async () => !!(await S(A)).fam2.board[PID], 20000));
check('엄마 폰 포스트잇 아이콘에 작은 점(가족이 고침)', await wait(A, async () => { await toCal(A); return !!(await A.$('.pi-btn .pi-dot')); }, 8000));
await board(A);
const wallA = await A.evaluate(() => document.querySelector('#page').textContent);
check('엄마 벽에 "장보기 · 우유 · 계란" · 비밀 메모는 안 보임', wallA.includes('장보기') && wallA.includes('우유') && wallA.includes('계란') && !wallA.includes('비밀'), wallA.slice(0, 200));
check('벽을 열면 점이 사라짐', !(await S(A)).fam2.boardDot);
await A.evaluate(() => { const c = [...document.querySelectorAll('#page .ck')].find(e => e.textContent.includes('우유')); c.click(); }); await A.waitForTimeout(400);
check('엄마가 "우유" 체크 → 서버에 d=true, b=엄마uid', await wait(A, async () => { const d = (await docs()).find(x => x.name.endsWith(PID)); const l = Object.values(F(d).lines.mapValue.fields).find(v => v.mapValue.fields.x.stringValue === '우유'); return l && l.mapValue.fields.d.booleanValue === true && l.mapValue.fields.b.stringValue === momUid; }, 15000));
await closeBoard(H); await board(H);
check('방장 벽: "엄마가 완료"', await wait(H, async () => { await closeBoard(H); await board(H); return (await H.evaluate(() => document.querySelector('#page').textContent)).includes('엄마가 완료'); }, 15000));

// 3) 엄마는 제목을 못 고침(읽기 전용) · 줄 추가는 됨
await A.evaluate(() => { const c = [...document.querySelectorAll('#page .pi')].find(e => e.textContent.includes('장보기')); c.click(); }); await A.waitForTimeout(400);
check('엄마 편집창: 제목은 읽기 전용 · 지우기 버튼 없음 · 나만/가족 고르기 없음', await A.evaluate(() => document.querySelector('#piTitle').readOnly && !document.querySelector('#pop [data-act="pi-del"]') && !document.querySelector('#pop [data-act="pi-share"]')));
// 동시에: 엄마는 "빵" 추가, 방장은 "계란" 체크
await A.fill('#piLine', '빵');
await Promise.all([
  A.click('#pop [data-act="pi-ladd"]'),
  H.evaluate(() => { const c = [...document.querySelectorAll('#page .ck')].find(e => e.textContent.includes('계란')); c.click(); }),
]);
const okBoth = await wait(H, async () => { const d = (await docs()).find(x => x.name.endsWith(PID)); const ls = Object.values(F(d).lines.mapValue.fields).map(v => v.mapValue.fields); return ls.length === 3 && ls.some(l => l.x.stringValue === '빵') && ls.find(l => l.x.stringValue === '계란').d.booleanValue === true && ls.find(l => l.x.stringValue === '우유').d.booleanValue === true; }, 15000);
check('★ 동시에 다른 줄을 고쳐도 안 덮임 (빵 추가 + 계란 체크 + 우유 체크 그대로)', okBoth, JSON.stringify((await docs()).find(x => x.name.endsWith(PID))?.fields?.lines).slice(0, 400));
await A.click('#pop [data-act="pi-save"]'); await A.waitForTimeout(300);
check('방장 폰에도 "빵"이 보임', await wait(H, async () => { await closeBoard(H); await board(H); return (await H.evaluate(() => document.querySelector('#page').textContent)).includes('빵'); }, 15000));

// 4) 방장: 가족 → 나만 되돌리기
await H.evaluate(() => { const c = [...document.querySelectorAll('#page .pi')].find(e => e.textContent.includes('장보기')); c.click(); }); await H.waitForTimeout(400);
await H.click('#pop [data-act="pi-share"][data-v="0"]'); await H.waitForTimeout(300);
await H.click('#pop [data-act="pi-save"]'); await H.waitForTimeout(500);
check('가족 → 나만: 서버에서 지워짐', await wait(H, async () => !(await docs()).some(d => d.name.endsWith(PID)), 15000));
const hb = await S(H);
const local = Object.values(hb.board).flat().find(n => n.title === '장보기');
check('방장 폰에 나만 포스트잇으로 남음(줄 3개 · 체크 그대로)', !!local && local.shared === false && local.lines.length === 3 && local.lines.filter(l => l.done).length === 2, JSON.stringify(local).slice(0, 300));
check('엄마 폰에서는 사라짐', await wait(A, async () => !(await S(A)).fam2.board[PID], 15000));

// 5) 가족방 5명: 셋 더 들어오면 가득
for (const [nm, a] of [['딸', '2026-10-03'], ['아들', '2026-10-04'], ['할머니', '2026-10-05']]) {
  await toCal(H); await openLink(H); const c = await mkCode(H, nm); await H.evaluate(() => window.__onBack && window.__onBack());
  const P = await phone(nm, base(a, 3)); await join(P, c, nm, 'own');
}
check('가족방에 5명', await wait(H, async () => (await S(H)).fam2.members.length === 5, 30000), String((await S(H)).fam2.members.length));
await toCal(H); await openLink(H); await H.waitForTimeout(1500);
const lt = await H.evaluate(() => document.querySelector('#page').textContent.replace(/\s+/g, ' '));
check('방장 화면: 가족 4/4명 · 가족 자리가 가득 찼어요 · 초대 버튼 없음', lt.includes('4/4명') && lt.includes('가족 자리가 가득 찼어요') && !(await H.$('#page [data-act="link-invite"]')), lt.slice(0, 300));
check('에러 없음', errs.length === 0, errs.slice(0, 2).join(' // '));
log(`\n${okN}개 통과, ${ngN}개 실패`);
await b.close(); process.exit(ngN ? 1 : 0);

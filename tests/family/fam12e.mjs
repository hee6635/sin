// v0.63 내 데이터 모두 지우기 E2E (1): 가족(게스트) 지우기 → 서버 정리 + 로그인 계정 삭제 · 지운 뒤 다시 가입 · 호스트 지우기 → 가족방 통째로 정리
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
}).listen(8213, '127.0.0.1');
const SC = '/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/v63/e2e12/';
fs.mkdirSync(SC, { recursive: true });
const log = (...a) => console.log(...a);
const EMU = { apiKey: 'fake-key', authDomain: 'demo-eonjeswieo.firebaseapp.com', projectId: 'demo-eonjeswieo', appId: '1:1:web:1', emulator: { auth: 'http://127.0.0.1:9099', firestore: ['127.0.0.1', 8080] } };
const b = await chromium.launch(); const errs = [];
let okN = 0, ngN = 0;
const check = (name, cond, extra = '') => { if (cond) { okN++; log('  ✓', name); } else { ngN++; log('  ✕', name, extra, errs.length ? '| ERR: ' + errs.slice(-2).join(' // ').slice(0, 500) : ''); } };
const T = Date.now();   // 서버(에뮬레이터)의 실제 시각과 맞춤(초대 코드 만료 규칙이 서버 시각을 씀)
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
  await p.goto('http://127.0.0.1:8213/index.html'); await p.waitForTimeout(700);
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
  await H.click('#pop [data-act="inv-make"]'); await H.waitForSelector('.codebig', { timeout: 15000 });
  const c = (await H.$eval('.codebig', e => e.textContent)).replace('-', ''); await H.click('#pop [data-act="pop-close"]'); await H.waitForTimeout(800); return c; };
const join = async (P, code, name, mode) => { await openLink(P); await P.click('#page [data-act="link-join"]'); await P.fill('#joinCode', code); await P.click('#pop [data-act="join-check"]'); await P.waitForSelector('#joinName', { timeout: 15000 });
  if (mode === 'view') await P.click('.jopt[data-v="view"]'); await P.fill('#joinName', name); await P.click('#pop [data-act="join-go"]');
  await wait(P, async () => (await S(P)).link, 20000); await P.evaluate(() => window.__onBack && window.__onBack()); return P.evaluate(() => window.__fbx.uid); };
const wipe = async (P) => { await P.evaluate(() => { document.querySelector('#sheet [data-act="close"]')?.click(); const pop = document.getElementById('pop'); pop.className = ''; pop.innerHTML = ''; }); await P.waitForTimeout(300); await P.click('#nav [data-tab="set"]'); await P.waitForTimeout(200); await P.click('[data-act="more-wipe"]'); };
const wiped = (P) => wait(P, async () => (await P.$eval('#onboard', e => e.classList.contains('open'))) && !(await S(P)).link, 40000);

// ───── 준비: 아빠(호스트) · 엄마(own) · 할머니(view)
const H = await phone('host', base('2026-10-02', 1));
await openLink(H);
const codeMom = await mkCode(H, '엄마'), codeGma = await mkCode(H, '할머니'), codeMom2 = await mkCode(H, '엄마2');
const hostUid = await H.evaluate(() => window.__fbx.uid);
await H.evaluate(() => window.__onBack && window.__onBack());
const A = await phone('mom', base('2026-10-06', 2));
const momUid = await join(A, codeMom, '엄마', 'own');
const B = await phone('gma', base('2026-10-06', 2));
const gmaUid = await join(B, codeGma, '할머니', 'view');
check('준비: 가족방에 아빠 · 엄마 · 할머니', await wait(H, async () => (await S(H)).fam2.members.length === 3, 20000));

// 엄마가 가족 메모를 하나 보냄
await A.click('#nav [data-tab="cal"]'); await A.waitForTimeout(300);
await A.click('.track .panel:nth-child(2) .cell[data-k="2026-10-17"] .bwrap'); await A.waitForTimeout(400);
await A.click('#sheet [data-act="memo-detail"]'); await A.waitForTimeout(300);
await A.fill('#mdText', '지우기 시험 메모'); await A.click('#page [data-act="md-share"][data-v="1"]'); await A.click('#page [data-act="md-save"]'); await A.waitForTimeout(500);
await A.click('#pop [data-act="cfm-ok"]');
check('엄마 가족 메모가 서버에 올라감', await wait(A, async () => (await ids(`households/${hostUid}/memos`)).length === 1, 20000));
check('엄마 근무표 · 알림 주소 · 가족방 쪽지가 서버에 있음', await wait(A, async () => await exists(`households/${hostUid}/schedules/${momUid}`) && await exists(`devices/${momUid}`) && await exists(`users/${momUid}`), 20000));
check('로그인 계정 3개(아빠 · 엄마 · 할머니)', (await accts()).includes(momUid) && (await accts()).includes(hostUid) && (await accts()).includes(gmaUid));

// ───── 1) 엄마(가족)가 모두 지우기
await wipe(A);
check('엄마: 지우기 확인창 2번 (가족방 · 인터넷 안내 포함)', A.dlg.length >= 2 && A.dlg[0].includes('가족방에서도 나가요') && A.dlg[0].includes('인터넷'), JSON.stringify(A.dlg));
check('엄마: 지운 뒤 처음 화면이 열리고 가족 연결이 풀림', await wiped(A), JSON.stringify(A.dlg));
check('엄마: 확인창은 딱 2번 (실패 알림 없음)', A.dlg.length === 2, JSON.stringify(A.dlg));
const as = await S(A);
check('엄마: 저장 값이 처음 상태 (가족 · 메모 · 근무표 없음)', !as.link && !as.myset && Object.keys(as.memos || {}).length === 0, JSON.stringify(as).slice(0, 200));
check('엄마: 앱 저장 키가 모두 지워짐(남은 건 새로 쓴 기본 값 하나)', (await A.evaluate(() => Object.keys(localStorage).filter(k => /^(eonjeswieo|shiftcal):/.test(k)))).every(k => k === 'eonjeswieo:v1' || k === 'eonjeswieo:err'));
check('서버: 엄마 구성원 자리 · 근무표 · 가족 메모가 지워짐', !(await exists(`households/${hostUid}/members/${momUid}`)) && !(await exists(`households/${hostUid}/schedules/${momUid}`)) && (await ids(`households/${hostUid}/memos`)).length === 0);
check('서버: 엄마 알림 주소 · 가족방 쪽지가 지워짐', !(await exists(`devices/${momUid}`)) && !(await exists(`users/${momUid}`)));
check('★ 서버: 엄마의 로그인 계정이 지워짐 (아빠 · 할머니는 그대로)', !(await accts()).includes(momUid) && (await accts()).includes(hostUid) && (await accts()).includes(gmaUid), JSON.stringify(await accts()));
check('서버: 가족방 인원 수가 2 → 1 로 줄고 방은 그대로', (await restRead(`households/${hostUid}`)).fields?.guestCount?.integerValue === '1');
check('아빠 폰: 가족 목록에서 엄마가 빠짐', await wait(H, async () => (await S(H)).fam2.members.length === 2, 20000));
await A.screenshot({ path: SC + 'a_after_wipe.png' });

// ───── 2) 지운 뒤 다시 쓰기: 같은 폰으로 새 초대 코드 참여 (새 로그인 번호)
await H.click('#nav [data-tab="set"]'); await openLink(H);
const codeNew = codeMom2;
await A.click('#onboard [data-act="ob-invite"]'); await A.fill('#joinCode', codeNew); await A.click('#pop [data-act="join-check"]'); await A.waitForSelector('#joinName', { timeout: 15000 });
await A.fill('#joinName', '엄마'); await A.click('#pop [data-act="join-go"]');
check('지운 뒤 같은 폰이 새 초대 코드로 다시 가입됨', await wait(A, async () => (await S(A)).link, 25000));
const momUid2 = await A.evaluate(() => window.__fbx.uid);
check('★ 새 로그인 번호로 들어옴 (이전 번호와 다름)', momUid2 && momUid2 !== momUid, momUid2 + ' / ' + momUid);
check('서버에 새 엄마 구성원 자리가 생김', await wait(A, async () => await exists(`households/${hostUid}/members/${momUid2}`), 20000));
await A.waitForTimeout(500);

// ───── 3) 아빠(처음 만든 사람)가 모두 지우기 → v0.96 방장 없음: 아빠만 나가고 가족방은 남은 가족으로 그대로
await H.evaluate(() => window.__onBack && window.__onBack());
check('지우기 전: 구성원 3명', (await ids(`households/${hostUid}/members`)).length === 3);
await wipe(H);
check('아빠: 확인창에 "가족방에서도 나가요" 안내', H.dlg[0].includes('가족방에서도 나가요') && H.dlg[0].includes('인터넷'), H.dlg[0]);
check('아빠: 지운 뒤 처음 화면 · 가족 연결 풀림', await wiped(H), JSON.stringify(H.dlg));
check('아빠: 확인창은 딱 2번', H.dlg.length === 2, JSON.stringify(H.dlg));
check('서버: 아빠만 빠지고 가족방은 그대로 (엄마 · 할머니)', await exists(`households/${hostUid}`) && (await ids(`households/${hostUid}/members`)).length === 2 && !(await exists(`households/${hostUid}/members/${hostUid}`)));
check('서버: 아빠 알림 주소 · 쪽지가 지워짐', !(await exists(`devices/${hostUid}`)) && !(await exists(`users/${hostUid}`)));
check('★ 서버: 아빠의 로그인 계정이 지워짐', !(await accts()).includes(hostUid), JSON.stringify(await accts()));
await B.waitForTimeout(3000);
check('할머니 · 엄마 폰: 가족 연결 그대로', !!(await S(B)).link && !!(await S(A)).link);
check('할머니 폰: 가족 목록에서 아빠가 빠짐', await wait(B, async () => (await S(B)).fam2.members.length === 2, 20000));
await H.screenshot({ path: SC + 'h_after_wipe.png' });
check('화면 오류 없음', errs.length === 0, errs.join(' // ').slice(0, 600));

log(`\n결과: 통과 ${okN} · 실패 ${ngN}`);
await b.close();
process.exit(ngN ? 1 : 0);

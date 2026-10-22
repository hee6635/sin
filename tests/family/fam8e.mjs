// v0.21~0.22 가족 E2E: 처음 설치 후 초대 참여(근무표 만들기 전엔 안 올림) · 확인창 · 메모 수정 알림 · 모두에게 알리기 (아빠 · 엄마 · 딸(새 폰) · 할머니(view))
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
}).listen(8131, '127.0.0.1');
const SC = '/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/v21/e2e6/';
fs.mkdirSync(SC, { recursive: true });
const log = (...a) => console.log(...a);
const EMU = { apiKey: 'fake-key', authDomain: 'demo-eonjeswieo.firebaseapp.com', projectId: 'demo-eonjeswieo', appId: '1:1:web:1', emulator: { auth: 'http://127.0.0.1:9099', firestore: ['127.0.0.1', 8080] } };
const b = await chromium.launch(); const errs = [];
let okN = 0, ngN = 0;
const check = (name, cond, extra = '') => { if (cond) { okN++; log('  ✓', name); } else { ngN++; log('  ✕', name, extra, errs.length ? '| ERR: ' + errs.slice(-2).join(' // ').slice(0, 600) : ''); } };
const T = Date.now();   // 서버 시각과 맞춤(초대 코드 만료 규칙)
async function phone(name, state) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route('**/firebase/config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.FIREBASE_CONFIG=' + JSON.stringify(EMU) }));
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(name + ': ' + e.stack)); p.on('dialog', d => d.accept());
  await p.addInitScript(([st, T]) => { const D = Date; globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [T])); } static now() { return T; } };
    if (st && !localStorage.getItem('eonjeswieo:v1')) localStorage.setItem('eonjeswieo:v1', JSON.stringify(st));
    window.AndroidBridge = { status: () => '', setAlarms() {}, setReminders() {}, shareText: (t, m) => { window.__shared = m; }, googleAvailable: () => true, googleSignIn: (req) => { setTimeout(() => window.__onGoogle({ req, idToken: JSON.stringify({ sub: 'g-mom-1', email: 'mom@example.com', email_verified: true }), email: 'mom@example.com' }), 50); }, fcmToken: () => '', takePush: () => '' }; }, [state, T]);
  await p.addInitScript(() => { setInterval(() => { const b = document.querySelector('#pop.open [data-act="stkshare-no"]'); if (b) b.click(); }, 300); });   // 가족 스티커 묻는 창이 시험을 가로막지 않게
  await p.goto('http://127.0.0.1:8131/index.html'); await p.waitForTimeout(700);
  return p;
}
const S = p => p.evaluate(() => JSON.parse(localStorage.getItem('eonjeswieo:v1')));
const wait = async (p, fn, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch (e) {} await p.waitForTimeout(250); } return false; };
const base = (anchor, team, extra = {}) => ({ addonNote: 'done', addons: { comp: false, cheer: false, together: false, colleague: false, stats: false, status: false }, onboarded: true, anchor, myTeam: team, patternName: '4조2교대', overrides: {}, ...extra });
const restRead = async (path_) => (await fetch(`http://127.0.0.1:8080/v1/projects/demo-eonjeswieo/databases/(default)/documents/${path_}`, { headers: { Authorization: 'Bearer owner' } })).json();
const closeAll = p => p.evaluate(() => { document.querySelector('#sheet [data-act="close"]')?.click(); const pop = document.getElementById('pop'); pop.className = ''; pop.innerHTML = ''; });
const toRoot = p => p.evaluate(() => { const pop = document.getElementById('pop'); pop.className = ''; pop.innerHTML = ''; document.querySelector('#sheet [data-act="close"]')?.click(); document.querySelector('#page [data-act="page-close"]')?.click(); });
const popText = p => p.evaluate(() => document.getElementById('pop').innerText.replace(/\s+/g, ' '));


// ───── 아빠(호스트) · 엄마 · 딸 (모두 예전 사용자 방식으로 참여)
const H = await phone('host', base('2026-10-02', 1));
await H.click('#nav [data-tab="set"]'); await H.click('[data-act="link-open"]'); await H.waitForTimeout(1500);
const mkCode = async (who) => { await H.click('#page [data-act="link-invite"]'); await H.waitForTimeout(300);
  if (await H.$('#invHost')) await H.fill('#invHost', '아빠'); await H.fill('#invName', who);
  await H.click('#pop [data-act="inv-make"]'); await H.waitForSelector('.codebig', { timeout: 15000 });
  const c = (await H.$eval('.codebig', e => e.textContent)).replace('-', ''); await H.click('#pop [data-act="pop-close"]'); await H.waitForTimeout(800); return c; };
const codeMom = await mkCode('엄마'), codeKid = await mkCode('딸');
const hostUid = await H.evaluate(() => window.__fbx.uid);
await toRoot(H);
const joinIt = async (code, name, anchor) => { const P = await phone(name, base(anchor, 2));
  await P.click('#nav [data-tab="set"]'); await P.click('[data-act="link-open"]'); await P.waitForTimeout(800);
  await P.click('#page [data-act="link-join"]'); await P.fill('#joinCode', code); await P.click('#pop [data-act="join-check"]'); await P.waitForSelector('#joinName', { timeout: 15000 });
  await P.fill('#joinName', name); await P.click('#pop [data-act="join-go"]');
  await wait(P, async () => (await S(P)).link, 20000); const uid = await P.evaluate(() => window.__fbx.uid); await toRoot(P); await P.waitForTimeout(300); return [P, uid]; };
const [A, momUid] = await joinIt(codeMom, '엄마', '2026-10-06');
const [K, kidUid] = await joinIt(codeKid, '딸', '2026-10-04');
check('아빠 · 엄마 · 딸 연결 · 근무표가 서로 도착', await wait(A, async () => !!(await S(A)).fam2.scheds[hostUid] && !!(await S(A)).fam2.scheds[kidUid], 25000));


const usr = async (uid) => { const r = await restRead(`users/${uid}`); return r.fields ? r.fields.hid.stringValue : null; };
check('엄마 폰: 가족방 번호 쪽지가 서버에 있음', await wait(A, async () => (await usr(momUid)) === hostUid, 15000), String(await usr(momUid)));
await A.click('#nav [data-tab="set"]'); await A.click('[data-act="link-open"]'); await A.waitForTimeout(800);
check('가족 연결 화면에 "구글 계정으로 가족방 지키기"', (await A.$eval('#page', e => e.innerText)).includes('구글 계정으로 가족방 지키기'));
await A.click('#page [data-act="g-link"]');
check('연결하면 "구글 계정에 연결됨" + mom@example.com', await wait(A, async () => (await A.$eval('#page', e => e.innerText)).includes('mom@example.com'), 15000));
check('uid 는 그대로', (await A.evaluate(() => window.__fbx.uid)) === momUid);
await toRoot(A);
// 새 폰(엄마 폰 교체): 같은 구글로 로그인 → 같은 uid · 가족방 복원
const N = await phone('엄마새폰', base('2026-10-06', 2));
await N.click('#nav [data-tab="set"]'); await N.click('[data-act="link-open"]'); await N.waitForTimeout(1200);
check('새 폰: 가족방이 없으면 "전에 쓰던 폰의 가족방 불러오기"', (await N.$eval('#page', e => e.innerText)).includes('전에 쓰던 폰의 가족방 불러오기'));
await N.click('#page [data-act="g-restore"]');
check('새 폰: 로그인하면 같은 가족방으로 복원', await wait(N, async () => { const s = await S(N); return s.link && s.link.hid === hostUid && s.link.name === '엄마'; }, 20000), JSON.stringify((await S(N)).link));
check('새 폰 uid 가 엄마 uid 와 같음', (await N.evaluate(() => window.__fbx.uid)) === momUid);
check('새 폰: 가족 근무표가 받아짐', await wait(N, async () => !!(await S(N)).fam2.scheds[hostUid], 20000));
// 구글에 가족방 없는 다른 계정이면 안내
const X = await phone('낯선폰', base('2026-10-06', 2));
await X.evaluate(() => { window.AndroidBridge.googleSignIn = (req) => setTimeout(() => window.__onGoogle({ req, idToken: JSON.stringify({ sub: 'g-nobody', email: 'x@example.com', email_verified: true }), email: 'x@example.com' }), 50); });
await X.click('#nav [data-tab="set"]'); await X.click('[data-act="link-open"]'); await X.waitForTimeout(1000);
await X.click('#page [data-act="g-restore"]'); await X.waitForTimeout(2500);
check('가족방 없는 구글 계정: 안내만 하고 연결 안 됨', !(await S(X)).link && (await X.$eval('#toast', e => e.innerText).catch(() => '')).includes('가족방이 없어요'));
console.log(`\n${okN} ok, ${ngN} fail`);
await b.close(); srv.close(); process.exit(ngN ? 1 : 0);

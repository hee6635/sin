// v0.80 가족방 끊김 처리 E2E: 서버에서 방장 칸이 사라져도 바로 연결을 지우지 않음(5분 뒤에야 끊김 + 안내 카드) · 방장 접속 표시(hostSeen) · 가족 폰의 "새 코드로 옮기기"
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
}).listen(8214, '127.0.0.1');
const SC = '/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/v63/e2e14/';
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
  await p.goto('http://127.0.0.1:8214/index.html'); await p.waitForTimeout(700);
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
const wipe = async (P) => { await P.evaluate(() => { document.querySelector('#sheet [data-act="close"]')?.click(); const pop = document.getElementById('pop'); pop.className = ''; pop.innerHTML = ''; }); await P.waitForTimeout(300); await P.click('#nav [data-tab="set"]'); await P.waitForTimeout(200); await P.click('[data-act="more-wipe"]'); };
const wiped = (P) => wait(P, async () => (await P.$eval('#onboard', e => e.classList.contains('open'))) && !(await S(P)).link, 40000);


const PATCH = async (path_, fields) => (await fetch(DB + path_ + '?updateMask.fieldPaths=' + Object.keys(fields).join('&updateMask.fieldPaths='), { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'content-type': 'application/json' }, body: JSON.stringify({ fields }) })).json();
const DEL = async (path_) => (await fetch(DB + path_, { method: 'DELETE', headers: { Authorization: 'Bearer owner' } })).status;

// ───── 준비: 아빠(호스트) · 엄마(가족)
const H = await phone('host', base('2026-10-02', 1));
await openLink(H);
const codeMom = await mkCode(H, '엄마');
const hostUid = await H.evaluate(() => window.__fbx.uid);
await H.evaluate(() => window.__onBack && window.__onBack());
const A = await phone('mom', base('2026-10-06', 2));
const momUid = await join(A, codeMom, '엄마', 'own');
check('준비: 가족방에 아빠 · 엄마', await wait(H, async () => (await S(H)).fam2.members.length === 2, 20000));

// 1) 방장 접속 표시
check('방장 앱이 hostSeen(접속 표시)을 서버에 남김', await wait(H, async () => !!(await restRead(`households/${hostUid}`)).fields?.hostSeen, 20000), JSON.stringify(await restRead(`households/${hostUid}`)).slice(0, 200));
await A.click('#nav [data-tab="set"]'); await A.click('[data-act="link-open"]'); await A.waitForTimeout(1500);
const t1 = await A.evaluate(() => document.querySelector('#page').textContent.replace(/\s+/g, ' '));
check('가족(엄마) 폰: "방장 마지막 접속: 오늘"', t1.includes('방장 마지막 접속: 오늘'), t1.slice(0, 300));
await PATCH(`households/${hostUid}`, { hostSeen: { timestampValue: new Date(Date.now() - 6.5 * 864e5).toISOString() } });
await A.evaluate(() => window.__onBack && window.__onBack()); await A.click('[data-act="link-open"]'); await A.waitForTimeout(1500);
const t2 = await A.evaluate(() => document.querySelector('#page').textContent.replace(/\s+/g, ' '));
check('방장 접속이 6일 전이면 가족 폰에 경고(6일째 접속하지 않았어요)', t2.includes('6일째') && t2.includes('접속하지 않았어요'), t2.slice(0, 400));
check('가족 폰에 "새 초대 코드로 옮기기" 줄이 있음', t2.includes('새 초대 코드로 옮기기'));

// 2) 방장 칸이 서버에서 사라짐 → 처음에는 연결을 지우지 않음
await DEL(`households/${hostUid}/members/${hostUid}`);
await H.reload(); await H.waitForTimeout(2500);
const h1 = await S(H);
check('★ 서버에서 방장 칸이 없어도 첫 확인에서는 연결이 그대로(바로 지우지 않음)', !!h1.link && h1.linkMissAt > 0 && !h1.linkLost, JSON.stringify({ link: !!h1.link, miss: h1.linkMissAt, lost: h1.linkLost }));
// 5분 넘게 계속 못 찾음 → 끊김으로 처리 + 안내 남김
await H.evaluate(() => { const s = JSON.parse(localStorage.getItem('eonjeswieo:v1')); s.linkMissAt = Date.now() - 10 * 60e3; localStorage.setItem('eonjeswieo:v1', JSON.stringify(s)); });
await H.reload(); await H.waitForTimeout(2500);
const h2 = await S(H);
check('★ 5분 넘게 못 찾으면 끊김으로 처리하고 "무엇이 끊겼는지"를 남김', !h2.link && !!h2.linkLost && h2.linkLost.role === 'host' && h2.linkLost.hid === hostUid, JSON.stringify({ link: h2.link, lost: h2.linkLost }));
await openLink(H);
const lt = await H.evaluate(() => document.querySelector('#page').textContent.replace(/\s+/g, ' '));
check('방장 폰 가족 연결 화면에 "가족방 연결이 끊어졌어요" 안내 + 새 가족방 버튼', lt.includes('가족방 연결이 끊어졌어요') && !!(await H.$('#page .lost-card [data-act="link-invite"]')), lt.slice(0, 300));
await H.click('#page [data-act="lost-dismiss"]'); await H.waitForTimeout(300);
check('안내 닫기를 누르면 사라짐', !(await H.$('#page .lost-card')) && !(await S(H)).linkLost);

// 3) 가족(엄마)이 새 코드로 옮기기: 확인 → 방에서 나가고 코드 입력창이 열림
await A.evaluate(() => window.__onBack && window.__onBack()); await A.click('[data-act="link-open"]'); await A.waitForTimeout(1200);
await A.click('#page [data-act="link-move"]'); await A.waitForTimeout(2500);
check('엄마: 옮기기 확인창이 뜸(방에서 나가고 새 코드로)', A.dlg.some(m => m.includes('새 초대 코드')), JSON.stringify(A.dlg));
check('엄마: 옛 방에서 나가졌고 코드 입력창이 열림', !(await S(A)).link && !!(await A.$('#joinCode')), '');
check('에러 없음', errs.length === 0, errs.slice(0, 2).join(' // '));
log(`\n${okN}개 통과, ${ngN}개 실패`);
await b.close(); process.exit(ngN ? 1 : 0);

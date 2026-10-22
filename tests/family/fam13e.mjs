// v0.63 내 데이터 모두 지우기 E2E (2): 서버에 못 닿을 때 알림 · 쓰기가 멈췄을 때 대기열 정리 · 구글 연결 계정(다시 로그인) · 서버를 안 쓴 사람
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
const SC = '/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/v63/e2e13/';
fs.mkdirSync(SC, { recursive: true });
const log = (...a) => console.log(...a);
const EMU = { apiKey: 'fake-key', authDomain: 'demo-eonjeswieo.firebaseapp.com', projectId: 'demo-eonjeswieo', appId: '1:1:web:1', emulator: { auth: 'http://127.0.0.1:9099', firestore: ['127.0.0.1', 8080] } };
const b = await chromium.launch(); const errs = [];
let okN = 0, ngN = 0;
const check = (name, cond, extra = '') => { if (cond) { okN++; log('  ✓', name); } else { ngN++; log('  ✕', name, extra, errs.length ? '| ERR: ' + errs.slice(-2).join(' // ').slice(0, 500) : ''); } };
const T = Date.now();   // 서버 시각과 맞춤(초대 코드 만료 규칙)
const FAKE_G = JSON.stringify({ sub: 'g-test-1', email: 'g1@example.com', email_verified: true });
async function phone(name, state, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route('**/firebase/config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.FIREBASE_CONFIG=' + JSON.stringify(EMU) }));
  const p = await ctx.newPage(); p.ctx = ctx; p.dlg = []; p.ans = [];
  p.on('pageerror', e => errs.push(name + ': ' + e.stack));
  p.on('dialog', d => { p.dlg.push(d.message()); const a = p.ans.length ? p.ans.shift() : true; return a ? d.accept() : d.dismiss(); });
  await p.exposeFunction('goOffline', async (v) => { await ctx.setOffline(!!v); });
  await p.addInitScript(([st, T, nm, g, fake]) => { const D = Date; globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [T])); } static now() { return T; } };
    if (st && !localStorage.getItem('eonjeswieo:v1')) localStorage.setItem('eonjeswieo:v1', JSON.stringify(st));
    window.AndroidBridge = { status: () => '', setAlarms() {}, setReminders() {}, shareText: (t, m) => { window.__shared = m; }, fcmToken: () => 'tok-' + nm + '-' + 'x'.repeat(30), notifEnabled: () => true };
    if (g) { window.AndroidBridge.googleAvailable = () => true;
      window.AndroidBridge.googleSignIn = req => { window.__greq = (window.__greq || []).concat(req); setTimeout(() => window.__onGoogle(window.__gmode === 'cancel' && req === 'reauth' ? { req, error: 'cancel' } : { req, idToken: fake, email: 'g1@example.com' }), 60); }; } }, [state, T, name, !!opts.google, JSON.stringify({ sub: opts.gsub || 'g-test-1', email: (opts.gsub || 'g-test-1') + '@example.com', email_verified: true })]);
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
const acctList = async () => ((await (await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-eonjeswieo/accounts:batchGet?maxResults=500', { headers: { Authorization: 'Bearer owner' } })).json()).users || []);
const accts = async () => (await acctList()).map(u => u.localId);
const openLink = async (P) => { await P.click('#nav [data-tab="set"]'); await P.click('[data-act="link-open"]'); await P.waitForTimeout(1200); };
const mkCode = async (H, who) => { await H.click('#page [data-act="link-invite"]'); await H.waitForTimeout(300);
  if (await H.$('#invHost')) await H.fill('#invHost', '아빠'); await H.fill('#invName', who);
  await H.click('#pop [data-act="inv-make"]'); await H.waitForSelector('.codebig', { timeout: 15000 });
  const c = (await H.$eval('.codebig', e => e.textContent)).replace('-', ''); await H.click('#pop [data-act="pop-close"]'); await H.waitForTimeout(800); return c; };
const join = async (P, code, name, mode) => { await openLink(P); await P.click('#page [data-act="link-join"]'); await P.fill('#joinCode', code); await P.click('#pop [data-act="join-check"]'); await P.waitForSelector('#joinName', { timeout: 15000 });
  if (mode === 'view') await P.click('.jopt[data-v="view"]'); await P.fill('#joinName', name); await P.click('#pop [data-act="join-go"]');
  await wait(P, async () => (await S(P)).link, 20000); await P.evaluate(() => window.__onBack && window.__onBack()); return P.evaluate(() => window.__fbx.uid); };
const clearUi = P => P.evaluate(() => { document.querySelector('#sheet [data-act="close"]')?.click(); document.querySelector('#page [data-act="page-close"]')?.click(); const pop = document.getElementById('pop'); pop.className = ''; pop.innerHTML = ''; });
const wipe = async (P) => { await clearUi(P); await P.waitForTimeout(300); await P.click('#nav [data-tab="set"]'); await P.waitForTimeout(200); await P.click('[data-act="more-wipe"]'); };
const wiped = (P) => wait(P, async () => (await P.$eval('#onboard', e => e.classList.contains('open'))) && !(await S(P)).link, 40000);
const noBox = P => P.evaluate(() => !document.getElementById('wipeBox'));

// ───── 준비: 아빠(호스트) + 딸(가족) 두 가족방 세트
const H = await phone('host', base('2026-10-02', 1));
await openLink(H);
const code1 = await mkCode(H, '딸'), code2 = await mkCode(H, '아들');
const hostUid = await H.evaluate(() => window.__fbx.uid);
await H.evaluate(() => window.__onBack && window.__onBack());
const K = await phone('kid', base('2026-10-06', 2));
const kidUid = await join(K, code1, '딸', 'own');
const Q = await phone('son', base('2026-10-06', 2));
const sonUid = await join(Q, code2, '아들', 'own');
check('준비: 가족방에 아빠 · 딸 · 아들', await wait(H, async () => (await S(H)).fam2.members.length === 3, 20000));

// ───── 1) 서버에 닿지 않을 때: 알리고 → 취소하면 아무것도 안 바뀜
await K.evaluate(() => { window.FB.fs.__orig = window.FB.fs.getDocFromServer; window.FB.fs.getDocFromServer = () => Promise.reject(Object.assign(new Error('offline'), { code: 'unavailable' })); });
K.ans.push(true, true, false);   // 확인 · 확인 · (실패 알림에서) 취소
await wipe(K);
check('서버에 못 닿으면 실패 알림이 뜸 (3번째 확인창)', await wait(K, async () => K.dlg.length >= 3, 30000) && K.dlg[2].includes('지우지 못했어요') && K.dlg[2].includes('이 폰의 것만'), JSON.stringify(K.dlg));
await K.waitForTimeout(800);
check('취소하면 지우지 않고 돌아옴 (가족 연결 그대로 · 처음 화면 안 뜸 · 가림막 없음)', !!(await S(K)).link && !(await K.$eval('#onboard', e => e.classList.contains('open'))) && await noBox(K), JSON.stringify((await S(K)).link));
check('서버: 딸 자리 · 계정 그대로', await exists(`households/${hostUid}/members/${kidUid}`) && (await accts()).includes(kidUid));
await K.evaluate(() => { window.FB.fs.getDocFromServer = window.FB.fs.__orig; });
check('취소 뒤에도 가족 기능이 다시 연결됨 (연결 상태 ok · 동기화)', await wait(K, async () => (await K.evaluate(() => window.__fbx.st)) === 'ok' && !!(await S(K)).fam2.syncAt, 30000));
// 실패 알림에서 취소한 뒤에도 가족 목록 구독이 되살아났는지: 아빠가 가족 메모를 보내면 딸 폰에 도착
await H.click('#nav [data-tab="cal"]'); await H.waitForTimeout(300);
await H.click('.track .panel:nth-child(2) .cell[data-k="2026-10-17"] .bwrap'); await H.waitForTimeout(400);
await H.click('#sheet [data-act="memo-detail"]'); await H.waitForTimeout(300);
await H.fill('#mdText', '취소 뒤 도착 시험'); await H.click('#page [data-act="md-share"][data-v="1"]'); await H.click('#page [data-act="md-save"]'); await H.waitForTimeout(500);
await H.click('#pop [data-act="cfm-ok"]');
check('취소 뒤에도 구독이 살아 있음: 아빠의 가족 메모가 딸 폰에 도착', await wait(K, async () => Object.keys((await S(K)).fam2.memos).length === 1, 30000));

// ── 이번엔 "그래도 이 폰만 지우기"
await K.evaluate(() => { window.FB.fs.getDocFromServer = () => Promise.reject(Object.assign(new Error('offline'), { code: 'unavailable' })); });
K.dlg.length = 0; K.ans.push(true, true, true);
await wipe(K);
check('"그래도 이 폰만 지우기"를 고르면 폰은 지워지고 처음 화면', await wiped(K), JSON.stringify(K.dlg));
check('확인창 3번 (확인 · 확인 · 실패 알림)', K.dlg.length === 3, JSON.stringify(K.dlg));
check('서버에는 딸 자리 · 계정이 그대로 남음 (알린 대로)', await exists(`households/${hostUid}/members/${kidUid}`) && (await accts()).includes(kidUid));
await K.screenshot({ path: SC + 'k_after_local_wipe.png' });

// ───── 2) 쓰기가 도중에 멈출 때(인터넷이 중간에 끊김): 대기열에 쌓인 쓰기가 나중에 몰래 실행되면 안 됨
await Q.evaluate(() => { const F = window.FB.fs, o = F.getDocFromServer; F.getDocFromServer = async (...a) => { const r = await o(...a); await window.goOffline(true); return r; }; });
Q.ans.push(true, true, false);
const t0 = Date.now();
await wipe(Q);
check('쓰기가 멈추면 시간 안에 포기하고 실패 알림 (3번째 확인창)', await wait(Q, async () => Q.dlg.length >= 3, 90000) && Q.dlg[2].includes('지우지 못했어요'), JSON.stringify(Q.dlg) + ' ' + (Date.now() - t0) + 'ms');
log('   (걸린 시간 ' + Math.round((Date.now() - t0) / 1000) + '초: ' + Q.dlg[2]?.split('\n')[1] + ')');
await Q.waitForTimeout(500);
check('취소하면 가족 연결 그대로 · 가림막 없음', !!(await S(Q)).link && await noBox(Q));
await Q.evaluate(() => window.goOffline(false));
await Q.waitForTimeout(9000);
check('★ 인터넷이 돌아와도 멈췄던 쓰기가 몰래 실행되지 않음 (아들 자리 · 계정 그대로)', await exists(`households/${hostUid}/members/${sonUid}`) && (await accts()).includes(sonUid) && (await restRead(`households/${hostUid}`)).fields?.guestCount?.integerValue === '2', JSON.stringify((await restRead(`households/${hostUid}`)).fields));
check('다시 연결되어 가족 기능이 계속 됨', await wait(Q, async () => (await Q.evaluate(() => window.__fbx.st)) === 'ok', 30000));

// ───── 3) 구글 계정을 이어 둔 사람: 오래된 로그인이면 한 번 더 로그인해야 계정이 지워짐
const G = await phone('gh', base('2026-10-02', 1), { google: true });
await openLink(G);
await mkCode(G, '친구');
const gUid = await G.evaluate(() => window.__fbx.uid);
await G.click('#page [data-act="g-link"]');
check('구글 계정 연결됨 (이어 붙이기)', await wait(G, async () => !!(await S(G)).gAcct, 20000));
check('서버 계정에 구글이 이어져 있음', (await acctList()).find(u => u.localId === gUid)?.providerUserInfo?.some(p => p.providerId === 'google.com'));
await wipe(G);
check('구글 다시 로그인 안내 확인창 (3번째)', await wait(G, async () => G.dlg.length >= 3, 30000) && G.dlg[2].includes('구글 로그인을 한 번 더'), JSON.stringify(G.dlg));
check('다시 로그인 뒤 지우기가 끝나고 처음 화면', await wiped(G), JSON.stringify(G.dlg));
check('★ 서버: 구글을 이은 계정도 지워짐', !(await accts()).includes(gUid) && !(await exists(`households/${gUid}`)), JSON.stringify(await accts()));
check('네이티브에 다시 로그인을 요청함(reauth)', (await G.evaluate(() => window.__greq)).includes('reauth'));

// 다시 로그인을 취소하면: 실패 알림 → 취소 → 그대로
const G2 = await phone('gh2', base('2026-10-02', 1), { google: true, gsub: 'g-test-2' });
await openLink(G2); await mkCode(G2, '친구2');
const g2Uid = await G2.evaluate(() => window.__fbx.uid);
await G2.click('#page [data-act="g-link"]');
await wait(G2, async () => !!(await S(G2)).gAcct, 20000);
await G2.evaluate(() => { window.__gmode = 'cancel'; });
G2.ans.push(true, true, true, false);   // 확인 · 확인 · 구글 로그인 안내 확인 · (실패 알림) 취소
await wipe(G2);
check('구글 로그인을 취소하면 실패 알림이 뜨고', await wait(G2, async () => G2.dlg.length >= 4, 40000) && G2.dlg[3].includes('구글 로그인을 하지 않았어요'), JSON.stringify(G2.dlg));
await G2.waitForTimeout(500);
check('★ 서버를 건드리기 전에 막혀서 그대로 (가족 연결 · 서버 계정 · 가족방 · 구성원 자리)', !!(await S(G2)).link && (await accts()).includes(g2Uid) && await exists(`households/${g2Uid}`) && await exists(`households/${g2Uid}/members/${g2Uid}`));

// 서버가 계정 삭제를 거부(최근 로그인 필요)할 때: 익명 계정은 로그아웃만 하고 끝 · 구글 계정은 알림
const AN = await phone('anon', base('2026-10-02', 1));
await openLink(AN); await mkCode(AN, '친구3');
const anUid = await AN.evaluate(() => window.__fbx.uid);
await AN.evaluate(() => { window.FB.auth.deleteUser = () => Promise.reject(Object.assign(new Error('recent'), { code: 'auth/requires-recent-login' })); });
await wipe(AN);
check('익명 계정을 서버가 못 지우게 해도(최근 로그인 필요) 지우기는 끝남', await wiped(AN) && AN.dlg.length === 2, JSON.stringify(AN.dlg));
check('그 계정은 이 폰에서 로그아웃됨 · 가족방 자료는 이미 지워짐', await AN.evaluate(() => window.__fbx.auth.currentUser === null) && !(await exists(`households/${anUid}`)));
const GR = await phone('gr', base('2026-10-02', 1), { google: true, gsub: 'g-test-3' });
await openLink(GR); await mkCode(GR, '친구4');
await GR.click('#page [data-act="g-link"]'); await wait(GR, async () => !!(await S(GR)).gAcct, 20000);
await GR.evaluate(() => { window.FB.auth.deleteUser = () => Promise.reject(Object.assign(new Error('recent'), { code: 'auth/requires-recent-login' })); });
GR.ans.push(true, true, true, false);
await wipe(GR);
check('구글 계정이 다시 로그인했는데도 서버가 거부하면 "계정 확인이 더 필요해요" 알림', await wait(GR, async () => GR.dlg.length >= 4, 40000) && GR.dlg[3].includes('계정 확인이 더 필요해요') && GR.dlg[3].includes('일부는 이미 지워졌을 수 있어요'), JSON.stringify(GR.dlg));
await GR.waitForTimeout(500);
check('취소하면 가림막이 사라지고 앱이 계속 동작', await noBox(GR));

// ───── 4) 서버를 한 번도 안 쓴 사람: 그냥 지워지고, 서버에 새 계정이 생기지 않음
const before = (await accts()).length;
const L = await phone('local', base('2026-10-02', 1, { memos: { '2026-10-14': [{ id: 'm1', text: '개인 메모' }] } }));
await wipe(L);
check('서버를 안 쓴 사람: 확인창 2번으로 끝나고 처음 화면', await wiped(L) && L.dlg.length === 2, JSON.stringify(L.dlg));
check('서버에 새 계정이 생기지 않음', (await accts()).length === before, before + ' → ' + (await accts()).length);
check('개인 메모가 지워짐', Object.keys((await S(L)).memos || {}).length === 0);

check('화면 오류 없음', errs.length === 0, errs.join(' // ').slice(0, 600));
log(`\n결과: 통과 ${okN} · 실패 ${ngN}`);
await b.close();
process.exit(ngN ? 1 : 0);

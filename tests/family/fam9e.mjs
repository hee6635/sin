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
  fs.createReadStream(f).pipe(res);
}).listen(8160, '127.0.0.1');
const SC = '/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/v21/e2e6/';
fs.mkdirSync(SC, { recursive: true });
const log = (...a) => console.log(...a);
const EMU = { apiKey: 'fake-key', authDomain: 'demo-eonjeswieo.firebaseapp.com', projectId: 'demo-eonjeswieo', appId: '1:1:web:1', emulator: { auth: 'http://127.0.0.1:9099', firestore: ['127.0.0.1', 8080] } };
const b = await chromium.launch(); const errs = [];
let okN = 0, ngN = 0;
const check = (name, cond, extra = '') => { if (cond) { okN++; log('  ✓', name); } else { ngN++; log('  ✕', name, extra, errs.length ? '| ERR: ' + errs.slice(-2).join(' // ').slice(0, 600) : ''); } };
const T = +new Date('2026-10-12T10:00:00');
async function phone(name, state) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route('**/firebase/config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.FIREBASE_CONFIG=' + JSON.stringify(EMU) }));
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(name + ': ' + e.stack)); p.on('dialog', d => d.accept());
  await p.addInitScript(([st, T]) => { const D = Date; globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [T])); } static now() { return T; } };
    if (st && !localStorage.getItem('eonjeswieo:v1')) localStorage.setItem('eonjeswieo:v1', JSON.stringify(st));
    window.AndroidBridge = { status: () => '', setAlarms() {}, setReminders() {}, shareText: (t, m) => { window.__shared = m; } }; }, [state, T]);
  await p.goto('http://127.0.0.1:8160/index.html'); await p.waitForTimeout(700);
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

// ───── 엄마가 아빠 달력에서 여러 날 요청 (+ 가족 모두에게 알리기)
await A.click('#nav [data-tab="fam"]'); await A.waitForTimeout(500);
const chipsTxt = await A.$$eval('.vchip', a => a.map(x => x.textContent));
const hostChip = (await A.$$('.vchip'))[chipsTxt.findIndex(t => t.includes('아빠'))];
await hostChip.click(); await A.waitForSelector('#page #vcsl', { timeout: 8000 }); await A.waitForTimeout(400);
await A.click('#vcsl .cell[data-k="2026-10-14"]'); await A.waitForSelector('#sheet [data-act="vc-multi-from"]', { timeout: 8000 });
await A.click('#sheet [data-act="vc-multi-from"]'); await A.waitForTimeout(500);
const okDates = await A.$$eval('#vcsl .cell[data-k]', a => a.filter(c => !c.classList.contains('vdis') && !c.classList.contains('out')).map(c => c.dataset.k));
log('   고를 수 있는 날:', okDates.join(','));
const pick = okDates.filter(k => k > '2026-10-12' && k !== '2026-10-14').slice(0, 2);
const box = async k => A.$eval(`#vcsl .cell[data-k="${k}"]`, e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
for (const k of pick) { const q = await box(k); await A.mouse.move(q.x, q.y); await A.mouse.down(); await A.mouse.up(); await A.waitForTimeout(80); }
check('엄마: 날짜 3일을 골랐음 (눌렀던 날 + 2일)', (await A.$$('#vcsl .cell.vsel')).length === 3, JSON.stringify(pick));
check('엄마: 날짜 3일을 골랐음 (눌렀던 날 + 2일)', (await A.$$('#vcsl .cell.vsel')).length === 3, JSON.stringify(pick));
// ───── 달을 넘겨서 더 고르기 (이번 달 3일 + 다음 달 2일)
await A.click('#page [data-act="vc-next"]'); await A.waitForTimeout(500);
const stillSel = await A.$eval('#vsN', e => e.textContent);
check('다음 달로 넘겨도 고른 날이 남아 있음 (막대에 "3일 선택")', stillSel.includes('3일'), stillSel);
const novOk = await A.$$eval('#vcsl .cell[data-k]', a => a.filter(c => !c.classList.contains('vdis') && !c.classList.contains('out')).map(c => c.dataset.k));
log('   다음 달 고를 수 있는 날:', novOk.slice(0, 6).join(','));
const pickN = novOk.slice(0, 2);
for (const k of pickN) { const q = await box(k); await A.mouse.move(q.x, q.y); await A.mouse.down(); await A.mouse.up(); await A.waitForTimeout(80); }
const cnt = await A.$eval('#vsN', e => e.textContent);
check('다음 달 2일을 더 골라서 총 5일', cnt.includes('5일'), cnt);
// 이전 달로 돌아와도 처음 3일이 그대로
await A.click('#page [data-act="vc-prev"]'); await A.waitForTimeout(400);
check('이번 달로 돌아오면 처음 고른 3일이 그대로 표시됨', (await A.$$('#vcsl .cell.vsel')).length === 3);
await A.click('#page [data-act="vc-next"]'); await A.waitForTimeout(300);
check('다음 달에서도 고른 2일이 표시됨', (await A.$$('#vcsl .cell.vsel')).length === 2);
await A.fill('#vcmsg', '연휴'); await A.click('#vsGo'); await A.waitForTimeout(400);
const pt2 = await popText(A);
check('확인창에 5일 · 두 달 날짜가 모두 나옴', pt2.includes("5일") && pt2.includes("10/") && pt2.includes("11/"), pt2);
await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(800);
const docs = async () => ((await restRead(`households/${hostUid}/requests`)).documents || []).map(d => ({ date: d.fields.date.stringValue, grp: d.fields.grp && d.fields.grp.stringValue, gn: d.fields.gn && d.fields.gn.integerValue }));
check('서버에 요청 5개 · 한 묶음 · 두 달에 걸침', await wait(H, async () => { const d = await docs(); return d.length === 5 && new Set(d.map(x => x.grp)).size === 1 && d.some(x => x.date.startsWith('2026-10')) && d.some(x => x.date.startsWith('2026-11')); }, 20000), JSON.stringify(await docs()));
check('엄마 횟수는 묶음 1건', await wait(A, async () => (await S(A)).fam2.me.sent === 1, 15000), String((await S(A)).fam2.me.sent));
console.log(`\n${okN} ok, ${ngN} fail`);
await b.close(); srv.close(); process.exit(ngN ? 1 : 0);

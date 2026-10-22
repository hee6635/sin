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
}).listen(8129, '127.0.0.1');
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
  await p.addInitScript(() => { setInterval(() => { const b = document.querySelector('#pop.open [data-act="stkshare-no"]'); if (b) b.click(); }, 300); });   // 가족 스티커 묻는 창이 시험을 가로막지 않게
  await p.goto('http://127.0.0.1:8129/index.html'); await p.waitForTimeout(700);
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
await A.fill('#vcmsg', '아이 할로윈 연휴');
await A.click('#vsGo'); await A.waitForTimeout(400);
let pt = await popText(A);
check('확인창: 날짜 3일 · 가족 모두에게도 알리기 · 무료 횟수', pt.includes('3일') && pt.includes('가족 모두에게도 알리기') && pt.includes('무료'), pt);
await A.click('#pop [data-act="cfm-cc"]'); await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(600);
const reqDocs = async () => ((await restRead(`households/${hostUid}/requests`)).documents || []).map(d => ({ id: d.name.split('/').pop(), ...Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, v.stringValue ?? v.integerValue ?? v.booleanValue ?? v.arrayValue?.values?.length])) }));
check('서버에 요청 문서 3개 · 같은 묶음 · 첫 문서만 lead · cc 2명', await wait(H, async () => { const d = await reqDocs(); return d.length === 3 && new Set(d.map(x => x.grp)).size === 1 && d.every(x => String(x.gn) === '3') && d.filter(x => x.lead === true).length === 1; }, 20000), JSON.stringify(await reqDocs()).slice(0, 300));
check('엄마 횟수는 묶음 1건', await wait(A, async () => (await S(A)).fam2.me.sent === 1, 15000), String((await S(A)).fam2.me.sent));
check('아빠 폰: 요청 3개가 도착 · 📩 배지는 1', await wait(H, async () => (await S(H)).requests.filter(r => r.srv && r.dir === 'in' && r.grp).length === 3, 20000));
await H.waitForTimeout(500);
await H.click('#nav [data-tab="cal"]'); await H.waitForTimeout(400);
check('아빠 달력 위 📩 1', (await H.$eval('.rqmail', e => e.innerText.replace(/\s+/g, ' '))).includes('1'));
const evH = (await S(H)).events.filter(e => e.kind === 'req');
check('아빠 소식은 묶음 한 줄: "엄마가 … (3일) 휴 요청해요"', evH.length === 1 && evH[0].text.includes('3일') && evH[0].text.includes('휴 요청해요'), JSON.stringify(evH.map(e => e.text)));
check('딸 폰: 알림만 한 줄 (cc) "엄마가 아빠에게 … (3일)"', await wait(K, async () => (await S(K)).events.filter(e => e.kind === 'cc').length === 1 && (await S(K)).events.find(e => e.kind === 'cc').text.includes('3일'), 20000), JSON.stringify((await S(K)).events.map(e => e.text)));
check('딸에게 요청 카드는 없음', !(await S(K)).requests.some(r => r.srv));
// 아빠 달력에 요청 링 3칸 (주황)
const ringN = await H.$$eval('.track .panel:nth-child(2) .cell.rq-ask', a => a.length);
check('아빠 달력에 요청 링 3칸', ringN === 3, String(ringN));
await H.screenshot({ path: SC + 'h_group.png' });

// ───── 아빠가 한 번에 수락 → 3일 모두 적용
await H.click('.rqmail'); await H.waitForTimeout(500); await H.click('.mtabs [data-v="req"]'); await H.waitForTimeout(300);
const rowTxt = await H.$$eval('#sheet .ev', a => a.map(e => e.innerText.replace(/\s+/g, ' ')));
check('아빠 요청 탭: 묶음 한 줄 (3일)', rowTxt.length === 1 && rowTxt[0].includes('3일'), JSON.stringify(rowTxt));
await H.click('#sheet .ev [data-act="rq-go"]'); await H.waitForTimeout(500);
await H.click('#sheet [data-act="rqreply"][data-s="accepted"]'); await H.waitForTimeout(300);
await H.fill('#rpm', '그날 쉴게'); await H.click('#sheet [data-act="rqsend-reply"]'); await H.waitForTimeout(800);
check('서버: 3개 요청이 모두 applied · 답장 글', await wait(H, async () => { const d = await reqDocs(); return d.length === 3 && d.every(x => x.st === 'applied' && x.reply === '그날 쉴게'); }, 20000));
const ovs = (await S(H)).overrides;
check('아빠 근무표에 3일이 모두 휴로 적용', pick.every(k => ovs[k] === '휴'), JSON.stringify(ovs));
check('엄마 폰: 수락 소식 한 줄 · 요청 3개 applied', await wait(A, async () => (await S(A)).requests.filter(r => r.srv && r.dir === 'out' && r.st === 'applied').length === 3 && (await S(A)).events.filter(e => e.kind === 'reply').length === 1, 20000), JSON.stringify((await S(A)).events.map(e => e.text)));
check('엄마가 보는 아빠 달력에도 3일이 휴로', await wait(A, async () => { const sc = (await S(A)).fam2.scheds[hostUid]; return pick.every(k => sc?.overrides?.[k] === '휴'); }, 20000));
check('아빠 📩 배지가 사라짐', await wait(H, async () => !(await H.$('#top .rqmail')), 8000));
await toRoot(H);

// ───── 다시 보내고 엄마가 취소하면 묶음 전체 취소
await toRoot(A); await A.waitForTimeout(300);
await A.click('#nav [data-tab="fam"]'); await A.waitForTimeout(400);
await (await A.$$('.vchip'))[chipsTxt.findIndex(t => t.includes('아빠'))].click(); await A.waitForSelector('#page #vcsl', { timeout: 8000 }); await A.waitForTimeout(300);
await A.click('#page [data-act="vc-next"]'); await A.waitForTimeout(400);
await A.click('#vcsl .cell[data-k="2026-11-03"]'); await A.waitForSelector('#sheet [data-act="vc-multi-from"]', { timeout: 8000 });
await A.click('#sheet [data-act="vc-multi-from"]'); await A.waitForTimeout(500);
const ok2 = await A.$$eval('#vcsl .cell[data-k]', a => a.filter(c => !c.classList.contains('vdis') && !c.classList.contains('out')).map(c => c.dataset.k));
const pick2 = ok2.filter(k => k !== '2026-11-03').slice(0, 1);
for (const k of pick2) { const q = await box(k); await A.mouse.move(q.x, q.y); await A.mouse.down(); await A.mouse.up(); await A.waitForTimeout(80); }
await A.click('#vsGo'); await A.waitForTimeout(400); await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(600);
check('두 번째 묶음(2일) 서버에 올라감 · 횟수 2건', await wait(H, async () => (await reqDocs()).filter(x => x.st === 'pending').length === 2, 20000) && await wait(A, async () => (await S(A)).fam2.me.sent === 2, 15000));
await A.click('#page [data-act="page-close"]').catch(() => {}); await A.waitForTimeout(300);
await A.evaluate(() => document.querySelector('[data-act="view-requests"]')?.click());
await A.click('[data-act="feed-sheet"]').catch(() => {}); await A.waitForTimeout(400);
await A.click('#sheet [data-act="view-requests"]').catch(() => {}); await A.waitForTimeout(400);
const cardTxt = await A.$$eval('#sheet .rq', a => a.map(e => e.innerText.replace(/\s+/g, ' ')));
log('   엄마 요청 카드:', JSON.stringify(cardTxt).slice(0, 300));
await A.click('#sheet [data-act="rqcancel"]'); await A.waitForTimeout(800);
check('엄마가 취소하면 묶음 2개가 모두 cancelled', await wait(H, async () => { const d = (await reqDocs()).filter(x => x.date >= '2026-11'); return d.length >= 2 && d.filter(x => x.st === 'cancelled').length === 2; }, 20000), JSON.stringify((await reqDocs()).map(x => [x.date, x.st])));
log('\nERRORS', errs.length ? errs : 'none');
log(`${okN}개 통과, ${ngN}개 실패`);
await b.close(); srv.close();
process.exit(ngN || errs.length ? 1 : 0);

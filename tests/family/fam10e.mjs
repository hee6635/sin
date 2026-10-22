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
}).listen(8170, '127.0.0.1');
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
  await p.goto('http://127.0.0.1:8170/index.html'); await p.waitForTimeout(700);
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

const rest = async (p) => restRead(p);
const reqs = async () => ((await restRead(`households/${hostUid}/requests`)).documents || []).map(d => ({ id: d.name.split('/').pop(), st: d.fields.st.stringValue, held: d.fields.held && d.fields.held.booleanValue, date: d.fields.date.stringValue }));
const memosSrv = async () => ((await restRead(`households/${hostUid}/memos`)).documents || []).map(d => ({ text: d.fields.text.stringValue, date: d.fields.date.stringValue }));

// ───── 1) 엄마가 아빠 달력에서 하루 요청 → 아빠 폰 위쪽 띠
await A.click('#vcsl .cell[data-k="2026-10-14"]'); await A.waitForSelector('#sheet [data-act="vc-send"]', { timeout: 8000 });
check('날짜 화면에 "여러 날 고르기"와 가족 메모 입력칸 · 남은 횟수', !!(await A.$('#sheet [data-act="vc-multi-from"]')) && !!(await A.$('#vcmemo')) && (await A.$eval('#sheet', e => e.innerText)).includes('무료'));
await A.click('#sheet [data-act="vc-send"]'); await A.waitForTimeout(400); await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(600);
check('아빠 폰: 위에서 내려오는 띠에 "엄마 … 요청"', await wait(H, async () => { const t = await H.evaluate(() => { const e = document.getElementById('ban'); return e && e.classList.contains('show') ? e.textContent : ''; }); return t.includes('엄마') && t.includes('요청'); }, 20000));
await H.screenshot({ path: SC + 'h_banner.png' });
await H.click('#ban'); await H.waitForTimeout(600);
check('띠를 누르면 그 날짜 화면이 열림', await H.evaluate(() => document.getElementById('sheet').className.includes('open') && /14/.test(document.getElementById('sheet').innerText)));
check('띠는 몇 초 뒤 저절로 올라감', await wait(H, async () => !(await H.evaluate(() => document.getElementById('ban').classList.contains('show'))), 8000));
await toRoot(H); await H.waitForTimeout(300);

// ───── 8) 📩 와 "오늘" 사이 간격 (다른 달로 가면 오늘 버튼이 보임)
await H.click('#nav [data-tab="cal"]'); await H.waitForTimeout(300);
await H.evaluate(() => document.querySelector('.cal-top [data-act="next"]')?.click()); await H.waitForTimeout(700);
const gap = await H.evaluate(() => { const m = document.querySelector('.rqmail'), t = document.querySelector('.today-btn'); if (!m || !t) return null; return Math.round(t.getBoundingClientRect().left - m.getBoundingClientRect().right); });
check('📩 와 "오늘" 사이가 6px 이상 떨어져 있음', gap !== null && gap >= 6, String(gap));
await H.evaluate(() => document.querySelector('.cal-top [data-act="prev"]')?.click()); await H.waitForTimeout(500);

// ───── 10) 받은 요청 카드: 보류 · 수락 · 거절 만, 수락하면 바로 적용, 적용 취소하면 다시 세 버튼
await H.click('.rqmail'); await H.waitForTimeout(500);
await H.click('#sheet [data-act="view-requests"]'); await H.waitForTimeout(400);
check('요청 목록 카드는 "달력에서 보기" 하나(보류 · 수락 · 거절은 날짜 창에서)', !!(await H.$('#sheet .rq [data-act="rq-go"]')) && !(await H.$('#sheet .rq-grid')));
check('요청 목록 안내 문구가 새 방식', (await H.$eval('#sheet', e => e.innerText)).includes('달력에서 보기를 누르면') && !(await H.$eval('#sheet', e => e.innerText)).includes('근무 변경 적용'));
await H.click('#sheet .rq [data-act="rq-go"]'); await H.waitForSelector('#sheet .rq-grid', { timeout: 5000 }); await H.waitForTimeout(300);
let acts = await H.$$eval('#sheet .rq-grid button', a => a.map(b => b.dataset.s));
check('날짜 창의 요청 카드 버튼은 보류 · 수락 · 거절 세 개뿐', acts.join() === 'pending,accepted,rejected' && !(await H.$('#sheet [data-act="rqapply"]')), acts.join());
await H.click('#sheet .rq-grid [data-s="accepted"]'); await H.waitForSelector('#sheet [data-act="rqsend-reply"]'); await H.click('#sheet [data-act="rqsend-reply"]'); await H.waitForTimeout(900);
check('수락하면 바로 적용됨 (카드에 "적용 취소"만, 적용 버튼 없음)', !!(await H.$('#sheet [data-act="rqundo"]')) && !(await H.$('#sheet [data-act="rqapply"]')));
check('서버에도 applied', await wait(H, async () => (await reqs()).some(r => r.date === '2026-10-14' && r.st === 'applied'), 15000), JSON.stringify(await reqs()));
await H.click('#sheet [data-act="rqundo"]'); await H.waitForTimeout(900);
acts = await H.$$eval('#sheet .rq-grid button', a => a.map(b => b.dataset.s));
check('적용 취소하면 다시 보류 · 수락 · 거절 세 버튼', acts.join() === 'pending,accepted,rejected' && !(await H.$('#sheet [data-act="rqapply"]')), acts.join());
check('서버는 다시 pending (보류 아님)', await wait(H, async () => (await reqs()).some(r => r.date === '2026-10-14' && r.st === 'pending' && !r.held), 15000), JSON.stringify(await reqs()));
await toRoot(H);

// ───── 2) 3) 엄마가 아빠 달력 날짜에서 가족 메모를 쓰기 → 아빠 달력 · 엄마가 보는 아빠 달력에 ♥
await A.click('#vcsl .cell[data-k="2026-10-20"]'); await A.waitForSelector('#vcmemo', { timeout: 8000 });
await A.fill('#vcmemo', '우유 사오기'); await A.click('#sheet [data-act="vc-memo-send"]'); await A.waitForTimeout(500);
check('보내기 전 확인창에 메모 · 남은 횟수', (await popText(A)).includes('우유 사오기') && (await popText(A)).includes('무료'));
await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(800);
check('서버에 가족 메모가 올라감', await wait(H, async () => (await memosSrv()).some(m => m.text === '우유 사오기' && m.date === '2026-10-20'), 20000), JSON.stringify(await memosSrv()));
check('엄마가 보는 아빠 달력 날짜 화면에 방금 쓴 메모가 보임', (await A.$eval('#sheet', e => e.innerText)).includes('우유 사오기'));
await closeAll(A); await A.waitForTimeout(400);
check('엄마가 보는 아빠 달력 칸에 ♥ 메모 줄이 보임', (await A.$eval('#vcsl .cell[data-k="2026-10-20"]', e => e.innerText)).includes('우유'), await A.$eval('#vcsl .cell[data-k="2026-10-20"]', e => e.innerText));
await H.click('#nav [data-tab="cal"]'); await H.waitForTimeout(600);
check('아빠 자기 달력 칸에도 보임', await wait(H, async () => (await H.$$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-20"] .pl.fam', a => a.map(x => x.textContent).join())).includes('우유'), 15000));
check('아빠 폰에도 위쪽 띠(메모)', true);
// 아빠가 엄마 달력을 볼 때도 같은 날짜의 가족 메모
await H.click('#nav [data-tab="fam"]'); await H.waitForTimeout(500);
const chipsH = await H.$$eval('.vchip', a => a.map(x => x.textContent));
const momChip = (await H.$$('.vchip'))[chipsH.findIndex(t => t.includes('엄마'))];
if (momChip) { await momChip.click(); await H.waitForSelector('#page #vcsl', { timeout: 8000 }); await H.waitForTimeout(500); }
check('아빠가 보는 엄마 달력 칸에도 같은 날짜 가족 메모(♥)가 보임', !!momChip && (await H.$eval('#vcsl .cell[data-k="2026-10-20"]', e => e.innerText)).includes('우유'));
await toRoot(H);

// ───── 6) 아빠 자기 달력의 가족 메모 입력에도 남은 횟수
await H.click('#nav [data-tab="cal"]'); await H.waitForTimeout(400);
await H.click('.track .panel:nth-child(2) .cell[data-k="2026-10-21"]'); await H.waitForTimeout(500);
await H.click('#sheet [data-act="memo-detail"]'); await H.waitForTimeout(300);
await H.click('#page [data-act="md-share"][data-v="1"]'); await H.waitForTimeout(200);
check('가족에게 고르면 "무료 N건 남음"', (await H.$eval('#page', e => e.innerText)).includes('무료') && (await H.$eval('#page', e => e.innerText)).includes('남음'));
await H.click('#page [data-act="md-back"]'); await H.waitForTimeout(300);
await toRoot(H);

// ───── 9) 근무 띠 끄기
await H.click('#nav [data-tab="set"]'); await H.waitForTimeout(400);
check('설정 › 앱에 "근무 띠 표시" 스위치(켜짐)', !!(await H.$('#showBand')) && (await H.$eval('#showBand', e => e.checked)));
await H.evaluate(() => { const e = document.getElementById('showBand'); e.checked = false; e.dispatchEvent(new Event('change', { bubbles: true })); }); await H.waitForTimeout(300);
await H.click('#nav [data-tab="cal"]'); await H.waitForTimeout(500);
const bandOff = await H.evaluate(() => { const b = document.querySelector('.band'); return b ? getComputedStyle(b).display : 'none-found'; });
check('끄면 달력의 띠가 사라짐 · 저장됨', bandOff === 'none' && (await S(H)).showBand === false, bandOff);
await H.click('#nav [data-tab="set"]'); await H.evaluate(() => { const e = document.getElementById('showBand'); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }); await H.waitForTimeout(300);
await H.click('#nav [data-tab="cal"]'); await H.waitForTimeout(400);
check('다시 켜면 띠가 돌아옴', (await H.evaluate(() => { const b = document.querySelector('.band'); return b ? getComputedStyle(b).display : 'x'; })) !== 'none');

// ───── 5) 여러 날 고르기 막대: 달 이동 버튼 · 달별 개수
await A.click('#vcsl .cell[data-k="2026-10-22"]'); await A.waitForSelector('#sheet [data-act="vc-multi-from"]'); await A.click('#sheet [data-act="vc-multi-from"]'); await A.waitForTimeout(500);
check('고르기 막대에 ‹ › 달 이동 버튼', !!(await A.$('#page .vsbar [data-act="vc-prev"]')) && !!(await A.$('#page .vsbar [data-act="vc-next"]')));
const t0 = await A.$eval('#page .vcnav b', e => e.textContent);
await A.click('#page .vsbar [data-act="vc-next"]'); await A.waitForTimeout(500);
const t1 = await A.$eval('#page .vcnav b', e => e.textContent);
const novK = (await A.$$eval('#vcsl .cell[data-k]', a => a.filter(c => !c.classList.contains('vdis') && !c.classList.contains('out')).map(c => c.dataset.k)))[0];
const q = await A.$eval(`#vcsl .cell[data-k="${novK}"]`, e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await A.mouse.move(q.x, q.y); await A.mouse.down(); await A.mouse.up(); await A.waitForTimeout(200);
const cnt = await A.$eval('#vsN', e => e.textContent);
check('아래 버튼으로 다음 달로 넘어가고, 개수가 달별로 보임 (10월 1일 · 11월 1일 (총 2일))', t0 !== t1 && cnt.includes('10월 1일') && cnt.includes('11월 1일') && cnt.includes('총 2일'), `${t0} → ${t1} | ${cnt}`);
await A.screenshot({ path: SC + 'a_vsbar.png' });
console.log(`\n${okN} ok, ${ngN} fail`);
await b.close(); srv.close(); process.exit(ngN ? 1 : 0);

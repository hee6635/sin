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
}).listen(8128, '127.0.0.1');
const SC = '/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/v21/e2e5/';
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
  await p.goto('http://127.0.0.1:8128/index.html'); await p.waitForTimeout(700);
  return p;
}
const S = p => p.evaluate(() => JSON.parse(localStorage.getItem('eonjeswieo:v1')));
const wait = async (p, fn, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch (e) {} await p.waitForTimeout(250); } return false; };
const base = (anchor, team, extra = {}) => ({ addonNote: 'done', addons: { comp: false, cheer: false, together: false, colleague: false, stats: false, status: false }, onboarded: true, anchor, myTeam: team, patternName: '4조2교대', overrides: {}, ...extra });
const restRead = async (path_) => (await fetch(`http://127.0.0.1:8080/v1/projects/demo-eonjeswieo/databases/(default)/documents/${path_}`, { headers: { Authorization: 'Bearer owner' } })).json();
const closeAll = p => p.evaluate(() => { document.querySelector('#sheet [data-act="close"]')?.click(); const pop = document.getElementById('pop'); pop.className = ''; pop.innerHTML = ''; });
const toRoot = p => p.evaluate(() => { const pop = document.getElementById('pop'); pop.className = ''; pop.innerHTML = ''; document.querySelector('#sheet [data-act="close"]')?.click(); document.querySelector('#page [data-act="page-close"]')?.click(); });
const popText = p => p.evaluate(() => document.getElementById('pop').innerText.replace(/\s+/g, ' '));

// ───── 아빠(호스트): 엄마 · 딸 · 할머니 초대 코드
const H = await phone('host', base('2026-10-02', 1));
await H.click('#nav [data-tab="set"]'); await H.click('[data-act="link-open"]'); await H.waitForTimeout(1500);
const mkCode = async (who) => { await H.click('#page [data-act="link-invite"]'); await H.waitForTimeout(300);
  if (await H.$('#invHost')) await H.fill('#invHost', '아빠'); await H.fill('#invName', who);
  await H.click('#pop [data-act="inv-make"]'); await H.waitForSelector('.codebig', { timeout: 15000 });
  const c = (await H.$eval('.codebig', e => e.textContent)).replace('-', ''); await H.click('#pop [data-act="pop-close"]'); await H.waitForTimeout(800); return c; };
const codeMom = await mkCode('엄마'), codeKid = await mkCode('딸'), codeGma = await mkCode('할머니');
const hostUid = await H.evaluate(() => window.__fbx.uid);
await H.evaluate(() => window.__onBack && window.__onBack());

// ───── 엄마: 예전 사용자(설정 › 가족 연결로 참여)
const A = await phone('mom', base('2026-10-06', 2, { stamps: { defs: [{ id: 's_pill', kind: 'pill', name: '약', times: 3, rep: 'dates', dates: ['2026-10-14'], color: '#ef4d5a' }, { id: 's_yoga', kind: 'mark', emoji: '🧘', name: '요가', rep: 'none', dates: ['2026-10-14'] }, { id: 'o_ph', kind: 'mark', one: true, emoji: '@ph1', name: '사진', rep: 'none', dates: ['2026-10-14'] }], log: { '2026-10-14': { s_yoga: 1, s_pill: 1 } }, remind: false, v4: 1, pillTimes: ['08:00', '13:00', '20:00'] }, patOld: [{ until: '2026-10-10', anchor: '2026-10-06', pattern: ['교', '교'] }], icons: { ph1: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCACAAIADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDcooor4Y/SjhKKKK/dj+fzu6KKK/CT+gDhKKKK/dj+fzu6KKK/CT+gDhKKKK/dj+fzu6KKK/CT+gDhKKKK/dj+fwooooA7uiiivwk/oA4Siiiv3Y/n87uiiivwk/oA4Siiiv3Y/n87uiiivwk/oA4Siiiv3Y/n87uiiivwk/oAKKKKAOEooor92P5/O7ooor8JP6AOEooor92P5/O7ooor8JP6AOEooor92P5/O7ooor8JP6AOEooor92P5/CiiigDu6KKK/CT+gDhKKKK/dj+fzu6KKK/CT+gDhKKKK/dj+fzu6KKK/CT+gDhKKKK/dj+fzu6KKK/CT+gAooooA4Siiiv3Y/n87uiiivwk/oA4Siiiv3Y/n87uiiivwk/oA4Siiiv3Y/n87uiiivwk/oA4Siiiv3Y/n8KKKKAO7ooor8JP6AOEooor92P5/O7ooor8JP6AOEooor92P5/O7ooor8JP6AOEooor92P5/O7ooor8JP6ACiiigDhKKKK/dj+fzu6KKK/CT+gDhKKKK/dj+fzu6KKK/CT+gDhKKKK/dj+fzu6KKK/CT+gDhKKKK/dj+fwooooA7uiiivwk/oA4Siiiv3Y/n87uiiivwk/oA4Siiiv3Y/n87uiiivwk/oA4Siiiv3Y/n87uiiivwk/oA//2Q==' } }));
await A.click('#nav [data-tab="set"]'); await A.click('[data-act="link-open"]'); await A.waitForTimeout(800);
await A.click('#page [data-act="link-join"]'); await A.fill('#joinCode', codeMom); await A.click('#pop [data-act="join-check"]'); await A.waitForSelector('#joinName', { timeout: 15000 });
await A.fill('#joinName', '엄마'); await A.click('#pop [data-act="join-go"]');
check('엄마(예전 사용자) 참여 → 바로 가족 연결 화면(근무표 만들기 안 물음)', await wait(A, async () => (await S(A)).link, 20000) && !(await A.$eval('#onboard', e => e.classList.contains('open'))));
const momUid = await A.evaluate(() => window.__fbx.uid);
check('엄마 근무표가 서버에 올라감(예전 사용자는 myset=true)', await wait(H, async () => !!(await S(H)).fam2.scheds[momUid], 20000));
await A.evaluate(() => window.__onBack && window.__onBack());

// ───── 딸: 처음 설치 → 초대 코드 → 쌍방 참여 → 근무표 만들기로 이어감
const K = await phone('kid', null);
check('딸: 처음 화면', (await K.$eval('#onboard', e => e.innerText)).includes('초대 코드가 있어요'));
await K.click('#onboard [data-act="ob-invite"]'); await K.fill('#joinCode', codeKid); await K.click('#pop [data-act="join-check"]'); await K.waitForSelector('#joinName', { timeout: 15000 });
await K.fill('#joinName', '딸'); await K.click('#pop [data-act="join-go"]');
check('딸: 참여 후 "근무가 어떻게 돌아가나요?"로 이어짐', await wait(K, async () => (await K.$eval('#onboard', e => e.innerText)).includes('근무가 어떻게'), 20000));
const kidUid = await K.evaluate(() => window.__fbx.uid);
await K.waitForTimeout(4500);
const ks = await S(K);
check('딸: 아직 근무표를 안 만들어 myset=false', ks.link && ks.myset === false && ks.onboarded === true);
const kidDoc0 = await restRead(`households/${hostUid}/schedules/${kidUid}`);
check('★ 서버에 딸의 가짜 근무표가 안 올라감', !!kidDoc0.error || !kidDoc0.fields, JSON.stringify(kidDoc0).slice(0, 120));
check('아빠 폰에도 딸 근무표 없음', !(await S(H)).fam2.scheds[kidUid]);
await K.screenshot({ path: SC + 'k_way.png' });
await K.click('#onboard [data-act="ob-way"][data-v="custom"]'); await K.waitForTimeout(200);
await K.click('#onboard [data-act="ob-len"][data-v="4"][data-m="set"]'); await K.click('#onboard [data-act="ob-next"]'); await K.waitForTimeout(200);
await K.fill('#onboard [data-obn="w0"]', 'D'); await K.fill('#onboard [data-obn="w1"]', 'N'); await K.fill('#onboard [data-obn="r"]', '쉼'); await K.click('#onboard [data-act="ob-next"]'); await K.waitForTimeout(200);
await K.click('#onboard [data-act="ob-brush"][data-k="D"]'); await K.click('#onboard [data-act="ob-cell"][data-i="0"]');
await K.click('#onboard [data-act="ob-brush"][data-k="N"]'); await K.click('#onboard [data-act="ob-cell"][data-i="1"]');
await K.click('#onboard [data-act="ob-next"]'); await K.waitForTimeout(200);
await K.click('#onboard [data-act="ob-next"]'); await K.waitForTimeout(200);
await K.click('#onboard [data-act="ob-next"]'); await K.waitForTimeout(200);
await K.click('#onboard [data-act="ob-finish"][data-v="0"]'); await K.waitForTimeout(300);
check('딸: 끝 화면에 "가족 초대하기"는 안 보임(이미 가족방 안)', !(await K.$eval('#onboard', e => e.innerText)).includes('가족 초대하기'));
await K.click('#onboard [data-act="ob-done"]');
check('★ 딸이 근무표를 만들면 그때부터 서버에 올라감(D N 쉼 쉼)', await wait(H, async () => { const s = (await S(H)).fam2.scheds[kidUid]; return !!s && s.pattern.join('') === 'DN쉼쉼'; }, 20000), JSON.stringify((await S(H)).fam2.scheds[kidUid]?.pattern));

// ───── 할머니: 처음 설치 → 초대 코드 → 보기만(view)
const G = await phone('gma', null);
await G.click('#onboard [data-act="ob-invite"]'); await G.fill('#joinCode', codeGma); await G.click('#pop [data-act="join-check"]'); await G.waitForSelector('#joinName', { timeout: 15000 });
await G.click('.jopt[data-v="view"]'); await G.fill('#joinName', '할머니'); await G.click('#pop [data-act="join-go"]');
check('할머니(보기만): 근무표 만들기 없이 바로 가족 연결 화면', await wait(G, async () => (await S(G)).link, 20000) && !(await G.$eval('#onboard', e => e.classList.contains('open'))));
const gmaUid = await G.evaluate(() => window.__fbx.uid);
await G.waitForTimeout(3000);
const gDoc = await restRead(`households/${hostUid}/schedules/${gmaUid}`);
check('할머니 근무표는 서버에 안 올라감', !!gDoc.error || !gDoc.fields);
await G.screenshot({ path: SC + 'g_after.png' });
await closeAll(G);

// ───── 가족 메모: 확인창 → 보내기
await A.evaluate(() => window.__onBack && window.__onBack()); await A.click('#nav [data-tab="cal"]'); await A.waitForTimeout(300);
await A.click('.track .panel:nth-child(2) .cell[data-k="2026-10-17"] .bwrap'); await A.waitForTimeout(400);
await A.click('#sheet [data-act="memo-detail"]'); await A.waitForTimeout(300);
await A.fill('#mdText', '장모님 생신 저녁 7시'); await A.click('#page [data-act="md-share"][data-v="1"]'); await A.click('#page [data-act="md-save"]'); await A.waitForTimeout(500);
let pt = await popText(A);
check('엄마: 가족 메모 보내기 전에 확인창(누구에게 · 무료 횟수)', pt.includes('가족에게 보낼까요?') && pt.includes('아빠') && pt.includes('딸') && pt.includes('무료 10건 남음'), pt);
await A.screenshot({ path: SC + 'a_cfm_memo.png' });
await A.waitForTimeout(3500);
check('확인창에서 아직 [보내기] 안 눌렀으니 서버에 메모 없음', !(await restRead(`households/${hostUid}/memos`)).documents);
await A.click('#pop [data-act="cfm-no"]'); await A.waitForTimeout(300);
check('취소하면 메모는 안 올라가고 입력창에 글이 그대로', (await A.$eval('#mdText', e => e.value)).includes('장모님') && !(await S(A)).memos['2026-10-17']);
await A.click('#page [data-act="md-save"]'); await A.waitForTimeout(400); await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(500);
check('[보내기] 후 서버에 메모 1개 · 엄마 횟수 1건', await wait(A, async () => Object.keys((await S(A)).fam2.memos).length === 1 && (await S(A)).fam2.me.sent === 1, 20000));
check('아빠 · 딸 · 할머니 폰에 가족 메모 도착', await wait(H, async () => Object.keys((await S(H)).fam2.memos).length === 1, 20000) && await wait(K, async () => Object.keys((await S(K)).fam2.memos).length === 1, 20000) && await wait(G, async () => Object.keys((await S(G)).fam2.memos).length === 1, 20000));
const memoDoc = async () => (await restRead(`households/${hostUid}/memos`)).documents?.[0]?.fields || {};
// ───── 조용히 고치기
await A.click('.mcard.fam'); await A.waitForTimeout(300);
await A.fill('#memoInput', '장모님 생신 저녁 8시'); await A.click('#sheet [data-act="memo-send"]'); await A.waitForTimeout(400);
pt = await popText(A);
check('고치고 보내면 [조용히 / 알리기] 선택 확인창 · 횟수는 안 씀', pt.includes('조용히 고치기') && pt.includes('고쳤다고 알리기') && pt.includes('무료 횟수를 쓰지 않아요'), pt);
await A.screenshot({ path: SC + 'a_cfm_edit.png' });
await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(500);
check('조용히 고침: 서버 글이 8시로, rev 없음', await wait(H, async () => Object.values((await S(H)).fam2.memos).some(m => m.text.includes('8시')), 20000) && (await memoDoc()).rev === undefined);
check('조용히 고치면 아빠 소식에 "고쳤어요"가 없음', !(await S(H)).events.some(e => e.text.includes('고쳤어요')));
check('엄마 횟수는 그대로 1건', (await S(A)).fam2.me.sent === 1);
// ───── 고쳤다고 알리기
await A.click('.mcard.fam'); await A.waitForTimeout(300);
await A.fill('#memoInput', '장모님 생신 저녁 9시'); await A.click('#sheet [data-act="memo-send"]'); await A.waitForTimeout(400);
await A.click('#pop [data-act="cfm-nt"][data-v="1"]'); await A.waitForTimeout(200);
check('알리기 선택이 켜짐', (await A.$eval('#pop .jopt.on', e => e.textContent)).includes('고쳤다고 알리기'));
await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(500);
check('알리기: 서버 rev=1 · 글 9시', await wait(A, async () => { const f = await memoDoc(); return f.rev && f.rev.integerValue === '1' && f.text.stringValue.includes('9시'); }, 20000));
check('아빠 · 딸 · 할머니 소식에 "엄마님이 17/10 메모를 고쳤어요"', await wait(H, async () => (await S(H)).events.some(e => e.text.includes('엄마님이') && e.text.includes('고쳤어요')), 20000) && await wait(K, async () => (await S(K)).events.some(e => e.text.includes('고쳤어요')), 20000) && await wait(G, async () => (await S(G)).events.some(e => e.text.includes('고쳤어요')), 20000));
check('엄마 폰의 notify 표시는 지워짐', await wait(A, async () => !Object.values((await S(A)).memos).flat().some(m => m.notify), 10000));
check('엄마 자신의 소식에는 안 뜸', !(await S(A)).events.some(e => e.text.includes('고쳤어요')));
// ───── 나만 보는 메모 → 가족 메모로 (확인창 · 취소)
await A.fill('#memoInput', ''); await A.fill('#memoInput', '혼자 보는 메모'); await A.click('#sheet [data-act="memo-send"]'); await A.waitForTimeout(500);
check('나만 보는 메모는 확인창 없이 바로 저장', !(await A.$eval('#pop', e => e.classList.contains('open'))) && (await S(A)).memos['2026-10-17'].some(m => m.text === '혼자 보는 메모' && !m.shared));
await A.click('#sheet [data-act="memo-conv"]'); await A.waitForTimeout(400);
check('"♡ 가족에게" 누르면 확인창', (await popText(A)).includes('가족에게 보낼까요?'));
await A.click('#pop [data-act="cfm-no"]'); await A.waitForTimeout(500);
check('취소하면 그대로 나만 메모', (await S(A)).memos['2026-10-17'].some(m => m.text === '혼자 보는 메모' && !m.shared));
await closeAll(A);

// ───── 근무 요청: 아빠에게 보내기 + 가족 모두에게도 알리기
await A.click('#nav [data-tab="fam"]'); await A.waitForTimeout(400);
const chips = await A.$$eval('.vchip', a => a.map(x => x.textContent));
log('   가족 탭 달력 보기 칩:', chips);
await A.click('.vchip'); await A.waitForSelector('#page .cell[data-k="2026-10-31"]', { timeout: 8000 });
// 아빠 달력인지 확인 (이름 순서에 따라)
const pageHead = await A.$eval('#page', e => e.innerText.slice(0, 40).replace(/\s+/g, ' '));
await A.click('#page .cell[data-k="2026-10-31"]'); await A.waitForTimeout(400);
await A.fill('#rqm2', '아이 할로윈 파티라 같이 가자'); await A.click('#sheet [data-act="vc-send"]'); await A.waitForTimeout(500);
pt = await popText(A);
check('요청 보내기 전 확인창: 받는 사람 · 모두에게 알리기 선택(3명 이상) · 횟수', pt.includes('에게 보낼까요?') && pt.includes('가족 모두에게도 알리기') && pt.includes('무료 9건 남음'), pt);
await A.screenshot({ path: SC + 'a_cfm_req.png' });
await A.waitForTimeout(3000);
check('확인창 상태에서는 서버에 요청 없음', !(await restRead(`households/${hostUid}/requests`)).documents);
await A.click('#pop [data-act="cfm-cc"]'); await A.waitForTimeout(200);
check('"가족 모두에게도 알리기"가 켜짐', (await A.$eval('#pop .jopt.on', e => e.textContent)).includes('가족 모두에게도 알리기'));
await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(500);
const rq0 = async () => (await restRead(`households/${hostUid}/requests`)).documents?.[0]?.fields || {};
check('요청이 서버에 올라가고 cc 에 알림 받을 가족(딸 · 할머니)', await wait(H, async () => { const f = await rq0(); return f.to && f.cc && f.cc.arrayValue.values.length === 2; }, 20000), JSON.stringify(await rq0()).slice(0, 200));
const recvName = (await rq0()).toName?.stringValue;
const ccUids = ((await rq0()).cc?.arrayValue?.values || []).map(v => v.stringValue);
log('   받는 사람:', recvName, ' cc:', ccUids.length);
// 받는 사람이 아빠인지 확인(칩 첫 번째)
const toUid = (await rq0()).to?.stringValue;
const recvPhone = { [hostUid]: H, [kidUid]: K, [gmaUid]: G }[toUid];
const ccPhones = ccUids.map(u => ({ [hostUid]: H, [kidUid]: K, [gmaUid]: G })[u]).filter(Boolean);
check('받는 사람 폰에 근무 요청이 도착(답할 수 있음)', !!recvPhone && await wait(recvPhone, async () => (await S(recvPhone)).requests.some(r => r.srv && r.dir === 'in' && r.date === '2026-10-31' && r.st === 'pending'), 20000));
check('★ 알림만 받는 가족 폰에 "엄마가 … 요청했어요" 소식이 뜸', ccPhones.length === 2 && (await Promise.all(ccPhones.map(p => wait(p, async () => (await S(p)).events.some(e => e.kind === 'cc' && e.text.includes('엄마가') && e.text.includes('요청했어요')), 20000)))).every(Boolean));
check('알림만 받는 가족에겐 요청 카드(답하기)는 안 생김', ccPhones.every(async p => !(await S(p)).requests.some(r => r.srv)));
// 알림 받은 폰의 가족 탭 화면
if (ccPhones[0]) { await ccPhones[0].evaluate(() => { for (let i = 0; i < 3; i++) window.__onBack && window.__onBack(); }); await ccPhones[0].click('#nav [data-tab="fam"]'); await ccPhones[0].waitForTimeout(500); await ccPhones[0].click('[data-act="feed-sheet"]').catch(() => {}); await ccPhones[0].waitForTimeout(500); await ccPhones[0].screenshot({ path: SC + 'cc_feed.png' }); await closeAll(ccPhones[0]); }
check('엄마 횟수는 메모 1 + 요청 1 = 2건 (알림 여러 명이어도 1건)', await wait(A, async () => (await S(A)).fam2.me.sent === 2, 20000), String((await S(A)).fam2.me.sent));
// ───── cc 없이 보내기
await A.waitForTimeout(500);
await A.click('#page [data-act="vc-next"]'); await A.waitForTimeout(400);
await A.click('#page .cell[data-k="2026-11-03"]'); await A.waitForTimeout(400);
{ const n = (await A.$$('#sheet [data-act="vc-want"]')).length;
  for (let i = 0; i < n; i++) { await A.evaluate((i) => document.querySelectorAll('#sheet [data-act="vc-want"]')[i].click(), i);
    await A.click('#sheet [data-act="vc-send"]'); await A.waitForTimeout(500);
    if (await A.$eval('#pop', e => e.classList.contains('open'))) break; } }
check('두 번째 요청도 확인창이 뜸 (이번엔 알리기 안 켬)', (await popText(A)).includes('에게 보낼까요?'));
await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(500);
check('알리기 안 켜고 보낸 요청에는 cc 가 없음', await wait(H, async () => { const d = (await restRead(`households/${hostUid}/requests`)).documents || []; return d.length === 2 && d.some(x => !x.fields.cc); }, 20000));
check('엄마 횟수 3건', await wait(A, async () => (await S(A)).fam2.me.sent === 3, 20000));

// ───── 스티커 보여주기 (기본 꺼짐 · 켤 때 확인창)
await toRoot(A); await A.waitForTimeout(300);
await A.click('#nav [data-tab="set"]'); await A.click('[data-act="link-open"]'); await A.waitForTimeout(1500);
check('엄마: 스티커 보여주기 스위치가 꺼져 있음(기본)', !(await A.$eval('#famStk', e => e.checked)));
const momDoc0 = await restRead(`households/${hostUid}/schedules/${momUid}`);
check('서버 엄마 근무표에 스티커 정보 없음', !momDoc0.fields?.stk && !momDoc0.fields?.sdefs);
await A.click('label.sw:has(#famStk)'); await A.waitForTimeout(400);
check('켜려고 하면 확인창', (await popText(A)).includes('가족에게 보여줄까요?'), await popText(A));
await A.screenshot({ path: SC + 'a_cfm_stk.png' });
await A.click('#pop [data-act="cfm-no"]'); await A.waitForTimeout(1500);
check('취소하면 스위치가 다시 꺼짐', !(await A.$eval('#famStk', e => e.checked)) && !(await S(A)).link.stk);
await A.click('label.sw:has(#famStk)'); await A.waitForTimeout(300); await A.click('#pop [data-act="cfm-ok"]'); await A.waitForTimeout(500);
check('켠 뒤 서버 근무표에 스티커(sdefs 2종 · stk 날짜)가 올라감', await wait(H, async () => { const f = (await restRead(`households/${hostUid}/schedules/${momUid}`)).fields || {}; return f.sdefs && f.sdefs.arrayValue.values.length === 3 && f.stk && f.stk.mapValue.fields && !!f.stk.mapValue.fields['2026-10-14']; }, 20000), JSON.stringify(((await restRead(`households/${hostUid}/schedules/${momUid}`)).fields || {}).stk || '').slice(0, 200));
check('★ 시작 날 바꾸기 전 옛 구간: 달라지는 날이 "바꾼 날"로 올라감(10/09 교)', await wait(H, async () => { const f = (await restRead(`households/${hostUid}/schedules/${momUid}`)).fields || {}; const o = f.overrides?.mapValue?.fields || {}; return o['2026-10-09']?.stringValue === '교' && !o['2026-10-10']; }, 20000));
check('아빠 폰에 엄마 스티커 정보가 도착', await wait(H, async () => !!(await S(H)).fam2.scheds[momUid]?.stk, 20000));
check('아빠 폰에 엄마 사진 스티커(48px)가 도착', await wait(H, async () => JSON.stringify((await S(H)).fam2.scheds[momUid] || {}).includes('data:image/jpeg;base64,'), 25000));
await toRoot(H); await H.waitForTimeout(300);
await H.click('#nav [data-tab="fam"]'); await H.waitForTimeout(500);
const hchips = await H.$$eval('.vchip', a => a.map(x => x.textContent));
log('   아빠 가족 탭 칩:', hchips);
const momChip = (await H.$$('.vchip'))[hchips.findIndex(t => t.includes('엄마'))];
await momChip.click(); await H.waitForSelector('#page .cell[data-k="2026-10-14"]', { timeout: 8000 });
await H.waitForTimeout(300);
const stkIn = await H.$eval('#page .cell[data-k="2026-10-14"]', e => ({ stp: !!e.querySelector('.stp'), n: e.querySelectorAll('.stp>*').length + e.querySelectorAll('.s2>*').length, t: e.querySelector('.dn').innerText }));
check('★ 아빠가 보는 엄마 달력 14일에 스티커(약 · 요가 · 사진)가 보임', stkIn.n === 3, JSON.stringify(stkIn));
const imgIn = await H.$eval('#page .cell[data-k="2026-10-14"]', e => ({ img: e.querySelectorAll('img.ico[src^="data:image/jpeg"]').length, star: e.innerText.includes('⭐') }));
check('★ 사진 스티커는 사진(48px)으로 보임 (⭐ 아님)', imgIn.img === 1 && !imgIn.star, JSON.stringify(imgIn));
await H.screenshot({ path: SC + 'h_momcal_stk.png' });
await toRoot(H);
await A.click('label.sw:has(#famStk)'); await A.waitForTimeout(800);
check('끄면 확인창 없이 바로 꺼지고 서버에서 스티커 정보가 사라짐', await wait(H, async () => { const f = (await restRead(`households/${hostUid}/schedules/${momUid}`)).fields || {}; return !f.stk && !f.sdefs; }, 20000));
log('\nERRORS', errs.length ? errs : 'none');
log(`${okN}개 통과, ${ngN}개 실패`);
await b.close(); srv.close();
process.exit(ngN || errs.length ? 1 : 0);

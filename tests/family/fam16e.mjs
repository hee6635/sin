// v0.96 E2E: 방장 없음(누구나 초대 · 처음 만든 사람도 나가기 · 마지막 사람이 나가면 방 없어짐) · 다수결 내보내기 · 포스트잇 알림 · 다시 들어올 때 옛 메모 옮기기(무료 횟수 안 씀)
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
}).listen(8216, '127.0.0.1');
const SC = '/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/e2e16/';
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
  await p.goto('http://127.0.0.1:8216/index.html'); await p.waitForTimeout(700);
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
const toCal = async (P) => { await P.evaluate(() => { const p = document.getElementById('pop'); if (p.classList.contains('open')) { p.className = ''; p.innerHTML = ''; } window.__onBack && window.__onBack(); }); await P.waitForTimeout(200);
  await P.evaluate(() => { const p = document.getElementById('pop'); if (p.classList.contains('open')) { p.className = ''; p.innerHTML = ''; } const x = document.querySelector('#page [data-act="page-close"]'); x && x.click(); document.querySelector('#nav [data-tab="cal"]').click(); }); await P.waitForTimeout(400); };
const board = async (P) => { await toCal(P); await P.evaluate(() => document.querySelector('[data-act="open-board"]').click()); await P.waitForTimeout(600); };
const pushes = async () => ((await restRead('__pushlog?pageSize=300')).documents || []).map(d => { const f = d.fields; return { title: f.title?.stringValue, body: f.body?.stringValue, sentTo: (f.sentTo?.arrayValue?.values || []).map(v => v.stringValue).sort().join() }; });
const waitPush = async (P, pred, ms = 25000) => wait(P, async () => (await pushes()).some(pred), ms);
const memberF = async (uid) => (await restRead(`households/${hostUid}/members/${uid}`)).fields || null;
const tapMember = async (P, uid) => { await P.click(`#page [data-act="mem-menu"][data-u="${uid}"]`); await P.waitForTimeout(400); };

// 엄마 폰: 가족방에 들어오기 전에 쓴 ♥ 가족 메모 (지난 날짜 둘 · 앞으로 하나)
const momMemo = (id, text) => ({ id, text, shared: true, by: 'host', t: 1 });
const dk = n => { const d = new Date(T + n * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };   // 서버 시각(오늘) 기준 날짜
const P1 = dk(-1), P2 = dk(-36), F1 = dk(8);
const A = await phone('mom', base('2026-10-06', 2, { memos: { [P1]: [momMemo('p1', '지난 메모 하나')], [P2]: [momMemo('p2', '지난 메모 둘')], [F1]: [momMemo('f1', '앞으로 메모')] } }));
const momUid = await join(A, codeMom, '엄마', 'own');
check('준비: 가족방에 아빠 · 엄마', await wait(H, async () => (await S(H)).fam2.members.length === 2, 20000));
check('엄마 구성원 문서: invitedBy = 코드 만든 아빠', (await memberF(momUid))?.invitedBy?.stringValue === hostUid, JSON.stringify(await memberF(momUid)).slice(0, 300));

// 1) 옛 메모 옮기기
check('지난 날짜 메모 2개는 한 문서(archive/엄마uid)로', await wait(A, async () => { const f = (await restRead(`households/${hostUid}/archive/${momUid}`)).fields; return f && f.items.arrayValue.values.length === 2; }, 20000), JSON.stringify(await restRead(`households/${hostUid}/archive/${momUid}`)).slice(0, 300));
check('앞으로 날짜 메모는 하나씩 · moved 표시', await wait(A, async () => (await restRead(`households/${hostUid}/memos/${momUid}_f1`)).fields?.moved?.booleanValue === true, 20000));
const mf = await memberF(momUid);
check('무료 횟수(sent)는 그대로 0 · moved 1', !(+mf?.sent?.integerValue) && +mf?.moved?.integerValue === 1, JSON.stringify(mf).slice(0, 300));
check('지난 메모는 하나씩 올라가지 않음', !(await exists(`households/${hostUid}/memos/${momUid}_p1`)) && !(await exists(`households/${hostUid}/memos/${momUid}_p2`)));
check('아빠 폰: 옛 메모 묶음을 받아서 보기만 (조금 뒤에 한 번 더 읽음)', await wait(H, async () => { const a = (await S(H)).fam2.arch || {}; return Object.values(a).some(x => x.items.some(i => i.t === '지난 메모 하나')); }, 60000));
await toCal(H); await H.evaluate(k => { window.__k = k; }, P1); await H.evaluate(() => document.querySelector('#track .panel:nth-child(2) .cell[data-k="' + window.__k + '"]').click()); await H.waitForTimeout(500);
check('아빠 폰 그날 창에 옛 메모가 보임', (await H.evaluate(() => document.querySelector('#sheet').innerText)).includes('지난 메모 하나'));
await H.waitForTimeout(3000);
check('옮긴 메모는 가족 메모 알림이 안 감', !(await pushes()).some(x => x.title === '가족 메모'), JSON.stringify(await pushes()));
check('엄마 폰: 묶음으로 옮긴 메모 기억 (다음 동기화에 다시 안 올림)', (await S(A)).fam2.archIds?.length === 2);
check('하나씩 올렸다가 지운 메모 없음 (moved 는 앞으로 메모 1건뿐)', +(await memberF(momUid))?.moved?.integerValue === 1);

// 2) 방장이 아닌 엄마도 초대 → 딸 참여
await openLink(A);
const codeKid = await mkCode(A, '딸');
await A.evaluate(() => window.__onBack && window.__onBack());
const C = await phone('kid', base('2026-10-03', 3));
const kidUid = await join(C, codeKid, '딸', 'own');
check('딸 참여 (엄마가 만든 코드) · invitedBy = 엄마', await wait(H, async () => (await S(H)).fam2.members.length === 3, 20000) && (await memberF(kidUid))?.invitedBy?.stringValue === momUid);
check('가족 참여 알림: 딸 빼고 아빠 · 엄마에게', await waitPush(H, x => x.title === '가족 참여' && x.body.includes('딸') && x.sentTo === [hostUid, momUid].sort().join()), JSON.stringify(await pushes()));

// 3) 포스트잇 알림
await board(H);
await H.click('#page [data-act="pi-new"]'); await H.waitForTimeout(300);
await H.click('#pop [data-act="pi-type"][data-v="list"]'); await H.fill('#piTitle', '장보기');
await H.fill('#piLine', '우유'); await H.click('#pop [data-act="pi-ladd"]'); await H.waitForTimeout(150);
await H.click('#pop [data-act="pi-share"][data-v="1"]'); await H.click('#pop [data-act="pi-save"]'); await H.waitForTimeout(500);
check('새 포스트잇 알림: 아빠 빼고 · 제목만', await waitPush(H, x => x.title === '가족 포스트잇' && x.body.includes('붙였어요 · 장보기') && x.sentTo === [momUid, kidUid].sort().join()), JSON.stringify(await pushes()));
check('알림에 줄 글(우유)은 없음', !JSON.stringify(await pushes()).includes('우유'));
await wait(A, async () => Object.values((await S(A)).fam2.board || {}).some(v => v.title === '장보기'), 20000);
await board(A);
await A.evaluate(() => { const c = [...document.querySelectorAll('#page .pi')].find(e => e.textContent.includes('장보기')); c.click(); }); await A.waitForTimeout(400);
await A.fill('#piLine', '빵'); await A.click('#pop [data-act="pi-ladd"]'); await A.waitForTimeout(300); await A.click('#pop [data-act="pi-save"]'); await A.waitForTimeout(300);
check('줄 추가 알림: 엄마 빼고', await waitPush(A, x => x.body === '엄마님이 "장보기"에 1줄을 더했어요' && x.sentTo === [hostUid, kidUid].sort().join()), JSON.stringify(await pushes()));
check('앱을 보고 있던 아빠 폰: 앱 안 알림(띠)', await wait(H, async () => (await S(H)).events.some(e => (e.text || '').includes('1줄을 더했어요')), 15000), JSON.stringify((await S(H)).events.slice(0, 3)));
const nBefore = (await pushes()).length;
await board(C);
await C.evaluate(() => { const c = [...document.querySelectorAll('#page .ck')].find(e => e.textContent.includes('우유')); c.click(); }); await C.waitForTimeout(2500);
check('줄 체크만 하면 알림 없음', (await pushes()).length === nBefore, JSON.stringify((await pushes()).slice(nBefore)));
await C.evaluate(() => { const c = [...document.querySelectorAll('#page .ck')].find(e => e.textContent.includes('빵')); c.click(); });
check('할 일이 다 끝나면: "장보기" 다 끝났어요 (딸 빼고)', await waitPush(C, x => x.body === '"장보기" 다 끝났어요' && x.sentTo === [hostUid, momUid].sort().join()), JSON.stringify(await pushes()));

// 4) 다수결 내보내기: 3명 → 딸을 빼려면 아빠 · 엄마 둘 다 찬성
await toCal(H); await openLink(H); await tapMember(H, kidUid);
check('딸 메뉴: "내보내기 제안" (2명)', (await H.evaluate(() => document.getElementById('pop').innerText)).includes('내보내기 제안'));
await H.click('#pop [data-act="kick-new"]');
check('제안이 서버에 (찬성 1)', await wait(H, async () => (await restRead(`households/${hostUid}/kicks/${kidUid}`)).fields?.votes?.arrayValue?.values?.length === 1, 15000));
check('딸은 아직 가족방에 있음', !!(await memberF(kidUid)));
check('제안 알림: 엄마에게만 (딸은 모름)', await waitPush(H, x => x.body.includes('딸님 내보내기를 제안') && x.sentTo === momUid), JSON.stringify(await pushes()));
await toCal(A); await openLink(A);
await wait(A, async () => (await A.evaluate(() => document.querySelector('#page').textContent)).includes('찬성 1/2'), 15000);
await tapMember(A, kidUid);
check('엄마 메뉴: 찬성하기 (+ 엄마가 초대했으니 초대 되돌리기도)', await A.evaluate(() => !!document.querySelector('#pop [data-act="kick-vote"]') && !!document.querySelector('#pop [data-act="mem-out"]')));
check('엄마 폰 앱 안 알림: 내보내기 제안', (await S(A)).events.some(e => (e.text || '').includes('내보내기를 제안')));
await A.click('#pop [data-act="kick-vote"]');
check('엄마가 찬성 → 딸이 빠짐', await wait(A, async () => !(await memberF(kidUid)), 20000));
check('딸 폰에 "내보내졌어요" 알림', await waitPush(A, x => x.body === '가족방에서 내보내졌어요' && x.sentTo === kidUid), JSON.stringify(await pushes()));
check('표는 정리됨 · 가족 수 2', !(await exists(`households/${hostUid}/kicks/${kidUid}`)) && +(await restRead(`households/${hostUid}`)).fields.guestCount.integerValue === 1);

// 5) 처음 만든 사람(아빠)도 나가기 → 엄마 혼자 남음 → 엄마가 나가면 방이 없어짐
await toCal(H); await openLink(H);
await H.click('#page [data-act="link-leave"]');
check('아빠가 나감 · 방은 그대로(엄마)', await wait(H, async () => !(await memberF(hostUid)), 20000) && await exists(`households/${hostUid}`));
check('아빠 폰: 연결 풀림', await wait(H, async () => !(await S(H)).link, 10000));
await toCal(A); await openLink(A);
check('엄마 화면: 1명 · "나 혼자라 방이 없어져요"', await wait(A, async () => { await toCal(A); await openLink(A); return (await A.evaluate(() => document.querySelector('#page').textContent)).includes('나 혼자라 방이 없어져요'); }, 20000));
await A.click('#page [data-act="link-leave"]');
check('마지막 사람이 나가면 가족방이 없어짐', await wait(A, async () => !(await exists(`households/${hostUid}`)), 20000));
check('에러 없음', errs.length === 0, errs.slice(0, 2).join(' // '));
log(`\n${okN}개 통과, ${ngN}개 실패`);
await b.close(); process.exit(ngN ? 1 : 0);

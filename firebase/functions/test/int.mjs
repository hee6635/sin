// 에뮬레이터 통합 시험: 문서를 만들면 함수가 돌아서 __pushlog 에 알림이 기록되는지
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'demo-eonjeswieo' });
const db = admin.firestore();
let pass = 0, fail = 0;
const check = (n, ok, x) => { ok ? pass++ : fail++; console.log(ok ? '  ✓' : '  ✗', n, ok ? '' : (x || '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const logs = async () => (await db.collection('__pushlog').get()).docs.map(d => d.data());
const waitLog = async (pred, ms = 20000) => { const t = Date.now(); while (Date.now() - t < ms) { const l = await logs(); if (l.some(pred)) return l; await sleep(300); } return await logs(); };
const H = 'host1', hh = db.collection('households').doc(H);
const ts = admin.firestore.FieldValue.serverTimestamp();

await hh.set({ ownerUid: H, guestCount: 0 });
await hh.collection('members').doc(H).set({ role: 'host', name: '아빠' });
for (const u of ['mom', 'kid']) await db.collection('devices').doc(u).set({ token: 't'.repeat(40) + u, on: true, hid: H });
await db.collection('devices').doc(H).set({ token: 't'.repeat(40) + H, on: true, hid: H });

await hh.collection('members').doc('mom').set({ role: 'guest', name: '엄마', mode: 'own' });
let l = await waitLog(x => x.title === '가족 참여');
check('가족 참여 → 방장에게', l.some(x => x.title === '가족 참여' && x.sentTo.join() === H && x.body.includes('엄마')), JSON.stringify(l));
await hh.collection('members').doc('kid').set({ role: 'guest', name: '딸', mode: 'own' });

await hh.collection('memos').doc('m1').set({ by: 'mom', byName: '엄마', date: '2026-11-03', text: '비밀메모', createdAt: ts, updatedAt: ts });
l = await waitLog(x => x.title === '가족 메모');
const mm = l.find(x => x.title === '가족 메모');
check('메모 → 쓴 사람 빼고 가족 둘에게', mm && mm.sentTo.sort().join() === ['kid', H].sort().join(), JSON.stringify(mm));
check('알림에 메모 내용 없음', !JSON.stringify(l).includes('비밀메모'));

await hh.collection('requests').doc('r1').set({ from: 'mom', to: H, fromName: '엄마', toName: '아빠', date: '2026-11-03', want: '휴', msg: '비밀', st: 'pending', reply: '', held: false, cc: ['kid'], createdAt: ts, updatedAt: ts });
l = await waitLog(x => x.title === '가족 알림');
check('요청 → 아빠에게 + cc 딸에게', l.some(x => x.title === '근무 요청' && x.sentTo.join() === H) && l.some(x => x.title === '가족 알림' && x.sentTo.join() === 'kid'), JSON.stringify(l));
await hh.collection('requests').doc('r1').update({ st: 'accepted', reply: '비밀답장' });
l = await waitLog(x => x.title === '요청 답장');
check('수락 → 엄마에게', l.some(x => x.title === '요청 답장' && x.sentTo.join() === 'mom' && x.body.includes('수락')), JSON.stringify(l));
check('알림에 메시지/답장 내용 없음', !JSON.stringify(l).includes('비밀'));

await db.collection('devices').doc('kid').update({ on: false });
await hh.collection('schedules').doc('mom').set({ pattern: ['주', '휴'], anchor: '2026-01-01', overrides: {}, types: [], holRest: false });
await sleep(1500);
await hh.collection('schedules').doc('mom').update({ overrides: { [new Date(Date.now() + 5 * 86400000 + 9 * 3600000).toISOString().slice(0, 10)]: '야' } });
l = await waitLog(x => x.title === '근무 변경');
const sc = l.find(x => x.title === '근무 변경');
check('근무 변경 → 방장에게만 (딸은 알림 끔)', sc && sc.to.sort().join() === ['kid', H].sort().join() && sc.sentTo.join() === H, JSON.stringify(sc));
const n1 = (await logs()).length;
await hh.collection('schedules').doc('mom').update({ v: 1 });
await sleep(2000);
check('바뀐 게 없으면 알림 없음', (await logs()).length === n1);
// 자는 시간: 지금이 구간 안인 사람은 quietTo 에 (소리 없는 통로), 구간이 지났으면 일반
await db.collection('devices').doc('mom').update({ quiet: [Date.now() - 3600000, Date.now() + 3600000] });
await db.collection('devices').doc('kid').update({ on: true, quiet: [Date.now() - 7200000, Date.now() - 3600000] });
await hh.collection('memos').doc('m2').set({ by: H, byName: '아빠', date: '2026-11-04', text: 'x', createdAt: ts, updatedAt: ts });
l = await waitLog(x => x.title === '가족 메모' && x.body.includes('11/4'));
const qm = l.find(x => x.title === '가족 메모' && x.body.includes('11/4'));
check('자는 시간: 엄마는 조용한 통로(quietTo) · 딸은 일반', qm && qm.quietTo.join() === 'mom' && qm.sentTo.includes('kid') && !qm.quietTo.includes('kid'), JSON.stringify(qm));
console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);

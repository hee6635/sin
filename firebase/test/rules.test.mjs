// Firestore 보안 규칙 시험 (에뮬레이터에서 실행: npm test)
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, writeBatch,
  increment, query, where, Timestamp,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-eonjeswieo',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});
let pass = 0, fail = 0, group = '';
const t = async (name, fn) => {
  try { await fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✕', name, '\n     ', String(e.message || e).split('\n')[0]); }
};
const G = async (name) => { group = name; console.log('\n' + name); await env.clearFirestore(); };

const dbs = {};
const db = (uid) => (dbs[uid || ''] ||= (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore());
const H = 'host1';                    // 호스트 uid = 가족방 번호
const CODE = 'ABCD2345', CODE2 = 'WXYZ6789';
const day = 86400000;
const inv = (o = {}) => ({
  hid: H, ownerUid: H, perm: 'write', name: '아내', hostName: '아빠', patternName: '4조2교대',
  createdAt: serverTimestamp(), expireAt: Timestamp.fromMillis(Date.now() + 7 * day), usedBy: null, ...o,
});
const seedFamily = async (guestCount = 0, extra = async () => {}) =>
  env.withSecurityRulesDisabled(async (c) => {
    const d = c.firestore();
    await setDoc(doc(d, 'households', H), { ownerUid: H, createdAt: Timestamp.now(), guestCount });
    await setDoc(doc(d, 'households', H, 'members', H), { role: 'host', name: '아빠', perm: 'write', joinedAt: Timestamp.now() });
    await extra(d);
  });
const seedInvite = (code = CODE, o = {}) =>
  env.withSecurityRulesDisabled(async (c) => setDoc(doc(c.firestore(), 'invites', code), { ...inv(), createdAt: Timestamp.now(), ...o }));
const seedGuest = (uid, n = '아내', role = 'guest') =>
  env.withSecurityRulesDisabled(async (c) =>
    setDoc(doc(c.firestore(), 'households', H, 'members', uid), { role, name: n, perm: 'write', joinedAt: Timestamp.now(), inviteCode: CODE }));

// 가족방 만들기 묶음 / 참여 묶음 / 나가기 묶음
const createHouse = (d, over = {}) => {
  const b = writeBatch(d);
  b.set(doc(d, 'households', H), { ownerUid: H, createdAt: serverTimestamp(), guestCount: 0, ...over.h });
  b.set(doc(d, 'households', H, 'members', H), { role: 'host', name: '아빠', perm: 'write', joinedAt: serverTimestamp(), ...over.m });
  return b.commit();
};
const join = (d, uid, o = {}) => {
  const code = o.code || CODE;
  const b = writeBatch(d);
  b.set(doc(d, 'households', H, 'members', uid), { role: 'guest', name: '아내', perm: 'write', joinedAt: serverTimestamp(), inviteCode: code, ...o.m });
  if (!o.noMark) b.update(doc(d, 'invites', code), { usedBy: uid, usedAt: serverTimestamp(), ...o.i });
  if (!o.noCount) b.update(doc(d, 'households', H), { guestCount: increment(o.inc ?? 1) });
  return b.commit();
};

// ───────── 연결 시험 (ping) ─────────
await G('연결 시험 (ping)');
const good = () => ({ t: serverTimestamp(), v: '0.15', ua: 'test' });
await t('내 ping 문서 쓰기 · 읽기 · 고치기 · 지우기', async () => {
  const a = db('alice');
  await assertSucceeds(setDoc(doc(a, 'ping/alice'), good()));
  await assertSucceeds(getDoc(doc(a, 'ping/alice')));
  await assertSucceeds(setDoc(doc(a, 'ping/alice'), good()));
  await assertSucceeds(deleteDoc(doc(a, 'ping/alice')));
});
await t('남의 ping 문서 쓰기 · 읽기 막힘', async () => {
  await assertFails(setDoc(doc(db('bob'), 'ping/alice'), good()));
  await assertFails(getDoc(doc(db('bob'), 'ping/alice')));
});
await t('로그인 안 하면 막힘', () => assertFails(setDoc(doc(db(), 'ping/alice'), good())));
await t('엉뚱한 필드 · 가짜 시간 · 너무 긴 글 막힘', async () => {
  const a = db('alice');
  await assertFails(setDoc(doc(a, 'ping/alice'), { ...good(), admin: true }));
  await assertFails(setDoc(doc(a, 'ping/alice'), { ...good(), t: new Date('2020-01-01') }));
  await assertFails(setDoc(doc(a, 'ping/alice'), { ...good(), ua: 'x'.repeat(300) }));
});
await t('ping 목록 훑어보기 · 다른 컬렉션 막힘', async () => {
  await assertFails(getDocs(collection(db('alice'), 'ping')));
  await assertFails(setDoc(doc(db('alice'), 'whatever/x'), { a: 1 }));
  await assertFails(getDoc(doc(db('alice'), 'whatever/x')));
});

// ───────── 가족방 만들기 ─────────
await G('가족방 만들기');
await t('호스트가 가족방 + 호스트 문서를 한 묶음으로 만들기', () => assertSucceeds(createHouse(db(H))));
await t('남의 번호(uid)로 가족방 만들기 막힘', async () => {
  const b = writeBatch(db('mallory'));
  b.set(doc(db('mallory'), 'households', H), { ownerUid: H, createdAt: serverTimestamp(), guestCount: 0 });
  b.set(doc(db('mallory'), 'households', H, 'members', H), { role: 'host', name: 'x', perm: 'write', joinedAt: serverTimestamp() });
  await assertFails(b.commit());
});
await t('호스트 문서 없이 가족방만 만들기 막힘', () =>
  assertFails(setDoc(doc(db(H), 'households', H), { ownerUid: H, createdAt: serverTimestamp(), guestCount: 0 })));
await t('처음부터 guestCount 가 0 이 아니면 막힘', () => assertFails(createHouse(db(H), { h: { guestCount: 2 } })));
await t('호스트 문서가 guest 역할이면 막힘', () => assertFails(createHouse(db(H), { m: { role: 'guest' } })));
await t('이미 있는 가족방을 다시 만들면(덮어쓰기) 막힘', async () => {
  await seedFamily();
  await assertFails(createHouse(db(H)));
});
await t('구성원은 가족방 읽기 가능, 남 · 로그인 안 한 사람은 막힘', async () => {
  await assertSucceeds(getDoc(doc(db(H), 'households', H)));
  await assertFails(getDoc(doc(db('stranger'), 'households', H)));
  await assertFails(getDoc(doc(db(), 'households', H)));
});
await t('가족방 전체 목록 훑어보기 막힘', () => assertFails(getDocs(collection(db(H), 'households'))));

// ───────── 초대 코드 ─────────
await G('초대 코드 만들기 · 읽기');
await seedFamily();
await t('호스트가 초대 코드 만들기', () => assertSucceeds(setDoc(doc(db(H), 'invites', CODE), inv())));
await t('남이 호스트 이름으로 코드 만들기 막힘', () => assertFails(setDoc(doc(db('mallory'), 'invites', CODE2), inv())));
await t('남의 가족방 번호로 코드 만들기 막힘', () => assertFails(setDoc(doc(db('mallory'), 'invites', CODE2), inv({ ownerUid: 'mallory' }))));
await t('만든 가족방이 없는 사람은 코드 못 만듦', () => assertFails(setDoc(doc(db('lonely'), 'invites', CODE2), inv({ hid: 'lonely', ownerUid: 'lonely' }))));
await t('유효기간이 8일보다 길면 · 이미 지났으면 막힘', async () => {
  await assertFails(setDoc(doc(db(H), 'invites', 'AAAABBBB'), inv({ expireAt: Timestamp.fromMillis(Date.now() + 30 * day) })));
  await assertFails(setDoc(doc(db(H), 'invites', 'AAAACCCC'), inv({ expireAt: Timestamp.fromMillis(Date.now() - day) })));
});
await t('코드 모양이 틀리면(0 O 1 I L · 길이) 막힘', async () => {
  await assertFails(setDoc(doc(db(H), 'invites', 'ABCD0OIL'), inv()));
  await assertFails(setDoc(doc(db(H), 'invites', 'ABC'), inv()));
});
await t('이미 사용됨 상태로 만들기 · 엉뚱한 필드 막힘', async () => {
  await assertFails(setDoc(doc(db(H), 'invites', 'AAAADDDD'), inv({ usedBy: 'someone' })));
  await assertFails(setDoc(doc(db(H), 'invites', 'AAAAEEEE'), { ...inv(), admin: true }));
});
await t('이미 있는 코드를 덮어쓰기 막힘 (코드 충돌)', () => assertFails(setDoc(doc(db(H), 'invites', CODE), inv())));
await t('로그인한 누구나 코드를 알면 하나 읽기 가능, 로그인 안 하면 막힘', async () => {
  await assertSucceeds(getDoc(doc(db('anyone'), 'invites', CODE)));
  await assertFails(getDoc(doc(db(), 'invites', CODE)));
});
await t('남이 코드 목록 훑어보기 막힘 · 호스트는 자기 코드만 목록 가능', async () => {
  await assertFails(getDocs(collection(db('anyone'), 'invites')));
  await assertFails(getDocs(query(collection(db('anyone'), 'invites'), where('ownerUid', '==', H))));
  await assertSucceeds(getDocs(query(collection(db(H), 'invites'), where('ownerUid', '==', H))));
  await assertFails(getDocs(collection(db(H), 'invites')));
});
await t('호스트만 코드 지우기', async () => {
  await assertFails(deleteDoc(doc(db('anyone'), 'invites', CODE)));
  await assertSucceeds(deleteDoc(doc(db(H), 'invites', CODE)));
});

// ───────── 가족 참여 ─────────
await G('가족 참여');
await t('코드로 참여 (구성원 문서 + 코드 사용됨 + 가족 수 +1)', async () => {
  await seedFamily(); await seedInvite();
  await assertSucceeds(join(db('g1'), 'g1'));
});
await t('참여한 가족은 가족방 · 구성원 목록 읽기 가능', async () => {
  await assertSucceeds(getDoc(doc(db('g1'), 'households', H)));
  await assertSucceeds(getDocs(collection(db('g1'), 'households', H, 'members')));
});
await t('같은 코드 다시 쓰기(1회용) 막힘', () => assertFails(join(db('g2'), 'g2')));
await t('코드를 \'사용됨\'으로 안 바꾸고 참여 막힘', async () => {
  await env.clearFirestore(); await seedFamily(); await seedInvite();
  await assertFails(join(db('g1'), 'g1', { noMark: true }));
});
await t('가족 수를 안 올리고 · 2 올리고 참여 막힘', async () => {
  await assertFails(join(db('g1'), 'g1', { noCount: true }));
  await assertFails(join(db('g1'), 'g1', { inc: 2 }));
});
await t('남의 코드(다른 가족방)로 참여 막힘', async () => {
  await seedInvite(CODE2, { hid: 'otherHost', ownerUid: 'otherHost' });
  await assertFails(join(db('g1'), 'g1', { code: CODE2 }));
});
await t('만료된 코드 막힘', async () => {
  await seedInvite('EXPD2345', { expireAt: Timestamp.fromMillis(Date.now() - 1000) });
  await assertFails(join(db('g1'), 'g1', { code: 'EXPD2345' }));
});
await t('권한(perm)을 코드와 다르게 바꿔서 참여 막힘', async () => {
  await seedInvite('READ2345', { perm: 'read' });
  await assertFails(join(db('g1'), 'g1', { code: 'READ2345', m: { perm: 'write' } }));
  await assertSucceeds(join(db('g1'), 'g1', { code: 'READ2345', m: { perm: 'read' } }));
});
await t('guest 가 아니라 host 역할로 참여 막힘', async () => {
  await seedInvite('HAST2345');
  await assertFails(join(db('g2'), 'g2', { code: 'HAST2345', m: { role: 'host' } }));
});
await t('이름이 비었거나 13자 이상이면 막힘', async () => {
  await assertFails(join(db('g2'), 'g2', { code: 'HAST2345', m: { name: '' } }));
  await assertFails(join(db('g2'), 'g2', { code: 'HAST2345', m: { name: 'ㅁ'.repeat(13) } }));
});
await t('이미 구성원인 사람이 다시 참여 막힘', async () => {
  await seedInvite('AGAN2345');
  await assertFails(join(db('g1'), 'g1', { code: 'AGAN2345' }));
});
await t('가족은 호스트 제외 3명까지 (4번째 막힘)', async () => {
  await env.clearFirestore(); await seedFamily();
  for (const [i, u] of ['a1', 'a2', 'a3', 'a4'].entries()) await seedInvite('KNVT234' + (i + 2));
  await assertSucceeds(join(db('a1'), 'a1', { code: 'KNVT2342' }));
  await assertSucceeds(join(db('a2'), 'a2', { code: 'KNVT2343' }));
  await assertSucceeds(join(db('a3'), 'a3', { code: 'KNVT2344' }));
  await assertFails(join(db('a4'), 'a4', { code: 'KNVT2345' }));
});
await t('구성원이 아닌 사람은 구성원 목록 · 가족방 읽기 막힘', async () => {
  await assertFails(getDocs(collection(db('outsider'), 'households', H, 'members')));
  await assertFails(getDoc(doc(db('outsider'), 'households', H)));
});
await t('내 구성원 문서는 가족방 구성원이 아니어도 읽기 가능(있는지 확인용)', async () => {
  await assertSucceeds(getDoc(doc(db('outsider'), 'households', H, 'members', 'outsider')));
  await assertFails(getDoc(doc(db('outsider'), 'households', H, 'members', H)));
});

// ───────── 가족 관리 ─────────
await G('가족 관리 (호칭 · 권한 · 나가기 · 내보내기 · 없애기)');
const fresh = async () => { await env.clearFirestore(); await seedFamily(2); await seedGuest('g1', '아내'); await seedGuest('g2', '아이'); };
await t('가족이 내 호칭 고치기 · 권한은 못 고침 · 남의 호칭 못 고침', async () => {
  await fresh();
  await assertSucceeds(updateDoc(doc(db('g1'), 'households', H, 'members', 'g1'), { name: '여보' }));
  await assertFails(updateDoc(doc(db('g1'), 'households', H, 'members', 'g1'), { perm: 'read' }));
  await assertFails(updateDoc(doc(db('g1'), 'households', H, 'members', 'g2'), { name: '해킹' }));
  await assertFails(updateDoc(doc(db('g1'), 'households', H, 'members', 'g1'), { role: 'host' }));
});
await t('호스트가 가족의 호칭 · 권한 고치기, 역할은 못 고침', async () => {
  await assertSucceeds(updateDoc(doc(db(H), 'households', H, 'members', 'g2'), { name: '막내', perm: 'read' }));
  await assertFails(updateDoc(doc(db(H), 'households', H, 'members', 'g2'), { role: 'host' }));
});
await t('가족이 가족 수(guestCount)를 마음대로 바꾸기 막힘', async () => {
  await assertFails(updateDoc(doc(db('g1'), 'households', H), { guestCount: 0 }));
  await assertFails(updateDoc(doc(db('g1'), 'households', H), { guestCount: 3 }));
});
await t('가족 나가기 (내 문서 삭제 + 가족 수 -1)', async () => {
  const b = writeBatch(db('g1'));
  b.delete(doc(db('g1'), 'households', H, 'members', 'g1'));
  b.update(doc(db('g1'), 'households', H), { guestCount: increment(-1) });
  await assertSucceeds(b.commit());
});
await t('가족 수를 안 줄이고 나가기 막힘', async () => {
  await fresh();
  await assertFails(deleteDoc(doc(db('g1'), 'households', H, 'members', 'g1')));
});
await t('가족이 다른 가족을 내보내기 막힘', async () => {
  const b = writeBatch(db('g1'));
  b.delete(doc(db('g1'), 'households', H, 'members', 'g2'));
  b.update(doc(db('g1'), 'households', H), { guestCount: increment(-1) });
  await assertFails(b.commit());
});
await t('호스트가 가족 내보내기', async () => {
  const b = writeBatch(db(H));
  b.delete(doc(db(H), 'households', H, 'members', 'g2'));
  b.update(doc(db(H), 'households', H), { guestCount: increment(-1) });
  await assertSucceeds(b.commit());
});
await t('가족은 호스트 문서를 지우거나 가족방을 지우기 막힘', async () => {
  await fresh();
  await assertFails(deleteDoc(doc(db('g1'), 'households', H, 'members', H)));
  await assertFails(deleteDoc(doc(db('g1'), 'households', H)));
});
await t('호스트가 가족방 없애기 (구성원 · 코드 · 가족방을 한 묶음으로)', async () => {
  await seedInvite('LAST2345');
  const b = writeBatch(db(H));
  b.delete(doc(db(H), 'invites', 'LAST2345'));
  b.delete(doc(db(H), 'households', H, 'members', 'g1'));
  b.delete(doc(db(H), 'households', H, 'members', 'g2'));
  b.delete(doc(db(H), 'households', H, 'members', H));
  b.delete(doc(db(H), 'households', H));
  await assertSucceeds(b.commit());
});
await t('가족방이 남아 있는데 호스트 문서만 지우기 막힘', async () => {
  await fresh();
  await assertFails(deleteDoc(doc(db(H), 'households', H, 'members', H)));
});


// ───────── 근무표 (2단계) ─────────
await G('근무표 올리기 · 보기');
const sch = (o = {}) => ({
  v: 1, patternName: '4조2교대', teamName: 'C조', pattern: ['주', '주', '휴', '휴', '야', '야', '휴', '휴'], anchor: '2026-10-06',
  types: [{ k: '주', name: '주간', color: 'v:day', rest: false }, { k: '휴', name: '휴무', color: '', rest: true }],
  overrides: { '2026-10-16': '주' }, holRest: false, updatedAt: serverTimestamp(), ...o,
});
const SD = (uid) => doc(db(uid), 'households', H, 'schedules', uid);
const freshS = async () => { await env.clearFirestore(); await seedFamily(2); await seedGuest('g1'); await seedGuest('g2', '딸');
  await env.withSecurityRulesDisabled(async (c) => setDoc(doc(c.firestore(), 'households', H, 'members', 'g2'), { role: 'guest', name: '할머니', perm: 'write', joinedAt: Timestamp.now(), inviteCode: CODE2, mode: 'view' })); };
await t('구성원은 자기 근무표를 올리고 고칠 수 있음 (호스트 · 가족)', async () => {
  await freshS();
  await assertSucceeds(setDoc(SD(H), sch()));
  await assertSucceeds(setDoc(SD('g1'), sch()));
  await assertSucceeds(setDoc(SD('g1'), sch({ overrides: {} })));
});
await t('구성원은 서로의 근무표를 읽을 수 있음', async () => {
  await freshS(); await setDoc(SD(H), sch());
  await assertSucceeds(getDoc(SD(H)));
  await assertSucceeds(getDoc(doc(db('g2'), 'households', H, 'schedules', H)));
  await assertSucceeds(getDocs(collection(db('g1'), 'households', H, 'schedules')));
});
await t('남의 근무표 쓰기 · 지우기 막힘', async () => {
  await freshS(); await setDoc(SD('g1'), sch());
  await assertFails(setDoc(doc(db('g1'), 'households', H, 'schedules', H), sch()));
  await assertFails(deleteDoc(doc(db('g2'), 'households', H, 'schedules', 'g1')));
});
await t('가족 것만 볼래요(view)는 근무표를 올릴 수 없음', async () => {
  await freshS();
  await assertFails(setDoc(SD('g2'), sch()));
});
await t('가족방 밖 사람은 읽기 · 쓰기 막힘, 로그인 안 하면 막힘', async () => {
  await freshS(); await setDoc(SD(H), sch());
  await assertFails(getDoc(doc(db('stranger'), 'households', H, 'schedules', H)));
  await assertFails(setDoc(doc(db('stranger'), 'households', H, 'schedules', 'stranger'), sch()));
  await assertFails(getDoc(doc(db(), 'households', H, 'schedules', H)));
});
await t('엉뚱한 필드 · 가짜 시간 · 너무 큰 내용 막힘', async () => {
  await freshS();
  await assertFails(setDoc(SD('g1'), sch({ admin: true })));
  await assertFails(setDoc(SD('g1'), sch({ updatedAt: Timestamp.fromMillis(1000) })));
  await assertFails(setDoc(SD('g1'), sch({ pattern: [] })));
  await assertFails(setDoc(SD('g1'), sch({ pattern: Array(61).fill('주') })));
  await assertFails(setDoc(SD('g1'), sch({ anchor: '2026-10-6' })));
  await assertFails(setDoc(SD('g1'), sch({ types: Array(25).fill({ k: '주', name: '주간', color: '', rest: false }) })));
  const big = {}; for (let i = 0; i < 501; i++) big['k' + i] = '주';
  await assertFails(setDoc(SD('g1'), sch({ overrides: big })));
  await assertFails(setDoc(SD('g1'), sch({ v: 2 })));
});
await t('본인 · 호스트는 근무표를 지울 수 있음 (나가기 · 내보내기)', async () => {
  await freshS(); await setDoc(SD('g1'), sch());
  await assertSucceeds(deleteDoc(SD('g1')));
  await setDoc(SD('g1'), sch());
  await assertSucceeds(deleteDoc(doc(db(H), 'households', H, 'schedules', 'g1')));
});
await t('가족이 올 때 mode 를 own · view 로 고를 수 있고, 다른 값은 막힘', async () => {
  await env.clearFirestore(); await seedFamily(0); await seedInvite(CODE); await seedInvite(CODE2);
  await assertSucceeds(join(db('g1'), 'g1', { m: { mode: 'view' } }));
  await assertFails(join(db('g2'), 'g2', { code: CODE2, m: { mode: 'admin' } }));
});
await t('내 mode 는 내가 바꿀 수 있고, 호스트가 가족의 mode 를 바꾸는 건 막힘', async () => {
  await freshS();
  await assertSucceeds(updateDoc(doc(db('g1'), 'households', H, 'members', 'g1'), { mode: 'view' }));
  await assertFails(updateDoc(doc(db(H), 'households', H, 'members', 'g1'), { mode: 'own' }));
  await assertFails(updateDoc(doc(db('g1'), 'households', H, 'members', 'g1'), { mode: 'x' }));
});


// ───────── 근무 요청 · 가족 메모 · 무료 횟수 (3단계) ─────────
await G('근무 요청 · 가족 메모 · 무료 10건');
const MEM = (uid) => doc(db(uid), 'households', H, 'members', uid);
const rq = (o = {}) => ({ from: 'g1', to: H, fromName: '엄마', toName: '아빠', date: '2026-10-31', want: '휴', msg: '할로윈 파티', st: 'pending', reply: '', held: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...o });
const memo = (o = {}) => ({ by: 'g1', byName: '엄마', date: '2026-10-17', text: '장모님 생신', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...o });
const sendReq = async (uid, id, data, sent = 0) => { const d = db(uid); const b = writeBatch(d);
  b.set(doc(d, 'households', H, 'requests', id), data); b.update(doc(d, 'households', H, 'members', uid), { sent: sent + 1 }); return b.commit(); };
const sendMemo = async (uid, id, data, sent = 0) => { const d = db(uid); const b = writeBatch(d);
  b.set(doc(d, 'households', H, 'memos', id), data); b.update(doc(d, 'households', H, 'members', uid), { sent: sent + 1 }); return b.commit(); };
const fresh3 = async () => { await env.clearFirestore(); await seedFamily(3); await seedGuest('g1'); await seedGuest('g2', '딸'); await seedGuest('g3', '할머니'); };
await t('내 횟수는 +1씩만 올릴 수 있고, 한꺼번에 올리기 · bonus 쓰기 · 남의 횟수는 막힘', async () => {
  await fresh3();
  await assertSucceeds(updateDoc(MEM('g1'), { sent: 1 }));
  await assertFails(updateDoc(MEM('g1'), { sent: 3 }));
  await assertFails(updateDoc(MEM('g1'), { bonus: 10 }));
  await assertFails(updateDoc(doc(db('g2'), 'households', H, 'members', 'g1'), { sent: 2 }));
  await assertFails(updateDoc(MEM('g1'), { sent: 0 }));
});
await t('근무 요청 보내기: 횟수 +1 과 같은 묶음일 때만', async () => {
  await fresh3();
  await assertSucceeds(sendReq('g1', 'r1', rq()));
  await assertFails(setDoc(doc(db('g1'), 'households', H, 'requests', 'r2'), rq()));                 // 횟수 안 올림
  await assertFails(sendReq('g1', 'r3', rq(), 5));                                                    // 횟수 엉뚱하게
});
await t('근무 요청: 남 이름으로 · 나에게 · 가족 아닌 사람에게 · 이상한 값은 막힘', async () => {
  await fresh3();
  await assertFails(sendReq('g1', 'a', rq({ from: 'g2' })));
  await assertFails(sendReq('g1', 'b', rq({ to: 'g1' })));
  await assertFails(sendReq('g1', 'c', rq({ to: 'stranger' })));
  await assertFails(sendReq('g1', 'd', rq({ st: 'accepted' })));
  await assertFails(sendReq('g1', 'e', rq({ want: '휴휴휴휴휴' })));
  await assertFails(sendReq('g1', 'f', rq({ msg: 'x'.repeat(61) })));
  await assertFails(sendReq('g1', 'g', rq({ admin: 1 })));
  await assertFails(sendReq('g1', 'h', rq({ date: '2026-10-3' })));
});
await t('근무 요청은 보낸 사람 · 받는 사람 · 호스트만 읽음 (다른 가족은 못 봄)', async () => {
  await fresh3(); await sendReq('g1', 'r1', rq({ to: 'g2', toName: '딸' }));
  await assertSucceeds(getDoc(doc(db('g1'), 'households', H, 'requests', 'r1')));
  await assertSucceeds(getDoc(doc(db('g2'), 'households', H, 'requests', 'r1')));
  await assertSucceeds(getDoc(doc(db(H), 'households', H, 'requests', 'r1')));
  await assertFails(getDoc(doc(db('g3'), 'households', H, 'requests', 'r1')));
  await assertSucceeds(getDocs(query(collection(db('g2'), 'households', H, 'requests'), where('to', '==', 'g2'))));
  await assertFails(getDocs(collection(db('g3'), 'households', H, 'requests')));
  await assertFails(getDoc(doc(db('stranger'), 'households', H, 'requests', 'r1')));
});
await t('받는 사람만 수락 · 보류 · 거절 · 적용, 보낸 사람은 대기 중일 때 취소만', async () => {
  await fresh3(); await sendReq('g1', 'r1', rq({ to: 'g2', toName: '딸' }));
  const R = (u) => doc(db(u), 'households', H, 'requests', 'r1');
  await assertSucceeds(updateDoc(R('g2'), { st: 'pending', held: true, reply: '일단 물어볼게', updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(R('g2'), { st: 'accepted', held: false, reply: '좋아', mode: 'change', updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(R('g2'), { st: 'applied', prev: '주', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(R('g1'), { st: 'accepted', updatedAt: serverTimestamp() }));            // 보낸 사람이 수락 못 함
  await assertFails(updateDoc(R('g3'), { st: 'rejected', updatedAt: serverTimestamp() }));            // 제3자
  await assertFails(updateDoc(R('g2'), { msg: '바꿔치기', updatedAt: serverTimestamp() }));           // 내용 바꾸기
  await assertFails(updateDoc(R('g2'), { st: 'cancelled', updatedAt: serverTimestamp() }));
  await sendReq('g1', 'r2', rq({ to: 'g2', toName: '딸' }), 1);
  const R2 = (u) => doc(db(u), 'households', H, 'requests', 'r2');
  await assertSucceeds(updateDoc(R2('g1'), { st: 'cancelled', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(R2('g2'), { st: 'accepted', updatedAt: serverTimestamp() }));          // 취소된 것
});
await t('근무 요청 지우기: 보낸 사람 · 받는 사람 · 호스트', async () => {
  await fresh3(); await sendReq('g1', 'r1', rq({ to: 'g2', toName: '딸' }));
  await assertFails(deleteDoc(doc(db('g3'), 'households', H, 'requests', 'r1')));
  await assertSucceeds(deleteDoc(doc(db('g2'), 'households', H, 'requests', 'r1')));
});
await t('가족 메모: 쓰기(횟수 +1과 같이) · 가족 모두 읽기 · 쓴 사람만 고치기 · 쓴 사람/호스트가 지우기', async () => {
  await fresh3();
  await assertSucceeds(sendMemo('g1', 'm1', memo()));
  await assertFails(setDoc(doc(db('g1'), 'households', H, 'memos', 'm2'), memo()));                    // 횟수 안 올림
  await assertFails(sendMemo('g1', 'm3', memo({ by: 'g2' }), 1));
  await assertFails(sendMemo('g1', 'm4', memo({ text: '' }), 1));
  await assertFails(sendMemo('g1', 'm5', memo({ text: 'x'.repeat(201) }), 1));
  await assertSucceeds(getDoc(doc(db('g2'), 'households', H, 'memos', 'm1')));
  await assertFails(getDoc(doc(db('stranger'), 'households', H, 'memos', 'm1')));
  await assertSucceeds(updateDoc(doc(db('g1'), 'households', H, 'memos', 'm1'), { text: '고침', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(db('g2'), 'households', H, 'memos', 'm1'), { text: '남이 고침', updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(doc(db('g2'), 'households', H, 'memos', 'm1')));
  await assertSucceeds(deleteDoc(doc(db(H), 'households', H, 'memos', 'm1')));
});
await t('무료 10건: 11번째 요청 · 메모는 막힘 (요청 + 메모 합쳐서)', async () => {
  await fresh3();
  for (let i = 0; i < 5; i++) await assertSucceeds(sendReq('g1', 'r' + i, rq({ to: 'g2', toName: '딸', date: '2026-11-0' + (i + 1) }), i));
  for (let i = 5; i < 10; i++) await assertSucceeds(sendMemo('g1', 'm' + i, memo(), i));
  await assertFails(sendReq('g1', 'r99', rq({ to: 'g2', toName: '딸' }), 10));
  await assertFails(sendMemo('g1', 'm99', memo(), 10));
});

// ───────── v0.22: 모두에게 알리기 · 메모 고쳤다고 알리기 · 스티커 보여주기 ─────────
await G('모두에게 알리기(cc) · 메모 알림(rev) · 스티커 보여주기');
await t('요청에 cc(알림 받을 가족)를 넣을 수 있음: 3명까지, 목록이어야 함', async () => {
  await fresh3();
  await assertSucceeds(sendReq('g1', 'c1', rq({ to: 'g2', toName: '딸', cc: ['g3', H] })));
  await assertFails(sendReq('g1', 'c2', rq({ to: 'g2', toName: '딸', cc: ['a', 'b', 'c', 'd'] }), 1));
  await assertFails(sendReq('g1', 'c3', rq({ to: 'g2', toName: '딸', cc: 'g3' }), 1));
});
await t('cc 로 알림 받는 가족은 읽을 수 있고(문서 · 내 이름으로 찾기), 답 · 고치기 · 지우기는 못 함', async () => {
  await fresh3(); await sendReq('g1', 'c1', rq({ to: 'g2', toName: '딸', cc: ['g3'] }));
  const R = (u) => doc(db(u), 'households', H, 'requests', 'c1');
  await assertSucceeds(getDoc(R('g3')));
  await assertSucceeds(getDocs(query(collection(db('g3'), 'households', H, 'requests'), where('cc', 'array-contains', 'g3'))));
  await assertFails(updateDoc(R('g3'), { st: 'accepted', updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(R('g3')));
  await assertSucceeds(updateDoc(R('g2'), { st: 'accepted', held: false, reply: '', updatedAt: serverTimestamp() }));
});
await t('cc 에 없는 가족은 읽을 수 없고, 남의 이름으로 알림 목록도 못 찾음', async () => {
  await fresh3(); await sendReq('g1', 'c1', rq({ to: H, toName: '아빠', cc: ['g2'] }));
  await assertFails(getDoc(doc(db('g3'), 'households', H, 'requests', 'c1')));
  await assertFails(getDocs(query(collection(db('g3'), 'households', H, 'requests'), where('cc', 'array-contains', 'g2'))));
  await assertFails(getDoc(doc(db('stranger'), 'households', H, 'requests', 'c1')));
});
await t('cc 없는 예전 요청도 그대로 읽고 답할 수 있음', async () => {
  await fresh3(); await sendReq('g1', 'r1', rq({ to: 'g2', toName: '딸' }));
  await assertSucceeds(getDocs(query(collection(db('g2'), 'households', H, 'requests'), where('to', '==', 'g2'))));
  await assertSucceeds(updateDoc(doc(db('g2'), 'households', H, 'requests', 'r1'), { st: 'rejected', held: false, reply: '', updatedAt: serverTimestamp() }));
});
await t('가족 메모 고치기: rev 는 한 번에 +1 까지, 내리기 · 건너뛰기 · 남이 고치기는 막힘', async () => {
  await fresh3(); await sendMemo('g1', 'm1', memo());
  const M = (u) => doc(db(u), 'households', H, 'memos', 'm1');
  await assertSucceeds(updateDoc(M('g1'), { text: '고침', updatedAt: serverTimestamp() }));                    // 조용히 고치기
  await assertSucceeds(updateDoc(M('g1'), { text: '또 고침', rev: 1, updatedAt: serverTimestamp() }));          // 알리기
  await assertSucceeds(updateDoc(M('g1'), { text: '또또', rev: 2, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(M('g1'), { text: '건너뜀', rev: 5, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(M('g1'), { text: '내림', rev: 0, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(M('g1'), { text: '글자', rev: 'x', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(M('g2'), { text: '남이', rev: 3, updatedAt: serverTimestamp() }));
});
await t('스티커 보여주기: stk · sdefs 를 올릴 수 있고, 너무 크거나 이상한 모양은 막힘', async () => {
  await freshS();
  const stk = { '2026-10-12': '0110' }, sdefs = [{ i: 's_pill', k: 'p', t: 3, c: '#ef4d5a' }, { i: 's_yoga', k: 'm', e: '🧘' }];
  await assertSucceeds(setDoc(SD('g1'), sch({ stk, sdefs })));
  await assertSucceeds(setDoc(SD('g1'), sch()));                                                                  // 끄면 없어짐
  const big = {}; for (let i = 0; i < 401; i++) big['d' + i] = '01';
  await assertFails(setDoc(SD('g1'), sch({ stk: big, sdefs })));
  await assertFails(setDoc(SD('g1'), sch({ stk, sdefs: Array(13).fill({ i: 'x', k: 'm', e: '🧘' }) })));
  await assertFails(setDoc(SD('g1'), sch({ stk: 'x', sdefs })));
  await assertFails(setDoc(SD('g1'), sch({ stk, sdefs: 'x' })));
});

// ───────── v0.22: 여러 날 한꺼번에 요청 (묶음) ─────────
await G('여러 날 요청 묶음(grp)');
const sendGroup = async (uid, n, over = {}, sent = 0, g = 'grpA') => { const d = db(uid); const b = writeBatch(d);
  for (let i = 0; i < n; i++) b.set(doc(d, 'households', H, 'requests', `${g}_${i}`), rq({ to: H, toName: '아빠', date: `2026-11-${String(i + 1).padStart(2, '0')}`, grp: g, gn: n, ...(i === 0 ? { lead: true } : {}), ...over }));
  b.update(doc(d, 'households', H, 'members', uid), { sent: sent + 1 }); return b.commit(); };
await t('여러 날 요청: 날짜마다 문서 + 횟수는 묶음 1건 (2일 · 7일 · 14일)', async () => {
  for (const n of [2, 7, 14]) { await fresh3(); await assertSucceeds(sendGroup('g1', n)); }
});
await t('여러 날 요청: 15일 이상 · 이상한 묶음 값은 막힘', async () => {
  await fresh3();
  await assertFails(sendGroup('g1', 15, {}, 0, 'big'));
  await assertFails(sendGroup('g1', 3, { gn: 99 }, 0, 'x'));
  await assertFails(sendGroup('g1', 3, { grp: 'x'.repeat(41) }, 0, 'y'));
  await assertFails(sendGroup('g1', 3, { lead: 'yes' }, 0, 'z'));
});
await t('여러 날 요청도 횟수(sent)가 안 오르면 막힘, 10건 넘으면 막힘', async () => {
  await fresh3();
  const d = db('g1'); const b = writeBatch(d);
  for (let i = 0; i < 3; i++) b.set(doc(d, 'households', H, 'requests', `n${i}`), rq({ to: H, toName: '아빠', grp: 'n', gn: 3 }));
  await assertFails(b.commit());
  await assertSucceeds(sendReq('g1', 'a1', rq(), 0));
  await assertFails(sendGroup('g1', 3, {}, 10, 'late'));
});
await t('묶음 요청: 받는 사람은 날짜마다 답할 수 있고, cc 알림 가족은 읽기만', async () => {
  await fresh3(); await assertSucceeds(sendGroup('g1', 3, { to: 'g2', toName: '딸', cc: ['g3'] }));
  for (let i = 0; i < 3; i++) await assertSucceeds(updateDoc(doc(db('g2'), 'households', H, 'requests', `grpA_${i}`), { st: 'applied', held: false, reply: '', prev: '주', updatedAt: serverTimestamp() }));
  await assertSucceeds(getDocs(query(collection(db('g3'), 'households', H, 'requests'), where('cc', 'array-contains', 'g3'))));
  await assertFails(updateDoc(doc(db('g3'), 'households', H, 'requests', 'grpA_0'), { st: 'rejected', updatedAt: serverTimestamp() }));
});

// ───────── 푸시 알림 기기 등록 (devices) ─────────
await G('푸시 알림 기기 등록 (devices)');
const dev = (o = {}) => ({ token: 'x'.repeat(60), on: true, hid: H, updatedAt: serverTimestamp(), ...o });
await t('내 기기 문서 쓰기 · 읽기 · 끄기 · 지우기', async () => {
  const a = db('alice');
  await assertSucceeds(setDoc(doc(a, 'devices/alice'), dev()));
  await assertSucceeds(getDoc(doc(a, 'devices/alice')));
  await assertSucceeds(setDoc(doc(a, 'devices/alice'), dev({ on: false })));
  await assertSucceeds(deleteDoc(doc(a, 'devices/alice')));
});
await t('남의 기기 문서는 읽기 · 쓰기 · 지우기 모두 안 됨', async () => {
  await assertSucceeds(setDoc(doc(db('alice'), 'devices/alice'), dev()));
  await assertFails(getDoc(doc(db('bob'), 'devices/alice')));
  await assertFails(setDoc(doc(db('bob'), 'devices/alice'), dev()));
  await assertFails(deleteDoc(doc(db('bob'), 'devices/alice')));
  await assertFails(getDoc(doc(db(null), 'devices/alice')));
});
await t('이상한 값은 거절 (짧은 token · 모르는 칸 · 가짜 시간)', async () => {
  const a = db('alice');
  await assertFails(setDoc(doc(a, 'devices/alice'), dev({ token: 'short' })));
  await assertFails(setDoc(doc(a, 'devices/alice'), dev({ extra: 1 })));
  await assertFails(setDoc(doc(a, 'devices/alice'), dev({ updatedAt: Timestamp.fromMillis(0) })));
  await assertFails(setDoc(doc(a, 'devices/alice'), dev({ on: 'yes' })));
});

await t('자는 시간(quiet) 숫자 목록은 허용, 너무 길거나 목록이 아니면 거절', async () => {
  const a = db('alice');
  await assertSucceeds(setDoc(doc(a, 'devices/alice'), dev({ quiet: [1760000000000, 1760018000000] })));
  await assertSucceeds(setDoc(doc(a, 'devices/alice'), dev({ quiet: [] })));
  await assertFails(setDoc(doc(a, 'devices/alice'), dev({ quiet: Array.from({ length: 61 }, (_, i) => 1760000000000 + i) })));
  await assertFails(setDoc(doc(a, 'devices/alice'), dev({ quiet: 'night' })));
});

// ───────── 내 가족방 번호 쪽지 (users) ─────────
await G('내 가족방 번호 쪽지 (users)');
await t('내 쪽지 쓰기 · 읽기 · 고치기 · 지우기', async () => {
  const a = db('alice');
  await assertSucceeds(setDoc(doc(a, 'users/alice'), { hid: H, updatedAt: serverTimestamp() }));
  await assertSucceeds(getDoc(doc(a, 'users/alice')));
  await assertSucceeds(setDoc(doc(a, 'users/alice'), { hid: 'other', updatedAt: serverTimestamp() }));
  await assertSucceeds(deleteDoc(doc(a, 'users/alice')));
});
await t('남의 쪽지는 읽기 · 쓰기 · 지우기 안 됨, 이상한 값도 거절', async () => {
  await assertSucceeds(setDoc(doc(db('alice'), 'users/alice'), { hid: H, updatedAt: serverTimestamp() }));
  await assertFails(getDoc(doc(db('bob'), 'users/alice')));
  await assertFails(setDoc(doc(db('bob'), 'users/alice'), { hid: H, updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(doc(db('bob'), 'users/alice')));
  await assertFails(setDoc(doc(db('alice'), 'users/alice'), { hid: H, updatedAt: serverTimestamp(), extra: 1 }));
  await assertFails(setDoc(doc(db('alice'), 'users/alice'), { hid: '', updatedAt: serverTimestamp() }));
  await assertFails(getDoc(doc(db(null), 'users/alice')));
});

// ───────── 서로 다른 가족방 ─────────
await G('다른 가족방 사이');
await t('A 가족방 구성원은 B 가족방을 읽을 수 없음', async () => {
  await env.clearFirestore(); await seedFamily(1); await seedGuest('g1');
  await env.withSecurityRulesDisabled(async (c) => {
    const d = c.firestore();
    await setDoc(doc(d, 'households', 'hostB'), { ownerUid: 'hostB', createdAt: Timestamp.now(), guestCount: 0 });
    await setDoc(doc(d, 'households', 'hostB', 'members', 'hostB'), { role: 'host', name: 'B', perm: 'write', joinedAt: Timestamp.now() });
  });
  await assertSucceeds(getDoc(doc(db('g1'), 'households', H)));
  await assertFails(getDoc(doc(db('g1'), 'households', 'hostB')));
  await assertFails(getDocs(collection(db('g1'), 'households', 'hostB', 'members')));
});

await env.cleanup();
console.log(`\n${pass}개 통과, ${fail}개 실패`);
process.exit(fail ? 1 : 0);

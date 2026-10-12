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

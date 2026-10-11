// Firestore 보안 규칙 시험 (에뮬레이터에서 실행: npm test)
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-eonjeswieo',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});
let pass = 0, fail = 0;
const t = async (name, fn) => {
  try { await fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✕', name, '\n     ', String(e.message || e).split('\n')[0]); }
};

const alice = env.authenticatedContext('alice').firestore();
const bob = env.authenticatedContext('bob').firestore();
const anon = env.unauthenticatedContext().firestore();
const good = () => ({ t: serverTimestamp(), v: '0.15', ua: 'test' });

await t('내 ping 문서 쓰기', () => assertSucceeds(setDoc(doc(alice, 'ping/alice'), good())));
await t('내 ping 문서 읽기', () => assertSucceeds(getDoc(doc(alice, 'ping/alice'))));
await t('내 ping 문서 다시 쓰기(고치기)', () => assertSucceeds(setDoc(doc(alice, 'ping/alice'), good())));
await t('내 ping 문서 지우기', () => assertSucceeds(deleteDoc(doc(alice, 'ping/alice'))));
await t('남의 ping 문서 쓰기 막힘', () => assertFails(setDoc(doc(bob, 'ping/alice'), good())));
await t('남의 ping 문서 읽기 막힘', () => assertFails(getDoc(doc(bob, 'ping/alice'))));
await t('로그인 안 하면 막힘', () => assertFails(setDoc(doc(anon, 'ping/alice'), good())));
await t('엉뚱한 필드 막힘', () => assertFails(setDoc(doc(alice, 'ping/alice'), { ...good(), admin: true })));
await t('시간이 서버 시간이 아니면 막힘', () => assertFails(setDoc(doc(alice, 'ping/alice'), { ...good(), t: new Date('2020-01-01') })));
await t('너무 긴 글 막힘', () => assertFails(setDoc(doc(alice, 'ping/alice'), { ...good(), ua: 'x'.repeat(300) })));
await t('ping 목록 훑어보기 막힘', () => assertFails(getDocs(collection(alice, 'ping'))));
await t('다른 컬렉션 쓰기 막힘', () => assertFails(setDoc(doc(alice, 'households/h1'), { name: 'x' })));
await t('다른 컬렉션 읽기 막힘', () => assertFails(getDoc(doc(alice, 'households/h1'))));
await t('초대 코드 훑어보기 막힘', () => assertFails(getDocs(collection(alice, 'invites'))));

await env.cleanup();
console.log(`\n${pass}개 통과, ${fail}개 실패`);
process.exit(fail ? 1 : 0);

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const N = createRequire(import.meta.url)('../lib/notify.js');
let n = 0; const ok = (name, f) => { f(); n++; console.log('  ✓', name); };

ok('받침 이/가', () => { assert.equal(N.iga('엄마'), '가'); assert.equal(N.iga('딸기'), '가'); assert.equal(N.iga('철수'), '가'); assert.equal(N.iga('민준'), '이'); });
const sch = { pattern: ['주', '야', '휴'], anchor: '2026-10-01', overrides: { '2026-10-05': '휴' } };
ok('근무 계산: 패턴/덮어쓰기', () => { assert.equal(N.shiftOn(sch, '2026-10-01'), '주'); assert.equal(N.shiftOn(sch, '2026-10-02'), '야'); assert.equal(N.shiftOn(sch, '2026-10-04'), '주'); assert.equal(N.shiftOn(sch, '2026-10-05'), '휴'); assert.equal(N.shiftOn(sch, '2026-09-30'), '휴'); });
ok('근무 변경 없음 → 알림 없음', () => assert.deepEqual(N.schedDiff(sch, { ...sch }, '2026-10-01'), []));
ok('덮어쓰기 한 날 → 1일 변경', () => { const a = { ...sch, overrides: { ...sch.overrides, '2026-10-10': '야' } }; const d = N.schedDiff(sch, a, '2026-10-01'); assert.equal(d.length, 1); assert.equal(d[0].k, '2026-10-10'); });
ok('패턴 바꾸면 여러 날 변경', () => { const d = N.schedDiff(sch, { ...sch, pattern: ['휴', '주', '야'] }, '2026-10-01'); assert.ok(d.length > 40); });
ok('지난 날짜 변경은 무시', () => { const a = { ...sch, overrides: { ...sch.overrides, '2026-09-10': '야' } }; assert.deepEqual(N.schedDiff(sch, a, '2026-10-01'), []); });
ok('근무 변경 알림: 본인 제외 · 내용 없음', () => {
  const m = N.onScheduleChanged('u1', sch, { ...sch, overrides: { ...sch.overrides, '2026-10-10': '야' } }, ['u1', 'u2', 'u3'], u => ({ u1: '엄마' }[u]), '2026-10-01', 'h');
  assert.equal(m.length, 1); assert.deepEqual(m[0].to, ['u2', 'u3']); assert.match(m[0].body, /엄마님이 10\/10 근무를 바꿨어요/);
});
const req = { from: 'u1', fromName: '엄마', to: 'u2', toName: '아빠', date: '2026-11-03', want: '휴', msg: '비밀메시지', cc: ['u3', 'u1'], st: 'pending', held: false };
ok('요청 도착: 받는 사람 + 알림만 받는 가족 · 메시지 내용 없음', () => {
  const m = N.onRequestCreated(req, 'h'); assert.equal(m.length, 2);
  assert.deepEqual(m[0].to, ['u2']); assert.deepEqual(m[1].to, ['u3']);
  assert.match(m[0].body, /엄마님이 11\/3 휴 요청했어요/); assert.ok(!JSON.stringify(m).includes('비밀메시지'));
});
ok('여러 날 묶음: lead 문서만 알림', () => {
  const g = { ...req, grp: 'g1', gn: 3, lead: false }; assert.deepEqual(N.onRequestCreated(g, 'h'), []);
  const m = N.onRequestCreated({ ...g, lead: true }, 'h'); assert.match(m[0].body, /3일/);
});
ok('답장 알림: 수락/거절/보류/취소', () => {
  assert.match(N.onRequestUpdated(req, { ...req, st: 'accepted' }, 'h')[0].body, /수락/);
  assert.match(N.onRequestUpdated(req, { ...req, st: 'rejected', reply: '비밀답장' }, 'h')[0].body, /거절/);
  assert.deepEqual(N.onRequestUpdated(req, { ...req, st: 'rejected' }, 'h')[0].to, ['u1']);
  assert.match(N.onRequestUpdated(req, { ...req, held: true }, 'h')[0].body, /보류/);
  const c = N.onRequestUpdated(req, { ...req, st: 'cancelled' }, 'h'); assert.deepEqual(c[0].to, ['u2']);
  assert.deepEqual(N.onRequestUpdated({ ...req, st: 'accepted' }, { ...req, st: 'applied' }, 'h'), []);
  assert.ok(!JSON.stringify(N.onRequestUpdated(req, { ...req, st: 'rejected', reply: '비밀답장' }, 'h')).includes('비밀답장'));
});
const memo = { by: 'u1', byName: '엄마', date: '2026-11-03', text: '비밀메모', rev: 0 };
ok('메모: 쓴 사람 제외 · 내용 없음', () => {
  const m = N.onMemoCreated(memo, ['u1', 'u2'], 'h'); assert.deepEqual(m[0].to, ['u2']); assert.ok(!JSON.stringify(m).includes('비밀메모'));
});
ok('메모 고침: rev 오를 때만', () => {
  assert.deepEqual(N.onMemoUpdated(memo, { ...memo, text: 'x' }, ['u1', 'u2'], 'h'), []);
  assert.match(N.onMemoUpdated(memo, { ...memo, rev: 1 }, ['u1', 'u2'], 'h')[0].body, /고쳤어요/);
});
ok('가족 참여: 방장에게', () => {
  assert.deepEqual(N.onMemberJoined({ role: 'guest', name: '딸' }, 'u3', 'u1', 'u1')[0].to, ['u1']);
  assert.deepEqual(N.onMemberJoined({ role: 'host', name: '아빠' }, 'u1', 'u1', 'u1'), []);
});
ok('자는 시간(quiet): 구간 안이면 true · 밖이면 false · 이상한 값은 false', () => {
  const q = [1000, 2000, 5000, 6000];
  assert.equal(N.inQuiet(q, 1500), true); assert.equal(N.inQuiet(q, 2000), false);
  assert.equal(N.inQuiet(q, 5000), true); assert.equal(N.inQuiet(q, 4000), false);
  assert.equal(N.inQuiet(undefined, 1500), false); assert.equal(N.inQuiet([1000], 1500), false); assert.equal(N.inQuiet('x', 1500), false);
});
console.log(`${n} passed`);

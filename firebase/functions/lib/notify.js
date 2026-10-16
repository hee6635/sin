'use strict';
// 푸시 알림 문구 · 받을 사람 계산 (순수 함수 — 서버 없이 시험 가능)
// 규칙: 메모 · 요청 메시지 내용은 알림에 절대 넣지 않음 (이름 · 날짜 · 종류만)

const pad = n => String(n).padStart(2, '0');
const md = k => (k && k.length === 10) ? `${+k.slice(5, 7)}/${+k.slice(8)}` : '';
// 받침 있으면 '이', 없으면 '가'
function iga(s) {
  const c = String(s || '').trim().slice(-1).charCodeAt(0);
  if (!(c >= 0xac00 && c <= 0xd7a3)) return '가';
  return (c - 0xac00) % 28 ? '이' : '가';
}
const nm = s => String(s || '가족').slice(0, 12);

// ───── 근무표에서 그 날의 근무 (앱의 schShift 와 같은 계산, 공휴일 쉼은 양쪽이 같아서 뺌)
function dayNum(y, m, d) { return Math.floor(Date.UTC(y, m - 1, d) / 86400000); }
function keyNum(k) { return dayNum(+k.slice(0, 4), +k.slice(5, 7), +k.slice(8, 10)); }
function numKey(n) { const d = new Date(n * 86400000); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
function shiftOn(sch, k) {
  if (!sch) return '';
  const o = sch.overrides && sch.overrides[k];
  if (o) return String(o);
  const p = Array.isArray(sch.pattern) ? sch.pattern : [];
  if (!p.length || !sch.anchor) return '';
  const n = p.length, i = (((keyNum(k) - keyNum(sch.anchor)) % n) + n) % n;
  return String(p[i] || '');
}
// 오늘부터 62일 사이에 바뀐 날짜 목록
function schedDiff(before, after, todayKey, days = 62) {
  if (!before || !after) return [];
  const t0 = keyNum(todayKey), out = [];
  for (let i = 0; i < days; i++) {
    const k = numKey(t0 + i), a = shiftOn(before, k), b = shiftOn(after, k);
    if (a !== b) out.push({ k, a, b });
  }
  return out;
}

// ───── 알림 만들기: { to:[uid…], title, body, data:{type,date} }
const WANT = w => String(w || '').slice(0, 4);

function onRequestCreated(r, hid) {
  // 여러 날 요청은 묶음의 첫 문서(lead)에서만 한 번 알림
  if (r.grp && r.lead !== true) return [];
  const n = r.grp && r.gn > 1 ? r.gn : 1;
  const what = n > 1 ? `${md(r.date)} 포함 ${n}일 ${WANT(r.want)}` : `${md(r.date)} ${WANT(r.want)}`;
  const out = [{ to: [r.to], title: '근무 요청', body: `${nm(r.fromName)}님이 ${what} 요청했어요`, data: { type: 'req', date: r.date || '', hid } }];
  const cc = (Array.isArray(r.cc) ? r.cc : []).filter(u => u !== r.to && u !== r.from);
  if (cc.length) out.push({ to: cc, title: '가족 알림', body: `${nm(r.fromName)}님이 ${nm(r.toName)}님에게 ${what} 요청했어요`, data: { type: 'cc', date: r.date || '', hid } });
  return out;
}

function onRequestUpdated(b, a, hid) {
  if (a.grp && a.lead !== true) return [];
  const n = a.grp && a.gn > 1 ? a.gn : 1;
  const when = n > 1 ? `${md(a.date)} 포함 ${n}일` : md(a.date);
  if (b.st !== a.st) {
    if (a.st === 'cancelled') return [{ to: [a.to], title: '요청 취소', body: `${nm(a.fromName)}님이 ${when} 요청을 취소했어요`, data: { type: 'req', date: a.date || '', hid } }];
    if (a.st === 'accepted') return [{ to: [a.from], title: '요청 답장', body: `${nm(a.toName)}님이 ${when} 요청을 수락했어요`, data: { type: 'reply', date: a.date || '', hid } }];
    if (a.st === 'rejected') return [{ to: [a.from], title: '요청 답장', body: `${nm(a.toName)}님이 ${when} 요청을 거절했어요`, data: { type: 'reply', date: a.date || '', hid } }];
    return [];   // pending(보류 풀기) · applied(수락 뒤 적용) 는 따로 알리지 않음
  }
  if (!b.held && a.held && a.st === 'pending') return [{ to: [a.from], title: '요청 답장', body: `${nm(a.toName)}님이 ${when} 요청을 보류했어요`, data: { type: 'reply', date: a.date || '', hid } }];
  return [];
}

// 받는 사람(m.to)이 있으면 그 사람만, 없으면(옛 메모) 가족 모두
const only = (m, uids) => (Array.isArray(m && m.to) ? uids.filter(u => m.to.includes(u)) : uids);
function onMemoCreated(m, memberUids, hid) {
  const to = only(m, memberUids).filter(u => u !== m.by);
  if (!to.length) return [];
  return [{ to, title: '가족 메모', body: `${nm(m.byName)}님이 ${md(m.date)}에 메모를 남겼어요`, data: { type: 'memo', date: m.date || '', hid } }];
}
function onMemoUpdated(b, a, memberUids, hid) {
  if (!((a.rev || 0) > (b.rev || 0))) return [];   // '고쳤다고 알리기'를 고른 때만
  const to = only(a, memberUids).filter(u => u !== a.by);
  if (!to.length) return [];
  return [{ to, title: '가족 메모', body: `${nm(a.byName)}님이 ${md(a.date)} 메모를 고쳤어요`, data: { type: 'memo', date: a.date || '', hid } }];
}

function onScheduleChanged(uid, before, after, memberUids, nameOf, todayKey, hid) {
  const ch = schedDiff(before, after, todayKey);
  if (!ch.length) return [];
  const who = nm(nameOf(uid));
  const text = ch.length === 1 ? `${who}님이 ${md(ch[0].k)} 근무를 바꿨어요`
    : ch.length === 2 ? `${who}님이 ${md(ch[0].k)} · ${md(ch[1].k)} 근무를 바꿨어요`
      : `${who}님이 근무 ${ch.length}일을 바꿨어요`;
  const to = memberUids.filter(u => u !== uid);
  if (!to.length) return [];
  return [{ to, title: '근무 변경', body: text, data: { type: 'sch', date: ch[0].k, hid, uid } }];
}

function onMemberJoined(m, uid, hostUid, hid) {
  if (!m || m.role !== 'guest' || uid === hostUid) return [];
  return [{ to: [hostUid], title: '가족 참여', body: `${nm(m.name)}님이 가족에 참여했어요`, data: { type: 'join', date: '', hid } }];
}

// 받는 사람이 지금 "자는 시간"인지: quiet = [시작ms, 끝ms, 시작ms, 끝ms …] (앱이 앞으로 2주치를 올려 둠)
function inQuiet(quiet, nowMs) {
  if (!Array.isArray(quiet)) return false;
  for (let i = 0; i + 1 < quiet.length; i += 2) {
    const a = Number(quiet[i]), b = Number(quiet[i + 1]);
    if (a <= nowMs && nowMs < b) return true;
  }
  return false;
}

module.exports = { inQuiet, iga, md, shiftOn, schedDiff, onRequestCreated, onRequestUpdated, onMemoCreated, onMemoUpdated, onScheduleChanged, onMemberJoined };

'use strict';
// 언제쉬어 푸시 알림 — 가족 메모 · 근무 요청 · 근무 변경 · 가족 참여가 생기면 가족 폰에 알림
// 알림 문구에는 메모/메시지 내용을 넣지 않습니다 (이름 · 날짜 · 종류만).
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const N = require('./lib/notify');

admin.initializeApp();
const db = admin.firestore();
const REGION = process.env.FN_REGION || 'asia-northeast3';   // Firestore 위치와 같아야 함 (설명서 참고)
const opt = path => ({ document: path, region: REGION });

const todayKey = () => {   // 한국 시간 기준 오늘
  const d = new Date(Date.now() + 9 * 3600000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

async function members(hid) {
  const s = await db.collection('households').doc(hid).collection('members').get();
  const names = {}, uids = [];
  s.forEach(d => { uids.push(d.id); names[d.id] = (d.data() || {}).name || ''; });
  return { uids, names };
}

// 기기 등록(devices/{uid}): { token, on, hid, quiet } — on 이 false 이거나 다른 가족방이면 보내지 않음, 자는 시간(quiet)이면 소리 없는 통로(family_quiet)로
async function tokensFor(uids, hid) {
  const out = [];
  await Promise.all([...new Set(uids)].map(async u => {
    const s = await db.collection('devices').doc(u).get();
    const v = s.exists ? s.data() : null;
    if (v && v.token && v.on !== false && v.hid === hid) out.push({ uid: u, token: v.token, quiet: N.inQuiet(v.quiet, Date.now()) });
  }));
  return out;
}

async function send(msgs, hid) {
  for (const m of msgs) {
    const toks = await tokensFor(m.to, hid);
    if (process.env.PUSH_TEST_LOG) {   // 시험용: 보내지 않고 기록
      await db.collection('__pushlog').add({ to: m.to, sentTo: toks.map(t => t.uid), quietTo: toks.filter(t => t.quiet).map(t => t.uid), title: m.title, body: m.body, data: m.data });
      continue;
    }
    if (!toks.length) continue;
    const res = await admin.messaging().sendEach(toks.map(t => ({
      token: t.token,
      notification: { title: m.title, body: m.body },
      data: Object.fromEntries(Object.entries(m.data).map(([k, v]) => [k, String(v)])),
      android: { priority: t.quiet ? 'normal' : 'high', collapseKey: m.data.type, notification: { channelId: t.quiet ? 'family_quiet' : 'family', tag: m.data.type + (m.data.date || '') } },
    })));
    await Promise.all(res.responses.map(async (r, i) => {   // 만료된 기기는 정리
      const c = r.error && r.error.code;
      if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token')
        await db.collection('devices').doc(toks[i].uid).delete().catch(() => {});
    }));
  }
}

const H = '/households/{hid}';

exports.onRequestCreated = onDocumentCreated(opt(`${H}/requests/{id}`), async ev => {
  const r = ev.data && ev.data.data(); if (!r) return;
  await send(N.onRequestCreated(r, ev.params.hid), ev.params.hid);
});
exports.onRequestUpdated = onDocumentUpdated(opt(`${H}/requests/{id}`), async ev => {
  await send(N.onRequestUpdated(ev.data.before.data(), ev.data.after.data(), ev.params.hid), ev.params.hid);
});
exports.onMemoCreated = onDocumentCreated(opt(`${H}/memos/{id}`), async ev => {
  const m = ev.data && ev.data.data(); if (!m) return;
  const { uids } = await members(ev.params.hid);
  await send(N.onMemoCreated(m, uids, ev.params.hid), ev.params.hid);
});
exports.onMemoUpdated = onDocumentUpdated(opt(`${H}/memos/{id}`), async ev => {
  const b = ev.data.before.data(), a = ev.data.after.data();
  if (!((a.rev || 0) > (b.rev || 0))) return;
  const { uids } = await members(ev.params.hid);
  await send(N.onMemoUpdated(b, a, uids, ev.params.hid), ev.params.hid);
});
exports.onScheduleUpdated = onDocumentUpdated(opt(`${H}/schedules/{uid}`), async ev => {
  const { hid, uid } = ev.params, b = ev.data.before.data(), a = ev.data.after.data();
  const { uids, names } = await members(hid);
  await send(N.onScheduleChanged(uid, b, a, uids, u => names[u], todayKey(), hid), hid);
});
// 가족방(households/{hid})이 지워지면 안에 남은 메모 · 요청 · 근무표도 같이 지움 (받는 사람을 고른 메모는 호스트도 못 읽어서 앱이 못 지움)
exports.onHouseholdDeleted = onDocumentDeleted(opt(H), async ev => {
  await db.recursiveDelete(db.collection('households').doc(ev.params.hid));
});
exports.onMemberCreated = onDocumentCreated(opt(`${H}/members/{uid}`), async ev => {
  const m = ev.data && ev.data.data(); if (!m) return;
  await send(N.onMemberJoined(m, ev.params.uid, ev.params.hid, ev.params.hid), ev.params.hid);
});

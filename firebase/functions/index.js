'use strict';
// 언제쉬어 푸시 알림 — 가족 메모 · 근무 요청 · 근무 변경 · 가족 참여가 생기면 가족 폰에 알림
// 알림 문구에는 메모/메시지 내용을 넣지 않습니다 (이름 · 날짜 · 종류만).
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted, onDocumentWritten } = require('firebase-functions/v2/firestore');
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
async function tokensFor(uids, hid, type) {
  const out = [];
  await Promise.all([...new Set(uids)].map(async u => {
    const s = await db.collection('devices').doc(u).get();
    const v = s.exists ? s.data() : null;
    if (v && v.token && v.on !== false && v.hid === hid && !(Array.isArray(v.mute) && v.mute.includes(type))) out.push({ uid: u, token: v.token, quiet: N.inQuiet(v.quiet, Date.now()) });
  }));
  return out;
}

async function send(msgs, hid) {
  for (const m of msgs) {
    const toks = await tokensFor(m.to, hid, m.data.type);   // mute: 그 종류 알림을 끈 기기 (예: 포스트잇)
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
  const { uids } = await members(ev.params.hid);
  await send(N.onMemberJoined(m, ev.params.uid, uids, ev.params.hid), ev.params.hid);
});
// 가족 포스트잇: 새로 붙임 · 줄 추가 · 다 끝남
exports.onBoardWritten = onDocumentWritten(opt(`${H}/board/{id}`), async ev => {
  const b = ev.data.before.exists ? ev.data.before.data() : null, a = ev.data.after.exists ? ev.data.after.data() : null;
  if (!a) return;
  const { uids, names } = await members(ev.params.hid);
  await send(N.onBoardWritten(b, a, uids, u => names[u], ev.params.hid, Date.now()), ev.params.hid);
});
// 내보내기 제안(다수결)
exports.onKickCreated = onDocumentCreated(opt(`${H}/kicks/{uid}`), async ev => {
  const k = ev.data && ev.data.data(); if (!k) return;
  const { uids, names } = await members(ev.params.hid);
  await send(N.onKickCreated(k, ev.params.uid, uids, u => names[u], ev.params.hid), ev.params.hid);
});
// 가족방에서 사람이 빠지면(나가기 · 내보내기): 남은 메모 · 요청 · 근무표 · 옮긴 옛 메모 · 내보내기 표를 정리 (남이 쓴 메모는 앱이 못 읽어서 서버가 지움)
// 다른 사람이 내보냈으면 그 사람 폰에 한 번 알림
exports.onMemberDeleted = onDocumentDeleted(opt(`${H}/members/{uid}`), async ev => {
  const { hid, uid } = ev.params, hh = db.collection('households').doc(hid);
  const hs = await hh.get();
  if (hs.exists) await send(N.onMemberRemoved(uid, hs.data(), hid), hid);
  if (!hs.exists) return;   // 가족방이 통째로 지워지는 중이면 onHouseholdDeleted 가 정리
  const again = await hh.collection('members').doc(uid).get();
  if (again.exists) return;   // 그 사이 다시 들어왔으면 그대로
  const refs = [];
  const add = async q => { (await q.get()).forEach(d => refs.push(d.ref)); };
  await add(hh.collection('memos').where('by', '==', uid));
  await add(hh.collection('requests').where('from', '==', uid));
  await add(hh.collection('requests').where('to', '==', uid));
  refs.push(hh.collection('schedules').doc(uid), hh.collection('kicks').doc(uid));
  for (const id of [uid, uid + '_2', uid + '_3']) refs.push(hh.collection('archive').doc(id));
  for (let i = 0; i < refs.length; i += 400) { const b = db.batch(); refs.slice(i, i + 400).forEach(r => b.delete(r)); await b.commit(); }
});

// ───────── 출퇴근 날씨 (기상청 단기 · 중기예보 + 에어코리아 미세먼지) ─────────
// 키: Cloud Shell 에서 한 번  npx firebase-tools functions:secrets:set DATA_KEY  (공공데이터포털 일반 인증키)
// 앱은 지역 번호(시 · 군 · 구)만 보냄 — 위치(GPS) · 사람 정보 없음. 받아 온 예보는 wxCache 에 지역별로 저장 (앱에서는 못 읽음, 서버만)
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const WXS = require('./lib/wx');
const DATA_KEY = defineSecret('DATA_KEY');
const wxMem = new Map();   // 같은 함수 인스턴스 안에서는 저장소를 다시 안 읽음
exports.wx = onRequest({ region: REGION, secrets: [DATA_KEY], cors: true, invoker: 'public', maxInstances: 5, memory: '256MiB', timeoutSeconds: 30 }, async (req, res) => {
  if (req.method !== 'GET') { res.status(405).send(''); return; }
  const cache = {
    async get(id) { const m = wxMem.get(id); if (m) return m; const s = await db.collection('wxCache').doc(id).get(); return s.exists ? s.data() : null; },
    async set(id, v) { wxMem.set(id, v); await db.collection('wxCache').doc(id).set(v); }
  };
  try {
    const out = await WXS.handle({ key: DATA_KEY.value(), fetch, now: Date.now(), cache, log: (id, m) => console.warn('wx', id, m) }, req.query || {});
    res.set('Cache-Control', 'public, max-age=300');
    res.status(out.status).json(out.body);
  } catch (e) {
    console.error('wx', e);
    res.status(500).json({ error: 'server' });
  }
});

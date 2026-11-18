'use strict';
// 구글 예전 연결 풀기: "이 구글 계정은 이미 다른 기기에 연결돼 있어요"일 때
// 1) 부른 사람(지금 폰 익명 로그인) 확인  2) 구글 로그인 토큰으로 본인 구글 계정인지 확인
// 3) 그 구글이 붙은 예전 번호에서 구글만 떼기 (예전 번호 · 데이터는 지우지 않음)
// 예전 번호가 아직 가족방에 들어가 있으면 바로 떼지 않고 알려 줌 (앱에서 묻고 force 로 다시)
// deps: { verifyFb(token)→{uid}, tokenInfo(idToken)→{aud,sub,email,email_verified}|null, userByGoogle(sub)→{uid}|null,
//         userByEmail(email)→{uid,email}|null, roomOf(uid)→{hid,name,role}|null, unlink(uid, email), projectNumber }
// 예전 번호는 구글이 붙은 곳(sub)과 같은 이메일을 가진 곳 둘 다 봄 (이메일만 남아 있어도 auth/email-already-in-use 가 남)
async function handle(deps, { fbToken, gToken, force }) {
  if (!fbToken || !gToken || typeof fbToken !== 'string' || typeof gToken !== 'string') return { status: 400, body: { err: 'bad' } };
  let me;
  try { me = await deps.verifyFb(fbToken); } catch (e) { return { status: 401, body: { err: 'auth' } }; }
  const g = await deps.tokenInfo(gToken).catch(() => null);
  if (!g || !g.sub || !String(g.aud || '').startsWith(deps.projectNumber + '-') || String(g.email_verified) !== 'true') return { status: 403, body: { err: 'google' } };
  const olds = [];
  for (const u of [await deps.userByGoogle(g.sub), g.email ? await deps.userByEmail(String(g.email)) : null])
    if (u && u.uid !== me.uid && !olds.some(o => o.uid === u.uid)) olds.push(u);
  if (!olds.length) return { status: 200, body: { ok: true, none: true } };
  if (!force) for (const o of olds) {
    const room = await deps.roomOf(o.uid);
    if (room) return { status: 200, body: { busy: true, name: room.name || '', role: room.role || '' } };
  }
  for (const o of olds) await deps.unlink(o.uid, String(g.email || ''));
  return { status: 200, body: { ok: true } };
}
module.exports = { handle };

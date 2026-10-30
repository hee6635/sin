// 출퇴근 날씨 서버 시험 — 기상청 · 에어코리아 응답을 가짜로 만들어 넣음 (인터넷 · 키 없이)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const req = createRequire(import.meta.url);
const W = req('../lib/wx.js'), C = req('../lib/wxcore.js'), REG = req('../lib/wxRegions.json');
let n = 0; const ok = async (name, f) => { await f(); n++; console.log('  ✓', name); };

const KST = (y, mo, d, h, mi = 0) => Date.UTC(y, mo - 1, d, h - 9, mi);
const NOW = KST(2026, 10, 30, 5, 50);   // 10/30 새벽 5:50

// 가짜 단기예보: 10/30 00시 ~ 11/2 23시 매시 · 출근(07시) 6° 흐림, 퇴근(19시) 12° 비 70% 3mm
function shortItems() {
  const out = [];
  for (let d = 0; d < 4; d++) for (let h = 0; h < 24; h++) {
    const dt = new Date(Date.UTC(2026, 9, 30 + d)), fd = `${dt.getUTCFullYear()}${String(dt.getUTCMonth() + 1).padStart(2, '0')}${String(dt.getUTCDate()).padStart(2, '0')}`, ft = String(h).padStart(2, '0') + '00';
    const rain = d === 0 && h >= 17 && h <= 21;
    const tmp = d === 0 ? (h <= 8 ? 6 : h <= 18 ? 6 + (h - 8) : 12) : 10;
    const push = (c, v) => out.push({ category: c, fcstDate: fd, fcstTime: ft, fcstValue: String(v) });
    push('TMP', tmp); push('POP', rain ? 70 : 10); push('PTY', rain ? 1 : 0); push('SKY', d === 0 ? 4 : 1); push('PCP', rain ? '3.0mm' : '강수없음'); push('WSD', 2.1); push('REH', 60);
    if (h === 6) push('TMN', d === 0 ? 5 : 6); if (h === 15) push('TMX', d === 0 ? 16 : 14);
  }
  return out;
}
const wrap = (list, total) => JSON.stringify({ response: { header: { resultCode: '00', resultMsg: 'NORMAL_SERVICE' }, body: { items: { item: list }, totalCount: total ?? list.length } } });
const land = { regId: '11B00000', wf4Am: '맑음', wf4Pm: '흐리고 비', rnSt4Am: 10, rnSt4Pm: 60, wf5Am: '맑음', wf5Pm: '흐리고 비', rnSt5Am: 10, rnSt5Pm: 60, wf8: '구름많음', rnSt8: 30, wf10: '맑음', rnSt10: 0 };
const ta = { regId: '11B20601', taMin4: 4, taMax4: 15, taMin5: 4, taMax5: 15, taMin8: 2, taMax8: 13, taMin10: 1, taMax10: 12 };
const airFc = c => [
  { informCode: c, informData: '2026-10-30', dataTime: '2026-10-29 17시 발표', informGrade: '서울 : 보통,경기남부 : ' + (c === 'PM10' ? '나쁨' : '보통') + ',경기북부 : 좋음,광주 : 좋음,전남광주 : 좋음' },
  { informCode: c, informData: '2026-10-30', dataTime: '2026-10-29 11시 발표', informGrade: '서울 : 좋음,경기남부 : 좋음' },
  { informCode: c, informData: '2026-10-31', dataTime: '2026-10-29 17시 발표', informGrade: '서울 : 좋음,경기남부 : 좋음' }
];
const rt = [{ stationName: '인계동', pm10Value: '90', pm25Value: '40', dataTime: '2026-10-30 05:00' }, { stationName: '광교동', pm10Value: '70', pm25Value: '-', dataTime: '2026-10-30 05:00' }];

function deps(over = {}) {
  const calls = [], store = new Map();
  const fetch = async url => {
    calls.push(url);
    const body = over.body ? over.body(url) : null;
    if (body) return { ok: true, status: 200, text: async () => body };
    if (/getVilageFcst/.test(url)) {
      const all = shortItems(), page = +url.match(/pageNo=(\d+)/)[1];
      return { ok: true, status: 200, text: async () => wrap(all.slice((page - 1) * 1000, page * 1000), all.length) };
    }
    if (/getMidLandFcst/.test(url)) return { ok: true, status: 200, text: async () => wrap([land]) };
    if (/getMidTa/.test(url)) return { ok: true, status: 200, text: async () => wrap([ta]) };
    if (/getMinuDustFrcstDspth/.test(url)) return { ok: true, status: 200, text: async () => wrap(airFc(url.match(/InformCode=(\w+)/)[1])) };
    if (/getCtprvnRltmMesureDnsty/.test(url)) return { ok: true, status: 200, text: async () => wrap(rt) };
    return { ok: false, status: 404, text: async () => '' };
  };
  return { key: 'abc+def/==', fetch, now: NOW, calls, store, cache: { async get(id) { return store.get(id) || null; }, async set(id, v) { store.set(id, v); } }, ...over.d };
}

await ok('지역표: 256곳 · 번호 겹침 없음 · 격자 범위 · 구역 번호 모양', () => {
  assert.ok(REG.length >= 250);
  assert.equal(new Set(REG.map(r => r[0])).size, REG.length);
  for (const r of REG) {
    assert.match(r[0], /^\d{5}$/); assert.ok(r[3] >= 1 && r[3] <= 149 && r[4] >= 1 && r[4] <= 253, r.join());
    assert.match(r[5], /^11[A-H]\d0000$/); assert.match(r[6], /^(11|21)[A-H]\d{5}$/); assert.ok(r[7]);
  }
  const g = c => REG.find(r => r[0] === c);
  assert.deepEqual(g('11110').slice(3, 5), [60, 127]);   // 종로구 (기상청 격자표와 같음)
  assert.deepEqual(g('50110').slice(3, 5), [53, 38]);    // 제주시
  assert.equal(g('51150')[5], '11D20000');               // 강릉 = 강원영동
  assert.equal(g('51110')[5], '11D10000');               // 춘천 = 강원영서
});
await ok('앱 안 지역표(WX_REG)가 서버 지역표와 같음', () => {
  const html = readFileSync(new URL('../../../app/src/main/assets/index.html', import.meta.url), 'utf8');
  const m = html.match(/const WX_REG=(\[.*?\]);/s); assert.ok(m, 'WX_REG 없음');
  const app = JSON.parse(m[1]);
  assert.deepEqual(app, REG.map(r => [r[0], r[1], r[2]]));
});
await ok('앱 안 날씨 계산(WXCORE)이 서버 파일과 똑같음', () => {
  const html = readFileSync(new URL('../../../app/src/main/assets/index.html', import.meta.url), 'utf8');
  const m = html.match(/<script>\/\*WXCORE\*\/\n([\s\S]*?)\n<\/script>/); assert.ok(m, 'WXCORE 블록 없음');
  assert.equal(m[1], readFileSync(new URL('../lib/wxcore.js', import.meta.url), 'utf8').trimEnd());
});
await ok('발표 시각 계산 (한국 시간)', () => {
  assert.equal(W.shortBase(KST(2026, 10, 30, 5, 50)), '202610300500');
  assert.equal(W.shortBase(KST(2026, 10, 30, 5, 10)), '202610300200');   // 5:10 은 아직 5시 발표 전
  assert.equal(W.shortBase(KST(2026, 10, 30, 1, 0)), '202610292300');    // 새벽 1시 = 어제 23시 발표
  assert.equal(W.midBase(KST(2026, 10, 30, 5, 50)), '202610291800');
  assert.equal(W.midBase(KST(2026, 10, 30, 7, 0)), '202610300600');
  assert.equal(W.airBase(KST(2026, 10, 30, 5, 50)), '2026103005');
  assert.equal(W.airBase(KST(2026, 10, 30, 4, 0)), '2026102923');
});
await ok('강수량 글자 → mm', () => {
  assert.equal(W.pcpMm('강수없음'), 0); assert.equal(W.pcpMm('1mm 미만'), 0.5); assert.equal(W.pcpMm('3.0mm'), 3); assert.equal(W.pcpMm('30.0~50.0mm'), 30); assert.equal(W.pcpMm('50.0mm 이상'), 50);
});
await ok('키: 일반 인증키는 주소용으로 바꿈 · 이미 바뀐 키는 그대로', () => {
  assert.equal(W.keyParam('ab+c/='), 'ab%2Bc%2F%3D'); assert.equal(W.keyParam('ab%2Bc'), 'ab%2Bc');
});
await ok('지역 자료: 단기(두 쪽) · 중기 · 미세먼지 예보 · 지금 값', async () => {
  const d = deps(), r = await W.regionData(d, '41111');   // 수원시 장안구
  assert.equal(r.r, '41111'); assert.equal(r.n, '수원시 장안구');
  assert.deepEqual(r.s.h['2026103007'].slice(0, 4), [6, 10, 0, 4]);
  assert.deepEqual(r.s.h['2026103019'].slice(0, 5), [12, 70, 1, 4, 3]);
  assert.deepEqual(r.s.n['20261030'], [5, 16]);
  assert.ok(Object.keys(r.s.h).length === 96, '96칸: ' + Object.keys(r.s.h).length);   // 1000줄씩 두 쪽을 다 받음
  assert.deepEqual(r.m.d['20261102'], ['맑음', 10, '흐리고 비', 60, 4, 15]);   // 10/29 18시 발표 + 4일
  assert.deepEqual(r.m.d['20261106'], ['구름많음', 30, '구름많음', 30, 2, 13]);   // 8일 뒤 = 하루 한 값
  assert.deepEqual(r.a.d['20261030'], [3, 2]);   // 경기남부 · 가장 최근(17시) 발표
  assert.deepEqual(r.q, { t: '2026-10-30 05:00', p10: 80, p25: 40, w: '경기', b: '2026103005' });
  assert.ok(!r.e);
  assert.ok(d.calls.every(u => u.includes('serviceKey=abc%2Bdef%2F%3D%3D')));
});
await ok('같은 발표면 다시 안 받음 (저장해 둔 것) · 발표가 바뀌면 다시 받음', async () => {
  const d = deps(); await W.regionData(d, '41111'); const c1 = d.calls.length;
  await W.regionData(d, '41111'); assert.equal(d.calls.length, c1, '같은 발표 = 0번');
  d.now = KST(2026, 10, 30, 8, 20); await W.regionData(d, '41111');
  assert.ok(d.calls.length > c1, '8시 발표 뒤 다시 받음');
});
await ok('기상청이 실패하면 저장해 둔 옛 값 + 이유(e) · 키 오류 글자 알아봄', async () => {
  const d = deps(); await W.regionData(d, '11110');
  d.now = KST(2026, 10, 30, 8, 20);
  d.fetch = async () => ({ ok: true, status: 200, text: async () => '<OpenAPI_ServiceResponse><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg></OpenAPI_ServiceResponse>' });
  const r = await W.regionData(d, '11110');
  assert.ok(r.s && r.s.h['2026103007'], '옛 단기예보');
  assert.equal(r.e.s, 'KEY 등록 안 됨');
  const d2 = deps(); d2.fetch = d.fetch; const r2 = await W.regionData(d2, '11110');
  assert.equal(r2.s, null); assert.equal(r2.e.s, 'KEY 등록 안 됨');
  W._resetFail();   // 다음 시험에 '최근 실패' 기록이 안 남게
});
await ok('요청: ?r= 지역 · 모르는 지역은 400 · 여러 지역', async () => {
  const d = deps();
  assert.equal((await W.handle(d, { r: '99999' })).status, 400);
  const a = await W.handle(d, { r: '41111' }); assert.equal(a.status, 200); assert.equal(a.body.r, '41111');
  const b = await W.handle(d, { r: '41111,11110' }); assert.equal(b.body.list.length, 2);
});
await ok('출퇴근 문구: 퇴근길 비 → 우산 · 수치 · 미세먼지 줄', async () => {
  const d = deps();
  const o = await W.handle(d, { h: '41111', w: '41597', s: '202610300700', e: '202610301900' });
  const c = o.body;
  assert.equal(c.i, '☔'); assert.equal(c.h, '퇴근길 비 와요 · 우산 챙겨요'); assert.equal(c.t, '출근 6° · 퇴근 12°');
  assert.equal(c.r[0].l, '출근 07:00'); assert.equal(c.r[0].p, '집 · 수원시 장안구'); assert.equal(c.r[0].d, '흐림');
  assert.equal(c.r[1].p, '직장 · 화성시 동탄구'); assert.equal(c.r[1].pop, 70); assert.equal(c.r[1].pcp, 3); assert.equal(c.r[1].tag, '우산');
  assert.equal(c.a, '😷 미세먼지 상당히 나쁨 · KF94 마스크 써요');   // 지금 값 8단계
  assert.equal(c.an, '미세먼지 80㎍/㎥ (상당히 나쁨)\n초미세먼지 40㎍/㎥ (상당히 나쁨)\n지금 · 경기 평균 · 오늘 예보 나쁨');
});
await ok('출퇴근 문구 규칙: 미세먼지 나쁨 · 기온차 · 추움 · 더움 · 맑음', () => {
  const mk = (s, e, air) => ({ s: { b: '202610300500', h: { '2026103007': s, '2026103019': e } }, a: air ? { d: { '20261030': air } } : null });
  const o = { s: KST(2026, 10, 30, 7), e: KST(2026, 10, 30, 19), now: NOW };
  assert.equal(C.commute(mk([5, 0, 0, 1], [8, 0, 0, 1], [3, 1]), null, o).h, '미세먼지 나쁨 · KF80 마스크 챙겨요');
  assert.equal(C.commute(mk([5, 0, 0, 1], [8, 0, 0, 1], [4, 2]), null, o).i, '😫');
  assert.equal(C.commute(mk([2, 0, 0, 1], [14, 0, 0, 3]), null, o).h, '기온차가 커요, 외투 챙겨요');
  assert.equal(C.commute(mk([-3, 0, 0, 1], [1, 0, 0, 1]), null, o).h, '많이 추워요 · 따뜻하게 입어요');
  assert.equal(C.commute(mk([26, 0, 0, 1], [33, 0, 0, 1]), null, o).h, '오늘 더워요 · 물 챙겨요');
  assert.equal(C.commute(mk([12, 0, 0, 1], [15, 0, 0, 1], [1, 1]), null, o).h, '출퇴근길 맑아요');
  assert.equal(C.commute(mk([12, 0, 0, 1], [15, 0, 0, 1], [1, 1]), null, o).a, '🙂 미세먼지 좋음 · 마스크 필요 없어요');
  assert.equal(C.commute(mk([12, 30, 3, 4], [-1, 80, 3, 4]), null, o).h, '출퇴근길 눈 와요 · 미끄럼 조심해요');
  assert.equal(C.commute({ s: { h: {} } }, null, o), null);
});
await ok('야간: 퇴근이 다음 날 아침 (다음 날 칸에서 찾음)', () => {
  const raw = { s: { h: { '2026103019': [10, 0, 0, 1], '2026103107': [3, 80, 1, 4] } } };
  const c = C.commute(raw, null, { s: KST(2026, 10, 30, 19), e: KST(2026, 10, 31, 7), now: NOW });
  assert.equal(c.h, '퇴근길 비 와요 · 우산 챙겨요'); assert.equal(c.t, '출근 10° · 퇴근 3°');
});
await ok('하루 요약: 3일 안은 단기 · 그 뒤는 중기 · 쉬는 날 문구', async () => {
  const d = deps(), r = await W.regionData(d, '41111');
  const a = C.day(r, '20261030'); assert.equal(a.src, 's'); assert.equal(a.lo, 5); assert.equal(a.hi, 16); assert.equal(a.i, '☔');
  const b = C.day(r, '20261103');   // 단기예보가 없는 날 → 중기 assert.equal(b.src, 'm'); assert.equal(b.am.i, '☀️'); assert.equal(b.pm.i, '☔'); assert.equal(b.pop, 60); assert.equal(b.lo, 4);
  assert.equal(C.day(r, '20261120'), null);
  const o = await W.handle(d, { h: '41111', d: '20261031' }); assert.equal(o.body.h, '맑은 날이에요'); assert.equal(o.body.t, '6° ~ 14°');
});
await ok('가족 카드 한 칸: 출퇴근 앞뒤 2시간 안에만', () => {
  const raw = { s: { h: { '2026103007': [6, 10, 0, 4], '2026103019': [12, 70, 1, 4] } } };
  const o = n => ({ s: KST(2026, 10, 30, 7), e: KST(2026, 10, 30, 19), now: n });
  assert.equal(C.brief(raw, null, o(KST(2026, 10, 30, 12))), null);
  assert.deepEqual(C.brief(raw, null, o(KST(2026, 10, 30, 6))).t, '출근 6°');
  const e = C.brief(raw, null, o(KST(2026, 10, 30, 18, 10))); assert.equal(e.t, '퇴근 12° 비'); assert.equal(e.i, '☔');
});
await ok('동(10자리): 격자는 그 동 · 구역은 시·군·구 · 이름 · 동 목록', async () => {
  const D = req('../lib/wxDongs.json');
  assert.ok(Object.values(D).reduce((n, l) => n + l.length, 0) > 3000);
  for (const [sgg, l] of Object.entries(D)) { assert.ok(W.region(sgg), sgg); for (const x of l) { assert.match(x[0], /^\d{10}$/); assert.equal(x[0].slice(0, 5), sgg); assert.ok(x[2] >= 1 && x[2] <= 149 && x[3] >= 1 && x[3] <= 253, x.join()); } }
  const hc = D['51720'].find(x => x[1] === '내면'), r = W.region(hc[0]);   // 홍천군 내면 (산골) — 군 대표 칸과 다름
  assert.equal(r.n, '홍천군 내면'); assert.equal(r.dn, '내면'); assert.deepEqual([r.nx, r.ny], [hc[2], hc[3]]); assert.equal(r.land, '11D10000');
  assert.notDeepEqual([r.nx, r.ny], [W.region('51720').nx, W.region('51720').ny]);
  assert.equal(W.region('5172099999'), null); assert.equal(W.region('9999912345'), null); assert.equal(W.region('41111x'), null);
  const l = await W.handle(deps(), { dongs: '41111' }); assert.equal(l.status, 200); assert.ok(l.body.list.some(x => x[1] === '연무동')); assert.equal(l.cache, 86400);
  assert.equal((await W.handle(deps(), { dongs: '99999' })).status, 400);
  const yd = D['41111'].find(x => x[1] === '연무동');
  const a = await W.handle(deps(), { r: yd[0] }); assert.equal(a.status, 200); assert.equal(a.body.r, yd[0]); assert.equal(a.body.n, '수원시 장안구 연무동');
  const c = await W.handle(deps(), { h: yd[0], w: '41597', s: '202610300700', e: '202610301900' }); assert.equal(c.body.r[0].p, '집 · 연무동'); assert.equal(c.body.r[1].p, '직장 · 화성시 동탄구');
});
await ok('옷차림: 체감온도(바람) · 비 · 눈 · 바람 · 기온차 · 더위', () => {
  const v = (tp, ws = 1, pty = 0, pop = 0, pcp = 0) => ({ tp, ws, pty, pop, pcp, sky: 1 });
  assert.equal(C.feel(15, 9), 15); assert.equal(C.feel(5, 1), 5); assert.ok(C.feel(-3, 8) <= -9);   // 10° 넘으면 기온 그대로 · 바람 세면 더 춥게
  const a = C.outfit([v(6, 2), v(12, 2, 1, 70, 3)]); assert.equal(a.o, '👕 코트 · 히트텍'); assert.match(a.ox, /체감 6°~12°/);   // 약한 바람(2m/s)은 기온 그대로 assert.match(a.ox, /큰 우산 · 젖어도 되는 신발/);
  assert.equal(C.outfit([v(-3, 8), v(1, 3)]).o, '👕 두꺼운 패딩 · 목도리 · 장갑');
  assert.match(C.outfit([v(10, 8, 1, 80)]).ox, /우산이 뒤집힐 수 있어요/);
  assert.match(C.outfit([v(15, 9)]).ox, /바람 막는 겉옷/);
  assert.match(C.outfit([v(2, 1, 3, 90)]).ox, /미끄럽지 않은 신발/);
  assert.match(C.outfit([v(3), v(13)]).ox, /겹쳐 입기/);
  assert.equal(C.outfit([v(26), v(32)]).o, '👕 반팔 · 얇은 셔츠'); assert.match(C.outfit([v(26), v(32)]).ox, /물 · 통풍/);
  assert.equal(C.outfit([v(29)]).o, '👕 반팔 · 민소매 · 반바지'); assert.equal(C.outfit([v(18)]).o, '👕 얇은 니트 · 맨투맨');
  assert.equal(C.outfit([null]), null);
});
await ok('미세먼지 8단계 (지금 값) · 마스크 안내 · 예보는 4단계', () => {
  const now = NOW, dk = C.keyD(now), L = (p10, p25) => C.airLine(C.air({ q: { p10, p25 } }, dk, now));
  assert.equal(L(10, 5), '😆 미세먼지 최고 · 마스크 필요 없어요 · 환기하기 좋아요');
  assert.equal(L(36, 13), '🙂 미세먼지 양호 · 마스크 없어도 괜찮아요');
  assert.equal(L(42, 18), '😐 미세먼지 보통 · 민감하면 마스크 챙겨요');
  assert.equal(L(60, 30), '😷 미세먼지 나쁨 · KF80 마스크 챙겨요');
  assert.equal(L(120, 10), '😫 미세먼지 매우 나쁨 · KF94 마스크 꼭 · 밖에 오래 있지 마세요');   // 둘 중 나쁜 쪽
  assert.equal(L(200, 90), '☠️ 미세먼지 최악 · KF94 마스크 꼭 · 바깥 활동은 줄여요');
  assert.equal(C.airLine(C.air({ a: { d: { [dk]: [4, 1] } } }, dk, null)), '😫 미세먼지 매우 나쁨 · KF94 마스크 꼭');
  assert.equal(C.airLine(C.air({ a: { d: { [dk]: [3, 1] } }, q: { p10: 20, p25: 5 } }, dk, now)), '🙂 미세먼지 좋음 · 마스크 필요 없어요');   // 지금 측정값이 있으면 지금 값 (예보는 따로)
});
await ok('출퇴근 문구 · 쉬는 날 문구에 옷차림 줄', async () => {
  const d = deps();
  const c = (await W.handle(d, { h: '41111', w: '41597', s: '202610300700', e: '202610301900' })).body;
  assert.equal(c.o, '👕 코트 · 히트텍'); assert.match(c.ox, /우산/);
  const y = (await W.handle(d, { h: '41111', d: '20261031' })).body; assert.ok(y.o && y.o.startsWith('👕'));
});
await ok('미세먼지 가까운 측정소: 동 → TM → 측정소 → 지금 값 (점검이면 다음 측정소) · 못 찾으면 시·도 평균', async () => {
  W._resetFail();
  const body = url => {
    if (/getTMStdrCrdnt/.test(url)) return wrap([{ sidoName: '경기도', sggName: '수원시 장안구', umdName: '연무동', tmX: '201000.1', tmY: '421000.2' }, { sidoName: '경상남도', sggName: '고성군', umdName: '연무동', tmX: '1', tmY: '2' }]);
    if (/getNearbyMsrstnList/.test(url)) { assert.match(url, /tmX=201000\.1/); return wrap([{ stationName: '연무동', tm: 0.4 }, { stationName: '광교동', tm: 2.1 }]); }
    if (/getMsrstnAcctoRltmMesureDnsty/.test(url)) return /stationName=%EC%97%B0%EB%AC%B4/.test(url) ? wrap([{ dataTime: '2026-10-30 05:00', pm10Value: '-', pm25Value: '-' }]) : wrap([{ dataTime: '2026-10-30 05:00', pm10Value: '55', pm25Value: '28' }]);
    return null;
  };
  const D = req('../lib/wxDongs.json'), yd = D['41111'].find(x => x[1] === '연무동')[0];
  const r = await W.regionData(deps({ body }), yd);
  assert.deepEqual([r.q.st, r.q.p10, r.q.p25], ['광교동', 55, 28]);   // 연무동 측정소가 점검 중(-) → 다음 측정소
  const c = C.commute(r, null, { s: KST(2026, 10, 30, 7), e: KST(2026, 10, 30, 19), now: NOW });
  assert.match(c.an, /지금 · 광교동 측정소/);
  W._resetFail();
  const r2 = await W.regionData(deps(), '41111'); assert.equal(r2.q.w, '경기'); assert.ok(!r2.q.st);   // 측정소 서비스가 안 되면 시·도 평균
});
await ok('지난 날짜 관측 (ASOS): 가까운 관측소 · 어제까지 · 관측 없으면 다음 관측소 · 한 줄 문구', async () => {
  W._resetFail();
  const asked = [];
  const body = url => {
    if (!/getWthrDataList/.test(url)) return null;
    const st = url.match(/stnIds=(\d+)/)[1]; asked.push(st);
    if (st === '119') return wrap([]);   // 수원 관측소 자료 없음 → 다음
    assert.match(url, /startDt=20261001/); assert.match(url, /endDt=20261029/);   // 오늘(10/30) 전날까지
    return wrap([{ tm: '2026-10-28', minTa: '6.2', maxTa: '12.4', sumRn: '8.5', ddMes: '' }, { tm: '2026-10-29', minTa: '3', maxTa: '15', sumRn: '', ddMes: '' }]);
  };
  const v = await W.pastData(deps({ body }), '41111', '202610');
  assert.equal(asked[0], '119'); assert.equal(v.st, '서울'); assert.deepEqual(v.d['20261028'], [6, 12, 8.5, 0]);
  assert.deepEqual(C.pastLine(v.d['20261028']), { i: '☔', sk: 'sky/rain', t: '6°~12° · 비 9mm' });
  assert.deepEqual(C.pastLine(v.d['20261029']), { i: '🌡', t: '3°~15°' });
  assert.deepEqual(C.pastLine([-3, 1, 2, 3]), { i: '❄️', sk: 'sky/snow', t: '-3°~1° · 눈 3cm' });
  const f = await W.pastData(deps(), '41111', '202612'); assert.deepEqual(f.d, {});   // 앞으로의 달 = 빈 값
  const h = await W.handle(deps({ body }), { past: '41111', ym: '202610' }); assert.equal(h.status, 200); assert.equal(h.cache, 3600);
});
await ok('날씨 페이지 검색어: 출근 줄 = 집 · 퇴근 줄 = 직장 · 네이버 주소', async () => {
  W._resetFail();
  const c = (await W.handle(deps(), { h: '41111', w: '41597', s: '202610300700', e: '202610301900' })).body;
  assert.equal(c.r[0].q, '경기 수원시 장안구'); assert.equal(c.r[1].q, '경기 화성시 동탄구');
  assert.equal(C.naver('경기 수원시 장안구'), 'https://m.search.naver.com/search.naver?query=' + encodeURIComponent('경기 수원시 장안구 날씨'));
  const y = (await W.handle(deps(), { h: '41111', d: '20261031' })).body; assert.ok(y.r.every(x => x.q === '경기 수원시 장안구'));
});
await ok('그림 화면용: 한 줄 결론 · 출근/퇴근 칸(날씨 그림 · 옷) · 챙길 것 · 미세먼지 출근/퇴근 따로', async () => {
  W._resetFail();
  const d = deps();
  const c = (await W.handle(d, { h: '41111', w: '41597', s: '202610300700', e: '202610301900' })).body;
  assert.deepEqual(c.k, { t: '퇴근길에 비 와요', s: '우산 챙기세요 · 오후 5시부터', i: 'wear/umbrella' });
  assert.equal(c.c.length, 2); assert.equal(c.c[0].l, '출근 07:00'); assert.equal(c.c[0].sk, 'sky/cloudy'); assert.equal(c.c[1].sk, 'sky/rain');
  assert.equal(c.c[0].w, 'wear/coat'); assert.equal(c.c[0].ws, '코트'); assert.equal(c.c[1].hot, true); assert.equal(c.c[1].d, '비 70%');
  assert.deepEqual(c.b.slice(0, 2).map(x => x.n), ['큰 우산', '장화']);   // 3mm 비 = 큰 우산 · 장화
  assert.ok(c.b.length <= 3);
  assert.equal(c.dz.length, 2); assert.deepEqual(c.dz.map(x => x.p), ['출근', '퇴근']);
  assert.ok(c.dz.every(x => /^faces\/[0-7]$/.test(x.f)));
  // 밤이면 달 · 맑은 낮이면 해
  assert.equal(C.sky({ pty: 0, pop: 0, sky: 1 }, KST(2026, 10, 30, 22)), 'sky/moon');
  assert.equal(C.sky({ pty: 0, pop: 0, sky: 1 }, KST(2026, 10, 30, 12)), 'sky/sun');
  assert.equal(C.sky({ pty: 4, pop: 60, sky: 4 }, KST(2026, 10, 30, 12)), 'sky/shower');
  assert.equal(C.skyT('흐리고 비/눈'), 'sky/sleet'); assert.equal(C.skyT('구름많음', 70), 'sky/rain');
  // 쉬는 날도 같은 모양 (오전 · 오후 칸)
  const y = (await W.handle(d, { h: '41111', d: '20261031' })).body;
  assert.ok(y.k && y.k.t); assert.deepEqual(y.c.map(x => x.l), ['오전', '오후']); assert.ok(y.c.every(x => x.sk && x.w));
});
await ok('미세먼지: 출근·퇴근 동네 중 나쁜 쪽이 결론 · 얼굴 8단계 · 챙길 것에 마스크', () => {
  const now = KST(2026, 10, 30, 6), dk = '20261030';
  const sh = { s: { h: { '2026103007': [12, 0, 0, 1, 0, 1, 50], '2026103019': [14, 0, 0, 1, 0, 1, 50] } } };
  const home = Object.assign({ q: { p10: 20, p25: 6, st: '효곡동' } }, sh), work = Object.assign({ q: { p10: 90, p25: 40, st: '대송면' } }, sh);
  const c = C.commute(home, work, { s: KST(2026, 10, 30, 7), e: KST(2026, 10, 30, 19), hn: '집 · 효곡동', wn: '직장 · 대송면', now });
  assert.deepEqual(c.dz.map(x => [x.p, x.n, x.f, x.lb]), [['출근', '효곡동', 'faces/1', '좋음'], ['퇴근', '대송면', 'faces/5', '상당히 나쁨']]);
  assert.equal(c.k.t, '미세먼지 상당히 나쁨'); assert.match(c.k.s, /^퇴근길\(대송면\) KF94/); assert.equal(c.k.i, 'faces/5');
  assert.ok(c.b.some(x => x.i === 'wear/mask'));
  assert.equal(c.ag, 3);
  // 예보 4단계는 얼굴 1 · 3 · 4 · 6
  assert.deepEqual([1, 2, 3, 4].map(g => C.dustOf({ g, lv: -1 }).f), ['faces/1', 'faces/3', 'faces/4', 'faces/6']);
  assert.equal(dk.length, 8);
});
await ok('미세먼지 큰 화면 자료: 지금 값 · 항목 표 · 오늘부터 3일 예보', () => {
  const now = KST(2026, 10, 30, 8);
  const raw = { q: { p10: 62, p25: 41, st: '대잠동', t: '2026-10-30 07:00', x: { k: [112, 3], o3: [0.031, 2], co: [0.4, 1] } }, a: { d: { '20261029': [1, 1], '20261030': [3, 2], '20261031': [2, 2], '20261101': [1, 1], '20261102': [1, 1] } } };
  const d = C.dustInfo(raw, now);
  assert.equal(d.lb, '상당히 나쁨'); assert.equal(d.f, 'faces/5'); assert.equal(d.l10, 4); assert.equal(d.l25, 5);
  assert.deepEqual(d.x, [['통합대기지수', 112, '', 3], ['오존', 0.031, 'ppm', 2], ['일산화탄소', 0.4, 'ppm', 1]]);
  assert.deepEqual(d.fc, [['20261030', 3], ['20261031', 2], ['20261101', 1]]);
  assert.equal(C.dustInfo(null, now), null);
});
await ok('측정소: 동 이름으로 못 찾으면 전국 측정소 목록(위도 · 경도)에서 가까운 곳 · 표 항목도 받음', async () => {
  W._resetFail();
  const asked = [];
  const body = url => {
    if (/getTMStdrCrdnt/.test(url)) return wrap([]);   // 동 이름으로는 못 찾음
    if (/getMsrstnList/.test(url)) return wrap([{ stationName: '먼곳', dmX: '35.0', dmY: '129.0' }, { stationName: '대잠동', dmX: '36.02', dmY: '129.35' }, { stationName: '장흥동', dmX: '35.99', dmY: '129.40' }]);
    if (/getMsrstnAcctoRltmMesureDnsty/.test(url)) { asked.push(decodeURIComponent(url.match(/stationName=([^&]+)/)[1])); return wrap([{ dataTime: '2026-10-30 05:00', pm10Value: '33', pm25Value: '12', khaiValue: '58', khaiGrade: '2', o3Value: '0.021', o3Grade: '1', so2Value: '-', so2Grade: '' }]); }
    return null;
  };
  const D = req('../lib/wxDongs.json'), hg = D['47111'].find(x => x[1] === '효곡동')[0];
  const r = await W.regionData(deps({ body }), hg);
  assert.equal(r.q.st, '대잠동'); assert.equal(asked[0], '대잠동');
  assert.deepEqual(r.q.x, { k: [58, 2], o3: [0.021, 1] });
  assert.ok(!r.qe);
  W._resetFail();
  const r2 = await W.regionData(deps(), hg); assert.equal(r2.q.w, '경북'); assert.ok(r2.qe);   // 둘 다 안 되면 시·도 평균 + 까닭
});
await ok('시각 글자(YYYYMMDDHHmm) → ms (한국 시간)', () => assert.equal(W.stampMs('202610300700'), KST(2026, 10, 30, 7)));
console.log(`\n${n} 통과`);

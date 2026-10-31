'use strict';
/* 출퇴근 날씨 — 기상청 단기 · 중기예보 + 에어코리아 미세먼지를 받아 지역별로 저장해 두고 나눠 줌
 * 키는 서버 비밀값(DATA_KEY, 공공데이터포털 일반 인증키)으로만 씀 · 앱에는 키가 없음
 * 같은 지역은 발표 시각이 바뀔 때만 다시 받음 (사용자가 많아도 기상청 호출은 지역 수 × 하루 8번 안팎)
 * 이 파일은 순수 계산 + 받아 오기만 (저장소 · 시계 · fetch 는 밖에서 넣어 줌 → 시험에서 가짜로 바꿔 끼움) */
const REG = require('./wxRegions.json');
const WX = require('./wxcore');
const BY = new Map(REG.map(r => [r[0], { c: r[0], s: r[1], n: r[2], nx: r[3], ny: r[4], land: r[5], ta: r[6], aq: r[7] }]));
let DONGS = null;   // 동 목록은 처음 쓸 때만 읽음 (3,500여 곳)
const dongsOf = sgg => { if (!DONGS) DONGS = require('./wxDongs.json'); return DONGS[sgg] || null; };
// 지역 번호: 시·군·구 5자리 또는 동 10자리 (동이면 격자만 그 동 것 · 중기 · 미세먼지 구역은 시·군·구 것)
function region(c) {
  c = String(c || '');
  if (/^\d{5}$/.test(c)) return BY.get(c) || null;
  if (!/^\d{10}$/.test(c)) return null;
  const p = BY.get(c.slice(0, 5)), d = p && (dongsOf(p.c) || []).find(x => x[0] === c);
  return d ? Object.assign({}, p, { c, n: `${p.n} ${d[1]}`, dn: d[1], nx: d[2], ny: d[3] }) : null;
}

const p2 = n => String(n).padStart(2, '0');
// 기상청 격자(nx, ny) → 위도 · 경도 (LCC 역변환) — 가장 가까운 관측소를 고를 때만 씀
function gridLL(nx, ny) {
  const RE = 6371.00877, G = 5.0, D = Math.PI / 180, s1 = 30 * D, s2 = 60 * D, ol = 126 * D, oa = 38 * D, XO = 43, YO = 136, re = RE / G;
  const sn = Math.log(Math.cos(s1) / Math.cos(s2)) / Math.log(Math.tan(Math.PI * 0.25 + s2 * 0.5) / Math.tan(Math.PI * 0.25 + s1 * 0.5));
  const sf = Math.pow(Math.tan(Math.PI * 0.25 + s1 * 0.5), sn) * Math.cos(s1) / sn, ro = re * sf / Math.pow(Math.tan(Math.PI * 0.25 + oa * 0.5), sn);
  const xn = nx - XO, yn = ro - ny + YO, ra = Math.sign(sn) * Math.sqrt(xn * xn + yn * yn);
  const lat = 2 * Math.atan(Math.pow(re * sf / ra, 1 / sn)) - Math.PI * 0.5;
  const th = Math.abs(xn) <= 0 ? 0 : Math.abs(yn) <= 0 ? Math.PI * 0.5 * Math.sign(xn) : Math.atan2(xn, yn);
  return [lat / D, (th / sn + ol) / D];
}
let ASOS = null;
// 가까운 종관 관측소 (가까운 순 3곳)
function nearAsos(r) {
  if (!ASOS) ASOS = require('./wxAsos.json');
  const [la, lo] = gridLL(r.nx, r.ny), c = Math.cos(la * Math.PI / 180);
  return ASOS.map(x => [x, (x[2] - la) ** 2 + ((x[3] - lo) * c) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, 3).map(x => x[0]);
}
const kstParts = ms => { const d = new Date(ms + 9 * 3600000); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()]; };
const ymd = ms => { const [y, m, d] = kstParts(ms); return `${y}${p2(m)}${p2(d)}`; };
const HOUR = 3600000;

// 단기예보 발표: 02 · 05 · 08 · 11 · 14 · 17 · 20 · 23시 (10분쯤 뒤부터 받을 수 있음 → 15분 여유)
function shortBase(now) {
  const t = now - 15 * 60000, [, , , h] = kstParts(t);
  const bh = [23, 20, 17, 14, 11, 8, 5, 2].find(x => x <= h);
  if (bh == null) return `${ymd(t - 24 * HOUR)}2300`;
  return `${ymd(t)}${p2(bh)}00`;
}
// 중기예보 발표: 06 · 18시 (40분 여유)
function midBase(now) {
  const t = now - 40 * 60000, [, , , h] = kstParts(t);
  if (h >= 18) return `${ymd(t)}1800`;
  if (h >= 6) return `${ymd(t)}0600`;
  return `${ymd(t - 24 * HOUR)}1800`;
}
// 미세먼지 예보 발표: 05 · 11 · 17 · 23시 (30분 여유)
function airBase(now) {
  const t = now - 30 * 60000, [, , , h] = kstParts(t);
  const bh = [23, 17, 11, 5].find(x => x <= h);
  if (bh == null) return `${ymd(t - 24 * HOUR)}23`;
  return `${ymd(t)}${p2(bh)}`;
}
// 미세먼지 지금 값: 매시 (20분 여유)
function rtBase(now) { const t = now - 20 * 60000, [, , , h] = kstParts(t); return `${ymd(t)}${p2(h)}`; }

const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
// 강수량 글자 → mm ("강수없음" 0 · "1mm 미만" 0.5 · "30.0~50.0mm" 30 · "50.0mm 이상" 50)
function pcpMm(v) {
  const s = String(v == null ? '' : v);
  if (!s || /없음/.test(s)) return 0;
  if (/미만/.test(s)) return 0.5;
  const n = parseFloat(s.replace(/[^0-9.~]/g, '').split('~')[0]);
  return Number.isFinite(n) ? n : 0;
}

function items(j) {
  const r = j && j.response;
  const code = r && r.header && r.header.resultCode;
  if (code && code !== '00') { const e = new Error(`${code} ${r.header.resultMsg || ''}`.trim()); e.code = code; throw e; }
  const it = r && r.body && r.body.items;
  const a = it && (Array.isArray(it) ? it : it.item);
  return Array.isArray(a) ? a : a ? [a] : [];
}

function parseShort(list, b) {
  const h = {}, n = {};
  const C = { TMP: 0, POP: 1, PTY: 2, SKY: 3, PCP: 4, WSD: 5, REH: 6 };
  for (const x of list) {
    const k = `${x.fcstDate}${String(x.fcstTime).slice(0, 2)}`, v = x.fcstValue;
    if (x.category === 'TMN' || x.category === 'TMX') { const d = (n[x.fcstDate] = n[x.fcstDate] || [null, null]); d[x.category === 'TMN' ? 0 : 1] = Math.round(num(v)); continue; }
    if (!(x.category in C)) continue;
    const row = (h[k] = h[k] || [null, 0, 0, 1, 0, null, null]);
    const i = C[x.category];
    row[i] = i === 4 ? pcpMm(v) : i === 0 ? Math.round(num(v)) : i === 5 ? num(v) : Math.round(num(v) || 0);
  }
  for (const k of Object.keys(h)) if (h[k][0] == null) delete h[k];   // 기온이 없는 칸은 버림
  return { b, h, n };
}

// 중기: tmFc 날짜 + n 일. 칸 이름은 wf4Am · rnSt4Am … wf8 · rnSt8 … taMin4 · taMax4 (발표 체계가 바뀌어도 숫자만 보고 읽음)
function parseMid(land, ta, b) {
  const base = Date.UTC(+b.slice(0, 4), +b.slice(4, 6) - 1, +b.slice(6, 8));
  const dk = n => { const d = new Date(base + n * 86400000); return `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}`; };
  const d = {};
  const slot = n => (d[dk(n)] = d[dk(n)] || [null, 0, null, 0, null, null]);
  for (const [k, v] of Object.entries(land || {})) {
    let m = k.match(/^(wf|rnSt)(\d+)(Am|Pm)?$/); if (!m) continue;
    const n = +m[2], s = slot(n), wf = m[1] === 'wf';
    const idx = m[3] === 'Pm' ? (wf ? 2 : 3) : (wf ? 0 : 1);
    s[idx] = wf ? String(v || '') : (num(v) || 0);
    if (!m[3]) { s[wf ? 2 : 3] = s[idx]; }   // 8일 뒤부터는 하루 한 값 → 오전 · 오후 똑같이
  }
  for (const [k, v] of Object.entries(ta || {})) {
    const m = k.match(/^ta(Min|Max)(\d+)$/); if (!m) continue;
    const s = slot(+m[2]); s[m[1] === 'Min' ? 4 : 5] = Math.round(num(v));
  }
  for (const k of Object.keys(d)) if (!d[k][0] && d[k][4] == null) delete d[k];
  return { b, d };
}

// 미세먼지 예보 (전국 한 번): informGrade "서울 : 보통,제주 : 좋음,…" → {날짜: {지역: [미세, 초미세]}}
const GR = { '좋음': 1, '보통': 2, '나쁨': 3, '매우나쁨': 4, '매우 나쁨': 4 };
function parseAirFc(list10, list25, b) {
  const d = {}, seen = {};
  const add = (list, idx) => {
    // 같은 날짜가 여러 발표에 있으면 가장 최근 발표만
    const best = {};
    for (const x of list) { const day = String(x.informData || '').replace(/-/g, ''); if (!day) continue; if (!best[day] || String(x.dataTime) > String(best[day].dataTime)) best[day] = x; }
    for (const [day, x] of Object.entries(best)) {
      for (const part of String(x.informGrade || '').split(',')) {
        const m = part.split(':'); if (m.length < 2) continue;
        const reg = m[0].trim(), g = GR[m[1].trim()]; if (!reg || !g) continue;
        const r = ((d[day] = d[day] || {})[reg] = (d[day][reg] || [0, 0])); r[idx] = g; seen[reg] = 1;
      }
    }
  };
  add(list10, 0); add(list25, 1);
  return { b, d };
}
// 미세먼지 지금 (시 · 도 안 측정소 평균)
function parseAirRt(list, sido) {
  let s10 = 0, n10 = 0, s25 = 0, n25 = 0, t = '';
  for (const x of list) {
    const a = num(x.pm10Value), b = num(x.pm25Value);
    if (a != null) { s10 += a; n10++; } if (b != null) { s25 += b; n25++; }
    if (x.dataTime && String(x.dataTime) > t) t = String(x.dataTime);
  }
  if (!n10 && !n25) return null;
  return { t, p10: n10 ? Math.round(s10 / n10) : null, p25: n25 ? Math.round(s25 / n25) : null, w: sido };
}
// 지역 → 미세먼지 예보 구역 이름 (후보 여러 개: "광주|전남광주")
const aqNames = r => String(r.aq || '').split('|');
// 지역 → 실시간 측정 시 · 도 이름
const rtSido = r => { const a = aqNames(r)[0]; return /^경기/.test(a) ? '경기' : a === '영동' || a === '영서' ? '강원' : a; };

/* 받아 오기 (deps: {key, fetch, now, cache:{get(id), set(id,v)}, log}) */
const API = 'https://apis.data.go.kr';
function keyParam(k) { k = String(k || '').trim(); return /%[0-9A-Fa-f]{2}/.test(k) ? k : encodeURIComponent(k); }
async function getJson(deps, path, q) {
  const qs = Object.entries(q).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const url = `${API}${path}?serviceKey=${keyParam(deps.key)}&${qs}`;
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), deps.timeout || 7000);
  try {
    const r = await deps.fetch(url, { signal: ac.signal });
    const text = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    let j; try { j = JSON.parse(text); } catch (e) { throw new Error(/SERVICE_KEY|SERVICE KEY/i.test(text) ? 'KEY 등록 안 됨' : /LIMITED|EXCEED/i.test(text) ? '호출 한도 넘음' : '응답 모양 이상'); }
    return j;
  } finally { clearTimeout(tm); }
}
// 새 예보에는 이미 지난 시간이 없음 → 저장해 둔 옛 예보에서 오늘(한국 시간 0시부터) 지난 시간 칸을 붙여 둠 (지난 출근 칸 · 시간별 줄)
async function fetchShortKeep(deps, r, b, id) {
  const v = await fetchShort(deps, r, b);
  try {
    const old = await deps.cache.get(id);
    const o = old && old.d ? JSON.parse(old.d) : null;
    if (o && o.h) {
      const first = Object.keys(v.h).sort()[0] || '', today = ymd(deps.now - 24 * HOUR) + '00';   // 어제 0시부터 (어제 날짜 칸 · 팝업)
      for (const [k, x] of Object.entries(o.h)) if (k >= today && k < first && !v.h[k]) v.h[k] = x;
      if (o.n) for (const [k, x] of Object.entries(o.n)) if (!v.n[k] && k >= ymd(deps.now - 24 * HOUR)) v.n[k] = x;
    }
  } catch (e) { }
  return v;
}
async function fetchShort(deps, r, b) {
  const all = [];
  for (let page = 1; page <= 3; page++) {
    const j = await getJson(deps, '/1360000/VilageFcstInfoService_2.0/getVilageFcst', { pageNo: page, numOfRows: 1000, dataType: 'JSON', base_date: b.slice(0, 8), base_time: b.slice(8), nx: r.nx, ny: r.ny });
    const it = items(j); all.push(...it);
    const total = +((j.response.body || {}).totalCount || 0);
    if (!it.length || all.length >= total) break;
  }
  if (!all.length) throw new Error('단기예보 없음');
  return parseShort(all, b);
}
async function fetchMid(deps, r, b) {
  const [l, t] = await Promise.all([
    getJson(deps, '/1360000/MidFcstInfoService/getMidLandFcst', { pageNo: 1, numOfRows: 10, dataType: 'JSON', regId: r.land, tmFc: b }),
    getJson(deps, '/1360000/MidFcstInfoService/getMidTa', { pageNo: 1, numOfRows: 10, dataType: 'JSON', regId: r.ta, tmFc: b }).catch(() => null)   // 기온 구역이 틀려도 날씨는 보여 줌
  ]);
  return parseMid(items(l)[0], t ? items(t)[0] : null, b);
}
async function fetchAirFc(deps, now) {
  const [y, m, d] = kstParts(now), day = `${y}-${p2(m)}-${p2(d)}`;
  const q = c => getJson(deps, '/B552584/ArpltnInforInqireSvc/getMinuDustFrcstDspth', { returnType: 'json', numOfRows: 100, pageNo: 1, searchDate: day, InformCode: c });
  const [a, b] = await Promise.all([q('PM10'), q('PM25')]);
  return parseAirFc(items(a), items(b), airBase(now));
}
async function fetchAirRt(deps, sido, now) {
  const j = await getJson(deps, '/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty', { returnType: 'json', numOfRows: 200, pageNo: 1, sidoName: sido, ver: '1.0' });
  const v = parseAirRt(items(j), sido);
  if (!v) throw new Error('측정값 없음');
  return Object.assign(v, { b: rtBase(now) });
}

// 미세먼지 가까운 측정소 (에어코리아 측정소정보): 동 이름 → TM 좌표 → 가까운 측정소 3곳 (지역마다 한 번 찾아 저장)
async function fetchStationsTm(deps, r) {
  let umd = r.dn, sggTail = r.n.split(' ').filter(x => x !== r.dn).pop();
  if (!umd) {   // 시·군·구만 골랐으면: 그 시·군·구 대표 칸과 가장 가까운 동
    const l = dongsOf(r.c) || []; const d = l.slice().sort((a, b) => ((a[2] - r.nx) ** 2 + (a[3] - r.ny) ** 2) - ((b[2] - r.nx) ** 2 + (b[3] - r.ny) ** 2))[0];
    if (!d) throw new Error('동 없음'); umd = d[1];
  }
  const t = items(await getJson(deps, '/B552584/MsrstnInfoInqireSvc/getTMStdrCrdnt', { returnType: 'json', numOfRows: 50, pageNo: 1, umdName: umd }));
  const hit = t.find(x => String(x.sggName || '').includes(sggTail) || sggTail.includes(String(x.sggName || '').split(' ').pop())) || (t.length === 1 ? t[0] : null);
  if (!hit || num(hit.tmX) == null) throw new Error('TM 좌표 없음');
  const n = items(await getJson(deps, '/B552584/MsrstnInfoInqireSvc/getNearbyMsrstnList', { returnType: 'json', tmX: hit.tmX, tmY: hit.tmY, ver: '1.1' }));
  const st = n.map(x => String(x.stationName || '')).filter(Boolean).slice(0, 3);
  if (!st.length) throw new Error('측정소 없음');
  return st;
}
// 동 이름으로 못 찾으면: 전국 측정소 목록(위도 · 경도, 한 달에 한 번 받음)에서 그 동네 격자와 가까운 3곳
async function fetchStationsLl(deps, r) {
  const ym = ymd(deps.now).slice(0, 6);
  const all = await cached(deps, 'stl', ym, async () => {
    const l = items(await getJson(deps, '/B552584/MsrstnInfoInqireSvc/getMsrstnList', { returnType: 'json', numOfRows: 1000, pageNo: 1, ver: '1.1' }));
    const out = [];
    for (const x of l) {
      const a = num(x.dmX), b = num(x.dmY), n = String(x.stationName || '');
      if (a == null || b == null || !n) continue;
      out.push(a < 90 ? [n, a, b] : [n, b, a]);   // [이름, 위도, 경도] (칸 이름이 바뀌어 있어도)
    }
    if (!out.length) throw new Error('측정소 목록 없음');
    return out;
  });
  if (!all.v) throw new Error(all.e || '측정소 목록 없음');
  const [la, lo] = gridLL(r.nx, r.ny), c = Math.cos(la * Math.PI / 180);
  return all.v.map(x => [x[0], (x[1] - la) ** 2 + ((x[2] - lo) * c) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, 3).map(x => x[0]);
}
async function fetchStations(deps, r) {
  try { return await fetchStationsTm(deps, r); } catch (e) {
    if (deps.log) deps.log(`st_${r.c}`, 'TM: ' + e.message);
    return fetchStationsLl(deps, r);
  }
}
async function fetchStationRt(deps, st, now) {
  const l = items(await getJson(deps, '/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty', { returnType: 'json', numOfRows: 24, pageNo: 1, stationName: st, dataTerm: 'DAILY', ver: '1.0' }));
  const x = l.find(v => num(v.pm10Value) != null || num(v.pm25Value) != null);
  if (!x) throw new Error('측정값 없음');
  // 표에 쓸 것: 통합대기지수 · 오존 · 이산화질소 · 일산화탄소 · 아황산가스 [값, 등급 1~4] (점검 중 '-' 이면 뺌)
  const gx = {};
  for (const [k, v, g] of [['k', 'khaiValue', 'khaiGrade'], ['o3', 'o3Value', 'o3Grade'], ['no2', 'no2Value', 'no2Grade'], ['co', 'coValue', 'coGrade'], ['so2', 'so2Value', 'so2Grade']]) {
    const n = num(x[v]); if (n == null) continue;
    const gr = Math.round(num(x[g]) || 0); gx[k] = [n, gr >= 1 && gr <= 4 ? gr : 0];
  }
  // 지난 24시간 1시간마다 (시간별 줄 얼굴): {'YYYYMMDDHH': [미세, 초미세]} · "24:00" 은 다음날 00시
  const hh = {};
  for (const v of l) {
    const m = String(v.dataTime || '').match(/^(\d{4})-(\d\d)-(\d\d) (\d\d):/); if (!m) continue;
    const a = num(v.pm10Value), b = num(v.pm25Value); if (a == null && b == null) continue;
    const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4]) - 9 * HOUR, [yy, mm, dd, h2] = kstParts(t);
    hh[`${yy}${p2(mm)}${p2(dd)}${p2(h2)}`] = [a == null ? null : Math.round(a), b == null ? null : Math.round(b)];
  }
  return { t: String(x.dataTime || ''), p10: num(x.pm10Value) != null ? Math.round(num(x.pm10Value)) : null, p25: num(x.pm25Value) != null ? Math.round(num(x.pm25Value)) : null, st, x: gx, hh, b: rtBase(now) };
}
async function stationAir(deps, r) {
  const sl = await cached(deps, `st_${r.c}`, 'v2', () => fetchStations(deps, r));
  if (!sl.v) return { e: sl.e || '측정소 못 찾음' };
  let e = '';
  for (const st of sl.v) {   // 가장 가까운 측정소가 점검 중이면 다음 곳
    const q = await cached(deps, `qs2_${st}`, rtBase(deps.now), () => fetchStationRt(deps, st, deps.now));
    if (q.v) return { v: q.v };
    e = q.e || e;
  }
  return { e: e || '측정값 없음' };
}

/* 기상특보 (기상청_기상특보 조회서비스 getPwnStatus · 전국 한 번 · 10분마다)
 * t6 = "o 강풍주의보 : 경상북도(포항, 경주, 울진평지), 부산, 울릉도.독도\r\no 건조경보 : …" → 지역마다 [[종류, '주의보'|'경보'], …] */
const AK = ['호우', '태풍', '강풍', '대설', '한파', '폭염', '건조', '황사', '풍랑', '폭풍해일'];
const SIDO_L = { 서울: ['서울'], 부산: ['부산'], 대구: ['대구'], 인천: ['인천'], 광주: ['광주'], 대전: ['대전'], 울산: ['울산'], 세종: ['세종'], 경기: ['경기'], 강원: ['강원'], 충북: ['충청북도', '충북'], 충남: ['충청남도', '충남'], 전북: ['전라북도', '전북'], 전남: ['전라남도', '전남'], 경북: ['경상북도', '경북'], 경남: ['경상남도', '경남'], 제주: ['제주'] };
const METRO = new Set(['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종']);
// "경상북도(포항, 경주), 부산" → [['경상북도', ['포항', '경주']], ['부산', []]] (괄호 안 쉼표는 안 나눔)
function splitRegions(t) {
  const out = []; let depth = 0, cur = '';
  for (const ch of String(t || '') + ',') {
    if (ch === '(') depth++; if (ch === ')') depth--;
    if (ch === ',' && depth <= 0) { const x = cur.trim(); if (x) { const m = x.match(/^([^(]+)\((.*)\)$/); out.push(m ? [m[1].trim(), m[2].split(',').map(y => y.trim()).filter(Boolean)] : [x, []]); } cur = ''; depth = 0; continue; }
    cur += ch;
  }
  return out;
}
function parseAlerts(t6) {
  const list = [];
  for (const line of String(t6 || '').split(/\r?\n/)) {
    const m = line.match(/^\s*o?\s*(호우|태풍|강풍|대설|한파|폭염|건조|황사|풍랑|폭풍해일)\s*(주의보|경보)\s*:\s*(.+)$/);
    if (m) list.push([m[1], m[2], splitRegions(m[3])]);
  }
  return list;
}
// 이 지역에 걸린 특보: 시·도 이름이 맞고 (괄호가 없거나 · 광역시 · 괄호 안에 시·군 이름이 있으면)
function alertsFor(list, r) {
  const names = SIDO_L[r.s] || [r.s], stem = String(r.n || '').split(' ')[0].replace(/(특별자치시|특별시|광역시|시|군|구)$/, '');
  const out = [];
  for (const [k, lv, regs] of list) {
    const hit = regs.some(([nm, sub]) => {
      if (!names.some(x => nm.startsWith(x))) return false;
      if (!sub.length || METRO.has(r.s)) return true;
      return sub.some(x => stem && (x.startsWith(stem) || stem.startsWith(x.replace(/(평지|산지|북부|남부|동부|서부|내륙|해안)$/, ''))));
    });
    if (hit && !out.some(x => x[0] === k && (x[1] === '경보' || lv === '주의보'))) { for (let i = out.length - 1; i >= 0; i--) if (out[i][0] === k) out.splice(i, 1); out.push([k, lv]); }
  }
  return out.sort((a, b) => (b[1] === '경보') - (a[1] === '경보') || AK.indexOf(a[0]) - AK.indexOf(b[0]));
}
const alertBase = now => { const [y, m, d, h, mi] = kstParts(now); return `${y}${p2(m)}${p2(d)}${p2(h)}${Math.floor(mi / 10)}`; };
async function fetchAlerts(deps) {
  const l = items(await getJson(deps, '/1360000/WthrWrnInfoService/getPwnStatus', { pageNo: 1, numOfRows: 10, dataType: 'JSON' }));
  const x = l[0] || {};
  return { t: String(x.tmFc || ''), list: parseAlerts(x.t6) };
}

/* 자외선 (기상청 생활기상지수 조회서비스 4.0 getUVIdxV4 · 지역 번호 10자리 · 06 · 18시 발표, 3시간 간격 h0 … h75)
 * → {b, h:{'YYYYMMDDHH': 지수}} */
function uvBase(now) {
  const t = now - 40 * 60000, [, , , h] = kstParts(t);
  if (h >= 18) return `${ymd(t)}18`;
  if (h >= 6) return `${ymd(t)}06`;
  return `${ymd(t - 24 * HOUR)}18`;
}
async function fetchUv(deps, area, b) {
  const l = items(await getJson(deps, '/1360000/LivingWthrIdxServiceV4/getUVIdxV4', { pageNo: 1, numOfRows: 10, dataType: 'JSON', areaNo: area, time: b }));
  const x = l[0]; if (!x) throw new Error('자외선 없음');
  const base = Date.UTC(+b.slice(0, 4), +b.slice(4, 6) - 1, +b.slice(6, 8), +b.slice(8, 10)) - 9 * HOUR, h = {};
  for (const [k, v] of Object.entries(x)) {
    const m = k.match(/^h(\d+)$/); const n = num(v); if (!m || n == null) continue;
    const t = base + (+m[1]) * HOUR, [yy, mm, dd, hh] = kstParts(t);
    h[`${yy}${p2(mm)}${p2(dd)}${p2(hh)}`] = n;
  }
  if (!Object.keys(h).length) throw new Error('자외선 없음');
  return { b, h };
}

// 지난 날짜 실제 관측 (기상청 ASOS 일자료): 그 달 하루마다 [최저, 최고, 강수 mm, 적설 cm] · 지난달까지는 한 번 받으면 안 바뀜
async function fetchPast(deps, stn, ym, endDay) {
  const l = items(await getJson(deps, '/1360000/AsosDalyInfoService/getWthrDataList', { pageNo: 1, numOfRows: 31, dataType: 'JSON', dataCd: 'ASOS', dateCd: 'DAY', startDt: `${ym}01`, endDt: endDay, stnIds: stn }));
  const d = {};
  for (const x of l) {
    const k = String(x.tm || '').replace(/-/g, ''); if (!/^\d{8}$/.test(k)) continue;
    const mn = num(x.minTa), mx = num(x.maxTa);
    if (mn == null && mx == null) continue;
    d[k] = [mn == null ? null : Math.round(mn), mx == null ? null : Math.round(mx), num(x.sumRn) || 0, num(x.ddMes) || 0];
  }
  if (!Object.keys(d).length) throw new Error('관측 없음');
  return d;
}
async function pastData(deps, code, ym) {
  const r = region(code); if (!r || !/^\d{6}$/.test(ym)) return null;
  const yd = ymd(deps.now - 24 * HOUR);   // 관측 자료는 어제까지
  if (`${ym}01` > yd) return { r: r.c, ym, st: '', d: {} };
  const last = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(4, 6), 0)).getUTCDate(), end = `${ym}${p2(last)}` < yd ? `${ym}${p2(last)}` : yd;
  for (const s of nearAsos(r)) {
    // 이번 달: 어제 관측이 아직 안 올라왔으면(보통 다음날 오전) 저장 열쇠에 시각을 붙여 1시간마다 다시 물음
    const cur = end === yd && end.slice(0, 6) === ym, key = `p_${s[0]}_${ym}`;
    let b = cur ? yd : 'final';
    if (cur) { const old = await deps.cache.get(key).catch(() => null); if (old && String(old.b).startsWith(yd) && old.d && !JSON.parse(old.d)[yd]) b = yd + '_' + kstParts(deps.now)[3]; else if (old && String(old.b).startsWith(yd + '_')) b = old.b; }
    const v = await cached(deps, key, b, () => fetchPast(deps, s[0], ym, end));
    if (v.v) return { r: r.c, ym, st: s[1], d: v.v };
  }
  return { r: r.c, ym, st: '', d: {}, e: 'past' };
}

/* 저장해 둔 값이 이번 발표 것이면 그대로, 아니면 새로 받고 · 받다 실패하면 저장해 둔 옛 값(이틀 안)
 * 같은 열쇠를 실패한 지 2분 안에는 다시 부르지 않음 (기상청이 멈췄을 때 매번 기다리지 않게) */
const failAt = new Map();
async function cached(deps, id, b, get) {
  const old = await deps.cache.get(id).catch(() => null);
  if (old && old.b === b && old.d) return { v: JSON.parse(old.d) };
  const fa = failAt.get(id + b);
  if (!(fa && deps.now >= fa && deps.now - fa < 120000)) {
    try {
      const v = await get();
      await deps.cache.set(id, { b, d: JSON.stringify(v), at: deps.now }).catch(() => {});
      return { v };
    } catch (e) {
      failAt.set(id + b, deps.now);
      if (deps.log) deps.log(id, e.message);
      if (old && old.d && deps.now - (old.at || 0) < 2 * 86400000) return { v: JSON.parse(old.d), e: e.message };
      return { v: null, e: e.message };
    }
  }
  if (old && old.d && deps.now - (old.at || 0) < 2 * 86400000) return { v: JSON.parse(old.d), e: 'retry later' };
  return { v: null, e: 'retry later' };
}

// 한 지역 자료 전부 (앱 화면 · 출퇴근 문구에 쓰는 모양)
async function regionData(deps, code) {
  const r = region(code); if (!r) return null;
  const now = deps.now;
  const [s, m, af, rt] = await Promise.all([
    cached(deps, `s_${r.nx}_${r.ny}`, shortBase(now), () => fetchShortKeep(deps, r, shortBase(now), `s_${r.nx}_${r.ny}`)),
    cached(deps, `m_${r.land}_${r.ta}`, midBase(now), () => fetchMid(deps, r, midBase(now))),
    cached(deps, 'af', airBase(now), () => fetchAirFc(deps, now)),
    cached(deps, `q_${rtSido(r)}`, rtBase(now), () => fetchAirRt(deps, rtSido(r), now))
  ]);
  const near = await stationAir(deps, r).catch(e => ({ e: e.message }));   // 가까운 측정소 값이 있으면 그것 (없으면 시·도 평균)
  const area = r.c.length === 10 ? r.c : `${r.c}00000`;
  const [wa, uv] = await Promise.all([
    cached(deps, 'wa', alertBase(now), () => fetchAlerts(deps)).catch(() => ({ v: null })),
    cached(deps, `u_${area}`, uvBase(now), () => fetchUv(deps, area, uvBase(now))).catch(() => ({ v: null }))
  ]);
  const out = { v: 1, r: r.c, n: r.n, s: s.v, m: m.v, a: null, q: near.v || rt.v || null };
  if (wa.v && Array.isArray(wa.v.list)) { const l = alertsFor(wa.v.list, r); if (l.length) out.w = { t: wa.v.t, l }; }   // 특보 (걸린 것만)
  if (uv.v && uv.v.h) out.u = uv.v;   // 자외선 지수 (3시간 간격)
  if (af.v && af.v.d) {   // 전국 예보에서 이 지역 몫만
    const names = aqNames(r), d = {};
    for (const [day, regs] of Object.entries(af.v.d)) { const nm = names.find(x => regs[x]); if (nm) d[day] = regs[nm]; }
    out.a = { b: af.v.b, d };
  }
  const e = {}; if (s.e) e.s = s.e; if (m.e) e.m = m.e; if (af.e) e.a = af.e; if (rt.e) e.q = rt.e; 
  if (Object.keys(e).length) out.e = e;
  if (near.e) out.qe = String(near.e).slice(0, 80);   // 가까운 측정소를 못 쓴 까닭 (시·도 평균일 때 원인 보기 · 주소창에서 ?r= 로 확인)
  return out;
}

const okStamp = s => /^\d{12}$/.test(String(s || ''));
const stampMs = s => Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(8, 10), +s.slice(10, 12)) - 9 * HOUR;

/* 요청 처리: ?r=지역  → 지역 자료 (앱)
 *            ?h=집&w=직장&s=YYYYMMDDHHmm&e=YYYYMMDDHHmm → 출퇴근 문구 (알람 · 날씨만 알림)
 *            ?h=집&d=YYYYMMDD → 하루 요약 문구 (쉬는 날 날씨만 알림) */
async function handle(deps, q) {
  if (q.dongs) {   // 동 고르기 목록 (앱이 시·군·구를 고른 뒤 부름)
    const l = BY.has(String(q.dongs)) ? dongsOf(String(q.dongs)) : null;
    return l ? { status: 200, body: { list: l.map(x => [x[0], x[1]]) }, cache: 86400 } : { status: 400, body: { error: 'region' } };
  }
  if (q.past) {   // 지난 날짜 관측: ?past=지역&ym=YYYYMM
    const v = await pastData(deps, String(q.past), String(q.ym || ''));
    return v ? { status: 200, body: v, cache: 3600 } : { status: 400, body: { error: 'region' } };
  }
  if (q.r) {
    const codes = String(q.r).split(',').slice(0, 6).filter(c => region(c));
    if (!codes.length) return { status: 400, body: { error: 'region' } };
    const list = await Promise.all(codes.map(c => regionData(deps, c)));
    return { status: 200, body: codes.length === 1 && !String(q.r).includes(',') ? list[0] : { list } };
  }
  if (q.h) {
    const h = region(q.h); if (!h) return { status: 400, body: { error: 'region' } };
    const w = q.w ? region(q.w) : null;
    const [hd, wd] = await Promise.all([regionData(deps, h.c), w && w.c !== h.c ? regionData(deps, w.c) : null]);
    if (q.d && /^\d{8}$/.test(q.d)) {
      const c = WX.dayCard(hd, q.d, { now: deps.now, hq: `${h.s} ${h.n}` });
      return { status: 200, body: c ? Object.assign(c, { day: undefined }) : { none: 1 } };
    }
    if (!okStamp(q.s) || !okStamp(q.e)) return { status: 400, body: { error: 'time' } };
    const c = WX.commute(hd, wd || (w ? hd : null), { s: stampMs(q.s), e: stampMs(q.e), hn: `집 · ${h.dn || h.n}`, wn: `${w ? "직장" : "집"} · ${(w || h).dn || (w || h).n}`, hq: `${h.s} ${h.n}`, wq: `${(w || h).s} ${(w || h).n}`, now: deps.now });
    return { status: 200, body: c || { none: 1 } };
  }
  return { status: 400, body: { error: 'query' } };
}

module.exports = { parseAlerts, alertsFor, uvBase, _resetFail: () => failAt.clear(), gridLL, nearAsos, pastData, handle, regionData, region, shortBase, midBase, airBase, rtBase, parseShort, parseMid, parseAirFc, parseAirRt, pcpMm, stampMs, keyParam };

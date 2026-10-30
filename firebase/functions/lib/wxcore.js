/* 날씨 공통 계산 (서버 함수 · 앱 화면이 똑같은 파일을 씀 — 앱은 index.html 의 WXCORE 블록에 그대로 복사, 시험이 같은지 확인)
 * 자료 모양 (서버 /wx?r=지역번호 가 돌려주는 것):
 *   s: 단기예보 {b:발표, h:{'YYYYMMDDHH':[기온,강수확률,강수형태,하늘,강수량mm,풍속,습도]}, n:{'YYYYMMDD':[최저,최고]}}
 *   m: 중기예보 {b:발표, d:{'YYYYMMDD':[오전날씨,오전비%,오후날씨,오후비%,최저,최고]}}
 *   a: 미세먼지 예보 {b:발표, d:{'YYYYMMDD':[미세 등급,초미세 등급]}}  (1 좋음 · 2 보통 · 3 나쁨 · 4 매우나쁨)
 *   q: 미세먼지 지금 {t:'YYYY-MM-DD HH:mm', p10, p25, w:'경기'(평균 낸 시·도) 또는 st:'측정소', x:{k,o3,no2,co,so2:[값, 등급1~4]}}
 * 그림 이름(앱 assets/wx/ 아래 .png): 'sky/rain' · 'wear/coat' · 'faces/4' 처럼 — 앱 화면 · 알람 카드 · 위젯 창이 같은 그림을 씀
 * 시각은 모두 한국 시간 기준 열쇠('YYYYMMDDHH') — 폰 시간대와 상관없이 ms → 한국 시간으로 바꿔서 찾음 */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.WX = f(); })(this, function () {
  'use strict';
  const p2 = n => String(n).padStart(2, '0');
  const kst = ms => { const d = new Date(ms + 9 * 3600000); return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() }; };
  const keyD = ms => { const k = kst(ms); return `${k.y}${p2(k.mo)}${p2(k.d)}`; };
  const keyH = ms => { const k = kst(ms); return `${k.y}${p2(k.mo)}${p2(k.d)}${p2(k.h)}`; };
  const hm = ms => { const k = kst(ms); return `${p2(k.h)}:${p2(k.mi)}`; };
  const H = 3600000;
  const G10 = v => v == null ? 0 : v <= 30 ? 1 : v <= 80 ? 2 : v <= 150 ? 3 : 4;
  const G25 = v => v == null ? 0 : v <= 15 ? 1 : v <= 35 ? 2 : v <= 75 ? 3 : 4;
  const GN = ['', '좋음', '보통', '나쁨', '매우 나쁨'];

  // 그 시각(정각으로 반올림)의 단기예보 한 칸 · 없으면 앞뒤 3시간 안에서 가장 가까운 칸 (글피는 3시간 간격)
  function at(raw, ms) {
    const h = raw && raw.s && raw.s.h; if (!h) return null;
    const base = Math.round(ms / H) * H;
    for (const o of [0, 1, -1, 2, -2, 3, -3]) { const v = h[keyH(base + o * H)]; if (v) return { tp: v[0], pop: v[1], pty: v[2], sky: v[3], pcp: v[4] || 0, ws: v[5], reh: v[6] }; }
    return null;
  }
  const wet = v => !!v && (v.pty > 0 || v.pop >= 60);
  const snowy = v => !!v && (v.pty === 2 || v.pty === 3);
  const icon = v => !v ? '' : v.pty === 3 || v.pty === 2 ? '❄️' : v.pty > 0 ? '☔' : v.pop >= 60 ? '☔' : v.sky >= 4 ? '☁️' : v.sky >= 3 ? '⛅' : '☀️';
  const desc = v => !v ? '' : v.pty > 0 ? ['', '비', '비/눈', '눈', '소나기'][v.pty] || '비' : v.sky >= 4 ? '흐림' : v.sky >= 3 ? '구름많음' : '맑음';
  // 날씨 그림: 해 · 달(밤 6시 ~ 아침 6시) · 구름조금 · 흐림 · 비 · 소나기 · 눈 · 비/눈
  const night = ms => { const h = kst(ms).h; return h < 6 || h >= 19; };
  const sky = (v, ms) => !v ? '' : v.pty === 2 ? 'sky/sleet' : v.pty === 3 ? 'sky/snow' : v.pty === 4 ? 'sky/shower' : v.pty > 0 || v.pop >= 60 ? 'sky/rain' : v.sky >= 4 ? 'sky/cloudy' : ms != null && night(ms) ? 'sky/moon' : v.sky >= 3 ? 'sky/partly' : 'sky/sun';
  const skyT = (t, pop) => { t = String(t || ''); return /비|소나기/.test(t) && /눈/.test(t) ? 'sky/sleet' : /눈/.test(t) ? 'sky/snow' : /소나기/.test(t) ? 'sky/shower' : /비/.test(t) || pop >= 60 ? 'sky/rain' : /흐/.test(t) ? 'sky/cloudy' : /구름/.test(t) ? 'sky/partly' : t ? 'sky/sun' : ''; };
  const wfIcon = t => { t = String(t || ''); return /눈/.test(t) ? '❄️' : /비|소나기/.test(t) ? '☔' : /흐/.test(t) ? '☁️' : /구름/.test(t) ? '⛅' : t ? '☀️' : ''; };

  // 하루 요약: 단기예보(3~4일) 칸이 있으면 그걸로, 없으면 중기예보(4~10일)
  function day(raw, dk) {
    const h = raw && raw.s && raw.s.h;
    if (h) {
      const half = (a, b) => {
        let o = null;
        for (let i = a; i < b; i++) {
          const v = h[dk + p2(i)]; if (!v) continue;
          const x = { tp: v[0], pop: v[1], pty: v[2], sky: v[3] };
          if (!o) o = { sky: 0, pop: 0, pty: 0, tps: [] };
          o.sky = Math.max(o.sky, x.sky); o.pop = Math.max(o.pop, x.pop); if (x.pty > 0 && !o.pty) o.pty = x.pty; o.tps.push(x.tp);
        }
        return o && { i: icon(o), sk: sky(o), d: desc(o), pop: o.pop, wet: wet(o), snow: snowy(o) };
      };
      const am = half(6, 12), pm = half(12, 18);
      if (am || pm) {
        const all = []; for (let i = 0; i < 24; i++) { const v = h[dk + p2(i)]; if (v) all.push(v[0]); }
        const n = raw.s.n && raw.s.n[dk];
        const lo = n && n[0] != null ? n[0] : Math.min(...all), hi = n && n[1] != null ? n[1] : Math.max(...all);
        return finDay({ am, pm, lo, hi, src: 's' });
      }
    }
    const m = raw && raw.m && raw.m.d && raw.m.d[dk];
    if (m) {
      const mk = (w, r) => w ? { i: r >= 60 && !/비|눈|소나기/.test(w) ? '☔' : wfIcon(w), sk: skyT(w, r), d: w, pop: r || 0, wet: /비|눈|소나기/.test(w) || r >= 60, snow: /눈/.test(w) } : null;
      return finDay({ am: mk(m[0], m[1]), pm: mk(m[2], m[3]), lo: m[4], hi: m[5], src: 'm' });
    }
    return null;
  }
  function finDay(o) {
    const w = [o.am, o.pm].filter(Boolean);
    o.wet = w.some(x => x.wet); o.snow = w.some(x => x.snow);
    o.i = o.snow ? '❄️' : o.wet ? '☔' : (o.pm || o.am).i;
    o.sk = o.snow ? 'sky/snow' : o.wet ? 'sky/rain' : (o.pm || o.am).sk;
    o.pop = Math.max(0, ...w.map(x => x.pop || 0));
    return o;
  }

  // 미세먼지 8단계 (미세먼지 앱처럼 · 지금 측정값 ㎍/㎥ 기준): 최고 · 좋음 · 양호 · 보통 · 나쁨 · 상당히 나쁨 · 매우 나쁨 · 최악
  const L8 = ['최고', '좋음', '양호', '보통', '나쁨', '상당히 나쁨', '매우 나쁨', '최악'];
  const E8 = ['😆', '🙂', '🙂', '😐', '😷', '😷', '😫', '☠️'];
  const M8 = ['마스크 필요 없어요 · 환기하기 좋아요', '마스크 필요 없어요', '마스크 없어도 괜찮아요', '민감하면 마스크 챙겨요', 'KF80 마스크 챙겨요', 'KF94 마스크 써요', 'KF94 마스크 꼭 · 밖에 오래 있지 마세요', 'KF94 마스크 꼭 · 바깥 활동은 줄여요'];
  const T10 = [15, 30, 40, 50, 75, 100, 150], T25 = [8, 15, 20, 25, 37, 50, 75];
  const lv8 = (v, T) => v == null ? -1 : (T.findIndex(t => v <= t) + 1 || T.length + 1) - 1;
  const g4of8 = l => l <= 2 ? 1 : l === 3 ? 2 : l <= 5 ? 3 : 4;
  // 예보는 4단계 (좋음 · 보통 · 나쁨 · 매우 나쁨)
  const E4 = ['', '🙂', '😐', '😷', '😫'], N4 = ['', '좋음', '보통', '나쁨', '매우 나쁨'], M4 = ['', '마스크 필요 없어요', '민감하면 마스크 챙겨요', 'KF80 마스크 챙겨요', 'KF94 마스크 꼭'];
  // 미세먼지: 그날 예보 등급(미세 · 초미세 중 나쁜 쪽) · 오늘이면 지금 측정값(8단계)
  function air(raw, dk, now) {
    if (!raw) return null;
    const f = raw.a && raw.a.d && raw.a.d[dk];
    const q = raw.q && now != null && dk === keyD(now) && (raw.q.p10 != null || raw.q.p25 != null) ? raw.q : null;
    const lv = q ? Math.max(lv8(q.p10, T10), lv8(q.p25, T25)) : -1;
    const gf = f ? Math.max(f[0] || 0, f[1] || 0) : 0;
    const g = lv >= 0 ? g4of8(lv) : gf;   // 지금 측정값이 있으면 그걸로 (예보는 따로 보여 줌)
    if (!g) return null;
    return { g, f: f || null, q, lv };
  }
  // 한 줄: "😷 미세먼지 나쁨 · KF80 마스크 챙겨요" (오늘은 지금 값 8단계, 다른 날은 예보 4단계)
  function airLine(a) {
    if (!a) return '';
    if (a.lv >= 0) return `${E8[a.lv]} 미세먼지 ${L8[a.lv]} · ${M8[a.lv]}`;
    return `${E4[a.g]} 미세먼지 ${N4[a.g]} · ${M4[a.g]}`;
  }
  // 큰 팝업용 수치 (줄 나눔): "미세먼지 62㎍/㎥ (나쁨)\n초미세먼지 31㎍/㎥ (나쁨)\n지금 · 경기 평균 · 오늘 예보 나쁨" / 다른 날은 예보 등급만
  function airNums(a) {
    if (!a) return '';
    if (a.q) return [
      a.q.p10 != null ? `미세먼지 ${a.q.p10}㎍/㎥ (${L8[lv8(a.q.p10, T10)]})` : '',
      a.q.p25 != null ? `초미세먼지 ${a.q.p25}㎍/㎥ (${L8[lv8(a.q.p25, T25)]})` : '',
      ['지금', a.q.st ? `${a.q.st} 측정소` : a.q.w ? `${a.q.w} 평균` : '', a.f ? `오늘 예보 ${N4[Math.max(a.f[0] || 0, a.f[1] || 0)]}` : ''].filter(Boolean).join(' · ')
    ].filter(Boolean).join('\n');
    return `미세먼지 ${N4[a.f[0]] || '-'} · 초미세먼지 ${N4[a.f[1]] || '-'}\n예보 · 수치(㎍/㎥)는 오늘만 나와요`;
  }
  const airHead = a => airLine(a).replace(/^\S+\s/, '');   // 이모지 뺀 문구
  // 얼굴 그림 8개 (faces/0 최고 ~ faces/7 최악) · 4단계 예보·기체 등급은 좋음 1 · 보통 3 · 나쁨 4 · 매우 나쁨 6 번 얼굴
  const F4 = [-1, 1, 3, 4, 6];
  const face = l => l >= 0 ? `faces/${l}` : '';
  // 미세먼지 한 칸 (팝업 · 알람 카드): {f 얼굴, lb 단계, m 할 일, g 4단계}
  function dustOf(a) {
    if (!a) return null;
    return a.lv >= 0 ? { f: face(a.lv), lb: L8[a.lv], m: M8[a.lv], g: a.g, lv: a.lv } : { f: face(F4[a.g]), lb: N4[a.g], m: M4[a.g], g: a.g, lv: F4[a.g] };
  }
  /* 미세먼지 큰 화면 (앱): 지금 값 · 항목별 표 · 오늘부터 3일 예보
   * {lv, f, lb, m, p10, p25, l10, l25(8단계 이름), st, w, t, x:[[이름, 값, 단위, 등급1~4]], fc:[[날짜, 등급]]} — 자료가 없으면 null */
  const GAS = [['k', '통합대기지수', ''], ['o3', '오존', 'ppm'], ['no2', '이산화질소', 'ppm'], ['co', '일산화탄소', 'ppm'], ['so2', '아황산가스', 'ppm']];
  function dustInfo(raw, now) {
    if (!raw) return null;
    const dk = keyD(now), a = air(raw, dk, now);
    const fcd = raw.a && raw.a.d ? Object.keys(raw.a.d).filter(k => k >= dk).sort().slice(0, 3) : [];
    if (!a && !fcd.length) return null;
    const q = (a && a.q) || {}, x = q.x || {}, d = dustOf(a) || { f: '', lb: '', m: '', g: 0, lv: -1 };
    const l10 = q.p10 != null ? lv8(q.p10, T10) : -1, l25 = q.p25 != null ? lv8(q.p25, T25) : -1;
    return Object.assign(d, {
      p10: q.p10 != null ? q.p10 : null, p25: q.p25 != null ? q.p25 : null, l10, l25, st: q.st || '', w: q.w || '', t: q.t || '',
      x: GAS.filter(([k]) => Array.isArray(x[k]) && x[k][0] != null).map(([k, n, u]) => [n, x[k][0], u, x[k][1] || 0]),
      fc: fcd.map(k => { const v = raw.a.d[k]; return [k, Math.max(v[0] || 0, v[1] || 0)]; })
    });
  }

  // 체감온도: 기온 10° 이하 · 바람 3m/s 이상이면 기상청 겨울 체감온도 식, 아니면 기온 그대로
  function feel(tp, ws) {
    if (tp == null) return null;
    const v = (ws || 0) * 3.6;
    if (tp > 10 || v < 10.8) return tp;   // 약한 바람(3m/s 아래)은 기온 그대로 (산들바람에 패딩 권하지 않게)
    return Math.round(13.12 + 0.6215 * tp - 11.37 * Math.pow(v, 0.16) + 0.3965 * Math.pow(v, 0.16) * tp);
  }
  // 옷차림 (출퇴근길 · 더 추운 쪽 체감온도 기준) + 챙길 것 (비 · 눈 · 바람 · 기온차 · 더위)
  // [체감 이상, 문구, 그림, 짧은 말]
  const CLOTH = [[28, '반팔 · 민소매 · 반바지', 'tshirt', '반팔'], [23, '반팔 · 얇은 셔츠', 'tshirt', '반팔'], [20, '얇은 긴팔 · 가디건', 'shirt', '얇은 긴팔'], [17, '얇은 니트 · 맨투맨', 'sweat', '맨투맨'], [12, '자켓 · 가디건', 'jacket', '자켓'], [9, '트렌치코트 · 야상', 'trench', '트렌치코트'], [5, '코트 · 히트텍', 'coat', '코트'], [-4, '패딩 · 목도리', 'pad_green', '패딩'], [-99, '두꺼운 패딩 · 목도리 · 장갑', 'pad_navy', '두꺼운 패딩']];
  const clothOf = f => CLOTH.find(c => f >= c[0]);
  // 한 칸 옷 (출근 · 퇴근 따로): {w 그림, ws 짧은 말, wt 문구}
  const wearOf = v => { if (!v || v.tp == null) return null; const c = clothOf(feel(v.tp, v.ws)); return { w: 'wear/' + c[2], ws: c[3], wt: c[1] }; };
  function outfit(vs) {
    vs = vs.filter(v => v && v.tp != null);
    if (!vs.length) return null;
    const fs = vs.map(v => feel(v.tp, v.ws)), f = Math.min(...fs), tps = vs.map(v => v.tp);
    const w = clothOf(f)[1];
    const x = [];
    const rain = vs.some(v => v.pty === 1 || v.pty === 4 || (v.pty === 0 && v.pop >= 60)), snow = vs.some(v => v.pty === 2 || v.pty === 3);
    const windy = vs.some(v => (v.ws || 0) >= 7), heavy = vs.some(v => (v.pcp || 0) >= 3);
    if (snow) x.push('❄️ 미끄럽지 않은 신발');
    if (rain) x.push(windy ? '☔ 우산이 뒤집힐 수 있어요 · 우비나 방수 겉옷' : heavy ? '☔ 큰 우산 · 젖어도 되는 신발' : '☂️ 우산');
    else if (windy) x.push('💨 바람 막는 겉옷');
    if (Math.max(...tps) - Math.min(...tps) >= 8) x.push('🧥 겹쳐 입기 (벗기 쉬운 겉옷)');
    if (Math.max(...tps) >= 30) x.push('💧 물 · 통풍 잘되는 옷');
    if (f <= 0 && !/장갑/.test(w)) x.push('🧤 장갑');
    return { w, f, x, o: `👕 ${w}`, ox: [`체감 ${f}°${fs.length > 1 && Math.max(...fs) !== f ? `~${Math.max(...fs)}°` : ''}`, ...x].join(' · ') };
  }

  // 챙길 것 (그림 + 이름, 3개까지): 비 · 눈 · 미세먼지 · 추위 · 더위 · 기온차 · 바람 차례
  function bring(vs, g, sunny) {
    vs = vs.filter(v => v && v.tp != null);
    const out = [], add = (i, n) => { if (!out.some(x => x.i === 'wear/' + i)) out.push({ i: 'wear/' + i, n }); };
    if (vs.length) {
      const fs = vs.map(v => feel(v.tp, v.ws)), f = Math.min(...fs), tps = vs.map(v => v.tp), hi = Math.max(...tps);
      const rain = vs.some(v => v.pty === 1 || v.pty === 4 || (v.pty === 0 && v.pop >= 60)), snow = vs.some(v => v.pty === 2 || v.pty === 3);
      const windy = vs.some(v => (v.ws || 0) >= 7), heavy = vs.some(v => (v.pcp || 0) >= 3);
      if (rain) { if (windy) add('raincoat', '우비'); else if (heavy) { add('umbrella', '큰 우산'); add('boots', '장화'); } else add('umbrella_fold', '우산'); }
      if (snow) add('boots', '미끄럼 조심 신발');
      if (g >= 3) add('mask', g >= 4 ? 'KF94 마스크' : '마스크');
      if (f <= 0) add('mittens', '장갑');
      if (f <= -5) { add('hotpack', '핫팩'); add('beanie', '비니'); }
      if (hi >= 30) { add('bottle', '물'); add('fan', '손풍기'); }
      if (sunny && hi >= 25 && !rain) add('sunscreen', '선크림');
      if (hi - Math.min(...tps) >= 8) add('cardigan', '얇은 겉옷');
      if (windy && !rain) add('jacket', '바람막이');
    } else if (g >= 3) add('mask', g >= 4 ? 'KF94 마스크' : '마스크');
    return out.slice(0, 3);
  }
  // "저녁 6시부터" (그 시각 · 한국 시간)
  const fromH = ms => { const h = kst(ms).h; return `${h < 6 ? '새벽' : h < 12 ? '아침' : h < 18 ? '오후' : '저녁'} ${h % 12 || 12}시부터`; };
  // 출근~퇴근 사이 처음 비/눈 오는 시각 (퇴근길에만 씀)
  function wetFrom(raw, s, e) {
    for (let t = Math.ceil(s / H) * H; t <= e; t += H) { const v = raw && raw.s && raw.s.h && raw.s.h[keyH(t)]; if (v && (v[2] > 0 || v[1] >= 60)) return t; }
    return null;
  }

  /* 출퇴근 날씨 (알람 카드 · 날씨만 알림 · 날짜 창 · 가족 팝업이 모두 이 모양을 씀)
   * home/work: 지역 자료(없으면 null) · o = {s:출근ms, e:퇴근ms, hn:'집 · 영통구', wn:'직장 · 동탄', now}
   * 돌려주는 것 {i 아이콘, h 한 줄 문구, hs 짧은 문구, t "출근 6° · 퇴근 12°", a 미세먼지 줄, an 미세먼지 수치, r:[줄 2개]} — 둘 다 예보가 없으면 null
   * 그림 화면용: k {t 결론, s 한마디, i 그림} · c:[출근 · 퇴근 칸 {l, p, sk, tp, d, w, ws, wt, hot, q}] · b:[챙길 것 {i, n}] · dz:[미세먼지 {p, n, f, lb, m, g}] */
  function commute(home, work, o) {
    const W = work || home;
    const vs = at(home, o.s), ve = at(W, o.e);
    if (!vs && !ve) return null;
    const ah = air(home, keyD(o.s), o.now), aw = work && work !== home ? air(work, keyD(o.e), o.now) : null;
    const a = aw && (!ah || aw.g > ah.g || (aw.g === ah.g && aw.lv > ah.lv)) ? aw : ah;   // 출근 · 퇴근 동네 중 나쁜 쪽
    const ws = wet(vs), we = wet(ve), sn = snowy(vs) || snowy(ve);
    let i, h, hs;
    if (ws || we) {
      const which = ws && we ? '출퇴근' : ws ? '출근' : '퇴근';
      i = sn ? '❄️' : '☔'; h = `${which}길 ${sn ? '눈' : '비'} 와요 · ${sn ? '미끄럼 조심해요' : '우산 챙겨요'}`; hs = `${which}길 ${sn ? '눈' : '비'} · ${sn ? '조심' : '우산'}`;
    } else if (a && a.g >= 3) {
      i = a.g >= 4 ? '😫' : '😷'; h = airHead(a); hs = a.g >= 4 ? '미세먼지 매우 나쁨 · KF94' : '미세먼지 나쁨 · 마스크';
    } else {
      const ts = [vs, ve].filter(Boolean).map(v => v.tp), lo = Math.min(...ts), hi = Math.max(...ts);
      if (vs && ve && Math.abs(vs.tp - ve.tp) >= 10) { i = '🧥'; h = '기온차가 커요, 외투 챙겨요'; hs = '기온차 커요 · 외투'; }
      else if (lo <= 0) { i = '🧣'; h = '많이 추워요 · 따뜻하게 입어요'; hs = '추워요 · 따뜻하게'; }
      else if (hi >= 30) { i = '🥵'; h = '오늘 더워요 · 물 챙겨요'; hs = '더워요 · 물 챙겨요'; }
      else if ([vs, ve].filter(Boolean).every(v => v.sky <= 1)) { i = '☀️'; h = '출퇴근길 맑아요'; hs = '맑아요'; }
      else { i = (ve || vs).sky >= 4 ? '☁️' : '⛅'; h = '무난한 날씨예요'; hs = '무난해요'; }
    }
    // q: 그 줄을 누르면 열 날씨 페이지 검색어 (출근 = 집, 퇴근 = 직장)
    const row = (l, ms, pl, v, sq) => Object.assign(v ? { l: `${l} ${hm(ms)}`, p: pl || '', i: icon(v), tp: v.tp, d: desc(v), pop: v.pop, pcp: v.pcp, ws: v.ws, reh: v.reh, tag: wet(v) ? (snowy(v) ? '조심' : '우산') : '' } : { l: `${l} ${hm(ms)}`, p: pl || '', i: '', tp: null, d: '예보 없음' }, sq ? { q: sq } : {});
    const place = s => String(s || '').split(' · ').pop();
    const card = (l, ms, v, pl, sq) => {
      const x = { l: `${l} ${hm(ms)}`, p: place(pl), sk: sky(v, ms), tp: v ? v.tp : null, d: !v ? '예보 없음' : wet(v) ? `${snowy(v) ? '눈' : '비'} ${v.pop}%` : `체감 ${feel(v.tp, v.ws)}°`, hot: wet(v) };
      return Object.assign(x, wearOf(v) || {}, sq ? { q: sq } : {});
    };
    const c = [card('출근', o.s, vs, o.hn, o.hq), card('퇴근', o.e, ve, o.wn, o.wq || o.hq)];
    const dz = [];
    const dh = dustOf(ah), dw = dustOf(aw);
    if (dh) dz.push(Object.assign({ p: '출근', n: place(o.hn) }, dh));
    if (dw) dz.push(Object.assign({ p: '퇴근', n: place(o.wn) }, dw));
    const worst = dz.slice().sort((x, y) => y.g - x.g || y.lv - x.lv)[0];
    const sunny = [vs, ve].filter(Boolean).every(v => v.sky <= 1 && !wet(v));
    // 한 줄 결론 (그림 + 큰 글씨 + 한마디)
    let k;
    if (ws || we) {
      const which = ws && we ? '출퇴근' : ws ? '출근' : '퇴근', fr = !ws && we ? wetFrom(W, o.s, o.e) : null;
      k = sn ? { t: `${which}길에 눈 와요`, s: '미끄럼 조심해요', i: 'sky/snow' } : { t: `${which}길에 비 와요`, s: `우산 챙기세요${fr ? ' · ' + fromH(fr) : ''}`, i: 'wear/umbrella' };
    } else if (worst && worst.g >= 3) {
      k = { t: `미세먼지 ${worst.lb}`, s: dz.length > 1 && dz[0].g !== dz[1].g ? `${worst.p}길(${worst.n}) ${worst.m}` : worst.m, i: worst.f };
    } else {
      const vv = [vs, ve].filter(Boolean), cold = vv.slice().sort((x, y) => x.tp - y.tp)[0], cw = cold === vs ? '출근' : '퇴근';
      if (vs && ve && Math.abs(vs.tp - ve.tp) >= 10) k = { t: '기온차가 커요', s: '벗기 쉬운 겉옷 챙기세요', i: 'wear/cardigan' };
      else if (cold.tp <= 0) k = { t: `${cw}길 ${cold.tp < 0 ? '영하 ' + (-cold.tp) : 0}°`, s: '따뜻하게 입으세요', i: 'wear/scarf_red' };
      else if (Math.max(...vv.map(v => v.tp)) >= 30) k = { t: '오늘 더워요', s: '물 챙기세요', i: 'wear/bottle' };
      else k = { t: sunny ? '출퇴근길 맑아요' : '무난한 날씨예요', s: '', i: (c[1].sk || c[0].sk) };
      if (!k.s) { const wv = c.find(x => x.ws); if (wv) k.s = `${wv.ws} 입으세요`; }
    }
    return {
      i, h, hs,
      t: [vs ? `출근 ${vs.tp}°` : '', ve ? `퇴근 ${ve.tp}°` : ''].filter(Boolean).join(' · '),
      a: airLine(a), an: airNums(a), ag: a ? a.g : 0,
      r: [row('출근', o.s, o.hn, vs, o.hq), row('퇴근', o.e, o.wn, ve, o.wq || o.hq)],
      ...((oc => oc ? { o: oc.o, ox: oc.ox, ol: '출퇴근길' } : {})(outfit([vs, ve]))),
      k, c, b: bring([vs, ve], a ? a.g : 0, sunny), dz,
      src: srcLine(home, work)
    };
  }
  // 쉬는 날 · 근무 시간이 없는 날: 하루 요약 (오전 · 오후)
  function dayCard(home, dk, o) {
    const d = day(home, dk); if (!d) return null;
    const a = air(home, dk, o && o.now);
    let i = d.i, h, hs;
    if (d.wet) { h = `${d.am && d.am.wet && !(d.pm && d.pm.wet) ? '오전에' : d.pm && d.pm.wet && !(d.am && d.am.wet) ? '오후에' : ''} ${d.snow ? '눈' : '비'} 소식 있어요`.trim(); hs = d.snow ? '눈 소식' : '비 소식'; }
    else if (a && a.g >= 3) { i = a.g >= 4 ? '😫' : '😷'; h = airHead(a); hs = '미세먼지 나쁨'; }
    else if (d.hi >= 30) { h = '더운 날이에요'; hs = '더워요'; }
    else if (d.lo <= 0) { h = '추운 날이에요'; hs = '추워요'; }
    else if (d.hi - d.lo >= 10) { h = '일교차가 커요'; hs = '일교차 커요'; }
    else { h = d.i === '☀️' ? '맑은 날이에요' : '무난한 날씨예요'; hs = d.i === '☀️' ? '맑아요' : '무난해요'; }
    const half = (l, x) => x ? Object.assign({ l, p: '', i: x.i, tp: null, d: x.d, pop: x.pop, tag: x.wet ? (x.snow ? '조심' : '우산') : '' }, o && o.hq ? { q: o.hq } : {}) : null;
    // 쉬는 날 옷차림: 최저 · 최고 기온 + 비/눈 (바람은 하루 평균이 없어서 기온으로만)
    const oc = d.lo != null && d.hi != null ? outfit([{ tp: d.lo, pty: d.snow ? 3 : 0, pop: d.wet ? 60 : 0 }, { tp: d.hi, pty: 0, pop: 0 }]) : null;
    // 그림 화면용: 오전 = 최저 · 오후 = 최고 기온 칸
    const hv = (x, tp) => x ? { tp, pty: x.snow ? 3 : x.wet ? 1 : 0, pop: x.pop || 0 } : null;
    const cd = (l, x, tp) => x ? Object.assign({ l, p: '', sk: x.sk || '', tp: tp != null ? tp : null, d: x.wet ? `${x.snow ? '눈' : '비'} ${x.pop}%` : x.d, hot: !!x.wet }, wearOf(hv(x, tp)) || {}, o && o.hq ? { q: o.hq } : {}) : null;
    const c = [cd('오전', d.am, d.lo), cd('오후', d.pm, d.hi)].filter(Boolean);
    const dd = dustOf(a), dz = dd ? [Object.assign({ p: '', n: '' }, dd)] : [];
    const k = d.wet ? { t: h, s: d.snow ? '미끄럼 조심해요' : '우산 챙기세요', i: d.snow ? 'sky/snow' : 'wear/umbrella' }
      : dd && dd.g >= 3 ? { t: `미세먼지 ${dd.lb}`, s: dd.m, i: dd.f }
      : { t: h, s: c.length && c[0].ws ? `${c[0].ws} 입으세요` : '', i: d.hi >= 30 ? 'wear/bottle' : d.lo <= 0 ? 'wear/scarf_red' : d.sk || '' };
    const sunny = [d.am, d.pm].filter(Boolean).every(x => x.sk === 'sky/sun');
    return { i, h, hs, t: d.lo != null && d.hi != null ? `${d.lo}° ~ ${d.hi}°` : '', a: airLine(a), an: airNums(a), ag: a ? a.g : 0, r: [half('오전', d.am), half('오후', d.pm)].filter(Boolean), ...(oc ? { o: oc.o, ox: oc.ox, ol: '오늘 하루' } : {}),
      k, c, b: bring(c.length ? [hv(d.am, d.lo), hv(d.pm, d.hi)] : [], a ? a.g : 0, sunny), dz, day: d, src: srcLine(home, null, d.src) };
  }
  function srcLine(h, w, only) {
    const x = h && h.s && h.s.b, m = h && h.m && h.m.b;
    const t = b => b ? `${+b.slice(8, 10)}시 발표` : '';
    const parts = [];
    if (only !== 'm' && x) parts.push(`기상청 단기예보 ${t(x)}`);
    if (only === 'm' && m) parts.push(`기상청 중기예보 ${t(m)}`);
    if ((h && (h.a || h.q))) parts.push('에어코리아');
    return parts.join(' · ');
  }
  // 가족 카드 한 칸: 출근 · 퇴근 앞뒤 2시간 안에만 (예 "☔ 퇴근 12° 비") — 아니면 null
  function brief(home, work, o) {
    const now = o.now, near = t => Math.abs(now - t) <= 2 * H;
    const useE = near(o.e) && (!near(o.s) || Math.abs(now - o.e) < Math.abs(now - o.s));
    if (!useE && !near(o.s)) return null;
    const v = useE ? at(work || home, o.e) : at(home, o.s);
    if (!v) return null;
    const a = air(home, keyD(useE ? o.e : o.s), now);
    const bad = a && a.g >= 3;
    return { sk: bad && !wet(v) ? dustOf(a).f : sky(v, useE ? o.e : o.s), i: wet(v) ? (snowy(v) ? '❄️' : '☔') : bad ? '😷' : icon(v), t: `${useE ? '퇴근' : '출근'} ${v.tp}°${wet(v) ? (snowy(v) ? ' 눈' : ' 비') : bad ? ' 마스크' : ''}`, wet: wet(v), bad: !!bad };
  }
  const naver = q => `https://m.search.naver.com/search.naver?query=${encodeURIComponent(String(q || '').trim() + ' 날씨')}`;
  // 지난 날짜 관측 한 줄: "☔ 6°~12° · 비 8mm" / "❄️ … · 눈 3cm" / "🌡 6°~12°"
  function pastLine(p) {
    if (!p) return null;
    const [mn, mx, rn, sn] = p, t = mn != null && mx != null ? `${mn}°~${mx}°` : mn != null ? `최저 ${mn}°` : `최고 ${mx}°`;
    if (sn > 0) return { i: '❄️', sk: 'sky/snow', t: `${t} · 눈 ${sn}cm` };
    if (rn >= 0.5) return { i: '☔', sk: 'sky/rain', t: `${t} · 비 ${rn >= 1 ? Math.round(rn) : rn}mm` };
    return { i: '🌡', t };
  }
  return { naver, pastLine, keyD, keyH, hm, kst, at, day, air, airLine, airNums, commute, dayCard, brief, wfIcon, icon, desc, G10, G25, feel, outfit, sky, skyT, dustOf, dustInfo, bring, wearOf, L8 };
});

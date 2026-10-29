/* 날씨 공통 계산 (서버 함수 · 앱 화면이 똑같은 파일을 씀 — 앱은 index.html 의 WXCORE 블록에 그대로 복사, 시험이 같은지 확인)
 * 자료 모양 (서버 /wx?r=지역번호 가 돌려주는 것):
 *   s: 단기예보 {b:발표, h:{'YYYYMMDDHH':[기온,강수확률,강수형태,하늘,강수량mm,풍속,습도]}, n:{'YYYYMMDD':[최저,최고]}}
 *   m: 중기예보 {b:발표, d:{'YYYYMMDD':[오전날씨,오전비%,오후날씨,오후비%,최저,최고]}}
 *   a: 미세먼지 예보 {b:발표, d:{'YYYYMMDD':[미세 등급,초미세 등급]}}  (1 좋음 · 2 보통 · 3 나쁨 · 4 매우나쁨)
 *   q: 미세먼지 지금 {t:'YYYY-MM-DD HH:mm', p10, p25, w:'경기'(평균 낸 시·도)}
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
        return o && { i: icon(o), d: desc(o), pop: o.pop, wet: wet(o), snow: snowy(o) };
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
      const mk = (w, r) => w ? { i: r >= 60 && !/비|눈|소나기/.test(w) ? '☔' : wfIcon(w), d: w, pop: r || 0, wet: /비|눈|소나기/.test(w) || r >= 60, snow: /눈/.test(w) } : null;
      return finDay({ am: mk(m[0], m[1]), pm: mk(m[2], m[3]), lo: m[4], hi: m[5], src: 'm' });
    }
    return null;
  }
  function finDay(o) {
    const w = [o.am, o.pm].filter(Boolean);
    o.wet = w.some(x => x.wet); o.snow = w.some(x => x.snow);
    o.i = o.snow ? '❄️' : o.wet ? '☔' : (o.pm || o.am).i;
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
    const gf = f ? Math.max(f[0] || 0, f[1] || 0) : 0, gq = lv >= 0 ? g4of8(lv) : 0;
    const g = Math.max(gf, gq);
    if (!g) return null;
    return { g, f: f || null, q, lv };
  }
  // 한 줄: "😷 미세먼지 나쁨 · KF80 마스크 챙겨요" (오늘은 지금 값 8단계, 다른 날은 예보 4단계 · 예보가 더 나쁘면 예보)
  function airLine(a) {
    if (!a) return '';
    if (a.lv >= 0 && g4of8(a.lv) >= a.g) return `${E8[a.lv]} 미세먼지 ${L8[a.lv]} · ${M8[a.lv]}`;
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

  // 체감온도: 기온 10° 이하 · 바람 3m/s 이상이면 기상청 겨울 체감온도 식, 아니면 기온 그대로
  function feel(tp, ws) {
    if (tp == null) return null;
    const v = (ws || 0) * 3.6;
    if (tp > 10 || v < 10.8) return tp;   // 약한 바람(3m/s 아래)은 기온 그대로 (산들바람에 패딩 권하지 않게)
    return Math.round(13.12 + 0.6215 * tp - 11.37 * Math.pow(v, 0.16) + 0.3965 * Math.pow(v, 0.16) * tp);
  }
  // 옷차림 (출퇴근길 · 더 추운 쪽 체감온도 기준) + 챙길 것 (비 · 눈 · 바람 · 기온차 · 더위)
  const CLOTH = [[28, '반팔 · 민소매 · 반바지'], [23, '반팔 · 얇은 셔츠'], [20, '얇은 긴팔 · 가디건'], [17, '얇은 니트 · 맨투맨'], [12, '자켓 · 가디건'], [9, '트렌치코트 · 야상'], [5, '코트 · 히트텍'], [-4, '패딩 · 목도리'], [-99, '두꺼운 패딩 · 목도리 · 장갑']];
  function outfit(vs) {
    vs = vs.filter(v => v && v.tp != null);
    if (!vs.length) return null;
    const fs = vs.map(v => feel(v.tp, v.ws)), f = Math.min(...fs), tps = vs.map(v => v.tp);
    const w = CLOTH.find(c => f >= c[0])[1];
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

  /* 출퇴근 날씨 (알람 카드 · 날씨만 알림 · 날짜 창 · 가족 팝업이 모두 이 모양을 씀)
   * home/work: 지역 자료(없으면 null) · o = {s:출근ms, e:퇴근ms, hn:'집 · 영통구', wn:'직장 · 동탄', now}
   * 돌려주는 것 {i 아이콘, h 한 줄 문구, hs 짧은 문구, t "출근 6° · 퇴근 12°", a 미세먼지 줄, an 미세먼지 수치, r:[줄 2개]} — 둘 다 예보가 없으면 null */
  function commute(home, work, o) {
    const W = work || home;
    const vs = at(home, o.s), ve = at(W, o.e);
    if (!vs && !ve) return null;
    const a = air(home, keyD(o.s), o.now);
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
    return {
      i, h, hs,
      t: [vs ? `출근 ${vs.tp}°` : '', ve ? `퇴근 ${ve.tp}°` : ''].filter(Boolean).join(' · '),
      a: airLine(a), an: airNums(a), ag: a ? a.g : 0,
      r: [row('출근', o.s, o.hn, vs, o.hq), row('퇴근', o.e, o.wn, ve, o.wq || o.hq)],
      ...((oc => oc ? { o: oc.o, ox: oc.ox, ol: '출퇴근길' } : {})(outfit([vs, ve]))),
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
    return { i, h, hs, t: d.lo != null && d.hi != null ? `${d.lo}° ~ ${d.hi}°` : '', a: airLine(a), an: airNums(a), ag: a ? a.g : 0, r: [half('오전', d.am), half('오후', d.pm)].filter(Boolean), ...(oc ? { o: oc.o, ox: oc.ox, ol: '오늘 하루' } : {}), day: d, src: srcLine(home, null, d.src) };
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
    return { i: wet(v) ? (snowy(v) ? '❄️' : '☔') : bad ? '😷' : icon(v), t: `${useE ? '퇴근' : '출근'} ${v.tp}°${wet(v) ? (snowy(v) ? ' 눈' : ' 비') : bad ? ' 마스크' : ''}`, wet: wet(v), bad: !!bad };
  }
  const naver = q => `https://m.search.naver.com/search.naver?query=${encodeURIComponent(String(q || '').trim() + ' 날씨')}`;
  // 지난 날짜 관측 한 줄: "☔ 6°~12° · 비 8mm" / "❄️ … · 눈 3cm" / "🌡 6°~12°"
  function pastLine(p) {
    if (!p) return null;
    const [mn, mx, rn, sn] = p, t = mn != null && mx != null ? `${mn}°~${mx}°` : mn != null ? `최저 ${mn}°` : `최고 ${mx}°`;
    if (sn > 0) return { i: '❄️', t: `${t} · 눈 ${sn}cm` };
    if (rn >= 0.5) return { i: '☔', t: `${t} · 비 ${rn >= 1 ? Math.round(rn) : rn}mm` };
    return { i: '🌡', t };
  }
  return { naver, pastLine, keyD, keyH, hm, kst, at, day, air, airLine, airNums, commute, dayCard, brief, wfIcon, icon, desc, G10, G25, feel, outfit };
});

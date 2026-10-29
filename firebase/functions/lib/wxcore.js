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

  // 미세먼지: 그날 예보 등급(미세 · 초미세 중 나쁜 쪽) · 오늘이면 지금 측정값도
  function air(raw, dk, now) {
    if (!raw) return null;
    const f = raw.a && raw.a.d && raw.a.d[dk];
    const q = raw.q && now != null && dk === keyD(now) && raw.q.p10 != null ? raw.q : null;
    if (!f && !q) return null;
    const g = f ? Math.max(f[0] || 0, f[1] || 0) : Math.max(G10(q.p10), G25(q.p25));
    if (!g) return null;
    return { g, f: f || null, q };
  }
  function airLine(a) {
    if (!a) return '';
    if (a.g >= 4) return '😷 미세먼지 매우 나쁨 · 마스크 꼭 챙겨요';
    if (a.g >= 3) return '😷 미세먼지 나쁨 · 마스크 챙겨요';
    if (a.g === 1) return '🌿 공기 맑아요 · 미세먼지 좋음';
    return '미세먼지 보통';
  }
  // 큰 팝업용 수치: "미세 42 보통 · 초미세 18 보통 (지금 · 경기 평균)" / 예보만 있으면 "미세 보통 · 초미세 좋음 (예보)"
  function airNums(a) {
    if (!a) return '';
    if (a.q) return `미세 ${a.q.p10 != null ? a.q.p10 + '㎍/㎥ ' : ''}${GN[G10(a.q.p10)]} · 초미세 ${a.q.p25 != null ? a.q.p25 + '㎍/㎥ ' : ''}${GN[G25(a.q.p25)]} (지금${a.q.w ? ' · ' + a.q.w + ' 평균' : ''})`;
    return `미세 ${GN[a.f[0]] || '-'} · 초미세 ${GN[a.f[1]] || '-'} (예보)`;
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
      i = '😷'; h = a.g >= 4 ? '미세먼지 매우 나쁨 · 마스크 꼭 챙겨요' : '미세먼지 나쁨 · 마스크 챙겨요'; hs = '미세먼지 나쁨 · 마스크';
    } else {
      const ts = [vs, ve].filter(Boolean).map(v => v.tp), lo = Math.min(...ts), hi = Math.max(...ts);
      if (vs && ve && Math.abs(vs.tp - ve.tp) >= 10) { i = '🧥'; h = '기온차가 커요, 외투 챙겨요'; hs = '기온차 커요 · 외투'; }
      else if (lo <= 0) { i = '🧣'; h = '많이 추워요 · 따뜻하게 입어요'; hs = '추워요 · 따뜻하게'; }
      else if (hi >= 30) { i = '🥵'; h = '오늘 더워요 · 물 챙겨요'; hs = '더워요 · 물 챙겨요'; }
      else if ([vs, ve].filter(Boolean).every(v => v.sky <= 1)) { i = '☀️'; h = '출퇴근길 맑아요'; hs = '맑아요'; }
      else { i = (ve || vs).sky >= 4 ? '☁️' : '⛅'; h = '무난한 날씨예요'; hs = '무난해요'; }
    }
    const row = (l, ms, pl, v) => v ? { l: `${l} ${hm(ms)}`, p: pl || '', i: icon(v), tp: v.tp, d: desc(v), pop: v.pop, pcp: v.pcp, ws: v.ws, reh: v.reh, tag: wet(v) ? (snowy(v) ? '조심' : '우산') : '' } : { l: `${l} ${hm(ms)}`, p: pl || '', i: '', tp: null, d: '예보 없음' };
    return {
      i, h, hs,
      t: [vs ? `출근 ${vs.tp}°` : '', ve ? `퇴근 ${ve.tp}°` : ''].filter(Boolean).join(' · '),
      a: airLine(a), an: airNums(a), ag: a ? a.g : 0,
      r: [row('출근', o.s, o.hn, vs), row('퇴근', o.e, o.wn, ve)],
      src: srcLine(home, work)
    };
  }
  // 쉬는 날 · 근무 시간이 없는 날: 하루 요약 (오전 · 오후)
  function dayCard(home, dk, o) {
    const d = day(home, dk); if (!d) return null;
    const a = air(home, dk, o && o.now);
    let i = d.i, h, hs;
    if (d.wet) { h = `${d.am && d.am.wet && !(d.pm && d.pm.wet) ? '오전에' : d.pm && d.pm.wet && !(d.am && d.am.wet) ? '오후에' : ''} ${d.snow ? '눈' : '비'} 소식 있어요`.trim(); hs = d.snow ? '눈 소식' : '비 소식'; }
    else if (a && a.g >= 3) { i = '😷'; h = '미세먼지 나쁨 · 마스크 챙겨요'; hs = '미세먼지 나쁨'; }
    else if (d.hi >= 30) { h = '더운 날이에요'; hs = '더워요'; }
    else if (d.lo <= 0) { h = '추운 날이에요'; hs = '추워요'; }
    else if (d.hi - d.lo >= 10) { h = '일교차가 커요'; hs = '일교차 커요'; }
    else { h = d.i === '☀️' ? '맑은 날이에요' : '무난한 날씨예요'; hs = d.i === '☀️' ? '맑아요' : '무난해요'; }
    const half = (l, x) => x ? { l, p: '', i: x.i, tp: null, d: x.d, pop: x.pop, tag: x.wet ? (x.snow ? '조심' : '우산') : '' } : null;
    return { i, h, hs, t: d.lo != null && d.hi != null ? `${d.lo}° ~ ${d.hi}°` : '', a: airLine(a), an: airNums(a), ag: a ? a.g : 0, r: [half('오전', d.am), half('오후', d.pm)].filter(Boolean), day: d, src: srcLine(home, null, d.src) };
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
  return { keyD, keyH, hm, kst, at, day, air, airLine, airNums, commute, dayCard, brief, wfIcon, icon, desc, G10, G25 };
});

/* ================= 출퇴근 날씨 (부가 기능 wx · 기본 꺼짐) =================
 * 서버 함수(/wx)가 기상청 단기 · 중기예보 + 에어코리아 미세먼지를 지역별로 모아 둠 → 앱은 지역 번호(시 · 군 · 구)만 보내서 받아 옴
 * 계산(문구 · 아이콘 · 수치)은 위 WXCORE(WX) 를 씀 — 서버 · 알람 화면과 같은 문구
 * S.wx = {home:'집 지역 번호', work:'직장 지역 번호', fw:{가족id: 그 가족 직장 지역 (보는 사람이 정함)}}
 * 알람: a.wx (끄면 날씨 카드 · 기본 켬) · a.wxOnly (울리지 않고 날씨 알림만) */
const WX_REG=[["11110","서울","종로구"],["11140","서울","중구"],["11170","서울","용산구"],["11200","서울","성동구"],["11215","서울","광진구"],["11230","서울","동대문구"],["11260","서울","중랑구"],["11290","서울","성북구"],["11305","서울","강북구"],["11320","서울","도봉구"],["11350","서울","노원구"],["11380","서울","은평구"],["11410","서울","서대문구"],["11440","서울","마포구"],["11470","서울","양천구"],["11500","서울","강서구"],["11530","서울","구로구"],["11545","서울","금천구"],["11560","서울","영등포구"],["11590","서울","동작구"],["11620","서울","관악구"],["11650","서울","서초구"],["11680","서울","강남구"],["11710","서울","송파구"],["11740","서울","강동구"],["12110","전남광주","목포시"],["12130","전남광주","여수시"],["12150","전남광주","순천시"],["12170","전남광주","나주시"],["12190","전남광주","광양시"],["12210","전남광주","동구"],["12240","전남광주","서구"],["12270","전남광주","남구"],["12300","전남광주","북구"],["12330","전남광주","광산구"],["12710","전남광주","담양군"],["12720","전남광주","곡성군"],["12730","전남광주","구례군"],["12740","전남광주","고흥군"],["12750","전남광주","보성군"],["12760","전남광주","화순군"],["12770","전남광주","장흥군"],["12780","전남광주","강진군"],["12790","전남광주","해남군"],["12800","전남광주","영암군"],["12810","전남광주","무안군"],["12820","전남광주","함평군"],["12830","전남광주","영광군"],["12840","전남광주","장성군"],["12850","전남광주","완도군"],["12860","전남광주","진도군"],["12870","전남광주","신안군"],["26110","부산","중구"],["26140","부산","서구"],["26170","부산","동구"],["26200","부산","영도구"],["26230","부산","부산진구"],["26260","부산","동래구"],["26290","부산","남구"],["26320","부산","북구"],["26350","부산","해운대구"],["26380","부산","사하구"],["26410","부산","금정구"],["26440","부산","강서구"],["26470","부산","연제구"],["26500","부산","수영구"],["26530","부산","사상구"],["26710","부산","기장군"],["27110","대구","중구"],["27140","대구","동구"],["27170","대구","서구"],["27200","대구","남구"],["27230","대구","북구"],["27260","대구","수성구"],["27290","대구","달서구"],["27710","대구","달성군"],["27720","대구","군위군"],["28125","인천","제물포구"],["28155","인천","영종구"],["28177","인천","미추홀구"],["28185","인천","연수구"],["28200","인천","남동구"],["28237","인천","부평구"],["28245","인천","계양구"],["28275","인천","서해구"],["28290","인천","검단구"],["28710","인천","강화군"],["28720","인천","옹진군"],["30110","대전","동구"],["30140","대전","중구"],["30170","대전","서구"],["30200","대전","유성구"],["30230","대전","대덕구"],["31110","울산","중구"],["31140","울산","남구"],["31170","울산","동구"],["31200","울산","북구"],["31710","울산","울주군"],["36110","세종","세종시"],["41111","경기","수원시 장안구"],["41113","경기","수원시 권선구"],["41115","경기","수원시 팔달구"],["41117","경기","수원시 영통구"],["41131","경기","성남시 수정구"],["41133","경기","성남시 중원구"],["41135","경기","성남시 분당구"],["41150","경기","의정부시"],["41171","경기","안양시 만안구"],["41173","경기","안양시 동안구"],["41192","경기","부천시 원미구"],["41194","경기","부천시 소사구"],["41196","경기","부천시 오정구"],["41210","경기","광명시"],["41220","경기","평택시"],["41250","경기","동두천시"],["41271","경기","안산시 상록구"],["41273","경기","안산시 단원구"],["41281","경기","고양시 덕양구"],["41285","경기","고양시 일산동구"],["41287","경기","고양시 일산서구"],["41290","경기","과천시"],["41310","경기","구리시"],["41360","경기","남양주시"],["41370","경기","오산시"],["41390","경기","시흥시"],["41410","경기","군포시"],["41430","경기","의왕시"],["41450","경기","하남시"],["41461","경기","용인시 처인구"],["41463","경기","용인시 기흥구"],["41465","경기","용인시 수지구"],["41480","경기","파주시"],["41500","경기","이천시"],["41550","경기","안성시"],["41570","경기","김포시"],["41591","경기","화성시 만세구"],["41593","경기","화성시 효행구"],["41595","경기","화성시 병점구"],["41597","경기","화성시 동탄구"],["41610","경기","광주시"],["41630","경기","양주시"],["41650","경기","포천시"],["41670","경기","여주시"],["41800","경기","연천군"],["41820","경기","가평군"],["41830","경기","양평군"],["43111","충북","청주시 상당구"],["43112","충북","청주시 서원구"],["43113","충북","청주시 흥덕구"],["43114","충북","청주시 청원구"],["43130","충북","충주시"],["43150","충북","제천시"],["43720","충북","보은군"],["43730","충북","옥천군"],["43740","충북","영동군"],["43745","충북","증평군"],["43750","충북","진천군"],["43760","충북","괴산군"],["43770","충북","음성군"],["43800","충북","단양군"],["44131","충남","천안시 동남구"],["44133","충남","천안시 서북구"],["44150","충남","공주시"],["44180","충남","보령시"],["44200","충남","아산시"],["44210","충남","서산시"],["44230","충남","논산시"],["44250","충남","계룡시"],["44270","충남","당진시"],["44710","충남","금산군"],["44760","충남","부여군"],["44770","충남","서천군"],["44790","충남","청양군"],["44800","충남","홍성군"],["44810","충남","예산군"],["44825","충남","태안군"],["47111","경북","포항시 남구"],["47113","경북","포항시 북구"],["47130","경북","경주시"],["47150","경북","김천시"],["47170","경북","안동시"],["47190","경북","구미시"],["47210","경북","영주시"],["47230","경북","영천시"],["47250","경북","상주시"],["47280","경북","문경시"],["47290","경북","경산시"],["47730","경북","의성군"],["47750","경북","청송군"],["47760","경북","영양군"],["47770","경북","영덕군"],["47820","경북","청도군"],["47830","경북","고령군"],["47840","경북","성주군"],["47850","경북","칠곡군"],["47900","경북","예천군"],["47920","경북","봉화군"],["47930","경북","울진군"],["47940","경북","울릉군"],["48121","경남","창원시 의창구"],["48123","경남","창원시 성산구"],["48125","경남","창원시 마산합포구"],["48127","경남","창원시 마산회원구"],["48129","경남","창원시 진해구"],["48170","경남","진주시"],["48220","경남","통영시"],["48240","경남","사천시"],["48250","경남","김해시"],["48270","경남","밀양시"],["48310","경남","거제시"],["48330","경남","양산시"],["48720","경남","의령군"],["48730","경남","함안군"],["48740","경남","창녕군"],["48820","경남","고성군"],["48840","경남","남해군"],["48850","경남","하동군"],["48860","경남","산청군"],["48870","경남","함양군"],["48880","경남","거창군"],["48890","경남","합천군"],["50110","제주","제주시"],["50130","제주","서귀포시"],["51110","강원","춘천시"],["51130","강원","원주시"],["51150","강원","강릉시"],["51170","강원","동해시"],["51190","강원","태백시"],["51210","강원","속초시"],["51230","강원","삼척시"],["51720","강원","홍천군"],["51730","강원","횡성군"],["51750","강원","영월군"],["51760","강원","평창군"],["51770","강원","정선군"],["51780","강원","철원군"],["51790","강원","화천군"],["51800","강원","양구군"],["51810","강원","인제군"],["51820","강원","고성군"],["51830","강원","양양군"],["52111","전북","전주시 완산구"],["52113","전북","전주시 덕진구"],["52130","전북","군산시"],["52140","전북","익산시"],["52180","전북","정읍시"],["52190","전북","남원시"],["52210","전북","김제시"],["52710","전북","완주군"],["52720","전북","진안군"],["52730","전북","무주군"],["52740","전북","장수군"],["52750","전북","임실군"],["52770","전북","순창군"],["52790","전북","고창군"],["52800","전북","부안군"]];
const WX_BY=new Map(WX_REG.map(r=>[r[0],r]));
// 지역 번호: 시·군·구 5자리 또는 동 10자리(앞 5자리 = 시·군·구). 동 이름은 고를 때 S.wx.nm 에 적어 둠 (가족이 보낸 동은 서버가 준 이름)
const wxReg=c=>WX_BY.get(String(c||'').slice(0,5));
const wxOk=c=>typeof c==='string'&&(WX_BY.has(c)||(/^\d{10}$/.test(c)&&WX_BY.has(c.slice(0,5))));
const wxDn=c=>{if(!/^\d{10}$/.test(c||''))return '';const n=(S.wx&&S.wx.nm||{})[c];if(n)return n;const d=wxRaw(c);return d&&typeof d.n==='string'?d.n.split(' ').pop():'';};
const wxName=c=>{const r=wxReg(c);if(!r||!wxOk(c))return '';return wxDn(c)||r[2];};   // 짧게: "연무동" · "수원시 장안구"
const wxFull=c=>{const r=wxReg(c);if(!r||!wxOk(c))return '';const d=wxDn(c);return `${r[1]} ${r[2]}${d?' '+d:''}`;};
const wxOn=()=>ad('wx')&&!!(S.wx&&wxOk(S.wx.home));
const WX_URL=(()=>{try{const p=window.FIREBASE_CONFIG&&window.FIREBASE_CONFIG.projectId;return p?`https://asia-northeast3-${p}.cloudfunctions.net/wx`:'';}catch(e){return '';}})();
const WX_KEY='eonjeswieo:wx';
let wxC=null,wxBusy=false,wxLast=0;
function wxCache(){if(!wxC){try{wxC=JSON.parse(localStorage.getItem(WX_KEY)||'{}');if(!isObj(wxC))wxC={};}catch(e){wxC={};}}return wxC;}
function wxRaw(c){const x=c&&wxCache()[c];return x&&isObj(x.d)?x.d:null;}
const wxStamp=ms=>{const k=WX.kst(ms),p=n=>String(n).padStart(2,'0');return `${k.y}${p(k.mo)}${p(k.d)}${p(k.h)}${p(k.mi)}`;};
// 근무 시간: 기본값(대략)은 근무 이름으로 짐작 (가족이 시간을 안 보냈을 때)
function wxDefTimes(nm){nm=String(nm||'');if(/야|夜|night/i.test(nm))return ['19:00','07:00'];if(/주간|^주|주$/.test(nm))return ['07:00','19:00'];if(/당직|24/.test(nm))return ['09:00','09:00'];return ['09:00','18:00'];}
function wxSpan(d,st,en){const b=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(),s=tm2m(st);let e=tm2m(en);if(e<=s)e+=1440;return {s:b+s*60000,e:b+e*60000};}
// 나: 그날 근무가 있으면 출근 · 퇴근 시각 (쉬는 날 · 개인 캘린더 기간이면 null)
function wxMyWin(d){const k=shiftOf(d);if(!S.myset||isRest(k)||persOn(fmt(d))||!timesCustom(k))return null;   /* v0.171 시간을 안 정한 근무는 짐작 안 함 → 집 날씨 하루 */try{const p=dayPlan(d,k);return {s:p.start,e:p.end,k};}catch(e){return null;}}
// 가족: 직접 추가한 교대 가족 = 내 근무 시간표 · 근무표를 올린 가족 = 그 사람이 보낸 시간(없으면 이름으로 짐작)
function wxMemWin(m,d){
  if(m.kind==='shift'){const sh=famShift(m,d);if(!sh||isRest(sh)||!timesCustom(sh))return null;const t=timesOf(sh);return wxSpan(d,t.start,t.end);}
  if(m.kind==='sched'&&m.sch){const sh=schShift(m.sch,d);if(!sh||schRest(m.sch,sh))return null;
    const o=m.sch.ot&&m.sch.ot[fmt(d)],tm=(m.sch.tm&&m.sch.tm[sh])||(m.sch.wx&&m.sch.wx.tm&&m.sch.wx.tm[sh]);
    const t=o||tm;if(!t)return null;return wxSpan(d,t[0],t[1]);}   // v0.171 시간을 안 보냈으면 짐작 안 함
  if(famUsesTypes(m)){const t=famTimes(m,d);return t?wxSpan(d,t.s,t.e):null;}   // v0.117 직접 추가한 가족: 그 날 종류의 시간
  return null;
}
const wxMemKey=m=>m.uid||m.id;
function wxMemWork(m,d){if(famUsesTypes(m)){const l=famEra(m,d||new Date()).loc;return wxOk(l)?l:'';}const fw=(S.wx&&S.wx.fw)||{};const sh=m.kind==='sched'&&m.sch&&m.sch.wx&&m.sch.wx.w;return wxOk(sh)?sh:wxOk(fw[wxMemKey(m)])?fw[wxMemKey(m)]:'';}
function wxFam(){return (S.family||[]).concat(famPeers()).filter(m=>m.kind==='shift'||m.kind==='sched');}
function actRegions(){const r=[];try{(S.stamps.defs||[]).forEach(s=>{if(s.act&&wxOk(s.act.r)&&!s.retired)r.push(s.act.r);});(S.family||[]).forEach(m=>(m.sdefs||[]).forEach(x=>{if(x.act&&wxOk(x.act.r))r.push(x.act.r);}));}catch(e){}return [...new Set(r)];}
function wxFamCodes(){const r=[];try{famPeers().forEach(p=>{const h=famSchedHome(p),w=wxMemWork(p);if(wxOk(h))r.push(h);if(wxOk(w))r.push(w);});}catch(e){}return r;}   // v0.134
function wxCodes(){if(!wxOn())return [...new Set(wxFamCodes())];const s=new Set([S.wx.home,...actRegions()]);(S.family||[]).forEach(m=>{if(!famUsesTypes(m))return;[m,...(m.eras||[])].forEach(x=>{if(x&&wxOk(x.loc))s.add(x.loc);});if(wxOk(m.home))s.add(m.home);});if(wxOk(S.wx.work))s.add(S.wx.work);wxFam().forEach(m=>{const w=wxMemWork(m);if(w)s.add(w);});wxFamCodes().forEach(c=>s.add(c));return [...s];}
async function wxFetch(force){
  wxHistSave();   // 받아 둔 날씨로도 오늘 기록 (10분에 한 번)
  if(!WX_URL||wxBusy)return;
  const codes=wxCodes(),now=Date.now(),C=wxCache();
  const need=codes.filter(c=>force||!C[c]||now-C[c].at>30*60000||now<C[c].at);
  if(!need.length)return;
  if(!force&&now-wxLast<60000)return;   // 실패했을 때 계속 부르지 않게
  wxBusy=true;wxLast=now;
  try{
    for(let i=0;i<need.length;i+=6){
      const part=need.slice(i,i+6),r=await fetch(`${WX_URL}?r=${part.join(',')}`,{cache:'no-store'});
      if(!r.ok)throw new Error('wx '+r.status);
      const j=await r.json(),list=Array.isArray(j.list)?j.list:[j];
      list.forEach(d=>{if(isObj(d)&&wxOk(d.r)&&(d.s||d.m||d.a||d.q)){
        // 새 예보에 없는 오늘 지난 시간은 가진 것에서 붙여 둠 (지난 출근 칸 · 시간별 줄)
        try{const o=C[d.r]&&C[d.r].d&&C[d.r].d.s&&C[d.r].d.s.h,h=d.s&&d.s.h;if(o&&h){const first=Object.keys(h).sort()[0]||'',today=WX.keyD(now-864e5)+'00';Object.keys(o).forEach(k=>{if(k>=today&&k<first&&!h[k])h[k]=o[k];});}}catch(e){}
        C[d.r]={at:now,d};}});
    }
    Object.keys(C).forEach(k=>{if(!codes.includes(k))delete C[k];});
    try{localStorage.setItem(WX_KEY,JSON.stringify(C));}catch(e){}
    wxChanged();
  }catch(e){}finally{wxBusy=false;}
}
// 새 날씨가 오면: 보고 있는 곳만 다시 그림 (날짜 창은 날씨 줄만 바꿈 — 쓰던 메모가 안 날아가게) + 알람 · 알림에 넣을 예비 문구 갱신
function wxChanged(){
  wxHistSave(true);
  try{const el=document.getElementById('wxDay');if(el)el.outerHTML=wxDayHtml(el.dataset.k);}catch(e){}
  try{if(tab==='fam'&&!pageMode)render();}catch(e){}
  try{pushAlarmsToNative();pushRemindersToNative();}catch(e){}
  try{pushWidgetToNative();}catch(e){}
}
// 출퇴근 문구 (내 것): 근무 날이면 출퇴근, 아니면 하루 요약
// 내 직장 지역 (집과 가까워서 "같은 지역으로 보기"를 켰으면 없는 것처럼 = 전부 집 날씨 · 가족에게 보내는 직장은 그대로)
const wxWk=()=>S.wx&&S.wx.one?'':(S.wx&&S.wx.work)||'';
// 그날 내 활동 (스티커 활동 · 깔린 날만) → 날씨 칸
function actWx(a,sp,emo,home){const r=wxOk(a.r)?a.r:'';home=home||S.wx.home;return {n:'활동',ic:icoTxt(emo,''),s:sp.s,e:sp.e,raw:r?wxRaw(r):null,p:r?wxName(r):'',q:wxFull(r||home),rc:r||home};}
// v0.121 직접 추가한 가족의 집 (안 정하면 우리 집)
const famHome=m=>m&&wxOk(m.home)?m.home:S.wx.home;
function myActs(d){const k=fmt(d);try{return (S.stamps.defs||[]).filter(s=>s.act&&s.kind==='mark'&&!s.retired&&stampPlanned(s,k)).map(s=>{const sp=actSpan(s.act,d);return sp?actWx(s.act,sp,s.emoji):null;}).filter(Boolean);}catch(e){return [];}}
function wxMine(d,now){
  const H=wxRaw(S.wx.home),W=wxRaw(wxWk())||null,w=wxMyWin(d),acts=myActs(d);
  const hq=wxFull(S.wx.home),wq=wxOk(wxWk())?wxFull(wxWk()):hq;
  if(w){const c=WX.commute(H,W,{s:w.s,e:w.e,hn:`집 · ${wxName(S.wx.home)}`,wn:W?`직장 · ${wxName(wxWk())}`:`집 · ${wxName(S.wx.home)}`,hq,wq,now:now||Date.now(),acts});if(c)return c;}   // 시간 예보가 없는 먼 근무 날은 하루 요약
  return WX.dayCard(H,WX.keyD(new Date(d.getFullYear(),d.getMonth(),d.getDate(),12).getTime()),{now:now||Date.now(),hq,hp:wxName(S.wx.home),acts});
}
// 날짜 창 맨 위 한 줄 (간단하게): 근무 날 3일 안 = "☔ 퇴근길 비 · 우산 | 출근 6° · 퇴근 12°" · 그 밖 = "☀️ 오전 맑음 · ☔ 오후 비 60% | 4°~15°"
const WXP_KEY='eonjeswieo:wxp';let wxPC=null;const wxPBusy={};
function wxPast(){if(!wxPC){try{wxPC=JSON.parse(localStorage.getItem(WXP_KEY)||'{}');if(!isObj(wxPC))wxPC={};}catch(e){wxPC={};}}return wxPC;}
// v0.127 지난 날 날씨 기록: 날씨를 받을 때마다 오늘 카드(결론 · 칸 · 시간별 줄)를 폰에 저장(마지막 것으로 덮어씀) → 지난 날짜엔 저장본 + 실제 관측
// 메모 등과 다른 저장 칸(eonjeswieo:wxh) · 줄이지 않고 계속 보관 · 백업 · 복원에 같이 (backupData · applyBackup)
const WXH_KEY='eonjeswieo:wxh';let wxHC=null,wxHAt=0;
function wxHist(){if(!wxHC){try{wxHC=JSON.parse(localStorage.getItem(WXH_KEY)||'{}');if(!isObj(wxHC))wxHC={};}catch(e){wxHC={};}}return wxHC;}
const wxHClean=c=>{const o=JSON.parse(JSON.stringify(c));(o.c||[]).forEach(x=>{delete x.past;delete x.q;});return o;};   // 저장본: 지남 · 네이버 링크 빼기
function wxHistSave(force){
  try{
    const now=Date.now();if(!force&&now-wxHAt<10*60000)return;
    const t=new Date(now),k=fmt(t),d0=new Date(t.getFullYear(),t.getMonth(),t.getDate()).getTime();   // 하루 처음 시각 기준으로 계산 = 지난 칸 없이 하루 전체
    const mine=wxOn()&&wxRaw(S.wx.home)?wxMine(t,d0):null;
    const f={};
    if(wxOn())(S.family||[]).filter(famUsesTypes).forEach(m=>{const x=famWx(m,t,d0);if(x&&x.c&&x.c.k){const L=x.L||{};f[wxMemKey(m)]={c:wxHClean(x.c),s:x.win?`${wxHm(x.win.s)} ${L.ls||'출근'} → ${wxHm(x.win.e)} ${L.le||'퇴근'}`:''};}});
    famPeers().forEach(p=>{const x=famSchedWx(p,t,d0);if(x&&x.c&&x.c.k)f[wxMemKey(p)]={c:wxHClean(x.c),s:x.win?`${wxHm(x.win.s)} 출근 → ${wxHm(x.win.e)} 퇴근`:''};});   // v0.134 내 날씨를 안 켰어도 가족 것은 저장
    if(!(mine&&mine.k)&&!Object.keys(f).length)return;
    wxHAt=now;const H=wxHist(),o=H[k]&&isObj(H[k])?H[k]:{};
    const e={at:now,...(Object.keys(f).length?{f}:{})};
    if(mine&&mine.k){
      // v0.138 시간별 줄은 지금 시각 기준 → 지난 칸은 실제 잰 미세먼지 얼굴로 남음 (전에 저장한 실제 값은 예보로 덮지 않음)
      const w=wxMyWin(t),acts=myActs(t),hr=wxHrOf(t,w,S.wx.home,wxWk(),wxName(S.wx.home),wxWk()?wxName(wxWk()):'',now,acts);
      if(hr&&Array.isArray(hr.at)){hr.at.forEach(x=>{delete x.now;delete x.past;});wxDustKeep(o.hr,hr);const on=hr.at.findIndex(x=>x.on);hr.i0=on>=0?on:Math.min(3,hr.at.length-1);}
      Object.assign(e,{s:w?`${shiftLabel(w.k)} · ${wxHm(w.s)} 출근 → ${wxHm(w.e)} 퇴근`:'하루 요약',c:wxHClean(mine),...(hr?{hr}:{})});
    }else if(o.c)Object.assign(e,{s:o.s,c:o.c,...(o.hr?{hr:o.hr}:{})});
    H[k]=e;
    // v0.138 어제 저장본에 아직 예보로 남은 칸: 서버 지난 24시간 값으로 채움 (밤늦게 앱을 안 열었어도)
    try{const yk=addK(k,-1),Y=H[yk];if(mine&&Y&&Y.hr&&Array.isArray(Y.hr.at)&&Y.hr.at.some(x=>x.fc||!x.f)){const yd=parse(yk),yw=wxMyWin(yd),yh=wxHrOf(yd,yw,S.wx.home,wxWk(),wxName(S.wx.home),wxWk()?wxName(wxWk()):'',now,myActs(yd));if(yh&&Array.isArray(yh.at))wxDustKeep(yh,Y.hr);}}catch(err){}
    localStorage.setItem(WXH_KEY,JSON.stringify(H));
  }catch(e){}
}
// 시간별 줄 미세먼지: old 에 실제 잰 얼굴(fc 없음)이 있는 칸은 hr 에도 실제 얼굴로 (예보 · 빈칸을 덮음)
function wxDustKeep(old,hr){
  if(!old||!hr||!Array.isArray(old.at)||!Array.isArray(hr.at))return;
  const m={};old.at.forEach(x=>{if(x&&x.f&&!x.fc)m[x.t]=x.f;});
  hr.at.forEach(x=>{if(x&&m[x.t]&&(x.fc||!x.f)){x.f=m[x.t];delete x.fc;}});
}
// 지난 날짜 관측 한 줄 ("12°~21° · 비 14mm") · 없으면 ''
function wxObsTxt(k){const x=wxPast()[S.wx.home+'_'+k.slice(0,7).replace('-','')],l=WX.pastLine(x&&x.d&&x.d[k.replace(/-/g,'')]);return l?l.t:'';}
// 지난 날짜 관측: 그 달 자료가 없으면(또는 이번 달이 6시간 넘게 낡았으면) 받아 와서 날짜 창 줄을 다시 그림
function wxPastFetch(ym){
  const c=S.wx.home,key=c+'_'+ym,P=wxPast(),x=P[key],now=Date.now(),cur=fmt(new Date()).slice(0,7).replace('-','');
  // v0.127 지난달도 마지막 날 관측이 빠져 있으면 다시 받음 (달이 바뀐 날 아침에 받으면 전날(10/31) 관측이 아직 없어서 계속 비어 있던 문제) · 달 끝나고 3일 넘게 지나 받은 건 그대로
  const lastK=ym+String(new Date(+ym.slice(0,4),+ym.slice(4),0).getDate()).padStart(2,'0'),endMs=new Date(+ym.slice(0,4),+ym.slice(4),1).getTime();
  const done=x&&ym<cur&&(x.d&&x.d[lastK]||x.at>endMs+3*864e5);
  if(!WX_URL||wxPBusy[key]||(x&&(done||now-x.at<6*3600e3)))return;
  wxPBusy[key]=1;
  fetch(`${WX_URL}?past=${c}&ym=${ym}`).then(r=>r.ok?r.json():null).then(j=>{
    if(!j||!isObj(j.d))return;
    P[key]={at:now,st:String(j.st||'').slice(0,10),d:j.d};
    const ks=Object.keys(P);if(ks.length>24)ks.sort((a,b)=>P[a].at-P[b].at).slice(0,ks.length-24).forEach(k=>delete P[k]);   // 최근 24달치만
    try{localStorage.setItem(WXP_KEY,JSON.stringify(P));}catch(e){}
    const el=document.getElementById('wxDay');if(el)el.outerHTML=wxDayHtml(el.dataset.k);
  }).catch(()=>{}).finally(()=>{delete wxPBusy[key];});
}
function wxPastHtml(k){
  const ym=k.slice(0,7).replace('-',''),x=wxPast()[S.wx.home+'_'+ym];
  wxPastFetch(ym);
  const hs=wxHist()[k];
  if(hs&&hs.c){const ob=wxObsTxt(k);   // v0.127 그날 저장본 (그날 예보 기준) + 실제 관측
    return `<div id="wxDay" data-k="${k}" class="wxhist"><div class="wxhl">그날 예보 기준</div>${wxCardHtml(wxPastAll(hs.c),wxCls(hs.c),`data-act="wx-day" data-v="${k}"`)}${ob?`<div class="wxob">실제 ${esc(ob)}</div>`:''}</div>`;}
  const v=x&&x.d&&x.d[k.replace(/-/g,'')],l=WX.pastLine(v);
  if(!l){   // 관측이 아직 안 올라왔으면(보통 다음날 오전): 받아 둔 예보로 대신 (누르면 예보 팝업)
    const H=wxRaw(S.wx.home),dd=H&&WX.day(H,k.replace(/-/g,''));
    if(dd&&dd.src==='s'){const h=(n,v)=>v?`${n} ${v.d}`:'';return `<div class="wxl past" id="wxDay" data-k="${k}" data-act="wx-day" data-v="${k}" style="cursor:pointer">${wxImg(dd.sk,'wi')||`<span class="wi">${dd.i}</span>`}<span>${esc([h('오전',dd.am),h('오후',dd.pm)].filter(Boolean).join(' · '))}</span><span class="wt">${dd.lo!=null&&dd.hi!=null?`${dd.lo}°~${dd.hi}° · `:''}예보</span></div>`;}
  }
  return l?`<div class="wxl past" id="wxDay" data-k="${k}">${l.sk?wxImg(l.sk,'wi'):`<span class="wi">${l.i}</span>`}<span>${esc(l.t)}</span><span class="wt">관측${x.st?' · '+esc(x.st):''}</span></div>`:`<div id="wxDay" data-k="${k}" hidden></div>`;
}
// 날씨 카드 (날짜 창 · 가족 탭 내 카드): 결론 + 출근 → 퇴근(또는 오전 → 오후) 그림 · 기온 + 미세먼지 얼굴
function wxCardHtml(c,cls,attrs){
  const kk=c.k||{t:c.hs,s:'',i:''},z=(c.dz||[]).slice().sort((x,y)=>y.g-x.g||y.lv-x.lv)[0];
  const cell=x=>`<span class="wc"><i class="wcl">${esc(x.l.split(' ')[0])}</i>${wxImg(x.sk)}<em>${x.tt!=null?esc(x.tt):x.tp!=null?x.tp+'°':'–'}</em></span>`;
  return `<div class="wxl wxcard ${cls}" ${attrs}><div class="wa">${wxImg(kk.i,'wi')}<div><b>${esc(kk.t)}</b>${kk.s?`<small>${esc(kk.s)}</small>`:''}</div></div>
    ${(c.c||[]).length?`<div class="wb">${c.c.map(cell).join('<span class="ar">→</span>')}${z?wxImg(z.f,'f'):''}</div>`:''}</div>`;
}
// v0.121 가족 탭 작은 카드의 날씨: 칸(출근 · 퇴근 · 활동 / 오전 · 오후) 한 줄 + 비 · 미세먼지 · 특보면 결론 한 줄
function wxMiniHtml(c,attrs){
  const L=(c.c||[]).slice(0,3);if(!L.length&&!c.k)return '';const cls=wxCls(c),kk=c.k||{};
  const cell=x=>`<span class="mc${x.past?' past':''}${x.hot?' hot':''}"><i>${esc(String(x.l||'').split(' ')[0])}</i>${x.tt!=null?'':wxImg(x.sk)||esc(x.i||'')}<em${x.tt!=null?' class="tt"':''}>${x.tt!=null?esc(x.tt):x.tp!=null?x.tp+'°':'–'}</em></span>`;
  return `<div class="mwx" ${attrs}>${L.length?`<div class="mcs">${L.map(cell).join('')}</div>`:''}${cls&&kk.t?`<div class="mk ${cls}">${wxImg(kk.i)}<span>${esc(kk.t)}</span></div>`:''}</div>`;
}
// 가족 지금 날씨 카드 자료 (직접 추가한 가족 = famWx · 근무 가족 = 집 → 직장)
function famNowWx(m,now){
  try{const d=new Date(now);if(famUsesTypes(m)){const x=famWx(m,d,now);return x&&x.c;}
    const x=famSchedWx(m,d,now);return x&&x.c;
  }catch(e){return null;}
}
// 가족 진행 막대: 지금 가는 중(근무 · 등원~하원)이면 0~1
function famProg(m,now){try{const d=new Date(now),f=famWinOf(m);for(const dd of [d,addDays(d,-1)]){const w=f(dd);if(w&&now>=w.s&&now<w.e)return (now-w.s)/(w.e-w.s);}}catch(e){}return undefined;}
const wxCls=c=>{const kk=c.k||{};return kk.al===2?'al2':kk.al===1?'al1':(c.c||[]).some(x=>x.hot)?'wet':kk.dz?'bad':'';};
function wxDayHtml(k){
  const empty=`<div id="wxDay" data-k="${k}" hidden></div>`;
  if(wxOn()&&k<fmt(new Date()))return wxPastHtml(k);
  if(!wxOn()||!wxRaw(S.wx.home))return empty;
  const d=parse(k),c=wxMine(d);if(!c)return empty;
  const kk=c.k||{t:c.hs,s:'',i:''};
  const cls=kk.al===2?'al2':kk.al===1?'al1':(c.c||[]).some(x=>x.hot)?'wet':kk.dz?'bad':'';
  // 먼 날(중기예보): 한 줄 · 그 밖: 날씨 카드 (결론 + 출근 → 퇴근 그림 · 기온 · 미세먼지 얼굴) — 누르면 큰 팝업
  const far=Math.round((parse(k)-parse(fmt(new Date())))/864e5)>3;   // 오늘 ~ 3일 뒤 = 큰 카드 · 4일 뒤부터 = 한 줄
  if(far&&c.day){const x=c.day,h=(l,v)=>v?`${l} ${v.d}${v.pop>=30?` ${v.pop}%`:''}`:'';
    return `<div class="wxl ${cls}" id="wxDay" data-k="${k}" data-act="wx-day" data-v="${k}">${wxImg(x.sk,'wi')||`<span class="wi">${c.i}</span>`}<span>${esc([h('오전',x.am),h('오후',x.pm)].filter(Boolean).join(' · '))}</span><span class="wt">${esc(c.t)}</span></div>`;}
  // v0.142 쉬는 날(근무 · 활동 없음): "오전 4° → 오후 15°"(사실 하루 최저 · 최고라 헷갈림) 대신 오늘 = "지금 12°" 한 칸 · 다른 날 = 그날 그림 + "4°~15°"
  const rs=wxRestMini(c,d);
  return wxCardHtml(rs?{...c,c:rs}:c,cls,`id="wxDay" data-k="${k}" data-act="wx-day" data-v="${k}"`);
}
function wxRestMini(c,d){
  try{if(wxMyWin(d)||myActs(d).length||!c.day||(c.c||[]).length!==2||c.day.lo==null)return null;
    const x=c.day;
    if(fmt(d)===fmt(new Date())){const now=Date.now(),v=WX.at(wxRaw(S.wx.home),now);if(!v)return null;return [{l:'지금',sk:WX.sky(v,now),tp:v.tp}];}
    const a=x.am||x.pm,b=x.pm||x.am;return [{l:'하루',sk:(b&&b.wet?b:a).sk,tt:`${x.lo}°~${x.hi}°`}];
  }catch(e){return null;}
}
// 날씨 그림 (assets/wx/…webp · 'sky/rain' · 'wear/coat' · 'faces/4')
const wxImg=(id,cls)=>id&&/^(sky|wear|faces|alert|misc)\/[a-z0-9_]+$/.test(id)?`<img${cls?` class="${cls}"`:''} src="wx/${id}.webp" alt="" draggable="false">`:'';
// 큰 팝업: 한 줄 결론 → 출근/퇴근 칸(날씨 · 옷) → (옷이 같으면 한 번만) → 챙길 것 → 미세먼지 (누르면 큰 화면) — 알람 카드 · 위젯 창과 같은 순서
let wxDz=null;   // 미세먼지 큰 화면에 쓸 것: {list:[{p,n,code}], back}
// v0.141 쉬는 날(근무 · 활동 없음) 위쪽 두 칸: 오전 · 오후(사실은 하루 최저 · 최고라 시간별 줄과 안 맞아 보였음) → 왼쪽 지금 날씨 · 체감 / 오른쪽 오늘 요약(최저 / 최고 · 비 · 일교차). 두 칸 자리 그대로(팝업 높이 같게)
function wxRestCards(cs,c,rs){
  try{
    const d=c&&c.day;if(!rs||!d||cs.length!==2||d.lo==null||d.hi==null)return null;
    const wt=v=>!!v&&(v.pty>0||v.pop>=60);
    const pl=cs[0].p||'',q=cs[0].q,pop=Math.max((d.am&&d.am.pop)||0,(d.pm&&d.pm.pop)||0),wet=(d.am&&d.am.wet)||(d.pm&&d.pm.wet),snow=(d.am&&d.am.snow)||(d.pm&&d.pm.snow);
    const right={l:`${rs.today?'오늘':'하루'}\u00a0요약 최저 · 최고`,p:pl,big:`${d.lo}° / ${d.hi}°`,d:`${snow?'눈':'비'} ${pop}% · 일교차 ${d.hi-d.lo}°`,...(q?{q}:{}),...(wet?{hot:true}:{})};
    let left;
    if(rs.today&&rs.raw){const now=Date.now(),v=WX.at(rs.raw,now);if(!v)return null;const fl=WX.feel(v.tp,v.ws);
      left={l:`지금 ${wxHm(now)}`,p:pl,sk:WX.sky(v,now),tp:v.tp,d:`${fl!=null&&fl!==v.tp?`체감 ${fl}° · `:''}${WX.desc(v)}`,...(q?{q}:{}),...(wt(v)?{hot:true}:{})};}
    else{const a=d.am||d.pm,b=d.pm||d.am,same=a.d===b.d;left={l:`하루 ${rs.md||''}`.trim(),p:pl,sk:a.sk||b.sk,...(!same&&a.sk&&b.sk&&a.sk!==b.sk?{sk2:b.sk}:{}),d:same?`하루 종일 ${a.d}`:`${a.d} → ${b.d}`,...(q?{q}:{}),...(wet?{hot:true}:{})};}
    return [left,right];
  }catch(e){return null;}
}
function wxPopHtml(title,sub,c,extra,dz,hr,rs){
  wxDz=dz||null;
  const k=c.k||{t:c.h,s:'',i:''},cs=c.c||[];
  const wet=cs.some(x=>x.hot),bad=!!k.dz&&(c.dz||[]).some(x=>x.g>=3),cold=/^wear\/(scarf|mittens)/.test(k.i||'');
  const same=cs.length===2&&cs[0].w&&cs[0].w===cs[1].w;
  const card=x=>`<div class="wxc${x.hot?' hot':''}${x.past?' past':''}"${x.q?` data-act="wx-web" data-q="${esc(x.q)}"`:''}><div class="l">${(()=>{const i=String(x.l).indexOf(' ');return i>0?`${esc(x.l.slice(0,i))}<small class="lt">${esc(x.l.slice(i+1))}</small>`:esc(x.l);})()}</div>${x.p?`<div class="p">${esc(x.p)}</div>`:''}<div class="s${x.sk2?' two':''}">${x.sk?wxImg(x.sk):''}${x.sk2?`<i class="ar">→</i>${wxImg(x.sk2)}`:''}${x.big?`<b class="big">${esc(x.big)}</b>`:x.tp!=null?`<b>${x.tp}°</b>`:''}</div><div class="d">${esc(x.d||'')}</div>${x.past?'<span class="tag pastb">지남</span>':''}</div>`;
  // 옷은 하루 한 벌: 아직 안 지난 칸 중 가장 추운 때 기준 (칸마다 따로 보여 주면 외투 여러 벌처럼 보임)
  const wpool=(cs.some(x=>x.w&&!x.past)?cs.filter(x=>x.w&&!x.past):cs.filter(x=>x.w)).filter(x=>x.tp!=null),wcold=wpool.slice().sort((a,b)=>a.tp-b.tp)[0];
  const wgap=wpool.length>1?Math.max(...wpool.map(x=>x.tp))-Math.min(...wpool.map(x=>x.tp)):0;
  const otip=c.ot||(wgap>=8?'낮엔 따뜻해요 · 안에 얇게 입고 겉옷은 벗기 쉽게':'');   // v0.127 옷 아래 상황 문구 (출퇴근 기온차 · 추위 · 더위 · 눈)
  const all=wcold?`<div class="wxrw all">${wxImg(wcold.w)}<div><small>오늘 옷</small><b>${esc(wcold.wt.replace(/ · /g,' + '))}</b><small class="ot">${esc(otip||`${wcold.l.split(' ')[0]} ${wcold.tp}° 기준`)}</small></div></div>`:'';
  const b=(c.b||[]).length?`<div class="wxrw"><span class="k">챙길 것</span>${c.b.map(x=>wxImg(x.i)).join('')}<span class="n">${esc(c.b.map(x=>x.n).join(' · '))}</span></div>`
    :cs.length?`<div class="wxrw nob"><span class="k">챙길 것</span><span class="n">없어요</span>${wxImg('misc/smile','sm')}</div>`:'';   // v0.127 없는 날도 자리 (높이 통일)
  const z=(c.dz||[]).slice().sort((x,y)=>y.g-x.g||y.lv-x.lv),w0=z[0],w1=z[1],two=w0&&w1&&w1.g!==w0.g;
  let air='';
  if((c.dz||[]).some(z=>z.act)){   // v0.119 활동이 있는 날: 미세먼지도 칸으로 (출근 · 퇴근 · 🏊활동) · 누르면 큰 화면
    air=`<div class="wxdz3"${dz?' data-act="wx-dust"':''}><span class="t">미세먼지</span>${c.dz.map(z=>`<div class="dzc${z.g>=3?' bad':''}"><small>${esc(z.p||'')}</small>${wxImg(z.f)}<b>${esc(z.lb)}</b></div>`).join('')}</div>`;
  }else if(w0){   // v0.127 미세먼지 줄은 늘 같은 자리 · 누르면 큰 화면 (결론이 미세먼지면 짧게)
    const l1=two?`${w0.pl||w0.p+'길'}(${w0.n}) ${w0.m}`:w0.m,l2=two?`${w1.pl||w1.p+'길'}(${w1.n})은 ${w1.lb}`:'';
    air=`<div class="wxrw dz${w0.g>=3?' bad':''}"${dz?' data-act="wx-dust"':''}>${wxImg(w0.f)}<div><b class="k">미세먼지 ${esc(w0.lb)}</b>${k.dz&&dz?'<small>자세히 보기</small>':`<small>${esc(l1)}</small>${l2?`<small style="opacity:.7">${esc(l2)}</small>`:''}`}</div>${dz?'<span class="go">›</span>':''}</div>`;
  }else if(!w0&&c.a)air=`<div class="wxrw"><b class="k">${esc(c.a)}</b></div>`;
  else if(!w0&&cs.length&&!(c.day&&c.day.src==='m'))air=`<div class="wxrw dz none">${wxImg('faces/2')}<div><b class="k">미세먼지 · 예보 전이에요</b></div></div>`;   // v0.130 줄을 빼지 않고 자리 유지 (높이 같게) · 누르지 않음
  const kOther=k.dz&&two?`<small style="opacity:.75">${esc(`${w1.pl||w1.p+'길'}(${w1.n})은 ${w1.lb}`)}</small>`:'';
  const kCls=k.al===2?'al2':k.al===1?'al1':wet?'wet':bad?'bad':cold?'cold':'';
  return `<div class="wxp v2"><div class="wh"><div><b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div><button class="ib" data-act="pop-close" aria-label="닫기">✕</button></div>
    <div class="wxk ${kCls}">${wxImg(k.i)}<div><b>${esc(k.t)}</b>${k.s?`<small>${esc(k.s)}</small>`:''}${kOther}</div></div>
    ${cs.length?`<div class="wxcs">${(wxRestCards(cs,c,rs)||cs).map(card).join('')}</div>`:''}${all}${wxHrHtml(hr)}${b}${air}${extra||''}
    ${cs.some(x=>x.q)&&hintN('wxweb')<5?'<span class="wxweb">칸을 누르면 그 동네 네이버 날씨</span>':''}<div class="wsrc">${esc(c.src||'')}</div></div>`;
}
// 시간별 줄: 그날 24시간 · 2시간 간격 · 칸마다 내가 있는 곳(집 · 직장 구간) · 열면 지금 칸이 왼쪽에서 두 번째 (wxHrScroll)
function wxHrHtml(hr){
  if(!hr||!hr.at||!hr.at.some(x=>x.tp!=null))return '';   // 단기예보가 없는 먼 날은 안 그림
  const gk=x=>x.ac?'a:'+x.ac:x.w?'w':'h';   // 묶음: 집 · 직장 · 활동
  const grp=[];hr.at.forEach((x,i)=>{const g=grp[grp.length-1];if(hr.seg&&g&&g.k===gk(x))g.l.push([x,i]);else if(!hr.seg&&g)g.l.push([x,i]);else grp.push({k:gk(x),w:x.w,ac:x.ac||'',an:x.an||'',l:[[x,i]]});});
  const chip=([x,i])=>`<div class="hc${x.now?' hn':''}${x.past?' hp':''}${x.on?' ho':''}${x.wet?' hw':''}${x.nd?' nd':''}" data-i="${i}">${x.now?'지금':esc(x.l)}${wxImg(x.sk)||'<span class="no"></span>'}<b>${x.tp!=null?x.tp+'°':'–'}</b>${x.f?`<span data-act="wx-dust">${wxImg(x.f,'f'+(x.fc?' fc':''))}<small>${x.fc?'예보':'실측'}</small></span>`:''}</div>`;
  const lbl=g=>g.ac?`${esc(g.ac)}${g.an?' · '+esc(g.an):''}`:hr.seg?(g.w?`${esc(hr.wl||'🏢 직장')} · ${esc(hr.wn)}`:'🏠 집'):`시간별 · ${esc(hr.hn)}`;
  return `<div class="wxhr"><div class="wxhs" data-i0="${hr.i0}">${grp.map(g=>`<div class="sg ${g.ac?'act':hr.seg?(g.w?'work':'home'):''}"><div class="hl">${lbl(g)}</div><div class="hh">${g.l.map(chip).join('')}</div></div>`).join('')}</div></div>`;
}
function wxHrScroll(root){try{const s=root?root.querySelector('.wxhs'):document.querySelector('#pop .wxhs');if(!s)return;{const W=s.clientWidth;if(W>0){const n=Math.floor(W/46);const w=Math.max(40,Math.min(54,W/(n+0.5)-2));s.style.setProperty('--hcw',w.toFixed(1)+'px');}}   // v0.127 오른쪽 끝 칸이 반쯤 걸쳐 보이게 (더 밀 수 있다는 느낌)
const nw=s.querySelector('.hc.hn');if(nw){const r=nw.getBoundingClientRect(),sr=s.getBoundingClientRect();s.scrollLeft=Math.max(0,r.left-sr.left+s.scrollLeft-(s.clientWidth-r.width)/2);return;}   /* v0.230 오늘이면 "지금" 칸이 가운데 */
const c=s.querySelector(`.hc[data-i="${s.dataset.i0}"]`);if(c)s.scrollLeft=Math.max(0,c.getBoundingClientRect().left-s.getBoundingClientRect().left+s.scrollLeft-4);}catch(e){}}
function wxOpenPop(html){openPop(html);requestAnimationFrame(()=>wxHrScroll());if(/class="wxweb"/.test(html)){hintBump('wxweb');save();}}
// 시간별 줄 자료 (나 / 가족): 근무 날 = 집 · 직장 구간, 쉬는 날 = 집
function wxHrOf(d,win,home,work,hn,wn,now,acts){
  const H=wxRaw(home),W=work&&work!==home?wxRaw(work):null;if(!H)return null;
  const dk=WX.keyD(new Date(d.getFullYear(),d.getMonth(),d.getDate(),12).getTime());
  return WX.hours(H,W,{dk,...(win?{s:win.s,e:win.e}:{}),now:now||Date.now(),hn,wn,acts:acts||[]});
}
/* 미세먼지 큰 화면: 단계 색 배경 · 큰 얼굴 · 지금 미세/초미세 | 오늘 · 내일 · 모레 예보 · 항목별 표 · 출근/퇴근 동네 탭 */
const WX_DC=['#2f7fd8','#4b9ee6','#2fb39b','#5cb85c','#ef8a2c','#e8662a','#d9403a','#5e4a9c'],WX_N4=['','좋음','보통','나쁨','매우 나쁨'],WX_F4=[-1,1,3,4,6];
let wxDzTab=0;
function wxDustHtml(){
  const L=wxDz&&wxDz.list||[];if(!L.length)return '';
  const cur=L[Math.min(wxDzTab,L.length-1)],now=Date.now(),d=WX.dustInfo(wxRaw(cur.code),now);
  const top=`<div class="top">${L.length>1?`<div class="tabs">${L.map((x,i)=>`<button class="${x===cur?'on':''}" data-act="wx-dust-tab" data-i="${i}">${x.p?`<small>${esc(x.p)}</small>`:''}${esc(x.n)}</button>`).join('')}</div>`:`<div class="one">${esc(cur.n)}</div>`}<button class="x" data-act="wx-dust-close" aria-label="닫기">✕</button></div>`;
  if(!d)return `<div class="wxd" style="--dc:#8a8f99">${top}<div class="none">미세먼지 자료를 아직 못 받았어요</div></div>`;
  let az=null;if(cur.at){try{az=WX.dzAt(wxRaw(cur.code),cur.at,now,'','','');}catch(e){}}   // 활동 탭: 큰 얼굴은 활동 시간 기준
  const today=WX.keyD(now),dl=k=>{const t=new Date(+k.slice(0,4),+k.slice(4,6)-1,+k.slice(6,8)),n=Math.round((t-new Date(+today.slice(0,4),+today.slice(4,6)-1,+today.slice(6,8)))/864e5);return ['오늘','내일','모레'][n]||`${t.getMonth()+1}/${t.getDate()}`;};
  const f4=g=>g>=1&&g<=4?`faces/${WX_F4[g]}`:'';
  const cell=(a,img,v)=>`<div>${a}${wxImg(img)}<b>${esc(v)}</b></div>`;
  const now2=d.lv>=0||d.p10!=null||d.p25!=null?cell('지금<br>미세',d.l10>=0?`faces/${d.l10}`:'',d.p10!=null?`${d.p10}㎍/㎥`:'-')+cell('지금<br>초미세',d.l25>=0?`faces/${d.l25}`:'',d.p25!=null?`${d.p25}㎍/㎥`:'-')+(d.fc.length?'<i></i>':''):'';
  const fc=d.fc.map(([k,g])=>cell(`${dl(k)}<br>예보`,f4(g),WX_N4[g]||'-')).join('');
  const rows=[];
  const gx=d.x.find(x=>x[0]==='통합대기지수');if(gx)rows.push(['통합대기지수',f4(gx[3]),WX_N4[gx[3]]||'',String(gx[1])]);
  if(d.p10!=null)rows.push(['미세먼지',d.l10>=0?`faces/${d.l10}`:'',d.l10>=0?WX.L8[d.l10]:'',`${d.p10} ㎍/㎥`]);
  if(d.p25!=null)rows.push(['초미세먼지',d.l25>=0?`faces/${d.l25}`:'',d.l25>=0?WX.L8[d.l25]:'',`${d.p25} ㎍/㎥`]);
  d.x.filter(x=>x[0]!=='통합대기지수').forEach(x=>rows.push([x[0],f4(x[3]),WX_N4[x[3]]||'',`${x[1]} ${x[2]}`]));
  const tbl=rows.length>2?`<table>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${wxImg(r[1])}</td><td class="g">${esc(r[2])}</td><td class="v">${esc(r[3])}</td></tr>`).join('')}</table>`:'';
  const where=d.st?`${d.st} 측정소`:d.w?`${d.w} 평균`:'',when=d.t?`${+d.t.slice(5,7)}월 ${+d.t.slice(8,10)}일 ${d.t.slice(11,16)} 기준`:'';
  const B=az?{f:az.f,lb:az.lb,m:az.m,lv:az.lv}:d,aw=az?`활동 ${wxHm(cur.at)} 때${cur.at>now?' 예보':''}`:'';
  return `<div class="wxd" style="--dc:${B.lv>=0?WX_DC[B.lv]:'#8a8f99'}">${top}
    ${aw||L.some(x=>x.at)?`<div class="stn" style="margin-top:0;height:22px;line-height:22px;overflow:hidden${aw?'':';visibility:hidden'}">${esc(aw||(()=>{const z=L.find(x=>x.at);return `활동 ${wxHm(z.at)} 때${z.at>now?' 예보':''}`;})())}</div>`:''}${wxImg(B.f,'big')}<div class="lv">${esc(B.lb||'-')}</div><div class="msg">${esc(B.m||'')}</div>${where||when?`<div class="stn">${esc([where,when].filter(Boolean).join(' · '))}</div>`:''}
    ${now2||fc?`<div class="row">${now2}${fc}</div>`:''}${tbl}
    <div class="ft">에어코리아 자료 · 실제 수치와 다를 수 있어요${d.lv<0?'<br>지금 측정값이 없어 예보로 보여 줘요':''}</div></div>`;
}
function wxOpenDust(){
  if(!wxDz)return;
  const back=$('#pop .menu')?$('#pop .menu').innerHTML:'',ctx=wxDz,dp=!!document.querySelector('#pop .menu.wxdpop');
  wxDz.back=()=>{wxOpenPop(back);wxDz=ctx;if(dp){const m=$('#pop .menu');if(m)m.classList.add('wxdpop');}};
  wxDzTab=0;wxDustPaint();
}
function wxDustPaint(){
  const h=wxDustHtml();if(!h)return;
  openPop(h);const pop=$('#pop');pop.classList.add('wxfull');
  const m=pop.querySelector('.menu'),dc=(h.match(/--dc:(#[0-9a-f]{6})/)||[])[1];if(m&&dc)m.style.setProperty('--dc',dc);
}
// v0.127 미세먼지 큰 화면: 옆으로 밀면 탭 넘김 (출근 → 퇴근 → 활동 · 끝에선 살짝 튕기고 멈춤)
let wdsw=null;
document.addEventListener('pointerdown',e=>{const d=e.target.closest&&e.target.closest('#pop.wxfull .wxd');wdsw=d&&!e.target.closest('.tabs,button')?{x:e.clientX,y:e.clientY,el:d,on:false}:null;});
document.addEventListener('pointermove',e=>{if(!wdsw)return;const dx=e.clientX-wdsw.x,dy=e.clientY-wdsw.y;
  if(!wdsw.on){if(Math.abs(dy)>12&&Math.abs(dy)>=Math.abs(dx)){wdsw=null;return;}if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy))wdsw.on=true;else return;}
  const L=(wxDz&&wxDz.list)||[],nx=wxDzTab+(dx<0?1:-1),edge=nx<0||nx>=L.length;
  if(!reduceMotion())wdsw.el.style.transform=`translateX(${edge?dx*0.25:dx}px)`;});
const wdEnd=e=>{if(!wdsw)return;const st=wdsw;wdsw=null;if(!st.on)return;held=true;setTimeout(()=>{held=false;},60);
  const dx=(e&&e.clientX!=null?e.clientX:st.x)-st.x,L=(wxDz&&wxDz.list)||[],nx=wxDzTab+(dx<0?1:-1);
  if(Math.abs(dx)>=50&&nx>=0&&nx<L.length){wxDzTab=nx;wxDustPaint();const n=$('#pop .wxd');if(n&&!reduceMotion()){n.style.transform=`translateX(${dx<0?60:-60}px)`;n.style.opacity='.4';requestAnimationFrame(()=>{n.style.transition='transform .22s ease,opacity .22s ease';n.style.transform='';n.style.opacity='';});}return;}
  st.el.style.transition='transform .25s cubic-bezier(.22,1.18,.36,1)';st.el.style.transform='';setTimeout(()=>{st.el.style.transition='';},260);};
document.addEventListener('pointerup',wdEnd);document.addEventListener('pointercancel',wdEnd);
function wxDustClose(){const b=wxDz&&wxDz.back;$('#pop').classList.remove('wxfull');if(b){wxDz.back=null;b();}else closePop();}
// 미세먼지 큰 화면의 탭: 근무 날 = 출근(집) · 퇴근(직장, 다를 때만) / 쉬는 날 = 집 하나 · 활동 있는 날 = 활동 탭 (시간 순서)
function wxDzList(win,home,work,acts,ls,le){
  const L=[{p:win?(ls||'출근'):'',n:wxName(home),code:home,t:win?win.s:0}];
  if(win&&wxOk(work)&&work!==home)L.push({p:le||'퇴근',n:wxName(work),code:work,t:win.e});
  (acts||[]).slice(0,2).forEach(a=>{const c=wxOk(a.rc)?a.rc:home;L.push({p:`${a.ic||''}활동`,n:wxName(c),code:c,t:a.s,at:a.s});});
  return {list:L.filter(x=>wxRaw(x.code)).sort((a,b)=>a.t-b.t)};
}
let wxPopK='';   // 날짜에서 연 날씨 팝업의 날짜 (옆으로 밀기)
const wxPastAll=c=>c&&Array.isArray(c.c)?{...c,c:c.c.map(x=>({...x,past:true}))}:c;   // v0.167 지난 날: 출근 · 퇴근 칸도 "지남" (오늘과 통일 · 사용자)
function wxHistPop(title,hs,ob,hr){return wxPopHtml(title,'그날 예보 기준'+(hs.s?' · '+hs.s:''),wxPastAll(hs.c),ob?`<div class="wxrw obs"><span class="k">실제</span><span class="n">${esc(ob)}</span></div>`:'',null,hr||null);}
function wxDayPopHtml(k){
  if(wxPopFam)return famWxPopHtml(wxPopFam,k);   // v0.135 가족 날씨 팝업을 밀 때
  const d=parse(k);
  if(k<fmt(new Date())&&wxHist()[k]&&wxHist()[k].c){const hs=wxHist()[k];return wxHistPop(`${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]}) 날씨`,hs,wxObsTxt(k),hs.hr);}   // v0.127 지난 날 = 저장본
  const c=wxMine(d);if(!c)return '';
  const w=wxMyWin(d);
  return (wxPopHtml(`${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]}) 날씨`,w?`${shiftLabel(w.k)} · ${wxHm(w.s)} 출근 → ${wxHm(w.e)} 퇴근`:(c.day&&c.day.src==='m'?'하루 요약 (중기예보)':'하루 요약'),c,'',wxDzList(w,S.wx.home,wxWk(),myActs(d)),wxHrOf(d,w,S.wx.home,wxWk(),wxName(S.wx.home),wxWk()?wxName(wxWk()):'',k===fmt(new Date())?Date.now():null,myActs(d)),(!w&&!myActs(d).length)?{today:k===fmt(new Date()),raw:wxRaw(S.wx.home),md:`${d.getMonth()+1}월 ${d.getDate()}일`}:null));
}
function wxOpenDay(k){wxPopFam=null;const pre=wxPre&&wxPre.k===k&&Date.now()-wxPre.t<60000?wxPre.h:null;wxPre=null;const h=pre||wxDayPopHtml(k);if(!h)return;wxPopK=k;wxOpenPop(`<div class="swc" style="position:relative;transform:translateZ(0)">${h}</div>`);   /* v0.133 처음부터 판으로 감싸 둠 → 밀기 시작할 때 옮기지 않음 */const m=$('#pop .menu');if(m)m.classList.add('wxdpop');}
const wxHm=ms=>{const x=new Date(ms);return t12(`${pad(x.getHours())}:${pad(x.getMinutes())}`,true);};   // v0.126 화면 글자는 12시간제
// 가족 카드: 출근 · 퇴근 앞뒤 2시간이면 "☔ 퇴근 12° 비" · 그 밖엔 그날 아이콘만 (누르면 자세히)
function famActWx(m,now){
  try{if(!wxOn()||m.kind==='sched'||famUsesTypes(m))return '';   // 일정 종류 가족은 wxFamChip 한 줄에 활동까지 들어감const H=wxRaw(S.wx.home);if(!H)return '';const d=new Date(now);
    const list=famActs(m,d).filter(z=>now<z.sp.e);if(!list.length)return '';
    const ac=list.map(z=>actWx(z.x.act,z.sp,z.x.emoji)),c=WX.dayCard(H,WX.keyD(now),{now,acts:ac});
    const k=c&&c.k;if(!k||!/(비|눈) 와요$/.test(k.t))return '';
    return `<span class="wxb wet">${wxImg(k.i)||'☔'} ${esc(k.t.replace(/ 와요$/,''))} · ${/눈/.test(k.t)?'조심':'우산'}</span>`;
  }catch(e){return '';}
}
const famSchool=n=>/학교/.test(String(n||''))&&!/유치원|어린이집/.test(String(n||''));   // v0.223 학교면 등교 · 하교 (유치원 · 어린이집은 등원 · 하원)
const famWxL=(m,d)=>{if(!m||m.kind!=='student')return {};let n='';try{n=famTypeAt(m,d||new Date()).name;}catch(e){}return famSchool(n)?{ls:'등교',le:'하교',lb:'등하교'}:{ls:'등원',le:'하원',lb:'등하원'};};
function wxFamChip(who,now){
  if(!wxOn())return '';
  if(who!=='me'&&famUsesTypes(who)){   // v0.117 직접 추가한 가족: 다음 칸(등원 · 하원 · 활동) 날씨 늘 한 줄 · 앞으로 비 · 눈이면 그걸로
    const x=famWx(who,new Date(now),now),cs=x&&x.c&&(x.c.c||[]).filter(c=>!c.past);if(!cs||!cs.length){const dd=x&&x.c&&x.c.k;return dd?`<span class="wxb ic" data-act="wx-fam" data-u="${esc(wxMemKey(who))}">${wxImg(dd.i)||''}</span>`:'';}
    const w=cs.find(c=>c.hot),c0=w||cs[0],nm=String(c0.l).split(' ')[0];
    return `<span class="wxb ${w?'wet':''}" data-act="wx-fam" data-u="${esc(wxMemKey(who))}">${wxImg(c0.sk)} ${esc(w?`${nm}${x.win?' 때':''} ${/눈/.test(w.d)?'눈 · 조심':'비 · 우산'}`:`${nm} ${c0.tp!=null?c0.tp+'°':''}`)}</span>`;
  }
  const d=new Date(now),win=who==='me'?wxMyWin(d):wxMemWin(who,d);if(!win)return '';
  const H=wxRaw(S.wx.home),W=who==='me'?wxRaw(wxWk()):wxRaw(wxMemWork(who));if(!H)return '';
  const key=who==='me'?'me':esc(wxMemKey(who));
  const b=WX.brief(H,W,{s:win.s,e:win.e,now,...(who==='me'?{}:famWxL(who))});
  if(b)return `<span class="wxb ${b.wet?'wet':b.bad?'bad':''}" data-act="wx-fam" data-u="${key}">${wxImg(b.sk)||b.i} ${esc(b.t)}</span>`;
  const dd=WX.day(H,WX.keyD(now));return dd?`<span class="wxb ic" data-act="wx-fam" data-u="${key}" aria-label="오늘 날씨">${wxImg(dd.sk)||dd.i}</span>`:'';
}
// v0.117 직접 추가한 가족의 그 날 날씨: 등원(집) → 하원(위치) → 활동 · 쉬는 날은 하루 요약
function famWx(m,d,now){
  try{
    if(!wxOn())return null;const hm=famHome(m),H=wxRaw(hm);if(!H)return null;now=now||Date.now();
    const win=wxMemWin(m,d),l0=wxMemWork(m,d),loc=l0&&l0!==hm?l0:'',W=loc?wxRaw(loc):null,L=famWxL(m,d),hq=wxFull(hm);
    const acts=famActs(m,d).map(z=>actWx(z.x.act,z.sp,z.x.emoji,hm)),ty=famTypeAt(m,d);
    const c=win?WX.commute(H,W,{s:win.s,e:win.e,hn:`집 · ${wxName(hm)}`,wn:W?`${ty.name||famLbl(m)} · ${wxName(loc)}`:`집 · ${wxName(hm)}`,hq,wq:loc?wxFull(loc):hq,now,acts,...L}):null;
    return {c:c||WX.dayCard(H,WX.keyD(new Date(d.getFullYear(),d.getMonth(),d.getDate(),12).getTime()),{now,hq,hp:wxName(hm),acts}),win,loc,L,hm,acts};
  }catch(e){return null;}
}
// v0.134 먼 날(4일 뒤부터 · 중기예보) 한 줄 — 내 날짜 창과 같은 모양
function wxFarLine(c,attrs){const x=c&&c.day;if(!x)return '';const h=(l,v)=>v?`${l} ${v.d}${v.pop>=30?` ${v.pop}%`:''}`:'';
  return `<div class="wxl ${wxCls(c)}" ${attrs}>${wxImg(x.sk,'wi')||`<span class="wi">${c.i||''}</span>`}<span>${esc([h('오전',x.am),h('오후',x.pm)].filter(Boolean).join(' · '))}</span><span class="wt">${esc(c.t||'')}</span></div>`;}
// v0.127 가족 지난 날 저장본 (카드 · 팝업) — 시간별 줄은 내 것만 저장
const wxHistOf=(u,k)=>{const h=wxHist()[k],f=h&&h.f&&h.f[u];return f&&f.c?f:null;};
function wxHistCard(u,k,act){const f=wxHistOf(u,k);if(!f)return '';return `<div class="wxhist"><div class="wxhl">그날 예보 기준</div>${wxCardHtml(wxPastAll(f.c),wxCls(f.c),`data-act="${act}" data-k="${k}"`)}</div>`;}
function wxHistFamPop(name,u,k){const f=wxHistOf(u,k);if(!f)return false;const d=parse(k);wxOpenPop(wxHistPop(`${name} · ${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`,f,'',null));return true;}
// v0.135 가족 날씨 팝업도 내 것처럼 옆으로 밀어 날짜 넘기기 (wxPopFam = 지금 팝업이 누구 것인지 · wxDayPopHtml 이 그걸 보고 그림)
let wxPopFam=null;
function famWxPopHtml(m,k){
  const d=parse(k),u=wxMemKey(m),ti=`${m.name} · ${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`;
  if(k<fmt(new Date())){const f=wxHistOf(u,k);if(f)return wxHistPop(ti,f,'',null);}
  const rsOf=(win,hm,acts)=>!win&&!(acts&&acts.length)?{today:k===fmt(new Date()),raw:wxRaw(hm),md:`${d.getMonth()+1}월 ${d.getDate()}일`}:null;   // v0.142 가족도 쉬는 날은 지금 · 오늘 요약
  if(m.kind==='sched'){const x=famSchedWx(m,d);if(!x||!x.c)return '';return wxPopHtml(ti,x.win?`${wxHm(x.win.s)} 출근 → ${wxHm(x.win.e)} 퇴근`:'',x.c,'',wxDzList(x.win,x.hm,x.wk),wxHrOf(d,x.win,x.hm,x.wk,wxName(x.hm),x.wk&&x.wk!==x.hm?wxName(x.wk):'',null),rsOf(x.win,x.hm));}
  const x=famWx(m,d);if(!x||!x.c)return '';const L=x.L,ls=L.ls||'출근',le=L.le||'퇴근';
  const hr=wxHrOf(d,x.win,x.hm,x.loc,wxName(x.hm),x.loc?wxName(x.loc):'',null,x.acts);if(hr&&m.kind==='student'){let n='';try{n=famTypeAt(m,d).name||famLbl(m)||'';}catch(e){}hr.wl=`🏫 ${String(n||m.label||'').trim()||'학교'}`;}   // v0.143 학생 가족은 "직장" 대신 유치원 · 학교
  return wxPopHtml(ti,x.win?`${wxHm(x.win.s)} ${ls} → ${wxHm(x.win.e)} ${le}`:'',x.c,'',wxDzList(x.win,x.hm,x.loc,x.acts,ls,le),hr,rsOf(x.win,x.hm,x.acts));
}
function famWxOpen(m,k){const h=famWxPopHtml(m,k);if(!h)return;wxPopK=k;wxPopFam=m;wxOpenPop(`<div class="swc" style="position:relative;transform:translateZ(0)">${h}</div>`);const mm=$('#pop .menu');if(mm)mm.classList.add('wxdpop');}
function famWxPop(m,k){famWxOpen(m,k);}
function wxOpenFam(u){
  const now=Date.now(),d=new Date(now),H=wxRaw(S.wx.home);if(!H&&u==='me')return;
  if(u==='me'){wxOpenDay(fmt(d));return;}   // v0.144 날씨 탭과 같은 팝업 (옆으로 밀기)
  const m=wxFam().concat((S.family||[]).filter(famUsesTypes)).find(x=>wxMemKey(x)===u);if(!m)return;
  if(famUsesTypes(m)){famWxPop(m,fmt(d));return;}
  if(m.kind==='sched'){famWxOpen(m,fmt(d));return;}   // v0.135 근무표 가족: 그 사람 집(h) · 직장 (내 폰 집이 없어도 — 와이프 폰에서 안 열리던 것) · 옆으로 밀기
  if(!H)return;
  const win=wxMemWin(m,d),wk=wxMemWork(m),W=wxRaw(wk);
  const hq=wxFull(S.wx.home),c=win?WX.commute(H,W,{s:win.s,e:win.e,hn:`집 · ${wxName(S.wx.home)}`,wn:W?`직장 · ${wxName(wk)}`:`집 · ${wxName(S.wx.home)}`,hq,wq:wk?wxFull(wk):hq,now}):WX.dayCard(H,WX.keyD(now),{now,hq});
  if(!c)return;
  const own=m.kind==='sched'&&m.sch&&m.sch.wx&&wxOk(m.sch.wx.w);   // 그 가족이 직접 정해서 보낸 직장이면 여기서 못 바꿈
  const btn=win&&!own?`<button class="mi" data-act="wx-pick-fam" data-u="${esc(u)}" style="justify-content:center;color:var(--accent);font-weight:700">🏭 ${esc(m.name)} 직장 지역 ${wk?`바꾸기 (${esc(wxName(wk))})`:'정하기 · 퇴근 날씨가 더 맞아요'}</button>`:'';
  wxOpenPop(wxPopHtml(`${m.name} · 오늘`,win?`${wxHm(win.s)} 출근 → ${wxHm(win.e)} 퇴근`:'',c,btn,wxDzList(win,S.wx.home,wk),wxHrOf(d,win,S.wx.home,wk,wxName(S.wx.home),wk?wxName(wk):'',now)));
}
// 같이 쉬는 날 칩 아이콘 (10일 앞까지 · 집 날씨)
function wxChipIcon(d){if(!wxOn())return '';const H=wxRaw(S.wx.home);const x=H&&WX.day(H,WX.keyD(new Date(d.getFullYear(),d.getMonth(),d.getDate(),12).getTime()));return x?`<em class="wxi">${wxImg(x.sk)||x.i}</em>`:'';}
// 알람 · 날씨만 알림에 실을 것: 서버에 물어볼 주소(wxq) + 인터넷이 안 될 때 쓸 예비 문구(wxp, 지금 가진 예보로 만든 것)
function wxAlarmQ(x){
  if(!wxOn()||!WX_URL)return null;
  const d=x.sh==='*'||x.a.shift==='*'?new Date(x.at):x.d,w=wxMyWin(d);
  const H=wxRaw(S.wx.home),W=wxRaw(wxWk());
  if(w){
    const q=`${WX_URL}?h=${S.wx.home}${wxOk(wxWk())?`&w=${wxWk()}`:''}&s=${wxStamp(w.s)}&e=${wxStamp(w.e)}`;
    const hq=wxFull(S.wx.home),c=H?WX.commute(H,W,{s:w.s,e:w.e,hn:`집 · ${wxName(S.wx.home)}`,wn:W?`직장 · ${wxName(wxWk())}`:`집 · ${wxName(S.wx.home)}`,hq,wq:wxOk(wxWk())?wxFull(wxWk()):hq,now:x.at.getTime()}):null;
    return {q,p:c?JSON.stringify(c):''};
  }
  const dk=WX.keyD(new Date(d.getFullYear(),d.getMonth(),d.getDate(),12).getTime());
  const c=H?WX.dayCard(H,dk,{now:x.at.getTime(),hq:wxFull(S.wx.home)}):null;if(c)delete c.day;
  return {q:`${WX_URL}?h=${S.wx.home}&d=${dk}`,p:c?JSON.stringify(c):''};
}
// 위젯 큰 창 맨 위 날씨 한 줄 (오늘 · 내일만): 앱이 가진 예보로 만든 것 + 창을 열 때 새로 물어볼 주소(q)
// 위젯 날씨 줄 모양 (가족 것도 같은 모양 · 서버에서 새로 받기(q)는 내 것만)
function wxWidgetOf(c,now){const z=(c.dz||[]).slice().sort((a,b)=>b.g-a.g||b.lv-a.lv)[0],sub=(c.b||[]).length?c.b.map(v=>v.n).join(' · '):c.k.s||'';
  return {t:String(c.k.t).slice(0,24),s:String(sub).slice(0,30),i:c.k.i||'',c:(c.c||[]).slice(0,2).map(v=>[v.sk||'',v.tp==null?null:v.tp]),f:z?z.f:'',wet:(c.c||[]).some(v=>v.hot)?1:0,at:now};}
function wxWidget(d){
  try{
    if(!wxOn()||!wxRaw(S.wx.home))return {};
    const now=Date.now(),c=wxMine(d,now);if(!c||!c.k)return {};
    const x=wxAlarmQ({sh:'',a:{shift:''},d,at:new Date(now)})||{};
    const z=(c.dz||[]).slice().sort((a,b)=>b.g-a.g||b.lv-a.lv)[0];
    const sub=(c.b||[]).length?c.b.map(v=>v.n).join(' · '):c.k.s||'';
    return {wx:{t:String(c.k.t).slice(0,24),s:String(sub).slice(0,30),i:c.k.i||'',c:(c.c||[]).slice(0,2).map(v=>[v.sk||'',v.tp==null?null:v.tp]),f:z?z.f:'',wet:(c.c||[]).some(v=>v.hot)?1:0,at:now,q:x.q||''}};
  }catch(e){return {};}
}
// 가족에게 보낼 것: 내 직장 지역 + 근무별 출퇴근 시각 (날씨를 켜고 직장을 정한 사람만)
function wxShare(){   // v0.134 집(h)도 같이 → 가족 폰은 아무것도 안 골라도 내 출퇴근 날씨 (동네까지만 · 주소 아님)
  if(!wxOn())return null;
  const tm={};workTypes().slice(0,24).forEach(t=>{const x=timesOf(t.k);tm[String(t.k)]=[x.start,x.end];});
  return {w:wxOk(S.wx.work)?S.wx.work:S.wx.home,h:S.wx.home,tm};
}

/* ---- 설정: 날씨 켤 때 화면 하나 (집 · 직장 지역 + 근무 시간 확인) ---- */
function openWxPage(){
  const W=S.wx||{},wt=workTypes();
  const hm=v=>{const [h,m]=String(v||'0:0').split(':').map(Number);return `${h}:${pad(m||0)}`;};   // v0.151 7:00 → 19:00 처럼 짧게
  const tms=S.myset&&wt.length?`<div class="pg-cap">근무 시간</div>
      <div class="pg-sec">${wt.map(t=>{const x=timesOf(t.k),c=timesCustom(t.k);return `<div class="prow tap" data-act="wx-times" data-k="${esc(t.k)}">${badge(t.k,'sm','')}<div class="pl2">${esc(t.name)}</div>${npVal(c?`${hm(x.start)} → ${tm2m(x.end)<=tm2m(x.start)?'다음날 ':''}${hm(x.end)}`:'정하기')}</div>`;}).join('')}</div>`:'';
  openPage(`${pageHead('출퇴근 시간 · 날씨')}
    <div class="pg-b np">
      ${tms}
      <div class="pg-cap">장소</div>
      <div class="pg-sec">
        ${npRow('home','집',npVal(W.home?`<b style="color:var(--fg);font-weight:600">${esc(wxFull(W.home))}</b>`:'고르기'),{tap:1,act:'wx-pick-home'})}
        ${npRow('building','직장',npVal(W.work?`<b style="color:var(--fg);font-weight:600">${esc(wxFull(W.work))}</b>`:'고르기'),{tap:1,act:'wx-pick-work'})}
        ${wxNear(W.home,W.work)?npRow('map-pin','같은 지역으로 보기',`<label class="sw"><input type="checkbox" id="wxOne" ${W.one?'checked':''}><i></i></label>`):''}
      </div>
      <div class="npbtn"><button class="btn" data-act="wx-ok">맞아요</button></div>
    </div>`,'wx');
}
let wxPickFor='home';
function wxPickSido(f){
  wxPickFor=f;const cur=f==='home'?S.wx.home:f==='work'?S.wx.work:(S.wx.fw||{})[f.slice(2)];
  const sidos=[...new Set(WX_REG.map(r=>r[1]))],cs=(wxReg(cur)||[])[1];
  openPop(`<div class="mh">${f==='home'?'집':f==='work'?'직장':f==='a:'?(actPickTitle||'활동 위치').replace(/^\S+\s/u,m=>/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(m)?'':m):'가족 직장'}<b>시 · 도를 골라요</b></div><div class="wxg">${sidos.map(s=>`<button class="${s===cs?'on':''}" data-act="wx-sido" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    ${f==='a:'?`<button class="mi" data-act="wx-clear" style="justify-content:center;font-weight:700">🏠 집과 같게</button>`:''}
    ${f==='work'&&S.wx.work||f.startsWith('f:')&&cur?`<button class="mi" data-act="wx-clear" style="justify-content:center;color:var(--muted)">직장 지역 비우기</button>`:''}
    <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);
}
function wxPickSgg(sido){
  const list=WX_REG.filter(r=>r[1]===sido);
  openPop(`<div class="mh">${esc(sido)}<b>시 · 군 · 구를 골라요</b></div><div class="wxlist">${list.map(r=>`<button class="mi" data-act="wx-sgg" data-v="${r[0]}">${esc(r[2])}</button>`).join('')}</div>
    <button class="mi" data-act="wx-back" style="justify-content:center;color:var(--muted)">‹ 시 · 도 다시 고르기</button>`);
}
// 동 고르기 (선택): 서버에서 그 시·군·구의 동 목록을 받아 옴 · 못 받으면 시·군·구로
const wxDongC={};
async function wxPickDong(sgg){
  const r=WX_BY.get(sgg);if(!r)return;
  if(!WX_URL){wxSet(sgg);return;}
  const show=l=>openPop(`<div class="mh">${esc(r[2])}<b>동까지 고르면 더 정확해요 (선택)</b></div><div class="wxlist">
    <button class="mi" data-act="wx-dong" data-v="${sgg}" style="font-weight:700">${esc(r[2])} 전체 <small style="margin-left:auto;color:var(--muted);font-size:12px">동 안 고름</small></button>
    ${l.map(x=>`<button class="mi" data-act="wx-dong" data-v="${x[0]}" data-n="${esc(x[1])}">${esc(x[1])}</button>`).join('')}</div>
    <button class="mi" data-act="wx-back" style="justify-content:center;color:var(--muted)">‹ 시 · 도 다시 고르기</button>`);
  if(wxDongC[sgg]){show(wxDongC[sgg]);return;}
  openPop(`<div class="mh">${esc(r[2])}<b>동 목록 받는 중…</b></div>`);
  try{
    const res=await fetch(`${WX_URL}?dongs=${sgg}`),j=await res.json();
    const l=(Array.isArray(j.list)?j.list:[]).filter(x=>Array.isArray(x)&&/^\d{10}$/.test(x[0])&&x[0].startsWith(sgg)&&typeof x[1]==='string').map(x=>[x[0],x[1].slice(0,12)]);
    if(!l.length)throw 0;
    wxDongC[sgg]=l;show(l);
  }catch(e){wxSet(sgg);}
}
// 집과 직장이 가까운지 (같은 시·군·구 또는 예보 칸 거리 10km 안 · 동은 시·군·구 칸으로 셈)
function wxNear(a,b){
  if(!wxOk(a)||!wxOk(b))return false;if(a.slice(0,5)===b.slice(0,5))return true;
  const x=WX_BY.get(a.slice(0,5)),y=WX_BY.get(b.slice(0,5));if(!x||!y)return false;
  return Math.hypot(x[3]-y[3],x[4]-y[4])*5<=10;
}
function wxAskOne(){
  openPop(`<div class="mh">직장<b>집과 가까워요. 같은 지역으로 볼까요?</b></div>
    <button class="mi" data-act="wx-one" data-v="1" style="justify-content:center;font-weight:800;color:var(--accent)">같은 지역으로</button>
    <button class="mi" data-act="wx-one" data-v="0" style="justify-content:center">따로 보기 (출근 = 집 · 퇴근 = 직장)</button>`);
}
function wxSet(code){
  if(!S.wx)S.wx={home:'',work:'',fw:{}};
  if(wxPickFor==='a:'){save();actRegionDone(code);wxFetch(true);return;}
  if(wxPickFor==='home')S.wx.home=code;else if(wxPickFor==='work')S.wx.work=code;
  else{S.wx.fw=S.wx.fw||{};const id=wxPickFor.slice(2);if(code)S.wx.fw[id]=code;else delete S.wx.fw[id];}
  {const used=new Set([S.wx.home,S.wx.work,...Object.values(S.wx.fw||{}),...actRegions()]),nm=S.wx.nm||{};(S.family||[]).forEach(m=>[m,...(m.eras||[])].forEach(x=>{if(x){used.add(x.loc);used.add(x.home);}}));Object.keys(nm).forEach(k=>{if(!used.has(k))delete nm[k];});S.wx.nm=nm;}
  if(wxPickFor==='work'){if(code&&wxNear(S.wx.home,code)){save();wxFetch(true);wxAskOne();return;}delete S.wx.one;}
  save();closePop();
  if(wxPickFor.startsWith('f:'))render();else openWxPage();
  wxFetch(true);
}
function wxActs(act,t){
  switch(act){
    case 'wx-set':openWxPage();return true;
    case 'wx-dust':wxOpenDust();return true;
    case 'wx-dust-tab':wxDzTab=+t.dataset.i||0;wxDustPaint();return true;
    case 'wx-dust-close':wxDustClose();return true;
    case 'wx-pick-home':wxPickSido('home');return true;
    case 'wx-pick-work':wxPickSido('work');return true;
    case 'wx-pick-fam':wxPickSido('f:'+t.dataset.u);return true;
    case 'wx-sido':wxPickSgg(t.dataset.v);return true;
    case 'wx-back':wxPickSido(wxPickFor);return true;
    case 'wx-sgg':wxPickDong(t.dataset.v);return true;
    case 'wx-dong':if(t.dataset.n){S.wx.nm=S.wx.nm||{};S.wx.nm[t.dataset.v]=t.dataset.n;}wxSet(t.dataset.v);return true;
    case 'wx-clear':wxSet('');return true;
    case 'wx-one':if(t.dataset.v==='1')S.wx.one=true;else delete S.wx.one;save();closePop();if(pageMode==='wx')openWxPage();else render();try{pushAlarmsToNative();pushWidgetToNative();}catch(e){}return true;
    case 'wx-times':openPatTimes(openWxPage);return true;
    case 'wx-ok':
      if(!wxOk(S.wx.home)){toast('집 지역을 먼저 골라 주세요');wxPickSido('home');return true;}
      S.addons.wx=true;save();pageBack=null;closePage();render();toast('☔ 출퇴근 시간 · 날씨를 켰어요');wxFetch(true);famSoon();return true;
    case 'wx-day':wxOpenDay(t.dataset.v);return true;
    case 'wx-fam':wxOpenFam(t.dataset.u);return true;
    case 'wx-web':S.hints=S.hints||{};S.hints.wxweb=99;if(!hasBridge('openUrl'))closePop();lnkGo(WX.naver(t.dataset.q));return true;   // v0.121 앱에선 위에 뜨는 창으로 열려서 팝업은 그대로 (돌아오면 보던 화면)   // 출근 줄 = 집 · 퇴근 줄 = 직장 지역 네이버 날씨
  }
  return false;
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>wxFetch(false),1500);});
// 시험용 창구 (tests/phone/s71.js) — 날씨 기능 함수만
window.__wx={toast,toastUndo,manPlanned,visibleMemos,famLbl,famTypeAt,famWx,shiftOf,wxMyWin,openStampReg,actAuto,stampPlanned,myActs,manPlanned,famActNow,wxMine,get S(){return S;},get page(){return {pageMode,pageBack};},openDay,closeSheet,closePop,closePage,openAddonPage,render,save,pushAlarmsToNative,pushRemindersToNative,famCleanSched,famPayload,
  newAlarm:o=>{draft=Object.assign(newAlarm(),o||{});alSnd=false;openAlarmPage();},wxOn,wxRaw,wxFam,wxMemWin,wxMemWork,wxMemKey,wxOpenFam,wxOpenDay,wxChipIcon,
  openPatternPage,openStatsPage,openSlipPage:ym=>{slipYM=ym;openSlipPage();},statsCalc,payRates,dayHours,famTimesPayload,memberStatus,otOpen,get stYM(){return stYM;},set stYM(v){stYM=v;}};
Object.defineProperty(window.__wx,'stDraft',{get:()=>stDraft});Object.assign(window.__wx,{fitDnT:(r,k)=>fitDn(r,k),stzPanelT:(e,m)=>stzPanel(e,m),wxHistPop:(...a)=>wxHistPop(...a),admTest:(codes,log)=>{admOk=true;adm={q:'',sel:null,codes,log,busy:false};},openAdmPage:()=>openAdmPage(),myCode:u=>myCode(u),famRemainT:()=>famRemain(),setBx:(a,b)=>{famBx={me:a,all:b};},stampRegSave:()=>stampRegSave(),dsTgo:(k,a)=>dsTgo(k,a),dsTdy:k=>dsTdy(k),patResetOpen:q=>patResetOpen(q),famWxOpen,stampsOn,openFeed,coachCheck,pushWidgetNow:()=>{try{window.AndroidBridge.setWidgetData(widgetJson());}catch(e){}},wxHist,wxHistSave,widgetSync,famNameOf:u=>famNameOf(u),famPeers,applyBackup,backupData,alarmMsg});   // v0.127 시험용


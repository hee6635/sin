/* ================= 🔔 가족 소식 ================= */
let feedTab='all';
function feedEvents(){
  const r=role();
  return S.events.filter(e=>e.to===r&&!(e.kind==='memo'&&S.syncSettings.receiveFamilyMemo===false));
}
function unseenCount(){return feedEvents().filter(e=>!e.seen).length;}
const EV_IC={req:'📩',cc:'📣',sch:'🔁',reply:'💬',apply:'✅',memo:'♥',board:'📝',hol:'📢',dday:'D',join:'👪',cheer:'💌'};
function feedBody(){
  const isHost=role()==='host';
  const all=feedEvents();
  const pick=e=>feedTab==='all'||(feedTab==='req'?['req','reply','apply'].includes(e.kind):['memo','board'].includes(e.kind));
  const list=all.filter(pick);
  const nReq=all.filter(e=>!e.seen&&['req','reply','apply'].includes(e.kind)).length;
  const nMemo=all.filter(e=>!e.seen&&['memo','board'].includes(e.kind)).length;
  const dayLbl=t=>{const d=new Date(t),k=fmt(d),tk=fmt(new Date());if(k===tk)return '오늘';if(k===addK(tk,-1))return '어제';return `${d.getMonth()+1}월 ${d.getDate()}일`;};
  let last='',rows='';
  list.forEach(e=>{
    const lb=dayLbl(e.t);
    if(lb!==last){rows+=`<div class="feed-day">${lb}</div>`;last=lb;}
    let extra='';
    if(isHost&&e.kind==='req'){
      const r=S.requests.filter(x=>x.date===e.k&&x.st==='pending'&&(!x.srv||x.dir==='in')).sort((a,b)=>b.t-a.t)[0];
      if(r)extra=`${r.msg?`<div class="q">${esc(r.msg)}</div>`:''}
        <div class="btns"><button data-act="rqreply" data-id="${r.id}" data-s="pending">보류</button><button class="ok" data-act="rqreply" data-id="${r.id}" data-s="accepted">수락</button><button class="no" data-act="rqreply" data-id="${r.id}" data-s="rejected">거절</button></div>`;
    }
    rows+=`<div class="ev ${e.seen?'':'new'}" data-act="feed-open" data-id="${e.id}">
      <div class="ic" style="${e.kind==='memo'?'background:var(--fam-bg);color:var(--fam)':''}">${EV_IC[e.kind]||'•'}</div>
      <div class="tx">${esc(e.text)}${extra}<small>${rel(e.t)}</small></div>
      ${e.seen?'':'<div class="nd"></div>'}
    </div>`;
  });
  return `
    <div class="mtabs">
      <button class="${feedTab==='all'?'on':''}" data-act="feed-tab" data-v="all">전체</button>
      <button class="${feedTab==='req'?'on':''}" data-act="feed-tab" data-v="req">근무 요청${nReq?` ${nReq}`:''}</button>
      <button class="${feedTab==='memo'?'on':''}" data-act="feed-tab" data-v="memo">가족 메모${nMemo?` ${nMemo}`:''}</button>
      <button class="${feedTab==='log'?'on':''}" data-act="feed-tab" data-v="log">근무 기록</button>
      <span class="grow"></span>
      <button data-act="feed-allread" style="background:none">모두 읽음</button>
    </div>
    ${feedTab==='log'?chLogBody():S.link&&feedTab==='req'?reqTabBody():(rows||'<div class="mempty" style="padding:30px 0;text-align:center">아직 소식이 없어요</div>')}
    <button class="btn ghost" style="width:100%;margin-top:14px" data-act="view-requests">${isHost?'📩 가족 요청 전체 보기':'📩 내 요청 내역'}</button>`;
}
// v0.135 근무 기록 탭: 언제 바꿨는지 · 받은 때 · 요청 · 보류 · 수락 · 거절 (3개월)
function chLogBody(){
  const L=(S.chLog||[]).slice().sort((a,b)=>b.t-a.t);if(!L.length)return '<div class="mempty" style="padding:30px 0;text-align:center">최근 3개월 동안 바뀐 근무가 없어요</div>';
  const nm=x=>x||'미정',tm=t=>{const d=new Date(t);return `${d.getMonth()+1}/${d.getDate()} ${t12(`${pad(d.getHours())}:${pad(d.getMinutes())}`,false)}`;};
  const AL={req:'근무 요청을 보냈어요',pending:'요청을 보류했어요',held:'요청을 보류했어요',accepted:'요청을 수락했어요',rejected:'요청을 거절했어요',applied:'요청이 달력에 반영됐어요'};
  return `<div class="chlog">${L.map(x=>`<div class="ev" data-act="feed-go" data-k="${x.k}"><div class="ic">${x.a==='chg'?'🔁':x.a==='accepted'||x.a==='applied'?'✅':x.a==='rejected'?'✖':x.a==='held'?'⏸':'📩'}</div>
    <div class="tx"><b>${esc(x.w)}</b> · ${mdw(x.k)} ${x.a==='chg'?`근무 ${esc(nm(x.f))} → <b>${esc(nm(x.to))}</b>`:`${x.want?esc(nm(x.want))+' ':''}${AL[x.a]||''}`}
      <small>${tm(x.t)} ${x.a==='chg'?'바꿈':''}${x.rcv&&x.rcv-x.t>600000?` · 내 폰에 ${tm(x.rcv)} 도착`:''}</small></div></div>`).join('')}</div>
`;
}
// 가족 소식은 이제 "가족" 탭에서 본다
function openFeed(){
  if(pageMode)closePage();
  openSheet(`${sheetHead('🔔 가족 소식')}${feedBody()}`);sheetMode='feed';
}
/* ================= 👪 가족 탭: 지금 · 이번 주 가족 시간표 · 같이 쉬는 날 ================= */
/* 직접 추가한 가족 S.family = [{id, name, color, kind('shift'|'office'|'student'|'free'), team(같은 패턴의 조),
 *   days(평일 근무 요일), start, end(출퇴근 · 등하교), holOff(공휴일 쉼), vac:[{from,to}](방학)}] */
const FAM_COL=['#e5484d','#f59e0b','#10b981','#3b6fd6','#8b5cf6','#ec4899'];
const FAM_KIND={shift:['🔁','교대 근무'],office:['💼','평일 근무'],student:['🏫','학생'],free:['🏠','일정 없음']};
const CHEER_DEF=[['☕','수고해'],['💪','힘내'],['🍗','야식 먹어'],['❤️','사랑해']];
let famAnchor='';   // 시간표에서 마지막으로 보던 날(오늘 가운데: 가운데 날 · 주 단위: 그 주 첫날) — 다시 그려도 그 자리를 지킴
function famInit(){
  const sc=document.getElementById('fgs');if(!sc)return;
  if(!sc.clientWidth){requestAnimationFrame(()=>{if(document.getElementById('fgs')===sc&&sc.clientWidth)famInit();});return;}   // 아직 화면에 안 그려졌으면 한 번 기다림
  const heads=[...sc.querySelectorAll('.fh')],mode=sc.dataset.m,todayK=fmt(new Date());
  const w=()=>sc.clientWidth/7,idxOf=k=>heads.findIndex(h=>h.dataset.k===k);
  const defIdx=mode==='c'?idxOf(todayK):Math.max(0,idxOf(todayK)-new Date().getDay());
  let ai=famAnchor?idxOf(famAnchor):-1;if(ai<0)ai=defIdx;
  const left=mode==='c'?ai-3:ai;
  sc.scrollLeft=Math.max(0,left)*w();
  const upd=()=>{
    if(!sc.clientWidth||heads.length<7)return;
    const i=Math.max(0,Math.min(heads.length-7,Math.round(sc.scrollLeft/w())));
    const a=parse(heads[i].dataset.k),b=parse(heads[i+6].dataset.k);
    const t=document.getElementById('fwkT');if(t)t.textContent=a.getMonth()===b.getMonth()?`${a.getMonth()+1}월 ${a.getDate()}일 ~ ${b.getDate()}일`:`${a.getMonth()+1}월 ${a.getDate()}일 ~ ${b.getMonth()+1}월 ${b.getDate()}일`;
    famAnchor=heads[mode==='c'?i+3:i].dataset.k;
    const ti=idxOf(todayK),far=mode==='c'?(i+3!==ti):!(ti>=i&&ti<i+7);
    const nb=document.getElementById('fwkNow');if(nb)nb.hidden=!far;
  };
  upd();
  let tm=null,ready=false;setTimeout(()=>{ready=true;},400);   // 처음 자리 잡을 때 나는 스크롤은 사람이 쓴 게 아님
  sc.addEventListener('scroll',()=>{
    if(ready&&!S.famSwiped){S.famSwiped=true;save();const h=document.getElementById('fgHint');if(h)h.remove();}
    clearTimeout(tm);tm=setTimeout(upd,60);
  },{passive:true});
}
function famGoToday(){
  const sc=document.getElementById('fgs');if(!sc)return;
  const heads=[...sc.querySelectorAll('.fh')],mode=sc.dataset.m,ti=heads.findIndex(h=>h.dataset.k===fmt(new Date()));
  if(ti<0)return;
  const left=mode==='c'?ti-3:Math.max(0,ti-new Date().getDay());
  sc.scrollTo({left:left*sc.clientWidth/7,behavior:'smooth'});
}
const isHolK=k=>!!(holName(k)||compHol(k));
function famShift(m,d){   // 직접 추가한 교대 가족: 이 날만 바꾼 날 > 자기 패턴 > 내 조 따라가기
  const o=m.ov&&m.ov[fmt(d)];if(o)return o;
  if(m.own&&Array.isArray(m.pat)&&m.pat.length>1&&/^\d{4}-\d{2}-\d{2}$/.test(m.anc||'')){const n=m.pat.length,i=((dayNum(d)-dayNum(parse(m.anc)))%n+n)%n;return m.pat[i];}
  return teamShift(d,m.team??S.myTeam);
}
/* ---- v0.117 직접 추가한 가족의 일정 종류 (근무타입처럼: 이름 · 달력 표시 두 글자 · 색 · 시간 · 쉬는 날) + 이 날부터 새 일정(구간) ---- */
const FT_COL=['#a3d4b5','#cfe9b0','#f3c99a','#a6c6e2','#e0b8a3','#d8c4ef','#f2b8c6','#b9c2ce'];
const famUsesTypes=m=>!!m&&m.kind!=='shift'&&m.kind!=='sched';
// 예전 설정(학교 · 회사 · 시간 · 가는 곳 이름)에서 만든 기본 종류: 'on'(가는 날) · 'off'(쉬는 날) → 예전에 이 날만 바꾼 값 그대로 맞음
function famTypesDef(m){
  const st=m.kind==='student',on={k:'on',name:m.kind==='free'?'일정 있음':(String(m.label||'').trim()||(st?'학교':'회사')),color:st?'#a3d4b5':'#b9c2ce'};
  if(m.kind!=='free'){on.s=m.start||(st?'08:30':'09:00');on.e=m.end||(st?'15:00':'18:00');}
  return [on,{k:'off',name:'쉬는 날',rest:true}];
}
// 그 날에 쓰는 구간 (구간이 없으면 가족 그대로) · 같은 객체(고칠 때) / 합친 사본(읽을 때)
function famEraRef(m,d){if(!Array.isArray(m.eras)||!m.eras.length)return m;const k=fmt(d);let e=null;m.eras.forEach(x=>{if(x&&x.from<=k&&(!e||x.from>e.from))e=x;});return e||m;}
function famEra(m,d){const e=famEraRef(m,d);return e===m?m:Object.assign({},m,e,{eras:m.eras,ov:m.ov,id:m.id,name:m.name,kind:m.kind});}
const famTypes=c=>Array.isArray(c.ftypes)&&c.ftypes.length?c.ftypes:famTypesDef(c);
const ftAb=t=>t.rest&&!t.ab?'휴':(String(t.ab||'').trim()||(()=>{const a=[...String(t.name||'')];return a.length<=2?a.join(''):(a[0]||'·');})());
const famWorkType=c=>famTypes(c).find(x=>!x.rest)||famTypes(c)[0];
const famRestType=c=>famTypes(c).find(x=>x.rest)||{k:'off',name:'쉬는 날',rest:true};
// 그 날 종류: 이 날만 바꾼 값 → 평소(요일 · 방학 · 공휴일)
function famTypeAt(m,d){
  const c=famEra(m,d),L=famTypes(c),o=m.ov&&m.ov[fmt(d)];
  const t=o&&L.find(x=>x.k===o);if(t)return t;
  if(o==='off')return famRestType(c);if(o==='on')return famWorkType(c);
  return memberOff(Object.assign({},c,{ov:null}),d)?famRestType(c):famWorkType(c);
}
// 그 날 가는 시간 (쉬는 날 · 시간 없는 종류면 null)
function famTimes(m,d){const t=famTypeAt(m,d);return t&&!t.rest&&t.s&&t.e?{s:t.s,e:t.e}:null;}
function memberOff(m,d){
  const k=fmt(d),w=d.getDay();
  if(m.kind==='sched')return schRest(m.sch,schShift(m.sch,d));
  const o=m.ov&&m.ov[k];if(o&&m.kind!=='shift'){if(o==='off')return true;if(o==='on')return false;const t=famTypes(famEra(m,d)).find(x=>x.k===o);return t?!!t.rest:false;}   // 이 날만 바꾼 날
  if(m.kind==='free')return true;
  if(m.kind==='shift')return isRest(famShift(m,d));
  m=famEra(m,d);
  if(m.kind==='student'){
    if((m.vac||[]).some(v=>v.from&&v.to&&k>=v.from&&k<=v.to))return true;
    return w===0||w===6||(m.holOff!==false&&!!holName(k));
  }
  const days=m.days||[1,2,3,4,5];
  return !days.includes(w)||(m.holOff!==false&&!!holName(k));
}
function memberCell(m,d,dot){   // dot: 이 날만 바꾼 날 표시(직접 추가한 가족 달력에서만)
  const dt=dot&&S.ovDot!==false&&m.ov&&m.ov[fmt(d)]?'<i class="dot"></i>':'';
  if(m.kind==='sched')return schBadge(m.sch,schShift(m.sch,d),'sm');
  if(m.kind==='shift')return badge(famShift(m,d),'sm',dt);
  return manBadge(m,d,dt,'sm');   // v0.117 내 근무처럼 동그라미 (종류 글자 · 색)
}
// 같이 쉬는 날: 'all' 종일 / 'day' 야간 근무 날 출근 전 낮 / ''
const togKey=m=>String(m.id||m.uid||'');
const togFam=()=>(S.family||[]).concat(famPeers()).filter(m=>!(S.togOff||[]).includes(togKey(m)));   // v0.171 "누구랑 같이"에서 고른 가족만
function togetherOn(d){
  if(!ad('together'))return '';
  const fam=togFam();if(!fam.length)return '';
  if(!fam.every(m=>memberOff(m,d)))return '';
  if(famView())return 'all';
  const k=shiftOf(d);
  if(isRest(k))return 'all';
  if(S.famDayToo!==false&&tm2m(timesOf(k).start)>=15*60)return 'day';
  return '';
}
// 가족(직접 추가)의 지금 활동 · 오늘 다음 활동
function famActs(m,d){const k=fmt(d);return (m.sdefs||[]).filter(x=>x.act&&!x.retired&&(manPlanned(m,x,k)||((m.stk||{})[k]||[]).includes(x.id))).map(x=>({x,sp:actSpan(x.act,d)})).filter(z=>z.sp).sort((a,b)=>a.sp.s-b.sp.s);}
function famActNow(m,now){
  if(m.kind==='sched')return null;const d=new Date(now),list=famActs(m,d),cur=list.find(z=>now>=z.sp.s&&now<z.sp.e);if(!cur)return null;
  const nx=list.find(z=>z.sp.s>=cur.sp.e);return [icoTxt(cur.x.emoji,'🎒'),`${cur.x.name||'활동'} 중`,`${t12(cur.x.act.e,true)} 끝${nx?` · ${t12(nx.x.act.s,true)} ${nx.x.name||''}`:''}`];
}
function memberStatus(m,now){
  const d=new Date(now),h=d.getHours()*60+d.getMinutes(),k=fmt(d);
  if(m.kind==='sched'){const sh=schShift(m.sch,d),nm=schType(m.sch,sh).name;
    if(m.sch.tm||m.sch.ot){   // 그 가족이 근무 시간을 보냈으면: 근무 중 · 몇 시 끝 (어젯밤 야간이 이어지는 것도)
      for(const dd of [d,addDays(d,-1)]){const w=wxMemWin(m,dd);if(w&&now>=w.s&&now<w.e){const sh2=schShift(m.sch,dd);return [stLabel('work').e,'근무 중',`${wxHm(w.e)} 끝`,sh2];}}
      const w=wxMemWin(m,d);if(w&&now<w.s)return ['⏰','출근 전',`${wxHm(w.s)} 시작`,sh];
      if(w&&now>=w.e&&!schRest(m.sch,sh))return ['⏰','퇴근 후',nm,sh];
    }
    return schRest(m.sch,sh)?['🙂','쉬는 중','']:['🔁',nm,''];}
  if(m.kind==='shift'){
    const sh=famShift(m,d);
    if(isRest(sh))return ['🙂','쉬는 중',''];
    if(!timesCustom(sh))return ['🔁',shiftLabel(sh),'',sh];   // v0.171 시간을 안 정했으면 근무 이름만
    const t=timesOf(sh),s=tm2m(t.start);let e=tm2m(t.end);
    const inW=e>s?(h>=s&&h<e):(h>=s||h<e);
    return inW?[stLabel('work').e,'근무 중',`${t12(t.end,true)} 끝`,sh]:h<s?['⏰','출근 전',`${t12(t.start,true)} 시작`,sh]:['⏰','퇴근 후','',sh];
  }
  {const ac=famActNow(m,now);if(ac)return ac;}   // v0.114 학원 · 취미 시간이면 "🎹 피아노 중 · 17:30 끝"
  if(h>=23*60||h<6*60)return ['😴','자는 중',''];
  if(m.kind==='free')return ['🏠','집',''];
  if(memberOff(m,d)){
    const vac=m.kind==='student'&&(famEra(m,d).vac||[]).find(v=>k>=v.from&&k<=v.to);
    return vac?['🏫','방학',`~${+vac.to.slice(5,7)}/${+vac.to.slice(8)}`]:['🏠','쉬는 날',''];
  }
  const ty=famTypeAt(m,d),tt=famTimes(m,d);if(!tt)return [m.kind==='student'?'🏫':'💼',ty.name||famLbl(m),''];
  const st=m.kind==='student',sch=st&&famSchool(ty.name),s=tm2m(tt.s),e=tm2m(tt.e);
  if(h>=s&&h<e)return [st?'🏫':'💼',ty.name||famLbl(m),`${t12(tt.e,true)} ${st?(sch?'하교':'하원'):'퇴근'}`];
  return ['🏠','집',h<s?`${tt.s} ${ty.name||''} ${st?(sch?'등교':'등원'):'출근'}`.replace(/\s+/g,' '):''];
}
// v0.169 가족 "지금" 카드: 이모지 대신 선 아이콘 칸 + 상태 크게 + 아래 다음 일 (시안 design/viewfam)
function famStRow(m,e,l,sub,now,sk){
  const L=String(l||''),E=String(e||'');
  let ic='clock',c='#6b7684',bdg='';
  const skTy=sk&&m.kind!=='sched'?typeOf(sk):sk&&m.sch?schType(m.sch,sk):null,skC=skTy&&!skTy.rest?tColors(skTy):null;   // v0.171 출근 전 · 퇴근 후 · 시간 없는 근무 = 근무 글자 동그라미
  if(skC&&!/근무 중/.test(L)){bdg=`<span class="sic sbd" style="background:${skC.bg};color:${skC.fg}">${esc(String(sk).slice(0,2))}</span>`;}
  else if(E==='🔁'&&m.kind==='sched'){const sh=schShift(m.sch,new Date(now)),ty=schType(m.sch,sh),tc=ty&&!ty.rest?tColors(ty):null;bdg=tc?`<span class="sic sbd" style="background:${tc.bg};color:${tc.fg}">${esc(String(sh).slice(0,2))}</span>`:'';if(!bdg){ic='home';c='#1fa971';}}
  else if(/😴|자는/.test(E+L)){ic='moon';c='#4b5bbd';}
  else if(/🏭|💼|근무 중/.test(E+L)){ic='briefcase';c=skC?deepHex(cssHex(skC.bg)||'#3f6f9f'):'#3f6f9f';if(m.kind==='sched'&&!skC){const ty=schType(m.sch,schShift(m.sch,new Date(now)));if(ty&&!ty.rest&&ty.color)c=deepHex(cssHex(tColors(ty).bg)||c);}}
  else if(/🏫|학교|유치원|등원|하원/.test(E+L)){ic='book-open';c='#f08a00';}
  else if(/🚗|출근 중|퇴근 중/.test(E+L)){ic='map-pin';c='#3182f6';}
  else if(/🙂|🏖|🏠|쉬는|휴|집|방학/.test(E+L)){ic='home';c='#1fa971';}
  return `<div class="st2">${bdg?bdg:`<span class="sic" style="--c:${c}">${npi(ic,20)}</span>`}<div class="stt"><b>${esc(L)}</b>${sub?`<span>${esc(sub)}</span>`:''}</div></div>`;
}
const deepHex=h=>{try{const n=parseInt(String(h).slice(1),16);const f=x=>Math.round(x*.62).toString(16).padStart(2,'0');return '#'+f(n>>16&255)+f(n>>8&255)+f(n&255);}catch(e){return '#3f6f9f';}};
function cheerList(){return (Array.isArray(S.famCheer)&&S.famCheer.length?S.famCheer:CHEER_DEF);}
// 가족 동그라미: 사진이 있으면 사진, 없으면 첫 글자 + 색
function famAv(m,i){const src=isPhoto(m.photo)&&(S.icons||{})[m.photo.slice(1)];return `<i style="background:${m.color||FAM_COL[i%6]}">${src?`<img src="${src}" alt="">`:esc((m.name||'?').slice(0,1))}</i>`;}
function renderFamily(){
  const isHost=role()==='host',fam=(S.family||[]).concat(famPeers()),now=Date.now(),t0=new Date();
  const st=myStatus(now);   // v0.106: "내 상태" 부가 기능 없앰 → 근무 시간이 있으면 늘 "근무 중 · 몇 시 끝" + 막대
  const today=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate());
  const workerName=isHost?'나':'근무자';
  // 이름 줄: 혼자면 없음, 가족이 있으면 "나" 동그라미만 (나 나 두 번 안 쓰게)
  const meWho=isHost?(fam.length?'<div class="nwho"><i style="background:#1d2330">나</i></div>':''):'<div class="nwho"><i style="background:#1d2330">근</i>근무자</div>';
  // 내 카드 (v0.107): 상태는 "나" 옆 · 날씨를 켰으면 상태는 작게 + 날씨 카드 크게, 안 켰으면 상태를 크게
  const myWx=isHost&&wxOn()&&wxRaw(S.wx.home)?(()=>{try{return wxMine(new Date(now),now);}catch(e){return null;}})():null;
  const myRs=myWx?wxRestMini(myWx,new Date(now)):null,myWxC=myRs?{...myWx,c:myRs}:myWx,myWxM=myRs&&myWx.day?{...myWx,c:[myRs[0],{l:'오늘',tt:`${myWx.day.lo}°/${myWx.day.hi}°`}]}:myWx;   // v0.143 쉬는 날: 지금 · 오늘 최저/최고
  const av=isHost?'<i class="mav">나</i>':'<i class="mav">근</i>';
  const meRow=sub=>famStRow({kind:'shift'},st.e||'',st.t,sub,now,st.sk);   // v0.171 내 카드도 이모지 대신 선 아이콘 칸 (가족 카드와 같은 모양)
  const stLine=meRow(st.sub);
  const meCard=myWx?`<div class="nc w me2">
      <div class="mtop" ${isHost?'data-act="fam-mycal"':''}>${av}<div class="mst">${stLine}${st.prog!==undefined?`<div class="bar"><i style="width:${Math.round(st.prog*100)}%"></i></div>`:''}</div></div>
      ${wxCardHtml(myWxC,wxCls(myWx),'data-act="wx-fam" data-u="me"')}
    </div>`:`<div class="nc w me2 big" ${isHost?'data-act="fam-mycal"':''}>
      <div class="mtop">${av}<div class="mst">${meRow([st.sub,st.left].filter(Boolean).join(' · '))}</div></div>
      ${st.prog!==undefined?`<div class="bar"><i style="width:${Math.round(st.prog*100)}%"></i></div>`:''}
    </div>`;
  // v0.121 가족이 있으면 나 · 가족 카드 모두 같은 크기 · 같은 모양: 상태 · 막대 · 작은 날씨 줄 · (비 · 미세먼지면) 결론 한 줄
  const pbar=v=>v!==undefined&&v!==null?`<div class="bar"><i style="width:${Math.round(v*100)}%"></i></div>`:'<div class="bar" style="visibility:hidden"></div>';   // v0.124 막대가 없어도 자리는 남김 → 카드끼리 날씨 칸 높이가 맞음
  const meCard2=`<div class="nc w fc2" ${isHost?'data-act="fam-mycal"':''}><div class="ctop"><i style="background:#1d2330">${isHost?'나':'근'}</i><div class="cst">${isHost?'':'<small>근무자</small>'}</div></div>${meRow(st.sub||st.left||'')}${pbar(st.prog)}${myWx?wxMiniHtml(myWxM,'data-act="wx-fam" data-u="me"'):''}</div>`;
  const memCards=fam.map((m,i)=>{const [e,l,sub,sk]=memberStatus(m,now);const fw=(wxOn()||(m.kind==='sched'&&famSchedHome(m)))?famNowWx(m,now):null;return `<div class="nc fc2 ${l==='자는 중'?'slp':''}" ${m.kind==='sched'?`data-act="fam-viewcal" data-u="${esc(m.uid)}"`:`data-act="fam-mancal" data-id="${m.id}" data-hold="fam"`}>${m.kind==='sched'?'':`<span class="mced" data-act="fam-edit" data-id="${m.id}" aria-label="고치기">✏️</span>`}<div class="ctop">${famAv(m,i)}<div class="cst"><small>${esc(m.name)}</small></div></div>${famStRow(m,e,l,sub,now,sk)}${pbar(famProg(m,now))}${fw?wxMiniHtml(fw,`data-act="wx-fam" data-u="${esc(wxMemKey(m))}"`):false?'<div class="mwx mwx-off" data-act="wx-set">☔ 날씨도 보기 · 집 지역 고르기 ›</div>':''}</div>`;}).join('');
  const cheerBtns='';   // v0.106: 응원 버튼 없앰
  // 이번 주 시간표
  // 가족 시간표: 오늘 가운데(앞뒤 30일) 또는 주 단위(앞뒤 4주) · 옆으로 쓸어서 넘김 · 오늘 열은 위에서 아래까지 하나의 네모 박스
  const wkMode=S.famWk==='w'?'w':'c',todayK=fmt(today);
  const days=wkMode==='c'?[...Array(61)].map((_,i)=>addDays(today,i-30)):(()=>{const s0=addDays(today,-today.getDay()-28);return [...Array(63)].map((_,i)=>addDays(s0,i));})();
  const tog=days.map(togetherOn);
  const head=days.map((d,i)=>{const k=fmt(d),w=d.getDay(),sn=wkMode==='c'||w===0;return `<div class="fh ${tog[i]} ${k===todayK?'tdc':''} ${sn?'sn':''}" data-k="${k}" style="${holName(k)||w===0?'color:var(--sun)':w===6?'color:var(--sat)':''}">${DOW[w]}<b>${d.getDate()}</b></div>`;}).join('');
  const rowsDef=[];
  if(!famView())rowsDef.push([`<div class="fn"><i style="background:#1d2330">${isHost?'나':'근'}</i>${isHost?'':workerName}</div>`,d=>badge(shiftOf(d),'sm')]);
  fam.forEach((m,j)=>rowsDef.push([`<div class="fn" ${m.kind==='sched'?`data-act="fam-viewcal" data-u="${esc(m.uid)}"`:`data-act="fam-mancal" data-id="${m.id}"`}>${famAv(m,j)}${esc(m.name)}</div>`,d=>memberCell(m,d)]));
  const fcells=(f,last)=>days.map((d,i)=>{const t=fmt(d)===todayK;return `<div class="fc ${tog[i]} ${t?'tdc':''} ${t&&last?'lr':''} ${last?'lst':''}">${f(d)}</div>`;}).join('');
  const rowsHtml=rowsDef.map((r,i)=>fcells(r[1],i===rowsDef.length-1)).join('');
  const namesHtml=`<div class="fnh"></div>`+rowsDef.map(r=>r[0]).join('');
  const nShow=days.length;
  // 이번 달 남은 같이 쉬는 날
  const end=new Date(t0.getFullYear(),t0.getMonth()+1,0),chips=[];
  for(let d=new Date(today);d<=end;d=addDays(d,1)){const g=togetherOn(d);if(g)chips.push([d,g]);}
  const chipHtml=chips.map(([d,g])=>`<button class="tg-chip ${g}" data-act="fam-day" data-k="${fmt(d)}">${d.getDate()}(${DOW[d.getDay()]})<small>${g==='all'?'종일':'낮'}</small>${wxChipIcon(d)}</button>`).join('');
  // 요청
  const pend=S.requests.filter(r=>r.st==='pending').sort((a,b)=>a.date.localeCompare(b.date));
  const myReq=S.requests.filter(r=>r.st==='pending'||r.st==='accepted'||r.st==='rejected').sort((a,b)=>b.t-a.t).slice(0,3);
  const reqSum=(()=>{const c=famInCounts();return (c.ask||c.hold)?`<div class="fsec">근무 요청</div><button class="frqsum" data-act="feed-req">📩 답할 요청 ${c.ask}${c.hold?` · 보류 ${c.hold}`:''} <span>›</span></button>`:'';})();
  const reqHtml=S.link?reqSum:isHost?(pend.length?`<div class="fsec">답장할 요청 ${pend.length}</div>${pend.map(r=>`<div class="frq" data-act="req-go" data-k="${r.date}"><b>${esc(whoName(r.by||'guest'))} · ${mdw(r.date)} ${esc(shiftLabel(shiftOf(parse(r.date))))} → ${esc(shiftLabel(r.want))} 요청</b>${r.msg?`<small>"${esc(r.msg)}" · ${rel(r.t)}</small>`:`<small>${rel(r.t)}</small>`}<div class="bt"><button data-act="rqreply" data-id="${r.id}" data-s="pending">보류</button><button class="y" data-act="rqreply" data-id="${r.id}" data-s="accepted">수락</button><button data-act="rqreply" data-id="${r.id}" data-s="rejected">거절</button></div></div>`).join('')}`:'')
    :(myReq.length?`<div class="fsec">내 요청</div>${myReq.map(r=>`<div class="frq g" data-act="req-go" data-k="${r.date}"><b>${mdw(r.date)} ${esc(shiftLabel(r.want))} 요청 · ${REQ_ST[r.st].ic} ${r.st==='pending'?'답장 기다리는 중':REQ_ST[r.st].name}</b>${r.msg?`<small>"${esc(r.msg)}"</small>`:''}</div>`).join('')}`:'');
  return `<div class="famv">${famSyncHtml()}
    <div class="fsec">지금</div>
    ${isHost&&fam.length?`<div class="nowwrap"><div class="now fams">${famView()?'':meCard2}${memCards}</div></div>`:`<div class="now one">${famView()?'':meCard}${isHost?memCards:''}</div>`}
    ${cheerBtns}
    ${famPeers().length?`<div class="fsec">달력</div><div class="vcrows">${famPeers().map(m=>`<button class="vcr" data-act="fam-viewcal" data-u="${esc(m.uid)}"><span class="vci">${npi('calendar',19)}</span><b>${esc(m.name)} 달력</b><em>${npi('chevron-right',16)}</em></button>`).join('')}</div>`:''}
    <div class="fsec">가족 시간표</div>
    <div class="ftt">
      <div class="fwk"><span id="fwkT" class="fwt"></span><span class="fmode"><button class="${wkMode==='c'?'on':''}" data-act="fam-mode" data-v="c">오늘 가운데</button><button class="${wkMode==='w'?'on':''}" data-act="fam-mode" data-v="w">주 단위</button></span></div>
      <div class="fgw"><div class="fgn">${namesHtml}</div><div class="fgs" id="fgs" data-m="${wkMode}"><div class="fgin" style="--n:${nShow}">${head}${rowsHtml}</div></div></div>
      
      ${fam.length&&ad('together')?`<div class="flg"><span><b style="background:#ffd966"></b>다 같이 쉼</span>${S.famDayToo!==false?'<span><b style="background:#fff0bf"></b>낮엔 같이 (야간 전)</span>':''}</div>`
        :fam.length?'':`<button class="fempty" data-act="fam-add">👪 가족 추가하기${ad('together')?' · 같이 쉬는 날도 찾아요':''} ›</button>`}
    </div>
    ${fam.length&&ad('together')?`<div class="fsec">${t0.getMonth()+1}월에 남은 같이 쉬는 날</div>${chipHtml?`<div class="tg-row">${chipHtml}</div>`:'<div class="mempty">이번 달엔 남은 날이 없어요</div>'}`:''}
    ${reqHtml}
  </div>`;
}
/* ---- 개인 캘린더 "언제부터?" ---- */
var persKind='on';
function openPersPage(kind){   // v0.151 새 모양: 시작 날 줄 · 확인 · 설명은 도움 줄로
  persKind=kind;const today=fmt(new Date());
  const n=(S.stamps.defs||[]).filter(x=>x.rep==='work'&&!x.retired).length;
  persHelp=`${kind==='on'?'그 날 이전은 근무표 그대로예요 (달력 · 통계 · 수당). 그 날부터 근무 표시가 없어져요.':'그 날부터 근무표가 다시 보여요. 그 사이는 개인 캘린더로 남아요.'}${kind==='on'&&n?`<br>"근무 맞춤" 스티커 ${n}개는 개인 캘린더 기간에는 안 보여요.`:''}`;
  openPage(`${pageHead(kind==='on'?'개인 캘린더':'근무표 쓰기')}
    <div class="pg-b np"><div class="pg-sec" style="margin-top:8px"><div class="prow"><span class="npi">${npi('calendar')}</span><div class="pl2">시작 날</div>${tpick('persD',today,'','date')}</div></div>
      <div class="npbtn"><button class="btn" data-act="pers-ok">확인</button></div>
      <div class="pg-sec">${npRow('help',kind==='on'?'개인 캘린더로 바꾸면?':'근무표를 다시 쓰면?',npVal(''),{tap:1,act:'pers-help'})}</div></div>`,'pers');
}
let persHelp='';
function persApply(kind,d){
  const L=(S.pers||[]).filter(p=>p.f<d).map(p=>({f:p.f,t:p.t}));   // 그 날 전에 시작한 기간만 남김
  if(kind==='on'){const c=L.find(p=>!p.t||p.t>d);if(c)c.t='';else L.push({f:d,t:''});}
  else L.forEach(p=>{if(!p.t||p.t>d)p.t=d;});
  S.pers=L;
  persSync();save();closePage();render();
  toast(kind==='on'?(persOn(fmt(new Date()))?'개인 캘린더로 바꿨어요':`${md(d)}부터 개인 캘린더로 바뀌어요`):(S.myset?(persOn(fmt(new Date()))?`${md(d)}부터 근무표를 다시 써요`:'근무표를 다시 써요'):'달력 위 "내 근무표 만들기"로 시작해요'));
}
/* ---- 가족 설정 (가족 탭 ⚙️ · 설정 › 가족) ---- */
// v0.171 같이 쉬는 날 (부가 기능) 페이지: 앞으로 3달 목록(이어지면 묶기) · 누구랑 같이 · 야간 전 낮도
function togRuns(){
  const t0=new Date(),d0=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()),end=new Date(d0.getFullYear(),d0.getMonth()+3,0),out=[];
  for(let d=new Date(d0);d<=end;d=addDays(d,1)){const g=togetherOn(d);if(!g)continue;const L=out[out.length-1];
    if(L&&fmt(addDays(L.e,1))===fmt(d)){L.e=new Date(d);L.g.push(g);}else out.push({s:new Date(d),e:new Date(d),g:[g]});}
  return out;
}
function openTogetherPage(){
  const all=(S.family||[]).concat(famPeers()),off=S.togOff||[];
  const tg=(id,on)=>`<label class="sw"><input type="checkbox" id="${id}" ${on?'checked':''}><i></i></label>`;
  if(!all.length){openPage(`${pageHead('같이 쉬는 날')}<div class="pg-b np"><div class="pg-sec" style="margin-top:8px">${npRow('plus','가족 추가',npVal(''),{tap:1,act:'fam-add'})}</div></div>`,'together');return;}
  const runs=togRuns(),md2=d=>`${d.getMonth()+1}/${d.getDate()}(${DOW[d.getDay()]})`;
  let lastM=-1;const list=runs.map(r=>{const n=Math.round((r.e-r.s)/864e5)+1,day=r.g.every(x=>x==='day'),m=r.s.getMonth();
    const cap=m!==lastM?`<div class="togm">${m+1}월</div>`:'';lastM=m;
    return cap+`<div class="prow tap togr" data-act="tog-day" data-k="${fmt(r.s)}"><span class="togdot ${day?'day':''}"></span><div class="pl2">${n>1?`${md2(r.s)} ~ ${md2(r.e)}`:md2(r.s)}</div>${npVal(n>1?`${n}일 연속`:day?'낮':'종일')}</div>`;}).join('');
  openPage(`${pageHead('같이 쉬는 날')}
    <div class="pg-b np">
      <div class="pg-cap">누구랑 같이</div>
      <div class="pg-sec">${all.map((m,i)=>`<div class="prow"><span class="fav">${famAv(m,i)}</span><div class="pl2">${esc(m.name||'가족')}</div>${tg('togw_'+togKey(m),!off.includes(togKey(m)))}</div>`).join('')}${npRow('moon','야간 전 낮도 같이로 보기',tg('famDayToo',S.famDayToo!==false))}</div>
      <div class="pg-cap">앞으로 3달</div>
      <div class="pg-sec togl">${list||`<div class="prow"><div class="pl2" style="color:var(--muted)">3달 안에 같이 쉬는 날이 없어요</div></div>`}</div>
    </div>`,'together');
}
function openFamSetPage(){   // v0.147 새 모양
  const fam=S.family||[],g=S.syncSettings.isGuestMode;
  const tg=(id,on)=>`<label class="sw"><input type="checkbox" id="${id}" ${on?'checked':''}><i></i></label>`;
  openPage(`
    ${pageHead('가족')}
    <div class="pg-b np">
      <div class="pg-cap">가족 목록</div>
      <div class="pg-sec famsec">${fam.map((m,i)=>`<div class="prow tap" data-act="fam-edit" data-id="${m.id}"><span class="fav">${famAv(m,i)}</span><div class="pl2">${esc(m.name)}</div>${npVal(`${FAM_KIND[m.kind][1]}${m.kind==='shift'?` · ${esc(teamName(m.team??S.myTeam))}`:''}`)}</div>`).join('')}
        ${npRow('plus','가족 추가','',{tap:1,act:'fam-add',cls:'addr'})}</div>
      <div class="pg-cap">보기</div>
      <div class="pg-sec">
        ${npRow('file-text','가족 메모 달력에 표시',tg('receiveFamilyMemo',S.syncSettings.receiveFamilyMemo!==false))}
        ${npRow('user','가족 보기 (체험)',tg('guestModeToggle',g))}
        ${npRow('users','가족 연결',npVal(fbCfg()?'':'준비 중'),{tap:1,act:'link-open'})}
      </div>
    </div>`,'famset');
}
let famDraft=null;
function openFamEdit(){   // v0.158 새 모양 (시안 design/fam-add): 회색 바탕 · 흰 카드 · 선 아이콘 · 설명 글 없음
  const m=famDraft,isNew=!S.family.some(x=>x.id===m.id);
  let extra='';
  if(m.kind==='shift'){
    const own=!!(m.own&&Array.isArray(m.pat)&&m.pat.length>1),pat=own?m.pat:[];
    extra=`<div class="pg-cap">어떤 교대예요?</div><div class="pg-sec pad"><div class="npseg"><button class="${own?'':'on'}" data-act="fe-own" data-v="0">내 근무와 같은 교대</button><button class="${own?'on':''}" data-act="fe-own" data-v="1">직접 패턴</button></div>
      ${!own&&teamCount()>1?`<div class="chips wlchips">${teamList().map((n,g)=>`<button class="${(m.team??S.myTeam)===g?'on':''}" data-act="fe-team" data-v="${g}">${esc(n)}${g===S.myTeam?' (나랑 같음)':''}</button>`).join('')}</div>`:''}
      ${own?`<div class="pgrid wk7" style="margin-top:12px">${pat.map((k,i)=>`<button class="pc" data-act="fe-pcell" data-i="${i}">${badge(k,'sm')}<small>${i+1}</small></button>`).join('')}</div>
      <div class="row" style="margin-top:10px;gap:8px">${pat.length<PAT_MAX?'<button class="btn ghost sm" data-act="fe-padd">＋ 칸 추가</button>':''}${pat.length>2?'<button class="btn ghost sm" data-act="fe-pdel">－ 칸 빼기</button>':''}</div>
      <div class="prow" style="padding:10px 0 0;min-height:0"><div class="pl2">1번째 칸 시작 날</div>${tpick('feAnc',m.anc||fmt(new Date()),'','date')}</div>`:''}</div>`;
  }
  if(famUsesTypes(m)){   // v0.119 일정(종류 · 시간 · 위치 · 방학 · 구간)은 "일정 패턴" 화면으로
    const L=famTypes(famEra(m,new Date())).filter(t=>!t.rest),loc=famEra(m,new Date()).loc;
    const v=L.slice(0,1).map(t=>t.name+(t.s?` ${t12(t.s,true)} ~ ${t12(t.e,true)}`:'')).join('')+(L.length>1?` 외 ${L.length-1}`:'');
    extra=`<div class="pg-cap">일정</div><div class="pg-sec">${npRow('calendar','일정 패턴',npVal(esc(v)),{tap:1,act:'fe-pat'})}${wxOk(loc)||(m.eras||[]).length?`<div class="prow fe-sub"><span class="npi" style="visibility:hidden"></span><div class="pl2">${wxOk(loc)?esc(wxName(loc)):''}${wxOk(loc)&&(m.eras||[]).length?' · ':''}${(m.eras||[]).length?`구간 ${m.eras.length+1}개`:''}</div></div>`:''}</div>`;
  }
  const KI={shift:'repeat',office:'briefcase',student:'book-open',free:'home'};
  openPage(`
    ${pageHead(isNew?'가족 추가':'가족 고치기','<button class="ok" data-act="fe-save">저장</button>')}
    <div class="pg-b np feb">
      ${isNew&&fbCfg()?`<div class="pg-sec" style="margin-top:8px">${npRow('link','앱을 쓰는 가족이면',`<div class="pv npv fe-lk">가족 연결${npi('chevron-right',16)}</div>`,{tap:1,act:'link-open',cls:'fe-link'})}</div>`:''}
      <div class="pg-cap">이름 · 사진</div>
      <div class="pg-sec pad"><div class="fe-top"><button class="fe-av" data-act="fe-photo" aria-label="사진">${famAv(m,0)}<span class="fe-cam">${npi('camera',14)}</span></button><div class="fe-r"><input type="text" id="feName" value="${esc(m.name)}" placeholder="아내, 딸, 엄마" maxlength="10">
        <div class="swatch fe-sw">${FAM_COL.map(c=>`<button class="${m.color===c?'on':''}" style="background:${c}" data-act="fe-color" data-v="${c}" aria-label="색"></button>`).join('')}</div></div></div></div>
      <div class="pg-cap">평소 일정</div>
      <div class="fkind fk2">${Object.entries(FAM_KIND).map(([k,[e,n]])=>`<button class="${m.kind===k?'on':''}" data-act="fe-kind" data-v="${k}"><span class="npi">${npi(KI[k])}</span><b>${n}</b></button>`).join('')}</div>
      ${extra}
      ${isNew?'':`<div class="pg-sec" style="margin-top:24px">${npRow('trash-2','가족 목록에서 빼기','',{tap:1,act:'fe-del',cls:'danger-row'})}</div>`}
    </div>`,'famedit');
}
/* ---- 직접 추가한 가족 달력 (근무 · 공휴일 + 나만 보는 메모 · 스티커, 이 폰에만 저장: m.notes[날짜]=글, m.stk[날짜]=[스티커 id]) ---- */
var manId='';
const manMember=()=>(S.family||[]).find(x=>x.id===manId);
const manIc=(x,px)=>`<span class="se" style="font-size:${px-2}px${x.todo?';opacity:.38':''}">${ico(x.emoji)}</span>`;
const manStk=(m,k,todo)=>{const done=[...new Set((m.stk&&m.stk[k])||[])].map(id=>(m.sdefs||[]).find(x=>x.id===id)||S.stamps.defs.find(x=>x.id===id&&!x.retired)).filter(Boolean);if(!todo)return done;return done.concat((m.sdefs||[]).filter(x=>!done.includes(x)&&manPlanned(m,x,k)).map(x=>Object.assign({},x,{todo:1})));};
function manLabel(m,d){if(m.kind==='shift')return shiftLabel(famShift(m,d));const t=famTypeAt(m,d),tm=!t.rest&&t.s&&t.e?` ${t12(t.s,true)}~${t12(t.e,true)}`:'';return (t.rest&&m.kind==='free'?'일정 없음':t.name||'')+tm;}
const famLbl=m=>{if(famUsesTypes(m)){const t=famWorkType(famEra(m,new Date()));if(t&&t.name)return t.name;}return String((m&&m.label)||'').trim()||(m&&m.kind==='student'?'학교':m&&m.kind==='free'?'일정':'회사');};   // 가는 곳 이름 (v0.113: 바꿀 수 있음)
const famLblCol=m=>m.kind==='student'?['#a3d4b5','#16301f']:['#b9c2ce','#1f2731'];   // 내 근무 색(--day)과 같은 진하기 → 칸 채우기에서도 보임
// 가족 달력 칸 동그라미: 내 달력처럼 화면 모드(동그라미 · 칸 채우기 · 또렷하게)를 따라감. 쉬는 날 = 휴, 그 밖 = 가는 곳 첫 글자
function ftBadge(t,cls,dot){const ab=ftAb(t),two=[...ab].length>1?' two':'';if(t.rest)return `<span class="badge r${two} ${cls||''}">${esc(ab)}${dot||''}</span>`;return `<span class="badge c${two} ${cls||''}" style="--tb:${okHex(t.color)?t.color:'#a3d4b5'};--tf:#1d2a22">${esc(ab)}${dot||''}</span>`;}
function manBadge(m,d,dot,cls){
  if(m.kind==='shift')return badge(famShift(m,d),cls||'',dot);
  return ftBadge(famTypeAt(m,d),cls,dot);
}
function manCellBg(m,d){
  if(m.kind==='shift'){const sh=famShift(m,d),c=tColors(typeOf(sh));return c&&!isRest(sh)?c.bg:'';}
  const t=famTypeAt(m,d);return t.rest?'':(okHex(t.color)?t.color:'#a3d4b5');
}
// 가족 달력 스티커판 (v0.113): 달력마다 따로 · 개수 제한 없음. 예전에 내 스티커를 빌려 붙인 건 normalize 가 옮겨 둠
// 처음엔 내 스티커판을 그대로 복사 (같은 id → 예전에 붙인 것도 그대로 보임) + 예전에 붙였지만 판에 없는 것
function manSdefsInit(m,defs){
  const out=[],add=(id,d)=>{if(!out.some(x=>x.id===id))out.push({id,emoji:d.kind==='pill'?'💊':String(d.emoji||'⭐'),name:cutTxt(d.name,12)});};
  (defs||[]).forEach(d=>{if(d&&d.id&&!d.retired&&!d.one&&!d.empty&&(d.emoji||d.kind==='pill'))add(d.id,d);});
  if(m.stk&&typeof m.stk==='object')Object.values(m.stk).forEach(a=>Array.isArray(a)&&a.forEach(id=>{const d=(defs||[]).find(x=>x&&x.id===id);if(d)add(id,d);}));
  return out;
}
function manStkFull(m){if(manSdefs(m).filter(x=>!x.retired).length<MAN_STK_MAX)return false;toast(`스티커는 ${MAN_STK_MAX}개까지예요`);return true;}
function manSdefs(m){if(!Array.isArray(m.sdefs))m.sdefs=manSdefsInit(m,S.stamps.defs);return m.sdefs;}
const manBase=(m,d)=>{if(m.kind==='shift')return famShift({...m,ov:null},d);const c=famEra(m,d);return memberOff({...c,ov:null},d)?famRestType(c).k:famWorkType(c).k;};
function manChoices(m,d){if(m.kind==='shift')return S.types.map(x=>[x.k,badge(x.k,'sm'),x.name]);return famTypes(famEra(m,d||new Date(vcY,vcM,15))).map(t=>[t.k,ftBadge(t,'sm'),t.name]);}
function manSetOv(m,k,v){m.ov=m.ov||{};if(v===manBase(m,parse(k)))delete m.ov[k];else m.ov[k]=v;if(!Object.keys(m.ov).length)delete m.ov;}
function manGrid(m){
  const y=vcY,mo=vcM,first=new Date(y,mo,1),lead=leadOf(first),days=new Date(y,mo+1,0).getDate(),rows=Math.ceil((lead+days)/7),start=addDays(first,-lead),tk=fmt(new Date());
  let cells='';
  for(let i=0;i<rows*7;i++){
    const d=addDays(start,i),k=fmt(d),hol=holName(k),dow=d.getDay();
    const sk=manStk(m,k,true),below=!!hol&&sk.length>=2&&!holBeside(),hone=hol&&sk.length&&!below?holOne(hol):'',row=sk.slice(0,2),more=sk.slice(2),note=m.notes&&m.notes[k];
    let band='';
    if(m.kind==='shift'){const sh=famShift(m,d),c=tColors(typeOf(sh)),ps=famShift(m,addDays(d,-1)),ns=famShift(m,addDays(d,1));band=c&&!isRest(sh)&&(ps===sh||ns===sh)?`<i class="band ${ps===sh?'jl':''} ${ns===sh?'jr':''}" style="--tb:${c.bg}"></i>`:'';}
    const cbg=manCellBg(m,d);
    cells+=`<div class="cell ${d.getMonth()===mo?'':'out'} ${k===tk?'today':''} ${more.length?'m3':''}" data-act="man-day" data-k="${k}"${cbg?` style="--cb:${cbg}"`:''}><div class="dn ${hol?'hol':''} ${hol||dow===0?'sun':dow===6?'sat':''} ${hone?'h1r':''}"><span class="num">${d.getDate()}</span>${hone?`<span class="h1">${esc(hone)}</span>`:''}${row.length?`<span class="stp">${row.map(x=>manIc(x,hone?12:13)).join('')}</span>`:''}${!sk.length&&hol&&shortHol(hol)?`<span class="hn ${shortHol(hol).length>3?'sm':''}">${esc(shortHol(hol))}</span>`:''}</div>${below?`<i class="hnb" data-o="${esc(holOne(hol))}">${esc(holTwo(hol))}</i>`:''}${more.length?`<div class="s2">${more.map(x=>manIc(x,12)).join('')}</div>`:''}<div class="bwrap">${band}${manBadge(m,d,m.ov&&m.ov[k]?'<i class="dot"></i>':'')}</div>${note?`<div class="pill-wrap"><div class="pl">${esc(note)}</div></div>`:''}</div>`;
  }
  return `<div class="calwrap"><div class="dow">${dowHead()}</div><div class="grid" style="grid-template-rows:repeat(${rows},1fr)">${cells}</div></div>`;
}
var manPaint=null;   // 칠하기 중이면 {v: 칠할 값}
function manBar(m){const ch=manChoices(m);return `<div class="vsbar"><div class="seg">${ch.map(c=>`<button class="${manPaint.v===c[0]?'on':''}" data-act="man-pk" data-v="${esc(c[0])}">${c[1]}${m.kind==='shift'?'':esc(c[2])}</button>`).join('')}</div><div class="vs-row"><span class="vs-n">날짜를 누르거나 쭉 밀어요</span><span class="grow"></span><button class="btn sm" data-act="man-paint-off">끝내기</button></div></div>`;}
function manApply(k){const m=manMember();if(!m||!manPaint)return;manSetOv(m,k,manPaint.v);save();const e=document.getElementById('vcsl');if(e){e.innerHTML=manGrid(m);fitDn(e);}}
function renderManCalPage(){
  const m=manMember();if(!m){closePage();return;}
  openPage(`${pageHead(esc(m.name)+' 달력')}<div class="pg-b" style="display:flex;flex-direction:column;padding:0">
    ${vcNavHtml()}
    <div class="vcbox">${vcTrack(()=>manGrid(m),`vcsl ${manPaint?'sel':''}`)}</div>
    ${manPaint?manBar(m):''}</div>`,'mancal');
  applyTdc();fitDn($('#page'));memoShift($('#page'));vcCenter();glowCheck();
}
let manDayK='',manFold=null,manHidAt=0;
const manFoldOpen=()=>manFold===null?true:manFold;
document.addEventListener('visibilitychange',()=>{if(document.hidden)manHidAt=Date.now();else{if(manHidAt&&Date.now()-manHidAt>5*60*1000)manFold=null;manHidAt=0;}});
// 가족 날짜 창 날씨 카드 (날씨를 켰을 때 · 누르면 그 날 가족 날씨 팝업)
function famDayWxHtml(m,k){
  if(!famUsesTypes(m)||!wxOn())return '';
  const d=parse(k),today=new Date(),df=Math.round((d-new Date(today.getFullYear(),today.getMonth(),today.getDate()))/864e5);
  if(df<0)return wxHistCard(wxMemKey(m),k,'man-wx');   // v0.127 지난 날 = 저장본
  if(df>3){const x=famWx(m,d);return x&&x.c?wxFarLine(x.c,`data-act="man-wx" data-k="${k}"`):'';}   // v0.134 먼 날 한 줄
  const x=famWx(m,d);if(!x||!x.c||!x.c.k)return '';
  return wxCardHtml(x.c,wxCls(x.c),`data-act="man-wx" data-k="${k}"`);
}
// 가족 날짜 창 (v0.113): 내 날짜 창처럼 — 날짜 띠 · 그날 칩 · 스티커판 · 메모 · 옆으로 밀면 다음날
function manChipIco(m,v,d){
  if(m.kind==='shift')return badge(v,'tc');
  const c=famEra(m,d||new Date()),t=famTypes(c).find(x=>x.k===v)||(v==='off'?famRestType(c):famWorkType(c));return ftBadge(t,'tc');
}
// v0.144 날짜 창 오늘 표시: 띠의 오늘 칸 색 · 제목 줄 "오늘" · 다른 날이면 제목을 눌러 오늘로
let dsTKc='',dsTKt=0;function dsTK(){const n=Date.now();if(n-dsTKt>1000){dsTKc=fmt(new Date(n));dsTKt=n;}return dsTKc;}   // 그리는 동안 한 번만 계산
function dsTgo(k,act){const t=dsTK();return k===t?'':` data-act="${act}" data-k="${t}" role="button"`;}
function dsTdy(k){return k===dsTK()?'<span class="tdy">오늘</span>':'';}
function dsHint(k){return '';}   // v0.155 설명 글 없음 (날짜를 누르면 오늘로 가는 건 그대로)
function manDayHtml(k){
  const m=manMember();if(!m)return '';
  const d=parse(k),hol=holName(k),on=(m.stk&&m.stk[k])||[],note=(m.notes&&m.notes[k])||'',cur=(m.ov&&m.ov[k])||manBase(m,d),defs=manSdefs(m).filter(x=>!x.retired||on.includes(x.id));
  const strip=dsOffs().filter(i=>{const x=addDays(d,i),mm=x.getFullYear()*12+x.getMonth();return i===0||(mm>=MIN_M&&mm<=MAX_M);}).map(i=>{const x=addDays(d,i);return `<button class="dsi ${i===0?'on':''}${fmt(x)===dsTK()?' td':''}" data-act="man-go" data-k="${fmt(x)}"><small>${x.getDate()}일</small>${manBadge(m,x,'','sm')}</button>`;}).join('');
  return `<div class="dtop"><button data-act="close">‹ ${esc(m.name)} 달력</button></div>
    <div class="dfh"><button class="ib" data-act="man-go" data-k="${fmt(addDays(d,-1))}" aria-label="전날">‹</button>
      <div class="dft"${dsTgo(k,'man-go')}><b class="${hol?'hl':''}">${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]})</b><small>${esc(m.name)} · ${esc(manLabel(m,d))}${hol?` · <span class="hl">${esc(hol)}</span>`:''}${dsTdy(k)}</small>${dsHint(k)}</div>
      <button class="ib" data-act="man-go" data-k="${fmt(addDays(d,1))}" aria-label="다음날">›</button></div>
    <div class="dstrip" id="dstrip">${strip}</div>
    <div class="dsbody">
    <div class="sec shsec ${manFoldOpen()?'open':''}"><div class="sh-hd"><span>${m.kind==='shift'?'근무':'일정'}</span><button class="sh-pill" data-act="man-fold" aria-label="접기 · 펼치기">${manChipIco(m,cur,d)}${esc((manChoices(m,d).find(c=>c[0]===cur)||[,,manLabel(m,d)])[2])}<i class="shc"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></i></button></div>
      <div class="sh-body"><div class="sh-card"><div class="tchips">${manChoices(m,d).map(c=>`<button class="tchip ${cur===c[0]?'on':''}" data-act="man-ov" data-k="${k}" data-v="${esc(c[0])}"${famUsesTypes(m)?` data-hold="mtype" data-hk="${esc(c[0])}" data-hd="${k}"`:''}>${manChipIco(m,c[0],d)}<small>${esc(c[2])}</small></button>`).join('')}</div>
        <button class="paint-btn" data-act="man-paint">${npi('paintbrush',18)}<b>여러 날 칠하기</b><i>›</i></button>${famUsesTypes(m)?`<button class="paint-btn" data-act="man-pat" style="margin-top:8px">${npi('settings',18)}<b>일정 패턴</b><i>›</i></button>`:''}</div></div></div>
    ${famDayWxHtml(m,k)}
    <div class="sec mansec"><div class="sec-t">스티커<button class="mdet2" data-act="mstk-page">설정</button></div>
    <div class="sgrid sg5 mstk">${defs.filter(x=>on.includes(x.id)||manPlanned(m,x,k)).map(x=>{const n=on.filter(y=>y===x.id).length,N=Math.max(1,x.times||1),pl=manPlanned(m,x,k),cls=n>=N?'on':n>0?'on half':'todo';return `<button class="${cls}" data-act="man-stk" data-k="${k}" data-id="${esc(x.id)}" data-hold="mstk" data-hid="${esc(x.id)}"><span class="si">${ico(x.emoji)}${N>1&&(n||pl)?`<em class="cnt">${n}/${N}</em>`:''}</span><small>${x.act&&(pl||n)?esc(t12(x.act.s,true)):esc(x.name||'')}</small></button>`;}).join('')}<button class="emp" data-act="man-stk-pick" data-k="${k}"><span class="si">＋</span><small>붙이기</small></button></div>
    </div>
    <div class="sec memsec"><div class="sec-t">메모</div><div class="ibar"><div class="irow"><input type="text" id="manNote" maxlength="40" value="${esc(note)}" placeholder="메모" enterkeyhint="done"><button class="send" data-act="man-note" data-k="${k}" aria-label="저장">${ICON.send}</button></div></div></div>
    </div>`;
}
function openManDay(k){
  const m=manMember();if(!m)return;
  manDayK=k;sheetMode='mandy';
  openSheet(manDayHtml(k),true);dstripCenter(x=>manGo(x,true),()=>manDayK);
}
// 다른 날로: 달력 쪽 달도 같이 맞춤
function manGo(k,quiet){
  const d=parse(k),v=d.getFullYear()*12+d.getMonth();if(v<MIN_M||v>MAX_M)return;
  if(d.getFullYear()!==vcY||d.getMonth()!==vcM){vcY=d.getFullYear();vcM=d.getMonth();renderManCalPage();}
  if(!quiet)buzz(6);openManDay(k);
}
function manStkRefresh(){if(pageMode==='manstk'){openManStkPage();return;}renderManCalPage();if(manDayK&&sheetMode==='mandy'&&$('#sheet').classList.contains('open'))openManDay(manDayK);}
// 가족 스티커 설정 (내 스티커 설정과 같은 모양): 길게 끌어 순서 · 누르면 고치기 · ＋ 더하기(새로 · 내 스티커에서) · 빼도 지난 기록은 남음
function openManStkPage(){
  const m=manMember();if(!m)return;closeSheet();
  const defs=manSdefs(m).filter(x=>!x.retired);
  const btn=x=>`<button data-act="mslot-open" data-id="${esc(x.id)}"><span class="si">${ico(x.emoji)}</span><small>${esc(x.name||'')}</small>${x.act?'<i class="stbell">🎒</i>':''}</button>`;
  pageBack=renderManCalPage;
  openPage(`${pageHead(esc(m.name)+' 스티커')}<div class="pg-b np">
    <div class="pg-cap">스티커<span class="cnt2">${defs.length}</span></div>
    <div class="pg-sec sgrid sg5 stgrid mstgrid" style="padding:10px">${defs.map(btn).join('')}${defs.length>=MAN_STK_MAX?'':`<button class="emp npadd" data-act="mslot-add"><span class="si">${npi('plus',20)}</span><small>더하기</small></button>`}</div>
  </div>`,'manstk');
}
function openManStkAdd(){
  const m=manMember();if(!m)return;if(manStkFull(m))return;const have=new Set(manSdefs(m).filter(x=>!x.retired).map(x=>x.id));
  const mine=S.stamps.defs.filter(x=>!x.retired&&!x.one&&!x.empty&&(x.emoji||x.kind==='pill')&&!have.has(x.id));
  openPop(`<div class="mh">${esc(m.name)} 스티커<b>더하기</b></div>
    <button class="mi" data-act="man-stk-add" data-k="" style="font-weight:700">✨ 새로 만들기</button>
    ${mine.length?`<div class="mi" style="display:block"><div class="pl2" style="margin-bottom:8px">내 스티커에서 가져오기</div><div class="sgrid sg5">${mine.map(x=>`<button data-act="mslot-import" data-id="${esc(x.id)}"><span class="si">${x.kind==='pill'?'💊':ico(x.emoji)}</span><small>${esc(x.name||'')}</small></button>`).join('')}</div></div>`:''}
    <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);
}
/* ---- v0.117 가족 일정 종류 고치기 (내 근무타입 편집과 같은 칸: 이름 · 달력 표시 · 가는 날/쉬는 날 · 시간 · 색) ---- */
let ftDraft=null;
function openFtEdit(tgt,key,after,m){
  const L=famTypes(Object.assign({},m||{},tgt)),t=key?L.find(x=>x.k===key):null;
  ftDraft={tgt,m:m||tgt,after,isNew:!t,k:t?t.k:'t'+uid(),name:t?t.name||'':'',ab:t?t.ab||'':'',rest:t?!!t.rest:false,s:(t&&t.s)||'09:00',e:(t&&t.e)||'15:00',color:(t&&okHex(t.color)&&t.color)||FT_COL[L.length%FT_COL.length]};
  renderFtEdit();
}
function ftPull(){const d=ftDraft;if(!d)return;const n=$('#ftName'),a=$('#ftAb');if(n)d.name=n.value.trim().slice(0,10);if(a)d.ab=[...a.value.trim()].slice(0,2).join('');}
function renderFtEdit(){
  const d=ftDraft;if(!d)return;const L=famTypes(Object.assign({},d.m,d.tgt)),others=L.filter(x=>x.k!==d.k);
  const canDel=!d.isNew&&others.some(x=>!!x.rest===d.rest);   // 가는 날 · 쉬는 날 종류는 하나씩은 남김
  const tm=d.rest?'':(()=>{let mm=tm2m(d.e)-tm2m(d.s);if(mm<=0)mm+=1440;return `<div class="hint" style="padding:2px 16px 6px;text-align:center">총 <b>${Math.round(mm/6)/10}시간</b></div>`;})();
  openPop(`<div class="mh">${esc((d.m&&d.m.name)||'')} · 일정 종류<b>${d.isNew?'새 종류':esc(d.name||'종류')}</b></div>
    <div class="mi"><div class="pl2" style="flex:none;width:68px">이름</div><input type="text" id="ftName" value="${esc(d.name)}" maxlength="10" placeholder="예: 유치원 · 방과후 · 회사"></div>
    <div class="mi"><div class="pl2" style="flex:none;width:68px">달력 표시</div><input type="text" id="ftAb" value="${esc(d.ab)}" maxlength="2" placeholder="자동" style="max-width:90px"><span style="margin-left:10px">${ftBadge({name:d.name,ab:d.ab,rest:d.rest,color:d.color})}</span></div>
    <div class="mi"><div class="hseg" style="flex:1"><button class="${!d.rest?'on':''}" data-act="ft-rest" data-v="0">가는 날</button><button class="${d.rest?'on':''}" data-act="ft-rest" data-v="1">쉬는 날</button></div></div>
    ${d.rest?'':`<div class="mi"><div class="pl2" style="flex:none;width:68px">시간</div>${tpick('ftS',d.s)}<span class="tsep">→</span>${tpick('ftE',d.e)}</div>${tm}
    <div class="mi ftcs">${FT_COL.map(c=>`<button class="ftc ${d.color===c?'on':''}" style="background:${c}" data-act="ft-col" data-v="${c}" aria-label="색"></button>`).join('')}</div>`}
    <div class="mi" style="gap:8px">${canDel?'<button class="btn ghost grow danger" data-act="ft-del">지우기</button>':''}<button class="btn grow" data-act="ft-save">저장</button></div>`);
}
function ftSave(){
  ftPull();const d=ftDraft;if(!d)return;if(!d.name){toast('이름을 넣어 주세요');return;}
  const L=famTypes(Object.assign({},d.m,d.tgt)).map(x=>Object.assign({},x)),t={k:d.k,name:d.name};
  if(d.ab)t.ab=d.ab;if(d.rest)t.rest=true;else{t.s=d.s;t.e=d.e;t.color=d.color;}
  const i=L.findIndex(x=>x.k===d.k);if(i>=0)L[i]=t;else L.push(t);
  d.tgt.ftypes=L;const after=d.after;ftDraft=null;closePop();if(after)after();
}
function ftDel(){
  const d=ftDraft;if(!d)return;
  d.tgt.ftypes=famTypes(Object.assign({},d.m,d.tgt)).filter(x=>x.k!==d.k).map(x=>Object.assign({},x));
  const m=d.m;if(m&&m.ov)Object.keys(m.ov).forEach(k=>{if(m.ov[k]===d.k)delete m.ov[k];});
  const after=d.after;ftDraft=null;closePop();if(after)after();
}
/* ---- v0.120 가족 스티커도 내 스티커 고치기 화면 (stDraft.own = 가족 id): 하루 몇 번 · 얼마나(이날만 · 요일 · 매일 · 일정 맞춤 · 매달) · 기간 · 알림 · 활동 스위치 ---- */
// v0.126 유찬 날짜 창 ＋: 붙일 스티커 창 → 고르면 창이 닫히고 옵션 화면 (규칙이 없던 스티커는 "이날만"으로 시작)
function openManStkPick(k){
  const m=manMember();if(!m)return;const d=parse(k),on=(m.stk&&m.stk[k])||[];
  const defs=manSdefs(m).filter(x=>!x.retired&&!on.includes(x.id)&&!manPlanned(m,x,k));
  openPop(`<div class="mh">${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]})<b>${esc(m.name)} · 붙일 스티커</b></div>
    <div class="mi sgrid sg5">${defs.map(x=>`<button data-act="man-stk-place" data-id="${esc(x.id)}" data-k="${k}"><span class="si">${ico(x.emoji)}</span><small>${esc(x.name||'')}</small></button>`).join('')}${manSdefs(m).filter(x=>!x.retired).length>=MAN_STK_MAX?'':`<button class="plus" data-act="man-stk-add" data-k="${k}" aria-label="새 스티커"><span class="si">＋</span><small>새로</small></button>`}</div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">닫기</button></div>`);
}
function openManStampReg(id,k,back,place){
  const m=manMember();if(!m)return;const x=manSdefs(m).find(y=>y.id===id);if(!x)return;closeSheet();closePop();
  const fresh=place&&(!x.rep||x.rep==='none');
  stDraft=stDraftOf(Object.assign({kind:'mark',rep:'none',days:[],dates:[],skip:[],ats:[]},x),k||fmt(new Date()),!fresh,back||'manstk');
  Object.assign(stDraft,{own:m.id,kind:'mark',fam:false,wtypes:(x.wtypes||[]).slice(),name:x.name||'',emoji:x.emoji});
  renderStampReg();
}
function manStampSave(){
  const d=stDraft,m=(S.family||[]).find(y=>y.id===d.own);if(!m){stDraft=null;closePage();return;}
  if(d.rep==='work'&&!d.wtypes.length){toast(famUsesTypes(m)?'일정을 하나 이상 골라 주세요':'근무를 하나 이상 골라 주세요');return;}
  const x=manSdefs(m).find(y=>y.id===d.id);if(!x){stDraft=null;closePage();return;}
  const snapDefs=JSON.stringify(m.sdefs);   // v0.135 4개 넘는 날 알림에서 "등록 취소"
  if(d.name)x.name=d.name;x.emoji=d.emoji||x.emoji;x.times=d.times;
  const r=d.rep==='once'?'none':d.rep;x.rep=r;x.days=r==='dow'?d.days.slice():[];x.wtypes=r==='work'?d.wtypes.slice(0,30):[];x.from=r!=='none'?(d.from||''):'';x.to=r!=='none'?(d.to||''):'';x.noHol=!!d.noHol&&r!=='none';x.noWknd=!!d.noWknd&&['daily','work','month'].includes(r);
  if(r==='month')x.mday=parse(d.from||d.k).getDate();else delete x.mday;
  if(d.rep==='once'&&!(x.dates||[]).includes(d.k))x.dates=[...(x.dates||[]),d.k];
  if(d.alarm){stFill(d);x.ats=d.ats.slice(0,d.times);}else x.ats=[];
  if(d.act&&d.act.s&&d.act.e)x.act={s:d.act.s,e:d.act.e,r:wxOk(d.act.r)?d.act.r:'',since:(x.act&&x.act.since)||fmt(new Date())};else delete x.act;
  ['from','to'].forEach(f=>{if(!x[f])delete x[f];});['noHol','noWknd'].forEach(f=>{if(!x[f])delete x[f];});
  save();actAuto();try{pushRemindersToNative();}catch(e){}
  toast(`${icoTxt(x.emoji,'✔')} ${x.name} · ${manStampRule(m,x)}${x.act?` · 🎒 ${t12(x.act.s,true)}~${t12(x.act.e,true)}`:''}`);
  manStampBack(d);
  if(r!=='none'){   // v0.135 반복 스티커: 앞으로 90일 중 이미 4개라 이 스티커가 안 보이는 날이 있으면 미리 알림
    const k0=x.from&&x.from>fmt(new Date())?x.from:fmt(new Date()),hit=[];
    for(let i=0;i<90;i++){const k=addK(k0,i);if(x.to&&k>x.to)break;if(!manPlanned(m,x,k))continue;const L=manStk(m,k,true);if(L.length>4&&L.findIndex(y=>y.id===x.id)>=4)hit.push(k);}
    if(hit.length){manHidSnap={m:m.id,defs:snapDefs};
      openPop(`<div class="mh">스티커가 많아서 가려져요<b>${esc(x.name||'스티커')} · ${hit.length}일</b></div>
        <div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0">${hit.slice(0,3).map(md).join(' · ')}${hit.length>3?` 외 ${hit.length-3}일`:''}은 이미 스티커가 4개라, 이 스티커는 그날엔 안 보여요. 그래도 등록할까요?</div></div>
        <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="msh-undo">등록 취소</button><button class="btn grow" data-act="pop-close">그래도 등록</button></div>`);}
  }
}
let manHidSnap=null;
function manStampBack(d){stDraft=null;closePage();if(d.back==='mandy'){renderManCalPage();openManDay(d.k);}else if(d.back==='manstk'){renderManCalPage();openManStkPage();}else renderManCalPage();}
function manStampRule(m,x){
  const r=x.rep||'none',N=x.times>1?`하루 ${x.times}번 · `:'';
  if(r==='daily')return N+'매일';if(r==='dow')return N+([1,2,3,4,5,6,0].filter(w=>(x.days||[]).includes(w)).map(w=>DOW[w]).join('·')||'요일 없음');
  if(r==='month')return N+`매달 ${x.mday||1}일`;
  if(r==='work'){const L=m.kind==='shift'?S.types.map(t=>[t.k,t.name]):famTypes(famEra(m,new Date())).map(t=>[t.k,t.name]);return N+(x.wtypes||[]).map(k=>(L.find(z=>z[0]===k)||[k,k])[1]).join('·')+'인 날';}
  return N+'반복 없음';
}
// 가족 스티커가 그 날 깔리는지 (내 stampPlanned 와 같은 규칙 · 근무 맞춤 = 그 가족 일정 종류 · 활동은 겹치면 빠짐)
function manStampPlanned(m,x,k){
  if(!x||x.retired)return false;
  if((x.skip||[]).includes(k))return false;
  if((x.dates||[]).includes(k))return true;
  if(!((!x.from||k>=x.from)&&(!x.to||k<=x.to)))return false;
  const d=parse(k),r=x.rep||'none';let on=false;
  if(r==='daily')on=true;else if(r==='dow')on=(x.days||[]).includes(d.getDay());
  else if(r==='month'){const md=x.mday||1;on=d.getDate()===Math.min(md,new Date(d.getFullYear(),d.getMonth()+1,0).getDate());}
  else if(r==='work'){const key=m.kind==='shift'?famShift(m,d):famTypeAt(m,d).k;on=(x.wtypes||[]).includes(key);}
  if(on&&x.noHol&&holName(k))on=false;
  if(on&&x.noWknd&&(d.getDay()===0||d.getDay()===6))on=false;
  if(on&&x.act&&actClashWin(x.act,d,famWinOf(m)))on=false;
  return on;
}
let msDraft=null;
function openManStkEdit(id){
  const m=manMember();if(!m)return;const x=manSdefs(m).find(y=>y.id===id);if(!x)return;
  msDraft={id,name:x.name||'',emoji:x.emoji,act:x.act?JSON.parse(JSON.stringify(x.act)):null,actOpen:!!x.act};renderManStkEdit();
}
function renderManStkEdit(){
  const m=manMember(),d=msDraft;if(!m||!d)return;
  openPop(`<div class="mh">${esc(m.name)} 스티커<b>${esc(d.name||'스티커')}</b></div>
    <div class="mi icn-top"><span class="icn-cur">${ico(d.emoji)}</span><input type="text" id="mstkName" value="${esc(d.name)}" maxlength="12" placeholder="이름"></div>
    <div style="padding:0 12px">${actFoldHtml(d.act,d.actOpen,'ms',(d.act&&d.act.days)||[])}</div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="mstk-swap" data-id="${esc(d.id)}">다른 스티커로</button><button class="btn ghost grow" data-act="mstk-end" data-id="${esc(d.id)}">그만하기</button><button class="btn ghost grow danger" data-act="mstk-del" data-id="${esc(d.id)}">지우기</button></div>
    <div class="mi"><button class="btn grow" data-act="mstk-ok" data-id="${esc(d.id)}">확인</button></div>`);
}
function mstkPull(){const n=$('#mstkName');if(n&&msDraft)msDraft.name=n.value.trim().slice(0,12);}
// 확인: 이름 · 활동(요일 + 시간이 있어야 저장)
function mstkSave(){
  const m=manMember(),d=msDraft;if(!m||!d)return;mstkPull();
  const x=manSdefs(m).find(y=>y.id===d.id);if(!x)return;
  if(d.name)x.name=d.name;
  const a=d.act;if(a&&a.s&&a.e&&(a.days||[]).length)x.act={days:a.days.slice().sort(),s:a.s,e:a.e,r:wxOk(a.r)?a.r:'',since:(x.act&&x.act.since)||fmt(new Date()),...(x.act&&x.act.skip?{skip:x.act.skip}:{})};
  else delete x.act;
  msDraft=null;
}
function mstkPullName(id){mstkPull();}
function famSchedHtml(m){   // v0.158 새 모양 (시안 design/remain): 종류 카드 · 위치 · 방학 · 구간 카드 · 설명 글 없음
    const eras=m.eras||[],ei=famEdIdx(m),cfg=famEdCfg(m),L=famTypes(Object.assign({},m,cfg)),st=m.kind==='student';
    const nd=x=>{const d=parse(x);return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`;};
    const days=cfg.days||m.days||[1,2,3,4,5],dayB=[1,2,3,4,5,6,0].map(w=>`<button class="${days.includes(w)?'on':''}" data-act="fe-day" data-v="${w}">${DOW[w]}</button>`).join('');
    return `${eras.length?`<div class="chips npmc">${`<button class="${ei<0?'on':''}" data-act="fe-era" data-i="-1">처음 ~ ${nd(fmt(addDays(parse(eras[0].from),-1)))}</button>`}${eras.map((e,i)=>`<button class="${ei===i?'on':''}" data-act="fe-era" data-i="${i}">${nd(e.from)}부터</button>`).join('')}</div>`:''}
      <div class="pg-cap">일정 종류</div>
      <div class="pg-sec fpsec">${L.map(t=>`<div class="prow tap" data-act="fe-ft" data-k="${esc(t.k)}"><span class="npi fpb">${ftBadge(t,'sm')}</span><div class="pl2">${esc(t.name||'')}</div>${npVal(!t.rest&&t.s?`${t12(t.s,true)} ~ ${t12(t.e,true)}`:'')}</div>`).join('')}
        ${npRow('plus','종류 더하기','',{tap:1,act:'fe-ftadd',cls:'addr'})}</div>
      ${m.kind==='office'?`<div class="pg-cap">가는 요일</div><div class="pg-sec pad"><div class="chips wlchips" style="margin-top:0">${dayB}</div></div>`:''}
      ${wxOn()?`<div class="pg-cap">날씨 볼 곳</div><div class="pg-sec">${npRow('home','집',npVal(wxOk(m.home)?esc(wxName(m.home)):'우리 집과 같음'),{tap:1,act:'fe-home'})}${m.kind!=='free'?npRow('map-pin',st?'학교 · 유치원':'회사',npVal(wxOk(cfg.loc)?esc(wxName(cfg.loc)):'집과 같음'),{tap:1,act:'fe-loc'}):''}</div>`:''}
      ${st?`<div class="pg-cap">방학</div><div class="pg-sec">${(cfg.vac||[]).map((v,i)=>`<div class="prow"><span class="npi">${npi('calendar-days')}</span>${tpick('feVf'+i,v.from,'','date')}<span class="tsep">~</span>${tpick('feVt'+i,v.to,'','date')}<button class="xbtn" data-act="fe-vdel" data-i="${i}" aria-label="지우기">${npi('x',16)}</button></div>`).join('')}${npRow('plus','방학 기간 더하기','',{tap:1,act:'fe-vadd',cls:'addr'})}</div>`:''}
      <div class="pg-sec" style="margin-top:12px">${npRow('flag','이 날부터 새 일정',npVal(''),{tap:1,act:'fe-era-add'})}${ei>=0?npRow('trash-2','이 구간 지우기','',{tap:1,act:'fe-era-del',cls:'danger-row'}):''}
      ${m.kind!=='free'?npRow('calendar-x','공휴일엔 쉬어요',`<label class="sw"><input type="checkbox" id="feHol" ${m.holOff!==false?'checked':''}><i></i></label>`):''}</div>`;
}
// 일정 패턴 화면 (famDraft 를 고침): 날짜 창 "⚙️ 일정 패턴" 에서 열면 [저장] · 가족 고치기에서 열면 [완료] 로 돌아감
function openManPat(){hintBump('fep');
  const m=famDraft;if(!m)return;
  pageBack=m._own?()=>{famDraft=null;renderManCalPage();}:()=>openFamEdit();
  openPage(`${pageHead(esc(m.name||'가족')+' 일정 패턴',`<button class="ok" data-act="${m._own?'fp-save':'fp-done'}">${m._own?'저장':'완료'}</button>`)}
    <div class="pg-b np">${famSchedHtml(m)}</div>`,'manpat');
}
const famReRender=()=>pageMode==='manpat'?openManPat():openFamEdit();
const famEdIdx=m=>typeof m._ed==='number'&&m._ed>=0&&(m.eras||[])[m._ed]?m._ed:-1;
const famEdCfg=m=>{m=m||famDraft;const i=famEdIdx(m);return i>=0?m.eras[i]:m;};
function famPull(){
  const m=famDraft;if(!m)return;
  const v=id=>{const e=$('#'+id);return e?e.value:null;};
  if(v('feName')!==null)m.name=v('feName').trim().slice(0,10);
  if(v('feS'))m.start=v('feS');if(v('feE'))m.end=v('feE');
  if(v('feLbl')!==null){const l=v('feLbl').trim().slice(0,6);if(l&&l!==(m.kind==='student'?'학교':'회사'))m.label=l;else delete m.label;}
  if(v('feAnc'))m.anc=v('feAnc');
  const h=$('#feHol');if(h)m.holOff=h.checked;
  (famEdCfg(m).vac||[]).forEach((x,i)=>{const f=v('feVf'+i),t=v('feVt'+i);if(f!==null)x.from=f;if(t!==null)x.to=t;});
}
function openCheerEdit(){
  const list=cheerList();
  openPop(`<div class="mh">응원 버튼<b>아이콘 · 짧은 말 (최대 6개)</b></div>
    ${list.map(([e,l],i)=>`<div class="mi"><button class="chi" data-act="cheer-ico" data-i="${i}" aria-label="아이콘">${ico(e)}</button><input type="hidden" id="chE${i}" value="${esc(e)}"><input type="text" id="chL${i}" value="${esc(l)}" maxlength="10"><button class="xbtn" data-act="cheer-del" data-i="${i}">✕</button></div>`).join('')}
    ${list.length<6?'<button class="mi" data-act="cheer-add" style="justify-content:center;color:var(--accent);font-weight:700">＋ 버튼 추가</button>':''}
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="cheer-reset">기본값</button><button class="btn grow" data-act="cheer-save">저장</button></div>`);
}
function cheerPull(){const out=[];for(let i=0;i<6;i++){const e=$('#chE'+i),l=$('#chL'+i);if(!e||!l)break;out.push([e.value.trim()||'❤️',l.value.trim()||'응원해']);}return out;}



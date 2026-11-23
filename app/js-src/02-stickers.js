/* ================= 스티커 (💊 약 · 🏃 운동) ================= */
/* S.stamps = {defs:[{id, kind('pill'|'mark'), emoji, name, times(약: 하루 1~3번), from, to(약: 복용 기간)}],
 *             log:{'2026-10-14':{id: 횟수}}, remind(약 시간 알림), pillTimes:['08:00','13:00','20:00']} */
const stampMax=()=>4;
const STK_COL=['#ef4d5a','#f08a00','#f2c200','#1fa971','#2f6bf0','#8b5cf6','#ec4899','#8b919a'];
const colDots=(cur,act,id)=>`<div class="cdots">${STK_COL.map(c=>`<button class="${(cur||STK_COL[0]).toLowerCase()===c?'on':''}" style="background:${c}" data-act="${act}" ${id?`data-id="${id}" `:''}data-v="${c}" aria-label="색"></button>`).join('')}</div>`;
// 하루 한도(4개)가 찼을 때
function stampFull(){toast('스티커는 하루 4개까지예요');}
// 창을 닫지 않고 다시 그리기 (스티커가 다 사라졌으면 닫기)
function sdRefreshIcons(k){const tp=document.createElement('div');tp.innerHTML=stampDayHtml(k);document.querySelectorAll('#pop .sdr2').forEach(r=>{const n=tp.querySelector(`.sdr2[data-id="${CSS.escape(r.dataset.id)}"]`);if(!n){stampReopen(k);return;}const a=r.querySelector('.sdi'),b=n.querySelector('.sdi');if(a&&b&&a.innerHTML!==b.innerHTML)a.innerHTML=b.innerHTML;const sa=r.querySelector('.sdcnt'),sb=n.querySelector('.sdcnt');if(sa&&sb&&sa.textContent!==sb.textContent)sa.textContent=sb.textContent;r.classList.toggle('done',n.classList.contains('done'));});}
function stampReopen(k){if(stampsOn(k).length)openStampDay(k);else closePop();}
const STAMP_CAT=[
 ['운동 · 건강',[['🏃','달리기'],['👟','조깅'],['💪','운동'],['🌿','요가'],['🚴','자전거'],['🏊','수영'],['🚶','걷기'],['🏋️','헬스'],['⚽','축구'],['🏀','농구'],['🎾','테니스'],['🏸','배드민턴'],['⛰️','등산'],['🤸','스트레칭'],['🥊','복싱'],['🧗','클라이밍'],['🌡️','체온'],['⚖️','몸무게'],['🩸','혈압'],['🤧','감기'],['💤','낮잠']]],
 ['기분',[['😄','아주 좋음'],['🙂','좋음'],['🥰','행복'],['😌','편안'],['😐','보통'],['😫','피곤'],['😴','졸림'],['😰','불안'],['😔','우울'],['😢','슬픔'],['😡','화남'],['🤒','아픔']]],
 ['생활',[['💧','물'],['🦷','양치'],['🚿','샤워'],['🧴','스킨케어'],['🛏️','이불 정리'],['🧹','청소'],['🧺','빨래'],['🍽️','설거지'],['🗑️','쓰레기'],['🪴','화분'],['🐾','산책'],['🛒','장보기'],['📦','택배'],['🔑','열쇠'],['⏰','일찍 일어나기'],['🌙','일찍 자기'],['⛽','주유'],['💈','미용실'],['👕','다림질'],['♻️','분리수거']]],
 ['공부 · 일',[['📖','독서'],['✏️','공부'],['💻','작업'],['📝','기록'],['🎧','강의'],['🗣️','영어'],['📚','책'],['🧮','계산'],['📧','메일'],['📞','전화'],['🎯','목표'],['🗓️','일정'],['📋','인수인계'],['📦','재고 조사'],['🦺','안전 교육'],['🔧','점검'],['🚨','비상 대기'],['🍱','도시락'],['🧾','정산']]],
 ['아이 · 육아',[['🎒','준비물'],['🏫','등원'],['🚌','셔틀'],['📝','숙제'],['📚','학습지'],['🎹','피아노'],['🥋','태권도'],['🩰','발레'],['🧸','놀이'],['🛁','목욕'],['🍼','분유'],['🧷','기저귀']]],
 ['음식',[['🥗','샐러드'],['🍚','밥'],['🍎','과일'],['🥛','우유'],['☕','커피'],['🍺','술'],['🍕','외식'],['🥤','음료'],['🍳','요리'],['🥦','채소'],['🍫','간식'],['🍜','면']]],
 ['돈',[['💰','가계'],['🧾','영수증'],['💳','카드'],['🏦','저축'],['📈','투자'],['🪙','동전'],['🛍️','쇼핑'],['💸','지출'],['💵','월급날'],['📅','공과금']]],
 ['마음 · 취미',[['😴','수면'],['🧠','명상'],['🙏','기도'],['❤️','사랑'],['🎵','음악'],['🎮','게임'],['🎬','영화'],['🎨','그림'],['📷','사진 찍기'],['🎸','악기'],['🧶','뜨개질']]],
 ['동물 · 자연',[['🐶','강아지'],['🐱','고양이'],['🐰','토끼'],['🐦','새'],['🐟','물고기'],['🌸','꽃'],['🌳','나무'],['🌊','바다'],['☀️','해'],['🌧️','비'],['⭐','별'],['🔥','불']]],
 ['기념 · 병원',[['🎂','생일'],['🎁','선물'],['🎉','파티'],['✈️','여행'],['🚗','운전'],['🏥','병원'],['🩺','진료'],['💉','주사'],['🩹','치료'],['🧪','검사']]],
 ['약',[['pill:caps','캡슐'],['pill:round','둥근 알약'],['pill:tab','납작 정제'],['pill:drop','물약']]]];
const STAMP_NAME={};STAMP_CAT.forEach(c=>c[1].forEach(x=>{if(!STAMP_NAME[x[0]])STAMP_NAME[x[0]]=x[1];}));
const STK_SLOTS=10,MAN_STK_MAX=10;   // 내 스티커 칸 · 직접 추가한 가족 스티커 최대
function defaultStamps(){
  const m=(id,emoji,name)=>({id,kind:'mark',emoji,name,times:1,rep:'none',days:[],dates:[],skip:[],ats:[]});
  return {defs:[
    {id:'s_pill',kind:'pill',emoji:'💊',name:'약',times:1,color:'#ef4d5a',rep:'none',days:[],dates:[],skip:[],ats:[]},
    m('s_run','👟','조깅'),m('s_gym','💪','운동'),m('s_water','💧','물'),m('s_read','📖','독서'),
    m('s_sleep','😴','수면'),m('s_money','💰','가계'),m('s_teeth','🦷','양치'),
    Object.assign(m('s_empty','','' ),{empty:true}),Object.assign(m('s_empty2','','' ),{empty:true})],
  log:{},snap:{},remind:false,pillTimes:['08:00','13:00','20:00'],lastAt:[],v3:1,v4:1};}
// 약 모양 4가지(shape): caps 캡슐(기본) · round 둥근 알약 · tab 납작 정제 · drop 물약. 하루 n번이면 n칸(캡슐 · 정제는 가로, 둥근 알약은 조각, 물약은 차오르는 양)으로 나눠 먹은 칸만 약 색으로 채움 (안 먹은 날은 그 색의 연한 테두리)
let pillSeq=0;
function pillSvg(n,k,px,col,shape){
  n=Math.max(1,Math.min(3,n||1));k=Math.max(0,Math.min(n,k||0));px=px||14;const RED=col||'#ef4d5a',id='pc'+(++pillSeq);let p='';
  const ln=(x1,y1,x2,y2)=>`<line class="pd" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  if(shape==='round'){
    const r=8.4,c=11,pt=a=>`${(c+r*Math.cos(a)).toFixed(2)} ${(c+r*Math.sin(a)).toFixed(2)}`;
    if(k>=n)p=`<circle cx="11" cy="11" r="${r}" fill="${RED}"/>`;
    else for(let i=0;i<k;i++){const a0=-Math.PI/2+i*2*Math.PI/n,a1=a0+2*Math.PI/n;p+=`<path d="M11 11L${pt(a0)}A${r} ${r} 0 0 1 ${pt(a1)}Z" fill="${RED}"/>`;}
    if(n>1)for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n;p+=ln(11,11,(c+r*Math.cos(a)).toFixed(2),(c+r*Math.sin(a)).toFixed(2));}
    p+=`<circle class="pr" cx="11" cy="11" r="${r}" fill="none"/>`;
  }else if(shape==='tab'){
    const sg=17/n;p=`<defs><clipPath id="${id}"><ellipse cx="11" cy="11" rx="9" ry="6.2"/></clipPath></defs><g clip-path="url(#${id})">`;
    for(let i=0;i<k;i++)p+=`<rect x="${(2.5+i*sg).toFixed(2)}" y="3" width="${sg.toFixed(2)}" height="16" fill="${RED}"/>`;
    p+=`</g>`;for(let i=1;i<n;i++)p+=ln((2.5+i*sg).toFixed(2),5,(2.5+i*sg).toFixed(2),17);
    p+=`<ellipse class="pr" cx="11" cy="11" rx="9" ry="6.2" fill="none"/>${n===1?`<line class="pr" x1="11" y1="6.5" x2="11" y2="15.5" stroke="${k>=n?'#fff':RED}"/>`:''}`;   // 가운데 홈 줄은 1번짜리만 (2 · 3번은 칸 나눔 줄과 겹쳐 세로줄이 많아 보임)
  }else if(shape==='drop'){
    const d='M11 2.5C11 2.5 4.2 10 4.2 14.2a6.8 6.8 0 0013.6 0C17.8 10 11 2.5 11 2.5z';
    p=`<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${id})"><rect x="0" y="${(21-(k/n)*19).toFixed(2)}" width="22" height="22" fill="${RED}"/></g>`;
    for(let i=1;i<n;i++){const y=(21-(i/n)*19).toFixed(2);p+=ln(5,y,17,y);}
    p+=`<path class="pr" d="${d}" fill="none"/>`;
  }else{
    const w=20,sg=w/n;
    p=`<defs><clipPath id="${id}"><rect x="1" y="6" width="${w}" height="10" rx="5"/></clipPath></defs><g transform="rotate(-40 11 11)"><g clip-path="url(#${id})">`;
    for(let i=0;i<k;i++)p+=`<rect x="${(1+i*sg).toFixed(2)}" y="6" width="${sg.toFixed(2)}" height="10" fill="${RED}"/>`;
    if(k>=n)p+=`<rect x="3" y="7.2" width="9" height="2" rx="1" fill="#fff" opacity=".4"/>`;
    p+='</g>';for(let i=1;i<n;i++)p+=ln((1+i*sg).toFixed(2),6,(1+i*sg).toFixed(2),16);
    p+=`<rect class="pr" x="1" y="6" width="${w}" height="10" rx="5" fill="none"/></g>`;
  }
  return `<svg class="pillic${k?'':' off'}" style="--pc:${RED}" width="${px}" height="${px}" viewBox="0 0 22 22">${p}</svg>`;
}
// 스티커가 그날 "할 일"로 깔리는지: 이날만(dates) · 매일 · 요일 · 근무 맞춤(휴무 날만/근무 날만) + 기간 · 공휴일 빼기 · 야간 날 빼기 · 건너뛴 날(skip)
function stampPlanned(s,k){
  if((s.skip||[]).includes(k))return false;
  if((s.dates||[]).includes(k))return true;
  if(!((!s.from||k>=s.from)&&(!s.to||k<=s.to)))return false;
  const d=parse(k);let on=false;
  if(s.rep==='daily')on=true;
  else if(s.rep==='dow')on=(s.days||[]).includes(d.getDay());
  else if(s.rep==='month'){const md=s.mday||(s.from?parse(s.from).getDate():1);on=d.getDate()===Math.min(md,new Date(d.getFullYear(),d.getMonth()+1,0).getDate());}   // 31일 없는 달은 말일
  else if(s.rep==='work'){if(!persOn(k)){const sh=shiftOf(d);if(Array.isArray(s.wtypes)&&s.wtypes.length)on=s.wtypes.includes(sh);else{const r=isRest(sh);on=s.workMode==='work'?!r:r;}}}   // 근무 맞춤: 고른 근무타입(wtypes) · 옛 값은 휴무 날만/근무 날만
  if(on&&s.noHol&&(holName(k)||compHol(k)))on=false;
  if(on&&s.noWknd&&(d.getDay()===0||d.getDay()===6))on=false;
  if(on&&s.act&&actClash(s.act,k))on=false;   // v0.114 활동 시간이 근무와 겹치는 날은 빠짐
  return on;
}
const pillActive=(s,k)=>s.kind==='pill'&&stampPlanned(s,k);
const markPlanned=(s,k)=>s.kind==='mark'&&stampPlanned(s,k);
function stampRule(s){
  const r=s.rep==='daily'?'매일':s.rep==='month'?`매달 ${s.mday||(s.from?parse(s.from).getDate():1)}일`:s.rep==='dow'?([1,2,3,4,5,6,0].filter(w=>(s.days||[]).includes(w)).map(w=>DOW[w]).join('·')||'요일 없음'):s.rep==='work'?(Array.isArray(s.wtypes)&&s.wtypes.length?s.wtypes.map(x=>shiftLabel(x)).join(' · ')+' 날':(s.workMode==='work'?'근무 날만':'휴무 날만')):'이날만';
  const ex=[s.noHol?'공휴일 빼기':'',s.noWknd?'토 · 일 빼기':'',s.to&&s.rep!=='none'&&s.rep!=='once'?`~${+s.to.slice(5,7)}/${+s.to.slice(8)}`:''].filter(Boolean).join(' · ');
  return (stN(s)>1?`하루 ${stN(s)}번 · `:'')+r+(ex?' · '+ex:'');
}
/* ---- 달력 날짜 줄을 누르면: 스티커 있으면 완료 창, 없으면 등록 창 ---- */
let stDayK='';
function openStampDay(k,nav){
  const list=stampsOn(k);
  if(!list.length&&!nav){openStampPick(k);return;}
  stDayK=k;document.querySelectorAll('.cell.selTop').forEach(c=>c.classList.remove('selTop'));
  openPop(stampDayHtml(k));
  const c=cellOf(k);if(c)c.classList.add('selTop');   // 팝업이 떠 있는 동안 칸 위쪽 1/3 은 눌린 채로
  const m=$('#pop .menu');if(m)m.classList.add('sdpop');
}
// v0.181 스티커 버튼 움직임 (부드럽게): 채움은 길이 대신 옆으로 밀기(transform · 폰이 가장 부드럽게 그림) · 누르면 줄었다 커짐 · 다 차면 한 번 더 톡 + 초록 · ✓
let sdLaterT=0;
const sdTx=p=>`translateX(${((p-100)/1.4).toFixed(2)}%)`;
const sdPct=(v,N)=>v<=0?0:v>=N?100:Math.round(100*(.1+.9*v/N));   // v0.183 첫 칸을 조금만 길게(1/3 = 40% · 2/3 = 70% · 1/2 = 55%) → 덜 찬 칸은 작은 타원   // 채움 막대는 바 폭의 1.4배 (왼쪽 40% 여유 → 넘쳤다 돌아올 때 왼쪽이 비지 않게)
function sdPress(b){b.classList.remove('press');void b.offsetWidth;b.classList.add('press');}
function sdBarSet(b,v,N){const i=b.querySelector('i'),f=v>=N,one=b.classList.contains('one');
  sdPress(b);i.style.transform=sdTx(sdPct(v,N));
  if(!f){b.classList.remove('full');return;}
  if(one){b.classList.add('full');return;}
  setTimeout(()=>{b.classList.add('full');sdPress(b);},matchMedia('(prefers-reduced-motion: reduce)').matches?0:480);}
let sdAnim=null;   // 방금 누른 여러 번 스티커 (막대가 전 값에서 새 값으로 튕기며 차게)
function stampDayHtml(k){   // v0.170 새 모양 (시안 design/stk/v1): 한 줄씩 · 줄을 누르면 완료 ↔ 취소 · 여러 번은 동그라미 · ⋯ = 건너뛰기 · 그만하기 · 고치기
  const list=stampsOn(k),d=parse(k),sh=shiftOf(d);
  const row=({s,n})=>{
    const V=stView(s,k),N=V.N,pill=s.kind==='pill',id=`data-id="${s.id}" data-k="${k}"`,done=n>=N;
    const sub=[s.act?`${t12(s.act.s,true)} ~ ${t12(s.act.e,true)}`:'',stampRule(s),stAts(s).length?stAts(s).map(fmtTm12).join(' · '):''].filter(Boolean).join(' · ');
    const an=sdAnim&&sdAnim.id===s.id&&sdAnim.k===k?sdAnim:null,to=Math.round(n/N*100),from=an?Math.round(an.from/N*100):to,full=n>=N,wasFull=an?an.from>=N:full;   // v0.180 버튼 통일 (시안 design/stk-bar/v3): 두꺼운 알약 · 누르면 줄었다 커짐 · 다 차면 한 번 더 톡 + 안에 ✓
    const mark=`<span class="sdpg"><span class="sdbar${N===1?' one':''}${full?' full':''}"${pill&&V.col?` style="--dc:${esc(V.col)};--fc:${esc(V.col)}"`:''}><i style="transform:${sdTx(sdPct(n,N))}"></i>${npi('check',16)}</span><span class="sdcnt">${N>1?`${n}/${N}`:''}</span></span>`;   // (1번짜리도 빈 숫자 칸 → 버튼 줄이 가지런)
    return `<div class="sdr2 ${done?'done':''}" data-act="sd-tap" ${id}${s.retired?'':` data-hold="stk"`}><span class="sdi">${pill?pillSvg(N,n,26,V.col,V.shape):`<span class="${n?'':'plan'}">${ico(s.emoji)}</span>`}</span><div class="sdn"><b>${esc(s.name)}</b>${sub?`<span>${esc(sub)}</span>`:''}</div>${mark}<button class="sdmore" data-act="sd-more" ${id} aria-label="더보기">${npi('more',18)}</button></div>`;
  };
  const full=list.length>=stampMax();
  return (`<div class="mh">${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]}) · ${esc(shiftLabel(sh))}<b>스티커</b></div>
    ${list.length?`<div class="sdlist">${list.map(row).join('')}</div>`:''}
    <div class="sdfoot"><button class="sdadd ${full?'dis':''}" data-act="sd-add" data-k="${k}">${npi('plus',17)}스티커 붙이기${full?` (${stampMax()}개 다 참)`:''}</button><button class="sdset" data-act="sd-manage">${npi('settings',17)}스티커 설정</button></div>`);
}
function toastUndo(msg,fn){
  const t=$('#toast');toastStack(t);t.innerHTML=`${esc(msg)} <b class="tu">되돌리기</b>`;t.classList.add('show','act');toastIn(t);
  toast._undo=fn;clearTimeout(toast._t);toast._t=setTimeout(()=>{t.classList.remove('show','act');toast._undo=null;},3500);
}
// 약 기록 보존: 먹음 표시를 하는 순간 그날 기록에 그때의 색 · 횟수 · 모양을 같이 저장 → 나중에 약 설정을 바꿔도 이미 표시한 날은 그대로
const stSnap=(k,id)=>((S.stamps.snap||{})[k]||{})[id];
const stView=(s,k)=>{const sn=s.kind==='pill'&&k?stSnap(k,s.id):null;return {N:sn?sn.t:stDayN(s,k),col:sn?sn.c:s.color,shape:sn?sn.h:(s.shape||'caps')};};
function stampSet(id,k,v){
  const lg=S.stamps.log[k]||(S.stamps.log[k]={}),sp=S.stamps.snap||(S.stamps.snap={});
  if(v>0){lg[id]=v;const d=S.stamps.defs.find(x=>x.id===id);if(d&&d.kind==='pill'&&!((sp[k]||{})[id]))(sp[k]=sp[k]||{})[id]={c:d.color,t:stDayN(d,k),h:d.shape||'caps'};}
  else{delete lg[id];if(sp[k]){delete sp[k][id];if(!Object.keys(sp[k]).length)delete sp[k];}}
  if(!Object.keys(lg).length)delete S.stamps.log[k];
}
/* ---- 날짜에서 스티커 고르기: 내 스티커 10칸(빈 칸 포함) + "＋"(아주 많은 그림 · 내 사진 · 약 모양) ---- */
const stIcon=(s,px)=>s.empty?'<i class="emptybox"></i>':s.kind==='pill'?pillSvg(stN(s),Math.ceil(stN(s)/2),px||26,s.color,s.shape):ico(s.emoji);
const slotDefs=()=>S.stamps.defs.filter(x=>!x.retired&&!x.one);
// ＋ 로 붙인 스티커 중 아직 쓰는 것(반복 규칙이 남았거나 앞으로 날짜가 있음)만 설정에 보임
function extraDefs(){const tk=fmt(new Date());return S.stamps.defs.filter(x=>x.one&&!x.retired&&((x.rep&&x.rep!=='none'&&(!x.to||x.to>=tk))||(x.dates||[]).some(d=>d>=tk)));}
function openStampPick(k){
  if(stampsOn(k).length>=stampMax()){stampFull();return;}
  const d=parse(k);
  openPop(`<div class="mh">${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]})<b>붙일 스티커</b></div>
    <div class="mi sgrid sg5">${slotDefs().map(s=>`<button class="${s.empty?'emp':''}" data-act="${s.empty?'sp-fill':'sp-pick'}" data-id="${s.id}" data-k="${k}"><span class="si">${stIcon(s)}</span><small>${s.empty?'비어 있음':esc(s.name)}</small></button>`).join('')}</div>
    `);   // v0.170 아래 닫기 버튼 뺌 (바깥을 누르면 닫힘)
}
// 큰 목록(종류별 탭 · 내 사진 · 약 모양 · 직접 입력)에서 하나 고르기. o.onPick(그림, 이름)
function openStampBig(o){
  openIcn(Object.assign({title:'스티커 고르기',sub:'',icon:'',name:null,cats:STAMP_CAT,instant:true,needIcon:true,hint:'하나 누르면 바로 골라져요'},o,{onSave:(e,n,src)=>o.onPick(e,n,src)}));
}
// 그림 → 스티커 정의 내용 ('pill:모양' 이면 약, 그 밖은 이모티콘 · @사진)
function stDefFrom(e,name){
  if(String(e).startsWith('pill:'))return {kind:'pill',emoji:'💊',name:(name||'약').slice(0,12),color:STK_COL[0],shape:e.slice(5)};
  return {kind:'mark',emoji:e,name:(name||STAMP_NAME[e]||(isPhoto(e)?'사진':'내 그림')).slice(0,12)};
}
// ＋ 로 고른 그림: 같은 것을 다시 고르면 그 스티커를 다시 씀. 등록 화면(기본 이날만)으로 이어짐
function openStampPlus(k){openStampBig({title:'스티커 고르기',sub:md(k),onCancel:()=>openStampPick(k),onPick:(e,n)=>stampExtra(k,e,n)});}
function stampExtra(k,e,name){
  const f=stDefFrom(e,name);
  let x=S.stamps.defs.find(y=>y.one&&!y.retired&&(!y.rep||y.rep==='none')&&y.kind===f.kind&&(f.kind==='pill'?(y.shape||'caps')===f.shape:y.emoji===f.emoji));   // (반복이 남은 것 · 칸에서 옮겨 온 것은 다시 쓰지 않음 → 그 규칙과 섞이지 않게)
  const made=!x;
  if(!x){x=Object.assign({id:'o_'+uid(),one:true,times:1,rep:'none',days:[],dates:[],skip:[],ats:[]},f);S.stamps.defs.push(x);}
  openStampReg(k,x.id,'','plus');if(stDraft)stDraft.newDef=made?x.id:'';
}
// v0.150 이 스티커를 이 날 말고 다른 데서 쓰고 있나 (반복 규칙 · 다른 날짜 · 지난 기록)
function stUsedElse(s,k){const L=S.stamps.log||{};return (s.rep&&s.rep!=='none')||(s.dates||[]).some(x=>x!==k)||Object.keys(L).some(x=>x!==k&&L[x]&&L[x][s.id]);}
// 같은 그림 · 같은 횟수의 한 번 쓰는 스티커 (없으면 새로)
// 옵션 묶음(횟수 · 알림 시각 · 활동 · 가족 보이기)을 글자 하나로 — 저장된 스티커(s) 또는 등록 화면 값(d, draft)
function stOptKey(o,draft){
  const n=draft?o.times:stN(o),ats=draft?(o.alarm?(stFill(o),o.ats.slice(0,n)):[]):(o.ats||[]).slice(0,n),a=o.act&&o.act.s&&o.act.e?[o.act.s,o.act.e,o.act.r||'']:null;
  return JSON.stringify([n,ats,a,stFamShow()?(draft?!!o.fam:stFam(o)):0]);
}
function stOneLike(s,times,key){
  const same=y=>y.kind===s.kind&&(s.kind==='pill'?(y.shape||'caps')===(s.shape||'caps')&&(y.color||'')===(s.color||''):y.emoji===s.emoji)&&(y.name||'')===(s.name||'');
  let x=S.stamps.defs.find(y=>y!==s&&y.one&&!y.retired&&(!y.rep||y.rep==='none')&&(key?stOptKey(y)===key:stN(y)===times)&&same(y));
  if(!x){x={id:'o_'+uid(),one:true,kind:s.kind,emoji:s.emoji,name:s.name,times,rep:'none',days:[],dates:[],skip:[],ats:[]};if(s.kind==='pill'){x.color=s.color;x.shape=s.shape||'caps';}if(s.fam!==undefined)x.fam=s.fam;S.stamps.defs.push(x);}
  return x;
}
function stRetire(s){Object.assign(s,{retired:true,rep:'none',dates:[],days:[],skip:[],from:'',to:'',ats:[]});}
// 이미 붙인 곳(날짜 · 반복 · 기록)이 하나라도 있는 스티커인지
const stUsed=s=>(s.dates||[]).length>0||(!!s.rep&&s.rep!=='none')||Object.keys(S.stamps.log).some(k=>S.stamps.log[k]&&S.stamps.log[k][s.id]);
let stMoved=false;   // 방금 칸을 바꾸면서 옛 스티커를 "＋ 로 붙인 스티커" 쪽으로 옮겼는지 (안내 글용)
// 칸 채우기(빈 칸) · 바꾸기: 옛 스티커는 지우지 않고 칸 목록에서만 빼서 "＋ 로 붙인 스티커" 쪽으로 옮김 → 이미 붙인 날짜 · 반복 · 알림 · 기록이 그대로.
// srcId = "＋ 로 붙인 스티커" 줄에서 골랐을 때 그 스티커: 그림 · 이름 (약은 색 · 횟수도) 을 복사해서 새로 만들고 ＋ 쪽은 건드리지 않음
function stFillSlot(id,e,n,srcId){
  const defs=S.stamps.defs,i=defs.findIndex(x=>x.id===id),o=defs[i];stMoved=false;if(!o)return null;
  const f=stDefFrom(e,n),src=srcId?defs.find(x=>x.id===srcId&&x.one&&!x.retired):null;
  if(src){['color','shape','times'].forEach(p=>{if(src[p]!==undefined)f[p]=src[p];});if(src.fam!==undefined)f.fam=src.fam;}
  if(o.empty){Object.assign(o,f,{empty:false});delete o.empty;return o;}
  if(o.kind==='mark'&&f.kind==='mark'&&o.emoji===f.emoji){o.name=f.name;return o;}
  if(stUsed(o)){stEndFromToday(o);stMoved=true;}else stRetire(o);
  const nd=Object.assign({id:uid(),times:1,rep:'none',days:[],dates:[],skip:[],ats:[]},f);defs.splice(i,0,nd);return nd;
}
// 칸에 넣을 스티커를 고르는 큰 목록 맨 위의 "＋ 로 붙인 스티커" 줄 (있을 때만) — 누르면 그 그림 · 이름으로 칸에 새로 만들고, ＋ 쪽은 그대로
function stPlusRow(o){
  return '';   // v0.176 ＋ 기능 없앰
  const ex=extraDefs();if(!ex.length)return '';
  const code=s=>s.kind==='pill'?'pill:'+(s.shape||'caps'):s.emoji;
  return `<div class="mi icn-sec" style="display:block"><div class="icn-lb">＋ 로 붙인 스티커</div><div class="sgrid sg4" style="margin-top:6px">${ex.map(s=>`<button class="${o&&o.srcId===s.id?'on':''}" data-act="icn-pick" data-v="${esc(code(s))}" data-n="${esc(s.name)}" data-mine="1" data-src="${esc(s.id)}"><span class="si">${stIcon(s)}</span><small>${esc(s.name)}</small></button>`).join('')}</div></div>`;
}
// 칸 비우기: 칸에서 빼도 이미 붙인 스티커는 그대로 (＋ 로 붙인 스티커 쪽으로 옮김). ＋ 쪽에서 "지우기"는 진짜 지우기 (앞으로 일정은 없어지고 지난 체크 기록만 남음)
// v0.176 칸에서 뺀(바꾼 · 비운) 스티커: 지난 날짜 · 기록은 그대로, 오늘부터는 안 깔림 (＋ 목록이 없어져서 숨은 반복이 남지 않게)
function stEndFromToday(o){const tk=fmt(new Date());o.one=true;if(o.rep&&o.rep!=='none'){const y=addK(tk,-1);if(!o.to||o.to>=tk)o.to=y;if(o.from&&o.from>o.to){o.rep='none';o.to='';}}o.dates=(o.dates||[]).filter(d=>d<tk);o.ats=[];}
function stSlotClear(id){
  const defs=S.stamps.defs,i=defs.findIndex(x=>x.id===id),o=defs[i];stMoved=false;if(!o)return;
  const slot=!o.one;
  if(slot&&stUsed(o)){stEndFromToday(o);stMoved=true;}else stRetire(o);
  if(slot)defs.splice(i,0,{id:uid(),kind:'mark',emoji:'',name:'',empty:true,times:1,rep:'none',days:[],dates:[],skip:[],ats:[]});
}
function openStampSlot(id){
  const s=S.stamps.defs.find(x=>x.id===id);if(!s)return;
  if(s.empty){openStampBig({title:'칸에 넣을 스티커',extra:stPlusRow,onPick:(e,n,src)=>{stFillSlot(id,e,n,src);save();render();openStampPage();}});return;}
  const sl=slotDefs(),i=sl.indexOf(s);
  openPop(`<div class="mh">${s.one?'＋ 로 붙인 스티커':`${i+1}번째 칸`}<b>${esc(s.name)}</b></div>
    <div class="mi icn-top"><span class="icn-cur">${stIcon(s,32)}</span><input type="text" id="slotName" value="${esc(s.name)}" maxlength="12" placeholder="이름"></div>
    ${s.kind==='pill'?`<div class="mi"><div class="pl2" style="flex:none;margin-right:10px">색</div>${colDots(s.color,'slot-col',s.id)}</div>`:''}
    ${stFamShow()?`<div class="mi"><div class="pl2" style="flex:1">👪 가족에게 보이기</div><label class="sw"><input type="checkbox" id="slotFam" data-id="${esc(s.id)}" ${stFam(s)?'checked':''}><i></i></label></div>`:''}
    <div class="mi" style="gap:8px">${s.one?'':`<button class="btn ghost grow" data-act="slot-swap" data-id="${s.id}">다른 스티커로</button>`}<button class="btn ghost grow danger" data-act="slot-clear" data-id="${s.id}">${s.one?'지우기':'비우기'}</button><button class="btn grow" data-act="slot-save" data-id="${s.id}">저장</button></div>`);
}
function slotPullName(id){
  const n=$('#slotName'),s=S.stamps.defs.find(x=>x.id===id);
  if(n&&s){const v=n.value.trim().slice(0,12);if(v)s.name=v;}
}
/* ---- 스티커 등록 · 고치기 (전체 화면) ---- */
let stDraft=null;
const stN=s=>Math.max(1,Math.min(3,(s&&+s.times)||1));
const stDayN=(s,k)=>{const v=s&&s.tday&&k?+s.tday[k]:0;return v>=1&&v<=3?v:stN(s);};   // v0.188 그 날만 횟수 (s.tday[k]) · 없으면 스티커 횟수
const stAts=s=>(s&&Array.isArray(s.ats)?s.ats:[]).filter(Boolean).slice(0,stN(s));   // 이 스티커의 알림 시각 (알림이 꺼져 있으면 빈 목록)
const fmtTm12=t=>t12(String(t));
// 알림을 처음 켤 때 시각: 마지막에 정한 시각 (없으면 8시), 2·3번째는 6시간씩 뒤
function stAtInit(i){const l=S.stamps.lastAt||[];if(l[i])return l[i];const b=String(l[0]||'08:00').split(':').map(Number);return `${pad((b[0]+6*i)%24)}:${pad(b[1]||0)}`;}
function stFill(d){const a=Array.isArray(d.ats)?d.ats.slice(0,d.times):[];for(let i=a.length;i<d.times;i++)a.push(stAtInit(i));d.ats=a;}
// 근무 맞춤에서 골라 둔 근무타입 (옛 "휴무 날만/근무 날만"은 그에 맞는 근무타입을 모두 고른 것으로 보여 줌)
function wtypesOf(s){
  if(s&&Array.isArray(s.wtypes)&&s.wtypes.length)return s.wtypes.filter(k=>S.types.some(t=>t.k===k));
  const work=!!(s&&s.workMode==='work');return S.types.filter(t=>t.k!==NONE_K&&(work?!t.rest:t.rest)).map(t=>t.k);
}
function stDraftOf(s,k,edit,back){
  const own=!!(s&&(edit||stUsed(s)));   // v0.176 이미 쓰는 스티커는 지금 값(횟수 · 알림 · 활동 · 가족)으로 시작 (＋ · 이 날만 따로 없앰 → 스티커는 하나)
  const kind=s?s.kind:'mark',times=edit?stN(s):1;   // v0.188 붙일 땐 늘 1번부터 (고른 횟수는 그 날만 · s.tday)   // v0.150 새로 붙일 땐 언제나 1번부터 (지난번 횟수 기억 안 함)
  const d={k,back:back||'',edit:!!edit,id:s?s.id:'__new',kind,name:s?s.name:'',emoji:(s&&s.emoji)||'🏃',color:(s&&s.color)||STK_COL[0],times,
    alarm:!!(own&&s.ats&&s.ats.length),ats:own&&s.ats?s.ats.slice():[],shape:(s&&s.shape)||'caps',fam:own?stFam(s):kind!=='pill',   // v0.153 새로 붙일 땐 알림 · 활동 · 가족 보이기도 기본값
    rep:edit?(s.rep||'none'):'once',days:s&&s.days&&s.days.length?s.days.slice():[parse(k).getDay()],workMode:(s&&s.workMode)||'rest',wtypes:wtypesOf(s),
    from:(edit&&s.from)||k,to:(edit&&s.to)||'',noHol:!!(edit&&s.noHol),noWknd:!!(edit&&s.noWknd),noNight:!!(edit&&s.noNight),
    act:own&&s.act?Object.assign({},s.act):null,actOpen:!!(own&&s.act)};
  if(d.alarm)stFill(d);
  return d;
}
function openStampReg(k,id,back,ret){
  if(pageMode==='stamps'&&!back)back='stamps';
  const isNew=id==='__new'||id==='__newpill';
  const s=isNew||!id?null:S.stamps.defs.find(x=>x.id===id);   // 달력에서 열면 "새 스티커"부터 (옛 스티커가 미리 골라져 있으면 "이날만"이 그 스티커의 매일 규칙과 섞여 보임)
  stDraft=stDraftOf(s,k,!!(s&&back&&id),back);stDraft.ret=ret||'';
  if(id==='__newpill'){stDraft.kind='pill';stDraft.name='약';stDraft.fam=false;}
  if(back==='stamps'&&!stDraft.edit)stDraft.rep='daily';
  renderStampReg();
}
function srPull(){const d=stDraft;if(!d)return;const n=$('#srName');if(n)d.name=n.value.trim().slice(0,12);}
// 시각 알림 안내 한 줄 ("울려요" 로 단정) — 지난 시각 · 수면 시간은 따로 알려줌
function stAlarmHint(d){
  if(!d.alarm)return '';
  stFill(d);const ts=d.ats.slice(0,d.times).filter(Boolean),list=ts.join(' · ');
  if(d.rep!=='once')return `깔리는 날마다 ${list}에 알림이 울려요`;
  const day=parse(d.k),now=Date.now();
  const ms=ts.map(t=>{const[h,m]=t.split(':').map(Number);return new Date(day.getFullYear(),day.getMonth(),day.getDate(),h,m).getTime();});
  const left=ms.filter(x=>x>now);
  if(!left.length)return '이미 지난 시각이라 알림이 울리지 않아요';
  let sl=[];try{if(S.pushQuiet!==false)sl=sleepWins(new Date(day.getFullYear(),day.getMonth(),day.getDate()),1);}catch(e){}
  const inSl=left.filter(x=>sl.some(w=>x>=w[0]&&x<w[1]));
  const base=`${day.getMonth()+1}월 ${day.getDate()}일 ${list}에 알림이 울려요`;
  return inSl.length===left.length?base+' · 단 수면 시간이라 조용히 지나가요':base;
}
// v0.126 스티커 등록: 자세한 조건은 접어 둠 — 기간 · 공휴일 빼기 · 토일 빼기 · 가족 · 학원 · 취미 (켜 둔 게 있으면 접힌 줄에 요약)
function srMoreHtml(d,om,sw){   // v0.151 접기 없이: 반복이면 기간 · 공휴일 줄 · 가족에게 보이기 · 활동 시간
  const rep=d.rep!=='once'&&d.rep!=='none',fam=!om&&stFamShow(),act=d.kind!=='pill';
  return `${rep?`<div class="pg-cap">기간</div><div class="pg-sec">
      <div class="prow"><span class="npi">${npi('calendar')}</span><div class="pl2">기간</div>${tpick('srFrom',d.from,'','date')}<span class="tsep">~</span>${d.to?`${tpick('srTo',d.to,'','date')}<button class="xbtn" data-act="sr-noend" aria-label="끝 없음으로">✕</button>`:'<button class="tbtn" data-act="sr-setend">끝 없음 ›</button>'}</div>
      ${sw('srHol',d.noHol,'공휴일엔 빼기','calendar-off')}${['daily','work','month'].includes(d.rep)?sw('srWknd',d.noWknd,'토 · 일 빼기','calendar-days'):''}</div>`:''}
    ${fam?`<div class="pg-sec" style="margin-top:12px">${sw('srFam',d.fam,'가족에게 보이기','heart')}</div>`:''}
    ${act?actFoldHtml(d.act,d.actOpen,'sr'):''}`;
}
function renderStampReg(){
  const d=stDraft,day=parse(d.k),pill=d.kind==='pill',isNew=d.id==='__new';
  const seg=(v,l)=>`<button class="${d.rep===v?'on':''}" data-act="sr-rep" data-v="${v}">${l}</button>`;
  const sw=(id,on,l,ic)=>`<div class="prow">${ic?`<span class="npi">${npi(ic)}</span>`:''}<div class="pl2">${l}</div><label class="sw"><input type="checkbox" id="${id}" ${on?'checked':''}><i></i></label></div>`;
  const om=d.own?(S.family||[]).find(x=>x.id===d.own):null;
  const title=d.edit?`${esc(d.name||'스티커')} 고치기${om?` <small style="font-size:12px;color:var(--muted)">· ${esc(om.name)}</small>`:''}`:(pill?'약':'스티커');   // v0.151 날짜는 위 칸에
  const wtL=om?(om.kind==='shift'?S.types.filter(t=>t.k!==NONE_K).map(t=>[t.k,badge(t.k,'sm',''),t.name||t.k]):famTypes(famEra(om,new Date())).map(t=>[t.k,ftBadge(t,'sm'),t.name])):S.types.filter(t=>t.k!==NONE_K).map(t=>[t.k,badge(t.k,'sm',''),t.name||t.k]);
  const covered=!d.own&&!d.edit&&d.rep==='once'&&d.id!=='__new'&&d.id!=='__newpill'&&(()=>{const x=S.stamps.defs.find(y=>y.id===d.id);return !!x&&stampPlanned(x,d.k);})();
  const restTxt=pill?'이날 빈 알약이 깔려요. 먹으면 칸 위쪽을 눌러 [✓ 먹음] 하세요.':'이날 흐린 스티커가 깔려요. 하고 나서 칸 위쪽을 눌러 [✓ 완료] 하세요.';
  openPage(`<div class="pg-h"><button class="bk" data-act="sr-back" aria-label="뒤로">‹</button><b>${title}</b><span style="min-width:56px"></span></div>
    <div class="pg-b srpg np">
    <div class="sr-hd"><span class="si">${pill?pillSvg(d.times,Math.ceil(d.times/2),34,d.color,d.shape):ico(d.emoji)}</span><div class="srn">${om?`<input type="text" id="srName" value="${esc(d.name)}" maxlength="12" placeholder="이름">`:`<b>${esc(d.name||(pill?'약':'새 스티커'))}</b>`}<small>${day.getMonth()+1}월 ${day.getDate()}일 (${DOW[day.getDay()]})</small></div></div>
    ${pill?`<div class="pg-sec" style="margin-top:12px"><div class="prow"><div class="pl2">색</div>${colDots(d.color,'sr-col')}</div></div>`:''}
    ${d.edit&&d.back==='day'?`<div class="hint keep" style="margin:0;padding:12px 22px 0">반복 · 기간을 고치면 ${day.getMonth()+1}월 ${day.getDate()}일부터 적용돼요 (이전 날은 그대로)</div>`:''}
    <div class="pg-cap">하루 몇 번</div>
    <div class="pg-sec pad"><div class="npseg">${[1,2,3].map(n=>`<button class="${d.times===n?'on':''}" data-act="sr-times" data-v="${n}">${n}번</button>`).join('')}</div></div>
    <div class="pg-cap">반복</div>
    <div class="pg-sec pad"><div class="npseg sm5">${d.edit?seg('none','없음'):seg('once','이날만')}${seg('dow','요일')}${seg('daily','매일')}${persAll()&&!om?'':seg('work',om&&famUsesTypes(om)?'일정':'근무')}${seg('month','매달')}</div>
    ${d.rep==='dow'?`<div class="sdays big">${[1,2,3,4,5,6,0].map(w=>`<button class="${d.days.includes(w)?'on':''}" data-act="sr-day" data-v="${w}">${DOW[w]}</button>`).join('')}</div>`:''}
    ${d.rep==='work'?`<div class="srwt">${wtL.map(([k,b,n])=>`<button class="${d.wtypes.includes(k)?'on':''}" data-act="sr-wt" data-v="${esc(k)}" aria-pressed="${d.wtypes.includes(k)}">${b}<span>${esc(n)}</span></button>`).join('')}</div>
      <div class="hint" style="margin:6px 0 0;padding:0">고른 ${om&&famUsesTypes(om)?'일정':'근무'}인 날에만 나와요 · 여러 개 고를 수 있어요</div>`:''}
    ${d.rep==='month'?`<div class="hint" style="margin:8px 0 0;padding:0">매달 ${parse(d.from||d.k).getDate()}일 · 그 날이 없는 달은 말일</div>`:''}
    ${d.rep==='none'?'':d.rep==='once'?`<div class="hint${covered?' keep':''}" style="margin:8px 0 0;padding:0;${covered?'color:var(--danger)':''}">${covered?'이 스티커는 이 날에 이미 깔려 있어요 (반복 규칙).':restTxt}</div>`:''}</div>
    ${srMoreHtml(d,om,sw)}
    <div class="pg-sec" style="margin-top:12px">${sw('srAlarm',d.alarm,'시각 알림','alarm-clock')}
      ${d.alarm?d.ats.map((t,i)=>`<div class="prow"><div class="pl2">${d.times>1?`${i+1}번째`:'시각'}</div>${tpick('srAt'+i,t)}</div>`).join('')+`<div class="hint" style="margin:0;padding:8px 16px">${stAlarmHint(d)}</div>`:''}</div>
    ${om?`<div class="pg-sec">${npRow('image','다른 그림으로','<div class="pv">›</div>',{tap:1,act:'mstk-swap',attrs:` data-id="${esc(d.id)}"`})}${npRow('calendar-off','그만하기','',{tap:1,act:'mstk-end',attrs:` data-id="${esc(d.id)}"`})}${npRow('trash-2','지우기','',{tap:1,cls:'danger-row',act:'mstk-del',attrs:` data-id="${esc(d.id)}"`})}</div>`:''}
    <div class="npbtn"><button class="btn" data-act="sr-save">${d.edit?'저장':'붙이기'}</button>
</div>
    </div>`,'stampadd');
}
// 등록 화면 뒤로: ＋ 로 왔으면 큰 목록으로, 빈 칸 채우기로 왔으면 기본 스티커 고르기로 한 단계씩 돌아감
function srBack(){
  const d=stDraft,b=d&&d.back;stDraft=null;
  if(d&&d.own){manStampBack(d);return;}
  if(b==='stamps'){render();openStampPage();return;}
  closePage();
  if(!d)return;
  if(b==='day'){stampReopen(d.k);return;}
  if(d.ret==='plus'){
    if(d.newDef){S.stamps.defs=S.stamps.defs.filter(y=>!(y.id===d.newDef&&!(y.dates||[]).length));save();}
    openStampPlus(d.k);
  }else if(d.ret==='fill')openStampPick(d.k);
}
// 반복 규칙 · 기간을 고칠 때: 고른 날(k) 이전은 고치기 전에 깔려 있던 그대로 두고 (빠지는 날은 날짜로 박고 · 새로 생기는 날은 건너뛴 날로), 새 규칙은 그 날부터 적용
function stKeepPast(old,s,k){
  const cap=addK(k,-800),f=[old.from,s.from].filter(Boolean).sort()[0],lo=f&&f>cap?f:cap;
  for(let x=lo;x<k;x=addK(x,1)){
    const was=stampPlanned(old,x),now=stampPlanned(s,x);
    if(was&&!now)(s.dates=s.dates||[]).push(x);
    else if(!was&&now)(s.skip=s.skip||[]).push(x);
  }
}
/* ---- v0.114 학원 · 취미 · 동아리 (스티커 활동): 활동 시간 · 위치 → 날씨 · 근무 겹치면 빠짐 · 끝나면 자동 완료 ---- */
// 접는 칸 (내 스티커 편집 = sr · 가족 스티커 편집 = ms). days: 가족 스티커는 요일도 여기서
function actFoldHtml(a,_o,pre){   // v0.120 제목 줄이 스위치: 켜면 펼쳐지고 바로 적용 (보이는 시간 그대로) · 끄면 접히고 안 씀
  const on=!!(a&&a.s&&a.e);
  const head=`<div class="prow actf-h"><span class="npi">${npi('map-pin')}</span><div class="pl2">학원 · 취미 · 동아리<small>${on?`✅ ${t12(a.s,true)} ~ ${t12(a.e,true)} · ${a.r?'📍 '+esc(wxName(a.r)):'🏠 집'}`:'안 씀 · 켜면 활동 시간 · 위치'}</small></div><label class="sw"><input type="checkbox" id="${pre}ActOn" ${on?'checked':''}><i></i></label></div>`;
  if(!on)return `<div class="pg-sec actf" style="margin-top:12px">${head}</div>`;
  return `<div class="pg-sec actf" style="margin-top:12px">${head}
    <div class="prow"><div class="pl2">활동 시간</div>${tpick(pre+'AS',a.s)}<span class="tsep">~</span>${tpick(pre+'AE',a.e)}</div>
    ${wxOn()?`<div class="prow tap" data-act="${pre}-actr"><div class="pl2">위치<small>날씨를 볼 곳</small></div><div class="pv">${a.r?'📍 '+esc(wxName(a.r)):'🏠 집과 같음'} ›</div></div>`:''}
    <div class="hint" style="margin:0;padding:8px 16px">끝 시간이 지나면 자동으로 완료 (안 간 날은 눌러서 풀기) · ${stDraft&&stDraft.own?'유치원 · 학교':'근무'} 시간과 겹치는 날은 빠져요${wxOn()?' · 갈 때 · 올 때 비 · 눈이면 알려줘요':''}</div></div>`;
}
// 활동 시각 (그날 ms) · 끝이 시작보다 이르면 다음날
function actSpan(a,d){if(!a||!a.s||!a.e)return null;const b=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(),s=b+tm2m(a.s)*6e4;let e=b+tm2m(a.e)*6e4;if(e<=s)e+=864e5;return {s,e};}
// 근무(또는 학교) 시간과 겹치는지: 그날 근무 + 어젯밤부터 이어지는 야간
function actClashWin(a,d,winOf){const x=actSpan(a,d);if(!x)return false;for(const dd of [d,addDays(d,-1)]){const w=winOf(dd);if(w&&x.s<w.e&&x.e>w.s)return true;}return false;}
const actClash=(a,k)=>actClashWin(a,parse(k),d=>wxMyWin(d));
// 가족: 교대 = 그 근무 시간 · 학생 / 회사 = 등교~하교 / 출근~퇴근 (쉬는 날 빼고)
function famWinOf(m){return d=>{if(m.kind==='shift'||m.kind==='sched')return wxMemWin(m,d);if(m.kind==='free'||memberOff(m,d))return null;const t=famTimes(m,d);return t?wxSpan(d,t.s,t.e):null;};}
// 가족 스티커가 그날 깔리는지 (활동 요일 · 겹침 빼기 · 이 날 빼기)
function manPlanned(m,x,k){return manStampPlanned(m,x,k);}
// 끝 시간이 지나면 자동 완료 (한 번만 · 그 뒤에 풀면 그대로 둠). 활동을 정한 날(since)부터 · 최근 35일만
function actAuto(){
  try{
    const now=Date.now(),today=new Date(),tk=fmt(today);let ch=false;
    const days=since=>{const out=[];for(let i=35;i>=0;i--){const k=fmt(addDays(today,-i));if(k>=(since||tk))out.push(k);}return out;};
    const st=S.stamps,ad=st.actDone=isObj(st.actDone)?st.actDone:{};
    (st.defs||[]).forEach(s=>{if(!s.act||s.retired||s.kind!=='mark')return;days(s.act.since).forEach(k=>{
      if((ad[k]||[]).includes(s.id)||!stampPlanned(s,k))return;const x=actSpan(s.act,parse(k));if(!x||now<x.e)return;
      (ad[k]=ad[k]||[]).push(s.id);const lg=st.log[k]=st.log[k]||{};if(!lg[s.id])lg[s.id]=stDayN(s,k);ch=true;});});
    (S.family||[]).forEach(m=>{if(m.kind==='sched'||!Array.isArray(m.sdefs))return;const md=m.actDone=isObj(m.actDone)?m.actDone:{};
      m.sdefs.forEach(x=>{if(!x.act)return;days(x.act.since).forEach(k=>{
        if((md[k]||[]).includes(x.id)||!manPlanned(m,x,k))return;const sp=actSpan(x.act,parse(k));if(!sp||now<sp.e)return;
        (md[k]=md[k]||[]).push(x.id);m.stk=m.stk||{};const a=m.stk[k]||[];if(!a.includes(x.id))m.stk[k]=[...a,x.id];ch=true;});});
      Object.keys(md).forEach(k=>{if(k<fmt(addDays(today,-40)))delete md[k];});});
    Object.keys(ad).forEach(k=>{if(k<fmt(addDays(today,-40)))delete ad[k];});
    if(ch)save();
  }catch(e){}
}
// 활동 위치 고르기: 날씨 지역 고르기를 그대로 씀 (wxPickFor = 'a:') · 집과 가까우면 같게 할지 물어봄
let actPickCb=null,actPickTitle='';
function actPickRegion(cb,title){actPickCb=cb;actPickTitle=title||'';wxPickSido('a:');}
function actRegionDone(code){
  const cb=actPickCb;actPickCb=null;if(!cb)return;
  if(code&&wxOk(S.wx.home)&&wxNear(S.wx.home,code)&&code!==S.wx.home){
    actPickCb=cb;openPop(`<div class="mh">${actPickTitle||'📍 활동 위치'}<b>집과 가까워요. 같은 지역으로 볼까요?</b></div>
      <button class="mi" data-act="act-near" data-v="" style="justify-content:center;font-weight:800;color:var(--accent)">집과 같게</button>
      <button class="mi" data-act="act-near" data-v="${code}" style="justify-content:center">따로 볼래요</button>`);return;}
  closePop();cb(code);
}
function stampRegSave(){
  srPull();const d=stDraft;if(!d)return;
  if(d.own){manStampSave();return;}
  let s=S.stamps.defs.find(x=>x.id===d.id);
  const isNewDef=!s;
  const keep=false;   // v0.176 ＋ · "이 날만 따로" 복사본 없앰: 스티커는 하나 — 이날 붙이면 그 스티커에 날짜를 더하고, 등록 화면에서 바꾼 값(지금 값으로 시작)은 그 스티커에 그대로
  if(s&&!d.edit&&d.rep==='once'){
    if(s.kind==='pill'&&d.color&&d.color!==s.color&&(stampPlanned(s,d.k)||stUsedElse(s,d.k))){   // 색이 다른 약 = 다른 약 → 빈 칸에 새 약으로
      const e=slotDefs().find(x=>x.empty);if(!e){toast('빈 칸이 없어요 · 설정 › 스티커에서 칸 하나를 비워 주세요');return;}
      delete e.empty;Object.assign(e,{kind:'pill',emoji:'💊',name:(d.name&&d.name!==s.name?d.name:(s.name||'약')+' 2').slice(0,12),color:d.color,shape:s.shape||'caps',times:s.times||1,rep:'none',from:'',to:'',days:[],dates:[],skip:[],ats:[]});s=e;
    }else if(stampPlanned(s,d.k)){toast('이 스티커는 이 날에 이미 붙어 있어요');return;}
  }
  if(d.rep==='work'&&!d.wtypes.length){toast('근무를 하나 이상 골라 주세요');return;}
  const snap=JSON.stringify(S.stamps);   // 한도 때문에 가려지면 "등록 취소"로 돌아가기 위한 사본
  if(!s){
    s=d.kind==='pill'?{id:uid(),kind:'pill',emoji:'💊',name:'약',times:1,color:STK_COL[0],rep:'none',from:'',to:'',days:[],dates:[],skip:[],ats:[]}
      :{id:uid(),kind:'mark',emoji:d.emoji||'🏃',name:'새 스티커',times:1,rep:'none',from:'',to:'',days:[],dates:[],skip:[],ats:[]};
    track(d.kind==='pill'?'sticker_pill':'sticker_mark');if(d.kind==='pill')S.stamps.defs.unshift(s);else S.stamps.defs.push(s);
  }
  const dayOnly=!isNewDef&&!d.edit&&d.rep==='once'&&stUsedElse(s,d.k);   // v0.188 이미 쓰는 스티커를 이날 붙임 → 횟수는 그 날만 (s.tday) · 스티커 횟수는 그대로
  if(!keep){
  if(d.name)s.name=d.name;else if(!s.name)s.name=d.kind==='pill'?'약':'새 스티커';
  if(dayOnly){s.tday=s.tday||{};if(d.times!==stN(s))s.tday[d.k]=d.times;else delete s.tday[d.k];if(!Object.keys(s.tday).length)delete s.tday;}else{s.times=d.times;if(s.tday)delete s.tday[d.k];}
  if(stFamShow())s.fam=!!d.fam;   // 실제 가족이 있어 칸이 보였을 때만 바꿈 (아니면 기본 규칙 그대로)
  if(s.kind==='pill')s.color=d.color||s.color||STK_COL[0];else s.emoji=d.emoji||s.emoji||'🏃';
  if(d.act&&d.act.s&&d.act.e&&s.kind==='mark'){s.act={s:d.act.s,e:d.act.e,r:wxOk(d.act.r)?d.act.r:'',since:(s.act&&s.act.since)||fmt(new Date())};if(s.act.r)S.stamps.lastActR=s.act.r;}else delete s.act;
  if(d.alarm){stFill(d);s.ats=d.ats.slice(0,dayOnly?Math.max(d.times,stN(s)):d.times);s.ats.forEach((t,i)=>{(S.stamps.lastAt=S.stamps.lastAt||[])[i]=t;});}else s.ats=[];   // 마지막에 정한 시각은 다음 새 스티커의 처음 값
  }
  const k=d.k;
  if(d.rep==='once'){
    const shown=stampsOn(k).map(x=>x.s.id);
    if(!shown.includes(s.id)&&shown.length>=stampMax()){stampFull();return;}
    s.skip=(s.skip||[]).filter(x=>x!==k);
    if(!stampPlanned(s,k))(s.dates=s.dates||[]).push(k);
  }else{
    const old=d.edit?JSON.parse(JSON.stringify(s)):null;
    Object.assign(s,{rep:d.rep,days:d.days.slice(),workMode:d.workMode,wtypes:d.rep==='work'?d.wtypes.slice(0,30):[],from:d.from||'',to:d.to||'',noHol:d.noHol,noWknd:d.noWknd&&['daily','work','month'].includes(d.rep),noNight:d.noNight});
    if(old&&d.from===(old.from||d.k))s.from=old.from||'';   // 시작일을 안 건드렸으면 그대로 (고르는 칸에 보이는 기본값 = 그 날)
    if(d.rep==='month')s.mday=parse(d.from||d.k).getDate();
    if(s.to&&s.from&&s.from>s.to)[s.from,s.to]=[s.to,s.from];
    if(old)stKeepPast(old,s,d.k);
  }
  const back=d.back;stDraft=null;save();if(back==='stamps'){render();openStampPage();}else{closePage();if(back==='day')stampReopen(k);}
  const ic=s.kind==='pill'?'💊':icoTxt(s.emoji,'✔');
  if(d.rep!=='once'){const c=stClashScan(s,d.edit?k:(s.from||k),s.to);if(c.dup.length||c.hid.length||c.mv.length){stClashAsk(s,c,snap);return;}}   // v0.136 같은 그림 겹침 · 4개 넘음 → 버튼 3개
  toast(d.edit?`${ic} ${s.name} 고쳤어요 · ${stampRule(s)}`:d.rep==='once'?`${ic} ${s.name} 이날 등록했어요${s.ats&&s.ats.length?' · 시각에 알림이 울려요':''}`:`${ic} ${s.name} · ${stampRule(s)}`);
}
// 반복 스티커가 깔리는 날 중 하루 한도(2개 · 설정 4개) 때문에 가려지는 날 수 (앞으로 200일 안)
function stampHidden(s,from,to){
  let n=0,first='',names='',mv=0,mvFirst='',mvNames='';
  for(let i=0;i<=200;i++){
    const k=addK(from,i);if(to&&k>to)break;
    if(!stampPlanned(s,k))continue;
    const on=stampsOn(k);
    if(!on.some(x=>x.s.id===s.id)){n++;if(!first){first=k;names=on.map(x=>x.s.name).join(' · ');}}
    else{   // 새 스티커는 보이는데 앞선 칸이라 기존 스티커가 밀려나는 날
      const lost=stampsOn(k,s.id).filter(x=>!on.some(y=>y.s.id===x.s.id));
      if(lost.length){mv++;if(!mvFirst){mvFirst=k;mvNames=lost.map(x=>x.s.name).join(' · ');}}
    }
  }
  return {n,first,names,mv,mvFirst,mvNames};
}
let hidSnap=null;
// v0.136 반복 스티커 저장 때: 같은 그림 스티커가 이미 있는 날(dup) · 4개가 넘어 새 것이 가려지는 날(hid) · 새 것 때문에 다른 것이 밀리는 날(mv)
const stPic=x=>x.kind==='pill'?'p:'+(x.shape||'caps'):'m:'+x.emoji;
function stClashScan(s,from,to){
  const dup=[],hid=[],mv=[],same=S.stamps.defs.filter(x=>x.id!==s.id&&!x.retired&&!x.empty&&stPic(x)===stPic(s));
  for(let i=0;i<=200;i++){
    const k=addK(from,i);if(to&&k>to)break;if(!stampPlanned(s,k))continue;
    const o=same.filter(x=>stampPlanned(x,k)||stampCnt(k,x.id)>0);if(o.length){dup.push({k,ids:o.map(x=>x.id)});continue;}
    const on=stampsOn(k);
    if(!on.some(x=>x.s.id===s.id))hid.push({k,last:on.length?on[on.length-1].s.id:''});
    else{const lost=stampsOn(k,s.id).filter(x=>!on.some(y=>y.s.id===x.s.id));if(lost.length)mv.push({k,ids:lost.map(x=>x.s.id)});}
  }
  return {dup,hid,mv};
}
let clashCtx=null;
function stClashAsk(s,c,snap){
  hidSnap=snap;clashCtx={id:s.id,...c};
  const nm=id=>{const x=S.stamps.defs.find(y=>y.id===id);return x?`${x.kind==='pill'?'💊':icoTxt(x.emoji,'')}${x.name}`:'';};
  const days=L=>`${md(L[0].k)}${L.length>1?` 외 ${L.length-1}일`:''}`;
  const lines=[];
  if(c.dup.length){const w=nm(c.dup[0].ids[0]);lines.push(`${days(c.dup)}에 ${esc(w)}${josa(w,'이','가')} 이미 있어요`);}
  if(c.hid.length||c.mv.length)lines.push(`${days(c.hid.length?c.hid:c.mv)}부터 스티커가 ${stampMax()}개를 넘어요`);
  const lose=[...new Set([...c.hid.map(x=>x.last),...c.mv.flatMap(x=>x.ids)].filter(Boolean))].slice(0,3).map(nm).join(' · ');
  const dw=c.dup.length?nm(c.dup[0].ids[0]):'';const showSub=[dw?`그 날 있던 ${esc(dw)}${josa(dw,'은','는')} 빼고 체크는 옮겨요`:'',lose?`${esc(lose)}${josa(lose,'이','가')} 가려져요`:''].filter(Boolean).join(' · ');
  openPop(`<div class="mh">${s.kind==='pill'?'💊':esc(icoTxt(s.emoji,''))} ${esc(s.name)}<b>${lines.join('<br>')}</b></div>
    <button class="mi clb" data-act="clash-show"><b>지금 만든 스티커만 보이기</b><small>${showSub}</small></button>
    <button class="mi clb" data-act="clash-skip"><b>겹친 날은 건너뛰기</b><small>먼저 있던 스티커는 그대로 · 새 ${esc(s.name)}만 그 날 빠져요</small></button>
    <button class="mi" data-act="sh-undo" style="justify-content:center;color:var(--muted)">취소</button>`);
}
function stClashDo(how){
  const c=clashCtx;clashCtx=null;closePop();hidSnap=null;if(!c)return;
  const s=S.stamps.defs.find(x=>x.id===c.id);if(!s)return;
  const lg=k=>S.stamps.log[k]||(S.stamps.log[k]={});
  const offDay=(x,k)=>{if((x.dates||[]).includes(k))x.dates=x.dates.filter(y=>y!==k);if(stampPlanned(x,k))(x.skip=x.skip||[]).push(k);};
  if(how==='skip'){[...c.dup,...c.hid,...c.mv].forEach(({k})=>offDay(s,k));save();render();toast(`겹친 날은 새 ${s.name}${josa(s.name,'을','를')} 건너뛰어요`);return;}
  c.dup.forEach(({k,ids})=>ids.forEach(id=>{const x=S.stamps.defs.find(y=>y.id===id);if(!x)return;const L=lg(k),n=L[id]||0;if(n){L[s.id]=Math.min(stN(s),Math.max(L[s.id]||0,n));delete L[id];}offDay(x,k);}));
  c.hid.forEach(({k,last})=>{const x=S.stamps.defs.find(y=>y.id===last);if(x&&!stampCnt(k,x.id))offDay(x,k);});
  Object.keys(S.stamps.log).forEach(k=>{if(!Object.keys(S.stamps.log[k]).length)delete S.stamps.log[k];});
  save();render();toast(`${s.name}${josa(s.name,'이','가')} 보여요 · 체크는 그대로`);
}
function stampHiddenAsk(s,h,snap){
  hidSnap=snap;
  const m1=h.n?`${md(h.first)}부터는 <b>${esc(h.names)}</b>이(가) 먼저 보여서 ${esc(s.name)} 은(는) 안 보이고, 그 날 알림도 안 와요.`:'',m2=h.mv?`${md(h.mvFirst)}부터 <b>${esc(h.mvNames)}</b>이(가) 밀려서 안 보이고, 그 날 알림도 안 와요 (설정에서 순서를 바꿀 수 있어요).`:'';
  openPop(`<div class="mh">스티커가 많아서 가려져요<b>${esc(s.name)} · ${h.n+h.mv}일</b></div>
    <div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0">하루 ${stampMax()}개까지만 보여요. ${m1}${m1&&m2?'<br>':''}${m2}</div></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="sh-undo">등록 취소</button><button class="btn grow" data-act="pop-close">그래도 등록</button></div>`);
}

const stampCnt=(k,id)=>((S.stamps.log[k]||{})[id])||0;
// 그 날짜에 보일 스티커 (반복으로 깔린 것은 흐리게, 기록은 찍은 것), 하루 4개까지 (설정에 앞선 칸이 먼저). skipId = 그 스티커가 없다고 치고 계산
function stampsOn(k,skipId){
  const out=[];
  S.stamps.defs.forEach(s=>{
    if(s.id===skipId||s.empty)return;
    const V=stView(s,k),n=Math.min(V.N,stampCnt(k,s.id));
    if(n||(!s.retired&&stampPlanned(s,k)))out.push({s,n,v:V,k});
  });
  return out.slice(0,stampMax());
}
// 활동 스티커: 덜 한 것(1/2 · 1/3 · 2/3)만 작은 숫자 배지, 다 하면 스티커만 진하게 (약은 알약 조각으로 보이니 배지 없음)
const stampIcon=(x,px)=>{
  const s=x.s,V=x.v||stView(s,null),N=V.N,n=Math.min(x.n,N),sid=` data-sid="${s.id}"`;
  const ic=s.kind==='pill'?pillSvg(N,n,px||14,V.col,V.shape):`<span class="se ${n?'':'plan'}"${px?` style="font-size:${px-2}px"`:''}>${ico(s.emoji)}</span>`;
  if(s.kind!=='pill'&&N>1&&n>0&&n<N)return `<span class="sx"${sid}>${ic}<i class="cb">${n}/${N}</i></span>`;
  return ic.replace(/^<(svg|span)/,`<$1${sid}`);
};
// 방금 붙인 스티커가 종이에 붙듯 "톡" (애니메이션 줄이기를 켠 폰에서는 효과 · 진동 모두 없음)
function stkPop(k,id){
  if(reduceMotion())return;
  buzz(8);
  const el=document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"] [data-sid="${id}"]`);
  if(!el)return;
  el.classList.remove('tok');void el.getBoundingClientRect();el.classList.add('tok');
  setTimeout(()=>el.classList.remove('tok'),420);
}
// 날짜 화면 맨 위 스티커 줄
function stampRow(k){
  const shown=stampsOn(k),used=shown.length,ids=shown.map(x=>x.s.id);
  const btns=S.stamps.defs.filter(s=>s.kind==='mark'||pillActive(s,k)).map(s=>{
    const n=stampCnt(k,s.id),on=ids.includes(s.id),dis=!on&&used>=stampMax();
    const plan=markPlanned(s,k);
    const sub=stDayN(s,k)>1?`${n}/${stDayN(s,k)}`:n?'✓ 완료':plan?'오늘 할 일':'';
    return `<button class="sbtn ${on&&(s.kind==='mark'||n)?'on':''} ${dis?'dis':''}" data-act="stamp-tap" data-id="${s.id}" data-k="${k}">
      <span class="ic ${s.kind==='mark'&&!n&&plan?'plan':''}">${s.kind==='pill'?pillSvg(stN(s),n,26,s.color,s.shape):ico(s.emoji)}</span>${esc(s.name)}<small>${sub}</small></button>`;
  }).join('');
  return `<div class="sec stamps"><div class="sec-t" style="display:flex;justify-content:space-between">스티커 <small style="font-weight:600;color:var(--muted)">(하루 ${stampMax()}개까지)</small><a data-act="more-stamps" style="margin-left:auto;color:var(--fam);font-weight:700;font-size:13px">스티커 관리 ›</a></div><div class="srow">${btns}</div></div>`;
}
function stampTap(id,k){
  const s=S.stamps.defs.find(x=>x.id===id);if(!s)return;
  const lg=S.stamps.log[k]||(S.stamps.log[k]={}),n=lg[id]||0;
  const shown=stampsOn(k).map(x=>x.s.id);
  if(!shown.includes(id)&&shown.length>=stampMax()){stampFull();return;}
  const Nn=stView(s,k).N;lg[id]=n>=Nn?0:n+1;if(s.kind==='pill'&&lg[id]===Nn)toast(`💊 ${s.name} 오늘 다 먹었어요`);
  const grew=(lg[id]||0)>n;
  stampSet(id,k,lg[id]||0);
  save();render();openDay(k);if(grew)stkPop(k,id);
}
/* ---- 스티커판: 한 달에 모은 스티커를 한 판에서 ---- */
let sbY=0,sbM=0;
const stkDone=(s,k)=>stampCnt(k,s.id)>=stDayN(s,k);
const stkPlan=(s,k)=>stampCnt(k,s.id)>0||(s.kind==='pill'?pillActive(s,k):markPlanned(s,k));
function stkMonth(y,m){const days=new Date(y,m+1,0).getDate();let tot=0;S.stamps.defs.forEach(s=>{for(let d=1;d<=days;d++)if(stkDone(s,fmt(new Date(y,m,d))))tot++;});return tot;}
function stkStreak(s,from){let d=new Date(from.getFullYear(),from.getMonth(),from.getDate()),n=0;if(!stkDone(s,fmt(d)))d=addDays(d,-1);while(stkDone(s,fmt(d))&&n<400){n++;d=addDays(d,-1);}return n;}
function stkBest(s,y,m){let b=0,c=0;const days=new Date(y,m+1,0).getDate();for(let d=1;d<=days;d++){if(stkDone(s,fmt(new Date(y,m,d)))){c++;b=Math.max(b,c);}else c=0;}return b;}
/* ---- 설정 › 스티커 ---- */
// v0.221 내 것(사진 · 직접 넣은 이모티콘): 눌러 지우기 · 꾹 눌러 끌어 순서 (같은 종류끼리) · 없으면 안 보임
function mineGrid(){
  const ph=Object.keys(S.icons||{}).reverse(),em=Array.isArray(S.myEmo)?S.myEmo:[];if(!ph.length&&!em.length)return '';
  const L=ph.map(id=>({k:'p:'+id,h:`<button data-act="mine-open" data-t="p" data-id="${esc(id)}" data-key="${esc('p:'+id)}"><span class="si"><img class="myph" src="${S.icons[id]}" alt="" draggable="false"></span><small>사진</small></button>`}))
    .concat(em.map((x,i)=>({k:'e:'+x.e,h:`<button data-act="mine-open" data-t="e" data-i="${i}" data-key="${esc('e:'+x.e)}"><span class="si">${esc(x.e)}</span><small>${esc(x.n||'')}</small></button>`})));
  const ord=Array.isArray(S.mineOrd)?S.mineOrd:[],at=k=>{const i=ord.indexOf(k);return i<0?1e4:i;};
  L.forEach((x,i)=>x.i=i);L.sort((a,b)=>at(a.k)-at(b.k)||a.i-b.i);
  return `<div class="pg-cap">내 것 <span class="cnt2">${L.length}</span></div>
      <div class="pg-sec sgrid sg5 stgrid mygrid" style="padding:12px">${L.map(x=>x.h).join('')}</div>`;
}
function openMineMenu(t,key){
  const ph=t==='p',x=ph?(S.icons||{})[key]:(S.myEmo||[])[+key];if(!x)return;
  openPop(`<div class="mh">내 것<b>${ph?`<img class="myph lg" src="${x}" alt="">`:`${esc(x.e)} ${esc(x.n||'')}`}</b></div>
    <button class="mi" data-act="mine-del" data-t="${t}" data-k="${esc(String(key))}" style="justify-content:center;color:var(--danger);font-weight:700">지우기</button>
    <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);
}
function mineDel(t,key){
  if(t==='p'){if(!S.icons||!S.icons[key])return;const used=JSON.stringify(Object.assign({},S,{icons:null})).includes('"@'+key+'"');if(used&&!confirm('지금 쓰고 있는 사진이에요. 지울까요?\n(쓰던 곳은 기본 모양으로 바뀌어요)'))return;delete S.icons[key];}
  else{if(!Array.isArray(S.myEmo)||!S.myEmo[+key])return;S.myEmo.splice(+key,1);}
  save();closePop();render();openStampPage();toast('지웠어요');
}
function openStampPage(){
  const btn=s=>`<button class="${s.empty?'emp':''}" data-act="slot-open" data-id="${s.id}"><span class="si">${stIcon(s)}</span><small>${s.empty?'비어 있음':esc(s.name)}</small></button>`;   // v0.176 🔔 뺌 · ＋ 로 붙인 스티커 칸 뺌 (＋ 기능 없앰 · 내 스티커 하나로)
  openPage(`${pageHead('스티커')}
    <div class="pg-b np">
      <div class="pg-cap">내 스티커 <span class="cnt2">${slotDefs().filter(x=>!x.empty).length}</span></div>
      <div class="pg-sec sgrid sg5 stgrid" data-grp="slot" style="padding:12px">${slotDefs().map(btn).join('')}</div>
      ${mineGrid()}
      ${hasBridge('openSettings')?`<div class="pg-cap">알림</div><div class="pg-sec">${npRow('bell','알림 소리 바꾸기',npVal(''),{tap:1,act:'remind-sound'})}</div>`:''}
    </div>`,'stamps');
}


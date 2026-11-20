/* 자동으로 만든 파일 — 고칠 때는 app/js-src/ 조각을 고치고 node scripts/build-js.mjs 로 다시 만들어요 (APK 빌드 전에 같은지 확인함) */
(()=>{
'use strict';

/* ================= 기본 도구 ================= */
//#HELPERS_START
const $=(s,r=document)=>r.querySelector(s);
const pad=n=>String(n).padStart(2,'0');
const fmt=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const addK=(k,n)=>fmt(addDays(parse(k),n));
const isWknd=k=>{const w=parse(k).getDay();return w===0||w===6;};
const dayNum=d=>Math.round(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const DOW=['일','월','화','수','목','금','토'];
/* ---- 받은 값 검사 ----
 * 가족이 서버에 올린 값 · 백업 파일 · 깨진 저장 값은 그대로 믿지 않고, 모양이 맞는 것만 씀 (화면에 그리기 전에 한 번 걸러냄) */
const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const okDate=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v);
const okTime=v=>typeof v==='string'&&/^\d{1,2}:\d\d$/.test(v);
const okId=v=>typeof v==='string'&&/^[A-Za-z0-9_.:\-]{1,100}$/.test(v);
const okHex=v=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v);
const okImg=v=>typeof v==='string'&&v.length<=300000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(v);
const FAM_IMG=/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]{1,6000}$/;
const cutTxt=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,n);   // 한 줄 글 (이름 등)
const cutMulti=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').slice(0,n);   // 줄바꿈이 있는 글 (메모 등)
const safeColor=(c,fb)=>(c===''||c==='v:day'||c==='v:night'||okHex(c))?c:(fb===undefined?'':fb);
const REQ_STS=['pending','accepted','rejected','applied','cancelled'];
function famCleanStkDef(d){   // 가족이 올린 스티커 종류 한 개 (자리 번호가 어긋나지 않게 못 쓰는 것은 null)
  if(!isObj(d))return null;
  const i=cutTxt(d.i,20);
  if(d.k==='p')return {i,k:'p',t:Math.max(1,Math.min(3,Math.round(+d.t)||1)),c:/^#[0-9a-fA-F]{3,8}$/.test(d.c||'')?d.c:'#7e57c2',h:['r','t','d','c'].includes(d.h)?d.h:'c'};
  const o={i,k:'m',e:cutTxt(d.e,8)||'⭐'};
  if(typeof d.img==='string'&&FAM_IMG.test(d.img))o.img=d.img;
  return o;
}
function famCleanSched(v){   // 가족 근무표 한 건 → 모양이 맞는 것만 남긴 새 객체 (근무표로 못 쓰면 null)
  if(!isObj(v)||!okDate(v.anchor))return null;
  const pat=(Array.isArray(v.pattern)?v.pattern:[]).slice(0,60).map(x=>cutTxt(x,6));
  const o={v:1,patternName:cutTxt(v.patternName,20),teamName:cutTxt(v.teamName,10),pattern:pat.length?pat:[''],anchor:v.anchor,types:[],overrides:{},holRest:!!v.holRest,updatedAt:+v.updatedAt||0};
  (Array.isArray(v.types)?v.types:[]).slice(0,24).forEach(t=>{if(isObj(t)&&typeof t.k==='string'&&t.k&&t.k.length<=6)o.types.push({k:cutTxt(t.k,6),name:cutTxt(t.name||t.k,12),color:safeColor(t.color,''),rest:!!t.rest});});
  if(isObj(v.overrides)){let n=0;for(const k of Object.keys(v.overrides)){const x=v.overrides[k];if(okDate(k)&&typeof x==='string'&&x.length<=6&&n++<520)o.overrides[k]=x;}}
  if(isObj(v.wx)&&typeof v.wx.w==='string'&&/^\d{5}(\d{5})?$/.test(v.wx.w)){   // 출퇴근 날씨: 직장 지역 + 근무별 출퇴근 시각
    o.wx={w:v.wx.w,tm:{},...(typeof v.wx.h==='string'&&/^\d{5}(\d{5})?$/.test(v.wx.h)?{h:v.wx.h}:{})};
    if(isObj(v.wx.tm))Object.keys(v.wx.tm).slice(0,24).forEach(k=>{const t=v.wx.tm[k];if(k.length<=6&&Array.isArray(t)&&okTime(t[0])&&okTime(t[1]))o.wx.tm[k]=[t[0],t[1]];});
  }
  if(isObj(v.tm)){const tm={};Object.keys(v.tm).slice(0,24).forEach(k=>{const t=v.tm[k];if(k.length<=6&&Array.isArray(t)&&okTime(t[0])&&okTime(t[1]))tm[k]=[t[0],t[1]];});o.tm=tm;}   // 근무 종류별 출퇴근 시각
  if(isObj(v.ot)){const ot={};Object.keys(v.ot).slice(0,80).forEach(k=>{const t=v.ot[k];if(okDate(k)&&Array.isArray(t)&&okTime(t[0])&&okTime(t[1]))ot[k]=[t[0],t[1]];});o.ot=ot;}   // 날짜별 실제 시각 (연장)
  if(isObj(v.stk)){
    o.stk={};let n=0;
    for(const k of Object.keys(v.stk)){const x=v.stk[k];if(okDate(k)&&typeof x==='string'&&/^[0-9a-z]{0,120}$/.test(x)&&n++<420)o.stk[k]=x;}
    o.sdefs=(Array.isArray(v.sdefs)?v.sdefs:[]).slice(0,60).map(famCleanStkDef);o.sv=v.sv===2?2:1;
  }
  return o;
}
function famCleanMember(m,id){
  const uid=okId(id)?id:(isObj(m)&&okId(m.uid)?m.uid:'');
  if(!isObj(m)||!uid)return null;
  return {uid,role:m.role==='host'?'host':'guest',name:cutTxt(m.name,12)||'가족',mode:m.mode==='view'?'view':'own'};
}
function famCleanMemo(v,t){
  if(!isObj(v)||!okDate(v.date)||!okId(v.by))return null;
  return {by:v.by,byName:cutTxt(v.byName,12)||'가족',date:v.date,text:cutMulti(v.text,200),to:Array.isArray(v.to)?v.to.filter(okId).slice(0,12):null,
    rev:Math.max(0,Math.min(1e6,Math.round(+v.rev)||0)),time:/^\d\d:\d\d$/.test(v.time||'')?v.time:'',al:(v.al==='0'||v.al==='10')?v.al:'',t:+t||+v.t||Date.now(),...(v.moved===true?{moved:true}:{}),...(v.todo===true?{todo:true,done:v.done===true}:{}),...(okDate(v.till)&&v.till>v.date?{till:v.till,...(/^#[0-9a-f]{6}$/i.test(v.pc||'')?{pc:v.pc}:{})}:{})};
}
function famCleanReq(v,t,u){
  if(!isObj(v)||!okDate(v.date))return null;
  return {from:okId(v.from)?v.from:'',to:okId(v.to)?v.to:'',fromName:cutTxt(v.fromName,12)||'가족',toName:cutTxt(v.toName,12)||'가족',date:v.date,want:cutTxt(v.want,4),msg:cutMulti(v.msg,60),
    st:REQ_STS.includes(v.st)?v.st:'pending',reply:cutMulti(v.reply,100),held:!!v.held,mode:(v.mode==='keep'||v.mode==='change')?v.mode:'',prev:cutTxt(v.prev,4),
    grp:okId(v.grp)?v.grp:'',gn:Math.max(1,Math.min(14,Math.round(+v.gn)||1)),lead:!!v.lead,t:+t||+v.t||Date.now(),u:+u||+v.u||0};
}
function famCleanCc(v){
  if(!isObj(v)||!okDate(v.date))return null;
  return {fromName:cutTxt(v.fromName,12)||'가족',toName:cutTxt(v.toName,12)||'가족',date:v.date,want:cutTxt(v.want,4),grp:okId(v.grp)?v.grp:'',lead:!!v.lead};
}
function wlogClean(w){   // 업무 일지 (앱을 켤 때 normalize 가 부름 → 위쪽에 선언된 것만 씀)
  w=isObj(w)?w:{};
  const ids=['a','b','c','d'],def={a:'인수',b:'인계',c:'지시',d:'특이'},sv=Array.isArray(w.secs)?w.secs:[];
  const secs=ids.map(id=>{const x=sv.find(y=>isObj(y)&&y.id===id)||{};return {id,n:cutTxt(x.n,8).trim()||def[id],h:!!x.h};});
  if(secs.every(x=>x.h))secs.forEach(x=>{x.h=false;});
  const o={name:cutTxt(w.name,12).trim(),secs,backup:!!w.backup,seen:!!w.seen,days:{}};
  if(isObj(w.days))Object.keys(w.days).slice(-4000).forEach(k=>{const d=w.days[k];if(!okDate(k)||!isObj(d))return;const day={};
    ids.forEach(id=>{let v=d[id];
      if(Array.isArray(v))v=v.filter(x=>isObj(x)&&typeof x.t==='string'&&x.t.trim()).map(x=>x.t).join('\n');   // v0.93 줄 목록 → 메모장 글 (줄바꿈으로 이어 붙임)
      if(typeof v!=='string')return;v=cutMulti(v,4000).replace(/\s+$/,'');if(v.trim())day[id]=v;});
    if(Object.keys(day).length)o.days[k]=day;});
  return o;
}
function famCleanFam2(f){   // 폰에 저장해 둔 가족 복사본 (옛 버전이 걸러내지 않고 저장한 것도 여기서 한 번 더 걸러냄)
  f=isObj(f)?f:{};
  const out={scheds:{},members:[],memos:{},reqIn:{},reqOut:{},memoRev:{},reqCc:{},me:{sent:0,bonus:0},seenMemo:[],init:!!f.init};
  if(isObj(f.scheds))Object.keys(f.scheds).forEach(id=>{const c=okId(id)?famCleanSched(f.scheds[id]):null;if(c)out.scheds[id]=c;});
  if(Array.isArray(f.members))f.members.forEach(m=>{const c=famCleanMember(m,isObj(m)?m.uid:'');if(c)out.members.push(c);});
  if(isObj(f.memos))Object.keys(f.memos).forEach(id=>{const c=okId(id)?famCleanMemo(f.memos[id]):null;if(c)out.memos[id]=c;});
  ['reqIn','reqOut'].forEach(k=>{if(isObj(f[k]))Object.keys(f[k]).forEach(id=>{const c=okId(id)?famCleanReq(f[k][id]):null;if(c)out[k][id]=c;});});
  if(isObj(f.reqCc))Object.keys(f.reqCc).forEach(id=>{const c=okId(id)?famCleanCc(f.reqCc[id]):null;if(c)out.reqCc[id]=c;});
  if(isObj(f.memoRev))Object.keys(f.memoRev).forEach(id=>{if(okId(id))out.memoRev[id]=Math.max(0,Math.round(+f.memoRev[id])||0);});
  if(isObj(f.me))out.me={sent:Math.max(0,Math.round(+f.me.sent)||0),bonus:Math.max(0,Math.round(+f.me.bonus)||0),joinedAt:Math.max(0,+f.me.joinedAt||0),joinLocal:Math.max(0,+f.me.joinLocal||0),moved:Math.max(0,Math.round(+f.me.moved)||0)};
  // v0.96 옛 가족 메모 옮기기: 묶음으로 올린 내 메모 id · 가족이 올린 묶음(보기만)
  if(Array.isArray(f.archIds))out.archIds=f.archIds.filter(x=>typeof x==='string'&&x.length<=60).slice(0,4500);
  if(f.archDone)out.archDone=1;
  if(typeof f.archKey==='string')out.archKey=f.archKey.slice(0,700);
  out.arch={};if(isObj(f.arch))Object.keys(f.arch).slice(0,15).forEach(id=>{const a=f.arch[id];if(!isObj(a)||!okId(a.by)||!Array.isArray(a.items))return;
    out.arch[id]={by:a.by,byName:cutTxt(a.byName,12)||'가족',items:a.items.filter(x=>isObj(x)&&okDate(x.d)&&typeof x.t==='string'&&x.t.trim()).slice(0,1500).map(x=>({d:x.d,t:cutMulti(x.t,200),...(/^\d\d:\d\d$/.test(x.tm||'')?{tm:x.tm}:{})}))};});
  if(Array.isArray(f.seenMemo))out.seenMemo=f.seenMemo.filter(okId).slice(-300);
  if(+f.syncAt>0)out.syncAt=+f.syncAt;
  out.board={};if(isObj(f.board))Object.keys(f.board).slice(0,600).forEach(id=>{const c=okId(id)?famCleanBoardDoc(f.board[id]):null;if(c)out.board[id]=c;});   // 가족 포스트잇 복사본
  if(+f.boardSeen>0)out.boardSeen=+f.boardSeen;if(f.boardDot)out.boardDot=1;if(f.boardInit)out.boardInit=1;if(okId(f.boardMe))out.boardMe=f.boardMe;
  return out;
}
//#HELPERS_END

/* ================= 한국 공휴일 =================
 * 양력 공휴일과 대체공휴일은 규칙으로 계산하고,
 * 음력 명절(설날·부처님오신날·추석)은 아래 표에 직접 적어둡니다. (2025~2030 확인 완료)
 * → 해마다 6월쯤 나오는 '월력요항'을 보고 다음 해를 한 줄 추가하세요.
 * 선거일·임시공휴일은 EXTRA_HOL 에 추가하세요.
 * (규칙: 'SS'=토·일과 겹치면 대체, 'S'=일요일과 겹칠 때만, 'N'=대체 없음, 다른 공휴일과 겹치면 모두 대체 1일)
 */
//#HOL_START
const LUNAR={
  2025:['2025-01-29','2025-05-05','2025-10-06'],   // 지난 해도 달력에서 볼 수 있게 (수당 · 근무 확인)
  2026:['2026-02-17','2026-05-24','2026-09-25'],   // 설날, 부처님오신날, 추석
  2027:['2027-02-07','2027-05-13','2027-09-15'],
  2028:['2028-01-27','2028-05-02','2028-10-03'],
  2029:['2029-02-13','2029-05-20','2029-09-22'],
  2030:['2030-02-03','2030-05-09','2030-09-12']
};
const EXTRA_HOL={'2025-01-27':'임시공휴일','2025-06-03':'대통령선거일','2026-06-03':'지방선거일','2028-04-12':'국회의원선거'};
const holCache={};
function computeHol(y){
  const bases=[];
  const one=(name,m,d,rule)=>bases.push({name,dates:[`${y}-${pad(m)}-${pad(d)}`],rule});
  one('신정',1,1,'N');
  one('삼일절',3,1,'SS');
  if(y>=2026)one('노동절',5,1,'SS');
  one('어린이날',5,5,'SS');
  one('현충일',6,6,'N');
  if(y>=2026)one('제헌절',7,17,'SS');
  one('광복절',8,15,'SS');
  one('개천절',10,3,'SS');
  one('한글날',10,9,'SS');
  one('성탄절',12,25,'SS');
  const L=LUNAR[y];
  if(L){
    bases.push({name:'설날',dates:[addK(L[0],-1),L[0],addK(L[0],1)],rule:'S'});
    bases.push({name:'부처님오신날',dates:[L[1]],rule:'SS'});
    bases.push({name:'추석',dates:[addK(L[2],-1),L[2],addK(L[2],1)],rule:'S'});
  }
  for(const [k,n] of Object.entries(EXTRA_HOL)){if(k.startsWith(y+'-'))bases.push({name:n,dates:[k],rule:'N'});}
  const on={};
  bases.forEach(b=>b.dates.forEach(k=>{(on[k]=on[k]||[]).push(b);}));
  const anchors=[];
  for(const [k,list] of Object.entries(on)){
    const w=parse(k).getDay(),overlap=list.length>1;
    let need=false;
    for(const b of list){
      if(b.rule==='SS'&&(overlap||w===0||w===6))need=true;
      if(b.rule==='S'&&(overlap||w===0))need=true;
    }
    if(need){
      let anchor=k;
      for(const b of list){const last=b.dates[b.dates.length-1];if(last>anchor)anchor=last;}
      anchors.push(anchor);
    }
  }
  anchors.sort();
  const res={};
  for(const [k,list] of Object.entries(on)){
    res[k]=list.map(b=>(b.dates.length>1&&k!==b.dates[1])?'연휴':b.name).join('·');
  }
  for(const a of anchors){
    let c=addK(a,1);
    while(isWknd(c)||res[c])c=addK(c,1);
    res[c]='대체공휴일';
  }
  return res;
}
/* ---- 서버에서 받은 공휴일 (임시공휴일·대체공휴일까지 정부 발표 그대로) ----
 * GitHub Actions 가 매일 한국천문연구원 특일 정보를 받아 data/holidays.json 으로 올려 둡니다.
 * 받은 해는 그 목록을 쓰고, 못 받은 해(또는 인터넷이 없을 때)는 위의 규칙으로 계산합니다. */
const HOL_URL='https://raw.githubusercontent.com/hee6635/sin/HEAD/data/holidays.json';
const HOL_KEY='eonjeswieo:hol';
const HOL_FIX={'1월1일':'신정','기독탄신일':'성탄절','설날':'설날','추석':'추석'};
let REMOTE_HOL={fetchedAt:0,years:{}};
try{const j=localStorage.getItem(HOL_KEY);if(j)REMOTE_HOL=Object.assign(REMOTE_HOL,JSON.parse(j));}catch(e){}
function holMap(y){
  if(holCache[y])return holCache[y];
  const rm=REMOTE_HOL.years&&REMOTE_HOL.years[y];
  if(rm&&Object.keys(rm).length){
    const out={};
    for(const [k,n] of Object.entries(rm))out[k]=HOL_FIX[n]||n;
    return holCache[y]=out;
  }
  return holCache[y]=computeHol(y);
}
const holName=k=>holMap(+k.slice(0,4))[k]||'';
/* 회사 휴무일 (매년 반복이면 월·일만 비교) */
const ad=k=>!!(S.addons&&S.addons[k]);
function compHolItem(k){
  if(!ad('comp'))return null;
  return (S.companyHols||[]).find(x=>x.kind!=='memo'&&(x.date===k||(x.yearly&&x.date.slice(5)===k.slice(5)&&k>=x.date)))||null;
}
function compHol(k){const h=compHolItem(k);return h?h.name:'';}
// 회사 휴무일(쉬는 날)은 명절처럼: 빨간 날짜 + 띠에 짧은 이름 (창립기념일 → 창립 · 한 글자는 창). 이름 끝의 "기념일 · 휴무"는 뺌
const compShort=n=>{const t=String(n||'').replace(/(기념일|휴무일|휴무)$/,'').trim();return t||String(n||'').trim();};
function offHolName(k){const h=compHolItem(k);return h&&h.kind!=='memo'?compShort(h.name):'';}
const shortHol=n=>!n?'':n==='부처님오신날'?'부처님':n.startsWith('대체')?'대체':n.includes('선거')?'선거':n==='임시공휴일'?'임시휴일':n.split('·')[0];
// 폰처럼 좁은 칸: "개천…" 대신 짧은 이름 (… 없이)
const HOL2={'삼일절':'삼일','노동절':'노동','어린이날':'어린','부처님오신날':'부처','현충일':'현충','제헌절':'제헌','광복절':'광복','개천절':'개천','한글날':'한글','성탄절':'성탄','대체공휴일':'대체','임시공휴일':'임시'};
// 달력 칸: 스티커가 있는 날은 공휴일 이름 대신 한 글자 (개천절=개 · 성탄절=성 · 부처님오신날=부 …)
const HOL1={'개천절':'개','성탄절':'성','부처님오신날':'부','설날':'설','추석':'추','신정':'신','삼일절':'삼','노동절':'노','근로자의날':'근','어린이날':'어','현충일':'현','광복절':'광','한글날':'한','제헌절':'제','대체공휴일':'대','임시공휴일':'임'};
const holOne=n=>{if(!n)return '';const p=n.split('·');const a=p[0]==='연휴'?(p[1]||'연휴'):p[0];return a.includes('선거')?'선':a.startsWith('대체')?'대':(HOL1[a]||a.slice(0,1));};
const holTwo=n=>{if(!n)return '';const p=n.split('·');const a=p[0]==='연휴'?(p[1]||'연휴'):p[0];return a.includes('선거')?'선거':(HOL2[a]||a.slice(0,2));};
const holShort=n=>{if(!n)return '';const a=n.split('·')[0];return a.includes('선거')?'선거':(HOL2[a]||a.slice(0,2));};
//#HOL_END

/* ================= 근무 종류 ================= */
/* 근무타입은 S.types 에 저장 (사용자가 추가·편집 가능)
 * k: 달력에 보이는 글자(1~2자), name: 이름, color: 'v:day' 처럼 테마 색 또는 '#hex', 빈 값이면 빨간 글자만
 * rest: 쉬는 날 종류인지 (통계·대근 계산에 사용) */
// 근무 색: 앞 8개는 파스텔(주간 하늘 · 야간 살구와 어울림, 7 · 8번은 그 둘과 비슷해서 뒤로) · 그 뒤는 예전 색. 새 근무 종류는 PASTEL 순서대로 안 쓰는 색부터
const PASTEL=['#b9dcb0','#c9b8e8','#f1dc8f','#a8dccf','#f2b8c6','#d9c9b0','#b3c3ef','#f5c7a9'];
const nextPastel=(used)=>{const u=new Set((used||(S&&S.types)||[]).map(t=>String(t.color||'').toLowerCase()));return PASTEL.find(c=>!u.has(c))||PASTEL[u.size%PASTEL.length];};
const PALETTE=[...PASTEL,'#37474f','#546e7a','#ba68c8','#7986cb','#3f51b5',
  '#795548','#e91e63','#2196f3','#fbc02d','#8bc34a',
  '#cfd8dc','#d7ccc8','#ffe0b2','#dcedc8','#bbdefb',
  '#c5cae9','#e1bee7','#f8bbd0','#ffccbc','#b2dfdb'];
const DEFAULT_TYPES=()=>[
  {k:'주',name:'주간',color:'v:day',rest:false},
  {k:'야',name:'야간',color:'v:night',rest:false},
  {k:'휴',name:'휴무',color:'',rest:true},
  {k:'상',name:'상주',color:'#b9dcb0',rest:false},
  {k:'교',name:'교육',color:'#c9b8e8',rest:false}
];
/* "+추가"에서 고를 수 있는 기본 목록 [글자, 이름, 설명] */
const PRESETS=[
  {group:'근무',rest:false,items:[['주','주간'],['야','야간'],['상','상주'],['교','교육'],['당','당직'],['대','대근'],['출','출장'],['특','특근']]},
  {group:'휴무',rest:true,items:[['_','없음','글자 · 동그라미 없이 빈 칸'],['월차','월차'],['연차','연차'],['연가','연가'],['반차','반차'],['휴','휴무'],['지휴','지휴','지정휴가'],['보휴','보휴','보건휴가'],['병가','병가'],['경조','경조','경조휴가']]}
];
const BUILTIN=['주','야','휴'];
const NONE_K='_';   // "없음" 근무타입의 저장 글자 (달력에는 아무것도 안 보임, 쉬는 날로 셈)
// 근무타입 고르는 칩 · 칠하기 막대처럼 눈에 보여야 하는 곳은 점선 동그라미 "없음", 달력 칸은 빈 칸
const noneBadge=(extra,inner)=>{const ph=/(^|\s)(tc|sm|big|xs)(\s|$)/.test(extra||'');return `<span class="badge r nonb${ph?' ph':''} ${extra||''}">${ph?'없음':''}${inner||''}</span>`;};
const BLANK_T={k:'',name:'미정',color:'',rest:true,blank:true};   // 정해진 근무가 없는 날 (불규칙 · 건너뛴 달력)
const kCut=v=>{v=String(v||'').trim();return /^[\x21-\x7e]+$/.test(v)?v.slice(0,3):v.slice(0,2);};
const typeOf=k=>k===''?BLANK_T:((S.types||[]).find(t=>t.k===k)||{k,name:k,color:'#cfd8dc',rest:false});
const shiftLabel=k=>typeOf(k).name;
const isRest=k=>!!typeOf(k).rest;
function tColors(t){
  const c=t&&t.color;
  if(!c)return null;
  if(c==='v:day')return {bg:'var(--day)',fg:'var(--day-fg)'};
  if(c==='v:night')return {bg:'var(--night)',fg:'var(--night-fg)'};
  if(!okHex(c))return null;   // 모양이 다른 값(가족이 올린 이상한 글자 등)은 색 없음(빨간 글자만)으로
  const h=c.replace('#',''),R=parseInt(h.slice(0,2),16),G=parseInt(h.slice(2,4),16),B=parseInt(h.slice(4,6),16);
  return {bg:c,fg:(R*299+G*587+B*114)/1000>150?'#1f2328':'#ffffff'};
}
/* 근무 동그라미 html. extra: 'sm' 등 추가 클래스 */
function badge(k,extra,inner){
  if(k===NONE_K)return noneBadge(extra,inner);
  if(k==='')return `<span class="badge r ${extra||''} blankb">·${inner||''}</span>`;
  const t=typeOf(k),c=tColors(t),two=String(k).length>2?' two three':String(k).length>1?' two':'';
  if(!c)return `<span class="badge r${two} ${extra||''}">${esc(k)}${inner||''}</span>`;
  return `<span class="badge c${two} ${extra||''}" style="--tb:${c.bg};--tf:${c.fg}">${esc(k)}${inner||''}</span>`;
}
let MIN_M=2025*12, MAX_M=2030*12+11;   // 달력을 넘길 수 있는 범위 = 공휴일 계산이 되는 해 (서버 공휴일을 받으면 늘어남)
function updateRange(){
  const ys=Object.keys(REMOTE_HOL.years||{}).map(Number).filter(Boolean);
  MIN_M=Math.min(2025,...ys)*12;
  MAX_M=Math.max(2030,...ys)*12+11;
}
updateRange();

/* ================= 요청 상태 ================= */
const REQ_ST={
  pending:{ic:'🟡',name:'대기'},
  accepted:{ic:'🟢',name:'수락'},
  rejected:{ic:'🔴',name:'거절'},
  applied:{ic:'✅',name:'적용됨'},
  cancelled:{ic:'⚪',name:'취소'}
};

/* ================= 상태 저장 ================= */
/* v0.186 시작 기록 (켠 뒤 12초): 오래 걸린 일 · 화면이 멈춘 틈 · 손가락 · 달 넘김 → 설정 › 앱 정보 7번 › 개발자 메뉴에서 봄 (저장 안 함 · 화면 영향 없음) */
const PF={t0:performance.now(),ev:[]};window.__perf=PF;
const pfOn=()=>performance.now()<12000||performance.now()<(PF.until||0);   // v0.202 날짜 창을 열 때도 3초 동안 기록
function pf(n,ms){if(pfOn()&&PF.ev.length<400)PF.ev.push([Math.round(performance.now()),n,ms==null?'':Math.round(ms)]);}
const pfWrap=(name,fn)=>function(...a){if(!pfOn())return fn.apply(this,a);const t=performance.now();try{return fn.apply(this,a);}finally{const d=performance.now()-t;if(d>=8)pf(name,d);}};
try{new PerformanceObserver(l=>l.getEntries().forEach(e=>pf('긴 작업',e.duration))).observe({type:'longtask',buffered:true});}catch(e){}
// v0.205 멈춘 이유: 폰 크롬이 알려주는 긴 프레임(50ms 넘음)을 계산(어떤 함수) · 배치 · 그 밖(그리기 등)으로 나눠 적음 (지원 안 하는 폰은 그냥 빠짐)
try{new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!(e.startTime<12000||e.startTime<(PF.until||0)))return;
  const sc=(e.scripts||[]).slice().sort((a,b)=>b.duration-a.duration);const js=sc.reduce((a,x)=>a+x.duration,0);
  const end=e.startTime+e.duration,lay=e.styleAndLayoutStart?end-e.styleAndLayoutStart:0,etc=Math.max(0,e.duration-js-lay);
  const top=sc[0]?(sc[0].sourceFunctionName||sc[0].invoker||'').replace(/^.*\./,'').slice(0,24):'';
  const ps=[];if(js>=5)ps.push('계산 '+Math.round(js)+(top?' ('+top+')':''));if(lay>=5)ps.push('배치 '+Math.round(lay));if(etc>=5)ps.push('그 밖 '+Math.round(etc));
  if(PF.ev.length<400)PF.ev.push([Math.round(e.startTime),'↳ 멈춘 이유: '+(ps.join(' · ')||'-'),Math.round(e.duration)]);
})).observe({type:'long-animation-frame',buffered:true});}catch(e){}
const pfTick=()=>{let last=performance.now();const tick=now=>{const g=now-last;last=now;if(g>40)pf('화면 멈춤',g);if(pfOn())requestAnimationFrame(tick);else PF.tk=0;};PF.tk=1;requestAnimationFrame(tick);};pfTick();
const pfText=()=>PF.ev.slice().sort((a,b)=>a[0]-b[0]).map(e=>`${String(e[0]).padStart(5)}  ${e[1]}${e[2]!==''?'  '+e[2]:''}`).join('\n');   // v0.206 기록 복사
function pfKick(n){const was=pfOn();PF.until=performance.now()+3000;if(!was||!PF.tk)pfTick();pf(n);}
document.addEventListener('touchstart',()=>pf('손가락 닿음'),{capture:true,passive:true});
document.addEventListener('touchend',()=>pf('손가락 뗌'),{capture:true,passive:true});
const KEY='eonjeswieo:v1', OLD_KEY='shiftcal:v9';
const defaults=()=>({
  calLook:'fill',          // v0.97 새로 설치하면 칸 채우기 (예전 사용자는 normalize 가 동그라미 그대로)
  onboarded:false,         // 처음 시작 설정을 마쳤는지
  myset:false,             // 내 근무표를 만들었는지 (아니면 가족에게 근무표를 올리지 않음 · 예전 사용자는 true)
  noPat:false,             // 정해진 순서 없음 (불규칙 · 건너뛰기): 근무는 날짜마다 직접 넣음, 기본은 빈 칸
  pattern:['주','주','휴','휴','야','야','휴','휴'],
  anchor:fmt(new Date()),
  patOld:[],               // 시작 날을 바꾸기 전 옛 패턴 구간: [{until:'YYYY-MM-DD'(그 날 이전), pattern:[...], anchor}] 날짜 오름차순
  overrides:{},
  /* 날짜 메모: S.memos[날짜] = [{id, text, shared(가족 메모인지), by('host'|'guest'), t}] */
  memos:{},
  alarms:[],
  requests:[],
  events:[],
  tipMemo:false,
  tipStk:false,            // "스티커를 꾹 누르면 고칠 수 있어요" 안내를 보여 줬는지
  syncSettings:{isGuestMode:false,shareMyShift:true,receiveFamilyMemo:true,shareMyMemos:true,isPro:false,nightNotice:true},
  pay:{wage:0,hours:12},   // 대근 시급, 대근 1번 근무시간
  myTeam:2,                // 동료근무 표에서 내 조 (0번째 조부터)
  teamOffsets:[6,4,0,2],   // 조별로 기준(C조)보다 며칠 밀린 근무인지 (4조2교대 기본) · 길이 = 조 개수
  teamStyle:'abc',         // 조 이름: 'abc'(A조) · 'num'(1조) · 'team'(1팀) · 'custom'(teamNames)
  teamNames:[],            // 직접 고친 조 이름
  holRest:false,           // 공휴일엔 쉼 (상주 · 평일 근무)
  link:null,               // 가족방 연결 {hid, role:'host'|'guest', name, perm, mode:'own'|'view', uid, hash} (이 폰의 로그인 번호에 묶여서 백업에는 안 넣음)
  fam2:{scheds:{},members:[],memos:{},reqIn:{},reqOut:{},me:{sent:0,bonus:0},seenMemo:[],memoRev:{},reqCc:{},init:false},
  addons:{comp:false,cheer:false,together:false,colleague:false,stats:false,status:false},   // 부가 기능 (설정 › 부가 기능): 처음에는 모두 꺼짐, 꺼도 저장된 내용은 그대로
  addonNote:'new',          // 부가 기능 안내를 보여줬는지: 'new'(처음 쓰는 사람) · 'old'(쓰던 사람) · 'done'   // 가족방에서 받은 가족 근무표 · 구성원 복사본 (오프라인에서도 보이게, 백업에는 안 넣음)
  patternName:'4조2교대',  // 달력 위에 보이는 근무 이름
  types:DEFAULT_TYPES(),
  /* 월 메모: S.board['2026-10'] = [{id, kind('todo'|'note'), text, done, doneBy, shared, by, t}] */
  board:{},
  boardCarry:{},           // 달 넘김을 물어본 달
  stamps:defaultStamps(),  // 스티커 (약 · 운동)
  family:[],               // 직접 추가한 가족 (같이 쉬는 날 계산)
  famCheer:null,           // 응원 버튼 (없으면 기본)
  famDayToo:true,          // 야간 전 낮도 같이로 보기
  togOff:[],               // v0.171 같이 쉬는 날에서 뺄 가족 (id · uid)
  shiftTimes:{},           // 근무타입별로 고친 시간 (안 고치면 기본값 "대략")
  status:{show:false,phone:true,homeAlert:true,cheer:'quiet',work:'🏭',workName:'',labels:{}},
  icons:{},                // 사진 아이콘 {번호: 128px JPEG}. 이모티콘 자리에는 '@번호'
  /* D-day: [{id, name, date, emoji, yearly, showCal, shared}] */
  ddays:[],
  /* 회사 휴무일: [{id, date, name, yearly}] */
  companyHols:[],
  compHolAsHoliday:true,   // 회사 휴무일 출근도 휴일 근무로 셈
  memoColors:{fam:'#7b5cf0',my:'#5b8fc7'},
  fontScale:100,
  wlog:{name:'',secs:[{id:'a',n:'인수',h:false},{id:'b',n:'인계',h:false},{id:'c',n:'지시',h:false},{id:'d',n:'특이',h:false}],backup:false,seen:false,days:{}},   // 업무 일지 (부가 기능 · 나만 · 백업 기본 제외)
  srchKind:'memo',
  stats:true,   // 사용 통계(횟수만) · 오류 보고 보내기 · 설정에서 끔
  wx:{home:'',work:'',fw:{},nm:{}},
  ot:{},                   // ⏱ 연장: 날짜별 실제 출근 · 퇴근 {'YYYY-MM-DD':['07:00','23:00']}
  salary:{fixed:0,close:0,night:['22:00','06:00'],ot:0,nt:0,leaveYear:0,slips:{}},   // 월급 (근무 통계): 고정금 · 급여 마감일(0=말일) · 야간 기준 · 직접 적은 연장/야간 1시간 금액 · 올해 연차 · 명세서 {'YYYY-MM':{ot,nt,lv,lvd,tot}}   // 출퇴근 날씨 (부가 기능 wx): 집 · 직장 지역 번호, 가족 직장(보는 사람이 정함)
  bg:'',   // 배경: '' 기본 · 'vivid' 또렷하게 (v0.161 종이 뺌)
  theme:'system',   // 화면 모드: system(폰 설정 따라감) · light · dark
  showBand:false,  // 같은 근무가 이어질 때 칸 사이를 잇는 색 띠 (새로 설치하면 꺼짐, 예전 데이터는 켜짐 그대로)
  drive:{last:0,dirty:false,email:'',auto:true},
  born:Date.now(),         // 처음 쓴 때 (며칠 쓴 뒤 "백업해 둘까요?" 한 번 물어보는 데 씀)
  nudgeBk:0                // 그 안내를 보여준 때 (0 = 아직)
});
const REM_DAYS=[7,3,2,1,0],REM_SHORT={7:'1주',3:'3일',2:'2일',1:'전날',0:'당일'},REM_LABEL={7:'1주 전',3:'3일 전',2:'2일 전',1:'전날',0:'당일'},REM_AT=['08:00','12:00','20:00','22:00'];
// 모양 조정(숨은 화면): 앱 달력 · 한 달 위젯(커버 · 안쪽)의 스티커 · 주야 글자 · 메모 크기 · 위치를 배율 · 위치로 저장. 값은 [키, 이름, 최소, 최대, 한 칸, 기본]
const TUNE_KEYS=[['stk','스티커 크기',.6,1.6,.05,1,'스티커'],['stkX','스티커 좌우 위치',-1,1,.05,0,'스티커'],['stkY','스티커 높이 위치',-1,1,.05,0,'스티커'],['stkGX','스티커 좌우 간격',-1,1,.05,0,'스티커'],['stkGY','스티커 상하 간격',-1,1,.05,0,'스티커'],['ink','주야 크기',.6,1.5,.05,1,'주야'],['inkY','주야 높이 위치',-1,1,.05,0,'주야'],['dotX','변경 표시(빨간 점) 좌우',-1,1,.05,0,'주야','app'],['memo','메모 글자 크기',.7,1.6,.05,1,'메모'],['pill','메모 칸 높이',.4,1.6,.05,1,'메모'],['memoY','메모 위치 (위 − · 아래 +)',-1,3,.05,0,'메모'],['memoG','메모 줄 사이 간격',-1,1,.05,0,'메모']];
const TUNE_NEUTRAL=Object.fromEntries(TUNE_KEYS.map(k=>[k[0],k[5]]));
// 기본값(사용자가 폰에서 맞춘 값): 앱 달력은 화면 폭 600dp 이상(폴더폰 안쪽 · 태블릿)이면 "안쪽" · 아니면 "커버" 값 / 한 달 위젯은 위젯 폭(440dp 기준)으로 커버 · 안쪽 (새 값은 0 = 지금 모양 그대로)
const TUNE_DEF={appCover:{...TUNE_NEUTRAL,stk:1.05,stkX:.55,stkY:.05,ink:1.25,inkY:.65,memo:.9,pill:.7},appInner:{...TUNE_NEUTRAL,stk:.9,stkX:-.25,stkY:-.05,ink:1.05,inkY:.1,memo:1.1,pill:.95},   // v0.136 앱 달력 기본 = 사용자가 쓰는 값 (새로 설치하는 사람 · 이미 쓰는 사람은 저장된 값 그대로)
  cover:{...TUNE_NEUTRAL,stk:1.05,stkX:.8,stkY:.95,ink:1.5,inkY:.65,memo:1.5,pill:1.5},inner:{...TUNE_NEUTRAL,stk:1.2,stkX:.4,stkY:-.1,ink:.95,inkY:-.1,memo:1.1,pill:1.1}};
function tuneClean(o,df){const d=df||TUNE_NEUTRAL,r={};TUNE_KEYS.forEach(([k,,lo,hi])=>{const v=o&&typeof o==='object'&&o[k]!=null?+o[k]:NaN,dv=Number.isFinite(+d[k])?+d[k]:TUNE_NEUTRAL[k];r[k]=Number.isFinite(v)?Math.max(lo,Math.min(hi,Math.round(v*100)/100)):dv;});return r;}
function tuneAll(t){return {appCover:tuneClean(t&&t.appCover,TUNE_DEF.appCover),appInner:tuneClean(t&&(t.appInner||t.app),TUNE_DEF.appInner),cover:tuneClean(t&&t.cover,TUNE_DEF.cover),inner:tuneClean(t&&t.inner,TUNE_DEF.inner)};}
function normalize(o){
  if(!isObj(o))o={};
  const d=defaults(),s=Object.assign({},d,o);   // (d 는 그대로 둬야 아래 "깨진 값은 기본값으로"가 먹음)
  s.syncSettings=Object.assign(defaults().syncSettings,isObj(o.syncSettings)?o.syncSettings:{});
  s.pay=Object.assign({wage:0,hours:12},isObj(o.pay)?o.pay:{});s.pay.wage=Math.max(0,+s.pay.wage||0);s.pay.hours=Math.max(1,Math.min(24,+s.pay.hours||12));
  {const o2=isObj(s.ot)?s.ot:{},ot={},T=v=>typeof v==='string'&&/^\d{1,2}:\d\d$/.test(v);Object.keys(o2).slice(-800).forEach(k=>{const v=o2[k];if(/^\d{4}-\d\d-\d\d$/.test(k)&&Array.isArray(v)&&T(v[0])&&T(v[1]))ot[k]=[v[0],v[1]];});s.ot=ot;
   const w=isObj(s.salary)?s.salary:{},N=v=>Math.max(0,Math.round(+v||0)),sl={};if(isObj(w.slips))Object.keys(w.slips).slice(-36).forEach(k=>{const x=w.slips[k];if(/^\d{4}-\d\d$/.test(k)&&isObj(x))sl[k]={ot:N(x.ot),nt:N(x.nt),lv:N(x.lv),lvd:Math.min(31,N(x.lvd)),tot:N(x.tot)};});
   const nt=Array.isArray(w.night)&&T(w.night[0])&&T(w.night[1])?[w.night[0],w.night[1]]:['22:00','06:00'];
   s.salary={fixed:N(w.fixed),close:Math.min(28,N(w.close)),night:nt,ot:N(w.ot),nt:N(w.nt),leaveYear:Math.min(60,N(w.leaveYear)),leaveFrom:typeof w.leaveFrom==='string'&&/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(w.leaveFrom)?w.leaveFrom:'',slips:sl};}
  s.born=(+s.born>0&&+s.born<=Date.now()+864e5)?+s.born:Date.now();s.nudgeBk=+s.nudgeBk>0?+s.nudgeBk:0;
  // 깨진 값 방어: 모양이 안 맞는 칸은 기본값으로 (첫 화면이 안 뜨거나 저장 데이터를 못 읽는 일을 막음)
  if(!Array.isArray(s.pattern)||s.pattern.length<2||s.pattern.length>366)s.pattern=d.pattern;
  s.pattern=s.pattern.map(x=>cutTxt(x,6));
  if(!okDate(s.anchor))s.anchor=d.anchor;
  if(!isObj(s.overrides))s.overrides={};else Object.keys(s.overrides).forEach(k=>{if(!okDate(k)||typeof s.overrides[k]!=='string')delete s.overrides[k];});
  if(!isObj(s.board))s.board={};else Object.keys(s.board).forEach(k=>{if(!Array.isArray(s.board[k]))delete s.board[k];else s.board[k]=s.board[k].filter(isObj);});
  if(!isObj(s.memos))s.memos={};
  if(isObj(s.stamps)&&Array.isArray(s.stamps.defs))s.stamps.defs=s.stamps.defs.filter(isObj);
  {const okD=v=>/^\d{4}-\d\d-\d\d$/.test(v||'');
   s.patOld=(Array.isArray(s.patOld)?s.patOld:[]).filter(o=>o&&okD(o.until)&&okD(o.anchor)&&Array.isArray(o.pattern)&&o.pattern.length>=2&&o.pattern.length<=60).map(o=>({until:o.until,anchor:o.anchor,pattern:o.pattern.map(String)})).sort((a,b)=>a.until<b.until?-1:1).slice(0,20);}
  s.noPat=!!s.noPat;
  s.myset=(o&&o.myset!==undefined)?!!o.myset:true;   // 예전 사용자는 근무표를 만든 걸로
  s.alarms=(Array.isArray(s.alarms)?s.alarms:[]).filter(a=>isObj(a)&&okTime(a.time)).slice(0,100);

  if(!Array.isArray(s.types))s.types=[];
  s.types=s.types.filter(t=>isObj(t)&&typeof t.k==='string'&&t.k&&t.k.length<=6).map(t=>Object.assign({},t,{k:cutTxt(t.k,6),name:cutTxt(t.name||t.k,20),color:safeColor(t.color,''),rest:!!t.rest}));
  if(!s.types.length)s.types=DEFAULT_TYPES();
  BUILTIN.forEach((k,i)=>{if(!s.types.some(t=>t.k===k))s.types.splice(i,0,DEFAULT_TYPES()[i]);});
  if(!Array.isArray(s.teamOffsets)||!s.teamOffsets.length||s.teamOffsets.length>8)s.teamOffsets=[6,4,0,2];
  s.teamOffsets=s.teamOffsets.map(x=>Number(x)||0);
  if(!(Number.isInteger(s.myTeam)&&s.myTeam>=0&&s.myTeam<s.teamOffsets.length))s.myTeam=Math.min(2,s.teamOffsets.length-1);
  if(!['abc','num','team','custom'].includes(s.teamStyle))s.teamStyle='abc';
  if(!Array.isArray(s.teamNames))s.teamNames=[];
  s.alarmMsg=s.alarmMsg!==false;s.chLog=(Array.isArray(o&&o.chLog)?o.chLog:[]).filter(x=>isObj(x)&&+x.t>0&&okDate(x.k)).slice(0,300).map(x=>({t:+x.t,k:x.k,w:cutTxt(x.w,12),a:['chg','req','pending','held','accepted','rejected','applied'].includes(x.a)?x.a:'chg',f:cutTxt(x.f,12),to:cutTxt(x.to,12),...(+x.rcv?{rcv:+x.rcv}:{}),...(x.want?{want:cutTxt(x.want,6)}:{})}));   // v0.135 근무 바뀐 기록s.stzMode=(o&&o.stzMode)==='3'?'3':'m';   // v0.130 스티커 크기 범위: 기본 'm' 그 달만(달마다 최대한 크게) · '3' 앞뒤 3달
  {const a=isObj(s.famAlias)?s.famAlias:{},o={};Object.keys(a).slice(0,20).forEach(k=>{const v=typeof a[k]==='string'?a[k].trim().slice(0,12):'';if(/^[A-Za-z0-9_-]{1,64}$/.test(k)&&v)o[k]=v;});s.famAlias=o;}   // v0.127 부를 이름
  {const h=isObj(s.hints)?s.hints:{},o2={};Object.keys(h).slice(0,30).forEach(k=>{const v=Math.round(+h[k]);if(/^[a-z0-9]{1,12}$/.test(k)&&v>=0&&v<1000)o2[k]=v;});s.hints=o2;}   // v0.126 안내 줄 본 횟수
  s.pushOn=s.pushOn!==false;s.pushQuiet=s.pushQuiet!==false;s.pushBoard=!(o&&o.pushBoard===false);s.lastMemoColor=/^#[0-9a-f]{6}$/i.test((o&&o.lastMemoColor)||'')?o.lastMemoColor:'';s.widget={theme:['light','dark'].includes(o&&o.widget&&o.widget.theme)?o.widget.theme:'system',alpha:Math.max(0,Math.min(100,Math.round(+((o&&o.widget&&o.widget.alpha)??100)))),look:(o&&o.widget&&o.widget.look)==='circle'?'circle':'fill',bg:(o&&o.widget&&['','vivid'].includes(o.widget.bg))?o.widget.bg:'app' };/* v0.171 위젯 배경 따로 · 'app' = 위젯에서 고른 적 없으면 앱 화면 배경을 따라감 */s.tune=tuneAll(o&&o.tune);s.tuneHist=Array.isArray(o&&o.tuneHist)?o.tuneHist.slice(0,5).map(tuneAll):[];s.calLook=(o&&o.calLook)==='fill'||((o&&o.calLook)!=='circle'&&!(o&&o.onboarded))?'fill':'circle';/* v0.97 새로 설치 = 칸 채우기 · 예전부터 쓰던 사람(고른 적 없음 = 동그라미)은 그대로 */s.todayLook=['a','b','c','d'].includes(o&&o.todayLook)?o.todayLook:'b';s.todayColor=(o&&o.todayColor==='shift')?'shift':/^#[0-9a-f]{6}$/i.test((o&&o.todayColor)||'')?o.todayColor.toLowerCase():'';if(!(o&&o.tdcMig)&&!s.todayColor)s.todayColor='shift';s.tdcMig=true;/* v0.155 오늘 표시 기본 = 그날 근무 색 (쉬는 날 회색) · 이미 고른 색은 그대로 */ /* 'shift' = 그날 근무 색 */s.linkLost=(o&&isObj(o.linkLost)&&typeof o.linkLost.hid==='string')?{hid:cutTxt(o.linkLost.hid,128),role:o.linkLost.role==='host'?'host':'guest',name:cutTxt(o.linkLost.name,12),at:+o.linkLost.at||0}:null;s.linkMissAt=+(o&&o.linkMissAt)||0;s.hostSeenAt=+(o&&o.hostSeenAt)||0;s.personal=!!s.personal;s.pers=(Array.isArray(o&&o.pers)?o.pers:[]).filter(p=>p&&/^\d{4}-\d\d-\d\d$/.test(p.f||'')&&(!p.t||/^\d{4}-\d\d-\d\d$/.test(p.t))).map(p=>({f:p.f,t:p.t||''}));if(s.personal&&!s.pers.length)s.pers=[{f:'1900-01-01',t:''}];s.personal=(s.pers||[]).some(p=>p.f<=fmt(new Date())&&(!p.t||fmt(new Date())<p.t));s.fontScale=(+s.fontScale>100)?120:100;s.weekStart=(o&&o.weekStart===1)?1:0;s.memoLines=3;s.quickN=(o&&(o.quickN===4||o.quickN===8))?o.quickN:0;s.famWk=(o&&o.famWk==='w')?'w':'c';s.famSwiped=!!(o&&o.famSwiped);s.myEmo=(o&&Array.isArray(o.myEmo)?o.myEmo:[]).filter(x=>x&&typeof x.e==='string'&&x.e).slice(0,20).map(x=>({e:x.e.slice(0,16),n:String(x.n||'').slice(0,12)}));s.patWeek=!!(o&&o.patWeek);s.seenVer=String((o&&o.seenVer)||'');s.theme=(s.theme==='light'||s.theme==='dark')?s.theme:'system';s.bg=(o&&o.bg==='vivid')?'vivid':'';/* v0.161 종이(paper) 뺌 → 기본 · v0.165 새로 설치도 기본(칸 채우기 + 기본 배경 · 사용자) *//* v0.135 새로 설치 = 또렷하게 */s.stats=!(o&&o.stats===false);s.showBand=(o&&o.showBand!==undefined)?o.showBand!==false:true;s.gAcct=typeof s.gAcct==='string'?s.gAcct.slice(0,80):'';s.gWarnAt=Number.isFinite(+s.gWarnAt)&&+s.gWarnAt>0?+s.gWarnAt:0;s.mineOrd=Array.isArray(s.mineOrd)?s.mineOrd.filter(x=>typeof x==='string').slice(0,80):[];s.srchRecent=Array.isArray(s.srchRecent)?s.srchRecent.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.slice(0,30)).slice(0,8):[];s.holRest=!!s.holRest;s.shareMemo=!!s.shareMemo;s.tipMemo=!!s.tipMemo;s.tipStk=!!s.tipStk;s.togOff=Array.isArray(o&&o.togOff)?o.togOff.filter(x=>typeof x==='string').slice(0,40):[];
  s.link=(s.link&&typeof s.link==='object'&&s.link.hid&&['host','guest'].includes(s.link.role))?{hid:String(s.link.hid),role:s.link.role,name:String(s.link.name||'').slice(0,12),perm:s.link.perm==='read'?'read':'write',mode:s.link.mode==='view'?'view':'own',stk:!!s.link.stk,stkAsked:s.link.stkAsked?1:0,uid:String(s.link.uid||'').slice(0,128),hash:String(s.link.hash||'').slice(0,16)}:null;
  s.memoColors=Object.assign({fam:'#7b5cf0',my:'#5b8fc7'},isObj(o.memoColors)?o.memoColors:{});['fam','my'].forEach(k=>{if(!okHex(s.memoColors[k]))s.memoColors[k]=({fam:'#7b5cf0',my:'#5b8fc7'})[k];});s.memoColors.fam='#7b5cf0';   // v0.151 가족 메모는 보라 고정
  if(!(o&&o.memoMig88)&&s.memoColors.my==='#6b7280')s.memoColors.my='#5b8fc7';s.memoMig88=true;   // v0.88: 내 메모 기본색 회색 → 연한 파랑 (옛 기본값 그대로인 사람만 · 한 번만 — 그 뒤에 회색을 고르면 그대로)
  s.drive=Object.assign(defaults().drive,isObj(o.drive)?o.drive:{});
  s.status=Object.assign(defaults().status,isObj(o.status)?o.status:{});if(!isObj(s.status.labels))s.status.labels={};
  if(!isObj(s.shiftTimes))s.shiftTimes={};else Object.keys(s.shiftTimes).forEach(k=>{const v=s.shiftTimes[k];if(!isObj(v)||!okTime(v.start)||!okTime(v.end))delete s.shiftTimes[k];});
  s.family=(Array.isArray(s.family)?s.family:[]).filter(isObj).map(x=>Object.assign({},x,{name:cutTxt(x.name,40),color:okHex(x.color)?x.color:'#8a8f99',days:Array.isArray(x.days)?x.days:[],vac:(Array.isArray(x.vac)?x.vac:[]).filter(v=>isObj(v)&&okDate(v.from)&&okDate(v.to))}));
  if(!isObj(s.icons))s.icons={};else Object.keys(s.icons).forEach(k=>{if(!okId(k)||!okImg(s.icons[k]))delete s.icons[k];});
  {const raw=o&&o.addons,had=!!(raw&&typeof raw==='object'&&!Array.isArray(raw));
   const a=had?raw:{};s.addons={};['comp','together','colleague','stats','wlog','wx'].forEach(k=>{s.addons[k]=!!a[k];});
   if(!had)s.addonNote=(o&&o.onboarded)?'old':'new';
   else if(!['new','old','done'].includes(o&&o.addonNote))s.addonNote='done';}
  if(!s.link&&Array.isArray(s.requests))s.requests=s.requests.filter(r=>!(r&&r.srv));
  s.fam2=famCleanFam2(s.fam2);
  {const w=isObj(s.wx)?s.wx:{},c5=v=>typeof v==='string'&&/^\d{5}(\d{5})?$/.test(v)?v:'',fw={},nm={};if(isObj(w.fw))Object.keys(w.fw).slice(0,30).forEach(k=>{if(c5(w.fw[k]))fw[k]=w.fw[k];});if(isObj(w.nm))Object.keys(w.nm).slice(0,40).forEach(k=>{const v=w.nm[k];if(/^\d{10}$/.test(k)&&typeof v==='string'&&v)nm[k]=v.replace(/[<>&"']/g,'').slice(0,12);});s.wx={home:c5(w.home),work:c5(w.work),fw,nm,...(w.one===true?{one:true}:{})};}   // 출퇴근 날씨: 지역 번호(시·군·구 5자리 · 동 10자리) + 고른 동 이름 · one = 집과 직장이 가까워서 같은 지역으로 봄
  s.wlog=wlogClean(s.wlog);s.srchKind=s.srchKind==='wl'?'wl':'memo';
  s.requests=(Array.isArray(s.requests)?s.requests:[]).filter(r=>isObj(r)&&!r.srv).concat(s.link?famMirrorList(s.fam2):[]);   // 서버에서 받은 요청은 걸러낸 가족 복사본으로 다시 만듦
  if(s.link&&typeof s.link==='object'){if(s.link.mode!=='view')s.link.mode='own';}else s.link=null;
  const stOld=s.stamps&&typeof s.stamps==='object'?s.stamps:null;s.stamps=Object.assign(defaultStamps(),s.stamps||{});(s.stamps.defs||[]).forEach(x=>{if(!x)return;if(x.fam!==undefined)x.fam=!!x.fam;if(x.id==='s_run'&&x.emoji==='🏃')x.emoji='👟';if(!x.rep)x.rep=x.kind==='pill'?'daily':(Array.isArray(x.days)&&x.days.length?'dow':'none');if(!Array.isArray(x.dates))x.dates=[];if(!Array.isArray(x.skip))x.skip=[];if(x.kind==='mark')x.rt=['am','noon','pm'].includes(x.rt)?x.rt:'';if(x.kind==='pill'&&!/^#[0-9a-f]{6}$/i.test(x.color||''))x.color='#ef4d5a';});if(!Array.isArray(s.stamps.defs))s.stamps.defs=defaultStamps().defs;if(!s.stamps.log||typeof s.stamps.log!=='object')s.stamps.log={};if(!['am','noon','pm'].includes(s.stamps.lastRt))s.stamps.lastRt='';
  {const st=s.stamps,okT=v=>/^\d{1,2}:\d\d$/.test(v),pt=(Array.isArray(st.pillTimes)&&st.pillTimes.length>=3?st.pillTimes:['08:00','13:00','20:00']).map(v=>okT(v)?v:'08:00'),ix={am:0,noon:1,pm:2};
   if(!isObj(st.log))st.log={};Object.keys(st.log).forEach(k=>{if(!okDate(k)||!isObj(st.log[k]))delete st.log[k];});
   st.defs.forEach(x=>{if(!x)return;x.times=Math.max(1,Math.min(3,+x.times||1));if(x.tday!==undefined){const t={};if(isObj(x.tday))Object.keys(x.tday).slice(-400).forEach(k=>{const v=+x.tday[k];if(okDate(k)&&v>=1&&v<=3)t[k]=v;});if(Object.keys(t).length)x.tday=t;else delete x.tday;}if(typeof st.lastActR!=='string')delete st.lastActR;
     if(!Array.isArray(x.ats)){x.ats=[];if(st.remind){if(x.kind==='pill')x.ats=x.times===1?[pt[0]]:x.times===2?[pt[0],pt[2]]:pt.slice(0,3);else if(x.rt)x.ats=[pt[ix[x.rt]]];}}   // 옛 큰 스위치 · 공통 시각 → 스티커별 시각 (스위치가 꺼져 있었으면 모두 끔)
     x.ats=x.ats.filter(okT).slice(0,x.times);delete x.rt;});
   st.v3=1;st.lastAt=Array.isArray(st.lastAt)?st.lastAt.filter(okT).slice(0,3):[];
   // v4: 내 스티커 9칸 구조. 옛 구조면 스티커만 새 기본 9개로 다시 시작 (옛 스티커는 지난 기록용으로만 남기고 앞으로는 안 깔림)
   if(stOld&&!stOld.v4){const dd=defaultStamps().defs,ids=dd.map(x=>x.id);
     st.defs=dd.concat(st.defs.filter(x=>x&&!ids.includes(x.id)).map(x=>Object.assign(x,{retired:true,rep:'none',dates:[],days:[],skip:[],from:'',to:'',ats:[]})));}
   st.v4=1;delete st.more;st.defs=st.defs.filter(x=>x&&typeof x==='object'&&x.id);
   // v0.221 내 스티커 10칸: 모자라면 빈 칸을 칸 끝에 더함
   {const sl=st.defs.filter(x=>!x.retired&&!x.one);let n=sl.length;const at=sl.length?st.defs.indexOf(sl[sl.length-1])+1:st.defs.length;const add=[];while(n<10){add.push({id:'s_e'+n+Math.random().toString(36).slice(2,6),kind:'mark',emoji:'',name:'',empty:true,times:1,rep:'none',days:[],dates:[],skip:[],ats:[]});n++;}if(add.length)st.defs.splice(at,0,...add);}
   // 약 기록 보존(그날 먹은 기록에 같이 저장한 색 · 횟수 · 모양) 검사
   if(!st.snap||typeof st.snap!=='object'||Array.isArray(st.snap))st.snap={};
   Object.keys(st.snap).forEach(k=>{const o=st.snap[k];if(!o||typeof o!=='object'||!st.log[k]){delete st.snap[k];return;}Object.keys(o).forEach(id=>{const v=o[id];if(!v||!/^#[0-9a-f]{6}$/i.test(v.c||'')||!(v.t>=1&&v.t<=3)||!st.log[k][id])delete o[id];else v.h=['round','tab','drop'].includes(v.h)?v.h:'caps';});if(!Object.keys(o).length)delete st.snap[k];});
   st.defs.forEach(x=>{if(x.kind==='pill')x.shape=['round','tab','drop'].includes(x.shape)?x.shape:'caps';if(x.empty){x.empty=true;x.kind='mark';x.emoji='';x.name='';}
     if(x.wtypes!==undefined)x.wtypes=Array.isArray(x.wtypes)?x.wtypes.filter(k=>typeof k==='string'&&k.length<=6).slice(0,30):[];});   // 근무 맞춤 근무타입
   // ＋ 로 고른 스티커 중 날짜 · 규칙 · 기록이 하나도 없는 것은 정리
   st.defs=st.defs.filter(x=>!(x.one&&!x.retired&&!(x.dates||[]).length&&(!x.rep||x.rep==='none')&&!Object.keys(st.log).some(k=>st.log[k]&&st.log[k][x.id])));}
  s.alarms=s.alarms.map(a=>Object.assign({noHol:false,skipAt:0},a));
  ['ddays','companyHols','requests','events'].forEach(k=>{if(!Array.isArray(s[k]))s[k]=[];s[k]=s[k].filter(isObj);});
  s.events=s.events.map(e=>Object.assign({},e,{id:okId(e.id)?e.id:uid(),kind:/^[a-z]{1,12}$/.test(e.kind||'')?e.kind:'memo',to:e.to==='guest'?'guest':'host',k:okDate(e.k)?e.k:'',text:cutMulti(e.text,300)}));
  // 휴무일 · 기념일: kind 'off'(휴무로 표시) | 'memo'(메모만), remind = 전날 알림
  s.companyHols=s.companyHols.filter(x=>okDate(x.date)&&x.name).map(x=>Object.assign({kind:'off',emoji:'',remind:false},x,{name:cutTxt(x.name,30),emoji:cutTxt(x.emoji,8)}));
  // D-day 는 없어짐 → 기념일(메모만)로 옮김
  if(s.ddays.length){
    s.ddays.forEach(x=>{if(x&&x.name&&x.date)s.companyHols.push({id:x.id||uid(),name:x.name,date:x.date,yearly:!!x.yearly,kind:'memo',emoji:x.emoji||'⭐',remind:true});});
    s.ddays=[];
  }
  // 알림: 예전 "전날 알림" 체크 → 며칠 전 여러 개 + 시각
  s.companyHols.forEach(x=>{
    if(!Array.isArray(x.rem))x.rem=x.remind?[1]:[];
    x.rem=[...new Set(x.rem.map(Number))].filter(v=>REM_DAYS.includes(v)).sort((a,b)=>b-a);
    if(!/^\d\d:\d\d$/.test(x.remAt||''))x.remAt='20:00';
    x.remind=x.rem.length>0;
  });
  // 메모: 예전(문자열 / {text,shared}) → 지금(여러 개 목록)
  const mm={};
  for(const [k,v] of Object.entries(s.memos||{})){
    if(!okDate(k))continue;
    const list=Array.isArray(v)?v:typeof v==='string'?[{text:v,shared:false}]:[{text:(v&&v.text)||'',shared:!!(v&&v.shared)}];
    const clean=list.filter(x=>x&&x.text).map(x=>({id:x.id||uid(),text:String(x.text),shared:!!x.shared,by:x.by||'host',t:x.t||Date.now(),...(okDate(x.till)&&x.till>k?{till:x.till,...(x.shared&&/^#[0-9a-f]{6}$/i.test(x.pc||'')?{pc:x.pc}:{})}:{}),...(x.notify?{notify:true}:{}),...(Array.isArray(x.to)&&x.to.length?{to:x.to.filter(u=>typeof u==='string').slice(0,12)}:{}),...(/^#[0-9a-f]{6}$/i.test(x.color||'')?{color:x.color}:{}),...(x.todo?{todo:true}:{}),...(x.todo&&x.done?{done:true}:{}),...(/^\d{1,2}:\d\d$/.test(x.time||'')?{time:x.time,...(x.al==='0'||x.al==='10'?{al:x.al}:{})}:{})}));   // 메모 색 · 할 일 · 시간 · 알림은 내 폰에만 (다시 켜도 남게)
    if(clean.length)mm[k]=clean;
  }
  // 예전 "가족 메모"(게스트가 쓴 것)는 가족 메모로 합침
  for(const [k,v] of Object.entries((o&&o.familyMemos)||{})){
    if(!v)continue;
    (mm[k]=mm[k]||[]).unshift({id:uid(),text:String(v),shared:true,by:'guest',t:Date.now()});
  }
  delete s.familyMemos;
  s.memos=mm;
  // 월 메모 → 포스트잇: 예전 할 일들은 "할 일" 포스트잇 한 장(가족 / 나만 따로)에, 메모는 한 장씩
  for(const mk of Object.keys(s.board||{})){
    const out=[],lists={};
    (s.board[mk]||[]).forEach(x=>{
      if(!x)return;
      if(x.type){out.push(x);return;}
      const shared=x.shared!==false;
      if((x.kind||'todo')==='todo'){
        const g=shared?'f':'m';
        if(!lists[g]){lists[g]={id:uid(),type:'list',title:'할 일',lines:[],shared,by:x.by||'host',t:x.t||Date.now(),color:'y'};out.push(lists[g]);}
        lists[g].lines.push({id:x.id||uid(),text:String(x.text||''),done:!!x.done,doneBy:x.doneBy||''});
      }else out.push({id:x.id||uid(),type:'note',text:String(x.text||''),shared,by:x.by||'host',t:x.t||Date.now(),color:'y'});
    });
    s.board[mk]=out.map(n=>Object.assign({title:'',lines:[],text:'',color:'y',repeat:false,dateAuto:true,date:'',reacts:{},torn:false,tornAt:0},n)).map(n=>{n.lines=Array.isArray(n.lines)?n.lines.filter(isObj):[];if(!isObj(n.reacts))n.reacts={};return n;});
  }
  if(!s.boardCarry||typeof s.boardCarry!=='object')s.boardCarry={};
  // 알람 새 항목 기본값
  s.alarms=s.alarms.map(a=>Object.assign({sound:true,vib:true,vol:100,ramp:false,tone:'',toneName:'기본 알람음',snMin:5,snMax:3,once:false,until:0},a));
  // v0.113 직접 추가한 가족: 가는 곳 이름 · 달력마다 스티커판 (예전에 내 스티커를 빌려 붙인 건 그 모양 그대로 옮김)
  try{const okT=v=>typeof v==='string'&&/^\d{1,2}:\d\d$/.test(v),okHx=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
    const ftN=L=>Array.isArray(L)?L.filter(t=>t&&typeof t.k==='string'&&t.k).slice(0,20).map(t=>{const o={k:t.k.slice(0,16),name:cutTxt(t.name,10)};const ab=[...String(t.ab||'').trim()].slice(0,2).join('');if(ab)o.ab=ab;if(t.rest)o.rest=true;else{if(okT(t.s)&&okT(t.e)){o.s=t.s;o.e=t.e;}o.color=okHx(t.color)?t.color:'#a3d4b5';}return o;}):null;
    (s.family||[]).forEach(m=>{if(!m||m.kind==='sched'||m.kind==='shift')return;   // v0.117 일정 종류 · 위치 · 구간
      if(m.ftypes!==undefined){const L=ftN(m.ftypes);if(L&&L.length&&L.some(t=>!t.rest)&&L.some(t=>t.rest))m.ftypes=L;else delete m.ftypes;}
      if(m.loc!==undefined&&!(typeof m.loc==='string'&&/^\d{5}(\d{5})?$/.test(m.loc)))delete m.loc;
      if(m.home!==undefined&&!(typeof m.home==='string'&&/^\d{5}(\d{5})?$/.test(m.home)))delete m.home;
      if(m.eras!==undefined){const E=Array.isArray(m.eras)?m.eras.filter(e=>e&&okDate(e.from)).slice(0,20).map(e=>{const o={from:e.from};const L=ftN(e.ftypes);if(L&&L.length&&L.some(t=>!t.rest)&&L.some(t=>t.rest))o.ftypes=L;if(Array.isArray(e.days))o.days=e.days.filter(w=>Number.isInteger(w)&&w>=0&&w<=6);o.vac=Array.isArray(e.vac)?e.vac.filter(v=>v&&okDate(v.from)&&okDate(v.to)):[];if(typeof e.loc==='string'&&/^\d{5}(\d{5})?$/.test(e.loc))o.loc=e.loc;return o;}).sort((a,b)=>a.from<b.from?-1:1):[];if(E.length)m.eras=E;else delete m.eras;}
      delete m._ed;
    });}catch(e){}
  try{(s.family||[]).forEach(m=>{if(!m||m.kind==='sched')return;
    if(m.label!==undefined){const l=cutTxt(m.label,6).trim();if(l)m.label=l;else delete m.label;}
    if(Array.isArray(m.sdefs)){const okT=v=>typeof v==='string'&&/^\d{1,2}:\d\d$/.test(v),okA=a=>isObj(a)&&okT(a.s)&&okT(a.e),ds=a=>Array.isArray(a)?a.filter(w=>Number.isInteger(w)&&w>=0&&w<=6).slice(0,7):[];
      m.sdefs=m.sdefs.filter(x=>x&&typeof x.id==='string'&&x.id).map(x=>{const o={id:x.id.slice(0,40),emoji:String(x.emoji||'⭐').slice(0,300),name:cutTxt(x.name,12)};if(x.retired)o.retired=true;
        const R=['none','dow','daily','work','month'];o.rep=R.includes(x.rep)?x.rep:'none';o.days=ds(x.days);o.times=Math.max(1,Math.min(3,+x.times||1));
        o.dates=Array.isArray(x.dates)?x.dates.filter(okDate).slice(-200):[];o.skip=Array.isArray(x.skip)?x.skip.filter(okDate).slice(-200):[];o.ats=Array.isArray(x.ats)?x.ats.filter(okT).slice(0,3):[];
        if(Array.isArray(x.wtypes))o.wtypes=x.wtypes.filter(k=>typeof k==='string').slice(0,30);if(okDate(x.from))o.from=x.from;if(okDate(x.to))o.to=x.to;if(x.noHol)o.noHol=true;if(x.noWknd)o.noWknd=true;if(Number.isInteger(x.mday)&&x.mday>=1&&x.mday<=31)o.mday=x.mday;
        if(okA(x.act)){o.act={s:x.act.s,e:x.act.e,r:typeof x.act.r==='string'?x.act.r.slice(0,12):'',since:okDate(x.act.since)?x.act.since:''};
          const od=ds(x.act.days);if(od.length&&o.rep==='none'){o.rep='dow';o.days=od;}   // v0.120 예전 활동 요일 → 요일 반복
          if(Array.isArray(x.act.skip))o.skip=[...new Set(o.skip.concat(x.act.skip.filter(okDate)))].slice(-200);}
        return o;}).slice(0,300);}
    else if(m.sdefs!==undefined)delete m.sdefs;
    if(m.actDone!==undefined&&!isObj(m.actDone))delete m.actDone;
    if(!m.sdefs&&m.stk&&typeof m.stk==='object'&&Object.keys(m.stk).length)m.sdefs=manSdefsInit(m,(s.stamps&&Array.isArray(s.stamps.defs))?s.stamps.defs:[]);
  });}catch(e){}
  try{const okT=v=>typeof v==='string'&&/^\d{1,2}:\d\d$/.test(v);(s.stamps.defs||[]).forEach(x=>{if(x&&x.act!==undefined&&!(isObj(x.act)&&okT(x.act.s)&&okT(x.act.e)))delete x.act;else if(x&&x.act){x.act={s:x.act.s,e:x.act.e,r:typeof x.act.r==='string'?x.act.r.slice(0,12):'',since:okDate(x.act.since)?x.act.since:''};}});if(s.stamps.actDone!==undefined&&!isObj(s.stamps.actDone))delete s.stamps.actDone;}catch(e){}   // v0.114 스티커 활동
  try{const okT=v=>typeof v==='string'&&/^\d{1,2}:\d\d$/.test(v);s.rmemos=Array.isArray(s.rmemos)?s.rmemos.filter(r=>r&&typeof r.id==='string'&&typeof r.text==='string'&&r.text.trim()&&Number.isInteger(r.md)&&r.md>=-3&&r.md<=28&&r.md!==0).slice(0,100).map(r=>{const o={id:r.id.slice(0,20),text:String(r.text).slice(0,2000),md:r.md,sh:Array.isArray(r.sh)?r.sh.filter(x=>typeof x==='string').slice(0,20):[],miss:r.miss==='next'?'next':'skip',from:okDate(r.from)?r.from:'',t:+r.t||0};if(typeof r.color==='string'&&/^#[0-9a-f]{6}$/i.test(r.color))o.color=r.color;if(r.todo)o.todo=true;if(okT(r.time)){o.time=r.time;if(r.al==='0'||r.al==='10')o.al=r.al;}['done','skip'].forEach(f=>{if(Array.isArray(r[f]))o[f]=r[f].filter(okDate).slice(-120);});return o;}):[];}catch(e){s.rmemos=[];}   // v0.118 반복 메모
  if(o&&o.onboarded===undefined&&o.pattern)s.onboarded=true;   // 예전 사용자는 처음 설정 건너뜀
  s.piOrder=(()=>{const o2=isObj(s.piOrder)?s.piOrder:{},r={};Object.keys(o2).filter(k=>/^\d{4}-\d\d$/.test(k)&&Array.isArray(o2[k])).slice(-24).forEach(k=>{r[k]=o2[k].filter(x=>typeof x==='string').slice(0,200);});return r;})();   // v0.158 포스트잇 순서
  return s;
}
let loadNote='';   // 불러올 때 있었던 일: 'parse'(저장 값을 못 읽음) · 'partial'(문제 칸만 기본값으로 돌림)
function keepBad(raw,why){   // 못 읽은 저장 값은 지우지 않고 따로 남겨 둠 (나중에 파일로 보내 복구할 수 있게)
  try{localStorage.setItem(KEY+':bad',String(raw).slice(0,2000000));localStorage.setItem(KEY+':badinfo',JSON.stringify({at:Date.now(),why}));}catch(e){}
}
function salvage(o,info){   // normalize 가 걸리면 칸을 하나씩 더해 보며, 문제 되는 칸만 빼고 나머지는 살림
  const acc={},bad=[];
  if(isObj(o))for(const k of Object.keys(o)){
    const t=Object.assign({},acc);t[k]=o[k];
    try{normalize(JSON.parse(JSON.stringify(t)));acc[k]=o[k];}catch(e){bad.push(k);}
  }
  if(info)info.bad=bad;
  return normalize(JSON.parse(JSON.stringify(acc)));
}
function safeNormalize(o,info){try{return normalize(o);}catch(e){return salvage(o,info);}}
function load(){
  let j=null;
  try{j=localStorage.getItem(KEY)||localStorage.getItem(OLD_KEY);}catch(e){}
  if(!j)return defaults();
  let o;
  try{o=JSON.parse(j);}catch(e){keepBad(j,'parse');loadNote='parse';return defaults();}
  try{return normalize(o);}catch(e){}
  keepBad(j,'normalize');loadNote='partial';
  try{return salvage(JSON.parse(j));}catch(e){loadNote='parse';return defaults();}
}
let S=load();setTimeout(()=>{if(!ovSnap)ovSnap={...(S.overrides||{})};try{if(fillDefTimes())save();}catch(e){}},0);   // v0.234 시간이 없는 근무에 기본 시간 저장   // v0.135 근무 기록: 처음 상태

/* 안드로이드 앱이 알려주는 알람 권한 상태 (브라우저에서는 빈 목록) */
const ISSUE_TXT={exact:'정확한 알람 권한이 필요해요',notif:'알림을 허용해야 알람이 떠요',fsi:'잠금화면에 알람 화면을 띄우는 권한이 필요해요',batt:'배터리를 "제한 없음"으로 해야 알람이 안 늦어요'};
const PERM_KEYS=['notif','exact','fsi','batt'],PERM_NAME={notif:'알림 허용',exact:'정확한 시간에 알람',fsi:'잠금화면에 알람 화면',batt:'배터리 제한 없음'};
const PERM_ICON={notif:'bell',exact:'clock',fsi:'smartphone',batt:'battery'};
const SAMSUNG_TIP='삼성: 설정 › 배터리 › 백그라운드 사용 제한 › 절전 예외 앱에도 언제쉬어를 넣어 주세요';
function nativeIssues(){
  try{
    if(window.AndroidBridge&&typeof window.AndroidBridge.status==='function'){
      const t=String(window.AndroidBridge.status()||'');
      return t?t.split(','):[];
    }
  }catch(e){}
  return [];
}

/* 알람을 안드로이드 앱(WebView)에 넘기는 통로.
 * 안드로이드 껍데기 앱이 window.AndroidBridge.setAlarms(json) 을 제공하면 자동으로 호출됩니다.
 * 브라우저에서는 아무 일도 하지 않습니다. */
// v0.126 알람 끄기 화면 문구 한 줄: 가장 급한 것 하나 (알람 맞출 때 미리 만듦 · 앱을 열거나 동기화하면 다시)
function alarmMsg(x){
  if(S.alarmMsg===false)return '';
  try{
    const k=fmt(x.d),today=fmt(new Date()),work=x.sh&&!isRest(x.sh);
    const rq=(S.requests||[]).filter(r=>r.st==='pending'&&(!r.srv||r.dir==='in')&&r.date>=today).length;
    if(rq)return `💌 가족이 보낸 근무 요청이 ${rq}건 기다리고 있어요`;
    if(work&&x.sh!=='교'){const h=dayHours(x.d);if(h&&h.dae)return '💪 대근 날이에요. 다음 달 월급에 보탬이 될 거예요!';}
    const ms=(visibleMemos(k)||[]).filter(m=>m&&m.text&&!m.done);
    if(ms.length){const t=String(ms[0].text).replace(/\s+/g,' ');const c=t.length>14?t.slice(0,14)+'…':t;return ms.length>1?`📝 오늘 메모 ${ms.length}개 (${c} 외 ${ms.length-1}건)`:`📝 오늘 · ${c}`;}
    if(work&&wlOn()&&wlHas(fmt(addDays(x.d,-1))))return '📋 출근 전 확인! 어제 남겨둔 인계 사항이 있어요';
    const left=boardLeft(k.slice(0,7));if(left)return `📌 이번 달 포스트잇 할 일이 ${left}개 남았어요`;
    if(ad('comp')){const dd=(S.companyHols||[]).filter(z=>z.kind==='memo').map(z=>({n:z.name||'',k:ddayNext(z)})).filter(z=>z.k>=k).map(z=>({...z,n2:Math.round((parse(z.k)-parse(k))/864e5)})).filter(z=>z.n2>0&&z.n2<=7).sort((a,b)=>a.n2-b.n2)[0];
      if(dd&&dd.n)return `✈️ ${String(dd.n).slice(0,12)}까지 D-${dd.n2}!`;}
    const day=Math.floor(x.d.getTime()/864e5);
    if(work){let n=0,d=x.d;while(n<14&&!isRest(shiftOf(d))){d=addDays(d,1);n++;}let r=0;while(r<14&&isRest(shiftOf(d))){d=addDays(d,1);r++;}
      if(n<=1&&r)return `🎉 오늘만 일하면 ${r}일 쉬어요!`;
      const h=+String(x.a&&x.a.time||'0').split(':')[0],night=typeOf(x.sh).color==='v:night'||h>=13;
      if(n>1&&day%2===0)return `💪 ${shiftLabel(x.sh)} 근무, 앞으로 ${n}일 남았어요. 파이팅!`;
      return night?'🌙 야간 근무 피곤하시겠지만, 무사히 마치고 웃으며 만나요':'☀️ 상쾌한 아침! 오늘도 다치지 말고 안전하게';}
    const B=['🍀 오늘도 안전하게, 무사히 다녀오세요!','👷 안전이 제일! 오늘도 다치지 말고 다녀오세요','☕ 따뜻한 커피 한 잔과 함께 기분 좋은 하루 시작하세요','✨ 어제보다 더 좋은 하루가 될 거예요. 파이팅!'];
    return B[((day%B.length)+B.length)%B.length];
  }catch(e){return '';}
}
function pushAlarmsToNative(){
  try{alarmTakeSkips();}catch(e){}
  try{
    if(window.AndroidBridge&&typeof window.AndroidBridge.setAlarms==='function'){
      // col · ico: 끄기 화면을 근무 색으로(주간 하늘 · 야간 살구 …) · 이름 앞 ☀️/🌙. 매일 알람은 빈 값(라벤더)
      const colOf={};   // (근무마다 한 번만 계산 · 주간 · 야간은 앱이 어두운 모드여도 밝은 파스텔 값 — 끄기 화면이 폰 모드에 따라 따로 어둡게 그림)
      const look=x=>{if(x.a.shift==='*')return {col:'',ico:''};const ty=typeOf(x.sh),h=+String(x.a.time||'0').split(':')[0];
        if(!(x.sh in colOf)){const tc=tColors(ty);colOf[x.sh]=ty.color==='v:day'?'#a6c6e2':ty.color==='v:night'?'#e0b8a3':(tc?cssHex(tc.bg):'');}
        return {col:colOf[x.sh],ico:ty.color==='v:night'||h>=15||h<3?'🌙':'☀️'};};
      const wxq=x=>{if(x.a.wx===false)return {};const w=wxAlarmQ(x);return w?{wx:1,wxq:w.q,wxp:w.p}:{};};
      const list=buildSchedule(180).filter(x=>!x.a.wxOnly).map(x=>({...wxq(x),...(()=>{const m=alarmMsg(x);return m?{msg:m}:{};})(),id:`${x.a.id}_${fmt(x.d)}`,at:x.at.getTime(),label:x.a.label||'',shift:x.sh,shiftName:shiftLabel(x.sh),time:x.a.time,
        sound:x.a.sound!==false,vib:x.a.vib!==false,vol:x.a.vol??100,ramp:!!x.a.ramp,tone:x.a.tone||'',snMin:x.a.snMin||5,snMax:x.a.snMax??3,...look(x),pre:!x.a.once&&x.a.pre5!==false&&x.at.getTime()!==x.a.skipAt?1:0}));   // pre: v0.142 5분 전 알림
      window.AndroidBridge.setAlarms(JSON.stringify(list));
      // 반복 알람이 켜져 있으면 폰이 "목록이 끝나기 한 주 전" 알림을 예약 (앱을 한 번도 안 열면 180일 뒤 알람이 끊기므로)
      if(typeof window.AndroidBridge.setAlarmsCont==='function')window.AndroidBridge.setAlarmsCont(S.alarms.some(a=>a.on&&!a.once));
    }
  }catch(e){}
}
/* 홈 화면 위젯(1칸 · 2칸)에 보여줄 앞으로 2주의 날짜별 근무 · 스티커 · 메모 → window.AndroidBridge.setWidgetData(json) */
let wgT=null;
function cssHex(v){   // var(--day) 같은 CSS 색을 #rrggbb 로 (위젯은 CSS 변수를 못 읽음)
  try{
    v=String(v||'');if(!v)return '';
    const m=v.match(/^var\((--[\w-]+)\)$/);if(m)v=getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
    if(/^#[0-9a-f]{6}$/i.test(v))return v;
    const c=document.createElement('canvas').getContext('2d');c.fillStyle='#000000';c.fillStyle=v;const r=c.fillStyle;
    return /^#[0-9a-f]{6}$/i.test(r)?r:'';
  }catch(e){return '';}
}
const holPair=h=>h?{h2:holTwo(h),h1:holOne(h)}:{};   // 위젯 칸의 공휴일 글자: 앱 달력과 같은 줄임말 (두 글자 · 한 글자) — 위젯은 자리에 맞춰 둘 중 하나를 그림
function widgetJson(){
  const t0=new Date(),days=[],ic={};
  // 한 달 위젯이 넘겨 볼 수 있는 달: 지난 2달 ~ 다음 12달 (그 달들의 달력 첫 줄 ~ 끝 줄까지 · 7일 위젯 · 큰 창이 쓰던 6일 전 ~ 60일 뒤도 그대로 포함). 위젯은 데이터가 그 달 달력을 다 덮는 달까지만 넘겨 줌
  const ws=S.weekStart===1?1:0,day0=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate());
  const p1=new Date(t0.getFullYear(),t0.getMonth()-2,1),nl=new Date(t0.getFullYear(),t0.getMonth()+12+1,0);
  const gs=addDays(p1,-((p1.getDay()-ws+7)%7)),ge=addDays(nl,6-((nl.getDay()-ws+7)%7));
  const dn=x=>Math.round((new Date(x.getFullYear(),x.getMonth(),x.getDate())-day0)/864e5);
  const iS=Math.min(-6,dn(gs)),iE=Math.max(59,dn(ge));
  // 사람 바꾸기(한 달 위젯 이름 칩): 앱 가족 탭과 같은 사람들 — 날마다 근무 글자(s) + 글자별 색(t: 글자 → [배경, 글씨] · 빈 목록 = 쉬는 날 글자만) + 가족이 올린 스티커(k)
  const fam=(S.family||[]).concat(famPeers()).slice(0,6);
  const people=fam.map((m,j)=>({id:String(m.id||''),n:String(m.name||'가족').slice(0,6),c:m.color||FAM_COL[j%6],t:{},s:[],k:{}}));
  const stkD=x=>{const q=x.d||{};return q.k==='p'?{p:1,c:/^#[0-9a-f]{6}$/i.test(q.c||'')?q.c:'#7e57c2',h:({r:'round',t:'tab',d:'drop'})[q.h]||'caps',n:x.n,N:Math.max(1,Math.min(3,q.t||1))}:{e:typeof q.img==='string'?'⭐':icoTxt(q.e||'⭐','⭐'),n:x.n,N:1};};
  for(let i=iS;i<=iE;i++){   // 6일 전 ~ 14일 뒤는 자세히 · 그 밖은 근무 · 공휴일 · 메모 3줄 · 스티커(하루 최대 4개)만 (한 달 칸용)
    const d=addDays(t0,i),k=fmt(d),sh=shiftOf(d),hol=holName(k)||(ad('comp')?offHolName(k):''),pers=persOn(k);
    const c=(pers||sh===''||sh===NONE_K)?null:tColors(typeOf(sh));
    const rest=!pers&&sh!==''&&sh!==NONE_K&&isRest(sh);
    const mapStk=x=>{
      const id=String(x.s.id),nm=String(x.s.name||'').slice(0,12),bell=stAts(x.s).length?{b:1}:{};   // b:1 = 알림 시각을 정해 둔 스티커 (위젯 큰 창에 🔔 · 앱과 같은 기준)
      if(x.s.kind==='pill')return {id,nm,p:1,c:cssHex(x.v&&x.v.col)||'#7e57c2',h:String((x.v&&x.v.shape)||'caps'),n:x.n,N:Math.max(1,Math.min(3,x.v.N||1)),...bell};
      const e=x.s.emoji;
      if(isPhoto(e)){const pid=e.slice(1),src=(S.icons||{})[pid];if(typeof src==='string'&&src.length<30000){ic[pid]=src;return {id,nm,i:pid,n:x.n,N:x.v.N,...bell};}}
      return {id,nm,e:icoTxt(e,'⭐'),n:x.n,N:x.v.N,...bell};
    };
    const vm=visibleMemos(k),m1=vm.find(x=>x.shared)||vm[0],bd=boardOnDate(k)[0],dd=ddayHits(k)[0];
    const wm=t=>linkParts(firstLine(t)).map(q=>q.u?'\u0001'+linkUrl(q.u)+'\u0003링크\u0002':q.t).join('');   // 주소는 앱처럼 "링크"(위젯이 파랗게 그림)
    const ml=[],wl1=wlHas(k);if(wl1)ml.push('📋 '+wlName());   // 업무 일지: 메모 맨 위 한 줄(표시만 · 글은 안 보냄) → 위젯은 wl:1 로 첫 줄을 연보라로
    // v0.233 기간 띠: 업무 일지 다음 줄 (pv: 색 · s 왼쪽 끝 · e 오른쪽 끝 · b 진짜 시작 · x 진짜 끝) · 띠로 보이는 메모는 메모 줄에서 뺌
    let pv=null,pv0=null;{const p0=pers?null:perOn(k)[0];if(p0){const L=leadOf(d),pc=perMc(p0.m);pv={c:cssHex(pc)||'#f08a3c',...(k===p0.k0||L===0?{s:1}:{}),...(p0.m.till===k||L===6?{e:1}:{}),...(k===p0.k0?{b:1}:{}),...(p0.m.till===k?{x:1}:{})};ml.push(pv.s?perName(p0.m).slice(0,40):' ');pv0=p0;}}
    const mld=[];vm.filter(x=>x.shared&&!x.till).concat(vm.filter(x=>!x.shared&&!x.till)).forEach(x=>{if(x.todo&&x.done)mld.push(ml.length);ml.push(wm(x.text));});   // mld: 완료한 할 일 줄 번호 → 위젯이 줄 긋고 흐리게boardOnDate(k).forEach(n=>ml.push(wm(piLabel(n))));ddayHits(k).forEach(x=>ml.push(x.name));
    const fm=vm.filter(x=>x.shared).slice(0,3).map(x=>wm(x.text).slice(0,40));   // 가족 메모(♥): 가족 달력(보기만)에도 보이는 것 — 한 달 위젯에서 다른 사람 달력을 볼 때 씀
    people.forEach((p,j)=>{
      const m=fam[j];let key='',col=null;
      if(m.kind==='sched'||m.kind==='shift'){
        const s2=m.kind==='sched'?schShift(m.sch,d):famShift(m,d);
        if(s2!==''&&s2!==NONE_K){
          const cc=tColors(m.kind==='sched'?schType(m.sch,s2):typeOf(s2));
          if(cc){key=s2;col=[cssHex(cc.bg),cssHex(cc.fg)];}else if(m.kind==='sched'?schRest(m.sch,s2):isRest(s2)){key=s2;col=[];}
        }
      }else if(famUsesTypes(m)){const t=famTypeAt(m,d);key=ftAb(t);col=t.rest?[]:[okHex(t.color)?t.color:'#a3d4b5','#1d2a22'];}
      else if(memberOff(m,d)){key='휴';col=[];}
      else{key=m.kind==='student'?'학교':m.kind==='free'?'일정':'회사';col=['#d9dee5','#2b3340'];}
      if(key&&!p.t[key])p.t[key]=col;
      p.s.push(key);
      if(m.kind==='sched'){const sk=schStk(m.sch,k).slice(0,4).map(stkD);if(sk.length)p.k[k]=sk;}
      // v0.134 위젯 날짜 창도 내 것처럼: 직접 추가한 가족 = 일정 · 스티커(체크) · 메모 · 날씨 / 근무표 올린 가족 = 날씨
      if(i>=-6&&i<=14){try{
        const pd={},now=Date.now();
        if(m.kind!=='sched'){
          pd.l=String(manLabel(m,d)||'').slice(0,30);
          const on=(m.stk&&m.stk[k])||[],defs=manSdefs(m).filter(x=>!x.retired||on.includes(x.id));
          const st=defs.filter(x=>on.includes(x.id)||manPlanned(m,x,k)).slice(0,8).map(x=>({id:String(x.id),nm:String(x.name||'').slice(0,12),e:typeof x.img==='string'?'⭐':icoTxt(x.emoji||'⭐','⭐'),n:on.filter(y=>y===x.id).length,N:Math.max(1,x.times||1)}));
          if(st.length){pd.st=st;p.k[k]=st.slice(0,4).map(x=>({e:x.e,n:x.n,N:x.N}));}
          const nt=m.notes&&m.notes[k];if(nt)pd.nt=String(nt).slice(0,40);
        }
        if(i===0||i===1){const c=m.kind==='sched'?(famSchedWx(m,d,now)||{}).c:famUsesTypes(m)&&wxOn()?(famWx(m,d,now)||{}).c:null;const w=c&&c.k?wxWidgetOf(c,now):null;if(w)pd.wx=w;}
        if(Object.keys(pd).length)(p.d=p.d||{})[k]=pd;
      }catch(e){}}
    });
    const rq0=rqRing((S.requests||[]).filter(r=>r.date===k&&(!r.srv||r.dir==='in')).map(r=>r.st==='applied'?{...r,st:'accepted'}:r)).slice(3),   // 요청 링 (한 달 위젯 · 칸 채우기 모양): ask · hold · ok · no — 달력과 같은 기준(답한 요청은 3일 뒤 사라짐)
      nfm=vm.filter(x=>x.shared&&!x.till&&x.text.trim()).length,   // 메모 줄 맨 앞 nfm 개가 가족 메모(♥) — 위젯이 연보라 칸으로 그림
      base={k,w:d.getDay(),m:d.getMonth()+1,d:d.getDate(),ov:!pers&&S.ovDot!==false&&!!(S.overrides&&S.overrides[k]),hol:hol||'',...holPair(hol),t:(c||rest)?sh:'',...((c||rest)?{tn:String(typeOf(sh).name||sh).slice(0,5)}:{}),bg:c?cssHex(c.bg):'',fg:c?cssHex(c.fg):'',...(rq0?{rq:rq0}:{}),...(nfm?{nf:Math.min(nfm,4)}:{}),...(pv?{pv}:{}),...(wl1?{wl:1,wlr:{n:wlName(),c:wlCounts(k).map(([sc,n])=>`${sc.n} ${n}`).join(' · '),s:wlSecTexts(k)}}:{}),...(c&&!rest&&timesCustom(sh)?{wt:`${timesOf(sh).start}~${timesOf(sh).end}`,wn:shiftLabel(sh)}:{})};   // wt · wn: 근무 시간을 정해 둔 근무 날 — 위젯 날짜 창에 "주간 06:00~18:00"
    if(i<-6||i>=14){const chf=compHol(k),anf=ddayHits(k);days.push({...base,far:i<-6?2:1,stk:stampsOn(k).slice(0,4).map(x=>{const o=mapStk(x);delete o.id;delete o.b;return o;}),ms:ml.slice(0,3).map(x=>String(x||'').slice(0,40)),...(mld.some(i=>i<3)?{msd:mld.filter(i=>i<3)}:{}),
      ...(fm.length?{fm}:{}),...(chf?{ch:String(chf).slice(0,30)}:{}),...(anf.length?{an:anf.slice(0,4).map(x=>(icoTxt(x.emoji||'⭐','⭐')+' '+x.name).slice(0,36))}:{})});continue;}   // 먼 날(지난 날 · 2주 뒤부터): 큰 창에는 스티커 · 메모를 안 싣고 앱에서 보게 함
    const sa=stampsOn(k).slice(0,12).map(mapStk);
    const stk=sa.slice(0,4);
    const memo=m1?firstLine(m1.text):bd?piLabel(bd):dd?dd.name:'';
    const mi=[];   // 위젯 창에서 크게 보여줄 메모 · 할 일 (r: m=메모 할 일(체크) · l=포스트잇 체크 줄 · t=글만 / tm=시간 · c=색)
    const MI=40;
    vm.forEach(x=>{if(mi.length>=MI)return;const it={r:x.todo&&(!x.shared||x.by===role())?'m':'t',id:String(x.id),t:wm(x.text).slice(0,160),d:!!(x.todo&&x.done)};if(x.time)it.tm=tfmt(x.time);const cc=x.color?cssHex(x.color):'';if(cc)it.c=cc;if(x.shared){it.f=1;if(x.by!==role())it.o=1;}mi.push(it);});
    if(pv0&&pv0.k0!==k)mi.unshift({r:'t',t:(firstLine(pv0.m.text)+` · ${md(pv0.k0)} ~ ${md(pv0.m.till)}`).slice(0,160),d:false,...(pv0.m.shared?{f:1,...(pv0.m.by!==role()?{o:1}:{})}:{})});   // v0.233 기간 띠 가운데 날: 위젯 날짜 창에도 한 줄
    boardOnDate(k).forEach(n=>{if(n.type==='list'){if(mi.length<MI)mi.push({r:'t',t:('☑ '+(n.title||'할 일')).slice(0,60),d:false});(n.lines||[]).slice(0,12).forEach(l=>{if(mi.length<MI)mi.push({r:'l',pid:String(n.id),lid:String(l.id),t:wm(l.text).slice(0,120),d:!!l.done});});}else if(mi.length<MI)mi.push({r:'t',t:wm(n.text).slice(0,160),d:false});});
    const chn=compHol(k);
    days.push({...base,...(i===0||i===1?wxWidget(d):{}),stk,memo:String(memo||'').slice(0,40),ms:ml.slice(0,4).map(x=>String(x||'').slice(0,40)),...(mld.some(i=>i<4)?{msd:mld.filter(i=>i<4)}:{}),sa,mi,
      ...(fm.length?{fm}:{}),...(chn?{ch:String(chn).slice(0,30)}:{}),...(ddayHits(k).length?{an:ddayHits(k).slice(0,4).map(x=>(icoTxt(x.emoji||'⭐','⭐')+' '+x.name).slice(0,36))}:{})});
  }
  return JSON.stringify({v:1,theme:S.widget.theme,alpha:S.widget.alpha,look:S.widget.look,bg:wgBg(),today:{look:S.todayLook||'b',color:S.todayColor||''},tune:{cover:S.tune.cover,inner:S.tune.inner},lines:3,ws,days,ic,...(people.length?{people}:{})});
}
/* 위젯 창에서 체크한 것(대기 목록)을 앱 기록에 반영 + 위젯 [앱에서 열기]로 온 날짜 열기 */
function applyWidgetActions(){
  if(!(window.AndroidBridge&&typeof window.AndroidBridge.takeWidgetActions==='function'))return 0;
  let list=[];try{list=JSON.parse(String(window.AndroidBridge.takeWidgetActions()||'[]'));}catch(e){}
  let n=0;
  list.forEach(a=>{
    if(!a||!a.k)return;
    if(a.t==='mstk'){const m=(S.family||[]).find(x=>String(x.id)===String(a.p));if(!m)return;const x=manSdefs(m).find(y=>y.id===a.id);if(!x)return;const N=Math.max(1,x.times||1),c=Math.max(0,Math.min(N,+a.n||0));m.stk=m.stk||{};const rest=(m.stk[a.k]||[]).filter(y=>y!==a.id);m.stk[a.k]=rest.concat(Array(c).fill(a.id));if(!m.stk[a.k].length)delete m.stk[a.k];n++;return;}   // v0.134 위젯 유찬 달력에서 체크
    if(a.t==='stk'){const d=S.stamps.defs.find(x=>x.id===a.id);if(!d)return;const N=stView(d,a.k).N;stampSet(d.id,a.k,Math.max(0,Math.min(N,+a.n||0)));n++;}
    else if(a.t==='memo'){const m=memosOf(a.k).find(x=>String(x.id)===a.id);if(!m||!m.todo)return;if(a.d)m.done=true;else delete m.done;n++;}
    else if(a.t==='line'){const p=boardList(a.k.slice(0,7)).find(x=>String(x.id)===a.pid),l=p&&(p.lines||[]).find(x=>String(x.id)===a.lid);if(!l)return;l.done=!!a.d;l.doneBy=l.done?role():'';if(p.srv)piSrvPush(p);n++;}
  });
  if(n){save();render();toast(`위젯에서 체크한 ${n}개를 반영했어요`);}
  return n;
}
function widgetSync(){
  try{applyWidgetActions();}catch(e){}
  try{
    if(window.AndroidBridge&&typeof window.AndroidBridge.takeOpenDate==='function'){
      const raw=String(window.AndroidBridge.takeOpenDate()||''),mm=raw.match(/^(\d{4}-\d\d-\d\d)(#wl|#wx|#m)?(?:@(.{1,80}))?$/),k=mm?mm[1]:'';   // "#wl": 위젯 날짜 창의 업무 일지 줄 → 일지 팝업까지 · "#wx": 날씨 줄 → 날씨 팝업까지
      // v0.127 "@사람": 위젯 이름 칩으로 가족 달력을 보다 눌렀으면 앱도 그 사람 달력 (연결된 가족만 · 없으면 내 달력)
      const wp=mm&&mm[3]?famPeers().find(p=>p.id===mm[3]):null;
      if(k&&wp){const d=parse(k);if(pageMode)closePage();vcSel.on=false;vcSel.dates=new Set();vcUid=wp.uid;vcY=d.getFullYear();vcM=d.getMonth();if(famView()){tab='cal';render();}else renderFamCalPage();if(mm[2]!=='#m')openVcDay(k);if(mm[2]==='#wx')vcWxPop(k);return;}
      // v0.127 직접 추가한 가족(유찬처럼): 그 사람 달력 + 그 날짜 창
      const wm=mm&&mm[3]&&!wp?(S.family||[]).find(m=>String(m.id)===mm[3]):null;
      if(k&&wm){const d=parse(k);if(pageMode)closePage();manId=wm.id;vcY=d.getFullYear();vcM=d.getMonth();renderManCalPage();if(mm[2]!=='#m')openManDay(k);if(mm[2]==='#wx')famWxPop(wm,k);return;}
      if(k){const d=parse(k);if(pageMode)closePage();tab='cal';setCur(d.getFullYear(),d.getMonth());render();if(mm[2]==='#m')return;   // "#m": 위젯 달력 버튼 → 그 달 달력만 (날짜 창 안 엶)
        openDay(k);if(mm[2]==='#wl'&&wlOn())wlOpen(k);if(mm[2]==='#wx'&&wxOn())wxOpenDay(k);}
    }
  }catch(e){}
}
window.__widgetSync=widgetSync;
function pushWidgetToNative(){
  if(!(window.AndroidBridge&&typeof window.AndroidBridge.setWidgetData==='function'))return;
  clearTimeout(wgT);wgT=setTimeout(()=>{try{window.AndroidBridge.setWidgetData(widgetJson());}catch(e){}},700);
}
/* 기념일 전날 알림 (조용한 알림 한 줄) */
function iyeyo(w){const c=String(w).replace(/[^가-힣]+$/,'').slice(-1).charCodeAt(0);return c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28===0?'예요':'이에요';}
function remAtLabel(t){const [h,m]=(t||'20:00').split(':').map(Number),h12=h%12===0?12:h%12;return `${h<5?'새벽':h<11?'아침':h<17?'낮':h<21?'저녁':'밤'} ${h12}시${m?` ${m}분`:''}`;}
function remShort(x){return (x.rem||[]).length?x.rem.map(v=>REM_SHORT[v]).join(' · '):'';}
// 자는 시간 구간들 [시작ms, 끝ms] (근무 종류별 수면 설정이 켜진 날만)
function sleepWins(from,n){
  const out=[];
  for(let i=-1;i<n;i++){
    const d=addDays(from,i),k=shiftOf(d);
    if(isRest(k))continue;
    try{const p=dayPlan(d,k);if(p.sleep)out.push(p.sleep);}catch(e){}
  }
  return out;
}
function pushRemindersToNative(){
  try{
    if(!(window.AndroidBridge&&typeof window.AndroidBridge.setReminders==='function'))return;
    const out=[],t0=new Date(),now=Date.now();
    for(let i=0;i<=70;i++){
      const d=addDays(new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()),i),k=fmt(d);
      (ad('comp')?(S.companyHols||[]):[]).forEach(x=>{
        if(!(x.rem||[]).length)return;
        if(!(x.date===k||(x.yearly&&x.date.slice(5)===k.slice(5)&&k>=x.date)))return;
        const [h,mi]=(x.remAt||'20:00').split(':').map(Number);
        const ic=icoTxt(x.emoji||(x.kind==='memo'?'⭐':'🏢'),x.kind==='memo'?'🎉':'🏢');
        const when=`${d.getMonth()+1}월 ${d.getDate()}일`,off=x.kind==='memo'?'':'회사 휴무 · ';
        x.rem.forEach(b=>{
          const at=new Date(d.getFullYear(),d.getMonth(),d.getDate()-b,h,mi,0).getTime();
          if(at<=now)return;
          const text=b===0?`${ic} 오늘은 ${x.name}${iyeyo(x.name)}${off?' (회사 휴무)':''}`
            :b===1?`${ic} 내일은 ${x.name}${iyeyo(x.name)} (${off}${when})`
            :`${ic} ${x.name}까지 ${b===7?'일주일':b===3?'사흘':b===2?'이틀':b+'일'} 남았어요 (${off}${when})`;
          out.push({id:`h_${x.id}_${k}_${b}`,at,title:'언제쉬어',text});
        });
      });
    }
    if(S.stamps){
      const sl=sleepWins(new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()),16);
      (S.family||[]).forEach(m=>{if(m.kind==='sched')return;(m.sdefs||[]).filter(x=>!x.retired&&x.ats&&x.ats.length).forEach(x=>{const N=Math.max(1,x.times||1);   // v0.120 가족 스티커 알림 (내 폰에서)
        for(let i=0;i<=14;i++){const d=addDays(new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()),i),k=fmt(d);if(!manStampPlanned(m,x,k))continue;const done=((m.stk||{})[k]||[]).filter(y=>y===x.id).length;
          x.ats.slice(0,N).forEach((tm,j)=>{const [h,mi]=tm.split(':').map(Number),at=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,mi).getTime();if(at<=now||done>j)return;
            out.push({id:`f_${m.id}_${x.id}_${k}_${j}`,at,title:`${icoTxt(x.emoji,'✔')} ${m.name} · ${x.name}`,text:N>1?`${j+1}/${N}번째 · ${m.name} 달력에서 눌러 주세요`:`${m.name} 달력에서 눌러 주세요`});});}});});
      S.stamps.defs.filter(x=>x.ats&&x.ats.length).forEach(x=>{
        const pill=x.kind==='pill';
        for(let i=0;i<=14;i++){
          const d=addDays(new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()),i),k=fmt(d),N=stDayN(x,k);
          if(!stampPlanned(x,k)||!stampsOn(k).some(y=>y.s.id===x.id))continue;   // 하루 한도 때문에 안 보이는 스티커는 알림도 안 보냄 (눌러도 완료할 곳이 없어서)
          x.ats.slice(0,N).forEach((tm,j)=>{
            const [h,mi]=tm.split(':').map(Number),at=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,mi).getTime();
            if(at<=now||stampCnt(k,x.id)>j)return;
            if(!pill&&sl.some(w=>at>=w[0]&&at<w[1]))return;   // 활동 알림은 자는 시간엔 건너뜀
            out.push(pill?{id:`a_${x.id}_${k}_${j}`,at,title:'💊 약 먹을 시간',text:`${x.name}${N>1?` (${j+1}/${N})`:''} · 먹으면 달력에 스티커 찍어 주세요`,type:'stk',date:k}
              :{id:`a_${x.id}_${k}_${j}`,at,title:`${icoTxt(x.emoji,'✔')} ${x.name} 할 시간`,text:N>1?`${j+1}/${N}번째 · 하고 나면 달력에 스티커 찍어 주세요`:'하고 나면 달력에 스티커 찍어 주세요',type:'stk',date:k});
          });
        }
      });
    }
    if((S.rmemos||[]).length)for(let i=0;i<=70;i++){const k=addK(fmt(t0),i);rmemoOn(k).forEach(m=>{
      if(!m.time||m.al===undefined||m.al===''||m.done)return;const [h,mi]=m.time.split(':').map(Number),d=parse(k),at=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,mi).getTime()-(m.al==='10'?600000:0);
      if(at>now)out.push({id:`r_${m.rep}_${k}`,at,title:'🔁 메모',text:`${m.al==='10'?'10분 뒤 · ':''}${firstLine(m.text).slice(0,40)}`});});}
    Object.keys(S.memos||{}).forEach(k=>{
      if(k<fmt(t0)||k>addK(fmt(t0),70))return;
      (S.memos[k]||[]).forEach(m=>{
        if(!m.time||m.al===undefined||m.al===''||m.done||m.by!==role())return;
        const [h,mi]=m.time.split(':').map(Number),d=parse(k),at=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,mi).getTime()-(m.al==='10'?600000:0);
        if(at>now)out.push({id:`m_${m.id}`,at,title:'📝 메모',text:`${m.al==='10'?'10분 뒤 · ':''}${firstLine(m.text).slice(0,40)}`});
      });
    });
    if(S.link&&S.pushOn!==false&&S.fam2&&S.fam2.memos){
      const slp=sleepWins(new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()),70);
      Object.entries(S.fam2.memos).forEach(([id,v])=>{
        if(v.by===S.link.uid||!v.time||v.al===undefined||v.al===''||!v.date)return;
        if(v.date<fmt(t0)||v.date>addK(fmt(t0),70))return;
        const [h,mi]=v.time.split(':').map(Number),d=parse(v.date),at=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,mi).getTime()-(v.al==='10'?600000:0);
        if(at<=now||slp.some(w=>at>=w[0]&&at<w[1]))return;
        out.push({id:`f_${id}`,at,title:`♥ ${v.byName||'가족'}님의 메모`,text:`${v.al==='10'?'10분 뒤 · ':''}${firstLine(v.text).slice(0,40)}`,type:'memo',date:v.date});
      });
    }
    if(wxOn())buildSchedule(14).filter(x=>x.a.wxOnly).forEach(x=>{   // ☔ 날씨만 알람 = 조용한 알림 (폰이 그 시각에 새 예보를 받아 문구를 만듦 · 못 받으면 아래 예비 문구)
      const w=wxAlarmQ(x);if(!w)return;let c=null;try{c=w.p?JSON.parse(w.p):null;}catch(e){}
      out.push({id:`w_${x.a.id}_${fmt(x.d)}`,date:fmt(x.d),at:x.at.getTime(),title:c?`${c.i} ${c.h}`:'☔ 오늘 출퇴근 날씨',text:c?[c.t,c.a].filter(Boolean).join(' · '):'눌러서 앱에서 확인해요',type:'wx',wxq:w.q,wxp:w.p,snd:x.a.sound!==false?1:0,tone:x.a.tone||''});   // v0.142 알람마다 고른 소리 한 번
    });
    window.AndroidBridge.setReminders(JSON.stringify(out));
  }catch(e){}
}
// v0.142 폰의 "5분 전 알림"에서 [이번만 끄기] 한 알람: 그 알람에 건너뜀(skipAt)을 적음 → 다시 보내도 그 시각은 빠짐 · 카드에 "건너뜀 · 되돌리기"
function alarmTakeSkips(){
  if(!hasBridge('takeSkips'))return false;let L=[];try{L=JSON.parse(window.AndroidBridge.takeSkips()||'[]');}catch(e){return false;}
  if(!Array.isArray(L)||!L.length)return false;let n=0;
  L.forEach(x=>{const id=String(x&&x.id||''),i=id.lastIndexOf('_'),aid=i>0?id.slice(0,i):'',at=+x.at||0;const a=(S.alarms||[]).find(y=>y.id===aid);if(a&&at>0){a.skipAt=at;n++;}});
  if(n){save();if(tab==='alarm')render();}return n>0;
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){try{if(alarmTakeSkips())pushAlarmsToNative();}catch(e){}}});
// v0.135 근무 바뀐 기록 (각자 폰 · 3개월): 언제 · 누가 · 며칠 근무를 무엇에서 무엇으로 · 요청 / 보류 / 수락 / 거절
function chLogAdd(e){const now=Date.now();S.chLog=(Array.isArray(S.chLog)?S.chLog:[]);S.chLog.unshift({t:now,...e});const lim=now-92*864e5;S.chLog=S.chLog.filter(x=>x&&x.t>=lim).slice(0,300);}
let ovSnap=null;
function chLogMine(){   // 내 근무 바꾼 것 (저장할 때 전과 비교)
  try{const cur=S.overrides||{};
    if(ovSnap){const ks=new Set([...Object.keys(ovSnap),...Object.keys(cur)]),ch=[];ks.forEach(k=>{if(String(ovSnap[k]??'')!==String(cur[k]??''))ch.push(k);});
      if(ch.length&&ch.length<=40)ch.sort().forEach(k=>{const d=parse(k),a=ovSnap[k]!==undefined?String(ovSnap[k]):String(baseShift(d)),b=cur[k]!==undefined?String(cur[k]):String(baseShift(d));if(a!==b)chLogAdd({k,w:'나',a:'chg',f:a?shiftLabel(a):'',to:b?shiftLabel(b):''});});}
    ovSnap={...cur};}catch(e){}
}
function save(){
  try{fillDefTimes();}catch(e){}
  chLogMine();
  S.drive.dirty=true;dataRev++;
  try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){toast('저장 공간이 꽉 찼어요 · 안 쓰는 사진을 지워 주세요');}
  pushAlarmsToNative();pushRemindersToNative();pushWidgetToNative();
  famSoon();
}

/* ================= 하루 사용량 (서버 비용이 드는 '클라우드에 쓰기' 기능) =================
 * 가족 메시지 보내기 + 근무 요청 보내기를 합쳐서 하루 5건 무료.
 * 다 쓰면 보상형 광고 15초를 보고 5건을 더 받거나, 구독(월 3,000원)으로 무제한.
 * (지금은 게스트만 이 기능을 쓰므로 한 사람 몫만 셉니다. 실제 서버에서는 계정별로 세야 해요.) */
const FREE_PER_DAY=5, BONUS_PER_AD=5;
function usage(){
  const today=fmt(new Date());
  if(!S.usage||S.usage.date!==today)S.usage={date:today,used:0,bonus:0};
  return S.usage;
}
function limitInfo(){
  if(S.syncSettings.isPro)return {remaining:Infinity,cap:Infinity,used:0,pro:true};
  const u=usage();
  const cap=FREE_PER_DAY+u.bonus*BONUS_PER_AD;
  return {remaining:Math.max(0,cap-u.used),cap,used:u.used,pro:false};
}
function consumeUsage(){const u=usage();u.used++;save();}
function usageHint(){
  const li=limitInfo();
  if(li.pro)return '<div class="usage-hint pro">⭐ 무제한 이용 중</div>';
  return `<div class="usage-hint">오늘 ${li.remaining}/${li.cap}건 남음</div>`;
}

/* ================= 화면 상태 ================= */
let tab='cal';
const _now=new Date();
let cur={y:_now.getFullYear(),m:_now.getMonth()};
{const v=Math.min(MAX_M,Math.max(MIN_M,cur.y*12+cur.m));cur={y:Math.floor(v/12),m:v%12};}
let sheetKey=null;      // 열려 있는 날짜
let sheetMode=null;     // 'day' | 'requests' | null
let draft=null;         // 알람 편집 중
let reqDraft={want:'휴',msg:''};   // 게스트가 쓰는 요청
let pendingSend=null;    // 무료 횟수를 다 써서 광고를 보고 있는 동안 잠시 보관하는 요청/메모
let replyDraft=null;    // 호스트가 쓰는 답장
let typeDraft=null;     // 근무타입 편집 중
let tempPickerYear=cur.y;

const role=()=>S.syncSettings.isGuestMode?'guest':'host';

/* ================= 근무 계산 ================= */
// 패턴 그대로의 근무
const patShiftCur=d=>{
  if(S.noPat)return '';
  const n=S.pattern.length;
  const i=((dayNum(d)-dayNum(parse(S.anchor)))%n+n)%n;
  return S.pattern[i];
};
// 시작 날을 바꾼 적이 있으면 그 날 이전은 그때의 옛 패턴 구간 (S.patOld, 날짜 오름차순)
const patShift=d=>{
  if(S.noPat)return '';
  const po=S.patOld;
  if(po&&po.length){const k=fmt(d);for(const o of po)if(k<o.until){const n=o.pattern.length;return o.pattern[((dayNum(d)-dayNum(parse(o.anchor)))%n+n)%n];}}
  return patShiftCur(d);
};
// "공휴일엔 쉬어요"를 켜면 공휴일의 근무 날은 쉬는 날로
const restKey=()=>((S.types||[]).find(t=>t.rest)||{k:'휴'}).k;
const holAdj=(d,b)=>S.holRest&&!isRest(b)&&holName(fmt(d))?restKey():b;
const baseShift=d=>holAdj(d,patShift(d));
/* 개인 캘린더 기간 S.pers=[{f:시작 날, t:끝나는 날(그날부터 다시 근무, 비면 계속)}]: 그 기간은 근무가 없는 날(NONE_K)로 셈 */
const persOn=k=>(S.pers||[]).some(p=>p.f<=k&&(!p.t||k<p.t));
const persAll=()=>(S.pers||[]).some(p=>p.f<='1900-01-01'&&!p.t);
const persSync=()=>{S.personal=persOn(fmt(new Date()));};
const shiftOf=d=>{const k=fmt(d);return persOn(k)?NONE_K:(S.overrides[k]||baseShift(d));};

/* S.memos[날짜] = [{id,text,shared}, ...]  하루에 메모 여러 개 */
const memosOf=k=>Array.isArray(S.memos[k])?S.memos[k]:[];
const sharedMemos=k=>S.syncSettings.shareMyMemos===false?[]:memosOf(k).filter(m=>m.shared&&m.text.trim());
/* 내용 없는 메모 정리 */
function tidyMemos(k){
  if(!k||!S.memos[k])return;
  S.memos[k]=S.memos[k].filter(m=>m.text.trim());
  if(!S.memos[k].length)delete S.memos[k];
}

/* 한 번만 울리는 알람이 지나갔으면 끄기 */
function expireOnceAlarms(){
  let ch=false;
  S.alarms.forEach(a=>{if(a.on&&a.once&&a.until&&a.until<Date.now()){a.on=false;ch=true;}});
  if(ch)save();
}
/* 한 번만 울리는 알람: 저장할 때 다음 한 번의 시각을 정해 둔다 */
function firstFire(a){
  const b=Object.assign({},a,{once:false,until:0,on:true});
  const x=buildSchedule(400,[b])[0];
  return x?x.at.getTime():0;
}
function onceDay(a){try{const x=buildSchedule(60,[{...a,on:true}])[0];return x?`${x.at.getMonth()+1}/${x.at.getDate()}`:'';}catch(e){return '';}}   // v0.148 한 번만 알람이 울릴 날
function buildSchedule(days,only){
  days=days||60;
  const now=new Date(),out=[],list=only||S.alarms;
  const t0=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  for(let i=-1;i<=days+1;i++){
    const d=addDays(t0,i),sh=shiftOf(d);
    list.forEach((a,idx)=>{
      if(!a.on)return;
      if(a.wxOnly&&!wxOn())return;   // ☔ 날씨만 알람: 날씨를 끄면 안 울림
      if(a.shift!=='*'&&a.shift!==sh)return;
      const [h,mi]=a.time.split(':').map(Number);
      const at=new Date(d.getFullYear(),d.getMonth(),d.getDate()+(a.offset||0),h,mi,0,0);
      if(at<=now)return;
      if(a.once&&a.until&&at.getTime()>a.until)return;
      if(a.noHol){const kk=fmt(at);if(holName(kk)||compHol(kk))return;}
      if(a.skipAt&&at.getTime()===a.skipAt)return;
      out.push({at,a,d,idx,sh});
    });
  }
  out.sort((x,y)=>x.at-y.at);
  return out.slice(0,400);
}

/* ================= 알림(이벤트) ================= */
function pushEvent(to,kind,k,text){
  S.events.unshift({id:uid(),to,kind,k,text,seen:false,t:Date.now()});
  S.events=S.events.slice(0,60);
  if(S.link&&to===role()&&BAN_KINDS.includes(kind)&&!(kind==='memo'&&S.syncSettings.receiveFamilyMemo===false))showBanner(S.events[0]);
}
/* 앱을 보고 있을 때 가족 소식이 오면 화면 위에서 잠깐 내려왔다가 올라가요 (꺼져 있을 땐 폰 알림). 누르면 그 날짜 · 위로 쓸면 닫기 · 여러 개면 차례로 */
const BAN_KINDS=['req','cc','reply','apply','memo','sch','join','board','kick'];
let banQ=[],banBusy=false,banY=null,banSwiped=false,banT=0;
function showBanner(e){
  if(!e||document.visibilityState!=='visible')return;
  banQ.push({text:e.text,k:e.k,kind:e.kind});if(banQ.length>4)banQ.shift();
  if(!banBusy)banNext();
}
function banNext(){
  const it=banQ.shift();if(!it){banBusy=false;return;}
  banBusy=true;
  let el=document.getElementById('ban');
  if(!el){el=document.createElement('div');el.id='ban';el.setAttribute('data-act','ban-go');el.setAttribute('role','status');document.body.appendChild(el);}
  el.className='';el.textContent=it.text;el.dataset.k=it.k||'';el.dataset.kind=it.kind||'';
  void el.offsetWidth;el.classList.add('show');
  clearTimeout(banT);banT=setTimeout(banHide,3400);
}
function banHide(){
  const el=document.getElementById('ban');if(el)el.classList.remove('show');
  clearTimeout(banT);setTimeout(banNext,reduceMotion()?60:320);
}
document.addEventListener('touchstart',e=>{const b=e.target.closest&&e.target.closest('#ban');banY=b?e.touches[0].clientY:null;},{passive:true});
document.addEventListener('touchend',e=>{if(banY===null)return;const dy=e.changedTouches[0].clientY-banY;banY=null;if(dy<-18){banSwiped=true;banHide();setTimeout(()=>{banSwiped=false;},400);}},{passive:true});
function visibleEvents(){
  const r=role();
  return S.events.filter(e=>e.to===r&&!e.seen&&!(r==='host'&&e.kind==='memo'&&S.syncSettings.receiveFamilyMemo===false));
}
function markSeen(pred){
  const r=role();
  S.events.forEach(e=>{if(e.to===r&&!e.seen&&pred(e))e.seen=true;});
  save();
}

/* ================= 작은 도우미 ================= */
function toast(msg){const t=$('#toast');toastStack(t);t.classList.remove('act');toast._undo=null;t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2600);toastIn(t);}
// v0.196 알림 띠 (시안 design/toast): 위에서 펼쳐지듯 내려오고, 떠 있는 동안 새 알림이 오면 앞을 덮음 (기존 것은 뒤로 작아지며 흐려짐) · 사라질 땐 위로 접힘
const tGh=[];
const tRM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||!document.body.animate;
function toastStack(t){if(!t||!t.classList.contains('show')||tRM())return;
  const g=document.createElement('div');g.className='tghost';g.innerHTML=t.innerHTML;document.body.appendChild(g);tGh.push(g);
  tGh.forEach((o,i)=>{const d=tGh.length-i,tf=`translate(-50%,${8*d}px) scale(${1-.06*d})`,op=d>1?0:.55;o.animate([{transform:o._tf||'translate(-50%,0)',opacity:o._op==null?1:o._op},{transform:tf,opacity:op}],{duration:320,easing:'cubic-bezier(.2,.9,.25,1)',fill:'forwards'});o._tf=tf;o._op=op;});
  while(tGh.length>2)tGh.shift().remove();}
function toastIn(t){if(tRM())return;t.animate([{transform:'translate(-50%,0) perspective(600px) rotateX(-92deg)',opacity:0},{transform:'translate(-50%,0) perspective(600px) rotateX(14deg)',opacity:1,offset:.6},{transform:'translate(-50%,0) perspective(600px) rotateX(-5deg)',offset:.82},{transform:'translate(-50%,0) perspective(600px) rotateX(0deg)',opacity:1}],{duration:560,easing:'ease-out'});
  if(!toastIn._mo){toastIn._mo=new MutationObserver(()=>{if(t.classList.contains('show'))return;tGh.splice(0).forEach((o,i)=>{const a=o.animate([{transform:o._tf,opacity:o._op},{transform:`translate(-50%,0) perspective(600px) rotateX(-90deg)`,opacity:0}],{duration:280,delay:i*40,easing:'ease-in',fill:'forwards'});a.onfinish=()=>o.remove();setTimeout(()=>o.remove(),600);});});toastIn._mo.observe(t,{attributes:true,attributeFilter:['class']});}}
function remain(ms){
  const min=Math.floor(ms/60000);
  if(min<1)return '1분 미만';
  const d=Math.floor(min/1440),h=Math.floor(min%1440/60),m=min%60;
  return d>0?`${d}일 ${h}시간`:h>0?`${h}시간 ${m}분`:`${m}분`;
}
// v0.126 시간 표기 12시간제 통일: "오후 7:30" · short 면 정각은 "오후 7시"
const t12=(v,short)=>{if(!v||!/^\d{1,2}:\d\d$/.test(v))return v||'';const [h,m]=v.split(':').map(Number);const hh=h%12===0?12:h%12;return `${h<12?'오전':'오후'} ${short&&!m?hh+'시':hh+':'+pad(m)}`;};
// v0.126 안내 줄은 처음 몇 번만: hintN(키) 본 횟수 · hintBump(키) 하나 늘림
const hintN=k=>(S.hints&&S.hints[k])||0;
function hintBump(k){S.hints=S.hints||{};S.hints[k]=Math.min(999,(S.hints[k]||0)+1);}
const ownMemoN=()=>{let n=0;try{Object.values(S.memos||{}).forEach(a=>(a||[]).forEach(m=>{if(!m.shared)n++;}));}catch(e){}return n;};
const ampm=t=>{const [h,m]=t.split(':').map(Number);return {ap:h<12?'오전':'오후',tm:`${pad(h%12===0?12:h%12)}:${pad(m)}`};};
const rel=t=>{const m=Math.floor((Date.now()-t)/60000);if(m<1)return '방금 전';if(m<60)return m+'분 전';const h=Math.floor(m/60);if(h<24)return h+'시간 전';return Math.floor(h/24)+'일 전';};
const md=k=>{const d=parse(k);return `${d.getMonth()+1}/${d.getDate()}`;};
/* 이모티콘 자리에는 이모티콘 글자 또는 '@사진번호' 가 들어감. 사진은 S.icons[번호] (128×128 정사각형 JPEG) */
const isPhoto=e=>typeof e==='string'&&e.charAt(0)==='@';
function ico(e,cls){
  if(isPhoto(e)){const src=(S.icons||{})[e.slice(1)];return src?`<img class="ico${cls?' '+cls:''}" src="${src}" alt="">`:'⭐';}
  return esc(e||'');
}
// 알림 · 토스트처럼 글자만 되는 곳: 사진이면 대신 쓸 글자
const icoTxt=(e,fb)=>isPhoto(e)?(fb||''):(e||'');
const mdw=k=>{const d=parse(k);return `${d.getMonth()+1}/${d.getDate()} (${DOW[d.getDay()]})`;};
const setCur=(y,m)=>{const v=Math.min(MAX_M,Math.max(MIN_M,y*12+m));cur={y:Math.floor(v/12),m:v%12};};

/* ================= 색 · 글자 크기 ================= */
function hexRgb(h){h=String(h||'#000000').replace('#','');return [parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0];}
const fgOn=hex=>{const [r,g,b]=hexRgb(hex);return (r*299+g*587+b*114)/1000>165?'#1f2328':'#ffffff';};
function applyTheme(){
  const st=document.documentElement.style,f=S.memoColors.fam||'#7b5cf0',m=S.memoColors.my||'#5b8fc7';
  st.setProperty('--fam',f);
  st.setProperty('--fam-fg',fgOn(f));
  st.setProperty('--fam-bg',`color-mix(in srgb, ${f} 20%, var(--bg))`);   // 개인 메모 색(연한 색)과 구분되게 조금 짙게
  st.setProperty('--fam-line',`color-mix(in srgb, ${f} 38%, var(--bg))`);
  st.setProperty('--my',m);
  st.setProperty('--my-bg',`color-mix(in srgb, ${m} 12%, var(--bg))`);
  st.setProperty('--my-line',`color-mix(in srgb, ${m} 28%, var(--bg))`);
  const de=document.documentElement;
  if(S.theme==='light'||S.theme==='dark')de.setAttribute('data-theme',S.theme);else de.removeAttribute('data-theme');
  if(S.bg==='vivid')de.setAttribute('data-bg',S.bg);else de.removeAttribute('data-bg');
  applyTune();
  try{if(window.AndroidBridge&&typeof window.AndroidBridge.setThemeMode==='function')window.AndroidBridge.setThemeMode(S.theme||'system');}catch(e){}
}
function applyFont(){
  const pct=S.fontScale>100?120:100;
  let tz=1;try{tz=window.AndroidBridge&&typeof window.AndroidBridge.setTextZoom==='function'?pct/100:1;}catch(e){}
  document.documentElement.style.setProperty('--tz',tz);   // 스티커는 글자 크기와 상관없이 그대로 (위 --tz)
  try{
    if(window.AndroidBridge&&typeof window.AndroidBridge.setTextZoom==='function'){window.AndroidBridge.setTextZoom(pct);return;}
  }catch(e){}
}
function applyBand(){document.body.classList.add('noband');}   // v0.97 근무 띠 없앰 (설정 줄도 뺌 · 옛 값은 무시)
/* 데이터 바꾸지 않고 저장만 (자동 백업 표시를 건드리지 않음) */
function persist(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}

/* ================= 누가 썼는지 ================= */
const whoName=by=>by===role()?'나':(String(by).startsWith('u:')?famNameOf(String(by).slice(2)):(by==='host'?'근무자':'가족'));
// 혼자 쓰는 중: 가족 쪽에서 쓴 메모 · 포스트잇이 하나도 없음 → "나" 표시는 숨김 (save 할 때마다 다시 셈)
let soloRev=-1,soloVal=true,dataRev=0;
function isSolo(){
  if(soloRev===dataRev)return soloVal;
  soloRev=dataRev;
  const other=x=>x&&x.by&&x.by!=='host';
  soloVal=role()==='host'&&!S.link&&!Object.values(S.memos||{}).some(l=>(l||[]).some(other))&&!Object.values(S.board||{}).some(l=>(l||[]).some(other));
  return soloVal;
}
const other=()=>role()==='host'?'guest':'host';
/* 지금 보는 사람이 볼 수 있는 메모: 가족 메모 + 내가 쓴 나만 메모 */
/* ---- v0.118 반복 메모 (S.rmemos): 매달 n일 · 말일 · 말일 하루 · 이틀 전 + 근무 조건 (그 날 아니면 건너뛰기 / 다음 그 근무 날로) · 미리 만들지 않고 계산 ---- */
const rrDay=md=>md>0?`${md}일`:md===-1?'말일':md===-2?'말일 하루 전':'말일 이틀 전';
const rrText=r=>`매달 ${rrDay(r.md)}${(r.sh||[]).length?` · ${r.sh.map(k=>shiftLabel(k)).join('·')}인 날만 · ${r.miss==='next'?'아니면 다음 근무 날로':'아니면 건너뛰기'}`:''}`;
function rmTarget(r,y,mo){
  const last=new Date(y,mo+1,0).getDate();let d=new Date(y,mo,r.md>0?Math.min(r.md,last):last+(r.md+1));
  if((r.sh||[]).length){let n=0;while(persOn(fmt(d))||!r.sh.includes(shiftOf(d))){if(r.miss!=='next'||n>=31)return '';d=addDays(d,1);n++;}}
  return fmt(d);
}
function rmemoOn(k){
  if(role()!=='host'||!Array.isArray(S.rmemos)||!S.rmemos.length)return [];
  const d=parse(k),out=[];
  S.rmemos.forEach(r=>{if(r.from&&k<r.from)return;if((r.skip||[]).includes(k))return;
    for(const off of [0,-1]){const x=new Date(d.getFullYear(),d.getMonth()+off,1);if(rmTarget(r,x.getFullYear(),x.getMonth())===k){out.push({id:'r:'+r.id,rep:r.id,text:r.text,color:r.color,todo:r.todo,done:(r.done||[]).includes(k)||undefined,time:r.time,al:r.al,by:role(),shared:false,t:r.t||0});break;}}});
  return out;
}
const rmemoOf=mid=>String(mid||'').startsWith('r:')?(S.rmemos||[]).find(r=>r.id===String(mid).slice(2)):null;
function visibleMemos(k){
  const r=role();
  return memosOf(k).concat(rmemoOn(k),S.link&&S.syncSettings.receiveFamilyMemo!==false?famRemoteMemos(k):[]).filter(m=>m.text.trim()&&((m.shared&&(m.by===r||S.syncSettings.receiveFamilyMemo!==false))||m.by===r));
}
const firstLine=t=>String(t).split('\n')[0];
/* ---- 글 속 주소(https:// · http:// · www.)는 파란 밑줄 "링크"로 보여 줌 (저장된 글은 그대로 · 보이는 모양만) ---- */
function linkParts(text){
  text=String(text||'');const out=[],re=/(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;let last=0,m;
  while((m=re.exec(text))){
    let u=m[0];while(u&&/[.,;:!?)\]}>]$/.test(u))u=u.slice(0,-1);
    if(u.length<5){continue;}
    if(m.index>last)out.push({t:text.slice(last,m.index)});
    out.push({u});last=m.index+u.length;re.lastIndex=last;
  }
  if(last<text.length)out.push({t:text.slice(last)});
  return out;
}
const linkUrl=u=>/^https?:\/\//i.test(u)?u:'https://'+u;
const hasLink=t=>linkParts(t).some(x=>x.u);
// o.click: 눌러지는 링크(날짜 창 · 포스트잇) / 아니면 모양만(달력 칸) · o.fam: 가족이 보낸 글이라 열기 전에 확인
function linkify(text,o){
  o=o||{};
  return linkParts(text).map(x=>x.u?(o.click?`<a class="lnk" data-act="lnk" data-u="${esc(linkUrl(x.u))}"${o.fam?' data-fam="1"':''}>링크</a>`:'<span class="lnk">링크</span>'):esc(x.t)).join('');
}
let lnkHeld=false,lnkTimer=null;
function lnkGo(url){
  if(!/^https?:\/\//i.test(url))return;
  try{if(hasBridge('openUrl')){window.AndroidBridge.openUrl(url);return;}}catch(e){}
  window.open(url,'_blank','noopener');
}
function lnkHost(url){try{return new URL(url).hostname;}catch(e){return url.slice(0,40);}}
function lnkOpen(url,fam){
  if(!fam){lnkGo(url);return;}
  openPop(`<div class="mh">링크 열기<b>${esc(lnkHost(url))}</b></div>
    <div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0">가족이 보낸 메모의 링크예요. 아는 주소일 때만 열어요.</div></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">취소</button><button class="btn grow" data-act="lnk-go" data-u="${esc(url)}">열기</button></div>`);
}
function lnkCopy(url){
  try{if(hasBridge('copyText')){window.AndroidBridge.copyText(url);toast('주소를 복사했어요');return;}}catch(e){}
  try{navigator.clipboard.writeText(url).then(()=>toast('주소를 복사했어요'),()=>toast('복사하지 못했어요'));}catch(e){toast('복사하지 못했어요');}
}
function lnkMenu(url,fam){
  openPop(`<div class="mh">링크<b>${esc(lnkHost(url))}</b></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="lnk-open2" data-u="${esc(url)}"${fam?' data-fam="1"':''}>열기</button><button class="btn grow" data-act="lnk-copy" data-u="${esc(url)}">주소 복사</button></div>`);
}
document.addEventListener('pointerdown',e=>{
  clearTimeout(lnkTimer);const a=e.target.closest&&e.target.closest('a.lnk[data-u]');if(!a)return;
  lnkHeld=false;lnkTimer=setTimeout(()=>{lnkHeld=true;clearTimeout(holdTimer);held=true;lnkMenu(a.dataset.u,!!a.dataset.fam);},450);
},true);
['pointerup','pointercancel','pointermove'].forEach(ev=>document.addEventListener(ev,()=>{if(ev!=='pointermove')clearTimeout(lnkTimer);},true));
const ICON={
  bell:'<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  send:'<svg viewBox="0 0 24 24"><path d="M12 19V5.5M5.8 11.4 12 5.2l6.2 6.2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  lock:'🔒',heart:'♥'
};

/* ================= 기념일 (휴무일 · 기념일 중 "메모만") ================= */
// 예전 D-day 자리: 달력 칸·날짜 화면에 이름만 보여주는 기념일
function ddayHits(k){
  if(!ad('comp'))return [];
  return (S.companyHols||[]).filter(x=>x.kind==='memo'&&(x.date===k||(x.yearly&&x.date.slice(5)===k.slice(5)&&k>=x.date)));
}
function ddayNext(x){
  const t=fmt(new Date());
  if(!x.yearly)return x.date;
  const y=new Date().getFullYear();
  let k=`${y}${x.date.slice(4)}`;
  if(k<t)k=`${y+1}${x.date.slice(4)}`;
  return k;
}
function dDiff(k){return dayNum(parse(k))-dayNum(new Date());}
function ddayLabel(x){
  const n=dDiff(ddayNext(x));
  if(n===0)return 'D-day';
  if(n>0)return `D-${n}`;
  return `+${-n+1}일`;
}


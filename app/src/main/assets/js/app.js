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
  try{const okT=v=>typeof v==='string'&&/^\d{1,2}:\d\d$/.test(v);s.rmemos=Array.isArray(s.rmemos)?s.rmemos.filter(r=>r&&typeof r.id==='string'&&typeof r.text==='string'&&r.text.trim()&&Number.isInteger(r.md)&&r.md>=-3&&r.md<=28&&r.md!==0).slice(0,100).map(r=>{const o={id:r.id.slice(0,20),text:String(r.text).slice(0,2000),md:r.md,sh:Array.isArray(r.sh)?r.sh.filter(x=>typeof x==='string').slice(0,20):[],miss:r.miss==='next'||r.miss==='prev'?r.miss:'skip',from:okDate(r.from)?r.from:'',t:+r.t||0};if(typeof r.color==='string'&&/^#[0-9a-f]{6}$/i.test(r.color))o.color=r.color;if(r.todo)o.todo=true;if(okT(r.time)){o.time=r.time;if(r.al==='0'||r.al==='10')o.al=r.al;}['done','skip'].forEach(f=>{if(Array.isArray(r[f]))o[f]=r[f].filter(okDate).slice(-120);});return o;}):[];}catch(e){s.rmemos=[];}   // v0.118 반복 메모
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
const wLaneC=new Map();function wLanes(d){const st=addDays(d,-leadOf(d)),key=fmt(st)+'|'+dataRev;if(!wLaneC.has(key)){if(wLaneC.size>200)wLaneC.clear();wLaneC.set(key,perLanes(Array.from({length:7},(_,j)=>fmt(addDays(st,j)))));}return wLaneC.get(key);}
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
    // v0.236 기간 띠 줄(lane): 주마다 겹치면 두 줄 · 앱 달력과 같음 (pl: 띠 자리마다 {c,s,e,b,x} 또는 빈자리 0) · mk: 줄 종류 w 일지 · p 띠 · e 빈자리 · f 가족 · m 메모 · o 포스트잇/D-day → 위젯이 줄 수에 맞춰 빈자리를 채움
    const mk=[];if(wl1)mk.push('w');
    let pl=null,pv0=null;{const wk=pers?null:wLanes(d);if(wk&&wk.n){const sl=wk.slot(k);while(sl.length&&!sl[sl.length-1])sl.pop();if(sl.length){const L=leadOf(d);pl=sl.map(p=>{if(!p){ml.push(' ');mk.push('e');return 0;}if(p.k0!==k&&!pv0)pv0=p;mk.push('p');ml.push(k===p.k0?perName(p.m).slice(0,40):' ');return {c:cssHex(perMc(p.m))||'#f08a3c',...(k===p.k0||L===0?{s:1}:{}),...(p.m.till===k||L===6?{e:1}:{}),...(k===p.k0?{b:1}:{}),...(p.m.till===k?{x:1}:{})};});}}}
    const mld=[];vm.filter(x=>x.shared&&!x.till).concat(vm.filter(x=>!x.shared&&!x.till)).forEach(x=>{if(x.todo&&x.done)mld.push(ml.length);ml.push(wm(x.text)||' ');mk.push(x.shared?'f':'m');});   // mld: 완료한 할 일 줄 번호 → 위젯이 줄 긋고 흐리게
    boardOnDate(k).forEach(n=>{ml.push(wm(piLabel(n))||' ');mk.push('o');});ddayHits(k).forEach(x=>{ml.push(x.name||' ');mk.push('o');});   // (v0.236 예전엔 위 줄 주석에 묻혀 빠져 있었음)
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
      base={k,w:d.getDay(),m:d.getMonth()+1,d:d.getDate(),ov:!pers&&S.ovDot!==false&&!!(S.overrides&&S.overrides[k]),hol:hol||'',...holPair(hol),t:(c||rest)?sh:'',...((c||rest)?{tn:String(typeOf(sh).name||sh).slice(0,5)}:{}),bg:c?cssHex(c.bg):'',fg:c?cssHex(c.fg):'',...(rq0?{rq:rq0}:{}),...(nfm?{nf:Math.min(nfm,4)}:{}),...(pl?{pl}:{}),...(pl?{mk:mk.join('')}:{}),...(wl1?{wl:1,wlr:{n:wlName(),c:wlCounts(k).map(([sc,n])=>`${sc.n} ${n}`).join(' · '),s:wlSecTexts(k)}}:{}),...(c&&!rest&&timesCustom(sh)?{wt:`${timesOf(sh).start}~${timesOf(sh).end}`,wn:shiftLabel(sh)}:{})};   // wt · wn: 근무 시간을 정해 둔 근무 날 — 위젯 날짜 창에 "주간 06:00~18:00"
    if(i<-6||i>=14){const chf=compHol(k),anf=ddayHits(k);days.push({...base,far:i<-6?2:1,stk:stampsOn(k).slice(0,4).map(x=>{const o=mapStk(x);delete o.id;delete o.b;return o;}),ms:ml.slice(0,3+(pl?pl.length:0)).map(x=>String(x||'').slice(0,40)),...(mld.some(i=>i<3+(pl?pl.length:0))?{msd:mld.filter(i=>i<3+(pl?pl.length:0))}:{}),
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
    days.push({...base,...(i===0||i===1?wxWidget(d):{}),stk,memo:String(memo||'').slice(0,40),ms:ml.slice(0,4+(pl?pl.length:0)).map(x=>String(x||'').slice(0,40)),...(mld.some(i=>i<4+(pl?pl.length:0))?{msd:mld.filter(i=>i<4+(pl?pl.length:0))}:{}),sa,mi,
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
// v0.237 근무 이름은 2개까지 쓰고 나머지는 "외 n" (설명문이 길어져 창이 깨지지 않게)
const rrShTxt=sh=>{const n=(sh||[]).map(k=>shiftLabel(k));return n.length>2?`${n.slice(0,2).join('·')} 외 ${n.length-2}개`:n.join('·');};
const rrShDay=sh=>(sh||[]).length>2?'그 근무':rrShTxt(sh);   // "바로 앞 ○○ 날에" 자리: 3개 이상이면 "그 근무"
const rrText=r=>`매달 ${rrDay(r.md)}${(r.sh||[]).length?` · ${rrShTxt(r.sh)}인 날만 · ${r.miss==='next'?`아니면 바로 뒤 ${rrShDay(r.sh)} 날에`:r.miss==='prev'?`아니면 바로 앞 ${rrShDay(r.sh)} 날에`:'아니면 그달은 건너뛰어요'}`:''}`;
function rmTarget(r,y,mo){
  const last=new Date(y,mo+1,0).getDate();let d=new Date(y,mo,r.md>0?Math.min(r.md,last):last+(r.md+1));
  if((r.sh||[]).length){let n=0;const st=r.miss==='prev'?-1:1;while(persOn(fmt(d))||!r.sh.includes(shiftOf(d))){if((r.miss!=='next'&&r.miss!=='prev')||n>=31)return '';d=addDays(d,st);n++;}}   // v0.237 앞당기기(prev) · 미루기(next)
  return fmt(d);
}
function rmemoOn(k){
  if(role()!=='host'||!Array.isArray(S.rmemos)||!S.rmemos.length)return [];
  const d=parse(k),out=[];
  S.rmemos.forEach(r=>{if(r.from&&k<r.from)return;if((r.skip||[]).includes(k))return;
    for(const off of [0,-1,1]){const x=new Date(d.getFullYear(),d.getMonth()+off,1);if(rmTarget(r,x.getFullYear(),x.getMonth())===k){out.push({id:'r:'+r.id,rep:r.id,text:r.text,color:r.color,todo:r.todo,done:(r.done||[]).includes(k)||undefined,time:r.time,al:r.al,by:role(),shared:false,t:r.t||0});break;}}});
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

/* ================= 화면 ================= */
// 칸에 들어갈 메모 줄 수: 어디서든 최대 3줄. 가로 태블릿처럼 칸이 낮으면 들어가는 만큼만
// 주 시작 요일 (설정 › 앱): 일요일(기본) 또는 월요일
const weekOrder=()=>S.weekStart===1?[1,2,3,4,5,6,0]:[0,1,2,3,4,5,6];
const leadOf=d=>(d.getDay()-(S.weekStart===1?1:0)+7)%7;
const dowHead=()=>weekOrder().map(w=>`<span class="${w===0?'s':w===6?'t':''}">${DOW[w]}</span>`).join('');
// 달력 칸 메모: 최대 3줄. 메모 영역은 날짜 줄 · 근무 표시 아래부터 칸 끝까지 → 줄이 남는 높이를 나눠 가져 3줄이 차면 아래 여백이 없음
// 줄 높이 --plh(글자 · 줄 간격)는 "줄 수로 나눈 높이"(상한: 폰 20px · 태블릿 24px), 메모가 적은 날도 같은 높이로 위에서부터 쌓음(--plmax)
const tuneAppKey=()=>innerWidth>=600?'appInner':'appCover';   // 앱 달력 모양 값: 화면 폭 600dp 이상이면 안쪽(큰 화면) · 아니면 커버
let tuneDraft=null;   // 모양 조정 화면에서 아직 저장 안 한 값 (저장 버튼을 눌러야 S.tune 으로)
const tuneApp=()=>((tuneDraft||(S&&S.tune))||{})[tuneAppKey()]||TUNE_NEUTRAL;
function applyTune(){
  const de=document.documentElement,st=de.style,t=tuneApp();
  st.setProperty('--tstk',t.stk);st.setProperty('--tstkx',t.stkX);st.setProperty('--tstky',t.stkY);st.setProperty('--tink',t.ink);st.setProperty('--tinky',t.inkY);st.setProperty('--tgx',t.stkGX);st.setProperty('--tgy',t.stkGY);st.setProperty('--tmg',t.memoG);st.setProperty('--tdot',t.dotX||0);
  if(S.calLook==='fill')de.setAttribute('data-cal','fill');else de.removeAttribute('data-cal');
  de.setAttribute('data-today','b');   // v0.145 앱 달력 오늘 = 칸 테두리 하나 (todayLook 은 위젯만)
  const tc=S.todayColor==='shift'?tdcShift():S.todayColor;
  if(tc)de.style.setProperty('--tdc',tc);else de.style.removeProperty('--tdc');
  if(tc)de.setAttribute('data-tdc',tc==='#6b7482'?'rest':'1');else de.removeAttribute('data-tdc');
}
const stzPx=()=>{const w=innerWidth;return w>=600?Math.max(17,Math.min(19.8,w*.0264)):Math.max(12,Math.min(17.6,w*.0374));};
function memoLines(){
  const tab=innerWidth>=600,g=document.querySelector('#view .grid');   // (모양 조정 미리보기 같은 다른 화면의 달력 말고 메인 달력만 잼)
  const ch=g&&g.clientHeight?g.clientHeight/6:(innerHeight-230)/6;
  const dnH=(document.querySelector('.track .cell .dn')||{}).offsetHeight||Math.max(20,stzPx()+6);
  const bw=(document.querySelector('.track .cell .bwrap')||{}).offsetHeight||(S.personal?50:32);
  const shift=S.personal?0:Math.max(6,Math.min(12,stzPx()-4));
  const avail=ch-dnH-bw-shift;
  const want=3;   // 메모는 어디서든(폰 · 태블릿 · 개인 캘린더) 최대 3줄 — 칸이 낮으면 들어가는 만큼만
  const minLh=tab?14:12,capLh=tab?24:20,capFs=tab?14:12.5;
  const minN=tab?2:1;   // v0.232 태블릿 · 폴드 안쪽 화면은 칸이 낮아도 메모 2줄 (줄을 조금 낮춰서)
  let n=want;while(n>minN&&(avail-(n-1))/n<minLh)n--;
  const per=(avail-(n-1))/n,lh=Math.max(n>1&&per<minLh?11:minLh,Math.min(capLh,Math.floor(per)));
  const TN=tuneApp(),fs=Math.min(capFs,Math.max(9,Math.round(lh*0.6*2)/2))*TN.memo;
  const r=document.documentElement.style;r.setProperty('--plh',lh+'px');const ph=Math.max(lh,Math.min(Math.round(lh*1.15),Math.floor(per)))*TN.pill;r.setProperty('--plhf',ph+'px');r.setProperty('--plf',fs+'px');r.setProperty('--plmax',(ph+1)+'px');
  return n;
}
let lastLines=0,renderAgain=false;
// 달력 위 한 줄: 근무표를 안 만들었으면 만들기 안내, 불규칙이면 사용법(첫 근무를 넣기 전까지)
function calSub(){
  if(S.personal)return '<span class="mkh">개인 캘린더</span>';
  if(!S.myset)return S.personal?'<span class="mkh">개인 캘린더</span>':'<button class="mkp" data-act="mk-sched">내 근무표 만들기 ›</button>';
  if(S.noPat)return Object.keys(S.overrides||{}).length?'':'<span class="mkh">날짜를 눌러서 근무를 넣어요</span>';
  return role()==='guest'?'<b>가족 보기</b>':'';
}
let lastW=innerWidth,lastKey=tuneAppKey();
window.addEventListener('resize',()=>{const w=innerWidth;if(tuneAppKey()!==lastKey){lastKey=tuneAppKey();applyTune();}
  // 접고 펼 때: 그 화면(커버 · 안쪽) · 그 달에서 전에 맞춘 스티커 크기가 있으면 재지 않고 바로 씀 → 잠깐 크게 보이지 않음 (가라앉은 뒤 다시 재서 다르면만 바뀜)
  const c=stzCache[stzKey()];if(c!==undefined){stzUse=c;}
  const n=memoLines();if((n!==lastLines||w!==lastW)&&document.querySelector('.grid')){lastW=w;render();}else lastW=w;
  stzUse=undefined;
  // 접고 펼 때는 화면 크기가 몇 번에 나눠 바뀜 → 가라앉은 뒤(0.25초 · 1초)에 스티커 크기 · 줄 수를 다시 맞춤 (안 그러면 안쪽 크기에서 멈춘 채 남음)
  clearTimeout(window.__rzT);clearTimeout(window.__rzT2);
  window.__rzT=setTimeout(()=>stzCheck(true),250);window.__rzT2=setTimeout(()=>stzCheck(false),1000);});
// 스티커 크기를 다시 재야 하는지 보고 다시 그림. force: 무조건 / 아니면 마지막으로 잰 뒤 화면 폭 · 화면 종류가 바뀌었거나 못 잰 적이 있을 때만
// 설정 같은 다른 화면이 열려 있거나 앱이 뒤에 있으면(폭을 0 으로 읽음) 지금은 안 재고 표시만 → 달력으로 돌아올 때 · 앱으로 돌아올 때 다시
function stzCheck(force){
  if(pageMode||tab!=='cal'||!document.querySelector('#view .grid')||document.hidden||!(innerWidth>0)){stzDirty=true;return;}
  if(force||stzDirty||innerWidth!==stzFitW||tuneAppKey()!==stzFitKey)render();
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&(stzDirty||innerWidth!==stzFitW))setTimeout(()=>stzCheck(false),60);});
window.__fold=()=>stzCheck(false);   // 안드로이드: 접고 펼 때(화면 설정이 바뀔 때) 조금 뒤에 불러 줌   // 접고 펼 때(커버↔안쪽) 앱 달력 값(스티커·주야)도 그 화면 값으로 먼저 바꿈
let renderRev=-1,renderWaitT=0,shellArriveT=-1e9;
// v0.207 뒤에서 하는 일(가족 새로 받기 · 켤 때 위젯 자료)은 날짜 창이 열리는 중 · 열린 직후 1.2초 동안 미룸 (폰 기록: 도착 직후 가족 새로 받기 render 103ms 로 첫 화면이 늦게 뜸)
function uiQuiet(){if(document.querySelector('.dshell:not(.cls)'))return 200;const d=performance.now()-shellArriveT;return d<1200?Math.ceil(1200-d):0;}
function render(){
  {const sh=document.querySelector('.dshell:not(.cls)');if(sh&&performance.now()-(sh._t0||0)<1500){clearTimeout(renderWaitT);renderWaitT=setTimeout(()=>render(),120);return;}}   // v0.206 껍데기가 움직이는 동안엔 다시 그리기를 미룸 (폰 기록: 켠 직후 위젯 자료 읽기 → render 97ms 가 열리는 도중 끼어듦)
  clearTimeout(renderWaitT);renderRev=dataRev;
  coachSoon();persSync();expireOnceAlarms();actAuto();
  applyTdc();   // (자정이 지나면 그날 근무 색으로 · 보이는 달력 따라)
  const top=$('#top'),v=$('#view');
  const navTab=tab==='colleague'?'set':tab;
  MO.navSet(navTab);   // v0.196 아이콘이 떠오르며 차오름
  const un=unseenCount(),fb=$('#famBadge');if(fb){fb.textContent=un?(un>9?'9+':un):'';fb.style.display=un?'':'none';}try{MO.badges();}catch(e){}
  top.className=(tab==='cal'||tab==='colleague')?'cal-top':'';
  $('#app').classList.toggle('paint-on',!!paint&&tab==='cal');
  v.className=tab==='cal'?'calv':'';
  const mk=cur.y*12+cur.m;
  // "오늘" 버튼은 다른 달을 볼 때만
  const tn=new Date(),todayBtn=cur.y===tn.getFullYear()&&cur.m===tn.getMonth()?'':'<button class="today-btn" data-act="today">오늘</button>';
  const mid=`
      <div class="cal-mid">
        <div class="ym">
          <button class="ib" data-act="prev" ${mk<=MIN_M?'disabled':''}>‹</button>
          <h1 data-act="open-month-picker">${cur.y}.${pad(cur.m+1)}</h1>
          <button class="ib" data-act="next" ${mk>=MAX_M?'disabled':''}>›</button>
        </div>
        <div class="sub">${calSub()}</div>
      </div>`;
  if(tab==='cal'&&famView()&&famPeers().length){
    renderViewTab();
  }else if(tab==='cal'){
    const todoN=boardLeft(boardKey());
    top.innerHTML=`
      <div class="hl">
        <button class="hb pi-btn" data-act="open-board" aria-label="월 포스트잇"><span class="pi-ic"></span>${todoN?`<span class="bdg pur">${todoN>9?'9+':todoN}</span>`:''}${S.link&&S.fam2&&S.fam2.boardDot?'<i class="pi-dot" aria-label="가족이 포스트잇을 고쳤어요"></i>':''}</button>
      </div>
      ${mid}
      <div class="hr">${(()=>{const c=famInCounts(),n=c.ask+c.hold;return n?`<button class="rqmail" data-act="feed-req" aria-label="처리할 요청 ${n}개">📩<i class="${c.ask?'':'hold'}">${n}</i></button>`:'';})()}${todayBtn}</div>`;
    if(calKeep&&$('#track')){calKeep=false;}   // v0.136 달 넘김: 판은 옮기기만 (calShiftFast) · 위 머리줄 · 오늘 빛만 새로
    else{calKeep=false;
    if(!renderAgain){try{stzWindow(v);}catch(err){}}   // 스티커 크기: 앞뒤 3달 기준
    v.innerHTML=renderCal();calCenter();stzPanels(v);
    const vp=()=>v.querySelector(`.track .panel[data-mk="${cur.y*12+cur.m}"]`)||v;   // v0.188 보이는 달만 바로 맞춤 (옆 달은 calFillLater 가 하나씩 · 다시 그리기 0.45 → 0.2초)
    fitDn(vp(),true);memoShift(vp());
    // 처음 켤 때 · 다른 탭에서 돌아올 때는 그리기 전에는 달력 칸 높이를 잴 수 없어서 어림값으로 메모 줄 수를 정함 → 그린 뒤 실제 높이로 다시 재서 다르면 한 번만 다시 그림
    if(!renderAgain){const n=memoLines();if(n!==lastLines){renderAgain=true;try{v.innerHTML=renderCal();calCenter();stzPanels(v);fitDn(vp(),true);memoShift(vp());}finally{renderAgain=false;}}else plFit(vp());calFitMark(v);}   // v0.175 memoLines 가 메모 글자 크기(--plf)를 실제 칸 높이로 다시 정함 → 그 크기로 메모 글자를 한 번 더 자름 · 보이는 판은 "맞춤 끝" (옆 달 채우기가 다시 재서 글자가 바뀌어 보이던 것)
    }
    glowCheck();calPrefetch();if(tab==='cal')calFillLater();
  }else if(tab==='colleague'){
    top.innerHTML=`<div class="hl"><button class="hb" data-act="back-set" aria-label="뒤로" style="font-size:28px">‹</button></div>${mid}<div class="hr">${todayBtn}</div>`;
    v.innerHTML=renderColleague();
    requestAnimationFrame(()=>{const r=$('.crow.today');if(r)r.scrollIntoView({block:'center'});});
  }else if(tab==='alarm'){
    top.innerHTML=`<h1>알람</h1><button class="ib plus apl" data-act="aadd" aria-label="알람 추가">${npi('plus',22)}</button>`;
    {const ok=!!v.querySelector('.alw'),m=ok?hmSnap(v,'.alw>*'):null;v.innerHTML=renderAlarm();if(m)hmPlay(v,'.alw>*',m);}   // v0.213 알람을 끄고 켜서 '다음 알람' 칸이 생기고 없어질 때 툭 말고 스르르
  }else if(tab==='fam'){
    const un2=unseenCount();
    top.innerHTML=`<h1>우리 가족</h1>${S.link?'<button class="hb" data-act="fam-refresh" id="famRef" aria-label="새로고침">↻</button>':''}<button class="hb" data-act="feed-sheet" aria-label="가족 소식">${ICON.bell}${un2?`<span class="bdg">${un2>9?'9+':un2}</span>`:''}</button><button class="hb" data-act="fam-set" aria-label="가족 설정">${ICON.gear}</button>`;
    v.innerHTML=renderFamily();famInit();
  }else{
    top.innerHTML=`<h1>설정</h1>`;
    v.innerHTML=renderMore();
  }
}

// 상주 공휴일 칸 이름: 연휴 앞뒤 날("연휴")은 가운데 날 이름으로 (추석 · 설날)
function holTagName(k,hol){
  if(hol.split('·')[0]==='연휴')for(const n of [1,-1,2,-2]){const h=holName(addK(k,n));if(h&&h.split('·')[0]!=='연휴'&&!h.startsWith('대체'))return holShort(h);}
  return holShort(hol);
}
/* ================= 메인 달력 ================= */
// 달력 칸의 근무 동그라미(+ 이어지는 띠). pop 이면 "톡" 튀어나오는 효과
function bwrapHtml(d,k,pop){
  if(persOn(k))return '';
  const sh=shiftOf(d),hol=holName(k),ov=S.overrides[k];
  if(sh==='')return '';
  const ps=shiftOf(addDays(d,-1)),ns=shiftOf(addDays(d,1));
  const tc=tColors(typeOf(sh));
  const band=tc&&!isRest(sh)&&(ps===sh||ns===sh)?`<i class="band ${ps===sh?'jl':''} ${ns===sh?'jr':''}" style="--tb:${tc.bg}"></i>`:'';
  const holTag=S.holRest&&hol&&isRest(sh)&&ov==null?holTagName(k,hol):'';
  return `${band}${holTag?`<span class="badge r two holtag ${pop?'pop':''}">${esc(holTag)}</span>`:badge(sh,pop?'pop':'',ov&&S.ovDot!==false?'<i class="dot"></i>':'')}`;
}
// 메모가 줄 수(mx)보다 많으면: 보이는 줄은 그대로 두고 마지막 줄 끝에 작은 회색 "+n" (n = 더 있는 메모 수 · 10개 이상은 9+) — 위젯 칸과 같은 표시. 글자가 잘리면 끝에 작은 점 세 개(plFit)
// v0.232 기간 메모(m.till): 칸 메모 첫 줄 자리에 이어지는 띠 (시안 design/period/v5) · 시작 · 끝 날 진한 막대 · 이름은 시작 날과 주 첫날
// v0.233 가족 메모도 기간 띠 (♥ · 기본 가족 색, pc 로 띠 색 고름) · 받은 가족 메모(서버)도
let perRev=-1,perFm=null,perList=[];
function perAll(){const fm=S.link&&S.fam2&&S.syncSettings.receiveFamilyMemo!==false?S.fam2.memos:null;if(perRev===dataRev&&perFm===fm)return perList;perRev=dataRev;perFm=fm;perList=[];const r=role();
  Object.keys(S.memos||{}).forEach(k0=>(S.memos[k0]||[]).forEach(m=>{if(m&&m.till&&m.till>k0&&String(m.text||'').trim()&&(m.by===r||(m.shared&&S.syncSettings.receiveFamilyMemo!==false)))perList.push({k0,m});}));
  if(fm)Object.entries(fm).forEach(([id,v])=>{if(v.till&&v.till>v.date&&v.by!==S.link.uid)perList.push({k0:v.date,m:{id:'s:'+id,sid:id,text:v.text,shared:true,srv:true,by:'u:'+v.by,till:v.till,pc:v.pc||''}});});
  perList.sort((a,b)=>a.k0<b.k0?-1:a.k0>b.k0?1:0);return perList;}
const perOn=k=>perAll().filter(p=>p.k0<=k&&k<=p.m.till);
const PER_COL={'#fff1c4':'#f2c037','#ffd9e4':'#ee7d9f','#ffe0c7':'#f08a3c','#d6f5df':'#4fb874','#d2f1ef':'#3fb0a6','#d9ecff':'#5b97ec','#e8eaee':'#8d95a1'};
const perCol=c=>PER_COL[c]||c||'#f08a3c';
const perMc=m=>m.shared?(m.pc||m.color?perCol(m.pc||m.color):'var(--fam)'):perCol(m.color);   // 띠 색: 가족 메모는 고른 색(pc) · 없으면 가족 색
const perName=m=>(m.shared?'♥ ':'')+firstLine(m.text);
// v0.236 겹치는 기간 띠: 주마다 줄(lane) 배정 — 먼저 시작한 띠가 위 · 한 주 안에서는 자기 줄을 지킴 (시안 design/period/v6-A2) · 2줄까지
function perLanes(ks){const on=perAll().filter(p=>p.k0<=ks[ks.length-1]&&p.m.till>=ks[0]),lanes=[],at=new Map();
  on.forEach(p=>{let L=0;while(lanes[L]&&lanes[L].some(q=>q.k0<=p.m.till&&p.k0<=q.m.till))L++;if(L>1)return;(lanes[L]=lanes[L]||[]).push(p);at.set(p,L);});
  return {n:lanes.length,slot:k=>{const r=Array(lanes.length).fill(null);on.forEach(p=>{const L=at.get(p);if(L!=null&&p.k0<=k&&k<=p.m.till)r[L]=p;});return r;}};}
function perPill(p,k,d){const L=leadOf(d),s=k===p.k0||L===0,x=k===p.m.till,e=x||L===6;   // 이름은 처음 시작한 날만 (사용자 v0.236)
  return `<div class="pl pvl${s?' s':''}${e?' e':''}${k===p.k0?' b':''}${x?' x':''}" style="--pc:${perMc(p.m)}">${k===p.k0?esc(perName(p.m)):'&nbsp;'}</div>`;}
// 띠 자리(slots: 띠 · 빈자리 null) + 다른 줄(others): 메모는 띠 아래가 기본 · 아래 자리가 모자랄 때만 위쪽 빈자리로 (사용자 v0.236) · 뒤쪽 빈자리는 없앰
function laneArrange(slots,others,cap){
  const sl=slots.slice();while(sl.length&&sl[sl.length-1]==null)sl.pop();
  const rest=others.slice();let need=sl.length+rest.length-cap;
  for(let i=0;i<sl.length&&need>0&&rest.length;i++)if(sl[i]==null){sl[i]={memo:rest.shift()};need--;}
  return {slots:sl,rest};}
function capPills(pl,mx){
  if(pl.length<=mx)return pl;
  const n=pl.length-mx,out=pl.slice(0,mx),s=out[mx-1],i=s.indexOf('>');
  out[mx-1]=s.slice(0,i+1).replace('class="pl ','class="pl withmore ')+`<span class="pt">${s.slice(i+1,-6)}</span><i class="mc" role="img" aria-label="메모 ${n}개 더 있음"><b>${n>9?'9+':'+'+n}</b></i></div>`;
  return out;
}
// v0.99.2 명절 이름: 숫자 + 이름(한 글자) + 스티커 2개가 한 줄에 들어갈 만큼 칸이 넓으면 옆, 아니면 숫자 아래(.hnb) — 스티커가 작아지지 않게 (S23 성탄절)
function holBeside(){
  const z=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stz'))||14,cw=innerWidth/7-2;
  return 20+12+2*z+8<=cw;
}
function calPanel(y,m){
  const first=new Date(y,m,1),lead=leadOf(first);
  const rows=6;   // 항상 6주 (다음 달 첫 주까지 보여줌)
  const start=addDays(first,-lead),tk=fmt(new Date());
  let cells='';
  const maxLines=lastLines=memoLines(),narrow=innerWidth<600;
  let wl0=null;
  for(let i=0;i<rows*7;i++){
    if(i%7===0)wl0=sharing?null:perLanes(Array.from({length:7},(_,j)=>fmt(addDays(start,i+j))));
    const d=addDays(start,i),k=fmt(d),sh=shiftOf(d),hol0=holName(k),hol=hol0||(ad('comp')?offHolName(k):''),chI=null,ch='',ov=S.overrides[k],dow=d.getDay();   // 회사 휴무일도 공휴일과 같은 모양(빨강)
    const cls=hol||dow===0?'sun':dow===6?'sat':'';
    const vm=visibleMemos(k),fam=vm.filter(x=>x.shared),mine=vm.filter(x=>!x.shared);
    const rcls=sharing?'':rqRing(S.requests.filter(r=>r.date===k&&(!r.srv||r.dir==='in')).map(r=>r.st==='applied'?{...r,st:'accepted'}:r));
    const pills=[];
    // 가족 · 나만은 색으로 구분 (♥ · 🔒 는 아래 설명 줄에 한 번만)
    const pst=x=>`${x.done?' done':''}" ${x.color?`style="--mc:${esc(x.color)}"`:''}`;
    if(!sharing&&wlHas(k))pills.push(`<div class="pl wl">📋 ${esc(wlName())}</div>`);   // 업무 일지: 메모 맨 위 · 메모와 같은 높이 · 공유 그림엔 안 나옴
    fam.filter(x=>!x.till).forEach(x=>pills.push(`<div class="pl fam${pst(x)}>${linkify(firstLine(x.text))}</div>`));
    if(!sharing)mine.filter(x=>!x.till).forEach(x=>pills.push(`<div class="pl my${pst(x)}>${linkify(firstLine(x.text))}</div>`));
    boardOnDate(k).filter(n=>!sharing||n.shared).forEach(n=>pills.push(`<div class="pl ${n.shared?'fam':'my'}">📝 ${esc(piLabel(n))}</div>`));
    ddayHits(k).forEach(x=>pills.push(`<div class="pl dd">${ico(x.emoji||'⭐')} ${esc(x.name)}</div>`));
    let pvH=false;
    if(wl0&&wl0.n){const ar=laneArrange(wl0.slot(k),pills,maxLines);if(ar.slots.length){pvH=ar.slots.some(x=>x&&x.m);pills.splice(0,pills.length,...ar.slots.map(x=>x==null?'<div class="pl pvl pve">&nbsp;</div>':x.memo!=null?x.memo:perPill(x,k,d)),...ar.rest);while(pills.length<maxLines)pills.push('<div class="pl pvl pve">&nbsp;</div>');}}   // 줄 수를 채워 칸마다 줄 높이가 같게 (띠가 계단 없이 이어짐)
    // 설정 줄 수(기본 3 · 태블릿 +1). 넘치면 마지막 줄 끝에 "+n" 칩
    if(pills.length>maxLines)pills.splice(0,pills.length,...capPills(pills,maxLines));
    // 날짜 줄: 숫자 · 스티커 · 공휴일 이름. 좁은 칸에서 스티커와 겹치면 이름은 빼기 (날짜 줄 색으로 이미 보임)
    const stAll=sharing&&!shareStk?[]:stampsOn(k),pers=persOn(k),st0=pers?[]:stAll;
    const hnHtml=hol?esc(shortHol(hol)):chI?ico(chI.emoji||'🏢')+(narrow?'':esc(ch)):'';
    // "공휴일엔 쉬어요"(상주): 쉬는 공휴일은 "휴" 자리에 공휴일 이름 (두 글자) → 날짜 줄엔 이름 안 씀
    const holTag=S.holRest&&hol&&isRest(sh)&&ov==null?holTagName(k,hol):'';
    // 공휴일 이름: 자리가 되면 전부(개천절) → 모자라면 두 글자(개천) → 한 글자(개). 스티커가 있으면 숫자 옆(.h1), 없으면 오른쪽(.hn). 줄이기는 fitDn. 회사 휴무일은 지금처럼
    const hFull=hol?shortHol(hol):'',hTwo=hol?holTwo(hol):'';
    const below=!!hol&&!holTag&&st0.length>=2&&!holBeside();   // 커버 화면 · 스티커 2개 이상: 이름은 숫자 아래(.hnb) → 그날도 날짜 줄은 다른 날과 같은 모양
    const hone=hol&&!holTag&&st0.length&&!below?(hFull.length>hTwo.length?hFull:hTwo):'',honeO=hone?holOne(hol):'';
    const showHn=!!hnHtml&&!holTag&&(hol?!st0.length:(!narrow||!st0.length||st0.length<2));
    const stRow=st0.slice(0,2),stMore=st0.slice(2);

    const tcc=pers||sh===''||sh===NONE_K?null:tColors(typeOf(sh)),cb=tcc?` style="--cb:${tcc.bg}"`:'';   // 칸 채우기 모양: 칸 전체를 근무 색으로 (v0.232 쉬는 근무도 색을 정했으면 · 기본 휴무는 색 없음)
    cells+=`<div class="cell ${d.getMonth()===m?'':'out'}${pvH?' pvc':''} ${k===tk?'today':''} ${pers?'pers':''} ${stMore.length?'m3':''} ${rcls}" data-act="day" data-k="${k}"${cb}>
      <i class="stz" data-act="stamp-dn" data-k="${k}"></i><div class="dn ${hol?'hol':ch?'chol':''} ${cls} ${hone?'h1r':''}"><span class="num">${d.getDate()}</span>${hone?`<span class="h1" data-f="${esc(hone)}" data-t2="${esc(hTwo)}" data-o="${esc(honeO)}">${esc(hone)}</span>`:''}${stRow.length?`<span class="stp">${stRow.map(x=>stampIcon(x,0)).join('')}</span>`:''}${showHn?`<span class="hn ${shortHol(hol).length>3&&hol?'sm':''}"${hol?` data-f="${esc(hFull)}" data-t2="${esc(hTwo)}" data-o="${esc(holOne(hol))}"`:''}>${hnHtml}</span>`:''}</div>${below?`<i class="hnb" data-o="${esc(holOne(hol))}">${esc(hTwo)}</i>`:''}${stMore.length?`<div class="s2">${stMore.map(x=>stampIcon(x,0)).join('')}</div>`:''}
      <div class="bwrap">${pers?(stAll.length?`<div class="pstk n${stAll.length}">${stAll.slice(0,4).map(x=>stampIcon(x,0)).join('')}</div>`:''):bwrapHtml(d,k)}</div>
      <div class="pill-wrap${pills.length>=maxLines?' full':''}">${pills.join('')}</div>
    </div>`;
  }
  return `<div class="calwrap">
    <div class="dow">${dowHead()}</div>
    <div class="grid" style="grid-template-rows:repeat(${rows},1fr)">${cells}</div>
  </div>`;
}
// 글자 크기 · 칸 너비가 폰마다 달라서 직접 재 본다: 날짜 줄 안의 것이 칸 밖으로 나가면 줄이고, 그래도 나가면 두 번째 스티커를 아래 줄로
// (시험) 두 자리 날짜 + 스티커 둘이어도 공휴일 이름 한 글자가 옆에 들어가도록 스티커를 딱 필요한 만큼만 줄여요 (달 전체 같은 크기 · 최소 9px)
function fitStz(root){
  const rt=document.documentElement;rt.style.removeProperty('--stz');
  const stps=[...(root||document).querySelectorAll('.cell .dn>.stp')];   // 공휴일 이름이 없는 칸도 포함: 두 자리 날짜 + 스티커 둘이 같은 줄에 들어가도록 달 전체 크기를 맞춤
  if(!stps.length)return;
  const probe=()=>{const e=document.createElement('i');e.style.cssText='position:absolute;visibility:hidden;width:var(--stz)';document.body.appendChild(e);const w=e.getBoundingClientRect().width;e.remove();return w;};
  // v0.127 버벅임: 칸마다 "글자 바꾸기 → 재기"를 번갈아 하면 칸 수만큼 화면 배치를 다시 계산함 → 바꾸기를 모두 먼저 · 재기를 모두 다음에 (배치 계산 한 번)
  const cells=stps.map(stp=>{const dn=stp.parentNode,h1=dn.querySelector('.h1');return {stp,dn,h1,t:h1?h1.textContent:''};});
  const measure=()=>{let need=0;
    cells.forEach(c=>{if(c.h1)c.h1.textContent=c.h1.dataset.t2||c.t;});   // 스티커 크기는 두 글자 이름 기준 (전부 보이는 이름 때문에 스티커가 작아지지 않게)
    cells.forEach(({stp,dn})=>{
      const padR=parseFloat(getComputedStyle(dn).paddingRight)||0,lastE=dn.lastElementChild;
      const ov=dn.clientWidth>0?(lastE.offsetLeft+lastE.offsetWidth)-(dn.clientWidth-padR):0;
      if(ov>1.5)need=Math.max(need,(ov-1)/Math.max(1,stp.children.length));   // v0.121 1.5px 까지는 오른쪽 여백(5px) 안이라 안 보임 (이모지 폭이 반올림으로 1px 튐)
    });
    cells.forEach(c=>{if(c.h1)c.h1.textContent=c.t;});   // 자리 계산은 옮김 · 배율(모양 조정)을 빼고 원래 자리로
    return need;};
  let cur=probe();const orig=cur;
  for(let i=0;i<14;i++){   // v0.121 이모지 글자 크기는 딱 비례하지 않아서(몇 번 줄여도 조금 남음) 최소 0.4px 씩은 줄여 감
    const need=measure();if(need<=0)return;
    const nx=Math.min(Math.floor((cur-need-.3)*10)/10,Math.floor((cur-.4)*10)/10);
    if(nx<9){rt.style.removeProperty('--stz');return;}   // 9px 아래로는 안 줄임 (그래도 안 들어가면 원래대로 이름을 뺌)
    cur=nx;rt.style.setProperty('--stz',cur+'px');
  }
  if(measure()>0)rt.style.removeProperty('--stz');
}
// v0.128 스티커 크기 원인 보기 (설정 › 모양 조정 · 열 때만 계산): 기본 크기에서 칸마다 넘치는 만큼 → 그 칸이 들어가는 크기 · 가장 빡빡한 날 = 원인 · 다음 날 = 대책
function stzDiag(){
  const host=$('#view');if(!host||!(host.clientWidth>0))return null;
  const rt=document.documentElement,saved=rt.style.getPropertyValue('--stz');
  const probe=document.createElement('div');probe.style.cssText=`position:fixed;left:0;top:0;width:${host.clientWidth}px;visibility:hidden;pointer-events:none;overflow:hidden`;
  const mk=cur.y*12+cur.m,ll=lastLines;let html='';
  for(let d=-stzR();d<=stzR();d++){const v=mk+d;if(v<MIN_M||v>MAX_M)continue;html+=`<div class="panel">${calPanel(Math.floor(v/12),v%12)}</div>`;}
  lastLines=ll;probe.innerHTML=`<div class="track">${html}</div>`;host.appendChild(probe);
  const pr=document.createElement('i');pr.style.cssText='position:absolute;visibility:hidden;width:var(--stz)';
  try{
    rt.style.removeProperty('--stz');document.body.appendChild(pr);const base=pr.getBoundingClientRect().width;
    const cells=[...probe.querySelectorAll('.cell .dn>.stp')].map(stp=>{const dn=stp.parentNode,h1=dn.querySelector('.h1'),c=stp.closest('.cell');return {stp,dn,h1,t:h1?h1.textContent:'',k:c&&c.dataset.k||''};});
    cells.forEach(c=>{if(c.h1)c.h1.textContent=c.h1.dataset.t2||c.t;});
    const ico=e=>e.tagName&&e.tagName.toLowerCase()==='svg'?'💊':(e.tagName==='IMG'||(e.querySelector&&e.querySelector('img')))?'🖼':(e.textContent||'').trim()||'⭐';
    const seen=new Set(),list=[];
    cells.forEach(c=>{if(!c.k||seen.has(c.k))return;seen.add(c.k);
      const padR=parseFloat(getComputedStyle(c.dn).paddingRight)||0,last=c.dn.lastElementChild;
      const ov=c.dn.clientWidth>0?(last.offsetLeft+last.offsetWidth)-(c.dn.clientWidth-padR):0,n=Math.max(1,c.stp.children.length),need=ov>1.5?(ov-1)/n:0;
      list.push({k:c.k,n:c.stp.children.length,need,fit:Math.max(9,base-need-.3),ic:[...c.stp.children].map(ico).join(' '),two:+c.k.slice(8)>=10,hol:!!(c.h1&&c.t)});});
    cells.forEach(c=>{if(c.h1)c.h1.textContent=c.t;});
    list.sort((a,b)=>a.fit-b.fit);
    return {base,cur:parseFloat(saved)||base,list};
  }catch(e){return null;}finally{pr.remove();probe.remove();if(saved)rt.style.setProperty('--stz',saved);else rt.style.removeProperty('--stz');}
}
function stzDiagHtml(){
  const d=stzDiag();if(!d||!d.list.length)return '';
  const md=k=>`${+k.slice(5,7)}월 ${+k.slice(8)}일`,L=d.list,t0=L[0],t1=L.find(x=>x.k!==t0.k&&x.fit>t0.fit+.05);
  const pct=Math.round((1-d.cur/d.base)*100);
  const why=x=>`${x.two?'두 자리':'한 자리'} 날짜${x.hol?' + 공휴일 이름':''} + 날짜 옆 스티커 ${x.n}개 (${x.ic})`;
  let h=`<div class="sdg"><b>지금 ${d.cur.toFixed(1)}px</b> · 기본 ${d.base.toFixed(1)}px${pct>0?` → <b>기본보다 ${pct}% 작아요</b>`:' → 기본 크기 그대로예요'}</div>`;
  if(t0.need>0){
    h+=`<button class="sdg-go" data-act="stz-go" data-k="${t0.k}">원인: <b>${md(t0.k)}</b> — ${esc(why(t0))} ›</button>`;
    const nx=t1?Math.min(d.base,t1.fit):d.base,grow=Math.round((nx/d.cur-1)*100);
    h+=`<div class="sdg">대책: ${grow>0?`이 날 날짜 옆 스티커를 하나 줄이면 → <b>약 ${grow}% 커져요</b>${t1&&t1.need>0?` (다음으로 빡빡한 날: ${md(t1.k)})`:''}`:'이 날을 줄여도 다른 날이 비슷하게 빡빡해서 거의 안 변해요'}</div>`;
  }else h+=`<div class="sdg">빡빡한 칸이 없어요 (모든 칸에 기본 크기로 들어가요)</div>`;
  h+=`<div class="sdg" style="margin-top:6px">크기 맞추는 범위 (${S.stzMode==='3'?'앞뒤 3달':'그 달만'} · ${md(fmt(new Date(cur.y,cur.m,1))).replace(/ 1일$/,'')} 기준)</div>
    <div class="chips"><button class="${S.stzMode==='3'?'':'on'}" data-act="stz-mode" data-v="m">달마다 따로 (최대한 크게)</button><button class="${S.stzMode==='3'?'on':''}" data-act="stz-mode" data-v="3">앞뒤 3달 같은 크기</button></div>`;
  return h;
}
// 스티커 크기는 "보는 달 앞뒤 3달(7달)"에서 가장 빡빡한 칸 기준으로 한 번에 맞춤 → 달을 넘겨도(명절이 있는 달 · 없는 달) 크기가 안 바뀜.
// 보이지 않는 곳에 7달을 그려서 재고(visibility:hidden) 바로 지움
const STZ_KEY='eonjeswieo:stz';let stzP=null;
function stzStore(){if(!stzP){try{stzP=JSON.parse(localStorage.getItem(STZ_KEY)||'{}');if(!isObj(stzP))stzP={};}catch(e){stzP={};}}return stzP;}
function strHash(t){let h=5381;for(let i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return h+':'+t.length;}
const stzCache={};let stzUse,stzDirty=false,stzFitW=0,stzFitKey='';
const stzKey=()=>`${tuneAppKey()}|${Math.round(innerWidth)}|${cur.y*12+cur.m}|${S.fontScale}|${S.calLook}|${S.stzMode||''}`;
const stzR=()=>S.stzMode==='3'?3:0;
var calMemo=null;
const stzPanels=v=>{try{const tr=v&&v.querySelector('#track');if(tr)[...tr.children].forEach(p=>{if(p.firstElementChild)stzPanel(p,+p.dataset.mk);});}catch(err){}finally{calMemo=null;}};   // v0.134 판마다 그 달 크기   // v0.128 스티커 크기 기준: 앞뒤 3달(기본 · 달을 넘겨도 크기 같음) / 'm' = 그 달만(달마다 최대한 크게)
function stzWindow(host){
  host=host||$('#view');if(!host)return;
  const rt=document.documentElement,main=host.id==='view';
  if(main&&stzUse!==undefined){if(stzUse)rt.style.setProperty('--stz',stzUse);else rt.style.removeProperty('--stz');return;}   // 접고 펼 때 전에 맞춘 값을 바로 씀
  const w=host.clientWidth||innerWidth;
  if(document.hidden||!(w>0)){stzDirty=true;return;}   // 지금은 잴 수 없음(앱이 뒤에 있음) → 지금 값 그대로, 돌아오면 다시
  const probe=document.createElement('div');
  probe.style.cssText=`position:fixed;left:0;top:0;width:${host.clientWidth||innerWidth}px;visibility:hidden;pointer-events:none;overflow:hidden;height:0`;
  const mk=cur.y*12+cur.m;let html='';
  for(let d=-stzR();d<=stzR();d++){const v=mk+d;if(v<MIN_M||v>MAX_M)continue;html+=`<div class="panel">${calPanel(Math.floor(v/12),v%12)}</div>`;}
  // v0.127 버벅임: 같은 화면 조건(stzKey) · 같은 7달 내용이면 전에 잰 크기를 그대로 씀 (폰에 저장 → 앱을 다시 켜도 안 잼). 내용이 바뀌었을 때만 다시 잼
  const sk=main?stzKey():'',sh=main?strHash(html.replace(/\bpc\d+/g,'').replace(/ (class|style)="[^"]*"/g,'')):0,SP=main?stzStore():null,se=SP&&SP[sk];
  if(se&&se.h===sh){if(se.v)rt.style.setProperty('--stz',se.v);else rt.style.removeProperty('--stz');stzCache[sk]=se.v;stzFitW=innerWidth;stzFitKey=tuneAppKey();stzDirty=false;return;}
  probe.innerHTML=`<div class="track">${html}</div>`;
  host.appendChild(probe);
  try{
    probe.style.height='auto';
    const c0=probe.querySelector('.cell');
    if(c0&&!(c0.clientWidth>0)){stzDirty=true;return;}   // 칸 폭을 못 읽으면 재지 않음 (재면 크기를 지워 큰 기본값이 됨)
    fitStz(probe);
    if(main){const v=rt.style.getPropertyValue('--stz');stzCache[sk]=v;stzFitW=innerWidth;stzFitKey=tuneAppKey();stzDirty=false;
      try{SP[sk]={h:sh,v,t:Date.now()};const ks=Object.keys(SP);if(ks.length>40)ks.sort((a,b)=>SP[a].t-SP[b].t).slice(0,ks.length-40).forEach(k=>delete SP[k]);localStorage.setItem(STZ_KEY,JSON.stringify(SP));}catch(e){}}
  }finally{probe.remove();}
}
// v0.134 "달마다 따로"(기본): 달력 판(.panel)마다 그 달 크기를 따로 달아 둠 → 옆 달이 미끄러져 들어오는 동안에도 제 크기 (도착한 뒤 스티커 · 메모가 툭 바뀌던 것)
function stzMonth(mk){
  const host=$('#view');if(!host)return null;
  const key=`${tuneAppKey()}|${Math.round(innerWidth)}|${mk}|${S.fontScale}|${S.calLook}|${S.stzMode||''}`;
  const ll=lastLines,ph=calMemo&&calMemo[mk],html=`<div class="panel">${ph!=null?ph:calPanel(Math.floor(mk/12),mk%12)}</div>`;lastLines=ll;   // (calPanel 이 메모 줄 수 lastLines 를 바꿈 → 다시 그릴지 판단이 틀어지지 않게 되돌림)
  const sh=strHash(html.replace(/\bpc\d+/g,'').replace(/ (class|style)="[^"]*"/g,'')),SP=stzStore(),se=SP[key];   // v0.135 속성(선택 · 오늘 표시 등)은 빼고 글자 · 그림만 비교 → 날짜를 고를 때마다 다시 재지 않음
  if(se&&se.h===sh)return se.v;
  if(document.hidden||!((host.clientWidth||innerWidth)>0))return se?se.v:null;
  const rt=document.documentElement,saved=rt.style.getPropertyValue('--stz'),probe=document.createElement('div');
  probe.style.cssText=`position:fixed;left:0;top:0;width:${host.clientWidth||innerWidth}px;visibility:hidden;pointer-events:none;overflow:hidden`;
  probe.innerHTML=`<div class="track">${html}</div>`;host.appendChild(probe);
  try{
    const c0=probe.querySelector('.cell');if(c0&&!(c0.clientWidth>0))return se?se.v:null;
    fitStz(probe);const v=rt.style.getPropertyValue('--stz');
    try{SP[key]={h:sh,v,t:Date.now()};const ks=Object.keys(SP);if(ks.length>40)ks.sort((a,b)=>SP[a].t-SP[b].t).slice(0,ks.length-40).forEach(k=>delete SP[k]);localStorage.setItem(STZ_KEY,JSON.stringify(SP));}catch(e){}
    return v;
  }catch(e){return null;}finally{probe.remove();if(saved)rt.style.setProperty('--stz',saved);else rt.style.removeProperty('--stz');}
}
function stzPanel(el,mk){if(!el)return;if(S.stzMode==='3'){el.style.removeProperty('--stz');return;}const v=stzMonth(mk);if(v==null)el.style.removeProperty('--stz');else el.style.setProperty('--stz',v||'var(--stz0)');}
/* 1/2 배지 크기 맞춤: 실제로 그려진 글자 크기(웹뷰 최소 글자 · 큰 글씨가 곱해진 값)를 재서, 스티커 크기의 .36 배가 되도록 배율을 정함 */
function cbFit(){
  const bs=document.querySelectorAll('.sx .cb');if(!bs.length)return;
  const cs=getComputedStyle(bs[0]);
  const fz=parseFloat(cs.height)-(parseFloat(cs.paddingTop)||0)-(parseFloat(cs.paddingBottom)||0);   // line-height:1 → 칸 높이 = 글자 크기
  if(!(fz>0))return;
  bs.forEach(b=>{
    const w=b.parentNode.offsetWidth;if(!(w>0))return;
    const k=Math.max(.3,Math.min(1.3,w*.36/fz)).toFixed(3);
    if(b.style.getPropertyValue('--cbk')!==k)b.style.setProperty('--cbk',k);
  });
}
try{new MutationObserver(cbFit).observe(document.body,{childList:true,subtree:true});}catch(e){}
// 앱 달력 메모 위치(모양 조정 "메모 위치"): 아래(+)로는 칸 바닥을 넘지 않을 만큼만 내림 (3줄이 꽉 찬 날은 그대로 · 잘리지 않게) · 위(−)는 값 그대로
function memoShift(root){
  const y=+(tuneApp().memoY)||0;
  (root||document).querySelectorAll('.cell .pill-wrap').forEach(w=>{
    w.style.translate='';if(!y||!w.children.length)return;
    const c=w.closest('.cell');if(!c)return;
    if(y<0){w.style.translate=`0 ${(y*0.04*c.clientHeight).toFixed(1)}px`;return;}
    const wr=w.getBoundingClientRect(),lb=w.lastElementChild.getBoundingClientRect().bottom,cb=c.getBoundingClientRect().bottom;
    const free=Math.max(0,Math.min(wr.bottom,cb)-lb-1);
    w.style.translate=`0 ${Math.min(y*0.12*c.clientHeight,free).toFixed(1)}px`;   // (바닥에서 막히니까 범위를 넓힘: 3 이면 칸 높이의 36% · 1줄 메모도 바닥까지)
  });
}
function fitDn(root,keepStz){
  if(!keepStz)fitStz(root);   // (keepStz: 조정 화면 미리보기 — 스티커 크기는 한 달 전체로 이미 맞춰 둠)
  const over=dn=>{
    const last=dn.lastElementChild;if(!last)return false;
    const padR=parseFloat(getComputedStyle(dn).paddingRight)||0;
    return dn.clientWidth>0&&last.offsetLeft+last.offsetWidth>dn.clientWidth-padR+1.5;   // 모양 조정의 옮김 · 배율은 빼고 원래 자리로 잼
  };
  // v0.135 렉: 먼저 모두 원래대로(쓰기) → 한 번에 재기(읽기) → 넘치는 칸만 하나씩 맞춤 (칸마다 쓰기 · 읽기를 번갈아 하면 칸 수만큼 화면 배치를 다시 함)
  const all=[...(root||document).querySelectorAll('.cell .dn>.stp')].map(stp=>({stp,dn:stp.parentNode,h1:stp.parentNode.querySelector('.h1')}));
  all.forEach(({stp,h1})=>{if(h1&&h1.dataset.f&&h1.textContent!==h1.dataset.f)h1.textContent=h1.dataset.f;if(stp.style.left)stp.style.left='';});
  const bad=all.filter(({stp,dn,h1})=>{if(over(dn))return true;const f=stp.firstElementChild;if(!h1||!f)return false;const a=h1.getBoundingClientRect(),b=f.getBoundingClientRect();return a.width>0&&b.width>0&&a.right>b.left+.5;});
  bad.map(x=>x.stp).forEach(stp=>{
    const dn=stp.parentNode,h1=dn.querySelector('.h1');
    // 공휴일 이름은 늘 숫자 옆: 자리가 되면 두 글자 → 안 되면 한 글자 → 그래도 넘치면 스티커를 하나씩 아래 줄로 (이름을 숫자 아래로 내리지 않음). 스티커 크기는 달 전체가 같음
    const toS2=()=>{
      const kids=stp.children;if(kids.length<(h1?1:2))return false;   // 스티커를 아래 줄로 (이름이 없는 날은 스티커 하나는 남김)
      const cell=dn.closest('.cell');let s2=cell.querySelector('.s2');
      if(s2&&s2.children.length>=2)return false;   // 둘째 줄은 2개까지 (더 내리면 칸 왼쪽 밖으로 넘침)
      if(!s2){s2=document.createElement('div');s2.className='s2';const ref=cell.querySelector('.hnb')||dn;ref.after(s2);cell.classList.add('m3');}
      s2.insertBefore(kids[kids.length-1],s2.firstChild);return true;
    };
    // 모양 조정(옮김 · 배율)으로 스티커가 이름 쪽으로 다가와 겹치는 경우도 보이는 자리(getBoundingClientRect)로 재서 같은 순서로 처리 — 조정할 때마다 2글자 → 1글자 → 스티커 아래 줄을 다시 계산
    const clash=()=>{const f=stp.firstElementChild;if(!h1||!f)return false;const a=h1.getBoundingClientRect(),b=f.getBoundingClientRect();return a.width>0&&b.width>0&&a.right>b.left+.5;};   // (닿기만 하는 건 겹침이 아님 — 실제로 겹칠 때만)
    if(h1){
      if(h1.dataset.f)h1.textContent=h1.dataset.f;   // 다시 맞출 때는 전부부터
      if((over(dn)||clash())&&h1.dataset.t2&&h1.textContent!==h1.dataset.t2)h1.textContent=h1.dataset.t2;   // 전부 → 두 글자
      if((over(dn)||clash())&&h1.dataset.o&&h1.textContent!==h1.dataset.o)h1.textContent=h1.dataset.o;   // → 한 글자
      while((over(dn)||clash())&&toS2()){}
    }
    if(over(dn))toS2();
    // 둘째 줄까지 찼는데도 첫 줄이 칸 오른쪽 밖으로 넘치면(좁은 칸에 날짜 + 이름 + 스티커 둘) 넘친 만큼 안으로 당김 → 1/2 배지가 칸 끝에서 잘리지 않고 둘째 줄과 오른쪽 끝이 같음 (이름 위에 살짝 겹쳐 붙음)
    stp.style.left='';const ov=over(dn)?stp.offsetLeft+stp.offsetWidth-(dn.clientWidth-(parseFloat(getComputedStyle(dn).paddingRight)||0)):0;
    if(ov>.5){stp.style.position='relative';stp.style.left=(-ov).toFixed(1)+'px';}
  });
  // 둘째 줄 스티커(.s2)도 첫 줄과 같은 오른쪽 여백 · 간격 · 배율 기준점 → 위아래가 가지런하고 간격 · 크기 조정이 두 줄에 똑같이 먹음
  (root||document).querySelectorAll('.cell>.s2').forEach(s2=>{
    const cell=s2.parentNode,dn=cell.querySelector('.dn'),stp=dn&&dn.querySelector('.stp');if(!dn)return;
    const pr=getComputedStyle(dn).paddingRight;
    s2.style.paddingRight=pr;s2.style.transformOrigin=`calc(100% - ${pr}) center`;
    if(stp)s2.style.columnGap=getComputedStyle(stp).columnGap;
  });
  // 숫자 아래 이름(.hnb)이 아래 줄 스티커(.s2)와 부딪히면 한 글자
  (root||document).querySelectorAll('.cell>.hnb').forEach(hb=>{
    const dn=hb.parentNode.querySelector('.dn'),num=dn&&dn.querySelector('.num');if(num)hb.style.left=(dn.offsetLeft+num.offsetLeft)+'px';   // 숫자 시작 위치에 맞춤
    if(hb.dataset.t2==null)hb.dataset.t2=hb.textContent;else hb.textContent=hb.dataset.t2;   // (다시 맞출 때는 두 글자부터)
    const s2=hb.parentNode.querySelector(':scope>.s2'),f=s2&&s2.firstElementChild;if(!f)return;
    if(hb.getBoundingClientRect().right>f.getBoundingClientRect().left+1.5&&hb.dataset.o)hb.textContent=hb.dataset.o;   // (스티커 상자 가장자리에 살짝 닿는 건 괜찮음 — 그림은 상자보다 안쪽)
  });
  // 스티커 없는 날의 공휴일 이름(.hn): 자리가 되면 전부 → 두 글자 → 한 글자 ("개…"처럼 잘리지 않게)
  (root||document).querySelectorAll('.cell .dn>.hn[data-f]').forEach(hn=>{
    hn.textContent=hn.dataset.f;
    const ov=()=>hn.clientWidth>0&&hn.scrollWidth>hn.clientWidth+.5;
    if(ov()&&hn.dataset.t2)hn.textContent=hn.dataset.t2;
    if(ov()&&hn.dataset.o)hn.textContent=hn.dataset.o;
  });
  cbFit();plFit(root);
}
/* 메모 줄: ① "+n" 크기 — 실제로 그려진 10px 글자 높이를 재서 메모 글자의 .9 배가 되도록 배율 · 폭을 정함 ② 글자가 칸 폭에 잘린 줄에만 .cut (끝에 작은 점 세 개) */
function plFit(root){
  const pls=[...(root||document).querySelectorAll('.cell .pl')];if(!pls.length)return;
  const mcs=pls.map(p=>p.querySelector('.mc>b')).filter(Boolean);
  if(mcs.length){
    const h=mcs[0].offsetHeight,fz=parseFloat(getComputedStyle(mcs[0].closest('.pl')).fontSize)||9;
    if(h>0){const k=Math.max(.3,Math.min(1.2,fz*.9/h));mcs.forEach(b=>{const mc=b.parentNode;mc.style.setProperty('--mck',k.toFixed(3));mc.style.setProperty('--mcw',(b.offsetWidth*k+1).toFixed(1)+'px');});}
  }
  pls.forEach(p=>{
    const t=p.querySelector('.pt')||p;
    if(t.dataset.full!=null){t.innerHTML=t.dataset.full;delete t.dataset.full;}   // 다시 맞출 때는 원래 글로
    const cut=t.clientWidth>0&&t.scrollWidth>t.clientWidth+1;p.classList.toggle('cut',cut);
    if(cut)plCut(t);
  });
}
// 잘린 메모 줄: 점 자리를 빼고 다 들어가는 마지막 글자까지만 남김 (반쪽 글자가 안 보이게) → 끝에 점 세 개
function plCut(t){
  const cs=getComputedStyle(t),fz=parseFloat(cs.fontSize)||9,r0=t.getBoundingClientRect();
  const limit=r0.left+t.clientLeft+t.clientWidth-(parseFloat(cs.paddingRight)||0)-fz*.62-2;
  t.dataset.full=t.innerHTML;
  const w=document.createTreeWalker(t,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT),rg=document.createRange();let n,cutAt=null;
  while((n=w.nextNode())){
    if(n.nodeType===1){if(n.children.length||n.textContent)continue;const b=n.getBoundingClientRect();if(b.width&&b.right>limit){cutAt=[n,-1];break;}continue;}   // 그림(이모지 · 아이콘)
    const d=n.data;
    for(let i=0;i<d.length;){const c=d.codePointAt(i),l=c>0xffff?2:1;rg.setStart(n,i);rg.setEnd(n,i+l);const b=rg.getBoundingClientRect();if(b.width&&b.right>limit){cutAt=[n,i];break;}i+=l;}
    if(cutAt)break;
  }
  if(!cutAt)return;
  const [node,i]=cutAt;
  let j=i;while(j>0&&/\s/.test(node.data[j-1]))j--;   // 점 앞 빈칸도 숨김
  if(i<0)rg.setStartBefore(node);else rg.setStart(node,j);
  rg.setEndAfter(t.lastChild);const rest=rg.extractContents();
  const e=document.createElement('i');e.className='ell2';t.appendChild(e);
  const h=document.createElement('span');h.className='pcut';h.hidden=true;h.appendChild(rest);t.appendChild(h);   // 잘린 뒷부분은 지우지 않고 숨김 (글 내용은 그대로)
}
function renderCal(){
  const mk=cur.y*12+cur.m;
  calMemo={};const at=v=>(calMemo[v]=calPanel(Math.floor(v/12),v%12));   // v0.135 렉: 방금 그린 판 글을 스티커 크기 재기에 그대로 씀 (같은 달을 두 번 만들지 않음)
  const pn=(v,h)=>`<div class="panel" data-mk="${v}" style="order:${CAL_R+v-mk}">${h}</div>`;   // v0.138 앞뒤 3달씩 (문서 순서 = 앞 · 지금 · 다음 · 나머지 → 지금 달은 늘 두 번째 · 보이는 순서는 order) · 먼 판은 조금 뒤에 채움
  return `<div class="track" id="track">${pn(mk-1,mk>MIN_M?at(mk-1):'')}${pn(mk,at(mk))}${pn(mk+1,mk<MAX_M?at(mk+1):'')}${calFar(mk).map(v=>pn(v,'')).join('')}</div>
    ${paint?paintBar():''}`;
}
/* 칠하기: 근무타입을 고르고 날짜를 쭉 누르면 한 번에 바뀜 */
let paint=null;
/* 이미지 공유 중: 🔒 나만 보는 메모 · 요청은 빼고 그림 */
let sharing=false,shareStk=false;   // 이미지 공유 중: 메모 · 스티커는 켠 것만 (매번 꺼짐으로 시작)
function shareStart(){paint=null;tab='cal';sharing=true;shareStk=false;const a=$('#app');a.classList.add('share-mode');a.classList.remove('share-memo');['shareMemo','shareStk'].forEach(id=>{const c=document.getElementById(id);if(c)c.checked=false;});render();}
function shareEnd(){sharing=false;shareStk=false;const a=$('#app');a.classList.remove('share-mode','share-memo');render();}
function paintBar(){return `<div class="paintbar"><span class="pb-ic">🖌<small>쭉 그어요</small></span><div class="pb-t">${S.types.map(x=>`<button class="${paint.k===x.k?'on':''}" data-act="paint-k" data-s="${esc(x.k)}">${badge(x.k,'sm')}</button>`).join('')}</div><button class="btn sm ghost" data-act="paint-cancel">취소</button><button class="btn sm" data-act="paint-done">결정<span id="pbN">${paintChanged()?' '+paintChanged()+'일':''}</span></button></div>`;}
// 칠하기를 시작한 뒤 바뀐 날 수 (시작할 때의 모습과 비교)
function paintChanged(){
  if(!paint||!paint.snap)return 0;
  const a=JSON.parse(paint.snap),b=S.overrides||{};let n=0;
  new Set([...Object.keys(a),...Object.keys(b)]).forEach(k=>{if((a[k]===undefined?null:a[k])!==(b[k]===undefined?null:b[k]))n++;});
  return n;
}
function paintCount(){const e=document.getElementById('pbN');if(e){const n=paintChanged();e.textContent=n?' '+n+'일':'';}}
function paintStart(k){
  if(!S.types.some(x=>x.k===k))k=(S.types.find(x=>!x.rest)||S.types[0]).k;
  paint={k,snap:JSON.stringify(S.overrides||{})};closeSheet();if(pageMode)closePage();tab='cal';render();toast('날짜를 누르거나 쭉 그으면 칠해져요 · 한 번 더 누르면 원래대로');
}
// 손가락으로 쭉 그으면 지나간 날을 칠하기 (같은 날을 다시 지나가도 지워지지 않음)
let pdrag=null,pghost=null,lastBuzz=0;
const reduceMotion=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
// 아주 짧은 진동 (애니메이션 줄이기를 켠 폰에서는 안 함)
function buzz(ms){}   // v0.209 앱 안 진동은 모두 뺌 (알람 · 알림 진동은 폰 쪽에서 그대로)
const cellOf=k=>document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`);
function paintSet(k){const base=baseShift(parse(k));if(paint.k===base)delete S.overrides[k];else S.overrides[k]=paint.k;}
// 바뀐 칸과 양옆 칸(이어지는 띠)만 다시 그리기 → 달력 전체를 다시 그리지 않아 부드러움
function paintRefresh(k,pop){
  const d=parse(k);
  [-1,0,1].forEach(n=>{const kk=fmt(addDays(d,n)),c=cellOf(kk),w=c&&c.querySelector('.bwrap');if(w)w.innerHTML=bwrapHtml(parse(kk),kk,n===0&&pop&&!reduceMotion());});
}
function paintCellAt(x,y){const el=document.elementFromPoint(x,y),c=el&&el.closest&&el.closest('.track .panel:nth-child(2) .cell[data-k]');return c?c.dataset.k:null;}
// 손가락 옆에 따라다니는 근무 동그라미 (붓 · 스티커 느낌)
function ghostMove(x,y){
  if(!pghost){pghost=document.createElement('div');pghost.className='pghost';document.body.appendChild(pghost);}
  if(pghost.dataset.k!==paint.k){pghost.innerHTML=badge(paint.k,'sm');pghost.dataset.k=paint.k;}
  pghost.style.display='block';pghost.style.transform=`translate(${x-50}px,${y-74}px)`;
}
function ghostHide(){if(pghost)pghost.style.display='none';}
function paintTouch(k){
  if(!(k in pdrag.orig))pdrag.orig[k]=S.overrides[k];   // 이번에 긋기 전 모습 (되돌아올 때 복원)
  pdrag.path.push(k);
  paintSet(k);const c=cellOf(k);if(c){c.classList.add('pt');pdrag.cells.push(c);}
  paintRefresh(k,true);buzz(6);paintCount();
}
// 손가락이 바로 전 날로 되돌아오면 방금 지나온 날은 긋기 전 모습으로
function paintUndoLast(){
  const k=pdrag.path.pop();
  if(!pdrag.path.includes(k)){
    const o=pdrag.orig[k];if(o===undefined)delete S.overrides[k];else S.overrides[k]=o;
    delete pdrag.orig[k];paintRefresh(k,false);const c=cellOf(k);if(c)c.classList.remove('pt');
  }
  buzz(4);paintCount();
}
document.addEventListener('pointerdown',e=>{
  if(!paint||tab!=='cal'||role()!=='host'||pageMode||$('#pop').classList.contains('open'))return;
  const k=paintCellAt(e.clientX,e.clientY);if(!k)return;
  try{e.target.releasePointerCapture&&e.target.releasePointerCapture(e.pointerId);}catch(err){}
  pdrag={id:e.pointerId,start:k,last:k,moved:false,cells:[],path:[],orig:{}};
});
document.addEventListener('pointermove',e=>{
  if(!pdrag||e.pointerId!==pdrag.id||!paint)return;
  ghostMove(e.clientX,e.clientY);
  const k=paintCellAt(e.clientX,e.clientY);if(!k||k===pdrag.last)return;
  if(!pdrag.moved){pdrag.moved=true;paintTouch(pdrag.start);}
  const pp=pdrag.path,ix=pp.lastIndexOf(k);
  // 이미 지나간 칸으로 돌아오면 그 뒤에 칠한 칸을 모두 되돌림 (빠르게 돌아와서 중간 칸을 건너뛰어도 안 남게)
  if(ix>=0&&ix<pp.length-1){pdrag.last=k;while(pp.length-1>ix)paintUndoLast();return;}
  // 돌아오는 길에 지나는 칸(앞뒤 두 칸 사이)은 새로 칠하지 않음 (예: 토 → 월로 갔다가 월 → 일 → 토로 돌아올 때 일요일)
  if(pp.length>=2){const a=pp[pp.length-1],b=pp[pp.length-2];if((k>a&&k<b)||(k<a&&k>b)){pdrag.last=k;return;}}
  pdrag.last=k;paintTouch(k);
});
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,e=>{
  if(!pdrag||e.pointerId!==pdrag.id)return;
  const d=pdrag;pdrag=null;ghostHide();
  setTimeout(()=>d.cells.forEach(c=>c.classList.remove('pt')),260);
  if(d.moved){held=true;save();}
}));
function paintDay(k){
  const d=parse(k),base=baseShift(d);
  if(S.overrides[k]===paint.k||paint.k===base)delete S.overrides[k];
  else S.overrides[k]=paint.k;
  save();paintRefresh(k,true);buzz(8);paintCount();
}
/* 날짜 칸 누르는 느낌: 살짝 눌렸다 돌아오고, 날짜 창이 열려 있는 동안은 떠 있는 카드처럼 */
let pressCell=null,pressX=0,pressY=0,pressT=0;
function pressOff(){const c=pressCell;pressCell=null;if(!c)return;const wait=Math.max(0,100-(performance.now()-pressT));setTimeout(()=>c.classList.remove('press','pressTop'),wait);}
document.addEventListener('pointerdown',e=>{
  const c=e.target.closest&&e.target.closest('.cell');if(!c)return;
  pressCell=c;pressX=e.clientX;pressY=e.clientY;pressT=performance.now();c.classList.add(e.target.closest('.stz')?'pressTop':'press');
},true);
document.addEventListener('pointermove',e=>{if(pressCell&&(Math.abs(e.clientX-pressX)+Math.abs(e.clientY-pressY))>12)pressOff();},true);
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,pressOff,true));
function markSel(k){
  document.querySelectorAll('.cell.sel').forEach(c=>c.classList.remove('sel'));
  const c=k&&cellOf(k);if(c)c.classList.add('sel');
}
let busy=false;
/* 오늘 칸 빛 (위젯과 같은 모양): 꼬리를 끄는 빛 한 줄이 오늘 칸 테두리를 윗변 왼쪽에서 시계 방향으로 한 바퀴 돌고 사라지는 동안 테두리 전체가 살짝 빛났다 옅어짐 (0.82초)
 * 나올 때: 앱을 켰을 때 · 다른 달에 있다가 이번 달로 돌아와 멈췄을 때(쓸기 · ‹ › · "오늘" · 달 고르기 모두)
 * 안 나올 때: 다른 탭 · 설정에 갔다 올 때 · 앱이 뒤에 있다가 돌아올 때 · 달을 넘기는 중(멈춘 뒤 0.15초 기다렸다 시작, 그 사이 넘기면 안 나옴) */
// 오늘 칸 빛: 어느 달력이든(내 달력 · 내 달력 보기 · 가족 달력 · 직접 추가한 가족 달력) — 앱을 켤 때 · 그 달력을 처음 열 때 · 다른 달에서 이번 달로 돌아올 때 한 바퀴
let glowHidAt=0;document.addEventListener('visibilitychange',()=>{if(document.hidden){glowHidAt=Date.now();return;}if(glowHidAt&&Date.now()-glowHidAt>3000){glowBoot=true;setTimeout(()=>{try{glowCheck();}catch(e){}},400);}glowHidAt=0;});   // v0.145 다른 앱 갔다 오면 오늘 빛 한 번 더
let glowPrev={},glowBoot=true,glowStart=0,glowMk=-1,glowId='',glowRaf=0,glowTm=0;
const GLOW_MS=1800;   // v0.166 숨 쉬듯 두 번 (0.9초씩 · 두 번째는 조금 약하게 · 위젯과 같음 · --pe)
function glowCtx(){
  if(pageMode==='famcal')return {id:'fc:'+vcUid,mk:vcY*12+vcM,sel:'#page #vcsl .cell.today'};
  if(pageMode==='mancal')return {id:'mc:'+manId,mk:vcY*12+vcM,sel:'#page #vcsl .cell.today'};
  if(tab!=='cal')return null;
  if(famView()&&famPeers().length)return {id:'view',mk:vcY*12+vcM,sel:'#view #vcsl .cell.today'};
  return {id:'own',mk:cur.y*12+cur.m,sel:'#track .panel:nth-child(2) .cell.today'};
}
function glowStop(){clearTimeout(glowTm);cancelAnimationFrame(glowRaf);glowRaf=0;glowStart=0;document.querySelectorAll('.tglow').forEach(e=>e.remove());document.querySelectorAll('.cell.glowing').forEach(c=>c.classList.remove('glowing'));}
function glowCheck(){
  const x=glowCtx();if(!x)return;
  const mk=x.mk,n=new Date(),nowMk=n.getFullYear()*12+n.getMonth(),prev=glowPrev[x.id];
  const go=mk===nowMk&&(glowBoot||prev===undefined||prev!==mk);
  if((mk!==glowMk||x.id!==glowId)&&glowStart)glowStop();
  glowPrev[x.id]=mk;glowBoot=false;
  if(go&&!paint&&!sharing){glowStop();glowMk=mk;glowId=x.id;{const rm=matchMedia('(prefers-reduced-motion: reduce)').matches,c0=!rm&&document.querySelector(x.sel);if(c0)c0.classList.add('glowing');}glowTm=setTimeout(()=>{const y=glowCtx();if(!y||y.mk!==mk||y.id!==x.id){glowStop();return;}if(matchMedia('(prefers-reduced-motion: reduce)').matches){glowStop();return;}glowStart=performance.now();window.__glowN=(window.__glowN||0)+1;glowFrame();},150);}
  else if(glowStart&&mk===glowMk&&x.id===glowId&&!glowRaf)glowFrame();   // 도는 중에 다시 그려졌으면(같은 달) 새 칸에 이어서
}
function glowSvg(c){
  const w=c.clientWidth,h=c.clientHeight;if(!(w>4&&h>4))return null;
  const ar=parseFloat(getComputedStyle(c).borderTopLeftRadius),g=-.5,bw=c.offsetWidth-2*g,bh=c.offsetHeight-2*g,r=Math.max(0,Math.min(bw/2,bh/2,(isNaN(ar)?8:ar)>0?(isNaN(ar)?8:ar)-g:0));   // v0.173 빛 = 오늘 띠 자리 (칸 경계에 걸침: 띠 가운데 줄이 칸 끝에서 0.5px 바깥 · 모서리 = 칸 모서리 + 0.5)   // v0.153 빛 모서리 = 오늘 테두리 모서리 (동그라미 모양은 각진 테두리라 빛도 각지게)
  const per=2*Math.max(0,bw-2*r)+2*Math.max(0,bh-2*r)+2*Math.PI*r,len=per*.3,N=14;   // (v0.163 꼬리 줄 7 → 14: 계단 없이 매끄럽게)
  const R=(cls,x='')=>`<rect class="${cls}" x="${g}" y="${g}" width="${bw}" height="${bh}" rx="${r}" ry="${r}"${x}/>`;
  let d=R('g-halo',` stroke-dasharray="${len} ${per-len}"`);for(let i=1;i<=N;i++)d+=R('g-dash',` data-l="${len*i/N}" stroke-dasharray="${len*i/N} ${per-len*i/N}"`);   // 둘레마다 되풀이 → 두 바퀴
  const e=document.createElementNS('http://www.w3.org/2000/svg','svg');
  e.setAttribute('class','tglow');e.setAttribute('viewBox',`0 0 ${w} ${h}`);e.setAttribute('aria-hidden','true');
  {const hl=Math.max(24,per*.26),M=14;let hb='',hc='';for(let i=1;i<=M;i++){const l=hl*i/M;hb+=R('g-hb',` data-l="${l}" data-c="1" stroke-dasharray="${l} ${per-l}"`);hc+=R('g-head',` data-l="${l}" data-c="1" stroke-dasharray="${l} ${per-l}"`);}d+=`<g class="g-bloom">${hb}</g>${hc}`;}   // v0.163 빛: 가운데가 가장 밝고 앞뒤로 스르르 흐려지는 긴 빛(겹친 줄의 가운데를 맞춤) + 흐릿한 번짐(g-bloom)
  const pi=`<rect class="g-pin" x="${g+3}" y="${g+3}" width="${Math.max(1,bw-6)}" height="${Math.max(1,bh-6)}" rx="${Math.max(1,r-3)}" ry="${Math.max(1,r-3)}"/>`;d+=`<g class="g-pb">${R('g-po')}${R('g-po2')}</g>${pi.replace('g-pin','g-pin g-pin2')}${pi}`;   // v0.166 숨 쉬듯: 바깥 근무 색 번짐 · 안쪽 하얀 빛
  e.innerHTML=R('g-draw',` stroke-dasharray="${per} ${per}" stroke-dashoffset="${per}"`)+R('g-soft')+R('g-line')+d;
  e.dataset.per=per;e.dataset.len=len;c.appendChild(e);return e;   // v0.148 g-draw: 첫 바퀴에 빛을 따라 테두리가 그려짐
}
function glowFrame(){
  glowRaf=0;if(!glowStart)return;
  const t=Math.min(1,(performance.now()-glowStart)/GLOW_MS);
  const x=glowCtx(),c=x&&document.querySelector(x.sel);
  if(!c||x.mk!==glowMk||x.id!==glowId){glowStop();return;}
  let e=c.querySelector('.tglow');if(!e)e=glowSvg(c);if(!e){glowStop();return;}
  c.classList.add('glowing');
  if(t>=1){glowStop();return;}
  const per=+e.dataset.per,len=+e.dataset.len;
  const env=t<.15?t/.15:Math.pow(1-(t-.15)/.85,1.6);
  e.querySelector('.g-soft').style.opacity=(env*.3).toFixed(3);e.querySelector('.g-line').style.opacity=(env*.8).toFixed(3);
  {const h=t<.5?t/.5:(t-.5)/.5,a=t<.5?1:.7,k=h<.36?h/.36:(1-h)/.64,sm=Math.max(0,Math.min(1,k*k*(3-2*k)));e.style.setProperty('--pe',(a*sm).toFixed(3));}   // v0.166 숨 두 번
  const q=Math.min(1,t/.96),p=q<.5?2*q*q:1-2*(1-q)*(1-q),head=p*per;e.style.setProperty('--gf',(Math.min(1,t/.17)*(t>.68?Math.max(0,(1-t)/.32):1)).toFixed(3));   // 빛: 처음 0.3초 스르르 켜지고 · 끝 0.6초 스르르 사라짐
  e.querySelector('.g-halo').style.strokeDashoffset=len-head;
  e.querySelector('.g-draw').style.strokeDashoffset=Math.max(0,per-head);
  e.querySelectorAll('.g-dash').forEach(x=>{x.style.strokeDashoffset=(+x.dataset.l)-head;});e.querySelectorAll('.g-head,.g-hb').forEach(x=>{x.style.strokeDashoffset=(+x.dataset.l)/2-head;});   // 빛 머리 = 줄의 가운데가 head
  glowRaf=requestAnimationFrame(glowFrame);
}
// "오늘" 버튼: ‹ › 처럼 이번 달 쪽으로 바로 미끄러지고(옆 칸에 이번 달을 넣고 넘김), 무거운 다시 그리기는 미끄러진 뒤에 → 누르자마자 반응함
// 쓸어 넘기는 중(0.25초)에 누르면 버리지 않고 기억했다가 넘김이 끝나자마자 오늘로 (넘기고 바로 "오늘"을 누르는 일이 많음)
let todayQ=false;
function todayGo(){
  if(busy){todayQ=true;return;}
  todayQ=false;calSync();
  const n=new Date(),y=n.getFullYear(),m=n.getMonth(),to=y*12+m,from=cur.y*12+cur.m,tr=$('#track');
  if(to===from)return;
  if(!tr||tab!=='cal'){setCur(y,m);render();return;}
  const dir=to>from?1:-1,pn=[...tr.children].find(p=>+p.dataset.mk===from+dir);
  if(pn&&Math.abs(to-from)>1){pn.innerHTML=calPanel(y,m);try{stzPanel(pn,to);fitDn(pn,true);memoShift(pn);}catch(e){}}
  busy=true;glowStop();
  calAnim(tr,dir,()=>{busy=false;setCur(y,m);render();todayQ=false;});   // (그 사이 또 누른 것은 이미 오늘이라 버림)
}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.today-btn'))clearTimeout(tdFb);},true);
// 안전장치: 버튼 위에서 짧게 눌렀다 뗐는데 0.1초 안에 누름(click)이 안 오면 앱이 직접 "오늘" (폰이 누름을 버리는 경우)
let tdDown=null,tdFb=0;
document.addEventListener('pointerdown',e=>{tdDown=e.target.closest&&e.target.closest('#top .today-btn')?{x:e.clientX,y:e.clientY,t:performance.now()}:null;},true);
document.addEventListener('pointerup',e=>{
  const d=tdDown;tdDown=null;if(!d)return;
  const on=e.target.closest&&e.target.closest('#top .today-btn');
  if(!on||Math.abs(e.clientX-d.x)+Math.abs(e.clientY-d.y)>12||performance.now()-d.t>600)return;
  clearTimeout(tdFb);tdFb=setTimeout(todayGo,100);
},true);
// v0.140 버튼(‹ › · 오늘)을 누르기 전에: 손으로 넘겨 놓고 아직 가운데로 정리 안 된 달이 있으면 먼저 그 달을 지금 달로 (위 숫자 4월인데 › 누르면 2월로 가던 것)
function calSync(){
  const tr=$('#track');if(!tr||tab!=='cal'||calAnimOn||busy)return;const W=calW(tr),i=Math.round(tr.scrollLeft/W),d=i-CAL_R;if(!d)return;
  clearTimeout(calSetT);const nm=cur.y*12+cur.m+d;if(nm<MIN_M||nm>MAX_M)return;
  if(calShiftFast(d,true))render();else{cur={y:Math.floor(nm/12),m:nm%12};render();}
}
function slideTo(dir,cb){
  calSync();
  const tr=$('#track'),mk=cur.y*12+cur.m+dir;
  if(mk<MIN_M||mk>MAX_M)return;
  if(!tr){shiftMonth(dir);if(cb)cb();return;}
  if(busy)return;
  busy=true;
  calAnim(tr,dir,()=>{busy=false;shiftMonth(dir,true);if(cb)cb();});
}
// v0.138 가로 스크롤 달력: 판 너비 · 가운데로 · 버튼 넘김(0.26초) · 손으로 민 뒤 멈추면 판 옮기기
const calW=tr=>(tr&&tr.getBoundingClientRect().width)||$('#view').getBoundingClientRect().width||innerWidth;   // v0.140 소수점 폭 그대로 (폰은 411.43px 처럼 소수 · clientWidth 는 정수라 판 자리가 어긋나 가운데로 못 돌아오던 것)
let calIgn=0,calTouch=false,calSetT=0,calAnimOn=false;
function calCenter(){const tr=$('#track');if(!tr)return;const W=calW(tr);if(W>0&&Math.abs(tr.scrollLeft-CAL_R*W)>.5){calIgn=performance.now();tr.scrollLeft=CAL_R*W;}}
function calAnim(tr,dir,done){
  const W=calW(tr),a=tr.scrollLeft,b=(CAL_R+dir)*W,t0=performance.now(),ms=swReduce()?0:260;
  calAnimOn=true;tr.style.scrollSnapType='none';
  const end=()=>{tr.scrollLeft=b;calAnimOn=false;tr.style.scrollSnapType='';done();};
  if(!ms){end();return;}
  const f=now=>{const p=Math.min(1,(now-t0)/ms),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;calIgn=performance.now();tr.scrollLeft=a+(b-a)*e;if(p<1)requestAnimationFrame(f);else end();};
  requestAnimationFrame(f);
}
// 손으로 밀고 판에 멈췄을 때: 멈춘 판이 지금 달이 되게 판 자리를 바꿈 (멈추기 전에는 안 건드림 → 튕기는 힘이 한 판 더 넘어가지 않음 · 앞뒤 2달씩 있어서 연달아 밀어도 안 막힘)
function calSettle(){
  if(tab!=='cal'||calTouch||calAnimOn||busy)return;
  const tr=$('#track');if(!tr)return;const W=calW(tr),x=tr.scrollLeft,i=Math.round(x/W);
  if(Math.abs(x-i*W)>3)return;   // 아직 움직이는 중 (멈추면 다시 불림)
  const d=i-CAL_R;if(!d)return;
  const nm=cur.y*12+cur.m+d,p=[...tr.children].find(x=>+x.dataset.mk===nm);
  if(nm<MIN_M||nm>MAX_M||!p){tr.scrollTo({left:CAL_R*W,behavior:'smooth'});return;}   // 끝 달: 다시 가운데
  if(calShiftFast(d,true)){render();if(pageMode==='stats')openStatsPage();if(todayQ)setTimeout(todayGo,0);}
  else{cur={y:Math.floor(nm/12),m:nm%12};render();}
}
let calLastX=0,calDir=0,calLastS=0;
document.addEventListener('scroll',e=>{
  if(!e.target||e.target.id!=='track')return;
  {const x=e.target.scrollLeft;if(Math.abs(x-calLastX)>.5)calDir=x>calLastX?1:-1;calLastX=x;calLastS=performance.now();}
  if(performance.now()-calIgn<40||calAnimOn)return;
  if((glowStart||glowTm)&&Math.abs(e.target.scrollLeft-CAL_R*calW(e.target))>2)glowStop();
  {const tr=e.target,i=Math.round(tr.scrollLeft/calW(tr)),v=cur.y*12+cur.m+i-CAL_R,h=document.querySelector('#top .ym h1');if(h&&v>=MIN_M&&v<=MAX_M){const t=`${Math.floor(v/12)}.${pad(v%12+1)}`;if(h.textContent!==t)h.textContent=t;}}   // v0.138 넘어가는 중에도 위 월 숫자는 바로 (반 넘게 오면)   // 손으로 밀 때만 빛을 멈춤 (가운데 맞춤 스크롤은 그대로)
  {const tr=e.target,W=calW(tr),i=Math.round(tr.scrollLeft/W);let f=0;[...tr.children].forEach(p=>{if(Math.abs((+p.style.order)-i)<=2&&!p.firstElementChild){calFill(p);f=1;}});if(f)calFillLater(150);}   // 다가오는 먼 판: 글만 바로 (크기 맞추기는 잠깐 뒤)   // 다가오는 먼 판이 비었으면 바로 채움
  clearTimeout(calSetT);calSetT=setTimeout(calSettle,90);
},true);
document.addEventListener('scrollend',e=>{if(e.target&&e.target.id==='track'&&!calAnimOn){clearTimeout(calSetT);calSettle();}},true);
document.addEventListener('touchstart',e=>{if(e.target.closest&&e.target.closest('#track'))calTouch=true;},{passive:true,capture:true});   // (움직이는 중엔 판을 건드리지 않음: 손가락 스크롤이 옛 자리로 되돌려 튐 → 앞뒤 3달씩 두고 멈춘 뒤에만 옮김)
['touchend','touchcancel'].forEach(ev=>document.addEventListener(ev,e=>{if(!calTouch||(e.touches&&e.touches.length))return;calTouch=false;clearTimeout(calSetT);calSetT=setTimeout(calSettle,140);},{passive:true,capture:true}));
addEventListener('resize',()=>{if(tab==='cal')requestAnimationFrame(calCenter);});

/* ================= 동료근무 ================= */
// 조 이름: 회사마다 다르게 (A조 · 1조 · 1팀 · 직접)
const TEAM_STYLE={abc:i=>String.fromCharCode(65+i)+'조',num:i=>(i+1)+'조',team:i=>(i+1)+'팀'};
const teamCount=()=>(S.teamOffsets||[]).length||1;
function teamName(g){const c=S.teamStyle==='custom'&&(S.teamNames||[])[g];return c||(TEAM_STYLE[S.teamStyle]||TEAM_STYLE.abc)(g);}
const teamList=()=>[...Array(teamCount())].map((_,g)=>teamName(g));
const myTeamLabel=()=>teamCount()>1?teamName(S.myTeam):'';
/* 조마다 기준(C조)보다 며칠 밀린 근무인지 S.teamOffsets 에 들어 있음 (4조2교대: A+6, B+4, C 0, D+2) */
function teamShift(d,g){
  if(g===S.myTeam||g==null||g>=teamCount())return shiftOf(d);
  const o=S.teamOffsets;
  return holAdj(d,patShift(addDays(d,(o[g]||0)-(o[S.myTeam]||0))));
}
function renderColleague(y0,m0){
  const y=y0??cur.y,m=m0??cur.m,days=new Date(y,m+1,0).getDate(),tk=fmt(new Date());
  let h=`<div class="crow hd"><div></div>${teamList().map((n,g)=>`<div class="${g===S.myTeam?'me':''}" data-act="setteam-ask" data-g="${g}">${n}</div>`).join('')}</div>`;
  for(let i=1;i<=days;i++){
    const d=new Date(y,m,i),k=fmt(d),w=d.getDay(),hol=holName(k),ch=compHol(k);
    const cls=hol?'hol':ch?'chol':w===0?'sun':w===6?'sat':'';
    h+=`<div class="crow ${k===tk?'today':''}"><div class="dt ${cls}" data-act="col-day" data-k="${k}">${i}.${DOW[w]}</div>${teamList().map((n,g)=>`<div class="${g===S.myTeam?'me':''}">${badge(teamShift(d,g),'sm')}</div>`).join('')}</div>`;
  }
  return `<div class="ctbl" style="--tc:${teamCount()}">${h}</div><div style="height:20px"></div>`;
}

/* ================= 근무 시간 · 지금 상태 ================= */
/* 근무타입마다 시간. 안 고치면 "대략"(아래 기본값), 고친 칸만 S.shiftTimes[k] 에 저장
 * {start, end, leave(집에서 나서기), home(집 도착), meal:{on,from,to}, sleep:{on,from,to}, breaks:[{from,to}]} */
const tm2m=t=>{const [h,m]=String(t||'0:0').split(':').map(Number);return (h||0)*60+(m||0);};
const m2tm=m=>{m=((m%1440)+1440)%1440;return `${pad(Math.floor(m/60))}:${pad(m%60)}`;};
function defaultTimes(k){
  const t=typeOf(k),nm=t.noGuess?'':(t.name||'')+k;
  let start='09:00',end='18:00',meal={on:true,from:'12:00',to:'13:00'},sleep={on:false,from:'09:00',to:'14:00'};
  if(/야|夜|night/i.test(nm)){start='19:00';end='07:00';meal={on:true,from:'00:00',to:'01:00'};sleep={on:true,from:'08:30',to:'13:30'};}
  else if(/주간|^주|주$/.test(nm)){start='07:00';end='19:00';meal={on:true,from:'12:00',to:'13:00'};}
  else if(/당직|24/.test(nm)){start='09:00';end='09:00';meal={on:true,from:'12:00',to:'13:00'};sleep={on:true,from:'10:30',to:'15:30'};}
  return {start,end,leave:m2tm(tm2m(start)-30),home:m2tm(tm2m(end)+30),meal,sleep,breaks:[]};
}
function timesOf(k){
  const d=defaultTimes(k),c=(S.shiftTimes||{})[k]||{};
  const o=Object.assign({},d,c);
  o.meal=Object.assign({},d.meal,c.meal);o.sleep=Object.assign({},d.sleep,c.sleep);o.breaks=c.breaks||d.breaks;
  // 시작 · 끝만 고쳤으면 나서기 · 도착도 따라감
  if(c.start&&!c.leave)o.leave=m2tm(tm2m(o.start)-30);
  if(c.end&&!c.home)o.home=m2tm(tm2m(o.end)+30);
  return o;
}
const timesCustom=k=>Object.keys((S.shiftTimes||{})[k]||{}).length>0;
// v0.234 시작 · 끝 중 하나만 고쳐도 둘 다 저장 (하나만 있으면 다시 켤 때 normalize 가 지워서 "정하기"로 돌아가던 것 · 날씨 출퇴근이 집만 나오던 원인)
// v0.234 근무 패턴 화면에 보이는 기본 시간을 진짜로 저장 (사용자 결정: 화면엔 보이는데 날씨 · 위젯은 "안 정함"으로 보던 것 없앰) — 시간이 없는 근무타입만 채움
function fillDefTimes(){if(!S.myset)return false;let n=0;S.shiftTimes=S.shiftTimes||{};(S.types||[]).forEach(t=>{if(!t||t.rest||t.k===NONE_K||timesCustom(t.k))return;try{const d=defaultTimes(t.k);if(okTime(d.start)&&okTime(d.end)){S.shiftTimes[t.k]={start:d.start,end:d.end};n++;}}catch(e){}});return n>0;}
function stSet(k,f,v){const x=timesOf(k);S.shiftTimes=S.shiftTimes||{};const c=(S.shiftTimes[k]=S.shiftTimes[k]||{});if(!c.start)c.start=x.start;if(!c.end)c.end=x.end;if(v)c[f]=v;return c;}
const workTypes=()=>(S.types||[]).filter(t=>!t.rest);
const ST_DEF={commute:['🚗','출근 중'],work:['🏭','근무 중'],meal:['🍱','점심 시간'],night:['🍗','야식 시간'],brk:['☕','쉬는 시간'],back:['🚗','퇴근 중'],home:['🏠','집에 왔어요'],sleep:['😴','자는 중'],rest:['🙂','쉬는 중'],end:['🏁','근무 끝']};
const ROW_DEF={commute:'집에서 나서기',work:'근무 시작',end:'근무 끝',home:'집 도착',sleep:'수면'};   // 근무 시간 화면 줄 이름 (바꾸면 labels[key].n)
const rowName=key=>((S.status.labels||{})[key]||{}).n||ROW_DEF[key];
function stLabel(key){const c=(S.status.labels||{})[key]||{};const d=ST_DEF[key];return {e:c.e||(key==='work'?S.status.work||d[0]:d[0]),t:c.t||d[1]};}
// 한 근무날의 시각들(밀리초)
// 그날 실제 시간: ⏱ 연장으로 실제 출근 · 퇴근을 적은 날은 그 시각 (나서기 · 집 도착도 같이 밀림)
function dayTimesOf(d,k){
  const t=timesOf(k),o=S.ot&&S.ot[fmt(d)];
  if(!o||isRest(k))return t;
  const ds=tm2m(o[0])-tm2m(t.start),de=tm2m(o[1])-tm2m(t.end);
  return Object.assign({},t,{start:o[0],end:o[1],leave:m2tm(tm2m(t.leave)+ds),home:m2tm(tm2m(t.home)+de)});
}
// 야간(기본 22~06시, 수당 설정에서 바꿈)과 겹친 시간 (ms 구간 → ms)
const nightWin=()=>{const n=(S.salary&&S.salary.night)||['22:00','06:00'];return [tm2m(n[0]),tm2m(n[1])];};
function nightOverlap(s,e){
  if(!(e>s))return 0;const [ns,ne]=nightWin(),d0=new Date(s);d0.setHours(0,0,0,0);let tot=0;
  for(let b=d0.getTime()-864e5;b<e;b+=864e5){const ws=b+ns*6e4,we=b+(ne<=ns?ne+1440:ne)*6e4;tot+=Math.max(0,Math.min(e,we)-Math.max(s,ws));}
  return tot;
}
// 그날 근무 시간 (시간 단위): 일한 시간(식사 뺌) · 연장(8시간 넘는 부분, 대근은 전부) · 야간 · 대근 · 연장 신청(원래보다 늘어난 시간) · 그중 야간
function dayHours(d){
  const k=fmt(d),sh=shiftOf(d);if(!S.myset||isRest(sh)||persOn(k))return null;
  let p;try{p=dayPlan(d,sh);}catch(e){return null;}
  const ov=(a,b)=>p.meal?Math.max(0,Math.min(b,p.meal[1])-Math.max(a,p.meal[0])):0;
  const work=Math.max(0,(p.end-p.start-ov(p.start,p.end))/36e5),dae=isRest(baseShift(d));
  const night=Math.max(0,(nightOverlap(p.start,p.end)-(p.meal?nightOverlap(Math.max(p.start,p.meal[0]),Math.min(p.end,p.meal[1])):0))/36e5);
  let req=0,reqN=0;
  if(S.ot&&S.ot[k]){const t=timesOf(sh),b=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(),s0=b+tm2m(t.start)*6e4;let e0=b+tm2m(t.end)*6e4;if(e0<=s0)e0+=864e5;
    req=Math.max(0,((p.end-p.start)-(e0-s0))/36e5);reqN=Math.max(0,(nightOverlap(p.start,p.end)-nightOverlap(s0,e0))/36e5);}
  return {work,ot:dae?work:Math.max(0,work-8),night,dae,req,reqN};
}
function dayPlan(d,k){
  const t=dayTimesOf(d,k),base=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(),at=m=>base+m*60000;
  const s=tm2m(t.start);let e=tm2m(t.end);if(e<=s)e+=1440;
  let lv=tm2m(t.leave);if(lv>s)lv-=1440;
  let hm=tm2m(t.home);while(hm<e)hm+=1440;
  const inShift=(f,to)=>{let a=tm2m(f),b=tm2m(to);while(a<s)a+=1440;while(b<=a)b+=1440;return [at(a),at(b)];};
  const p={k,t,leave:at(lv),start:at(s),end:at(e),home:at(hm),meal:t.meal.on?inShift(t.meal.from,t.meal.to):null,breaks:(t.breaks||[]).map(b=>Object.assign(inShift(b.from,b.to),{icon:b.icon,name:b.name})),sleep:null};
  if(t.sleep.on){let a=tm2m(t.sleep.from)+1440*Math.floor(e/1440),b=tm2m(t.sleep.to)+1440*Math.floor(e/1440);if(a<e)a+=1440;while(b<=a)b+=1440;p.sleep=[at(a),at(b)];}
  return p;
}
// 지금 내 상태 {key,e,t,sub,prog,phone}
function myStatus(now){
  // v0.107: 세 가지만 — 근무 중(막대 · 몇 시 끝) / 쉬는 중(다음 근무) / 휴무 (예전 식사 · 쉬는 시간 · 나서기 · 귀가 · 수면 단계는 없앰)
  now=now||Date.now();const d0=new Date(now),day=new Date(d0.getFullYear(),d0.getMonth(),d0.getDate());
  const mk=(key,e,t,sub,extra)=>Object.assign({key,e,t,sub},extra||{});
  // v0.171: 쉬는 중 = 쉬는 날만 · 근무 날은 출근 전 / 퇴근 후 · 시간을 안 정한 근무는 짐작 없이 근무 이름만
  for(const off of [-1,0]){
    const d=addDays(day,off),k=shiftOf(d);if(isRest(k)||!timesCustom(k))continue;
    const p=dayPlan(d,k);
    if(now>=p.start&&now<p.end)return mk('work',stLabel('work').e||'💼','근무 중',`${t12(p.t.end,true)} 끝`,{prog:(now-p.start)/(p.end-p.start),left:`퇴근까지 ${remain(p.end-now)}`,startT:p.t.start,endT:p.t.end,sk:k});
  }
  let next='';
  for(let i=0;i<10;i++){
    const d=addDays(day,i),k=shiftOf(d);if(isRest(k))continue;
    if(!timesCustom(k)){if(i===0)continue;next=`${i===1?'내일':`${d.getMonth()+1}/${d.getDate()}`} ${shiftLabel(k)}`;break;}
    const p=dayPlan(d,k);if(p.start<=now)continue;
    next=`${i===0?'오늘':i===1?'내일':`${d.getMonth()+1}/${d.getDate()}`} ${shiftLabel(k)} · ${t12(p.t.start,true)} 시작`;break;
  }
  const k0=shiftOf(day);
  if(isRest(k0))return mk('off','🏖','쉬는 중','',{next});   // v0.174 다음 근무 줄 뺌 (가족 시간표에 나옴)
  if(!timesCustom(k0))return mk('rest','',shiftLabel(k0),'',{sk:k0,day:1,next});
  const p0=dayPlan(day,k0);
  return now<p0.start?mk('rest','','출근 전',`${t12(p0.t.start,true)} 시작`,{sk:k0}):mk('rest','','퇴근 후','',{sk:k0,next});
}
/* 시간 · 날짜 고르기 버튼: 폰 기본 선택창 대신 앱 안의 고르기 창을 띄움 (폰에 따라 기본 창이 안 뜨는 일이 있어서)
 * 값은 같은 id 의 숨은 입력칸에 넣고 'change' 를 보내서, 값을 받는 원래 코드는 그대로 씀 */
const tfmt=v=>{if(!v)return '--:--';const [h,m]=v.split(':').map(Number);return `${h<12?'오전':'오후'} ${h%12===0?12:h%12}:${pad(m)}`;};
const dfmt=v=>v?`${+v.slice(5,7)}/${+v.slice(8)}`:'날짜';
function tpick(id,v,cls,type){type=type||'time';return `<button type="button" class="tbtn ${cls||''}" data-act="tpk" data-id="${id}" data-type="${type}"><span>${type==='date'?dfmt(v):tfmt(v)}</span></button><input type="hidden" id="${id}" value="${esc(v||'')}">`;}
let tpk=null;
function openTpk(id,type){
  const inp=$('#'+id);if(!inp)return;
  const v=inp.value;
  if(type==='date'){const d=v?parse(v):new Date();tpk={id,type,y:d.getFullYear(),m:d.getMonth(),v:v||fmt(new Date())};}
  else{const [h,mi]=(v||'09:00').split(':').map(Number);tpk={id,type,h:h||0,mi:mi||0};}
  renderTpk();
}
function renderTpk(){
  const t=tpk;if(!t)return;
  if(t.type==='date'){
    const lead=leadOf(new Date(t.y,t.m,1)),days=new Date(t.y,t.m+1,0).getDate(),tk=fmt(new Date());
    let g=weekOrder().map(w=>`<b class="${w===0?'s':w===6?'t':''}">${DOW[w]}</b>`).join('')+'<span></span>'.repeat(lead);
    for(let i=1;i<=days;i++){const k=fmt(new Date(t.y,t.m,i)),w=new Date(t.y,t.m,i).getDay();g+=`<button class="${k===t.v?'on':''} ${k===tk?'td':''} ${holName(k)||w===0?'s':w===6?'t':''}" data-act="tpk-d" data-v="${k}">${i}</button>`;}
    openPop(`<div class="mh">날짜 고르기<b>${t.y}년 ${t.m+1}월</b></div>
      <div class="tpk-cal"><div class="tpk-mh"><button class="ib" data-act="tpk-m" data-v="-12" aria-label="작년">«</button><button class="ib" data-act="tpk-m" data-v="-1" aria-label="지난달">‹</button><b>${t.y}.${pad(t.m+1)}</b><button class="ib" data-act="tpk-m" data-v="1" aria-label="다음 달">›</button><button class="ib" data-act="tpk-m" data-v="12" aria-label="내년">»</button></div><div class="tpk-dg">${g}</div></div>
      <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">닫기</button></div>`);
  }else{
    const pm=t.h>=12,h12=t.h%12===0?12:t.h%12;
    openPop(`<div class="mh">시간 고르기</div>
      <div class="tpw" aria-label="시간 고르기"><div class="tpw-band"></div>${tpwCol('ap',['오전','오후'],false)}${tpwCol('h',[...Array(12)].map((_,i)=>String(i+1)),true)}<b class="tpw-colon">:</b>${tpwCol('mi',[...Array(60)].map((_,i)=>pad(i)),true)}</div>
      <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">취소</button><button class="btn grow" data-act="tpk-ok">정하기</button></div>`);
    tpwInit('ap',pm?1:0);tpwInit('h',h12-1);tpwInit('mi',t.mi);
  }
}
// 바퀴: 시 · 분은 같은 목록을 5번 이어 붙여 두고(가운데 묶음에서 시작) 멈출 때마다 가운데 묶음의 같은 자리로 몰래 옮김 → 끝없이 도는 것처럼(59 다음 00, 12 다음 1)
const TPW_REP=5;
function tpwCol(k,vals,loop){
  const reps=loop?TPW_REP:1;let it='';
  for(let r=0;r<reps;r++)vals.forEach((v,i)=>{it+=`<div class="tpw-i" data-i="${i}">${v}</div>`;});
  return `<div class="tpw-col" data-k="${k}" data-n="${vals.length}" data-loop="${loop?1:0}"><div class="tpw-pad"></div>${it}<div class="tpw-pad"></div></div>`;
}
function tpwH(c){const e=c.querySelector('.tpw-i');return (e&&e.offsetHeight)||44;}
function tpwMark(c){const g=Math.round(c.scrollTop/tpwH(c)),its=c.querySelectorAll('.tpw-i');its.forEach((e,i)=>e.classList.toggle('on',i===g));}
function tpwInit(k,idx){
  const c=document.querySelector(`.tpw-col[data-k="${k}"]`);if(!c)return;
  const n=+c.dataset.n,loop=c.dataset.loop==='1',H=tpwH(c);
  c.scrollTop=((loop?Math.floor(TPW_REP/2)*n:0)+idx)*H;tpwMark(c);
  let tm=0,raf=0;
  c.addEventListener('scroll',()=>{
    if(!raf)raf=requestAnimationFrame(()=>{raf=0;tpwMark(c);});
    clearTimeout(tm);tm=setTimeout(()=>tpwSettle(c),130);
  },{passive:true});
  c.addEventListener('click',e=>{const it=e.target.closest('.tpw-i');if(!it)return;const g=[...c.querySelectorAll('.tpw-i')].indexOf(it);c.scrollTo({top:g*tpwH(c),behavior:'smooth'});});
}
function tpwSettle(c){
  if(!tpk||!c.isConnected)return;
  const n=+c.dataset.n,loop=c.dataset.loop==='1',H=tpwH(c);
  let g=Math.max(0,Math.round(c.scrollTop/H));const i=g%n;
  if(loop){const mid=Math.floor(TPW_REP/2)*n+i;if(g!==mid){c.scrollTop=mid*H;g=mid;}}
  else if(Math.abs(c.scrollTop-g*H)>1)c.scrollTop=g*H;
  tpwMark(c);
  const k=c.dataset.k,t=tpk;
  if(k==='ap')t.h=t.h%12+(i?12:0);
  else if(k==='h')t.h=((i+1)%12)+(t.h>=12?12:0);
  else t.mi=i;
}
function tpkOk(){
  if(tpk&&tpk.type==='time')document.querySelectorAll('.tpw-col').forEach(tpwSettle);   // 바퀴가 아직 도는 중이면 지금 가운데 값으로
  const t=tpk;tpk=null;closePop();if(!t)return;
  const inp=$('#'+t.id);if(!inp)return;
  const v=t.type==='date'?t.v:`${pad(t.h)}:${pad(t.mi)}`;
  if(t.id==='mmDateH'){mmMoveTo(v);return;}
  inp.value=v;
  const b=document.querySelector(`.tbtn[data-id="${t.id}"] span`);if(b)b.textContent=t.type==='date'?dfmt(v):tfmt(v);
  inp.dispatchEvent(new Event('change',{bubbles:true}));
}
const MEAL_EMO=['🍗','🍱','☕','🍜','🥪','🍙','😴','🚬','📖','🧘'];
const mealOf=t=>{const n=tm2m(t.meal.from)<5*60||tm2m(t.meal.from)>=21*60;return {icon:t.meal.icon||(n?'🍗':'🍱'),name:t.meal.name||(n?'야식 시간':'점심 시간'),night:n};};
/* ---- 설정 › 근무 시간 · 상태 ---- */
let timesTab='';
let pageBack=null;   // 안쪽 페이지를 닫으면 돌아갈 곳 (예: 날씨 설정 → 근무 시간 → 날씨 설정)
// 상태 이모티콘도 스티커와 같은 큰 목록(탭 + 내 것)에서 고름 · 약 모양은 뺌
const statCats=()=>STAMP_CAT.filter(c=>!c[1].some(x=>String(x[0]).startsWith('pill:')));
function openTtIcon(i){
  const t=timesOf(timesTab),isM=i==='m',b=isM?null:t.breaks[+i];if(!isM&&!b)return;
  const cur0=isM?mealOf(t):{icon:b.icon||'☕',name:b.name||'쉬는 시간'};
  openIcn({title:'아이콘 · 이름 바꾸기',sub:`${shiftLabel(timesTab)} · ${cur0.name}`,icon:cur0.icon,name:cur0.name,placeholder:'이름 (예: 휴게 시간)',cats:statCats(),
    onSave:(e,n)=>ttIconSet(i,e,n),onReset:()=>ttIconSet(i,'','')});
}
function ttIconSet(i,icon,name){
  if(i==='m')ttSet('meal',{icon,name});
  else{const b=timesOf(timesTab).breaks.map(x=>Object.assign({},x));if(b[+i]){b[+i].icon=icon;b[+i].name=name;ttSet('breaks',b);}}
}
function ttSet(field,val){
  const k=timesTab,c=stSet(k);   // v0.234 시작 · 끝도 같이 저장 (식사 · 나서기만 고쳐도 다시 켤 때 안 지워지게)
  if(field==='meal'||field==='sleep')c[field]=Object.assign({},timesOf(k)[field],c[field],val);
  else c[field]=val;
  save();
}
/* ---- 설정 › 가족에게 보이는 내 상태 ---- */
const WORK_EMO=[['🏭','공장'],['🏥','병원'],['🩺','간호 · 요양'],['🚒','소방'],['👮','경찰'],['🪖','군인'],['⚡','발전소'],['📦','물류'],['🛡','경비 · 보안'],['🏨','호텔'],['🎧','콜센터'],['🚌','버스 · 택시'],['🚇','철도 · 지하철'],['✈️','공항'],['⛴','항만 · 선박'],['🏪','매장'],['🏢','회사']];
const STATUS_EMO=['🚗','🚌','🚶','🏭','💼','🍱','🍗','☕','🏠','😴','🙂','📺','🎮','🛌'];
const workName=()=>{const w=S.status.work,f=WORK_EMO.find(([e])=>e===w);return f?f[1]:(S.status.workName||'직접 입력');};
// 다음에 바뀔 상태 몇 개: "다음: 🚗 퇴근 중 07:00 → 🏠 집에 왔어요 07:30 → …"
function statusNext(now,n){
  const t0=new Date(now),day=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()),pts=[];
  for(const off of [-1,0,1,2,3]){
    const d=addDays(day,off),k=shiftOf(d);if(isRest(k))continue;
    const p=dayPlan(d,k),ml=mealOf(p.t);
    pts.push([p.leave,'commute'],[p.start,'work']);
    if(p.meal)pts.push([p.meal[0],ml.night?'night':'meal',{e:ml.icon,t:ml.name}],[p.meal[1],'work']);
    p.breaks.forEach(b=>pts.push([b[0],'brk',{e:b.icon||'☕',t:b.name||'쉬는 시간'}],[b[1],'work']));
    pts.push([p.end,'back'],[p.home,'home']);
    if(p.sleep)pts.push([p.sleep[0],'sleep'],[p.sleep[1],'rest']);else pts.push([p.home+3600e3,'rest']);
  }
  pts.sort((a,b)=>a[0]-b[0]);
  const out=[],tk=fmt(t0),tm=fmt(addDays(day,1));let last=myStatus(now).key;
  for(const [at,key,o] of pts){
    if(at<=now||key===last)continue;
    last=key;const l=Object.assign(stLabel(key),o||{}),x=new Date(at),k=fmt(x),hm=`${pad(x.getHours())}:${pad(x.getMinutes())}`;
    out.push({e:l.e,t:l.t,when:k===tk?hm:k===tm?`내일 ${hm}`:`${x.getMonth()+1}/${x.getDate()} ${hm}`});
    if(out.length>=n)break;
  }
  return out;
}
// 내 직장 고르기 창
function openWorkPick(){
  const st=S.status,known=WORK_EMO.some(([e])=>e===st.work);
  openPop(`<div class="mh">근무 중일 때 아이콘<b>내 직장</b></div>
    <div class="mi"><div class="wemo w4">${WORK_EMO.map(([e,n])=>`<button class="${st.work===e?'on':''}" data-act="st-work" data-v="${e}"><span>${e}</span>${n}</button>`).join('')}<button class="${known?'':'on'}" data-act="st-work-own"><span>${known?'✏️':ico(st.work)}</span>${known?'직접 입력':esc(workName())}</button></div></div>
    <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);
}
function openWorkOwn(){
  const st=S.status,known=WORK_EMO.some(([e])=>e===st.work);
  openIcn({title:'내 직장 직접 입력',sub:'목록에 없으면 이모티콘이나 사진 + 이름',icon:known?'':st.work,name:known?'':(st.workName||''),placeholder:'이름 (예: 빵 공장)',maxName:10,
    emojis:['🏭','🏗','🔧','🧪','💻','🍞','🍳','🚚','⚓','🛢','🧹','🔥'],needIcon:true,
    onSave:(e,n)=>{setWork(e,n||'');}});
}
function setWork(e,name){
  S.status.work=e;S.status.workName=name;
  if(S.status.labels.work)S.status.labels.work.e='';   // 직장을 고르면 "근무 중" 아이콘도 그걸로
  save();render();
}
function openStatusEdit(key){
  const l=stLabel(key);
  openIcn({title:'이모티콘 · 문구 바꾸기',sub:l.t,icon:l.e,name:l.t,maxName:16,cats:statCats(),
    onSave:(e,n)=>{S.status.labels[key]=Object.assign({},S.status.labels[key],{e,t:n});save();render();},
    onReset:()=>{const c=S.status.labels[key];if(c){delete c.e;delete c.t;if(!c.n)delete S.status.labels[key];}save();render();}});
}
// 근무 시간 화면 줄(나서기 · 근무 시작 · 근무 끝 · 집 도착 · 수면): 아이콘(내 상태 아이콘과 같이 씀) + 줄 이름
function openRowEdit(key){
  const l=stLabel(key);
  openIcn({title:'아이콘 · 이름 바꾸기',sub:rowName(key),icon:l.e,name:rowName(key),maxName:12,placeholder:'이름 (예: 집에서 출발)',cats:statCats(),
    onSave:(e,n)=>{const c=S.status.labels[key]||{};if(e)c.e=e;c.n=(n||'').trim()===ROW_DEF[key]?'':(n||'').trim();if(!c.e&&!c.t&&!c.n)delete S.status.labels[key];else S.status.labels[key]=c;save();render();},
    onReset:()=>{const c=S.status.labels[key];if(c){delete c.e;delete c.n;if(!c.t)delete S.status.labels[key];}save();render();}});
}

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
function stampSet(id,k,v){if(v>0&&S.link&&!S.link.stkAsked)setTimeout(()=>{try{stkAskCheck();}catch(e){}},1500);   // v0.239 처음 붙인 뒤 (창이 열려 있으면 가족 소식이 올 때 다시)

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
  toast(d.edit?(d.back==='day'&&d.rep!=='once'?`${ic} ${s.name} · ${parse(k).getMonth()+1}월 ${parse(k).getDate()}일부터 바뀌었어요`:`${ic} ${s.name} 고쳤어요 · ${stampRule(s)}`):d.rep==='once'?`${ic} ${s.name} 이날 등록했어요${s.ats&&s.ats.length?' · 시각에 알림이 울려요':''}`:`${ic} ${s.name} · ${stampRule(s)}`);
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

/* ================= 알람 목록 ================= */
const OFF_NAME={'-1':'전날','0':'','1':'다음날'};
function renderAlarm(){
  const sched=buildSchedule(60),n=sched.find(x=>!x.a.wxOnly);
  const nextFire={};
  sched.forEach(x=>{if(!(x.a.id in nextFire))nextFire[x.a.id]=x.at.getTime();});
  const nextHtml=S.alarms.length?'':`<div class="next alempty"><div class="big">알람이 없어요</div></div>`;
  const now0=Date.now();
  const order=[...S.alarms].sort((x,y)=>(nextFire[x.id]??8.64e15)-(nextFire[y.id]??8.64e15));
  // 근무 색(달력과 같은 색): 주간 하늘 · 야간 살구 … / 매일 · 색 없는 근무는 null
  const shiftCol=a=>{if(a.shift==='*')return null;const c=tColors(typeOf(a.shift));return c?c.bg:null;};
  // 맨 위 "다음 알람" 카드: 다음에 울릴 알람 하나를 크게 · 남은 시간은 여기에만
  const nextCard=(()=>{
    if(!n)return '';const a=n.a,at=n.at,t=ampm(a.time),col=shiftCol(a);
    const d0=new Date();d0.setHours(0,0,0,0);const dd=Math.round((new Date(at.getFullYear(),at.getMonth(),at.getDate())-d0)/864e5);
    const day=dd===0?'오늘':dd===1?'내일':dd===2?'모레':`${at.getMonth()+1}월 ${at.getDate()}일 (${DOW[at.getDay()]})`;
    // v0.126 큰 카드 대신 한 줄 (아래 목록이 곧 울리는 순이라 두 번 크게 보일 필요 없음)
    return `<div class="anext1" data-act="aedit" data-id="${a.id}"><span class="nxi">${npi('bell',20)}</span><span class="nxt"><small>다음 알람</small><b>${day} ${t12(a.time)}</b></span><span class="r">${remain(at.getTime()-now0)} 후</span></div>`;   // v0.146 새 모양
  })();
  const cards=order.map(a=>{
    // v0.146 새 모양: 연한 근무 색 바탕 · 왼쪽 띠 · 배지 · 큰 시간(앞 0 없음) · 아래 칩(소리 막대 · 진동 · 날씨 · 한 번만 · 전날/다음날) · 근무 색 없는 알람은 파랑
    const col=shiftCol(a),t=ampm(a.time);
    const ch=[];
    if(OFF_NAME[String(a.offset||0)])ch.push(`<span class="cp">${OFF_NAME[String(a.offset||0)]}</span>`);
    if(a.once){const od=onceDay(a);ch.push(`<span class="cp once">${npi('repeat',13)}한 번만${od?` · ${od}`:''}</span>`);}
    if(!a.wxOnly){
      ch.push(a.sound!==false?`<span class="cs">${npi('volume-2',14)}<i class="vb"><i style="width:${Math.max(8,Math.round(a.vol??100))}%"></i></i></span>`:`<span class="cp">${npi('volume-2',13)}무음</span>`);
      if(a.vib!==false)ch.push(`<span class="cp">진동</span>`);
    }
    if(a.wxOnly)ch.push(`<span class="cp w">${npi('cloud-sun',13)}날씨만</span>`);
    else if(a.wx!==false&&wxOn())ch.push(`<span class="cp w">${npi('cloud-sun',13)}끈 뒤 보기</span>`);
    const skip=a.on&&a.skipAt>now0?`<span class="askip-l">${(()=>{const x=new Date(a.skipAt);return `${x.getMonth()+1}/${x.getDate()}`;})()} 건너뜀 · <button data-act="askip-undo" data-id="${a.id}">되돌리기</button></span>`
      :a.on&&nextFire[a.id]&&!a.once&&nextFire[a.id]-now0<24*3600e3?`<button class="askip-l" data-act="askip" data-id="${a.id}">이번만 끄기 ›</button>`:'';
    const why=[a.on&&a.wxOnly&&!wxOn()?'날씨가 꺼져 있어서 안 와요':a.on&&!nextFire[a.id]?'두 달 안에 울릴 날이 없어요':'',a.noHol?'공휴일 쉼':''].filter(Boolean).join(' · ');
    return `
    <div class="acard ac2 ${a.on?'':'off'}" data-act="aedit" data-id="${a.id}"${col?` style="--ac:${col}"`:''}>
      <div class="acard-left">
        <div class="acard-n">${a.shift==='*'?'<span class="badge sm r">매일</span>':badge(a.shift,'sm','')}<b>${esc(a.label||(a.shift==='*'?'매일 알람':shiftLabel(a.shift)+' 알람'))}</b></div>
        <div class="acard-top"><span class="ap">${t.ap}</span><span class="tm">${t.tm.replace(/^0(?=\d:)/,'')}</span></div>
        <div class="icon-row">${ch.join('')}${skip}</div>
        ${why?`<div class="aleft">${why}</div>`:''}
      </div>
      <label class="sw big"><input type="checkbox" data-act="atoggle" data-id="${a.id}" ${a.on?'checked':''}><i></i></label>
    </div>`;
  }).join('');
  const issueHtml=nativeIssues().map(k=>`<div class="notice-banner" data-act="nativefix" data-k="${k}" style="margin-top:8px"><span>⚠️ ${ISSUE_TXT[k]||k}</span><b style="font-size:12px;flex:none;margin-left:8px">설정 열기</b></div>`).join('');
  return `<div class="alw">${issueHtml}${nextHtml}${nextCard}
    ${S.alarms.length?'<div class="list-header"><span>곧 울리는 순</span><span class="all-off" data-act="alloff">전체 끄기</span></div>':''}
    <div>${cards}</div></div>`;
}

/* ================= 시트 · 페이지 · 작은 메뉴 ================= */
// v0.213 알약 · 값 글자가 바뀌어 폭이 달라지면(근무 휴무 → 야간 · 바뀜 등) 폭은 옛 폭 → 새 폭으로 늘고 줄며 글자는 살짝 바뀜
const W_SEL='.sh-pill,.npv,.pv,.tbtn,.mval';
function wSnap(root){const m={},c={};m.__pl={};root.querySelectorAll('.prow .pl2').forEach(e=>{const k=(e.firstChild&&e.firstChild.textContent||'').trim();if(k&&!m.__pl[k])m.__pl[k]=[e.getBoundingClientRect().top,e.querySelectorAll('small').length];});root.querySelectorAll(W_SEL).forEach(e=>{const k=(e.classList[0]||'')+'|'+(e.dataset.act||'');c[k]=(c[k]||0)+1;m[k+'#'+c[k]]=[e.getBoundingClientRect().width,e.textContent];});return m;}
function wPlay(root,m){if(!m)return;const c={};
  // v0.213 줄 이름 아래 작은 글(예: 11/20 한 번 울려요)이 생기거나 없어져 이름이 위아래로 옮겨지면 툭 말고 스르르 · 새 작은 글은 살짝 나타남
  if(m.__pl){root.querySelectorAll('.prow .pl2').forEach(e=>{const k=(e.firstChild&&e.firstChild.textContent||'').trim(),o=k&&m.__pl[k];if(!o)return;const [t0,s0]=o,dy=t0-e.getBoundingClientRect().top,sm=e.querySelectorAll('small').length;
    if(Math.abs(dy)>=2&&Math.abs(dy)<40)e.animate([{transform:`translateY(${dy}px)`},{transform:'none'}],{duration:300,easing:'cubic-bezier(.2,.9,.25,1)'});
    if(sm>s0)e.querySelectorAll('small').forEach(x=>x.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'none'}],{duration:280,delay:60,fill:'backwards'}));});}
root.querySelectorAll(W_SEL).forEach(e=>{const k=(e.classList[0]||'')+'|'+(e.dataset.act||'');c[k]=(c[k]||0)+1;const o=m[k+'#'+c[k]];if(!o||o[1]===e.textContent)return;
  const w1=e.getBoundingClientRect().width,E='cubic-bezier(.2,.9,.25,1)';
  if(Math.abs(w1-o[0])>2){e.style.overflow='hidden';const an=e.animate([{width:o[0]+'px'},{width:w1+'px'}],{duration:340,easing:E});an.onfinish=an.oncancel=()=>{e.style.overflow='';};}
  [...e.children].forEach(x=>x.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:280,delay:60,easing:E,fill:'backwards'}));
  if(!e.children.length)e.animate([{color:'transparent'},{}],{duration:240});});}
// v0.212 다시 그릴 때 높이 스르르: 그리기 전 칸 높이를 (종류+순번)으로 적어 두고, 그린 뒤 같은 칸은 옛 높이 → 새 높이 · 새로 생긴 칸은 0 → 높이로 펼침
function hmSnap(root,sel){const m={},c={},rt=root.getBoundingClientRect().top;m.__w=wSnap(root);root.querySelectorAll(sel).forEach(e=>{const k=e.className.replace(/ ?tapx/g,'');c[k]=(c[k]||0)+1;m[k+'#'+c[k]]=e.offsetHeight;m['@'+k+'#'+c[k]]=e.getBoundingClientRect().top-rt;});return m;}
function hmPlay(root,sel,m){try{if(RMq())return;wPlay(root,m.__w);const c={},E='cubic-bezier(.2,.9,.25,1)',L=[];root.querySelectorAll(sel).forEach(e=>{const k=e.className.replace(/ ?tapx/g,'');c[k]=(c[k]||0)+1;const a0=m[k+'#'+c[k]];
  L.push([e,a0==null?0:a0,a0==null,m['@'+k+'#'+c[k]]]);e.style.overflow='hidden';e.style.height=(a0==null?0:a0)+'px';});   // 옛 높이로 잠가 두고
  requestAnimationFrame(()=>{const rt=root.getBoundingClientRect().top;L.forEach(([e,a0,nw,y0])=>{e.style.height='';
    if(!nw&&y0!=null){const dy=y0-(e.getBoundingClientRect().top-rt);if(Math.abs(dy)>=4)e.animate([{transform:`translateY(${dy}px)`},{transform:'none'}],{duration:320,easing:E,composite:'add'});}   /* 위 칸이 없어져 자리가 옮겨진 칸은 미끄러져 옴 */
    const a1=e.offsetHeight;if(Math.abs(a1-a0)<4||(nw&&a1<4)){e.style.overflow='';return;}   // 한 박자 뒤 다 그려진 높이로 (바로 재면 아직 덜 그려져 끝에 툭)
    const an=e.animate(nw?[{height:'0px',opacity:0},{height:a1+'px',opacity:1}]:[{height:a0+'px'},{height:a1+'px'}],{duration:320,easing:E});an.onfinish=an.oncancel=()=>{e.style.overflow='';};});});}catch(e){}}
function openSheet(html,full){const top=!!pageMode,was=$('#sheet').classList.contains('open');$('#sheet').classList.remove('closing');
  // v0.212 같은 날짜 창을 다시 그릴 때(근무 바꿈 · 메모 · 스티커 …) 카드 높이가 바뀌면 툭 말고 스르르
  const rk=sheetMode+'|'+(sheetMode==='day'?sheetKey:sheetMode==='mandy'?manDayK:sheetMode==='vcday'?rqD.k:''),sh0=$('#sheet'),same=was&&sh0.dataset.rk===rk,h0=same?hmSnap(sh0,'.dsbody>*'):null;
  $('#sheet').innerHTML=html;$('#sheet').dataset.rk=rk;
  if(h0)hmPlay(sh0,'.dsbody>*',h0);$('#sheet').classList.add('open');$('#sheet').classList.toggle('full',!!full);$('#sheet').classList.toggle('top',top);$('#scrim').classList.add('open');$('#scrim').classList.toggle('top',top);try{MO.sheetOpen($('#sheet'),was);}catch(e){}}
function closeSheet(){
  const mk=sheetMode==='day'||sheetMode==='vcday'?(sheetMode==='vcday'?rqD.k:sheetKey):null;
  if(sheetKey){const m0=JSON.stringify(S.memos[sheetKey]||null);tidyMemos(sheetKey);if(JSON.stringify(S.memos[sheetKey]||null)!==m0)save();}
  const need=sheetKey&&dataRev!==renderRev;   // v0.200 바뀔 때마다 이미 달력을 다시 그려 둠 → 닫을 때는 바뀐 게 남아 있을 때만
  let fx=false;try{fx=MO.sheetClose($('#sheet'),mk);}catch(e){}   // 껍데기가 그 날짜 칸으로 쏙 (칸이 안 보이면 아래로)
  if(need)setTimeout(()=>render(),fx?320:0);
  $('#sheet').classList.remove('open');$('#scrim').classList.remove('open');
  sheetKey=null;sheetMode=null;replyDraft=null;typeDraft=null;memoEdit=null;ddDraft=null;markSel(null);
}
function reopen(){
  if(sheetMode==='requests')openRequests();
  else if(sheetMode==='day'&&sheetKey)openDay(sheetKey);
  else if(sheetMode==='vcday'&&rqD.k)openVcDay(rqD.k);
  else if(sheetMode==='board')openBoard();
  else if(sheetMode==='dday')openDday();
  else if(sheetMode==='feed')openFeed();
  else if(sheetMode==='stampreg'&&stDraft)renderStampReg();
  else closeSheet();
}
let pageMode=null;
// v0.176 위젯 설정 화면에서만 앱 뒤에 실제 배경화면 (미리보기 바둑판 대신 · 다른 화면은 원래대로)
let wpOn=false;
let wpT=0;
function wpShow(on){on=!!on&&!!(window.AndroidBridge&&typeof window.AndroidBridge.showWallpaper==='function');clearTimeout(wpT);
  if(on&&!wpOn){wpT=setTimeout(()=>{if(pageMode!=='widget'||wpOn)return;wpOn=true;try{window.AndroidBridge.showWallpaper(true);}catch(e){}document.documentElement.classList.add('wpshow');},260);return;}   // v0.189 화면이 다 들어온 뒤 켬 (미끄러지는 중에 켜면 잔상)
  if(!on&&wpOn){wpOn=false;document.documentElement.classList.remove('wpshow');try{window.AndroidBridge.showWallpaper(false);}catch(e){}}}
let pgBackNav=false;
function openPage(html,mode){
  const pm0=pageMode;if(mode)pageMode=mode;   // v0.191 배경화면 보기는 따로 된 폰 화면(WidgetStyleActivity)으로 옮김
  const p=$('#page'),sc=p.querySelector('.pg-b')?p.querySelector('.pg-b').scrollTop:0,same=p.classList.contains('open');
  const morph=same&&!(mode&&mode!==pm0),h0=morph?hmSnap(p,'.pg-b>*'):null;
  p.innerHTML=html;p.classList.add('open');
  if(same&&!(mode&&mode!==pm0)){const b=p.querySelector('.pg-b');if(b)b.scrollTop=sc;}
  // v0.210 같은 페이지를 다시 그릴 때 카드 높이가 바뀌면(알림 줄 · 요일 보기 · 칸 추가 …) 툭 말고 스르르 늘고 줄어듦
  if(morph&&h0)hmPlay(p,'.pg-b>*',h0);
  // v0.209 페이지 안에서 다른 페이지로 갈 때(같은 판에 내용만 바뀜) 툭 말고 옆에서 밀려 들어옴 · 뒤로(‹)는 반대쪽에서
  if((same&&mode&&mode!==pm0)||pgBackNav){const dir=pgBackNav?-1:1;pgBackNav=false;try{if(!RMq())[...p.children].forEach(x=>x.animate([{transform:`translateX(${dir*48}px)`,opacity:0},{transform:'none',opacity:1}],{duration:300,easing:'cubic-bezier(.2,.9,.25,1)'}));}catch(e){}}
}
function closePage(){wpShow(false);manPaint=null;Object.keys(glowPrev).forEach(k=>{if(/^(fc|mc):/.test(k))delete glowPrev[k];});if(pageMode==='tune'){if(tuneDirty()&&!confirm('저장하지 않은 값이 있어요.\n저장하지 않고 나갈까요?'))return;tuneDraft=null;applyTune();$('#page').innerHTML='';}if(pageMode==='alarm')try{if(hasBridge('stopPreview'))window.AndroidBridge.stopPreview();}catch(e){}$('#page').classList.remove('open');pageMode=null;applyTdc();draft=null;render();}
// v0.145 새 모양 선 아이콘 (lucide · ISC)
const NPI={"repeat": "<path d=\"m17 2 4 4-4 4\" /> <path d=\"M3 11v-1a4 4 0 0 1 4-4h14\" /> <path d=\"m7 22-4-4 4-4\" /> <path d=\"M21 13v1a4 4 0 0 1-4 4H3\" />", "calendar-off": "<path d=\"M4.2 4.2A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.82-1.18\" /> <path d=\"M21 15.5V6a2 2 0 0 0-2-2H9.5\" /> <path d=\"M16 2v4\" /> <path d=\"M3 10h7\" /> <path d=\"M21 10h-5.5\" /> <path d=\"m2 2 20 20\" />", "volume-2": "<path d=\"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z\" /> <path d=\"M16 9a5 5 0 0 1 0 6\" /> <path d=\"M19.364 18.364a9 9 0 0 0 0-12.728\" />", "alarm-clock": "<circle cx=\"12\" cy=\"13\" r=\"8\" /> <path d=\"M12 9v4l2 2\" /> <path d=\"M5 3 2 6\" /> <path d=\"m22 6-3-3\" /> <path d=\"M6.38 18.7 4 21\" /> <path d=\"M17.64 18.67 20 21\" />", "tag": "<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\" /> <circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" />", "bell-ring": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" /> <path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" /> <path d=\"M4 2C2.8 3.7 2 5.7 2 8\" /> <path d=\"M22 8c0-2.3-.8-4.3-2-6\" />", "cloud-sun": "<path d=\"M12 2v2\" /> <path d=\"m4.93 4.93 1.41 1.41\" /> <path d=\"M20 12h2\" /> <path d=\"m19.07 4.93-1.41 1.41\" /> <path d=\"M15.947 12.65a4 4 0 0 0-5.925-4.128\" /> <path d=\"M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z\" />", "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /> <path d=\"M10 9H8\" /> <path d=\"M16 13H8\" /> <path d=\"M16 17H8\" />", "trash-2": "<path d=\"M3 6h18\" /> <path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\" /> <path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\" /> <line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\" /> <line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\" />", "calendar": "<path d=\"M8 2v4\" /> <path d=\"M16 2v4\" /> <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /> <path d=\"M3 10h18\" />", "paintbrush": "<path d=\"m14.622 17.897-10.68-2.913\" /> <path d=\"M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z\" /> <path d=\"M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15\" />", "map-pin": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\" /> <circle cx=\"12\" cy=\"10\" r=\"3\" />", "rotate-ccw": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /> <path d=\"M3 3v5h5\" />", "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /> <circle cx=\"12\" cy=\"7\" r=\"4\" />", "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /> <circle cx=\"9\" cy=\"7\" r=\"4\" /> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /> <path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />", "eraser": "<path d=\"m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21\" /> <path d=\"M22 21H7\" /> <path d=\"m5 11 9 9\" />", "calendar-days": "<path d=\"M8 2v4\" /> <path d=\"M16 2v4\" /> <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /> <path d=\"M3 10h18\" /> <path d=\"M8 14h.01\" /> <path d=\"M12 14h.01\" /> <path d=\"M16 14h.01\" /> <path d=\"M8 18h.01\" /> <path d=\"M12 18h.01\" /> <path d=\"M16 18h.01\" />", "plus": "<path d=\"M5 12h14\" /> <path d=\"M12 5v14\" />", "minus": "<path d=\"M5 12h14\" />", "chevron-right": "<path d=\"m9 18 6-6-6-6\" />","chevron-left": "<path d=\"m15 18-6-6 6-6\" />", "chevron-down": "<path d=\"m6 9 6 6 6-6\" />", "history": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /> <path d=\"M3 3v5h5\" /> <path d=\"M12 7v5l4 2\" />", "music": "<path d=\"M9 18V5l12-2v13\" /> <circle cx=\"6\" cy=\"18\" r=\"3\" /> <circle cx=\"18\" cy=\"16\" r=\"3\" />", "bell": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" /> <path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" />", "image": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" /> <circle cx=\"9\" cy=\"9\" r=\"2\" /> <path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\" />", "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />", "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\" /> <path d=\"M7 11V7a5 5 0 0 1 10 0v4\" />", "heart": "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\" />"};
Object.assign(NPI,{"sticky-note": "<path d=\"M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z\" /> <path d=\"M15 3v4a2 2 0 0 0 2 2h4\" />", "smile": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M8 14s1.5 2 4 2 4-2 4-2\" /> <line x1=\"9\" x2=\"9.01\" y1=\"9\" y2=\"9\" /> <line x1=\"15\" x2=\"15.01\" y1=\"9\" y2=\"9\" />", "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /> <circle cx=\"9\" cy=\"7\" r=\"4\" /> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /> <path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />", "chart-column": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\" /> <path d=\"M18 17V9\" /> <path d=\"M13 17V5\" /> <path d=\"M8 17v-3\" />", "smartphone": "<rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"2\" ry=\"2\" /> <path d=\"M12 18h.01\" />", "info": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 16v-4\" /> <path d=\"M12 8h.01\" />", "sparkles": "<path d=\"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z\" /> <path d=\"M20 3v4\" /> <path d=\"M22 5h-4\" /> <path d=\"M4 17v2\" /> <path d=\"M5 18H3\" />"});
const npi=(n,sz=18)=>NPI[n]?`<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NPI[n]}</svg>`:"";
const npRow=(icon,name,right,o={})=>`<div class="prow${o.tap?" tap":""}${o.cls?" "+o.cls:""}"${o.act?` data-act="${o.act}"`:""}${o.attrs||""}><span class="npi">${npi(icon)}</span><div class="pl2">${name}${o.d?`<small class="keep">${o.d}</small>`:""}</div>${right||""}</div>`;
Object.assign(NPI,{   // v0.158 남은 화면
  'briefcase':'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  'book-open':'<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  'more':'<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  'moon':'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'flag':'<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 8 2a6 6 0 0 0 3.6-1.2.5.5 0 0 1 .4.4v11a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a8 8 0 0 0-4 1"/>',
  'calendar-x':'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M10 14l4 4M14 14l-4 4"/>',
  'download':'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  'list-check':'<path d="M11 18H3M15 18l2 2 4-4M16 12H3M16 6H3"/>',
  'grip':'<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>'
});
Object.assign(NPI,{   // v0.156 설정 첫 화면
  'alert':'<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/>',
  'bulb':'<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/>'
});
Object.assign(NPI,{   // v0.155 화면 설정 아이콘
  'grid':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  'circle-dot':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  'sun-moon':'<path d="M12 8a2.8 2.8 0 0 0 4 4 4 4 0 1 1-4-4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
  'type':'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>'
});
Object.assign(NPI,{   // v0.154 작은 창
  'pencil':'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  'ban':'<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
  'bell-off':'<path d="M8.7 3A6 6 0 0 1 18 8a21 21 0 0 0 .6 5M17 17H3s3-2 3-9a4.7 4.7 0 0 1 .3-1.7M10.3 21a1.94 1.94 0 0 0 3.4 0M2 2l20 20"/>',
  'share':'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  'camera':'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  'link':'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'
});
Object.assign(NPI,{   // v0.151 옛 화면 새 모양에 쓰는 선 아이콘 (lucide)
  'home':'<path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9 21v-6h6v6"/>',
  'building':'<path d="M3 21h18M5 21V8l5 3V8l5 3V4h4v17"/>',
  'battery':'<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/>',
  'clock':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'help':'<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  'search':'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  'copy':'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
  'settings':'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  'x':'<path d="M18 6 6 18M6 6l12 12"/>',
  'check':'<path d="M20 6 9 17l-5-5"/>',
  'user-plus':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  'sliders':'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  'chart-line':'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
  'gift':'<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  'heart':'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  'cloud-up':'<path d="M12 13v8M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="m8 17 4-4 4 4"/>',
  'phone':'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'
});
const npVal=v=>`<div class="pv npv">${v||""}${npi("chevron-right",16)}</div>`;
function pageHead(title,right){return `<div class="pg-h"><button class="bk" data-act="page-close" aria-label="뒤로">‹</button><b>${title}</b>${right||'<span style="min-width:56px"></span>'}</div>`;}
function openPop(html){const was=$('#pop').classList.contains('open');$('#pop').innerHTML=`<div class="menu">${html}</div>`;$('#pop').classList.add('open');popIcons($('#pop'));try{MO.popOpen($('#pop'),was);}catch(e){}}
// v0.154 작은 창 새 모양: 줄 맨 앞 이모지를 회색 칸 선 아이콘으로 (♥ · 🔒처럼 가족/나만 뜻이 있는 표시는 그대로)
// v0.196 모션 묶음 (시안 design/day-morph · pop-morph · nav-fill · save-btn · motion-more) — 화면 배치는 한 번만 바꾸고 겉모습(clip · transform · opacity)만 움직여서 버벅이지 않게
const MO=(()=>{
  const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||!document.body.animate;
  const EO='cubic-bezier(.2,.9,.25,1)',EC='cubic-bezier(.45,0,.75,.35)',SP='cubic-bezier(.3,.7,.4,1)';
  let tapEl=null,tapT=0;
  document.addEventListener('pointerdown',e=>{tapEl=e.target.closest&&e.target.closest('.cell,[data-act],button');tapT=Date.now();},true);
  document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('.cell,[data-act],button');if(t){tapEl=t;tapT=Date.now();}},true);
  const src=()=>{if(!tapEl||Date.now()-tapT>600||!tapEl.isConnected)return null;const r=tapEl.getBoundingClientRect();return r.width>4&&r.height>4&&r.bottom>0&&r.top<innerHeight?tapEl:null;};
  const ins=(r,b,rad)=>`inset(${(r.top-b.top).toFixed(1)}px ${(b.right-r.right).toFixed(1)}px ${(b.bottom-r.bottom).toFixed(1)}px ${(r.left-b.left).toFixed(1)}px round ${rad})`;
  const stag=(box,d0)=>{[...box.children].slice(0,8).forEach((x,i)=>x.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:280,delay:d0+i*40,easing:'ease-out',fill:'backwards'}));};
  const radOf=el=>{const r=getComputedStyle(el).borderRadius;return r&&r!=='0px'?r.split(' ')[0]:'12px';};
  // ---- 날짜 창 · 작은 창: 누른 자리에서 커지고 그 자리로 (v0.197 transform 만 써서 GPU 로만 움직임 · 잰 다음 프레임에 시작) ----
  const tfOf=(c,b)=>`translate(${(c.left-b.left).toFixed(1)}px,${(c.top-b.top).toFixed(1)}px) scale(${Math.max(.02,c.width/b.width).toFixed(4)},${Math.max(.02,c.height/b.height).toFixed(4)})`;
  const hideKids=box=>[...box.children].forEach(x=>x.style.opacity='0');
  const showKids=(box,d0)=>{[...box.children].forEach((x,i)=>{x.style.opacity='';if(i<8)x.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:220,delay:d0+i*25,easing:'ease-out',fill:'backwards'});});};
  // v0.200 날짜 창 = 껍데기 방식: 칸을 누르면 같은 모양의 빈 판(껍데기)이 먼저 커지고, 그 사이 진짜 창을 껍데기 아래에서 미리 만들어 칠해 둠 → 도착하면 껍데기만 걷어냄
  // 닫을 땐 진짜 창은 바로 치우고 껍데기만 그 칸으로 · 달력은 바뀔 때마다 이미 다시 그려져 있어서 닫을 때 다시 그리지 않음
  let shellEl=null,shellPass=false;
  const shellMk=(bg)=>{const d=document.createElement('div');d.className='dshell';d._t0=performance.now();d.style.background=bg;document.body.appendChild(d);return d;};
  const shellTf=r=>`translate(${r.left.toFixed(1)}px,${r.top.toFixed(1)}px) scale(${Math.max(.02,r.width/innerWidth).toFixed(4)},${Math.max(.02,r.height/innerHeight).toFixed(4)})`;
  const shellBg=()=>getComputedStyle(document.documentElement).getPropertyValue('--surface').trim()||'#f2f4f6';
  function shellDrop(){if(shellEl){shellEl.remove();shellEl=null;}const sh=$('#sheet');if(sh){sh.style.opacity='';sh.style.willChange='';sh.style.transition='';}}
  document.addEventListener('click',e=>{
    if(shellPass||RM())return;const c=e.target.closest&&e.target.closest('.cell[data-act="day"],.cell[data-act="vc-day"],.cell[data-act="man-day"]');if(!c||c.classList.contains('out')||e.target.closest('[data-act]')!==c)return;   // 칸 안의 스티커 · 메모 같은 다른 버튼은 그대로
    const act=c.dataset.act;if((act==='day'&&paint)||(act==='vc-day'&&vcSel.on)||(act==='man-day'&&manPaint)||held)return;
    const sh=$('#sheet');if(!sh||sh.classList.contains('open'))return;
    e.stopImmediatePropagation();e.preventDefault();shellDrop();
    const r=c.getBoundingClientRect(),bg=shellBg(),el=shellEl=shellMk(bg);   // v0.201 위치 · 크기(transform)만 움직임 — 색 · 둥글기까지 움직이면 폰이 따로 못 돌려서 진짜 창 만드는 동안 멈춤
    const a=el.animate([{transform:shellTf(r)},{transform:'none'}],{duration:360,easing:EO,fill:'forwards'});
    try{pfKick('날짜 창 누름');}catch(x){}
    a.onfinish=()=>{if(shellEl!==el)return;shellArriveT=performance.now();try{pf('껍데기 도착');}catch(x){}   // v0.204 진짜 창은 껍데기가 다 커져 멈춘 뒤에 만들고 칠함 (폰 기록: 움직이는 도중 처음 칠하기 92ms 가 끼어들어 멈춤) · 껍데기가 덮고 있어 안 보임
      let cc=c;if(!cc.isConnected&&c.dataset.k)cc=document.querySelector(`.cell[data-act="${c.dataset.act}"][data-k="${c.dataset.k}"]`)||c;   // 그 사이 달력이 다시 그려졌으면 같은 날 칸으로
      sh.style.transition='none';const t0=performance.now();shellPass=true;dsLite=true;try{cc.click();}finally{shellPass=false;dsLite=false;}try{pf('날짜 창 만들기',performance.now()-t0);}catch(x){}
      if(!sh.classList.contains('open')){shellDrop();return;}
      requestAnimationFrame(()=>requestAnimationFrame(()=>{if(shellEl!==el)return;shellDrop();try{pf('껍데기 걷음');}catch(x){}setTimeout(()=>{const t1=performance.now();try{dsFill();}catch(x){}try{pf('날짜 띠 · 날씨 채우기',performance.now()-t1);}catch(x){}},30);}));};
  },true);
  function sheetOpen(sh,was){}   // (작은 칸에서 진짜 창을 키우던 방식은 큰 화면을 그림으로 새로 만드느라 멈칫 → 위 껍데기 방식)
  function sheetClose(sh,k){if(RM()||!sh.classList.contains('open')||!k)return false;
    const cell=[...document.querySelectorAll(`#view .cell[data-k="${k}"],#page .cell[data-k="${k}"]`)].find(x=>{const r=x.getBoundingClientRect();return r.width>4&&r.left>=-2&&r.right<=innerWidth+2&&r.top>=0&&r.bottom<=innerHeight;});
    if(!cell)return false;
    shellDrop();const r=cell.getBoundingClientRect(),bg=shellBg(),el=shellEl=shellMk(bg);el.classList.add('cls');   // 닫는 껍데기 (다시 그리기는 안 미룸)
    sh.style.transition='none';setTimeout(()=>{if(!sh.classList.contains('open'))sh.style.transition='';},40);   // 진짜 창은 바로 치움
    const a=el.animate([{transform:'none',opacity:1},{opacity:1,offset:.55},{transform:shellTf(r),opacity:0}],{duration:300,easing:EC,fill:'forwards'});
    a.onfinish=()=>{if(shellEl===el){el.remove();shellEl=null;}const vis=x=>{const r=x.getBoundingClientRect();return r.width>4&&r.left>=-2&&r.right<=innerWidth+2&&r.top>=0&&r.bottom<=innerHeight;},n=[...document.querySelectorAll(`#view .cell[data-k="${k}"],#page .cell[data-k="${k}"]`)].find(vis);if(n)n.animate(   /* v0.218 1~7일 · 말일 근처는 옆 달 판에도 같은 날짜 칸(흐린 칸)이 있어서 첫 번째를 고르면 안 보이는 칸이 톡 했음 → 보이는 칸 */[{transform:'scale(.94)'},{transform:'scale(1.03)',offset:.6},{transform:'none'}],{duration:280,easing:EO});};
    return true;}
  let popSrc=null;
  function popOpen(pop,was){const m=pop.querySelector(':scope>.menu,:scope>.pi-ed,:scope>.pi-view,:scope>.wlp');if(!m||RM())return;   // v0.210 포스트잇 · 일지 창도
    if(was){[...m.children].slice(0,8).forEach((x,i)=>x.animate([{opacity:0},{opacity:1}],{duration:180,delay:i*25,fill:'backwards'}));return;}   // 창 → 창: 내용만 바뀜
    const el=src();popSrc=el&&!el.closest('#pop')?el:null;const c=popSrc&&popSrc.getBoundingClientRect();
    m.style.opacity='0';hideKids(m);
    requestAnimationFrame(()=>{if(!m.isConnected)return;m.style.opacity='';const b=m.getBoundingClientRect();m.style.transformOrigin='0 0';m.style.willChange='transform';
      pop.animate([{backgroundColor:'rgba(0,0,0,0)'},{backgroundColor:getComputedStyle(pop).backgroundColor}],{duration:280});
      const a=c?m.animate([{transform:tfOf(c,b),opacity:0},{opacity:1,offset:.1},{transform:'none',opacity:1}],{duration:360,easing:EO})   // v0.208 흰 판은 바로 불투명하게 (반투명한 판 너머로 뒤 글자가 겹쳐 번쩍이던 것) → 내용은 판이 거의 다 커진 뒤
               :m.animate([{transform:'translateY(110%)'},{transform:'none'}],{duration:360,easing:EO});
      showKids(m,c?230:60);a.onfinish=()=>{m.style.transformOrigin='';m.style.willChange='';};});}
  function popClose(old){if(RM()||!old.classList.contains('open'))return false;const m=old.querySelector(':scope>.menu,:scope>.pi-ed,:scope>.pi-view,:scope>.wlp');if(!m||m.style.opacity==='0')return false;
    const fresh=old.cloneNode(false);fresh.className='';fresh.removeAttribute('style');old.parentNode.insertBefore(fresh,old);old.style.pointerEvents='none';old.classList.remove('open');old.classList.add('ghost');old.setAttribute('aria-hidden','true');old.inert=true;
    const b=m.getBoundingClientRect(),s=popSrc&&popSrc.isConnected?popSrc:null;popSrc=null;m.style.transformOrigin='0 0';m.style.willChange='transform';
    [...m.children].forEach(x=>x.animate([{opacity:1},{opacity:0}],{duration:180,fill:'forwards'}));
    old.animate([{backgroundColor:getComputedStyle(old).backgroundColor},{backgroundColor:'rgba(0,0,0,0)'}],{duration:260,fill:'forwards'});
    let a;if(s){const c=s.getBoundingClientRect();a=m.animate([{transform:'none',opacity:1},{opacity:1,offset:.4},{transform:tfOf(c,b),opacity:0}],{duration:280,easing:EC,fill:'forwards'});}
    else a=m.animate([{transform:'none'},{transform:'translateY(110%)'}],{duration:250,easing:EC,fill:'forwards'});
    a.onfinish=()=>{old.remove();if(s)s.animate([{transform:'scale(.9)'},{transform:'scale(1.05)',offset:.6},{transform:'none'}],{duration:300,easing:EO});};setTimeout(()=>{if(old.isConnected)old.remove();},700);return fresh;}
  // ---- 하단 탭: 아이콘이 떠오르며 회색으로 차오름 ----
  let navPrev=null;
  function navInit(){document.querySelectorAll('#nav button').forEach(b=>{const s=b.querySelector(':scope>svg');if(!s)return;const w=document.createElement('span');w.className='nvi';s.replaceWith(w);w.appendChild(s);const f=s.cloneNode(true);f.classList.add('fl');w.appendChild(f);const h=document.createElement('i');h.className='nsh';w.appendChild(h);});}
  function navSet(tab){const bs=[...document.querySelectorAll('#nav button')];if(!bs.length)return;if(!document.querySelector('#nav .nvi'))navInit();
    bs.forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));if(navPrev===tab)return;const was=navPrev;navPrev=tab;if(was==null||RM())return;
    const nb=bs.find(b=>b.dataset.tab===tab),ob=bs.find(b=>b.dataset.tab===was);
    if(ob){const i=ob.querySelector('.nvi');if(i){i.animate([{transform:'translateY(-2px)'},{transform:'translateY(1px)',offset:.6},{transform:'none'}],{duration:320,easing:SP});i.querySelector('.fl').animate([{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(0 0 100% 0)'}],{duration:220,easing:'ease-in'});}}
    if(nb){const i=nb.querySelector('.nvi');if(i){i.animate([{transform:'none'},{transform:'translateY(1.5px) scale(.9)',offset:.25},{transform:'translateY(-4px) scale(1.06)',offset:.65},{transform:'translateY(-2px)'}],{duration:520,easing:SP});
      i.querySelector('.fl').animate([{clipPath:'inset(100% 0 0 0)'},{clipPath:'inset(100% 0 0 0)',offset:.2},{clipPath:'inset(0 0 0 0)'}],{duration:520,easing:'cubic-bezier(.4,0,.2,1)'});
      i.querySelector('.nsh').animate([{transform:'scaleX(0)',opacity:0},{transform:'scaleX(0)',opacity:0,offset:.3},{transform:'scaleX(1.15)',opacity:1,offset:.7},{transform:'scaleX(1)',opacity:1}],{duration:520,easing:SP});}}}
  // ---- 버튼 누름 (Spring Pop): 누르면 살짝 작아지고 떼면 조금 커졌다 제자리 ----
  const POPSEL='.btn,.send,.pg-h .ok,.sh-head .ok,.cpok,.paint-btn,.vrsend';
  let pr=null;
  document.addEventListener('pointerdown',e=>{if(RM())return;const b=e.target.closest&&e.target.closest(POPSEL);if(!b||b.disabled)return;pr={b,x:e.clientX,y:e.clientY,a:b.animate([{transform:'none'},{transform:'scale(.93)'}],{duration:110,easing:'ease-out',fill:'forwards'})};},true);
  const rel=e=>{if(!pr)return;const {b,a}=pr;pr=null;a.cancel();if(!b.isConnected)return;b.animate([{transform:'scale(.93)'},{transform:'scale(1.06)',offset:.55},{transform:'scale(.98)',offset:.8},{transform:'none'}],{duration:420,easing:SP});};
  document.addEventListener('pointerup',rel,true);document.addEventListener('pointercancel',rel,true);
  document.addEventListener('pointermove',e=>{if(pr&&Math.hypot(e.clientX-pr.x,e.clientY-pr.y)>12){pr.a.cancel();pr=null;}},true);
  // ---- 할 일 체크 · 근무 동그라미 · 색 점 · 날짜 줄: 누른 뒤(새로 그린 화면에서) 톡 튐 ----
  const pop1=(el,big)=>el&&el.animate([{transform:'scale(1)'},{transform:`scale(${big?.78:.85})`,offset:.3},{transform:'scale(1.13)',offset:.65},{transform:'scale(1)'}],{duration:440,easing:SP});
  document.addEventListener('click',e=>{if(RM())return;const t=e.target.closest&&e.target.closest('[data-act]');if(!t)return;const act=t.dataset.act;
    if(t.classList.contains('mchk')&&t.dataset.mid){const mid=t.dataset.mid;setTimeout(()=>{const n=document.querySelector(`.mchk[data-mid="${mid}"]`);if(!n)return;pop1(n,1);if(n.classList.contains('on'))n.animate([{boxShadow:'0 0 0 0 rgba(31,154,118,.45)'},{boxShadow:'0 0 0 10px rgba(31,154,118,0)'}],{duration:500});},0);return;}
    if(t.classList.contains('tchip')){const s=t.dataset.s;setTimeout(()=>{const n=document.querySelector(`.tchip[data-act="${act}"][data-s="${CSS.escape(s||'')}"]`)||t;pop1(n.querySelector('.badge')||n);},0);return;}
    if(/^(sr-day|sr-wt|md-col|sr-col|slot-col|ft-col|fe-color|pi-color|type-color)$/.test(act)){const v=t.dataset.v;setTimeout(()=>{pop1(document.querySelector(`[data-act="${act}"][data-v="${CSS.escape(v||'')}"]`)||(t.isConnected?t:null));},0);return;}   // v0.197 요일 · 색 고르기도 톡
    if(t.classList.contains('tdc')){const v=t.dataset.v;setTimeout(()=>{pop1(document.querySelector(`.tdc[data-v="${CSS.escape(v||'')}"]`)||t);},0);return;}
    if(t.classList.contains('dsi')){const o=document.querySelector('#sheet .dsi.on .badge,#page .dsi.on .badge');if(!o)return;const r0=o.getBoundingClientRect();
      setTimeout(()=>{const n=document.querySelector('#sheet .dsi.on .badge,#page .dsi.on .badge');if(!n)return;const r1=n.getBoundingClientRect();const g=document.createElement('i');g.className='dsghost';document.body.appendChild(g);
        const box=r=>({l:r.left-5,t:r.top-5,w:r.width+10,h:r.height+10}),A=box(r0),B=box(r1);Object.assign(g.style,{left:'0px',top:'0px',width:B.w+'px',height:B.h+'px'});n.closest('.dsi').classList.add('dsmv');
        const right=B.l>A.l,ml=right?A.l+(B.l-A.l)*.3:A.l+(B.l-A.l)*.85,mr=right?A.l+A.w+(B.l-A.l)*.85:A.l+A.w+(B.l-A.l)*.3;
        const an=g.animate([{transform:`translate(${A.l}px,${A.t}px)`,width:A.w+'px'},{offset:.45,transform:`translate(${ml}px,${(A.t+B.t)/2}px)`,width:(mr-ml)+'px'},{transform:`translate(${B.l}px,${B.t}px)`,width:B.w+'px'}],{duration:400,easing:SP});
        an.onfinish=()=>{g.remove();n.closest('.dsi')&&n.closest('.dsi').classList.remove('dsmv');};setTimeout(()=>{g.remove();document.querySelectorAll('.dsmv').forEach(x=>x.classList.remove('dsmv'));},700);},0);}
  },true);
  // ---- v0.206 날짜 창 제목 눌러 오늘로: 지금 띠를 오늘까지 먼저 굴리고(내용은 밀려 나감) → 멈춘 뒤 오늘 창을 만들고 내용이 밀려 들어옴 (만드는 동안 움직이는 게 없어서 안 끊김) ----
  let dftPass=false,dftBusy=false;
  document.addEventListener('click',e=>{if(dftPass||RM())return;const t=e.target.closest&&e.target.closest('.dft[data-act]');if(!t)return;
    if(dftBusy){e.stopImmediatePropagation();e.preventDefault();return;}
    const box=t.closest('#sheet,#page');const st=box&&box.querySelector('#dstrip'),on=st&&st.querySelector('.dsi.on');if(!on)return;
    const k0=on.dataset.k,k1=t.dataset.k;if(!k0||!k1||k0===k1)return;
    const tg=st.querySelector(`.dsi[data-k="${k1}"]`);if(!tg)return;   // 띠에 없는 먼 날은 그냥 바로
    e.stopImmediatePropagation();e.preventDefault();dftBusy=true;
    const days=Math.round((parse(k1)-parse(k0))/864e5),dir=Math.sign(days)||1;
    const from=st.scrollLeft,to=dsiX(st,tg)+tg.offsetWidth/2-st.clientWidth/2,D=Math.min(560,300+Math.abs(days)*22),ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
    const outs=()=>{const el=document.getElementById('dstrip');if(!el||!el.parentElement)return [];return [...el.parentElement.children].filter(x=>x!==el&&el.compareDocumentPosition(x)&Node.DOCUMENT_POSITION_FOLLOWING).concat([...el.parentElement.querySelectorAll('.dft')]);};
    outs().forEach(x=>x.animate([{transform:'none',opacity:1},{transform:`translateX(${-dir*44}px)`,opacity:0}],{duration:Math.min(260,D*.6),easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'}));
    const t0=performance.now();
    const fin=()=>{let ok=false;try{dftPass=true;t.click();ok=true;}catch(x){}finally{dftPass=false;}
      try{swQuiet=performance.now();}catch(x){}
      requestAnimationFrame(()=>{dftBusy=false;outs().forEach(x=>{x.getAnimations().forEach(a=>a.cancel());x.animate([{transform:`translateX(${dir*44}px)`,opacity:0},{transform:'none',opacity:1}],{duration:300,easing:'cubic-bezier(.2,.9,.25,1)',fill:'backwards'});});});};
    const step=now=>{try{swQuiet=now;}catch(x){}const x=Math.min(1,(now-t0)/D);st.scrollLeft=from+(to-from)*ease(x);if(x<1&&st.isConnected)requestAnimationFrame(step);else fin();};
    requestAnimationFrame(step);
    setTimeout(()=>{if(dftBusy&&!st.isConnected){dftBusy=false;}},D+800);
  },true);
  // ---- v0.209 날짜 창 위 ‹ ›: 옆 날짜 내용이 그 쪽에서 밀려 들어옴 (내 · 유찬 · 가족 날짜 창 모두) ----
  document.addEventListener('click',e=>{if(RM())return;const b=e.target.closest&&e.target.closest('.dfh>.ib[data-k]');if(!b)return;
    const dir=b===b.parentElement.firstElementChild?-1:1;
    setTimeout(()=>{const el=document.getElementById('dstrip');if(!el||!el.parentElement)return;
      [...el.parentElement.children].filter(x=>x!==el&&el.compareDocumentPosition(x)&Node.DOCUMENT_POSITION_FOLLOWING).concat([...el.parentElement.querySelectorAll('.dft')])
        .forEach(x=>x.animate([{transform:`translateX(${dir*56}px)`,opacity:.15},{transform:'none',opacity:1}],{duration:320,easing:'cubic-bezier(.2,.9,.25,1)'}));},0);
  },true);
  // ---- 빨간 숫자 배지: 숫자가 바뀌면 톡 ----
  const bdgLast=new Map();
  function badges(){document.querySelectorAll('#famBadge,.pi-btn .bdg').forEach(b=>{const k=b.id||'pi',v=b.textContent;const o=bdgLast.get(k);bdgLast.set(k,v);if(o!=null&&o!==v&&v&&!RM())b.animate([{transform:'scale(.4)'},{transform:'scale(1.3)',offset:.55},{transform:'scale(.92)',offset:.8},{transform:'scale(1)'}],{duration:480,easing:SP});});}
  // ---- 메모 창: 나만 ↔ 가족에게 바꿀 때 줄들이 미끄러져 자리 잡음 (FLIP) ----
  function flip(box,fn){if(RM()||!box){fn();return;}const key=e=>e.className+'|'+((e.querySelector('[data-act]')||{}).dataset||{}).act;
    const old=new Map();box.querySelectorAll('.pg-sec').forEach(e=>old.set(key(e),e.getBoundingClientRect().top));fn();
    const nb=$('#page .pg-b');if(!nb)return;nb.querySelectorAll('.pg-sec').forEach(e=>{const k=key(e),t=e.getBoundingClientRect().top;if(old.has(k)){const d=old.get(k)-t;if(Math.abs(d)>1)e.animate([{transform:`translateY(${d}px)`},{transform:'none'}],{duration:360,easing:EO});}else e.animate([{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'none'}],{duration:300,delay:80,easing:'ease-out',fill:'backwards'});});}
  // ---- 탭 바꿀 때: 누른 쪽에서 새 화면이 살짝 밀려 들어오고 카드들이 차례로 (시안 design/tab-motion) ----
  function tabIn(dir){if(!dir||RM())return;const v=$('#view'),tp=$('#top');   // v0.199 하얗게 비어 보이지 않게: 완전 투명에서 시작하지 않음 · 달력 탭은 카드 차례 효과 없음 (그리는 동안 비어 보임)
    [v,tp].forEach(e=>e&&e.animate([{transform:`translateX(${dir*24}px)`,opacity:.55},{transform:'none',opacity:1}],{duration:260,easing:EO}));
    if(tab==='cal'||!v)return;
    const kids=[...(v.children.length===1&&v.firstElementChild.children.length>1?v.firstElementChild.children:v.children)].slice(0,6);
    kids.forEach((x,i)=>x.animate([{transform:'translateY(8px)',opacity:.4},{transform:'none',opacity:1}],{duration:240,delay:i*30,easing:'ease-out',fill:'backwards'}));}
  return {sheetOpen,sheetClose,popOpen,popClose,navSet,badges,flip,tabIn};
})();
// v0.196 고르기 알약 · 스위치 모션 (시안 design/seg-toggle/v1)
(function(){
  const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pos=seg=>{const b=seg.querySelector(':scope>button.on');return b&&b.offsetWidth?{l:b.offsetLeft,w:b.offsetWidth,t:b.offsetTop,h:b.offsetHeight,r:getComputedStyle(b).borderRadius}:null;};
  const place=seg=>{let i=seg.querySelector(':scope>.npind');const p=pos(seg);
    if(!p){seg.classList.remove('ni');return null;}
    if(!i){i=document.createElement('i');i.className='npind';seg.prepend(i);}
    i.style.transform=`translateX(${p.l}px)`;i.style.width=p.w+'px';i.style.top=p.t+'px';i.style.height=p.h+'px';i.style.borderRadius=p.r;seg.classList.add('ni');return i;};
  let ro=null;try{ro=new ResizeObserver(es=>es.forEach(e=>place(e.target)));}catch(e){}
  const init=root=>{(root||document).querySelectorAll('.npseg').forEach(seg=>{if(!seg.dataset.ni){seg.dataset.ni=1;if(ro)ro.observe(seg);}place(seg);});};
  let q=0;try{new MutationObserver(()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;init();});}).observe(document.body,{childList:true,subtree:true});}catch(e){}
  function move(seg,from){const ind=place(seg),to=pos(seg);if(!ind||!from||!to||Math.abs(from.l-to.l)<1||RM()||!ind.animate)return;
    const L0=from.l,R0=from.l+from.w,L1=to.l,R1=to.l+to.w,right=L1>L0;
    const ml=right?L0+(L1-L0)*.3:L0+(L1-L0)*.85,mr=right?R0+(R1-R0)*.85:R0+(R1-R0)*.3,ov=right?3:-3;
    ind.animate([{transform:`translateX(${L0}px)`,width:from.w+'px'},{offset:.45,transform:`translateX(${ml}px)`,width:(mr-ml)+'px'},{offset:.8,transform:`translateX(${L1+ov}px)`,width:Math.max(8,to.w-2)+'px'},{transform:`translateX(${L1}px)`,width:to.w+'px'}],{duration:460,easing:'cubic-bezier(.3,.7,.4,1)'});}
  // 누르기 전 자리를 적어 두고, 화면을 새로 그린 뒤(같은 data-act 고르기 줄) 그 자리에서 미끄러지게
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.npseg>button');if(!b||b.classList.contains('on'))return;
    const seg=b.parentElement,o=seg.querySelector(':scope>button.on');if(!o)return;
    const sr=seg.getBoundingClientRect(),or=o.getBoundingClientRect(),act=b.dataset.act||'',top=sr.top;
    setTimeout(()=>{let s2=seg.isConnected?seg:null;
      if(!s2&&act){let best=1e9;document.querySelectorAll('.npseg').forEach(x=>{if(!x.querySelector(`:scope>button[data-act="${act}"]`))return;const d=Math.abs(x.getBoundingClientRect().top-top);if(d<best){best=d;s2=x;}});}
      if(!s2)return;const r2=s2.getBoundingClientRect();move(s2,{l:or.left-r2.left,w:or.width});},0);},true);
  // 스위치: 동그라미가 늘어나며 미끄러지고 끝에서 살짝 눌림
  // v0.209 누르는 순간 화면을 다시 그리는 스위치(알람 켜기 등)는 change 가 떨어져 나간 칸에서 생겨 못 받음 → click 에서 받고, 새로 그려진 같은 스위치(data-act · data-id)에 모션
  let swDone=null;
  const swFind=(t,id)=>{if(t.isConnected)return t;if(id)return document.getElementById(id);const a=t.dataset&&t.dataset.act;if(!a)return null;return document.querySelector(`.sw input[data-act="${a}"]${t.dataset.id?`[data-id="${t.dataset.id}"]`:''}`);};
  document.addEventListener('click',e=>{const t=e.target;if(!t||!t.matches||!t.matches('.sw input[type=checkbox]'))return;swDone=t;swRun(t,t.id,t.checked);},true);
  document.addEventListener('change',e=>{const t=e.target;if(!t||!t.closest||!t.closest('.sw'))return;if(swDone===t){swDone=null;return;}swRun(t,t.id,t.checked);},true);
  function swRun(t,id,on){
    setTimeout(()=>{const el=swFind(t,id);if(!el||RM())return;const i=el.nextElementSibling;if(!i||!i.animate)return;
      try{const cs=getComputedStyle(i,'::after'),kw=parseFloat(cs.width)||24,kl=parseFloat(cs.left)||3,X=i.offsetWidth-kw-kl*2,st=kw*1.5,top=parseFloat(cs.top)||kl;
        const k=on?[{transform:'translateX(0px)',width:kw+'px'},{offset:.4,transform:'translateX(0px)',width:st+'px'},{offset:.75,transform:`translateX(${X+1}px)`,width:(kw-1)+'px',height:(kw-2)+'px',top:(top+1)+'px'},{transform:`translateX(${X}px)`,width:kw+'px'}]
                  :[{transform:`translateX(${X}px)`,width:kw+'px'},{offset:.4,transform:`translateX(${X-(st-kw)}px)`,width:st+'px'},{offset:.75,transform:'translateX(-1px)',width:(kw-1)+'px',height:(kw-2)+'px',top:(top+1)+'px'},{transform:'translateX(0px)',width:kw+'px'}];
        i.animate(k,{duration:480,easing:'cubic-bezier(.3,.7,.4,1)',pseudoElement:'::after'});}catch(err){}},0);}
  if(document.body)init();else document.addEventListener('DOMContentLoaded',()=>init());
})();
const POP_ICO={'🔒':'lock','♥':'heart','🧽':'eraser','📆':'calendar-x','✏️':'pencil','✏':'pencil','🗑':'trash-2','🗑️':'trash-2','📋':'copy','📅':'calendar','🗓':'calendar','🚫':'ban','🔔':'bell','🔕':'bell-off','🔁':'repeat','⏰':'alarm-clock','📍':'map-pin','🏠':'home','🏭':'building','📤':'share','🎨':'paintbrush','📷':'camera','🔗':'link','↩️':'rotate-ccw','⚙️':'settings','⚙':'settings','🔍':'search','➕':'plus','＋':'plus'};
function popIcons(root){try{root.querySelectorAll('.menu > .mi, .menu > button.mi').forEach(b=>{const n=b.firstChild;if(!n||n.nodeType!==3)return;const t=n.nodeValue.replace(/^\s+/,'');const k=Object.keys(POP_ICO).find(e=>t.startsWith(e));if(!k||!NPI[POP_ICO[k]])return;n.nodeValue=t.slice(k.length).replace(/^\s+/,'');const sp=document.createElement('span');sp.className='npi';sp.innerHTML=npi(POP_ICO[k],18);b.insertBefore(sp,n);if(b.classList.contains('d'))sp.classList.add('red');});}catch(e){}}
let wlFromMd=false;
function closePop(){if(wlFromMd){if(pageMode==='memodetail'&&mdDraft)setTimeout(()=>{if(pageMode==='memodetail'&&mdDraft&&!$('#pop').classList.contains('open'))renderMemoDetail();},0);else wlFromMd=false;}document.querySelectorAll('.cell.selTop').forEach(c=>c.classList.remove('selTop'));try{MO.popClose($('#pop'));}catch(e){}$('#pop').className='';$('#pop').innerHTML='';tpk=null;icn=null;crp=null;}
const sheetHead=(title,left)=>`<div class="sh-head">${left||''}<b style="flex:1;font-size:17px;">${title}</b><button class="ib" data-act="close" style="width:auto;font-size:16px;">✕</button></div>`;

/* ================= 아이콘 고르기 창: 이모티콘 · 내 사진 · ＋사진 ================= */
/* openIcn({title, sub, icon, name(null이면 이름 칸 없음), emojis, onSave(icon,name), onReset, resetLabel, letter, color})
 * 스티커 · 기념일 · 근무 시간 아이콘 · 내 상태 · 내 직장 · 응원 버튼 · 가족 사진이 모두 이 창을 씀 */
const ICON_MAX=30;
let icn=null;
function openIcn(o){icn=Object.assign({emojis:[],name:null,maxName:12,placeholder:'',resetLabel:'기본값',own:'',tab:0},o);if(icn.cats&&isPhoto(icn.icon))icn.tab=icn.cats.length;renderIcn();}
function icnPull(){if(!icn)return;const n=$('#icnName');if(n)icn.name=n.value;const e=$('#icnOwn');if(e)icn.own=e.value;const m=$('#icnOwnName');if(m)icn.ownName=m.value;}
function photoGrid(curv){
  const ids=Object.keys(S.icons||{}).reverse();
  return `<div class="phg"><button class="pha" data-act="ico-add">＋<small>사진</small></button>${ids.map(id=>`<button class="phi ${curv==='@'+id?'on':''}" data-act="icn-pick" data-v="@${id}" data-hold="ico" data-id="${id}"><img src="${S.icons[id]}" alt=""></button>`).join('')}</div>`;
}
// 종류별 탭 + 큰 목록 (맨 끝 탭 = 내 사진)
function icnCats(o){
  const n=o.cats.length,t=Math.min(o.tab||0,n);
  const tabs=o.cats.map((c,i)=>`<button class="${t===i?'on':''}" data-act="icn-tab" data-i="${i}">${esc(c[0])}</button>`).join('')+`<button class="${t===n?'on':''}" data-act="icn-tab" data-i="${n}">내 것</button>`;
  const mine=Array.isArray(S.myEmo)?S.myEmo:[];
  const body=t===n?`<div class="icn-lb">내 것</div>${photoGrid(o.icon)}${mine.length?`<div class="sgrid sg4" style="margin-top:12px">${mine.map((x,i)=>`<button class="${o.icon===x.e?'on':''}" data-act="icn-pick" data-mine="1" data-v="${esc(x.e)}" data-n="${esc(x.n||'')}" data-hold="myemo" data-i="${i}"><span class="si">${esc(x.e)}</span><small>${esc(x.n||'')}</small></button>`).join('')}</div>`:''}`
    :`<div class="sgrid sg4">${o.cats[t][1].map(x=>`<button class="${o.icon===x[0]?'on':''}" data-act="icn-pick" data-v="${x[0]}" data-n="${esc(x[1])}"><span class="si">${String(x[0]).startsWith('pill:')?pillSvg(1,1,28,'#ef4d5a',x[0].slice(5)):x[0]}</span><small>${esc(x[1])}</small></button>`).join('')}</div>`;
  const own=t===n?'':`<div class="icn-ownrow"><input type="text" id="icnOwn" class="icn-own" maxlength="8" placeholder="직접 입력" value="${esc(o.own||'')}">${o.name===null?`<input type="text" id="icnOwnName" class="icn-own2" maxlength="12" placeholder="이름 (선택)" value="${esc(o.ownName||'')}">`:''}${o.instant?'<button class="btn sm" data-act="icn-own-ok">붙이기</button>':''}</div>`;
  return `<div class="icn-tabs">${tabs}</div><div class="mi icn-sec" style="display:block">${body}${own}</div>`;
}
function renderIcn(){
  const o=icn;if(!o)return;
  const curH=o.icon?ico(o.icon):o.letter?`<i class="icn-l" style="background:${o.color||'#6b7280'}">${esc(o.letter)}</i>`:'<i class="icn-l" style="background:var(--surface)"></i>';
  openPop(`<div class="mh">${esc(o.sub||'')}<b>${esc(o.title)}</b></div>
    <div class="mi icn-top"><span class="icn-cur">${curH}</span>${o.name!==null?`<input type="text" id="icnName" value="${esc(o.name)}" maxlength="${o.maxName}" placeholder="${esc(o.placeholder)}">`:`<span class="icn-hint">${esc(o.hint||'이모티콘을 고르거나 사진을 넣어요')}</span>`}</div>
    ${typeof o.extra==='function'?o.extra(o):(o.extra||'')}
    ${o.cats?icnCats(o):`<div class="mi icn-sec"><div class="icn-lb">내 사진</div>${photoGrid(o.icon)}</div>`}
    ${!o.cats&&o.emojis.length?`<div class="mi icn-sec"><div class="icn-lb">이모티콘</div><div class="emo">${o.emojis.map(e=>`<button class="${o.icon===e?'on':''}" data-act="icn-pick" data-v="${e}">${e}</button>`).join('')}<input type="text" id="icnOwn" class="icn-own" maxlength="4" placeholder="직접" value="${esc(o.own)}"></div></div>`:''}
    <div class="mi" style="gap:8px">${o.onReset?`<button class="btn ghost grow" data-act="icn-reset">${esc(o.resetLabel)}</button>`:'<button class="btn ghost grow" data-act="icn-cancel">취소</button>'}${o.instant?'':'<button class="btn grow" data-act="icn-save">저장</button>'}</div>`);
}
// 직접 입력: 이모티콘 한두 개만 (숫자 · 한글 · 영문 · 긴 글 거절)
function okEmoji(t){
  t=String(t||'').trim();if(!t||/[0-9A-Za-z\u3131-\u318E\uAC00-\uD7A3\s]/.test(t)||!/\p{Extended_Pictographic}/u.test(t))return false;
  const n=(typeof Intl!=='undefined'&&Intl.Segmenter)?[...new Intl.Segmenter().segment(t)].length:Array.from(t).length;
  return n>=1&&n<=2;
}
// 내 것: 직접 입력한 이모티콘을 이름과 함께 모아 둠 (최대 20개 · 같은 이모티콘은 앞으로)
function myEmoAdd(e,n){
  const old=(Array.isArray(S.myEmo)?S.myEmo:[]).find(x=>x.e===e);
  const l=(Array.isArray(S.myEmo)?S.myEmo:[]).filter(x=>x.e!==e);
  l.unshift({e,n:n||(old&&old.n)||''});S.myEmo=l.slice(0,20);save();
}
function myEmoDel(i){if(!Array.isArray(S.myEmo)||!S.myEmo[i])return;S.myEmo.splice(i,1);save();icnPull();renderIcn();toast('지웠어요');}
function icnSave(){
  icnPull();const o=icn;if(!o)return;
  const own=(o.own||'').trim(),icon=own||o.icon||'';
  if(own&&!okEmoji(own)){toast('이모티콘 한두 개만 넣어 주세요');return;}
  if(o.needIcon&&!icon){toast('아이콘을 골라 주세요');return;}
  const ownName=String((o.name!==null?o.name:o.ownName)||'').trim().slice(0,12);
  if(own&&o.cats)myEmoAdd(own,ownName);
  icn=null;closePop();o.onSave(icon,o.name===null?(own?ownName:(o.pickName||'')):String(o.name).trim(),own?'':(o.srcId||''));
}
/* ---- 사진 넣기: 앱에서는 안드로이드 사진 선택 창, 브라우저에서는 파일 고르기 → 맞추기 ---- */
function icoAdd(){
  if(Object.keys(S.icons||{}).length>=ICON_MAX){toast(`사진은 ${ICON_MAX}장까지예요 · 안 쓰는 사진을 길게 눌러 지워 주세요`);return;}
  icnPull();
  if(hasBridge('pickImage')){try{window.AndroidBridge.pickImage();return;}catch(e){}}
  const f=$('#icoFile');if(f){f.value='';f.click();}
}
window.__onImage=data=>{if(data)openCrop(data);else if(data===null)toast('사진을 열지 못했어요');};
function icoDelete(id){
  if(!S.icons||!S.icons[id])return;
  const used=JSON.stringify(Object.assign({},S,{icons:null})).includes('"@'+id+'"');
  if(!confirm(used?'이 사진을 지울까요?\n(지금 쓰고 있는 곳은 기본 모양으로 바뀌어요)':'이 사진을 지울까요?'))return;
  delete S.icons[id];save();
  if(icn){if(icn.icon==='@'+id)icn.icon='';renderIcn();}
  render();
}
let crp=null;
function openCrop(src){
  const img=new Image();
  img.onload=()=>{
    crp={img,z:1,ox:0,oy:0,box:0,pts:new Map(),d0:0,z0:1};
    openPop(`<div class="mh">사진 맞추기<b>끌어서 옮기고, 아래 막대로 크기 조절</b></div>
      <div class="crp"><div class="crp-box" id="crpBox"><img id="crpImg" src="${src}" alt="" draggable="false"><i class="crp-ring"></i></div></div>
      <div class="mi crp-z"><span>－</span><input type="range" id="crpZoom" min="1" max="4" step="0.01" value="1"><span>＋</span></div>
      <div class="mi crp-pv"><div><img id="cpv1" class="ico" style="font-size:12px" alt="">달력 칸</div><div><img id="cpv2" class="ico" style="font-size:23px" alt="">스티커 창</div><div><img id="cpv3" class="ico" style="font-size:38px" alt="">가족 · 고르기</div></div>
      <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="crp-again">다시 고르기</button><button class="btn grow" data-act="crp-ok">이걸로 정하기</button></div>`);
    requestAnimationFrame(()=>{const b=$('#crpBox');if(!b||!crp)return;crp.box=b.clientWidth;cropDraw();});
  };
  img.onerror=()=>toast('사진을 열지 못했어요');
  img.src=src;
}
// 사진이 동그라미 칸을 꽉 채우도록 (빈 곳 안 생기게) 옮기는 범위를 막음
function cropFit(){
  const c=crp,iw=c.img.naturalWidth||1,ih=c.img.naturalHeight||1,base=c.box/Math.min(iw,ih),W=iw*base*c.z,H=ih*base*c.z;
  const mx=(W-c.box)/2,my=(H-c.box)/2;c.ox=Math.max(-mx,Math.min(mx,c.ox));c.oy=Math.max(-my,Math.min(my,c.oy));
  return {k:base*c.z,W,H,left:(c.box-W)/2+c.ox,top:(c.box-H)/2+c.oy};
}
function cropDraw(){
  if(!crp||!crp.box)return;const f=cropFit(),im=$('#crpImg');
  if(im){im.style.width=f.W+'px';im.style.height=f.H+'px';im.style.transform=`translate(${f.left}px,${f.top}px)`;}
  clearTimeout(crp.pt);crp.pt=setTimeout(()=>{if(!crp)return;const u=cropOut(96);['cpv1','cpv2','cpv3'].forEach(id=>{const e=$('#'+id);if(e)e.src=u;});},50);
}
// 128×128 정사각형 JPEG 로 줄여서 (한 장에 5KB 안팎) · 투명한 곳이 있는 그림(투명 PNG)은 투명을 살려 PNG 로 (너무 크면 흰 바탕 JPEG)
function cropOut(size){
  const f=cropFit(),cv=document.createElement('canvas');cv.width=cv.height=size;
  const g=cv.getContext('2d');
  const draw=()=>g.drawImage(crp.img,-f.left/f.k,-f.top/f.k,crp.box/f.k,crp.box/f.k,0,0,size,size);
  if(/^data:image\/(png|webp|gif)/.test(crp.img.src||'')){
    draw();
    try{
      const px=g.getImageData(0,0,size,size).data;let clear=false;
      for(let i=3;i<px.length;i+=4)if(px[i]<250){clear=true;break;}
      if(clear){const u=cv.toDataURL('image/png');if(u.length<=28000)return u;}
    }catch(e){}
    g.clearRect(0,0,size,size);
  }
  g.fillStyle='#fff';g.fillRect(0,0,size,size);draw();
  return cv.toDataURL('image/jpeg',0.86);
}
function cropOk(){
  if(!crp||!crp.box)return;
  const u=cropOut(128),id=uid();crp=null;
  (S.icons=S.icons||{})[id]=u;save();
  if(icn){icn.icon='@'+id;icn.own='';if(icn.instant){icnSave();return;}renderIcn();}else closePop();
}
function cropBack(){crp=null;if(icn)renderIcn();else closePop();}
document.addEventListener('pointerdown',e=>{const b=crp&&e.target.closest&&e.target.closest('#crpBox');if(!b)return;try{b.setPointerCapture(e.pointerId);}catch(err){}crp.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});crp.d0=0;});
document.addEventListener('pointermove',e=>{
  if(!crp||!crp.pts.has(e.pointerId))return;
  const p=crp.pts.get(e.pointerId);
  if(crp.pts.size===1){crp.ox+=e.clientX-p.x;crp.oy+=e.clientY-p.y;}
  p.x=e.clientX;p.y=e.clientY;
  if(crp.pts.size===2){
    const [a,b]=[...crp.pts.values()],d=Math.hypot(a.x-b.x,a.y-b.y);
    if(!crp.d0){crp.d0=d;crp.z0=crp.z;}else{crp.z=Math.max(1,Math.min(4,crp.z0*d/crp.d0));const r=$('#crpZoom');if(r)r.value=crp.z;}
  }
  cropDraw();
});
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,e=>{if(crp){crp.pts.delete(e.pointerId);crp.d0=0;}}));

function openMonthPicker(){tempPickerYear=cur.y;renderMonthPickerContent();}
function renderMonthPickerContent(){
  let mHtml='';
  for(let i=0;i<12;i++){
    const isOn=(tempPickerYear===cur.y&&i===cur.m)?'on':'';
    mHtml+=`<button class="m-btn ${isOn}" data-act="picker-set-m" data-m="${i}">${i+1}월</button>`;
  }
  openSheet(`
    ${sheetHead('달력 이동')}
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding:0 20px;">
      <button class="ib" data-act="picker-prev-y" style="font-size:28px;" ${tempPickerYear*12<=MIN_M?'disabled':''}>‹</button>
      <b style="font-size:22px;">${tempPickerYear}년</b>
      <button class="ib" data-act="picker-next-y" style="font-size:28px;" ${tempPickerYear*12+11>=MAX_M?'disabled':''}>›</button>
    </div>
    <div class="m-grid">${mHtml}</div>`);
}

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
        :fam.length?'':`${!S.link||S.link.role==='host'?`<button class="paint-btn finv" data-act="link-invite">${npi('user-plus',18)}<b>가족 초대하기</b><i>›</i></button>`:''}<button class="fempty" data-act="fam-add">${!S.link||S.link.role==='host'?'내 폰에만 적어 두기':'👪 가족 추가하기'} ›</button>`}   // v0.239 두 폰 연결(초대)을 앞에 · 직접 입력은 아래 작게 (시안 design/review26/1-family-invite-v2)
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


/* ================= 📝 월 메모 = 포스트잇 벽 ================= */
/* S.board['2026-10'] = [포스트잇]
 * 포스트잇: {id, type('list'|'note'), title, lines:[{id,text,done,doneBy}], text, shared, by, t, color('y'|'g'|'b'|'o'|'k'),
 *           repeat(매달), dateAuto(날짜 쓰면 달력에도), date(연결된 날짜), reacts:{host:'✓',guest:'👍'}, torn(뗀 것), tornAt, rootId(매달 반복 원본)} */
const PI_COL=['y','g','b','o','k'];
const PI_REACT=['✓','👍','❤️','😂'];
function boardKey(){return `${cur.y}-${pad(cur.m+1)}`;}
// 매달 반복: 이전 달의 마지막 판이 "매달"이면 이번 달에 새로 붙임 (체크는 비워서)
function ensureRepeats(mk){
  const latest={},r=role(),mine=piSrvList().filter(x=>x.by===r);   // 가족 포스트잇은 쓴 사람 폰에서만 새 달에 붙임
  const mks=[...new Set(Object.keys(S.board).concat(mine.map(x=>x.mk)))].filter(k=>k<mk).sort();
  mks.forEach(k=>(S.board[k]||[]).concat(mine.filter(x=>x.mk===k)).forEach(n=>{latest[n.rootId||n.id]=n;}));
  const list=S.board[mk]||[],have=boardList(mk);let added=false;
  Object.entries(latest).forEach(([root,n])=>{
    if(!n.repeat||have.some(x=>(x.rootId||x.id)===root))return;
    let date='';
    if(n.date){const [y,m]=mk.split('-').map(Number),dd=new Date(y,m-1,+n.date.slice(8));if(dd.getMonth()===m-1)date=fmt(dd);}
    const c=Object.assign({},n,{id:uid(),rootId:root,t:Date.now(),torn:false,tornAt:0,reacts:{},date,
      lines:(n.lines||[]).map(l=>({id:uid(),text:l.text,done:false,doneBy:''}))});
    delete c.srv;delete c._v;delete c.mk;if(n.srv){c.by=r;c.shared=true;c.color='y';}
    list.push(c);
    added=true;
  });
  if(added){S.board[mk]=list;save();}
}
// 그 달 포스트잇 = 폰에 있는 것 + 가족방 서버의 가족 포스트잇 (같은 id 면 서버 것 · 올리는 중에 둘 다 보이지 않게)
function boardList(mk){const loc=S.board[mk]||[],srv=piSrvList().filter(x=>x.mk===mk);if(!srv.length)return loc;const ids=new Set(srv.map(x=>x.id));return loc.filter(x=>!ids.has(x.id)).concat(srv);}
function boardAll(mk){ensureRepeats(mk);return boardList(mk);}
function boardItems(mk){const r=role();return boardAll(mk).filter(x=>!x.torn&&(x.shared||x.by===r));}
function boardLeft(mk){return boardItems(mk).reduce((s,n)=>s+(n.type==='list'?n.lines.filter(l=>!l.done).length:0),0);}
// 달력에도 표시한 포스트잇 (그 날짜)
function boardOnDate(k){const r=role();return boardList(k.slice(0,7)).filter(n=>n.date===k&&!n.torn&&(n.shared||n.by===r));}
const piLabel=n=>n.type==='list'?(n.title||'할 일'):firstLine(n.text);
function piRot(id){let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))|0;return 'r'+(Math.abs(h)%4+1);}
function piFind(id){return boardList(boardKey()).find(x=>x.id===id);}
function piSave(n){save();if(n&&n.srv)piSrvPush(n);}   // 가족방 서버 포스트잇이면 바뀐 곳만 서버로
const piDone=n=>n.type==='list'&&n.lines.length>0&&n.lines.every(l=>l.done);
const piCol=n=>n.shared?'p':(PI_COL.includes(n.color)?n.color:'y');
const PIN_COL={host:'#1d2330',guest:'#e5484d'};
const piPin=by=>`<i class="pin" style="background:${PIN_COL[by]||'#6b7280'}">${isSolo()?'':by===role()?'나':esc(whoName(by).slice(0,1))}</i>`;
// 글에서 날짜 찾기: "11/2", "10월 22일", "22일"
function piDetect(n,mk){
  const txt=[n.title||'',n.text||'',...(n.lines||[]).map(l=>l.text)].join(' ');
  const [y,m]=mk.split('-').map(Number);
  const ok=(Y,M,D)=>{const d=new Date(Y,M-1,D);return d.getMonth()===M-1&&d.getDate()===D?fmt(d):'';};
  let r=txt.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
  if(r){const M=+r[1],D=+r[2];if(M>=1&&M<=12)return ok(M<m-6?y+1:y,M,D);}
  r=txt.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if(r){const M=+r[1],D=+r[2];if(M>=1&&M<=12)return ok(M<m-6?y+1:y,M,D);}
  r=txt.match(/(^|[^\d])(\d{1,2})\s*일(?!\s*(뒤|후|전|동안|간))/);
  if(r)return ok(y,m,+r[2]);
  return '';
}
function piCard(n){
  const col=piCol(n),done=piDone(n),wide=n.type==='note'&&(n.text.length>34||n.text.includes('\n')&&n.text.length>24);
  let body='';
  if(n.type==='list'){
    const dn=n.lines.filter(l=>l.done).length;
    body=`<h5>☑ ${esc(n.title||'할 일')}${n.lines.length?`<em>${dn}/${n.lines.length}</em>`:''}</h5>`+
      n.lines.slice(0,6).map(l=>`<div class="ck ${l.done?'d':''}"><i>${l.done?'✓':''}</i><span>${linkify(l.text,{click:true,fam:!!(n.shared&&n.by!==role())})}${l.done&&l.doneBy&&l.doneBy!==role()&&n.shared?`<small>${whoName(l.doneBy)}가 완료</small>`:''}</span></div>`).join('')+
      (n.lines.length>6?`<div class="pi-more">+${n.lines.length-6}</div>`:'');
  }else body=`<div class="t">${linkify(n.text,{click:true,fam:!!(n.shared&&n.by!==role())}).replace(/\n/g,'<br>')}</div>`;
  const chips=(n.repeat?'<span class="chip rep">🔁 매달</span>':'')+(n.date?`<span class="chip cal">📅 ${+n.date.slice(5,7)!==cur.m+1?`${+n.date.slice(5,7)}/`:''}${+n.date.slice(8)}일</span>`:'');
  const rx=Object.entries(n.reacts||{}).filter(([,e])=>e).map(([w,e])=>`<span>${esc(e)} ${w===role()?'나':esc(whoName(w))}</span>`).join('');
  return `<div class="pi c-${col} ${piRot(n.id)} ${wide?'wide':''} ${done?'done':''}" data-act="pi-open" data-id="${n.id}">
    ${piPin(n.by)}<span class="tg">${n.shared?'♥':'🔒'}</span>${body}
    ${chips?`<div class="chips">${chips}</div>`:''}${rx?`<div class="rx">${rx}</div>`:''}
    ${done?'<span class="stamp">완료 ✓</span><span class="peel"></span>':''}${n.t?`<span class="pdt">${piDate(n)}</span>`:''}</div>`;
}
// v0.135 벽 배치: 줄마다 높이가 달라도 빈틈 없게 — 칸들을 키 작은 줄에 차례로 쌓음 (넓은 메모는 한 줄 전체)
function piMasonry(){
  const g=document.querySelector('#page .pi-grid');if(!g||g.dataset.mz)return;
  const items=[...g.children];items.forEach((e,i)=>{e.dataset.ord=i;});const n=(getComputedStyle(g).gridTemplateColumns||'').split(' ').filter(Boolean).length||2,hs=items.map(e=>e.getBoundingClientRect().height);
  const segs=[];let cur=null;
  items.forEach((e,i)=>{if(e.classList.contains('wide')){segs.push({w:e});cur=null;return;}if(!cur){cur=Array.from({length:n},()=>({h:0,l:[]}));segs.push({c:cur});}const c=cur.reduce((a,b)=>b.h<a.h?b:a);c.l.push(e);c.h+=hs[i]+18;});
  const fr=document.createDocumentFragment();
  segs.forEach(sg=>{if(sg.w){const r=document.createElement('div');r.className='pwide';r.appendChild(sg.w);fr.appendChild(r);return;}const r=document.createElement('div');r.className='pi-grid mz';sg.c.forEach(c=>{const col=document.createElement('div');col.className='pcol';c.l.forEach(e=>col.appendChild(e));r.appendChild(col);});fr.appendChild(r);});
  g.dataset.mz='1';g.className='pi-wall';g.innerHTML='';g.appendChild(fr);
}
const piDate=n=>{const d=new Date(n.t||Date.now());return `${d.getMonth()+1}/${d.getDate()}`;};   // v0.135 쓴 날짜
// v0.135 할 일 포스트잇 큰 보기: 벽에서 누르면 위젯 날짜 창처럼 커지며 뜸 · 줄 아무 데나 누르면 체크 · 아래 [수정하기]
function openPiView(id){
  const n=piFind(id);if(!n)return;const r=role(),dn=n.lines.filter(l=>l.done).length,col=piCol(n);
  const wasV=$('#pop').classList.contains('open')&&!!$('#pop .pi-view');
  $('#pop').className='open pi-vpop';
  $('#pop').innerHTML=`<div class="pi-view c-${col}" role="dialog">
    <div class="pvh"><b>☑ ${esc(n.title||'할 일')}</b><em>${dn}/${n.lines.length}</em><button class="ib" data-act="pop-close" aria-label="닫기">✕</button></div>
    <div class="pvm">${n.by===r?'내가':esc(whoName(n.by))+'가'} 씀 · ${piDate(n)}</div>
    <div class="pvl">${n.lines.map(l=>`<button class="pvr ${l.done?'d':''}" data-act="pi-vcheck" data-id="${n.id}" data-l="${l.id}"><i>${l.done?'✓':''}</i><span>${esc(l.text)}${l.done&&l.doneBy&&n.shared&&l.doneBy!==r?`<small>${esc(whoName(l.doneBy))}가 완료</small>`:''}</span></button>`).join('')||'<div class="hint">아직 할 일이 없어요</div>'}</div>
    ${piDone(n)?'<div class="pvdone">모두 끝났어요 ✓</div>':''}
    <div class="pvf"><button class="btn ghost grow" data-act="pop-close">닫기</button><button class="btn grow" data-act="pi-vedit" data-id="${n.id}">수정하기</button></div>
  </div>`;
  try{if(!wasV)MO.popOpen($('#pop'),false);}catch(e){}   // v0.210 벽의 포스트잇 자리에서 커지며 뜸
}
// 다 끝났을 때만 가족에게 한 번 (줄마다 알리지 않음)
function piAllDoneNote(n,was){if(!was&&piDone(n)&&n.shared&&!n.srv)pushEvent(other(),'board',boardKey(),`☑ "${(n.title||'할 일').slice(0,20)}" 할 일을 모두 끝냈어요`);}
function openBoard(){
  if($('#sheet').classList.contains('open'))closeSheet();
  const mk=boardKey(),r=role(),all=boardAll(mk);
  if(S.fam2&&S.fam2.boardDot){S.fam2.boardDot=0;S.fam2.boardSeen=Math.max(+S.fam2.boardSeen||0,...Object.values(S.fam2.board||{}).map(v=>+v.ua||0));famSaveLocal();}
  const items=all.filter(x=>!x.torn&&(x.shared||x.by===r)).sort(piOrdCmp(mk));
  const torn=all.filter(x=>x.torn&&(x.shared||x.by===r));
  const left=boardLeft(mk),nf=items.filter(n=>n.shared).length,nm=items.length-nf;
  const mk0=cur.y*12+cur.m;
  openPage(`<div class="pg-b pi-wall">
    <div class="pi-hd"><button class="ib" data-act="page-close" aria-label="닫기">✕</button>
      <div class="m"><button class="ib" data-act="pi-prev" ${mk0<=MIN_M?'disabled':''}>‹</button><b>${cur.m+1}월 포스트잇</b><button class="ib" data-act="pi-next" ${mk0>=MAX_M?'disabled':''}>›</button></div><span style="width:40px"></span></div>
    ${items.length?`<div class="pi-sum">${left?`<span class="y">☑ 할 일 ${left} 남음</span>`:''}${nf?`<span class="f">♥ 가족 ${nf}</span>`:''}${nm?`<span>🔒 나만 ${nm}</span>`:''}</div>`:''}
    <div class="pi-grid">${items.map(piCard).join('')}<button class="pi-add" data-act="pi-new">＋ 새 메모</button></div>
    ${torn.length?`<button class="pi-past" data-act="pi-past"><span>🗂 지난 메모 · 뗀 포스트잇 ${torn.length}</span><span>›</span></button>`:''}
  </div>`,'board');
  try{piMasonry();}catch(e){}
  boardCarryCheck(mk);
}
// v0.158 포스트잇 순서: 길게 눌러 끌어서 바꿈 · S.piOrder['2026-11']=[id…] (이 폰에만) · 목록에 없는 새 포스트잇은 뒤에 쓴 순서대로
const piOrdCmp=mk=>{const O=((S.piOrder||{})[mk])||[],ix=x=>{const i=O.indexOf(x.id);return i<0?1e9:i;};return (a,b)=>(ix(a)-ix(b))||((a.order??a.t)-(b.order??b.t));};
let piDrag=null;
function piDragEnd(drop){
  const D=piDrag;piDrag=null;clearTimeout(D&&D.tm);if(!D||!D.on)return;
  D.gh.remove();D.el.classList.remove('pi-lift');document.body.classList.remove('pi-dragging');
  (D.items||[]).forEach(e=>{e.style.transition='';e.style.transform='';});
  held=true;setTimeout(()=>{held=false;},400);   // 끌기 뒤 손을 뗄 때 열리지 않게
  const from=D.items?D.items.indexOf(D.el):-1;
  if(!drop||D.ti==null||D.ti===from||from<0)return;
  const ids=D.items.map(x=>x.dataset.id);ids.splice(D.ti,0,ids.splice(from,1)[0]);
  S.piOrder=isObj(S.piOrder)?S.piOrder:{};S.piOrder[boardKey()]=ids;save();openBoard();
}
// v0.223 끄는 동안 다른 포스트잇이 들어갈 자리로 비켜 줌 (처음 자리로 맞춰 봄 · 제자리로 오면 그대로)
function piDragMove(x,y){
  const D=piDrag;if(!D)return;
  if(!D.on){if(Math.abs(x-D.x)+Math.abs(y-D.y)>10){clearTimeout(D.tm);piDrag=null;}return;}
  D.gh.style.transform=`translate(${x-D.ox}px,${y-D.oy}px) rotate(-3deg) scale(1.04)`;
  const sc=document.querySelector('#page .pg-b');
  if(!D.items){D.items=[...document.querySelectorAll('#page .pi[data-id]')].sort((a,b)=>(+a.dataset.ord||0)-(+b.dataset.ord||0));   /* 2줄로 쌓기 전 순서 */D.R=D.items.map(e=>e.getBoundingClientRect());D.st0=sc?sc.scrollTop:0;D.ti=D.items.indexOf(D.el);D.items.forEach(e=>{e.style.transition='transform .2s cubic-bezier(.2,.9,.25,1)';});}
  const dy=(sc?sc.scrollTop:0)-D.st0;let ti=D.ti;
  D.R.forEach((b,i)=>{if(x>=b.left&&x<=b.right&&y>=b.top-dy&&y<=b.bottom-dy)ti=i;});
  if(ti!==D.ti){D.ti=ti;const from=D.items.indexOf(D.el),ord=D.items.map((e,i)=>i);ord.splice(ti,0,ord.splice(from,1)[0]);
    D.items.forEach((e,i)=>{const j=ord.indexOf(i);e.style.transform=j===i?'':`translate(${D.R[j].left-D.R[i].left}px,${D.R[j].top-D.R[i].top}px)`;});}
  if(sc){if(y<90)sc.scrollTop-=12;else if(y>innerHeight-90)sc.scrollTop+=12;}
}
document.addEventListener('pointerdown',e=>{
  const el=pageMode==='board'&&e.target.closest&&e.target.closest('#page .pi[data-id]');if(!el)return;
  const r=el.getBoundingClientRect();
  piDrag={el,id:el.dataset.id,x:e.clientX,y:e.clientY,ox:e.clientX-r.left,oy:e.clientY-r.top,on:false};
  piDrag.tm=setTimeout(()=>{const D=piDrag;if(!D)return;D.on=true;
    const gh=el.cloneNode(true);gh.classList.add('pi-ghost');gh.style.width=r.width+'px';gh.style.left='0';gh.style.top='0';document.body.appendChild(gh);D.gh=gh;
    el.classList.add('pi-lift');document.body.classList.add('pi-dragging');piDragMove(D.x,D.y);},450);
},true);
document.addEventListener('pointermove',e=>{if(piDrag)piDragMove(e.clientX,e.clientY);},true);
{const pg=document.querySelector('#page');if(pg)pg.addEventListener('touchmove',e=>{if(piDrag&&piDrag.on){if(e.cancelable)e.preventDefault();const t=e.touches[0];if(t)piDragMove(t.clientX,t.clientY);}},{passive:false,capture:true});}   // (달력 가로 스크롤이 기다리지 않게 #page 에만)
document.addEventListener('pointerup',()=>{if(piDrag)piDragEnd(true);},true);
document.addEventListener('touchend',()=>{if(piDrag)piDragEnd(true);},true);
document.addEventListener('pointercancel',()=>{if(piDrag&&!piDrag.on)piDragEnd(false);},true);
document.addEventListener('contextmenu',e=>{if(piDrag&&e.target.closest&&e.target.closest('.pi'))e.preventDefault();});
// v0.159 이럴 땐 이렇게: 펼치기 · 접기를 높이로 스르르 (안쪽 글은 살짝 내려오듯) · 동작 줄이기면 바로
document.addEventListener('click',e=>{
  const sm=e.target.closest&&e.target.closest('.tips.np details>summary');if(!sm)return;
  const d=sm.parentElement;if(reduceMotion()||!d.animate)return;
  e.preventDefault();const wasClosing=!!(d._an&&d._closing);if(d._an){d._an.cancel();d._an=null;}
  const h0=d.getBoundingClientRect().height,opening=wasClosing||!d.open,ease='cubic-bezier(.2,.7,.2,1)';
  if(opening)d.open=true;
  const h1=opening?d.getBoundingClientRect().height:sm.getBoundingClientRect().height+(parseFloat(getComputedStyle(d).borderTopWidth)||0)*2;
  d.classList.add('anim');
  const an=d.animate([{height:h0+'px'},{height:h1+'px'}],{duration:opening?260:220,easing:ease});d._an=an;d._closing=!opening;
  if(opening)[...d.children].filter(c=>c!==sm).forEach((c,i)=>c.animate([{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'none'}],{duration:240,delay:Math.min(i,6)*25,easing:ease,fill:'backwards'}));
  an.onfinish=()=>{d._an=null;d.classList.remove('anim');if(!opening)d.open=false;};
  an.oncancel=()=>{d.classList.remove('anim');};
},true);
/* ---- 포스트잇 크게 펼치기 · 새로 쓰기 ---- */
let piEd=null;
function piTarget(){return !piEd?null:piEd.isNew?piEd.n:piFind(piEd.id);}
function piOpen(id){
  if(id){if(!piFind(id))return;piEd={isNew:false,id};}
  else piEd={isNew:true,n:{id:uid(),type:'note',title:'',lines:[],text:'',shared:role()==='guest'||famView(),by:role(),color:'y',repeat:false,dateAuto:true,date:'',reacts:{},torn:false}};
  renderPiEd(true);
}
function piPull(){
  const n=piTarget();if(!n)return;
  const ti=$('#piTitle'),tx=$('#piText'),li=$('#piLine');
  if(li)piEd.line=li.value;
  if(ti)n.title=ti.value.trim().slice(0,30);
  if(tx)n.text=tx.value.replace(/\s+$/,'').slice(0,500);
  document.querySelectorAll('#pop .pi-lt').forEach(inp=>{const l=n.lines.find(x=>x.id===inp.dataset.l),v=inp.value.trim().slice(0,60);if(l&&v)l.text=v;});   // v0.135 줄을 그 자리에서 고침
}
function piSug(n){
  const k=piDetect(n,boardKey());
  if(!k)return '';
  return `<label class="pi-sug"><input type="checkbox" id="piDate" ${n.dateAuto!==false?'checked':''}> 📅 ${+k.slice(5,7)}월 ${+k.slice(8)}일 달력에도 표시</label>`;
}
function renderPiEd(focus){
  const n=piTarget();if(!n){closePop();return;}
  const pv=$('#pop'),was=pv.classList.contains('open')&&!!pv.querySelector('.pi-ed'),ob=was?pv.querySelector('.pi-ed').offsetHeight:0,otg=was&&pv.querySelector('.pi-ed .tg')?pv.querySelector('.pi-ed .tg').textContent:'',ocl=was&&pv.querySelector('.pi-ed .pi.big')?pv.querySelector('.pi-ed .pi.big').className:'';
  const r=role(),own=piEd.isNew||n.by===r,col=piCol(n),isList=n.type==='list';
  const lineRow=l=>`<div class="ck ${l.done?'d':''}"><i data-act="pi-check" data-id="${n.id}" data-l="${l.id}">${l.done?'✓':''}</i>${own||n.shared?`<input class="pi-lt" data-l="${l.id}" value="${esc(l.text)}" maxlength="60" enterkeyhint="done" aria-label="할 일 고치기">`:`<span>${esc(l.text)}</span>`}${own||n.shared?`<button class="x" data-act="pi-ldel" data-l="${l.id}" aria-label="지우기">✕</button>`:''}</div>`;
  const body=isList?`
      <input type="text" id="piTitle" class="pi-title" placeholder="제목 (예: 장보기)" value="${esc(n.title||'')}" maxlength="30" ${own?'':'readonly'}>
      ${n.lines.map(lineRow).join('')}
      <div class="pi-addl"><input type="text" id="piLine" placeholder="＋ 할 일 한 줄 추가" enterkeyhint="done" maxlength="60" value="${esc(piEd.line||'')}"><button data-act="pi-ladd">추가</button></div>`
    :`<textarea id="piText" placeholder="메모를 적어주세요" maxlength="500" ${own?'':'readonly'}>${esc(n.text||'')}</textarea>`;
  const rx=n.reacts||{};
  const seen=Object.entries(rx).filter(([w,e])=>e&&w!==r).map(([w,e])=>`${esc(e)} ${esc(whoName(w))}`).join(' · ');
  $('#pop').className='open pi-pop';
  $('#pop').innerHTML=`<div class="pi-ed">
    <div class="pi big c-${col}">${piPin(n.by)}<span class="tg">${n.shared?'♥ 가족':'🔒 나만'}</span>
      ${body}
      <div id="piSug">${piSug(n)}</div>
      ${!piEd.isNew?`<div class="pi-meta">${n.by===r?'내가':esc(whoName(n.by))+'가'} 붙임 · ${rel(n.t)}</div>`:''}
      ${!piEd.isNew&&n.shared?`<div class="pi-react">${PI_REACT.map(e=>`<button class="${rx[r]===e?'on':''}" data-act="pi-react" data-v="${e}">${e==='✓'?'✓ 확인':e}</button>`).join('')}</div>${seen?`<div class="pi-seen">${seen} 이 봤어요</div>`:''}`:''}
    </div>
    <div class="pi-tools">
      ${piEd.isNew?`<div class="hseg"><button class="${isList?'on':''}" data-act="pi-type" data-v="list">☑ 할 일</button><button class="${isList?'':'on'}" data-act="pi-type" data-v="note">📝 메모</button></div>`:''}
      ${own&&!famView()?`<div class="hseg"><button class="${n.shared?'':'on'}" data-act="pi-share" data-v="0">🔒 나만</button><button class="${n.shared?'on fam':''}" data-act="pi-share" data-v="1">♥ 가족</button></div>`:''}
      ${own&&n.shared&&S.link&&!n.srv&&(piEd.isNew||n.cnt)?`<div class="usage-hint" style="width:100%;text-align:center">${famRemTxt()} · 가족 포스트잇은 새로 붙일 때만 1건</div>`:''}
      ${own&&!n.shared?`<div class="pi-cols">${PI_COL.map(c=>`<button class="c-${c} ${n.color===c?'on':''}" data-act="pi-color" data-v="${c}" aria-label="색"></button>`).join('')}</div>`:''}
      ${own?`<button class="pi-tb ${n.repeat?'on':''}" data-act="pi-repeat">🔁 매달 반복</button>`:''}
      ${!piEd.isNew&&piDone(n)?'<button class="pi-tb" data-act="pi-tear">📤 떼기</button>':''}
      ${!piEd.isNew&&(own||(r==='host'&&!n.srv))?'<button class="pi-tb del" data-act="pi-del">🗑</button>':''}
      <button class="pi-go" data-act="pi-save">${piEd.isNew?'붙이기':'완료'}</button>
    </div></div>`;
  try{if(!was)MO.popOpen(pv,false);else if(!RMq()){const e=pv.querySelector('.pi-ed'),h=e&&e.offsetHeight;if(e&&Math.abs(h-ob)>3){e.style.overflow='hidden';const a=e.animate([{height:ob+'px'},{height:h+'px'}],{duration:300,easing:'cubic-bezier(.2,.9,.25,1)'});a.onfinish=a.oncancel=()=>{e.style.overflow='';};}
    const tg=pv.querySelector('.pi-ed .tg');if(tg&&otg&&tg.textContent!==otg)tg.animate([{transform:'scale(.6)',opacity:0},{transform:'scale(1.12)',opacity:1,offset:.65},{transform:'none'}],{duration:340,easing:'cubic-bezier(.2,.9,.25,1)'});   // 나만 ↔ 가족 표시 톡
    const pb=pv.querySelector('.pi-ed .pi.big');if(pb&&ocl&&pb.className!==ocl)pb.animate([{transform:'rotate(-1.5deg) scale(.98)'},{transform:'none'}],{duration:300,easing:'cubic-bezier(.3,1.4,.5,1)'});}}catch(e){}   // v0.210 처음엔 누른 자리에서 커지고 · 할 일/메모 · 줄 추가로 크기가 바뀌면 스르르
  if(focus&&piEd.isNew){const f=$(isList?'#piTitle':'#piText');if(f)setTimeout(()=>f.focus(),60);}
}
function piCommit(){
  const n=piTarget();if(!n)return false;
  piPull();
  const li=$('#piLine');if(li&&li.value.trim()){n.lines.push({id:uid(),text:li.value.trim().slice(0,60),done:false,doneBy:''});li.value='';piEd.line='';}
  const dc=$('#piDate');if(dc)n.dateAuto=dc.checked;
  n.date=n.dateAuto!==false?piDetect(n,boardKey()):'';
  if(piEd.isNew){
    if(n.type==='note'?!n.text.trim():!(n.lines.length||n.title)){toast('내용을 적어주세요');return false;}
    if(n.type==='list'&&!n.title&&!n.lines.length)return false;
    if(n.shared&&S.link){if(famRemain()<=0){famLimitSheet();return false;}n.cnt=1;}
    n.t=Date.now();
    const mk=boardKey();(S.board[mk]=S.board[mk]||[]).push(n);
    if(n.shared&&!S.link)pushEvent(other(),'board',mk,`🗒 ${cur.m+1}월 포스트잇: "${piLabel(n).slice(0,24)}"`);
    if(n.shared&&S.link)famSyncBoardSoon();
  }
  piSave(n);return true;
}
function piAddLine(){
  const n=piTarget(),li=$('#piLine');if(!n||!li)return;
  const v=li.value.trim();if(!v){li.focus();return;}
  piPull();piEd.line='';n.lines.push({id:uid(),text:v.slice(0,60),done:false,doneBy:''});
  if(!piEd.isNew){piSave(n);if(n.shared&&!n.srv)pushEvent(other(),'board',boardKey(),`📝 "${(n.title||'할 일').slice(0,12)}"에 추가: ${v.slice(0,20)}`);}
  renderPiEd();const l2=$('#piLine');if(l2)l2.focus();
}
function piClose(commit){
  if(commit&&piEd&&!piEd.isNew)piCommit();
  if(commit&&piEd&&piEd.isNew){   // v0.127 새 포스트잇을 쓰다가 바깥 · 뒤로가기: 한 글자라도 있으면 묻지 않고 바로 저장 (되돌리기)
    piPull();const n=piEd.n,li=$('#piLine'),has=n.type==='note'?!!n.text.trim():!!(n.title||n.lines.length||(li&&li.value.trim()));
    if(has){if(!piCommit())return;const mk=boardKey();
      toastUndo('📌 저장했어요',()=>{if(n.srv)piSrvDelete(n);else S.board[mk]=(S.board[mk]||[]).filter(x=>x.id!==n.id);save();if(pageMode==='board'){render();openBoard();}});}
  }
  piEd=null;closePop();   // v0.210 닫을 때도 누른 자리로 (다른 작은 창과 같게)
  if(pageMode==='board'){render();openBoard();}
}
function piTear(n){n.torn=true;n.tornAt=Date.now();piSave(n);toast('📤 떼어서 "지난 메모"에 보관했어요');}
function openPiPast(){
  const r=role(),torn=boardList(boardKey()).filter(x=>x.torn&&(x.shared||x.by===r)).sort((a,b)=>b.tornAt-a.tornAt);
  openPop(`<div class="mh">${cur.m+1}월 · 뗀 포스트잇<b>되돌리면 다시 벽에 붙어요</b></div>
    ${torn.map(n=>`<div class="mi"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.shared?'♥':'🔒'} ${esc(piLabel(n))}</span><button class="btn sm ghost" data-act="pi-restore" data-id="${n.id}">되돌리기</button>${n.by===r||(r==='host'&&!n.srv)?`<button class="xbtn" data-act="pi-purge" data-id="${n.id}" aria-label="지우기">✕</button>`:''}</div>`).join('')||'<div class="mi" style="color:var(--muted)">없어요</div>'}
    <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);
}
// 달 넘김: 이번 달 처음 열 때 지난달 안 끝난 할 일을 물어봄 (한 번만)
let carryCand=null;
function boardCarryCheck(mk){
  const now=new Date(),cm=`${now.getFullYear()}-${pad(now.getMonth()+1)}`;
  if(mk!==cm||S.boardCarry[mk]||$('#pop').classList.contains('open'))return;
  const pd=new Date(now.getFullYear(),now.getMonth()-1,1),pm=`${pd.getFullYear()}-${pad(pd.getMonth()+1)}`,r=role();
  const cand=[];
  boardList(pm).forEach(n=>{if(n.repeat||n.type!=='list'||!(n.shared||n.by===r)||(n.srv&&n.by!==r))return;n.lines.forEach(l=>{if(!l.done)cand.push({n,l});});});   // 가족 포스트잇은 쓴 사람만 옮김
  if(!cand.length)return;
  carryCand={mk,cand};
  const reps=(S.board[mk]||[]).filter(n=>n.rootId).map(piLabel);
  openPop(`<div class="mh">${pd.getMonth()+1}월에 안 끝난 할 일이 ${cand.length}개 있어요<b>${now.getMonth()+1}월 포스트잇으로 옮길까요?</b></div>
    ${cand.map((c,i)=>`<label class="mi"><input type="checkbox" id="carry${i}" checked style="flex:none;width:18px;height:18px"><span style="flex:1">${esc(c.l.text)}</span><small style="color:var(--muted)">${c.n.shared?'♥':'🔒'} ${esc(c.n.title||'할 일')}</small></label>`).join('')}
    ${reps.length?`<div class="mi" style="font-size:13px;color:#0f766e">🔁 매달 반복: ${reps.map(esc).join(', ')} 은 이미 붙여 뒀어요</div>`:''}
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pi-carry-skip">그냥 둘게요</button><button class="btn grow" data-act="pi-carry-go">옮기기</button></div>`);
}
function boardCarryDo(go){
  if(!carryCand)return;
  const {mk,cand}=carryCand;
  if(go){
    const groups=new Map();
    cand.forEach((c,i)=>{const cb=$('#carry'+i);if(cb&&!cb.checked)return;if(!groups.has(c.n))groups.set(c.n,[]);groups.get(c.n).push(c.l);});
    groups.forEach((lines,src)=>{
      (S.board[mk]=S.board[mk]||[]).push({id:uid(),type:'list',title:src.title||'할 일',text:'',shared:src.shared,by:src.srv?role():src.by,color:src.srv?'y':src.color,repeat:false,dateAuto:false,date:'',reacts:{},torn:false,t:Date.now(),
        lines:lines.map(l=>({id:uid(),text:l.text,done:false,doneBy:''}))});
    });
    if(groups.size){toast('이번 달로 옮겼어요');if(S.link)famSyncBoardSoon();}
  }
  S.boardCarry[mk]=1;carryCand=null;save();closePop();openBoard();
}
/* 다 끝난 포스트잇은 옆으로 밀어서 떼기 */
let piSwipe=null,piSwiped=false;
document.addEventListener('pointerdown',e=>{
  const c=e.target.closest&&e.target.closest('.pi-wall .pi.done');
  piSwipe=c?{el:c,x:e.clientX,y:e.clientY}:null;piSwiped=false;
});
document.addEventListener('pointermove',e=>{
  if(!piSwipe)return;
  const dx=e.clientX-piSwipe.x,dy=e.clientY-piSwipe.y;
  if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){piSwipe.el.style.transform='';piSwipe=null;return;}
  if(Math.abs(dx)>8){piSwiped=true;piSwipe.el.style.transform=`translateX(${dx}px) rotate(${dx/14}deg)`;piSwipe.el.style.opacity=String(Math.max(.3,1-Math.abs(dx)/220));}
});
document.addEventListener('pointerup',e=>{
  if(!piSwipe)return;
  const dx=e.clientX-piSwipe.x,el=piSwipe.el;piSwipe=null;
  if(Math.abs(dx)>90){const n=piFind(el.dataset.id);if(n){piTear(n);render();openBoard();}}   // (가족 포스트잇도 누구나 뗄 수 있음)
  else{el.style.transform='';el.style.opacity='';}
});

/* ================= D-day ================= */
const EMOJI=['📌','🏖','🎂','✈️','💍','🎉','🏥','📚','💼','⭐'];
let ddDraft=null;
function openDday(){
  sheetMode='dday';ddDraft=null;
  const t0=new Date(),r=role();
  const find=(rest)=>{for(let i=1;i<200;i++){const d=addDays(t0,i);if(isRest(shiftOf(d))===rest)return d;}return null;};
  const nr=find(true),nw=find(false);
  const todayS=shiftOf(t0);
  const auto=`
    <div class="dcard auto"><div><b>${isRest(todayS)?'오늘은 쉬는 날 · 다음 휴무까지':'다음 휴무까지'}</b><small>${nr?`${mdw(fmt(nr))} ${esc(shiftLabel(shiftOf(nr)))} · 자동 계산`:'200일 안에 없어요'}</small></div><div class="dnum" style="color:var(--today)">${nr?'D-'+dDiff(fmt(nr)):'-'}</div></div>
    <div class="dcard"><div><b>다음 근무까지</b><small>${nw?`${mdw(fmt(nw))} ${esc(shiftLabel(shiftOf(nw)))} · 자동 계산`:'200일 안에 없어요'}</small></div><div class="dnum">${nw?'D-'+dDiff(fmt(nw)):'-'}</div></div>`;
  const mine=(S.ddays||[]).filter(x=>x.shared||x.by===r).sort((a,b)=>ddayNext(a).localeCompare(ddayNext(b)));
  const rows=mine.map(x=>{
    const n=dDiff(ddayNext(x));
    const sub=[mdw(x.date)+(x.yearly?'':''),x.yearly?'매년 반복':'',x.showCal?'달력에 표시':'',x.shared?'♥ 가족과 공유':''].filter(Boolean).join(' · ');
    return `<div class="drow" data-act="dday-edit" data-id="${x.id}"><div class="e">${x.emoji||'📌'}</div><div class="tx"><b>${esc(x.name)}</b><small>${esc(sub)}</small></div><div class="n" style="color:${n>=0&&n<=7?'var(--dd)':'var(--fg)'}">${ddayLabel(x)}</div></div>`;
  }).join('');
  openSheet(`
    ${sheetHead('D-day','<button class="ib" data-act="open-board" aria-label="월 포스트잇으로" style="width:auto;font-size:24px;padding-right:8px">‹</button>')}
    ${auto}
    <div class="mgrp" style="margin-top:16px">내 D-day</div>
    ${rows||'<div class="mempty">연차·기념일·여행 날짜를 넣어 두면 남은 날을 세어 드려요</div>'}
    <button class="btn ghost" style="width:100%;margin-top:12px;color:var(--accent)" data-act="dday-new">＋ D-day 추가</button>`);
}
function openDdayEdit(){
  sheetMode='dday';
  const x=ddDraft;
  openSheet(`
    <div class="sh-head"><button class="ib shbk" data-act="open-dday" aria-label="뒤로">‹</button><b style="flex:1;text-align:center">${x.isNew?'D-day 추가':'D-day 고치기'}</b><button class="ib ok" data-act="dday-save">저장</button></div>
    <div class="lbl" style="margin-top:0">이름</div><input type="text" id="ddName" value="${esc(x.name)}" placeholder="예: 장모님 생신" maxlength="20">
    <div class="lbl">날짜</div><input type="date" id="ddDate" value="${x.date}">
    <div class="lbl">아이콘</div><div class="emo">${EMOJI.map(e=>`<button class="${x.emoji===e?'on':''}" data-act="dday-emoji" data-v="${e}">${e}</button>`).join('')}</div>
    <div class="setting-item" style="margin-top:10px"><div class="setting-label"><b>매년 반복</b></div><label class="sw"><input type="checkbox" id="ddYearly" ${x.yearly?'checked':''}><i></i></label></div>
    <div class="setting-item"><div class="setting-label"><b>달력에 표시</b></div><label class="sw"><input type="checkbox" id="ddCal" ${x.showCal?'checked':''}><i></i></label></div>
    <div class="setting-item" style="border-bottom:none"><div class="setting-label"><b>가족과 공유</b></div><label class="sw"><input type="checkbox" id="ddShare" ${x.shared?'checked':''}><i></i></label></div>
    ${x.isNew?'':'<button class="btn ghost danger" style="width:100%;margin-top:14px" data-act="dday-del">삭제</button>'}`);
}

/* ================= 근무 요청 (기존 흐름) ================= */
function reqCard(r,inList){
  const items=grpItems(r),many=items.length>1;
  const guest=r.srv?r.dir==='out':S.syncSettings.isGuestMode,d=parse(r.date),st=REQ_ST[r.st];
  const when=many?`${dateRangeText(items.map(x=>x.date))} (${items.length}일)`:mdw(r.date);
  let acts='';
  if(!guest){
    if(inList&&(r.st==='pending'||r.st==='accepted'||r.st==='rejected')){
      acts+=`<div class="row rq-acts"><button class="btn sm" data-act="rq-go" data-id="${r.id}" style="width:100%">📅 달력에서 보기 ›</button></div>`;
    }else if(r.st==='pending'||r.st==='accepted'||r.st==='rejected'){
      acts+=`<div class="rq-grid">
        <button class="btn sm ghost" data-act="rqreply" data-id="${r.id}" data-s="pending">🟡 ${r.srv?'보류':'대기'}</button>
        <button class="btn sm ghost" data-act="rqreply" data-id="${r.id}" data-s="accepted">🟢 수락</button>
        <button class="btn sm ghost" data-act="rqreply" data-id="${r.id}" data-s="rejected">🔴 거절</button>
      </div>`;
    }
    if(r.st==='applied'&&r.mode==='keep')acts+=`<div class="row rq-acts"><span class="muted grow">근무는 원래대로 유지했어요</span></div>`;
    else if(r.st==='applied')acts+=`<div class="row rq-acts"><span class="muted grow">근무표에 적용됐어요 (${many?items.length+'일 전체':`${esc(shiftLabel(r.prev))} → ${esc(shiftLabel(r.want))}`})</span><button class="btn sm ghost danger" data-act="rqundo" data-id="${r.id}" style="flex:none">적용 취소</button></div>`;
  }else if(r.st==='pending'){
    acts+=`<div class="row rq-acts"><button class="btn sm ghost danger" data-act="rqcancel" data-id="${r.id}">요청 취소</button></div>`;
  }
  return `<div class="rq">
    <div class="rq-head"><span class="rq-title">${r.srv?`${esc(r.peerName)}${r.dir==='out'?'에게 · ':' · '}`:''}${when} · ${esc(shiftLabel(r.want))} 요청</span><span class="st ${r.st}">${st.ic} ${r.srv&&r.st==='pending'&&r.held?'보류 중':st.name}</span></div>
    ${r.msg?`<div class="bubble ask"><small>요청</small>${esc(r.msg)}</div>`:''}
    ${r.reply?`<div class="bubble rep"><small>답장</small>${esc(r.reply)}</div>`:''}
    ${acts}
    <div class="rq-time">${rel(r.tu)}</div>
  </div>`;
}
function openRequests(){
  const guest=S.syncSettings.isGuestMode;
  sheetMode='requests';
  const w={pending:0,accepted:1,rejected:2,applied:3,cancelled:4};
  const list=reqUniq([...(S.link?S.requests.filter(r=>r.srv):S.requests)].sort((a,b)=>(w[a.st]-w[b.st])||(b.t-a.t)||a.date.localeCompare(b.date)));
  openSheet(`
    ${sheetHead(S.link?'📩 근무 요청':guest?'📩 내 요청 내역':'📩 가족 요청함')}
    <div class="hint">${guest?'달력에서 날짜를 누르면 근무 변경을 요청할 수 있어요.':'달력에서 보기를 누르면 그 달에서 앞뒤 근무를 보며 답할 수 있어요.'}</div>
    ${list.length?list.map(r=>reqCard(r,true)).join(''):'<div class="hint">아직 요청이 없어요</div>'}`);
}

/* ---------- 하루 무료 횟수 다 썼을 때 ---------- */
function openLimitSheet(kind){
  const name=kind==='fam'?'가족 메모':'근무 요청';
  openSheet(`
    ${sheetHead('오늘 무료 횟수를 다 썼어요')}
    <div class="hint">${name}는 하루 ${FREE_PER_DAY}건까지 무료예요. 짧은 광고를 보면 ${BONUS_PER_AD}건을 더 쓸 수 있어요.</div>
    <button class="btn" style="width:100%" data-act="watchad">▶ 15초 광고 보고 ${BONUS_PER_AD}건 더 받기</button>
    <button class="btn ghost" style="width:100%; margin-top:10px;" data-act="gopro">⭐ 광고 없이 무제한 쓰기 (월 3,000원)</button>`);
}
let adTimer=null;
function openAdSheet(){
  let left=15;
  openSheet(`
    <div class="sh-head"><b style="font-size:16px;">광고 재생 중 (예시)</b><span style="width:36px"></span></div>
    <div class="card" style="text-align:center;padding:36px 20px;">
      <div class="ad-count" id="adCount">${left}</div>
      <div class="muted" style="margin-top:6px">잠시만 기다려주세요…</div>
      <div class="ad-bar"><i id="adBar" style="width:0%"></i></div>
    </div>
`);
  clearInterval(adTimer);
  adTimer=setInterval(()=>{
    left--;
    const c=document.getElementById('adCount'),b=document.getElementById('adBar');
    if(c)c.textContent=Math.max(left,0);
    if(b)b.style.width=Math.round((15-left)/15*100)+'%';
    if(left<=0){clearInterval(adTimer);grantBonus();}
  },1000);
}
function grantBonus(){const u=usage();u.bonus+=1;save();toast(`광고 시청 완료! ${BONUS_PER_AD}건 더 쓸 수 있어요`);resumePending();}
function openProSheet(){
  openSheet(`
    ${sheetHead('⭐ 광고 없이 무제한')}
    <span class="pro-badge">월 3,000원</span>
    <div class="hint" style="margin-top:0">가족 메모·근무 요청을 하루 제한 없이 보낼 수 있어요.</div>
    <button class="btn" style="width:100%" data-act="dopro">구독 시작하기 (예시)</button>
`);
}
function resumePending(){
  const p=pendingSend;pendingSend=null;
  if(!p){closeSheet();render();return;}
  if(p.type==='rq'){commitRequest(p.date,p.want,p.msg);render();openDay(p.date);toast('요청을 보냈어요 (🟡 대기)');}
  else if(p.type==='fam'){addMemo(p.date,p.text,true,true);render();openDay(p.date);toast('가족에게 메모를 남겼어요');}
}
function commitRequest(date,want,msg){
  const now=Date.now();
  S.requests.push({id:uid(),date,want,msg:(msg||'').trim(),st:'pending',reply:'',prev:null,t:now,tu:now});
  pushEvent('host','req',date,`📩 ${md(date)} ${shiftLabel(want)} 요청이 도착했어요`);
  if(!S.syncSettings.isPro)consumeUsage();else save();
}
function doRqSend(){
  const k=sheetKey;if(!k)return;
  if(reqDraft.want===shiftOf(parse(k))){toast('이미 그 근무예요. 다른 근무를 골라주세요');return;}
  if(S.requests.some(r=>r.date===k&&(r.st==='pending'||r.st==='accepted'))){toast('이미 진행 중인 요청이 있어요');return;}
  if(limitInfo().remaining<=0){pendingSend={type:'rq',date:k,want:reqDraft.want,msg:reqDraft.msg};openLimitSheet('req');return;}
  commitRequest(k,reqDraft.want,reqDraft.msg);
  reqDraft={want:'휴',msg:''};
  render();openDay(k);toast('요청을 보냈어요 (🟡 대기)');
}
function presetText(r,st,mode){
  const d=parse(r.date);
  if(st==='accepted'&&mode==='keep')return '가능은 할 것 같은데, 근무는 원래대로 갈게. 마음만 받을게 😊';
  if(st==='accepted')return `가능할 듯! ${d.getDate()}일 ${shiftLabel(r.want)}로 할게.`;
  if(st==='rejected')return '회사에서 안 된대 😭';
  return '일단 회사에 물어볼게.\n내일 확인해보고 알려줄게.';
}
function openReply(id,st){
  const r=S.requests.find(x=>x.id===id);if(!r)return;
  const back=sheetMode,its=grpItems(r),many=its.length>1;
  replyDraft={id,st,mode:null,text:'',back};
  const label=`${REQ_ST[st].ic} ${REQ_ST[st].name}`;
  openSheet(`
    <div class="sh-head">
      <button class="ib" data-act="rqback" style="font-size:15px; width:auto; padding:0; color:var(--muted);">뒤로</button>
      <b style="font-size:16px;flex:1;text-align:center">${label} 답장</b>
      <span style="width:36px"></span>
    </div>
    <div class="hint">${many?`${dateRangeText(its.map(x=>x.date))} (${its.length}일)`:mdw(r.date)} · ${esc(shiftLabel(r.want))} 요청${r.msg?`: "${esc(r.msg)}"`:''}</div>
    <textarea id="rpm" placeholder="${esc(presetText(r,st))}"></textarea>
    ${st==='accepted'?`<div class="hint" style="padding:6px 2px 0">수락하면 근무표가 바로 바뀌어요${many?` (${its.length}일 전체)`:''}</div>`:''}
    <div class="row" style="margin-top:14px"><span class="grow"></span><button class="btn" data-act="rqsend-reply">${REQ_ST[st].ic} ${REQ_ST[st].name}으로 보내기</button></div>`);
}

/* ================= 날짜 메모 ================= */
let memoTab='all',memoMode='my',memoEdit=null,memoText='';
function addMemo(k,text,shared,countUsage,x){
  const mm={id:uid(),text,shared,by:role(),t:Date.now()};if(x)mdApply(mm,x);track(shared?'memo_family':'memo_mine');
  (S.memos[k]=S.memos[k]||[]).push(mm);
  if(shared)pushEvent(other(),'memo',k,`♥ ${md(k)}에 ${role()==='host'?'근무자':'가족'}가 메모를 남겼어요: "${firstLine(text).slice(0,24)}"`);
  if(countUsage&&!S.syncSettings.isPro)consumeUsage();else save();
  return mm;
}
// 가족 메모 받는 사람: 가족 모두면 따로 안 적고(m.to 없음), 일부만이면 m.to=[uid…]
function memoSetTo(m,to){const all=famOthers().map(x=>x.uid);if(!m)return;if(!Array.isArray(to)||all.every(u=>to.includes(u)))delete m.to;else m.to=to.filter(u=>all.includes(u));}
function memoSubmit(){
  const k=sheetKey;if(!k)return;
  const el=$('#memoInput'),text=el?el.value.trim():'';
  if(!text){toast('메모를 적어주세요');return;}
  const fam=memoMode==='fam',isGuest=role()==='guest',srv=!!S.link;   // srv: 가족방에 연결됨 = 가족 메모는 서버로 나감
  if(memoEdit){
    const m=memosOf(k).find(x=>x.id===memoEdit);
    if(m){
      const becameFam=fam&&!m.shared;
      if(srv&&becameFam){if(famRemain()<=0){famLimitSheet();return;}openCfm({type:'memo',k,text,id:m.id,edit:true});return;}
      if(srv&&fam&&m.shared&&text!==m.text){openCfm({type:'memo-edit',k,text,id:m.id,notify:false});return;}
      m.text=text;m.shared=fam;m.t=Date.now();
      if(becameFam)pushEvent(other(),'memo',k,`♥ ${md(k)}에 메모를 남겼어요: "${firstLine(text).slice(0,24)}"`);
    }
    memoEdit=null;save();
  }else{
    if(fam&&srv){if(famRemain()<=0){famLimitSheet();return;}openCfm({type:'memo',k,text});return;}
    // 가족(게스트)이 쓰는 가족 메모는 하루 무료 횟수 안에서
    if(fam&&isGuest&&limitInfo().remaining<=0){pendingSend={type:'fam',date:k,text};openLimitSheet('fam');return;}
    addMemo(k,text,fam,fam&&isGuest);
  }
  memoText='';
  memoFinish(k,fam?'♥ 가족 메모를 남겼어요':isSolo()?'메모를 남겼어요':'나만 보는 메모를 남겼어요');
}
function memoFinish(k,msg){
  render();openDay(k);
  const i=$('#memoInput');if(i)i.focus();
  if(!S.tipMemo&&!isSolo()){S.tipMemo=true;save();toast('보라색은 가족에게 보이는 메모, 회색은 나만 보는 메모예요');}
  else toast(msg);
}
/* ----- 서버(가족방)로 나가는 행동은 보내기 전에 확인창 한 번 (개인 메모 · 스티커 · 내 근무표는 바로) ----- */
var cfm=null;
function openCfm(c){
  if(c.type==='memo'||c.type==='memo-edit'){   // 받는 사람: 처음엔 가족 모두 (고치는 메모는 지금 받는 사람)
    const all=famOthers().map(x=>x.uid),cur=c.id?(memosOf(c.k).find(x=>x.id===c.id)||{}).to:null;
    c.to=Array.isArray(cur)&&cur.length?cur.filter(u=>all.includes(u)):all.slice();
    if(!c.to.length)c.to=all.slice();
  }
  cfm=c;renderCfm();
}
const cfmToHtml=(c,others)=>others.length>1?`<div class="hint cfm-h" style="margin-top:8px">받는 사람</div><div class="chips left" style="margin-top:4px">${others.map(m=>`<button class="${c.to.includes(m.uid)?'on':''}" data-act="cfm-to" data-u="${esc(m.uid)}">${esc(m.name)}</button>`).join('')}</div>`:'';
function renderCfm(){
  const c=cfm;if(!c)return;
  const others=famOthers(),names=others.map(m=>m.name).join(' · ')||'가족',rem=`<div class="cfm-rem">${famBx.vip?'무제한':`${famRemTxt()} (처음 ${FAM_FREE}건까지 무료)`}</div>`;
  let head='',body='',ok='보내기';
  if(c.type==='memo'){
    head='♥ 가족 메모<b>가족에게 보낼까요?</b>';
    const sel=others.filter(m=>c.to.includes(m.uid)).map(m=>m.name).join(' · ')||names;
    body=`<div class="cfm-q">${esc(c.text)}</div><div class="hint cfm-h">${esc(sel)}에게 보여요 · ${md(c.k)} 날짜에 붙어요</div>${cfmToHtml(c,others)}${rem}`;
  }else if(c.type==='stk'){
    head='⭐ 스티커 보여주기<b>가족에게 보여줄까요?</b>';
    body=`<div class="cfm-q">내 스티커(운동 등)가 ${esc(names)}의 가족 달력에 보여요</div>`;ok='켜기';
  }else if(c.type==='status'){
    head='📡 실시간 상태<b>가족에게 보여줄까요?</b>';
    body=`<div class="cfm-q">지금 하는 일(근무 중 · 자는 중 등)이 ${esc(names)}에게 실시간으로 보여요</div>`;ok='켜기';
  }else if(c.type==='memo-edit'){
    head='✏️ 가족 메모<b>고쳐서 올릴까요?</b>';
    body=`<div class="cfm-q">${esc(c.text)}</div>
      <div class="jopt ${c.notify?'':'on'}" data-act="cfm-nt" data-v="0"><b>조용히 고치기</b></div>
      <div class="jopt ${c.notify?'on':''}" data-act="cfm-nt" data-v="1"><b>고쳤다고 알리기</b></div>
      ${cfmToHtml(c,others)}<div class="cfm-rem">고치는 건 무료 횟수를 쓰지 않아요</div>`;
    ok='올리기';
  }else{
    const want=schType(c.sch,c.want);
    head=`📩 근무 요청<b>${esc(c.name)}에게 보낼까요?</b>`;
    const ds=c.dates||[c.k],when=ds.length>1?`${dateRangeText(ds)} (${ds.length}일)`:md(c.k);
    body=`<div class="cfm-q"><b>${esc(c.name)}</b> · ${when} → <span style="display:inline-flex;vertical-align:middle">${schBadge(c.sch,c.want,'sm')}</span> ${esc(want.name)}${ds.length>1?`<div class="cfm-m">${ds.map(md).join(' · ')}</div>`:''}${c.msg?`<div class="cfm-m">${esc(c.msg)}</div>`:''}</div>
      ${c.others.length?`<div class="jopt ${c.cc?'on':''}" data-act="cfm-cc"><b>가족 모두에게도 알리기</b><small>${esc(c.others.map(m=>m.name).join(' · '))}에게는 알림만 가요 · 답은 ${esc(c.name)}만 해요</small></div>`:''}${rem}`;
  }
  openPop(`<div class="mh">${head}</div><div class="mi" style="display:block">${body}</div><div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="cfm-no">취소</button><button class="btn grow" data-act="cfm-ok">${ok}</button></div>`);
}
function doCfm(c){
  if(c.pg&&(c.type==='memo'||c.type==='memo-edit')&&pageMode==='memodetail'){mdDraft=null;closePage();}
  if(c.type==='status'){S.status.show=true;save();return;}
  if(c.type==='stk'){S.link.stk=true;save();famPush(true).catch(famPushFail);if(pageMode==='link')openLinkPage();toast('내 스티커를 가족에게 보여줘요');return;}
  if(c.type==='memo'){
    if(famRemain()<=0){famLimitSheet();return;}
    if(c.vc){memoSetTo(addMemo(c.k,c.text,true,false),c.to);save();vcRerender();openVcDay(c.k);toast('♥ 가족 메모를 남겼어요');return;}
    if(c.id){const m=memosOf(c.k).find(x=>x.id===c.id);if(m){m.text=c.text;m.shared=true;m.t=Date.now();memoSetTo(m,c.to);if(c.x)mdApply(m,c.x);pushEvent(other(),'memo',c.k,`♥ ${md(c.k)}에 메모를 남겼어요: "${firstLine(c.text).slice(0,24)}"`);}}
    else memoSetTo(addMemo(c.k,c.text,true,false,c.x),c.to);
    if(c.edit||!c.id){memoEdit=c.edit?null:memoEdit;memoText='';save();memoFinish(c.k,'♥ 가족 메모를 남겼어요');}
    else{save();render();openDay(c.k);toast('♥ 가족 메모로 바꿨어요');}
  }else if(c.type==='memo-edit'){
    const m=memosOf(c.k).find(x=>x.id===c.id);
    if(m){m.text=c.text;m.t=Date.now();memoSetTo(m,c.to);if(c.x)mdApply(m,c.x);if(c.notify)m.notify=true;else delete m.notify;}
    memoEdit=null;memoText='';save();memoFinish(c.k,c.notify?'고쳐서 가족에게 알렸어요':'조용히 고쳤어요');
  }else{
    if(famRemain()<=0){famLimitSheet();return;}
    famSendReqs(c.uid,c.dates||[c.k],c.want,c.msg,c.cc?c.others.map(m=>m.uid):[]).catch(e=>setTimeout(()=>toast(famReqErr(e)),1600));
    closeSheet();if(c.multi){vcSel.on=false;vcSel.dates=new Set();vcSel.msg='';vcRerender();}
    toast(`${c.name}에게 요청을 보냈어요${c.dates&&c.dates.length>1?` (${c.dates.length}일)`:''}${c.cc?' · 가족에게도 알렸어요':''}`);
  }
}
// v0.210 메모 그 자리에서 고치기: 펼침(줄 → 입력칸) · 접힘(입력칸 → 줄) · 끝나면 그 줄 살짝 반짝
function medOpenFx(){const c=document.querySelector('#sheet .mcard.medit');if(!c)return;const h=c.offsetHeight;c.style.overflow='hidden';
  const a=c.animate([{height:Math.min(h,52)+'px',backgroundColor:'rgba(0,0,0,0)'},{height:h+'px'}],{duration:320,easing:'cubic-bezier(.2,.9,.25,1)'});a.onfinish=a.oncancel=()=>{c.style.overflow='';};
  const b=c.querySelector('.meacts');if(b)b.animate([{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'none'}],{duration:260,delay:120,fill:'backwards'});}
function medCloseFx(done){const c=document.querySelector('#sheet .mcard.medit');if(!c||RMq()){done();return;}c.style.overflow='hidden';c.style.pointerEvents='none';
  const a=c.animate([{height:c.offsetHeight+'px'},{height:'52px',opacity:.6}],{duration:220,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});let ok=false;const go=()=>{if(ok)return;ok=true;done();};a.onfinish=go;setTimeout(go,260);}
function medDoneFx(id){try{if(RMq())return;const c=id?document.querySelector(`#sheet [data-act="memo-tap"][data-mid="${id}"]`):null;if(c)c.animate([{backgroundColor:'var(--acc-soft)'},{backgroundColor:'rgba(0,0,0,0)'}],{duration:800});}catch(e){}}
function memoCard(m,k){
  const own=m.by===role(),cls=m.shared?'fam':'my';
  if(memoEdit===m.id)return `<div class="mcard ${cls} medit" data-mid="${m.id}"><div class="medbox"><div class="merow"><input type="text" id="memoInput" class="${cls} medin" value="${esc(memoText)}" enterkeyhint="done" aria-label="메모 고치기"><button class="medok" data-act="memo-send" aria-label="저장"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button></div><div class="meacts"><a data-act="memo-copy">복사</a><a data-act="memo-cancel">취소</a></div></div></div>`;   // v0.210 그 자리에서 고치기 (아래 입력칸에 한 번 더 나오지 않음)
  const ex=(m.till?` · ~ ${md(m.till)}`:'')+(m.time?` · 🕐 ${tfmt(m.time)}${m.al!==undefined&&m.al!==''?` · 🔔 ${m.al==='10'?'10분 전':'정시'}`:''}`:'');
  return `<div class="mcard ${cls} ${m.color?'cl':''} ${m.todo&&m.done?'done':''} ${memoEdit===m.id?'sel':''}" ${m.color?`style="background:${esc(m.color)} !important"`:''} data-act="memo-tap" data-mid="${m.id}" data-hold="memo">
    ${m.todo?(m.srv?`<span class="mchk ro ${m.done?'on':''}" aria-label="${m.done?'가족이 완료함':'가족 할 일'}">${m.done?'✓':''}</span>`:`<button class="mchk ${m.done?'on':''}" data-act="memo-chk" data-mid="${m.id}" aria-label="완료">${m.done?'✓':''}</button>`):''}
    <div class="mt2"><span class="tx">${linkify(m.text,{click:true,fam:!!(m.shared&&m.by!==role())})}</span><div class="meta">${m.rep?'🔁 반복 · ':''}${m.shared?(isSolo()?'♥ 가족 메모':`<span class="who ${own?'me':''}">${esc(whoName(m.by))}</span>`)+' · ':(isSolo()?'':'나만 · ')}${rel(m.t)}${ex}</div></div>
 ${own&&!m.shared&&!m.rep&&!isSolo()?`<button class="conv" data-act="memo-conv" data-mid="${m.id}">♡ 가족에게</button>`:''}
  </div>`;
}
function memoSection(k){
  const vm=visibleMemos(k),fam=vm.filter(x=>x.shared),mine=vm.filter(x=>!x.shared);
  const tabs='';
  let body=(wlHas(k)?wlRowHtml(k):'')+perOn(k).filter(p=>p.k0!==k).map(p=>`<div class="mcard ${p.m.shared?'fam':'my'} per" data-act="per-open" data-k="${p.k0}" data-id="${esc(p.m.id)}"${p.m.srv?' data-srv="1"':''} style="--pc:${perMc(p.m)}"><div class="mt2"><span class="tx">${esc(perName(p.m))}</span><div class="meta">기간 · ${md(p.k0)} ~ ${md(p.m.till)}</div></div></div>`).join('')+fam.map(m=>memoCard(m,k)).join('')+mine.map(m=>memoCard(m,k)).join('');
  body+=boardOnDate(k).map(n=>`<div class="mcard ${n.shared?'fam':'my'}" data-act="open-board"><div class="mt2">📝 ${esc(piLabel(n))}<div class="meta">${cur.m+1}월 포스트잇 · 누르면 열려요</div></div></div>`).join('');
  // v0.155 빈 날 안내 글 없음 (입력칸만)
  if(!memoEdit)memoMode=role()==='host'?'my':'fam';   // 입력칸 한 줄 메모는 항상 나만 (가족에게는 "자세히"에서)
  const fm=memoMode==='fam';
  const bar=`<div class="ibar">

      ${fm?`<div class="note ${fm?'fam':''}">${fm?'♥ 가족 모두에게 보여요 · 알림이 가요':(wlOn()?'🔒 나만 볼 수 있어요 · 색 · 시간 · 가족 · 일지는 "자세히"에서':'🔒 나만 볼 수 있어요 · 색 · 할 일 · 시간 · 가족에게는 "자세히"에서')}</div>`:''}
      <div class="irow${memoEdit?' medim':''}">
        <input type="text" ${memoEdit?'disabled':'id="memoInput"'} class="${fm?'fam':'my'}" value="${memoEdit?'':esc(memoText)}" placeholder="${fm?'가족에게 남길 메모':isSolo()?'메모':'나만 보는 메모'}" enterkeyhint="send">
        <button class="send ${fm?'fam':'my'}" ${memoEdit?'disabled':'data-act="memo-send"'} aria-label="보내기">${ICON.send}</button><span class="flab">${fm?'가족에게 남길 메모':isSolo()?'메모':'나만 보는 메모'}</span>
      </div>
      ${role()==='guest'&&fm?`<div style="margin-top:6px">${usageHint()}</div>`:''}
      ${S.link&&fm&&famRemain()<=3?`<div class="usage-hint" style="margin-top:6px;text-align:center">${famRemTxt()}</div>`:''}
    </div>`;
  return `<div class="sec memsec"><div class="sec-t">메모<button class="mdet2 mplus" data-act="memo-detail" aria-label="자세히 쓰기"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v9M7.5 12h9"/></svg></button></div>${tabs}${body}${bar}</div>`;   // v0.155 입력칸도 메모 카드 안 · 자세히는 제목 줄 오른쪽
}
/* ---- 메모 자세히 (전체 화면): 색 · 할 일 · 시간/알림 · 나만/가족에게 ---- */
const MEMO_COL=['#fff1c4','#ffd9e4','#ffe0c7','#d6f5df','#d2f1ef','#d9ecff','#e8eaee'];   // 연보라는 가족 메모 색과 닮아서 뺌 (이미 칠한 메모는 그대로)
let mdDraft=null;
const mdApply=(m,x)=>{['color','todo','done','time','al','till','pc'].forEach(p=>{if(x[p]===undefined)delete m[p];else m[p]=x[p];});};
function mdPull(){const e=$('#mdText');if(e&&mdDraft)mdDraft.text=e.value;}
function openMemoDetail(k,id){
  const rm=rmemoOf(id);if(rm){mdDraft={k,id:'',rep:rm.id,text:rm.text,color:rm.color||'',todo:!!rm.todo,done:false,time:rm.time||'',al:rm.al||'',shared:false,rr:{md:rm.md,sh:(rm.sh||[]).slice(),miss:rm.miss||'skip'}};renderMemoDetail();return;}
  const m=id?memosOf(k).find(x=>x.id===id):null,i=$('#memoInput');
  mdDraft={k,id:m?m.id:'',text:m?m.text:(i?i.value:memoText)||'',color:m?(m.color||''):(S.lastMemoColor||''),todo:!!(m&&m.todo),done:!!(m&&m.done),time:(m&&m.time)||'',al:(m&&m.al)||'',till:(m&&m.till)||'',pc:(m&&(m.pc||(m.shared&&m.till&&m.color)))||'',shared:m?!!m.shared:role()!=='host'};
  renderMemoDetail();
}
function renderMemoDetail(){   // v0.158 새 모양 (시안 design/remain): 글 카드(메모 색) · 색 카드 · 줄 카드 · 나만/가족에게 C3
  const d=mdDraft,day=parse(d.k),host=role()==='host';
  openPage(`<div class="pg-h"><button class="bk" data-act="md-back" aria-label="뒤로">‹</button><b>메모</b><button class="ok${(d.text||'').trim()?'':' off'}" data-act="md-save">저장</button></div>
    <div class="pg-b np mdpg">
    <div class="pg-cap">${d.rep?'반복 메모':`${day.getMonth()+1}월 ${day.getDate()}일 (${DOW[day.getDay()]})`}</div>
    ${host&&!d.rr?`<div class="pg-sec pad mdshare"><div class="npseg"><button class="${d.shared?'':'on'}" data-act="md-share" data-v="0">나만</button><button class="${d.shared?'on':''}" data-act="md-share" data-v="1">가족에게${d.shared&&S.link?` <em class="mdleft">${famRemN()}건 남음</em>`:''}</button></div></div>`:''}
    <div class="pg-sec pad"><textarea id="mdText" class="mdtx" placeholder="메모를 입력하세요" style="background:${d.shared?'var(--fam-bg)':(d.color||'var(--surface)')};color:${!d.shared&&d.color?'#2a2418':'var(--fg)'}">${esc(d.text)}</textarea>
    <div class="lnkrow" id="mdLinks">${hasLink(d.text)?linkParts(d.text).filter(x=>x.u).map(x=>`<a class="lnk" data-act="lnk" data-u="${esc(linkUrl(x.u))}">🔗 링크</a>`).join(' '):''}</div></div>
    ${d.shared?(d.till?`<div class="pg-sec pad mdcol"><button class="${d.pc?'':'on'}" style="background:color-mix(in srgb,var(--fam) 38%,#fff)" data-act="md-pc" data-v="" aria-label="가족 색"></button>${MEMO_COL.map(c=>`<button class="${d.pc===c?'on':''}" style="background:${c}" data-act="md-pc" data-v="${c}" aria-label="띠 색"></button>`).join('')}</div>`:''):`<div class="pg-sec pad mdcol">${MEMO_COL.map(c=>`<button class="${d.color===c?'on':''}" style="background:${c}" data-act="md-col" data-v="${c}" aria-label="색"></button>`).join('')}</div>`}
    <div class="pg-sec">
      ${npRow('check','할 일',`<label class="sw"><input type="checkbox" id="mdTodo" ${d.todo?'checked':''}><i></i></label>`)}
      ${npRow('clock','시간',d.time?`${tpick('mdTime',d.time)}<button class="xbtn" data-act="md-notime" aria-label="시간 없애기">${npi('x',16)}</button>`:`<button class="xbtn tplus" data-act="md-settime" aria-label="시간 정하기">${npi('x',16)}</button>`,d.time?{cls:'mdtrow'}:{tap:1,act:'md-settime',cls:'mdtrow'})}
      ${d.time?npRow('bell','알림',`<div class="npseg sm">${[['','없음'],['0','정시'],['10','10분 전']].map(([v,l])=>`<button class="${d.al===v?'on':''}" data-act="md-al" data-v="${v}">${l}</button>`).join('')}</div>`):''}
      ${(host||d.shared)&&!d.rr&&!d.rep?npRow('calendar-days','기간 띠',d.till?`<span class="mdtill">~</span>${tpick('mdTill',d.till,'','date')}<button class="xbtn" data-act="md-notill" aria-label="기간 없애기">${npi('x',16)}</button>`:`<button class="xbtn tplus" data-act="md-settill" aria-label="기간 정하기">${npi('x',16)}</button>`,d.till?{cls:'mdtrow'}:{tap:1,act:'md-settill',cls:'mdtrow'}):''}
      ${host&&!d.shared&&!d.wl?npRow('repeat','반복',npVal(d.rr?esc(rrText(d.rr)):'안 함'),{tap:1,act:'md-rep'}):''}
    </div>
    ${d.rep?`<div class="pg-sec">${npRow('trash-2','반복 그만하기','',{tap:1,act:'rm-del',cls:'danger-row',attrs:` data-id="${esc(d.rep)}"`})}</div>`:''}
    ${wlOn()&&!d.id&&!wlHas(d.k)?`<div class="pg-sec">${npRow('file-text',esc(S.wlog.name?S.wlog.name+' 만들기':'일지 만들기'),npVal(''),{tap:1,act:'wl-new',attrs:` data-k="${d.k}"`})}</div>`:''}
    </div>`,'memodetail');
}
function mdSave(){
  mdPull();const d=mdDraft;if(!d)return;
  const text=(d.text||'').trim();if(!text){toast('메모를 적어주세요');return;}
  if(d.rr&&!d.shared){   // 🔁 반복 메모
    S.rmemos=Array.isArray(S.rmemos)?S.rmemos:[];let r=d.rep&&S.rmemos.find(x=>x.id===d.rep);
    if(!r){r={id:uid(),from:d.k.slice(0,8)+'01',t:Date.now()};S.rmemos.push(r);if(d.id){S.memos[d.k]=memosOf(d.k).filter(y=>y.id!==d.id);tidyMemos(d.k);}}
    Object.assign(r,{text,md:d.rr.md,sh:(d.rr.sh||[]).slice(),miss:d.rr.miss==='next'||d.rr.miss==='prev'?d.rr.miss:'skip'});['color','todo','time','al'].forEach(p=>{const v=p==='al'?(d.time&&d.al!==''?d.al:undefined):p==='todo'?(d.todo||undefined):(d[p]||undefined);if(v===undefined)delete r[p];else r[p]=v;});
    S.lastMemoColor=d.color||'';save();mdDraft=null;memoText='';memoEdit=null;closePage();memoFinish(d.k,`🔁 반복 메모 · ${rrText(r)}`);try{pushRemindersToNative();}catch(e){}return;
  }
  const tl=(!d.rr&&d.till&&d.till>d.k)?d.till:undefined;
  const x={till:tl,pc:(d.shared&&tl&&d.pc)||undefined,color:(!d.shared&&d.color)||undefined,todo:d.todo||undefined,done:(d.todo&&d.done)||undefined,time:d.time||undefined,al:(d.time&&d.al!=='')?d.al:undefined};
  const k=d.k,fam=d.shared,srv=!!S.link,isGuest=role()==='guest';
  const m=d.id?memosOf(k).find(y=>y.id===d.id):null;
  if(m){
    const becameFam=fam&&!m.shared;
    if(srv&&becameFam){if(famRemain()<=0){famLimitSheet();return;}openCfm({type:'memo',k,text,id:m.id,edit:true,x,pg:true});return;}
    if(srv&&fam&&m.shared&&text!==m.text){openCfm({type:'memo-edit',k,text,id:m.id,notify:false,x,pg:true});return;}
    m.text=text;m.shared=fam;m.t=Date.now();mdApply(m,x);
    if(becameFam)pushEvent(other(),'memo',k,`♥ ${md(k)}에 메모를 남겼어요: "${firstLine(text).slice(0,24)}"`);
    memoEdit=null;save();
  }else{
    if(fam&&srv){if(famRemain()<=0){famLimitSheet();return;}openCfm({type:'memo',k,text,x,pg:true});return;}
    if(fam&&isGuest&&limitInfo().remaining<=0){pendingSend={type:'fam',date:k,text};openLimitSheet('fam');return;}
    addMemo(k,text,fam,fam&&isGuest,x);
  }
  if(!fam)S.lastMemoColor=d.color||'';save();
  mdDraft=null;memoText='';closePage();memoFinish(k,fam?'♥ 가족 메모를 남겼어요':'🔒 나만 보는 메모를 남겼어요');
}
function openRrPick(){
  const d=mdDraft;if(!d)return;const day=parse(d.k).getDate(),r=d.rrDraft=d.rrDraft||Object.assign({md:day>28?-1:day,sh:[],miss:'skip'},d.rr||{});
  const b=(v,l)=>`<button class="${r.md===v?'on':''}" data-act="rr-md" data-v="${v}">${l}</button>`;
  openPop(`<div class="mh">반복<b>매달 언제?</b></div>
    <div class="mi" style="display:block"><div class="rrg">${Array.from({length:28},(_,i)=>b(i+1,i+1)).join('')}</div><div class="rrg rrl">${b(-1,'말일')}${b(-2,'말일 하루 전')}${b(-3,'말일 이틀 전')}</div></div>
    <div class="mi" style="display:block"><div class="pl2" style="margin-bottom:6px">근무 조건</div><div class="chips rrsh"><button class="${!r.sh.length?'on':''}" data-act="rr-sh" data-v="">상관없이</button>${S.types.filter(t=>t.k!==NONE_K&&!t.rest).map(t=>`<button class="${r.sh.includes(t.k)?'on':''}" data-act="rr-sh" data-v="${esc(t.k)}">${badge(t.k,'sm')}<span class="rrn">${esc(t.name)}</span></button>`).join('')}</div>
      ${r.sh.length?`<div class="pl2 rrmh">그날이 ${r.sh.length>2?'고른 근무가':esc(rrShTxt(r.sh))+(((rrShTxt(r.sh).slice(-1).charCodeAt(0)-0xAC00)%28)?'이':'가')} 아니면</div><div class="hseg rrmiss">${[['skip','건너뛰기'],['prev','앞당기기'],['next','미루기']].map(([v,l])=>`<button class="${(r.miss||'skip')===v?'on':''}" data-act="rr-miss" data-v="${v}">${l}</button>`).join('')}</div>`:''}</div>
    <div class="hint rrsum" style="padding:4px 16px 8px">${esc(rrText(r))}</div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="rr-off">반복 안 함</button><button class="btn grow" data-act="rr-ok">확인</button></div>`);
}
function compMenu(id){const x=(S.companyHols||[]).find(y=>y.id===id);if(!x)return;
  openPop(`<div class="mh compm">${x.kind==='memo'?'기념일':'휴무일'}<b>${esc(x.name)}</b></div>
    <div class="mi np" style="display:block"><div class="npseg"><button class="${x.kind!=='memo'?'on':''}" data-act="comp-kind" data-id="${x.id}" data-v="off">휴무</button><button class="${x.kind==='memo'?'on':''}" data-act="comp-kind" data-id="${x.id}" data-v="memo">메모만</button></div></div>
    <button class="mi" data-act="comp-ico" data-id="${x.id}">🎨 아이콘 바꾸기</button>
    <button class="mi" data-act="rem-open" data-id="${x.id}">🔔 알림<span class="mval">${x.rem.length?esc(remShort(x)):'없음'} ›</span></button>
    <button class="mi d" data-act="comp-del" data-id="${x.id}">🗑 삭제</button>
    <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);}
let mmMove=null;
function mmMoveTo(nk){const mv=mmMove;mmMove=null;if(!mv)return;const k=mv.k;if(!nk||nk===k)return;
  const m=memosOf(k).find(x=>x.id===mv.mid);if(!m)return;
  const tl0=m.till;if(tl0)m.till=addK(tl0,Math.round((parse(nk)-parse(k))/864e5));   // v0.233 기간 띠는 끝 날도 같이 옮김
  S.memos[k]=memosOf(k).filter(x=>x!==m);tidyMemos(k);(S.memos[nk]=S.memos[nk]||[]).push(m);save();render();if(sheetKey===k&&sheetMode==='day')openDay(k);
  toastUndo(`${md(nk)}로 옮겼어요`,()=>{if(tl0)m.till=tl0;S.memos[nk]=memosOf(nk).filter(x=>x!==m);tidyMemos(nk);(S.memos[k]=S.memos[k]||[]).push(m);save();render();if(sheetKey===k&&sheetMode==='day')openDay(k);});}
function openMemoMenu(mid){
  const rm=rmemoOf(mid);
  if(rm){openPop(`<div class="mh">반복 메모<b>${esc(firstLine(rm.text).slice(0,24))}</b></div><div class="hint" style="padding:6px 16px 0">${esc(rrText(rm))}</div>
    <button class="mi" data-act="rm-skip" data-id="${esc(rm.id)}">🚫 이 날만 빼기</button><button class="mi" data-act="rm-edit" data-id="${esc(rm.id)}">✏️ 반복 고치기</button><button class="mi d" data-act="rm-del" data-id="${esc(rm.id)}">🗑 반복 그만하기</button>
    <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);return;}
  const copyBtn=`<button class="mi" data-act="mm-copy" data-mid="${esc(mid)}">📋 복사</button>`;
  if(String(mid).startsWith('s:')){   // 서버에서 온 가족 메모: 누구나 복사, 방 주인은 지우기도
    const rm=famRemoteMemos(sheetKey).find(x=>x.id===mid);if(!rm)return;
    const host=!!(S.link&&S.link.role==='host');
    openPop(`<div class="mh">♥ 가족 메모 · ${esc(whoName(rm.by))}<b>${esc(firstLine(rm.text))}</b></div>
      ${copyBtn}
      ${host?`<button class="mi d" data-act="srvmm-del" data-sid="${esc(rm.sid)}">🗑 삭제</button>`:''}
      <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);return;
  }
  const k=sheetKey,m=memosOf(k).find(x=>x.id===mid);if(!m)return;
  const own=m.by===role(),host=role()==='host';
  if(!own&&!host){   // 남이 쓴 메모는 고칠 수 없지만 글은 복사할 수 있어요
    openPop(`<div class="mh">${m.shared?'♥ 가족 메모':'🔒 메모'}<b>${esc(firstLine(m.text))}</b></div>
      ${copyBtn}
      <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);return;
  }
  openPop(`<div class="mh">${m.shared?'♥ 가족 메모':'🔒 나만 보는 메모'}<b>${esc(firstLine(m.text))}</b></div>
    ${own?`<button class="mi" data-act="mm-edit" data-mid="${mid}">✏️ 고치기</button>`:''}
    ${copyBtn}
    ${own&&m.till?`<button class="mi" data-act="mm-edit" data-mid="${mid}">🗓 기간 띠<span class="mval">${md(k)} ~ ${md(m.till)} ›</span></button>`:''}
    ${own?`<button class="mi" data-act="mm-movepick" data-mid="${mid}">📅 날짜 옮기기<span class="mval">${md(k)} ›</span></button>`:''}
    ${own?(m.shared?`<button class="mi" data-act="mm-my" data-mid="${mid}">🔒 나만 보기로 바꾸기</button>`:`<button class="mi f" data-act="mm-fam" data-mid="${mid}">♥ 가족 메모로 바꾸기</button>`):''}
    <button class="mi d" data-act="mm-del" data-mid="${mid}">🗑 삭제</button>
    <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);
}

/* ---------- 날짜 시트 ---------- */
function openDay(k){
  if(sheetKey&&sheetKey!==k){tidyMemos(sheetKey);memoEdit=null;memoText='';}
  sheetKey=k;sheetMode='day';markSel(k);
  openSheet(dayHtml(k),true);
  dstripCenter();coachSoon();
}
// 날짜 창 내용 (옆으로 밀 때 옆 날짜를 미리 그리는 데도 씀 — 상태는 안 바꿈)
// v0.202 날짜 창을 가볍게 열기: 껍데기가 움직이는 동안엔 날짜 띠 7칸 · 날씨 카드는 같은 높이 빈 자리 → 도착하면 채움(dsFill)
let dsLite=false;   // v0.208 가볍게 열기 = 날짜 띠 7칸만 (날씨 카드는 처음부터 넣음 — 빈 자리였다가 나중에 뜨면 늦고 번쩍여 보였음)
const dsOffs=()=>dsLite?[-3,-2,-1,0,1,2,3]:Array.from({length:61},(_,j)=>j-30);
function dsFill(){
  const sh=$('#sheet');if(!sh||!sh.classList.contains('open'))return;
  const html=sheetMode==='day'&&sheetKey?dayHtml(sheetKey):sheetMode==='vcday'&&rqD.k?vcDayHtml(rqD.k):sheetMode==='mandy'&&manDayK?manDayHtml(manDayK):'';if(!html)return;
  const tp=document.createElement('template');tp.innerHTML=html;
  const st=sh.querySelector('#dstrip'),nst=tp.content.querySelector('#dstrip');
  if(st&&nst&&st.children.length<nst.children.length){st.innerHTML=nst.innerHTML;const on=st.querySelector('.dsi.on');if(on)st.scrollLeft=dsiX(st,on)+on.offsetWidth/2-st.clientWidth/2;}
  const ph=sh.querySelector('#wxDay.wxph'),nw=tp.content.querySelector('#wxDay')||tp.content.querySelector('.wxcard');
  if(ph){if(nw)ph.replaceWith(nw);else ph.remove();}
  setTimeout(()=>{try{if(sheetMode==='day'&&sheetKey&&wxOn()&&!wxPopFam){const k=sheetKey,h=wxDayPopHtml(k);if(h)wxPre={k,h,t:Date.now()};}}catch(e){}},250);   // 다음에 누를 큰 날씨 창은 미리 만들어 둠
}
let wxPre=null;
function dayHtml(k){
  const d=parse(k),base=baseShift(d),c=shiftOf(d),hol=holName(k)||compHol(k),ov=S.overrides[k];
  const isGuest=S.syncSettings.isGuestMode;
  const dayReqs=reqUniq(S.requests.filter(r=>r.date===k&&(!r.srv||r.dir==='in')).sort((a,b)=>b.t-a.t));
  const openReqs=dayReqs.filter(r=>r.st==='pending'||r.st==='hold');   // 날짜 창엔 답 안 한 요청만 (답한 건 요청함에)
  const reqHtml=openReqs.map(r=>reqCard(r)).join('');
  const dd=ddayHits(k);
  const strip=dsOffs().filter(i=>{const x=addDays(d,i),mm=x.getFullYear()*12+x.getMonth();return i===0||(mm>=MIN_M&&mm<=MAX_M);}).map(i=>{const x=addDays(d,i);const rq=rqRing(S.requests.filter(r=>r.date===fmt(x)&&(!r.srv||r.dir==='in')).map(r=>r.st==='applied'?{...r,st:'accepted'}:r));return `<button class="dsi ${i===0?'on':''}${fmt(x)===dsTK()?' td':''} ${rq}" data-act="day-go" data-k="${fmt(x)}"><small>${x.getDate()}일</small>${S.personal?`<span class="dnum">${DOW[x.getDay()]}</span>`:badge(shiftOf(x),'sm')}</button>`;}).join('');
  const head=`
      <div class="dtop"><button data-act="close">‹ 달력</button></div>
      <div class="dfh"><button class="ib" data-act="day-go" data-k="${fmt(addDays(d,-1))}" aria-label="전날">‹</button>
        <div class="dft"${dsTgo(k,'day-go')}><b class="${hol?'hl':''}">${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]})</b><small>${persOn(k)?(hol?`<span class="hl">${esc(hol)}</span>`:''):esc(shiftLabel(c))}${hol&&!persOn(k)?` · <span class="hl">${esc(hol)}</span>`:''}${dd.map(x=>` · ${ico(x.emoji||'⭐')} ${esc(x.name)}`).join('')}${dsTdy(k)}</small>${dsHint(k)}</div>
        <button class="ib" data-act="day-go" data-k="${fmt(addDays(d,1))}" aria-label="다음날">›</button></div>
      <div class="dstrip" id="dstrip">${strip}</div>`;
  let topPart='';
  if(isGuest){
    const canAsk=!dayReqs.some(r=>r.st==='pending'||r.st==='accepted');
    const wantBtns=S.types.slice(0,quickN()).map(x=>x.k).map(s=>`<button class="${reqDraft.want===s?'on':''}" data-act="rqwant" data-s="${esc(s)}">${badge(s,'sm')}${esc(shiftLabel(s))}</button>`).join('');
    topPart=`
      <div class="card" style="padding:14px; margin-bottom:6px; text-align:center; font-size:16px; font-weight:700; background:var(--bg); border:1px solid var(--line);">
         ${badge(c,'sm','')} <span style="vertical-align:middle;margin-left:6px">${esc(shiftLabel(c))}</span>
      </div>
      <div class="lbl" style="color:var(--accent);">📩 근무 변경 요청</div>
      ${reqHtml}
      ${canAsk?`
        <div class="seg" style="margin-top:6px;">${wantBtns}</div>
        <textarea id="rqm" placeholder="요청 메시지 (예: 장모님 생신이라 쉬면 좋겠어요)" style="margin-top:8px;min-height:60px">${esc(reqDraft.msg)}</textarea>
        <div class="row" style="margin-top:10px">${usageHint()}<span class="grow"></span><button class="btn sm" data-act="rqsend">요청 보내기</button></div>
      `:'<div class="hint">이미 진행 중인 요청이 있어서 새 요청은 답을 받은 뒤에 보낼 수 있어요.</div>'}`;
  }else{
    const famOthers=visibleMemos(k).filter(m=>m.shared&&m.by!=='host');
    const warn=famOthers.length?`<div class="family-warning-box" style="border-color:var(--fam);background:var(--fam-bg)"><b style="color:var(--fam)">♥ 가족 메모가 있는 날이에요</b><p>"${esc(firstLine(famOthers[0].text))}"</p></div>`:'';
    const quick=S.types.slice(0,quickN());if(!quick.some(x=>x.k===c)&&S.types.some(x=>x.k===c))quick.push(typeOf(c));
    const shiftBtns=quick.map(x=>`<button class="tchip ${c===x.k?'on':''}" data-act="setshift" data-s="${esc(x.k)}">
        ${badge(x.k,'tc')}<small>${esc(x.name)}</small>${ov&&x.k===base?'<i class="orig">원래</i>':''}</button>`).join('');
    topPart=persOn(k)?'':`
      <div class="sec shsec${shiftOpenNow()?' open':''}">
        <div class="sh-hd"><span>근무</span><button class="sh-pill" data-act="shift-tog" aria-label="근무 접기 · 펼치기">${badge(c,'sm','')}<span class="shl">${esc(shiftLabel(c))}</span>${ov?'<em>· 바뀜</em>':''}${otNote(k,c)}<i class="shc"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></i></button></div>
        <div class="sh-body"><div class="sh-card">
        <div class="tchips">${shiftBtns}${S.types.length>quick.length?'<button class="tchip add" data-act="type-more"><span class="badge tc add">＋ 더보기</span></button>':''}${otChip(k,c)}</div>
        ${ov?`<div class="hint" style="margin:6px 0 0">원래 근무: ${esc(shiftLabel(base))} · <a data-act="resetshift">되돌리기</a></div>`:''}
        <button class="paint-btn" data-act="paint-open" data-k="${esc(c)}">${npi('paintbrush',18)}<b>여러 날 칠하기</b><i>›</i></button>
        </div></div>
      </div>${openReqs.length?`<div class="lbl" style="color:var(--accent);margin-top:12px;">📩 이 날의 근무 요청</div>${reqHtml}`:''}`;
    topPart+=``;   /* v0.176 가족 메모 띠(warn) 뺌 — 아래 메모 목록에 같은 메모가 "아내" 표시로 있음 (\x01 = 위 · 아래 나눔 표시는 그대로) */
  }
  // 순서: 근무 타입 → 대기 중인 요청 → 날씨 → (가족 메모 알림) → 메모
  const [tp1,tp2]=topPart.split('');
  return `${head}<div class="dsbody">${tp1}${wxDayHtml(k)}${tp2||''}${memoSection(k)}</div>`;   // v0.155 아래쪽 = 회색 바탕 + 흰 카드
}

/* ⏱ 연장 = 그날 실제 출근 · 퇴근 (근무 통계를 켠 사람 · 근무 날만). 바꾼 시각은 가족 탭 "몇 시 끝" · 가족 폰 · 날씨 · 통계에 쓰임
 * 근무 종류 · 대근 횟수 · 알람은 그대로 · 미래 날짜도 됨(미리 신청) · 달력 칸에는 표시 안 함 */
const otOn=(k,c)=>ad('stats')&&S.myset&&!isRest(c)&&!persOn(k);
const fmtH=h=>`${Math.round(h*10)/10}시간`;
function otChip(k,c){
  if(!otOn(k,c))return '';const h=S.ot[k]?dayHours(parse(k)):null;
  return `<button class="tchip otc ${S.ot[k]?'on':''}" data-act="ot-open" data-k="${k}"><span class="badge tc otb">⏱</span><small>${h&&h.req?'+'+fmtH(h.req):'연장'}</small></button>`;
}
function otNote(k,c){if(!otOn(k,c)||!S.ot[k])return '';const h=dayHours(parse(k));return h&&h.req?`<em>· 연장 ${fmtH(h.req)}</em>`:'';}
let otKey='';
function otOpen(k){
  otKey=k;const d=parse(k),sh=shiftOf(d),t=timesOf(sh),o=S.ot[k]||[t.start,t.end],h=dayHours(d)||{req:0,reqN:0};
  openPop(`<div class="mh">${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]}) · ${esc(shiftLabel(sh))}<b>⏱ 연장 · 실제 출퇴근</b></div>
    <div class="mi" style="display:block;padding-top:6px">
      <div class="prow" style="padding:6px 0"><div class="pl2">원래</div><span class="muted">${t.start} → ${t.end}</span></div>
      <div class="prow" style="padding:6px 0"><div class="pl2">실제 출근</div>${tpick('otS',o[0])}</div>
      <div class="prow" style="padding:6px 0"><div class="pl2">실제 퇴근</div>${tpick('otE',o[1])}</div>
      <div class="chips left" style="margin:6px 0 4px">${[1,2,3,4].map(n=>`<button data-act="ot-add" data-v="${n}">+${n}시간</button>`).join('')}</div>
      <div class="otsum">${h.req?`연장 <b>${fmtH(h.req)}</b>${h.reqN?` · 그중 야간 ${fmtH(h.reqN)}`:''}`:'원래 시간 그대로예요'}</div>
    </div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="ot-clear">없음 (원래대로)</button><button class="btn grow" data-act="pop-close">확인</button></div>`);
}
// +n시간: 지금 적힌 퇴근에서 n시간 더 (누를 때마다 쌓임 · +4 두 번 = +8)
function otAdd(n){if(!otKey)return;const d=parse(otKey),t=timesOf(shiftOf(d)),o=(S.ot[otKey]||[t.start,t.end]).slice();o[1]=m2tm(tm2m(o[1])+n*60);otSet(o);}
function otSet(o){
  const d=parse(otKey),t=timesOf(shiftOf(d));
  if(o[0]===t.start&&o[1]===t.end)delete S.ot[otKey];else S.ot[otKey]=o;
  save();otAfter();otOpen(otKey);
}
function otAfter(){try{if(sheetKey&&$('#sheet').classList.contains('open'))openDay(sheetKey);}catch(e){}famSoon();}
/* 날짜 창 근무타입 접기: 처음엔 접힘(불규칙 근무표는 날마다 넣으니 펼침) · 열면 앱을 쓰는 동안 그대로 · 앱을 나가고 5분 지나면 다시 접힘 (저장 안 함) */
let shiftOpen=null,shiftHidAt=0;
const shiftOpenNow=()=>shiftOpen===null?!!S.noPat:shiftOpen;
document.addEventListener('visibilitychange',()=>{if(document.hidden)shiftHidAt=Date.now();else{if(shiftHidAt&&Date.now()-shiftHidAt>5*60*1000)shiftOpen=null;shiftHidAt=0;}});
/* ---------- 근무타입 고르기 / 편집 ---------- */
let typeReturn='day';
function afterType(){if(typeReturn==='time'){closeSheet();if(pageMode==='wx')openWxPage();else render();return;}if(typeReturn==='page'){closeSheet();openPatternPage();}else openDay(sheetKey);}   // 'time': 가족 탭 · 날씨 설정에서 바로 연 편집 창 → 저장하면 원래 화면으로
function applyShift(s){
  closePop();
  const d=parse(sheetKey);
  if(s===baseShift(d))delete S.overrides[sheetKey];else S.overrides[sheetKey]=s;
  save();render();openDay(sheetKey);
}
function goDay(k,quiet){
  const d=parse(k),v=d.getFullYear()*12+d.getMonth();if(v<MIN_M||v>MAX_M)return;
  memoEdit=null;memoText='';
  if(d.getFullYear()!==cur.y||d.getMonth()!==cur.m){cur={y:d.getFullYear(),m:d.getMonth()};render();}
  if(!quiet)buzz(6);openDay(k);
}
// 옆으로 밀면 전날 · 다음날 (v0.109): 날짜 창 · 스티커 창 · 업무 메모 창 · 날씨 팝업
// 사진 넘기듯 — 창 틀은 그대로, 안 내용과 옆 날짜 내용이 붙은 채로 손가락을 따라 움직이고, 놓으면 스프링으로 자리 잡음
// (touch-action: pan-y 로 폰이 옆 동작을 가져가지 않게 · 옆으로 밀어 보는 곳 · 쓰는 중인 글 칸은 빼고)
let dsw=null;
const SW_SKIP='.dstrip,.tchips,input,select,[contenteditable],.wxhs,.stk-row,.noswipe';
const swReduce=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
function swTarget(t){
  if(!t.closest||t.closest(SW_SKIP))return null;
  const ta=t.closest('textarea');if(ta&&document.activeElement===ta)return null;   // 쓰는 중인 칸은 그대로 (안 쓰는 칸은 밀 수 있음)
  if(sheetMode==='day'&&sheetKey&&t.closest('#sheet.open'))return {w:'day',el:$('#sheet')};
  if(sheetMode==='mandy'&&manDayK&&t.closest('#sheet.open'))return {w:'man',el:$('#sheet')};
  if(sheetMode==='vcday'&&rqD.k&&t.closest('#sheet.open'))return {w:'vc',el:$('#sheet')};
  const pop=t.closest('#pop.open');if(!pop||pop.classList.contains('wxfull'))return null;
  if(wlEd&&!wlEd.ren&&pop.classList.contains('wl-pop'))return {w:'wl',el:pop.querySelector('.wlp')};
  const m=pop.querySelector('.menu.sdpop');if(m&&stDayK)return {w:'sd',el:m};
  const x=pop.querySelector('.menu.wxdpop');if(x&&wxPopK)return {w:'wx',el:x};
  return null;
}
// v0.139 업무 메모 창은 옆으로 넘기면 적어 둔 날로만 건너뜀 (빈 날은 안 보임 · 1년 안)
const swNext=(w,dir)=>{const k0=swKey(w);if(w!=='wl')return addK(k0,dir);for(let i=1;i<=366;i++){const k=addK(k0,dir*i);if(wlHas(k))return k;}return null;};
const swKey=w=>w==='vc'?rqD.k:w==='man'?manDayK:w==='day'?sheetKey:w==='wl'?wlEd&&wlEd.k:w==='sd'?stDayK:wxPopK;
// 옆 날짜 내용(상태는 안 바꿈)
function swHtml(w,k){
  if(!okDate(k))return null;
  try{
    if(w==='day'){const me=memoEdit,mt=memoText;memoEdit=null;memoText='';const h=dayHtml(k);memoEdit=me;memoText=mt;return h;}
    if(w==='wl')return wlInner({k,ren:false});
    if(w==='sd')return stampDayHtml(k);
    if(w==='man')return manDayHtml(k);
    if(w==='vc')return vcDayHtml(k);
    if(w==='wx'){const z=wxDz,h=wxDayPopHtml(k);wxDz=z;if(!h)return null;const t=document.createElement('div');t.innerHTML=h;const m=t.querySelector('.menu');return m?m.innerHTML:h;}
  }catch(e){}
  return null;
}
// 진짜로 넘기기 (새 날짜로 다시 그림)
function swGo(w,dir){
  const k=swNext(w,dir);if(!k||!okDate(k))return false;
  if(w==='day'){goDay(k,true);return true;}   // 밀어서 넘길 땐 진동 없음
  if(w==='wl'){wlCommitInputs();wlEd={k,ren:false};renderWl(false);return true;}
  if(w==='sd'){openStampDay(k,true);return true;}
  if(w==='man'){manGo(k,true);return true;}
  if(w==='vc'){vcGo(k,true);return true;}
  if(w==='wx'){const m=$('#pop .menu.wxdpop'),h=m&&wxDayPopHtml(k);if(m&&h){wxPopK=k;m.innerHTML=`<div class="swc" style="position:relative;transform:translateZ(0)">${h}</div>`;wxHrScroll();if(/class="wxweb"/.test(h)){hintBump('wxweb');save();}return true;}wxOpenDay(k);return true;}   // v0.130 틀(.menu)은 그대로 · 안 내용만 (틀을 새로 만들면 그림 풀기 전 하얗게 깜빡임)
  return false;
}
// 끌기 시작: 안 내용을 판(.swc) 하나로 감싸고, 옆 날짜 판을 바로 옆에 붙임
let swQuiet=0;   // 판을 옮기는 동안(+조금) 날짜 띠 scroll 은 사용자가 민 게 아님
const swKeepX=el=>{const a=[...el.querySelectorAll('.dstrip,.tchips,.wxhs')].map(x=>[x,x.scrollLeft]);return ()=>a.forEach(([x,v])=>{if(x.scrollLeft!==v)x.scrollLeft=v;});};
function swWrap(st){
  swQuiet=performance.now();const keep=swKeepX(st.el);
  const el=st.el,cs=getComputedStyle(el),flex=cs.display==='flex';
  // v0.133 이미 판(.swc) 하나로 감싸져 있으면(날씨 팝업) 그대로 씀 — 내용을 새 판으로 옮기면 폰이 다시 그리는 한 프레임 동안 비어 보였음(커버 화면 녹화)
  const only=el.children.length===1&&el.firstElementChild.classList.contains('swc')&&!el.firstElementChild.classList.contains('swn')?el.firstElementChild:null;
  const cur=only||document.createElement('div');st.keepCur=!!only;
  if(!only){cur.className='swc';while(el.firstChild)cur.appendChild(el.firstChild);el.appendChild(cur);}
  keep();
  st.cur=cur;st.prevPos=el.style.position;st.prevOx=el.style.overflowX;
  if(cs.position==='static')el.style.position='relative';
  st.prevTr=el.style.transition;
  el.style.overflowX='hidden';
  if(flex){cur.style.cssText='display:flex;flex-direction:column;height:100%;min-height:0';}
  st.flex=flex;st.W=el.clientWidth||el.getBoundingClientRect().width||360;
}
function swSide(st,dir){   // dir: 1 = 다음날(오른쪽에 붙음) · -1 = 전날(왼쪽)
  if(st.nb&&st.dir===dir)return;
  if(st.nb){st.nb.remove();st.nb=null;}
  st.dir=dir;const nk=swNext(st.w,dir),h=nk?swHtml(st.w,nk):null;if(h==null)return;
  const nb=document.createElement('div');nb.className='swc swn';nb.innerHTML=h;nb.querySelectorAll('[id]').forEach(x=>{x.dataset.swid=x.id;x.removeAttribute('id');});   // 옆 판엔 같은 id 없게 (v0.136 넘긴 뒤 그 판을 그대로 쓰면 되살림)
  const cs=getComputedStyle(st.el),pl=parseFloat(cs.paddingLeft)||0,pr=parseFloat(cs.paddingRight)||0,pt=parseFloat(cs.paddingTop)||0;   // 창 안쪽 여백만큼 비켜서 (옆 판이 더 크게 보였다 줄어드는 것 막기)
  nb.style.cssText=`position:absolute;left:${pl}px;top:${(st.el.scrollTop||0)+pt}px;width:${st.el.clientWidth-pl-pr}px;${st.flex?'display:flex;flex-direction:column;height:100%;':''}pointer-events:none`;
  st.el.appendChild(nb);st.nb=nb;
  nb.querySelectorAll('.wlta').forEach(x=>{x.readOnly=true;x.tabIndex=-1;wlGrow(x);});
  if(st.w==='wx')wxHrScroll(nb);   // v0.132 시간별 줄을 미리 제자리로 (넘긴 뒤 툭 바뀌지 않게)   // 업무 메모 칸 높이도 미리 맞춤 (넘어간 뒤 칸이 늘어나는 것 막기)
  const ds=nb.querySelector('.dstrip'),on=ds&&ds.querySelector('.dsi.on');if(on)ds.scrollLeft=dsiX(ds,on)+on.offsetWidth/2-ds.clientWidth/2;   // 옆 날짜의 날짜 띠도 가운데 맞춤 (도착해서 툭 안 바뀌게)
  // v0.121 창 높이도 미리: 옆 날짜 판의 높이를 재서, 미는 만큼 창 높이를 그쪽으로 (도착한 뒤 높이가 툭 바뀌지 않게)
  st.h0=st.h0||st.el.getBoundingClientRect().height;st.h1=null;
  if(!st.flex&&!st.el.classList.contains('full')){const pb=parseFloat(cs.paddingBottom)||0,bt=(parseFloat(cs.borderTopWidth)||0)+(parseFloat(cs.borderBottomWidth)||0),mx=parseFloat(cs.maxHeight);
    let h=nb.getBoundingClientRect().height+pt+pb+bt;if(mx>0)h=Math.min(h,mx);if(h>0&&Math.abs(h-st.h0)>1)st.h1=h;}
}
function swHeight(st,p){if(st.h1==null||!st.h0)return;st.el.style.height=(st.h0+(st.h1-st.h0)*Math.max(0,Math.min(1,p))).toFixed(1)+'px';}
function swMove(st,dx){
  const W=st.W,lim=!st.nb?dx*0.3:dx;   // 옆 날짜가 없으면(끝) 고무줄처럼 조금만
  st.cur.style.transform=`translateX(${lim}px)`;
  if(st.nb)st.nb.style.transform=`translateX(${st.dir*W+lim}px)`;
  if(st.nb)swHeight(st,Math.abs(lim)/W);else if(st.h0&&st.el.style.height)st.el.style.height=st.h0+'px';
}
function swUnwrap(st){
  const el=st.el;if(st.nb){st.nb.remove();st.nb=null;}
  swQuiet=performance.now();const keep=swKeepX(el);
  if(st.cur&&st.cur.parentNode===el){if(st.keepCur){st.cur.style.transition='';st.cur.style.transform='translateZ(0)';}else{while(st.cur.firstChild)el.insertBefore(st.cur.firstChild,st.cur);st.cur.remove();}}
  keep();
  el.style.position=st.prevPos||'';el.style.overflowX=st.prevOx||'';if(el.scrollLeft)el.scrollLeft=0;
  if(st.h0){el.style.height='';el.style.transition=st.prevTr||'';}
}
let swPend=null;   // 넘어가는/제자리로 돌아가는 중인 마무리 (그 사이 또 밀면 바로 끝내고 새로 받음)
function swFlush(){const f=swPend;swPend=null;if(f){clearTimeout(f.tm);f.run();}}
function swLater(run,ms){const f={run};f.tm=setTimeout(()=>{if(swPend===f)swPend=null;run();},ms);swPend=f;}
document.addEventListener('pointerdown',e=>{
  let tg=e.target;
  if(swPend){swFlush();if(!tg.isConnected)tg=document.elementFromPoint(e.clientX,e.clientY)||tg;}   // 앞 넘김을 바로 끝냄 → 새 화면 기준으로 받음
  const t=swTarget(tg);dsw=t&&t.el?{...t,x:e.clientX,y:e.clientY,t0:performance.now(),on:false,dead:false}:null;});
document.addEventListener('pointermove',e=>{
  if(!dsw||dsw.dead)return;const dx=e.clientX-dsw.x,dy=e.clientY-dsw.y;
  if(!dsw.on){
    if(Math.abs(dy)>12&&Math.abs(dy)>=Math.abs(dx)){dsw.dead=true;return;}   // 세로 = 스크롤
    if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)){dsw.on=true;if(!swReduce())swWrap(dsw);}
    else return;
  }
  (dsw.pts||(dsw.pts=[])).push([e.clientX,performance.now()]);if(dsw.pts.length>8)dsw.pts.shift();   // 마지막 움직임 (빠르기 재기)
  if(swReduce())return;
  swSide(dsw,dx<0?1:-1);swMove(dsw,dx);
});
const swEnd=e=>{
  if(!dsw)return;const st=dsw;dsw=null;if(!st.on)return;
  const dx=(e&&e.clientX!=null?e.clientX:st.x)-st.x;
  held=true;setTimeout(()=>{held=false;},60);
  const now=performance.now(),ps=(st.pts||[]).filter(q=>now-q[1]<=120),q0=ps[0]||[st.x,st.t0],v=Math.abs((st.x+dx)-q0[0])/Math.max(now-q0[1],16);
  const flick=Math.abs(dx)>=24&&v>0.3&&Math.sign((st.x+dx)-q0[0])===Math.sign(dx);   // 짧아도 마지막에 빠르게 튕기면 넘김
  const go=(Math.abs(dx)>=50||flick)&&!(e&&e.type==='pointercancel'),dir=dx<0?1:-1;
  if(swReduce()||!st.cur){if(go)swGo(st.w,dir);return;}
  const SPRING='transform .34s cubic-bezier(.22,1.18,.36,1)';
  if(!go||!st.nb){   // 덜 밀었거나 끝 → 스프링으로 제자리
    st.cur.style.transition=SPRING;st.cur.style.transform='';
    if(st.nb){st.nb.style.transition=SPRING;st.nb.style.transform=`translateX(${st.dir*st.W}px)`;}
    if(st.h1!=null&&st.el.style.height){st.el.style.transition='height .3s ease';st.el.style.height=st.h0+'px';}
    swLater(()=>swUnwrap(st),360);return;
  }
  // 넘김: 지금 판은 밀던 쪽으로 빠지고, 옆 날짜 판이 스프링으로 자리 → 다 오면 진짜 그 날짜로 다시 그림(같은 모양이라 티 안 남)
  st.cur.style.transition=SPRING;st.cur.style.transform=`translateX(${-st.dir*st.W}px)`;
  st.nb.style.transition=SPRING;st.nb.style.transform='translateX(0)';
  if(st.h1!=null){st.el.style.transition='height .26s ease';st.el.style.height=st.h1+'px';}
  swLater(()=>{if(st.w==='wx'&&swAdoptWx(st))return;if(st.w==='day'&&swAdoptDay(st))return;if((st.w==='man'||st.w==='vc')&&swAdoptFam(st))return;swUnwrap(st);if(swGo(st.w,st.dir)&&(st.w==='day'||st.w==='vc')){const sh=$('#sheet');if(sh)sh.scrollTop=0;}},300);
};
// v0.136 날짜 창도 날씨 팝업처럼: 넘긴 뒤 창 전체를 다시 그리지 않고, 밀면서 그려 둔 옆 날짜 판을 그대로 씀 (깜빡임 · 다시 그리는 시간 없음)
function swAdoptDay(st){
  try{
    const k=addK(sheetKey,st.dir),nb=st.nb,el=st.el;if(!nb||!okDate(k)||sheetMode!=='day')return false;
    const d=parse(k),v=d.getFullYear()*12+d.getMonth();if(v<MIN_M||v>MAX_M)return false;
    const r0=dataRev;tidyMemos(sheetKey);memoEdit=null;memoText='';
    st.nb=null;if(st.cur){st.cur.remove();st.cur=null;}
    el.style.position=st.prevPos||'';el.style.overflowX=st.prevOx||'';if(el.scrollLeft)el.scrollLeft=0;if(st.h0){el.style.height='';el.style.transition=st.prevTr||'';}
    nb.classList.remove('swn');Object.assign(nb.style,{position:'relative',left:'',top:'',width:'',pointerEvents:'',transition:'',transform:'translateZ(0)'});
    nb.querySelectorAll('[data-swid]').forEach(x=>{x.id=x.dataset.swid;delete x.dataset.swid;});
    sheetKey=k;
    const mk=cur.y*12+cur.m,changed=dataRev!==r0;
    if(v!==mk){if(changed||!(Math.abs(v-mk)===1&&calShiftFast(v-mk)))cur={y:Math.floor(v/12),m:v%12};render();}else if(changed)render();
    markSel(k);el.scrollTop=0;dstripCenter();coachSoon();
    return true;
  }catch(e){return false;}
}
// v0.142 유찬(man) · 가족(vc) 날짜 창도 넘긴 뒤 그려 둔 옆 판 그대로 (달이 바뀌면 뒤의 달력만 새 달로)
function swAdoptFam(st){
  try{
    const w=st.w,k=addK(swKey(w),st.dir),nb=st.nb,el=st.el;if(!nb||!okDate(k))return false;
    const d=parse(k),v=d.getFullYear()*12+d.getMonth();if(v<MIN_M||v>MAX_M)return false;
    let p=null;if(w==='vc'){p=famPeers().find(x=>x.uid===vcUid);if(!p)return false;}else if(!manMember())return false;
    st.nb=null;if(st.cur){st.cur.remove();st.cur=null;}
    el.style.position=st.prevPos||'';el.style.overflowX=st.prevOx||'';if(el.scrollLeft)el.scrollLeft=0;if(st.h0){el.style.height='';el.style.transition=st.prevTr||'';}
    nb.classList.remove('swn');Object.assign(nb.style,{position:'relative',left:'',top:'',width:'',pointerEvents:'',transition:'',transform:'translateZ(0)'});
    nb.querySelectorAll('[data-swid]').forEach(x=>{x.id=x.dataset.swid;delete x.dataset.swid;});
    if(w==='man')manDayK=k;else if(rqD.k!==k||rqD.u!==p.uid)rqD={k,u:p.uid,want:((p.sch.types||[]).find(x=>x.rest)||{k:'휴'}).k};
    if(d.getFullYear()!==vcY||d.getMonth()!==vcM){vcY=d.getFullYear();vcM=d.getMonth();if(w==='man')renderManCalPage();else vcRerender();}
    el.scrollTop=0;
    if(w==='man')dstripCenter(x=>manGo(x,true),()=>manDayK);else dstripCenter(x=>vcGo(x,true),()=>rqD.k);
    return true;
  }catch(e){return false;}
}
// v0.131 날씨 팝업: 넘긴 뒤 다시 그리지 않고, 밀면서 이미 그려 둔 옆 날짜 판(그림까지 다 풀린 것)을 그대로 씀 → 새 그림을 푸는 한 프레임 동안 하얗게 깜빡이던 것
function swAdoptWx(st){
  try{
    const k=addK(swKey('wx'),st.dir),nb=st.nb,m=st.el;if(!nb||!okDate(k)||!m.classList.contains('wxdpop'))return false;
    if(!wxDayPopHtml(k))return false;   // 미세먼지 자료(wxDz) 등 상태만 새 날짜로
    // v0.132 옆 날짜 판(이미 화면에 그려진 층)을 그대로 남기고 옛 판만 지움 — 내용을 다른 곳으로 옮기면 폰이 다시 그리는 한 프레임 동안 글 · 그림이 비어 보였음(커버 화면 녹화로 확인)
    st.nb=null;if(st.cur){st.cur.remove();st.cur=null;}
    m.style.position=st.prevPos||'';m.style.overflowX=st.prevOx||'';if(st.h0){m.style.height='';m.style.transition=st.prevTr||'';}
    nb.classList.remove('swn');Object.assign(nb.style,{position:'relative',left:'',top:'',width:'',pointerEvents:'',transition:'',transform:'translateZ(0)'});
    wxPopK=k;m.scrollTop=0;   // 팝업이 화면보다 길면(커버 화면) 옆 판은 맨 위부터 보였음 → 넘긴 뒤에도 맨 위
    if(m.querySelector('.wxweb')){hintBump('wxweb');save();}
    return true;
  }catch(e){return false;}
}
document.addEventListener('pointerup',swEnd);
document.addEventListener('pointercancel',swEnd);
// v0.205 옆으로 넘기는 동안엔 폰 브라우저의 끌기(스크롤 · 튕김)를 막음 — 안 막으면 넘긴 뒤 첫 탭을 '튕김 멈추기'로 먹어서 한 번 더 눌러야 했음
document.addEventListener('touchmove',e=>{if(dsw&&dsw.on&&e.cancelable)e.preventDefault();},{passive:false,capture:true});
// 3일 띠: 가운데에 오늘 고른 날 · 옆으로 밀면 따라 움직이고, 멈췄을 때 가운데에 온 날로 이동
const dsiX=(el,on)=>on.offsetParent===el.offsetParent?on.offsetLeft-el.offsetLeft:on.offsetLeft;   // v0.136 날짜 띠 안에서의 자리 (넘긴 뒤 판(.swc)이 기준이 되어도 같게)
function dstripCenter(goFn,curK){   // goFn: 가운데 온 날로 이동 (기본 = 내 날짜 창) · curK: 지금 날짜
  goFn=goFn||goDay;curK=curK||(()=>sheetKey);
  const el=document.getElementById('dstrip');if(!el)return;
  const go=()=>{const on=el.querySelector('.dsi.on');if(on)el.scrollLeft=dsiX(el,on)+on.offsetWidth/2-el.clientWidth/2;};
  go();requestAnimationFrame(go);
  let tm=null;
  el.addEventListener('scroll',()=>{
    clearTimeout(tm);
    tm=setTimeout(()=>{
      const kids=el.children,w=kids[0]?kids[0].offsetWidth:el.clientWidth/7;
      const i=Math.max(0,Math.min(kids.length-1,Math.round((el.scrollLeft+el.clientWidth/2)/w-.5))),k=kids[i]&&kids[i].dataset.k;
      if(dsw||performance.now()-swQuiet<600)return;   // 옆으로 밀어 넘기는 중 생긴 scroll 은 무시
      if(!el.isConnected||!el.closest('#sheet.open,#page.open'))return;   // v0.138 닫힌 창 안의 날짜 띠가 화면 폭이 바뀌며 움직인 건 무시 (닫자마자 다시 열리던 것)
      if(k&&k!==curK()){held=true;setTimeout(()=>{held=false;},50);goFn(k);}
    },140);
  },{passive:true});
}
function openTypeMore(){
  openPop(`<div class="mh">근무타입<b>어떤 근무로 할까요?</b></div>
    <div class="mi"><div class="tchips">${S.types.map(x=>`<button class="tchip ${shiftOf(parse(sheetKey))===x.k?'on':''}" data-act="setshift" data-s="${esc(x.k)}">${badge(x.k,'tc')}<small>${esc(x.name)}</small></button>`).join('')}</div></div>
    <div class="mi"><button class="btn ghost grow" data-act="pop-close">닫기</button></div>`);
}
function openTypePick(){
  const have=new Set(S.types.map(x=>x.k));
  const groups=PRESETS.map(g=>{
    const items=g.items.filter(([k])=>!have.has(k));
    if(!items.length)return '';
    return `<div class="pk-g"><span>${g.group}</span></div>`+items.map(([k,name,sub])=>
      `<button class="pk-i" data-act="type-preset" data-k="${esc(k)}" data-name="${esc(name)}" data-rest="${g.rest?1:0}" data-q="${esc(name+(sub||'')+k)}">${esc(name)}${sub?` <small>(${esc(sub)})</small>`:''}</button>`).join('');
  }).join('');
  openSheet(`
    <div class="sh-head">
      <button class="ib" data-act="type-back" style="font-size:15px;width:auto;padding:0;color:var(--muted)">뒤로</button>
      <b style="flex:1;text-align:center">근무타입 추가</b><span style="width:36px"></span>
    </div>
    <input type="text" id="typeSearch" placeholder="🔍 검색">
    <button class="pk-i new" data-act="type-new">＋ 새 근무타입 만들기</button>
    <div id="pkList">${groups||'<div class="hint">기본 목록은 모두 추가했어요</div>'}</div>`);
}
function filterTypePick(q){
  q=q.trim();
  document.querySelectorAll('#pkList .pk-i').forEach(b=>{b.style.display=!q||b.dataset.q.includes(q)?'':'none';});
}
function typePreview(){
  const t=typeDraft,c=tColors(t),k=t.k||'?';
  if(t.k===NONE_K)return `<span id="tdPrev" class="badge r big nonb ph">없음</span>`;
  const tw=k.length>2?' two three':'';
  return c?`<span id="tdPrev" class="badge c big${tw}" style="--tb:${c.bg};--tf:${c.fg}">${esc(k)}</span>`:`<span id="tdPrev" class="badge r big${tw}">${esc(k)}</span>`;
}
function openTypeEdit(){
  const t=typeDraft;
  const used=!t.isNew&&(S.pattern.includes(t.orig)||Object.values(S.overrides).includes(t.orig));
  openSheet(`
    <div class="sh-head">
      <button class="ib shbk" data-act="type-back" aria-label="취소">‹</button>
      <b style="flex:1;text-align:center">${t.isNew?'새 근무타입':'근무타입 편집'}</b>
      <button class="ib ok" data-act="type-save">확인</button>
    </div>
    <div style="display:flex;justify-content:center;padding:6px 0 16px">${typePreview()}</div>
    <div class="row">
      <div style="width:90px"><div class="lbl" style="margin-top:0">달력 글자</div><input type="text" id="tdK" value="${t.k===NONE_K?'':esc(t.k)}" maxlength="3" placeholder="${t.k===NONE_K?'없음':'예: 연'}" ${BUILTIN.includes(t.orig)||t.orig===NONE_K?'disabled':''}></div>
      <div class="grow"><div class="lbl" style="margin-top:0">이름</div><input type="text" id="tdName" value="${esc(t.name)}" maxlength="12" placeholder="예: 연차"></div>
    </div>
    ${t.orig===NONE_K?'<div class="hint" style="margin:10px 0 0">달력 칸에 아무것도 안 보이는 쉬는 날이에요 (쉬는 날로 세요)</div>':`<div class="lbl">종류</div>
    <div class="seg">
      <button class="${!t.rest?'on':''}" data-act="type-kind" data-v="0">근무하는 날</button>
      <button class="${t.rest?'on':''}" data-act="type-kind" data-v="1">쉬는 날</button>
    </div>
${!t.rest?(()=>{const d=timesOf(t.orig||t.k),s0=t.ts||d.start,e0=t.te||d.end;return `<div class="lbl">근무 시간</div>
      <div class="tdtm">${tpick('tdS',s0,'big')}<em>→</em>${tpick('tdE',e0,'big'+(tm2m(e0)<=tm2m(s0)?' nx':''))}</div><div class="tdtot">총 <b>${totH(s0,e0)}</b> 근무</div>`;})():''}
    <div class="lbl">색</div>
    <div class="pal">
      <button class="sw0 ${!t.color?'on':''}" data-act="type-color" data-c="" title="색 없음(빨간 글자)">${esc(t.k&&t.k!==NONE_K?t.k:'휴')}</button>
      ${PALETTE.map(c=>`<button class="${t.color===c?'on':''}" data-act="type-color" data-c="${c}" style="background:${c}"></button>`).join('')}
    </div>${t.rest&&ad('stats')?`<div class="prow" style="padding:14px 0 0"><div class="pl2">무급</div><label class="sw"><input type="checkbox" id="tdUnpaid" ${t.unpaid?'checked':''}><i></i></label></div>`:''}`}
    ${t.isNew||BUILTIN.includes(t.orig)?'':`<button class="btn ghost danger" data-act="type-del" style="width:100%;margin-top:18px" ${used?'disabled':''}>${used?'근무표에서 쓰는 중이라 삭제할 수 없어요':'이 근무타입 삭제'}</button>`}`);
}
function saveType(){
  const t=typeDraft;if(!t)return;
  const k=(t.k||'').trim(),name=(t.name||'').trim()||k;
  if(!k){toast('달력에 보일 글자를 넣어주세요 (한글 2자 · 영문 3자)');return;}
  if(S.types.some(x=>x.k===k&&x.k!==t.orig)){toast('이미 있는 글자예요');return;}
  const item={k,name,color:t.color,rest:!!t.rest,...(t.rest&&t.unpaid?{unpaid:true}:{})};
  if(t.isNew)item.noGuess=true;   // 새 타입은 이름으로 주/야를 맞히지 않고 모두 같은 기본값(아침 출근)으로 시작
  if(t.isNew){
    S.types.push(item);typeDraft=null;
    if(!t.rest&&(t.ts||t.te)){stSet(k,'start',t.ts);stSet(k,'end',t.te);}
    if(typeReturn==='day'&&sheetKey){applyShift(k);}else{save();afterType();}
    toast('근무타입을 추가했어요');return;
  }
  const i=S.types.findIndex(x=>x.k===t.orig);
  if(i>=0){if(S.types[i].noGuess)item.noGuess=true;S.types[i]=item;}
  S.shiftTimes=S.shiftTimes||{};
  if(k!==t.orig&&S.shiftTimes[t.orig]){S.shiftTimes[k]=S.shiftTimes[t.orig];delete S.shiftTimes[t.orig];}   // 글자를 바꾸면 시간도 따라감
  if(!t.rest&&(t.ts||t.te)){stSet(k,'start',t.ts);stSet(k,'end',t.te);}
  if(k!==t.orig){   // 글자를 바꾸면 패턴·변경·알람도 같이 바꿈
    S.pattern=S.pattern.map(x=>x===t.orig?k:x);
    (S.patOld||[]).forEach(o=>{o.pattern=o.pattern.map(x=>x===t.orig?k:x);});
    for(const d in S.overrides)if(S.overrides[d]===t.orig)S.overrides[d]=k;
    S.alarms.forEach(a=>{if(a.shift===t.orig)a.shift=k;});
  }
  typeDraft=null;save();render();afterType();toast('저장했어요');
}
function deleteType(){
  const t=typeDraft;if(!t||BUILTIN.includes(t.orig))return;
  if(!confirm(`'${t.name}' 근무타입을 삭제할까요?`))return;
  S.types=S.types.filter(x=>x.k!==t.orig);
  typeDraft=null;save();render();afterType();
}
/* 길게 누르기: 근무타입 칩 → 편집, 메모 카드 → 메뉴 */
let holdTimer=null,held=false;
document.addEventListener('pointerdown',e=>{
  held=false;clearTimeout(holdTimer);
  const b=e.target.closest('[data-hold]');if(!b)return;
  holdTimer=setTimeout(()=>{
    held=true;
    
    if(b.dataset.hold==='type-edit'){
      const x=typeOf(b.dataset.s);
      typeReturn=b.dataset.ret||'day';
      typeDraft={isNew:false,orig:x.k,k:x.k,name:x.name,color:x.color,rest:!!x.rest,unpaid:!!x.unpaid};
      openTypeEdit();
    }else if(b.dataset.hold==='memo'){
      openMemoMenu(b.dataset.mid);
    }else if(b.dataset.hold==='myemo'){
      myEmoDel(+b.dataset.i);
    }else if(b.dataset.hold==='ico'){
      icoDelete(b.dataset.id);
    }else if(b.dataset.hold==='mtype'){
      const m=manMember();if(m){const d=parse(b.dataset.hd);openFtEdit(famEraRef(m,d),b.dataset.hk,()=>{save();manStkRefresh();},m);}
    }else if(b.dataset.hold==='mstk'){
      openManStampReg(b.dataset.hid,manDayK,'mandy');
    }else if(b.dataset.hold==='fam'){
      const m=(S.family||[]).find(x=>x.id===b.dataset.id);if(m){famDraft=JSON.parse(JSON.stringify(m));openFamEdit();}
    }else if(b.dataset.hold==='team'){
      openTeamMenu(Number(b.dataset.g));
    }else if(b.dataset.hold==='stk'){
      const k=b.dataset.k,id=b.dataset.id;closePop();openStampReg(k,id,'day');   // 날짜 창에서 스티커 줄을 꾹 누르면 그 스티커 고치기
    }
  },500);
});
['pointerup','pointercancel','pointerleave','pointermove'].forEach(ev=>document.addEventListener(ev,e=>{
  if(ev==='pointermove'&&(Math.abs(e.movementX)+Math.abs(e.movementY))<6)return;
  clearTimeout(holdTimer);
},true));
document.addEventListener('click',e=>{
  if(e.target.closest&&e.target.closest('#toast.act')){const f=toast._undo;const t=$('#toast');t.classList.remove('show','act');toast._undo=null;if(f)f();return;}if(held){held=false;e.stopPropagation();e.preventDefault();}},true);
document.addEventListener('contextmenu',e=>{if(e.target.closest('[data-hold]'))e.preventDefault();});

/* ================= 알람 설정 (전체 화면) ================= */
function newAlarm(){return {isNew:true,id:uid(),label:'',time:'06:00',shift:S.types[0]?S.types[0].k:'주',offset:0,on:true,sound:true,vib:true,vol:100,ramp:false,tone:'',toneName:'기본 알람음',snMin:5,snMax:3,once:false,until:0,wx:true,wxOnly:false};}
let alSnd=false;   // 알람 설정에서 "소리 · 다시 울림"을 펼쳤는지
function openAlarmPage(){
  // v0.145 새 모양: 위 칸(근무 색 · 큰 시간 · 근무 · 전날/당일/다음날) · 반복 / 울릴 때 / 함께 묶음 · 설명 줄 없음
  const a=draft,t=ampm(a.time);
  const ch=(arr,curv,act)=>arr.map(([v,l])=>`<button class="${String(curv)===String(v)?'on':''}" data-act="${act}" data-v="${v}">${l}</button>`).join('');
  const kind=!a.sound&&!a.vib?'silent':'';
  const wxo=a.wxOnly&&ad('wx');
  const sndV=[a.sound?`${a.vol}%`:'',a.vib?'진동':''].filter(Boolean).join(' · ')||'무음';
  const snzV=a.snMax===0?'끔':a.snMax===-1?`${a.snMin}분 · 계속`:`${a.snMin}분 · ${a.snMax}번`;
  const tc=x=>{const c=tColors(x);return c?c.bg:(x.rest?'var(--restx)':'var(--muted)');};
  const st=typeOf(a.shift),sc=a.shift==='*'||!st?'var(--accent)':(tColors(st)?tColors(st).bg:'var(--restx)');
  const pills=[...S.types.map(x=>[x.k,x.name,tc(x)]),['*','매일','var(--accent)']].map(([v,l,c])=>`<button class="${String(a.shift)===String(v)?'on':''}" data-act="dshift" data-v="${esc(v)}" style="--d:${c}"><i></i>${esc(l)}</button>`).join('');
  const tg=(id,on,dis)=>`<label class="sw"><input type="checkbox" id="${id}" ${on?'checked':''} ${dis?'disabled':''}><i></i></label>`;
  const sub=alSnd&&!wxo?`<div class="npsub">
      <div class="prow"><div class="pl2">알람종류</div><div class="chips"><button class="${a.sound?'on':''}" data-act="dsound">소리</button><button class="${a.vib?'on':''}" data-act="dvib">진동</button><button class="${kind?'on':''}" data-act="dsilent">무음</button></div></div>
      <div class="prow col"><div class="pl2">볼륨</div><input type="range" id="aVol" min="10" max="100" step="5" value="${a.vol}" ${a.sound?'':'disabled'}></div>
      <div class="prow"><div class="pl2">점점 커지는 소리</div>${tg('aRamp',a.ramp,!a.sound)}</div>
      <div class="prow tap" data-act="dtone"><div class="pl2">알람음</div>${isFileTone(a.tone)&&hasBridge('previewTone')?'<button class="btn ghost sm" data-act="dtone-play">▶ 듣기</button>':''}<div class="pv" style="max-width:52%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.toneName||'기본 알람음')} ›</div></div>
      <div class="prow"><div class="pl2">다시 울림 간격</div><div class="chips">${ch([[5,'5분'],[10,'10분'],[15,'15분']],a.snMin,'dsnmin')}</div></div>
      <div class="prow col"><div class="pl2">다시 울림 횟수</div><div class="chips left">${ch([[0,'끔'],[1,'1번'],[3,'3번'],[5,'5번'],[-1,'계속']],a.snMax,'dsnmax')}</div></div>
    </div>`:'';
  openPage(`
    ${pageHead(a.isNew?'알람 추가':'알람 설정','<button class="ok" data-act="asave">저장</button>')}
    <div class="pg-b np">
      <section class="nphero" style="--sc:${sc}">
        <button type="button" class="timebox" data-act="tpk" data-id="at" data-type="time"><em>${t.ap}</em>${t.tm.replace(/^0(?=\d:)/,'')}</button><input type="hidden" id="at" value="${a.time}">
        <div class="nppills">${pills}</div>
        <div class="npseg">${ch([[-1,'전날'],[0,'당일'],[1,'다음날']],a.offset||0,'doff')}</div>
      </section>
      <div class="pg-cap">반복</div>
      <div class="pg-sec">
        ${npRow('repeat','울리기',`<input type="checkbox" id="aRepeat" ${a.once?'':'checked'} hidden><div class="npseg sm"><button class="${a.once?'':'on'}" data-act="drep" data-v="0">매번</button><button class="${a.once?'on':''}" data-act="drep" data-v="1">한 번만</button></div>`,a.once&&onceDay(a)?{d:`${onceDay(a)} 한 번 울려요`}:{})}
        ${npRow('calendar-off','공휴일엔 쉬기',tg('aNoHol',a.noHol))}
      </div>
      <div class="pg-cap">울릴 때</div>
      <div class="pg-sec">
        ${wxo?`${npRow('bell','알림 소리',`<div class="chips"><button class="${a.sound!==false?'on':''}" data-act="dwxsnd" data-v="1">소리</button><button class="${a.sound===false?'on':''}" data-act="dwxsnd" data-v="0">무음</button></div>`)}
          ${a.sound!==false?npRow('music','소리 고르기',(isFileTone(a.tone)&&hasBridge('previewTone')?'<button class="btn ghost sm" data-act="dtone-play">▶ 듣기</button>':'')+npVal(esc(a.tone?(a.toneName||'고른 소리'):'폰 기본 알림음')),{tap:1,act:'dtone'}):''}`
        :`${npRow('volume-2','소리와 진동',`<div class="pv npv">${esc(sndV)}${npi(alSnd?'chevron-down':'chevron-right',16)}</div>`,{tap:1,act:'dsnd-open'})}${sub}
          ${npRow('alarm-clock','다시 울림',npVal(esc(snzV)),{tap:1,act:'dsnd-open'})}`}
        ${npRow('tag','이름',`<input type="text" class="inl" id="al" value="${esc(a.label)}" placeholder="없음" maxlength="20">`)}
      </div>
      <div class="pg-cap">함께</div>
      <div class="pg-sec">
        ${!a.once&&!wxo?npRow('bell-ring','5분 전 미리 알림',tg('aPre',a.pre5!==false),{d:'먼저 깨면 이번만 끄기'}):''}
        ${ad('wx')?`${npRow('cloud-sun','날씨','')}<div class="npwx"><div class="npseg">${ch([['card','끈 뒤 보기'],['only','날씨만'],['off','안 함']],a.wxOnly?'only':a.wx!==false?'card':'off','dwx')}</div></div>`:''}
        ${wxo?'':npRow('file-text','알람 화면에 한 줄',tg('almsg',S.alarmMsg!==false),{d:'메모 · 할 일 · 근무 요청'})}
      </div>
      ${a.isNew?'':`<div class="pg-sec" style="margin-top:20px">${npRow('trash-2','알람 삭제','',{cls:'danger-row',act:'adel'})}</div>`}
    </div>`,'alarm');
}
const isFileTone=u=>/^file:/.test(u||'');
// 알람에서 안 쓰는 내 음악 파일은 앱 안에서 지우기
function cleanTones(){try{if(hasBridge('cleanTones'))window.AndroidBridge.cleanTones(JSON.stringify((S.alarms||[]).map(a=>a.tone).filter(isFileTone)));}catch(e){}}
window.__onTone=o=>{
  if(o&&o.error){toast(o.error);return;}
  if(!draft||!o||(o.req!==draft.id&&o.req!=='n:'+draft.id))return;   // (v0.143 "n:" = 날씨만 알람의 알림음)
  draft.tone=o.uri||'';draft.toneName=o.title||(o.req.startsWith('n:')?'기본 알림음':'기본 알람음');
  if(pageMode==='alarm')openAlarmPage();
};

/* ================= 더 보기 ================= */
/* 설정 목록 아이콘: 이모티콘 대신 같은 굵기 · 같은 색(보라) 선 아이콘 */
const LINE_ICON={'▦':'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 12h16M12 4v16"/>','🌓':'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>','▬':'<rect x="3" y="9" width="18" height="6" rx="3"/>','🔗':'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>','🔁':'<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>','🕐':'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>','👥':'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>','🏢':'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>','💊':'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>','📊':'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>','👪':'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>','👁':'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>','🎨':'<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>','🖼':'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>','☁️':'<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>','✉️':'<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>','🔒':'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>','🗑':'<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>','ℹ️':'<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>','🔤':'<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>'};
LINE_ICON['▣']='<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>';
Object.assign(LINE_ICON,{'📅':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>','📝':'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>','🧩':'<path d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v6h-5v-2a2 2 0 1 0-4 0v2H5v-5h2a2 2 0 1 0 0-4H5V6h5z"/>'});
// v0.135 설정 칸 아이콘 통일 (같은 굵기 · 크기 · 색)
Object.assign(LINE_ICON,{'🔔':'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>','💊':'<circle cx="12" cy="12" r="9"/><path d="M8.5 13.5a4 4 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>','☁️':'<path d="M17.5 19H8a5 5 0 1 1 1-9.9A6 6 0 0 1 20.6 11 4 4 0 0 1 17.5 19z"/>','🎨':'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>','👪':'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>','🖼':'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="M21 15l-5-5L5 21"/>','ℹ️':'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>','💡':'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>','🏢':'<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M12 17.5s-3-1.8-3-3.6a1.5 1.5 0 0 1 3-.6 1.5 1.5 0 0 1 3 .6c0 1.8-3 3.6-3 3.6z"/>','☀️':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>','👥':'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>','📊':'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>','📋':'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3M9 10h6M9 14h6M9 18h3"/>','☔':'<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 0 4 0"/>'});
const lineIcon=e=>LINE_ICON[e]?`<svg class="li" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LINE_ICON[e]}</svg>`:e;
// v0.97 설정 정리: 자주 쓰는 6개는 타일(값 요약) · 한 번 정하면 안 바꾸는 것은 "화면" · 알림은 "알림" · 정보는 "도움 · 정보" 안으로
function renderMore(){
  const guest=role()==='guest';
  const item=(e,t,act,v)=>`<div class="mi2" data-act="${act}"><span class="e">${lineIcon(e)}</span><span>${t}</span><small>${v||''} ›</small></div>`;
  const item2=(e,t,sub,act,v)=>`<div class="mi2" data-act="${act}"><span class="e">${lineIcon(e)}</span><span class="t2">${t}<i>${sub}</i></span><small>${v||''} ›</small></div>`;
  const tile=(e,t,sub,act,dot)=>`<button class="stile${dot?' dot':''}" data-act="${act}"><span class="e">${lineIcon(e)}</span><b>${t}</b><small>${sub||'&nbsp;'}</small></button>`;
  const lastB=S.drive&&S.drive.last?rel(S.drive.last):'';
  const issues=nativeIssues();
  const cap=t=>`<div class="pg-cap">${t}</div>`;
  const linkOk=!guest&&fbCfg();
  const famN=S.link&&S.fam2?(S.fam2.members||[]).length:0;
  // v0.156 새 모양(A): 묶음 내 근무 · 가족 · 앱 · 3칸씩 · 칸 아래 글 겹치지 않게 · 가족 연결 + 가족 목록 = "가족" 한 칸 · 이럴 땐 이렇게 = 넓은 한 줄
  const wgN=(()=>{try{return hasBridge('widgetCount')?+window.AndroidBridge.widgetCount()||0:-1;}catch(e){return -1;}})();
  const g1=[
    !guest&&!persAll()?tile('🔁','근무 패턴',S.noPat?(S.myset?'불규칙':'아직 안 만듦'):`${esc(S.patternName||'')} ${esc(myTeamLabel())}`,'more-pattern'):'',
    S.personal?tile('🔁','근무표 쓰기','개인 캘린더 끄기','personal-off'):'',
    tile('💊','스티커',`${slotDefs().filter(x=>!x.empty).length}개`,'stk-board'),
    hasBridge('setWidgetData')?tile('▣','위젯',wgN>0?`${wgN}개 사용 중`:wgN===0?'홈 화면에 없음':'홈 화면','more-widget'):''].filter(Boolean);
  const g2=[
    linkOk?tile('👪','가족',S.link?`${famN}명 연결`:'초대하기','link-open',!!(S.link&&S.fam2&&S.fam2.boardDot)):tile('👪','가족',`${(S.family||[]).length}명`,'fam-set'),
    tile('🖼','이미지 공유','달력 사진','more-share'),
    tile('☁️','백업',lastB||'안 함','more-backup')];
  const g3=[
    tile('🎨','화면',S.fontScale>100?'글자 크게':'글자 보통','more-look'),
    tile('🧩','부가 기능',`${addonCount()}개 켜짐`,'more-addons'),
    tile('ℹ️','도움 · 정보',appVersion(),'more-info')];
  const grp=(t,a)=>a.length?`${cap(t)}<div class="stiles">${a.join('')}</div>`:'';
  return `<div class="mlist mset" style="padding-bottom:24px">
    <button class="srch-entry" data-act="srch-open"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>${wlOn()?`메모 · ${esc(wlName())} 찾기`:'메모 찾기'}</button>
    ${issues.length?`<button class="mwarn" data-act="more-perm"><span class="npi">${npi('alert',20)}</span><b>알람이 잘 울리게</b><em>${issues.length}개 꺼짐${npi('chevron-right',16)}</em></button>`:''}
    ${grp('내 근무',g1)}${grp('가족',g2)}${grp('앱',g3)}
    <button class="mtips" data-act="tips-open"><span>${npi('bulb',22)}</span><b>이럴 땐 이렇게</b><small>상황별 사용법</small></button>
  </div>`;
}
/* ---- v0.118 💡 이럴 땐 이렇게: 상황별 팁 (묶음 접기 · 누르면 펼침 · 바로 가기) — 기능을 바꾸면 여기 글도 같이 고치기 (s79 가 바로 가기를 시험) ---- */
const TIPS=[["📅","달력 · 근무",[["근무가 바뀌었을 때 한 번에 고치기","날짜를 누르고 \"여러 날 칠하기\"를 눌러요. 근무를 고른 다음 날짜를 하나씩 누르거나 손가락으로 쭉 그으면 돼요.","tab:cal"],["조나 회사가 바뀌었어요","근무 패턴에서 새 패턴을 만들고 첫 칸 시작 날을 바뀌는 날로 정해요. \"이 날부터 새 패턴\"을 누르면 지난 근무표와 통계는 그대로 남아요.","more-pattern"],["근무표가 불규칙해요","근무 패턴에서 불규칙으로 바꾸고, 날짜마다 근무를 넣어요.","more-pattern"],["빨간 날엔 쉬는 회사예요","근무 패턴에서 \"공휴일엔 쉬어요\"를 켜면 공휴일 근무가 휴무로 바뀌어요.","more-pattern"],["휴직이나 퇴사로 근무 없이 쓰고 싶어요","근무 패턴 맨 아래 \"개인 캘린더로 쓰기\"를 눌러요. 근무표는 지우지 않고 그대로 둬요.","more-pattern"],["직접 바꾼 근무를 되돌리고 싶어요","근무 패턴의 \"패턴 제외 초기화\"에서 기간을 고르면 그 사이 직접 바꾼 근무만 패턴대로 돌아가요.","more-pattern"],["글자가 잘 안 보여요","설정 › 화면에서 배경을 \"또렷하게\"로 바꾸거나 글자 크기를 크게 해요.","more-look"],["이번 달 근무를 사진으로 보내기","설정 › 이미지 공유로 달력 사진을 만들어 메신저로 보내요.","more-share"]]],["📝","포스트잇 · 메모",[["메모 · 포스트잇 · 업무 메모는 뭐가 달라요?","메모는 그날 하루에 붙어요. 포스트잇은 그 달 내내 달력 위에 보이고, 할 일 줄을 체크할 수 있어요. 업무 메모는 근무 인수인계용이라 나만 보고 백업에서 빠져요.","tab:cal"],["이번 달 내내 기억할 것 붙여 두기","달력 위 포스트잇에 적어 두면 그 달 내내 보여요.","tab:cal"],["매달 1일 · 말일에 할 일 띄우기","메모 \"자세히\"에서 반복을 켜고 1일, 말일, 말일 하루 전 중에 골라요. \"주간인 날만\"처럼 근무에 맞출 수도 있어요.","tab:cal"],["가족에게도 보이는 메모","메모 \"자세히\"에서 \"가족에게\"를 골라요. 한 줄 입력칸에 쓴 메모는 나만 봐요.","tab:cal"],["근무 인수인계 적기","설정 › 부가 기능에서 업무 메모를 켜면 날짜마다 인수, 인계, 지시를 따로 적을 수 있어요.","more-addons"],["지난 메모나 인수인계 찾기","설정 맨 위 찾기 칸에 적어 보세요.","srch-open"]]],["💊","스티커",[["약 먹었는지 체크","스티커에서 약을 고르고 하루 몇 번 먹는지, 알림 시각을 정해요.","stk-board"],["운동이나 물 마시기 같은 습관 기록","스티커를 반복으로 깔아 두고 할 때마다 눌러요. 한 달 통계도 나와요.","stk-board"],["쉬는 날에만 하는 일","날짜를 누르고 스티커 붙이기 → 스티커를 고른 뒤 반복에서 \"근무 맞춤\" → 휴무를 고르면 쉬는 날에만 깔려요.","stk-board"],["학원 · 동아리 · 운동 날씨까지","스티커를 붙일 때(등록 화면) 맨 아래 \"학원 · 취미 · 동아리\"에서 활동 시간과 위치를 정해요. 끝나면 자동으로 완료돼요.","stk-board"],["반복 스티커를 그만하고 싶어요","그만두는 날의 스티커 창에서 \"그만하기\"를 눌러요. 지난 기록은 남아요.","tab:cal"],["스티커가 왜 안 붙지?","스티커는 하루에 4개까지만 보여요. 반복 조건에 안 맞는 날, 근무와 겹치는 활동, \"그만하기\"를 누른 뒤의 날짜에도 안 붙어요.","stk-board"],["아이 얼굴로 스티커 만들기","스티커 고르기에서 \"내 것\"을 누르고 사진을 넣어요.","stk-board"],["그날 기분 남기기","스티커 고르기의 기분 탭에서 골라요. 한 달 통계로 기분을 돌아볼 수 있어요.","stk-board"],["아이 약이나 준비물 챙기기","아이 달력 날짜 창에서 스티커를 더하고 \"아이 · 육아\" 탭에서 골라요. 유치원 가는 날만 깔리게 할 수도 있어요.","tab:fam"]]],["☔","날씨",[["아침 알람 끄고 바로 날씨 보기","알람 설정에서 날씨를 \"끈 뒤 보기\"로 두면 알람을 끌 때 날씨 카드가 떠요.","tab:alarm"],["알람 없이 출근 전 날씨만","알람 설정에서 날씨를 \"날씨만\"으로 두면 알람 대신 날씨 알림만 와요.","tab:alarm"],["아이 등하교나 학원 날씨","아이 달력 날짜 창의 \"일정 패턴\"에서 일정 시간과 위치를 정해요. 학원은 스티커의 활동으로 정해요.","tab:fam"],["날씨 지역 바꾸기","근무 패턴의 \"위치\"에서 집과 직장 동네를 골라요.","more-pattern"]]],["👪","가족",[["아이나 가족 일정 같이 보기","설정 › 가족에서 \"가족 추가\"를 누르고 학교, 회사, 교대 중에 골라요.","fam-set"],["유치원에서 학교로 가요","아이 달력 날짜 창의 \"일정 패턴\"에서 \"이 날부터 새 일정\"을 눌러요. 그 전 날짜는 예전 그대로 남아요.","tab:fam"],["가족과 근무표 주고받기","가족 연결에서 초대 코드를 보내요.","link-open"],["가족에게 그날 쉬어 달라고 부탁하기","가족 근무자 달력에서 날짜를 눌러 쉬는 날로 요청해요. 받는 사람이 확정하면 달력에 바로 들어가요.","link-open"],["내 달력 없이 가족 것만 보고 싶어요","가족 연결에서 \"내 근무표를 가족에게 보여요\"를 끄면 달력 탭이 가족 달력으로 바뀌어요.","link-open"],["가족이 다 같이 쉬는 날 찾기","설정 › 부가 기능에서 \"같이 쉬는 날\"을 켜요.","more-addons"],["백업이랑 구글 연결은 뭐가 달라요?","백업은 근무표 · 메모 · 스티커를 구글 드라이브에 저장해 둬요. 구글 연결은 가족방 자리(방장 권한)를 지켜요. 폰을 바꿀 땐 둘 다 해 두세요.","more-backup"],["폰을 바꿔도 가족방 그대로","가족 연결에서 구글 계정을 연결해 두면 새 폰에서 가족방을 불러올 수 있어요.","link-open"],["구글 계정이 이미 다른 기기에 연결돼 있대요","앱을 다시 깔았거나 옛 폰에 연결했던 거예요. 가족 연결에서 [연결하기]를 누르고 \"예전 연결 풀고 이 폰에 연결\"을 고르면 돼요. 방장이면 꼭 해 두세요. 안 하면 폰을 바꿀 때 방장 권한을 못 찾아요.","link-open"],["가족을 빼고 싶어요","방장도 혼자서는 못 빼요. 가족 과반이 찬성해야 빠져요. 30일 넘게 안 들어온 사람이나 내가 초대한 지 하루가 안 된 사람은 바로 뺄 수 있어요.","link-open"],["가족 메모와 근무 요청 무료 횟수","가족 메모, 근무 요청, 새 가족 포스트잇은 합쳐서 처음 10건까지 무료예요.","link-open"]]],["⏰","알람 · 알림",[["내일 하루만 일찍 일어나야 해요","알람을 하나 더 만들고 울리기를 \"한 번만\"으로 골라요. 원래 알람은 카드의 \"이번만 끄기\"로 하루 쉬게 해요.","tab:alarm"],["먼저 깼는데 알람이 울릴 것 같아요","알람 설정에서 \"5분 전 미리 알림\"을 켜 두면, 울리기 5분 전에 소리 없는 알림이 떠서 이번만 끌 수 있어요.","tab:alarm"],["야간 뒤 낮잠 땐 알림을 조용히","가족 연결의 \"자는 시간엔 소리 없이\"를 켜요.","link-open"]]],["💰","통계 · 수당",[["무급 휴가는 월급에서 빼고 싶어요","근무 종류 편집에서 \"무급\"을 켜면 그 날만큼 빼요. 연차는 빼지 않아요.","more-addons"],["이번 달 월급이 얼마일지","설정 › 부가 기능의 \"근무 통계 · 수당\"에서 고정급과 명세서 한 장으로 맞춰요.","more-addons"],["연장 근무 기록","근무 통계를 켜면 날짜 창에 연장 칸이 생겨요. 가족에게도 늦게 끝나는 게 보여요.","tab:cal"]]],["📱","그 밖",[["홈 화면에서 근무 바로 보기","위젯을 홈 화면에 놓아요.","more-widget"],["폰을 바꿔도 데이터 지키기","설정 › 백업에서 구글 드라이브 자동 백업을 켜요.","more-backup"],["실수로 옛날 백업을 복원했어요","설정 › 백업의 \"복원 직전으로 되돌리기\"를 눌러요.","more-backup"]]]];
// v0.148 자세히: 이럴 때 · 단계 · 사진 (사진은 tips/ · tests/tipshots.js 가 실제 앱을 찍음)
const TIPD={"내일 하루만 일찍 일어나야 해요": {"w": "다음 주 수요일만 평소보다 1시간 일찍 나가야 할 때 써요. 원래 알람은 그대로 두고 한 번만 울릴 알람을 하나 더 만들어요.","s": [["아래 <b>알람</b> 탭에서 오른쪽 위 <b>＋</b>를 눌러요.","t1_a"],["그날 근무를 고르고 시간을 정해요. 그날이 주간이면 <b>주간</b>을 고르고 오전 5:00으로 맞춰요."],["울리기에서 <b>한 번만</b>을 골라요. 아래에 울릴 날짜가 보이면 맞게 된 거예요.","t1_b"],["오른쪽 위 <b>저장</b>을 눌러요. 그날 원래 알람도 울리면 \"그날만 건너뛸까요?\"가 떠요. <b>그날만 건너뛰기</b>를 누르면 돼요."],["원래 알람만 하루 쉬고 싶을 땐 알람 카드의 <b>이번만 끄기</b>를 눌러요. 울리기 하루 전부터 보여요."]]},"연장 근무 기록": {"w": "오늘 퇴근이 2시간 늦어졌을 때 써요. 남겨 두면 이번 달 연장 시간과 예상 월급에 들어가고, 가족 폰에도 늦게 끝나는 게 보여요.","pre": "먼저 설정 › 부가 기능에서 <b>근무 통계 · 수당</b>을 켜 주세요.","s": [["달력에서 그 날짜를 눌러요. 근무 줄 끝에 <b>연장</b>이 있어요.","t2_a"],["<b>+2시간</b>을 누르면 퇴근이 늦춰지고 \"연장 2시간\"이 떠요. 한 번 더 누르면 시간이 더 붙어요.","t2_b"],["정확한 시각을 넣고 싶으면 <b>실제 퇴근</b> 칸을 눌러 고쳐요."],["창을 닫으면 저장돼요. 달력 날짜 칸에 \"+2시간\"이 붙어요."]]},"근무가 바뀌었을 때 한 번에 고치기": {"w": "다음 달 근무표가 나왔는데 여러 날이 패턴과 다를 때 써요. 하루씩 열지 않고 붓으로 칠하듯 한 번에 고쳐요.","s": [["달력에서 아무 날짜나 눌러요. 근무 줄 오른쪽에 <b>여러 날 칠하기</b>가 있어요.","t3_a"],["칠할 근무(예: 휴무)를 고르고 달력 날짜를 누르거나 손가락으로 쭉 그어요."],["다 칠했으면 <b>완료</b>를 눌러요. 가족과 연결돼 있으면 가족 폰에도 바뀐 근무가 가요."]]},"약 먹었는지 체크": {"w": "아침, 저녁 약을 먹었는지 헷갈릴 때 써요. 달력 날짜 위에 스티커로 체크하고 시각이 되면 알림도 받아요.","s": [["달력 날짜의 <b>윗부분</b>을 누르면 스티커 창이 열려요.","t4_a"],["<b>스티커 붙이기</b>를 눌러 약을 고르고, 하루 몇 번 먹는지와 알림 시각을 정해요. 반복은 \"매일\"로 둬요."],["먹을 때마다 그 칸을 눌러요. 하루 두 번 먹는 약은 1/2, 2/2로 채워져요."]]},"가족에게도 보이는 메모": {"w": "\"토요일 장모님 생신\"처럼 가족 폰에도 보이게 하고 싶을 때 써요.","pre": "먼저 가족 연결이 돼 있어야 해요.","s": [["날짜를 누르고 메모 줄 오른쪽 <b>자세히</b>를 눌러요. 한 줄 입력칸에 쓴 메모는 나만 봐요.","t5_a"],["<b>가족에게</b>를 고르고 적어요. 시간과 색도 여기서 정해요."],["저장하면 가족 폰에 알림이 가고 달력에 ♥로 보여요."]]},"이번 달 내내 기억할 것 붙여 두기": {"w": "\"이번 달 안에 자동차 보험 갱신\"처럼 날짜는 없지만 한 달 내내 봐야 할 게 있을 때 써요.","s": [["달력 왼쪽 위 <b>노란 포스트잇</b>을 눌러요.","t6_a"],["<b>＋</b>를 눌러 할 일이나 메모를 적어요. 할 일은 줄마다 체크할 수 있어요."],["포스트잇을 누르면 크게 열려요. 줄을 눌러 체크하고, <b>수정하기</b>로 고쳐요. 다 하면 가족에게 \"다 했어요\" 소식이 가요."]]},"학원 · 동아리 · 운동 날씨까지": {"w": "아이 학원이 끝나는 저녁 7시에 비가 오는지, 동호회 시간 날씨는 어떤지 같이 보고 싶을 때 써요.","pre": "먼저 설정 › 부가 기능에서 <b>출퇴근 시간 · 날씨</b>를 켜 주세요.","s": [["날짜를 누르고 <b>스티커 붙이기</b>에서 그 스티커를 골라요."],["맨 아래 <b>학원 · 취미 · 동아리</b>를 펼쳐요."],["활동 시간과 위치를 정하면 날짜 창 날씨에 그 시간 칸이 생기고, 끝나면 자동으로 완료돼요. 근무와 겹치는 날은 빠져요."]]},"반복 스티커를 그만하고 싶어요": {"w": "헬스장을 그만뒀는데 운동 스티커가 매일 계속 깔릴 때 써요. 지난 기록은 남기고 앞으로만 없애요.","s": [["그만두는 날의 스티커 창에서 그 스티커 줄 오른쪽 <b>⋯</b>를 눌러요."],["<b>이날부터 떼기</b>를 누르면 그날부터 안 깔려요. 지난 체크와 통계는 그대로예요."],["기록까지 모두 없애려면 설정 › 스티커에서 그 칸을 눌러 <b>지우기</b>를 눌러요."]]},"가족과 근무표 주고받기": {"w": "남편과 아내 폰에서 서로의 근무를 보고, 바뀌면 바로 알고 싶을 때 써요.","s": [["<b>가족</b> 탭 오른쪽 위 톱니바퀴(또는 설정 › 가족 목록)에서 <b>가족 연결</b>을 눌러요.","t9_a"],["먼저 하는 사람이 가족방을 만들고 <b>초대 코드</b>를 메신저로 보내요."],["받은 사람은 같은 화면에서 코드를 넣어요. 이제 근무가 바뀌면 서로 소식이 오고, 소식의 근무 기록에서 언제 바뀌었는지도 볼 수 있어요."]]},"가족에게 그날 쉬어 달라고 부탁하기": {"w": "\"그날 장모님 생신인데 쉴 수 있어?\"처럼 가족 근무를 바꿔 달라고 부탁할 때 써요.","pre": "먼저 가족 연결이 돼 있어야 해요.","s": [["가족 근무자 달력에서 그 날짜를 눌러요."],["<b>근무 변경 요청</b>에서 원하는 근무(예: 휴무)를 고르고 한마디 적어 <b>요청 보내기</b>를 눌러요."],["받는 사람은 소식에서 <b>수락</b>, <b>보류</b>, <b>거절</b> 중에 골라요. 수락하면 달력에 바로 들어가고 근무 기록에도 남아요."]]},"매달 1일 · 말일에 할 일 띄우기": {"w": "카드값 확인이나 관리비처럼 매달 같은 날 해야 하는 일이 있을 때 써요.","s": [["달력에서 그 날짜를 누르고, 메모 줄의 <b>자세히</b>를 눌러요.","t16_a"],["<b>반복</b>을 눌러 1일, 말일, 말일 하루 전 중에 골라요.","t16_b"],["근무에 맞출 수도 있어요. <b>주간인 날만</b>을 고르면 그날이 주간일 때만 뜨고, 아니면 다음 근무 날로 넘어가요."]]}};

// v0.136 나머지 자세히 (단계가 여러 개인 것만 · 한두 번 누르면 끝나는 것은 한 줄 그대로)
Object.assign(TIPD,{   // v0.148 글 다듬기 (보통 문장 · 해요체 · 이모지 없음)
  '스티커가 왜 안 붙지?':{w:'반복으로 깔았는데 어떤 날엔 스티커가 안 보일 때 봐요. 아래 중 하나예요.',s:[
    ['스티커는 <b>하루에 4개까지만</b> 보여요. 설정 › 스티커에서 순서를 바꾸면 먼저 보일 것을 정할 수 있어요.'],
    ['그날 <b>같은 그림 스티커</b>가 따로 있으면 겹쳐요. 새로 깔 때 뜨는 창에서 어느 쪽을 보일지 골라요.'],
    ['<b>반복 조건</b>에 안 맞는 날이에요. 근무 맞춤, 요일, 공휴일 빼기, 주말 빼기를 스티커 고치기에서 확인해요.'],
    ['<b>학원이나 동아리 활동 시간</b>이 그날 근무와 겹치면 빠져요.'],
    ['<b>이날부터 떼기</b>를 누른 뒤의 날짜와 <b>이날만 떼기</b> 한 날에는 안 깔려요. 다시 쓰려면 스티커 줄 ⋯ › 반복 · 알림 고치기에서 반복을 켜요.']]},
  '조나 회사가 바뀌었어요':{w:'다음 달부터 조가 바뀌거나 회사를 옮겨 근무 순서가 달라질 때 써요. 지난 근무표와 통계는 그대로 두고 그날부터만 바꿔요.',s:[
    ['설정 › <b>근무 패턴</b>을 열어요.','t11_a'],
    ['새 순서로 패턴을 고르거나 만들고, <b>1번째 칸 시작 날</b>을 바뀌는 날로 정해요.'],
    ['물어보면 <b>이 날부터 새 패턴</b>을 눌러요. 그 전 날짜는 예전 근무 그대로 남아요.']]},
  '근무표가 불규칙해요':{w:'매달 근무표가 따로 나와서 정해진 순서가 없을 때 써요.',s:[
    ['설정 › 근무 패턴에서 <b>불규칙</b>으로 바꿔요.'],
    ['달력 날짜를 누르고 <b>여러 날 칠하기</b>로 한 달 근무를 쭉 칠해요.'],
    ['다음 달 근무표가 나오면 같은 방법으로 칠해요. 가족 폰에도 바로 가요.']]},
  '휴직이나 퇴사로 근무 없이 쓰고 싶어요':{w:'육아휴직이나 퇴사로 한동안 근무가 없을 때 써요. 근무표는 지우지 않고 숨겨 두기만 해요.',s:[
    ['설정 › 근무 패턴 맨 아래 <b>개인 캘린더로 쓰기</b>를 눌러요.','t13_a'],
    ['기간을 정하면 그동안 달력과 위젯에서 근무 표시가 빠지고 메모와 스티커만 보여요.'],
    ['복직하면 같은 곳에서 끄면 돼요. 근무표가 그대로 돌아와요.']]},
  '근무 인수인계 적기':{w:'인수, 인계, 지시 사항을 날짜마다 따로 남기고 나중에 찾아보고 싶을 때 써요.',s:[
    ['설정 › <b>부가 기능</b>에서 업무 메모를 켜요.'],
    ['날짜 창에 업무 메모 줄이 생겨요. 인수, 인계, 지시를 색으로 나눠 적어요.'],
    ['지난 것은 설정 맨 위 찾기 칸에서 글자로 찾아요.']]},
  '아이 등하교나 학원 날씨':{w:'아이 하교 시간에 비가 오는지, 학원 끝날 때 추운지 미리 알고 싶을 때 써요.',pre:'먼저 가족 탭에 아이를 추가하고, 부가 기능에서 출퇴근 시간 · 날씨를 켜 주세요.',s:[
    ['가족 탭에서 아이 달력을 열고 날짜 창의 <b>일정 패턴</b>을 눌러요.'],
    ['유치원, 학교 같은 일정마다 시간과 <b>위치</b>를 넣어요.'],
    ['학원은 아이 달력 스티커를 고쳐 <b>활동</b> 시간과 위치를 넣어요. 날씨 팝업에 그 시간 칸이 생겨요.']]},
  '아침 알람 끄고 바로 날씨 보기':{w:'알람을 끄자마자 오늘 출퇴근 날씨와 우산이 필요한지 보고 싶을 때 써요.',pre:'먼저 부가 기능에서 출퇴근 시간 · 날씨를 켜고 집과 직장 동네를 정해 주세요.',s:[
    ['알람 탭에서 알람 카드를 눌러요.'],
    ['날씨를 <b>끈 뒤 보기</b>로 골라요.'],
    ['다음부터 알람을 끄면 날씨 카드가 바로 떠요.']]},
  '알람 없이 출근 전 날씨만':{w:'소리 나는 알람은 필요 없고 출근 전에 날씨 알림만 받고 싶을 때 써요.',s:[
    ['알람 탭에서 <b>＋</b>를 누르거나 알람 카드를 눌러 시각을 정해요.'],
    ['날씨를 <b>날씨만</b>으로 고르면 알람 대신 그 시각에 날씨 알림만 와요.'],
    ['알림을 누르면 오늘 날씨가 열려요.']]},
  '아이나 가족 일정 같이 보기':{w:'앱을 안 쓰는 아이나 부모님 일정도 내 폰에서 같이 보고 싶을 때 써요.',s:[
    ['<b>설정 › 가족</b>에서 <b>가족 추가</b>를 눌러요.'],
    ['학교, 회사, 교대 중에 고르고 시간과 쉬는 날을 정해요.'],
    ['가족 탭 카드와 그 사람 달력에서 일정, 스티커, 메모를 봐요. 같이 쉬는 날도 계산돼요.']]},
  '유치원에서 학교로 가요':{w:'3월부터 유치원에서 초등학교로 일정이 통째로 바뀔 때 써요. 그 전 날짜는 예전 그대로 둬요.',s:[
    ['아이 달력 날짜 창에서 <b>일정 패턴</b>을 눌러요.'],
    ['<b>이 날부터 새 일정</b>을 누르고 바뀌는 날을 정해요.'],
    ['새 일정과 시간을 넣어요. 그 전 날짜는 유치원 일정 그대로 남아요.']]},
  '폰을 바꿔도 가족방 그대로':{w:'근무표를 보내는 사람이 폰을 바꿀 때 가족방이 끊기지 않게 해요.',s:[
    ['폰을 바꾸기 전에 가족 연결 화면에서 <b>구글 계정</b>을 연결해 둬요.'],
    ['새 폰에 앱을 깔고 같은 구글 계정으로 연결하면 가족방이 이어져요.'],
    ['가족 쪽 폰은 아무것도 안 해도 돼요.']]},
  '가족이 다 같이 쉬는 날 찾기':{w:'가족 여행이나 외식 날을 잡을 때 모두 쉬는 날을 한눈에 봐요.',s:[
    ['설정 › 부가 기능에서 <b>같이 쉬는 날</b>을 켜요.'],
    ['가족 탭과 가족 달력에 모두 쉬는 날이 노란 띠로 보여요.'],
    ['날짜를 누르면 누가 쉬는지 한 줄로 나와요.']]},
  '이번 달 월급이 얼마일지':{w:'야간, 연장, 휴일 근무가 많은 달에 월급이 얼마쯤일지 미리 보고 싶을 때 써요.',s:[
    ['설정 › 부가 기능에서 <b>근무 통계 · 수당</b>을 켜요.'],
    ['고정금(기본급 등)을 넣고, 지난달 명세서 한 장으로 연장과 야간 1시간 금액을 맞춰요.'],
    ['근무 통계에서 이번 달 예상 금액을 봐요. 연장을 남기면 바로 더해져요.']]},
  '홈 화면에서 근무 바로 보기':{w:'앱을 열지 않고 홈 화면에서 오늘과 이번 달 근무를 보고 싶을 때 써요.',s:[
    ['폰 홈 화면 빈 곳을 꾹 눌러 <b>위젯</b>에서 언제쉬어를 골라요.'],
    ['1칸, 2칸, 7일, 한 달 중에 골라 놓아요.'],
    ['가족이 있으면 한 달 위젯 왼쪽 위 이름(● 나 ▾)을 눌러 가족 달력으로 바꿔요.'],
    ['모양과 투명도는 설정 › 위젯에서 바꿔요.','t15_a']]},
  '폰을 바꿔도 데이터 지키기':{w:'폰을 바꾸거나 앱을 지웠다 깔아도 근무, 메모, 스티커를 그대로 지켜요.',s:[
    ['설정 › <b>백업</b>을 열어요.'],
    ['<b>구글 드라이브</b>를 연결하면 자동으로 백업돼요.'],
    ['새 폰에서 같은 계정으로 연결하고 복원을 눌러요.']]},
  '실수로 옛날 백업을 복원했어요':{w:'복원을 잘못 눌러 요즘 적은 것이 사라졌을 때 써요.',s:[
    ['설정 › <b>백업</b>을 열어요.'],
    ['<b>복원 직전으로 되돌리기</b>를 눌러요. 복원하기 바로 전 모습으로 돌아가요.']]}
});
function tipDetail(q){const D=TIPD[q];if(!D)return '';
  return `<div class="tdw"><b>이럴 때</b>${D.w}</div>${D.pre?`<div class="tdp">${D.pre}</div>`:''}<ol class="tds">${D.s.map(([t,im])=>`<li>${t}${im?`<img src="tips/${im}.webp" alt="" loading="lazy" onerror="this.remove()">`:''}</li>`).join('')}</ol>`;}
function openTipsPage(){   // v0.147 새 모양: 묶음 카드(선 아이콘 · 개수) → 누르면 질문 줄 → 누르면 이럴 때 · 번호 단계 · 사진 · 바로 가기
  closeSheet();
  const TI={'📅':'calendar','📝':'sticky-note','💊':'smile','☔':'cloud-sun','👪':'users','⏰':'alarm-clock','💰':'chart-column','📱':'smartphone'};
  openPage(`${pageHead('이럴 땐 이렇게')}<div class="pg-b tips np">
    <div class="pg-sec" style="margin-top:8px">${npRow('info','처음 안내 다시 보기',npVal(''),{tap:1,act:'coach-again'})}</div>
    <div class="pg-cap">상황별</div>
    ${TIPS.map(([e,t,L],g)=>`<details class="pg-sec tipg"><summary><span class="npi">${npi(TI[e]||'info')}</span><span class="tgt">${esc(t)}</span><small>${L.length}</small>${npi('chevron-down',16)}</summary>${L.map(([q,a,go])=>`<details class="tip"><summary>${esc(q)}${npi('chevron-down',16)}</summary>${TIPD[q]?tipDetail(q):`<div class="ta">${esc(a)}</div>`}<button class="btn tgo" data-act="tip-go" data-a="${esc(go)}">바로 가기 ›</button></details>`).join('')}</details>`).join('')}
  </div>`,'tips');
}
// v0.135 처음 안내 (말풍선 · 한 번만 · 건너뛰기 · 이럴 땐 이렇게에서 다시 보기)
let coachOn=false;
function coachSets(){
  const pn='#view #track>.panel:nth-child(2) ',sh='#sheet.open ';
  return [
    {k:'tcal',ok:()=>tab==='cal'&&!document.querySelector('#sheet.open')&&!famView(),steps:[
      {sel:pn+'.cell.today .stz',alt:pn+'.cell.today',part:'top',t:'날짜 윗부분을 누르면',b:'스티커를 붙여요. 약 · 운동처럼 매일 하는 걸 체크해요.'+(S.addons&&S.addons.wx?'<br>학원 · 동아리 스티커는 그 시간 날씨도 보여요.':'')},
      {sel:pn+'.cell.today',part:'low',t:'날짜 아랫부분을 누르면',b:'그날 창이 열려요. 근무를 바꾸고 메모를 남겨요.'},
      {sel:'#top .pi-btn',t:'이번 달 할 일',b:'포스트잇에 적어 두면 가족과 같이 봐요.'}]},
    {k:'twx',ok:()=>!!document.querySelector('#sheet.open')&&!!(S.addons&&S.addons.wx),steps:[
      {sel:sh+'#wxDay',t:'출근 · 퇴근 날씨',b:'그날 출근 · 퇴근 때 날씨예요. 누르면 시간별로 자세히 보고, 우산 · 옷도 알려 줘요.'}]},
    {k:'tfam',ok:()=>!!document.querySelector('#sheet.open')&&!!S.link,steps:[
      {sel:sh+'#memoInput',t:'♥ 가족 메모',b:role()==='host'?'"자세히"에서 가족을 고르면 가족 폰에도 보이고 알림이 가요.':'여기 쓰면 가족 모두에게 보이고 알림이 가요.'},
      {sel:sh+'[data-act="rqwant"]',t:'근무 요청',b:'바꾸고 싶은 근무를 골라 요청을 보내요. 수락하면 달력에 바로 반영돼요.'},
      {sel:sh+'[data-act="rqreply"]',t:'근무 요청',b:'가족이 보낸 근무 요청이에요. 수락하면 내 달력에 바로 반영돼요.'}]}];
}
function coachCheck(){
  if(coachOn||!S.onboarded||document.querySelector('#page.open,#tutx')||$('#pop').innerHTML.trim()||document.hidden)return;
  for(const c of coachSets()){
    if(hintN(c.k)||!c.ok())continue;
    const st=c.steps.map(x=>({...x,el:document.querySelector(x.sel)||(x.alt&&document.querySelector(x.alt))})).filter(x=>x.el&&x.el.getBoundingClientRect().height>0);
    if(!st.length)continue;
    coachShow(c.k,st,0);return;
  }
}
function coachEnd(k){const d=document.getElementById('tutx');if(d)d.remove();coachOn=false;S.hints=S.hints||{};S.hints[k]=1;save();setTimeout(()=>{try{addonNotice();}catch(e){}},500);}   // v0.239 미뤄 둔 "일부 기능이 옮겨졌어요" 는 튜토리얼이 끝난 뒤에
function coachShow(k,st,i){
  coachOn=true;const s=st[i];let d=document.getElementById('tutx');if(d)d.remove();
  if(!s||!document.body.contains(s.el)){coachEnd(k);return;}
  s.el.scrollIntoView({block:'nearest'});
  let r=s.el.getBoundingClientRect();r={left:r.left,top:r.top,width:r.width,height:r.height};
  if(s.part==='top'&&!/stz/.test(s.el.className))r.height=r.height*0.3;
  if(s.part==='low'){r.top+=r.height*0.3;r.height*=0.7;}
  const pad=6,x=r.left-pad,y=r.top-pad,w=r.width+pad*2,h=r.height+pad*2,H=innerHeight,below=y+h+170<H;
  d=document.createElement('div');d.id='tutx';
  d.innerHTML=`<div class="hole" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>
    <div class="arr ${below?'dn':'up'}" style="left:${Math.min(Math.max(x+w/2-9,26),innerWidth-44)}px;top:${below?y+h+8:y-20}px"></div>
    <div class="bub" style="${below?`top:${y+h+26}px`:`bottom:${H-y+26}px`}"><b>${s.t}</b><p>${s.b}</p>
    <div class="ft"><span class="dots">${st.length>1?`${i+1} / ${st.length}`:''}</span><div class="rt">${i<st.length-1?'<button class="sk" data-c="skip">건너뛰기</button>':''}<button class="nx" data-c="next">${i<st.length-1?'다음':'알겠어요'}</button></div></div></div>`;
  d.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();const b=e.target.closest('[data-c]');if(!b)return;
    if(b.dataset.c==='next'&&i<st.length-1)coachShow(k,st,i+1);else coachEnd(k);},true);
  ['touchstart','pointerdown','mousedown'].forEach(ev=>d.addEventListener(ev,e=>e.stopPropagation()));
  document.body.appendChild(d);
}
function coachSoon(){setTimeout(()=>{try{coachCheck();}catch(e){}},700);}
function tipGo(a){
  if(a.startsWith('tab:')){pageBack=null;closePage();tab=a.slice(4);paint=null;render();if(tab==='fam')wxFetch(false);return;}
  pageBack=openTipsPage;const b=document.createElement('button');b.dataset.act=a;b.style.display='none';document.body.appendChild(b);b.click();b.remove();
}
// 설정 › 화면: 달력 · 보기 · 자세히
function openLookPage(){   // v0.146 새 모양
  const fs=S.fontScale||100;
  const seg=(arr,cur,act)=>`<div class="npseg sm">${arr.map(([v,l])=>`<button class="${String(cur)===String(v)?'on':''}" data-act="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;
  openPage(`${pageHead('화면')}<div class="pg-b np">
    <div class="pg-cap">달력</div>
    <div class="pg-sec">
      ${npRow('grid','달력 모양',seg([['circle','동그라미'],['fill','칸 채우기']],S.calLook==='fill'?'fill':'circle','callook'))}
      <div class="prow pcol tdc-line"><div class="pl2" style="display:flex;align-items:center;gap:12px"><span class="npi">${npi('circle-dot')}</span>오늘 표시</div>${todayColorRow()}</div>
      ${npRow('calendar','주 시작',seg([[0,'일'],[1,'월']],S.weekStart===1?1:0,'weekstart'))}
    </div>
    <div class="pg-cap">보기</div>
    <div class="pg-sec">
      ${npRow('sun-moon','화면 모드',seg([['light','라이트'],['dark','다크'],['system','시스템']],S.theme==='light'||S.theme==='dark'?S.theme:'system','thememode'))}
      ${npRow('type','글자 크기',seg([[100,'보통'],[120,'크게']],fs>100?120:100,'font'))}
      ${npRow('paintbrush','배경',seg([['','기본'],['vivid','또렷하게']],S.bg||'','bgmode'))}
    </div>
    <div class="pg-cap">자세히</div>
    <div class="pg-sec">${npRow('sliders','모양 세부 조정',npVal(''),{tap:1,act:'tune-open'})}</div>
  </div>`,'look');
}
// 설정 › 알림: 흩어져 있던 알림 설정을 한 곳에
function openNotifPage(){
  const fam=pushRow().replace('style="margin-top:16px"','style="margin-top:0"'),snd=hasBridge('openSettings');
  openPage(`${pageHead('알림')}<div class="pg-b np">
    ${S.link?`<div class="pg-cap">가족</div>${fam||'<div class="hint keep" style="padding:6px 22px">이 폰에선 가족 알림을 받을 수 없어요</div>'}`:''}
    <div class="pg-sec" style="margin-top:${S.link?12:8}px">
      ${npRow('smile','스티커 알림 시간',npVal(''),{tap:1,act:'stk-board'})}
      ${snd?npRow('bell','알림 소리',npVal('폰 설정'),{tap:1,act:'remind-sound'}):''}
      ${npRow('alarm-clock','알람',npVal('알람 탭'),{tap:1,act:'notif-alarm'})}
    </div>
  </div>`,'notif');
}
// 설정 › 도움 · 정보
function openInfoPage(){   // v0.146 새 모양
  openPage(`${pageHead('도움 · 정보')}<div class="pg-b np">
    ${famBx.vip?`<div class="pg-sec plan-on" style="margin-top:8px">${npRow('sparkles','무제한 이용 중','')}</div>`:''}
    <div class="pg-sec" style="margin-top:${famBx.vip?12:8}px">
      ${npRow('clock','알람이 잘 울리게',npVal(''),{tap:1,act:'info-perm'})}   <!-- v0.215 다 켜져 있어도 들어갈 수 있게 (삼성 자동 절전 예외 앱 바로가기) -->
      ${npRow('file-text','문의하기 · 오류 신고',npVal(''),{tap:1,act:'more-mail'})}
      ${npRow('calendar-days','사용 통계 · 오류 보고',`<label class="sw"><input type="checkbox" id="statsOn" ${S.stats!==false?'checked':''}><i></i></label>`)}
      ${npRow('tag','개인정보처리방침',npVal(''),{tap:1,act:'more-privacy'})}
      ${npRow('bell','앱 정보',`<div class="pv npv">${appVersion()}</div>`,{act:'about-tap'})}
      ${S.link?npRow('user','내 번호',`<div class="pv npv">${myCode(S.link.uid)}</div>`,{tap:1,act:'my-code'}):''}
      ${admOk?npRow('users','관리자',npVal(''),{tap:1,act:'adm-open'}):''}
    </div>
    <div class="pg-sec" style="margin-top:12px">${npRow('trash-2','내 데이터 모두 지우기','',{cls:'danger-row',act:'more-wipe'})}</div>
  </div>`,'info');
  admCheck();
}
const lookRefresh=()=>{if(pageMode==='look')openLookPage();};
// v0.171 위젯 설정 미리보기: 위젯과 같은 코틀린 그리기(AndroidBridge.widgetPreview)로 그린 한 달 위젯 한 장 · 바둑판 위 (투명 정도가 보이게)
function wgBg(){return S.widget.bg==='app'||S.widget.bg==null?(S.bg==='vivid'?'vivid':''):S.widget.bg==='vivid'?'vivid':'';}
const wgStyleOk=()=>!!(window.AndroidBridge&&typeof window.AndroidBridge.openWidgetStyle==='function');
// v0.191 위젯 설정 화면(실제 배경화면 위 · 폰 화면)에서 저장하면 돌아옴
window.__wgStyle=j=>{try{const o=typeof j==='string'?JSON.parse(j):j;if(!o||typeof o!=='object')return;const w=S.widget;
  if(['light','dark','system'].includes(o.theme))w.theme=o.theme;if(Number.isFinite(+o.alpha))w.alpha=Math.max(0,Math.min(100,Math.round(+o.alpha/10)*10));
  if((o.bg==='vivid'?'vivid':'')!==wgBg())w.bg=o.bg==='vivid'?'vivid':'';if(o.look==='circle'||o.look==='fill')w.look=o.look;
  save();if(pageMode==='widget')openWidgetPage();}catch(e){}};
const wgPrevOk=()=>!!(window.AndroidBridge&&typeof window.AndroidBridge.widgetPreview==='function');
let wgPvT=0,wgPvWant=false;
function wgPrev(){
  if(!wgPrevOk())return;wgPvWant=true;if(wgPvT)return;   // v0.189 밀고 있는 동안엔 0.15초에 한 번만 (끝난 뒤 한 번 더)
  wgPvT=setTimeout(()=>{wgPvT=0;if(!wgPvWant)return;wgPvWant=false;try{const im=$('#wgPvImg');if(!im)return;const b64=window.AndroidBridge.widgetPreview(widgetJson(),330,350);if(b64)im.src='data:image/png;base64,'+b64;}catch(e){}if(wgPvWant)wgPrev();},150);
}
function openWidgetPage(){
  const w=S.widget;
  openPage(`${pageHead('홈 화면 위젯')}
    <div class="pg-b np">
      ${wgPrevOk()?`<div class="wgpv" id="wgPv"${wgStyleOk()?' data-act="wg-style"':''}><img id="wgPvImg" alt="위젯 미리보기">${wgStyleOk()?`<span class="wgpvb">${npi('image',15)}배경화면에서 보기</span>`:''}</div>`:''}
      <div class="pg-cap">배경</div>
      <div class="pg-sec pad"><div class="npseg">${[['light','밝게'],['dark','어둡게'],['system','폰 설정 따라']].map(([v,n])=>`<button class="${w.theme===v?'on':''}" data-act="wg-theme" data-v="${v}">${n}</button>`).join('')}</div>
        <div class="npseg" style="margin-top:10px">${[['','기본'],['vivid','또렷하게']].map(([v,n])=>`<button class="${wgBg()===v?'on':''}" data-act="wg-bg" data-v="${v}">${n}</button>`).join('')}</div>
        <div class="prow" style="padding:12px 0 0"><div class="pl2">진하기 <b id="wgAv">${w.alpha}%</b></div><input type="range" id="wgAlpha" min="0" max="100" step="10" value="${w.alpha}" style="flex:1"></div></div>
      <div class="pg-cap">한 달 위젯 모양</div>
      <div class="pg-sec pad"><div class="npseg">${[['fill','칸 채우기'],['circle','동그라미']].map(([v,n])=>`<button class="${w.look===v?'on':''}" data-act="wg-look" data-v="${v}">${n}</button>`).join('')}</div></div>
    </div>`,'widget');
  wgPrev();
}
/* ================= 모양 조정 (숨은 화면: 설정 › 앱 정보를 7번 눌러 나오는 개발자 메뉴 안) =================
 * 앱 달력(위에 미리보기) · 한 달 위젯(커버 · 안쪽)의 스티커 · 주야 글자 · 메모 크기와 위치를 움직여 보고, "값 복사"로 개발자에게 전하면 기본값으로 반영해요. */
const tuneFmt=v=>(Math.round(v*100)/100).toFixed(2);
const tuneVal=()=>tuneDraft||S.tune;
const tuneDirty=()=>!!tuneDraft&&JSON.stringify(tuneDraft)!==JSON.stringify(S.tune);
function tuneRows(g){   // 스티커 / 주야 / 메모 묶음으로 접기 · 지금 보는 화면(앱 달력)만 펼쳐 둠
  const t=tuneVal()[g],open=g===tuneAppKey();
  return ['스티커','주야','메모'].map(gr=>`<details class="tn-d"${open?' open':''}><summary>${gr}</summary>${TUNE_KEYS.filter(k=>k[6]===gr&&(!k[7]||g.startsWith('app'))).map(([k,nm,lo,hi,st])=>`<div class="tn-row"><span>${nm}</span><input type="range" class="tn-r" data-g="${g}" data-k="${k}" min="${lo}" max="${hi}" step="${st}" value="${t[k]}"><b id="tnv_${g}_${k}">${tuneFmt(t[k])}</b></div>`).join('')}</details>`).join('');
}
function tuneBar(){   // 저장 · 되돌리기 줄 (미리보기 바로 아래)
  const e=$('#tnBar');if(!e)return;const d=tuneDirty(),h=(S.tuneHist||[]).length;
  e.innerHTML=`<span class="tn-st${d?' dirty':''}">${d?'저장 안 한 값이 있어요':'저장된 값이에요'}</span><button class="btn ghost" data-act="tune-undo"${h?'':' disabled'}>이전 저장으로${h?` (${h})`:''}</button><button class="btn" data-act="tune-save"${d?'':' disabled'}>저장</button>`;
}
function tuneWarn(){   // 지금 보는 앱 달력 화면에서 한계에 닿았는지: 미리보기를 실제로 재서 알려줌 (막지는 않음)
  const e=$('#tnWarn'),pv=$('#tnPrev');if(!e||!pv)return;
  const w=[],cells=[...pv.querySelectorAll('.grid .cell')];
  const want=memoLines(),cap=3;
  let cut=0,txt=0,stkHid=0,holShort=0,ovl=0,memoOvl=0;
  cells.forEach(c=>{
    const pl=[...c.querySelectorAll('.pill-wrap>*')];
    pl.forEach(x=>{if(x.scrollWidth>x.clientWidth+1||x.querySelector('.ell2'))txt++;if(x.clientHeight&&x.scrollHeight>x.clientHeight+1)cut++;});
    const pw=c.querySelector('.pill-wrap'),dn0=c.querySelector('.dn'),bw0=c.querySelector('.bwrap');
    if(pw&&pw.children.length&&bw0&&pw.getBoundingClientRect().top<bw0.getBoundingClientRect().bottom-1)memoOvl++;
    if(pw&&pw.children.length&&pw.getBoundingClientRect().bottom>c.getBoundingClientRect().bottom+1)cut++;
    const hn=c.querySelector('.dn .hn'),h1=c.querySelector('.dn .h1');
    if(hn&&hn.scrollWidth>hn.clientWidth+1)holShort++;
    if(h1&&h1.dataset.o&&h1.textContent.length<h1.dataset.o.length)holShort++;
    c.querySelectorAll('.stp>*,.s2>*').forEach(x=>{const r=x.getBoundingClientRect(),cr=c.getBoundingClientRect();if(r.right>cr.right+1||r.left<cr.left-1||r.bottom>cr.bottom+1)stkHid++;});
    const stp=c.querySelector('.dn>.stp'),num=c.querySelector('.dn .num');
    if(stp&&num&&stp.children.length){const a=stp.getBoundingClientRect(),b=num.getBoundingClientRect();if(a.left<b.right-1)ovl++;}
  });
  if(want<cap)w.push(`메모가 ${cap}줄 중 ${want}줄만 보여요`);
  if(cut)w.push('메모가 칸 밖으로 잘려요');
  if(memoOvl)w.push('메모가 근무 글자와 겹쳐요');
  if(txt)w.push('메모 글자가 칸보다 커서 끝이 잘려요');
  if(holShort)w.push('공휴일 이름이 줄어 보여요');
  if(stkHid)w.push('스티커가 칸 밖으로 나가요');
  if(ovl)w.push('스티커가 날짜 숫자와 겹쳐요');
  e.innerHTML=w.length?w.map(x=>`<div>⚠ ${esc(x)}</div>`).join(''):'';
}
function tunePrev(){   // 미리보기는 "일주일 줄"만: 스티커 · 메모 · 요청이 가장 많은 주 (없으면 오늘이 있는 주) · 칸 높이는 실제 달력 칸과 비슷하게
  const e=$('#tnPrev');if(!e)return;
  e.innerHTML=calPanel(cur.y,cur.m);
  try{stzWindow($('#page'));}catch(err){}   // 스티커 크기는 실제 달력과 같게(앞뒤 3달 기준) — 그 뒤에 한 주만 남김
  const g=e.querySelector('.grid');if(!g)return;
  const cells=[...g.children],rows=Math.floor(cells.length/7);let best=0,bs=-9;tnRows=rows;
  for(let r=0;r<rows;r++){let sc=0;for(let c=0;c<7;c++){const x=cells[r*7+c];sc+=x.querySelectorAll('.pl').length*2+x.querySelectorAll('.stp>*,.s2>*').length*2+(/rq-/.test(x.className)?3:0)+(x.classList.contains('today')?1:0)-(x.classList.contains('out')?3:0);}if(sc>bs){bs=sc;best=r;}}
  tnBest=best;const wk=tnWeek==null?best:Math.max(0,Math.min(rows-1,tnWeek));
  cells.forEach((x,i)=>{if(Math.floor(i/7)!==wk)x.remove();});
  g.style.gridTemplateRows='1fr';
  {const rc=document.querySelector('#view #track>.panel:nth-child(2) .cell'),h0=rc?rc.getBoundingClientRect().height:0,ch=Math.round(h0>40?h0:tnCellH>40?tnCellH:Math.max(90,(innerHeight-230)/6)),dw=e.querySelector('.dow');   // v0.141 실제 달력 칸 높이 그대로 (전엔 칸이 틀보다 길게 늘어나 아래가 잘려 보였음)
   g.style.height=ch+'px';g.style.flex='none';e.style.height=(ch+((dw&&dw.offsetHeight)||34))+'px';}
  {const w=$('#tnWk');if(w)w.innerHTML=`<button class="ib" data-act="tn-wk" data-d="-1" aria-label="앞 주"${wk<=0?' disabled':''}>▲</button><span>${cur.m+1}월 ${wk+1}째 주</span><button class="ib" data-act="tn-wk" data-d="1" aria-label="다음 주"${wk>=rows-1?' disabled':''}>▼</button>`;}
  try{fitDn(e,true);memoShift(e);}catch(err){}   // 실제 달력처럼 날짜 줄에 안 들어가면 공휴일 이름을 줄이고 스티커를 아래 줄로 (미리보기도 똑같이)
  tuneBar();tuneWarn();
}
const TODAY_COLORS=[['','파랑'],['#1fa971','초록'],['#e0455c','분홍'],['#8a65c9','보라'],['#f08a00','주황'],['#6b7280','회색']];
// "근무 색": 오늘 표시 색 = 그날 근무타입 색을 한 단계 진하게(모든 근무타입 · 바꾼 색도 따라감) · 쉬는 날은 장미 · 색 없는 근무는 기본 파랑
function deepenHex(h,dark){   // dark: 어두운 화면에선 칸 색이 어두워서 반대로 밝게
  h=String(h||'').replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');if(!/^[0-9a-f]{6}$/i.test(h))return '';
  const r=parseInt(h.slice(0,2),16)/255,g=parseInt(h.slice(2,4),16)/255,b=parseInt(h.slice(4,6),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  let H=d===0?0:mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;H*=60;if(H<0)H+=360;
  const sat=Math.min(1,(mx===0?0:d/mx)*(dark?1.1:1.35)+(dark?.05:.08)),v=dark?Math.min(1,mx*1.3+.18):mx*.74,c=v*sat,x=c*(1-Math.abs((H/60)%2-1)),m=v-c;
  const [r1,g1,b1]=H<60?[c,x,0]:H<120?[x,c,0]:H<180?[0,c,x]:H<240?[0,x,c]:H<300?[x,0,c]:[c,0,x];
  return '#'+[r1,g1,b1].map(f=>Math.round((f+m)*255).toString(16).padStart(2,'0')).join('');
}
// v0.99.2 "근무 색"은 지금 화면에 보이는 달력(내 달력 · 내 달력 보기 · 가족 달력 · 직접 추가한 가족 달력)의 그날 근무를 따라감
function tdcShift(){
  const d=new Date(),k=fmt(d);let c=null,rest=false;
  if(pageMode==='mancal'){const m=manMember();if(!m)return '';if(m.kind==='shift'){const sh=famShift(m,d);c=tColors(typeOf(sh));rest=isRest(sh);}else rest=memberOff(m,d);}
  else if(pageMode==='famcal'||(famView()&&famPeers().length)){const p=vcEnsure();if(!p||!p.sch)return '';const sh=schShift(p.sch,d);c=tColors(schType(p.sch,sh));rest=schRest(p.sch,sh);}
  else{if(persOn(k))return '';const sh=shiftOf(d);c=tColors(typeOf(sh));rest=isRest(sh);}
  if(c&&c.bg){const de=document.documentElement,dk=de.dataset.theme==='dark'||(de.dataset.theme!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);return deepenHex(cssHex(c.bg),dk)||'';}
  return rest?'#6b7482':'';   // v0.127 쉬는 날은 빨강(명절 느낌) 대신 회색 테두리
}
function applyTdc(){   // 근무 색일 때만: 지금 보이는 달력에 맞춰 오늘 색 다시 계산
  if(S.todayColor!=='shift')return;const tc=tdcShift(),de=document.documentElement;
  if(tc)de.style.setProperty('--tdc',tc);else de.style.removeProperty('--tdc');
  if(tc)de.setAttribute('data-tdc',tc==='#6b7482'?'rest':'1');else de.removeAttribute('data-tdc');
}
function todayColorRow(){   // 오늘 띠 색: 근무 색 + 동그라미 6개 + 직접 고르기
  const cur=S.todayColor||'';
  return `<div class="tdc-row"><button class="tdc tdc-shift${cur==='shift'?' on':''}" data-act="todaycolor" data-v="shift" aria-label="그날 근무 색"></button>${TODAY_COLORS.map(([v,n])=>`<button class="tdc${cur===v?' on':''}" data-act="todaycolor" data-v="${v}" aria-label="${n}" style="background:${v||'var(--accent)'}"></button>`).join('')}<button class="tdc tdc-pick${cur&&cur!=='shift'&&!TODAY_COLORS.some(x=>x[0]===cur)?' on':''}" data-act="tdc-pick" aria-label="직접 고르기"></button></div>`;
}
// v0.141 모양 조정 정리: 오늘 표시 · 달력 모양은 설정 › 화면으로 · 위젯 상태 줄은 맨 아래 접힌 칸 · 지금 이 화면 묶음만 펼침 · 미리보기 주 고르기(▲ ▼) · 버튼은 아래에 붙음
let tnWeek=null,tnRows=0,tnBest=0,tnCellH=0;
function openTunePage(){
  if(pageMode!=='tune')tnWeek=null;
  {const rc=document.querySelector('#view #track>.panel:nth-child(2) .cell'),h=rc?rc.getBoundingClientRect().height:0;if(h>40)tnCellH=h;}   // 실제 달력 칸 높이 (페이지가 열리면 못 잼)
  if(!tuneDraft)tuneDraft=JSON.parse(JSON.stringify(S.tune));
  let dbg='';try{if(hasBridge('widgetDebug'))dbg=String(window.AndroidBridge.widgetDebug()||'');}catch(e){}
  const G=[['appInner','앱 달력 · 안쪽 화면(큰 화면)'],['appCover','앱 달력 · 커버 화면(작은 화면)'],['cover','한 달 위젯 · 커버 화면(작은 위젯)'],['inner','한 달 위젯 · 안쪽 화면(큰 위젯)']];
  const me=tuneAppKey(),order=[...G.filter(g=>g[0]===me),...G.filter(g=>g[0]!==me)],wasOpen=pageMode==='tune'?new Set([...document.querySelectorAll('#page details.tn-grp[open]')].map(d=>d.id)):null;   // 다시 그릴 때(스티커 범위 · 처음 값 …) 펼친 칸 그대로
  openPage(`${pageHead('모양 조정')}
    <div class="pg-b tn-pg">
      <div class="tn-top"><div class="tn-wk" id="tnWk"></div><div class="tn-prev" id="tnPrev"></div><div class="tn-bar" id="tnBar"></div><div class="tn-warn" id="tnWarn"></div></div>
      ${order.map(([g,n])=>`<details class="tn-g tn-grp" id="tng_${g}"${(wasOpen?wasOpen.has('tng_'+g):g===me)?' open':''}><summary>${n}${g===me?' <small>← 지금 이 화면</small>':''}</summary>${tuneRows(g)}</details>`).join('')}
      <details class="tn-g tn-grp" id="stzDiagG" hidden${wasOpen&&wasOpen.has('stzDiagG')?' open':''}><summary>스티커 크기 (왜 작아졌나)</summary><div id="stzDiag"></div></details>
      ${dbg?`<details class="tn-g tn-grp"><summary>문제 찾기 정보</summary><div class="hint" style="padding:4px 2px 0;font-size:11.5px">놓인 한 달 위젯 마지막 그림 상태<br>${esc(dbg).replace(/\n/g,'<br>')}</div></details>`:''}
      <div class="tn-foot"><button class="btn ghost grow" data-act="tune-reset">처음 값으로</button><button class="btn ghost grow" data-act="tune-copy">값 복사</button></div>
    </div>`,'tune');
  tunePrev();
  setTimeout(()=>{try{const h=stzDiagHtml(),e=$('#stzDiag'),g=$('#stzDiagG');if(e&&g&&h){e.innerHTML=h;g.hidden=false;}}catch(err){}},150);   // v0.128 스티커가 있을 때만 보임 · 열 때만 계산
}
function tuneText(){
  const f=g=>{const t=tuneVal()[g];return `스티커 ${t.stk} · 좌우 ${t.stkX} · 높이 ${t.stkY} / 주야 ${t.ink} · 높이 ${t.inkY}${g.startsWith('app')?` · 빨간 점 ${t.dotX}`:''} / 메모 글자 ${t.memo} · 칸 ${t.pill}`;};
  return `[모양 조정] 앱 달력 안쪽(${S.calLook==='fill'?'칸 채우기':'동그라미'}): ${f('appInner')}\n앱 달력 커버: ${f('appCover')}\n위젯 커버: ${f('cover')}\n위젯 안쪽: ${f('inner')}\n위젯 모양: ${S.widget.look==='circle'?'동그라미':'칸 채우기'}`;
}

/* v0.171 색 고르기 창 (폰 기본 색상 창 대신): 큰 색 판(가로 = 색 · 세로 = 진하기) + 밝기 막대 + 이 색으로 */
let cpS=null;
const hsv2hex=(h,s,v)=>{const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1));};return '#'+[f(5),f(3),f(1)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');};
const hex2hsv=hx=>{const n=parseInt(String(hx).slice(1),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360;}return {h,s:mx?d/mx:0,v:mx};};
function openColorPick(){
  const cur=/^#[0-9a-f]{6}$/i.test(S.todayColor||'')?S.todayColor:'#2f6bf0';cpS=hex2hsv(cur);if(cpS.v<.15)cpS.v=.15;
  openPop(`<div class="cpw"><div class="cph"><b>오늘 표시 색</b></div>
    <div class="cpb" id="cpB"><span class="cpk" id="cpK"></span></div>
    <div class="cpl" id="cpL"><span class="cpk" id="cpK2"></span></div>
    <button class="btn cpok" id="cpOk" data-act="cp-ok">이 색으로</button></div>`);
  cpDraw();
}
function cpDraw(){
  if(!cpS)return;const c=hsv2hex(cpS.h,cpS.s,cpS.v),full=hsv2hex(cpS.h,cpS.s,1);
  const k=$('#cpK'),k2=$('#cpK2'),ok=$('#cpOk'),L=$('#cpL');if(!k)return;
  k.style.left=(cpS.h/360*100)+'%';k.style.top=((1-cpS.s)*100)+'%';k.style.background=full;
  k2.style.left=((cpS.v-.15)/.85*100)+'%';k2.style.background=c;
  L.style.background=`linear-gradient(to right,${hsv2hex(cpS.h,cpS.s,.15)},${full})`;if(ok){ok.style.background=c;const r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);ok.classList.toggle('lt',(r*299+g*587+b*114)/1000>150);}   // 버튼 = 고른 색 · 밝으면 글자 검정
}
document.addEventListener('pointerdown',e=>{
  const el=e.target.closest&&e.target.closest('#cpB,#cpL');if(!el||!cpS)return;e.preventDefault();
  const mv=ev=>{const r=el.getBoundingClientRect(),x=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));
    if(el.id==='cpB'){cpS.h=Math.min(359.9,x*360);cpS.s=1-y;}else cpS.v=.15+x*.85;cpDraw();};
  mv(e);const up=()=>{document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);};
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
});
document.addEventListener('input',e=>{
  if(e.target&&e.target.id==='wgAlpha'){S.widget.alpha=+e.target.value;const v=$('#wgAv');if(v)v.textContent=S.widget.alpha+'%';wgPrev();return;}   // v0.171 밀면 바로 미리보기 (저장은 손 뗄 때)
  if(e.target&&e.target.id==='tdcInput'){S.todayColor=e.target.value.toLowerCase();save();applyTune();document.querySelectorAll('.tdc-row .tdc.on').forEach(x=>x.classList.remove('on'));const l=e.target.closest('.tdc-pick');if(l)l.classList.add('on');return;}
  const t=e.target;if(!t.classList||!t.classList.contains('tn-r'))return;
  const g=t.dataset.g,k=t.dataset.k;if(!tuneDraft||!tuneDraft[g])return;
  tuneDraft[g]=tuneClean({...tuneDraft[g],[k]:+t.value});
  const b=$('#tnv_'+g+'_'+k);if(b)b.textContent=tuneFmt(tuneDraft[g][k]);
  if(g===tuneAppKey()){applyTune();memoLines();tunePrev();}else tuneBar();   // 지금 보고 있는 화면의 값만 미리보기에 바로 보임 · 반영은 "저장" 버튼
});
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

/* ================= 부가 기능 (설정 › 부가 기능) =================
 * 기본은 모두 꺼짐. 꺼도 저장된 내용은 그대로이고, 켜면 그 자리에 바로 생겨요. */
const ADDONS=[
  ['comp','🏢','휴무일 · 기념일','회사 휴무일 · 생일 · 기념일을 달력에 표시하고 미리 알려요'],
  ['together','☀️','같이 쉬는 날','가족이 다 같이 쉬는 날을 찾아 가족 탭에 보여줘요'],
  ['colleague','👥','동료 근무','같은 회사 다른 조의 근무를 한 표로 봐요'],
  ['stats','📊','근무 통계 · 수당','대근 · 연차 · 교육 횟수와 수당을 계산해요'],
  ['wlog','📋','업무 메모 (인수인계)','날짜마다 인수 · 인계 · 지시 · 특이를 따로 적어요 · 나만 보고 백업에서 빠져요'],
  ['wx','☔','출퇴근 시간 · 날씨','근무마다 출근 · 퇴근 시각을 정하고, 그때 날씨와 미세먼지를 알람 · 날짜 창 · 가족 탭에 보여줘요']
];
const adOn=k=>ad(k);
const addonCount=()=>ADDONS.filter(a=>adOn(a[0])).length;
const AD_GO={comp:'more-comp',together:'tog-open',colleague:'go-colleague',stats:'more-stats',wlog:'wl-set',wx:'wx-set'};   // 켜진 칸을 누르면 그 설정
const AD_SHORT={comp:['휴무일·기념일','회사 휴무 · 생일'],together:['같이 쉬는 날','가족 탭에 표시'],colleague:['동료 근무','다른 조 근무표'],stats:['근무 통계','대근 · 연차 · 수당'],wlog:['업무 메모','인수인계 · 나만 봄'],wx:['출퇴근 시간 · 날씨','알람 · 날짜 창']};
function openAddonPage(){   // v0.146 줄 + 스위치 (꺼진 줄을 누르면 켜짐 · 켜진 줄은 그 설정 · 끄기는 스위치)
  openPage(`${pageHead('부가 기능')}
    <div class="pg-b np">
      <div class="pg-sec stiles adt" style="margin-top:8px">${ADDONS.map(a=>{const on=adOn(a[0]),sh=a[0]==='wlog'?[wlName(),AD_SHORT.wlog[1]]:AD_SHORT[a[0]]||[a[2],''];return `<div class="prow tap adr ${on?'':'off'}" data-act="ad-tile" data-k="${a[0]}"><span class="npi">${lineIcon(a[1])}</span><div class="pl2">${esc(sh[0])}</div><label class="sw" data-noact="1"><input type="checkbox" id="ad_${a[0]}" ${on?'checked':''}><i></i></label></div>`;}).join('')}</div>
    </div>`,'addons');
}
// 처음 한 번만: 부가 기능이 있다는 안내 (쓰던 사람 · 처음 쓰는 사람)
// "새로 생겼어요" 팝업: 버전마다 띄우지 않고, 아래 NEWS 에 그 버전의 소식을 적어 둔 때만 한 번 보여 줌 (없으면 조용히 넘어감)
const NEWS={
  'v0.120':`· 가족 달력 스티커도 <b>내 스티커 고치기 화면</b> 그대로: 하루 몇 번 · 요일 · 매일 · <b>일정 맞춤</b>(유치원 가는 날만) · 매달 · 기간 · 알림 (내 폰에서)\n· 🎒 학원 · 취미 · 동아리는 <b>스위치</b>: 켜면 펼쳐지고 바로 적용 · 끄면 안 씀\n· 스티커 목록에 <b>기분</b> · <b>아이 · 육아</b> 탭 · 근무(인수인계 · 재고 조사 · 점검 …) · 건강(체온 · 혈압 · 낮잠 …) · 생활 · 돈(월급날 · 공과금) 더하기`,
  'v0.119':`· 가족 달력 날짜 창에 <b>⚙️ 일정 패턴</b>: 일정 종류 · 시간 · 📍 위치 · 방학 · 이 날부터 새 일정을 한곳에서 (내 근무 패턴처럼)\n· 내 <b>근무 패턴</b>에도 📍 위치 (집 · 직장)\n· 활동이 있는 날은 <b>미세먼지도 칸</b>으로: 출근 · 퇴근 · 🏊활동`,
  'v0.118':`· <b>🔁 반복 메모</b>: 메모 "자세히" → 반복 → 매달 1일 · 말일 · 말일 하루 전 … + 근무 조건 (주간인 날만 · 아니면 다음 근무 날로) · 할 일 체크는 그 날만 · 길게 누르면 이 날만 빼기\n· 설정 맨 아래 <b>💡 이럴 땐 이렇게</b>: 상황별 사용법 · [바로 가기]`,
  'v0.117':`· 가족 달력(직접 추가한 가족)에 <b>일정 종류</b>가 생겼어요: 유치원 · 반일반 · 방학특강처럼 이름 · 달력 표시(두 글자) · 시간 · 색 (내 근무타입처럼)\n· 날짜 창에서 칩으로 그날만 바꾸고, 길게 누르면 종류 고치기 · <b>🖌 여러 날 칠하기</b> · ▴ 접기 · 위쪽 ✏️🖌 는 없앴어요 (✏️ 는 가족 탭에서)\n· 가족 <b>위치</b>(학교 · 회사 동네)를 정하면 <b>등원 · 하원 날씨</b>가 날짜 창 · 가족 카드에 나와요\n· <b>📅 이 날부터 새 일정</b>: 유치원에서 학교 가요 · 그 전 날짜는 예전 그대로\n· 가족 시간표도 동그라미로 통일`,
  'v0.116':`· 가족 탭: 가족이 있으면 내 카드를 낮게, 가족 카드는 <b>2열</b>로 (5명도 한눈에)\n· 넓은 화면(태블릿 · 폴드)은 내 카드 절반 + 옆에 가족`,
  'v0.115':`· 날씨에서 학원 · 취미 · 동아리는 <b>스티커 그림 + 활동</b>으로 보여요 (출근 · 퇴근 · 🏊활동)\n· <b>미세먼지</b>도 활동 칸이 생겨요: 활동 동네가 다르거나, 그 시간에 더 나쁠 때만\n· <b>시간별 줄</b>에 활동 시간대가 따로 묶여 보여요 (시작 시각 칸도 넣어요)\n· 옷 추천은 <b>하루 한 벌</b>만 (가장 추운 때 기준) · 날씨 칸 이름이 한 줄로\n· 가족 달력 스티커 <b>설정</b>: 날짜 창 "설정 ›" → 끌어서 순서 · 고치기 · 판에서 빼기(지난 기록은 남아요) · 내 스티커 가져오기`,
  'v0.114':`· 스티커에 <b>🎒 학원 · 취미 · 동아리</b> 칸이 생겼어요 (스티커 고치기 맨 아래 · 접혀 있어요)\n· 활동 시간을 넣으면 <b>끝나면 자동으로 완료</b> · 근무 시간과 겹치는 날은 빠져요 · 알림은 30분 전으로 미리 채워 줘요\n· 날씨: 활동 있는 날은 <b>출근 · 퇴근 · 활동</b> 3칸 (그날 순서대로) · 갈 때 · 끝날 때 비 오면 알려줘요\n· 가족 달력 스티커도 요일 · 시간을 넣을 수 있어요 → 가족 탭에 "피아노 중 · 17:30 끝"`,
  'v0.113':`· <b>가족 달력</b>(직접 추가한 가족)이 내 달력처럼 보여요: 화면 모드(동그라미 · 칸 채우기) 그대로 · 날짜 창도 옆으로 밀기\n· 가족마다 <b>스티커판</b>이 따로 있어요 (처음엔 내 판 복사 · 개수 제한 없음 · 길게 누르면 고치기)\n· '학교' 대신 <b>유치원 · 학원</b>처럼 이름을 바꿀 수 있어요 (가족 ✏️)\n· 가족 탭: 내 카드가 한 줄로 넓어졌어요 · 위쪽을 누르면 오늘 달력, 날씨를 누르면 날씨\n· 또렷하게 + 동그라미: 근무 글자가 검은색 (어두운 화면은 흰색)\n· 한 달 위젯의 달력 버튼 그림을 크게`,
  'v0.112':`· 옆으로 밀기가 덜 씹혀요: 짧게 <b>툭 튕겨도</b> 넘어가고, 넘어가는 중에 또 밀어도 받아요`,
  'v0.111':`· 날짜 창을 여러 번 밀다 보면 엉뚱한 달로 튀던 것 고침`,
  'v0.110':`· <b>날씨 창</b>도 옆으로 밀면 넘어가요\n· 옆 날짜가 같은 크기로 붙어서 와요 (넘어간 뒤 크기 바뀌는 느낌 없앰 · 업무 메모 칸 높이도)\n· 밀어서 넘길 땐 진동 없음`,
  'v0.109':`· 옆으로 밀면 <b>옆 날짜가 붙어서</b> 같이 따라와요 (날짜 창 · 업무 메모 · 스티커 · <b>날씨 창</b>)\n· 업무 메모 창도 잘 넘어가요\n· 근무 시간은 <b>근무 패턴 → 근무타입(주 · 야)</b> 눌러서 정해요 · 목록에 시간과 <b>총 근무시간</b>이 보여요\n· ⏱ 연장 +시간 버튼은 <b>누를 때마다 더해져요</b> (+4 두 번 = +8시간)`,
  'v0.108':`· 옆으로 밀기가 <b>손가락을 따라</b> 움직이고 놓으면 스프링처럼 넘어가요 (날짜 창 · 업무 메모 창 · <b>스티커 창</b>)\n· 살짝 비스듬히 밀어도 잘 넘어가요 · 조금만 밀면 제자리로`,
  'v0.107':`· 날짜 창 · 업무 메모 창을 <b>옆으로 밀면</b> 전날 · 다음날로 넘어가요 (창 어디서나)\n· 가족 탭 내 카드: 상태는 "나" 옆에 · 날씨를 켰으면 <b>날씨 카드를 크게</b>, 안 켰으면 근무 중을 크게\n· 내 상태는 근무 중 · 쉬는 중 · 휴무 세 가지만 · 근무 시간은 <b>근무 패턴 화면 한 곳</b>에서 정해요\n· 그림 흰 테두리를 없앴어요\n· 어제 날씨가 비지 않게: 관측이 올라오기 전엔 받아 둔 예보로 보여 줘요`,
  'v0.106':`· <b>😷 미세먼지 시간대별</b>: 날씨 팝업 시간별 줄에 칸마다 얼굴 (지난 시간 · 지금 = 실측, 앞으로 = 예보)\n· 날씨 · 옷 · 특보 그림을 한 세트로 다시 다듬고 미세먼지 얼굴을 더 단순하게 바꿨어요\n· 날짜 창 날씨 카드는 오늘 ~ 3일 뒤만 크게, 그 뒤는 한 줄\n· 한 달 위젯 오른쪽 위 <b>📅 버튼</b> → 앱 달력으로 바로 · 제목이 가운데로\n· "응원 버튼" · "내 상태" 부가 기능을 정리했어요 (근무 시간을 정해 두면 가족 탭에 "근무 중 · 몇 시 끝"이 저절로 보여요)`,
  'v0.105':`· <b>☔ 날씨 팝업</b>: <b>시간별 줄</b>(그날 24시간 · 밀어서 보기 · 지금 칸부터) — 칸마다 내가 있는 곳 날씨 (출근 1시간 전 ~ 퇴근 1시간 뒤 = 직장, 그 밖 = 집)\n· 이미 지난 출근 칸도 그때 날씨를 흐리게 보여 줘요 · 그림을 키우고 테두리를 다듬었어요\n· <b>⚠️ 기상특보</b>(호우 · 대설 · 한파 · 폭염 · 강풍 …)와 <b>자외선</b>(선크림)도 알려 줘요\n· 날짜 창 순서: 근무 타입 → 요청 → <b>날씨 카드</b> → 메모 · 답한 근무 요청은 날짜 창에서 빠져요 (요청함엔 그대로)\n· 직장이 집과 가까우면 "같은 지역으로 볼까요?" (설정에서 바꿀 수 있어요)`,
  'v0.104':`· <b>☔ 출퇴근 날씨</b>가 그림으로 바뀌었어요: 맨 위 <b>한 줄 결론</b> · 출근/퇴근 칸에 <b>날씨 그림 · 옷 그림</b> · <b>챙길 것</b>(우산 · 마스크 · 장갑 …)\n· <b>😷 미세먼지</b>를 얼굴 8단계로 보여 줘요. 누르면 큰 화면 (출근 · 퇴근 동네 탭 · 오존 같은 항목 표 · 3일 예보)\n· 미세먼지는 이제 <b>지금 측정값</b> 기준이에요 · 출근 동네와 퇴근 동네를 따로 봐요\n· 알람 끈 뒤 날씨 카드도 같은 모양 · 아래 <b>10초 게이지</b> · 화면을 누르면 자동으로 안 닫혀요\n· 위젯 날짜 창 맨 위에 <b>오늘 · 내일 날씨 한 줄</b> (누르면 앱 날씨 팝업)`,
  'v0.103':`· <b>🕐 근무 시간</b>을 근무 패턴 화면 맨 아래에서 정해요 (정해 두면 출퇴근 날씨 · 가족 탭 "몇 시 끝"에 쓰여요)\n· <b>⏱ 연장</b>: 날짜를 눌러 근무타입 칸 끝에서 실제 출근 · 퇴근을 적어요 (근무 통계를 켠 사람)\n· <b>근무 통계</b>: 평일 · 주말 · 명절 대근, 근무 · 연장 · 야간 시간, 연차 남은 날, 명세서로 맞춘 예상 월급(세전)\n· <b>☔ 날씨</b>: 출근/퇴근 줄을 누르면 그 지역 네이버 날씨 · 지난 날짜는 기상청 실제 관측 · 미세먼지는 가까운 측정소 값`,
  'v0.102':`· <b>☔ 출퇴근 날씨</b>에 <b>👕 옷차림</b>: 출퇴근길 체감온도(바람) · 비 · 눈 · 기온차를 보고 옷과 챙길 것(우산 · 방수 신발 · 겹쳐 입기 …)을 알려줘요\n· <b>미세먼지 8단계</b>(최고 ~ 최악) + 마스크 안내(필요 없어요 · KF80 · KF94 꼭)`,
  'v0.101':`· <b>☔ 출퇴근 날씨</b>: 집 · 직장을 <b>동까지</b> 고를 수 있어요 (설정 › 부가 기능 › 출퇴근 날씨 › 집/직장). 넓은 시 · 군(산골 · 바닷가)에서 더 정확해요`,
  'v0.100':`· <b>☔ 출퇴근 날씨</b> (설정 › 부가 기능 · 켜야 보여요): 출근 땐 집, 퇴근 땐 직장 날씨와 미세먼지를 알람 끈 뒤 · 날짜 창 · 가족 탭에 보여줘요. 알람마다 "날씨만" 알림도 돼요\n· <b>오류 보고</b>: 앱에 문제가 생기면 오류 내용만 전달돼서 더 빨리 고칠 수 있어요 (설정 › 사용 통계 · 오류 보고에서 끌 수 있어요)`,
  'v0.96':`· <b>가족방에 방장이 없어졌어요</b>: 누구나 초대 · 나가기 · 가족을 빼려면 과반 찬성 (30일 넘게 안 온 사람 · 내가 초대한 지 하루 안 된 사람은 바로)\n· <b>가족 포스트잇 알림</b>: 새로 붙이거나 줄을 더하거나 할 일이 다 끝나면 (설정에서 끌 수 있어요)\n· <b>가족방에 다시 들어올 때</b> 옛 가족 메모가 무료 횟수 없이 옮겨져요\n· <b>오늘 표시 "근무 색"</b> · 모든 달력에 오늘 빛 · 작은 위젯도 칸 채우기`,
  'v0.83':`· <b>알람 시간</b>: 위아래로 돌려서 1분 단위로 골라요\n· <b>오늘 칸 빛</b>: 앱을 켤 때 · 다른 달에서 이번 달로 돌아올 때 오늘 칸에 빛이 한 바퀴 (위젯도 ‹ › 로 돌아오면)\n· <b>메모</b>: 어디서든 3줄 · "+1" 이 작아지고 · 잘린 메모 끝에 작은 "…"\n· 접고 펼 때 스티커가 커진 채 남던 문제 고침 · 1/2 배지가 잘리지 않게`,
  'v0.82':`· <b>1/2 배지</b>: 커버 화면에서 너무 컸던 걸 스티커 크기에 맞춰 작게 · <b>위젯 "오늘"</b>: 이동과 빛이 훨씬 부드럽게 · <b>메모 위치</b>: 이제 1.0보다 더 아래로 (최대 3.0)`,
  'v0.81':`· <b>위젯</b>: 맨 윗줄이 높아지고 ‹ › 버튼이 보여요 · 달을 넘기면 새 달이 미끄러져 들어와요 · 이번 달이 아니면 \"오늘로\" 버튼 · 메모 3줄 · 명절 글자가 숫자 옆에 · 앞뒤 달은 더 흐리게\n· <b>알람</b>: 시간을 1분 단위로 · 끄기 화면이 파스텔 톤으로\n· <b>달력</b>: 회사 휴무일이 명절처럼 · 오늘 띠 색 고르기(설정 › 달력 모양)\n· <b>가족방</b>: 연결이 끊겨도 바로 지우지 않고 안내해요 · 방장이 오래 안 들어오면 가족 폰에 알려요`,
  'v0.80':`· <b>칸 채우기</b>: 명절 띠가 연한 분홍으로 · 오늘 칸이 살짝 떠 보여요. 요청 링은 승인 하루 · 거절 3일 뒤 사라져요\n· 접고 펼 때 달력 모양이 그 화면 값으로 바로 바뀌어요`,
  'v0.79':`· <b>달력 모양</b>: 설정 › 화면 › 달력 모양에서 "칸 채우기"를 고를 수 있어요 (근무를 연한 칸 색으로 · 오늘은 날짜 도장 · 요청은 글자 주위 링). 기본은 예전 그대로 "동그라미"예요`,
  'v0.78':`· <b>한 달 위젯</b>: 새 모양 "칸 채우기"(근무를 연한 칸 색으로 · 오늘은 날짜 도장 · 가족 메모는 보라 선) · 설정 › 홈 화면 위젯에서 예전 "동그라미"로 바꿀 수 있어요 · 근무 요청은 위젯에서도 둥근 링으로 보여요<br>
      · <b>달력</b>: 요청이 있는 날 숫자가 빨갛게 변하지 않고 링만 보여요 · 메모 칸 높이를 더 줄였어요<br>
      · <b>공유</b>: 달력 공유에 "복사하기"(클립보드에만 담아 붙여넣기) · <b>사진 스티커</b>: 투명한 PNG 는 투명 그대로`,
  'v0.77':`· <b>가족 메모</b>: 남의 달력(보기만) 날짜 창에서도 내가 쓴 가족 메모를 고치고 지울 수 있어요 · 메모 칸이 꽉 차도 글자에 맞게 보여요<br>
      · <b>가족</b>: 가족이 생기면 내 스티커를 지금 것부터 보여 줄지 앞으로 것부터 보여 줄지 고를 수 있어요 · 내 근무표를 가족에게 올리지 못하면 이유를 알려 줘요`,
  'v0.76':`· <b>위젯</b>: 한 달 위젯(‹ › 로 12월 · 내년까지, 가족 달력으로 바꿔 보기) · 큰 위젯에서는 글자도 같이 커져요<br>
      · <b>배경</b>: 설정 › 화면 › 배경에서 "종이"를 고를 수 있어요 (기본 그대로도 돼요)<br>
      · <b>달력 메모</b>: 칸이 높은 화면에서 메모 칸이 글자에 맞게 줄었어요<br>
      · <b>사용 통계</b>: 앱을 더 좋게 만들려고 어떤 기능을 얼마나 쓰는지 횟수만 모아요(내용 · 메모 · 이름은 안 모아요). 설정 › 개인정보에서 끌 수 있어요`
};
// 사용 통계: 이름만 보냄(내용 없음). 설정에서 끄면 안 보냄 · 앱(안드로이드)에서만 동작
function track(name){if(S.stats===false)return;try{if(window.AndroidBridge&&window.AndroidBridge.logEvent)window.AndroidBridge.logEvent(String(name));}catch(e){}}
function applyStats(){try{if(window.AndroidBridge&&window.AndroidBridge.setStatsEnabled)window.AndroidBridge.setStatsEnabled(S.stats!==false);}catch(e){}}
// 가족이 생기면 한 번: 내 스티커를 가족에게 어떻게 보여 줄지 (이미 켠 사람은 안 물음)
function stkAskCheck(){
  const L=S.link;if(!L||L.stkAsked)return;
  if(L.stk){L.stkAsked=1;famSaveLocal();return;}
  if(!((S.stamps&&S.stamps.defs)||[]).some(s=>s&&!s.empty&&stUsed(s)))return;   // v0.239 스티커를 한 번도 안 붙인 사람에겐 묻지 않음 (처음 붙인 뒤에 물음)
  if(!famOthers().length||!S.onboarded||ob||pageMode||$('#pop').classList.contains('open')||$('#sheet').classList.contains('open'))return;
  L.stkAsked=1;famSaveLocal();
  openPop(`<div class="mh">가족이 생겼어요<b>내 스티커를 가족에게 보여 줄까요?</b></div>
    <div class="mi" style="flex-direction:column;gap:8px"><button class="btn" style="width:100%" data-act="stkshare-now">지금 있는 스티커도 보여 줘요</button><button class="btn ghost" style="width:100%" data-act="stkshare-new">앞으로 만드는 스티커부터 보여 줘요</button><button class="btn ghost" style="width:100%" data-act="stkshare-no">안 보여 줘요</button></div>`);
}
function introNotice(){
  const v=appVersion();
  if(!v||!S.onboarded||ob||S.seenVer===v||pageMode||$('#pop').classList.contains('open')||$('#sheet').classList.contains('open'))return;
  S.seenVer=v;save();
  if(!NEWS[v])return;
  openPop(`<div class="mh">${esc(v)}<b>새로 생겼어요</b></div>
    <div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0;line-height:1.7">
      ${NEWS[v]}<br><br>
      <span style="color:var(--muted)">업데이트해도 내 데이터는 그대로예요.</span></div></div>
    <div class="mi"><button class="btn grow" data-act="pop-close">확인</button></div>`);
}
function addonNotice(){
  if(!S.onboarded||ob||S.addonNote==='done'||pageMode||coachOn||document.getElementById('tutx')||$('#pop').classList.contains('open')||$('#sheet').classList.contains('open'))return;
  const old=S.addonNote==='old';
  S.addonNote='done';save();
  openPop(`<div class="mh">${old?'일부 기능이 옮겨졌어요':'알아 두면 좋아요'}<b>설정 › 부가 기능</b></div>
    <div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0">${old?'휴무일 · 기념일, 같이 쉬는 날, 동료 근무, 근무 통계 · 수당이 <b>부가 기능</b>으로 옮겨져 꺼져 있어요.<br>쓰던 내용은 그대로 있고, 켜면 바로 돌아와요.':'앱이 단순하게 보이도록 덜 쓰는 기능은 꺼 두었어요.<br>필요하면 <b>설정 › 부가 기능</b>에서 켜세요.'}</div></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">닫기</button><button class="btn grow" data-act="addon-go">부가 기능 보기</button></div>`);
}
// 며칠 쓴 뒤 딱 한 번: 백업을 안 켠 사람에게 "백업해 둘까요?" (구글 드라이브 기능이 있는 앱에서만 · 이미 켰거나 한 번 보여줬으면 안 나옴)
function backupNudge(){
  if(!S.onboarded||ob||pageMode||S.nudgeBk||S.drive.last||!hasBridge('driveLinked')||$('#pop').classList.contains('open')||$('#sheet').classList.contains('open'))return;
  if(Date.now()-S.born<5*864e5||!(S.myset||Object.keys(S.memos||{}).length||Object.keys(S.overrides||{}).length))return;
  try{if(window.AndroidBridge.driveLinked())return;}catch(e){return;}
  S.nudgeBk=Date.now();persist();
  openPop(`<div class="mh">백업해 둘까요?<b>폰을 바꿔도 기록이 안 사라져요</b></div>
    <div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0">근무 변경 · 메모 · 설정이 지금은 이 폰에만 있어요. 구글 드라이브에 백업해 두면 폰을 바꾸거나 앱을 지워도 그대로 불러올 수 있어요. 설정 › 백업 · 복원에서 언제든 할 수 있어요.<br><span style="color:var(--muted)">이 안내는 한 번만 나와요.</span></div></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">나중에</button><button class="btn grow" data-act="nudge-bk">백업 켜기</button></div>`);
}
function appVersion(){
  try{if(window.AndroidBridge&&window.AndroidBridge.appInfo)return 'v'+JSON.parse(window.AndroidBridge.appInfo()).version;}catch(e){}
  return '';
}

/* ---------- 근무 통계 · 수당 ---------- */
function daeDays(y,m){
  let n=0;
  for(const [k,sh] of Object.entries(S.overrides)){
    const d=parse(k);
    if(d.getFullYear()===y&&d.getMonth()===m&&isRest(baseShift(d))&&!isRest(sh)&&sh!=='교')n++;
  }
  return n;
}
/* 근무 통계 · 수당 (부가 기능 stats)
 * 기간: 급여 마감일 기준 (0 = 1일 ~ 말일 · 20 = 지난달 21일 ~ 이번 달 20일)
 * 시간: 근무 패턴의 근무 시간 + ⏱ 연장(실제 출퇴근) → 근무 · 연장(8시간 넘는 부분, 대근은 전부) · 야간(기본 22~06시)
 * 예상 월급(세전 · 대략) = 고정금 + 연장 · 야간(명세서로 거꾸로 계산한 1시간 금액) + 연차수당(쓴 만큼 덜) − 무급
 * 월급 정보는 폰에만 (가족에게 안 보냄 · 백업 포함) */
let stYM=null,stLast=null,stSub='';
function payPeriod(y,m){const c=(S.salary&&S.salary.close)||0;return c?[new Date(y,m-1,c+1),new Date(y,m,c)]:[new Date(y,m,1),new Date(y,m+1,0)];}
const payHolK=k=>!!(holName(k)||(S.compHolAsHoliday&&compHol(k)));
function statsCalc(y,m){
  const [a,b]=payPeriod(y,m),o={from:a,to:b,dayN:0,days:0,work:0,ot:0,night:0,nightShifts:0,dw:[],de:[],dh:[],vac:[],unpaid:[],edu:[],holWork:[],req:[],reqH:0,reqN:0};
  for(let d=new Date(a);d<=b;d=addDays(d,1)){
    o.dayN++;const k=fmt(d),sh=shiftOf(d),base=baseShift(d);
    if(persOn(k))continue;
    if(!isRest(base)&&isRest(sh))(typeOf(sh).unpaid?o.unpaid:o.vac).push(k);
    if(sh==='교')o.edu.push(k);
    const h=dayHours(d);if(!h)continue;
    o.days++;o.work+=h.work;o.ot+=h.ot;o.night+=h.night;
    const tt=dayTimesOf(d,sh);if(tm2m(tt.end)<=tm2m(tt.start))o.nightShifts++;
    if(h.dae&&sh!=='교')(payHolK(k)?o.dh:(d.getDay()===0||d.getDay()===6)?o.de:o.dw).push(k);
    else if(payHolK(k))o.holWork.push(k);
    if(h.req){o.req.push(k);o.reqH+=h.req;o.reqN+=h.reqN;}
  }
  return o;
}
// 명세서로 1시간 금액 거꾸로: 적은 명세서들의 (금액 합 ÷ 그 기간 시간 합) · 명세서가 없으면 직접 적은 금액
function payRates(){
  const sl=(S.salary&&S.salary.slips)||{};let ot=0,oh=0,nt=0,nh=0,lv=0,lvd=0,n=0;
  for(const [ym,x] of Object.entries(sl)){
    const [y,mo]=ym.split('-').map(Number),c=statsCalc(y,mo-1);
    if(x.ot&&c.ot>0){ot+=x.ot;oh+=c.ot;}if(x.nt&&c.night>0){nt+=x.nt;nh+=c.night;}
    if(x.lv&&x.lvd){lv+=x.lv;lvd+=x.lvd;n++;}
  }
  return {ot:oh?ot/oh:S.salary.ot||0,nt:nh?nt/nh:S.salary.nt||0,lvDay:lvd?lv/lvd:0,lvDays:n?lvd/n:0,slip:oh>0||nh>0};
}
// 올해 연차 쓴 날 (1월 1일 ~ 보고 있는 기간 끝)
// v0.127 연차 새로 시작: 1월 1일(기본) 또는 입사일(월 · 일) — 보고 있는 기간 끝(to)이 속한 1년의 시작
function leaveStart(to){const f=S.salary&&S.salary.leaveFrom;if(!f||!/^\d\d-\d\d$/.test(f))return new Date(to.getFullYear(),0,1);const [mm,dd]=f.split('-').map(Number);let a=new Date(to.getFullYear(),mm-1,dd);if(a>to)a=new Date(to.getFullYear()-1,mm-1,dd);return a;}
function leaveUsed(y,to){let n=0;for(let d=leaveStart(to);d<=to;d=addDays(d,1)){const sh=shiftOf(d);if(!isRest(baseShift(d))&&isRest(sh)&&!typeOf(sh).unpaid&&!persOn(fmt(d)))n++;}return n;}
function openStatsPage(){
  if(!stYM)stYM=[cur.y,cur.m];
  const [y,m]=stYM,c=statsCalc(y,m),P=S.salary,R=payRates();stLast=c;
  const won=n=>Math.round(n).toLocaleString('ko-KR')+'원',H=h=>`${Math.round(h*10)/10}`;
  const md2=d=>`${d.getMonth()+1}/${d.getDate()}`;
  const num=(v,l,col,list)=>`<div class="stat-item"${list?` data-act="st-list" data-l="${list}" style="cursor:pointer"`:''}><div class="num" style="color:${col}">${v}</div><p class="lbl">${l}</p></div>`;
  const dv='<div class="stat-divider"></div>';
  const daeN=c.dw.length+c.de.length+c.dh.length;
  const lvUsed=c.vac.length,lvPart=R.lvDay&&R.lvDays?Math.max(0,R.lvDays-lvUsed)*R.lvDay:0;
  const unpaidAmt=P.fixed&&c.unpaid.length?P.fixed/c.dayN*c.unpaid.length:0;
  const otAmt=R.ot*c.ot,ntAmt=R.nt*c.night;
  const show=P.fixed>0||R.ot>0||R.nt>0;
  const total=P.fixed+otAmt+ntAmt+lvPart-unpaidAmt;
  const slip=(P.slips||{})[`${y}-${pad(m+1)}`];
  const yUsed=P.leaveYear?leaveUsed(y,c.to):0;
  const line=(l,v,sub,ic)=>`<div class="prow">${ic?`<span class="npi">${npi(ic)}</span>`:''}<div class="pl2">${l}${sub?`<small class="keep">${sub}</small>`:''}</div><b class="stw">${v}</b></div>`;
  const sub=stSub,M=!sub;   // v0.151 새 모양: 첫 화면은 이번 달만 · 올해 누적 · 월급 설정은 줄을 눌러 따로
  if(sub)pageBack=()=>{stSub='';openStatsPage();};
  openPage(`
    ${pageHead(sub==='pay'?'월급 설정':sub==='year'?`${y}년 누적`:'근무 통계 · 수당')}
    <div class="pg-b np stpg">${M?`
      <div class="stnav"><button class="ib" data-act="st-prev" aria-label="지난달">‹</button><b>${y}년 ${m+1}월</b><button class="ib" data-act="st-next" aria-label="다음 달">›</button>${y!==new Date().getFullYear()||m!==new Date().getMonth()?'<button class="sttoday" data-act="st-today">이번 달</button>':''}</div>
      <div class="hint keep" style="text-align:center;padding:0 16px 10px">${md2(c.from)} ~ ${md2(c.to)}${P.close?` (매달 ${P.close}일 마감)`:''}</div>
      ${daeBox(daeN,c.dw.length,c.de.length,c.dh.length,true)}
      <div class="stat-box" style="margin:10px 16px 0">${num(lvUsed,P.leaveYear?`연차 · 남은 ${Math.max(0,P.leaveYear-yUsed)}일${P.leaveFrom?` (${+P.leaveFrom.slice(0,2)}/${+P.leaveFrom.slice(3)} 기준)`:''}`:'연차/휴가','var(--stat-vac)','vac')}${dv}${num(c.edu.length,'교육','var(--stat-edu)','edu')}${dv}${num(c.req.length,'⏱ 연장','#b0661a','req')}${dv}${num(c.holWork.length,'휴일 출근','var(--sun)','hol')}</div>
      <div class="pg-sec" style="margin-top:12px">
        ${line('근무',`${c.days}일 · 야간 ${c.nightShifts}번`,'','calendar')}
        ${line('근무 시간',`${H(c.work)}시간`,`연장 ${H(c.ot)}시간 · 야간 ${H(c.night)}시간${c.reqH?` · 연장 신청 ${H(c.reqH)}시간`:''}`,'clock')}
      </div>`:''}
      ${sub==='year'?`      ${(()=>{   // 올해 누적 (1월 ~ 보고 있는 달, 급여 마감일 기준) — 횟수 · 시간만 (금액은 이번 달만)
        const A={dw:0,de:0,dh:0,vac:0,edu:0,req:0,hol:0,work:0,ot:0,night:0};
        for(let i=0;i<=m;i++){const x=statsCalc(y,i);A.dw+=x.dw.length;A.de+=x.de.length;A.dh+=x.dh.length;A.vac+=x.vac.length;A.edu+=x.edu.length;A.req+=x.req.length;A.hol+=x.holWork.length;A.work+=x.work;A.ot+=x.ot;A.night+=x.night;}
        return `<div class="hint keep" style="text-align:center;padding:8px 16px 10px">1월 ~ ${m+1}월</div>
        ${daeBox(A.dw+A.de+A.dh,A.dw,A.de,A.dh,false)}
        <div class="stat-box" style="margin:10px 16px 0">${num(A.vac,'연차/휴가','var(--stat-vac)')}${dv}${num(A.edu,'교육','var(--stat-edu)')}${dv}${num(A.req,'⏱ 연장','#b0661a')}${dv}${num(A.hol,'휴일 출근','var(--sun)')}</div>
        <div class="hint keep" style="padding:10px 16px 0;text-align:center">근무 ${H(A.work)}시간 · 연장 ${H(A.ot)}시간 · 야간 ${H(A.night)}시간</div>`;})()}`:''}
      ${M?`${show?`<div class="pg-cap">이번 달 예상 월급</div>
      <div class="pg-sec">
        ${P.fixed?line('고정금',won(P.fixed)):''}
        ${R.ot?line('+ 연장',won(otAmt),`${H(c.ot)}시간 × ${won(R.ot)}${R.slip?' (명세서로 맞춤)':''}`):''}
        ${R.nt?line('+ 야간',won(ntAmt),`${H(c.night)}시간 × ${won(R.nt)}`):''}
        ${R.lvDay?line('+ 연차수당',won(lvPart),`연차 ${lvUsed}일 써서 ${won(R.lvDay*Math.min(lvUsed,R.lvDays))} 덜`):''}
        ${unpaidAmt?line('− 무급',`−${won(unpaidAmt)}`,`${c.unpaid.length}일`):''}
        <div class="prow sttot"><div class="pl2"><b>= 예상</b></div><b class="stw">${won(total)}</b></div>
        ${slip&&slip.tot?line('실제 (명세서)',won(slip.tot),`차이 ${slip.tot-total>=0?'+':'−'}${won(Math.abs(slip.tot-total))}`):''}
      </div>
      <div class="npfoot">세금 · 4대 보험 전 금액이에요</div>`
      :''}
      <div class="pg-sec"${show?'':' style="margin-top:12px"'}>${npRow('sliders',show?'월급 설정':'예상 월급도 볼까요?',npVal(''),{tap:1,act:'st-sub',attrs:' data-v="pay"'})}${npRow('file-text','명세서로 맞추기',npVal(Object.keys(P.slips||{}).length?`${Object.keys(P.slips).length}장`:''),{tap:1,act:'slip-open'})}${npRow('chart-line','올해 누적',npVal(''),{tap:1,act:'st-sub',attrs:' data-v="year"'})}</div>
      <div style="height:16px"></div>`:''}
      ${sub==='pay'?`<div class="pg-sec" style="margin-top:8px">
        <div class="prow"><div class="pl2">고정금</div><input type="number" class="inl" id="payFixed" inputmode="numeric" min="0" value="${P.fixed||''}" placeholder="0" style="width:120px"> 원</div>
        <div class="prow"><div class="pl2">급여 마감일<small>비우면 말일</small></div><input type="number" class="inl" id="payClose" inputmode="numeric" min="0" max="28" value="${P.close||''}" placeholder="말일" style="width:70px"> 일</div>
        <div class="prow"><div class="pl2">1년 연차</div><input type="number" class="inl" id="payLeave" inputmode="numeric" min="0" max="60" value="${P.leaveYear||''}" placeholder="0" style="width:70px"> 일</div>
        ${P.leaveYear?`<div class="prow"><div class="pl2">연차 새로 시작<small>${P.leaveFrom?'입사일마다 새로 세요':'1월 1일마다 새로 세요'}</small></div><div class="chips"><button class="${P.leaveFrom?'':'on'}" data-act="leave-from" data-v="">1월 1일</button><button class="${P.leaveFrom?'on':''}" data-act="leave-from" data-v="in">입사일</button></div></div>${P.leaveFrom?`<div class="prow"><div class="pl2">입사일 (월 · 일)</div>${tpick('payLeaveFrom',`${new Date().getFullYear()}-${P.leaveFrom}`,'','date')}</div>`:''}`:''}
        <div class="prow"><div class="pl2">야간 기준</div><span class="ptm-t">${tpick('payNs',P.night[0])}<em>~</em>${tpick('payNe',P.night[1])}</span></div>
        ${R.slip?'':`<div class="prow"><div class="pl2">연장 1시간 금액</div><input type="number" class="inl" id="payOt" inputmode="numeric" min="0" value="${P.ot||''}" placeholder="0" style="width:100px"> 원</div>
        <div class="prow"><div class="pl2">야간 1시간 금액</div><input type="number" class="inl" id="payNt" inputmode="numeric" min="0" value="${P.nt||''}" placeholder="0" style="width:100px"> 원</div>`}
      </div>
`:''}
    </div>`,'stats');
}
// 대근 칸: 큰 숫자 = 전체 · 아래 줄 = 평일 · 주말 · 명절 (이번 달은 누르면 날짜 목록)
function daeBox(n,w,e,h,tap){
  const a=l=>tap?` data-act="st-list" data-l="${l}"`:'';
  return `<div class="stat-box stdae" style="margin:0 16px"><div class="stdae-n"${a('dae')}><div class="num" style="color:var(--stat-dae)">${n}</div><p class="lbl">대근</p></div>
    <div class="stdae-sub"><button${a('dw')}>평일 <b>${w}</b></button><span>·</span><button${a('de')}>주말 <b>${e}</b></button><span>·</span><button${a('dh')}>명절 · 공휴일 <b>${h}</b></button></div></div>`;
}
// 명세서로 맞추기: 그 달(마감 기준) 연장 · 야간 · 연차수당 금액 → 1시간 금액을 거꾸로
let slipYM='';
function openSlipPage(){
  const now=new Date();if(!slipYM){const d=new Date(now.getFullYear(),now.getMonth()-1,1);slipYM=`${d.getFullYear()}-${pad(d.getMonth()+1)}`;}
  const x=(S.salary.slips||{})[slipYM]||{},[y,mo]=slipYM.split('-').map(Number),c=statsCalc(y,mo-1);
  const ms=[...Array(6)].map((_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-i,1);return `${d.getFullYear()}-${pad(d.getMonth()+1)}`;});
  const inp=(id,l,v,sub,w)=>`<div class="prow"><div class="pl2" style="font-weight:500">${l}</div><input type="number" class="inl" id="${id}" inputmode="numeric" min="0" value="${v||''}" placeholder="0" style="width:${w||120}px;text-align:right"> <span class="un">${id==='slLvd'?'일':'원'}</span></div>`;
  openPage(`${pageHead('명세서로 맞추기')}
    <div class="pg-b np">
      <div class="wlchips npmc">${ms.map(k=>`<button class="${k===slipYM?'on':''}" data-act="slip-ym" data-v="${k}">${+k.slice(5)}월${(S.salary.slips||{})[k]?' ✓':''}</button>`).join('')}</div>
      <div class="hint keep" style="padding:4px 16px 10px;text-align:center">${+slipYM.slice(5)}월 명세서 기간: ${c.from.getMonth()+1}/${c.from.getDate()} ~ ${c.to.getMonth()+1}/${c.to.getDate()} · 달력으로 연장 ${Math.round(c.ot*10)/10}시간 · 야간 ${Math.round(c.night*10)/10}시간</div>
      <div class="pg-sec">
        ${inp('slOt','연장 수당',x.ot)}
        ${inp('slNt','야간 수당',x.nt)}
        ${inp('slLv','연차 수당',x.lv)}
        ${inp('slLvd','그 연차 며칠치',x.lvd,'',90)}
        ${inp('slTot','지급 총액',x.tot)}
      </div>
      ${(S.salary.slips||{})[slipYM]?'<div class="nplink" data-act="slip-del" style="color:#e5484d">이 달 명세서 지우기</div>':''}
      <div class="pg-sec" style="margin-top:12px">${npRow('help','명세서는 어떻게 적어요?',npVal(''),{tap:1,act:'slip-help'})}</div>
    </div>`,'slip');
}
function slipSet(f,v){S.salary.slips=S.salary.slips||{};const x=(S.salary.slips[slipYM]=S.salary.slips[slipYM]||{ot:0,nt:0,lv:0,lvd:0,tot:0});x[f]=Math.max(0,Math.round(+v||0));if(f==='lvd')x.lvd=Math.min(31,x.lvd);if(!x.ot&&!x.nt&&!x.lv&&!x.tot)delete S.salary.slips[slipYM];save();}
function stList(l){
  const c=stLast;if(!c)return;
  const L={dae:['대근',[...c.dw,...c.de,...c.dh].sort()],dw:['평일 대근',c.dw],de:['주말 대근',c.de],dh:['명절·공휴일 대근',c.dh],vac:['연차/휴가',c.vac],edu:['교육',c.edu],req:['⏱ 연장',c.req],hol:['휴일 출근',c.holWork]}[l];if(!L)return;
  const row=k=>{const d=parse(k),h=l==='req'?dayHours(d):null;return `<button class="mi" data-act="st-go" data-k="${k}">${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]})<small style="margin-left:auto;color:var(--muted)">${esc(shiftLabel(shiftOf(d)))}${h&&h.req?` · +${Math.round(h.req*10)/10}시간`:''}${holName(k)?' · '+esc(holName(k)):''}</small></button>`;};
  openPop(`<div class="mh">${L[0]}<b>${L[1].length}일</b></div><div class="wxlist">${L[1].map(row).join('')||'<div class="mi" style="color:var(--muted)">없어요</div>'}</div><button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);
}
/* ---------- 가족 연결 (1차: 한 폰 체험) ---------- */

/* ---------- 메모 색 ---------- */
const MEMO_PAL=['#7b5cf0','#5b8fc7','#5b8def','#2f6bf0','#0fa3b1','#1f8f75','#43a047','#f08c00','#e8590c','#c2255c','#e0455c','#8a65c9','#6b7280','#3a3d43','#795548'];
function openColorsPage(){   // v0.151 새 모양 · 가족 메모는 보라 고정 → 나만 보는 메모 색만 (보라 계열은 빼서 헷갈리지 않게)
  const c=S.memoColors,pal=MEMO_PAL.filter(x=>!isPurple(x));
  openPage(`${pageHead('메모 색')}
    <div class="pg-b np">
      <div class="pg-cap">미리보기</div>
      <div class="pg-sec">
        <div class="mcard fam" style="cursor:default;margin:12px 12px 6px"><div class="mt2">아빠 생신 저녁 7시</div></div>
        <div class="mcard my" style="cursor:default;margin:0 12px 12px"><div class="mt2">차 정기점검</div></div>
      </div>
      <div class="pg-cap">나만 보는 메모 색</div>
      <div class="pg-sec"><div class="npdots">${pal.map(x=>`<button class="${c.my===x?'on':''}" style="background:${x}" data-act="mcolor" data-k="my" data-v="${x}" aria-label="색"></button>`).join('')}</div></div>
      <div class="nplink" data-act="mcolor-reset">기본 색으로</div>
    </div>`,'colors');
}
const isPurple=h=>{const [r,g,b]=hexRgb(h);return b>150&&r>90&&g<130&&r<200;};

/* ---------- 근무 패턴 · 근무타입 · 조 ---------- */
// 같은 근무가 이어지는 칸에 "첫날·둘째날" 이름 붙이기
function posLabels(pat,nm,rs){
  nm=nm||shiftLabel;rs=rs||isRest;const out=[];
  for(let i=0;i<pat.length;i++){
    const s=pat[i];let start=i;while(start>0&&pat[start-1]===s)start--;
    let end=i;while(end<pat.length-1&&pat[end+1]===s)end++;
    const n=i-start+1,len=end-start+1;
    const name=rs(s)?(start>0?`${nm(pat[start-1])} 후 ${nm(s)}`:nm(s)):nm(s);
    out.push(len>1?`${name} ${['첫날','둘째날','셋째날','넷째날','다섯째날','여섯째날'][n-1]||n+'일째'}`:name);
  }
  return out;
}
const PAT_MAX=60,TEAM_MAX=8;
const patPos=d=>{const n=S.pattern.length;return((dayNum(d)-dayNum(parse(S.anchor)))%n+n)%n;};
// 조 g 의 오늘 칸 번호
const teamPos=(g,d)=>{const n=S.pattern.length,o=S.teamOffsets;return((patPos(d)+(o[g]||0)-(o[S.myTeam]||0))%n+n)%n;};
const quickN=()=>S.quickN===4||S.quickN===8?S.quickN:(new Set(S.pattern||[]).size>=5?8:4);
// 근무타입 목록에 보일 시간 (v0.109): 정했으면 "07:00 → 19:00" · 안 정했으면 "시간 정하기" · 쉬는 타입 "쉬는 날"
// 출근 → 퇴근 총 시간 (퇴근이 더 이르면 다음날로 셈)
function totH(a,b){let m=tm2m(b)-tm2m(a);if(m<=0)m+=1440;return fmtH(m/60);}
function typeTimeTxt(x){
  if(x.rest||x.k===NONE_K)return '쉬는 날';
  if(!timesCustom(x.k))return '시간 정하기 ›';
  const t=timesOf(x.k);return `${t.start} → ${tm2m(t.end)<=tm2m(t.start)?'다음날 ':''}${t.end} · ${totH(t.start,t.end)}`;
}
function typeListHtml(){
  // v0.145: 근무 종류 = 칩 줄(꾹 눌러 끌기 · 추가) + 근무마다 시간 줄 + 바로 보이는 개수
  return `<div class="pg-cap pcap">근무 종류</div>
    <div class="pg-sec">
      <div class="tchipgrid" id="tlist" style="padding:14px 12px 6px">${S.types.map((x,i)=>`<div class="tl2 tl ${i<quickN()?'top4':''}" data-i="${i}" data-act="type-edit-page" data-s="${esc(x.k)}">${badge(x.k,'sm')}<small>${esc(x.name)}</small></div>`).join('')}<button class="tl2 add" data-act="type-pick-page"><i>＋</i><small>추가</small></button></div>
      <!-- v0.171 근무마다 시간 줄 뺌 (시간 = 근무 칩 → 편집 창 · 출퇴근 시간 · 날씨) -->
      ${npRow('calendar-days','보이는 개수',`<div class="npseg sm"><button class="${S.quickN?'':'on'}" data-act="quickn" data-v="0">자동</button><button class="${S.quickN===4?'on':''}" data-act="quickn" data-v="4">4개</button><button class="${S.quickN===8?'on':''}" data-act="quickn" data-v="8">8개</button></div>`)}
    </div>`;
}
// 근무타입 칩 · 패턴 칸을 꾹 눌러 끌어서 순서 바꾸기 (S.types · S.pattern 순서가 그대로 저장됨 · 바로 반영)
let gdg=null;
document.addEventListener('pointerdown',e=>{
  const el=e.target.closest&&e.target.closest('#tlist .tl,#pgrid .pc,.stgrid [data-act="slot-open"],.mstgrid [data-act="mslot-open"],.mygrid [data-act="mine-open"]');if(!el||(e.button&&e.button>0))return;
  const ms=el.dataset.act==='mslot-open',mn=el.dataset.act==='mine-open',kind=mn?'mine':ms?'mslot':el.classList.contains('tl')?'type':el.classList.contains('pc')?'pat':'slot',grid=kind==='slot'||ms||mn?el.closest('.stgrid'):null,sel=mn?'[data-act="mine-open"]':ms?'[data-act="mslot-open"]':'[data-act="slot-open"]',idx=grid?[...grid.querySelectorAll(sel)].indexOf(el):+el.dataset.i;
  gdg={id:e.pointerId,kind,grid,sel,from:idx,over:idx,el,x0:e.clientX,y0:e.clientY,on:false};
  gdg.t=setTimeout(()=>{if(gdg&&!gdg.on){const g=gdg;g.on=true;g.el.classList.add('drag');g.items=g.grid?[...g.grid.querySelectorAll(g.sel)]:[...document.querySelectorAll(g.kind==='type'?'#tlist .tl':'#pgrid .pc')];g.rects=g.items.map(r=>r.getBoundingClientRect());g.items.forEach(r=>{if(r!==g.el)r.style.transition='transform .2s cubic-bezier(.2,.9,.25,1)';});buzz(10);}},380);
},true);
document.addEventListener('pointermove',e=>{
  const g=gdg;if(!g||e.pointerId!==g.id)return;
  if(!g.on){if(Math.hypot(e.clientX-g.x0,e.clientY-g.y0)>10){clearTimeout(g.t);gdg=null;}return;}
  g.el.style.transform=`translate(${e.clientX-g.x0}px,${e.clientY-g.y0}px)`;
  const items=g.items,R=g.rects;let o=g.over;   // v0.222 처음 자리(그대로 둔 칸 위치)로 맞춰 봄 · 제자리로 돌아오면 원래대로
  R.forEach((b,i)=>{if(e.clientX>=b.left&&e.clientX<=b.right&&e.clientY>=b.top&&e.clientY<=b.bottom)o=i;});
  if(o!==g.over){g.over=o;const ord=items.map((r,i)=>i);ord.splice(o,0,ord.splice(g.from,1)[0]);
    items.forEach((r,i)=>{if(r===g.el)return;const j=ord.indexOf(i);r.style.transform=j===i?'':`translate(${R[j].left-R[i].left}px,${R[j].top-R[i].top}px)`;});buzz(5);}
},true);
// 끄는 중에는 화면이 같이 스크롤되지 않게
// v0.138 화면 전체(document)에 막는 손가락 처리를 두면 달력 가로 스크롤도 앱을 기다려야 함 → 끌기가 있는 곳(설정 페이지 · 팝업)에만
['#page','#pop'].forEach(s=>{const el=document.querySelector(s);if(el)el.addEventListener('touchmove',e=>{if(gdg&&gdg.on&&e.cancelable)e.preventDefault();},{passive:false,capture:true});});
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,e=>{
  const g=gdg;if(!g||e.pointerId!==g.id)return;
  clearTimeout(g.t);gdg=null;
  if(!g.on)return;
  (g.items||[]).forEach(r=>{r.style.transition='';r.style.transform='';});g.el.classList.remove('drag');
  held=true;setTimeout(()=>{held=false;},60);
  if(ev==='pointerup'&&g.over!==g.from){
    if(g.kind==='mine'){const L=[...g.grid.querySelectorAll(g.sel)];L.splice(g.over,0,L.splice(g.from,1)[0]);S.mineOrd=L.map(b=>b.dataset.key).slice(0,80);save();openStampPage();return;}
    if(g.kind==='mslot'){const m=manMember();if(m){const ids=[...g.grid.querySelectorAll(g.sel)].map(b=>b.dataset.id);ids.splice(g.over,0,ids.splice(g.from,1)[0]);const L=manSdefs(m),rest=L.filter(x=>!ids.includes(x.id));m.sdefs=ids.map(id=>L.find(x=>x.id===id)).filter(Boolean).concat(rest);save();}openManStkPage();return;}
    if(g.kind==='slot'){   // 같은 묶음(내 스티커 · ＋로 붙인 스티커) 안에서 순서만 바꿈 → 달력에서 보이는 우선순위
      const ids=[...g.grid.querySelectorAll('[data-act="slot-open"]')].map(b=>b.dataset.id);
      ids.splice(g.over,0,ids.splice(g.from,1)[0]);
      const defs=S.stamps.defs,pos=ids.map(id=>defs.findIndex(x=>x.id===id)).sort((a,b)=>a-b),objs=ids.map(id=>defs.find(x=>x.id===id));
      pos.forEach((ix,i)=>{defs[ix]=objs[i];});
      save();render();openStampPage();return;
    }
    const a=g.kind==='type'?S.types:S.pattern;a.splice(g.over,0,a.splice(g.from,1)[0]);save();render();}
  if(g.kind==='mslot')openManStkPage();else if(g.kind==='slot'||g.kind==='mine')openStampPage();else openPatternPage();
},true));
/* ---- 1번째 칸 시작 날 바꾸기 = 큰일: 자동 백업 + 바꾸기 전 패턴을 "그 날 이전 구간"으로 간직 ---- */
let patSnap=null,ancNew=null;
const ANC_KEY='eonjeswieo:before-anchor';
function askAnchor(nv){
  if(nv===S.anchor){openPatternPage();return;}
  ancNew=nv;
  const snap=patSnap||{pattern:S.pattern.slice(),anchor:S.anchor};
  const drop=(S.patOld||[]).filter(o=>o.until>=nv).length;
  const d=parse(nv);
  openPop(`<div class="mh">시작 날 바꾸기<b>${d.getMonth()+1}월 ${d.getDate()}일부터 1번째 칸</b></div>
    <div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0">먼저 <b>자동 백업</b>해요. 이 날 이전은 지금까지 쓰던 패턴이 그대로 남아요.${drop?` (이전 구간 ${drop}개 정리)`:''}</div></div>
    <div class="mi" style="gap:8px;flex-direction:column"><button class="btn" style="width:100%" data-act="anc-keep">이 날부터 새 패턴 (이전은 그대로)</button><button class="btn ghost" style="width:100%" data-act="anc-all">처음부터 전부 바꾸기</button><button class="btn ghost" style="width:100%" data-act="anc-cancel">취소</button></div>`);
}
function ancBackup(){
  try{
    const data=backupData();
    if(hasBridge('driveLinked')&&window.AndroidBridge.driveLinked()&&hasBridge('driveBackup')){window.AndroidBridge.driveBackup(JSON.stringify(data),JSON.stringify(backupMeta()),true);autoSilent=true;}
    localStorage.setItem(ANC_KEY,JSON.stringify(data));   // 폰 안에도 한 번 (드라이브를 안 쓰는 사람용 · 가장 최근 1개)
  }catch(e){}
}
function ancApply(keep){
  const nv=ancNew;if(!nv)return;ancNew=null;
  const snap=patSnap||{pattern:S.pattern.slice(),anchor:S.anchor};
  ancBackup();
  if(keep){
    S.patOld=(S.patOld||[]).filter(o=>o.until<nv);
    S.patOld.push({until:nv,pattern:snap.pattern.slice(),anchor:snap.anchor});
    S.patOld.sort((a,b)=>a.until<b.until?-1:1);
    if(S.patOld.length>20)S.patOld=S.patOld.slice(-20);
  }
  S.anchor=nv;patSnap={pattern:S.pattern.slice(),anchor:S.anchor};
  save();render();closePop();openPatternPage();
  toast(keep?'바꿨어요 · 이전 날짜는 옛 패턴 그대로예요':'바꿨어요 · 전체를 새 패턴으로 계산해요');
}
function restoreAnchorBackup(){
  let d=null;try{d=JSON.parse(localStorage.getItem(ANC_KEY)||'null');}catch(e){}
  if(!d){toast('되돌릴 백업이 없어요');return;}
  if(!confirm('시작 날을 바꾸기 직전 상태로 되돌릴까요?\n(그 뒤에 바꾼 근무 · 메모도 그때 상태로 돌아가요)'))return;
  if(applyBackup(d)){patSnap=null;render();openPatternPage();toast('바꾸기 전 상태로 되돌렸어요');}
}
function openPatOld(){
  const po=S.patOld||[];
  const lb=po.map((o,i)=>{const from=i?po[i-1].until:'';const u=parse(o.until);const f=from?parse(from):null;
    return `<div class="prow"><div class="pl2">${f?`${f.getMonth()+1}/${f.getDate()}`:'처음'} ~ ${u.getMonth()+1}/${u.getDate()} 전까지<small>${o.pattern.length}일 반복 · 시작 ${o.anchor.slice(5).replace('-','/')}</small></div><div class="pv" style="display:flex;gap:2px">${o.pattern.slice(0,8).map(k=>badge(k,'xs')).join('')}</div></div>`;}).join('');
  openPop(`<div class="mh">이전 패턴<b>시작 날을 바꾸기 전 패턴이에요</b></div><div class="mi" style="display:block;padding:0">${lb||'<div class="hint">없어요</div>'}</div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pat-old-clear">이전 패턴 지우기</button><button class="btn grow" data-act="pop-close">닫기</button></div>`);
}
// v0.119 근무 패턴에도 위치 (집 · 직장) — 가족 "일정 패턴" 과 같은 자리 · 누르면 출퇴근 날씨 설정
function patLocHtml(row){if(!wxOn())return '';const h=wxOk(S.wx.home)?wxName(S.wx.home):'',w=wxOk(wxWk())&&wxWk()!==S.wx.home?wxName(wxWk()):'';
  const r=npRow('map-pin','위치',npVal(h?`${esc(h)}${w?` · ${esc(w)}`:''}`:'정하기'),{tap:1,act:'pat-loc'});return row?r:`<div class="pg-sec" style="margin-top:12px">${r}</div>`;}
function patResetOpen(q){
  const n=new Date(),y=n.getFullYear(),m=n.getMonth(),ks=Object.keys(S.overrides||{}).sort();
  const r=q==='n'?[fmt(new Date(y,m+1,1)),fmt(new Date(y,m+2,0))]:q==='a'?[ks[0]||fmt(n),ks[ks.length-1]||fmt(n)]:[fmt(new Date(y,m,1)),fmt(new Date(y,m+1,0))];
  openPop(`<div class="mh">직접 바꾼 근무를 패턴대로 되돌려요<b>패턴 제외 초기화</b></div><div class="mbody">
    <div class="row" style="gap:8px;margin:10px 0"><input type="date" id="prS" value="${r[0]}" style="flex:1"><span>~</span><input type="date" id="prE" value="${r[1]}" style="flex:1"></div>
    <div class="chips left">${[['m','이번 달'],['n','다음 달'],['a','전체']].map(([v,l])=>`<button class="${q===v?'on':''}" data-act="pr-q" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="row" style="margin-top:14px;gap:8px"><button class="btn ghost" style="flex:1" data-act="pop-close">취소</button><button class="btn danger-fill" style="flex:1" data-act="pr-go">초기화</button></div></div>`);
}
// v0.171 동료 근무 화면 (부가 기능): 조별 근무(오늘부터 · 조 맞추기) · 한 달 표 · 조 이름 · 개수 — 근무 패턴 화면에서 옮김
function teamGridHtml(){
  const n=S.pattern.length,t0=new Date();
  const tc=teamCount(),cols=Math.min(n,10);
  const days=[...Array(cols)].map((_,i)=>addDays(t0,i));
  let tg=`<span></span>${days.map((d,i)=>`<span class="th ${i===0?'t':''}">${i===0?'오늘':DOW[d.getDay()]}<br>${d.getDate()}</span>`).join('')}<span></span>`;
  for(let g=0;g<tc;g++){
    const me=g===S.myTeam,p=teamPos(g,t0);
    tg+=`<button class="tn ${me?'me':''}" data-act="trow" data-g="${g}" data-hold="team">${esc(teamName(g))}${me?'<small>내 조</small>':''}</button>`
      +days.map((d,i)=>`<span class="tc ${me?'me':''}" data-act="trow" data-g="${g}">${badge(S.pattern[(p+i)%n],'xs')}</span>`).join('')
      +(me?'<span></span>':`<span class="ta"><button data-act="toff" data-g="${g}" data-v="1" aria-label="왼쪽으로">‹</button><button data-act="toff" data-g="${g}" data-v="-1" aria-label="오른쪽으로">›</button></span>`);
  }
  return `<div class="tgrid" style="--cols:${cols};padding:10px 8px 4px">${tg}</div>`;
}
let colM=null;
function openColleaguePage(){
  const t0=new Date();if(!colM)colM={y:t0.getFullYear(),m:t0.getMonth()};
  const tc=teamCount(),ok=tc>1&&!S.noPat&&S.pattern.length>1;
  const my=teamName(S.myTeam);
  openPage(`${pageHead('동료 근무')}
    <div class="pg-b np">
      ${ok?`<div class="pg-cap">조별 근무</div><div class="pg-sec">${teamGridHtml()}</div>
      <div class="pg-cap">한 달</div>
      <div class="pg-sec colm"><div class="colmh"><button data-act="col-mon" data-v="-1" aria-label="이전 달">${npi('chevron-left',20)}</button><b>${colM.y===t0.getFullYear()?'':colM.y+'년 '}${colM.m+1}월</b><button data-act="col-mon" data-v="1" aria-label="다음 달">${npi('chevron-right',20)}</button></div>${renderColleague(colM.y,colM.m)}</div>`:''}
      <div class="pg-cap">조</div>
      <div class="pg-sec">
        ${npRow('users','조 이름 · 개수 고치기',npVal(tc>1?tc+'개':''),{tap:1,act:'tedit'})}
        ${tc>1?npRow('user','내 조',npVal(`<b style="color:var(--accent);font-weight:800">${esc(my)}</b>`),{tap:1,act:'col-mine'}):''}
      </div>
    </div>`,'colleague');
}
const teamRefresh=()=>{if(pageMode==='colleague')openColleaguePage();else openPatternPage();};
function openPatternPage(){
  // v0.145 새 모양: 위 칸(근무 이름 · 반복 · 오늘 칸 · 패턴 칸) · 근무 종류 · 패턴 설정 · 조별 근무 · 기타 · 설명 줄 없음
  const resetRow=npRow('eraser','패턴 제외 초기화',npVal(''),{tap:1,act:'pat-reset'});
  const persRow=npRow('user','개인 캘린더로 쓰기',npVal(''),{tap:1,act:'personal-on'});
  if(S.noPat){   // 정해진 순서가 없을 때: 순서 만들기 · 칠하기만
    openPage(`${pageHead('근무 패턴')}
      <div class="pg-b np">
        <div class="pg-sec" style="margin-top:8px">
          ${npRow('rotate-ccw',S.myset?'정해진 순서로 만들기':'내 근무표 만들기',npVal(''),{tap:1,act:'redo-onboard'})}
          ${npRow('paintbrush','달력에 칠하기',npVal(''),{tap:1,act:'paint-open'})}
          ${patLocHtml(1)}
          ${Object.keys(S.overrides).length?resetRow:''}
        </div>
        ${typeListHtml()}
        <div class="pg-cap">기타</div><div class="pg-sec">${persRow}</div>
      </div>`,'pattern');
    return;
  }
  const n=S.pattern.length,t0=new Date(),cp=patPos(t0),lb=posLabels(S.pattern);
  const tc=teamCount();
  const ct=typeOf(S.pattern[cp]),cc=ct&&tColors(ct)?tColors(ct).bg:'var(--accent)';
  const undoA=(()=>{try{return localStorage.getItem(ANC_KEY)?npRow('rotate-ccw','시작 날 바꾸기 전으로',npVal(''),{tap:1,act:'pat-undo-anchor'}):'';}catch(e){return '';}})();
  openPage(`
    ${pageHead('근무 패턴')}
    <div class="pg-b np">
      <section class="nphero nppat" style="--sc:${cc}">
        <div class="npht">${n}일 반복${tc>1?` · ${esc(teamName(S.myTeam))}`:''}</div>
        <div class="nphn">${esc(S.patternName||'내 근무')}</div>
        <div class="nphs">오늘은 <b>${cp+1}번째 칸</b> · ${esc(lb[cp])}</div>
        ${S.patWeek?`<div class="pgdow">${weekOrder().map(w=>`<span class="${w===0?'su':w===6?'sa':''}">${DOW[w]}</span>`).join('')}</div>`:''}
        <div class="pgrid ${S.patWeek?'wk7':''}" id="pgrid">${S.patWeek?'<i class="pgb"></i>'.repeat((parse(S.anchor).getDay()-(S.weekStart||0)+7)%7):''}${S.pattern.map((s,i)=>`<button class="pc ${i===cp?'pnow':''}" data-act="pcell" data-i="${i}">${badge(s,'sm')}<small>${i+1}</small></button>`).join('')}</div>
        <div class="nphb">${n<PAT_MAX?`<button data-act="padd">${npi('plus',16)}칸 추가</button>`:''}${n>2?`<button data-act="pdel">${npi('minus',16)}칸 빼기</button>`:''}</div>
      </section>
      ${typeListHtml()}
      <div class="pg-cap">패턴 설정</div>
      <div class="pg-sec">
        ${npRow('tag','근무 이름',`<input type="text" class="inl" id="patternName" value="${esc(S.patternName||'')}" placeholder="예: 4조2교대" maxlength="20">`)}
        ${npRow('calendar','1번째 칸 시작 날',tpick('anchor',S.anchor,'','date'))}
        ${(S.patOld||[]).length?npRow('history','이전 패턴 보기 · 지우기',npVal(S.patOld.length+'개'),{tap:1,act:'pat-old-show'}):''}
        ${undoA}
        ${npRow('calendar-off','공휴일엔 쉬어요',`<label class="sw"><input type="checkbox" id="holRest" ${S.holRest?'checked':''}><i></i></label>`)}
        ${npRow('circle-dot','바꾼 날 빨간 점',`<label class="sw"><input type="checkbox" id="ovDot" ${S.ovDot!==false?'checked':''}><i></i></label>`)}
        ${npRow('calendar-days','요일 보기',`<label class="sw"><input type="checkbox" id="patWeek" ${S.patWeek?'checked':''}><i></i></label>`)}
        ${npRow('paintbrush','달력에 칠하기',npVal(''),{tap:1,act:'paint-open'})}
        ${patLocHtml(1)}
        ${resetRow}
      </div>
      <div class="pg-cap">기타</div>
      <div class="pg-sec">${persRow}${npRow('rotate-ccw','처음 시작 설정 다시 하기',npVal(''),{tap:1,act:'redo-onboard'})}</div>
    </div>`,'pattern');
}
/* 근무 패턴 화면 맨 아래 "🕐 근무 시간 (선택)": 근무 종류마다 출근 → 퇴근 (식사 · 수면 등 자세히는 근무 시간 화면)
 * 정한 시간은 출퇴근 날씨 · 가족 탭 "몇 시 끝" · 가족 폰 · 근무 통계(연장 · 야간 시간)에 쓰여요 */
let patTmOpen=false;
// 근무 시간은 여기 한 곳 (v0.107): 가족 탭 내 카드 · 날씨 설정 시간 줄 → 근무 패턴 화면의 근무 시간 칸을 펼친 채로
function openPatTimes(back){   // v0.109: 근무 시간은 근무타입 편집 창 — 지금(또는 다음) 근무의 편집 창을 바로 엶
  const d=new Date();let k=shiftOf(d);for(let i=0;i<14&&isRest(k);i++)k=shiftOf(addDays(d,i+1));
  const wt=workTypes(),x=!isRest(k)?typeOf(k):wt[0];if(!x){openPatternPage();return;}
  typeReturn='time';typeDraft={isNew:false,orig:x.k,k:x.k,name:x.name,color:x.color,rest:!!x.rest};openTypeEdit();
}
function patTimesHtml(){
  const wt=workTypes();if(!wt.length||!S.myset)return '';
  const set=wt.some(t=>timesCustom(t.k));
  return `<div class="pg-sec ptm"><div class="prow tap" data-act="ptm-tog"><div class="pl2">🕐 근무 시간 <span style="color:var(--muted);font-weight:600">(선택)</span></div><div class="pv">${patTmOpen?'▴':set?'정함 ›':'›'}</div></div>
    ${patTmOpen?wt.map((t,i)=>{const x=timesOf(t.k);return `<div class="prow"><div class="pl2">${badge(t.k,'sm','')} ${esc(t.name)}</div><span class="ptm-t">${tpick('ptS_'+i,x.start)}<em>→</em>${tm2m(x.end)<=tm2m(x.start)?'<small>다음날</small>':''}${tpick('ptE_'+i,x.end)}</span></div>`;}).join('')
      :''}</div>`;
}
// 패턴 칸 누르면: 어떤 근무로 할까요?
function openPatCell(i){
  const n=S.pattern.length,t0=new Date(),d=addDays(t0,((i-patPos(t0))%n+n)%n);
  openPop(`<div class="mh">${i+1}번째 칸 (${d.getMonth()+1}/${d.getDate()} ${DOW[d.getDay()]})<b>어떤 근무로 할까요?</b></div>
    <div class="mi"><div class="tchips">${S.types.map(x=>`<button class="tchip ${S.pattern[i]===x.k?'on':''}" data-act="pset" data-i="${i}" data-s="${esc(x.k)}">${badge(x.k,'tc')}<small>${esc(x.name)}</small></button>`).join('')}</div></div>
    <div class="mi"><button class="btn ghost grow" data-act="pop-close">닫기</button></div>`);
}
// 줄 누르면: 오늘 이 조 근무는?
function openTeamToday(g){
  const t0=new Date(),p=teamPos(g,t0),lb=posLabels(S.pattern);
  openPop(`<div class="mh">${esc(teamName(g))}${g===S.myTeam?' (내 조)':''}<b>오늘(${t0.getMonth()+1}/${t0.getDate()}) ${esc(teamName(g))} 근무는?</b></div>
    <div class="mi" style="display:block"><div class="pos" style="margin-top:0">${S.pattern.map((k,i)=>`<button class="${i===p?'on':''}" data-act="tpos" data-g="${g}" data-p="${i}">${badge(k)}<small>${esc(lb[i])}</small></button>`).join('')}</div></div>
    <div class="mi"><button class="btn ghost grow" data-act="pop-close">닫기</button></div>`);
}
function setTeamPos(g,p){
  const n=S.pattern.length,t0=new Date(),o=S.teamOffsets,cur=teamPos(g,t0);
  if(p===cur){closePop();return;}
  if(g===S.myTeam){
    if(!confirm('내 조 근무를 바꾸면 내 달력 근무도 같이 바뀌어요.\n바꿀까요?'))return;
    const delta=p-cur;S.anchor=addK(S.anchor,-delta);o[g]=(o[g]||0)+delta;
  }else o[g]=(((o[g]||0)+p-cur)%n+n)%n;
  save();closePop();teamRefresh();toast(`${teamName(g)} 오늘 근무를 맞췄어요`);
}
function openTeamMenu(g){
  const me=g===S.myTeam;
  openPop(`<div class="mh">조<b>${esc(teamName(g))}</b></div>
    ${me?'':`<button class="mi" data-act="tmine" data-g="${g}">⭐ 내 조로 하기</button>`}
    <button class="mi" data-act="tedit" data-g="${g}">✏️ 이름 고치기</button>
    ${me||teamCount()<2?'':`<button class="mi" data-act="tdel" data-g="${g}" style="color:var(--danger)">－ 이 조 빼기</button>`}
    <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);
}
/* 조 이름 · 개수: 이름은 직접 쓰고, ✕ 로 빼고, ＋ 로 넣고, ⭐ 로 내 조 */
let tEd=null;
function openTeamEdit(focus){
  tEd={rows:[...Array(teamCount())].map((_,g)=>({name:teamName(g),off:S.teamOffsets[g]||0,orig:g})),my:S.myTeam};
  renderTeamEdit(focus);
}
function tEdPull(){if(!tEd)return;document.querySelectorAll('#pop .tnm').forEach(x=>{const r=tEd.rows[+x.dataset.i];if(r)r.name=x.value;});}
function renderTeamEdit(focus){
  const r=tEd.rows;
  openPop(`<div class="mh">조 이름 · 개수<b>회사에서 부르는 이름으로 (예: 5팀)</b></div>
    ${r.map((x,i)=>`<div class="mi ted"><button class="tstar ${i===tEd.my?'on':''}" data-act="ted-my" data-i="${i}" aria-label="내 조">${i===tEd.my?'⭐':'☆'}</button><input type="text" class="tnm" data-i="${i}" value="${esc(x.name)}" maxlength="6" placeholder="조 이름">${i===tEd.my?'<span class="tmy">내 조</span>':r.length>1?`<button class="xbtn" data-act="ted-del" data-i="${i}" aria-label="빼기">✕</button>`:'<span class="tmy"></span>'}</div>`).join('')}
    ${r.length<TEAM_MAX?'<button class="mi" data-act="ted-add" style="justify-content:center;color:var(--accent);font-weight:700">＋ 조 추가</button>':''}
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">취소</button><button class="btn grow" data-act="ted-save">저장</button></div>`);
  const f=focus!=null&&document.querySelector(`#pop .tnm[data-i="${focus}"]`);if(f)f.focus();
}
function teamEdAdd(){
  tEdPull();const n=S.pattern.length,r=tEd.rows,used=new Set(r.map(x=>((x.off%n)+n)%n));
  let v=0;for(let i=0;i<n;i++){if(!used.has(i)){v=i;break;}}
  const names=new Set(r.map(x=>x.name.trim()));let j=0;while(names.has(String.fromCharCode(65+j)+'조'))j++;
  r.push({name:String.fromCharCode(65+j)+'조',off:v,orig:null});renderTeamEdit(r.length-1);
}
function teamEdSave(){
  tEdPull();const r=tEd.rows,my=tEd.my;
  const names=r.map((x,i)=>x.name.trim().slice(0,6)||String.fromCharCode(65+i)+'조');
  const added=r.some(x=>x.orig==null);
  S.teamOffsets=r.map(x=>x.off);S.teamNames=names;S.teamStyle='custom';S.myTeam=my;
  // 가족 중 교대근무: 원래 조를 따라감 (빠진 조였으면 내 조로)
  (S.family||[]).forEach(m=>{if(m.team==null)return;const i=r.findIndex(x=>x.orig===m.team);m.team=i<0?null:i;});
  tEd=null;save();closePop();teamRefresh();
  toast(added?'새 조는 줄을 눌러 오늘 근무를 맞춰 주세요':'조를 저장했어요');
}
function teamDel(g){
  if(g===S.myTeam||teamCount()<2)return;
  if(!confirm(`${teamName(g)}을(를) 뺄까요?`))return;
  S.teamOffsets.splice(g,1);if(Array.isArray(S.teamNames))S.teamNames.splice(g,1);
  if(S.myTeam>g)S.myTeam--;
  (S.family||[]).forEach(m=>{if(m.team==null)return;if(m.team===g)m.team=S.myTeam;else if(m.team>g)m.team--;});
  save();closePop();openPatternPage();
}

/* ---------- 회사 휴무일 ---------- */
let chDraft={date:'',name:'',yearly:true,kind:'memo',emoji:'🎂',rem:[1],remAt:'20:00'},chOpen=false,remEd=null;
const ANNIV_EMOJI=['🎂','💍','🎉','🕯','⭐','🌸','🎁','🏥','✈️','📌'];
const OFF_EMOJI=['🏢','🏭','🏬','🎌','🏖','📌'];
function holNext(x){return ddayNext(x);}
function openCompPage(){
  const list=[...(S.companyHols||[])].sort((a,b)=>holNext(a).localeCompare(holNext(b)));
  const when=x=>x.yearly?`매년 ${+x.date.slice(5,7)}월 ${+x.date.slice(8)}일`:`${x.date.slice(0,4)}년 ${mdw(x.date)}`;
  const left=x=>{const n=dDiff(holNext(x));return n===0?'오늘':n===1?'내일':n>0?`${n}일 뒤`:'지남';};
  const row=x=>`<div class="prow hrow tap" data-act="comp-row" data-id="${x.id}">   <!-- v0.198 줄은 깔끔하게 · 누르면 작은 창에서 휴무/메모만 · 아이콘 · 알림 · 삭제 -->
      <span class="hic">${ico(x.emoji||(x.kind==='memo'?'⭐':'🏢'))}</span>
      <div class="pl2">${esc(x.name)}<small class="keep">${when(x)} · ${left(x)} · ${x.kind==='memo'?'메모만':'휴무'}${x.rem.length?` · 알림 ${remShort(x)}`:''}</small></div>
      <div class="pv">›</div></div>`;
  const d=chDraft,memo=d.kind==='memo';
  openPage(`
    ${pageHead('휴무일 · 기념일')}
    <div class="pg-b np">
      ${list.length?`<div class="pg-sec" style="margin-top:8px">${list.map(row).join('')}</div>`:chOpen?'':`<div class="npempty"><div class="ei">${npi('calendar',26)}</div>아직 없어요</div>`}
      ${chOpen?`<div class="pg-cap">추가하기</div>
      <div class="pg-sec" style="padding:14px 16px">
        <div class="npseg"><button class="${memo?'':'on'}" data-act="ch-kind" data-v="off">휴무로 표시</button><button class="${memo?'on':''}" data-act="ch-kind" data-v="memo">메모만</button></div>
        <div class="row" style="margin-top:10px"><button class="chi" data-act="ch-ico" aria-label="아이콘">${ico(d.emoji||(memo?'🎂':'🏢'))}</button><input type="text" id="chName" placeholder="${memo?'이름 (예: 결혼기념일)':'이름 (예: 창립기념일)'}" value="${esc(d.name)}" maxlength="20" style="flex:1"></div>
        <div class="prow" style="padding:10px 0 0;min-height:0;border:0"><div class="pl2">날짜</div>${tpick('chDate',d.date,'','date')}</div>
        <label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:14px"><input type="checkbox" id="chYearly" ${d.yearly?'checked':''}> 매년 반복</label>
        <div class="prow" style="padding:8px 0 0;min-height:0;border:0"><div class="pl2">알림</div><button class="tbtn" data-act="rem-open" data-id="__draft"><span>${d.rem.length?`${remShort(d)} · ${remAtLabel(d.remAt)}`:'안 받음'}</span></button></div>
        <button class="btn" style="width:100%;margin-top:12px" data-act="comp-add">추가</button>
      </div>`:`<div class="npbtn"${list.length?'':' style="padding-top:0"'}><button class="btn" data-act="comp-open">휴무일 · 기념일 추가</button></div>`}
      <div class="pg-sec"${chOpen?' style="margin-top:12px"':''}>
        ${npRow('building','휴무일 출근은 휴일 근무로',`<label class="sw"><input type="checkbox" id="compHolAsHoliday" ${S.compHolAsHoliday?'checked':''}><i></i></label>`)}
      </div>
    </div>`,'comp');
}
function chPull(){const n=$('#chName'),y=$('#chYearly'),dt=$('#chDate');if(n)chDraft.name=n.value;if(y)chDraft.yearly=y.checked;if(dt)chDraft.date=dt.value;}
// 알림 고르기 창: 며칠 전(여러 개) + 시각
function openRem(id){
  if(id==='__draft')chPull();
  const x=id==='__draft'?chDraft:(S.companyHols||[]).find(y=>y.id===id);if(!x)return;
  remEd={id,rem:[...(x.rem||[])],at:x.remAt||'20:00',name:x.name};
  renderRem();
}
function renderRem(){
  const r=remEd;if(!r)return;
  openPop(`<div class="mh">${esc(r.name||'휴무일 · 기념일')}<b>언제 알려드릴까요?</b></div>
    <div class="mi" style="display:block"><div class="icn-lb">며칠 전</div><div class="remc">${REM_DAYS.map(v=>`<button class="${r.rem.includes(v)?'on':''}" data-act="rem-t" data-v="${v}">${REM_LABEL[v]}</button>`).join('')}</div></div>
    <div class="mi" style="display:block"><div class="icn-lb">시각</div><div class="remc">${REM_AT.map(t=>`<button class="${r.at===t?'on':''}" data-act="rem-at" data-v="${t}">${remAtLabel(t)}</button>`).join('')}</div></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="rem-off">알림 끄기</button><button class="btn grow" data-act="rem-save">저장</button></div>`);
}
function remSave(off){
  const r=remEd;if(!r)return;
  const x=r.id==='__draft'?chDraft:(S.companyHols||[]).find(y=>y.id===r.id);remEd=null;closePop();if(!x)return;
  x.rem=off?[]:r.rem.slice().sort((a,b)=>b-a);x.remAt=r.at;x.remind=x.rem.length>0;
  if(r.id!=='__draft')save();
  openCompPage();
  if(r.id!=='__draft')toast(x.rem.length?`🔔 ${remShort(x)} · ${remAtLabel(x.remAt)}에 알려드려요`:'알림을 껐어요');
}

/* ---------- 백업 · 복원 ---------- */
let driveFiles=null,driveBusy=false;
const hasBridge=fn=>!!(window.AndroidBridge&&typeof window.AndroidBridge[fn]==='function');
function openBackupPage(){
  const linked=hasBridge('driveLinked')&&window.AndroidBridge.driveLinked();
  const files=driveFiles||[];
  const fileRow=(f,i)=>{
    const p=f.appProperties||{};
    const when=f.createdTime?new Date(f.createdTime):null;
    return `<div class="prow"><div class="pl2">${i===0?'최신 백업':'직전 백업'}<small>${when?`${when.getMonth()+1}월 ${when.getDate()}일 ${pad(when.getHours())}:${pad(when.getMinutes())}`:''}${p.shifts?` · 근무 변경 ${p.shifts}일`:''}${p.memos?` · 메모 ${p.memos}개`:''}</small></div><button class="btn sm ${i===0?'':'ghost'}" data-act="drive-restore" data-id="${f.id}">복원</button></div>`;
  };
  openPage(`
    ${pageHead('백업 · 복원')}
    <div class="pg-b np">
      <div class="pg-cap">구글 드라이브</div>
      <div class="pg-sec">
        ${!hasBridge('driveBackup')?`<div class="prow"><div class="pl2 muted">앱에서 쓸 수 있어요 (지금은 브라우저 미리보기)</div></div>`:linked?`
          <div class="prow"><div class="pl2">☁️ 연결됨<small>${esc(S.drive.email||'구글 계정')}</small></div></div>
          <div class="prow"><div class="pl2">마지막 백업<small>${S.drive.last?new Date(S.drive.last).toLocaleString('ko-KR'):'아직 없어요'}</small></div><button class="btn sm" data-act="drive-backup" ${driveBusy?'disabled':''}>${driveBusy?'백업 중…':'지금 백업하기'}</button></div>
          <div class="prow"><div class="pl2">자동 백업</div><label class="sw"><input type="checkbox" id="driveAuto" ${S.drive.auto?'checked':''}><i></i></label></div>
          ${files.length?files.slice(0,2).map(fileRow).join(''):`<div class="prow"><div class="pl2 muted">${driveFiles?'저장된 백업이 없어요':'백업 목록을 불러오는 중…'}</div></div>`}
          <div class="prow danger-row" data-act="drive-unlink" style="color:var(--muted);font-weight:600">연결 해제</div>`
        :`<div class="prow"><div class="pl2">구글 드라이브 백업 · 복원</div></div>
          <div class="prow"><button class="btn" style="width:100%" data-act="drive-link" ${driveBusy?'disabled':''}>${driveBusy?'연결 중…':'구글 계정 연결하기'}</button></div>`}
      </div>
      <div class="pg-cap">파일</div>
      <div class="pg-sec">
        ${npRow('file-text','백업 파일 만들기',npVal(''),{tap:1,act:'backup-export'})}
        ${npRow('history','백업 파일 불러오기',npVal(''),{tap:1,act:'backup-import'})}
        <input type="file" id="backupFile" accept=".json,application/json,text/plain" style="display:none">
      </div>
      ${backupRescueHtml()}
    </div>`,'backup');
  if(linked&&driveFiles===null&&!driveBusy){driveBusy=true;window.AndroidBridge.driveList(true);}
}
function backupRescueHtml(){   // 복원 직전 사본 · 못 읽은 저장 데이터가 있을 때만 나오는 칸 (없으면 아무것도 안 보임)
  let prev=null,bad=false;
  try{prev=JSON.parse(localStorage.getItem(KEY+':prev')||'null');bad=!!localStorage.getItem(KEY+':bad');}catch(e){}
  const hasPrev=!!(prev&&prev.at&&isObj(prev.s));
  if(!hasPrev&&!bad)return '';
  const w=hasPrev?new Date(prev.at):null;
  return `<div class="pg-cap">되돌리기 · 복구</div><div class="pg-sec" style="margin-top:0">
    ${hasPrev?`<div class="prow"><div class="pl2">복원 직전 상태로 되돌리기<small>${w.getMonth()+1}월 ${w.getDate()}일 ${pad(w.getHours())}:${pad(w.getMinutes())} 에 복원하기 전 모습</small></div><button class="btn sm" data-act="backup-undo">되돌리기</button></div>`:''}
    ${bad?`<div class="prow"><div class="pl2">읽지 못한 저장 데이터<small>지우지 않고 남겨 뒀어요 · 파일로 보내 둘 수 있어요</small></div><button class="btn sm" data-act="bad-export">내보내기</button></div>`:''}
  </div>`;
}
function undoRestore(){
  let prev=null;try{prev=JSON.parse(localStorage.getItem(KEY+':prev')||'null');}catch(e){}
  if(!prev||!isObj(prev.s)){toast('되돌릴 사본이 없어요');return;}
  if(!confirm('복원하기 전 상태로 되돌릴까요?\n\n(지금 데이터는 사라져요)'))return;
  S=safeNormalize(prev.s);save();applyTheme();applyFont();applyBand();
  try{localStorage.removeItem(KEY+':prev');}catch(e){}
  closeSheet();if(pageMode)closePage();render();toast('복원하기 전 상태로 되돌렸어요');
}
function exportBad(){
  let raw='';try{raw=localStorage.getItem(KEY+':bad')||'';}catch(e){}
  if(!raw){toast('남아 있는 데이터가 없어요');return;}
  const name=`eonjeswieo-unreadable-${fmt(new Date())}.json`;
  if(hasBridge('shareFile')){try{window.AndroidBridge.shareFile(name,raw);return;}catch(e){}}
  toast('앱에서만 보낼 수 있어요');
}
const BACKUP_KEYS=['stzMode','ovDot','chLog','famAlias','onboarded','myset','noPat','addons','pattern','anchor','patOld','overrides','memos','alarms','tune','calLook','todayLook','todayColor','requests','board','syncSettings','pay','myTeam','teamOffsets','teamStyle','teamNames','holRest','shareMemo','patternName','types','ddays','companyHols','compHolAsHoliday','memoColors','fontScale','theme','bg','showBand','personal','pers','widget','weekStart','memoLines','quickN','patWeek','myEmo','famWk','seenVer','lastMemoColor','shiftTimes','status','family','famCheer','togOff','famDayToo','stamps','icons','wx','ot','salary'];
function backupData(){const data={app:'eonjeswieo',ver:4,at:new Date().toISOString()};BACKUP_KEYS.forEach(k=>{data[k]=S[k];});if(S.wlog&&S.wlog.backup)data.wlog=S.wlog;try{const h=wxHist();if(Object.keys(h).length)data.wxh=h;}catch(e){}return data;}   // v0.127 지난 날 날씨 기록도   // 업무 일지는 "백업에 넣기"를 켠 사람만
function backupMeta(){
  let mc=0;Object.values(S.memos).forEach(l=>mc+=l.length);
  return {shifts:String(Object.keys(S.overrides).length),memos:String(mc)};
}
function driveBackupNow(silent){
  if(!hasBridge('driveBackup'))return;
  driveBusy=true;
  try{window.AndroidBridge.driveBackup(JSON.stringify(backupData()),JSON.stringify(backupMeta()),!!silent);}catch(e){driveBusy=false;}
  if(!silent&&pageMode==='backup')openBackupPage();
}
function applyBackup(d){
  if(!d||!(d.app==='eonjeswieo'||d.app==='shiftcal')||!Array.isArray(d.pattern)){toast('언제쉬어 백업이 아니에요');return false;}
  const next={};
  BACKUP_KEYS.forEach(k=>{if(d[k]!==undefined)next[k]=d[k];});
  if(d.familyMemos)next.familyMemos=d.familyMemos;
  if(d.wlog)next.wlog=d.wlog;   // (백업에 일지가 없으면 지금 폰의 일지를 그대로 둠)
  if(isObj(d.wxh)){try{const H=wxHist();Object.keys(d.wxh).forEach(k=>{const v=d.wxh[k];if(/^\d{4}-\d\d-\d\d$/.test(k)&&isObj(v)&&(isObj(v.c)||isObj(v.f))&&!H[k])H[k]=v;});localStorage.setItem(WXH_KEY,JSON.stringify(H));}catch(e){}}   // v0.127 날씨 기록: 폰에 없는 날만 채움
  try{localStorage.setItem(KEY+':prev',JSON.stringify({at:Date.now(),s:S}));}catch(e){}   // 복원 직전 상태를 하나 남겨 둠 (백업 · 복원 화면에서 되돌리기)
  const info={};
  S=safeNormalize(Object.assign({},S,next,{onboarded:true,myset:next.myset!==undefined?!!next.myset:true,noPat:next.noPat!==undefined?!!next.noPat:false}),info);   // 예전 백업엔 myset · noPat 이 없음 → 근무표가 있는 걸로
  save();applyTheme();applyFont();applyBand();
  if(info.bad&&info.bad.length)setTimeout(()=>toast('백업의 일부 칸은 읽지 못해 기본값으로 두었어요'),400);
  return true;
}
function driveErrText(res){   // 인터넷 문제와 구글 쪽 거절을 나눠서 알려요
  if(res.err!=='http')return '인터넷 연결을 확인해 주세요';
  const m=String(res.msg||'').match(/\b(\d{3})\b/),c=m?+m[1]:0;
  if(c===401)return '구글 로그인이 만료됐어요 · 백업 연결을 다시 해 주세요';
  if(c===403)return '구글 드라이브를 쓸 수 없어요 (설정 문제 403) · 개발자에게 알려 주세요';
  if(c===429)return '요청이 많아요 · 잠시 뒤에 다시 해 주세요';
  if(c>=500)return '구글 서버가 불안정해요 · 잠시 뒤에 다시 해 주세요';
  return '구글 드라이브 오류'+(c?` (${c})`:'')+' · 잠시 뒤에 다시 해 주세요';
}
let autoSilent=false;
window.__onDrive=res=>{
  driveBusy=false;
  if(!res)return;
  const err=res.err;
  if(res.ok){
    if(res.email)S.drive.email=res.email;
    if(res.files)driveFiles=res.files;
    if(res.op==='backup'){S.drive.last=Date.now();S.drive.dirty=false;persist();if(!autoSilent)toast('☁️ 구글 드라이브에 백업했어요');}
    if(res.op==='restore'){
      let d;try{d=JSON.parse(res.data);}catch(e){toast('백업을 읽지 못했어요');return;}
      if(applyBackup(d)){S.drive.last=Date.now();S.drive.dirty=false;persist();closePage();toast('백업을 불러왔어요');}
      return;
    }
    persist();
  }else if(!autoSilent||res.op!=='backup'){
    if(err==='setup')toast('구글 연결 준비가 아직 안 됐어요 (개발자 설정 필요)');
    else if(err==='cancel')toast('취소했어요');
    else if(err==='need_login'){/* 조용히 넘어감 */}
    else toast(driveErrText(res));
  }
  autoSilent=false;
  if(pageMode==='backup')openBackupPage();
};
function autoBackup(){
  if(!hasBridge('driveLinked')||!S.drive.auto||!S.drive.dirty||!S.drive.last)return;
  if(Date.now()-S.drive.last<20*3600e3)return;
  try{if(!window.AndroidBridge.driveLinked())return;}catch(e){return;}
  autoSilent=true;driveBackupNow(true);
}

/* ---------- 권한 · 문의 · 개인정보 · 지우기 ---------- */
function isSamsung(){try{return /^samsung/i.test(JSON.parse(window.AndroidBridge.appInfo()).device||'');}catch(e){return false;}}
function openPermPage(){
  const issues=nativeIssues();
  openPage(`
    ${pageHead('알람이 잘 울리게')}
    <div class="pg-b np"><div class="pg-sec" style="margin-top:8px">
      ${PERM_KEYS.map(k=>npRow(PERM_ICON[k],PERM_NAME[k],issues.includes(k)?`<span class="warnp">켜 주세요${npi('chevron-right',16)}</span>`:`<span class="okp">${npi('check',14)}켜짐</span>`,issues.includes(k)?{tap:1,act:'nativefix',attrs:` data-k="${k}"`}:{})).join('')}
    </div>
    ${isSamsung()&&issues.includes('batt')?`<div class="pg-sec">${npRow('battery','삼성: 자동 절전 예외 앱에 넣기',npVal(''),{tap:1,act:'perm-samsung'})}</div>`:''}</div>`,'perm');   // v0.214 삼성 폰에서만 · 누르면 삼성 배터리 화면으로 바로 · v0.216 배터리 제한 없음이 꺼져 있을 때만 (켜져 있으면 삼성 자동 절전 대상이 아니라 할 일 없음 · 사용자 폰 확인)
}
function sendInquiry(){
  let info={};try{if(hasBridge('appInfo'))info=JSON.parse(window.AndroidBridge.appInfo());}catch(e){}
  let errs='';
  try{const a=JSON.parse(localStorage.getItem('eonjeswieo:err')||'[]');if(Array.isArray(a)&&a.length)errs='\n최근 오류:\n'+a.slice(-5).map(x=>{const d=new Date(+x.t||0);return `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} ${String(x.m||'').slice(0,120)} ${String(x.s||'').slice(0,40)}`;}).join('\n');}catch(e){}
  const famNo=S.link&&S.link.uid?`\n가족 연결 번호: ${String(S.link.uid).slice(0,40)}`:'';   // 서버에 남은 정보를 찾아 지울 때 쓰는 번호 (이름 · 이메일 아님)
  const body=`\n\n\n----\n앱: 언제쉬어 ${info.version||''}\n기기: ${info.device||navigator.userAgent}\n안드로이드: ${info.android||''}${famNo}${errs}`;
  if(hasBridge('sendMail')){window.AndroidBridge.sendMail(SUPPORT_MAIL,'[언제쉬어] 문의',body);return;}
  location.href=`mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent('[언제쉬어] 문의')}&body=${encodeURIComponent(body)}`;
}
const SUPPORT_MAIL='eonjeswieo.app@gmail.com';   // 문의 받을 메일 주소 (운영용)
const PRIVACY_URL='https://eonjeswieo.web.app/privacy',DELETE_URL='https://eonjeswieo.web.app/delete',PRIVACY_DATE='2026년 10월 29일';
function openPrivacyPage(){
  openPage(`
    ${pageHead('개인정보처리방침')}
    <div class="pg-b"><div class="policy">
      <b>언제쉬어 개인정보처리방침</b><br><small style="color:var(--muted)">시행일 ${PRIVACY_DATE}</small>
      <h4>1. 한 줄 요약</h4>기본은 모두 이 폰 안에만 저장돼요. <b>가족 연결</b>이나 <b>구글 드라이브 백업</b>을 직접 켰을 때만 그 정보가 구글 서버로 가요. 광고 · 분석 도구는 쓰지 않아요.
      <h4>2. 이 폰에만 저장하는 정보</h4>근무 패턴 · 근무 변경 · 메모 · 월 포스트잇 · 월급 설정(고정금 · 명세서 금액, 근무 통계를 쓸 때) · 기념일 · 회사 휴무일 · 스티커(직접 고른 사진 포함) · 알람과 앱 설정. 이름 · 전화번호 · 연락처 · 위치는 받지 않아요. "나만 보는 메모"와 개인 캘린더는 서버에 올라가지 않아요.
      <h4>3. 가족 연결을 켰을 때 서버에 올라가는 정보</h4>
      · 로그인 번호: 이름 · 이메일이 없는 무작위 번호(익명 로그인). 구글 계정으로 연결하면 그 이메일도 로그인 정보로 저장돼요.<br>
      · 가족방 정보: 내가 정한 호칭 · 초대 코드 · 권한(보기만 / 메모 · 요청 보내기).<br>
      · 내 근무표: 근무 패턴 · 바꾼 날 · 근무 종류별 출퇴근 시각 · ⏱ 연장으로 바꾼 날의 실제 출퇴근 시각 · 근무 이름과 색. "스티커 보여주기"를 켠 경우에만 고른 스티커의 기록(사진 스티커는 작게 줄인 사진)이 같이 올라가요. 약은 기본으로 빠져요.<br>
      · 가족 메모(고른 가족에게만 보여요) · 근무 요청과 답 · 보낸 횟수(무료 횟수 계산).<br>
      · 푸시 알림 주소와 자는 시간. 알림 문구에는 메모 내용을 넣지 않아요.<br>
      서버는 구글 클라우드(Firebase)이고, 데이터는 한국(서울) 서버에 저장돼요. 가족방 사람만 읽을 수 있도록 보안 규칙으로 막아 둬요.
      <h4>4. 구글 드라이브 백업 (선택)</h4>켜면 내 구글 드라이브의 "앱 전용 숨김 폴더"에 백업 파일이 저장돼요. 다른 앱이나 저희는 볼 수 없어요.
      <h4>5. 인터넷 사용</h4>공휴일 목록(공공 정보)을 하루 한 번 받아 와요. 이때 사용자 정보는 보내지 않아요.
      <h4>5-1. 사용 통계 (횟수만)</h4>앱을 더 좋게 만들려고 어떤 기능을 몇 번 쓰는지 <b>횟수와 종류만</b> 구글 분석(Firebase Analytics)으로 모아요(예: 앱을 켰다 · 가족 메모를 보냈다 · 스티커를 만들었다 · 어떤 크기의 위젯을 놓았다). 메모 · 이름 · 날짜 · 근무 내용은 모으지 않고 광고 식별자도 모으지 않아요. 설정 › 사용 통계 보내기를 끄면 모으지 않아요.
      <h4>5-2. 오류 보고</h4>앱이 멈추거나 화면에 오류가 나면 오류 내용(오류 글자 · 코드 위치) · 폰 기종 · 안드로이드 · 앱 버전을 구글 오류 보고(Firebase Crashlytics)로 보내요. 메모 · 이름 · 근무 내용은 넣지 않아요. 설정 › 사용 통계 · 오류 보고를 끄면 보내지 않아요.
      <h4>5-3. 출퇴근 날씨 (선택)</h4>켜면 고른 집 · 직장 지역(시 · 군 · 구)만 서버로 보내 기상청 날씨 · 에어코리아 미세먼지 예보를 받아 와요. 위치(GPS)는 쓰지 않고, 서버는 누가 물어봤는지 저장하지 않아요. 가족 연결을 쓰면 내 직장 지역과 출퇴근 시각이 가족에게도 보여요.
      <h4>6. 제3자 제공 · 국외 이전</h4>구글(Google LLC)이 로그인 · 데이터 저장 · 푸시 알림 · 드라이브 · 구글 로그인 · 오류 보고 서비스를 제공하기 위해 위 정보를 처리해요. 서비스를 쓰는 동안 인터넷으로 전송되고, 구글 서버(한국 · 미국 등)에 보관돼요. 광고나 마케팅 목적으로 다른 곳에 주지 않아요.
      <h4>7. 보관과 지우기</h4>
      · 이 폰의 정보: 앱을 지우거나 "내 데이터 모두 지우기"를 할 때까지.<br>
      · 서버의 정보: 가족방을 없애거나 가족방에서 나가거나 "내 데이터 모두 지우기"를 할 때까지. "내 데이터 모두 지우기"는 서버의 내 정보와 로그인 계정까지 함께 지워요. 초대 코드는 7일이 지나면 쓸 수 없어요.<br>
      · 앱을 이미 지웠다면 아래 문의 메일로 지워 달라고 요청해 주세요. 요청은 지체 없이 처리해요.<br>
      · 구글 드라이브 백업 파일은 구글 드라이브 설정 › 앱 관리에서 지울 수 있어요.
      <h4>8. 이용자의 권리</h4>언제든 내 정보를 보고, 고치고, 지우고, 처리를 멈춰 달라고 할 수 있어요. 앱 안(설정 › 도움 · 정보 › 내 데이터 모두 지우기, 설정 › 가족 연결)에서 직접 하거나 문의 메일로 요청해 주세요.
      <h4>9. 어린이</h4>만 14세 미만 어린이를 대상으로 하지 않으며, 알면서 어린이의 정보를 받지 않아요.
      <h4>10. 안전하게 지키기</h4>서버 전송은 암호화(HTTPS)되고, 서버 접근은 보안 규칙으로 가족방 사람에게만 열려 있어요. 앱 화면은 외부 스크립트를 막는 보안 설정(CSP)을 켜 두었어요.
      <h4>11. 문의 · 개인정보 보호책임자</h4>언제쉬어 운영팀 · ${SUPPORT_MAIL}<br>설정 › 문의하기에서도 보낼 수 있어요.
      <h4>12. 방침이 바뀔 때</h4>내용이 바뀌면 앱 업데이트와 이 화면 · 웹 주소에 먼저 알려요. 나중에 광고나 결제를 넣게 되면 그 전에 이 글을 먼저 고쳐요.
      <div style="margin-top:14px"><a class="btn ghost" data-act="lnk-go" data-u="${PRIVACY_URL}" style="display:block;text-align:center">웹에서 전체 보기</a></div>
      <div style="margin-top:8px"><a class="btn ghost" data-act="lnk-go" data-u="${DELETE_URL}" style="display:block;text-align:center">계정 · 데이터 삭제 안내 (웹)</a></div>
    </div></div>`,'privacy');
}
/* 내 데이터 모두 지우기: 확인 두 번 → 서버(가족방 · 알림 주소 · 로그인 계정)를 먼저 지움 → 다 되면 이 폰을 비움.
 * 서버를 못 지우면 폰은 그대로 두고 알려 줌 (서버에 남겨 둔 채 폰만 지워 버리지 않게). 그래도 하겠다고 하면 폰만 지움. */
const withTimeout=(p,ms)=>new Promise((ok,no)=>{const t=setTimeout(()=>no(new Error('timeout')),ms);Promise.resolve(p).then(v=>{clearTimeout(t);ok(v);},e=>{clearTimeout(t);no(e);});});
var wipeBusy=false,wipeRe=null;   // var: 시작 때 save() 가 불러도 안전하게
// 서버에 있는 내 것 지우기. 지울 게 없으면 조용히 끝나고, 못 지우면 throw
async function wipeServer(){
  for(let i=0;i<40&&FBX.busy;i++)await new Promise(r=>setTimeout(r,250));   // 앱을 켠 직후 연결 중이면 잠깐 기다림
  if(!(await fbAuthInit()))return;   // 설정 없음 = 서버를 안 쓰는 앱
  if(!FBX.auth.currentUser&&!S.link)return;   // 저장된 로그인도 가족방도 없음 = 서버에 지울 게 없음
  await wipeReauth();   // 구글을 이은 계정이면 서버를 건드리기 전에 먼저 (계정 삭제는 최근 로그인이 필요해서, 나중에 막혀 일부만 지워지는 일이 없게)
  const {F,db,uid}=await famReady(),L=S.link;
  // 서버에 닿는지 · 내 자리가 아직 있는지를 서버에서 직접 확인 (오프라인이면 여기서 멈춰서, 쓰기가 대기열에 쌓이지 않음)
  const mine=await withTimeout(F.getDocFromServer(L?famMember(F,db,L.hid,uid):F.doc(db,'ping',uid)),15000);
  if(L&&mine.exists())await withTimeout(famRemoveMember(L.hid,uid),45000);   // v0.96 방장 없음: 나가기와 같음 (마지막 사람이면 방도 없어짐)
  famDevKey='';famUserKey='';
  await withTimeout(Promise.all(['devices','users','ping'].map(c=>F.deleteDoc(F.doc(db,c,uid)))),20000);   // 알림 주소 · 가족방 번호 쪽지 · 연결 시험 쪽지
  await wipeUser();
}
// 구글 계정을 이은 사람은 구글 로그인을 한 번 더 (최근 로그인이어야 계정을 지울 수 있음)
async function wipeReauth(){
  const u=FBX.auth.currentUser;
  if(!u||!u.providerData.some(p=>p.providerId==='google.com'))return;
  if(!googleOn()||!confirm('구글 계정 연결까지 지우려면 구글 로그인을 한 번 더 해야 해요.\n\n[확인]을 누르면 구글 로그인 창이 열려요.'))throw new Error('reauth');
  await withTimeout(new Promise((ok,no)=>{wipeRe=r=>r?ok():no(new Error('reauth'));googleStart('reauth');}),180000).finally(()=>{wipeRe=null;});
}
// 로그인 계정(익명 · 구글 연결)까지 서버에서 지움
async function wipeUser(){
  const A=window.FB.auth;if(!FBX.auth.currentUser)return;
  try{await withTimeout(A.deleteUser(FBX.auth.currentUser),20000);}
  catch(e){
    const c=String((e&&e.code)||'');
    if(/user-not-found|user-token-expired|invalid-user-token/.test(c)){try{await A.signOut(FBX.auth);}catch(x){}return;}   // 서버에 이미 없는 계정
    if(c.includes('requires-recent-login')){
      if(FBX.auth.currentUser.providerData.some(p=>p.providerId==='google.com'))throw new Error('recent');
      try{await A.signOut(FBX.auth);}catch(x){}return;   // 익명 계정(이름 · 이메일 없는 무작위 번호)을 서버가 지우기 거부하면 로그아웃만
    }
    throw e;
  }
}
// 이 폰에 남은 Firebase 사본(오프라인 저장 · 기다리던 쓰기)을 비우고 연결 상태를 처음으로
async function fbForget(){
  famStop();
  try{if(FBX.db&&window.FB){const F=window.FB.fs;await withTimeout(F.terminate(FBX.db),5000);await withTimeout(F.clearIndexedDbPersistence(FBX.db),5000);}}catch(e){}
  FBX.st='off';FBX.uid='';FBX.err='';FBX.db=null;FBX.ping=null;
}
function wipeBox(on){
  let b=document.getElementById('wipeBox');
  if(!on){if(b)b.remove();return;}
  if(b)return;
  b=document.createElement('div');b.id='wipeBox';b.setAttribute('role','alert');
  b.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;z-index:99999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#fff;font:700 17px/1.4 system-ui,sans-serif';
  b.textContent='지우는 중이에요…';document.body.appendChild(b);
}
const wipeWhy=e=>e&&e.message==='timeout'?'서버가 응답하지 않아요':e&&e.message==='reauth'?'구글 로그인을 하지 않았어요':e&&e.message==='recent'?'계정 확인이 더 필요해요':famErr(e);
function wipeLocal(){
  try{if(hasBridge('driveUnlink'))window.AndroidBridge.driveUnlink();}catch(e){}   // 드라이브 연결 끊기 (만들어 둔 백업 파일은 사용자 드라이브에 남음)
  famClear();
  try{Object.keys(localStorage).filter(k=>/^(eonjeswieo|shiftcal):/.test(k)).forEach(k=>localStorage.removeItem(k));}catch(e){}   // 이 앱이 저장한 값 전부 (데이터 · 공휴일 사본 · 오류 기록 · 복원 사본)
  S=defaults();save();
  try{if(hasBridge('setAlarms'))window.AndroidBridge.setAlarms('[]');}catch(e){}
  closePage();tab='cal';render();startOnboarding();
}
async function wipeAll(){
  if(wipeBusy)return;
  const L=S.link,drive=!!(S.drive&&S.drive.last);
  if(!confirm('근무표·메모·알람·설정을 모두 지울까요?\n\n지우면 되돌릴 수 없어요.'
    +(L?'\n\n가족방에서도 나가요 (나 혼자였으면 가족방도 없어져요).'+'\n서버에 있는 내 정보와 로그인 계정까지 지워서 인터넷이 필요해요.':'')
    +(drive?'\n\n구글 드라이브에 만들어 둔 백업 파일은 안 지워져요 (구글 드라이브 설정 › 앱 관리에서 지울 수 있어요).':'')))return;
  if(!confirm('정말 모두 지울까요?'))return;
  wipeBusy=true;wipeBox(true);famStop();clearTimeout(famT);   // 지우는 동안 가족 쪽 일은 모두 멈춤
  try{
    try{await wipeServer();}
    catch(e){
      await fbForget();   // 서버에 쓰다 멈춘 것이 나중에 몰래 실행되지 않게
      wipeBox(false);
      if(!confirm(`서버에 있는 정보를 지우지 못했어요 (일부는 이미 지워졌을 수 있어요).\n(${wipeWhy(e)})\n\n인터넷을 확인하고 다시 해 보시길 권해요.\n\n[확인] 그래도 이 폰의 것만 지우기\n    (서버에 남은 정보는 문의 메일로 알려 주시면 지워 드려요)\n[취소] 지우지 않고 돌아가기`)){wipeBusy=false;if(S.link)famBoot();return;}
      wipeBox(true);
    }
    await fbForget();
    wipeLocal();
  }finally{wipeBox(false);wipeBusy=false;}
}

/* ================= 처음 시작 설정 ================= */
const OB_PRESETS=[
  {id:'4-2',name:'4조 2교대',sub:'주주휴휴야야휴휴 · 8일 반복',pat:['주','주','휴','휴','야','야','휴','휴'],off:[6,4,0,2]},
  {id:'3-2',name:'3조 2교대',sub:'주주주야야야휴휴휴 · 9일 반복',pat:['주','주','주','야','야','야','휴','휴','휴'],off:[6,3,0]},
  {id:'2',name:'2교대 (주야 맞교대)',sub:'주야휴 · 3일 반복',pat:['주','야','휴'],off:[2,1,0]},
  {id:'4-3',name:'4조 3교대',sub:'주주오오야야휴휴 · 8일 반복',pat:['주','주','오','오','야','야','휴','휴'],off:[6,4,0,2],add:{k:'오',name:'오후',color:'#f1dc8f',rest:false}},
  {id:'week',name:'상주 (월~금 근무)',sub:'토·일 · 공휴일 쉬어요',pat:['상','상','상','상','상','휴','휴'],off:[0],hol:true,add:{k:'상',name:'상주',color:'#b9dcb0',rest:false}}
];
let ob=null;
/* entry: 'first' 처음 설치 · 'join' 초대 코드로 참여한 뒤 · 'later' 설정 / 달력 위 안내에서 다시
 * way: 'preset' 일정하게 돌아가요 · 'custom' 직접 만들게요 · 'irregular' 불규칙해요
 * step: start · way · preset · len · names · fill · pos · verify · alarm · done */
function startOnboarding(opt){
  const entry=(opt&&opt.entry)||'first';
  ob={entry,step:entry==='first'?'start':'way',hist:[],way:'preset',preset:'4-2',pos:0,team:2,shift:0,al:{},len:8,wk:['주','야'],rk:'휴',cpat:null,brush:'주',lastStep:''};
  $('#onboard').classList.add('open');renderOb();
}
function obGo(step){ob.hist.push(ob.step);ob.step=step;renderOb();}
function obBack(){
  if(ob.hist.length){ob.step=ob.hist.pop();renderOb();return;}
  if(ob.entry==='later')obCancel();
}
function obCancel(){$('#onboard').classList.remove('open');$('#onboard').innerHTML='';ob=null;}
function obPath(){const w=ob.way;return w==='irregular'?['way']:['way',...(w==='custom'?['len','names','fill']:['preset']),'pos','verify','alarm'];}
const OB_AL_T={주:'05:50',야:'16:30',오:'13:30',상:'07:30'};
// 직접 만들기: 고른 글자 → 근무타입 (이미 있는 글자는 그대로, 없으면 새로 만듦)
function obCTypes(){
  const used=S.types.slice();
  const mk=(k,rest)=>{const f=S.types.find(t=>t.k===k);if(f)return f;const t={k,name:k===NONE_K?'없음':k,color:rest?'':nextPastel(used),rest};used.push(t);return t;};   // 새 근무 종류는 파스텔 순서대로 (이미 쓰는 색은 건너뜀)
  return [...ob.wk.map(k=>mk(k,false)),mk(ob.rk,true)];
}
const obIsWork=k=>{if(ob.way==='custom'){const t=obCTypes().find(x=>x.k===k);return !!t&&!t.rest;}const p=obPreset();return p.add&&p.add.k===k?!p.add.rest:!isRest(k);};
// 패턴에 들어 있는 근무 날마다 알람 한 줄
function obAlarms(){const ks=[...new Set(obPattern())].filter(obIsWork);return ks.map(k=>{if(!ob.al[k])ob.al[k]={t:OB_AL_T[k]||'08:00',on:true};return [k,ob.al[k]];});}
function obTeams(){return ob.way==='custom'?1:(obPreset().off||[6,4,0,2]).length;}
function obPreset(){return OB_PRESETS.find(p=>p.id===ob.preset)||OB_PRESETS[0];}
// 처음 설치: 근무 패턴 확인 화면 맨 아래 "🕐 근무 시간 (선택)" — 근무 종류마다 출근 → 퇴근 (안 정하면 이름으로 대략)
const obTmKeys=()=>[...new Set(obPattern())].filter(obIsWork);
const obTmOf=k=>(ob.tm&&ob.tm[k])||(()=>{const d=defaultTimes(k);return typeOf(k).k===k&&!typeOf(k).noGuess?[d.start,d.end]:wxDefTimes(shiftNameOf(k)+k);})();
function obTimesHtml(){
  const ks=obTmKeys();if(!ks.length)return '';
  return `<div class="obtm"><button class="obtm-h" data-act="obtm-tog">🕐 근무 시간 <span>(선택)</span> ${ob.tmOpen?'▴':'›'}</button>
    ${ob.tmOpen?ks.map((k,i)=>{const x=obTmOf(k);return `<div class="alrow">${obBadge(k)}<span class="ptm-t">${tpick('obTmS_'+i,x[0])}<em>→</em>${tpick('obTmE_'+i,x[1])}</span><small>${esc(shiftNameOf(k))}</small></div>`;}).join(''):''}</div>`;
}
function obPattern(){if(ob.way==='custom')return ob.cpat||[];const p=obPreset();return p.pat||['주','주','휴','휴','야','야','휴','휴'];}
function obName(){return ob.way==='custom'?`내 근무 (${ob.len}일 반복)`:obPreset().name;}
function obPosLabels(pat){
  if(ob&&ob.preset==='week'&&ob.way!=='custom')return ['월','화','수','목','금','토','일'].map((w,i)=>`${w}요일 · ${shiftNameOf(pat[i])}`);
  return posLabels(pat,shiftNameOf,ob.way==='custom'?(k=>{const t=obCTypes().find(x=>x.k===k);return !!t&&t.rest;}):undefined);
}
function shiftNameOf(k){
  if(ob.way==='custom'){const t=obCTypes().find(x=>x.k===k);return t?t.name:k;}
  const p=obPreset();if(p.add&&p.add.k===k)return p.add.name;return shiftLabel(k);
}
function obBadge(k){
  if(k===NONE_K)return noneBadge('sm');
  if(ob.way==='custom'){const t=obCTypes().find(x=>x.k===k);if(t)return schBadge({types:[t]},k);}
  const p=obPreset();if(p.add&&p.add.k===k&&!S.types.some(t=>t.k===k)){const c=tColors(p.add);return `<span class="badge c" style="--tb:${c.bg};--tf:${c.fg}">${esc(k)}</span>`;}return badge(k);
}
function obAnchor(){return addK(fmt(new Date()),-ob.pos+ob.shift);}
function obShiftOn(d){const pat=obPattern(),n=pat.length;const i=((dayNum(d)-dayNum(parse(obAnchor())))%n+n)%n;return pat[i];}
function obCheckNames(){
  const ks=[...ob.wk,ob.rk].map(x=>(x||'').trim());
  if(ks.some(k=>!k))return '비어 있는 이름이 있어요';
  if(new Set(ks).size!==ks.length)return '같은 글자가 겹쳐요. 서로 다르게 써 주세요';
  for(const k of ob.wk){const ex=S.types.find(t=>t.k===k);if(ex&&ex.rest)return `'${k}'는 쉬는 날 글자예요. 다른 글자를 써 주세요`;}
  const ex=S.types.find(t=>t.k===ob.rk);if(ex&&!ex.rest)return `'${ob.rk}'는 근무 글자예요. 다른 글자를 써 주세요`;
  return '';
}
// 날 수 · 이름이 바뀌면 이미 채운 칸은 최대한 그대로 두고 나머지는 쉬는 날로
function obSyncPat(){
  const keys=new Set([...ob.wk,ob.rk]),old=Array.isArray(ob.cpat)?ob.cpat:[],out=[];
  for(let i=0;i<ob.len;i++){const k=old[i];out.push(k!==undefined&&keys.has(k)?k:ob.rk);}
  ob.cpat=out;if(!keys.has(ob.brush))ob.brush=ob.wk[0];
}
function obNext(){
  const s=ob.step;
  if(s==='preset')obGo('pos');
  else if(s==='len')obGo('names');
  else if(s==='names'){const e=obCheckNames();if(e){toast(e);return;}obSyncPat();obGo('fill');}
  else if(s==='fill'){if(!ob.cpat.some(k=>k!==ob.rk)){toast('근무하는 날이 하나는 있어야 해요');return;}ob.pos=0;ob.shift=0;obGo('pos');}
  else if(s==='pos')obGo('verify');
  else if(s==='verify')obGo('alarm');
}
function renderOb(){
  const s=ob.step,path=obPath(),pi=path.indexOf(s);
  const prog=pi>=0&&path.length>1?`<div class="ob-prog">${path.map((_,i)=>`<i class="${i<=pi?'on':''}"></i>`).join('')}</div>`:'';
  const back=s!=='start'&&s!=='done'&&(ob.hist.length||ob.entry==='later')?`<button class="ob-back" data-act="ob-back">‹</button>`:'';
  const skip=`<button class="lk" data-act="ob-skip">${ob.entry==='later'?'닫기':'건너뛰기'}</button>`;
  let body='',foot='';
  if(s==='start'){
    body=`<div class="hero">${LOGO}<h1>언제쉬어</h1><p>교대근무 가족이 함께 보는 근무표</p></div>
      <div style="margin-top:50px">
      <button class="choice" data-act="ob-mine"><div class="ic" style="--ic:#3182f6">${npi('calendar',22)}</div><div><b>내 근무표 만들기</b><small>교대근무를 하는 본인이에요</small></div></button>
      <button class="choice" data-act="ob-personal"><div class="ic" style="--ic:#f08a00">${npi('book-open',22)}</div><div><b>개인 캘린더로 쓸게요</b><small>근무표 없이 메모 · 스티커 · 기념일만 써요</small></div></button>
      <button class="choice" data-act="ob-invite"><div class="ic" style="--ic:#8b5cf6">${npi('heart',22)}</div><div><b>초대 코드가 있어요</b><small>가족이 보낸 코드·링크로 근무표를 같이 봐요</small></div></button>
      <button class="choice" data-act="ob-restore"><div class="ic" style="--ic:#10b981">${npi('download',22)}</div><div><b>백업 불러오기</b><small>예전 폰에서 쓰던 기록 가져오기</small></div></button></div>`;
  }else if(s==='way'){
    body=`<h2>근무가 어떻게<br>돌아가나요?</h2><div class="ob-sub">내 근무에 가까운 걸 골라 주세요. 나중에 언제든 바꿀 수 있어요</div>
      <div style="margin-top:6px">
      <button class="choice" data-act="ob-way" data-v="preset"><div class="ic" style="--ic:#3182f6">${npi('repeat',22)}</div><div><b>일정하게 돌아가요</b><small>같은 순서가 반복돼요 · 4조2교대, 3교대, 상주 등</small></div></button>
      <button class="choice" data-act="ob-way" data-v="custom"><div class="ic" style="--ic:#f08a00">${npi('pencil',22)}</div><div><b>직접 만들게요</b><small>며칠 주기인지, 근무 이름과 순서를 내가 정해요</small></div></button>
      <button class="choice" data-act="ob-way" data-v="irregular"><div class="ic" style="--ic:#3182f6">${npi('calendar',22)}</div><div><b>불규칙해요</b><small>정해진 순서가 없어요 · 달력에서 날짜마다 직접 넣어요</small></div></button></div>`;
    foot=skip;
  }else if(s==='preset'){
    body=`<h2>가장 비슷한 걸<br>골라 주세요</h2><div class="ob-sub">이름이 달라도 순서가 같으면 돼요. 나중에 고칠 수 있어요</div>
      ${OB_PRESETS.map(p=>`<button class="opt ${ob.preset===p.id?'on':''}" data-act="ob-preset" data-v="${p.id}"><div class="tx"><b>${p.name}</b><small>${p.sub}</small>${p.pat?`<div class="pat">${p.pat.map(k=>obBadge(k)).join('')}</div>`:''}</div><div class="rad"></div></button>`).join('')}`;
    foot=`<button class="btn" data-act="ob-next">다음</button>${skip}`;
  }else if(s==='len'){
    body=`<h2>며칠마다 같은 순서가<br>돌아오나요?</h2><div class="ob-sub">근무와 쉬는 날을 모두 합친 날 수예요<br>예) 4조 2교대: 주주휴휴야야휴휴 → 8일</div>
      <div class="lenbox"><button class="ib" data-act="ob-len" data-v="-1" ${ob.len<=2?'disabled':''}>−</button><div><b>${ob.len}</b>일</div><button class="ib" data-act="ob-len" data-v="1" ${ob.len>=PAT_MAX?'disabled':''}>＋</button></div>
      <div class="seg">${[3,4,6,7,8,9,12].map(n=>`<button class="${ob.len===n?'on':''}" data-act="ob-len" data-v="${n}" data-m="set">${n}일</button>`).join('')}</div>`;
    foot=`<button class="btn" data-act="ob-next">다음</button>${skip}`;
  }else if(s==='names'){
    const rows=ob.wk.map((k,i)=>`<div class="nrow"><span class="nl">근무${ob.wk.length>1?' '+(i+1):''}</span><input type="text" class="nin" data-obn="w${i}" maxlength="2" value="${esc(k)}" placeholder="주" autocomplete="off">${ob.wk.length>1?`<button class="ib" data-act="ob-wdel" data-i="${i}" aria-label="빼기">✕</button>`:'<span style="width:36px"></span>'}</div>`).join('');
    body=`<h2>근무 이름을<br>정해 주세요</h2><div class="ob-sub">달력에 보이는 글자예요 (1~2글자)<br>회사에서 쓰는 이름으로 바꿔도 돼요<br>예) 주·야·휴 / D·N·OFF / 낮·밤·쉼</div>
      <div class="nlist">${rows}${ob.wk.length<4?'<button class="btn ghost sm" data-act="ob-wadd" style="margin:2px 0 10px">＋ 근무 종류 더 넣기 (오후 등)</button>':''}
      <div class="nrow"><span class="nl">쉬는 날</span>${ob.rk===NONE_K?'<span class="nin" style="display:flex;align-items:center;color:var(--muted)">없음 (아무것도 안 보여요)</span>':`<input type="text" class="nin" data-obn="r" maxlength="2" value="${esc(ob.rk)}" placeholder="휴" autocomplete="off">`}<button class="btn ghost sm" data-act="ob-rnone" style="flex:none;margin-left:6px">${ob.rk===NONE_K?'글자 쓰기':'글자 없이'}</button></div>
      <div class="ob-sub" style="margin-top:8px;font-size:12.5px">"휴" 글자 없이 비워 둘 수도 있어요</div></div>`;
    foot=`<button class="btn" data-act="ob-next">다음</button>${skip}`;
  }else if(s==='fill'){
    const ts=obCTypes();
    body=`<h2>하루씩<br>채워 볼게요</h2><div class="ob-sub">아래에서 근무를 고르고, 칸을 눌러 넣어요<br>1번째 칸이 순서의 시작이에요</div>
      <div class="tchips fillchips">${ts.map(t=>`<button class="tchip ${ob.brush===t.k?'on':''}" data-act="ob-brush" data-k="${esc(t.k)}">${obBadge(t.k)}<small>${t.rest?'쉬는 날':'근무'}</small></button>`).join('')}</div>
      <div class="pgrid fillgrid">${ob.cpat.map((k,i)=>`<button class="pc" data-act="ob-cell" data-i="${i}">${obBadge(k)}<small>${i+1}</small></button>`).join('')}</div>`;
    foot=`<button class="btn" data-act="ob-next">다음</button>${skip}`;
  }else if(s==='pos'){
    const pat=obPattern(),lb=obPosLabels(pat),t=new Date();
    const wk=[0,1,2,3,4,5,6].map(i=>{const d=addDays(t,i);return `<div class="${i===0?'t':''}">${i===0?'오늘':d.getDate()+'일'}${obBadge(obShiftOn(d))}</div>`;}).join('');
    body=`<h2>오늘(${t.getMonth()+1}월 ${t.getDate()}일 ${DOW[t.getDay()]})<br>근무는 뭐예요?</h2><div class="ob-sub">오늘이 패턴의 몇 번째 날인지 골라주세요</div>
      <div class="pos">${pat.map((k,i)=>`<button class="${ob.pos===i?'on':''}" data-act="ob-pos" data-v="${i}">${obBadge(k)}<small>${lb[i]}</small></button>`).join('')}</div>
      <div class="lbl">그러면 앞으로 7일은</div><div class="week7">${wk}</div>
      ${obTeams()>1?`<div class="lbl">내 조 (동료근무 표에 쓰여요)</div>
      <div class="seg">${[...Array(obTeams())].map((_,g)=>`<button class="${ob.team===g?'on':''}" data-act="ob-team" data-v="${g}">${esc(teamName(g))}</button>`).join('')}</div>
      <div class="ob-sub" style="font-size:12px">모르면 그대로 두셔도 돼요 · 조 이름은 나중에 바꿀 수 있어요</div>`:''}`;
    foot=`<button class="btn" data-act="ob-next">다음</button>${skip}`;
  }else if(s==='verify'){
    const now=new Date(),y=now.getFullYear(),m=now.getMonth(),first=new Date(y,m,1),start=addDays(first,-first.getDay()),tk=fmt(now);
    let g=DOW.map((d,i)=>`<div class="dw" style="${i===0?'color:var(--sun)':i===6?'color:var(--sat)':''}">${d}</div>`).join('');
    const rows=Math.ceil((first.getDay()+new Date(y,m+1,0).getDate())/7);
    for(let i=0;i<rows*7;i++){const d=addDays(start,i),k=fmt(d);g+=`<div class="c ${d.getMonth()!==m?'out':''} ${k===tk?'today':''}"><span style="${(holName(k)||d.getDay()===0)?'color:var(--sun)':d.getDay()===6?'color:var(--sat)':''}">${d.getDate()}</span>${obBadge(obShiftOn(d))}</div>`;}
    body=`<h2>이렇게 맞나요?</h2><div class="ob-sub">회사 근무표와 한 번 비교해 보세요</div>
      <div class="mcal"><div class="hd">${y}년 ${m+1}월</div><div class="g">${g}</div></div>
      <div class="okline">✓ ${esc(obName())}${obTeams()>1?' · '+esc(teamName(ob.team)):''} · 오늘 ${obPosLabels(obPattern())[((ob.pos-ob.shift)%obPattern().length+obPattern().length)%obPattern().length]}</div>
      <div class="ob-sub" style="font-size:12.5px">하루씩 어긋나 있으면 아래 버튼으로 밀어서 맞춰요.<br>특정 날만 다른 건 시작한 뒤 날짜를 눌러 고치면 돼요.</div>
      <div class="seg" style="margin-top:10px"><button data-act="ob-shift" data-v="-1">‹ 하루 앞으로</button><button data-act="ob-shift" data-v="1">하루 뒤로 ›</button></div>
      ${obTimesHtml()}`;
    foot=`<button class="btn" data-act="ob-next">맞아요</button>`;
  }else if(s==='alarm'){
    const issues=nativeIssues();
    body=`<h2>출근 알람도<br>맞춰 드릴까요?</h2><div class="ob-sub">근무에 맞춰서만 울려요. 휴무날은 조용해요</div>
      ${obAlarms().map(([k,a],i)=>{const tt=ampm(a.t);return `<div class="alrow">${obBadge(k)}<button type="button" class="tx" data-act="tpk" data-id="obT_${i}" data-type="time"><b><small style="display:inline;font-size:13px;margin-right:4px">${tt.ap}</small>${tt.tm}</b><small>${esc(shiftNameOf(k))} 근무 날</small></button><input type="hidden" id="obT_${i}" value="${a.t}"><label class="sw"><input type="checkbox" id="obOn_${i}" ${a.on?'checked':''}><i></i></label></div>`;}).join('')}
      ${hasBridge('status')?`<div class="lbl">알람이 꼭 울리게 하려면</div>
      ${PERM_KEYS.map(k=>`<div class="perm"><div class="ck ${issues.includes(k)?'no':''}">${issues.includes(k)?'!':'✓'}</div><span>${PERM_NAME[k]}</span>${issues.includes(k)?`<button data-act="nativefix" data-k="${k}">켜기 ›</button>`:''}</div>`).join('')}
      ${isSamsung()&&issues.includes('batt')?`<div class="ob-sub" style="font-size:12px">${SAMSUNG_TIP}</div>`:''}`:''}`;
    foot=`<button class="btn" data-act="ob-finish" data-v="1">시작하기</button><button class="lk" data-act="ob-finish" data-v="0">알람은 나중에</button>`;
  }else{
    const t=new Date(),a=shiftOf(t),b=shiftOf(addDays(t,1));
    const msg=S.noPat?'달력에서 날짜를 눌러 근무를 넣어 보세요':`오늘은 <b style="color:var(--fg)">${esc(shiftLabel(a))}</b>, 내일은 <b style="color:${isRest(b)?'var(--rest)':'var(--fg)'}">${esc(shiftLabel(b))}</b>${iyeyo(shiftLabel(b))}`;
    body=`<div style="text-align:center;padding-top:40px"><div style="font-size:52px">🎉</div><h2 style="margin-top:10px">준비 끝!</h2>
      <div class="ob-sub">${msg}</div></div>
      <div style="margin-top:30px">
      ${WX_URL&&!ad('wx')&&Object.keys(ob.tm||{}).length?'<button class="choice" data-act="ob-wx"><div class="ic" style="--ic:#0ea5e9">'+npi('cloud-sun',22)+'</div><div><b>출퇴근 날씨 받기</b><small>정한 근무 시간에 맞춰 출근 · 퇴근 날씨와 미세먼지를 알려줘요</small></div></button>':''}
      ${S.link?'':`<button class="choice" data-act="ob-invite"><div class="ic" style="--ic:#8b5cf6">${npi('heart',22)}</div><div><b>가족 초대하기</b><small>가족이 내 근무를 보고 메모를 남길 수 있어요</small></div></button>`}
      ${hasBridge('driveBackup')?'<button class="choice" data-act="ob-drive"><div class="ic" style="--ic:#10b981">'+npi('cloud-up',22)+'</div><div><b>구글 드라이브 백업 켜기</b><small>폰을 바꿔도 근무표·메모가 그대로 (추천)</small></div></button>':''}
      ${WX_URL&&!ad('wx')&&!Object.keys(ob.tm||{}).length?'<button class="choice" data-act="ob-wx"><div class="ic" style="--ic:#0ea5e9">'+npi('cloud-sun',22)+'</div><div><b>출퇴근 날씨 받기</b><small>나중에 해도 돼요 · 출근 땐 집, 퇴근 땐 직장 날씨 · 미세먼지</small></div></button>':''}</div>`;
    foot=`<button class="btn" data-act="ob-done">달력 보러 가기</button>`;
  }
  const sc=document.querySelector('#onboard .ob-b'),keep=sc&&ob.lastStep===s?sc.scrollTop:0;
  $('#onboard').innerHTML=`${prog}${back}<div class="ob-b">${body}</div>${foot?`<div class="ob-f">${foot}</div>`:''}`;
  ob.lastStep=s;
  if(keep){const n=document.querySelector('#onboard .ob-b');if(n)n.scrollTop=keep;}
}
function obApply(){
  if(ob.way==='custom'){
    const ts=obCTypes(),keep=new Set(ts.map(t=>t.k));
    ts.forEach(t=>{if(!S.types.some(x=>x.k===t.k))S.types.push(Object.assign({},t));});
    if(ob.entry!=='later')S.types=S.types.filter(t=>BUILTIN.includes(t.k)||keep.has(t.k));   // 처음 만드는 사람은 안 쓰는 기본 근무타입(상주 · 교육)을 정리
    S.pattern=ob.cpat.slice();S.teamOffsets=[0];S.myTeam=0;S.holRest=false;S.patternName='내 근무';
  }else{
    const p=obPreset();
    if(p.add&&!S.types.some(t=>t.k===p.add.k))S.types.push(Object.assign({},p.add));
    S.pattern=obPattern().slice();
    S.teamOffsets=(p.off||[6,4,0,2]).slice();
    S.myTeam=Math.min(ob.team,S.teamOffsets.length-1);
    S.holRest=!!p.hol;
    S.patternName=p.name.replace(/\s/g,'').replace(/\(.*\)/,'');
  }
  {let tks=[];try{tks=obTmKeys();}catch(e){}const all={};tks.forEach(k=>{try{all[k]=obTmOf(k);}catch(e){}});Object.assign(all,ob.tm||{});Object.entries(all).forEach(([k,v])=>{if(!Array.isArray(v)||!okTime(v[0])||!okTime(v[1]))return;S.shiftTimes=S.shiftTimes||{};S.shiftTimes[k]=Object.assign({},S.shiftTimes[k],{start:v[0],end:v[1]});});}   // 처음 설치에서 보인 근무 시간: 안 고친 것(기본값)도 그대로 저장 (v0.234 화면에 보인 시간 = 진짜 시간)
  S.anchor=obAnchor();S.patOld=[];
  if(ob.entry!=='later'||!S.noPat)S.overrides={};   // 불규칙으로 날짜마다 넣어 둔 근무는 패턴을 만들어도 그대로
  S.noPat=false;S.myset=true;S.personal=false;S.pers=[];
}
function obFinish(withAlarm){
  obApply();
  if(withAlarm){
    obAlarms().forEach(([k,a])=>{if(a.on)S.alarms.push(Object.assign(newAlarm(),{isNew:undefined,time:a.t,shift:k}));});
    S.alarms.forEach(a=>delete a.isNew);
  }
  S.onboarded=true;save();
  ob.step='done';renderOb();
}
// 불규칙: 순서 없이 달력에서 날짜마다 직접 넣음 (달력은 비어 있음)
function obIrregular(){
  if(ob.entry==='later'&&S.myset&&!S.noPat&&!confirm('지금 근무 패턴이 사라지고 빈 달력이 돼요.\n(날짜마다 고쳐 둔 근무는 그대로예요)\n불규칙으로 바꿀까요?'))return;
  S.noPat=true;S.myset=true;S.onboarded=true;S.patternName='불규칙 근무';S.holRest=false;
  if(ob.entry!=='later')S.overrides={};
  save();ob.step='done';renderOb();
}
// 건너뛰기: 내 근무표는 아직 없음 (빈 달력 · 가족에게 올리지 않음) → 달력 위 "내 근무표 만들기"로 나중에
function obSkip(){
  if(ob.entry==='later'){obCancel();return;}
  S.noPat=true;S.myset=false;S.onboarded=true;S.patternName='';S.holRest=false;S.overrides={};
  save();obClose();
}
function obClose(){
  $('#onboard').classList.remove('open');$('#onboard').innerHTML='';
  ob=null;
  tab='cal';const n=new Date();setCur(n.getFullYear(),n.getMonth());render();
  S.seenVer=appVersion()||S.seenVer;save();   // 새로 시작한 사람에게는 "새로 생겼어요"를 안 보여요
  setTimeout(addonNotice,700);
}
const LOGO=`<svg class="logo-ic" viewBox="0 0 108 108"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#252A66"/><stop offset="1" stop-color="#3B3F9E"/></linearGradient></defs><rect width="108" height="108" rx="24" fill="url(#lg)"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"><path d="M38,28h32a13,13 0,0 1,13 13v30a13,13 0,0 1,-13 13h-32a13,13 0,0 1,-13 -13v-30a13,13 0,0 1,13 -13z"/><path d="M25,46h58"/></g><path fill="#fff" d="M40.5,22h0a2.5,2.5 0,0 1,2.5 2.5v8a2.5,2.5 0,0 1,-5 0v-8a2.5,2.5 0,0 1,2.5 -2.5zM67.5,22h0a2.5,2.5 0,0 1,2.5 2.5v8a2.5,2.5 0,0 1,-5 0v-8a2.5,2.5 0,0 1,2.5 -2.5z"/><path fill="#fff" d="M49.26,51.02A15,15 0,1 0 63.82,71.82A12.75,12.75 0,0 1 49.26,51.02z"/><path fill="#FFD36B" d="M70,52.5L71.65,56.35L75.5,58L71.65,59.65L70,63.5L68.35,59.65L64.5,58L68.35,56.35z"/></svg>`;

/* ================= 공휴일 받아오기 ================= */
function refreshHolidays(force){
  if(!force&&Date.now()-(REMOTE_HOL.fetchedAt||0)<6*3600e3)return;
  if(typeof fetch!=='function')return;
  fetch(HOL_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{
    if(!j||!j.years||typeof j.years!=='object')return;
    const before={},firstFetch=!REMOTE_HOL.fetchedAt;
    const today=fmt(new Date());
    Object.keys(j.years).forEach(y=>{before[y]=Object.assign({},holMap(+y));});
    REMOTE_HOL={fetchedAt:Date.now(),years:j.years,updated:j.updated||''};
    try{localStorage.setItem(HOL_KEY,JSON.stringify(REMOTE_HOL));}catch(e){}
    for(const k in holCache)delete holCache[k];
    updateRange();
    // 새로 생긴 공휴일 알려주기 (오늘 이후만)
    const added=[];
    Object.keys(j.years).forEach(y=>{for(const [k,n] of Object.entries(j.years[y]||{})){if(k>=today&&!before[y][k])added.push([k,HOL_FIX[n]||n]);}});
    if(!firstFetch)added.slice(0,3).forEach(([k,n])=>{
      const d=parse(k),txt=`📢 ${d.getMonth()+1}월 ${d.getDate()}일(${DOW[d.getDay()]})이 ${n}(으)로 지정됐어요`;
      ['host','guest'].forEach(r=>pushEvent(r,'hol',k,txt));
    });
    if(added.length&&!firstFetch){save();toast(`📢 새 공휴일 ${added.length}개가 달력에 들어왔어요`);}
    render();
  }).catch(()=>{});
}

/* ================= 이벤트 처리 ================= */
// 흐린(이웃 달) 칸을 눌렀을 때 어느 쪽 달로 갈지: 앞달 -1 · 다음달 +1
const monthDirOf=(k,y,m)=>{const d=parse(k);return (d.getFullYear()*12+d.getMonth())>(y*12+m)?1:-1;};
// v0.136 달 넘김을 "페이지 넘기기"처럼: 옆 판은 이미 그려져 있으니 판을 옮기기만 하고, 새로 필요한 맨 끝 판 하나만 만든다
// (전에는 넘길 때마다 세 판을 다 다시 그리고 새 달 스티커 크기를 그때 재서 느린 폰에서 1초 가까이 멈춤 → 그 사이 손가락이 씹힘)
var calKeep=false,calFarT=0,calPreT=0;
const CAL_R=12;   // v0.138 앞뒤 몇 달을 판으로 둘지 (연달아 밀어도 끝에 안 닿게 · 먼 판은 다가올 때 채움)
const calFar=mk=>{const a=[];for(let i=2;i<=CAL_R;i++)a.push(mk-i,mk+i);return a;};
function calShiftFast(n,keepView){
  if(tab!=='cal'||Math.abs(n)>CAL_R||S.stzMode==='3'||paint||(famView()&&famPeers().length))return false;
  return calReorder(cur.y*12+cur.m+n,keepView);
}
function calFitMark(v){const mk=cur.y*12+cur.m;v.querySelectorAll('.track .panel').forEach(p=>{if(p.firstElementChild&&+p.dataset.mk===mk)p.dataset.fit=1;});}   // 보이는 달만 (옆 달은 calFillLater 가 스티커 크기까지 맞춤)
function calFill(p){const v=+p.dataset.mk;if(v<MIN_M||v>MAX_M){p.innerHTML='';return;}const ll=lastLines;p.style.removeProperty('--stz');p.innerHTML=calPanel(Math.floor(v/12),v%12);lastLines=ll;}
function calFillLater(ms){clearTimeout(calFarT);calFarT=setTimeout(()=>{try{   // 한 번에 판 하나씩 (가까운 것부터) → 손가락이 와도 바로 받음
  const tr=$('#track');if(!tr||tab!=='cal')return;if(calTouch||busy||performance.now()-calLastS<120){calFillLater(150);return;}   // 손가락 · 움직이는 중엔 미룸
  if(uiQuiet()||$('#sheet.open')||$('#pop.open')){calFillLater(400);return;}   // v0.203 날짜 창 · 작은 창이 열리는 중 · 열려 있는 동안엔 옆 달 그리기를 미룸 (폰 기록: 열리는 도중 옆 달 맞추기 111ms 가 끼어들어 멈춤)
  const vi=Math.round(tr.scrollLeft/calW(tr)),P=[...tr.children].sort((a,b)=>Math.abs(+a.style.order-vi)-Math.abs(+b.style.order-vi)).filter(x=>Math.abs(+x.style.order-vi)<=2);   // 보이는 판 앞뒤 2달까지 (더 먼 판은 다가올 때)
  const p=P.find(x=>{const v=+x.dataset.mk;return (v>=MIN_M&&v<=MAX_M)&&(!x.firstElementChild||!x.dataset.fit);});if(!p)return;
  const v=+p.dataset.mk;if(!p.firstElementChild)calFill(p);p.dataset.fit=1;stzPanel(p,v);fitDn(p,true);memoShift(p);calFillLater(60);
}catch(e){}},ms==null?80:ms);}
// v0.138 지금 달을 nm 으로: 이미 있는 판은 그대로 두고 자리(order)만 바꿈 · 빠진 판만 새로 · keepView = 손으로 밀어 온 자리 그대로
function calReorder(nm,keepView){
  const tr=$('#track');if(!tr||tr.children.length!==3+CAL_R*2-2)return false;
  const mk=cur.y*12+cur.m,d=nm-mk;if(nm<MIN_M||nm>MAX_M||Math.abs(d)>CAL_R)return false;
  const P=[...tr.children],by={};P.forEach(p=>{by[+p.dataset.mk]=p;});
  const want=[nm-1,nm,nm+1,...calFar(nm)],free=P.filter(p=>!want.includes(+p.dataset.mk));
  const W=calW(tr),x0=tr.scrollLeft;
  const nodes=want.map(v=>{let p=by[v];if(!p){p=free.shift();p.dataset.mk=v;delete p.dataset.fit;p.innerHTML='';p.style.removeProperty('--stz');}p.style.order=CAL_R+v-nm;return p;});
  if(!nodes[1].firstElementChild)calFill(nodes[1]);
  [nodes[0],nodes[2]].forEach(p=>{if(!p.firstElementChild)calFill(p);});
  nodes.forEach(p=>tr.appendChild(p));
  cur={y:Math.floor(nm/12),m:nm%12};
  calIgn=performance.now();tr.scrollLeft=keepView?x0-d*W:CAL_R*W;
  calFillLater();calKeep=true;return true;
}
// 쉬는 동안 앞뒤 2달 스티커 크기를 미리 재 둠 (폰에 저장 · 넘길 때 다시 안 잼)
function calPrefetch(){
  clearTimeout(calPreT);if(S.stzMode==='3')return;
  const mk0=cur.y*12+cur.m,q=[mk0+1,mk0-1,mk0+2,mk0-2].filter(v=>v>=MIN_M&&v<=MAX_M);   // 한 번에 한 달씩 (손가락이 오면 바로 받게)
  const step=()=>{calPreT=setTimeout(()=>{const go=()=>{try{if(tab!=='cal'||busy||sx!==null||document.hidden||cur.y*12+cur.m!==mk0)return;const v=q.shift();if(v==null)return;stzMonth(v);if(q.length)step();}catch(e){}};
    if(window.requestIdleCallback)requestIdleCallback(go,{timeout:3000});else go();},q.length===4?1200:150);};
  step();
}
function shiftMonth(n,keepView){
  if(calShiftFast(n,keepView)){render();if(pageMode==='stats')openStatsPage();if(todayQ)setTimeout(todayGo,0);return;}
  const v=Math.min(MAX_M,Math.max(MIN_M,cur.y*12+cur.m+n));
  cur={y:Math.floor(v/12),m:v%12};render();
  if(pageMode==='stats')openStatsPage();
  if(todayQ)setTimeout(todayGo,0);   // 넘기는 중에 "오늘"을 눌렀으면 이어서
}
document.addEventListener('click',e=>{
  const nb=e.target.closest('#nav [data-tab]');
  if(nb){const TB=[...document.querySelectorAll('#nav button')].map(b=>b.dataset.tab),dir=Math.sign(TB.indexOf(nb.dataset.tab)-TB.indexOf(tab));tab=nb.dataset.tab;paint=null;pageBack=null;closeSheet();if(pageMode)closePage();render();try{MO.tabIn(dir);}catch(e){}if(tab==='fam')wxFetch(false);return;}   // v0.198 탭 모션
  if(e.target.id==='pop'){popBack();return;}
  const t=e.target.closest('[data-act]');
  if(!t)return;
  const a=t.dataset.act;
  if(a.startsWith('wx-')&&wxActs(a,t))return;
  switch(a){
    case 'open-month-picker':openMonthPicker();break;
    case 'picker-prev-y':tempPickerYear--;renderMonthPickerContent();break;
    case 'picker-next-y':tempPickerYear++;renderMonthPickerContent();break;
    case 'picker-set-m':{setCur(tempPickerYear,parseInt(t.dataset.m));closeSheet();render();break;}
    case 'prev':slideTo(-1);break;
    case 'next':slideTo(1);break;
    case 'today':todayGo();break;
    case 'day':if(paint){if(role()==='host')paintDay(t.dataset.k);break;}if(t.classList.contains('out')){buzz(6);slideTo(monthDirOf(t.dataset.k,cur.y,cur.m));break;}buzz(8);reqDraft={want:'휴',msg:''};memoTab='all';memoMode=role()==='host'?'my':'fam';memoEdit=null;memoText='';openDay(t.dataset.k);break;
    case 'close':closeSheet();break;
    case 'ptm-tog':patTmOpen=!patTmOpen;openPatternPage();break;

    case 'ot-open':otOpen(t.dataset.k);break;
    case 'ot-add':otAdd(+t.dataset.v);break;
    case 'ot-clear':if(otKey){delete S.ot[otKey];save();otAfter();closePop();}break;
    case 'page-close':{const b=pageBack;pageBack=null;closePage();if(b&&!pageMode){pgBackNav=true;b();pgBackNav=false;}break;}
    case 'pop-close':closePop();gAskPop();break;   // (가족방을 새로 만들고 코드 창을 닫으면 → 구글 연결 안내)
    case 'lnk':if(lnkHeld){lnkHeld=false;break;}e.stopPropagation();lnkOpen(t.dataset.u,!!t.dataset.fam);break;
    case 'nudge-bk':closePop();openBackupPage();break;
    case 'lnk-go':closePop();lnkGo(t.dataset.u);break;
    case 'lnk-open2':closePop();lnkOpen(t.dataset.u,!!t.dataset.fam);break;
    case 'pf-copy':copyText(pfText()||'(기록 없음)');break;
    case 'lnk-copy':closePop();lnkCopy(t.dataset.u);break;
    /* 시간 · 날짜 고르기 */
    case 'tpk':openTpk(t.dataset.id,t.dataset.type);break;
    case 'tpk-m':if(tpk){const v=tpk.y*12+tpk.m+(+t.dataset.v);tpk.y=Math.floor(v/12);tpk.m=v%12;renderTpk();}break;
    case 'tpk-d':if(tpk){tpk.v=t.dataset.v;tpkOk();}break;
    case 'tpk-ok':tpkOk();break;
    /* 아이콘 · 사진 */
    case 'icn-pick':icnPull();if(icn){icn.icon=t.dataset.v;icn.own='';icn.pickName=t.dataset.mine?(t.dataset.n||''):'';icn.srcId=t.dataset.src||'';
      if(icn.instant){icnSave();break;}
      const nm=t.dataset.n;if(nm&&icn.name!==null&&(!icn.name||icn.name===icn.autoWas)){icn.name=nm;icn.autoWas=nm;}
      renderIcn();}break;
    case 'icn-own-ok':icnSave();break;
    case 'icn-tab':icnPull();if(icn){icn.tab=+t.dataset.i;renderIcn();}break;
    case 'icn-save':icnSave();break;
    case 'icn-reset':{const o=icn;closePop();if(o&&o.onReset)o.onReset();break;}
    case 'icn-cancel':{const o=icn;closePop();if(o&&o.onCancel)o.onCancel();break;}
    case 'ico-add':icoAdd();break;
    case 'crp-ok':cropOk();break;
    case 'crp-again':cropBack();icoAdd();break;

    /* 상단 */
    case 'open-board':closeSheet();openBoard();break;
    case 'open-board-vc':closeSheet();setCur(vcY,vcM);openBoard();break;   // 내 달력 보기: 보고 있는 달의 포스트잇
    /* 포스트잇 */
    case 'pi-prev':case 'pi-next':{const dir=a==='pi-next'?1:-1,v=Math.min(MAX_M,Math.max(MIN_M,cur.y*12+cur.m+dir));setCur(Math.floor(v/12),v%12);render();openBoard();try{if(!RMq()){const b=document.querySelector('#page .pg-b');if(b)b.animate([{transform:`translateX(${dir*56}px)`,opacity:.15},{transform:'none',opacity:1}],{duration:320,easing:'cubic-bezier(.2,.9,.25,1)'});}}catch(e){}break;}   // v0.210 달 넘기면 그 쪽에서 밀려 옴
    case 'pi-new':piOpen(null);break;
    case 'pi-open':{if(piSwiped){piSwiped=false;break;}const n=piFind(t.dataset.id);if(n&&n.type==='list'&&!n.torn)openPiView(n.id);else piOpen(t.dataset.id);break;}
    case 'pi-check':{
      const n=piEd&&piEd.isNew?piEd.n:piFind(t.dataset.id);if(!n)break;
      const l=n.lines.find(x=>x.id===t.dataset.l);if(!l)break;
      if(piEd)piPull();
      const was=piDone(n);l.done=!l.done;l.doneBy=l.done?role():'';
      if(!piEd||!piEd.isNew){piAllDoneNote(n,was);piSave(n);}
      if(piEd)renderPiEd();else{render();openBoard();}
      break;}
    case 'pi-ladd':piAddLine();break;
    case 'pi-vcheck':{const n=piFind(t.dataset.id);if(!n)break;const l=n.lines.find(x=>x.id===t.dataset.l);if(!l)break;const was=piDone(n);l.done=!l.done;l.doneBy=l.done?role():'';buzz(8);piAllDoneNote(n,was);piSave(n);if(pageMode==='board'){render();openBoard();}openPiView(n.id);break;}
    case 'pi-vedit':piOpen(t.dataset.id);break;
    case 'pi-ldel':{const n=piTarget();if(!n)break;piPull();n.lines=n.lines.filter(x=>x.id!==t.dataset.l);if(!piEd.isNew)piSave(n);renderPiEd();break;}
    case 'pi-type':{const n=piTarget();if(!n)break;piPull();n.type=t.dataset.v;if(n.type==='list'&&!n.lines.length&&n.text.trim()){n.text.split('\n').map(x=>x.trim()).filter(Boolean).forEach(x=>n.lines.push({id:uid(),text:x.slice(0,60),done:false,doneBy:''}));n.text='';}renderPiEd(true);break;}
    case 'pi-share':{let n=piTarget();if(!n)break;piPull();
      if(n.srv){if(t.dataset.v==='1')break;n=piUnshare(n);if(!n)break;piEd={isNew:false,id:n.id};renderPiEd();break;}   // 가족 → 나만: 서버에서 내 폰으로 되돌림
      if(t.dataset.v==='1'&&S.link&&!n.shared){if(famRemain()<=0){famLimitSheet();break;}n.cnt=1;}   // v0.121 가족 포스트잇: 새로 붙일 때 1건
      n.shared=t.dataset.v==='1';if(!n.shared)delete n.cnt;if(!piEd.isNew){save();if(n.shared&&!S.link)pushEvent(other(),'board',boardKey(),`🗒 ${cur.m+1}월 포스트잇: "${piLabel(n).slice(0,24)}"`);if(n.shared&&S.link)famSyncBoardSoon();}renderPiEd();break;}
    case 'pi-color':{const n=piTarget();if(!n)break;piPull();n.color=t.dataset.v;if(!piEd.isNew)save();renderPiEd();break;}
    case 'pi-repeat':{const n=piTarget();if(!n)break;piPull();n.repeat=!n.repeat;if(!piEd.isNew)piSave(n);renderPiEd();toast(n.repeat?'🔁 다음 달부터 매달 자동으로 붙어요':'매달 반복을 껐어요');break;}
    case 'pi-react':{const n=piTarget();if(!n)break;piPull();n.reacts=n.reacts||{};const r=role();n.reacts[r]=n.reacts[r]===t.dataset.v?'':t.dataset.v;piSave(n);renderPiEd();break;}
    case 'pi-tear':{const n=piTarget();if(!n)break;piCommit();piTear(n);piEd=null;piClose(false);break;}
    case 'pi-del':{const n=piTarget();if(!n||!confirm('이 포스트잇을 지울까요?'))break;if(n.srv)piSrvDelete(n);else{const mk=boardKey();S.board[mk]=(S.board[mk]||[]).filter(x=>x.id!==n.id);}save();piEd=null;piClose(false);break;}
    case 'pi-save':afterCompose('#piText,#piTitle,#piLine',()=>{if(piCommit()){const isNew=piEd&&piEd.isNew;piEd=null;piClose(false);if(isNew)toast('📌 붙였어요');}});break;
    case 'pi-past':openPiPast();break;
    case 'pi-restore':{const n=piFind(t.dataset.id);if(n){n.torn=false;piSave(n);}closePop();openBoard();break;}
    case 'pi-purge':{if(!confirm('완전히 지울까요?'))break;const n=piFind(t.dataset.id);if(n&&n.srv)piSrvDelete(n);else{const mk=boardKey();S.board[mk]=(S.board[mk]||[]).filter(x=>x.id!==t.dataset.id);}save();openPiPast();break;}
    case 'pi-carry-go':boardCarryDo(true);break;
    /* 업무 일지 · 찾기 */
    case 'stz-go':{const k=t.dataset.k,d=parse(k);closePage();tab='cal';setCur(d.getFullYear(),d.getMonth());render();openDay(k);break;}
    case 'stz-mode':S.stzMode=t.dataset.v==='3'?'3':'m';save();render();openTunePage();break;
    case 'wl-open':wlOpen(t.dataset.k);break;
    case 'wl-new':{const k=t.dataset.k;if(pageMode==='memodetail'){mdPull();wlFromMd=true;}else{mdDraft=null;closePage();}if(!S.wlog.name)wlNamePrompt(k);else wlOpen(k);break;}   // v0.209 메모 자세히에서는 그 자리 위에 일지 창 (날짜 창으로 돌아가지 않음)
    case 'wl-nmchip':{const i=$('#wlNm');if(i)i.value=t.dataset.v;break;}
    case 'wl-nmok':{const i=$('#wlNm');S.wlog.name=cutTxt(i?i.value:'',12).trim()||'업무 일지';save();closePop();wlOpen(wlNameK);break;}
    case 'wl-seen':S.wlog.seen=true;save();closePop();wlOpen(wlNoticeK);break;
    case 'wl-ren':if(!wlEd)break;wlCommitInputs();wlEd.ren=true;renderWl(true);break;
    case 'wl-renok':wlCommitInputs();if(wlEd){wlEd.ren=false;renderWl(false);}break;
    case 'wl-set':if(wlEd)wlClose();openWlSet();break;
    case 'wl-close':wlClose();break;
    case 'wl-copy':{if(!wlEd)break;wlCommitInputs();const tx=wlCopyText(wlEd.k);if(!tx){toast('복사할 내용이 없어요');break;}copyText(tx);break;}
    case 'wls-nm':{S.wlog.name=t.dataset.v;save();openWlSet();break;}
    case 'wls-own':{const own=!WL_NAMES.includes(wlName()),i=document.createElement('input');i.type='text';i.id='wlsName';i.className='wlsown';i.maxLength=12;i.placeholder='이름 쓰기';i.value=own?wlName():'';i.setAttribute('enterkeyhint','done');t.replaceWith(i);i.focus();break;}   // v0.225 직접 쓰기: 그 자리에서 입력칸
    case 'srch-open':pageBack=pageMode==='wlset'?openWlSet:null;srchOpen(t.dataset.v);break;
    case 'srch-kind':srch.kind=t.dataset.v==='wl'?'wl':'memo';S.srchKind=srch.kind;save();renderSrch(false);break;
    case 'srch-q':srchSetQ(t.dataset.v||'');break;
    case 'srch-clear':srchSetQ('');{const f=$('#srchQ');if(f)f.focus();}break;
    case 'srch-rm':{const L=Array.isArray(S.srchRecent)?S.srchRecent:[];L.splice(+t.dataset.i,1);S.srchRecent=L;save();srchRefresh();break;}
    case 'srch-rmall':S.srchRecent=[];save();srchRefresh();break;
    case 'srch-go':{srchRecentAdd(srch.q);const k=t.dataset.k,kind=t.dataset.kind,d=parse(k);closePage();tab='cal';setCur(d.getFullYear(),d.getMonth());render();
      if(kind==='board')openBoard();else{openDay(k);if(kind==='wl')wlOpen(k);}break;}
    case 'pi-carry-skip':boardCarryDo(false);break;
    case 'open-dday':openDday();break;
    case 'open-feed':feedTab='all';openFeed();break;
    case 'back-set':tab='set';render();break;
    case 'go-alarm':tab='alarm';render();break;
    case 'go-colleague':colM=null;openColleaguePage();break;
    case 'col-mon':{let m=colM.m+Number(t.dataset.v),y=colM.y;if(m<0){m=11;y--;}if(m>11){m=0;y++;}colM={y,m};openColleaguePage();break;}
    case 'col-mine':openPop(`<div class="mh">내 조</div>${teamList().map((n,g)=>`<button class="mi" data-act="tmine" data-g="${g}">${g===S.myTeam?'✓ ':''}${esc(n)}</button>`).join('')}`);break;
    case 'feed-sheet':feedTab='all';openFeed();break;
    case 'fam-refresh':{const b0=$('#famRef');if(b0)b0.classList.add('spin');famBoot();famPoll(true).finally(()=>{const b1=$('#famRef');if(b1)b1.classList.remove('spin');});toast('가족 소식을 새로 받는 중이에요');break;}
    case 'fam-set':openFamSetPage();break;
    case 'tog-open':openTogetherPage();break;
    case 'tog-day':{const k=t.dataset.k,d=parse(k);pageBack=null;closePage();tab='cal';setCur(d.getFullYear(),d.getMonth());render();openDay(k);break;}
    case 'fam-mytime':openPatTimes();break;
    case 'fam-mycal':{const n=new Date();tab='cal';paint=null;pageBack=null;if(pageMode)closePage();setCur(n.getFullYear(),n.getMonth());render();openDay(fmt(n));break;}   // 가족 탭 내 카드 위쪽 → 달력 · 오늘 날짜 창
    case 'fam-mode':{const v=t.dataset.v==='w'?'w':'c';if((S.famWk==='w'?'w':'c')===v){famGoToday();break;}S.famWk=v;save();render();setTimeout(famGoToday,80);try{if(!RMq()){const g=document.querySelector('.ftt .fgw'),b=document.querySelector(`.fmode [data-v="${v}"]`);if(g)g.animate([{opacity:.15,transform:`translateX(${v==='w'?24:-24}px)`},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.2,.9,.25,1)'});if(b)b.animate([{transform:'scale(.9)'},{transform:'scale(1.05)',offset:.6},{transform:'none'}],{duration:300});}}catch(err){}break;}   // v0.209 표가 그 쪽에서 살짝 넘어옴   // v0.167 이미 고른 칸을 눌러도 · 바꿔도 오늘(이번 주)로 부드럽게 (위 "오늘" 링크는 뺌)
    case 'fam-today':famGoToday();break;
    case 'req-go':{const k=t.dataset.k;if(!k)break;const d=parse(k);if(d.getFullYear()*12+d.getMonth()<MIN_M||d.getFullYear()*12+d.getMonth()>MAX_M){toast('달력에서 볼 수 없는 날이에요');break;}tab='cal';setCur(d.getFullYear(),d.getMonth());render();openDay(k);break;}
    case 'fam-day':{const k=t.dataset.k,d=parse(k);tab='cal';setCur(d.getFullYear(),d.getMonth());render();openDay(k);break;}
    case 'fam-add':{const n=(S.family||[]).length;famDraft={id:uid(),name:'',color:FAM_COL[n%6],kind:'office',days:[1,2,3,4,5],start:'09:00',end:'18:00',holOff:true,vac:[],team:S.myTeam};pageBack=pageMode==='famset'?openFamSetPage:null;openFamEdit();break;}
    case 'fam-mancal':{manId=t.dataset.id;const n=new Date();vcY=n.getFullYear();vcM=n.getMonth();renderManCalPage();break;}
    case 'man-ov':{const m=manMember();if(!m)break;const k=t.dataset.k,v=t.dataset.v;if(v)manSetOv(m,k,v);else if(m.ov){delete m.ov[k];if(!Object.keys(m.ov).length)delete m.ov;}save();renderManCalPage();openManDay(k);break;}
    case 'man-fold':{manFold=!manFoldOpen();const sec=t.closest('.shsec');if(sec){const o=manFold;shMorph(sec,o,()=>sec.classList.toggle('open',o));}else if(manDayK)openManDay(manDayK);break;}   // v0.198 내 날짜 창처럼 알약이 카드로 커짐
    case 'man-wx':{const m=manMember();if(m)famWxPop(m,t.dataset.k);break;}
    case 'man-paint':{const m=manMember();if(!m)break;manPaint={v:m.kind==='shift'?restKey():famRestType(famEra(m,manDayK?parse(manDayK):new Date())).k};closeSheet();renderManCalPage();toast('날짜를 누르거나 쭉 밀면 바뀌어요');break;}
    case 'man-paint-off':manPaint=null;renderManCalPage();break;
    case 'man-pk':if(manPaint){manPaint.v=t.dataset.v;renderManCalPage();}break;
    case 'man-day':if(manPaint)break;if(t.classList.contains('out')){buzz(6);vcMove(monthDirOf(t.dataset.k,vcY,vcM));break;}openManDay(t.dataset.k);break;
    case 'man-go':manGo(t.dataset.k);break;
    case 'mstk-page':openManStkPage();break;
    case 'mslot-open':openManStampReg(t.dataset.id,fmt(new Date()),'manstk');break;
    case 'mslot-add':openManStkAdd();break;
    case 'mine-open':openMineMenu(t.dataset.t,t.dataset.t==='p'?t.dataset.id:t.dataset.i);break;
    case 'mine-del':mineDel(t.dataset.t,t.dataset.k);break;
    case 'mslot-import':{const m=manMember();if(!m)break;if(manStkFull(m)){closePop();break;}const d=S.stamps.defs.find(x=>x.id===t.dataset.id);if(!d)break;const L=manSdefs(m),old=L.find(x=>x.id===d.id);
      if(old){delete old.retired;L.splice(L.indexOf(old),1);L.push(old);}else L.push({id:d.id,emoji:d.kind==='pill'?'💊':String(d.emoji||'⭐'),name:cutTxt(d.name,12)});save();closePop();manStkRefresh();break;}
    case 'man-stk-add':{if(manMember()&&manStkFull(manMember()))break;const k=t.dataset.k||fmt(new Date()),back=pageMode==='manstk'?'manstk':'mandy';openStampBig({title:'스티커 만들기',onPick:(e,n)=>{const m=manMember();if(!m)return;const f=stDefFrom(e,n),id='m_'+uid();manSdefs(m).push({id,emoji:f.kind==='pill'?'💊':f.emoji,name:f.name,rep:'none'});save();closePop();openManStampReg(id,k,back,back==='mandy');}});break;}
    case 'mstk-ok':mstkSave();save();closePop();actAuto();manStkRefresh();break;
    case 'mstk-swap':{const id=t.dataset.id;mstkPullName(id);openStampBig({title:'다른 스티커로',onPick:(e,n)=>{const m=manMember();if(!m)return;const x=manSdefs(m).find(y=>y.id===id);if(!x)return;const f=stDefFrom(e,n);x.emoji=f.kind==='pill'?'💊':f.emoji;save();closePop();if(stDraft&&stDraft.own&&stDraft.id===id){stDraft.emoji=x.emoji;renderStampReg();}else if(msDraft)renderManStkEdit();else manStkRefresh();}});break;}
    case 'mstk-del':{msDraft=null;const m=manMember(),id=t.dataset.id;if(!m)break;const x=manSdefs(m).find(y=>y.id===id);if(x)x.retired=true;save();closePop();if(stDraft&&stDraft.own){const d=stDraft;manStampBack(d);}else manStkRefresh();toast('지웠어요 · 지난 날 기록은 남아요');break;}
    case 'msh-undo':{const h=manHidSnap,m=h&&(S.family||[]).find(y=>y.id===h.m);manHidSnap=null;closePop();if(!m)break;m.sdefs=JSON.parse(h.defs);save();manStkRefresh();toast('등록을 취소했어요');break;}
    case 'mstk-end':{msDraft=null;const m=manMember(),id=t.dataset.id;if(!m)break;const x=manSdefs(m).find(y=>y.id===id);if(!x)break;const k=fmt(new Date()),old=x.to||'';x.to=addK(k,-1);save();closePop();if(stDraft&&stDraft.own){manStampBack(stDraft);}else manStkRefresh();   // v0.135 내 스티커처럼 "그만하기" = 오늘부터 안 깔림
      toastUndo(`${icoTxt(x.emoji,'✔')} ${x.name||'스티커'} 오늘부터 그만해요 (지난 기록은 그대로)`,()=>{x.to=old;save();manStkRefresh();});break;}
    case 'man-stk-pick':openManStkPick(t.dataset.k);break;
    case 'man-stk-place':closePop();openManStampReg(t.dataset.id,t.dataset.k,'mandy',true);break;
    case 'man-stk':{hintBump('mstk');const m=manMember();if(!m)break;const k=t.dataset.k,id=t.dataset.id;m.stk=m.stk||{};const a=m.stk[k]||[];const x=(m.sdefs||[]).find(y=>y.id===id);
      const N=Math.max(1,(x&&x.times)||1),n=a.filter(y=>y===id).length;
      if(x&&x.act){m.actDone=m.actDone||{};if(!(m.actDone[k]||[]).includes(id))(m.actDone[k]=m.actDone[k]||[]).push(id);}   // 손으로 고친 날은 자동 완료가 다시 채우지 않음
      m.stk[k]=n>=N?a.filter(y=>y!==id):[...a,id];if(!m.stk[k].length)delete m.stk[k];
      save();renderManCalPage();openManDay(k);break;}
    case 'man-note':{const m=manMember();if(!m)break;const k=t.dataset.k,v=($('#manNote')||{value:''}).value.trim().slice(0,40);m.notes=m.notes||{};if(v)m.notes[k]=v;else delete m.notes[k];save();closeSheet();renderManCalPage();break;}
    case 'man-edit':{const m=manMember();if(!m)break;famDraft=JSON.parse(JSON.stringify(m));openFamEdit();break;}
    case 'fam-edit':{const m=S.family.find(x=>x.id===t.dataset.id);if(!m)break;famDraft=JSON.parse(JSON.stringify(m));pageBack=pageMode==='famset'?openFamSetPage:null;openFamEdit();break;}
    case 'fe-kind':famPull();famDraft.kind=t.dataset.v;if(famDraft.kind==='student'&&famDraft.start==='09:00'){famDraft.start='08:30';famDraft.end='15:00';}if(famDraft.kind==='office'&&famDraft.start==='08:30'){famDraft.start='09:00';famDraft.end='18:00';}openFamEdit();break;
    case 'fe-color':famPull();famDraft.color=t.dataset.v;openFamEdit();break;
    case 'fe-photo':famPull();openIcn({title:'가족 사진',sub:famDraft.name||'',icon:isPhoto(famDraft.photo)?famDraft.photo:'',letter:(famDraft.name||'?').slice(0,1),color:famDraft.color,name:null,hint:'사진을 넣으면 가족 탭에 얼굴이 보여요',emojis:[],resetLabel:'글자로',
      onSave:e=>{if(isPhoto(e))famDraft.photo=e;openFamEdit();},onReset:()=>{famDraft.photo='';openFamEdit();}});break;
    case 'fe-own':{famPull();const on=t.dataset.v==='1';famDraft.own=on;if(on&&!Array.isArray(famDraft.pat)){famDraft.pat=S.pattern.slice();famDraft.anc=S.anchor;}openFamEdit();break;}
    case 'fe-pcell':{famPull();const i=+t.dataset.i;openPop(`<div class="mh">${i+1}번째 칸<b>어떤 근무로 할까요?</b></div>
      <div class="mi"><div class="tchips">${S.types.map(x=>`<button class="tchip ${famDraft.pat[i]===x.k?'on':''}" data-act="fe-pset" data-i="${i}" data-s="${esc(x.k)}">${badge(x.k,'tc')}<small>${esc(x.name)}</small></button>`).join('')}</div></div>
      <div class="mi"><button class="btn ghost grow" data-act="pop-close">닫기</button></div>`);break;}
    case 'fe-pset':{const i=+t.dataset.i;if(famDraft&&famDraft.pat&&i<famDraft.pat.length)famDraft.pat[i]=t.dataset.s;closePop();openFamEdit();break;}
    case 'fe-padd':famPull();if(famDraft.pat.length<PAT_MAX)famDraft.pat.push(restKey());openFamEdit();break;
    case 'fe-pdel':famPull();if(famDraft.pat.length>2)famDraft.pat.pop();openFamEdit();break;
    case 'fe-team':famPull();famDraft.team=+t.dataset.v;openFamEdit();break;
    case 'fe-day':{famPull();const c=famEdCfg(),w=+t.dataset.v,d=c.days||famDraft.days||[1,2,3,4,5];c.days=d.includes(w)?d.filter(x=>x!==w):[...d,w];famReRender();break;}
    case 'fe-vadd':{famPull();const c=famEdCfg();(c.vac=c.vac||[]).push({from:fmt(new Date()),to:fmt(addDays(new Date(),7))});famReRender();break;}
    case 'fe-vdel':{famPull();const c=famEdCfg();(c.vac||[]).splice(+t.dataset.i,1);famReRender();break;}
    case 'fe-pat':famPull();famDraft._own=false;openManPat();break;
    case 'man-pat':{const m=manMember();if(!m)break;famDraft=JSON.parse(JSON.stringify(m));famDraft._own=true;closeSheet();openManPat();break;}
    case 'fp-done':famPull();pageBack=null;openFamEdit();break;
    case 'fp-save':{famPull();const m=famDraft;delete m._ed;delete m._own;const i=S.family.findIndex(x=>x.id===m.id);if(i>=0)S.family[i]=m;famDraft=null;pageBack=null;save();renderManCalPage();toast('일정 패턴을 저장했어요');wxFetch(true);break;}
    case 'fe-ft':famPull();openFtEdit(famEdCfg(),t.dataset.k,()=>famReRender(),famDraft);break;
    case 'fe-ftadd':famPull();openFtEdit(famEdCfg(),'',()=>famReRender(),famDraft);break;
    case 'fe-home':{famPull();actPickRegion(code=>{famDraft.home=wxOk(code)&&code!==S.wx.home?code:'';if(!famDraft.home)delete famDraft.home;famReRender();},'🏠 집 위치');break;}
    case 'fe-loc':{famPull();const c=famEdCfg();actPickRegion(code=>{c.loc=wxOk(code)?code:'';famReRender();},famDraft.kind==='student'?'📍 학교 · 유치원 위치':'📍 회사 위치');break;}
    case 'fe-era':famPull();famDraft._ed=+t.dataset.i;famReRender();break;
    case 'fe-era-add':{famPull();const d0=new Date(),y=d0.getMonth()>=2?d0.getFullYear()+1:d0.getFullYear();
      openPop(`<div class="mh">이 날부터 새 일정<b>언제부터 바뀌어요?</b></div>
        <div class="mi"><div class="pl2">시작 날</div>${tpick('eraD',`${y}-03-02`,'','date')}</div>
        <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">닫기</button><button class="btn grow" data-act="fe-era-ok">만들기</button></div>`);break;}
    case 'fe-era-ok':{const from=($('#eraD')||{}).value||'';if(!okDate(from))break;const m=famDraft;m.eras=m.eras||[];if(m.eras.some(e=>e.from===from)){toast('그 날 시작하는 구간이 이미 있어요');break;}
      const src=Object.assign({},m,famEraRef(m,parse(from)));
      m.eras.push({from,ftypes:famTypes(src).map(x=>Object.assign({},x)),days:(src.days||[1,2,3,4,5]).slice(),vac:[],loc:wxOk(src.loc)?src.loc:''});m.eras.sort((a,b)=>a.from<b.from?-1:1);
      m._ed=m.eras.findIndex(e=>e.from===from);closePop();famReRender();toast(`${+from.slice(5,7)}월 ${+from.slice(8)}일부터 쓸 일정이에요 · 종류 · 시간 · 위치를 고쳐 주세요`);break;}
    case 'fe-era-del':{const m=famDraft,i=famEdIdx(m);if(i<0)break;if(!confirm('이 구간을 지울까요? (그 날짜들은 앞 구간 일정으로 돌아가요)'))break;m.eras.splice(i,1);if(!m.eras.length)delete m.eras;m._ed=-1;famReRender();break;}
    case 'ft-rest':ftPull();ftDraft.rest=t.dataset.v==='1';renderFtEdit();break;
    case 'ft-col':ftPull();ftDraft.color=t.dataset.v;renderFtEdit();break;
    case 'ft-save':ftSave();break;
    case 'ft-del':ftDel();break;
    case 'fe-save':{
      famPull();const m=famDraft;if(!m.name){toast('이름을 넣어주세요');break;}delete m._ed;delete m._own;
      m.vac=(m.vac||[]).filter(v=>v.from&&v.to).map(v=>v.from>v.to?{from:v.to,to:v.from}:v);
      const i=S.family.findIndex(x=>x.id===m.id);if(i>=0)S.family[i]=m;else S.family.push(m);
      famDraft=null;save();{const b=pageBack;pageBack=null;closePage();if(b)b();else{tab='fam';render();}}toast(i>=0?'고쳤어요':`👪 ${m.name}을(를) 추가했어요`);break;}
    case 'fe-del':if(famDraft&&confirm(`${famDraft.name||'이 가족'}을(를) 목록에서 뺄까요?`)){S.family=S.family.filter(x=>x.id!==famDraft.id);famDraft=null;save();{const b=pageBack;pageBack=null;closePage();render();if(b)b();}}break;
    case 'fam-cheer':{
      const c=cheerList()[+t.dataset.i];if(!c)break;
      const today=fmt(new Date());
      const ce=icoTxt(c[0],'💌');
      if(S.events.some(e=>e.kind==='cheer'&&e.to==='host'&&e.text.startsWith(ce)&&e.text.includes(`"${c[1]}"`)&&fmt(new Date(e.t))===today)){toast('오늘은 이미 보냈어요 💌');break;}
      pushEvent('host','cheer','',`${ce} 가족이 응원을 보냈어요: "${c[1]}"`);save();render();toast(`${ce} 응원을 보냈어요`);break;}
    case 'fam-cheer-edit':openCheerEdit();break;
    case 'cheer-ico':{const l=cheerPull(),i=+t.dataset.i;if(!l[i])break;S.famCheer=l;
      openIcn({title:'응원 아이콘',sub:l[i][1],icon:l[i][0],name:null,emojis:['☕','💪','🍗','❤️','🍀','👍','🙏','😘','🎉','🌙'],needIcon:true,onSave:e=>{l[i][0]=e;S.famCheer=l;openCheerEdit();},onCancel:()=>openCheerEdit()});break;}
    case 'cheer-add':{const l=cheerPull();if(l.length<6)l.push(['🍀','오늘도 화이팅']);S.famCheer=l;openCheerEdit();break;}
    case 'cheer-del':{const l=cheerPull();l.splice(+t.dataset.i,1);S.famCheer=l.length?l:null;openCheerEdit();break;}
    case 'cheer-reset':S.famCheer=null;save();closePop();if(pageMode==='famset')openFamSetPage();toast('기본 응원 버튼으로 되돌렸어요');break;
    case 'cheer-save':S.famCheer=cheerPull();save();closePop();if(pageMode==='famset')openFamSetPage();render();toast('응원 버튼을 저장했어요');break;
    case 'g-link':if(S.link&&S.link.role!=='host'&&!confirm('구글 계정 하나는 기기 하나에만 연결돼요.\n\n방장 폰에 먼저 연결해 두는 게 좋아요. 이 기기(가족)에 먼저 연결하면, 나중에 방장 폰은 이 구글 계정으로 가족방을 지킬 수 없어요.\n\n그래도 이 기기에 연결할까요? (방장과 다른 구글 계정이면 괜찮아요)'))break;googleStart('link');break;
    case 'g-restore':googleStart('restore');break;
    case 'g-link-pop':closePop();googleStart('link');break;
    case 'link-open':if(!fbCfg()){toast('가족 연결은 준비 중이에요');break;}openLinkPage();break;
    case 'link-retry':famRefresh();break;
    case 'link-invite':openInvitePop();break;
    case 'link-join':openJoinPop();break;
    case 'lost-dismiss':S.linkLost=null;save();if(pageMode==='link')renderLinkPage();break;
    case 'link-move':if(confirm('이 가족방에서 나가고, 새 초대 코드로 다른 가족방에 들어갈까요?\n(먼저 새 코드를 받아 두세요)'))famDo(async()=>{await famRemoveMember(S.link.hid,FBX.uid);S.link=null;famClear();S.linkLost=null;save();setTimeout(()=>openJoinPop(),200);},'가족방에서 나왔어요');break;
    case 'inv-perm':invPull();invDraft.perm=t.dataset.v;renderInvitePop();break;
    case 'inv-make':invMake();break;
    case 'inv-share':famShare(t.dataset.c);break;
    case 'inv-copy':copyText(famFmt(t.dataset.c));break;
    case 'inv-del':famDo(async()=>{const {F,db}=await famReady();await F.deleteDoc(F.doc(db,'invites',t.dataset.c));},'코드를 지웠어요');break;
    case 'join-check':joinCheck();break;
    case 'join-back':openJoinPop();break;
    case 'join-go':joinGo();break;
    case 'mem-menu':openMemberMenu(t.dataset.u);break;
    case 'mem-aka':{const uid=t.dataset.u,m=(famUi.members||[]).find(x=>x.uid===uid);if(!m)break;
      openPop(`<div class="mh">내 폰에서 부를 이름<b>${esc(m.name)}</b></div><div class="mi" style="display:block"><input type="text" id="akaIn" maxlength="12" value="${esc((S.famAlias&&S.famAlias[uid])||m.name)}" style="width:100%"><div class="hint" style="padding:6px 0 0;margin:0">예: 남편 · 아빠 · 엄마 — ${esc(m.name)}님 폰에는 바뀌지 않아요</div></div>
        <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">취소</button><button class="btn grow" data-act="mem-aka-ok" data-u="${esc(uid)}">저장</button></div>`);
      setTimeout(()=>{const i=$('#akaIn');if(i){i.focus();i.select();}},60);break;}
    case 'mem-aka-ok':{const uid=t.dataset.u,m=(famUi.members||[]).find(x=>x.uid===uid),v=cutTxt(($('#akaIn')||{}).value||'',12).trim();S.famAlias=S.famAlias||{};if(!v||(m&&v===m.name))delete S.famAlias[uid];else S.famAlias[uid]=v;save();closePop();renderLinkPage();render();toast('부를 이름을 바꿨어요 (이 폰에서만)');break;}
    case 'mem-rename':openRename(t.dataset.u);break;
    case 'mem-save':memSave();break;
    case 'mem-out':{const m=famUi.members.find(x=>x.uid===t.dataset.u);if(m&&confirm(`${m.name}님을 가족방에서 뺄까요?`)){closePop();famDo(()=>famRemoveOther(m.uid),`${m.name}님을 뺐어요`);}break;}
    case 'kick-new':{const m=famUi.members.find(x=>x.uid===t.dataset.u);if(m&&confirm(`${m.name}님 내보내기를 가족에게 제안할까요?\n가족 과반이 찬성하면 빠져요 (7일 안). ${m.name}님에게는 빠진 뒤에만 알려요.`)){closePop();famDo(async()=>{const r=await famKickStart(m.uid);toast(r==='out'?`${m.name}님을 뺐어요`:'가족에게 제안했어요');});}break;}
    case 'kick-vote':{const m=famUi.members.find(x=>x.uid===t.dataset.u);if(m&&confirm(`${m.name}님 내보내기에 찬성할까요?`)){closePop();famDo(async()=>{const r=await famKickVote(m.uid);toast(r==='out'?`${m.name}님을 뺐어요`:'찬성했어요');});}break;}
    case 'kick-cancel':closePop();famDo(()=>famKickCancel(t.dataset.u),'제안을 취소했어요');break;
    case 'link-leave':if(confirm(famUi.members.length<=1?'나 혼자라 나가면 가족방이 없어져요.\n(내 근무표 · 메모는 이 폰에 그대로예요)\n\n나갈까요?':'이 가족방에서 나갈까요?\n(다시 들어오려면 가족에게 새 초대 코드를 받아요)'))famDo(async()=>{await famRemoveMember(S.link.hid,FBX.uid);S.link=null;famClear();save();},'가족방에서 나왔어요');break;
    case 'feed-tab':feedTab=t.dataset.v;openFeed();break;
    case 'coach-again':S.hints=S.hints||{};['tcal','twx','tfam'].forEach(x=>delete S.hints[x]);save();pageBack=null;closePage();tab='cal';render();coachSoon();break;
    case 'feed-go':{const k=t.dataset.k;if(!okDate(k))break;const d=parse(k);tab='cal';setCur(d.getFullYear(),d.getMonth());render();openDay(k);break;}
    case 'feed-allread':markSeen(()=>true);render();openFeed();break;
    case 'feed-open':{
      if(e.target.closest('button'))break;
      const ev=S.events.find(x=>x.id===t.dataset.id);if(!ev)break;
      ev.seen=true;save();render();
      if(ev.kind==='memo'||ev.kind==='hol'||ev.kind==='apply'||ev.kind==='reply'||ev.kind==='req'||ev.kind==='cc'){
        if(/^\d{4}-\d{2}-\d{2}$/.test(ev.k||'')){const d=parse(ev.k);tab='cal';setCur(d.getFullYear(),d.getMonth());render();openDay(ev.k);}
        else openFeed();
      }else if(ev.kind==='sch'){closeSheet();const d=parse(ev.k);if(ev.u)vcUid=ev.u;vcY=d.getFullYear();vcM=d.getMonth();vcSel.on=false;vcSel.dates=new Set();if(famView()){tab='cal';render();}else renderFamCalPage();
      }else if(ev.kind==='board'){const [y,m]=String(ev.k).split('-').map(Number);tab='cal';if(y){setCur(y,m-1);if(famView()){vcY=y;vcM=m-1;}}render();openBoard();}
      else if(ev.kind==='kick'){closeSheet();openLinkPage();}
      else openFeed();
      break;}

    /* 근무 직접 변경 */
    case 'setshift':{
      const fm=visibleMemos(sheetKey).filter(m=>m.shared&&m.by!=='host');
      if(fm.length&&!confirm(`♥ 가족 메모: "${firstLine(fm[0].text)}"\n\n정말 근무를 바꿀까요?`))return;
      applyShift(t.dataset.s);break;}
    case 'shift-tog':{shiftOpen=!shiftOpenNow();const secs=[...document.querySelectorAll('.shsec')],me=t.closest('.shsec');   // v0.194 누른 창은 모션 (옆 날짜 창은 바로)
      secs.forEach(e=>{if(e!==me)e.classList.toggle('open',shiftOpen);});
      if(me)shMorph(me,shiftOpen,()=>me.classList.toggle('open',shiftOpen));
      break;}
    case 'resetshift':delete S.overrides[sheetKey];save();openDay(sheetKey);render();break;

    /* 날짜 메모 */
    case 'memo-tab':memoTab=t.dataset.v;openDay(sheetKey);break;
    case 'memo-mode':{const i=$('#memoInput');if(i)memoText=i.value;memoMode=t.dataset.v;openDay(sheetKey);const j=$('#memoInput');if(j)j.focus();break;}
    case 'memo-send':if(memoEdit&&document.querySelector('.mcard.medit')){const id=memoEdit;afterCompose('#memoInput',()=>{const el=$('#memoInput');if(!el||!el.value.trim()){memoSubmit();return;}medCloseFx(()=>{memoSubmit();medDoneFx(id);});});break;}afterCompose('#memoInput',memoSubmit);break;
    case 'memo-detail':openMemoDetail(sheetKey,memoEdit);break;
    case 'memo-chk':{const rm=rmemoOf(t.dataset.mid);if(rm){const k=sheetKey,a=rm.done||[];rm.done=a.includes(k)?a.filter(x=>x!==k):[...a,k].slice(-120);if(!rm.done.length)delete rm.done;save();render();openDay(sheetKey);break;}const m=memosOf(sheetKey).find(x=>x.id===t.dataset.mid);if(m){m.done=!m.done;if(!m.done)delete m.done;save();render();openDay(sheetKey);}break;}
    case 'md-back':mdDraft=null;closePage();break;
    case 'md-col':mdPull();mdDraft.color=mdDraft.color===t.dataset.v?'':t.dataset.v;renderMemoDetail();break;
    case 'md-share':mdPull();mdDraft.shared=t.dataset.v==='1';if(mdDraft.shared&&!mdDraft.pc&&mdDraft.color)mdDraft.pc=mdDraft.color;MO.flip($('#page .pg-b'),renderMemoDetail);break;
    case 'md-al':mdPull();mdDraft.al=t.dataset.v;renderMemoDetail();break;
    case 'md-settill':{mdPull();mdDraft.till=addK(mdDraft.k,2);const pg0=$('#page .pg-b'),st0=pg0?pg0.scrollTop:0;if(mdDraft.shared)MO.flip(pg0,renderMemoDetail);else renderMemoDetail();   // 가족 메모: 띠 색 줄이 나만 메모 색 줄처럼 생김   // v0.232 기간: 처음엔 사흘 (고쳐서 끝 날 고름) · v0.235 시간 줄처럼 ＋가 돌며 ✕ · 날짜 톡 · 띠 색 줄 스르르
      try{const pg=$('#page .pg-b');if(pg)pg.scrollTop=st0;if(!RMq()){const tb=$('#mdTill'),r=tb&&tb.closest('.mdtrow'),x=r&&r.querySelector('.xbtn'),tp=r&&r.querySelector('.tbtn'),tl=r&&r.querySelector('.mdtill');
        if(x)x.animate([{transform:'rotate(-135deg)',background:'var(--acc-soft)'},{transform:'none'}],{duration:420,easing:'cubic-bezier(.3,1.4,.5,1)'});
        [tl,tp].forEach((e,i)=>{if(e)e.animate([{opacity:0,transform:'scale(.8)'},{opacity:1,transform:'none'}],{duration:300,delay:i*40,easing:'cubic-bezier(.3,1.4,.5,1)',fill:'backwards'});});
}}catch(e){}
      break;}
    case 'md-notill':{mdPull();mdDraft.till='';const pg=$('#page .pg-b'),st0=pg?pg.scrollTop:0;
      const go=()=>{if(mdDraft.shared)MO.flip($('#page .pg-b'),renderMemoDetail);else renderMemoDetail();const p2=$('#page .pg-b');if(p2)p2.scrollTop=st0;};
      try{const r=t.closest('.mdtrow');if(!RMq()&&r){   // v0.235 ✕가 반대로 돌며 ＋ · 날짜 · 띠 색 줄 접힘 → 다 접힌 뒤 다시 그림
        t.animate([{transform:'none'},{transform:'rotate(135deg)'}],{duration:180,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
        [r.querySelector('.tbtn'),r.querySelector('.mdtill')].forEach(e=>{if(e)e.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(.8)'}],{duration:220,fill:'forwards'});});
        setTimeout(go,170);break;}}catch(e){}
      go();break;}
    case 'per-open':if(t.dataset.srv)openDay(t.dataset.k);else openMemoDetail(t.dataset.k,t.dataset.id);break;
    case 'md-pc':mdPull();mdDraft.pc=t.dataset.v||'';renderMemoDetail();break;   // v0.233 가족 메모 띠 색
    case 'md-settime':{mdPull();mdDraft.time='09:00';const pb=$('#page');const st0=pb&&pb.querySelector('.pg-b')?pb.querySelector('.pg-b').scrollTop:0;renderMemoDetail();   // v0.209 ＋가 돌며 ✕ · 시간 톡 · 알림 줄 스르르
      try{const pg=$('#page .pg-b');if(pg)pg.scrollTop=st0;if(!RMq()){const r=$('#page .mdtrow'),x=r&&r.querySelector('.xbtn'),tp=r&&r.querySelector('.tbtn'),al=r&&r.nextElementSibling;
        if(x)x.animate([{transform:'rotate(-135deg)',background:'var(--acc-soft)'},{transform:'none'}],{duration:420,easing:'cubic-bezier(.3,1.4,.5,1)'});
        if(tp)tp.animate([{opacity:0,transform:'scale(.8)'},{opacity:1,transform:'none'}],{duration:300,easing:'cubic-bezier(.3,1.4,.5,1)'});
        if(al&&al.querySelector('.npseg'))al.animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'none'}],{duration:300,delay:60,easing:'cubic-bezier(.2,.9,.25,1)',fill:'backwards'});}}catch(e){}
      break;}
    case 'md-notime':{mdPull();mdDraft.time='';mdDraft.al='';const pg=$('#page .pg-b'),st0=pg?pg.scrollTop:0;
      const go=()=>{renderMemoDetail();const p2=$('#page .pg-b');if(p2)p2.scrollTop=st0;};
      try{const r=t.closest('.mdtrow'),al=r&&r.nextElementSibling;if(!RMq()&&r){   // v0.209 ✕가 반대로 돌며 ＋ · 알림 줄 스르르 접힘 → 다 접힌 뒤 다시 그림
        t.animate([{transform:'none'},{transform:'rotate(135deg)'}],{duration:180,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
        const tp=r.querySelector('.tbtn');if(tp)tp.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(.8)'}],{duration:220,fill:'forwards'});
        if(al&&al.querySelector('.npseg'))al.animate([{opacity:1},{opacity:0}],{duration:160,fill:'forwards'});
        setTimeout(go,170);break;}}catch(e){}
      go();break;}
    case 'md-save':mdSave();break;
    case 'md-rep':mdPull();mdDraft.rrDraft=null;openRrPick();break;
    case 'rr-md':mdDraft.rrDraft.md=+t.dataset.v;openRrPick();break;
    case 'rr-sh':{const r=mdDraft.rrDraft,v=t.dataset.v;r.sh=!v?[]:r.sh.includes(v)?r.sh.filter(x=>x!==v):[...r.sh,v];openRrPick();break;}
    case 'rr-miss':mdDraft.rrDraft.miss=t.dataset.v;openRrPick();break;
    case 'rr-ok':mdDraft.rr=mdDraft.rrDraft;mdDraft.rrDraft=null;mdDraft.shared=false;closePop();renderMemoDetail();break;
    case 'rr-off':mdDraft.rr=null;mdDraft.rrDraft=null;closePop();renderMemoDetail();break;
    case 'rm-skip':{const r=(S.rmemos||[]).find(x=>x.id===t.dataset.id);if(r&&sheetKey){r.skip=[...(r.skip||[]).filter(x=>x!==sheetKey),sheetKey].slice(-120);save();closePop();render();openDay(sheetKey);toast('이 날만 뺐어요');}break;}
    case 'rm-edit':closePop();openMemoDetail(sheetKey,'r:'+t.dataset.id);break;
    case 'rm-del':{if(!confirm('이 반복 메모를 그만할까요? (앞으로 안 나와요)'))break;S.rmemos=(S.rmemos||[]).filter(x=>x.id!==t.dataset.id);save();closePop();mdDraft=null;if(pageMode==='memodetail')closePage();render();if(sheetKey)openDay(sheetKey);try{pushRemindersToNative();}catch(e){}toast('반복 메모를 그만했어요');break;}
    case 'memo-cancel':{const id=memoEdit;medCloseFx(()=>{memoEdit=null;memoText='';openDay(sheetKey);medDoneFx(id);});break;}
    case 'memo-copy':{   // 고치는 중인 메모 글 복사 (입력칸에 적힌 그대로, 비었으면 원래 메모)
      const i=$('#memoInput');let tx=i?i.value:memoText;
      if(!String(tx||'').trim()){const m0=memoEdit&&memosOf(sheetKey).find(x=>x.id===memoEdit);tx=m0?m0.text:'';}
      if(!String(tx||'').trim()){toast('복사할 글이 없어요');break;}
      copyText(tx);break;}
    case 'mm-copy':{   // 메모 메뉴의 [복사] (내 메모 · 가족이 쓴 메모 모두)
      const id=t.dataset.mid,m0=String(id).startsWith('s:')?famRemoteMemos(sheetKey).find(x=>x.id===id):memosOf(sheetKey).find(x=>x.id===id);
      closePop();if(m0)copyText(m0.text);break;}
    case 'memo-tap':{
      if(e.target.closest('.conv,.mchk'))break;
      if(memoEdit&&memoEdit===t.dataset.mid)break;
      if(rmemoOf(t.dataset.mid)){openMemoDetail(sheetKey,t.dataset.mid);break;}   // 반복 메모: 자세히에서 고침
      if(String(t.dataset.mid).startsWith('s:')){toast(S.link&&S.link.role==='host'?'가족이 쓴 메모예요 · 길게 누르면 복사하거나 지울 수 있어요':'가족이 쓴 메모는 고칠 수 없어요 · 길게 누르면 복사할 수 있어요');break;}
      const m=memosOf(sheetKey).find(x=>x.id===t.dataset.mid);if(!m)break;
      if(m.by!==role()){toast(role()==='host'?'가족이 쓴 메모예요 · 길게 누르면 복사하거나 지울 수 있어요':'근무자가 쓴 메모는 고칠 수 없어요 · 길게 누르면 복사할 수 있어요');break;}
      if(m.till){openMemoDetail(sheetKey,m.id);break;}   // v0.233 기간 띠 메모는 자세히에서 (기간도 같이 고침)
      memoEdit=m.id;memoText=m.text;memoMode=m.shared?'fam':'my';openDay(sheetKey);
      try{if(!RMq())medOpenFx();}catch(err){}   // v0.210 그 줄이 입력칸으로 스르르 펼쳐짐
      const i=$('#memoInput');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}
      break;}
    case 'memo-conv':{
      const m=memosOf(sheetKey).find(x=>x.id===t.dataset.mid);if(!m)break;
      if(S.link){if(famRemain()<=0){famLimitSheet();break;}openCfm({type:'memo',k:sheetKey,text:m.text,id:m.id});break;}
      m.shared=true;m.t=Date.now();
      pushEvent(other(),'memo',sheetKey,`♥ ${md(sheetKey)}에 메모를 남겼어요: "${firstLine(m.text).slice(0,24)}"`);
      save();render();openDay(sheetKey);toast('♥ 가족 메모로 바꿨어요');break;}
    case 'mm-fam':case 'mm-my':{
      const m=memosOf(sheetKey).find(x=>x.id===t.dataset.mid);closePop();if(!m)break;
      if(a==='mm-fam'&&S.link){if(famRemain()<=0){famLimitSheet();break;}openCfm({type:'memo',k:sheetKey,text:m.text,id:m.id});break;}
      m.shared=a==='mm-fam';
      if(m.shared)pushEvent(other(),'memo',sheetKey,`♥ ${md(sheetKey)}에 메모를 남겼어요: "${firstLine(m.text).slice(0,24)}"`);
      save();render();openDay(sheetKey);toast(m.shared?'♥ 가족 메모로 바꿨어요':'🔒 나만 보기로 바꿨어요');break;}
    case 'mm-edit':{
      const m=memosOf(sheetKey).find(x=>x.id===t.dataset.mid);closePop();if(!m)break;
      if(m.till){openMemoDetail(sheetKey,m.id);break;}   // v0.233 기간 띠 메모는 자세히에서
      memoEdit=m.id;memoText=m.text;memoMode=m.shared?'fam':'my';openDay(sheetKey);
      const i=$('#memoInput');if(i)i.focus();break;}
    case 'mm-movepick':{   // v0.198 날짜 옮기기: 날짜를 고르면 바로 옮김 (되돌리기)
      mmMove={mid:t.dataset.mid,k:sheetKey};let h=$('#mmDateH');if(!h){h=document.createElement('input');h.type='hidden';h.id='mmDateH';document.body.appendChild(h);}h.value=sheetKey;openTpk('mmDateH','date');break;}
    case 'mm-move':{
      const nk=($('#mmDate')||{}).value;const k=sheetKey;
      if(!nk||nk===k){toast('옮길 날짜를 골라주세요');break;}
      const m=memosOf(k).find(x=>x.id===t.dataset.mid);closePop();if(!m)break;
      S.memos[k]=memosOf(k).filter(x=>x!==m);tidyMemos(k);
      (S.memos[nk]=S.memos[nk]||[]).push(m);
      save();render();openDay(k);toast(`${md(nk)}로 옮겼어요`);break;}
    case 'mm-del':{
      const k=sheetKey;closePop();
      if(!confirm('이 메모를 지울까요?'))break;
      S.memos[k]=memosOf(k).filter(x=>x.id!==t.dataset.mid);tidyMemos(k);
      if(memoEdit===t.dataset.mid){memoEdit=null;memoText='';}
      save();render();openDay(k);break;}

    /* 근무 요청 흐름 */
    case 'rqwant':reqDraft.want=t.dataset.s;t.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===t));break;
    case 'rqsend':doRqSend();break;
    case 'watchad':openAdSheet();break;
    case 'gopro':openProSheet();break;
    case 'dopro':S.syncSettings.isPro=true;save();toast('⭐ 구독이 시작됐어요 (예시)');resumePending();break;
    case 'rqcancel':{
      const r0=S.requests.find(x=>x.id===t.dataset.id);
      if(r0&&r0.st==='pending'){
        const its=grpItems(r0);
        its.forEach(r=>{if(r.st!=='pending')return;r.st='cancelled';r.tu=Date.now();if(r.srv)famReqPush(r,{st:'cancelled'});});
        pushEvent('host','req',r0.date,`⚪ ${its.length>1?dateRangeText(its.map(x=>x.date)):md(r0.date)} ${shiftLabel(r0.want)} 요청이 취소됐어요`);
        save();render();reopen();toast('요청을 취소했어요');
      }
      break;}
    case 'rqreply':e.stopPropagation();openReply(t.dataset.id,t.dataset.s);break;
    case 'rqback':{const b=replyDraft&&replyDraft.back;replyDraft=null;sheetMode=b;reopen();break;}
    case 'rqsend-reply':{
      if(!replyDraft)break;
      const r0=S.requests.find(x=>x.id===replyDraft.id);if(!r0)break;
      const st=replyDraft.st,text=(replyDraft.text||'').trim(),back=replyDraft.back;
      const its=grpItems(r0),many=its.length>1;
      its.forEach(r=>{
        r.reply=text;r.tu=Date.now();r.st=st;r.mode=null;r.held=(st==='pending');
        if(st==='accepted')applyRequest(r,many);   // 수락하면 근무도 바로 바뀜
        if(r.srv)famReqPush(r,{st:r.st,reply:text.slice(0,100),held:st==='pending',mode:r.mode||'',prev:r.prev||''});
      });
      const when=many?dateRangeText(its.map(x=>x.date)):md(r0.date);
      pushEvent('guest','reply',r0.date,`${REQ_ST[st].ic} ${when} ${shiftLabel(r0.want)} 요청: ${REQ_ST[st].name}${text?' · '+firstLine(text).slice(0,24):''}`);
      if(st==='accepted'&&many)pushEvent('guest','apply',r0.date,`✅ ${when} 근무가 ${shiftLabel(r0.want)}(으)로 바뀌었어요`);
      replyDraft=null;save();render();sheetMode=back;reopen();
      toast(st==='accepted'?`✅ 수락하고 ${when} 근무를 ${shiftLabel(r0.want)}로 바꿨어요`:`${REQ_ST[st].ic} ${REQ_ST[st].name} 답장을 보냈어요`);
      break;}
    case 'rqapply':{
      const r0=S.requests.find(x=>x.id===t.dataset.id);if(!r0||r0.st!=='accepted')break;
      const its=grpItems(r0),many=its.length>1;
      its.forEach(r=>{if(r.st!=='accepted')return;applyRequest(r,many);if(r.srv)famReqPush(r,{st:'applied',reply:(r.reply||'').slice(0,100),held:false,mode:r.mode||'change',prev:r.prev||''});});
      if(many)pushEvent('guest','apply',r0.date,`✅ ${dateRangeText(its.map(x=>x.date))} 근무가 ${shiftLabel(r0.want)}(으)로 바뀌었어요`);
      save();render();reopen();toast(`${many?dateRangeText(its.map(x=>x.date)):md(r0.date)} 근무를 ${shiftLabel(r0.want)}로 바꿨어요`);break;}
    case 'rqundo':{
      const r0=S.requests.find(x=>x.id===t.dataset.id);if(!r0||r0.st!=='applied')break;
      const its=grpItems(r0),many=its.length>1;
      its.forEach(r=>{
        if(r.st!=='applied')return;
        const d=parse(r.date);
        if(r.prev===baseShift(d))delete S.overrides[r.date];else S.overrides[r.date]=r.prev;
        r.st='pending';r.held=false;r.mode=null;r.tu=Date.now();if(r.srv)famReqPush(r,{st:'pending',reply:(r.reply||'').slice(0,100),held:false,mode:'',prev:''});
      });
      pushEvent('guest','apply',r0.date,`↩️ ${many?dateRangeText(its.map(x=>x.date)):md(r0.date)} 근무 변경이 취소됐어요`);
      save();render();reopen();toast('적용을 취소했어요 · 다시 답해 주세요');break;}
    case 'view-requests':openRequests();break;

    /* 월 메모 */
    /* D-day */
    case 'dday-new':ddDraft={isNew:true,id:uid(),name:'',date:fmt(new Date()),emoji:'📌',yearly:false,showCal:true,shared:false,by:role()};openDdayEdit();break;
    case 'dday-edit':{const x=(S.ddays||[]).find(y=>y.id===t.dataset.id);if(!x)break;if(x.by&&x.by!==role()){toast('가족이 만든 D-day예요');break;}ddDraft=Object.assign({isNew:false},x);openDdayEdit();break;}
    case 'dday-emoji':if(ddDraft){ddDraft.name=$('#ddName').value;ddDraft.date=$('#ddDate').value;ddDraft.emoji=t.dataset.v;openDdayEdit();}break;
    case 'dday-save':{
      if(!ddDraft)break;
      const name=$('#ddName').value.trim(),date=$('#ddDate').value;
      if(!name||!date){toast('이름과 날짜를 넣어주세요');break;}
      const item={id:ddDraft.id,name,date,emoji:ddDraft.emoji,yearly:$('#ddYearly').checked,showCal:$('#ddCal').checked,shared:$('#ddShare').checked,by:ddDraft.by||role()};
      const i=S.ddays.findIndex(x=>x.id===item.id);
      if(i>=0)S.ddays[i]=item;else S.ddays.push(item);
      if(item.shared&&ddDraft.isNew)pushEvent(other(),'dday',date,`D ${name} (${md(date)}) D-day를 같이 세요`);
      save();render();openDday();toast('저장했어요');break;}
    case 'dday-del':if(ddDraft&&confirm('이 D-day를 지울까요?')){S.ddays=S.ddays.filter(x=>x.id!==ddDraft.id);save();render();openDday();}break;

    /* 근무타입 */
    case 'type-pick':typeReturn='day';openTypePick();break;
    case 'type-more':openTypeMore();break;
    case 'type-pick-page':typeReturn='page';openTypePick();break;
    case 'day-go':goDay(t.dataset.k);break;
    case 'type-preset':{
      const k=t.dataset.k;
      if(!S.types.some(x=>x.k===k))S.types.push({k,name:t.dataset.name,color:t.dataset.rest==='1'?'':nextPastel(),rest:t.dataset.rest==='1'});
      if(typeReturn==='day'&&sheetKey)applyShift(k);else{save();afterType();}
      break;}
    case 'type-new':typeDraft={isNew:true,k:'',name:'',color:nextPastel(),rest:false};openTypeEdit();break;
    case 'type-new-page':typeReturn='page';typeDraft={isNew:true,k:'',name:'',color:nextPastel(),rest:false};openTypeEdit();break;
    case 'type-edit-page':{typeReturn='page';const x=typeOf(t.dataset.s);typeDraft={isNew:false,orig:x.k,k:x.k,name:x.name,color:x.color,rest:!!x.rest};openTypeEdit();break;}
    case 'type-color':if(typeDraft){typeDraft.color=t.dataset.c;openTypeEdit();}break;
    case 'type-kind':if(typeDraft){typeDraft.rest=t.dataset.v==='1';openTypeEdit();}break;
    case 'type-save':saveType();break;
    case 'type-del':deleteType();break;
    case 'type-back':if(typeReturn==='page'||typeReturn==='time'){typeDraft=null;closeSheet();}else openDay(sheetKey);break;

    /* 동료근무 */
    case 'setteam-ask':{const g=Number(t.dataset.g);if(g===S.myTeam)break;if(confirm(`${teamName(g)}을(를) 내 조로 바꿀까요?\n(내 근무 패턴은 그대로, 다른 조 표시만 바뀌어요)`)){S.myTeam=g;save();render();}break;}
    case 'col-day':{const k=t.dataset.k,d=parse(k);if(pageMode){pageBack=null;closePage();}tab='cal';setCur(d.getFullYear(),d.getMonth());render();reqDraft={want:'휴',msg:''};openDay(k);break;}

    /* 알람 */
    case 'aadd':draft=newAlarm();alSnd=false;openAlarmPage();break;
    case 'aedit':{if(e.target.closest('.sw'))break;const f=S.alarms.find(x=>x.id===t.dataset.id);if(f){draft=Object.assign({isNew:false},f);alSnd=false;openAlarmPage();}break;}
    case 'dsnd-open':if(!draft)break;alSnd=!alSnd;openAlarmPage();break;
    case 'dshift':if(!draft)break;draft.shift=t.dataset.v;openAlarmPage();break;
    case 'doff':if(!draft)break;draft.offset=Number(t.dataset.v);openAlarmPage();break;
    case 'dsound':if(!draft)break;draft.sound=!draft.sound;openAlarmPage();break;
    case 'dvib':if(!draft)break;draft.vib=!draft.vib;openAlarmPage();break;
    case 'dsilent':if(!draft)break;draft.sound=false;draft.vib=false;openAlarmPage();break;
    case 'dwxsnd':if(!draft)break;draft.sound=t.dataset.v==='1';openAlarmPage();break;   // v0.142 날씨만 알람 소리 한 번 / 무음
    case 'dwx':if(!draft)break;draft.wxOnly=t.dataset.v==='only';draft.wx=t.dataset.v!=='off';if(draft.wxOnly&&!wxOk((S.wx||{}).home))toast('설정 › 부가 기능 › 출퇴근 시간 · 날씨에서 집 지역을 골라 주세요');openAlarmPage();break;
    case 'dsnmin':if(!draft)break;draft.snMin=Number(t.dataset.v);openAlarmPage();break;
    case 'dsnmax':if(!draft)break;draft.snMax=Number(t.dataset.v);openAlarmPage();break;
    case 'dtone':
      if(!hasBridge('pickTone')){toast('앱에서 폰 알람음 · 음악 파일을 고를 수 있어요');break;}
      if(draft&&draft.wxOnly&&ad('wx')){window.AndroidBridge.pickTone('n:'+draft.id,isFileTone(draft.tone)?'':(draft.tone||''));break;}   // v0.143 날씨만 알람 = 폰 알림음 목록 (벨소리 · 알람음 아님)
      if(!hasBridge('pickToneFile')){window.AndroidBridge.pickTone(draft.id,draft.tone||'');break;}
      {const fl=isFileTone(draft.tone);   // v0.151 새 모양: 고른 쪽에 체크 · 설명 글 없음 (10MB 넘으면 그때 알림)
      openPop(`<div class="tsh"><div class="mh2">알람음</div>
        <button class="trow${fl?'':' on'}" data-act="dtone-sys"><span class="npi">${npi('bell',20)}</span><b>기본 알람음${fl?'':`<small>${esc(draft.toneName||'기본 알람음')}</small>`}</b>${fl?`<span class="gch">${npi('chevron-right',16)}</span>`:npi('check',20)}</button>
        <button class="trow${fl?' on':''}" data-act="dtone-file"><span class="npi">${npi('music',20)}</span><b>내 음악 파일${fl?`<small>${esc(draft.toneName||'')}</small>`:''}</b>${fl?npi('check',20):`<span class="gch">${npi('chevron-right',16)}</span>`}</button>
        <button class="tcl" data-act="pop-close">닫기</button></div>`);}break;
    case 'dtone-sys':closePop();if(draft)window.AndroidBridge.pickTone(draft.id,isFileTone(draft.tone)?'':(draft.tone||''));break;
    case 'dtone-file':closePop();if(draft)window.AndroidBridge.pickToneFile(draft.id);break;
    case 'dtone-play':if(draft&&hasBridge('previewTone')){const on=window.AndroidBridge.previewTone((draft.wxOnly&&ad('wx')?'n:':'')+(draft.tone||''));t.textContent=on?'■ 멈춤':'▶ 듣기';}break;
    case 'asave':{
      const item=Object.assign({},draft,{label:(draft.label||'').trim(),time:draft.time||'06:00'});
      delete item.isNew;
      item.until=item.once?firstFire(item):0;
      item.on=true;
      const i=S.alarms.findIndex(x=>x.id===item.id);
      if(i>=0)S.alarms[i]=item;else if(S.alarms.length<99)S.alarms.push(item);
      save();closePage();cleanTones();
      const n=buildSchedule(60,[item])[0];
      toast(n?`${remain(n.at-new Date())} 후에 울려요`:'이 근무가 60일 안에 없어요');
      // v0.135 한 번만 알람을 저장했는데 그날 다른 알람도 울리면: 그날만 건너뛸지 물어봄
      if(n&&item.once){const dk=fmt(n.at);let hit=null;
        S.alarms.forEach(o=>{if(hit||o.id===item.id||!o.on||o.once)return;const f=buildSchedule(60,[Object.assign({},o,{skipAt:0})]).find(x=>fmt(x.at)===dk);if(f&&f.at.getTime()!==o.skipAt)hit={o,at:f.at.getTime()};});
        if(hit)setTimeout(()=>openPop(`<div class="mh">${n.at.getMonth()+1}/${n.at.getDate()} 알람<b>그날 ${esc(t12(hit.o.time))} ${esc(hit.o.label||'알람')}도 울려요.<br>그날만 건너뛸까요?</b></div>
          <button class="mi" data-act="askip-day" data-id="${hit.o.id}" data-at="${hit.at}" style="justify-content:center;font-weight:800">⏭ 그날만 건너뛰기</button>
          <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">둘 다 울리기</button>`),250);}
      break;}
    case 'askip-day':{const f=S.alarms.find(x=>x.id===t.dataset.id);closePop();if(!f)break;f.skipAt=+t.dataset.at||0;save();render();toast('그날만 건너뛰어요 · 다음부턴 그대로 울려요');break;}
    case 'adel':if(confirm('이 알람을 지울까요?')){S.alarms=S.alarms.filter(x=>x.id!==draft.id);save();closePage();cleanTones();}break;
    case 'askip':{const f=S.alarms.find(x=>x.id===t.dataset.id);if(!f)break;const n=buildSchedule(60,[Object.assign({},f,{skipAt:0})])[0];if(!n)break;f.skipAt=n.at.getTime();save();render();
      const n2=buildSchedule(60,[f])[0];toast(`이번 알람은 안 울려요${n2?` · 다음은 ${remain(n2.at-new Date())} 후`:''}`);break;}
    case 'askip-undo':{const f=S.alarms.find(x=>x.id===t.dataset.id);if(f){f.skipAt=0;save();render();toast('다시 울려요');}break;}
    case 'alloff':S.alarms.forEach(x=>{x.on=false;});save();render();toast('모든 알람을 껐어요');break;

    /* 더 보기 */
    case 'more-stats':stYM=null;stSub='';openStatsPage();break;
    case 'st-sub':stSub=t.dataset.v||'';openStatsPage();break;
    case 'st-prev':case 'st-next':{const d=new Date(stYM[0],stYM[1]+(a==='st-next'?1:-1),1);stYM=[d.getFullYear(),d.getMonth()];openStatsPage();break;}
    case 'st-list':stList(t.dataset.l);break;
    case 'st-today':{const n=new Date();stYM=[n.getFullYear(),n.getMonth()];openStatsPage();break;}
    case 'st-go':{const k=t.dataset.k,d=parse(k);closePop();closePage();tab='cal';setCur(d.getFullYear(),d.getMonth());render();openDay(k);break;}
    case 'st-pay-help':{const e=$('#payFixed');if(e)e.focus();break;}
    case 'slip-open':slipYM='';pageBack=openStatsPage;openSlipPage();break;
    case 'slip-ym':slipYM=t.dataset.v;openSlipPage();break;
    case 'slip-del':if(confirm('이 달 명세서 금액을 지울까요?')){delete S.salary.slips[slipYM];save();openSlipPage();}break;
    case 'more-share':shareStart();break;
    case 'more-colors':openColorsPage();break;
    case 'more-pattern':patSnap={pattern:S.pattern.slice(),anchor:S.anchor};openPatternPage();break;
    case 'anc-keep':ancApply(true);break;
    case 'anc-all':ancApply(false);break;
    case 'anc-cancel':ancNew=null;closePop();openPatternPage();break;
    case 'pat-undo-anchor':restoreAnchorBackup();break;
    case 'pat-old-show':openPatOld();break;
    case 'pat-old-clear':if(confirm('이전 패턴 기록을 지울까요?\n지난 날짜 근무가 지금 패턴 기준으로 바뀌어요.')){S.patOld=[];save();render();openPatternPage();}break;
    case 'quickn':S.quickN=+t.dataset.v===4?4:+t.dataset.v===8?8:0;save();openPatternPage();break;
    case 'weekstart':S.weekStart=+t.dataset.v===1?1:0;save();render();lookRefresh();break;
    case 'personal-on':openPersPage('on');break;
    case 'personal-off':openPersPage('off');break;
    case 'pers-ok':{const d=($('#persD')||{}).value||fmt(new Date());persApply(persKind,d);break;}
    case 'more-comp':openCompPage();break;
    case 'more-times':openPatTimes();break;
    case 'more-stamps':closeSheet();openStampPage();break;
    case 'join-mode':{const n=$('#joinName');if(n)joinDraft.name=n.value.trim();joinDraft.mode=t.dataset.v==='view'?'view':'own';renderJoinPreview();break;}
    case 'fam-viewcal':{vcSel.on=false;vcSel.dates=new Set();vcUid=t.dataset.u;const n=new Date();vcY=n.getFullYear();vcM=n.getMonth();if(famView()){tab='cal';render();}else renderFamCalPage();break;}
    case 'vc-prev':vcMove(-1);break;
    case 'vc-next':vcMove(1);break;
    case 'vc-today':{const n=new Date();vcY=n.getFullYear();vcM=n.getMonth();vcRerender();break;}
    case 'vc-pick':vcUid=t.dataset.u;vcRerender();break;
    case 'vc-multi':{const p=vcEnsure();if(!p)break;vcSel={on:true,uid:p.uid,want:vcRest(p),dates:new Set(),msg:''};vcRerender();break;}
    case 'vc-multi-from':{const p=vcEnsure();if(!p)break;const k=t.dataset.k;closeSheet();
      const w=(p.sch.types||[]).some(x=>x.k===rqD.want)?rqD.want:vcRest(p);
      vcSel={on:true,uid:p.uid,want:w,dates:new Set(),msg:''};if(vsOk(p,k))vcSel.dates.add(k);vcRerender();vsBar();break;}
    case 'stkshare-now':if(S.link){S.link.stk=true;S.link.stkAsked=1;}save();famPush(true).catch(famPushFail);closePop();toast('지금 있는 스티커도 가족에게 보여요 (약은 빼고)');break;
    case 'stkshare-new':if(S.link){S.link.stk=true;S.link.stkAsked=1;(S.stamps.defs||[]).forEach(d=>{d.fam=false;});}save();famPush(true).catch(famPushFail);closePop();toast('앞으로 만드는 스티커부터 가족에게 보여요');break;
    case 'stkshare-no':if(S.link)S.link.stkAsked=1;save();closePop();break;
    case 'vc-memo-edit':vcMemoEdit=t.dataset.mid;vcMemoEditK=t.dataset.k;openVcDay(t.dataset.k);break;
    case 'vc-memo-cancel':vcMemoEdit='';openVcDay(t.dataset.k);break;
    case 'vc-memo-save':{const k=t.dataset.k,el=$('#vcmedit'),text=el?el.value.trim():'';const m=(S.memos[k]||[]).find(x=>x.id===t.dataset.mid);
      if(!text){toast('메모를 적어주세요');break;}
      if(m&&m.by===role()){m.text=text.slice(0,200);save();toast('메모를 고쳤어요');}
      vcMemoEdit='';openVcDay(k);break;}
    case 'vc-memo-del':{const k=t.dataset.k;const m=(S.memos[k]||[]).find(x=>x.id===t.dataset.mid);
      if(!m||m.by!==role())break;if(!confirm('이 가족 메모를 지울까요? 가족 폰에서도 지워져요'))break;
      S.memos[k]=(S.memos[k]||[]).filter(x=>x.id!==m.id);if(!S.memos[k].length)delete S.memos[k];save();toast('메모를 지웠어요');openVcDay(k);break;}
    case 'vc-memo-send':afterCompose('#vcmemo',()=>{const k=t.dataset.k,el=$('#vcmemo'),text=el?el.value.trim():'';if(!text){toast('메모를 적어주세요');return;}if(famRemain()<=0){famLimitSheet();return;}openCfm({type:'memo',k,text,vc:true});});break;
    case 'ban-go':{if(banSwiped)break;const el=$('#ban'),k=el?el.dataset.k:'',kd=el?el.dataset.kind:'';banHide();window.__onPush({type:kd,date:k});break;}
    case 'vc-multi-off':vcSel.on=false;vcSel.dates=new Set();vcRerender();break;
    case 'vc-ms-want':{const p=vcEnsure();if(!p)break;const m0=(document.getElementById('vcmsg')||{}).value;if(m0!==undefined)vcSel.msg=m0;vcSel.want=t.dataset.s;[...vcSel.dates].forEach(k=>{if(!vsOk(p,k))vcSel.dates.delete(k);});vcRerender();break;}
    case 'vc-multi-send':{
      const p=famPeers().find(x=>x.uid===vcUid);if(!p||!vcSel.on)break;
      const dates=[...vcSel.dates].filter(k=>vsOk(p,k)).sort();
      if(!dates.length){toast('요청할 날짜를 골라 주세요');break;}
      if(famRemain()<=0){famLimitSheet();break;}
      const msg=(document.getElementById('vcmsg')||{}).value||vcSel.msg||'';
      openCfm({type:'req',uid:p.uid,name:p.name,sch:p.sch,k:dates[0],dates,want:vcSel.want,msg,cc:false,others:famOthers().filter(m=>m.uid!==p.uid),multi:true});break;}
    case 'vc-go':vcGo(t.dataset.k);break;
    case 'vc-rq':{const sh=$('#sheet'),sec0=sh&&sh.querySelector('.vcrq'),was=!!(sec0&&sec0.classList.contains('open'));vcRqOpen=!vcRqOpen;
      const re=()=>{const y=sh?sh.scrollTop:0;openVcDay(rqD.k);if(sh)sh.scrollTop=y;return sh&&sh.querySelector('.vcrq');};
      const will=vcDayHtml(rqD.k).includes('vcrq open');
      if(sec0&&was!==will)shMorph(sec0,will,re);else re();break;}   // v0.195 펼치기 · 접기 모션
    case 'vc-wx':vcWxPop(t.dataset.k);break;
    case 'vc-want':rqD.want=t.dataset.s;t.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===t));vcAskLine(t.parentElement);break;
    case 'vc-send':{
      const p=famPeers().find(x=>x.uid===vcUid),k=rqD.k;if(!p||!k)break;
      const msg=($('#rqm2')||{}).value||'';
      if(k<fmt(new Date())){toast('지난 날은 요청할 수 없어요');break;}
      if(schShift(p.sch,parse(k))===rqD.want){toast('이미 그 근무예요. 다른 근무를 골라주세요');break;}
      if(S.requests.some(r=>r.srv&&r.dir==='out'&&r.peer===p.uid&&r.date===k&&(r.st==='pending'||r.st==='accepted'))){toast('이미 진행 중인 요청이 있어요');break;}
      if(famRemain()<=0){famLimitSheet();break;}
      openCfm({type:'req',uid:p.uid,name:p.name,sch:p.sch,k,dates:[k],want:rqD.want,msg,cc:false,others:famOthers().filter(m=>m.uid!==p.uid)});break;}
    case 'cfm-no':{const c=cfm;cfm=null;closePop();if(c&&c.type==='stk'&&pageMode==='link')openLinkPage();break;}
    case 'cfm-nt':if(cfm){cfm.notify=t.dataset.v==='1';renderCfm();}break;
    case 'cfm-cc':if(cfm){cfm.cc=!cfm.cc;renderCfm();}break;
    case 'cfm-to':{const c=cfm;if(!c||!c.to)break;const u=t.dataset.u,i=c.to.indexOf(u);
      if(i>=0){if(c.to.length<=1){toast('받는 사람이 한 명은 있어야 해요');break;}c.to.splice(i,1);}else c.to.push(u);
      renderCfm();break;}
    case 'cfm-ok':{const c=cfm;cfm=null;closePop();if(c)doCfm(c);break;}
    case 'vc-day':if(vcSel.on)break;if(t.classList.contains('out')){buzz(6);vcMove(monthDirOf(t.dataset.k,vcY,vcM));break;}openVcDay(t.dataset.k);break;
    case 'srvmm-del':{const sid=t.dataset.sid;closePop();if(!confirm('가족이 쓴 이 메모를 지울까요?'))break;famReady().then(({F,db})=>F.deleteDoc(F.doc(db,'households',S.link.hid,'memos',sid))).catch(e=>toast('지우지 못했어요. '+famErr(e)));break;}
    case 'feed-req':feedTab='req';openFeed();break;
    case 'rq-go':{e.stopPropagation();const r=S.requests.find(x=>x.id===t.dataset.id);if(!r)break;
      const k=(grpItems(r).map(x=>x.date).sort()[0])||r.date,d=parse(k);
      closeSheet();tab='cal';setCur(d.getFullYear(),d.getMonth());render();
      reqDraft={want:'휴',msg:''};memoTab='all';memoMode=role()==='host'?'my':'fam';memoEdit=null;memoText='';openDay(k);break;}
    case 'req-go':{if(e.target.closest('button'))break;closeSheet();const d=parse(t.dataset.k);tab='cal';setCur(d.getFullYear(),d.getMonth());render();openDay(t.dataset.k);break;}
    case 'more-addons':closeSheet();openAddonPage();break;
    case 'more-widget':closeSheet();if(wgStyleOk()){try{window.AndroidBridge.openWidgetStyle(widgetJson());}catch(e){openWidgetPage();}}else openWidgetPage();break;   // v0.192 바로 폰 위젯 설정 화면(배경화면 위)
    case 'wg-theme':S.widget.theme=t.dataset.v;save();openWidgetPage();break;
    case 'wg-bg':S.widget.bg=t.dataset.v==='vivid'?'vivid':'';save();openWidgetPage();break;
    case 'wg-style':if(wgStyleOk())try{window.AndroidBridge.openWidgetStyle(widgetJson());}catch(e){}break;
    case 'wg-look':S.widget.look=t.dataset.v==='circle'?'circle':'fill';save();openWidgetPage();break;
    case 'addon-go':closePop();tab='set';render();openAddonPage();break;
    case 'stk-board':closeSheet();openStampPage();break;
    case 'remind-sound':try{window.AndroidBridge.openSettings('remind_sound');}catch(e){}break;   // 폰의 "기념일 · 알림" 알림 종류 화면
    case 'stamp-tap':stampTap(t.dataset.id,t.dataset.k);break;
    case 'stamp-dn':e.stopPropagation();if(paint){if(role()==='host')paintDay(t.dataset.k);break;}if(t.closest('.cell.out')){buzz(6);slideTo(monthDirOf(t.dataset.k,cur.y,cur.m));break;}buzz(8);openStampDay(t.dataset.k);if(!S.tipStk&&document.querySelector('#pop .sdr2')){S.tipStk=true;save();toast('스티커를 꾹 누르면 반복 · 알림을 고칠 수 있어요');}break;
    case 'sd-tap':{const s=S.stamps.defs.find(x=>x.id===t.dataset.id),k=t.dataset.k;if(!s)break;
      const N=stView(s,k).N,n=stampCnt(k,s.id),v=n<N?n+1:0;
      stampSet(s.id,k,v);save();
      {const row=t.closest('.sdr2'),bar=row&&row.querySelector('.sdbar');   // v0.181 부드럽게: 누른 버튼만 바로 바꾸고, 창 · 달력은 움직임이 끝난 뒤 다시 그림
        if(bar){row.classList.toggle('done',v>=N);const c=row.querySelector('.sdcnt');if(c&&N>1)c.textContent=`${v}/${N}`;sdBarSet(bar,v,N);
          clearTimeout(sdLaterT);sdLaterT=setTimeout(()=>{render();if($('#pop').classList.contains('open')&&document.querySelector('#pop .sdr2'))sdRefreshIcons(k);if(v>n)stkPop(k,s.id);},700);}   // v0.237 창을 다시 열지 않음 (다시 열면 창이 하얗게 번쩍임) · 그림(약 · 안 한 표시)만 바꿈
        else{render();stampReopen(k);if(v>n)stkPop(k,s.id);}}
      const se=s.kind==='pill'?'💊':icoTxt(s.emoji,'✔'),msg=v===0?`${se} ${s.name} 취소했어요`:s.kind==='pill'?(v>=N?`💊 ${s.name} 오늘 다 먹었어요`:`💊 ${s.name} ${v}/${N} 먹음`):(N>1&&v<N?`${se} ${s.name} ${v}/${N}`:`${se} ${s.name} 완료`);
      toastUndo(msg,()=>{stampSet(s.id,k,n);save();render();if($('#pop').classList.contains('open'))stampReopen(k);});break;}
    case 'sd-more':{const s=S.stamps.defs.find(x=>x.id===t.dataset.id),k=t.dataset.k;if(!s)break;const id=`data-id="${s.id}" data-k="${k}"`;
      const rep=['daily','dow','work','month'].includes(s.rep)&&(!s.to||s.to>=k);
      const V=stView(s,k),n=stampCnt(k,s.id),ic=s.kind==='pill'?pillSvg(V.N,n,28,V.col,V.shape):ico(s.emoji);   // v0.178 위쪽에 실제 스티커 그림 + 이름 · 날짜
      openPop(`<div class="sdmh"><span class="sdi">${ic}</span><div><b>${esc(s.name)}</b><span>${md(k)}</span></div></div>
        <button class="mi" data-act="sd-skip" ${id}>🧽 스티커 떼기</button>
        ${rep?`<button class="mi" data-act="sd-end" ${id}>📆 이날부터 떼기</button>`:''}
        ${stampsOn(k).length>=2?`<button class="mi" data-act="sd-all" data-k="${k}">🗑 스티커 전부 떼기</button>`:''}
        <button class="mi" data-act="sd-edit" ${id}>✏️ 반복 · 알림 고치기</button>
        <button class="mi" data-act="sd-back" data-k="${k}" style="justify-content:center;color:var(--muted)">닫기</button>`);break;}
    case 'sd-edit':closePop();openStampReg(t.dataset.k,t.dataset.id,'day');break;
    case 'sd-back':stampReopen(t.dataset.k);break;
    case 'sd-done':case 'sd-undo':{
      const s=S.stamps.defs.find(x=>x.id===t.dataset.id),k=t.dataset.k;if(!s)break;
      const N=stView(s,k).N,n=stampCnt(k,s.id),v=a==='sd-done'?Math.min(N,n+1):Math.max(0,n-1);
      stampSet(s.id,k,v);save();
      {const row=t.closest('.sdr2'),bar=row&&row.querySelector('.sdbar');   // v0.181 부드럽게: 누른 버튼만 바로 바꾸고, 창 · 달력은 움직임이 끝난 뒤 다시 그림
        if(bar){row.classList.toggle('done',v>=N);const c=row.querySelector('.sdcnt');if(c&&N>1)c.textContent=`${v}/${N}`;sdBarSet(bar,v,N);
          clearTimeout(sdLaterT);sdLaterT=setTimeout(()=>{render();if($('#pop').classList.contains('open')&&document.querySelector('#pop .sdr2'))stampReopen(k);if(v>n)stkPop(k,s.id);},700);}
        else{render();stampReopen(k);if(v>n)stkPop(k,s.id);}}
      const se=icoTxt(s.emoji,'✔'),msg=a==='sd-undo'?`${s.kind==='pill'?'💊':se} ${s.name} 취소했어요`:s.kind==='pill'?(v>=N?`💊 ${s.name} 오늘 다 먹었어요`:`💊 ${s.name} ${v}/${N} 먹음`):(N>1&&v<N?`${se} ${s.name} ${v}/${N}`:`${se} ${s.name} 완료`);
      toastUndo(msg,()=>{stampSet(s.id,k,n);save();render();if($('#pop').classList.contains('open'))stampReopen(k);});break;}
    case 'sd-skip':{const s=S.stamps.defs.find(x=>x.id===t.dataset.id),k=t.dataset.k;if(!s)break;
      // v0.171 완료한 날도 지워지게: 그날 완료 기록(+ 약 기록 보존)도 같이 지우고, 되돌리면 같이 돌려놓음
      const n0=stampCnt(k,s.id),sn0=stSnap(k,s.id);if(n0)stampSet(s.id,k,0);
      const back=()=>{if(n0){(S.stamps.log[k]=S.stamps.log[k]||{})[s.id]=n0;if(sn0)((S.stamps.snap=S.stamps.snap||{})[k]=S.stamps.snap[k]||{})[s.id]=sn0;}};
      if(s.one&&(s.dates||[]).includes(k)){   // ＋ 로 이날만 붙인 것: 그 날을 지움 (반복으로도 깔리는 날이면 건너뛴 날로 같이)
        s.dates=s.dates.filter(x=>x!==k);const viaRule=stampPlanned(s,k);if(viaRule)(s.skip=s.skip||[]).push(k);
        save();render();stampReopen(k);toastUndo(`${icoTxt(s.emoji,'✔')} ${s.name} 이날 뗐어요`,()=>{(s.dates=s.dates||[]).push(k);if(viaRule)s.skip=(s.skip||[]).filter(x=>x!==k);back();save();render();if($('#pop').classList.contains('open'))stampReopen(k);});break;}
      (s.skip=s.skip||[]).push(k);s.dates=(s.dates||[]).filter(x=>x!==k);save();render();stampReopen(k);toastUndo(`${s.kind==='pill'?'💊':icoTxt(s.emoji,'✔')} ${s.name} 이날 뗐어요`,()=>{s.skip=s.skip.filter(x=>x!==k);back();save();render();if($('#pop').classList.contains('open'))stampReopen(k);});break;}
    case 'sd-all':{const k=t.dataset.k,list=stampsOn(k);if(!list.length)break;   // v0.176 그날 스티커 전부 떼기 (반복 스티커는 그날만 빠짐 · 되돌리기)
      const snap=JSON.stringify(S.stamps);
      list.forEach(({s})=>{if(stampCnt(k,s.id))stampSet(s.id,k,0);if(s.one&&(s.dates||[]).includes(k)){s.dates=s.dates.filter(x=>x!==k);if(stampPlanned(s,k))(s.skip=s.skip||[]).push(k);}else{(s.skip=s.skip||[]).push(k);s.dates=(s.dates||[]).filter(x=>x!==k);}});
      save();render();stampReopen(k);toastUndo(`이날 스티커 ${list.length}개를 뗐어요`,()=>{S.stamps=JSON.parse(snap);save();render();if($('#pop').classList.contains('open'))stampReopen(k);});break;}
    case 'sd-end':{const s=S.stamps.defs.find(x=>x.id===t.dataset.id),k=t.dataset.k;if(!s)break;
      const old=s.to||'';s.to=addK(k,-1);save();render();stampReopen(k);
      toastUndo(`${s.kind==='pill'?'💊':icoTxt(s.emoji,'✔')} ${s.name} 이날부터 뗐어요 (지난 기록은 그대로)`,()=>{s.to=old;save();render();});break;}
    case 'sd-add':if(t.classList.contains('dis')){stampFull();break;}closePop();openStampPick(t.dataset.k);break;
    case 'sp-pick':closePop();openStampReg(t.dataset.k,t.dataset.id);break;
    case 'sp-fill':{const id=t.dataset.id,k=t.dataset.k;closePop();openStampBig({title:'칸에 넣을 스티커',sub:md(k),extra:stPlusRow,onCancel:()=>openStampPick(k),onPick:(e,n,src)=>{const x=stFillSlot(id,e,n,src);save();render();if(x)openStampReg(k,x.id,'','fill');}});break;}
    case 'sp-plus':{const k=t.dataset.k;closePop();openStampPlus(k);break;}
    case 'slot-open':openStampSlot(t.dataset.id);break;
    case 'slot-col':{slotPullName(t.dataset.id);const x=S.stamps.defs.find(y=>y.id===t.dataset.id);if(x){x.color=t.dataset.v;save();render();openStampPage();openStampSlot(x.id);}break;}
    case 'slot-save':{slotPullName(t.dataset.id);closePop();save();render();openStampPage();break;}
    case 'slot-clear':{slotPullName(t.dataset.id);const x=S.stamps.defs.find(y=>y.id===t.dataset.id);if(!x)break;closePop();const ex=!!x.one;stSlotClear(x.id);save();render();openStampPage();toast(ex?'지웠어요 · 지난 체크 기록은 그대로예요':stMoved?'비웠어요 · 지난 기록은 그대로예요':'비웠어요');break;}
    case 'slot-swap':{slotPullName(t.dataset.id);const x=S.stamps.defs.find(y=>y.id===t.dataset.id);if(!x)break;
      openIcn({title:'다른 스티커로 바꾸기',sub:'달력에 붙인 옛 스티커는 그대로 남아요',icon:x.kind==='mark'?x.emoji:'',name:x.name,autoWas:x.name,placeholder:'이름',cats:STAMP_CAT,needIcon:true,extra:stPlusRow,
        onSave:(e,n,src)=>{stFillSlot(x.id,e,n,src);save();render();openStampPage();toast(stMoved?'바꿨어요 · 옛 스티커의 지난 기록은 그대로예요':'바꿨어요');}});break;}
    case 'sd-manage':closePop();openStampPage();break;
    case 'sr-back':srBack();break;
    case 'sr-rep':srPull();stDraft.rep=t.dataset.v;renderStampReg();break;
    case 'sr-day':{srPull();const w=+t.dataset.v,d=stDraft.days;stDraft.days=d.includes(w)?d.filter(x=>x!==w):[...d,w];renderStampReg();break;}
    case 'sr-work':srPull();stDraft.workMode=t.dataset.v;renderStampReg();break;
    case 'sr-wt':{srPull();const v=t.dataset.v,w=stDraft.wtypes;const i=w.indexOf(v);if(i>=0)w.splice(i,1);else w.push(v);renderStampReg();break;}
    case 'sr-col':srPull();stDraft.color=t.dataset.v;renderStampReg();break;
    case 'sr-times':srPull();stDraft.times=+t.dataset.v;if(stDraft.alarm)stFill(stDraft);renderStampReg();break;
    case 'sr-setend':srPull();stDraft.to=fmt(addDays(parse(stDraft.from||stDraft.k),29));renderStampReg();toast('끝 날짜를 눌러 바꿀 수 있어요');break;
    case 'sr-noend':srPull();stDraft.to='';renderStampReg();break;
    case 'sr-actf':srPull();stDraft.actOpen=!stDraft.actOpen;if(stDraft.actOpen&&!stDraft.act)stDraft.act={s:'',e:'',r:wxOk(S.stamps.lastActR)?S.stamps.lastActR:''};   /* v0.188 위치는 직전에 고른 곳으로 */renderStampReg();break;
    case 'sr-actoff':srPull();stDraft.act=null;stDraft.actOpen=false;renderStampReg();break;
    case 'sr-actr':{srPull();const d=stDraft;actPickRegion(code=>{if(stDraft!==d)return;d.act=Object.assign({s:'',e:''},d.act||{},{r:code||''});renderStampReg();});break;}
    case 'act-near':closePop();{const cb=actPickCb;actPickCb=null;if(cb)cb(t.dataset.v||'');}break;
    case 'ms-actf':mstkPull();msDraft.actOpen=!msDraft.actOpen;renderManStkEdit();break;
    case 'ms-aday':{mstkPull();const a=msDraft.act=Object.assign({s:'',e:'',days:[]},msDraft.act||{}),w=+t.dataset.v;a.days=a.days.includes(w)?a.days.filter(x=>x!==w):[...a.days,w];renderManStkEdit();break;}
    case 'ms-actoff':mstkPull();msDraft.act=null;msDraft.actOpen=false;renderManStkEdit();break;
    case 'ms-actr':{mstkPull();const d=msDraft;actPickRegion(code=>{if(msDraft!==d)return;d.act=Object.assign({s:'',e:'',days:[]},d.act||{},{r:code||''});renderManStkEdit();});break;}
    case 'sr-more':{if(typeof srPull==='function')srPull();if(stDraft){stDraft.more=!stDraft.more;renderStampReg();}break;}
    case 'sr-save':afterCompose('#srName',stampRegSave);break;
    case 'clash-show':stClashDo('show');break;
    case 'clash-skip':stClashDo('skip');break;
    case 'sh-undo':{clashCtx=null;if(hidSnap){S.stamps=JSON.parse(hidSnap);hidSnap=null;save();render();if(pageMode==='stamps')openStampPage();}closePop();toast('등록을 취소했어요');break;}
    case 'st-show-on':openCfm({type:'status'});break;
    case 'tt-icon':openTtIcon(t.dataset.i);break;
    case 'row-edit':openRowEdit(t.dataset.k);break;
    case 'tt-badd':{const b=timesOf(timesTab).breaks.slice();b.push({from:'15:00',to:'15:30'});ttSet('breaks',b);break;}
    case 'tt-bdel':{const b=timesOf(timesTab).breaks.slice();b.splice(+t.dataset.i,1);ttSet('breaks',b);break;}
    case 'st-work-open':openWorkPick();break;
    case 'st-work':closePop();setWork(t.dataset.v,'');break;
    case 'st-work-own':openWorkOwn();break;
    case 'st-edit-now':{const m=myStatus();if(m.src){timesTab=m.src.k;openTtIcon(m.src.i);}else openStatusEdit(m.key);break;}
    case 'st-edit':openStatusEdit(t.dataset.k);break;
    case 'more-backup':driveFiles=null;openBackupPage();break;
    case 'more-perm':openPermPage();break;
    case 'info-perm':pageBack=openInfoPage;openPermPage();break;
    case 'slip-help':openPop(`<div class="mh">명세서로 맞추기<b>이렇게 적어요</b></div><div class="mi" style="display:block;line-height:1.7">· 급여 명세서 한 장의 금액을 그대로 적어요. 그 기간 달력의 연장 · 야간 시간으로 나눠 1시간 금액을 계산해요.<br>· 연장 수당: 특별 · 가산 수당은 빼요.<br>· 연차 수당: 연차를 안 쓰고 받은 돈 · 며칠치인지도 적어요.<br>· 지급 총액: 세전 · 상여 빼고 (예상과 비교용).<br>· 여러 장 적을수록 더 맞아요.</div><button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);break;
    case 'pers-help':openPop(`<div class="mh">${persKind==='on'?'개인 캘린더':'근무표'}<b>${persKind==='on'?'바꾸면 이렇게 돼요':'다시 쓰면 이렇게 돼요'}</b></div><div class="mi" style="display:block;line-height:1.6">${persHelp}</div><button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);break;
    case 'perm-samsung':try{window.AndroidBridge.openSettings('samsung_sleep');}catch(e){}toast('백그라운드 앱 사용 제한 › 자동 절전 예외 앱에서 언제쉬어를 더해 주세요');break;
    case 'more-mail':sendInquiry();break;
    case 'more-privacy':pageBack=pageMode==='info'?openInfoPage:null;openPrivacyPage();break;
    case 'my-code':if(S.link)copyText(myCode(S.link.uid));break;
    case 'adm-open':adm=null;openAdmPage();break;
    case 'adm-find':adm.q=($('#admQ')||{}).value||'';openAdmPage();break;
    case 'adm-pick':adm.sel=(adm.codes||[]).find(c=>c.code===t.dataset.c)||null;openAdmPage();break;
    case 'adm-clear':adm.sel=null;openAdmPage();break;
    case 'adm-give':admGive(false);break;
    case 'adm-sub':admGive(true);break;
    case 'adm-all':adm.sel={uid:'_all',name:'',code:''};openAdmPage();break;
    case 'adm-who':{const g=(adm.given||[]).find(x=>x.uid===t.dataset.u);if(g){adm.sel={uid:g.uid,name:g.name,code:g.code};openAdmPage();}break;}
    case 'more-wipe':wipeAll();break;
    case 'font':S.fontScale=Number(t.dataset.v);save();applyFont();render();lookRefresh();break;
    case 'thememode':S.theme=t.dataset.v;save();applyTheme();render();lookRefresh();break;
    case 'leave-from':S.salary.leaveFrom=t.dataset.v?(S.salary.leaveFrom||'01-01'):'';save();openStatsPage();break;
    case 'tdc-pick':openColorPick();break;
    case 'cp-ok':if(cpS){S.todayColor=hsv2hex(cpS.h,cpS.s,cpS.v);save();applyTune();closePop();if(pageMode==='tune')openTunePage();else{render();lookRefresh();}}break;
    case 'todaycolor':S.todayColor=t.dataset.v==='shift'?'shift':/^#[0-9a-f]{6}$/i.test(t.dataset.v||'')?t.dataset.v:'';save();applyTune();if(pageMode==='tune')openTunePage();else{render();lookRefresh();}break;
    case 'todaylook':S.todayLook=['a','b','c','d'].includes(t.dataset.v)?t.dataset.v:'b';save();applyTune();if(pageMode==='tune')openTunePage();else lookRefresh();break;
    case 'tn-wk':tnWeek=Math.max(0,Math.min(tnRows-1,(tnWeek==null?tnBest:tnWeek)+(+t.dataset.d||0)));tunePrev();break;
    case 'callook':S.calLook=t.dataset.v==='fill'?'fill':'circle';save();applyTune();if(pageMode==='tune')openTunePage();else{render();lookRefresh();}break;
    case 'tune-open':pageBack=pageMode==='look'?openLookPage:null;openTunePage();break;
    case 'tune-reset':tuneDraft=tuneAll(null);applyTune();openTunePage();toast('처음 값으로 돌렸어요 · 저장해야 반영돼요');break;
    case 'tune-save':if(tuneDirty()){S.tuneHist=[JSON.parse(JSON.stringify(S.tune)),...(S.tuneHist||[])].slice(0,5);S.tune=JSON.parse(JSON.stringify(tuneDraft));save();applyTune();tuneBar();toast('저장했어요');}break;
    case 'tune-undo':if(!(S.tuneHist||[]).length){toast('돌아갈 저장이 없어요');break;}S.tune=S.tuneHist.shift();tuneDraft=JSON.parse(JSON.stringify(S.tune));save();applyTune();openTunePage();toast('이전 저장 값으로 돌렸어요');break;
    case 'tune-copy':copyText(tuneText());break;
    case 'bgmode':S.bg=t.dataset.v==='vivid'?'vivid':'';save();applyTheme();render();lookRefresh();break;
    case 'more-look':closeSheet();openLookPage();break;
    case 'ad-tile':{if(e.target.closest('label.sw'))break;const k=t.dataset.k,cb=document.getElementById('ad_'+k);if(!cb)break;
      if(!adOn(k)){cb.checked=true;cb.dispatchEvent(new Event('change',{bubbles:true}));break;}   // 꺼진 칸 = 켜기
      const g=AD_GO[k];if(g){pageBack=openAddonPage;const x=document.createElement('button');x.dataset.act=g;x.hidden=true;document.body.appendChild(x);x.click();x.remove();}break;}
    case 'tips-open':openTipsPage();break;
    case 'pat-loc':pageBack=openPatternPage;openWxPage();break;
    case 'tip-go':tipGo(t.dataset.a||'');break;
    case 'more-notif':closeSheet();openNotifPage();break;
    case 'more-info':closeSheet();openInfoPage();break;
    case 'notif-alarm':closePage();tab='alarm';render();break;
    case 'mcolor':if(t.dataset.v!==S.memoColors[t.dataset.k==='fam'?'my':'fam']||S.memoColors.fam===S.memoColors.my)S.memoColors[t.dataset.k]=t.dataset.v;save();applyTheme();openColorsPage();break;
    case 'mcolor-reset':S.memoColors={fam:'#7b5cf0',my:'#5b8fc7'};save();applyTheme();openColorsPage();break;
    case 'paint-open':paintStart(t.dataset.k);break;
    case 'paint-k':paint.k=t.dataset.s;render();break;
    case 'paint-done':{const n=paintChanged();paint=null;render();toast(n?`${n}일을 바꿨어요`:'칠하기를 마쳤어요');break;}
    case 'paint-cancel':{const n=paintChanged();if(n&&paint.snap){S.overrides=JSON.parse(paint.snap);save();}paint=null;render();toast(n?'칠하기를 취소했어요':'칠하기를 마쳤어요');break;}
    case 'exit-ok':{closePop();if(hasBridge('exitApp'))window.AndroidBridge.exitApp();else toast('앱에서는 여기서 종료돼요');break;}
    case 'about-tap':{aboutTaps++;clearTimeout(aboutT);aboutT=setTimeout(()=>{aboutTaps=0;},3000);if(aboutTaps>=7){aboutTaps=0;toast('🔧 개발자 메뉴');openFirebasePage();}break;}
    case 'fb-test':{FBX.ping=null;const pr=fbPing();openFirebasePage();pr.then(()=>{if(pageMode==='fb')openFirebasePage();});break;}
    case 'fb-out':fbSignOut().then(()=>{if(pageMode==='fb')openFirebasePage();});break;
    case 'pcell':openPatCell(Number(t.dataset.i));break;
    case 'pset':{const i=Number(t.dataset.i);if(i<S.pattern.length){S.pattern[i]=t.dataset.s;save();}closePop();openPatternPage();break;}
    case 'padd':if(S.pattern.length<PAT_MAX){S.pattern.push(restKey());save();openPatternPage();try{const l=[...document.querySelectorAll('#pgrid .pc')].pop();if(l&&!RMq())l.animate([{transform:'scale(.3)',opacity:0},{transform:'scale(1.12)',opacity:1,offset:.7},{transform:'none',opacity:1}],{duration:380,easing:'cubic-bezier(.2,.9,.25,1)'});}catch(e){}}break;   // v0.209 새 칸 톡
    case 'pdel':if(S.pattern.length>2){const l=[...document.querySelectorAll('#pgrid .pc')].pop(),go=()=>{S.pattern.pop();save();openPatternPage();};if(l&&!RMq()){l.style.pointerEvents='none';l.animate([{transform:'none',opacity:1},{transform:'scale(.3)',opacity:0}],{duration:200,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});setTimeout(go,190);}else go();}break;   // v0.209 마지막 칸 쏙
    case 'drep':if(draft){draft.once=t.dataset.v==='1';const c=document.getElementById('aRepeat');if(c)c.checked=!draft.once;openAlarmPage();}break;   // v0.148 매번 / 한 번만
    case 'pat-reset':patResetOpen('m');break;   // v0.145 패턴 제외 초기화: 기간 고르기 → 경고 2번
    case 'pr-q':patResetOpen(t.dataset.v);break;
    case 'pr-go':{const a=($('#prS')||{}).value,b=($('#prE')||{}).value;if(!/^\d{4}-\d\d-\d\d$/.test(a||'')||!/^\d{4}-\d\d-\d\d$/.test(b||'')||a>b){toast('기간을 다시 골라 주세요');break;}
      const ks=Object.keys(S.overrides||{}).filter(k=>k>=a&&k<=b);if(!ks.length){toast('이 기간엔 직접 바꾼 근무가 없어요');break;}
      const f=k=>`${+k.slice(5,7)}/${+k.slice(8)}`;
      if(!confirm(`${f(a)} ~ ${f(b)} 에 직접 바꾼 근무 ${ks.length}일(연차 · 근무 바꾸기 · 가족 요청 포함)을 패턴대로 되돌려요.`))break;
      if(!confirm('되돌릴 수 없어요. 지울까요?'))break;
      ks.forEach(k=>delete S.overrides[k]);save();closePop();if(pageMode==='pattern')openPatternPage();toast(`${ks.length}일을 패턴대로 되돌렸어요`);break;}
    case 'clearov':if(confirm('직접 바꾼 근무를 모두 원래 패턴으로 되돌릴까요?')){S.overrides={};save();openPatternPage();toast('수동 변경을 초기화했어요');}break;
    case 'toff':{const g=Number(t.dataset.g),n=S.pattern.length;S.teamOffsets[g]=(((S.teamOffsets[g]||0)+Number(t.dataset.v))%n+n)%n;save();teamRefresh();break;}
    case 'trow':openTeamToday(Number(t.dataset.g));break;
    case 'tpos':setTeamPos(Number(t.dataset.g),Number(t.dataset.p));break;
    case 'tmine':{const g=Number(t.dataset.g);S.myTeam=g;save();closePop();teamRefresh();toast(`${teamName(g)}을(를) 내 조로 했어요`);break;}
    case 'tedit':openTeamEdit(t.dataset.g!=null?Number(t.dataset.g):null);break;
    case 'ted-my':tEdPull();tEd.my=Number(t.dataset.i);renderTeamEdit();break;
    case 'ted-del':{tEdPull();const i=Number(t.dataset.i);if(i===tEd.my||tEd.rows.length<2)break;tEd.rows.splice(i,1);if(tEd.my>i)tEd.my--;renderTeamEdit();break;}
    case 'ted-add':if(tEd.rows.length<TEAM_MAX)teamEdAdd();break;
    case 'ted-save':teamEdSave();break;
    case 'tdel':teamDel(Number(t.dataset.g));break;
    case 'redo-onboard':closePage();startOnboarding({entry:'later'});break;
    case 'mk-sched':if(pageMode)closePage();startOnboarding({entry:'later'});break;
    case 'comp-open':chOpen=true;openCompPage();break;
    case 'comp-add':{
      chPull();const name=chDraft.name.trim(),date=chDraft.date,kind=chDraft.kind;
      if(!name||!date){toast('이름과 날짜를 넣어주세요');break;}
      S.companyHols.push({id:uid(),name,date,yearly:chDraft.yearly,kind,emoji:chDraft.emoji||(kind==='memo'?'🎂':'🏢'),rem:chDraft.rem.slice(),remAt:chDraft.remAt,remind:chDraft.rem.length>0});
      chDraft={date:'',name:'',yearly:true,kind,emoji:kind==='memo'?'🎂':'🏢',rem:kind==='memo'?[1]:[],remAt:'20:00'};chOpen=false;
      save();render();openCompPage();toast(kind==='memo'?'기념일을 추가했어요':'휴무일을 추가했어요');break;}
    case 'ch-kind':{chPull();const k2=t.dataset.v;if(k2!==chDraft.kind&&!isPhoto(chDraft.emoji))chDraft.emoji=k2==='memo'?'🎂':'🏢';chDraft.kind=k2;chDraft.rem=k2==='memo'?[1]:[];openCompPage();break;}
    case 'ch-ico':chPull();openIcn({title:'아이콘',sub:chDraft.name||'',icon:chDraft.emoji,name:null,emojis:chDraft.kind==='memo'?ANNIV_EMOJI:OFF_EMOJI,needIcon:true,onSave:e=>{chDraft.emoji=e;openCompPage();}});break;
    case 'comp-ico':{const x=S.companyHols.find(y=>y.id===t.dataset.id);if(!x)break;
      openIcn({title:'아이콘 바꾸기',sub:x.name,icon:x.emoji||(x.kind==='memo'?'⭐':'🏢'),name:null,emojis:x.kind==='memo'?ANNIV_EMOJI:OFF_EMOJI,needIcon:true,onSave:e=>{x.emoji=e;save();render();openCompPage();}});break;}
    case 'comp-row':compMenu(t.dataset.id);break;
    case 'comp-kind':{const x=S.companyHols.find(y=>y.id===t.dataset.id);if(!x)break;x.kind=t.dataset.v;if(x.kind==='memo'&&!x.emoji)x.emoji='⭐';save();render();openCompPage();if($('#pop.open .compm'))compMenu(x.id);break;}
    case 'rem-open':openRem(t.dataset.id);break;
    case 'rem-t':{const v=Number(t.dataset.v),r=remEd;if(!r)break;r.rem=r.rem.includes(v)?r.rem.filter(y=>y!==v):[...r.rem,v];renderRem();break;}
    case 'rem-at':if(remEd){remEd.at=t.dataset.v;renderRem();}break;
    case 'rem-save':remSave(false);break;
    case 'rem-off':remSave(true);break;
    case 'comp-del':closePop();if(confirm('지울까요?')){S.companyHols=S.companyHols.filter(x=>x.id!==t.dataset.id);save();render();openCompPage();}break;
    case 'drive-link':driveBusy=true;driveFiles=null;try{window.AndroidBridge.driveList(false);}catch(err){driveBusy=false;}openBackupPage();break;
    case 'drive-backup':{
      // 새로 깐 폰처럼 데이터가 적은데 백업하면 예전 백업이 밀려 지워질 수 있어서 한 번 더 묻는다
      const f=(driveFiles||[])[0],rp=f&&f.appProperties||{},lm=backupMeta();
      const remote=(+rp.memos||0)+(+rp.shifts||0),local=(+lm.memos||0)+(+lm.shifts||0);
      if(f&&remote>local&&!confirm(`드라이브의 최신 백업(메모 ${rp.memos||0}개 · 근무 변경 ${rp.shifts||0}일)보다 지금 폰의 데이터가 적어요.\n\n백업은 2개만 남아서 예전 백업이 지워질 수 있어요. 먼저 "복원"을 하시는 게 안전해요.\n\n그래도 지금 백업할까요?`))break;
      driveBackupNow(false);break;}
    case 'drive-restore':{
      if(!confirm('이 백업으로 지금 데이터를 모두 바꿀까요?\n\n지금 폰에 있는 근무 변경·메모·알람은 백업 내용으로 바뀌어요.'))break;
      driveBusy=true;window.AndroidBridge.driveRestore(t.dataset.id);toast('불러오는 중…');break;}
    case 'drive-unlink':if(confirm('구글 드라이브 연결을 해제할까요?\n(드라이브에 있는 백업은 그대로 남아요)')){window.AndroidBridge.driveUnlink();driveFiles=null;openBackupPage();}break;
    case 'backup-export':exportBackup();break;
    case 'backup-undo':undoRestore();break;
    case 'bad-export':exportBad();break;
    case 'backup-import':{const f=$('#backupFile');if(f){f.value='';f.click();}break;}
    case 'nativefix':{try{window.AndroidBridge.openSettings(t.dataset.k);}catch(err){}break;}

    /* 공유 */
    case 'cancel-share':shareEnd();break;
    case 'do-share':shareScreen();break;
    case 'copy-share':shareScreen(true);break;

    /* 처음 시작 설정 */
    case 'ob-mine':obGo('way');break;
    case 'ob-invite':
      if(!fbCfg()){toast('가족 연결은 준비 중이에요. 지금은 내 근무표로 시작해요');if(ob.step==='start')obGo('way');break;}
      if(ob.step==='start')openJoinPop();else{obClose();openLinkPage();}
      break;
    case 'ob-restore':{
      S.noPat=true;S.myset=false;   // 백업을 못 불러와도 앱 기본값이 내 근무표처럼 보이지 않게 (불러오면 백업 값으로 바뀜)
      if(hasBridge('driveList')){S.onboarded=true;save();obClose();driveFiles=null;openBackupPage();}
      else{S.onboarded=true;save();obClose();openBackupPage();}
      break;}
    case 'ob-back':obBack();break;
    case 'ob-next':obNext();break;
    case 'ob-way':{const w=t.dataset.v;ob.way=w;if(w==='irregular'){obIrregular();if(ob&&ob.step==='way')ob.way='preset';}else obGo(w==='custom'?'len':'preset');break;}
    case 'ob-skip':obSkip();break;
    case 'ob-personal':S.personal=true;S.pers=[{f:'1900-01-01',t:''}];obSkip();break;
    case 'ob-len':{const v=Number(t.dataset.v);ob.len=Math.max(2,Math.min(PAT_MAX,t.dataset.m==='set'?v:ob.len+v));renderOb();break;}
    case 'ob-rnone':{if(!ob)break;ob.rk=ob.rk===NONE_K?'휴':NONE_K;renderOb();break;}
    case 'ob-wadd':if(ob.wk.length<4){ob.wk.push(['오','상','당','교','출'].find(k=>!ob.wk.includes(k)&&k!==ob.rk)||'근');renderOb();}break;
    case 'ob-wdel':if(ob.wk.length>1){ob.wk.splice(Number(t.dataset.i),1);renderOb();}break;
    case 'ob-brush':ob.brush=t.dataset.k;renderOb();break;
    case 'ob-cell':{ob.cpat[Number(t.dataset.i)]=ob.brush;renderOb();break;}
    case 'ob-preset':ob.preset=t.dataset.v;ob.pos=ob.preset==='week'?(new Date().getDay()+6)%7:0;ob.shift=0;ob.team=Math.min(ob.team,obTeams()-1);renderOb();break;
    case 'ob-pos':ob.pos=Number(t.dataset.v);ob.shift=0;renderOb();break;
    case 'ob-team':ob.team=Number(t.dataset.v);renderOb();break;
    case 'ob-shift':ob.shift+=Number(t.dataset.v);renderOb();break;
    case 'ob-finish':obFinish(t.dataset.v==='1');break;
    case 'ob-drive':driveBackupNow(false);break;
    case 'ob-done':obClose();break;
    case 'obtm-tog':ob.tmOpen=!ob.tmOpen;renderOb();break;
    case 'ob-wx':obClose();S.addons.wx=true;save();openWxPage();break;
  }
});
/* 작은 창 바깥을 누르거나 뒤로가기: 사진 맞추기 → 아이콘 고르기로, 아이콘 고르기 → 그 전 창으로 */
function popBack(){
  if($('#pop').classList.contains('wxfull'))wxDustClose();
  else if(piEd)piClose(true);
  else if(wlEd)wlClose();
  else if(carryCand)boardCarryDo(false);
  else if(crp)cropBack();
  else if(icn){const o=icn;closePop();if(o.onCancel)o.onCancel();}
  else closePop();
}
/* 한글 입력 중(조합 중)인 글자가 있으면 조합을 끝낸 뒤에 보내기 */
function afterCompose(sel,fn){
  const el=document.activeElement;
  if(el&&el.matches&&el.matches(sel)){el.blur();setTimeout(fn,60);}else fn();
}
function applyRequest(r,quiet){
  const d=parse(r.date),prev=shiftOf(d);
  r.prev=prev;
  if(r.want===baseShift(d))delete S.overrides[r.date];else S.overrides[r.date]=r.want;
  r.st='applied';r.tu=Date.now();
  if(!quiet)pushEvent('guest','apply',r.date,`✅ ${md(r.date)} 근무가 ${shiftLabel(prev)} → ${shiftLabel(r.want)}(으)로 바뀌었어요`);
}

document.addEventListener('change',e=>{
  const t=e.target;
  if(t.closest&&t.closest('.tbtn')){const sp=t.closest('.tbtn').querySelector('span');if(sp)sp.textContent=t.type==='date'?dfmt(t.value):tfmt(t.value);}
  if(t.dataset&&t.dataset.act==='atoggle'){
    const f=S.alarms.find(x=>x.id===t.dataset.id);
    if(f){f.on=t.checked;if(f.on&&f.once)f.until=firstFire(f);save();render();}
  }else if((t.id==='tdS'||t.id==='tdE')&&t.value&&typeDraft){typeDraft[t.id==='tdS'?'ts':'te']=t.value;const nm=$('#tdName'),kk=$('#tdK');if(nm)typeDraft.name=nm.value;if(kk&&kk.value)typeDraft.k=kk.value;openTypeEdit();
  }else if(/^pt[SE]_\d+$/.test(t.id||'')&&t.value){const ty=workTypes()[+t.id.slice(4)];if(ty){stSet(ty.k,t.id[2]==='S'?'start':'end',t.value);save();openPatternPage();}
  }else if((t.id==='otS'||t.id==='otE')&&t.value&&otKey){const d=parse(otKey),tt=timesOf(shiftOf(d)),o=(S.ot[otKey]||[tt.start,tt.end]).slice();o[t.id==='otS'?0:1]=t.value;otSet(o);
  }else if(/^obTm[SE]_\d+$/.test(t.id||'')&&t.value&&ob){const k=obTmKeys()[+t.id.slice(6)];if(k){ob.tm=ob.tm||{};const x=ob.tm[k]||obTmOf(k).slice();x[t.id[4]==='S'?0:1]=t.value;ob.tm[k]=x;renderOb();}
  }else if(t.id&&t.id.startsWith('tt_')&&pageMode==='times'){
    const v=t.value,id=t.id,cur0=timesOf(timesTab);
    if(id==='tt_leave'&&v)ttSet('leave',v);else if(id==='tt_start'&&v)ttSet('start',v);else if(id==='tt_end'&&v)ttSet('end',v);else if(id==='tt_home'&&v)ttSet('home',v);
    else if(id==='tt_mf'&&v)ttSet('meal',{from:v});else if(id==='tt_mt'&&v)ttSet('meal',{to:v});else if(id==='tt_mon')ttSet('meal',{on:t.checked});
    else if(id==='tt_sf'&&v)ttSet('sleep',{from:v});else if(id==='tt_st'&&v)ttSet('sleep',{to:v});else if(id==='tt_son')ttSet('sleep',{on:t.checked});
    else if(/^tt_b[ft]\d+$/.test(id)&&v){const i=+id.slice(5),b=cur0.breaks.map(x=>Object.assign({},x));if(b[i]){b[i][id[4]==='f'?'from':'to']=v;ttSet('breaks',b);}}
  }else if(t.id==='famDayToo'){S.famDayToo=t.checked;save();render();if(pageMode==='together')openTogetherPage();
  }else if(t.id&&t.id.startsWith('togw_')){const id=t.id.slice(5),L=(S.togOff||[]).filter(x=>x!==id);if(!t.checked)L.push(id);S.togOff=L;save();render();openTogetherPage();
  }else if(t.id==='srActOn'&&stDraft){srPull();const d=stDraft;
    if(t.checked){d.act=Object.assign({s:'16:00',e:'17:00',r:''},d.act&&d.act.s?d.act:{},d.act||{});if(!d.act.s)d.act.s='16:00';if(!d.act.e)d.act.e='17:00';if(!d.alarm){d.alarm=true;d.ats=[m2tm(tm2m(d.act.s)-30)];}}
    else d.act=null;
    renderStampReg();
  }else if((t.id==='srAS'||t.id==='srAE')&&stDraft&&t.value){srPull();const a=stDraft.act=Object.assign({s:'16:00',e:'17:00'},stDraft.act||{});
    if(t.id==='srAS'){const len=a.s&&a.e?((tm2m(a.e)-tm2m(a.s))+1440)%1440||60:60;a.s=t.value;a.e=m2tm(tm2m(t.value)+len);}else a.e=t.value;
    if(!stDraft.alarm){stDraft.alarm=true;stDraft.times=1;stDraft.ats=[m2tm(tm2m(a.s)-30)];}   // 활동 시간을 넣으면 "시작 30분 전" 알림을 미리 채움 (끌 수 있음)
    renderStampReg();
  }else if((t.id==='msAS'||t.id==='msAE')&&msDraft&&t.value){mstkPull();const a=msDraft.act=Object.assign({s:'16:00',e:'17:00',days:[]},msDraft.act||{});
    if(t.id==='msAS'){const len=a.s&&a.e?((tm2m(a.e)-tm2m(a.s))+1440)%1440||60:60;a.s=t.value;a.e=m2tm(tm2m(t.value)+len);}else a.e=t.value;
    renderManStkEdit();
  }else if((t.id==='ftS'||t.id==='ftE')&&ftDraft&&t.value){ftPull();ftDraft[t.id==='ftS'?'s':'e']=t.value;renderFtEdit();
  }else if(t.id==='almsg'){S.alarmMsg=t.checked;save();try{pushAlarmsToNative();}catch(e){}openAlarmPage();
  }else if(t.id==='srFrom'&&stDraft){stDraft.from=t.value;
  }else if(t.id==='srTo'&&stDraft){stDraft.to=t.value;renderStampReg();
  }else if(t.id==='mdTodo'&&mdDraft){mdPull();mdDraft.todo=t.checked;renderMemoDetail();
  }else if(t.id==='mdTime'&&mdDraft){if(t.value)mdDraft.time=t.value;
  }else if(t.id==='mdTill'&&mdDraft){mdPull();if(t.value&&t.value>mdDraft.k)mdDraft.till=t.value;else toast('끝 날은 시작한 날 뒤로 골라 주세요');renderMemoDetail();
  }else if(t.id==='srWknd'&&stDraft){stDraft.noWknd=t.checked;
  }else if(t.id==='srHol'&&stDraft){stDraft.noHol=t.checked;
  }else if(t.id==='srFam'&&stDraft){srPull();stDraft.fam=t.checked;renderStampReg();
  }else if(t.id==='slotFam'){const d0=S.stamps.defs.find(x=>x.id===t.dataset.id);if(d0){d0.fam=t.checked;save();toast(t.checked?'가족 달력에 보여요':'나만 봐요');}
  }else if(t.id==='srAlarm'&&stDraft){srPull();stDraft.alarm=t.checked;if(t.checked)stFill(stDraft);renderStampReg();
  }else if(/^srAt\d$/.test(t.id||'')&&stDraft){if(t.value)stDraft.ats[+t.id.slice(4)]=t.value;
  }else if(t.id==='srNight'&&stDraft){stDraft.noNight=t.checked;
  }else if(t.id==='famOwn'){famSetMode(t.checked?'own':'view');
  }else if(t.id==='famStk'){famSetStk(t.checked);
  }else if(t.id==='wgAlpha'){S.widget.alpha=+t.value;save();const e=$('#wgAv');if(e)e.textContent=S.widget.alpha+'%';wgPrev();
  }else if(t.id==='statsOn'){S.stats=t.checked;save();applyStats();
  }else if(t.id==='famPushQuiet'){S.pushQuiet=t.checked;save();famRegDevice().catch(()=>{});toast(t.checked?'자는 시간엔 소리 없이 알려요':'자는 시간에도 소리로 알려요');
  }else if(t.id==='famPushBoard'){S.pushBoard=t.checked;save();famRegDevice().catch(()=>{});toast(t.checked?'포스트잇 알림을 받아요':'포스트잇 알림을 끌게요 (아이콘의 작은 점은 그대로)');
  }else if(t.id==='famPushOn'){S.pushOn=t.checked;save();famRegDevice().catch(()=>{});toast(t.checked?'가족 알림을 받아요':'가족 알림을 끌게요');
  }else if(t.id&&t.id.startsWith('wlsV_')){const sc=S.wlog.secs.find(x=>x.id===t.id.slice(5));if(sc){if(!t.checked&&S.wlog.secs.filter(x=>!x.h).length<=1){t.checked=true;toast('칸이 하나는 있어야 해요');}else{sc.h=!t.checked;save();}}   // v0.151 스위치 = 보이기
  }else if(t.id&&t.id.startsWith('wlsH_')){const sc=S.wlog.secs.find(x=>x.id===t.id.slice(5));if(sc){if(t.checked&&S.wlog.secs.filter(x=>!x.h).length<=1){t.checked=false;toast('칸이 하나는 있어야 해요');}else{sc.h=t.checked;save();}}
  }else if(t.id==='wlsBk'){S.wlog.backup=t.checked;save();toast(t.checked?'일지도 백업에 들어가요':'일지는 백업에서 빠져요 (폰에만)');
  }else if(t.id==='wxOne'){if(t.checked)S.wx.one=true;else delete S.wx.one;save();try{pushAlarmsToNative();pushWidgetToNative();}catch(e){}
  }else if(t.id&&t.id.startsWith('ad_')){const k=t.id.slice(3);S.addons[k]=t.checked;save();render();if(k==='wx'&&t.checked&&!wxOk((S.wx||{}).home)){pageBack=openAddonPage;openWxPage();}else if(t.checked&&(k==='colleague'||k==='together')){pageBack=openAddonPage;k==='colleague'?(colM=null,openColleaguePage()):openTogetherPage();}else openAddonPage();if(k==='wx'){wxFetch(true);famSoon();}
  }else if(t.id==='st_show'){if(t.checked){t.checked=false;openCfm({type:'status'});}else{S.status.show=false;save();}
  }else if(t.id==='st_phone'){S.status.phone=t.checked;save();
  }else if(t.id==='st_home'){S.status.homeAlert=t.checked;save();
  }else if(t.id==='piDate'){const n=piTarget();if(n)n.dateAuto=t.checked;
  }else if(t.id==='anchor'&&t.value){askAnchor(t.value);}
  else if(t.id==='shareMemo'){$('#app').classList.toggle('share-memo',t.checked);render();}
  else if(t.id==='shareStk'){shareStk=t.checked;render();}
  else if(t.id==='ovDot'){S.ovDot=!!t.checked;save();render();widgetSync();}
  else if(t.id==='holRest'){S.holRest=t.checked;save();toast(t.checked?'공휴일 근무 칸을 휴무로 보여요':'공휴일도 패턴대로 보여요');}
  else if(t.id==='receiveFamilyMemo'){S.syncSettings.receiveFamilyMemo=t.checked;save();if(tab==='cal')render();toast(t.checked?'가족 메모를 달력에 표시해요':'가족 메모를 달력에서 숨겨요');}
  else if(t.id==='patWeek'){S.patWeek=!!t.checked;save();openPatternPage();}
  else if(t.id==='wlsName'){save();openWlSet();}
  else if(t.id==='admVip'||t.id==='admNoAds'){admToggle(t.id==='admVip'?'vip':'noAds',t.checked);}
  else if(t.id==='patternName'){S.patternName=t.value.trim().slice(0,20);save();toast('근무 이름을 저장했어요');}
  else if(t.id==='payFixed'||t.id==='payOt'||t.id==='payNt'){S.salary[{payFixed:'fixed',payOt:'ot',payNt:'nt'}[t.id]]=Math.max(0,Math.round(Number(t.value)||0));save();openStatsPage();}
  else if(t.id==='payClose'){S.salary.close=Math.max(0,Math.min(28,Math.round(Number(t.value)||0)));save();openStatsPage();}
  else if(t.id==='payLeaveFrom'&&/^\d{4}-\d\d-\d\d$/.test(t.value)){S.salary.leaveFrom=t.value.slice(5);save();openStatsPage();}
  else if(t.id==='payLeave'){S.salary.leaveYear=Math.max(0,Math.min(60,Math.round(Number(t.value)||0)));save();openStatsPage();}
  else if((t.id==='payNs'||t.id==='payNe')&&t.value){S.salary.night[t.id==='payNs'?0:1]=t.value;save();openStatsPage();}
  else if(/^sl(Ot|Nt|Lv|Lvd|Tot)$/.test(t.id||'')){slipSet({slOt:'ot',slNt:'nt',slLv:'lv',slLvd:'lvd',slTot:'tot'}[t.id],t.value);openSlipPage();}
  else if(t.id==='tdUnpaid'&&typeDraft){typeDraft.unpaid=t.checked;}
  else if(t.id==='compHolAsHoliday'){S.compHolAsHoliday=t.checked;save();}
  else if(t.id==='driveAuto'){S.drive.auto=t.checked;persist();}
  else if(t.id==='backupFile'&&t.files&&t.files[0]){importBackup(t.files[0]);}
  else if(t.id==='icoFile'&&t.files&&t.files[0]){const rd=new FileReader();rd.onload=()=>openCrop(String(rd.result));rd.onerror=()=>toast('사진을 열지 못했어요');rd.readAsDataURL(t.files[0]);}
  else if(t.id==='chDate'){chDraft.date=t.value;}
  else if(t.id==='aRepeat'&&draft){draft.once=!t.checked;openAlarmPage();}
  else if(t.id==='aRamp'&&draft){draft.ramp=t.checked;}
  else if(t.id==='aNoHol'&&draft){draft.noHol=t.checked;}
  else if(t.id==='aPre'&&draft){draft.pre5=t.checked;}   // v0.142 5분 전 알림
  else if(t.id==='at'&&draft){draft.time=t.value||draft.time;openAlarmPage();}
  else if(t.id.startsWith('obT_')&&ob){const r=obAlarms()[+t.id.slice(4)];if(r&&t.value)r[1].t=t.value;renderOb();}
  else if(t.id.startsWith('obOn_')&&ob){const r=obAlarms()[+t.id.slice(5)];if(r)r[1].on=t.checked;}
  else if(t.id==='guestModeToggle'){
    S.syncSettings.isGuestMode=t.checked;save();
    toast(t.checked?'가족 화면(체험)으로 바꿨어요':'내 화면으로 돌아왔어요');
    if(pageMode==='famset')openFamSetPage();render();
  }
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='memoInput'){memoText=t.value;}
  else if(t.id==='joinCode'){const n=famNorm(t.value).slice(0,8);t.value=n.length>4?n.slice(0,4)+'-'+n.slice(4):n;}
  else if((t.id==='piText'||t.id==='piTitle')&&piEd){const n=piTarget();if(n){piPull();const sg=$('#piSug');if(sg)sg.innerHTML=piSug(n);}}
  else if(t.id==='tdK'&&typeDraft){typeDraft.k=kCut(t.value);if(t.value.trim()!==typeDraft.k)t.value=typeDraft.k;const pv=$('#tdPrev');if(pv)pv.outerHTML=typePreview();const w0=document.querySelector('.pal .sw0');if(w0)w0.textContent=typeDraft.k||'휴';}   // 흰 바탕(색 없음) 칸에도 내가 쓴 글자
  else if(t.id==='tdName'&&typeDraft){typeDraft.name=t.value;}
  else if(t.dataset&&t.dataset.obn&&ob){const v=kCut(t.value);if(t.dataset.obn==='r')ob.rk=v;else ob.wk[+t.dataset.obn.slice(1)]=v;}
  else if(t.id==='typeSearch'){filterTypePick(t.value);}
  else if(t.id==='rqm'){reqDraft.msg=t.value;}
  else if(t.id==='vcmsg'){vcSel.msg=t.value;}
  else if(t.id==='rpm'&&replyDraft){replyDraft.text=t.value;}
  else if(t.id==='al'&&draft){draft.label=t.value;}
  else if(t.id==='mdText'){const sv=$('#page .pg-h .ok');if(sv){const off=!t.value.trim();if(sv.classList.contains('off')&&!off&&sv.animate)sv.animate([{transform:'scale(.9)'},{transform:'scale(1.08)',offset:.6},{transform:'none'}],{duration:380,easing:'cubic-bezier(.3,.7,.4,1)'});sv.classList.toggle('off',off);}const r=$('#mdLinks');if(r)r.innerHTML=hasLink(t.value)?linkParts(t.value).filter(x=>x.u).map(x=>`<a class="lnk" data-act="lnk" data-u="${esc(linkUrl(x.u))}">🔗 링크</a>`).join(' '):'';}
  else if(t.id==='aVol'&&draft){draft.vol=Number(t.value);const s=t.parentElement.querySelector('small');if(s)s.textContent=`알람 볼륨 기준 ${draft.vol}%`;}
  else if(t.id==='chName'){chDraft.name=t.value;}
  else if(t.id==='crpZoom'&&crp){crp.z=+t.value;cropDraw();}
  else if(t.classList&&t.classList.contains('wlta')&&wlEd&&!t.closest('.swn')){wlGrow(t);const n=wlLines(t.value).length,c=$('#wlN_'+t.dataset.s);if(c)c.textContent=n?n+'줄':'';
    clearTimeout(wlSaveT);const k=t.dataset.k||wlEd.k;wlSaveT=setTimeout(()=>{wlTas(k).forEach(x=>wlSetText(k,x.dataset.s,x.value));save();},350);}   // (칸 여러 개를 빨리 고쳐도 모두 저장)
  else if(t.id==='srchQ'){srch.q=t.value;{const fd=document.querySelector('.srfield');if(fd)fd.classList.toggle('has',!!t.value);}clearTimeout(srchT);srchT=setTimeout(()=>{const r=$('#srchRes');if(!r)return;const kOf=x=>x.dataset.k+'|'+x.dataset.kind+'|'+x.textContent.slice(0,40),old=new Set([...r.querySelectorAll('.srow')].map(kOf));srchRefresh();try{if(!RMq()){let n=0;r.querySelectorAll('.srow').forEach(x=>{if(n>=10||old.has(kOf(x)))return;x.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:260,delay:n*30,easing:'cubic-bezier(.2,.9,.25,1)',fill:'backwards'});n++;});}}catch(err){}},150);}   // v0.209 새로 찾은 줄만 위에서부터 차례로
  else if(t.id==='wlsName'||(t.id&&t.id.startsWith('wlsS_'))){if(t.id==='wlsName'){S.wlog.name=cutTxt(t.value,12).trim();const h=document.querySelector('#page.open .pg-h b');if(h)h.textContent=`${wlName()} 설정`;document.querySelectorAll('#page [data-act="wls-nm"]').forEach(b=>b.classList.toggle('on',b.dataset.v===wlName()));}   /* v0.225 직접 쓴 이름이 제목에 바로 */else{const sc=S.wlog.secs.find(x=>x.id===t.id.slice(5));if(sc)sc.n=cutTxt(t.value,8).trim()||sc.n;}clearTimeout(wlsT);wlsT=setTimeout(()=>save(),400);}
});
/* 엔터로 보내기 */
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.isComposing)return;
  if(e.target.id==='memoInput'){e.preventDefault();memoSubmit();}
  else if(e.target.id==='vcmemo'){e.preventDefault();const b=document.querySelector('[data-act="vc-memo-send"]');if(b)b.click();}
  else if(e.target.id==='piLine'){e.preventDefault();piAddLine();}
  else if(e.target.id==='wlRen'){e.preventDefault();wlCommitInputs();if(wlEd)renderWl(false);}
  else if(e.target.id==='wlNm'){e.preventDefault();const b=document.querySelector('[data-act="wl-nmok"]');if(b)b.click();}
  else if(e.target.id==='wlsName'){e.preventDefault();e.target.blur();}
  else if(e.target.id==='srchQ'){e.preventDefault();e.target.blur();if(srchRun(srch.q,srch.kind).length)srchRecentAdd(srch.q);}
});
/* 입력칸을 누르면 키보드 위로 보이게 (시트·페이지 안에서만 스크롤, 화면 전체는 움직이지 않음) */
function ensureVisible(el){
  if(!el||!el.closest)return;
  if(el.closest('.ibar'))return;          // 아래 입력창은 항상 키보드 바로 위에 붙어 있음
  const c=el.closest('#sheet,.pg-b,.ob-b,.wlp .bd');if(!c)return;   // (.wlp .bd: 업무 일지 팝업)
  const r=el.getBoundingClientRect(),cr=c.getBoundingClientRect();
  const bar=c.querySelector('.ibar'),barH=bar?bar.getBoundingClientRect().height:0;
  if(r.bottom>cr.bottom-barH-8)c.scrollTop+=r.bottom-(cr.bottom-barH)+16;
  else if(r.top<cr.top+8)c.scrollTop-=cr.top-r.top+16;
}
document.addEventListener('focusin',e=>{
  const t=e.target;
  if(!t.matches||!t.matches('input,textarea'))return;
  setTimeout(()=>ensureVisible(t),300);
});
// v0.209 키보드가 올라와 날짜 창이 위로 밀릴 때 툭 말고 스르르: 누르기 전 스크롤 자리를 기억 → 화면이 줄며 밀린 만큼 내용을 되돌려 놓고 0 으로 미끄러뜨림 (transform 만)
let kbTop=null,kbT=0;
document.addEventListener('focusin',e=>{const t=e.target,sh=$('#sheet');if(t&&t.matches&&t.matches('input[type=text],textarea')&&sh&&sh.classList.contains('open')&&sh.contains(t)){kbTop=sh.scrollTop;kbT=performance.now();}},true);
function kbSmooth(){const sh=$('#sheet');if(kbTop==null||!sh||performance.now()-kbT>1500)return;const d=sh.scrollTop-kbTop;if(Math.abs(d)<24)return;kbTop=null;if(RMq())return;
  [...sh.children].forEach(x=>{if(x.offsetParent===null)return;x.animate([{transform:`translateY(${d}px)`},{transform:'none'}],{duration:300,easing:'cubic-bezier(.2,.9,.25,1)'});});}
const RMq=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
document.addEventListener('scroll',e=>{if(e.target&&e.target.id==='sheet'&&kbTop!=null&&performance.now()-kbT<1500)kbSmooth();},true);
window.addEventListener('resize',()=>{
  $('#app').scrollTop=0;document.documentElement.scrollTop=0;
  kbSmooth();
  const a=document.activeElement;
  if(a&&a.matches&&a.matches('input,textarea'))setTimeout(()=>ensureVisible(a),80);
});

/* 스와이프 */
let sx=null,sy=0,dx=0,lock=null,st=0,swBase=0,calPend=null;
const V=$('#view');
// v0.136 넘어가는 중(0.25초)에 또 밀면 버리지 않음: 지금 넘김을 바로 끝내고(보이는 자리 그대로) 새 손가락을 이어서 따라감
function calFlush(){if(!calPend)return 0;clearTimeout(calPend.t);const d=calPend.dir;calPend=null;busy=false;shiftMonth(d);return d;}
V.addEventListener('touchstart',e=>{
  if(paint){sx=null;return;}
  if(tab!=='colleague'||$('#sheet').classList.contains('open')){sx=null;return;}   // v0.138 달력은 가로 스크롤(scroll-snap)이 직접 · 동료 근무표만 여기서
  swBase=0;
  if(busy){
    const tr=$('#track');if(!calPend||!tr||tab!=='cal'){sx=null;return;}
    let x0=0;try{x0=new DOMMatrixReadOnly(getComputedStyle(tr).transform).m41;}catch(err){}
    const W=V.clientWidth,d=calFlush(),tr2=$('#track');
    swBase=x0+d*W+W;if(Math.abs(swBase)>W)swBase=0;
    if(tr2){tr2.style.transition='none';tr2.style.transform=`translateX(calc(-33.3333% + ${swBase}px))`;}
  }
  sx=e.touches[0].clientX;sy=e.touches[0].clientY;dx=0;lock=null;st=Date.now();
},{passive:true});
V.addEventListener('touchmove',e=>{
  if(sx===null)return;
  const x=e.touches[0].clientX-sx,y=e.touches[0].clientY-sy;
  if(lock===null&&(Math.abs(x)>8||Math.abs(y)>8))lock=Math.abs(x)>Math.abs(y)?'x':'y';
  if(lock!=='x')return;
  // 옆으로 넘기는 건 앱이 처리한다고 폰에 알림 → 폰이 스크롤 · 관성을 시작하지 않음. (안 그러면 폰은 "관성으로 움직이는 중"이라 보고, 넘긴 직후 첫 누름(오늘 · 날짜 칸)을 멈추는 데만 쓰고 버림)
  dx=x;
  if(tab==='colleague')return;
  if(glowStart||glowTm)glowStop();   // 넘기기 시작하면 빛은 바로 멈춤
  const mk=cur.y*12+cur.m;
  dx=((x>0&&mk<=MIN_M)||(x<0&&mk>=MAX_M))?x*0.25:x;
  const tr=$('#track');if(!tr)return;
  tr.style.transition='none';
  tr.style.transform=`translateX(calc(-33.3333% + ${swBase+dx}px))`;
},{passive:true});   // v0.138 달력은 가로 스크롤 · 이 처리는 동료 근무표만 (막지 않음)
V.addEventListener('touchend',()=>{
  if(sx===null||lock!=='x'){sx=null;return;}
  sx=null;
  const w=V.clientWidth,fast=Math.abs(dx)/(Date.now()-st+1)>0.5,px=swBase+dx;swBase=0;
  const mk=cur.y*12+cur.m;
  let dir=(Math.abs(px)>w*0.22||(fast&&Math.abs(dx)>30))?((fast&&Math.abs(dx)>30?dx:px)<0?1:-1):0;
  if(mk+dir<MIN_M||mk+dir>MAX_M)dir=0;
  if(tab==='colleague'){if(dir)shiftMonth(dir);return;}
  const tr=$('#track');if(!tr)return;
  tr.style.transition='transform .24s ease';
  tr.style.transform=`translateX(${dir>0?'-66.6667%':dir<0?'0%':'-33.3333%'})`;
  if(dir){busy=true;calPend={dir,t:setTimeout(calFlush,250)};}
},{passive:true});

/* ================= 화면 공유 · 파일 백업 ================= */
function shareScreen(copy){   // copy=true: 공유 창을 열지 않고 달력 그림을 클립보드에만 담음 (붙여넣기로 보냄)
  const app=$('#app');
  const done=()=>setTimeout(()=>{app.classList.remove('capturing');shareEnd();},400);
  const fn=copy?'copyScreen':'shareScreen';
  if(hasBridge(fn)){
    app.classList.add('capturing');
    requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>{
      try{window.AndroidBridge[fn]();}catch(e){toast(copy?'복사하지 못했어요':'공유하지 못했어요');}
      done();
    },120)));
  }else{toast(copy?'앱에서는 이 화면이 이미지로 복사돼요':'앱에서는 이 화면이 이미지로 공유돼요');done();}
}
function exportBackup(){
  const json=JSON.stringify(backupData(),null,1);
  const name=`eonjeswieo-backup-${fmt(new Date())}.json`;
  if(hasBridge('shareFile')){try{window.AndroidBridge.shareFile(name,json);return;}catch(e){}}
  try{
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    a.download=name;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);
    toast('백업 파일을 저장했어요');
  }catch(e){toast('백업 파일을 만들지 못했어요');}
}
function importBackup(file){
  if(file&&file.size>8e6){toast('파일이 너무 커요 (8MB 까지)');return;}
  const rd=new FileReader();
  rd.onload=()=>{
    let d;
    try{d=JSON.parse(String(rd.result));}catch(e){toast('백업 파일을 읽지 못했어요');return;}
    if(!d||!(d.app==='eonjeswieo'||d.app==='shiftcal')){toast('언제쉬어 백업 파일이 아니에요');return;}
    if(!confirm(`${d.at?d.at.slice(0,10)+' 에 만든 ':''}백업으로 지금 데이터를 모두 바꿀까요?\n\n(지금 폰에 있는 근무 변경·메모·알람은 사라져요)`))return;
    if(applyBackup(d)){closeSheet();if(pageMode)closePage();render();toast('백업을 불러왔어요');}
  };
  rd.onerror=()=>toast('백업 파일을 읽지 못했어요');
  rd.readAsText(file);
}

/* ================= Firebase (가족 연결용) =================
 * 지금은 "연결 시험"까지만. 설정(firebase/config.js)이 없으면 아무 일도 안 하고, 화면에도 안 보여요.
 * (설정 › 앱 정보를 7번 누르면 개발자용 시험 화면이 열려요)
 * 원칙: 로컬 우선. 달력 · 알람은 Firebase 없이 동작해요. SDK 는 앱 안(assets/firebase/fb-sdk.js)에 있고 필요할 때만 불러와요. */
const FBX={st:'off',uid:'',err:'',cfg:false,busy:false,ping:null};
const fbLoadJs=src=>new Promise((ok,no)=>{const e=document.createElement('script');e.src=src;e.async=true;e.onload=()=>ok();e.onerror=()=>{e.remove();no(new Error('load:'+src));};document.head.appendChild(e);});
function fbErrText(e){
  const c=String((e&&e.code)||(e&&e.message)||e);
  if(c.includes('operation-not-allowed')||c.includes('admin-restricted'))return '익명 로그인이 꺼져 있어요 (Firebase 콘솔 › Authentication › 로그인 방법 › 익명 켜기)';
  if(c.includes('permission-denied')||c.includes('insufficient permissions'))return '보안 규칙이 막고 있어요 (firebase/firestore.rules 를 콘솔 › Firestore › 규칙 에 붙여 넣었는지 확인)';
  if(c.includes('invalid-api-key')||c.includes('api-key-not-valid'))return '설정의 apiKey 가 올바르지 않아요';
  if(c.includes('unavailable')||c.includes('network')||c.includes('offline'))return '서버에 연결하지 못했어요 (인터넷 확인)';
  if(c.includes('load:'))return 'Firebase 파일을 못 불러왔어요';
  return c.slice(0,140);
}
// 설정 · SDK · 저장된 로그인 복원까지만 (새 익명 계정은 안 만듦). Firebase 설정이 없으면 null
async function fbAuthInit(){
  if(FBX.auth)return FBX.auth;
  if(window.FIREBASE_CONFIG===undefined){try{await fbLoadJs('firebase/config.js');}catch(e){}}
  const cfg=window.FIREBASE_CONFIG;FBX.cfg=!!cfg;
  if(!cfg)return null;
  if(!window.FB)await fbLoadJs('firebase/fb-sdk.js');
  const {emulator,...web}=cfg,A=window.FB.auth;
  const app=window.FB.initializeApp(web);
  const auth=A.initializeAuth(app,{persistence:[A.indexedDBLocalPersistence,A.browserLocalPersistence]});
  if(emulator&&emulator.auth)A.connectAuthEmulator(auth,emulator.auth,{disableWarnings:true});
  await new Promise(res=>{const un=A.onAuthStateChanged(auth,u=>{un();res(u);});});   // 저장된 로그인 복원 기다림
  FBX.app=app;FBX.auth=auth;
  return auth;
}
async function fbConnect(){
  if(FBX.st==='ok')return true;
  if(FBX.busy)return false;
  FBX.busy=true;FBX.st='loading';FBX.err='';
  try{
    const auth=await fbAuthInit();
    if(!auth){FBX.st='off';FBX.err='설정이 아직 없어요 (firebase/config.js)';return false;}
    const {emulator}=window.FIREBASE_CONFIG,{auth:A,fs:F}=window.FB,app=FBX.app;
    if(!auth.currentUser)await A.signInAnonymously(auth);
    let db;
    try{db=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentSingleTabManager()}),experimentalAutoDetectLongPolling:true});}   // 오프라인 저장 · 안드로이드 웹뷰에서 연결이 멈추지 않게 자동으로 맞춤
    catch(e){db=F.getFirestore(app);}
    if(emulator&&emulator.firestore)F.connectFirestoreEmulator(db,emulator.firestore[0],emulator.firestore[1]);
    FBX.app=app;FBX.auth=auth;FBX.db=db;FBX.uid=auth.currentUser.uid;FBX.st='ok';
    if(emulator)window.__fbx=FBX;   // 에뮬레이터 시험용 (실제 서버에서는 안 열림)
    return true;
  }catch(e){FBX.st='error';FBX.err=fbErrText(e);return false;}
  finally{FBX.busy=false;}
}
// 서버에 한 줄 쓰고 다시 읽어서 시간 재기 (보안 규칙의 ping/{내 uid} 만 허용)
async function fbPing(){
  if(!(await fbConnect()))return null;
  const F=window.FB.fs,t0=performance.now();
  try{
    const ref=F.doc(FBX.db,'ping',FBX.uid);
    await F.setDoc(ref,{t:F.serverTimestamp(),v:appVersion(),ua:navigator.userAgent.slice(0,120)});
    const snap=await F.getDocFromServer(ref);
    FBX.ping={ok:snap.exists(),ms:Math.round(performance.now()-t0),at:Date.now()};
  }catch(e){FBX.ping={ok:false,err:fbErrText(e),at:Date.now()};}
  return FBX.ping;
}
async function fbSignOut(){
  if(FBX.st!=='ok')return;
  try{await window.FB.auth.signOut(FBX.auth);}catch(e){}
  FBX.uid='';FBX.ping=null;FBX.st='off';FBX.err='로그아웃했어요 (앱을 다시 켜면 새 익명 계정으로 들어가요)';
}
function openFirebasePage(){
  const f=FBX,ok=f.st==='ok',pg=f.ping;
  const row=(t,sm,v,c)=>`<div class="prow"><div class="pl2">${t}${sm?`<small>${sm}</small>`:''}</div><span class="pv" ${c?`style="color:${c};font-weight:700"`:''}>${v}</span></div>`;
  openPage(`
    ${pageHead('Firebase 연결 시험')}
    <div class="pg-b">
      <div class="pg-sec" style="padding:12px 14px"><div style="display:flex;align-items:center;justify-content:space-between"><b>시작 기록 (켠 뒤 12초 · ms)</b><button class="btn ghost" style="padding:6px 14px;min-height:0" data-act="pf-copy">복사</button></div><div style="font:12px/1.5 monospace;white-space:pre-wrap;margin-top:6px;max-height:60vh;overflow:auto">${esc(pfText()||'(기록 없음)')}</div></div>
      <div class="pg-sec">
        ${row('설정 파일','firebase/config.js',f.cfg?'있음':'없음',f.cfg?'var(--today)':'var(--muted)')}
        ${row('로그인 (익명)','',f.uid?esc(f.uid.slice(0,8))+'…':'아직',ok?'var(--today)':'')}
        ${row('서버 시험','서버에 쓰고 다시 읽기',pg?(pg.ok?`✓ ${pg.ms}ms`:'✕ 실패'):'아직 안 함',pg?(pg.ok?'var(--today)':'var(--danger)'):'')}
      </div>
      ${f.err?`<div class="hint" style="color:var(--danger);padding:10px 16px 0">${esc(f.err)}</div>`:''}
      ${pg&&!pg.ok&&pg.err?`<div class="hint" style="color:var(--danger);padding:10px 16px 0">${esc(pg.err)}</div>`:''}
      <div class="pg-sec" style="margin-top:14px;padding:14px 16px">
        <button class="btn" style="width:100%" data-act="fb-test" ${f.busy?'disabled':''}>${f.busy?'연결 중…':'연결 시험하기'}</button>
        ${ok?'<button class="btn ghost" style="width:100%;margin-top:8px" data-act="fb-out">익명 로그아웃</button>':''}
        <button class="btn ghost" style="width:100%;margin-top:8px" data-act="tune-open">모양 조정 (앱 달력 · 위젯)</button>
      </div>
    </div>`,'fb');
}
/* ================= 가족 연결 (Firebase) · 1단계: 가족방 · 초대 코드 · 참여 · 가족 관리 =================
 * 가족방 번호(hid) = 호스트(근무자)의 Firebase 로그인 번호(uid).
 * 구조 · 규칙: firebase/firestore.rules (households / members / invites)
 * 아직 근무표 · 메모 · 요청은 안 주고받아요 (2단계 이후). 설정(firebase/config.js)이 없으면 이 화면은 안 보여요. */
const FAM_ALPHA='ABCDEFGHJKMNPQRSTUVWXYZ23456789',FAM_MAX=4,FAM_DAYS=7;   // 헷갈리는 0 O 1 I L 빼고
const fbCfg=()=>!!window.FIREBASE_CONFIG;
const famRe=/^[A-HJKMNP-Z2-9]{8}$/;
const famFmt=c=>c?c.slice(0,4)+'-'+c.slice(4):'';
const famNorm=t=>String(t||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const famPermTxt=p=>p==='read'?'보기만':'메모 · 요청 보내기';
const famModeTxt=m=>m.mode==='view'?'보기만 · 근무표 안 올림':'근무표 올림';
function famNewCode(){const a=new Uint32Array(8);crypto.getRandomValues(a);return Array.from(a,v=>FAM_ALPHA[v%FAM_ALPHA.length]).join('');}
const famErr=e=>{const c=String((e&&e.code)||(e&&e.message)||e);return c.includes('permission-denied')?'권한이 없어요. 코드가 방금 사용됐거나 자리가 가득 찼을 수 있어요':fbErrText(e);};
async function famReady(){
  if(!fbCfg())throw new Error('Firebase 설정이 없어요');
  if(!(await fbConnect()))throw new Error(FBX.err||'서버에 연결하지 못했어요');
  return {F:window.FB.fs,db:FBX.db,uid:FBX.uid};
}
const famMember=(F,db,hid,uid)=>F.doc(db,'households',hid,'members',uid);
// 서버가 기준: 내가 어느 가족방 구성원인지 확인해서 S.link 를 바로잡음
async function famSync(){
  const {F,db,uid}=await famReady();
  const hid=S.link?S.link.hid:uid;   // 링크가 없어도 내 번호의 가족방(호스트)이 있는지 확인
  const snap=await F.getDoc(famMember(F,db,hid,uid));
  const had=!!S.link;
  const old=S.link;
  if(snap.exists()){const d=snap.data();S.link={hid,role:d.role,name:d.name,perm:d.perm,mode:d.mode==='view'?'view':'own',uid,hash:(old&&old.hid===hid&&old.hash)||'',stk:!!(old&&old.hid===hid&&old.stk),stkAsked:(old&&old.hid===hid&&old.stkAsked)?1:0};S.linkMissAt=0;S.linkLost=null;}
  else if(old){
    // 서버에서 내 칸을 못 찾았다고 바로 연결을 지우지 않음: 처음에는 표시만 하고(연결은 그대로), 5분 넘게 계속 못 찾을 때만 끊김으로 처리 + 무엇이 끊겼는지 남겨 둠(복구 안내용)
    if(!S.linkMissAt){S.linkMissAt=Date.now();save();clearTimeout(window.__famMissT);window.__famMissT=setTimeout(()=>{famSync().then(r=>{if(!S.link&&r.had){famClear();toast('가족방에서 나왔어요');render();}}).catch(()=>{});},5*60e3+3000);return {had,link:S.link,miss:true};}   // 5분 뒤 한 번 더 확인
    if(Date.now()-S.linkMissAt<5*60e3)return {had,link:S.link,miss:true};
    S.linkLost={hid:old.hid,role:old.role==='host'?'host':'guest',name:String(old.name||'').slice(0,12),at:Date.now()};S.linkMissAt=0;
    S.link=null;famClear();
  }
  else{S.link=null;famClear();}
  save();
  return {had,link:S.link};
}
async function famMembers(hid){
  const {F,db}=await famReady();
  const s=await F.getDocs(F.collection(db,'households',hid,'members'));
  return s.docs.map(d=>({uid:d.id,...d.data()})).sort((a,b)=>(a.role==='host'?-1:0)-(b.role==='host'?-1:0)||(a.joinedAt&&b.joinedAt?a.joinedAt.toMillis()-b.joinedAt.toMillis():0));
}
// 내가 만든 쓸 수 있는 초대 코드 (쓴 것 · 기간 지난 것은 지움)
async function famMyInvites(){
  const {F,db,uid}=await famReady();
  const s=await F.getDocs(F.query(F.collection(db,'invites'),F.where('ownerUid','==',uid)));
  const now=Date.now(),out=[];
  s.docs.forEach(d=>{const v=d.data(),exp=v.expireAt.toMillis();
    if(v.usedBy||exp<now){F.deleteDoc(d.ref).catch(()=>{});return;}
    out.push({code:d.id,name:v.name,perm:v.perm,exp});});
  return out.sort((a,b)=>a.exp-b.exp);
}
// 가족방이 없으면 만들기 (처음 만든 사람 구성원 문서와 한 묶음). 내 번호 방이 이미 있으면(내가 나간 방에 가족이 남아 있음) 새 번호로
async function famEnsureHouse(hostName){
  const {F,db,uid}=await famReady();
  const me=await F.getDoc(famMember(F,db,uid,uid));
  if(me.exists()){const d=me.data();S.link={hid:uid,role:'host',name:d.name,perm:'write',mode:'own',uid,hash:''};save();famBoot();return;}
  const mk=async hid=>{const b=F.writeBatch(db);
    b.set(F.doc(db,'households',hid),{ownerUid:uid,createdAt:F.serverTimestamp(),guestCount:0});
    b.set(famMember(F,db,hid,uid),{role:'host',name:hostName,perm:'write',joinedAt:F.serverTimestamp()});
    await b.commit();return hid;};
  let hid;
  try{hid=await mk(uid);}catch(e){if(!String((e&&e.code)||e).includes('permission'))throw e;hid=await mk(uid+'_'+famNewCode());}
  S.link={hid,role:'host',name:hostName,perm:'write',mode:'own',uid,hash:''};save();famBoot();
  if(googleOn()&&!S.gAcct)gAskAfter=true;   // 가족방을 새로 만들었으면 코드 창 다음에 바로 구글 연결 안내
}
let gAskAfter=false;
// 방장인데 구글 미연결: 앱 켤 때 한 번 경고 (닫으면 7일 뒤 다시 · 다른 창이 열려 있으면 다음에)
function gWarnPop(){
  if(!googleOn()||S.gAcct||!S.link||S.link.role!=='host'||gAskAfter||Date.now()<(S.gWarnAt||0))return;
  if($('#pop').classList.contains('open')||document.querySelector('.dshell,#sheet.open,#page.open'))return;
  gWarnShow();
}
function gWarnShow(){   // v0.223 가족방을 만든 뒤 안내와 앱 켤 때 경고를 하나로 (보여 주면 7일 쉼)
  S.gWarnAt=Date.now()+7*864e5;save();
  openPop(`<div class="mh gwpop"><b>⚠️ 구글 계정 연결 안 됨</b></div>
    <div class="mi gwpop-t">방장 권한을 잃을 수 있어요</div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">나중에</button><button class="btn grow gwbtn2" data-act="g-link-pop">연결하기</button></div>`);
}
function gAskPop(){
  if(!gAskAfter||!googleOn()||S.gAcct||!S.link||S.link.role!=='host')return;gAskAfter=false;
  gWarnShow();
}
async function famCreateInvite(perm,name){
  const {F,db,uid}=await famReady();
  for(let i=0;i<5;i++){
    const code=famNewCode(),exp=Date.now()+FAM_DAYS*864e5;
    try{
      await F.setDoc(F.doc(db,'invites',code),{hid:S.link.hid,ownerUid:uid,perm,name:name||'',hostName:S.link.name,patternName:(S.patternName||'').slice(0,20),createdAt:F.serverTimestamp(),expireAt:F.Timestamp.fromMillis(exp),usedBy:null});
      return {code,exp};
    }catch(e){if(i===4)throw e;}   // 코드가 겹쳤으면 다시
  }
}
async function famLookup(code){
  const {F,db,uid}=await famReady();
  const snap=await F.getDoc(F.doc(db,'invites',code));
  if(!snap.exists())return {err:'없는 코드예요. 다시 확인해 주세요'};
  const d=snap.data();
  if(d.ownerUid===uid||d.hid===uid)return {err:'내가 만든 코드예요. 가족 폰에서 넣어 주세요'};
  if(S.link&&d.hid===S.link.hid)return {err:'이미 이 가족방에 있어요'};
  if(d.usedBy)return {err:'이미 사용된 코드예요. 새 코드를 요청해 주세요'};
  if(d.expireAt.toMillis()<Date.now())return {err:'기간이 지난 코드예요. 새 코드를 요청해 주세요'};
  return {ok:true,hid:d.hid,perm:d.perm,name:d.name,hostName:d.hostName,patternName:d.patternName,ownerUid:okId(d.ownerUid)?d.ownerUid:''};
}
async function famJoin(code,info,name,mode){
  track('family_join');
  mode=mode==='view'?'view':'own';
  const {F,db,uid}=await famReady();
  const b=F.writeBatch(db);
  b.set(famMember(F,db,info.hid,uid),{role:'guest',name,perm:info.perm,joinedAt:F.serverTimestamp(),inviteCode:code,mode,...(info.ownerUid?{invitedBy:info.ownerUid}:{})});   // invitedBy: 초대한 사람이 24시간 안에 되돌릴 수 있게
  b.update(F.doc(db,'invites',code),{usedBy:uid,usedAt:F.serverTimestamp()});
  b.update(F.doc(db,'households',info.hid),{guestCount:F.increment(1)});
  await b.commit();
  S.link={hid:info.hid,role:'guest',name,perm:info.perm,mode,uid,hash:''};
  S.fam2.me={...(S.fam2.me||{}),joinedAt:Date.now(),joinLocal:Date.now(),moved:0};S.fam2.archDone=0;S.fam2.archIds=[];   // 들어오고 10분 안: 옛 메모는 무료 횟수 없이 옮김 (서버 시각이 오면 바뀜)
  save();famBoot();
}
async function famRemoveMember(hid,uid){   // 나가기(본인) — 마지막 한 명이면 가족방도 같이 없앰
  const {F,db}=await famReady();
  const b=F.writeBatch(db);
  const hs=await F.getDoc(F.doc(db,'households',hid));const gc=hs.exists()?(+hs.data().guestCount||0):0;
  const mm=await F.getDocs(F.query(F.collection(db,'households',hid,'memos'),F.where('by','==',uid)));
  const q1=await F.getDocs(F.query(F.collection(db,'households',hid,'requests'),F.where('from','==',uid)));
  const q2=await F.getDocs(F.query(F.collection(db,'households',hid,'requests'),F.where('to','==',uid)));
  [...mm.docs,...q1.docs,...q2.docs].slice(0,400).forEach(d=>b.delete(d.ref));   // 쓴 가족 메모 · 주고받은 요청도 같이 지움
  b.delete(famMember(F,db,hid,uid));
  b.delete(F.doc(db,'households',hid,'schedules',uid));   // 올려 둔 내 근무표도 같이 지움
  if(gc<=0)b.delete(F.doc(db,'households',hid));   // 나 혼자 남았으면 방도 없앰 (안에 남은 것은 서버가 정리)
  else b.update(F.doc(db,'households',hid),{guestCount:F.increment(-1),lastOut:uid,outBy:uid});
  await b.commit();
  if(uid===S.link?.uid){famDevKey='';famUserKey='';await F.deleteDoc(F.doc(db,'devices',uid)).catch(()=>{});await F.deleteDoc(F.doc(db,'users',uid)).catch(()=>{});}   // 나간 가족방 알림은 더 안 오게
}
// v0.96 다른 가족 빼기 (30일 넘게 안 옴 · 내가 초대하고 24시간 안 · 다수결 통과) — 그 사람의 메모 · 요청은 서버가 정리
async function famRemoveOther(uid){
  const {F,db}=await famReady();const hid=S.link.hid,me=S.link.uid;
  const b=F.writeBatch(db);
  b.delete(famMember(F,db,hid,uid));
  b.update(F.doc(db,'households',hid),{guestCount:F.increment(-1),lastOut:uid,outBy:me});
  if(famKicks[uid])b.delete(F.doc(db,'households',hid,'kicks',uid));
  await b.commit();
  delete famKicks[uid];
}
const famMs=v=>v&&typeof v.toMillis==='function'?v.toMillis():(+v||0);
const famStale=m=>!!m&&Date.now()-(famMs(m.seenAt)||famMs(m.joinedAt)||Date.now())>30*864e5;   // 30일 넘게 앱을 안 연 사람
let famKicks={},famKickSubs={};
const famKickLive=u=>{const k=famKicks[u];return k&&Date.now()<k.at+7*864e5?k:null;};
// 과반: 내보낼 사람을 뺀 나머지 중 오래 안 온 사람을 빼고, 그 절반보다 많이
const famKickNeed=(target,inact)=>Math.floor((famUi.members.filter(m=>m.uid!==target).length-inact.length)/2)+1;
function famKickInact(target){const me=S.link.uid;return famUi.members.filter(m=>m.uid!==target&&m.uid!==me&&famStale(m)).slice(0,3).map(m=>m.uid);}
async function famKickStart(uid){
  const {F,db}=await famReady();const me=S.link.uid,ref=F.doc(db,'households',S.link.hid,'kicks',uid);
  if(famKicks[uid]&&!famKickLive(uid))await F.deleteDoc(ref).catch(()=>{});   // 7일 지난 표는 지우고 새로
  const inact=famKickInact(uid);
  await F.setDoc(ref,{by:me,votes:[me],inact,at:F.serverTimestamp()});
  famKicks[uid]={by:me,votes:[me],inact,at:Date.now()};
  if(1>=famKickNeed(uid,inact)){await famRemoveOther(uid);return 'out';}   // 둘뿐이면 바로
  return 'vote';
}
async function famKickVote(uid){
  const k=famKickLive(uid);if(!k)throw new Error('내보내기 제안이 끝났어요');
  const {F,db}=await famReady();const me=S.link.uid,votes=[...k.votes,me];
  await F.updateDoc(F.doc(db,'households',S.link.hid,'kicks',uid),{votes});
  k.votes=votes;
  if(votes.length>=famKickNeed(uid,k.inact||[])){await famRemoveOther(uid);return 'out';}
  return 'vote';
}
async function famKickCancel(uid){const {F,db}=await famReady();await F.deleteDoc(F.doc(db,'households',S.link.hid,'kicks',uid));delete famKicks[uid];}
// 다른 가족마다 내보내기 표를 지켜봄 (내 것은 못 봄 → 빠진 뒤에 알게 됨)
function famKickWatch(F,db){
  if(!S.link)return;const me=S.link.uid,hid=S.link.hid,want=new Set((S.fam2.members||[]).map(m=>m.uid).filter(u=>u!==me));
  Object.keys(famKickSubs).forEach(u=>{if(!want.has(u)){try{famKickSubs[u]();}catch(e){}delete famKickSubs[u];delete famKicks[u];}});
  want.forEach(u=>{if(famKickSubs[u])return;
    famKickSubs[u]=F.onSnapshot(F.doc(db,'households',hid,'kicks',u),d=>{
      const had=famKicks[u];
      if(!d.exists()){delete famKicks[u];}
      else{const v=d.data({serverTimestamps:'estimate'})||{};famKicks[u]={by:okId(v.by)?v.by:'',votes:Array.isArray(v.votes)?v.votes.filter(okId):[],inact:Array.isArray(v.inact)?v.inact.filter(okId):[],at:famMs(v.at)||Date.now()};
        const k=famKicks[u];
        if(!had&&k.by!==me&&!k.votes.includes(me)&&famKickLive(u)){pushEvent(role(),'kick','',`🗳 ${famNameOf(k.by)}님이 ${famNameOf(u)}님 내보내기를 제안했어요 · 가족 연결에서 찬성할 수 있어요`);famSaveLocal();}}
      if(pageMode==='link')renderLinkPage();else famRefreshUi();
    },()=>{});});
}
async function famEdit(hid,uid,patch){
  const {F,db}=await famReady();
  await F.updateDoc(famMember(F,db,hid,uid),patch);
}
/* ================= 가족 근무표 (2단계) =================
 * 근무표를 올리는 사람(mode 'own') 은 자기 근무표를 households/{hid}/schedules/{uid} 에 올리고,
 * 같은 가족방 사람은 모두 읽어서 가족 탭 · 달력에서 봐요. 알람은 계속 각자 폰 안에서만 (서버와 상관없음). */
var famT=null,famUnsub=[],famBooting=false;
const famView=()=>!!(S.link&&S.link.mode==='view');   // "가족 것만 볼래요"
// 스티커 보여주기(설정에서 켠 사람만): 오늘 기준 -35일 ~ +60일, 날짜마다 "스티커번호(36진수)+횟수" 두 글자씩
// 사진 스티커: 128px 사진을 48px JPEG(약 2KB)로 줄여서 같이 올림 (비동기로 만들어 두고, 다 되면 다시 올림)
const ph48={};
function famPhoto(e){
  if(!isPhoto(e))return '';
  const id=e.slice(1);if(id in ph48)return ph48[id];
  const src=(S.icons||{})[id];if(!src)return '';
  ph48[id]='';
  const im=new Image();
  im.onload=()=>{try{const cv=document.createElement('canvas');cv.width=cv.height=48;const g=cv.getContext('2d');let u='';
      if(/^data:image\/png/.test(src)){g.drawImage(im,0,0,48,48);u=cv.toDataURL('image/png');if(u.length>4200)u='';}   // 투명 PNG 는 투명 그대로(작으면) — 크면 흰 바탕 JPEG
      if(!u){g.clearRect(0,0,48,48);g.fillStyle='#fff';g.fillRect(0,0,48,48);g.drawImage(im,0,0,48,48);u=cv.toDataURL('image/jpeg',0.7);}
      ph48[id]=u.length<=4200?u:'';famSoon();}catch(err){}};
  im.src=src;return '';
}
const stFam=x=>!!x&&(x.fam===true||(x.fam===undefined&&x.kind!=='pill'));   // 이 스티커를 가족에게 보일지: 약은 기본 안 보임 · 나머지는 기본 보임 · 스티커마다 바꿀 수 있음
const stFamShow=()=>!!(S.link&&S.link.stk&&famOthers().length>0);   // 스티커별 "가족에게 보이기" 칸은 실제 가족이 가족방에 들어와 있을 때만 나옴
function famStkPayload(){
  const defs=(S.stamps&&S.stamps.defs)||[],used=[],keyIdx={},stk={},from=addK(fmt(new Date()),-35);
  let imgs=0;
  const outOf=x=>{
    const d=x.s,V=x.v||stView(d,null);
    if(d.kind==='pill')return {i:String(d.id).slice(0,20),k:'p',t:V.N,c:String(V.col||'').slice(0,9),h:({round:'r',tab:'t',drop:'d'})[V.shape]||'c'};
    const o={i:String(d.id).slice(0,20),k:'m',e:isPhoto(d.emoji)?'⭐':String(d.emoji||'⭐').slice(0,8)};
    if(isPhoto(d.emoji)&&imgs<6){const u=famPhoto(d.emoji);if(u){o.img=u;imgs++;}}
    return o;
  };
  for(let i=0;i<=95;i++){
    const k=addK(from,i),list=stampsOn(k).filter(x=>stFam(x.s));if(!list.length)continue;
    const str=list.map(x=>{
      const key=x.s.kind==='pill'?`${x.s.id}|${x.v.col}|${x.v.N}|${x.v.shape}`:x.s.id;
      let j=keyIdx[key];
      if(j===undefined){if(used.length>=60)return '';j=used.length;keyIdx[key]=j;used.push(outOf(x));}
      return j.toString(36).padStart(2,'0')+Math.min(9,x.n||0);
    }).join('');
    if(str)stk[k]=str;
  }
  return {stk,sdefs:used,sv:2};
}
function famPayload(){
  const lo=addK(fmt(new Date()),-35),ov={};
  if(S.patOld&&S.patOld.length&&!S.noPat){for(let i=0;i<=35;i++){const d=addDays(parse(lo),i),k=fmt(d);if(k>=S.patOld[S.patOld.length-1].until)break;const b=baseShift(d);if(b!==holAdj(d,patShiftCur(d)))ov[k]=String(b);}}   // 옛 패턴이던 날(가족 앱은 새 패턴만 앎): 달라지는 날만 같이 올림
  Object.keys(S.overrides||{}).sort().forEach(k=>{if(k>=lo)ov[k]=String(S.overrides[k]);});
  {const hi=addK(fmt(new Date()),180);for(let d=parse(lo);fmt(d)<=hi;d=addDays(d,1)){const k=fmt(d);if(persOn(k))ov[k]=NONE_K;}}   // 개인 캘린더 기간은 가족에게 "근무 없음"으로
  const ks=Object.keys(ov);if(ks.length>500)ks.slice(0,ks.length-500).forEach(k=>delete ov[k]);
  return {v:1,patternName:String(S.patternName||'교대근무').slice(0,20),teamName:String(S.noPat?'':(myTeamLabel()||'')).slice(0,10),
    pattern:S.noPat?['']:S.pattern.slice(0,60).map(String),anchor:String(S.anchor),
    types:(S.types||[]).slice(0,24).map(t=>({k:String(t.k),name:String(t.name||t.k).slice(0,12),color:String(t.color||''),rest:!!t.rest})),
    overrides:ov,holRest:!!S.holRest,...(S.link&&S.link.stk?famStkPayload():{}),...(wxShare()?{wx:wxShare()}:{}),...famTimesPayload()};
}
// 내 근무 시간(근무 종류별) + ⏱ 연장으로 바꾼 날의 실제 시각(어제 ~ 60일 뒤) — 가족 탭 "몇 시 끝" · 가족 날씨용
function famTimesPayload(){
  if(!S.myset)return {};
  const tm={};workTypes().slice(0,24).forEach(t=>{const x=timesOf(t.k);tm[String(t.k)]=[x.start,x.end];});
  const ot={},lo=addK(fmt(new Date()),-1),hi=addK(fmt(new Date()),60);
  Object.keys(S.ot||{}).sort().forEach(k=>{if(k>=lo&&k<=hi&&Object.keys(ot).length<70)ot[k]=S.ot[k].slice(0,2);});
  return Object.keys(ot).length?{tm,ot}:{tm};
}
function famHash(t){let a=5381,b=52711;for(let i=0;i<t.length;i++){const c=t.charCodeAt(i);a=((a<<5)+a^c)>>>0;b=((b<<5)+b+c*31)>>>0;}return a.toString(16)+b.toString(16);}
function famSoon(){
  if(!S||!S.link||!fbCfg()||wipeBusy)return;
  clearTimeout(famT);famT=setTimeout(()=>{if(!famView())famPush().catch(famPushFail);famSyncMemos().catch(()=>{});famSyncBoard().catch(()=>{});famRegDevice().catch(()=>{});},2500);
}
async function famPush(force){
  if(!S.link||famView())return;
  const {F,db,uid}=await famReady();
  if(!S.link||famView())return;
  if(!S.myset){   // 내 근무표를 아직 안 만들었으면 올리지 않음 (앱 기본값이 가짜 근무표로 올라가는 것 방지) · 전에 올린 게 있으면 지움
    if(S.link.hash){await F.deleteDoc(F.doc(db,'households',S.link.hid,'schedules',uid)).catch(()=>{});if(S.link){S.link.hash='';try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}}
    return;
  }
  const p=famPayload(),h=famHash(JSON.stringify(p));
  if(!force&&S.link.hash===h)return;
  try{await F.setDoc(F.doc(db,'households',S.link.hid,'schedules',uid),{...p,updatedAt:F.serverTimestamp()});}
  catch(e){if(!(p.wx||p.tm||p.ot)||!/permission/i.test(String((e&&e.code)||e)))throw e;
    if(p.wx&&p.wx.h){const q0={...p,wx:{...p.wx}};delete q0.wx.h;try{await F.setDoc(F.doc(db,'households',S.link.hid,'schedules',uid),{...q0,updatedAt:F.serverTimestamp()});if(S.link){S.link.hash=h;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e2){}}return;}catch(e2){}}   // v0.134 서버 규칙이 아직 집(h)을 모르면 h 만 빼고
    const q={...p};delete q.wx;delete q.tm;delete q.ot;await F.setDoc(F.doc(db,'households',S.link.hid,'schedules',uid),{...q,updatedAt:F.serverTimestamp()});}   // 서버 규칙이 아직 옛날이면 날씨만 빼고
  if(S.link){S.link.hash=h;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
}
var famPushWarnAt=0;
// 내 근무표를 가족에게 올리지 못했을 때: 조용히 넘기지 않고 5분에 한 번 이유를 알려 줌
function famPushFail(e){
  const c=String((e&&e.code)||(e&&e.message)||e);
  if(Date.now()-famPushWarnAt<300000)return;famPushWarnAt=Date.now();
  toast(c.includes('permission-denied')?'내 근무표를 가족에게 올리지 못했어요 (권한 없음) · 설정 › 문의하기로 알려 주세요':'내 근무표를 가족에게 올리지 못했어요 · '+fbErrText(e));
}
function famStop(){famUnsub.forEach(f=>{try{f();}catch(e){}});famUnsub=[];Object.values(famKickSubs).forEach(f=>{try{f();}catch(e){}});famKickSubs={};famKicks={};}
function famClear(){famStop();clearTimeout(famT);if(S){try{piSrvToLocal();}catch(e){}S.fam2={scheds:{},members:[],memos:{},reqIn:{},reqOut:{},me:{sent:0,bonus:0},seenMemo:[],memoRev:{},reqCc:{},init:false};S.requests=(S.requests||[]).filter(r=>!r.srv);}}
function famSaveLocal(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
// v0.187 가족 소식이 여러 개 한꺼번에 와도(켠 직후 8곳) 다시 그리기는 한 번 (0.25초 모아서) · 달을 넘기는 중엔 멈춘 뒤에 → 켠 직후 넘기기가 안 씹히게
let famUiT=0;
function famRefreshUi(){clearTimeout(famUiT);famUiT=setTimeout(famRefreshUiNow,250);}
function famRefreshUiNow(){
  {const q=uiQuiet();if(q>0){clearTimeout(famUiT);famUiT=setTimeout(famRefreshUiNow,q);return;}}
  if(tab==='cal'&&(calTouch||busy||performance.now()-calLastS<300)){famUiT=setTimeout(famRefreshUiNow,200);return;}
  try{stkAskCheck();}catch(e){}
  const ae=document.activeElement;if(ae&&ae.id==='vcmsg')return;   // 요청 메시지를 쓰는 중이면 건드리지 않음
  if(pageMode==='famcal'){renderFamCalPage();return;}
  if(pageMode==='mancal'){renderManCalPage();return;}
  if(paint||vcSel.on)return;
  // 날짜 창 · 설정 · 소식 · 팝업이 열려 있어도 뒤 화면(달력 · 가족 탭)은 최신으로 (열린 창은 그대로)
  if(tab==='fam'||tab==='cal'){render();if(sheetMode==='day'&&sheetKey)markSel(sheetKey);}
}
// ---- 동기화 표시 · 근무 변경 알림 · 서버에서 직접 확인
const famSyncTxt=()=>{if(!S.link)return '';const t=S.fam2&&S.fam2.syncAt;if(!t)return '동기화 전';const m=Math.floor((Date.now()-t)/60000);return m<30?'':`${m}분 전 동기화`;};   // v0.157 평소엔 안 보임 (30분 넘게 못 받았을 때만)
const famSyncHtml=()=>S.link?`<div class="syncl" id="syncl">${famSyncTxt()}</div>`:'';
function famMarkSync(){if(!S.link||!S.fam2)return;S.fam2.syncAt=Date.now();const e=document.getElementById('syncl');if(e)e.textContent=famSyncTxt();}
setInterval(()=>{const e=document.getElementById('syncl');if(e)e.textContent=famSyncTxt();},30000);
function famApplyScheds(snap){
  const prevAll=S.fam2.scheds||{},m={};
  snap.docs.forEach(d=>{const v=d.data(),c=okId(d.id)?famCleanSched(v):null;if(c){c.updatedAt=v.updatedAt&&v.updatedAt.toMillis?v.updatedAt.toMillis():0;m[d.id]=c;}});   // 모양이 안 맞는 근무표는 버림
  if(!snap.metadata.fromCache&&S.link){
    famMarkSync();
    if(S.fam2.init)Object.keys(m).forEach(u=>{
      if(u===S.link.uid)return;const o=prevAll[u],n=m[u];
      if(!o||!n||o.updatedAt===n.updatedAt)return;   // 처음 올라온 근무표 · 안 바뀐 것은 알림 없음
      try{famSchChange(u,o,n);}catch(e){}
    });
  }
  S.fam2.scheds=m;famSaveLocal();famRefreshUi();
}
// 가족이 근무를 바꿨으면 소식 한 줄 (오늘부터 62일 안 날짜만 비교)
function famSchChange(u,o,n){
  const ch=[],t0=new Date();
  for(let i=0;i<62;i++){const d=addDays(t0,i),a=schShift(o,d),b=schShift(n,d);if(a!==b)ch.push({k:fmt(d),a,b});}
  if(!ch.length)return;
  const who=famNameOf(u),nm=x=>x||'미정';
  const text=ch.length===1?`${who}${iga(who)} ${+ch[0].k.slice(8)}일 근무를 바꿨어요 (${nm(ch[0].a)} → ${nm(ch[0].b)})`
    :ch.length===2?`${who}${iga(who)} ${+ch[0].k.slice(8)}일 · ${+ch[1].k.slice(8)}일 근무를 바꿨어요`
    :`${who}${iga(who)} 근무 ${ch.length}일을 바꿨어요`;
  pushEvent('host','sch',ch[0].k,text);S.events[0].u=u;
  const tm=famMs(n.updatedAt)||Date.now();ch.forEach(c=>chLogAdd({t:tm,k:c.k,w:who,a:'chg',f:String(c.a||''),to:String(c.b||''),rcv:Date.now()}));
}
// 실시간 연결이 멈췄을 때를 위해: 화면을 보는 동안 가끔 서버에서 직접 확인 (같은 처리 함수를 씀)
let famPollAt=0,famPolling=false;
async function famPoll(force){
  if(!S.link||!fbCfg()||famPolling||wipeBusy)return;
  if(!force&&document.visibilityState!=='visible')return;
  famPolling=true;famPollAt=Date.now();
  try{
    const {F,db}=await famReady();if(!S.link)return;
    const hid=S.link.hid,uid=S.link.uid,col=n=>F.collection(db,'households',hid,n);
    const [sc,mm,ri,ro,rc,bd]=await Promise.all([
      F.getDocs(col('schedules')),Promise.all([F.getDocs(F.query(col('memos'),F.where('to','array-contains',uid))),F.getDocs(F.query(col('memos'),F.where('by','==',uid)))]),
      F.getDocs(F.query(col('requests'),F.where('to','==',uid))),
      F.getDocs(F.query(col('requests'),F.where('from','==',uid))),
      F.getDocs(F.query(col('requests'),F.where('cc','array-contains',uid))),F.getDocs(col('board')).catch(()=>null)]);
    if(!S.link)return;
    famApplyScheds(sc);famOnMemos({docs:famMemoDocs(mm[0].docs,mm[1].docs),metadata:{fromCache:false}});famOnReqs('reqIn',ri);famOnReqs('reqOut',ro);famOnCc(rc);if(bd)famOnBoard({docs:bd.docs,metadata:{fromCache:false}});
  }catch(e){}finally{famPolling=false;}
}
setInterval(()=>{if(S&&S.link&&document.visibilityState==='visible'&&Date.now()-famPollAt>110000)famPoll();},30000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&S&&S.link)famPoll(true);});
// 가족 메모는 두 가지 목록을 합쳐서 봄: 나에게 온 것(to) + 내가 쓴 것(by, 옛 메모 포함)
const famMemoParts={to:null,by:null};
function famMemoDocs(a,b){const seen=new Set(),docs=[];[...a,...b].forEach(d=>{if(!seen.has(d.id)){seen.add(d.id);docs.push(d);}});return docs;}
function famMemoPart(key,snap){
  famMemoParts[key]={docs:snap.docs,fc:!!(snap.metadata&&snap.metadata.fromCache)};
  const a=famMemoParts.to,b=famMemoParts.by;if(!a||!b)return;
  famOnMemos({docs:famMemoDocs(a.docs,b.docs),metadata:{fromCache:a.fc||b.fc}});
}
async function famListen(){
  famStop();if(!S.link||!fbCfg())return;
  const {F,db}=await famReady();const hid=S.link.hid;
  famUnsub.push(F.onSnapshot(F.collection(db,'households',hid,'schedules'),snap=>famApplyScheds(snap),()=>{}));
  const uid=S.link.uid;
  famMemoParts.to=famMemoParts.by=null;
  const memoErr=key=>()=>famMemoPart(key,{docs:[],metadata:{fromCache:true}});
  famUnsub.push(F.onSnapshot(F.query(F.collection(db,'households',hid,'memos'),F.where('to','array-contains',uid)),snap=>famMemoPart('to',snap),memoErr('to')));   // 나에게 온 메모(내가 쓴 것 포함)
  famUnsub.push(F.onSnapshot(F.query(F.collection(db,'households',hid,'memos'),F.where('by','==',uid)),snap=>famMemoPart('by',snap),memoErr('by')));   // 내가 쓴 옛 메모(to 없음)도
  famUnsub.push(F.onSnapshot(F.query(F.collection(db,'households',hid,'requests'),F.where('to','==',uid)),snap=>famOnReqs('reqIn',snap),()=>{}));
  famUnsub.push(F.onSnapshot(F.query(F.collection(db,'households',hid,'requests'),F.where('from','==',uid)),snap=>famOnReqs('reqOut',snap),()=>{}));
  famUnsub.push(F.onSnapshot(F.query(F.collection(db,'households',hid,'requests'),F.where('cc','array-contains',uid)),snap=>famOnCc(snap),()=>{}));
  famUnsub.push(F.onSnapshot(F.collection(db,'households',hid,'board'),snap=>famOnBoard(snap),()=>{}));   // 가족 포스트잇
  famUnsub.push(F.onSnapshot(F.collection(db,'households',hid,'members'),snap=>{
    S.fam2.members=snap.docs.map(d=>famCleanMember(d.data(),d.id)).filter(Boolean);
    const me=snap.docs.find(d=>d.id===S.link.uid);if(me){const v=me.data({serverTimestamps:'estimate'});S.fam2.me={sent:+v.sent||0,bonus:+v.bonus||0,joinedAt:famMs(v.joinedAt)||(S.fam2.me&&S.fam2.me.joinedAt)||0,joinLocal:(S.fam2.me&&+S.fam2.me.joinLocal)||0,moved:+v.moved||0};}
    famKickWatch(F,db);famLoadArch().catch(()=>{});
    // 방금 들어온 가족이 있으면 옛 메모 묶음이 조금 뒤에 올라옴 → 40초 · 11분 뒤에 한 번씩 더 읽음
    if(snap.docs.some(d=>d.id!==S.link.uid&&Date.now()-famMs((d.data({serverTimestamps:'estimate'})||{}).joinedAt)<11*60e3)){
      clearTimeout(famArchT);clearTimeout(famArchT2);
      famArchT=setTimeout(()=>{if(S.fam2){S.fam2.archKey='';famLoadArch().catch(()=>{});}},40e3);
      famArchT2=setTimeout(()=>{if(S.fam2){S.fam2.archKey='';famLoadArch().catch(()=>{});}},11*60e3);
    }
    famMirrorReqs();famSaveLocal();famRefreshUi();
  },()=>{   // 가족방에서 나가졌거나 가족방이 없어짐 → 서버에 다시 물어봐서 정리
    famSync().then(r=>{if(!S.link&&r.had){famClear();toast('가족방에서 나왔어요');render();}}).catch(()=>{});
  }));
}
// ---- 구글 로그인: 지금의 익명 계정에 구글 계정을 이어 붙임 (uid 는 그대로 → 가족방 유지).
//      새 폰에서는 같은 구글 계정으로 로그인하면 같은 uid 가 되어 users/{uid} 쪽지로 가족방을 찾음
const googleOn=()=>!!(window.AndroidBridge&&typeof window.AndroidBridge.googleAvailable==='function'&&window.AndroidBridge.googleAvailable()&&fbCfg());
let gBusy=false;
function googleStart(req){
  if(gBusy)return;if(!googleOn()){toast('구글 로그인은 아직 준비 중이에요');return;}
  gBusy=true;try{window.AndroidBridge.googleSignIn(req);}catch(e){gBusy=false;toast('구글 로그인을 열지 못했어요');}
}
async function googleBackToAnon(){   // 구글 로그인으로 바뀐 로그인을 해제하고 새 익명 로그인으로 (연결하지 않을 때)
  try{await window.FB.auth.signOut(FBX.auth);}catch(e){}
  FBX.uid=null;FBX.st='idle';try{await fbConnect();}catch(e){}
}
// 구글 계정이 예전 번호(옛 폰 · 지운 앱 · 태블릿)에 붙어 있을 때: 서버가 본인 확인 뒤 예전 번호에서 구글만 뗌 (예전 데이터는 그대로)
const GUNLINK_URL=(()=>{try{const p=window.FIREBASE_CONFIG&&window.FIREBASE_CONFIG.projectId;return p?`https://asia-northeast3-${p}.cloudfunctions.net/gunlink`:'';}catch(e){return '';}})();
async function gUnlinkOld(gTok){
  if(!confirm('이 구글 계정은 이미 다른 기기(옛 폰 · 지운 앱 · 태블릿)에 연결돼 있어요.\n\n예전 연결을 풀고 이 폰에 연결할까요?'))return false;
  const call=async force=>{const t=await FBX.auth.currentUser.getIdToken();const r=await fetch(GUNLINK_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({g:gTok,force})});return r.json().catch(()=>({err:'server'}));};
  try{
    let r=await call(false);
    if(r&&r.busy){if(!confirm(`예전 연결은 아직 가족방에 "${r.name||'?'}"(${r.role==='host'?'방장':'가족'})로 들어가 있어요.\n그 기기는 구글 복원을 못 하게 돼요. 그래도 풀까요?`))return false;r=await call(true);}
    if(r&&r.ok)return true;
    toast(r&&r.err==='google'?'구글 확인을 못 했어요. 다시 해 주세요':'예전 연결을 풀지 못했어요');
  }catch(e){toast('인터넷 연결을 확인해 주세요');}
  return false;
}
window.__onGoogle=async o=>{
  if(!o||!gBusy)return;
  try{
    if(o.req==='reauth'){   // 모두 지우기 도중: 구글 계정을 지우려고 한 번 더 로그인
      const f=wipeRe;wipeRe=null;if(!f)return;
      if(o.error){f(false);return;}
      try{const A=window.FB.auth;await A.reauthenticateWithCredential(FBX.auth.currentUser,A.GoogleAuthProvider.credential(o.idToken));f(true);}catch(e){f(false);}
      return;
    }
    if(o.error){if(o.error!=='cancel')toast(o.error==='not_ready'?'구글 로그인은 아직 준비 중이에요':'구글 로그인을 하지 못했어요');return;}
    const {F}=await famReady();const A=window.FB.auth,cred=A.GoogleAuthProvider.credential(o.idToken);
    if(o.req==='link'){
      try{await A.linkWithCredential(FBX.auth.currentUser,cred);}
      catch(e){
        const c=String((e&&e.code)||'');
        if(c.includes('credential-already-in-use')||c.includes('email-already-in-use')){if(!await gUnlinkOld(o.idToken))return;await A.linkWithCredential(FBX.auth.currentUser,cred);}
        else if(!c.includes('provider-already-linked'))throw e;
      }
      S.gAcct=String(o.email||'').slice(0,80)||'연결됨';famRegUser(true).catch(()=>{});save();toast('구글 계정에 연결했어요');
      if(pageMode==='link')renderLinkPage();
    }else if(o.req==='restore'){
      if(S.link){toast('이미 가족방에 들어가 있어요');return;}
      await A.signInWithCredential(FBX.auth,cred);
      FBX.uid=FBX.auth.currentUser.uid;
      const us=await F.getDoc(F.doc(FBX.db,'users',FBX.uid));
      const hid=us.exists()?String(us.data().hid||''):'';
      if(!hid){toast('이 구글 계정에 연결된 가족방이 없어요');await googleBackToAnon();return;}
      // 어느 방인지 보여 주고 확인 (옛 폰 · 태블릿의 방에 붙는 일이 있어서): 방장 · 가족 이름 · 만든 날
      let desc='';
      try{const ms=await F.getDocs(F.collection(FBX.db,'households',hid,'members'));const hs=await F.getDoc(F.doc(FBX.db,'households',hid));
        const names=ms.docs.map(d=>{const v=d.data();return `${v.role==='host'?'방장 ':''}${v.name||'?'}`;});
        const mine=ms.docs.find(d=>d.id===FBX.uid),mv=mine?mine.data():null;   // 이 구글 계정이 그 방에서 누구인지 (예: 태블릿 · 가족)
        if(mv)names.push(`\n→ 이 구글 계정은 이 방에 "${mv.name||'?'}"(${mv.role==='host'?'방장':'가족'})로 들어가 있어요${mv.role!=='host'&&S.linkLost&&S.linkLost.role==='host'?'\n⚠️ 이 폰이 방장이었다면, 돌아가도 방장이 아니라 "'+(mv.name||'가족')+'"(으)로 들어가요. 새 가족방을 만드는 게 나아요':''}`);
        const ct=hs.exists()&&hs.data().createdAt&&hs.data().createdAt.toMillis?new Date(hs.data().createdAt.toMillis()):null;
        desc=`${names.join(' · ')||'구성원 없음'}${ct?`\n만든 날: ${ct.getFullYear()}.${ct.getMonth()+1}.${ct.getDate()}`:''}`;}catch(e){desc='(방 정보를 읽지 못했어요)';}
      if(!confirm(`이 구글 계정에 연결된 가족방이에요.\n\n${desc}\n\n이 방으로 돌아갈까요?\n(아니요 → 연결하지 않고, 새 가족방을 만들거나 새 초대 코드로 참여할 수 있어요)`)){await googleBackToAnon();toast('연결하지 않았어요');return;}
      S.link={hid,role:'guest',name:'',perm:'write',mode:'own',uid:FBX.uid,hash:''};
      const r=await famSync();
      if(!r.link){toast('가족방을 찾지 못했어요 (이미 없어졌을 수 있어요)');return;}
      S.gAcct=String(o.email||'').slice(0,80)||'연결됨';save();famBoot();
      if(pageMode==='link')openLinkPage();
      toast('가족방을 불러왔어요 · 내 근무표는 설정 › 백업에서 불러오세요');
    }
  }catch(e){toast(famErr(e));}
  finally{gBusy=false;}
};
// 내 가족방 번호 쪽지 (users/내uid) — 새 폰에서 찾는 용도
let famUserKey='';
async function famRegUser(force){
  if(!S.link||!fbCfg()||wipeBusy)return;
  const key=S.link.hid+'|'+S.link.uid;if(!force&&famUserKey===key)return;
  const {F,db}=await famReady();if(!S.link)return;
  await F.setDoc(F.doc(db,'users',S.link.uid),{hid:S.link.hid,updatedAt:F.serverTimestamp()});
  famUserKey=key;
}
// ---- v0.150 내 번호 (관리자가 무료 건수를 줄 때 찾는 번호) · 받은 무료 건수 · 관리자 화면
const MYC_AB='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function myCode(uid){uid=String(uid||'');if(!uid)return '';let a=0x811c9dc5,b=0x1234567;for(let i=0;i<uid.length;i++){const c=uid.charCodeAt(i);a=Math.imul(a^c,16777619)>>>0;b=Math.imul(b^c,2246822519)>>>0;}let t='';for(let i=0;i<6;i++)t+=MYC_AB[(i<3?a>>>(i*10):b>>>((i-3)*10))&31];return t.slice(0,3)+'-'+t.slice(3);}
let famCodeKey='';
async function famRegCode(){   // codes/{번호} = {uid, 이름, 가족방, 마지막 접속} — 관리자만 읽음 · 하루 한 번
  if(!S.link||!fbCfg()||wipeBusy)return;
  const uid=S.link.uid,code=myCode(uid),key=[uid,S.link.hid,S.link.name||'',fmt(new Date())].join('|');
  if(!code||famCodeKey===key)return;
  const {F,db}=await famReady();if(!S.link)return;
  await F.setDoc(F.doc(db,'codes',code),{uid,name:String(S.link.name||'').slice(0,12),hid:String(S.link.hid).slice(0,128),at:F.serverTimestamp()});
  famCodeKey=key;
}
let famBx={me:0,all:0,vip:false,noAds:false};
async function famBonusLoad(){   // 관리자가 준 무료 건수: bonus/{내 uid} · bonus/_all (모두에게)
  if(!S.link||!fbCfg())return;
  const {F,db}=await famReady();if(!S.link)return;
  const g=async id=>{try{const d=await F.getDoc(F.doc(db,'bonus',id));return d.exists()?d.data():{};}catch(e){return {};}};
  const me=await g(S.link.uid),all=await g('_all'),nn=v=>Math.max(0,Math.round(+v.n)||0);
  famBx={me:nn(me),all:nn(all),vip:me.vip===true,noAds:me.noAds===true||me.vip===true};if(pageMode==='info')openInfoPage();   // v0.229 무제한 · 광고 없음 (광고는 아직 없음 · 붙일 때 이 값으로 숨김)
}
let admOk=null,adm=null;
async function admCheck(){   // 관리자 계정만 bonusLog 를 읽을 수 있음 → 읽히면 관리자 (앱에 메일 주소를 넣지 않음)
  if(admOk!==null||!S.link||!fbCfg())return;   // v0.152 구글 연결이 아니어도 (규칙이 계정 번호로도 관리자 확인)
  try{const {F,db}=await famReady();await F.getDocs(F.query(F.collection(db,'bonusLog'),F.limit(1)));admOk=true;}catch(e){admOk=false;}
  if(admOk&&pageMode==='info')openInfoPage();
}
const admDay=t=>{try{const d=t&&t.toDate?t.toDate():null;return d?`${d.getMonth()+1}/${d.getDate()}`:'';}catch(e){return '';}};
async function admLoad(){
  const {F,db}=await famReady();
  const [cs,ls,bs]=await Promise.all([F.getDocs(F.collection(db,'codes')),F.getDocs(F.query(F.collection(db,'bonusLog'),F.orderBy('at','desc'),F.limit(20))),F.getDocs(F.collection(db,'bonus'))]);
  adm.codes=cs.docs.map(d=>Object.assign({code:d.id},d.data()));
  adm.log=ls.docs.map(d=>d.data());
  adm.given=bs.docs.map(d=>{const v=d.data(),c=adm.codes.find(x=>x.uid===d.id);return {uid:d.id,n:Math.max(0,Math.round(+v.n)||0),vip:v.vip===true,noAds:v.noAds===true,name:v.name||(c&&c.name)||'',code:v.code||(c&&c.code)||''};});
}
function admFind(){
  const q=String(adm.q||'').trim();if(!q||!adm.codes)return [];
  const qc=q.toUpperCase().replace(/[^0-9A-Z]/g,'');
  return adm.codes.filter(c=>(qc.length>=3&&c.code.replace('-','').includes(qc))||String(c.name||'').includes(q)).slice(0,30);
}
function admRowHtml(c){
  const fam=adm.codes.filter(x=>x.hid&&x.hid===c.hid&&x.uid!==c.uid).map(x=>x.name||'?');
  return `<div class="prow tap" data-act="adm-pick" data-c="${esc(c.code)}"><div class="pl2">${esc(c.name||'?')} · ${esc(c.code)}<small class="keep">${[fam.length?esc(fam.join(' · ')):'가족 없음',admDay(c.at)].filter(Boolean).join(' · ')}</small></div></div>`;
}
// v0.229 관리자: 준 사람 목록(무료 건수 · 무제한 · 광고 없음) · 눌러서 주기/빼기 · 스위치
const admTags=g=>[g.n?`+${g.n}건`:'',g.vip?'무제한':'',g.noAds?'광고 없음':''].filter(Boolean).join(' · ');
const admCur=()=>adm.sel&&(adm.given||[]).find(g=>g.uid===adm.sel.uid)||{n:0,vip:false,noAds:false};
function openAdmPage(){
  if(!adm)adm={q:'',sel:null,codes:null,log:null,given:null,busy:false};
  pageBack=openInfoPage;
  const res=adm.sel?[]:admFind(),all=adm.sel&&adm.sel.uid==='_all',cur=admCur();
  const given=(adm.given||[]).filter(g=>g.uid!=='_all'&&(g.n||g.vip||g.noAds)),allG=(adm.given||[]).find(g=>g.uid==='_all');
  const sw=(id,on)=>`<label class="sw"><input type="checkbox" id="${id}" ${on?'checked':''}><i></i></label>`;
  openPage(`${pageHead('관리자')}<div class="pg-b np">
    ${adm.sel?`<div class="pg-cap">고른 사람</div>
    <div class="pg-sec"><div class="prow"><div class="pl2">${all?'모두에게':`${esc(adm.sel.name||'?')} · ${esc(adm.sel.code||'')}`}<small class="keep">${admTags(cur)||'받은 것 없음'}</small></div><button class="xbtn" data-act="adm-clear" aria-label="다시 고르기">✕</button></div>
      <div class="prow"><input type="number" id="admN" class="inl" inputmode="numeric" min="1" max="10000" placeholder="건수" style="flex:1;text-align:left"><button class="tbtn" data-act="adm-sub" style="margin-left:8px">빼기</button><button class="btn" data-act="adm-give" style="margin-left:8px">주기</button></div>
      ${all?'':`<div class="prow"><div class="pl2">무제한</div>${sw('admVip',cur.vip)}</div><div class="prow"><div class="pl2">광고 없음</div>${sw('admNoAds',cur.noAds||cur.vip)}</div>`}
    </div>`:`<div class="pg-cap">받는 사람 찾기</div>
    <div class="pg-sec"><div class="prow"><input type="text" id="admQ" class="inl" style="flex:1;text-align:left" placeholder="번호 또는 이름" value="${esc(adm.q)}" enterkeyhint="search"><button class="tbtn" data-act="adm-find">찾기</button></div>${adm.codes===null?'':res.map(admRowHtml).join('')||(adm.q?'<div class="prow"><div class="pl2">찾은 게 없어요</div></div>':'')}
      <div class="prow tap" data-act="adm-all"><div class="pl2">모두에게${allG&&allG.n?`<small class="keep">+${allG.n}건</small>`:''}</div><span class="muted">›</span></div></div>
    <div class="pg-cap">준 사람 <span class="cnt2">${given.length}</span></div>
    <div class="pg-sec">${adm.given===null?'<div class="prow"><div class="pl2">불러오는 중…</div></div>':given.length?given.map(g=>`<div class="prow tap" data-act="adm-who" data-u="${esc(g.uid)}"><div class="pl2">${esc(g.name||'?')}${g.code?` · ${esc(g.code)}`:''}<small class="keep">${admTags(g)}</small></div><span class="muted">›</span></div>`).join(''):'<div class="prow"><div class="pl2">아직 없어요</div></div>'}</div>`}
    <div class="pg-cap">최근 기록</div>
    <div class="pg-sec">${adm.log===null?'<div class="prow"><div class="pl2">불러오는 중…</div></div>':adm.log.length?adm.log.map(l=>`<div class="prow"><div class="pl2">${l.what?esc(l.what):`${+l.n>0?'+':''}${+l.n||0}건`} · ${l.to==='_all'?'모두':`${esc(l.name||'?')} · ${esc(l.code||'')}`}</div><div class="pv npv">${admDay(l.at)}</div></div>`).join(''):'<div class="prow"><div class="pl2">아직 기록이 없어요</div></div>'}</div>
  </div>`,'adm');
  if(adm.codes===null&&!adm.busy){adm.busy=true;admLoad().then(()=>{adm.busy=false;if(pageMode==='adm')openAdmPage();}).catch(e=>{adm.busy=false;adm.log=[];adm.given=[];toast(famErr(e));if(pageMode==='adm')openAdmPage();});}
}
// 바꾸기 한 번: bonus/{uid} 를 새 값으로 (다 비면 지움 → 목록에서 빠짐) + 기록
async function admApply(next,logN,what,msg){
  const sel=adm.sel;if(!sel)return;
  try{
    const {F,db}=await famReady(),id=sel.uid,b=F.writeBatch(db),ref=F.doc(db,'bonus',id);
    const keep=next.n>0||next.vip||next.noAds||id==='_all';
    if(keep)b.set(ref,{n:next.n,vip:!!next.vip,noAds:!!next.noAds,name:String(sel.name||'').slice(0,12),code:String(sel.code||'').slice(0,12),at:F.serverTimestamp()});else b.delete(ref);
    b.set(F.doc(F.collection(db,'bonusLog')),{to:id,name:id==='_all'?'':String(sel.name||'').slice(0,12),code:id==='_all'?'':String(sel.code||'').slice(0,12),n:logN,...(what?{what}:{}),at:F.serverTimestamp()});
    await b.commit();toast(msg);
    const g=(adm.given||[]).find(x=>x.uid===id);if(g)Object.assign(g,next);else (adm.given=adm.given||[]).push({uid:id,name:sel.name||'',code:sel.code||'',...next});
    adm.log=null;adm.codes=null;openAdmPage();
  }catch(e){toast(famErr(e));openAdmPage();}
}
async function admGive(sub){
  const n=Math.round(+($('#admN')||{}).value||0);
  if(!(n>0&&n<=10000)){toast('건수를 넣어 주세요');return;}
  if(!adm.sel){toast('받는 사람을 골라 주세요');return;}
  const cur=admCur(),who=adm.sel.uid==='_all'?'모두':`${adm.sel.name||'?'} (${adm.sel.code||''})`;
  if(sub){const k=Math.min(n,cur.n);if(!k){toast('뺄 건수가 없어요');return;}if(!confirm(`${who}에게서 ${k}건을 뺄까요?`))return;admApply({...cur,n:cur.n-k},-k,'',`${k}건 뺐어요`);return;}
  if(!confirm(`${who}에게 무료 ${n}건을 줄까요?`))return;
  admApply({...cur,n:cur.n+n},n,'',`${n}건 줬어요`);
}
function admToggle(key,on){
  const cur=admCur(),next={...cur,[key]:on};if(key==='vip'&&on)next.noAds=true;
  admApply(next,0,`${key==='vip'?'무제한':'광고 없음'} ${on?'켬':'끔'}`,`${key==='vip'?'무제한':'광고 없음'}을 ${on?'켰어요':'껐어요'}`);
}
function googleRow(){
  if(!googleOn())return '';
  if(S.gAcct)return `<div class="pg-sec" style="margin-top:16px"><div class="prow"><div class="pl2">구글 계정에 연결됨<small class="keep">${S.link&&S.link.role==='host'?'방장 폰 · ':''}${esc(S.gAcct)}</small></div><span class="muted">✓</span></div></div>`;
  const host=!!(S.link&&S.link.role==='host');
  if(host)return `<div class="pg-sec gwarn" style="margin-top:16px"><div class="prow tap" data-act="g-link"><div class="pl2">⚠️ 구글 계정 연결 안 됨<small class="keep">방장 권한을 잃을 수 있어요</small></div><span class="gwbtn">연결하기</span></div></div>`;
  return `<div class="pg-sec" style="margin-top:16px"><div class="prow tap" data-act="g-link"><div class="pl2">구글 계정으로 가족방 지키기<small>방장 폰에 먼저 연결하세요 · 구글 계정 하나는 기기 하나에만 연결돼요</small></div><span class="muted">›</span></div></div>`;
}
// ---- 푸시 알림: 이 폰의 알림 주소를 서버(devices/내uid)에 등록 → 서버 함수가 가족 일이 생기면 알려 줌
const pushBridge=()=>!!(window.AndroidBridge&&typeof window.AndroidBridge.fcmToken==='function');
let famDevKey='';
async function famRegDevice(){
  if(!S.link||!fbCfg()||!pushBridge()||wipeBusy)return;
  const tk=String(window.AndroidBridge.fcmToken()||'');if(tk.length<20)return;
  const on=S.pushOn!==false;
  // 자는 시간(앞으로 2주): 서버가 이 안에서는 소리 · 진동 없는 알림 통로로 보냄 [시작,끝,시작,끝…] (밀리초)
  const t0=new Date(),now=Date.now();
  const quiet=[];
  if(S.pushQuiet!==false)sleepWins(new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()),15).forEach(w=>{if(w[1]>now&&quiet.length<60)quiet.push(w[0],w[1]);});
  const mute=S.pushBoard===false?['board']:[];   // 끈 알림 종류 (포스트잇)
  const key=tk+'|'+S.link.hid+'|'+on+'|'+quiet.join(',')+'|'+mute.join(',');
  if(famDevKey===key)return;
  const {F,db}=await famReady();if(!S.link)return;
  await F.setDoc(F.doc(db,'devices',S.link.uid),{token:tk,on,hid:S.link.hid,quiet,mute,updatedAt:F.serverTimestamp()});
  famDevKey=key;
}
window.__onFcm=()=>{famRegDevice().catch(()=>{});};
// 알림을 눌러서 앱이 열림 → 그 날짜의 달력으로 (날짜 없으면 가족 탭)
window.__onPush=o=>{
  if(!o||typeof o!=='object')return;
  try{if(pageMode)closePage();closeSheet();closePop();}catch(e){}
  const bmk=o.type==='board'?(/^\d{4}-\d\d$/.test(o.mk||'')?o.mk:/^\d{4}-\d\d/.test(o.date||'')?String(o.date).slice(0,7):''):'';
  if(bmk){const [y,m]=bmk.split('-').map(Number);tab='cal';setCur(y,m-1);if(famView()){vcY=y;vcM=m-1;}render();openBoard();}   // 포스트잇 알림 → 그 달 포스트잇
  else if(o.type==='kick'||o.type==='out'){tab='fam';render();openLinkPage();}   // 내보내기 제안 · 내보내짐 → 가족 연결
  else if(/^\d{4}-\d{2}-\d{2}$/.test(o.date||'')){const d=parse(o.date);tab='cal';setCur(d.getFullYear(),d.getMonth());render();if(o.type==='stk')openStampDay(o.date);else openDay(o.date);}
  else{tab='fam';render();}
  famBoot();famPoll(true);
};
function pushRow(){
  if(!S.link||!pushBridge())return '';
  const off=typeof window.AndroidBridge.notifEnabled==='function'&&!window.AndroidBridge.notifEnabled();
  return `<div class="pg-sec" style="margin-top:16px"><div class="prow"><div class="pl2">가족 알림 받기<small>내용은 빼고 이름 · 날짜(포스트잇은 제목)만 알려줘요</small></div><label class="sw"><input type="checkbox" id="famPushOn" ${S.pushOn!==false?'checked':''}><i></i></label></div>${S.pushOn!==false?`<div class="prow"><div class="pl2">포스트잇 알림<small>가족이 새로 붙이거나 · 줄을 더하거나 · 할 일이 다 끝나면</small></div><label class="sw"><input type="checkbox" id="famPushBoard" ${S.pushBoard!==false?'checked':''}><i></i></label></div>`:''}${S.pushOn!==false?`<div class="prow"><div class="pl2">자는 시간엔 소리 없이<small>자는 시간 알림은 소리 없이 쌓여요</small></div><label class="sw"><input type="checkbox" id="famPushQuiet" ${S.pushQuiet!==false?'checked':''}><i></i></label></div>`:''}${off?'<div class="hint keep" style="padding:6px 16px 10px;color:#e5484d">폰 설정에서 이 앱의 알림이 꺼져 있어요. 폰 설정 › 앱 › 언제쉬어 › 알림을 켜 주세요.</div>':''}</div>`;
}
// 하루에 한 번 "나 여기 있어요": 내 구성원 문서 seenAt (30일 넘게 안 온 사람 정리 · 다수결 계산) · 처음 만든 사람은 옛 앱 가족을 위해 hostSeen 도
async function famHostSeen(){
  if(!S.link)return;
  if(Date.now()-(S.hostSeenAt||0)<20*36e5)return;
  const {F,db}=await famReady();
  await F.updateDoc(famMember(F,db,S.link.hid,S.link.uid),{seenAt:F.serverTimestamp()});
  if(S.link.role==='host')await F.updateDoc(F.doc(db,'households',S.link.hid),{hostSeen:F.serverTimestamp()}).catch(()=>{});
  S.hostSeenAt=Date.now();save();
}
// v0.152 앱에는 "구글 계정에 연결됨"인데 서버 계정은 구글 연결이 없을 때 (예전 계정에 붙어 있던 표시가 남음) → 표시 지우기
function famGAcctFix(){try{const u=FBX.auth&&FBX.auth.currentUser;if(!u)return;const g=(u.providerData||[]).find(p=>p&&p.providerId==='google.com');   // 앱 상태를 실제 연결에 맞춤 (연결돼 있으면 이메일 보이기)
  if(S.gAcct&&!g){S.gAcct='';save();}else if(!S.gAcct&&g){S.gAcct=String(g.email||u.email||'').slice(0,80)||'연결됨';save();}}catch(e){}}
async function famBoot(){
  if(!fbCfg()||!S.link||famBooting||wipeBusy)return;famBooting=true;
  try{await famSync();famGAcctFix();if(S.link)setTimeout(gWarnPop,1800);if(S.link){await famListen();if(!famView())famPush().catch(famPushFail);famSyncMemos().catch(()=>{});famRegDevice().catch(()=>{});famRegUser().catch(()=>{});famRegCode().catch(()=>{});famBonusLoad().catch(()=>{});famHostSeen().catch(()=>{});}else famClear();}
  catch(e){}finally{famBooting=false;}
}
// 가족이 "내 근무표 올리기 / 가족 것만 볼래요"를 바꿀 때
function famSetStk(on){
  if(!S.link)return;
  if(on){openCfm({type:'stk'});return;}
  S.link.stk=false;save();toast('스티커는 가족에게 안 보여요');
}
const stkRow=()=>`<div class="prow"><div class="pl2">내 스티커도 가족에게 보여요</div><label class="sw"><input type="checkbox" id="famStk" ${S.link&&S.link.stk?'checked':''}><i></i></label></div>`;
async function famSetMode(mode){
  if(!S.link||S.link.role==='host')return;
  try{
    const {F,db,uid}=await famReady();
    await F.updateDoc(famMember(F,db,S.link.hid,uid),{mode});
    S.link.mode=mode;save();
    if(mode==='own'){if(S.myset)await famPush(true);}else{await F.deleteDoc(F.doc(db,'households',S.link.hid,'schedules',uid)).catch(()=>{});S.link.hash='';save();}
    toast(mode==='own'?(S.myset?'내 근무표를 가족에게 보여줘요':'내 근무표를 만들면 가족에게 보여줘요'):'가족 근무표만 볼게요');
    if(mode==='own'&&!S.myset)startOnboarding({entry:'later'});
  }catch(e){toast('바꾸지 못했어요. '+famErr(e));}
  if(pageMode==='link')famRefresh();render();
}
/* ---- 서버에서 받은 근무표 계산 ---- */
const schType=(sch,k)=>k===''?BLANK_T:((sch.types||[]).find(t=>t.k===k)||{k,name:k,color:'#cfd8dc',rest:false});
const schRest=(sch,k)=>k===NONE_K||!!schType(sch,k).rest;
function schShift(sch,d){
  const k=fmt(d),o=sch.overrides&&sch.overrides[k];if(o)return o;
  const n=sch.pattern.length,i=((dayNum(d)-dayNum(parse(sch.anchor)))%n+n)%n,b=sch.pattern[i];
  if(sch.holRest&&!schRest(sch,b)&&holName(k))return ((sch.types||[]).find(t=>t.rest)||{k:'휴'}).k;
  return b;
}
// 가족이 올린 스티커 (그 날짜): [{d:스티커 종류, n:한 횟수}]
function schStk(sch,k){
  const str=sch.stk&&sch.stk[k];if(typeof str!=='string')return [];
  const defs=Array.isArray(sch.sdefs)?sch.sdefs:[],out=[],w=sch.sv===2?3:2;   // 새 형식(sv 2): 종류 번호 두 글자 + 횟수 한 글자
  for(let i=0;i+w-1<str.length;i+=w){const d=defs[parseInt(str.slice(i,i+w-1),36)];if(d&&typeof d==='object')out.push({d,n:+str[i+w-1]||0});}
  return out;
}
const stampIconD=(d,n,px)=>d.k==='p'?pillSvg(d.t,n,px,d.c,({r:'round',t:'tab',d:'drop'})[d.h]||'caps'):`<span class="se ${n?'':'plan'}" style="font-size:${(px||14)-2}px">${typeof d.img==='string'&&FAM_IMG.test(d.img)?`<img class="ico" src="${d.img}" alt="">`:esc(d.e||'⭐')}</span>`;
function schBadge(sch,k,extra,inner){
  if(k===NONE_K)return noneBadge(extra,inner);
  if(k==='')return `<span class="badge r ${extra||''} blankb">·${inner||''}</span>`;
  const t=schType(sch,k),c=tColors(t),two=String(k).length>2?' two three':String(k).length>1?' two':'';
  if(!c)return `<span class="badge r${two} ${extra||''}">${esc(k)}${inner||''}</span>`;
  return `<span class="badge c${two} ${extra||''}" style="--tb:${c.bg};--tf:${c.fg}">${esc(k)}${inner||''}</span>`;
}
// 나 말고 근무표를 올린 가족 (가족 탭 · 달력 보기에 쓰는 가짜 구성원)
function famPeers(){
  const L=S.link;if(!L||!S.fam2)return [];
  const sc=S.fam2.scheds||{};
  return (S.fam2.members||[]).filter(m=>m.uid!==L.uid&&sc[m.uid]&&Array.isArray(sc[m.uid].pattern)&&sc[m.uid].pattern.length&&typeof sc[m.uid].anchor==='string')
    .map((m,i)=>({id:'u_'+m.uid,uid:m.uid,name:famAka(m.uid,m.name||'가족'),kind:'sched',sch:sc[m.uid],color:FAM_COL[(i+1)%6]}));
}
/* ---- 가족 달력 (보기만): "가족 것만 볼래요"는 달력 탭에, 나머지는 가족 탭에서 눌러서 열림 ---- */
var vcUid='',vcY=0,vcM=0;
var vcSel={on:false,uid:'',want:'',dates:new Set(),msg:''},vcAnim=0,vsDrag=null;   // 여러 날 요청 고르기 · 달 넘김 효과
function vcEnsure(){
  const ps=famPeers();if(!ps.length)return null;
  if(!ps.some(p=>p.uid===vcUid))vcUid=ps[0].uid;
  if(vcSel.on&&vcSel.uid!==vcUid){vcSel.on=false;vcSel.dates=new Set();}   // 다른 사람 달력으로 가면 고른 날 취소
  if(!vcY){const n=new Date();vcY=n.getFullYear();vcM=n.getMonth();}
  return ps.find(p=>p.uid===vcUid);
}
// 가족 달력 칸 · 날짜 화면에도 가족 메모(♥)를 보여줘요 (가족 메모는 사람이 아니라 날짜에 붙어요)
function vcPills(k,mx){
  const pl=visibleMemos(k).filter(x=>x.shared).map(x=>`<div class="pl fam">${linkify(firstLine(x.text))}</div>`);
  if(pl.length>mx)pl.splice(0,pl.length,...capPills(pl,mx));
  return pl.length?`<div class="pill-wrap${pl.length>=mx?' full':''}">${pl.join('')}</div>`:'';
}
var vcMemoEdit='',vcMemoEditK='';
function vcMemoHtml(k){
  const ms=visibleMemos(k).filter(x=>x.shared);
  if(vcMemoEditK!==k){vcMemoEdit='';vcMemoEditK=k;}
  const list=ms.map(m=>{
    const mine=m.by===role()&&!String(m.id).startsWith('s:');   // 내가 쓴 가족 메모는 여기서도 고치고 지울 수 있어요
    if(mine&&vcMemoEdit===m.id)return `<div class="mcard fam"><div class="mt2" style="width:100%"><input type="text" id="vcmedit" maxlength="200" value="${esc(m.text)}" style="width:100%"><div class="vcm-btns"><button class="btn sm ghost" data-act="vc-memo-cancel" data-k="${k}">취소</button><button class="btn sm" data-act="vc-memo-save" data-k="${k}" data-mid="${m.id}">저장</button></div></div></div>`;
    return `<div class="mcard fam"><div class="mt2"><span class="tx">${linkify(m.text,{click:true,fam:m.by!==role()})}</span><div class="meta"><span class="who ${m.by===role()?'me':''}">${esc(whoName(m.by))}</span> · ${rel(m.t)}</div></div>${mine?`<span class="vcm-act"><button data-act="vc-memo-edit" data-k="${k}" data-mid="${m.id}" aria-label="고치기">✎</button><button data-act="vc-memo-del" data-k="${k}" data-mid="${m.id}" aria-label="지우기">🗑</button></span>`:''}</div>`;
  }).join('');
  return `<div class="sec-t vcmt">가족 메모</div>${list}
    <div class="vcmemo-bar"><input type="text" id="vcmemo" maxlength="200" placeholder="가족에게 남길 메모" enterkeyhint="send"><button class="send fam" data-act="vc-memo-send" data-k="${k}" aria-label="보내기">${ICON.send}</button><span class="flab">가족에게 남길 메모</span></div>
    ${famRemain()<=3?`<div class="usage-hint" style="margin-top:4px">${famRemTxt()} · 가족 모두에게 보이고 알림이 가요</div>`:''}`;
}
function vcGrid(p){
  const sch=p.sch,y=vcY,m=vcM,first=new Date(y,m,1),lead=leadOf(first),days=new Date(y,m+1,0).getDate(),rows=Math.ceil((lead+days)/7),start=addDays(first,-lead),tk=fmt(new Date());
  let cells='';const mxl=memoLines();
  for(let i=0;i<rows*7;i++){
    const d=addDays(start,i),k=fmt(d),sh=schShift(sch,d),hol=holName(k),dow=d.getDay();
    const ps=schShift(sch,addDays(d,-1)),ns=schShift(sch,addDays(d,1)),c=tColors(schType(sch,sh));
    const band=c&&!schRest(sch,sh)&&(ps===sh||ns===sh)?`<i class="band ${ps===sh?'jl':''} ${ns===sh?'jr':''}" style="--tb:${c.bg}"></i>`:'';
    const ov=sch.overrides&&sch.overrides[k]&&sch.overrides[k]!==NONE_K;
    const pls=vcPills(k,mxl);
    const ring=rqRing(S.requests.filter(r=>r.srv&&r.dir==='out'&&r.peer===p.uid&&r.date===k).map(r=>r.st==='applied'?{...r,st:'accepted'}:r));
    const st0=schStk(sch,k),below=!!hol&&st0.length>=2&&!holBeside(),hone=hol&&st0.length&&!below?holOne(hol):'',stRow=st0.slice(0,2),stMore=st0.slice(2);
    const cb=c?` style="--cb:${c.bg}"`:'';   // v0.238 쉬는 근무도 색을 정했으면 칸 채우기 (내 달력과 같게 · 연차 색이 가족 폰에서 안 보이던 것)
    cells+=`<div class="cell ${d.getMonth()===m?'':'out'} ${k===tk?'today':''} ${stMore.length?'m3':''} ${ring} ${vsCls(p,k)}" data-act="vc-day" data-k="${k}"${cb}><div class="dn ${hol?'hol':''} ${hol||dow===0?'sun':dow===6?'sat':''} ${hone?'h1r':''}"><span class="num">${d.getDate()}</span>${hone?`<span class="h1">${esc(hone)}</span>`:''}${stRow.length?`<span class="stp">${stRow.map(x=>stampIconD(x.d,x.n,hone?12:13)).join('')}</span>`:''}${!st0.length&&hol&&shortHol(hol)?`<span class="hn ${shortHol(hol).length>3?'sm':''}">${esc(shortHol(hol))}</span>`:''}</div>${below?`<i class="hnb" data-o="${esc(holOne(hol))}">${esc(holTwo(hol))}</i>`:''}${stMore.length?`<div class="s2">${stMore.map(x=>stampIconD(x.d,x.n,12)).join('')}</div>`:''}<div class="bwrap">${band}${sh===''?'':schBadge(sch,sh,'',ov?'<i class="dot"></i>':'')}</div>${pls}</div>`;
  }
  return `<div class="calwrap"><div class="dow">${dowHead()}</div><div class="grid" style="grid-template-rows:repeat(${rows},1fr)">${cells}</div></div>`;
}
const vcChips=()=>{const ps=famPeers();return ps.length>1?`<div class="vcchips">${ps.map(x=>`<button class="${x.uid===vcUid?'on':''}" data-act="vc-pick" data-u="${esc(x.uid)}">${esc(x.name)} 달력</button>`).join('')}</div>`:'';};
const vcRest=p=>((p.sch.types||[]).find(x=>x.rest)||{k:'휴'}).k;
const vcTools=()=>{
  const ps=famPeers();
  const chips=ps.length>1?ps.map(x=>`<button class="${x.uid===vcUid?'on':''}" data-act="vc-pick" data-u="${esc(x.uid)}">${esc(x.name)} 달력</button>`).join(''):'';
  return chips?`<div class="vcchips">${chips}</div>`:'';
};
// 여러 날 요청: 고를 수 있는 날 = 오늘 이후 · 지금 그 근무가 아님 · 진행 중인 요청이 없음
function vsOk(p,k){
  if(k<fmt(new Date()))return false;
  if(schShift(p.sch,parse(k))===vcSel.want)return false;
  return !S.requests.some(r=>r.srv&&r.dir==='out'&&r.peer===p.uid&&r.date===k&&(r.st==='pending'||r.st==='accepted'));
}
const vsCls=(p,k)=>vcSel.on?(vcSel.dates.has(k)?'vsel':(vsOk(p,k)?'':'vdis')):'';
function vsText(){   // 10월 3일 · 11월 2일 (총 5일)
  const ds=[...vcSel.dates].sort();if(!ds.length)return '날짜를 눌러서 · 쭉 밀어서 골라요';
  const by={};ds.forEach(k=>{const m=+k.slice(5,7);by[m]=(by[m]||0)+1;});
  const ms=Object.keys(by);return ms.map(m=>`${m}월 ${by[m]}일`).join(' · ')+(ms.length>1?` (총 ${ds.length}일)`:' 선택');
}
function vsBar(){const n=vcSel.dates.size,e=document.getElementById('vsN'),b=document.getElementById('vsGo');if(e)e.textContent=vsText();if(b)b.disabled=!n;}
function vsSet(k,on){
  if(on){if(vcSel.dates.size>=14&&!vcSel.dates.has(k)){toast('한 번에 14일까지예요');return;}vcSel.dates.add(k);}else vcSel.dates.delete(k);
  const c=document.querySelector(`#vcsl .cell[data-k="${k}"]`);if(c)c.classList.toggle('vsel',on);
  vsBar();
}
function vcSelBar(p){
  if(!vcSel.on)return '';
  const types=(p.sch.types||[]).slice(0,5),n=vcSel.dates.size;
  return `<div class="vsbar">
    <div class="seg">${types.map(x=>`<button class="${vcSel.want===x.k?'on':''}" data-act="vc-ms-want" data-s="${esc(x.k)}">${schBadge(p.sch,x.k,'sm')}${esc(x.name)}</button>`).join('')}</div>
    <input id="vcmsg" maxlength="60" placeholder="메시지 (선택)" value="${esc(vcSel.msg||'')}">
    <div class="vs-mvrow"><button class="btn ghost sm vs-mv" data-act="vc-prev" aria-label="이전 달">‹</button><span class="vs-n" id="vsN">${vsText()}</span><button class="btn ghost sm vs-mv" data-act="vc-next" aria-label="다음 달">›</button></div>
    <div class="vs-row"><span class="grow"></span><button class="btn ghost sm" data-act="vc-multi-off">취소</button><button class="btn sm" id="vsGo" data-act="vc-multi-send" ${n?'':'disabled'}>요청 보내기</button></div>
  </div>`;
}
function renderViewTab(){   // 달력 탭 (가족 것만 볼래요)
  const p=vcEnsure(),top=$('#top'),v=$('#view'),n=new Date(),isCur=vcY===n.getFullYear()&&vcM===n.getMonth();
  top.className='cal-top';v.className='calv';
  const pmk=`${vcY}-${pad(vcM+1)}`,todoN=boardLeft(pmk);   // 가족 것만 보는 폰에도 포스트잇 (그 폰에선 가족 포스트잇만)
  top.innerHTML=`<div class="hl"><button class="hb pi-btn" data-act="open-board-vc" aria-label="월 포스트잇"><span class="pi-ic"></span>${todoN?`<span class="bdg pur">${todoN>9?'9+':todoN}</span>`:''}${S.link&&S.fam2&&S.fam2.boardDot?'<i class="pi-dot" aria-label="가족이 포스트잇을 고쳤어요"></i>':''}</button></div><div class="cal-mid"><div class="ym"><button class="ib" data-act="vc-prev">‹</button><h1>${vcY}.${pad(vcM+1)}</h1><button class="ib" data-act="vc-next">›</button></div><div class="sub"><b>${esc(p.name)} 달력</b> · 보기만</div></div><div class="hr">${isCur?'':'<button class="today-btn" data-act="vc-today">오늘</button>'}</div>`;
  v.innerHTML=`${vcTools()}${vcTrack(()=>vcGrid(p),`vcsl ${vcSel.on?'sel':''}`)}${vcSelBar(p)}`;
  applyTdc();fitDn(v);memoShift(v);vcCenter();glowCheck();   // v0.194 가족 달력에도 메모 위치(모양 조정)
}
// v0.126 가족 · 유찬 달력 위쪽: ‹ 2026.11 › + 다른 달일 때만 [오늘]
function vcNavHtml(){const n=new Date(),isCur=vcY===n.getFullYear()&&vcM===n.getMonth();return `<div class="vcnav"><span class="vcn-l"></span><button class="ib" data-act="vc-prev">‹</button><b>${vcY}.${pad(vcM+1)}</b><button class="ib" data-act="vc-next">›</button><span class="vcn-r">${isCur?'':'<button class="today-btn" data-act="vc-today">오늘</button>'}</span></div>`;}
function renderFamCalPage(){   // 가족 탭에서 이름을 누르면 (내 달력이 따로 있는 사람)
  const p=vcEnsure();if(!p){closePage();return;}
  openPage(`${pageHead(esc(p.name)+' 달력')}<div class="pg-b" style="display:flex;flex-direction:column;padding:0">
    ${vcNavHtml()}
    ${vcTools()}<div class="vcbox">${vcTrack(()=>vcGrid(p),`vcsl ${vcSel.on?'sel':''}`)}</div>${vcSelBar(p)}</div>`,'famcal');
  applyTdc();fitDn($('#page'));memoShift($('#page'));vcCenter();glowCheck();
}
var rqD={k:'',u:'',want:''};
// v0.125 가족(보기만) 폰에서 그 사람 달력의 날짜를 누르면: 내 날짜 창과 같은 틀 — 날짜 띠 · "주간 · 근무 요청 ▾"(누르면 요청) · 날씨 · 가족 메모 · 옆으로 밀면 다음날
let vcRqOpen=false;
function vcDayHtml(k){
  const p=famPeers().find(x=>x.uid===vcUid);if(!p)return '';
  const d=parse(k),sh=schShift(p.sch,d),hol=holName(k),past=k<fmt(new Date()),ty=schType(p.sch,sh);
  const want=rqD.k===k&&rqD.u===p.uid?rqD.want:((p.sch.types||[]).find(x=>x.rest)||{k:'휴'}).k;
  const mine=reqUniq(S.requests.filter(r=>r.srv&&r.dir==='out'&&r.peer===p.uid&&r.date===k).sort((a,b)=>b.t-a.t));
  const open=mine.some(r=>r.st==='pending'||r.st==='accepted');
  const strip=dsOffs().filter(i=>{const x=addDays(d,i),mm=x.getFullYear()*12+x.getMonth();return i===0||(mm>=MIN_M&&mm<=MAX_M);}).map(i=>{const x=addDays(d,i);return `<button class="dsi ${i===0?'on':''}${fmt(x)===dsTK()?' td':''}" data-act="vc-go" data-k="${fmt(x)}"><small>${x.getDate()}일</small>${schBadge(p.sch,schShift(p.sch,x),'sm')}</button>`;}).join('');
  const tag=open?'요청 중':past?'':'요청하기',canRq=!past||mine.length,isOpen=canRq&&(vcRqOpen||open);   // v0.168 새 모양 (시안 design/request): 내 날짜 창과 같은 짜임 · 요청 중이면 상태 카드가 바로 보임
  const tn=x=>esc(schType(p.sch,x).name||x),ro=x=>josa(schType(p.sch,x).name||x,'으로','로');
  const RS={pending:['clock','답 기다리는 중','#f08a00'],accepted:['check','수락됐어요','#1fa971'],applied:['check','근무표에 들어갔어요','#1fa971'],rejected:['x','거절됐어요','#e5484d'],cancelled:['x','취소했어요','#8b95a1']};
  const stCard=r=>{const [ic,lb,c]=RS[r.st]||RS.pending;return `<div class="vrst"><span class="ic" style="--c:${c}">${npi(ic,20)}</span><div class="tx"><b>${tn(r.want)}${ro(r.want)} 요청했어요</b><span>${lb} · ${rel(r.tu||r.t)}</span>${r.reply?`<em>"${esc(r.reply)}"</em>`:''}</div>${r.st==='pending'?`<button class="x" data-act="rqcancel" data-id="${r.id}">취소</button>`:''}</div>`;};
  const chips=(p.sch.types||[]).slice(0,8).map(x=>`<button class="tchip ${want===x.k?'on':''}" data-act="vc-want" data-s="${esc(x.k)}">${schBadge(p.sch,x.k,'tc')}<small>${esc(x.name)}</small></button>`).join('');
  const form=past||open?'':`<div class="tchips">${chips}</div>
        ${want!==sh?`<div class="vrask"><b>${esc(ty.name)} → ${tn(want)}</b>${ro(want)} 바꿔 달라고 할게요</div>`:''}
        <textarea id="rqm2" placeholder="한마디 (예: 아이 학예회라 같이 가자)" maxlength="60"></textarea>
        <button class="paint-btn" data-act="vc-multi-from" data-k="${k}">${npi('calendar-days',18)}<b>여러 날 고르기</b><i>›</i></button>
        <button class="btn vrsend" data-act="vc-send">요청 보내기<small> · ${famBx.vip?'무제한':famRemN()+'건 남음'}</small></button>`;
  const card=!isOpen?'':`<div class="sh-card vrcard">${mine.map(stCard).join('')}${form}</div>`;
  return `<div class="dtop"><button data-act="close">‹ ${esc(p.name)} 달력</button></div>
    <div class="dfh"><button class="ib" data-act="vc-go" data-k="${fmt(addDays(d,-1))}" aria-label="전날">‹</button>
      <div class="dft"${dsTgo(k,'vc-go')}><b class="${hol?'hl':''}">${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]})</b><small>${esc(p.name)} · ${esc(ty.name)}${hol?` · <span class="hl">${esc(hol)}</span>`:''}${dsTdy(k)}</small>${dsHint(k)}</div>
      <button class="ib" data-act="vc-go" data-k="${fmt(addDays(d,1))}" aria-label="다음날">›</button></div>
    <div class="dstrip" id="dstrip">${strip}</div>
    <div class="dsbody vrbody">
    <div class="sec shsec vcrq ${isOpen?'open':''}"><div class="sh-hd"><span>${isOpen&&form?'근무 바꿔 달라고 하기':'근무'}</span><button class="sh-pill" ${canRq?'data-act="vc-rq"':''}>${schBadge(p.sch,sh,'sm')}${esc(ty.name)}${tag?`<small class="vct">· ${tag}</small>`:''}${canRq?'<i class="shc"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></i>':''}</button></div>${card}</div>
    ${vcDayWx(p,k)}
    <div class="sec vcm memsec">${vcMemoHtml(k)}</div></div>`;
}
// v0.194 근무를 고를 때마다 "교육 → 주간으로 바꿔 달라고 할게요" 줄도 바꿈 (지금 근무와 같으면 숨김)
function vcAskLine(chips){
  const p=famPeers().find(x=>x.uid===vcUid);if(!p||!chips||!rqD.k)return;
  const sh=schShift(p.sch,parse(rqD.k)),w=rqD.want,nm=x=>schType(p.sch,x).name||x;
  let el=chips.parentElement.querySelector('.vrask');
  if(w===sh){if(el)el.remove();return;}
  if(!el){el=document.createElement('div');el.className='vrask';chips.after(el);}
  el.innerHTML=`<b>${esc(nm(sh))} → ${esc(nm(w))}</b>${josa(nm(w),'으로','로')} 바꿔 달라고 할게요`;
}
// v0.195 근무 펼치기 · 접기 모션 (시안 design/shift-morph/v1): 알약 버튼이 그 자리에서 큰 카드로 커지고(뒤 판 clip-path) 안의 줄이 차례로 나타남 · 아래 카드들은 transform 으로 미끄러짐
// 화면 배치는 한 번만 바꾸고 움직이는 동안엔 겉모습(clip · transform · opacity)만 → 폰에서도 부드럽게 · apply() = 실제로 열고 닫기(새 sec 를 돌려줘도 됨)
function shMorph(sec,open,apply){
  const run=()=>{const r=apply?apply():null;return r&&r.nodeType?r:sec;};
  const pill0=sec&&sec.querySelector('.sh-pill');
  if(!sec||!pill0||!sec.animate||matchMedia('(prefers-reduced-motion: reduce)').matches){run();return;}
  const tops=x=>{const a=[];let e=x.nextElementSibling;while(e){a.push(e.getBoundingClientRect().top);e=e.nextElementSibling;}return a;};
  const sibs=x=>{const a=[];let e=x.nextElementSibling;while(e){a.push(e);e=e.nextElementSibling;}return a;};
  const insetOf=(r,b,rad)=>`inset(${(r.top-b.top).toFixed(1)}px ${(b.right-r.right).toFixed(1)}px ${(b.bottom-r.bottom).toFixed(1)}px ${(r.left-b.left).toFixed(1)}px round ${rad}px)`;
  const EO='cubic-bezier(.2,.9,.25,1)',EC='cubic-bezier(.45,0,.75,.35)';
  const ghost=(sc,p,c)=>{const sr=sc.getBoundingClientRect(),b={left:Math.min(p.left,c.left),top:Math.min(p.top,c.top),right:Math.max(p.right,c.right),bottom:Math.max(p.bottom,c.bottom)};
    const g=document.createElement('div');g.className='shghost';Object.assign(g.style,{left:(b.left-sr.left)+'px',top:(b.top-sr.top)+'px',width:(b.right-b.left)+'px',height:(b.bottom-b.top)+'px'});sc.appendChild(g);return {g,b};};
  if(open){
    const b0=tops(sec),p=pill0.getBoundingClientRect();
    sec.classList.add('mrph');const s2=run();s2.classList.add('mrph');const card=s2.querySelector('.sh-card'),pill=s2.querySelector('.sh-pill');if(!card||!pill){s2.classList.remove('mrph');return;}
    const c=card.getBoundingClientRect(),pr=pill.getBoundingClientRect(),b1=tops(s2),{g,b}=ghost(s2,pr,c);
    const an=g.animate([{clipPath:insetOf(pr,b,pr.height/2)},{clipPath:insetOf(c,b,22)}],{duration:420,easing:EO});
    sibs(s2).forEach((e,i)=>{if(b0[i]!=null&&b0[i]!==b1[i])e.animate([{transform:`translateY(${b0[i]-b1[i]}px)`},{transform:'none'}],{duration:420,easing:EO});});
    [...card.children].forEach((x,i)=>x.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:280,delay:150+i*45,easing:'ease-out',fill:'backwards'}));
    let ok=false;const end=()=>{if(ok)return;ok=true;g.remove();void s2.offsetHeight;s2.classList.remove('mrph');};an.onfinish=end;setTimeout(end,700);
  }else{
    const card=sec.querySelector('.sh-card');if(!card){run();return;}
    const c=card.getBoundingClientRect(),p=pill0.getBoundingClientRect(),b0=tops(sec);
    sec.classList.add('mrph-m');const b1=tops(sec);sec.classList.remove('mrph-m');   // 닫힌 뒤 아래 카드 자리 (잠깐 숨겨서 잼)
    sec.classList.add('mrph');const {g,b}=ghost(sec,p,c);
    const kids=[...card.children].map(x=>x.animate([{opacity:1},{opacity:0}],{duration:110,fill:'forwards'}));
    const an=g.animate([{clipPath:insetOf(c,b,22)},{clipPath:insetOf(p,b,p.height/2)}],{duration:320,easing:EC,fill:'forwards'});
    const mv=sibs(sec).map((e,i)=>b0[i]!==b1[i]?e.animate([{transform:'none'},{transform:`translateY(${b1[i]-b0[i]}px)`}],{duration:320,easing:EC,fill:'forwards'}):null).filter(Boolean);
    let ok=false;const end=()=>{if(ok)return;ok=true;const s2=run();if(s2===sec){g.remove();void sec.offsetHeight;sec.classList.remove('mrph');}kids.forEach(k=>k.cancel());mv.forEach(k=>k.cancel());};
    an.onfinish=end;setTimeout(end,600);
  }
}
function openVcDay(k){
  const p=famPeers().find(x=>x.uid===vcUid);if(!p)return;
  if(rqD.k!==k||rqD.u!==p.uid)rqD={k,u:p.uid,want:((p.sch.types||[]).find(x=>x.rest)||{k:'휴'}).k};
  sheetMode='vcday';
  const sc=$('#sheet').classList.contains('open')&&sheetMode==='vcday'?$('#sheet').scrollTop:0;
  openSheet(vcDayHtml(k),true);dstripCenter(x=>vcGo(x,true),()=>rqD.k);
}
function vcGo(k,quiet){
  const d=parse(k),v=d.getFullYear()*12+d.getMonth();if(v<MIN_M||v>MAX_M)return;
  if(d.getFullYear()!==vcY||d.getMonth()!==vcM){vcY=d.getFullYear();vcM=d.getMonth();vcRerender();}
  if(!quiet)buzz(6);openVcDay(k);const sh=$('#sheet');if(sh)sh.scrollTop=0;
}
// 그 가족(근무표를 나눈 사람)의 그날 날씨: 집(내 폰의 집) → 직장(그 가족이 실어 보낸 직장) · 오늘부터 3일 뒤까지
// v0.134 근무표를 올린 가족의 집: 그 사람이 보낸 집(h) → 내 폰 집 → 그 사람 직장 (버튼 없이 늘 자동)
function famSchedHome(m){const x=m&&m.sch&&m.sch.wx;if(x&&wxOk(x.h))return x.h;if(wxOn())return S.wx.home;return x&&wxOk(x.w)?x.w:'';}
function famSchedWx(m,d,now){
  try{const hm=famSchedHome(m);if(!hm)return null;const H=wxRaw(hm);if(!H)return null;now=now||Date.now();
    const win=wxMemWin(m,d),wk=wxMemWork(m),W=wk&&wk!==hm?wxRaw(wk):null,hq=wxFull(hm);
    const c=(win?WX.commute(H,W,{s:win.s,e:win.e,hn:`집 · ${wxName(hm)}`,wn:W?`직장 · ${wxName(wk)}`:`집 · ${wxName(hm)}`,hq,wq:wk?wxFull(wk):hq,now}):null)||WX.dayCard(H,WX.keyD(new Date(d.getFullYear(),d.getMonth(),d.getDate(),12).getTime()),{now,hq,hp:wxName(hm)});
    return c?{c,win,wk,hm}:null;}catch(e){return null;}
}
function vcDayWx(p,k){
  const d=parse(k),t=new Date(),df=Math.round((d-new Date(t.getFullYear(),t.getMonth(),t.getDate()))/864e5);
  if(df<0)return wxHistCard(wxMemKey(p),k,'vc-wx');   // v0.127 지난 날 = 저장본
  if(df>3){const x=famSchedWx(p,d);return x&&x.c?wxFarLine(x.c,`data-act="vc-wx" data-k="${k}"`):'';}   // v0.134 먼 날 한 줄
  const x=famSchedWx(p,d);if(!x||!x.c||!x.c.k)return '';
  return wxCardHtml(x.c,wxCls(x.c),`data-act="vc-wx" data-k="${k}"`);
}
function vcWxPop(k){const p=famPeers().find(x=>x.uid===vcUid);if(p)famWxOpen(p,k);}
function vcRerender(){if(pageMode==='famcal')renderFamCalPage();else if(pageMode==='mancal')renderManCalPage();else render();}
// v0.142 가족 · 유찬 달력도 내 달력처럼 가로 스크롤(scroll-snap): 지금 달 판만 id="vcsl"(다른 기능은 그대로 그 판만 봄) · 앞뒤 3달 판 · 멈추면 그 달로 다시 그림
const VC_R=3;let vcGridFn=null,vcSetT=0,vcTouch=false,vcFillT=0;
function vcTrack(gridFn,cls){
  vcGridFn=gridFn;const mk=vcY*12+vcM,lock=/\bsel\b/.test(cls);
  let h=`<div id="vcsl" class="${cls}" data-mk="${mk}" style="order:${VC_R}">${gridFn()}</div>`;
  for(let d=1;d<=VC_R;d++)[-d,d].forEach(o=>{const v=mk+o;h+=`<div class="vcsl vcn" data-mk="${v}" style="order:${VC_R+o}">${Math.abs(o)===1?vcGridAt(v):''}</div>`;});
  return `<div class="vctr${lock?' lock':''}" id="vctr">${h}</div>`;
}
function vcGridAt(v){if(!vcGridFn||v<MIN_M||v>MAX_M)return '';const sy=vcY,sm=vcM;vcY=Math.floor(v/12);vcM=v%12;try{return vcGridFn();}catch(e){return '';}finally{vcY=sy;vcM=sm;}}
const vcW=tr=>(tr&&tr.getBoundingClientRect().width)||innerWidth;
function vcCenter(){
  const tr=document.getElementById('vctr');if(!tr)return;const W=vcW(tr);if(W>0){calIgn=performance.now();tr.scrollLeft=VC_R*W;}
  clearTimeout(vcFillT);vcFillT=setTimeout(vcFillFar,120);
}
function vcFillFar(){   // 먼 판은 조금 뒤에 하나씩
  const tr=document.getElementById('vctr');if(!tr)return;if(vcTouch){vcFillT=setTimeout(vcFillFar,200);return;}
  const p=[...tr.children].find(x=>!x.firstElementChild&&+x.dataset.mk>=MIN_M&&+x.dataset.mk<=MAX_M);if(!p)return;
  p.innerHTML=vcGridAt(+p.dataset.mk);try{fitDn(p);memoShift(p);}catch(e){}vcFillT=setTimeout(vcFillFar,60);
}
let vcPend=0;
function vcSettle(){
  const tr=document.getElementById('vctr');if(!tr||vcTouch)return;const W=vcW(tr),x=tr.scrollLeft,i=Math.round(x/W);
  if(Math.abs(x-i*W)>3)return;if(vcPend&&i-VC_R!==vcPend)return;vcPend=0;const d=i-VC_R;if(!d)return;
  const v=vcY*12+vcM+d;if(v<MIN_M||v>MAX_M){tr.scrollTo({left:VC_R*W,behavior:'smooth'});return;}
  vcY=Math.floor(v/12);vcM=v%12;vcRerender();
}
document.addEventListener('scroll',e=>{
  if(!e.target||e.target.id!=='vctr')return;
  const tr=e.target,W=vcW(tr),i=Math.round(tr.scrollLeft/W),v=vcY*12+vcM+i-VC_R;
  if(performance.now()-calIgn>40){
    if((glowStart||glowTm)&&Math.abs(tr.scrollLeft-VC_R*W)>2)glowStop();
    [...tr.children].forEach(p=>{if(Math.abs(+p.style.order-i)<=1&&!p.firstElementChild&&+p.dataset.mk>=MIN_M&&+p.dataset.mk<=MAX_M)p.innerHTML=vcGridAt(+p.dataset.mk);});   // 다가오는 먼 판
    {const t=`${Math.floor(v/12)}.${pad(v%12+1)}`;document.querySelectorAll('.vcnav b,#top .ym h1').forEach(h=>{if(v>=MIN_M&&v<=MAX_M&&h.textContent!==t)h.textContent=t;});}   // 넘어가는 중에도 위 월 숫자
  }
  clearTimeout(vcSetT);vcSetT=setTimeout(vcSettle,90);
},true);
document.addEventListener('scrollend',e=>{if(e.target&&e.target.id==='vctr'){clearTimeout(vcSetT);vcSettle();}},true);
document.addEventListener('touchstart',e=>{if(e.target.closest&&e.target.closest('#vctr')){vcTouch=true;vcPend=0;}},{passive:true,capture:true});
['touchend','touchcancel'].forEach(ev=>document.addEventListener(ev,e=>{if(!vcTouch||(e.touches&&e.touches.length))return;vcTouch=false;clearTimeout(vcSetT);vcSetT=setTimeout(vcSettle,140);},{passive:true,capture:true}));
function vcEnter(){   // 달이 넘어간 뒤 새 달이 옆에서 들어오는 효과
  if(!vcAnim)return;const d=vcAnim;vcAnim=0;const el=document.getElementById('vcsl');if(!el||reduceMotion())return;
  const w=el.clientWidth||innerWidth;el.style.transition='none';el.style.transform=`translateX(${d>0?w:-w}px)`;el.getBoundingClientRect();
  el.style.transition='transform .18s ease-out';el.style.transform='translateX(0)';
}
let vsx=null,vsy=0,vdx=0,vlock=null,vst=0,vbusy=false;
document.addEventListener('touchstart',e=>{
  const el=e.target.closest&&e.target.closest('#vcsl');
  if(!el||(e.target.closest('#vctr')&&!e.target.closest('#vctr.lock'))||vbusy||vcSel.on||manPaint||$('#sheet').classList.contains('open')||$('#pop').classList.contains('open')){vsx=null;return;}
  vsx=e.touches[0].clientX;vsy=e.touches[0].clientY;vdx=0;vlock=null;vst=Date.now();
},{passive:true});
document.addEventListener('touchmove',e=>{
  if(vsx===null)return;
  const x=e.touches[0].clientX-vsx,y=e.touches[0].clientY-vsy;
  if(vlock===null&&(Math.abs(x)>8||Math.abs(y)>8))vlock=Math.abs(x)>Math.abs(y)?'x':'y';
  if(vlock!=='x')return;
  vdx=x;const el=document.getElementById('vcsl');if(!el)return;
  el.style.transition='none';el.style.transform=`translateX(${x}px)`;
},{passive:true});   // v0.138 막지 않음 (가로는 #vcsl touch-action:pan-y 로 폰이 안 가져감)
document.addEventListener('touchend',()=>{
  if(vsx===null||vlock!=='x'){vsx=null;return;}
  vsx=null;const el=document.getElementById('vcsl');if(!el)return;
  const w=el.clientWidth||innerWidth,fast=Math.abs(vdx)/(Date.now()-vst+1)>0.5;
  let dir=(Math.abs(vdx)>w*0.22||(fast&&Math.abs(vdx)>30))?(vdx<0?1:-1):0;
  const mk=vcY*12+vcM;if(mk+dir<MIN_M||mk+dir>MAX_M)dir=0;
  if(!dir){el.style.transition='transform .2s ease';el.style.transform='translateX(0)';return;}
  vbusy=true;el.style.transition='transform .16s ease-in';el.style.transform=`translateX(${dir>0?-w:w}px)`;
  setTimeout(()=>{vbusy=false;vcAnim=dir;vcMove(dir);},170);
},{passive:true});
// 여러 날 요청: 날짜를 하나씩 누르거나 쭉 밀어서 고르기 (달력 칠하기처럼)
document.addEventListener('pointerdown',e=>{
  if(!vcSel.on)return;const c=e.target.closest&&e.target.closest('#vcsl .cell[data-k]');if(!c)return;
  const p=famPeers().find(x=>x.uid===vcUid);if(!p)return;
  const k=c.dataset.k,on=!vcSel.dates.has(k);
  vsDrag={on,last:k,id:e.pointerId};
  if(!on||vsOk(p,k))vsSet(k,on);
});
document.addEventListener('pointermove',e=>{
  if(!vsDrag||e.pointerId!==vsDrag.id)return;
  const el=document.elementFromPoint(e.clientX,e.clientY),c=el&&el.closest&&el.closest('#vcsl .cell[data-k]');
  if(!c||c.dataset.k===vsDrag.last)return;
  vsDrag.last=c.dataset.k;
  const p=famPeers().find(x=>x.uid===vcUid);if(!p)return;
  if(!vsDrag.on||vsOk(p,c.dataset.k))vsSet(c.dataset.k,vsDrag.on);
});
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,()=>{vsDrag=null;mpDrag=null;}));
var mpDrag=null;
document.addEventListener('pointerdown',e=>{
  if(!manPaint)return;const c=e.target.closest&&e.target.closest('#vcsl .cell[data-k]');if(!c)return;
  mpDrag={id:e.pointerId,last:c.dataset.k};manApply(c.dataset.k);buzz(6);
});
document.addEventListener('pointermove',e=>{
  if(!mpDrag||e.pointerId!==mpDrag.id)return;
  const el=document.elementFromPoint(e.clientX,e.clientY),c=el&&el.closest&&el.closest('#vcsl .cell[data-k]');
  if(!c||c.dataset.k===mpDrag.last)return;
  mpDrag.last=c.dataset.k;manApply(c.dataset.k);
});
function vcMove(n){   // v0.209 ‹ › · 회색 다른 달 칸: 손으로 넘길 때처럼 옆 판으로 미끄러짐 (멈추면 vcSettle 이 그 달로)
  {const tr=document.getElementById('vctr'),W=tr&&vcW(tr);if(tr&&W&&Math.abs(n)===1&&!RMq()&&!tr.classList.contains('lock')){const t2=vcPend+n,nb=[...tr.children].find(x=>+x.style.order===VC_R+t2);const v=vcY*12+vcM+t2;
    if(Math.abs(t2)<=1&&(t2===0||(nb&&nb.firstElementChild))&&v>=MIN_M&&v<=MAX_M){vcPend=t2;tr.scrollTo({left:(VC_R+t2)*W,behavior:'smooth'});return;}
    if(vcPend){n=t2;vcPend=0;}}}   // 넘어가는 중에 또 누르면 목표만 바꿈 (두 칸 넘으면 바로)
  let y=vcY,m=vcM+n;if(m<0){m=11;y--;}if(m>11){m=0;y++;}const k=y*12+m;if(k<MIN_M||k>MAX_M)return;vcY=y;vcM=m;vcRerender();}
/* ================= 가족 메모 · 근무 요청 (3단계) =================
 * 가족 메모(♥) 는 households/{hid}/memos, 근무 요청은 households/{hid}/requests 에 두고,
 * 보낼 때마다 내 횟수(sent)가 +1 (처음 10건 무료). 내 폰의 메모 · 요청 화면은 지금 있는 것을 그대로 쓰고
 * 서버에서 받은 것을 같이 보여줘요 (S.requests 에 srv:true 로 복사본, 가족 메모는 visibleMemos 에 합침). */
const FAM_FREE=10;
const famRemN=()=>{const n=famRemain();return n>99?'99+':n;};   // v0.196 100건 넘으면 99+건
const famRemTxt=()=>famBx.vip?'무제한':`무료 ${famRemN()}건 남음`;   // v0.229 무제한이면 건수 대신
const famRemain=()=>{if(famBx.vip)return 9999;const m=(S.fam2&&S.fam2.me)||{};return Math.max(0,FAM_FREE+(+m.bonus||0)+famBx.me+famBx.all-(+m.sent||0));};   // v0.150 + 관리자가 준 건수
const iga=w=>{const c=String(w).slice(-1).charCodeAt(0);return c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28!==0?'이':'가';};
const famOthers=()=>{const me=S.link&&S.link.uid;return ((S.fam2&&S.fam2.members)||[]).filter(m=>m.uid!==me).map(m=>({...m,name:famAka(m.uid,m.name)}));};
// v0.127 내 폰에서 부를 이름 (상대 폰 · 서버 이름은 그대로)
function famAka(uid,name){let a='';try{a=S&&S.famAlias&&S.famAlias[uid];}catch(e){}return a||name;}   // (함수 선언: 시작할 때 요청 목록 만들기에서도 씀)
const famNameOf=uid=>{const m=((S.fam2&&S.fam2.members)||[]).find(x=>x.uid===uid);return m?famAka(uid,m.name):'가족';};
const tsMs=v=>v&&v.toMillis?v.toMillis():0;
function famLimitSheet(){
  openSheet(`${sheetHead('무료 메시지를 다 썼어요')}
    <div class="hint">가족 메모 · 근무 요청 · 가족 포스트잇(새로 붙일 때)은 합쳐서 처음 ${FAM_FREE}건까지 무료예요.</div>
    <button class="btn ghost" style="width:100%" data-act="close">닫기</button>`);
}
// ---- 가족 메모 올리기 · 받기
var famBusyMemo={};
const famMemoErr=e=>{const c=String((e&&e.code)||(e&&e.message)||e);return c.includes('permission-denied')?'가족 메모를 올리지 못했어요. 무료 횟수를 다 썼거나 가족방 연결이 풀렸을 수 있어요':'가족 메모를 올리지 못했어요. '+fbErrText(e);};
const famMemoWarned={};
function famMemoWarn(id,msg){if(famMemoWarned[id])return;famMemoWarned[id]=1;toast(msg);}   // 메모 하나당 한 번만 알려요
let famArchBusy=false,famArchLoading=false,famArchT=0,famArchT2=0;
// 가족이 올린 옛 메모 묶음: 가족 구성이 바뀔 때만 한 번 읽음 (보기만 · 내 것은 빼고)
async function famLoadArch(){
  if(!S.link||famArchLoading)return;
  const me=S.link.uid,key=S.link.hid+'|'+(S.fam2.members||[]).map(m=>m.uid).sort().join(',');
  if(S.fam2.archKey===key)return;
  famArchLoading=true;
  try{
    const {F,db}=await famReady();
    const sn=await F.getDocs(F.collection(db,'households',S.link.hid,'archive'));
    const out={};
    sn.docs.forEach(d=>{const v=d.data()||{};if(!okId(v.by)||v.by===me||!Array.isArray(v.items))return;
      out[d.id]={by:v.by,byName:cutTxt(v.byName,12)||'가족',items:v.items.filter(x=>isObj(x)&&okDate(x.d)&&typeof x.t==='string'&&x.t.trim()).slice(0,1500).map(x=>({d:x.d,t:cutMulti(x.t,200),...(/^\d\d:\d\d$/.test(x.tm||'')?{tm:x.tm}:{})}))};});
    S.fam2.arch=out;S.fam2.archKey=key;famSaveLocal();famRefreshUi();
  }catch(e){}finally{famArchLoading=false;}
}
async function famSyncMemos(){
  if(!S.link||!fbCfg()||!S.link.uid)return;
  const uid=S.link.uid,hid=S.link.hid,want={},others=famOthers().map(x=>x.uid);
  const toOf=m=>{const l=Array.isArray(m.to)&&m.to.length?m.to.filter(u=>others.includes(u)):others;return [...new Set([uid,...(l.length?l:others)])].sort();};
  Object.keys(S.memos||{}).forEach(k=>(S.memos[k]||[]).forEach(m=>{if(m.shared&&m.by===role()&&String(m.text||'').trim())want[uid+'_'+m.id]={date:k,text:String(m.text).slice(0,200),nt:!!m.notify,mid:m.id,t:+m.t||0,td:!!m.todo,dn:!!(m.todo&&m.done),tm:/^\d\d:\d\d$/.test(m.time||'')?m.time:'',al:/^\d\d:\d\d$/.test(m.time||'')&&(m.al==='0'||m.al==='10')?m.al:'',to:toOf(m),tl:m.till&&m.till>k?m.till:'',pc:m.till?(m.pc||m.color||''):''};}));
  const have={};Object.entries(S.fam2.memos||{}).forEach(([id,v])=>{if(v.by===uid)have[id]=v;});
  const {F,db}=await famReady();
  // v0.96 가족방에 들어오고 10분 안: 들어오기 전에 쓴 메모 옮기기 — 지난 날짜(가족 모두에게 보낸 것)는 한 문서로 묶고, 오늘 · 앞으로는 하나씩(무료 횟수 대신 moved)
  const me2=S.fam2.me||{},jt=+me2.joinedAt||0,jl=+me2.joinLocal||0,moving=jt>0&&jl>0&&Date.now()<jl+9*60e3;   // jl: 이 폰 시계로 들어온 때 (메모 쓴 시각과 같은 시계로 비교)
  const arch=new Set(S.fam2.archIds||[]);
  Object.keys(want).forEach(id=>{if(arch.has(want[id].mid))delete want[id];});   // 묶음으로 옮긴 옛 메모는 하나씩 올리지 않음 (폰에서 고쳐도 폰에만)
  if(moving&&!S.fam2.archDone){
    if(famArchBusy)return;   // 묶음을 올리는 중: 끝난 뒤에 이어서 (그 사이 같은 메모를 하나씩 올리지 않게)
    const tk=fmt(new Date()),all=[uid,...others].sort().join();
    const past=Object.keys(want).filter(id=>!have[id]&&want[id].t<jl&&want[id].date<tk&&want[id].to.join()===all);   // 들어오기 전에 쓴 것만
    famArchBusy=true;
    try{
      if(past.length){
        const items=past.map(id=>({d:want[id].date,t:want[id].text,...(want[id].tm?{tm:want[id].tm}:{})})).sort((a,b)=>a.d<b.d?-1:1);
        const parts=[items.slice(0,1500),items.slice(1500,3000),items.slice(3000,4500)].filter(x=>x.length);
        const b=F.writeBatch(db);
        parts.forEach((it,i)=>b.set(F.doc(db,'households',hid,'archive',i?uid+'_'+(i+1):uid),{by:uid,byName:S.link.name,items:it,part:i+1,at:F.serverTimestamp()}));
        await b.commit();
        S.fam2.archIds=past.slice(0,4500).map(id=>want[id].mid);past.forEach(id=>delete want[id]);
      }
      S.fam2.archDone=1;famSaveLocal();
    }catch(e){}finally{famArchBusy=false;}
  }
  let remain=famRemain(),movedN=+me2.moved||0;
  for(const id of Object.keys(want)){
    if(famBusyMemo[id])continue;
    const w=want[id],h=have[id],ref=F.doc(db,'households',hid,'memos',id);
    if(!h){
      const mv=moving&&movedN<200&&w.t<jl;   // 들어오기 전에 쓴 메모만 옮김: 무료 횟수를 안 씀 · 알림도 안 감 (들어온 뒤 새로 쓴 건 평소처럼)
      if(!mv&&remain<=0){famMemoWarn(id,'무료 횟수를 다 써서 가족 메모를 올리지 못했어요');continue;}if(mv)movedN++;else remain--;
      famBusyMemo[id]=1;
      const b=F.writeBatch(db);
      b.set(ref,{by:uid,byName:S.link.name,date:w.date,text:w.text,to:w.to,createdAt:F.serverTimestamp(),updatedAt:F.serverTimestamp(),...(w.tm?{time:w.tm,...(w.al!==''?{al:w.al}:{})}:{}),...(mv?{moved:true}:{}),...(w.td?{todo:true,done:w.dn}:{}),...(w.tl?{till:w.tl,...(w.pc?{pc:w.pc}:{})}:{})});   // 할 일 · 완료: 가족 폰엔 보기만 · v0.233 기간 띠
      b.update(famMember(F,db,hid,uid),mv?{moved:F.increment(1)}:{sent:F.increment(1)});
      b.commit().catch(e=>famMemoWarn(id,famMemoErr(e))).finally(()=>{delete famBusyMemo[id];});
    }else if(h.text!==w.text||h.date!==w.date||(h.time||'')!==w.tm||(h.al||'')!==w.al||JSON.stringify([...(h.to||[])].sort())!==JSON.stringify(w.to)||!!h.todo!==w.td||!!h.done!==w.dn||(h.till||'')!==w.tl||(h.pc||'')!==w.pc){
      famBusyMemo[id]=1;
      const patch={date:w.date,text:w.text,updatedAt:F.serverTimestamp()};
      if(JSON.stringify([...(h.to||[])].sort())!==JSON.stringify(w.to))patch.to=w.to;   // 받는 사람이 바뀌었거나, 옛 메모(to 없음)를 채움
      if((h.time||'')!==w.tm||(h.al||'')!==w.al){patch.time=w.tm?w.tm:F.deleteField();patch.al=w.al!==''?w.al:F.deleteField();}   // 시간 알림(색 · 할 일은 안 올림)
      if(!!h.todo!==w.td||!!h.done!==w.dn){patch.todo=w.td?true:F.deleteField();patch.done=w.td?w.dn:F.deleteField();}   // 할 일 · 완료 체크 (알림 없음)
      if((h.till||'')!==w.tl||(h.pc||'')!==w.pc){patch.till=w.tl||F.deleteField();patch.pc=w.tl&&w.pc?w.pc:F.deleteField();}   // v0.233 기간 띠 · 띠 색
      if(w.nt)patch.rev=(+h.rev||0)+1;   // 고쳤다고 알리기를 고른 수정
      F.updateDoc(ref,patch).then(()=>{if(w.nt)famClearNotify(w.mid);}).catch(e=>famMemoWarn(id,famMemoErr(e))).finally(()=>{delete famBusyMemo[id];});
    }
  }
  for(const id of Object.keys(have)){
    if(want[id]||famBusyMemo[id])continue;
    famBusyMemo[id]=1;
    F.deleteDoc(F.doc(db,'households',hid,'memos',id)).catch(()=>{}).finally(()=>{delete famBusyMemo[id];});
  }
}
/* ================= 업무 일지 (부가 기능 "업무 메모") =================
 * S.wlog = {name(사용자가 정한 이름, 처음엔 ''), secs:[{id:'a'..'d', n:칸 이름, h:숨김}], backup(백업에 넣기), seen(처음 안내 봄), days:{날짜:{a:[{id,t}],…}}}
 * 나만 봄: 가족 메모 · 가족 달력 · 위젯 · 공유 그림 어디에도 안 나옴. 백업은 기본으로 빠짐(회사 보안).
 * 날짜 창: 메모 맨 위에 1.3배 줄 → 누르면 날짜 창 위로 큰 팝업(네 칸에 바로 쓰기 · 쓰는 대로 저장). 만들기는 메모 "자세히 ›" 안에서. */
const WL_NAMES=['업무 일지','인수인계','근무 일지','업무 메모','조업 일지'];
const josa=(w,a,b)=>{const c=String(w||'').trim().slice(-1).charCodeAt(0);return c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28!==0?a:b;};   // 받침 있으면 a (은/을), 없으면 b (는/를)
const wlOn=()=>adOn('wlog');
const wlName=()=>(S.wlog&&S.wlog.name)||'업무 일지';
const wlSecs=()=>S.wlog.secs.filter(x=>!x.h);
const wlLines=t=>String(t||'').split('\n').filter(x=>x.trim());
function wlCounts(k){const d=S.wlog&&S.wlog.days[k];if(!d)return [];return wlSecs().map(sc=>[sc,wlLines(d[sc.id]).length]).filter(x=>x[1]);}
const wlHas=k=>wlOn()&&wlCounts(k).length>0;
// 위젯 날짜 창에서 펼쳐 보기용 칸별 글 (가까운 날만 · 하루 1500자까지 · 폰 안 위젯 저장소에만 감)
function wlSecTexts(k){
  const day=(S.wlog&&S.wlog.days[k])||{},out=[];let left=1500;
  wlSecs().forEach(sc=>{const t=String(day[sc.id]||'').replace(/\s+$/,'');if(!t.trim()||left<=0)return;const c=t.slice(0,left);left-=c.length;out.push({id:sc.id,n:sc.n,t:c});});
  return out;
}
function wlRowHtml(k){const c=wlCounts(k);return `<button class="wlrow" data-act="wl-open" data-k="${k}"><span class="ic">📋</span><span class="tx"><b>${esc(wlName())}</b><small>${c.map(([sc,n])=>`${esc(sc.n)} ${n}`).join(' · ')}</small></span><span class="go">›</span></button>`;}
let wlEd=null,wlNameK='',wlNoticeK='',wlsT=0;
function wlNamePrompt(k){
  wlNameK=k;
  openPop(`<div class="mh">일지 이름<b>이름을 정해 주세요</b></div>
    <div class="mi" style="display:block"><input type="text" id="wlNm" maxlength="12" value="${esc(S.wlog.name||'업무 일지')}" enterkeyhint="done">
      <div class="wlchips">${WL_NAMES.map(n=>`<button data-act="wl-nmchip" data-v="${n}">${n}</button>`).join('')}</div>
</div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">취소</button><button class="btn grow" data-act="wl-nmok">만들기</button></div>`);
  setTimeout(()=>{const i=$('#wlNm');if(i){i.focus();i.select();}},80);
}
function wlOpen(k){
  if(!okDate(k))return;
  if(!S.wlog.seen){   // 처음 한 번: 백업 안내 (사용자가 정한 문구)
    wlNoticeK=k;const n=wlName();
    openPop(`<div class="mh">${esc(n)}${josa(n,'은','는')} 백업되지 않아요<b>회사 보안을 위해 폰에만 저장돼요.</b></div>
      <div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0;line-height:1.7">그래도 백업하시려면 설정에서 켜 주세요.</div></div>
      <div class="mi"><button class="btn grow" data-act="wl-seen">확인</button></div>`);return;
  }
  wlEd={k,ren:false};renderWl(false);
}
function renderWl(focus){
  const e=wlEd;if(!e)return;
  $('#pop').className='open wl-pop';
  $('#pop').innerHTML=`<div class="wlp" role="dialog" aria-label="${esc(wlName())}">${wlInner(e)}</div>`;
  document.querySelectorAll('.wlta').forEach(wlGrow);
  if(focus){const f=$('#wlRen');if(f)setTimeout(()=>{f.focus();f.setSelectionRange(f.value.length,f.value.length);},60);}
}
// 업무 메모 창 안쪽 (옆으로 밀 때 옆 날짜를 미리 그리는 데도 씀)
function wlInner(e){
  const k=e.k,d=parse(k),day=S.wlog.days[k]||{},sh=persOn(k)?'':shiftLabel(shiftOf(d));
  const sec=sc=>{const v=day[sc.id]||'',n=wlLines(v).length;
    return `<div class="wls"><h4><span class="wk-${sc.id}"><i></i>${esc(sc.n)}</span><small id="wlN_${sc.id}">${n?n+'줄':''}</small></h4>
      <textarea class="wlta" id="wlT_${sc.id}" data-s="${sc.id}" data-k="${k}" placeholder="적기" maxlength="4000" rows="2">${esc(v)}</textarea></div>`;};
  return `<div class="grab"></div>
    <div class="hd">${e.ren?`<input type="text" class="tin" id="wlRen" maxlength="12" value="${esc(wlName())}" enterkeyhint="done"><button class="ib2" data-act="wl-renok" aria-label="이름 저장">✓</button>`:`<button class="ttl" data-act="wl-ren" aria-label="이름 바꾸기">${esc(wlName())}</button>`}
      <button class="ib2" data-act="wl-copy" aria-label="전체 복사">${npi('copy',18)}</button><button class="ib2" data-act="srch-open" data-v="wl" aria-label="일지 찾기">${npi('search',18)}</button><button class="ib2" data-act="wl-set" aria-label="일지 설정">${npi('settings',18)}</button><button class="ib2" data-act="wl-close" aria-label="닫기">${npi('x',18)}</button></div>
    <div class="sub">${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]})${sh?` · <span class="${isRest(shiftOf(d))?'rst':''}">${esc(sh)}</span>`:''}</div>
    <div class="bd">${wlSecs().map(sec).join('')}</div>`;
}
// 전체 복사: "10/23(금) 야간" + 빈 줄 + 칸 이름 줄 · 글 (칸 사이 빈 줄 · 빈 칸 · 숨긴 칸은 뺌) → 카톡 등에 그대로 붙여 넣기
function wlCopyText(k){
  const d=parse(k),day=S.wlog.days[k]||{},sh=persOn(k)?'':shiftLabel(shiftOf(d));
  const parts=wlSecs().filter(sc=>String(day[sc.id]||'').trim()).map(sc=>sc.n+'\n'+String(day[sc.id]).replace(/\s+$/,''));
  return parts.length?`${d.getMonth()+1}/${d.getDate()}(${DOW[d.getDay()]})${sh?' '+sh:''}\n\n`+parts.join('\n\n'):'';
}
function wlGrow(t){t.style.height='auto';t.style.height=Math.max(64,Math.ceil(t.scrollHeight/32)*32)+'px';}   // v0.151 밑줄(32px)에 맞춰 늘어남   // 쓰는 만큼 칸이 늘어남
let wlSaveT=0;
function wlSetText(k,sid,v){   // 메모장 한 칸 저장 (비면 지움)
  v=cutMulti(String(v||''),4000).replace(/\s+$/,'');
  const d=(S.wlog.days[k]=S.wlog.days[k]||{});
  if(v.trim())d[sid]=v;else delete d[sid];
  if(!Object.keys(d).length)delete S.wlog.days[k];
}
// v0.127 이 날짜의 메모 칸만 (옆으로 미는 동안 붙어 있는 옆 날짜 칸은 빼기 — 옆 날짜 글이 이 날짜에 복사되던 버그)
const wlTas=k=>[...document.querySelectorAll('#pop .wlta')].filter(t=>t.dataset.k===k&&!t.closest('.swn'));
function wlCommitInputs(){   // 쓰던 칸 · 이름 저장
  const e=wlEd;if(!e)return;
  wlTas(e.k).forEach(t=>wlSetText(e.k,t.dataset.s,t.value));
  const r=$('#wlRen');if(r&&e.ren){const v=cutTxt(r.value,12).trim();if(v)S.wlog.name=v;e.ren=false;}
  clearTimeout(wlSaveT);save();
}
function wlClose(){
  wlCommitInputs();wlEd=null;closePop();
  render();if($('#sheet').classList.contains('open')&&sheetMode==='day'&&sheetKey)openDay(sheetKey);
}
function openWlSet(){
  const w=S.wlog;
  openPage(`${pageHead(esc(wlName())+' 설정')}<div class="pg-b np">
    <div class="pg-cap">이름</div>
    <div class="pg-sec pad"><div class="wlchips" style="margin-top:0">${WL_NAMES.map(n=>`<button class="${wlName()===n?'on':''}" data-act="wls-nm" data-v="${n}">${n}</button>`).join('')}${WL_NAMES.includes(wlName())?`<button class="own" data-act="wls-own">${npi('pencil',14)}직접 쓰기</button>`:`<button class="own on" data-act="wls-own">${npi('pencil',14)}${esc(wlName())}</button>`}</div></div>
    <div class="pg-cap">칸</div>
    <div class="pg-sec">${w.secs.map(sc=>`<div class="prow"><span class="wdot wk-${sc.id}"></span><input type="text" class="wls-in" id="wlsS_${sc.id}" maxlength="8" value="${esc(sc.n)}" aria-label="칸 이름"><label class="sw"><input type="checkbox" id="wlsV_${sc.id}" ${sc.h?'':'checked'} aria-label="보이기"><i></i></label></div>`).join('')}</div>
    <div class="pg-sec">${npRow('cloud-up','백업에 넣기',`<label class="sw"><input type="checkbox" id="wlsBk" ${w.backup?'checked':''}><i></i></label>`)}${npRow('search',esc(wlName())+' 찾기',npVal(''),{tap:1,act:'srch-open',attrs:' data-v="wl"'})}</div>
  </div>`,'wlset');
}
/* ---- 찾기: 메모(내 메모 · 볼 수 있는 가족 메모 · 포스트잇) / 업무 일지 ---- */
let srch={q:'',kind:'memo'},srchT=0;
function srchOpen(kind){
  srch.kind=wlOn()?(kind==='wl'?'wl':kind==='memo'?'memo':(S.srchKind||'memo')):'memo';
  if(wlEd){wlCommitInputs();wlEd=null;closePop();}
  renderSrch(true);
}
function srchRun(q,kind){
  q=String(q||'').trim().toLowerCase();if(!q)return [];
  const out=[],hit=t=>String(t||'').toLowerCase().includes(q);
  if(kind==='wl'){
    Object.keys(S.wlog.days).forEach(k=>{const d=S.wlog.days[k];wlSecs().forEach(sc=>wlLines(d[sc.id]).forEach(t=>{if(hit(t))out.push({k,kind:'wl',tag:sc.n,sid:sc.id,t});}));});
  }else{
    const ks=new Set(Object.keys(S.memos||{}));Object.values((S.fam2&&S.fam2.memos)||{}).forEach(v=>{if(v&&okDate(v.date))ks.add(v.date);});
    Object.values((S.fam2&&S.fam2.arch)||{}).forEach(a=>a.items.forEach(x=>ks.add(x.d)));
    ks.forEach(k=>{if(!okDate(k))return;visibleMemos(k).forEach(m=>{if(hit(m.text))out.push({k,kind:'memo',tag:m.shared?'♥ 가족':'🔒 나만',t:m.text});});});
    const mks=new Set(Object.keys(S.board||{}));piSrvList().forEach(x=>mks.add(x.mk));
    mks.forEach(mk=>{if(!/^\d{4}-\d\d$/.test(mk))return;boardList(mk).filter(n=>n.shared||n.by===role()).forEach(n=>{
      const t=piLabel(n)+(n.type==='list'&&n.lines.length?' · '+n.lines.map(l=>l.text).join(' · '):'');
      if(hit(n.title)||hit(n.text)||(n.lines||[]).some(l=>hit(l.text)))out.push({k:okDate(n.date)?n.date:mk+'-01',kind:'board',tag:'📝 포스트잇',t});});});
  }
  out.sort((a,b)=>a.k<b.k?1:a.k>b.k?-1:0);
  return out;
}
// v0.221 빈 화면: 최근 찾은 글자 · 내 메모(일지)에 자주 나오는 낱말 (둘 다 없으면 돋보기만)
function srchRecentAdd(q){q=String(q||'').trim().slice(0,30);if(!q)return;S.srchRecent=[q].concat((Array.isArray(S.srchRecent)?S.srchRecent:[]).filter(x=>x!==q)).slice(0,8);save();}
const SR_STOP=new Set(['오늘','내일','어제','그리고','하기','있음','없음','진짜','정말','이번','다음','지난','오전','오후','시간','같이','먼저','확인']);
function srchWords(kind){
  const texts=[];
  if(kind==='wl')Object.values((S.wlog&&S.wlog.days)||{}).forEach(d=>wlSecs().forEach(sc=>wlLines(d[sc.id]).forEach(t=>texts.push(t))));
  else{Object.keys(S.memos||{}).forEach(k=>{if(okDate(k))visibleMemos(k).forEach(m=>texts.push(m.text));});Object.values(S.board||{}).forEach(L=>(L||[]).forEach(n=>{texts.push(n.title||'');texts.push(n.text||'');(n.lines||[]).forEach(l=>texts.push(l.text));}));}
  const c=new Map();
  texts.slice(-3000).forEach(t=>{const seen=new Set();String(t||'').split(/[^0-9A-Za-z\uAC00-\uD7A3]+/).forEach(w=>{if(!/[\uAC00-\uD7A3A-Za-z]/.test(w))return;if(w.length>2)w=w.replace(/(에서|으로|에게|하고|이랑|은|는|이|가|을|를|에|도|와|과|로|의|랑)$/,'');if(w.length<2||w.length>8||SR_STOP.has(w)||seen.has(w))return;seen.add(w);c.set(w,(c.get(w)||0)+1);});});
  return [...c].filter(x=>x[1]>=2).sort((a,b)=>b[1]-a[1]).slice(0,8);
}
function srchIdleHtml(){
  const rc=Array.isArray(S.srchRecent)?S.srchRecent:[],ws=srchWords(srch.kind);
  if(!rc.length&&!ws.length)return `<div class="npempty" style="padding-top:48px"><div class="ei">${npi('search',26)}</div></div>`;
  return `${rc.length?`<div class="pg-cap srcap">최근 찾은 글자<button data-act="srch-rmall">모두 지우기</button></div><div class="srchips">${rc.map((x,i)=>`<span class="srchip"><button data-act="srch-q" data-v="${esc(x)}">${npi('clock',14)}${esc(x)}</button><button class="rm" data-act="srch-rm" data-i="${i}" aria-label="지우기">✕</button></span>`).join('')}</div>`:''}
    ${ws.length?`<div class="pg-cap">${srch.kind==='wl'?esc(wlName())+'에':'내 메모에'} 자주 나와요</div><div class="srchips">${ws.map(([w,n])=>`<button class="srchip w" data-act="srch-q" data-v="${esc(w)}">${esc(w)}<em>${n}</em></button>`).join('')}</div>`:''}`;
}
function srchSetQ(v){srch.q=v;const f=$('#srchQ');if(f)f.value=v;srchRefresh();}
function srchRefresh(){const r=$('#srchRes');if(r)r.innerHTML=srchResHtml();const q=srch.q.trim(),fd=document.querySelector('.srfield');if(fd)fd.classList.toggle('has',!!srch.q);
  document.querySelectorAll('.srbox .npseg button').forEach(b=>{const n=b.querySelector('.srn');if(n)n.textContent=q?String(srchRun(q,b.dataset.v).length):'';});
  const nm=document.querySelector('.srmag');if(nm&&!RMq()){try{nm.querySelector('svg').animate([{transform:'rotate(0)'},{transform:'rotate(-16deg)',offset:.2},{transform:'rotate(13deg)',offset:.4},{transform:'rotate(-8deg)',offset:.6},{transform:'rotate(4deg)',offset:.8},{transform:'rotate(0)'}],{duration:620,easing:'ease-in-out'});nm.querySelector('i').animate([{transform:'scale(0)'},{transform:'scale(0)',offset:.45},{transform:'scale(1.25)',offset:.75},{transform:'scale(1)'}],{duration:620,easing:'ease-out',fill:'backwards'});}catch(e){}}}
function srchResHtml(){
  const q=srch.q.trim();
  if(!q)return srchIdleHtml();
  const all=srchRun(q,srch.kind),r=all.slice(0,150);
  if(!r.length)return `<div class="srnone"><div class="srmag">${npi('search',34)}<i>?</i></div><b>'${esc(q.slice(0,20))}' 없어요</b></div>`;
  const ql=q.toLowerCase(),y0=new Date().getFullYear();
  const hl=t=>{const s=String(t).replace(/\s+/g,' '),i=s.toLowerCase().indexOf(ql);if(i<0)return esc(s.slice(0,90));const a=Math.max(0,i-20);return (a?'…':'')+esc(s.slice(a,i))+'<mark>'+esc(s.slice(i,i+q.length))+'</mark>'+esc(s.slice(i+q.length,i+q.length+70));};
  return `<div class="pg-cap">${all.length>150?`${all.length}개 중 최근 150개`:`${all.length}개`}</div><div class="pg-sec" style="margin-top:0;padding:0 12px">${r.map(x=>{const d=parse(x.k);
    return `<button class="srow" data-act="srch-go" data-k="${x.k}" data-kind="${x.kind}"><span class="sd">${d.getFullYear()!==y0?d.getFullYear()+'. ':''}${x.kind==='board'&&!x.t.includes('📅')&&x.k.endsWith('-01')?`${d.getMonth()+1}월`:`${d.getMonth()+1}/${d.getDate()} (${DOW[d.getDay()]})`}</span><span class="sg ${x.kind==='wl'?'wk-'+x.sid:''}">${esc(x.tag)}</span><span class="st">${hl(x.t)}</span></button>`;}).join('')}</div>`;
}
function renderSrch(focus){
  const q=srch.q.trim();
  const chips=wlOn()?`<div class="npseg">${[['memo','메모'],['wl',wlName()]].map(([v,l])=>`<button class="${srch.kind===v?'on':''}" data-act="srch-kind" data-v="${v}">${esc(l)} <span class="srn">${q?srchRun(q,v).length:''}</span></button>`).join('')}</div>`:'';
  openPage(`${pageHead(wlOn()?`메모 · ${esc(wlName())} 찾기`:'메모 찾기')}<div class="pg-b np"><div class="srbox"><div class="srfield ${srch.q?'has':''}">${npi('search',20)}<input type="search" id="srchQ" placeholder="찾을 글자" value="${esc(srch.q)}" enterkeyhint="search" aria-label="찾을 글자"><button class="srx" data-act="srch-clear" aria-label="지우기">✕</button></div>${chips}</div><div id="srchRes">${srchResHtml()}</div></div>`,'search');
  if(focus)setTimeout(()=>{const f=$('#srchQ');if(f)f.focus();},80);
}
/* ================= 포스트잇 가족 공유: households/{hid}/board/{내uid_포스트잇id} =================
 * 가족방에 있을 때 "♥ 가족" 포스트잇은 서버에 두고 폰엔 복사본(S.fam2.board) · "🔒 나만"은 지금처럼 폰에만.
 * 쓴 사람: 제목 · 내용 · 날짜 · 매달 · 지우기 / 가족 누구나: 줄 체크 · 줄 추가 · 떼기 · 반응.
 * 줄은 lines.{줄id} 로 따로 고침 → 둘이 동시에 다른 줄을 체크해도 안 덮임. 알림 없음(포스트잇 아이콘에 작은 점만). */
const PI_SRV_LINES=60;
function famCleanBoardDoc(v){   // (앱을 켤 때 normalize 가 먼저 부름 → 이 안에서는 아래쪽 const 를 쓰면 안 됨)
  if(!isObj(v)||!okId(v.by)||!/^\d{4}-\d\d$/.test(v.mk||''))return null;
  const o={by:v.by,byName:cutTxt(v.byName,12),mk:v.mk,type:v.type==='list'?'list':'note',title:cutTxt(v.title,30),text:cutMulti(v.text,500),
    date:okDate(v.date)?v.date:'',dateAuto:v.dateAuto!==false,repeat:!!v.repeat,rootId:okId(v.rootId)?v.rootId:'',torn:!!v.torn,tornAt:+v.tornAt||0,t:+v.t||0,
    reacts:{},lines:{},ua:+v.ua||0,ub:okId(v.ub)?v.ub:''};
  if(isObj(v.reacts))Object.keys(v.reacts).slice(0,12).forEach(u=>{const e=v.reacts[u];if(okId(u)&&typeof e==='string'&&e&&e.length<=8)o.reacts[u]=e;});
  if(isObj(v.lines))Object.keys(v.lines).slice(0,60).forEach(id=>{const l=v.lines[id];if(/^[A-Za-z0-9_]{1,40}$/.test(id)&&isObj(l))o.lines[id]={x:cutTxt(l.x,60),d:!!l.d,b:okId(l.b)?l.b:'',o:Number.isFinite(+l.o)?+l.o:0};});
  return o;
}
const piMe=()=>(S.link&&S.link.uid)||(S.fam2&&S.fam2.boardMe)||'';
const piWho=u=>!u?'':u===piMe()?role():'u:'+u;   // 서버 uid → 포스트잇 화면의 "누구"(나는 role())
const piUid=w=>!w?'':w===role()?piMe():String(w).startsWith('u:')?String(w).slice(2):'';
let piSrvCache={};
function piAdapt(id,v){
  const lines=Object.entries(v.lines).sort((a,b)=>a[1].o-b[1].o||(a[0]<b[0]?-1:1)).map(([lid,l])=>({id:lid,text:l.x,done:l.d,doneBy:l.d?piWho(l.b):''}));
  const reacts={};Object.entries(v.reacts).forEach(([u,e])=>{reacts[piWho(u)]=e;});
  return {_v:v,srv:id,mk:v.mk,id:id.slice(id.indexOf('_')+1),type:v.type,title:v.title,text:v.text,lines,shared:true,by:piWho(v.by),color:'y',
    repeat:v.repeat,dateAuto:v.dateAuto,date:v.date,rootId:v.rootId,reacts,torn:v.torn,tornAt:v.tornAt,t:v.t};
}
function piSrvList(){   // 서버 포스트잇을 포스트잇 모양으로 (서버 값이 그대로면 같은 객체를 계속 씀 → 화면에서 고친 값이 남음)
  const B=(S&&S.link&&S.fam2&&S.fam2.board)||{},out=[];
  for(const id in B){let a=piSrvCache[id];if(!a||a._v!==B[id]){a=piAdapt(id,B[id]);piSrvCache[id]=a;}out.push(a);}
  for(const id in piSrvCache)if(!B[id])delete piSrvCache[id];
  return out;
}
// 포스트잇 → 서버 모양 (base: 서버에 있는 것 · 줄 순서는 있던 건 그대로, 새 줄은 맨 뒤)
function piShape(n,base,mk){
  const me=piMe();let mo=-1,k=0;if(base)Object.values(base.lines).forEach(l=>{if(l.o>mo)mo=l.o;});
  const lines={};
  (n.lines||[]).slice(0,PI_SRV_LINES).forEach((l,i)=>{const lid=/^[A-Za-z0-9_]{1,40}$/.test(l.id||'')?l.id:(l.id=uid());const b0=base&&base.lines[lid];
    lines[lid]={x:cutTxt(l.text,60),d:!!l.done,b:l.done?(piUid(l.doneBy)||me):'',o:b0?b0.o:(base?mo+1+(k++):i)};});
  const reacts={};Object.entries(n.reacts||{}).forEach(([w,e])=>{const u=piUid(w);if(u&&e)reacts[u]=String(e).slice(0,8);});
  return {by:base?base.by:me,byName:base?base.byName:cutTxt(S.link.name,12),mk:base?base.mk:mk,type:n.type==='list'?'list':'note',title:cutTxt(n.title,30),text:cutMulti(n.text,500),
    date:okDate(n.date)?n.date:'',dateAuto:n.dateAuto!==false,repeat:!!n.repeat,rootId:okId(n.rootId)?n.rootId:'',torn:!!n.torn,tornAt:+n.tornAt||0,t:base?base.t:(+n.t||Date.now()),reacts,lines,ua:Date.now(),ub:me};
}
const piWarned={};
function piWarn(k,e){if(piWarned[k])return;piWarned[k]=1;setTimeout(()=>{delete piWarned[k];},60000);const c=String((e&&e.code)||(e&&e.message)||e);toast(c.includes('permission-denied')?'가족 포스트잇을 고치지 못했어요 (권한 없음)':'가족 포스트잇을 고치지 못했어요 · '+fbErrText(e));}
// 가족 포스트잇을 고쳤을 때: 바뀐 곳만 서버로 (쓴 사람이 아니면 줄 · 떼기 · 반응만)
function piSrvPush(n){
  if(!n||!n.srv||!S.link||!S.fam2||!S.fam2.board)return;
  const id=n.srv,base=S.fam2.board[id];if(!base)return;
  const me=piMe(),own=base.by===me,tgt=piShape(n,base),ch={},del=[];
  if(own)['type','title','text','date','dateAuto','repeat','rootId'].forEach(k=>{if(tgt[k]!==base[k])ch[k]=tgt[k];});
  ['torn','tornAt'].forEach(k=>{if(tgt[k]!==base[k])ch[k]=tgt[k];});
  const nl=Object.assign({},base.lines);
  Object.keys(tgt.lines).forEach(lid=>{const a=tgt.lines[lid],b=base.lines[lid];
    if(!b){ch['lines.'+lid]=a;nl[lid]=a;return;}
    const c={...b};if(a.d!==b.d||a.b!==b.b){ch['lines.'+lid+'.d']=a.d;ch['lines.'+lid+'.b']=a.b;c.d=a.d;c.b=a.b;}
    if(own&&a.x!==b.x){ch['lines.'+lid+'.x']=a.x;c.x=a.x;}nl[lid]=c;});
  Object.keys(base.lines).forEach(lid=>{if(!tgt.lines[lid]){del.push('lines.'+lid);delete nl[lid];}});
  const rx=Object.assign({},base.reacts),myR=tgt.reacts[me]||'';
  if(myR!==(base.reacts[me]||'')){if(myR)rx[me]=myR;else delete rx[me];}
  const rxCh=myR!==(base.reacts[me]||'');
  if(!Object.keys(ch).length&&!del.length&&!rxCh)return;
  const nv={...base,...(own?{type:tgt.type,title:tgt.title,text:tgt.text,date:tgt.date,dateAuto:tgt.dateAuto,repeat:tgt.repeat,rootId:tgt.rootId}:{}),torn:tgt.torn,tornAt:tgt.tornAt,lines:nl,reacts:rx,ua:Date.now(),ub:me};
  S.fam2.board[id]=nv;n._v=nv;piSrvCache[id]=n;famSaveLocal();   // 화면은 바로 (서버는 뒤에서)
  famReady().then(({F,db})=>{
    if(!S.link)return;
    const patch={...ch,ua:F.serverTimestamp(),ub:me};del.forEach(k=>{patch[k]=F.deleteField();});
    if(rxCh)patch['reacts.'+me]=myR?myR:F.deleteField();
    return F.updateDoc(F.doc(db,'households',S.link.hid,'board',id),patch);
  }).catch(e=>piWarn('u'+id,e));
}
async function piSrvCreate(n,mk){   // 내 폰의 가족 포스트잇 → 서버로 옮김 (올라가면 폰 쪽 원본은 지움)
  const me=piMe(),id=me+'_'+n.id,tgt=piShape(n,null,mk);
  const {F,db}=await famReady();if(!S.link||S.link.uid!==me)return;
  if(n.cnt){const b=F.writeBatch(db);b.set(F.doc(db,'households',S.link.hid,'board',id),{...tgt,ua:F.serverTimestamp()});b.update(famMember(F,db,S.link.hid,me),{sent:F.increment(1)});await b.commit();}   // 새로 붙인 가족 포스트잇 = 무료 횟수 1건
  else await F.setDoc(F.doc(db,'households',S.link.hid,'board',id),{...tgt,ua:F.serverTimestamp()});   // 매달 반복 · 가족방 들어오기 전에 쓴 것은 횟수 없이
  if(!S.link)return;
  S.fam2.board[id]=S.fam2.board[id]||tgt;
  S.board[mk]=(S.board[mk]||[]).filter(x=>x.id!==n.id);
  if(piEd&&!piEd.isNew&&piEd.id===n.id){}   // 열린 창은 같은 id 로 서버 것을 계속 봄
  save();
}
function piSrvDelete(n){
  const id=n.srv;if(!id||!S.link)return;
  delete S.fam2.board[id];famSaveLocal();
  famReady().then(({F,db})=>S.link&&F.deleteDoc(F.doc(db,'households',S.link.hid,'board',id))).catch(e=>piWarn('d'+id,e));
}
// 가족 → 나만 (쓴 사람만): 서버 것을 내 폰으로 되돌리고 서버에서 지움
function piLocalCopy(a,shared){
  return {id:a.id,type:a.type,title:a.title,text:a.text,lines:a.lines.map(l=>({id:l.id,text:l.text,done:l.done,doneBy:l.done?l.doneBy:''})),shared,by:role(),color:'y',
    repeat:a.repeat,dateAuto:a.dateAuto,date:a.date,rootId:a.rootId,reacts:{},torn:a.torn,tornAt:a.tornAt,t:a.t};
}
function piUnshare(a){
  if(!a.srv||a.by!==role())return null;
  const c=piLocalCopy(a,false),mk=a.mk;(S.board[mk]=S.board[mk]||[]).push(c);
  piSrvDelete(a);save();return c;
}
// 가족방을 떠날 때: 내가 쓴 가족 포스트잇은 내 폰으로 되돌려 둠 (가족 것은 사라짐)
function piSrvToLocal(){
  const me=piMe(),B=(S.fam2&&S.fam2.board)||{};
  Object.keys(B).forEach(id=>{const v=B[id];if(!me||v.by!==me)return;const a=piAdapt(id,v),mk=v.mk;
    const list=(S.board[mk]=S.board[mk]||[]);if(!list.some(x=>x.id===a.id))list.push(piLocalCopy(a,true));});
}
var piBusy={};
async function famSyncBoard(){   // 폰에만 있는 내 "♥ 가족" 포스트잇 → 서버로 (새로 쓴 것 · 가족방에 들어오기 전에 쓴 것 · 매달 반복 · 옮긴 할 일)
  if(!S.link||!fbCfg()||!S.link.uid||!S.fam2)return;
  S.fam2.board=S.fam2.board||{};S.fam2.boardMe=S.link.uid;
  const r=role(),me=S.link.uid;
  for(const mk of Object.keys(S.board||{})){
    for(const n of (S.board[mk]||[]).slice()){
      if(!n.shared||n.by!==r||!/^[A-Za-z0-9]{1,40}$/.test(String(n.id)))continue;
      const key=mk+'/'+n.id;if(piBusy[key])continue;
      if(S.fam2.board[me+'_'+n.id]){S.board[mk]=(S.board[mk]||[]).filter(x=>x!==n);famSaveLocal();continue;}   // 이미 올라감
      piBusy[key]=1;
      try{await piSrvCreate(n,mk);}catch(e){piWarn('c'+key,e);}finally{delete piBusy[key];}
    }
  }
}
let piSoonT=0;
function famSyncBoardSoon(){clearTimeout(piSoonT);piSoonT=setTimeout(()=>{famSyncBoard().then(()=>{if(pageMode==='board'&&!piEd)openBoard();}).catch(()=>{});},300);}
function famOnBoard(snap){
  if(!S.link)return;
  const me=S.link.uid,old=S.fam2.board||{},m={};
  snap.docs.forEach(d=>{const v=d.data({serverTimestamps:'estimate'})||{};const c=okId(d.id)?famCleanBoardDoc({...v,ua:tsMs(v.ua)||+v.ua||0}):null;if(c)m[d.id]=c;});
  Object.keys(m).forEach(id=>{const o=old[id];if(o&&JSON.stringify({...o,ua:0})===JSON.stringify({...m[id],ua:0}))m[id]=o;});   // 그대로면 같은 객체 (화면 다시 안 만듦)
  if(!snap.metadata.fromCache){
    const seen=+S.fam2.boardSeen||0;let mx=seen,dot=false;
    Object.values(m).forEach(v=>{if(v.ua>seen&&v.ub&&v.ub!==me)dot=true;if(v.ua>mx)mx=v.ua;});
    // v0.96 가족이 새로 붙임 · 줄 추가 · 할 일이 다 끝남 → 앱 안 알림(띠) · 체크만 한 건 점만 (폰 알림은 서버가)
    if(S.fam2.boardInit&&S.pushBoard!==false)Object.keys(m).forEach(id=>{const v=m[id],o=old[id];if(!v.ub||v.ub===me||v.torn||(o&&o.ua>=v.ua))return;
      const tt=(v.title||(v.type==='list'?'할 일':'포스트잇')).slice(0,12),who=famNameOf(v.ub);
      const ids=Object.keys(v.lines),done=ids.length>0&&ids.every(k=>v.lines[k].d),oDone=o&&Object.keys(o.lines).length>0&&Object.keys(o.lines).every(k=>o.lines[k].d);
      if(!o){if(!(+v.t)||Date.now()-v.t<6*36e5)pushEvent(role(),'board',v.mk,`📝 ${who}님이 포스트잇을 붙였어요 · ${tt}`);}
      else if(v.type==='list'&&done&&!oDone)pushEvent(role(),'board',v.mk,`✅ "${tt}" 다 끝났어요`);
      else{const add=ids.filter(k=>!o.lines[k]).length;if(add)pushEvent(role(),'board',v.mk,`📝 ${who}님이 "${tt}"에 ${add}줄을 더했어요`);}});
    if(!S.fam2.boardInit){S.fam2.boardInit=1;S.fam2.boardSeen=mx;dot=false;}
    if(dot&&pageMode!=='board')S.fam2.boardDot=1;
    if(pageMode==='board')S.fam2.boardSeen=mx;
  }
  S.fam2.board=m;S.fam2.boardMe=me;famSaveLocal();
  if(pageMode==='board'){if(!piEd)openBoard();else if(!piEd.isNew&&!($('#pop').contains(document.activeElement)&&/INPUT|TEXTAREA/.test(document.activeElement.tagName)))renderPiEd();}
  else famRefreshUi();
  famSyncBoard().catch(()=>{});
}
function famClearNotify(mid){
  let hit=false;Object.keys(S.memos||{}).forEach(k=>(S.memos[k]||[]).forEach(m=>{if(m.id===mid&&m.notify){delete m.notify;hit=true;}}));
  if(hit)famSaveLocal();
}
function famOnMemos(snap){
  const m={};
  snap.docs.forEach(d=>{const v=d.data(),c=okId(d.id)?famCleanMemo(v,tsMs(v.createdAt)||Date.now()):null;if(c)m[d.id]=c;});
  const L=S.link;if(!L)return;
  if(!snap.metadata.fromCache)famMarkSync();
  if(!snap.metadata.fromCache){
    const seen=new Set(S.fam2.seenMemo||[]),rv=S.fam2.memoRev||{};
    if(S.fam2.init){
      Object.keys(m).forEach(id=>{
        if(m[id].by===L.uid||S.syncSettings.receiveFamilyMemo===false)return;
        if(m[id].moved)return;   // 옮겨 온 옛 메모는 알리지 않음
        if(!seen.has(id))pushEvent('host','memo',m[id].date,`♥ ${m[id].byName}님이 ${md(m[id].date)}에 메모를 남겼어요: "${firstLine(m[id].text).slice(0,24)}"`);
        else if(m[id].rev>(rv[id]||0))pushEvent('host','memo',m[id].date,`✏️ ${m[id].byName}님이 ${md(m[id].date)} 메모를 고쳤어요: "${firstLine(m[id].text).slice(0,24)}"`);
      });
    }
    S.fam2.seenMemo=Object.keys(m).concat((S.fam2.seenMemo||[]).filter(id=>!m[id])).slice(-300);
    S.fam2.memoRev=Object.fromEntries(Object.entries(m).map(([id,v])=>[id,v.rev]));
    S.fam2.init=true;
  }
  S.fam2.memos=m;famSaveLocal();famRefreshUi();famSyncMemos().catch(()=>{});
}
// 서버에서 온 남의 가족 메모 (그 날짜): 지금 메모 목록에 같이 보여줌
function famRemoteMemos(k){
  const L=S.link;if(!L||!S.fam2)return [];
  const out=Object.entries(S.fam2.memos||{}).filter(([id,v])=>v.date===k&&v.by!==L.uid)
    .map(([id,v])=>({id:'s:'+id,sid:id,text:v.text,shared:true,by:'u:'+v.by,t:v.t,srv:true,time:v.time||'',al:v.al||'',...(v.todo?{todo:true,done:!!v.done}:{}),...(v.till?{till:v.till,pc:v.pc||''}:{})}));   // 할 일 · 완료: 보기만
  Object.entries(S.fam2.arch||{}).forEach(([aid,a])=>{if(a.by===L.uid)return;a.items.forEach((x,i)=>{if(x.d===k)out.push({id:'a:'+aid+':'+i,text:x.t,shared:true,by:'u:'+a.by,t:0,srv:true,arch:true,time:x.tm||'',al:''});});});   // 옮겨 온 옛 메모 (보기만)
  return out;
}
// ---- 근무 요청: 받은 것 · 보낸 것
function famMirrorList(f){   // 서버에서 받은 요청(받은 것 · 보낸 것)을 요청 목록 모양으로
  const map=(id,v,dir)=>({id,srv:true,dir,date:v.date,want:v.want,msg:v.msg||'',st:v.st,reply:v.reply||'',held:!!v.held,mode:v.mode||null,prev:v.prev||null,grp:v.grp||'',gn:v.gn||1,lead:!!v.lead,
    t:v.t,tu:v.u||v.t,peer:dir==='in'?v.from:v.to,peerName:famAka(dir==='in'?v.from:v.to,dir==='in'?v.fromName:v.toName),by:dir==='in'?'guest':'host'});
  const out=[];
  Object.entries((f&&f.reqIn)||{}).forEach(([id,v])=>out.push(map(id,v,'in')));
  Object.entries((f&&f.reqOut)||{}).forEach(([id,v])=>out.push(map(id,v,'out')));
  return out;
}
function famMirrorReqs(){
  if(!S.link)return;
  {const prev={};(S.requests||[]).forEach(r=>{if(r.srv)prev[r.id]=r.st;});
  S.requests=(S.requests||[]).filter(r=>!r.srv).concat(famMirrorList(S.fam2));
  if(S.fam2&&S.fam2.init)S.requests.forEach(r=>{if(!r.srv)return;const o=prev[r.id];if(o===r.st)return;const a=o===undefined?'req':r.st;if(o===undefined&&r.st!=='pending')return;chLogAdd({t:+(o===undefined?r.t:r.tu)||Date.now(),k:r.date,w:(a==='req')===(r.dir==='in')?(r.peerName||'가족'):'나',a,want:r.want?String(shiftLabel(r.want)):'',dir:r.dir});});}   // v0.135 근무 바뀐 기록
}
function famOnReqs(field,snap){
  const L=S.link;if(!L)return;
  if(!snap.metadata.fromCache)famMarkSync();
  const prev=S.fam2[field]||{},m={};
  snap.docs.forEach(d=>{const v=d.data(),c=okId(d.id)?famCleanReq(v,tsMs(v.createdAt)||Date.now(),tsMs(v.updatedAt)||0):null;if(c)m[d.id]=c;});
  if(!snap.metadata.fromCache&&S.fam2.init){
    const when=n=>{if(!n.grp)return `${+n.date.slice(8)}일`;const ds=Object.values(m).filter(x=>x.grp===n.grp).map(x=>x.date);return `${dateRangeText(ds)} (${ds.length}일)`;};
    Object.keys(m).forEach(id=>{
      const n=m[id],o=prev[id];
      if(n.grp&&!n.lead)return;   // 여러 날 요청은 첫 요청 하나만 소식으로
      if(field==='reqIn'){
        if(!o&&n.st==='pending')pushEvent('host','req',n.date,`${n.fromName}${iga(n.fromName)} ${when(n)} ${n.want} 요청해요`);
      }else if(o&&(o.st!==n.st||o.held!==n.held)){
        const who=n.toName+iga(n.toName),d=when(n),rp=n.reply?' · '+firstLine(n.reply).slice(0,24):'';
        if(n.st==='accepted')pushEvent('host','reply',n.date,`🟢 ${who} ${d} ${n.want} 요청을 수락했어요${rp}`);
        else if(n.st==='rejected')pushEvent('host','reply',n.date,`🔴 ${who} ${d} ${n.want} 요청을 거절했어요${rp}`);
        else if(n.st==='pending'&&n.held)pushEvent('host','reply',n.date,`🟡 ${who} ${d} ${n.want} 요청을 보류했어요${rp}`);
        else if(n.st==='applied')pushEvent('host',o.st==='pending'?'reply':'apply',n.date,o.st==='pending'?`🟢 ${who} ${d} ${n.want} 요청을 수락했어요 · 근무가 바뀌었어요${rp}`:`✅ ${who} ${d} 근무를 바꿨어요`);
      }
    });
  }
  S.fam2[field]=m;famMirrorReqs();famSaveLocal();famRefreshUi();
}
// "가족 모두에게도 알리기"로 온 요청: 소식에 한 줄만 (알림만 · 답은 받는 사람이)
function famOnCc(snap){
  const L=S.link;if(!L)return;
  const prev=S.fam2.reqCc||{},m={};
  snap.docs.forEach(d=>{const c=okId(d.id)?famCleanCc(d.data()):null;if(c)m[d.id]=c;});
  if(snap.metadata.fromCache)return;
  if(S.fam2.init)Object.keys(m).forEach(id=>{
    if(prev[id])return;const n=m[id];if(n.grp&&!n.lead)return;
    const ds=n.grp?Object.values(m).filter(x=>x.grp===n.grp).map(x=>x.date):[n.date];
    pushEvent('host','cc',n.date,`${n.fromName}${iga(n.fromName)} ${n.toName}에게 ${ds.length>1?`${dateRangeText(ds)} (${ds.length}일)`:md(n.date)} ${n.want} 요청했어요`);
  });
  S.fam2.reqCc=m;famSaveLocal();famRefreshUi();
}
async function famSendReqs(toUid,dates,want,msg,cc){
  track('request_send');
  const {F,db,uid}=await famReady();const hid=S.link.hid;
  const col=F.collection(db,'households',hid,'requests'),b=F.writeBatch(db),n=dates.length;
  const grp=n>1?F.doc(col).id:'';
  dates.forEach((date,i)=>{
    const d0={from:uid,to:toUid,fromName:S.link.name,toName:famNameOf(toUid),date,want,msg:String(msg||'').slice(0,60),st:'pending',reply:'',held:false,createdAt:F.serverTimestamp(),updatedAt:F.serverTimestamp()};
    if(cc&&cc.length)d0.cc=cc.slice(0,3);   // "가족 모두에게도 알리기": 알림만 받는 가족
    if(n>1){d0.grp=grp;d0.gn=n;if(i===0)d0.lead=true;}   // 여러 날 요청: 같은 묶음 · 첫 요청만 소식 · 횟수는 묶음 1건
    b.set(F.doc(col),d0);
  });
  b.update(famMember(F,db,hid,uid),{sent:F.increment(1)});
  return b.commit();
}
// v0.158 요청을 못 보냈을 때 이유 (권한 없음 = 무료 횟수 끝 · 가족방 연결 풀림)
const famReqErr=e=>{const c=String((e&&e.code)||(e&&e.message)||e);return '요청을 보내지 못했어요. '+(c.includes('permission-denied')?'무료 횟수를 다 썼거나 가족방 연결이 풀렸을 수 있어요':fbErrText(e));};
function famReqPush(r,patch){
  if(!r||!r.srv||!S.link||!fbCfg())return;
  famReady().then(({F,db})=>F.updateDoc(F.doc(db,'households',S.link.hid,'requests',r.id),{...patch,updatedAt:F.serverTimestamp()}))
    .catch(e=>toast('답을 전하지 못했어요. '+famErr(e)));
}
// 달력 칸 링 (요청 상태): 답할 요청(주황) · 보류(청록) · 승인(초록) · 거절(빨강)
function rqRing(list){
  // 끝난 요청 링: 승인은 하루(근무가 바뀐 걸 칸이 알려줌) · 거절은 3일(놓치기 쉬움) · 받는 사람이 처리한 건 바로 사라짐 (내가 한 일이라 이미 앎)
  const now=Date.now(),recent=(r,d)=>(r.srv&&r.dir==='in')?false:now-(r.tu||r.t||0)<d*864e5;
  if(list.some(r=>r.st==='pending'&&!r.held))return 'rq-ask';
  if(list.some(r=>r.st==='pending'&&r.held))return 'rq-hold';
  if(list.some(r=>r.st==='accepted'&&recent(r,1)))return 'rq-ok';
  if(list.some(r=>r.st==='rejected'&&recent(r,3)))return 'rq-no';
  return '';
}
/* ---- 여러 날 요청 묶음(grp): 같은 묶음의 요청은 한 줄로 보이고 한 번에 답해요 ---- */
const grpItems=r=>(r&&r.grp)?(S.requests||[]).filter(x=>x.srv&&x.grp===r.grp&&x.dir===r.dir).sort((a,b)=>a.date.localeCompare(b.date)):[r];
const reqUniq=list=>{const seen=new Set();return list.filter(r=>{if(!r.grp)return true;const k=r.grp+r.dir;if(seen.has(k))return false;seen.add(k);return true;});};
function dateRangeText(ds){   // 10/31~11/2 · 떨어진 날은 10/31 · 11/2 · 11/5 (4일 넘으면 외 N일)
  ds=[...ds].sort();if(ds.length<2)return ds.length?md(ds[0]):'';
  let run=true;for(let i=1;i<ds.length;i++)if(addK(ds[i-1],1)!==ds[i])run=false;
  if(run)return `${md(ds[0])}~${md(ds[ds.length-1])}`;
  return ds.length<=3?ds.map(md).join(' · '):`${ds.slice(0,3).map(md).join(' · ')} 외 ${ds.length-3}일`;
}
function famInCounts(){
  if(!S.link)return {ask:0,hold:0};
  const ins=reqUniq((S.requests||[]).filter(r=>(!r.srv||r.dir==='in')&&r.st==='pending'&&(!S.link||r.srv)).sort((a,b)=>a.date.localeCompare(b.date)));
  return {ask:ins.filter(r=>!r.held).length,hold:ins.filter(r=>r.held).length};
}
// 🔔 소식 › 근무 요청 탭: 답할 요청 / 보류 중 (줄을 누르면 그 날짜 달력으로)
function reqTabBody(){
  const ins=reqUniq(S.requests.filter(r=>r.srv&&r.dir==='in'&&r.st==='pending').sort((a,b)=>a.date.localeCompare(b.date)));
  const row=r=>{
    const its=grpItems(r),n=its.length,when=n>1?`${dateRangeText(its.map(x=>x.date))} (${n}일)`:`${+r.date.slice(8)}일`;
    return `<div class="ev ${r.held?'':'new'}" data-act="req-go" data-k="${r.date}">
      <div class="ic">📩</div>
      <div class="tx"><b>${esc(r.peerName)}</b>${iga(r.peerName)} ${when} ${esc(r.want)} 요청해요
        ${r.msg?`<div class="q">“${esc(r.msg)}”</div>`:''}
        ${r.held?'<span class="mq-tag hold">⏳ 보류 중</span>':''}
        <div class="btns"><button class="ok" data-act="rq-go" data-id="${r.id}">📅 달력에서 보기 ›</button></div>
        <small>${rel(r.t)}</small></div>
    </div>`;};
  const ask=ins.filter(r=>!r.held),hold=ins.filter(r=>r.held);
  return `${ask.length?`<div class="feed-day">답할 요청 <b class="gcnt">${ask.length}</b></div>${ask.map(row).join('')}`:''}
    ${hold.length?`<div class="feed-day">보류 중 <b class="gcnt">${hold.length}</b></div>${hold.map(row).join('')}`:''}
    ${ins.length?'':'<div class="mempty" style="padding:30px 0;text-align:center">답할 요청이 없어요</div>'}`;
}
function copyText(t){
  try{if(hasBridge('copyText')){window.AndroidBridge.copyText(t);toast('복사했어요');return;}}catch(e){}
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(()=>toast('복사했어요'),()=>copyOld(t));return;}}catch(e){}
  copyOld(t);
}
function copyOld(t){try{const a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();toast('복사했어요');}catch(e){toast('복사하지 못했어요');}}
const famShareMsg=(code,host)=>`[언제쉬어] ${host}님이 근무표 가족방에 초대했어요 💜\n\n초대 코드: ${famFmt(code)}\n(${FAM_DAYS}일 안에 사용해 주세요)\n\n앱을 설치하고 처음 화면에서 "초대 코드가 있어요"를 눌러 코드를 넣어 주세요.`;
function famShare(code){
  const msg=famShareMsg(code,S.link?S.link.name:'근무자');
  if(hasBridge('shareText')){window.AndroidBridge.shareText('가족 초대',msg);return;}
  if(navigator.share){navigator.share({text:msg}).catch(()=>{});return;}
  copyText(msg);
}
const daysLeft=ms=>Math.max(0,Math.ceil((ms-Date.now())/864e5));

/* ----- 가족 연결 화면 ----- */
let famUi={st:'idle',members:[],invites:[],err:'',lastLink:null};
async function famRefresh(){
  famUi.st='loading';famUi.err='';
  try{
    const r=await famSync();
    if(r.had&&!r.link)toast('가족방에서 나온 상태예요 (내보내졌거나 없어졌어요)');
    famUi.members=S.link?await famMembers(S.link.hid):[];
    famUi.invites=S.link?await famMyInvites():[];   // v0.96 누구나 초대
    famUi.st='ok';
  }catch(e){famUi.st='err';famUi.err=famErr(e);}
  if(pageMode==='link')renderLinkPage();
}
function openLinkPage(){famUi.st='loading';renderLinkPage();famRefresh();}
function lav(n,i){const h=[...String(n)].reduce((a,c)=>a+c.charCodeAt(0),i||0)*47%360;return `<span class="lav" style="background:hsl(${h} 55% 52%)">${esc(String(n).slice(0,1)||'?')}</span>`;}
// 가족방 연결이 끊겼을 때 안내(끊긴 사실 · 왜 · 어떻게 다시 붙일지). 방장 로그인 번호가 바뀌면 같은 방으로는 못 돌아가서 "새 방 + 가족이 새 코드로 옮기기"가 가장 확실함
function lostCard(){
  const x=S.linkLost;if(!x)return '';
  const ago=x.at?Math.max(0,Math.round((Date.now()-x.at)/864e5)):0,when=ago>0?`${ago}일 전`:'방금';
  const host=x.role==='host';
  return `<div class="pg-sec lost-card" style="margin-top:12px;padding:16px"><b style="font-size:15px">⚠ 가족방 연결이 끊어졌어요</b>
    <div class="hint" style="padding:6px 0 10px;line-height:1.7">${host?'내가 방장이던':'내가 참여하던'} 가족방과 서버의 연결이 ${when} 끊어졌어요. 내 근무표 · 메모는 이 폰에 그대로 있어요.<br>${host?'앱 로그인 정보가 바뀌면 이렇게 돼요. 가족방에 남은 가족에게 <b>새 초대 코드</b>를 받아 다시 들어가면 돼요 (가족이 없으면 새 가족방을 만들어요).':'가족이 내보냈거나 가족방이 없어졌을 수 있어요. 가족에게 새 초대 코드를 받아서 다시 참여해요.'}</div>
    <button class="btn" style="width:100%" data-act="link-join">새 초대 코드로 참여하기</button>${host?`<button class="btn ghost" style="width:100%;margin-top:8px" data-act="link-invite">새 가족방 만들고 초대하기</button>`:''}
    <button class="btn ghost" style="width:100%;margin-top:8px" data-act="lost-dismiss">이 안내 닫기</button></div>`;
}
function renderLinkPage(){
  const L=S.link,u=famUi,host=L&&L.role==='host';
  const guests=u.members.filter(m=>m.role==='guest');
  let body='';
  if(u.st==='loading')body=`<div class="hint keep" style="padding:30px 16px;text-align:center">불러오는 중…</div>`;
  else if(u.st==='err')body=`<div class="hint keep" style="padding:16px;color:var(--danger)">${esc(u.err)}</div><div style="padding:0 16px"><button class="btn" style="width:100%" data-act="link-retry">다시 시도</button></div>`;
  else if(!L)body=`${lostCard()}<div class="pg-sec" style="margin-top:12px;padding:18px 16px">
      <b style="font-size:16px">가족과 같이 보려면</b>
      <div class="hint keep" style="padding:6px 0 14px"><b>초대 코드</b>를 보내면 가족이 코드를 넣고 참여해요 · 가족방은 5명까지예요</div>
      <button class="btn" style="width:100%" data-act="link-invite">가족 초대하기</button>
      <button class="btn ghost" style="width:100%;margin-top:8px" data-act="link-join">초대 코드가 있어요</button>
      ${googleOn()?'<button class="btn ghost" style="width:100%;margin-top:8px" data-act="g-restore">전에 쓰던 폰의 가족방 불러오기 (구글 로그인)</button>':''}
    </div>`;
  else{
    const me=L.uid,full=u.members.length>=FAM_MAX+1,alone=u.members.length<=1;
    const sub=m=>{const d=Math.floor((Date.now()-(famMs(m.seenAt)||famMs(m.joinedAt)||Date.now()))/864e5),k=m.uid!==me&&famKickLive(m.uid);
      return `${m.role==='host'&&!famView()?'근무자':famModeTxt(m)}${d>=30?' · <b style="color:var(--danger)">30일 넘게 안 들어옴</b>':d>=7?` · ${d}일째 안 들어옴`:''}${k?` · 🗳 내보내기 찬성 ${k.votes.length}/${famKickNeed(m.uid,k.inact||[])}`:''}`;};
    body=`<div class="pg-cap">우리 가족방 · ${u.members.length}/${FAM_MAX+1}명</div>
    <div class="pg-sec famsec">${u.members.map((m,i)=>`<div class="prow ${m.uid===me?'':'tap'}" ${m.uid===me?'':`data-act="mem-menu" data-u="${esc(m.uid)}"`}>${lav(famAka(m.uid,m.name),i)}<div class="pl2">${esc(famAka(m.uid,m.name))}${m.role==='host'?' <span class="me host">방장</span>':''}${m.uid===me?' <span class="me">나</span>':''}${m.uid!==me&&S.famAlias&&S.famAlias[m.uid]?`<span style="font-size:12px;color:var(--muted);font-weight:600"> · ${esc(m.name)}</span>`:''}<small class="keep">${sub(m)}</small></div>${m.uid===me?'':'<span class="muted">›</span>'}</div>`).join('')}
      ${full?'<div class="prow"><div class="pl2 muted" style="text-align:center">가족 자리가 가득 찼어요</div></div>':`<div class="invb"><button class="btn" data-act="link-invite">${npi('plus',18)}가족 초대하기</button></div>`}
    </div>
    <div class="pg-sec" style="margin-top:12px">${npRow('users','가족 목록',npVal(`${(S.family||[]).length}명`),{tap:1,act:'fam-set'})}</div>   <!-- v0.156 설정 "가족" 한 칸 → 앱 없는 가족(가족 목록)은 여기서 -->
    ${u.invites.length?`<div class="pg-cap">내가 보낸 초대 코드 (쓰면 사라져요)</div><div class="pg-sec" style="margin-top:0">${u.invites.map(v=>`<div class="prow"><div class="pl2"><b class="mono">${famFmt(v.code)}</b><small class="keep">${esc(v.name||'호칭 미정')} · ${daysLeft(v.exp)}일 남음</small></div><button class="btn ghost sm" data-act="inv-share" data-c="${v.code}">보내기</button><button class="xbtn" data-act="inv-del" data-c="${v.code}" aria-label="코드 지우기">✕</button></div>`).join('')}</div>`:''}
    ${host?(S.myset?`<div class="pg-sec" style="margin-top:16px">${stkRow()}</div>`:''):`<div class="pg-sec" style="margin-top:16px"><div class="prow"><div class="pl2">내 근무표를 가족에게 보여요<small>끄면 가족 근무표만 보고, 달력 탭이 가족 달력으로 바뀌어요</small></div><label class="sw"><input type="checkbox" id="famOwn" ${L.mode==='view'?'':'checked'}><i></i></label></div>${!S.myset&&L.mode!=='view'?'<div class="prow tap" data-act="mk-sched" style="color:var(--accent);font-weight:700"><div class="pl2">내 근무표 만들기<small>만들기 전에는 가족에게 내 근무표가 안 보여요</small></div><span class="muted">›</span></div>':''}${S.myset&&L.mode!=='view'?stkRow():''}</div>`}
    ${pushRow()}
    ${googleRow()}
    <div class="pg-sec" style="margin-top:16px"><div class="prow tap" data-act="mem-rename" data-u="self"><div class="pl2">내 호칭 고치기</div><span class="muted">${esc(L.name)} ›</span></div>
      <div class="prow tap" data-act="link-move"><div class="pl2">다른 가족방으로 옮기기<small>새 초대 코드로 옮겨요</small></div><span class="muted">›</span></div>
      <div class="prow danger-row" data-act="link-leave">${alone?'가족방에서 나가기 (나 혼자라 방이 없어져요)':'가족방에서 나가기'}</div></div>
    <div class="hint gone" style="display:none">가족방엔 방장이 없어요. 누구나 초대하고 나갈 수 있고, 마지막 사람이 나가면 방이 없어져요. 가족을 빼려면 가족 과반이 찬성해야 해요 (30일 넘게 안 들어온 사람 · 내가 초대한 지 하루가 안 된 사람은 바로 뺄 수 있어요).<br>가족 메모(♥)와 근무 요청은 날짜를 눌러 주고받아요 · 가족 메모 · 근무 요청 · 가족 포스트잇(새로 붙일 때)은 합쳐서 처음 10건 무료예요.</div>`;
  }
  openPage(`${pageHead('가족 연결')}<div class="pg-b np">${body}</div>`,'link');   // v0.147 새 모양
}
/* ----- 초대 코드 만들기 (호스트) ----- */
let invDraft={perm:'write',name:'',host:''};
function openInvitePop(){
  const need=!S.link;
  invDraft={perm:invDraft.perm||'write',name:'',host:need?'':S.link.name};
  renderInvitePop();
}
function renderInvitePop(){
  const need=!S.link;
  openPop(`<div class="mh">가족 초대<b>초대 코드 만들기</b></div>
    ${need?`<div class="mi" style="display:block"><div class="icn-lb">가족에게 보일 내 이름</div><input type="text" id="invHost" maxlength="12" placeholder="예: 아빠" value="${esc(invDraft.host)}" style="width:100%;margin-top:6px"></div>`:''}
    <div class="mi" style="display:block"><div class="icn-lb">초대할 가족 호칭 <small>(없어도 돼요 · 참여할 때 정할 수 있어요)</small></div><input type="text" id="invName" maxlength="12" placeholder="예: 아내" value="${esc(invDraft.name)}" style="width:100%;margin-top:6px"></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">취소</button><button class="btn grow" data-act="inv-make">코드 만들기</button></div>`);
}
function invPull(){const a=$('#invHost'),b=$('#invName');if(a)invDraft.host=a.value.trim();if(b)invDraft.name=b.value.trim();}
async function invMake(){
  invPull();const need=!S.link;
  if(need&&!invDraft.host){toast('가족에게 보일 내 이름을 써 주세요 (예: 아빠)');return;}
  const btn=document.querySelector('#pop [data-act="inv-make"]');if(btn){btn.disabled=true;btn.textContent='만드는 중…';}
  try{
    if(need)await famEnsureHouse(invDraft.host);
    const members=await famMembers(S.link.hid);
    if(members.length>=FAM_MAX+1){closePop();toast('가족 자리가 가득 찼어요');famRefresh();return;}
    const r=await famCreateInvite(invDraft.perm,invDraft.name);
    showCodePop(r.code);
    if(pageMode==='link')famRefresh();else if(!pageMode)openLinkPage();
  }catch(e){if(btn){btn.disabled=false;btn.textContent='코드 만들기';}toast(famErr(e));}
}
function showCodePop(code){
  openPop(`<div class="mh">초대 코드<b>${FAM_DAYS}일 안에 가족이 넣으면 돼요</b></div>
    <div class="mi" style="display:block;text-align:center"><div class="codebig">${famFmt(code)}</div><div class="hint" style="padding:6px 0 0">한 번 쓰면 사라지는 코드예요 (1회용)</div></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="inv-copy" data-c="${code}">코드 복사</button><button class="btn grow" data-act="inv-share" data-c="${code}">공유하기</button></div>
    <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);
}
/* ----- 초대 코드로 참여 (가족) ----- */
let joinDraft={code:'',info:null,name:'',mode:'own'};
function openJoinPop(msg){
  if(S.link){toast('이미 가족방이 있어요. 먼저 나가기를 해 주세요');return;}
  openPop(`<div class="mh">가족 폰 연결<b>초대 코드를 넣어 주세요</b></div>
    <div class="mi" style="display:block"><input type="text" id="joinCode" class="mono codein" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="9" placeholder="XXXX-XXXX" value="${famFmt(joinDraft.code)}"><div class="warnline" id="joinErr" style="min-height:18px;margin-top:8px">${esc(msg||'')}</div></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">취소</button><button class="btn grow" data-act="join-check">확인</button></div>`);
  setTimeout(()=>{const i=$('#joinCode');if(i)i.focus();},60);
}
async function joinCheck(){
  const code=famNorm(($('#joinCode')||{}).value);joinDraft.code=code;
  if(!famRe.test(code)){const e=$('#joinErr');if(e)e.textContent='코드는 8자리예요 (영문 · 숫자). 0 O 1 I L 은 안 써요';return;}
  const btn=document.querySelector('#pop [data-act="join-check"]');if(btn){btn.disabled=true;btn.textContent='확인 중…';}
  try{
    const r=await famLookup(code);
    if(!r.ok){openJoinPop(r.err);return;}
    joinDraft.info=r;joinDraft.name=r.name||'';
    renderJoinPreview();
  }catch(e){openJoinPop(famErr(e));}
}
function renderJoinPreview(){
  const i=joinDraft.info;
  openPop(`<div class="mh">${esc(i.hostName)}님의 근무표<b>${esc(i.patternName||'교대근무')}</b></div>
    <div class="mi" style="display:block"><div class="icn-lb">어떻게 쓰실래요?</div>
      <div class="jopt ${joinDraft.mode==='own'?'on':''}" data-act="join-mode" data-v="own"><b>나도 근무표를 써요</b><small>달력 탭은 내 것 · 내 근무표가 가족에게 보여요</small></div>
      <div class="jopt ${joinDraft.mode==='view'?'on':''}" data-act="join-mode" data-v="view"><b>가족 것만 볼래요</b><small>달력 탭이 가족 달력으로 바뀌어요 · 내 근무표는 안 올려요</small></div>
      <div class="icn-lb" style="margin-top:12px">내 호칭 <small>(가족에게 보여요)</small></div><input type="text" id="joinName" maxlength="12" placeholder="예: 아내" value="${esc(joinDraft.name)}" style="width:100%;margin-top:6px"><div class="warnline" id="joinErr" style="min-height:18px;margin-top:6px"></div></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="join-back">뒤로</button><button class="btn grow" data-act="join-go">참여하기</button></div>`);
}
async function joinGo(){
  const name=(($('#joinName')||{}).value||'').trim();joinDraft.name=name;
  if(!name){const e=$('#joinErr');if(e)e.textContent='내 호칭을 써 주세요';return;}
  const btn=document.querySelector('#pop [data-act="join-go"]');if(btn){btn.disabled=true;btn.textContent='참여하는 중…';}
  try{
    const jm=joinDraft.mode;
    await famJoin(joinDraft.code,joinDraft.info,name,jm);
    const host=joinDraft.info.hostName;joinDraft={code:'',info:null,name:'',mode:'own'};
    closePop();
    if(ob){S.onboarded=true;save();}
    if(jm==='own'&&!S.myset){   // 내 근무표가 아직 없으면 만들기로 이어감 (앱 기본값이 내 근무표로 올라가지 않게)
      if(ob){ob.entry='join';ob.hist=[];ob.step='way';ob.way='preset';renderOb();}else startOnboarding({entry:'join'});
      render();toast(`${host}님의 가족방에 참여했어요 💜 이제 내 근무표를 만들어요`);return;
    }
    if(ob)obClose();
    render();openLinkPage();toast(`${host}님의 가족방에 참여했어요 💜`);
  }catch(e){const er=$('#joinErr');if(er)er.textContent='참여하지 못했어요. '+famErr(e);if(btn){btn.disabled=false;btn.textContent='참여하기';}}
}
/* ----- 가족 관리 ----- */
// v0.96 가족 빼기: 30일 넘게 안 옴 · 내가 초대하고 하루 안 → 바로 / 그 밖엔 다수결(과반 · 7일)
function openMemberMenu(uid){
  const m=famUi.members.find(x=>x.uid===uid);if(!m||!S.link)return;
  const me=S.link.uid,k=famKickLive(uid),u=esc(uid);
  let rows='';const stale=famStale(m),undo=m.invitedBy===me&&Date.now()-famMs(m.joinedAt)<864e5;
  if(stale)rows+=`<button class="mi" data-act="mem-out" data-u="${u}" style="color:var(--danger)">바로 빼기<small style="display:block;color:var(--muted);font-weight:400">30일 넘게 앱을 안 열었어요</small></button>`;
  else if(undo)rows+=`<button class="mi" data-act="mem-out" data-u="${u}" style="color:var(--danger)">초대 되돌리기 (바로 빼기)<small style="display:block;color:var(--muted);font-weight:400">내가 초대한 지 하루가 안 됐어요</small></button>`;
  if(k){const need=famKickNeed(uid,k.inact||[]);
    rows+=k.votes.includes(me)?`<div class="mi" style="display:block"><b>🗳 내보내기 찬성 ${k.votes.length}/${need}</b><div class="hint" style="padding:4px 0 0;margin:0">${famNameOf(k.by)}님이 제안했어요 · 7일 안에 ${need}명이 찬성하면 빠져요</div></div>${k.by===me?`<button class="mi" data-act="kick-cancel" data-u="${u}">제안 취소</button>`:''}`
      :`<div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0">${famNameOf(k.by)}님이 내보내기를 제안했어요 · 찬성 ${k.votes.length}/${need}</div></div><button class="mi" data-act="kick-vote" data-u="${u}" style="color:var(--danger)">🗳 찬성하기</button>`;}
  else if(!stale&&!undo)rows=`<button class="mi" data-act="kick-new" data-u="${u}" style="color:var(--danger)">내보내기 제안<small style="display:block;color:var(--muted);font-weight:400">가족 과반이 찬성하면 빠져요 (${famKickNeed(uid,famKickInact(uid))}명)</small></button>`;
  rows=`<button class="mi" data-act="mem-aka" data-u="${u}">📛 내 폰에서 부를 이름<small style="display:block;color:var(--muted);font-weight:400">${S.famAlias&&S.famAlias[uid]?esc(S.famAlias[uid]):'바꾸면 이 폰에서만 그 이름으로 보여요'}</small></button>`+rows;
  openPop(`<div class="mh">${famModeTxt(m)}<b>${esc(famAka(uid,m.name))}</b></div>${rows}
    <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);
}
let renameFor=null;
function openRename(uid){
  const self=uid==='self';const m=self?{name:S.link.name}:famUi.members.find(x=>x.uid===uid);if(!m)return;
  renameFor=self?FBX.uid:uid;
  openPop(`<div class="mh">호칭 고치기<b>${self?'내 호칭':esc(m.name)}</b></div>
    <div class="mi" style="display:block"><input type="text" id="renameIn" maxlength="12" value="${esc(m.name)}" style="width:100%"></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">취소</button><button class="btn grow" data-act="mem-save">저장</button></div>`);
  setTimeout(()=>{const i=$('#renameIn');if(i){i.focus();i.select();}},60);
}
async function memSave(){
  const n=(($('#renameIn')||{}).value||'').trim();if(!n){toast('호칭을 써 주세요');return;}
  try{
    await famEdit(S.link.hid,renameFor,{name:n});
    if(renameFor===FBX.uid){S.link.name=n;save();}
    closePop();famRefresh();
  }catch(e){toast(famErr(e));}
}
async function famDo(fn,okMsg){try{await fn();if(okMsg)toast(okMsg);}catch(e){toast(famErr(e));}famRefresh();}

let aboutTaps=0,aboutT=null;
/* 안드로이드 앱이 부르는 훅 */
/* 종료 확인: 첫 화면(달력)에서 뒤로가기 → 바로 안 꺼지고 한 번 물어봄. 가운데 .adslot 은 나중에 광고를 붙일 자리(지금은 숨김) */
let exitTimer=null;
function openExitAsk(){
  openPop(`<div class="mh">언제쉬어<b>종료할까요?</b></div>
    <div class="adslot" id="adSlot" hidden></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">취소</button><button class="btn grow" id="exitOk" data-act="exit-ok" disabled>종료</button></div>`);
  clearTimeout(exitTimer);
  // 뒤로가기를 연달아 눌러 실수로 꺼지지 않게 0.5초 뒤에 [종료]가 눌림
  exitTimer=setTimeout(()=>{const b=$('#exitOk');if(b)b.disabled=false;},500);
}
window.__onBack=()=>{
  if($('#pop').classList.contains('open')){popBack();return true;}
  if(ob){if(ob.step==='start'||ob.step==='done')return false;obBack();return true;}
  if(paint){paint=null;render();return true;}
  if($('#app').classList.contains('share-mode')){shareEnd();return true;}
  if($('#sheet').classList.contains('open')){
    // v0.212 날짜 창 위에 자세히 같은 페이지가 떠 있으면 위에 있는 페이지부터 닫음 (아래 날짜 창이 먼저 꺼지던 것)
    let top=null;try{const e=document.elementFromPoint(innerWidth/2,innerHeight/2);top=e&&e.closest&&e.closest('#page,#sheet');}catch(x){}
    if(!(pageMode&&top&&top.id==='page')){closeSheet();return true;}
    if(pageMode==='memodetail'){mdDraft=null;closePage();return true;}
  }
  if(pageMode==='stampadd'&&stDraft){srBack();return true;}
  if(pageMode){const bk=document.querySelector('#page.open .pg-h .bk');if(bk){bk.click();return true;}closePage();return true;}   // v0.223 화면 위 ‹ 와 같게 (바깥 화면으로 한 단계씩)
  if(tab==='colleague'){tab='set';render();return true;}
  if(tab!=='cal'){tab='cal';render();return true;}
  openExitAsk();return true;
};
window.__refresh=()=>{
  expireOnceAlarms();
  if(tab==='alarm'||tab==='set')render();
  // 권한 화면에서 돌아오면 바로 ✓ 로
  if(ob&&ob.step==='alarm')renderOb();else if(pageMode==='perm')openPermPage();
  widgetSync();pushAlarmsToNative();pushWidgetToNative();refreshHolidays();autoBackup();famBoot();famPoll(true);
  setTimeout(backupNudge,1500);
};

/* ================= 접근성 (화면 읽기 TalkBack · 작은 버튼) =================
 * 이 앱은 눌림을 맨 위에서 한꺼번에 받는 방식(data-act)이라, 버튼이 아닌 칸에는 role · 이름 · tabindex 를 달아 줘야 화면 읽기가 "누를 수 있는 것"으로 읽어요.
 * 작은 버튼은 보이는 크기는 그대로 두고 누르는 자리만 넓혀요 (최소 44px). 화면이 바뀔 때마다 한 번씩(0.2초 모아서) 해요. */
const A11Y_ACT={prev:'이전 달',next:'다음 달','open-month-picker':'달 고르기',aadd:'알람 추가','picker-prev-y':'이전 해','picker-next-y':'다음 해','pi-prev':'이전 달','pi-next':'다음 달','page-close':'닫기','pop-close':'닫기',close:'닫기','memo-chk':'완료','memo-send':'보내기','fam-edit':'고치기'};
const A11Y_SYM={'‹':'이전','›':'다음','✕':'닫기','×':'닫기','＋':'추가','+':'추가','↻':'새로고침','⋯':'더 보기'};
function a11yCell(k){   // 달력 칸 하나를 한 줄로 읽어 줌: 날짜 · 요일 · 근무 · 공휴일 · 메모 수 · 스티커 수
  const d=parse(k),sh=shiftOf(d),hol=holName(k),ch=compHol(k),parts=[`${d.getMonth()+1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일`];
  if(persOn(k))parts.push('개인 캘린더');
  else if(sh!==''&&sh!==NONE_K)parts.push(shiftLabel(sh)+(S.overrides[k]?' (바꾼 날)':''));
  if(hol)parts.push(hol.split('·').join(' '));
  if(ch)parts.push('회사 휴무 '+ch);
  const nm=visibleMemos(k).length+boardOnDate(k).length;if(nm)parts.push(`메모 ${nm}개`);
  const ns=stampsOn(k).length;if(ns)parts.push(`스티커 ${ns}개`);
  return parts.join(', ');
}
let a11yT=null;
function a11yPass(){
  a11yT=null;
  try{
    const tr=document.getElementById('track');   // 달력은 가운데 달만 읽히게 (양옆 달은 숨김)
    if(tr)[...tr.children].forEach((p,i)=>{const v=i===1?'false':'true';if(p.getAttribute('aria-hidden')!==v)p.setAttribute('aria-hidden',v);});
    document.querySelectorAll('#track .panel:nth-child(2) .cell[data-k]:not([aria-label])').forEach(c=>{c.setAttribute('aria-label',a11yCell(c.dataset.k));});
    document.querySelectorAll('#nav button').forEach(b=>{b.setAttribute('role','tab');b.setAttribute('aria-selected',b.classList.contains('on')?'true':'false');});
    ['pop','sheet','page','onboard'].forEach(id=>{const e=document.getElementById(id);if(!e)return;const open=e.classList.contains('open')&&e.innerHTML.trim().length>0;if(open){e.setAttribute('role','dialog');e.setAttribute('aria-modal','true');}else e.removeAttribute('aria-modal');});
    document.querySelectorAll('label.sw > input[type="checkbox"]:not([aria-label])').forEach(i=>{   // 스위치: 같은 줄의 제목을 이름으로
      const row=i.closest('.prow'),pl=row&&row.querySelector('.pl2');
      const t=pl?((pl.firstChild&&pl.firstChild.nodeType===3?pl.firstChild.textContent:pl.textContent)||'').trim():'';
      if(t)i.setAttribute('aria-label',t.slice(0,40));
      i.setAttribute('role','switch');
    });
    const els=document.querySelectorAll('[data-act]:not([data-a11y]),label.sw:not([data-a11y])');
    els.forEach(e=>{
      e.setAttribute('data-a11y','1');
      if(e.classList.contains('stz')){e.setAttribute('aria-hidden','true');return;}   // 칸 위쪽의 눈에 안 보이는 스티커 누르는 자리: 화면 읽기에서는 뺌 (날짜 창에서 스티커를 누를 수 있음)
      const tag=e.tagName,native=tag==='BUTTON'||tag==='INPUT'||tag==='LABEL'||tag==='SELECT'||tag==='TEXTAREA';
      if(!native&&!e.hasAttribute('role'))e.setAttribute('role','button');
      if(!native&&!e.hasAttribute('tabindex'))e.setAttribute('tabindex','0');
      if(!e.hasAttribute('aria-label')&&tag!=='LABEL'&&tag!=='INPUT'){
        const t=(e.textContent||'').trim();
        if(!t||t.length<=2){const nm=A11Y_ACT[e.dataset.act]||A11Y_SYM[t];if(nm)e.setAttribute('aria-label',nm);}
      }
    });
    // 작은 버튼: 누르는 자리 넓히기 (측정은 한 번에 모아서)
    const todo=[];
    els.forEach(e=>{
      if(e.classList.contains('stz')||e.closest('.cell')||e.tagName==='INPUT'||e.hasAttribute('aria-hidden'))return;
      if(e.querySelector('button,[data-act],input,a'))return;   // v0.199 안에 다른 버튼이 있는 줄은 넓히지 않음 (넓힌 판이 안쪽 ⋯ 같은 버튼을 덮음)
      const w0=e.offsetWidth,h0=e.offsetHeight;   // v0.199 움직이는 중(작게 줄어든 창)에도 실제 크기로 잼
      if(w0>0&&h0>0&&(w0<44||h0<44))todo.push([e,w0,h0]);
    });
    todo.forEach(([e,w,h])=>{
      const cs=getComputedStyle(e);
      if(cs.display==='none'||cs.visibility==='hidden')return;
      let cls=cs.position==='static'?'tapx':'tapz';
      if(getComputedStyle(e,'::after').content!=='none'&&cls!=='tapb'){   // 이미 꾸밈에 ::after 를 쓰고 있으면 ::before 로
        if(getComputedStyle(e,'::before').content!=='none')return;
        cls='tapb';if(cs.position==='static')e.style.position='relative';
      }
      e.style.setProperty('--tx',Math.max(0,Math.ceil((44-w)/2))+'px');e.style.setProperty('--ty',Math.max(0,Math.ceil((44-h)/2))+'px');
      e.classList.add(cls);
    });
  }catch(err){try{window.__logErr&&window.__logErr(err&&err.message,'a11y');}catch(x){}}
}
function a11ySoon(){if(a11yT)return;a11yT=setTimeout(a11yPass,200);}
try{new MutationObserver(a11ySoon).observe(document.body,{childList:true,subtree:true});}catch(e){}

const bootStep=f=>{try{f();}catch(e){try{window.__logErr&&window.__logErr(e&&e.message,'boot');}catch(x){}}};
bootStep(applyTheme);bootStep(applyFont);bootStep(applyBand);
let bootOk=true;
try{render=pfWrap('다시 그리기(render)',render);fitDn=pfWrap('글자 · 스티커 맞추기',fitDn);calFill=pfWrap('옆 달 그리기',calFill);stzWindow=pfWrap('스티커 크기 재기',stzWindow);widgetSync=pfWrap('위젯 자료 읽기',widgetSync);a11yPass=pfWrap('접근성 정리',a11yPass);glowFrame=pfWrap('오늘 빛',glowFrame);calShiftFast=pfWrap('달 넘김 정리',calShiftFast);plFit=pfWrap('메모 글자 자르기',plFit);memoShift=pfWrap('메모 위치',memoShift);}catch(e){}
pf('첫 그리기 시작');
try{render();}catch(e){bootOk=false;try{window.__logErr&&window.__logErr(e&&e.message,'render');window.__crash&&window.__crash(e&&e.message);}catch(x){}}
bootStep(pushAlarmsToNative);bootStep(pushRemindersToNative);bootStep(pushWidgetToNative);
if(!S.onboarded)bootStep(startOnboarding);
bootStep(refreshHolidays);
bootStep(famBoot);
setTimeout(()=>{try{wxFetch(false);}catch(e){}},2500);
setTimeout(()=>{try{if(window.AndroidBridge&&typeof window.AndroidBridge.takePush==='function'){const p=String(window.AndroidBridge.takePush()||'');if(p)window.__onPush(JSON.parse(p));}}catch(e){}},700);
{const wsBoot=()=>{const q=uiQuiet();if(q>0){setTimeout(wsBoot,q);return;}widgetSync();};setTimeout(wsBoot,1600);}   // v0.185 (150 → 1600) 첫 넘기기 뒤로
setTimeout(introNotice,1400);
setTimeout(()=>{try{stkAskCheck();}catch(e){}},1800);
applyStats();track('app_start');
setTimeout(addonNotice,1200);
setTimeout(autoBackup,4000);
setTimeout(backupNudge,6000);
setTimeout(()=>{if(loadNote==='parse')toast('저장된 데이터를 읽지 못해 새로 시작했어요 · 설정 › 백업 · 복원에서 되살릴 수 있어요');else if(loadNote==='partial')toast('일부 저장 값이 깨져서 그 부분만 기본값으로 돌렸어요');},1600);
setTimeout(a11yPass,2200);   // v0.185 (300 → 2200)
if(bootOk)window.__booted=true;
})();


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
function perPill(k,d){const p=perOn(k)[0];if(!p)return '';const L=leadOf(d),s=k===p.k0||L===0,x=k===p.m.till,e=x||L===6;
  return `<div class="pl pvl${s?' s':''}${e?' e':''}${k===p.k0?' b':''}${x?' x':''}" style="--pc:${perMc(p.m)}">${s?esc(perName(p.m)):'&nbsp;'}</div>`;}
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
  for(let i=0;i<rows*7;i++){
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
    {const pv=sharing?'':perPill(k,d);if(pv)pills.unshift(pv);}
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
    cells+=`<div class="cell ${d.getMonth()===m?'':'out'} ${k===tk?'today':''} ${pers?'pers':''} ${stMore.length?'m3':''} ${rcls}" data-act="day" data-k="${k}"${cb}>
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
  const k=timesTab,c=((S.shiftTimes=S.shiftTimes||{})[k]=S.shiftTimes[k]||{});
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


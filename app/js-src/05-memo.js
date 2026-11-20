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
  let body=(wlHas(k)?wlRowHtml(k):'')+perOn(k).filter(p=>p.k0!==k).map(p=>`<div class="mcard my per" data-act="per-open" data-k="${p.k0}" data-id="${esc(p.m.id)}" style="--pc:${perCol(p.m.color)}"><div class="mt2"><span class="tx">${esc(firstLine(p.m.text))}</span><div class="meta">기간 · ${md(p.k0)} ~ ${md(p.m.till)}</div></div></div>`).join('')+fam.map(m=>memoCard(m,k)).join('')+mine.map(m=>memoCard(m,k)).join('');
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
const mdApply=(m,x)=>{['color','todo','done','time','al','till'].forEach(p=>{if(x[p]===undefined)delete m[p];else m[p]=x[p];});};
function mdPull(){const e=$('#mdText');if(e&&mdDraft)mdDraft.text=e.value;}
function openMemoDetail(k,id){
  const rm=rmemoOf(id);if(rm){mdDraft={k,id:'',rep:rm.id,text:rm.text,color:rm.color||'',todo:!!rm.todo,done:false,time:rm.time||'',al:rm.al||'',shared:false,rr:{md:rm.md,sh:(rm.sh||[]).slice(),miss:rm.miss||'skip'}};renderMemoDetail();return;}
  const m=id?memosOf(k).find(x=>x.id===id):null,i=$('#memoInput');
  mdDraft={k,id:m?m.id:'',text:m?m.text:(i?i.value:memoText)||'',color:m?(m.color||''):(S.lastMemoColor||''),todo:!!(m&&m.todo),done:!!(m&&m.done),time:(m&&m.time)||'',al:(m&&m.al)||'',till:(m&&m.till)||'',shared:m?!!m.shared:role()!=='host'};
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
    ${d.shared?'':`<div class="pg-sec pad mdcol">${MEMO_COL.map(c=>`<button class="${d.color===c?'on':''}" style="background:${c}" data-act="md-col" data-v="${c}" aria-label="색"></button>`).join('')}</div>`}
    <div class="pg-sec">
      ${npRow('check','할 일',`<label class="sw"><input type="checkbox" id="mdTodo" ${d.todo?'checked':''}><i></i></label>`)}
      ${npRow('clock','시간',d.time?`${tpick('mdTime',d.time)}<button class="xbtn" data-act="md-notime" aria-label="시간 없애기">${npi('x',16)}</button>`:`<button class="xbtn tplus" data-act="md-settime" aria-label="시간 정하기">${npi('x',16)}</button>`,d.time?{cls:'mdtrow'}:{tap:1,act:'md-settime',cls:'mdtrow'})}
      ${d.time?npRow('bell','알림',`<div class="npseg sm">${[['','없음'],['0','정시'],['10','10분 전']].map(([v,l])=>`<button class="${d.al===v?'on':''}" data-act="md-al" data-v="${v}">${l}</button>`).join('')}</div>`):''}
      ${host&&!d.shared&&!d.rr&&!d.rep?npRow('calendar-days','기간',d.till?`<span class="mdtill">~</span>${tpick('mdTill',d.till,'','date')}<button class="xbtn" data-act="md-notill" aria-label="기간 없애기">${npi('x',16)}</button>`:`<button class="xbtn tplus" data-act="md-settill" aria-label="기간 정하기">${npi('x',16)}</button>`,d.till?{cls:'mdtrow'}:{tap:1,act:'md-settill',cls:'mdtrow'}):''}
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
    Object.assign(r,{text,md:d.rr.md,sh:(d.rr.sh||[]).slice(),miss:d.rr.miss==='next'?'next':'skip'});['color','todo','time','al'].forEach(p=>{const v=p==='al'?(d.time&&d.al!==''?d.al:undefined):p==='todo'?(d.todo||undefined):(d[p]||undefined);if(v===undefined)delete r[p];else r[p]=v;});
    S.lastMemoColor=d.color||'';save();mdDraft=null;memoText='';memoEdit=null;closePage();memoFinish(d.k,`🔁 반복 메모 · ${rrText(r)}`);try{pushRemindersToNative();}catch(e){}return;
  }
  const x={till:(!d.shared&&!d.rr&&d.till&&d.till>d.k)?d.till:undefined,color:(!d.shared&&d.color)||undefined,todo:d.todo||undefined,done:(d.todo&&d.done)||undefined,time:d.time||undefined,al:(d.time&&d.al!=='')?d.al:undefined};
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
    <div class="mi" style="display:block"><div class="pl2" style="margin-bottom:6px">근무 조건</div><div class="chips"><button class="${!r.sh.length?'on':''}" data-act="rr-sh" data-v="">상관없이</button>${S.types.filter(t=>t.k!==NONE_K&&!t.rest).map(t=>`<button class="${r.sh.includes(t.k)?'on':''}" data-act="rr-sh" data-v="${esc(t.k)}">${badge(t.k,'sm')} ${esc(t.name)}</button>`).join('')}</div>
      ${r.sh.length?`<div class="hseg" style="margin-top:10px"><button class="${r.miss!=='next'?'on':''}" data-act="rr-miss" data-v="skip">그 날 아니면 건너뛰기</button><button class="${r.miss==='next'?'on':''}" data-act="rr-miss" data-v="next">다음 그 근무 날로</button></div>`:''}</div>
    <div class="hint" style="padding:4px 16px 8px">${esc(rrText(r))}</div>
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
  S.memos[k]=memosOf(k).filter(x=>x!==m);tidyMemos(k);(S.memos[nk]=S.memos[nk]||[]).push(m);save();render();if(sheetKey===k&&sheetMode==='day')openDay(k);
  toastUndo(`${md(nk)}로 옮겼어요`,()=>{S.memos[nk]=memosOf(nk).filter(x=>x!==m);tidyMemos(nk);(S.memos[k]=S.memos[k]||[]).push(m);save();render();if(sheetKey===k&&sheetMode==='day')openDay(k);});}
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
    if(!t.rest&&(t.ts||t.te)){S.shiftTimes=S.shiftTimes||{};const c=(S.shiftTimes[k]=S.shiftTimes[k]||{});if(t.ts)c.start=t.ts;if(t.te)c.end=t.te;}
    if(typeReturn==='day'&&sheetKey){applyShift(k);}else{save();afterType();}
    toast('근무타입을 추가했어요');return;
  }
  const i=S.types.findIndex(x=>x.k===t.orig);
  if(i>=0){if(S.types[i].noGuess)item.noGuess=true;S.types[i]=item;}
  S.shiftTimes=S.shiftTimes||{};
  if(k!==t.orig&&S.shiftTimes[t.orig]){S.shiftTimes[k]=S.shiftTimes[t.orig];delete S.shiftTimes[t.orig];}   // 글자를 바꾸면 시간도 따라감
  if(!t.rest&&(t.ts||t.te)){const c=(S.shiftTimes[k]=S.shiftTimes[k]||{});if(t.ts)c.start=t.ts;if(t.te)c.end=t.te;}
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


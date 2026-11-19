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

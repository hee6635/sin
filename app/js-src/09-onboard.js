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


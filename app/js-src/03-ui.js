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


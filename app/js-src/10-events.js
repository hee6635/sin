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
    case 'tg-mv':tgMove(+t.dataset.v);break;   // v0.240 같이 쉬는 날 달 넘기기
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


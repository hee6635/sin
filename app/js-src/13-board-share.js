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


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
let famBx={me:0,all:0};
async function famBonusLoad(){   // 관리자가 준 무료 건수: bonus/{내 uid} · bonus/_all (모두에게)
  if(!S.link||!fbCfg())return;
  const {F,db}=await famReady();if(!S.link)return;
  const g=async id=>{try{const d=await F.getDoc(F.doc(db,'bonus',id));return d.exists()?Math.max(0,Math.round(+d.data().n)||0):0;}catch(e){return 0;}};
  famBx={me:await g(S.link.uid),all:await g('_all')};
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
  const [cs,ls]=await Promise.all([F.getDocs(F.collection(db,'codes')),F.getDocs(F.query(F.collection(db,'bonusLog'),F.orderBy('at','desc'),F.limit(20)))]);
  adm.codes=cs.docs.map(d=>Object.assign({code:d.id},d.data()));
  adm.log=ls.docs.map(d=>d.data());
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
function openAdmPage(){
  if(!adm)adm={q:'',sel:null,codes:null,log:null,busy:false};
  pageBack=openInfoPage;
  const res=adm.sel?[]:admFind();
  openPage(`${pageHead('관리자')}<div class="pg-b np">
    <div class="pg-cap">받는 사람</div>
    <div class="pg-sec">${adm.sel?`<div class="prow"><div class="pl2">${esc(adm.sel.name||'?')} · ${esc(adm.sel.code)}</div><button class="xbtn" data-act="adm-clear" aria-label="다시 고르기">✕</button></div>`
      :`<div class="prow"><input type="text" id="admQ" class="inl" style="flex:1;text-align:left" placeholder="번호 또는 이름" value="${esc(adm.q)}" enterkeyhint="search"><button class="tbtn" data-act="adm-find">찾기</button></div>${adm.codes===null?'':res.map(admRowHtml).join('')||(adm.q?'<div class="prow"><div class="pl2">찾은 게 없어요</div></div>':'')}`}
      <div class="prow"><div class="pl2">모두에게</div><label class="sw"><input type="checkbox" id="admAll"><i></i></label></div>
    </div>
    <div class="pg-cap">건수</div>
    <div class="pg-sec"><div class="prow"><input type="number" id="admN" class="inl" inputmode="numeric" min="1" max="10000" placeholder="0" style="flex:1;text-align:left"><button class="btn" data-act="adm-give" style="margin-left:10px">주기</button></div></div>
    <div class="pg-cap">최근 기록</div>
    <div class="pg-sec">${adm.log===null?'<div class="prow"><div class="pl2">불러오는 중…</div></div>':adm.log.length?adm.log.map(l=>`<div class="prow"><div class="pl2">+${+l.n||0} · ${l.to==='_all'?'모두':`${esc(l.name||'?')} · ${esc(l.code||'')}`}</div><div class="pv npv">${admDay(l.at)}</div></div>`).join(''):'<div class="prow"><div class="pl2">아직 기록이 없어요</div></div>'}</div>
  </div>`,'adm');
  if(adm.codes===null&&!adm.busy){adm.busy=true;admLoad().then(()=>{adm.busy=false;if(pageMode==='adm')openAdmPage();}).catch(e=>{adm.busy=false;adm.log=[];toast(famErr(e));if(pageMode==='adm')openAdmPage();});}
}
async function admGive(){
  const n=Math.round(+($('#admN')||{}).value||0),all=!!($('#admAll')||{}).checked;
  if(!(n>0&&n<=10000)){toast('건수를 넣어 주세요');return;}
  if(!all&&!adm.sel){toast('받는 사람을 골라 주세요');return;}
  if(!confirm(`${all?'모두':`${adm.sel.name||'?'} (${adm.sel.code})`}에게 무료 ${n}건을 줄까요?`))return;
  try{
    const {F,db}=await famReady(),id=all?'_all':adm.sel.uid,b=F.writeBatch(db);
    b.set(F.doc(db,'bonus',id),{n:F.increment(n),at:F.serverTimestamp()},{merge:true});
    b.set(F.doc(F.collection(db,'bonusLog')),{to:id,name:all?'':String(adm.sel.name||'').slice(0,12),code:all?'':adm.sel.code,n,at:F.serverTimestamp()});
    await b.commit();toast(`${n}건 줬어요`);adm.sel=all?adm.sel:null;adm.q='';adm.codes=null;adm.log=null;openAdmPage();
  }catch(e){toast(famErr(e));}
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
    ${famRemain()<=3?`<div class="usage-hint" style="margin-top:4px">무료 ${famRemN()}건 남음 · 가족 모두에게 보이고 알림이 가요</div>`:''}`;
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
    const cb=c&&!schRest(sch,sh)?` style="--cb:${c.bg}"`:'';
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
        <button class="btn vrsend" data-act="vc-send">요청 보내기<small> · ${famRemN()}건 남음</small></button>`;
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
const famRemain=()=>{const m=(S.fam2&&S.fam2.me)||{};return Math.max(0,FAM_FREE+(+m.bonus||0)+famBx.me+famBx.all-(+m.sent||0));};   // v0.150 + 관리자가 준 건수
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
  Object.keys(S.memos||{}).forEach(k=>(S.memos[k]||[]).forEach(m=>{if(m.shared&&m.by===role()&&String(m.text||'').trim())want[uid+'_'+m.id]={date:k,text:String(m.text).slice(0,200),nt:!!m.notify,mid:m.id,t:+m.t||0,td:!!m.todo,dn:!!(m.todo&&m.done),tm:/^\d\d:\d\d$/.test(m.time||'')?m.time:'',al:/^\d\d:\d\d$/.test(m.time||'')&&(m.al==='0'||m.al==='10')?m.al:'',to:toOf(m)};}));
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
      b.set(ref,{by:uid,byName:S.link.name,date:w.date,text:w.text,to:w.to,createdAt:F.serverTimestamp(),updatedAt:F.serverTimestamp(),...(w.tm?{time:w.tm,...(w.al!==''?{al:w.al}:{})}:{}),...(mv?{moved:true}:{}),...(w.td?{todo:true,done:w.dn}:{})});   // 할 일 · 완료: 가족 폰엔 보기만
      b.update(famMember(F,db,hid,uid),mv?{moved:F.increment(1)}:{sent:F.increment(1)});
      b.commit().catch(e=>famMemoWarn(id,famMemoErr(e))).finally(()=>{delete famBusyMemo[id];});
    }else if(h.text!==w.text||h.date!==w.date||(h.time||'')!==w.tm||(h.al||'')!==w.al||JSON.stringify([...(h.to||[])].sort())!==JSON.stringify(w.to)||!!h.todo!==w.td||!!h.done!==w.dn){
      famBusyMemo[id]=1;
      const patch={date:w.date,text:w.text,updatedAt:F.serverTimestamp()};
      if(JSON.stringify([...(h.to||[])].sort())!==JSON.stringify(w.to))patch.to=w.to;   // 받는 사람이 바뀌었거나, 옛 메모(to 없음)를 채움
      if((h.time||'')!==w.tm||(h.al||'')!==w.al){patch.time=w.tm?w.tm:F.deleteField();patch.al=w.al!==''?w.al:F.deleteField();}   // 시간 알림(색 · 할 일은 안 올림)
      if(!!h.todo!==w.td||!!h.done!==w.dn){patch.todo=w.td?true:F.deleteField();patch.done=w.td?w.dn:F.deleteField();}   // 할 일 · 완료 체크 (알림 없음)
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

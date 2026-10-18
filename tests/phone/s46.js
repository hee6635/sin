// 출시 서류 · 데이터 안전 (v0.63): 개인정보처리방침 새 글 + 웹 주소 · 웹 페이지 파일 · 백업 안내(한 번만) · 메모 색 · 달력 범위(2025~) · 모두 지우기(서버 없는 쪽) · 문의 메일 번호
const fs=require('fs');
const {chromium,boot,rich}=require('./x_common.js');
const {mkT}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const S=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
  const toSet=async p=>{await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);};
  const accept=p=>{p.removeAllListeners('dialog');p.__dialogs=[];p.on('dialog',d=>{p.__dialogs.push(d.message());d.accept().catch(()=>{});});};
  const calls=(p,n)=>p.evaluate(n=>window.__calls.filter(c=>c[0]===n),n);

  // ── 개인정보처리방침 (앱 안)
  {const p=await boot(b,rich(),{});await toSet(p);
   await p.evaluate(()=>document.querySelector('[data-act="more-privacy"]').click());await p.waitForTimeout(300);
   const txt=await p.$eval('#page .policy',e=>e.innerText);
   T('방침: 시행일',txt.includes('시행일 2026년 10월 19일'));
   T('방침: 운영 문의 메일',txt.includes('eonjeswieo.app@gmail.com'));
   T('방침: 서버 저장(서울) · 구글 · 국외 이전 · 보관과 지우기 · 어린이',['서울','구글','국외 이전','보관과 지우기','어린이'].every(w=>txt.includes(w)),txt.slice(0,80));
   T('방침: 낡은 문구("모든 정보는 이 폰 안에만 저장돼요")가 없음',!txt.includes('모든 정보는 이 폰 안에만'));
   T('방침: 나만 보는 메모는 서버에 안 올라간다고 안내',txt.includes('나만 보는 메모')&&txt.includes('서버에 올라가지 않아요'));
   const links=await p.$$eval('#page .policy a[data-act="lnk-go"]',as=>as.map(a=>a.dataset.u));
   T('방침: 웹 주소 2개(방침 · 삭제 안내)',links.includes('https://eonjeswieo.web.app/privacy')&&links.includes('https://eonjeswieo.web.app/delete'),JSON.stringify(links));
   await p.click('#page .policy a[data-u="https://eonjeswieo.web.app/privacy"]');await p.waitForTimeout(200);
   const op=await calls(p,'openUrl');
   T('웹 주소를 누르면 폰의 브라우저 열기를 부름',op.length===1&&op[0][1].includes('eonjeswieo.web.app/privacy'),JSON.stringify(op));
   T('오류 없음',p.errs.length===0,p.errs.join('|'));
   await p.ctx.close();}

  // ── 웹 페이지 파일 (firebase/hosting)
  {const dir='/home/user/sin/firebase/hosting/',pv=fs.readFileSync(dir+'privacy.html','utf8'),dl=fs.readFileSync(dir+'delete.html','utf8'),ix=fs.readFileSync(dir+'index.html','utf8');
   const app=fs.readFileSync('/home/user/sin/app/src/main/assets/index.html','utf8');
   T('웹: 세 페이지 모두 한국어 · 제목 · 반응형',[pv,dl,ix].every(h=>h.includes('<html lang="ko">')&&/<title>[^<]+<\/title>/.test(h)&&h.includes('width=device-width')));
   T('웹: 바깥 스크립트 · 바깥 이미지 없음 (보안 헤더와 맞음)',[pv,dl,ix].every(h=>!/<script|src="http|<img|<iframe/i.test(h)));
   T('웹: 시행일이 앱 안 방침과 같음',pv.includes('2026년 10월 19일')&&app.includes("PRIVACY_DATE='2026년 10월 19일'"));
   T('웹: 문의 메일이 앱과 같음',pv.includes('eonjeswieo.app@gmail.com')&&dl.includes('eonjeswieo.app@gmail.com')&&app.includes("SUPPORT_MAIL='eonjeswieo.app@gmail.com'"));
   T('웹: 삭제 안내가 앱의 실제 메뉴 이름을 가리킴',dl.includes('내 데이터 모두 지우기')&&app.includes("'내 데이터 모두 지우기'")&&dl.includes('설정')&&!dl.includes('더 보기'));
   T('웹: 방침이 삭제 안내 페이지로 이어짐 · 목록 페이지가 둘 다 걸려 있음',pv.includes('href="/delete"')&&ix.includes('href="/privacy"')&&ix.includes('href="/delete"'));
   const fj=JSON.parse(fs.readFileSync('/home/user/sin/firebase/firebase.json','utf8')).hosting;
   T('hosting 설정: 사이트 eonjeswieo · hosting 폴더 · 보안 헤더',fj&&fj.site==='eonjeswieo'&&fj.public==='hosting'&&JSON.stringify(fj.headers).includes('Content-Security-Policy')&&fs.existsSync('/home/user/sin/firebase/hosting/privacy.html'));}

  // ── 백업 안내: 며칠 쓴 뒤 한 번만
  {const day=864e5,T0=+new Date('2026-10-12T10:00:00');
   const mk=(mut)=>{const s=rich();s.born=T0-6*day;mut&&mut(s);return s;};
   const bridge=(linked)=>`window.AndroidBridge.driveLinked=()=>${linked};`;
   const run=async(name,state,pre,expectPop)=>{
     const p=await boot(b,state,{preInit:pre,wait:7200});
     const pop=await p.evaluate(()=>({open:document.getElementById('pop').classList.contains('open'),txt:document.getElementById('pop').innerText}));
     T(`백업 안내 [${name}]: ${expectPop?'뜸':'안 뜸'}`,pop.open&&pop.txt.includes('백업해 둘까요?')===expectPop||(!expectPop&&!(pop.open&&pop.txt.includes('백업해 둘까요?'))),pop.txt.slice(0,40));
     return p;};
   const p1=await run('6일 쓴 사람(백업 안 켬)',mk(),bridge(false),true);
   const s1=await S(p1);T('안내를 보여준 때가 저장됨(한 번만)',s1.nudgeBk>0);
   T('안내 글: 나중에 · 백업 켜기 두 버튼',await p1.evaluate(()=>!!document.querySelector('#pop [data-act="pop-close"]')&&!!document.querySelector('#pop [data-act="nudge-bk"]')));
   await p1.click('#pop [data-act="nudge-bk"]');await p1.waitForTimeout(400);
   T('"백업 켜기"를 누르면 백업 화면이 열림',await p1.evaluate(()=>!!document.querySelector('#page')&&document.getElementById('page').classList.contains('open')&&document.getElementById('page').innerText.includes('백업')));
   const saved=await S(p1);await p1.ctx.close();
   const p1b=await boot(b,saved,{preInit:bridge(false),wait:7200});   // 저장된 상태로 다시 켬
   T('다시 켜도 또 안 뜸 (한 번만)',await p1b.evaluate(()=>!document.getElementById('pop').innerText.includes('백업해 둘까요?')));
   await p1b.ctx.close();
   await Promise.all([
     run('처음 쓴 지 얼마 안 됨',mk(s=>{s.born=T0-1*day;}),bridge(false),false).then(p=>p.ctx.close()),
     run('이미 백업한 적 있음',mk(s=>{s.drive.last=T0-day;}),bridge(false),false).then(p=>p.ctx.close()),
     run('드라이브가 연결돼 있음',mk(),bridge(true),false).then(p=>p.ctx.close()),
     run('드라이브 기능이 없는 앱(브라우저)',mk(),'delete window.AndroidBridge.driveLinked;',false).then(p=>p.ctx.close()),
     run('쓴 기록이 아직 없음',mk(s=>{s.myset=false;s.memos={};s.overrides={};}),bridge(false),false).then(p=>p.ctx.close())]);
   // 옛 저장 데이터(born 없음): 오류 없이 켜지고 처음 쓴 때가 지금으로 채워짐
   const old=rich();delete old.born;delete old.nudgeBk;
   const p2=await boot(b,old,{preInit:bridge(false),wait:800});
   await p2.click('#nav [data-tab="set"]');await p2.waitForTimeout(200);await p2.click('[data-act="font"][data-v="120"]');await p2.waitForTimeout(300);   // 아무 설정이나 바꿔 저장시킴
   const so=await S(p2);
   T('옛 저장 데이터(born 없음)도 켜지고, 저장하면 born 이 채워짐',so.born>0&&so.nudgeBk===0&&p2.errs.length===0,JSON.stringify([so.born,so.nudgeBk,p2.errs]));
   await p2.ctx.close();}

  // ── 메모 색
  {const p=await boot(b,rich(),{});await toSet(p);
   await p.evaluate(()=>{const e=document.createElement('div');e.dataset.act='more-colors';document.body.appendChild(e);e.click();e.remove();});await p.waitForTimeout(300);
   const sw=await p.$$eval('#page .swatch',gs=>gs.map(g=>[...g.querySelectorAll('button')].map(x=>x.dataset.v)));
   T('설정 메모 색: 가족 색 칸에는 나만 보는 색(회색)이 없음',sw[0].length===13&&!sw[0].includes('#6b7280')&&sw[0].includes('#7b5cf0'),JSON.stringify(sw[0]));
   T('설정 메모 색: 나만 보는 색 칸에는 가족 색(보라)이 없음',sw[1].length===13&&!sw[1].includes('#7b5cf0')&&sw[1].includes('#6b7280'),JSON.stringify(sw[1]));
   await p.evaluate(()=>document.querySelector('#page .swatch:nth-of-type(1) button[data-v="#5b8def"], #page [data-k="fam"][data-v="#5b8def"]').click());await p.waitForTimeout(250);
   const sw2=await p.$$eval('#page .swatch',gs=>gs.map(g=>[...g.querySelectorAll('button')].map(x=>x.dataset.v)));
   T('가족 색을 파랑으로 바꾸면 나만 보는 칸에서 파랑이 빠지고 보라가 돌아옴',!sw2[1].includes('#5b8def')&&sw2[1].includes('#7b5cf0'),JSON.stringify(sw2[1]));
   T('가족 메모 채우기 색이 20% (조금 더 짙게)',await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--fam-bg').includes('20%')));
   await p.evaluate(()=>document.querySelector('#page [data-act="page-close"]')?.click());await p.waitForTimeout(150);
   await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(250);
   await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-17"] .bwrap');await p.waitForTimeout(350);
   await p.click('#sheet [data-act="memo-detail"]');await p.waitForTimeout(300);
   const cols=await p.$$eval('#page .mdcol button',bs=>bs.map(x=>x.dataset.v));
   T('개인 메모 색: 연보라(#e6ddff)가 빠지고 연한 청록이 들어옴 (7개)',cols.length===7&&!cols.includes('#e6ddff')&&cols.includes('#d2f1ef'),JSON.stringify(cols));
   T('오류 없음',p.errs.length===0,p.errs.join('|'));
   await p.ctx.close();}

  // ── 달력 범위: 2025년 1월부터 · 2025년 공휴일
  {const p=await boot(b,rich(),{});
   await p.evaluate(()=>window.__onPush({date:'2025-10-08',type:'x'}));await p.waitForTimeout(500);
   const sh=await p.evaluate(()=>({open:document.getElementById('sheet').classList.contains('open'),txt:document.getElementById('sheet').innerText}));
   T('2025-10-08 날짜 창이 열리고 대체공휴일로 나옴',sh.open&&sh.txt.includes('대체공휴일'),sh.txt.slice(0,80));
   await p.evaluate(()=>document.querySelector('#sheet [data-act="close"]')?.click());await p.waitForTimeout(250);
   let n=0;while(n++<30){const dis=await p.$eval('[data-act="prev"]',e=>e.disabled);if(dis)break;await p.click('[data-act="prev"]');await p.waitForTimeout(80);}
   const hdr=await p.$eval('[data-act="prev"]',e=>e.parentElement.innerText.replace(/\s+/g,' '));
   T('거꾸로 넘기면 2025년 1월에서 멈춤',(await p.$eval('[data-act="prev"]',e=>e.disabled))&&hdr.includes('2025.01'),hdr);
   const h25=await p.evaluate(()=>[...document.querySelectorAll('.track .panel:nth-child(2) .cell')].filter(c=>/설|신정|연휴/.test(c.innerText)).length);
   T('2025년 1월 달력에 설 연휴 · 신정이 표시됨',h25>=3,String(h25));
   T('오류 없음',p.errs.length===0,p.errs.join('|'));
   await p.ctx.close();}

  // ── 문의 메일: 가족 연결 번호가 자동으로 들어감 (서버에 남은 정보를 찾아 지울 때 씀)
  {const s=rich();s.link={hid:'dad',role:'guest',name:'엄마',perm:'write',mode:'own',uid:'uidmom123',hash:''};
   const p=await boot(b,s,{preInit:'window.AndroidBridge.appInfo=()=>JSON.stringify({version:"0.63",device:"Test",android:"15"});'});await toSet(p);
   await p.evaluate(()=>document.querySelector('[data-act="more-mail"]').click());await p.waitForTimeout(250);
   const m=await calls(p,'sendMail');
   T('문의 메일 본문에 가족 연결 번호가 들어감',m.length===1&&m[0][1].includes('uidmom123')&&m[0][1].includes('eonjeswieo.app@gmail.com'),JSON.stringify(m).slice(0,200));
   await p.ctx.close();
   const p2=await boot(b,rich(),{preInit:'window.AndroidBridge.appInfo=()=>JSON.stringify({version:"0.63"});'});await toSet(p2);
   await p2.evaluate(()=>document.querySelector('[data-act="more-mail"]').click());await p2.waitForTimeout(250);
   const m2=await calls(p2,'sendMail');
   T('가족 연결을 안 쓰면 번호 줄이 없음',m2.length===1&&!m2[0][1].includes('가족 연결 번호'),JSON.stringify(m2).slice(0,160));
   await p2.ctx.close();}

  // ── 내 데이터 모두 지우기 (서버를 안 쓰는 사람)
  {const s=rich();s.drive={last:+new Date('2026-10-10T10:00:00'),dirty:false,email:'a@b.c',auto:true};
   const pre=`window.AndroidBridge.driveLinked=()=>true;window.AndroidBridge.driveUnlink=()=>{window.__unlinked=(window.__unlinked||0)+1;};localStorage.setItem('eonjeswieo:hol','{"fetchedAt":1,"years":{}}');localStorage.setItem('eonjeswieo:err','[{"t":1,"m":"x"}]');localStorage.setItem('shiftcal:v9','{}');localStorage.setItem('other:key','keep');`;
   const p=await boot(b,s,{preInit:pre});accept(p);await toSet(p);
   await p.evaluate(()=>document.querySelector('[data-act="more-wipe"]').click());
   let ok=false;for(let i=0;i<40&&!ok;i++){await p.waitForTimeout(250);ok=await p.evaluate(()=>document.getElementById('onboard').classList.contains('open'));}
   T('모두 지우기: 처음 시작 화면이 열림',ok);
   T('확인창 2번 · 첫 글에 "구글 드라이브 백업은 안 지워져요" 안내',p.__dialogs.length===2&&p.__dialogs[0].includes('드라이브')&&p.__dialogs[0].includes('안 지워져요'),JSON.stringify(p.__dialogs));
   const left=await p.evaluate(()=>Object.keys(localStorage).sort());
   T('앱이 저장한 키는 새 기본값 하나만 남고 다른 앱 키는 그대로',JSON.stringify(left)===JSON.stringify(['eonjeswieo:v1','other:key']),JSON.stringify(left));
   const sv=await S(p);
   T('저장 값이 처음 상태 (근무표 · 메모 · 알람 · 드라이브 기록 없음)',!sv.myset&&Object.keys(sv.memos||{}).length===0&&(sv.alarms||[]).length===0&&!sv.drive.last&&!sv.link,JSON.stringify(sv).slice(0,160));
   T('드라이브 연결을 끊고(driveUnlink) 알람을 비움(setAlarms [])',(await p.evaluate(()=>window.__unlinked))===1&&(await calls(p,'setAlarms')).some(c=>c[1]==='["[]"]'),JSON.stringify(await calls(p,'setAlarms')));
   T('가림막이 남지 않음',await p.evaluate(()=>!document.getElementById('wipeBox')));
   T('오류 없음',p.errs.length===0,p.errs.join('|'));
   await p.ctx.close();}
  {const s=rich();const p=await boot(b,s,{});accept(p);await toSet(p);
   await p.evaluate(()=>document.querySelector('[data-act="more-wipe"]').click());await p.waitForTimeout(1500);
   T('드라이브를 안 쓴 사람에게는 드라이브 안내 줄이 없음',p.__dialogs.length===2&&!p.__dialogs[0].includes('드라이브'),JSON.stringify(p.__dialogs));
   await p.ctx.close();}
  {const p=await boot(b,rich(),{});await toSet(p);   // 첫 확인에서 취소하면 아무것도 안 지워짐
   await p.evaluate(()=>document.querySelector('[data-act="more-wipe"]').click());await p.waitForTimeout(500);
   T('첫 확인에서 취소(기본 dismiss)하면 그대로',(await S(p)).myset===true&&!(await p.evaluate(()=>document.getElementById('onboard').classList.contains('open'))));
   await p.ctx.close();}
  await b.close();T.sum();
})();

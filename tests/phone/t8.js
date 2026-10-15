// 달력 이미지 공유: 기본 기능 + 메모/스티커 선택
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const T=+new Date('2026-09-20T10:00:00');
const base={onboarded:true,anchor:'2026-10-06',myTeam:2,fontScale:100,overrides:{},alarms:[],addonNote:'done',addons:{},
 memos:{'2026-09-22':[{id:'m1',text:'가족 모임',shared:true,by:'host',t:1},{id:'m2',text:'나만 메모',shared:false,by:'host',t:2}]},
 stamps:{defs:[{id:'s_pill',kind:'pill',name:'약',times:3,rep:'daily',color:'#ef4d5a'},{id:'s_yoga',kind:'mark',emoji:'🧘',name:'요가',dates:['2026-09-24']}],log:{'2026-09-24':{s_yoga:1}},remind:false,more:false,pillTimes:['08:00','13:00','20:00']}};
(async()=>{const b=await chromium.launch();let ok=0,bad=0;const T_=(n,c)=>{if(c){ok++;console.log('✓',n);}else{bad++;console.log('✗ FAIL',n);}};
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
await p.addInitScript(([d,T])=>{const D=Date;globalThis.Date=class extends D{constructor(...a){super(...(a.length?a:[T]))}static now(){return T}};localStorage.setItem('eonjeswieo:v1',JSON.stringify(d));window.AndroidBridge={status:()=>'',setAlarms:()=>{},setReminders:()=>{}};},[base,T]);
await p.route('**/firebase/config.js',r=>r.fulfill({body:'',contentType:'text/javascript'}));
await p.goto('file:///home/user/sin/app/src/main/assets/index.html');await p.waitForTimeout(900);
await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
T_('설정에 이미지 공유 줄(부가 기능 꺼짐인데도)',!!(await p.$('[data-act="more-share"]')));
await p.click('[data-act="more-addons"]');await p.waitForTimeout(250);
const rows=await p.$$eval('#page .prow',a=>a.map(x=>x.innerText.replace(/\s+/g,' ')));
T_('부가 기능 7개',rows.filter(r=>/\n|켜|·|표시|버튼|보여|계산|봐요|붙여|알려/.test(r)).length>=0&&(await p.$$('#page .sw input')).length===7);
await p.click('#page [data-act="page-close"]');await p.waitForTimeout(200);
await p.click('[data-act="more-share"]');await p.waitForTimeout(400);
const q=async()=>p.evaluate(()=>({pill:getComputedStyle(document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-09-22"] .pill-wrap')).display,fam:document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-09-22"] .pill-wrap').innerText,stp:!!document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-09-24"] .stp'),chk:[document.getElementById('shareMemo').checked,document.getElementById('shareStk').checked]}));
let r=await q();T_('처음엔 둘 다 꺼짐 · 메모 안 보임 · 스티커 안 보임',r.pill==='none'&&!r.stp&&!r.chk[0]&&!r.chk[1]);
await p.screenshot({path:__dirname+'/v21/s1_off.png'});
await p.check('#shareMemo');await p.waitForTimeout(200);r=await q();
T_('메모 켜면 가족 메모만',r.pill!=='none'&&r.fam.includes('가족 모임')&&!r.fam.includes('나만 메모'));
await p.check('#shareStk');await p.waitForTimeout(200);r=await q();
T_('스티커 켜면 보임',r.stp);
await p.screenshot({path:__dirname+'/v21/s2_on.png'});
await p.click('[data-act="cancel-share"]');await p.waitForTimeout(200);
await p.click('#nav [data-tab="set"]');await p.click('[data-act="more-share"]');await p.waitForTimeout(300);
r=await q();T_('다시 열면 또 꺼짐으로 시작',!r.chk[0]&&!r.chk[1]&&!r.stp);
console.log('ERR',errs);console.log(ok,'통과',bad,'실패');await b.close();})();

// 스티커 잘림: 추석(9/24) 앞글자 + 스티커 2개, 좁은 화면 · 큰 글자 흉내
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const T=+new Date('2026-09-20T10:00:00');
const base={onboarded:true,anchor:'2026-10-06',myTeam:2,fontScale:100,overrides:{},alarms:[],memos:{},addonNote:'done',addons:{},
 stamps:{defs:[{id:'s_pill',kind:'pill',name:'약',times:3,rep:'daily',color:'#ef4d5a'},{id:'s_yoga',kind:'mark',emoji:'🧘',name:'요가',dates:['2026-09-24','2026-09-25']},{id:'s_gym',kind:'mark',emoji:'💪',name:'운동',dates:['2026-09-25']}],log:{'2026-09-25':{s_yoga:1,s_gym:1}},remind:false,more:false,pillTimes:['08:00','13:00','20:00']}};
(async()=>{const b=await chromium.launch();
for(const [w,zoom] of [[390,1],[360,1],[360,1.3],[320,1.3],[412,1.3]]){
 const p=await b.newPage({viewport:{width:w,height:844},deviceScaleFactor:2});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
 await p.addInitScript(([d,T])=>{const D=Date;globalThis.Date=class extends D{constructor(...a){super(...(a.length?a:[T]))}static now(){return T}};localStorage.setItem('eonjeswieo:v1',JSON.stringify(d));window.AndroidBridge={status:()=>'',setAlarms:()=>{},setReminders:()=>{}};},[base,T]);
 await p.route('**/firebase/config.js',r=>r.fulfill({body:'',contentType:'text/javascript'}));
 if(zoom!==1){const z=zoom;const css=`.cell .dn{font-size:${13*z}px}.cell .dn.fit1{font-size:${12*z}px}.cell .dn .h1{font-size:${10*z}px}.cell .dn.fit1 .h1{font-size:${9*z}px}.cell .dn .stp>.se{font-size:${10*z}px!important}.cell .dn.fit1 .stp>.se{font-size:${9*z}px!important}.s2>.se{font-size:${10*z}px!important}`;
  await p.route('file:///home/user/sin/app/src/main/assets/index.html',r=>r.fulfill({contentType:'text/html',body:require('fs').readFileSync('/home/user/sin/app/src/main/assets/index.html','utf8').replace('</head>','<style>'+css+'</style></head>')}));}
 await p.goto('file:///home/user/sin/app/src/main/assets/index.html');await p.waitForTimeout(1200);
 await p.waitForTimeout(300);
 const info=await p.evaluate(()=>{const o={};for(const k of ['2026-09-24','2026-09-25','2026-09-26']){const c=document.querySelector('.track .panel:nth-child(2) .cell[data-k="'+k+'"]');const dn=c.querySelector('.dn');const r=c.getBoundingClientRect();const kids=[...dn.children].map(e=>e.getBoundingClientRect().right);o[k]={cls:dn.className,cell:Math.round(r.right),maxRight:Math.round(Math.max(...kids)),text:dn.textContent.replace(/\s+/g,''),s2:!!c.querySelector('.s2'),stp:(c.querySelector('.stp')||{children:[]}).children.length};}return o;});
 console.log(w,zoom,JSON.stringify(info));
 await p.screenshot({path:`v21/fit_${w}_${zoom}.png`,clip:{x:0,y:430,width:w,height:260}});
 console.log('ERR',errs);await p.close();}
await b.close();})();

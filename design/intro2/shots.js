// 앱 소개 페이지 그림: 실제 앱을 예시 데이터로 찍음 (node design/intro2/shots.js)
const {chromium,boot,base}=require('../../tests/phone/lib.js');
const OUT=__dirname+'/shots';
const KST=(y,mo,d,h)=>Date.UTC(y,mo-1,d,h-9);const p2=n=>String(n).padStart(2,'0');
const mkWx=r=>{const h={},hh={};for(let d=12;d<=18;d++)for(let x=0;x<24;x++){const rain=d===14&&x>=17&&x<=21;h[`202610${p2(d)}${p2(x)}`]=[rain?11:(x<9?9:16),rain?9:12,rain?60:10,rain?1:0,0,rain?4:1,rain?70:20];if(d<14||(d===14&&x<=6))hh[`202610${p2(d)}${p2(x)}`]=[30,15];}
  const md={};for(let d=12;d<=18;d++)md[`202610${p2(d)}`]=[1,1];
  return {v:1,r,n:'',s:{b:'202610140500',h,n:{}},m:{b:'',d:{}},a:{b:'202610140500',d:md},q:{t:'2026-10-14 06:00',p10:30,p25:15,hh}};};
const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(u.searchParams.has('past')?{d:{}}:{list:[mkWx('41111')]})});}]];
const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
const defs=[{id:'s1',kind:'mark',emoji:'🏃',name:'달리기'},{id:'s2',kind:'mark',emoji:'📖',name:'독서'},{id:'s3',kind:'pill',name:'약',times:2},{id:'s4',kind:'mark',emoji:'😌',name:'기분'}];
const log={'2026-10-14':{s_pill:1,s_run:1},'2026-10-02':{s_run:1},'2026-10-06':{s_run:1,s_read:1},'2026-10-08':{s_read:1},'2026-10-13':{s_run:1,s_gym:1},'2026-10-10':{s_run:1},'2026-10-12':{s_pill:1}};
const memos={'2026-10-14':[{id:'m0',text:'퇴근하고 마트',t:KST(2026,10,13,21)},{id:'m00',text:'아이 학예회 10시',t:KST(2026,10,13,22),shared:true,by:'guest'}],'2026-10-05':[{id:'m1',text:'9시 정비 교육',t:1}],'2026-10-08':[{id:'m2',text:'엄마 생신',t:1,color:'#ffe3ec'}],'2026-10-16':[{id:'m3',text:'저녁 같이 먹자',t:1,shared:true}],'2026-10-21':[{id:'m4',text:'건강검진',t:1}],'2026-10-27':[{id:'m5',text:'차 정비',t:1}]};
const fam=[{id:'f1',name:'지우',color:'#f59e0b',kind:'student',days:[1,2,3,4,5],start:'08:40',end:'15:00',holOff:true,vac:[]}];
const st={...base,calLook:'fill',bg:'',pattern:['주','주','야','야','휴','휴','휴','휴'],anchor:'2026-10-13',memos,stamps:{log},family:fam,addons:{...base.addons,wx:true,together:true},wx:{home:'41111',work:'',fw:{},nm:{}},
  alarms:[{id:'a1',label:'',time:'05:30',shift:'주',offset:0,on:true,sound:true,vib:true,vol:100,ramp:true,tone:'',toneName:'기본 알람음',snMin:5,snMax:3,wx:true},{id:'a2',label:'',time:'16:00',shift:'야',offset:0,on:true,sound:true,vib:true,vol:100,ramp:false,tone:'',toneName:'기본 알람음',snMin:5,snMax:3,wx:true}],
  board:{'2026-10':[{id:'pa',type:'list',title:'이번 달',lines:[{id:'l1',text:'관리비 내기',done:true},{id:'l2',text:'겨울 타이어',done:false}],t:1,by:'host',color:'y'},{id:'pb',type:'note',text:'14일 결혼식 축의금',t:2,by:'host',color:'k'}]},
  hints:{tcal:1,twx:1,tfam:1,tpi:1}};
(async()=>{
  const b=await chromium.launch();
  const open=async(o={})=>{const p=await boot(b,{...st,...(o.st||{})},{tz:'Asia/Seoul',T:o.T||KST(2026,10,14,6),cfg,routes,w:390,h:844});await p.waitForTimeout(1500);return p;};
  const shot=(p,n,clip)=>p.screenshot({path:`${OUT}/${n}.png`,...(clip?{clip}:{})});
  const act=(p,a,ds={})=>p.evaluate(([a,ds])=>{const x=document.createElement('button');x.dataset.act=a;Object.assign(x.dataset,ds);document.body.appendChild(x);x.click();x.remove();},[a,ds]);
  let p=await open();await p.waitForTimeout(2500);await shot(p,'cal');
  await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(1500);await shot(p,'day');
  await p.evaluate(()=>{const c=document.querySelector('#sheet [data-act="wx-day"],#sheet .wxcard,#sheet [data-act^="wx"]');if(c)c.click();});await p.waitForTimeout(1200);await shot(p,'wx');
  await p.close();
  p=await open();await p.click('#nav [data-tab="alarm"]');await p.waitForTimeout(900);await shot(p,'alarm');
  await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(1200);await shot(p,'fam');
  await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(500);await act(p,'open-board');await p.waitForTimeout(900);await shot(p,'board');
  await p.close();
  p=await open();await act(p,'more-pattern');await p.waitForTimeout(900);await shot(p,'pattern');await p.evaluate(()=>__wx.closePage());
  await act(p,'stk-board');await p.waitForTimeout(900);await shot(p,'stk');await p.close();
  const q=await boot(b,null,{w:390,h:844});await q.waitForTimeout(800);await shot(q,'onboard');await q.close();
  await b.close();console.log('ok');
})();

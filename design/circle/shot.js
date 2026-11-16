// 동그라미 모양 시안 (node design/circle/shot.js)
const {chromium,boot,base}=require('../../tests/phone/lib.js');
const NEW=`html:not([data-cal="fill"]) .cell:not(.pers){--b:calc(max(30px,min(84cqw,44px,calc(100cqh - 68px)))*.84)}
html:not([data-cal="fill"]) .bwrap .badge{font-size:calc(var(--b)*.42)}
html:not([data-cal="fill"]) .bwrap .badge.r{font-weight:700}`;
(async()=>{
  const b=await chromium.launch();
  const memos={'2026-10-05':[{id:'m1',text:'9시 지게차',t:1}],'2026-10-14':[{id:'m2',text:'07:35 출근',t:1}],'2026-10-20':[{id:'m3',text:'교육 확정',t:1}],'2026-10-22':[{id:'m4',text:'오전 8시 병원',t:1}],'2026-10-27':[{id:'m5',text:'qr등록',t:1}]};
  const st={...base,calLook:'circle',pattern:['주','주','주','야','야','휴','휴','휴'],anchor:'2026-10-01',memos,hints:{tcal:1,twx:1,tfam:1,tpi:1}};
  for(const [bg,css,n] of [['','', 'a'],['',NEW,'b'],['vivid','','c'],['vivid',NEW,'d']]){
    const p=await boot(b,{...st,bg});if(css)await p.addStyleTag({content:css});await p.waitForTimeout(500);
    await p.screenshot({path:`${n}.png`,clip:{x:0,y:0,width:390,height:700}});await p.close();
  }
  const p=await b.newPage();await p.goto('file://'+process.cwd()+'/v1.html');await p.waitForTimeout(400);await p.screenshot({path:'v1.png',fullPage:true});
  await b.close();
})();

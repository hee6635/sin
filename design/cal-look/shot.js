// 달력 진하기 시안: 실제 앱에 바꿀 CSS 를 입혀 찍음 (node design/cal-look/shot.js)
const {chromium,boot,base}=require('../../tests/phone/lib.js');
const NEW_BASE=`
html:not([data-bg])[data-cal="fill"]:not([data-theme="dark"]){--cbm:42%}
html:not([data-bg]):not([data-theme="dark"]){--restx:#c23a5a}
html:not([data-bg]) .cell .num{font-weight:700}
html:not([data-bg]) .bwrap .badge.r{font-weight:700}
html:not([data-bg])[data-cal="fill"]:not([data-theme="dark"]) .bwrap .badge.c{color:color-mix(in srgb,var(--tb) 30%,#000);font-weight:700}`;
const NEW_VIVID=`
html[data-bg="vivid"][data-cal="fill"] .cell:not(.out){box-shadow:none}
html[data-bg="vivid"][data-cal="fill"] .cell[style*="--cb"]:not(.out){box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--cb) 70%,#000 12%)}`;
(async()=>{
  const b=await chromium.launch();
  const memos={'2026-10-05':[{id:'m1',text:'9시 지게차',t:1}],'2026-10-14':[{id:'m2',text:'07:35 출근',t:1}],'2026-10-20':[{id:'m3',text:'교육 확정',t:1}],'2026-10-22':[{id:'m4',text:'오전 8시 병원',t:1}],'2026-10-27':[{id:'m5',text:'qr등록',t:1}]};
  const st={...base,calLook:'fill',pattern:['주','주','주','야','야','휴','휴','휴'],anchor:'2026-10-01',memos,hints:{tcal:1,twx:1,tfam:1,tpi:1}};
  for(const [bg,css,n] of [['','', 'a'],['',NEW_BASE,'b'],['vivid','','c'],['vivid',NEW_VIVID,'d']]){
    const p=await boot(b,{...st,bg});
    if(css)await p.addStyleTag({content:css});
    await p.waitForTimeout(500);
    await p.screenshot({path:`design/cal-look/${n}.png`,clip:{x:0,y:0,width:390,height:700}});
    await p.close();
  }
  await b.close();
})();

// 오늘 띠 안쪽 / 경계 / 바깥 비교 (실제 앱 화면에 CSS 만 바꿔서 찍음)
const {chromium,boot,base}=require('../../tests/phone/lib.js');
const D=__dirname+'/';
(async()=>{const b=await chromium.launch();
 const m=(id,t,c)=>({id,text:t,color:c||'',done:false});
 for(const look of ['fill','circle']){
  const p=await boot(b,{...base,calLook:look,memos:{'2026-10-12':[m('a','교육 확정','#7b5cf0')],'2026-10-13':[m('b','바이올린','#7b5cf0')],'2026-10-11':[m('c','업무 메모')]}},{});
  const info=await p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell.today'),s=getComputedStyle(c,'::after');return {inset:s.inset,b:s.border,bt:s.borderTop,br:s.borderRadius,z:s.zIndex,shadow:s.boxShadow,out:s.outline};});
  await p.waitForTimeout(4000);
  const r=await p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell.today').getBoundingClientRect();return [c.x,c.y,c.width,c.height];});
  for(const [nm,css] of [['now',''],['edge',window_css('edge',look)],['out',window_css('out',look)]]){
   await p.evaluate(c=>{let st=document.getElementById('xr');if(!st){st=document.createElement('style');st.id='xr';document.head.appendChild(st);}st.textContent=c;},css);
   await p.waitForTimeout(200);
   await p.screenshot({path:D+`${look}_${nm}.png`,clip:{x:Math.max(0,r[0]-r[2]-6),y:r[1]-8,width:r[2]*3+12,height:r[3]+16}});
  }
  await p.close();}
 await b.close();})();
function window_css(kind,look){
 // 띠 그리는 ::after 를 바깥으로: edge = 2px 바깥 + 1px 안 / out = 3px 모두 바깥
 const o=kind==='edge'?'-2px':'-3px';
 return `.track .cell.today{overflow:visible!important;z-index:5}.track .cell.today::after{inset:${o}!important;border-radius:${look==='fill'?'12px':'3px'}!important}`;
}

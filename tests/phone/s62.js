// v0.81 고침: 접고 펼 때(폭이 바뀔 때) 스티커 크기 · 메모 줄 수가 그 화면에서 새로 켠 것과 같아짐
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const t=+new Date('2026-10-12T10:00:00');
  const m=(id,text)=>({id,text,shared:false,by:'host',t});
  const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
  const defs=['👟','📖','🏀','🦷'].map((e,i)=>mk('m'+i,e,'s'+i,{dates:['2026-10-09','2026-10-13']}));
  const st=()=>({...base,calLook:'fill',stamps:{defs,log:{},v3:1,v4:1,lastAt:[]},memos:{'2026-10-12':[m('a','가'),m('b','나'),m('c','다'),m('d','라')]}});
  const snap=p=>p.evaluate(()=>{const r=document.documentElement.style;const c=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-12"]');return JSON.stringify({stz:r.getPropertyValue('--stz'),plh:r.getPropertyValue('--plh'),n:c.querySelectorAll('.pill-wrap>*').length,tstk:getComputedStyle(document.documentElement).getPropertyValue('--tstk').trim()});});
  for(const [from,to] of [[[820,1100],[390,844]],[[390,844],[820,1100]],[[904,1200],[360,700]]]){
    const p=await boot(b,st(),{w:from[0],h:from[1],touch:true});
    await p.setViewportSize({width:to[0],height:to[1]});await p.waitForTimeout(900);
    const a=await snap(p);
    const q=await boot(b,st(),{w:to[0],h:to[1],touch:true});
    const c=await snap(q);
    T(`${from[0]}→${to[0]}: 접고 펼친 뒤 = 그 크기로 새로 켠 것 (스티커 크기 · 메모 줄 · 배율)`,a===c,a+' | '+c);
    T(`${from[0]}→${to[0]}: 오류 없음`,p.errs.length===0&&q.errs.length===0,p.errs.concat(q.errs).join('|'));
    await p.close();await q.close();
  }
  T.sum();await b.close();
})();

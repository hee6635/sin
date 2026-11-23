// v0.237: 스티커 창에서 줄을 눌러 완료 · 취소해도 창을 다시 열지 않음 (다시 열면 창이 하얗게 번쩍였음) · 숫자 · 표시는 그대로 바뀜
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const T=mkT();const b=await chromium.launch();
  const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'daily',from:'2026-10-01',to:'',days:[],dates:[],skip:[],ats:[],...x});
  const st={...base,stamps:{defs:[mk('s1','👟','조깅'),mk('s2','📖','독서',{times:2})],log:{},snap:{},v3:1,v4:1,lastAt:[]}};
  const p=await boot(b,st);
  await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-12"] .stz').click());await p.waitForTimeout(600);
  const has=await p.evaluate(()=>!!document.querySelector('#pop.open .sdr2'));
  T('스티커 창 열림',has);
  if(has){
    await p.evaluate(()=>{window.__menu=document.querySelector('#pop .menu');window.__anims=0;const o=Element.prototype.animate;Element.prototype.animate=function(...a){if(this.closest&&this.closest('#pop')&&(this.matches('.menu,#pop')||this.id==='pop'))window.__anims++;return o.apply(this,a);};});
    for(const id of ['s1','s2','s1']){await p.click(`#pop .sdr2[data-id="${id}"]`);await p.waitForTimeout(900);}
    const r=await p.evaluate(()=>({same:document.querySelector('#pop .menu')===window.__menu,open:document.querySelector('#pop').classList.contains('open'),a:window.__anims,s1:document.querySelector('#pop .sdr2[data-id="s1"]').classList.contains('done'),c2:(document.querySelector('#pop .sdr2[data-id="s2"] .sdcnt')||{}).textContent,log:JSON.stringify(__wx.S.stamps.log['2026-10-12']||{})}));
    T('누를 때마다 창을 새로 그리지 않음 (같은 창 · 열림 애니메이션 없음)',r.same&&r.open&&r.a===0,JSON.stringify(r));
    T('완료 → 취소 · 1/2 숫자 그대로 반영',!r.s1&&/1\/2/.test(r.c2||''),JSON.stringify(r));
  }
  T('오류 없음',p.errs.length===0,p.errs.join('|'));await b.close();T.sum();
})();

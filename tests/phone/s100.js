// v0.161: 종이 테마 뺌(예전 종이 → 기본) · 동그라미 조금 크게(좁은 폰은 빨간 점 자리 남김) · 위젯 데이터에 근무 이름(tn)
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const st={...base,calLook:'circle',pattern:['주','주','야','휴'],anchor:'2026-10-01',overrides:{'2026-10-14':'주'}};
  for(const w of [360,412]){
    const p=await boot(b,st,{w});
    const r=await p.evaluate(()=>{const c=[...document.querySelectorAll('#view .cell')].find(x=>!x.classList.contains('out')&&x.querySelector('.dot')&&(x.querySelector('.num')||{}).textContent==='14');const d=c.querySelector('.dot').getBoundingClientRect(),bd=c.querySelector('.bwrap .badge').getBoundingClientRect(),cc=c.getBoundingClientRect();return {gap:bd.left-d.right,b:bd.width,inCell:d.left>=cc.left-0.5};});
    T(`${w}px 동그라미 크게 (${r.b.toFixed(1)}px) · 빨간 점 자리 남음 (${r.gap.toFixed(1)}px)`,r.b>(w===360?28:34)&&r.gap>=2.5&&r.inCell,JSON.stringify(r));
    if(w===412){
      const j=await p.evaluate(()=>{let o='';window.AndroidBridge.setWidgetData=x=>{o=x;};__wx.pushWidgetNow();return JSON.parse(o);});
      const d=j.days.find(x=>x.t==='주'),r2=j.days.find(x=>x.t==='휴');
      T('위젯 데이터: 근무 이름 tn (주간 · 휴무)',d&&d.tn==='주간'&&r2&&r2.tn==='휴무',JSON.stringify([d&&d.tn,r2&&r2.tn]));
    }
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  const q=await boot(b,{...base,bg:'paper'});
  T('예전 종이 → 기본',(await q.evaluate(()=>__wx.S.bg))===''&&!(await q.evaluate(()=>document.documentElement.hasAttribute('data-bg'))));
  await q.close();await b.close();T.sum();
})();

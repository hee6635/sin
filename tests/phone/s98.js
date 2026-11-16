// v0.159: 이럴 땐 이렇게 — 묶음 줄 › 없음 · 펼치기/접기 모션 · 동작 줄이기면 바로
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  for(const rm of [false,true]){
    const p=await boot(b,base,{rm});
    await p.evaluate(()=>{const x=document.createElement('button');x.dataset.act='tips-open';document.body.appendChild(x);x.click();x.remove();});
    await p.waitForTimeout(400);
    const after=await p.evaluate(()=>getComputedStyle(document.querySelector('.tips.np .tipg>summary'),'::after').display);
    if(!rm)T('묶음 줄에 › 없음',after==='none',after);
    const g=await p.$('.tips.np .tipg>summary');const h0=await p.evaluate(()=>document.querySelector('.tips.np .tipg').getBoundingClientRect().height);
    await g.click();await p.waitForTimeout(rm?50:90);
    const mid=await p.evaluate(()=>{const d=document.querySelector('.tips.np .tipg');return [d.open,d.getBoundingClientRect().height];});
    await p.waitForTimeout(400);
    const h1=await p.evaluate(()=>document.querySelector('.tips.np .tipg').getBoundingClientRect().height);
    if(!rm)T('펼치는 중엔 높이가 사이 값 (스르르)',mid[0]&&mid[1]>h0+2&&mid[1]<h1-2,`${h0} ${mid[1]} ${h1}`);
    else T('동작 줄이기: 바로 펼쳐짐',mid[0]&&Math.abs(mid[1]-h1)<1,`${mid[1]} ${h1}`);
    await g.click();await p.waitForTimeout(rm?50:90);
    const c1=await p.evaluate(()=>document.querySelector('.tips.np .tipg').open);
    await p.waitForTimeout(400);
    const c2=await p.evaluate(()=>{const d=document.querySelector('.tips.np .tipg');return [d.open,d.getBoundingClientRect().height];});
    T(rm?'동작 줄이기: 바로 접힘':'접는 중엔 열린 채 줄어들다 끝나면 닫힘',(rm?!c1:c1)&&!c2[0]&&Math.abs(c2[1]-h0)<1,`${c1} ${c2}`);
    await g.click();await p.waitForTimeout(400);
    const tip=await p.$('.tips.np .tip>summary');await tip.click();await p.waitForTimeout(400);
    T('안쪽 팁도 펼쳐짐 · 바로 가기 보임',await p.evaluate(()=>{const d=document.querySelector('.tips.np .tip');return d.open&&!!d.querySelector('.tgo').getBoundingClientRect().height;}));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));
    await p.close();
  }
  await b.close();T.sum();
})();

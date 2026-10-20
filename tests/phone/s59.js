// v0.80 고침: 처음 켤 때 · 다른 탭에서 돌아올 때 메모 줄 수가 날짜 창을 다녀온 뒤와 같아야 함 (그리기 전 어림값 → 그린 뒤 실제 높이로 다시 맞춤)
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const t=+new Date('2026-10-12T10:00:00');
  const m=(id,text)=>({id,text,shared:false,by:'host',t});
  const memos={'2026-10-12':[m('a','첫째'),m('b','둘째'),m('c','셋째'),m('d','넷째')],'2026-10-16':[m('e','치과'),m('f','자동차')]};
  const st=()=>({...base,memos});
  const snap=p=>p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-12"]'),r=document.documentElement.style;return JSON.stringify({n:c.querySelectorAll('.pill-wrap>*').length,lh:r.getPropertyValue('--plh'),fs:r.getPropertyValue('--plf')});});
  for(const [w,h] of [[390,844],[412,915],[360,640],[820,1100],[904,1200],[600,900]]){
    const p=await boot(b,st(),{w,h,touch:true});
    const a=await snap(p);
    await p.click('#nav [data-tab="set"]');await p.waitForTimeout(300);
    await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(500);
    const c=await snap(p);
    await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-16"]').click());await p.waitForTimeout(500);
    await p.evaluate(()=>{const x=document.querySelector('[data-act="close"]');x&&x.click();});await p.waitForTimeout(500);
    const d=await snap(p);
    T(`${w}x${h}: 켠 직후 = 탭 다녀옴 = 날짜 창 다녀옴 (메모 줄 수 · 글자 크기)`,a===c&&c===d,a+' | '+c+' | '+d);
    T(`${w}x${h}: 오류 없음`,p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();

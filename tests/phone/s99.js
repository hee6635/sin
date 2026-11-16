// v0.160: 달력 진하기 — 기본 칸 색 42% · 휴 진하게 / 또렷하게 흰 칸 테두리 없음 · 어두운 화면은 그대로
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const st={...base,calLook:'fill'};
  const look=async(bg,theme)=>{const p=await boot(b,{...st,bg,theme});const r=await p.evaluate(()=>{const cs=getComputedStyle(document.documentElement),cells=[...document.querySelectorAll('#view .cell:not(.out)')];const emp=cells.find(c=>!c.getAttribute('style')||!c.getAttribute('style').includes('--cb')),col=cells.find(c=>(c.getAttribute('style')||'').includes('--cb'));return {cbm:cs.getPropertyValue('--cbm').trim(),rest:cs.getPropertyValue('--restx').trim(),emp:emp?getComputedStyle(emp).boxShadow:'',col:col?getComputedStyle(col).boxShadow:''};});const e=p.errs.slice();await p.close();return [r,e];};
  let [r,e]=await look('', 'light');
  T('기본 (밝은 화면): 칸 색 42% · 휴 빨강 진하게',r.cbm==='42%'&&r.rest==='#c23a5a',JSON.stringify(r));
  [r,e]=await look('', 'dark');
  T('기본 (어두운 화면): 그대로',r.cbm==='44%',JSON.stringify(r));
  [r,e]=await look('vivid','light');
  T('또렷하게: 흰 칸 테두리 없음 · 근무 칸엔 선',r.emp==='none'&&r.col!=='none'&&r.cbm==='58%',JSON.stringify(r));
  [r,e]=await look('vivid','dark');
  T('또렷하게 (어두운 화면): 흰 선 그대로',/255, 255, 255/.test(r.emp),JSON.stringify(r));
  T('오류 없음',!e.length,e.join('|'));
  await b.close();T.sum();
})();

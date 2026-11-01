// v0.121 가족 탭: 나 · 가족 카드 같은 크기 · 같은 모양 (상태 · 막대 · 작은 날씨 줄 · 결론 한 줄)
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const fam=[{id:'f1',name:'유찬',kind:'student',label:'유치원',start:'09:00',end:'15:00',vac:[],color:'#ec4899',loc:'41113',
    sdefs:[{id:'m_a',emoji:'🎹',name:'피아노',act:{s:'16:00',e:'17:00'}}],stk:{'2026-10-14':['m_a']}}];
  const mk=r=>{const h={};for(let d=11;d<=20;d++)for(let x=0;x<24;x++){const rain=x===15;h[`202610${p2(d)}${p2(x)}`]=[12,rain?80:10,rain?1:0,rain?4:1,rain?2:0,2,50];}return {v:1,r,n:'',s:{b:'202610120500',h,n:{}},m:{b:'',d:{}},a:{b:'',d:{}},q:null};};
  const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
  const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({list:[mk('41111'),mk('41113')]})})]];
  const st={...base,family:fam,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{},nm:{}}};
  for(const [w,sh] of [[390,'a'],[800,'b']]){
    const p=await boot(b,st,{tz:'Asia/Seoul',T:KST(2026,10,14,10),cfg,routes,touch:true,w});await p.waitForTimeout(2500);
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(500);
    const r=await p.evaluate(()=>{const cs=[...document.querySelectorAll('.now.fams > .nc')];return {n:cs.length,w:cs.map(c=>Math.round(c.getBoundingClientRect().width)),me:cs[0]&&cs[0].innerText.replace(/\s+/g,' '),yu:cs[1]&&cs[1].innerText.replace(/\s+/g,' '),bar:!!(cs[1]&&cs[1].querySelector('.bar')),mwx:cs.map(c=>!!c.querySelector('.mwx')),one:!!document.querySelector('.now.one')};});
    T(`[${w}] 나 · 유찬 카드 같은 줄 · 같은 폭`,r.n===2&&Math.abs(r.w[0]-r.w[1])<2&&!r.one,JSON.stringify(r));
    T(`[${w}] 유찬: 유치원 · 막대 · 등원 → 하원 → 활동 날씨 · 결론 "하원 때 비"`,r.bar&&/등원/.test(r.yu)&&/하원/.test(r.yu)&&/활동/.test(r.yu)&&/비/.test(r.yu),r.yu);
    T(`[${w}] 나 카드도 작은 날씨 줄`,r.mwx[0]&&r.mwx[1],r.me);
    if(process.env.SHOT)await p.screenshot({path:process.env.SHOT+sh+'.png'});
    await p.evaluate(()=>document.querySelectorAll('.now.fams .mwx')[1].click());await p.waitForTimeout(400);
    T(`[${w}] 날씨 줄 누르면 유찬 날씨 팝업`,await p.evaluate(()=>/유찬/.test((document.querySelector('#pop')||{}).innerText||'')));
    T(`[${w}] 오류 없음`,p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // 가족 없으면 예전 큰 카드 그대로
  {const p=await boot(b,{...st,family:[]},{tz:'Asia/Seoul',T:KST(2026,10,14,10),cfg,routes});await p.waitForTimeout(2000);
   await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
   T('가족 없으면 내 큰 카드 그대로',await p.evaluate(()=>!!document.querySelector('.now.one .nc.me2')&&!document.querySelector('.fc2')));await p.close();}
  T.sum();await b.close();
})();

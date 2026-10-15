const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const m={id:'a1',text:'서류',shared:false,by:'host',t:1,color:'#fff1c4',todo:true,done:true,time:'09:00',al:'10'};
 const p=await boot(b,{...base,memos:{'2026-10-14':[m]}},{touch:true});
 await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]').click());await p.waitForTimeout(300);
 await p.click('.mcard');await p.waitForTimeout(100).catch(()=>{});
 const r=await p.evaluate(()=>{window.__x=1;return JSON.parse(localStorage.getItem('eonjeswieo:v1')).memos});
 // 저장을 한 번 일으켜 normalize 결과 확인
 await p.evaluate(()=>document.querySelector('.mcard .mchk').click());await p.waitForTimeout(200);
 const mm=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).memos['2026-10-14'][0]);
 console.log(JSON.stringify(mm));
 T('재시작 후에도 색 · 시간 · 알림 유지',mm.color==='#fff1c4'&&mm.time==='09:00'&&mm.al==='10'&&mm.todo===true);
 T('완료 체크 토글(done 해제)',!mm.done);
 console.log(p.errs);T.sum();await b.close();})();

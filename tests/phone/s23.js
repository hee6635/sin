const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
 // ===== 약 기록 보존
 const pill={id:'p1',kind:'pill',emoji:'💊',name:'약',times:3,color:'#ef4d5a',rep:'daily',from:'2026-10-10',to:'',days:[],dates:[],skip:[],ats:[]};
 let p=await boot(b,{...base,stamps:{defs:[pill,mk('e','',' ',{empty:true})],log:{},snap:{},v3:1,v4:1,lastAt:[]}},{touch:true});
 const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
 const cell=k=>`.track .panel:nth-child(2) .cell[data-k="${k}"]`;
 await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell('2026-10-12'));await p.waitForTimeout(300);
 await p.click('#pop [data-act="sd-done"]');await p.waitForTimeout(300);
 let s=await S();
 T('먹음 표시하면 그날 기록에 색 · 횟수 · 모양 저장',JSON.stringify(s.stamps.snap['2026-10-12'])===JSON.stringify({p1:{c:'#ef4d5a',t:3,h:'caps'}}),JSON.stringify(s.stamps.snap));
 await p.mouse.click(195,60);await p.waitForTimeout(300);
 if(await p.$('#pop.open'))await p.mouse.click(195,30);await p.waitForTimeout(300);
 // 약 색 · 횟수를 바꿈
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);await p.click('[data-act="stk-board"]');await p.waitForTimeout(350);
 await p.click('#page [data-act="slot-open"][data-id="p1"]');await p.waitForTimeout(250);
 await p.click('#pop [data-act="slot-col"][data-v="#2f6bf0"]');await p.waitForTimeout(400);
 await p.click('#pop [data-act="slot-save"]');await p.waitForTimeout(300);
 await p.click('#page .pg-h .bk');await p.waitForTimeout(250);await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(300);
 const col=k=>p.$eval(cell(k)+' .pillic',e=>e.getAttribute('style')).catch(()=>'');
 T('이미 먹은 날(12일)은 옛 색 그대로',(await col('2026-10-12')).includes('#ef4d5a'),await col('2026-10-12'));
 T('앞으로의 날(14일)은 새 색',(await col('2026-10-14')).includes('#2f6bf0'),await col('2026-10-14'));
 // 횟수 변경도 지난 기록엔 영향 없음 (3번 → 1번)
 await p.evaluate(()=>{});
 s=await S();s.stamps.defs[0].times=1;await p.evaluate(x=>{localStorage.setItem('eonjeswieo:v1',JSON.stringify(x));},s);await p.reload();await p.waitForTimeout(900);
 const parts=await p.$eval(cell('2026-10-12')+' .pillic',e=>({lines:e.querySelectorAll('.pd').length,off:e.classList.contains('off')})).catch(()=>null);
 T('횟수를 1번으로 바꿔도 지난 날은 3칸(나눔선 2개)',parts&&parts.lines===2,JSON.stringify(parts));
 await p.close();
 // ===== 가려짐 안내: 새 스티커가 앞칸이라 기존이 밀려날 때
 const dd=(id,e,n,x={})=>mk(id,e,n,{rep:'daily',from:'2026-10-13',...x});
 p=await boot(b,{...base,stamps:{defs:[mk('x','🎯','앞칸'),dd('a1','🧘','하나'),dd('a2','🏃','둘'),dd('a3','💧','셋'),dd('a4','💪','넷'),mk('e','',' ',{empty:true})],log:{},snap:{},v3:1,v4:1,lastAt:[]}},{touch:true});
 await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell('2026-10-10'));await p.waitForTimeout(300);
 await p.click('#pop [data-act="sp-pick"][data-id="x"]');await p.waitForTimeout(300);
 await p.click('#page [data-act="sr-rep"][data-v="daily"]');await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(500);
 const pop=await p.$eval('#pop',e=>e.innerText.replace(/\s+/g,' ')).catch(()=>'');
 console.log(pop);
 T('기존 스티커가 밀려나면 안내창(어느 쪽이든)',pop.includes('가려져요')&&pop.includes('밀려서')&&pop.includes('넷'));
 await p.click('#pop [data-act="sh-undo"]');await p.waitForTimeout(300);
 T('등록 취소하면 앞칸 스티커는 반복 아님으로 복귀',(await S()).stamps.defs[0].rep==='none');
 console.log(p.errs);T.sum();await b.close();})();

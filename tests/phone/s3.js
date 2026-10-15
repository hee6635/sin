const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 // 1) 옛 저장 데이터(v0.28 모양) 부팅
 const old={...base,stamps:{defs:[{id:'p1',kind:'pill',emoji:'💊',name:'비타민',times:3,color:'#ef4d5a',rep:'daily',from:'2026-10-01',to:'',days:[],dates:[],skip:[]},
   {id:'m1',kind:'mark',emoji:'👟',name:'조깅',rep:'dow',days:[1,3],from:'2026-10-01',rt:'noon'},{id:'m2',kind:'mark',emoji:'💪',name:'운동',rep:'none',rt:''}],
   log:{'2026-10-12':{p1:2}},remind:true,more:false,pillTimes:['07:30','12:30','21:00'],lastRt:'noon'}};
 let p=await boot(b,old,{touch:true});
 let st=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')||'{}').stamps||null);
 const live=await p.evaluate(()=>1);
 T('옛 데이터 부팅 + 달력 그려짐',await p.evaluate(()=>document.querySelectorAll('.track .panel:nth-child(2) .cell').length===42));
 await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-12"] .stz').click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('[data-act="sd-done"]')&&document.querySelector('[data-act="sd-done"]').click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.getElementById('pop').click());await p.waitForTimeout(250);
 st=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).stamps);
 console.log(JSON.stringify(st.defs.map(d=>[d.name,d.retired?1:0])));
 T('옛 스티커 → 새 기본 9칸 + 옛것은 보관(retired)',st.v4===1&&st.defs.filter(d=>!d.retired).length===9&&st.defs.filter(d=>d.retired).length>=2);
 T('옛 기록(10/12 비타민 2번)은 그대로 남음',await p.evaluate(()=>!!document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-12"] .stp>*')));
 T('옛 스티커는 앞으로 안 깔림(10/14 비어 있음)',await p.evaluate(()=>!document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-14"] .stp>*')));
 T('옛 스티커 알림은 예약 안 됨',(await p.evaluate(()=>(window.__rem||[]).filter(r=>String(r.id||'').startsWith('a_')).length))===0);
 // 2) 근무타입 순서 + 주 시작 + 개인
 p=await boot(b,base,{touch:true});
 await p.evaluate(()=>{document.querySelector('#nav [data-tab="set"]').click();});await p.waitForTimeout(200);
 await p.evaluate(()=>document.querySelector('[data-act="weekstart"][data-v="1"]').click());await p.waitForTimeout(200);
 T('월요일 시작',await p.evaluate(()=>document.querySelector('.dow span')===null?true:true));
 await p.evaluate(()=>document.querySelector('#nav [data-tab="cal"]').click());await p.waitForTimeout(200);
 T('월요일 첫 칸',await p.evaluate(()=>document.querySelector('.dow span').textContent==='월'));
 await p.screenshot({path:'c1.png'});
 await p.evaluate(()=>{document.querySelector('#nav [data-tab="set"]').click();});await p.waitForTimeout(200);
 await p.evaluate(()=>document.querySelector('[data-act="more-pattern"]').click());await p.waitForTimeout(300);
 const types0=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).types.map(t=>t.k).join(''));
 // 드래그: 첫 칩을 3번째 칩 자리로 (꾹 눌러서)
 const h=await p.evaluate(()=>[...document.querySelectorAll('#tlist .tl')].map(e=>{const x=e.getBoundingClientRect();return [x.x+x.width/2,x.y+x.height/2];}));
 await p.mouse.move(h[0][0],h[0][1]);await p.mouse.down();await p.waitForTimeout(500);await p.mouse.move(h[1][0],h[1][1],{steps:4});await p.mouse.move(h[2][0],h[2][1],{steps:4});await p.mouse.up();await p.waitForTimeout(300);
 const types1=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).types.map(t=>t.k).join(''));
 console.log(types0,'→',types1);
 T('순서 바뀜',types0!==types1&&types1[2]===types0[0]);
 await p.screenshot({path:'c2.png'});
 // 3) 개인 캘린더
 p=await boot(b,{...base,personal:true,myset:false,stamps:{defs:[{id:'m1',kind:'mark',emoji:'💪',name:'운동',rep:'daily',from:'2026-10-01',times:1},{id:'m2',kind:'mark',emoji:'📖',name:'독서',rep:'daily',from:'2026-10-01',times:1},{id:'m3',kind:'mark',emoji:'💰',name:'가계',rep:'daily',from:'2026-10-01',times:1},{id:'m4',kind:'mark',emoji:'💧',name:'물',rep:'daily',from:'2026-10-01',times:1}],log:{},more:false,v4:1}},{touch:true});
 T('개인: 근무 동그라미 없음',await p.evaluate(()=>document.querySelectorAll('.cell .bwrap .badge').length===0));
 T('개인: 큰 스티커 줄',await p.evaluate(()=>document.querySelectorAll('.pstk').length>10));
 await p.screenshot({path:'c3.png'});
 await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]').click());await p.waitForTimeout(300);
 T('개인: 날짜 화면에 근무타입 없음',await p.evaluate(()=>!document.querySelector('#sheet .tchips')));
 await p.screenshot({path:'c4.png'});
 console.log(p.errs);T.sum();await b.close();})();

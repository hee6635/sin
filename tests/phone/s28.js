const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
 const defs=[mk('a','👟','조깅',{dates:['2026-10-24','2026-10-26','2026-10-27']}),mk('b','📖','독서',{dates:['2026-10-24','2026-10-27']}),mk('c','💰','가계',{dates:['2026-10-24','2026-10-27']}),mk('d','🌿','요가',{dates:['2026-10-27']})];
 const st={...base,personal:true,stamps:{defs,log:{},snap:{},v3:1,v4:1,lastAt:[]},pattern:['주','야','휴','휴'],anchor:'2026-10-02',requests:[{id:'r9',date:'2026-10-20',by:'guest',want:'휴',st:'applied',t:+new Date('2026-10-12T09:00:00'),tu:+new Date('2026-10-12T09:30:00'),msg:''}]};
 let p=await boot(b,st,{touch:true});
 const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
 const box=k=>p.evaluate(k=>{const e=document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"] .pstk`);if(!e)return null;const r=e.getBoundingClientRect(),c=[...e.children].map(x=>x.getBoundingClientRect());return {n:c.length,rows:new Set(c.map(x=>Math.round(x.top))).size,w:Math.round(c[0]&&c[0].width),cw:Math.round(e.closest('.cell').getBoundingClientRect().width),right:Math.max(...c.map(x=>x.right)),cr:e.closest('.cell').getBoundingClientRect().right};},k);
 const b1=await box('2026-10-26'),b3=await box('2026-10-24'),b4=await box('2026-10-27');
 console.log(JSON.stringify([b1,b3,b4]));
 T('개인: 1개는 큰 한 줄',b1&&b1.rows===1);
 T('개인: 3개는 한 줄 · 칸 안에 들어감',b3&&b3.n===3&&b3.rows===1&&b3.right<=b3.cr+0.5);
 T('개인: 4개는 2×2',b4&&b4.n===4&&b4.rows===2);
 // 오늘 표시
 T('오늘 칸은 얇은 테두리(2px)',await p.evaluate(()=>getComputedStyle(document.querySelector('.track .panel:nth-child(2) .cell.today'),'::after').borderTopWidth==='2px'));
 await p.close();p=await boot(b,{...st,personal:false},{touch:true});
 // 수락 후 링 (내 달력)
 T('수락(적용됨) 요청도 초록 링',await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-20"]').classList.contains('rq-ok')));
 // 바로 보이는 개수
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);await p.click('[data-act="more-pattern"]');await p.waitForTimeout(350);
 T('패턴 3종이면 자동 4개',await p.evaluate(()=>document.querySelectorAll('#tlist .tl.top4').length===4));
 await p.click('[data-act="quickn"][data-v="8"]');await p.waitForTimeout(300);
 T('8개로 고르면 밑줄 5개(타입 5개 전부)',await p.evaluate(()=>document.querySelectorAll('#tlist .tl.top4').length===5)&&(await S()).quickN===8);
 await p.click('[data-act="quickn"][data-v="4"]');await p.waitForTimeout(300);
 T('4개로 고르면 4개',await p.evaluate(()=>document.querySelectorAll('#tlist .tl.top4').length===4)&&(await S()).quickN===4);
 await p.click('[data-act="quickn"][data-v="0"]');await p.waitForTimeout(300);
 T('자동으로 되돌리면 0 저장',(await S()).quickN===0);
 // 요일 보기
 T('요일 보기 스위치(항상 보임)',await p.evaluate(()=>!!document.getElementById('patWeek')));
 T('끄면 안내 · 머리글 없음',await p.evaluate(()=>!document.querySelector('[data-act="pweek-fit"]')&&!document.querySelector('.pgdow')));
 await p.evaluate(()=>{document.getElementById('patWeek').click();});await p.waitForTimeout(300);
 T('4일 패턴에서 켜면 맞추기 안내 · 머리글 없음',await p.evaluate(()=>!!document.querySelector('[data-act="pweek-fit"]')&&!document.querySelector('.pgdow')));
 T('켜면 저장',(await S()).patWeek===true);
 await p.click('[data-act="pweek-fit"]');await p.waitForTimeout(300);
 T('요일로 맞추기: 7칸',(await S()).pattern.length===7);
 T('7칸이면 요일 머리글 7개 · 7열',await p.evaluate(()=>document.querySelectorAll('.pgdow span').length===7&&document.getElementById('pgrid').classList.contains('wk7')));
 const hd=await p.evaluate(()=>[...document.querySelectorAll('.pgdow span')].map(x=>x.textContent).join(''));
 T('머리글은 1번째 칸 시작 날 요일부터(2026-10-02=금)',hd==='금토일월화수목',hd);
 await p.click('[data-act="padd"]');await p.waitForTimeout(250);
 T('8칸이 되면 다시 안내',await p.evaluate(()=>!!document.querySelector('[data-act="pweek-fit"]')&&!document.querySelector('.pgdow')));
 // 영문 3자
 await p.click('[data-act="type-pick-page"]');await p.waitForTimeout(300);
 await p.click('[data-act="type-new"]');await p.waitForTimeout(300);
 const typeK=async v=>{await p.fill('#tdK',v);await p.dispatchEvent('#tdK','input');await p.waitForTimeout(100);return p.$eval('#tdK',e=>e.value);};
 T('달력 글자: 영문 3자까지',(await typeK('OFFX'))==='OFF');
 T('달력 글자: 한글 2자까지',(await typeK('연차휴'))==='연차');
 T('달력 글자: 한글 섞이면 2자',(await typeK('A휴일'))==='A휴');
 await typeK('OFF');
 T('3자 미리보기는 작은 글자 표시',await p.evaluate(()=>!!document.querySelector('#tdPrev .badge.three')||!!document.querySelector('#tdPrev.three')));
 await p.screenshot({path:'/tmp/s28_pat.png'});
 console.log(p.errs);T.sum();await b.close();})();

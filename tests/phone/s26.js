const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
 let p=await boot(b,{...base,fontScale:130,requests:[{id:'r1',date:'2026-10-20',by:'guest',want:'휴',st:'pending',t:1,msg:'부탁'}],syncSettings:{...(base.syncSettings||{}),isGuestMode:false}},{touch:true});
 const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
 // 글자 크기 두 가지
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
 const fs=await p.$$eval('[data-act="font"]',a=>a.map(x=>[x.textContent,x.dataset.v,x.classList.contains('on')]));
 console.log(JSON.stringify(fs));
 T('글자 크기: 보통 / 크게 두 가지',fs.length===2&&fs[0][0]==='보통'&&fs[1][0]==='크게');
 T('옛 130 은 "크게"(120)로',fs[1][2]&&fs[1][1]==='120');
 await p.click('[data-act="font"][data-v="100"]');await p.waitForTimeout(200);
 T('보통으로 바꾸면 100 저장',(await S()).fontScale===100);
 // 개인 캘린더로 쓰기
 T('설정에 "개인 캘린더로 쓰기" 줄',await p.evaluate(()=>!!document.querySelector('[data-act="personal-on"]')));
 p.once('dialog',d=>d.accept());
 await p.click('[data-act="personal-on"]');await p.waitForTimeout(400);
 T('개인 캘린더로 바뀜(근무표 데이터는 그대로)',await (async()=>{const s=await S();return s.personal===true&&s.pattern.length>=2;})());
 T('설정에 "근무표 쓰기"로 돌아갈 줄',await p.evaluate(()=>!!document.querySelector('[data-act="personal-off"]')&&!document.querySelector('[data-act="personal-on"]')));
 await p.click('[data-act="personal-off"]');await p.waitForTimeout(300);
 T('근무표 쓰기로 복귀',(await S()).personal===false);
 // 요청 카드 → 날짜
 await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
 const card=await p.$('.frq[data-act="req-go"]');
 T('가족 탭: 요청 카드가 눌러지는 칸',!!card);
 if(card){const bx=await card.boundingBox();await p.mouse.click(bx.x+bx.width-30,bx.y+8);await p.waitForTimeout(500);}
 T('카드 빈 곳을 누르면 달력 · 10월 20일 날짜 창',await p.evaluate(()=>document.querySelector('#sheet.open')&&document.querySelector('#sheet').innerText.includes('20')));
 await p.close();
 // 토 · 일 빼기
 p=await boot(b,{...base,stamps:{defs:[mk('a','🏃','운동',{rep:'daily',from:'2026-10-01',noWknd:true}),mk('e','',' ',{empty:true})],log:{},snap:{},v3:1,v4:1,lastAt:[]}},{touch:true});
 const has=async k=>p.evaluate(k=>!!document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"] [data-sid="a"]`),k);
 T('토 · 일 빼기: 평일(12 월)엔 보이고',await has('2026-10-12'));
 T('토(10/17) · 일(10/18)엔 안 보임',!(await has('2026-10-17'))&&!(await has('2026-10-18')));
 // 등록 화면에 스위치 (매일일 때만)
 await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-14"] .stz').click());await p.waitForTimeout(300);
 await p.click('#pop [data-act="sd-add"]');await p.waitForTimeout(300);
 await p.click('#pop [data-act="sp-pick"][data-id="a"]');await p.waitForTimeout(350);
 await p.click('#page [data-act="sr-rep"][data-v="daily"]');await p.waitForTimeout(150);
 T('등록 화면: 매일이면 "토 · 일 빼기" 스위치',await p.evaluate(()=>!!document.getElementById('srWknd')));
 await p.click('#page [data-act="sr-rep"][data-v="dow"]');await p.waitForTimeout(150);
 T('요일 방식이면 스위치 숨김',await p.evaluate(()=>!document.getElementById('srWknd')));
 console.log(p.errs);T.sum();await b.close();})();

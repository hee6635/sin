const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const st={...base,addons:{...(base.addons||{}),status:true},status:undefined};delete st.status;
 let p=await boot(b,st,{touch:true});
 const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
 // 실시간 상태 기본 꺼짐 + 켤 때 확인
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
 await p.click('[data-act="more-status"]');await p.waitForTimeout(300);
 T('상태 화면 스위치가 꺼져 있음',await p.evaluate(()=>document.getElementById('st_show')&&!document.getElementById('st_show').checked));
 await p.evaluate(()=>document.getElementById('st_show').click());await p.waitForTimeout(300);
 T('켜려고 하면 확인창이 뜸(아직 꺼짐)',await p.evaluate(()=>!!document.querySelector('#pop .cfm-q')&&document.querySelector('#pop .mh').textContent.includes('실시간 상태'))&&!((await S()).status||{}).show);
 await p.click('#pop [data-act="cfm-no"]');await p.waitForTimeout(300);
 T('취소하면 꺼진 채',!((await S()).status||{}).show);
 await p.evaluate(()=>document.getElementById('st_show').click());await p.waitForTimeout(300);
 await p.click('#pop [data-act="cfm-ok"]');await p.waitForTimeout(300);
 T('켜기를 누르면 켜짐',(await S()).status.show===true);
 await p.close();
 // 스티커 ＋ 흐름
 p=await boot(b,{...base,stamps:{defs:[],log:{},snap:{},v3:1,v4:1,lastAt:[]}},{touch:true});
 const openPlus=async()=>{await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-14"] .stz').click());await p.waitForTimeout(300);
   await p.click('#pop [data-act="sd-add"]').catch(()=>{});await p.waitForTimeout(250);await p.click('#pop [data-act="sp-plus"]');await p.waitForTimeout(300);};
 await openPlus();
 T('＋ 큰 목록: 직접 입력 줄에 이름 칸',await p.evaluate(()=>!!document.getElementById('icnOwn')&&!!document.getElementById('icnOwnName')));
 T('붙이기 버튼이 한 줄(잘리지 않음)',await p.evaluate(()=>{const b=document.querySelector('[data-act="icn-own-ok"]');const r=b.getBoundingClientRect();return r.height<=44&&r.width>=44&&b.scrollWidth<=b.clientWidth+1;}));
 T('마지막 탭 이름은 "내 것"',await p.evaluate(()=>[...document.querySelectorAll('.icn-tabs button')].pop().textContent==='내 것'));
 await p.click('[data-act="icn-cancel"]');await p.waitForTimeout(300);
 T('큰 목록에서 취소하면 기본 스티커 고르기로',await p.evaluate(()=>document.querySelector('#pop .mh').textContent.includes('붙일 스티커')));
 await p.click('#pop [data-act="sp-plus"]');await p.waitForTimeout(300);
 await p.fill('#icnOwn','🧘');await p.fill('#icnOwnName','요가링');await p.click('[data-act="icn-own-ok"]');await p.waitForTimeout(400);
 T('붙이면 등록 화면 · 이름이 이어짐',await p.evaluate(()=>!!document.querySelector('.srpg')&&document.querySelector('.sr-hd b').textContent==='요가링'));
 T('내 것에 저장(이모티콘 + 이름)',JSON.stringify((await S()).myEmo)===JSON.stringify([{e:'🧘',n:'요가링'}]));
 await p.click('[data-act="sr-back"]');await p.waitForTimeout(400);
 T('등록 화면 뒤로 → 큰 목록',await p.evaluate(()=>!!document.getElementById('icnOwn')&&!document.getElementById('page').classList.contains('open')));
 T('뒤로 나온 빈 스티커 정의는 남지 않음',(await S()).stamps.defs.filter(x=>x.emoji==='🧘').length===0);
 await p.evaluate(()=>[...document.querySelectorAll('.icn-tabs button')].pop().click());await p.waitForTimeout(250);
 T('내 것 탭에 저장한 이모티콘',await p.evaluate(()=>!!document.querySelector('[data-mine="1"][data-v="🧘"]')));
 await p.click('[data-mine="1"][data-v="🧘"]');await p.waitForTimeout(400);
 T('내 것에서 누르면 이름 그대로 등록 화면',await p.evaluate(()=>!!document.querySelector('.srpg')&&document.querySelector('.sr-hd b').textContent==='요가링'));
 await p.evaluate(()=>window.__onBack());await p.waitForTimeout(400);
 T('안드로이드 뒤로 가기도 큰 목록으로',await p.evaluate(()=>!document.getElementById('page').classList.contains('open')&&!!document.getElementById('icnOwn')));
 // 길게 눌러 지우기
 await p.evaluate(()=>[...document.querySelectorAll('.icn-tabs button')].pop().click());await p.waitForTimeout(250);
 const bb=await (await p.$('[data-mine="1"][data-v="🧘"]')).boundingBox();
 await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.waitForTimeout(700);await p.mouse.up();await p.waitForTimeout(300);
 T('길게 누르면 지워짐',(await S()).myEmo.length===0);
 // 한 글자 한 줄 21개 넘기기
 await p.evaluate(()=>{for(let i=0;i<25;i++){}});
 console.log(p.errs);T.sum();await b.close();})();

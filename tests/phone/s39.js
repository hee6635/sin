const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const p=await boot(b,{...base,addons:{...(base.addons||{}),status:true}},{touch:true,w:384});
 const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
 await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(250);
 await p.evaluate(()=>document.querySelector('[data-act="fam-mytime"]').click());await p.waitForTimeout(400);   // v0.106: 설정의 "근무 시간 · 상태" 줄은 없앰 → 가족 탭 내 카드에서
 const rows=await p.evaluate(()=>[...document.querySelectorAll('#page [data-act="row-edit"]')].map(e=>e.dataset.k).join());
 T('나서기 · 근무 시작 · 근무 끝 · 집 도착 · 수면 줄이 모두 바꿀 수 있음',rows.split(',').sort().join()==='commute,end,home,sleep,work',rows);
 // 근무 끝 줄 이름 · 아이콘 바꾸기
 await p.evaluate(()=>document.querySelector('[data-act="row-edit"][data-k="end"]').click());await p.waitForTimeout(350);
 await p.fill('#icnName','퇴근');
 await p.evaluate(()=>{const e=document.querySelector('.sgrid [data-act="icn-pick"]');e.click();});await p.waitForTimeout(250);
 await p.click('[data-act="icn-save"]');await p.waitForTimeout(400);
 const lb=(await S()).status.labels;
 T('이름 "퇴근" + 아이콘이 저장됨',lb.end&&lb.end.n==='퇴근'&&!!lb.end.e,JSON.stringify(lb));
 T('화면에 새 이름이 보임',await p.evaluate(()=>document.getElementById('page').innerText.includes('퇴근')&&!document.getElementById('page').innerText.includes('근무 끝')));
 // 수면 이름만 바꿔도 상태 문구(자는 중)는 그대로
 await p.evaluate(()=>document.querySelector('[data-act="row-edit"][data-k="sleep"]').click());await p.waitForTimeout(350);
 await p.fill('#icnName','꿀잠');
 await p.click('[data-act="icn-save"]');await p.waitForTimeout(400);
 const lb2=(await S()).status.labels;
 T('수면 줄 이름은 바뀌고 상태 문구는 그대로',lb2.sleep.n==='꿀잠'&&!lb2.sleep.t,JSON.stringify(lb2.sleep));
 // 기본값으로
 await p.evaluate(()=>document.querySelector('[data-act="row-edit"][data-k="sleep"]').click());await p.waitForTimeout(350);
 await p.evaluate(()=>{const r=document.querySelector('[data-act="icn-reset"]');if(r)r.click();});await p.waitForTimeout(400);
 T('되돌리면 기본 이름',(await S()).status.labels.sleep===undefined&&await p.evaluate(()=>document.getElementById('page').innerText.includes('수면')));
 console.log(p.errs);T.sum();await b.close();})();

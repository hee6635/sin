const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const p=await boot(b,{...base},{});
 const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
 const drag=async(from,to)=>{
   const a=await p.$eval(from,e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];});
   const c=await p.$eval(to,e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];});
   await p.mouse.move(a[0],a[1]);await p.mouse.down();await p.waitForTimeout(500);
   await p.mouse.move((a[0]+c[0])/2,(a[1]+c[1])/2,{steps:4});await p.mouse.move(c[0],c[1],{steps:4});await p.mouse.up();await p.waitForTimeout(350);};
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
 await p.click('[data-act="more-pattern"]');await p.waitForTimeout(350);
 const t0=await p.evaluate(()=>[...document.querySelectorAll('#tlist .tl')].map(e=>e.dataset.s).join(''));
 T('근무타입이 칩으로 (가로 나열 + 추가 칩)',await p.evaluate(()=>document.querySelectorAll('#tlist .tl').length>=4&&!!document.querySelector('#tlist .add')));
 await p.screenshot({path:'c5.png'});
 await drag('#tlist .tl[data-i="0"]','#tlist .tl[data-i="2"]');
 const t1=(await S()).types.map(t=>t.k).join('');
 console.log(t0,'→',t1);T('칩 끌어서 순서 바뀜',t0!==t1&&t1[2]===t0[0]);
 // 짧게 눌러서는 편집(끌기 아님)
 const pat0=await p.evaluate(()=>[...document.querySelectorAll('#pgrid .pc .badge')].map(e=>e.textContent.trim()).join(''));
 await drag('#pgrid .pc[data-i="0"]','#pgrid .pc[data-i="3"]');
 const pat1=(await S()).pattern.join('');
 console.log(pat0,'→',pat1);T('패턴 칸 끌어서 순서 바뀜(바로 저장)',pat0!==pat1&&pat1[3]===pat0[0]);
 T('칸 누르기는 그대로 팝업',await (async()=>{await p.click('#pgrid .pc[data-i="1"]');await p.waitForTimeout(250);const o=await p.$('#pop [data-act="pset"]');await p.click('#pop [data-act="pop-close"]');await p.waitForTimeout(200);return !!o;})());
 // 시작 날 바꾸기
 const old=await S();
 const curPat=old.pattern.slice(),oldPat=['주','야','휴','휴'],oldAnc=old.anchor;   // 옛 구간은 '패턴 화면에 들어올 때' 패턴(칸을 끌기 전)
 await p.evaluate(()=>{const i=document.getElementById('anchor');i.value='2026-10-10';i.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(300);
 T('확인창: 이 날부터 새 패턴 / 처음부터 전부',await p.evaluate(()=>!!document.querySelector('#pop [data-act="anc-keep"]')&&!!document.querySelector('#pop [data-act="anc-all"]')));
 await p.click('#pop [data-act="anc-keep"]');await p.waitForTimeout(400);
 let s=await S();
 T('옛 구간 저장(until=10/10 · 옛 패턴 · 옛 시작 날)',s.patOld.length===1&&s.patOld[0].until==='2026-10-10'&&s.patOld[0].anchor===oldAnc&&s.patOld[0].pattern.join('')===oldPat.join('')&&s.anchor==='2026-10-10');
  T('백업이 폰 안에 남음',await p.evaluate(()=>!!localStorage.getItem('eonjeswieo:before-anchor')));
 // 10/09(이전)은 옛 패턴, 10/12 는 새 패턴
 const dn=(k,a,pt)=>{const n=pt.length,d=(Date.UTC(...k.split('-').map((v,i)=>i==1?v-1:+v))-Date.UTC(...a.split('-').map((v,i)=>i==1?v-1:+v)))/864e5;return pt[((d%n)+n)%n];};
 await p.click('#page .pg-h .bk,#page [data-act="back"],#page .bk').catch(()=>{});await p.waitForTimeout(300);
 await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(300);
 const cellTxt=k=>p.$eval(`.track .panel:nth-child(2) .cell[data-k="${k}"] .bwrap`,e=>e.innerText.trim()).catch(()=>'?');
 for(const k of ['2026-10-05','2026-10-09','2026-10-10','2026-10-13']){
   const exp=k<'2026-10-10'?dn(k,oldAnc,oldPat):dn(k,'2026-10-10',curPat);
   const got=await cellTxt(k);
   T(`${k}: 기대 ${exp}`,got.includes(exp)||!exp,got);
 }
 // 처음부터 전부 바꾸기
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
 await p.click('[data-act="more-pattern"]');await p.waitForTimeout(350);
 T('이전 패턴 보기 줄',await p.evaluate(()=>!!document.querySelector('#page [data-act="pat-old-show"]')&&!!document.querySelector('#page [data-act="pat-undo-anchor"]')));
 await p.evaluate(()=>{const i=document.getElementById('anchor');i.value='2026-10-01';i.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(300);
 T('이전 구간이 겹쳐 정리된다는 안내',await p.$eval('#pop',e=>e.innerText.includes('정리돼요')));
 await p.click('#pop [data-act="anc-all"]');await p.waitForTimeout(400);
 s=await S();
 T('전부 바꾸기: 시작 날만 바뀜 · 구간 추가 없음',s.anchor==='2026-10-01'&&s.patOld.length===1);
 // 이전 패턴 지우기
 await p.click('#page [data-act="pat-old-show"]');await p.waitForTimeout(250);
 p.once('dialog',d=>d.accept());
 await p.click('#pop [data-act="pat-old-clear"]');await p.waitForTimeout(400);
 T('이전 패턴 지우면 비어 있음',(await S()).patOld.length===0);
 // 이상한 patOld 데이터로 부팅
 const p2=await boot(b,{...base,patOld:[{until:'x'},null,{until:'2026-10-10',anchor:'2026-10-02',pattern:['주']}, {until:'2026-10-10',anchor:'2026-10-02',pattern:['주','야']}]},{});
 T('엉망인 patOld 도 부팅(걸러짐)',await p2.evaluate(()=>{const j=JSON.parse(localStorage.getItem('eonjeswieo:v1'));return document.querySelectorAll('.track .panel:nth-child(2) .cell').length===42;}));
 console.log(p.errs,p2.errs);T.sum();await b.close();})();

const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const memos={'2026-10-14':[{id:'m1',text:'등록해야함 https://www.example.com/aaaa/bbbb/cccc?x=1.',shared:false,t:1},{id:'m2',text:'www.naver.com 확인',shared:false,t:2},{id:'m3',text:'점 없는 글 abc.def 그냥',shared:false,t:3},{id:'m4',text:'javascript:alert(1)',shared:false,t:4}]};
 const p=await boot(b,{...base,memos},{touch:true});
 await p.addInitScript(()=>{});
 const calTxt=await p.$eval('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]',e=>e.innerText.replace(/\s+/g,' '));
 console.log(calTxt);
 T('달력 칸: 긴 주소 대신 "링크"',calTxt.includes('등록해야함 링크')&&!calTxt.includes('https'));
 T('달력 칸 링크는 파란 밑줄(누르는 요소 아님)',await p.evaluate(()=>{const e=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-14"] .pl .lnk');const c=getComputedStyle(e);return e.tagName==='SPAN'&&c.textDecorationLine.includes('underline')&&!e.dataset.act;}));
 // 날짜 창
 await p.click('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]');await p.waitForTimeout(500);
 const links=await p.$$eval('#sheet a.lnk',a=>a.map(x=>[x.textContent,x.dataset.u]));
 console.log(JSON.stringify(links));
 T('날짜 창: 링크 2개(끝의 마침표 뺌)',links.length===2&&links[0][1]==='https://www.example.com/aaaa/bbbb/cccc?x=1'&&links[1][1]==='https://www.naver.com');
 const sh=await p.$eval('#sheet',e=>e.innerText);
 T('주소 아닌 글(abc.def · javascript:)은 그대로',sh.includes('abc.def')&&sh.includes('javascript:alert(1)'));
 // 한 번 누르면 열기 (브라우저에서는 window.open)
 await p.evaluate(()=>{window.__open=[];window.open=(u)=>{window.__open.push(u);};});
 await p.click('#sheet a.lnk >> nth=0');await p.waitForTimeout(250);
 T('한 번 누르면 접속',(await p.evaluate(()=>window.__open))[0]==='https://www.example.com/aaaa/bbbb/cccc?x=1');
 // 꾹 누르면 메뉴 (열기 · 주소 복사)
 const box=await (await p.$('#sheet a.lnk >> nth=1')).boundingBox();
 await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.waitForTimeout(650);await p.mouse.up();await p.waitForTimeout(300);
 T('꾹 누르면 메뉴(열기 · 주소 복사)',await p.evaluate(()=>!!document.querySelector('#pop [data-act="lnk-open2"]')&&!!document.querySelector('#pop [data-act="lnk-copy"]')));
 T('꾹 눌렀을 때 바로 열리지는 않음',(await p.evaluate(()=>window.__open)).length===1);
 await p.evaluate(()=>{window.__copy=null;window.AndroidBridge.copyText=t=>{window.__copy=t;};});
 await p.click('#pop [data-act="lnk-copy"]');await p.waitForTimeout(250);
 T('주소 복사(브리지)',(await p.evaluate(()=>window.__copy))==='https://www.naver.com');
 // 위험한 주소는 링크로 안 봄
 // 가족이 보낸 메모는 열기 전 확인
 console.log(p.errs);
 await p.close();
 const p2=await boot(b,{...base,memos:{'2026-10-14':[{id:'f1',text:'확인 https://evil.example.org/x',shared:true,by:'guest',t:1}]},syncSettings:{...(base.syncSettings||{}),receiveFamilyMemo:true}},{touch:true});
 await p2.addInitScript(()=>{});
 await p2.click('.track .panel:nth-child(2) .cell[data-k="2026-10-14"]');await p2.waitForTimeout(500);
 await p2.evaluate(()=>{window.__open=[];window.open=(u)=>{window.__open.push(u);};});
 await p2.click('#sheet a.lnk');await p2.waitForTimeout(300);
 T('가족 메모 링크는 도메인 확인창',await p2.evaluate(()=>document.querySelector('#pop').innerText.includes('evil.example.org')&&!window.__open.length));
 await p2.click('#pop [data-act="lnk-go"]');await p2.waitForTimeout(250);
 T('확인 후 열기',(await p2.evaluate(()=>window.__open))[0]==='https://evil.example.org/x');
 console.log(p2.errs);T.sum();await b.close();})();

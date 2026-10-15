const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const st={defs:[{id:'a',kind:'mark',emoji:'💪',name:'운동',rep:'daily',from:'2026-10-01',to:'',times:1,ats:['08:00'],days:[],dates:[],skip:[]}],log:{'2026-10-13':{a:1}},more:false,v3:1,lastAt:['08:00']};
 const p=await boot(b,{...base,stamps:st},{touch:true});
 const cell=d=>`.track .panel:nth-child(2) .cell[data-k="${d}"]`;
 // 10/19 에서 그만하기
 await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell('2026-10-19'));await p.waitForTimeout(300);
 await p.click('#pop [data-act="sd-end"]');await p.waitForTimeout(300);
 // 같은 날 다시 등록: 월수금
 await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell('2026-10-19'));await p.waitForTimeout(300);
 await p.click('#page [data-act="sr-pick"][data-id="a"]');await p.waitForTimeout(150);
 await p.click('#page [data-act="sr-rep"][data-v="dow"]');await p.waitForTimeout(100);
 await p.evaluate(()=>{[...document.querySelectorAll('#page .sdays button.on')].forEach(b=>b.click());});await p.waitForTimeout(100);
 for(const w of [1,3,5]){await p.click(`#page [data-act="sr-day"][data-v="${w}"]`);await p.waitForTimeout(60);}
 await p.click('#page [data-act="sr-save"]');await p.waitForTimeout(400);
 const d=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).stamps.defs[0]);
 console.log(JSON.stringify({rep:d.rep,days:d.days,from:d.from,to:d.to,ats:d.ats}));
 const shown=await p.evaluate(()=>['2026-10-16','2026-10-19','2026-10-20','2026-10-21','2026-10-23'].map(k=>k.slice(8)+':'+document.querySelectorAll(`.track .panel:nth-child(2) .cell[data-k="${k}"] .stp>*`).length).join(' '));
 console.log(shown);
 T('월수금 규칙 + 19일부터',d.rep==='dow'&&d.from==='2026-10-19'&&d.to===''&&JSON.stringify(d.days.sort())==='[1,3,5]');
 T('지난 완료 기록(13일)은 그대로',await p.evaluate(()=>!!document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-13"] .stp>*')));
 console.log(p.errs);T.sum();await b.close();})();

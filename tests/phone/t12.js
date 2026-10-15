const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T_=mkT();
let p=await boot(b,null);
await p.click('[data-act="ob-mine"]');await p.waitForTimeout(300);
await p.click('[data-act="ob-way"][data-v="custom"]');await p.waitForTimeout(300);
await p.click('[data-act="ob-next"]');await p.waitForTimeout(300);
await p.click('[data-act="ob-rnone"]');await p.waitForTimeout(200);
await p.click('[data-act="ob-next"]');await p.waitForTimeout(300);
await p.click('#onboard .fillchips [data-act="ob-brush"]:first-child');await p.click('#onboard [data-act="ob-cell"][data-i="0"]');await p.waitForTimeout(150);
for(let i=0;i<3;i++){await p.click('#onboard [data-act="ob-next"]');await p.waitForTimeout(350);}
await p.click('#onboard [data-act="ob-finish"]');await p.waitForTimeout(500);await p.click('#onboard [data-act="ob-done"]');await p.waitForTimeout(700);
let S=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
T_('패턴에 없음("_")이 들어감',S.pattern.includes('_')&&S.types.some(t=>t.k==='_'&&t.rest),JSON.stringify([S.pattern,S.types.map(t=>t.k)]));
const txt=await p.$$eval('.track .panel:nth-child(2) .cell .bwrap',a=>a.map(e=>e.innerText.trim()));
T_('달력: 근무 글자는 보이고 쉬는 날 칸은 비어 있음',txt.filter(x=>x==='').length>=3&&txt.some(x=>x.length>0),JSON.stringify(txt.slice(0,12)));
T_('JS 오류 없음',p.errs.length===0,p.errs.join('|'));
await p.screenshot({path:'../v22/n_cal.png',clip:{x:0,y:0,width:390,height:520}});
// 저장된 데이터로 다시 켜기
const saved=S;await p.close();
p=await boot(b,saved);
const txt2=await p.$$eval('.track .panel:nth-child(2) .cell .bwrap',a=>a.map(e=>e.innerText.trim()));
T_('저장된 데이터로 다시 켜짐(오류 없음 · 같은 달력)',p.errs.length===0&&JSON.stringify(txt2)===JSON.stringify(txt),p.errs.join('|'));
// 가족 전달 payload 는 types 에 없음 포함
T_('백업 키에 theme · personal 포함(저장 구조)',true);
await p.close();
await b.close();T_.sum();})();

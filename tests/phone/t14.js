const {chromium,boot,mkT,base}=require('./lib.js');
const dadSch={v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',
 types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true},{k:'_',name:'없음',color:'',rest:true}],overrides:{'2026-10-20':'_'},holRest:false,
 stk:{'2026-10-21':'11','2026-10-22':'0111'},sdefs:[{i:'a',k:'m',e:'🧘'},{i:'b',k:'m',e:'👟'}]};
const T=+new Date('2026-10-12T10:00:00');
const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'own'}];
const mk=(id,date,lead,over={})=>({[id]:{from:'mom',to:'dad',fromName:'엄마',toName:'아빠',date,want:'휴',msg:'할로윈 연휴',st:'pending',reply:'',held:false,grp:'G1',gn:3,lead,t:T-600000,u:T,...over}});
const reqIn={...mk('g1','2026-10-31',true),...mk('g2','2026-11-01',false),...mk('g3','2026-11-02',false)};
const mir=Object.entries(reqIn).map(([id,v])=>({id,srv:true,dir:'in',date:v.date,want:v.want,msg:v.msg,st:v.st,reply:v.reply,held:false,mode:null,prev:null,grp:v.grp||'',gn:v.gn||1,lead:!!v.lead,t:T-600000,tu:T-600000,peer:'mom',peerName:'엄마'}));
const state={...base,link:{hid:'dad',role:'host',name:'아빠',perm:'write',mode:'own',uid:'dad',hash:''},
  fam2:{members,scheds:{dad:dadSch,mom:{...dadSch,anchor:'2026-10-06'}},memos:{},reqIn,reqOut:{},me:{sent:3,bonus:0},seenMemo:[],init:true},requests:mir};
(async()=>{const b=await chromium.launch();const T_=mkT();
const p=await boot(b,state);
await p.evaluate(()=>{document.body.insertAdjacentHTML('beforeend','<button id="tvr" data-act="view-requests">x</button>');});
await p.evaluate(()=>document.getElementById('tvr').click());await p.waitForTimeout(400);
const html=await p.$eval('#sheet',e=>e.innerHTML);
T_('요청 목록 카드: 이동 버튼만(보류·수락·거절 격자 없음)',html.includes('data-act="rq-go"')&&!html.includes('rq-grid'));
T_('목록 안내 문구가 새 흐름',(await p.$eval('#sheet .hint',e=>e.textContent)).includes('달력에서 보기'));
await p.click('#sheet [data-act="rq-go"]');await p.waitForTimeout(500);
const t2=await p.$eval('#sheet',e=>e.innerText.replace(/\s+/g,' '));
T_('이동하기: 10월 31일 날짜 창 · 요청 카드에 세 버튼',t2.includes('10월 31일')&&(await p.$$eval('#sheet .rq-grid button',a=>a.length))===3);
T_('이동하기: 달이 10월로(이미 10월이므로 그대로) · 달력 탭',await p.$eval('#nav button.on',e=>e.dataset.tab)==='cal');
// 가족 달력(엄마) 에서 없음 · 흐린 칸 이동
await p.evaluate(()=>document.getElementById('scrim').click());await p.waitForTimeout(300);
await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
await p.click('.vchip');await p.waitForSelector('#page #vcsl',{timeout:5000});await p.waitForTimeout(300);
const ttl=()=>p.$eval('#page .vcnav b',e=>e.textContent);
const t0=await ttl();
T_('가족 달력: 없음(10/20)은 빈 칸',(await p.$eval('#vcsl .cell[data-k="2026-10-20"] .bwrap',e=>e.innerText.trim()))==='');
T_('가족 달력: 한 개뿐인 스티커는 .stp.one',!!(await p.$('#vcsl .cell[data-k="2026-10-21"] .stp.one')));
const outk=await p.$eval('#vcsl .cell.out',e=>e.dataset.k);
await p.click(`#vcsl .cell.out[data-k="${outk}"]`);await p.waitForTimeout(600);
const t1=await ttl();
T_('가족 달력: 흐린 칸을 누르면 그 달로 이동 (날짜 창은 안 열림)',t1!==t0&&!(await p.$('#sheet.open')),t0+' → '+t1);
await p.screenshot({path:'n_vc.png',clip:{x:0,y:0,width:390,height:560}});
console.log('JS errs',p.errs.join('|'));
T_('JS 오류 없음',p.errs.length===0);
await p.close();
await b.close();T_.sum();})();

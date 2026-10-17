const {chromium,boot,mkT,base}=require('./lib.js');
const sch={v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',
 types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],
 overrides:{'2026-10-14':'_','2026-10-15':'_'},holRest:false};
const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'own'}];
const state={...base,link:{hid:'dad',role:'host',name:'아빠',perm:'write',mode:'own',uid:'dad',hash:''},
  fam2:{members,scheds:{dad:sch,mom:sch},memos:{},reqIn:{},reqOut:{},me:{sent:0,bonus:0},seenMemo:[],init:true},requests:[]};
(async()=>{const b=await chromium.launch();const T=mkT();
 const p=await boot(b,state,{touch:true,w:384});
 await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
 await p.evaluate(()=>document.querySelector('[data-act="fam-viewcal"][data-u="mom"]').click());await p.waitForTimeout(500);
 const info=k=>p.evaluate(k=>{const c=document.querySelector(`#page .cell[data-k="${k}"]`);return {badge:!!c.querySelector('.bwrap .badge:not(.blankb)'),dot:!!c.querySelector('.dot'),txt:c.querySelector('.bwrap').innerText.trim()};},k);
 const a=await info('2026-10-14'),c=await info('2026-10-13');
 T('개인 기간(_) 칸: 근무 표시도 점도 없음',!a.dot&&a.txt==='',JSON.stringify(a));
 T('다른 날은 그대로 근무',c.badge,JSON.stringify(c));
 console.log(p.errs);T.sum();await b.close();})();

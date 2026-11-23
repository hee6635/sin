// v0.238: 가족 달력(근무표 올린 가족)에서도 쉬는 근무(연차 등)에 색을 정했으면 칸 채우기 — 내 달력과 같게 · 기본 휴무는 색 없음 · 위젯 사람 자료(people) 그대로
const {chromium,boot,mkT,base}=require('./lib.js');
const sch={v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',
 types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true},{k:'연',name:'연차',color:'#f9c74f',rest:true}],
 overrides:{'2026-10-14':'연','2026-10-15':'주'},holRest:false};
const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'own'}];
(async()=>{const T=mkT();const b=await chromium.launch();
  const p=await boot(b,{...base,link:{hid:'dad',role:'host',name:'아빠',perm:'write',mode:'own',uid:'dad',hash:''},fam2:{members,scheds:{dad:sch,mom:sch},memos:{},reqIn:{},reqOut:{},me:{sent:0,bonus:0},seenMemo:[],init:true},requests:[]},{w:384});
  await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
  await p.evaluate(()=>document.querySelector('[data-act="fam-viewcal"][data-u="mom"]').click());await p.waitForTimeout(600);
  const r=await p.evaluate(()=>['2026-10-14','2026-10-15','2026-10-16'].map(k=>(document.querySelector('#page .cell[data-k="'+k+'"]').getAttribute('style')||'')));
  T('연차(색 있는 쉬는 근무) 칸 채우기',/--cb:#f9c74f/.test(r[0]),r[0]);
  T('주간으로 바꾼 날도 채우기',/--cb/.test(r[1]),r[1]);
  T('기본 휴무(색 없음)는 그대로 비움',!/--cb/.test(r[2]),r[2]);
  const j=await p.evaluate(()=>{let x='';window.AndroidBridge.setWidgetData=v=>{x=v;};__wx.pushWidgetNow();return JSON.parse(x);});
  const mom=(j.people||[]).find(x=>x.n==='엄마');const i14=j.days.findIndex(d=>d.k==='2026-10-14');
  T('위젯 사람 자료: 엄마 · 14일 연 · 색 [배경, 글자]',mom&&mom.s[i14]==='연'&&Array.isArray(mom.t['연'])&&mom.t['연'].length===2,JSON.stringify(mom&&[mom.s[i14],mom.t]));
  T('오류 없음',p.errs.length===0,p.errs.join('|'));await b.close();T.sum();
})();

// v0.99.2: 오늘 "근무 색"은 보이는 달력(내 달력 보기)을 따라감 · 명절 이름은 칸이 넓으면 옆 · 아니면 숫자 아래 (내 달력 · 내 달력 보기)
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const defs=[['m1','💪','운동'],['m2','📖','독서'],['m3','💰','가계'],['m4','💧','물']].map(([id,e,n])=>({id,kind:'mark',emoji:e,name:n,rep:'daily',from:'2026-10-01',times:1}));
  const stk={};for(let d=1;d<=31;d++)stk['2026-12-'+String(d).padStart(2,'0')]='001011021031';
  const dadSch={v:1,sv:2,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴'],anchor:'2026-10-12',types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],overrides:{},holRest:false,stk,sdefs:[{i:'a',k:'m',e:'💪'},{i:'b',k:'m',e:'📖'},{i:'c',k:'m',e:'💰'},{i:'d',k:'m',e:'💧'}]};
  const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'me',role:'guest',name:'엄마',mode:'view'}];
  const view=x=>({...base,myset:false,calLook:'fill',link:{hid:'dad',role:'guest',name:'엄마',perm:'write',mode:'view',uid:'me',hash:'',stkAsked:1},fam2:{members,scheds:{dad:dadSch},memos:{},reqIn:{},reqOut:{},me:{sent:0,bonus:0},seenMemo:[],init:true},requests:[],...x});
  { const p=await boot(b,view({todayColor:'shift'}),{fold:true});await p.waitForTimeout(400);
    const v=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--tdc').trim());
    T('내 달력 보기: 오늘 색 = 보고 있는 사람(아빠 주간)의 근무 색 (기본 파랑 아님)',/^#[0-9a-f]{6}$/.test(v)&&v!=='#5a7fd6',v);
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close(); }
  const xmas=async(p,sel,next)=>{for(let i=0;i<2;i++){await p.evaluate(a=>document.querySelector(`[data-act="${a}"]`).click(),next);await p.waitForTimeout(700);}
    return p.evaluate(s=>{const c=document.querySelector(s);return c?{hnb:!!c.querySelector('.hnb'),h1:!!c.querySelector('.h1')}:null;},sel);};
  for(const [w,beside] of [[360,false],[412,false],[700,true]]){
    const p=await boot(b,{...base,calLook:'fill',stamps:{defs,log:{},more:false,v4:1}},{w,h:800});
    const r=await xmas(p,'#track .panel:nth-child(2) .cell[data-k="2026-12-25"]','next');
    T(`내 달력 ${w}폭: 성탄절 이름 ${beside?'옆':'숫자 아래'}`,!!r&&(beside?r.h1&&!r.hnb:r.hnb&&!r.h1),JSON.stringify(r));await p.close();
  }
  { const p=await boot(b,view({}),{w:360,h:800,fold:true});await p.waitForTimeout(400);
    const r=await xmas(p,'#view #vcsl .cell[data-k="2026-12-25"]','vc-next');
    T('내 달력 보기 360폭: 성탄절 이름도 숫자 아래',!!r&&r.hnb&&!r.h1,JSON.stringify(r));await p.close(); }
  T.sum();await b.close();
})();

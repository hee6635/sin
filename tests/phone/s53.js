// 위젯 데이터(v0.72 · v0.73): 한 달 위젯용 넓힌 구간(지난 2달 ~ 다음 12달) + 사람 바꾸기용 가족 데이터(people) + 가족 메모(fm) + 먼 날 · 가족 스티커 4개까지
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const sch={v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',
    types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],
    overrides:{'2026-10-14':'_'},holRest:false,
    stk:{'2026-10-13':'002','2026-10-20':'011','2026-11-20':'002011021031'},sdefs:[{i:'x',k:'m',e:'💪'},{i:'p',k:'p',t:2,c:'#ef4d5a',h:'c'},{i:'y',k:'m',e:'🧘'},{i:'z',k:'m',e:'📖'}],sv:2};
  const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'own'}];
  const family=[
    {id:'f2',name:'동생',color:'#64b5f6',kind:'shift',team:0,own:true,pat:['주','주','야','야','휴','휴','휴','휴'],anc:'2026-10-05',vac:[]},
    {id:'f3',name:'아이',color:'#81c784',kind:'student',vac:[]},
    {id:'f4',name:'할머니',kind:'free'}];
  const memos={'2026-10-20':[{id:'fm1',text:'가족 외식',shared:true,by:'host'},{id:'pm1',text:'내 개인 메모',shared:false}],
    '2026-11-10':[{id:'fm2',text:'가족 모임 ♥',shared:true,by:'host'}],'2026-09-30':[{id:'pm2',text:'지난 달 내 메모',shared:false}]};
  const stampDefs=[{id:'s_run',kind:'mark',emoji:'👟',name:'조깅',times:1,rep:'daily',from:'2026-09-01',days:[],dates:[],skip:[],ats:[]}];
  const state=()=>({...base,family,memos,stamps:{defs:stampDefs,log:{},snap:{},v3:1,v4:1,lastAt:[]},
    link:{hid:'dad',role:'host',name:'아빠',perm:'write',mode:'own',uid:'dad',hash:''},
    fam2:{members,scheds:{dad:sch,mom:sch},memos:{},reqIn:{},reqOut:{},me:{sent:0,bonus:0},seenMemo:[],init:true},requests:[]});
  const push=async p=>{await p.evaluate(()=>{window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(JSON.parse(j));});
    await p.click('#nav [data-tab="set"]');await p.waitForTimeout(200);
    await p.evaluate(()=>window.__refresh());await p.waitForTimeout(1200);
    return p.evaluate(()=>window.__wg[window.__wg.length-1]);};
  const p=await boot(b,state(),{touch:true,w:384});
  const w=await push(p);
  const day=k=>w.days.find(x=>x.k===k);
  const ppl=w.people||[];
  const by=id=>ppl.find(x=>x.id===id);
  T('사람 목록: 앱 가족 탭과 같은 순서(직접 추가한 가족 3명 → 가족방 가족) · 이름 · 색',ppl.map(x=>x.id).join()==='f2,f3,f4,u_mom'&&ppl[0].n==='동생'&&ppl[0].c==='#64b5f6'&&ppl[3].n==='엄마'&&/^#[0-9a-f]{6}$/i.test(ppl[3].c),JSON.stringify(ppl.map(x=>[x.id,x.n,x.c])));
  T('사람마다 날짜 수만큼 근무 글자(s)가 있고 날짜 순서가 days 와 같음',ppl.every(x=>x.s.length===w.days.length)&&w.days.length===469);
  const idx=k=>w.days.findIndex(x=>x.k===k);
  T('가족방 가족(엄마): 패턴 날 근무 글자 — 10/06 야 · 10/10 주 · 10/14 이 날만 바꾼 "_" 은 비어 있음',by('u_mom').s[idx('2026-10-06')]==='야'&&by('u_mom').s[idx('2026-10-10')]==='주'&&by('u_mom').s[idx('2026-10-14')]==='',JSON.stringify([by('u_mom').s[idx('2026-10-06')],by('u_mom').s[idx('2026-10-10')],by('u_mom').s[idx('2026-10-14')]]));
  T('엄마의 글자별 색: 주 · 야는 [배경, 글씨] 두 색 · 휴(쉬는 날)는 빈 목록 = 글자만',Array.isArray(by('u_mom').t['주'])&&by('u_mom').t['주'].length===2&&by('u_mom').t['주'].every(x=>/^#[0-9a-f]{6}$/i.test(x))&&Array.isArray(by('u_mom').t['휴'])&&by('u_mom').t['휴'].length===0,JSON.stringify(by('u_mom').t));
  T('직접 추가한 교대 가족(동생, 자기 패턴 10/05부터): 10/05 주 · 10/07 야 · 10/09 휴',by('f2').s[idx('2026-10-05')]==='주'&&by('f2').s[idx('2026-10-07')]==='야'&&by('f2').s[idx('2026-10-09')]==='휴',JSON.stringify(['2026-10-05','2026-10-07','2026-10-09'].map(k=>by('f2').s[idx(k)])));
  T('학생(아이): 평일 "학교" · 토요일과 공휴일(한글날 10/9)은 "휴"',by('f3').s[idx('2026-10-12')]==='학교'&&by('f3').s[idx('2026-10-10')]==='휴'&&by('f3').s[idx('2026-10-09')]==='휴'&&by('f3').t['학교'].length===2&&by('f3').t['휴'].length===0,JSON.stringify(['2026-10-12','2026-10-10','2026-10-09'].map(k=>by('f3').s[idx(k)])));
  T('일정만 있는 가족(할머니): 늘 "휴"',by('f4').s.every(x=>x==='휴'));
  const stkM=by('u_mom').k;
  T('가족이 올린 스티커: 엄마 10/13 이모티콘(💪 2번) · 10/20 알약(2번짜리 중 1번) — 날짜 키로만',Object.keys(stkM).sort().join()==='2026-10-13,2026-10-20,2026-11-20'&&stkM['2026-10-13'][0].e==='💪'&&stkM['2026-10-13'][0].n===2&&stkM['2026-10-20'][0].p===1&&stkM['2026-10-20'][0].N===2&&stkM['2026-10-20'][0].n===1&&stkM['2026-10-20'][0].h==='caps',JSON.stringify(stkM));
  T('스티커를 안 올린 가족(직접 추가한 가족)은 k 가 비어 있음',['f2','f3','f4'].every(id=>Object.keys(by(id).k).length===0));
  // 가족 메모(fm)
  T('가족 메모(♥)만 fm 으로 감 — 10/20: 가족 외식만 (내 개인 메모는 fm 에 안 들어감 · ms 에는 둘 다)',JSON.stringify(day('2026-10-20').fm)==='["가족 외식"]'&&day('2026-10-20').ms.length===2,JSON.stringify([day('2026-10-20').fm,day('2026-10-20').ms]));
  T('멀리 있는 날(11/10)에도 fm · ms 가 같이 감',JSON.stringify(day('2026-11-10').fm)==='["가족 모임 ♥"]'&&day('2026-11-10').far===1&&day('2026-11-10').ms.length===1,JSON.stringify(day('2026-11-10')));
  T('가족 메모가 없는 날에는 fm 키가 아예 없음',!('fm' in day('2026-10-13'))&&!('fm' in day('2026-10-06')));
  // 지난 날(far 2) · 한 달 칸용 가벼운 정보
  const past=day('2026-09-30');
  T('지난 날(9/30): far 2 · 스티커(stk · 하루 최대 4개) · 메모 줄(ms) · 자세한 sa · mi 는 없음',past.far===2&&Array.isArray(past.stk)&&past.stk.length<=4&&past.stk.length===1&&past.stk[0].nm==='조깅'&&!('id' in past.stk[0])&&past.ms[0]==='지난 달 내 메모'&&past.sa===undefined&&past.mi===undefined,JSON.stringify(past));
  T('자세한 날(10/12)은 지금처럼 sa · mi · far 없음',Array.isArray(day('2026-10-12').sa)&&Array.isArray(day('2026-10-12').mi)&&day('2026-10-12').far===undefined);
  T('데이터 크기가 과하지 않음(가족 4명 · 469일 → 150KB 이하)',JSON.stringify(w).length<150000,String(JSON.stringify(w).length));
  // 지난 2달 ~ 다음 12달: 그 달들의 달력이 통째로 들어 있어야 위젯이 그 달까지 넘겨 줌 (7월은 한 달 더 지난 달 · 2027년 11월은 한 달 더 먼 달이라 일부만)
  const keys=new Set(w.days.map(x=>x.k));
  const fmtK=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const gridKeys=(y,m)=>{const f=new Date(y,m,1),lead=f.getDay(),n=new Date(y,m+1,0).getDate(),rows=Math.ceil((lead+n)/7),st=new Date(y,m,1-lead),o=[];for(let i=0;i<rows*7;i++)o.push(fmtK(new Date(st.getFullYear(),st.getMonth(),st.getDate()+i)));return o;};
  let allIn=true,bad='';for(let i=0;i<15;i++){const y=2026+Math.floor((7+i)/12),m=(7+i)%12;if(!gridKeys(y,m).every(k=>keys.has(k))){allIn=false;bad+=y+'-'+(m+1)+' ';}}
  T('2026년 8월 ~ 2027년 10월(15개 달)의 달력 칸이 모두 데이터에 들어 있음 — 오늘 달(10월) 기준 지난 2달 ~ 다음 12달',allIn,bad);
  T('그 밖의 달(2026년 7월 · 2027년 11월)은 달력 일부만 있어서 위젯이 넘기지 않음',!gridKeys(2026,6).every(k=>keys.has(k))&&!gridKeys(2027,10).every(k=>keys.has(k)));
  T('먼 앞날(12월 · 내년 1월)의 가족 달력에도 근무 글자가 패턴대로 있음 — 엄마 2026-12-25 · 2027-01-05',['주','야','휴'].includes(by('u_mom').s[idx('2026-12-25')])&&['주','야','휴'].includes(by('u_mom').s[idx('2027-01-05')]),by('u_mom').s[idx('2026-12-25')]+' '+by('u_mom').s[idx('2027-01-05')]);
  const m1120=by('u_mom').k['2026-11-20'];
  T('가족이 올린 스티커도 4개까지 감 — 엄마 11/20: 💪 · 알약 · 🧘 · 📖',Array.isArray(m1120)&&m1120.length===4&&m1120[0].e==='💪'&&m1120[1].p===1&&m1120[2].e==='🧘'&&m1120[3].e==='📖',JSON.stringify(m1120));
  // 설정 › 홈 화면 위젯 안내문: 한 달 위젯 이름 · (가족이 있을 때만) 이름 칩 안내
  await p.evaluate(()=>document.querySelector('[data-act="more-widget"]').click());await p.waitForTimeout(300);
  const wtxt=await p.evaluate(()=>document.querySelector('#page').innerText);
  T('위젯 설정 안내문: "7일 · 한 달" 이름 + 가족이 있으니 이름 칩 안내가 같이 나옴',/1칸 · 2칸 · 7일 · 한 달/.test(wtxt)&&/이름 칩/.test(wtxt),wtxt.slice(0,260));
  T('오류 없음',p.errs.length===0,p.errs.join('|'));
  await p.close();

  // 가족이 없는 사람: people 키 자체가 없음 (자료가 안 늘어남)
  {
    const q=await boot(b,{...base,memos},{touch:true,w:384});
    const ww=await push(q);
    T('가족이 없으면 people 이 아예 없음',!!ww&&!('people' in ww)&&ww.days.length===469);
    await q.evaluate(()=>document.querySelector('[data-act="more-widget"]').click());await q.waitForTimeout(300);
    const qtxt=await q.evaluate(()=>document.querySelector('#page').innerText);
    T('가족이 없으면 위젯 설정 안내문에 이름 칩 얘기가 안 나옴 (화면에 늘어나는 게 없음)',/한 달/.test(qtxt)&&!/이름 칩/.test(qtxt),qtxt.slice(0,260));
    T('가족이 없어도 지난 날 · 먼 날 한 달 칸 정보는 감',ww.days.find(x=>x.k==='2026-09-30').far===2&&ww.days.find(x=>x.k==='2026-09-30').ms[0]==='지난 달 내 메모');
    T('오류 없음(2)',q.errs.length===0,q.errs.join('|'));
    await q.close();
  }
  // 하루 스티커 4개(앱의 하루 한도)가 먼 앞날 · 지난 날에도 4개까지 감 (한 달 칸의 둘째 줄용)
  {
    const defs=['s_a','s_b','s_c','s_d'].map((id,i)=>({id,kind:'mark',emoji:['💊','👟','💧','📖'][i],name:'스티커'+i,times:1,rep:'daily',from:'2026-09-01',days:[],dates:[],skip:[],ats:[]}));
    const q=await boot(b,{...base,stamps:{defs,log:{},snap:{},v3:1,v4:1,lastAt:[]}},{touch:true,w:384});
    const ww=await push(q);
    const dd=k=>ww.days.find(x=>x.k===k);
    T('스티커 4개 쓰는 사람: 먼 앞날(11/20 · 2027-03-05) · 지난 날(9/02)도 stk 가 4개까지 감',[dd('2026-11-20'),dd('2027-03-05'),dd('2026-09-02')].every(x=>x&&x.far>=1&&x.stk.length===4),JSON.stringify([dd('2026-11-20').stk.length,dd('2027-03-05').stk.length,dd('2026-09-02').stk.length]));
    T('가까운 날(10/13)은 sa · stk 모두 4개 (지금처럼)',dd('2026-10-13').sa.length===4&&dd('2026-10-13').stk.length===4);
    T('오류 없음(3)',q.errs.length===0,q.errs.join('|'));
    await q.close();
  }
  // 월요일 시작(weekStart 1)이면 구간이 그에 맞게 (지난달 달력 첫 줄이 월요일부터)
  {
    const q=await boot(b,{...base,weekStart:1},{touch:true,w:384});
    const ww=await push(q);
    T('월요일 시작: 데이터 첫 날이 월요일(7/27) · ws 1',ww.ws===1&&ww.days[0].k==='2026-07-27'&&ww.days[0].w===1,JSON.stringify([ww.ws,ww.days[0].k,ww.days[0].w]));
    await q.close();
  }
  T.sum();await b.close();
})();

// v0.134 묶음: 가족에게 집 위치 자동(날씨 안 켜도 가족 날씨) · 가족 날짜 창 먼 날 한 줄 · 달력 판마다 스티커 크기 · 위젯 유찬 달력(일정 · 스티커 체크 · 메모 · 날씨)
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const sch={v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',
    types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],
    overrides:{},holRest:false,wx:{w:'41113',h:'41111',tm:{'주':['07:00','19:00'],'야':['19:00','07:00']}}};
  const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'view'}];
  const mk=r=>{const h={};for(let d=11;d<=20;d++)for(let x=0;x<24;x++)h[`202610${p2(d)}${p2(x)}`]=[12,10,0,1,0,2,50];
    const md={};for(let d=15;d<=22;d++)md[`202610${p2(d)}`]={am:[3,10],pm:[1,20],lo:8,hi:18};
    return {v:1,r,n:'',s:{b:'202610120500',h,n:{}},m:{b:'202610120600',d:md},a:{b:'',d:{}},q:null};};
  const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
  let asked=[];
  const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());const c=(u.searchParams.get('r')||'').split(',').filter(Boolean);asked.push(...c);
    r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(u.searchParams.has('past')?{d:{}}:{list:c.map(mk)})});}]];
  { // 1) 와이프 폰: 날씨를 안 켰어도 남편이 보낸 집 · 직장으로 날씨가 자동
    const p=await boot(b,{...base,addons:{...base.addons,wx:false},wx:{home:'',work:'',fw:{},nm:{}},
      link:{hid:'dad',role:'guest',name:'엄마',perm:'write',mode:'view',uid:'mom',hash:'',stkAsked:1},
      fam2:{members,scheds:{dad:sch},memos:{},reqIn:{},reqOut:{},me:{sent:2,bonus:0},seenMemo:[],init:true},requests:[]},{tz:'Asia/Seoul',T:KST(2026,10,14,10),cfg,routes,touch:true});
    await p.waitForTimeout(800);await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(2500);
    T('날씨를 안 켠 폰도 남편 집(41111) · 직장(41113) 날씨를 받아 옴',asked.includes('41111')&&asked.includes('41113'),JSON.stringify(asked));
    await p.evaluate(()=>__wx.render());await p.waitForTimeout(300);
    const c=await p.evaluate(()=>{const e=[...document.querySelectorAll('.fc2')].find(x=>/아빠/.test(x.innerText));return e?{wx:!!e.querySelector('.mwx:not(.mwx-off)'),btn:/날씨도 보기/.test(e.innerText)}:null;});
    T('가족 카드: 버튼 없이 날씨가 바로 보임',c&&c.wx&&!c.btn,JSON.stringify(c));
    const sh=await p.evaluate(()=>{const S=__wx.S;return {h:S.fam2.scheds.dad.wx&&S.fam2.scheds.dad.wx.h};});
    T('받은 근무표의 집(h) 보관',sh.h==='41111',JSON.stringify(sh));
    T('날씨를 안 켜도 가족 날씨는 매일 기록',await p.evaluate(()=>{const h=__wx.wxHist()['2026-10-14'];return !!(h&&h.f&&h.f.dad&&h.f.dad.c);}));
    T('오류 없음 (가족 날씨 자동)',p.errs.filter(x=>!/Failed to load resource/.test(x)).length===0,p.errs.join('|'));await p.close();
  }
  { // 2) 남편 폰: 집도 같이 보냄 · 판마다 스티커 크기
    const p=await boot(b,{...base,addons:{...base.addons,wx:true},wx:{home:'41111',work:'41113',fw:{},nm:{}}},{tz:'Asia/Seoul',T:KST(2026,10,14,10),cfg,routes});
    await p.waitForTimeout(1500);
    const pl=await p.evaluate(()=>__wx.famPayload().wx);
    T('가족에게 보내는 날씨 = 직장 · 집 · 시간',pl&&pl.w==='41113'&&pl.h==='41111'&&pl.tm,JSON.stringify(pl));
    const ps=await p.evaluate(()=>[...document.querySelectorAll('#view #track>.panel')].map(e=>e.style.getPropertyValue('--stz')));
    T('"달마다 따로": 달력 판마다 스티커 크기가 따로 달림',ps.length>=3&&ps.slice(0,3).every(v=>v!==''),JSON.stringify(ps));
    T('오류 없음 (보내기 · 판 크기)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 3) 유찬(직접 추가한 가족): 위젯 자료 · 위젯에서 체크 · 날씨 줄 → 앱
    const fam=[{id:'f1',name:'유찬',kind:'student',label:'유치원',start:'09:00',end:'15:00',vac:[],color:'#ec4899',notes:{'2026-10-14':'체육복'},
      sdefs:[{id:'a',name:'양치',emoji:'🪥',times:2,rep:'daily',days:[],dates:[],skip:[]}],stk:{'2026-10-14':['a']}}];
    const p=await boot(b,{...base,family:fam,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{},nm:{}}},{tz:'Asia/Seoul',T:KST(2026,10,14,10),cfg,routes});
    await p.waitForTimeout(1800);
    const w=await p.evaluate(()=>{let j='';window.AndroidBridge.setWidgetData=x=>{j=x;};__wx.pushWidgetNow&&__wx.pushWidgetNow();return j;});
    const wj=w?JSON.parse(w):await p.evaluate(()=>JSON.parse(window.__wjLast||'{}'));
    const pd=wj.people&&wj.people[0]&&wj.people[0].d&&wj.people[0].d['2026-10-14'];
    T('위젯 자료: 유찬 그날 일정 · 스티커(1/2) · 메모 · 날씨',pd&&/유치원/.test(pd.l)&&pd.st&&pd.st[0].n===1&&pd.st[0].N===2&&pd.nt==='체육복'&&pd.wx&&pd.wx.t,JSON.stringify(pd).slice(0,300));
    await p.evaluate(()=>{window.AndroidBridge.takeWidgetActions=()=>JSON.stringify([{t:'mstk',p:'f1',k:'2026-10-14',id:'a',n:2}]);__wx.widgetSync();});await p.waitForTimeout(300);
    T('위젯에서 체크(2/2) → 앱 유찬 스티커에 반영',await p.evaluate(()=>JSON.stringify(__wx.S.family[0].stk['2026-10-14'])==='["a","a"]'));
    await p.evaluate(()=>{window.AndroidBridge.takeWidgetActions=()=>'[]';window.__od='2026-10-14#wx@f1';window.AndroidBridge.takeOpenDate=()=>{const v=window.__od||'';window.__od='';return v;};__wx.widgetSync();});await p.waitForTimeout(500);
    T('위젯 날씨 줄 "#wx@f1" → 유찬 달력 + 유찬 날씨 팝업',await p.evaluate(()=>__wx.page.pageMode==='mancal'&&/유찬/.test((document.querySelector('#pop .wxp')||{}).innerText||'')));
    T('오류 없음 (위젯 유찬)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();})();

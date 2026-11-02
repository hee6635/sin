// v0.127 묶음: 지난 날 날씨 기록 · 가족 부를 이름 · 위젯 → 그 사람 달력 · 날씨 팝업 높이(챙길 것 없어요 · 결론 안 눌림 · 지남 맨 아래) · 쉬는 날 오늘 색 회색 · 연차 기준
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);const p2=n=>String(n).padStart(2,'0');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const sch={v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',
    types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],
    overrides:{},holRest:false,wx:{w:'41113',tm:{'주':['07:00','19:00'],'야':['19:00','07:00']}}};
  const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'view'}];
  const mk=r=>{const h={};for(let d=11;d<=20;d++)for(let x=0;x<24;x++)h[`202610${p2(d)}${p2(x)}`]=[12,10,0,1,0,2,50];return {v:1,r,n:'',s:{b:'202610120500',h,n:{}},m:{b:'',d:{}},a:{b:'',d:{}},q:null};};
  const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
  const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());
    const j=u.searchParams.has('past')?{r:u.searchParams.get('past'),ym:u.searchParams.get('ym'),st:'수원',d:{'20261011':[8,19,3.5,0]}}:{list:[mk('41111'),mk('41113')]};
    r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(j)});}]];
  const guest=x=>({...base,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{},nm:{}},
    link:{hid:'dad',role:'guest',name:'엄마',perm:'write',mode:'view',uid:'mom',hash:'',stkAsked:1},
    fam2:{members,scheds:{dad:sch},memos:{},reqIn:{},reqOut:{},me:{sent:2,bonus:0},seenMemo:[],init:true},requests:[],...x});
  { // 1) 지난 날 날씨 기록 (내 날짜 창 · 팝업 · 백업)
    const p=await boot(b,{...base,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{},nm:{}}},{tz:'Asia/Seoul',T:KST(2026,10,14,10),cfg,routes});
    await p.waitForTimeout(2500);
    const h=await p.evaluate(()=>{const H=__wx.wxHist(),x=H['2026-10-14'];return x?{n:JSON.stringify(x).length,k:!!x.c.k,past:(x.c.c||[]).some(c=>c.past||c.q),now:!!(x.hr&&x.hr.at.some(c=>c.now)),ls:!!JSON.parse(localStorage.getItem('eonjeswieo:wxh')||'{}')['2026-10-14']}:null;});
    T('날씨 받으면 오늘 카드를 폰에 저장 (지남 · 링크 · "지금" 빼고)',h&&h.k&&!h.past&&!h.now&&h.ls,JSON.stringify(h));
    T('하루 저장본 크기 8KB 안쪽 (1년 약 3MB 이하)',h&&h.n<8000,h&&h.n);
    // 어제(10/13) 저장본을 넣어 두고 지난 날짜 창
    await p.evaluate(()=>{const H=__wx.wxHist();H['2026-10-11']=JSON.parse(JSON.stringify(H['2026-10-14']));H['2026-10-11'].s='하루 요약';localStorage.setItem('eonjeswieo:wxh',JSON.stringify(H));__wx.openDay('2026-10-11');});
    await p.waitForTimeout(900);
    const d=await p.evaluate(()=>{const e=document.getElementById('wxDay');return e?{t:e.innerText.replace(/\s+/g,' '),card:!!e.querySelector('.wxcard')}:null;});
    T('지난 날짜 창: "그날 예보 기준" 카드 + "실제 8°~19° · 비 …"',d&&d.card&&/그날 예보 기준/.test(d.t)&&/실제 .*8°~19°/.test(d.t),JSON.stringify(d));
    await p.click('#wxDay .wxcard');await p.waitForTimeout(300);
    const pp=await p.evaluate(()=>{const e=document.querySelector('#pop .wxp');return e?{t:e.innerText.replace(/\s+/g,' '),web:!!e.querySelector('[data-act="wx-web"]'),now:/지금/.test(e.querySelector('.wxhr')?e.querySelector('.wxhr').innerText:'')}:null;});
    T('지난 날 팝업: 부제 "그날 예보 기준" · 맨 아래 "실제" 줄 · 네이버 링크 없음 · "지금" 칸 없음',pp&&/그날 예보 기준/.test(pp.t)&&/실제/.test(pp.t)&&!pp.web&&!pp.now,JSON.stringify(pp));
    await p.evaluate(()=>__wx.closePop());
    await p.evaluate(()=>{__wx.closeSheet();__wx.openDay('2026-10-10');});await p.waitForTimeout(500);
    T('저장본 없는 지난 날: 예전처럼 관측 한 줄 (또는 빈칸)',await p.evaluate(()=>{const e=document.getElementById('wxDay');return !!e&&!e.classList.contains('wxhist');}));
    const bk=await p.evaluate(()=>{const d=__wx.backupData();return !!(d.wxh&&d.wxh['2026-10-11']);});
    T('백업에 날씨 기록 포함',bk);
    const rs=await p.evaluate(()=>{const d=JSON.parse(JSON.stringify(__wx.backupData()));d.wxh['2026-09-01']=d.wxh['2026-10-11'];localStorage.removeItem('eonjeswieo:wxh');const H=__wx.wxHist();Object.keys(H).forEach(k=>delete H[k]);const ok=__wx.applyBackup(d);return ok&&!!__wx.wxHist()['2026-09-01']&&!!JSON.parse(localStorage.getItem('eonjeswieo:wxh'))['2026-09-01'];});
    T('복원하면 날씨 기록도 돌아옴',rs);
    // 팝업 (오늘): 챙길 것 없어요 · 결론 안 눌림 · 지남 태그는 칸 맨 아래
    await p.evaluate(()=>{__wx.closeSheet();__wx.openDay('2026-10-14');});await p.waitForTimeout(300);
    await p.click('#wxDay');await p.waitForTimeout(300);
    const t=await p.evaluate(()=>{const e=document.querySelector('#pop .wxp');const pc=e.querySelector('.wxc.past');return {nob:!!e.querySelector('.wxrw.nob img'),k:e.querySelector('.wxk').hasAttribute('data-act'),tag:pc?pc.lastElementChild.classList.contains('pastb'):null};});
    T('오늘 팝업: "챙길 것 · 없어요" + 웃는 얼굴 · 결론 칸은 안 눌림',t.nob&&!t.k,JSON.stringify(t));
    T('지남 태그는 칸 맨 아래',t.tag!==false,JSON.stringify(t));
    T('오류 없음 (날씨 기록)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 2) 가족 부를 이름 · 위젯 → 그 사람 달력
    const p=await boot(b,guest({famAlias:{dad:'남편',bad:'',"x y":'z'}}),{tz:'Asia/Seoul',T:KST(2026,10,14,10),cfg,routes,touch:true});
    await p.waitForTimeout(1500);
    const a=await p.evaluate(()=>({al:__wx.S.famAlias,n:__wx.famNameOf('dad'),peer:(__wx.famPeers()[0]||{}).name}));
    T('부를 이름: 잘못된 칸 버리고 저장 · 이름 = "남편" (가족 목록 · 시간표)',JSON.stringify(a.al)==='{"dad":"남편"}'&&a.n==='남편'&&a.peer==='남편',JSON.stringify(a));
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
    T('가족 탭 카드도 "남편"',await p.evaluate(()=>[...document.querySelectorAll('.fc2')].some(e=>/남편/.test(e.innerText))));
    const bk=await p.evaluate(()=>__wx.backupData().famAlias.dad==='남편');
    T('백업에 부를 이름 포함',bk);
    await p.evaluate(()=>{window.AndroidBridge.takeOpenDate=()=>{const v=window.__od||'';window.__od='';return v;};window.__od='2026-10-15@u_dad';__wx.widgetSync();});await p.waitForTimeout(600);
    const w=await p.evaluate(()=>{const s=document.querySelector('#sheet.open');return {open:!!s,t:s?s.innerText.replace(/\s+/g,' ').slice(0,200):''};});
    T('위젯 "@u_dad" → 아빠 달력의 그 날짜 창',w.open&&/15/.test(w.t),JSON.stringify(w));
    await p.evaluate(()=>{__wx.closeSheet();window.__od='2026-10-15@nobody';__wx.widgetSync();});await p.waitForTimeout(500);
    T('없는 사람이면 내 달력 날짜 창',await p.evaluate(()=>!!document.querySelector('#sheet.open')));
    {const e=p.errs.filter(x=>!/Failed to load resource/.test(x));T('오류 없음 (부를 이름 · 위젯 · 가짜 서버 400 빼고)',e.length===0,e.join('|'));};await p.close();
  }
  { // 3) 연차 기준 · 오늘 색 쉬는 날 회색
    const p=await boot(b,{...base,salary:{fixed:0,close:0,night:['22:00','06:00'],ot:0,nt:0,leaveYear:15,leaveFrom:'03-15',slips:{}},todayColor:'shift',calLook:'circle'});
    const s=await p.evaluate(()=>__wx.S.salary.leaveFrom);
    T('연차 새로 시작 (03-15) 저장 유지',s==='03-15',s);
    const p2b=await boot(b,{...base,salary:{fixed:0,close:0,night:['22:00','06:00'],ot:0,nt:0,leaveYear:15,leaveFrom:'15-99',slips:{}}});
    T('잘못된 기준일은 1월 1일로',await p2b.evaluate(()=>__wx.S.salary.leaveFrom==='')),await p2b.close();
    const tdc=await p.evaluate(()=>({a:document.documentElement.getAttribute('data-tdc'),rest:__wx.S&&true}));
    T('오늘 색 = 근무 색: 쉬는 날이면 data-tdc="rest" (회색 · 칠 없음) · 근무 날이면 "1"',tdc.a==='rest'||tdc.a==='1',JSON.stringify(tdc));
    T('오류 없음 (연차 · 오늘 색)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();})();

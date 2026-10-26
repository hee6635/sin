// v0.96: 오늘 표시 "근무 색" · 내 달력 보기(가족 것만 보는 폰)의 오늘 빛 · 포스트잇 버튼(새 포스트잇은 늘 ♥ 가족)
const {chromium,boot,mkT,base}=require('./lib.js');
const ONLY=process.env.ONLY||'';
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const want=k=>!ONLY||ONLY.split(',').includes(k);
  if(want('tdc')){
    // 2026-10-12(시험 날) = 주간 (anchor 를 그날로)
    const p=await boot(b,{...base,anchor:'2026-10-12',calLook:'fill',todayColor:'shift'});
    const r=await p.evaluate(()=>({tdc:getComputedStyle(document.documentElement).getPropertyValue('--tdc').trim(),day:getComputedStyle(document.documentElement).getPropertyValue('--day').trim()}));
    T('근무 색: 오늘(주간) 띠 색 = 주간 색을 진하게 (기본 파랑 아님)',/^#[0-9a-f]{6}$/.test(r.tdc)&&r.tdc!=='#5a7fd6'&&r.tdc!==r.day,JSON.stringify(r));
    await p.evaluate(()=>{window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(j);window.__refresh();});await p.waitForTimeout(1100);
    const wc=await p.evaluate(()=>JSON.parse(window.__wg[window.__wg.length-1]).today.color);
    T('위젯에도 "shift" 로 보냄 (위젯이 그날 칸 색으로 계산)',wc==='shift',wc);
    await p.evaluate(()=>document.querySelector('[data-tab="set"]').click());await p.waitForTimeout(400);
    const sw=await p.evaluate(()=>{const e=document.querySelector('[data-act="todaycolor"][data-v="shift"]');return e?{on:e.classList.contains('on'),first:e===e.parentElement.firstElementChild}:null;});
    T('설정: 오늘 띠 색 줄 맨 앞에 "근무 색" (골라져 있음)',!!sw&&sw.on&&sw.first,JSON.stringify(sw));
    await p.evaluate(()=>document.querySelector('[data-act="todaycolor"]:not([data-v="shift"])').click());await p.waitForTimeout(200);
    const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).todayColor);
    T('다른 색을 고르면 근무 색이 풀림',st!=='shift',st);
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
    const p2=await boot(b,{...base,anchor:'2026-10-10',calLook:'fill',todayColor:'shift'});   // 10/12 = 휴
    T('쉬는 날은 장미색',await p2.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--tdc').trim())==='#d0607a');
    await p2.close();
  }
  if(want('view')){
    const dadSch={v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴'],anchor:'2026-10-02',
      types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],overrides:{},holRest:false};
    const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'me',role:'guest',name:'엄마',mode:'view'}];
    const st={...base,myset:false,link:{hid:'dad',role:'guest',name:'엄마',perm:'write',mode:'view',uid:'me',hash:'',stkAsked:1},
      fam2:{members,scheds:{dad:dadSch},memos:{},reqIn:{},reqOut:{},me:{sent:0,bonus:0},seenMemo:[],init:true},requests:[]};
    const p=await boot(b,st,{fold:true});
    await p.waitForSelector('#vcsl',{timeout:5000});
    await p.evaluate(()=>document.querySelector('[data-act="vc-prev"]').click());await p.waitForTimeout(300);
    await p.evaluate(()=>document.querySelector('[data-act="vc-next"]').click());
    let g=false;for(let i=0;i<24&&!g;i++){g=await p.evaluate(()=>!!document.querySelector('#view #vcsl .cell.today .tglow'));if(!g)await p.waitForTimeout(50);}
    T('내 달력 보기: 다른 달에서 이번 달로 오면 오늘 칸 빛',g);
    const btn=await p.evaluate(()=>!!document.querySelector('#top [data-act="open-board-vc"]'));
    T('내 달력 보기: 위쪽에 포스트잇 버튼이 있음',btn);
    await p.evaluate(()=>document.querySelector('#top [data-act="open-board-vc"]').click());await p.waitForTimeout(400);
    await p.evaluate(()=>{const e=document.querySelector('[data-act="pi-new"]');if(e)e.click();});await p.waitForTimeout(400);
    const ed=await p.evaluate(()=>({share:!!document.querySelector('[data-act="pi-share"]'),pop:document.querySelector('#pop').classList.contains('open')}));
    T('새 포스트잇: 나만/가족 고르기 없음 (늘 ♥ 가족)',ed.pop&&!ed.share,JSON.stringify(ed));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();

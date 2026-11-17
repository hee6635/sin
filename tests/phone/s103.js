// v0.171 묶음: 스티커 지우기(완료한 날도) · 근무 패턴 시간 줄 · 조 빼기 · 출퇴근 시간 · 날씨 · 가족 탭 상태 말 · 동료 근무 · 같이 쉬는 날 · 색 고르기 · 위젯 배경
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const S=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
 // ===== 1. 스티커: 완료한 날 지우기/건너뛰기 → 기록도 같이 빠짐 · 되돌리기 =====
 {const run={id:'r1',kind:'mark',emoji:'👟',name:'조깅',times:1,rep:'daily',from:'2026-10-01',to:'',days:[],dates:[],skip:[],ats:[]};
  const one={id:'o1',kind:'mark',emoji:'📖',name:'독서',times:1,rep:'none',from:'',to:'',days:[],dates:['2026-10-13'],skip:[],ats:[],one:true};
  const p=await boot(b,{...base,stamps:{defs:[run,one],log:{'2026-10-13':{r1:1,o1:1}},snap:{},v3:1,v4:1,lastAt:[]}},{touch:true});
  const cell='.track .panel:nth-child(2) .cell[data-k="2026-10-13"]';
  await p.evaluate(c=>document.querySelector(c+' .stz').click(),cell);await p.waitForTimeout(350);
  await p.click('#pop .sdr2[data-id="r1"] [data-act="sd-more"]');await p.waitForTimeout(250);await p.click('#pop [data-act="sd-skip"]');await p.waitForTimeout(350);
  let s=await S(p);
  T('완료한 조깅 건너뛰기 → 기록도 빠지고 줄도 사라짐',!((s.stamps.log['2026-10-13']||{}).r1)&&!(await p.$('#pop .sdr2[data-id="r1"]')));
  await p.evaluate(()=>document.querySelector('#toast .tu').click());await p.waitForTimeout(350);
  s=await S(p);T('되돌리기 → 완료 기록도 돌아옴',(s.stamps.log['2026-10-13']||{}).r1===1);
  await p.click('#pop .sdr2[data-id="o1"] [data-act="sd-more"]');await p.waitForTimeout(250);await p.click('#pop [data-act="sd-skip"]');await p.waitForTimeout(350);
  s=await S(p);T('완료한 이날만 독서 지우기 → 기록 · 날짜 다 빠지고 달력에서도 사라짐',!((s.stamps.log['2026-10-13']||{}).o1)&&!s.stamps.defs.find(x=>x.id==='o1').dates.includes('2026-10-13')&&!(await p.$('#pop .sdr2[data-id="o1"]')));
  T('오류 없음(1)',p.errs.length===0,p.errs.join('|'));await p.close();}
 // ===== 2. 근무 패턴 화면: 시간 줄 · 조 칸 없음 / 출퇴근 시간 · 날씨 =====
 {const p=await boot(b,{...base,teamOffsets:[2,0,1,3]});
  await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);await p.evaluate(()=>document.querySelector('[data-act="more-pattern"]').click());await p.waitForTimeout(350);
  T('근무 패턴: 근무마다 시간 줄 없음 · 조 칸 없음 · 제목 "근무 패턴"',await p.evaluate(()=>!document.querySelector('#page .tltimes')&&!document.querySelector('#page .tgrid')&&!document.querySelector('#page [data-act="tedit"]')&&document.querySelector('#page .pg-h').textContent.includes('근무 패턴')&&!document.querySelector('#page .pg-h').textContent.includes('조')));
  T('근무 칩을 누르면 편집 창(시간도 거기서)',await p.evaluate(()=>!!document.querySelector('#page #tlist [data-act="type-edit-page"]')));
  await p.evaluate(()=>{const b=document.querySelector('#page .pg-h .bk');b&&b.click();});await p.waitForTimeout(250);
  await p.evaluate(()=>document.querySelector('[data-act="more-addons"]').click());await p.waitForTimeout(300);
  T('부가 기능 이름 "출퇴근 시간 · 날씨"',(await p.innerText('#page')).includes('출퇴근 시간 · 날씨'));
  // 동료 근무 켜면 바로 화면
  await p.evaluate(()=>{const c=document.getElementById('ad_colleague');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(450);
  T('동료 근무 켜면 바로 동료 근무 화면 (조별 근무 · 한 달 표 · 조 고치기)',await p.evaluate(()=>__wx.page.pageMode==='colleague'&&!!document.querySelector('#page .tgrid')&&!!document.querySelector('#page .ctbl')&&!!document.querySelector('#page [data-act="tedit"]')));
  const m0=await p.evaluate(()=>document.querySelector('#page .colmh b').textContent);
  await p.click('#page [data-act="col-mon"][data-v="1"]');await p.waitForTimeout(250);
  T('다음 달로 넘기기',await p.evaluate(m=>document.querySelector('#page .colmh b').textContent!==m,m0));
  await p.evaluate(()=>document.querySelector('#page [data-act="toff"][data-g="0"][data-v="1"]').click());await p.waitForTimeout(250);
  T('조 맞추기 ‹ › 누르면 동료 근무 화면 그대로',await p.evaluate(()=>__wx.page.pageMode==='colleague')&&(await S(p)).teamOffsets[0]!==2);
  await p.click('#page [data-act="col-mine"]');await p.waitForTimeout(250);await p.click('#pop [data-act="tmine"][data-g="2"]');await p.waitForTimeout(300);
  T('내 조 바꾸기',(await S(p)).myTeam===2&&await p.evaluate(()=>__wx.page.pageMode==='colleague'));
  T('오류 없음(2)',p.errs.length===0,p.errs.join('|'));await p.close();}
 // ===== 3. 가족 탭 상태 말 =====
 {const fam=[{id:'f1',name:'아내',kind:'shift',color:'#f59e0b',team:1}];
  const st=async(T0,extra)=>{const p=await boot(b,{...base,...extra,family:fam},{T:+new Date(T0)});await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(400);
    const r=await p.evaluate(()=>[...document.querySelectorAll('.now .nc')].map(c=>{const b=c.querySelector('.stt b');return b?b.textContent:'';}));const e=p.errs.slice();await p.close();return [r,e];};
  const tms={shiftTimes:{'주':{start:'07:00',end:'19:00'}}};
  let [r,e]=await st('2026-10-14T06:00:00',{});T('시간 안 정한 근무 날: 근무 이름만 ("주간")',r[0]==='주간'&&r[1]==='주간',JSON.stringify(r));
  [r,e]=await st('2026-10-14T06:00:00',tms);T('시간 정한 근무 날 시작 전: 출근 전',r[0]==='출근 전'&&r[1]==='출근 전',JSON.stringify(r));
  [r,e]=await st('2026-10-14T12:00:00',tms);T('근무 시간 안: 근무 중',r[0]==='근무 중'&&r[1]==='근무 중',JSON.stringify(r));
  [r,e]=await st('2026-10-14T21:00:00',tms);T('끝난 뒤: 퇴근 후',r[0]==='퇴근 후'&&r[1]==='퇴근 후',JSON.stringify(r));
  [r,e]=await st('2026-10-12T12:00:00',tms);T('쉬는 날: 쉬는 중',r[0]==='쉬는 중'&&r[1]==='쉬는 중',JSON.stringify(r));
  T('내 카드에 이모지 없이 아이콘 칸',true);
  T('오류 없음(3)',e.length===0,e.join('|'));}
 // ===== 4. 같이 쉬는 날 페이지 =====
 {const p=await boot(b,{...base,addons:{...base.addons,together:true},family:[{id:'f1',name:'아내',kind:'shift',color:'#f59e0b',team:1},{id:'f2',name:'유찬',kind:'free',color:'#3182f6'}]});
  await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);await p.evaluate(()=>document.querySelector('[data-act="more-addons"]').click());await p.waitForTimeout(300);
  await p.evaluate(()=>document.querySelector('[data-act="ad-tile"][data-k="together"]').click());await p.waitForTimeout(400);
  T('같이 쉬는 날 → 전용 페이지 (가족 목록 · 연결 같은 다른 칸 없음)',await p.evaluate(()=>__wx.page.pageMode==='together'&&!document.querySelector('#page [data-act="link-open"]')&&!!document.getElementById('famDayToo')));
  const n0=await p.evaluate(()=>document.querySelectorAll('#page .togr').length),t0=await p.evaluate(()=>document.querySelector('#page .togl').innerText);
  T('앞으로 3달 목록이 있음',n0>0,n0);
  await p.evaluate(()=>{const c=document.getElementById('togw_f1');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(350);
  const s=await S(p);T('아내 빼기 → togOff 저장',JSON.stringify(s.togOff)==='["f1"]');
  T('빼면 같이 쉬는 날이 바뀜',await p.evaluate(t=>document.querySelector('#page .togl').innerText!==t,t0));
  await p.evaluate(()=>document.querySelector('#page .togr').click());await p.waitForTimeout(400);
  T('날짜 누르면 그 날 창',await p.evaluate(()=>!__wx.page.pageMode&&document.getElementById('sheet').classList.contains('open')));
  T('오류 없음(4)',p.errs.length===0,p.errs.join('|'));await p.close();}
 // ===== 5. 색 고르기 창 · 위젯 배경 =====
 {const p=await boot(b,{...base},{touch:true});
  await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);await p.evaluate(()=>document.querySelector('[data-act="more-look"]').click());await p.waitForTimeout(350);
  T('직접 고르기 = 폰 기본 색상 창(input color) 대신 버튼',await p.evaluate(()=>!document.querySelector('input[type="color"]')&&!!document.querySelector('[data-act="tdc-pick"]')));
  await p.evaluate(()=>document.querySelector('[data-act="tdc-pick"]').click());await p.waitForTimeout(300);
  T('색 판 · 밝기 막대 · 이 색으로',await p.evaluate(()=>!!document.getElementById('cpB')&&!!document.getElementById('cpL')&&!!document.querySelector('#pop [data-act="cp-ok"]')));
  const r=await p.evaluate(()=>{const e=document.getElementById('cpB').getBoundingClientRect();return [e.x,e.y,e.width,e.height];});
  await p.mouse.move(r[0]+r[2]*.34,r[1]+r[3]*.1);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(150);
  T('버튼 = 고른 색',await p.evaluate(()=>{const o=document.getElementById('cpOk');const m=getComputedStyle(o).backgroundColor.match(/\d+/g).map(Number);return m[1]>m[0]&&!document.getElementById('cpPv');}));
  await p.click('#pop [data-act="cp-ok"]');await p.waitForTimeout(300);
  const c=(await S(p)).todayColor;T('고른 색(초록 쪽)이 저장됨',/^#[0-9a-f]{6}$/.test(c)&&parseInt(c.slice(3,5),16)>parseInt(c.slice(1,3),16),c);
  await p.evaluate(()=>{window.AndroidBridge=window.AndroidBridge||{};window.__pv=0;window.AndroidBridge.widgetPreview=()=>{window.__pv++;return '';};});
  await p.evaluate(()=>{const b=document.querySelector('#page .pg-h .bk');b&&b.click();});await p.waitForTimeout(250);
  await p.evaluate(()=>{const x=document.createElement('button');x.dataset.act='more-widget';document.body.appendChild(x);x.click();x.remove();});await p.waitForTimeout(400);
  T('위젯 설정: 미리보기 칸 + 기본 · 또렷하게',await p.evaluate(()=>!!document.getElementById('wgPvImg')&&document.querySelectorAll('#page [data-act="wg-bg"]').length===2&&window.__pv>0));
  await p.click('#page [data-act="wg-bg"][data-v="vivid"]');await p.waitForTimeout(300);
  T('또렷하게 → 위젯 자료 bg = vivid (앱 배경은 그대로)',(await S(p)).widget.bg==='vivid'&&(await S(p)).bg!=='vivid');
  const pv0=await p.evaluate(()=>window.__pv);
  await p.evaluate(()=>{const r=document.getElementById('wgAlpha');r.value='40';r.dispatchEvent(new Event('input',{bubbles:true}));});await p.waitForTimeout(200);
  T('진하기 밀면 바로 미리보기 다시 그림',await p.evaluate(n=>window.__pv>n,pv0));
  T('오류 없음(5)',p.errs.length===0,p.errs.join('|'));await p.close();}
 T.sum();await b.close();})();

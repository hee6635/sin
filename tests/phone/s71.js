// v0.100 출퇴근 날씨 (부가 기능 · 기본 꺼짐): 켜기 → 집 · 직장 고르기 → 날짜 창 한 줄 · 큰 팝업 수치 · 가족 카드 · 알람(끈 뒤 날씨 · 날씨만) · 끄면 다 사라짐
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);
const p2=n=>String(n).padStart(2,'0');
// 가짜 예보: 10/12 ~ 10/16 매시. 10/14 출근(07시) 6° 흐림 · 퇴근(19시) 12° 비 70% 3mm · 그 밖 10° 맑음. 10/20 = 중기예보
function raw(code){
  const h={};
  for(let d=12;d<=16;d++)for(let x=0;x<24;x++){
    const k=`202610${p2(d)}${p2(x)}`,rain=d===14&&x>=17&&x<=21;
    const tp=d===14?(x<=8?6:x<=18?6+(x-8):12):10;
    h[k]=[tp,rain?70:10,rain?1:0,d===14?4:1,rain?3:0,2.1,60];
  }
  return {v:1,r:code,n:'',s:{b:'202610120800',h,n:{'20261014':[5,16]}},m:{b:'202610120600',d:{'20261020':['맑음',10,'흐리고 비',60,4,15]}},
    a:{b:'2026101205',d:{'20261012':[1,1],'20261014':[2,2]}},q:{t:'2026-10-12 09:00',p10:42,p25:18,w:'경기'}};
}
let hits=0;
const DONGS=require('../../firebase/functions/lib/wxDongs.json');
const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());
  if(u.searchParams.has('dongs')){const l=DONGS[u.searchParams.get('dongs')]||[];return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({list:l.map(x=>[x[0],x[1]])})});}
  hits++;const codes=(u.searchParams.get('r')||'').split(',');
  r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(codes.length>1?{list:codes.map(raw)}:raw(codes[0]))});}]];
const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
const opt=x=>({tz:'Asia/Seoul',T:KST(2026,10,12,10),cfg,routes,...x});
(async()=>{
  const T=mkT();const b=await chromium.launch();
  { // 1) 꺼져 있을 때: 늘어나는 것 없음
    const p=await boot(b,{...base},opt({}));
    await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(300);
    T('꺼져 있으면 날짜 창에 날씨 줄 없음',await p.evaluate(()=>{const e=document.getElementById('wxDay');return !!e&&e.hidden&&!e.textContent;}));
    await p.evaluate(()=>{__wx.closeSheet();__wx.newAlarm();});await p.waitForTimeout(200);
    T('꺼져 있으면 알람 설정에 날씨 줄 없음',await p.evaluate(()=>!document.querySelector('#page [data-act="dwx"]')));
    await p.evaluate(()=>{__wx.closePage();__wx.openAddonPage();});await p.waitForTimeout(200);
    T('부가 기능에 "출퇴근 날씨" 스위치 (꺼짐)',await p.evaluate(()=>{const x=document.getElementById('ad_wx');return !!x&&!x.checked;}));
    T('꺼져 있으면 서버에 안 물어봄',hits===0,hits);
    // 켜기 → 날씨 설정 화면 → 집 · 직장 고르기 → 맞아요
    await p.click('#ad_wx');await p.waitForTimeout(300);
    T('켜면 바로 "출퇴근 날씨" 설정 화면',await p.evaluate(()=>__wx.page.pageMode==='wx'&&/출근 땐 집, 퇴근 땐 직장 날씨/.test(document.querySelector('#page').textContent)));
    T('근무 시간 확인 줄 (주간 07:00 → 19:00)',await p.evaluate(()=>/07:00 → 19:00/.test(document.querySelector('#page').textContent)&&/19:00 → 다음날 07:00/.test(document.querySelector('#page').textContent)));
    await p.click('[data-act="wx-pick-home"]');await p.waitForTimeout(150);
    T('시 · 도 고르기 (16곳 · 광주는 전남광주)',await p.evaluate(()=>document.querySelectorAll('#pop [data-act="wx-sido"]').length>=16));
    await p.click('#pop [data-act="wx-sido"][data-v="경기"]');await p.waitForTimeout(150);
    T('경기 → 시 · 군 · 구 목록 (수원시 장안구 · 화성시 동탄구)',await p.evaluate(()=>!!document.querySelector('#pop [data-act="wx-sgg"][data-v="41111"]')&&/화성시 동탄구/.test(document.querySelector('#pop').textContent)));
    await p.click('#pop [data-act="wx-sgg"][data-v="41111"]');await p.waitForTimeout(300);
    T('시·군·구 다음 동 고르기 (선택 · "전체" 줄 + 동 목록)',await p.evaluate(()=>!!document.querySelector('#pop [data-act="wx-dong"][data-v="41111"]')&&!!document.querySelector('#pop [data-act="wx-dong"][data-n="연무동"]')));
    await p.click('#pop [data-act="wx-dong"][data-n="연무동"]');await p.waitForTimeout(150);
    await p.click('[data-act="wx-pick-work"]');await p.waitForTimeout(150);
    await p.click('#pop [data-act="wx-sido"][data-v="경기"]');await p.waitForTimeout(150);
    await p.click('#pop [data-act="wx-sgg"][data-v="41597"]');await p.waitForTimeout(300);
    await p.click('#pop [data-act="wx-dong"][data-v="41597"]');await p.waitForTimeout(150);   // 직장은 동 안 고름
    T('고른 지역이 화면에 보임 (집 = 동까지)',await p.evaluate(()=>/경기 수원시 장안구 연무동/.test(document.querySelector('#page').textContent)&&/경기 화성시 동탄구/.test(document.querySelector('#page').textContent)));
    await p.click('[data-act="wx-ok"]');await p.waitForTimeout(900);
    T('저장: 켜짐 · 집 연무동(10자리) · 직장 41597',await p.evaluate(()=>{const S=__wx.S,g=__wx.page;return S.addons.wx===true&&S.wx.home==='4111160000'&&S.wx.nm['4111160000']==='연무동'&&S.wx.work==='41597'&&!g.pageMode&&g.pageBack===null;}));
    T('서버에서 두 지역 받아 옴 (저장소에도)',hits>=1&&await p.evaluate(()=>{const c=JSON.parse(localStorage.getItem('eonjeswieo:wx')||'{}');return !!(c['4111160000']&&c['41597']);}),hits);
    // 날짜 창 한 줄 (간단하게)
    await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(300);
    const l1=await p.evaluate(()=>{const e=document.getElementById('wxDay');return e?{t:e.textContent,c:e.className}:null;});
    T('근무 날(주간) 한 줄: 퇴근길 비 · 우산 + 출근 6° · 퇴근 12°',!!l1&&/퇴근길 비 · 우산/.test(l1.t)&&/출근 6° · 퇴근 12°/.test(l1.t)&&/wet/.test(l1.c),JSON.stringify(l1));
    await p.click('#wxDay');await p.waitForTimeout(200);
    const pop=await p.evaluate(()=>document.querySelector('#pop.open')?document.querySelector('#pop').innerText:'');
    T('큰 팝업: 수치 (12° · 강수 70% · 3mm · 바람 2.1m/s · 습도)',/12°/.test(pop)&&/강수 70%/.test(pop)&&/3mm/.test(pop)&&/바람 2\.1m\/s/.test(pop)&&/습도 60%/.test(pop),pop);
    T('큰 팝업: 집 · 직장 이름 · 출근/퇴근 시각',/출근 07:00/.test(pop)&&/퇴근 19:00/.test(pop)&&/집 · 연무동/.test(pop)&&/직장 · 화성시 동탄구/.test(pop),pop);
    T('큰 팝업: 옷차림 (👕 코트 · 히트텍 · 우산)',/👕 코트 · 히트텍/.test(pop)&&/우산/.test(pop),pop);
    T('큰 팝업: 미세먼지 등급 (예보)',/미세먼지 보통/.test(pop)&&/미세먼지 보통 · 초미세먼지 보통/.test(pop)&&/수치\(㎍\/㎥\)는 오늘만/.test(pop),pop);
    await p.evaluate(()=>{__wx.closePop();__wx.openDay('2026-10-12');});await p.waitForTimeout(300);
    const l2=await p.evaluate(()=>document.getElementById('wxDay').textContent);
    T('쉬는 날(오늘): 하루 요약 "맑아요 · 10° ~ 10°"',/맑아요/.test(l2)&&/10° ~ 10°/.test(l2),l2);
    await p.click('#wxDay');await p.waitForTimeout(200);
    const pop2=await p.evaluate(()=>document.querySelector('#pop').innerText);
    T('오늘 팝업: 미세먼지 지금 수치 8단계 (42㎍/㎥ 보통 · 18㎍/㎥ 양호 · 경기 평균) + 마스크 안내',/미세먼지 42㎍\/㎥ \(보통\)/.test(pop2)&&/초미세먼지 18㎍\/㎥ \(양호\)/.test(pop2)&&/경기 평균/.test(pop2)&&/미세먼지 보통 · 민감하면 마스크/.test(pop2),pop2);
    T('오늘(쉬는 날) 팝업: 옷차림 줄 (👕 · 오늘 하루)',/👕/.test(pop2)&&/오늘 하루/.test(pop2),pop2);
    await p.evaluate(()=>{__wx.closePop();__wx.openDay('2026-10-20');});await p.waitForTimeout(300);
    const l3=await p.evaluate(()=>document.getElementById('wxDay').textContent);
    T('4~10일 뒤(중기): 오전 맑음 · 오후 흐리고 비 60% · 4° ~ 15°',/오전 맑음/.test(l3)&&/오후 흐리고 비 60%/.test(l3)&&/4° ~ 15°/.test(l3),l3);
    await p.evaluate(()=>__wx.openDay('2026-10-28'));await p.waitForTimeout(300);
    T('예보 없는 날은 줄 없음',await p.evaluate(()=>document.getElementById('wxDay').hidden));
    await p.evaluate(()=>__wx.closeSheet());
    // 알람: 끈 뒤 날씨 (기본) · 날씨만
    await p.evaluate(()=>{window.AndroidBridge.setAlarms=j=>{window.__al=JSON.parse(j);};});
    await p.evaluate(()=>__wx.newAlarm({shift:'주',time:'05:50'}));await p.waitForTimeout(200);
    T('알람 설정: 날씨 줄 (끈 뒤 보기 · 날씨만 · 안 함) · 새 알람은 "끈 뒤 보기"',await p.evaluate(()=>document.querySelectorAll('#page [data-act="dwx"]').length===3&&document.querySelector('#page [data-act="dwx"][data-v="card"]').classList.contains('on')));
    await p.click('#page [data-act="asave"]');await p.waitForTimeout(400);
    const al=await p.evaluate(()=>(window.__al||[]).find(x=>x.id.endsWith('_2026-10-14')));
    let wp=null;try{wp=JSON.parse(al.wxp);}catch(e){}
    T('폰에 넘긴 알람: 끈 뒤 날씨 주소(집 · 직장 · 출퇴근 시각) + 예비 문구',!!al&&al.wx===1&&/cloudfunctions\.net\/wx\?h=4111160000&w=41597&s=202610140700&e=202610141900/.test(al.wxq)&&!!wp&&wp.h==='퇴근길 비 와요 · 우산 챙겨요',JSON.stringify(al&&{q:al.wxq,h:wp&&wp.h}));
    await p.evaluate(()=>__wx.newAlarm({shift:'주',time:'06:30'}));await p.waitForTimeout(150);
    await p.click('#page [data-act="dwx"][data-v="only"]');await p.waitForTimeout(150);
    T('날씨만: 소리 · 다시 울림 줄 숨김',await p.evaluate(()=>!document.querySelector('#page [data-act="dsnd-open"]')));
    await p.click('#page [data-act="asave"]');await p.waitForTimeout(400);
    const rem=await p.evaluate(()=>(window.__rem||[]).filter(x=>x.type==='wx'));
    T('날씨만 알람 → 알람 목록엔 없고 조용한 알림(type wx)으로',rem.length>0&&rem[0].wxq.includes('&s=')&&await p.evaluate(()=>!(window.__al||[]).some(x=>/06:30/.test(x.time))),JSON.stringify(rem[0]||{}).slice(0,200));
    const r14=rem.find(x=>x.date==='2026-10-14');
    T('날씨만 알림 예비 제목/글 (☔ 퇴근길 비 · 출근 6° · 퇴근 12°)',!!r14&&/☔ 퇴근길 비 와요/.test(r14.title)&&/출근 6° · 퇴근 12°/.test(r14.text),JSON.stringify(r14||{}).slice(0,200));
    await p.click('#nav [data-tab="alarm"]');await p.waitForTimeout(300);
    T('알람 목록: "☔ 날씨 알림만" 표시 · 다음 알람 카드는 울리는 알람',await p.evaluate(()=>/☔ 날씨 알림만/.test(document.body.innerText)&&/05:50|5:50/.test(document.querySelector('.anext').textContent)));
    // 끄면: 날짜 창 줄 없음 · 날씨만 알림 안 감
    await p.evaluate(()=>{__wx.S.addons.wx=false;__wx.save();__wx.render();__wx.pushRemindersToNative();__wx.openDay('2026-10-14');});await p.waitForTimeout(300);
    T('끄면 날짜 창 날씨 줄 없음',await p.evaluate(()=>document.getElementById('wxDay').hidden));
    T('끄면 날씨만 알림도 안 감',await p.evaluate(()=>!(window.__rem||[]).some(x=>x.type==='wx')));
    T('끄면 알람에 날씨 주소 없음',await p.evaluate(()=>{__wx.pushAlarmsToNative();return !(window.__al||[]).some(x=>x.wxq);}));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));
    await p.close();
  }
  { // 2) 가족 탭 카드: 출근 앞뒤 2시간 안이면 "출근 10°" · 누르면 큰 팝업 · 직접 추가한 가족 카드 · 같이 쉬는 날 칩 아이콘
    const st={...base,anchor:'2026-10-12',shiftTimes:{'주':{start:'09:00',end:'18:00'}},addons:{...base.addons,wx:true,together:true},wx:{home:'41111',work:'41597',fw:{}},
      family:[{id:'f1',name:'남편',kind:'shift',team:1,own:true,pat:['주','휴'],patAnchor:'2026-10-12',days:[]}]};
    const p=await boot(b,st,opt({}));await p.waitForTimeout(2900);
    await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(500);
    const chip=await p.evaluate(()=>[...document.querySelectorAll('.nc .wxb')].map(e=>e.textContent));
    T('내 카드: 출근 1시간 뒤(10시) → "☀️ 출근 10°"',chip.some(t=>/출근 10°/.test(t)),JSON.stringify(chip));
    await p.evaluate(()=>document.querySelector('.nc .wxb[data-u="me"]').click());await p.waitForTimeout(200);
    const pop=await p.evaluate(()=>document.querySelector('#pop.open')?document.querySelector('#pop').innerText:'');
    T('내 카드 팝업: 오늘 출근 09:00 · 퇴근 18:00 수치',/출근 09:00/.test(pop)&&/퇴근 18:00/.test(pop)&&/10°/.test(pop),pop);
    await p.evaluate(()=>__wx.closePop());
    T('가족 카드 날씨 칸 누르면 팝업 + "직장 지역 정하기" 버튼',await p.evaluate(()=>{const m=__wx.wxFam()[0];if(!m)return 'nofam';const w=__wx.wxMemWin(m,new Date());if(!w)return 'nowin';__wx.wxOpenFam(__wx.wxMemKey(m));return /직장 지역 정하기/.test(document.querySelector('#pop').innerText);}));
    T('같이 쉬는 날 칩 아이콘 함수 (10/13 ☀️)',await p.evaluate(()=>__wx.wxChipIcon(new Date(2026,9,13)).includes('☀️')));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 3) 가족 근무표에 실린 날씨(직장 · 시각) 받기 · 이상한 값은 버림 · 근무표 이름으로 시간 짐작
    const p=await boot(b,{...base,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{}}},opt({}));
    T('가족 근무표 wx: 직장 5자리 · 시각만 남김',await p.evaluate(()=>{const o=__wx.famCleanSched({anchor:'2026-10-01',pattern:['주'],types:[{k:'주',name:'주간'}],wx:{w:'41597',tm:{'주':['07:00','19:00'],x:['a','b']},gps:1}});return o.wx.w==='41597'&&JSON.stringify(o.wx.tm)==='{"주":["07:00","19:00"]}'&&!('gps' in o.wx);}));
    T('이상한 wx 는 통째로 버림',await p.evaluate(()=>!('wx' in __wx.famCleanSched({anchor:'2026-10-01',pattern:['주'],wx:{w:'<img>'}}))));
    T('근무표를 올린 가족: 보낸 시각 · 없으면 이름으로 짐작(야간 19→07)',await p.evaluate(()=>{
      const sch={pattern:['야'],anchor:'2026-10-01',types:[{k:'야',name:'야간',rest:false}],overrides:{}};
      const w=__wx.wxMemWin({kind:'sched',sch},new Date(2026,9,14)),a=new Date(w.s),e=new Date(w.e);
      const w2=__wx.wxMemWin({kind:'sched',sch:{...sch,wx:{w:'41597',tm:{'야':['20:00','08:00']}}}},new Date(2026,9,14));
      return a.getHours()===19&&e.getHours()===7&&e.getDate()===15&&new Date(w2.s).getHours()===20&&__wx.wxMemWork({kind:'sched',sch:{...sch,wx:{w:'41597'}}})==='41597';}));
    T('내 근무표에 날씨 싣기: 직장을 정한 사람만',await p.evaluate(()=>{const a=!('wx' in __wx.famPayload());__wx.S.wx.work='41597';const b=__wx.famPayload().wx;return a&&b.w==='41597'&&Array.isArray(b.tm['주']);}));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 4) 깨진 저장 값 · 보안 잠금(CSP) 켠 채로 서버 부르기
    const p=await boot(b,{...base,addons:{...base.addons,wx:true},wx:{home:'<x>',work:12345,fw:{a:'41111',b:'x'}}},opt({}));
    T('깨진 wx 값 정리',await p.evaluate(()=>__wx.S.wx.home===''&&__wx.S.wx.work===''&&JSON.stringify(__wx.S.wx.fw)==='{"a":"41111"}'));
    T('집이 없으면 켜져 있어도 아무것도 안 보임',await p.evaluate(()=>!__wx.wxOn()));
    await p.close();
    const p3=await boot(b,{...base,addons:{...base.addons,wx:true},wx:{home:'4111160000',work:'51720390001',fw:{},nm:{'4111160000':'연무<동>','abc':'x'}}},opt({}));
    T('동 번호(10자리)는 남고 이상한 번호 · 동 이름은 정리',await p3.evaluate(()=>{const w=__wx.S.wx;return w.home==='4111160000'&&w.work===''&&JSON.stringify(w.nm)==='{"4111160000":"연무동"}'&&__wx.wxOn();}));
    T('오류 없음 (동)',p3.errs.length===0,p3.errs.join('|'));await p3.close();
    hits=0;
    const q=await boot(b,{...base,addons:{...base.addons,wx:true},wx:{home:'41111',work:'',fw:{}}},opt({csp:true}));await q.waitForTimeout(2900);
    T('보안 잠금(CSP) 켠 채로도 서버에서 받아 옴',hits>=1&&await q.evaluate(()=>!!__wx.wxRaw('41111')),hits);
    T('CSP 위반 기록 없음',await q.evaluate(()=>!/CSP/.test(localStorage.getItem('eonjeswieo:err')||'')),await q.evaluate(()=>localStorage.getItem('eonjeswieo:err')));
    await q.close();
  }
  T.sum();await b.close();
})();

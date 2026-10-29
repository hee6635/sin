// v0.103: 근무 패턴 "근무 시간 (선택)" · ⏱ 연장(실제 출퇴근) · 가족에게 근무 시간 · 근무 통계(대근 세 갈래 · 시간 · 명세서로 맞춘 예상 월급) · 날씨 → 네이버 · 지난 날짜 관측
const {chromium,boot,mkT,base}=require('./lib.js');
const p2=n=>String(n).padStart(2,'0');
// 가짜 날씨: 10/12 ~ 10/16 매시 10° (r) · 지난 관측 10월 (past)
function raw(code){const h={};for(let d=12;d<=16;d++)for(let x=0;x<24;x++)h[`202610${p2(d)}${p2(x)}`]=[10,10,0,1,0,2,60];return {v:1,r:code,n:'',s:{b:'202610120800',h,n:{}},a:null,q:null};}
let opened=[];
const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>{const u=new URL(r.request().url());
  const j=u.searchParams.has('past')?{r:u.searchParams.get('past'),ym:u.searchParams.get('ym'),st:'서울',d:{'20261005':[6,12,8.5,0],'20261007':[3,15,0,0]}}
    :(c=>c.length>1?{list:c.map(raw)}:raw(c[0]))((u.searchParams.get('r')||'').split(','));
  r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(j)});}]];
const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
const chg=(p,id,v)=>p.evaluate(([id,v])=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},[id,v]);
(async()=>{
  const T=mkT();const b=await chromium.launch();
  { // 1) 근무 패턴 화면 맨 아래 "근무 시간 (선택)"
    const p=await boot(b,{...base});
    await p.evaluate(()=>__wx.openPatternPage());await p.waitForTimeout(200);
    T('근무 패턴 맨 아래: 🕐 근무 시간 (선택) + 설명 (접힘)',await p.evaluate(()=>{const e=document.querySelector('#page .ptm');return !!e&&/근무 시간/.test(e.textContent)&&/출퇴근 날씨도 알려줘요/.test(e.textContent)&&!document.getElementById('ptS_0');}));
    await p.click('#page [data-act="ptm-tog"]');await p.waitForTimeout(150);
    T('펼치면 근무 종류마다 출근 → 퇴근 (휴 빠짐)',await p.evaluate(()=>!!document.getElementById('ptS_0')&&!!document.getElementById('ptE_1')&&/몰라도 괜찮아요/.test(document.querySelector('#page .ptm').textContent)));
    await chg(p,'ptS_0','08:00');await p.waitForTimeout(150);
    T('바꾸면 저장 (주간 08:00 → 19:00)',await p.evaluate(()=>__wx.S.shiftTimes['주'].start==='08:00'&&/정함|▴/.test(document.querySelector('#page .ptm').textContent)));
    T('가족에게 보낼 근무 시간 (주 08:00~19:00 · 야 19:00~07:00)',await p.evaluate(()=>{const x=__wx.famTimesPayload();return x.tm['주'][0]==='08:00'&&x.tm['야'][0]==='19:00'&&!x.ot;}));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 2) ⏱ 연장 (근무 통계 켠 사람 · 근무 날만) → 실제 출퇴근 · 가족 · 시간 계산
    const p=await boot(b,{...base,addons:{...base.addons,stats:true}});
    await p.evaluate(()=>__wx.openDay('2026-10-12'));await p.waitForTimeout(250);
    T('쉬는 날엔 ⏱ 연장 칩 없음',await p.evaluate(()=>!document.querySelector('#sheet [data-act="ot-open"]')));
    await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(250);
    T('근무 날: 근무타입 칩 끝에 ⏱ 연장',await p.evaluate(()=>{const e=document.querySelector('#sheet .tchips [data-act="ot-open"]');return !!e&&/연장/.test(e.textContent);}));
    await p.click('#sheet [data-act="ot-open"]');await p.waitForTimeout(150);
    T('연장 창: 원래 07:00 → 19:00 · 실제 출근/퇴근 칸',await p.evaluate(()=>/07:00 → 19:00/.test(document.querySelector('#pop').textContent)&&!!document.getElementById('otS')&&!!document.getElementById('otE')));
    await p.click('#pop [data-act="ot-add"][data-v="4"]');await p.waitForTimeout(200);
    T('+4시간 → 실제 07:00 ~ 23:00 저장 · 연장 4시간 · 그중 야간 1시간',await p.evaluate(()=>JSON.stringify(__wx.S.ot['2026-10-14'])==='["07:00","23:00"]'&&/연장 4시간/.test(document.querySelector('#pop').textContent)&&/야간 1시간/.test(document.querySelector('#pop').textContent)));
    const h=await p.evaluate(()=>__wx.dayHours(new Date(2026,9,14)));
    T('그날 시간: 일 15 · 연장 7 · 야간 1 · 신청 4',h.work===15&&h.ot===7&&h.night===1&&h.req===4&&h.reqN===1,JSON.stringify(h));
    await p.click('#pop [data-act="pop-close"]');await p.waitForTimeout(200);
    T('날짜 창: 칩 "+4시간" · 접힌 줄 "연장 4시간"',await p.evaluate(()=>/\+4시간/.test(document.querySelector('#sheet [data-act="ot-open"]').textContent)&&/연장 4시간/.test(document.querySelector('#sheet .sh-pill').textContent)));
    T('가족에게 그날 실제 시각도 보냄',await p.evaluate(()=>JSON.stringify(__wx.famTimesPayload().ot)==='{"2026-10-14":["07:00","23:00"]}'));
    await p.click('#sheet [data-act="ot-open"]');await p.waitForTimeout(150);await p.click('#pop [data-act="ot-clear"]');await p.waitForTimeout(200);
    T('없음 → 원래대로',await p.evaluate(()=>!__wx.S.ot['2026-10-14']&&!/\+4시간/.test(document.querySelector('#sheet [data-act="ot-open"]').textContent)));
    T('근무 통계를 끄면 칩 없음',await p.evaluate(()=>{__wx.S.addons.stats=false;__wx.openDay('2026-10-14');return !document.querySelector('#sheet [data-act="ot-open"]');}));
    T('가족(근무표를 올린 사람)이 보낸 연장 → "근무 중 · 23:00 끝"',await p.evaluate(()=>{
      const m={kind:'sched',name:'아빠',sch:{pattern:['주'],anchor:'2026-10-01',types:[{k:'주',name:'주간',rest:false}],overrides:{},tm:{'주':['07:00','19:00']},ot:{'2026-10-12':['07:00','23:00']}}};
      const a=__wx.memberStatus(m,new Date(2026,9,12,10).getTime()),b2=__wx.memberStatus({...m,sch:{...m.sch,ot:{}}},new Date(2026,9,12,10).getTime());
      return a[1]==='근무 중'&&/23:00 끝/.test(a[2])&&/19:00 끝/.test(b2[2]);}));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 3) 근무 통계: 대근 세 갈래 · 시간 · 연차 · 무급 · 명세서로 맞춘 예상 월급 · 달 넘기기
    const types0=null;
    const st={...base,addons:{...base.addons,stats:true},overrides:{'2026-10-04':'주','2026-10-09':'야','2026-10-12':'주','2026-10-06':'휴','2026-10-10':'무'},
      salary:{fixed:2242566,close:0,night:['22:00','06:00'],ot:0,nt:0,leaveYear:15,slips:{'2026-10':{ot:420000,nt:315000,lv:222018,lvd:2,tot:3100000}}}};
    const p=await boot(b,st);
    await p.evaluate(()=>{const S=__wx.S;if(!S.types.some(t=>t.k==='무'))S.types.push({k:'무',name:'무급',color:'',rest:true,unpaid:true});__wx.save();});
    const c=await p.evaluate(()=>{const o=__wx.statsCalc(2026,9);return {days:o.days,work:o.work,ot:o.ot,night:o.night,ns:o.nightShifts,dw:o.dw,de:o.de,dh:o.dh,vac:o.vac,unpaid:o.unpaid,hol:o.holWork};});
    T('대근 세 갈래: 평일 10/12 · 주말 10/4 · 명절·공휴일 10/9',JSON.stringify([c.dw,c.de,c.dh])==='[["2026-10-12"],["2026-10-04"],["2026-10-09"]]',JSON.stringify(c));
    T('연차 10/6 · 무급 10/10 · 휴일 출근(개천절 야간)',JSON.stringify(c.vac)==='["2026-10-06"]'&&JSON.stringify(c.unpaid)==='["2026-10-10"]'&&c.hol.includes('2026-10-03'));
    T('시간: 근무 17일 187시간 · 연장 75 · 야간 63 · 야간 근무 9번',c.days===17&&c.work===187&&c.ot===75&&c.night===63&&c.ns===9,JSON.stringify(c));
    const R=await p.evaluate(()=>__wx.payRates());
    T('명세서로 1시간 금액: 연장 5,600 · 야간 5,000 · 연차 1일 111,009',R.ot===5600&&R.nt===5000&&Math.round(R.lvDay)===111009&&R.slip,JSON.stringify(R));
    await p.evaluate(()=>{__wx.stYM=[2026,9];__wx.openStatsPage();});await p.waitForTimeout(200);
    const txt=await p.evaluate(()=>document.querySelector('#page').innerText);
    const exp=Math.round(2242566+5600*75+5000*63+111009-2242566/31).toLocaleString('ko-KR');
    T('예상 월급(세전 · 대략) = 고정 + 연장 + 야간 + 연차수당(1일 덜) − 무급',txt.includes('예상 월급')&&txt.includes(exp+'원'),exp+' | '+txt.slice(0,400));
    T('실제(명세서)와 차이',/실제 \(명세서\)/.test(txt)&&/차이/.test(txt));
    T('연차 남은 날 (15 − 올해 쓴 날)',/연차 · 남은 14일/.test(txt),txt.match(/연차[^\n]*/)+'');
    await p.click('#page [data-act="st-list"][data-l="de"]');await p.waitForTimeout(150);
    T('숫자 누르면 날짜 목록 (10월 4일 일)',await p.evaluate(()=>/10월 4일 \(일\)/.test(document.querySelector('#pop').textContent)));
    await p.evaluate(()=>document.querySelector('#pop [data-act="pop-close"]').click());
    await p.click('#page [data-act="st-prev"]');await p.waitForTimeout(150);
    T('‹ 달 넘기기 → 9월',await p.evaluate(()=>/2026년 9월/.test(document.querySelector('#page .stnav').textContent)));
    await chg(p,'payClose','20');await p.waitForTimeout(150);
    T('급여 마감일 20일 → 기간 8/21 ~ 9/20',await p.evaluate(()=>__wx.S.salary.close===20&&/8\/21 ~ 9\/20/.test(document.querySelector('#page').textContent)));
    await p.evaluate(()=>__wx.openSlipPage('2026-09'));await p.waitForTimeout(150);
    await chg(p,'slOt','300000');await p.waitForTimeout(150);
    T('명세서 페이지: 9월 연장 금액 저장',await p.evaluate(()=>__wx.S.salary.slips['2026-09'].ot===300000&&/명세서 기간/.test(document.querySelector('#page').textContent)));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
    const q=await boot(b,{...base,addons:{...base.addons,stats:true}});
    await q.evaluate(()=>__wx.openStatsPage());await q.waitForTimeout(150);
    T('월급을 안 적으면 예상 월급 줄 없음 (안내 한 줄만)',await q.evaluate(()=>!/예상 월급 \(/.test(document.querySelector('#page').innerText)&&/예상 월급도 볼까요/.test(document.querySelector('#page').innerText)));
    T('오류 없음 (빈 월급)',q.errs.length===0,q.errs.join('|'));await q.close();
  }
  { // 4) 날씨: 팝업 줄 → 네이버 날씨 · 지난 날짜 관측 한 줄
    const st={...base,addons:{...base.addons,wx:true},wx:{home:'4111160000',work:'41597',fw:{},nm:{'4111160000':'연무동'}}};
    const p=await boot(b,st,{cfg,routes});
    await p.evaluate(()=>{window.__urls=[];window.AndroidBridge.openUrl=u=>window.__urls.push(u);});
    await p.waitForTimeout(2800);
    await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(300);
    await p.click('#wxDay');await p.waitForTimeout(200);
    T('팝업 출근 · 퇴근 줄에 › (누를 수 있음)',await p.evaluate(()=>document.querySelectorAll('#pop .wxr[data-act="wx-web"]').length===2));
    await p.click('#pop .wxr[data-act="wx-web"] >> nth=1');await p.waitForTimeout(200);
    const u=await p.evaluate(()=>window.__urls[0]||'');
    T('퇴근 줄 → 직장(화성시 동탄구) 네이버 날씨',u.startsWith('https://m.search.naver.com/search.naver?query=')&&decodeURIComponent(u).includes('경기 화성시 동탄구 날씨'),u);
    await p.evaluate(()=>{__wx.closeSheet();__wx.openDay('2026-10-14');});await p.waitForTimeout(250);await p.click('#wxDay');await p.waitForTimeout(150);
    await p.click('#pop .wxr[data-act="wx-web"] >> nth=0');await p.waitForTimeout(150);
    T('출근 줄 → 집(수원시 장안구 연무동)',decodeURIComponent(await p.evaluate(()=>window.__urls[1]||'')).includes('경기 수원시 장안구 연무동 날씨'));
    await p.evaluate(()=>{__wx.closeSheet();__wx.openDay('2026-10-05');});await p.waitForTimeout(900);
    const l=await p.evaluate(()=>{const e=document.getElementById('wxDay');return e?e.textContent:'';});
    T('지난 날짜: 실제 관측 한 줄 (☔ 6°~12° · 비 9mm · 관측 · 서울)',/6°~12° · 비 9mm/.test(l)&&/관측 · 서울/.test(l),l);
    await p.evaluate(()=>__wx.openDay('2026-10-07'));await p.waitForTimeout(250);
    T('비 안 온 날: 🌡 3°~15°',/🌡\s*3°~15°/.test(await p.evaluate(()=>document.getElementById('wxDay').textContent)));
    T('지난 관측은 폰에 저장 (그 달 한 번만 받음)',await p.evaluate(()=>!!JSON.parse(localStorage.getItem('eonjeswieo:wxp')||'{}')['4111160000_202610']));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  { // 5) 처음 설치: 패턴 확인 화면 맨 아래 "근무 시간 (선택)" → 정하면 "준비 끝!" 에서 날씨 받기가 맨 위
    const p=await boot(b,null,{cfg,routes});
    const ob=(a,x='')=>p.click(`#onboard [data-act="${a}"]${x}`);
    await ob('ob-mine');await ob('ob-way','[data-v="custom"]');await p.waitForTimeout(150);
    await ob('ob-len','[data-v="6"][data-m="set"]');await ob('ob-next');await p.waitForTimeout(150);
    await p.fill('#onboard [data-obn="w0"]','D');await p.fill('#onboard [data-obn="w1"]','N');await p.fill('#onboard [data-obn="r"]','쉼');
    await ob('ob-next');await p.waitForTimeout(150);
    await ob('ob-brush','[data-k="D"]');await ob('ob-cell','[data-i="0"]');await ob('ob-cell','[data-i="1"]');
    await ob('ob-brush','[data-k="N"]');await ob('ob-cell','[data-i="2"]');await ob('ob-cell','[data-i="3"]');
    await ob('ob-next');await p.waitForTimeout(150);await ob('ob-pos','[data-v="2"]');await ob('ob-next');await p.waitForTimeout(150);
    T('처음 설치 패턴 확인: 🕐 근무 시간 (선택) + 설명 (접힘)',await p.evaluate(()=>/근무 시간/.test(document.querySelector('#onboard .obtm').textContent)&&/출퇴근 날씨도 알려줘요/.test(document.querySelector('#onboard .obtm').textContent)&&!document.getElementById('obTmS_0')));
    await ob('obtm-tog');await p.waitForTimeout(150);
    T('펼치면 D · N 두 줄 (쉼 빠짐)',await p.evaluate(()=>!!document.getElementById('obTmS_1')&&!document.getElementById('obTmS_2')));
    await chg(p,'obTmS_1','20:00');await chg(p,'obTmE_1','08:00');await p.waitForTimeout(150);
    await ob('ob-next');await p.waitForTimeout(150);await ob('ob-finish','[data-v="0"]');await p.waitForTimeout(250);
    T('정한 시간 저장 (N 20:00 → 08:00)',await p.evaluate(()=>{const t=__wx.S.shiftTimes&&__wx.S.shiftTimes.N;return !!t&&t.start==='20:00'&&t.end==='08:00';}));
    T('준비 끝!: 출퇴근 날씨 받기가 맨 위',await p.evaluate(()=>{const c=document.querySelector('#onboard .choice');return !!c&&c.dataset.act==='ob-wx';}));
    T('오류 없음 (처음 설치)',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();

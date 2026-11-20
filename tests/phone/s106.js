// v0.234: 근무 시간 기본값을 진짜로 저장 · 시작이나 끝 하나만 바꿔도 다시 켤 때 안 지워짐 · 다크모드 포스트잇 제목 보임
const {chromium,boot,mkT,base}=require('./lib.js');
const types=[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'대근',name:'대근',color:'#ffd9e4',rest:false},{k:'휴',name:'휴무',color:'',rest:true}];
(async()=>{const T=mkT();const b=await chromium.launch();
  let p=await boot(b,{...base,types,shiftTimes:{'대근':{start:'08:00',end:'20:00'}}});await p.waitForTimeout(300);
  const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).shiftTimes);
  T('켜면 시간 없는 근무에 기본 시간 저장 (주간 07~19 · 야간 19~07) · 정해 둔 대근 · 쉬는 날은 그대로',st['주'].start==='07:00'&&st['주'].end==='19:00'&&st['야'].start==='19:00'&&st['대근'].start==='08:00'&&!st['휴'],JSON.stringify(st));
  // 시작만 바꾸기 → 다시 켜도 남음
  await p.evaluate(()=>{const i=document.createElement('input');i.id='ptS_0';i.value='06:30';document.body.appendChild(i);i.dispatchEvent(new Event('change',{bubbles:true}));i.remove();});await p.waitForTimeout(300);
  const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));await p.close();
  p=await boot(b,saved);const st2=await p.evaluate(()=>__wx.S.shiftTimes['주']);
  T('시작만 바꿔도 다시 켤 때 그대로 (06:30 → 19:00)',st2&&st2.start==='06:30'&&st2.end==='19:00',JSON.stringify(st2));
  T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  // 옛 데이터: 시작만 있던 것은 (예전처럼) 버려지고 기본값으로 다시 채움
  p=await boot(b,{...base,types,shiftTimes:{'주':{start:'06:30'}}});await p.waitForTimeout(300);
  const st3=await p.evaluate(()=>__wx.S.shiftTimes['주']);
  T('옛 데이터(시작만): 기본 시간으로 채워 켜짐',st3&&st3.start==='07:00'&&st3.end==='19:00',JSON.stringify(st3));await p.close();
  // 다크모드 포스트잇 제목
  p=await boot(b,{...base,theme:'dark',board:{'2026-10':[{id:'n1',type:'list',title:'장보기',lines:[{id:'l1',text:'우유',done:false}],text:'',shared:false,by:'host',color:'y',t:1,reacts:{},torn:false,repeat:false,dateAuto:false,date:''}]}});
  await p.evaluate(()=>{const b=document.createElement('button');b.dataset.act='open-board';document.body.appendChild(b);b.click();b.remove();});await p.waitForTimeout(700);
  await p.evaluate(()=>document.querySelector('.pi').click());await p.waitForTimeout(600);
  await p.evaluate(()=>document.querySelector('[data-act="pi-vedit"]').click());await p.waitForTimeout(700);
  const bg=await p.evaluate(()=>getComputedStyle(document.querySelector('#piTitle')).backgroundColor);
  T('다크모드: 포스트잇 제목 칸 바탕 투명 (종이색 위 진한 글자)',/rgba\(0, 0, 0, 0\)|transparent/.test(bg),bg);
  T('오류 없음 (다크)',p.errs.length===0,p.errs.join('|'));await p.close();
  await b.close();T.sum();
})();

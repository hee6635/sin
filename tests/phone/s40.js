const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T=mkT();
 const k='2026-10-14';
 const st={...base,
  stamps:{defs:[{id:'zz1',kind:'mark',emoji:'👟',name:'걷기',times:2,rep:'daily',days:[],dates:[],skip:[],ats:[]},{id:'pl',kind:'pill',emoji:'💊',name:'약',times:3,color:'#ef4d5a',shape:'drop',rep:'daily',days:[],dates:[],skip:[],ats:[]}],log:{},snap:{},v3:1,v4:1,lastAt:[]},
  memos:{[k]:[{id:'m1',text:'약국 가기',todo:true,shared:false,by:'host',t:1},{id:'m2',text:'그냥 메모',shared:false,by:'host',t:2},{id:'m4',text:'주소 https://example.com/a 보기',shared:false,by:'host',t:4},{id:'m3',text:'가족 할 일',shared:true,by:'host',todo:true,time:'09:00',color:'#e5484d',t:3}]},
  board:{'2026-10':[{id:'p1',type:'list',title:'장보기',lines:[{id:'l1',text:'우유',done:false,doneBy:''},{id:'l2',text:'빵',done:false,doneBy:''}],text:'',shared:false,by:'host',color:'y',repeat:false,dateAuto:true,date:k,reacts:{},torn:false,tornAt:0,t:1}]}};
 const p=await boot(b,st,{touch:true,w:384});
 const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
 // 1) 위젯 데이터에 스티커 id · 이름 / 메모 항목이 들어감
 await p.evaluate(()=>{window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(JSON.parse(j));});
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(200);
 await p.evaluate(()=>window.__refresh());await p.waitForTimeout(1000);
 const w=await p.evaluate(()=>window.__wg[window.__wg.length-1]);
 const day=w.days.find(x=>x.k===k);
 T('스티커 목록(sa)에 id · 이름 · 횟수',day&&day.sa.some(x=>x.id==='zz1'&&x.nm==='걷기'&&x.N===2),JSON.stringify(day&&day.sa));
 T('알약은 모양(h) · 횟수(N) · 색을 함께 보냄',day&&day.sa.some(x=>x.id==='pl'&&x.p===1&&x.h==='drop'&&x.N===3&&/^#[0-9a-f]{6}$/i.test(x.c)),JSON.stringify(day&&day.sa));
 T('내가 쓴 가족 메모의 할 일도 체크 칸(m) · 시간(tm) · 색(c) · 가족 표시(f)',day&&day.mi.some(x=>x.r==='m'&&x.id==='m3'&&x.tm==='오전 9:00'&&x.c==='#e5484d'&&x.f===1),JSON.stringify(day&&day.mi));
 T('주 시작 요일(ws) 전달',w.ws===0);
 T('메모 속 주소가 (주소 + "링크") 표시로 넘어감',day&&day.mi.some(x=>x.id==='m4'&&x.t==='주소 \u0001https://example.com/a\u0003링크\u0002 보기'),JSON.stringify(day&&day.mi.filter(x=>x.id==='m4')));
 T('메모 항목(mi): 메모 할 일(m) · 글만(t) · 포스트잇 줄(l)',day&&day.mi.some(x=>x.r==='m'&&x.id==='m1')&&day.mi.some(x=>x.r==='t'&&x.t==='그냥 메모')&&day.mi.filter(x=>x.r==='l').length===2,JSON.stringify(day&&day.mi));
 // 2) 위젯에서 체크한 대기 목록을 앱이 읽어서 반영 + 날짜 열기
 await p.evaluate(({k})=>{
  window.AndroidBridge.takeWidgetActions=()=>JSON.stringify([
   {t:'stk',k,id:'zz1',n:2},{t:'memo',k,id:'m1',d:true},{t:'line',k,pid:'p1',lid:'l2',d:true}]);
  window.AndroidBridge.takeOpenDate=()=>k;
  window.__widgetSync();
 },{k});
 await p.waitForTimeout(600);
 const s=await S();
 T('스티커 2/2 반영',s.stamps.log[k]&&s.stamps.log[k].zz1===2,JSON.stringify(s.stamps.log));
 T('메모 할 일 완료 반영',s.memos[k].find(x=>x.id==='m1').done===true);
 T('포스트잇 줄 완료 반영(다른 줄은 그대로)',s.board['2026-10'][0].lines.find(x=>x.id==='l2').done===true&&!s.board['2026-10'][0].lines.find(x=>x.id==='l1').done);
 T('[앱에서 열기] 날짜 창이 열림',await p.evaluate(({k})=>document.getElementById('sheet').classList.contains('open')&&document.getElementById('sheet').innerText.includes('14일'),{k}));
 // 3) 되돌리기: 취소 대기 목록
 await p.evaluate(({k})=>{window.AndroidBridge.takeWidgetActions=()=>JSON.stringify([{t:'stk',k,id:'zz1',n:0},{t:'memo',k,id:'m1',d:false}]);window.AndroidBridge.takeOpenDate=()=>'';window.__widgetSync();},{k});
 await p.waitForTimeout(400);
 const s2=await S();
 T('취소 반영(스티커 0 · 메모 할 일 미완료)',!(s2.stamps.log[k]&&s2.stamps.log[k].zz1)&&!s2.memos[k].find(x=>x.id==='m1').done);
 // 4) 이상한 값은 무시
 await p.evaluate(({k})=>{window.AndroidBridge.takeWidgetActions=()=>JSON.stringify([{t:'stk',k,id:'nope',n:1},{t:'memo',k,id:'m2',d:true},{t:'x'},null]);window.__widgetSync();},{k});
 await p.waitForTimeout(300);
 T('없는 스티커 · 할 일이 아닌 메모 · 이상한 항목은 무시',!(await S()).memos[k].find(x=>x.id==='m2').done&&p.errs.length===0,p.errs.join('|'));
 console.log(p.errs);T.sum();await b.close();})();

// v0.78: 한 달 위젯 모양 선택(칸 채우기 · 동그라미) · 위젯에 요청 링 · 가족 메모 구분 · 달력 요청 날짜 숫자 색 · 알약 높이 1.15배
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const t=+new Date('2026-10-11T10:00:00');
  const m=(id,text,sh)=>({id,text,shared:!!sh,by:'host',t});
  const reqs=[
    {id:'q1',date:'2026-10-13',want:'휴',msg:'',st:'accepted',reply:'',prev:null,t:t+6*36e5,tu:t+6*36e5,by:'guest'},
    {id:'q2',date:'2026-10-22',want:'휴',msg:'',st:'rejected',reply:'',prev:null,t,tu:t,by:'guest'},
    {id:'q3',date:'2026-10-23',want:'휴',msg:'',st:'pending',reply:'',prev:null,t,tu:t,by:'guest'},
    {id:'q4',date:'2026-10-16',want:'휴',msg:'',st:'pending',held:true,reply:'',prev:null,t,tu:t,by:'guest'},
    {id:'q5',date:'2026-10-24',want:'휴',msg:'',st:'rejected',reply:'',prev:null,t:t-5*864e5,tu:t-5*864e5,by:'guest'}];
  const memos={'2026-10-16':[m('a','10시 치과',0),m('b','11시 자동차 검사',1)],'2026-10-20':[m('c','054 의원',1),m('d','자기평가서',0),m('e','약 먹기',0)],'2026-10-21':[m('f','운동회',0)]};
  const cap=()=>{window.__wg=[];window.AndroidBridge.setWidgetData=j=>window.__wg.push(JSON.parse(j));};
  const last=p=>p.evaluate(()=>window.__wg[window.__wg.length-1]);
  const push=async p=>{await p.evaluate(cap);await p.click('#nav [data-tab="set"]');await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('[data-act="more-widget"]').click());await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('[data-act="wg-look"][data-v="'+(((JSON.parse(localStorage.getItem('eonjeswieo:v1')).widget||{}).look)==='circle'?'circle':'fill')+'"]').click());await p.waitForTimeout(1000);};
  const day=(w,k)=>w&&w.days.find(x=>x.k===k);

  // ── 기본: 칸 채우기 · 요청 링 · 가족 메모 수
  {
    const p=await boot(b,{...base,memos,requests:reqs},{touch:true});
    await push(p);
    const w=await last(p);
    T('위젯 모양 기본: 칸 채우기',!!w&&w.look==='fill',w&&w.look);
    T('요청 링 값(승인은 하루 안): 승인 ok · 거절 no · 답할 요청 ask · 보류 hold',day(w,'2026-10-13').rq==='ok'&&day(w,'2026-10-22').rq==='no'&&day(w,'2026-10-23').rq==='ask'&&day(w,'2026-10-16').rq==='hold',JSON.stringify(['13','22','23','16'].map(d=>day(w,'2026-10-'+d).rq)));
    T('3일 지난 답한 요청(10/24 거절)은 링이 없음 · 요청 없는 날도 없음',day(w,'2026-10-24').rq===undefined&&day(w,'2026-10-14').rq===undefined);
    T('메모 줄 맨 앞이 가족 메모: 10/16 는 가족 1개(11시 자동차 검사가 먼저)',day(w,'2026-10-16').nf===1&&day(w,'2026-10-16').ms[0]==='11시 자동차 검사'&&day(w,'2026-10-16').ms[1]==='10시 치과',JSON.stringify(day(w,'2026-10-16')));
    T('10/20 가족 1 · 개인 2 (nf=1) · 가족 메모 없는 10/21 은 nf 없음',day(w,'2026-10-20').nf===1&&day(w,'2026-10-21').nf===undefined);
    T('설정 › 홈 화면 위젯에 "한 달 위젯 모양" (칸 채우기 · 동그라미)',await p.evaluate(()=>!!document.querySelector('[data-act="wg-look"][data-v="fill"]')&&!!document.querySelector('[data-act="wg-look"][data-v="circle"]')&&/한 달 위젯 모양/.test(document.querySelector('#page').textContent)));
    T('칸 채우기가 켜져 있음(on)',await p.evaluate(()=>document.querySelector('[data-act="wg-look"][data-v="fill"]').classList.contains('on')));
    await p.evaluate(()=>{window.__wg.length=0;document.querySelector('[data-act="wg-look"][data-v="circle"]').click();});await p.waitForTimeout(1000);
    const w2=await last(p);
    T('동그라미를 고르면 저장되고 위젯 데이터가 다시 넘어감',!!w2&&w2.look==='circle'&&await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).widget.look==='circle'),w2&&w2.look);
    T('동그라미가 on 으로 바뀜',await p.evaluate(()=>document.querySelector('[data-act="wg-look"][data-v="circle"]').classList.contains('on')));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 옛 저장 데이터(위젯 모양 값 없음) · 이상한 값
  for(const [nm,wgt] of [['옛 데이터(모양 값 없음)',{theme:'system',alpha:100}],['이상한 값',{theme:'system',alpha:100,look:'weird'}],['동그라미 저장됨',{theme:'system',alpha:100,look:'circle'}]]){
    const p=await boot(b,{...base,widget:wgt},{touch:true});
    await push(p);
    const w=await last(p);
    T(`${nm} → ${nm==='동그라미 저장됨'?'동그라미':'칸 채우기'}`,!!w&&w.look===(nm==='동그라미 저장됨'?'circle':'fill'),w&&w.look);
    T(`${nm}: 오류 없음`,p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 앱 달력: 요청 있는 날 숫자는 일반 색 (링만)
  {
    const p=await boot(b,{...base,memos,requests:reqs},{touch:true});
    await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(300);
    const col=await p.evaluate(()=>{const g=k=>{const c=document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"] .dn .num`);return c?getComputedStyle(c).color:'';};return {no:g('2026-10-22'),ask:g('2026-10-23'),ok:g('2026-10-13'),plain:g('2026-10-21')};});
    T('거절 · 요청 · 승인 날짜 숫자가 일반 날짜와 같은 색(링만 표시)',col.no===col.plain&&col.ask===col.plain&&col.ok===col.plain&&col.plain!=='',JSON.stringify(col));
    T('거절 링은 그대로 있음',await p.evaluate(()=>!!document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-22"].rq-no')&&getComputedStyle(document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-22"] .badge')).boxShadow.includes('224')));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // ── 사진 스티커: 투명 PNG 는 투명 그대로 (검은 배경이 되지 않게) · 일반 사진은 예전처럼 JPEG
  {
    const mk=transparent=>{const c=document.createElement('canvas');c.width=c.height=200;const g=c.getContext('2d');if(!transparent){g.fillStyle='#3a7bd5';g.fillRect(0,0,200,200);}g.fillStyle='#f4b400';g.beginPath();g.arc(100,100,60,0,7);g.fill();return c.toDataURL(transparent?'image/png':'image/jpeg');};
    for(const [nm,tr,want] of [['투명 PNG',true,'png'],['일반 사진(JPEG)',false,'jpeg']]){
      const p=await boot(b,{...base},{touch:true});
      await p.evaluate(`(${mk.toString()})(${tr})`).then(u=>p.evaluate(u=>window.__onImage(u),u));
      await p.waitForTimeout(700);
      await p.evaluate(()=>document.querySelector('[data-act="crp-ok"]').click());await p.waitForTimeout(400);
      const ic=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eonjeswieo:v1'));return Object.values(s.icons||{});});
      T(`${nm}: 사진 스티커로 저장될 때 ${want.toUpperCase()}`,ic.length===1&&ic[0].startsWith('data:image/'+want),ic[0]&&ic[0].slice(0,24));
      if(tr){
        const alpha=await p.evaluate(u=>new Promise(r=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.drawImage(i,0,0);const px=g.getImageData(2,2,1,1).data;r(px[3]);};i.src=u;}),ic[0]);
        T('모서리(그림 바깥)는 투명 그대로(알파 0)',alpha===0,String(alpha));
      }
      T(`${nm}: 오류 없음`,p.errs.length===0,p.errs.join('|'));await p.close();
    }
  }
  // ── 달력 공유: 복사하기 (클립보드에만) · 공유하기
  {
    const p=await boot(b,{...base},{touch:true});
    await p.evaluate(()=>{window.__sc=[];window.AndroidBridge.shareScreen=()=>window.__sc.push('share');window.AndroidBridge.copyScreen=()=>window.__sc.push('copy');});
    await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
    await p.click('[data-act="more-share"]');await p.waitForTimeout(400);
    T('공유 줄에 취소 · 복사하기 · 공유하기 세 버튼',await p.evaluate(()=>['cancel-share','copy-share','do-share'].every(a=>!!document.querySelector('#share-action-bar [data-act="'+a+'"]'))));
    await p.click('[data-act="copy-share"]');await p.waitForTimeout(800);
    T('복사하기: 복사만 부르고 공유 창은 안 부름 · 공유 모드가 끝남',(await p.evaluate(()=>window.__sc)).join()==='copy'&&await p.evaluate(()=>!document.querySelector('#app').classList.contains('share-mode')),JSON.stringify(await p.evaluate(()=>window.__sc)));
    await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
    await p.click('[data-act="more-share"]');await p.waitForTimeout(400);
    await p.click('[data-act="do-share"]');await p.waitForTimeout(800);
    T('공유하기: 예전처럼 공유만 부름',(await p.evaluate(()=>window.__sc)).join()==='copy,share');
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  T.sum();await b.close();
})();

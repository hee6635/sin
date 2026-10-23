// 앱 달력: 메모가 줄 수보다 많으면 마지막 줄 끝에 "+n" 칩 (v0.71) — 위젯 칸과 같은 표시. 메모 줄을 먹지 않고 · 메모가 안 많으면 아무것도 안 붙음
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const memo=(k,n)=>Array.from({length:n},(_,i)=>({id:'m'+k+i,text:'메모 '+(i+1)+' 병원 예약 가기',shared:false}));
  const memos={'2026-10-13':memo('13',2),'2026-10-14':memo('14',3),'2026-10-15':memo('15',4),'2026-10-16':memo('16',6),'2026-10-20':memo('20',14),
    '2026-10-21':[{id:'f1',text:'가족 메모 하나',shared:true,by:'host'},...memo('21',4)]};
  const state=()=>({...base,memos,pattern:['주','야','휴','휴'],anchor:'2026-10-02'});
  const cell=k=>`.track .panel:nth-child(2) .cell[data-k="${k}"]`;
  const info=(p,k)=>p.evaluate(c=>{
    const e=document.querySelector(c);const pills=[...e.querySelectorAll('.pill-wrap>.pl')];const chip=e.querySelector('.pl .mc');
    const last=pills[pills.length-1];let geo=null;
    if(chip){const cr=chip.getBoundingClientRect(),pr=last.getBoundingClientRect(),tr=last.querySelector('.pt').getBoundingClientRect();
      geo={inPill:cr.left>=pr.left-0.5&&cr.right<=pr.right+0.5&&cr.top>=pr.top-0.5&&cr.bottom<=pr.bottom+0.5,gap:Math.round((cr.left-tr.right)*10)/10,w:Math.round(cr.width),h:Math.round(cr.height),ph:Math.round(pr.height)};}
    return {n:pills.length,chip:chip?chip.textContent:'',label:chip?chip.getAttribute('aria-label'):'',onLast:!!chip&&last.contains(chip),oldMore:!!e.querySelector('.pl.more'),chips:e.querySelectorAll('.mc').length,geo,
      texts:pills.map(x=>(x.querySelector('.pt')||x).textContent)};
  },cell(k));
  for(const [w,h,nm] of [[390,844,'폰'],[360,780,'좁은 폰'],[820,1100,'태블릿']]){
    const p=await boot(b,state(),{w,h,touch:true});
    const i13=await info(p,'2026-10-13'),i14=await info(p,'2026-10-14'),i15=await info(p,'2026-10-15'),i16=await info(p,'2026-10-16'),i20=await info(p,'2026-10-20'),i21=await info(p,'2026-10-21');
    const L=i16.n;   // 한 칸에 보이는 메모 줄 수 (메모 6개인 날이 꽉 찬 줄 수 · 폰 3 · 태블릿 4)
    console.log(nm,'줄 수',L,JSON.stringify([i13.n,i14.n,i15.n,i16.n]));
    T(`${nm}: 메모 2개 → 칩 없음`,i13.chips===0&&i13.n===2,JSON.stringify(i13));
    T(`${nm}: 메모가 줄 수와 같거나 적으면 칩 없음 (3개 · 줄 수 ${L})`,L>=3?i14.chips===0&&i14.n===3:i14.chips===1,JSON.stringify(i14));
    T(`${nm}: 메모 4개: 줄 수 안이면 칩 없음 · 넘으면 칩 "+n"`,L>=4?i15.chips===0&&i15.n===4:i15.chip==='+'+(4-L),JSON.stringify(i15));
    T(`${nm}: 메모 6개 → 보이는 줄은 줄 수만큼 · 칩 "+${6-L}" 이 마지막 줄 안에`,i16.n===L&&i16.chip==='+'+(6-L)&&i16.onLast&&i16.chips===1,JSON.stringify(i16));
    T(`${nm}: 예전 "+N" 줄(.pl.more)은 없어짐 · 메모 줄을 먹지 않음 (4개 메모 중 ${Math.min(L,4)}개 그대로 보임)`,!i16.oldMore&&i15.n===Math.min(L,4)&&i16.texts.length===L&&i16.texts.every(t=>t.includes('병원 예약')),JSON.stringify(i16.texts));
    T(`${nm}: 칩은 줄 안쪽 오른쪽 끝 · 메모 글자와 안 겹침 (글자 끝 ↔ 칩 간격 ≥ 0)`,!!i16.geo&&i16.geo.inPill&&i16.geo.gap>=-0.5,JSON.stringify(i16.geo));
    T(`${nm}: "+n" 이 줄 높이 안 · 폭은 줄 높이의 1.3배 안(알약 없이 작은 글자)`,!!i16.geo&&i16.geo.h<=i16.geo.ph&&i16.geo.w<=i16.geo.ph*1.3,JSON.stringify(i16.geo));
    T(`${nm}: 메모 14개 → "9+" · 화면 읽기용 이름 "메모 n개 더 있음"`,i20.chip==='9+'&&/^메모 \d+개 더 있음$/.test(i20.label)&&i20.label==='메모 '+(14-L)+'개 더 있음',JSON.stringify([i20.chip,i20.label]));
    T(`${nm}: 가족 메모 + 내 메모 섞여도 마지막 줄에 칩 하나`,i21.chips===1&&i21.n===L,JSON.stringify(i21));
    if(nm==='폰')await p.screenshot({path:'/tmp/s52_phone.png',clip:{x:0,y:90,width:w,height:480}});
    T(`${nm}: 오류 없음`,p.errs.length===0,p.errs.join('|'));
    await p.close();
  }
  // 어두운 모양에서도 칩이 보임 (배경과 글자 색이 달라야 함)
  {
    const p=await boot(b,{...state(),theme:'dark'},{touch:true});
    const c=await p.evaluate(()=>{const e=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-16"] .mc');const s=getComputedStyle(e);return [s.backgroundColor,s.color];});
    const lum=x=>{const m=x.match(/\d+/g).map(Number);return .2126*m[0]+.7152*m[1]+.0722*m[2];};
    T('어두운 모양: 칩 배경과 글자 밝기 차이가 큼',Math.abs(lum(c[0])-lum(c[1]))>80,JSON.stringify(c));
    await p.screenshot({path:'/tmp/s52_dark.png',clip:{x:0,y:90,width:390,height:480}});
    await p.close();
  }
  // 옛 데이터(메모 없음)로 켜지고 칩이 아예 없음
  {
    const p=await boot(b,{...base},{touch:true});
    T('메모가 없으면 칩이 하나도 없음 · 오류 없음',await p.evaluate(()=>!document.querySelector('.mc'))&&p.errs.length===0,p.errs.join('|'));
    await p.close();
  }
  T.sum();await b.close();
})();

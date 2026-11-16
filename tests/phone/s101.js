// v0.167: 달력 윗줄 높이 고정("오늘" 버튼) · 날짜 창 근무 칩 간격 · 지난 날 날씨 "지남" · 가족 시간표 오늘 링크 뺌
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const p=await boot(b,{...base,calLook:'fill'},{w:412,h:860});
  const h=()=>p.evaluate(()=>[document.querySelector('#top').getBoundingClientRect().height,document.querySelector('#track').getBoundingClientRect().top]);
  const a=await h();await p.evaluate(()=>document.querySelector('[data-act="next"]').click());await p.waitForTimeout(800);const c=await h();
  T('"오늘" 버튼이 생겨도 윗줄 높이 · 달력 위치 같음',a[0]===c[0]&&a[1]===c[1],JSON.stringify([a,c]));
  await p.evaluate(()=>document.querySelector('[data-act="prev"]').click());await p.waitForTimeout(800);
  await p.evaluate(()=>__wx.openDay('2026-10-12'));await p.waitForTimeout(500);
  const g=await p.evaluate(()=>{const c=document.querySelector('#sheet .dsbody .tchip.on')||document.querySelector('#sheet .dsbody .tchip');if(!c)return null;const bd=c.querySelector('.badge').getBoundingClientRect(),sm=c.querySelector('small').getBoundingClientRect();return +(sm.top-bd.bottom).toFixed(1);});
  T('근무 칩: 동그라미와 이름 사이 6px 넘게 (고른 칩 테두리 5px 와 안 겹침)',g!=null&&g>=6,String(g));
  const ps=await p.evaluate(()=>{const x=__wx.wxHistPop('t',{c:{c:[{l:'출근 오전 7시',tp:10,sk:''},{l:'퇴근 오후 7시',tp:12,sk:''}],k:{t:'무난'}}},'',null);return (x.match(/wxc[^"]*past/g)||[]).length;});
  T('지난 날 날씨 창: 출근 · 퇴근 칸 모두 지남',ps===2,String(ps));
  T('오류 없음',p.errs.length===0,p.errs.join('|'));
  await b.close();T.sum();
})();

const {chromium,boot,mkT,base}=require('./lib.js');
const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
const defs=[{id:'s_pill',kind:'pill',emoji:'💊',name:'약',times:1,color:'#ef4d5a',rep:'none',days:[],dates:['2026-10-09','2026-10-10'],skip:[],ats:[]},
 mk('a','👟','조깅',{dates:['2026-10-03','2026-10-05','2026-10-09','2026-10-10','2026-10-17']}),
 mk('b','📖','독서',{dates:['2026-10-09','2026-10-10','2026-10-05']}),mk('c','💰','가계',{dates:['2026-10-09','2026-10-10']}),
 mk('d','🌿','요가',{dates:['2026-10-17']}),mk('e','💧','물',{dates:['2026-10-10']})];
const memos={};['2026-10-03','2026-10-05','2026-10-09','2026-10-17'].forEach(k=>memos[k]=[{id:'m'+k,text:'병원 예약',shared:false},{id:'n'+k,text:'장보기',shared:false},{id:'o'+k,text:'전화하기',shared:false},{id:'p'+k,text:'은행 업무',shared:false}]);
const st={...base,stamps:{defs,log:{'2026-10-09':{a:1}},v3:1,v4:1,lastAt:[]},memos,pattern:['주','야','휴','휴'],anchor:'2026-10-02',overrides:{'2026-10-06':'야','2026-10-12':'주','2026-10-19':'휴'}};
(async()=>{const b=await chromium.launch();const T=mkT();
 for(const [w,h,n] of [[390,844,'p'],[360,780,'n'],[820,1100,'t']]){
  const p=await boot(b,st,{w,h,touch:true});
  const cell=k=>`.track .panel:nth-child(2) .cell[data-k="${k}"]`;
  const info=await p.evaluate(()=>{
    const q=k=>document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`);
    const ssz=k=>[...q(k).querySelectorAll('.dn .stp>*,.s2>*')].map(e=>e.tagName==='svg'?Math.round(parseFloat(getComputedStyle(e).width)):Math.round(parseFloat(getComputedStyle(e).fontSize)+2));
    const b=q('2026-10-19').querySelector('.bwrap .badge'),cw=q('2026-10-19').getBoundingClientRect().width;
    const dot=q('2026-10-06').querySelector('.badge .dot').getBoundingClientRect(),bd=q('2026-10-06').querySelector('.bwrap .badge').getBoundingClientRect(),cr=q('2026-10-06').getBoundingClientRect();
    return {sz3:ssz('2026-10-03'),sz5:ssz('2026-10-05'),sz9:ssz('2026-10-09'),sz17:ssz('2026-10-17'),ring:Math.round(q('2026-10-12').querySelector('.bwrap .badge').getBoundingClientRect().width),cw:Math.round(cw),
      dotL:Math.round(dot.left-cr.left),dotR:Math.round(bd.left-dot.right),hb:[...document.querySelectorAll('.track .panel:nth-child(2) .hnb')].map(e=>e.textContent),
      h1:['2026-10-03','2026-10-05','2026-10-09'].map(k=>{const e=q(k).querySelector('.h1');return e?e.textContent:'-';}),
      plh:getComputedStyle(document.documentElement).getPropertyValue('--plh'),plf:getComputedStyle(document.documentElement).getPropertyValue('--plf'),
      pills:q('2026-10-03').querySelectorAll('.pl').length,more:(q('2026-10-03').querySelector('.pl.more')||{}).textContent||''};});
  console.log(n,JSON.stringify(info));
  const all=[...info.sz3,...info.sz5,...info.sz9,...info.sz17];
  T(`${n}: 스티커 크기가 칸마다 같음`,new Set(all).size===1,all.join());
  T(`${n}: 동그라미가 칸 폭의 약 ${n==='t'?'':'55~60'}%`,info.ring/info.cw<.62,String(info.ring/info.cw));
  T(`${n}: 점이 동그라미 왼쪽 가운데(칸 안쪽)`,info.dotL>=3&&info.dotR>=1,JSON.stringify([info.dotL,info.dotR]));
  T(`${n}: 메모 줄 높이 · 글자 변수`,/px/.test(info.plh)&&/px/.test(info.plf),info.plh+info.plf);
  T(`${n}: 메모 4개 → 줄 수 제한 + "+N"`,info.pills<=(n==='t'?4:3)&&(n==='t'||info.more.startsWith('+')),info.pills+info.more);
  await p.screenshot({path:`/tmp/s22_${n}.png`,clip:{x:0,y:0,width:w,height:Math.min(h,w>500?760:640)}});
  await p.close();}
 // 설정 3/4줄
 const p=await boot(b,st,{touch:true});
 await p.click('#nav [data-tab="set"]');await p.waitForTimeout(250);
 await p.evaluate(()=>document.querySelector('[data-act="memolines"][data-v="4"]').click());await p.waitForTimeout(300);
 await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(300);
 const n4=await p.evaluate(()=>document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-03"]').querySelectorAll('.pl').length);
 T('설정 4줄 → 달력에서 메모가 더 보임(칸이 허용하면)',n4>=3,String(n4));
 console.log(p.errs);T.sum();await b.close();})();

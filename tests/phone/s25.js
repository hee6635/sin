const {chromium,boot,mkT,base}=require('./lib.js');
const mk=(id,e,n,x={})=>({id,kind:'mark',emoji:e,name:n,times:1,rep:'none',days:[],dates:[],skip:[],ats:[],...x});
const d4=['2026-10-03','2026-10-10','2026-10-17','2026-10-24'];
const defs=[mk('a','👟','조깅',{dates:d4}),mk('b','📖','독서',{dates:d4}),mk('c','💰','가계',{dates:d4}),mk('d','💪','운동',{dates:d4})];
const memos={};['2026-10-03','2026-10-09','2026-10-10','2026-10-13'].forEach(k=>memos[k]=[{id:'m'+k,text:'병원 예약',shared:false},{id:'n'+k,text:'장보기',shared:false},{id:'o'+k,text:'전화하기',shared:false},{id:'p'+k,text:'은행 업무',shared:false}]);
memos['2026-10-14']=[{id:'x1',text:'하나',shared:false}];
const st={...base,stamps:{defs,log:{},snap:{},v3:1,v4:1,lastAt:[]},memos,pattern:['주','야','휴','휴'],anchor:'2026-10-02',overrides:{'2026-10-10':'휴'}};
(async()=>{const b=await chromium.launch();const T=mkT();
 for(const [w,h,n] of [[390,844,'p'],[360,780,'n'],[412,892,'q'],[390,1000,'k'],[820,1100,'t']]){
  const p=await boot(b,st,{w,h,touch:true});
  const r=await p.evaluate(()=>{
    const q=k=>document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`);
    const m=k=>{const c=q(k),cr=c.getBoundingClientRect(),pl=[...c.querySelectorAll('.pill-wrap>*')].map(e=>e.getBoundingClientRect()),last=pl[pl.length-1];return {n:pl.length,gap:last?Math.round((cr.bottom-last.bottom)*10)/10:null,h:pl.map(x=>Math.round(x.height*10)/10)};};
    const rest=q('2026-10-10'),rr=rest.querySelector('.bwrap').getBoundingClientRect(),s2=rest.querySelector('.s2');
    const glyph=rest.querySelector('.bwrap .badge').getBoundingClientRect();
    return {full:m('2026-10-13'),one:m('2026-10-14'),stz:getComputedStyle(document.documentElement).getPropertyValue('--stz'),plh:getComputedStyle(document.documentElement).getPropertyValue('--plh'),
     bw:Math.round(rr.top-rest.getBoundingClientRect().top),s2b:s2?Math.round(s2.getBoundingClientRect().bottom-rest.getBoundingClientRect().top):null,badgeTop:Math.round(glyph.top-rest.getBoundingClientRect().top)};});
  console.log(n,JSON.stringify(r));
  T(`${n}: 메모가 꽉 차면 아래 여백(칸 테두리 포함) ≤ 3px (알약 높이를 줄인 뒤: k 는 11px)`,r.full.gap!==null&&r.full.gap<=(n==='k'?11:n==='t'?4.5:3),String(r.full.gap));
  T(`${n}: 메모 1개일 때 줄 높이가 꽉 찬 날과 비슷(±2px)`,Math.abs(r.one.h[0]-r.full.h[0])<=3,JSON.stringify([r.one.h,r.full.h]));
  await p.screenshot({path:`/tmp/s25_${n}.png`,clip:{x:0,y:130,width:w,height:340}});
  await p.close();}
 T.sum();await b.close();})();

const {chromium,boot,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();
 const mk=(e,i,x={})=>({id:'a'+i,kind:'mark',emoji:e,name:'스티커'+i,rep:'daily',from:'2026-09-01',times:1,ats:[],days:[],dates:[],skip:[],...x});
 const cases={'둘 다 매일':[mk('🧘',1),mk('🏃',2)],'하나는 공휴일 빼기':[mk('🧘',1),mk('🏃',2,{noHol:true})],'하나는 휴무 날만(근무 맞춤)':[mk('🧘',1),mk('🏃',2,{rep:'work',workMode:'rest'})]};
 for(const [n,defs] of Object.entries(cases)){
  const p=await boot(b,{...base,pattern:['주','야','휴','휴'],anchor:'2026-09-01',stamps:{defs,log:{},more:false,v3:1,lastAt:[]}},{touch:true});
  await p.evaluate(()=>document.querySelector('[data-act="prev"]').click());await p.waitForTimeout(500);
  const r=await p.evaluate(()=>['2026-09-24','2026-09-25','2026-09-26'].map(k=>{const c=document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`);return k.slice(8)+':'+c.querySelectorAll('.stp>*,.s2>*').length}).join(' '));
  console.log(n,'→ 추석 칸 스티커 수',r);}
 await b.close();})();

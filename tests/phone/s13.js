const {chromium,boot,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();
 const mk=(e,i,x={})=>({id:'a'+i,kind:'mark',emoji:e,name:'스티커'+i,rep:'daily',from:'2026-10-13',times:1,ats:[],days:[],dates:[],skip:[],...x});
 const defs=[mk('🧘',1),mk('🏃',2),mk('💧',3),mk('💪',4),mk('📖',5,{from:'2026-10-01',ats:['20:00']})];
 const p=await boot(b,{...base,stamps:{defs,log:{},more:true,v3:1,lastAt:[]}},{touch:true});
 const r=await p.evaluate(()=>({n:window.__rem.filter(x=>x.id.startsWith('a_a5_')).length,days:window.__rem.filter(x=>x.id.startsWith('a_a5_')).map(x=>x.date).slice(0,3)}));
 console.log('5번째 스티커 알림 수',JSON.stringify(r));
 const v=await p.evaluate(()=>['2026-10-10','2026-10-14'].map(k=>k+':'+[...document.querySelectorAll(`.track .panel:nth-child(2) .cell[data-k="${k}"] .stp>*,.track .panel:nth-child(2) .cell[data-k="${k}"] .s2>*`)].map(e=>e.dataset.sid).join(',')));
 console.log(v.join(' | '));await b.close();})();

const {chromium,boot,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();
 const mk=(e,i)=>({id:'a'+i,kind:'mark',emoji:e,name:'x'+i,rep:'daily',from:'2026-09-01',times:1,ats:[],days:[],dates:[],skip:[]});
 for(const [w,more] of [[360,false],[412,false],[360,true]]){
 const p=await boot(b,{...base,stamps:{defs:[mk('🧘',1),mk('🏃',2),mk('💧',3),mk('💪',4)],log:{},more,v3:1,lastAt:[]}},{touch:true,w});
 await p.evaluate(()=>{});
 // 9월로 이동
 await p.evaluate(()=>document.querySelector('[data-act="prev"]').click());await p.waitForTimeout(600);
 await p.screenshot({path:`h_${w}_${more?4:2}.png`,clip:{x:0,y:230,width:w,height:230}});
 const r=await p.evaluate(()=>['2026-09-25','2026-10-03'].map(k=>{const c=document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`);return k+' stp='+c.querySelectorAll('.stp>*').length+' s2='+c.querySelectorAll('.s2>*').length+' vis='+[...c.querySelectorAll('.stp>*,.s2>*')].map(e=>{const r=e.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)}).join(',')}));
 console.log(w,more,r.join(' | '));}
 await b.close();})();

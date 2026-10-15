const {chromium,boot,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();
 const mk=(e,i)=>({id:'a'+i,kind:'mark',emoji:e,name:'x'+i,rep:'daily',from:'2026-10-01',times:1,ats:[],days:[],dates:[],skip:[]});
 for(const w of [360,412,600]){
 const p=await boot(b,{...base,stamps:{defs:[mk('🧘',1),mk('⚖️',2),mk('🎯',3),mk('🧴',4)],log:{},more:true,v3:1,lastAt:[]}},{touch:true,w});
 const r=await p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-16"]'),a=c.getBoundingClientRect();
  return [...c.querySelectorAll('.stp>*,.s2>*')].map(e=>{const q=e.getBoundingClientRect();return `top${(q.top-a.top).toFixed(1)} h${q.height.toFixed(1)}`}).join(' | ')+' dnH='+c.querySelector('.dn').getBoundingClientRect().height});
 console.log(w,r);
 await p.screenshot({path:`k_${w}.png`,clip:{x:0,y:300,width:Math.min(w,500),height:150}});}
 await b.close();})();

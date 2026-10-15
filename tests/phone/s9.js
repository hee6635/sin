const {chromium,boot,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();
 const mk=(e)=>({id:'a'+e,kind:'mark',emoji:e,name:'x',rep:'daily',from:'2026-10-01',times:1,ats:[],days:[],dates:[],skip:[]});
 for(const w of [360,412]){
 const p=await boot(b,{...base,stamps:{defs:[mk('🧘')],log:{'2026-10-13':{'a🧘':1}},more:false,v3:1,lastAt:[]}},{touch:true,w});
 await p.screenshot({path:`g_${w}.png`,clip:{x:0,y:200,width:w,height:140}});
 const r=await p.evaluate(()=>{const c=document.querySelector('.track .panel:nth-child(2) .cell[data-k="2026-10-13"]'),s=c.querySelector('.stp>*');const a=c.getBoundingClientRect(),q=s.getBoundingClientRect();return {cellTop:a.top,stTop:q.top,stBottom:q.bottom,cls:c.querySelector('.stp').className,w:q.width}});
 console.log(w,JSON.stringify(r));}
 await b.close();})();

// v0.121 날씨 팝업(날짜마다 높이가 다름)을 옆으로 밀 때 높이도 미리 맞춤 · 날짜 창(전체 화면)은 그대로
const {chromium,boot,mkT,base}=require('./lib.js');
const KST=(y,mo,d,h,mi=0)=>Date.UTC(y,mo-1,d,h-9,mi);const p2=n=>String(n).padStart(2,'0');
(async()=>{const b=await chromium.launch();const T=mkT();
  const mk=r=>{const h={};for(let d=11;d<=20;d++)for(let x=0;x<24;x++){const rain=d===15&&x>12;h[`202610${p2(d)}${p2(x)}`]=[12,rain?80:10,rain?1:0,rain?4:1,rain?2:0,2,50];}return {v:1,r,n:'',s:{b:'202610120500',h,n:{}},m:{b:'',d:{}},a:{b:'',d:{}},q:null};};
  const cfg="window.FIREBASE_CONFIG={projectId:'demo-wx',apiKey:'x',authDomain:'x',appId:'x'};";
  const routes=[['https://asia-northeast3-demo-wx.cloudfunctions.net/wx**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({list:[mk('41111'),mk('41113')]})})]];
  const p=await boot(b,{...base,addons:{...base.addons,wx:true},wx:{home:'41111',work:'41113',fw:{},nm:{}}},{tz:'Asia/Seoul',T:KST(2026,10,14,10),cfg,routes,touch:true,fold:true});
  await p.waitForTimeout(2500);
  const res=[];
  for(const [from,dir] of [['2026-10-14',1],['2026-10-15',1],['2026-10-16',-1]]){
  await p.evaluate(k=>{__wx.closePop&&__wx.closePop();},from);await p.waitForTimeout(200);
  await p.evaluate(k=>__wx.wxOpenDay?__wx.wxOpenDay(k):null,from);await p.waitForTimeout(500);
  const r=await p.evaluate(async(dir)=>{
    const m=document.querySelector('#pop .menu.wxdpop');if(!m)return 'nopop';const H=()=>Math.round(m.getBoundingClientRect().height);
    const h0=H();document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
    const bx=m.getBoundingClientRect(),x=bx.left+bx.width/2,y=bx.top+50,t=document.elementFromPoint(x,y);
    const ev=(ty,xx)=>t.dispatchEvent(new PointerEvent(ty,{bubbles:true,clientX:xx,clientY:y,pointerId:3}));
    ev('pointerdown',x);for(let i=1;i<=9;i++)ev('pointermove',x-dir*150*i/9);const mid=H();ev('pointerup',x-dir*150);
    const w=ms=>new Promise(r=>setTimeout(r,ms));await w(285);const pre=H();await w(60);const m2=document.querySelector('#pop .menu');const post=Math.round(m2.getBoundingClientRect().height);
    return {h0,mid,pre,post};},dir);
  T(`${from} → ${dir>0?'다음날':'전날'}: 미는 동안 높이가 바뀌고 · 도착 높이 = 다시 그린 높이`,r.h0!==r.pre&&r.mid!==r.h0&&Math.abs(r.pre-r.post)<=2,JSON.stringify(r));}
  T('오류 없음',p.errs.length===0,p.errs.join('|'));T.sum();await b.close();})();

// v0.150 → v0.176: 이미 쓰는 스티커를 다른 날 붙이면 지금 값으로 시작 · 복사본 없이 같은 스티커에 날짜를 더함
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const pill={id:'o_p2',one:true,kind:'pill',emoji:'💊',name:'약',color:'#ef4d5a',shape:'caps',times:2,rep:'none',days:[],dates:['2026-11-10'],skip:[],ats:[]};
  const p=await boot(b,{...base,stamps:{defs:[pill],log:{'2026-11-10':{o_p2:2}}}});
  await p.waitForTimeout(800);
  const d0=await p.evaluate(()=>{const o=__wx.S.stamps.defs.find(x=>x.id==='o_p2');return {d:o.dates,n:__wx.S.stamps.defs.length};});
  const r1=await p.evaluate(()=>{__wx.openStampReg('2026-11-12','o_p2');return __wx.stDraft&&__wx.stDraft.times;});
  T('v0.176 이미 쓰는 2번 약을 다른 날 붙이면 지금 값(2번)으로 시작',r1===2,String(r1));
  const r2=await p.evaluate(()=>{__wx.stampRegSave();const d=__wx.S.stamps.defs;const o=d.find(x=>x.id==='o_p2');return {old:o.times,oldDates:o.dates,cnt:d.length};});
  T('저장: 복사본 없이 같은 약에 11/12 더함 (2번 그대로)',r2.old===2&&r2.oldDates.join()===d0.d.concat('2026-11-12').join()&&r2.cnt===d0.n,JSON.stringify(r2));
  const r5=await p.evaluate(()=>{const S=__wx.S;S.stamps.defs.push({id:'o_bk',one:true,kind:'mark',emoji:'📖',name:'독서',times:1,rep:'none',days:[],dates:['2026-11-03'],skip:[],ats:['21:00']});
    __wx.openStampReg('2026-11-18','o_bk');const d=__wx.stDraft,al=d.alarm;__wx.stampRegSave();
    const o=S.stamps.defs.find(x=>x.id==='o_bk'),n=S.stamps.defs.filter(x=>x.id!=='o_bk'&&(x.dates||[]).includes('2026-11-18')).length;return {al,oAts:o.ats,oDates:o.dates,n};});
  T('알림 켠 독서를 다른 날 붙이면 알림 켜진 채 시작 · 같은 스티커에 날짜 더함',r5.al===true&&r5.oAts.join()==='21:00'&&r5.oDates.includes('2026-11-18')&&r5.n===0,JSON.stringify(r5));
  T('오류 없음',p.errs.length===0,p.errs.join('|'));
  await b.close();T.sum();
})();

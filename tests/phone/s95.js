// v0.150: 스티커 새로 붙일 땐 횟수 1번부터 · 다르게 고르면 그 날만 따로 (지난 날 · 반복은 그대로)
const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const pill={id:'o_p2',one:true,kind:'pill',emoji:'💊',name:'약',color:'#ef4d5a',shape:'caps',times:2,rep:'none',days:[],dates:['2026-11-10'],skip:[],ats:[]};
  const p=await boot(b,{...base,stamps:{defs:[pill],log:{'2026-11-10':{o_p2:2}}}});
  await p.waitForTimeout(800);
  const d0=await p.evaluate(()=>{const o=__wx.S.stamps.defs.find(x=>x.id==='o_p2');return {d:o.dates,n:__wx.S.stamps.defs.length};});
  const r1=await p.evaluate(()=>{__wx.openStampReg('2026-11-12','o_p2');return __wx.stDraft&&__wx.stDraft.times;});
  T('이미 2번인 약을 다른 날 붙이면 기본 1번',r1===1,String(r1));
  const r2=await p.evaluate(()=>{__wx.stampRegSave();const d=__wx.S.stamps.defs;const o=d.find(x=>x.id==='o_p2');const n=d.find(x=>x.id!=='o_p2'&&x.kind==='pill'&&(x.dates||[]).includes('2026-11-12'));return {old:o.times,oldDates:o.dates,n:n&&n.times,cnt:d.length};});
  T('저장: 옛 약은 2번 · 11/10 그대로, 11/12 는 1번짜리 따로',r2.old===2&&r2.oldDates.join()===d0.d.join()&&r2.n===1&&r2.cnt===d0.n+1,JSON.stringify(r2));
  const r3=await p.evaluate(()=>{const n=__wx.S.stamps.defs.find(x=>x.id!=='o_p2'&&x.kind==='pill'&&(x.dates||[]).includes('2026-11-12'));__wx.openStampReg('2026-11-14',n.id);const t=__wx.stDraft.times;__wx.stampRegSave();return {t,cnt:__wx.S.stamps.defs.length,d:n.dates};});
  T('1번짜리를 다시 붙이면 같은 스티커 다시 씀',r3.t===1&&r3.cnt===d0.n+1&&r3.d.includes('2026-11-14'),JSON.stringify(r3));
  const r4=await p.evaluate(()=>{const s=__wx.S.stamps.defs.find(x=>x.id==='o_p2');__wx.openStampReg('2026-11-20','o_p2','stamps');const e=__wx.stDraft.times;__wx.closePage();return e;});
  T('스티커 목록에서 고치기는 원래 횟수 2',r4===2,String(r4));
  T('오류 없음',p.errs.length===0,p.errs.join('|'));
  await b.close();T.sum();
})();

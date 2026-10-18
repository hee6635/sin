// 깨진 저장 값 시험: 저장 칸마다 이상한 값을 넣어도 (1) 첫 화면(달력 칸)이 뜨고 (2) 오류가 없고 (3) 나머지 데이터는 남아야 함
const {chromium,boot,rich,exercise}=require('./x_common.js');
const {mkT}=require('./lib.js');
const base=rich();
const MUTS=[['null',null],['"x"','x'],['0',0],['[]',[]],['{}',{}]];
const cases=[];
// 맨 위 칸 전부 × 이상한 값
for(const k of Object.keys(base))for(const [mn,mv] of MUTS){const s=JSON.parse(JSON.stringify(base));if(mv===undefined)delete s[k];else s[k]=mv;cases.push({name:k+' = '+mn,k,s});}
// 안쪽 칸 (예전에 화면이 안 뜨거나 한 탭이 망가졌던 것들)
const setAt=(s,path,v)=>{let o=s;for(let i=0;i<path.length-1;i++)o=o[path[i]];o[path[path.length-1]]=v;};
const NEST=[['alarms',0],['alarms',0,'time'],['requests',0],['events',0],['board','2026-10',0],['board','2026-10',0,'lines'],['board','2026-10',1],['fam2','members',0],['fam2','scheds','mom','types'],['fam2','scheds','mom','overrides'],['fam2','scheds','mom','pattern'],['fam2','scheds','mom','sdefs'],['fam2','scheds','mom'],['fam2','memos','mm1'],['fam2','memos','mm1','date'],['fam2','memos','mm1','by'],['fam2','reqIn','rq1'],['fam2','reqIn','rq1','date'],['fam2','reqIn','rq1','st'],['fam2','reqCc'],['fam2','me'],['stamps','defs'],['stamps','defs',0],['stamps','log'],['stamps','log','2026-10-14'],['stamps','snap'],['family',0],['family',0,'days'],['family',0,'vac'],['companyHols',0],['companyHols',0,'date'],['companyHols',0,'rem'],['types',0],['types',0,'k'],['types',0,'color'],['pers',0],['memos','2026-10-14'],['memos','2026-10-14',0],['memos','2026-10-14',0,'text'],['shiftTimes','주'],['status','labels'],['icons','ic1'],['patOld',0],['myEmo',0]];
for(const p of NEST)for(const [mn,mv] of [['null',null],['"x"','x'],['{}',{}]]){const s=JSON.parse(JSON.stringify(base));try{setAt(s,p,mv);}catch(e){continue;}cases.push({name:p.join('.')+' = '+mn,k:p.join('.'),s});}
// 저장 문자열 자체가 깨진 경우
const RAW=[['잘린 JSON',JSON.stringify(base).slice(0,400)],['빈 문자열',''],['[]','[]'],['null','null'],['숫자','12345'],['글자','"x"']];
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const results=[];let idx=0;
  const INFRA=/Target page, context or browser has been closed|Failed to create browser context|Timeout .* exceeded/;
  const run=async c=>{
    let p;
    try{
      p=await boot(b,c.s!==undefined?c.s:null,{wait:420});
      const bootErrs=p.errs.filter(e=>!/ERR_FILE_NOT_FOUND/.test(e));
      const ex=await exercise(p,{deep:false});
      const info=await p.evaluate(()=>({cells:document.querySelectorAll('.cell').length,onboard:document.getElementById('onboard').classList.contains('open'),crash:!!document.getElementById('crashBox')}));
      return {name:c.name,bootErrs,ex,...info};
    }catch(e){return {name:c.name,fatal:String(e.message).split('\n')[0]};}
    finally{try{await p.ctx.close();}catch(e){}}
  };
  async function worker(){while(true){const i=idx++;if(i>=cases.length)return;results.push(await run(cases[i]));}}
  await Promise.all(Array.from({length:4},worker));
  // 시험 도구 쪽 문제(브라우저가 닫힘 등)로 실패한 것은 한 줄씩 다시
  for(let i=0;i<results.length;i++){if(results[i].fatal&&INFRA.test(results[i].fatal)){const c=cases.find(x=>x.name===results[i].name);results[i]=await run(c);}}
  const bad=results.filter(x=>x.fatal||(x.bootErrs&&x.bootErrs.length)||(x.ex&&x.ex.length)||x.crash||(x.cells===0&&!x.onboard));
  bad.slice(0,40).forEach(x=>console.log('  BAD',x.name,'::',(x.fatal||(x.bootErrs&&x.bootErrs[0])||(x.ex&&x.ex[0])||(x.crash?'CRASH-SCREEN':'NO-CELLS')).slice(0,140)));
  T(`깨진 값 ${results.length}가지: 화면이 뜨고 오류 없음`,bad.length===0,bad.length+'건 문제');
  // 저장 문자열이 깨진 경우: 새로 시작하되 원본은 남겨 둠
  for(const [n,raw] of RAW){
    const p=await boot(b,raw,{wait:600});
    const o=await p.evaluate(()=>({cells:document.querySelectorAll('.cell').length,onb:document.getElementById('onboard').classList.contains('open'),bad:localStorage.getItem('eonjeswieo:v1:bad')}));
    T(`저장 문자열이 깨짐(${n}): 앱이 뜸`,o.cells>0||o.onb,JSON.stringify({c:o.cells,onb:o.onb}));
    if(n==='잘린 JSON')T('깨진 원본을 지우지 않고 따로 남겨 둠',!!o.bad&&o.bad.length>100,String(o.bad).slice(0,40));
    await p.ctx.close();
  }
  await b.close();T.sum();
})();

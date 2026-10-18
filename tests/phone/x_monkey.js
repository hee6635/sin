// Monkey/crawler: random walk over [data-act] elements, collecting page errors and XSS probe hits.
const DENY=/^(wipe|wipe-all|exit-ok|backup-import|backup-export|drive-unlink|link-dissolve|fam-dissolve|link-leave|lnk-go|nativefix|nativeset|open-settings|share|share-screen|fb-out|fb-test|ico-add|crp-ok|crp-again)/;
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

async function monkey(p,{seed=1,steps=200,pre=[],deny=DENY}={}){
  const R=rng(seed);const trail=[];const errsAt=[];
  const run=async(js,arg)=>p.evaluate(js,arg);
  for(const fn of pre){try{await fn(p);}catch(e){}}
  for(let i=0;i<steps;i++){
    const n0=p.errs.length;
    const pick=await p.evaluate(([r,r2,deny])=>{
      const re=new RegExp(deny);
      const els=[...document.querySelectorAll('[data-act]')].filter(e=>{
        const a=e.getAttribute('data-act');if(re.test(a))return false;
        if(e.disabled)return false;
        const r=e.getBoundingClientRect();if(r.width<=0||r.height<=0)return false;
        const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none'||cs.pointerEvents==='none')return false;
        return true;});
      // sometimes go "back"
      if(!els.length||r<0.08){const ok=window.__onBack&&window.__onBack();return {back:true,ok};}
      const el=els[Math.min(els.length-1,Math.floor(r2*els.length))];
      const sig=el.getAttribute('data-act')+(el.dataset.k?'@'+el.dataset.k:'')+(el.dataset.v?'='+el.dataset.v:'');
      el.click();return {sig};
    },[R(),R(),deny.source]);
    trail.push(pick.back?'BACK':pick.sig);
    await p.waitForTimeout(25);
    if(p.errs.length>n0)errsAt.push({step:i,trail:trail.slice(-6),err:p.errs.slice(n0).join(' | ').slice(0,300)});
  }
  return {errsAt,trail};
}
module.exports={monkey,DENY};

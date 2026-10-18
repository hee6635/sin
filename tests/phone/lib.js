const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const T=+new Date('2026-10-12T10:00:00');
const base={onboarded:true,addonNote:'done',addons:{comp:false,cheer:false,together:false,colleague:false,stats:false,status:false},anchor:'2026-10-02',myTeam:1,patternName:'4조2교대',pattern:['주','야','휴','휴'],overrides:{},memos:{},alarms:[],myset:true,fontScale:100};
async function boot(b,state,opts={}){
  const p=await b.newPage({viewport:{width:opts.w||390,height:opts.h||844},deviceScaleFactor:2,hasTouch:!!opts.touch,reducedMotion:opts.rm?'reduce':'no-preference',bypassCSP:opts.csp!==true});
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
  await p.addInitScript(([d,T,mock])=>{const D=Date;globalThis.Date=class extends D{constructor(...a){super(...(a.length?a:[T]))}static now(){return T}};
    window.__rem=[];window.__theme='';
    window.AndroidBridge={status:()=>'',setAlarms(){},setReminders(j){window.__rem=JSON.parse(j);},setThemeMode(m){window.__theme=m;},setTextZoom(){},takePush:()=>''};
    if(d)localStorage.setItem('eonjeswieo:v1',JSON.stringify(d));},[state,T]);
  await p.route('**/firebase/config.js',r=>r.fulfill({body:'',contentType:'text/javascript'}));
  await p.goto('file:///home/user/sin/app/src/main/assets/index.html');await p.waitForTimeout(900);
  p.errs=errs;return p;
}
function mkT(){let ok=0,bad=0;const T_=(n,c,x='')=>{if(c){ok++;console.log('✓',n);}else{bad++;console.log('✗ FAIL',n,x);}};T_.sum=()=>console.log(`\n${ok} 통과 ${bad} 실패`);return T_;}
module.exports={chromium,boot,mkT,base,T};

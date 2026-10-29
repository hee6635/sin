const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const T=+new Date('2026-10-12T10:00:00');
const base={tune:{appCover:{stk:1,stkX:0,stkY:0,ink:1,inkY:0,memo:1,pill:1},appInner:{stk:1,stkX:0,stkY:0,ink:1,inkY:0,memo:1,pill:1},cover:{stk:1,stkX:0,stkY:0,ink:1,inkY:0,memo:1,pill:1},inner:{stk:1,stkX:0,stkY:0,ink:1,inkY:0,memo:1,pill:1}},onboarded:true,addonNote:'done',addons:{comp:false,cheer:false,together:false,colleague:false,stats:false,status:false},anchor:'2026-10-02',myTeam:1,patternName:'4조2교대',pattern:['주','야','휴','휴'],overrides:{},memos:{},alarms:[],myset:true,fontScale:100};
async function boot(b,state,opts={}){
  const p=await b.newPage({viewport:{width:opts.w||390,height:opts.h||844},deviceScaleFactor:2,hasTouch:!!opts.touch,reducedMotion:opts.rm?'reduce':'no-preference',bypassCSP:opts.csp!==true,...(opts.tz?{timezoneId:opts.tz}:{})});
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
  if(!opts.fold)await p.addInitScript(()=>{   // (v0.92 날짜 창 근무타입 접기 전에 쓴 시험들: 늘 펼친 채로 · 접기 자체는 s64 가 {fold:true} 로 시험)
    document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='.shsec .sh-body{transition:none!important}';document.head.appendChild(st);
      new MutationObserver(()=>{document.querySelectorAll('.shsec:not(.open)').forEach(e=>{if(!e.dataset.tOpen){e.dataset.tOpen=1;e.classList.add('open');}});}).observe(document.body,{subtree:true,childList:true});});});
  await p.addInitScript(([d,T,mock])=>{const D=Date;globalThis.Date=class extends D{constructor(...a){super(...(a.length?a:[T]))}static now(){return T}};
    window.__rem=[];window.__theme='';
    window.AndroidBridge={status:()=>'',setAlarms(){},setReminders(j){window.__rem=JSON.parse(j);},setThemeMode(m){window.__theme=m;},setTextZoom(){},takePush:()=>''};
    if(d)localStorage.setItem('eonjeswieo:v1',JSON.stringify(d));},[state,opts.T||T]);
  await p.route('**/firebase/config.js',r=>r.fulfill({body:opts.cfg||'',contentType:'text/javascript'}));
  if(opts.routes)for(const [u,f] of opts.routes)await p.route(u,f);
  await p.goto('file:///home/user/sin/app/src/main/assets/index.html');await p.waitForTimeout(900);
  // v0.97: 설정 안쪽 페이지(화면 · 알림 · 도움)가 아래 탭을 덮음 → 탭을 누르기 전에 열린 페이지를 닫음 (폰의 뒤로가기와 같음)
  const _click=p.click.bind(p);
  p.click=async(sel,o)=>{if(/#nav \[data-tab/.test(sel))await p.evaluate(()=>{const x=document.querySelector('#page.open [data-act="page-close"]');if(x)x.click();});return _click(sel,o);};
  p.errs=errs;return p;
}
function mkT(){let ok=0,bad=0;const T_=(n,c,x='')=>{if(c){ok++;console.log('✓',n);}else{bad++;console.log('✗ FAIL',n,x);}};T_.sum=()=>console.log(`\n${ok} 통과 ${bad} 실패`);return T_;}
module.exports={chromium,boot,mkT,base,T};

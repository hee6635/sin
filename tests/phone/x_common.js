// 가족이 보낸 값 · 깨진 저장 값 시험용 도우미 (s41 · s42). 가족 쪽 값마다 고유한 악성 글자를 넣은 상태를 만든다
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const APP=process.env.APP||'file:///home/user/sin/app/src/main/assets/index.html';
const T0=+new Date('2026-10-12T10:00:00');

// Same as tests/phone/lib.js boot() but: configurable wait, bridge call logging, optional storage hooks
async function boot(browser,state,opts={}){
  const ctx=await browser.newContext({viewport:{width:opts.w||390,height:opts.h||844},deviceScaleFactor:opts.dsf||2,hasTouch:opts.touch!==false,reducedMotion:'no-preference',timezoneId:opts.tz||undefined,locale:'ko-KR',bypassCSP:opts.csp!==true});
  const p=await ctx.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
  p.on('dialog',d=>{p.__dialogs=(p.__dialogs||[]);p.__dialogs.push(d.message());d.dismiss().catch(()=>{});});
  await p.addInitScript(([d,T,o])=>{
    if(o.freeze!==false){const D=Date;globalThis.Date=class extends D{constructor(...a){super(...(a.length?a:[T]))}static now(){return T}};}
    window.__rem=[];window.__theme='';window.__calls=[];
    const log=(n,a)=>{try{window.__calls.push([n,JSON.stringify(a).slice(0,200)]);}catch(e){}};
    const names=['setAlarms','setReminders','setThemeMode','setTextZoom','setWidgetData','openUrl','copyText','shareFile','shareText','sendMail','pickImage','driveBackup','driveList','driveRestore','takePush','takeWidgetActions','takeOpenDate','status','appInfo','exitApp','cleanTones','shareScreen','googleSignIn','openSettings'];
    const br={};
    names.forEach(n=>{br[n]=(...a)=>{log(n,a);
      if(n==='setReminders'){try{window.__rem=JSON.parse(a[0]);}catch(e){}}
      if(n==='status'||n==='takePush'||n==='takeWidgetActions'&&false)return '';
      if(n==='takeWidgetActions')return '[]';
      if(n==='takeOpenDate')return '';
      return undefined;};});
    if(!o.noBridge)window.AndroidBridge=br;
    if(d!==undefined&&d!==null&&!o.noSeed)localStorage.setItem('eonjeswieo:v1',typeof d==='string'?d:JSON.stringify(d));
    if(o.preInit)try{(new Function('window',o.preInit))(window);}catch(e){}
  },[state,T0,opts]);
  await p.route('**/firebase/config.js',r=>r.fulfill({body:'',contentType:'text/javascript'}));
  p.errs=errs;p.ctx=ctx;
  await p.goto(opts.url||APP);
  await p.waitForTimeout(opts.wait||600);
  return p;
}

const K='2026-10-14';
// A "realistic" heavy-ish saved state exercising nearly every top-level key
function rich(){
  const sch=(tag)=>({v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',
    types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true},{k:'연',name:'연차',color:'#ffe0b2',rest:true}],
    overrides:{'2026-10-14':'_','2026-10-20':'연'},holRest:false,
    stk:{'2026-10-13':'002','2026-10-14':'011'},sdefs:[{i:'x',k:'m',e:'💪'},{i:'p',k:'p',t:2,c:'#ef4d5a',h:'c'}],sv:2});
  const icon='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const memo=(id,text,extra={})=>Object.assign({id,text,shared:false,by:'host',t:1760000000000},extra);
  return {
    onboarded:true,myset:true,noPat:false,addonNote:'done',
    addons:{comp:true,cheer:true,together:true,colleague:true,stats:true,status:true},
    pattern:['주','주','휴','휴','야','야','휴','휴'],patternName:'4조2교대',anchor:'2026-10-02',patOld:[{until:'2026-09-01',anchor:'2026-08-01',pattern:['주','야','휴']}],
    overrides:{'2026-10-14':'야','2026-10-15':'휴','2026-11-03':'연'},
    memos:{[K]:[memo('m1','약국 가기',{todo:true}),memo('m2','가족 메모 https://example.com/a',{shared:true,time:'09:00',al:'10',color:'#e5484d'}),memo('m3','할 일 완료',{todo:true,done:true})],'2026-10-20':[memo('m4','병원',{})]},
    alarms:[{id:'a1',label:'출근',time:'05:30',shift:'주',offset:0,on:true,sound:true,vib:true,vol:100,ramp:false,tone:'',toneName:'기본 알람음',snMin:5,snMax:3,once:false,until:0,noHol:false,skipAt:0},
            {id:'a2',label:'야근',time:'17:00',shift:'야',offset:0,on:true,sound:true,vib:true,vol:80,ramp:true,tone:'',toneName:'기본 알람음',snMin:5,snMax:3,once:false,until:0}],
    requests:[{id:'r1',date:'2026-10-21',want:'휴',msg:'병원',st:'pending',reply:'',prev:null,t:1760000000000,tu:1760000000000,by:'guest'}],
    events:[{id:'e1',to:'host',kind:'memo',k:K,text:'♥ 엄마님이 메모를 남겼어요',seen:false,t:1760000000000}],
    board:{'2026-10':[{id:'p1',type:'list',title:'장보기',lines:[{id:'l1',text:'우유',done:false,doneBy:''}],text:'',shared:false,by:'host',color:'y',repeat:false,dateAuto:true,date:K,reacts:{},torn:false,tornAt:0,t:1},
                      {id:'p2',type:'note',title:'',lines:[],text:'메모지',shared:true,by:'host',color:'y',repeat:false,dateAuto:true,date:'',reacts:{},torn:false,tornAt:0,t:2}]},
    boardCarry:{'2026-10':true},
    syncSettings:{isGuestMode:false,shareMyShift:true,receiveFamilyMemo:true,shareMyMemos:true,isPro:false,nightNotice:true},
    pay:{wage:12000,hours:12},myTeam:2,teamOffsets:[6,4,0,2],teamStyle:'abc',teamNames:[],holRest:false,
    link:{hid:'dad',role:'host',name:'아빠',perm:'write',mode:'own',uid:'dad',hash:''},
    fam2:{members:[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'own'}],
          scheds:{dad:sch(),mom:sch()},
          memos:{mm1:{by:'mom',byName:'엄마',date:K,text:'장 봐줘',to:['dad','mom'],rev:0,time:'18:00',al:'10',t:1760000000000}},
          reqIn:{rq1:{from:'mom',to:'dad',fromName:'엄마',toName:'아빠',date:'2026-10-22',want:'휴',msg:'같이 쉬자',st:'pending',reply:'',held:false,grp:'',gn:1,lead:false,t:1760000000000,u:1760000000000}},
          reqOut:{},reqCc:{},me:{sent:1,bonus:0},seenMemo:['mm1'],memoRev:{mm1:0},init:true,syncAt:1760000000000},
    stamps:{defs:[{id:'s_pill',kind:'pill',emoji:'💊',name:'약',times:2,color:'#ef4d5a',shape:'caps',rep:'daily',days:[],dates:[],skip:[],ats:['08:00','20:00']},
                  {id:'s_run',kind:'mark',emoji:'👟',name:'조깅',times:1,rep:'dow',days:[1,3,5],dates:[],skip:[],ats:[]},
                  {id:'s_gym',kind:'mark',emoji:'💪',name:'운동',times:1,rep:'none',days:[],dates:[K],skip:[],ats:[]},
                  {id:'s_empty',kind:'mark',emoji:'',name:'',times:1,rep:'none',days:[],dates:[],skip:[],ats:[],empty:true}],
            log:{[K]:{s_pill:1,s_run:1},'2026-10-13':{s_pill:2}},snap:{'2026-10-13':{s_pill:{c:'#ef4d5a',t:2,h:'caps'}}},remind:false,pillTimes:['08:00','13:00','20:00'],lastAt:[],v3:1,v4:1},
    family:[{id:'f1',name:'동생',color:'#e5484d',kind:'shift',days:[1,2,3,4,5],start:'09:00',end:'18:00',holOff:true,vac:[],team:1},
            {id:'f2',name:'조카',color:'#10b981',kind:'student',days:[1,2,3,4,5],start:'08:30',end:'15:00',holOff:true,vac:[{from:'2026-12-20',to:'2027-02-28'}],team:0}],
    famCheer:null,famDayToo:true,shiftTimes:{'주':{start:'06:00',end:'14:00'}},
    status:{show:true,phone:true,homeAlert:true,cheer:'quiet',work:'🏭',workName:'',labels:{}},
    icons:{ic1:icon},
    ddays:[],companyHols:[{id:'c1',date:'2026-10-25',name:'창립기념일',yearly:true,kind:'off',emoji:'🏢',rem:[1],remAt:'20:00',remind:true},
                         {id:'c2',date:'2026-10-30',name:'엄마 생일',yearly:true,kind:'memo',emoji:'🎂',rem:[],remAt:'20:00',remind:false}],
    compHolAsHoliday:true,memoColors:{fam:'#7b5cf0',my:'#6b7280'},fontScale:100,theme:'system',showBand:true,
    drive:{last:0,dirty:true,email:'a@b.c',auto:true},
    types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true},{k:'연',name:'연차',color:'#ffe0b2',rest:true}],
    personal:false,pers:[{f:'2026-12-01',t:'2026-12-10'}],widget:{theme:'system',alpha:100},weekStart:0,memoLines:3,quickN:0,famWk:'c',famSwiped:true,
    myEmo:[{e:'🍙',n:'밥'}],patWeek:false,seenVer:'1',lastMemoColor:'#e5484d',gAcct:'',pushOn:true,pushQuiet:true,
    usage:{date:'2026-10-12',used:1,bonus:0},tipMemo:true,shareMemo:false,noHolRest:false
  };
}

// Click through the main screens/pages and collect errors. `p.errs` accumulates.
async function exercise(p,{deep=true}={}){
  const out=[];
  const step=async(name,fn)=>{const n0=p.errs.length;try{await fn();}catch(e){out.push(name+': playwright '+String(e.message).split('\n')[0]);}await p.waitForTimeout(60);if(p.errs.length>n0)out.push(name+' => '+p.errs.slice(n0).join(' | ').slice(0,300));};
  for(const t of ['cal','alarm','fam','set','cal'])await step('tab:'+t,()=>p.evaluate(t=>{const b=document.querySelector(`#nav [data-tab="${t}"]`);b&&b.click();},t));
  await step('day-sheet',()=>p.evaluate(k=>{const c=document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`);c&&c.click();},K));
  await step('close',()=>p.evaluate(()=>{const b=document.querySelector('#sheet [data-act="close"]');b&&b.click();}));
  if(deep){
    await step('month-picker',()=>p.evaluate(()=>{const h=document.querySelector('[data-act="open-month-picker"]');h&&h.click();}));
    await step('close',()=>p.evaluate(()=>{const b=document.querySelector('#sheet [data-act="close"]');b&&b.click();}));
    await step('next-prev',()=>p.evaluate(()=>{const n=document.querySelector('[data-act="next"]');n&&n.click();const q=document.querySelector('[data-act="prev"]');q&&q.click();}));
    await step('feed',()=>p.evaluate(()=>{const b=document.querySelector('[data-act="feed-sheet"]');b&&b.click();}));
    await step('close',()=>p.evaluate(()=>{const b=document.querySelector('#sheet [data-act="close"]');b&&b.click();}));
  }
  return out;
}
module.exports={chromium,boot,rich,exercise,K,T0,APP};

// Build a state where every server-controlled (other family member) field carries a unique XSS probe.
const {rich,K}=require('./x_common.js');
// Probe breaks out of text, "..." attr, '...' attr, and unquoted attr contexts, then runs JS tagging the field name.
const P=f=>`"'><img src=x onerror="(window.__xss=window.__xss||{})['${f}']=1">`;
// Same probe but a *short* variant that fits rule limits (<=20 chars etc.) is not needed for classification.
function poisoned(opts={}){
  const s=rich();
  const T=['주','야','휴'];
  const keyP=P('types.k');
  s.link={hid:'dad',role:'host',name:'아빠',perm:'write',mode:'own',uid:'dad',hash:''};
  s.fam2.members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},
                  {uid:'mom',role:'guest',name:P('member.name'),mode:'own'},
                  {uid:'sis',role:'guest',name:'누나',mode:'own'}];
  const mk=(extra)=>Object.assign({v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',
    types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],
    overrides:{},holRest:false,updatedAt:1760000000000},extra);
  s.fam2.scheds={
    dad:mk({}),
    // mom: poisoned types (color/name/k) + poisoned pattern element + override value + patternName/teamName
    mom:mk({patternName:P('sched.patternName'),teamName:P('sched.teamName'),
      pattern:[keyP,'주','휴','휴',P('pattern.elem'),'야'],
      types:[{k:keyP,name:P('types.name'),color:P('types.color'),rest:false},
             {k:'주',name:'주간',color:P('types.color2'),rest:false},
             {k:'야',name:'야간',color:'v:night',rest:false},
             {k:'휴',name:'휴무',color:'',rest:true},
             {k:P('types.k2'),name:'x',color:'#fff',rest:true},
             {k:'연',name:'연차',color:'#ffe0b2',rest:true}],
      overrides:{'2026-10-14':P('overrides.val'),'2026-10-15':keyP,'2026-10-16':'연'},
      stk:{'2026-10-13':'0020','2026-10-14':'0111'},sv:2,
      sdefs:[{i:'a',k:'m',e:P('sdefs.e')},{i:'b',k:'p',t:2,c:P('sdefs.c'),h:P('sdefs.h')},{i:'c',k:'m',e:'x',img:P('sdefs.img')}]}),
    sis:mk({anchor:P('sched.anchor').slice(0,10)})
  };
  // stickers decode: w=3 for sv 2 => 2 chars index (base36) + 1 char count. 'sdefs' index 0..2 => '00','01','02'
  s.fam2.scheds.mom.stk={'2026-10-13':'0020'+'0121','2026-10-14':'0222'};
  const rid=P('req.id'),mid=P('memo.id');
  s.fam2.memos={
    [mid]:{by:'mom',byName:P('memo.byName'),date:K,text:P('memo.text'),to:['dad','mom'],rev:0,time:'18:00',al:'10',t:1760000000000},
    mm2:{by:'mom',byName:'엄마',date:P('memo.date'),text:'x',to:['dad'],rev:0,time:'',al:'',t:1760000000000},
    mm3:{by:P('memo.by'),byName:'엄마',date:K,text:'y',to:['dad'],rev:0,time:'',al:'',t:1760000000000}
  };
  const R=(id,over)=>Object.assign({from:'mom',to:'dad',fromName:P('req.fromName'),toName:P('req.toName'),date:'2026-10-22',want:P('req.want'),msg:P('req.msg'),st:'pending',reply:P('req.reply'),held:false,mode:null,prev:P('req.prev'),grp:'',gn:1,lead:false,t:1760000000000,u:1760000000000},over);
  s.fam2.reqIn={[rid]:R(rid,{}),rqB:R('rqB',{date:P('req.date'),fromName:'엄마',want:'휴',msg:'',reply:'',prev:null,toName:'아빠'}),
                rqC:R('rqC',{st:P('req.st'),fromName:'엄마',want:'휴',msg:'',reply:'',prev:null,toName:'아빠',date:'2026-10-23'}),
                rqG1:R('rqG1',{grp:P('req.grp'),gn:2,lead:true,date:'2026-10-24',fromName:'엄마',want:'휴',msg:'',reply:'',prev:null}),
                rqG2:R('rqG2',{grp:P('req.grp'),gn:2,lead:false,date:'2026-10-25',fromName:'엄마',want:'휴',msg:'',reply:'',prev:null})};
  s.fam2.reqOut={rqO:{from:'dad',to:'mom',fromName:'아빠',toName:P('req.toName.out'),date:'2026-10-26',want:'휴',msg:'',st:'accepted',reply:P('req.reply.out'),held:false,mode:null,prev:'주',grp:'',gn:1,lead:false,t:1760000000000,u:1760000000000}};
  s.fam2.reqCc={cc1:{fromName:P('cc.fromName'),toName:P('cc.toName'),date:'2026-10-27',want:P('cc.want'),grp:'',lead:false}};
  const mirror=(id,v,dir)=>({id,srv:true,dir,date:v.date,want:v.want,msg:v.msg||'',st:v.st,reply:v.reply||'',held:!!v.held,mode:v.mode||null,prev:v.prev||null,grp:v.grp||'',gn:v.gn||1,lead:!!v.lead,t:v.t,tu:v.u||v.t,peer:dir==='in'?v.from:v.to,peerName:dir==='in'?v.fromName:v.toName,by:dir==='in'?'guest':'host'});
  s.requests=[].concat(Object.entries(s.fam2.reqIn).map(([id,v])=>mirror(id,v,'in')),Object.entries(s.fam2.reqOut).map(([id,v])=>mirror(id,v,'out')));
  // events built from server text (the app builds them from names etc.; store a raw one as well)
  s.events=[{id:'e1',to:'host',kind:'memo',k:K,text:P('event.text'),seen:false,t:1760000000000},
            {id:P('event.id'),to:'host',kind:'req',k:'2026-10-22',text:'엄마가 22일 휴 요청해요',seen:false,t:1760000000000},
            {id:'e3',to:'host',kind:P('event.kind'),k:K,text:'x',seen:false,t:1760000000000}];
  s.fam2.seenMemo=[];s.fam2.memoRev={};
  return s;
}
module.exports={poisoned,P};

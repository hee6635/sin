// v0.77: 남의 달력(보기만) 날짜 창에서 내 가족 메모 고치기 · 지우기 / 가족이 생기면 스티커 선택창 / 꽉 찬 칸 알약 높이 / 올리기 실패 알림
const {chromium,boot}=require('./x_common.js');
const {mkT,base}=require('./lib.js');
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const dadSch={v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',
    types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],overrides:{},holRest:false};
  const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'me',role:'guest',name:'테블릿',mode:'view'}];
  const K='2026-10-21';
  const mine={id:'m1',text:'내가 쓴 가족 메모',shared:true,by:'host',t:1760000000000};
  const state=(extra={})=>({...base,onboarded:true,myset:false,link:{hid:'dad',role:'guest',name:'테블릿',perm:'write',mode:'view',uid:'me',hash:'',stkAsked:1},
    fam2:{members,scheds:{dad:dadSch},memos:{},reqIn:{},reqOut:{},me:{sent:3,bonus:1000},seenMemo:[],init:true},requests:[],memos:{[K]:[mine]},...extra});
  const openDay=async p=>{
    await p.waitForSelector('#vcsl',{timeout:5000});await p.waitForTimeout(300);
    await p.click(`#vcsl .cell[data-k="${K}"]`);await p.waitForTimeout(500);
  };
  // ── 남의 달력 날짜 창: 내 가족 메모 고치기 · 지우기
  {
    const p=await boot(b,state(),{touch:true});
    await openDay(p);
    T('날짜 창에 내 메모에 고치기 · 지우기 버튼',await p.evaluate(()=>!!document.querySelector('#sheet [data-act="vc-memo-edit"]')&&!!document.querySelector('#sheet [data-act="vc-memo-del"]')));
    await p.click('#sheet [data-act="vc-memo-edit"]');await p.waitForTimeout(300);
    T('고치기를 누르면 입력칸 · 저장 · 취소',await p.evaluate(()=>{const i=document.getElementById('vcmedit');return !!i&&i.value==='내가 쓴 가족 메모'&&!!document.querySelector('#sheet [data-act="vc-memo-save"]');}));
    await p.fill('#vcmedit','고친 글');await p.click('#sheet [data-act="vc-memo-save"]');await p.waitForTimeout(400);
    T('저장하면 글이 바뀜 · 저장값에도 반영',(await p.$eval('#sheet',e=>e.innerText)).includes('고친 글')&&await p.evaluate(()=>Object.keys(localStorage).some(k=>(localStorage.getItem(k)||'').includes('고친 글'))));
    await p.evaluate(()=>{window.confirm=()=>true;});
    await p.click('#sheet [data-act="vc-memo-del"]');await p.waitForTimeout(500);
    T('지우기 → 확인 후 메모가 사라짐',!(await p.$eval('#sheet',e=>e.innerText)).includes('고친 글')&&!(await p.evaluate(()=>Object.keys(localStorage).some(k=>(localStorage.getItem(k)||'').includes('고친 글')))));
    T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  }
  // 남이 쓴 메모에는 고치기 · 지우기가 없음
  {
    const st=state();st.fam2.memos={x1:{by:'dad',byName:'아빠',date:K,text:'아빠 메모',t:1760000000000,to:['dad','me']}};st.memos={};
    const p=await boot(b,st,{touch:true});await openDay(p);
    T('남이 쓴 메모에는 고치기 · 지우기 버튼 없음',await p.evaluate(()=>!document.querySelector('#sheet [data-act="vc-memo-edit"]')&&!document.querySelector('#sheet [data-act="vc-memo-del"]')&&document.querySelector('#sheet').innerText.includes('아빠 메모')));
    await p.close();
  }
  // ── 스티커 선택창
  {
    const st=state();st.link.stkAsked=0;st.stamps={...base.stamps,defs:[{id:'a',kind:'mark',emoji:'🏃',name:'조깅',times:1,rep:'daily',from:'2026-09-01',days:[],dates:[],skip:[],ats:[]},{id:'p',kind:'pill',emoji:'💊',name:'약',times:1,color:'#ef4d5a',shape:'caps',rep:'daily',from:'2026-09-01',days:[],dates:[],skip:[],ats:[]}],log:{},snap:{},v3:1,v4:1,lastAt:[]};
    const p=await boot(b,st,{touch:true,wait:1200});
    await p.waitForTimeout(1000);
    T('가족이 생기면 스티커 선택창이 한 번 뜸',await p.evaluate(()=>document.querySelector('#pop').classList.contains('open')&&/내 스티커를 가족에게 보여 줄까요/.test(document.querySelector('#pop').textContent)&&!!document.querySelector('[data-act="stkshare-now"]')&&!!document.querySelector('[data-act="stkshare-new"]')&&!!document.querySelector('[data-act="stkshare-no"]')));
    await p.click('[data-act="stkshare-new"]');await p.waitForTimeout(400);
    T('"앞으로 만드는 것부터" → 지금 있는 스티커는 가족에게 안 보이게(fam false) · 보이기 켜짐 · 다시 안 물음',await p.evaluate(()=>{const j=Object.keys(localStorage).map(k=>localStorage.getItem(k)||'').find(v=>v.includes('"stkAsked"'));if(!j)return false;const s=JSON.parse(j);return s.link.stk===true&&s.link.stkAsked===1&&s.stamps.defs.every(d=>d.fam===false);}));
    await p.close();
    const p2=await boot(b,JSON.parse(JSON.stringify(st)),{touch:true,wait:1200});
    await p2.click('[data-act="stkshare-now"]');await p2.waitForTimeout(400);
    T('"지금 있는 것도" → 보이기 켜짐 · 스티커 값은 그대로(약은 기본 숨김)',await p2.evaluate(()=>{const j=Object.keys(localStorage).map(k=>localStorage.getItem(k)||'').find(v=>v.includes('"stkAsked"'));const s=JSON.parse(j);return s.link.stk===true&&s.stamps.defs.every(d=>d.fam===undefined);}));
    await p2.close();
    const p3=await boot(b,JSON.parse(JSON.stringify(st)),{touch:true,wait:1200});
    await p3.click('[data-act="stkshare-no"]');await p3.waitForTimeout(300);
    T('"안 보여 줘요" → 보이기 꺼진 채 · 다시 안 물음',await p3.evaluate(()=>{const j=Object.keys(localStorage).map(k=>localStorage.getItem(k)||'').find(v=>v.includes('"stkAsked"'));const s=JSON.parse(j);return !s.link.stk&&s.link.stkAsked===1&&!document.querySelector('#pop').classList.contains('open');}));
    await p3.close();
    const p4=await boot(b,state({}),{touch:true,wait:1200});
    T('이미 물었으면(stkAsked) 선택창이 안 뜸',!(await p4.evaluate(()=>document.querySelector('#pop').classList.contains('open')&&/내 스티커를/.test(document.querySelector('#pop').textContent))));await p4.close();
  }
  // ── 꽉 찬 칸 알약 높이(메모 많은 날)도 글자 줄 높이의 1.3배까지만
  {
    const memo=n=>Array.from({length:n},(_,i)=>({id:'q'+i,text:'병원 '+(i+1),shared:false}));
    for(const [w,h,nm] of [[390,844,'폰'],[360,1100,'긴 폰']]){
      const p=await boot(b,{...base,memos:{'2026-10-13':memo(1),'2026-10-14':memo(3),'2026-10-15':memo(6)},pattern:['주','야','휴','휴'],anchor:'2026-10-02'},{w,h,touch:true});
      const r=await p.evaluate(()=>{const cs=getComputedStyle(document.documentElement),lh=parseFloat(cs.getPropertyValue('--plh')),cap=Math.round(lh*1.3)+1;
        const mx=k=>Math.max(0,...[...document.querySelectorAll(`.track .panel:nth-child(2) .cell[data-k="${k}"] .pill-wrap>.pl`)].map(e=>e.getBoundingClientRect().height));
        return {lh,cap,h1:mx('2026-10-13'),h3:mx('2026-10-14'),h6:mx('2026-10-15')};});
      T(`${nm}: 메모가 줄을 꽉 채워도 알약 높이 ≤ 글자 줄 높이의 1.3배`,r.h1<=r.cap+0.5&&r.h3<=r.cap+0.5&&r.h6<=r.cap+0.5&&r.h6>0,JSON.stringify(r));
      T(`${nm}: 오류 없음`,p.errs.length===0,p.errs.join('|'));await p.close();
    }
  }
  T.sum();await b.close();
})();

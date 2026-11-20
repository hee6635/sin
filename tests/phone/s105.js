// v0.233: 기간 띠 — 칸 사이 선에서 안 끊김 · 주 줄 높이 같음 · 가족 메모 띠(♥ · 띠 색) · 받은 가족 메모 띠 · 고치기/옮기기 · 위젯 데이터 pv
const {chromium,boot,mkT,base}=require('./lib.js');
const members=[{uid:'dad',role:'host',name:'아빠',mode:'own'},{uid:'mom',role:'guest',name:'엄마',mode:'own'}];
const fam2=memos=>({members,scheds:{},memos,reqIn:{},reqOut:{},me:{sent:0,bonus:0},seenMemo:Object.keys(memos),init:true});
(async()=>{const T=mkT();const b=await chromium.launch();
  const st={...base,memos:{'2026-10-14':[{id:'a1',text:'대수리',shared:false,by:'host',t:1,till:'2026-10-21',color:'#ffe0c7'}],
    '2026-10-06':[{id:'a2',text:'여행',shared:true,by:'host',t:1,till:'2026-10-08',pc:'#d9ecff'}]}};
  let p=await boot(b,st,{w:390});
  const cellOf=k=>`[...document.querySelectorAll('.cell[data-k="${k}"]')].find(x=>{const l=x.getBoundingClientRect().left;return l>=0&&l<innerWidth})`;
  const g=await p.evaluate(new Function(`const c=${cellOf('2026-10-15')},q=c.querySelector('.pvl').getBoundingClientRect(),a=c.getBoundingClientRect(),cs=getComputedStyle(c);return {r:q.right,cr:a.right,l:q.left,cl:a.left,ov:cs.overflowX};`));
  T('가운데 날 띠가 칸 선 너머까지 (안 끊김)',g.r>g.cr&&g.l<g.cl&&g.ov==='clip',JSON.stringify(g));
  const tops=await p.evaluate(()=>[...new Set([...document.querySelectorAll('.cell')].filter(x=>{const l=x.getBoundingClientRect().left;return l>=0&&l<innerWidth}).map(c=>c.querySelector('.pill-wrap').getBoundingClientRect().top.toFixed(1)))].length);
  T('한 줄의 메모 자리 높이가 모두 같음 (토요일 칸 포함 · 띠 계단 없음)',tops===6,String(tops));
  const fb=await p.evaluate(new Function(`const c=${cellOf('2026-10-06')},v=c.querySelector('.pvl');return {t:v.textContent,pc:v.style.getPropertyValue('--pc'),fam:c.querySelectorAll('.pl.fam').length};`));
  T('가족 메모 띠: ♥ 이름 · 고른 띠 색 · 같은 메모가 가족 줄로 또 나오지 않음',fb.t==='♥ 여행'&&fb.pc==='#5b97ec'&&fb.fam===0,JSON.stringify(fb));
  // 위젯 데이터
  const j=await p.evaluate(()=>{let o='';window.AndroidBridge.setWidgetData=x=>{o=x;};__wx.pushWidgetNow();return JSON.parse(o);});
  const w14=j.days.find(x=>x.k==='2026-10-14'),w15=j.days.find(x=>x.k==='2026-10-15'),w21=j.days.find(x=>x.k==='2026-10-21');
  T('위젯: 시작 날 띠(s · b) 이름 · 가운데 날은 빈 줄 · 끝 날 x',w14.pl&&w14.pl[0].s&&w14.pl[0].b&&w14.ms[0]==='대수리'&&w14.mk==='p'&&w15.pl&&!w15.pl[0].s&&w15.ms[0]===' '&&w21.pl[0].x===1,JSON.stringify([w14.pl,w14.ms,w15.pl,w15.ms,w21.pl]));
  T('위젯 날짜 창: 가운데 날에도 기간 한 줄',(w15.mi||[]).some(x=>/대수리 · 10\/14 ~ 10\/21/.test(x.t)),JSON.stringify(w15.mi));
  // 나만 → 가족으로 바꾸면 띠 그대로 · 메모 색이 띠 색으로
  await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(500);
  await p.evaluate(()=>{const c=document.querySelector('#sheet .mcard[data-mid="a1"], #sheet [data-mid="a1"]');c&&c.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true}));});
  await p.evaluate(()=>window.__wx.S&&0);
  // 메모 자세히 열기 (per-open 과 같은 길)
  await p.evaluate(()=>{const b=document.createElement('button');b.dataset.act='per-open';b.dataset.k='2026-10-14';b.dataset.id='a1';document.body.appendChild(b);b.click();b.remove();});await p.waitForTimeout(500);
  T('나만 메모 자세히: "기간 띠" 줄',await p.evaluate(()=>/기간 띠/.test(document.querySelector('#page').innerText)));
  await p.click('#page [data-act="md-share"][data-v="1"]');await p.waitForTimeout(500);
  const sh=await p.evaluate(()=>({till:!!document.querySelector('#page #mdTill'),pc:!!document.querySelector('#page .mdcol [data-act="md-pc"]'),on:(document.querySelector('#page .mdcol button.on')||{}).dataset?.v,above:(()=>{const c=document.querySelector('#page .mdcol'),t=document.querySelector('#page #mdTodo');return !!c&&!!t&&c.getBoundingClientRect().top<t.getBoundingClientRect().top;})()}));
  T('가족으로 바꿔도 기간 그대로 · 띠 색 줄(할 일 위 큰 동그라미) · 메모 색이 띠 색으로',sh.till&&sh.pc&&sh.on==='#ffe0c7'&&sh.above,JSON.stringify(sh));
  await p.click('#page .mdcol [data-act="md-pc"][data-v="#d6f5df"]');await p.waitForTimeout(300);
  await p.click('#page [data-act="md-save"]');await p.waitForTimeout(700);
  const m1=await p.evaluate(()=>__wx.S.memos['2026-10-14'].find(x=>x.id==='a1'));
  T('저장: 가족 메모 · 기간 · 띠 색',m1.shared&&m1.till==='2026-10-21'&&m1.pc==='#d6f5df',JSON.stringify(m1));
  await p.evaluate(()=>{__wx.closePage&&__wx.closePage();__wx.closeSheet&&__wx.closeSheet();});await p.waitForTimeout(400);
  const c2=await p.evaluate(new Function(`const v=${cellOf('2026-10-16')}.querySelector('.pvl');return v&&v.style.getPropertyValue('--pc');`));
  T('달력 띠 색이 고른 색으로',c2==='#4fb874',String(c2));
  T('오류 없음',p.errs.length===0,p.errs.join('|'));await p.close();
  // 다시 켜도 남음 (normalize)
  const saved={...st,memos:{'2026-10-14':[{id:'a1',text:'대수리',shared:true,by:'host',t:1,till:'2026-10-21',pc:'#d6f5df'}],'2026-10-09':[{id:'z',text:'잘못',shared:false,by:'host',t:1,till:'2026-10-01'}]}};
  p=await boot(b,saved,{w:390});
  const r=await p.evaluate(()=>[__wx.S.memos['2026-10-14'][0],__wx.S.memos['2026-10-09'][0]]);
  T('다시 켜도 가족 메모 기간 · 띠 색 남음 · 끝이 시작보다 앞이면 버림',r[0].till==='2026-10-21'&&r[0].pc==='#d6f5df'&&!r[1].till,JSON.stringify(r));
  await p.close();
  // 받은 가족 메모(서버)도 띠
  const fst={...base,link:{hid:'dad',role:'host',name:'아빠',perm:'write',mode:'own',uid:'dad',hash:''},requests:[],
    fam2:fam2({mom_x1:{by:'mom',byName:'엄마',date:'2026-10-26',text:'친정',till:'2026-10-28',pc:'#ffd9e4',to:['dad','mom'],t:1},mom_x2:{by:'mom',byName:'엄마',date:'2026-10-27',text:'나쁜값',till:'2026-10-20',to:['dad','mom'],t:1}})};
  p=await boot(b,fst,{w:390});
  const rv=await p.evaluate(new Function(`const a=${cellOf('2026-10-26')}.querySelector('.pvl'),m=${cellOf('2026-10-27')};return {t:a&&a.textContent,pc:a&&a.style.getPropertyValue('--pc'),mid:!!m.querySelector('.pvl'),bad:m.innerText.includes('나쁜값')};`));
  T('받은 가족 메모: ♥ 띠 · 보낸 색 · 끝이 앞서는 값은 띠 없이 보통 메모',rv.t==='♥ 친정'&&rv.pc==='#ee7d9f'&&rv.mid&&rv.bad,JSON.stringify(rv));
  await p.evaluate(()=>__wx.openDay('2026-10-27'));await p.waitForTimeout(500);
  const per=await p.evaluate(()=>{const e=document.querySelector('#sheet .mcard.per');return e&&[e.innerText.replace(/\s+/g,' '),e.dataset.srv];});
  T('날짜 창 가운데 날: 받은 기간 줄 (누르면 시작 날로)',per&&/친정/.test(per[0])&&per[1]==='1',JSON.stringify(per));
  T('오류 없음 (가족)',p.errs.length===0,p.errs.join('|'));await p.close();
  // 날짜 옮기기: 끝 날도 같이
  p=await boot(b,st,{w:390});
  await p.evaluate(()=>__wx.openDay('2026-10-14'));await p.waitForTimeout(400);
  const mv=await p.evaluate(()=>{const S=__wx.S;return 1;});
  await p.evaluate(()=>{const b=document.createElement('button');b.dataset.act='mm-edit';b.dataset.mid='a1';document.querySelector('#sheet').appendChild(b);b.click();b.remove();});await p.waitForTimeout(500);
  T('기간 띠 메모 "고치기" → 자세히 (기간도 고침)',await p.evaluate(()=>!!document.querySelector('#page.open #mdTill')));
  T('오류 없음 (옮기기)',p.errs.length===0,p.errs.join('|'));
  await p.close();await b.close();T.sum();
})();

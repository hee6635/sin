// v0.236: 겹치는 기간 띠 두 줄(시안 design/period/v6-A2) · 메모는 띠 아래가 기본, 자리가 모자랄 때만 위쪽 빈자리로 · 이름은 처음 시작한 날만 · 줄 높이 같음 · 위젯 pl/mk
const {chromium,boot,mkT,base}=require('./lib.js');
const st={...base,memos:{
 '2026-10-17':[{id:'p1',text:'ㄴㄴ',shared:false,by:'host',t:1,till:'2026-10-19',color:'#d6f5df'}],
 '2026-10-19':[{id:'p2',text:'ㅛ',shared:false,by:'host',t:2,till:'2026-10-23',color:'#d9ecff'},{id:'m1',text:'qr등록',shared:false,by:'host',t:3}],
 '2026-10-20':[{id:'m5',text:'회식',shared:false,by:'host',t:7}],
 '2026-10-21':[{id:'m3',text:'치과',shared:false,by:'host',t:5},{id:'m4',text:'약속',shared:false,by:'host',t:6},{id:'m6',text:'셋째',shared:false,by:'host',t:8}]}};
(async()=>{const T=mkT();const b=await chromium.launch();
  for(const o of [{},{calLook:'fill'},{theme:'dark'}]){
    const p=await boot(b,{...st,...o},{w:390});await p.waitForTimeout(300);
    const r=await p.evaluate(()=>{const cell=k=>[...document.querySelectorAll('.cell[data-k="'+k+'"]')].find(x=>{const l=x.getBoundingClientRect().left;return l>=0&&l<innerWidth});
      const row=k=>[...cell(k).querySelectorAll('.pill-wrap>*')].map(e=>({c:e.className,t:e.textContent.trim(),y:Math.round(e.getBoundingClientRect().top*10)/10,h:Math.round(e.getBoundingClientRect().height*10)/10}));
      return {d17:row('2026-10-17'),d18:row('2026-10-18'),d19:row('2026-10-19'),d20:row('2026-10-20'),d21:row('2026-10-21'),d23:row('2026-10-23')};});
    const nm=JSON.stringify(o);
    T(nm+' 이름은 처음 시작한 날만 (17일 ㄴㄴ · 18일 주 첫날은 이름 없음)',r.d17[0].t==='ㄴㄴ'&&r.d18[0].t==='',JSON.stringify([r.d17[0],r.d18[0]]));
    T(nm+' 겹친 19일: 위 ㄴㄴ 끝 · 아래 ㅛ 시작(이름) · 메모는 그 아래',/pvl e x/.test(r.d19[0].c)&&/pvl s b/.test(r.d19[1].c)&&r.d19[1].t==='ㅛ'&&r.d19[2].t.startsWith('qr'),JSON.stringify(r.d19));
    T(nm+' 20일: 자리가 있으면 메모는 띠 아래 (위는 빈자리)',/pve/.test(r.d20[0].c)&&/pvl/.test(r.d20[1].c)&&r.d20[2].t==='회식',JSON.stringify(r.d20));
    T(nm+' 21일: 자리가 모자라면 첫 메모가 위 빈자리로 · 나머지 +1',r.d21[0].t==='치과'&&/pvl/.test(r.d21[1].c)&&/\+1/.test(r.d21[2].t),JSON.stringify(r.d21));
    const ys=['d19','d20','d21','d23'].map(k=>r[k][1].y),hs=['d19','d20','d21','d23'].map(k=>r[k][1].h);
    T(nm+' ㅛ 띠가 19~23일 같은 높이 · 같은 두께 (계단 없음)',new Set(ys).size===1&&new Set(hs).size===1,JSON.stringify([ys,hs]));
    T(nm+' 오류 없음',p.errs.length===0,p.errs.join('|'));
    if(!o.calLook&&!o.theme){
      const j=await p.evaluate(()=>{let x='';window.AndroidBridge.setWidgetData=v=>{x=v;};__wx.pushWidgetNow();return JSON.parse(x);});
      const w=k=>j.days.find(x=>x.k===k);
      T('위젯 19일: 띠 두 줄 (pl 2 · mk "ppm")',w('2026-10-19').pl.length===2&&w('2026-10-19').mk==='ppm'&&w('2026-10-19').ms[1]==='ㅛ',JSON.stringify(w('2026-10-19')));
      T('위젯 21일: 빈자리 + 띠 + 메모 3 (mk "epmmm" · 줄 맞춤은 위젯이)',w('2026-10-21').mk==='epmmm'&&w('2026-10-21').pl[0]===0,JSON.stringify([w('2026-10-21').mk,w('2026-10-21').pl,w('2026-10-21').ms]));
      T('위젯 18일: 주 첫날 이름 없음',w('2026-10-18').ms[0]===' ',JSON.stringify(w('2026-10-18').ms));
    }
    await p.close();
  }
  await b.close();T.sum();
})();

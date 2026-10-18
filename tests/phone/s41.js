// 가족이 서버에 올린 값(근무타입 색 · 이름 · 메모/요청 번호 · 날짜 …)마다 악성 글자를 넣은 상태로 앱을 돌려 봄
// → 어떤 화면에서도 글자가 "그대로 HTML 로" 들어가거나(= raw sink) 실행되면(= __xss) 실패
const {chromium,boot}=require('./x_common.js');
const {poisoned}=require('./x_poison.js');
const {monkey}=require('./x_monkey.js');
const {mkT}=require('./lib.js');
const HOOK=`
(function(){
  const desc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  window.__sinks={};
  const rec=(html)=>{
    if(typeof html!=='string'||html.indexOf('<img src=x onerror')<0)return;
    const re=/__xss=window\\.__xss\\|\\|\\{\\}\\)\\['([^']+)'\\]/g;let m;
    const st=(new Error().stack||'').split('\\n').slice(2,5).map(s=>s.replace(/.*index\\.html:/,'L').replace(/\\)$/,'')).join(' < ');
    while((m=re.exec(html))){const idx=html.lastIndexOf('<img src=x',m.index);if(idx<0)continue;(window.__sinks[m[1]]=window.__sinks[m[1]]||new Set()).add(st);}
  };
  Object.defineProperty(Element.prototype,'innerHTML',{configurable:true,get:desc.get,set(v){rec(v);return desc.set.call(this,v);}});
  const iah=Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML=function(w,h){rec(h);return iah.call(this,w,h);};
})();`;
(async()=>{
  const T=mkT();const b=await chromium.launch();
  const agg={},fired=new Set();
  const take=async p=>{
    const o=await p.evaluate(()=>{const r={};for(const [k,v] of Object.entries(window.__sinks||{}))r[k]=[...v];return {r,x:Object.keys(window.__xss||{})};});
    for(const [k,v] of Object.entries(o.r)){(agg[k]=agg[k]||new Set());v.forEach(x=>agg[k].add(x));}
    o.x.forEach(k=>fired.add(k));
  };
  const p=await boot(b,poisoned(),{preInit:HOOK});
  const click=async(sel)=>{await p.evaluate(s=>{const e=document.querySelector(s);e&&e.click();},sel);await p.waitForTimeout(120);await take(p);};
  await take(p);
  await click('#nav [data-tab="fam"]');
  await click('[data-act="feed-sheet"]');
  for(const t of ['req','memo','all'])await click(`[data-act="feed-tab"][data-v="${t}"]`);
  await click('[data-act="view-requests"]');
  await click('#sheet [data-act="close"]');
  await click('#nav [data-tab="fam"]');
  for(const u of ['mom','sis']){
    await click(`[data-act="fam-viewcal"][data-u="${u}"]`);
    await p.evaluate(()=>{document.querySelectorAll('[data-act="vc-day"]').forEach((c,i)=>{if(i%9===0)c.click();});});
    await p.waitForTimeout(200);await take(p);
    await p.evaluate(()=>window.__onBack&&window.__onBack());await p.waitForTimeout(100);
  }
  await click('#nav [data-tab="cal"]');
  for(const k of ['2026-10-13','2026-10-14','2026-10-22','2026-10-23','2026-10-24','2026-10-26','2026-10-27']){
    await p.evaluate(k=>{const c=document.querySelector(`.track .panel:nth-child(2) .cell[data-k="${k}"]`);c&&c.click();},k);
    await p.waitForTimeout(150);await take(p);
    await p.evaluate(()=>{const b=document.querySelector('#sheet [data-act="close"]');b&&b.click();});
  }
  await click('[data-act="feed-req"]');await click('#sheet [data-act="close"]');
  await click('#nav [data-tab="set"]');await click('[data-act="link-open"]');
  const errs0=p.errs.length;
  for(const seed of [1,2,3]){
    const q=await boot(b,poisoned(),{wait:500,preInit:HOOK});
    await monkey(q,{seed,steps:150});
    await take(q);await q.ctx.close();
  }
  const raw=Object.keys(agg);
  raw.forEach(k=>console.log('  raw sink:',k.padEnd(18),[...agg[k]].slice(0,2).join(' | ')));
  T('악성 글자가 그대로 HTML 에 들어간 곳 없음 (raw sink 0)',raw.length===0,raw.join(','));
  T('악성 글자가 실행된 곳 없음',fired.size===0,[...fired].join(','));
  T('가족 탭 · 가족 달력을 열어도 첫 화면 오류 없음',p.errs.filter(e=>!/ERR_FILE_NOT_FOUND/.test(e)).length===0,p.errs.slice(0,2).join(' | '));
  await b.close();T.sum();
})();

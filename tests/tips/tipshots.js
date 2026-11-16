// 이럴 땐 이렇게 사진 다시 찍기: node tests/tips/tipshots.js  → app/src/main/assets/tips/*.webp (390x300 · 누를 곳 주황 테두리)
// 화면이 바뀌면 다시 돌려서 사진을 새로 맞춰요. 사진 하나 = shot(이름, 화면 준비, 누를 곳 선택자)
const {chromium,boot,base}=require('../phone/lib.js');
const {execFileSync}=require('child_process');
const OUT='/home/user/sin/app/src/main/assets/tips/';
const RING='.tipring{outline:3px solid #ff8a00!important;outline-offset:3px;border-radius:10px;position:relative;z-index:99}.prow.tipring{outline-offset:-4px;border-radius:16px}';
const shots=[
  ['t1_a',async p=>{await p.click('#nav [data-tab="alarm"]');},'#top [data-act="aadd"]'],
  ['t1_b',async p=>{await p.click('#nav [data-tab="alarm"]');await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('[data-act="aedit"][data-id="al1"]').click());},'#page.open [data-act="drep"][data-v="1"]'],
  ['t16_a',async p=>{await p.evaluate(()=>__wx.openDay('2026-10-31'));},'#sheet.open .mdet'],
  ['t16_b',async p=>{await p.evaluate(()=>__wx.openDay('2026-10-31'));await p.waitForTimeout(500);await p.click('#sheet.open .mdet');},'[data-act="md-rep"]'],
  ['t11_a',async p=>{await p.click('#nav [data-tab="set"]');},'#view [data-act="more-pattern"]'],
  ['t13_a',async p=>{await p.evaluate(()=>{const x=document.createElement('button');x.dataset.act='more-pattern';document.body.appendChild(x);x.click();x.remove();});},'#page.open [data-act="personal-on"]'],
];
(async()=>{const b=await chromium.launch();
for(const [name,prep,sel] of shots){
  const p=await boot(b,{...base,alarms:[{id:'al1',on:true,shift:'주',time:'07:00',label:'주간 출근',days:[],sound:true}]},{w:390,h:844});
  await p.waitForTimeout(800);await p.addStyleTag({content:RING});
  await prep(p);await p.waitForTimeout(600);
  const y=await p.evaluate(sel=>{const e=document.querySelector(sel);e.classList.add('tipring');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return r.y+r.height/2;},sel);
  await p.waitForTimeout(250);
  const top=Math.max(0,Math.min(844-300,Math.round(y-150)));
  await p.screenshot({path:'/tmp/_tip.png',clip:{x:0,y:top,width:390,height:300}});
  execFileSync('python3',['-c',`from PIL import Image;Image.open('/tmp/_tip.png').save('${OUT}${name}.webp','WEBP',quality=80)`]);
  console.log(name,'ok');await p.close();}
await b.close();})();

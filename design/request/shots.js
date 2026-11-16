// 근무 요청 화면 (가족 폰 → 근무자 달력) 지금 모습 찍기
const {chromium,boot}=require('../../tests/phone/lib.js');const {rich}=require('../../tests/phone/x_common.js');
(async()=>{const b=await chromium.launch();
 const s=rich();
 s.link={hid:'h1',role:'guest',name:'아내',perm:'write',mode:'own',uid:'mom',hash:''};
 s.fam2.members=[{uid:'dad',role:'host',name:'남편',mode:'own'},{uid:'mom',role:'guest',name:'아내',mode:'own'}];
 const mk=x=>Object.assign({v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],overrides:{},holRest:false,updatedAt:1760000000000},x);
 s.fam2.scheds={dad:mk({}),mom:mk({anchor:'2026-10-05'})};s.fam2.memos={};s.fam2.reqIn={};s.fam2.reqOut={};s.fam2.reqCc={};s.requests=[];s.events=[];
 const p=await boot(b,s,{w:390,h:844});await p.waitForTimeout(800);
 const O=__dirname;
 await p.evaluate(()=>{const x=document.querySelector('[data-act="stkshare-no"]');x&&x.click();__wx.closePop&&__wx.closePop();});await p.waitForTimeout(300);await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(600);
 await p.evaluate(()=>{const e=document.querySelector('[data-act="fam-viewcal"][data-u="dad"]');e&&e.click();});await p.waitForTimeout(900);
 await p.screenshot({path:O+'/now_cal.png'});
 await p.evaluate(()=>{const c=[...document.querySelectorAll('#page [data-act="vc-day"]')].find(x=>x.dataset.k==='2026-10-17');c&&c.click();});await p.waitForTimeout(900);
 await p.screenshot({path:O+'/now_day.png'});
 await p.evaluate(()=>{const x=document.querySelector('#sheet [data-act="vc-rq"]');x&&x.click();});await p.waitForTimeout(600);await p.screenshot({path:O+'/now_rq.png'});const acts=await p.evaluate(()=>[...document.querySelectorAll('#sheet [data-act]')].map(x=>x.dataset.act+':'+(x.innerText||'').trim().slice(0,12)).join(' | '));console.log(acts);
 await b.close();})();

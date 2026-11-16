// 보기만 가족(아내 폰) 가족 탭 지금 모습
const {chromium,boot}=require('../../tests/phone/lib.js');const {rich}=require('../../tests/phone/x_common.js');
(async()=>{const b=await chromium.launch();const s=rich();
 s.link={hid:'h1',role:'guest',name:'아내',perm:'write',mode:'view',uid:'mom',hash:''};
 s.fam2.members=[{uid:'dad',role:'host',name:'남편',mode:'own'},{uid:'mom',role:'guest',name:'아내',mode:'view'}];
 const mk=x=>Object.assign({v:1,patternName:'4조2교대',teamName:'B조',pattern:['주','주','휴','휴','야','야','휴','휴'],anchor:'2026-10-02',types:[{k:'주',name:'주간',color:'v:day',rest:false},{k:'야',name:'야간',color:'v:night',rest:false},{k:'휴',name:'휴무',color:'',rest:true}],times:{'주':['07:00','19:00'],'야':['19:00','07:00']},overrides:{},holRest:false,updatedAt:1760000000000},x);
 s.fam2.scheds={dad:mk({})};s.fam2.memos={};s.fam2.reqIn={};s.fam2.reqOut={};s.fam2.reqCc={};s.requests=[];s.events=[];
 for(const [n,T] of [['rest',Date.UTC(2026,9,12,3)],['work',Date.UTC(2026,9,10,3)]]){
 const p=await boot(b,s,{w:390,h:844,T});await p.waitForTimeout(800);
 await p.waitForTimeout(900);await p.evaluate(()=>{const x=document.querySelector('[data-act="stkshare-no"]');x&&x.click();});await p.waitForTimeout(400);
 await p.click('#nav [data-tab="fam"]');await p.waitForTimeout(800);await p.screenshot({path:__dirname+'/now_'+n+'.png'});await p.close();}
 await b.close();})();

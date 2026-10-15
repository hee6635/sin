const {chromium,boot,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const p=await boot(b,base,{touch:true});
 await p.evaluate(()=>document.querySelector('[data-act="more-share"]')||0);
 await p.evaluate(()=>{document.querySelector('#nav [data-tab="set"]').click();});await p.waitForTimeout(200);
 await p.evaluate(()=>document.querySelector('[data-act="more-share"]').click());await p.waitForTimeout(400);
 console.log('share-mode',await p.evaluate(()=>document.querySelector('#app').classList.contains('share-mode')));
 await p.evaluate(()=>document.querySelector('.cal-mid h1').click());await p.waitForTimeout(300);
 console.log('picker open',await p.evaluate(()=>document.querySelector('#pop').classList.contains('open')));
 // swipe
 console.log('track',await p.evaluate(()=>!!document.querySelector('#track')));
 await p.screenshot({path:'d1.png'});await b.close();})();

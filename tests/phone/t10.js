const {chromium,boot,mkT,base}=require('./lib.js');
(async()=>{const b=await chromium.launch();const T_=mkT();
// ===== 새 설치 기본값
let p=await boot(b,null);
// 새 설치는 시작 화면
T_('시작 화면에 카드 4개(근무표 · 개인 캘린더 · 초대 · 백업)',(await p.$$eval('#onboard .choice b',a=>a.map(x=>x.textContent))).join('|')==='내 근무표 만들기|개인 캘린더로 쓸게요|초대 코드가 있어요|백업 불러오기');
await p.click('#onboard [data-act="ob-personal"]');await p.waitForTimeout(500);
let S=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
T_('개인 캘린더: onboarded · noPat · myset=false · personal',S.onboarded&&S.noPat&&S.myset===false&&S.personal===true,JSON.stringify([S.onboarded,S.noPat,S.myset,S.personal]));
T_('개인 캘린더: 달력 위 "개인 캘린더" 글자 · 근무표 만들기 버튼 없음',(await p.$eval('.cal-mid .sub',e=>e.innerText)).includes('개인 캘린더')&&!(await p.$('.cal-mid .sub .mkp')));
T_('새 설치: 근무 띠 기본 꺼짐(body.noband)',await p.evaluate(()=>document.body.classList.contains('noband'))&&S.showBand===false,String(S.showBand));
T_('새 설치: 화면 모드 system · html data-theme 없음',(S.theme==='system'||S.theme===undefined)&&!(await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))));
await p.close();
// ===== 예전 데이터(showBand 없음) 는 띠 켜짐 그대로
p=await boot(b,{...base});
S=await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')));
T_('v0.97 근무 띠 없앰: 예전 데이터도 띠 숨김',await p.evaluate(()=>document.body.classList.contains('noband')));
// ===== 화면 모드
await p.click('#nav [data-tab="set"]');await p.waitForTimeout(300);await p.click('[data-act="more-look"]');await p.waitForTimeout(300);
const chips=await p.$$eval('[data-act="thememode"]',a=>a.map(x=>x.textContent+(x.classList.contains('on')?'*':'')));
T_('설정 › 앱: 화면 모드 라이트/다크/시스템(시스템 선택됨)',chips.join('|')==='라이트|다크|시스템*',chips.join('|'));
await p.click('[data-act="thememode"][data-v="dark"]');await p.waitForTimeout(300);
T_('다크: html[data-theme=dark] · 앱 브릿지에 알림',(await p.evaluate(()=>document.documentElement.getAttribute('data-theme')))==='dark'&&(await p.evaluate(()=>window.__theme))==='dark');
const bg=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
T_('다크: --bg 가 어두운 색',bg==='#111318',bg);
await p.click('[data-act="thememode"][data-v="light"]');await p.waitForTimeout(300);
T_('라이트: data-theme=light',(await p.evaluate(()=>document.documentElement.getAttribute('data-theme')))==='light');
await p.click('[data-act="thememode"][data-v="system"]');await p.waitForTimeout(300);
T_('시스템: data-theme 제거 · 저장됨',!(await p.evaluate(()=>document.documentElement.getAttribute('data-theme')))&&(await p.evaluate(()=>JSON.parse(localStorage.getItem('eonjeswieo:v1')).theme))==='system');
// 띠 설정 켜기
T_('근무 띠 설정 줄 없음',!(await p.$('#showBand')));await p.click('#page [data-act="page-close"]');await p.waitForTimeout(300);
// ===== 부가기능 문구 · 월 포스트잇
await p.click('[data-act="more-addons"]');await p.waitForTimeout(300);
const addtxt=await p.$eval('#page',e=>e.innerText);
T_('부가 기능: 내 상태 설명이 "그날 근무 형태만 보여요"',addtxt.includes('끄면 그날 근무 형태만 보여요')&&!addtxt.includes('주 · 야 · 휴만'));
await p.evaluate(()=>document.querySelector('[data-act="page-close"]').click());await p.waitForTimeout(200);
await p.click('#nav [data-tab="cal"]');await p.waitForTimeout(300);
T_('달력 위: 포스트잇 버튼(aria 월 포스트잇) · 이모티콘 📝 없음',(await p.$eval('[data-act="open-board"]',e=>e.getAttribute('aria-label')))==='월 포스트잇'&&!(await p.$eval('[data-act="open-board"]',e=>e.textContent)).includes('📝'));
await p.click('[data-act="open-board"]');await p.waitForTimeout(400);
T_('월 포스트잇 화면 제목 "10월 포스트잇"',(await p.$eval('.pi-hd .m b',e=>e.textContent))==='10월 포스트잇');
await p.evaluate(()=>document.querySelector('[data-act="page-close"]').click());await p.waitForTimeout(200);
const mailMargin=await p.$eval('.rqmail',e=>getComputedStyle(e).marginRight).catch(()=>'none');
console.log('rqmail margin',mailMargin);
T_('JS 오류 없음',p.errs.length===0,p.errs.join(' | '));
await p.close();
await b.close();T_.sum();})();

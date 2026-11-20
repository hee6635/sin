/* ================= 알람 설정 (전체 화면) ================= */
function newAlarm(){return {isNew:true,id:uid(),label:'',time:'06:00',shift:S.types[0]?S.types[0].k:'주',offset:0,on:true,sound:true,vib:true,vol:100,ramp:false,tone:'',toneName:'기본 알람음',snMin:5,snMax:3,once:false,until:0,wx:true,wxOnly:false};}
let alSnd=false;   // 알람 설정에서 "소리 · 다시 울림"을 펼쳤는지
function openAlarmPage(){
  // v0.145 새 모양: 위 칸(근무 색 · 큰 시간 · 근무 · 전날/당일/다음날) · 반복 / 울릴 때 / 함께 묶음 · 설명 줄 없음
  const a=draft,t=ampm(a.time);
  const ch=(arr,curv,act)=>arr.map(([v,l])=>`<button class="${String(curv)===String(v)?'on':''}" data-act="${act}" data-v="${v}">${l}</button>`).join('');
  const kind=!a.sound&&!a.vib?'silent':'';
  const wxo=a.wxOnly&&ad('wx');
  const sndV=[a.sound?`${a.vol}%`:'',a.vib?'진동':''].filter(Boolean).join(' · ')||'무음';
  const snzV=a.snMax===0?'끔':a.snMax===-1?`${a.snMin}분 · 계속`:`${a.snMin}분 · ${a.snMax}번`;
  const tc=x=>{const c=tColors(x);return c?c.bg:(x.rest?'var(--restx)':'var(--muted)');};
  const st=typeOf(a.shift),sc=a.shift==='*'||!st?'var(--accent)':(tColors(st)?tColors(st).bg:'var(--restx)');
  const pills=[...S.types.map(x=>[x.k,x.name,tc(x)]),['*','매일','var(--accent)']].map(([v,l,c])=>`<button class="${String(a.shift)===String(v)?'on':''}" data-act="dshift" data-v="${esc(v)}" style="--d:${c}"><i></i>${esc(l)}</button>`).join('');
  const tg=(id,on,dis)=>`<label class="sw"><input type="checkbox" id="${id}" ${on?'checked':''} ${dis?'disabled':''}><i></i></label>`;
  const sub=alSnd&&!wxo?`<div class="npsub">
      <div class="prow"><div class="pl2">알람종류</div><div class="chips"><button class="${a.sound?'on':''}" data-act="dsound">소리</button><button class="${a.vib?'on':''}" data-act="dvib">진동</button><button class="${kind?'on':''}" data-act="dsilent">무음</button></div></div>
      <div class="prow col"><div class="pl2">볼륨</div><input type="range" id="aVol" min="10" max="100" step="5" value="${a.vol}" ${a.sound?'':'disabled'}></div>
      <div class="prow"><div class="pl2">점점 커지는 소리</div>${tg('aRamp',a.ramp,!a.sound)}</div>
      <div class="prow tap" data-act="dtone"><div class="pl2">알람음</div>${isFileTone(a.tone)&&hasBridge('previewTone')?'<button class="btn ghost sm" data-act="dtone-play">▶ 듣기</button>':''}<div class="pv" style="max-width:52%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.toneName||'기본 알람음')} ›</div></div>
      <div class="prow"><div class="pl2">다시 울림 간격</div><div class="chips">${ch([[5,'5분'],[10,'10분'],[15,'15분']],a.snMin,'dsnmin')}</div></div>
      <div class="prow col"><div class="pl2">다시 울림 횟수</div><div class="chips left">${ch([[0,'끔'],[1,'1번'],[3,'3번'],[5,'5번'],[-1,'계속']],a.snMax,'dsnmax')}</div></div>
    </div>`:'';
  openPage(`
    ${pageHead(a.isNew?'알람 추가':'알람 설정','<button class="ok" data-act="asave">저장</button>')}
    <div class="pg-b np">
      <section class="nphero" style="--sc:${sc}">
        <button type="button" class="timebox" data-act="tpk" data-id="at" data-type="time"><em>${t.ap}</em>${t.tm.replace(/^0(?=\d:)/,'')}</button><input type="hidden" id="at" value="${a.time}">
        <div class="nppills">${pills}</div>
        <div class="npseg">${ch([[-1,'전날'],[0,'당일'],[1,'다음날']],a.offset||0,'doff')}</div>
      </section>
      <div class="pg-cap">반복</div>
      <div class="pg-sec">
        ${npRow('repeat','울리기',`<input type="checkbox" id="aRepeat" ${a.once?'':'checked'} hidden><div class="npseg sm"><button class="${a.once?'':'on'}" data-act="drep" data-v="0">매번</button><button class="${a.once?'on':''}" data-act="drep" data-v="1">한 번만</button></div>`,a.once&&onceDay(a)?{d:`${onceDay(a)} 한 번 울려요`}:{})}
        ${npRow('calendar-off','공휴일엔 쉬기',tg('aNoHol',a.noHol))}
      </div>
      <div class="pg-cap">울릴 때</div>
      <div class="pg-sec">
        ${wxo?`${npRow('bell','알림 소리',`<div class="chips"><button class="${a.sound!==false?'on':''}" data-act="dwxsnd" data-v="1">소리</button><button class="${a.sound===false?'on':''}" data-act="dwxsnd" data-v="0">무음</button></div>`)}
          ${a.sound!==false?npRow('music','소리 고르기',(isFileTone(a.tone)&&hasBridge('previewTone')?'<button class="btn ghost sm" data-act="dtone-play">▶ 듣기</button>':'')+npVal(esc(a.tone?(a.toneName||'고른 소리'):'폰 기본 알림음')),{tap:1,act:'dtone'}):''}`
        :`${npRow('volume-2','소리와 진동',`<div class="pv npv">${esc(sndV)}${npi(alSnd?'chevron-down':'chevron-right',16)}</div>`,{tap:1,act:'dsnd-open'})}${sub}
          ${npRow('alarm-clock','다시 울림',npVal(esc(snzV)),{tap:1,act:'dsnd-open'})}`}
        ${npRow('tag','이름',`<input type="text" class="inl" id="al" value="${esc(a.label)}" placeholder="없음" maxlength="20">`)}
      </div>
      <div class="pg-cap">함께</div>
      <div class="pg-sec">
        ${!a.once&&!wxo?npRow('bell-ring','5분 전 미리 알림',tg('aPre',a.pre5!==false),{d:'먼저 깨면 이번만 끄기'}):''}
        ${ad('wx')?`${npRow('cloud-sun','날씨','')}<div class="npwx"><div class="npseg">${ch([['card','끈 뒤 보기'],['only','날씨만'],['off','안 함']],a.wxOnly?'only':a.wx!==false?'card':'off','dwx')}</div></div>`:''}
        ${wxo?'':npRow('file-text','알람 화면에 한 줄',tg('almsg',S.alarmMsg!==false),{d:'메모 · 할 일 · 근무 요청'})}
      </div>
      ${a.isNew?'':`<div class="pg-sec" style="margin-top:20px">${npRow('trash-2','알람 삭제','',{cls:'danger-row',act:'adel'})}</div>`}
    </div>`,'alarm');
}
const isFileTone=u=>/^file:/.test(u||'');
// 알람에서 안 쓰는 내 음악 파일은 앱 안에서 지우기
function cleanTones(){try{if(hasBridge('cleanTones'))window.AndroidBridge.cleanTones(JSON.stringify((S.alarms||[]).map(a=>a.tone).filter(isFileTone)));}catch(e){}}
window.__onTone=o=>{
  if(o&&o.error){toast(o.error);return;}
  if(!draft||!o||(o.req!==draft.id&&o.req!=='n:'+draft.id))return;   // (v0.143 "n:" = 날씨만 알람의 알림음)
  draft.tone=o.uri||'';draft.toneName=o.title||(o.req.startsWith('n:')?'기본 알림음':'기본 알람음');
  if(pageMode==='alarm')openAlarmPage();
};

/* ================= 더 보기 ================= */
/* 설정 목록 아이콘: 이모티콘 대신 같은 굵기 · 같은 색(보라) 선 아이콘 */
const LINE_ICON={'▦':'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 12h16M12 4v16"/>','🌓':'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>','▬':'<rect x="3" y="9" width="18" height="6" rx="3"/>','🔗':'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>','🔁':'<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>','🕐':'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>','👥':'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>','🏢':'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>','💊':'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>','📊':'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>','👪':'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>','👁':'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>','🎨':'<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>','🖼':'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>','☁️':'<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>','✉️':'<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>','🔒':'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>','🗑':'<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>','ℹ️':'<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>','🔤':'<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>'};
LINE_ICON['▣']='<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>';
Object.assign(LINE_ICON,{'📅':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>','📝':'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>','🧩':'<path d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v6h-5v-2a2 2 0 1 0-4 0v2H5v-5h2a2 2 0 1 0 0-4H5V6h5z"/>'});
// v0.135 설정 칸 아이콘 통일 (같은 굵기 · 크기 · 색)
Object.assign(LINE_ICON,{'🔔':'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>','💊':'<circle cx="12" cy="12" r="9"/><path d="M8.5 13.5a4 4 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>','☁️':'<path d="M17.5 19H8a5 5 0 1 1 1-9.9A6 6 0 0 1 20.6 11 4 4 0 0 1 17.5 19z"/>','🎨':'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>','👪':'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>','🖼':'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="M21 15l-5-5L5 21"/>','ℹ️':'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>','💡':'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>','🏢':'<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M12 17.5s-3-1.8-3-3.6a1.5 1.5 0 0 1 3-.6 1.5 1.5 0 0 1 3 .6c0 1.8-3 3.6-3 3.6z"/>','☀️':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>','👥':'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>','📊':'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>','📋':'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3M9 10h6M9 14h6M9 18h3"/>','☔':'<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 0 4 0"/>'});
const lineIcon=e=>LINE_ICON[e]?`<svg class="li" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LINE_ICON[e]}</svg>`:e;
// v0.97 설정 정리: 자주 쓰는 6개는 타일(값 요약) · 한 번 정하면 안 바꾸는 것은 "화면" · 알림은 "알림" · 정보는 "도움 · 정보" 안으로
function renderMore(){
  const guest=role()==='guest';
  const item=(e,t,act,v)=>`<div class="mi2" data-act="${act}"><span class="e">${lineIcon(e)}</span><span>${t}</span><small>${v||''} ›</small></div>`;
  const item2=(e,t,sub,act,v)=>`<div class="mi2" data-act="${act}"><span class="e">${lineIcon(e)}</span><span class="t2">${t}<i>${sub}</i></span><small>${v||''} ›</small></div>`;
  const tile=(e,t,sub,act,dot)=>`<button class="stile${dot?' dot':''}" data-act="${act}"><span class="e">${lineIcon(e)}</span><b>${t}</b><small>${sub||'&nbsp;'}</small></button>`;
  const lastB=S.drive&&S.drive.last?rel(S.drive.last):'';
  const issues=nativeIssues();
  const cap=t=>`<div class="pg-cap">${t}</div>`;
  const linkOk=!guest&&fbCfg();
  const famN=S.link&&S.fam2?(S.fam2.members||[]).length:0;
  // v0.156 새 모양(A): 묶음 내 근무 · 가족 · 앱 · 3칸씩 · 칸 아래 글 겹치지 않게 · 가족 연결 + 가족 목록 = "가족" 한 칸 · 이럴 땐 이렇게 = 넓은 한 줄
  const wgN=(()=>{try{return hasBridge('widgetCount')?+window.AndroidBridge.widgetCount()||0:-1;}catch(e){return -1;}})();
  const g1=[
    !guest&&!persAll()?tile('🔁','근무 패턴',S.noPat?(S.myset?'불규칙':'아직 안 만듦'):`${esc(S.patternName||'')} ${esc(myTeamLabel())}`,'more-pattern'):'',
    S.personal?tile('🔁','근무표 쓰기','개인 캘린더 끄기','personal-off'):'',
    tile('💊','스티커',`${slotDefs().filter(x=>!x.empty).length}개`,'stk-board'),
    hasBridge('setWidgetData')?tile('▣','위젯',wgN>0?`${wgN}개 사용 중`:wgN===0?'홈 화면에 없음':'홈 화면','more-widget'):''].filter(Boolean);
  const g2=[
    linkOk?tile('👪','가족',S.link?`${famN}명 연결`:'초대하기','link-open',!!(S.link&&S.fam2&&S.fam2.boardDot)):tile('👪','가족',`${(S.family||[]).length}명`,'fam-set'),
    tile('🖼','이미지 공유','달력 사진','more-share'),
    tile('☁️','백업',lastB||'안 함','more-backup')];
  const g3=[
    tile('🎨','화면',S.fontScale>100?'글자 크게':'글자 보통','more-look'),
    tile('🧩','부가 기능',`${addonCount()}개 켜짐`,'more-addons'),
    tile('ℹ️','도움 · 정보',appVersion(),'more-info')];
  const grp=(t,a)=>a.length?`${cap(t)}<div class="stiles">${a.join('')}</div>`:'';
  return `<div class="mlist mset" style="padding-bottom:24px">
    <button class="srch-entry" data-act="srch-open"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>${wlOn()?`메모 · ${esc(wlName())} 찾기`:'메모 찾기'}</button>
    ${issues.length?`<button class="mwarn" data-act="more-perm"><span class="npi">${npi('alert',20)}</span><b>알람이 잘 울리게</b><em>${issues.length}개 꺼짐${npi('chevron-right',16)}</em></button>`:''}
    ${grp('내 근무',g1)}${grp('가족',g2)}${grp('앱',g3)}
    <button class="mtips" data-act="tips-open"><span>${npi('bulb',22)}</span><b>이럴 땐 이렇게</b><small>상황별 사용법</small></button>
  </div>`;
}
/* ---- v0.118 💡 이럴 땐 이렇게: 상황별 팁 (묶음 접기 · 누르면 펼침 · 바로 가기) — 기능을 바꾸면 여기 글도 같이 고치기 (s79 가 바로 가기를 시험) ---- */
const TIPS=[["📅","달력 · 근무",[["근무가 바뀌었을 때 한 번에 고치기","날짜를 누르고 \"여러 날 칠하기\"를 눌러요. 근무를 고른 다음 날짜를 하나씩 누르거나 손가락으로 쭉 그으면 돼요.","tab:cal"],["조나 회사가 바뀌었어요","근무 패턴에서 새 패턴을 만들고 첫 칸 시작 날을 바뀌는 날로 정해요. \"이 날부터 새 패턴\"을 누르면 지난 근무표와 통계는 그대로 남아요.","more-pattern"],["근무표가 불규칙해요","근무 패턴에서 불규칙으로 바꾸고, 날짜마다 근무를 넣어요.","more-pattern"],["빨간 날엔 쉬는 회사예요","근무 패턴에서 \"공휴일엔 쉬어요\"를 켜면 공휴일 근무가 휴무로 바뀌어요.","more-pattern"],["휴직이나 퇴사로 근무 없이 쓰고 싶어요","근무 패턴 맨 아래 \"개인 캘린더로 쓰기\"를 눌러요. 근무표는 지우지 않고 그대로 둬요.","more-pattern"],["직접 바꾼 근무를 되돌리고 싶어요","근무 패턴의 \"패턴 제외 초기화\"에서 기간을 고르면 그 사이 직접 바꾼 근무만 패턴대로 돌아가요.","more-pattern"],["글자가 잘 안 보여요","설정 › 화면에서 배경을 \"또렷하게\"로 바꾸거나 글자 크기를 크게 해요.","more-look"],["이번 달 근무를 사진으로 보내기","설정 › 이미지 공유로 달력 사진을 만들어 메신저로 보내요.","more-share"]]],["📝","포스트잇 · 메모",[["메모 · 포스트잇 · 업무 메모는 뭐가 달라요?","메모는 그날 하루에 붙어요. 포스트잇은 그 달 내내 달력 위에 보이고, 할 일 줄을 체크할 수 있어요. 업무 메모는 근무 인수인계용이라 나만 보고 백업에서 빠져요.","tab:cal"],["이번 달 내내 기억할 것 붙여 두기","달력 위 포스트잇에 적어 두면 그 달 내내 보여요.","tab:cal"],["매달 1일 · 말일에 할 일 띄우기","메모 \"자세히\"에서 반복을 켜고 1일, 말일, 말일 하루 전 중에 골라요. \"주간인 날만\"처럼 근무에 맞출 수도 있어요.","tab:cal"],["가족에게도 보이는 메모","메모 \"자세히\"에서 \"가족에게\"를 골라요. 한 줄 입력칸에 쓴 메모는 나만 봐요.","tab:cal"],["근무 인수인계 적기","설정 › 부가 기능에서 업무 메모를 켜면 날짜마다 인수, 인계, 지시를 따로 적을 수 있어요.","more-addons"],["지난 메모나 인수인계 찾기","설정 맨 위 찾기 칸에 적어 보세요.","srch-open"]]],["💊","스티커",[["약 먹었는지 체크","스티커에서 약을 고르고 하루 몇 번 먹는지, 알림 시각을 정해요.","stk-board"],["운동이나 물 마시기 같은 습관 기록","스티커를 반복으로 깔아 두고 할 때마다 눌러요. 한 달 통계도 나와요.","stk-board"],["쉬는 날에만 하는 일","날짜를 누르고 스티커 붙이기 → 스티커를 고른 뒤 반복에서 \"근무 맞춤\" → 휴무를 고르면 쉬는 날에만 깔려요.","stk-board"],["학원 · 동아리 · 운동 날씨까지","스티커를 붙일 때(등록 화면) 맨 아래 \"학원 · 취미 · 동아리\"에서 활동 시간과 위치를 정해요. 끝나면 자동으로 완료돼요.","stk-board"],["반복 스티커를 그만하고 싶어요","그만두는 날의 스티커 창에서 \"그만하기\"를 눌러요. 지난 기록은 남아요.","tab:cal"],["스티커가 왜 안 붙지?","스티커는 하루에 4개까지만 보여요. 반복 조건에 안 맞는 날, 근무와 겹치는 활동, \"그만하기\"를 누른 뒤의 날짜에도 안 붙어요.","stk-board"],["아이 얼굴로 스티커 만들기","스티커 고르기에서 \"내 것\"을 누르고 사진을 넣어요.","stk-board"],["그날 기분 남기기","스티커 고르기의 기분 탭에서 골라요. 한 달 통계로 기분을 돌아볼 수 있어요.","stk-board"],["아이 약이나 준비물 챙기기","아이 달력 날짜 창에서 스티커를 더하고 \"아이 · 육아\" 탭에서 골라요. 유치원 가는 날만 깔리게 할 수도 있어요.","tab:fam"]]],["☔","날씨",[["아침 알람 끄고 바로 날씨 보기","알람 설정에서 날씨를 \"끈 뒤 보기\"로 두면 알람을 끌 때 날씨 카드가 떠요.","tab:alarm"],["알람 없이 출근 전 날씨만","알람 설정에서 날씨를 \"날씨만\"으로 두면 알람 대신 날씨 알림만 와요.","tab:alarm"],["아이 등하교나 학원 날씨","아이 달력 날짜 창의 \"일정 패턴\"에서 일정 시간과 위치를 정해요. 학원은 스티커의 활동으로 정해요.","tab:fam"],["날씨 지역 바꾸기","근무 패턴의 \"위치\"에서 집과 직장 동네를 골라요.","more-pattern"]]],["👪","가족",[["아이나 가족 일정 같이 보기","설정 › 가족에서 \"가족 추가\"를 누르고 학교, 회사, 교대 중에 골라요.","fam-set"],["유치원에서 학교로 가요","아이 달력 날짜 창의 \"일정 패턴\"에서 \"이 날부터 새 일정\"을 눌러요. 그 전 날짜는 예전 그대로 남아요.","tab:fam"],["가족과 근무표 주고받기","가족 연결에서 초대 코드를 보내요.","link-open"],["가족에게 그날 쉬어 달라고 부탁하기","가족 근무자 달력에서 날짜를 눌러 쉬는 날로 요청해요. 받는 사람이 확정하면 달력에 바로 들어가요.","link-open"],["내 달력 없이 가족 것만 보고 싶어요","가족 연결에서 \"내 근무표를 가족에게 보여요\"를 끄면 달력 탭이 가족 달력으로 바뀌어요.","link-open"],["가족이 다 같이 쉬는 날 찾기","설정 › 부가 기능에서 \"같이 쉬는 날\"을 켜요.","more-addons"],["백업이랑 구글 연결은 뭐가 달라요?","백업은 근무표 · 메모 · 스티커를 구글 드라이브에 저장해 둬요. 구글 연결은 가족방 자리(방장 권한)를 지켜요. 폰을 바꿀 땐 둘 다 해 두세요.","more-backup"],["폰을 바꿔도 가족방 그대로","가족 연결에서 구글 계정을 연결해 두면 새 폰에서 가족방을 불러올 수 있어요.","link-open"],["구글 계정이 이미 다른 기기에 연결돼 있대요","앱을 다시 깔았거나 옛 폰에 연결했던 거예요. 가족 연결에서 [연결하기]를 누르고 \"예전 연결 풀고 이 폰에 연결\"을 고르면 돼요. 방장이면 꼭 해 두세요. 안 하면 폰을 바꿀 때 방장 권한을 못 찾아요.","link-open"],["가족을 빼고 싶어요","방장도 혼자서는 못 빼요. 가족 과반이 찬성해야 빠져요. 30일 넘게 안 들어온 사람이나 내가 초대한 지 하루가 안 된 사람은 바로 뺄 수 있어요.","link-open"],["가족 메모와 근무 요청 무료 횟수","가족 메모, 근무 요청, 새 가족 포스트잇은 합쳐서 처음 10건까지 무료예요.","link-open"]]],["⏰","알람 · 알림",[["내일 하루만 일찍 일어나야 해요","알람을 하나 더 만들고 울리기를 \"한 번만\"으로 골라요. 원래 알람은 카드의 \"이번만 끄기\"로 하루 쉬게 해요.","tab:alarm"],["먼저 깼는데 알람이 울릴 것 같아요","알람 설정에서 \"5분 전 미리 알림\"을 켜 두면, 울리기 5분 전에 소리 없는 알림이 떠서 이번만 끌 수 있어요.","tab:alarm"],["야간 뒤 낮잠 땐 알림을 조용히","가족 연결의 \"자는 시간엔 소리 없이\"를 켜요.","link-open"]]],["💰","통계 · 수당",[["무급 휴가는 월급에서 빼고 싶어요","근무 종류 편집에서 \"무급\"을 켜면 그 날만큼 빼요. 연차는 빼지 않아요.","more-addons"],["이번 달 월급이 얼마일지","설정 › 부가 기능의 \"근무 통계 · 수당\"에서 고정급과 명세서 한 장으로 맞춰요.","more-addons"],["연장 근무 기록","근무 통계를 켜면 날짜 창에 연장 칸이 생겨요. 가족에게도 늦게 끝나는 게 보여요.","tab:cal"]]],["📱","그 밖",[["홈 화면에서 근무 바로 보기","위젯을 홈 화면에 놓아요.","more-widget"],["폰을 바꿔도 데이터 지키기","설정 › 백업에서 구글 드라이브 자동 백업을 켜요.","more-backup"],["실수로 옛날 백업을 복원했어요","설정 › 백업의 \"복원 직전으로 되돌리기\"를 눌러요.","more-backup"]]]];
// v0.148 자세히: 이럴 때 · 단계 · 사진 (사진은 tips/ · tests/tipshots.js 가 실제 앱을 찍음)
const TIPD={"내일 하루만 일찍 일어나야 해요": {"w": "다음 주 수요일만 평소보다 1시간 일찍 나가야 할 때 써요. 원래 알람은 그대로 두고 한 번만 울릴 알람을 하나 더 만들어요.","s": [["아래 <b>알람</b> 탭에서 오른쪽 위 <b>＋</b>를 눌러요.","t1_a"],["그날 근무를 고르고 시간을 정해요. 그날이 주간이면 <b>주간</b>을 고르고 오전 5:00으로 맞춰요."],["울리기에서 <b>한 번만</b>을 골라요. 아래에 울릴 날짜가 보이면 맞게 된 거예요.","t1_b"],["오른쪽 위 <b>저장</b>을 눌러요. 그날 원래 알람도 울리면 \"그날만 건너뛸까요?\"가 떠요. <b>그날만 건너뛰기</b>를 누르면 돼요."],["원래 알람만 하루 쉬고 싶을 땐 알람 카드의 <b>이번만 끄기</b>를 눌러요. 울리기 하루 전부터 보여요."]]},"연장 근무 기록": {"w": "오늘 퇴근이 2시간 늦어졌을 때 써요. 남겨 두면 이번 달 연장 시간과 예상 월급에 들어가고, 가족 폰에도 늦게 끝나는 게 보여요.","pre": "먼저 설정 › 부가 기능에서 <b>근무 통계 · 수당</b>을 켜 주세요.","s": [["달력에서 그 날짜를 눌러요. 근무 줄 끝에 <b>연장</b>이 있어요.","t2_a"],["<b>+2시간</b>을 누르면 퇴근이 늦춰지고 \"연장 2시간\"이 떠요. 한 번 더 누르면 시간이 더 붙어요.","t2_b"],["정확한 시각을 넣고 싶으면 <b>실제 퇴근</b> 칸을 눌러 고쳐요."],["창을 닫으면 저장돼요. 달력 날짜 칸에 \"+2시간\"이 붙어요."]]},"근무가 바뀌었을 때 한 번에 고치기": {"w": "다음 달 근무표가 나왔는데 여러 날이 패턴과 다를 때 써요. 하루씩 열지 않고 붓으로 칠하듯 한 번에 고쳐요.","s": [["달력에서 아무 날짜나 눌러요. 근무 줄 오른쪽에 <b>여러 날 칠하기</b>가 있어요.","t3_a"],["칠할 근무(예: 휴무)를 고르고 달력 날짜를 누르거나 손가락으로 쭉 그어요."],["다 칠했으면 <b>완료</b>를 눌러요. 가족과 연결돼 있으면 가족 폰에도 바뀐 근무가 가요."]]},"약 먹었는지 체크": {"w": "아침, 저녁 약을 먹었는지 헷갈릴 때 써요. 달력 날짜 위에 스티커로 체크하고 시각이 되면 알림도 받아요.","s": [["달력 날짜의 <b>윗부분</b>을 누르면 스티커 창이 열려요.","t4_a"],["<b>스티커 붙이기</b>를 눌러 약을 고르고, 하루 몇 번 먹는지와 알림 시각을 정해요. 반복은 \"매일\"로 둬요."],["먹을 때마다 그 칸을 눌러요. 하루 두 번 먹는 약은 1/2, 2/2로 채워져요."]]},"가족에게도 보이는 메모": {"w": "\"토요일 장모님 생신\"처럼 가족 폰에도 보이게 하고 싶을 때 써요.","pre": "먼저 가족 연결이 돼 있어야 해요.","s": [["날짜를 누르고 메모 줄 오른쪽 <b>자세히</b>를 눌러요. 한 줄 입력칸에 쓴 메모는 나만 봐요.","t5_a"],["<b>가족에게</b>를 고르고 적어요. 시간과 색도 여기서 정해요."],["저장하면 가족 폰에 알림이 가고 달력에 ♥로 보여요."]]},"이번 달 내내 기억할 것 붙여 두기": {"w": "\"이번 달 안에 자동차 보험 갱신\"처럼 날짜는 없지만 한 달 내내 봐야 할 게 있을 때 써요.","s": [["달력 왼쪽 위 <b>노란 포스트잇</b>을 눌러요.","t6_a"],["<b>＋</b>를 눌러 할 일이나 메모를 적어요. 할 일은 줄마다 체크할 수 있어요."],["포스트잇을 누르면 크게 열려요. 줄을 눌러 체크하고, <b>수정하기</b>로 고쳐요. 다 하면 가족에게 \"다 했어요\" 소식이 가요."]]},"학원 · 동아리 · 운동 날씨까지": {"w": "아이 학원이 끝나는 저녁 7시에 비가 오는지, 동호회 시간 날씨는 어떤지 같이 보고 싶을 때 써요.","pre": "먼저 설정 › 부가 기능에서 <b>출퇴근 시간 · 날씨</b>를 켜 주세요.","s": [["날짜를 누르고 <b>스티커 붙이기</b>에서 그 스티커를 골라요."],["맨 아래 <b>학원 · 취미 · 동아리</b>를 펼쳐요."],["활동 시간과 위치를 정하면 날짜 창 날씨에 그 시간 칸이 생기고, 끝나면 자동으로 완료돼요. 근무와 겹치는 날은 빠져요."]]},"반복 스티커를 그만하고 싶어요": {"w": "헬스장을 그만뒀는데 운동 스티커가 매일 계속 깔릴 때 써요. 지난 기록은 남기고 앞으로만 없애요.","s": [["그만두는 날의 스티커 창에서 그 스티커 줄 오른쪽 <b>⋯</b>를 눌러요."],["<b>이날부터 떼기</b>를 누르면 그날부터 안 깔려요. 지난 체크와 통계는 그대로예요."],["기록까지 모두 없애려면 설정 › 스티커에서 그 칸을 눌러 <b>지우기</b>를 눌러요."]]},"가족과 근무표 주고받기": {"w": "남편과 아내 폰에서 서로의 근무를 보고, 바뀌면 바로 알고 싶을 때 써요.","s": [["<b>가족</b> 탭 오른쪽 위 톱니바퀴(또는 설정 › 가족 목록)에서 <b>가족 연결</b>을 눌러요.","t9_a"],["먼저 하는 사람이 가족방을 만들고 <b>초대 코드</b>를 메신저로 보내요."],["받은 사람은 같은 화면에서 코드를 넣어요. 이제 근무가 바뀌면 서로 소식이 오고, 소식의 근무 기록에서 언제 바뀌었는지도 볼 수 있어요."]]},"가족에게 그날 쉬어 달라고 부탁하기": {"w": "\"그날 장모님 생신인데 쉴 수 있어?\"처럼 가족 근무를 바꿔 달라고 부탁할 때 써요.","pre": "먼저 가족 연결이 돼 있어야 해요.","s": [["가족 근무자 달력에서 그 날짜를 눌러요."],["<b>근무 변경 요청</b>에서 원하는 근무(예: 휴무)를 고르고 한마디 적어 <b>요청 보내기</b>를 눌러요."],["받는 사람은 소식에서 <b>수락</b>, <b>보류</b>, <b>거절</b> 중에 골라요. 수락하면 달력에 바로 들어가고 근무 기록에도 남아요."]]},"매달 1일 · 말일에 할 일 띄우기": {"w": "카드값 확인이나 관리비처럼 매달 같은 날 해야 하는 일이 있을 때 써요.","s": [["달력에서 그 날짜를 누르고, 메모 줄의 <b>자세히</b>를 눌러요.","t16_a"],["<b>반복</b>을 눌러 1일, 말일, 말일 하루 전 중에 골라요.","t16_b"],["근무에 맞출 수도 있어요. <b>주간인 날만</b>을 고르면 그날이 주간일 때만 뜨고, 아니면 다음 근무 날로 넘어가요."]]}};

// v0.136 나머지 자세히 (단계가 여러 개인 것만 · 한두 번 누르면 끝나는 것은 한 줄 그대로)
Object.assign(TIPD,{   // v0.148 글 다듬기 (보통 문장 · 해요체 · 이모지 없음)
  '스티커가 왜 안 붙지?':{w:'반복으로 깔았는데 어떤 날엔 스티커가 안 보일 때 봐요. 아래 중 하나예요.',s:[
    ['스티커는 <b>하루에 4개까지만</b> 보여요. 설정 › 스티커에서 순서를 바꾸면 먼저 보일 것을 정할 수 있어요.'],
    ['그날 <b>같은 그림 스티커</b>가 따로 있으면 겹쳐요. 새로 깔 때 뜨는 창에서 어느 쪽을 보일지 골라요.'],
    ['<b>반복 조건</b>에 안 맞는 날이에요. 근무 맞춤, 요일, 공휴일 빼기, 주말 빼기를 스티커 고치기에서 확인해요.'],
    ['<b>학원이나 동아리 활동 시간</b>이 그날 근무와 겹치면 빠져요.'],
    ['<b>이날부터 떼기</b>를 누른 뒤의 날짜와 <b>이날만 떼기</b> 한 날에는 안 깔려요. 다시 쓰려면 스티커 줄 ⋯ › 반복 · 알림 고치기에서 반복을 켜요.']]},
  '조나 회사가 바뀌었어요':{w:'다음 달부터 조가 바뀌거나 회사를 옮겨 근무 순서가 달라질 때 써요. 지난 근무표와 통계는 그대로 두고 그날부터만 바꿔요.',s:[
    ['설정 › <b>근무 패턴</b>을 열어요.','t11_a'],
    ['새 순서로 패턴을 고르거나 만들고, <b>1번째 칸 시작 날</b>을 바뀌는 날로 정해요.'],
    ['물어보면 <b>이 날부터 새 패턴</b>을 눌러요. 그 전 날짜는 예전 근무 그대로 남아요.']]},
  '근무표가 불규칙해요':{w:'매달 근무표가 따로 나와서 정해진 순서가 없을 때 써요.',s:[
    ['설정 › 근무 패턴에서 <b>불규칙</b>으로 바꿔요.'],
    ['달력 날짜를 누르고 <b>여러 날 칠하기</b>로 한 달 근무를 쭉 칠해요.'],
    ['다음 달 근무표가 나오면 같은 방법으로 칠해요. 가족 폰에도 바로 가요.']]},
  '휴직이나 퇴사로 근무 없이 쓰고 싶어요':{w:'육아휴직이나 퇴사로 한동안 근무가 없을 때 써요. 근무표는 지우지 않고 숨겨 두기만 해요.',s:[
    ['설정 › 근무 패턴 맨 아래 <b>개인 캘린더로 쓰기</b>를 눌러요.','t13_a'],
    ['기간을 정하면 그동안 달력과 위젯에서 근무 표시가 빠지고 메모와 스티커만 보여요.'],
    ['복직하면 같은 곳에서 끄면 돼요. 근무표가 그대로 돌아와요.']]},
  '근무 인수인계 적기':{w:'인수, 인계, 지시 사항을 날짜마다 따로 남기고 나중에 찾아보고 싶을 때 써요.',s:[
    ['설정 › <b>부가 기능</b>에서 업무 메모를 켜요.'],
    ['날짜 창에 업무 메모 줄이 생겨요. 인수, 인계, 지시를 색으로 나눠 적어요.'],
    ['지난 것은 설정 맨 위 찾기 칸에서 글자로 찾아요.']]},
  '아이 등하교나 학원 날씨':{w:'아이 하교 시간에 비가 오는지, 학원 끝날 때 추운지 미리 알고 싶을 때 써요.',pre:'먼저 가족 탭에 아이를 추가하고, 부가 기능에서 출퇴근 시간 · 날씨를 켜 주세요.',s:[
    ['가족 탭에서 아이 달력을 열고 날짜 창의 <b>일정 패턴</b>을 눌러요.'],
    ['유치원, 학교 같은 일정마다 시간과 <b>위치</b>를 넣어요.'],
    ['학원은 아이 달력 스티커를 고쳐 <b>활동</b> 시간과 위치를 넣어요. 날씨 팝업에 그 시간 칸이 생겨요.']]},
  '아침 알람 끄고 바로 날씨 보기':{w:'알람을 끄자마자 오늘 출퇴근 날씨와 우산이 필요한지 보고 싶을 때 써요.',pre:'먼저 부가 기능에서 출퇴근 시간 · 날씨를 켜고 집과 직장 동네를 정해 주세요.',s:[
    ['알람 탭에서 알람 카드를 눌러요.'],
    ['날씨를 <b>끈 뒤 보기</b>로 골라요.'],
    ['다음부터 알람을 끄면 날씨 카드가 바로 떠요.']]},
  '알람 없이 출근 전 날씨만':{w:'소리 나는 알람은 필요 없고 출근 전에 날씨 알림만 받고 싶을 때 써요.',s:[
    ['알람 탭에서 <b>＋</b>를 누르거나 알람 카드를 눌러 시각을 정해요.'],
    ['날씨를 <b>날씨만</b>으로 고르면 알람 대신 그 시각에 날씨 알림만 와요.'],
    ['알림을 누르면 오늘 날씨가 열려요.']]},
  '아이나 가족 일정 같이 보기':{w:'앱을 안 쓰는 아이나 부모님 일정도 내 폰에서 같이 보고 싶을 때 써요.',s:[
    ['<b>설정 › 가족</b>에서 <b>가족 추가</b>를 눌러요.'],
    ['학교, 회사, 교대 중에 고르고 시간과 쉬는 날을 정해요.'],
    ['가족 탭 카드와 그 사람 달력에서 일정, 스티커, 메모를 봐요. 같이 쉬는 날도 계산돼요.']]},
  '유치원에서 학교로 가요':{w:'3월부터 유치원에서 초등학교로 일정이 통째로 바뀔 때 써요. 그 전 날짜는 예전 그대로 둬요.',s:[
    ['아이 달력 날짜 창에서 <b>일정 패턴</b>을 눌러요.'],
    ['<b>이 날부터 새 일정</b>을 누르고 바뀌는 날을 정해요.'],
    ['새 일정과 시간을 넣어요. 그 전 날짜는 유치원 일정 그대로 남아요.']]},
  '폰을 바꿔도 가족방 그대로':{w:'근무표를 보내는 사람이 폰을 바꿀 때 가족방이 끊기지 않게 해요.',s:[
    ['폰을 바꾸기 전에 가족 연결 화면에서 <b>구글 계정</b>을 연결해 둬요.'],
    ['새 폰에 앱을 깔고 같은 구글 계정으로 연결하면 가족방이 이어져요.'],
    ['가족 쪽 폰은 아무것도 안 해도 돼요.']]},
  '가족이 다 같이 쉬는 날 찾기':{w:'가족 여행이나 외식 날을 잡을 때 모두 쉬는 날을 한눈에 봐요.',s:[
    ['설정 › 부가 기능에서 <b>같이 쉬는 날</b>을 켜요.'],
    ['가족 탭과 가족 달력에 모두 쉬는 날이 노란 띠로 보여요.'],
    ['날짜를 누르면 누가 쉬는지 한 줄로 나와요.']]},
  '이번 달 월급이 얼마일지':{w:'야간, 연장, 휴일 근무가 많은 달에 월급이 얼마쯤일지 미리 보고 싶을 때 써요.',s:[
    ['설정 › 부가 기능에서 <b>근무 통계 · 수당</b>을 켜요.'],
    ['고정금(기본급 등)을 넣고, 지난달 명세서 한 장으로 연장과 야간 1시간 금액을 맞춰요.'],
    ['근무 통계에서 이번 달 예상 금액을 봐요. 연장을 남기면 바로 더해져요.']]},
  '홈 화면에서 근무 바로 보기':{w:'앱을 열지 않고 홈 화면에서 오늘과 이번 달 근무를 보고 싶을 때 써요.',s:[
    ['폰 홈 화면 빈 곳을 꾹 눌러 <b>위젯</b>에서 언제쉬어를 골라요.'],
    ['1칸, 2칸, 7일, 한 달 중에 골라 놓아요.'],
    ['가족이 있으면 한 달 위젯 왼쪽 위 이름(● 나 ▾)을 눌러 가족 달력으로 바꿔요.'],
    ['모양과 투명도는 설정 › 위젯에서 바꿔요.','t15_a']]},
  '폰을 바꿔도 데이터 지키기':{w:'폰을 바꾸거나 앱을 지웠다 깔아도 근무, 메모, 스티커를 그대로 지켜요.',s:[
    ['설정 › <b>백업</b>을 열어요.'],
    ['<b>구글 드라이브</b>를 연결하면 자동으로 백업돼요.'],
    ['새 폰에서 같은 계정으로 연결하고 복원을 눌러요.']]},
  '실수로 옛날 백업을 복원했어요':{w:'복원을 잘못 눌러 요즘 적은 것이 사라졌을 때 써요.',s:[
    ['설정 › <b>백업</b>을 열어요.'],
    ['<b>복원 직전으로 되돌리기</b>를 눌러요. 복원하기 바로 전 모습으로 돌아가요.']]}
});
function tipDetail(q){const D=TIPD[q];if(!D)return '';
  return `<div class="tdw"><b>이럴 때</b>${D.w}</div>${D.pre?`<div class="tdp">${D.pre}</div>`:''}<ol class="tds">${D.s.map(([t,im])=>`<li>${t}${im?`<img src="tips/${im}.webp" alt="" loading="lazy" onerror="this.remove()">`:''}</li>`).join('')}</ol>`;}
function openTipsPage(){   // v0.147 새 모양: 묶음 카드(선 아이콘 · 개수) → 누르면 질문 줄 → 누르면 이럴 때 · 번호 단계 · 사진 · 바로 가기
  closeSheet();
  const TI={'📅':'calendar','📝':'sticky-note','💊':'smile','☔':'cloud-sun','👪':'users','⏰':'alarm-clock','💰':'chart-column','📱':'smartphone'};
  openPage(`${pageHead('이럴 땐 이렇게')}<div class="pg-b tips np">
    <div class="pg-sec" style="margin-top:8px">${npRow('info','처음 안내 다시 보기',npVal(''),{tap:1,act:'coach-again'})}</div>
    <div class="pg-cap">상황별</div>
    ${TIPS.map(([e,t,L],g)=>`<details class="pg-sec tipg"><summary><span class="npi">${npi(TI[e]||'info')}</span><span class="tgt">${esc(t)}</span><small>${L.length}</small>${npi('chevron-down',16)}</summary>${L.map(([q,a,go])=>`<details class="tip"><summary>${esc(q)}${npi('chevron-down',16)}</summary>${TIPD[q]?tipDetail(q):`<div class="ta">${esc(a)}</div>`}<button class="btn tgo" data-act="tip-go" data-a="${esc(go)}">바로 가기 ›</button></details>`).join('')}</details>`).join('')}
  </div>`,'tips');
}
// v0.135 처음 안내 (말풍선 · 한 번만 · 건너뛰기 · 이럴 땐 이렇게에서 다시 보기)
let coachOn=false;
function coachSets(){
  const pn='#view #track>.panel:nth-child(2) ',sh='#sheet.open ';
  return [
    {k:'tcal',ok:()=>tab==='cal'&&!document.querySelector('#sheet.open')&&!famView(),steps:[
      {sel:pn+'.cell.today .stz',alt:pn+'.cell.today',part:'top',t:'날짜 윗부분을 누르면',b:'스티커를 붙여요. 약 · 운동처럼 매일 하는 걸 체크해요.'+(S.addons&&S.addons.wx?'<br>학원 · 동아리 스티커는 그 시간 날씨도 보여요.':'')},
      {sel:pn+'.cell.today',part:'low',t:'날짜 아랫부분을 누르면',b:'그날 창이 열려요. 근무를 바꾸고 메모를 남겨요.'},
      {sel:'#top .pi-btn',t:'이번 달 할 일',b:'포스트잇에 적어 두면 가족과 같이 봐요.'}]},
    {k:'twx',ok:()=>!!document.querySelector('#sheet.open')&&!!(S.addons&&S.addons.wx),steps:[
      {sel:sh+'#wxDay',t:'출근 · 퇴근 날씨',b:'그날 출근 · 퇴근 때 날씨예요. 누르면 시간별로 자세히 보고, 우산 · 옷도 알려 줘요.'}]},
    {k:'tfam',ok:()=>!!document.querySelector('#sheet.open')&&!!S.link,steps:[
      {sel:sh+'#memoInput',t:'♥ 가족 메모',b:role()==='host'?'"자세히"에서 가족을 고르면 가족 폰에도 보이고 알림이 가요.':'여기 쓰면 가족 모두에게 보이고 알림이 가요.'},
      {sel:sh+'[data-act="rqwant"]',t:'근무 요청',b:'바꾸고 싶은 근무를 골라 요청을 보내요. 수락하면 달력에 바로 반영돼요.'},
      {sel:sh+'[data-act="rqreply"]',t:'근무 요청',b:'가족이 보낸 근무 요청이에요. 수락하면 내 달력에 바로 반영돼요.'}]}];
}
function coachCheck(){
  if(coachOn||!S.onboarded||document.querySelector('#page.open,#tutx')||$('#pop').innerHTML.trim()||document.hidden)return;
  for(const c of coachSets()){
    if(hintN(c.k)||!c.ok())continue;
    const st=c.steps.map(x=>({...x,el:document.querySelector(x.sel)||(x.alt&&document.querySelector(x.alt))})).filter(x=>x.el&&x.el.getBoundingClientRect().height>0);
    if(!st.length)continue;
    coachShow(c.k,st,0);return;
  }
}
function coachEnd(k){const d=document.getElementById('tutx');if(d)d.remove();coachOn=false;S.hints=S.hints||{};S.hints[k]=1;save();}
function coachShow(k,st,i){
  coachOn=true;const s=st[i];let d=document.getElementById('tutx');if(d)d.remove();
  if(!s||!document.body.contains(s.el)){coachEnd(k);return;}
  s.el.scrollIntoView({block:'nearest'});
  let r=s.el.getBoundingClientRect();r={left:r.left,top:r.top,width:r.width,height:r.height};
  if(s.part==='top'&&!/stz/.test(s.el.className))r.height=r.height*0.3;
  if(s.part==='low'){r.top+=r.height*0.3;r.height*=0.7;}
  const pad=6,x=r.left-pad,y=r.top-pad,w=r.width+pad*2,h=r.height+pad*2,H=innerHeight,below=y+h+170<H;
  d=document.createElement('div');d.id='tutx';
  d.innerHTML=`<div class="hole" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>
    <div class="arr ${below?'dn':'up'}" style="left:${Math.min(Math.max(x+w/2-9,26),innerWidth-44)}px;top:${below?y+h+8:y-20}px"></div>
    <div class="bub" style="${below?`top:${y+h+26}px`:`bottom:${H-y+26}px`}"><b>${s.t}</b><p>${s.b}</p>
    <div class="ft"><span class="dots">${st.length>1?`${i+1} / ${st.length}`:''}</span><div class="rt">${i<st.length-1?'<button class="sk" data-c="skip">건너뛰기</button>':''}<button class="nx" data-c="next">${i<st.length-1?'다음':'알겠어요'}</button></div></div></div>`;
  d.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();const b=e.target.closest('[data-c]');if(!b)return;
    if(b.dataset.c==='next'&&i<st.length-1)coachShow(k,st,i+1);else coachEnd(k);},true);
  ['touchstart','pointerdown','mousedown'].forEach(ev=>d.addEventListener(ev,e=>e.stopPropagation()));
  document.body.appendChild(d);
}
function coachSoon(){setTimeout(()=>{try{coachCheck();}catch(e){}},700);}
function tipGo(a){
  if(a.startsWith('tab:')){pageBack=null;closePage();tab=a.slice(4);paint=null;render();if(tab==='fam')wxFetch(false);return;}
  pageBack=openTipsPage;const b=document.createElement('button');b.dataset.act=a;b.style.display='none';document.body.appendChild(b);b.click();b.remove();
}
// 설정 › 화면: 달력 · 보기 · 자세히
function openLookPage(){   // v0.146 새 모양
  const fs=S.fontScale||100;
  const seg=(arr,cur,act)=>`<div class="npseg sm">${arr.map(([v,l])=>`<button class="${String(cur)===String(v)?'on':''}" data-act="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;
  openPage(`${pageHead('화면')}<div class="pg-b np">
    <div class="pg-cap">달력</div>
    <div class="pg-sec">
      ${npRow('grid','달력 모양',seg([['circle','동그라미'],['fill','칸 채우기']],S.calLook==='fill'?'fill':'circle','callook'))}
      <div class="prow pcol tdc-line"><div class="pl2" style="display:flex;align-items:center;gap:12px"><span class="npi">${npi('circle-dot')}</span>오늘 표시</div>${todayColorRow()}</div>
      ${npRow('calendar','주 시작',seg([[0,'일'],[1,'월']],S.weekStart===1?1:0,'weekstart'))}
    </div>
    <div class="pg-cap">보기</div>
    <div class="pg-sec">
      ${npRow('sun-moon','화면 모드',seg([['light','라이트'],['dark','다크'],['system','시스템']],S.theme==='light'||S.theme==='dark'?S.theme:'system','thememode'))}
      ${npRow('type','글자 크기',seg([[100,'보통'],[120,'크게']],fs>100?120:100,'font'))}
      ${npRow('paintbrush','배경',seg([['','기본'],['vivid','또렷하게']],S.bg||'','bgmode'))}
    </div>
    <div class="pg-cap">자세히</div>
    <div class="pg-sec">${npRow('sliders','모양 세부 조정',npVal(''),{tap:1,act:'tune-open'})}</div>
  </div>`,'look');
}
// 설정 › 알림: 흩어져 있던 알림 설정을 한 곳에
function openNotifPage(){
  const fam=pushRow().replace('style="margin-top:16px"','style="margin-top:0"'),snd=hasBridge('openSettings');
  openPage(`${pageHead('알림')}<div class="pg-b np">
    ${S.link?`<div class="pg-cap">가족</div>${fam||'<div class="hint keep" style="padding:6px 22px">이 폰에선 가족 알림을 받을 수 없어요</div>'}`:''}
    <div class="pg-sec" style="margin-top:${S.link?12:8}px">
      ${npRow('smile','스티커 알림 시간',npVal(''),{tap:1,act:'stk-board'})}
      ${snd?npRow('bell','알림 소리',npVal('폰 설정'),{tap:1,act:'remind-sound'}):''}
      ${npRow('alarm-clock','알람',npVal('알람 탭'),{tap:1,act:'notif-alarm'})}
    </div>
  </div>`,'notif');
}
// 설정 › 도움 · 정보
function openInfoPage(){   // v0.146 새 모양
  openPage(`${pageHead('도움 · 정보')}<div class="pg-b np">
    ${famBx.vip?`<div class="pg-sec plan-on" style="margin-top:8px">${npRow('sparkles','무제한 이용 중','')}</div>`:''}
    <div class="pg-sec" style="margin-top:${famBx.vip?12:8}px">
      ${npRow('clock','알람이 잘 울리게',npVal(''),{tap:1,act:'info-perm'})}   <!-- v0.215 다 켜져 있어도 들어갈 수 있게 (삼성 자동 절전 예외 앱 바로가기) -->
      ${npRow('file-text','문의하기 · 오류 신고',npVal(''),{tap:1,act:'more-mail'})}
      ${npRow('calendar-days','사용 통계 · 오류 보고',`<label class="sw"><input type="checkbox" id="statsOn" ${S.stats!==false?'checked':''}><i></i></label>`)}
      ${npRow('tag','개인정보처리방침',npVal(''),{tap:1,act:'more-privacy'})}
      ${npRow('bell','앱 정보',`<div class="pv npv">${appVersion()}</div>`,{act:'about-tap'})}
      ${S.link?npRow('user','내 번호',`<div class="pv npv">${myCode(S.link.uid)}</div>`,{tap:1,act:'my-code'}):''}
      ${admOk?npRow('users','관리자',npVal(''),{tap:1,act:'adm-open'}):''}
    </div>
    <div class="pg-sec" style="margin-top:12px">${npRow('trash-2','내 데이터 모두 지우기','',{cls:'danger-row',act:'more-wipe'})}</div>
  </div>`,'info');
  admCheck();
}
const lookRefresh=()=>{if(pageMode==='look')openLookPage();};
// v0.171 위젯 설정 미리보기: 위젯과 같은 코틀린 그리기(AndroidBridge.widgetPreview)로 그린 한 달 위젯 한 장 · 바둑판 위 (투명 정도가 보이게)
function wgBg(){return S.widget.bg==='app'||S.widget.bg==null?(S.bg==='vivid'?'vivid':''):S.widget.bg==='vivid'?'vivid':'';}
const wgStyleOk=()=>!!(window.AndroidBridge&&typeof window.AndroidBridge.openWidgetStyle==='function');
// v0.191 위젯 설정 화면(실제 배경화면 위 · 폰 화면)에서 저장하면 돌아옴
window.__wgStyle=j=>{try{const o=typeof j==='string'?JSON.parse(j):j;if(!o||typeof o!=='object')return;const w=S.widget;
  if(['light','dark','system'].includes(o.theme))w.theme=o.theme;if(Number.isFinite(+o.alpha))w.alpha=Math.max(0,Math.min(100,Math.round(+o.alpha/10)*10));
  if((o.bg==='vivid'?'vivid':'')!==wgBg())w.bg=o.bg==='vivid'?'vivid':'';if(o.look==='circle'||o.look==='fill')w.look=o.look;
  save();if(pageMode==='widget')openWidgetPage();}catch(e){}};
const wgPrevOk=()=>!!(window.AndroidBridge&&typeof window.AndroidBridge.widgetPreview==='function');
let wgPvT=0,wgPvWant=false;
function wgPrev(){
  if(!wgPrevOk())return;wgPvWant=true;if(wgPvT)return;   // v0.189 밀고 있는 동안엔 0.15초에 한 번만 (끝난 뒤 한 번 더)
  wgPvT=setTimeout(()=>{wgPvT=0;if(!wgPvWant)return;wgPvWant=false;try{const im=$('#wgPvImg');if(!im)return;const b64=window.AndroidBridge.widgetPreview(widgetJson(),330,350);if(b64)im.src='data:image/png;base64,'+b64;}catch(e){}if(wgPvWant)wgPrev();},150);
}
function openWidgetPage(){
  const w=S.widget;
  openPage(`${pageHead('홈 화면 위젯')}
    <div class="pg-b np">
      ${wgPrevOk()?`<div class="wgpv" id="wgPv"${wgStyleOk()?' data-act="wg-style"':''}><img id="wgPvImg" alt="위젯 미리보기">${wgStyleOk()?`<span class="wgpvb">${npi('image',15)}배경화면에서 보기</span>`:''}</div>`:''}
      <div class="pg-cap">배경</div>
      <div class="pg-sec pad"><div class="npseg">${[['light','밝게'],['dark','어둡게'],['system','폰 설정 따라']].map(([v,n])=>`<button class="${w.theme===v?'on':''}" data-act="wg-theme" data-v="${v}">${n}</button>`).join('')}</div>
        <div class="npseg" style="margin-top:10px">${[['','기본'],['vivid','또렷하게']].map(([v,n])=>`<button class="${wgBg()===v?'on':''}" data-act="wg-bg" data-v="${v}">${n}</button>`).join('')}</div>
        <div class="prow" style="padding:12px 0 0"><div class="pl2">진하기 <b id="wgAv">${w.alpha}%</b></div><input type="range" id="wgAlpha" min="0" max="100" step="10" value="${w.alpha}" style="flex:1"></div></div>
      <div class="pg-cap">한 달 위젯 모양</div>
      <div class="pg-sec pad"><div class="npseg">${[['fill','칸 채우기'],['circle','동그라미']].map(([v,n])=>`<button class="${w.look===v?'on':''}" data-act="wg-look" data-v="${v}">${n}</button>`).join('')}</div></div>
    </div>`,'widget');
  wgPrev();
}
/* ================= 모양 조정 (숨은 화면: 설정 › 앱 정보를 7번 눌러 나오는 개발자 메뉴 안) =================
 * 앱 달력(위에 미리보기) · 한 달 위젯(커버 · 안쪽)의 스티커 · 주야 글자 · 메모 크기와 위치를 움직여 보고, "값 복사"로 개발자에게 전하면 기본값으로 반영해요. */
const tuneFmt=v=>(Math.round(v*100)/100).toFixed(2);
const tuneVal=()=>tuneDraft||S.tune;
const tuneDirty=()=>!!tuneDraft&&JSON.stringify(tuneDraft)!==JSON.stringify(S.tune);
function tuneRows(g){   // 스티커 / 주야 / 메모 묶음으로 접기 · 지금 보는 화면(앱 달력)만 펼쳐 둠
  const t=tuneVal()[g],open=g===tuneAppKey();
  return ['스티커','주야','메모'].map(gr=>`<details class="tn-d"${open?' open':''}><summary>${gr}</summary>${TUNE_KEYS.filter(k=>k[6]===gr&&(!k[7]||g.startsWith('app'))).map(([k,nm,lo,hi,st])=>`<div class="tn-row"><span>${nm}</span><input type="range" class="tn-r" data-g="${g}" data-k="${k}" min="${lo}" max="${hi}" step="${st}" value="${t[k]}"><b id="tnv_${g}_${k}">${tuneFmt(t[k])}</b></div>`).join('')}</details>`).join('');
}
function tuneBar(){   // 저장 · 되돌리기 줄 (미리보기 바로 아래)
  const e=$('#tnBar');if(!e)return;const d=tuneDirty(),h=(S.tuneHist||[]).length;
  e.innerHTML=`<span class="tn-st${d?' dirty':''}">${d?'저장 안 한 값이 있어요':'저장된 값이에요'}</span><button class="btn ghost" data-act="tune-undo"${h?'':' disabled'}>이전 저장으로${h?` (${h})`:''}</button><button class="btn" data-act="tune-save"${d?'':' disabled'}>저장</button>`;
}
function tuneWarn(){   // 지금 보는 앱 달력 화면에서 한계에 닿았는지: 미리보기를 실제로 재서 알려줌 (막지는 않음)
  const e=$('#tnWarn'),pv=$('#tnPrev');if(!e||!pv)return;
  const w=[],cells=[...pv.querySelectorAll('.grid .cell')];
  const want=memoLines(),cap=3;
  let cut=0,txt=0,stkHid=0,holShort=0,ovl=0,memoOvl=0;
  cells.forEach(c=>{
    const pl=[...c.querySelectorAll('.pill-wrap>*')];
    pl.forEach(x=>{if(x.scrollWidth>x.clientWidth+1||x.querySelector('.ell2'))txt++;if(x.clientHeight&&x.scrollHeight>x.clientHeight+1)cut++;});
    const pw=c.querySelector('.pill-wrap'),dn0=c.querySelector('.dn'),bw0=c.querySelector('.bwrap');
    if(pw&&pw.children.length&&bw0&&pw.getBoundingClientRect().top<bw0.getBoundingClientRect().bottom-1)memoOvl++;
    if(pw&&pw.children.length&&pw.getBoundingClientRect().bottom>c.getBoundingClientRect().bottom+1)cut++;
    const hn=c.querySelector('.dn .hn'),h1=c.querySelector('.dn .h1');
    if(hn&&hn.scrollWidth>hn.clientWidth+1)holShort++;
    if(h1&&h1.dataset.o&&h1.textContent.length<h1.dataset.o.length)holShort++;
    c.querySelectorAll('.stp>*,.s2>*').forEach(x=>{const r=x.getBoundingClientRect(),cr=c.getBoundingClientRect();if(r.right>cr.right+1||r.left<cr.left-1||r.bottom>cr.bottom+1)stkHid++;});
    const stp=c.querySelector('.dn>.stp'),num=c.querySelector('.dn .num');
    if(stp&&num&&stp.children.length){const a=stp.getBoundingClientRect(),b=num.getBoundingClientRect();if(a.left<b.right-1)ovl++;}
  });
  if(want<cap)w.push(`메모가 ${cap}줄 중 ${want}줄만 보여요`);
  if(cut)w.push('메모가 칸 밖으로 잘려요');
  if(memoOvl)w.push('메모가 근무 글자와 겹쳐요');
  if(txt)w.push('메모 글자가 칸보다 커서 끝이 잘려요');
  if(holShort)w.push('공휴일 이름이 줄어 보여요');
  if(stkHid)w.push('스티커가 칸 밖으로 나가요');
  if(ovl)w.push('스티커가 날짜 숫자와 겹쳐요');
  e.innerHTML=w.length?w.map(x=>`<div>⚠ ${esc(x)}</div>`).join(''):'';
}
function tunePrev(){   // 미리보기는 "일주일 줄"만: 스티커 · 메모 · 요청이 가장 많은 주 (없으면 오늘이 있는 주) · 칸 높이는 실제 달력 칸과 비슷하게
  const e=$('#tnPrev');if(!e)return;
  e.innerHTML=calPanel(cur.y,cur.m);
  try{stzWindow($('#page'));}catch(err){}   // 스티커 크기는 실제 달력과 같게(앞뒤 3달 기준) — 그 뒤에 한 주만 남김
  const g=e.querySelector('.grid');if(!g)return;
  const cells=[...g.children],rows=Math.floor(cells.length/7);let best=0,bs=-9;tnRows=rows;
  for(let r=0;r<rows;r++){let sc=0;for(let c=0;c<7;c++){const x=cells[r*7+c];sc+=x.querySelectorAll('.pl').length*2+x.querySelectorAll('.stp>*,.s2>*').length*2+(/rq-/.test(x.className)?3:0)+(x.classList.contains('today')?1:0)-(x.classList.contains('out')?3:0);}if(sc>bs){bs=sc;best=r;}}
  tnBest=best;const wk=tnWeek==null?best:Math.max(0,Math.min(rows-1,tnWeek));
  cells.forEach((x,i)=>{if(Math.floor(i/7)!==wk)x.remove();});
  g.style.gridTemplateRows='1fr';
  {const rc=document.querySelector('#view #track>.panel:nth-child(2) .cell'),h0=rc?rc.getBoundingClientRect().height:0,ch=Math.round(h0>40?h0:tnCellH>40?tnCellH:Math.max(90,(innerHeight-230)/6)),dw=e.querySelector('.dow');   // v0.141 실제 달력 칸 높이 그대로 (전엔 칸이 틀보다 길게 늘어나 아래가 잘려 보였음)
   g.style.height=ch+'px';g.style.flex='none';e.style.height=(ch+((dw&&dw.offsetHeight)||34))+'px';}
  {const w=$('#tnWk');if(w)w.innerHTML=`<button class="ib" data-act="tn-wk" data-d="-1" aria-label="앞 주"${wk<=0?' disabled':''}>▲</button><span>${cur.m+1}월 ${wk+1}째 주</span><button class="ib" data-act="tn-wk" data-d="1" aria-label="다음 주"${wk>=rows-1?' disabled':''}>▼</button>`;}
  try{fitDn(e,true);memoShift(e);}catch(err){}   // 실제 달력처럼 날짜 줄에 안 들어가면 공휴일 이름을 줄이고 스티커를 아래 줄로 (미리보기도 똑같이)
  tuneBar();tuneWarn();
}
const TODAY_COLORS=[['','파랑'],['#1fa971','초록'],['#e0455c','분홍'],['#8a65c9','보라'],['#f08a00','주황'],['#6b7280','회색']];
// "근무 색": 오늘 표시 색 = 그날 근무타입 색을 한 단계 진하게(모든 근무타입 · 바꾼 색도 따라감) · 쉬는 날은 장미 · 색 없는 근무는 기본 파랑
function deepenHex(h,dark){   // dark: 어두운 화면에선 칸 색이 어두워서 반대로 밝게
  h=String(h||'').replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');if(!/^[0-9a-f]{6}$/i.test(h))return '';
  const r=parseInt(h.slice(0,2),16)/255,g=parseInt(h.slice(2,4),16)/255,b=parseInt(h.slice(4,6),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  let H=d===0?0:mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;H*=60;if(H<0)H+=360;
  const sat=Math.min(1,(mx===0?0:d/mx)*(dark?1.1:1.35)+(dark?.05:.08)),v=dark?Math.min(1,mx*1.3+.18):mx*.74,c=v*sat,x=c*(1-Math.abs((H/60)%2-1)),m=v-c;
  const [r1,g1,b1]=H<60?[c,x,0]:H<120?[x,c,0]:H<180?[0,c,x]:H<240?[0,x,c]:H<300?[x,0,c]:[c,0,x];
  return '#'+[r1,g1,b1].map(f=>Math.round((f+m)*255).toString(16).padStart(2,'0')).join('');
}
// v0.99.2 "근무 색"은 지금 화면에 보이는 달력(내 달력 · 내 달력 보기 · 가족 달력 · 직접 추가한 가족 달력)의 그날 근무를 따라감
function tdcShift(){
  const d=new Date(),k=fmt(d);let c=null,rest=false;
  if(pageMode==='mancal'){const m=manMember();if(!m)return '';if(m.kind==='shift'){const sh=famShift(m,d);c=tColors(typeOf(sh));rest=isRest(sh);}else rest=memberOff(m,d);}
  else if(pageMode==='famcal'||(famView()&&famPeers().length)){const p=vcEnsure();if(!p||!p.sch)return '';const sh=schShift(p.sch,d);c=tColors(schType(p.sch,sh));rest=schRest(p.sch,sh);}
  else{if(persOn(k))return '';const sh=shiftOf(d);c=tColors(typeOf(sh));rest=isRest(sh);}
  if(c&&c.bg){const de=document.documentElement,dk=de.dataset.theme==='dark'||(de.dataset.theme!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);return deepenHex(cssHex(c.bg),dk)||'';}
  return rest?'#6b7482':'';   // v0.127 쉬는 날은 빨강(명절 느낌) 대신 회색 테두리
}
function applyTdc(){   // 근무 색일 때만: 지금 보이는 달력에 맞춰 오늘 색 다시 계산
  if(S.todayColor!=='shift')return;const tc=tdcShift(),de=document.documentElement;
  if(tc)de.style.setProperty('--tdc',tc);else de.style.removeProperty('--tdc');
  if(tc)de.setAttribute('data-tdc',tc==='#6b7482'?'rest':'1');else de.removeAttribute('data-tdc');
}
function todayColorRow(){   // 오늘 띠 색: 근무 색 + 동그라미 6개 + 직접 고르기
  const cur=S.todayColor||'';
  return `<div class="tdc-row"><button class="tdc tdc-shift${cur==='shift'?' on':''}" data-act="todaycolor" data-v="shift" aria-label="그날 근무 색"></button>${TODAY_COLORS.map(([v,n])=>`<button class="tdc${cur===v?' on':''}" data-act="todaycolor" data-v="${v}" aria-label="${n}" style="background:${v||'var(--accent)'}"></button>`).join('')}<button class="tdc tdc-pick${cur&&cur!=='shift'&&!TODAY_COLORS.some(x=>x[0]===cur)?' on':''}" data-act="tdc-pick" aria-label="직접 고르기"></button></div>`;
}
// v0.141 모양 조정 정리: 오늘 표시 · 달력 모양은 설정 › 화면으로 · 위젯 상태 줄은 맨 아래 접힌 칸 · 지금 이 화면 묶음만 펼침 · 미리보기 주 고르기(▲ ▼) · 버튼은 아래에 붙음
let tnWeek=null,tnRows=0,tnBest=0,tnCellH=0;
function openTunePage(){
  if(pageMode!=='tune')tnWeek=null;
  {const rc=document.querySelector('#view #track>.panel:nth-child(2) .cell'),h=rc?rc.getBoundingClientRect().height:0;if(h>40)tnCellH=h;}   // 실제 달력 칸 높이 (페이지가 열리면 못 잼)
  if(!tuneDraft)tuneDraft=JSON.parse(JSON.stringify(S.tune));
  let dbg='';try{if(hasBridge('widgetDebug'))dbg=String(window.AndroidBridge.widgetDebug()||'');}catch(e){}
  const G=[['appInner','앱 달력 · 안쪽 화면(큰 화면)'],['appCover','앱 달력 · 커버 화면(작은 화면)'],['cover','한 달 위젯 · 커버 화면(작은 위젯)'],['inner','한 달 위젯 · 안쪽 화면(큰 위젯)']];
  const me=tuneAppKey(),order=[...G.filter(g=>g[0]===me),...G.filter(g=>g[0]!==me)],wasOpen=pageMode==='tune'?new Set([...document.querySelectorAll('#page details.tn-grp[open]')].map(d=>d.id)):null;   // 다시 그릴 때(스티커 범위 · 처음 값 …) 펼친 칸 그대로
  openPage(`${pageHead('모양 조정')}
    <div class="pg-b tn-pg">
      <div class="tn-top"><div class="tn-wk" id="tnWk"></div><div class="tn-prev" id="tnPrev"></div><div class="tn-bar" id="tnBar"></div><div class="tn-warn" id="tnWarn"></div></div>
      ${order.map(([g,n])=>`<details class="tn-g tn-grp" id="tng_${g}"${(wasOpen?wasOpen.has('tng_'+g):g===me)?' open':''}><summary>${n}${g===me?' <small>← 지금 이 화면</small>':''}</summary>${tuneRows(g)}</details>`).join('')}
      <details class="tn-g tn-grp" id="stzDiagG" hidden${wasOpen&&wasOpen.has('stzDiagG')?' open':''}><summary>스티커 크기 (왜 작아졌나)</summary><div id="stzDiag"></div></details>
      ${dbg?`<details class="tn-g tn-grp"><summary>문제 찾기 정보</summary><div class="hint" style="padding:4px 2px 0;font-size:11.5px">놓인 한 달 위젯 마지막 그림 상태<br>${esc(dbg).replace(/\n/g,'<br>')}</div></details>`:''}
      <div class="tn-foot"><button class="btn ghost grow" data-act="tune-reset">처음 값으로</button><button class="btn ghost grow" data-act="tune-copy">값 복사</button></div>
    </div>`,'tune');
  tunePrev();
  setTimeout(()=>{try{const h=stzDiagHtml(),e=$('#stzDiag'),g=$('#stzDiagG');if(e&&g&&h){e.innerHTML=h;g.hidden=false;}}catch(err){}},150);   // v0.128 스티커가 있을 때만 보임 · 열 때만 계산
}
function tuneText(){
  const f=g=>{const t=tuneVal()[g];return `스티커 ${t.stk} · 좌우 ${t.stkX} · 높이 ${t.stkY} / 주야 ${t.ink} · 높이 ${t.inkY}${g.startsWith('app')?` · 빨간 점 ${t.dotX}`:''} / 메모 글자 ${t.memo} · 칸 ${t.pill}`;};
  return `[모양 조정] 앱 달력 안쪽(${S.calLook==='fill'?'칸 채우기':'동그라미'}): ${f('appInner')}\n앱 달력 커버: ${f('appCover')}\n위젯 커버: ${f('cover')}\n위젯 안쪽: ${f('inner')}\n위젯 모양: ${S.widget.look==='circle'?'동그라미':'칸 채우기'}`;
}

/* v0.171 색 고르기 창 (폰 기본 색상 창 대신): 큰 색 판(가로 = 색 · 세로 = 진하기) + 밝기 막대 + 이 색으로 */
let cpS=null;
const hsv2hex=(h,s,v)=>{const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1));};return '#'+[f(5),f(3),f(1)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');};
const hex2hsv=hx=>{const n=parseInt(String(hx).slice(1),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360;}return {h,s:mx?d/mx:0,v:mx};};
function openColorPick(){
  const cur=/^#[0-9a-f]{6}$/i.test(S.todayColor||'')?S.todayColor:'#2f6bf0';cpS=hex2hsv(cur);if(cpS.v<.15)cpS.v=.15;
  openPop(`<div class="cpw"><div class="cph"><b>오늘 표시 색</b></div>
    <div class="cpb" id="cpB"><span class="cpk" id="cpK"></span></div>
    <div class="cpl" id="cpL"><span class="cpk" id="cpK2"></span></div>
    <button class="btn cpok" id="cpOk" data-act="cp-ok">이 색으로</button></div>`);
  cpDraw();
}
function cpDraw(){
  if(!cpS)return;const c=hsv2hex(cpS.h,cpS.s,cpS.v),full=hsv2hex(cpS.h,cpS.s,1);
  const k=$('#cpK'),k2=$('#cpK2'),ok=$('#cpOk'),L=$('#cpL');if(!k)return;
  k.style.left=(cpS.h/360*100)+'%';k.style.top=((1-cpS.s)*100)+'%';k.style.background=full;
  k2.style.left=((cpS.v-.15)/.85*100)+'%';k2.style.background=c;
  L.style.background=`linear-gradient(to right,${hsv2hex(cpS.h,cpS.s,.15)},${full})`;if(ok){ok.style.background=c;const r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);ok.classList.toggle('lt',(r*299+g*587+b*114)/1000>150);}   // 버튼 = 고른 색 · 밝으면 글자 검정
}
document.addEventListener('pointerdown',e=>{
  const el=e.target.closest&&e.target.closest('#cpB,#cpL');if(!el||!cpS)return;e.preventDefault();
  const mv=ev=>{const r=el.getBoundingClientRect(),x=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));
    if(el.id==='cpB'){cpS.h=Math.min(359.9,x*360);cpS.s=1-y;}else cpS.v=.15+x*.85;cpDraw();};
  mv(e);const up=()=>{document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);};
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
});
document.addEventListener('input',e=>{
  if(e.target&&e.target.id==='wgAlpha'){S.widget.alpha=+e.target.value;const v=$('#wgAv');if(v)v.textContent=S.widget.alpha+'%';wgPrev();return;}   // v0.171 밀면 바로 미리보기 (저장은 손 뗄 때)
  if(e.target&&e.target.id==='tdcInput'){S.todayColor=e.target.value.toLowerCase();save();applyTune();document.querySelectorAll('.tdc-row .tdc.on').forEach(x=>x.classList.remove('on'));const l=e.target.closest('.tdc-pick');if(l)l.classList.add('on');return;}
  const t=e.target;if(!t.classList||!t.classList.contains('tn-r'))return;
  const g=t.dataset.g,k=t.dataset.k;if(!tuneDraft||!tuneDraft[g])return;
  tuneDraft[g]=tuneClean({...tuneDraft[g],[k]:+t.value});
  const b=$('#tnv_'+g+'_'+k);if(b)b.textContent=tuneFmt(tuneDraft[g][k]);
  if(g===tuneAppKey()){applyTune();memoLines();tunePrev();}else tuneBar();   // 지금 보고 있는 화면의 값만 미리보기에 바로 보임 · 반영은 "저장" 버튼
});

/* ================= 부가 기능 (설정 › 부가 기능) =================
 * 기본은 모두 꺼짐. 꺼도 저장된 내용은 그대로이고, 켜면 그 자리에 바로 생겨요. */
const ADDONS=[
  ['comp','🏢','휴무일 · 기념일','회사 휴무일 · 생일 · 기념일을 달력에 표시하고 미리 알려요'],
  ['together','☀️','같이 쉬는 날','가족이 다 같이 쉬는 날을 찾아 가족 탭에 보여줘요'],
  ['colleague','👥','동료 근무','같은 회사 다른 조의 근무를 한 표로 봐요'],
  ['stats','📊','근무 통계 · 수당','대근 · 연차 · 교육 횟수와 수당을 계산해요'],
  ['wlog','📋','업무 메모 (인수인계)','날짜마다 인수 · 인계 · 지시 · 특이를 따로 적어요 · 나만 보고 백업에서 빠져요'],
  ['wx','☔','출퇴근 시간 · 날씨','근무마다 출근 · 퇴근 시각을 정하고, 그때 날씨와 미세먼지를 알람 · 날짜 창 · 가족 탭에 보여줘요']
];
const adOn=k=>ad(k);
const addonCount=()=>ADDONS.filter(a=>adOn(a[0])).length;
const AD_GO={comp:'more-comp',together:'tog-open',colleague:'go-colleague',stats:'more-stats',wlog:'wl-set',wx:'wx-set'};   // 켜진 칸을 누르면 그 설정
const AD_SHORT={comp:['휴무일·기념일','회사 휴무 · 생일'],together:['같이 쉬는 날','가족 탭에 표시'],colleague:['동료 근무','다른 조 근무표'],stats:['근무 통계','대근 · 연차 · 수당'],wlog:['업무 메모','인수인계 · 나만 봄'],wx:['출퇴근 시간 · 날씨','알람 · 날짜 창']};
function openAddonPage(){   // v0.146 줄 + 스위치 (꺼진 줄을 누르면 켜짐 · 켜진 줄은 그 설정 · 끄기는 스위치)
  openPage(`${pageHead('부가 기능')}
    <div class="pg-b np">
      <div class="pg-sec stiles adt" style="margin-top:8px">${ADDONS.map(a=>{const on=adOn(a[0]),sh=a[0]==='wlog'?[wlName(),AD_SHORT.wlog[1]]:AD_SHORT[a[0]]||[a[2],''];return `<div class="prow tap adr ${on?'':'off'}" data-act="ad-tile" data-k="${a[0]}"><span class="npi">${lineIcon(a[1])}</span><div class="pl2">${esc(sh[0])}</div><label class="sw" data-noact="1"><input type="checkbox" id="ad_${a[0]}" ${on?'checked':''}><i></i></label></div>`;}).join('')}</div>
    </div>`,'addons');
}
// 처음 한 번만: 부가 기능이 있다는 안내 (쓰던 사람 · 처음 쓰는 사람)
// "새로 생겼어요" 팝업: 버전마다 띄우지 않고, 아래 NEWS 에 그 버전의 소식을 적어 둔 때만 한 번 보여 줌 (없으면 조용히 넘어감)
const NEWS={
  'v0.120':`· 가족 달력 스티커도 <b>내 스티커 고치기 화면</b> 그대로: 하루 몇 번 · 요일 · 매일 · <b>일정 맞춤</b>(유치원 가는 날만) · 매달 · 기간 · 알림 (내 폰에서)\n· 🎒 학원 · 취미 · 동아리는 <b>스위치</b>: 켜면 펼쳐지고 바로 적용 · 끄면 안 씀\n· 스티커 목록에 <b>기분</b> · <b>아이 · 육아</b> 탭 · 근무(인수인계 · 재고 조사 · 점검 …) · 건강(체온 · 혈압 · 낮잠 …) · 생활 · 돈(월급날 · 공과금) 더하기`,
  'v0.119':`· 가족 달력 날짜 창에 <b>⚙️ 일정 패턴</b>: 일정 종류 · 시간 · 📍 위치 · 방학 · 이 날부터 새 일정을 한곳에서 (내 근무 패턴처럼)\n· 내 <b>근무 패턴</b>에도 📍 위치 (집 · 직장)\n· 활동이 있는 날은 <b>미세먼지도 칸</b>으로: 출근 · 퇴근 · 🏊활동`,
  'v0.118':`· <b>🔁 반복 메모</b>: 메모 "자세히" → 반복 → 매달 1일 · 말일 · 말일 하루 전 … + 근무 조건 (주간인 날만 · 아니면 다음 근무 날로) · 할 일 체크는 그 날만 · 길게 누르면 이 날만 빼기\n· 설정 맨 아래 <b>💡 이럴 땐 이렇게</b>: 상황별 사용법 · [바로 가기]`,
  'v0.117':`· 가족 달력(직접 추가한 가족)에 <b>일정 종류</b>가 생겼어요: 유치원 · 반일반 · 방학특강처럼 이름 · 달력 표시(두 글자) · 시간 · 색 (내 근무타입처럼)\n· 날짜 창에서 칩으로 그날만 바꾸고, 길게 누르면 종류 고치기 · <b>🖌 여러 날 칠하기</b> · ▴ 접기 · 위쪽 ✏️🖌 는 없앴어요 (✏️ 는 가족 탭에서)\n· 가족 <b>위치</b>(학교 · 회사 동네)를 정하면 <b>등원 · 하원 날씨</b>가 날짜 창 · 가족 카드에 나와요\n· <b>📅 이 날부터 새 일정</b>: 유치원에서 학교 가요 · 그 전 날짜는 예전 그대로\n· 가족 시간표도 동그라미로 통일`,
  'v0.116':`· 가족 탭: 가족이 있으면 내 카드를 낮게, 가족 카드는 <b>2열</b>로 (5명도 한눈에)\n· 넓은 화면(태블릿 · 폴드)은 내 카드 절반 + 옆에 가족`,
  'v0.115':`· 날씨에서 학원 · 취미 · 동아리는 <b>스티커 그림 + 활동</b>으로 보여요 (출근 · 퇴근 · 🏊활동)\n· <b>미세먼지</b>도 활동 칸이 생겨요: 활동 동네가 다르거나, 그 시간에 더 나쁠 때만\n· <b>시간별 줄</b>에 활동 시간대가 따로 묶여 보여요 (시작 시각 칸도 넣어요)\n· 옷 추천은 <b>하루 한 벌</b>만 (가장 추운 때 기준) · 날씨 칸 이름이 한 줄로\n· 가족 달력 스티커 <b>설정</b>: 날짜 창 "설정 ›" → 끌어서 순서 · 고치기 · 판에서 빼기(지난 기록은 남아요) · 내 스티커 가져오기`,
  'v0.114':`· 스티커에 <b>🎒 학원 · 취미 · 동아리</b> 칸이 생겼어요 (스티커 고치기 맨 아래 · 접혀 있어요)\n· 활동 시간을 넣으면 <b>끝나면 자동으로 완료</b> · 근무 시간과 겹치는 날은 빠져요 · 알림은 30분 전으로 미리 채워 줘요\n· 날씨: 활동 있는 날은 <b>출근 · 퇴근 · 활동</b> 3칸 (그날 순서대로) · 갈 때 · 끝날 때 비 오면 알려줘요\n· 가족 달력 스티커도 요일 · 시간을 넣을 수 있어요 → 가족 탭에 "피아노 중 · 17:30 끝"`,
  'v0.113':`· <b>가족 달력</b>(직접 추가한 가족)이 내 달력처럼 보여요: 화면 모드(동그라미 · 칸 채우기) 그대로 · 날짜 창도 옆으로 밀기\n· 가족마다 <b>스티커판</b>이 따로 있어요 (처음엔 내 판 복사 · 개수 제한 없음 · 길게 누르면 고치기)\n· '학교' 대신 <b>유치원 · 학원</b>처럼 이름을 바꿀 수 있어요 (가족 ✏️)\n· 가족 탭: 내 카드가 한 줄로 넓어졌어요 · 위쪽을 누르면 오늘 달력, 날씨를 누르면 날씨\n· 또렷하게 + 동그라미: 근무 글자가 검은색 (어두운 화면은 흰색)\n· 한 달 위젯의 달력 버튼 그림을 크게`,
  'v0.112':`· 옆으로 밀기가 덜 씹혀요: 짧게 <b>툭 튕겨도</b> 넘어가고, 넘어가는 중에 또 밀어도 받아요`,
  'v0.111':`· 날짜 창을 여러 번 밀다 보면 엉뚱한 달로 튀던 것 고침`,
  'v0.110':`· <b>날씨 창</b>도 옆으로 밀면 넘어가요\n· 옆 날짜가 같은 크기로 붙어서 와요 (넘어간 뒤 크기 바뀌는 느낌 없앰 · 업무 메모 칸 높이도)\n· 밀어서 넘길 땐 진동 없음`,
  'v0.109':`· 옆으로 밀면 <b>옆 날짜가 붙어서</b> 같이 따라와요 (날짜 창 · 업무 메모 · 스티커 · <b>날씨 창</b>)\n· 업무 메모 창도 잘 넘어가요\n· 근무 시간은 <b>근무 패턴 → 근무타입(주 · 야)</b> 눌러서 정해요 · 목록에 시간과 <b>총 근무시간</b>이 보여요\n· ⏱ 연장 +시간 버튼은 <b>누를 때마다 더해져요</b> (+4 두 번 = +8시간)`,
  'v0.108':`· 옆으로 밀기가 <b>손가락을 따라</b> 움직이고 놓으면 스프링처럼 넘어가요 (날짜 창 · 업무 메모 창 · <b>스티커 창</b>)\n· 살짝 비스듬히 밀어도 잘 넘어가요 · 조금만 밀면 제자리로`,
  'v0.107':`· 날짜 창 · 업무 메모 창을 <b>옆으로 밀면</b> 전날 · 다음날로 넘어가요 (창 어디서나)\n· 가족 탭 내 카드: 상태는 "나" 옆에 · 날씨를 켰으면 <b>날씨 카드를 크게</b>, 안 켰으면 근무 중을 크게\n· 내 상태는 근무 중 · 쉬는 중 · 휴무 세 가지만 · 근무 시간은 <b>근무 패턴 화면 한 곳</b>에서 정해요\n· 그림 흰 테두리를 없앴어요\n· 어제 날씨가 비지 않게: 관측이 올라오기 전엔 받아 둔 예보로 보여 줘요`,
  'v0.106':`· <b>😷 미세먼지 시간대별</b>: 날씨 팝업 시간별 줄에 칸마다 얼굴 (지난 시간 · 지금 = 실측, 앞으로 = 예보)\n· 날씨 · 옷 · 특보 그림을 한 세트로 다시 다듬고 미세먼지 얼굴을 더 단순하게 바꿨어요\n· 날짜 창 날씨 카드는 오늘 ~ 3일 뒤만 크게, 그 뒤는 한 줄\n· 한 달 위젯 오른쪽 위 <b>📅 버튼</b> → 앱 달력으로 바로 · 제목이 가운데로\n· "응원 버튼" · "내 상태" 부가 기능을 정리했어요 (근무 시간을 정해 두면 가족 탭에 "근무 중 · 몇 시 끝"이 저절로 보여요)`,
  'v0.105':`· <b>☔ 날씨 팝업</b>: <b>시간별 줄</b>(그날 24시간 · 밀어서 보기 · 지금 칸부터) — 칸마다 내가 있는 곳 날씨 (출근 1시간 전 ~ 퇴근 1시간 뒤 = 직장, 그 밖 = 집)\n· 이미 지난 출근 칸도 그때 날씨를 흐리게 보여 줘요 · 그림을 키우고 테두리를 다듬었어요\n· <b>⚠️ 기상특보</b>(호우 · 대설 · 한파 · 폭염 · 강풍 …)와 <b>자외선</b>(선크림)도 알려 줘요\n· 날짜 창 순서: 근무 타입 → 요청 → <b>날씨 카드</b> → 메모 · 답한 근무 요청은 날짜 창에서 빠져요 (요청함엔 그대로)\n· 직장이 집과 가까우면 "같은 지역으로 볼까요?" (설정에서 바꿀 수 있어요)`,
  'v0.104':`· <b>☔ 출퇴근 날씨</b>가 그림으로 바뀌었어요: 맨 위 <b>한 줄 결론</b> · 출근/퇴근 칸에 <b>날씨 그림 · 옷 그림</b> · <b>챙길 것</b>(우산 · 마스크 · 장갑 …)\n· <b>😷 미세먼지</b>를 얼굴 8단계로 보여 줘요. 누르면 큰 화면 (출근 · 퇴근 동네 탭 · 오존 같은 항목 표 · 3일 예보)\n· 미세먼지는 이제 <b>지금 측정값</b> 기준이에요 · 출근 동네와 퇴근 동네를 따로 봐요\n· 알람 끈 뒤 날씨 카드도 같은 모양 · 아래 <b>10초 게이지</b> · 화면을 누르면 자동으로 안 닫혀요\n· 위젯 날짜 창 맨 위에 <b>오늘 · 내일 날씨 한 줄</b> (누르면 앱 날씨 팝업)`,
  'v0.103':`· <b>🕐 근무 시간</b>을 근무 패턴 화면 맨 아래에서 정해요 (정해 두면 출퇴근 날씨 · 가족 탭 "몇 시 끝"에 쓰여요)\n· <b>⏱ 연장</b>: 날짜를 눌러 근무타입 칸 끝에서 실제 출근 · 퇴근을 적어요 (근무 통계를 켠 사람)\n· <b>근무 통계</b>: 평일 · 주말 · 명절 대근, 근무 · 연장 · 야간 시간, 연차 남은 날, 명세서로 맞춘 예상 월급(세전)\n· <b>☔ 날씨</b>: 출근/퇴근 줄을 누르면 그 지역 네이버 날씨 · 지난 날짜는 기상청 실제 관측 · 미세먼지는 가까운 측정소 값`,
  'v0.102':`· <b>☔ 출퇴근 날씨</b>에 <b>👕 옷차림</b>: 출퇴근길 체감온도(바람) · 비 · 눈 · 기온차를 보고 옷과 챙길 것(우산 · 방수 신발 · 겹쳐 입기 …)을 알려줘요\n· <b>미세먼지 8단계</b>(최고 ~ 최악) + 마스크 안내(필요 없어요 · KF80 · KF94 꼭)`,
  'v0.101':`· <b>☔ 출퇴근 날씨</b>: 집 · 직장을 <b>동까지</b> 고를 수 있어요 (설정 › 부가 기능 › 출퇴근 날씨 › 집/직장). 넓은 시 · 군(산골 · 바닷가)에서 더 정확해요`,
  'v0.100':`· <b>☔ 출퇴근 날씨</b> (설정 › 부가 기능 · 켜야 보여요): 출근 땐 집, 퇴근 땐 직장 날씨와 미세먼지를 알람 끈 뒤 · 날짜 창 · 가족 탭에 보여줘요. 알람마다 "날씨만" 알림도 돼요\n· <b>오류 보고</b>: 앱에 문제가 생기면 오류 내용만 전달돼서 더 빨리 고칠 수 있어요 (설정 › 사용 통계 · 오류 보고에서 끌 수 있어요)`,
  'v0.96':`· <b>가족방에 방장이 없어졌어요</b>: 누구나 초대 · 나가기 · 가족을 빼려면 과반 찬성 (30일 넘게 안 온 사람 · 내가 초대한 지 하루 안 된 사람은 바로)\n· <b>가족 포스트잇 알림</b>: 새로 붙이거나 줄을 더하거나 할 일이 다 끝나면 (설정에서 끌 수 있어요)\n· <b>가족방에 다시 들어올 때</b> 옛 가족 메모가 무료 횟수 없이 옮겨져요\n· <b>오늘 표시 "근무 색"</b> · 모든 달력에 오늘 빛 · 작은 위젯도 칸 채우기`,
  'v0.83':`· <b>알람 시간</b>: 위아래로 돌려서 1분 단위로 골라요\n· <b>오늘 칸 빛</b>: 앱을 켤 때 · 다른 달에서 이번 달로 돌아올 때 오늘 칸에 빛이 한 바퀴 (위젯도 ‹ › 로 돌아오면)\n· <b>메모</b>: 어디서든 3줄 · "+1" 이 작아지고 · 잘린 메모 끝에 작은 "…"\n· 접고 펼 때 스티커가 커진 채 남던 문제 고침 · 1/2 배지가 잘리지 않게`,
  'v0.82':`· <b>1/2 배지</b>: 커버 화면에서 너무 컸던 걸 스티커 크기에 맞춰 작게 · <b>위젯 "오늘"</b>: 이동과 빛이 훨씬 부드럽게 · <b>메모 위치</b>: 이제 1.0보다 더 아래로 (최대 3.0)`,
  'v0.81':`· <b>위젯</b>: 맨 윗줄이 높아지고 ‹ › 버튼이 보여요 · 달을 넘기면 새 달이 미끄러져 들어와요 · 이번 달이 아니면 \"오늘로\" 버튼 · 메모 3줄 · 명절 글자가 숫자 옆에 · 앞뒤 달은 더 흐리게\n· <b>알람</b>: 시간을 1분 단위로 · 끄기 화면이 파스텔 톤으로\n· <b>달력</b>: 회사 휴무일이 명절처럼 · 오늘 띠 색 고르기(설정 › 달력 모양)\n· <b>가족방</b>: 연결이 끊겨도 바로 지우지 않고 안내해요 · 방장이 오래 안 들어오면 가족 폰에 알려요`,
  'v0.80':`· <b>칸 채우기</b>: 명절 띠가 연한 분홍으로 · 오늘 칸이 살짝 떠 보여요. 요청 링은 승인 하루 · 거절 3일 뒤 사라져요\n· 접고 펼 때 달력 모양이 그 화면 값으로 바로 바뀌어요`,
  'v0.79':`· <b>달력 모양</b>: 설정 › 화면 › 달력 모양에서 "칸 채우기"를 고를 수 있어요 (근무를 연한 칸 색으로 · 오늘은 날짜 도장 · 요청은 글자 주위 링). 기본은 예전 그대로 "동그라미"예요`,
  'v0.78':`· <b>한 달 위젯</b>: 새 모양 "칸 채우기"(근무를 연한 칸 색으로 · 오늘은 날짜 도장 · 가족 메모는 보라 선) · 설정 › 홈 화면 위젯에서 예전 "동그라미"로 바꿀 수 있어요 · 근무 요청은 위젯에서도 둥근 링으로 보여요<br>
      · <b>달력</b>: 요청이 있는 날 숫자가 빨갛게 변하지 않고 링만 보여요 · 메모 칸 높이를 더 줄였어요<br>
      · <b>공유</b>: 달력 공유에 "복사하기"(클립보드에만 담아 붙여넣기) · <b>사진 스티커</b>: 투명한 PNG 는 투명 그대로`,
  'v0.77':`· <b>가족 메모</b>: 남의 달력(보기만) 날짜 창에서도 내가 쓴 가족 메모를 고치고 지울 수 있어요 · 메모 칸이 꽉 차도 글자에 맞게 보여요<br>
      · <b>가족</b>: 가족이 생기면 내 스티커를 지금 것부터 보여 줄지 앞으로 것부터 보여 줄지 고를 수 있어요 · 내 근무표를 가족에게 올리지 못하면 이유를 알려 줘요`,
  'v0.76':`· <b>위젯</b>: 한 달 위젯(‹ › 로 12월 · 내년까지, 가족 달력으로 바꿔 보기) · 큰 위젯에서는 글자도 같이 커져요<br>
      · <b>배경</b>: 설정 › 화면 › 배경에서 "종이"를 고를 수 있어요 (기본 그대로도 돼요)<br>
      · <b>달력 메모</b>: 칸이 높은 화면에서 메모 칸이 글자에 맞게 줄었어요<br>
      · <b>사용 통계</b>: 앱을 더 좋게 만들려고 어떤 기능을 얼마나 쓰는지 횟수만 모아요(내용 · 메모 · 이름은 안 모아요). 설정 › 개인정보에서 끌 수 있어요`
};
// 사용 통계: 이름만 보냄(내용 없음). 설정에서 끄면 안 보냄 · 앱(안드로이드)에서만 동작
function track(name){if(S.stats===false)return;try{if(window.AndroidBridge&&window.AndroidBridge.logEvent)window.AndroidBridge.logEvent(String(name));}catch(e){}}
function applyStats(){try{if(window.AndroidBridge&&window.AndroidBridge.setStatsEnabled)window.AndroidBridge.setStatsEnabled(S.stats!==false);}catch(e){}}
// 가족이 생기면 한 번: 내 스티커를 가족에게 어떻게 보여 줄지 (이미 켠 사람은 안 물음)
function stkAskCheck(){
  const L=S.link;if(!L||L.stkAsked)return;
  if(L.stk){L.stkAsked=1;famSaveLocal();return;}
  if(!famOthers().length||!S.onboarded||ob||pageMode||$('#pop').classList.contains('open')||$('#sheet').classList.contains('open'))return;
  L.stkAsked=1;famSaveLocal();
  openPop(`<div class="mh">가족이 생겼어요<b>내 스티커를 가족에게 보여 줄까요?</b></div>
    <div class="mi" style="flex-direction:column;gap:8px"><button class="btn" style="width:100%" data-act="stkshare-now">지금 있는 스티커도 보여 줘요</button><button class="btn ghost" style="width:100%" data-act="stkshare-new">앞으로 만드는 스티커부터 보여 줘요</button><button class="btn ghost" style="width:100%" data-act="stkshare-no">안 보여 줘요</button></div>`);
}
function introNotice(){
  const v=appVersion();
  if(!v||!S.onboarded||ob||S.seenVer===v||pageMode||$('#pop').classList.contains('open')||$('#sheet').classList.contains('open'))return;
  S.seenVer=v;save();
  if(!NEWS[v])return;
  openPop(`<div class="mh">${esc(v)}<b>새로 생겼어요</b></div>
    <div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0;line-height:1.7">
      ${NEWS[v]}<br><br>
      <span style="color:var(--muted)">업데이트해도 내 데이터는 그대로예요.</span></div></div>
    <div class="mi"><button class="btn grow" data-act="pop-close">확인</button></div>`);
}
function addonNotice(){
  if(!S.onboarded||ob||S.addonNote==='done'||pageMode||$('#pop').classList.contains('open')||$('#sheet').classList.contains('open'))return;
  const old=S.addonNote==='old';
  S.addonNote='done';save();
  openPop(`<div class="mh">${old?'일부 기능이 옮겨졌어요':'알아 두면 좋아요'}<b>설정 › 부가 기능</b></div>
    <div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0">${old?'휴무일 · 기념일, 같이 쉬는 날, 동료 근무, 근무 통계 · 수당이 <b>부가 기능</b>으로 옮겨져 꺼져 있어요.<br>쓰던 내용은 그대로 있고, 켜면 바로 돌아와요.':'앱이 단순하게 보이도록 덜 쓰는 기능은 꺼 두었어요.<br>필요하면 <b>설정 › 부가 기능</b>에서 켜세요.'}</div></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">닫기</button><button class="btn grow" data-act="addon-go">부가 기능 보기</button></div>`);
}
// 며칠 쓴 뒤 딱 한 번: 백업을 안 켠 사람에게 "백업해 둘까요?" (구글 드라이브 기능이 있는 앱에서만 · 이미 켰거나 한 번 보여줬으면 안 나옴)
function backupNudge(){
  if(!S.onboarded||ob||pageMode||S.nudgeBk||S.drive.last||!hasBridge('driveLinked')||$('#pop').classList.contains('open')||$('#sheet').classList.contains('open'))return;
  if(Date.now()-S.born<5*864e5||!(S.myset||Object.keys(S.memos||{}).length||Object.keys(S.overrides||{}).length))return;
  try{if(window.AndroidBridge.driveLinked())return;}catch(e){return;}
  S.nudgeBk=Date.now();persist();
  openPop(`<div class="mh">백업해 둘까요?<b>폰을 바꿔도 기록이 안 사라져요</b></div>
    <div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0">근무 변경 · 메모 · 설정이 지금은 이 폰에만 있어요. 구글 드라이브에 백업해 두면 폰을 바꾸거나 앱을 지워도 그대로 불러올 수 있어요. 설정 › 백업 · 복원에서 언제든 할 수 있어요.<br><span style="color:var(--muted)">이 안내는 한 번만 나와요.</span></div></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">나중에</button><button class="btn grow" data-act="nudge-bk">백업 켜기</button></div>`);
}
function appVersion(){
  try{if(window.AndroidBridge&&window.AndroidBridge.appInfo)return 'v'+JSON.parse(window.AndroidBridge.appInfo()).version;}catch(e){}
  return '';
}

/* ---------- 근무 통계 · 수당 ---------- */
function daeDays(y,m){
  let n=0;
  for(const [k,sh] of Object.entries(S.overrides)){
    const d=parse(k);
    if(d.getFullYear()===y&&d.getMonth()===m&&isRest(baseShift(d))&&!isRest(sh)&&sh!=='교')n++;
  }
  return n;
}
/* 근무 통계 · 수당 (부가 기능 stats)
 * 기간: 급여 마감일 기준 (0 = 1일 ~ 말일 · 20 = 지난달 21일 ~ 이번 달 20일)
 * 시간: 근무 패턴의 근무 시간 + ⏱ 연장(실제 출퇴근) → 근무 · 연장(8시간 넘는 부분, 대근은 전부) · 야간(기본 22~06시)
 * 예상 월급(세전 · 대략) = 고정금 + 연장 · 야간(명세서로 거꾸로 계산한 1시간 금액) + 연차수당(쓴 만큼 덜) − 무급
 * 월급 정보는 폰에만 (가족에게 안 보냄 · 백업 포함) */
let stYM=null,stLast=null,stSub='';
function payPeriod(y,m){const c=(S.salary&&S.salary.close)||0;return c?[new Date(y,m-1,c+1),new Date(y,m,c)]:[new Date(y,m,1),new Date(y,m+1,0)];}
const payHolK=k=>!!(holName(k)||(S.compHolAsHoliday&&compHol(k)));
function statsCalc(y,m){
  const [a,b]=payPeriod(y,m),o={from:a,to:b,dayN:0,days:0,work:0,ot:0,night:0,nightShifts:0,dw:[],de:[],dh:[],vac:[],unpaid:[],edu:[],holWork:[],req:[],reqH:0,reqN:0};
  for(let d=new Date(a);d<=b;d=addDays(d,1)){
    o.dayN++;const k=fmt(d),sh=shiftOf(d),base=baseShift(d);
    if(persOn(k))continue;
    if(!isRest(base)&&isRest(sh))(typeOf(sh).unpaid?o.unpaid:o.vac).push(k);
    if(sh==='교')o.edu.push(k);
    const h=dayHours(d);if(!h)continue;
    o.days++;o.work+=h.work;o.ot+=h.ot;o.night+=h.night;
    const tt=dayTimesOf(d,sh);if(tm2m(tt.end)<=tm2m(tt.start))o.nightShifts++;
    if(h.dae&&sh!=='교')(payHolK(k)?o.dh:(d.getDay()===0||d.getDay()===6)?o.de:o.dw).push(k);
    else if(payHolK(k))o.holWork.push(k);
    if(h.req){o.req.push(k);o.reqH+=h.req;o.reqN+=h.reqN;}
  }
  return o;
}
// 명세서로 1시간 금액 거꾸로: 적은 명세서들의 (금액 합 ÷ 그 기간 시간 합) · 명세서가 없으면 직접 적은 금액
function payRates(){
  const sl=(S.salary&&S.salary.slips)||{};let ot=0,oh=0,nt=0,nh=0,lv=0,lvd=0,n=0;
  for(const [ym,x] of Object.entries(sl)){
    const [y,mo]=ym.split('-').map(Number),c=statsCalc(y,mo-1);
    if(x.ot&&c.ot>0){ot+=x.ot;oh+=c.ot;}if(x.nt&&c.night>0){nt+=x.nt;nh+=c.night;}
    if(x.lv&&x.lvd){lv+=x.lv;lvd+=x.lvd;n++;}
  }
  return {ot:oh?ot/oh:S.salary.ot||0,nt:nh?nt/nh:S.salary.nt||0,lvDay:lvd?lv/lvd:0,lvDays:n?lvd/n:0,slip:oh>0||nh>0};
}
// 올해 연차 쓴 날 (1월 1일 ~ 보고 있는 기간 끝)
// v0.127 연차 새로 시작: 1월 1일(기본) 또는 입사일(월 · 일) — 보고 있는 기간 끝(to)이 속한 1년의 시작
function leaveStart(to){const f=S.salary&&S.salary.leaveFrom;if(!f||!/^\d\d-\d\d$/.test(f))return new Date(to.getFullYear(),0,1);const [mm,dd]=f.split('-').map(Number);let a=new Date(to.getFullYear(),mm-1,dd);if(a>to)a=new Date(to.getFullYear()-1,mm-1,dd);return a;}
function leaveUsed(y,to){let n=0;for(let d=leaveStart(to);d<=to;d=addDays(d,1)){const sh=shiftOf(d);if(!isRest(baseShift(d))&&isRest(sh)&&!typeOf(sh).unpaid&&!persOn(fmt(d)))n++;}return n;}
function openStatsPage(){
  if(!stYM)stYM=[cur.y,cur.m];
  const [y,m]=stYM,c=statsCalc(y,m),P=S.salary,R=payRates();stLast=c;
  const won=n=>Math.round(n).toLocaleString('ko-KR')+'원',H=h=>`${Math.round(h*10)/10}`;
  const md2=d=>`${d.getMonth()+1}/${d.getDate()}`;
  const num=(v,l,col,list)=>`<div class="stat-item"${list?` data-act="st-list" data-l="${list}" style="cursor:pointer"`:''}><div class="num" style="color:${col}">${v}</div><p class="lbl">${l}</p></div>`;
  const dv='<div class="stat-divider"></div>';
  const daeN=c.dw.length+c.de.length+c.dh.length;
  const lvUsed=c.vac.length,lvPart=R.lvDay&&R.lvDays?Math.max(0,R.lvDays-lvUsed)*R.lvDay:0;
  const unpaidAmt=P.fixed&&c.unpaid.length?P.fixed/c.dayN*c.unpaid.length:0;
  const otAmt=R.ot*c.ot,ntAmt=R.nt*c.night;
  const show=P.fixed>0||R.ot>0||R.nt>0;
  const total=P.fixed+otAmt+ntAmt+lvPart-unpaidAmt;
  const slip=(P.slips||{})[`${y}-${pad(m+1)}`];
  const yUsed=P.leaveYear?leaveUsed(y,c.to):0;
  const line=(l,v,sub,ic)=>`<div class="prow">${ic?`<span class="npi">${npi(ic)}</span>`:''}<div class="pl2">${l}${sub?`<small class="keep">${sub}</small>`:''}</div><b class="stw">${v}</b></div>`;
  const sub=stSub,M=!sub;   // v0.151 새 모양: 첫 화면은 이번 달만 · 올해 누적 · 월급 설정은 줄을 눌러 따로
  if(sub)pageBack=()=>{stSub='';openStatsPage();};
  openPage(`
    ${pageHead(sub==='pay'?'월급 설정':sub==='year'?`${y}년 누적`:'근무 통계 · 수당')}
    <div class="pg-b np stpg">${M?`
      <div class="stnav"><button class="ib" data-act="st-prev" aria-label="지난달">‹</button><b>${y}년 ${m+1}월</b><button class="ib" data-act="st-next" aria-label="다음 달">›</button>${y!==new Date().getFullYear()||m!==new Date().getMonth()?'<button class="sttoday" data-act="st-today">이번 달</button>':''}</div>
      <div class="hint keep" style="text-align:center;padding:0 16px 10px">${md2(c.from)} ~ ${md2(c.to)}${P.close?` (매달 ${P.close}일 마감)`:''}</div>
      ${daeBox(daeN,c.dw.length,c.de.length,c.dh.length,true)}
      <div class="stat-box" style="margin:10px 16px 0">${num(lvUsed,P.leaveYear?`연차 · 남은 ${Math.max(0,P.leaveYear-yUsed)}일${P.leaveFrom?` (${+P.leaveFrom.slice(0,2)}/${+P.leaveFrom.slice(3)} 기준)`:''}`:'연차/휴가','var(--stat-vac)','vac')}${dv}${num(c.edu.length,'교육','var(--stat-edu)','edu')}${dv}${num(c.req.length,'⏱ 연장','#b0661a','req')}${dv}${num(c.holWork.length,'휴일 출근','var(--sun)','hol')}</div>
      <div class="pg-sec" style="margin-top:12px">
        ${line('근무',`${c.days}일 · 야간 ${c.nightShifts}번`,'','calendar')}
        ${line('근무 시간',`${H(c.work)}시간`,`연장 ${H(c.ot)}시간 · 야간 ${H(c.night)}시간${c.reqH?` · 연장 신청 ${H(c.reqH)}시간`:''}`,'clock')}
      </div>`:''}
      ${sub==='year'?`      ${(()=>{   // 올해 누적 (1월 ~ 보고 있는 달, 급여 마감일 기준) — 횟수 · 시간만 (금액은 이번 달만)
        const A={dw:0,de:0,dh:0,vac:0,edu:0,req:0,hol:0,work:0,ot:0,night:0};
        for(let i=0;i<=m;i++){const x=statsCalc(y,i);A.dw+=x.dw.length;A.de+=x.de.length;A.dh+=x.dh.length;A.vac+=x.vac.length;A.edu+=x.edu.length;A.req+=x.req.length;A.hol+=x.holWork.length;A.work+=x.work;A.ot+=x.ot;A.night+=x.night;}
        return `<div class="hint keep" style="text-align:center;padding:8px 16px 10px">1월 ~ ${m+1}월</div>
        ${daeBox(A.dw+A.de+A.dh,A.dw,A.de,A.dh,false)}
        <div class="stat-box" style="margin:10px 16px 0">${num(A.vac,'연차/휴가','var(--stat-vac)')}${dv}${num(A.edu,'교육','var(--stat-edu)')}${dv}${num(A.req,'⏱ 연장','#b0661a')}${dv}${num(A.hol,'휴일 출근','var(--sun)')}</div>
        <div class="hint keep" style="padding:10px 16px 0;text-align:center">근무 ${H(A.work)}시간 · 연장 ${H(A.ot)}시간 · 야간 ${H(A.night)}시간</div>`;})()}`:''}
      ${M?`${show?`<div class="pg-cap">이번 달 예상 월급</div>
      <div class="pg-sec">
        ${P.fixed?line('고정금',won(P.fixed)):''}
        ${R.ot?line('+ 연장',won(otAmt),`${H(c.ot)}시간 × ${won(R.ot)}${R.slip?' (명세서로 맞춤)':''}`):''}
        ${R.nt?line('+ 야간',won(ntAmt),`${H(c.night)}시간 × ${won(R.nt)}`):''}
        ${R.lvDay?line('+ 연차수당',won(lvPart),`연차 ${lvUsed}일 써서 ${won(R.lvDay*Math.min(lvUsed,R.lvDays))} 덜`):''}
        ${unpaidAmt?line('− 무급',`−${won(unpaidAmt)}`,`${c.unpaid.length}일`):''}
        <div class="prow sttot"><div class="pl2"><b>= 예상</b></div><b class="stw">${won(total)}</b></div>
        ${slip&&slip.tot?line('실제 (명세서)',won(slip.tot),`차이 ${slip.tot-total>=0?'+':'−'}${won(Math.abs(slip.tot-total))}`):''}
      </div>
      <div class="npfoot">세금 · 4대 보험 전 금액이에요</div>`
      :''}
      <div class="pg-sec"${show?'':' style="margin-top:12px"'}>${npRow('sliders',show?'월급 설정':'예상 월급도 볼까요?',npVal(''),{tap:1,act:'st-sub',attrs:' data-v="pay"'})}${npRow('file-text','명세서로 맞추기',npVal(Object.keys(P.slips||{}).length?`${Object.keys(P.slips).length}장`:''),{tap:1,act:'slip-open'})}${npRow('chart-line','올해 누적',npVal(''),{tap:1,act:'st-sub',attrs:' data-v="year"'})}</div>
      <div style="height:16px"></div>`:''}
      ${sub==='pay'?`<div class="pg-sec" style="margin-top:8px">
        <div class="prow"><div class="pl2">고정금</div><input type="number" class="inl" id="payFixed" inputmode="numeric" min="0" value="${P.fixed||''}" placeholder="0" style="width:120px"> 원</div>
        <div class="prow"><div class="pl2">급여 마감일<small>비우면 말일</small></div><input type="number" class="inl" id="payClose" inputmode="numeric" min="0" max="28" value="${P.close||''}" placeholder="말일" style="width:70px"> 일</div>
        <div class="prow"><div class="pl2">1년 연차</div><input type="number" class="inl" id="payLeave" inputmode="numeric" min="0" max="60" value="${P.leaveYear||''}" placeholder="0" style="width:70px"> 일</div>
        ${P.leaveYear?`<div class="prow"><div class="pl2">연차 새로 시작<small>${P.leaveFrom?'입사일마다 새로 세요':'1월 1일마다 새로 세요'}</small></div><div class="chips"><button class="${P.leaveFrom?'':'on'}" data-act="leave-from" data-v="">1월 1일</button><button class="${P.leaveFrom?'on':''}" data-act="leave-from" data-v="in">입사일</button></div></div>${P.leaveFrom?`<div class="prow"><div class="pl2">입사일 (월 · 일)</div>${tpick('payLeaveFrom',`${new Date().getFullYear()}-${P.leaveFrom}`,'','date')}</div>`:''}`:''}
        <div class="prow"><div class="pl2">야간 기준</div><span class="ptm-t">${tpick('payNs',P.night[0])}<em>~</em>${tpick('payNe',P.night[1])}</span></div>
        ${R.slip?'':`<div class="prow"><div class="pl2">연장 1시간 금액</div><input type="number" class="inl" id="payOt" inputmode="numeric" min="0" value="${P.ot||''}" placeholder="0" style="width:100px"> 원</div>
        <div class="prow"><div class="pl2">야간 1시간 금액</div><input type="number" class="inl" id="payNt" inputmode="numeric" min="0" value="${P.nt||''}" placeholder="0" style="width:100px"> 원</div>`}
      </div>
`:''}
    </div>`,'stats');
}
// 대근 칸: 큰 숫자 = 전체 · 아래 줄 = 평일 · 주말 · 명절 (이번 달은 누르면 날짜 목록)
function daeBox(n,w,e,h,tap){
  const a=l=>tap?` data-act="st-list" data-l="${l}"`:'';
  return `<div class="stat-box stdae" style="margin:0 16px"><div class="stdae-n"${a('dae')}><div class="num" style="color:var(--stat-dae)">${n}</div><p class="lbl">대근</p></div>
    <div class="stdae-sub"><button${a('dw')}>평일 <b>${w}</b></button><span>·</span><button${a('de')}>주말 <b>${e}</b></button><span>·</span><button${a('dh')}>명절 · 공휴일 <b>${h}</b></button></div></div>`;
}
// 명세서로 맞추기: 그 달(마감 기준) 연장 · 야간 · 연차수당 금액 → 1시간 금액을 거꾸로
let slipYM='';
function openSlipPage(){
  const now=new Date();if(!slipYM){const d=new Date(now.getFullYear(),now.getMonth()-1,1);slipYM=`${d.getFullYear()}-${pad(d.getMonth()+1)}`;}
  const x=(S.salary.slips||{})[slipYM]||{},[y,mo]=slipYM.split('-').map(Number),c=statsCalc(y,mo-1);
  const ms=[...Array(6)].map((_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-i,1);return `${d.getFullYear()}-${pad(d.getMonth()+1)}`;});
  const inp=(id,l,v,sub,w)=>`<div class="prow"><div class="pl2" style="font-weight:500">${l}</div><input type="number" class="inl" id="${id}" inputmode="numeric" min="0" value="${v||''}" placeholder="0" style="width:${w||120}px;text-align:right"> <span class="un">${id==='slLvd'?'일':'원'}</span></div>`;
  openPage(`${pageHead('명세서로 맞추기')}
    <div class="pg-b np">
      <div class="wlchips npmc">${ms.map(k=>`<button class="${k===slipYM?'on':''}" data-act="slip-ym" data-v="${k}">${+k.slice(5)}월${(S.salary.slips||{})[k]?' ✓':''}</button>`).join('')}</div>
      <div class="hint keep" style="padding:4px 16px 10px;text-align:center">${+slipYM.slice(5)}월 명세서 기간: ${c.from.getMonth()+1}/${c.from.getDate()} ~ ${c.to.getMonth()+1}/${c.to.getDate()} · 달력으로 연장 ${Math.round(c.ot*10)/10}시간 · 야간 ${Math.round(c.night*10)/10}시간</div>
      <div class="pg-sec">
        ${inp('slOt','연장 수당',x.ot)}
        ${inp('slNt','야간 수당',x.nt)}
        ${inp('slLv','연차 수당',x.lv)}
        ${inp('slLvd','그 연차 며칠치',x.lvd,'',90)}
        ${inp('slTot','지급 총액',x.tot)}
      </div>
      ${(S.salary.slips||{})[slipYM]?'<div class="nplink" data-act="slip-del" style="color:#e5484d">이 달 명세서 지우기</div>':''}
      <div class="pg-sec" style="margin-top:12px">${npRow('help','명세서는 어떻게 적어요?',npVal(''),{tap:1,act:'slip-help'})}</div>
    </div>`,'slip');
}
function slipSet(f,v){S.salary.slips=S.salary.slips||{};const x=(S.salary.slips[slipYM]=S.salary.slips[slipYM]||{ot:0,nt:0,lv:0,lvd:0,tot:0});x[f]=Math.max(0,Math.round(+v||0));if(f==='lvd')x.lvd=Math.min(31,x.lvd);if(!x.ot&&!x.nt&&!x.lv&&!x.tot)delete S.salary.slips[slipYM];save();}
function stList(l){
  const c=stLast;if(!c)return;
  const L={dae:['대근',[...c.dw,...c.de,...c.dh].sort()],dw:['평일 대근',c.dw],de:['주말 대근',c.de],dh:['명절·공휴일 대근',c.dh],vac:['연차/휴가',c.vac],edu:['교육',c.edu],req:['⏱ 연장',c.req],hol:['휴일 출근',c.holWork]}[l];if(!L)return;
  const row=k=>{const d=parse(k),h=l==='req'?dayHours(d):null;return `<button class="mi" data-act="st-go" data-k="${k}">${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]})<small style="margin-left:auto;color:var(--muted)">${esc(shiftLabel(shiftOf(d)))}${h&&h.req?` · +${Math.round(h.req*10)/10}시간`:''}${holName(k)?' · '+esc(holName(k)):''}</small></button>`;};
  openPop(`<div class="mh">${L[0]}<b>${L[1].length}일</b></div><div class="wxlist">${L[1].map(row).join('')||'<div class="mi" style="color:var(--muted)">없어요</div>'}</div><button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);
}
/* ---------- 가족 연결 (1차: 한 폰 체험) ---------- */

/* ---------- 메모 색 ---------- */
const MEMO_PAL=['#7b5cf0','#5b8fc7','#5b8def','#2f6bf0','#0fa3b1','#1f8f75','#43a047','#f08c00','#e8590c','#c2255c','#e0455c','#8a65c9','#6b7280','#3a3d43','#795548'];
function openColorsPage(){   // v0.151 새 모양 · 가족 메모는 보라 고정 → 나만 보는 메모 색만 (보라 계열은 빼서 헷갈리지 않게)
  const c=S.memoColors,pal=MEMO_PAL.filter(x=>!isPurple(x));
  openPage(`${pageHead('메모 색')}
    <div class="pg-b np">
      <div class="pg-cap">미리보기</div>
      <div class="pg-sec">
        <div class="mcard fam" style="cursor:default;margin:12px 12px 6px"><div class="mt2">아빠 생신 저녁 7시</div></div>
        <div class="mcard my" style="cursor:default;margin:0 12px 12px"><div class="mt2">차 정기점검</div></div>
      </div>
      <div class="pg-cap">나만 보는 메모 색</div>
      <div class="pg-sec"><div class="npdots">${pal.map(x=>`<button class="${c.my===x?'on':''}" style="background:${x}" data-act="mcolor" data-k="my" data-v="${x}" aria-label="색"></button>`).join('')}</div></div>
      <div class="nplink" data-act="mcolor-reset">기본 색으로</div>
    </div>`,'colors');
}
const isPurple=h=>{const [r,g,b]=hexRgb(h);return b>150&&r>90&&g<130&&r<200;};

/* ---------- 근무 패턴 · 근무타입 · 조 ---------- */
// 같은 근무가 이어지는 칸에 "첫날·둘째날" 이름 붙이기
function posLabels(pat,nm,rs){
  nm=nm||shiftLabel;rs=rs||isRest;const out=[];
  for(let i=0;i<pat.length;i++){
    const s=pat[i];let start=i;while(start>0&&pat[start-1]===s)start--;
    let end=i;while(end<pat.length-1&&pat[end+1]===s)end++;
    const n=i-start+1,len=end-start+1;
    const name=rs(s)?(start>0?`${nm(pat[start-1])} 후 ${nm(s)}`:nm(s)):nm(s);
    out.push(len>1?`${name} ${['첫날','둘째날','셋째날','넷째날','다섯째날','여섯째날'][n-1]||n+'일째'}`:name);
  }
  return out;
}
const PAT_MAX=60,TEAM_MAX=8;
const patPos=d=>{const n=S.pattern.length;return((dayNum(d)-dayNum(parse(S.anchor)))%n+n)%n;};
// 조 g 의 오늘 칸 번호
const teamPos=(g,d)=>{const n=S.pattern.length,o=S.teamOffsets;return((patPos(d)+(o[g]||0)-(o[S.myTeam]||0))%n+n)%n;};
const quickN=()=>S.quickN===4||S.quickN===8?S.quickN:(new Set(S.pattern||[]).size>=5?8:4);
// 근무타입 목록에 보일 시간 (v0.109): 정했으면 "07:00 → 19:00" · 안 정했으면 "시간 정하기" · 쉬는 타입 "쉬는 날"
// 출근 → 퇴근 총 시간 (퇴근이 더 이르면 다음날로 셈)
function totH(a,b){let m=tm2m(b)-tm2m(a);if(m<=0)m+=1440;return fmtH(m/60);}
function typeTimeTxt(x){
  if(x.rest||x.k===NONE_K)return '쉬는 날';
  if(!timesCustom(x.k))return '시간 정하기 ›';
  const t=timesOf(x.k);return `${t.start} → ${tm2m(t.end)<=tm2m(t.start)?'다음날 ':''}${t.end} · ${totH(t.start,t.end)}`;
}
function typeListHtml(){
  // v0.145: 근무 종류 = 칩 줄(꾹 눌러 끌기 · 추가) + 근무마다 시간 줄 + 바로 보이는 개수
  return `<div class="pg-cap pcap">근무 종류</div>
    <div class="pg-sec">
      <div class="tchipgrid" id="tlist" style="padding:14px 12px 6px">${S.types.map((x,i)=>`<div class="tl2 tl ${i<quickN()?'top4':''}" data-i="${i}" data-act="type-edit-page" data-s="${esc(x.k)}">${badge(x.k,'sm')}<small>${esc(x.name)}</small></div>`).join('')}<button class="tl2 add" data-act="type-pick-page"><i>＋</i><small>추가</small></button></div>
      <!-- v0.171 근무마다 시간 줄 뺌 (시간 = 근무 칩 → 편집 창 · 출퇴근 시간 · 날씨) -->
      ${npRow('calendar-days','보이는 개수',`<div class="npseg sm"><button class="${S.quickN?'':'on'}" data-act="quickn" data-v="0">자동</button><button class="${S.quickN===4?'on':''}" data-act="quickn" data-v="4">4개</button><button class="${S.quickN===8?'on':''}" data-act="quickn" data-v="8">8개</button></div>`)}
    </div>`;
}
// 근무타입 칩 · 패턴 칸을 꾹 눌러 끌어서 순서 바꾸기 (S.types · S.pattern 순서가 그대로 저장됨 · 바로 반영)
let gdg=null;
document.addEventListener('pointerdown',e=>{
  const el=e.target.closest&&e.target.closest('#tlist .tl,#pgrid .pc,.stgrid [data-act="slot-open"],.mstgrid [data-act="mslot-open"],.mygrid [data-act="mine-open"]');if(!el||(e.button&&e.button>0))return;
  const ms=el.dataset.act==='mslot-open',mn=el.dataset.act==='mine-open',kind=mn?'mine':ms?'mslot':el.classList.contains('tl')?'type':el.classList.contains('pc')?'pat':'slot',grid=kind==='slot'||ms||mn?el.closest('.stgrid'):null,sel=mn?'[data-act="mine-open"]':ms?'[data-act="mslot-open"]':'[data-act="slot-open"]',idx=grid?[...grid.querySelectorAll(sel)].indexOf(el):+el.dataset.i;
  gdg={id:e.pointerId,kind,grid,sel,from:idx,over:idx,el,x0:e.clientX,y0:e.clientY,on:false};
  gdg.t=setTimeout(()=>{if(gdg&&!gdg.on){const g=gdg;g.on=true;g.el.classList.add('drag');g.items=g.grid?[...g.grid.querySelectorAll(g.sel)]:[...document.querySelectorAll(g.kind==='type'?'#tlist .tl':'#pgrid .pc')];g.rects=g.items.map(r=>r.getBoundingClientRect());g.items.forEach(r=>{if(r!==g.el)r.style.transition='transform .2s cubic-bezier(.2,.9,.25,1)';});buzz(10);}},380);
},true);
document.addEventListener('pointermove',e=>{
  const g=gdg;if(!g||e.pointerId!==g.id)return;
  if(!g.on){if(Math.hypot(e.clientX-g.x0,e.clientY-g.y0)>10){clearTimeout(g.t);gdg=null;}return;}
  g.el.style.transform=`translate(${e.clientX-g.x0}px,${e.clientY-g.y0}px)`;
  const items=g.items,R=g.rects;let o=g.over;   // v0.222 처음 자리(그대로 둔 칸 위치)로 맞춰 봄 · 제자리로 돌아오면 원래대로
  R.forEach((b,i)=>{if(e.clientX>=b.left&&e.clientX<=b.right&&e.clientY>=b.top&&e.clientY<=b.bottom)o=i;});
  if(o!==g.over){g.over=o;const ord=items.map((r,i)=>i);ord.splice(o,0,ord.splice(g.from,1)[0]);
    items.forEach((r,i)=>{if(r===g.el)return;const j=ord.indexOf(i);r.style.transform=j===i?'':`translate(${R[j].left-R[i].left}px,${R[j].top-R[i].top}px)`;});buzz(5);}
},true);
// 끄는 중에는 화면이 같이 스크롤되지 않게
// v0.138 화면 전체(document)에 막는 손가락 처리를 두면 달력 가로 스크롤도 앱을 기다려야 함 → 끌기가 있는 곳(설정 페이지 · 팝업)에만
['#page','#pop'].forEach(s=>{const el=document.querySelector(s);if(el)el.addEventListener('touchmove',e=>{if(gdg&&gdg.on&&e.cancelable)e.preventDefault();},{passive:false,capture:true});});
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,e=>{
  const g=gdg;if(!g||e.pointerId!==g.id)return;
  clearTimeout(g.t);gdg=null;
  if(!g.on)return;
  (g.items||[]).forEach(r=>{r.style.transition='';r.style.transform='';});g.el.classList.remove('drag');
  held=true;setTimeout(()=>{held=false;},60);
  if(ev==='pointerup'&&g.over!==g.from){
    if(g.kind==='mine'){const L=[...g.grid.querySelectorAll(g.sel)];L.splice(g.over,0,L.splice(g.from,1)[0]);S.mineOrd=L.map(b=>b.dataset.key).slice(0,80);save();openStampPage();return;}
    if(g.kind==='mslot'){const m=manMember();if(m){const ids=[...g.grid.querySelectorAll(g.sel)].map(b=>b.dataset.id);ids.splice(g.over,0,ids.splice(g.from,1)[0]);const L=manSdefs(m),rest=L.filter(x=>!ids.includes(x.id));m.sdefs=ids.map(id=>L.find(x=>x.id===id)).filter(Boolean).concat(rest);save();}openManStkPage();return;}
    if(g.kind==='slot'){   // 같은 묶음(내 스티커 · ＋로 붙인 스티커) 안에서 순서만 바꿈 → 달력에서 보이는 우선순위
      const ids=[...g.grid.querySelectorAll('[data-act="slot-open"]')].map(b=>b.dataset.id);
      ids.splice(g.over,0,ids.splice(g.from,1)[0]);
      const defs=S.stamps.defs,pos=ids.map(id=>defs.findIndex(x=>x.id===id)).sort((a,b)=>a-b),objs=ids.map(id=>defs.find(x=>x.id===id));
      pos.forEach((ix,i)=>{defs[ix]=objs[i];});
      save();render();openStampPage();return;
    }
    const a=g.kind==='type'?S.types:S.pattern;a.splice(g.over,0,a.splice(g.from,1)[0]);save();render();}
  if(g.kind==='mslot')openManStkPage();else if(g.kind==='slot'||g.kind==='mine')openStampPage();else openPatternPage();
},true));
/* ---- 1번째 칸 시작 날 바꾸기 = 큰일: 자동 백업 + 바꾸기 전 패턴을 "그 날 이전 구간"으로 간직 ---- */
let patSnap=null,ancNew=null;
const ANC_KEY='eonjeswieo:before-anchor';
function askAnchor(nv){
  if(nv===S.anchor){openPatternPage();return;}
  ancNew=nv;
  const snap=patSnap||{pattern:S.pattern.slice(),anchor:S.anchor};
  const drop=(S.patOld||[]).filter(o=>o.until>=nv).length;
  const d=parse(nv);
  openPop(`<div class="mh">시작 날 바꾸기<b>${d.getMonth()+1}월 ${d.getDate()}일부터 1번째 칸</b></div>
    <div class="mi" style="display:block"><div class="hint" style="padding:0;margin:0">먼저 <b>자동 백업</b>해요. 이 날 이전은 지금까지 쓰던 패턴이 그대로 남아요.${drop?` (이전 구간 ${drop}개 정리)`:''}</div></div>
    <div class="mi" style="gap:8px;flex-direction:column"><button class="btn" style="width:100%" data-act="anc-keep">이 날부터 새 패턴 (이전은 그대로)</button><button class="btn ghost" style="width:100%" data-act="anc-all">처음부터 전부 바꾸기</button><button class="btn ghost" style="width:100%" data-act="anc-cancel">취소</button></div>`);
}
function ancBackup(){
  try{
    const data=backupData();
    if(hasBridge('driveLinked')&&window.AndroidBridge.driveLinked()&&hasBridge('driveBackup')){window.AndroidBridge.driveBackup(JSON.stringify(data),JSON.stringify(backupMeta()),true);autoSilent=true;}
    localStorage.setItem(ANC_KEY,JSON.stringify(data));   // 폰 안에도 한 번 (드라이브를 안 쓰는 사람용 · 가장 최근 1개)
  }catch(e){}
}
function ancApply(keep){
  const nv=ancNew;if(!nv)return;ancNew=null;
  const snap=patSnap||{pattern:S.pattern.slice(),anchor:S.anchor};
  ancBackup();
  if(keep){
    S.patOld=(S.patOld||[]).filter(o=>o.until<nv);
    S.patOld.push({until:nv,pattern:snap.pattern.slice(),anchor:snap.anchor});
    S.patOld.sort((a,b)=>a.until<b.until?-1:1);
    if(S.patOld.length>20)S.patOld=S.patOld.slice(-20);
  }
  S.anchor=nv;patSnap={pattern:S.pattern.slice(),anchor:S.anchor};
  save();render();closePop();openPatternPage();
  toast(keep?'바꿨어요 · 이전 날짜는 옛 패턴 그대로예요':'바꿨어요 · 전체를 새 패턴으로 계산해요');
}
function restoreAnchorBackup(){
  let d=null;try{d=JSON.parse(localStorage.getItem(ANC_KEY)||'null');}catch(e){}
  if(!d){toast('되돌릴 백업이 없어요');return;}
  if(!confirm('시작 날을 바꾸기 직전 상태로 되돌릴까요?\n(그 뒤에 바꾼 근무 · 메모도 그때 상태로 돌아가요)'))return;
  if(applyBackup(d)){patSnap=null;render();openPatternPage();toast('바꾸기 전 상태로 되돌렸어요');}
}
function openPatOld(){
  const po=S.patOld||[];
  const lb=po.map((o,i)=>{const from=i?po[i-1].until:'';const u=parse(o.until);const f=from?parse(from):null;
    return `<div class="prow"><div class="pl2">${f?`${f.getMonth()+1}/${f.getDate()}`:'처음'} ~ ${u.getMonth()+1}/${u.getDate()} 전까지<small>${o.pattern.length}일 반복 · 시작 ${o.anchor.slice(5).replace('-','/')}</small></div><div class="pv" style="display:flex;gap:2px">${o.pattern.slice(0,8).map(k=>badge(k,'xs')).join('')}</div></div>`;}).join('');
  openPop(`<div class="mh">이전 패턴<b>시작 날을 바꾸기 전 패턴이에요</b></div><div class="mi" style="display:block;padding:0">${lb||'<div class="hint">없어요</div>'}</div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pat-old-clear">이전 패턴 지우기</button><button class="btn grow" data-act="pop-close">닫기</button></div>`);
}
// v0.119 근무 패턴에도 위치 (집 · 직장) — 가족 "일정 패턴" 과 같은 자리 · 누르면 출퇴근 날씨 설정
function patLocHtml(row){if(!wxOn())return '';const h=wxOk(S.wx.home)?wxName(S.wx.home):'',w=wxOk(wxWk())&&wxWk()!==S.wx.home?wxName(wxWk()):'';
  const r=npRow('map-pin','위치',npVal(h?`${esc(h)}${w?` · ${esc(w)}`:''}`:'정하기'),{tap:1,act:'pat-loc'});return row?r:`<div class="pg-sec" style="margin-top:12px">${r}</div>`;}
function patResetOpen(q){
  const n=new Date(),y=n.getFullYear(),m=n.getMonth(),ks=Object.keys(S.overrides||{}).sort();
  const r=q==='n'?[fmt(new Date(y,m+1,1)),fmt(new Date(y,m+2,0))]:q==='a'?[ks[0]||fmt(n),ks[ks.length-1]||fmt(n)]:[fmt(new Date(y,m,1)),fmt(new Date(y,m+1,0))];
  openPop(`<div class="mh">직접 바꾼 근무를 패턴대로 되돌려요<b>패턴 제외 초기화</b></div><div class="mbody">
    <div class="row" style="gap:8px;margin:10px 0"><input type="date" id="prS" value="${r[0]}" style="flex:1"><span>~</span><input type="date" id="prE" value="${r[1]}" style="flex:1"></div>
    <div class="chips left">${[['m','이번 달'],['n','다음 달'],['a','전체']].map(([v,l])=>`<button class="${q===v?'on':''}" data-act="pr-q" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="row" style="margin-top:14px;gap:8px"><button class="btn ghost" style="flex:1" data-act="pop-close">취소</button><button class="btn danger-fill" style="flex:1" data-act="pr-go">초기화</button></div></div>`);
}
// v0.171 동료 근무 화면 (부가 기능): 조별 근무(오늘부터 · 조 맞추기) · 한 달 표 · 조 이름 · 개수 — 근무 패턴 화면에서 옮김
function teamGridHtml(){
  const n=S.pattern.length,t0=new Date();
  const tc=teamCount(),cols=Math.min(n,10);
  const days=[...Array(cols)].map((_,i)=>addDays(t0,i));
  let tg=`<span></span>${days.map((d,i)=>`<span class="th ${i===0?'t':''}">${i===0?'오늘':DOW[d.getDay()]}<br>${d.getDate()}</span>`).join('')}<span></span>`;
  for(let g=0;g<tc;g++){
    const me=g===S.myTeam,p=teamPos(g,t0);
    tg+=`<button class="tn ${me?'me':''}" data-act="trow" data-g="${g}" data-hold="team">${esc(teamName(g))}${me?'<small>내 조</small>':''}</button>`
      +days.map((d,i)=>`<span class="tc ${me?'me':''}" data-act="trow" data-g="${g}">${badge(S.pattern[(p+i)%n],'xs')}</span>`).join('')
      +(me?'<span></span>':`<span class="ta"><button data-act="toff" data-g="${g}" data-v="1" aria-label="왼쪽으로">‹</button><button data-act="toff" data-g="${g}" data-v="-1" aria-label="오른쪽으로">›</button></span>`);
  }
  return `<div class="tgrid" style="--cols:${cols};padding:10px 8px 4px">${tg}</div>`;
}
let colM=null;
function openColleaguePage(){
  const t0=new Date();if(!colM)colM={y:t0.getFullYear(),m:t0.getMonth()};
  const tc=teamCount(),ok=tc>1&&!S.noPat&&S.pattern.length>1;
  const my=teamName(S.myTeam);
  openPage(`${pageHead('동료 근무')}
    <div class="pg-b np">
      ${ok?`<div class="pg-cap">조별 근무</div><div class="pg-sec">${teamGridHtml()}</div>
      <div class="pg-cap">한 달</div>
      <div class="pg-sec colm"><div class="colmh"><button data-act="col-mon" data-v="-1" aria-label="이전 달">${npi('chevron-left',20)}</button><b>${colM.y===t0.getFullYear()?'':colM.y+'년 '}${colM.m+1}월</b><button data-act="col-mon" data-v="1" aria-label="다음 달">${npi('chevron-right',20)}</button></div>${renderColleague(colM.y,colM.m)}</div>`:''}
      <div class="pg-cap">조</div>
      <div class="pg-sec">
        ${npRow('users','조 이름 · 개수 고치기',npVal(tc>1?tc+'개':''),{tap:1,act:'tedit'})}
        ${tc>1?npRow('user','내 조',npVal(`<b style="color:var(--accent);font-weight:800">${esc(my)}</b>`),{tap:1,act:'col-mine'}):''}
      </div>
    </div>`,'colleague');
}
const teamRefresh=()=>{if(pageMode==='colleague')openColleaguePage();else openPatternPage();};
function openPatternPage(){
  // v0.145 새 모양: 위 칸(근무 이름 · 반복 · 오늘 칸 · 패턴 칸) · 근무 종류 · 패턴 설정 · 조별 근무 · 기타 · 설명 줄 없음
  const resetRow=npRow('eraser','패턴 제외 초기화',npVal(''),{tap:1,act:'pat-reset'});
  const persRow=npRow('user','개인 캘린더로 쓰기',npVal(''),{tap:1,act:'personal-on'});
  if(S.noPat){   // 정해진 순서가 없을 때: 순서 만들기 · 칠하기만
    openPage(`${pageHead('근무 패턴')}
      <div class="pg-b np">
        <div class="pg-sec" style="margin-top:8px">
          ${npRow('rotate-ccw',S.myset?'정해진 순서로 만들기':'내 근무표 만들기',npVal(''),{tap:1,act:'redo-onboard'})}
          ${npRow('paintbrush','달력에 칠하기',npVal(''),{tap:1,act:'paint-open'})}
          ${patLocHtml(1)}
          ${Object.keys(S.overrides).length?resetRow:''}
        </div>
        ${typeListHtml()}
        <div class="pg-cap">기타</div><div class="pg-sec">${persRow}</div>
      </div>`,'pattern');
    return;
  }
  const n=S.pattern.length,t0=new Date(),cp=patPos(t0),lb=posLabels(S.pattern);
  const tc=teamCount();
  const ct=typeOf(S.pattern[cp]),cc=ct&&tColors(ct)?tColors(ct).bg:'var(--accent)';
  const undoA=(()=>{try{return localStorage.getItem(ANC_KEY)?npRow('rotate-ccw','시작 날 바꾸기 전으로',npVal(''),{tap:1,act:'pat-undo-anchor'}):'';}catch(e){return '';}})();
  openPage(`
    ${pageHead('근무 패턴')}
    <div class="pg-b np">
      <section class="nphero nppat" style="--sc:${cc}">
        <div class="npht">${n}일 반복${tc>1?` · ${esc(teamName(S.myTeam))}`:''}</div>
        <div class="nphn">${esc(S.patternName||'내 근무')}</div>
        <div class="nphs">오늘은 <b>${cp+1}번째 칸</b> · ${esc(lb[cp])}</div>
        ${S.patWeek?`<div class="pgdow">${weekOrder().map(w=>`<span class="${w===0?'su':w===6?'sa':''}">${DOW[w]}</span>`).join('')}</div>`:''}
        <div class="pgrid ${S.patWeek?'wk7':''}" id="pgrid">${S.patWeek?'<i class="pgb"></i>'.repeat((parse(S.anchor).getDay()-(S.weekStart||0)+7)%7):''}${S.pattern.map((s,i)=>`<button class="pc ${i===cp?'pnow':''}" data-act="pcell" data-i="${i}">${badge(s,'sm')}<small>${i+1}</small></button>`).join('')}</div>
        <div class="nphb">${n<PAT_MAX?`<button data-act="padd">${npi('plus',16)}칸 추가</button>`:''}${n>2?`<button data-act="pdel">${npi('minus',16)}칸 빼기</button>`:''}</div>
      </section>
      ${typeListHtml()}
      <div class="pg-cap">패턴 설정</div>
      <div class="pg-sec">
        ${npRow('tag','근무 이름',`<input type="text" class="inl" id="patternName" value="${esc(S.patternName||'')}" placeholder="예: 4조2교대" maxlength="20">`)}
        ${npRow('calendar','1번째 칸 시작 날',tpick('anchor',S.anchor,'','date'))}
        ${(S.patOld||[]).length?npRow('history','이전 패턴 보기 · 지우기',npVal(S.patOld.length+'개'),{tap:1,act:'pat-old-show'}):''}
        ${undoA}
        ${npRow('calendar-off','공휴일엔 쉬어요',`<label class="sw"><input type="checkbox" id="holRest" ${S.holRest?'checked':''}><i></i></label>`)}
        ${npRow('calendar-days','요일 보기',`<label class="sw"><input type="checkbox" id="patWeek" ${S.patWeek?'checked':''}><i></i></label>`)}
        ${npRow('paintbrush','달력에 칠하기',npVal(''),{tap:1,act:'paint-open'})}
        ${patLocHtml(1)}
        ${resetRow}
      </div>
      <div class="pg-cap">기타</div>
      <div class="pg-sec">${persRow}${npRow('rotate-ccw','처음 시작 설정 다시 하기',npVal(''),{tap:1,act:'redo-onboard'})}</div>
    </div>`,'pattern');
}
/* 근무 패턴 화면 맨 아래 "🕐 근무 시간 (선택)": 근무 종류마다 출근 → 퇴근 (식사 · 수면 등 자세히는 근무 시간 화면)
 * 정한 시간은 출퇴근 날씨 · 가족 탭 "몇 시 끝" · 가족 폰 · 근무 통계(연장 · 야간 시간)에 쓰여요 */
let patTmOpen=false;
// 근무 시간은 여기 한 곳 (v0.107): 가족 탭 내 카드 · 날씨 설정 시간 줄 → 근무 패턴 화면의 근무 시간 칸을 펼친 채로
function openPatTimes(back){   // v0.109: 근무 시간은 근무타입 편집 창 — 지금(또는 다음) 근무의 편집 창을 바로 엶
  const d=new Date();let k=shiftOf(d);for(let i=0;i<14&&isRest(k);i++)k=shiftOf(addDays(d,i+1));
  const wt=workTypes(),x=!isRest(k)?typeOf(k):wt[0];if(!x){openPatternPage();return;}
  typeReturn='time';typeDraft={isNew:false,orig:x.k,k:x.k,name:x.name,color:x.color,rest:!!x.rest};openTypeEdit();
}
function patTimesHtml(){
  const wt=workTypes();if(!wt.length||!S.myset)return '';
  const set=wt.some(t=>timesCustom(t.k));
  return `<div class="pg-sec ptm"><div class="prow tap" data-act="ptm-tog"><div class="pl2">🕐 근무 시간 <span style="color:var(--muted);font-weight:600">(선택)</span></div><div class="pv">${patTmOpen?'▴':set?'정함 ›':'›'}</div></div>
    ${patTmOpen?wt.map((t,i)=>{const x=timesOf(t.k);return `<div class="prow"><div class="pl2">${badge(t.k,'sm','')} ${esc(t.name)}</div><span class="ptm-t">${tpick('ptS_'+i,x.start)}<em>→</em>${tm2m(x.end)<=tm2m(x.start)?'<small>다음날</small>':''}${tpick('ptE_'+i,x.end)}</span></div>`;}).join('')
      :''}</div>`;
}
// 패턴 칸 누르면: 어떤 근무로 할까요?
function openPatCell(i){
  const n=S.pattern.length,t0=new Date(),d=addDays(t0,((i-patPos(t0))%n+n)%n);
  openPop(`<div class="mh">${i+1}번째 칸 (${d.getMonth()+1}/${d.getDate()} ${DOW[d.getDay()]})<b>어떤 근무로 할까요?</b></div>
    <div class="mi"><div class="tchips">${S.types.map(x=>`<button class="tchip ${S.pattern[i]===x.k?'on':''}" data-act="pset" data-i="${i}" data-s="${esc(x.k)}">${badge(x.k,'tc')}<small>${esc(x.name)}</small></button>`).join('')}</div></div>
    <div class="mi"><button class="btn ghost grow" data-act="pop-close">닫기</button></div>`);
}
// 줄 누르면: 오늘 이 조 근무는?
function openTeamToday(g){
  const t0=new Date(),p=teamPos(g,t0),lb=posLabels(S.pattern);
  openPop(`<div class="mh">${esc(teamName(g))}${g===S.myTeam?' (내 조)':''}<b>오늘(${t0.getMonth()+1}/${t0.getDate()}) ${esc(teamName(g))} 근무는?</b></div>
    <div class="mi" style="display:block"><div class="pos" style="margin-top:0">${S.pattern.map((k,i)=>`<button class="${i===p?'on':''}" data-act="tpos" data-g="${g}" data-p="${i}">${badge(k)}<small>${esc(lb[i])}</small></button>`).join('')}</div></div>
    <div class="mi"><button class="btn ghost grow" data-act="pop-close">닫기</button></div>`);
}
function setTeamPos(g,p){
  const n=S.pattern.length,t0=new Date(),o=S.teamOffsets,cur=teamPos(g,t0);
  if(p===cur){closePop();return;}
  if(g===S.myTeam){
    if(!confirm('내 조 근무를 바꾸면 내 달력 근무도 같이 바뀌어요.\n바꿀까요?'))return;
    const delta=p-cur;S.anchor=addK(S.anchor,-delta);o[g]=(o[g]||0)+delta;
  }else o[g]=(((o[g]||0)+p-cur)%n+n)%n;
  save();closePop();teamRefresh();toast(`${teamName(g)} 오늘 근무를 맞췄어요`);
}
function openTeamMenu(g){
  const me=g===S.myTeam;
  openPop(`<div class="mh">조<b>${esc(teamName(g))}</b></div>
    ${me?'':`<button class="mi" data-act="tmine" data-g="${g}">⭐ 내 조로 하기</button>`}
    <button class="mi" data-act="tedit" data-g="${g}">✏️ 이름 고치기</button>
    ${me||teamCount()<2?'':`<button class="mi" data-act="tdel" data-g="${g}" style="color:var(--danger)">－ 이 조 빼기</button>`}
    <button class="mi" data-act="pop-close" style="justify-content:center;color:var(--muted)">닫기</button>`);
}
/* 조 이름 · 개수: 이름은 직접 쓰고, ✕ 로 빼고, ＋ 로 넣고, ⭐ 로 내 조 */
let tEd=null;
function openTeamEdit(focus){
  tEd={rows:[...Array(teamCount())].map((_,g)=>({name:teamName(g),off:S.teamOffsets[g]||0,orig:g})),my:S.myTeam};
  renderTeamEdit(focus);
}
function tEdPull(){if(!tEd)return;document.querySelectorAll('#pop .tnm').forEach(x=>{const r=tEd.rows[+x.dataset.i];if(r)r.name=x.value;});}
function renderTeamEdit(focus){
  const r=tEd.rows;
  openPop(`<div class="mh">조 이름 · 개수<b>회사에서 부르는 이름으로 (예: 5팀)</b></div>
    ${r.map((x,i)=>`<div class="mi ted"><button class="tstar ${i===tEd.my?'on':''}" data-act="ted-my" data-i="${i}" aria-label="내 조">${i===tEd.my?'⭐':'☆'}</button><input type="text" class="tnm" data-i="${i}" value="${esc(x.name)}" maxlength="6" placeholder="조 이름">${i===tEd.my?'<span class="tmy">내 조</span>':r.length>1?`<button class="xbtn" data-act="ted-del" data-i="${i}" aria-label="빼기">✕</button>`:'<span class="tmy"></span>'}</div>`).join('')}
    ${r.length<TEAM_MAX?'<button class="mi" data-act="ted-add" style="justify-content:center;color:var(--accent);font-weight:700">＋ 조 추가</button>':''}
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="pop-close">취소</button><button class="btn grow" data-act="ted-save">저장</button></div>`);
  const f=focus!=null&&document.querySelector(`#pop .tnm[data-i="${focus}"]`);if(f)f.focus();
}
function teamEdAdd(){
  tEdPull();const n=S.pattern.length,r=tEd.rows,used=new Set(r.map(x=>((x.off%n)+n)%n));
  let v=0;for(let i=0;i<n;i++){if(!used.has(i)){v=i;break;}}
  const names=new Set(r.map(x=>x.name.trim()));let j=0;while(names.has(String.fromCharCode(65+j)+'조'))j++;
  r.push({name:String.fromCharCode(65+j)+'조',off:v,orig:null});renderTeamEdit(r.length-1);
}
function teamEdSave(){
  tEdPull();const r=tEd.rows,my=tEd.my;
  const names=r.map((x,i)=>x.name.trim().slice(0,6)||String.fromCharCode(65+i)+'조');
  const added=r.some(x=>x.orig==null);
  S.teamOffsets=r.map(x=>x.off);S.teamNames=names;S.teamStyle='custom';S.myTeam=my;
  // 가족 중 교대근무: 원래 조를 따라감 (빠진 조였으면 내 조로)
  (S.family||[]).forEach(m=>{if(m.team==null)return;const i=r.findIndex(x=>x.orig===m.team);m.team=i<0?null:i;});
  tEd=null;save();closePop();teamRefresh();
  toast(added?'새 조는 줄을 눌러 오늘 근무를 맞춰 주세요':'조를 저장했어요');
}
function teamDel(g){
  if(g===S.myTeam||teamCount()<2)return;
  if(!confirm(`${teamName(g)}을(를) 뺄까요?`))return;
  S.teamOffsets.splice(g,1);if(Array.isArray(S.teamNames))S.teamNames.splice(g,1);
  if(S.myTeam>g)S.myTeam--;
  (S.family||[]).forEach(m=>{if(m.team==null)return;if(m.team===g)m.team=S.myTeam;else if(m.team>g)m.team--;});
  save();closePop();openPatternPage();
}

/* ---------- 회사 휴무일 ---------- */
let chDraft={date:'',name:'',yearly:true,kind:'memo',emoji:'🎂',rem:[1],remAt:'20:00'},chOpen=false,remEd=null;
const ANNIV_EMOJI=['🎂','💍','🎉','🕯','⭐','🌸','🎁','🏥','✈️','📌'];
const OFF_EMOJI=['🏢','🏭','🏬','🎌','🏖','📌'];
function holNext(x){return ddayNext(x);}
function openCompPage(){
  const list=[...(S.companyHols||[])].sort((a,b)=>holNext(a).localeCompare(holNext(b)));
  const when=x=>x.yearly?`매년 ${+x.date.slice(5,7)}월 ${+x.date.slice(8)}일`:`${x.date.slice(0,4)}년 ${mdw(x.date)}`;
  const left=x=>{const n=dDiff(holNext(x));return n===0?'오늘':n===1?'내일':n>0?`${n}일 뒤`:'지남';};
  const row=x=>`<div class="prow hrow tap" data-act="comp-row" data-id="${x.id}">   <!-- v0.198 줄은 깔끔하게 · 누르면 작은 창에서 휴무/메모만 · 아이콘 · 알림 · 삭제 -->
      <span class="hic">${ico(x.emoji||(x.kind==='memo'?'⭐':'🏢'))}</span>
      <div class="pl2">${esc(x.name)}<small class="keep">${when(x)} · ${left(x)} · ${x.kind==='memo'?'메모만':'휴무'}${x.rem.length?` · 알림 ${remShort(x)}`:''}</small></div>
      <div class="pv">›</div></div>`;
  const d=chDraft,memo=d.kind==='memo';
  openPage(`
    ${pageHead('휴무일 · 기념일')}
    <div class="pg-b np">
      ${list.length?`<div class="pg-sec" style="margin-top:8px">${list.map(row).join('')}</div>`:chOpen?'':`<div class="npempty"><div class="ei">${npi('calendar',26)}</div>아직 없어요</div>`}
      ${chOpen?`<div class="pg-cap">추가하기</div>
      <div class="pg-sec" style="padding:14px 16px">
        <div class="npseg"><button class="${memo?'':'on'}" data-act="ch-kind" data-v="off">휴무로 표시</button><button class="${memo?'on':''}" data-act="ch-kind" data-v="memo">메모만</button></div>
        <div class="row" style="margin-top:10px"><button class="chi" data-act="ch-ico" aria-label="아이콘">${ico(d.emoji||(memo?'🎂':'🏢'))}</button><input type="text" id="chName" placeholder="${memo?'이름 (예: 결혼기념일)':'이름 (예: 창립기념일)'}" value="${esc(d.name)}" maxlength="20" style="flex:1"></div>
        <div class="prow" style="padding:10px 0 0;min-height:0;border:0"><div class="pl2">날짜</div>${tpick('chDate',d.date,'','date')}</div>
        <label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:14px"><input type="checkbox" id="chYearly" ${d.yearly?'checked':''}> 매년 반복</label>
        <div class="prow" style="padding:8px 0 0;min-height:0;border:0"><div class="pl2">알림</div><button class="tbtn" data-act="rem-open" data-id="__draft"><span>${d.rem.length?`${remShort(d)} · ${remAtLabel(d.remAt)}`:'안 받음'}</span></button></div>
        <button class="btn" style="width:100%;margin-top:12px" data-act="comp-add">추가</button>
      </div>`:`<div class="npbtn"${list.length?'':' style="padding-top:0"'}><button class="btn" data-act="comp-open">휴무일 · 기념일 추가</button></div>`}
      <div class="pg-sec"${chOpen?' style="margin-top:12px"':''}>
        ${npRow('building','휴무일 출근은 휴일 근무로',`<label class="sw"><input type="checkbox" id="compHolAsHoliday" ${S.compHolAsHoliday?'checked':''}><i></i></label>`)}
      </div>
    </div>`,'comp');
}
function chPull(){const n=$('#chName'),y=$('#chYearly'),dt=$('#chDate');if(n)chDraft.name=n.value;if(y)chDraft.yearly=y.checked;if(dt)chDraft.date=dt.value;}
// 알림 고르기 창: 며칠 전(여러 개) + 시각
function openRem(id){
  if(id==='__draft')chPull();
  const x=id==='__draft'?chDraft:(S.companyHols||[]).find(y=>y.id===id);if(!x)return;
  remEd={id,rem:[...(x.rem||[])],at:x.remAt||'20:00',name:x.name};
  renderRem();
}
function renderRem(){
  const r=remEd;if(!r)return;
  openPop(`<div class="mh">${esc(r.name||'휴무일 · 기념일')}<b>언제 알려드릴까요?</b></div>
    <div class="mi" style="display:block"><div class="icn-lb">며칠 전</div><div class="remc">${REM_DAYS.map(v=>`<button class="${r.rem.includes(v)?'on':''}" data-act="rem-t" data-v="${v}">${REM_LABEL[v]}</button>`).join('')}</div></div>
    <div class="mi" style="display:block"><div class="icn-lb">시각</div><div class="remc">${REM_AT.map(t=>`<button class="${r.at===t?'on':''}" data-act="rem-at" data-v="${t}">${remAtLabel(t)}</button>`).join('')}</div></div>
    <div class="mi" style="gap:8px"><button class="btn ghost grow" data-act="rem-off">알림 끄기</button><button class="btn grow" data-act="rem-save">저장</button></div>`);
}
function remSave(off){
  const r=remEd;if(!r)return;
  const x=r.id==='__draft'?chDraft:(S.companyHols||[]).find(y=>y.id===r.id);remEd=null;closePop();if(!x)return;
  x.rem=off?[]:r.rem.slice().sort((a,b)=>b-a);x.remAt=r.at;x.remind=x.rem.length>0;
  if(r.id!=='__draft')save();
  openCompPage();
  if(r.id!=='__draft')toast(x.rem.length?`🔔 ${remShort(x)} · ${remAtLabel(x.remAt)}에 알려드려요`:'알림을 껐어요');
}

/* ---------- 백업 · 복원 ---------- */
let driveFiles=null,driveBusy=false;
const hasBridge=fn=>!!(window.AndroidBridge&&typeof window.AndroidBridge[fn]==='function');
function openBackupPage(){
  const linked=hasBridge('driveLinked')&&window.AndroidBridge.driveLinked();
  const files=driveFiles||[];
  const fileRow=(f,i)=>{
    const p=f.appProperties||{};
    const when=f.createdTime?new Date(f.createdTime):null;
    return `<div class="prow"><div class="pl2">${i===0?'최신 백업':'직전 백업'}<small>${when?`${when.getMonth()+1}월 ${when.getDate()}일 ${pad(when.getHours())}:${pad(when.getMinutes())}`:''}${p.shifts?` · 근무 변경 ${p.shifts}일`:''}${p.memos?` · 메모 ${p.memos}개`:''}</small></div><button class="btn sm ${i===0?'':'ghost'}" data-act="drive-restore" data-id="${f.id}">복원</button></div>`;
  };
  openPage(`
    ${pageHead('백업 · 복원')}
    <div class="pg-b np">
      <div class="pg-cap">구글 드라이브</div>
      <div class="pg-sec">
        ${!hasBridge('driveBackup')?`<div class="prow"><div class="pl2 muted">앱에서 쓸 수 있어요 (지금은 브라우저 미리보기)</div></div>`:linked?`
          <div class="prow"><div class="pl2">☁️ 연결됨<small>${esc(S.drive.email||'구글 계정')}</small></div></div>
          <div class="prow"><div class="pl2">마지막 백업<small>${S.drive.last?new Date(S.drive.last).toLocaleString('ko-KR'):'아직 없어요'}</small></div><button class="btn sm" data-act="drive-backup" ${driveBusy?'disabled':''}>${driveBusy?'백업 중…':'지금 백업하기'}</button></div>
          <div class="prow"><div class="pl2">자동 백업</div><label class="sw"><input type="checkbox" id="driveAuto" ${S.drive.auto?'checked':''}><i></i></label></div>
          ${files.length?files.slice(0,2).map(fileRow).join(''):`<div class="prow"><div class="pl2 muted">${driveFiles?'저장된 백업이 없어요':'백업 목록을 불러오는 중…'}</div></div>`}
          <div class="prow danger-row" data-act="drive-unlink" style="color:var(--muted);font-weight:600">연결 해제</div>`
        :`<div class="prow"><div class="pl2">구글 드라이브 백업 · 복원</div></div>
          <div class="prow"><button class="btn" style="width:100%" data-act="drive-link" ${driveBusy?'disabled':''}>${driveBusy?'연결 중…':'구글 계정 연결하기'}</button></div>`}
      </div>
      <div class="pg-cap">파일</div>
      <div class="pg-sec">
        ${npRow('file-text','백업 파일 만들기',npVal(''),{tap:1,act:'backup-export'})}
        ${npRow('history','백업 파일 불러오기',npVal(''),{tap:1,act:'backup-import'})}
        <input type="file" id="backupFile" accept=".json,application/json,text/plain" style="display:none">
      </div>
      ${backupRescueHtml()}
    </div>`,'backup');
  if(linked&&driveFiles===null&&!driveBusy){driveBusy=true;window.AndroidBridge.driveList(true);}
}
function backupRescueHtml(){   // 복원 직전 사본 · 못 읽은 저장 데이터가 있을 때만 나오는 칸 (없으면 아무것도 안 보임)
  let prev=null,bad=false;
  try{prev=JSON.parse(localStorage.getItem(KEY+':prev')||'null');bad=!!localStorage.getItem(KEY+':bad');}catch(e){}
  const hasPrev=!!(prev&&prev.at&&isObj(prev.s));
  if(!hasPrev&&!bad)return '';
  const w=hasPrev?new Date(prev.at):null;
  return `<div class="pg-cap">되돌리기 · 복구</div><div class="pg-sec" style="margin-top:0">
    ${hasPrev?`<div class="prow"><div class="pl2">복원 직전 상태로 되돌리기<small>${w.getMonth()+1}월 ${w.getDate()}일 ${pad(w.getHours())}:${pad(w.getMinutes())} 에 복원하기 전 모습</small></div><button class="btn sm" data-act="backup-undo">되돌리기</button></div>`:''}
    ${bad?`<div class="prow"><div class="pl2">읽지 못한 저장 데이터<small>지우지 않고 남겨 뒀어요 · 파일로 보내 둘 수 있어요</small></div><button class="btn sm" data-act="bad-export">내보내기</button></div>`:''}
  </div>`;
}
function undoRestore(){
  let prev=null;try{prev=JSON.parse(localStorage.getItem(KEY+':prev')||'null');}catch(e){}
  if(!prev||!isObj(prev.s)){toast('되돌릴 사본이 없어요');return;}
  if(!confirm('복원하기 전 상태로 되돌릴까요?\n\n(지금 데이터는 사라져요)'))return;
  S=safeNormalize(prev.s);save();applyTheme();applyFont();applyBand();
  try{localStorage.removeItem(KEY+':prev');}catch(e){}
  closeSheet();if(pageMode)closePage();render();toast('복원하기 전 상태로 되돌렸어요');
}
function exportBad(){
  let raw='';try{raw=localStorage.getItem(KEY+':bad')||'';}catch(e){}
  if(!raw){toast('남아 있는 데이터가 없어요');return;}
  const name=`eonjeswieo-unreadable-${fmt(new Date())}.json`;
  if(hasBridge('shareFile')){try{window.AndroidBridge.shareFile(name,raw);return;}catch(e){}}
  toast('앱에서만 보낼 수 있어요');
}
const BACKUP_KEYS=['stzMode','chLog','famAlias','onboarded','myset','noPat','addons','pattern','anchor','patOld','overrides','memos','alarms','tune','calLook','todayLook','todayColor','requests','board','syncSettings','pay','myTeam','teamOffsets','teamStyle','teamNames','holRest','shareMemo','patternName','types','ddays','companyHols','compHolAsHoliday','memoColors','fontScale','theme','bg','showBand','personal','pers','widget','weekStart','memoLines','quickN','patWeek','myEmo','famWk','seenVer','lastMemoColor','shiftTimes','status','family','famCheer','togOff','famDayToo','stamps','icons','wx','ot','salary'];
function backupData(){const data={app:'eonjeswieo',ver:4,at:new Date().toISOString()};BACKUP_KEYS.forEach(k=>{data[k]=S[k];});if(S.wlog&&S.wlog.backup)data.wlog=S.wlog;try{const h=wxHist();if(Object.keys(h).length)data.wxh=h;}catch(e){}return data;}   // v0.127 지난 날 날씨 기록도   // 업무 일지는 "백업에 넣기"를 켠 사람만
function backupMeta(){
  let mc=0;Object.values(S.memos).forEach(l=>mc+=l.length);
  return {shifts:String(Object.keys(S.overrides).length),memos:String(mc)};
}
function driveBackupNow(silent){
  if(!hasBridge('driveBackup'))return;
  driveBusy=true;
  try{window.AndroidBridge.driveBackup(JSON.stringify(backupData()),JSON.stringify(backupMeta()),!!silent);}catch(e){driveBusy=false;}
  if(!silent&&pageMode==='backup')openBackupPage();
}
function applyBackup(d){
  if(!d||!(d.app==='eonjeswieo'||d.app==='shiftcal')||!Array.isArray(d.pattern)){toast('언제쉬어 백업이 아니에요');return false;}
  const next={};
  BACKUP_KEYS.forEach(k=>{if(d[k]!==undefined)next[k]=d[k];});
  if(d.familyMemos)next.familyMemos=d.familyMemos;
  if(d.wlog)next.wlog=d.wlog;   // (백업에 일지가 없으면 지금 폰의 일지를 그대로 둠)
  if(isObj(d.wxh)){try{const H=wxHist();Object.keys(d.wxh).forEach(k=>{const v=d.wxh[k];if(/^\d{4}-\d\d-\d\d$/.test(k)&&isObj(v)&&(isObj(v.c)||isObj(v.f))&&!H[k])H[k]=v;});localStorage.setItem(WXH_KEY,JSON.stringify(H));}catch(e){}}   // v0.127 날씨 기록: 폰에 없는 날만 채움
  try{localStorage.setItem(KEY+':prev',JSON.stringify({at:Date.now(),s:S}));}catch(e){}   // 복원 직전 상태를 하나 남겨 둠 (백업 · 복원 화면에서 되돌리기)
  const info={};
  S=safeNormalize(Object.assign({},S,next,{onboarded:true,myset:next.myset!==undefined?!!next.myset:true,noPat:next.noPat!==undefined?!!next.noPat:false}),info);   // 예전 백업엔 myset · noPat 이 없음 → 근무표가 있는 걸로
  save();applyTheme();applyFont();applyBand();
  if(info.bad&&info.bad.length)setTimeout(()=>toast('백업의 일부 칸은 읽지 못해 기본값으로 두었어요'),400);
  return true;
}
function driveErrText(res){   // 인터넷 문제와 구글 쪽 거절을 나눠서 알려요
  if(res.err!=='http')return '인터넷 연결을 확인해 주세요';
  const m=String(res.msg||'').match(/\b(\d{3})\b/),c=m?+m[1]:0;
  if(c===401)return '구글 로그인이 만료됐어요 · 백업 연결을 다시 해 주세요';
  if(c===403)return '구글 드라이브를 쓸 수 없어요 (설정 문제 403) · 개발자에게 알려 주세요';
  if(c===429)return '요청이 많아요 · 잠시 뒤에 다시 해 주세요';
  if(c>=500)return '구글 서버가 불안정해요 · 잠시 뒤에 다시 해 주세요';
  return '구글 드라이브 오류'+(c?` (${c})`:'')+' · 잠시 뒤에 다시 해 주세요';
}
let autoSilent=false;
window.__onDrive=res=>{
  driveBusy=false;
  if(!res)return;
  const err=res.err;
  if(res.ok){
    if(res.email)S.drive.email=res.email;
    if(res.files)driveFiles=res.files;
    if(res.op==='backup'){S.drive.last=Date.now();S.drive.dirty=false;persist();if(!autoSilent)toast('☁️ 구글 드라이브에 백업했어요');}
    if(res.op==='restore'){
      let d;try{d=JSON.parse(res.data);}catch(e){toast('백업을 읽지 못했어요');return;}
      if(applyBackup(d)){S.drive.last=Date.now();S.drive.dirty=false;persist();closePage();toast('백업을 불러왔어요');}
      return;
    }
    persist();
  }else if(!autoSilent||res.op!=='backup'){
    if(err==='setup')toast('구글 연결 준비가 아직 안 됐어요 (개발자 설정 필요)');
    else if(err==='cancel')toast('취소했어요');
    else if(err==='need_login'){/* 조용히 넘어감 */}
    else toast(driveErrText(res));
  }
  autoSilent=false;
  if(pageMode==='backup')openBackupPage();
};
function autoBackup(){
  if(!hasBridge('driveLinked')||!S.drive.auto||!S.drive.dirty||!S.drive.last)return;
  if(Date.now()-S.drive.last<20*3600e3)return;
  try{if(!window.AndroidBridge.driveLinked())return;}catch(e){return;}
  autoSilent=true;driveBackupNow(true);
}

/* ---------- 권한 · 문의 · 개인정보 · 지우기 ---------- */
function isSamsung(){try{return /^samsung/i.test(JSON.parse(window.AndroidBridge.appInfo()).device||'');}catch(e){return false;}}
function openPermPage(){
  const issues=nativeIssues();
  openPage(`
    ${pageHead('알람이 잘 울리게')}
    <div class="pg-b np"><div class="pg-sec" style="margin-top:8px">
      ${PERM_KEYS.map(k=>npRow(PERM_ICON[k],PERM_NAME[k],issues.includes(k)?`<span class="warnp">켜 주세요${npi('chevron-right',16)}</span>`:`<span class="okp">${npi('check',14)}켜짐</span>`,issues.includes(k)?{tap:1,act:'nativefix',attrs:` data-k="${k}"`}:{})).join('')}
    </div>
    ${isSamsung()&&issues.includes('batt')?`<div class="pg-sec">${npRow('battery','삼성: 자동 절전 예외 앱에 넣기',npVal(''),{tap:1,act:'perm-samsung'})}</div>`:''}</div>`,'perm');   // v0.214 삼성 폰에서만 · 누르면 삼성 배터리 화면으로 바로 · v0.216 배터리 제한 없음이 꺼져 있을 때만 (켜져 있으면 삼성 자동 절전 대상이 아니라 할 일 없음 · 사용자 폰 확인)
}
function sendInquiry(){
  let info={};try{if(hasBridge('appInfo'))info=JSON.parse(window.AndroidBridge.appInfo());}catch(e){}
  let errs='';
  try{const a=JSON.parse(localStorage.getItem('eonjeswieo:err')||'[]');if(Array.isArray(a)&&a.length)errs='\n최근 오류:\n'+a.slice(-5).map(x=>{const d=new Date(+x.t||0);return `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} ${String(x.m||'').slice(0,120)} ${String(x.s||'').slice(0,40)}`;}).join('\n');}catch(e){}
  const famNo=S.link&&S.link.uid?`\n가족 연결 번호: ${String(S.link.uid).slice(0,40)}`:'';   // 서버에 남은 정보를 찾아 지울 때 쓰는 번호 (이름 · 이메일 아님)
  const body=`\n\n\n----\n앱: 언제쉬어 ${info.version||''}\n기기: ${info.device||navigator.userAgent}\n안드로이드: ${info.android||''}${famNo}${errs}`;
  if(hasBridge('sendMail')){window.AndroidBridge.sendMail(SUPPORT_MAIL,'[언제쉬어] 문의',body);return;}
  location.href=`mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent('[언제쉬어] 문의')}&body=${encodeURIComponent(body)}`;
}
const SUPPORT_MAIL='eonjeswieo.app@gmail.com';   // 문의 받을 메일 주소 (운영용)
const PRIVACY_URL='https://eonjeswieo.web.app/privacy',DELETE_URL='https://eonjeswieo.web.app/delete',PRIVACY_DATE='2026년 10월 29일';
function openPrivacyPage(){
  openPage(`
    ${pageHead('개인정보처리방침')}
    <div class="pg-b"><div class="policy">
      <b>언제쉬어 개인정보처리방침</b><br><small style="color:var(--muted)">시행일 ${PRIVACY_DATE}</small>
      <h4>1. 한 줄 요약</h4>기본은 모두 이 폰 안에만 저장돼요. <b>가족 연결</b>이나 <b>구글 드라이브 백업</b>을 직접 켰을 때만 그 정보가 구글 서버로 가요. 광고 · 분석 도구는 쓰지 않아요.
      <h4>2. 이 폰에만 저장하는 정보</h4>근무 패턴 · 근무 변경 · 메모 · 월 포스트잇 · 월급 설정(고정금 · 명세서 금액, 근무 통계를 쓸 때) · 기념일 · 회사 휴무일 · 스티커(직접 고른 사진 포함) · 알람과 앱 설정. 이름 · 전화번호 · 연락처 · 위치는 받지 않아요. "나만 보는 메모"와 개인 캘린더는 서버에 올라가지 않아요.
      <h4>3. 가족 연결을 켰을 때 서버에 올라가는 정보</h4>
      · 로그인 번호: 이름 · 이메일이 없는 무작위 번호(익명 로그인). 구글 계정으로 연결하면 그 이메일도 로그인 정보로 저장돼요.<br>
      · 가족방 정보: 내가 정한 호칭 · 초대 코드 · 권한(보기만 / 메모 · 요청 보내기).<br>
      · 내 근무표: 근무 패턴 · 바꾼 날 · 근무 종류별 출퇴근 시각 · ⏱ 연장으로 바꾼 날의 실제 출퇴근 시각 · 근무 이름과 색. "스티커 보여주기"를 켠 경우에만 고른 스티커의 기록(사진 스티커는 작게 줄인 사진)이 같이 올라가요. 약은 기본으로 빠져요.<br>
      · 가족 메모(고른 가족에게만 보여요) · 근무 요청과 답 · 보낸 횟수(무료 횟수 계산).<br>
      · 푸시 알림 주소와 자는 시간. 알림 문구에는 메모 내용을 넣지 않아요.<br>
      서버는 구글 클라우드(Firebase)이고, 데이터는 한국(서울) 서버에 저장돼요. 가족방 사람만 읽을 수 있도록 보안 규칙으로 막아 둬요.
      <h4>4. 구글 드라이브 백업 (선택)</h4>켜면 내 구글 드라이브의 "앱 전용 숨김 폴더"에 백업 파일이 저장돼요. 다른 앱이나 저희는 볼 수 없어요.
      <h4>5. 인터넷 사용</h4>공휴일 목록(공공 정보)을 하루 한 번 받아 와요. 이때 사용자 정보는 보내지 않아요.
      <h4>5-1. 사용 통계 (횟수만)</h4>앱을 더 좋게 만들려고 어떤 기능을 몇 번 쓰는지 <b>횟수와 종류만</b> 구글 분석(Firebase Analytics)으로 모아요(예: 앱을 켰다 · 가족 메모를 보냈다 · 스티커를 만들었다 · 어떤 크기의 위젯을 놓았다). 메모 · 이름 · 날짜 · 근무 내용은 모으지 않고 광고 식별자도 모으지 않아요. 설정 › 사용 통계 보내기를 끄면 모으지 않아요.
      <h4>5-2. 오류 보고</h4>앱이 멈추거나 화면에 오류가 나면 오류 내용(오류 글자 · 코드 위치) · 폰 기종 · 안드로이드 · 앱 버전을 구글 오류 보고(Firebase Crashlytics)로 보내요. 메모 · 이름 · 근무 내용은 넣지 않아요. 설정 › 사용 통계 · 오류 보고를 끄면 보내지 않아요.
      <h4>5-3. 출퇴근 날씨 (선택)</h4>켜면 고른 집 · 직장 지역(시 · 군 · 구)만 서버로 보내 기상청 날씨 · 에어코리아 미세먼지 예보를 받아 와요. 위치(GPS)는 쓰지 않고, 서버는 누가 물어봤는지 저장하지 않아요. 가족 연결을 쓰면 내 직장 지역과 출퇴근 시각이 가족에게도 보여요.
      <h4>6. 제3자 제공 · 국외 이전</h4>구글(Google LLC)이 로그인 · 데이터 저장 · 푸시 알림 · 드라이브 · 구글 로그인 · 오류 보고 서비스를 제공하기 위해 위 정보를 처리해요. 서비스를 쓰는 동안 인터넷으로 전송되고, 구글 서버(한국 · 미국 등)에 보관돼요. 광고나 마케팅 목적으로 다른 곳에 주지 않아요.
      <h4>7. 보관과 지우기</h4>
      · 이 폰의 정보: 앱을 지우거나 "내 데이터 모두 지우기"를 할 때까지.<br>
      · 서버의 정보: 가족방을 없애거나 가족방에서 나가거나 "내 데이터 모두 지우기"를 할 때까지. "내 데이터 모두 지우기"는 서버의 내 정보와 로그인 계정까지 함께 지워요. 초대 코드는 7일이 지나면 쓸 수 없어요.<br>
      · 앱을 이미 지웠다면 아래 문의 메일로 지워 달라고 요청해 주세요. 요청은 지체 없이 처리해요.<br>
      · 구글 드라이브 백업 파일은 구글 드라이브 설정 › 앱 관리에서 지울 수 있어요.
      <h4>8. 이용자의 권리</h4>언제든 내 정보를 보고, 고치고, 지우고, 처리를 멈춰 달라고 할 수 있어요. 앱 안(설정 › 도움 · 정보 › 내 데이터 모두 지우기, 설정 › 가족 연결)에서 직접 하거나 문의 메일로 요청해 주세요.
      <h4>9. 어린이</h4>만 14세 미만 어린이를 대상으로 하지 않으며, 알면서 어린이의 정보를 받지 않아요.
      <h4>10. 안전하게 지키기</h4>서버 전송은 암호화(HTTPS)되고, 서버 접근은 보안 규칙으로 가족방 사람에게만 열려 있어요. 앱 화면은 외부 스크립트를 막는 보안 설정(CSP)을 켜 두었어요.
      <h4>11. 문의 · 개인정보 보호책임자</h4>언제쉬어 운영팀 · ${SUPPORT_MAIL}<br>설정 › 문의하기에서도 보낼 수 있어요.
      <h4>12. 방침이 바뀔 때</h4>내용이 바뀌면 앱 업데이트와 이 화면 · 웹 주소에 먼저 알려요. 나중에 광고나 결제를 넣게 되면 그 전에 이 글을 먼저 고쳐요.
      <div style="margin-top:14px"><a class="btn ghost" data-act="lnk-go" data-u="${PRIVACY_URL}" style="display:block;text-align:center">웹에서 전체 보기</a></div>
      <div style="margin-top:8px"><a class="btn ghost" data-act="lnk-go" data-u="${DELETE_URL}" style="display:block;text-align:center">계정 · 데이터 삭제 안내 (웹)</a></div>
    </div></div>`,'privacy');
}
/* 내 데이터 모두 지우기: 확인 두 번 → 서버(가족방 · 알림 주소 · 로그인 계정)를 먼저 지움 → 다 되면 이 폰을 비움.
 * 서버를 못 지우면 폰은 그대로 두고 알려 줌 (서버에 남겨 둔 채 폰만 지워 버리지 않게). 그래도 하겠다고 하면 폰만 지움. */
const withTimeout=(p,ms)=>new Promise((ok,no)=>{const t=setTimeout(()=>no(new Error('timeout')),ms);Promise.resolve(p).then(v=>{clearTimeout(t);ok(v);},e=>{clearTimeout(t);no(e);});});
var wipeBusy=false,wipeRe=null;   // var: 시작 때 save() 가 불러도 안전하게
// 서버에 있는 내 것 지우기. 지울 게 없으면 조용히 끝나고, 못 지우면 throw
async function wipeServer(){
  for(let i=0;i<40&&FBX.busy;i++)await new Promise(r=>setTimeout(r,250));   // 앱을 켠 직후 연결 중이면 잠깐 기다림
  if(!(await fbAuthInit()))return;   // 설정 없음 = 서버를 안 쓰는 앱
  if(!FBX.auth.currentUser&&!S.link)return;   // 저장된 로그인도 가족방도 없음 = 서버에 지울 게 없음
  await wipeReauth();   // 구글을 이은 계정이면 서버를 건드리기 전에 먼저 (계정 삭제는 최근 로그인이 필요해서, 나중에 막혀 일부만 지워지는 일이 없게)
  const {F,db,uid}=await famReady(),L=S.link;
  // 서버에 닿는지 · 내 자리가 아직 있는지를 서버에서 직접 확인 (오프라인이면 여기서 멈춰서, 쓰기가 대기열에 쌓이지 않음)
  const mine=await withTimeout(F.getDocFromServer(L?famMember(F,db,L.hid,uid):F.doc(db,'ping',uid)),15000);
  if(L&&mine.exists())await withTimeout(famRemoveMember(L.hid,uid),45000);   // v0.96 방장 없음: 나가기와 같음 (마지막 사람이면 방도 없어짐)
  famDevKey='';famUserKey='';
  await withTimeout(Promise.all(['devices','users','ping'].map(c=>F.deleteDoc(F.doc(db,c,uid)))),20000);   // 알림 주소 · 가족방 번호 쪽지 · 연결 시험 쪽지
  await wipeUser();
}
// 구글 계정을 이은 사람은 구글 로그인을 한 번 더 (최근 로그인이어야 계정을 지울 수 있음)
async function wipeReauth(){
  const u=FBX.auth.currentUser;
  if(!u||!u.providerData.some(p=>p.providerId==='google.com'))return;
  if(!googleOn()||!confirm('구글 계정 연결까지 지우려면 구글 로그인을 한 번 더 해야 해요.\n\n[확인]을 누르면 구글 로그인 창이 열려요.'))throw new Error('reauth');
  await withTimeout(new Promise((ok,no)=>{wipeRe=r=>r?ok():no(new Error('reauth'));googleStart('reauth');}),180000).finally(()=>{wipeRe=null;});
}
// 로그인 계정(익명 · 구글 연결)까지 서버에서 지움
async function wipeUser(){
  const A=window.FB.auth;if(!FBX.auth.currentUser)return;
  try{await withTimeout(A.deleteUser(FBX.auth.currentUser),20000);}
  catch(e){
    const c=String((e&&e.code)||'');
    if(/user-not-found|user-token-expired|invalid-user-token/.test(c)){try{await A.signOut(FBX.auth);}catch(x){}return;}   // 서버에 이미 없는 계정
    if(c.includes('requires-recent-login')){
      if(FBX.auth.currentUser.providerData.some(p=>p.providerId==='google.com'))throw new Error('recent');
      try{await A.signOut(FBX.auth);}catch(x){}return;   // 익명 계정(이름 · 이메일 없는 무작위 번호)을 서버가 지우기 거부하면 로그아웃만
    }
    throw e;
  }
}
// 이 폰에 남은 Firebase 사본(오프라인 저장 · 기다리던 쓰기)을 비우고 연결 상태를 처음으로
async function fbForget(){
  famStop();
  try{if(FBX.db&&window.FB){const F=window.FB.fs;await withTimeout(F.terminate(FBX.db),5000);await withTimeout(F.clearIndexedDbPersistence(FBX.db),5000);}}catch(e){}
  FBX.st='off';FBX.uid='';FBX.err='';FBX.db=null;FBX.ping=null;
}
function wipeBox(on){
  let b=document.getElementById('wipeBox');
  if(!on){if(b)b.remove();return;}
  if(b)return;
  b=document.createElement('div');b.id='wipeBox';b.setAttribute('role','alert');
  b.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;z-index:99999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#fff;font:700 17px/1.4 system-ui,sans-serif';
  b.textContent='지우는 중이에요…';document.body.appendChild(b);
}
const wipeWhy=e=>e&&e.message==='timeout'?'서버가 응답하지 않아요':e&&e.message==='reauth'?'구글 로그인을 하지 않았어요':e&&e.message==='recent'?'계정 확인이 더 필요해요':famErr(e);
function wipeLocal(){
  try{if(hasBridge('driveUnlink'))window.AndroidBridge.driveUnlink();}catch(e){}   // 드라이브 연결 끊기 (만들어 둔 백업 파일은 사용자 드라이브에 남음)
  famClear();
  try{Object.keys(localStorage).filter(k=>/^(eonjeswieo|shiftcal):/.test(k)).forEach(k=>localStorage.removeItem(k));}catch(e){}   // 이 앱이 저장한 값 전부 (데이터 · 공휴일 사본 · 오류 기록 · 복원 사본)
  S=defaults();save();
  try{if(hasBridge('setAlarms'))window.AndroidBridge.setAlarms('[]');}catch(e){}
  closePage();tab='cal';render();startOnboarding();
}
async function wipeAll(){
  if(wipeBusy)return;
  const L=S.link,drive=!!(S.drive&&S.drive.last);
  if(!confirm('근무표·메모·알람·설정을 모두 지울까요?\n\n지우면 되돌릴 수 없어요.'
    +(L?'\n\n가족방에서도 나가요 (나 혼자였으면 가족방도 없어져요).'+'\n서버에 있는 내 정보와 로그인 계정까지 지워서 인터넷이 필요해요.':'')
    +(drive?'\n\n구글 드라이브에 만들어 둔 백업 파일은 안 지워져요 (구글 드라이브 설정 › 앱 관리에서 지울 수 있어요).':'')))return;
  if(!confirm('정말 모두 지울까요?'))return;
  wipeBusy=true;wipeBox(true);famStop();clearTimeout(famT);   // 지우는 동안 가족 쪽 일은 모두 멈춤
  try{
    try{await wipeServer();}
    catch(e){
      await fbForget();   // 서버에 쓰다 멈춘 것이 나중에 몰래 실행되지 않게
      wipeBox(false);
      if(!confirm(`서버에 있는 정보를 지우지 못했어요 (일부는 이미 지워졌을 수 있어요).\n(${wipeWhy(e)})\n\n인터넷을 확인하고 다시 해 보시길 권해요.\n\n[확인] 그래도 이 폰의 것만 지우기\n    (서버에 남은 정보는 문의 메일로 알려 주시면 지워 드려요)\n[취소] 지우지 않고 돌아가기`)){wipeBusy=false;if(S.link)famBoot();return;}
      wipeBox(true);
    }
    await fbForget();
    wipeLocal();
  }finally{wipeBox(false);wipeBusy=false;}
}


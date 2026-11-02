# 새 대화로 이어가기 (v0.83 시점)

- 저장소 `hee6635/sin` · 작업 브랜치 `claude/continue-app-development-o1v8wg` (여기에만 올림). 규칙은 `CLAUDE.md` 참고 (한국어 · 쉬운 말 · "만들어" 할 때만 앱 코드 수정 · 새 기능 제안은 먼저 솔직한 판단).
- 최근 작업: v0.83 = 바퀴 시간 고르기 · 오늘 칸 빛(앱 + 위젯 ‹ ›) · 메모 3줄 고정 · +n 작게 · 잘린 메모 작은 점 · 1/2 배지/둘째 줄 · 접고 펼 때 스티커 크기 기억 · 빨간 점 슬라이더 · 위젯 달 넘김을 홈 화면이 직접. 자세한 건 `docs/TODO.md` 맨 아래.
- Firestore 규칙(`hostSeen`)은 사용자가 배포함.
- 폰에서 확인 필요: v0.83 의 "폰에서 볼 것" (TODO.md).
- 하지 않기로 한 것: 위젯 두 번 누르기 · 제목 눌러 앱 열기(잘못 누르기 쉬움).
- 시험: `tests/run-phone.sh`(TESTS=… 로 일부, s63 = v0.83), `scripts/kotlin-check/check.sh`(BASE=1), `layout/run-layout.sh`, `layout/run-month-real.sh`.

## v0.92 · v0.93 에서 새로 생긴 구조 (덧붙임)
- **가족 포스트잇**: `households/{hid}/board/{쓴사람uid_포스트잇id}` (규칙 `boardOk` · 쓴 사람만 제목/지우기, 가족은 lines/torn/reacts 만). 폰엔 복사본 `S.fam2.board`, 화면은 `boardList(mk)` = 폰 것 + 서버 것(`piSrvList` 어댑터). 고치면 `piSave(n)` → 서버 것이면 `piSrvPush` 가 바뀐 줄만 `lines.{id}.d` 처럼 올림. 폰에만 있는 ♥ 가족 포스트잇은 `famSyncBoard` 가 올리고 폰 원본은 지움. 가족방을 나가면 `piSrvToLocal`.
  - 주의: `famCleanBoardDoc` · `wlogClean` 은 앱을 켤 때 normalize 가 먼저 부름 → 그 안에서 아래쪽 const 를 쓰면 TDZ 오류로 저장 데이터가 salvage 로 빠짐(한 번 겪음).
- **가족방 5명**: `FAM_MAX=4` · 규칙 `guestCount < 4`.
- **날짜 창 근무타입 접기**: `shiftOpen`(null=기본 · 불규칙이면 펼침) · `visibilitychange` 로 5분 지나면 null. 옛 시험은 `tests/phone/lib.js`·`x_common.js` 가 자동으로 펼침(`{fold:true}` 면 그대로).
- **강조색**: `--accent` · `--acc-soft` · `--acc-ink` · `--acc-sw`.
- **글자 크게**: `--tz`(textZoom 배율)로 이모지 스티커 글자 크기를 나눔.
- **업무 일지**: `S.wlog`, 부가 기능 `addons.wlog`, 팝업 `#pop.wl-pop`(`wlEd`), 설정 페이지 `wlset`, 찾기 페이지 `search`(`srch`). 백업은 `S.wlog.backup` 일 때만 `backupData` 에 들어감.
- 시험: 폰 `s64`(v0.92) · `s65`(v0.93), 가족 E2E `tests/family/fam15e.mjs`(포스트잇 · 5명), 규칙 `firebase/test/rules.test.mjs`(102개). 에뮬레이터: `cd firebase && npm ci && (cd functions && npm ci)` 뒤 `TMO=520 bash tests/family/run1.sh fam15e`.

## v0.96 에서 바뀐 구조 (덧붙임)
- **방장 없음**: `canWrite = isMember` · 초대는 그 방 사람 누구나(`invites.hid` = 방) · 빠지기는 구성원 지우기 + `households` 의 `guestCount -1 · lastOut · outBy` · 다수결 `kicks/{대상}` · 30일 기준 `members.seenAt`(앱이 하루 한 번, `famHostSeen`) · 24시간 되돌리기 `members.invitedBy`. 옛 앱 호환으로 `isOwner`(hid == uid) 경로는 남겨 둠. 서버 정리는 함수 `onMemberDeleted`.
- **옛 메모 옮기기**: `archive/{uid}`(묶음 · 보기만, 폰 `S.fam2.arch`) · 메모 `moved:true` + 구성원 `moved`. 앱 `famSyncMemos` 맨 앞 "들어오고 9분 안"(`S.fam2.me.joinedAt`) · 내가 묶은 메모 id `S.fam2.archIds`.
- **포스트잇 알림**: 함수 `onBoardWritten`(notify.js `onBoardWritten`) · 기기 `devices.mute` · 앱 `famOnBoard` 가 띠 알림 · `S.pushBoard`.
- **오늘 색**: `S.todayColor==='shift'` → `tdcShift()`(앱) · `MonthRenderer.shiftToday`(위젯, `deepen` 같은 계산).
- 위젯 그림 확인: `run-month-real.sh` 가 이제 작은 위젯(`s1_one` · `s2_two` · `s7_week`)도 그림 (`WidgetRenderer.drawWith`).
- 시험: 폰 `s68` · 가족 E2E `fam16e`(날짜는 서버 오늘 기준) · 규칙 118개.

## v0.97 (덧붙임)
- 설정 첫 화면 = 타일(`.stiles`) + 줄 몇 개 · 안쪽 페이지 `openLookPage`(look) · `openNotifPage`(notif) · `openInfoPage`(info). 화면 값 바꾸는 손잡이는 `lookRefresh()` 로 페이지 다시 그림.
- 배경 `S.bg` = '' | 'paper' | 'vivid' → `html[data-bg]`. 위젯 데이터 `bg:'vivid'` → `MonthRenderer.vivid`(`vividInk` · `restInk` · `vividBorder`).
- 시험 도구(lib.js · x_common.js)의 `p.click('#nav [data-tab=…]')` 은 열린 페이지를 먼저 닫음.

## 새 대화 시작점 (v0.103 · 2026-10-30)
- 브랜치 `claude/continue-app-development-o1v8wg` 에만 올림 (세션 브랜치가 따로 붙으면 같은 커밋으로 같이 올림) · 앱 코드는 사용자가 "만들어" 할 때만 (올리면 APK 빌드) · docs/design/firebase/scripts 만 바뀌면 빌드 안 돎(paths-ignore)
- 최근 빌드: v0.97(설정 정리) → v0.98 → v0.99(위젯 할 일 완료) → v0.99.1(가족 메모 todo/done 서버) → v0.99.2(오늘 근무 색 · 명절 이름) → v0.100(☔ 출퇴근 날씨 + 미세먼지 · 오류 보고 Crashlytics) → v0.101(날씨 지역 동까지) → v0.102(👕 옷차림 · 미세먼지 8단계 · 마스크) → **v0.103(근무 시간 · ⏱ 연장 · 근무 통계/예상 월급 · 날씨→네이버 · 측정소 미세먼지 · 지난 관측)**
- v0.100 서버 배포 끝(2026-10-29, DATA_KEY · wx 동작 확인 · Crashlytics 연결됨). **v0.101~v0.103 은 functions · rules 다시 배포 필요** (측정소정보 · ASOS 일자료 승인 끝) (`deploy --only firestore:rules,functions`). 처음 설정 안내: docs/weather-setup.md (Cloud Shell: `functions:secrets:set DATA_KEY` → `deploy --only firestore:rules,functions,hosting` → `…cloudfunctions.net/wx?r=11110` 로 확인 · Crashlytics 사용 설정). 공공데이터포털 단기 · 중기 · 에어코리아 승인 끝(2026-10-29)
- 날씨 구조: 서버 `firebase/functions/lib/wx.js`(받기 · 저장) + `wxcore.js`(문구 계산, 앱 index.html 의 `<script>/*WXCORE*/` 에 그대로 복사) + `wxRegions.json`(256 시·군·구, 앱 `WX_REG` 에 복사). 고친 뒤엔 `python3 scripts/wx/sync-app.py` → 서버 시험이 같은지 확인. 지역표 다시 만들기: `scripts/wx/make-regions.py <행정동 geojson>`
- 앱 코드는 `(()=>{…})()` 안이라 시험에서 직접 못 부름 → 날씨는 `window.__wx` 창구로 시험(s71)
- 남은 일(TODO.md 참고): 폰에서 날씨 카드 · 날씨만 알림 확인 · 날씨 ② 자외선 · 깨진 가족 E2E 5개(fam6e · 8e · 9e · 10e · 13e — 시험 쪽 달 경계 문제) · 알람 실기기 확인 · 응원 버튼/내 상태 정리 여부 · 오늘 표시 모양 4→2 · 가족 무료 10건 정책 · 예시 광고/구독 화면 정리(출시 전) · 업무 일지 사진 링크(나중)
- 시험: `bash tests/run-phone.sh`(s71 까지) · `TESTS=s42 TMO=600` · `cd firebase && npm test`(규칙 120) · `cd firebase/functions && npm test`(알림 19 + 날씨 16) · 가족 `TMO=600 bash tests/family/run1.sh fam16e` · `scripts/kotlin-check/check.sh`(BASE=1) · 위젯 그림 `scripts/kotlin-check/layout/run-month-real.sh <위젯json>`
- 주의: `pkill -f` 쓰면 셸까지 죽음 · normalize 안에서는 아래쪽 const 쓰면 TDZ · 한 줄 normalize 에 `//` 주석 넣으면 뒤가 다 주석 됨 · **부가 기능을 새로 만들면 normalize 의 addons 목록(['comp',…,'wx'])에도 넣기** (안 넣으면 다시 열 때 꺼짐 — v0.100 에서 시험이 잡음)

## v0.104 (덧붙임 · 2026-10-30) — 날씨 그림 · 둥근 글씨체 · 미세먼지 큰 화면
- 그림: `app/src/main/assets/wx/{sky,wear,faces}/*.webp` (42개 · 361KB, 원본 PNG 는 `design/weather/`). 이름은 `'sky/rain'` · `'wear/coat'` · `'faces/4'` 처럼 → 앱 `wxImg(id)` · 코틀린 `assets.open("wx/$id.webp")`.
- 글씨체: `assets/fonts/jua.ttf` (주아 · 자주 쓰는 한글 2,350자로 줄임 1.3MB) — 제목 · 기온 · 한마디에만. 본문은 폰 글씨체. (고운돋움은 용량 때문에 뺌)
- `wxcore.js` 새 칸: commute/dayCard → `k`(한 줄 결론 {t,s,i}) · `c`(출근/퇴근 칸 {l,p,sk,tp,d,w,ws,wt,hot,q}) · `b`(챙길 것 {i,n} ≤3) · `dz`(미세먼지 출근/퇴근 {p,n,f,lb,m,g,lv}). `dustInfo(raw,now)` = 큰 화면 자료. 옛 칸(i,h,a,an,o,ox,r)은 그대로 (날씨만 알림 글이 씀).
- 미세먼지: 지금 측정값이 있으면 그것 (예보가 더 나빠도 지금 값) · 출근(집) · 퇴근(직장) 따로 → 나쁜 쪽이 결론.
- 서버 `wx.js`: 측정소 = 동 이름 TM 좌표(옛 방식) → 안 되면 전국 측정소 목록(`getMsrstnList`, 위도 · 경도, 한 달 저장 `stl`)에서 가까운 3곳. 못 쓰면 응답에 `qe`(까닭). 측정소 값에 `x`(통합대기지수 · 오존 · 이산화질소 · 일산화탄소 · 아황산가스 [값, 등급]). 캐시 열쇠 `st_…` 'v2' · `qs2_…`.
- 앱: `wxPopHtml(title,sub,c,extra,dz)` 새 모양(.wxp.v2) · 미세먼지 칸 → `wxOpenDust` (`#pop.wxfull`, 뒤로 = 팝업으로). 위젯 자료 `days[].wx`(오늘 · 내일만, `wxWidget`) · `openDate "날짜#wx"` → 날씨 팝업.
- 코틀린: `AlarmActivity.showCard` 새 모양 + 10초 게이지 · 닫기 말고 아무 데나 누르면 자동 닫기 멈춤(`dispatchTouchEvent`). 서버가 옛 모양(k 없음)이면 앱이 넣어 준 예비 문구(wxp) 사용. `WidgetDayActivity.wxRowView`: 앱 자료(12시간 안) → 창 열면 서버에서 새로 받아 바꿈.
- **서버 다시 배포 필요** (functions): 새 칸(`x` · 측정소 목록 · `qe`)은 배포해야 나옴. 배포 전에도 앱은 동작 (표 · 측정소 이름만 빠짐).
- 시험: 폰 `s73` (+ s71 · s72 고침) · 서버 `wx.test.mjs` 27개.

## v0.105 (덧붙임 · 2026-10-31) — 시간별 줄 · 특보 · 자외선 · 날짜 창 순서
- 서버 `wx.js`: 단기예보 새로 받을 때 오늘 지난 시간 칸을 옛 값에서 붙여 둠(`fetchShortKeep`) · 특보 `getPwnStatus`(전국 한 번 · 10분, 캐시 `wa`) → `parseAlerts`/`alertsFor` 로 지역마다 `out.w = {t, l:[[종류, 주의보|경보]]}` · 자외선 `LivingWthrIdxServiceV4/getUVIdxV4`(areaNo = 동 10자리 또는 시·군·구+00000, 06/18시 발표, 캐시 `u_…`) → `out.u = {b, h:{YYYYMMDDHH: 지수}}`.
  - 특보 지역 맞추기: 시·도 이름 + 괄호 안 시·군 이름 앞부분(평지/산지 떼고) · 광역시는 괄호가 있어도 전체로 봄 · 바다 구역은 안 맞춤. **실제 응답으로는 아직 확인 못 함** (시험은 가짜 t6).
- `wxcore.js`: `hours(home, work, o)` 시간별 줄(그날 0시부터 · 2시간 · 야간은 다음날 퇴근 뒤까지 · 칸 시작이 출근 1시간 전 ~ 퇴근 1시간 뒤면 직장) · `alertK`(오늘만 · k.al 1 주의보/2 경보 · 그림 `alert/…`) · `uvMax`(낮 9~17시) → 챙길 것 선크림 · 8 이상이면 결론 · 지난 출근 칸 `c[].past` · 결론/챙길 것은 남은 시간 기준 · 퇴근 1시간 뒤엔 미세먼지 결론이 집 동네만 · 미세먼지가 결론이면 `k.dz=1` (앱 · 알람 카드에서 아래 미세먼지 칸 안 그림).
- 앱: `wxHrHtml`/`wxHrScroll`(지금 칸이 왼쪽 두 번째) · `wxOpenPop` · 날짜 창 = 근무 타입 → 대기 요청(pending 만) → 날씨 카드(`.wxcard`) → 가족 메모 알림 → 메모 · `S.wx.one`(같은 지역으로 보기, `wxWk()` 가 빈 값) · `wxNear`(같은 시·군·구 또는 시·군·구 격자 10km) → `wxAskOne`.
- 그림: `design/weather/clean/` (테두리 다듬은 원본) → `assets/wx/{faces,wear,sky,alert}` · 특보 10개 + `sky/uv`.
- 시험: 폰 `s74` · 서버 `wx.test.mjs` 33개.

## v0.106 (덧붙임 · 2026-10-31)
- 미세먼지 시간대별: 서버 측정소 값 24개(`q.hh = {'YYYYMMDDHH':[미세, 초미세]}`, "24:00" = 다음날 00시) · `wxcore.dustAt` → 시간별 줄 칸 `f`(얼굴) · `fc`(예보면 true, 흐리게) · 칸 얼굴 누르면 미세먼지 큰 화면.
- 그림 통일: `design/weather/clean2/` (자르기 = 윤곽선 안쪽만 남기고 흰 테두리 새로 · `/tmp/wxcut/cut3.py` 방식 — 다시 자를 일 있으면 HANDOFF 이 줄 참고) → assets/wx 48개(278KB). 우산 하나(`umbrella`) · 호우 = 침수 위험 · 얼굴 = 단순한 8개(1번 파랑 진하게).
- 부가 기능에서 응원 버튼 · 내 상태 뺌 (normalize 가 addons 키 목록에서 뺌 → 켜 있던 값은 사라짐). 가족 탭 내 카드 = 늘 `myStatus` (근무 중 · 몇 시 끝 + 막대). 응원 관련 함수는 남아 있지만 화면 입구 없음.
- 날짜 창 날씨: 오늘 ~ 3일 뒤 = 카드 · 4일 뒤부터 = 한 줄 · 시간 예보 없는 먼 근무 날은 하루 요약으로.
- 한 달 위젯: 오른쪽 위 `mz_open`(달력 선 아이콘, 누르면 `openDate "YYYY-MM-01#m"` → 그 달 달력만) · 넓으면(360dp↑) `mz_rnext` 56dp 로 양쪽 104dp → 제목 정중앙 (`WidgetLayout.monthZones`) · 칩 없을 때 왼쪽 자리 = 앞 달.
- `scripts/kotlin-check/layout/run-month-real.sh` 는 지금 Reminders.kt 컴파일(shim)에서 막힘 — 이번 변경 전부터인지 확인 필요.

## v0.107 (덧붙임 · 2026-10-31)
- 근무 시간은 근무 패턴 화면 한 곳(`openPatTimes`: 근무 시간 칸 펼쳐 열기) · 가족 탭 내 카드 · 날씨 설정 시간 줄 · 예전 `more-times` 가 모두 이리로. 예전 자세한 화면 `openTimesPage` 는 코드만 남음(입구 없음).
- `myStatus` = work(막대 · 몇 시 끝 · 퇴근까지) / rest(쉬는 중 · 다음 근무) / off(휴무) 세 가지. 식사 · 쉬는 시간 · 나서기 · 귀가 · 수면 단계 없앰.
- 가족 탭 내 카드 `.nc.me2`: 날씨 켠 사람 = "나" 옆 상태 한 줄 + `wxCardHtml`(날짜 창 카드와 같은 함수) · 안 켠 사람 = `.big` 상태 크게.
- 그림 = `design/weather/clean3` (테두리 없음) → assets/wx.
- 어제 날씨: 서버 `fetchShortKeep` 이 어제 0시부터 보관 · 앱 병합도 어제부터 · `pastData` 는 어제 관측이 없으면 열쇠에 시각을 붙여 1시간마다 다시 물음 · 앱 `wxPastHtml` 은 관측이 없으면 `WX.day` 예보로 한 줄("예보", 누르면 팝업).
- 옆으로 밀기: `SW_SKIP` (날짜 띠 · 근무타입 칩 · 입력 칸 · 시간별 줄) 빼고 날짜 창 어디서나 · 업무 메모 창(`.wlp`)도 → `swAnim` 미끄러짐.
- 시험: 폰 `s75` · s39 지움(예전 자세한 근무 시간 화면) · s31 · s71 고침 · 서버 35개.

## v0.108 (덧붙임 · 2026-10-31) — 스와이프 스프링
- `swTarget`/`swGo`/`swEnd`: pointermove 로 손가락 따라 translateX · 세로 12px 먼저면 스크롤로 보고 포기 · 놓을 때 50px 넘으면 그 방향으로 빠지고(0.14s) 새 날짜가 반대쪽 45% 에서 스프링(cubic-bezier(.2,1.35,.35,1) .38s)으로 · 덜 밀면 스프링 제자리 · 끝나면 인라인 transform/transition 지움(`tidy`) · prefers-reduced-motion 이면 움직임 없이.
- `touch-action: pan-y` (#sheet · .wlp · 스티커 창 `.menu.sdpop`) · 가로 스크롤(날짜 띠 · 칩 · 시간별 줄)은 pan-x pan-y.
- 스티커 창: `openStampDay(k, nav)` — nav 면 스티커 없는 날도 "이 날은 스티커가 없어요" 로 열림 · `stDayK`.
- 시험 s75 (손가락 움직임 흉내: pointerdown → move 6번 → up).


## v0.109 (2026-10-31) — 스와이프 2차 · 근무 시간은 근무타입 편집 창
- 스와이프: 내용을 `.swc` 로 감싸고 옆 날짜 판 `.swc.swn` 을 ±100% 에 붙여 같이 이동 (날짜 창 · 업무 메모 · 스티커 · 날씨 팝업 wxOpenDay). 50px 넘으면 넘김, 아니면 스프링 복귀. 빌더(dayHtml · stampDayHtml · wlInner · wxDayPopHtml)는 상태를 안 바꿈.
- 업무 메모: `.wlp .bd`/textarea 에 pan-y, 포커스 안 된 textarea 위에서도 밀기 가능.
- 근무 시간: openTypeEdit 에 시간 칸(tdS/tdE) → saveType 이 S.shiftTimes 저장(이름 바꾸면 옮김). 근무 패턴 화면의 따로 있던 시간 칸 제거, 근무타입 목록 아래 `.tltimes` 줄에 시간 표시. openPatTimes 는 오늘/다음 근무타입 편집 창을 엶.
- 근무타입 시간에 총 근무시간(totH) 표시 · 연장 +n시간은 지금 퇴근에서 더함(쌓임).
- 테스트: s75 (24개) · s72 (46개).

## v0.110 (2026-10-31) — 스와이프 손질
- 날씨 팝업: 안쪽 스크롤 칸 `.wxp` 가 touch-action auto 라 폰이 옆 밀기를 가져감(pointercancel) → `.wxp` 에도 pan-y. s75 에 진짜 터치(CDP) 시험 추가.
- 옆 판 swSide: 창 안쪽 여백(padding)만큼 left/top/width 맞춤 (날짜 창이 16px 더 크게 보였다 줄던 것).
- 밀어서 넘길 땐 진동 없음 (goDay(k,quiet)).
- 업무 메모: 옆 판의 .wlta 도 wlGrow 로 높이 미리 맞춤.

## v0.111 (2026-10-31) — 연달아 밀면 엉뚱한 달로 튀던 것
- 원인: swWrap/swUnwrap 이 날짜 띠(.dstrip)를 옮기면 scrollLeft 가 0(한 달 전)으로 돌아감 → 다음에 띠를 건드리거나 scroll 이 나면 dstripCenter 의 scroll 처리가 그 날로 goDay(진동).
- 고침: 옮기기 전후 .dstrip/.tchips/.wxhs scrollLeft 지킴(swKeepX) · 미는 중과 직후 600ms 는 띠 scroll 무시(swQuiet) · 옆 판 안 id 제거(같은 id 두 개 방지).
- 시험: s75 "연달아 5번" · "날짜 띠 가운데".

## v0.112 (2026-10-31) — 밀기 씹힘 줄이기
- 짧게 튕기기: 24px 이상 + 마지막 120ms 빠르기 0.3px/ms 넘으면 넘김 (dsw.pts 로 잼). 천천히 50px 미만은 그대로 제자리.
- 넘어가는/제자리 돌아가는 0.3초 사이에 또 누르면 앞 마무리를 바로 끝내고(swFlush) 새 화면 기준으로 받음.
- 시험: s75 진짜 터치(CDP) 빠르게 4번 · 짧게 튕기기 · 천천히 조금(slow 도우미).

## v0.113 (2026-10-31) — 가족 달력을 앱 달력처럼 · 가족 스티커판 · 가족 탭 내 카드
- 직접 추가한 가족(kind≠sched): 달력 칸은 manBadge(.badge.c / .badge.r) → 화면 모드(동그라미/칸 채우기/또렷하게) 그대로 · 칸 --cb = manCellBg. 색 famLblCol(학생 #a3d4b5).
- 가는 곳 이름 m.label (≤6자, 가족 ✏️ 의 feLbl) → famLbl(m). 칸 동그라미는 첫 글자.
- 가족 스티커판 m.sdefs [{id,emoji,name}] · 붙인 기록은 예전처럼 m.stk[k]=[id]. 처음엔 manSdefsInit 이 내 스티커판 복사(같은 id → 예전에 빌려 붙인 것도 그대로). normalize 가 예전 데이터 옮김. 개수 제한 없음.
- 가족 날짜 창 manDayHtml/openManDay: 날짜 띠(dstripCenter(goFn,curK)) · 칩(원래 값 누르면 원래대로) · 스티커판(＋ 만들기 = openStampBig · 길게 = openManStkEdit) · 메모 · 스와이프 w:'man'.
- 가족 탭: 가족이 있으면 내 카드는 .now.one 한 줄, 가족 카드는 .now.fams (내용만큼 높이). 내 카드 위쪽 data-act=fam-mycal → 달력 탭 + 오늘 날짜 창 (fam-today 는 시간표 [오늘] 버튼이 이미 씀!). 날씨는 wx-fam 그대로.
- 또렷하게+동그라미: 밝은 화면 검은 글자(saturate 1.4) · 어두운 화면 흰 글자.
- 위젯 한 달: 달력 버튼 그림 s 0.62→1.2 · 선 2.2.
- 시험: s76 (25) · s35 · s31 · s75 고침. s20 은 /tmp/ph.b64 (사진 base64) 가 있어야 돎.

## v0.114 (2026-10-31) — 스티커 활동 (학원 · 취미 · 동아리)
- 내 스티커 def.act={s,e,r,since} (mark 만) · 가족 스티커 sdef.act={days,s,e,r,since,skip}. 편집: actFoldHtml(접는 칸) — 내 것 sr-*, 가족 것 ms-* (가족은 msDraft 초안 → mstkSave).
- 근무 겹침: stampPlanned 끝에 actClash (그날 + 어젯밤 야간 wxMyWin) · 가족은 manPlanned + famWinOf (교대 = 근무, 학생/회사 = 등교~하교).
- 자동 완료 actAuto() (render 마다): 끝 시간 지난 깔린 날 → log / m.stk 에 넣고 actDone[k] 에 기록 (한 번만 · 풀면 그대로). since 부터 최근 35일.
- 가족: 완료된 활동을 다시 누르면 act.skip 에 그 날 (안 깔림 · 자동도 안 함).
- 날씨: wxcore actCards/actK · commute(o.acts) = 출근 · 퇴근 + 다가올 활동 1개를 시간 순으로 3칸 · dayCard(o.acts) = 활동 칸만. 결론: 특보 → (출퇴근 비 아니면) 활동 갈 때/끝날 때 비 → … · 앱 myActs(d) → wxMine. 가족 카드 famActWx (비 · 눈일 때만).
- 위치: actPickRegion → wxPickSido('a:') · 집과 가까우면 같게 할지 물어봄 · wxCodes 에 actRegions.
- 서버 wxcore 도 같이 바뀜(o.acts 없으면 예전과 같음) → 배포 안 해도 됨.
- 시험: s77 (24).

## v0.115 (2026-10-31) — 날씨 쪽 "활동" 통일 · 미세먼지 활동 칸 · 시간별 줄 활동
- 앱 actWx: n='활동', ic=스티커 그림 → 칸 이름 "🏊활동 20:00" · 결론 "활동 갈 때/끝날 때 비 와요". 가족 상태 줄만 이름 ("피아노 중", 없으면 "활동 중").
- wxcore actDz: 활동 동네가 다르면 그 동네 미세먼지 · 같으면 활동 시작 시각(dustAt)이 출근(집) 등급보다 나쁠 때만 dz 에 {p:'🏊활동', pl:'활동 때', act:1}. dz 에 pl(출근길 · 퇴근길 · 활동 때) → 앱 · 알람(Kotlin pl()) 문구.
- hours(o.acts): 2시간 칸 + 활동 시작 시각 칸 · 활동 시간대 칸은 ac/an (활동 동네 날씨 · 미세먼지) · 앱 wxHrHtml 묶음 'act' (보라 배경).
- 시험: s77 (27).
- (v0.115 추가) 옷: wxPopHtml · AlarmActivity 둘 다 칸별 옷 그림 없앰 → 안 지난 칸 중 가장 추운 칸 한 벌 ("오늘 옷 · 출근 7° 기준", 기온차 10° 이상이면 한마디). 날씨 카드 칸 이름 .wcl 한 줄.
- (v0.115 추가) 가족 스티커 설정 openManStkPage ('manstk', pageBack=renderManCalPage): .mstgrid 길게 끌기(gdg kind 'mslot') · 누르면 openManStkEdit · 빼기 = sdef.retired (m.stk 기록 남김, 판·깔림·자동 제외) · ＋ = 새로 / 내 스티커 가져오기(mslot-import).

## v0.117 (2026-11-01) — 가족 일정 종류 · 위치 · 가족 날씨 · 이 날부터 새 일정
- 직접 추가한 가족(kind student/office/free = famUsesTypes): m.ftypes [{k,name,ab?,rest?,s,e,color}] · 없으면 famTypesDef (예전 label/start/end → 'on' · 'off' 키라 예전 ov 그대로).
- 구간 m.eras [{from,ftypes,days,vac,loc}] · famEraRef(m,d) 고칠 대상 · famEra(m,d) 합친 사본. memberOff 가 구간 · 종류(rest) 를 봄. famTypeAt / famTimes / ftAb(두 글자까지, 세 글자면 첫 글자) / ftBadge.
- 날짜 창: "일정 ▴ 접기"(manFold · 앱 나가 5분 → 처음) · 🖌 여러 날 칠하기(man-paint) · 칩 길게 = openFtEdit · famDayWxHtml(오늘~3일) → famWxPop. 위쪽 ✏️🖌 없앰.
- 가족 ✏️ (openFamEdit): 일정 종류 목록(fe-ft · fe-ftadd) · 가는 요일(회사) · 위치(fe-loc → actPickRegion) · 방학 · 📅 이 날부터 새 일정(fe-era-add · 구간 칩 fe-era · m._ed 는 저장 때 지움).
- 날씨: wxcore commute(o.ls/le/lb 이름표: 학생 = 등원 · 하원 · 등하원) · brief 도. wxMemWin/wxMemWork 가 직접 추가한 가족도 (famTimes · loc). wxCodes 에 가족 위치. famWx(m,d) · 가족 카드 wxFamChip = 다음 칸 날씨 늘 · 앞으로 비면 "하원 때 비 · 우산" (famActWx 는 교대 가족만).
- 가족 시간표 · 위젯 자료도 종류 동그라미/글자 · 색.
- 시험: s78 (17) · s35 · s76 · s77 고침.

## v0.118 (2026-11-01) — 반복 메모 · 💡 이럴 땐 이렇게
- 반복 메모 S.rmemos [{id,text,md(1~28 · -1 말일 · -2 · -3),sh:[근무],miss:'skip'|'next',from,color,todo,time,al,done:[날짜],skip:[날짜]}] · 미리 만들지 않음: rmTarget(그 달 날짜) · rmemoOn(k) → visibleMemos 에 'r:'+id 가짜 메모로 섞임 (칸 · 날짜 창 · 위젯). 알림은 70일치 r_{id}_{날짜}.
- 메모 자세히: 🔁 반복 줄(md-rep → openRrPick) · 반복이면 가족에게 칸 숨김 · 저장하면 그 날 메모 대신 틀로 · 반복 메모를 누르면 틀 고치기 · 길게 = 이 날만 빼기 / 고치기 / 그만하기 · 할 일 체크는 done[날짜].
- 💡 TIPS 배열(묶음 8 · 팁 36) · openTipsPage · tipGo('tab:…' 이면 탭, 아니면 그 data-act 를 눌러 열고 pageBack=팁). 기능 바꾸면 TIPS 글도 같이 · s79 가 바로 가기 전부 시험.

## v0.119 (2026-11-01) — 가족 일정 패턴 화면 · 근무 패턴 위치 · 미세먼지 활동 칸
- 가족 일정(종류 · 시간 · 위치 · 방학 · 구간 · 공휴일)은 openManPat ('manpat') 로 모음 — famSchedHtml(m) · famReRender(). 날짜 창 "⚙️ 일정 패턴"(man-pat, famDraft._own → [저장] fp-save) · 가족 ✏️ 의 "🔁 일정 패턴" 한 줄(fe-pat → [완료] fp-done 로 돌아감).
- 근무 패턴 patLocHtml → pat-loc → 출퇴근 날씨 설정 (pageBack = 근무 패턴).
- wxcore: 활동이 다가오면 dz = 출근 · 퇴근(직장 없으면 집 그 시각 dzAt) · 활동(늘) · dayCard 는 🏠집 + 활동. 앱 wxPopHtml 은 dz 에 act 가 있으면 .wxdz3 칸.
- 시험: s77 (38) · s78 (20) · s76.

## v0.120 (2026-11-01) — 가족 스티커 = 내 스티커 고치기 · 활동 스위치 · 스티커 목록
- 가족 스티커 sdef 에 내 스티커와 같은 규칙 칸 (rep none/dow/daily/work/month · days · wtypes(가족 일정 종류 키 · 교대 가족은 근무) · times · ats · from/to · noHol/noWknd · dates · skip · mday · act{s,e,r,since}). 예전 act.days → rep 'dow'.
- 편집 = renderStampReg (stDraft.own = 가족 id): "일정 맞춤" · 가족 칸 숨김 · 이름 입력 · 그림 바꾸기/판에서 빼기. 저장 manStampSave · 뒤로 manStampBack. 열기: 판 길게(mandy) · 설정 칸(manstk) · ＋ 만들기 뒤.
- 깔림 manStampPlanned (= manPlanned) · 판은 m.stk[k] 의 같은 id 개수 = 횟수 (1/2) · 다 차면 다시 0 · 활동은 손으로 고친 날 actDone. 알림 f_{가족}_{스티커}_{날짜}_{n} (2주).
- 활동 칸 actFoldHtml: 제목 줄 스위치(srActOn) — 켜면 기본 16:00~17:00 그대로 적용 + 알림 30분 전.
- STAMP_CAT: 기분 · 아이 · 육아 탭 + 일 · 건강 · 생활 · 돈 더하기 (마음 · 취미의 기분 얼굴은 기분 탭으로).

## v0.121 (2026-11-01) — 가족 집 위치 · 미세먼지 큰 화면 활동 탭
- 직접 추가한 가족 m.home (지역 코드 · 없으면 우리 집): famHome(m). famWx 의 등원/출근 · 쉬는 날 · 활동(위치 없을 때) 날씨가 그 집 기준. 일정 패턴 화면 "🏠 집" 줄 (fe-home · 우리 집 고르면 지움). normalize · wxCodes · 지역 이름 정리에 포함.
- 미세먼지 큰 화면 탭 wxDzList(win,home,work,acts,ls,le): 활동 있는 날은 "🎹활동 · 동네" 탭 (최대 2개) · 시간 순서. 활동 탭의 큰 얼굴은 WX.dzAt(활동 시작 시각) 기준 ("활동 16:00 때 예보"), 아래 지금 값 · 예보 · 표는 그 동네 측정소. wxcore 가 dzAt 을 내보냄.
- actWx 에 rc(지역 코드) · home 인자.
- 가족 탭 "지금": 가족이 있으면 나 · 가족 카드 모두 같은 크기(.now.fams 2칸 · 600px 이상은 자동 칸) · 같은 모양(.nc.fc2): 상태 · 진행 막대(famProg = famWinOf 안이면) · 작은 날씨 줄 wxMiniHtml(c.c 최대 3칸 + 비 · 미세먼지 · 특보면 결론 한 줄, 누르면 wx-fam). 가족 날씨 자료 famNowWx. 가족이 없으면 내 큰 카드(.now.one .me2) 그대로. 예전 wxFamChip · famActWx 는 가족 탭 카드에서 안 씀.
- 시험: s80 (7) · s81 (11).

## v0.122 (2026-11-01) — 가족 카드 상태 한 줄 · 가족 포스트잇 횟수 · 스티커 한 줄 · 인앱 브라우저 · 팝업 높이 미리
- 가족 탭 카드(.fc2): 동그라미(.ctop) 옆에 이름(작게) + 상태.
- 가족 포스트잇: 새로 붙일 때(piCommit · pi-share 켤 때) n.cnt=1 → piSrvCreate 가 같은 묶음에서 members.sent +1 (무료 10건에 합침). 매달 반복 · 가족방 전에 쓴 것은 횟수 없음. 서버 규칙은 그대로(앱에서만 셈).
- fitStz: 최소 0.4px 씩 줄임 · 14번까지, 1.5px 까지 넘침은 봐줌(오른쪽 여백 5px 안) → 폭 360 등에서 스티커 둘이 아래 줄로 내려가던 것 고침.
- InAppWeb.kt: 링크를 커스텀 탭(세션 extra, 라이브러리 없음)으로. AlarmBridge.openUrl · AlarmActivity · WidgetDayActivity. wx-web 은 앱에서 팝업 안 닫음.
- 스와이프: 전체 화면 아닌 창(날씨 · 스티커 · 업무 메모 팝업)은 옆 판 높이를 재서(st.h0 → st.h1) 미는 만큼 높이도 바꿈. 시험 s82.
- 시안: design/wx/pop_compare.png (선 구분) · dust_compare.png (✕ 위 · 탭 두 줄).

## v0.123 (2026-11-01) — 날씨 상세 팝업 선 구분 · 미세먼지 탭 ✕ 아래
- .wxp.v2: 결론(.wxk 색 있을 때)만 상자 · 칸(.wxcs) · 옷/챙길 것(.wxrw) · 시간별 줄(.wxhr) · 미세먼지 칸(.wxdz3)은 상자 없이 아래 1px 선 · 여백 14~16px.
- .wxd 미세먼지 큰 화면: ✕ 는 맨 위 · 탭은 아래 한 줄, 탭 글자 두 줄(<small>출근</small>동네). 예전엔 동네 이름이 길면 탭이 ✕ 를 화면 밖으로 밀어냄.
- 시험: s73 · s80 탭 글자 줄바꿈 반영.

## v0.124 — 미세먼지 큰 화면: 활동 탭이 있으면 출근 · 퇴근 탭에도 "활동 20:00 때" 줄 자리(빈칸)를 남김 → 탭을 바꿔도 얼굴 · 표 높이 그대로 (s80)
- 가족 탭 카드: 위쪽(.ctop) 높이 42px · 상태 아래 줄(.sm) 15px · 막대 없으면 빈 막대 자리 → 나 · 가족 카드 날씨 칸이 같은 높이

## v0.125 — 가족(보기만) 폰: 그 사람 카드 날씨 · 그 사람 달력 날짜 창 새 틀
- 가족 탭 sched 가족 카드: famNowWx → famSchedWx(m,d) (집 = 내 폰 집 · 직장 = 그 가족이 실어 보낸 sch.wx.w). 날씨 꺼진 폰 + 그 가족이 날씨를 나누면 "☔ 날씨도 보기 · 집 지역 고르기 ›"(wx-set).
- openVcDay → vcDayHtml(k) (전체 화면): dtop · dfh(vc-go) · 날짜 띠 · .vcrq 칩("근무 · 근무 요청/요청 중 ▾", 지난 날은 근무만) → vc-rq 로 펼침(보낸 요청 · tchips vc-want · #rqm2 · 여러 날 · 보내기) · 날씨 카드(vc-wx → vcWxPop) · 가족 메모(vcMemoHtml). 스와이프 대상 'vc'.
- 집 지역까지 나누려면 firestore.rules 의 scheds.wx 키(w · tm)에 h 추가 + 배포가 필요 (안 함).
- 시험: s83 (15) · fam4e/5e/10e 는 접힌 요청 칸을 먼저 엶.
- 가족 카드: 그 가족 근무 시간을 모를 때 🔁 대신 그날 근무 동그라미(schBadge) · .cst .st 는 한 줄(flex)

## v0.126 — 단순하게 · 12시간제 · 알람 문구 · 유찬 스티커 내 방식
- 12시간제: t12(v,short) "오후 7:30" / 정각 "오후 7시". wxHm · 근무 시간 · 상태 · 활동 · 가족 일정 · 근무 시간 목록 · fmtTm12 모두 t12. wxcore hm12 → 날씨 칸 이름 "출근 오전 7시" (서버 시험 2곳 맞춤 · sync-app).
- 알람 탭 위쪽 큰 카드 → 한 줄 .anext1.
- 알람 끄기 화면 문구: alarmMsg(x) → setAlarms 의 msg (요청 > 오늘 메모 > 포스트잇 남은 할 일 > 어제 인계 > 근무 흐름 > 응원). Ring.msg · EXTRA_MSG · AlarmActivity 이름 아래 한 줄. 알람 편집 "💬 알람 화면 한 줄" 스위치(S.alarmMsg, 전체).
- 스티커 등록: srMoreHtml — 기간 · 공휴일 · 토일 · 가족 · 활동은 "상세 조건 더보기 ▾" (stDraft.more, 접힌 줄에 요약).
- 안내 줄 처음만: S.hints{wxweb,fep,mstk} · 내 메모 3개 전까지만 메모 안내 줄 · 가족 메모 무료 횟수는 3건 이하일 때만.
- 유찬 스티커: 날짜 창엔 그날 깔린 것만(안 함 반투명 todo) · ＋ → openManStkPick → man-stk-place → openManStampReg(…,place) (규칙 없던 스티커는 "이날만") · 새로 만들기도 그날 "이날만".
- 오늘 색: 동그라미 모양도 (html[data-tdc] 테두리 + 10% 바탕) · 띠 모양 고르기는 칸 채우기 전용.
- 유찬 · 가족 달력 [오늘] (vcNavHtml).
- 시험: s84 (12) · s76 · s77 · s78 새 흐름 · 12시간제.

## v0.127 — 지난 날 날씨 기록 · 부를 이름 · 위젯 → 그 사람 달력 · 날씨 팝업 높이 통일
- 지난 날 날씨 기록: wxHistSave() 가 날씨를 받을 때(wxChanged) · wxFetch 때(10분에 한 번) 오늘 카드를 localStorage `eonjeswieo:wxh` {날짜:{at,s,c,hr,f:{가족키:{c,s}}}} 에 덮어씀. 하루 처음 시각(now=d0)으로 계산 → 지난 칸 없이 하루 전체 · past/q/now 지움. 줄이지 않고 계속 보관. 지난 날짜 창 = .wxhist "그날 예보 기준" 카드 + "실제 …"(wxObsTxt) · 팝업 = wxHistPop (dz 없음). 가족 날짜 창(famDayWxHtml · vcDayWx) · 팝업(famWxPop · vcWxPop)도 저장본(시간별 줄은 내 것만). 백업 data.wxh · 복원은 폰에 없는 날만 채움. 하루 약 3~5KB.
- 10/31 관측 빈칸 원인: wxPastFetch 가 지난달은 한 번 받으면 다시 안 받음 → 달 바뀐 날 아침(전날 관측 올라오기 전)에 받으면 말일이 계속 빔. 이제 말일 관측이 없고 달 끝난 지 3일 안에 받은 거면 6시간마다 다시 받음.
- 부를 이름: S.famAlias{uid:이름} (normalize 20개 · 12자 · 백업). famAka → famNameOf · famPeers · famOthers · 요청 peerName · 가족 연결 목록(원래 이름 작게). 가족 메뉴 "📛 내 폰에서 부를 이름"(mem-aka · mem-aka-ok). 위젯 사람 칩도 famPeers 라 같이. 푸시 글자는 서버가 만들어 원래 이름(나중).
- 위젯 → 그 사람 달력: openDate 에 "@사람키"(MonthRenderer.personKey) — WidgetDayActivity "앱에서 열기"(가족 보던 때만) · MonthWidget 오른쪽 위 달력 버튼. 앱 widgetSync: 연결된 가족(u_uid)이면 그 사람 달력(famcal · 보기만 폰은 cal 탭) + 그 날짜 창(#m 면 달력만) · 없으면 내 달력.
- 날씨 팝업: 챙길 것 없으면 "없어요 + misc/smile" · 미세먼지 줄 늘 · 옷 아래 상황 문구(wxcore otipOf → c.ot) · 결론 칸 안 눌림 · 지남 태그 칸 맨 아래 · 여백/글자 굵기 · 시간별 줄 끝 칸 반쯤 보이게(--hcw). 알람 화면 옷 줄도 "오늘 옷 / 이름 / 상황".
- 미세먼지 큰 화면 옆으로 밀면 탭 넘김(끝에서 튕김).
- 오늘 색 = 근무 색 · 쉬는 날이면 회색(#9aa0a8) 테두리만(data-tdc="rest").
- 모닝콜 문구 순서 새로(요청 > 대근 > 메모 > 인계 > 포스트잇 > D-day 7일 > 마지막 날 > 근무 흐름/인사 번갈아 > 쉬는 날 문구). 월급날은 앱에 월급날 칸이 없어 뺌.
- 연차: "1년 연차" + "연차 새로 시작"(S.salary.leaveFrom 'MM-DD' · 비우면 1월 1일) · leaveStart · 통계 "(M/D 기준)".
- 시험: s85 (20).

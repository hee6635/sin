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

## v0.128 — 버벅임 줄이기 · 업무 메모 옆 날짜 저장 버그 · 포스트잇 바로 저장
- 업무 메모 버그: 옆으로 미는 동안 옆 날짜 판(.swn)의 .wlta 까지 "지금 날짜"로 저장 → 쓰고 0.35초 안에 밀면 옆 날짜 글이 복사. 이제 textarea 에 data-k · wlTas(k) = 그 날짜 칸만(.swn 빼고) · 입력 저장은 t.dataset.k · 옆 판 칸은 readOnly.
- 버벅임(앱): stzWindow 가 render 때마다 7달을 숨겨 그려 스티커 크기를 잼(첫 화면 · 달 넘김 약 0.7초). 이제 stzKey + 7달 html 해시(약 그림 clipPath 번호 · class · style 뺌)가 같으면 저장값(localStorage `eonjeswieo:stz`, 40개) 바로 씀. fitStz.measure 는 글자 바꾸기를 모아서 한 번 → 배치 계산 한 번. 측정(로컬): 다시 켤 때 긴 작업 0.9초 → 0.08초 · 달 넘김 0.7 → 0.06초 (처음 가는 달 · 내용이 바뀐 달만 약 0.5초).
- 버벅임(위젯): WidgetStore.saveFromApp 가 전과 같으면 false → setWidgetData 가 refreshAll 안 함. load() 는 같은 글이면 기억한 JSONObject (WidgetDayActivity 는 고쳐 쓰니 loadFresh). 달 넘김 효과의 그림 4장 재사용은 아직(다음).
- 포스트잇: 새로 쓰다가 바깥 · 뒤로 → 글이 있으면 piCommit + toastUndo("📌 저장했어요", 지우기). 빈 건 그냥 닫힘.
- 위젯 → 직접 추가한 가족: widgetSync "@id" 가 S.family id 면 manId · renderManCalPage · openManDay.
- 시간별 줄: "내일" 글자 빼고 .hc.nd::before 흐린 동그란 점선(위아래 흐려짐).
- 근무타입 편집: 가운데 "다음날" 빼고 넘어갈 때만 퇴근 칸 .tbtn.nx 안에 "다음날 ".
- wxcore coldWear: 결론 아래 "… 입으세요" 도 팝업 "오늘 옷"과 같은 칸(안 지난 칸 중 가장 추운 때).
- 시험: s86 (13).

## v0.129 — 옷 문구 · 스티커 크기 원인 보기
- wxcore CLOTH 를 실제 같이 입는 조합으로(예전 "트렌치코트 · 야상"은 둘 중 하나였는데 팝업이 " + "로 바꿔 보여 줘 어색): 28 반팔·반바지 / 23 반팔·얇은 셔츠 / 20 얇은 긴팔·가디건 / 17 맨투맨 (또는 얇은 니트) / 12 자켓·긴팔 / 9 트렌치코트·니트 / 5 코트·히트텍 / 1 패딩·니트 / -4 패딩·히트텍 / 그 아래 두꺼운 패딩·히트텍·기모 바지.
- 목도리 · 장갑은 bring(챙길 것): 체감 5° 아래 목도리(scarf_red) · 0° 이하 장갑. 기온차 "얇은 겉옷" 뺌(오늘 옷 아래 문구 하나로 · otip 기준 8°). 체감 5° 이하 + 바람 7m/s 이상 = 바람막이 대신 "바람이 세요 · 목까지 잠그세요"(otipOf · outfit). 바람막이 그림 새로 wear/windbreaker.webp (design/wx/wear_new_sheet.png 에서 자름).
- 스티커 크기 원인 보기: 모양 조정 맨 위 "스티커 크기 (왜 작아졌나)" — stzDiag() 가 기본 크기에서 칸마다 넘치는 만큼으로 그 칸이 들어가는 크기를 계산 → 가장 빡빡한 날(원인 · 누르면 그 날) · 하나 줄이면 몇 % 커지는지(대책). 스티커가 없으면 숨김 · 열 때만 계산. 범위 S.stzMode: '' 앞뒤 3달(기본) / 'm' 그 달만 (stzKey 에 포함 · 백업).
- 시험: s86 에 4) 추가 (18) · 서버 시험 옷 조합.

## v0.130 — 날씨 팝업 높이 맞추기 2 · 넘길 때 깜빡임 · 스티커 크기 기본 "달마다"
- dayCard 칸: l '오전 6~12시' · '오후 12~6시' + p = o.hp(동네 이름 · wxMine · famWx · famSchedWx 가 넘김) → 근무 날 칸처럼 5줄 (서버 시험 맞춤).
- 미세먼지 자료가 없는 단기예보 날: .wxrw.dz.none 회색 얼굴 "미세먼지 · 예보 전이에요 / 보통 2~3일 전에 나와요" (누르지 않음 · 중기예보 날 빼고).
- 날씨 팝업 옆으로 넘김: swGo('wx') 가 .menu.wxdpop 틀은 두고 innerHTML 만 바꿈(+wxHrScroll) → 틀을 새로 만들 때 그림 풀기 전 하얗게 깜빡이던 것.
- S.stzMode: 기본 'm'(그 달만) · '3' 앞뒤 3달 (v0.129 의 '' 는 'm' 으로). 모양 조정 칩 순서 달마다 먼저.
- 알람 화면 옷 문구 기온차 기준 8° · 새 문구.
- 시험: s86 4) 고침 · 5) 추가 (24).

## v0.131 — 날씨 팝업 넘길 때 깜빡임 2
- v0.130 은 틀만 두고 innerHTML 을 새로 만들어서 새 그림이 한 프레임 비어 보였음 · 커버 화면(팝업이 화면보다 길어 스크롤)에선 넘긴 뒤 스크롤 위치가 남아 툭 튐.
- swAdoptWx: 넘김이 끝나면 다시 그리지 않고, 밀면서 그려 둔 옆 날짜 판(.swn)의 내용을 그대로 옮김(replaceChildren) + scrollTop=0 + wxDayPopHtml 로 wxDz 만 새 날짜로. (안쪽 화면은 원래 깜빡임 없었음 — 사용자 확인)

## v0.132 — 날씨 팝업 넘길 때 깜빡임 3 (커버 화면 녹화로 원인 확인)
- 녹화(60fps): 넘김이 끝나는 순간 1프레임 동안 글 · 그림이 비고 구분선만 보임 → 내용을 다른 요소로 옮기면(replaceChildren · innerHTML) WebView 가 그 층을 다시 그리는 동안 비어 보임(커버 화면만 티 남).
- swAdoptWx: 옆 날짜 판(.swc · will-change:transform 층)을 옮기지 않고 그대로 남김 — 옛 판(cur)만 지우고 판을 position:relative · translateZ(0) 로 바꿔 흐름에 넣음. 다음 넘김 때 swWrap 이 이 판을 감싸도 깊이는 늘 1.
- wxHrScroll(root): 옆 날짜 판을 만들 때(swSide) 시간별 줄 스크롤을 미리 맞춤 → 넘긴 뒤 바꾸지 않음. rAF 호출은 ()=>wxHrScroll() 로.

## v0.133 — 날씨 팝업 깜빡임 4 (밀기 시작할 때)
- 두 번째 녹화: 넘김 끝 깜빡임은 사라졌고, 밀기 시작할 때 1프레임 전체가 빔 → swWrap 이 내용을 새 .swc 로 옮기기 때문.
- 날씨 팝업은 열 때부터 내용을 .swc(position:relative · translateZ(0))로 감쌈(wxOpenDay · swGo 대체 경로). swWrap: 이미 .swc 하나뿐이면 그걸 cur 로 씀(st.keepCur) · swUnwrap 은 keepCur 면 옮기지 않고 transform 만 되돌림. → 밀기 시작 · 넘김 · 제자리 어디서도 내용을 옮기지 않음.

## v0.134 — 가족에게 집 위치 자동 · 가족 달력 날씨 · 판마다 스티커 크기 · 위젯 유찬 달력
- 집 위치 자동: wxShare = {w(직장 · 없으면 집), h(집), tm} (날씨 켠 사람). famCleanSched 가 h 보관. famPush: 규칙이 h 를 거절하면 h 만 빼고 다시. firestore.rules scheds.wx keys ['w','h','tm'] + h 형식 (규칙 시험 120 통과) → **배포 필요: firebase deploy --only firestore:rules**.
- 받는 쪽: famSchedHome(m) = 보낸 h → 내 폰 집(날씨 켰으면) → 그 사람 직장. famSchedWx 는 wxOn 아니어도 됨(+hm 반환 · vcWxPop 이 씀). wxCodes: 날씨 꺼진 폰도 wxFamCodes(가족 h · w) 받아 옴 · wxFetch 의 wxOn 조건 뺌. 가족 카드 "날씨도 보기 · 집 지역 고르기" 버튼 없앰(늘 자동).
- 가족 날짜 창: 4일 뒤부터 wxFarLine(중기 한 줄) · wxHistSave 는 내 날씨를 안 켜도 가족 것(f)만 저장 · 복원은 c 또는 f 있는 날.
- 스티커 크기 판마다("달마다 따로"): stzMonth(mk) 가 그 달 크기(저장값 · 없으면 그 달만 재기) → render 뒤 stzPanels 가 #track 판 3개에 style --stz(기본이면 var(--stz0)) · todayGo 가 끼워 넣는 판도. 넘어오는 달이 들어오는 동안에도 제 크기(시험: 5월 9.2 → 11월 14px 가 미끄러지는 중에도 14).
- 위젯 유찬: widgetJson people[].d[날짜](6일 전~14일 뒤) = 직접 추가한 가족 {l 일정 · st 스티커(id · n · N) · nt 메모} + 오늘 · 내일 wx(wxWidgetOf · 근무표 가족도). people[].k 에 유찬 스티커(달력 칸). WidgetDayActivity: 가족 달력이면 위쪽 일정 줄 · 날씨 줄(누르면 "#wx@사람") · 유찬 스티커 체크(toggleManSticker → 할 일 t:'mstk') · 메모. 앱 applyWidgetActions 가 mstk 를 m.stk 에 반영 · widgetSync "#wx@사람" = 그 사람 달력 + 가족 날씨 팝업.
- 연결 화면(근무자): 날씨 켠 사람에게 "집 · 직장 동네와 근무 시간도 가족 폰에 보여요" 한 줄.
- 시험: s87 (12) · 규칙 시험 h.

## v0.135 — 2026-11-05 사용자 묶음 (사진 7장) + 근무 기록 · 처음 안내 · 이럴 땐 이렇게 자세히 · 렉
- 버그: 와이프 폰 가족 카드 날씨 안 열림(wxOpenFam sched → famWxOpen) · 쉬는 날 오늘 회색 #6b7482(가족 달력 회색 위에서도 보임 · 위젯 MonthWidget shiftToday 도) · 칸 채우기 명절 띠 · 자는 카드 class sl→slp(스티커 칸 .sl 과 겹쳐 유찬 카드가 어둡게 · 점선).
- 같이 쉬는 날 둥근 띠(.fh.all/.fc.all · 마지막 줄 lst) · 새로 설치 기본 vivid · 알람 "이번만 끄기 ›" 작은 글자(askip-l · 카드 높이 그대로) · 유찬 스티커 그만하기(mstk-end)/지우기 · 가족 날씨 팝업 밀어 넘기기(wxPopFam · famWxOpen) · 경량패딩 그림(pad_light) · 시간별 줄 빈 시간 2시간 규칙(wxcore hours).
- 날씨만 알림(Reminders postWeather): 출근 · 퇴근 기온 한 줄 + 우산 한 줄 + 미세먼지(나쁠 때) · [오늘 날씨 보기](#wx) [앱 열기].
- 포스트잇: 할 일은 누르면 크게 보기(openPiView · 줄 눌러 체크 · [수정하기]) · 다 하면 가족 알림 한 번(piAllDoneNote) · 쓴 날짜 · 벽은 두 줄 쌓기(piMasonry).
- 설정: 네모 칸 12개(LINE_ICON 선 아이콘) · 부가 기능도 칸 + 스위치(ad-tile: 꺼져 있으면 켜기 · 켜져 있으면 그 설정 AD_GO).
- 유찬 스티커 4개 넘으면 묻기(manHidSnap · msh-undo).
- 근무 바뀐 기록(각자 폰 · 3개월 · 300개): S.chLog [{t,k,w,a,f,to,rcv,want}] · chLogAdd. 내 변경 = save() 앞 chLogMine(ovSnap 과 비교) · 가족 변경 = famSchChange · 요청 = 미러 갱신 때 상태 비교(req · pending=보류 · accepted · rejected). 소식 창 "근무 기록" 탭(chLogBody · feed-go). normalize + BACKUP_KEYS.
- 처음 안내(coach): coachSets() 3묶음 tcal(달력 3단계) · twx(날짜 창 날씨) · tfam(가족 메모 · 근무 요청) — S.hints 에 한 번만 · render/openDay 뒤 coachSoon · 이럴 땐 이렇게 "처음 안내 다시 보기"(coach-again). 시험 도구는 #tutx 를 숨김(lib.js · x_common.js · old/t6/t7/t8) · s88 만 {coach:true}.
- 이럴 땐 이렇게 자세히: TIPD(10개 · 이럴 때 · 먼저 · 단계 · 사진 tips/*.webp). 사진은 시험 도구로 찍고 주황 테두리(스크래치 tipshot2.js 방식). 한 번만 알람 저장 때 그날 다른 알람이 울리면 "그날만 건너뛸까요?"(askip-day → skipAt).
- 렉: renderCal 이 그린 판 글을 stzMonth 가 그대로 씀(calMemo) · fitDn 은 한꺼번에 재고 넘치는 칸만 고침. 아직 남은 것(TODO): 날짜 창 넘김 다시 그리기 · 탭 돌아올 때 다시 그리기.
- 시험: s88 (25) · s64/s65/s68/s69/s74/s77 새 화면에 맞춤.

## v0.136 — 달 넘기기 "페이지 넘기기" 방식 · 앱 달력 기본값 · 스티커 겹침 팝업 · 이럴 땐 이렇게 27개
- 달 넘기기(내 달력): 원인 = ① 넘어가는 0.25초 동안 touchstart 를 busy 로 버림 ② 넘긴 뒤 render() 가 세 판을 다 다시 그리고 새 옆 달 스티커 크기를 그때 잼(느린 폰 1~1.2초 멈춤).
  · calShiftFast(n): 판 DOM 을 옮기기만(맨 끝 판 하나만 calPanel) → render() 는 calKeep 으로 판은 건드리지 않고 머리줄 · 오늘 빛만. 끝 판 스티커 크기 · fitDn 은 60ms 뒤. 조건 밖(3달 같은 크기 · 칠하기 · 가족 보기 달력)은 예전 방식.
  · calPend/calFlush: 넘어가는 중 새 손가락이 오면 지금 넘김을 바로 끝내고 보이는 자리(swBase) 그대로 이어서 따라감 · ‹ › 도 calFlush.
  · calPrefetch: 쉬는 동안(1.2초 뒤 · idle) 앞뒤 1 · 2달 스티커 크기를 한 달씩 미리 잼(stzMonth 저장).
  · 잰 값(CPU 4배 느리게): 넘김마다 멈춤 1.0~1.2초 → 0.2~0.3초 · 0.12초 간격 3번 밀기 3달 다 넘어감. 날짜 창 · 날씨 팝업 넘기기는 아직 예전 방식(TODO).
- TUNE_DEF appCover/appInner = 사용자 값 (새로 설치만 · 저장된 값은 그대로).
- 스티커 저장 때 stClashScan(같은 그림 dup · 4개 넘음 hid · 밀림 mv) → stClashAsk 버튼 3개: 지금 만든 스티커만 보이기(clash-show: 겹친 날 옛 것 빼고 체크 옮김 · 4개 날은 맨 뒤 것 그 날 빼기) · 겹친 날은 건너뛰기(clash-skip: 새 것 skip) · 취소(sh-undo). stampHiddenAsk 는 안 씀.
- 이럴 땐 이렇게: TIPD 17개 더(자세히 27 · 한 줄 12) · "스티커가 왜 안 붙지?" 새 팁 · 사진 t11/t13/t15.
- 시험: s89 (24) · s23/s57/s58 새 기본값 · 새 팝업 · s88 팁 수.

## v0.137 — 날짜 창 넘기기도 "그려 둔 옆 판 그대로"
- 잰 값: 날짜 창 밀기는 이미 안 씹힘(swPend/swFlush). 남은 것 = 넘긴 뒤 openDay 가 창 전체를 다시 그림(깜빡임 · 다시 그리는 시간).
- swAdoptDay(st): 날씨 팝업 swAdoptWx 처럼 옆 판(.swc.swn)을 그대로 남기고 옛 판만 지움. swSide 가 지운 id 는 data-swid 로 남겨 두었다가 되살림(dstrip · memoInput · wxDay …). 상태: tidyMemos · memoEdit/memoText 비움 · sheetKey · markSel · dstripCenter · coachSoon. 달이 바뀌면 calShiftFast(±1) 로 달력 판만 옮김(데이터가 바뀌었으면 다시 그림).
- dsiX(el,on): 날짜 띠 가운데 맞춤을 띠 안 자리로 계산(판이 위치 기준이 되면 16px 어긋났음).
- 시험: s89 날짜 창 넘기기 (메모 · 근무 · 달 바뀜) · s75 판 하나 남는 것 허용.

## v0.138 — 달 넘기기 = 브라우저 가로 스크롤(scroll-snap) · 지난 시간 미세먼지 남기기
- #track = overflow-x:auto + scroll-snap-type:x mandatory · .panel = 100% · scroll-snap-align:start · scroll-snap-stop:always. 손가락 따라가기 · 튕기기는 브라우저가 직접(앱이 바빠도 안 씹힘).
- 판 7개: 문서 순서 [mk-1, mk, mk+1, mk-2, mk+2, mk-3, mk+3] (지금 달은 늘 nth-child(2) → 옛 코드 · 시험 그대로) · 보이는 순서는 style.order(3+v-mk) · data-mk. 먼 판은 calFillLater 가 한 판씩 채움(가까운 것부터) · 미는 동안 다가오는 빈 판은 바로 채움.
- 가운데 = scrollLeft 3W (calCenter: 다시 그린 뒤 · 화면 크기 바뀔 때). 판 옮기기 = calReorder(nm,keepView): 있는 판은 order 만 바꾸고 빠진 판만 새로 · scrollLeft 를 보이는 자리 그대로.
- 판을 옮기는 때 = 완전히 멈춘 뒤만(calSettle: scrollend 또는 0.09초 조용 · 판에 딱 맞을 때 · 손가락 없을 때). 움직이는 중에 scrollLeft 를 바꾸면 손가락 스크롤이 옛 자리로 되돌려 튀었음(시험으로 확인) → 대신 앞뒤 3달씩 둬서 연달아 밀어도 끝에 안 막힘.
- ‹ › · 오늘: calAnim (0.26초 · 그동안 scroll-snap 끔) → shiftMonth(dir,true). 
- 브라우저가 기다리지 않게: document 의 막는(passive:false) touchmove 를 없앰 — 끌기는 #page · #pop 에만 · 동료 근무표 · 가족 달력(#vcsl, touch-action:pan-y)은 막지 않음.
- 오늘 칸 빛은 손으로 밀 때만 멈춤(가운데 맞춤 스크롤은 무시). 닫힌 날짜 창의 날짜 띠 scroll 은 무시(닫자마자 다시 열리던 것).
- wxHistSave: 시간별 줄을 지금 시각 기준으로 저장 → 지난 칸은 실제 잰 미세먼지 얼굴 · wxDustKeep 로 실제 값은 예보로 안 덮음 · 어제 저장본의 예보 칸도 서버 지난 값(q.hh)으로 채움.
- 시험: s89 (35) · s63 · s47 · s87 판 7개 · CDP 손가락.

## v0.139 — 연달아 밀어도 안 막힘(앞뒤 12달) · 넘기는 중 월 숫자 · 업무 메모는 적은 날만
- 원인: 쉬지 않고 밀면 멈출 틈이 없어 판을 못 옮김 → 앞뒤 3달 끝에 닿아 한 번 막힘. CAL_R=12 (판 25개 · calFar) · 먼 판은 비워 두고 보이는 판 앞뒤 2달만 채움(calFillLater 는 보이는 자리 기준 · 움직이는 중엔 미룸) · 다가오는 판은 글만 바로.
- 위 월 숫자: 스크롤 중 보이는 판 기준으로 바로 바꿈(반 넘게 오면).
- 업무 메모 창(swNext 'wl'): 옆으로 넘기면 적어 둔 날로만(1년 안) · 위젯 날짜 창(WidgetDayActivity.stepTo): 업무 일지를 펼쳐 둔 채면 wl 있는 날로만 ‹ › · 밀기.
- 시험: s89 (39).

## v0.140 — 폰(소수 폭 화면)에서 12달 지나면 안 넘어가던 것 · 손으로 넘긴 뒤 › 가 처음 달 기준이던 것
- 원인: calW 가 clientWidth(정수 411)를 썼는데 폰 화면은 411.43px 같은 소수 → 판 자리 i*W 가 실제와 몇 px 어긋나 calSettle 이 "아직 움직이는 중"으로 보고 가운데로 못 돌아옴 → 12달 끝에 막힘 · cur 도 안 바뀌어 › 누르면 옛 달 기준. 시험 화면은 정수 폭이라 못 잡았음.
- 고침: calW = getBoundingClientRect().width (소수) · 멈춤 판정 3px · calSync(): ‹ › · 오늘 누르기 전 보이는 달을 지금 달로.
- 시험: s89 소수 폭(389.43px)에서 13번 넘김 · 넘긴 뒤 › · s75 업무 메모는 적은 날로만.

## v0.141 — 쉬는 날 날씨 위쪽 = 지금 · 오늘 요약 · 모양 조정 정리
- wxRestCards(cs,c,rs): 내 날씨 팝업(wxDayPopHtml)에서 근무 · 활동 없는 날이면 rs={today,raw,md} → 두 칸 자리 그대로 왼쪽 "지금 오전 10시"(WX.at 지금 기온 · 체감 WX.feel · WX.desc) / 다른 날 "하루 n월 n일"(그날 날씨 글) · 오른쪽 "오늘(하루) 요약 최저 · 최고"(lo / hi · 비 % · 일교차). 옷 · 챙길 것은 원래 칸(cs) 기준 그대로. card() 에 big(글자) 추가. 지난 날(wxHistPop) · 가족 팝업은 그대로.
- 모양 조정(openTunePage): 위젯 상태 줄 → 맨 아래 접힌 "문제 찾기 정보" · 달력 모양 · 오늘 표시 빠짐(설정 › 화면: "오늘 표시" 한 줄에 색 + 모양 칩) · 묶음 details(tng_*) 지금 화면만 펼침(다시 그릴 때 펼친 것 유지) · 스티커 크기(왜 작아졌나) 접힘 · 미리보기 주 ▲ ▼(tnWeek · 처음은 메모 많은 주) · 미리보기 칸 높이 = 실제 달력 칸(tnCellH · 열기 전에 잼 · 전엔 칸이 390px 로 늘어나 140px 틀에 잘림).
- 시험: s90 (13) · s60 s61 s71 s84 s86 바뀐 화면에 맞춤.

## v0.142 — 날씨만 알림 소리(알람마다) · 알람 5분 전 "이번만 끄기" · 날짜 창 쉬는 날 날씨 · 유찬 · 가족 달력도 가로 스크롤
- 날씨만 알림: 채널은 그대로 소리 없음 · Reminders.playOnce 가 알람마다 고른 소리(tone · 없으면 폰 기본 알림음)를 한 번만(6초까지 · 무음/진동 모드면 안 틈). JS 가 wx 알림에 snd · tone 실어 보냄. 알람 고치기(날씨만) = "🔔 알림 소리 [소리 · 무음]" + "소리 고르기"(dtone 그대로).
- 5분 전 알림: setAlarms 목록에 pre(반복 · a.pre5!==false · 건너뛴 시각 아님). AlarmScheduler.schedulePre(scheduleNext 끝에서) = 가장 가까운 pre 알람 5분 전에 PreAlarmReceiver(새 파일 · 매니페스트) → 소리 없는 알림(IMPORTANCE_LOW · setTimeoutAfter 알람 시각) [이번만 끄기] → skipOne(목록에서 빼고 KEY_SKIP 에 적음 · 토스트) · 알람이 울리면 PreAlarmReceiver.cancel. 앱: takeSkips 브리지 → alarmTakeSkips(pushAlarmsToNative 앞 · 화면 다시 보일 때) = 그 알람 skipAt. 알람 고치기에 "⏰ 5분 전 알림" 스위치(기본 켜짐 · 반복 알람만).
- 날짜 창 작은 날씨 카드 wxRestMini: 쉬는 날 오늘 = "지금 n°" 한 칸 · 다른 날 = 그날 그림 + "lo°~hi°"(cell 에 tt). 근무 날 그대로.
- 가족 · 유찬 달력: vcTrack(gridFn, cls) = .vctr 가로 스크롤(scroll-snap) · 지금 달 판만 id="vcsl"(기존 '#vcsl …' 선택자 그대로) · 앞뒤 3달(±1 은 바로 · 나머지는 vcFillFar · 다가오면 바로) · vcSettle(멈추면 vcY/vcM 바꾸고 vcRerender) · 넘기는 중 위 월 숫자 · 칠하기 · 여러 날 고르기 중엔 .lock(가로 스크롤 끔 · 옛 손가락 처리). 옛 #vcsl touch 처리는 .vctr 안에선 안 씀.
- 유찬(man) · 가족(vc) 날짜 창: swAdoptFam = swAdoptDay 처럼 옆 판 그대로(manDayK · rqD · 달 바뀌면 뒤 달력만 다시).
- 가족 날씨 팝업(famWxPopHtml) · "나 · 오늘" 팝업도 쉬는 날이면 wxRestCards.
- 시험: s91 (15) · s71.

## v0.143 — 날씨만 알람 소리 = 폰 알림음 목록 · 가족 탭 내 카드 쉬는 날 지금 · 유찬 시간별 줄 "🏫 유치원"
- 소리 고르기: 날씨만 알람이면 pickTone('n:'+id) → MainActivity.openTonePicker 가 "n:" 이면 TYPE_NOTIFICATION(알림음 목록 · 제목 "알림음 선택") · __onTone 은 'n:'+id 도 받음 · 미리 듣기(previewTone 'n:'…) = 알림 소리 · 기본 알림음. 일반 알람은 그대로.
- 가족 탭 내 카드: wxRestMini 로 쉬는 날 오늘 = 미니 "지금 n° · 오늘 lo°/hi°"(mc 에 tt) · 큰 카드는 "지금" 한 칸.
- famWxPopHtml: 학생 가족은 hr.wl = "🏫 " + 그날 일정 이름(famTypeAt · famLbl · m.label · 없으면 학교) → wxHrHtml 묶음 이름 "직장" 대신.
- 시험: s92 (6).

## v0.144 (덧붙임)
- 날짜 창 오늘 표시: dsTK · dsTgo · dsTdy · dsHint (manDayHtml 위). 띠 `.dsi.td`(오늘 칸 글자 --tdc 알약) · 오늘이면 제목 줄 끝 `.tdy` "오늘" · 다른 날이면 `.dft` 에 data-act(day-go · man-go · vc-go) + 아래 `.tgo` 안내 → 누르면 오늘로. 내 · 가족(man) · 근무표 가족(vc) 세 창 모두.
- 쉬는 날 다른 날 왼쪽 칸(wxRestCards): big 글 대신 sk + sk2(오전 → 오후 그림, `.s.two` · `.ar`) · d 한 줄 "구름많음 → 맑음" / "하루 종일 맑음". 그림이 같으면 sk2 없음.
- 가족 탭 내 카드 날씨(wxOpenFam 'me') → wxOpenDay(오늘) 로 날씨 탭과 같은 팝업(옆으로 밀기). 못 열면 예전 팝업.
- 시험 s93.

## v0.145 (덧붙임) — 새 모양 1차
- 공통: 글꼴 Pretendard (assets/fonts/PretendardVariable.woff2 · OFL 라이선스 같은 폴더) — body · button/input 에 적용. 날씨 팝업 제목 등 Jua 는 그대로.
- 강조색 밝은 파랑: --accent #3182f6 (다크 #4c8dff) · --acc-soft/ink/sw 같이.
- 새 모양 화면 = `.pg-b.np` 안: .pg-sec 카드(모서리 22 · 옅은 그림자) · .pg-cap 묶음 이름 · .prow 줄 · npRow(icon,name,right,{d,tap,act,cls}) · npVal(v) · npi(이름) = lucide 선 아이콘(NPI) · .nphero 위 칸(--sc 근무 색 빛) · .nppills 근무 칩 · .npseg 세그먼트 · .npsub 펼친 칸. 설명(small)은 .keep 붙인 것만 보임.
- 알람 고치기(openAlarmPage) · 근무 패턴(openPatternPage · typeListHtml · patLocHtml(row)) 을 새 모양으로. id · data-act 는 그대로(저장 · 시험 그대로).
- 패턴 제외 초기화: 'pat-reset' → patResetOpen(q: m 이번 달 · n 다음 달 · a 전체) → 'pr-go' 경고 2번 → 그 기간 S.overrides 만 지움. (예전 'clearov' 는 안 씀 · 남겨 둠)
- 달력 오늘: 칸 전체 3px 테두리(::after · z 2 · 휴일 띠 위 · 메모 띠(3) · 스티커(6) 아래 · 크기 영향 없음) · data-today 는 늘 'b' (todayLook 은 위젯만) · 설정 › 화면 오늘 표시 = 색만. 빛 GLOW_MS 1600 두 바퀴(dasharray 둘레 되풀이) · 진하게 · 다른 앱 갔다 3초 넘게 있다 오면 한 번 더.
- 달력 머리 · 요일 줄 흰 바탕 · ‹ › 크게 · 메모 띠 모서리 4.
- AI 티: 보라 그라데이션(.nc.w · .fam-now · .wlrow · .anext) → 회색 바탕 + 테두리 · 자는 중 카드(.nc.slp) 어두운 바탕 없앰 · 🖌 → 선 아이콘 · "⏰ 다음 알람" · 메모 입력칸 🔒 뺌 · 날짜 창 오늘 표 색 = --tdc/--today.
- v0.144 점검 고침: 쉬는 날 다른 날 그림 두 개는 둘 다 있고 다를 때만 · 가족 탭 내 날씨 = wxOpenDay 만 · 오늘 시간별 줄 지금부터(now) · dsTK 1초 캐시.
- 시험 s94 · s91 · s77 글자 맞춤. 되돌리기용 브랜치 backup-v0.144.

## v0.146 (덧붙임) — 새 모양 1단계
- 알람 탭(renderAlarm): .alw 회색 바탕 · .anext1 다음 알람 카드(종 아이콘 · 남은 시간 알약) · .acard.ac2 = 연한 근무 색 바탕(--ac 12%) · 왼쪽 띠 · 배지 · 큰 시간(앞 0 없음) · 아래 칩 .cp(전날/다음날 · 한 번만 · 무음 · 진동) · .cs 소리 막대 · .cp.w 날씨(끈 뒤 보기 / 날씨만) · 이번만 끄기 · 건너뜀은 그대로(askip-l) · 스위치 .sw.big. 머리 ＋ = .apl 둥근 버튼.
- 스위치 크기 3가지: .sw 44x26(기본) · .sw.big 48x28(알람 카드) · .npsub/#pop 안 40x24 · 누르는 자리는 .sw::before 로 넓힘.
- 설정: "알림" 칸 없앰(가족 알림 = 가족 연결 · 알림 소리 = 스티커 화면 · openNotifPage 는 남겨 둠). 화면(openLookPage) · 도움 · 정보(openInfoPage) · 부가 기능(openAddonPage · 줄 .adr + 스위치) · 백업(openBackupPage) 을 .np 새 모양으로. id · data-act 그대로.
- 날씨 팝업: 본문 Pretendard(Jua 제목 · 숫자 그대로) · 구분선 연하게 · 줄 이름 작은 회색 · "칸을 누르면…"(.wxweb) 숨김.

## v0.147 (덧붙임) — 새 모양 2단계 (글 다듬기 · 사진 · 설명문 줄이기 제외)
- 알람 카드 바탕 근무 색 16% · 목록 머리 흰 띠 없앰.
- 가족 연결(renderLinkPage) · 가족 목록(openFamSetPage) · 스티커(openStampPage) → .np. 가족 연결: 가족 줄 상태(근무자 · 보기만)는 small.keep · "나" 표 · 파란 넓은 초대 버튼(.invb) · 날씨 안내 줄 · 맨 아래 규칙 글 숨김(→ 팁) · 불러오는 중 · 오류는 .hint.keep.
- 이미지 공유(#share-action-bar): 아래에서 올라오는 창 · 제목 · 스위치 두 줄(id shareMemo · shareStk 그대로) · 🔒 안내 줄 숨김.
- 이럴 땐 이렇게(openTipsPage): 한 화면 그대로(시험 구조 유지) · 처음 안내 줄 · 묶음 카드(선 아이콘 TI · 개수 · 펼침 화살표) · 팁 줄 → 이럴 때 회색 칸 · 파란 번호 단계(CSS counter) · 사진 · 넓은 바로 가기. 글 다듬기는 design/tips/new_text.js (사용자 확인 뒤 TIPS · TIPD 에 넣기).
- 가족 시험 fam5e 는 처음 안내 말풍선(#tutx)이 클릭을 막아 실패 — v0.135 부터의 문제(가족 시험 도구가 #tutx 를 안 숨김) · 이번 변경과 무관.

## v0.157 — 가족 탭 다듬기 · 설정 · 가족 · 알람 탭 위쪽 회색 통일
- 가족 탭(.famv): 회색 바탕 · 카드 흰색 통일 · "방금 동기화됨" 빼기(30분 넘으면만) · 시간표 범위 같은 달이면 "11월 13일 ~ 19일" · 이름 열 동그라미만 · 가족 추가 = 흰 알약 · 같이 쉬는 날 칩 = 흰 알약 + 노란 점(☀ 빼기)
- 설정 · 가족 · 알람 탭: 제목 줄(#top)과 바탕을 같은 회색으로 (body:has(.mset/.famv/.alw/.alempty)) · 설정 검색 칸 위아래 여유 · 알람 없을 때 안내 = 흰 카드
- 시험 s31

## v0.156 — 설정 첫 화면 A (시안 design/settings-main)
- renderMore: 회색 바탕(.mset) · 묶음 "내 근무 / 가족 / 앱" · 칸 auto-fit(2개면 넓게) · 위젯 = 놓인 개수(AlarmBridge.widgetCount) · 화면 = 글자 크기 · 가족 연결 + 가족 목록 = "가족" 한 칸(가족 연결 화면에 "가족 목록" 줄 추가) · 권한 경고 = 흰 카드 줄(.mwarn) · 이럴 땐 이렇게 = 넓은 한 줄(.mtips)
- 시험 s88

## v0.155 — 날짜 창 새 모양 · 오늘 표시 기본 = 근무 색 · 화면 설정 아이콘
- 날짜 창(dayHtml): 아래쪽 .dsbody = 회색 바탕 + 흰 카드 · "근무" 줄 오른쪽 알약(sh-pill) 하나로 접기 · 펼치기 · 펼친 카드 아래 "여러 날 칠하기" 연파랑 버튼(paint-btn) · 고른 근무 = 파란 테두리
- 메모 카드(memsec): 입력칸 · 보내기(파랑)도 카드 안 · "자세히"는 제목 줄 오른쪽 · 빈 날 안내 · 🔒 설명 줄 빼기(가족 메모 쓸 때 경고 줄만) · "날짜를 누르면 오늘로" 빼기
- 날짜 띠: 오늘 = 테두리(--tdc) · 고른 날 = 연파랑 바탕
- --today 초록 → 파랑 #3182f6 · 처음 한 번(tdcMig) todayColor 비어 있으면 'shift'(그날 근무 색 · 쉬는 날 회색)
- 화면 설정 아이콘: grid · circle-dot · sun-moon · type · sliders
- ⚠️ 한 줄짜리 normalize 줄 안에 // 주석을 넣으면 그 뒤 코드가 모두 주석이 됨 → /* */ 사용
- 시험 고침: s64 s65 s75 s84 s93 s94 · 시험 도구(lib.js)는 근무 칸을 자동으로 펼쳐 둠

## v0.154 — 작은 창 새 모양 (시안 design/popups)
- #pop .menu 공통 CSS: 둥근 26 · 손잡이 · 제목 = .mh 의 <b> 굵게 위 · 작은 글은 아래(column-reverse) · 줄 테두리 없음 · 닫기 = 회색 버튼 · .mi.d 빨강 · .btn 52px · 지역 칸 C3 (날씨 큰 창 .wxdpop 은 그대로)
- openPop → popIcons: 줄 맨 앞 이모지(✏️ 🗑 📋 📅 🚫 🔔 🔁 ⏰ 📍 🏠 🏭 📤 🎨 📷 🔗 ⚙ 🔍 ＋)를 회색 칸 선 아이콘으로 (♥ · 🔒는 그대로)
- 패턴 제외 초기화 창: 제목 잘림 고침 · 초기화 빨간 버튼 · 스티커 고르기 창 5칸 줄바꿈
- 시험 s49 (v0.153 스티커 기본값에 맞춤)

## v0.153
- 오늘 빛 모서리 = 오늘 테두리(::after) 모서리 — 동그라미 모양은 각진 테두리라 빛도 각지게 (glowSvg)
- 스티커 새로 붙일 때 횟수 · 알림 · 활동 · 가족 보이기 모두 기본값 (stDraftOf) · 저장된 옵션과 다르고 다른 데서 쓰는 스티커면 이 날만 따로(stOptKey · stOneLike) · 시험 s95 · s44

## v0.152
- 달력 동그라미 모양: 오늘 칸 바탕색 없음(테두리만) — 메모 색이 묻혀서
- "구글 계정에 연결됨"이 서버 계정과 다를 때(구글 연결 없음) 표시 지우기 famGAcctFix (famBoot)
- 관리자 확인(admCheck)은 가족방만 있으면 시도 — 규칙이 계정 번호(adminUids)로도 관리자 인정

## v0.151 — 옛 화면 새 모양 (시안 design/alarm-sound · np1 · np2 · np3 · wlog)
- 알람음 고르기 창(.tsh: 고른 쪽 체크 · 설명 글 없음) · 출퇴근 날씨 · 알림 · 위젯(C3 칸) · 메모 색(가족 메모 보라 고정: normalize 에서 fam='#7b5cf0' · 나만 색에서 보라 계열 뺌 isPurple) · 알람이 잘 울리게(켜짐 초록 · 켜 주세요 주황 · 삼성 안내는 줄 → 창 perm-samsung)
- 스티커 등록(위 칸 그림 · 이름 · 날짜 / C3 칸 / 상세 조건 접기 없앰 → 반복이면 기간 · 공휴일 줄 바로 · 가족에게 보이기 · 활동 줄) · 개인 캘린더(시작 날 줄 · 설명은 pers-help 창) · 업무 일지 설정(칸 = 보이기 스위치 wlsV_)
- 업무 메모 창: 제목 이모지 · ✎ 빼고 선 아이콘 회색 칸 버튼 · "쓰는 대로 저장돼요" 빼기 · 아주 연한 노란 노트(#fffefa · 밑줄 #f3eedf 32px = 글 줄 간격 · wlGrow 32px 단위) · 다크는 따뜻한 짙은 회색 · 밀다 만 뒤 창이 옆으로 밀려 왼쪽이 잘리던 것(scrollLeft 0으로)
- 근무 통계: 첫 화면 = 이번 달(대근 · 숫자 · 근무 줄 · 예상 월급) · 월급 설정 · 올해 누적은 줄 눌러 따로(stSub 'pay' · 'year') · 명세서(달 칩 · 금액 칸 · 설명은 slip-help 창) · 휴무일 · 기념일(빈 화면 · 파란 추가 버튼 · 범례 빼기) · 찾기(흰 검색 칸 · C3 칸)
- 작은 창 제목 이모지 빼기(🔐 🔁 📝 📋 📅 💌 🏭 ☁️ 🗂 · 지역 고르기 🏠 🏭 📍)
- 시험 고침: s26 s36 s46 s50 s65 s71 s72 s76 s77 s84 s89

## v0.150
- 스티커: 날짜에 새로 붙일 땐 횟수 1번부터(stDraftOf). 이미 다른 날 · 반복에서 쓰는 스티커를 다른 횟수로 "이날만" 붙이면 한 번 쓰는 스티커로 따로 저장(stUsedElse · stOneLike) → 지난 기록 · 반복 그대로. 시험 s95.
- 위젯: 오늘 = 칸 전체 테두리 3dp(drawTodayBand · 동그라미 모양도 같음 · 옛 모양 값 무시) · 파랑 #3182F6 · 글꼴 Pretendard(assets/fonts/w_r · w_m · w_b.ttf = 앱 글꼴에서 400/500/700 고정 + 한글 · 영문만 · WFont) · 요일 줄 아래 선 · 메모 띠 모서리 4dp · ‹ › 26.
  - run-month-real.sh: WidgetFont.kt 포함 · 가짜 Typeface 가 진짜 글꼴 파일 읽음 · setStrokeCap 가짜 추가. EXTRA="Weather.kt InAppWeb.kt PreAlarmReceiver.kt" 필요.
- 관리자: 내 번호(myCode = uid 해시 XXX-XXX · 도움 · 정보) · codes/{번호} 하루 한 번(famRegCode) · bonus/{uid} · bonus/_all 읽어 famRemain 에 더함(famBonusLoad) · 관리자 화면(openAdmPage: 번호 · 이름 찾기 · 같은 가족방 · 마지막 접속 · 건수 직접 · 모두에게 · 최근 기록 bonusLog 20개).
  - 관리자 확인: 앱은 bonusLog 읽기가 되면 관리자(admCheck) — 앱에 메일 없음. 규칙 isAdmin = email_verified + sha256(email) == adminHash(). 규칙 시험 123개(관리자는 가짜 주소로 바꿔 끼움).
  - 규칙: sent 한도 = 10 + bonus + bonusOf(uid) + bonusOf('_all').
- 설명문 남은 것 하나 뺌(스티커 가족 보이기 줄).

## v0.149
- 앱 곳곳 설명문 빼기 (design/trim-list.md "뺄 것"). 위젯 안내는 팁 "홈 화면에서 근무 바로 보기"로 옮김 (가족 이름 칩 줄 추가).
- 가족 탭 "옆으로 밀어서" 안내 빠짐 (fgHint 없음 · famSwiped 는 그대로 저장).
- 시험 고침: s31 · s53 · s71 · s72.

## v0.148 (덧붙임)
- 알람 설정 반복: [매번 | 한 번만] 두 칸(data-act drep · 숨긴 #aRepeat 체크박스는 그대로 같이 맞춤) · 줄 이름 "울리기" · 한 번만이면 onceDay(a) "11/22 한 번 울려요". 알람 탭 칩 .cp.once 주황 "한 번만 · 11/22".
- 두 칸 버튼 .npseg 전부 C3 (둥근 알약 · 고른 칸 흰 바탕 + 파란 테두리 + 옅은 그림자).
- 오늘 빛: 도는 동안 .cell.glowing 이 ::after 테두리를 숨기고, SVG g-draw 선이 첫 바퀴에 빛을 따라 그려짐(dashoffset per-head) · 두 번째 바퀴는 빛만 · 끝나면 glowStop 이 glowing 빼서 원래 테두리. 빛 예약할 때 바로 glowing(처음엔 테두리 없음) · 예약이 취소되면 glowStop.
- 이럴 땐 이렇게 글 전체 다듬음: TIPS(43 · 새 팁 4: 패턴 제외 초기화 · 5분 전 미리 알림 · 가족 빼기 · 무료 횟수) · TIPD 27개(첫 블록 11 + Object.assign 16). 제목이 바뀐 것: 조나 회사가… · 휴직이나 퇴사로… · 매달 1일 · 말일에 할 일 띄우기 · 아이 등하교나 학원 날씨 · 아이나 가족 일정… · 유치원에서 학교로 가요 · 가족에게 그날 쉬어 달라고 부탁하기 · 내 달력 없이 가족 것만….
- 팁 사진: tests/tips/tipshots.js 가 실제 앱을 찍어 assets/tips/*.webp (누를 곳 주황 테두리). 화면 바뀌면 node tests/tips/tipshots.js. 지금 t1_a · t1_b · t11_a · t13_a · t16_a · t16_b.
- 가족 시험(tests/family/*): #tutx 숨기기 넣음. fam5e 는 link-invite 를 못 찾고 멈춤 — v0.146 코드로도 같아서 이번 변경과 무관(에뮬레이터 쪽 · 따로 보기).

## v0.158 (덧붙임) 남은 옛 화면 정리 · 포스트잇 순서 · 요청 실패 이유
- 새 모양(.pg-b.np): openFamEdit(.feb · 평소 일정 4칸 .fk2 선 아이콘 · 사진 .fe-cam · 색 .fe-sw · 가족 연결 줄) · famSchedHtml/openManPat(종류 카드 .fpsec · 종류 더하기 .addr · 요일 · 날씨 볼 곳 · 방학 · 이 날부터 새 일정 · 공휴일 스위치 #feHol 은 같은 카드) · openManStkPage(개수 · 더하기 .npadd) · renderMemoDetail(.mdpg · 할 일/시간/알림/반복 npRow · 나만/가족에게 npseg · 가족에게 고르면 "N건 남음").
- 처음 안내 .choice: 이모지 → npi 아이콘 (--ic 색) · 오른쪽 › · 회색 바탕.
- NPI 추가: briefcase · book-open · flag · calendar-x · download · list-check · grip.
- 지움: openStatusPage · openTimesPage · openFamilyPage · openStickerBoard (들어가는 버튼 없던 옛 화면) + 그 case 들(more-status · more-family · sb-prev/next · tt-tab · tt-reset · st-cheer).
- 가족 탭 시간표 제목의 "+ 가족 추가" 뺌 (설정 › 가족 · 가족이 없을 때 빈 칸 버튼은 그대로). 팁 "아이나 가족 일정 같이 보기" → 설정 › 가족(fam-set).
- 포스트잇 끌어서 순서: 보드에서 .pi 를 450ms 꾹 → .pi-ghost 가 손가락을 따라감 · 놓은 포스트잇 위/아래 반쪽에 따라 앞/뒤로. S.piOrder['YYYY-MM']=[id…] (이 폰에만 · normalize 가 24달 · 200개로 다듬음) · 정렬 piOrdCmp. touchmove 막기는 #page 에만.
- 앱 안 소식 띠(showBanner · BAN_KINDS)는 예전부터 있었음 → TODO 체크만.
- 근무 요청 보내기 실패: famSendReqs 가 commit 약속을 돌려주고, 부르는 쪽이 famReqErr(권한 없음 = 무료 횟수 끝 · 가족방 연결 풀림)로 알림.
- 작은 창 설명 글 뺌: D-day 고치기 스위치 설명 · 근무타입 편집 "근무 시간 (출근 → …)".
- 시험 s97.

## v0.159 (덧붙임) 이럴 땐 이렇게 › 빼기 · 펼치기 모션
- .tips.np details>summary::after 숨김 (옛 › 표시) · ⌄ 만.
- 펼치기/접기: 문서 click(capture)에서 .tips.np details>summary 를 가로채 높이 애니메이션(Web Animations · 260/220ms) · 펼칠 때 안쪽 글 살짝 내려오듯 · 접기는 끝난 뒤 open=false · 도중에 다시 누르면 반대로 · reduceMotion 이면 기본 동작. 시험 s98.

## v0.160 (덧붙임) 달력 진하기 (시안 design/cal-look)
- 기본(data-bg 없음 · 밝은 화면만): --cbm 26% → 42% · --restx #c23a5a · 근무 글자 color-mix(tb 30%, 검정) · 날짜 숫자 · 휴 굵기 700.
- 또렷하게(밝은 화면만): 흰 칸 box-shadow 없음 · 근무 칸 선 = 칸 색 계열. 어두운 화면은 그대로.
- 밝은 화면 조건: @media not (prefers-color-scheme:dark) 안의 :not([data-theme="dark"]) + [data-theme="light"] 두 벌. 시험 s99.

## v0.161 (덧붙임) 종이 테마 뺌 · 동그라미 · 위젯 진하기 · 작은 위젯 (시안 design/circle · design/widget-look · design/widget-small/v4)
- 종이(paper) 뺌: 설정 › 화면 › 배경 = 기본 · 또렷하게 · normalize 에서 'paper' → '' · 종이 CSS 4줄 지움.
- 앱 동그라미: html:not([data-cal="fill"]) .cell:not(.pers) --b = min(… *.84, 100cqw - 20px) (좁은 폰은 근무 변경 빨간 점 자리 4px 남김) · 휴 굵게.
- 한 달 위젯(MonthWidget.kt): 칸 색 0.24 → 0.40 · 근무 글자 굵게 · 조금 진하게 · 휴 #C23A5A 굵게 · 또렷하게 흰 칸 테두리 없음(vividBorder col 인자) · 동그라미 rad*1.12 (cw/2 - 10dp 까지) · 오늘 근무 날 색 = deepen 을 검정과 72% 섞음 (밝은 화면).
- 작은 위젯(Widgets.kt): 같은 진하기 · 1칸 · 2칸(칸 채우기)은 근무 이름(tn · 위젯 데이터 새 값)을 크고 굵게 · 빨간 점 = 글자 바로 왼쪽 · 2칸 "다음 알람" 줄 뺌 · 1칸 아래 "내일 ○○"(tomText) · 7일 지난 날 흐리게(saveLayerAlpha 115).
- 위젯 데이터 days[].tn = 근무 이름(5자) · 시험 s100 · s54 고침.

## v0.162 (덧붙임) 동그라미 크기 막기 고침
- 동그라미 최대 = (칸 너비 - 22px) / 주야 배율(--tink) · 요청 링 칸은 (칸 너비 - 28px) / --tink (링 바깥 빨간 점 자리). v0.161 은 배율을 빼먹어 모양 조정으로 키운 사람은 점이 붙었음 (s63 로 확인).

## v0.163 (덧붙임) 오늘 빛 = 검색창 테두리 빛 느낌 (사용자 영상 · design/today-glow/real.gif)
- 앱(glowSvg): 두 바퀴 3.6초(GLOW_MS) · 꼬리 줄 7 → 14 (근무 색 · 매끄럽게) · 빛 머리 = 하얀 줄 14개를 가운데 맞춰 겹침(g-head · data-c · dashoffset = l/2 - head) → 가운데가 가장 밝고 앞뒤로 흐려짐 · g-bloom(blur 5px) 근무 색 번짐(다크 = 하양) · 도는 동안 .cell.today.glowing{overflow:visible} 로 번짐이 칸 밖까지.
- 위젯(drawGlow): 머리 앞 15% 하양 · 머리 둘레 동그라미 번짐(밝은 위젯 = 진한 근무 색 · 어두운 위젯 = 하양 · glowNight) · 한 바퀴 그대로.
- 시험 s63 대기 시간 3.6초에 맞춤.

## v0.164 (덧붙임) 오늘 빛 다듬기 2 (design/today-glow/real2.gif)
- 앱: 한 바퀴 1.8초(GLOW_MS · head = p*per) · svg 의 --gf(처음 0.3초 켜짐 · 끝 0.6초 사라짐)를 halo · dash · head · bloom 불투명도에 곱함 · 번짐 · 밝기 줄임.
- 위젯: GLOW_MS 820 → 1400 · gf 로 켜짐 · 사라짐.

## v0.165 (덧붙임) 위젯 오늘 빛 = 숨 쉬듯 · 새로 설치 기본 배경 (design/widget-glow/v1.html)
- 위젯: drawPulse(오늘 테두리가 0.4초 밝아졌다 0.7초 돌아옴 · 바깥 근무 색 번짐 두 겹 + 안쪽 하얀 줄) · GLOW_MS 1100 · play(step = PULSE_FRAME_MS 80) → 그림 약 13장. drawGlow(도는 빛)는 남겨 둠(안 씀). MonthRun 도 drawPulse.
- 새로 설치: bg '' (기본) · 칸 채우기는 원래 기본. 시험 s69 줄 추가.

## v0.166 (덧붙임) 오늘 빛 = 숨 쉬듯 두 번 (앱 · 위젯 같음 · design/today-glow/pulse2.gif)
- 앱: glowSvg 에 g-pb(g-po · g-po2 바깥 근무 색 번짐, blur) · g-pin(안쪽 하얀 줄 2겹) 추가 · glowFrame 이 --pe(두 번: 0.9초씩, 두 번째 0.7배, smoothstep) 설정 · 도는 빛 요소(g-halo · g-dash · g-head · g-bloom · g-soft · g-line · g-draw)는 CSS 로 숨김 · 오늘 테두리(::after)는 그대로 보임.
- 위젯: drawPulse 두 번 · GLOW_MS 1800 (80ms 프레임 → 약 22장).

## v0.167 (덧붙임) 달력 윗줄 높이 · 칩 간격 · 지난 날 지남 · 가족 시간표 오늘
- 달마다 높이 어긋남/넘길 때 툭 움직임의 원인 = 이번 달이 아니면 생기는 "오늘" 버튼(44px)이 윗줄을 54 → 56px 로 키움 → #top.cal-top{min-height:56px} 로 고정. (스티커 크기 --stz 는 근무 글자 높이에 영향 없음을 프레임마다 재서 확인)
- 날짜 창 근무 칩 gap 7px (고른 칩 테두리 5px).
- 지난 날 날씨: wxPastAll 로 저장본 칸 모두 past (wxHistPop · 날짜 창 카드 · wxHistCard). __wx.wxHistPop 시험용.
- 가족 시간표: 위 "오늘" 링크(fwkNow) 뺌 · fam-mode 를 이미 고른 칸에 눌러도 famGoToday(부드럽게) · 바꿀 때도 다시 그린 뒤 famGoToday.
- 시험 s101 · s31 · s76 고침.

## v0.168 (덧붙임) 근무 요청 화면(가족 달력 날짜 창) 새 모양 (design/request/v1)
- vcDayHtml: .dsbody.vrbody(회색 바탕) · sh-hd "근무"/"근무 바꿔 달라고 하기" + 오른쪽 sh-pill(· 요청하기 / · 요청 중) · 펼침 카드 .vrcard: 근무 칩 → .vrask "휴무 → 주간으로 바꿔 달라고 할게요" → #rqm2 → paint-btn 여러 날 고르기 → .vrsend 요청 보내기(N건 남음).
- 요청 중이면(open) 바로 펼침 · 상태 카드 .vrst (아이콘 · "주간으로 요청했어요" · 답 기다리는 중/수락/거절/적용/취소 · 답장 · pending 이면 취소 = rqcancel).
- 가족 메모 = memsec 흰 카드 · 제목 회색 · 빈 글 뺌 · 입력 줄 새 모양. "보기만" · 📩 뺌. 시험 s83 고침.

## v0.169 (덧붙임) 가족 탭 "지금" 카드 새 모양 · 달력 줄 (시안 design/viewfam/v1)
- famStRow(m,e,l,sub,now): 이모지 대신 선 아이콘 칸 .sic(근무 중 = 근무 색 · 쉬는/집 = 초록 · 자는 = 남색 moon · 학교 = 주황 · 이동 = 파랑) 또는 근무 글자 동그라미(.sic.sbd · 시간 모르는 근무자) + 상태 크게(.stt b) + 다음 일(.stt span). 막대 · 날씨 칸은 그대로. NPI 에 moon 추가.
- "달력 보기 · 눌러서 한 달 보기" 칩 → "달력" 카드 줄(.vcrows .vcr · "남편 달력 ›").
- 날씨: 보기만 가족도 근무자가 올린 동네(sch.wx)로 이미 가져옴 (wxCodes → wxFamCodes) — 바뀐 것 없음.
- 시험 s83 고침.

## v0.170 스티커 완료 창 새 모양 (시안 design/stk/v1)
- stampDayHtml: 스티커마다 한 줄 .sdr2 (그림 .sdi · 이름/언제·알림 시각 .sdn · 체크 .sdck 또는 여러 번은 동그라미 .sddots · ⋯ .sdmore). 줄 누르기 = sd-tap (하나씩 채움 · 다 찬 뒤 누르면 비움 · 되돌리기 토스트). 꾹 = 반복 · 알림 고치기(그대로).
- ⋯ = sd-more 작은 창: 이날만 건너뛰기/이날 지우기(sd-skip) · 이날부터 그만하기(sd-end, 반복만) · 반복 · 알림 고치기(sd-edit) · 닫기(sd-back). 옛 sd-done/sd-undo 처리는 남겨 둠.
- 아래 .sdfoot: 스티커 붙이기(sd-add) · 스티커 설정(sd-manage). 고르는 창 "닫기" 버튼 뺌. NPI 에 more 추가. 처음 안내(tipStk) 선택자 .sdr2 로.
- 시험: s102 새로 · s15 s23 s45 s48 s49 s50 s51 t13 새 줄 모양으로 고침.

## v0.171 묶음 (스티커 지우기 · 가족 탭 상태 · 동료 근무 · 같이 쉬는 날 · 색 고르기 · 위젯 미리보기)
- 스티커 sd-skip: 완료한 날도 지우기/건너뛰기 되게 그날 log · snap 도 지우고 되돌리기에 같이 돌려놓음.
- 근무 패턴 화면: 근무마다 시간 줄(.tltimes) · 조별 근무 칸 뺌 · 제목 "근무 패턴". 시간 = 근무 칩 편집 창 · "출퇴근 시간 · 날씨"(부가 기능 이름 · 페이지 제목 바꿈, 근무 시간 칸을 맨 위로 · 안 정한 근무는 "정하기").
- 시간 안 정한 근무(timesCustom 아님)는 짐작 안 함: wxMyWin · wxMemWin(교대 가족 · 근무표 가족이 시간 안 보냄) = null → 날씨는 집 하루 카드. myStatus/memberStatus: 쉬는 중 = 쉬는 날만 · 출근 전(오전 7시 시작) · 퇴근 후 · 근무 중 · 시간 없는 근무 = 근무 이름만. 내 카드도 famStRow 선 아이콘 칸(출근 전/후 · 근무 이름 = 근무 글자 동그라미).
- 동료 근무 = 페이지(openColleaguePage, pageMode 'colleague'): 조별 근무 표(teamGridHtml · toff · trow) · 한 달 표(renderColleague(y,m) · col-mon) · 조 이름 · 개수 고치기 · 내 조(col-mine). 부가 기능에서 켜면 바로 열림. 팀 관련 저장 뒤 teamRefresh().
- 같이 쉬는 날 = 페이지(openTogetherPage): 누구랑 같이(S.togOff = 뺄 가족 id/uid · togFam) + 야간 전 낮도 · 앞으로 3달 목록(togRuns · 이어지면 묶기 · tog-day = 그 날 창). 가족 설정 페이지의 famDayToo 스위치 뺌.
- 색 고르기: input color 대신 openColorPick (색 판 cpB · 밝기 cpL · cp-ok) · hsv2hex/hex2hsv.
- 위젯: S.widget.bg ('' | 'vivid', 처음 = 앱 배경) → widgetJson bg. 위젯 설정 페이지 맨 위 미리보기(AndroidBridge.widgetPreview(json,330,350) = MonthRenderer.preview → PNG base64, 바둑판 위) · 진하기 밀면 바로(input).
- 시험: s103 새로 · s31 s71 s72 s75 s86 s91 고침 (시간 정한 상태로 · 짐작 안 함).

## v0.172 오늘 띠 = 칸 경계에 걸치기 (시안 design/today-ring A)
- 앱: .cell.today 에 outline 3px · outline-offset -1px (1px 안쪽 · 2px 바깥, outline 은 칸 overflow 에 안 잘림) · z-index 3 · ::after 테두리는 0. 색 = 칸 채우기 --tdc/--today · 동그라미 --today(오늘 색 고르면 --tdc). 동그라미 모양 달력 grid 좌우 2px 여백(가장자리 날 띠 안 잘리게).
- 위젯: MonthRenderer.drawTodayBand · drawPulse 의 띠 자리 TD_GAP 0.7dp(칸 바탕 끝 1.2dp 에서 2dp 바깥) · 모서리 TD_R 8.5dp.
- 시험 s28 · s94 (outline 으로) · s100 (동그라미 360px 기준 27.5).

## v0.173 숨쉬기 빛 = 새 오늘 띠 자리 · 근무 패턴 위 칸 그라데이션 뺌
- glowSvg: g=-0.5 (띠 가운데 줄 = 칸 끝 0.5px 바깥) · 크기 = offsetWidth/Height + 1 · 모서리 = 칸 모서리 + 0.5 (동그라미 모양 0).
- 근무 패턴 위 칸(.nphero.nppat): 그라데이션 빼고 흰 카드 · 패턴 칸 .pc 는 연회색(--surface).

## v0.174 가족 탭 "지금" 카드 통일
- 둘째 줄: 다음 근무 뺌 (쉬는 중 · 퇴근 후 · 시간 없는 근무 = 한 줄) · 출근 전 = "오전 7시 시작" · 근무 중 = "오후 7시 끝" (myStatus · memberStatus · 근무표 가족 같게). myStatus.next 에 다음 근무는 남겨 둠.
- 근무 글자 아이콘 .sic.sbd = 둥근 네모(12px). 카드 .nc.fc2 = 세로 flex · 날씨 상자 .mwx 아래 맞춤 · 내 카드 날씨도 회색 상자.

## v0.175 탭을 오갈 때 메모 글자가 다시 잘려 보이던 것
- 원인: render 에서 fitDn(메모 자르기) 다음에 memoLines() 가 실제 칸 높이로 메모 글자 크기(--plf 9→10px)를 다시 정함 → 줄 수가 같으면 다시 안 잘랐고, 0.3초 뒤 calFillLater 가 "맞춤 안 됨"인 보이는 판을 다시 재서 글자가 바뀌어 보였음.
- 고침: memoLines 뒤 줄 수가 같으면 plFit(v) 한 번 더 · calFitMark(v) 로 그린 판에 data-fit=1. 시험용 __wx.fitDnT · stzPanelT. s60 오늘 테두리 검사를 outline 으로.

## v0.176 스티커 정리 (＋ 없앰 · 떼기) · 가족 메모 띠 · 팁 · 위젯 배경화면 · 작은 위젯 또렷하게
- ＋ 기능 없앰: 고르는 창 ＋ 버튼 · 설정 "＋ 로 붙인 스티커" 칸 · 바꾸기 목록 ＋ 줄(stPlusRow → '') 뺌. 옛 ＋ 스티커(one)는 그 날짜에 그대로 보임 · ⋯ 에서 떼기.
- 스티커는 하나: stDraftOf 는 이미 쓰는 스티커면 지금 값(횟수 · 알림 · 활동 · 가족)으로 시작 · stampRegSave 는 복사본(stOneLike) 없이 그 스티커에 날짜를 더하고 바꾼 값도 그 스티커에. 약을 다른 색으로 고르면 빈 칸(empty)에 새 약("약 2") · 빈 칸 없으면 안내.
- s89 "옆 판도 스티커 크기 붙음"은 원래부터 가끔 실패 (밀기 타이밍).
- 칸 바꾸기 · 비우기(stFillSlot · stSlotClear): 쓰던 스티커는 stEndFromToday (one · 반복은 어제까지 · 앞으로 날짜 · 알림 뺌 · 지난 기록 그대로) — 숨은 반복이 남지 않게.
- ⋯ 메뉴: 이날만 떼기(sd-skip) · 이날부터 떼기(sd-end) · 그날 스티커 2개 이상이면 "이날 스티커 전부 떼기"(sd-all, 되돌리기) · 반복 · 알림 고치기 · 닫기.
- 설정 › 스티커 🔔 뺌. 날짜 창 가족 메모 띠(family-warning-box) 뺌 (topPart 의 \x01 나눔 표시는 그대로).
- 이럴 땐 이렇게: 쉬는 날에만 · 약 · 학원 날씨 · 반복 그만 · 안 붙는 이유 팁을 "스티커 붙이기 / ⋯ 떼기" 말로 · 출퇴근 시간 · 날씨 이름.
- 위젯: 설정 화면에 있는 동안만 AndroidBridge.showWallpaper(true) (MainActivity: FLAG_SHOW_WALLPAPER · 창 · 웹뷰 바탕 투명) + html.wpshow (앱 화면 숨김 · 페이지 투명). 나가면 false. 작은 위젯(Widgets.drawWith)도 bg vivid 를 직접 읽음 (전에는 한 달 위젯을 먼저 그렸을 때만).
- v0.175 고침: calFitMark 는 보이는 달만 (옆 달 스티커 크기가 안 붙던 것).
- 시험: s104 새로 · s1 s8 s20 s44 s48(새 규칙으로 다시 씀) s49 s102 고침.

## v0.177 스티커 ⋯ 메뉴 글 · 아이콘 통일
- 스티커 떼기(🧽 → eraser) · 이날부터 떼기(📆 → calendar-x, 반복만) · 스티커 전부 떼기(🗑, 2개 이상) · 반복 · 알림 고치기 · 닫기. POP_ICO 에 🧽 · 📆 추가 (⏭ · ⏹ 은 아이콘 칸 없이 글자로 보였음).

## v0.178 스티커 ⋯ 메뉴 위쪽 = 실제 스티커 그림
- sd-more 팝업 머리줄 .sdmh: 스티커 그림 칸(.sdi · 약은 pillSvg 색 · 모양) + 이름(굵게) + 날짜(작게).

## v0.179 여러 번 스티커 = 막대 + 튕기는 모션 (시안 design/stk-bar)
- stampDayHtml: N>1 이면 .sdpg (.sdbar 막대 · .sdcnt "1/3" · .sdok ✓). 약은 막대 색 = 약 색(--dc). 다 차면 .full = 초록 + ✓ 튀어나옴.
- sd-tap: sdAnim={id,k,from} 로 다시 그릴 때 막대를 전 값에서 시작 → 두 프레임 뒤 data-to 로 (cubic-bezier(.34,1.75,.5,1) 넘쳤다 돌아옴). 동작 줄이기면 transition 없음.
- 시험 s102 (막대 · 1/2 · full) 고침.

## v0.180 스티커 버튼 통일 (시안 design/stk-bar/v3)
- 1번 · 여러 번 모두 .sdbar 두꺼운 알약(70×26) · 1번은 .one(채움 transition 없음) · 옆 .sdcnt (1번은 빈 칸 → 줄 가지런). 체크 동그라미(.sdck) · 바깥 ✓ 없앰.
- sd-tap → sdAnim 으로 전 값에서 그리고 sdBarGo: 누르면 .press(줄었다 커짐) · 여러 번은 칸만큼 튕기며 참 → 다 차면 0.48초 뒤 .full(초록 · 약은 약 색 --fc) + 한 번 더 .press + 안에 ✓. 동작 줄이기면 바로.
- 시험 s102 고침.

## v0.181 스티커 버튼 부드럽게
- sd-tap: 누른 줄의 .sdbar 만 바로 바꿈(sdBarSet · 숫자 · done) → 창 · 달력 다시 그리기(render · stampReopen · stkPop)는 0.7초 뒤(sdLaterT). 줄이 없으면 예전처럼 바로.
- 채움은 width 대신 transform(sdTx: 채움 막대 = 바 폭 1.4배 · 왼쪽 -40% → 넘쳤다 돌아올 때 왼쪽이 안 빔) · will-change. sdAnim · sdBarGo 안 씀.
- 시험 s102 (transform 값) 고침.

## v0.182 덜 찬 칸도 타원
- sdPct(v,N): 0 → 0 · 다 참 → 100 · 그 사이 25% + 75%×v/N (1/3 = 50% · 2/3 = 75% · 1/2 = 63%). 시험 s102 값 고침.

## v0.183 덜 찬 칸 = 작은 타원
- sdPct: 10% + 90%×v/N (1/3 = 40% · 2/3 = 70% · 1/2 = 55%). 시험 s102 값 고침.

## v0.184 위젯 빨간 점(근무 바꾼 날) = 앱처럼 근무 글자 바로 왼쪽
- MonthRenderer: 칸 왼쪽 끝 고정 → 근무 글자 폭(동그라미 모양은 동그라미 반지름 circR · 요청 링이 있으면 링) 바로 왼쪽 4.2dp · 칸 끝(pad + 2.2dp)보다 밖으로는 안 감.

## v0.185 켠 직후 첫 달 넘기기 덜 씹히게
- 켠 직후 타이머를 뒤로: widgetSync 150 → 1600ms · a11yPass 300 → 2200ms · introNotice 800 → 1400ms (날씨 2500ms 그대로).
- 확인한 것: 앞뒤 한 달은 원래 처음부터 같이 그림(renderCal) · 넘기기 시작하면 오늘 빛은 이미 바로 멈춤. __refresh(앱으로 돌아올 때)는 시험이 바로 결과를 보므로 그대로.

## v0.186 시작 기록 (켠 뒤 12초 · 첫 넘기기 씹힘 찾기용)
- window.__perf (PF): longtask · rAF 틈 > 40ms(화면 멈춤) · 손가락 닿음/뗌 · 오래 걸린 함수(pfWrap: render · fitDn · calFill · stzWindow · widgetSync · a11yPass · glowFrame · calShiftFast · plFit · memoShift, 8ms 이상).
- 보는 곳: 설정 › 앱 정보 7번 → 개발자 메뉴(Firebase 연결 시험) 맨 위 "시작 기록". 저장 안 함.
- 컴퓨터에서도 켠 뒤 1.5초 동안 옆 달 맞추기(fitDn)가 판마다 60~170ms → 폰에서 첫 넘기기 씹힘의 유력 원인.

## v0.187 켠 직후 넘기기 씹힘 고침 (시작 기록으로 찾음)
- 원인: 가족 동기화 onSnapshot 8곳이 켠 직후 차례로 들어오며 famRefreshUi → render(달력 통째로 다시 그리기 0.2초)를 0.3초마다 → 넘기는 중 판이 새로 그려짐.
- famRefreshUi = 0.25초 모아서 한 번(famRefreshUiNow) · 달력 탭에서 손가락 · 넘김 움직임 · 0.3초 안 스크롤이면 끝날 때까지 미룸.
- 시작 기록(v0.186)은 그대로 둠 (비교용).

## v0.188 스티커 그 날만 횟수 · 활동 위치 기억 · 위젯 업무 메모 전부 · 위젯 설정 배경화면 고침 · 다시 그리기 빨라짐
- 스티커: 붙일 땐 늘 1번부터(stDraftOf times = edit 일 때만 스티커 값). 이미 쓰는 스티커를 이날 붙이면 고른 횟수는 그 날만(s.tday[k] · stDayN) · 스티커 횟수는 그대로. stView · 알림 · 약 기록 보존 · 자동 완료 · stkDone 이 stDayN 사용.
- 활동(학원 · 동아리) 위치: 처음 펼칠 때 직전에 고른 위치(S.stamps.lastActR).
- 위젯: 업무 메모 글(wlr.s)을 위젯이 넘겨 보는 모든 날에 보냄(전엔 6일 전 ~ 13일 뒤만).
- 위젯 설정 배경화면: #app 바탕도 투명 (빠져 있었음).
- render: 보이는 달만 바로 fitDn · memoShift · plFit (옆 달은 calFillLater). 컴퓨터 기준 다시 그리기 300 → 150ms.
- 시험 s95 s104 s67 고침.

## v0.218 날짜 창 닫을 때 1~7일 · 말일 칸도 톡
- 옆 달 판에 같은 날짜(흐린 칸)가 있어 첫 번째(화면 밖) 칸을 톡 했음 → sheetClose onfinish 에서 보이는 칸을 골라 톡. (v0.217 '다시 그린 뒤 톡'은 원인이 아니라 되돌림)

## v0.216 삼성 줄은 배터리 제한 없음이 꺼져 있을 때만
- 배터리 제한 없음(배터리 최적화 제외)이 켜진 앱은 삼성 "자동 절전 예외 앱" 고르기 목록에 아예 안 나옴(이미 절전 대상 아님 · 사용자 폰에서 확인) → `issues.includes('batt')` 일 때만 줄을 보임.

## v0.215 도움 · 정보에 "알람이 잘 울리게" 줄
- 전엔 꺼진 권한이 있을 때(설정 첫 화면 경고)만 들어갈 수 있어서, 다 켜지면 삼성 바로가기를 못 찾았음 → 도움 · 정보 맨 위에 늘 둠(`info-perm` · 뒤로 = 도움 · 정보).

## v0.214 정리: 파일 나누기 · 시험 정리 · 팁 · 삼성 바로가기
- **앱 화면 파일 구조가 바뀜**: `assets/index.html`(101줄 · 뼈대 + 맨 앞 오류 안전망 스크립트) · `assets/app.css`(모양) · `assets/js/wxcore.js`(날씨 계산 · 서버 `firebase/functions/lib/wxcore.js` 와 같아야 함 · 첫 줄 `/*WXCORE*/`) · `assets/js/app.js`(앱 동작 전부).
  - 순서: config.js → js/wxcore.js → js/app.js (같은 전역 · 순서 바꾸면 안 됨). 문법 검사는 `node --check app/src/main/assets/js/*.js`.
  - 서버 시험(wx.test.mjs) · s46 · 가족 E2E(.css 형식 추가)가 새 파일을 읽게 고침.
- 시험: 옛 화면 이름에 맞춰 t9 · t14 · t13 · s46 · s64 · s65 · s12 고침 · 판정 없는 보기용 9개(s4 s5 s9 s10 s11 s13 s16 s17 t6)는 `tests/phone/look/` · s89 기다림. 지금 전체 시험(99개) 다 통과.
- 이럴 땐 이렇게: "메모 · 포스트잇 · 업무 메모는 뭐가 달라요?" 팁.
- 알람이 잘 울리게: 삼성 폰에서만 "삼성: 자동 절전 예외 앱에 넣기" · 누르면 `openSettings('samsung_sleep')`(삼성 배터리 화면 → 안 되면 배터리 최적화 목록).

## 백업: 정리 전 마지막 버전 = v0.213 (커밋 5449252 · claude/continue-sin-app-dev-x8ou0c)
- 되돌리려면: `git checkout 5449252 -- app/src/main/assets/index.html` (앱 화면 전체가 이 파일 하나)

## v0.213 폭 · 자리 옮김 · 줄 이름 스르르 · 이름 칸
- `wSnap`/`wPlay`(hmSnap/hmPlay 안): `.sh-pill,.npv,.pv,.tbtn,.mval` 글자가 바뀌면 폭 옛→새 · 글자 살짝 바뀜 (짝 = 첫 클래스+data-act · tapx 무시). 늘어나는 동안 두 줄 되지 않게 nowrap.
- hmPlay: 옛 높이로 잠근 뒤 한 박자(rAF) 뒤 재서 애니메이션 · 자리가 옮겨진 칸은 translateY 로 미끄러짐(위 칸이 없어질 때) · 알람 탭(`.alw>*`)에도 적용.
- 줄 이름(`.prow .pl2`)이 아래 작은 글이 생겨 위아래로 옮겨지면 스르르 · 짝은 줄 이름 글자.
- 이름 칸(`.np .prow input.inl` — 알람 이름 · 근무 이름): 안쪽 여백 · 포커스 파란 테두리.
- 조사 도구 3: 위치 · 높이 · 좌우 폭까지 프레임마다 (scratch mj.js · mj2.js).

## v0.212 뒤로가기 · 날짜 창 높이 스르르 · 근무 화살표
- `__onBack`: 날짜 창 위에 페이지(자세히 등)가 떠 있으면(가운데 점의 elementFromPoint 가 #page) 페이지부터 닫음.
- `hmSnap`/`hmPlay`: 다시 그리기 전 칸 높이를 (className+순번)으로 적고 그린 뒤 같은 칸은 높이 이어 붙이고 새 칸은 0에서 펼침 · openSheet(같은 날짜 다시 그릴 때 `.dsbody>*`) · openPage(`.pg-b>*`).
- 근무 알약 화살표: ▾ → 동그라미 안 ⌄ (svg) · 펼치면 180° 돌아 ⌃.
- 조사 도구 2(scratch mj.js): 프레임마다 칸 위치 · 높이를 재서 중간 값 없이 바뀐 것(툭)을 잡음. 다크 모드 12화면 확인.
- 시험: s43 취소 뒤 기다림 900ms.

## v0.211 포스트잇 모션
- 포스트잇 창(`.pi-view` · `.pi-ed`)은 openPop 을 안 거쳐 모션이 없었음 → MO.popOpen/popClose 가 `.menu,.pi-ed,.pi-view,.wlp` 를 다 받음 · openPiView · renderPiEd(처음) 에서 popOpen · piClose 는 closePop 으로 (누른 자리로 들어감).
- renderPiEd 다시 그릴 때: 높이 바뀌면 스르르 · 나만/가족 표시 톡 · 색 바뀌면 살짝 흔들림. 포스트잇 벽 ‹ › 는 그 쪽에서 밀려 옴.

## v0.210 페이지 카드 높이 스르르 · 메모 그 자리에서 고치기
- `openPage` 같은 페이지 다시 그리기: `.pg-b>*` 높이를 재 두고 바뀐 카드는 height 애니메이션 (요일 보기 · 시간 줄 알림 · 칸 추가 …). 전수 조사 도구는 '모션이 하나도 없는 곳'만 잡아서 이런 높이 점프를 놓쳤음.
- 날짜 창 메모를 누르면 그 줄이 입력칸(`.mcard.medit` · `#memoInput` 이 그 안으로 · ✓ = memo-send · 복사 · 취소) · 아래 새 메모 칸은 흐리게(disabled). 펼침 `medOpenFx` · 접힘 `medCloseFx` · 끝나면 그 줄 반짝 `medDoneFx`.
- 시험: s43(고치는 칸 선택자) · s7(고치기 취소 뒤 체크).

## v0.209 모션 묶음 (메모 칸 · 전수 조사 · 진동 빼기)
- 메모 카드: 자세히 = ⊕ 아이콘(`.mdet2.mplus`) · 전송 버튼은 글을 쓰면 색이 아래에서 차오름(`.send::before`) · 쓰는 중에도 "나만 보는 메모" 글씨가 칸 위에 작게 남음(`.flab`) · 가족 날짜 창 입력칸도 같음.
- 키보드: 날짜 창 입력칸 포커스 전 스크롤 자리 기억(`kbTop`) → 화면이 줄며 밀린 만큼 내용을 transform 으로 되돌려 미끄러뜨림(`kbSmooth`).
- 메모 자세히 시간 줄: 없을 땐 ＋(✕ 아이콘 45° · `.xbtn.tplus`) → 돌며 ✕ · 시간 톡 · 알림 줄 펼침 / ✕ 누르면 반대로 접힌 뒤 다시 그림.
- 전수 조사(design/motion-audit2 · 자동으로 425개 버튼): 고친 것 = 유찬 · 가족 달력 ‹ › · 다른 달 칸(`vcMove` 가 옆 판으로 smooth scroll · 연달아 누르면 `vcPend`) · 날짜 창 위 ‹ › 내용 밀림 · 페이지 안 다른 페이지로 갈 때 옆에서 밀림(`openPage` 의 mode 바뀜 · 뒤로는 `pgBackNav`) · 알람 스위치(다시 그려도 click 에서 받아 모션) · 패턴 칸 추가/빼기 · 바로 보이는 개수(npseg 로) · 메모 고치는 중 줄 · 가족 주/달 · 찾기 결과 차례로. 내 달력 ‹ › · 고르기 알약은 원래 됨(조사 도구가 못 잡은 것).
- 업무 메모: 메모 자세히에서 만들면 그 화면 위에 일지 창(`wlFromMd`) · 닫으면 자세히 다시 그림.
- 진동: `buzz()` 비움 · 꾹 누르기 진동 3곳 뺌 (알람 진동은 AlarmService 그대로).
- 시험: s68 · s84 기다림 늘림 (달 넘김이 미끄러지는 동안).

## v0.208 작은 창 판 불투명 · 날씨 카드 처음부터
- 작은 창(팝업) 모핑: 판(.menu)이 처음 10% 안에 불투명 · 내용(showKids)은 230ms 뒤 (반투명 판 너머 뒤 글자가 겹쳐 번쩍이던 것 · 날씨 큰 창에서 보임).
- 날짜 창 가볍게 열기(dsLite)는 날짜 띠 7칸만 — 날씨 카드는 처음부터 넣음 (빈 자리 .wxph 였다가 나중에 뜨며 메모 카드가 밀리던 것).

## v0.207 날짜 창 도착 직후 뒤 작업 미룸
- 폰 기록: 껍데기 모션 중 멈춤은 없어짐. 도착 직후 가족 새로 받기(famRefreshUiNow → render 103ms)가 끼어 첫 화면이 158ms 늦게 뜸.
- `uiQuiet()`: 여는 껍데기가 있거나 도착(`shellArriveT`) 뒤 1.2초 안이면 남은 ms. famRefreshUiNow · 켤 때 widgetSync(1.6초) · calFillLater 가 이걸 보고 미룸.
- render 미룸은 여는 껍데기만(`.dshell:not(.cls)`) — 닫는 껍데기(.cls)는 안 미룸 (칠하기 버튼 등 바로 그려야 함 · s6 · s77 · t11).

## v0.206 껍데기 도는 동안 render 미룸 · 오늘로 부드럽게 · 기록 복사
- 폰 기록: 켠 직후 날짜를 열면 widgetSync(1.6초 타이머) 안 render 97ms 가 껍데기 모션 도중 끼어듦 → `render()` 첫 줄: `.dshell` 이 1.5초 안에 만들어진 게 있으면 120ms 뒤로 미룸.
- 제목 눌러 오늘로(`dftPass`·`dftBusy`): 지금 띠를 오늘까지 굴리며 내용은 밀려 나감 → 멈춘 뒤 진짜 goDay → 내용 밀려 들어옴. 띠에 없는 먼 날은 바로.
- 개발자 메뉴 시작 기록 '복사' 버튼 (`pf-copy` · `pfText`).

## v0.205 넘긴 뒤 첫 탭 먹힘 · 멈춘 이유 기록
- 날짜 창을 옆으로 넘긴 직후 첫 탭에 click 이 안 생김(브라우저가 끌기 멈추기로 씀) → 넘기는 중(`dsw.on`) touchmove 를 preventDefault (passive:false).
- 시작 기록: `long-animation-frame` 으로 50ms 넘는 프레임마다 '↳ 멈춘 이유: 계산 n (함수) · 배치 n · 그 밖 n'. 기록 화면은 시간순 정렬.

## v0.204 날짜 창: 껍데기가 다 커진 뒤 진짜 창 만들기
- 폰 기록: 껍데기가 움직이는 도중 진짜 창을 처음 칠하는 데 92ms 멈춤 (앱 작업 이름 없음 = 칠하기).
- 이제 껍데기 도착(onfinish) → 진짜 창 만들기(껍데기가 덮음) → 두 프레임 뒤 껍데기 걷음 → 띠 · 날씨 채우기. 그 사이 달력이 다시 그려졌으면 같은 날 칸을 다시 찾음.
- 시험: 칸을 누른 뒤 창이 약 0.4초 뒤에 열림 → s35 기다림 600ms.

## v0.203 날짜 창 여는 동안 옆 달 그리기 미룸
- 폰 기록: 앱 켜고 3초 안에 날짜를 누르면 뒤에서 하던 옆 달 맞추기(fitDn 111ms)가 껍데기 모션 도중 끼어들어 멈춤.
- `calFillLater`: `.dshell` · `#sheet.open` · `#pop.open` 이 있으면 400ms 뒤로 미룸.

## v0.202 날짜 창 가볍게 열기 · 큰 날씨 창 미리 만들기 · 폰 기록
- 폰: 닫기는 괜찮고 열기만 버벅 → 열 때 진짜 창 만드는 일이 무거움 (메모 창 같은 작은 창은 껍데기로 안 끊김)
- dsLite: 껍데기가 움직이는 동안엔 날짜 띠 7칸(dsOffs) · 내 날씨 카드는 같은 높이 빈 자리(.wxph · 높이 wxPhH 기억) → 껍데기 도착 후 dsFill 이 61칸 · 날씨 카드 채움
- dsFill 뒤 큰 날씨 창 html 을 미리 만들어 둠(wxPre · 1분) → wxOpenDay 가 씀
- 개발자 메뉴 "시작 기록": 날짜 창을 누르면 3초 동안 기록(pfKick) — 날짜 창 누름 · 날짜 창 만들기(ms) · 껍데기 도착 · 날짜 띠 · 날씨 채우기(ms) · 화면 멈춤

## v0.201 껍데기 멈춤 고침
- 껍데기 · 작은 창 모션에 색(backgroundColor) · 둥글기(borderRadius)까지 넣어서 폰이 따로(합성 스레드) 못 돌리고 진짜 창 만드는 동안 같이 멈춤 → transform · opacity 만 (색 · 둥글기는 고정)

## v0.200 날짜 창 = 껍데기 방식 (비교 design/shell-cmp)
- 칸을 누르면(.cell day · vc-day · man-day · 칸 안 다른 버튼 말고 칸 자체) 같은 모양의 빈 판(.dshell)이 먼저 커지고, 16ms 뒤 진짜 창을 만들어 그 아래 opacity 0.01 로 깔아 둠(폰이 미리 칠함) → 도착하면 껍데기만 걷어냄
- 닫을 땐 진짜 창은 바로 치우고 껍데기만 그 칸으로 · 달력은 바뀔 때마다 이미 다시 그려져 있음 → closeSheet 는 dataRev !== renderRev 일 때만 render (tidyMemos 로 바뀐 게 없으면 save 도 안 함)
- 6배 느리게 한 컴퓨터에서 최대 멈춤: 열기 0.03초 · 닫기 0.07초 (v0.199: 0.13 · 0.23)

## v0.199 창 열고 닫기 버벅임 다시 · ⋯ 안 눌리던 것
- 원인 1: 창이 커질 때 안 내용을 숨긴 채 빈 흰 상자가 커져서 끊겨 보임 → 처음엔 투명하게 겹쳐 나타나며(opacity 0→1 앞 35%) 내용도 바로 · 닫을 땐 흐려지며 그 자리로
- 원인 2: 작은 버튼 누르는 자리 넓히기(a11yPass)가 창이 작게 줄어든 중간에 재서 줄 전체에 넓힌 판(tapx ::after)을 씌움 → 안쪽 ⋯ 를 덮음 · offsetWidth 로 실제 크기 · 안에 다른 버튼이 있는 줄은 안 넓힘 (시험 s15 · s104)
- 탭 바꿀 때 하얀 달력: 완전 투명에서 시작하지 않음(0.55) · 달력 탭은 카드 차례 효과 없음

## v0.198 화면 점검 1~7 · 탭 모션 (design/audit · tab-motion)
- 탭 바꿀 때: MO.tabIn — 누른 쪽에서 #view · #top 이 살짝 밀려 들어오고 카드들이 차례로
- 메모 메뉴: 고치기 → 복사 → 📅 날짜 옮기기(mm-movepick: 날짜 고르면 바로 옮김 · 되돌리기 · tpkOk 의 mmDateH) → 🔒/♥ 바꾸기 → 삭제 · 🔒 ♥ 도 아이콘 칸 (POP_ICO lock · heart)
- 메모 고치는 중 "복사 · 취소" = 작은 알약 버튼
- D-day 추가 · 근무타입 편집 왼쪽 "뒤로/취소" 글자 → ‹ (.shbk)
- 유찬 날짜 창: 내 날짜 창과 같은 짜임(.dsbody) · 일정 = 알약(.shsec · man-fold 는 shMorph) · 여러 날 칠하기 · 일정 패턴 = paint-btn · 스티커 카드(.mansec · 설정) · 메모 = 내 것과 같은 입력칸 + ↑ 동그라미 · 시험 s78 · s91 고침
- 유찬 스티커 옵션: 다른 그림으로 · 그만하기 · 지우기 = 아이콘 줄(npRow)
- 휴무일 · 기념일: 줄은 아이콘 · 이름 · 날짜 · 휴무/메모만 · 알림만 → 누르면 작은 창(compMenu: 휴무/메모만 · 아이콘 · 알림 · 삭제)

## v0.197 모션 버벅임 고침 · 오늘로 부드럽게 · 요일 톡
- 창 모션은 transform 만 (clip-path 는 큰 화면을 매 프레임 다시 그려서 버벅) · 잰 다음 프레임에 시작(부르는 쪽이 class 를 더 붙여 크기가 바뀌는 창: 날씨 창) · 첫 프레임은 opacity 0 (visibility 숨김은 글자 읽기 시험 깨짐)
- 날짜 창 닫기: 쏙 들어간 뒤 render (닫는 순간 달력 전체를 다시 그려 하얀 달력 · 버벅)
- 닫히는 작은 창(#pop.ghost)은 inert + pointer-events none (그 사이 누른 게 옛 창에 걸리던 것)
- 날짜 창 제목 눌러 오늘로: 날짜 띠가 오늘까지 굴러가고 내용이 그쪽에서 밀려 들어옴
- 요일 · 색 고르기(sr-day · sr-wt · md-col 등) 누르면 톡
- 위 창 머리 저장/확인 알약 찌그러짐 고침 (white-space nowrap)

## v0.196 모션 묶음 (시안 design/seg-toggle · nav-fill · save-btn · memo-scope · day-morph · pop-morph · motion-more · toast)
- 원칙: 화면 배치는 한 번만 바꾸고 겉모습(clip-path · transform · opacity)만 움직임 → 폰에서 버벅이지 않게 · 동작 줄이기 설정이면 모두 끔
- 고르기(.npseg): 모양 그대로 · 흰 알약(.npind)이 늘어나며 미끄러짐 (누른 뒤 새로 그려도 같은 data-act 줄을 찾아 이어서) · 스위치(.sw): 물방울 (::after 를 WAAPI pseudoElement)
- 하단 탭: MO.navSet — 아이콘(.nvi)이 떠오르며 회색으로 차오름(.fl 복사본 clip) · 그림자(.nsh)
- 버튼 누름: .btn · .send · .pg-h .ok · .sh-head .ok 등 누르면 작아졌다 떼면 튕김
- 위 오른쪽 저장 = 알약(.pg-h .ok · .sh-head .ok) · 메모 창은 글이 없으면 회색(.off) · 가족 고치기 · 일정 패턴 · D-day · 근무타입도 알약
- 메모 창: 나만/가족에게를 맨 위로 · 바꾸면 줄들이 FLIP 으로 미끄러져 자리 잡음 (MO.flip)
- 메모 입력칸 · 전송 버튼 48 · 전송 = ↑ 동그라미 · 글이 없으면 회색(:placeholder-shown)
- 날짜 창: 누른 날짜 칸에서 clip-path 로 커짐(MO.sheetOpen) · 닫으면 그 칸으로(.closing 동안 보이게 둠) · 칸이 안 보이면 아래로
- 작은 창(#pop): 누른 자리에서 커지고 그 자리로 · 누른 자리가 없으면 아래에서 올라오고 아래로 · 창→창은 내용만 바뀜 · 닫힐 때 옛 #pop 은 .ghost 로 잠깐 남고 새 빈 #pop 을 앞에 끼움
- 확인 창(confirm · alert 44곳): MainActivity.sheetAsk — 앱 모양 아래 카드 · 아래에서 올라옴(anim/sheet_up · sheet_down) · 지우기 같은 말이면 빨간 버튼
- 위젯 날짜 창(WidgetDayActivity): SheetAnim 으로 아래에서 올라옴
- 할 일 체크 · 근무 동그라미 · 색 점: 톡 튐 · 체크는 초록 물결 · 빨간 배지: 숫자 바뀌면 톡 · 날짜 줄: 고른 날 테두리가 미끄러짐(.dsghost)
- 알림 띠(#toast): 위에서 펼쳐지듯(Flip Down) · 떠 있는 동안 새 알림이 오면 앞을 덮고 기존 것은 뒤로(.tghost) · 위로 접히며 사라짐
- 남은 건수: 100건 넘으면 "99+건" (famRemN)

## v0.195 근무 펼치기 모션 다시 (시안 design/shift-morph/v1)
- 렉 원인: v0.194 는 카드 높이를 매 순간 바꿔서 화면 배치를 계속 다시 계산 → 이번엔 배치는 한 번만 바꾸고 겉모습만 움직임
- shMorph(sec,open,apply): 뒤 판(.shghost)이 알약 자리에서 카드 자리로 clip-path 로 커짐 · 카드 바탕은 그동안 투명 · 안의 줄 차례로 나타남 · 아래 카드들은 translateY 로 미끄러짐 · 접기는 반대 (닫힌 자리는 .mrph-m 으로 잠깐 숨겨 잼)

## v0.194 근무 펼치기 모션 · 요청 글 · 가족 달력 메모 위치
- shMorph(sec,open,done): 알약 버튼 자리(오른쪽 위)에서 카드가 높이 · clip-path 로 커지며 내려오고 안의 줄이 차례로 나타남 · 접기는 반대 (.mrph 동안 grid 전환 끔) · 내 날짜 창 shift-tog(누른 창만) · 가족 날짜 창 vc-rq
- vc-want: vcAskLine 으로 "교육 → 주간으로 바꿔 달라고 할게요" 줄도 바뀜 (같은 근무면 숨김) · 시험 s83
- 가족 달력(vcGrid) 그릴 때도 memoShift (모양 조정 메모 위치가 보기만 폰에도) · 시험 s83

## v0.193 위젯 진하기 = 바탕만
- 한 달 · 오늘 · 주 위젯 모두 alphaF = 1 (칸 색 · 글자 · 메모는 진하기와 상관없이 그대로) · 진하기는 위젯 바탕만

## v0.192 설정 › 위젯 = 바로 폰 위젯 설정 화면
- more-widget: openWidgetStyle 있으면 앱 페이지 없이 바로 엶 · 없으면(옛 앱 · 시험) 앱 페이지

## v0.191 위젯 설정 = 삼성식 폰 화면 (WidgetStyleActivity)
- 앱 위젯 설정 미리보기 "배경화면에서 보기" 누르면 → 폰 화면(테마 Theme.ShiftCal.Wallpaper = windowShowWallpaper) · 위: 실제 배경화면 위 한 달 위젯(홈에 놓인 위젯 크기 · MonthRenderer.previewBitmap) · 아래 카드: 진하기 · 밝게/어둡게/폰 설정 · 기본/또렷하게 · 칸 채우기/동그라미 · 취소 / 저장
- 저장 → MainActivity widgetStyle(결과) → JS window.__wgStyle({theme,alpha,bg,look}) → S.widget 저장 · 위젯 새로 그림
- 웹 화면 투명 방식(wpShow) 은 안 씀 (openPage 에서 뺌 · 코틀린 showWallpaper 는 남겨 둠) · 시험 s104

## v0.190 색 고르기 창 다듬기 (시안 design/color/v2)
- 미리보기 동그라미 뺌 → "이 색으로" 버튼(#cpOk)이 고른 색 · 밝으면(휘도>150) 글자 검정(.lt) · 높이 44
- 여백 12px 통일 · 색판 130px · 밝기 막대 14px · 손잡이 24/22px · 시험 s103 "버튼 = 고른 색"

## v0.189 위젯 설정 배경화면 잔상 · 렉
- MainActivity.showWallpaper: 켤 때 window.setFormat(TRANSLUCENT) (불투명 형식이면 매번 안 지워서 지나간 화면이 겹쳐 남음) · 끌 때 OPAQUE · 켠 뒤 invalidate.
- wpShow: 화면이 다 들어온 뒤(0.26초) 켬 · 끌 땐 바로.
- 미리보기: MonthRenderer.preview 밀도 2배까지만(그림 작게) · wgPrev 는 밀고 있는 동안 0.15초에 한 번(throttle) + 끝난 뒤 한 번.

## v0.219 구글 예전 연결 풀기
- 구글 연결에서 `credential-already-in-use` → `gUnlinkOld` 확인 창 → 서버 함수 `gunlink`(POST · Authorization: Bearer 파이어베이스 토큰 · body {g: 구글 idToken, force}) → 다시 linkWithCredential.
- 서버(`firebase/functions/lib/gunlink.js`): 부른 사람 확인 · 구글 토큰 tokeninfo 로 확인(aud 가 프로젝트 번호 516160617216- 로 시작 · 이메일 확인됨) · 예전 번호에서 구글만 뗌(`providersToUnlink`, 지우지 않음). 예전 번호가 가족방에 들어가 있으면 {busy} → 앱이 한 번 더 묻고 force. 시험 `test/gunlink.test.mjs`.
- `famGAcctFix`: 실제로 구글이 붙어 있는데 S.gAcct 가 비어 있으면 이메일 채움 → "구글 계정에 연결됨" 보임.
- **배포 필요: Cloud Shell `deploy --only functions`** (안 하면 버튼을 눌러도 "예전 연결을 풀지 못했어요").
- 참고: tests/family/fam13e 는 이 작업 전에도 `link-invite` 를 못 찾아 실패(옛 시험, 화면이 바뀜).

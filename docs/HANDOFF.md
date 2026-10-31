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

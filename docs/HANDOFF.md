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

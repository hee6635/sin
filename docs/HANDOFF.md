# 새 대화로 이어가기 (v0.82 시점)

- 저장소 `hee6635/sin` · 작업 브랜치 `claude/continue-app-development-o1v8wg` (여기에만 올림). 규칙은 `CLAUDE.md` 참고 (한국어 · 쉬운 말 · "만들어" 할 때만 앱 코드 수정 · 새 기능 제안은 먼저 솔직한 판단).
- 최근 작업: v0.82 = 1/2 배지(웹뷰 최소 글자 8px 때문에 컸음 → 배율로 해결) · 위젯 오늘/월 넘김 부드럽게 · 메모 위치 최대 3. 자세한 건 `docs/TODO.md` 맨 아래.
- 사용자 쪽에서 할 일: Firestore 규칙 배포(`hostSeen`) — 폰 Cloud Shell에서 `git clone -b claude/continue-app-development-o1v8wg https://github.com/hee6635/sin.git` → `cd sin/firebase` → `npx firebase-tools deploy --only firestore:rules --project eonjeswieo-d85e2` (진행 중). 폰이 옛 태블릿 방에 붙어 있으면 "새 초대 코드로 옮기기".
- 폰에서 확인 필요: 위젯 오늘 빛 세기/부드러움, 1/2 배지 크기(너무 작거나 크면 `cbFit` 의 .36 조정).
- 시험: `tests/run-phone.sh`(TESTS=… 로 일부), `scripts/kotlin-check/check.sh`(BASE=1 환경변수), `layout/run-layout.sh`, `layout/run-month-real.sh`.

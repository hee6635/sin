---
name: eonje-release
description: 언제쉬어 앱을 "만들어 / 만들고 올려" 한 뒤 올리기 전 점검과 올리기 순서. 관련 시험 · 옛 저장 데이터 시험 · 코틀린 확인 · 버전 · 문서 · 두 브랜치에 올리기 · 5분 뒤 빌드 확인. 앱 코드(app/)를 고쳐서 올릴 때마다 쓴다.
---

# 언제쉬어 올리기 전 점검

사용자가 "만들어"(만들고 올려 · 만들도 올려 포함)라고 해서 app/ 코드를 고쳤을 때, 올리기 전에 이 순서대로 한다.
"만들어" 없이 질문 · 기획만 한 경우엔 쓰지 않는다 (CLAUDE.md: 코드는 "만들어" 때만).

## 1. 시험
- 이번에 바뀐 동작을 확인하는 새 시험을 `tests/phone/sNN.js` 로 만든다 (다음 번호 · 맨 위 줄에 `// v0.xxx: 무엇` 주석). 모양은 가까운 s 시험을 본떠서 `mkT` · `boot` · `T(...)` · `T.sum()`.
- 새 시험 + 바뀐 화면을 건드리는 옛 시험을 돌린다:
  `TESTS="s93 s90 ..." TMO=300 bash tests/run-phone.sh`
  - 2분 넘을 것 같으면 `run_in_background` 로 돌리고 끝날 때까지 기다린다 (sleep 체인 금지).
  - 어느 옛 시험이 관련 있는지: `grep -ln "바뀐 함수/클래스/글자" tests/phone/*.js`.
  - 출력이 `== s17:` 처럼 비어 있으면 화면만 찍는 시험일 수 있음 → 고치기 전 코드(`git stash`)로도 같은지 확인.
  - s46 은 알려진 들쭉날쭉 시험. s42 는 혼자 `TESTS=s42 TMO=290`.
- 큰 작업이면 옛 저장 데이터 시험을 꼭 돌린다: `TESTS="old s42" TMO=290 bash tests/run-phone.sh` (normalize 가 실패하면 기존 사용자가 데이터를 못 읽음).
- 소수 크기 확인은 `getBoundingClientRect` (clientWidth 는 정수라 폰과 다름).

## 2. 코틀린을 고쳤다면
- `BASE=1 bash scripts/kotlin-check/check.sh` → "새로 생긴 오류" 아래가 비어 있으면 OK.
- 한 줄에 `}` 뒤 다른 문장을 붙이지 않는다 (예전 unresolved reference 원인).

## 3. 스스로 다시 보기
- `git diff` 를 처음부터 끝까지 읽는다: 다크 모드 · 가족/유찬 창(man · vc)에도 같은 변경이 필요한지, 색은 기존 변수(--today · --tdc · --accent)를 맞게 썼는지, 안 쓰는 사람 화면에 늘어난 게 없는지.
- 큰 묶음이면 `/code-review` 를 한 번 돌린다.

## 4. 정리
- 시험이 만든 그림 되돌리기: `git checkout -- tests/phone/b1.png tests/phone/b2.png tests/phone/b3.png tests/phone/z1.png` (바뀐 png 만) · `rm -f tests/phone/l1.png tests/phone/g_360.png tests/phone/g_412.png`.
- 버전: `app/build.gradle.kts` 의 versionCode +1 · versionName +0.001.
- `docs/HANDOFF.md` 끝에 `## v0.xxx (덧붙임)` — 새 함수 · 구조 · 시험 번호.
- `docs/TODO.md` 에서 만든 항목을 `"만들어" 대기` → `✅ v0.xxx` 로.

## 5. 올리기
- 커밋 제목: `v0.xxx: 바뀐 것 · 바뀐 것` (쉬운 한국어), 본문에 `- ` 줄로 요약 + 시험 번호.
- 두 브랜치 모두:
  `git push -u origin HEAD:claude/continue-sin-app-dev-x8ou0c`
  `git push origin HEAD:claude/continue-app-development-o1v8wg`
  - 두 번째가 rejected(다른 세션이 먼저 올림)면: 그 브랜치를 받아 임시 브랜치에서 merge 하고 그 브랜치에만 올린다. 강제 푸시 금지.
- design/ · docs/ · data/ · firebase/ · scripts/ · .claude/ 만 바뀐 커밋은 빌드가 안 돈다. 그 밖은 APK 빌드가 돈다.

## 6. 빌드 확인
- `send_later` 로 5분 뒤 "v0.xxx 빌드 결과 확인하고 사용자에게 한국어로 알려주기".
- 깨어나면 `mcp__github__actions_list` (list_workflow_runs, hee6635/sin, per_page 3) 로 두 브랜치 "APK 빌드" 결과 확인.
- 실패면 `get_job_logs` 로 원인을 보고 고친 뒤 다시 1번부터.

## 7. 사용자에게 알리기
- 쉬운 한국어, 결과 먼저: 몇 버전 · 바뀐 것 번호 목록 · 시험 결과 · 시험으로 확인 못 한 것(폰에서 봐 달라고).

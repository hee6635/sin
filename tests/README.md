# 시험 (브라우저 · 에뮬레이터)

앱(`app/src/main/assets/index.html`)을 실제 브라우저(Playwright)로 열어 눌러 보는 시험이에요.
APK 빌드(컴파일)는 기능을 확인하지 못해서, 푸시 전에 이 시험을 돌려요.

- `phone/` — 폰 한 대로 하는 시험 (파이어베이스 없이). `lib.js` 가 앱을 켜는 도구(`boot`)와 안드로이드 연결 가짜(`AndroidBridge`)
  - 돌리기: `cd tests/phone && node t10.js` (t10~t14 · t6~t9 · old.js · s*.js, 끝에 `통과 / 실패` 줄)
  - 전부: `bash tests/run-phone.sh`
- `family/` — 가족 세 폰 + 서버(에뮬레이터) 흐름 시험. `firebase` CLI 가 필요해요.
  - 돌리기: `bash tests/family/run1.sh fam5e` (결과는 `/tmp/run_fam5e.out`)
- 서버 규칙 시험: `cd firebase && npx firebase emulators:exec --only firestore --project demo-eonjeswieo "node test/rules.test.mjs"`
- 알림 함수 시험: `node firebase/functions/test/notify.test.mjs`

Playwright 는 `/opt/node22/lib/node_modules/playwright` 에 설치되어 있다고 가정해요.

# 코틀린 검사 도구 (안드로이드 SDK · Gradle 없이)

이 컴퓨터(클라우드 작업 환경)에서는 안드로이드 빌드(Gradle · AGP)를 못 돌려요 (구글 메이븐이 막혀 있어서). 대신:

- `setup.sh` — 코틀린 컴파일러와 안드로이드 프레임워크 jar 를 **메이븐 중앙 저장소**에서 받아 `/tmp/ktcheck/lib` 에 둠 (한 번, 약 20초)
- `check.sh` — `app/src/main/java/...` 의 코틀린을 컴파일해 오류를 보여 줌. `BASE=1 bash check.sh` 는 HEAD 와 비교해 **새로 생긴 오류만**
  - `androidx` · 파이어베이스 · 구글 서비스는 못 받아서 `stubs/` 의 가짜 클래스로 대신해요 (`MainActivity` 가 쓰는 것만).
    그래서 `MainActivity.kt` 의 구글 로그인 · 파이어베이스 부분과 `DriveBackup.kt` · `PushService.kt` 에는 **처음부터 있던 잡음 오류**가 남아요. 나머지 파일은 오류 0개여야 해요.
- `layout/run-layout.sh` — 위젯 칸 배치(`WidgetLayout.kt`, 안드로이드 클래스 없이 숫자만 계산)를 여러 크기로 그림(PNG)으로 만들고, 무작위 4000개로 겹침 · 넘침을 검사
  - 같은 스크립트가 한 달 위젯 배치(`MonthCheck.kt`: 달 줄 수 · `solveMonth` · `monthTop`(스티커 첫 줄 · 둘째 줄) · 맨 윗줄 화살표 위치 `monthArrows` · 근무 동그라미 크기(큰 위젯은 칸 폭의 절반 · 상한 44dp, 폰 크기는 그대로))도 무작위로 검사하고 대표 크기 그림(`month_*.png`)을 만듦
- `layout/run-month-real.sh 위젯데이터.json` — 한 달 위젯의 **진짜 그리기 코드**(`MonthWidget.kt` · `Widgets.kt`)를 컴퓨터(JVM)에서 돌려 그림(PNG)으로 만듦. 안드로이드 그래픽(Canvas · Paint …)만 `layout/shim/` 의 가짜(Java2D)로 대신하므로 그리는 순서 · 자리 계산 · 데이터 읽기는 폰에서 도는 코드 그대로(글꼴이 달라 글자 폭은 조금 다를 수 있음). 위젯 데이터 JSON 은 앱이 만든 것(폰 시험 도구로 `window.AndroidBridge.setWidgetData` 에 넘어온 값)을 파일로 저장해서 넘김. 이번 달 · 앞 달 · 다음 달 · 12달 뒤 · 2달 전 · 가족 달력 · 어둡게 · 여러 크기(큰 위젯 545x561 · 700x640 포함)를 그리고, 위젯 데이터의 `look`("fill" 칸 채우기 · "circle" 동그라미)에 따라 모양이 달라지며(데이터에 요청 링 `rq` · 가족 메모 수 `nf` 가 있으면 같이 그림), 앱을 브라우저에서 돌려 만든 데이터는 `tests/phone/lib.js` 의 `boot` 로 열고 `window.AndroidBridge.setWidgetData` 에 넘어온 문자열을 저장하면 돼요. 위젯 데이터가 덮는 달(`MonthRenderer.covers`)이 java.time 으로 따로 계산한 값과 같은지 · 넘길 수 있는 달 범위도 출력

이 검사는 **컴파일이 되는지**만 확인해요. 실제 폰 동작(위젯 그림 · 알람 · 부팅 뒤 복구)은 폰에서 확인해야 하고,
최종 확인은 GitHub Actions 의 APK 빌드예요.

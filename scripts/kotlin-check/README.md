# 코틀린 검사 도구 (안드로이드 SDK · Gradle 없이)

이 컴퓨터(클라우드 작업 환경)에서는 안드로이드 빌드(Gradle · AGP)를 못 돌려요 (구글 메이븐이 막혀 있어서). 대신:

- `setup.sh` — 코틀린 컴파일러와 안드로이드 프레임워크 jar 를 **메이븐 중앙 저장소**에서 받아 `/tmp/ktcheck/lib` 에 둠 (한 번, 약 20초)
- `check.sh` — `app/src/main/java/...` 의 코틀린을 컴파일해 오류를 보여 줌. `BASE=1 bash check.sh` 는 HEAD 와 비교해 **새로 생긴 오류만**
  - `androidx` · 파이어베이스 · 구글 서비스는 못 받아서 `stubs/` 의 가짜 클래스로 대신해요 (`MainActivity` 가 쓰는 것만).
    그래서 `MainActivity.kt` 의 구글 로그인 · 파이어베이스 부분과 `DriveBackup.kt` · `PushService.kt` 에는 **처음부터 있던 잡음 오류**가 남아요. 나머지 파일은 오류 0개여야 해요.
- `layout/run-layout.sh` — 위젯 칸 배치(`WidgetLayout.kt`, 안드로이드 클래스 없이 숫자만 계산)를 여러 크기로 그림(PNG)으로 만들고, 무작위 4000개로 겹침 · 넘침을 검사

이 검사는 **컴파일이 되는지**만 확인해요. 실제 폰 동작(위젯 그림 · 알람 · 부팅 뒤 복구)은 폰에서 확인해야 하고,
최종 확인은 GitHub Actions 의 APK 빌드예요.

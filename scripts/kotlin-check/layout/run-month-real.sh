#!/bin/bash
# 한 달 위젯의 "진짜 그리기 코드"(MonthWidget.kt · Widgets.kt)를 컴퓨터(JVM)에서 돌려 그림(PNG)으로 확인 + 오류 없이 도는지 검사
#  · 안드로이드 그래픽(Canvas · Paint …)은 shim/ 의 가짜(Java2D)로 대신 → 위치 · 글자 폭은 실제 폰과 조금 다를 수 있음(글꼴이 다름), 그리는 순서 · 자리 계산 · 데이터 읽기는 그대로
#  · 위젯 데이터(JSON)는 앱(index.html)이 만든 것을 파일로 넘겨 줌: bash run-month-real.sh 위젯데이터.json [그림 폴더]
set -e
L=/tmp/ktcheck/lib
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
SRC=$ROOT/app/src/main/java/com/eonjeswieo/app
D=$(cd "$(dirname "$0")" && pwd)
JSON=${1:?"위젯 데이터 JSON 파일 경로"}
OUT=${2:-/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/monthreal}
W=/tmp/ktcheck/mreal; rm -rf $W; mkdir -p $W/out $W/gen $W/shim
CP=$L/kotlin-compiler-embeddable-2.0.21.jar:$L/kotlin-stdlib-2.0.21.jar:$L/kotlin-script-runtime-2.0.21.jar:$L/kotlin-reflect-1.6.10.jar:$L/kotlin-daemon-embeddable-2.0.21.jar:$L/trove4j-1.0.20200330.jar:$L/annotations-13.0.jar:$L/kotlinx-coroutines-core-jvm-1.6.4.jar
ANDROID=$L/android-all-16-robolectric-13921718.jar
python3 - "$SRC" "$W/gen/R.java" <<'PY'
import re,glob,collections,sys
ids=collections.defaultdict(set)
for f in glob.glob(sys.argv[1]+'/*.kt'):
    for m in re.finditer(r'\bR\.(\w+)\.(\w+)',open(f,encoding='utf-8').read()):
        ids[m.group(1)].add(m.group(2))
out=['package com.eonjeswieo.app;','public final class R {']
for k,v in ids.items():
    out.append(f'  public static final class {k} {{')
    for n in sorted(v): out.append(f'    public static final int {n} = 0;')
    out.append('  }')
out.append('}')
open(sys.argv[2],'w').write('\n'.join(out))
PY
javac -cp $ANDROID -d $W/shim $(find $D/shim -name '*.java') 2>&1 | grep -v "^Picked up" || true
# 위젯 그리기에 필요한 것만 (알람 · 구글 로그인 쪽은 빼고) — 더 필요한 파일은 EXTRA="AlarmReceiver.kt ..." 로
FILES="$SRC/WidgetLayout.kt $SRC/Widgets.kt $SRC/MonthWidget.kt $SRC/WidgetDayActivity.kt $SRC/AlarmScheduler.kt $SRC/AlarmReceiver.kt $SRC/AlarmService.kt $SRC/AlarmActivity.kt $SRC/Reminders.kt $D/FakeMain.kt"
EXTRA=${EXTRA:-}
for f in $EXTRA; do FILES="$FILES $SRC/$f"; done
java -Dfile.encoding=UTF-8 -cp $CP org.jetbrains.kotlin.cli.jvm.K2JVMCompiler -no-stdlib -no-reflect -jvm-target 17 -Xjvm-default=all \
  -cp $ANDROID:$L/kotlin-stdlib-2.0.21.jar -d $W/out $FILES $D/MonthRun.kt $W/gen/R.java 2>&1 | grep -v "^Picked up" | grep -E "error|Error" | head -20 || true
mkdir -p "$OUT"
# 가짜 그래픽을 진짜 안드로이드 jar 보다 먼저 읽게 함
java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -Djava.awt.headless=true \
  -cp $W/shim:$W/out:$ANDROID:$L/kotlin-stdlib-2.0.21.jar monthrun.MonthRunKt "$JSON" "$OUT" 2>&1 | grep -v "^Picked up"

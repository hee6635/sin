#!/bin/bash
# 위젯 칸 배치 확인 (컴퓨터에서 JVM 으로): WidgetLayout.kt 를 컴파일해서 여러 크기의 그림을 만들고 겹침 · 넘침을 검사
# 처음 한 번: /tmp/ktcheck 에 코틀린 컴파일러가 있어야 함 (docs 나 이 폴더의 README 참고)
set -e
L=/tmp/ktcheck/lib
OUT=${1:-/tmp/claude-0/-home-user-sin/78e2bc2a-7f65-5612-9a8c-557939742276/scratchpad/widget-preview}
CP=$L/kotlin-compiler-embeddable-2.0.21.jar:$L/kotlin-stdlib-2.0.21.jar:$L/kotlin-script-runtime-2.0.21.jar:$L/kotlin-reflect-1.6.10.jar:$L/kotlin-daemon-embeddable-2.0.21.jar:$L/trove4j-1.0.20200330.jar:$L/annotations-13.0.jar:$L/kotlinx-coroutines-core-jvm-1.6.4.jar
D=$(dirname "$0")
rm -rf /tmp/ktcheck/prev && mkdir -p /tmp/ktcheck/prev
java -Dfile.encoding=UTF-8 -cp $CP org.jetbrains.kotlin.cli.jvm.K2JVMCompiler -no-stdlib -no-reflect -jvm-target 17 -d /tmp/ktcheck/prev -cp $L/kotlin-stdlib-2.0.21.jar \
  /home/user/sin/app/src/main/java/com/eonjeswieo/app/WidgetLayout.kt $D/LayoutPreview.kt 2>&1 | grep -v "^Picked up" || true
java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -Djava.awt.headless=true -cp /tmp/ktcheck/prev:$L/kotlin-stdlib-2.0.21.jar LayoutPreviewKt "$OUT" 2>&1 | grep -v "^Picked up"

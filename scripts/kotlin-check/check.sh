#!/bin/bash
# 코틀린 소스 컴파일 검사 (안드로이드 SDK/Gradle 없이): 오류가 있으면 줄 번호와 함께 보여 줌
#   bash scripts/kotlin-check/setup.sh   # 처음 한 번
#   bash scripts/kotlin-check/check.sh
# 남아 있는 오류 중 DriveBackup.kt · PushService.kt · MainActivity.kt 의 "구글 로그인 · 파이어베이스 · 드라이브" 부분은
# 그 라이브러리를 못 받아서 생기는 잡음이에요 (처음부터 있던 것). 새로 생긴 오류만 보려면 BASE=1 (HEAD 와 비교).
L=/tmp/ktcheck/lib
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
SRC=$ROOT/app/src/main/java/com/eonjeswieo/app
STUBS=$(cd "$(dirname "$0")" && pwd)/stubs
W=/tmp/ktcheck/work; rm -rf $W; mkdir -p $W/out $W/gen
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
CP=$L/kotlin-compiler-embeddable-2.0.21.jar:$L/kotlin-stdlib-2.0.21.jar:$L/kotlin-script-runtime-2.0.21.jar:$L/kotlin-reflect-1.6.10.jar:$L/kotlin-daemon-embeddable-2.0.21.jar:$L/trove4j-1.0.20200330.jar:$L/annotations-13.0.jar:$L/kotlinx-coroutines-core-jvm-1.6.4.jar
compile() { java -Dfile.encoding=UTF-8 -cp $CP org.jetbrains.kotlin.cli.jvm.K2JVMCompiler -no-stdlib -no-reflect -jvm-target 17 -Xjvm-default=all \
  -cp $L/android-all-16-robolectric-13921718.jar:$L/kotlin-stdlib-2.0.21.jar -d $W/out "$@" $W/gen/R.java $(find $STUBS -name '*.java') 2>&1 | grep -v "^Picked up"; }
if [ -n "$BASE" ]; then
  mkdir -p $W/base && for f in $SRC/*.kt; do git -C "$ROOT" show HEAD:app/src/main/java/com/eonjeswieo/app/$(basename $f) > $W/base/$(basename $f) 2>/dev/null; done
  norm() { grep "error:" | sed -E 's#^.*/([A-Za-z]+\.kt):[0-9]+:[0-9]+: #\1 #' | sort; }
  compile $W/base/*.kt | norm > $W/base.msgs
  compile $SRC/*.kt | norm > $W/cur.msgs
  echo "새로 생긴 오류 (HEAD 에는 없던 것):"; comm -13 $W/base.msgs $W/cur.msgs
else
  compile $SRC/*.kt | grep -E "error:|warning:" | grep -vE "DriveBackup|PushService" | head -${SHOW:-60}
fi

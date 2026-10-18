#!/bin/bash
# 코틀린 검사 도구 준비 (처음 한 번, 약 20초): 코틀린 컴파일러 + 안드로이드 프레임워크 jar 를 메이븐 중앙 저장소에서 받아 /tmp/ktcheck/lib 에 둠
# 구글 메이븐(dl.google.com)은 막혀 있어서 androidx · 파이어베이스 · 구글 서비스는 못 받음 → stubs/ 의 가짜 클래스로 대신 (MainActivity 가 쓰는 것만)
set -e
D=$(cd "$(dirname "$0")" && pwd)
mkdir -p /tmp/ktcheck
cp "$D/pom.xml" /tmp/ktcheck/pom.xml
cd /tmp/ktcheck
mvn -q -B dependency:copy-dependencies -DoutputDirectory=lib
echo "준비됨: /tmp/ktcheck/lib"

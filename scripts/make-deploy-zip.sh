#!/bin/sh
# Cloud Shell 에 올려서 푸시 알림 함수 · 보안 규칙 · 웹 페이지(개인정보처리방침 등)를 한 번에 배포하는 zip 을 만든다.
# 사용: sh scripts/make-deploy-zip.sh [출력 경로]
set -e
OUT="${1:-/tmp/eonjeswieo-deploy.zip}"
rm -f "$OUT"
cd "$(dirname "$0")/../firebase"
zip -rq "$OUT" firebase.json .firebaserc firestore.rules firestore.indexes.json \
  functions/index.js functions/lib functions/package.json functions/package-lock.json hosting
echo "$OUT"

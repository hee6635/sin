#!/bin/bash
# 폰 시험 전체 (실패한 줄만 보여 줌)
cd "$(dirname "$0")/phone"
for t in ${TESTS:-t6 t7 t8 t9 t10 t11 t12 t13 t14 old s3 s6 s7 s8 s12 s14 s15 s19 s20 s21 s22 s23 s24 s25 s26 s27 s28 s29 s30 s31 s33 s34 s35}; do
  [ -f $t.js ] || continue
  out=$(timeout 180 node $t.js 2>&1)
  echo "== $t: $(echo "$out" | grep -E '통과|passed' | tail -1)"
  echo "$out" | grep -E 'FAIL|Error' | head -5
done

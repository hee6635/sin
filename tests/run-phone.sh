#!/bin/bash
# 폰 시험 전체 (실패한 줄만 보여 줌)
cd "$(dirname "$0")/phone"
for t in ${TESTS:-t6 t7 t8 t9 t10 t11 t12 t13 t14 old s3 s6 s7 s8 s12 s14 s15 s19 s20 s21 s22 s23 s24 s25 s26 s27 s28 s29 s31 s33 s34 s35 s36 s37 s38 s39 s40 s41 s43 s44 s45 s46 s47 s48 s49 s50 s51 s52 s53 s54 s55 s56 s57 s58 s59 s60 s61 s62 s63 s64 s65 s66 s67 s68 s69 s70 s71 s72 s73 s74}; do   # (s42 = 깨진 저장 값 무작위 시험은 3분 넘게 걸려서 따로: TESTS=s42 TMO=290 bash tests/run-phone.sh)
  [ -f $t.js ] || continue
  out=$(timeout ${TMO:-180} node $t.js 2>&1)
  echo "== $t: $(echo "$out" | grep -E '통과|passed' | tail -1)"
  echo "$out" | grep -E 'FAIL|Error' | head -5
done

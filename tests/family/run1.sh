#!/bin/bash
# 가족 시험 한 개 돌리기: bash tests/family/run1.sh fam5e   (결과는 /tmp/run_fam5e.out)
#  - 시험 안의 날짜는 2026-10-12 기준으로 쓰여 있고, 서버(에뮬레이터)는 진짜 오늘 시각을 써서(초대 코드 만료 규칙) 날짜가 어긋나면 안 됨
#    → 날짜를 7의 배수 일수만큼 옮긴 복사본(요일은 그대로)을 만들어 돌림. SHIFT=0 이면 원본 그대로.
S=/home/user/sin/tests/family
cd /home/user/sin/firebase
f=$1
src=$S/$f.mjs
if [ "${SHIFT:-1}" = "1" ] && grep -q "new Date('2026-10-12T10:00:00')" $src; then
  src=$S/_shift_$f.mjs
  python3 - "$S/$f.mjs" "$src" <<'PY'
import re,sys,datetime
a,b=sys.argv[1:3]
base=datetime.date(2026,10,12);today=datetime.date.today()
delta=round((today-base).days/7)*7
s=open(a,encoding='utf-8').read()
def sh(m):
    try:d=datetime.date(int(m.group(1)),int(m.group(2)),int(m.group(3)))
    except ValueError:return m.group(0)
    d=d+datetime.timedelta(days=delta);return d.strftime('%Y-%m-%d')
s=re.sub(r'(20\d\d)-(\d\d)-(\d\d)',sh,s)
open(b,'w',encoding='utf-8').write(s)
PY
fi
timeout 300 npx firebase emulators:exec --only auth,firestore,functions --project demo-eonjeswieo "node $src" > /tmp/run_$f.out 2>&1
echo "exit $?" >> /tmp/run_$f.out
rm -f $S/_shift_$f.mjs

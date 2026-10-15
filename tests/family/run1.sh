#!/bin/bash
S=.
cd /home/user/sin/firebase
f=$1
timeout 300 npx firebase emulators:exec --only auth,firestore,functions --project demo-eonjeswieo "node $S/$f.mjs" > /tmp/run_$f.out 2>&1
echo "exit $?" >> /tmp/run_$f.out

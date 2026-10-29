#!/usr/bin/env python3
"""서버의 날씨 계산(wxcore.js) · 지역표(wxRegions.json)를 앱(index.html)에 그대로 넣기 (고친 뒤 한 번 실행)
  python3 scripts/wx/sync-app.py   — 시험(firebase/functions/test/wx.test.mjs)이 둘이 같은지 확인함"""
import json, os, re
R = os.path.join(os.path.dirname(__file__), '../..')
html_p = os.path.join(R, 'app/src/main/assets/index.html')
core = open(os.path.join(R, 'firebase/functions/lib/wxcore.js'), encoding='utf-8').read().rstrip()
reg = json.load(open(os.path.join(R, 'firebase/functions/lib/wxRegions.json'), encoding='utf-8'))
h = open(html_p, encoding='utf-8').read()
block = '<script>/*WXCORE*/\n' + core + '\n</script>\n'
if '<script>/*WXCORE*/' in h:
  h = re.sub(r'<script>/\*WXCORE\*/\n[\s\S]*?\n</script>\n', lambda m: block, h, count=1)
else:
  h = h.replace('<script src="firebase/config.js"></script>\n', '<script src="firebase/config.js"></script>\n' + block, 1)
line = 'const WX_REG=' + json.dumps([[r[0], r[1], r[2]] for r in reg], ensure_ascii=False, separators=(',', ':')) + ';'
assert re.search(r'^const WX_REG=\[.*?\];$', h, re.M), 'index.html 에 const WX_REG=[]; 줄이 있어야 함'
h = re.sub(r'^const WX_REG=\[.*?\];$', lambda m: line, h, count=1, flags=re.M)
open(html_p, 'w', encoding='utf-8').write(h)
print('ok', len(reg), 'regions')

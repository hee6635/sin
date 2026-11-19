// app/js-src/*.js 조각을 이름 순서대로 이어 붙여 app/src/main/assets/js/app.js 를 만든다 (내용은 한 글자도 안 바꿈)
// 사용: node scripts/build-js.mjs          → app.js 다시 만들기
//       node scripts/build-js.mjs --check  → app.js 가 조각과 같은지 확인 (다르면 실패 · APK 빌드 전에 돌림)
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(root, 'app/js-src'), out = path.join(root, 'app/src/main/assets/js/app.js');
const parts = fs.readdirSync(dir).filter(f => /^\d\d-.*\.js$/.test(f)).sort();
const txt = parts.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('');
if (process.argv.includes('--check')) {
  const cur = fs.readFileSync(out, 'utf8');
  if (cur !== txt) { console.error('app.js 가 app/js-src 조각과 달라요 → node scripts/build-js.mjs 로 다시 만들어 주세요'); process.exit(1); }
  console.log(`app.js = 조각 ${parts.length}개와 같음`);
} else { fs.writeFileSync(out, txt); console.log(`app.js 만듦 (조각 ${parts.length}개 · ${txt.split('\n').length - 1}줄)`); }

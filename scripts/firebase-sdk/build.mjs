import { build } from 'esbuild';
import { statSync } from 'node:fs';

const out = new URL('../../app/src/main/assets/firebase/fb-sdk.js', import.meta.url).pathname;
await build({
  entryPoints: [new URL('./entry.mjs', import.meta.url).pathname],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['chrome90'],          // 안드로이드 WebView (최근 버전)
  platform: 'browser',
  legalComments: 'none',
  outfile: out,
  define: { 'process.env.NODE_ENV': '"production"' },
});
console.log('만들었어요:', out, Math.round(statSync(out).size / 1024) + 'KB');

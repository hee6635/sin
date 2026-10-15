const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/home/user/sin/app/src/main/assets';
const srv = http.createServer((req, res) => { let f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/javascript' }); fs.createReadStream(f).pipe(res); }).listen(8140, '127.0.0.1');
const cases = {
  empty: {},
  v015: { onboarded: true, anchor: '2026-10-02', myTeam: 1, patternName: '4조2교대', pattern: ['주', '야', '휴', '휴'], overrides: { '2026-10-20': '휴' }, memos: { '2026-10-05': '병원' } },
  v019link: { onboarded: true, anchor: '2026-10-02', myTeam: 1, pattern: ['주', '야', '휴', '휴'], link: { hid: 'h1', role: 'guest', name: '엄마', perm: 'write', mode: 'own', uid: 'u1', hash: 'abc' },
    requests: [{ id: 'r1', srv: true, dir: 'in', from: 'u2', to: 'u1', date: '2026-10-20', want: '휴', msg: 'x', st: 'pending', reply: '', held: false }], fam2: { scheds: {}, members: [], memos: {}, me: { sent: 3 } } },
  junk: { onboarded: true, pattern: 'oops', link: { hid: 5 }, requests: 'x', overrides: [], types: 7, gAcct: 5, pushOn: 'maybe' },
};
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const [n, st] of Object.entries(cases)) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    await p.addInitScript(s => { localStorage.setItem('eonjeswieo:v1', JSON.stringify(s)); window.AndroidBridge = { status: () => '', setAlarms() {}, setReminders() {}, fcmToken: () => '', takePush: () => '', googleAvailable: () => false }; }, st);
    await p.goto('http://127.0.0.1:8140/index.html'); await p.waitForTimeout(1200);
    const ok = await p.evaluate(() => !!document.querySelector('#nav') && document.body.innerText.length > 20);
    const s = await p.evaluate(() => JSON.parse(localStorage.getItem('eonjeswieo:v1') || 'null'));
    const good = ok && !errs.length; if(!good||!s) console.log('   dbg', ok, JSON.stringify(s).slice(0,120));
    if (!good) bad++;
    console.log(good ? '  ✓' : '  ✕', n, errs.slice(0, 2).join(' | '));
    await ctx.close();
  }
  await b.close(); srv.close(); process.exit(bad ? 1 : 0);
})();

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { handle } = createRequire(import.meta.url)('../lib/gunlink.js');
const base = (o = {}) => ({ projectNumber: '123', verifyFb: async t => { if (t !== 'fb') throw 0; return { uid: 'me' }; },
  tokenInfo: async () => ({ aud: '123-x.apps', sub: 'g1', email_verified: 'true' }), userByGoogle: async () => ({ uid: 'old' }),
  roomOf: async () => null, unlinked: [], unlink(u) { this.unlinked.push(u); }, ...o });
let d = base(); assert.equal((await handle(d, { fbToken: 'x', gToken: 'g' })).status, 401);
d = base(); assert.equal((await handle(d, { fbToken: 'fb' })).status, 400);
d = base({ tokenInfo: async () => ({ aud: '999-x', sub: 'g1', email_verified: 'true' }) }); assert.equal((await handle(d, { fbToken: 'fb', gToken: 'g' })).status, 403);
d = base({ userByGoogle: async () => ({ uid: 'me' }) }); assert.deepEqual((await handle(d, { fbToken: 'fb', gToken: 'g' })).body, { ok: true, none: true }); assert.equal(d.unlinked.length, 0);
d = base({ roomOf: async () => ({ name: '태블릿', role: 'member' }) }); assert.equal((await handle(d, { fbToken: 'fb', gToken: 'g' })).body.busy, true); assert.equal(d.unlinked.length, 0);
await handle(d, { fbToken: 'fb', gToken: 'g', force: true }); assert.deepEqual(d.unlinked, ['old']);
d = base(); assert.deepEqual((await handle(d, { fbToken: 'fb', gToken: 'g' })).body, { ok: true }); assert.deepEqual(d.unlinked, ['old']);
console.log('gunlink ok');

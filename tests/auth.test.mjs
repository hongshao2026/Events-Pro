import assert from 'node:assert/strict';
import { build } from 'vite';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

await build({ configFile: false, logLevel: 'error', build: {
  outDir: '.sites-runtime/auth-unit', emptyOutDir: true, minify: false,
  lib: { entry: { config: resolve('lib/auth/config.ts'), client: resolve('lib/auth/client.ts') }, formats: ['es'], fileName: (_, name) => name + '.js' },
  rolldownOptions: { external: ['@supabase/supabase-js'] },
} });
const { authEnabled, readAuthConfig, validEmail, validCode, authError } = await import(pathToFileURL(resolve('.sites-runtime/auth-unit/config.js')));
const { consumeCallback, safeReturnHash, RETURN_HASH_KEY } = await import(pathToFileURL(resolve('.sites-runtime/auth-unit/client.js')));
const pass = name => console.log('PASS', name);
for (const value of [undefined, '', 'false', 'TRUE', '1']) assert.equal(authEnabled({ VITE_AUTH_ENABLED: value }, 'https:'), false);
assert.equal(authEnabled({ VITE_AUTH_ENABLED: 'true' }, 'file:'), false);
assert.equal(authEnabled({ VITE_AUTH_ENABLED: 'true' }, 'https:'), true);
pass('explicit opt-in only; file delivery cannot enable auth');
const env = { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' };
assert.deepEqual(readAuthConfig(env), { url: env.VITE_SUPABASE_URL, publishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY });
for (const url of ['http://remote.test', 'javascript:alert(1)', 'https://user:secret@host.test', 'https://host.test/path', 'https://host.test/?key=x', 'https://host.test/#x']) assert.equal(readAuthConfig({ ...env, VITE_SUPABASE_URL: url }), null);
for (const key of ['', 'sb_secret_danger', 'eyJ.service_role.key', 'sb_publishable_test key']) assert.equal(readAuthConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: key }), null);
assert.ok(readAuthConfig({ ...env, VITE_SUPABASE_URL: 'http://127.0.0.1:54321' }));
pass('only public publishable keys; TLS required outside loopback; rejects embedded credentials');
assert.equal(validEmail('person+events@example.com'), true);
for (const value of ['invalid', 'a@@b.com', 'a b@c.com', 'a@b', 'a'.repeat(255) + '@b.com']) assert.equal(validEmail(value), false);
assert.equal(validCode('123456'), true); assert.equal(validCode('1234567890'), true);
for (const value of ['12345', '12345678901', '1e1234', '123 456', 'abcdef']) assert.equal(validCode(value), false);
pass('email and OTP validation before network requests');
assert.match(authError({ code: 'otp_expired' }), /验证码无效或已过期/);
assert.match(authError({ name: 'AuthPKCECodeVerifierMissingError' }), /登录已过期/);
assert.match(authError({ status: 429 }), /频繁/);
assert.match(authError(new TypeError('private secret')), /网络/);
assert.equal(authError({ message: 'token=secret user@example.com' }).includes('secret'), false);
pass('safe actionable errors never echo backend secrets');
assert.equal(safeReturnHash('https://evil.test'), '');
assert.equal(safeReturnHash('#view=home&region=europe'), '#view=home&region=europe');
assert.equal(safeReturnHash('#series=triton-one-cyprus-2026&view=schedule'), '#series=triton-one-cyprus-2026&view=schedule');
assert.equal(safeReturnHash('#view=schedule&day=2026-12-01&access_token=secret&next=https://evil.test'), '#view=schedule&day=2026-12-01');
pass('return navigation accepts planner hash keys only');
function callback(href, stored = '#view=schedule&day=2026-12-01') {
  const data = new Map([[RETURN_HASH_KEY, stored]]); let replaced;
  const storage = { getItem: key => data.get(key), removeItem: key => data.delete(key) };
  const result = consumeCallback({ href }, { replaceState: (_, __, url) => { replaced = url; } }, storage);
  return { result, replaced, data };
}
let test = callback('https://events.test/planner/?auth=callback&code=secret');
assert.deepEqual(test.result, { callback: true, code: 'secret', denied: false });
assert.equal(test.replaced, '/planner/#view=schedule&day=2026-12-01'); assert.equal(test.data.size, 0);
pass('callback code consumed once, removed before planner mounts, intended route restored');
test = callback('https://events.test/?auth=callback&error=access_denied&error_description=secret');
assert.equal(test.result.denied, true); assert.equal(test.replaced.includes('secret'), false);
test = callback('https://events.test/#access_token=secret&refresh_token=secret');
assert.equal(test.result.denied, true); assert.equal(test.replaced.includes('secret'), false);
pass('cancellation and unexpected implicit tokens scrubbed from URL');
test = callback('https://events.test/#view=schedule');
assert.equal(test.result.callback, false); assert.equal(test.replaced, undefined);
pass('ordinary schedule navigation is unchanged');
let cleaned;
consumeCallback({ href: 'https://events.test/?code=secret' }, { replaceState: (_, __, url) => { cleaned = url; } }, { getItem() { throw new Error('blocked'); } });
assert.equal(cleaned, '/');
pass('callback credentials scrubbed even when return storage is blocked');

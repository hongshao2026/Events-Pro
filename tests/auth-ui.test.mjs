import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';

// These flags exist only in this isolated server, never in a saved .env or release.
const provider = 'https://auth.events-pro.test';
const server = await createServer({ optimizeDeps: { entries: ['index.html'] }, server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, define: {
  'import.meta.env.VITE_AUTH_ENABLED': '"true"',
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(provider),
  'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': '"sb_publishable_test_fixture"',
} });
await server.listen();
const address = server.httpServer.address();
const base = `http://127.0.0.1:${address.port}`;
await mkdir('.sites-runtime/qa/auth', { recursive: true });
let browser, diagnosticPage;
const checks = [], errors = [], requests = [];
const pass = name => { checks.push(name); console.log('PASS', name); };
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'player@example.com', email_confirmed_at: '2026-10-02T00:00:00Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: '2026-10-02T00:00:00Z' };
const session = () => ({ access_token: 'fixture-access-token', refresh_token: 'fixture-refresh-token', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user });
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  diagnosticPage = page;
  page.on('pageerror', error => errors.push(error.message));
  let otpStatus = 200, verifyStatus = 200, logoutStatus = 204, callbackStatus = 200;
  let slowSend = false, releaseSend;
  let googleQuery;
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === base) return route.continue();
    if (url.origin !== provider) { errors.push('Unexpected external request: ' + url.origin); return route.abort(); }
    requests.push({ path: url.pathname, method: request.method(), body: request.postDataJSON() });
    const json = (status, data) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data), headers: { 'access-control-allow-origin': base, 'access-control-expose-headers': 'x-supabase-api-version', 'x-supabase-api-version': '2024-01-01' } });
    if (url.pathname === '/auth/v1/otp') {
      if (slowSend) await new Promise(resolve => { releaseSend = resolve; });
      return otpStatus === 200 ? json(200, {}) : json(otpStatus, { code: otpStatus === 429 ? 'over_email_send_rate_limit' : 'unexpected_failure', message: 'private backend details' });
    }
    if (url.pathname === '/auth/v1/verify') return verifyStatus === 200 ? json(200, session()) : json(403, { code: 'otp_expired', message: 'secret provider error' });
    if (url.pathname === '/auth/v1/token') return callbackStatus === 200 ? json(200, session()) : json(400, { code: 'bad_code_verifier', message: 'private' });
    if (url.pathname === '/auth/v1/user') return json(200, user);
    if (url.pathname === '/auth/v1/logout') return logoutStatus === 204 ? route.fulfill({ status: 204 }) : json(logoutStatus, { code: 'unexpected_failure', message: 'private' });
    if (url.pathname === '/auth/v1/authorize') {
      googleQuery = url.searchParams;
      return route.fulfill({ status: 302, headers: { location: `${base}/?auth=callback&code=test-pkce-code` } });
    }
    errors.push('Unexpected provider endpoint: ' + url.pathname); return route.abort();
  });
  const open = async () => { await page.getByRole('button', { name: '登录', exact: true }).click(); await page.getByRole('dialog').waitFor(); };
  const close = async () => { await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'hidden' }); };
  const count = path => requests.filter(r => r.path === path).length;
  const fillEmail = () => page.getByLabel('邮箱地址', { exact: true }).fill('player@example.com');
  await page.goto(base + '/#view=discover&series=wpt-wynn-2026&region=north-america'); await open();
  assert.equal(requests.length, 0); await page.getByRole('button', { name: '获取验证码', exact: true }).click();
  assert.equal(await page.locator('#auth-email').getAttribute('aria-invalid'), 'true');
  assert.equal(await page.locator('#auth-email').evaluate(e => e === document.activeElement), true);
  assert.equal(requests.length, 0); pass('invalid email stays inline, receives focus, makes no network request');
  await fillEmail();
  await page.locator('#auth-email').dispatchEvent('compositionstart');
  await page.locator('form').dispatchEvent('submit'); assert.equal(requests.length, 0);
  await page.locator('#auth-email').dispatchEvent('compositionend');
  pass('IME composition cannot dispatch a login email');
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const rect = await page.locator('.auth-sheet').boundingBox();
    assert.ok(rect.x >= 0 && rect.x + rect.width <= width + 1 && rect.width <= 480);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `.sites-runtime/qa/auth/login-${width}.png` });
  }
  pass('login sheet fits 320/390px phones and centered desktop canvas');
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < 10; i++) { await page.keyboard.press('Tab'); assert.equal(await page.locator('.auth-sheet').evaluate(e => e.contains(document.activeElement)), true); }
  await close(); assert.equal(await page.getByRole('button', { name: '登录', exact: true }).evaluate(e => e === document.activeElement), true);
  pass('modal traps keyboard focus; Escape restores the trigger');
  await open(); await fillEmail(); slowSend = true;
  await page.getByRole('button', { name: '获取验证码', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('form')?.getAttribute('aria-busy') === 'true');
  await page.locator('form').dispatchEvent('submit');
  assert.equal(count('/auth/v1/otp'), 1); assert.equal(await page.getByRole('button', { name: '使用 Google 登录', exact: true }).isDisabled(), true);
  await page.screenshot({ path: '.sites-runtime/qa/auth/loading.png' });
  releaseSend(); slowSend = false;
  await page.getByLabel('邮箱验证码', { exact: true }).waitFor();
  assert.equal(requests.find(r => r.path.endsWith('/otp')).body.create_user, true);
  assert.equal(await page.getByRole('button', { name: /秒后重发/ }).isDisabled(), true);
  pass('one email request while busy; first-use registration and resend cooldown');
  await close(); await open(); await page.getByLabel('邮箱验证码', { exact: true }).waitFor();
  assert.equal(await page.locator('#auth-code').inputValue(), '');
  assert.equal(await page.getByRole('button', { name: /秒后重发/ }).isDisabled(), true);
  pass('reopening preserves the email challenge and cooldown, never the typed OTP');
  await page.getByRole('button', { name: '验证并登录', exact: true }).click();
  assert.equal(count('/auth/v1/verify'), 0);
  await page.getByLabel('邮箱验证码', { exact: true }).fill('123456');
  assert.equal(await page.locator('#auth-code').getAttribute('type'), 'password');
  await page.getByRole('button', { name: '显示验证码', exact: true }).click();
  assert.equal(await page.locator('#auth-code').getAttribute('type'), 'text');
  verifyStatus = 403; await page.getByRole('button', { name: '验证并登录', exact: true }).click();
  await page.getByText('验证码无效或已过期', { exact: false }).waitFor();
  assert.equal(await page.locator('#auth-code').inputValue(), '123456');
  assert.equal(await page.locator('.auth-sheet').innerText().then(t => t.includes('secret')), false);
  await page.screenshot({ path: '.sites-runtime/qa/auth/invalid-code.png' });
  pass('invalid/expired code preserves input; reveal works; backend details hidden');
  verifyStatus = 200; await page.getByRole('button', { name: '验证并登录', exact: true }).click();
  await page.getByText('已登录', { exact: true }).waitFor();
  await page.screenshot({ path: '.sites-runtime/qa/auth/account.png' });
  await close(); await page.reload(); await page.getByRole('button', { name: '我的账户', exact: true }).waitFor();
  pass('verified email creates an authenticated account and restores on reload');
  await page.locator('.bottom-nav').getByRole('button',{name:'我的',exact:true}).click();
  assert.match(await page.locator('.profile-identity').innerText(),/player@example.com/);
  assert.match(await page.locator('.settings-facts').innerText(),/已登录.*邮箱/s);
  await page.goBack();await page.locator('.mobile-event').first().waitFor();
  pass('profile projects the authenticated email and account state');
  // Seed a real planner selection through its UI before testing account boundaries.
  await page.locator('.mobile-event').first().locator('label.class-option').filter({ hasText: /^参加$/ }).click();
  const saved = await page.evaluate(() => localStorage.getItem('poker-planner-local-v2'));
  const other = await context.newPage(); await other.goto(base); await other.getByRole('button', { name: '我的账户', exact: true }).waitFor();
  await page.getByRole('button', { name: '我的账户', exact: true }).click();
  logoutStatus = 422; await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '已从本机退出' }).waitFor();
  await other.getByRole('button', { name: '登录', exact: true }).waitFor();
  assert.equal(await page.getByText('已登录', { exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('poker-planner-local-v2')), saved);
  pass('failed remote logout clears local session safely and explains uncertain revocation');
  await page.getByRole('button', { name: '使用 Google 登录', exact: true }).click();
  await page.getByText('已登录', { exact: true }).waitFor();
  await other.getByRole('button', { name: '我的账户', exact: true }).waitFor();
  logoutStatus = 204; await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' }); await other.getByRole('button', { name: '登录', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('poker-planner-local-v2')), saved);
  await other.close(); pass('successful logout propagates across tabs and preserves selections');
  await page.locator('.bottom-nav').getByRole('button', { name: /我的日程/ }).click();
  await open(); await page.getByRole('button', { name: '使用 Google 登录', exact: true }).click();
  await page.getByText('已登录', { exact: true }).waitFor();
  assert.equal(googleQuery.get('provider'), 'google'); assert.equal(googleQuery.get('code_challenge_method').toLowerCase(), 's256');
  assert.ok(googleQuery.get('code_challenge')); assert.equal(googleQuery.get('redirect_to'), `${base}/?auth=callback`);
  assert.ok(page.url().includes('view=schedule'));assert.ok(page.url().includes('region=north-america')); assert.equal(page.url().includes('code='), false);
  const pkce = requests.find(r => r.path.endsWith('/token'));
  assert.equal(pkce.body.auth_code, 'test-pkce-code'); assert.ok(pkce.body.code_verifier);
  assert.equal(await page.evaluate(() => localStorage.getItem('poker-planner-local-v2')), saved);
  pass('Google PKCE round trip exchanges verifier, scrubs callback, restores schedule without data changes');
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await page.goto(`${base}/?auth=callback&error=access_denied&error_description=secret`);
  await page.getByText('Google 登录未完成', { exact: false }).waitFor();
  assert.equal(page.url().includes('secret'), false); await page.getByLabel('邮箱地址', { exact: true }).waitFor();
  pass('cancelled OAuth removes provider data and offers email fallback');
  await close();
  callbackStatus = 400;
  await page.goto(`${base}/?auth=callback&code=expired-again`);
  await page.getByText('登录已过期', { exact: false }).waitFor();
  assert.equal(page.url().includes('code='), false); pass('expired PKCE callback has an actionable retry path');
  await context.close();

  // Separate profiles ensure rate limit and network tests do not inherit sessions.
  const failureContext = await browser.newContext({ viewport: { width: 320, height: 700 }, reducedMotion: 'reduce' });
  const failurePage = await failureContext.newPage(); failurePage.on('pageerror', error => errors.push(error.message));
  let rateLimit = true;
  await failureContext.route(`${provider}/**`, route => rateLimit
    ? route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ code: 'over_email_send_rate_limit' }) })
    : route.abort('internetdisconnected'));
  await failurePage.goto(base); await failurePage.getByRole('button', { name: '登录', exact: true }).click();
  await failurePage.getByLabel('邮箱地址', { exact: true }).fill('player@example.com');
  await failurePage.getByRole('button', { name: '获取验证码', exact: true }).click();
  await failurePage.getByText('操作太频繁', { exact: false }).waitFor();
  await failurePage.keyboard.press('Escape'); await failurePage.getByRole('button', { name: '登录', exact: true }).click();
  assert.equal(await failurePage.getByRole('button', { name: /秒后可发送/ }).isDisabled(), true);
  pass('server rate limit survives closing and reopening the sheet');
  rateLimit = false; await failurePage.reload(); await failurePage.getByRole('button', { name: '登录', exact: true }).click();
  await failurePage.getByLabel('邮箱地址', { exact: true }).fill('player@example.com');
  await failurePage.getByRole('button', { name: '获取验证码', exact: true }).click();
  await failurePage.getByText('暂时无法连接登录服务', { exact: false }).waitFor();
  assert.equal(await failurePage.getByLabel('邮箱地址', { exact: true }).inputValue(), 'player@example.com');
  await failurePage.keyboard.press('Escape'); await failurePage.locator('.festival-card').first().waitFor();
  pass('network failure retains email and leaves the planner usable');
  await failureContext.close();

  const blockedContext = await browser.newContext();
  await blockedContext.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key.startsWith('events-pro-auth')) throw new DOMException('Blocked test storage', 'SecurityError');
      return original.call(this, key, value);
    };
  });
  const blockedPage = await blockedContext.newPage();
  await blockedPage.goto(base); await blockedPage.getByRole('button', { name: '登录', exact: true }).click();
  await blockedPage.getByText('浏览器禁止了登录所需的存储', { exact: false }).waitFor();
  assert.equal(await blockedPage.getByLabel('邮箱地址', { exact: true }).count(), 0);
  await blockedPage.keyboard.press('Escape'); await blockedPage.locator('.festival-card').first().waitFor();
  await blockedContext.close(); pass('blocked auth storage explains recovery and keeps the local planner available');

  for (const enabled of [false, true]) {
    const checkServer = await createServer({ cacheDir: `.sites-runtime/vite-auth-config-${enabled}`, optimizeDeps: { entries: ['index.html'] }, server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, define: {
      'import.meta.env.VITE_AUTH_ENABLED': JSON.stringify(String(enabled)),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(provider),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(enabled ? '' : 'sb_publishable_test_fixture'),
    } });
    const checkContext = await browser.newContext();
    try {
      await checkServer.listen();
      const checkBase = `http://127.0.0.1:${checkServer.httpServer.address().port}`;
      let remote = 0;
      await checkContext.route('**/*', route => {
        if (new URL(route.request().url()).origin === checkBase) return route.continue();
        remote++; return route.abort();
      });
      const checkPage = await checkContext.newPage();
      await checkPage.goto(checkBase + '/#view=schedule');
      await checkPage.getByRole('heading', { name: '我的日程表', exact: true }).waitFor();
      if (enabled) {
        await checkPage.getByRole('button', { name: '登录', exact: true }).click();
        await checkPage.getByText('登录服务尚未配置', { exact: false }).waitFor();
        assert.equal(await checkPage.getByLabel('邮箱地址', { exact: true }).count(), 0);
      } else {
        assert.equal(await checkPage.getByRole('button', { name: '登录', exact: true }).count(), 0);
        assert.equal(await checkPage.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('events-pro-auth'))), false);
      }
      assert.equal(remote, 0);
    } finally { await checkContext.close(); await checkServer.close(); }
  }
  pass('disabled web entry is absent even with keys; missing configuration never collects credentials or calls auth');
  assert.deepEqual(errors, []); pass('no page errors or real third-party requests');
} catch (error) {
  if (diagnosticPage && !diagnosticPage.isClosed()) {
    await diagnosticPage.screenshot({ path: '.sites-runtime/qa/auth/failure.png' });
    console.error(await diagnosticPage.locator('.auth-sheet').innerText().catch(() => 'No open sheet'));
  }
  throw error;
} finally {
  await writeFile('.sites-runtime/qa/auth/results.json', JSON.stringify({ checks, errors, requestCount: requests.length }, null, 2));
  await browser?.close(); await server.close();
}

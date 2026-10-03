import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { authError, readAuthConfig, type AuthEnvironment } from './config';

export const AUTH_STORAGE_KEY = 'events-pro-auth-session';
export const RETURN_HASH_KEY = 'events-pro-auth-return';
const authOrigins = new WeakMap<SupabaseClient, string>();
export type AuthRuntime = {
  client: SupabaseClient | null;
  session: Session | null;
  error: string;
  callback: boolean;
};

// Only recover in-app hash state. No caller-supplied redirect destinations.
export function safeReturnHash(value: string | null) {
  if (!value || value.length > 4096 || !value.startsWith('#') || /[\r\n]/.test(value)) return '';
  const input = new URLSearchParams(value.slice(1));
  const output = new URLSearchParams();
  for (const key of ['series', 'view', 'region', 'day', 'month', 'agendaStatuses', 'continuations', 'q', 'statuses', 'status', 'from', 'to', 'date', 'buyin', 'gtd', 'game', 'sort', 'supp', 'page']) {
    const entry = input.get(key);
    if (entry !== null) output.set(key, entry);
  }
  return output.size ? '#' + output : '';
}

export function consumeCallback(location: Location, history: History, storage: Storage) {
  const url = new URL(location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const callback = url.searchParams.get('auth') === 'callback' || url.searchParams.has('code') ||
    url.searchParams.has('error') || fragment.has('access_token') || fragment.has('error');
  if (!callback) return { callback: false, code: null, denied: false };
  const code = url.searchParams.get('code');
  const denied = url.searchParams.has('error') || fragment.has('error') || fragment.has('access_token');
  let hash = '';
  try { hash = safeReturnHash(storage.getItem(RETURN_HASH_KEY)); storage.removeItem(RETURN_HASH_KEY); } catch { /* URL secrets must still be removed. */ }
  // Clear callback credentials before mounting the planner (which owns hash navigation).
  history.replaceState(null, '', url.pathname + hash);
  return { callback: true, code, denied };
}

export async function bootstrapAuth(env: AuthEnvironment): Promise<AuthRuntime> {
  let callback: ReturnType<typeof consumeCallback>;
  try { callback = consumeCallback(window.location, window.history, window.sessionStorage); }
  catch {
    // Even a browser blocking storage must not leave an OAuth code in the address bar.
    window.history.replaceState(null, '', window.location.pathname);
    return { client: null, session: null, error: '浏览器禁止了登录所需的存储，请允许本站存储后刷新。', callback: true };
  }
  const config = readAuthConfig(env);
  if (!config) return { client: null, session: null, error: '登录服务尚未配置，请稍后再试。', callback: callback.callback };
  try {
    const probe = AUTH_STORAGE_KEY + '-probe';
    window.localStorage.setItem(probe, '1'); window.localStorage.removeItem(probe);
    const client = createClient(config.url, config.publishableKey, {
      auth: {
        flowType: 'pkce', detectSessionInUrl: false, persistSession: true,
        autoRefreshToken: true, storageKey: AUTH_STORAGE_KEY, storage: window.localStorage,
      },
      global: {
        fetch: (input, init) => fetch(input, {
          ...init,
          signal: AbortSignal.any([AbortSignal.timeout(15000), ...(init?.signal ? [init.signal] : [])]),
        }),
      },
    });
    authOrigins.set(client, config.url);
    if (callback.callback) {
      if (callback.denied || !callback.code) return { client, session: null, error: 'Google 登录未完成，请重试或使用邮箱验证码。', callback: true };
      const { data, error } = await client.auth.exchangeCodeForSession(callback.code);
      return { client, session: data.session, error: error ? authError(error) : '', callback: true };
    }
    const { data, error } = await client.auth.getSession();
    return { client, session: data.session, error: error ? authError(error) : '', callback: false };
  } catch (error) {
    return { client: null, session: null, error: error instanceof DOMException && error.name === 'SecurityError'
      ? '浏览器禁止了登录所需的存储，请允许本站存储后刷新。' : authError(error), callback: callback.callback };
  }
}

export async function startGoogleLogin(client: SupabaseClient) {
  const redirectTo = new URL(window.location.pathname, window.location.origin);
  redirectTo.searchParams.set('auth', 'callback');
  window.sessionStorage.setItem(RETURN_HASH_KEY, safeReturnHash(window.location.hash));
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo.href, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error) throw error;
  if (!data.url) throw new Error('Missing authorization URL');
  const target = new URL(data.url);
  if (target.origin !== authOrigins.get(client) || target.pathname !== '/auth/v1/authorize') {
    throw new Error('Invalid authorization URL');
  }
  window.location.assign(target.href);
}

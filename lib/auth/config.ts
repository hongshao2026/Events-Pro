export type AuthConfig = { url: string; publishableKey: string };
export type AuthEnvironment = {
  VITE_AUTH_ENABLED?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
};

// A build flag, never a query parameter or browser preference.
export function authEnabled(env: AuthEnvironment, protocol: string) {
  return env.VITE_AUTH_ENABLED === 'true' && (protocol === 'https:' || protocol === 'http:');
}

export function readAuthConfig(env: AuthEnvironment): AuthConfig | null {
  try {
    const url = new URL(env.VITE_SUPABASE_URL?.trim() || '');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || '';
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
        url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
        !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) return null;
    return { url: url.origin, publishableKey };
  } catch {
    return null;
  }
}

export function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validCode(code: string) {
  return /^\d{6,10}$/.test(code);
}

export function authError(error: unknown): string {
  const value = error as { code?: string; status?: number; name?: string } | null;
  if (value?.status === 429 || ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(value?.code || '')) {
    return '操作太频繁，请稍后再试。';
  }
  if (['otp_expired', 'otp_disabled', 'invalid_credentials'].includes(value?.code || '')) {
    return '验证码无效或已过期，请核对邮件，或重新获取验证码。';
  }
  if (value?.code === 'email_address_invalid') return '请检查邮箱地址后重试。';
  if (['signup_disabled', 'email_provider_disabled', 'provider_disabled'].includes(value?.code || '')) {
    return '该登录方式暂不可用，请稍后重试或选择其他方式。';
  }
  if (['AuthPKCECodeVerifierMissingError', 'AuthPKCEGrantCodeExchangeError'].includes(value?.name || '') ||
      ['flow_state_expired', 'flow_state_not_found', 'bad_code_verifier', 'refresh_token_not_found', 'refresh_token_already_used', 'session_not_found', 'session_expired'].includes(value?.code || '')) {
    return '登录已过期，请在发起登录的浏览器中重新登录。';
  }
  if (value?.name === 'TimeoutError' || value?.name === 'AbortError') return '连接超时，请检查网络后重试。';
  if (value?.name === 'AuthRetryableFetchError' || error instanceof TypeError) return '暂时无法连接登录服务，请检查网络后重试。';
  return '登录服务暂不可用，请稍后重试。';
}

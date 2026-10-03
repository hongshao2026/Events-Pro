import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, Check, Eye, EyeOff, HardDrive, LoaderCircle, LogOut, Mail, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { authError, validCode, validEmail } from '@/lib/auth/config';
import { startGoogleLogin, type AuthRuntime } from '@/lib/auth/client';

function GoogleMark() {
  // Single-color provider lettermark, using the established control ink.
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.36ZM12 22c2.7 0 4.96-.9 6.61-2.41l-3.23-2.51c-.9.6-2.04.96-3.38.96-2.61 0-4.82-1.76-5.61-4.12H3.05v2.59A10 10 0 0 0 12 22ZM6.39 13.92A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.49H3.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.05 4.51l3.34-2.59ZM12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.34 2.59C7.18 7.72 9.39 5.96 12 5.96Z"/></svg>;
}

function LoginForm({ client, retryAt, setRetryAt, sentTo, setSentTo }: {
  client: SupabaseClient; retryAt: number; setRetryAt: (time: number) => void;
  sentTo: string; setSentTo: (email: string) => void;
}) {
  const [email, setEmail] = useState(sentTo);
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState<'email' | 'code' | null>(null);
  const [busy, setBusy] = useState<'send' | 'verify' | 'google' | null>(null);
  const [now, setNow] = useState(Date.now);
  const emailRef = useRef<HTMLInputElement>(null), codeRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false), mounted = useRef(true), composing = useRef(false);
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (sentTo) codeRef.current?.focus(); }, [sentTo]);

  async function run(kind: 'send' | 'verify' | 'google', action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(kind); setError(''); setInvalid(null);
    try { await action(); }
    catch (failure) {
      if (kind === 'send') setRetryAt((failure as { status?: number })?.status === 429 ? Date.now() + 60000 : 0);
      if (mounted.current) {
        setError(authError(failure));
        if (kind === 'verify') { setInvalid('code'); codeRef.current?.focus(); }
      }
    } finally { inFlight.current = false; if (mounted.current) setBusy(null); }
  }

  function send(event?: FormEvent) {
    event?.preventDefault();
    if (composing.current || inFlight.current || Date.now() < retryAt) return;
    const target = sentTo || email.trim();
    if (!validEmail(target)) {
      setError('请输入完整邮箱地址，例如 name@example.com。'); setInvalid('email'); emailRef.current?.focus(); return;
    }
    void run('send', async () => {
      setRetryAt(Date.now() + 60000);
      const { error: failure } = await client.auth.signInWithOtp({ email: target, options: { shouldCreateUser: true } });
      if (failure) throw failure;
      // Cooldown survives closing the sheet while this request completes.
      setRetryAt(Date.now() + 60000);
      setSentTo(target);
      if (mounted.current) { setCode(''); setNow(Date.now()); }
    });
  }

  function verify(event: FormEvent) {
    event.preventDefault();
    if (composing.current || inFlight.current) return;
    if (!validCode(code.trim())) {
      setError('请输入邮件中的 6–10 位数字验证码。'); setInvalid('code'); codeRef.current?.focus(); return;
    }
    void run('verify', async () => {
      const { data, error: failure } = await client.auth.verifyOtp({ email: sentTo, token: code.trim(), type: 'email' });
      if (failure) throw failure;
      if (!data.session) throw new Error('Missing verified session');
      toast.success('已登录。自选记录仍保存在本机。', { id: 'auth-result' });
    });
  }

  return <div className="auth-form-body">
    {!sentTo ? <>
      <button className="auth-secondary auth-full" disabled={!!busy} aria-busy={busy === 'google'} onClick={() => void run('google', () => startGoogleLogin(client))}>
        {busy === 'google' ? <LoaderCircle className="auth-spinner" size={20}/> : <GoogleMark/>}使用 Google 登录
      </button>
      <div className="auth-divider"><span>或使用邮箱</span></div>
      <form noValidate onSubmit={send} aria-busy={!!busy}>
        <label className="auth-label" htmlFor="auth-email">邮箱地址</label>
        <input ref={emailRef} id="auth-email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254} placeholder="name@example.com" value={email} disabled={!!busy} aria-invalid={invalid === 'email'} aria-describedby="auth-email-hint auth-error" onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onChange={e => { setEmail(e.target.value); setInvalid(null); setError(''); }}/>
        <p className="auth-hint" id="auth-email-hint">无需密码，首次验证邮箱后将自动创建账户。</p>
        <button className="primary-button auth-full" type="submit" disabled={!!busy || remaining > 0}>
          {busy === 'send' ? <LoaderCircle className="auth-spinner" size={18}/> : <Mail size={18}/>}{remaining > 0 ? `${remaining} 秒后可发送` : '获取验证码'}
        </button>
      </form>
    </> : <>
      <div className="auth-sent" role="status"><Mail size={20}/><p>验证码已发送至<strong>{sentTo}</strong><span>请查看收件箱或垃圾邮件。</span></p></div>
      <form noValidate onSubmit={verify} aria-busy={!!busy}>
        <label className="auth-label" htmlFor="auth-code">邮箱验证码</label>
        <div className="auth-code-field"><input ref={codeRef} id="auth-code" type={showCode ? 'text' : 'password'} inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={code} disabled={!!busy} aria-invalid={invalid === 'code'} aria-describedby="auth-code-hint auth-error" onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onChange={e => { setCode(e.target.value); setInvalid(null); setError(''); }}/><button className="auth-reveal" type="button" aria-label={showCode ? '隐藏验证码' : '显示验证码'} aria-pressed={showCode} onClick={() => setShowCode(v => !v)}>{showCode ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
        <p id="auth-code-hint" className="auth-hint">输入邮件中的数字验证码。</p>
        <button className="primary-button auth-full" type="submit" disabled={!!busy}>{busy === 'verify' ? <LoaderCircle className="auth-spinner" size={18}/> : <Check size={18}/>}验证并登录</button>
      </form>
      <div className="auth-code-actions"><button className="text-button" disabled={!!busy} onClick={() => { setSentTo(''); setCode(''); setError(''); setInvalid(null); requestAnimationFrame(() => emailRef.current?.focus()); }}><ArrowLeft size={15}/>更换邮箱</button><button className="text-button" disabled={!!busy || remaining > 0} onClick={() => send()}>{busy === 'send' ? '正在发送…' : remaining > 0 ? `${remaining} 秒后重发` : '重新发送验证码'}</button></div>
    </>}
    <div id="auth-error" className="auth-feedback" role="alert">{error}</div>
  </div>;
}

export function AccountControl({ runtime, session, expired, onSignedOut }: {
  runtime: AuthRuntime; session: Session | null; expired: boolean; onSignedOut: () => void;
}) {
  const [open, setOpen] = useState(runtime.callback);
  const [retryAt, setRetryAt] = useState(0);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState(runtime.error);
  const [busy, setBusy] = useState(false);
  const signingOut = useRef(false);
  async function signOut() {
    if (!runtime.client || signingOut.current) return;
    signingOut.current = true; setBusy(true); setError('');
    try {
      const { error: failure } = await runtime.client.auth.signOut({ scope: 'local' });
      if (failure) throw failure;
      onSignedOut(); setSentTo(''); setOpen(false); toast.success('已退出登录，本机自选记录已保留。', { id: 'auth-result' });
    } catch (failure) {
      const { data } = await runtime.client.auth.getSession();
      if (!data.session) {
        onSignedOut(); setSentTo('');
        setError('已从本机退出，但暂时无法确认服务器会话已撤销。请稍后重新登录。');
      } else setError(authError(failure));
    }
    finally { signingOut.current = false; setBusy(false); }
  }
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger className="auth-trigger" aria-label={session ? '我的账户' : '登录'}><UserRound size={16}/>{session ? '我的账户' : '登录'}</SheetTrigger>
    <SheetContent className="auth-sheet" showCloseButton={false}>
      <SheetHeader className="auth-heading"><div className="eyebrow">EVENTS PRO · 赛事自选</div><SheetTitle>{session ? '我的账户' : '登录赛事自选'}</SheetTitle><SheetDescription>{session ? '查看当前账户，管理登录状态。' : '选择 Google 或邮箱验证码，继续你的赛事计划。'}</SheetDescription><SheetClose className="auth-close" aria-label="关闭登录窗口"><X size={20}/></SheetClose></SheetHeader>
      <div className="auth-scroll">
        {error && <div className="auth-notice" role="alert">{error}{runtime.client && <button className="text-button" onClick={() => setError('')}>重新尝试</button>}</div>}
        {!runtime.client ? <div className="auth-unavailable"><p>你可以继续浏览赛事和管理本机自选。</p><button className="auth-secondary auth-full" onClick={() => window.location.reload()}>重新检查登录服务</button></div> : session ?
          <div className="auth-account"><span className="auth-avatar"><UserRound size={26}/></span><p className="auth-account-label">已登录</p><strong className="auth-account-email">{session.user.email || 'Google 账户'}</strong><button className="auth-secondary auth-full" disabled={busy} aria-busy={busy} onClick={() => void signOut()}>{busy ? <LoaderCircle className="auth-spinner" size={18}/> : <LogOut size={18}/>}退出登录</button></div> : <>
            {expired && <p className="auth-notice" role="status">登录已结束，请重新登录。本机自选记录已保留。</p>}
            <LoginForm client={runtime.client} retryAt={retryAt} setRetryAt={setRetryAt} sentTo={sentTo} setSentTo={setSentTo}/>
          </>}
        <div className="auth-local-note"><HardDrive size={17}/><p>自选和日程仍保存在当前浏览器，登录后也不会自动同步到其他设备。</p></div>
        <SheetClose className="text-button auth-continue">继续浏览赛事</SheetClose>
      </div>
    </SheetContent>
  </Sheet>;
}

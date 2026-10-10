# 登录系统（已实现，默认关闭）

2026-10-09 新增可选手动云端备份/恢复及账号删除代码；2026-10-10 已收到本人公开项目配置并通过真实接口只读连接检查，业务表/权限、函数和实际认证仍待配置验收。AUTH/CLOUD 仍关闭；登录本身不会上传或迁移数据。后续配置、当前边界和真实验收见 [SUPABASE-SETUP.md](SUPABASE-SETUP.md)。

当前交付不启用登录，也不部署或创建远端账户服务。`.env.example` 中 `VITE_AUTH_ENABLED=false`；没有新增真实凭据。赛事浏览、自选、日程和备份仍可离线使用。

## 已实现的流程

- Google OAuth，使用 Supabase 官方 SDK 的 PKCE 流程；Google 端凭据只配置在认证服务中。
- 邮箱数字验证码：发送、60 秒重发间隔、验证、首次验证创建账户、错误与过期重试。验证码仅存在表单内存中，关闭窗口清除；收件邮箱与倒计时在当前页面内保留，刷新后清除。
- 登录状态恢复、SDK 自动刷新会话、当前浏览器会话退出、同源其他标签页同步登录状态。
- Google 返回后先清理地址栏中的回调参数，再恢复登录前的赛事、页面、筛选与日历选择。返回目标限定为本站原路径与允许的赛程 hash 字段。
- 网络、限流、无效验证码、取消授权、失效回调和存储受限均有中文提示。登录失败仍可继续使用本机赛程。

默认关闭的首版账户与本机赛程是分开的：**不上传、不合并、不按账户迁移自选数据**。后续可选在线云备份由用户手动确认，区别见上述配置指南。同一浏览器的不同账户仍看到同一份本机记录；界面明确说明没有跨设备同步。登录入口不是权限校验，当前没有新增任何受保护的远端业务数据。

## 将来启用前的配置

以下步骤留给后续启用阶段，本次未执行。

1. 创建自己的 Supabase 项目。开启 Email 和 Google 登录，允许新用户注册。浏览器仅使用项目 URL 与 `sb_publishable_…` 公钥；代码拒绝 secret/service-role 密钥。
2. 为邮件配置可投递的 SMTP 服务。将 Authentication 的 Magic Link 模板替换为 [验证码邮件模板](supabase/templates/email-otp.html)，其中 `{{ .Token }}` 会生成数字验证码。UI 接受 6–10 位；服务端配置需一致。建议把有效期设置为 10 分钟，重发间隔至少 60 秒，并配置服务端限流。前端倒计时只改善交互，不能代替服务端限流。
3. 在 Google Cloud 创建 Web OAuth Client，把 **Supabase 控制台显示的 callback URL** 配置为授权重定向 URI；将 Google Client ID/Secret 填入 Supabase Google provider。按正式域名完成 Google 同意屏幕和发布配置。Google Secret 不进入项目代码或 `VITE_` 环境变量。
4. Supabase URL Configuration 的 Site URL 设置为实际网页地址；Redirect URLs 精确允许实际路径加 `?auth=callback`，如 `https://events.example.com/?auth=callback`。本地调试可单独允许 `http://127.0.0.1:5173/?auth=callback`。避免生产通配回调地址。应用部署在子目录时保留该子目录，例如 `/planner/?auth=callback`。
5. 后续决定启用时，才把 `.env.example` 复制为不提交 Git 的 `.env.local`，填入公钥配置，并将 `VITE_AUTH_ENABLED` 改成 `true`。Vite 变量是构建时配置，需要重启开发服务或重新构建。
6. 在线版使用 `npm run build:web`，输出 `web-dist/`，通过 HTTPS 静态托管。构建本身不会部署。不要把在线版本作为 `file://` 双击页面使用；静态站点应设置适合其域名和认证服务的 CSP 等安全响应头。

`npm run build` 始终强制关闭认证，生成原有 `local-dist/` 和离线 HTML；即使本地环境变量写了 `true`，离线构建也不会包含认证 SDK、显示登录按钮或发出认证请求。单文件 CSP 继续禁止网络连接。

## 会话与数据边界

这是浏览器 SPA 的 SDK 持久会话方案：Supabase 会话位于当前源的 `localStorage`，键为 `events-pro-auth-session`；PKCE 校验器由 SDK 管理。会话刷新与跨标签页通知由 SDK 负责。邮箱验证码不写入 URL、日志、备份或持久存储。Google 返回位置只临时存在 `sessionStorage`，消费后删除。

前端只持有公共应用密钥，不处理 Google 密钥，也不自行生成或校验认证令牌。未来若增加云端自选、会员或其他受保护数据，必须另外实现服务器 JWT 校验与 RLS/授权；不得依据当前页面的账户显示来授权。上线前还需对实际托管域名、脚本来源、邮件服务、账户生命周期和隐私文案进行正式配置。

退出登录请求撤销当前登录会话的刷新能力，并清除浏览器中的 SDK 会话；已签发 access token 的生命周期由 Supabase 控制，不声称立即撤销所有设备的 access token。当前 SDK 在远端退出失败时也会清除本机会话，此时界面明确提示“已从本机退出，但暂时无法确认服务器会话已撤销”，不虚报远端成功，也不恢复旧令牌。退出不清空赛程存储。

## 文件与验证

| 文件 | 职责 |
| --- | --- |
| `lib/auth/config.ts` | 默认关闭、配置检查、字段校验、安全错误消息 |
| `lib/auth/client.ts` | 官方认证客户端、PKCE、回调清理与返回状态 |
| `components/auth/` | 账户状态、Radix 登录面板、Google/邮箱流程 |
| `local-entry.tsx` | 启用条件与惰性加载；回调处理先于赛程初始化 |
| `scripts/build-local.mjs` | 离线发布强制关闭认证 |
| `tests/auth.test.mjs` | 开关、配置、校验、回调与跳转边界 |
| `tests/auth-ui.test.mjs` | 隔离浏览器中的完整认证交互；所有认证响应均为本机测试替身 |

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:ui
npm run test:auth:ui
```

认证浏览器测试只为自己的临时 Vite 服务器注入假公钥和测试开关；不修改 `.env`，不发送真实邮件，也不访问 Google 或 Supabase。截图和报告位于 `.sites-runtime/qa/auth/`。可用 `CHROMIUM_EXECUTABLE` 指向已有 Chrome。上线前仍需要使用真实测试账户验证 Google 同意屏幕、允许的回调域名、SMTP 投递与验证码、限流策略，以及会话过期和退出。

本次验证（2026-10-02）：TypeScript、ESLint、全部单元测试与原有离线浏览器测试通过；认证模块的 9 项单元检查和 18 项浏览器检查通过；严格 UI 审计零问题。DESIGN.md 校验零错误，保留原有 7 项描述性 token 引用警告。带测试凭据的独立在线生产构建成功；即使测试进程传入启用标志，离线构建仍排除认证 SDK。没有创建 `.env.local`，没有部署或启用真实登录服务。

实现依据：[Supabase 邮箱 OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless)、[Google 登录](https://supabase.com/docs/guides/auth/social-login/auth-google)、[PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)、[会话退出](https://supabase.com/docs/guides/auth/signout)。

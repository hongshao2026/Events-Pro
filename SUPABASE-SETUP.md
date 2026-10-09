# Events Pro 的 Supabase 配置与验收

2026-10-09：代码准备阶段。没有创建、连接或部署真实 Supabase 项目；没有发送邮件或上传个人计划。iOS 与单文件首版继续免费、离线，强制关闭登录与云端功能。这里的配置面向后续可选在线网页版本；不能通过打开 `.env` 开关让现有 iPhone 版本支持登录。

## 已准备的能力

- 既有 Google PKCE / 邮箱数字验证码登录保留，`VITE_AUTH_ENABLED=false`。
- 新增 `VITE_CLOUD_ENABLED=false`，需要登录同时启用。只有用户点击“查看云端备份”后才读取云端；只有再次确认后才上传或恢复。
- 每个账号一份最新快照，包含参赛自选、预算方式及个人/管理设置；令牌、验证码、登录记录和文件不进入快照。两种本机 JSON 备份格式不变。
- 上传通过数据库版本比较拒绝旧设备覆盖；发生冲突后必须重新查看，再决定替换。恢复会检查确认期间的本机变化，并一起写入两份数据；失败不会报告恢复成功。当前不做后台自动同步、逐场次合并、离线上传队列或云端历史版本。
- 本机计划仍由设备共用，不按登录账号自动切换；界面明确提示核对上传账号。退出、换账号、删除账号都不自动删除本机计划。新账号不会自动继承云端备份；云端权限始终按账号隔离。
- 删除账号仅接受本人已验证会话和明确确认，先撤销会话再删除用户；外键级联清除该账号的云端快照。失败如实提示；原本机计划、导出文件和其他设备的本机副本保留。
- iOS 使用 Preferences / UserDefaults 的单份原子快照，启动时从三个已知旧 WebView 键迁移。成功后以原生快照为准，保留旧原始记录用于故障保护；“清除本机记录”覆盖原生快照和三个旧键。读取失败不载入空白计划，写入成功后才更新界面。

## 轮到运营者时，先做这三件事

1. 本人注册或登录 [Supabase](https://supabase.com/dashboard)，创建自己的组织和项目，先选 **Free**。按实际主要用户所在地选择区域；不要为了测试先付费。数据库密码存入自己的密码管理器，不发到聊天、不提交仓库。
2. 从项目 Connect / API Keys 页面取得 **Project URL** 和 **Publishable key (`sb_publishable_…`)**。这两项是公开客户端配置，可以用于接入。不要提供 Secret key、service_role、数据库密码、访问令牌或邮件密码。
3. 决定测试网页地址和发送验证码使用的邮箱域名。没有正式域名时先使用准确的本地测试地址；主体、支持邮箱及隐私政策仍以本人最终信息为准。

有了项目后，开发者可以继续执行迁移、函数部署和接入；本人完成 Supabase 登录授权及邮件供应商账号验证。操作不得借此启用当前离线首版或上传原有个人数据。

## 数据库与函数接入

版本化 SQL：[云备份迁移](supabase/migrations/20261009152426_events_pro_cloud_backups.sql)。它用官方 CLI `migration new` 建立文件，不含用户数据。只在新项目或已核对的开发数据库运行；表名冲突时先检查现有结构，不删表、不覆盖已有业务。

- 表 `public.events_pro_backups`：`user_id` 主键/`auth.users` 外键、`revision`、`updated_at`、JSON `payload`。每个账号最多一份快照，大小限制约 1 MB。
- 全表 RLS；撤销 PUBLIC/anon 权限，明确授予 authenticated 所需权限，分别约束 SELECT、INSERT、UPDATE、DELETE 为本人。所有权不能依据 user_metadata 判断。
- `save_events_pro_backup(expected_revision, backup_payload)` 使用 security invoker 与空 search_path，继续受 RLS 保护；用户身份来自 `auth.uid()`。不存在时只接受版本 0，之后必须匹配当前版本。冲突代码 `40001`；不强行重试覆盖。
- 函数：[delete-account](supabase/functions/delete-account/index.ts)。部署前将 `EVENTS_PRO_ALLOWED_ORIGINS` 设置为实际网页 origin（协议、域名、端口；没有路径），多项用逗号分隔。默认未配置不允许浏览器跨源调用。Supabase 平台的服务端环境持有 admin key；密钥绝不放入 `VITE_` 配置或 App。
- 保留函数网关 JWT 验证，函数内再次通过 Auth `getUser(token)` 验证用户。仅验证令牌文本或接受 body 中的 user_id 都不够。

本机原有全局 Supabase CLI 二进制签名无效，未改动它。准备过程使用隔离的 `npm exec --yes --package=supabase@2.120.0 -- supabase …`。后续登录/部署前先查看当前 CLI `--help`，再用本人浏览器授权、项目 ref 连接；没有在本次开发中运行远端 db push、函数部署或登录。

## 登录与邮件

延用 [AUTH.md](AUTH.md) 的邮箱数字验证码与 Google 配置。正式邮件须配置自有 SMTP；使用 [数字验证码模板](supabase/templates/email-otp.html)，匹配服务端有效期和限流。邮件服务可能另有费用，Supabase Pro 不会自动完成邮件配置。

Google 的 provider callback 使用 Supabase 控制台给出的确切 URL。网页 Site URL 和 Redirect URLs 精确匹配实际源和 `?auth=callback` 路径，不使用生产通配符。Google secret 只放服务端控制台。

iOS 的认证模块目前仍强制关闭。未来启用前需单独完成原生回调、Keychain 会话存储、Apple/Google 登录适配、真实设备测试及账号删除验证；不能复用网页 localStorage 会话方案作为原生安全会话。若提供 Google 主账号登录，需评估并提供符合 Apple 4.8 的等效登录选项。

## 启用与正式验收

配置放在 Git 忽略的 `.env.local`；只填 Project URL 与 Publishable key。只有决定验收后续在线版本时，才将 AUTH 与 CLOUD 两项开关改为 true，并用 `npm run build:web` 构建。iOS 和单文件构建继续把这两个开关强制设为 false。

先用两个全新测试账号，不导入本人计划，验证：

- 真实邮箱投递、验证码过期/限流、Google 回调、会话刷新与退出。
- A 上传后，B 没有 A 的备份，直接调用 API 也无法读取/修改 A 的记录。
- 两个设备同时读取同一云版本，第二次提交必须冲突；取消、断网、会话过期及写入失败不声称成功。
- 备份到第二台设备恢复后，参加/关注、预算、设置完整；清除本机不会自动恢复云备份；账号切换不自动上传或覆盖。
- 真实 delete-account 部署、CORS 和 JWT 验证；删除测试账号后云记录消失，旧令牌无法新建该用户的备份，本机记录仍保留。撤销刷新会话不等于立即使所有已签发访问令牌失效。
- Supabase Security Advisor、真实权限与函数日志；本地 PostgreSQL 检查不能替代它们。

在线版本上线前按实际数据流更新运营主体、隐私政策和商店声明，并确认服务和邮件预算。正式云服务可评估 Pro（避免低活跃暂停及获得自动数据库备份）；本机 JSON 导出仍保留。当前离线首版不需要付费 Supabase。

官方依据：[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、[函数认证](https://supabase.com/docs/guides/functions/auth)、[账号删除 API](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)、[邮件配置](https://supabase.com/docs/guides/auth/auth-smtp)、[原生存储](https://capacitorjs.com/docs/apis/preferences)、[Apple 登录要求](https://developer.apple.com/app-store/review/guidelines/#login-services)。

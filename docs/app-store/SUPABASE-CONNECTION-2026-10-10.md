# Supabase 实际连接准备（2026-10-10）

目录 `/Users/hongshao/Developer/Events-Pro-account-storage`，独立分支 `codex/account-storage`，本轮基线 `905c1a7`。没有修改 main 或原 Mac/iOS 工作区。本轮只保存本人提供的公开客户端配置、检查真实接口与现有结构，并准备执行步骤；没有启用应用认证或云功能。

## 已实际完成

- 公开 Project URL / Publishable key 已存入仅本机的 `.env.local`，权限 0600，`git check-ignore` 确认忽略；两项功能开关仍为 false。完整配置不进入提交或验收正文。
- 真实 `GET /auth/v1/health` 与 `/auth/v1/settings` 均返回 200，验证项目和公钥可用。邮箱 provider 为开启，Google 为关闭，注册未禁用且邮箱需确认。provider 开启不是邮件投递或登录完成的证据。
- 不取任何业务行的备份表请求返回 404 / PGRST205；通过本人已有 Safari 登录会话，SQL Editor 执行只读 `to_regclass` / `to_regprocedure`，确认 `public.events_pro_backups` 与 `public.save_events_pro_backup(integer,jsonb)` 均不存在。
- 删除函数 OPTIONS 返回 404 / NOT_FOUND，未部署该接口。没有调用账号删除、注册或验证码发送接口。
- `npm run build:web`、`ios:sync`、`ios:check` 均通过；网页/iOS 的关闭功能构建不包含本项目 URL 或公钥。iOS JS SHA-256 为 `7bc03378afa4c9ef39e2369e60e829a08e82ff4f174bc4ff19089aa5700d2d9f`，与上一轮通过真实迁移验收的离线源码包逐字相同。本轮未重复 Swift/XCTest，也未更新用户预览安装。
- 临时真实连接证据保存在忽略目录 `.sites-runtime/qa/supabase-project-2026-10-10/connection.json`；只保存公钥摘要及状态，不保存完整公钥、管理令牌、个人记录或邮件内容。

## 待执行的具体动作

Safari 中已准备原版本化迁移的 `BEGIN` / `COMMIT` 事务包装。仅创建云备份表、四条本人访问 RLS 策略、authenticated 明确权限和比较版本的保存函数；匿名权限被撤销，快照限制约 1 MB。没有删除或覆盖现有表的语句。

通过电脑界面新增数据库访问权限，电脑操作工具要求在执行时确认。脚本已填入 SQL Editor，尚未点 Run；执行确认仍待本人回复，不能把准备完成写成实际数据库部署。CLI 自动模式不支持交互登录；显式交互模式未完成授权并已取消，未创建管理令牌。

表创建后需复核实际 RLS、授权、函数 search_path/security invoker 和 Security Advisor。删除函数部署、来源白名单、SMTP、验证码模板、准确回调地址、两个真实测试账号的隔离/冲突/删除与恢复仍待完成。当前仅执行真实只读 API/数据库元数据检查，不能替代完整 Supabase Auth 或云备份验收。

首版离线、默认关闭认证的方向不变；公开运营信息、签名、真实 iPhone、Archive、TestFlight 与正式提交继续待本人条件。操作指南见 [SUPABASE-SETUP.md](../../SUPABASE-SETUP.md)。

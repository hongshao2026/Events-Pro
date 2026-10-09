# 原生存储及可选云服务准备（2026-10-09）

工作目录：`/Users/hongshao/Developer/Events-Pro-account-storage`；分支 `codex/account-storage`。从 main `f380631` 建立，快进带入这条任务已验收的 `codex/mac-ios-validation` / `ff05241`，不改动主目录或其他工作区。

## 交付范围

- 本机计划/设置统一通过 lib/device-storage.ts 读写。网页仍用旧 localStorage 键；iOS 用 @capacitor/preferences 8.0.1 的 EventsPro UserDefaults 单份快照。
- 启动先迁移或读取原生快照，再显示计划；迁移保留旧原始内容，读取失败显示重新读取入口，不显示空计划。写入和恢复串行，异步存储成功后才更新界面、关闭详情或移动焦点。
- 两份 JSON 导出格式不变；清除处理原生快照及三个旧 WebView 键，保留无关数据；清除后的空原生快照防止旧数据再次迁回。
- 可选在线网页的手动云备份/恢复、版本比较及账户删除。每个账号一份最新快照，包含两类数据；登录不自动上传，账号切换不会默默迁移设备计划。云操作使用独立 profile slot，避免与页头账户控件重复实例。
- RLS、显式权限、CAS RPC、账户删除服务端代码和本人配置说明；没有启用实际服务、创建远端项目、发送邮件或上传数据。iOS/单文件仍强制关闭 AUTH/CLOUD。
- Preferences 许可加入原生完整声明（67 项），UserDefaults 理由 CA92.1 加入 PrivacyInfo.xcprivacy。PGlite 仅用于开发测试，不进入 App。

## 当前验证

本地 PostgreSQL（PGlite/WASM）已真实执行最终 SQL，验证 anon 拒绝、账号 SELECT/INSERT/UPDATE/DELETE 隔离、伪造所有权拒绝、CAS 旧版本拒绝、错误快照拒绝及账户删除级联。JWT 身份由测试替身注入，不是 Supabase Auth 验收。

云端 UI 使用隔离 Vite 开关和模拟 Auth/REST/Functions；验证无自动上传、查看/确认/取消、版本冲突、本机变更拒绝旧恢复、两份数据恢复、删除账号失败/重试以及保留本机记录。服务器 handler 独立检查来源、确认、验证身份、先撤销会话及失败路径；Deno 2.9.6 的 `deno check` 通过实际函数入口。没有部署运行 Edge Function。

桌面 WebKit 模拟 Preferences 验证原始 v1 迁移、写入延迟不提前更新 UI、失败保留和重试、原生快照重新读取、清除两个本机副本以及原生读取错误/坏快照不载入空白计划。它不是真实 iOS。

全量 verify 与真实 Swift/模拟器结果待本次最终验收补录。临时报告保存在忽略目录 `.sites-runtime/qa/cloud/`、`device-storage/` 和 `ios-simulator/`；不提交测试账号会话或个人备份。

## 真实服务与发行条件

[SUPABASE-SETUP.md](../../SUPABASE-SETUP.md) 给出本人创建 Free 项目、Project URL / Publishable key、迁移、邮件与回调、函数来源及正式验收步骤。真实 Google/邮箱、跨设备请求、Supabase Advisor、服务端删除及生产配置未验证。

现有原生首版不开放账号。未来原生认证仍须实现并验证原生回调、Keychain 会话及符合 Apple 要求的登录选项；当前网页会话不得直接当作原生安全会话。启用在线版前需更新真实政策、数据声明及运营信息。

Apple 身份/会员、签名、真机、最终 Archive、TestFlight、正式主体/域名/支持信息与提交仍待本人条件；本功能不改变其 pending 状态。

# 原生存储及可选云服务准备（2026-10-09）

工作目录：`/Users/hongshao/Developer/Events-Pro-account-storage`；分支 `codex/account-storage`。从 main `f380631` 建立，快进带入这条任务已验收的 `codex/mac-ios-validation` / `ff05241`，不改动主目录或其他工作区。

## 交付范围

- 本机计划/设置统一通过 lib/device-storage.ts 读写。网页仍用旧 localStorage 键；iOS 用 @capacitor/preferences 8.0.1 的 EventsPro UserDefaults 单份快照。
- 启动先迁移或读取原生快照，再显示计划；迁移保留旧原始内容，读取失败显示重新读取入口，不显示空计划。写入和恢复串行，异步存储成功后才更新界面、关闭详情或移动焦点。
- 两份 JSON 导出格式不变；清除处理原生快照及三个旧 WebView 键，保留无关数据；清除后的空原生快照防止旧数据再次迁回。
- 可选在线网页的手动云备份/恢复、版本比较及账户删除。每个账号一份最新快照，包含两类数据；登录不自动上传，账号切换不会默默迁移设备计划。云操作使用独立 profile slot，避免与页头账户控件重复实例。
- RLS、显式权限、CAS RPC、账户删除服务端代码和本人配置说明；没有启用实际服务、创建远端项目、发送邮件或上传数据。iOS/单文件仍强制关闭 AUTH/CLOUD。
- Preferences 许可加入原生完整声明（67 项），UserDefaults 理由 CA92.1 加入 PrivacyInfo.xcprivacy。PGlite 仅用于开发测试，不进入 App。

共享接口：local-store 与 app-settings 经统一 device-storage 读写；写入在网页保持同步，在 iOS 返回 Promise，所有 UI 写入/清除/恢复等待完成并共享串行队列。原生入口初始化成功才挂载 Planner；profile 新增独立 cloudBackup slot，不在重复的页头账户控件中挂载云操作。

## 当前验证

本地 PostgreSQL（PGlite/WASM）已真实执行最终 SQL，验证 anon 拒绝、账号 SELECT/INSERT/UPDATE/DELETE 隔离、伪造所有权拒绝、CAS 旧版本拒绝、错误快照拒绝及账户删除级联。JWT 身份由测试替身注入，不是 Supabase Auth 验收。

云端 UI 使用隔离 Vite 开关和模拟 Auth/REST/Functions；验证无自动上传、查看/确认/取消、版本冲突、本机变更拒绝旧恢复、两份数据恢复、删除账号失败/重试以及保留本机记录。服务器 handler 独立检查来源、确认、验证身份、先撤销会话及失败路径；Deno 2.9.6 的 `deno check` 通过实际函数入口。没有部署运行 Edge Function。

桌面 WebKit 模拟 Preferences 验证原始 v1 迁移、写入延迟不提前更新 UI、失败保留和重试、原生快照重新读取、清除两个本机副本以及原生读取错误/坏快照不载入空白计划。它不是真实 iOS。

源码提交 `e75e7550627c2ae9054a5aa99531117a834dc050` 已提交并推送到独立分支，未合入 main；[草稿 PR #3](https://github.com/hongshao2026/Events-Pro/pull/3) 以 `codex/mac-ios-validation` 为基线。所有服务开关仍关闭，提交源码不代表部署或启用。

- 本机 `npm run verify` 退出码 0；其后仅在线云模块的会话绑定/坏本机记录恢复修补另通过 lint、typecheck、云 SQL/单元及 UI 检查。同一最终源码的 [GitHub 全量检查](https://github.com/hongshao2026/Events-Pro/actions/runs/37954561197) 通过。
- Xcode 27.0 / macOS 27.0.1 本机真实 Swift 模拟器编译 `BUILD SUCCEEDED`；[远程两型号原生检查](https://github.com/hongshao2026/Events-Pro/actions/runs/37954561427) 也全部通过。
- 本机 iPhone 16 Pro / iOS 27.0 真实 XCTest：首次流程 1 项通过、0 失败；KPC 两项参加/一项关注、列表直接移除、自选预算 ₩1,600,000、条件日历、PNG 预览/系统分享取消与重试、两类 JSON 原生分享入口及重启保留通过。系统分享菜单可用不代表文件已实际保存或恢复。
- 同源码只提升 CFBundleVersion 1→2，保留安装覆盖后只读 XCTest 1 项通过、0 失败；计划、预算和日历保留。这项单独结果不是旧 WebView→新 Preferences 的代码迁移验证。
- 原生报告：`.sites-runtime/qa/ios-simulator/1791560947618-iPhone-16-Pro/results.json`；源提交 `e75e755`。首页原图为 1206×2622 不透明 JPEG，SHA-256 `7ae5fed443f149d7d87c1f59a1b6b0f01278a2c8617729f91580aa5e038dab07`。

2026-10-10 旧代码→新代码迁移复验通过，脚本退出码 0：旧 WebView App `ff05241` / 构建 1，在新建 iPhone 16 Pro / iOS 27.0 上通过真实 UI 建立两项参加、一项关注；向隔离 WebView 数据库加入 username=`Migration QA`、currency=`USD` 的设置样本。原地覆盖安装 `e75e755` / 构建 2 后，只读原生 XCTest 1 项通过、0 失败，自选、₩1,600,000 预算和条件日历保留。最终读取实际 `UserDefaults.standard` 中 `EventsPro.events-pro-device-store-v1`，两份旧原始字符串完全一致，活动选择为 3 项，测试设置保留。

- 完整报告 `.sites-runtime/qa/storage-migration/1791562617672/results.json`，`success=true`；旧 UI 和覆盖后 UI 各 1 项通过、0 失败。
- 迁移前后两份原始字符串的组合 SHA-256 均为 `45d7f0e1c6b0a19febb8d117a3027ce85abe577086117f2677ccfd864b4dc2f3`。
- 实际旧 App JS SHA-256 `7c81239f70c3ed1a61a82bf96a204b9b5d79882137d84a3e0c9ffc085db01c2f`；新 App JS SHA-256 `7bc03378afa4c9ef39e2369e60e829a08e82ff4f174bc4ff19089aa5700d2d9f`，分别核对不含/包含原生存储键，避免误测同一构建。
- 两轮验证器失败保留：第一轮只按旧 `.localstorage` 文件名查找且未禁用测试克隆；第二轮原生 UI 两阶段通过，但将 Preferences group 误当独立 suite 文件。最终脚本适配 iOS 27 的 `localstorage.sqlite3`，禁用并行克隆，按 Preferences 8 的实际标准 UserDefaults 键前缀读取后完整通过。它们不是应用验收通过的替代证据。

临时报告保存在忽略目录 `.sites-runtime/qa/cloud/`、`device-storage/`、`ios-simulator/` 和 `storage-migration/`；不提交测试账号会话或个人备份。用户原有预览与记录未用于本次迁移测试，也未卸载或清除；本轮未将该功能安装到原有预览设备。

迁移复验使用 `scripts/ios-storage-migration.mjs`。要求旧工作区保留已验证的 WebView App 和 UI 测试产物，新工作区已编译含 Preferences 的较高构建（本次为 1→2）；脚本不重新生成或修改旧源码。示例：

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
EVENTS_PRO_LEGACY_WORKTREE=/Users/hongshao/Developer/Events-Pro-mac-ios \
node scripts/ios-storage-migration.mjs
```

脚本只创建、检查和删除自身新建的 QA 模拟器；先通过真实 UI 创建旧计划，再向该隔离设备的 WebView 数据库加入明确的设置测试样本，覆盖安装后使用只读 XCTest 核对计划，并读取实际 UserDefaults 快照比对两份原始字符串。设置样本注入不能写成用户通过 UI 编辑设置的验收。

## 真实服务与发行条件

[SUPABASE-SETUP.md](../../SUPABASE-SETUP.md) 给出本人创建 Free 项目、Project URL / Publishable key、迁移、邮件与回调、函数来源及正式验收步骤。真实 Google/邮箱、跨设备请求、Supabase Advisor、服务端删除及生产配置未验证。

现有原生首版不开放账号。未来原生认证仍须实现并验证原生回调、Keychain 会话及符合 Apple 要求的登录选项；当前网页会话不得直接当作原生安全会话。启用在线版前需更新真实政策、数据声明及运营信息。

Apple 身份/会员、签名、真机、最终 Archive、TestFlight、正式主体/域名/支持信息与提交仍待本人条件；本功能不改变其 pending 状态。

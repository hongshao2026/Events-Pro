# Mac 接手与实际验收记录

日期：2026-10-08，续验更新至 2026-10-09（Asia/Shanghai）。当前结论：本机网页/资源检查、模拟器及真机目标的无签名 App、UI 测试目标编译通过；iPhone 16 Pro / Pro Max、iOS 27.0 的真实启动、有限原生功能及同源码构建 1→2 覆盖安装读取通过，各阶段各 1 项 XCTest、0 失败、0 跳过。首轮 iOS 27 JSON 操作新标签失败及修补记录保留，八张本机原图逐图查看并保存。远程 Mac 的 iOS 26.2 流程另记。完整功能矩阵、签名、真机、TestFlight 与正式发行材料尚未完成，尚不具备 App Store 提审条件。

## 仓库与构建身份

| 项目 | 实际结果 |
|---|---|
| 主目录 | `~/Developer/Events-Pro`，新克隆，原目录不存在，没有需转移的本地修改 |
| GitHub / 基线 | `hongshao2026/Events-Pro` 的 main，`f38063171063196033b50aedf9b42df4a1417107`；fetch 后 main 已最新，指定祖先检查退出码 0 |
| 独立工作区 / 分支 | `~/Developer/Events-Pro-mac-ios` / `codex/mac-ios-validation` |
| 修复提交 | `5b81aac`，仅修改首页浏览器测试的跨平台修饰键 |
| 原生验证工具 | `3cc35fa` 增加真实模拟器启动与证据附件，`d31caef` 要求有效 PID，`61a4ea1` 保存 JPEG 与实际 Swift 锁；`945761f` 起增加独立 XCTest 目标，后续补齐两种型号、附件导出、历史证据隔离与控件标签查询 |
| 应用配置 | `1.0.0 (1)`、`com.example.eventspro`；均为当前开发配置，正式 Bundle ID 待用户核定 |
| 发行行为 | 免费、离线，iOS/单文件构建强制关闭登录；未改数据结构、备份格式、共享接口或原生源码 |
| 提交/集成 | 源码与工具提交已推送 `origin/codex/mac-ios-validation`，未合入 main；未签名、Archive 或上传应用 |

## 本机环境与安装结果

- Apple Silicon arm64，macOS 26.4（25E246）。接手时 `xcode-select -p` 为 `/Library/Developer/CommandLineTools`，`xcodebuild -version` 提示需要完整 Xcode；未发现完整 Xcode。
- Homebrew 并存安装 Node.js 24.21.0，项目命令使用 `/opt/homebrew/opt/node@24/bin`，npm 11.19.0。未修改 shell 配置或全局 Node 指向。
- 安装 Node 24 更新共享 simdjson 到 5.0.3 后，旧 Node 25.9.0 缺少 ABI 33 动态库。已从 Homebrew 官方 4.6.1 arm64_tahoe bottle 恢复实际 ABI 33 库，与 ABI 34 并存；校验 SHA-256 `3ff00f35f54b3512111b280def788bfda767e60ee85285729e6f8154ab193f3a`。原 `node --version`、`npm --version`、JSON 与 crypto 运行通过，版本仍为 25.9.0 / 11.12.1。修复缓存位于 `~/Library/Caches/Events-Pro-environment-repair/`。后续 Homebrew 重装 simdjson 时需留意旧 Node 的此兼容库，或正常升级 Node 后复核。
- `npm ci` 成功安装锁定依赖，锁文件未变。Chromium 151 / Playwright v1234 与 WebKit 26.5 / v2336 安装成功。
- Mac App Store 的当前 Xcode 显示要求 macOS 26.6，点击获取后未开始下载安装。已打开 [Apple 官方历史下载](https://developer.apple.com/download/all/?q=Xcode)，页面要求账号本人登录；[兼容表](https://developer.apple.com/xcode/system-requirements) 显示正式 Xcode 26.6 支持本机 macOS 26.4。用户本人完成登录、许可、安装与首次启动。
- 用户已说明尚未注册 Apple Developer Program，优先本地验证。没有代用户注册、验证身份、付费或接受协议。

## 2026-10-09 本机完整 Xcode 续验

用户说明 Xcode 已安装、iOS 仍在安装。11:01–11:02（Asia/Shanghai）实际核对：macOS 已升级为 27.0.1（26A434），`/Applications/Xcode.app` 为 Xcode 27.0（27A266a）。`xcodebuild -checkFirstLaunchStatus` 返回 0，iOS 与 iOS Simulator 27.0 SDK 已安装；`simctl list runtimes` 当时为空，Xcode Downloads 实际显示 iOS 27.0 Simulator（24A434）4.43 / 8.05 GB、55%。没有重复启动下载，也没有代本人接受许可。

全局 `xcode-select` 仍指向 CommandLineTools。本轮命令仅指定 `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`，未修改全局选择。再次 `npm run ios:check` 返回 0，`npm run ios:open` 返回 0，并通过 Xcode 实际界面确认打开的是本工作区 `ios/App/App.xcodeproj`，分支 `codex/mac-ios-validation`。

源码为 `3ece08b2b3cb742094bc086fd5507668c32ca250`，应用代码与 `ce61fc3` 相同。执行真实 `xcodebuild`，目标 Debug / generic iOS Simulator / `CODE_SIGNING_ALLOWED=NO`，11:01:58 构建结束，退出码 0，日志为 `** BUILD SUCCEEDED **`；AppDelegate、SceneDelegate 的 SwiftCompile 已实际执行。产物 `App.app` 为 `com.example.eventspro` / `1.0.0 (1)` / `iphonesimulator27.0`，可执行文件含 arm64 与 x86_64。SPM 实际解析 Capacitor 8.5.3 与 IONFilesystemLib 2.0.0，工程锁文件未变，SHA-256 为 `37aed3e931f98d30be85af6676d8316f594a51b846984847a06e61160dcb8748`。

日志保存在忽略目录 `.sites-runtime/qa/mac-xcode-2026-10-09/xcodebuild-simulator.log`，SHA-256 `3ec582bd76d202292b27b4c5a0d40ffcdc20536926d9dd83c90d8e955181746f`。有 Filesystem 依赖中未使用 `responseType` 和未依赖 AppIntents.framework 的 metadata 提示，没有编译错误；未修改 node_modules 来隐藏提示。这是本机真实 App 编译，不是 Swift 语法解析或浏览器模拟桥；runtime 未就绪，尚不代表本机运行、XCTest 执行、签名或真机通过。下表早期 CommandLineTools 失败作为历史保留。

继续以相同目标执行 `build-for-testing`，11:02:27 完成，退出码 0，`** TEST BUILD SUCCEEDED **`；`PlannerUITests.swift` 在 arm64/x86_64 均真实编译。日志 `xcodebuild-tests.log` 的 SHA-256 为 `ee842345d10b4e3607ec7880ccd6286ea3db02d73d5bcdbc2803c7b97d8e59b7`。测试目标最低 iOS 15 与当前 SDK 的 XCTest / XCUIAutomation 库最低 iOS 17 存在链接提示，未阻止编译；实际测试将在已下载的 iOS 27 runtime 运行，尚未执行，不将构建测试目标记为测试通过。

此前文档提交 `3ece08b` 的远程 [原生 Run 37830621033](https://github.com/hongshao2026/Events-Pro/actions/runs/37830621033) 两型号成功，[Project checks 37830621052](https://github.com/hongshao2026/Events-Pro/actions/runs/37830621052) 也成功。本机 Xcode 27 续验与远程 Xcode 26.3 / iOS 26.2 的结果分开记录。

11:04:55 完成 Debug / generic iOS / `CODE_SIGNING_ALLOWED=NO` 真机目标编译，退出码 0，`** BUILD SUCCEEDED **`；arm64、SDK `iphoneos27.0`、构建号 1。使用独立的忽略目录 DerivedData，不覆盖模拟器测试产物。日志 `xcodebuild-device-unsigned.log` 的 SHA-256 为 `1b6f1c68c3f77b9a0cc29bd2e0008015bee0f259ca9ab16b29d78e790b6b63d1`。这是无签名编译，未连接或安装到真实 iPhone，不是签名、Archive 或 Privacy Report 验收。

11:05 复查 runtime 已可用：iOS 27.0（24A434）。使用现有模拟器工具新建独立 iPhone 16 Pro，真实安装、启动 App，原生首页 JPEG 已查看，显示正常；同时启用原生 UI 与有限构建 1→2 覆盖安装流程，结果须等待实际完成再登记。临时目录 `.sites-runtime/qa/ios-simulator/1791515185887-iPhone-16-Pro/`；没有操作已有模拟器或真机。

首轮实际执行 1 项 XCTest，0 通过 / 1 失败 / 0 跳过，11:11 结束。已正常创建 KPC 两项参加/一项关注、核对自选/预算/条件日历、生成图片，完成图片分享取消与重试，第二次 PNG 菜单原图人工查看正常。随后参赛 JSON 菜单已显示正确文件名与 `JSON · 576 字节`，实际保存操作标签为 `保存到“文件”`；测试只列出旧标签，在 `Native share file action did not become ready` 断言失败。设置 JSON、重启、覆盖安装阶段未执行，不记通过。实际无障碍树、原图、日志和 xcresult 保留；`results.json` SHA-256 为 `a10aec5f8f69399a934a03215e739ef4f8dfccd21de042483cf07076b4d4c67f`。测试补充这一准确标签，保留文件标题、PNG/JSON 格式和原生保存操作的全部要求；操作缺失时额外采集原图，待复验。

另有诊断收集提示 `xcrun: unable to find utility simctl`：全局选择仍为 CommandLineTools，Xcode 的部分诊断子进程未沿用项目级 DEVELOPER_DIR。`sudo -n xcode-select --switch ...` 因需要管理员密码返回 1，没有切换；已请求本人在 Xcode → Settings → Locations 选择 Xcode 27.0 并自行完成管理员验证，不索取密码。功能测试的失败原因是上述 JSON 标签，不将诊断提示误记成 App 编译或数据丢失。

`1974145da295a0fc496de46bb0fe6aa90392226a` 复验：11:19:56 完成 Pro，11:27:24 完成 Pro Max；各型号首次与覆盖安装后独立 XCTest 均 1 项通过、0 失败、0 跳过，实际新原生构建号 2，自选 3/2/1、预算 ₩1,600,000、条件日历保留。PNG / 两类 JSON 正确文件预览和原生操作、取消、图片重试及重启保留通过；实际锁一致、附件无错误。八张无透明原图已逐图查看并原样保存，完整范围、源码、原件目录及结果摘要 SHA-256 见 [本机 iOS 27 报告](LOCAL-IOS-2026-10-09.md)。两轮后普通基线重编译返回 0，DerivedData App 实际恢复构建 1；探针仍不是正式候选。

同一 PR head `1974145` 的 [远程原生 Run 37878360589](https://github.com/hongshao2026/Events-Pro/actions/runs/37878360589) 在 Xcode 26.3 / iOS 26.2 两型号均成功，[Project checks 37878360563](https://github.com/hongshao2026/Events-Pro/actions/runs/37878360563) 完整 verify 成功；与本机 Xcode 27 的原件分别保存和登记。

## 已执行检查

| 检查 | 结果与范围 |
|---|---|
| 第一轮 `npm run verify` | 首页新标签页测试超时：测试固定使用 Ctrl+点击，macOS 需要 Meta；不是产品保存或导航数据回归 |
| `node tests/home-ui.test.mjs` | 改为 Playwright `ControlOrMeta` 后通过，保留新页 URL 与原页不变断言 |
| 修复后 `npm run verify` | 退出码 0：lint、TypeScript、全部单元、离线构建、网页/模拟登录回归、iOS 资源、66 项许可、政策/清除、WebKit 模拟桥；17 份浏览器报告共 153 项检查，无页面错误或非预期远端请求 |
| 随后单独 `npm run ios:sync` / `npm run ios:check` | 退出码 0；离线资源、SPM 同步、配置与隐私/图标/许可登记通过 |
| `plutil -lint` | Info.plist、PrivacyInfo.xcprivacy、Settings.bundle 的 Root/Acknowledgements 四份均 OK |
| `npm run ios:open` | 已执行，Capacitor CLI 返回 0；其实现仅向 macOS 派发打开工程且不等待 Xcode，不能证明 Xcode 已安装或实际打开工程 |
| 本机 `xcodebuild ... CODE_SIGNING_ALLOWED=NO build` | 前置环境失败：只选择了 CommandLineTools，Swift 编译未启动；无本机编译或模拟器运行结果 |
| `npm run release:check -- --online` | 退出码 1，10 项真实缺项；配置不完整，在线 URL 核对尚未执行 |
| 新增模拟器工具的本机静态检查 | `node --check`、lint、TypeScript、单元与 build 通过；最终离线 HTML 无变化。真实 native 执行使用下述远程 CI，不声称已在本机运行 |

开发政策六页及入口已生成至 `legal-site/`，带开发预览及 noindex；未作为正式公开政策托管。网页截图已查看 320px 首页与 390px 置顶页；它们属于浏览器 QA。

完整临时日志保存在工作区 `.sites-runtime/qa/mac-handoff/`（Git 忽略）。保留了 `verify-initial.log`、`home-ui.log`、`verify.log`、`ios-sync.log`、`ios-check.log`、`ios-open.log`、`local-xcodebuild.log`、`release-check.log` 和远程原生构建日志。

| 证据文件 | SHA-256 |
|---|---|
| `verify.log` | `7d33e3212aa7e4cbd832de7b159f35a92db03a8a5e83b0d0b33932cc7221aa02` |
| `remote-ios-compile.log` | `0782503023fbc0a0b001b2a5aa54718a91af2942f1c899fb8ded2d75f0ba8b99` |
| `ios-sync.log` | `9b195ee925c322ee1432cd0111138143b57b04dcdf1acab36819229519f22f54` |
| `ios-check.log` | `8882d035254092bdde79fbe98085c91fa8d131f7bd0c53a66da5b753b49c5919` |

## 远程基线真实 Swift 编译

已触发仓库现有 `iOS simulator compile` 工作流：[Run 37789044340](https://github.com/hongshao2026/Events-Pro/actions/runs/37789044340)，实际源码为完整 `f380631` 基线。2026-10-08 22:03（Asia/Shanghai）完成，结论 `success`。

- GitHub macos-15 runner，Xcode 26.3（17C529），执行真实 `xcodebuild`，日志包含 AppDelegate/SceneDelegate 等 SwiftCompile 和 `** BUILD SUCCEEDED **`。
- 构建目标为 Debug / generic iOS Simulator，arm64 与 x86_64，`CODE_SIGNING_ALLOWED=NO`。
- 实际包解析：capacitor-swift-pm 8.5.3、IONFilesystemLib 2.0.0，Browser/Filesystem/Share 使用锁定 npm 本地包。
- 日志仅有未使用 AppIntents.framework 的 metadata 提取提示，无编译错误。
- 这次基线任务只有编译，没有启动模拟器；随后独立分支增加并实际执行了下述启动检查。没有 Apple 签名、Archive、真机或上传。

## 远程真实 iOS 模拟器启动

[Run 37792355643](https://github.com/hongshao2026/Events-Pro/actions/runs/37792355643)，源码完整 `3cc35fae76aa5e969a22635d064479a00588d122`，2026-10-08 22:27（Asia/Shanghai）完成并成功。GitHub macos-15 / Xcode 26.3（17C529），App 为 `1.0.0 (1)` / `com.example.eventspro`。

- 真实 `xcodebuild` 后，在新建的 iPhone 16 Pro / iOS 26.2 模拟器安装 App，`simctl launch` 返回实际进程 `5153`，十秒后检查进程登记并截图；随后仅关闭、删除该任务自己创建的模拟器。
- 人工查看原生 1206 × 2622 赛事首页，内容、字形、顶部/底部安全区与导航正常，无空白启动。原始 PNG 含 alpha，只作为 QA；不把它记作可直接上传的商店图。
- 下载附件到工作区 `.sites-runtime/qa/remote-ios-startup-37792355643/`；GitHub 附件保留 14 天，本机文件保留。它不是浏览器模拟桥截图。
- 实际 Xcode 生成的 `Package.resolved` 已复制到工程 `ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/` 并在 `61a4ea1` 保存：capacitor-swift-pm 8.5.3 / `4c7f346d16196e21fbe23d4a7a6fc7af62af6742`，ion-ios-filesystem 2.0.0 / `13848aab4f3447ff98dfdbe72ff8ef31bf333db0`。ION 固定提交与当前许可依据一致；本机 Xcode 尚未实际解析。
- [Run 37794750850](https://github.com/hongshao2026/Events-Pro/actions/runs/37794750850) 在源码 `61a4ea1d1b40f1004dba5ac1593dec76cb8c41f3` 再次通过真实编译/启动，确认启动十秒后有效 PID `7917`。直接采集的 `01-events.jpg` 为 1206 × 2622、`hasAlpha: no`，已人工查看正常；实际 Swift 锁与工程保存的文件逐字一致。证据下载至 `.sites-runtime/qa/remote-ios-startup-37794750850/`。
- `61a4ea1` 的启动检查只覆盖安装和首页，不能证明自选、预算、日历、文件分享、导入、升级保留或真机功能。随后 `945761f` 增加原生 XCTest 目标，通过正常界面进行选择/预算/日历/图片预览/同次安装重启检查，无注入数据或模拟插件，排除在 Archive 之外；实际执行结果须另行记录，不能把已写测试视为通过。

| 首次启动证据 | SHA-256 |
|---|---|
| `01-events.png` | `96cc6bcee3413bf6d282b275a3f5fd3d5405a4e069c2f45e6a4c452a649f1a43` |
| `results.json` | `72b23359dd806a3eb600d5d6e86b844b2bafbebbffe7da243a47f7f6ea626f0e` |
| 实际 `Package.resolved` | `37aed3e931f98d30be85af6676d8316f594a51b846984847a06e61160dcb8748` |

| 无透明 JPEG 启动复验 | SHA-256 |
|---|---|
| `01-events.jpg`（`61a4ea1`） | `91fad9f2cf8da63cce0b4e3e6c870fba0805a98367c0d753b59032bc7fdb717f` |
| `results.json`（`61a4ea1`） | `ea20048f6530dba9ade7c60c7dde7776e46b66237978a533fbe1706d09b58522` |

## 原生 XCTest 实际执行与复验

最新 [Run 37827535968](https://github.com/hongshao2026/Events-Pro/actions/runs/37827535968)，head `ce61fc38dc2d25f506c024f2eb3efcfb7fbeb194`、合成源码 `127883909292a4d009b160f9f62d2883b46fc331`，源码树一致：两型号首次和同源码原生构建 1→2 后 XCTest 各 1 项通过、0 失败、0 跳过，最终实际安装构建号 2，Swift 锁一致、附件无错误。PNG 和两类 JSON 文件预览/系统操作、取消与图片重试通过；六张原生原图逐图确认菜单内容及滚动状态栏不再文字重叠，原样保存。完整网页 CI Run 37827536045 也通过。正式发行配置仍为构建 1，此探针不是上传候选；文件保存/恢复、完整可用性、真机/TestFlight 仍未验收，见 [实际系统分享报告](SIMULATOR-SHARING-2026-10-09.md)。

2026-10-09 原生分享附件还确认滚动“我的”页面时货币文字进入状态栏，与系统时间重叠（`37823004699` 两型号 JSON 分享原图）。追加 scoped `native-ios` 固定顶部安全区背景，复用 `--background`、不接收点击，保留文档滚动和现有布局；设计约定同步更新。完整本机 `npm run verify` 退出码 0，日志 `.sites-runtime/qa/mac-handoff/native-safe-area-verify.log`；这是浏览器、资源与模拟桥回归，随后真实滚动截图复验已通过（见上述最新记录），Q10 仍未完整验收。功能分支不提交生成的单文件 HTML。

`0d25c8c` 的 [Project checks 37825629628](https://github.com/hongshao2026/Events-Pro/actions/runs/37825629628) 首次在汇率筛选测试清空韩元输入后的保存按钮处超时（按钮仍禁用）。保留失败日志 `.sites-runtime/qa/mac-handoff/project-37825629628-failed.log`；同源码本机 `buyin-range-ui` 七项全部通过，CI attempt 2 的完整 verify 随后也通过。未复现该失败，原因未确认；没有修改汇率应用逻辑、放宽或删除断言。

分享关闭修正后的 [Run 37823004699](https://github.com/hongshao2026/Events-Pro/actions/runs/37823004699)（head `5e994c773e0ac151701e29ee95a205fa0c6e22c8`，合成源码 `e13c4d4deb69623df9a1f4d1191f9603cfaaaeec`，源码树一致）两型号首次与覆盖安装后 XCTest 各 1 项通过、0 失败、0 跳过；最终实际原生包均为构建 2，Swift 锁一致，无附件导出错误。[Project checks 37823004453](https://github.com/hongshao2026/Events-Pro/actions/runs/37823004453) 完整 verify 通过。原件已下载到 `.sites-runtime/qa/remote-ios-share-37823004699/`；结果 SHA-256：中屏 `a820b15a5aaad716bb9af5064404e1c2e44e967b8bdff1bd4696b6cf3f75babc`，大屏 `657dba2f255aa857c782572f8085de8b6fdda8ab966f4f1794284baecf3e06f7`。人工查看真实附件发现：中屏两次图片菜单均仅显示空容器，控件树没有文件标题和操作项；大屏图片和两型号两类 JSON 菜单内容正常。测试当时仅要求容器存在，不能证明中屏图片分享可用。保留已有取消、预览、错误提示、计划及覆盖安装断言，新增等待实际文件标题/格式/系统操作项就绪后才取消和截图；复验待执行，未声称文件保存、恢复或真实分享送达。

系统分享扩展 [Run 37820536832](https://github.com/hongshao2026/Events-Pro/actions/runs/37820536832)，head `4acdeb3a0bc311b2aea74d9f0ea193e9725f465f`，两型号实际编译通过、UI 测试失败。首次图片分享已出现原生 ActivityListView，显示 PNG 文件名称/大小以及保存图像等系统操作；iOS 26.2 此界面提供 PopoverDismissRegion（“关闭弹出式窗口”）而没有测试假定的 Close/关闭按钮。失败属于测试控件查询，不能推断导出故障；尚未执行成功取消、重试、两类备份或后续覆盖安装。保留全部图片/数量/预算/日历断言，按实际无障碍树修正为确认系统分享界面、点击菜单外的关闭区域并等待界面消失。此轮 Project checks 为 cancelled，不能记作通过。原始附件在 `.sites-runtime/qa/remote-ios-share-37820536832/`，错误日志在 `.sites-runtime/qa/mac-handoff/native-share-37820536832-failed.log`；修正后的真实复验另行登记。

2026-10-09 草稿 PR #2 的最终检查已成功：[网页检查 Run 37810081999](https://github.com/hongshao2026/Events-Pro/actions/runs/37810081999)、[两型号原生检查 Run 37810082036](https://github.com/hongshao2026/Events-Pro/actions/runs/37810082036)。PR head 为 `410f6fc9390ae590ffef1cebb375f94fecc6ff59`，实际测试 GitHub 合成提交 `691a06a18f6f26c0ae1be23cf7dc30bd988fa39a`；已核对其父提交包含 main 与 head，源码树完全一致。两个实际 XCTest 各通过 1 项、0 失败，Swift 锁一致，附件已下载至 `.sites-runtime/qa/remote-ios-ui-37810082036/`。结果摘要 SHA-256：标准尺寸 `e79406fd4f74eaa4528d8a807dbf412d7f8aeb751d79589fa1935cadeca3680d`，大屏 `fdf4842b33faf94beef1e755e1e24ddf122bffa5742af796198dfa0ab44780dc`。仍是原有限范围，不包含覆盖安装。

随后新增可选的同源码高原生构建号覆盖安装探针：先执行原有正常界面流程保存三条计划，实际重新编译并将原生 CFBundleVersion 从 1 递增为 2，同 ID 覆盖安装，再独立 XCTest 读取既有自选、韩元预算与条件日历，不重新创建选择或恢复备份。公开配置仍为构建 1，探针包不是正式候选；设置恢复、变更代码迁移、真机与 TestFlight 不在其范围。实际结果继续单独登记，不据此更新 readiness。

首次探针 [Run 37812989864](https://github.com/hongshao2026/Events-Pro/actions/runs/37812989864)，PR head `2b77d84a1efc777e3d49c7efe863c0f693cec441`、合成源码 `2795577f8d542b84239a3a5547629746e0fb3238`，两组原有功能 XCTest 均 1 项通过、0 失败，更高构建号重新编译及覆盖安装命令完成；随后错误地要求新旧数据容器绝对路径相同，两组均在该断言失败。新构建的数据 UI 测试尚未启动，不能判断数据保留或丢失。原件保存在 `.sites-runtime/qa/remote-ios-upgrade-37812989864/`，完整错误日志另存 `.sites-runtime/qa/mac-handoff/native-upgrade-37812989864-failed.log`。按 [Apple TN2285](https://developer.apple.com/library/archive/technotes/tn2285/) 修正为记录路径是否改变并实际读取既有计划，保留全部数量、金额、日历及实际安装构建号断言；日历复验通过正常导航显式选择 KPC，不编辑存储。

修正后的 [Run 37815336608](https://github.com/hongshao2026/Events-Pro/actions/runs/37815336608) 在 `fa8546983c745785df22803a2a1146a898353d3d`（合成源码 `4f44383689f2ee31366c0b87d029280fbf416f66`、源码树一致）成功。2026-10-09 01:30（Asia/Shanghai）核对：两型号首次和覆盖安装后 XCTest 分别各 1 项通过、0 失败、0 跳过；覆盖安装完成后及第二次测试结束后实际原生构建号为 2，原有 KPC 三条计划、预算 ₩1,600,000 与四条条件日历活动保留。两组均实际改变容器路径，数据保留；无附件导出错误，Swift 锁一致。四张原生 QA 图逐图查看并永久保存，详细构建字段、范围与结果摘要见 [SIMULATOR-UPGRADE-2026-10-09.md](SIMULATOR-UPGRADE-2026-10-09.md)。同源码原生包递增不是设置备份、变更代码迁移、真机或 TestFlight 验收，readiness 保持 pending。

[Run 37795839177](https://github.com/hongshao2026/Events-Pro/actions/runs/37795839177)，源码 `945761f8fdd138463ba8ff556fae2e1bb72d69b6`：App 编译/启动通过，UITests-Runner 实际编译并执行 1 项 XCTest，结论为失败。原生首页控件与 KPC 链接点击成功，随后只以 Button 类型查询首场赛程未找到目标，58 秒后断言失败；不是编译或签名失败，也不能写成原生功能通过。完整错误与 xcresult 保存至 `.sites-runtime/qa/remote-ios-ui-37795839177/`，初始测试日志另在 `.sites-runtime/qa/mac-handoff/native-uitest-37795839177.log`。测试退出后的 `failure.png` 是模拟器主屏幕，不能替代失败现场图片。

`59fb4f3` 改为保留相同的准确标签、查询原生控件树的全部类型，增加截图与无障碍树附件，以及完整 xcodebuild 测试日志；同时要求两项参加预算合计 ₩1,600,000，第三项关注不计预算，避免只检查单行报名费。两种 iPhone 型号的 [复验 Run 37798281701](https://github.com/hongshao2026/Events-Pro/actions/runs/37798281701) 均实际执行 1 项 XCTest并失败。控件树确认赛程详情为 Other，关注为 Switch；两组“参加”已通过正常界面保存，后续将关注当作 Button 查询失败。Native XCTest JPEG 附件导出已真实执行，大屏赛事首页及赛程原图为 1320 × 2868、无透明通道，已人工查看正常。

`6857b09` 修正关注查询，日历行也按准确标签查询全部类型，保留同样的选择、预算和场次断言。[第三轮 Run 37800207752](https://github.com/hongshao2026/Events-Pro/actions/runs/37800207752) 两种型号均失败，完整附件已下载至 `.sites-runtime/qa/remote-ios-ui-37800207752/`。大屏实际已保存两项参加与一项关注，自选页原生树确认预算 ₩1,600,000、全部自选 3 / 计划参加 2 / 正在关注 1；测试误将分开的数字和“条自选”查询为一条 StaticText。标准尺寸在首个详情点击后未成功点击“参加”；赛程 AX 树与同时采集的画面不一致，画面仍是首页，随后无效的滑动继续滚动首页。不能将该截图命名直接当作已看到赛程的证据，也不能据此断言是产品数据丢失。

`cc213e7` 按实际原生分类标签断言三个数量，在 native tap 后等待 WKWebView 绘制，点击前等待可点击状态，并在无法点击时保存现场及控件树。只有元素位于屏幕外才尝试滑动，不再对屏内不可点击的固定详情操作连续滑动。本机 Swift 语法解析及 Node 语法检查通过；它们不等同 Swift 类型编译。

[第四轮 Run 37805048561](https://github.com/hongshao2026/Events-Pro/actions/runs/37805048561) 实际源码 `cc213e7b9c1e00bd21a0ea742b703eedd999cbab`，Xcode 26.3（17C529）/ iOS 26.2 / `1.0.0 (1)` / `com.example.eventspro`。2026-10-09 00:09（Asia/Shanghai）两种型号均成功，分别实际执行 1 项 XCTest，0 失败；实际构建日志为 `** TEST SUCCEEDED **`。标准尺寸运行 156.615 秒，大屏 142.435 秒。两份结果均为 success/uiTests=true，无附件导出错误，实际 SPM 锁与工程锁逐字一致。

- 覆盖 KPC 首页、赛程及详情，通过正常界面将 Day 1A/1B 设参加、Day 1C 设关注；确认三个分类数量为 3/2/1。
- 每个起始组计一次：两项参加合计 ₩1,600,000，关注不增加预算。
- KPC 日历共有三个起始场次及一个条件 Final 续赛；未重复新增续赛。
- 实际生成完整表格图片并打开预览，图片和系统分享入口存在；**没有点击系统分享或实际存储文件**。
- 同一安装强制退出后重新启动，自选数量与预算保留；**没有覆盖安装新构建，不是升级保留验收**。
- 两套原生 JPEG 五页及重启页已人工查看。该轮使用 App 窗口截图，部分页面在滚动位置；`e1b1880` 改用完整屏幕 `XCUIScreen.main.screenshot()`，继续采集状态栏及安全区，用于商店草稿复核。

证据已下载至 `.sites-runtime/qa/remote-ios-ui-37805048561/`，包括实际 xcresult、xcodebuild 日志、原生截图及控件树；不提交完整临时目录。

| 通过证据 | iPhone 16 Pro | iPhone 16 Pro Max |
|---|---|---|
| results.json SHA-256 | `186164deeb825b04631b1298187615ac5fcd5aec53a481668c3e5e772a14953f` | `ff6bdcc24ba538554ca3dbfddbed8712a0f5b0f753696cf6c060479260043632` |
| xcodebuild-test.log SHA-256 | `26c221998e631c9ea7a2b8916552c2a55d7c96da1593beef50399ba573a99aba` | `f8b7a900c7196f4e193b3c749e495e9a374b1299aa6f0d0364a089647b6266b7` |

截图复验 [Run 37807293715](https://github.com/hongshao2026/Events-Pro/actions/runs/37807293715) 使用完整 `e1b18803ff99a8b98a00e2d84f5679c8edd90a09`，同样的 Xcode、OS 与开发身份；两组实际 XCTest 各 1 项通过、0 失败。2026-10-09 00:28（Asia/Shanghai）完成，标准尺寸运行 146.030 秒、大屏 152.640 秒，实际 SPM 锁再次一致。两套共十张完整屏幕 JPEG 已核对像素/无透明并逐图查看内容，作为非私人草稿保存于 [screenshots/draft](screenshots/draft/README.md)，构建与逐图摘要见 [capture-manifest.json](screenshots/draft/capture-manifest.json)。结果文件 SHA-256：中屏 `c4fa421f8c4c31e603dcc8b5519c6604fcc72c0c3cdc0994855c23ef978de122`；大屏 `d922ca92a268bb93485389a68256455f53dc3abee9b3532c2d3cdbe36bab3e14`。完整附件已下载至 `.sites-runtime/qa/remote-ios-ui-37807293715/`。

完整屏幕接口的输出仍有部分页面位于滚动位置、未显示状态栏；本机 Simulator/真机须复核状态栏、顶部和安全区，选最终取景，不以这组草稿记作完整 Q10 通过。正式身份与跨系列演示继续待完成，storeScreenshots 保持 pending，已指向草稿依据。

测试不注入本机存储、JS 或模拟插件；目标不参与正式 Archive。所有真机直装、升级与 TestFlight 项继续未执行。

## 继续操作与待定项

1. **本机模拟器验收**：完整 Xcode 与 iOS 27.0 runtime 已就绪，本机 App/测试目标编译、启动及实际 Swift 锁核对通过；继续原生 XCTest 和系统分享、文件保存/恢复、完整功能矩阵检查。项目终端可用 DEVELOPER_DIR，无需先修改全局 Command Line Tools 选择。
2. **本人登录与真机签名**：Xcode → Settings → Accounts 登录 Apple 账号；连接 iPhone，信任电脑，按设备要求本人启用开发者模式；App → Signing & Capabilities → 自动签名 → Personal Team（或会员 Team）。正式 Bundle ID 由用户核定后在 `app-release.config.json` 修改并 sync；不把占位 ID 当作发行身份。
3. **真机测试与升级**：使用 [真机验收矩阵](IOS-DEVICE-QA.md)，赛事、自选、预算、日历、图片、两种 JSON、飞行模式与数据保留逐项记录。升级前分别备份，保持同一 Bundle ID、不卸载，覆盖安装更高构建号并比对。未执行项不记通过。
4. **TestFlight**：用户本人完成 Developer Program 身份、会员付费与协议后，在 App Store Connect 创建同 ID 的应用记录。递增 buildNumber、sync、真机 Archive、核对 Privacy Report，再上传 App Store Connect；需要正式候选构建时不选 Internal Only。处理成功后内部测试，按相同矩阵验证 TestFlight 安装/更新并记录实际构建号。完整流程见 [Mac 设置](../../MAC-SETUP.md#6-第一次上传-testflight)。
5. **公开与商店材料**：真实责任人/组织名称、邮箱、正式域名/隐私/支持 URL、正式 Bundle ID 待用户最终提供；所在地台湾沿用现有信息。届时正式 legal:build、HTTPS 托管与无需登录访问核对。截图按 [执行单](STORE-SCREENSHOTS.md) 取同一验收构建的真实原生画面；[审核备注](REVIEW-NOTES.md)、商店文案和 [素材依据](content-rights.md) 补实际最终值。

`readiness.json` 四项保持 pending。首版免费、仅台湾发行、离线与登录默认关闭的要求不变。最终候选构建须汇总本机/真机/TestFlight、隐私报告、网页、权利与截图证据，执行正式发行检查；正式提审由用户决定并明确指示，本轮未提交审核。

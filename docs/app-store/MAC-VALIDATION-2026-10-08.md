# Mac 接手与实际验收记录

日期：2026-10-08（Asia/Shanghai）。当前结论：本机网页/资源检查通过，远程 Mac 已完成真实不签名 Swift 编译；本机 Xcode、模拟器运行、签名、真机、TestFlight 与正式发行材料尚未完成。尚不具备 App Store 提审条件。

## 仓库与构建身份

| 项目 | 实际结果 |
|---|---|
| 主目录 | `~/Developer/Events-Pro`，新克隆，原目录不存在，没有需转移的本地修改 |
| GitHub / 基线 | `hongshao2026/Events-Pro` 的 main，`f38063171063196033b50aedf9b42df4a1417107`；fetch 后 main 已最新，指定祖先检查退出码 0 |
| 独立工作区 / 分支 | `~/Developer/Events-Pro-mac-ios` / `codex/mac-ios-validation` |
| 修复提交 | `5b81aac`，仅修改首页浏览器测试的跨平台修饰键 |
| 应用配置 | `1.0.0 (1)`、`com.example.eventspro`；均为当前开发配置，正式 Bundle ID 待用户核定 |
| 发行行为 | 免费、离线，iOS/单文件构建强制关闭登录；未改数据结构、备份格式、共享接口或原生源码 |
| 提交/集成 | 本轮成果在独立分支本地提交；未合入 main、未推送分支、未签名或上传应用 |

## 本机环境与安装结果

- Apple Silicon arm64，macOS 26.4（25E246）。接手时 `xcode-select -p` 为 `/Library/Developer/CommandLineTools`，`xcodebuild -version` 提示需要完整 Xcode；未发现完整 Xcode。
- Homebrew 并存安装 Node.js 24.21.0，项目命令使用 `/opt/homebrew/opt/node@24/bin`，npm 11.19.0。未修改 shell 配置或全局 Node 指向。
- 安装 Node 24 更新共享 simdjson 到 5.0.3 后，旧 Node 25.9.0 缺少 ABI 33 动态库。已从 Homebrew 官方 4.6.1 arm64_tahoe bottle 恢复实际 ABI 33 库，与 ABI 34 并存；校验 SHA-256 `3ff00f35f54b3512111b280def788bfda767e60ee85285729e6f8154ab193f3a`。原 `node --version`、`npm --version`、JSON 与 crypto 运行通过，版本仍为 25.9.0 / 11.12.1。修复缓存位于 `~/Library/Caches/Events-Pro-environment-repair/`。后续 Homebrew 重装 simdjson 时需留意旧 Node 的此兼容库，或正常升级 Node 后复核。
- `npm ci` 成功安装锁定依赖，锁文件未变。Chromium 151 / Playwright v1234 与 WebKit 26.5 / v2336 安装成功。
- Mac App Store 的当前 Xcode 显示要求 macOS 26.6，点击获取后未开始下载安装。已打开 [Apple 官方历史下载](https://developer.apple.com/download/all/?q=Xcode)，页面要求账号本人登录；[兼容表](https://developer.apple.com/xcode/system-requirements) 显示正式 Xcode 26.6 支持本机 macOS 26.4。用户本人完成登录、许可、安装与首次启动。
- 用户已说明尚未注册 Apple Developer Program，优先本地验证。没有代用户注册、验证身份、付费或接受协议。

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

开发政策六页及入口已生成至 `legal-site/`，带开发预览及 noindex；未作为正式公开政策托管。网页截图已查看 320px 首页与 390px 置顶页；它们属于浏览器 QA。

完整临时日志保存在工作区 `.sites-runtime/qa/mac-handoff/`（Git 忽略）。保留了 `verify-initial.log`、`home-ui.log`、`verify.log`、`ios-sync.log`、`ios-check.log`、`ios-open.log`、`local-xcodebuild.log`、`release-check.log` 和远程原生构建日志。

| 证据文件 | SHA-256 |
|---|---|
| `verify.log` | `7d33e3212aa7e4cbd832de7b159f35a92db03a8a5e83b0d0b33932cc7221aa02` |
| `remote-ios-compile.log` | `0782503023fbc0a0b001b2a5aa54718a91af2942f1c899fb8ded2d75f0ba8b99` |
| `ios-sync.log` | `9b195ee925c322ee1432cd0111138143b57b04dcdf1acab36819229519f22f54` |
| `ios-check.log` | `8882d035254092bdde79fbe98085c91fa8d131f7bd0c53a66da5b753b49c5919` |

## 远程真实 Swift 编译

已触发仓库现有 `iOS simulator compile` 工作流：[Run 37789044340](https://github.com/hongshao2026/Events-Pro/actions/runs/37789044340)，实际源码为完整 `f380631` 基线。2026-10-08 22:03（Asia/Shanghai）完成，结论 `success`。

- GitHub macos-15 runner，Xcode 26.3（17C529），执行真实 `xcodebuild`，日志包含 AppDelegate/SceneDelegate 等 SwiftCompile 和 `** BUILD SUCCEEDED **`。
- 构建目标为 Debug / generic iOS Simulator，arm64 与 x86_64，`CODE_SIGNING_ALLOWED=NO`。
- 实际包解析：capacitor-swift-pm 8.5.3、IONFilesystemLib 2.0.0，Browser/Filesystem/Share 使用锁定 npm 本地包。
- 日志仅有未使用 AppIntents.framework 的 metadata 提取提示，无编译错误。本机 `Package.resolved` 待 Xcode 实际解析生成并保存。
- 没有启动远程或本机模拟器、没有 Apple 签名、Archive、真机或上传。源代码修复只影响测试修饰键，原生工程和依赖与 CI 基线一致。

## 继续操作与待定项

1. **本人安装 Xcode**：登录上述官方历史下载，安装兼容正式版本至 `/Applications`，启动并本人接受许可，安装 iOS 平台及 iPhone 模拟器。在 Xcode → Settings → Locations 选择完整 Command Line Tools 后告知已就绪。接着按 [Mac 设置](../../MAC-SETUP.md) 运行本机 xcodebuild、启动模拟器、检查实际 SPM 锁及系统分享。
2. **本人登录与真机签名**：Xcode → Settings → Accounts 登录 Apple 账号；连接 iPhone，信任电脑，按设备要求本人启用开发者模式；App → Signing & Capabilities → 自动签名 → Personal Team（或会员 Team）。正式 Bundle ID 由用户核定后在 `app-release.config.json` 修改并 sync；不把占位 ID 当作发行身份。
3. **真机测试与升级**：使用 [真机验收矩阵](IOS-DEVICE-QA.md)，赛事、自选、预算、日历、图片、两种 JSON、飞行模式与数据保留逐项记录。升级前分别备份，保持同一 Bundle ID、不卸载，覆盖安装更高构建号并比对。未执行项不记通过。
4. **TestFlight**：用户本人完成 Developer Program 身份、会员付费与协议后，在 App Store Connect 创建同 ID 的应用记录。递增 buildNumber、sync、真机 Archive、核对 Privacy Report，再上传 App Store Connect；需要正式候选构建时不选 Internal Only。处理成功后内部测试，按相同矩阵验证 TestFlight 安装/更新并记录实际构建号。完整流程见 [Mac 设置](../../MAC-SETUP.md#6-第一次上传-testflight)。
5. **公开与商店材料**：真实责任人/组织名称、邮箱、正式域名/隐私/支持 URL、正式 Bundle ID 待用户最终提供；所在地台湾沿用现有信息。届时正式 legal:build、HTTPS 托管与无需登录访问核对。截图按 [执行单](STORE-SCREENSHOTS.md) 取同一验收构建的真实原生画面；[审核备注](REVIEW-NOTES.md)、商店文案和 [素材依据](content-rights.md) 补实际最终值。

`readiness.json` 四项保持 pending。首版免费、仅台湾发行、离线与登录默认关闭的要求不变。最终候选构建须汇总本机/真机/TestFlight、隐私报告、网页、权利与截图证据，执行正式发行检查；正式提审由用户决定并明确指示，本轮未提交审核。

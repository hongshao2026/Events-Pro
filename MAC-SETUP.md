# 在 Mac 继续开发、测试和上架

这份文档用于接手已合入 main 的 Events Pro。首次目标是在 Mac 编译、安装到真实 iPhone，再上传 TestFlight。工程、离线资源构建、系统分享、备份、简繁隐私与支持草稿已经准备；Windows 上的检查没有验证 Swift 编译、签名、真机或实际上传。

目前主界面为简体中文，政策和帮助可切换繁体；登录默认关闭，没有真实内购、广告或云同步。先沿用当前功能验证，不必为了跑通工程先开通收费或认证服务。

## 1. 安装环境

1. 安装与本机 macOS 兼容的正式版 Xcode，启动一次，由账号本人接受许可并安装 iOS 平台与模拟器。当前 Capacitor 8 要求 Xcode 26+；所需 macOS 版本取决于具体 Xcode，见 [Apple 系统要求](https://developer.apple.com/xcode/system-requirements) 和 [Capacitor iOS 要求](https://capacitorjs.com/docs/ios)。2026-10-08 本机为 macOS 26.4，而 Mac App Store 的当前 Xcode 要求 macOS 26.6；可由本人登录 [Apple 官方历史下载](https://developer.apple.com/download/all/?q=Xcode)，选择兼容 macOS 26.2–26.x 的正式版 Xcode 26.6。不要因安装入口显示“获取”就认定下载已开始。最终上传时再次核对 [Apple 当前提交要求](https://developer.apple.com/news/upcoming-requirements/)。
2. 从 [Node.js 官网](https://nodejs.org/en/download) 安装 Node.js 24 的 macOS 安装包，按 Mac 芯片选择 arm64 或 x64。本项目最低 Node.js 22.13，使用 npm 和仓库锁文件。
3. 准备一台 iPhone 和数据线；签名与 TestFlight 使用你自己的 Apple Developer Program 账号。若选大陆个人账号，按 [大陆个人注册步骤](https://developer.apple.com/cn/help/account/membership/enrolling-in-the-app/) 完成身份及会员注册。

打开“终端”，确认工具：

```sh
xcode-select -p
xcodebuild -version
git --version
node --version
npm --version
```

本次已通过 Homebrew 并存安装 Node.js 24，没有改变全局 Node 或 shell 配置。后续在本项目终端使用：

```sh
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
node --version
```

当前验证版本是 24.21.0。其他 Mac 按实际安装位置设置，不复制这台机器的依赖目录。

如果 `xcode-select -p` 指向 `/Library/Developer/CommandLineTools`，在“Xcode → Settings → Locations → Command Line Tools”选中完整 Xcode。默认安装路径也可这样设置，再按提示完成首次启动：

```sh
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

Xcode 安装在其他位置时使用它的实际路径。运行 npm 安装和构建不需要 sudo。

## 2. 把这次 main 带到 Mac

本次按用户要求通过 GitHub 的 main 交接，仓库是 <https://github.com/hongshao2026/Events-Pro>。在 Mac 打开“终端”：

```sh
mkdir -p "$HOME/Developer"
cd "$HOME/Developer"
git clone --branch main https://github.com/hongshao2026/Events-Pro.git Events-Pro
cd Events-Pro
git log -1 --oneline
git status --short
git merge-base --is-ancestor f380631 HEAD
```

最后一条命令退出码 0 表示包含用户指定的 GitHub/Mac 接手提交 `f380631`，它也包含 iOS/main 集成提交 `9706c22`。根目录应有 `MAC-SETUP.md`、`capacitor.config.ts` 和 `ios/App/App.xcodeproj`。已有同名目录时先检查并保存自己的修改，不直接覆盖；已有该仓库且 main 干净时可 `git switch main` 后 `git pull --ff-only origin main`。

也保留了离线交接包作为备用：`Events-Pro-Mac-handoff` 文件夹包含 `Events-Pro-main.bundle`、文档副本和 `handoff.json`。它是制作时 main 的快照；后续新提交以 GitHub 为准。无需复制 Windows 的 node_modules 或工作目录。Windows worktree 的 `.git` 可能指向 Windows 路径，不能直接作为 Mac 仓库使用。

将整个文件夹放到 Mac 的“下载”目录，然后运行：

```sh
mkdir -p "$HOME/Developer"
cd "$HOME/Developer"
git clone --branch main "$HOME/Downloads/Events-Pro-Mac-handoff/Events-Pro-main.bundle" Events-Pro
cd Events-Pro
git bundle verify "$HOME/Downloads/Events-Pro-Mac-handoff/Events-Pro-main.bundle"
git log -1 --oneline
git status --short
```

`git log -1` 应与 `handoff.json` 的 `commit` 对应，且根目录应有 `MAC-SETUP.md`、`capacitor.config.ts` 和 `ios/App/App.xcodeproj`。若用其他传输目录，替换上述交接包路径。可用以下命令对照 handoff.json 中的 SHA-256：

```sh
shasum -a 256 "$HOME/Downloads/Events-Pro-Mac-handoff/Events-Pro-main.bundle"
```

克隆后将 origin 改为 GitHub 地址，供后续同步使用：

```sh
git remote set-url origin https://github.com/hongshao2026/Events-Pro.git
```

从离线包克隆并设置 origin 后，若 main 干净，可 `git pull --ff-only origin main` 接收后续文档和代码。个人计划和设置不在 Git 中；若需要 Windows 浏览器中的记录，分别导出参赛 JSON 与设置 JSON，在 iPhone 中分别恢复。

## 3. 安装依赖并做第一轮检查

从主目录接收到的干净 main 创建独立工作区，再安装依赖和检查：

```sh
git status --short
git worktree list
git worktree add ../Events-Pro-mac-ios -b codex/mac-ios-validation main
cd ../Events-Pro-mac-ios
```

本次工作区已经创建于 `~/Developer/Events-Pro-mac-ios`，分支 `codex/mac-ios-validation`，基线 `f380631`；不要重复执行创建命令，也不要在主目录切换到这个已被 worktree 使用的分支。以上依赖安装和后续命令均应在独立工作区执行。

在该工作区根目录执行：

```sh
npm ci
npx playwright install chromium webkit
npm run verify
```

`verify` 串行检查网页、数据兼容、预算、图片、默认关闭的模拟登录、iOS 资源、政策和模拟原生桥。全部通过也不代表真机已经通过。其生成的单文件网页在 `release/`，临时报告在忽略目录 `.sites-runtime/qa/`。

打开网页预览可运行 `npm run dev`，使用终端显示的 localhost 地址。它不自动部署，也不是即将上架的 iPhone 包。

后续功能继续遵循 [开发与集成约定](CONTRIBUTING.md)，每项功能使用独立分支/worktree；验证后再合入 main。

## 4. 填入自己的配置并生成 iOS 资源

根目录 `app-release.config.json` 是公开应用信息来源。它会进入应用和政策网页，不放密码、证书私钥或 API 密钥。

| 字段 | 接手时怎么处理 |
|---|---|
| bundleId | 改成自己控制的唯一正式标识，并与 Developer Portal、Xcode 和 App Store Connect 一致；当前 com.example.eventspro 只是开发占位 |
| appName | 核定正式应用名，当前为“赛事自选” |
| version / buildNumber | 首版当前为 1.0.0 / 1；每次上传递增 buildNumber |
| operatorName | 真实承担责任的个人法定姓名或组织名称 |
| operatorCountry | 真实运营所在地；当前台湾是上一条已确认信息，后续询问大陆个人账号尚未作为变更决定；若实际选大陆个人运营，应如实修改，台湾发行另在商店设置 |
| supportEmail | 可实际收信和回复的公开邮箱 |
| websiteUrl / privacyUrl / supportUrl | 正式 HTTPS 网站及公开政策、支持页面地址 |
| policyUpdated | 实际政策更新日期 |

暂未确定的联系信息可继续留空做开发测试，应用会保持政策草稿提示；正式发行检查会拒绝缺项。首次签名安装前尽量确定正式 Bundle ID，后续保持不变；更换 ID 会成为另一个应用，已有本机记录不会自动迁移。

```sh
npm run ios:sync
npm run ios:check
npm run ios:open
```

`ios:sync` 会重建网页、66 项依赖声明和系统设置资源，执行 Capacitor 同步并把配置写入工程。资源目录在 Git 中忽略，所以换电脑后必须先执行；只打开 Xcode 不会自动生成它们。修改网页、依赖或配置后也要重新 sync。

本项目使用 Swift Package Manager，打开的是 `ios/App/App.xcodeproj`，无需安装 CocoaPods。不要重新执行 `cap add ios`，不要手改 `CapApp-SPM/Package.swift` 的受管理内容。版本号、Bundle ID 应在 JSON 修改后同步，避免被脚本覆盖 Xcode 中的单独修改。

## 5. 模拟器和真实 iPhone

在 Xcode 中选择 Scheme `App`，等待 Swift 包解析完成。当前原生核心固定为 8.5.3，IONFilesystemLib 固定为 2.0.0；已将远程真实 Xcode 26.3 构建生成的 Package.resolved 保存至 `ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/`。本机首次构建仍须核对实际解析版本与锁文件，并按 [依赖声明核对](docs/app-store/DEPENDENCY-NOTICES.md) 检查原生版本与许可。

先选择已安装的 iPhone 模拟器，点击运行。也可从根目录执行与 Mac CI 一致的不签名编译：

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath ios/DerivedData CODE_SIGNING_ALLOWED=NO build
```

编译成功后，可执行 `node scripts/ios-simulator-smoke.mjs`：创建独立 iPhone 16 Pro 模拟器，安装并启动真实 App，检查启动后仍有有效进程，保存 PNG 和直接采集的无透明 JPEG、环境与版本记录以及实际 Package.resolved，再清理它自己创建的模拟器。JPEG 的实际像素、无透明通道与 SHA-256 会写入报告。输出位于 `.sites-runtime/qa/ios-simulator/` 下每次新建的时间戳/型号目录，避免复验覆盖历史；不操作已有模拟器或真机。

可继续执行原生 UI 测试，采集赛事、赛程、自选、日历、图片预览和同次安装重启后的画面。此流程通过正常 iOS 界面操作，不注入记录或模拟插件，测试目标不参与 Archive：

```sh
EVENTS_PRO_UI_TESTS=true node scripts/ios-simulator-smoke.mjs
EVENTS_PRO_SIMULATOR_MODEL=iPhone-16-Pro-Max EVENTS_PRO_UI_TESTS=true node scripts/ios-simulator-smoke.mjs
```

可再加 `EVENTS_PRO_UPGRADE_TESTS=true`：先正常创建 KPC 参加/关注记录，随后以 `CURRENT_PROJECT_VERSION` 递增原生包构建号并实际重新构建，同一 Bundle ID 覆盖安装；不卸载、不恢复备份，通过独立 XCTest 读取新构建中的既有自选、预算、条件日历。iOS 更新可改变数据容器绝对路径，不能把路径相同作为数据保留标准，见 [Apple TN2285](https://developer.apple.com/library/archive/technotes/tn2285/)。此探针使用相同源码和网页资源，只增加原生 CFBundleVersion；公开配置与系统许可页仍是基线版本，不能作为正式上传包，也不等同变更代码后的迁移、设置备份、真机或 TestFlight 更新验收。CI 已启用，实际结果另登记。

```sh
EVENTS_PRO_UI_TESTS=true EVENTS_PRO_UPGRADE_TESTS=true node scripts/ios-simulator-smoke.mjs
```

两个阶段分别保留 `PlannerUI.xcresult`、`PlannerUpgrade.xcresult` 与附件。探针运行后的 DerivedData App 是临时高构建号；再次做基线检查前，按前述普通 `xcodebuild ... build` 重建，恢复配置中的构建号。探针不修改仓库的运营配置或应用数据格式。

默认中屏为 1206 × 2622，大屏为 1320 × 2868；XCTest 结果、PNG/JPEG 附件和摘要也保存在对应目录。截图需人工查看，当前场景只覆盖 KPC 三项计划与单币预算，不验证所有系列/预算模式、系统分享、文件导入、升级或 TestFlight。预算断言使用两项参加的合计，区别于单行报名费，并核对关注不增加预算。仓库 Mac CI 使用两种型号执行同一命令，证据附件保留 14 天；最终结果按 [实际记录](docs/app-store/MAC-VALIDATION-2026-10-08.md) 核对，不因存在测试代码就记为通过。

模拟器编译通过后，连接 iPhone，信任电脑并按系统提示开启开发者模式（如需要）：

1. “Xcode → Settings → Accounts”登录自己的开发者账号。
2. App target → Signing & Capabilities → 勾选 Automatically manage signing，选择自己的 Team，核对 Bundle Identifier。
3. 在设备选择器选择真实 iPhone，点击运行；根据 Xcode 提示完成设备注册、签名或信任步骤。
4. 按 [真机验收模板](docs/app-store/IOS-DEVICE-QA.md) 逐项测试，特别核对分享取消/重试、保存到文件、备份恢复、飞行模式和更新后记录保留。

把设备型号、OS、Xcode、源码提交、版本/构建号、问题和复验结果写入实际报告。只记录必要验收信息，不提交个人备份或设备序列号。没有执行的项目继续标为未执行，不直接把模板标成通过。

## 6. 第一次上传 TestFlight

先在 [App Store Connect](https://appstoreconnect.apple.com/) 创建应用记录：我的 App → ＋ → 新建 App，选择 iOS，填写名称、真实主要语言、相同 Bundle ID 和内部 SKU。上传前必须先有记录；见 [创建步骤](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/)。

测试阶段用 `ios:sync` 生成资源即可；`ios:release` 还会检查正式网页、素材、截图等全部验收条件，不作为首次 TestFlight 测试的先决命令。

1. 每次上传前在 JSON 中递增 buildNumber，重新 `npm run ios:sync`，核对 Xcode 显示的版本与构建号。
2. 选择通用 iOS 真机目标，Product → Archive。
3. Organizer → 选中 Archive → Distribute App → App Store Connect → Upload，按实际加密使用填写出口合规问卷。[上传说明](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/)
4. 若计划将同一构建用于外部测试和正式审核，不选 `TestFlight Internal Only`；该选项产生的构建仅能内部测试。[内部构建限制](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/)
5. 上传处理完成后，在 TestFlight 新建内部测试组，加入自己等有 App Store Connect 权限的成员，并分配构建；手机安装 TestFlight，接受邀请。
6. 邀请真实用户时使用外部测试组，填写测试说明和联系信息；首个外部构建需要 Beta 审核，后续也可能需要。每份测试构建最多使用 90 天。[TestFlight 流程](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)

记录实际安装和更新结果，再补齐真机验收。TestFlight 并不自动替换所有正式用户的版本，也不代替正式 App Review。测试者安装同一 Bundle ID 的测试版会替换手机上的该 App；安装前备份两类个人记录。

## 7. 补齐材料并提交正式审核

按 [台湾上架指南](docs/app-store/TAIWAN-RELEASE.md) 填商店资料，使用 [商店文案](docs/app-store/STORE-METADATA.md)、[审核备注](docs/app-store/REVIEW-NOTES.md) 和 [隐私实践核对](docs/app-store/PRIVACY-AUDIT.md)。发行范围选特定国家或地区，仅勾选台湾；首版免费，语言、年龄、内容、隐私和加密声明按最终实际版本填写。

联系信息确定后生成公开政策并托管至自己选定的 HTTPS 网站：

```sh
npm run legal:build
```

输出目录 `legal-site/` 提供简体与繁体隐私、支持、使用说明六个页面；命令本身不会托管。核对线上访问、联系邮箱及托管日志告知，补齐真实 iPhone 截图、素材使用依据和最终 Archive 隐私报告。

`docs/app-store/readiness.json` 的四项只有具备实际证据后才能改为 verified，并指向项目内的真实报告：

| 项目 | 所需证据 |
|---|---|
| nativeDeviceQA | 完成真机、文件分享、升级兼容和实际构建验证的报告 |
| contentRights | 赛事资料、Logo、PDF 等逐项使用依据及处理结论 |
| publicPolicyAndSupport | 最终线上 URL、联系信息和访问核对记录 |
| storeScreenshots | 最终 iPhone 截图及对应版本/构建说明 |

```sh
npm run release:check -- --online
```

缺项时退出码 1 是预期阻止发行；不要通过填假资料或只改 verified 来绕过。全部齐备后，若已有通过 TestFlight 的同一构建，直接在商店版本关联它，选择手动发布，点击“添加至审核”再“提交审核”，通过后手动发布。[提交](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/)、[手动发布](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/select-an-app-store-version-release-option/)

若还需生成新的正式候选包，可执行 `npm run ios:release`；它只检查并生成资源，不签名或上传。任何源码、配置或原生依赖改动都会产生需要重新测试的新候选包，不能沿用旧构建的验收结论。

## 8. 上架后的更新和交接

开发分支持续修改 → 本地与真机检查 → TestFlight → 确定候选构建 → 正式审核 → 手动发布。测试期可保持例如 1.1.0，逐次递增构建号 21、22、23；确认 23 后提交该构建，不为正式审核临时重打另一份包。

较大的正式更新可选择 7 天分阶段自动更新，并在发现问题时暂停；用户仍能主动下载。商店不能直接切回旧版本，修复需要提交新版本。[分阶段更新](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/)、[更新版本](https://developer.apple.com/help/app-store-connect/update-your-app/create-a-new-version/)

当前赛程随应用打包，内置赛程变动也需要新版；独立在线赛程更新尚未实现。今后内购需另行接入 StoreKit、协议、银行/税务、恢复购买和权益校验，当前首版不含真实收费功能。

若将来出售整个 App，用双方开发者账号持有人之间的 Transfer App 交接。至少有一个正式上架版本，且满足当时的转移条件；评分、评论、Bundle ID 和原用户更新渠道可保留。转移前关闭 TestFlight，源码、域名、内容权利、订阅/服务迁移另行约定。[App 转移](https://developer.apple.com/help/app-store-connect/transfer-an-app/overview-of-app-transfer/)、[转移条件](https://developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria/)

在 Mac 保存源码修复、配置和验收记录并提交自己的分支，再按 CONTRIBUTING.md 完整验证后合入 main；不要提交证书、密钥、个人备份、IPA、Archive 或临时日志。

## 常见问题

| 现象 | 处理 |
|---|---|
| npm ci 提示 Node 版本不支持 | 安装 Node.js 24，重开终端确认 node --version |
| Xcode 找不到文件或插件 | 在仓库根目录 npm ci 后执行 ios:sync；不要复用 Windows node_modules |
| xcodebuild 只看到 CommandLineTools | 按第 1 节选择完整 Xcode，再安装 iOS 平台 |
| Swift 包解析失败 | 确认首次解析能访问 GitHub，确认 npm 依赖已安装；不要通过随机升级锁定版本解决 |
| 修改网页后手机仍显示旧界面 | 再执行 ios:sync，重新 Xcode 运行或上传新构建 |
| No profiles / Team / Signing 错误 | 检查账号会员、自己的 Team、唯一 Bundle ID、自动签名及设备注册 |
| 上传构建号重复 | 在 app-release.config.json 增加 buildNumber，sync 后重新 Archive |
| release:check 报缺项 | 开发测试可继续；正式发行需要补真实配置及四项验收证据 |
| 分享在网页正常但手机失败 | 真机复现，记录设备/OS/构建和取消、文件、照片路径；浏览器模拟桥检查不是原生验收 |

接手与后续进度统一更新 [TASK-STATUS.md](docs/app-store/TASK-STATUS.md)。若继续让 Codex 在 Mac 帮忙，可直接发送：

> 请读取 MAC-SETUP.md、AGENTS.md 和 docs/app-store/TASK-STATUS.md，核对接手的 main 与交接包提交，检查 Mac/Xcode 环境。从当前 main 建立独立 codex 分支，完成真实 iOS 编译、真机及 TestFlight 验收，保留现有赛程、预算、备份和默认关闭的登录。不要把 Windows 模拟桥检查当作真机结果；缺少运营信息先保持真实待定。用户身份验证、账号协议由账号本人操作，未经提交指令不提交正式审核。

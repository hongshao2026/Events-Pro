# 台湾 iPhone 上架准备进度

更新日期：2026-10-09。已在用户 Mac 建立长目标并接手，尚未达到台湾 App Store 可提审状态。用户确认开发者会员尚未注册，先做本地验证；运营信息以用户最终提供为准，缺项继续待定。首版免费、离线、登录默认关闭，账号身份、付费与协议由本人完成，正式提审由用户决定。

## 本次 Mac 实际进展

| 项目 | 当前真实状态 |
|---|---|
| 仓库 | 已新克隆至 `~/Developer/Events-Pro`，main 干净且最新，确认包含 `f380631` |
| 工作区 | `~/Developer/Events-Pro-mac-ios`，独立分支 `codex/mac-ios-validation`，基线 `f380631`；源码和原生验证工具已推送该分支，未合入 main |
| 环境 | Apple Silicon / macOS 26.4；并存 Node 24.21.0、原 Node 25.9.0；Chromium/WebKit 安装完成 |
| 本机完整检查 | 修复 Mac 修饰键测试后 `npm run verify` 退出码 0；17 份浏览器报告共 153 项检查通过 |
| 单独 iOS 资源检查 | `ios:sync`、`ios:check` 通过，四份原生 plist 解析 OK；`ios:open` 已派发打开请求，不代表已安装或启动 Xcode |
| 真实 Swift 编译/远程模拟器 | [基线编译](https://github.com/hongshao2026/Events-Pro/actions/runs/37789044340) 在 `f380631` / Xcode 26.3 下通过；[分支启动检查](https://github.com/hongshao2026/Events-Pro/actions/runs/37792355643) 在 `3cc35fa` 完成真实 iPhone 16 Pro / iOS 26.2 安装、启动、首页原图与 Swift 锁捕获，已人工查看；仅启动，不是完整功能验收 |
| 原生 UI 测试 | `cc213e7` / Run 37805048561 两种 iPhone 的真实 XCTest 各 1 项通过、0 失败；KPC 2 项参加/1 项关注、自选数量、预算 ₩1,600,000、条件日历、图片预览与同次安装重启保留通过。三轮失败及修复证据保留；完整功能矩阵仍未全执行；`e1b1880` 正在补完整屏幕截图 |
| 本机 Xcode/模拟器 | 当前只有 CommandLineTools，本机 xcodebuild 前置失败，Swift 未启动；Mac App Store 当前 Xcode 要求 macOS 26.6，已打开兼容版本的官方历史下载，等待本人登录、安装、接受许可 |
| 真机与 TestFlight | 未执行。可先用本人 Apple 账号的 Personal Team 直装；TestFlight 待付费会员就绪 |
| 材料 | 简繁政策预览、真机矩阵与截图执行单已准备，远程首页原图已捕获；正式 URL、完整商店组图和最终审核联系信息尚未完成 |
| 正式发行检查 | `release:check -- --online` 正确返回 1，共 10 项缺项；未执行线上 URL 检查，四项 readiness 保持 pending |

详细命令结果、日志摘要、环境修复与接下来由本人完成的操作见 [Mac 实际验收记录](MAC-VALIDATION-2026-10-08.md)。代码修复 `5b81aac` 只修正浏览器测试的 Ctrl/Meta 差异；随后补充真实模拟器检查、证据捕获、实际 Swift 锁和独立原生 UI 测试目标。应用行为、App 的 Swift 源码、数据和备份格式未变。源码与工具在独立分支提交并推送，未合入 main，未签名、托管、上传应用或提审。

## 交接基线与历史

main 交接版本包含原有紧凑界面、自选/预算/图片导出，以及 codex/ios-taiwan 的四项提交 6604154、262b45b、6a65d12、2afa32b；集成基线为 33472bc，在独立 worktree Events-Pro-integrate-ios-mac-20261008 完成完整验证，集成提交为 9706c22。GitHub 接手文档提交为 f380631，已推送并在本次 Mac 克隆确认。不再以 Windows 功能 worktree 作为唯一源码入口。

2026-10-08 用户补充：“其他都待定，主体台湾，赛事logo公开的可以使用。”运营所在地已写为台湾；具体承担责任的人或组织名称、邮箱、网站、正式 bundleId 与 Apple 会员继续待定。现有 Logo 保留，用户说明及尚需记录的具体依据见 content-rights.md；未将该说明扩展为完整 PDF 分发授权。Windows 交接时仅有桌面 WebKit 模拟桥，没有真实编译、签名或真机证据；本次远程真实编译与 Mac 验收以顶部最新记录为准。长目标仍受本人账号、环境安装和最终发行资料限制。

## 已完成的本地准备

| 范围 | 当前成果 |
|---|---|
| iPhone 工程 | Capacitor 8 + Swift Package Manager；离线资源随应用打包，保留原有赛程、日历、自选、预算和备份格式；默认无登录、广告或云同步 |
| 系统功能 | 表格图片先预览，用户点击后通过 iOS 分享菜单交付；两类 JSON 备份和内置 PDF 使用同一文件出口；外部来源使用原生浏览器 |
| 手机适配 | 现有浅紫紧凑界面、安全区、输入字号、可滚动政策；自有 1024px 不透明图标、品牌背景启动页；移除 iOS 未开放的 VIP 和盲注占位 |
| 隐私与支持 | 基于实际本机存储的简繁政策、帮助和使用说明；应用内入口与静态公开页面使用同一份内容和公开运营配置；明确导出、分享和系统备份边界 |
| 本机删除 | 仅清除已知三项计划/设置键；明确确认与安全取消；失败尝试回滚；保留其他本机键、已导出文件及系统备份 |
| 原生声明 | PrivacyInfo.xcprivacy 已登记为 Xcode 资源；声明 Filesystem 文件时间戳理由；仅添加照片的用途说明；当前界面语言据实声明为简体 |
| 开源声明 | 实际构建模块及原生/CSS 声明共 66 项，保留原文与版权；随 public 和原生 Settings.bundle 交付；补充来源及最终框架的正式复核仍待完成 |
| 商店资料 | 上架操作指南、简繁商店描述草稿、英文审核备注、数据实践核对、素材权利清单及真实设备验收模板 |
| 发行检查 | 正式配置、验收证据与可选线上 URL 检查；信息缺失时拒绝正式政策和发行资源命令；开发预览明确标注未准备就绪 |
| CI | 网页检查增加 WebKit；Mac 工作流已真实执行不签名 Swift 编译和模拟器启动，保存原生图、环境记录和 Swift 锁；Windows 初版交接时尚未执行 |

## 验证记录

- 初版提交 6604154 的 `npm run verify` 全量通过：lint、TypeScript、单元、离线构建、已有赛程/自选/日历/预算/模拟登录回归、iOS 同步与资源、政策草稿和新增 UI 检查。浏览器共 153 组 PASS，其中新增政策/清除 6 组、WebKit 模拟原生桥接 6 组。
- 最后补充仅用于 iOS 的关闭按钮安全区与编辑输入字号后，重新执行 `ios:sync`、`ios:check`、`test:release:ui` 和 `test:native:ui`，全部通过，并确认新样式进入最终资源。原生个人资料与政策截图已人工查看。
- 设计 strict 审核无发现；DESIGN.md lint 无错误，保留已有 7 项 orphaned-tokens 提示，实际 CSS 变量映射未改变。`git diff --check` 通过。
- 填入台湾所在地后，`npm run release:check` 正确报告剩余 10 项未完成的正式信息/验收条件；这是发行检查阻止未准备好的版本继续构建，不能写成已经具备提审条件。
- 本地证据在忽略目录 `.sites-runtime/qa/`：ios-taiwan-verify.log、release/results.json、native/results.json 及相关截图；不提交临时记录。iOS 资源包含 1024px RGB 图标、登记的隐私清单和仅添加照片用途说明。
- 依赖声明阶段另通过 lint、TypeScript、全部单元、ios:sync、ios:check、test:ios:notices 和 6 组原生模拟桥接回归；标准 plistlib 成功解析全部原生声明正文及层级。新测试覆盖可复现生成、原文与摘要、cap sync 保留、缺少/未核定许可证拒绝，不将系统设置源资源视为已运行真机页面。
- 台湾所在地配置更新后，通过发行配置测试、ios:sync、ios:check、6 组 Chromium/WebKit 政策与清除检查及 git diff --check；确认简繁静态隐私草稿均包含台湾且继续标注开发预览。正式发行检查仍正确阻止剩余 10 项缺项。
- main 集成阶段重新独立 npm ci，并完整通过 npm run verify，退出码 0：原有五站/首页/紧凑筛选/自选/预算/PNG/备份/模拟登录回归及新增 iOS 资源、66 项依赖声明、政策和模拟原生桥检查全部通过，17 份浏览器报告共 153 组检查无页面错误。单文件 HTML 从本次最终源码重新生成；完整日志位于集成目录 .sites-runtime/qa/integrate-ios-mac/verify.log。Mac 文档的相对链接、npm 命令和代码块检查通过，正式发行检查仍报告 10 项真实缺项。

浏览器与模拟原生桥接的检查不替代 Swift 编译、iOS 模拟器或真机。现有内置 PDF 使离线资源包约 10.2 MB，构建有体积提示；首次打开及完整导出性能仍需实际 iPhone 核对。以上为 Windows 历史验收；Mac CI 本次已实际编译并在真实模拟器安装/启动，仍未执行完整原生功能、真实服务器、登录、邮件发送、Apple 签名、账号注册或审核操作。

## 下一阶段与外部条件

| 项目 | 当前状态 | 完成方式 |
|---|---|---|
| 实际运营主体及所在地 | 所在地台湾已配置，主体名称待定 | 确定真实责任人或组织，与账号及政策一致；未推定个人或公司形式 |
| 支持邮箱、正式域名及 bundleId | 待定 | 填 app-release.config.json；不提供密码、私钥或证书到聊天 |
| Apple Developer 账号与 Mac | 已接手 arm64 Mac，Node/浏览器就绪；完整 Xcode 待本人安装，会员未注册 | 按 MAC-SETUP.md 安装兼容 Xcode、本人登录、选择 Team 与签名；本人完成身份/付费/协议 |
| 公开政策与支持 URL | 页面源内容已完成，未托管 | 正式信息齐备后构建与托管至用户域名，核对 HTTPS、访问和托管日志告知 |
| 赛事资料、Logo 和 PDF 使用依据 | Logo 按用户说明保留，具体依据未记录；赛程/PDF 尚未核定 | 逐项记录许可/条款或合法使用依据；完整 PDF 单独核对 |
| Swift 编译、签名、真机验收与隐私报告 | 远程不签名 Swift 编译及真实模拟器启动通过，实际 SPM 锁已保存；本机编译、完整功能、签名、真机与 Archive 待执行 | 在本机 Xcode/模拟器和真实 iPhone 按 IOS-DEVICE-QA.md 验收；核对已保存的实际 SPM 锁与所有原生依赖 |
| 真正 iPhone 商店截图 | 已捕获远程模拟器首页 QA 原图，完整商店组图未完成 | 按 STORE-SCREENSHOTS.md 从同一验收构建的真机或模拟器生成并核对无透明通道 |
| TestFlight 与 App Store Connect | 未上传/创建商店记录 | 配置免费、台湾发行范围，据实填写年龄分级、隐私和出口合规，再上传并测试 |
| 提交审核与发布 | 未执行 | 以实际最终构建和材料复核；获得用户提交指令后再提交，Apple 审核结果不能预先保证 |

主界面目前为简体中文，繁体政策和商店草稿已准备；完整繁体 UI 尚未实现。首版无需在线账户，暂不涉及服务器账户删除流程。未来若增加账户、分析、广告或云同步，应同步修改实际功能、政策及商店声明。

Mac 接手见 [MAC-SETUP.md](../../MAC-SETUP.md)，商店材料见 [台湾上架指南](TAIWAN-RELEASE.md)，数据核对见 [隐私实践](PRIVACY-AUDIT.md)。优先克隆 GitHub main，已有离线 Git bundle 仅作其制作时的快照备份，清单记录对应提交及摘要。readiness.json 保持真实 pending 状态，外部项目只有得到真实验收证据后才能改为 verified。

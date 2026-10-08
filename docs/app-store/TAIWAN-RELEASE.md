# 台湾地区 App Store 上架操作

目标：免费赛事资讯与个人赛程工具。首版不启用登录、云同步、广告、内购、支付、下注或实际报名。“参加”是本机个人计划。首版面向 iPhone，iOS 15 起；网页与单文件离线交付继续保留。当前完整界面为简体中文，赛事名保留英文，政策与帮助提供简体及繁体；不能声称整个应用已提供繁体界面。

本文依据 2026-10-08 查阅的 Apple 和 Capacitor 官方文档。商店字段、截图规格、SDK 要求和账号协议可能变化，最终提交当天再次核对。工程已经生成不代表 Swift 编译、真机测试或提审已经完成。

## 你需要准备的东西

1. **Apple Developer Program 账号**。个人可用真实姓名注册，个人法定姓名会显示为卖家名称。若由境外公司运营，使用相符的组织账号；组织需具备法律实体资格、申请人的签约权限、D-U-N-S 编号、组织域名邮箱和正常运作的公开网站。不能使用假地址、借来的公司或名称代替真实运营主体。标准会员费为每年 99 美元或当地价格；免费应用也通常需要付会员费。[Apple 注册要求](https://developer.apple.com/programs/enroll/)
2. **可运行 Xcode 26 或更高版本的 Mac**，以及至少一台 iPhone。Capacitor 8 的当前要求是 Xcode 26+，最低支持 iOS 15。[Capacitor iOS 环境](https://capacitorjs.com/docs/ios)
3. **真实运营名称、所在国家/地区、支持邮箱和 HTTPS 网站**。隐私政策和支持网页需公开、无需登录可访问；应用内也有入口。[隐私说明要求](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)
4. **赛事资料及标识的使用依据**。来源记录不是转载授权。逐项确认哪些事实可使用，哪些 PDF、图像和 Logo 可分发，记录许可、条款或其他合法使用依据。没有依据的素材应先替换或移除。是否涉及赌博服务、导流及适用的运营地法律，应依据实际产品、外链和合作模式作针对性评估；Apple 过审不代替法律判断。

## 先填项目中的正式信息

编辑根目录 `app-release.config.json`：

| 字段 | 如何填写 |
|---|---|
| appName | 正式应用名；当前“赛事自选” |
| bundleId | 你控制的唯一反向域名标识；`com.example.eventspro` 只供开发，不能作为已核定正式 ID |
| version / buildNumber | 商店版本及递增的构建号；每次上传递增构建号 |
| operatorName / operatorCountry | 实际承担运营责任的人或组织，以及所在国家/地区 |
| supportEmail | 能实际收信和回复的公开邮箱 |
| websiteUrl | 运营者网站的 HTTPS 地址 |
| privacyUrl / supportUrl | 公开政策与支持页面完整 HTTPS 地址 |
| policyUpdated | 政策更新日期 |

这些信息会写入用户看到的页面。不要填写 Apple 密码、证书私钥或 App Store API 密钥。

`npm run legal:preview` 生成明确标为草稿的本地页面。正式信息完整后，`npm run legal:build` 生成 `legal-site/` 下的六个静态页面：简体与繁体各有 privacy.html、support.html、terms.html；没有分析脚本、Cookie 弹窗、外部字体或表单。可将这份目录托管到你选择的境外 HTTPS 网站；本任务尚未托管。网站托管服务可能记录访问日志，部署时应核对其实际日志及隐私安排，并补入网站适用的告知，不能把应用本机数据政策等同于“网站完全不处理 IP”。

核对公开页面文字、邮箱可用性和 URL 后，将证据记录在 `docs/app-store/readiness.json`，状态由 pending 改为 verified，并指向真实核对记录；不要仅为了让命令通过而改状态。`npm run release:check -- --online` 会核对正式信息、验收记录及两条政策/支持 URL。它不会替你判断法律、签名或审核结果。

## 在 Mac 上构建与测试

```sh
npm ci
npx playwright install chromium webkit
npm run verify
npm run ios:sync
npm run ios:open
```

本项目用 Swift Package Manager，打开的是 `ios/App/App.xcodeproj`，无需安装 CocoaPods。Xcode 首次解析包需要联网。完整依赖版本见 package-lock.json；Capacitor 原生核心在 Package.swift 中精确锁定，其他 Swift 传递依赖在 Mac 解析后检查并保存 Package.resolved。

IONFilesystemLib 也已固定为对应许可核对的 2.0.0。构建自动生成完整开源声明与原生 Settings.bundle，详见 [依赖许可](DEPENDENCY-NOTICES.md)。改变原生版本后需要同步原文与复核记录；首次 Mac 构建还须核对最终框架及系统设置入口，不以源文件登记视为已通过。

1. Xcode → App target → Signing & Capabilities，选择你自己的 Team 并开启自动签名。Bundle Identifier 与配置、Developer Portal、App Store Connect 必须一致。
2. 选择模拟器运行，再选择真实 iPhone 运行。测试事项见 `IOS-DEVICE-QA.md`；特别检查文件导入、系统分享取消与重试、安全区、软键盘、应用重启后的记录及飞行模式。
3. 通过后保存真实验收记录，并将 readiness.json 的 nativeDeviceQA 指向该记录。记录设备、OS、Xcode、源码提交和结果。
4. 正式信息、公开页面、权利记录和截图齐备后执行 `npm run ios:release`，再进行正式 Archive；这个命令不会签名或上传。

独立的 `.github/workflows/ios-check.yml` 可在 GitHub 上运行不签名的模拟器编译；当前本地 Windows 无法执行这一检查，也尚未触发远端 CI。CI 编译成功仍需真机验收。

## 在 App Store Connect 创建和填写应用

1. 在 Developer Portal 注册与你的 bundleId 相同的 App ID。
2. App Store Connect → 我的 App → 新建 App，选择 iOS，名称、主要语言、Bundle ID 和内部 SKU。当前主界面为简体，主要语言按实际填写；可以另加繁体商店文案。
3. 价格设为免费；发行范围选择**特定国家或地区，只勾选 Taiwan**。检查 iPhone/iPad Mac 和 Apple Vision Pro 兼容分发选项，未验证的平台首版不要主动开放。[发行范围设置](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-for-your-app-on-the-app-store/)
4. 候选分类为“体育”，次要分类可评估“工具”；按实际用途选择，不通过分类隐藏扑克、赌场地点或买入金额内容。填入名称、副标题、描述、关键词、版权、支持 URL 和隐私政策 URL，文字草稿见 `STORE-METADATA.md`。
5. 填年龄分级问卷，按实际页面、扑克内容、赌场地点、金额和外链回答。不能因为没有内置扑克游戏就一律选无相关内容，也不能预设必须 18+。由实际问卷和地区规则确定。[年龄分级](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/)
6. 填 App Privacy。当前本机数据不自动传给开发者，没有分析/广告/登录；可能支持“不从 App 收集数据”的回答，但最终要结合原生依赖、支持邮件的可选披露条件、外链及实际服务复核。设备本地处理与收集数据的定义不同；“有隐私政策”本身不能代替这个核对。详见 `PRIVACY-AUDIT.md`。[隐私标签定义](https://developer.apple.com/app-store/app-privacy-details/)
7. 填出口合规问卷。本工程没有自定义加密，使用系统网络及存储能力，当前设置 ITSAppUsesNonExemptEncryption=false。上传前核对完整原生依赖及实际加密使用；若不再符合豁免条件必须修改，不能机械沿用。[出口合规流程](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/)
8. 上传真实应用截图，当前大屏 iPhone 可用 1320×2868 或其他官方接受规格。用真机或模拟器截图，勿把桌面浏览器预览冒充 iPhone 验收。截图顺序：赛事目录、紧凑列表与筛选、个人日历、自选表格、完整图片分享。没有实际支持 iPad 时不宣称 iPad 优化。[截图规格](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)

## 上传、TestFlight 与提交审核

Xcode 选择 Any iOS Device / Generic iOS Device → Product → Archive → Organizer → Distribute App → App Store Connect → Upload。处理完成后在 TestFlight 先测试；外部测试可能需要 Beta App Review。核对构建号、隐私报告、运行和导出，再将构建关联至商店版本。

在 App Review 信息中提供真实联系人、无需登录的说明和功能操作路径；英文备注草稿见 `REVIEW-NOTES.md`。建议使用手动发布选项：审核通过后仍可检查版本再决定发布时间。最后在 App Store Connect 添加至审核并提交。[Apple 提交流程](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/)

苹果 4.2 要求有足够功能和应用体验。我们复用网页界面，同时保留离线赛事、个人日历、预算、系统文件和分享；这些是可说明的实际功能，不能保证审核一定接受。扑克赛事资讯的审核以真实功能、外链和素材为准；涉及真钱游戏时另有 5.3 要求。[审核指南](https://developer.apple.com/app-store/review/guidelines/)

## 当前尚未完成的外部条件

运营者、邮箱、正式域名与 bundleId 未提供；开发者账号和 Mac 状态待用户回复；公开网页尚未托管；素材使用依据尚未核定；Swift 编译、签名、真机/模拟器截图、TestFlight 和提交审核均未执行。此文档与 readiness.json 会随真实进展更新，不将源码检查视为提审完成。

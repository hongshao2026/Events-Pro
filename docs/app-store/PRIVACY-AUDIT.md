# 首版数据实践核对

政策数据源为 lib/legal-content.json；应用内通过 lib/legal.ts 使用，公开网页通过 scripts/build-legal-site.mjs 使用。两者读取同一份运营信息 app-release.config.json，避免两份政策不同步。

| 数据/操作 | 处理位置 | 当前代码证据 | 发行前核对 |
|---|---|---|---|
| 个人分类、预算方式、待安排记录 | 本机 localStorage | lib/local-store.ts；poker-planner-local-v2 与旧版 key | 重启后保留，清除后移除，备份可恢复 |
| 用户名、货币、置顶、汇率、赛事修改 | 本机 localStorage | lib/app-settings.ts；events-pro-settings-v1 | 不与远端账号自动同步 |
| PNG 表格生成 | 本机 canvas/Blob | lib/shortlist-image.ts | 全部列、完整表格，失败不改原记录 |
| PNG/JSON/PDF 原生导出 | 应用 CACHE，用户选择系统目标 | lib/file-export.ts；Filesystem + Share | 分享后清理；取消不提示已保存；异常退出后清理缓存 |
| 保存图片到照片 | 用户在系统分享菜单中主动选择；可能请求仅添加权限 | Info.plist 的 NSPhotoLibraryAddUsageDescription | 不读取已有照片；在真机确认允许、拒绝和系统菜单是否提供该选项 |
| JSON 导入 | 用户文件选择器，本机读取校验 | app/planner.tsx、profile-page.tsx | 两种格式不混淆，确认前不覆盖 |
| 外部网站 | 用户点击后系统浏览器；网站自行处理连接日志 | lib/native-runtime.ts；Browser | 启动和浏览本机页面无自动外联；实际链接内容复核 |
| 支持邮件 | 用户主动提供内容，运营者与邮件供应商处理 | mailto 入口，仅在 supportEmail 配置后出现 | 真实邮箱、服务商与保存实践需核定 |
| 登录 | iOS/单文件构建强制关闭 | scripts/build-ios.mjs、build-local.mjs；原登录代码保留 | 不因 .env 而开启，不打包真实凭据 |
| 分析、广告、推送、定位、联系人、相机、照片读取 | 当前发行代码不提供 | 原生插件列表与 Info.plist | 复核 Archive 及所有 Swift 传递依赖 |

Apple 的“收集”通常涉及将数据发送到设备外，并由开发者或合作伙伴在处理请求所需期间以外访问。仅在设备处理、开发者无法访问的数据不按该定义收集。可选客服等数据在满足官方全部条件时可能不必披露，不应仅凭“可选”就忽略。最终以实际发行构建和真实接收服务核对。[Apple 隐私标签定义](https://developer.apple.com/app-store/app-privacy-details/)

当前 App Privacy 的候选回答是“不从此 App 收集数据”。这不是已经发布的商店声明；仍须核对支持邮件、原生依赖、其他同一 App 平台和实际托管方式。若以后上线登录、云同步、分析或广告，重新评估并更新标签、政策、同意机制及必要的账户删除能力，不能继续复用无登录政策。

PrivacyInfo.xcprivacy 已登记为 Xcode 资源：NSPrivacyTracking=false，收集类别为空，Filesystem 文件时间戳 API 使用理由 C617.1（应用沙盒内用户文件）。这是原生 API 使用说明，不等同于商店隐私标签或法律合规证明。[Filesystem 官方清单要求](https://capacitorjs.com/docs/apis/filesystem)

在 Mac Archive 后用 Organizer 生成/查看完整 Privacy Report，确认所有 SDK 的合并声明、签名及所用 API。当前 Windows 只能做资源登记和静态核对，不能声称已经看过最终报告。

数据导出不加密；系统备份可能保存本机数据；清除按钮不能删除已分享文件、系统备份和其他设备副本。这些限制已写进政策和确认文案。用户已确认运营所在地台湾并写入共享配置；真实主体名称、支持邮箱及网站仍待定，政策继续明确显示测试状态。

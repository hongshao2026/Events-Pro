# iOS 依赖许可声明

2026-10-08 本地构建核对：实际离线 JS 模块涉及 60 个 npm 包，加上输出 CSS、原生核心与单独的原生/样式声明，共生成 66 项带版本的记录。安装包中保留完整许可正文，不用 SPDX 名称或来源链接替代原文。

## 生成与交付

`npm run ios:sync` 构建时读取实际 JS chunk 的模块路径，收集安装包 LICENSE/COPYING/NOTICE 原文，再添加 Tailwind、tw-animate-css、Capacitor iOS、IONFilesystemLib、Cordova 衍生源码和项目采用的 shadcn 样式声明。脚本为 scripts/ios-notices.mjs，生成文件不手工编辑。

- ios-dist/THIRD-PARTY-NOTICES.txt：完整声明，cap sync 后在 App/public 中随离线资源交付。
- ios-dist/third-party-notices.json：名称、版本、原文、原文摘要、来源及需要人工核对的说明；不记录用户名、绝对本机路径或私人记录。
- ios/App/App/Settings.bundle：原生系统设置根页、版本与开源许可页。Xcode Copy Bundle Resources 已登记；真实系统设置中的显示仍需 Mac/iPhone 验收。

生成过程不联网。缺少正文或未经核对的许可证类型会使构建失败，新版本不匹配已有补充声明时也会失败。当前自动支持已核对的 MIT、ISC、Apache-2.0、0BSD 文本；其他类型需人工复核后调整。开源许可处理不代替赛事 Logo、PDF 或其他资料的权利核对。

## 原文补充与版本边界

| 项目 | 依据与边界 |
|---|---|
| react-remove-scroll-bar 2.3.8 | npm 元数据声明 MIT，发布包缺少许可证正文。补入作者仓库固定提交 8ca9ba5 的 MIT 原文；该仓库当时 package.json 为 2.3.7，并非取得 2.3.8 tarball 中不存在的 LICENSE。config.json 明确保留这一来源差异，正式分发复核不能将其误记为发布包原文。 |
| IONFilesystemLib 2.0.0 | Filesystem 插件 Package.swift 引入 ion-ios-filesystem。App 的 Swift 根依赖精确固定 2.0.0，许可原文来自对应固定 tag 的提交 13848aa。Mac 首次解析后仍检查并保存 Package.resolved。 |
| Cordova 衍生兼容源码 | @capacitor/ios 中 CDVPlugin 等源文件声明 Apache-2.0 与 ASF NOTICE。补入 ASF 的许可证及 NOTICE，保留其中其他署名；声明里的版本是 Capacitor 兼容层版本，不宣称安装了上游 Cordova 8.0.1。最终二进制框架及 Archive 的原文覆盖仍需 Mac 检查。 |
| Lucide 与 Feather | 复制 lucide-react/LICENSE 全文，包括 ISC 与衍生 Feather 图标的 MIT 版权信息，未只保留第一段。 |
| shadcn 样式 | 沿用项目已有 vendor/shadcn-tailwind-4.13.0.LICENSE.md，未改变样式来源或声明。 |

补充原文与来源配置保存在 vendor/ios-notices/。来源为发布者/权利人的仓库：[react-remove-scroll-bar 作者许可](https://github.com/theKashey/react-remove-scroll-bar/blob/8ca9ba5ea52de03308fe8ced94f7b159a44d28ff/LICENSE)、[IONFilesystemLib 2.0.0](https://github.com/ionic-team/ion-ios-filesystem/blob/13848aab4f3447ff98dfdbe72ff8ef31bf333db0/LICENSE)、[ASF Cordova 许可与 NOTICE](https://github.com/apache/cordova-ios/tree/rel/8.0.1)。

## 验证范围

`npm run ios:check` 核对原生资源登记和版本固定。`npm run test:ios:notices` 核对所有记录的原文、摘要、原生复制、图标衍生声明、可复现生成，以及缺失/未核定许可的拒绝行为。plist 的 XML 结构另在本地使用标准 plistlib 解析。

此阶段未运行 iOS 系统设置页面、Swift 编译或 Archive。真机验收检查入口、版本、长文滚动及最终安装包资源，并核对所有解析后的原生框架。contentRights 仍为 pending；本记录不会自动把运营或赛事资料使用权改成已核定。

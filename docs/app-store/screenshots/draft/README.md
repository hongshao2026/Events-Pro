# 原生截图开发草稿

2026-10-09 整理，两种型号各五张。来源是 [真实模拟器 Run 37807293715](https://github.com/hongshao2026/Events-Pro/actions/runs/37807293715)，源码 `e1b18803ff99a8b98a00e2d84f5679c8edd90a09`，Xcode 26.3（17C529）/ iOS 26.2 / `1.0.0 (1)` / 开发 Bundle ID `com.example.eventspro`。两组实际 XCTest 各 1 项通过、0 失败；不签名，无真机或 TestFlight 安装。

通过正常界面将 KPC BANKROLL BUILDER Day 1A、1B 设参加，Day 1C 设关注；自选 3 条、参加 2、关注 1，按起始组合计 ₩1,600,000。日历为三个起始场次及一个条件 Final，图片包含完整三条记录及七列。没有注入数据、模拟插件或私人计划。

| 场景 | iPhone 16 Pro，1206 × 2622 | iPhone 16 Pro Max，1320 × 2868 |
|---|---|---|
| 赛事首页 | [01-events.jpg](medium/01-events.jpg) | [01-events.jpg](large/01-events.jpg) |
| KPC 完整赛程 | [02-schedule.jpg](medium/02-schedule.jpg) | [02-schedule.jpg](large/02-schedule.jpg) |
| 个人日历 | [03-calendar.jpg](medium/03-calendar.jpg) | [03-calendar.jpg](large/03-calendar.jpg) |
| 自选与预算 | [04-shortlist.jpg](medium/04-shortlist.jpg) | [04-shortlist.jpg](large/04-shortlist.jpg) |
| 完整图片预览 | [05-image.jpg](medium/05-image.jpg) | [05-image.jpg](large/05-image.jpg) |

采集使用 `XCUIScreen.main.screenshot()`，由 UIKit 编码 JPEG 后原样复制；未裁切、缩放、合成或添加宣传字。全部像素尺寸及 `hasAlpha: no` 已用 sips 核对，逐图查看了页面、文字、金额及图片预览。来源附件名、时间、构建字段、结果文件摘要和每张图片 SHA-256 见 [capture-manifest.json](capture-manifest.json)。完整 xcresult/原生树/日志下载至工作区 `.sites-runtime/qa/remote-ios-ui-37807293715/`，GitHub 临时附件保留 14 天，本机原件保留。

这些是开发身份下的原生草稿。部分页面捕获于滚动位置，没有显示状态栏；本机模拟器及真机仍需复核顶部、状态栏与安全区，再选择最终取景。此组未展示跨系列原币分列、置顶或当天日程详情；按 [正式截图执行单](../../STORE-SCREENSHOTS.md) 补充。主界面实际为简体中文，不能把繁体商店文案写成完整繁体界面。

系统分享只验证入口存在，未执行存储、发送、文件恢复或覆盖升级。正式身份、完整真机验收、素材依据、最终候选构建及 App Store Connect 上传均待完成；`storeScreenshots` 与 `nativeDeviceQA` 保持 pending。

# iPhone 商店截图执行单

状态：已取得远程真实 iOS 模拟器首页原图，完整商店组图待制作。2026-10-08 已核对 [Apple 截图规格](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)。[远程启动检查](https://github.com/hongshao2026/Events-Pro/actions/runs/37792355643) 使用 `3cc35fa` / `1.0.0 (1)` / `com.example.eventspro`，在 iPhone 16 Pro、iOS 26.2 上采集 1206 × 2622 原生首页，已人工查看正常。其原始 PNG 含 alpha，仅作为 QA；启动脚本现已增加直接采集无透明 JPEG。仍无本机模拟器或真机结果，完整功能与正式身份未验收。浏览器 QA 图片仅作为布局检查。

[JPEG 复验](https://github.com/hongshao2026/Events-Pro/actions/runs/37794750850) 已成功：源码 `61a4ea1`，同一版本、型号与 OS，直接采集 `01-events.jpg` 为 1206 × 2622、无透明通道，已人工查看；SHA-256 `91fad9f2cf8da63cce0b4e3e6c870fba0805a98367c0d753b59032bc7fdb717f`。文件保存在工作区 `.sites-runtime/qa/remote-ios-startup-37794750850/`。这是开发身份下的原生首页草稿，完整组图与 App Store Connect 上传仍待执行。

## 候选构建与尺寸

最终截图须对应实际通过验收的候选构建，记录源码提交、Bundle ID、版本/构建号、设备/模拟器型号及 iOS 版本。当前 `1.0.0 (1)`、`com.example.eventspro` 为开发配置，不能记为已核定发行身份。

准备两套相同场景的竖屏原图：

| 对应设备 | 原生像素尺寸 | 当前状态 |
|---|---|---|
| Dynamic Island 中屏，例如 iPhone 16 Pro | 1206 × 2622 | 已有远程首页 QA 图；完整候选组图待制作；Apple 当前必需尺寸类别 |
| Dynamic Island 大屏，例如 iPhone 16 Pro Max | 1320 × 2868 | 待截图；用于大屏展示 |

Apple 当前接受 PNG/JPEG，每个设备尺寸至少 1 张、最多 10 张，无透明通道。最终以 App Store Connect 实际显示的必需槽位与提交当天官方规格复核，不用缩放浏览器画面填充原生截图。当前工程仅支持 iPhone，未加入 iPad 截图或优化声明。

## 可复现的展示安排

在专用测试安装中通过正常界面添加演示记录，避免真实用户名和个人计划。用固定的已收录场次验证跨系列：WPT W01 R0 设为参加，WPT W02 R1 设为关注，再加入一项 KRW 与一项 VND 参加场次，记录其正式条目 ID 和显示金额。金额应与该构建的目录、汇率和预算模式一致；不添加虚构赛事或实时状态。

| 文件名 | 真实页面及操作 | 繁体宣传短句草稿 | 核对事项 |
|---|---|---|---|
| 01-events.png | 赛事首页，置顶一站，显示地区与赛期分组 | 依地區探索賽事 | 截图当天阶段来自实际赛事当地日期，不强制显示过期“即将到来” |
| 02-schedule.png | 系列完整赛程，展示开赛/截买/金额与筛选 | 找到適合的場次 | 完整金额可读；没有无来源的倒计时或奖池 |
| 03-calendar.png | 我的日程，选有参加/关注的日期 | 安排個人日曆 | 只有参加和关注；晋级续赛不增加买入 |
| 04-shortlist.png | 我的自选，表格与原币预算 | 整理自選與預算 | 可横向滚动；币种分别合计；不是报名确认 |
| 05-image.png | 导出图片后打开应用内完整预览 | 匯出完整計畫 | 用户尚未点击分享时不自动打开系统菜单；不显示“已发送” |

主界面保持实际简体中文，繁体短句属于商店宣传文字，不声称完整繁体 UI。先交付原生原图；如后续设计商店排版，保留可核对的原图与版本记录。

## 模拟器截图操作

Xcode 编译并启动该候选构建，选择对应型号的模拟器。通过正常界面准备上述场景后，在工作区根目录保存原图：

```sh
mkdir -p .sites-runtime/qa/store-screenshots/medium
xcrun simctl io booted screenshot --type=jpeg .sites-runtime/qa/store-screenshots/medium/01-events.jpg
sips -g pixelWidth -g pixelHeight -g hasAlpha .sites-runtime/qa/store-screenshots/medium/01-events.jpg
```

逐场景截图，再在大屏模拟器重复到 `large/`；表格中的 `.png` 场景名也可使用对应 `.jpg`。直接采集 JPEG 可避免 simctl 默认 PNG 的 alpha 通道，仍须核对 `hasAlpha: no`、实际像素与画面。这里的 `booted` 只在仅有一个已启动模拟器时使用；多个模拟器时先用 `xcrun simctl list devices booted`，明确目标 UDID 再截图。测试日志和截图原件暂存忽略目录；最终选定的非私人商店图再保存到 `docs/app-store/screenshots/` 并登记摘要。

## 最终交付记录

| 字段 | 值 |
|---|---|
| 源码提交、版本/构建号、Bundle ID | 待定 |
| 两套设备/模拟器型号与 OS | 待执行 |
| 实际原图文件及 SHA-256 | 待执行 |
| 像素、无透明、文字与画面核对 | 待执行 |
| App Store Connect 上传结果 | 未执行 |

实际原生截图、构建对应关系和复核完成后，才将 `readiness.json` 的 `storeScreenshots` 指向真实报告并标为 `verified`。模拟器截图可以用于商店，但不证明真机功能已通过。

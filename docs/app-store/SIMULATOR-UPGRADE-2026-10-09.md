# 真实模拟器覆盖安装保留记录

执行日期：2026-10-09（Asia/Shanghai）。[Run 37815336608](https://github.com/hongshao2026/Events-Pro/actions/runs/37815336608) 两组成功；Codex 已读取两个阶段的实际 XCTest、核对 Swift 锁并查看四张原生图。本记录是同源码高原生构建号探针，尚未完成真机、设置备份、变更代码迁移或 TestFlight 更新验收。

## 构建与执行身份

| 字段 | 实际记录 |
|---|---|
| PR / 分支 | [草稿 PR #2](https://github.com/hongshao2026/Events-Pro/pull/2) / `codex/mac-ios-validation` |
| 分支源码 | `fa8546983c745785df22803a2a1146a898353d3d` |
| 实际 CI 源码 | `4f44383689f2ee31366c0b87d029280fbf416f66`，父提交为 main `f380631` 与上述 head，已核对源码树完全一致 |
| 版本 / Bundle ID | `1.0.0` / 开发占位 `com.example.eventspro` |
| 首次 / 覆盖安装原生构建号 | `1` → `2`，同一 Bundle ID，不卸载、不恢复备份 |
| 包的范围 | 相同应用源码和网页资源；Xcode `CURRENT_PROJECT_VERSION=2` 递增原生构建号。公开配置与系统许可页仍为构建 1，探针包不是正式候选或上传包 |
| Xcode / SDK / runtime | Xcode 26.3（17C529）/ iphonesimulator26.2 / iOS 26.2 |
| 安装与执行 | GitHub macos-15 真实新建模拟器、不签名；CI 自动执行，Codex 读取与人工查看原图 |
| 模拟器 | iPhone 16 Pro、iPhone 16 Pro Max；仅清理任务自己创建的设备 |
| 正式 Archive / TestFlight | 未执行 |

## 步骤与结果

1. 实际编译、安装构建 1，通过正常原生界面把 KPC BANKROLL BUILDER Day 1A、1B 设参加，Day 1C 设关注。
2. 首次 XCTest 检查全部自选 3、计划参加 2、正在关注 1；预算 ₩1,600,000，关注不计；日历三个起始场次与一个条件 Final；完整图片预览及同次安装重启保留。
3. 重新构建更高原生构建号，核对相同 Bundle ID、版本与 CFBundleVersion 2，再实际覆盖安装。
4. 独立 XCTest 仅通过正常导航读取既有自选、预算和 KPC 日历，不重新创建选择、不导入文件。测试结束后再次读取已安装原生包，确认仍是构建 2。

| 设备 | 首次 XCTest | 覆盖安装后 XCTest | 最后已安装原生构建号 | 完成时间（UTC） |
|---|---|---|---|---|
| iPhone 16 Pro | 1 通过 / 0 失败 / 0 跳过 | 1 通过 / 0 失败 / 0 跳过 | 2 | 2026-10-08 17:28:52 |
| iPhone 16 Pro Max | 1 通过 / 0 失败 / 0 跳过 | 1 通过 / 0 失败 / 0 跳过 | 2 | 2026-10-08 17:29:45 |

两组 success、coverInstalled、retainedPlanVerified 均为 true，无附件导出错误；实际 Package.resolved 与工程锁逐字一致。覆盖安装以及 XCTest 再次安装均改变了数据容器绝对路径，记录仍保留。首次探针曾把路径相同误作要求，导致在新包 UI 测试前失败；已按 [Apple TN2285](https://developer.apple.com/library/archive/technotes/tn2285/) 修正，原失败证据见 [Mac 验收记录](MAC-VALIDATION-2026-10-08.md)。

## 原生证据

| 设备 | 覆盖安装后自选 / 预算 | 覆盖安装后 KPC 日历 | results.json SHA-256 |
|---|---|---|---|
| iPhone 16 Pro | [原图](qa/upgrade-2026-10-09/medium-shortlist.jpg) | [原图](qa/upgrade-2026-10-09/medium-calendar.jpg) | `b4261bfc915184bf4f8715821aec99384fbab20e439aadd7a202246201379daa` |
| iPhone 16 Pro Max | [原图](qa/upgrade-2026-10-09/large-shortlist.jpg) | [原图](qa/upgrade-2026-10-09/large-calendar.jpg) | `4131a0417337abea0100a3e212d9d65f11224b42a04701833c3a742e043cfe89` |

四张图由 XCUIScreen 原生采集、UIKit JPEG 编码后原样复制，未裁切、缩放或合成。标准尺寸 1206 × 2622、大屏 1320 × 2868，sips 确认全部无透明通道。已人工查看自选数量、金额及日历 10/10 三场、10/11 一场；完整控件树另确认四条活动。取景和安全区仍待本机/真机复核，这些是 QA 原图，未作为正式商店截图。

逐图时间、摘要和原生附件名保存在 [capture-manifest.json](qa/upgrade-2026-10-09/capture-manifest.json)。完整原件（两阶段 xcresult、日志、PNG/JPEG、控件树）下载至工作区 `.sites-runtime/qa/remote-ios-upgrade-37815336608/`；GitHub 附件保留 14 天，本机保留，四张非私人 QA 原图另随本报告保存。

## 验收界限

| 项目 | 模拟器实际结论 | 真机 / TestFlight |
|---|---|---|
| Q02 自选 | KPC 三条正常选择、重启和本次覆盖安装保留通过；跨系列与异常写入未验证 | 未执行 |
| Q03 预算 | 起始组模式 ₩1,600,000、关注不计，覆盖安装后保持；其他模式、币种、个人汇率未验证 | 未执行 |
| Q04 日历 | KPC 三个起始场次、一个条件续赛，覆盖安装后保持；其他系列未验证 | 未执行 |
| Q08 升级 | 本次同源码原生构建 1→2 的计划/预算/日历保留部分通过；Q07 设置、变更代码迁移、正式候选更新未验证 | 未执行 |
| Q06 / Q07 备份 | 文件存储与恢复未执行 | 未执行 |
| Q09–Q12 | 系统分享/照片权限、完整可用性、最终隐私支持、Archive/上传未验收 | 未执行 |

首版免费、离线、登录默认关闭。没有 Apple 签名、账号注册、应用上传或 App Review 提交，四项发行 readiness 继续 pending。

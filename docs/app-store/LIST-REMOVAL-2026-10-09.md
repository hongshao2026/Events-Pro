# 列表直接移除验收（2026-10-09）

工作区：`~/Developer/Events-Pro-mac-ios`，分支 `codex/mac-ios-validation`。本轮基线 `770d765`，应用源码提交 `d94de89695a9caea7fd07d9d0db89a190c478765`；原生测试最终修补/验收提交 `f8cabb95a12f457da145022600d87660502b5acd`，未再改应用源码。主目录 main 保持 `f380631`，本轮不合入 main。延续同一独立工作区的 Mac 提审准备与预览修补。

## 用户行为与兼容性

- 赛程已关注的起始组在外层直接显示“不关注”，替换不清楚的“已关注”操作字样；无需进详情。保留原 58×44px 位置，金额和开赛/截买不被覆盖。
- 自选表格的固定赛事名称栏新增“不关注”（关注行）或“移出自选”（参加行）。按钮至少 44px，横向滚动后仍可见，使用同一个 `RemoveSelectionButton`。
- 移除只将当前起始组恢复为待定；可从赛程重新添加，不删除官方赛事、不连带清空其他起始组。数量、日历及原币预算随成功写入更新。表格移除后焦点回到自选摘要；被筛选移出的发现行沿用结果摘要焦点恢复。
- 写入失败保留界面和原存储、展示既有错误与重新读取入口，允许重试。数据不可读等阻塞状态禁用按钮。赛程的“计划参加”仍为标记，参加行的直接移除位于自选表格。
- 复用既有 onChoose/commit、分类和预算来源；无存储、依赖、备份或 Swift 应用接口变化。免费、离线和登录默认关闭保留。操作可逆，不添加确认弹窗。

## 实际验证

| 检查 | 本轮结果 |
|---|---|
| 完整 `npm run verify` | 退出 0：lint、TypeScript、单元、离线构建、全部浏览器回归、模拟登录、iOS 同步/资源、依赖声明、政策草稿、隐私 WebKit/Chromium 与模拟原生桥检查 |
| 新的浏览器行为 | 离线、320px 固定名称栏与目标尺寸、关注/参加逐行移除、分类筛选下移除、键盘、焦点、重启保留、空自选、预算和日历更新、同赛事组独立、写入失败保留原 JSON 均通过 |
| 严格 UI 静态审计 | 退出 0，无 findings；不能代替运行时验证 |
| DESIGN.md 官方 lint | 退出 0、0 errors；7 项既有 token-reference warnings 与修改前完全一致，运行时 token 未改变 |
| 真实模拟器 App 编译 | Xcode 27.0 / SDK 27.0，generic iOS Simulator，Debug，无签名，`BUILD SUCCEEDED` |
| 真实原生 UI 与有限覆盖安装 | `f8cabb9`，本机 iPhone 16 Pro / iOS 27.0：首次及同源码构建 1→2 同 ID 覆盖安装后的独立 XCTest 各 1 项通过、0 失败、0 跳过；实际安装构建 2，既有计划/预算/日历保留；附件无错误，SPM 锁一致 |

完整检查原始日志 `.sites-runtime/qa/direct-removal-verify.log`，SHA-256 `c411803f8485cdb47d6dac9f8f3ad130a34fd799f95c802d8a877cf0409f9abe`。App 编译日志 `.sites-runtime/qa/direct-removal-xcodebuild.log`，SHA-256 `cf08a82f3ba43b61b7c922eeb55d28ab9662df2d2be0ea3886a712c3cdd2c1bc`。SPM 锁 `37aed3e931f98d30be85af6676d8316f594a51b846984847a06e61160dcb8748` 与上一轮一致。

前几轮完整检查观察到三处失败，最终均修正后重跑通过：新增失败写入检查曾误以为现有可重试按钮会禁用，按实际既有契约修正断言；紧凑详情 radio 的 ArrowRight 焦点与首页导航标题焦点均在异步更新后才生效，测试改为等待同一个预期焦点再作原断言。没有删除原断言或更改产品导航/分类逻辑。前轮失败定位来自工具输出，磁盘 verify 日志记录最终完整成功轮；原生原件另行保存。

首轮真实原生检查在 `d94de89` 执行 1 项、0 通过、1 失败、0 跳过。赛程直接不关注/重新关注及自选关注行移除已执行，画面实际为“全部自选 2”；新断言误限定为 Button，而 WKWebView 对 `aria-pressed` 分类控件暴露 Switch。`cce06e3` 复用原有 `assertShortlist` 的准确名称/任意控件匹配方式修正两处计数断言，保留实际数量与后续所有验证。该轮没有执行参加行移除、分享/备份及升级检查，不算功能通过。完整原始结果/xcresult/附件在忽略目录 `.sites-runtime/qa/ios-simulator/1791547814412-iPhone-16-Pro/`，结果 SHA-256 `7f2c1027ca7e04478d26e3496fe9f7a5240758e2cafa24fc2c551968cf77cab8`。失败收集器还报告全局 CLT 环境找不到 simctl，实际测试的 DEVELOPER_DIR 已设为 Xcode 27；本人管理员工具切换事项沿用上一轮待定，不将诊断收集错误视为功能通过。

第二轮 `cce06e3` 同样执行 1 项、0 通过、1 失败；新增的不关注、参加移除、保留兄弟起始组与预算检查已执行通过，记录了 `12-direct-row-removal` 原图。恢复测试选择时，页首“返回赛事首页”坐标在屏幕上方且不可点击；旧测试 helper 只向上滑动，不能找回屏幕上方的按钮。`069b606` 将 openKPC 的返回路径改为应用固定底部“赛事”导航，后续断言保持原样，不修改产品导航。该轮原始结果/xcresult/附件保存在 `.sites-runtime/qa/ios-simulator/1791548075296-iPhone-16-Pro/`，结果 SHA-256 `67b8a12b007a0768e4c34d4e0b4e48aa8dec5fb321d5d9c6b2fa66c31a8084e1`；分享、备份与升级尚未在这一轮执行。

第三轮 `069b606` 仍为 1 项失败：恢复测试时发现页保留了正常滚动位置，Day 1A 位于屏幕上方，旧 tap helper 继续向上滑反而使目标更远。`f8cabb9` 根据真实元素 frame 选择向下/向上滑动，仍要求存在、可点击并保留超时后的现场捕获；不注入 JS、不重置滚动或改写数据。第三轮原件位于 `.sites-runtime/qa/ios-simulator/1791548439533-iPhone-16-Pro/`，结果 SHA-256 `d4519e7d7f9c320de39d3d0394cc2dd1c6ea4a04d0071ceb36c72b90479ce113`。前三轮整体均未通过，不将已执行的局部动作当成整轮验收。

## 本轮成功原生证据

真实 XCTest 完成于 `2026-10-09T12:33:38.061Z`（本机 20:33:38）。原始结果在 `.sites-runtime/qa/ios-simulator/1791548795375-iPhone-16-Pro/`，结果 SHA-256 `1b29dfd73ba9e6a4f20e477cdf42e652876221021a6a0eed8be3d04c21d59d60`。首次用实际界面验证赛程不关注/重新关注、自选不关注及参加移出、兄弟起始组和预算，随后通过正常界面重新选择，继续核对自选 3/2/1、预算 ₩1,600,000、日历三组与一条条件续赛、PNG/两类 JSON 的真实文件标题/格式/保存操作项、取消与图片重试、同次安装重启保留。独立覆盖安装测试只读已有记录，不重新创建选择或恢复备份。

探针后已重新无签名编译普通基线，`BUILD SUCCEEDED`，实际编译 App 为构建 `1`；日志 `.sites-runtime/qa/direct-removal-final-baseline.log`，SHA-256 `fd9cacb56e91894987cf8fbff020e317195a41823ffde16cf9d46d345555aba7`。探针构建 2 不作为正式候选。

三张真实 XCTest JPEG 均已人工查看、原样复制，尺寸 1206×2622、无透明通道，文件 SHA-256/来源/摘要见 [capture-manifest.json](qa/list-removal-2026-10-09/capture-manifest.json)。只含公开 KPC 样例选择，无用户预览数据；属于 QA 原图，不是已验收的商店截图。

- [赛程外层不关注](qa/list-removal-2026-10-09/medium/discovery-unwatch.jpg)
- [自选名称栏移出按钮](qa/list-removal-2026-10-09/medium/shortlist-actions.jpg)
- [只剩 Day 1B、预算降低到 ₩800,000](qa/list-removal-2026-10-09/medium/after-row-removal.jpg)

同一源码 `f8cabb9` 的 [Project checks 37930404431](https://github.com/hongshao2026/Events-Pro/actions/runs/37930404431) 完整 verify 成功；[远程两型号原生检查 37930404352](https://github.com/hongshao2026/Events-Pro/actions/runs/37930404352) 在本报告记录时 iPhone 16 Pro job 已成功，Pro Max 仍运行，整体不能当作通过。之前 cce06e3/069b606 的远程原生失败保留；d94de89 的过时原生检查已取消，不能当作通过。新增本报告与图片仅为文档，不改变应用/测试源码。

## 用户预览与验收范围

已将应用源码 `d94de89` 的 `1.0.0` 构建 `1` 原地装回“Events Pro 预览”，启动成功；没有卸载或抹除该模拟器。自动化使用另外新建的 QA 模拟器，避免改动用户预览中的个人选择。当前 bundle ID 仍为占位 `com.example.eventspro`。

本报告不代表真实 iPhone、签名、正式 Archive、完整功能矩阵、真实文件保存/两类备份恢复、设置保留、跨源码升级、TestFlight 或 App Review 验收。开发者会员、运营身份与公开政策 URL、内容权利及正式截图保持待定；readiness 不因本轮检查而改为 verified。

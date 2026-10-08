# KPC 济州岛赛程导入交付

本功能位于 `Events-Pro-kpc`，分支 `codex/kpc-schedule-import`。从本地 `main@7a30ef9` 建立独立 worktree，再快进复用已经提交的 `da7c84f`（含 QPC、多币种预算、个人设置和本机管理）。主目录、其他功能目录及其未提交 HTML 均未修改。本功能交付源码提交；本地预览 HTML 已重新构建，生成物留待集成阶段统一提交。未合入 main、未推送或部署，登录继续默认关闭。

## 产品行为

首页亚太地区新增 KPC 济州岛 2026，10 月 10–21 日、LES A Casino、KST。官方 101 条记录归并为 73 项赛事、86 个起始/独立场次和 15 个续赛；保留真实编号与 UUID，8 场卫星默认展示。官网当前数据、较早 PDF 差异和资格限制见 [来源记录](sources/kpc-jeju-2026.md)。

同系列的 KRW/USD 赛事分别显示原币金额、筛选、排序及预算。报名截止保留韩国本地日期和分钟；晋级续赛沿用选择且不重复计费。韩元可选为显示货币，默认汇率为空，可在管理页填写。旧设置/备份迁移只补缺失 KRW 汇率，不更改已有数值。美元赛事在管理页仍使用 USD 金额单位。

## 共享接口与兼容

- `Currency`、`DisplayCurrency` 和 `ExchangeRates` 增加 KRW；`moneyFilters` 可接收系列币种列表，混币阈值使用明确币种前缀。旧单币种 URL 数值保持有效。
- `Series.currencies` 可选；`Event.currency` 仍是每个条目与预算的币种来源。金额排序先分币种，不以未经换算的不同币种数值比较。
- `Slot.stageLabel` 可选，显式区分当前场次阶段与卫星目标赛事名称；旧数据继续使用原有解析。
- 自选存储 v2 和设置存储 v1 不变，无依赖变更。已有 WPT、Triton、QPC、个人设置、本机管理和默认关闭的账户能力均保留。

## 实际验证

- `npm run verify` 完整通过：ESLint、TypeScript、全部单元测试、离线构建、WPT/Triton/QPC/KPC/首页/个人设置/管理页回归，以及隔离的模拟登录测试。
- 7 份浏览器报告共 81 组检查，无页面异常、无真实网络请求；覆盖 320/390px 手机、桌面、键盘、故障恢复、旧备份、混币预算和条件续赛。
- KPC 数据测试按原始快照逐条核对全部 101 个 UUID、日期、分钟、币种、金额、保底、筹码、级别和截止；资格决赛与 OFC 的明确规则覆盖有独立断言。
- `python scripts/build-kpc-import.py --source sources/kpc-jeju-2026.source.json --output .sites-runtime/kpc-replayed` 重放后，数据、行快照、来源快照与 manifest 均逐字节一致。
- 前端 strict audit 为零 findings；`designmd lint DESIGN.md` 为零错误，7 个既有颜色 token 引用提示。视觉 token 未变；设计文档仅扩展 KRW、混币筛选与品牌文字回退说明。
- `git diff --check` 通过。浏览器报告和截图在 `.sites-runtime/qa/`，静态审计在 `.sites-runtime/premium-audit.json`，不加入源码提交。

## 当前边界

赛程是 2026-10-08 官网快照，不自动联网刷新。完整官方规则和盲注结构已归档，但本次仍沿用产品已有的筹码、级别分钟和报名截止展示。较早 PDF 与官网存在差异，采用当前官网并保留说明。韩元参考汇率未猜填；真实登录服务没有启用或实测。

## Logo 补充（2026-10-08）

用户追加要求后，首页与赛程页头接入 KPC 官方金黑横版透明 PNG。原始文件 92,297 字节，直接保存并离线内嵌，未重绘或改色；来源与校验值见 assets/README.md。本次沿用已有 SeriesLogo 组件、图片比例和错误回退，不更改赛事数据、共享接口或依赖。

Logo 补充验证：lint、typecheck、全部单元测试、build 和 test:ui 均通过；已目视检查 390px 首页卡片与紧凑页头，离线无异常请求。strict audit 零 findings；designmd lint 零错误，保留既有 7 项 token 引用提示。未新增数据接口、依赖或存储行为。

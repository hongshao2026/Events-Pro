# Events Pro · 线下扑克赛事自选平台

用手机风格的界面发现比赛、选择起始组、整理自选和每日参赛日程。当前包含 Wynn WPT 2026 和 Triton ONE North Cyprus 2026，完整运行在本地浏览器。页面顶部的“赛事系列”可切换两站。

仓库：<https://github.com/hongshao2026/Events-Pro>

## 直接使用

下载仓库 ZIP 并解压，使用 Chrome 或 Edge 双击打开 **`release/WPT赛事自选表.html`**。无需安装、登录、联网或启动后台。

底部三个入口：

- **赛事发现**：按报名费、保底、类型、日期和分类筛选；Day 1A、1B 等起始组各有独立条目。
- **我的日程**：月历选日期，只显示参加和关注的比赛，按时间逐行排列；待定和不考虑不显示，日期色点与场次数同步过滤。
- **我的自选**：参加和关注的场次按日期整理，显示美元和人民币预算。

分类颜色在所有页面统一：**蓝色待定、绿色参加、金色关注、灰色不考虑**。

WPT 数据包含 75 项原海报赛事、102 个起始场次和 23 个晋级续赛；另有 11 场可选补充卫星。Triton ONE 北塞浦路斯站（2026 年 11 月 5–15 日）包含 22 项赛事、29 个起始场次和 9 个晋级续赛，其中 6 场卫星默认展示。续赛以成功晋级为前提，不增加报名预算。各起始组共享整项赛事保底。

个人分类保存在当前浏览器的 `localStorage`，不会上传到 GitHub。继续使用旧版时请保持原文件位置；改用本仓库的网页前，先在旧版导出 JSON 备份，再到新版恢复。开发服务和单文件网页也需要用备份转移记录。

## 登录功能（保持关闭）

已加入 Google 登录、邮箱验证码登录和账户状态管理，默认 `VITE_AUTH_ENABLED=false`。本次没有配置真实认证服务或启用入口。离线构建始终关闭登录；现有赛程与备份继续使用本机存储。后续配置与在线构建方式见 [AUTH.md](AUTH.md)。

## 本地开发

需要 **Node.js 22.13+**，推荐 Node.js 24。使用 npm 和随仓库提交的锁文件。

```bash
git clone https://github.com/hongshao2026/Events-Pro.git
cd Events-Pro
npm ci
npm run dev
```

开发服务默认地址为 `http://127.0.0.1:5173`；若端口占用，以终端显示的地址为准。

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run build` 在项目内生成两种输出：

| 路径 | 用途 |
| --- | --- |
| `release/WPT赛事自选表.html` | 脚本、样式和赛程内置的单文件，可直接双击；仓库保留一份已构建版本 |
| `local-dist/` | Vite 静态构建目录，可通过 `npm run preview` 本地预览；不提交 Git |

构建不会写入项目外部，也不会发布网站。单文件的内容安全策略禁止网络连接；官方赛程链接由用户主动打开。

## 测试

- `npm test`：本地状态、跨系列预算与备份、日程模型及导入资料检查，覆盖旧记录迁移、预算、无效备份、失败写入和续赛去重。
- `npm run test:ui`：离线浏览器检查（WPT 回归与 Triton 跨系列检查），覆盖手机布局、日历、颜色同步、备份恢复、页面历史与浏览器重启保存。
- `npm run test:auth`：登录开关、公共配置、字段校验和回调边界检查，也包含在 `npm test` 中。
- `npm run test:auth:ui`：隔离的 Google/邮箱登录浏览器测试，覆盖失败、限流、会话、退出、键盘和手机布局；只使用模拟服务，不启用项目登录或发送真实邮件。

首次运行浏览器测试前：

```bash
npx playwright install chromium
npm run build
npm run test:ui
```

可用 `CHROMIUM_EXECUTABLE` 环境变量指定已有 Chrome 的可执行文件。测试使用独立临时浏览器配置，不接触个人浏览器数据。截图、报告和单元测试临时构建写入被 Git 忽略的 `.sites-runtime/`。

GitHub Actions 会在提交 `main` 和打开 PR 时执行上述检查与浏览器测试；工作流仅验证代码，不部署网站。

## 项目结构

```text
Events-Pro/
├── app/
│   ├── planner.tsx          # 页面导航、筛选、自选与共享状态
│   └── globals.css          # 手机布局、统一主题和四种分类颜色
├── components/
│   ├── planner/            # 赛事日历、我的日程、分类、详情等业务组件
│   └── ui/                 # 共用基础控件：Calendar、Sheet、Select 等
├── lib/
│   ├── schedule.json       # 原始赛事目录与起始组/续赛数据
│   ├── schedule.ts         # 数据类型、分类、金额和显示工具
│   ├── catalog.ts          # 系列元数据、场次 ID 与展平目录
│   ├── agenda.ts           # 日程模型和 URL 状态
│   └── local-store.ts      # 本地存储、迁移、JSON 备份、预算
├── scripts/build-local.mjs # 构建并打包为本地单文件
├── tests/                  # 状态、日程与浏览器检查
├── release/                # 已构建网页和中文使用说明
├── vendor/                 # 基础样式及其第三方许可
├── index.html
├── local-entry.tsx         # React 启动入口
├── package.json
├── package-lock.json
├── CONTRIBUTING.md         # 并行开发方法与模块边界
├── DESIGN.md               # 视觉规范
├── UX-CONTRACT.md          # 行为、兼容和验证约定
└── PRODUCT.md              # 当前能力与平台路线
```

技术栈：React、TypeScript、Vite、Tailwind CSS、Radix UI、React DayPicker。项目已独立整理，运行不需要 Sites、Next.js、Cloudflare、数据库或认证服务。

## 开始并行开发

每个功能使用独立分支、独立 worktree，避免多人改同一工作目录：

```bash
git fetch origin
git worktree add ../events-calendar -b codex/calendar-export origin/main
git worktree add ../events-catalog -b codex/multi-series origin/main
```

在每个 worktree 内分别运行 `npm ci`。同时启动时指定不同端口，例如 `npm run dev -- --port 5174`。

先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。共享数据类型和本地存储变更应先对齐接口；页面功能尽量放到 `components/planner/`，通过 props 连接已有状态。每个 PR 写清行为变化和验证结果，保持 `main` 可构建、可运行。

## 当前边界

当前包含两个真实赛事系列。账户模块已实现但默认关闭；会员支付、广告、跨设备同步和提醒尚未实现，路线见 [PRODUCT.md](PRODUCT.md)。选择“参加”是个人参赛计划，不会向赌场实际报名。

赛程保留 [Wynn 官方来源](https://cdn.wynnresorts.com/image/upload/v1757097329/visitwynn_pdfs_files/Poker/WPT/WPT_World_Championship_Schedule.pdf)；本项目不代表主办方，临行前请核对最新官方赛程。第三方样式许可见 `vendor/`。

Triton 资料来源与原件差异见 [sources/README.md](sources/README.md)。新增跨系列浏览器检查：构建后运行 `node tests/triton-ui.test.mjs`。单文件继续使用原文件名，以便沿用同一位置的本地记录；Triton 原始 PDF 已内嵌，可从页面底部下载。

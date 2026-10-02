# 并行开发约定

## 工作方式

1. 从 `origin/main` 为一个具体功能建立 `codex/<功能名>` 分支。
2. 每个功能使用独立 worktree，分别安装依赖。不要共用 `node_modules`、构建目录和浏览器测试配置。
3. 开始前列出计划修改的文件；如果两个功能依赖同一接口，先合并最小接口变更，再继续各自实现。
4. 通过 PR 合并。同步主分支时使用普通 merge 或在自己的分支上 rebase；不强推共享 `main`。

```bash
git fetch origin
git worktree add ../events-reminders -b codex/reminders origin/main
cd ../events-reminders
npm ci
npm run dev -- --port 5175
```

## 模块边界

| 模块 | 主要文件 | 协作约定 |
| --- | --- | --- |
| 页面导航与状态协调 | `app/planner.tsx` | 作为集成入口；新功能尽量先放独立组件，减少多人同时修改 |
| 赛事与起始组目录 | `lib/catalog.ts`、`lib/schedule.ts`、`lib/schedule.json` | ID 必须稳定；新增系列前先明确系列、赛事、起始组、时区和币种接口 |
| 每日行程与日历功能 | `lib/agenda.ts`、`components/planner/my-schedule.tsx` | 续赛按实际日期显示，只生成一次，不新增买入 |
| 自选保存、备份、预算 | `lib/local-store.ts` | 改存储结构必须提供旧版迁移、有效性校验和失败保护 |
| 分类与详情 | `components/planner/controls.tsx`、`status.tsx`、`entry-details.tsx` | 继续复用共同控件，不为新页面另造分类逻辑 |
| 主题和基础控件 | `app/globals.css`、`components/ui/` | 全局颜色、布局变更先更新 `DESIGN.md`；保持四种分类颜色一致 |
| 构建与发布文件 | `scripts/build-local.mjs`、`release/` | 所有输出位于项目内；发布网页由源码生成，不能手改内嵌代码 |

可独立规划的后续功能包括日历导出、资料导入、多系列目录和提醒。这些是开发方向，当前仓库尚未提供这些能力。

## 必须保留的行为

- 起始组独立选择；分类互斥，分类筛选采用并集，筛选不改变个人选择。
- `attend` 和 `watch` 加入自选，只有 `attend` 计预算。保底属于整项赛事，不能累加。
- `localStorage` 写入成功后才显示成功；无效备份、取消恢复和写入失败均保留现有数据。
- 旧版未指定起始组的参加记录保留为待安排，不能猜选首组或扩展成全部起始组。
- Day 2 和决赛桌以晋级为前提，不是可再次报名的独立条目。
- 日期采用赛事所在地的日历日期；当前是 Las Vegas PST，人民币预算换算当前固定为 6.7。
- 在引入远端服务前保持本地单文件可运行，不自动上传个人自选。
- 维护中文界面、键盘焦点、空状态和错误恢复；用 320px、390px 手机宽度检查。

## 提交前检查

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

界面、路由或交互有变化时，再运行 `npm run test:ui` 并查看 `.sites-runtime/qa/` 的截图。浏览器测试首次运行需要 `npx playwright install chromium`。

`release/WPT赛事自选表.html` 是仓库保留的可直接使用版本。功能分支通常只改源码；发布或集成时集中重新构建并提交它，避免多个功能同时修改大段构建代码。

不要提交 `node_modules`、个人 JSON 备份、浏览器配置、环境密钥或临时报告。`package-lock.json` 必须与依赖变更一起提交。

PR 描述应包含：用户触发场景、实际行为变化、受影响模块、验证命令，以及任何存储或数据兼容影响。

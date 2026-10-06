# 多功能同时开发与合并

每个功能验收通过后即可逐个合并，合并后的组合还必须验收。Git 没有文本冲突，只说明文件能够拼接；导航、数据或旧功能仍可能被改坏。一个集成对话负责主分支，其他对话各自使用独立目录和分支。

## 1. 开工：一个对话、一个功能、一个 worktree

主目录 Events-Pro 的 main 用作已验收版本，由集成对话维护。功能目录如 Events-Pro-reminders、Events-Pro-calendar-export 各自绑定 codex/<功能名>。不要让多个对话在同一工作目录切换分支或修改文件。

从最新已验收的本地 main 创建功能目录；本地尚未推送时，origin/main 可能落后，不能直接以它为起点。

```powershell
# 在主目录运行，先核对分支和未提交改动
git status --short
git worktree list
git worktree add ../Events-Pro-reminders -b codex/reminders main
cd ../Events-Pro-reminders
npm ci
npm run dev -- --port 5177 --strictPort
```

目录、依赖、构建输出和开发端口各自独立。不要复制整个项目覆盖其他目录，不共用 node_modules。远端协作先 fetch 核对差异，由集成对话更新本地 main 后再开工，不在功能进行中盲目 pull。

可复制给功能对话：

> 请先读 AGENTS.md 和 CONTRIBUTING.md。从最新已验收 main 建立独立 worktree 与 codex/<功能名> 分支，只实现【功能】。先报告目录、分支、基础提交和预计修改文件。保留现有首页、双赛事、自选预算、日历规则和默认关闭的登录；遇到共享接口先说明依赖。完成后验收并提交，交付提交 ID、修改范围和测试结果，由集成对话统一合并。不部署、不启用登录。

## 2. 开发：划分范围，先对齐共享接口

| 模块 | 主要文件 | 协作约定 |
| --- | --- | --- |
| 导航与共享状态 | app/planner.tsx、lib/agenda.ts | 高冲突区；新功能先放独立组件，集成时检查 URL、历史、日历和搜索一起工作 |
| 系列目录与首页 | lib/series.ts、components/planner/series-home.tsx、assets/ | seriesList 与 seriesCatalog 指向同一目录；真实赛事、日期排序、本地 Logo 或文字回退 |
| 赛事数据 | lib/catalog.ts、lib/schedule.ts、赛程 JSON、sources/ | ID 稳定；新站必须有真实场次、日期范围、时区、币种和来源 |
| 我的日程 | lib/agenda.ts、components/planner/my-schedule.tsx | 只显示参加/关注；续赛去重、不新增买入；日期色点和统计同步过滤 |
| 本地记录与预算 | lib/local-store.ts | 结构变化必须兼容旧记录；验证迁移、失败写入和备份恢复 |
| 分类与详情 | components/planner/controls.tsx、status.tsx、entry-details.tsx | 复用共同控件和分类逻辑 |
| 登录 | components/auth/、lib/auth/、local-entry.tsx | Google + 邮箱验证码；默认关闭，不能因集成而开启 |
| 主题与基础控件 | app/globals.css、components/ui/ | 共享颜色与控件；同步 DESIGN.md，不整体覆盖样式文件 |
| 依赖与交付物 | package.json、锁文件、scripts/、release/ | 依赖一起提交锁文件；集成后重新生成 HTML |

若几个功能必须修改同一核心接口，先集中完成最小接口变更并验收，各功能同步后继续。不要各自重写一份目录、存储或导航模型。

## 3. 功能验收：通过后提交，再交接

源码修改至少运行 lint、typecheck、单元测试和构建；UI、导航、日历变化再运行 test:ui，登录相关变化运行 test:auth:ui。纯文档更正检查链接与 diff 即可。完整验收可以统一运行：

```powershell
# 首次安装测试浏览器；也可通过 CHROMIUM_EXECUTABLE 指定现有 Chrome
npx playwright install chromium
npm run verify
git diff --check
git status --short
```

verify 依次执行 lint、typecheck、全部单元测试、离线构建、WPT/Triton/QPC/首页浏览器回归、模拟登录浏览器检查。截图在忽略目录 .sites-runtime/qa/。登录测试使用隔离服务和临时浏览器数据，不发真实邮件，不启用项目登录。CI 使用同一命令，不部署。

核对清单后，只暂存本功能文件并提交，不把别的对话的未完成修改一起交付。每个功能交接必须包含：

- worktree 路径、分支名、基础提交、交付提交 ID。
- 新增行为和不能丢失的已有行为。
- 共享接口、数据结构、依赖变化与兼容策略。
- 实际验证命令、结果、截图位置、尚未验证的外部服务。

功能分支交付源码与必要测试、文档。构建生成的 release/WPT赛事自选表.html 可留待集成对话集中更新。不要把“尚未提交”当作已交付。

## 4. 集成验收：一个对话串行合并

每次接收一个验收完成的功能，保留分支历史。在独立集成 worktree 合并，组合验收通过后再推进 main；已完成的功能不必等所有功能都做好。

```powershell
# 在主目录创建集成目录，目录和分支名称应唯一
git worktree add ../Events-Pro-integrate-next -b codex/integrate-next main
cd ../Events-Pro-integrate-next
npm ci
git merge --no-ff --no-commit codex/reminders
# 逐处处理冲突，核对双方功能，补充必要的组合测试
# 若合入依赖变化，重新 npm ci
npm run verify
git diff --check
# 检查并暂存本次集成文件，包括重新构建的 HTML，然后提交 merge
git add -A
git commit -m "Integrate reminders with the accepted planner"
cd ../Events-Pro
git status --short
git merge --ff-only codex/integrate-next
```

最后一步要求主目录当前在 main 且无未保存改动；否则先保护现有工作。若 main 在验收期间前进，先在集成分支合入新的 main 并重新验证，再快进。

冲突处理与验收规则：

- 先列双方功能清单，逐块合并重叠代码，不整文件采用 ours/theirs，不按修改时间挑“最新文件”。
- 没有文本冲突也检查组合行为。例如首页进入 Triton 后，日历须使用 Triton 日期，自选预算须保留 WPT。
- 保留双方有效回归检查；旧测试只在产品明确改变时调整预期，不能删除失败测试掩盖回归。
- 生成文件冲突时，用整合后的源码重新构建，不接受任意一边的旧 HTML 覆盖新版本。
- 依赖冲突先合并实际依赖，再生成一致锁文件，不用旧锁文件覆盖新增依赖。
- 不强推共享主分支、不重置其他对话、不删除未交付分支。验收和合并不代表授权启用功能或部署。

需要 GitHub 同步时，由集成对话统一推送或开 PR，并核对远端状态和 CI。本流程允许先在本地完成合并。合并后暂时保留功能分支和 worktree，确认所有成果已接收后再清理。

## 5. 继续开发：先同步新基线

尚未完成的功能在自己的目录先提交当前成果，再执行 git merge main。解决冲突、重新验证受影响功能后继续，不在共享目录切换分支。新功能都从最新已验收 main 开始。

## 必须保留的产品行为

- 起始组独立选择；分类互斥，分类筛选采用并集，筛选不改变个人选择。
- attend 和 watch 加入自选，只有 attend 计预算；保底属于整项赛事，不能累加。
- 我的日程列表、日期色点和场次数始终只含参加/关注，默认同时显示两类。
- 存储写入成功才显示成功；无效备份、取消恢复和写入失败保留现有数据。
- 旧版未指定起始组的参加记录保留待安排，不猜选首组或扩展成全部组。
- Day 2 和决赛桌以晋级为前提，不是可再次报名的独立条目。
- 日期使用赛事所在地日期：WPT 为 PST，Triton 北塞浦路斯为 EET，QPC 河内为 ICT；按原币种分别合计预算，括号估算使用个人显示货币与管理汇率，同币种不重复显示。
- 地区筛选独立于系列内场次筛选；切换系列清除不兼容筛选，跨系列自选和预算保留。
- Google 与邮箱验证码代码保留，VITE_AUTH_ENABLED=false；离线构建强制关闭登录，个人自选不自动上传。
- 保持中文界面、键盘焦点、空状态、错误恢复和 320/390px 手机布局。

不要提交 node_modules、个人 JSON 备份、浏览器配置、环境密钥或临时报告。保留 app/globals.css 排除 release/ 扫描的规则，防止旧构建污染新样式。

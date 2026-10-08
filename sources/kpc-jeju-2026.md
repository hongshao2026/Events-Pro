# KPC Poker Series October 2026 import

读取日期：2026-10-08。用户提供的[官方系列页](https://www.kpcpoker.com/seriesTournament.jhtml?leagueId=d3f5de57-34a5-4b16-bfe6-7b44251595f7&lang=en)是本次导入入口；导入采用该页当前公开 API 的场次数据，不使用搜索引擎摘录或从 PDF OCR 猜测数值。

## 系列与原始来源

- 官方名称：KPC POKER SERIES OCT 2026；原始名称末尾包含制表符，显示时去除。
- 官方系列 ID：`d3f5de57-34a5-4b16-bfe6-7b44251595f7`；产品系列 ID：`kpc-jeju-2026`。
- 日期：2026-10-10 至 2026-10-21（含首尾）；地点：LES A CASINO, JEJU ISLAND, SOUTH KOREA。
- 时间：韩国当地时间 KST，IANA `Asia/Seoul`，UTC+9。官网 `config.js` 明示 `SERVER_TZ = "Asia/Seoul"`，系列 API 场地明示 `Korea Standard Time`。
- 币种：KRW 与 USD 并存；每项赛事内部只有一种币种。官网 API 使用 `₩` 和 `$`；官方 PDF 表头明确 `₩韩币/$美元`，且保底明确标注 KRW/USD。USD 项目仍按美元记录；PDF 的近似韩元价格不是另一个买入。
- 官方旧版[赛程 PDF](https://www.kpcpoker.com/u/cms/en/202609/23121842exqf.pdf)首页版本为 `09/22/2026 (01)`，正文赛程在第 3–7 页。PDF 已逐页渲染核对，数字字体文本提取损坏，不能用提取结果代替渲染页面。
- 官网顶部 Logo 原图约 9.3 MB；产品采用系列 API 的 `venue.logoUrl` 引用的另一份官方原始透明 PNG（约 92 KB）。具体来源、尺寸与 SHA-256 见 [品牌素材记录](../assets/README.md)。首页及赛程页头共用该本地图片，失败时才回退为文字。

官网页面实际调用：

```text
POST https://www.kpcpoker.com/kpc/league/search
{}

POST https://www.kpcpoker.com/kpc/event/search
{"leagueId":"d3f5de57-34a5-4b16-bfe6-7b44251595f7","orderBy":"summaryId"}

POST https://www.kpcpoker.com/kpc/event/{official-slot-uuid}
```

赛事列表响应一页返回全部 101 条，`totalNumberOfRecords=101`、`totalNumberOfPages=1`、`pageSizeRequested=200`。101 场详情全部成功归档，包含完整盲注表、休息、规则；产品当前只显示起始筹码、默认级别分钟及报名截止，不承诺新增完整盲注表 UI。

## 导入结果与字段规则

- 73 项赛事，86 个起始条目、15 个晋级续赛，合计 101 个官方场次。其中 8 项为卫星赛，默认展示；S1 为独立资格决赛。
- 56 项 KRW、17 项 USD；按场次为 74 场 KRW、27 场 USD。
- 多日赛事依照官方 `summaryId` 归并；没有 `summaryId` 的单日赛使用自身官方 `id`。不使用每场不同的 `referenceId` 进行分组。
- 每个产品 `Slot.id` 保留官方 UUID。产品赛事 ID 采用 `KPC` 加官方编号（例 `KPC08`、`KPCM01`、`KPCMS03`、`KPCS01`），不根据名称生成主键。数字赛事写入 `officialNumber`；M/S/MS 编号写入 `displayNumber`。
- `dailyDetails.day=0/1` 归入 starts；`day=2/3` 归入 continuations。资格决赛 S1 是官方独立 day=0，保留一项并明确资格条件，不拼接到无来源的起始赛事。
- `stageLabel` 明确来源阶段。day=0 为“首轮”，S1 为“资格决赛”；day=1 使用 day 与 flight（例如 Day 1A），TURBO 保留；后续阶段为 Day 2 或 Final Day。卫星名称里的目标 Day 1 不影响自身阶段，FINAL CORONATION 首轮也不会被错误当作决赛。
- `date/hour` 从 `dailyDetails.startDate` 的韩国本地日期与分钟取得。报名截止保留完整本地日期，正确表达次日 00:15/00:45 等跨午夜截止。
- `startDateUTC` / `subscriptionCloseUTC` 并不一定带 `Z`，可能带 `+08:00` 或 `+02:00`；按显式偏移解析，与 `startDate` 加 `+09:00` 比较，不能删除偏移当成当地时间。
- 买入使用 `subscription.buyin.amount`，已包含费用；`buyin` 与 `fee` 的拆分保留在来源快照。不把 `amount` 再加一次手续费。
- 普通赛的现金保底取 `subscription.guaranteedAmount`，属于整项赛事。MS#3 官方赛名列 10 席保底，因此写 `count=10,unit=席位,guarantee=null`；接口的 13,000,000 KRW 是席位价值，不作为现金保底累加。
- 晋级续赛的产品 `buyin/chips=null`，预算不新增买入、筹码沿用晋级筹码。接口继承的原始买入/筹码保留在来源快照供追溯。
- 明确 NLH 归德州扑克；PLO/Big O 归奥马哈；混合、换牌、OFC、Fun Game 等归混合/限注。官网底层游戏类型若与标题不一致（如部分混合游戏被标记 NL Hold'em），优先尊重明确的赛事标题与规则，避免它们进入德扑筛选。

## 重要差异与有限例外

旧版 PDF 与当前官网存在实质差异。本次以用户链接所用的当前 API 为主要日程来源，相关条目附有提示。已确认的例子：

| 项目 | 9 月 22 日版 PDF | 当前官网 API / 本次导入 |
| --- | --- | --- |
| #2 决赛，10/11 | 11:45 | 12:00 |
| #10，10/11 | 每级 30 分钟 | 25 分钟 |
| #16 团队赛 | 筹码/级别 N/A，截止 14:00 | 40,000 筹码、40 分钟、截止 14:40 |
| #18 决赛 | 每级 50 分钟 | 40 分钟 |
| #8 Day 2 / Final | 每级 60 分钟 | 40 分钟 |
| #52 Day 2 / Final | 每级 50 分钟 | 默认 40 分钟；详情盲注表也包含后段 50 分钟 |
| #49 截止 | 次日 00:00 | 当天 23:59 |
| #58 截止 | 23:15 | 23:10 |
| S1 默认级别 | 20 分钟 | 30 分钟 |

两项明确规则覆盖默认数值：

1. S1 官方专属规则限混合游戏积分榜前 6 名参加，筹码按积分为 400,000–1,000,000；API 通用 `chips=10000` 与专属规则冲突。产品筹码写 null，详情保留规则范围；买入 0 保留，但资格限制明确表示它不是公开免费报名赛事。
2. #38 OFC 专属规则明确首轮 75 分钟，半决赛和决赛 90 分钟，且与 PDF 的 75/90 一致。产品 `levels="75/90"`；快照仍保留默认 `levelMinutes=90`。该时间是 OFC 轮次时间，不是推测的 NLH 盲注结构。

仍开放到续赛日的实际报名截止：

- #18：Day 2 在 10/13 13:00 开始，10/13 15:15 截止。
- #31：Day 2 在 10/15 13:30 开始，10/15 15:25 截止。
- #61：Final Day 在 10/21 13:00 开始，并在该时刻截止。

这些时间均保留在相应阶段详情，但按产品既有约定仍为续赛，不另建可重复计费条目。#2 决赛继承前一日截止，则明确提示该值不代表决赛可重新报名。其余没有官方精确截止的续赛不补造时间。

完整盲注结构包含部分变速阶段与决赛规则；产品的 `levels` 通常只表示官方当前默认级别分钟，完整详情仍以每条官方链接及来源快照为准。无官方取消信息，不臆造取消或未开赛状态。

## 文件与重放

- `../lib/kpc-jeju-2026.json`：产品赛程。
- `kpc-jeju-2026.rows.json`：101 行精简快照，用于逐行断言 ID、当地时间、币种、买入、筹码、级别、截止与日次；保留官方默认值。
- `kpc-jeju-2026.source.json`：去除玩家、直播统计和鉴权标识的来源快照，含完整规则/levels，支持独立离线重放。
- `../scripts/build-kpc-import.py`：确定性转换脚本；必须显式指定来源快照及输出目录。
- `kpc-jeju-2026.manifest.json`：计数、系列元数据、来源与来源快照 SHA-256。
- `events.raw.json`、`leagues.raw.json`、`details/*.json`、`official-schedule.pdf`、HTML/JS 保存在工作区 `outputs/kpc-import-20261008/` 研究目录，不加入离线产品 bundle。

```powershell
python scripts/build-kpc-import.py --source sources/kpc-jeju-2026.source.json --output .sites-runtime/kpc-replayed
```

已验证：全部 101 场的官方 ID 唯一；每项赛事无混币；无漏页；每个起始时间与带偏移字段等价；所有详情请求成功；来源快照重放与候选 JSON 字节一致。原始 API 未提供的资格、人数、现金保底、取消状态等不根据赛事常识补齐。

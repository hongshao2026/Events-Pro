# 赛事标志

`wpt-logo.png` 来自 [WPT 官方网站](https://www.worldpokertour.com/) 的 [标志资源](https://www.worldpokertour.com/_astro/logo.C5edcOSc.png)，于 2026-10-02 获取，用于标识目录中的 WPT 赛事。WPT 标志及商标属于其权利人。

图片由 Vite 内嵌到离线网页。新增赛事时，在 `lib/series.ts` 配置该赛事的标志、地区、国家和日期；同时记录资源来源。没有标志或图片载入失败时，界面会使用赛事品牌文字。

## Triton ONE 与 Quads（2026-10-04 保存）

| 本地文件 | 官方原件 | 用途 |
| --- | --- | --- |
| `triton-one-logo.png` | [850 × 370 透明 PNG](https://d2cnyqouho3ujg.cloudfront.net/2025-05-17_ONE_HORIZONTAL-LOGO_RGB.png) | 官网使用的纯色金色版；网页展示，约 18 KB |
| `originals/triton-one-logo-textured.png` | [6412 × 3444 透明 PNG](https://d2cnyqouho3ujg.cloudfront.net/2025-05-20_ONE_HORIZONTAL-LOGO_TEXTURED_RGB.png) | 官网高清纹理版原件；长期保存，约 3.2 MB，不打入网页 |
| `quads-logo.svg` | [Quads 官方 SVG](https://quadspoker.vn/images/logo.svg) | QPC 使用主办方 Quads Hanoi Poker Club 标识；纯矢量，可任意缩放，约 14 KB |

Triton 图片取自 [Triton Poker Series 官网](https://www.tritonpokerseries.com/en-US/home) 引用的官方 CDN；Quads 矢量取自 [QPC Circuit 官方赛程页](https://quadspoker.vn/series/qpc-circuit-2026) 页眉。QPC 这里使用 Quads 俱乐部品牌标识，不是当届带日期的赛事海报。所有文件保持下载原始字节，未重绘、放大或改色；标志与商标归各自权利人所有，用于识别赛事。

SHA-256：

- `triton-one-logo.png`：`d399d827732823d5aa3242a3c2d358264e203809dadc8d6e3229844bf85a032a`
- `originals/triton-one-logo-textured.png`：`dca6f7c0ec9c2052d92c9e923cef4b2c2534f626f0450da192960f9bcf4c5902`
- `quads-logo.svg`：`7a7393e850ac2de9c042809eb2fc4e9d9020ce9ef1261b9eb23e324c05d55dda`

文件按品牌命名，不按年份或赛站重复下载；以后同品牌赛事复用同一资源。确认品牌变更后再替换，并更新来源、日期和校验值。运行时只读仓库里的本地文件，Vite 将展示用图片内嵌到离线 HTML，不依赖官网/CDN 在线可用性。原件保留在 Git，`originals/` 仅作高清档案。

## KPC（2026-10-08 保存）

`kpc-logo.png` 是 KPC 官方系列 API 中 `venue.logoUrl` 引用的[官方金黑横版 Logo](https://api.pokerlens.net/v1/venue/image/d3c93a96-b9bc-4ad2-b530-805dc52b1abe?ts=8DF206D3960D070)，2692 × 1024 透明 PNG，92,297 字节。保留下载原始字节和透明度，没有重绘、裁剪或改色。它与官网 9.3 MB 的顶部纹理版来自不同的官方资源；采用该较小原件用于赛事卡片及紧凑页头，复用 `SeriesLogo` 的比例缩放和图片失败回退。

SHA-256：`9c1391aa3d616e61e263f9dee2aa1882014a6045a1fbcae738236606ae342c6a`。

## JPF 2026

`jpf-2026-logo.png`（1002×147）：从用户提供的 `sources/jeju-poker-festival-2026.pdf` 页首原有品牌图渲染，保留原色和年份，没有重新设计。原件 PDF 为归档母本；`scripts/import-jeju.py` 复现该素材。采集日期 2026-10-08。随单文件内嵌，网络不可用仍能展示。

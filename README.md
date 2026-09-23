# 海内集团 CinaGroup Brand

海内集团官方通用品牌资产仓库。当前集团标准为 **v2.0.0 传承字标**：保留原始左侧图案、蓝色渐变及中英文字形，提供完整组合标志、头像与平台图标。

![海内集团传承字标套件](assets/heritage/preview.png)

## 传承字标套件

| 用途 | PNG | SVG | 原生尺寸 |
| --- | --- | --- | --- |
| 横版中英组合 | [下载](assets/heritage/cinagroup-horizontal.png) | [下载](assets/heritage/cinagroup-horizontal.svg) | 3328 × 1152 |
| 竖版中英组合 | [下载](assets/heritage/cinagroup-stacked.png) | [下载](assets/heritage/cinagroup-stacked.svg) | 1408 × 1664 |
| 英文组合 | [下载](assets/heritage/cinagroup-english.png) | [下载](assets/heritage/cinagroup-english.svg) | 3072 × 1152 |
| 纯字标组合 | [下载](assets/heritage/cinagroup-wordmark.png) | [下载](assets/heritage/cinagroup-wordmark.svg) | 2176 × 960 |

每种组合还提供 `-white` 文字反白版本，以及四分之一宽度的 PNG，例如 [`cinagroup-horizontal-832.png`](assets/heritage/cinagroup-horizontal-832.png)。全部组合保留左侧全彩原图；反白版本仅改变文字颜色。SVG 自包含原稿位图，**不是纯矢量描摹稿**。

独立素材：[左侧原图](assets/heritage/cinagroup-symbol-source.png)、[中文原字标](assets/heritage/cinagroup-wordmark-zh.png)、[英文原字标](assets/heritage/cinagroup-wordmark-en.png)。完整文件、尺寸与校验值见 [套件清单](assets/heritage/manifest.json)。

## 独立图标

- **3px 圆角图标**：[`assets/icons/rounded/`](assets/icons/rounded/)，包含 16、24、32、48、64、96、128、180、192、256、512、1024px。每个尺寸独立生成 3px 圆角。
- **Web favicon**：[`favicon.ico`](assets/icons/web/favicon.ico)，内含 16、20、24、32、40、48、64、128、256px；另有 [16px PNG](assets/icons/web/favicon-16.png) / [32px PNG](assets/icons/web/favicon-32.png)。
- **Windows**：[`cinagroup.ico`](assets/icons/windows/cinagroup.ico)，九种尺寸。
- **Apple Touch Icon**：[180px](assets/icons/web/apple-touch-icon.png)，完整方形，交由系统裁切。
- **PWA**：[192px](assets/icons/web/pwa-192.png) / [512px](assets/icons/web/pwa-512.png)，普通方形图标，不作为专用 maskable 安全区图标。
- **应用原图**：[1024px](assets/icons/app/cinagroup-app-icon-1024.png)，完整方形。
- 原有 [256px 方形路径](assets/logo/cinagroup-logo.png) / [256px 圆角路径](assets/logo/cinagroup-logo-rounded-3px.png)继续可用，并更新到本次原稿。

## 固定版本引用

```html
<img src="https://cdn.jsdelivr.net/gh/cinagroup/cinabrand@v2.0.0/assets/heritage/cinagroup-horizontal-832.png"
     width="832" height="288" alt="海内集团 CINAGROUP">
<link rel="icon" href="https://cdn.jsdelivr.net/gh/cinagroup/cinabrand@v2.0.0/assets/icons/web/favicon.ico">
<link rel="apple-touch-icon" href="https://cdn.jsdelivr.net/gh/cinagroup/cinabrand@v2.0.0/assets/icons/web/apple-touch-icon.png">
```

固定尺寸 PNG 的 3px 圆角在整体缩放时也会缩放。网页需固定 3 CSS px 时使用完整方形原图配合容器圆角，详见规范。生产项目建议固定版本并在构建时复制资源；离线应用不在运行时依赖 CDN。

## 规范与复现

- [品牌使用规范](BRAND_GUIDELINES.md)：组合、名称、圆角、留白与兼容说明。
- [品牌资产政策](BRAND_POLICY.md)：使用授权。
- [机器可读清单](brand.json) / [SHA-256 清单](checksums.sha256)。
- [核准原稿](sources/heritage/cinagroup_20251026.png)：从用户提供的无损 PNG 保留。
- [生成脚本](scripts/build-heritage.mjs)：从核准原稿生成资产。
- [CinaSeek 产品契约](products/cinaseek/brand.json)、[术语映射](products/cinaseek/terminology.json)、[界面 Token](products/cinaseek/tokens.css)。

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

v1.x 标签保留此前发布的图标。历史单色文件继续保留供兼容使用，不属于本次全彩传承套件的新核准稿。

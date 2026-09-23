# 海内集团 · 传承字标规范

## 名称与原稿

- 中文名称：`海内集团`。
- 图形中的英文品牌字标：`CINAGROUP`，连续大写，使用提供的原始字形。
- 正文、产品说明及代码品牌名称仍写作 `CinaGroup`；产品采用 `Cina` + 产品名，例如 `CinaSeek`。
- 唯一原稿为 [`sources/heritage/cinagroup_20251026.png`](sources/heritage/cinagroup_20251026.png)。来源及校验值见 [`assets/heritage/manifest.json`](assets/heritage/manifest.json)。
- 左侧图案的形状、内部留白、比例、位置与蓝色渐变保持原样。中英文字形直接从原稿提取，不进行字体替换、描摹或生成式重绘。

## 组合选择

| 场景 | 文件 |
| --- | --- |
| 官网、名片、信纸、企业介绍 | `assets/heritage/cinagroup-horizontal.png` |
| 竖向版面、包装、展板 | `assets/heritage/cinagroup-stacked.png` |
| 英文材料 | `assets/heritage/cinagroup-english.png` |
| 独立文字标识 | `assets/heritage/cinagroup-wordmark.png` |
| 深色背景 | 对应的 `-white.png`；仅文字反白，左侧全彩图标保持原样 |
| 社交头像、应用入口 | `assets/icons/rounded/cinagroup-{size}.png` |

四种组合均提供透明 PNG、自包含 SVG，以及四分之一宽度的 PNG。SVG 内嵌原稿 PNG，不依赖本机字体或外部图片；它是排版容器，**不是重新绘制的纯矢量轮廓**。超大尺寸印刷应取得原始矢量稿，不将本套位图封装误称为无限分辨率文件。

## 3px 圆角

- 圆角作用于蓝色方形底板的四个外角，半径为 **3px**，不作用于内部黑色图案。
- 每个导出的圆角 PNG 都按其最终像素尺寸单独生成 3px 圆角，不把大图的圆角随缩小一起缩小。
- 横版、竖版和英文组合的 PNG 也按各自导出尺寸单独处理图标圆角。
- SVG 的 3px 半径对应其声明的原生尺寸。整体缩放 SVG 或 PNG 会同时缩放圆角；网页需要始终保持 3 CSS px 时，应使用独立方形原图并由容器设置 `border-radius: 3px`、`overflow: hidden`，避免二次裁切。
- Apple Touch Icon、PWA 及应用商店图标保留完整方形，由系统负责遮罩。需要自定义 3px 圆角时使用 `assets/icons/rounded/` 中对应尺寸。

## 尺寸、留白与颜色

- 组合文件已包含基本安全留白。外部文字、边框和其他标志不要侵入该留白。
- 必须等比缩放，不拉伸字形，不拆开或重新排列字符，不在图案上叠加徽章。
- 小尺寸优先使用独立图标。16px favicon 主要呈现整体轮廓，不能期待保留大图的所有内部细节。
- 小尺寸与低清晰度印刷不使用完整中英组合；以实际输出中中文字形清晰可辨为准。
- 原图渐变为图标的颜色依据；`brand.json` 的色值供界面搭配参考。深色应用示例背景为 `#123B56`。
- 不添加原稿没有的闪光、描边、阴影、立体效果或装饰。

## 版本与兼容

v2.0.0 改用本次核准的原稿，并新增传承字标组合。原有全彩图标路径同步更新到本次原稿；v1.x 标签保留历史图标。

`cinagroup-mark-black.png`、`cinagroup-mark-white.png` 是保留的历史单色兼容资产，不是本次从新原稿重新核准的单色组合。本套正式组合以全彩图案及原稿字标为准。CinaSeek 的产品名称、定位与界面颜色 Token 保持其原产品契约。

## 生成与校验

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

生成器校验原稿 SHA-256，再进行裁取、白底转透明、等比缩放、排版与圆角处理。测试检查原图像素一致性、字标 alpha、各尺寸的圆角、SVG 内嵌素材、ICO 内容和全部资产校验值。预览板的说明文字使用系统中文字体；正式 Logo 不依赖字体。

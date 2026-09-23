# 海内集团 · 传承字标规范

## 名称与原稿

- 中文名称：`海内集团`。
- 图形中的英文品牌字标：`CINAGROUP`，连续大写，使用定制圆角的 Geist Regular（400）字形。
- 正文、产品说明及代码品牌名称仍写作 `CinaGroup`；产品采用 `Cina` + 产品名，例如 `CinaSeek`。
- 图形与中文的原稿为 [`sources/heritage/cinagroup_20251026.png`](sources/heritage/cinagroup_20251026.png)。英文源为官方 Geist v1.7.2 的 [Regular 字体](sources/fonts/geist/README.md)。来源及校验值见 [`assets/heritage/manifest.json`](assets/heritage/manifest.json)。
- 左侧图案的形状、内部留白、比例、位置与蓝色渐变保持原样。中文字形直接从原稿提取；英文从 Geist 提取轮廓并进行圆角处理。

## 英文字体与圆角

- 英文使用 Geist Regular（400），保持字体原始字宽和字距，不横向拉伸。完成整词排版后等比缩放至中文行的可见宽度。
- 以大写 I 的主竖笔画宽度作为基准：1000 units/em 下笔画宽度 86 单位，标准圆角半径为 **43 单位，即笔画宽度的 50%**。
- 尖角由与两侧轮廓相切的圆弧替换；原有平滑曲线在圆角之外保持原形。短边上的相邻圆角可能互相重叠，此时仅局部缩小半径，保证字形闭合、清晰。
- 圆角英文是固定的 Logo 图形，不是安装到系统中的修改版 Geist 字体。正式资产以导出的轮廓为准，不用普通网页文本替代。
- 独立英文 SVG 是纯矢量路径，PNG 宽度为 4096px。原版字体和 [OFL 许可证](sources/fonts/geist/OFL.txt) 一并保留以便复现。

## 组合选择

| 场景 | 文件 |
| --- | --- |
| 官网、名片、信纸、企业介绍 | `assets/heritage/cinagroup-horizontal.png` |
| 竖向版面、包装、展板 | `assets/heritage/cinagroup-stacked.png` |
| 英文材料 | `assets/heritage/cinagroup-english.png` |
| 独立文字标识 | `assets/heritage/cinagroup-wordmark.png` |
| 深色背景 | 对应的 `-white.png`；仅文字反白，左侧全彩图标保持原样 |
| 社交头像、应用入口 | `assets/icons/rounded/cinagroup-{size}.png` |

四种组合均提供透明 PNG、自包含 SVG，以及四分之一宽度的 PNG。SVG 内嵌左侧图形和中文 PNG，英文为矢量路径，不依赖本机字体或外部图片；**整张组合不是纯矢量轮廓**。超大尺寸印刷仍应取得图形和中文的原始矢量稿，不将混合素材误称为无限分辨率文件。

## 等比例圆角

- 圆角作用于蓝色方形底板的四个外角，半径为**底板边长的 4.6875%（3/64）**，不作用于内部黑色图案。
- 256px 图标对应 12px 圆角，512px 对应 24px，1024px 对应 48px；小尺寸也采用相同比例，允许亚像素半径。
- 组合 Logo 以其中蓝色底板的边长计算圆角，不以整张横版或竖版画布的宽度计算。所有原生及小尺寸导出都按此规则生成。
- PNG、SVG 整体缩放时，圆角随图形同比例变化。网页使用独立方形原图时，可对正方形容器设置 `border-radius: 4.6875%`、`overflow: hidden`。不要对整张组合 Logo 设置这个百分比，也不要对已带圆角的图标重复裁切。
- 标准 256px 圆角路径为 `assets/logo/cinagroup-logo-rounded.png`；`assets/icons/rounded/` 提供各尺寸版本。
- Apple Touch Icon、PWA 及应用商店图标保留完整方形，由系统负责遮罩。
- `cinagroup-logo-rounded-3px.png` 与 `logoRounded3px` 是历史兼容文件及字段，继续代表固定 3px；新应用使用 `logoRounded` 和 `cornerRadiusRatio`。

## 尺寸、留白与颜色

- 组合文件已包含基本安全留白。外部文字、边框和其他标志不要侵入该留白。
- 必须等比缩放，不拉伸字形，不拆开或重新排列字符，不在图案上叠加徽章。
- 中英双行组合必须等宽、左右两端对齐。按原比例缩放完整圆角 Geist 英文词标，保留字形和字距；不得仅横向拉宽英文。
- 小尺寸优先使用独立图标。16px favicon 主要呈现整体轮廓，不能期待保留大图的所有内部细节。
- 小尺寸与低清晰度印刷不使用完整中英组合；以实际输出中中文字形清晰可辨为准。
- 原图渐变为图标的颜色依据；`brand.json` 的色值供界面搭配参考。深色应用示例背景为 `#123B56`。
- 不添加原稿没有的闪光、描边、阴影、立体效果或装饰。

## 版本与兼容

v2.0.0 改用本次核准的原稿，并新增传承字标组合。原有全彩图标路径同步更新到本次原稿；v1.x 标签保留历史图标。

v2.0.1 将横版、竖版和纯字标的中英文双行统一为等宽、左右对齐，同时更新反白版及小尺寸导出。

v2.0.2 将通用圆角改为底板边长的 4.6875%，同步组合 Logo、独立图标、ICO 与品牌清单。CinaSeek 品牌契约 1.2.0 同步圆角 Token 和标准圆角资产路径。

v2.1.0 将英文 CINAGROUP 改为 Geist Regular，并按主笔画宽度的一半对尖角做圆角处理，更新全部组合、反白版及小尺寸导出，新增英文纯矢量 SVG。中文、左侧图形及底板圆角继续沿用 v2.0.2。

`cinagroup-mark-black.png`、`cinagroup-mark-white.png` 是保留的历史单色兼容资产，不是本次从新原稿重新核准的单色组合。本套正式组合以全彩图案、原稿中文及圆角 Geist 英文为准。CinaSeek 的产品名称、定位与界面颜色 Token 保持其原产品契约。

## 生成与校验

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

生成器校验原稿与 Geist 字体的 SHA-256，再进行中文裁取、白底转透明、英文轮廓与圆角处理、等比缩放及排版。测试检查原图像素一致性、Geist 轮廓、圆弧半径与相切关系、中英文等宽、底板圆角、SVG 素材、ICO 内容和全部资产校验值。预览板的说明文字使用系统中文字体；正式 Logo 的显示不依赖系统字体。

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
- N 字为局部例外：上下内侧的两处锐角保留 Geist 原始直线交点，不倒圆角；N 的其他转角仍采用上述圆角规则。
- 圆角英文是固定的 Logo 图形，不是安装到系统中的修改版 Geist 字体。正式资产以导出的轮廓为准，不用普通网页文本替代。
- 独立英文 SVG 是纯矢量路径，PNG 宽度为 4096px。原版字体和 [OFL 许可证](sources/fonts/geist/OFL.txt) 一并保留以便复现。

## 组合选择

| 场景 | 文件 |
| --- | --- |
| 官网、名片、信纸、企业介绍 | `assets/heritage/cinagroup-horizontal.png` |
| 竖向版面、包装、展板 | `assets/heritage/cinagroup-stacked.png` |
| 英文材料 | `assets/heritage/cinagroup-english.png` |
| 独立文字标识 | `assets/heritage/cinagroup-wordmark.png` |
| 仅中文的横向品牌标识 | `assets/heritage/cinagroup-chinese.png` |
| 仅中文的竖向品牌标识 | `assets/heritage/cinagroup-chinese-stacked.png` |
| 独立中文字标 | `assets/heritage/cinagroup-wordmark-zh.png` |
| 深色背景 | 对应的 `-white.png`；仅文字反白，左侧全彩图标保持原样 |
| 社交头像、应用入口 | `assets/icons/rounded/cinagroup-{size}.png` |

六种组合均提供透明 PNG、自包含 SVG，以及四分之一宽度的 PNG。SVG 内嵌左侧图形和中文 PNG，含英文的组合使用英文矢量路径，不依赖本机字体或外部图片；**整张组合不是纯矢量轮廓**。超大尺寸印刷仍应取得图形和中文的原始矢量稿，不将混合素材误称为无限分辨率文件。

## 图标与中文

- 横版 `cinagroup-chinese` 为 3328 × 1152px，图标置于左侧，原中文字标在右侧垂直居中；小尺寸为 832 × 288px。
- 竖版 `cinagroup-chinese-stacked` 为 1408 × 1472px，图标在上、中文在下并水平居中；小尺寸为 352 × 368px。
- 两种组合只包含全彩图标与“海内集团”，不含 CINAGROUP 英文行。使用原稿字形及原始宽高比，不用系统字体重新排字。蓝色底板沿用 4.6875% 等比例圆角。
- 两种组合的黑字版和 `-white` 反白版均提供 PNG、SVG 及小尺寸 PNG；反白只改变文字颜色，图标像素与透明度保持一致。
- 独立中文字标为 `cinagroup-wordmark-zh.png` / `.svg`，反白版为 `cinagroup-wordmark-zh-white.png` / `.svg`；原生尺寸为 2027 × 493px。另提供 `cinagroup-wordmark-zh-512.png` 和 `cinagroup-wordmark-zh-white-512.png`，尺寸为 512 × 125px。
- 独立中文字标没有图标或英文。中文 SVG 是内嵌透明 PNG 的自包含文件，保留原始笔画，**不是中文字形的矢量重绘稿**。完整选择与深色背景示例见 [`assets/heritage/preview-chinese.png`](assets/heritage/preview-chinese.png)。

## 海内商品字标与注册标记

- 商品字标使用“海内”，从原“海内集团”中文字标裁取前两字，原始裁片为 981 × 493px；不重新排字、不拉伸笔画。套件位于 [`assets/hainei/`](assets/hainei/)，完整预览见 [`preview.png`](assets/hainei/preview.png)。
- 横版 `hainei-horizontal` 为 2432 × 1152px，竖版 `hainei-stacked` 为 1408 × 1792px；独立文字 `hainei-wordmark` 为 1216 × 640px，独立图标 `hainei-symbol` 为 1280 × 1280px。四分之一尺寸分别为 608 × 288、352 × 448、304 × 160、320 × 320px。
- 基础版不带注册标记。`-registered` 组合分别在图标与“海内”文字右上方放置 ®，横版、竖版各有两处；独立图标与独立字标各有一处。使用套件已排定的标记位置，注册标记位于各自图形之外。
- 所有版式提供透明 PNG、自包含 SVG 与小尺寸 PNG。文字和注册标记提供黑色与 `-white` 白色版；全彩图标保持原始颜色。独立图标的 `-registered-white` 版本只将 ® 反白；基础图标没有重复的反白文件。
- ® 取自固定版本 Geist Regular 的原始矢量轮廓；“海内”和图标仍为内嵌原稿位图。SVG 不依赖系统字体，**不是整张纯矢量文件**。来源、字体校验值、每个标记的位置和文件校验值均记录在 [`assets/hainei/manifest.json`](assets/hainei/manifest.json)。
- 商品包装、吊牌与标签保留完整导出画布，保证图标及文字右上方 ® 的安全留白；不要按图标或字形的边缘裁切，也不要让边框、标签孔位或其他文字遮挡注册标记。整体等比缩放，底板圆角随图标缩放。
- 这组新增资产使用本地路径，合并后可使用 `main`。发布新标签前不把海内文件指向既有 `v2.1.1` 标签；原有发布版本与 CDN 示例保持不变。

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

v2.1.1 恢复 N 字上下内侧的两处原始锐角，同步全部组合及英文独立素材；其余字形与圆角规则延续 v2.1.0。

新增图标与中文组合、独立中文反白版及 SVG 尚未发布新标签。先使用本地文件；合并到 `main` 后可使用该分支路径，待后续标签发布再固定版本。现有 `v2.1.1` 发布标签及 CDN 示例不变，不代表该标签已包含新增资产。

`cinagroup-mark-black.png`、`cinagroup-mark-white.png` 是保留的历史单色兼容资产，不是本次从新原稿重新核准的单色组合。本套正式组合以全彩图案、原稿中文及圆角 Geist 英文为准。CinaSeek 的产品名称、定位与界面颜色 Token 保持其原产品契约。

## 生成与校验

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

生成器校验原稿与 Geist 字体的 SHA-256，再进行中文裁取、白底转透明、英文轮廓与圆角处理、等比缩放及排版。测试检查原图像素与中文原稿轮廓一致性、中文组合的布局和 PNG/SVG 一致性、黑白文字的透明度与全彩图标一致性、Geist 轮廓、圆弧半径与相切关系、中英文等宽、底板圆角、SVG 素材、ICO 内容和全部资产校验值。预览板的说明文字使用系统中文字体；正式 Logo 的显示不依赖系统字体。

海内套件另行校验原稿的两字裁片、基础版与注册版的全部导出、® 的字体轮廓和数量、标记与主体不重叠的留白、图标原色、黑白透明度、小尺寸、PNG/SVG 一致性及清单校验值。

# CinaGroup 品牌使用规范

## 名称

- 集团名称统一写作 `CinaGroup`。
- 产品名称采用 `Cina` + 产品名的 PascalCase 形式，例如 `CinaSeek`、`CinaAuth`。
- 不使用 `CINAGROUP`、`cina group` 或在同一界面混用多种大小写。

## Logo 选择

- 主 Logo 是 `assets/logo/cinagroup-logo.png`，不得改变黑色标志的形状、比例或位置。
- 界面明确要求 3px 透明圆角时使用 `cinagroup-logo-rounded-3px.png`。
- 浅色单色界面使用黑色透明标志；深色单色界面使用白色透明标志。
- iOS、Android 和支持系统遮罩的平台使用未预裁圆角的方形应用图标，由系统负责最终裁切。

## 尺寸与留白

- 图标必须等比缩放，禁止拉伸。
- 小于 16px 时不要显示完整 Logo；优先使用 favicon 或单色标志。
- 不要裁掉右下角的闪光元素，也不要在 Logo 上叠加文字、徽章或状态圆点。
- 宿主组件已经设置圆角时，不要再次对位图做额外裁切。

## 颜色

权威颜色值记录在 `brand.json`：

- Cyan top-left：`#5DBFE3`
- Cyan bottom-left：`#02A4DC`
- Cyan bottom-right：`#44BBE3`
- Ink：`#000000`
- Cloud：`#FBFBFA`

这些颜色用于保持与 Logo 渐变一致，不要求产品界面将所有颜色替换为品牌色。正文、对比度和无障碍要求优先。

## 禁止事项

- 不得重绘、旋转、描边或使用生成式模型改变标志轮廓。
- 不得以截图、经过有损压缩的 JPEG 或第三方仓库副本作为新源文件。
- 不得把 fork 项目的原品牌资源自动替换为 CinaGroup 品牌，除非该 fork 已明确完成自主品牌化。


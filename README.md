# CinaGroup Brand

CinaGroup 官方通用品牌资产仓库。所有 CinaGroup 项目应从这里获取 Logo、favicon、应用图标和基础品牌信息，避免在各仓库中维护不一致的副本。

除集团通用资产外，`products/` 还保存各产品的定位、颜色 Token、术语映射和发行元数据。产品仓库应固定到明确的品牌版本，在构建时复制所需资源，并在 CI 中校验；生产运行时不依赖本仓库或外部 CDN。

## 权威资产

| 用途 | 文件 | 说明 |
| --- | --- | --- |
| 主 Logo | [`assets/logo/cinagroup-logo.png`](assets/logo/cinagroup-logo.png) | 256×256，原始全彩版本 |
| 3px 圆角 Logo | [`assets/logo/cinagroup-logo-rounded-3px.png`](assets/logo/cinagroup-logo-rounded-3px.png) | 256×256，透明圆角 |
| 黑色标志 | [`assets/logo/cinagroup-mark-black.png`](assets/logo/cinagroup-mark-black.png) | 透明背景，用于浅色界面 |
| 白色标志 | [`assets/logo/cinagroup-mark-white.png`](assets/logo/cinagroup-mark-white.png) | 透明背景，用于深色界面 |
| Web favicon | [`assets/icons/web/favicon.ico`](assets/icons/web/favicon.ico) | 16–256px 多分辨率 ICO |
| PWA 图标 | [`assets/icons/web/pwa-192.png`](assets/icons/web/pwa-192.png)、[`pwa-512.png`](assets/icons/web/pwa-512.png) | Web App Manifest |
| Apple Touch Icon | [`assets/icons/web/apple-touch-icon.png`](assets/icons/web/apple-touch-icon.png) | 180×180，不预裁圆角 |
| Windows 图标 | [`assets/icons/windows/cinagroup.ico`](assets/icons/windows/cinagroup.ico) | 16、20、24、32、40、48、64、128、256px |
| 应用商店图标 | [`assets/icons/app/cinagroup-app-icon-1024.png`](assets/icons/app/cinagroup-app-icon-1024.png) | 1024×1024，不预裁系统圆角 |

![CinaGroup Logo](assets/logo/cinagroup-logo.png)

## 直接引用

生产项目建议固定到发布标签；以下示例使用仓库更名后的稳定资产版本 `v1.0.1`：

```html
<link rel="icon" href="https://cdn.jsdelivr.net/gh/cinagroup/cinabrand@v1.0.1/assets/icons/web/favicon.ico">
<link rel="apple-touch-icon" href="https://cdn.jsdelivr.net/gh/cinagroup/cinabrand@v1.0.1/assets/icons/web/apple-touch-icon.png">
```

```css
.cinagroup-logo {
  background-image: url("https://cdn.jsdelivr.net/gh/cinagroup/cinabrand@v1.0.1/assets/logo/cinagroup-logo.png");
}
```

需要离线打包、桌面安装器或移动应用图标时，应将对应文件同步进项目并在构建配置中引用，不要在运行时依赖外部 CDN。

## 规范与机器可读信息

- [`BRAND_GUIDELINES.md`](BRAND_GUIDELINES.md)：视觉与命名使用规范。
- [`BRAND_POLICY.md`](BRAND_POLICY.md)：品牌资产使用政策。
- [`brand.json`](brand.json)：颜色、尺寸和资产路径的机器可读清单。
- [`checksums.sha256`](checksums.sha256)：权威资产校验值。
- [`products/cinaseek/brand.json`](products/cinaseek/brand.json)：CinaSeek 产品品牌契约。
- [`products/cinaseek/terminology.json`](products/cinaseek/terminology.json)：CinaSeek 对外术语与内部兼容名称映射。
- [`products/cinaseek/tokens.css`](products/cinaseek/tokens.css)：CinaSeek Web 品牌 Token。

提交资产变更前运行：

```bash
node scripts/validate.mjs
```

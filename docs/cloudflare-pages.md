# Cloudflare Pages 上线说明

这个项目已经准备好直接部署到 Cloudflare Pages。

## 建议配置

- GitHub 仓库：`yingziwj/fivey-can-read-openclaw`
- Production branch：`main`
- Build command：`npm run build`
- Build output directory：`dist`
- Node 版本：`22`

## 为什么这样配

- `npm run build` 会在本地没有同步数据时自动兜底抓取 OpenClaw 官方文档。
- `dist/` 是完整静态输出，适合 Cloudflare Pages 全球分发。
- 站点已经内置 `sitemap.xml`、`robots.txt`、`ads.txt` 和基础 SEO 元信息。

## 推荐上线步骤

1. 登录 Cloudflare Dashboard。
2. 打开 `Workers & Pages`。
3. 选择 `Create application`。
4. 选择 `Pages`，然后连接 GitHub。
5. 选择仓库 `yingziwj/fivey-can-read-openclaw`。
6. 填入上面的构建参数。
7. 首次部署完成后，确认默认域名是 `fivey-can-read-openclaw.pages.dev`。

## 自动更新链路

仓库里已经包含 GitHub Actions：

- 文件：[.github/workflows/sync-build.yml](/Volumes/Extreme%20SSD/openclaw/webBot/fivey-can-read-openclaw/.github/workflows/sync-build.yml)
- 作用：每 3 天自动同步一次 `docs.openclaw.ai`，重新构建并推送变更

这样原站的新增、删除和修改会被周期性同步到这个站点。

## 上线后建议马上检查

1. 首页能否正常打开。
2. 任意一个栏目页是否能顺滑滚动。
3. `/theme-icons/` 是否能打开并显示三个图标样例。
4. `/sitemap.xml`、`/robots.txt`、`/ads.txt` 是否可访问。
5. 页面源码里是否带有 `title`、`description`、`canonical`、`og:*`。

## 之后我建议继续做的两件事

1. 选定默认图标并统一 favicon/OG 图。
2. 接入 Cloudflare Pages 后，补一次真实线上验收，看看移动端视觉和滚动表现是否还需要微调。

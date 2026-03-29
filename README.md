# fivey-can-read-openclaw

这个仓库负责承载 “让五岁小朋友也能听懂” 的 OpenClaw 文档站，最终部署在 Cloudflare Pages 并对外提供 `https://fivey-can-read-openclaw.pages.dev`。

站点采用“零框架静态生成”方案：
- `npm run sync` 会抓取 `https://docs.openclaw.ai/llms-full.txt`，解析出导航顺序、章节和原文内容。
- `npm run build` 会把这些数据渲染为故事化静态页面，输出到 `dist/`。
- 如果构建时本地还没有同步数据，`npm run build` 也会自动兜底抓取一次，方便 Cloudflare Pages 直接构建。

## 本地流程

1. 安装依赖：`npm install`。当前项目没有第三方依赖，这一步主要用于保持 CI/Cloudflare 流程一致。
2. 同步内容：`npm run sync`。
3. 构建输出：`npm run build`。
4. 本地预览：`npm run dev`，默认打开 `http://localhost:4173`。
5. 快速校验生成物：`npm run check`。

## 同步与构建说明

`npm run sync`：从 `https://docs.openclaw.ai/llms-full.txt` 抓取整站转储，解析导航顺序与各章节，连同命令/代码段一起转成可供 build 使用的结构化 JSON。

`npm run build`：读取同步数据，按照海报级视觉（大圆角卡片、渐变、糖果色背景、轻动效）输出静态站点到 `dist/`，包括：
- 核心入口页
- 所有导航页的逐节故事化解读
- SEO 所需的 meta/meta-graph 标签
- `ads.txt`/占位脚本以便未来插入 Google AdSense
- `sitemap.xml`、`robots.txt`、`site.webmanifest`

站点代码会额外保留 3 个图标样例在 `assets/icons/`，默认构建使用 `concept-balloon-book.svg` 作为 favicon。

## Cloudflare Pages 部署

1. 使用 `yingziwj/fivey-can-read-openclaw` 仓库创建 Cloudflare Pages 项目，选择 `main`（或主分支）作为源。
2. 构建命令填 `npm run build`。
3. 输出目录设为 `dist`。
4. 环境变量中至少保留 `CI=1`，必要时再补充（例如：`NODE_ENV=production`）。
5. 关联自定义域 `fivey-can-read-openclaw.pages.dev`，启用 HTTPS（系统会自动完成）。
6. 每次 workflow 推送后，Cloudflare 会自动重新部署，全球用户会通过 Pages CDN 访问。

## GitHub Actions 自动同步（三天一次 + 手动）

详见 `.github/workflows/sync-build.yml`，核心流程：
1. 每 3 天凌晨拉一次 `main`，运行 `npm run sync` + `npm run build`，生成 `dist/`。
2. 若生成内容有变动，自动提交并推送回仓库，触发 Cloudflare Pages 重构。
3. 支持 `workflow_dispatch`，可手动即时触发同步并调试生成器。
4. 工作流依赖 `GITHUB_TOKEN` 直接推送，必要时自行补充 `PERSONAL_ACCESS_TOKEN` 以确保有写权限。

## SEO 与 Google AdSense 预留

- 所有页面都会输出 `title`、`meta description`、`canonical`、`og:*`、`twitter:*` 和 JSON-LD。
- 站点根目录已经准备 `ads.txt` 和广告占位注释，后续接入 Google AdSense 时直接替换占位即可。
- 已生成 `sitemap.xml`、`robots.txt`、`site.webmanifest`，便于搜索引擎收录和后续站点资产配置。

## 目录结构预期

- `dist/`：Cloudflare Pages 静态站点输出，每个原文菜单对应一个页面，导航顺序与 `docs.openclaw.ai` 保持一致。
- `scripts/`：同步、构建、本地预览脚本。
- `assets/icons/`：3 个候选图标样例。
- `docs/operations.md`：运维说明。
- `docs/cloudflare-pages.md`：Cloudflare Pages 实际上线步骤。

如果你后面想把默认 favicon 切换成另外两个方案中的一个，只需要在 `scripts/build-site.mjs` 里把 `defaultIconSource` 改成对应的 SVG 文件名。

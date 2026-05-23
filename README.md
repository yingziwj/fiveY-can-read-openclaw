# fivey-can-read-openclaw

这个仓库负责承载 “让五岁小朋友也能听懂” 的 OpenClaw 文档站，最终部署在 Cloudflare Pages 并对外提供 `https://fivey-can-read-openclaw.pages.dev`。

站点采用“零框架静态生成”方案：
- `npm run sync` 会抓取 `https://docs.openclaw.ai/llms-full.txt`，解析出导航顺序、章节和原文内容。
- `npm run build` 会先同步线上文档，再渲染为故事化静态页面，输出到 `dist/`，适合 Cloudflare Pages 的干净 checkout 环境。
- `npm run build:offline` 只读取本地已有的 `generated/site-data.json`，适合本地调试构建器时避免重复联网。
- 默认品牌主题已经定为 `concept-balloon-book.svg`，并会同步生成 `og-image.svg` 作为社交分享图。

## 本地流程

1. 安装依赖：`npm ci`。当前项目没有第三方依赖，这一步主要用于保持 CI/Cloudflare 流程一致。
2. 同步并构建输出：`npm run build`。
4. 本地预览：`npm run dev`，默认打开 `http://localhost:4173`。
5. 快速校验生成物：`npm run check`。

如果你已经运行过 `npm run sync`，并且只想复用本地同步数据重新生成 `dist/`，运行 `npm run build:offline`。

## Handcrafted 覆盖报告

运行 `npm run report:handcrafted-gaps` 可以只读检查 `generated/site-data.json`，列出仍在使用自动生成内容、还没有接入 `content/handcrafted/` 的页面。报告会复用 `scripts/handcrafted-pages.mjs` 里的 manifest 判定 handcrafted 状态，并按插件、Codex、多代理、迁移、测试等关键词给出一批优先补写候选页。

默认候选数是 20 个；需要更多时可运行 `npm run report:handcrafted-gaps -- --limit 40`。这个命令不会写入 `dist/`，适合在批量补 handcrafted 页面前排优先级。

## 同步与构建说明

`npm run sync`：从 `https://docs.openclaw.ai/llms-full.txt` 抓取整站转储，解析导航顺序与各章节，连同命令/代码段一起转成可供 build 使用的结构化 JSON。

`npm run build`：先同步最新文档，再按照海报级视觉（大圆角卡片、渐变、糖果色背景、轻动效）输出静态站点到 `dist/`，包括：
- 核心入口页
- 所有导航页的逐节故事化解读
- SEO 所需的 meta/meta-graph 标签
- Google AdSense 连接验证 meta、加载脚本和 `ads.txt`
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
1. 每 3 天凌晨拉一次 `main`，运行 `npm run build`，同步文档并生成 `dist/`。
2. 若生成内容有变动，自动提交并推送回仓库，触发 Cloudflare Pages 重构。
3. 支持 `workflow_dispatch`，可手动即时触发同步并调试生成器。
4. 工作流依赖 `GITHUB_TOKEN` 直接推送，必要时自行补充 `PERSONAL_ACCESS_TOKEN` 以确保有写权限。

## SEO 与 Google AdSense 预留

- 所有页面都会输出 `title`、`meta description`、`canonical`、`og:*`、`twitter:*` 和 JSON-LD。
- 所有页面的 `<head>` 都会输出 `meta name="google-adsense-account"` 和 AdSense 加载脚本；站点根目录会输出包含 `pub-3833673520933536` 的 `ads.txt`。
- 已生成 `sitemap.xml`、`robots.txt`、`site.webmanifest`，便于搜索引擎收录和后续站点资产配置。

## 目录结构预期

- `dist/`：Cloudflare Pages 静态站点输出，每个原文菜单对应一个页面，导航顺序与 `docs.openclaw.ai` 保持一致。
- `scripts/`：同步、构建、本地预览脚本。
- `assets/icons/`：3 个候选图标样例。
- `docs/operations.md`：运维说明。
- `docs/cloudflare-pages.md`：Cloudflare Pages 实际上线步骤。

如果你后面想把默认 favicon 切换成另外两个方案中的一个，只需要在 `scripts/build-site.mjs` 里把 `defaultIconSource` 改成对应的 SVG 文件名。

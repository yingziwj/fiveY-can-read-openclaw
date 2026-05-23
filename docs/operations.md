# 运行与维护说明

这个文档补充 README 的运营部分，指出执行同步/构建流程的细节，以及遇到差异时如何排查。

## 通常流程

1. 本地或 CI 运行 `npm run sync`：抓取最新 `docs.openclaw.ai` 内容。确认输出 JSON 中的导航顺序与原站一致。
2. 然后跑 `npm run build:offline`：它会将同步数据转为故事化 `dist/` 站点，并自动插入 metadata、AdSense 连接验证 meta、`ads.txt`、OG 片段。
3. 检查 `dist/` 中对应页面，确保顺序、标题、命令/代码段的“讲故事”输出未丢失。
4. 如果需要同步和构建一步完成，运行 `npm run build`。Cloudflare Pages 也使用这个命令，保证干净 checkout 下不会缺少 `generated/site-data.json`。

## Handcrafted 补页排队

运行 `npm run report:handcrafted-gaps` 可以查看 `generated/site-data.json` 中还没有接入 handcrafted 内容的页面。报告会按分区列出全量缺口，并优先挑出插件、Codex、多代理、迁移、测试相关的候选页；如果要扩大候选范围，使用 `npm run report:handcrafted-gaps -- --limit 40`。

这个命令只读取同步产物和 `scripts/handcrafted-pages.mjs`，不会改写 `dist/`，适合在批量新增 `content/handcrafted/*.zh.html` 前决定先写哪一组。

## 异常排查

- 如果其中文档顺序变动但 `dist/` 未更新，先确认 `npm run sync` 是否抓到最新导航。可检查 `generated/site-data.json`。
- 出现断头/404 的章节，确保 `sync` 把 `slug` 传到 `build`，且 `build` 根据 slug 生成页面。
- 滚动掉帧/卡顿，可在 `dist/` 中确认是否引入大型图片/过多动画，同时保持 `scroll-behavior: smooth`。

## Cloudflare & 自动部署

- 每次生成结果有变动后，workflow 会自动提交。Cloudflare Pages 检查最新提交并重新构建，如果部署失败，可在 Pages 控制台查看日志。
- 若 Cloudflare 显示 `Page could not be built`，先在本地运行 `npm run build`，确认同步和构建都能完成；如果只想复用已有同步数据调试构建器，运行 `npm run build:offline`。

## SEO / 广告准备

- 保持 `dist/` 根目录包含 sitemap/robots，以便搜索引擎收录；如果 sync 脚本输出 `sitemap.xml`，应直接部署在 `dist/`。
- `ads.txt` 必须存在，且应包含当前 AdSense 发布商 ID：`google.com, pub-3833673520933536, DIRECT, f08c47fec0942fa0`。所有页面也应保留 `meta name="google-adsense-account"` 与 AdSense 加载脚本，方便 AdSense 重新抓取时完成连接验证。
- 每个页面都应提供 `title`、`meta description`、`og:*`、`twitter:card` 等标签，SEO 信息可从 sync 产物的章节摘要中提取，并在 build 中生成。

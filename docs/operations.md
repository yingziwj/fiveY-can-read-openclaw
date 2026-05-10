# 运行与维护说明

这个文档补充 README 的运营部分，指出执行同步/构建流程的细节，以及遇到差异时如何排查。

## 通常流程

1. 本地或 CI 运行 `npm run sync`：抓取最新 `docs.openclaw.ai` 内容。确认输出 JSON 中的导航顺序与原站一致。
2. 然后跑 `npm run build`：它会将同步数据转为故事化 `dist/` 站点，并自动插入 metadata、`ads.txt`、OG 片段。
3. 检查 `dist/` 中对应页面，确保顺序、标题、命令/代码段的“讲故事”输出未丢失。
4. 如果需要同步和构建一步完成，运行 `npm run build:fresh`。

## 异常排查

- 如果其中文档顺序变动但 `dist/` 未更新，先确认 `npm run sync` 是否抓到最新导航。可检查 `generated/site-data.json`。
- 出现断头/404 的章节，确保 `sync` 把 `slug` 传到 `build`，且 `build` 根据 slug 生成页面。
- 滚动掉帧/卡顿，可在 `dist/` 中确认是否引入大型图片/过多动画，同时保持 `scroll-behavior: smooth`。

## Cloudflare & 自动部署

- 每次生成结果有变动后，workflow 会自动提交。Cloudflare Pages 检查最新提交并重新构建，如果部署失败，可在 Pages 控制台查看日志。
- 若 Cloudflare 显示 `Page could not be built`，先在本地运行 `npm run build`，确认本地同步数据能生成结果；如果缺少 `generated/site-data.json`，先运行 `npm run sync` 或改用 `npm run build:fresh`。

## SEO / 广告准备

- 保持 `dist/` 根目录包含 sitemap/robots，以便搜索引擎收录；如果 sync 脚本输出 `sitemap.xml`，应直接部署在 `dist/`。
- `ads.txt` 必须存在，即便内容为空也用来占位，方便之后接入 Google AdSense；建议在 `dist/` 的 HTML 模板内保留 `<!-- ADSENSE_SNIPPET -->` 注释，后续再由主代理或运维脚本注入正式片段。
- 每个页面都应提供 `title`、`meta description`、`og:*`、`twitter:card` 等标签，SEO 信息可从 sync 产物的章节摘要中提取，并在 build 中生成。

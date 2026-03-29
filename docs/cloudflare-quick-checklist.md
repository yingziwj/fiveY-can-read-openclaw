# Cloudflare Pages 最短上线清单

你只需要在 Cloudflare 后台做这几项：

1. 打开 `Workers & Pages`
2. 选择 `Create application`
3. 选择 `Pages`
4. 连接 GitHub 仓库 `yingziwj/fivey-can-read-openclaw`
5. 生产分支选 `main`
6. Build command 填 `npm run build`
7. Build output directory 填 `dist`
8. 部署完成后确认域名是 `https://fivey-can-read-openclaw.pages.dev`

做完以后，本地运行：

```bash
npm run verify-live
```

如果你想验证别的域名，也可以这样：

```bash
SITE_URL=https://你的域名 npm run verify-live
```

## 通过标准

- 首页返回正常
- `/theme-icons/` 可访问
- `/tools/` 可访问
- `sitemap.xml`、`robots.txt`、`ads.txt` 可访问
- `og-image.svg` 可访问

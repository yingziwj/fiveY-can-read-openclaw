import fs from "node:fs/promises";
import path from "node:path";
import {
  DATA_PATH,
  DOCS_SOURCE_URL,
  DIST_DIR,
  RAW_DOC_PATH,
  SITE_NAME,
  SITE_URL,
  buildSiteData,
  ensureDir,
  escapeHtml,
  excerpt,
  formatDate,
  readJson,
  softenTerms,
  storyForCode,
  storyForList,
  storyForParagraph,
  storyLead,
  writeJson
} from "./site-lib.mjs";

async function loadSiteData() {
  try {
    return await readJson(DATA_PATH);
  } catch {
    const response = await fetch(DOCS_SOURCE_URL, {
      headers: {
        "user-agent": "fivey-can-read-openclaw-build/0.1"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${DOCS_SOURCE_URL}: ${response.status} ${response.statusText}`);
    }

    const raw = await response.text();
    const liveSiteData = buildSiteData(raw);
    await ensureDir(path.dirname(RAW_DOC_PATH));
    await fs.writeFile(RAW_DOC_PATH, raw, "utf8");
    await writeJson(DATA_PATH, liveSiteData);
    return liveSiteData;
  }
}

const siteData = await loadSiteData();
await fs.rm(DIST_DIR, { recursive: true, force: true });
await ensureDir(DIST_DIR);
await ensureDir(path.join(DIST_DIR, "assets"));

const defaultIconSource = path.resolve("assets/icons/concept-balloon-book.svg");
const iconOutput = path.join(DIST_DIR, "favicon.svg");
await fs.copyFile(defaultIconSource, iconOutput);

const iconConcepts = [
  {
    file: "concept-balloon-book.svg",
    name: "Balloon Book",
    chineseName: "气球故事书",
    summary: "最贴近当前海报气质，温柔、可爱、像在读绘本。",
    fit: "适合把站点重点放在“儿童友好解读”和“陪伴式学习”。"
  },
  {
    file: "concept-rocket-toolbox.svg",
    name: "Rocket Toolbox",
    chineseName: "火箭工具箱",
    summary: "更偏产品感和工程感，像带着工具去冒险。",
    fit: "适合强调 OpenClaw 很能干、很会做事、适合全球技术用户。"
  },
  {
    file: "concept-rainbow-claw.svg",
    name: "Rainbow Claw",
    chineseName: "彩虹小爪子",
    summary: "识别度最高，也最像独立品牌标识。",
    fit: "适合后面做品牌延展，比如社媒头像、贴纸、周边。"
  }
];

async function copyDir(source, target) {
  await ensureDir(target);
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

await copyDir(path.resolve("assets/icons"), path.join(DIST_DIR, "assets/icons"));

function asset(fileName) {
  return `/assets/${fileName}`;
}

function pageUrl(pathname) {
  if (!pathname || pathname === "/") {
    return SITE_URL;
  }

  return `${SITE_URL}${publicPathname(pathname)}`;
}

function pageOutputPath(pathname) {
  if (!pathname || pathname === "/") {
    return path.join(DIST_DIR, "index.html");
  }

  return path.join(DIST_DIR, pathname.replace(/^\/+/, ""), "index.html");
}

function publicPathname(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  if (pathname !== "/index" && pathname.endsWith("/index")) {
    return `${pathname.slice(0, -"/index".length) || "/"}/`.replace(/\/+/g, "/");
  }

  return `${pathname}/`;
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function renderInline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderOriginalBlock(block) {
  if (block.type === "paragraph") {
    return `<p>${renderInline(block.text)}</p>`;
  }

  if (block.type === "list") {
    return `<ul>${block.items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`;
  }

  if (block.type === "code") {
    return `<pre><code class="language-${escapeHtml(block.language)}">${escapeHtml(block.code)}</code></pre>`;
  }

  return "";
}

function renderStoryBlock(block, sectionTitle) {
  if (block.type === "paragraph") {
    return `
      <div class="story-card">
        <div class="story-card-label">像讲绘本</div>
        <p>${escapeHtml(storyForParagraph(block.text))}</p>
      </div>
      <div class="source-card">
        <div class="story-card-label">原文小纸条</div>
        ${renderOriginalBlock(block)}
      </div>
    `;
  }

  if (block.type === "list") {
    return `
      <div class="story-card">
        <div class="story-card-label">像准备清单</div>
        <p>${escapeHtml(storyForList(block.items, sectionTitle))}</p>
      </div>
      <div class="source-card">
        <div class="story-card-label">原文小纸条</div>
        ${renderOriginalBlock(block)}
      </div>
    `;
  }

  if (block.type === "code") {
    const explanation = storyForCode(block.code, block.language);
    return `
      <div class="story-card">
        <div class="story-card-label">像魔法口令拆解</div>
        <p>${escapeHtml(explanation.framing)}</p>
        <ul class="code-steps">
          ${explanation.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ul>
      </div>
      <div class="source-card">
        <div class="story-card-label">原文代码块</div>
        ${renderOriginalBlock(block)}
      </div>
    `;
  }

  return "";
}

function renderSidebar(navigation, currentPathname) {
  return `
    <nav class="sidebar-nav">
      ${navigation
        .map((section) => {
          const links = section.pages
            .map((page) => {
              const active = page.pathname === currentPathname ? "is-active" : "";
              return `
                <a class="sidebar-link ${active}" href="${publicPathname(page.pathname)}">
                  <span>${escapeHtml(page.title)}</span>
                  <small>${escapeHtml(excerpt(page.description || page.title, 52))}</small>
                </a>
              `;
            })
            .join("");

          return `
            <section class="sidebar-group">
              <h3>${escapeHtml(section.label)}</h3>
              <div class="sidebar-links">${links}</div>
            </section>
          `;
        })
        .join("")}
    </nav>
  `;
}

function renderPageLayout({ title, description, pathname, heroEyebrow, heroTitle, heroText, content, navigation, breadcrumbs = [] }) {
  const canonical = pageUrl(pathname);
  const pageTitle = `${title} | ${SITE_NAME}`;
  const breadcrumbJson = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: pageUrl(crumb.pathname)
    }))
  };

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(`${SITE_URL}/favicon.svg`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#f5576c">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="${asset("site.css")}" as="style">
  <link rel="stylesheet" href="${asset("site.css")}">
  <script type="application/ld+json">${jsonLd({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL
    }
  })}</script>
  <script type="application/ld+json">${jsonLd(breadcrumbJson)}</script>
</head>
<body>
  <div class="page-shell">
    <aside class="sidebar">
      <a class="brand" href="/">
        <span class="brand-mark">🎈</span>
        <span>
          <strong>Fivey Can Read</strong>
          <small>OpenClaw 绘本版文档站</small>
        </span>
      </a>
      ${renderSidebar(navigation, pathname)}
    </aside>

    <main class="main">
      <header class="hero">
        <div class="hero-topbar">
          <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav">菜单</button>
          <div class="hero-actions">
            <a class="source-link" href="/theme-icons/">图标样例</a>
            <a class="source-link" href="https://docs.openclaw.ai" target="_blank" rel="noreferrer">原始文档</a>
          </div>
        </div>
        <p class="hero-eyebrow">${escapeHtml(heroEyebrow)}</p>
        <h1>${escapeHtml(heroTitle)}</h1>
        <p class="hero-copy">${escapeHtml(heroText)}</p>
        <div class="hero-pills">
          <span>逐节讲解</span>
          <span>代码也讲故事</span>
          <span>SEO 友好</span>
          <span>Cloudflare Pages</span>
        </div>
      </header>

      <div id="mobile-nav" class="mobile-nav">
        ${renderSidebar(navigation, pathname)}
      </div>

      ${content}

      <footer class="page-footer">
        <div>
          <strong>${escapeHtml(SITE_NAME)}</strong>
          <p>同步时间：${escapeHtml(formatDate(siteData.generatedAt))}</p>
        </div>
        <div class="footer-links">
          <a href="/sitemap.xml">Sitemap</a>
          <a href="/robots.txt">Robots</a>
          <a href="/ads.txt">Ads.txt</a>
        </div>
      </footer>
    </main>
  </div>
  <script src="${asset("site.js")}" defer></script>
</body>
</html>`;
}

function renderHomePage() {
  const heroText = `我们把 OpenClaw 官方文档变成了适合 5 岁小朋友和第一次接触的人阅读的故事版。每一页都会按原文菜单顺序讲，命令和代码也会拆成一步一步的小故事。`;
const sectionCards = siteData.navigation
    .map(
      (section, index) => `
        <a class="home-card" href="${section.pages[0] ? publicPathname(section.pages[0].pathname) : "/"}">
          <span class="home-card-index">${String(index + 1).padStart(2, "0")}</span>
          <h2>${escapeHtml(section.label)}</h2>
          <p>${escapeHtml(`这一组一共有 ${section.pages.length} 页，我们会按原站顺序慢慢讲。`)}</p>
        </a>
      `
    )
    .join("");

  const content = `
    <section class="section-shell spotlight">
      <div class="spotlight-card">
        <div>
          <p class="section-kicker">为什么做这个站</p>
          <h2>把技术文档讲成可以慢慢读懂的小绘本</h2>
          <p>原站很专业，我们这边保持导航顺序不变，但把每个小节改写成“故事讲解 + 原文对照 + 代码拆解”的形式，方便大人带着孩子一起看，也方便新人快速上手。</p>
        </div>
        <div class="stat-grid">
          <div class="stat-card"><strong>${siteData.pageCount}</strong><span>已同步页面</span></div>
          <div class="stat-card"><strong>${siteData.sectionCount}</strong><span>一级栏目</span></div>
          <div class="stat-card"><strong>3 天</strong><span>自动重生成</span></div>
          <div class="stat-card"><strong>100%</strong><span>静态页面输出</span></div>
        </div>
      </div>
    </section>

    <section class="section-shell">
      <div class="section-heading">
        <p class="section-kicker">按原站顺序阅读</p>
        <h2>从这些大门进去</h2>
      </div>
      <div class="home-grid">${sectionCards}</div>
    </section>

    <section class="section-shell">
      <div class="section-heading">
        <p class="section-kicker">站点主题</p>
        <h2>先挑一个最像我们的门牌图标</h2>
      </div>
      <div class="home-grid">
        ${iconConcepts
          .map(
            (icon) => `
              <a class="home-card" href="/theme-icons/">
                <span class="home-card-index">🎨</span>
                <h2>${escapeHtml(icon.chineseName)}</h2>
                <p>${escapeHtml(icon.summary)}</p>
              </a>
            `
          )
          .join("")}
      </div>
    </section>

    <section class="section-shell">
      <div class="section-heading">
        <p class="section-kicker">上线步骤</p>
        <h2>把它放上 Cloudflare Pages 的最短路径</h2>
      </div>
      <div class="story-grid">
        <div class="story-card">
          <div class="story-card-label">第一步</div>
          <p>在 Cloudflare Pages 里连接 GitHub 仓库 <code>yingziwj/fivey-can-read-openclaw</code>，构建命令填 <code>npm run build</code>，输出目录填 <code>dist</code>。</p>
        </div>
        <div class="story-card">
          <div class="story-card-label">第二步</div>
          <p>把默认域名确认成 <code>fivey-can-read-openclaw.pages.dev</code>，这样全球用户会直接走 Cloudflare 的边缘网络访问。</p>
        </div>
        <div class="story-card">
          <div class="story-card-label">第三步</div>
          <p>启用仓库里的 GitHub Actions，之后每 3 天会自动同步官方文档并重建页面，原站增删改会覆盖到这里。</p>
        </div>
        <div class="story-card">
          <div class="story-card-label">第四步</div>
          <p>等你选好图标后，我再把默认 favicon 固定下来，并顺手把 Google AdSense 占位改成正式接入口。</p>
        </div>
      </div>
    </section>

    <section class="section-shell">
      <div class="section-heading">
        <p class="section-kicker">未来广告位预留</p>
        <h2>这个位置以后可以接入 Google AdSense</h2>
      </div>
      <div class="ad-placeholder">
        <p>当前先保留干净占位，不插入广告脚本。</p>
        <code>&lt;!-- ADSENSE_SNIPPET --&gt;</code>
      </div>
    </section>
  `;

  return renderPageLayout({
    title: SITE_NAME,
    description: excerpt(heroText, 160),
    pathname: "/",
    heroEyebrow: "OpenClaw 文档故事乐园",
    heroTitle: "给 5 岁小朋友也能慢慢听懂的 OpenClaw 网站",
    heroText,
    content,
    navigation: siteData.navigation,
    breadcrumbs: [
      { label: "Home", pathname: "/" }
    ]
  });
}

function renderIconPage() {
  const cards = iconConcepts
    .map(
      (icon, index) => `
        <article class="icon-card">
          <div class="icon-preview">
            <img src="/assets/icons/${escapeHtml(icon.file)}" alt="${escapeHtml(icon.chineseName)} 图标预览">
          </div>
          <div class="icon-copy">
            <p class="section-kicker">方案 ${index + 1}</p>
            <h2>${escapeHtml(icon.chineseName)}</h2>
            <p>${escapeHtml(icon.summary)}</p>
            <p>${escapeHtml(icon.fit)}</p>
            <code>/assets/icons/${escapeHtml(icon.file)}</code>
          </div>
        </article>
      `
    )
    .join("");

  const content = `
    <section class="section-shell">
      <div class="overview-card">
        <div>
          <p class="section-kicker">主题图标候选</p>
          <h2>这 3 个门牌都能直接拿来做站点主题</h2>
          <p>我已经把它们都放进仓库，并且默认先用“气球故事书”作为 favicon。你后面只要告诉我选哪一个，我就可以把站点默认图标、社交分享图和品牌色再统一一轮。</p>
        </div>
      </div>
    </section>
    <section class="section-shell">
      <div class="icon-grid">${cards}</div>
    </section>
  `;

  return renderPageLayout({
    title: "Theme Icons",
    description: "Fivey Can Read OpenClaw 的 3 个站点图标候选方案。",
    pathname: "/theme-icons",
    heroEyebrow: "Brand Preview",
    heroTitle: "给网站挑一个最像它的门牌",
    heroText: "这里把三个图标样例放在一起看，你可以很快判断我们是更偏绘本感、工具感，还是更偏独立品牌感。",
    content,
    navigation: siteData.navigation,
    breadcrumbs: [
      { label: "Home", pathname: "/" },
      { label: "Theme Icons", pathname: "/theme-icons" }
    ]
  });
}

function renderDocPage(page) {
  const breadcrumbs = [
    { label: "Home", pathname: "/" },
    { label: page.sectionLabel, pathname: page.pathname }
  ];

  const sectionsHtml = page.sections
    .map((section, index) => {
      const sectionBlocks = section.blocks
        .map((block) => renderStoryBlock(block, section.title))
        .join("");

      return `
        <section class="section-shell" id="section-${index + 1}">
          <div class="section-heading">
            <p class="section-kicker">第 ${index + 1} 站</p>
            <h2>${escapeHtml(softenTerms(section.title))}</h2>
            <p>${escapeHtml(storyForParagraph(section.title))}</p>
          </div>
          <div class="story-grid">
            ${sectionBlocks}
          </div>
        </section>
      `;
    })
    .join("");

  const content = `
    <section class="section-shell">
      <div class="overview-card">
        <div>
          <p class="section-kicker">先听总故事</p>
          <h2>${escapeHtml(page.title)}</h2>
          <p>${escapeHtml(storyLead(page.title, page.description || ""))}</p>
        </div>
        <div class="overview-meta">
          <span>原始路径：${escapeHtml(page.pathname)}</span>
          <span>章节数量：${page.sections.length}</span>
          <a href="${escapeHtml(page.url)}" target="_blank" rel="noreferrer">查看原文</a>
        </div>
      </div>
    </section>
    ${sectionsHtml}
    <section class="section-shell">
      <div class="ad-placeholder">
        <p>这里预留给未来的 Google AdSense 模块。</p>
        <code>&lt;!-- ADSENSE_SNIPPET --&gt;</code>
      </div>
    </section>
  `;

  return renderPageLayout({
    title: page.title,
    description: excerpt(page.description || `${page.title} 的儿童故事化解读。`, 160),
    pathname: page.pathname,
    heroEyebrow: `${page.sectionLabel} 故事分馆`,
    heroTitle: `${page.title}，像讲故事一样读`,
    heroText: storyLead(page.title, page.description || ""),
    content,
    navigation: siteData.navigation,
    breadcrumbs
  });
}

const css = `
:root {
  --bg: #fff8f2;
  --ink: #3a3551;
  --soft-ink: #60597a;
  --card: rgba(255, 255, 255, 0.92);
  --line: rgba(113, 93, 180, 0.14);
  --primary: #f5576c;
  --secondary: #667eea;
  --mint: #7bdff2;
  --gold: #ffd166;
  --shadow: 0 22px 60px rgba(69, 48, 117, 0.14);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: "Trebuchet MS", "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(123, 223, 242, 0.28), transparent 28%),
    radial-gradient(circle at top right, rgba(245, 87, 108, 0.22), transparent 30%),
    linear-gradient(135deg, #fff7f0 0%, #f8fbff 46%, #fff7fb 100%);
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

code, pre {
  font-family: "SFMono-Regular", "Consolas", monospace;
}

.page-shell {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: auto;
  padding: 26px 20px 32px;
  background: rgba(255, 255, 255, 0.72);
  border-right: 1px solid var(--line);
  backdrop-filter: blur(18px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(245, 87, 108, 0.14), rgba(102, 126, 234, 0.16));
  box-shadow: var(--shadow);
  margin-bottom: 22px;
}

.brand-mark {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 28px;
  background: linear-gradient(135deg, #ff9a9e, #fad0c4 45%, #fbc2eb);
}

.brand strong {
  display: block;
  font-size: 1rem;
}

.brand small {
  display: block;
  margin-top: 4px;
  color: var(--soft-ink);
}

.sidebar-nav {
  display: grid;
  gap: 18px;
}

.sidebar-group h3 {
  margin: 0 0 10px;
  font-size: 0.86rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #b04b8f;
}

.sidebar-links {
  display: grid;
  gap: 8px;
}

.sidebar-link {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 16px;
  transition: transform 180ms ease, background 180ms ease;
}

.sidebar-link:hover,
.sidebar-link.is-active {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 24px rgba(69, 48, 117, 0.08);
}

.sidebar-link small {
  color: var(--soft-ink);
}

.main {
  padding: 28px 28px 56px;
}

.hero {
  padding: 30px;
  border-radius: 34px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.48), transparent 30%),
    linear-gradient(135deg, #f8a7ff 0%, #f5576c 36%, #ffd166 100%);
  color: white;
  box-shadow: var(--shadow);
}

.hero-topbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.nav-toggle,
.source-link {
  border: 0;
  background: rgba(255, 255, 255, 0.18);
  color: white;
  border-radius: 999px;
  padding: 10px 16px;
  font: inherit;
}

.hero-eyebrow,
.section-kicker {
  margin: 0 0 12px;
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.92;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.1rem, 4vw, 3.5rem);
  line-height: 1.05;
}

.hero-copy {
  max-width: 760px;
  margin: 18px 0 0;
  font-size: 1.08rem;
  line-height: 1.8;
}

.hero-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.hero-pills span,
.overview-meta span,
.overview-meta a {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}

.mobile-nav {
  display: none;
  margin-top: 20px;
}

.section-shell {
  margin-top: 24px;
}

.spotlight-card,
.overview-card,
.ad-placeholder {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 30px;
  padding: 26px;
  box-shadow: var(--shadow);
}

.spotlight-card {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 18px;
}

.section-heading h2,
.spotlight-card h2,
.overview-card h2 {
  margin: 0 0 8px;
  font-size: clamp(1.6rem, 2.6vw, 2.4rem);
}

.section-heading p,
.spotlight-card p,
.overview-card p,
.story-card p,
.source-card p,
.ad-placeholder p {
  margin: 0;
  color: var(--soft-ink);
  line-height: 1.8;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-card,
.home-card {
  border-radius: 22px;
  padding: 18px;
  background: linear-gradient(135deg, rgba(255, 240, 245, 0.95), rgba(243, 248, 255, 0.95));
  border: 1px solid rgba(113, 93, 180, 0.12);
}

.icon-grid {
  display: grid;
  gap: 18px;
}

.icon-card {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 30px;
  padding: 22px;
  box-shadow: var(--shadow);
}

.icon-preview {
  display: grid;
  place-items: center;
  min-height: 260px;
  border-radius: 26px;
  background: linear-gradient(135deg, rgba(255, 245, 214, 0.92), rgba(245, 239, 255, 0.92));
}

.icon-preview img {
  width: min(220px, 100%);
  height: auto;
}

.icon-copy h2 {
  margin: 0 0 10px;
  font-size: 1.9rem;
}

.icon-copy code {
  display: inline-block;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(102, 126, 234, 0.12);
}

.stat-card strong {
  display: block;
  font-size: 2rem;
  margin-bottom: 6px;
}

.home-grid,
.story-grid {
  display: grid;
  gap: 18px;
}

.home-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.home-card {
  box-shadow: var(--shadow);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.home-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 28px 66px rgba(69, 48, 117, 0.16);
}

.home-card-index {
  display: inline-flex;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #7bdff2, #b2f7ef);
  color: #2d3265;
  font-weight: 700;
}

.home-card h2 {
  margin: 16px 0 8px;
}

.story-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.story-card,
.source-card {
  padding: 22px;
  border-radius: 26px;
  background: var(--card);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

.story-card-label {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(245, 87, 108, 0.12), rgba(102, 126, 234, 0.12));
  color: #9b3d88;
  font-size: 0.85rem;
}

.source-card ul,
.code-steps {
  margin: 14px 0 0;
  padding-left: 20px;
  color: var(--soft-ink);
  line-height: 1.8;
}

.source-card pre {
  margin: 14px 0 0;
  padding: 18px;
  overflow: auto;
  border-radius: 22px;
  background: #2d2b45;
  color: #f7f5ff;
}

.source-card code {
  background: rgba(102, 126, 234, 0.12);
  border-radius: 8px;
  padding: 2px 6px;
}

.source-card pre code {
  padding: 0;
  background: transparent;
}

.overview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
  color: var(--soft-ink);
}

.ad-placeholder {
  text-align: center;
  background: linear-gradient(135deg, rgba(255, 233, 188, 0.65), rgba(255, 255, 255, 0.9));
}

.page-footer {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 24px 12px 0;
  color: var(--soft-ink);
}

.footer-links {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

@media (max-width: 1080px) {
  .page-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .mobile-nav {
    display: none;
  }

  .mobile-nav.is-open {
    display: block;
  }

  .spotlight-card,
  .story-grid,
  .icon-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .main {
    padding: 18px 14px 38px;
  }

  .hero,
  .spotlight-card,
  .overview-card,
  .story-card,
  .source-card,
  .ad-placeholder {
    border-radius: 24px;
    padding: 20px;
  }

  .hero-copy {
    font-size: 1rem;
  }

  .page-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;

const js = `
const toggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector("#mobile-nav");

if (toggle && mobileNav) {
  toggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}
`;

await fs.writeFile(path.join(DIST_DIR, "assets", "site.css"), css.trimStart(), "utf8");
await fs.writeFile(path.join(DIST_DIR, "assets", "site.js"), js.trimStart(), "utf8");
await fs.writeFile(path.join(DIST_DIR, "index.html"), renderHomePage(), "utf8");
await ensureDir(path.join(DIST_DIR, "theme-icons"));
await fs.writeFile(path.join(DIST_DIR, "theme-icons", "index.html"), renderIconPage(), "utf8");

for (const page of siteData.pages) {
  const outputPath = pageOutputPath(page.pathname);
  await ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, renderDocPage(page), "utf8");

  if (page.pathname !== "/index" && page.pathname.endsWith("/index")) {
    const aliasOutputPath = path.join(DIST_DIR, page.pathname.slice(1, -"/index".length), "index.html");
    await ensureDir(path.dirname(aliasOutputPath));
    await fs.writeFile(aliasOutputPath, renderDocPage(page), "utf8");
  }
}

const sitemapEntries = [
  "/",
  ...siteData.pages.map((page) => publicPathname(page.pathname))
]
  .map((pathname) => {
    const url = pathname === "/" ? SITE_URL : `${SITE_URL}${pathname}`;
    return `<url><loc>${escapeHtml(url)}</loc><lastmod>${siteData.generatedAt}</lastmod></url>`;
  })
  .join("");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

const ads = `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
`;

const manifest = JSON.stringify(
  {
    name: SITE_NAME,
    short_name: "Fivey OpenClaw",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8f2",
    theme_color: "#f5576c",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  },
  null,
  2
);

const searchIndex = siteData.pages.map((page) => ({
  title: page.title,
  pathname: page.pathname,
  section: page.sectionLabel,
  description: page.description
}));

await fs.writeFile(path.join(DIST_DIR, "sitemap.xml"), sitemap, "utf8");
await fs.writeFile(path.join(DIST_DIR, "robots.txt"), robots, "utf8");
await fs.writeFile(path.join(DIST_DIR, "ads.txt"), ads, "utf8");
await fs.writeFile(path.join(DIST_DIR, "site.webmanifest"), manifest, "utf8");
await fs.writeFile(path.join(DIST_DIR, "search-index.json"), `${JSON.stringify(searchIndex, null, 2)}\n`, "utf8");

console.log(`Built ${siteData.pages.length} documentation pages into ${DIST_DIR}`);

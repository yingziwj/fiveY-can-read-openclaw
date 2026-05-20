import fs from "node:fs/promises";
import path from "node:path";
import {
  DATA_PATH,
  DIST_DIR,
  SITE_NAME,
  SITE_URL,
  buildDocHeroText,
  buildDocHeroTitle,
  ensureDir,
  escapeHtml,
  excerpt,
  formatDate,
  readJson,
  stripMarkdown,
  softenTerms,
  storyForCode,
  storyForList,
  storyForParagraph,
  storyLead,
  translateMenuTitle,
  translateSectionLabel
} from "./site-lib.mjs";
import { handcraftedPageMap } from "./handcrafted-pages.mjs";

async function loadSiteData() {
  try {
    return await readJson(DATA_PATH);
  } catch (error) {
    throw new Error(
      `Missing generated site data at ${DATA_PATH}. Run npm run build to sync and build, or npm run sync before npm run build:offline.`,
      { cause: error }
    );
  }
}

const siteData = await loadSiteData();
await fs.rm(DIST_DIR, { recursive: true, force: true });
await ensureDir(DIST_DIR);
await ensureDir(path.join(DIST_DIR, "assets"));

const adsensePublisherId = "pub-3833673520933536";
const adsenseClientId = `ca-${adsensePublisherId}`;

const defaultIconSource = path.resolve("assets/icons/concept-balloon-book.svg");
const iconOutput = path.join(DIST_DIR, "favicon.svg");
await fs.copyFile(defaultIconSource, iconOutput);
const selectedTheme = {
  file: "concept-balloon-book.svg",
  name: "Balloon Book",
  chineseName: "气球故事书",
  summary: "最贴近当前海报气质，温柔、可爱、像在读绘本。",
  fit: "适合把站点重点放在“儿童友好解读”和“陪伴式学习”。",
  reason: "它和最初示例海报的糖果色、圆角卡片和绘本感最一致，所以我把它正式定为默认主题。"
};

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

function splitMarkdownTableRow(row) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isMarkdownTableDivider(row) {
  const cells = splitMarkdownTableRow(row);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function renderTableRows(rows) {
  const dataRows = rows.filter((row) => !isMarkdownTableDivider(row));
  if (dataRows.length < 2) {
    return `<p class="source-table-fallback">${renderInline(rows.join(" "))}</p>`;
  }

  const [headerRow, ...bodyRows] = dataRows.map(splitMarkdownTableRow);
  return `
    <div class="source-table-scroll">
      <table class="source-table">
        <thead>
          <tr>${headerRow.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${bodyRows
            .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderOriginalBlock(block) {
  if (block.type === "paragraph") {
    return `<p>${renderInline(block.text)}</p>`;
  }

  if (block.type === "list") {
    return `<ul>${block.items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`;
  }

  if (block.type === "table") {
    return renderTableRows(block.rows);
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

  if (block.type === "table") {
    return `
      <div class="story-card">
        <div class="story-card-label">像整理表格</div>
        <p>这段是在把几种选项排成表格，左边像标签，右边像说明。手机上可以横向滑动原文表格。</p>
      </div>
      <div class="source-card">
        <div class="story-card-label">原文表格</div>
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

function sectionGuide(section) {
  const plain = stripMarkdown(
    section.blocks
      .map((block) => {
        if (block.type === "paragraph") return block.text;
        if (block.type === "list") return block.items.join("；");
        if (block.type === "code") return "";
        return "";
      })
      .join(" ")
  );

  const lower = plain.toLowerCase();
  let what = `这一节主要在解释“${softenTerms(section.title)}”到底是干什么的，以及你什么时候会遇到它。`;
  let why = "如果你是第一次接触 OpenClaw，这一节最值得看的不是术语本身，而是它背后的使用场景和限制。";
  let use = "真正动手时，先看它有没有默认值、有没有必须打开的选项、以及会不会影响安全边界。";

  if (/allow|deny|policy|required|must|default/.test(lower)) {
    what = `这一节在讲规则和边界：什么默认允许、什么必须显式打开、什么被禁止。`;
    why = "这种内容决定了 OpenClaw 是“能做”还是“现在还不能做”，读懂它比记术语更重要。";
    use = "你可以把这一节当成权限说明书，真正配置时优先盯住 default、required、allow、deny 这几个词。";
  } else if (/install|setup|configure|onboard|enable/.test(lower + section.title.toLowerCase())) {
    what = `这一节更像安装或配置步骤，重点不是概念，而是“按什么顺序做才不会卡住”。`;
    why = "很多文档看起来长，其实是在防你漏掉前置条件。";
    use = "真正照做时，先找前置条件，再找必填项，最后看验证方法。";
  } else if (/tool|browser|search|exec|file|message|cron|plugin|skill/.test(lower + section.title.toLowerCase())) {
    what = `这一节在讲一类能力是怎么工作的：它能做什么、不能做什么、适合在什么场景下调用。`;
    why = "你理解的是能力边界，不只是功能名字。";
    use = "如果这节里同时出现命令、配置和例子，优先先看例子，再回头看配置。";
  }

  return { what, why, use };
}

async function renderHandcraftedContent(page) {
  const filePath = handcraftedPageMap.get(page.pathname);
  if (!filePath) return null;
  const original = await fs.readFile(filePath, "utf8");
  const heroOverride = await loadHeroOverride(page);
  const rewritten = rewriteHandcraftedOverviewCard(page, original, heroOverride);
  return `<!-- handcrafted-source:${path.basename(filePath)} -->\n${rewritten}`;
}

async function renderAiPageContent(page) {
  const filePath = path.resolve("generated", "deepseek-pages", `${page.slug.replace(/\//g, "__")}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const payload = JSON.parse(raw);
    const result = payload.result;
    if (!result?.sections?.length) return null;

    const sectionsHtml = result.sections
      .map((section, index) => {
        const points = (section.points || []).map((point) => `<li>${escapeHtml(point)}</li>`).join("");
        const codeNotes = (section.codeNotes || []).length
          ? `
            <div class="source-card">
              <div class="story-card-label">🛠 命令 / 代码像在做什么</div>
              <ul>${section.codeNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
            </div>
          `
          : "";

        return `
          <section class="section-shell" id="section-${index + 1}">
            <div class="section-heading">
              <p class="section-kicker">第 ${index + 1} 站</p>
              <h2>${escapeHtml(section.title)}</h2>
              <p>${escapeHtml(section.summary)}</p>
            </div>
            <div class="story-grid">
              <div class="story-card">
                <div class="story-card-label">🌟 为什么要看</div>
                <p>${escapeHtml(section.why)}</p>
              </div>
              <div class="source-card">
                <div class="story-card-label">🧠 这节要记住什么</div>
                <ul>${points}</ul>
              </div>
              ${codeNotes}
              <div class="story-card">
                <div class="story-card-label">🎈 最后记一句</div>
                <p>${escapeHtml(section.takeaway)}</p>
              </div>
            </div>
          </section>
        `;
      })
      .join("");

    return `
      <section class="section-shell">
        <div class="overview-card">
          <div>
            <p class="section-kicker">AI 绘本解读版</p>
            <h2>${escapeHtml(result.heroTitle || page.title)}</h2>
            <p>${escapeHtml(result.heroSummary || "")}</p>
          </div>
          <div class="overview-meta">
            <span>原始路径：${escapeHtml(page.pathname)}</span>
            <span>故事卡片：${result.sections.length} 张</span>
            <a href="${escapeHtml(page.url)}" target="_blank" rel="noreferrer">查看官方原文</a>
          </div>
        </div>
      </section>
      ${sectionsHtml}
      <section class="section-shell">
        <div class="ad-placeholder">
          <p>AdSense 连接验证已经放在页面头部；广告单元等站点审批通过后再启用。</p>
          <code>google-adsense-account: ${adsenseClientId}</code>
        </div>
      </section>
    `;
  } catch {
    return null;
  }
}

async function loadHeroOverride(page) {
  const filePath = path.resolve("generated", "deepseek-heroes", `${page.slug.replace(/\//g, "__")}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const payload = JSON.parse(raw);
    const result = payload?.result || {};
    return {
      heroTitle: typeof result.heroTitle === "string" ? result.heroTitle.trim() : "",
      heroSummary: typeof result.heroSummary === "string" ? result.heroSummary.trim() : ""
    };
  } catch {
    return null;
  }
}

function buildUnifiedOverviewCard(page, heroOverride) {
  const overviewTitle = heroOverride?.heroTitle || buildDocHeroTitle(page);
  const overviewSummary = heroOverride?.heroSummary || buildDocHeroText(page);
  const firstSection = page.sections?.[0]?.title ? softenTerms(page.sections[0].title) : "";

  return `
<section class="section-shell">
  <div class="overview-card">
    <div>
      <p class="section-kicker">先讲这一页到底在解决什么</p>
      <h2>${escapeHtml(overviewTitle)}</h2>
      <p>${escapeHtml(overviewSummary)}</p>
    </div>
    <div class="overview-meta">
      <span>原文共 ${page.sections.length} 节${firstSection ? `，先看 ${firstSection}` : ""}</span>
      <span>路径：${escapeHtml(page.pathname)}</span>
      <a href="${escapeHtml(page.url)}" target="_blank" rel="noreferrer">查看官方原文</a>
    </div>
  </div>
</section>
`.trim();
}

function rewriteHandcraftedOverviewCard(page, html, heroOverride) {
  const replacement = buildUnifiedOverviewCard(page, heroOverride);
  const trimmed = html.trimStart();

  if (!trimmed.startsWith("<section")) {
    return `${replacement}\n\n${html}`;
  }

  const firstSectionEnd = trimmed.indexOf("</section>");
  if (firstSectionEnd === -1) {
    return `${replacement}\n\n${trimmed}`;
  }

  const firstSection = trimmed.slice(0, firstSectionEnd + "</section>".length);
  if (!firstSection.includes('class="overview-card"')) {
    return `${replacement}\n\n${trimmed}`;
  }

  const rest = trimmed.slice(firstSectionEnd + "</section>".length).trimStart();
  return rest ? `${replacement}\n\n${rest}` : replacement;
}

function renderSidebar(navigation, currentPathname) {
  return `
    <nav class="sidebar-nav">
      ${navigation
        .map((section) => {
          const hasActivePage = section.pages.some((page) => page.pathname === currentPathname);
          const links = section.pages
            .map((page) => {
              const active = page.pathname === currentPathname ? "is-active" : "";
              return `
                <a class="sidebar-link ${active}" href="${publicPathname(page.pathname)}">
                  <span>${escapeHtml(page.translatedTitle || translateMenuTitle(page.title, page.sectionKey))}</span>
                  <small>${escapeHtml(page.title)}</small>
                </a>
              `;
            })
            .join("");

          return `
            <details class="sidebar-group"${hasActivePage ? " open" : ""}>
              <summary>${escapeHtml(section.translatedLabel || translateSectionLabel(section.key, section.label))}</summary>
              <div class="sidebar-links">${links}</div>
            </details>
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
  <meta name="google-adsense-account" content="${adsenseClientId}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(`${SITE_URL}/og-image.svg`)}">
  <meta property="og:image:alt" content="${escapeHtml(`${title} 的中文故事化导读页面`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(`${SITE_URL}/og-image.svg`)}">
  <meta name="theme-color" content="#f5576c">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="${asset("site.css")}" as="style">
  <link rel="stylesheet" href="${asset("site.css")}">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}" crossorigin="anonymous"></script>
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
        <span class="brand-mark"><img src="/favicon.svg" alt="${escapeHtml(selectedTheme.chineseName)}"></span>
        <span>
          <strong>Fivey Can Read</strong>
          <small>OpenClaw 绘本版文档站 · ${escapeHtml(selectedTheme.chineseName)}主题</small>
        </span>
      </a>
      ${renderSidebar(navigation, pathname)}
    </aside>

    <main class="main">
      <header class="hero">
        <div class="hero-topbar">
          <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="打开菜单">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div class="hero-actions">
            <a class="source-link" href="/theme-icons/">图标样例</a>
            <a class="source-link" href="https://docs.openclaw.ai" target="_blank" rel="noreferrer">原始文档</a>
          </div>
        </div>
        <p class="hero-eyebrow">${escapeHtml(heroEyebrow)}</p>
        <h1>${escapeHtml(heroTitle)}</h1>
        <p class="hero-copy">${escapeHtml(heroText)}</p>
      </header>

      <div class="mobile-nav-shell" data-mobile-shell>
        <button class="mobile-nav-backdrop" type="button" aria-label="关闭菜单" data-mobile-close></button>
        <div id="mobile-nav" class="mobile-nav" role="dialog" aria-modal="true" aria-label="站点菜单">
          <div class="mobile-nav-head">
            <strong>站点菜单</strong>
            <button class="mobile-nav-close" type="button" aria-label="关闭菜单" data-mobile-close>关闭</button>
          </div>
          ${renderSidebar(navigation, pathname)}
        </div>
      </div>

      ${content}

      <footer class="page-footer">
        <div>
          <strong>${escapeHtml(SITE_NAME)}</strong>
          <p>同步时间：${escapeHtml(formatDate(siteData.generatedAt))}</p>
        </div>
      </footer>
    </main>
  </div>
  <script src="${asset("site.js")}" defer></script>
</body>
</html>`;
}

function renderHomePage() {
  const heroText = `我们把 OpenClaw 官方文档变成了适合 5 岁小朋友和第一次接触的人阅读的故事版。每一页都会按原文菜单顺序讲，命令和代码也会拆成一步一步的小故事。现在默认主题已经定为“${selectedTheme.chineseName}”，整站会统一沿着这套绘本气质继续长。`;
  const sectionCards = siteData.navigation
    .map(
      (section, index) => `
        <a class="home-card" href="${section.pages[0] ? publicPathname(section.pages[0].pathname) : "/"}">
          <span class="home-card-index">${String(index + 1).padStart(2, "0")}</span>
          <h2>${escapeHtml(section.translatedLabel || translateSectionLabel(section.key, section.label))}</h2>
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
      <div class="overview-card brand-overview">
        <div class="brand-overview-art">
          <img src="/favicon.svg" alt="${escapeHtml(selectedTheme.chineseName)}">
        </div>
        <div>
          <p class="section-kicker">默认主题已定</p>
          <h2>${escapeHtml(selectedTheme.chineseName)}</h2>
          <p>${escapeHtml(selectedTheme.reason)}</p>
          <div class="overview-meta">
            <span>${escapeHtml(selectedTheme.summary)}</span>
            <a href="/theme-icons/">查看另外两个方案</a>
          </div>
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
                <span class="home-card-index">${icon.file === selectedTheme.file ? "✓" : "🎨"}</span>
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
          <p>默认图标我已经定成 <code>${escapeHtml(selectedTheme.chineseName)}</code> 主题；AdSense 连接验证、加载脚本和 <code>ads.txt</code> 已经随构建一起输出。</p>
        </div>
      </div>
    </section>

    <section class="section-shell">
      <div class="section-heading">
        <p class="section-kicker">广告审核准备</p>
        <h2>AdSense 连接信号已经放好</h2>
      </div>
      <div class="ad-placeholder">
        <p>页面头部包含 AdSense 账户验证 meta 和加载脚本；广告单元等站点审批通过后再开启。</p>
        <code>google-adsense-account: ${adsenseClientId}</code>
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
            <h2>${escapeHtml(icon.chineseName)}${icon.file === selectedTheme.file ? " · 当前默认" : ""}</h2>
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
          <p>我已经把它们都放进仓库，并且现在正式把“${selectedTheme.chineseName}”定成默认主题。后面如果要换，也只需要切一次默认文件名和品牌文案。</p>
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

async function renderDocPage(page) {
  const breadcrumbs = [
    { label: "Home", pathname: "/" },
    { label: page.sectionLabel, pathname: page.pathname }
  ];

  const sectionsHtml = page.sections
    .map((section, index) => {
      const guide = sectionGuide(section);
      const sectionBlocks = section.blocks
        .map((block) => renderStoryBlock(block, section.title))
        .join("");

      return `
        <section class="section-shell" id="section-${index + 1}">
          <div class="section-heading">
            <p class="section-kicker">第 ${index + 1} 站</p>
            <h2>${escapeHtml(softenTerms(section.title))}</h2>
            <p>${escapeHtml(guide.what)}</p>
          </div>
          <div class="story-grid">
            <div class="story-card">
              <div class="story-card-label">这段在解决什么</div>
              <p>${escapeHtml(guide.what)}</p>
            </div>
            <div class="story-card">
              <div class="story-card-label">为什么值得看</div>
              <p>${escapeHtml(guide.why)}</p>
            </div>
            <div class="story-card">
              <div class="story-card-label">真要动手时</div>
              <p>${escapeHtml(guide.use)}</p>
            </div>
            <div class="source-card">
              <div class="story-card-label">先别急着背术语</div>
              <p>${escapeHtml(storyForParagraph(stripMarkdown(section.blocks.map((block) => block.type === "paragraph" ? block.text : "").join(" "))))}</p>
            </div>
          </div>
          <div class="story-grid">
            ${sectionBlocks}
          </div>
        </section>
      `;
    })
    .join("");

  const genericContent = `
    <section class="section-shell">
      <div class="overview-card">
        <div>
          <p class="section-kicker">先听这页的人话版</p>
          <h2>${escapeHtml(page.title)}</h2>
          <p>${escapeHtml(storyLead(page.title, page.description || ""))}</p>
          <p>${escapeHtml(`如果把这页当成“给普通人看的版本”，你最应该带走的是：它到底在教你一件什么事、什么时候要这样做、以及哪里最容易踩坑。`)}</p>
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
        <p>AdSense 连接验证已经放在页面头部；广告单元等站点审批通过后再启用。</p>
        <code>google-adsense-account: ${adsenseClientId}</code>
      </div>
    </section>
  `;
  const handcraftedContent = await renderHandcraftedContent(page);
  const aiContent = handcraftedContent ? null : await renderAiPageContent(page);
  const heroOverride = await loadHeroOverride(page);

  const heroTitle = heroOverride?.heroTitle || buildDocHeroTitle(page);
  const heroText = heroOverride?.heroSummary || buildDocHeroText(page);

  return renderPageLayout({
    title: page.title,
    description: excerpt(heroText || page.description || `${page.title} 的儿童故事化解读。`, 160),
    pathname: page.pathname,
    heroEyebrow: `${page.sectionLabel} 导读`,
    heroTitle,
    heroText,
    content: handcraftedContent || aiContent || genericContent,
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
  min-width: 0;
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

.brand-mark img {
  width: 40px;
  height: 40px;
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

.sidebar-group {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid rgba(176, 75, 143, 0.08);
  overflow: hidden;
}

.sidebar-group summary {
  list-style: none;
  cursor: pointer;
  padding: 14px 16px;
  margin: 0;
  font-size: 0.86rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #b04b8f;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-group summary::-webkit-details-marker {
  display: none;
}

.sidebar-group summary::after {
  content: "展开";
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--soft-ink);
}

.sidebar-group[open] summary::after {
  content: "收起";
}

.sidebar-links {
  display: grid;
  gap: 8px;
  padding: 0 12px 12px;
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
  min-width: 0;
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

.nav-toggle {
  width: 48px;
  height: 48px;
  padding: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.nav-toggle span {
  width: 20px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  transition: transform 180ms ease, opacity 180ms ease;
}

.nav-toggle[aria-expanded="true"] span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.nav-toggle[aria-expanded="true"] span:nth-child(2) {
  opacity: 0;
}

.nav-toggle[aria-expanded="true"] span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
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

.overview-meta span,
.overview-meta a {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}

.mobile-nav-shell {
  display: none;
}

.mobile-nav-backdrop {
  display: none;
}

.mobile-nav {
  display: none;
}

.mobile-nav-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px 14px;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(113, 93, 180, 0.14);
}

.mobile-nav-head strong {
  font-size: 1rem;
  color: #3a3551;
}

.mobile-nav-close {
  border: 0;
  border-radius: 999px;
  padding: 10px 14px;
  background: rgba(102, 126, 234, 0.12);
  color: #514a72;
  font: inherit;
}

.mobile-nav .sidebar-nav {
  padding: 14px;
}

.mobile-nav .sidebar-group {
  background: rgba(255, 255, 255, 0.72);
}

.section-shell {
  margin-top: 24px;
  min-width: 0;
}

.spotlight-card,
.overview-card,
.ad-placeholder {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 30px;
  padding: 26px;
  box-shadow: var(--shadow);
  min-width: 0;
}

.brand-overview {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
}

.brand-overview-art {
  display: grid;
  place-items: center;
  min-height: 180px;
  border-radius: 26px;
  background: linear-gradient(135deg, rgba(255, 233, 188, 0.72), rgba(248, 238, 255, 0.86));
}

.brand-overview-art img {
  width: 140px;
  height: auto;
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
  min-width: 0;
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
  max-width: 100%;
  border-radius: 22px;
  background: #2d2b45;
  color: #f7f5ff;
}

.section-heading p,
.spotlight-card p,
.overview-card p,
.story-card p,
.source-card p,
.ad-placeholder p,
.source-card li,
.source-card a,
.source-card code,
.overview-meta span,
.overview-meta a {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.source-card code {
  background: rgba(102, 126, 234, 0.12);
  border-radius: 8px;
  padding: 2px 6px;
}

.source-card pre code {
  padding: 0;
  background: transparent;
  overflow-wrap: normal;
  word-break: normal;
}

.source-table-scroll {
  margin: 14px 0 0;
  overflow-x: auto;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}

.source-table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  color: var(--soft-ink);
  line-height: 1.6;
}

.source-table th,
.source-table td {
  padding: 10px 12px;
  border: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}

.source-table th {
  color: var(--ink);
  background: rgba(102, 126, 234, 0.1);
}

.source-table-fallback {
  overflow-wrap: anywhere;
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

@media (max-width: 1080px) {
  .page-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .mobile-nav-shell {
    position: fixed;
    inset: 0;
    z-index: 40;
    pointer-events: none;
  }

  .mobile-nav-shell.is-open {
    display: block;
    pointer-events: auto;
  }

  .mobile-nav-shell.is-open .mobile-nav-backdrop {
    display: block;
    position: absolute;
    inset: 0;
    border: 0;
    background: rgba(32, 19, 50, 0.46);
  }

  .mobile-nav {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    display: block;
    width: min(86vw, 360px);
    margin: 0;
    padding: 14px 0 18px;
    border-radius: 0 28px 28px 0;
    border-right: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(250, 246, 255, 0.96);
    backdrop-filter: blur(18px);
    box-shadow: 0 24px 60px rgba(30, 20, 53, 0.22);
    transform: translateX(-100%);
    transition: transform 220ms ease;
    overflow: auto;
  }

  .mobile-nav-shell.is-open .mobile-nav {
    transform: translateX(0);
  }

  .hero-topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-actions {
    width: 100%;
  }

  .nav-toggle,
  .hero-actions .source-link {
    min-height: 44px;
  }

  .spotlight-card,
  .story-grid,
  .icon-card,
  .brand-overview {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .main {
    padding: 18px 14px 38px;
  }

  .brand {
    align-items: flex-start;
    padding: 16px;
  }

  .brand-mark {
    width: 48px;
    height: 48px;
  }

  .brand-mark img {
    width: 34px;
    height: 34px;
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

  .hero-actions,
  .overview-meta {
    gap: 8px;
  }

  .hero-actions .source-link,
  .nav-toggle {
    min-height: 44px;
  }

  .mobile-nav-head {
    padding-left: 16px;
    padding-right: 16px;
  }

  .overview-meta span,
  .overview-meta a {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .stat-grid,
  .home-grid,
  .story-grid {
    grid-template-columns: 1fr;
  }

  .source-card pre {
    font-size: 0.92rem;
    padding: 16px;
  }

  .page-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 540px) {
  .hero-topbar {
    gap: 12px;
    margin-bottom: 18px;
  }

  .hero h1 {
    font-size: clamp(1.8rem, 9vw, 2.35rem);
  }

  .hero-copy,
  .section-heading p,
  .spotlight-card p,
  .overview-card p,
  .story-card p,
  .source-card p,
  .ad-placeholder p {
    line-height: 1.65;
  }

  .sidebar-group summary,
  .sidebar-link {
    padding-left: 12px;
    padding-right: 12px;
  }

  .mobile-nav {
    width: min(90vw, 340px);
    border-radius: 0 24px 24px 0;
  }

  .mobile-nav-head {
    padding-left: 14px;
    padding-right: 14px;
  }

  .mobile-nav-close {
    padding: 9px 12px;
  }
}
`;

const js = `
const toggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector("#mobile-nav");
const mobileShell = document.querySelector("[data-mobile-shell]");
const closeButtons = document.querySelectorAll("[data-mobile-close]");

if (toggle && mobileNav && mobileShell) {
  const setOpen = (isOpen) => {
    mobileShell.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "关闭菜单" : "打开菜单");
    document.body.style.overflow = isOpen ? "hidden" : "";
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => setOpen(false));
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });
}
`;

const ogImage = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8a7ff"/>
      <stop offset="45%" stop-color="#f5576c"/>
      <stop offset="100%" stop-color="#ffd166"/>
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.96"/>
      <stop offset="100%" stop-color="#fff4fa" stop-opacity="0.94"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" rx="48" fill="url(#bg)"/>
  <circle cx="1060" cy="90" r="120" fill="#ffffff" opacity="0.12"/>
  <circle cx="120" cy="520" r="140" fill="#7bdff2" opacity="0.18"/>
  <rect x="72" y="72" width="1056" height="486" rx="40" fill="url(#card)"/>
  <image href="${SITE_URL}/favicon.svg" x="120" y="140" width="180" height="180"/>
  <text x="340" y="220" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="34" fill="#b04b8f">OpenClaw 绘本版文档站</text>
  <text x="340" y="312" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="74" font-weight="700" fill="#3a3551">Fivey Can Read</text>
  <text x="340" y="390" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="74" font-weight="700" fill="#3a3551">OpenClaw</text>
  <text x="120" y="486" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="28" fill="#60597a">给 5 岁小朋友也能慢慢听懂的 OpenClaw 官方文档解读</text>
  <text x="120" y="528" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="28" fill="#60597a">默认主题：${selectedTheme.chineseName}</text>
</svg>
`;

function cleanOutput(value) {
  return value.trimStart().replace(/[ \t]+$/gm, "");
}

async function writeTextFile(filePath, value) {
  await fs.writeFile(filePath, cleanOutput(value), "utf8");
}

await writeTextFile(path.join(DIST_DIR, "assets", "site.css"), css);
await writeTextFile(path.join(DIST_DIR, "assets", "site.js"), js);
await writeTextFile(path.join(DIST_DIR, "og-image.svg"), ogImage);
await writeTextFile(path.join(DIST_DIR, "index.html"), renderHomePage());
await ensureDir(path.join(DIST_DIR, "theme-icons"));
await writeTextFile(path.join(DIST_DIR, "theme-icons", "index.html"), renderIconPage());

for (const page of siteData.pages) {
  const outputPath = pageOutputPath(page.pathname);
  await ensureDir(path.dirname(outputPath));
  await writeTextFile(outputPath, await renderDocPage(page));

  if (page.pathname !== "/index" && page.pathname.endsWith("/index")) {
    const aliasOutputPath = path.join(DIST_DIR, page.pathname.slice(1, -"/index".length), "index.html");
    await ensureDir(path.dirname(aliasOutputPath));
    await writeTextFile(aliasOutputPath, await renderDocPage(page));
  }
}

const sitemapEntries = [
  "/",
  "/theme-icons/",
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

const ads = `google.com, ${adsensePublisherId}, DIRECT, f08c47fec0942fa0
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

await writeTextFile(path.join(DIST_DIR, "sitemap.xml"), sitemap);
await writeTextFile(path.join(DIST_DIR, "robots.txt"), robots);
await writeTextFile(path.join(DIST_DIR, "ads.txt"), ads);
await writeTextFile(path.join(DIST_DIR, "site.webmanifest"), manifest);
await writeTextFile(path.join(DIST_DIR, "search-index.json"), `${JSON.stringify(searchIndex, null, 2)}\n`);

console.log(`Built ${siteData.pages.length} documentation pages into ${DIST_DIR}`);

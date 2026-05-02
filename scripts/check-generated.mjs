import fs from "node:fs/promises";
import path from "node:path";
import { DATA_PATH, DIST_DIR, SITE_URL } from "./site-lib.mjs";

function fail(message) {
  throw new Error(message);
}

async function walkHtml(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkHtml(entryPath)));
    } else if (entry.name.endsWith(".html")) {
      files.push(entryPath);
    }
  }

  return files;
}

function hasMeta(html, selector) {
  return new RegExp(`<meta\\s+${selector}\\s+content="[^"]+"`, "i").test(html);
}

function getCanonical(html) {
  const match = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return match?.[1] || "";
}

await fs.access(DATA_PATH);
await fs.access(path.join(DIST_DIR, "index.html"));

const [sitemap, robots] = await Promise.all([
  fs.readFile(path.join(DIST_DIR, "sitemap.xml"), "utf8"),
  fs.readFile(path.join(DIST_DIR, "robots.txt"), "utf8")
]);

if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) {
  fail("robots.txt 缺少正确的 sitemap 地址。");
}

const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
for (const requiredUrl of [SITE_URL, `${SITE_URL}/theme-icons/`]) {
  if (!sitemapUrls.has(requiredUrl)) {
    fail(`sitemap.xml 缺少 ${requiredUrl}`);
  }
}

const htmlFiles = await walkHtml(DIST_DIR);
if (!htmlFiles.length) {
  fail("dist 中没有生成 HTML 页面。");
}

const requiredMetaSelectors = [
  'name="description"',
  'name="robots"',
  'property="og:title"',
  'property="og:description"',
  'property="og:url"',
  'property="og:image"',
  'property="og:image:alt"',
  'name="twitter:card"',
  'name="twitter:title"',
  'name="twitter:description"',
  'name="twitter:image"'
];

for (const file of htmlFiles) {
  const html = await fs.readFile(file, "utf8");
  const relative = path.relative(DIST_DIR, file);

  if (!/<title>[^<]+<\/title>/i.test(html)) {
    fail(`${relative} 缺少 title。`);
  }

  for (const selector of requiredMetaSelectors) {
    if (!hasMeta(html, selector)) {
      fail(`${relative} 缺少 meta ${selector}。`);
    }
  }

  const canonical = getCanonical(html);
  if (!canonical) {
    fail(`${relative} 缺少 canonical。`);
  }
  if (!canonical.startsWith(SITE_URL)) {
    fail(`${relative} 的 canonical 不在站点域名下：${canonical}`);
  }
  if (!sitemapUrls.has(canonical)) {
    fail(`${relative} 的 canonical 未出现在 sitemap.xml：${canonical}`);
  }
}

console.log(`Generated data, ${htmlFiles.length} HTML pages, sitemap, robots, and SEO metadata look ready.`);

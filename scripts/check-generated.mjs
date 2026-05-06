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

const HANDCRAFTED_DIR = path.resolve("content/handcrafted");
const BUILD_SCRIPT_PATH = path.resolve("scripts/build-site.mjs");

function pageOutputPath(pathname) {
  if (!pathname || pathname === "/") {
    return path.join(DIST_DIR, "index.html");
  }

  return path.join(DIST_DIR, pathname.replace(/^\/+/, ""), "index.html");
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      repeated.add(value);
    }
    seen.add(value);
  }
  return Array.from(repeated).sort();
}

function parseHandcraftedPageMap(source) {
  const entryPattern = /\["([^"]+)", path\.resolve\("content\/handcrafted\/([^"]+)"\)\]/g;
  return Array.from(source.matchAll(entryPattern), (match) => ({
    pathname: match[1],
    fileName: match[2],
    filePath: path.resolve("content/handcrafted", match[2])
  }));
}

async function assertHandcraftedWiring() {
  const buildScript = await fs.readFile(BUILD_SCRIPT_PATH, "utf8");
  const mapEntries = parseHandcraftedPageMap(buildScript);
  const handcraftedFiles = (await fs.readdir(HANDCRAFTED_DIR))
    .filter((fileName) => fileName.endsWith(".zh.html"))
    .sort();

  const mappedFileNames = new Set(mapEntries.map((entry) => entry.fileName));
  const existingFileNames = new Set(handcraftedFiles);
  const missingMapEntries = handcraftedFiles.filter((fileName) => !mappedFileNames.has(fileName));
  const missingFiles = mapEntries
    .filter((entry) => !existingFileNames.has(entry.fileName))
    .map((entry) => `${entry.pathname} -> ${entry.fileName}`);
  const duplicateRoutes = duplicates(mapEntries.map((entry) => entry.pathname));
  const duplicateFiles = duplicates(mapEntries.map((entry) => entry.fileName));

  const errors = [];
  if (!mapEntries.length) {
    errors.push("No handcraftedPageMap entries were found in scripts/build-site.mjs.");
  }
  if (missingMapEntries.length) {
    errors.push(`Handcrafted files missing from handcraftedPageMap:\n${missingMapEntries.map((fileName) => `- ${fileName}`).join("\n")}`);
  }
  if (missingFiles.length) {
    errors.push(`handcraftedPageMap points to missing files:\n${missingFiles.map((item) => `- ${item}`).join("\n")}`);
  }
  if (duplicateRoutes.length) {
    errors.push(`Duplicate handcrafted routes:\n${duplicateRoutes.map((route) => `- ${route}`).join("\n")}`);
  }
  if (duplicateFiles.length) {
    errors.push(`Duplicate handcrafted files in handcraftedPageMap:\n${duplicateFiles.map((fileName) => `- ${fileName}`).join("\n")}`);
  }

  if (errors.length) {
    throw new Error(errors.join("\n\n"));
  }

  const siteData = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
  const sourcePathnames = new Set((siteData.pages || []).map((page) => page.pathname));
  const renderedErrors = [];
  for (const entry of mapEntries) {
    if (!sourcePathnames.has(entry.pathname)) {
      continue;
    }

    const distPath = pageOutputPath(entry.pathname);
    const renderedHtml = await fs.readFile(distPath, "utf8").catch(() => null);

    if (!renderedHtml) {
      renderedErrors.push(`${entry.pathname} did not render to ${path.relative(process.cwd(), distPath)}.`);
      continue;
    }

    const expectedMarker = `<!-- handcrafted-source:${entry.fileName} -->`;
    if (!renderedHtml.includes(expectedMarker)) {
      renderedErrors.push(`${entry.pathname} rendered without ${entry.fileName}; it may have fallen back to generated content.`);
    }
  }

  if (renderedErrors.length) {
    throw new Error(`Handcrafted rendered output check failed:\n${renderedErrors.map((item) => `- ${item}`).join("\n")}`);
  }
}

await fs.access(DATA_PATH);
await fs.access(path.join(DIST_DIR, "index.html"));
await assertHandcraftedWiring();

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

console.log(`Generated data, ${htmlFiles.length} HTML pages, sitemap, robots, SEO metadata, and handcrafted wiring look ready.`);

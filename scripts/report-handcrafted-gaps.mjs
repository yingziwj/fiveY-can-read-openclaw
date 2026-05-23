import fs from "node:fs/promises";
import { DATA_PATH } from "./site-lib.mjs";
import { handcraftedPathnames } from "./handcrafted-pages.mjs";

const DEFAULT_LIMIT = 20;

const PRIORITY_RULES = [
  { label: "插件", pattern: /\b(plugin|plugins|sdk|extension|extensions|capabilit)/i, weight: 35 },
  { label: "Codex", pattern: /\b(codex|harness)\b/i, weight: 32 },
  { label: "多代理", pattern: /\b(multi-agent|subagents?|agents?|delegate|parallel|specialist|runtime|runtimes)\b/i, weight: 24 },
  { label: "迁移", pattern: /\b(migration|migrating|migrate|modernization)\b/i, weight: 22 },
  { label: "测试", pattern: /\b(test|testing|qa|e2e|validation|benchmark)\b/i, weight: 20 }
];

const SECTION_WEIGHTS = new Map([
  ["plugins", 18],
  ["tools", 14],
  ["concepts", 10],
  ["cli", 8],
  ["install", 7],
  ["help", 6],
  ["gateway", 5],
  ["reference", 4]
]);

function parseLimit(argv) {
  const limitIndex = argv.indexOf("--limit");
  const rawValue = argv
    .find((arg) => arg.startsWith("--limit="))
    ?.split("=")[1] || (limitIndex >= 0 ? argv[limitIndex + 1] : "");
  const limit = Number.parseInt(rawValue, 10);
  return Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT;
}

function textForPriority(page) {
  const sectionTitles = (page.sections || []).map((section) => section.title).join(" ");
  return [
    page.pathname,
    page.slug,
    page.title,
    page.description,
    page.sectionKey,
    sectionTitles
  ].filter(Boolean).join(" ");
}

function scorePage(page) {
  const text = textForPriority(page);
  const matched = [];
  let score = SECTION_WEIGHTS.get(page.sectionKey) || 0;

  for (const rule of PRIORITY_RULES) {
    if (rule.pattern.test(text)) {
      matched.push(rule.label);
      score += rule.weight;
    }
  }

  if (page.pathname === `/${page.sectionKey}/index`) {
    score += 5;
  }

  return {
    ...page,
    priorityScore: score,
    priority: score >= 35 ? "high" : score >= 20 ? "medium" : "normal",
    matched
  };
}

function groupBySection(pages) {
  const grouped = new Map();
  for (const page of pages) {
    const key = page.sectionKey || "other";
    if (!grouped.has(key)) {
      grouped.set(key, {
        label: page.sectionLabel || key,
        pages: []
      });
    }
    grouped.get(key).pages.push(page);
  }
  return grouped;
}

function formatPage(page, withPriority = false) {
  const suffix = withPriority
    ? ` [${page.priority}, ${page.priorityScore}${page.matched.length ? `, ${page.matched.join("/")}` : ""}]`
    : "";
  return `- ${page.pathname} - ${page.title}${suffix}`;
}

await fs.access(DATA_PATH);

const limit = parseLimit(process.argv.slice(2));
const siteData = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
const pages = siteData.pages || [];
const generatedOnlyPages = pages.filter((page) => !handcraftedPathnames.has(page.pathname));
const scoredPages = generatedOnlyPages
  .map(scorePage)
  .sort((a, b) => b.priorityScore - a.priorityScore || a.pathname.localeCompare(b.pathname));
const candidatePages = scoredPages.slice(0, limit);
const generatedBySection = groupBySection(generatedOnlyPages);
const candidatesBySection = groupBySection(candidatePages);

console.log(`Handcrafted coverage: ${pages.length - generatedOnlyPages.length}/${pages.length} pages.`);
console.log(`Still generated: ${generatedOnlyPages.length} pages in ${generatedBySection.size} sections.`);
console.log("");
console.log(`Top handcrafted candidates (limit ${limit}):`);
for (const [sectionKey, group] of candidatesBySection) {
  console.log(`\n[${sectionKey}] ${group.label}`);
  for (const page of group.pages) {
    console.log(formatPage(page, true));
  }
}

console.log("\nAll still-generated pages by section:");
for (const [sectionKey, group] of generatedBySection) {
  console.log(`\n[${sectionKey}] ${group.label} (${group.pages.length})`);
  for (const page of group.pages) {
    console.log(formatPage(page));
  }
}

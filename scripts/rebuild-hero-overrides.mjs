import fs from "node:fs/promises";
import path from "node:path";
import { DATA_PATH, ensureDir, readJson, writeJson } from "./site-lib.mjs";

const siteData = await readJson(DATA_PATH);
const heroDir = path.resolve("generated", "deepseek-heroes");
await ensureDir(heroDir);

for (const page of siteData.pages) {
  const outputPath = path.join(heroDir, `${page.slug.replace(/\//g, "__")}.json`);
  try {
    await fs.access(outputPath);
  } catch {
    const firstSection = page.sections?.[0]?.title || "";
    const firstParagraph = page.sections
      ?.flatMap((section) => section.blocks || [])
      .find((block) => block.type === "paragraph")?.text || "";
    await writeJson(outputPath, {
      generatedAt: new Date().toISOString(),
      pathname: page.pathname,
      title: page.title,
      model: "fallback",
      result: {
        heroTitle: page.title,
        heroSummary: [page.description, firstSection, firstParagraph]
          .filter(Boolean)
          .join(" ")
          .slice(0, 220)
      }
    });
  }
}

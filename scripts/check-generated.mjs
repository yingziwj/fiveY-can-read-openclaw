import fs from "node:fs/promises";
import path from "node:path";
import { DATA_PATH, DIST_DIR } from "./site-lib.mjs";

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
    const [handcraftedHtml, renderedHtml] = await Promise.all([
      fs.readFile(entry.filePath, "utf8"),
      fs.readFile(distPath, "utf8").catch(() => null)
    ]);

    if (!renderedHtml) {
      renderedErrors.push(`${entry.pathname} did not render to ${path.relative(process.cwd(), distPath)}.`);
      continue;
    }

    const expectedHtml = handcraftedHtml.trim();
    if (expectedHtml && !renderedHtml.includes(expectedHtml)) {
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

console.log("Generated data, dist output, and handcrafted wiring are valid.");

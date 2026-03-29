import fs from "node:fs/promises";
import path from "node:path";
import {
  DATA_PATH,
  DOCS_SOURCE_URL,
  RAW_DOC_PATH,
  buildSiteData,
  ensureDir,
  writeJson
} from "./site-lib.mjs";

const response = await fetch(DOCS_SOURCE_URL, {
  headers: {
    "user-agent": "fivey-can-read-openclaw-sync/0.1"
  }
});

if (!response.ok) {
  throw new Error(`Failed to fetch ${DOCS_SOURCE_URL}: ${response.status} ${response.statusText}`);
}

const raw = await response.text();
const siteData = buildSiteData(raw);

await ensureDir(path.dirname(RAW_DOC_PATH));
await fs.writeFile(RAW_DOC_PATH, raw, "utf8");
await writeJson(DATA_PATH, siteData);

console.log(`Synced ${siteData.pageCount} pages across ${siteData.sectionCount} sections.`);
console.log(`Saved raw source to ${RAW_DOC_PATH}`);
console.log(`Saved structured data to ${DATA_PATH}`);

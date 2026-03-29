import fs from "node:fs/promises";
import path from "node:path";
import { DATA_PATH, DIST_DIR } from "./site-lib.mjs";

await fs.access(DATA_PATH);
await fs.access(path.join(DIST_DIR, "index.html"));

console.log("Generated data and dist output exist.");

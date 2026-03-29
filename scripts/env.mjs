import fs from "node:fs/promises";
import path from "node:path";

export async function loadEnvFile(fileName = ".env.local") {
  const filePath = path.resolve(fileName);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
    return filePath;
  } catch {
    return null;
  }
}

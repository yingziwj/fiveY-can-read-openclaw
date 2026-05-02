import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DIST_DIR } from "./site-lib.mjs";

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || detectPreviewHost();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://localhost");
    let filePath = path.join(DIST_DIR, url.pathname);

    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
    } catch {
      if (!path.extname(filePath)) {
        filePath = path.join(filePath, "index.html");
      }
    }

    const payload = await fs.readFile(filePath);
    const extension = path.extname(filePath);
    response.writeHead(200, {
      "content-type": contentTypes[extension] || "application/octet-stream"
    });
    response.end(payload);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`Preview server running at http://${host}:${port}`);
});

function detectPreviewHost() {
  const interfaces = os.networkInterfaces();
  const preferredNames = ["en0", "en1", "Ethernet", "Wi-Fi"];

  for (const name of preferredNames) {
    const address = firstUsableIpv4(interfaces[name]);
    if (address) return address;
  }

  for (const entries of Object.values(interfaces)) {
    const address = firstUsableIpv4(entries);
    if (address) return address;
  }

  return "127.0.0.1";
}

function firstUsableIpv4(entries = []) {
  for (const entry of entries) {
    if (entry && entry.family === "IPv4" && !entry.internal) {
      return entry.address;
    }
  }
  return "";
}

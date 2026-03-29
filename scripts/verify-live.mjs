const siteUrl = process.env.SITE_URL || "https://fivey-can-read-openclaw.pages.dev";

const checks = [
  { path: "/", expect: "Fivey Can Read OpenClaw" },
  { path: "/theme-icons/", expect: "Theme Icons" },
  { path: "/tools/", expect: "Tools and Plugins" },
  { path: "/sitemap.xml", expect: "<urlset" },
  { path: "/robots.txt", expect: "Sitemap:" },
  { path: "/ads.txt", expect: "google.com" },
  { path: "/og-image.svg", expect: "<svg" }
];

const failures = [];

for (const check of checks) {
  const url = new URL(check.path, siteUrl).toString();
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "fivey-can-read-openclaw-verify/0.1"
      }
    });

    const body = await response.text();
    const ok = response.ok && body.includes(check.expect);
    console.log(`${ok ? "PASS" : "FAIL"} ${url} -> ${response.status}`);

    if (!ok) {
      failures.push({ url, status: response.status, expect: check.expect });
    }
  } catch (error) {
    console.log(`FAIL ${url} -> ${error.message}`);
    failures.push({ url, status: "network_error", expect: check.expect });
  }
}

if (failures.length) {
  console.error("\nLive verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure.url} expected to contain: ${failure.expect}`);
  }
  process.exit(1);
}

console.log("\nLive verification passed.");

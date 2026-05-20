const siteUrl = process.env.SITE_URL || "https://fivey-can-read-openclaw.pages.dev";
const siteOrigin = new URL(siteUrl).origin;
const adsenseClientId = "ca-pub-3833673520933536";
const adsTxtRecord = "google.com, pub-3833673520933536, DIRECT, f08c47fec0942fa0";

function absoluteUrl(pathname = "/") {
  return new URL(pathname, siteOrigin).toString();
}

const checks = [
  {
    path: "/",
    expect: [
      "Fivey Can Read OpenClaw",
      `<link rel="canonical" href="${siteOrigin}">`,
      `<meta name="google-adsense-account" content="${adsenseClientId}">`,
      `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`,
      `<meta property="og:image" content="${absoluteUrl("/og-image.svg")}">`,
      "我们把 OpenClaw 官方文档变成了适合 5 岁小朋友"
    ]
  },
  {
    path: "/theme-icons/",
    expect: [
      "Theme Icons",
      `<link rel="canonical" href="${absoluteUrl("/theme-icons/")}">`,
      "气球故事书"
    ]
  },
  {
    path: "/tools/",
    expect: [
      "Agent 的双手：工具、技能与插件",
      `<link rel="canonical" href="${absoluteUrl("/tools/")}">`,
      "Agent 除了生成文本之外的一切行为"
    ]
  },
  {
    path: "/sitemap.xml",
    expect: ["<urlset", `<loc>${absoluteUrl("/tools/")}</loc>`]
  },
  { path: "/robots.txt", expect: ["Sitemap:", "/sitemap.xml"] },
  { path: "/ads.txt", expect: [adsTxtRecord] },
  { path: "/og-image.svg", expect: ["<svg", "OpenClaw 绘本版文档站"] }
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
    const missing = check.expect.filter((expected) => !body.includes(expected));
    const ok = response.ok && missing.length === 0;
    console.log(`${ok ? "PASS" : "FAIL"} ${url} -> ${response.status}`);

    if (!ok) {
      failures.push({ url, status: response.status, missing });
    }
  } catch (error) {
    console.log(`FAIL ${url} -> ${error.message}`);
    failures.push({ url, status: "network_error", missing: check.expect });
  }
}

if (failures.length) {
  console.error("\nLive verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure.url} missing: ${failure.missing.join(", ")}`);
  }
  process.exit(1);
}

console.log("\nLive verification passed.");

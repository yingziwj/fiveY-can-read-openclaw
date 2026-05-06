import path from "node:path";
import { loadEnvFile } from "./env.mjs";
import {
  DATA_PATH,
  ensureDir,
  normalizeWhitespace,
  readJson,
  stripMarkdown,
  writeJson
} from "./site-lib.mjs";

await loadEnvFile();

const apiKey = process.env.DEEPSEEK_API_KEY;
const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1").replace(/\/+$/, "");
const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

if (!apiKey) {
  throw new Error("Missing DEEPSEEK_API_KEY. Put it in .env.local or the environment.");
}

const siteData = await readJson(DATA_PATH);
const outputDir = path.resolve("generated", "deepseek-heroes");
await ensureDir(outputDir);

const args = process.argv.slice(2);
const allMode = args.includes("--all");
const refreshMode = args.includes("--refresh");
const requestedPaths = args.filter((value) => !value.startsWith("--"));
const concurrency = Number(process.env.DEEPSEEK_CONCURRENCY || 4);

const targetPages = (
  allMode || !requestedPaths.length
    ? siteData.pages
    : requestedPaths
        .map((pathname) => siteData.pages.find((page) => page.pathname === pathname))
        .filter(Boolean)
).filter(Boolean);

if (!targetPages.length) {
  throw new Error("No matching pages found for DeepSeek hero generation.");
}

function compactBlock(block) {
  if (block.type === "paragraph") {
    return { type: "paragraph", text: normalizeWhitespace(block.text) };
  }
  if (block.type === "list") {
    return { type: "list", items: block.items.map((item) => normalizeWhitespace(item)) };
  }
  if (block.type === "code") {
    return {
      type: "code",
      language: block.language,
      code: block.code.split("\n").slice(0, 16).join("\n")
    };
  }
  return block;
}

function heroPrompt(page) {
  const source = {
    title: page.title,
    pathname: page.pathname,
    sectionKey: page.sectionKey,
    description: page.description,
    sections: page.sections.slice(0, 5).map((section) => ({
      title: section.title,
      blocks: section.blocks.slice(0, 6).map(compactBlock)
    }))
  };

  return `
你是一个非常会写“中文技术导读”的编辑。

你的任务不是总结整页文档，而是专门为这一页写“页面最上方那块导读”。

这块导读必须解决 3 件事：
1. 这页到底在讲什么，不要空话。
2. 读这页的人最该先看哪件事。
3. 这页最容易搞错、最值得注意的点是什么。

严格要求：
1. 输出中文。
2. 不要写“像讲故事一样读”“这一页像一本小绘本”“先别急着背术语”这种空话。
3. 不要复述标题，不要把标题换个说法再说一遍。
4. 一定要结合页面真实内容来写，要让人一眼看懂“这一页到底值不值得点开”。
5. 标题要短、准、像真正的人写的页面大标题，不要假大空。
6. 导读正文写 2 句到 3 句，每句都要有信息量，像编辑写的开场白，不像机器摘要。
7. 如果这页是命令、配置、安装、接入、provider、channel、tool 之类内容，要明确点出“要填什么、要接哪扇门、最容易错哪里”。
8. 如果这页是概念页，要明确点出“这个概念在系统里管什么、为什么会影响后面的行为”。
9. 如果这页是参考页或帮助页，要明确点出“这页适合什么时候回来查”。
10. 只输出 JSON，不要 Markdown，不要代码块。
11. 禁止使用这些句式开头：“这页详细说明”“这页介绍”“这页主要讲”“这一页讲的是”。
12. 第一要义是具体，不要把 3 个要求硬写成 3 个模板句。
13. 允许直接点出真实动作，比如“先拿 token”“先看优先级顺序”“这里是在分清谁负责配对，谁负责放行群消息”。
14. 如果官方内容本身很短，就把重点写得更直白，不要为了凑句子变空。

严格输出：
{
  "heroTitle": "一句真正有信息量的中文标题",
  "heroSummary": "2到3句中文导读，每句有内容，不说空话"
}

下面是这一页官方内容的结构化摘录：
${JSON.stringify(source, null, 2)}
`.trim();
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callDeepSeek(prompt) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(90_000),
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "你是很会写技术导语的中文编辑。你写的是页面开场白，不是摘要，不许套模板，不许空话，要让读者一眼看懂这页解决什么事。"
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API failed: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek API returned no content.");
  }

  return JSON.parse(content);
}

async function callDeepSeekWithRetry(prompt, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await callDeepSeek(prompt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await sleep(1200 * attempt);
    }
  }
  throw lastError;
}

async function generateHero(page) {
  const outputPath = path.join(outputDir, `${page.slug.replace(/\//g, "__")}.json`);
  if (!refreshMode) {
    try {
      await readJson(outputPath);
      console.log(`Skipped existing hero for ${page.pathname}`);
      return;
    } catch {}
  }

  console.log(`Generating hero for ${page.pathname}`);
  const result = await callDeepSeekWithRetry(heroPrompt(page));
  await writeJson(outputPath, {
    generatedAt: new Date().toISOString(),
    pathname: page.pathname,
    title: page.title,
    model,
    result
  });
  console.log(`Generated hero for ${page.pathname}`);
}

for (let index = 0; index < targetPages.length; index += concurrency) {
  const batch = targetPages.slice(index, index + concurrency);
  await Promise.all(batch.map((page) => generateHero(page)));
}

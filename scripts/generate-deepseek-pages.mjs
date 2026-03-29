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
const outputDir = path.resolve("generated", "deepseek-pages");
await ensureDir(outputDir);

const requestedPaths = process.argv.slice(2);
const defaultTargets = [
  "/tools/index",
  "/tools/exec",
  "/tools/browser",
  "/tools/skills",
  "/channels/index",
  "/channels/telegram",
  "/start/getting-started",
  "/start/openclaw",
  "/install/index",
  "/install/docker",
  "/plugins/building-plugins",
  "/providers/openai"
];

const targetPaths = requestedPaths.length ? requestedPaths : defaultTargets;
const targetPages = targetPaths
  .map((pathname) => siteData.pages.find((page) => page.pathname === pathname))
  .filter(Boolean);

if (!targetPages.length) {
  throw new Error("No matching pages found for DeepSeek generation.");
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
      code: block.code.split("\n").slice(0, 24).join("\n")
    };
  }
  return block;
}

function pagePrompt(page) {
  const source = {
    title: page.title,
    pathname: page.pathname,
    description: page.description,
    sections: page.sections.map((section) => ({
      title: section.title,
      blocks: section.blocks.slice(0, 8).map(compactBlock)
    }))
  };

  return `
你是一个擅长把技术文档解释成“更容易读下去的中文内容”的编辑，不是幼儿园老师，不要卖萌，不要复述需求。

你的任务：
把 OpenClaw 官方英文文档的一页，改写成“成年人也愿意继续看下去”的中文解读版。

要求：
1. 输出必须是中文。
2. 风格要像在给聪明但第一次接触这个系统的人讲清楚，不是逐句翻译。
3. 可以借用“讲故事”“打比方”的方式，但不要幼稚，不要一味重复“小朋友”。
4. 重点是解释：这页在解决什么问题、为什么重要、读者真正要带走什么、命令/配置/代码应该怎么理解。
5. 对代码和命令要解释“这一段在干嘛”“关键字段是什么意思”“什么时候要这么写”。
6. 不要照搬原文句子。要做真正解读。
7. 不要输出 Markdown，不要输出代码块围栏。
8. 严格输出 JSON，结构如下：
{
  "heroTitle": "页面主标题的中文解读标题",
  "heroSummary": "2-4句的总导读",
  "sections": [
    {
      "title": "这一节的中文标题",
      "summary": "先讲这节在讲什么",
      "why": "为什么这节值得看",
      "points": ["3到6条具体解读，每条一句完整中文"],
      "codeNotes": ["如果这一节有代码/命令，就写2到5条解释；没有就给空数组"],
      "takeaway": "一句收束"
    }
  ]
}

下面是这页官方内容的结构化摘录：
${JSON.stringify(source, null, 2)}
`.trim();
}

async function callDeepSeek(prompt) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "你是严谨的中文技术编辑，擅长把英文技术文档改写成真正有阅读体验的中文解读。"
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

for (const page of targetPages) {
  const prompt = pagePrompt(page);
  const result = await callDeepSeek(prompt);
  const outputPath = path.join(outputDir, `${page.slug.replace(/\//g, "__")}.json`);
  await writeJson(outputPath, {
    generatedAt: new Date().toISOString(),
    pathname: page.pathname,
    title: page.title,
    model,
    result
  });
  console.log(`Generated DeepSeek explanation for ${page.pathname}`);
}

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

const args = process.argv.slice(2);
const allMode = args.includes("--all");
const refreshMode = args.includes("--refresh");
const requestedPaths = args.filter((value) => !value.startsWith("--"));
const handcraftedPathnames = new Set([
  "/tools/index",
  "/channels/index",
  "/channels/telegram"
]);
const concurrency = Number(process.env.DEEPSEEK_CONCURRENCY || 4);
const skipPathnames = new Set(
  (process.env.DEEPSEEK_SKIP_PATHS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

const targetPages = (
  allMode || !requestedPaths.length
    ? siteData.pages.filter((page) => !handcraftedPathnames.has(page.pathname))
    : requestedPaths
        .map((pathname) => siteData.pages.find((page) => page.pathname === pathname))
        .filter(Boolean)
)
  .filter(Boolean)
  .filter((page) => !skipPathnames.has(page.pathname))
  .sort((left, right) => {
    const leftWeight = left.sections.reduce((count, section) => count + section.blocks.length, 0);
    const rightWeight = right.sections.reduce((count, section) => count + section.blocks.length, 0);
    return leftWeight - rightWeight;
  });

if (!targetPages.length) {
  throw new Error("No matching pages found for DeepSeek generation.");
}

function compactBlock(block) {
  if (block.type === "paragraph") {
    return { type: "paragraph", text: normalizeWhitespace(block.text).slice(0, 420) };
  }
  if (block.type === "list") {
    return { type: "list", items: block.items.slice(0, 6).map((item) => normalizeWhitespace(item).slice(0, 180)) };
  }
  if (block.type === "code") {
    return {
      type: "code",
      language: block.language,
      code: block.code.split("\n").slice(0, 12).join("\n")
    };
  }
  return block;
}

function pickSections(sections = []) {
  if (sections.length <= 12) {
    return sections;
  }

  const head = sections.slice(0, 8);
  const tail = sections.slice(-4);
  return [...head, ...tail];
}

function pagePrompt(page) {
  const source = {
    title: page.title,
    pathname: page.pathname,
    description: page.description,
    sections: pickSections(page.sections).map((section) => ({
      title: section.title,
      blocks: section.blocks.slice(0, 4).map(compactBlock)
    }))
  };

  return `
你是一个会讲场景、会讲动作、会讲画面的中文作者。你能把技术文档讲得像有人在桌边拿着零件、门牌、钥匙、地图给人慢慢解释，但你绝不能把事实讲错。

你的任务：
把 OpenClaw 官方英文文档的一页，改写成“5岁小孩也能听懂、成年人也愿意继续看下去”的中文解读版。

要求：
1. 输出必须是中文。
2. 要像在讲故事、讲画面、讲动作。让读者能看见“谁在开门、谁在递钥匙、谁在看守、谁在传消息”。
3. 可以把读者当第一次接触这套系统的人来讲，但事实必须准确，不能瞎编。
4. 严禁空话和套话，不要写“本节介绍”“核心机制”“完整指南”“配置逻辑”“在这一过程中”“用户需要”这种硬邦邦句式。
5. 多用贴身比喻，比如门、钥匙、门牌、门卫、地图、轨道、工具箱、前台、后门，但比喻必须贴原文，不准乱飘。
6. 每句话尽量短。少下定义，多讲“眼前会发生什么”“这一步像在干什么”“写错会摔在哪里”。
7. 对代码、命令、配置要写出动作感：执行以后现场会亮起什么、连上什么、拦住什么、放行什么。
8. 不要逐句翻译，不要照抄原文，也不要把一长串支持列表原样抄出来。
9. 不要输出 Markdown，不要输出代码块围栏。
10. 可以少量使用 emoji，但只出现在标题或小标签里，不要乱撒。
11. 严格输出 JSON，结构如下：
{
  "heroTitle": "短一点、好懂一点、像海报标题的中文标题",
  "heroSummary": "2-3句总导读，短句，顺口",
  "sections": [
    {
      "title": "短一点、像卡片标题的中文标题",
      "summary": "1到2句，先把这节说成人能马上听懂的话",
      "why": "1句，告诉读者为什么值得看",
      "points": ["3到5条短句，每条都具体、好懂、带画面感"],
      "codeNotes": ["如果这一节有代码/命令，就写2到5条，像在讲这段命令在现场做什么；没有就给空数组"],
      "takeaway": "1句短短的、最好记的话"
    }
  ]
}

额外要求：
- 避免“首先、其次、此外、综上所述”。
- 避免“该功能、此机制、该配置项、用户可通过、用于实现”。
- 避免把每段都写成一个模子，不要每节都像同一份模板复制出来。
- heroTitle 不要总是“XX 指南”“XX 说明”“XX 总览”，要像真正有人在给这一页起名字。
- heroSummary 要先把门开开，不要一上来就总结。
- 如果文档里有一长串支持列表，要帮读者分组理解，不要只是重复名单。
- 如果文档里有命令，要解释命令执行后你眼前会发生什么。
- 如果文档里有配置，要解释这个配置是在“放行、拦人、选路、开门、关门”里的哪一种。

下面是这页官方内容的结构化摘录：
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

async function generatePage(page) {
  const outputPath = path.join(outputDir, `${page.slug.replace(/\//g, "__")}.json`);
  if (!refreshMode) {
    try {
      await readJson(outputPath);
      console.log(`Skipped existing explanation for ${page.pathname}`);
      return;
    } catch {}
  }

  console.log(`Generating DeepSeek explanation for ${page.pathname}`);
  const prompt = pagePrompt(page);
  const result = await callDeepSeekWithRetry(prompt);
  await writeJson(outputPath, {
    generatedAt: new Date().toISOString(),
    pathname: page.pathname,
    title: page.title,
    model,
    result
  });
  console.log(`Generated DeepSeek explanation for ${page.pathname}`);
}

for (let index = 0; index < targetPages.length; index += concurrency) {
  const batch = targetPages.slice(index, index + concurrency);
  await Promise.all(batch.map((page) => generatePage(page)));
}

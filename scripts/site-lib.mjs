import fs from "node:fs/promises";
import path from "node:path";

export const SITE_NAME = "Fivey Can Read OpenClaw";
export const SITE_URL = "https://fivey-can-read-openclaw.pages.dev";
export const DOCS_SOURCE_URL = "https://docs.openclaw.ai/llms-full.txt";
export const GENERATED_DIR = path.resolve("generated");
export const DIST_DIR = path.resolve("dist");
export const RAW_DOC_PATH = path.join(GENERATED_DIR, "raw", "llms-full.txt");
export const DATA_PATH = path.join(GENERATED_DIR, "site-data.json");

export async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

export function slugFromPathname(pathname) {
  if (!pathname || pathname === "/") {
    return "index";
  }

  return pathname.replace(/^\/+|\/+$/g, "");
}

export function labelFromSegment(segment) {
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeWhitespace(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

export function stripMarkdown(value = "") {
  return normalizeWhitespace(
    value
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/^#+\s+/gm, "")
      .replace(/^[*-]\s+/gm, "")
      .replace(/\|/g, " ")
  );
}

export function toSentence(value = "", fallback = "") {
  const text = normalizeWhitespace(value);
  if (!text) return fallback;
  return /[。！？.!?]$/.test(text) ? text : `${text}。`;
}

export function excerpt(value = "", maxLength = 180) {
  const text = stripMarkdown(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

export function formatDate(isoString) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Shanghai"
  }).format(new Date(isoString));
}

const TERM_MAP = [
  [/webhook/gi, "小铃铛通知"],
  [/gateway/gi, "门口的小门卫"],
  [/channel/gi, "消息通道"],
  [/plugin/gi, "新本领插件"],
  [/tool/gi, "工具小帮手"],
  [/command/gi, "魔法口令"],
  [/config/gi, "设置说明书"],
  [/server/gi, "大房子服务器"],
  [/client/gi, "来帮忙的小伙伴"],
  [/password/gi, "秘密口令"],
  [/api/gi, "对话接口"],
  [/group/gi, "大家一起的房间"],
  [/message/gi, "小纸条消息"],
  [/agent/gi, "机器人朋友"],
  [/automation/gi, "自动小闹钟"],
  [/stream/gi, "一边说一边送"],
  [/security/gi, "安全守门员"],
  [/model/gi, "聪明脑袋模型"]
];

export function softenTerms(value = "") {
  return TERM_MAP.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), value);
}

export function storyLead(title, description) {
  const softenedTitle = softenTerms(title);
  const softenedDescription = softenTerms(description);
  return toSentence(
    `这一页像一本关于“${softenedTitle}”的小绘本，它先告诉我们这位机器人朋友会做什么，再一步一步解释什么时候该这样做。${softenedDescription ? ` 你可以先把它想成：${softenedDescription}` : ""}`
  );
}

export function storyForParagraph(text) {
  const softened = softenTerms(stripMarkdown(text));
  if (!softened) {
    return "这一小段像旁白，提醒我们现在讲到哪一步了。";
  }

  return toSentence(
    `把它讲给 5 岁小朋友听，就是：先认识这里出现的几个角色和规则，再按顺序照着做。这里最重要的意思是“${excerpt(softened, 120)}”`
  );
}

export function storyForList(items, sectionTitle) {
  const summary = items
    .slice(0, 4)
    .map((item) => excerpt(softenTerms(item), 42))
    .join("、");

  return toSentence(
    `这一组条目像“${sectionTitle || "准备清单"}”的小卡片，告诉我们要准备哪些东西、哪些规则不能漏掉。先记住这几个重点：${summary}`
  );
}

export function storyForCode(code, language) {
  const lines = code.split("\n").map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] || "";
  const lowered = firstLine.toLowerCase();
  let framing = "这段像给机器人看的说明书，告诉它要按什么样子准备东西。";

  if (lowered.startsWith("openclaw ")) {
    framing = "这是一句直接对 OpenClaw 说的话，就像对小助手下达任务。";
  } else if (language === "json" || language === "json5" || firstLine.startsWith("{")) {
    framing = "这段不是故事对白，而是设置卡片，像在给机器人贴名字、地址和规则标签。";
  } else if (language === "bash" || lowered.startsWith("curl ") || lowered.startsWith("npm ")) {
    framing = "这是一串终端魔法口令，像按步骤按下几个按钮，让电脑开始干活。";
  } else if (language === "xml" || language === "html") {
    framing = "这段像在搭一个小房子的骨架，每个标签都在告诉电脑东西要摆在哪里。";
  }

  const steps = lines.slice(0, 3).map((line) => explainCodeLine(line));
  return {
    framing,
    steps
  };
}

export function explainCodeLine(line = "") {
  const cleaned = line.trim();
  if (!cleaned) {
    return "空白这一行像换气，告诉我们下一步要开始了。";
  }

  if (cleaned.startsWith("{") || cleaned.startsWith("}")) {
    return "大括号像把同一组设置抱在一起，说“这些是一家的”。";
  }

  if (cleaned.includes(":")) {
    const [key, ...rest] = cleaned.split(":");
    return `这里在给“${key.replace(/["',]/g, "").trim()}”贴标签，意思是把它设置成“${rest.join(":").replace(/[",]/g, "").trim()}”。`;
  }

  if (cleaned.startsWith("openclaw ")) {
    return `这一句是在直接叫 OpenClaw 做事：“${cleaned}”。你可以把它想成对机器人说的完整命令。`;
  }

  if (cleaned.startsWith("curl ") || cleaned.startsWith("npm ") || cleaned.startsWith("pnpm ")) {
    return `这一句是在终端里按下开始按钮：“${cleaned}”。它会让电脑去请求、安装或构建东西。`;
  }

  if (cleaned.startsWith("<") && cleaned.endsWith(">")) {
    return `这个尖括号标签“${cleaned}”像拼积木时的一块边框，告诉页面结构怎么搭。`;
  }

  return `这一行“${cleaned}”是当前步骤要交给电脑的一小块提示。`;
}

export function detectLanguage(fenceInfo = "") {
  const lang = normalizeWhitespace(fenceInfo).split(/\s+/)[0];
  return lang || "text";
}

export function parseMarkdownSections(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  const sections = [];
  let currentSection = {
    title: "Start Here",
    depth: 2,
    blocks: []
  };
  let paragraphBuffer = [];
  let listBuffer = [];
  let codeBuffer = [];
  let codeLanguage = "text";
  let inCode = false;

  const flushParagraph = () => {
    const text = normalizeWhitespace(paragraphBuffer.join(" "));
    if (text) {
      currentSection.blocks.push({ type: "paragraph", text });
    }
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (listBuffer.length) {
      currentSection.blocks.push({ type: "list", items: [...listBuffer] });
    }
    listBuffer = [];
  };

  const flushCode = () => {
    if (codeBuffer.length) {
      currentSection.blocks.push({
        type: "code",
        language: codeLanguage,
        code: codeBuffer.join("\n")
      });
    }
    codeBuffer = [];
    codeLanguage = "text";
  };

  const pushSection = () => {
    flushParagraph();
    flushList();
    flushCode();

    if (currentSection.blocks.length || currentSection.title !== "Start Here") {
      sections.push(currentSection);
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      flushParagraph();
      flushList();

      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        inCode = true;
        codeLanguage = detectLanguage(line.slice(3));
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    const headingMatch = line.match(/^(##+)\s+(.*)$/);
    if (headingMatch) {
      pushSection();
      currentSection = {
        title: headingMatch[2].trim(),
        depth: headingMatch[1].length,
        blocks: []
      };
      continue;
    }

    const listMatch = line.match(/^\s*[*-]\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      listBuffer.push(listMatch[1].trim());
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  pushSection();

  return sections.filter((section) => section.blocks.length);
}

export function parseLlmsFull(raw) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const pageRegex = /(^|\n)#\s+([^\n]+)\nSource:\s+(https:\/\/docs\.openclaw\.ai[^\n]+)\n([\s\S]*?)(?=\n#\s+[^\n]+\nSource:\s+https:\/\/docs\.openclaw\.ai|\s*$)/g;
  const pages = [];
  let match;
  while ((match = pageRegex.exec(normalized))) {
    const title = match[2].trim();
    const url = match[3].trim();
    const body = match[4].trim();
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname === "/" ? "/" : parsedUrl.pathname.replace(/\/+$/, "");
    const slug = slugFromPathname(pathname);
    const segments = pathname.split("/").filter(Boolean);
    const sectionKey = segments[0] || "home";
    const sectionLabel = segments[0] ? labelFromSegment(segments[0]) : "Home";
    const sections = parseMarkdownSections(body);
    const firstTextBlock =
      sections.flatMap((section) => section.blocks).find((block) => block.type === "paragraph" || block.type === "list") || null;
    const description =
      firstTextBlock?.type === "paragraph"
        ? excerpt(firstTextBlock.text, 180)
        : excerpt(firstTextBlock?.items?.join(" ") || "", 180);

    pages.push({
      title,
      url,
      pathname,
      slug,
      sectionKey,
      sectionLabel,
      segments,
      description,
      sections
    });
  }

  return pages;
}

export function buildNavigation(pages) {
  const sectionMap = new Map();

  for (const page of pages) {
    if (!sectionMap.has(page.sectionKey)) {
      sectionMap.set(page.sectionKey, {
        key: page.sectionKey,
        label: page.sectionLabel,
        pages: []
      });
    }

    sectionMap.get(page.sectionKey).pages.push({
      slug: page.slug,
      pathname: page.pathname,
      title: page.title,
      description: page.description
    });
  }

  return Array.from(sectionMap.values());
}

export function buildSiteData(raw) {
  const pages = parseLlmsFull(raw);
  const navigation = buildNavigation(pages);

  return {
    generatedAt: new Date().toISOString(),
    source: DOCS_SOURCE_URL,
    pageCount: pages.length,
    sectionCount: navigation.length,
    navigation,
    pages
  };
}

export async function writeJson(filePath, payload) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

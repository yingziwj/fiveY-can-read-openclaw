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

const SECTION_TRANSLATIONS = {
  channels: "消息通道",
  concepts: "核心概念",
  index: "首页",
  install: "安装部署",
  plugins: "插件扩展",
  start: "快速开始",
  tools: "工具大全",
  vps: "服务器部署",
  automation: "自动任务",
  platforms: "平台接入",
  prose: "内容写作",
  providers: "模型提供商",
  auth: "认证",
  "auth-credential-semantics": "认证凭证",
  ci: "持续集成",
  cli: "命令行",
  gateway: "网关",
  help: "帮助说明",
  logging: "日志",
  network: "网络",
  nodes: "节点",
  reference: "参考资料",
  security: "安全",
  web: "Web 界面",
  debug: "调试",
  diagnostics: "诊断",
  "date-time": "日期时间",
  pi: "树莓派",
  "pi-dev": "树莓派开发"
};

const EXACT_MENU_TRANSLATIONS = {
  "OpenClaw": "OpenClaw 首页",
  "Tools and Plugins": "工具和插件",
  "Chat Channels": "聊天通道",
  "Gateway Architecture": "网关架构",
  "Agent Runtime": "代理运行时",
  "Agent Loop": "代理循环",
  "Agent Workspace": "代理工作区",
  "Linux Server": "Linux 服务器",
  "Building Plugins": "构建插件",
  "OpenProse": "OpenProse 写作",
  "Android App": "Android 应用",
  "Auth Monitoring": "认证监控",
  "Agent Bootstrapping": "代理启动引导",
  "iMessage": "iMessage 通道",
  "Platforms": "平台总览",
  "Authentication": "身份认证",
  "GLM Models": "GLM 模型",
  "iOS App": "iOS 应用",
  "Linux App": "Linux 应用",
  "macOS App": "macOS 应用",
  "Gateway on macOS": "macOS 上的网关",
  "API Usage and Costs": "API 使用与成本",
  "Credits": "致谢",
  "RPC Adapters": "RPC 适配器",
  "SecretRef Credential Surface": "SecretRef 凭证范围",
  "Bonjour Discovery": "Bonjour 发现",
  "Bridge Protocol": "桥接协议",
  "CLI Backends": "CLI 后端",
  "Discovery and Transports": "发现与传输",
  "Gateway Lock": "网关锁",
  "Default AGENTS.md": "默认 AGENTS.md",
  "Provider Directory": "提供商目录",
  "Model Provider Quickstart": "模型提供商快速开始",
  "Installer Internals": "安装器内部机制",
  "Migration Guide": "迁移指南",
  "Matrix migration": "Matrix 迁移",
  "Plugin SDK Overview": "插件 SDK 概览",
  "Plugin Runtime Helpers": "插件运行时助手",
  "Voice Call Plugin": "语音通话插件",
  "Plugin Internals": "插件内部机制",
  "Plugin Manifest": "插件清单",
  "Plugin Setup and Config": "插件设置与配置",
  "Browser Login": "浏览器登录",
  "Creating Skills": "创建技能",
  "Elevated Mode": "提权模式",
  "Exec Tool": "Exec 工具",
  "CLI Reference": "CLI 参考",
  "Background Exec and Process Tool": "后台 Exec 与进程工具",
  "Configuration Examples": "配置示例",
  "Local Models": "本地模型",
  "Trusted Proxy Auth": "受信代理认证",
  "Logging Overview": "日志概览",
  "General Troubleshooting": "常见故障排查",
  "Pi Integration Architecture": "Pi 集成架构",
  "Release Policy": "发布策略",
  "Device Model Database": "设备型号数据库",
  "Memory configuration reference": "记忆配置参考",
  "Session Management Deep Dive": "会话管理深入讲解",
  "Google Chat": "Google Chat 通道",
  "Microsoft Teams": "Microsoft Teams 通道",
  "Nextcloud Talk": "Nextcloud Talk 通道",
  "Broadcast Groups": "广播群组",
  "Group Messages": "群组消息",
  "Channel Routing": "通道路由",
  "Channel Troubleshooting": "通道故障排查",
  "Channel Location Parsing": "通道位置解析",
  "Browser Troubleshooting": "浏览器故障排查",
  "Code Execution": "代码执行",
  "Brave Search": "Brave 搜索",
  "DuckDuckGo Search": "DuckDuckGo 搜索",
  "Gemini Search": "Gemini 搜索",
  "Grok Search": "Grok 搜索",
  "Kimi Search": "Kimi 搜索",
  "Perplexity Search": "Perplexity 搜索",
  "apply_patch Tool": "apply_patch 工具"
};

const MENU_REPLACEMENTS = [
  ["Tools and Plugins", "工具和插件"],
  ["Getting Started", "快速开始"],
  ["Troubleshooting", "故障排查"],
  ["Configuration", "配置"],
  ["Architecture", "架构"],
  ["Overview", "概览"],
  ["Building", "构建"],
  ["Community", "社区"],
  ["Bundles", "捆绑包"],
  ["Bundle", "捆绑包"],
  ["Entry Points", "入口点"],
  ["Migration", "迁移"],
  ["Experimental", "实验版"],
  ["Release", "发布"],
  ["Quickstart", "快速开始"],
  ["Helpers", "助手"],
  ["Internals", "内部机制"],
  ["Manifest", "清单"],
  ["Setup and Config", "设置与配置"],
  ["Setup", "设置"],
  ["Config", "配置"],
  ["Guide", "指南"],
  ["Dev", "开发"],
  ["Health Checks", "健康检查"],
  ["Permissions", "权限"],
  ["Lifecycle", "生命周期"],
  ["Logging", "日志"],
  ["Remote Control", "远程控制"],
  ["Voice Overlay", "语音浮层"],
  ["Side Questions", "旁支问题"],
  ["Directory", "目录"],
  ["OpenClaw-managed", "OpenClaw 托管"],
  ["Login", "登录"],
  ["Mode", "模式"],
  ["Canvas", "画布"],
  ["Menu Bar", "菜单栏"],
  ["Icon", "图标"],
  ["Reference", "参考"],
  ["Reference", "参考"],
  ["Templates", "模板"],
  ["Template", "模板"],
  ["Testing", "测试"],
  ["Wizard", "向导"],
  ["Dashboard", "控制台"],
  ["Control UI", "控制界面"],
  ["Webchat", "网页聊天"],
  ["Browser", "浏览器"],
  ["Search", "搜索"],
  ["Provider", "提供商"],
  ["Providers", "提供商"],
  ["Channels", "通道"],
  ["Channel", "通道"],
  ["Tools", "工具"],
  ["Tool", "工具"],
  ["Plugins", "插件"],
  ["Plugin", "插件"],
  ["Skills", "技能"],
  ["Skill", "技能"],
  ["Memory", "记忆"],
  ["Messages", "消息"],
  ["Message", "消息"],
  ["Context", "上下文"],
  ["Models", "模型"],
  ["Model", "模型"],
  ["Groups", "群组"],
  ["Group", "群组"],
  ["Pairing", "配对"],
  ["Location Parsing", "位置解析"],
  ["Auth", "认证"],
  ["Security", "安全"],
  ["Formal Verification", "形式化验证"],
  ["Threat Model", "威胁模型"],
  ["Sandbox", "沙箱"],
  ["Approvals", "授权审批"],
  ["Compaction", "压缩整理"],
  ["Markdown Formatting", "Markdown 格式"],
  ["Prompt Caching", "提示缓存"],
  ["Session Management", "会话管理"],
  ["Token Use", "Token 使用"],
  ["Device Models", "设备型号"],
  ["Memory Config", "记忆配置"],
  ["Runtime", "运行时"],
  ["Loop", "循环"],
  ["Workspace", "工作区"],
  ["Server", "服务器"],
  ["Install", "安装"],
  ["Setup", "设置"],
  ["Onboarding", "引导"],
  ["Bootstrapping", "启动引导"],
  ["Docs Directory", "文档目录"]
];

function replaceEnglishPunctuation(value = "") {
  return value.replace(/\s*\(([^)]+)\)/g, "（$1）");
}

function tidyMenuTranslation(value = "") {
  return replaceEnglishPunctuation(value)
    .replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, "$1$2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function translateSectionLabel(sectionKey, fallbackLabel = "") {
  return SECTION_TRANSLATIONS[sectionKey] || fallbackLabel || labelFromSegment(sectionKey);
}

export function translateMenuTitle(title = "", sectionKey = "") {
  if (!title) return "";
  if (EXACT_MENU_TRANSLATIONS[title]) {
    return tidyMenuTranslation(EXACT_MENU_TRANSLATIONS[title]);
  }

  let translated = title;
  for (const [source, target] of MENU_REPLACEMENTS) {
    translated = translated.replaceAll(source, target);
  }

  if (translated === title) {
    const simpleBrand = /^[A-Za-z0-9.+\- ]+$/.test(title) && !title.includes("(");
    if (simpleBrand && sectionKey === "channels") {
      translated = `${title} 通道`;
    } else if (simpleBrand && sectionKey === "install") {
      translated = `${title} 安装`;
    } else if (simpleBrand && sectionKey === "plugins") {
      translated = `${title} 插件`;
    } else if (simpleBrand && sectionKey === "start") {
      translated = `${title} 入门`;
    } else if (simpleBrand && sectionKey === "cli") {
      translated = `${title} 命令`;
    } else if (simpleBrand && sectionKey === "providers") {
      translated = `${title} 提供商`;
    } else if (simpleBrand && sectionKey === "platforms") {
      translated = `${title} 平台`;
    } else if (simpleBrand && sectionKey === "tools") {
      translated = `${title} 工具`;
    }
  }

  return tidyMenuTranslation(translated);
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
        translatedLabel: translateSectionLabel(page.sectionKey, page.sectionLabel),
        pages: []
      });
    }

    sectionMap.get(page.sectionKey).pages.push({
      sectionKey: page.sectionKey,
      slug: page.slug,
      pathname: page.pathname,
      title: page.title,
      translatedTitle: translateMenuTitle(page.title, page.sectionKey),
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

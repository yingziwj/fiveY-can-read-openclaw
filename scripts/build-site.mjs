import fs from "node:fs/promises";
import path from "node:path";
import {
  DATA_PATH,
  DOCS_SOURCE_URL,
  DIST_DIR,
  RAW_DOC_PATH,
  SITE_NAME,
  SITE_URL,
  buildDocHeroText,
  buildDocHeroTitle,
  buildSiteData,
  ensureDir,
  escapeHtml,
  excerpt,
  formatDate,
  normalizeWhitespace,
  readJson,
  stripMarkdown,
  softenTerms,
  storyForCode,
  storyForList,
  storyForParagraph,
  storyLead,
  translateMenuTitle,
  translateSectionLabel,
  writeJson
} from "./site-lib.mjs";

async function loadSiteData() {
  try {
    return await readJson(DATA_PATH);
  } catch {
    const response = await fetch(DOCS_SOURCE_URL, {
      headers: {
        "user-agent": "fivey-can-read-openclaw-build/0.1"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${DOCS_SOURCE_URL}: ${response.status} ${response.statusText}`);
    }

    const raw = await response.text();
    const liveSiteData = buildSiteData(raw);
    await ensureDir(path.dirname(RAW_DOC_PATH));
    await fs.writeFile(RAW_DOC_PATH, raw, "utf8");
    await writeJson(DATA_PATH, liveSiteData);
    return liveSiteData;
  }
}

const siteData = await loadSiteData();
await fs.rm(DIST_DIR, { recursive: true, force: true });
await ensureDir(DIST_DIR);
await ensureDir(path.join(DIST_DIR, "assets"));

const defaultIconSource = path.resolve("assets/icons/concept-balloon-book.svg");
const iconOutput = path.join(DIST_DIR, "favicon.svg");
await fs.copyFile(defaultIconSource, iconOutput);
const selectedTheme = {
  file: "concept-balloon-book.svg",
  name: "Balloon Book",
  chineseName: "气球故事书",
  summary: "最贴近当前海报气质，温柔、可爱、像在读绘本。",
  fit: "适合把站点重点放在“儿童友好解读”和“陪伴式学习”。",
  reason: "它和最初示例海报的糖果色、圆角卡片和绘本感最一致，所以我把它正式定为默认主题。"
};

const iconConcepts = [
  {
    file: "concept-balloon-book.svg",
    name: "Balloon Book",
    chineseName: "气球故事书",
    summary: "最贴近当前海报气质，温柔、可爱、像在读绘本。",
    fit: "适合把站点重点放在“儿童友好解读”和“陪伴式学习”。"
  },
  {
    file: "concept-rocket-toolbox.svg",
    name: "Rocket Toolbox",
    chineseName: "火箭工具箱",
    summary: "更偏产品感和工程感，像带着工具去冒险。",
    fit: "适合强调 OpenClaw 很能干、很会做事、适合全球技术用户。"
  },
  {
    file: "concept-rainbow-claw.svg",
    name: "Rainbow Claw",
    chineseName: "彩虹小爪子",
    summary: "识别度最高，也最像独立品牌标识。",
    fit: "适合后面做品牌延展，比如社媒头像、贴纸、周边。"
  }
];

async function copyDir(source, target) {
  await ensureDir(target);
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

await copyDir(path.resolve("assets/icons"), path.join(DIST_DIR, "assets/icons"));

const handcraftedPageMap = new Map([
  ["/cli/acp", path.resolve("content/handcrafted/cli.acp.zh.html")],
  ["/cli/agent", path.resolve("content/handcrafted/cli.agent.zh.html")],
  ["/cli/agents", path.resolve("content/handcrafted/cli.agents.zh.html")],
  ["/cli/approvals", path.resolve("content/handcrafted/cli.approvals.zh.html")],
  ["/cli/backup", path.resolve("content/handcrafted/cli.backup.zh.html")],
  ["/cli/browser", path.resolve("content/handcrafted/cli.browser.zh.html")],
  ["/cli/channels", path.resolve("content/handcrafted/cli.channels.zh.html")],
  ["/cli/clawbot", path.resolve("content/handcrafted/cli.clawbot.zh.html")],
  ["/cli/completion", path.resolve("content/handcrafted/cli.completion.zh.html")],
  ["/cli/config", path.resolve("content/handcrafted/cli.config.zh.html")],
  ["/cli/configure", path.resolve("content/handcrafted/cli.configure.zh.html")],
  ["/cli/cron", path.resolve("content/handcrafted/cli.cron.zh.html")],
  ["/cli/dashboard", path.resolve("content/handcrafted/cli.dashboard.zh.html")],
  ["/cli/daemon", path.resolve("content/handcrafted/cli.daemon.zh.html")],
  ["/cli/devices", path.resolve("content/handcrafted/cli.devices.zh.html")],
  ["/cli/directory", path.resolve("content/handcrafted/cli.directory.zh.html")],
  ["/cli/dns", path.resolve("content/handcrafted/cli.dns.zh.html")],
  ["/cli/docs", path.resolve("content/handcrafted/cli.docs.zh.html")],
  ["/cli/gateway", path.resolve("content/handcrafted/cli.gateway.zh.html")],
  ["/cli/health", path.resolve("content/handcrafted/cli.health.zh.html")],
  ["/cli/hooks", path.resolve("content/handcrafted/cli.hooks.zh.html")],
  ["/cli/infer", path.resolve("content/handcrafted/cli.infer.zh.html")],
  ["/cli/index", path.resolve("content/handcrafted/cli.index.zh.html")],
  ["/cli/mcp", path.resolve("content/handcrafted/cli.mcp.zh.html")],
  ["/cli/memory", path.resolve("content/handcrafted/cli.memory.zh.html")],
  ["/cli/models", path.resolve("content/handcrafted/cli.models.zh.html")],
  ["/cli/node", path.resolve("content/handcrafted/cli.node.zh.html")],
  ["/cli/nodes", path.resolve("content/handcrafted/cli.nodes.zh.html")],
  ["/cli/plugins", path.resolve("content/handcrafted/cli.plugins.zh.html")],
  ["/cli/onboard", path.resolve("content/handcrafted/cli.onboard.zh.html")],
  ["/cli/message", path.resolve("content/handcrafted/cli.message.zh.html")],
  ["/cli/pairing", path.resolve("content/handcrafted/cli.pairing.zh.html")],
  ["/cli/qr", path.resolve("content/handcrafted/cli.qr.zh.html")],
  ["/cli/reset", path.resolve("content/handcrafted/cli.reset.zh.html")],
  ["/cli/security", path.resolve("content/handcrafted/cli.security.zh.html")],
  ["/cli/secrets", path.resolve("content/handcrafted/cli.secrets.zh.html")],
  ["/cli/status", path.resolve("content/handcrafted/cli.status.zh.html")],
  ["/cli/system", path.resolve("content/handcrafted/cli.system.zh.html")],
  ["/cli/setup", path.resolve("content/handcrafted/cli.setup.zh.html")],
  ["/cli/sessions", path.resolve("content/handcrafted/cli.sessions.zh.html")],
  ["/cli/sandbox", path.resolve("content/handcrafted/cli.sandbox.zh.html")],
  ["/cli/skills", path.resolve("content/handcrafted/cli.skills.zh.html")],
  ["/cli/tui", path.resolve("content/handcrafted/cli.tui.zh.html")],
  ["/cli/update", path.resolve("content/handcrafted/cli.update.zh.html")],
  ["/cli/uninstall", path.resolve("content/handcrafted/cli.uninstall.zh.html")],
  ["/cli/voicecall", path.resolve("content/handcrafted/cli.voicecall.zh.html")],
  ["/cli/webhooks", path.resolve("content/handcrafted/cli.webhooks.zh.html")],
  ["/cli/wiki", path.resolve("content/handcrafted/cli.wiki.zh.html")],
  ["/cli/logs", path.resolve("content/handcrafted/cli.logs.zh.html")],
  ["/cli/doctor", path.resolve("content/handcrafted/cli.doctor.zh.html")],
  ["/start/docs-directory", path.resolve("content/handcrafted/start.docs-directory.zh.html")],
  ["/start/bootstrapping", path.resolve("content/handcrafted/start.bootstrapping.zh.html")],
  ["/start/getting-started", path.resolve("content/handcrafted/start.getting-started.zh.html")],
  ["/start/hubs", path.resolve("content/handcrafted/start.hubs.zh.html")],
  ["/start/lore", path.resolve("content/handcrafted/start.lore.zh.html")],
  ["/start/onboarding", path.resolve("content/handcrafted/start.onboarding.zh.html")],
  ["/start/onboarding-overview", path.resolve("content/handcrafted/start.onboarding-overview.zh.html")],
  ["/start/openclaw", path.resolve("content/handcrafted/start.openclaw.zh.html")],
  ["/start/setup", path.resolve("content/handcrafted/start.setup.zh.html")],
  ["/start/showcase", path.resolve("content/handcrafted/start.showcase.zh.html")],
  ["/start/wizard", path.resolve("content/handcrafted/start.wizard.zh.html")],
  ["/start/wizard-cli-automation", path.resolve("content/handcrafted/start.wizard-cli-automation.zh.html")],
  ["/start/wizard-cli-reference", path.resolve("content/handcrafted/start.wizard-cli-reference.zh.html")],
  ["/install/index", path.resolve("content/handcrafted/install.index.zh.html")],
  ["/install/ansible", path.resolve("content/handcrafted/install.ansible.zh.html")],
  ["/install/azure", path.resolve("content/handcrafted/install.azure.zh.html")],
  ["/install/bun", path.resolve("content/handcrafted/install.bun.zh.html")],
  ["/install/clawdock", path.resolve("content/handcrafted/install.clawdock.zh.html")],
  ["/install/development-channels", path.resolve("content/handcrafted/install.development-channels.zh.html")],
  ["/install/digitalocean", path.resolve("content/handcrafted/install.digitalocean.zh.html")],
  ["/install/docker", path.resolve("content/handcrafted/install.docker.zh.html")],
  ["/install/docker-vm-runtime", path.resolve("content/handcrafted/install.docker-vm-runtime.zh.html")],
  ["/install/exe-dev", path.resolve("content/handcrafted/install.exe-dev.zh.html")],
  ["/install/fly", path.resolve("content/handcrafted/install.fly.zh.html")],
  ["/install/gcp", path.resolve("content/handcrafted/install.gcp.zh.html")],
  ["/install/hetzner", path.resolve("content/handcrafted/install.hetzner.zh.html")],
  ["/install/installer", path.resolve("content/handcrafted/install.installer.zh.html")],
  ["/install/kubernetes", path.resolve("content/handcrafted/install.kubernetes.zh.html")],
  ["/install/macos-vm", path.resolve("content/handcrafted/install.macos-vm.zh.html")],
  ["/install/migrating", path.resolve("content/handcrafted/install.migrating.zh.html")],
  ["/install/migrating-matrix", path.resolve("content/handcrafted/install.migrating-matrix.zh.html")],
  ["/install/nix", path.resolve("content/handcrafted/install.nix.zh.html")],
  ["/install/node", path.resolve("content/handcrafted/install.node.zh.html")],
  ["/install/northflank", path.resolve("content/handcrafted/install.northflank.zh.html")],
  ["/install/oracle", path.resolve("content/handcrafted/install.oracle.zh.html")],
  ["/install/podman", path.resolve("content/handcrafted/install.podman.zh.html")],
  ["/install/railway", path.resolve("content/handcrafted/install.railway.zh.html")],
  ["/install/raspberry-pi", path.resolve("content/handcrafted/install.raspberry-pi.zh.html")],
  ["/install/render", path.resolve("content/handcrafted/install.render.zh.html")],
  ["/install/uninstall", path.resolve("content/handcrafted/install.uninstall.zh.html")],
  ["/install/updating", path.resolve("content/handcrafted/install.updating.zh.html")],
  ["/tools/index", path.resolve("content/handcrafted/tools.index.zh.html")],
  ["/tools/agent-send", path.resolve("content/handcrafted/tools.agent-send.zh.html")],
  ["/tools/apply-patch", path.resolve("content/handcrafted/tools.apply-patch.zh.html")],
  ["/tools/skills", path.resolve("content/handcrafted/tools.skills.zh.html")],
  ["/tools/browser-linux-troubleshooting", path.resolve("content/handcrafted/tools.browser-linux-troubleshooting.zh.html")],
  ["/tools/creating-skills", path.resolve("content/handcrafted/tools.creating-skills.zh.html")],
  ["/tools/image-generation", path.resolve("content/handcrafted/tools.image-generation.zh.html")],
  ["/tools/elevated", path.resolve("content/handcrafted/tools.elevated.zh.html")],
  ["/tools/exec-approvals", path.resolve("content/handcrafted/tools.exec-approvals.zh.html")],
  ["/tools/loop-detection", path.resolve("content/handcrafted/tools.loop-detection.zh.html")],
  ["/tools/media-overview", path.resolve("content/handcrafted/tools.media-overview.zh.html")],
  ["/tools/music-generation", path.resolve("content/handcrafted/tools.music-generation.zh.html")],
  ["/tools/multi-agent-sandbox-tools", path.resolve("content/handcrafted/tools.multi-agent-sandbox-tools.zh.html")],
  ["/tools/ollama-search", path.resolve("content/handcrafted/tools.ollama-search.zh.html")],
  ["/tools/pdf", path.resolve("content/handcrafted/tools.pdf.zh.html")],
  ["/tools/reactions", path.resolve("content/handcrafted/tools.reactions.zh.html")],
  ["/tools/searxng-search", path.resolve("content/handcrafted/tools.searxng-search.zh.html")],
  ["/tools/skills-config", path.resolve("content/handcrafted/tools.skills-config.zh.html")],
  ["/tools/thinking", path.resolve("content/handcrafted/tools.thinking.zh.html")],
  ["/channels/index", path.resolve("content/handcrafted/channels.index.zh.html")],
  ["/channels/bluebubbles", path.resolve("content/handcrafted/channels.bluebubbles.zh.html")],
  ["/channels/broadcast-groups", path.resolve("content/handcrafted/channels.broadcast-groups.zh.html")],
  ["/channels/channel-routing", path.resolve("content/handcrafted/channels.channel-routing.zh.html")],
  ["/channels/discord", path.resolve("content/handcrafted/channels.discord.zh.html")],
  ["/channels/feishu", path.resolve("content/handcrafted/channels.feishu.zh.html")],
  ["/channels/googlechat", path.resolve("content/handcrafted/channels.googlechat.zh.html")],
  ["/channels/group-messages", path.resolve("content/handcrafted/channels.group-messages.zh.html")],
  ["/channels/groups", path.resolve("content/handcrafted/channels.groups.zh.html")],
  ["/channels/imessage", path.resolve("content/handcrafted/channels.imessage.zh.html")],
  ["/channels/irc", path.resolve("content/handcrafted/channels.irc.zh.html")],
  ["/channels/line", path.resolve("content/handcrafted/channels.line.zh.html")],
  ["/channels/location", path.resolve("content/handcrafted/channels.location.zh.html")],
  ["/channels/matrix", path.resolve("content/handcrafted/channels.matrix.zh.html")],
  ["/channels/mattermost", path.resolve("content/handcrafted/channels.mattermost.zh.html")],
  ["/channels/msteams", path.resolve("content/handcrafted/channels.msteams.zh.html")],
  ["/channels/nextcloud-talk", path.resolve("content/handcrafted/channels.nextcloud-talk.zh.html")],
  ["/channels/nostr", path.resolve("content/handcrafted/channels.nostr.zh.html")],
  ["/channels/pairing", path.resolve("content/handcrafted/channels.pairing.zh.html")],
  ["/channels/signal", path.resolve("content/handcrafted/channels.signal.zh.html")],
  ["/channels/slack", path.resolve("content/handcrafted/channels.slack.zh.html")],
  ["/channels/synology-chat", path.resolve("content/handcrafted/channels.synology-chat.zh.html")],
  ["/channels/telegram", path.resolve("content/handcrafted/channels.telegram.zh.html")],
  ["/channels/tlon", path.resolve("content/handcrafted/channels.tlon.zh.html")],
  ["/channels/troubleshooting", path.resolve("content/handcrafted/channels.troubleshooting.zh.html")],
  ["/channels/twitch", path.resolve("content/handcrafted/channels.twitch.zh.html")],
  ["/concepts/active-memory", path.resolve("content/handcrafted/concepts.active-memory.zh.html")],
  ["/concepts/compaction", path.resolve("content/handcrafted/concepts.compaction.zh.html")],
  ["/concepts/markdown-formatting", path.resolve("content/handcrafted/concepts.markdown-formatting.zh.html")],
  ["/concepts/presence", path.resolve("content/handcrafted/concepts.presence.zh.html")],
  ["/concepts/session-tool", path.resolve("content/handcrafted/concepts.session-tool.zh.html")],
  ["/concepts/features", path.resolve("content/handcrafted/concepts.features.zh.html")],
  ["/gateway/bridge-protocol", path.resolve("content/handcrafted/gateway.bridge-protocol.zh.html")],
  ["/gateway/doctor", path.resolve("content/handcrafted/gateway.doctor.zh.html")],
  ["/gateway/gateway-lock", path.resolve("content/handcrafted/gateway.gateway-lock.zh.html")],
  ["/gateway/health", path.resolve("content/handcrafted/gateway.health.zh.html")],
  ["/gateway/configuration-examples", path.resolve("content/handcrafted/gateway.configuration-examples.zh.html")],
  ["/gateway/multiple-gateways", path.resolve("content/handcrafted/gateway.multiple-gateways.zh.html")],
  ["/gateway/network-model", path.resolve("content/handcrafted/gateway.network-model.zh.html")],
  ["/gateway/pairing", path.resolve("content/handcrafted/gateway.pairing.zh.html")],
  ["/gateway/secrets-plan-contract", path.resolve("content/handcrafted/gateway.secrets-plan-contract.zh.html")],
  ["/gateway/tailscale", path.resolve("content/handcrafted/gateway.tailscale.zh.html")],
  ["/providers/anthropic", path.resolve("content/handcrafted/providers.anthropic.zh.html")],
  ["/providers/alibaba", path.resolve("content/handcrafted/providers.alibaba.zh.html")],
  ["/providers/arcee", path.resolve("content/handcrafted/providers.arcee.zh.html")],
  ["/providers/bedrock", path.resolve("content/handcrafted/providers.bedrock.zh.html")],
  ["/providers/bedrock-mantle", path.resolve("content/handcrafted/providers.bedrock-mantle.zh.html")],
  ["/providers/claude-max-api-proxy", path.resolve("content/handcrafted/providers.claude-max-api-proxy.zh.html")],
  ["/providers/cloudflare-ai-gateway", path.resolve("content/handcrafted/providers.cloudflare-ai-gateway.zh.html")],
  ["/providers/chutes", path.resolve("content/handcrafted/providers.chutes.zh.html")],
  ["/providers/comfy", path.resolve("content/handcrafted/providers.comfy.zh.html")],
  ["/providers/deepgram", path.resolve("content/handcrafted/providers.deepgram.zh.html")],
  ["/providers/deepseek", path.resolve("content/handcrafted/providers.deepseek.zh.html")],
  ["/providers/fal", path.resolve("content/handcrafted/providers.fal.zh.html")],
  ["/providers/glm", path.resolve("content/handcrafted/providers.glm.zh.html")],
  ["/providers/google", path.resolve("content/handcrafted/providers.google.zh.html")],
  ["/providers/github-copilot", path.resolve("content/handcrafted/providers.github-copilot.zh.html")],
  ["/providers/groq", path.resolve("content/handcrafted/providers.groq.zh.html")],
  ["/providers/huggingface", path.resolve("content/handcrafted/providers.huggingface.zh.html")],
  ["/providers/index", path.resolve("content/handcrafted/providers.index.zh.html")],
  ["/providers/inferrs", path.resolve("content/handcrafted/providers.inferrs.zh.html")],
  ["/providers/kilocode", path.resolve("content/handcrafted/providers.kilocode.zh.html")],
  ["/providers/litellm", path.resolve("content/handcrafted/providers.litellm.zh.html")],
  ["/providers/minimax", path.resolve("content/handcrafted/providers.minimax.zh.html")],
  ["/providers/mistral", path.resolve("content/handcrafted/providers.mistral.zh.html")],
  ["/providers/models", path.resolve("content/handcrafted/providers.models.zh.html")],
  ["/providers/moonshot", path.resolve("content/handcrafted/providers.moonshot.zh.html")],
  ["/providers/nvidia", path.resolve("content/handcrafted/providers.nvidia.zh.html")],
  ["/providers/openrouter", path.resolve("content/handcrafted/providers.openrouter.zh.html")],
  ["/providers/openai", path.resolve("content/handcrafted/providers.openai.zh.html")],
  ["/providers/ollama", path.resolve("content/handcrafted/providers.ollama.zh.html")],
  ["/providers/opencode", path.resolve("content/handcrafted/providers.opencode.zh.html")],
  ["/providers/opencode-go", path.resolve("content/handcrafted/providers.opencode-go.zh.html")],
  ["/providers/perplexity-provider", path.resolve("content/handcrafted/providers.perplexity-provider.zh.html")],
  ["/providers/qianfan", path.resolve("content/handcrafted/providers.qianfan.zh.html")],
  ["/providers/qwen", path.resolve("content/handcrafted/providers.qwen.zh.html")],
  ["/providers/qwen_modelstudio", path.resolve("content/handcrafted/providers.qwen_modelstudio.zh.html")],
  ["/providers/runway", path.resolve("content/handcrafted/providers.runway.zh.html")],
  ["/providers/sglang", path.resolve("content/handcrafted/providers.sglang.zh.html")],
  ["/providers/stepfun", path.resolve("content/handcrafted/providers.stepfun.zh.html")],
  ["/providers/synthetic", path.resolve("content/handcrafted/providers.synthetic.zh.html")],
  ["/providers/together", path.resolve("content/handcrafted/providers.together.zh.html")],
  ["/providers/venice", path.resolve("content/handcrafted/providers.venice.zh.html")],
  ["/providers/volcengine", path.resolve("content/handcrafted/providers.volcengine.zh.html")],
  ["/providers/vercel-ai-gateway", path.resolve("content/handcrafted/providers.vercel-ai-gateway.zh.html")],
  ["/providers/vydra", path.resolve("content/handcrafted/providers.vydra.zh.html")],
  ["/providers/vllm", path.resolve("content/handcrafted/providers.vllm.zh.html")],
  ["/providers/xiaomi", path.resolve("content/handcrafted/providers.xiaomi.zh.html")],
  ["/providers/xai", path.resolve("content/handcrafted/providers.xai.zh.html")],
  ["/providers/zai", path.resolve("content/handcrafted/providers.zai.zh.html")],
  ["/reference/AGENTS.default", path.resolve("content/handcrafted/reference.AGENTS.default.zh.html")],
  ["/reference/RELEASING", path.resolve("content/handcrafted/reference.RELEASING.zh.html")],
  ["/reference/api-usage-costs", path.resolve("content/handcrafted/reference.api-usage-costs.zh.html")],
  ["/reference/credits", path.resolve("content/handcrafted/reference.credits.zh.html")],
  ["/reference/device-models", path.resolve("content/handcrafted/reference.device-models.zh.html")],
  ["/reference/memory-config", path.resolve("content/handcrafted/reference.memory-config.zh.html")],
  ["/reference/prompt-caching", path.resolve("content/handcrafted/reference.prompt-caching.zh.html")],
  ["/reference/rich-output-protocol", path.resolve("content/handcrafted/reference.rich-output-protocol.zh.html")],
  ["/reference/rpc", path.resolve("content/handcrafted/reference.rpc.zh.html")],
  ["/reference/secretref-credential-surface", path.resolve("content/handcrafted/reference.secretref-credential-surface.zh.html")],
  ["/reference/session-management-compaction", path.resolve("content/handcrafted/reference.session-management-compaction.zh.html")],
  ["/reference/templates/AGENTS", path.resolve("content/handcrafted/reference.templates.AGENTS.zh.html")],
  ["/reference/templates/BOOT", path.resolve("content/handcrafted/reference.templates.BOOT.zh.html")],
  ["/reference/templates/BOOTSTRAP", path.resolve("content/handcrafted/reference.templates.BOOTSTRAP.zh.html")],
  ["/reference/templates/HEARTBEAT", path.resolve("content/handcrafted/reference.templates.HEARTBEAT.zh.html")],
  ["/reference/templates/IDENTITY", path.resolve("content/handcrafted/reference.templates.IDENTITY.zh.html")],
  ["/reference/templates/SOUL", path.resolve("content/handcrafted/reference.templates.SOUL.zh.html")],
  ["/reference/templates/TOOLS", path.resolve("content/handcrafted/reference.templates.TOOLS.zh.html")],
  ["/reference/templates/USER", path.resolve("content/handcrafted/reference.templates.USER.zh.html")],
  ["/reference/test", path.resolve("content/handcrafted/reference.test.zh.html")],
  ["/reference/token-use", path.resolve("content/handcrafted/reference.token-use.zh.html")],
  ["/reference/transcript-hygiene", path.resolve("content/handcrafted/reference.transcript-hygiene.zh.html")],
  ["/reference/wizard", path.resolve("content/handcrafted/reference.wizard.zh.html")],
  ["/automation/cron-jobs", path.resolve("content/handcrafted/automation.cron-jobs.zh.html")],
  ["/automation/cron-vs-heartbeat", path.resolve("content/handcrafted/automation.cron-vs-heartbeat.zh.html")],
  ["/automation/gmail-pubsub", path.resolve("content/handcrafted/automation.gmail-pubsub.zh.html")],
  ["/automation/hooks", path.resolve("content/handcrafted/automation.hooks.zh.html")],
  ["/automation/index", path.resolve("content/handcrafted/automation.index.zh.html")],
  ["/automation/poll", path.resolve("content/handcrafted/automation.poll.zh.html")],
  ["/automation/standing-orders", path.resolve("content/handcrafted/automation.standing-orders.zh.html")],
  ["/automation/taskflow", path.resolve("content/handcrafted/automation.taskflow.zh.html")],
  ["/automation/tasks", path.resolve("content/handcrafted/automation.tasks.zh.html")],
  ["/automation/troubleshooting", path.resolve("content/handcrafted/automation.troubleshooting.zh.html")],
  ["/automation/webhook", path.resolve("content/handcrafted/automation.webhook.zh.html")],
  ["/plugins/building-plugins", path.resolve("content/handcrafted/plugins.building-plugins.zh.html")],
  ["/plugins/community", path.resolve("content/handcrafted/plugins.community.zh.html")],
  ["/plugins/webhooks", path.resolve("content/handcrafted/plugins.webhooks.zh.html")],
  ["/plugins/sdk-entrypoints", path.resolve("content/handcrafted/plugins.sdk-entrypoints.zh.html")],
  ["/plugins/sdk-testing", path.resolve("content/handcrafted/plugins.sdk-testing.zh.html")],
  ["/cli/flows", path.resolve("content/handcrafted/cli.flows.zh.html")],
  ["/tools/browser", path.resolve("content/handcrafted/tools.browser.zh.html")],
  ["/tools/exec", path.resolve("content/handcrafted/tools.exec.zh.html")],
  ["/tools/plugin", path.resolve("content/handcrafted/tools.plugin.zh.html")],
  ["/web/webchat", path.resolve("content/handcrafted/web.webchat.zh.html")],
  ["/nodes/index", path.resolve("content/handcrafted/nodes.index.zh.html")],
  ["/nodes/audio", path.resolve("content/handcrafted/nodes.audio.zh.html")],
  ["/nodes/camera", path.resolve("content/handcrafted/nodes.camera.zh.html")],
  ["/nodes/images", path.resolve("content/handcrafted/nodes.images.zh.html")],
  ["/nodes/location-command", path.resolve("content/handcrafted/nodes.location-command.zh.html")],
  ["/nodes/media-understanding", path.resolve("content/handcrafted/nodes.media-understanding.zh.html")],
  ["/nodes/talk", path.resolve("content/handcrafted/nodes.talk.zh.html")],
  ["/nodes/troubleshooting", path.resolve("content/handcrafted/nodes.troubleshooting.zh.html")],
  ["/nodes/voicewake", path.resolve("content/handcrafted/nodes.voicewake.zh.html")],
  ["/platforms/index", path.resolve("content/handcrafted/platforms.index.zh.html")],
  ["/platforms/android", path.resolve("content/handcrafted/platforms.android.zh.html")],
  ["/platforms/ios", path.resolve("content/handcrafted/platforms.ios.zh.html")],
  ["/platforms/linux", path.resolve("content/handcrafted/platforms.linux.zh.html")],
  ["/platforms/macos", path.resolve("content/handcrafted/platforms.macos.zh.html")],
  ["/platforms/windows", path.resolve("content/handcrafted/platforms.windows.zh.html")],
  ["/platforms/mac/dev-setup", path.resolve("content/handcrafted/platforms.mac.dev-setup.zh.html")],
  ["/platforms/mac/menu-bar", path.resolve("content/handcrafted/platforms.mac.menu-bar.zh.html")],
  ["/platforms/mac/bundled-gateway", path.resolve("content/handcrafted/platforms.mac.bundled-gateway.zh.html")],
  ["/platforms/mac/canvas", path.resolve("content/handcrafted/platforms.mac.canvas.zh.html")],
  ["/platforms/mac/child-process", path.resolve("content/handcrafted/platforms.mac.child-process.zh.html")],
  ["/platforms/mac/health", path.resolve("content/handcrafted/platforms.mac.health.zh.html")],
  ["/platforms/mac/icon", path.resolve("content/handcrafted/platforms.mac.icon.zh.html")],
  ["/platforms/mac/logging", path.resolve("content/handcrafted/platforms.mac.logging.zh.html")],
  ["/platforms/mac/peekaboo", path.resolve("content/handcrafted/platforms.mac.peekaboo.zh.html")],
  ["/platforms/mac/permissions", path.resolve("content/handcrafted/platforms.mac.permissions.zh.html")],
  ["/platforms/mac/remote", path.resolve("content/handcrafted/platforms.mac.remote.zh.html")],
  ["/platforms/mac/signing", path.resolve("content/handcrafted/platforms.mac.signing.zh.html")],
  ["/platforms/mac/skills", path.resolve("content/handcrafted/platforms.mac.skills.zh.html")],
  ["/platforms/mac/voice-overlay", path.resolve("content/handcrafted/platforms.mac.voice-overlay.zh.html")],
  ["/platforms/mac/voicewake", path.resolve("content/handcrafted/platforms.mac.voicewake.zh.html")],
  ["/platforms/mac/webchat", path.resolve("content/handcrafted/platforms.mac.webchat.zh.html")],
  ["/platforms/mac/xpc", path.resolve("content/handcrafted/platforms.mac.xpc.zh.html")],
  ["/help/index", path.resolve("content/handcrafted/help.index.zh.html")],
  ["/help/scripts", path.resolve("content/handcrafted/help.scripts.zh.html")],
  ["/index", path.resolve("content/handcrafted/index.zh.html")],
  ["/vps", path.resolve("content/handcrafted/vps.zh.html")],
  ["/automation/auth-monitoring", path.resolve("content/handcrafted/automation.auth-monitoring.zh.html")],
  ["/prose", path.resolve("content/handcrafted/prose.zh.html")],
  ["/auth-credential-semantics", path.resolve("content/handcrafted/auth-credential-semantics.zh.html")],
  ["/logging", path.resolve("content/handcrafted/logging.zh.html")],
  ["/network", path.resolve("content/handcrafted/network.zh.html")],
  ["/security/CONTRIBUTING-THREAT-MODEL", path.resolve("content/handcrafted/security.CONTRIBUTING-THREAT-MODEL.zh.html")],
  ["/security/THREAT-MODEL-ATLAS", path.resolve("content/handcrafted/security.THREAT-MODEL-ATLAS.zh.html")],
  ["/security/formal-verification", path.resolve("content/handcrafted/security.formal-verification.zh.html")],
  ["/ci", path.resolve("content/handcrafted/ci.zh.html")],
  ["/date-time", path.resolve("content/handcrafted/date-time.zh.html")],
  ["/debug/node-issue", path.resolve("content/handcrafted/debug.node-issue.zh.html")],
  ["/diagnostics/flags", path.resolve("content/handcrafted/diagnostics.flags.zh.html")],
  ["/pi", path.resolve("content/handcrafted/pi.zh.html")],
  ["/pi-dev", path.resolve("content/handcrafted/pi-dev.zh.html")]
]);

function asset(fileName) {
  return `/assets/${fileName}`;
}

function pageUrl(pathname) {
  if (!pathname || pathname === "/") {
    return SITE_URL;
  }

  return `${SITE_URL}${publicPathname(pathname)}`;
}

const DEFAULT_META_DESCRIPTION =
  "Fivey Can Read OpenClaw 把 OpenClaw 官方文档讲成中文故事版，适合第一次接触的人慢慢读懂安装、工具、通道、网关和插件。";
const OG_IMAGE_URL = `${SITE_URL}/og-image.svg`;
const OG_IMAGE_ALT = "Fivey Can Read OpenClaw 绘本版文档站封面";

function cleanMetaDescription(value = "") {
  const text = normalizeWhitespace(stripMarkdown(value));
  return excerpt(text || DEFAULT_META_DESCRIPTION, 155);
}

function buildPageTitle(title = "") {
  const cleanTitle = normalizeWhitespace(title || SITE_NAME);
  if (!cleanTitle || cleanTitle === SITE_NAME) {
    return SITE_NAME;
  }

  return `${cleanTitle} | ${SITE_NAME}`;
}

function buildDocMeta(page) {
  const translatedTitle = page.translatedTitle || translateMenuTitle(page.title, page.sectionKey) || page.title;
  const title = translatedTitle === page.title ? translatedTitle : `${translatedTitle}：${page.title}`;
  const sourceDescription = cleanMetaDescription(page.description || "");
  const sourceIsThin =
    !sourceDescription ||
    sourceDescription.length < 48 ||
    sourceDescription.toLowerCase() === normalizeWhitespace(page.title || "").toLowerCase();
  const fallbackDescription = `${translatedTitle}是 OpenClaw 官方文档的中文故事化解读，保留原文路径和导航顺序，帮第一次接触的人听懂这一页在做什么、什么时候会用到。`;

  return {
    title,
    description: cleanMetaDescription(sourceIsThin ? fallbackDescription : sourceDescription)
  };
}

function pageOutputPath(pathname) {
  if (!pathname || pathname === "/") {
    return path.join(DIST_DIR, "index.html");
  }

  return path.join(DIST_DIR, pathname.replace(/^\/+/, ""), "index.html");
}

function publicPathname(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  if (pathname !== "/index" && pathname.endsWith("/index")) {
    return `${pathname.slice(0, -"/index".length) || "/"}/`.replace(/\/+/g, "/");
  }

  return `${pathname}/`;
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function renderInline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderOriginalBlock(block) {
  if (block.type === "paragraph") {
    return `<p>${renderInline(block.text)}</p>`;
  }

  if (block.type === "list") {
    return `<ul>${block.items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`;
  }

  if (block.type === "code") {
    return `<pre><code class="language-${escapeHtml(block.language)}">${escapeHtml(block.code)}</code></pre>`;
  }

  return "";
}

function renderStoryBlock(block, sectionTitle) {
  if (block.type === "paragraph") {
    return `
      <div class="story-card">
        <div class="story-card-label">像讲绘本</div>
        <p>${escapeHtml(storyForParagraph(block.text))}</p>
      </div>
      <div class="source-card">
        <div class="story-card-label">原文小纸条</div>
        ${renderOriginalBlock(block)}
      </div>
    `;
  }

  if (block.type === "list") {
    return `
      <div class="story-card">
        <div class="story-card-label">像准备清单</div>
        <p>${escapeHtml(storyForList(block.items, sectionTitle))}</p>
      </div>
      <div class="source-card">
        <div class="story-card-label">原文小纸条</div>
        ${renderOriginalBlock(block)}
      </div>
    `;
  }

  if (block.type === "code") {
    const explanation = storyForCode(block.code, block.language);
    return `
      <div class="story-card">
        <div class="story-card-label">像魔法口令拆解</div>
        <p>${escapeHtml(explanation.framing)}</p>
        <ul class="code-steps">
          ${explanation.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ul>
      </div>
      <div class="source-card">
        <div class="story-card-label">原文代码块</div>
        ${renderOriginalBlock(block)}
      </div>
    `;
  }

  return "";
}

function sectionGuide(section) {
  const plain = stripMarkdown(
    section.blocks
      .map((block) => {
        if (block.type === "paragraph") return block.text;
        if (block.type === "list") return block.items.join("；");
        if (block.type === "code") return "";
        return "";
      })
      .join(" ")
  );

  const lower = plain.toLowerCase();
  let what = `这一节会把“${softenTerms(section.title)}”搬到台面上，让你看见它到底在忙什么。`;
  let why = "你不用先背名字，先看清它一旦出场，会影响哪一步、拦住哪一步，就已经赢很多了。";
  let use = "真要动手时，先盯默认值、开关位置和边界线，别一上来就全改。";

  if (/allow|deny|policy|required|must|default/.test(lower)) {
    what = "这一节像守门员手里的规则板，写着谁默认能进、谁必须点头、谁会被拦下。";
    why = "这类内容决定的不是好不好看，而是系统到底肯不肯放你过去。";
    use = "真配的时候，优先盯住 default、required、allow、deny 这些词，它们就是门锁位置。";
  } else if (/install|setup|configure|onboard|enable/.test(lower + section.title.toLowerCase())) {
    what = "这一节更像搭台步骤，重点不是概念，而是先搬什么、后接什么才不会卡住。";
    why = "文档写得长，往往不是话多，而是在防你漏掉前置条件。";
    use = "照做时先找前置条件，再找必填项，最后看验活方式。";
  } else if (/tool|browser|search|exec|file|message|cron|plugin|skill/.test(lower + section.title.toLowerCase())) {
    what = "这一节在讲一只工具手到底怎么伸出去，它能抓什么、碰什么、又在哪些地方会缩回来。";
    why = "你要认清的是能力边界，不只是按钮名字。";
    use = "如果这里同时有命令、配置和例子，先看例子，再回头认配置。";
  }

  return { what, why, use };
}

async function renderHandcraftedContent(page) {
  const filePath = handcraftedPageMap.get(page.pathname);
  if (!filePath) return null;
  return fs.readFile(filePath, "utf8");
}

async function renderAiPageContent(page) {
  const filePath = path.resolve("generated", "deepseek-pages", `${page.slug.replace(/\//g, "__")}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const payload = JSON.parse(raw);
    const result = payload.result;
    if (!result?.sections?.length) return null;

    const sectionsHtml = result.sections
      .map((section, index) => {
        const points = (section.points || []).map((point) => `<li>${escapeHtml(point)}</li>`).join("");
        const codeNotes = (section.codeNotes || []).length
          ? `
            <div class="source-card">
              <div class="story-card-label">🛠 命令 / 代码像在做什么</div>
              <ul>${section.codeNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
            </div>
          `
          : "";

        return `
          <section class="section-shell" id="section-${index + 1}">
            <div class="section-heading">
              <p class="section-kicker">第 ${index + 1} 站</p>
              <h2>${escapeHtml(section.title)}</h2>
              <p>${escapeHtml(section.summary)}</p>
            </div>
            <div class="story-grid">
              <div class="story-card">
                <div class="story-card-label">🌟 为什么要看</div>
                <p>${escapeHtml(section.why)}</p>
              </div>
              <div class="source-card">
                <div class="story-card-label">🧠 这节要记住什么</div>
                <ul>${points}</ul>
              </div>
              ${codeNotes}
              <div class="story-card">
                <div class="story-card-label">🎈 最后记一句</div>
                <p>${escapeHtml(section.takeaway)}</p>
              </div>
            </div>
          </section>
        `;
      })
      .join("");

    return `
      <section class="section-shell">
        <div class="overview-card">
          <div>
            <p class="section-kicker">AI 绘本解读版</p>
            <h2>${escapeHtml(result.heroTitle || page.title)}</h2>
            <p>${escapeHtml(result.heroSummary || "")}</p>
          </div>
          <div class="overview-meta">
            <span>原始路径：${escapeHtml(page.pathname)}</span>
            <span>故事卡片：${result.sections.length} 张</span>
            <a href="${escapeHtml(page.url)}" target="_blank" rel="noreferrer">查看官方原文</a>
          </div>
        </div>
      </section>
      ${sectionsHtml}
      <section class="section-shell">
        <div class="ad-placeholder">
          <p>这里预留给未来的 Google AdSense 模块。</p>
          <code>&lt;!-- ADSENSE_SNIPPET --&gt;</code>
        </div>
      </section>
    `;
  } catch {
    return null;
  }
}

async function loadHeroOverride(page) {
  const filePath = path.resolve("generated", "deepseek-heroes", `${page.slug.replace(/\//g, "__")}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const payload = JSON.parse(raw);
    const result = payload?.result || {};
    return {
      heroTitle: typeof result.heroTitle === "string" ? result.heroTitle.trim() : "",
      heroSummary: typeof result.heroSummary === "string" ? result.heroSummary.trim() : ""
    };
  } catch {
    return null;
  }
}

function renderSidebar(navigation, currentPathname) {
  return `
    <nav class="sidebar-nav">
      ${navigation
        .map((section) => {
          const hasActivePage = section.pages.some((page) => page.pathname === currentPathname);
          const links = section.pages
            .map((page) => {
              const active = page.pathname === currentPathname ? "is-active" : "";
              return `
                <a class="sidebar-link ${active}" href="${publicPathname(page.pathname)}">
                  <span>${escapeHtml(page.translatedTitle || translateMenuTitle(page.title, page.sectionKey))}</span>
                  <small>${escapeHtml(page.title)}</small>
                </a>
              `;
            })
            .join("");

          return `
            <details class="sidebar-group"${hasActivePage ? " open" : ""}>
              <summary>${escapeHtml(section.translatedLabel || translateSectionLabel(section.key, section.label))}</summary>
              <div class="sidebar-links">${links}</div>
            </details>
          `;
        })
        .join("")}
    </nav>
  `;
}

function renderPageLayout({ title, description, pathname, heroEyebrow, heroTitle, heroText, content, navigation, breadcrumbs = [] }) {
  const canonical = pageUrl(pathname);
  const pageTitle = buildPageTitle(title);
  const metaDescription = cleanMetaDescription(description);
  const breadcrumbJson = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: pageUrl(crumb.pathname)
    }))
  };

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <meta name="robots" content="index,follow">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(OG_IMAGE_URL)}">
  <meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta name="twitter:image" content="${escapeHtml(OG_IMAGE_URL)}">
  <meta name="twitter:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}">
  <meta name="theme-color" content="#f5576c">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="${asset("site.css")}" as="style">
  <link rel="stylesheet" href="${asset("site.css")}">
  <script type="application/ld+json">${jsonLd({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: metaDescription,
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL
    }
  })}</script>
  <script type="application/ld+json">${jsonLd(breadcrumbJson)}</script>
</head>
<body>
  <div class="page-shell">
    <aside class="sidebar">
      <a class="brand" href="/">
        <span class="brand-mark"><img src="/favicon.svg" alt="${escapeHtml(selectedTheme.chineseName)}"></span>
        <span>
          <strong>Fivey Can Read</strong>
          <small>OpenClaw 绘本版文档站 · ${escapeHtml(selectedTheme.chineseName)}主题</small>
        </span>
      </a>
      ${renderSidebar(navigation, pathname)}
    </aside>

    <main class="main">
      <header class="hero">
        <div class="hero-topbar">
          <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="打开菜单">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div class="hero-actions">
            <a class="source-link" href="/theme-icons/">图标样例</a>
            <a class="source-link" href="https://docs.openclaw.ai" target="_blank" rel="noreferrer">原始文档</a>
          </div>
        </div>
        <p class="hero-eyebrow">${escapeHtml(heroEyebrow)}</p>
        <h1>${escapeHtml(heroTitle)}</h1>
        <p class="hero-copy">${escapeHtml(heroText)}</p>
      </header>

      <div class="mobile-nav-shell" data-mobile-shell>
        <button class="mobile-nav-backdrop" type="button" aria-label="关闭菜单" data-mobile-close></button>
        <div id="mobile-nav" class="mobile-nav" role="dialog" aria-modal="true" aria-label="站点菜单">
          <div class="mobile-nav-head">
            <strong>站点菜单</strong>
            <button class="mobile-nav-close" type="button" aria-label="关闭菜单" data-mobile-close>关闭</button>
          </div>
          ${renderSidebar(navigation, pathname)}
        </div>
      </div>

      ${content}

      <footer class="page-footer">
        <div>
          <strong>${escapeHtml(SITE_NAME)}</strong>
          <p>同步时间：${escapeHtml(formatDate(siteData.generatedAt))}</p>
        </div>
      </footer>
    </main>
  </div>
  <script src="${asset("site.js")}" defer></script>
</body>
</html>`;
}

function renderHomePage() {
  const heroText = `我们把 OpenClaw 官方文档变成了适合 5 岁小朋友和第一次接触的人阅读的故事版。每一页都会按原文菜单顺序讲，命令和代码也会拆成一步一步的小故事。现在默认主题已经定为“${selectedTheme.chineseName}”，整站会统一沿着这套绘本气质继续长。`;
  const sectionCards = siteData.navigation
    .map(
      (section, index) => `
        <a class="home-card" href="${section.pages[0] ? publicPathname(section.pages[0].pathname) : "/"}">
          <span class="home-card-index">${String(index + 1).padStart(2, "0")}</span>
          <h2>${escapeHtml(section.translatedLabel || translateSectionLabel(section.key, section.label))}</h2>
          <p>${escapeHtml(`这一组一共有 ${section.pages.length} 页，我们会按原站顺序慢慢讲。`)}</p>
        </a>
      `
    )
    .join("");

  const content = `
    <section class="section-shell spotlight">
      <div class="spotlight-card">
        <div>
          <p class="section-kicker">为什么做这个站</p>
          <h2>把技术文档讲成可以慢慢读懂的小绘本</h2>
          <p>原站很专业，我们这边保持导航顺序不变，但把每个小节改写成“故事讲解 + 原文对照 + 代码拆解”的形式，方便大人带着孩子一起看，也方便新人快速上手。</p>
        </div>
        <div class="stat-grid">
          <div class="stat-card"><strong>${siteData.pageCount}</strong><span>已同步页面</span></div>
          <div class="stat-card"><strong>${siteData.sectionCount}</strong><span>一级栏目</span></div>
          <div class="stat-card"><strong>3 天</strong><span>自动重生成</span></div>
          <div class="stat-card"><strong>100%</strong><span>静态页面输出</span></div>
        </div>
      </div>
    </section>

    <section class="section-shell">
      <div class="overview-card brand-overview">
        <div class="brand-overview-art">
          <img src="/favicon.svg" alt="${escapeHtml(selectedTheme.chineseName)}">
        </div>
        <div>
          <p class="section-kicker">默认主题已定</p>
          <h2>${escapeHtml(selectedTheme.chineseName)}</h2>
          <p>${escapeHtml(selectedTheme.reason)}</p>
          <div class="overview-meta">
            <span>${escapeHtml(selectedTheme.summary)}</span>
            <a href="/theme-icons/">查看另外两个方案</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section-shell">
      <div class="section-heading">
        <p class="section-kicker">按原站顺序阅读</p>
        <h2>从这些大门进去</h2>
      </div>
      <div class="home-grid">${sectionCards}</div>
    </section>

    <section class="section-shell">
      <div class="section-heading">
        <p class="section-kicker">站点主题</p>
        <h2>先挑一个最像我们的门牌图标</h2>
      </div>
      <div class="home-grid">
        ${iconConcepts
          .map(
            (icon) => `
              <a class="home-card" href="/theme-icons/">
                <span class="home-card-index">${icon.file === selectedTheme.file ? "✓" : "🎨"}</span>
                <h2>${escapeHtml(icon.chineseName)}</h2>
                <p>${escapeHtml(icon.summary)}</p>
              </a>
            `
          )
          .join("")}
      </div>
    </section>

    <section class="section-shell">
      <div class="section-heading">
        <p class="section-kicker">上线步骤</p>
        <h2>把它放上 Cloudflare Pages 的最短路径</h2>
      </div>
      <div class="story-grid">
        <div class="story-card">
          <div class="story-card-label">第一步</div>
          <p>在 Cloudflare Pages 里连接 GitHub 仓库 <code>yingziwj/fivey-can-read-openclaw</code>，构建命令填 <code>npm run build</code>，输出目录填 <code>dist</code>。</p>
        </div>
        <div class="story-card">
          <div class="story-card-label">第二步</div>
          <p>把默认域名确认成 <code>fivey-can-read-openclaw.pages.dev</code>，这样全球用户会直接走 Cloudflare 的边缘网络访问。</p>
        </div>
        <div class="story-card">
          <div class="story-card-label">第三步</div>
          <p>启用仓库里的 GitHub Actions，之后每 3 天会自动同步官方文档并重建页面，原站增删改会覆盖到这里。</p>
        </div>
        <div class="story-card">
          <div class="story-card-label">第四步</div>
          <p>默认图标我已经定成 <code>${escapeHtml(selectedTheme.chineseName)}</code> 主题；后面如果要接 Google AdSense，我再把广告占位改成正式接入口。</p>
        </div>
      </div>
    </section>

    <section class="section-shell">
      <div class="section-heading">
        <p class="section-kicker">未来广告位预留</p>
        <h2>这个位置以后可以接入 Google AdSense</h2>
      </div>
      <div class="ad-placeholder">
        <p>当前先保留干净占位，不插入广告脚本。</p>
        <code>&lt;!-- ADSENSE_SNIPPET --&gt;</code>
      </div>
    </section>
  `;

  return renderPageLayout({
    title: SITE_NAME,
    description: heroText,
    pathname: "/",
    heroEyebrow: "OpenClaw 文档故事乐园",
    heroTitle: "给 5 岁小朋友也能慢慢听懂的 OpenClaw 网站",
    heroText,
    content,
    navigation: siteData.navigation,
    breadcrumbs: [
      { label: "Home", pathname: "/" }
    ]
  });
}

function renderIconPage() {
  const cards = iconConcepts
    .map(
      (icon, index) => `
        <article class="icon-card">
          <div class="icon-preview">
            <img src="/assets/icons/${escapeHtml(icon.file)}" alt="${escapeHtml(icon.chineseName)} 图标预览">
          </div>
          <div class="icon-copy">
            <p class="section-kicker">方案 ${index + 1}</p>
            <h2>${escapeHtml(icon.chineseName)}${icon.file === selectedTheme.file ? " · 当前默认" : ""}</h2>
            <p>${escapeHtml(icon.summary)}</p>
            <p>${escapeHtml(icon.fit)}</p>
            <code>/assets/icons/${escapeHtml(icon.file)}</code>
          </div>
        </article>
      `
    )
    .join("");

  const content = `
    <section class="section-shell">
      <div class="overview-card">
        <div>
          <p class="section-kicker">主题图标候选</p>
          <h2>这 3 个门牌都能直接拿来做站点主题</h2>
          <p>我已经把它们都放进仓库，并且现在正式把“${selectedTheme.chineseName}”定成默认主题。后面如果要换，也只需要切一次默认文件名和品牌文案。</p>
        </div>
      </div>
    </section>
    <section class="section-shell">
      <div class="icon-grid">${cards}</div>
    </section>
  `;

  return renderPageLayout({
    title: "主题图标",
    description: "Fivey Can Read OpenClaw 的 3 个站点图标候选方案。",
    pathname: "/theme-icons",
    heroEyebrow: "Brand Preview",
    heroTitle: "给网站挑一个最像它的门牌",
    heroText: "这里把三个图标样例放在一起看，你可以很快判断我们是更偏绘本感、工具感，还是更偏独立品牌感。",
    content,
    navigation: siteData.navigation,
    breadcrumbs: [
      { label: "Home", pathname: "/" },
      { label: "Theme Icons", pathname: "/theme-icons" }
    ]
  });
}

async function renderDocPage(page) {
  const breadcrumbs = [
    { label: "Home", pathname: "/" },
    { label: page.sectionLabel, pathname: page.pathname }
  ];

  const sectionsHtml = page.sections
    .map((section, index) => {
      const guide = sectionGuide(section);
      const sectionBlocks = section.blocks
        .map((block) => renderStoryBlock(block, section.title))
        .join("");

      return `
        <section class="section-shell" id="section-${index + 1}">
          <div class="section-heading">
            <p class="section-kicker">第 ${index + 1} 站</p>
            <h2>${escapeHtml(softenTerms(section.title))}</h2>
            <p>${escapeHtml(guide.what)}</p>
          </div>
          <div class="story-grid">
            <div class="story-card">
              <div class="story-card-label">这一段在忙什么</div>
              <p>${escapeHtml(guide.what)}</p>
            </div>
            <div class="story-card">
              <div class="story-card-label">为什么别跳过</div>
              <p>${escapeHtml(guide.why)}</p>
            </div>
            <div class="story-card">
              <div class="story-card-label">真要动手时</div>
              <p>${escapeHtml(guide.use)}</p>
            </div>
            <div class="source-card">
              <div class="story-card-label">先看眼前发生了什么</div>
              <p>${escapeHtml(storyForParagraph(stripMarkdown(section.blocks.map((block) => block.type === "paragraph" ? block.text : "").join(" "))))}</p>
            </div>
          </div>
          <div class="story-grid">
            ${sectionBlocks}
          </div>
        </section>
      `;
    })
    .join("");

  const genericContent = `
    <section class="section-shell">
      <div class="overview-card">
        <div>
          <p class="section-kicker">先听这页的人话版</p>
          <h2>${escapeHtml(page.title)}</h2>
          <p>${escapeHtml(storyLead(page.title, page.description || ""))}</p>
          <p>${escapeHtml(`把这页读完，你最好能直接说出三件事：它在系统里扮哪一个角色、什么时候该把它请出来、最容易摔跤的是哪一步。`)}</p>
        </div>
        <div class="overview-meta">
          <span>原始路径：${escapeHtml(page.pathname)}</span>
          <span>章节数量：${page.sections.length}</span>
          <a href="${escapeHtml(page.url)}" target="_blank" rel="noreferrer">查看原文</a>
        </div>
      </div>
    </section>
    ${sectionsHtml}
    <section class="section-shell">
      <div class="ad-placeholder">
        <p>这里预留给未来的 Google AdSense 模块。</p>
        <code>&lt;!-- ADSENSE_SNIPPET --&gt;</code>
      </div>
    </section>
  `;
  const handcraftedContent = await renderHandcraftedContent(page);
  const aiContent = handcraftedContent ? null : await renderAiPageContent(page);
  const heroOverride = await loadHeroOverride(page);
  const meta = buildDocMeta(page);

  return renderPageLayout({
    title: meta.title,
    description: meta.description,
    pathname: page.pathname,
    heroEyebrow: `${page.sectionLabel} 导读`,
    heroTitle: heroOverride?.heroTitle || buildDocHeroTitle(page),
    heroText: heroOverride?.heroSummary || buildDocHeroText(page),
    content: handcraftedContent || aiContent || genericContent,
    navigation: siteData.navigation,
    breadcrumbs
  });
}

const css = `
:root {
  --bg: #fff8f2;
  --ink: #3a3551;
  --soft-ink: #60597a;
  --card: rgba(255, 255, 255, 0.92);
  --line: rgba(113, 93, 180, 0.14);
  --primary: #f5576c;
  --secondary: #667eea;
  --mint: #7bdff2;
  --gold: #ffd166;
  --shadow: 0 22px 60px rgba(69, 48, 117, 0.14);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: "Trebuchet MS", "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(123, 223, 242, 0.28), transparent 28%),
    radial-gradient(circle at top right, rgba(245, 87, 108, 0.22), transparent 30%),
    linear-gradient(135deg, #fff7f0 0%, #f8fbff 46%, #fff7fb 100%);
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

code, pre {
  font-family: "SFMono-Regular", "Consolas", monospace;
}

.page-shell {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: auto;
  padding: 26px 20px 32px;
  background: rgba(255, 255, 255, 0.72);
  border-right: 1px solid var(--line);
  backdrop-filter: blur(18px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(245, 87, 108, 0.14), rgba(102, 126, 234, 0.16));
  box-shadow: var(--shadow);
  margin-bottom: 22px;
}

.brand-mark {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 28px;
  background: linear-gradient(135deg, #ff9a9e, #fad0c4 45%, #fbc2eb);
}

.brand-mark img {
  width: 40px;
  height: 40px;
}

.brand strong {
  display: block;
  font-size: 1rem;
}

.brand small {
  display: block;
  margin-top: 4px;
  color: var(--soft-ink);
}

.sidebar-nav {
  display: grid;
  gap: 18px;
}

.sidebar-group {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid rgba(176, 75, 143, 0.08);
  overflow: hidden;
}

.sidebar-group summary {
  list-style: none;
  cursor: pointer;
  padding: 14px 16px;
  margin: 0;
  font-size: 0.86rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #b04b8f;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-group summary::-webkit-details-marker {
  display: none;
}

.sidebar-group summary::after {
  content: "展开";
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--soft-ink);
}

.sidebar-group[open] summary::after {
  content: "收起";
}

.sidebar-links {
  display: grid;
  gap: 8px;
  padding: 0 12px 12px;
}

.sidebar-link {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 16px;
  transition: transform 180ms ease, background 180ms ease;
}

.sidebar-link:hover,
.sidebar-link.is-active {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 24px rgba(69, 48, 117, 0.08);
}

.sidebar-link small {
  color: var(--soft-ink);
}

.main {
  padding: 28px 28px 56px;
}

.hero {
  padding: 30px;
  border-radius: 34px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.48), transparent 30%),
    linear-gradient(135deg, #f8a7ff 0%, #f5576c 36%, #ffd166 100%);
  color: white;
  box-shadow: var(--shadow);
}

.hero-topbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.nav-toggle,
.source-link {
  border: 0;
  background: rgba(255, 255, 255, 0.18);
  color: white;
  border-radius: 999px;
  padding: 10px 16px;
  font: inherit;
}

.nav-toggle {
  width: 48px;
  height: 48px;
  padding: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.nav-toggle span {
  width: 20px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  transition: transform 180ms ease, opacity 180ms ease;
}

.nav-toggle[aria-expanded="true"] span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.nav-toggle[aria-expanded="true"] span:nth-child(2) {
  opacity: 0;
}

.nav-toggle[aria-expanded="true"] span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.hero-eyebrow,
.section-kicker {
  margin: 0 0 12px;
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.92;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.1rem, 4vw, 3.5rem);
  line-height: 1.05;
}

.hero-copy {
  max-width: 760px;
  margin: 18px 0 0;
  font-size: 1.08rem;
  line-height: 1.8;
}

.overview-meta span,
.overview-meta a {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}

.mobile-nav-shell {
  display: none;
}

.mobile-nav-backdrop {
  display: none;
}

.mobile-nav {
  display: none;
}

.mobile-nav-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px 14px;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(113, 93, 180, 0.14);
}

.mobile-nav-head strong {
  font-size: 1rem;
  color: #3a3551;
}

.mobile-nav-close {
  border: 0;
  border-radius: 999px;
  padding: 10px 14px;
  background: rgba(102, 126, 234, 0.12);
  color: #514a72;
  font: inherit;
}

.mobile-nav .sidebar-nav {
  padding: 14px;
}

.mobile-nav .sidebar-group {
  background: rgba(255, 255, 255, 0.72);
}

.section-shell {
  margin-top: 24px;
}

.spotlight-card,
.overview-card,
.ad-placeholder {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 30px;
  padding: 26px;
  box-shadow: var(--shadow);
}

.brand-overview {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
}

.brand-overview-art {
  display: grid;
  place-items: center;
  min-height: 180px;
  border-radius: 26px;
  background: linear-gradient(135deg, rgba(255, 233, 188, 0.72), rgba(248, 238, 255, 0.86));
}

.brand-overview-art img {
  width: 140px;
  height: auto;
}

.spotlight-card {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 18px;
}

.section-heading h2,
.spotlight-card h2,
.overview-card h2 {
  margin: 0 0 8px;
  font-size: clamp(1.6rem, 2.6vw, 2.4rem);
}

.section-heading p,
.spotlight-card p,
.overview-card p,
.story-card p,
.source-card p,
.ad-placeholder p {
  margin: 0;
  color: var(--soft-ink);
  line-height: 1.8;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-card,
.home-card {
  border-radius: 22px;
  padding: 18px;
  background: linear-gradient(135deg, rgba(255, 240, 245, 0.95), rgba(243, 248, 255, 0.95));
  border: 1px solid rgba(113, 93, 180, 0.12);
}

.icon-grid {
  display: grid;
  gap: 18px;
}

.icon-card {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 30px;
  padding: 22px;
  box-shadow: var(--shadow);
}

.icon-preview {
  display: grid;
  place-items: center;
  min-height: 260px;
  border-radius: 26px;
  background: linear-gradient(135deg, rgba(255, 245, 214, 0.92), rgba(245, 239, 255, 0.92));
}

.icon-preview img {
  width: min(220px, 100%);
  height: auto;
}

.icon-copy h2 {
  margin: 0 0 10px;
  font-size: 1.9rem;
}

.icon-copy code {
  display: inline-block;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(102, 126, 234, 0.12);
}

.stat-card strong {
  display: block;
  font-size: 2rem;
  margin-bottom: 6px;
}

.home-grid,
.story-grid {
  display: grid;
  gap: 18px;
}

.home-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.home-card {
  box-shadow: var(--shadow);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.home-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 28px 66px rgba(69, 48, 117, 0.16);
}

.home-card-index {
  display: inline-flex;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #7bdff2, #b2f7ef);
  color: #2d3265;
  font-weight: 700;
}

.home-card h2 {
  margin: 16px 0 8px;
}

.story-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.story-card,
.source-card {
  padding: 22px;
  border-radius: 26px;
  background: var(--card);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

.story-card-label {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(245, 87, 108, 0.12), rgba(102, 126, 234, 0.12));
  color: #9b3d88;
  font-size: 0.85rem;
}

.source-card ul,
.code-steps {
  margin: 14px 0 0;
  padding-left: 20px;
  color: var(--soft-ink);
  line-height: 1.8;
}

.source-card pre {
  margin: 14px 0 0;
  padding: 18px;
  overflow: auto;
  border-radius: 22px;
  background: #2d2b45;
  color: #f7f5ff;
}

.source-card code {
  background: rgba(102, 126, 234, 0.12);
  border-radius: 8px;
  padding: 2px 6px;
}

.source-card pre code {
  padding: 0;
  background: transparent;
}

.overview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
  color: var(--soft-ink);
}

.ad-placeholder {
  text-align: center;
  background: linear-gradient(135deg, rgba(255, 233, 188, 0.65), rgba(255, 255, 255, 0.9));
}

.page-footer {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 24px 12px 0;
  color: var(--soft-ink);
}

@media (max-width: 1080px) {
  .page-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .mobile-nav-shell {
    position: fixed;
    inset: 0;
    z-index: 40;
    pointer-events: none;
  }

  .mobile-nav-shell.is-open {
    display: block;
    pointer-events: auto;
  }

  .mobile-nav-shell.is-open .mobile-nav-backdrop {
    display: block;
    position: absolute;
    inset: 0;
    border: 0;
    background: rgba(32, 19, 50, 0.46);
  }

  .mobile-nav {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    display: block;
    width: min(86vw, 360px);
    margin: 0;
    padding: 14px 0 18px;
    border-radius: 0 28px 28px 0;
    border-right: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(250, 246, 255, 0.96);
    backdrop-filter: blur(18px);
    box-shadow: 0 24px 60px rgba(30, 20, 53, 0.22);
    transform: translateX(-100%);
    transition: transform 220ms ease;
    overflow: auto;
  }

  .mobile-nav-shell.is-open .mobile-nav {
    transform: translateX(0);
  }

  .hero-topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-actions {
    width: 100%;
  }

  .nav-toggle,
  .hero-actions .source-link {
    min-height: 44px;
  }

  .spotlight-card,
  .story-grid,
  .icon-card,
  .brand-overview {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .main {
    padding: 18px 14px 38px;
  }

  .brand {
    align-items: flex-start;
    padding: 16px;
  }

  .brand-mark {
    width: 48px;
    height: 48px;
  }

  .brand-mark img {
    width: 34px;
    height: 34px;
  }

  .hero,
  .spotlight-card,
  .overview-card,
  .story-card,
  .source-card,
  .ad-placeholder {
    border-radius: 24px;
    padding: 20px;
  }

  .hero-copy {
    font-size: 1rem;
  }

  .hero-actions,
  .overview-meta {
    gap: 8px;
  }

  .hero-actions .source-link,
  .nav-toggle {
    min-height: 44px;
  }

  .mobile-nav-head {
    padding-left: 16px;
    padding-right: 16px;
  }

  .overview-meta span,
  .overview-meta a {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .stat-grid,
  .home-grid,
  .story-grid {
    grid-template-columns: 1fr;
  }

  .source-card pre {
    font-size: 0.92rem;
    padding: 16px;
  }

  .page-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 540px) {
  .hero-topbar {
    gap: 12px;
    margin-bottom: 18px;
  }

  .hero h1 {
    font-size: clamp(1.8rem, 9vw, 2.35rem);
  }

  .hero-copy,
  .section-heading p,
  .spotlight-card p,
  .overview-card p,
  .story-card p,
  .source-card p,
  .ad-placeholder p {
    line-height: 1.65;
  }

  .sidebar-group summary,
  .sidebar-link {
    padding-left: 12px;
    padding-right: 12px;
  }

  .mobile-nav {
    width: min(90vw, 340px);
    border-radius: 0 24px 24px 0;
  }

  .mobile-nav-head {
    padding-left: 14px;
    padding-right: 14px;
  }

  .mobile-nav-close {
    padding: 9px 12px;
  }
}
`;

const js = `
const toggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector("#mobile-nav");
const mobileShell = document.querySelector("[data-mobile-shell]");
const closeButtons = document.querySelectorAll("[data-mobile-close]");

if (toggle && mobileNav && mobileShell) {
  const setOpen = (isOpen) => {
    mobileShell.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "关闭菜单" : "打开菜单");
    document.body.style.overflow = isOpen ? "hidden" : "";
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => setOpen(false));
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });
}
`;

const ogImage = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8a7ff"/>
      <stop offset="45%" stop-color="#f5576c"/>
      <stop offset="100%" stop-color="#ffd166"/>
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.96"/>
      <stop offset="100%" stop-color="#fff4fa" stop-opacity="0.94"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" rx="48" fill="url(#bg)"/>
  <circle cx="1060" cy="90" r="120" fill="#ffffff" opacity="0.12"/>
  <circle cx="120" cy="520" r="140" fill="#7bdff2" opacity="0.18"/>
  <rect x="72" y="72" width="1056" height="486" rx="40" fill="url(#card)"/>
  <image href="${SITE_URL}/favicon.svg" x="120" y="140" width="180" height="180"/>
  <text x="340" y="220" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="34" fill="#b04b8f">OpenClaw 绘本版文档站</text>
  <text x="340" y="312" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="74" font-weight="700" fill="#3a3551">Fivey Can Read</text>
  <text x="340" y="390" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="74" font-weight="700" fill="#3a3551">OpenClaw</text>
  <text x="120" y="486" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="28" fill="#60597a">给 5 岁小朋友也能慢慢听懂的 OpenClaw 官方文档解读</text>
  <text x="120" y="528" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="28" fill="#60597a">默认主题：${selectedTheme.chineseName}</text>
</svg>
`;

await fs.writeFile(path.join(DIST_DIR, "assets", "site.css"), css.trimStart(), "utf8");
await fs.writeFile(path.join(DIST_DIR, "assets", "site.js"), js.trimStart(), "utf8");
await fs.writeFile(path.join(DIST_DIR, "og-image.svg"), ogImage, "utf8");
await fs.writeFile(path.join(DIST_DIR, "index.html"), renderHomePage(), "utf8");
await ensureDir(path.join(DIST_DIR, "theme-icons"));
await fs.writeFile(path.join(DIST_DIR, "theme-icons", "index.html"), renderIconPage(), "utf8");

for (const page of siteData.pages) {
  const outputPath = pageOutputPath(page.pathname);
  await ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, await renderDocPage(page), "utf8");

  if (page.pathname !== "/index" && page.pathname.endsWith("/index")) {
    const aliasOutputPath = path.join(DIST_DIR, page.pathname.slice(1, -"/index".length), "index.html");
    await ensureDir(path.dirname(aliasOutputPath));
    await fs.writeFile(aliasOutputPath, await renderDocPage(page), "utf8");
  }
}

const sitemapPathnames = [
  "/",
  "/theme-icons/",
  ...siteData.pages.map((page) => publicPathname(page.pathname))
];

const sitemapEntries = [...new Set(sitemapPathnames)]
  .map((pathname) => {
    const url = pathname === "/" ? SITE_URL : `${SITE_URL}${pathname}`;
    const priority = pathname === "/" ? "1.0" : pathname === "/theme-icons/" ? "0.4" : "0.7";
    const changefreq = pathname === "/" ? "daily" : "weekly";
    return [
      "  <url>",
      `    <loc>${escapeHtml(url)}</loc>`,
      `    <lastmod>${siteData.generatedAt}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      "  </url>"
    ].join("\n");
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

const ads = `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
`;

const manifest = JSON.stringify(
  {
    name: SITE_NAME,
    short_name: "Fivey OpenClaw",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8f2",
    theme_color: "#f5576c",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  },
  null,
  2
);

const searchIndex = siteData.pages.map((page) => ({
  title: page.title,
  pathname: page.pathname,
  section: page.sectionLabel,
  description: page.description
}));

await fs.writeFile(path.join(DIST_DIR, "sitemap.xml"), sitemap, "utf8");
await fs.writeFile(path.join(DIST_DIR, "robots.txt"), robots, "utf8");
await fs.writeFile(path.join(DIST_DIR, "ads.txt"), ads, "utf8");
await fs.writeFile(path.join(DIST_DIR, "site.webmanifest"), manifest, "utf8");
await fs.writeFile(path.join(DIST_DIR, "search-index.json"), `${JSON.stringify(searchIndex, null, 2)}\n`, "utf8");

console.log(`Built ${siteData.pages.length} documentation pages into ${DIST_DIR}`);

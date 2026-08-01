// ==============================================
// DeepPage — Service Worker
// Routes API calls — OpenAI or Anthropic format
// ==============================================

import { API_PROVIDER_MAP as API_PROVIDERS } from "./providers.js";

const API_PATHS = {
  openai: "/chat/completions",
  anthropic: "/messages",
};

async function getSettings() {
  const result = await chrome.storage.sync.get([
    "apiProvider",
    "apiBaseUrl",
    "apiKey",
    "apiModel",
    "apiType",
    "deepseekApiKey", // fallback
    // model params
    "streamOutput",
    "temperature",
    "maxTokens",
    "topP",
    "frequencyPenalty",
    "presencePenalty",
    "stopSequences",
    "reasoningLevel",
    "customSystemPrompt",
  ]);
  const apiProvider = result.apiProvider || "deepseek";
  const defaults = API_PROVIDERS[apiProvider] || API_PROVIDERS.deepseek;

  // For custom, apiType comes from storage; for known providers, from config
  const apiType = apiProvider === "custom" ? result.apiType || "openai" : defaults.type;
  const baseUrl = result.apiBaseUrl || defaults.baseUrl;
  const apiKey = result.apiKey || result.deepseekApiKey || null;
  const model = result.apiModel || defaults.model;

  return {
    apiType,
    baseUrl,
    apiKey,
    model,
    apiProvider,
    streamOutput: result.streamOutput !== false,
    temperature: result.temperature,
    maxTokens: result.maxTokens,
    topP: result.topP,
    frequencyPenalty: result.frequencyPenalty,
    presencePenalty: result.presencePenalty,
    stopSequences: result.stopSequences,
    reasoningLevel: result.reasoningLevel,
    customSystemPrompt: result.customSystemPrompt,
  };
}

// ===== 流式输出（port 通信） =====
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "chat-stream") return;

  port.onMessage.addListener(async (msg) => {
    if (msg.action !== "chat") return;

    try {
      const settings = await getSettings();
      const {
        apiType,
        baseUrl,
        apiKey,
        model,
        apiProvider,
        streamOutput,
        temperature,
        maxTokens,
        topP,
        frequencyPenalty,
        presencePenalty,
        stopSequences,
        reasoningLevel,
        customSystemPrompt,
      } = settings;
      if (!apiKey) {
        port.postMessage({ type: "error", text: "NO_API_KEY" });
        return;
      }

      let systemPrompt = msg.pageContext
        ? `你是一个网页助手。用户正在浏览以下网页，请根据网页内容回答问题。\n\n标题: ${msg.pageContext.title}\nURL: ${msg.pageContext.url}\n\n网页全文：\n${msg.pageContext.text}`
        : "你是一个网页助手。";
      // Reasoning-level based instruction (for non-o-series models)
      if (
        reasoningLevel &&
        reasoningLevel !== "off" &&
        !(model && (model.startsWith("o1") || model.startsWith("o3")))
      ) {
        const reasoningPrompts = {
          low: "\n\n请先简单思考再回答。",
          medium: "\n\n请一步步思考，展示推理过程再回答。",
          high: "\n\n请深入思考，详细展示每一步推理过程，再给出最终答案。",
        };
        systemPrompt += reasoningPrompts[reasoningLevel] || "";
      }
      // Custom system prompt
      if (customSystemPrompt) {
        systemPrompt += "\n\n" + customSystemPrompt;
      }
      const messages = [{ role: "system", content: systemPrompt }, ...(msg.chatHistory || [])];

      const url = `${baseUrl.replace(/\/+$/, "")}${API_PATHS[apiType]}`;
      const headers =
        apiType === "anthropic"
          ? {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            }
          : { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
      const body = buildBody(apiType, model, messages, streamOutput, {
        temperature,
        maxTokens,
        topP,
        frequencyPenalty,
        presencePenalty,
        stopSequences,
        reasoningLevel,
        apiProvider,
        baseUrl,
      });

      const resp = await fetch(url, { method: "POST", headers, body });

      if (!resp.ok) {
        let errMsg = `API ${resp.status}`;
        try {
          const data = await resp.json();
          errMsg =
            apiType === "anthropic"
              ? data?.error?.message || data?.error?.type || errMsg
              : data?.error?.message || data?.message || errMsg;
        } catch (_) {}
        port.postMessage({ type: "error", text: errMsg });
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let totalText = "";
      let sawDataLine = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        buffer += text;
        totalText += text;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "" || line.startsWith("event: ")) continue;
          if (line.startsWith("data: ")) sawDataLine = true;
          const { content, reasoningContent } = parseStreamChunk(apiType, line);
          if (reasoningContent || content) {
            console.log(
              "[DeepPage] Stream delta:",
              JSON.stringify({
                content: content?.slice(0, 80),
                reasoningContent: reasoningContent?.slice(0, 80),
              })
            );
          }
          if (reasoningContent) {
            port.postMessage({ type: "reasoning_chunk", text: reasoningContent });
          }
          if (content) {
            port.postMessage({ type: "chunk", text: content });
          }
        }
      }

      // 兜底：API 忽略 stream 参数直接返回普通 JSON（非 SSE）时，整个响应没有 data: 行，
      // 用 parseNonStream 解析完整 JSON 并补发一次回复（服务端通常一次返回全部内容）
      if (!sawDataLine && totalText.trim()) {
        try {
          const data = JSON.parse(totalText);
          const text = parseNonStream(apiType, data);
          if (text) {
            port.postMessage({ type: "chunk", text });
          } else if (data?.error?.message) {
            port.postMessage({ type: "error", text: data.error.message });
          }
        } catch (_) {
          // 无法解析，交给前端保持现状
        }
      }

      port.postMessage({ type: "done" });
    } catch (err) {
      port.postMessage({ type: "error", text: err.message });
    }
  });
});

// ===== 非流式 / 工具请求 =====
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case "chat":
      handleChat(msg)
        .then(sendResponse)
        .catch((err) => {
          sendResponse({ error: err.message });
        });
      return true;
    case "checkLogin":
      getSettings().then(({ apiKey }) => sendResponse({ loggedIn: !!apiKey }));
      return true;
    case "testApi":
      testApiConnection()
        .then(sendResponse)
        .catch((err) => {
          sendResponse({ ok: false, error: err.message });
        });
      return true;
    case "getProviderInfo":
      getSettings().then((s) =>
        sendResponse({
          apiType: s.apiType,
          model: s.model,
          loggedIn: !!s.apiKey,
        })
      );
      return true;
    case "getModels":
      fetchModels()
        .then(sendResponse)
        .catch((err) => {
          sendResponse({ models: [], error: err.message });
        });
      return true;
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// ===== 辅助函数 =====

function buildBody(apiType, model, messages, stream, params = {}) {
  const {
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
    stopSequences,
    reasoningLevel,
    apiProvider,
    baseUrl,
  } = params;
  if (apiType === "anthropic") {
    let system = "";
    const msgs = messages.filter((m) => {
      if (m.role === "system") {
        system = m.content;
        return false;
      }
      return true;
    });
    const body = { model, messages: msgs, max_tokens: maxTokens || 4096, stream };
    if (system) body.system = system;
    if (temperature !== undefined && temperature !== null)
      body.temperature = parseFloat(temperature);
    if (topP !== undefined && topP !== null) body.top_p = parseFloat(topP);
    if (stopSequences)
      body.stop_sequences = stopSequences
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return JSON.stringify(body);
  }
  // OpenAI-compatible
  const body = { model, messages, stream };
  if (maxTokens) body.max_tokens = parseInt(maxTokens, 10);
  if (temperature !== undefined && temperature !== null) body.temperature = parseFloat(temperature);
  if (topP !== undefined && topP !== null) body.top_p = parseFloat(topP);
  if (frequencyPenalty !== undefined && frequencyPenalty !== null)
    body.frequency_penalty = parseFloat(frequencyPenalty);
  if (presencePenalty !== undefined && presencePenalty !== null)
    body.presence_penalty = parseFloat(presencePenalty);
  if (stopSequences)
    body.stop = stopSequences
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  // DeepSeek native thinking mode
  if (
    reasoningLevel &&
    reasoningLevel !== "off" &&
    (apiProvider === "deepseek" || (baseUrl && baseUrl.includes("api.deepseek.com")))
  ) {
    const effortMap = { low: "low", medium: "medium", high: "high" };
    body.thinking = { type: "enabled" };
    body.reasoning_effort = effortMap[reasoningLevel] || "medium";
    console.log("[DeepPage] Enabled DeepSeek thinking mode, effort:", body.reasoning_effort);
  }
  // Reasoning effort for o1/o3 series
  if (
    reasoningLevel &&
    reasoningLevel !== "off" &&
    !body.thinking &&
    model &&
    (model.startsWith("o1") || model.startsWith("o3"))
  ) {
    const effortMap = { low: "low", medium: "medium", high: "high" };
    body.reasoning_effort = effortMap[reasoningLevel] || "medium";
  }
  console.log("[DeepPage] Request body:", JSON.stringify(body, null, 2));
  return JSON.stringify(body);
}

function parseStreamChunk(apiType, line) {
  if (!line.startsWith("data: ")) return { content: "", reasoningContent: "" };
  const data = line.slice(6);
  if (data === "[DONE]") return { content: "", reasoningContent: "" };
  try {
    const json = JSON.parse(data);
    if (apiType === "anthropic") {
      if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
        return { content: json.delta.text || "", reasoningContent: "" };
      }
      return { content: "", reasoningContent: "" };
    }
    const delta = json.choices?.[0]?.delta || {};
    // Log all keys present in first few chunks
    const keyStr = Object.keys(delta).join(", ");
    if (delta.content || delta.reasoning_content || delta.reasoning) {
      console.log(
        "[DeepPage] delta keys:",
        keyStr,
        "| content:",
        (delta.content || "").slice(0, 60),
        "| reasoning:",
        (delta.reasoning || "").slice(0, 60),
        "| reasoning_content:",
        (delta.reasoning_content || "").slice(0, 60)
      );
    }
    return {
      content: delta.content || "",
      reasoningContent: delta.reasoning_content || delta.reasoning || "",
    };
  } catch {
    return { content: "", reasoningContent: "" };
  }
}

function parseNonStream(apiType, data) {
  if (apiType === "anthropic") {
    return data.content?.map((c) => c.text).join("") || "";
  }
  return data.choices?.[0]?.message?.content || "";
}

function formatError(apiType, data) {
  if (apiType === "anthropic") {
    return data?.error?.message || data?.error?.type || JSON.stringify(data);
  }
  return data?.error?.message || data?.message || JSON.stringify(data);
}

// ===== 非流式聊天 =====
async function handleChat(msg) {
  const settings = await getSettings();
  const {
    apiType,
    baseUrl,
    apiKey,
    model,
    apiProvider,
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
    stopSequences,
    reasoningLevel,
    customSystemPrompt,
  } = settings;
  if (!apiKey) throw new Error("NO_API_KEY");

  let systemPrompt = msg.pageContext
    ? `你是一个网页助手。用户正在浏览以下网页，请根据网页内容回答问题。\n\n标题: ${msg.pageContext.title}\nURL: ${msg.pageContext.url}\n\n网页全文：\n${msg.pageContext.text}`
    : "你是一个网页助手。";
  if (
    reasoningLevel &&
    reasoningLevel !== "off" &&
    !(model && (model.startsWith("o1") || model.startsWith("o3")))
  ) {
    const reasoningPrompts = {
      low: "\n\n请先简单思考再回答。",
      medium: "\n\n请一步步思考，展示推理过程再回答。",
      high: "\n\n请深入思考，详细展示每一步推理过程，再给出最终答案。",
    };
    systemPrompt += reasoningPrompts[reasoningLevel] || "";
  }
  if (customSystemPrompt) {
    systemPrompt += "\n\n" + customSystemPrompt;
  }
  const messages = [{ role: "system", content: systemPrompt }, ...(msg.chatHistory || [])];

  const url = `${baseUrl.replace(/\/+$/, "")}${API_PATHS[apiType]}`;
  const headers =
    apiType === "anthropic"
      ? {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        }
      : { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: buildBody(apiType, model, messages, false, {
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      stopSequences,
      reasoningLevel,
      apiProvider,
      baseUrl,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(formatError(apiType, data));
  return { text: parseNonStream(apiType, data) };
}

// ===== 测试 API 连接 =====
async function testApiConnection() {
  const { apiType, baseUrl, apiKey, model } = await getSettings();
  if (!apiKey) return { ok: false, error: "NO_API_KEY" };

  const testModel =
    apiType === "anthropic" ? model || "claude-3-haiku-20240307" : model || "deepseek-chat";
  const url = `${baseUrl.replace(/\/+$/, "")}${API_PATHS[apiType]}`;
  const headers =
    apiType === "anthropic"
      ? {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        }
      : { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };

  const testMsg =
    apiType === "anthropic"
      ? JSON.stringify({
          model: testModel,
          max_tokens: 1,
          messages: [{ role: "user", content: "Hi" }],
        })
      : JSON.stringify({
          model: testModel,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 1,
          stream: false,
        });

  const resp = await fetch(url, { method: "POST", headers, body: testMsg });
  const data = await resp.json();
  if (!resp.ok) return { ok: false, error: `API ${resp.status}: ${formatError(apiType, data)}` };
  return { ok: true, model: testModel };
}

// ===== 获取模型列表 =====
async function fetchModels() {
  const { apiType, baseUrl, apiKey, model } = await getSettings();
  if (!apiKey) return { models: [], error: "NO_API_KEY" };

  if (apiType === "anthropic") {
    // Anthropic: return hardcoded list
    return {
      models: [
        "claude-sonnet-4-20250514",
        "claude-3-5-sonnet-20241022",
        "claude-3-opus-20240229",
        "claude-3-haiku-20240307",
        "claude-3-5-haiku-20241022",
      ].map((id) => ({ id })),
    };
  }

  // OpenAI-compatible: GET /models
  const url = `${baseUrl.replace(/\/+$/, "")}/models`;
  const headers = { Authorization: `Bearer ${apiKey}` };

  try {
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      return { models: [], error: `API ${resp.status}` };
    }
    const data = await resp.json();
    // Standard OpenAI format: { data: [{ id: "...", ... }, ...] }
    if (data?.data && Array.isArray(data.data)) {
      return { models: data.data };
    }
    return { models: [], error: "Unexpected format" };
  } catch (err) {
    return { models: [], error: err.message };
  }
}

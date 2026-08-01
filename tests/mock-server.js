// DeepPage Mock API Server — OpenAI 兼容，模拟 DeepSeek 流式/非流式响应
// 独立进程运行（playwright webServer），通过 __mock 控制端点与测试交互
const http = require("http");
const PORT = process.env.MOCK_PORT || 18950;

const state = {
  stream: true,
  responseContent: "这是来自 mock 服务器的回复。",
  failNext: false,
  failNonStream: false, // 仅非流式请求失败（用于测标题生成降级，流式对话不受影响）
  delayMs: 0,
  requests: [],
};

function sendJson(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  // 控制端点
  if (req.url.startsWith("/__mock/")) {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.url === "/__mock/config" && req.method === "POST") {
        const cfg = JSON.parse(body || "{}");
        Object.assign(state, cfg);
        sendJson(res, 200, { ok: true, state });
      } else if (req.url === "/__mock/requests" && req.method === "GET") {
        sendJson(res, 200, { requests: state.requests });
      } else if (req.url === "/__mock/reset" && req.method === "POST") {
        state.requests = [];
        state.failNext = false;
        state.failNonStream = false;
        sendJson(res, 200, { ok: true });
      } else {
        sendJson(res, 404, { error: "unknown mock endpoint" });
      }
    });
    return;
  }

  // OpenAI 兼容 API
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    // 静态测试页面（content script 注入用）
    if (req.method === "GET" && (req.url === "/" || req.url === "/test-page")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        '<!DOCTYPE html><html><head><title>Mock Test Page</title></head><body><h1>DeepPage Mock Page</h1><p id="content">这是用于上下文提取的 mock 页面内容。</p><p>Some English text for selection tests.</p><p id="target">Hello SPA world, select this text</p><div id="app"></div></body></html>'
      );
      return;
    }
    // SVG 页面（content script 应跳过注入）
    if (req.method === "GET" && req.url === "/test.svg") {
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      res.end(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>'
      );
      return;
    }
    // XML 页面（content script 应跳过注入）
    if (req.method === "GET" && req.url === "/test.xml") {
      res.writeHead(200, { "Content-Type": "application/xml" });
      res.end('<?xml version="1.0"?><root><item>hello</item></root>');
      return;
    }

    let parsed = {};
    try {
      parsed = JSON.parse(body || "{}");
    } catch {
      /* ignore */
    }
    state.requests.push({ url: req.url, method: req.method, body: parsed });

    if (!req.url.includes("/chat/completions")) {
      sendJson(res, 404, { error: "not found" });
      return;
    }

    if (state.failNext) {
      state.failNext = false;
      sendJson(res, 401, { error: { message: "Invalid API key", type: "authentication_error" } });
      return;
    }

    // 响应格式以请求体 stream 字段为准（模拟真实后端行为）；请求体未声明时退回 state.stream 配置
    const isStream =
      typeof parsed.stream === "boolean" ? parsed.stream : state.stream === true;

    // 非流式请求失败开关：标题生成等非流式请求单独失败，不影响流式对话
    if (state.failNonStream && !isStream) {
      sendJson(res, 401, { error: { message: "Invalid API key", type: "authentication_error" } });
      return;
    }
    const content = state.responseContent;

    if (isStream) {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
      // 逐 token 发送，模拟打字机效果
      for (const ch of content) {
        res.write(
          `data: ${JSON.stringify({ id: "mock-stream", object: "chat.completion.chunk", created: Date.now(), model: "mock", choices: [{ index: 0, delta: { content: ch }, finish_reason: null }] })}\n\n`
        );
      }
      res.write(
        `data: ${JSON.stringify({ id: "mock-stream", object: "chat.completion.chunk", created: Date.now(), model: "mock", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      sendJson(res, 200, {
        id: "mock-chat",
        object: "chat.completion",
        created: Date.now(),
        model: "mock",
        choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: content.length,
          total_tokens: 10 + content.length,
        },
      });
    }
  });
});

server.listen(PORT, () => console.log(`[mock] DeepPage mock API on :${PORT}`));

# DeepPage × OpenClaw Channel 集成研究笔记

> **状态**：预研完成 ✅（2026-08-03，协议已通过真实 Gateway 实测验证）
> **目的**：让 DeepPage 成为 OpenClaw 的浏览器侧边栏 channel——浏览网页时直接与 OpenClaw agent（持久会话 + 工具 + 记忆）对话，页面上下文随消息发送。
> **决策**：实现与否待定。本笔记是将来动手时的完整蓝图。

---

## 1. 结论摘要

- **完全可行**，且不需要写 OpenClaw channel 插件：DeepPage 实现 **Gateway WebSocket 协议 + `chat.*` RPC** 即可成为 WebChat channel 的浏览器客户端（与 Control UI 聊天页、macOS/iOS App 同级）。
- 回复**确定性地路由回发起方**（channel 行为），agent 会话持久化在 Gateway。
- 零 Gateway 侧配置改动（`chatCompletions` 端点不需要开，那是另一条 API 路线）。
- 核心改动集中在 DeepPage 传输层（REST fetch → WS RPC），UI、页面上下文提取、prompt 组装全部复用。

```
┌─ DeepPage (Chrome 扩展) ───────────────────┐     ┌─ OpenClaw Gateway (127.0.0.1:18789) ─┐
│ content script (侧边栏聊天 UI)              │     │                                      │
│   ↕ chrome.runtime                         │ WS  │  WS 协议 (v4) + chat.* RPC            │
│ service worker / content script ───────────┼────→│  → 路由到 agent（coding/main/...）    │
│ (WebSocket 客户端 + Ed25519 设备签名)        │     │  → chat 事件流推送回复                │
└────────────────────────────────────────────┘     └──────────────────────────────────────┘
```

---

## 2. 连接与握手（已实测）

### 2.1 三个必须知道的坑

| 坑 | 说明 | 对策 |
|---|---|---|
| **Origin 白名单** | Gateway 校验 WS 握手 Origin。实测 `Origin: http://127.0.0.1:18789` 放行；浏览器扩展的 WS 会带 `chrome-extension://<extensionId>`，**默认会被拒** | 在 `gateway.controlUi.allowedOrigins` 加入 `chrome-extension://<id>`（或在配置中放行）。⚠️ 这是实施时第一个要处理的配置点 |
| **client.id 白名单** | `connect.params.client.id` 必须是白名单值，否则 `1008 invalid connect params` | 用 `"webchat"`（13 个允许值：`webchat-ui` / `openclaw-control-ui` / `openclaw-tui` / `webchat` / `cli` / `gateway-client` / `openclaw-macos` / `openclaw-ios` / `openclaw-android` / `node-host` / `test` / `fingerprint` / `openclaw-probe`） |
| **裸 token 无 scopes** | 只带 `auth.token`、不带 `device` 的 connect 会被授予**空 scopes**，所有 `chat.*` RPC 返回 `missing scope` | 必须带 **device 字段**（Ed25519 密钥对签名）。loopback 下服务端**自动批准配对**并下发 `deviceToken`，立即获得完整 scopes |

### 2.2 握手流程（协议 v4）

```
1. Client → WS 连接 ws://127.0.0.1:18789（无特殊路径，Origin 头必须合法）
2. Server → {type:"event", event:"connect.challenge", payload:{nonce, ts}}
3. Client → {type:"req", id, method:"connect", params:{...}}   ← 见下
4. Server → {type:"res", id, ok:true, payload:helloOk}         ← 含 auth.scopes + deviceToken
5. 之后：请求 {type:"req", id, method, params} → {type:"res", id, ok, payload|error}
         事件 {type:"event", event, payload, seq}
```

`connect` params 完整结构（实测可用）：

```json
{
  "minProtocol": 4,
  "maxProtocol": 4,
  "client": {
    "id": "webchat",
    "version": "0.1.0",
    "platform": "macos",
    "mode": "webchat",
    "instanceId": "<uuid>"
  },
  "role": "operator",
  "scopes": ["operator.admin", "operator.read", "operator.write", "operator.approvals", "operator.pairing"],
  "device": {
    "id": "<sha256(rawPublicKey).hex>",
    "publicKey": "<raw ed25519 public key, base64url>",
    "signature": "<base64url>",
    "signedAt": 1785728099449,
    "nonce": "<来自 challenge>"
  },
  "caps": ["tool-events"],
  "auth": { "token": "<OPENCLAW_GATEWAY_TOKEN>" },
  "userAgent": "deeppage/1.x.x",
  "locale": "zh-CN"
}
```

### 2.3 设备签名细节（从 OpenClaw 源码确认）

- 算法：**Ed25519**（Web Crypto API 原生支持，浏览器扩展可用 `crypto.subtle.generateKey("Ed25519")`）
- `deviceId` = `sha256(rawPublicKey).hex`（**不是 uuid**）
- `publicKey` = SPKI DER 去掉 12 字节头后的 32 字节 raw key，base64url
- 签名串（UTF-8，用私钥 Ed25519 签名，结果 base64url）：

```
v2|<deviceId>|<clientId>|<clientMode>|<role>|<scopes.join(",")>|<signedAtMs>|<token 或空>|<nonce>
```

- 密钥对**持久化**（如 `chrome.storage.local`），deviceId 稳定 → 配对记录稳定，不重复触发配对
- loopback 连接自动批准配对；非 loopback 需 `openclaw devices approve` 人工批准

### 2.4 参考代码（Node，完整可跑）

见 `docs/examples/gateway-ws-probe.mjs`。关键片段：

```js
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const raw = publicKey.export({ format: "der", type: "spki" }).subarray(12);
const deviceId = crypto.createHash("sha256").update(raw).digest("hex");

function signDevice(nonce) {
  const signedAt = Date.now();
  const msg = `v2|${deviceId}|webchat|webchat|operator|${SCOPES.join(",")}|${signedAt}|${TOKEN}|${nonce}`;
  return {
    id: deviceId,
    publicKey: raw.toString("base64url"),
    signature: crypto.sign(null, Buffer.from(msg), privateKey).toString("base64url"),
    signedAt, nonce,
  };
}
```

---

## 3. RPC 方法（参数已从 Control UI + SDK 源码确认）

### 3.1 `chat.send` —— 发消息

```jsonc
// 请求
{
  "sessionKey": "agent:coding:<peer-id>",   // 必填；任意字符串可用（实测），约定见 §5
  "agentId": "coding",                       // 可选；指定 agent
  "sessionId": "...",                        // 可选
  "message": "总结这个页面",                  // 必填
  "thinking": "high",                        // 可选
  "deliver": false,                          // WebChat 客户端用 false：回复走事件流，不投递外部通道
  "timeoutMs": 120000,                       // 可选
  "idempotencyKey": "<uuid>"                 // 必填；重试去重（Control UI 用 runId）
}
// 响应
{ "runId": "...", "status": "started" }      // status ∈ started/in_flight/ok/timeout/error
```

### 3.2 `chat.history` —— 拉历史

```jsonc
{ "sessionKey": "...", "agentId": "coding", "limit": 50 }
// 响应（实测）
{
  "messages": [
    { "role": "user", "content": "回复：你好" },
    { "role": "assistant", "content": [
        { "type": "thinking", "thinking": "..." },   // 思维链块（若开了思考模式）
        { "type": "text", "text": "你好！" }
    ]}
  ],
  "defaults": { "modelProvider": "deepseek", "model": "deepseek-v4-flash", ... },
  "sessionInfo": { "key": "...", "kind": "..." },
  "agentsList": [...]    // Control UI 同时处理该字段
}
```

- 消息 `content` 是**块数组**：`{type:"text", text}` / `{type:"thinking", thinking}` 等
- `chat.startup` 是更新的变体（带启动上下文），失败可回退 `chat.history`

### 3.3 其他

| 方法 | 参数 | 说明 |
|---|---|---|
| `chat.abort` | `{sessionKey, agentId?, runId?}` | 中止进行中的 run（用 chat.send 返回的 runId） |
| `chat.message.get` | `{sessionKey, agentId?, messageId, maxChars}` | 取单条完整消息（超长历史截断时用） |
| `chat.inject` | `{sessionKey, ...}` | 向会话注入一条 assistant 笔记（无 agent run） |
| `sessions.list` | `{}` | 会话列表（DeepPage 可做"历史会话"侧栏） |
| `agents.list` | `{}` | agent 列表（可做 agent 切换） |

---

## 4. chat 事件流（流式回复，已实测）

`chat.send` 后，服务端通过 **`chat` 事件**推送回复，同一 `runId` 下按 `seq` 递增：

```jsonc
// delta 事件（流式增量）
{ "type": "event", "event": "chat", "payload": {
    "runId": "7f9d17c0...", "sessionKey": "...", "agentId": "coding", "seq": 1,
    "state": "delta",
    "deltaText": "你",                                  // 增量文本
    "message": { "role": "assistant", "content": [{ "type": "text", "text": "你" }] }  // 累积快照
}}

// final 事件（终止）
{ "type": "event", "event": "chat", "payload": {
    "runId": "...", "sessionKey": "...", "agentId": "coding", "seq": 4,
    "state": "final",
    "stopReason": "...",
    "message": { "role": "assistant", "content": [{ "type": "text", "text": "你好！" }] }
}}
```

**渲染策略**（Control UI 同款算法）：
- 优先用 `deltaText` 追加渲染（`message.content[0].text` 是累积值，可用它做一致性校验）
- 若 `replace === true`，`deltaText` 为整体替换（非追加）
- `state: "final" | "aborted" | "error"` 为终止信号
- 思维链块 `{type:"thinking"}` 存在时，UI 可折叠显示或忽略

**其他事件**（无需全部处理，按需订阅）：
- `agent`：agent 运行状态流（`{runId, stream, data, sessionKey, agentId, seq, ts, isHeartbeat}`），**全局广播**——所有连接的客户端都会收到所有 agent 的事件，DeepPage 必须按 `sessionKey` 过滤自己的
- `session.message` / `session.operation` / `session.tool`：订阅的会话细粒度事件
- `chat.send_timing`：性能埋点，可忽略
- `tick`：心跳，可用于连接保活判断

---

## 5. 会话模型

- `sessionKey` 约定格式：`agent:<agentId>:<peer>`（如 `agent:coding:deeppage:tab-<tabId>`）。实测任意字符串均可，但遵循约定便于 Control UI 中归类和 agent 解析。
- **每个网页标签页 = 一个独立会话**：peer 部分用 tabId 或页面 URL host 区分，互不污染。
- 会话持久化在 Gateway，DeepPage 重连后 `chat.history` 拉取，无需本地存储历史。
- 想"新开对话" = 换一个新的 sessionKey。

---

## 6. DeepPage 集成设计

### 6.1 传输层（background.js）

- 新增 `gatewayClient` 模块：WS 连接管理 + 握手 + `request()` 封装 + 事件分发
- 现有 `API_PROVIDERS` / `buildBody` / SSE 解析**原样保留**（直接调 API 的模式仍是功能之一）
- 新增 provider 类型 `openclaw`：走 WS 通道而非 fetch
- API Key 字段填 Gateway token（`$OPENCLAW_GATEWAY_TOKEN`）；设备密钥对持久化在 `chrome.storage.local`

### 6.2 连接生命周期（规避 SW 30s 限制）

| 方案 | 做法 | 适用 |
|---|---|---|
| ① 按需连接 | 发消息时建连，final 事件后关闭 | 改动最小 |
| ② **content script 持连接（推荐）** | 页面开着 → content script 活着 → WS 活着；页面关闭 → 断开 | 天然贴合"浏览网页时使用"，还能收 agent 异步消息 |
| ③ Offscreen Document | MV3 隐藏页，无 30s 限制，全局单连接 | 需要无页面时的全局推送时再上 |

### 6.3 manifest 改动

```json
"host_permissions": [
  "ws://127.0.0.1:18789/*"   // 新增（扩展 WS 需要）
],
"permissions": ["storage", "tabs", "windows", "offscreen"]  // offscreen 仅在方案③需要
```

### 6.4 页面上下文注入

- 现有"总结全文/提炼要点/翻译/选中提问"的 prompt 组装逻辑复用，页面内容作为 user 消息发给 agent
- 会话隔离：每标签页独立 sessionKey

### 6.5 Gateway 侧配置（一次性）

```json
// openclaw.json → gateway.controlUi.allowedOrigins 追加
"chrome-extension://<deeppage-extension-id>"
```

---

## 7. 实测记录（2026-08-03，Gateway 2026.7.1-2，协议 v4）

- ✅ `connect.challenge` → `connect`（device 签名）→ `hello-ok`，scopes 完整授予，下发 `deviceToken`（loopback 自动配对）
- ✅ `chat.history`（不存在会话 key）→ 返回空 messages + defaults + sessionInfo，不报错
- ✅ `chat.send` → `{runId, status:"started"}` → 收到完整 `chat` 事件流（delta × N + final）
- ✅ 落库验证：`chat.history` 能读回 user + assistant 消息
- ✅ `sessions.list`（39 个会话）/ `agents.list`（main/coding/writer/lanco）
- ❌ 裸 token（无 device）→ `scopes: []`，所有 RPC 拒绝
- ❌ client.id 非白名单 → `1008 invalid connect params`
- ❌ Origin 不匹配 → `1008 origin not allowed`
- ⚠️ `agent` 事件全局广播（连探针都能看到其他会话的流），必须按 sessionKey 过滤

---

## 8. 风险与待办

- [ ] 决定是否实现（用户待定）
- [ ] 实测浏览器扩展（`chrome-extension://` Origin + MV3 环境）握手
- [ ] 决定连接方案（①/②/③）
- [ ] agent 在回复中调用工具时的 `chat` 事件形态（工具调用会以多轮 chat 事件呈现，需实测确认 DeepPage 渲染侧如何处理"工具调用中的中间文本"）
- [ ] thinking 块的 UI 展示策略（折叠/忽略）

---

## 附：参考文件

- `docs/examples/gateway-ws-probe.mjs` — 可运行的握手 + 只读 RPC 探针
- OpenClaw 文档：`docs/gateway/protocol.md`、`docs/web/webchat.md`
- OpenClaw 源码（dist）：`device-identity-UW4cZXf5.js`（设备签名）、`client-info-CcqJJIan.js`（client id 白名单）、Control UI `chat-page-*.js`（chat RPC 参考实现）

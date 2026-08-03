// ============================================================
// Gateway WS 协议参考探针（预研用，非 DeepPage 项目代码）
// 已验证：握手(challenge→connect→hello-ok) + chat.send + chat 事件流
// 运行: OPENCLAW_GATEWAY_TOKEN=<token> node gateway-ws-probe.mjs
// 依赖: Node 22+（内置 WebSocket / Ed25519）
// 参考: ../openclaw-channel-integration.md
// ============================================================
import crypto from "node:crypto";

const URL = "ws://127.0.0.1:18789";
const TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;
if (!TOKEN) {
  console.error("缺少 OPENCLAW_GATEWAY_TOKEN");
  process.exit(1);
}

// ---- 设备身份（Ed25519，模拟浏览器扩展的持久化密钥对）----
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const rawPub = publicKey.export({ format: "der", type: "spki" }).subarray(12); // 去 SPKI 头
const deviceId = crypto.createHash("sha256").update(rawPub).digest("hex"); // 注意：不是 uuid！
const publicKeyB64 = rawPub.toString("base64url");

const SCOPES = ["operator.admin", "operator.read", "operator.write", "operator.approvals", "operator.pairing"];
const CLIENT_ID = "webchat"; // 必须在白名单内

function signDevice(nonce) {
  const signedAt = Date.now();
  const msg = `v2|${deviceId}|${CLIENT_ID}|webchat|operator|${SCOPES.join(",")}|${signedAt}|${TOKEN}|${nonce}`;
  return {
    id: deviceId,
    publicKey: publicKeyB64,
    signature: crypto.sign(null, Buffer.from(msg), privateKey).toString("base64url"),
    signedAt,
    nonce,
  };
}

// ---- WS 客户端 ----
const ws = new WebSocket(URL, { headers: { Origin: "http://127.0.0.1:18789" } }); // Origin 必须合法
let connId = 0;
const pending = new Map();
let helloOk = null;

function request(method, params, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const id = `p${++connId}`;
    pending.set(id, { resolve, reject, method });
    ws.send(JSON.stringify({ type: "req", id, method, params }));
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`timeout: ${method}`));
      }
    }, timeoutMs);
  });
}

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.type === "event") {
    if (msg.event === "connect.challenge") {
      ws.send(JSON.stringify({
        type: "req", id: "connect-1", method: "connect",
        params: {
          minProtocol: 4, maxProtocol: 4,
          client: { id: CLIENT_ID, version: "0.1.0", platform: "macos", mode: "webchat", instanceId: crypto.randomUUID() },
          role: "operator", scopes: SCOPES, device: signDevice(msg.payload.nonce),
          caps: ["tool-events"], auth: { token: TOKEN },
          userAgent: "gateway-ws-probe/0.1.0", locale: "zh-CN",
        },
      }));
      return;
    }
    if (msg.event === "chat") {
      const p = msg.payload ?? {};
      console.log(`[chat] state=${p.state} deltaLen=${typeof p.deltaText === "string" ? p.deltaText.length : "-"} runId=${String(p.runId ?? "").slice(0, 8)}`);
      if (p.state === "final" || p.state === "aborted" || p.state === "error") {
        console.log("[chat] 终止:", p.state);
        ws.close();
        process.exit(0);
      }
    }
    return;
  }
  if (msg.type === "res") {
    if (msg.id === "connect-1") { helloOk = msg.ok ? msg.payload : null; return; }
    const p = pending.get(msg.id);
    if (p) { pending.delete(msg.id); msg.ok ? p.resolve(msg.payload) : p.reject(new Error(`${p.method}: ${JSON.stringify(msg.error)}`)); }
  }
});

ws.addEventListener("close", (ev) => console.log(`[close] code=${ev.code} reason=${ev.reason || "(none)"}`));

async function main() {
  const t0 = Date.now();
  while (!helloOk && Date.now() - t0 < 15000) await new Promise((r) => setTimeout(r, 100));
  if (!helloOk) { console.error("[fail] 握手失败"); process.exit(1); }
  console.log("[ok] hello-ok scopes:", JSON.stringify(helloOk.auth.scopes));

  const args = process.argv.slice(2);
  if (args[0] === "probe") {
    // 只读探测
    for (const [name, params] of [
      ["chat.history", { sessionKey: "agent:coding:probe", limit: 3 }],
      ["sessions.list", {}],
      ["agents.list", {}],
    ]) {
      try { const r = await request(name, params); console.log(`[ok] ${name}:`, JSON.stringify(r).slice(0, 300)); }
      catch (e) { console.log(`[fail] ${name}:`, e.message); }
    }
    ws.close();
    return;
  }

  // 默认：发一条消息观察 chat 事件流
  const sessionKey = args[0] ?? "agent:coding:deeppage-probe";
  const message = args[1] ?? "回复两个字：收到";
  const res = await request("chat.send", {
    sessionKey, agentId: "coding", message, deliver: false,
    idempotencyKey: crypto.randomUUID(),
  });
  console.log("[chat.send] response:", JSON.stringify(res));
}

ws.addEventListener("open", () => console.log("[open] connected"));
main();

import { API_PROVIDERS } from "../js/providers.js";

/* global Swal */

// ---- 页面文本本地化 ----
function localizePage() {
  const elements = document.querySelectorAll('[id^="l10n-"]');
  elements.forEach((el) => {
    const key = el.id.replace("l10n-", "");
    const text = t(key);
    if (text) el.textContent = text;
  });
  document.title = t("optionTitle");
  document.getElementById("apiKey").placeholder = t("apiKeyPlaceholder") || "sk-...";
  const sysPrompt = document.getElementById("custom-system-prompt");
  if (sysPrompt)
    sysPrompt.placeholder =
      t("systemPromptPlaceholder") || "e.g. Think step by step, respond in Chinese";
  // 语言切换时清除测试状态
  const testStatus = document.getElementById("testApiStatus");
  if (testStatus) testStatus.textContent = "";
}

// ---- 语言下拉框 ----
function populateLanguageSelect() {
  const select = document.getElementById("language-select");
  const current = getCurrentLang();
  LANGUAGES.forEach((lang) => {
    const opt = document.createElement("option");
    opt.value = lang.code;
    opt.textContent = lang.label;
    if (lang.code === current) opt.selected = true;
    select.appendChild(opt);
  });
}

// ---- About：版本号 + 连点彩蛋 ----
function initAbout() {
  const versionEl = document.getElementById("about-version");
  if (!versionEl) return;
  versionEl.textContent = "v" + chrome.runtime.getManifest().version;
  let clicks = 0;
  let timer = null;
  versionEl.addEventListener("click", () => {
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => (clicks = 0), 1500);
    if (clicks >= 5) {
      clicks = 0;
      const egg = document.getElementById("about-easter-egg");
      if (egg) egg.hidden = false;
      Swal.fire({
        title: t("aboutEasterEggTitle") || "🐘 Easter egg!",
        text: t("aboutEasterEggText") || "",
        icon: "info",
        confirmButtonText: "OK",
      });
    }
  });
}

// ---- 初始化 ----
loadLanguage(() => {
  initTabs();
  localizePage();
  populateLanguageSelect();
  loadSavedData();
  initAbout();
});

// ---- Tab 切换 ----
function initTabs() {
  document.querySelectorAll(".option-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".option-tab").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => (p.style.display = "none"));
      btn.classList.add("active");
      const panel = document.getElementById("tab-" + btn.dataset.tab);
      if (panel) panel.style.display = "";
    });
  });
}

// ---- 常量 ----
let actions = [];
let dragIndex = null; // 拖拽排序：当前拖拽卡片的下标

const container = document.getElementById("actions-container");
const btnAdd = document.getElementById("btn-add");

function getProvider(id) {
  return API_PROVIDERS.find((p) => p.id === id);
}

function populateProviderSelect() {
  const select = document.getElementById("apiProvider");
  select.innerHTML = "";
  API_PROVIDERS.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.label || t("customLabel") || "🔧 Custom";
    select.appendChild(opt);
  });
}

function updateApiUI(providerId) {
  const p = getProvider(providerId);
  if (!p) return;

  // Base URL
  const baseUrlInput = document.getElementById("apiBaseUrl");
  if (p.id !== "custom" && p.baseUrl) {
    baseUrlInput.value = p.baseUrl;
    baseUrlInput.disabled = false;
  } else {
    baseUrlInput.value = "";
    baseUrlInput.disabled = false;
  }
  baseUrlInput.placeholder =
    p.id === "custom"
      ? p.type === "anthropic"
        ? "https://api.anthropic.com"
        : "https://api.deepseek.com/v1"
      : p.baseUrl;

  // Model — populate select with default for known providers
  const modelSelect = document.getElementById("apiModel");
  if (p.id !== "custom" && p.model) {
    modelSelect.innerHTML = `<option value="${p.model}">${p.model}</option>`;
    modelSelect.value = p.model;
  } else {
    modelSelect.innerHTML = `<option value="">${t("selectModelPlaceholder") || "-- select or enter model name --"}</option>`;
  }

  // API Type selector (for Custom)
  const customTypeSection = document.getElementById("api-custom-type-section");
  if (p.id === "custom") {
    customTypeSection.style.display = "";
    const apiTypeSelect = document.getElementById("apiType");
    // Preserve user's last choice if switching between custom types
    const stored = localStorage.getItem("deeppage_custom_api_type");
    if (stored) apiTypeSelect.value = stored;
  } else {
    customTypeSection.style.display = "none";
    const apiTypeSelect = document.getElementById("apiType");
    apiTypeSelect.value = p.type;
  }

  // Key placeholder & link
  const keyInput = document.getElementById("apiKey");
  keyInput.placeholder = p.id === "anthropic" ? "sk-ant-..." : "sk-...";
  const link = document.querySelector("#apiKeyLink a");
  if (link) {
    link.href = p.keyLink || "https://platform.deepseek.com/api_keys";
  }
}

// ---- 渲染卡片列表 ----
function render() {
  container.innerHTML = "";
  actions.forEach((action, i) => {
    const card = document.createElement("div");
    card.className = "action-card";
    card.innerHTML = `
      <div class="action-card-header">
        <span class="action-card-drag" draggable="true" title="${t("dragSortHint")}">⠿</span>
        <span class="action-card-index">${i + 1}</span>
        <input class="action-card-label-input" type="text" placeholder="${t("buttonLabelPlaceholder")}" />
        <button class="action-card-del" title="${t("deleteButton")}">✕</button>
      </div>
      <div class="action-card-body">
        <label>${t("promptLabel")}</label>
        <textarea class="fld-prompt" rows="2" placeholder="${t("promptPlaceholder")}"></textarea>
        <label>${t("thinkingModeLabel")}</label>
        <select class="fld-thinking">
          <option value="default">${t("thinkingFollowGlobal")}</option>
          <option value="off">${t("thinkingOff")}</option>
        </select>
      </div>
    `;
    card.querySelector(".action-card-label-input").value = action.label || "";
    card.querySelector(".fld-prompt").value = action.prompt || "";
    card.querySelector(".fld-thinking").value = action.thinking || "default";
    card.querySelector(".action-card-del").addEventListener("click", () => {
      actions.splice(i, 1);
      render();
    });
    container.appendChild(card);
  });
}

// ---- 快捷按钮拖拽排序（原生 HTML5 DnD，把手触发） ----
container.addEventListener("dragstart", (e) => {
  const handle = e.target.closest(".action-card-drag");
  const card = handle && handle.closest(".action-card");
  if (!card) return;
  dragIndex = [...container.children].indexOf(card);
  card.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  // Firefox 需要 setData 才会启动拖拽
  e.dataTransfer.setData("text/plain", String(dragIndex));
});

container.addEventListener("dragover", (e) => {
  e.preventDefault(); // 允许 drop
  const card = e.target.closest(".action-card");
  if (!card || dragIndex === null) return;
  const cards = [...container.children];
  const targetIndex = cards.indexOf(card);
  if (targetIndex === -1 || targetIndex === dragIndex) return;
  const dragged = cards[dragIndex];
  if (targetIndex < dragIndex) {
    container.insertBefore(dragged, card);
  } else {
    container.insertBefore(dragged, card.nextSibling);
  }
  dragIndex = targetIndex;
});

container.addEventListener("drop", (e) => {
  e.preventDefault();
  if (dragIndex === null) return;
  dragIndex = null;
  // 从当前 DOM 顺序重建 actions（dragover 已实时重排 DOM，render 依赖 actions 数组）
  const reordered = [];
  container.querySelectorAll(".action-card").forEach((card) => {
    const label = card.querySelector(".action-card-label-input").value.trim();
    const prompt = card.querySelector(".fld-prompt").value.trim();
    const thinking = card.querySelector(".fld-thinking").value;
    if (label) reordered.push({ label, prompt, thinking });
  });
  actions = reordered;
  render(); // 刷新序号
  autoSave(); // 持久化新顺序 → quickActions
});

container.addEventListener("dragend", () => {
  container.querySelectorAll(".action-card").forEach((c) => c.classList.remove("dragging"));
  if (dragIndex !== null) {
    // 拖拽取消（drop 落在卡片外）：DOM 已在 dragover 中被实时重排，恢复原顺序
    dragIndex = null;
    render();
  }
  dragIndex = null;
});

// ---- Range slider helpers ----
function initRange(id, key, defaultVal) {
  const input = document.getElementById(id);
  const display = document.getElementById(id + "-value");
  chrome.storage.sync.get(key, (result) => {
    const val = result[key] !== undefined ? result[key] : defaultVal;
    input.value = val;
    if (display) display.textContent = val;
  });
  input.addEventListener("input", () => {
    if (display) display.textContent = input.value;
  });
  input.addEventListener("change", autoSave);
}

// ---- 加载 ----
function loadSavedData() {
  chrome.storage.sync.get(
    [
      "apiProvider",
      "apiBaseUrl",
      "apiKey",
      "apiModel",
      "deepseekApiKey", // fallback
      "quickActions",
      "quickActionsLang",
      // new params
      "streamOutput",
      "temperature",
      "maxTokens",
      "topP",
      "frequencyPenalty",
      "presencePenalty",
      "stopSequences",
      "reasoningLevel",
      "customSystemPrompt",
    ],
    (result) => {
      // Init provider select
      populateProviderSelect();

      const providerId = result.apiProvider || "deepseek";
      document.getElementById("apiProvider").value = providerId;
      updateApiUI(providerId);

      // Base URL (only use stored value if Custom or user edited it)
      const baseUrlInput = document.getElementById("apiBaseUrl");
      const storedUrl = result.apiBaseUrl;
      if (storedUrl && providerId === "custom") {
        baseUrlInput.value = storedUrl;
      } else if (
        storedUrl &&
        API_PROVIDERS.find((p) => p.id === providerId && p.baseUrl !== storedUrl)
      ) {
        // User may have customized URL
        baseUrlInput.value = storedUrl;
      }

      // API Key — 🔒 仅本地保存；local 优先，旧 sync 数据仅作显示回退
      chrome.storage.local.get(["apiKey", "deepseekApiKey"], (localRes) => {
        const key =
          localRes.apiKey ||
          localRes.deepseekApiKey ||
          result.apiKey ||
          result.deepseekApiKey ||
          "";
        document.getElementById("apiKey").value = key;
      });

      // Model — populate select
      const modelSelect = document.getElementById("apiModel");
      const p = getProvider(providerId);
      if (p && p.id !== "custom" && p.model && !result.apiModel) {
        modelSelect.innerHTML = `<option value="${p.model}">${p.model}</option>`;
        modelSelect.value = p.model;
      } else if (result.apiModel) {
        modelSelect.innerHTML = `<option value="${result.apiModel}">${result.apiModel}</option>`;
        modelSelect.value = result.apiModel;
      }

      // New params
      if (result.streamOutput !== undefined)
        document.getElementById("stream-output-toggle").checked = result.streamOutput;
      if (result.temperature !== undefined)
        document.getElementById("temperature").value = result.temperature;
      if (result.maxTokens !== undefined)
        document.getElementById("max-tokens").value = result.maxTokens;
      if (result.topP !== undefined) document.getElementById("top-p").value = result.topP;
      if (result.frequencyPenalty !== undefined)
        document.getElementById("frequency-penalty").value = result.frequencyPenalty;
      if (result.presencePenalty !== undefined)
        document.getElementById("presence-penalty").value = result.presencePenalty;
      if (result.reasoningLevel)
        document.getElementById("reasoning-level").value = result.reasoningLevel;
      if (result.stopSequences)
        document.getElementById("stop-sequences").value = result.stopSequences;
      if (result.customSystemPrompt)
        document.getElementById("custom-system-prompt").value = result.customSystemPrompt;

      // Quick actions
      const currentLang = getCurrentLang();
      const savedLang = result.quickActionsLang;
      const defaults = [
        { label: t("defaultSummarizeLabel"), prompt: t("defaultSummarizePrompt"), thinking: "off" },
        { label: t("defaultOutlineLabel"), prompt: t("defaultOutlinePrompt"), thinking: "off" },
        { label: t("defaultTranslateLabel"), prompt: t("defaultTranslatePrompt"), thinking: "off" },
      ];
      if (result.quickActions && result.quickActions.length && savedLang === currentLang) {
        // 迁移：旧快照没有 thinking 字段 → 与当前默认完全一致的原封默认动作补 "off"，其余补 "default"（跟随全局）
        actions = result.quickActions.map((a) => {
          const base = { label: a.label, prompt: a.prompt };
          if (a.thinking) return { ...base, thinking: a.thinking };
          const isUntouchedDefault = defaults.some(
            (d) => d.label === a.label && d.prompt === a.prompt
          );
          return { ...base, thinking: isUntouchedDefault ? "off" : "default" };
        });
      } else {
        actions = defaults.map((a) => ({ ...a }));
      }
      render();
    }
  );
}

// ---- Provider 切换 ----
document.getElementById("apiProvider").addEventListener("change", (e) => {
  updateApiUI(e.target.value);
  // Clear key (switching provider should prompt re-entry)
  document.getElementById("apiKey").value = "";
});

// ---- API Type 切换 (Custom) ----
document.getElementById("apiType").addEventListener("change", (e) => {
  localStorage.setItem("deeppage_custom_api_type", e.target.value);
});

// ---- 语言切换 ----
document.getElementById("language-select").addEventListener("change", (e) => {
  setLanguage(e.target.value, () => {
    localizePage();
    loadSavedData();
  });
});

// ---- Dark mode ----
const darkToggle = document.getElementById("dark-mode-toggle");
chrome.storage.sync.get("darkMode", (result) => {
  darkToggle.checked = !!result.darkMode;
  applyOptionsDarkMode(!!result.darkMode);
});
darkToggle.addEventListener("change", () => {
  applyOptionsDarkMode(darkToggle.checked);
  chrome.storage.sync.set({ darkMode: darkToggle.checked });
});
function applyOptionsDarkMode(dark) {
  document.body.classList.toggle("__dp-dark-options", dark);
}

// ---- 新增参数选项卡 ----
function initAdvancedToggle() {
  const toggle = document.getElementById("advanced-toggle");
  const container = document.getElementById("advanced-params");
  const arrow = document.getElementById("advanced-arrow");
  if (!toggle || !container) return;
  // Check if previously expanded
  chrome.storage.local.get("advancedParamsOpen", (result) => {
    if (result.advancedParamsOpen) {
      container.style.display = "";
      if (arrow) arrow.textContent = "▼";
    }
  });
  toggle.addEventListener("click", () => {
    const isOpen = container.style.display !== "none";
    container.style.display = isOpen ? "none" : "";
    if (arrow) arrow.textContent = isOpen ? "▶" : "▼";
    chrome.storage.local.set({ advancedParamsOpen: !isOpen });
  });
}

// ---- Range sliders — display values ----
initRange("temperature", "temperature", 1.0);
initRange("max-tokens", "maxTokens", 4096);
initRange("top-p", "topP", 1.0);
initRange("frequency-penalty", "frequencyPenalty", 0);
initRange("presence-penalty", "presencePenalty", 0);
initAdvancedToggle();

// ---- 最大对话轮数（已搬至 API Tab） ----
const maxRoundsInput = document.getElementById("max-rounds");
const maxRoundsValue = document.getElementById("max-rounds-value");
if (maxRoundsInput) {
  chrome.storage.sync.get("maxRounds", (result) => {
    const val = result.maxRounds || 20;
    maxRoundsInput.value = val;
    maxRoundsValue.textContent = val;
  });
  maxRoundsInput.addEventListener("input", () => {
    maxRoundsValue.textContent = maxRoundsInput.value;
  });
}

// ---- 页面正文截断长度 ----
const maxContextInput = document.getElementById("max-context-len");
const maxContextValue = document.getElementById("max-context-len-value");
if (maxContextInput) {
  chrome.storage.sync.get("maxContextLen", (result) => {
    const val = result.maxContextLen || 15000;
    maxContextInput.value = val;
    maxContextValue.textContent = val;
  });
  maxContextInput.addEventListener("input", () => {
    maxContextValue.textContent = maxContextInput.value;
  });
}

// ---- 测试连接 ----
document.getElementById("testApiBtn").addEventListener("click", async () => {
  const btn = document.getElementById("testApiBtn");
  const statusEl = document.getElementById("testApiStatus");
  btn.disabled = true;
  btn.textContent = (t("testApiButton") || "Test Connection") + "...";
  statusEl.textContent = "";

  const providerId = document.getElementById("apiProvider").value;
  const provider = getProvider(providerId);
  const apiType =
    providerId === "custom" ? document.getElementById("apiType").value : provider.type;
  const baseUrl = document.getElementById("apiBaseUrl").value.trim();
  const apiKey = document.getElementById("apiKey").value.trim();
  const model = document.getElementById("apiModel").value.trim();

  if (!baseUrl || !apiKey || !model) {
    statusEl.textContent = t("testApiRequired") || "⚠️ Fill in Base URL, API Key, and Model first";
    statusEl.style.color = "#f59e0b";
    toastError(t("testApiRequired") || "⚠️ Fill in Base URL, API Key, and Model first");
    btn.disabled = false;
    btn.textContent = t("testApiButton") || "Test Connection";
    return;
  }

  // Save first — 🔒 API Key 仅存本地，其余设置仍同步
  const settingsToSync = {
    apiProvider: providerId,
    apiBaseUrl: baseUrl,
    apiModel: model,
    apiType: providerId === "custom" ? apiType : undefined,
  };
  if (apiKey) {
    await chrome.storage.local.set({ apiKey });
  } else {
    await chrome.storage.local.remove("apiKey");
  }
  await chrome.storage.sync.set(settingsToSync);

  try {
    const result = await chrome.runtime.sendMessage({ action: "testApi" });
    if (result.ok) {
      statusEl.textContent = t("testApiSuccess") || "✅ Connection OK";
      statusEl.style.color = "#34d399";
      toastSuccess(t("testApiSuccess") || "✅ Connection OK");
      // 测试成功后获取模型列表
      chrome.runtime.sendMessage({ action: "getModels" }).then((modelsResult) => {
        if (modelsResult.models && modelsResult.models.length > 0) {
          const modelSelect = document.getElementById("apiModel");
          const currentVal = modelSelect.value;
          modelSelect.innerHTML = `<option value="">${t("selectModelPlaceholder") || "-- select or enter model name --"}</option>`;
          modelsResult.models.forEach((m) => {
            const opt = document.createElement("option");
            opt.value = m.id;
            opt.textContent = m.id;
            modelSelect.appendChild(opt);
          });
          if (currentVal && [...modelSelect.options].some((o) => o.value === currentVal)) {
            modelSelect.value = currentVal;
          }
        }
      });
    } else {
      statusEl.textContent = (t("testApiFailed") || "❌ Connection failed:") + (result.error || "");
      statusEl.style.color = "#f87171";
      toastError((t("testApiFailed") || "❌ Connection failed:") + (result.error || ""));
    }
  } catch (err) {
    statusEl.textContent = (t("testApiFailed") || "❌ Connection failed:") + err.message;
    statusEl.style.color = "#f87171";
    toastError((t("testApiFailed") || "❌ Connection failed:") + err.message);
  }

  btn.disabled = false;
  btn.textContent = t("testApiButton") || "Test Connection";
});

// ---- 刷新模型列表 ----
document.getElementById("refreshModelsBtn").addEventListener("click", async () => {
  const btn = document.getElementById("refreshModelsBtn");
  btn.textContent = "⟳";
  btn.disabled = true;
  try {
    const result = await chrome.runtime.sendMessage({ action: "getModels" });
    if (result.models && result.models.length > 0) {
      const modelSelect = document.getElementById("apiModel");
      const currentVal = modelSelect.value;
      modelSelect.innerHTML = `<option value="">${t("selectModelPlaceholder") || "-- select or enter model name --"}</option>`;
      result.models.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.id;
        modelSelect.appendChild(opt);
      });
      if (currentVal && [...modelSelect.options].some((o) => o.value === currentVal)) {
        modelSelect.value = currentVal;
      }
    }
  } catch (_) {}
  btn.disabled = false;
  btn.textContent = "↻";
});

// ---- 添加按钮 ----
btnAdd.addEventListener("click", () => {
  actions.push({ label: t("newButtonLabel"), prompt: "" });
  render();
  const cards = container.querySelectorAll(".action-card");
  if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: "smooth" });
});

// ---- 自动保存 ----
// 保存成功 toast 防抖：连续保存（如快速切换多个设置）只提示一次
let _saveToastTimer = null;
function autoSave() {
  const providerId = document.getElementById("apiProvider").value;
  const provider = getProvider(providerId);
  const apiType =
    providerId === "custom"
      ? document.getElementById("apiType").value
      : provider
        ? provider.type
        : "openai";
  const baseUrl = document.getElementById("apiBaseUrl").value.trim();
  const apiKey = document.getElementById("apiKey").value.trim();
  const model = document.getElementById("apiModel").value.trim();

  const cards = container.querySelectorAll(".action-card");
  const cleaned = [];
  cards.forEach((card) => {
    const label = card.querySelector(".action-card-label-input").value.trim();
    const prompt = card.querySelector(".fld-prompt").value.trim();
    const thinking = card.querySelector(".fld-thinking").value;
    if (label) cleaned.push({ label, prompt, thinking });
  });

  // 🔒 API Key 仅存本地，其余设置仍同步
  if (apiKey) {
    chrome.storage.local.set({ apiKey });
  } else {
    chrome.storage.local.remove("apiKey");
  }
  chrome.storage.sync.set(
    {
      apiProvider: providerId,
      apiBaseUrl: baseUrl,
      apiModel: model,
      apiType: providerId === "custom" ? apiType : undefined,
      quickActions: cleaned,
      quickActionsLang: getCurrentLang(),
      maxRounds: maxRoundsInput ? parseInt(maxRoundsInput.value, 10) || 20 : 20,
      maxContextLen: maxContextInput ? parseInt(maxContextInput.value, 10) || 15000 : 15000,
      streamOutput: document.getElementById("stream-output-toggle").checked,
      // new params
      temperature: parseFloat(document.getElementById("temperature").value) || 1.0,
      maxTokens: parseInt(document.getElementById("max-tokens").value, 10) || 4096,
      topP: parseFloat(document.getElementById("top-p").value) || 1.0,
      frequencyPenalty: parseFloat(document.getElementById("frequency-penalty").value) || 0,
      presencePenalty: parseFloat(document.getElementById("presence-penalty").value) || 0,
      stopSequences: document.getElementById("stop-sequences").value.trim(),
      reasoningLevel: document.getElementById("reasoning-level").value,
      customSystemPrompt: document.getElementById("custom-system-prompt").value.trim(),
    },
    () => {
      clearTimeout(_saveToastTimer);
      _saveToastTimer = setTimeout(() => {
        toastSuccess(t("savedSuccess") || "✅ Saved");
      }, 400);
    }
  );
  actions = cleaned;
}

// Bind auto-save to settings changes
document.getElementById("apiProvider").addEventListener("change", autoSave);
document.getElementById("apiBaseUrl").addEventListener("change", autoSave);
document.getElementById("apiKey").addEventListener("change", autoSave);
document.getElementById("apiModel").addEventListener("change", autoSave);
document.getElementById("apiType").addEventListener("change", autoSave);
if (maxRoundsInput) maxRoundsInput.addEventListener("change", autoSave);
if (maxContextInput) maxContextInput.addEventListener("change", autoSave);
document.getElementById("stream-output-toggle").addEventListener("change", autoSave);
document.getElementById("temperature").addEventListener("change", autoSave);
document.getElementById("max-tokens").addEventListener("change", autoSave);
document.getElementById("top-p").addEventListener("change", autoSave);
document.getElementById("frequency-penalty").addEventListener("change", autoSave);
document.getElementById("presence-penalty").addEventListener("change", autoSave);
document.getElementById("stop-sequences").addEventListener("change", autoSave);
document.getElementById("reasoning-level").addEventListener("change", autoSave);
document.getElementById("custom-system-prompt").addEventListener("change", autoSave);

// Quick action card changes (delegated — read DOM, no re-render to keep focus)
container.addEventListener("input", autoSave);

// Language change already handles saving via setStoredLanguage

// ---- 重置所有设置 ----
document.getElementById("reset-all-btn").addEventListener("click", () => {
  const msg = t("resetConfirm") || "确定要重置所有设置吗？此操作不可撤销。";
  if (!confirm(msg)) return;
  chrome.storage.sync.clear(() => {
    // 🔒 同时清除本地保存的 API Key
    chrome.storage.local.remove(["apiKey", "deepseekApiKey", "advancedParamsOpen"], () => {
      location.reload();
    });
  });
});

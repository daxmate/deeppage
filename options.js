// ---- 页面文本本地化 ----
function localizePage() {
  const elements = document.querySelectorAll('[id^="l10n-"]');
  elements.forEach((el) => {
    const key = el.id.replace('l10n-', '');
    const text = t(key);
    if (text) el.textContent = text;
  });
  document.title = t('optionTitle');
  document.getElementById('apiKey').placeholder = t('apiKeyPlaceholder') || 'sk-...';
  // 语言切换时清除测试状态
  const testStatus = document.getElementById('testApiStatus');
  if (testStatus) testStatus.textContent = '';
}

// ---- 语言下拉框 ----
function populateLanguageSelect() {
  const select = document.getElementById('language-select');
  const current = getCurrentLang();
  LANGUAGES.forEach((lang) => {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = lang.label;
    if (lang.code === current) opt.selected = true;
    select.appendChild(opt);
  });
}

// ---- 初始化 ----
loadLanguage(() => {
  initTabs();
  localizePage();
  populateLanguageSelect();
  loadSavedData();
});

// ---- Tab 切换 ----
function initTabs() {
  document.querySelectorAll('.option-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.option-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      const panel = document.getElementById('tab-' + btn.dataset.tab);
      if (panel) panel.style.display = '';
    });
  });
}

// ---- 常量 ----
let actions = [];

const container = document.getElementById('actions-container');
const btnAdd = document.getElementById('btn-add');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

// ---- API 提供商列表 ----
const API_PROVIDERS = [
  { id: 'deepseek',   label: 'DeepSeek',                      type: 'openai',    baseUrl: 'https://api.deepseek.com/v1',                       model: 'deepseek-v4-flash',                     keyLink: 'https://platform.deepseek.com/api_keys' },
  { id: 'moonshot',   label: '月之暗面 Moonshot',              type: 'openai',    baseUrl: 'https://api.moonshot.cn/v1',                        model: 'kimi-latest',                           keyLink: 'https://platform.moonshot.cn/console/api-keys' },
  { id: 'zhipu',      label: '智谱 AI ZhipuAI',                type: 'openai',    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',             model: 'glm-4-plus',                            keyLink: 'https://open.bigmodel.cn/usercenter/apikeys' },
  { id: 'qwen',       label: '阿里通义 Qwen',                   type: 'openai',    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo',                            keyLink: 'https://bailian.console.aliyun.com/#/api-key' },
  { id: 'doubao',     label: '字节豆包 Doubao',                type: 'openai',    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',          model: 'ep-20250601000000-sample',              keyLink: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey' },
  { id: 'yi',         label: '零一万物 01.AI Yi',               type: 'openai',    baseUrl: 'https://api.lingyiwanwu.com/v1',                    model: 'yi-lightning',                          keyLink: 'https://platform.lingyiwanwu.com/api-keys' },
  { id: 'siliconflow',label: '硅基流动 SiliconFlow',            type: 'openai',    baseUrl: 'https://api.siliconflow.cn/v1',                     model: 'deepseek-v4-flash',                     keyLink: 'https://cloud.siliconflow.cn/account/ak' },
  { id: 'openai',     label: 'OpenAI',                         type: 'openai',    baseUrl: 'https://api.openai.com/v1',                         model: 'gpt-4o-mini',                           keyLink: 'https://platform.openai.com/api-keys' },
  { id: 'groq',       label: 'Groq',                           type: 'openai',    baseUrl: 'https://api.groq.com/openai/v1',                    model: 'llama3-70b-8192',                       keyLink: 'https://console.groq.com/keys' },
  { id: 'ollama',     label: 'Ollama (Local)',                 type: 'openai',    baseUrl: 'http://localhost:11434/v1',                         model: 'llama3.2',                              keyLink: '' },
  { id: 'together',   label: 'Together AI',                    type: 'openai',    baseUrl: 'https://api.together.xyz/v1',                       model: 'mistralai/Mixtral-8x22B-Instruct-v0.1', keyLink: 'https://api.together.ai/settings/api-keys' },
  { id: 'anthropic',  label: 'Anthropic',                      type: 'anthropic', baseUrl: 'https://api.anthropic.com',                         model: 'claude-sonnet-4-20250514',              keyLink: 'https://console.anthropic.com/settings/keys' },
  { id: 'custom',     label: null,                        type: 'openai',    baseUrl: '',                                                 model: '',                                      keyLink: '' },
];

function getProvider(id) {
  return API_PROVIDERS.find(p => p.id === id);
}

function populateProviderSelect() {
  const select = document.getElementById('apiProvider');
  select.innerHTML = '';
  API_PROVIDERS.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label || t('customLabel') || '🔧 Custom';
    select.appendChild(opt);
  });
}

function updateApiUI(providerId) {
  const p = getProvider(providerId);
  if (!p) return;

  // Base URL
  const baseUrlInput = document.getElementById('apiBaseUrl');
  if (p.id !== 'custom' && p.baseUrl) {
    baseUrlInput.value = p.baseUrl;
    baseUrlInput.disabled = false;
  } else {
    baseUrlInput.value = '';
    baseUrlInput.disabled = false;
  }
  baseUrlInput.placeholder = p.id === 'custom'
    ? (p.type === 'anthropic' ? 'https://api.anthropic.com' : 'https://api.deepseek.com/v1')
    : p.baseUrl;

  // Model — populate select with default for known providers
  const modelSelect = document.getElementById('apiModel');
  if (p.id !== 'custom' && p.model) {
    modelSelect.innerHTML = `<option value="${p.model}">${p.model}</option>`;
    modelSelect.value = p.model;
  } else {
    modelSelect.innerHTML = `<option value="">${t('selectModelPlaceholder') || '-- select or enter model name --'}</option>`;
  }

  // API Type selector (for Custom)
  const customTypeSection = document.getElementById('api-custom-type-section');
  if (p.id === 'custom') {
    customTypeSection.classList.remove('__dp-hidden');
    const apiTypeSelect = document.getElementById('apiType');
    // Preserve user's last choice if switching between custom types
    const stored = localStorage.getItem('deeppage_custom_api_type');
    if (stored) apiTypeSelect.value = stored;
  } else {
    customTypeSection.classList.add('__dp-hidden');
    const apiTypeSelect = document.getElementById('apiType');
    apiTypeSelect.value = p.type;
  }

  // Key placeholder & link
  const keyInput = document.getElementById('apiKey');
  keyInput.placeholder = p.id === 'anthropic' ? 'sk-ant-...' : 'sk-...';
  const link = document.querySelector('#apiKeyLink a');
  if (link) {
    link.href = p.keyLink || 'https://platform.deepseek.com/api_keys';
  }
}

// ---- 渲染卡片列表 ----
function render() {
  container.innerHTML = '';
  actions.forEach((action, i) => {
    const card = document.createElement('div');
    card.className = 'action-card';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-index">${i + 1}</span>
        <label>${t('buttonLabel')}</label>
        <input class="fld-label" type="text" placeholder="${t('buttonLabelPlaceholder')}" />
        <button class="btn-del" title="${t('deleteButton')}">✕</button>
      </div>
      <label>${t('promptLabel')}</label>
      <textarea class="fld-prompt" rows="2" placeholder="${t('promptPlaceholder')}"></textarea>
    `;
    card.querySelector('.fld-label').value = action.label || '';
    card.querySelector('.fld-prompt').value = action.prompt || '';
    card.querySelector('.btn-del').addEventListener('click', () => {
      actions.splice(i, 1);
      render();
    });
    container.appendChild(card);
  });
}

// ---- 加载 ----
function loadSavedData() {
  chrome.storage.sync.get(
    ['apiProvider', 'apiBaseUrl', 'apiKey', 'apiModel',
     'deepseekApiKey', // fallback
     'quickActions', 'quickActionsLang'],
    (result) => {
      // Init provider select
      populateProviderSelect();

      const providerId = result.apiProvider || 'deepseek';
      document.getElementById('apiProvider').value = providerId;
      updateApiUI(providerId);

      // Base URL (only use stored value if Custom or user edited it)
      const baseUrlInput = document.getElementById('apiBaseUrl');
      const storedUrl = result.apiBaseUrl;
      if (storedUrl && providerId === 'custom') {
        baseUrlInput.value = storedUrl;
      } else if (storedUrl && API_PROVIDERS.find(p => p.id === providerId && p.baseUrl !== storedUrl)) {
        // User may have customized URL
        baseUrlInput.value = storedUrl;
      }

      // API Key — new apiKey first, fallback deepseekApiKey
      document.getElementById('apiKey').value = result.apiKey || result.deepseekApiKey || '';

      // Model — populate select
      const modelSelect = document.getElementById('apiModel');
      const p = getProvider(providerId);
      if (p && p.id !== 'custom' && p.model && !result.apiModel) {
        modelSelect.innerHTML = `<option value="${p.model}">${p.model}</option>`;
        modelSelect.value = p.model;
      } else if (result.apiModel) {
        modelSelect.innerHTML = `<option value="${result.apiModel}">${result.apiModel}</option>`;
        modelSelect.value = result.apiModel;
      }

      // Quick actions
      const currentLang = getCurrentLang();
      const savedLang = result.quickActionsLang;
      const defaults = [
        { label: t('defaultSummarizeLabel'), prompt: t('defaultSummarizePrompt') },
        { label: t('defaultOutlineLabel'), prompt: t('defaultOutlinePrompt') },
        { label: t('defaultTranslateLabel'), prompt: t('defaultTranslatePrompt') },
      ];
      if (result.quickActions && result.quickActions.length && savedLang === currentLang) {
        actions = result.quickActions.map(a => ({ label: a.label, prompt: a.prompt }));
      } else {
        actions = defaults.map(a => ({ ...a }));
      }
      render();
    },
  );
}

// ---- Provider 切换 ----
document.getElementById('apiProvider').addEventListener('change', (e) => {
  updateApiUI(e.target.value);
  // Clear key (switching provider should prompt re-entry)
  document.getElementById('apiKey').value = '';
});

// ---- API Type 切换 (Custom) ----
document.getElementById('apiType').addEventListener('change', (e) => {
  localStorage.setItem('deeppage_custom_api_type', e.target.value);
});

// ---- 语言切换 ----
document.getElementById('language-select').addEventListener('change', (e) => {
  window.__dp_lang = e.target.value;
  setStoredLanguage(e.target.value, () => {
    localizePage();
    loadSavedData();
  });
});

// ---- Dark mode ----
const darkToggle = document.getElementById('dark-mode-toggle');
chrome.storage.sync.get('darkMode', (result) => {
  darkToggle.checked = !!result.darkMode;
  applyOptionsDarkMode(!!result.darkMode);
});
darkToggle.addEventListener('change', () => {
  applyOptionsDarkMode(darkToggle.checked);
  chrome.storage.sync.set({ darkMode: darkToggle.checked });
});
function applyOptionsDarkMode(dark) {
  document.body.classList.toggle('__dp-dark-options', dark);
}

// ---- 最大对话轮数 ----
const maxRoundsInput = document.getElementById('max-rounds');
const maxRoundsValue = document.getElementById('max-rounds-value');
chrome.storage.sync.get('maxRounds', (result) => {
  const val = result.maxRounds || 20;
  maxRoundsInput.value = val;
  maxRoundsValue.textContent = val;
});
maxRoundsInput.addEventListener('input', () => {
  maxRoundsValue.textContent = maxRoundsInput.value;
});

// ---- 测试连接 ----
document.getElementById('testApiBtn').addEventListener('click', async () => {
  const btn = document.getElementById('testApiBtn');
  const statusEl = document.getElementById('testApiStatus');
  btn.disabled = true;
  btn.textContent = (t('testApiButton') || 'Test Connection') + '...';
  statusEl.textContent = '';

  const providerId = document.getElementById('apiProvider').value;
  const provider = getProvider(providerId);
  const apiType = providerId === 'custom'
    ? document.getElementById('apiType').value
    : provider.type;
  const baseUrl = document.getElementById('apiBaseUrl').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  const model = document.getElementById('apiModel').value.trim();

  if (!baseUrl || !apiKey || !model) {
    statusEl.textContent = (t('testApiRequired') || '⚠️ Fill in Base URL, API Key, and Model first');
    statusEl.style.color = '#f59e0b';
    btn.disabled = false;
    btn.textContent = t('testApiButton') || 'Test Connection';
    return;
  }

  // Save first
  await chrome.storage.sync.set({
    apiProvider: providerId, apiBaseUrl: baseUrl, apiKey, apiModel: model,
    apiType: providerId === 'custom' ? apiType : undefined,
  });

  try {
    const result = await chrome.runtime.sendMessage({ action: 'testApi' });
    if (result.ok) {
      statusEl.textContent = t('testApiSuccess') || '✅ Connection OK';
      statusEl.style.color = '#34d399';
      // 测试成功后获取模型列表
      chrome.runtime.sendMessage({ action: 'getModels' }).then(modelsResult => {
        if (modelsResult.models && modelsResult.models.length > 0) {
          const modelSelect = document.getElementById('apiModel');
          const currentVal = modelSelect.value;
          modelSelect.innerHTML = `<option value="">${t('selectModelPlaceholder') || '-- select or enter model name --'}</option>`;
          modelsResult.models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.id;
            modelSelect.appendChild(opt);
          });
          if (currentVal && [...modelSelect.options].some(o => o.value === currentVal)) {
            modelSelect.value = currentVal;
          }
        }
      });
    } else {
      statusEl.textContent = (t('testApiFailed') || '❌ Connection failed:') + (result.error || '');
      statusEl.style.color = '#f87171';
    }
  } catch (err) {
    statusEl.textContent = (t('testApiFailed') || '❌ Connection failed:') + err.message;
    statusEl.style.color = '#f87171';
  }

  btn.disabled = false;
  btn.textContent = t('testApiButton') || 'Test Connection';
});

// ---- 刷新模型列表 ----
document.getElementById('refreshModelsBtn').addEventListener('click', async () => {
  const btn = document.getElementById('refreshModelsBtn');
  btn.textContent = '⟳';
  btn.disabled = true;
  try {
    const result = await chrome.runtime.sendMessage({ action: 'getModels' });
    if (result.models && result.models.length > 0) {
      const modelSelect = document.getElementById('apiModel');
      const currentVal = modelSelect.value;
      modelSelect.innerHTML = `<option value="">${t('selectModelPlaceholder') || '-- select or enter model name --'}</option>`;
      result.models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.id;
        modelSelect.appendChild(opt);
      });
      if (currentVal && [...modelSelect.options].some(o => o.value === currentVal)) {
        modelSelect.value = currentVal;
      }
    }
  } catch (_) {}
  btn.disabled = false;
  btn.textContent = '↻';
});

// ---- 添加按钮 ----
btnAdd.addEventListener('click', () => {
  actions.push({ label: t('newButtonLabel'), prompt: '' });
  render();
  const cards = container.querySelectorAll('.action-card');
  if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: 'smooth' });
});

// ---- 保存 ----
saveBtn.addEventListener('click', async () => {
  const providerId = document.getElementById('apiProvider').value;
  const provider = getProvider(providerId);
  const apiType = providerId === 'custom'
    ? document.getElementById('apiType').value
    : provider.type;
  const baseUrl = document.getElementById('apiBaseUrl').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  const model = document.getElementById('apiModel').value.trim();

  if (!apiKey) { showStatus(t('apiKeyRequired'), 'err'); return; }

  const cards = container.querySelectorAll('.action-card');
  const cleaned = [];
  cards.forEach((card) => {
    const label = card.querySelector('.fld-label').value.trim();
    const prompt = card.querySelector('.fld-prompt').value.trim();
    if (label) cleaned.push({ label, prompt });
  });

  await chrome.storage.sync.set({
    apiProvider: providerId,
    apiBaseUrl: baseUrl,
    apiKey,
    apiModel: model,
    apiType: providerId === 'custom' ? apiType : undefined,
    quickActions: cleaned,
    quickActionsLang: getCurrentLang(),
    maxRounds: parseInt(maxRoundsInput.value, 10) || 20,
  });
  actions = cleaned;
  render();
  showStatus(t('savedSuccess'), 'ok');
});

function showStatus(msg, cls) {
  status.textContent = msg;
  status.className = cls;
}

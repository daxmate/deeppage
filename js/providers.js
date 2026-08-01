// ==============================================
// DeepPage — Shared API Provider Definitions
// Single source of truth for provider config.
// Used by:
//   background.js (service worker, ES module import)
//   options.js    (options page, ES module import)
// ==============================================

export const API_PROVIDERS = [
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

// Object map for O(1) lookup by id (used by background.js)
export const API_PROVIDER_MAP = Object.fromEntries(
  API_PROVIDERS.map(p => [p.id, p])
);

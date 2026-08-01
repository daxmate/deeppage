# DeepPage

Chat with DeepSeek while browsing — summarize, outline, translate, and ask questions.

> [中文版](./README.md)

## Usage

1. Install the extension and visit any web page
2. Click the DeepSeek icon at the bottom-right to open the chat panel
3. On first use, configure your API Key:
   - Right-click the extension icon → **Options**
   - Enter your [DeepSeek API Key](https://platform.deepseek.com/api_keys)
   - Click **Save**
4. Use the quick action buttons or type your own questions

## Features

- **Inline Chat Panel** — Click the floating button to open a chat bubble on any page
- **Provider Status Indicator** — The floating button icon switches to the current AI provider's logo; hover to see the full "provider · model", refreshed live when settings change
- **Quick Actions** — Customizable buttons for summarize, outline, translate, or anything you define
- **Full Page Context** — Automatically extracts page content as conversation context
- **Conversation Memory** — Chat history persists per page, survives panel close
- **Chat History** — Auto-saved conversations, browse/switch/delete/rename from history list, with keyword search (matches titles or message content); auto-generates an AI title after the first reply
- **Page Context Persistence** — Saved with conversations, survives panel reloads
- **Copy Replies** — Hover AI messages → copy button, one-click clipboard copy
- **Streaming Output** — Real-time token-by-token rendering, typewriter effect without waiting for full response; can be disabled in options for APIs that only support non-streaming responses
- **Optimized Streaming Rendering** — rAF frame batching + long-text decimation keeps very long replies smooth
- **Selection Query** — Select text on any page to reveal a floating button; uses page context + AI knowledge to explain the selection
- **Conversation Trimming** — Auto-trims oldest message rounds (default 20) to avoid token limits; configurable via options
- **Configurable Page Context Limit** — Max characters of page text sent to the AI is adjustable (default 15000, range 2000-50000); long pages no longer get a one-size-fits-all cut
- **Clear Context** — One-click button in the panel header to reset conversation while keeping the latest message
- **Export Conversation** — Export button: copy Markdown, copy plain text (markdown syntax auto-stripped), download .md, or download PDF (bubble-style A4, CJK-friendly), with page title and URL
- **Draggable / Resizable** — Panel position and size are freely adjustable; initial vertical centering
- **Markdown Rendering** — Full GFM support via marked (headings, lists, tables, code blocks, blockquotes, task lists)
- **Multi-language** — 10 languages with on-the-fly switching via panel or options
- **Dark Mode** — Auto-adapts to system theme; manual toggle from panel or options
- **Multi-API** — OpenAI-compatible (DeepSeek, Ollama, Groq, etc.) and Anthropic native format
- **Custom Base URL** — Point to any server for self-hosted or third-party backends (all built-in provider domains are pre-authorized; self-hosted servers must allow cross-origin requests)

## Privacy

- The extension only reads text content from the current page (no images, styles, or scripts)
- Page content is sent only to your chosen AI provider's API, never to any third party
- You use your own API Key — data never passes through any intermediary

## Architecture

```
┌──────────────────────┐   chrome.runtime   ┌──────────────────────┐
│  Content Script      │ ──────────────────→│  Service Worker      │
│  (Inline Chat UI)    │                    │  (API Calls)         │
│  Extract Content     │ ←──────────────────│  Fetch Response      │
│  User Interaction    │                    │  api.deepseek.com    │
└──────────────────────┘                    └──────────┬───────────┘
                                                       │
                                                POST /v1/chat/completions
                                                       │
                                                ┌──────▼──────┐
                                                │  DeepSeek   │
                                                │  Official   │
                                                │  API        │
                                                └─────────────┘
```

- Direct DeepSeek API calls (OpenAI-compatible interface)
- Supports `deepseek-v4-flash` and other DeepSeek models (model name customizable in options)
- No hidden tabs, no PoW anti-scraping

## Development

Pure Chrome Extension (Manifest V3) — no build step required.

```bash
git clone https://github.com/daxmate/deeppage.git
```

Open `chrome://extensions` → **Load unpacked** → select the project directory.

### Running Tests

The project ships a Playwright E2E test framework (mock server simulating an OpenAI-compatible API — no real key needed):

```bash
npm install
npm test        # runs i18n validation + 38 E2E cases
```

> Full development guide (adding API providers / writing tests / i18n / releasing) → [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)

### Project Structure

```
├── js/                     # JavaScript
│   ├── i18n.js             # Translation engine (10 languages)
│   ├── utils.js            # Utility functions
│   ├── providers.js        # API provider config (single source of truth, shared by background/options)
│   ├── provider-icons.js   # Provider icon map (floating button status indicator)
│   ├── chat.js             # Chat management + API calls + export
│   ├── sidebar.js          # Panel UI + drag + selection button
│   ├── content.js          # Content script — entry (boots the panel)
│   ├── background.js       # Service worker — API calls
│   ├── options.js          # Options page logic
│   ├── spa-patch.js        # SPA navigation patch (main world, cleans up selection button)
│   ├── marked.umd.min.js   # Markdown renderer (marked v15)
│   └── vendor/             # Third-party deps (html2pdf.js, used for PDF export)
├── tests/                  # Playwright E2E tests (38 cases)
│   ├── mock-server.js      # OpenAI-compatible mock API
│   └── fixtures.mjs        # Extension context / storage / mock control fixtures
├── scripts/
│   └── check-i18n.mjs      # i18n validation (array length/order/emptiness/references)
├── options.html            # Options page
├── options.css             # Options page styles
├── content.css             # Chat panel styles (injected via manifest)
├── manifest.json           # Extension manifest
├── icons/                  # DeepSeek icons
└── .github/workflows/      # CI release config (auto-release on tag push)
```

### Adding a Language

Edit `i18n.js`:
1. Add the language code to the `LANG_CODES` array
2. Append the translation to the end of every `TRANSLATIONS` key array
3. Add the language display name to the `LANGUAGES` array
4. Update `detectLanguage()` if needed

After changes, run `npm run check:i18n` to validate 10-language array consistency (also runs automatically with `npm test`).

## Contributing

Issues and Pull Requests are welcome! Please keep these conventions in mind:

- **Align before coding**: for larger changes, explain your approach before writing code
- **Don't reinvent the wheel**: prefer proven solutions for common needs (e.g. marked for markdown)
- **Test coverage**: add E2E tests for new features/fixes; cover every branch of menu-style multi-option features
- **Changelog on every release**: CHANGELOG.md + bilingual GitHub Release notes
- **i18n**: new UI strings must cover all 10 languages; run `npm run check:i18n`

> Full development guide (adding API providers / writing tests / i18n) → [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)

## License

MIT

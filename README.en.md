# DeepPage

Chat with DeepSeek while browsing — summarize, outline, translate, and ask questions.

> [中文版](./README.md)

## Features

- **Inline Chat Panel** — Click the floating button to open a chat bubble on any page
- **Quick Actions** — Customizable buttons for summarize, outline, translate, or anything you define
- **Full Page Context** — Automatically extracts page content as conversation context
- **Conversation Memory** — Chat history persists per page, survives panel close
- **Chat History** — Auto-saved conversations, browse/switch/delete from history list
- **Page Context Persistence** — Saved with conversations, survives panel reloads
- **Copy Replies** — Hover AI messages → copy button, one-click clipboard copy
- **Streaming Output** — Real-time token-by-token rendering, typewriter effect without waiting for full response
- **Selection Query** — Select text on any page to reveal a floating button; uses page context + AI knowledge to explain the selection
- **Conversation Trimming** — Auto-trims oldest message rounds (default 20) to avoid token limits; configurable via options
- **Clear Context** — One-click button in the panel header to reset conversation while keeping the latest message
- **Export Conversation** — Export button: copy Markdown, copy plain text, or download .md with page title and URL
- **Draggable / Resizable** — Panel position and size are freely adjustable; initial vertical centering
- **Markdown Rendering** — Full GFM support via marked (headings, lists, tables, code blocks, blockquotes, task lists)
- **Multi-language** — 10 languages with on-the-fly switching via panel or options
- **Dark Mode** — Auto-adapts to system theme; manual toggle from panel or options
- **Multi-API** — OpenAI-compatible (DeepSeek, Ollama, Groq, etc.) and Anthropic native format
- **Custom Base URL** — Point to any server for self-hosted or third-party backends

## Usage

1. Install the extension and visit any web page
2. Click the DeepSeek icon at the bottom-right to open the chat panel
3. On first use, configure your API Key:
   - Right-click the extension icon → **Options**
   - Enter your [DeepSeek API Key](https://platform.deepseek.com/api_keys)
   - Click **Save**
4. Use the quick action buttons or type your own questions

## Privacy

- The extension only reads text content from the current page (no images, styles, or scripts)
- Page content is sent only to the DeepSeek API, never to any third party
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
- Supports `deepseek-v4-flash` / `deepseek-v4-pro` models
- No hidden tabs, no PoW anti-scraping

## Development

Pure Chrome Extension (Manifest V3) — no build step required.

```bash
git clone https://github.com/daxmate/deeppage.git
```

Open `chrome://extensions` → **Load unpacked** → select the project directory.

### Project Structure

```
├── i18n.js                 # Translation engine (10 languages)
├── manifest.json           # Extension manifest
├── background.js           # Service worker — API calls
├── content.js              # Content script — panel UI + chat logic
├── options.html / .js      # Options page — API Key + button config
├── options.css             # Options page styles
├── content.css             # Chat panel styles (dead file, kept for reference)
├── marked.umd.min.js       # Markdown renderer (marked v15)
├── icons/                  # DeepSeek icons
├── test-resize.html        # Resize test page
└── test-markdown.html      # Markdown rendering test page
```

### Adding a Language

Edit `i18n.js`:
1. Add a new entry to the `TRANSLATIONS` object with all 32 keys
2. Add the language to the `LANGUAGES` array
3. Update `detectLanguage()` if needed

## License

MIT

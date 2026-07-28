# DeepPage

Chat with DeepSeek while browsing — summarize, outline, translate, and ask questions.

> [中文版](./README.md)

## Features

- **Inline Chat Panel** — Click the floating button to open a chat bubble on any page
- **Quick Actions** — Customizable buttons for summarize, outline, translate, or anything you define
- **Full Page Context** — Automatically extracts page content as conversation context
- **Conversation Memory** — Chat history persists per page, survives panel close
- **Draggable / Resizable** — Panel position and size are freely adjustable
- **Markdown Rendering** — Full GFM support via marked (headings, lists, tables, code blocks, blockquotes, task lists)
- **Multi-language** — 10 languages with on-the-fly switching via panel or options
- **Dark Mode** — Auto-adapts to system theme

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

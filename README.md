# BYON — Bring Your Own Notion AI

BYON is an alpha userscript that replaces Notion's bottom-right **Ask AI** entry point with **Ask BYON** and opens a native-styled chat panel for your own OpenAI-compatible backend.

BYON does not call, proxy, or emulate Notion's private AI backend. Notion AI remains installed and can be restored at any time by disabling button replacement in BYON settings.

## Features

- Multiple OpenAI-compatible provider profiles
- Chat Completions and Responses API wire formats
- Bearer, custom-header, and no-auth endpoints
- Model discovery with manual model entry
- Grouped, searchable Notion-style model picker
- Text-file attachments for HTML, Markdown, CSV, JSON, code, logs, and other text formats
- Progressive streaming where supported, with buffered fallback
- Local chat history, rename/delete/clear, stop, retry, edit-and-resend, and copy
- Current Notion page title/URL and selected-text context
- Optional visible-page excerpt, clearly marked as potentially incomplete
- Backend-preconfigured Notion MCP guidance
- Responses remote-MCP configuration with approval required for every tool call
- Light/dark theme support and a resizable panel
- Notion-style anchored chat, attachment, model, and API-mode popovers

## Install

1. Install Tampermonkey, Violentmonkey, or Greasemonkey.
2. Open [`byon.user.js`](./byon.user.js) as a raw file and install it in the manager.
3. Reload Notion in the browser.
4. Click **Ask BYON**, use the manager's **Open BYON** menu command, or try `Ctrl/Cmd+J`.
5. Open BYON settings and enter a base URL ending in `/v1`, model ID, authentication mode, and API key if required.

The shortcut is best-effort: browsers commonly reserve `Ctrl+J` for Downloads, so the visual button and userscript menu command are the reliable entry points.

## Provider configuration

BYON appends these paths to the configured base URL:

- `POST /chat/completions`
- `POST /responses`
- `GET /models`

Choose the API type explicitly. Chat Completions is the default and has the broadest compatibility. Responses is required for BYON's remote-MCP tool configuration.

Arbitrary custom endpoints require `@connect *`. Your userscript manager may ask for host permission the first time BYON contacts a domain. Requests use the manager's anonymous mode so Notion cookies are not forwarded.

## Notion MCP modes

BYON's MCP integration means an AI controlling the user's Notion workspace through Notion MCP. It does not mean Notion AI connectors controlling unrelated apps.

- **Off:** no Notion MCP tool instruction or configuration.
- **Already configured in backend:** BYON adds a Notion-specific instruction and current page URL. The backend owns authentication, tool execution, and approvals, so BYON cannot enforce approval in this mode.
- **Responses remote MCP:** BYON adds a remote MCP tool to the Responses request and asks the endpoint to require approval for every call. BYON displays each approval request and only offers **Approve once** or **Deny**.

Remote-MCP Responses are stored by the configured provider because approval continuations reference the previous response ID. Ordinary BYON chat history remains local and does not rely on provider conversation state.

The official hosted endpoint defaults to `https://mcp.notion.com/mcp`. BYON v1 does not implement Notion OAuth or act as a direct MCP client. Supply an OAuth access token accepted by the endpoint, use an authenticated gateway, or configure Notion MCP in the AI backend itself.

## Privacy and security

- Chats, settings, and credentials are stored in the userscript manager's isolated storage.
- Credentials are masked in the UI but are **not encrypted at rest**.
- Credentials are redacted from errors shown by BYON.
- Visible-page context is opt-in. Notion virtualizes long pages, so it may not contain the full page.
- Markdown rendering escapes raw HTML and permits only `http`, `https`, and `mailto` links.
- Review every Notion MCP tool call before approval.

## Compatibility

The v1 target matrix is Chrome/Edge with Tampermonkey and Firefox with Violentmonkey or Greasemonkey. Streaming quality depends on whether the manager exposes progressive `GM_xmlhttpRequest` response text; BYON falls back to displaying the completed response.

Notion's UI is not a public API. BYON locates the AI trigger by its semantic label and icon instead of generated CSS class names, and reapplies the replacement after Notion rerenders. A future Notion redesign can still require an update. The userscript menu commands remain available as a fallback.

## Development

Requires Node.js 20 or newer. There are no runtime or test dependencies.

```sh
npm test
npm run smoke:browser
```

The files in `resources/` are saved Notion UI references and are not loaded by the userscript.

## Deferred from v1

Voice, image and other binary-file inputs, browser-side Notion OAuth, a direct MCP client, arbitrary multi-MCP orchestration, prompt presets, cost estimates, import/export, and conversation search.

# BYON — Bring Your Own Notion AI

BYON is an alpha userscript that replaces Notion's bottom-right **Ask AI** entry point with **Ask BYON** and opens a native-styled chat panel for your own OpenAI-compatible backend.

BYON does not call, proxy, or emulate Notion's private AI backend. Notion AI remains installed and can be restored at any time by disabling button replacement in BYON settings.

## Features

- Compact connection management for multiple OpenAI-compatible provider profiles
- Chat Completions and Responses API wire formats
- Bearer, custom-header, and no-auth endpoints
- Model discovery with searchable selection, select-all/clear controls, and manual model IDs
- Grouped, searchable Notion-style model picker
- Text-file attachments for HTML, Markdown, CSV, JSON, code, logs, and other text formats
- Progressive streaming where supported, with buffered fallback
- Local chat history, rename/delete/clear, stop, retry, edit-and-resend, and copy
- Current Notion page title/URL and selected-text context
- Optional visible-page excerpt, clearly marked as potentially incomplete
- BYON-managed Notion MCP connection with OAuth/PKCE, inline tool activity, and configurable approvals
- Backend-independent MCP tool translation for Chat Completions and Responses function calling
- Light/dark theme support and a resizable panel
- Notion-style anchored chat, attachment, model, and API-mode popovers
- Native-style full-page start and active-chat layouts that preserve Notion's workspace sidebar, with side/full switching
- A dedicated right settings sidebar in full-page mode, keeping the chat visible while settings are open

## Install

1. Install Tampermonkey, Violentmonkey, or Greasemonkey.
2. Open [`byon.user.js`](./byon.user.js) as a raw file and install it in the manager.
3. Reload Notion in the browser.
4. Click **Ask BYON**, use **Open BYON** / **Open BYON Full Page** from the manager menu, or try `Ctrl/Cmd+J`.
5. Open BYON settings and enter a base URL ending in `/v1`, model ID, authentication mode, and API key if required.

The shortcut is best-effort: browsers commonly reserve `Ctrl+J` for Downloads, so the visual button and userscript menu command are the reliable entry points.

## Provider configuration

BYON appends these paths to the configured base URL:

- `POST /chat/completions`
- `POST /responses`
- `GET /models`

Choose the API type explicitly. Chat Completions is the default and has the broadest compatibility. BYON translates MCP tools into the standard function-tool shape for the selected API type.

Connections are selected from the settings list and can be checked without making them active. Each connection keeps a chosen model set: reload endpoint suggestions, search and select models, or enter exact model IDs manually.

Arbitrary custom endpoints require `@connect *`. Your userscript manager may ask for host permission the first time BYON contacts a domain. Requests use the manager's anonymous mode so Notion cookies are not forwarded.

## Notion MCP

BYON's MCP integration means an AI controlling the user's Notion workspace through Notion MCP. It does not mean Notion AI connectors controlling unrelated apps.

The Notion MCP connection is global: connect it once and every provider profile can use it when selected. BYON acts as the MCP client instead of relying on a provider-specific flag or hosted-tool feature:

1. Click **Connect Notion** and complete Notion's OAuth authorization with PKCE.
2. BYON connects directly to `https://mcp.notion.com/mcp` using Streamable HTTP and discovers the available tools.
3. BYON translates each MCP tool into an ordinary function tool for Chat Completions or Responses.
4. When the model requests a tool, BYON shows an inline **Using tool: _name_** card with its arguments and live status.
5. BYON calls Notion MCP directly, returns the result to the model, and continues until the model produces its answer.

BYON exposes an internal completion function alongside the Notion tools. MCP-enabled answers must be submitted through that function with the exact tool-call IDs supporting the conclusion. BYON structurally rejects missing, failed, incomplete, paginated, or unconfirmed-empty evidence, then runs an isolated semantic review turn—with no Notion tools—to verify that the cited results actually answer the original request in whatever language it uses. Rejected review feedback returns to the active tool loop. Completed tool evidence is retained with the chat so a follow-up does not lose the Notion results behind the previous answer.

When the MCP server exposes more tools than a local model can reliably compile at once, BYON performs a small structured routing turn over the live tool catalog. This replaces English keyword routing and works with requests in other languages; if routing fails, BYON falls back to prerequisite read/discovery tools.

The composer includes three approval modes:

- **Ask for approval** shows inline **Allow**, **Always allow**, and **Deny** controls. Always allow applies only to the remaining tool calls in that response.
- **Approve for me** automatically runs only tools that the trusted Notion MCP server explicitly annotates as read-only, non-destructive, and closed-world. Missing or less-safe annotations cause an inline approval prompt.
- **Run automatically** runs every Notion tool without prompting. Notion MCP changes are external workspace actions and are not sandboxed or automatically reversible.

This does not require `mcp_enabled`, an Unsloth preset, or an endpoint that implements OpenAI's remote-MCP extension. The selected model endpoint must support standard function calling. Text-only OpenAI-compatible endpoints cannot use MCP.

Enabling the global Notion MCP connection makes workspace tools available to the active provider when a request needs them; it does not force tool use on every message. BYON first performs a structured semantic decision. General conversation, writing, coding, brainstorming, and arbitrary text go through the ordinary provider path without Notion instructions or tools.

For local llama.cpp-compatible endpoints, BYON automatically simplifies full MCP JSON Schemas to the conservative subset accepted by tool-call grammar compilers and sends only the tools relevant to the current request. If the endpoint still reports a grammar-compilation error, BYON retries once using a minimal JSON-string argument envelope and unwraps it before calling MCP. Notion MCP still validates the actual arguments, so simplifying the model-facing schema does not bypass Notion's validation or BYON's configured approval policy.

If a model returns ordinary assistant text instead of the required structured completion, BYON redirects it back into the tool loop with function calling required. This is language-independent. BYON does not cap the number of productive Notion tool rounds: the loop continues until a verified answer, a user stop, or three consecutive identical no-progress attempts.

Successful Notion tool results are associated with the final answer automatically. Models may cite individual call IDs, but BYON does not reject a completed action merely because the model omitted those internal IDs.

The advanced connection section accepts OAuth, bearer-token, or unauthenticated Streamable HTTP servers. This is useful for authenticated MCP gateways and local bridges. A userscript cannot launch a process or access stdin/stdout, so native stdio transport is not possible. To use a stdio MCP server, run a trusted stdio-to-Streamable-HTTP bridge locally and enter its HTTP URL.

## Privacy and security

- Chats, settings, and credentials are stored in the userscript manager's isolated storage.
- Credentials are masked in the UI but are **not encrypted at rest**.
- Provider keys and MCP OAuth credentials are redacted from errors shown by BYON.
- Notion OAuth access/refresh tokens and dynamic client registration are stored in isolated userscript-manager storage but are **not encrypted at rest**.
- Visible-page context is opt-in. Notion virtualizes long pages, so it may not contain the full page.
- Markdown rendering escapes raw HTML and permits only `http`, `https`, and `mailto` links.
- Use **Ask for approval** when you want to review every Notion MCP tool call; automatic modes can change external workspace data without a prompt.

## Compatibility

The v1 target matrix is Chrome/Edge with Tampermonkey and Firefox with Violentmonkey or Greasemonkey. Streaming quality depends on whether the manager exposes progressive `GM_xmlhttpRequest` response text; BYON falls back to displaying the completed response.

Notion's UI is not a public API. BYON locates the AI trigger by its semantic label and icon instead of generated CSS class names, and reapplies the replacement after Notion rerenders. A future Notion redesign can still require an update. The userscript menu commands remain available as a fallback.

Full-page BYON is strictly limited to Notion's `/ai` route. Choosing full-page mode from a regular Notion page navigates to `/ai` first, then opens BYON after Notion's AI workspace is available. Navigating away immediately hides and unmounts the full-page surface, so it never continues behind an ordinary page.

On `/ai`, BYON mounts inside the same native `order: 2` workspace column as Notion AI, immediately below Notion's toolbar. The native workspace therefore controls its clipping, resizing, and stacking, allowing Notion's sidebar—including its collapsed overlay state—to remain above and independently interactive. If that workspace cannot be identified after a Notion redesign, BYON falls back to its bounded app-level mount. The side/full control can switch layouts at any time; the close/collapse control is shown only in side-panel mode.

## Development

Requires Node.js 20 or newer. There are no runtime or test dependencies.

```sh
npm test
npm run smoke:browser
```

The files in `references/` are organized Notion UI and DOM references and are not loaded by the userscript. See `references/README.md` for the catalog.

## Deferred from v1

Voice, image and other binary-file inputs, native stdio process launching, arbitrary multi-MCP orchestration, prompt presets, cost estimates, import/export, and conversation search.

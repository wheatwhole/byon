# Notion UI references

These files are design and DOM references for BYON. They are never loaded by the userscript.

## Full-page captures

- `full-page/notion-ai-full-page.html` — complete native Notion AI full-page layout.
- `full-page/notion-ai-start-screen.html` — focused empty/start-a-chat state.
- `full-page/notion-ai-active-chat.html` — focused active conversation state.
- `full-page/notion-app-without-byon.html` — native `#notion-app` layout without BYON, used to verify mount placement.
- `full-page/byon-sidebar-overlap-regression.html` — captured BYON/sidebar stacking regression.
- `full-page/byon-toolbar-covering-regression.html` — captured invisible-but-clickable hamburger/toolbar regression.

## Side-panel captures

Each saved HTML page has a neighboring `_files` directory containing its downloaded assets.

- `side-panel/notion-ai-chat-empty.html` — standalone Notion AI landing/chat surface.
- `side-panel/notion-ai-chat-on-page.html` — Notion AI side panel beside a page.
- `side-panel/chat-history-menu.html` — chat selector/history popover.
- `side-panel/model-menu.html` — organized model selector popover.
- `side-panel/attachment-menu.html` — plus-button file/page attachment popover.

## Focused components

- `components/chat-panel.html` — isolated chat panel markup.
- `components/model-selector.html` — isolated model selector markup.
- `components/api-mode-selector.html` — isolated Chat Completions/Responses selector markup.
- `components/model-hover-card.html` — model metadata hover-card reference; intentionally deferred in the current UI.

## Supporting references

- `screenshots/` — quick visual references for the chat, attachment, model, and API-mode menus.
- `styles/` — extracted Notion chat, sidebar, base, and color-token CSS.
- `raw/notion-page.mhtml` — original browser archive retained for deeper inspection.

The large captures and downloaded assets are ignored by Git. When adding a new reference, use a descriptive kebab-case name, keep a saved page's `_files` directory beside it, and add a short entry here.

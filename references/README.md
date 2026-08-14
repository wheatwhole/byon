# Notion UI reference catalog

These files document Notion's UI and BYON layout regressions. They are development references only and are never loaded by the userscript.

The directory names describe both the layout and the kind of capture:

- `saved-pages/` contains complete browser saves with `<!DOCTYPE html>`, `<head>`, `<body>`, and a neighboring `_files` asset directory.
- `fragments/` contains copied DOM subtrees, not independently runnable pages.
- `regressions/` contains DOM captured while a specific BYON layout bug was present.

## Full-page Notion AI

### Complete saved page

- `full-page/saved-pages/notion-ai-start-screen.html` — complete `https://app.notion.com/ai` browser save showing the empty full-page start screen with the native sidebar collapsed.

### DOM fragments

- `full-page/fragments/notion-app-shell-sidebar-expanded.html` — native `.notion-app-inner` subtree showing the full-page AI workspace with the sidebar expanded.
- `full-page/fragments/notion-ai-start-screen.html` — focused full-page start-screen and composer subtree.
- `full-page/fragments/notion-ai-active-chat.html` — focused active-conversation and composer subtree; its Ask AI trigger had already been relabeled by BYON when captured.
- `full-page/fragments/notion-body-without-byon.html` — native `<body>` subtree before BYON is mounted, used to verify ownership and mount placement.

### BYON regression captures

- `full-page/regressions/byon-sidebar-overlap.html` — `#notion-app` subtree captured when BYON overlapped Notion's sidebar layer.
- `full-page/regressions/byon-toolbar-covering.html` — `<body>` subtree captured when BYON visually covered the native toolbar/hamburger.

## Side-panel Notion AI

All files in `side-panel/saved-pages/` are complete browser saves of a normal Notion page with the AI side panel open:

- `notion-ai-chat.html` — base AI side-panel conversation view.
- `notion-ai-attachment-menu.html` — attachment/context menu open.
- `notion-ai-model-menu.html` — model selector open.

There is no complete saved-page capture of the chat selector in this set. Its visual screenshot is listed below.

Each HTML file has a same-named `_files` directory beside it. Keep those pairs together when moving or renaming captures.

## Focused component fragments

- `components/notion-ai-side-panel-start-screen.html` — isolated AI side-panel start screen with suggested actions and composer.
- `components/notion-model-selector.html` — isolated model selector markup.
- `components/notion-chat-mode-selector.html` — isolated Notion chat-mode selector with Default, Ask, and Research choices.
- `components/notion-model-hover-card.html` — model metadata hover-card reference, currently deferred in BYON.
- `components/notion-connections-settings.html` — isolated Connections settings page covering integrations, tokens, MCP permissions, and related workspace controls.

## Editing a page

- `editing-a-page/SpaceToEditWithAI-SpaceKeyHit.html` — native writer immediately after Space opens the **Edit with AI** prompt on an empty paragraph.
- `editing-a-page/SpaceToEditWithAI-RespondedState.html` — native writer response, highlighted page preview, and Insert-below, Chat, Undo, and Accept controls.

## Supporting material

- `screenshots/side-panel/` — quick visual references for attachment, chat-selector, model, and chat-mode menus.
- `styles/` — extracted Notion app, chat, sidebar, and color-token CSS.
- `raw/notion-page-browser-archive.mhtml` — original Chromium browser archive retained for deeper inspection.

Use descriptive kebab-case names for new material. Classify the capture from its DOM before naming it; do not infer full-page versus side-panel from an old filename alone.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Core = require('../byon.user.js');

function profile(overrides = {}) {
  return {
    ...Core.defaultProfile(),
    baseUrl: 'https://example.test/v1/',
    model: 'test-model',
    apiKey: 'super-secret-key',
    ...overrides
  };
}

test('userscript metadata is self-contained and allows configured hosts', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  assert.match(source, /\/\/ @connect\s+\*/);
  assert.doesNotMatch(source, /\/\/ @require\s+/);
  assert.doesNotMatch(source, /\beval\s*\(/);
  assert.match(source, /\/\/ @match\s+https:\/\/www\.notion\.so\/\*/);
  assert.match(source, /\/\/ @match\s+https:\/\/app\.notion\.com\/\*/);
});

test('UI inherits Notion theme tokens instead of the operating-system theme', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  assert.match(source, /notionThemeContainer/);
  assert.match(source, /\.notion-app-inner\.notion-dark-theme/);
  assert.doesNotMatch(source, /prefers-color-scheme/);
  assert.equal(Core.defaultState().settings.panelWidth, 464);
  assert.equal(Core.migrateState({ settings: { panelWidth: 320 }, profiles: [profile()], chats: [] }).settings.panelWidth, 360);
  assert.match(source, /function installInputIsolation/);
  assert.match(source, /event\.stopPropagation\(\)/);
});

test('native Space-to-edit writer is borrowed only after guarded submission', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  assert.match(source, /\.notion-agent-writer-ui/);
  assert.match(source, /placeholder="Edit with AI"/);
  assert.match(source, /aria-label="Submit query"/);
  assert.match(source, /global\.addEventListener\('keydown', handleInlineWriterKeydown, true\)/);
  assert.match(source, /global\.addEventListener\('pointerdown', handleInlineWriterClick, true\)/);
  assert.match(source, /global\.addEventListener\('click', handleInlineWriterClick, true\)/);
  assert.match(source, /global\.addEventListener\('beforeinput', handleInlineWriterBeforeInput, true\)/);
  assert.match(source, /Register before Notion initializes/);
  assert.match(source, /stopImmediatePropagation\(\)/);
  assert.match(source, /data-byon-inline-host/);
  assert.match(source, /data-byon-inline-owned/);
  assert.match(source, /findInlineWriterAnchor/);
  assert.match(source, /lastInlineTriggerBlock/);
  assert.match(source, /boundInlineWriters/);
  assert.match(source, /writer\.addEventListener\(type, handleInlineWriterKeydown, true\)/);
  assert.match(source, /dataset\.byonInlineStatus/);
  assert.doesNotMatch(source, /function handleInlineWriterSpace/);
});

test('inline page-edit proposals use strict targeted block patches without MCP or chat history', () => {
  const chatTool = Core.inlineEditToolDefinition('chat_completions');
  assert.equal(chatTool.function.name, 'byon_edit_page');
  assert.deepEqual(chatTool.function.parameters.properties.changes.items.properties.operation.enum, ['replace', 'insert_before', 'insert_after']);
  const responsesTool = Core.inlineEditToolDefinition('responses');
  assert.equal(responsesTool.name, 'byon_edit_page');

  const blocks = [
    { id: 'paragraph-a', supported: true },
    { id: 'database-b', supported: false }
  ];
  assert.deepEqual(Core.validateInlineEditPatches({ summary: 'Updated intro', changes: [
    { operation: 'replace', target_block_id: 'paragraph-a', markdown: '# Better intro' }
  ] }, blocks), {
    mode: 'patch',
    draftMarkdown: '',
    summary: 'Updated intro',
    changes: [{ operation: 'replace', targetBlockId: 'paragraph-a', markdown: '# Better intro' }]
  });
  assert.deepEqual(Core.validateInlineEditPatches({
    mode: 'draft', draft_markdown: 'Three complete paragraphs.', summary: 'Drafted a response', changes: []
  }, blocks), {
    mode: 'draft', draftMarkdown: 'Three complete paragraphs.', summary: 'Drafted a response', changes: []
  });
  assert.throws(() => Core.validateInlineEditPatches({
    mode: 'draft', draft_markdown: 'Draft', summary: 'Invalid mixed result', changes: [
      { operation: 'replace', target_block_id: 'paragraph-a', markdown: 'Patch' }
    ]
  }, blocks), /cannot also contain page patches/);
  assert.throws(() => Core.validateInlineEditPatches({
    mode: 'patch', draft_markdown: '', summary: 'Missing patch', changes: []
  }, blocks), /between 1 and 50 changes/);
  assert.throws(() => Core.validateInlineEditPatches({ summary: 'Bad', changes: [
    { operation: 'replace', target_block_id: 'database-b', markdown: 'No' }
  ] }, blocks), /unavailable block ID/);
  assert.throws(() => Core.validateInlineEditPatches({ summary: 'Duplicate', changes: [
    { operation: 'replace', target_block_id: 'paragraph-a', markdown: 'One' },
    { operation: 'replace', target_block_id: 'paragraph-a', markdown: 'Two' }
  ] }, blocks), /duplicates another operation/);

  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  assert.match(source, /profileSystemPrompt\(profile, false\)/);
  assert.match(source, /is_cursor: block\.id === cursorBlockId/);
  assert.match(source, /Never default to the first or top block/);
  assert.match(source, /Choose mode=draft/);
  assert.match(source, /commitInlineDraftBelow/);
  assert.match(source, /proposal\.mode === 'draft'/);
  assert.doesNotMatch(source, /text\.slice\(index, index \+ 64\)/);
  assert.match(source, /target\.cloneNode\(true\)/);
  assert.match(source, /target\.parentNode\.insertBefore\(preview/);
  assert.match(source, /dataset\.byonInlinePreview/);
  assert.match(source, /leaf\.innerHTML = inlinePreviewDiffHtml/);
  assert.match(source, /class=\"notion-enable-hover\"/);
  assert.match(source, /data-token-index/);
  assert.match(source, /inlinePreviewDecorations/);
  assert.match(source, /monitorInlinePreviewIntegrity/);
  assert.match(source, /requestAnimationFrame\(check\)/);
  assert.match(source, /inlinePreviewNodes\.length \+ inlinePreviewDecorations\.length !== session\.proposal\.changes\.length/);
  assert.doesNotMatch(source, /byon-inline-preview-root/);
  assert.match(source, /steps\.every\(\(step\) => step\.kind === 'paragraph'\)/);
  assert.match(source, /continueInNewNotionParagraph/);
  assert.match(source, /settleNotionSelection/);
  assert.match(source, /pasteMarkdownIntoNotion/);
  assert.match(source, /new ClipboardEvent\('paste'/);
  assert.match(source, /waitForInlineEditPersistence/);
  assert.match(source, /consecutiveMatches >= 2/);
  assert.match(source, /leaf\?\.innerText \|\| leaf\?\.textContent/);
  assert.doesNotMatch(source, /style\.setProperty\('translate'/);
  assert.match(source, /data-content-editable-root="true"/);
  assert.match(source, /Inline requests are ephemeral|inline sessions remain ephemeral|generateInlineEditProposal/);
  assert.doesNotMatch(source, /performMcpCompletion\([^)]*inline/i);
});

test('inline block serialization and Markdown commit planning cover supported Notion blocks', () => {
  assert.equal(Core.notionBlockTypeFromClassName('notion-selectable notion-header-block'), 'heading_1');
  assert.equal(Core.notionBlockTypeFromClassName('notion-selectable notion-numbered_list-block'), 'numbered_list');
  assert.equal(Core.notionBlockTypeFromClassName('notion-selectable notion-collection_view-block'), '');
  assert.equal(Core.markdownForNotionBlock('heading_2', 'Plan'), '## Plan');
  assert.equal(Core.markdownForNotionBlock('to_do', 'Ship it', { checked: false }), '- [ ] Ship it');
  assert.equal(Core.markdownForNotionBlock('code', 'const x = 1;', { language: 'js' }), '```js\nconst x = 1;\n```');
  assert.deepEqual(Core.markdownCommitSteps('# Heading\n- item\nParagraph'), [
    { prefix: '#', text: 'Heading', kind: 'markdown' },
    { prefix: '-', text: 'item', kind: 'markdown' },
    { prefix: '', text: 'Paragraph', kind: 'paragraph' }
  ]);
  assert.equal(Core.plainTextFromMarkdown('## Heading\n- [ ] **Task**\n[Page](https://example.test)'), 'Heading\nTask\nPage');
});

test('chat messages and composer follow saved Notion component styling', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  assert.match(source, /class="message-surface"/);
  assert.match(source, /aria-label="Edit message"/);
  assert.match(source, /aria-label="Copy \$\{message\.role === 'assistant' \? 'response' : 'text'\}"/);
  assert.match(source, /iconSvg\('copy'\)/);
  assert.match(source, /\.message\.user \.message-surface\{max-width:calc\(95% - 40px\);margin-inline-start:70px;padding:6px 14px;border-radius:16px/);
  assert.match(source, /\.message\.assistant \.message-surface\{width:100%;padding-inline:4px\}/);
  assert.match(source, /\.message:hover>\.message-actions.*opacity:1/);
  assert.match(source, /\.composer-wrap\{border:0;border-radius:16px.*var\(--c-shaOutSm/);
});

test('tool approvals use inline Notion-style controls and expose three composer modes', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  assert.match(source, /'Using tool'/);
  assert.match(source, />Allow<\/button>/);
  assert.match(source, />Always allow<\/button>/);
  assert.match(source, />Deny<\/button>/);
  assert.match(source, /Ask for approval/);
  assert.match(source, /Approve for me/);
  assert.match(source, /Run automatically/);
  assert.doesNotMatch(source, /Approve Notion tool call\?/);
});

test('thinking and MCP calls use expandable Notion-style activity chips', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  assert.match(source, /class="thinking-chip activity-chip active"/);
  assert.match(source, /details class="tool-activity" data-tool-activity-id/);
  assert.match(source, /<strong>Input<\/strong><pre><code>/);
  assert.match(source, /<strong>Result<\/strong><pre><code>/);
  assert.match(source, /rememberOpenToolActivities\(list\)/);
  assert.match(source, /\.activity-chip\.active \.activity-label.*linear-gradient.*animation:byon-activity-shimmer/);
  assert.match(source, /\.tool-activity\[open\] \.activity-chevron\{transform:rotate\(90deg\)\}/);
  assert.doesNotMatch(source, /tool-status-dot/);
  assert.match(source, /class="mcp-steps" data-tool-activity-id/);
  assert.match(source, /<span>\(\$\{activities\.length\}\) steps<\/span>/);
  assert.match(source, /activities\.every\(\(activity\) => !\['running', 'awaiting'\]\.includes\(activity\.status\)\)/);
});

test('Notion page links render as saved-reference page chips', () => {
  const notionLink = Core.renderMarkdown('[View task details](https://app.notion.com/p/3bb4cb1c68818083a71aea7ec403dc22)');
  assert.match(notionLink, /class="notion-page-chip"/);
  assert.match(notionLink, /class="notion-page-chip-icon"/);
  assert.match(notionLink, /class="notion-page-chip-arrow"/);
  const externalLink = Core.renderMarkdown('[Example](https://example.com/page)');
  assert.doesNotMatch(externalLink, /notion-page-chip/);
  assert.doesNotMatch(Core.renderMarkdown('[Notion docs](https://developers.notion.com/reference/intro)'), /notion-page-chip/);
});

test('current-page links always use the exact page title and become clickable', () => {
  const context = { title: 'sunny', url: 'https://app.notion.com/p/wheatwhole/sunny-2d5204bc78564a509272b1cb6bb352df' };
  assert.equal(
    Core.normalizeCurrentPageLinkMarkdown('**https://app.notion.com/p/wheatwhole/sunny-2d5204bc78564a509272b1cb6bb352df**', context),
    '**[sunny](https://app.notion.com/p/wheatwhole/sunny-2d5204bc78564a509272b1cb6bb352df)**'
  );
  assert.equal(
    Core.normalizeCurrentPageLinkMarkdown('[Click here to go to the sunny workspace](https://app.notion.com/p/wheatwhole/sunny-2d5204bc78564a509272b1cb6bb352df)', context),
    '[sunny](https://app.notion.com/p/wheatwhole/sunny-2d5204bc78564a509272b1cb6bb352df)'
  );
  assert.equal(
    Core.normalizeCurrentPageLinkMarkdown('[sunny](https://app.notion.com/p/wheatwhole/sunny-2d5204bc78564a509272b1cb6bb352df?source=copy_link)', context),
    '[sunny](https://app.notion.com/p/wheatwhole/sunny-2d5204bc78564a509272b1cb6bb352df)'
  );
  assert.match(Core.renderMarkdown(Core.normalizeCurrentPageLinkMarkdown(context.url, context)), /class="notion-page-chip"/);
});

test('Notion icons and compact chat selector rows use the polished variants', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  assert.match(source, /data-action="close-panel"[^\n]+iconSvg\('chevronRight'\)/);
  assert.match(source, /chat-check[^\n]+iconSvg\('check'\)/);
  assert.doesNotMatch(source, /✓/);
  assert.match(source, /\.chat-popover \.chat-row\{width:calc\(100% - 8px\);min-height:30px;margin:2px 4px;padding:2px 6px/);
  assert.equal((source.match(/\n\s+settings: '<path/g) || []).length, 1);
});

test('profile management is list-first and Notion MCP is global', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  const defaults = Core.defaultState();
  assert.equal(defaults.notionMcp.enabled, false);
  assert.equal(defaults.profiles[0].mcpEnabled, undefined);
  assert.match(source, /class="profile-list"/);
  assert.match(source, /data-action="edit-profile"/);
  assert.match(source, /data-profile-select/);
  assert.match(source, /data-action="check-profile"/);
  assert.match(source, /Connected and available globally/);
  assert.match(source, /class="model-selector"/);
  assert.match(source, /data-action="select-all-models"/);
  assert.match(source, /syncSelectedModelsField\(profile\)/);
  assert.match(source, /\.profile-row\.active\{border-color:var\(--c-bluBorAccPri/);
  assert.match(source, /\.model-settings-search input:focus-visible\{outline:none!important/);
  assert.match(source, /@container \(width <= 400px\)/);
  assert.match(source, /\.model-compact-glyph/);
  assert.doesNotMatch(source, /Use connection/);
  assert.doesNotMatch(source, /Let this profile use Notion tools/);
});

test('full-page mode is restricted to Notion /ai and navigates there when requested', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  assert.match(source, /function isNotionAiPath\(\)[\s\S]*?\/\^\\\/ai/);
  assert.match(source, /global\.location\.assign\(new URL\('\/ai', global\.location\.origin\)\.href\)/);
  assert.match(source, /if \(nextMode === 'full' && !isNotionAiPath\(\)\)/);
  assert.match(source, /if \(!isNotionAiPath\(\)\) \{[\s\S]*?panel\.hidden = true/);
});

test('all saved references contain the AI chat surface and new visual references are present', () => {
  const references = path.join(__dirname, '..', 'references');
  const sidePanelSavedPages = path.join(references, 'side-panel', 'saved-pages');
  const fullPageFragments = path.join(references, 'full-page', 'fragments');
  for (const name of ['notion-ai-chat.html', 'notion-ai-attachment-menu.html']) {
    const html = fs.readFileSync(path.join(sidePanelSavedPages, name), 'utf8');
    assert.match(html, /placeholder="Do anything with AI…"/);
    assert.match(html, /data-testid="unified-chat-model-button"/);
  }
  const baseSidePanel = fs.readFileSync(path.join(sidePanelSavedPages, 'notion-ai-chat.html'), 'utf8');
  assert.doesNotMatch(baseSidePanel, /Add images, PDFs, or CSVs/);
  const attachmentMenu = fs.readFileSync(path.join(sidePanelSavedPages, 'notion-ai-attachment-menu.html'), 'utf8');
  assert.match(attachmentMenu, /Add images, PDFs, or CSVs/);
  assert.match(attachmentMenu, /Mention pages or people/);
  const modelMenu = fs.readFileSync(path.join(sidePanelSavedPages, 'notion-ai-model-menu.html'), 'utf8');
  assert.match(modelMenu, /Balances speed, effort, and cost\./);
  const fullPage = fs.readFileSync(path.join(references, 'full-page', 'saved-pages', 'notion-ai-start-screen.html'), 'utf8');
  assert.match(fullPage, /saved from url=\(0025\)https:\/\/app\.notion\.com\/ai/);
  assert.match(fullPage, /placeholder="Do anything with AI…"/);
  assert.equal(Core.isNotionAiTriggerLabel('Ask AI', true), true);
  assert.equal(Core.isNotionAiTriggerLabel('AI Meeting Notes', true), false);
  for (const name of ['notion-ai-chat.html', 'notion-ai-model-menu.html', 'notion-ai-attachment-menu.html']) {
    assert.equal(fs.existsSync(path.join(sidePanelSavedPages, name)), true);
  }
  for (const name of ['chat-selector-menu.jpg', 'attachment-menu.jpg', 'model-menu.jpg', 'chat-mode-menu.jpg']) {
    assert.equal(fs.existsSync(path.join(references, 'screenshots', 'side-panel', name)), true);
  }
  for (const name of ['notion-ai-side-panel-start-screen.html', 'notion-model-selector.html', 'notion-chat-mode-selector.html', 'notion-connections-settings.html']) {
    assert.equal(fs.existsSync(path.join(references, 'components', name)), true);
  }
  for (const name of ['notion-ai-start-screen.html', 'notion-ai-active-chat.html']) {
    const html = fs.readFileSync(path.join(fullPageFragments, name), 'utf8');
    assert.match(html, /data-testid="unified-chat-model-button"/);
    assert.match(html, /Do anything with AI…/);
  }
});

test('text attachment support accepts common text formats and formats file context', () => {
  assert.equal(Core.isSupportedTextFile({ name: 'brief.md', type: '' }), true);
  assert.equal(Core.isSupportedTextFile({ name: 'table.csv', type: 'text/csv' }), true);
  assert.equal(Core.isSupportedTextFile({ name: 'page.html', type: 'text/html' }), true);
  assert.equal(Core.isSupportedTextFile({ name: 'photo.png', type: 'image/png' }), false);
  const formatted = Core.attachmentsText([{ name: 'brief.md', type: 'text/markdown', size: 5, content: 'Hello' }]);
  assert.match(formatted, /Attached text file: brief\.md/);
  assert.match(formatted, /Hello/);
});

test('model selector groups common model families', () => {
  assert.equal(Core.modelGroup('gpt-5.6'), 'OpenAI');
  assert.equal(Core.modelGroup('claude-sonnet-5'), 'Anthropic');
  assert.equal(Core.modelGroup('gemini-3-pro'), 'Google');
  assert.equal(Core.modelGroup('custom-local-model'), 'Other models');
  assert.equal(Core.modelContextInfo('gemini-3-pro').tokens, 1048576);
  assert.equal(Core.modelContextInfo('claude-sonnet-5').tokens, 200000);
  assert.equal(Core.modelContextInfo('custom-local-model').tokens, null);
  assert.equal(Core.modelContextInfo('qwen-3').tokens, 128000);
  assert.equal(Core.contextLimitFromModelRecord({ context_window: 262144 }), 262144);
  assert.equal(Core.contextLimitFromModelRecord({ capabilities: { context_window: 65536 } }), 65536);
  assert.equal(Core.formatContextLimit(262144), '262K context');
  assert.equal(Core.estimatedTokenCount('12345678'), 2);
});

test('provider endpoints and authentication are explicit', () => {
  const chat = profile();
  assert.equal(Core.endpointFor(chat, 'chat'), 'https://example.test/v1/chat/completions');
  assert.equal(Core.endpointFor(chat, 'models'), 'https://example.test/v1/models');
  assert.equal(Core.authHeaders(chat).Authorization, 'Bearer super-secret-key');

  const responses = profile({ apiType: 'responses' });
  assert.equal(Core.endpointFor(responses, 'chat'), 'https://example.test/v1/responses');

  const custom = profile({ authMode: 'custom', headerName: 'x-api-key', headerPrefix: 'Key ' });
  assert.equal(Core.authHeaders(custom)['x-api-key'], 'Key super-secret-key');
  assert.equal(Core.authHeaders(profile({ authMode: 'none' })).Authorization, undefined);
  assert.throws(() => Core.authHeaders(profile({ authMode: 'custom', headerName: 'bad:name' })), /valid custom/);
  assert.throws(() => Core.authHeaders(profile({ authMode: 'custom', headerPrefix: 'bad\n' })), /line breaks/);
  assert.throws(() => Core.parseHeaderObject({ 'bad:name': 'value' }), /MCP header/);
});

test('Chat Completions body includes system, current page, selection, visible excerpt, and MCP function tools', () => {
  const p = profile({ systemPrompt: 'Be brief.' });
  const tools = Core.mcpFunctionDefinitions([{ name: 'notion-search', description: 'Search Notion', inputSchema: { type: 'object', properties: { query: { type: 'string' } } } }], 'chat_completions');
  const body = Core.buildChatCompletionsBody(p, [{ role: 'user', content: 'Update this.' }], {
    title: 'Roadmap', url: 'https://www.notion.so/roadmap', selection: 'Q3 goals', excerpt: 'Rendered blocks', truncated: true
  }, { stream: false, tools: tools.map((tool) => tool.modelTool), includeMcpInstruction: true });
  assert.equal(body.model, 'test-model');
  assert.equal(body.stream, false);
  assert.match(body.messages[0].content, /Be brief/);
  assert.match(body.messages[0].content, /Notion MCP/);
  assert.match(body.messages[1].content, /Current Notion page URL/);
  assert.match(body.messages[1].content, /Q3 goals/);
  assert.match(body.messages[1].content, /potentially incomplete/);
  assert.match(body.messages[1].content, /truncated/);
  assert.equal(body.tools[0].function.name, 'notion-search');
});

test('provider bodies include text-file attachments on their user message', () => {
  const messages = [{ role: 'user', content: 'Summarize this.', attachments: [{ name: 'notes.txt', type: 'text/plain', size: 4, content: 'Data' }] }];
  const chatBody = Core.buildChatCompletionsBody(profile(), messages, {});
  assert.match(chatBody.messages[0].content, /notes\.txt/);
  assert.match(chatBody.messages[0].content, /Data/);
  const responsesBody = Core.buildResponsesBody(profile({ apiType: 'responses' }), messages, {});
  assert.match(responsesBody.input[0].content, /notes\.txt/);
});

test('Responses body uses translated function tools without provider-managed MCP state', () => {
  const p = profile({ apiType: 'responses' });
  const definitions = Core.mcpFunctionDefinitions([{ name: 'notion-create-pages', description: 'Create pages', inputSchema: { type: 'object' } }], 'responses');
  const body = Core.buildResponsesBody(p, [{ role: 'user', content: 'Create a page.' }], { title: 'Home', url: 'https://www.notion.so/home' }, { stream: false, tools: definitions.map((tool) => tool.modelTool), includeMcpInstruction: true });
  assert.equal(body.tools[0].type, 'function');
  assert.equal(body.tools[0].name, 'notion-create-pages');
  assert.equal(body.stream, false);
  assert.equal(body.store, false);
  assert.match(body.instructions, /Never claim/);
});

test('MCP schemas are normalized to the conservative llama.cpp subset', () => {
  const source = {
    type: 'object',
    additionalProperties: false,
    $defs: { target: { type: 'object', properties: { id: { type: ['string', 'null'], format: 'uuid' } }, required: ['id'] } },
    properties: {
      target: { $ref: '#/$defs/target' },
      operation: { anyOf: [{ type: 'string', const: 'append' }, { type: 'string', enum: ['replace', 'delete'] }] },
      amount: { type: 'number', minimum: 0, maximum: 100 },
      forbidden: { not: {} }
    },
    required: ['target', 'operation']
  };
  const normalized = Core.normalizeMcpSchemaForModel(source);
  assert.deepEqual(normalized.properties.target, {
    type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: true
  });
  assert.deepEqual(normalized.properties.operation.enum, ['append', 'replace', 'delete']);
  assert.deepEqual(normalized.properties.amount, { type: 'number' });
  assert.equal(normalized.additionalProperties, false);
  assert.equal(normalized.$defs, undefined);
  assert.equal(normalized.properties.forbidden.not, undefined);
});

test('MCP tool routing accepts exact model-selected names and has a conservative fallback', () => {
  const tools = [
    'notion-search', 'notion-fetch', 'notion-create-pages', 'notion-update-page', 'notion-move-pages',
    'notion-get-users', 'notion-get-comments', 'notion-create-comment', 'notion-create-view', 'notion-download-attachment'
  ].map((name) => ({ name, description: name }));
  const selected = Core.selectMcpToolsByName(tools, ['notion-search', 'notion-fetch', 'notion-create-pages'], 5).map((tool) => tool.name);
  assert.deepEqual(selected, ['notion-search', 'notion-fetch', 'notion-create-pages']);
  assert.deepEqual(Core.fallbackMcpTools(tools, 3).map((tool) => tool.name), ['notion-search', 'notion-fetch', 'notion-create-pages']);
  assert.equal(Core.toolRouterFunctionDefinition('chat_completions').function.name, 'byon_select_tools');
  assert.equal(Core.toolRouterFunctionDefinition('responses').name, 'byon_select_tools');
  assert.deepEqual(Core.toolRouterFunctionDefinition('chat_completions').function.parameters.required, ['use_notion', 'tool_names']);
});

test('ordinary provider requests can omit Notion instructions when MCP is merely available', () => {
  const p = profile({ systemPrompt: 'Be brief.' });
  const ordinary = Core.buildChatCompletionsBody(p, [{ role: 'user', content: 'Write five paragraphs.' }], {}, { includeMcpInstruction: false });
  assert.match(ordinary.messages[0].content, /Be brief/);
  assert.doesNotMatch(ordinary.messages[0].content, /Notion MCP/);
  const responses = Core.buildResponsesBody({ ...p, apiType: 'responses' }, [{ role: 'user', content: 'asdf' }], {}, { includeMcpInstruction: false });
  assert.doesNotMatch(responses.instructions, /Notion MCP/);
});

test('MCP tool grammar fallback uses a universal string envelope and unwraps it', () => {
  const [definition] = Core.mcpFunctionDefinitions([{ name: 'notion-update-page', inputSchema: { type: 'object', properties: { page_id: { type: 'string' } }, required: ['page_id'] } }], 'chat_completions', { schemaMode: 'json_envelope' });
  assert.deepEqual(definition.modelTool.function.parameters.required, ['arguments_json']);
  assert.deepEqual(Core.argumentsForMcpTool(definition, JSON.stringify({ arguments_json: '{"page_id":"abc"}' })), { page_id: 'abc' });
  assert.equal(Core.isToolGrammarCompilationError(new Error("The model couldn't compile a tool-calling grammar for this request.")), true);
  assert.equal(Core.isToolGrammarCompilationError(new Error('HTTP 401: Unauthorized')), false);
});

test('MCP arguments are validated locally against the live schema before execution', () => {
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['data_source_id', 'date'],
    properties: {
      data_source_id: { type: 'string', format: 'uuid' },
      date: { type: 'string', format: 'date' },
      filters: { type: 'array', maxItems: 2, items: { type: 'object', required: ['property'], properties: { property: { type: 'string', minLength: 1 } }, additionalProperties: false } }
    }
  };
  assert.deepEqual(Core.mcpArgumentValidationErrors(schema, {
    data_source_id: '2424cb1c-6881-419f-86b9-cbe1d2aedd06',
    date: '2026-08-13',
    filters: [{ property: 'Done' }]
  }), []);
  const errors = Core.mcpArgumentValidationErrors(schema, {
    data_source_id: 'not-a-data-source-id',
    date: 'today',
    database_id: 'wrong-kind',
    filters: [{ property: '', value: true }]
  });
  assert.ok(errors.some((error) => error.includes('data_source_id must be a UUID')));
  assert.ok(errors.some((error) => error.includes('date must use YYYY-MM-DD')));
  assert.ok(errors.some((error) => error.includes('database_id is not supported')));
  assert.ok(errors.some((error) => error.includes('filters[0].value is not supported')));
});

test('Notion turns include relative-date context and disciplined nested database guidance', () => {
  const prompt = Core.profileSystemPrompt(profile(), true);
  assert.match(prompt, /Current local date and time:/);
  assert.match(prompt, /data-source or database-view query tool/);
  assert.match(prompt, /Never invent page, database, data source/);
  assert.match(prompt, /Never claim that clickable links are unavailable/);
  assert.match(prompt, /link label must be exactly the page title/);
  assert.doesNotMatch(Core.profileSystemPrompt(profile(), false), /Current local date and time:/);
  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  assert.match(source, /pendingToolRerouteFeedback = completionError/);
  assert.doesNotMatch(source, /pendingReviewFeedback/);
});

test('ordinary assistant text is redirected into the language-independent completion protocol', () => {
  const instruction = Core.completionRequiredInstruction('Draft answer in any language.');
  assert.match(instruction, /byon_complete_task/);
  assert.match(instruction, /another Notion tool/);
  assert.match(instruction, /Draft answer in any language/);
});

test('MCP work has no total round cap and stops only repeated identical no-progress attempts', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  assert.doesNotMatch(source, /MAX_MCP_TOOL_ROUNDS|after .*Notion tool rounds/);
  assert.match(source, /while \(!finalText\)/);

  const progress = { signature: '', count: 0 };
  assert.doesNotThrow(() => Core.throwIfToolCallMadeNoProgress(progress, 'notion-fetch', { id: 'a' }, '{"page":"A"}'));
  assert.doesNotThrow(() => Core.throwIfToolCallMadeNoProgress(progress, 'notion-fetch', { id: 'b' }, '{"page":"B"}'));
  assert.equal(progress.count, 1);

  const stuck = { signature: '', count: 0 };
  assert.doesNotThrow(() => Core.throwIfToolCallMadeNoProgress(stuck, 'notion-fetch', { id: 'a' }, '{"page":"A"}'));
  assert.doesNotThrow(() => Core.throwIfToolCallMadeNoProgress(stuck, 'notion-fetch', { id: 'a' }, '{"page":"A"}'));
  assert.throws(() => Core.throwIfToolCallMadeNoProgress(stuck, 'notion-fetch', { id: 'a' }, '{"page":"A"}'), /identical arguments and an identical result 3 times/);
});

test('provider bodies can require a function call for a corrective continuation', () => {
  const tool = { type: 'function', function: { name: 'notion-fetch', parameters: { type: 'object' } } };
  const chat = Core.buildChatCompletionsBody(profile(), [{ role: 'user', content: 'Continue.' }], {}, { tools: [tool], toolChoice: 'required' });
  assert.equal(chat.tool_choice, 'required');
  const responses = Core.buildResponsesBody(profile({ apiType: 'responses' }), [{ role: 'user', content: 'Continue.' }], {}, { tools: [{ type: 'function', name: 'notion-fetch', parameters: { type: 'object' } }], toolChoice: 'required' });
  assert.equal(responses.tool_choice, 'required');
});

test('tool call payloads are extracted for both OpenAI-compatible formats', () => {
  const chatCall = { id: 'call_1', type: 'function', function: { name: 'search', arguments: '{}' } };
  const responseCall = { type: 'function_call', call_id: 'call_2', name: 'search', arguments: '{}' };
  assert.deepEqual(Core.chatToolCallsFromPayload({ choices: [{ message: { tool_calls: [chatCall] } }] }), [chatCall]);
  assert.deepEqual(Core.responseToolCallsFromPayload({ output: [responseCall, { type: 'message' }] }), [responseCall]);
});

test('MCP completion is an explicit function for both provider wire formats', () => {
  const chat = Core.completionFunctionDefinition('chat_completions');
  assert.equal(chat.function.name, 'byon_complete_task');
  assert.deepEqual(chat.function.parameters.required, ['answer']);
  assert.equal(chat.function.parameters.properties.evidence_call_ids.type, 'string');
  const responses = Core.completionFunctionDefinition('responses');
  assert.equal(responses.name, 'byon_complete_task');
  assert.equal(Core.reviewFunctionDefinition('chat_completions').function.name, 'byon_review_task');
  assert.equal(Core.reviewFunctionDefinition('responses').name, 'byon_review_task');
});

test('MCP completion validates cited evidence structurally in any answer language', () => {
  const activities = [
    { callId: 'call_fetch', toolName: 'notion-fetch', arguments: { id: 'db' }, status: 'completed', resultExcerpt: '{"schema":{"Date":{"type":"date"}}}' },
    { callId: 'call_empty', toolName: 'notion-query-data-sources', arguments: { query: 'today' }, status: 'completed', resultExcerpt: '{"results":[]}' },
    { callId: 'call_confirm', toolName: 'notion-query-data-sources', arguments: { query: 'unfiltered' }, status: 'completed', resultExcerpt: '{"results":[{"name":"Read"}]}' }
  ];
  assert.equal(Core.validateMcpCompletion({ answer: 'Any conclusion in any language.', evidence_call_ids: 'call_empty' }, activities).ok, false);
  assert.equal(Core.validateMcpCompletion({ answer: 'Any conclusion in any language.', evidence_call_ids: 'call_fetch,call_empty' }, activities).ok, false);
  assert.equal(Core.validateMcpCompletion({ answer: 'Reading is scheduled today.', evidence_call_ids: 'call_confirm' }, activities).ok, true);
  assert.equal(Core.validateMcpCompletion({ answer: 'Reading is scheduled today.', evidence_call_ids: 'missing' }, activities).ok, true);
});

test('MCP completion automatically uses successful tool evidence when the model omits call IDs', () => {
  const activities = [
    { callId: 'call_search', toolName: 'notion-search', arguments: { query: 'page' }, status: 'completed', resultExcerpt: '{"results":[],"has_more":true,"next_cursor":"next"}' },
    { callId: 'call_update', toolName: 'notion-update-page', arguments: { page_id: 'page', properties: { Status: 'Done' } }, status: 'completed', resultExcerpt: '{"updated":true,"status":"Done"}' }
  ];
  const validation = Core.validateMcpCompletion({ answer: 'The page status is now Done.' }, activities);
  assert.equal(validation.ok, true);
  assert.deepEqual(validation.evidenceCallIds, ['call_update']);
});

test('semantic reviewer prompt checks evidence rather than matching answer phrases', () => {
  const prompt = Core.mcpCompletionReviewPrompt('¿Qué hábitos tengo hoy?', 'No hay hábitos.', [
    { callId: 'call_1', toolName: 'notion-query-data-sources', arguments: { query: 'hoy' }, status: 'completed', resultExcerpt: '{"results":[]}' }
  ]);
  assert.match(prompt, /whatever language/);
  assert.match(prompt, /actual target and data/);
  assert.match(prompt, /call_1/);
});

test('MCP completion rejects incomplete evidence', () => {
  const activities = [{ callId: 'call_1', toolName: 'notion-fetch', arguments: { id: 'page' }, status: 'completed', resultExcerpt: '{"truncated":true,"unknown_block_count":2}' }];
  assert.equal(Core.resultAppearsIncomplete(activities[0].resultExcerpt), true);
  assert.equal(Core.validateMcpCompletion({ answer: 'The page says hello.', evidence_call_ids: ['call_1'] }, activities).ok, false);
});

test('MCP result inspection uses structure instead of prose and recognizes protocol errors', () => {
  assert.equal(Core.resultAppearsEmpty('{"results":[]}'), true);
  assert.equal(Core.resultAppearsEmpty('{"content":[],"structuredContent":{"results":[1]}}'), false);
  assert.equal(Core.resultAppearsIncomplete('{"has_more":true,"next_cursor":"abc"}'), true);
  assert.equal(Core.mcpResultIsError('{"isError":true,"content":[{"type":"text","text":"failed"}]}'), true);
  assert.equal(Core.mcpResultIsError('{"isError":false,"results":[]}'), false);
});

test('completed MCP evidence is retained for follow-up turns', () => {
  const content = Core.messageContentWithAttachments({
    content: 'Reading is scheduled today.',
    toolActivities: [{ callId: 'call_1', toolName: 'notion-query-data-sources', arguments: { query: 'today' }, status: 'completed', resultExcerpt: '{"results":[{"name":"Read"}]}' }]
  });
  assert.match(content, /Retained Notion MCP evidence/);
  assert.match(content, /call_1/);
  assert.match(content, /notion-query-data-sources/);
  assert.match(content, /Read/);
});

test('Approve for me trusts only explicitly closed-world read-only MCP tools', () => {
  assert.equal(Core.mcpToolMayRunWithoutApproval({ annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false } }), true);
  assert.equal(Core.mcpToolMayRunWithoutApproval({ annotations: { readOnlyHint: true, openWorldHint: true } }), false);
  assert.equal(Core.mcpToolMayRunWithoutApproval({ annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false } }), false);
  assert.equal(Core.mcpToolMayRunWithoutApproval({}), false);
  assert.equal(Core.isOfficialNotionMcpServer('https://mcp.notion.com/mcp'), true);
  assert.equal(Core.isOfficialNotionMcpServer('http://mcp.notion.com/mcp'), false);
  assert.equal(Core.isOfficialNotionMcpServer('https://notion.example/mcp'), false);
});

test('approval mode migration defaults safely and preserves valid choices', () => {
  assert.equal(Core.migrateState({ settings: {}, profiles: [profile()], chats: [] }).settings.toolApprovalMode, 'ask');
  assert.equal(Core.migrateState({ settings: { toolApprovalMode: 'approve_for_me' }, profiles: [profile()], chats: [] }).settings.toolApprovalMode, 'approve_for_me');
  assert.equal(Core.migrateState({ settings: { toolApprovalMode: 'invalid' }, profiles: [profile()], chats: [] }).settings.toolApprovalMode, 'ask');
});

test('Chat Completions preserves assistant tool calls and tool results across rounds', () => {
  const body = Core.buildChatCompletionsBody(profile(), [
    { role: 'user', content: 'Find Sunny.' },
    { role: 'assistant', content: '', tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'notion-search', arguments: '{"query":"Sunny"}' } }] },
    { role: 'tool', tool_call_id: 'call_1', content: '{"content":[{"type":"text","text":"Found"}]}' }
  ], {}, { includeMcpInstruction: true });
  assert.equal(body.messages[2].tool_calls[0].id, 'call_1');
  assert.deepEqual(body.messages[3], { role: 'tool', tool_call_id: 'call_1', content: '{"content":[{"type":"text","text":"Found"}]}' });
});

test('Responses preserves function calls and function outputs across rounds', () => {
  const body = Core.buildResponsesBody(profile({ apiType: 'responses' }), [
    { role: 'user', content: 'Find Sunny.' },
    { type: 'function_call', call_id: 'call_1', name: 'notion-search', arguments: '{"query":"Sunny"}' },
    { type: 'function_call_output', call_id: 'call_1', output: '{"content":[]}' }
  ], {});
  assert.equal(body.input[1].type, 'function_call');
  assert.equal(body.input[2].type, 'function_call_output');
});

test('SSE parser handles chunk boundaries and both streaming formats', () => {
  const first = 'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\ndata: {"type":"response.output_text.delta","delta":"A"}\n\npartial';
  const parsed = Core.parseSseText(first, 0);
  assert.equal(parsed.events.length, 2);
  assert.equal(Core.chatDeltaFromEvent(parsed.events[0]), 'Hel');
  assert.equal(Core.responseDeltaFromEvent(parsed.events[1]), 'A');
  const finished = Core.parseSseText(`${first} event\n\ndata: [DONE]\n\n`, parsed.offset);
  assert.equal(finished.events.length, 0);
});

test('buffered provider responses are extracted', () => {
  assert.equal(Core.extractBufferedText(profile(), JSON.stringify({ choices: [{ message: { content: 'hello' } }] })), 'hello');
  const responseProfile = profile({ apiType: 'responses' });
  assert.equal(Core.extractBufferedText(responseProfile, JSON.stringify({ output: [{ content: [{ type: 'output_text', text: 'world' }] }] })), 'world');
});

test('Markdown renderer escapes raw HTML and rejects unsafe links', () => {
  const html = Core.renderMarkdown('# Title\n<script>alert(1)</script>\n[bad](javascript:alert(1))\n[good](https://example.com?a=1&b=2)\n```js\nconst x = "<tag>";\n```');
  assert.match(html, /<h1>Title<\/h1>/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /href="#"/);
  assert.match(html, /href="https:\/\/example\.com\/\?a=1&amp;b=2"/);
  assert.match(html, /<pre><code/);
});

test('secrets are redacted from provider and MCP errors', () => {
  const p = profile();
  const notionMcp = { accessToken: 'notion-token', refreshToken: 'refresh-secret', headers: { 'X-Gateway-Secret': 'gateway-secret' } };
  const message = Core.redactSecret('Authorization: Bearer super-secret-key x-api-key=super-secret-key gateway-secret notion-token refresh-secret', Core.secretsForProfile(p, notionMcp));
  assert.doesNotMatch(message, /super-secret-key/);
  assert.doesNotMatch(message, /gateway-secret/);
  assert.doesNotMatch(message, /notion-token|refresh-secret/);
  assert.match(message, /\[redacted\]/);
});

test('state migration persists explicit defaults, global MCP, and clamps panel width', () => {
  const migrated = Core.migrateState({ settings: { panelWidth: 9999 }, profiles: [], chats: [] });
  assert.equal(migrated.settings.panelWidth, 720);
  assert.equal(migrated.settings.replacementEnabled, true);
  assert.equal(migrated.profiles.length, 1);
  assert.equal(migrated.profiles[0].apiType, 'chat_completions');
  assert.deepEqual(migrated.profiles[0].selectedModels, []);
  assert.equal(migrated.profiles[0].mcpEnabled, undefined);
  assert.equal(migrated.notionMcp.enabled, false);
  assert.equal(migrated.notionMcp.serverUrl, Core.DEFAULT_MCP_URL);
  const legacyMcp = Core.migrateState({ settings: {}, profiles: [profile({ mcpEnabled: true })], chats: [] });
  assert.equal(legacyMcp.notionMcp.enabled, true);
  assert.equal(legacyMcp.profiles[0].mcpEnabled, undefined);
  const legacyProfile = profile({ model: 'active', discoveredModels: ['active', 'extra'] });
  delete legacyProfile.selectedModels;
  const legacyModels = Core.migrateState({ settings: {}, profiles: [legacyProfile], chats: [] });
  assert.deepEqual(legacyModels.profiles[0].selectedModels, ['active', 'extra']);
});

test('MCP protocol helpers parse Streamable HTTP headers and JSON or SSE payloads', () => {
  assert.equal(Core.parseResponseHeaders('Content-Type: application/json\r\nMcp-Session-Id: session_1\r\n')['mcp-session-id'], 'session_1');
  assert.deepEqual(Core.parseMcpResponseText('{"jsonrpc":"2.0","id":1,"result":{"tools":[]}}').result, { tools: [] });
  assert.equal(Core.parseMcpResponseText('event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"ok":true}}\n\n').result.ok, true);
});

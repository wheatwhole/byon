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
});

test('all saved references contain the AI chat surface and new visual references are present', () => {
  for (const name of ['AIChatSample1.html', 'AIChatSample2.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', 'resources', name), 'utf8');
    assert.match(html, /placeholder="Do anything with AI…"/);
    assert.match(html, /data-testid="unified-chat-model-button"/);
  }
  assert.equal(Core.isNotionAiTriggerLabel('Ask AI', true), true);
  assert.equal(Core.isNotionAiTriggerLabel('AI Meeting Notes', true), false);
  for (const name of ['ChatSelect.html', 'OrganizedModelSelect.html', 'AIFileAndPagePlusButtonSelect.html']) {
    assert.equal(fs.existsSync(path.join(__dirname, '..', 'resources', name)), true);
  }
  for (const name of ['ChatSelect.jpg', 'PlusButtonFileAndPageSelect.jpg', 'modelselect.jpg', 'MODEselectChatCompletionsOrResponses.jpg']) {
    assert.equal(fs.existsSync(path.join(__dirname, '..', 'resources', name)), true);
  }
  for (const name of ['chat.html', 'modelselectcomp.html', 'MODEselectcomp.html']) {
    assert.equal(fs.existsSync(path.join(__dirname, '..', 'componentsExamples', name)), true);
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

test('Chat Completions body includes system, current page, selection, and visible excerpt', () => {
  const p = profile({ systemPrompt: 'Be brief.', mcpMode: 'backend_preconfigured' });
  const body = Core.buildChatCompletionsBody(p, [{ role: 'user', content: 'Update this.' }], {
    title: 'Roadmap', url: 'https://www.notion.so/roadmap', selection: 'Q3 goals', excerpt: 'Rendered blocks', truncated: true
  });
  assert.equal(body.model, 'test-model');
  assert.equal(body.stream, true);
  assert.match(body.messages[0].content, /Be brief/);
  assert.match(body.messages[0].content, /Notion MCP/);
  assert.match(body.messages[1].content, /Current Notion page URL/);
  assert.match(body.messages[1].content, /Q3 goals/);
  assert.match(body.messages[1].content, /potentially incomplete/);
  assert.match(body.messages[1].content, /truncated/);
});

test('provider bodies include text-file attachments on their user message', () => {
  const messages = [{ role: 'user', content: 'Summarize this.', attachments: [{ name: 'notes.txt', type: 'text/plain', size: 4, content: 'Data' }] }];
  const chatBody = Core.buildChatCompletionsBody(profile(), messages, {});
  assert.match(chatBody.messages[0].content, /notes\.txt/);
  assert.match(chatBody.messages[0].content, /Data/);
  const responsesBody = Core.buildResponsesBody(profile({ apiType: 'responses' }), messages, {});
  assert.match(responsesBody.input[0].content, /notes\.txt/);
});

test('Responses body adds remote Notion MCP with approval always', () => {
  const p = profile({
    apiType: 'responses', mcpMode: 'responses_remote', mcpAuthorization: 'notion-token',
    mcpHeaders: { 'X-Gateway': 'yes' }
  });
  const body = Core.buildResponsesBody(p, [{ role: 'user', content: 'Create a page.' }], { title: 'Home', url: 'https://www.notion.so/home' });
  assert.equal(body.tools[0].type, 'mcp');
  assert.equal(body.tools[0].server_url, Core.DEFAULT_MCP_URL);
  assert.equal(body.tools[0].require_approval, 'always');
  assert.equal(body.tools[0].authorization, 'notion-token');
  assert.deepEqual(body.tools[0].headers, { 'X-Gateway': 'yes' });
  assert.equal(body.store, true);
  assert.match(body.instructions, /Never claim/);
});

test('Responses MCP continuation sends only the approval response and repeats instructions', () => {
  const p = profile({ apiType: 'responses', mcpMode: 'responses_remote' });
  const body = Core.buildResponsesBody(p, [], {}, {
    responseId: 'resp_123', approvalRequestId: 'approval_123', approve: false, reason: 'No'
  });
  assert.equal(body.previous_response_id, 'resp_123');
  assert.deepEqual(body.input[0], {
    type: 'mcp_approval_response', approval_request_id: 'approval_123', approve: false, reason: 'No'
  });
  assert.match(body.instructions, /Notion MCP/);
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

test('MCP approval requests are found in response payloads', () => {
  const approval = { type: 'mcp_approval_request', id: 'approval_1', name: 'notion-create-pages' };
  assert.deepEqual(Core.approvalsFromResponsePayload({ output: [approval] }), [approval]);
  assert.deepEqual(Core.approvalsFromResponsePayload({ response: { output: [approval] } }), [approval]);
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

test('secrets are redacted from provider errors', () => {
  const p = profile({ mcpHeaders: { 'X-Gateway-Secret': 'gateway-secret' } });
  const message = Core.redactSecret('Authorization: Bearer super-secret-key x-api-key=super-secret-key gateway-secret', Core.secretsForProfile(p));
  assert.doesNotMatch(message, /super-secret-key/);
  assert.doesNotMatch(message, /gateway-secret/);
  assert.match(message, /\[redacted\]/);
});

test('state migration persists explicit defaults and clamps panel width', () => {
  const migrated = Core.migrateState({ settings: { panelWidth: 9999 }, profiles: [], chats: [] });
  assert.equal(migrated.settings.panelWidth, 720);
  assert.equal(migrated.settings.replacementEnabled, true);
  assert.equal(migrated.profiles.length, 1);
  assert.equal(migrated.profiles[0].apiType, 'chat_completions');
});

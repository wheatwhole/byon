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
  assert.match(source, /isolateByonInputFromNotion/);
  assert.match(source, /'paste', 'copy', 'cut'/);
});

test('full-page mode is restricted to Notion /ai and navigates there when requested', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'byon.user.js'), 'utf8');
  assert.match(source, /function isNotionAiPath\(\)[\s\S]*?\/\^\\\/ai/);
  assert.match(source, /global\.location\.assign\(new URL\('\/ai', global\.location\.origin\)\.href\)/);
  assert.match(source, /if \(nextMode === 'full' && !isNotionAiPath\(\)\)/);
  assert.match(source, /if \(!isNotionAiPath\(\)\) \{[\s\S]*?panel\.hidden = true/);
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
  for (const name of ['fullPageStartAChat.html', 'fullPageChatting.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
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
  const p = profile({ systemPrompt: 'Be brief.', mcpEnabled: true });
  const tools = Core.mcpFunctionDefinitions([{ name: 'notion-search', description: 'Search Notion', inputSchema: { type: 'object', properties: { query: { type: 'string' } } } }], 'chat_completions');
  const body = Core.buildChatCompletionsBody(p, [{ role: 'user', content: 'Update this.' }], {
    title: 'Roadmap', url: 'https://www.notion.so/roadmap', selection: 'Q3 goals', excerpt: 'Rendered blocks', truncated: true
  }, { stream: false, tools: tools.map((tool) => tool.modelTool) });
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
  const p = profile({ apiType: 'responses', mcpEnabled: true });
  const definitions = Core.mcpFunctionDefinitions([{ name: 'notion-create-pages', description: 'Create pages', inputSchema: { type: 'object' } }], 'responses');
  const body = Core.buildResponsesBody(p, [{ role: 'user', content: 'Create a page.' }], { title: 'Home', url: 'https://www.notion.so/home' }, { stream: false, tools: definitions.map((tool) => tool.modelTool) });
  assert.equal(body.tools[0].type, 'function');
  assert.equal(body.tools[0].name, 'notion-create-pages');
  assert.equal(body.stream, false);
  assert.equal(body.store, false);
  assert.match(body.instructions, /Never claim/);
});

test('MCP schemas are normalized to the conservative llama.cpp subset', () => {
  const source = {
    type: 'object',
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
  assert.equal(normalized.$defs, undefined);
  assert.equal(normalized.properties.forbidden.not, undefined);
});

test('MCP tool selection keeps core read tools and intent-relevant write tools', () => {
  const tools = [
    'notion-search', 'notion-fetch', 'notion-create-pages', 'notion-update-page', 'notion-move-pages',
    'notion-get-users', 'notion-get-comments', 'notion-create-comment', 'notion-create-view', 'notion-download-attachment'
  ].map((name) => ({ name, description: name }));
  const selected = Core.selectMcpToolsForTurn(tools, 'Create a new page under my Sunny page', 6).map((tool) => tool.name);
  assert.deepEqual(selected.slice(0, 3), ['notion-search', 'notion-fetch', 'notion-create-pages']);
  assert.equal(selected.length <= 6, true);
  assert.equal(selected.includes('notion-download-attachment'), false);
  const habits = Core.selectMcpToolsForTurn(tools.concat([{ name: 'notion-query-data-sources', description: 'Query databases' }]), 'What are my habits today?', 6).map((tool) => tool.name);
  assert.equal(habits.includes('notion-query-data-sources'), true);
});

test('MCP tool grammar fallback uses a universal string envelope and unwraps it', () => {
  const [definition] = Core.mcpFunctionDefinitions([{ name: 'notion-update-page', inputSchema: { type: 'object', properties: { page_id: { type: 'string' } }, required: ['page_id'] } }], 'chat_completions', { schemaMode: 'json_envelope' });
  assert.deepEqual(definition.modelTool.function.parameters.required, ['arguments_json']);
  assert.deepEqual(Core.argumentsForMcpTool(definition, JSON.stringify({ arguments_json: '{"page_id":"abc"}' })), { page_id: 'abc' });
  assert.equal(Core.isToolGrammarCompilationError(new Error("The model couldn't compile a tool-calling grammar for this request.")), true);
  assert.equal(Core.isToolGrammarCompilationError(new Error('HTTP 401: Unauthorized')), false);
});

test('stalled tool promises are detected without treating ordinary final answers as unfinished', () => {
  assert.equal(Core.appearsToStopBeforeToolCall('I found the Habit Tracker. Let me fetch that database directly:'), true);
  assert.equal(Core.appearsToStopBeforeToolCall('To answer that, I need to query the database.'), true);
  assert.equal(Core.appearsToStopBeforeToolCall("I'll check the page now."), true);
  assert.equal(Core.appearsToStopBeforeToolCall('Your habits today are walking, reading, and stretching.'), false);
  assert.equal(Core.appearsToStopBeforeToolCall('You can fetch the database manually if you want more detail.'), false);
});

test('stalled tool continuation tells the model to call now rather than repeat progress', () => {
  const instruction = Core.continuationInstruction('Let me fetch that.');
  assert.match(instruction, /Call the appropriate available function now/);
  assert.match(instruction, /Do not repeat the progress summary/);
  assert.match(instruction, /Let me fetch that/);
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

test('Chat Completions preserves assistant tool calls and tool results across rounds', () => {
  const body = Core.buildChatCompletionsBody(profile({ mcpEnabled: true }), [
    { role: 'user', content: 'Find Sunny.' },
    { role: 'assistant', content: '', tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'notion-search', arguments: '{"query":"Sunny"}' } }] },
    { role: 'tool', tool_call_id: 'call_1', content: '{"content":[{"type":"text","text":"Found"}]}' }
  ], {});
  assert.equal(body.messages[2].tool_calls[0].id, 'call_1');
  assert.deepEqual(body.messages[3], { role: 'tool', tool_call_id: 'call_1', content: '{"content":[{"type":"text","text":"Found"}]}' });
});

test('Responses preserves function calls and function outputs across rounds', () => {
  const body = Core.buildResponsesBody(profile({ apiType: 'responses', mcpEnabled: true }), [
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

test('state migration persists explicit defaults and clamps panel width', () => {
  const migrated = Core.migrateState({ settings: { panelWidth: 9999 }, profiles: [], chats: [] });
  assert.equal(migrated.settings.panelWidth, 720);
  assert.equal(migrated.settings.replacementEnabled, true);
  assert.equal(migrated.profiles.length, 1);
  assert.equal(migrated.profiles[0].apiType, 'chat_completions');
  assert.equal(migrated.profiles[0].mcpEnabled, false);
  assert.equal(migrated.notionMcp.serverUrl, Core.DEFAULT_MCP_URL);
});

test('MCP protocol helpers parse Streamable HTTP headers and JSON or SSE payloads', () => {
  assert.equal(Core.parseResponseHeaders('Content-Type: application/json\r\nMcp-Session-Id: session_1\r\n')['mcp-session-id'], 'session_1');
  assert.deepEqual(Core.parseMcpResponseText('{"jsonrpc":"2.0","id":1,"result":{"tools":[]}}').result, { tools: [] });
  assert.equal(Core.parseMcpResponseText('event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"ok":true}}\n\n').result.ok, true);
});

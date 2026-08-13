// ==UserScript==
// @name         BYON - Bring Your Own Notion AI
// @namespace    https://github.com/byon-userscript/byon
// @version      0.2.2
// @description  Use your own OpenAI-compatible AI backend from a native-styled Notion chat panel.
// @author       BYON contributors
// @license      MIT
// @match        https://www.notion.so/*
// @match        https://app.notion.com/*
// @connect      *
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @run-at       document-start
// ==/UserScript==

(function byonUserscript(global) {
  'use strict';

  const VERSION = '0.2.2';
  const STORAGE_KEY = 'byon-state-v1';
  const PANEL_MIN_WIDTH = 320;
  const PANEL_MAX_WIDTH = 720;
  const DEFAULT_PANEL_WIDTH = 464;
  const PAGE_EXCERPT_LIMIT = 40000;
  const MAX_TEXT_FILE_BYTES = 5 * 1024 * 1024;
  const MAX_TOTAL_ATTACHMENT_CHARS = 100000;
  const DEFAULT_MCP_URL = 'https://mcp.notion.com/mcp';
  const BYON_ICON_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAABPlBMVEUAAADrw2zqwmvqwWvqwmzqwmvowWzrwWvfv3Dnv2jnv3Dqwmvvx2jvx3DpwWzqwWzqwm3rw2zrwmvqwmvrwmzqwm3owmvrwmvrw2rswmzvz3Dvv3DpwWvpwmrrwmvrwmrqv2rpwmzowWrsxGvnx3DqwWzqwWvqwmrqxWrtw2rowmnqw2tdUTOppJeqpJefhk2xlVXf3NiUjX3q6OV/d2OWfkn09PKCb0Lf3dhxYDrFpFzhumfe3djNq2CKgXC6nFh1a1ZfVDxpYEmylVWKgnCemYq/urHJx767nVjKxr6JgXCfmIqNdkbqwmvFo1xUSS9nWDdeUTOpjVHOq2CDb0Lgu2d6Zz6fhU1wYDqVfknp6OWfmYrJxr67nFiJgnC0r6R0bFbXs2T19PJqYEn///+ojVG/u7HU0cuylFWMdkaaFTKwAAAALHRSTlMAQN/fv5+Q7xAgIL8gIICQYM/v76+PcI9/UBAQoK9wrzBQsF8gz89gMG9wz2uCGYIAAAaNSURBVHja7ZpdX9pIFMYnBGgtXbor2laxun2T7m6xCkhba7cb2n1hd8cJAkFABTSCfP8vsKsixwknk2QyqTf93+XG5/md85wzEyKR4sXT1cVEStfpJfp66sniqvaKfBWWc4upeYoyn1p8+h2JFG1Rpx6sL2qRqSfmqS/mE1oElX8M6j6IJdT2QkvRwDzRbkkeiOVuSR6Iha/CfZCXArIgGT0amsdhqh+jwNfvw/IjqohHct2PUWXEJJLwXLh4mkf77caBWWMXmAdWo7W/16TuZH4mARGUv77fqDGMmtU+aqrJ4vIadWGvDeIoB+09l82YDdD+XyhKvQXqAsxxHQ9CyPjtWcw35rmEA9CXlwfM1gBxIK1ft1hgzDPEgZx+s8WcnB53h4edjv0/J53RYa973McaEdzBMqK/ZzKOfvfwxJ7lZNQ7NhjP2NmHda9ZQObvjN2klO/YArbyfCXMHec0EiGPZ8vfYIBRGNmebBVOGQNaQQ6Gn6iTgclAPg+VFzO8aWGb8jwXBHBepF8o2kAQCxa/nzPuQYwJ9E9HdjDy4OCAdxDLCg8gXL97YgelCEWwfMVAc9c3qjYgU4R/KYfmqwHNqf5p0ZajB7OANkE8gdP56xdtWbYMNoHfB2lkAqiD1lQf2h/CwWs+iLOTkHDu35D64AANYkqUQAgg9F+eP9iEIz6HHgkcq9KHWTCbghLkKE+dTaja4Smhk6AJC3DdgLytgKKB5TAlSsD5dQNsJeQ9S7DgUoCirYZTjxLcdylA11bECC1B1nUHmPwEqMvha5d1GMMLMLSV8Se2kDNuEbQggcqYDEKbjyHegYGPApQ3vpS6HXgqwRNOHutBglyRQZegURQveLBYvXwyhB0rCnqg4REs2K50KuyKd5dPxsRxxzOGeA8e4MfgO9uVAmNgEp66PnpgclpJcsEPlGPbO4IVNsG4zBc8CdhlV3C7KIZtoffepwCbcpFAePIzB3/N7KIlfAbe+TFgcAZ+s0UUsBB8PxuBIx9LoAQZ4J78XFCtmRCk0Aj8ags4ZDcPqyE8idjFNkFqdgtYftZwnstJAZ4ElCGF3CZ4RXlqEAEBwz4zSiPkyftM/sjJ3XOuoY8QaNUcs0vOOb0lsoqsIQi0Sn7H7gQPnUNwDhlUCozB2DEGC+j7UNdWDEzLW/5AdE7hGEm02nvZe04v7jwJ3sIUqmYXO45iJIaugaqtniJugKIGRtEZYJQjegPANwNBDFRvwQA6htEbcI7hOHoD4j2wHd0mLGMG1kkKPQsK0e2B145VvCI6DaM/C565vJZUbClkbqWr+K38JLILSdtxIVmiPLXINlGfXbLpeDucwzeR+jHoMOxS+iMhGXQMSrZqhtgQZGZfTHbg1UwtJexGFodXM2cI8hF1YHPm1SxH0V1oKJ6DAvqr/RIhJEvxHvxjq+SQYZdyeg/7ndhi6iexXGFXDPiTAH6iQUpgdBQ2AC9AEn6kwkpQUeZgg00YoF/PMm4fCyojxfpvKMV+Kl1x/16+oaL/XTbBpDwJ+KkWacIVlWHoBdBnE2oDinUAegB8MBkDC2GiUN5gUz5RHp1ck0a/2gNfhmVZeYMxCADeAdhFXA0sxlHqBQ/kqGswTB+20JQUneUNc1LqVn3v53KVU2e1TerkGf7RCtgxGRBgO3aqvUKf8Zh1CkAE8RIAZ6bYQHkEDIfDXr5QKJ0yhHaTAhBBrgQog01TZKDPfGHuUIQcIYISAJuWq4GuP3noPlIAUQmgDBZqYIP5wDqiAJYAvAR4IHkDPeaJ+Qayh+wAnjkqxHIaqDIxtcbZgALoDuBJBzLQMdylzUb7M4ijpMksWd2/AfhsxaxrxuNxq/X5qI5ICxMIaP4NlCuwYGXQCMoD3wb+DqefJADeBLEBWAANKoNO3JjL+DKwwf2PWGDu3COu5HwYgAVgDqgMD4mAB94GtkLqp4mQNS8DMIB1KsMaEZNdFxsA/TO5AN4lHszpIgPVfrgB1CGAQRyAgal+W1pf0sFbxmFJ68s6aHH6ZlNWX9rBDgMkB3Ad9D3Jzk7jNujXpPTXhPn3vh18eD/V/6ToABLzMOPypmLVZfZ/jgDSQRhstsetHcXxEx8MikjeJXJoOlWArhF50jQ06bskDHMrNBRxUfej70NcIyrI6bckD2gLtyYPWdADLR6Injq0lTs+1RMaiQgt+dJz6pMaiZS5pWTcpRJ34skcVD5SXmmryYX4y0ksdD2eSK4uvZD6U/8BYsW8TtKUmBsAAAAASUVORK5CYII=';
  const NOTION_INSTRUCTION = [
    'You can use Notion MCP tools to work with the user\'s Notion workspace.',
    'Use those tools whenever the user asks you to search, read, create, or change Notion pages, databases, properties, comments, or blocks.',
    'When the current Notion page URL is relevant, use it as the target or fetch it before acting.',
    'Never claim that a Notion action succeeded unless the corresponding tool returned a successful result.',
    'If a required Notion tool is unavailable, denied, or fails, explain that clearly instead of pretending the change happened.'
  ].join(' ');

  const nowIso = () => new Date().toISOString();
  const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function defaultProfile() {
    return {
      id: uid('profile'),
      name: 'OpenAI-compatible',
      baseUrl: 'https://api.openai.com/v1',
      apiType: 'chat_completions',
      model: '',
      authMode: 'bearer',
      apiKey: '',
      headerName: 'x-api-key',
      headerPrefix: '',
      systemPrompt: '',
      mcpMode: 'off',
      mcpUrl: DEFAULT_MCP_URL,
      mcpServerLabel: 'notion',
      mcpAuthorization: '',
      mcpHeaders: {},
      discoveredModels: []
    };
  }

  function defaultState() {
    const profile = defaultProfile();
    return {
      version: 1,
      settings: {
        replacementEnabled: true,
        panelWidth: DEFAULT_PANEL_WIDTH,
        activeProfileId: profile.id
      },
      profiles: [profile],
      chats: [],
      activeChatId: null
    };
  }

  function normalizeBaseUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
  }

  function endpointFor(profile, operation) {
    const base = normalizeBaseUrl(profile.baseUrl);
    if (!base) throw new Error('Enter a provider base URL first.');
    if (operation === 'models') return `${base}/models`;
    return profile.apiType === 'responses' ? `${base}/responses` : `${base}/chat/completions`;
  }

  function authHeaders(profile) {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
    const key = String(profile.apiKey || '').trim();
    if (profile.authMode === 'bearer' && key) headers.Authorization = `Bearer ${key}`;
    if (profile.authMode === 'custom' && key) {
      const name = String(profile.headerName || '').trim();
      if (!name || /[\r\n:]/.test(name)) throw new Error('Enter a valid custom authentication header name.');
      const value = `${profile.headerPrefix || ''}${key}`;
      if (/[\r\n]/.test(value)) throw new Error('Authentication header values cannot contain line breaks.');
      headers[name] = value;
    }
    return headers;
  }

  function redactSecret(text, secrets) {
    let safe = String(text == null ? '' : text);
    for (const secret of secrets || []) {
      const value = String(secret || '');
      if (value.length >= 4) safe = safe.split(value).join('[redacted]');
    }
    safe = safe.replace(/(authorization\s*[:=]\s*(?:bearer\s+)?)[^\s,;"']+/gi, '$1[redacted]');
    safe = safe.replace(/((?:api[-_ ]?key|x-api-key)\s*[:=]\s*)[^\s,;"']+/gi, '$1[redacted]');
    return safe;
  }

  function parseHeaderObject(value) {
    if (!value) return {};
    const parsed = typeof value === 'object' && !Array.isArray(value) ? value : JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('MCP headers must be a JSON object.');
    const headers = {};
    for (const [name, rawValue] of Object.entries(parsed)) {
      const value = String(rawValue);
      if (!name || /[\r\n:]/.test(name) || /[\r\n]/.test(value)) throw new Error('MCP header names and values cannot contain colons or line breaks.');
      headers[name] = value;
    }
    return headers;
  }

  function secretsForProfile(profile) {
    const headers = profile && profile.mcpHeaders && typeof profile.mcpHeaders === 'object' && !Array.isArray(profile.mcpHeaders)
      ? Object.values(profile.mcpHeaders)
      : [];
    return [profile?.apiKey, profile?.mcpAuthorization, ...headers];
  }

  function profileSystemPrompt(profile) {
    return [profile.systemPrompt && profile.systemPrompt.trim(), profile.mcpMode !== 'off' && NOTION_INSTRUCTION]
      .filter(Boolean)
      .join('\n\n');
  }

  function contextText(context) {
    const parts = [];
    if (context.title) parts.push(`Current Notion page title: ${context.title}`);
    if (context.url) parts.push(`Current Notion page URL: ${context.url}`);
    if (context.selection) parts.push(`Selected text from the page:\n${context.selection}`);
    if (context.excerpt) {
      parts.push([
        'Visible Notion page excerpt (potentially incomplete because the page may be virtualized):',
        context.excerpt,
        context.truncated ? '[Visible excerpt truncated by BYON.]' : ''
      ].filter(Boolean).join('\n'));
    }
    return parts.join('\n\n');
  }

  function attachmentsText(attachments) {
    if (!Array.isArray(attachments) || !attachments.length) return '';
    return attachments.map((attachment) => [
      `Attached text file: ${attachment.name}`,
      `Type: ${attachment.type || 'text/plain'} · Size: ${attachment.size || attachment.content.length} bytes`,
      '--- file contents ---',
      attachment.content,
      attachment.truncated ? '[File truncated by BYON attachment limit.]' : '',
      '--- end file ---'
    ].filter(Boolean).join('\n')).join('\n\n');
  }

  function messageContentWithAttachments(message) {
    const files = attachmentsText(message.attachments);
    return files ? `${message.content}\n\n${files}` : message.content;
  }

  function isSupportedTextFile(file) {
    const name = String(file?.name || '').toLowerCase();
    const type = String(file?.type || '').toLowerCase();
    return type.startsWith('text/') || /\.(?:txt|md|markdown|csv|tsv|json|jsonl|html?|xml|ya?ml|toml|ini|log|sql|css|s[ac]ss|less|js|jsx|mjs|cjs|ts|tsx|py|rb|php|go|rs|java|kt|kts|c|h|cc|cpp|cxx|hpp|cs|swift|sh|bash|zsh|fish|ps1|bat|cmd|tex|rst|rtf|properties|conf|cfg|env\.example)$/i.test(name);
  }

  function modelGroup(model) {
    const value = String(model || '').toLowerCase();
    if (/gpt|o[134](?:-|$)|openai/.test(value)) return 'OpenAI';
    if (/claude|sonnet|opus|haiku/.test(value)) return 'Anthropic';
    if (/gemini|gemma/.test(value)) return 'Google';
    if (/llama|meta/.test(value)) return 'Meta';
    if (/mistral|mixtral|codestral/.test(value)) return 'Mistral';
    if (/deepseek/.test(value)) return 'DeepSeek';
    if (/qwen/.test(value)) return 'Qwen';
    return 'Other models';
  }

  function buildChatCompletionsBody(profile, messages, context) {
    const system = profileSystemPrompt(profile);
    const wireMessages = [];
    if (system) wireMessages.push({ role: 'system', content: system });
    for (let index = 0; index < messages.length; index += 1) {
      const message = messages[index];
      let content = messageContentWithAttachments(message);
      if (index === messages.length - 1 && message.role === 'user') {
        const attached = contextText(context);
        if (attached) content = `${attached}\n\nUser message:\n${content}`;
      }
      wireMessages.push({ role: message.role, content });
    }
    return { model: profile.model, messages: wireMessages, stream: true };
  }

  function remoteMcpTool(profile) {
    const tool = {
      type: 'mcp',
      server_label: profile.mcpServerLabel || 'notion',
      server_url: profile.mcpUrl || DEFAULT_MCP_URL,
      require_approval: 'always'
    };
    if (profile.mcpAuthorization) tool.authorization = profile.mcpAuthorization;
    const headers = parseHeaderObject(profile.mcpHeaders);
    if (Object.keys(headers).length) tool.headers = headers;
    return tool;
  }

  function buildResponsesBody(profile, messages, context, continuation) {
    const input = messages.map((message, index) => {
      let content = messageContentWithAttachments(message);
      if (index === messages.length - 1 && message.role === 'user') {
        const attached = contextText(context);
        if (attached) content = `${attached}\n\nUser message:\n${content}`;
      }
      return { role: message.role, content };
    });
    const body = {
      model: profile.model,
      instructions: profileSystemPrompt(profile) || undefined,
      input,
      stream: true,
      // Remote MCP approval continuation references this response by ID.
      store: profile.mcpMode === 'responses_remote'
    };
    if (profile.mcpMode === 'responses_remote') body.tools = [remoteMcpTool(profile)];
    if (continuation) {
      body.previous_response_id = continuation.responseId;
      body.input = [{
        type: 'mcp_approval_response',
        approval_request_id: continuation.approvalRequestId,
        approve: Boolean(continuation.approve),
        reason: continuation.reason || undefined
      }];
      // Responses instructions are not inherited when previous_response_id is used.
      body.instructions = profileSystemPrompt(profile) || undefined;
    }
    return body;
  }

  function parseSseText(text, offset) {
    const normalized = String(text || '').replace(/\r\n/g, '\n');
    const events = [];
    let cursor = offset || 0;
    while (true) {
      const boundary = normalized.indexOf('\n\n', cursor);
      if (boundary < 0) break;
      const block = normalized.slice(cursor, boundary);
      cursor = boundary + 2;
      const data = block.split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n');
      if (!data || data === '[DONE]') continue;
      try { events.push(JSON.parse(data)); } catch (_) { /* incomplete/foreign event */ }
    }
    return { events, offset: cursor };
  }

  function chatDeltaFromEvent(event) {
    return event && event.choices && event.choices[0] && event.choices[0].delta
      ? event.choices[0].delta.content || ''
      : '';
  }

  function responseDeltaFromEvent(event) {
    if (!event) return '';
    if (event.type === 'response.output_text.delta') return event.delta || '';
    return '';
  }

  function approvalsFromResponsePayload(payload) {
    const output = payload && payload.output ? payload.output : payload && payload.response && payload.response.output;
    return Array.isArray(output) ? output.filter((item) => item && item.type === 'mcp_approval_request') : [];
  }

  function extractBufferedText(profile, text) {
    const payload = JSON.parse(text);
    if (profile.apiType === 'responses') {
      if (typeof payload.output_text === 'string') return payload.output_text;
      return (payload.output || []).flatMap((item) => item.content || [])
        .filter((part) => part.type === 'output_text')
        .map((part) => part.text || '')
        .join('');
    }
    const content = payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map((part) => part.text || '').join('');
    return '';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeLink(href) {
    try {
      const url = new URL(href, global.location ? global.location.href : 'https://www.notion.so/');
      return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : '#';
    } catch (_) { return '#'; }
  }

  function renderMarkdown(markdown) {
    const codeBlocks = [];
    let text = escapeHtml(markdown).replace(/```([\w-]*)\n?([\s\S]*?)```/g, (_, language, code) => {
      const token = `\u0000CODE${codeBlocks.length}\u0000`;
      codeBlocks.push(`<pre><code data-language="${escapeHtml(language)}">${code.trimEnd()}</code></pre>`);
      return token;
    });
    text = text
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${escapeHtml(safeLink(href.replace(/&amp;/g, '&')))}" target="_blank" rel="noopener noreferrer">${label}</a>`)
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
    const lines = text.split('\n');
    const html = [];
    let listType = null;
    const closeList = () => { if (listType) { html.push(`</${listType}>`); listType = null; } };
    for (const line of lines) {
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      const unordered = line.match(/^\s*[-*]\s+(.+)$/);
      const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
      if (heading) { closeList(); const level = heading[1].length; html.push(`<h${level}>${heading[2]}</h${level}>`); }
      else if (unordered || ordered) {
        const nextType = unordered ? 'ul' : 'ol';
        if (listType !== nextType) { closeList(); listType = nextType; html.push(`<${listType}>`); }
        html.push(`<li>${(unordered || ordered)[1]}</li>`);
      } else if (!line.trim()) { closeList(); html.push('<br>'); }
      else if (/^\u0000CODE\d+\u0000$/.test(line)) { closeList(); html.push(line); }
      else { closeList(); html.push(`<p>${line}</p>`); }
    }
    closeList();
    return html.join('').replace(/\u0000CODE(\d+)\u0000/g, (_, index) => codeBlocks[Number(index)] || '');
  }

  function isNotionAiTriggerLabel(label, hasFace) {
    const normalized = String(label || '').replace(/\s+/g, ' ').trim();
    return /^(ask ai|notion ai|new ai chat)$/i.test(normalized) || (Boolean(hasFace) && /ask ai/i.test(normalized));
  }

  function migrateState(raw) {
    const fallback = defaultState();
    if (!raw || typeof raw !== 'object') return fallback;
    const profiles = Array.isArray(raw.profiles) && raw.profiles.length
      ? raw.profiles.map((profile) => ({ ...defaultProfile(), ...profile, mcpHeaders: profile.mcpHeaders || {} }))
      : fallback.profiles;
    const chats = Array.isArray(raw.chats) ? raw.chats.filter((chat) => chat && Array.isArray(chat.messages)) : [];
    const activeProfileId = profiles.some((profile) => profile.id === raw.settings?.activeProfileId)
      ? raw.settings.activeProfileId
      : profiles[0].id;
    return {
      version: 1,
      settings: {
        replacementEnabled: raw.settings?.replacementEnabled !== false,
        panelWidth: clamp(Number(raw.settings?.panelWidth) || DEFAULT_PANEL_WIDTH, PANEL_MIN_WIDTH, PANEL_MAX_WIDTH),
        activeProfileId
      },
      profiles,
      chats,
      activeChatId: chats.some((chat) => chat.id === raw.activeChatId) ? raw.activeChatId : chats[0]?.id || null
    };
  }

  const Core = {
    VERSION, DEFAULT_MCP_URL, NOTION_INSTRUCTION, defaultState, defaultProfile, normalizeBaseUrl,
    endpointFor, authHeaders, redactSecret, parseHeaderObject, profileSystemPrompt, contextText,
    buildChatCompletionsBody, buildResponsesBody, parseSseText, chatDeltaFromEvent,
    responseDeltaFromEvent, approvalsFromResponsePayload, extractBufferedText, escapeHtml,
    safeLink, renderMarkdown, isNotionAiTriggerLabel, secretsForProfile, attachmentsText,
    messageContentWithAttachments, isSupportedTextFile, modelGroup, migrateState, clamp
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  if (!global.document || !global.location || !/\.notion\.(?:so|com)$/.test(global.location.hostname)) return;

  function gmApi() {
    const modern = typeof GM !== 'undefined' ? GM : {};
    const legacy = typeof globalThis !== 'undefined' ? globalThis : global;
    return {
      async getValue(key, fallback) {
        if (typeof legacy.GM_getValue === 'function') return legacy.GM_getValue(key, fallback);
        if (typeof modern.getValue === 'function') return modern.getValue(key, fallback);
        return fallback;
      },
      async setValue(key, value) {
        if (typeof legacy.GM_setValue === 'function') return legacy.GM_setValue(key, value);
        if (typeof modern.setValue === 'function') return modern.setValue(key, value);
      },
      request(details) {
        const request = typeof legacy.GM_xmlhttpRequest === 'function' ? legacy.GM_xmlhttpRequest : modern.xmlHttpRequest;
        if (!request) throw new Error('This userscript manager does not provide GM_xmlhttpRequest.');
        return request(details);
      },
      menu(label, callback) {
        const register = typeof legacy.GM_registerMenuCommand === 'function' ? legacy.GM_registerMenuCommand : modern.registerMenuCommand;
        if (register) register(label, callback);
      },
      clipboard(text) {
        if (typeof legacy.GM_setClipboard === 'function') return legacy.GM_setClipboard(text, 'text/plain');
        if (typeof modern.setClipboard === 'function') return modern.setClipboard(text, 'text/plain');
        return global.navigator.clipboard.writeText(text);
      }
    };
  }

  const gm = gmApi();
  let state = defaultState();
  let host;
  let shadow;
  let panel;
  let currentRequest = null;
  let settingsOpen = false;
  let historyOpen = false;
  let plusOpen = false;
  let modelOpen = false;
  let modeOpen = false;
  let chatSearch = '';
  let modelSearch = '';
  let draftAttachments = [];
  let includeVisiblePage = false;
  let lastNotionSelection = '';
  let replacementObserver = null;
  const restoredTriggers = new Map();

  async function persist() {
    await gm.setValue(STORAGE_KEY, state);
  }

  function activeProfile() {
    return state.profiles.find((profile) => profile.id === state.settings.activeProfileId) || state.profiles[0];
  }

  function activeChat() {
    return state.chats.find((chat) => chat.id === state.activeChatId) || null;
  }

  function makeChat() {
    const chat = { id: uid('chat'), title: 'New chat', createdAt: nowIso(), updatedAt: nowIso(), messages: [] };
    state.chats.unshift(chat);
    state.activeChatId = chat.id;
    persist();
    return chat;
  }

  function pageContext() {
    const title = (document.querySelector('.notion-page-block [contenteditable="true"]')?.textContent || document.title || '')
      .replace(/\s*\|\s*Notion\s*$/i, '').trim();
    const context = { title, url: global.location.href, selection: lastNotionSelection, excerpt: '', truncated: false };
    if (includeVisiblePage) {
      const seen = new Set();
      const chunks = [];
      let length = 0;
      for (const block of document.querySelectorAll('.notion-page-content [data-block-id]')) {
        if (block.querySelector(':scope [data-block-id]')) continue;
        const text = String(block.innerText || block.textContent || '').replace(/\s+\n/g, '\n').trim();
        if (!text || seen.has(text)) continue;
        seen.add(text);
        if (length + text.length + 2 > PAGE_EXCERPT_LIMIT) {
          chunks.push(text.slice(0, Math.max(0, PAGE_EXCERPT_LIMIT - length)));
          context.truncated = true;
          break;
        }
        chunks.push(text);
        length += text.length + 2;
      }
      context.excerpt = chunks.join('\n\n').slice(0, PAGE_EXCERPT_LIMIT);
    }
    return context;
  }

  function notionThemeContainer() {
    return document.querySelector('.notion-app-inner.notion-dark-theme, .notion-app-inner.notion-light-theme, .notion-app-inner, #notion-app') || document.body || document.documentElement;
  }

  function ensureHost() {
    const themeContainer = notionThemeContainer();
    if (host && host.isConnected) {
      if (host.parentElement !== themeContainer) themeContainer.appendChild(host);
      return;
    }
    host = document.createElement('div');
    host.id = 'byon-root';
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;';
    shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${STYLES}</style><div id="byon-live" class="sr-only" aria-live="polite"></div><div id="byon-panel" class="panel" hidden></div>`;
    // Mount inside Notion's themed application container so every current and
    // future Notion color token crosses the shadow-host boundary naturally.
    themeContainer.appendChild(host);
    panel = shadow.getElementById('byon-panel');
  }

  function announce(message) {
    ensureHost();
    shadow.getElementById('byon-live').textContent = message;
  }

  function openPanel(openSettings) {
    ensureHost();
    settingsOpen = Boolean(openSettings);
    historyOpen = false;
    plusOpen = false;
    modelOpen = false;
    modeOpen = false;
    panel.hidden = false;
    render();
    setTimeout(() => shadow.querySelector(settingsOpen ? '[data-field="profile-name"]' : '#byon-composer')?.focus(), 0);
  }

  function closePanel() {
    if (panel) panel.hidden = true;
  }

  function profileOptions() {
    return state.profiles.map((profile) => `<option value="${escapeHtml(profile.id)}" ${profile.id === state.settings.activeProfileId ? 'selected' : ''}>${escapeHtml(profile.name)}</option>`).join('');
  }

  function chatRows() {
    const query = chatSearch.trim().toLowerCase();
    const chats = state.chats.filter((chat) => !query || chat.title.toLowerCase().includes(query));
    if (!chats.length) return `<div class="empty-small">${state.chats.length ? 'No matching chats.' : 'No saved chats yet.'}</div>`;
    return chats.map((chat) => `<div class="menu-row chat-row ${chat.id === state.activeChatId ? 'selected' : ''}">
      <button class="history-open" data-chat-id="${escapeHtml(chat.id)}"><span class="menu-icon">${chat.id === state.activeChatId ? '✓' : '○'}</span><span class="menu-label">${escapeHtml(chat.title)}</span></button>
      <button class="row-action" data-rename-chat="${escapeHtml(chat.id)}" aria-label="Rename ${escapeHtml(chat.title)}">${iconSvg('more')}</button>
      <button class="row-action danger" data-delete-chat="${escapeHtml(chat.id)}" aria-label="Delete ${escapeHtml(chat.title)}">${iconSvg('trash')}</button>
    </div>`).join('');
  }

  function modelOptions(profile) {
    const models = Array.from(new Set([profile.model, ...(profile.discoveredModels || [])].filter(Boolean)));
    if (!models.length) return '<option value="">Choose a model</option>';
    return models.map((model) => `<option value="${escapeHtml(model)}" ${model === profile.model ? 'selected' : ''}>${escapeHtml(model)}</option>`).join('');
  }

  function availableModels(profile) {
    return Array.from(new Set([profile.model, ...(profile.discoveredModels || [])].filter(Boolean)));
  }

  function groupedModelRows(profile) {
    const query = modelSearch.trim().toLowerCase();
    const groups = new Map();
    for (const model of availableModels(profile)) {
      if (query && !model.toLowerCase().includes(query)) continue;
      const group = modelGroup(model);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(model);
    }
    if (!groups.size) return '<div class="empty-small">No matching models. Discover models in settings or enter one manually.</div>';
    return Array.from(groups.entries()).map(([group, models]) => `<section class="model-group"><div class="menu-section-label">${escapeHtml(group)}</div>${models.map((model) => `<button class="model-row ${model === profile.model ? 'selected' : ''}" data-model="${escapeHtml(model)}"><span class="model-logo">${escapeHtml(model.slice(0, 1).toUpperCase())}</span><span class="model-copy"><strong>${escapeHtml(model)}</strong><small>${model === profile.model ? 'Currently selected' : 'Available from your provider'}</small></span>${model === profile.model ? '<span class="check">✓</span>' : ''}</button>`).join('')}</section>`).join('');
  }

  function byonIcon(className = 'byon-icon') {
    return `<img class="${className}" src="${BYON_ICON_DATA_URL}" alt="">`;
  }

  function iconSvg(name, className = 'ui-icon') {
    const paths = {
      search: '<path d="M8.75 3.25a5.5 5.5 0 1 0 3.45 9.78l3.63 3.63a.75.75 0 0 0 1.06-1.06l-3.63-3.63A5.5 5.5 0 0 0 8.75 3.25m-4 5.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0"/>',
      plus: '<path d="M10 3.25a.75.75 0 0 1 .75.75v5.25H16a.75.75 0 0 1 0 1.5h-5.25V16a.75.75 0 0 1-1.5 0v-5.25H4a.75.75 0 0 1 0-1.5h5.25V4a.75.75 0 0 1 .75-.75"/>',
      more: '<path d="M4.25 8.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5m5.75 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5m5.75 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5"/>',
      collapse: '<path d="M7.8 4.15a.625.625 0 0 1 .05.88L3.33 10l4.52 4.97a.625.625 0 1 1-.92.84l-4.9-5.39a.625.625 0 0 1 0-.84l4.9-5.38a.625.625 0 0 1 .88-.05m5 0a.625.625 0 0 1 .05.88L8.33 10l4.52 4.97a.625.625 0 1 1-.92.84l-4.9-5.39a.625.625 0 0 1 0-.84l4.9-5.38a.625.625 0 0 1 .88-.05"/>',
      chevronDown: '<path d="M4.2 7.3a.7.7 0 0 1 .99-.1L10 11.22l4.81-4.02a.7.7 0 1 1 .9 1.08l-5.26 4.39a.7.7 0 0 1-.9 0L4.29 8.28a.7.7 0 0 1-.09-.98"/>',
      tune: '<path d="M4 4.25h5.25a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1 0-1.5m9.75 0H16a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1 0-1.5M4 9.25h2.25a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1 0-1.5m6.75 0H16a.75.75 0 0 1 0 1.5h-5.25a.75.75 0 0 1 0-1.5M4 14.25h5.25a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1 0-1.5m9.75 0H16a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1 0-1.5"/><circle cx="11.5" cy="5" r="1.5"/><circle cx="8.5" cy="10" r="1.5"/><circle cx="11.5" cy="15" r="1.5"/>',
      upload: '<path d="M10 2.75a.75.75 0 0 1 .53.22l3 3a.75.75 0 1 1-1.06 1.06l-1.72-1.72v6.94a.75.75 0 0 1-1.5 0V5.31L7.53 7.03a.75.75 0 0 1-1.06-1.06l3-3a.75.75 0 0 1 .53-.22M4 12.5a.75.75 0 0 1 .75.75V16h10.5v-2.75a.75.75 0 0 1 1.5 0V16A1.5 1.5 0 0 1 15.25 17.5H4.75A1.5 1.5 0 0 1 3.25 16v-2.75A.75.75 0 0 1 4 12.5"/>',
      settings: '<path d="M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6m-1.5 3a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0"/><path d="M16.7 8.35l-1.13-.2a6 6 0 0 0-.54-1.3l.66-.94a.75.75 0 0 0-.08-.96l-.56-.56a.75.75 0 0 0-.96-.08l-.94.66a6 6 0 0 0-1.3-.54l-.2-1.13a.75.75 0 0 0-.74-.62h-.82a.75.75 0 0 0-.74.62l-.2 1.13a6 6 0 0 0-1.3.54l-.94-.66a.75.75 0 0 0-.96.08l-.56.56a.75.75 0 0 0-.08.96l.66.94a6 6 0 0 0-.54 1.3l-1.13.2a.75.75 0 0 0-.62.74v.82c0 .36.26.67.62.74l1.13.2c.13.46.31.9.54 1.3l-.66.94a.75.75 0 0 0 .08.96l.56.56c.26.26.66.29.96.08l.94-.66c.4.23.84.41 1.3.54l.2 1.13c.07.36.38.62.74.62h.82c.36 0 .67-.26.74-.62l.2-1.13c.46-.13.9-.31 1.3-.54l.94.66c.3.21.7.18.96-.08l.56-.56a.75.75 0 0 0 .08-.96l-.66-.94c.23-.4.41-.84.54-1.3l1.13-.2c.36-.07.62-.38.62-.74v-.82a.75.75 0 0 0-.62-.74" fill-rule="evenodd"/>',
      send: '<path d="M10 3.25a.75.75 0 0 1 .53.22l4.75 4.75a.75.75 0 1 1-1.06 1.06l-3.47-3.47V16a.75.75 0 0 1-1.5 0V5.81L5.78 9.28a.75.75 0 0 1-1.06-1.06l4.75-4.75A.75.75 0 0 1 10 3.25"/>',
      stop: '<rect x="6" y="6" width="8" height="8" rx="1.5"/>',
      trash: '<path d="M7.25 3.5A1.5 1.5 0 0 1 8.75 2h2.5a1.5 1.5 0 0 1 1.5 1.5v.75H16a.75.75 0 0 1 0 1.5h-.75v10A2.25 2.25 0 0 1 13 18H7a2.25 2.25 0 0 1-2.25-2.25v-10H4a.75.75 0 0 1 0-1.5h3.25zm1.5.75h2.5V3.5h-2.5zm-2.5 1.5v10c0 .41.34.75.75.75h6c.41 0 .75-.34.75-.75v-10zM8.5 8a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 8.5 8m3 0a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 11.5 8"/>',
      arrowLeft: '<path d="M8.53 3.47a.75.75 0 0 1 0 1.06L3.81 9.25H16a.75.75 0 0 1 0 1.5H3.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0"/>',
      chevronRight: '<path d="M7.3 4.2a.7.7 0 0 1 .98.09l4.39 5.26a.7.7 0 0 1 0 .9l-4.39 5.26a.7.7 0 1 1-1.08-.9L11.22 10 7.2 5.19a.7.7 0 0 1 .1-.99"/>',
      file: '<path d="M6 2.25h5.38c.4 0 .78.16 1.06.44l3.87 3.87c.28.28.44.66.44 1.06V16A1.75 1.75 0 0 1 15 17.75H6A1.75 1.75 0 0 1 4.25 16V4A1.75 1.75 0 0 1 6 2.25m0 1.5a.25.25 0 0 0-.25.25v12c0 .14.11.25.25.25h9a.25.25 0 0 0 .25-.25V8h-3.5A.75.75 0 0 1 11 7.25v-3.5zm6.5 1.06V6.5h1.69z"/>'
    };
    return `<svg class="${className}" viewBox="0 0 20 20" aria-hidden="true" focusable="false">${paths[name] || ''}</svg>`;
  }

  function attachmentChips() {
    return draftAttachments.map((attachment, index) => `<span class="attachment-chip" title="${escapeHtml(attachment.name)} · ${attachment.size} bytes">${iconSvg('file')}<span>${escapeHtml(attachment.name)}</span><button data-remove-attachment="${index}" aria-label="Remove ${escapeHtml(attachment.name)}">×</button></span>`).join('');
  }

  function messageHtml(message, index) {
    const actions = message.pending ? '' : `<div class="message-actions">
      <button data-copy-message="${index}" title="Copy">Copy</button>
      ${message.role === 'assistant' ? `<button data-retry-message="${index}">Retry</button>` : `<button data-edit-message="${index}">Edit</button>`}
    </div>`;
    return `<article class="message ${message.role}" data-message-index="${index}">
      ${message.role === 'assistant' ? `<div class="message-role">${byonIcon('message-icon')}</div>` : ''}
      <div class="message-content">${message.error ? `<div class="error">${escapeHtml(message.error)}</div>` : renderMarkdown(message.content || (message.pending ? 'Thinking…' : ''))}</div>
      ${actions}
    </article>`;
  }

  function settingsHtml(profile) {
    const headersText = typeof profile.mcpHeaders === 'string' ? profile.mcpHeaders : JSON.stringify(profile.mcpHeaders || {}, null, 2);
    return `<div class="settings-view">
      <div class="settings-title"><button class="icon-button" data-action="close-settings" aria-label="Back to chat">${iconSvg('arrowLeft')}</button><h2>BYON settings</h2></div>
      <p class="notice">API keys are masked here but stored unencrypted in your userscript manager. Requests are sent without Notion cookies.</p>
      <label>Profile<select data-field="active-profile">${profileOptions()}</select></label>
      <div class="row"><button data-action="new-profile">New profile</button><button data-action="delete-profile" class="danger" ${state.profiles.length === 1 ? 'disabled' : ''}>Delete profile</button></div>
      <label>Name<input data-field="profile-name" value="${escapeHtml(profile.name)}"></label>
      <label>Base URL<input data-field="base-url" value="${escapeHtml(profile.baseUrl)}" placeholder="https://api.example.com/v1"></label>
      <div class="grid-two">
        <label>API type<select data-field="api-type"><option value="chat_completions" ${profile.apiType === 'chat_completions' ? 'selected' : ''}>Chat Completions</option><option value="responses" ${profile.apiType === 'responses' ? 'selected' : ''}>Responses</option></select></label>
        <label>Model<input data-field="model" value="${escapeHtml(profile.model)}" list="byon-models" placeholder="model-id"><datalist id="byon-models"></datalist></label>
      </div>
      <button data-action="discover-models">Discover models</button>
      <label>Authentication<select data-field="auth-mode"><option value="bearer" ${profile.authMode === 'bearer' ? 'selected' : ''}>Authorization: Bearer</option><option value="custom" ${profile.authMode === 'custom' ? 'selected' : ''}>Custom header</option><option value="none" ${profile.authMode === 'none' ? 'selected' : ''}>No authentication</option></select></label>
      ${profile.authMode === 'custom' ? `<div class="grid-two"><label>Header name<input data-field="header-name" value="${escapeHtml(profile.headerName)}"></label><label>Value prefix<input data-field="header-prefix" value="${escapeHtml(profile.headerPrefix)}" placeholder="Optional"></label></div>` : ''}
      ${profile.authMode !== 'none' ? `<label>API key<input data-field="api-key" type="password" value="${escapeHtml(profile.apiKey)}" autocomplete="off"></label>` : ''}
      <label>System prompt<textarea data-field="system-prompt" rows="4">${escapeHtml(profile.systemPrompt)}</textarea></label>
      <fieldset><legend>Notion MCP</legend>
        <label>Mode<select data-field="mcp-mode"><option value="off" ${profile.mcpMode === 'off' ? 'selected' : ''}>Off</option><option value="backend_preconfigured" ${profile.mcpMode === 'backend_preconfigured' ? 'selected' : ''}>Already configured in backend</option><option value="responses_remote" ${profile.mcpMode === 'responses_remote' ? 'selected' : ''}>Responses remote MCP</option></select></label>
        ${profile.mcpMode === 'backend_preconfigured' ? '<p class="notice">Your backend owns the MCP tool loop. BYON injects guidance but cannot enforce tool approvals in this mode.</p>' : ''}
        ${profile.mcpMode === 'responses_remote' ? `<p class="notice">Requires the Responses API. Every MCP call requests approval. Responses are stored by the provider so approval continuations can reference them. BYON does not implement Notion OAuth; provide a token or an authenticated gateway.</p><label>MCP URL<input data-field="mcp-url" value="${escapeHtml(profile.mcpUrl)}"></label><label>Server label<input data-field="mcp-label" value="${escapeHtml(profile.mcpServerLabel)}"></label><label>OAuth access token<input data-field="mcp-authorization" type="password" value="${escapeHtml(profile.mcpAuthorization)}" autocomplete="off"></label><label>Additional headers (JSON)<textarea data-field="mcp-headers" rows="3">${escapeHtml(headersText)}</textarea></label>` : ''}
      </fieldset>
      <label class="checkbox"><input data-field="replacement-enabled" type="checkbox" ${state.settings.replacementEnabled ? 'checked' : ''}> Replace Notion’s Ask AI button with Ask BYON</label>
      <div class="row"><button class="primary" data-action="save-settings">Save settings</button><button data-action="test-connection">Test connection</button></div>
      <div id="settings-status" class="status" role="status"></div>
    </div>`;
  }

  function render() {
    ensureHost();
    if (panel.hidden) return;
    const profile = activeProfile();
    const chat = activeChat();
    panel.style.width = `${state.settings.panelWidth}px`;
    if (settingsOpen) {
      panel.innerHTML = `<div class="resize-handle" aria-hidden="true"></div>${settingsHtml(profile)}`;
      bindPanelEvents();
      return;
    }
    panel.innerHTML = `<div class="resize-handle" aria-hidden="true"></div>
      <header class="panel-header">
        <button class="chat-title-button" data-action="toggle-history" aria-expanded="${historyOpen}" aria-haspopup="dialog">${byonIcon('header-icon')}<span>${escapeHtml(chat?.title || 'New chat')}</span>${iconSvg('chevronDown', 'chevron-icon')}</button>
        <div class="header-actions">
          <button class="icon-button" data-action="new-chat" aria-label="New chat" title="New chat">${iconSvg('plus')}</button>
          <button class="icon-button" data-action="open-settings" aria-label="BYON settings" title="BYON settings">${iconSvg('more')}</button>
          <button class="icon-button" data-action="close-panel" aria-label="Close BYON" title="Close panel">${iconSvg('collapse')}</button>
        </div>
      </header>
      ${historyOpen ? `<div class="notion-popover chat-popover" role="dialog" aria-label="Select a chat"><label class="popover-search" for="chat-search">${iconSvg('search')}<input id="chat-search" value="${escapeHtml(chatSearch)}" placeholder="Search chats" autocomplete="off"></label><div class="menu-section-label">Today</div><div class="popover-scroll">${chatRows()}</div><div class="popover-footer"><button data-action="new-chat">${iconSvg('plus')}<span>New chat</span></button><button data-action="clear-history" class="danger-link">Clear history</button></div></div>` : ''}
      <main id="message-list" class="messages">${chat?.messages.length ? chat.messages.map(messageHtml).join('') : `<div class="landing">${byonIcon('landing-icon')}<h1>How can I help you today?</h1><p>Chatting with <strong>${escapeHtml(profile.model || profile.name)}</strong></p></div>`}</main>
      <footer class="composer-area">
        <div class="composer-wrap">
          ${(draftAttachments.length || includeVisiblePage || lastNotionSelection) ? `<div class="attachment-row">${attachmentChips()}${includeVisiblePage ? `<span class="attachment-chip context-attachment">${iconSvg('file')}<span>Visible page</span><button data-action="toggle-page-context" aria-label="Remove visible page context">×</button></span>` : ''}${lastNotionSelection ? `<span class="attachment-chip context-attachment">${iconSvg('file')}<span>Selection</span></span>` : ''}</div>` : ''}
          <textarea id="byon-composer" rows="1" placeholder="Do anything with AI…" aria-label="Message BYON"></textarea>
          <div class="composer-toolbar">
            <div class="toolbar-left">
              <button class="round-tool" data-action="toggle-plus" aria-label="Add files or page context" aria-expanded="${plusOpen}">${iconSvg('plus')}</button>
              <button class="round-tool" data-action="toggle-mode" aria-label="Choose chat mode" aria-expanded="${modeOpen}">${iconSvg('tune')}</button>
            </div>
            <div class="toolbar-right">
              <button class="model-button" data-action="toggle-models" aria-haspopup="listbox" aria-expanded="${modelOpen}"><span class="model-name">${escapeHtml(profile.model || 'Select model')}</span>${iconSvg('chevronDown', 'chevron-icon')}</button>
              ${currentRequest ? `<button class="send stop" data-action="stop-request" aria-label="Stop response">${iconSvg('stop')}</button>` : `<button class="send" data-action="send-message" aria-label="Send message">${iconSvg('send')}</button>`}
            </div>
          </div>
        </div>
        <input id="file-picker" type="file" hidden multiple accept="text/*,.txt,.md,.markdown,.csv,.tsv,.json,.jsonl,.html,.htm,.xml,.yaml,.yml,.toml,.ini,.log,.sql,.css,.js,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.java,.c,.h,.cpp,.hpp,.sh,.ps1,.bat,.tex,.rst,.rtf">
        ${plusOpen ? `<div class="notion-popover plus-popover" role="menu"><button class="menu-row-button" data-action="pick-files"><span class="menu-icon">${iconSvg('upload')}</span><span><strong>Add text files</strong><small>HTML, Markdown, CSV, code, logs, and more</small></span></button><button class="menu-row-button ${includeVisiblePage ? 'selected' : ''}" data-action="toggle-page-context"><span class="menu-icon mention-icon">@</span><span><strong>${includeVisiblePage ? 'Remove visible page' : 'Mention current page'}</strong><small>Attach currently rendered Notion blocks</small></span>${includeVisiblePage ? '<span class="check">✓</span>' : ''}</button></div>` : ''}
        ${modelOpen ? `<div class="notion-popover model-popover" role="listbox"><label class="popover-search" for="model-search">${iconSvg('search')}<input id="model-search" value="${escapeHtml(modelSearch)}" placeholder="Search models" autocomplete="off"></label><div class="popover-scroll">${groupedModelRows(profile)}</div><div class="popover-footer"><button data-action="open-settings">${iconSvg('settings')}<span>Manage providers and models</span></button></div></div>` : ''}
        ${modeOpen ? `<div class="notion-popover mode-popover" role="menu"><div class="menu-section-label">API mode</div><button class="mode-row ${profile.apiType === 'chat_completions' ? 'selected' : ''}" data-api-mode="chat_completions"><span class="menu-icon mode-glyph">C</span><span><strong>Chat Completions</strong><small>Broad OpenAI-compatible support</small></span>${profile.apiType === 'chat_completions' ? '<span class="check">✓</span>' : ''}</button><button class="mode-row ${profile.apiType === 'responses' ? 'selected' : ''}" data-api-mode="responses"><span class="menu-icon mode-glyph">R</span><span><strong>Responses</strong><small>Required for remote MCP tools</small></span>${profile.apiType === 'responses' ? '<span class="check">✓</span>' : ''}</button><div class="popover-divider"></div><button class="mode-row" data-action="open-settings"><span class="menu-icon">${iconSvg('settings')}</span><span><strong>BYON settings</strong><small>Provider, authentication, and Notion MCP</small></span>${iconSvg('chevronRight', 'chevron-icon')}</button></div>` : ''}
        <div class="disclaimer">AI can make mistakes. Review Notion tool calls before approval.</div>
      </footer>`;
    bindPanelEvents();
    const list = shadow.getElementById('message-list');
    if (list) list.scrollTop = list.scrollHeight;
  }

  function bindPanelEvents() {
    panel.onclick = async (event) => {
      const button = event.target.closest('button');
      if (!button) {
        if (event.target.closest('.messages')) { historyOpen = plusOpen = modelOpen = modeOpen = false; render(); }
        return;
      }
      const action = button.dataset.action;
      if (action === 'close-panel') closePanel();
      if (action === 'open-settings') { settingsOpen = true; historyOpen = plusOpen = modelOpen = modeOpen = false; render(); }
      if (action === 'close-settings') { settingsOpen = false; render(); }
      if (action === 'toggle-history') { historyOpen = !historyOpen; plusOpen = modelOpen = modeOpen = false; render(); }
      if (action === 'toggle-plus') { plusOpen = !plusOpen; historyOpen = modelOpen = modeOpen = false; render(); }
      if (action === 'toggle-models') { modelOpen = !modelOpen; historyOpen = plusOpen = modeOpen = false; render(); }
      if (action === 'toggle-mode') { modeOpen = !modeOpen; historyOpen = plusOpen = modelOpen = false; render(); }
      if (action === 'new-chat') { makeChat(); historyOpen = plusOpen = modelOpen = modeOpen = false; render(); }
      if (action === 'toggle-page-context') { includeVisiblePage = !includeVisiblePage; plusOpen = false; render(); }
      if (action === 'pick-files') shadow.getElementById('file-picker')?.click();
      if (action === 'send-message') sendComposerMessage();
      if (action === 'stop-request') stopRequest();
      if (action === 'clear-history') clearHistory();
      if (action === 'new-profile') addProfile();
      if (action === 'delete-profile') deleteProfile();
      if (action === 'save-settings') saveSettingsForm();
      if (action === 'test-connection') testConnection();
      if (action === 'discover-models') discoverModels();
      if (button.dataset.chatId) { state.activeChatId = button.dataset.chatId; historyOpen = false; persist(); render(); }
      if (button.dataset.model) { activeProfile().model = button.dataset.model; modelOpen = false; persist(); render(); announce(`Model changed to ${button.dataset.model}`); }
      if (button.dataset.apiMode) { activeProfile().apiType = button.dataset.apiMode; modeOpen = false; persist(); render(); }
      if (button.dataset.removeAttachment != null) { draftAttachments.splice(Number(button.dataset.removeAttachment), 1); render(); }
      if (button.dataset.renameChat) renameChat(button.dataset.renameChat);
      if (button.dataset.deleteChat) deleteChat(button.dataset.deleteChat);
      if (button.dataset.copyMessage != null) copyMessage(Number(button.dataset.copyMessage));
      if (button.dataset.retryMessage != null) retryMessage(Number(button.dataset.retryMessage));
      if (button.dataset.editMessage != null) editMessage(Number(button.dataset.editMessage));
    };
    panel.onchange = (event) => {
      if (event.target.dataset.field === 'active-profile') {
        state.settings.activeProfileId = event.target.value;
        persist(); render();
      }
      if (event.target.dataset.field === 'auth-mode') { activeProfile().authMode = event.target.value; collectSettingsForm(); render(); }
      if (event.target.dataset.field === 'mcp-mode') { activeProfile().mcpMode = event.target.value; collectSettingsForm(); render(); }
      if (event.target.id === 'quick-model') { activeProfile().model = event.target.value; persist(); announce(`Model changed to ${event.target.value}`); }
      if (event.target.id === 'file-picker') readSelectedFiles(event.target.files);
    };
    panel.oninput = (event) => {
      if (event.target.id === 'chat-search') {
        chatSearch = event.target.value;
        const position = chatSearch.length;
        render();
        const input = shadow.getElementById('chat-search');
        input?.focus(); input?.setSelectionRange(position, position);
      }
      if (event.target.id === 'model-search') {
        modelSearch = event.target.value;
        const position = modelSearch.length;
        render();
        const input = shadow.getElementById('model-search');
        input?.focus(); input?.setSelectionRange(position, position);
      }
    };
    panel.onkeydown = (event) => {
      if (event.target.id === 'byon-composer' && event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); sendComposerMessage();
      }
      if (event.key === 'Escape') {
        if (historyOpen || plusOpen || modelOpen || modeOpen) { historyOpen = plusOpen = modelOpen = modeOpen = false; render(); }
        else closePanel();
      }
    };
    const handle = panel.querySelector('.resize-handle');
    if (handle) handle.onpointerdown = startResize;
  }

  async function readSelectedFiles(fileList) {
    const files = Array.from(fileList || []);
    let totalCharacters = draftAttachments.reduce((sum, attachment) => sum + attachment.content.length, 0);
    for (const file of files) {
      if (!isSupportedTextFile(file)) { announce(`${file.name} is not a supported text file`); continue; }
      if (file.size > MAX_TEXT_FILE_BYTES) { announce(`${file.name} is larger than 5 MB`); continue; }
      if (totalCharacters >= MAX_TOTAL_ATTACHMENT_CHARS) { announce('Attachment text limit reached'); break; }
      try {
        let content = await file.text();
        const remaining = MAX_TOTAL_ATTACHMENT_CHARS - totalCharacters;
        const truncated = content.length > remaining;
        content = content.slice(0, remaining);
        draftAttachments.push({ name: file.name, type: file.type || 'text/plain', size: file.size, content, truncated });
        totalCharacters += content.length;
      } catch (_) { announce(`Could not read ${file.name}`); }
    }
    plusOpen = false;
    render();
  }

  function collectSettingsForm() {
    const profile = activeProfile();
    const value = (name) => panel.querySelector(`[data-field="${name}"]`)?.value;
    if (value('profile-name') != null) profile.name = value('profile-name').trim() || 'Unnamed profile';
    if (value('base-url') != null) profile.baseUrl = value('base-url').trim();
    if (value('api-type') != null) profile.apiType = value('api-type');
    if (value('model') != null) profile.model = value('model').trim();
    if (value('auth-mode') != null) profile.authMode = value('auth-mode');
    if (value('api-key') != null) profile.apiKey = value('api-key');
    if (value('header-name') != null) profile.headerName = value('header-name').trim();
    if (value('header-prefix') != null) profile.headerPrefix = value('header-prefix');
    if (value('system-prompt') != null) profile.systemPrompt = value('system-prompt');
    if (value('mcp-mode') != null) profile.mcpMode = value('mcp-mode');
    if (value('mcp-url') != null) profile.mcpUrl = value('mcp-url').trim();
    if (value('mcp-label') != null) profile.mcpServerLabel = value('mcp-label').trim();
    if (value('mcp-authorization') != null) profile.mcpAuthorization = value('mcp-authorization');
    if (value('mcp-headers') != null) profile.mcpHeaders = value('mcp-headers');
    const replacement = panel.querySelector('[data-field="replacement-enabled"]');
    if (replacement) state.settings.replacementEnabled = replacement.checked;
  }

  async function saveSettingsForm() {
    const status = panel.querySelector('#settings-status');
    try {
      collectSettingsForm();
      const profile = activeProfile();
      endpointFor(profile, 'chat');
      authHeaders(profile);
      if (!profile.model) throw new Error('Enter a model ID.');
      if (profile.mcpMode === 'responses_remote' && profile.apiType !== 'responses') throw new Error('Remote MCP requires the Responses API type.');
      profile.mcpHeaders = parseHeaderObject(profile.mcpHeaders);
      await persist();
      applyTriggerReplacement();
      status.textContent = 'Settings saved.';
      announce('BYON settings saved');
    } catch (error) { status.textContent = redactSecret(error.message, secretsForProfile(activeProfile())); }
  }

  function addProfile() {
    collectSettingsForm();
    const profile = defaultProfile();
    profile.name = `Profile ${state.profiles.length + 1}`;
    state.profiles.push(profile);
    state.settings.activeProfileId = profile.id;
    persist(); render();
  }

  function deleteProfile() {
    if (state.profiles.length === 1) return;
    state.profiles = state.profiles.filter((profile) => profile.id !== state.settings.activeProfileId);
    state.settings.activeProfileId = state.profiles[0].id;
    persist(); render();
  }

  function startResize(event) {
    event.preventDefault();
    const startingX = event.clientX;
    const startingWidth = panel.getBoundingClientRect().width;
    handleResizeMove.pointerId = event.pointerId;
    handleResizeMove.startingX = startingX;
    handleResizeMove.startingWidth = startingWidth;
    global.addEventListener('pointermove', handleResizeMove);
    global.addEventListener('pointerup', finishResize, { once: true });
  }

  function handleResizeMove(event) {
    const width = clamp(handleResizeMove.startingWidth + handleResizeMove.startingX - event.clientX, PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, global.innerWidth));
    state.settings.panelWidth = width;
    panel.style.width = `${width}px`;
  }

  function finishResize() {
    global.removeEventListener('pointermove', handleResizeMove);
    persist();
  }

  function sendComposerMessage() {
    const composer = shadow.getElementById('byon-composer');
    const content = composer?.value.trim() || (draftAttachments.length ? 'Use the attached text file(s) to help with this request.' : '');
    if (!content || currentRequest) return;
    const profile = activeProfile();
    if (!profile.model || !profile.baseUrl) {
      openPanel(true);
      announce('Configure a provider and model first');
      return;
    }
    const attachments = draftAttachments.map((attachment) => ({ ...attachment }));
    draftAttachments = [];
    sendMessage(content, undefined, attachments);
  }

  async function sendMessage(content, truncateAfter, attachments = []) {
    const profile = activeProfile();
    if (!profile.model || !profile.baseUrl) { openPanel(true); announce('Configure a provider and model first'); return; }
    let chat = activeChat() || makeChat();
    if (Number.isInteger(truncateAfter)) chat.messages = chat.messages.slice(0, truncateAfter);
    const userMessage = { id: uid('msg'), role: 'user', content, attachments, createdAt: nowIso() };
    chat.messages.push(userMessage);
    if (chat.messages.filter((message) => message.role === 'user').length === 1) chat.title = content.replace(/\s+/g, ' ').slice(0, 60) || 'New chat';
    const assistant = { id: uid('msg'), role: 'assistant', content: '', pending: true, createdAt: nowIso() };
    chat.messages.push(assistant);
    chat.updatedAt = nowIso();
    await persist();
    render();
    performCompletion(chat, assistant, pageContext());
  }

  function performCompletion(chat, assistant, context, continuation) {
    const profile = activeProfile();
    const messages = chat.messages.filter((message) => message.id !== assistant.id).map(({ role, content, attachments }) => ({ role, content, attachments }));
    let body;
    try {
      body = profile.apiType === 'responses'
        ? buildResponsesBody(profile, messages, context, continuation)
        : buildChatCompletionsBody(profile, messages, context);
    } catch (error) { finishWithError(assistant, error); return; }
    let offset = 0;
    let accumulated = '';
    let lastText = '';
    let responseId = continuation?.responseId || null;
    let pendingApproval = null;
    let sawSse = false;
    const processText = (responseText) => {
      if (!responseText || responseText === lastText) return;
      lastText = responseText;
      const parsed = parseSseText(responseText, offset);
      offset = parsed.offset;
      for (const event of parsed.events) {
        sawSse = true;
        responseId = responseId || event.response?.id || event.response_id || null;
        const delta = profile.apiType === 'responses' ? responseDeltaFromEvent(event) : chatDeltaFromEvent(event);
        if (delta) { accumulated += delta; assistant.content = accumulated; throttledRender(); }
        const payloadApprovals = approvalsFromResponsePayload(event);
        if (payloadApprovals.length) pendingApproval = payloadApprovals[0];
        if (event.item?.type === 'mcp_approval_request') pendingApproval = event.item;
      }
    };
    try {
      const request = gm.request({
        method: 'POST',
        url: endpointFor(profile, 'chat'),
        headers: authHeaders(profile),
        data: JSON.stringify(body),
        anonymous: true,
        timeout: 120000,
        onprogress: (response) => processText(response.responseText),
        onload: async (response) => {
          currentRequest = null;
          processText(response.responseText);
          if (response.status < 200 || response.status >= 300) {
            finishWithError(assistant, new Error(`HTTP ${response.status}: ${response.responseText || response.statusText}`));
            return;
          }
          if (!sawSse) {
            try {
              accumulated = extractBufferedText(profile, response.responseText);
              const payload = JSON.parse(response.responseText);
              responseId = responseId || payload.id;
              pendingApproval = pendingApproval || approvalsFromResponsePayload(payload)[0];
            } catch (error) { finishWithError(assistant, new Error(`Could not parse provider response: ${error.message}`)); return; }
          }
          assistant.content = accumulated;
          assistant.pending = false;
          chat.updatedAt = nowIso();
          await persist(); render();
          if (pendingApproval) requestApproval(chat, assistant, context, responseId, pendingApproval);
        },
        onerror: () => { currentRequest = null; finishWithError(assistant, new Error('Network request failed. Check the endpoint, manager host permission, and connection.')); },
        ontimeout: () => { currentRequest = null; finishWithError(assistant, new Error('The provider request timed out after 120 seconds.')); },
        onabort: () => { currentRequest = null; assistant.pending = false; if (!assistant.content) assistant.content = '[Stopped]'; persist(); render(); }
      });
      currentRequest = request;
      render();
    } catch (error) { finishWithError(assistant, error); }
  }

  let renderTimer = null;
  function throttledRender() {
    if (renderTimer) return;
    renderTimer = setTimeout(() => { renderTimer = null; render(); }, 50);
  }

  function finishWithError(assistant, error) {
    currentRequest = null;
    assistant.pending = false;
    assistant.error = redactSecret(error.message || error, secretsForProfile(activeProfile()));
    persist(); render();
  }

  function stopRequest() {
    if (currentRequest && typeof currentRequest.abort === 'function') currentRequest.abort();
  }

  function requestApproval(chat, assistant, context, responseId, approval) {
    if (!responseId) { finishWithError(assistant, new Error('The endpoint requested MCP approval without returning a response ID.')); return; }
    const argumentsText = (() => { try { return JSON.stringify(JSON.parse(approval.arguments || '{}'), null, 2); } catch (_) { return approval.arguments || '{}'; } })();
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="approval-title"><h2 id="approval-title">Approve Notion tool call?</h2><p><strong>${escapeHtml(approval.server_label || 'notion')} · ${escapeHtml(approval.name || 'unknown tool')}</strong></p><pre>${escapeHtml(argumentsText)}</pre><p class="notice">BYON requires approval for every remote MCP call.</p><div class="row end"><button data-decision="deny">Deny</button><button class="primary" data-decision="approve">Approve once</button></div></div>`;
    shadow.appendChild(modal);
    modal.querySelector('[data-decision="approve"]').focus();
    modal.onclick = (event) => {
      const decision = event.target.closest('[data-decision]')?.dataset.decision;
      if (!decision) return;
      modal.remove();
      assistant.pending = true;
      performCompletion(chat, assistant, context, {
        responseId,
        approvalRequestId: approval.id || approval.approval_request_id,
        approve: decision === 'approve',
        reason: decision === 'approve' ? 'Approved once by the user in BYON.' : 'Denied by the user in BYON.'
      });
    };
  }

  function copyMessage(index) {
    const message = activeChat()?.messages[index];
    if (message) { gm.clipboard(message.content); announce('Message copied'); }
  }

  function retryMessage(index) {
    const chat = activeChat();
    if (!chat || currentRequest) return;
    let userIndex = index - 1;
    while (userIndex >= 0 && chat.messages[userIndex].role !== 'user') userIndex -= 1;
    if (userIndex < 0) return;
    const content = chat.messages[userIndex].content;
    const attachments = chat.messages[userIndex].attachments || [];
    chat.messages = chat.messages.slice(0, userIndex);
    sendMessage(content, undefined, attachments);
  }

  function editMessage(index) {
    const chat = activeChat();
    const message = chat?.messages[index];
    if (!message || message.role !== 'user' || currentRequest) return;
    const composer = shadow.getElementById('byon-composer');
    composer.value = message.content;
    draftAttachments = (message.attachments || []).map((attachment) => ({ ...attachment }));
    chat.messages = chat.messages.slice(0, index);
    persist(); render();
    const nextComposer = shadow.getElementById('byon-composer');
    nextComposer.value = message.content;
    nextComposer.focus();
  }

  function clearHistory() {
    if (!global.confirm('Delete all locally stored BYON chats?')) return;
    state.chats = [];
    state.activeChatId = null;
    historyOpen = false;
    persist(); render();
  }

  function renameChat(chatId) {
    const chat = state.chats.find((item) => item.id === chatId);
    if (!chat) return;
    const title = global.prompt('Rename chat', chat.title);
    if (title == null || !title.trim()) return;
    chat.title = title.trim().slice(0, 120);
    chat.updatedAt = nowIso();
    persist(); render();
  }

  function deleteChat(chatId) {
    const chat = state.chats.find((item) => item.id === chatId);
    if (!chat || !global.confirm(`Delete “${chat.title}”?`)) return;
    state.chats = state.chats.filter((item) => item.id !== chatId);
    if (state.activeChatId === chatId) state.activeChatId = state.chats[0]?.id || null;
    persist(); render();
  }

  function connectionRequest(profile, operation) {
    return new Promise((resolve, reject) => {
      let request;
      try {
        request = gm.request({
          method: 'GET', url: endpointFor(profile, operation), headers: authHeaders(profile), anonymous: true, timeout: 30000,
          onload: (response) => response.status >= 200 && response.status < 300 ? resolve(response) : reject(new Error(`HTTP ${response.status}: ${response.responseText || response.statusText}`)),
          onerror: () => reject(new Error('Network request failed.')), ontimeout: () => reject(new Error('Connection timed out.'))
        });
      } catch (error) { reject(error); }
      return request;
    });
  }

  async function discoverModels() {
    const status = panel.querySelector('#settings-status');
    try {
      collectSettingsForm();
      status.textContent = 'Discovering models…';
      const response = await connectionRequest(activeProfile(), 'models');
      const payload = JSON.parse(response.responseText);
      const models = Array.isArray(payload.data) ? payload.data.map((model) => model.id).filter(Boolean).sort() : [];
      if (!models.length) throw new Error('The endpoint returned no model IDs. You can still enter one manually.');
      activeProfile().discoveredModels = models;
      await persist();
      const datalist = panel.querySelector('#byon-models');
      datalist.innerHTML = models.map((model) => `<option value="${escapeHtml(model)}"></option>`).join('');
      status.textContent = `Found ${models.length} models. Choose one from the Model field.`;
    } catch (error) { status.textContent = redactSecret(error.message, secretsForProfile(activeProfile())); }
  }

  async function testConnection() {
    const status = panel.querySelector('#settings-status');
    try {
      collectSettingsForm();
      status.textContent = 'Testing connection…';
      await connectionRequest(activeProfile(), 'models');
      status.textContent = 'Connection succeeded.';
    } catch (error) { status.textContent = redactSecret(error.message, secretsForProfile(activeProfile())); }
  }

  function closestClickable(element) {
    return element.closest('button,[role="button"],a,[tabindex="0"],[style*="cursor:pointer"],[style*="cursor: pointer"]');
  }

  function notionAiCandidates() {
    const result = new Set();
    for (const element of document.querySelectorAll('button,[role="button"],a,[tabindex="0"]')) {
      if (element.closest('#byon-root')) continue;
      const label = `${element.getAttribute('aria-label') || ''} ${element.textContent || ''}`.replace(/\s+/g, ' ').trim();
      const hasFace = Boolean(element.querySelector('img[alt*="Notion AI" i],img[alt*="AI face" i]'));
      if (isNotionAiTriggerLabel(label, hasFace)) result.add(element);
    }
    for (const image of document.querySelectorAll('img[alt*="Notion AI" i],img[alt*="AI face" i]')) {
      const clickable = closestClickable(image);
      if (!clickable) continue;
      const rect = clickable.getBoundingClientRect();
      const isBottomRight = rect.width > 0 && rect.height > 0 && rect.right >= global.innerWidth - 160 && rect.bottom >= global.innerHeight - 160;
      if (/ask ai/i.test(clickable.textContent || '') || isBottomRight) result.add(clickable);
    }
    for (const labelNode of document.querySelectorAll('div,span')) {
      if (labelNode.children.length || !/^Ask AI$/i.test(labelNode.textContent.trim())) continue;
      const clickable = closestClickable(labelNode);
      if (clickable) result.add(clickable);
    }
    const candidates = Array.from(result);
    const bottomRight = candidates.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.right >= global.innerWidth - 160 && rect.bottom >= global.innerHeight - 160;
    });
    if (bottomRight.length) {
      return [bottomRight.reduce((smallest, candidate) => {
        const smallestRect = smallest.getBoundingClientRect();
        const candidateRect = candidate.getBoundingClientRect();
        return candidateRect.width * candidateRect.height < smallestRect.width * smallestRect.height ? candidate : smallest;
      })];
    }
    const pool = candidates;
    // Notion nests several clickable wrappers around some AI affordances. Keep
    // only the deepest semantic target so a rerender never accumulates BYON marks.
    return pool.filter((candidate) => !pool.some((other) => other !== candidate && candidate.contains(other)));
  }

  function restoreTrigger(element) {
    const saved = restoredTriggers.get(element);
    if (!saved) return;
    element.removeEventListener('click', hijackClick, true);
    element.removeAttribute('data-byon-trigger');
    if (saved.ariaLabel == null) element.removeAttribute('aria-label');
    else element.setAttribute('aria-label', saved.ariaLabel);
    if (saved.labelNode && saved.labelNode.isConnected) saved.labelNode.textContent = saved.labelText;
    if (saved.image && saved.image.isConnected) saved.image.style.display = saved.imageDisplay;
    if (saved.mark && saved.mark.isConnected) saved.mark.remove();
    restoredTriggers.delete(element);
  }

  function hijackClick(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openPanel(false);
  }

  function replaceTrigger(element) {
    if (element.dataset.byonTrigger === 'true') return;
    const labelNode = Array.from(element.querySelectorAll('div,span')).reverse().find((node) => /^Ask AI$/i.test(node.textContent.trim()) && node.children.length === 0);
    const image = element.querySelector('img[alt*="Notion AI" i],img[alt*="AI face" i]');
    const mark = document.createElement('img');
    mark.src = BYON_ICON_DATA_URL;
    mark.alt = '';
    mark.setAttribute('aria-hidden', 'true');
    mark.style.cssText = 'display:block;width:20px;height:20px;object-fit:contain;margin-inline:-2px 2px;box-sizing:border-box';
    if (!labelNode) mark.style.cssText += ';width:40px;height:40px;margin:0';
    restoredTriggers.set(element, { ariaLabel: element.getAttribute('aria-label'), labelNode, labelText: labelNode?.textContent || '', image, imageDisplay: image?.style.display || '', mark });
    if (labelNode) labelNode.textContent = 'Ask BYON';
    if (image) { image.style.display = 'none'; image.insertAdjacentElement('afterend', mark); }
    else element.insertAdjacentElement('afterbegin', mark);
    element.dataset.byonTrigger = 'true';
    element.setAttribute('aria-label', 'Ask BYON');
    element.addEventListener('click', hijackClick, true);
  }

  function applyTriggerReplacement() {
    if (!state.settings.replacementEnabled) {
      for (const element of Array.from(restoredTriggers.keys())) restoreTrigger(element);
      return;
    }
    notionAiCandidates().forEach(replaceTrigger);
  }

  function observeTriggers() {
    replacementObserver = new MutationObserver(() => {
      clearTimeout(observeTriggers.timer);
      observeTriggers.timer = setTimeout(applyTriggerReplacement, 80);
    });
    replacementObserver.observe(document.documentElement, { childList: true, subtree: true });
    applyTriggerReplacement();
  }

  function recordSelection() {
    const selection = global.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (!text || !selection.anchorNode) return;
    const node = selection.anchorNode.nodeType === 1 ? selection.anchorNode : selection.anchorNode.parentElement;
    if (node?.closest('.notion-page-content') && !node.closest('#byon-root')) lastNotionSelection = text.slice(0, PAGE_EXCERPT_LIMIT);
  }

  function handleShortcut(event) {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'j') {
      event.preventDefault(); event.stopImmediatePropagation(); openPanel(false);
    }
  }

  async function initialize() {
    state = migrateState(await gm.getValue(STORAGE_KEY, null));
    ensureHost();
    observeTriggers();
    document.addEventListener('selectionchange', recordSelection);
    global.addEventListener('keydown', handleShortcut, true);
    gm.menu('Open BYON', () => openPanel(false));
    gm.menu('BYON Settings', () => openPanel(true));
  }

  const STYLES = `
    :host{--bg:var(--c-bacPri,#fff);--panel:var(--c-bacEle,#fff);--text:var(--c-texPri,#2c2c2b);--muted:var(--c-texSec,#7d7a75);--faint:var(--ca-bacTerTra,rgba(42,28,0,.07));--border:var(--c-borSec,#f0efed);--blue:var(--c-bluBacAccPri,#2383e2);font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI Variable Display","Segoe UI",Helvetica,"Apple Color Emoji","Noto Sans Arabic","Noto Sans Hebrew",Arial,sans-serif;color:var(--text);font-size:14px;line-height:1.5;color-scheme:inherit}
    *{box-sizing:border-box}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}button,input,textarea,select{font:inherit;color:inherit}button{border:0;background:var(--faint);border-radius:6px;padding:7px 10px;cursor:pointer}button:hover{filter:brightness(.96)}button:disabled{opacity:.45;cursor:not-allowed}.primary{background:var(--blue);color:white}.danger,.danger-link{color:#e03e3e}.danger-link{background:transparent;padding:2px}.panel{pointer-events:auto;position:fixed;inset-block:0;inset-inline-end:0;width:420px;max-width:100vw;background:var(--panel);border-inline-start:1px solid var(--border);box-shadow:-8px 0 24px rgba(0,0,0,.08);display:flex;flex-direction:column;z-index:3}.panel[hidden]{display:none}.resize-handle{position:absolute;inset-block:0;inset-inline-start:-4px;width:8px;cursor:ew-resize;z-index:5}.panel-header{height:48px;min-height:48px;display:flex;align-items:center;gap:4px;padding:6px 8px;border-bottom:1px solid var(--border);user-select:none}.header-center{min-width:0;flex:1;display:flex;flex-direction:column;text-align:center}.header-center strong,.header-center small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.header-center small{font-size:11px;color:var(--muted)}.icon-button{background:transparent;width:32px;height:32px;padding:0;font-size:18px}.history{position:absolute;top:48px;bottom:0;inset-inline-start:0;width:min(300px,85%);z-index:4;background:var(--panel);border-inline-end:1px solid var(--border);box-shadow:8px 8px 20px rgba(0,0,0,.08);padding:10px;overflow:auto}.history-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.history-row{display:flex;width:100%;justify-content:space-between;gap:8px;text-align:start;background:transparent}.history-row.active{background:var(--faint)}.history-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.history-row small{color:var(--muted)}.messages{flex:1;overflow:auto;padding:20px 22px}.landing{min-height:70%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.landing h1{font-size:28px;margin:12px 0 4px}.landing p{color:var(--muted);max-width:300px}.byon-orb{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:var(--blue);color:white;font-weight:700;font-size:20px}.message{margin:0 0 24px}.message.user{background:var(--faint);padding:10px 12px;border-radius:12px;margin-inline-start:28px}.message-role{font-size:11px;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em}.message-content{line-height:1.55;overflow-wrap:anywhere}.message-content p{margin:0 0 8px}.message-content h1,.message-content h2,.message-content h3{margin:14px 0 6px;line-height:1.25}.message-content pre{overflow:auto;background:var(--faint);padding:10px;border-radius:7px}.message-content code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:var(--faint);padding:1px 3px;border-radius:3px}.message-content pre code{background:transparent;padding:0}.message-content a{color:var(--blue)}.message-actions{display:flex;gap:4px;margin-top:6px}.message-actions button{font-size:11px;padding:3px 6px;background:transparent;color:var(--muted)}.error{color:#e03e3e;white-space:pre-wrap}.composer-area{padding:8px 16px 12px;background:linear-gradient(transparent,var(--panel) 18%)}.context-row{display:flex;gap:5px;overflow:auto;padding:2px 0 7px}.chip{white-space:nowrap;border:1px solid var(--border);border-radius:999px;padding:4px 8px;background:var(--panel);font-size:12px}.chip.static{color:var(--muted)}.chip.active{color:var(--blue);border-color:var(--blue)}.composer-box{border:1px solid var(--border);border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.06);padding:10px;background:var(--panel)}.composer-box textarea{display:block;width:100%;min-height:42px;max-height:180px;resize:vertical;border:0;outline:0;background:transparent}.composer-toolbar{display:flex;justify-content:space-between;align-items:center;margin-top:5px}.composer-toolbar select{max-width:70%;border:0;background:transparent;color:var(--muted)}.send{border-radius:50%;width:30px;height:30px;padding:0;background:var(--blue);color:white;font-size:18px}.send.stop{background:var(--text);font-size:11px}.disclaimer{text-align:center;color:var(--muted);font-size:10px;margin-top:6px}.settings-view{height:100%;overflow:auto;padding:14px 18px 24px}.settings-title{display:flex;align-items:center;gap:6px}.settings-title h2{font-size:18px}.settings-view label{display:flex;flex-direction:column;gap:5px;margin:12px 0;color:var(--muted);font-size:12px}.settings-view input,.settings-view select,.settings-view textarea{width:100%;border:1px solid var(--border);background:var(--panel);border-radius:6px;padding:8px;color:var(--text)}.settings-view textarea{resize:vertical}.settings-view fieldset{border:1px solid var(--border);border-radius:8px;margin:16px 0;padding:0 12px 10px}.settings-view legend{padding:0 5px;font-weight:600}.settings-view .checkbox{flex-direction:row;align-items:center}.settings-view .checkbox input{width:auto}.grid-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.row{display:flex;gap:8px}.row.end{justify-content:flex-end}.notice{padding:8px 10px;border-radius:7px;background:var(--faint);color:var(--muted);font-size:12px;line-height:1.4}.status{margin-top:10px;min-height:20px;color:var(--muted)}.empty-small{color:var(--muted);padding:10px}.modal-backdrop{pointer-events:auto;position:fixed;inset:0;background:rgba(0,0,0,.35);display:grid;place-items:center;padding:20px;z-index:10}.modal{width:min(520px,100%);max-height:80vh;overflow:auto;background:var(--panel);border:1px solid var(--border);box-shadow:0 12px 40px rgba(0,0,0,.2);border-radius:12px;padding:18px}.modal h2{margin-top:0}.modal pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--faint);padding:10px;border-radius:7px}
    @keyframes byon-popover-in{from{opacity:0;transform:translateY(4px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes byon-panel-in{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
    .panel{animation:byon-panel-in 180ms cubic-bezier(.2,.8,.2,1);background:var(--c-bacPri,var(--panel));box-shadow:none}
    .panel-header{height:48px;min-height:48px;padding:6px 12px 6px 14px;border-bottom:0;justify-content:space-between}
    .chat-title-button{display:flex;align-items:center;min-width:0;max-width:68%;height:34px;gap:7px;background:transparent;padding:5px 8px 5px 4px;border-radius:6px;font-weight:500}.chat-title-button:hover,.icon-button:hover,.round-tool:hover,.model-button:hover{background:var(--ca-bacIntTra,var(--faint));filter:none}.chat-title-button>span:nth-child(2){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.header-icon{width:22px;height:22px;object-fit:contain}.header-actions{display:flex;align-items:center;gap:2px}.icon-button{display:grid;place-items:center;width:32px;height:32px;font-size:17px;color:var(--c-icoPri,var(--text))}.ui-icon{display:block;width:20px;height:20px;fill:currentColor;flex:0 0 auto}.chevron-icon{display:block;width:14px;height:14px;fill:currentColor;color:var(--c-icoTer,var(--muted));flex:0 0 auto}
    .messages{padding:20px 20px 8px}.landing{min-height:68%}.landing-icon{width:48px;height:48px;object-fit:contain}.landing h1{font-size:24px;line-height:1.25;font-weight:600;margin-top:14px}.landing p{font-size:13px}.message{font-size:14px;margin-bottom:22px}.message.user{width:fit-content;max-width:90%;margin-inline-start:auto;background:var(--ca-bacTerTra,var(--faint));border-radius:18px;padding:8px 13px}.message-role{height:24px;margin-bottom:7px}.message-icon{width:24px;height:24px}.message-content p{margin-bottom:7px}.message-actions{opacity:.72}
    .composer-area{position:relative;padding:10px 16px 12px;background:linear-gradient(transparent 0,var(--c-bacPri,var(--panel)) 16%)}.composer-wrap{position:relative;border:1px solid var(--c-borSec,var(--border));border-radius:16px;background:var(--c-bacPri,var(--panel));box-shadow:var(--c-shaOutSm,0 1px 3px rgba(0,0,0,.08));padding:11px 11px 9px;transition:border-color 120ms ease,box-shadow 120ms ease}.composer-wrap:focus-within{border-color:var(--c-borPri,rgba(55,53,47,.42));box-shadow:0 0 0 1px var(--c-borPri,rgba(55,53,47,.42)),var(--c-shaOutSm,0 1px 3px rgba(0,0,0,.08))}.composer-wrap textarea{display:block;width:100%;min-height:54px;max-height:190px;resize:none;border:0;outline:0;background:transparent;padding:2px 4px;color:var(--text);font-size:14px;line-height:21px}.composer-wrap textarea::placeholder{color:var(--c-texTer,#a19e99)}.composer-toolbar{display:flex;align-items:center;justify-content:space-between;min-height:34px;margin-top:3px}.toolbar-left,.toolbar-right{display:flex;align-items:center;gap:4px;min-width:0}.round-tool{display:grid;place-items:center;width:32px;height:32px;padding:0;border-radius:50%;background:transparent;color:var(--c-icoSec,var(--muted))}.model-button{display:flex;align-items:center;gap:3px;min-width:0;max-width:220px;height:32px;background:transparent;font-weight:600;padding:5px 8px;border-radius:8px;color:var(--c-texSec,var(--muted))}.model-name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.send{display:grid;place-items:center;width:32px;height:32px;background:var(--c-icoPri,var(--text));font-size:17px}.send .ui-icon{width:18px;height:18px}.disclaimer{margin-top:6px;font-size:10px;line-height:15px}
    .attachment-row{display:flex;gap:5px;overflow-x:auto;padding-bottom:7px}.attachment-chip{display:inline-flex;align-items:center;gap:5px;max-width:220px;min-height:28px;border:1px solid var(--border);border-radius:8px;padding:3px 5px 3px 7px;background:var(--c-bacPri,var(--panel));font-size:12px;white-space:nowrap}.attachment-chip>span:nth-child(2){overflow:hidden;text-overflow:ellipsis}.attachment-chip button{width:20px;height:20px;padding:0;background:transparent}.context-attachment{color:var(--muted)}
    .notion-popover{position:absolute;z-index:8;background:var(--c-bacEle,var(--panel));border:1px solid var(--ca-borPriTra,var(--border));border-radius:10px;box-shadow:var(--c-shaOutLg,0 8px 24px rgba(0,0,0,.14));padding:6px;animation:byon-popover-in 120ms ease-out;transform-origin:bottom center;color:var(--text)}.chat-popover{top:43px;inset-inline-start:14px;width:min(340px,calc(100% - 28px));transform-origin:top left}.plus-popover{bottom:72px;inset-inline-start:16px;width:300px}.model-popover{bottom:72px;inset-inline-end:16px;width:min(360px,calc(100% - 32px));padding:7px 0}.mode-popover{bottom:72px;inset-inline-start:52px;width:min(320px,calc(100% - 68px))}.popover-scroll{max-height:390px;overflow-y:auto;overscroll-behavior:contain}.chat-popover .popover-scroll{max-height:280px}.popover-search{height:38px;display:flex;align-items:center;gap:8px;margin:1px 7px 7px;padding:0 10px;border-radius:6px;background:var(--ca-bacTerTra,var(--faint));color:var(--c-icoSec,var(--muted));cursor:text}.popover-search .ui-icon{width:18px;height:18px}.popover-search:focus-within{box-shadow:inset 0 0 0 1px var(--c-borPri,var(--border))}.popover-search input{width:100%;height:100%;border:0;outline:0;background:transparent;font-size:14px;line-height:20px}.menu-section-label{padding:8px 10px 5px;color:var(--c-texTer,var(--muted));font-size:12px;line-height:16px}.menu-row,.menu-row-button,.model-row,.mode-row{display:flex;width:100%;min-height:40px;align-items:center;gap:10px;text-align:start;border-radius:6px;background:transparent;padding:7px 10px}.menu-row:hover,.menu-row-button:hover,.model-row:hover,.mode-row:hover,.menu-row.selected,.model-row.selected,.mode-row.selected{background:var(--ca-bacIntTra,var(--faint));filter:none}.menu-row-button>span:nth-child(2),.mode-row>span:nth-child(2){display:flex;min-width:0;flex:1;flex-direction:column;gap:1px}.menu-row-button small,.mode-row small,.model-copy small{font-size:12px;line-height:16px;color:var(--c-texTer,var(--muted));font-weight:400}.menu-icon{display:grid;place-items:center;flex:0 0 22px;color:var(--c-icoSec,var(--muted));font-size:15px}.mention-icon,.mode-glyph{width:20px;height:20px;border-radius:5px;background:var(--ca-bacTerTra,var(--faint));font-size:12px;font-weight:600}.history-open{display:flex;align-items:center;min-width:0;min-height:30px;flex:1;gap:8px;text-align:start;background:transparent;padding:0}.menu-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.row-action{opacity:0;width:30px;height:30px;padding:0;background:transparent}.chat-row:hover .row-action,.row-action:focus-visible{opacity:1}.check{margin-inline-start:auto}.popover-footer{display:flex;justify-content:space-between;gap:4px;border-top:1px solid var(--border);margin-top:6px;padding:6px 7px 0}.popover-footer button{display:flex;align-items:center;gap:6px;min-height:32px;background:transparent;font-size:12px}.popover-footer .ui-icon{width:16px;height:16px}.model-group+.model-group{border-top:1px solid var(--border);margin-top:5px;padding-top:5px}.model-row{min-height:50px;border-radius:0;padding:8px 14px}.model-logo{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--ca-bacTerTra,var(--faint));font-size:11px;font-weight:600}.model-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:1px}.model-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px;font-weight:500}.popover-divider{height:1px;background:var(--border);margin:6px 0}
    .popover-search{height:40px}.row-action{display:grid;place-items:center}.row-action .ui-icon{width:17px;height:17px}.attachment-chip>.ui-icon{width:16px;height:16px;color:var(--c-icoSec,var(--muted))}
    /* Final measurements follow the saved Notion component examples. */
    :host{font-family:inherit;font-weight:400}strong{font-weight:500}button{min-height:28px;padding:4px 8px;font-weight:400}.panel-header{height:44px;min-height:44px;padding:8px 12px}.chat-title-button{height:28px;max-width:72%;padding:3px 6px;gap:6px;font-weight:400}.header-icon{width:20px;height:20px}.header-actions{gap:2px}.icon-button{width:28px;height:28px}.icon-button .ui-icon{width:20px;height:20px}
    .messages{padding:16px 20px 8px}.landing{min-height:66%}.landing h1{font-size:17px;line-height:22px;font-weight:600;margin:12px 0 3px}.landing p{font-size:12px;line-height:16px}.message{margin-bottom:20px}.message.user{border-radius:12px;padding:10px 12px;background:var(--c-bacSec,var(--faint))}.message-content{line-height:1.5}
    .composer-area{padding:8px 16px 12px}.composer-wrap{border:0;border-radius:16px;padding:0;background:var(--c-bacPri,var(--panel));box-shadow:var(--c-shaOutSm,0 1px 3px rgba(0,0,0,.08))}.composer-wrap:focus-within{border:0;box-shadow:var(--c-shaOutSm,0 1px 3px rgba(0,0,0,.08)),0 0 0 1px var(--c-borPri,var(--border))}.composer-wrap textarea{min-height:60px;padding:12px 12px 0 14px;font-size:14px;line-height:20px}.attachment-row{padding:8px 10px 0}.composer-toolbar{min-height:36px;height:36px;margin:0;padding:4px 8px}.round-tool,.send{width:28px;height:28px}.round-tool .ui-icon{width:20px;height:20px}.model-button{height:28px;max-width:200px;padding:4px 10px;gap:5px;border-radius:999px;font-weight:500}.model-name{font-size:14px;line-height:20px}.send .ui-icon{width:16px;height:16px}.disclaimer{margin-top:4px}
    .notion-popover{border:0;border-radius:10px;box-shadow:var(--c-shaOutLg,0 8px 24px rgba(0,0,0,.14));padding:4px}.chat-popover{top:40px;inset-inline-start:12px;width:min(320px,calc(100% - 24px))}.plus-popover{bottom:64px;inset-inline-start:16px;width:280px}.model-popover{bottom:64px;inset-inline-end:16px;width:min(320px,calc(100% - 32px));padding:4px 0}.mode-popover{bottom:64px;inset-inline-start:48px;width:min(280px,calc(100% - 64px))}.popover-search{height:36px;margin:2px 6px 5px;padding:0 9px}.popover-search input{font-size:14px}.menu-section-label{padding:7px 10px 4px;font-weight:400}.menu-row,.menu-row-button,.mode-row{min-height:36px;padding:6px 8px;gap:8px}.model-row{min-height:44px;padding:5px 10px}.model-logo{width:18px;height:18px;font-size:10px;font-weight:500}.model-copy{gap:0}.model-copy strong{font-size:14px;line-height:20px;font-weight:500}.model-copy small,.menu-row-button small,.mode-row small{font-size:12px;line-height:16px}.model-group+.model-group{margin-top:3px;padding-top:3px}.popover-footer{margin-top:4px;padding:4px 5px 0}.popover-footer button{min-height:28px}.row-action{width:28px;height:28px}
    .settings-view{padding:12px 16px 20px}.settings-title{height:32px;gap:6px}.settings-title h2{font-size:16px;line-height:22px;font-weight:600;margin:0}.settings-view label{gap:4px;margin:9px 0;font-size:12px;line-height:16px;font-weight:400}.settings-view input,.settings-view select,.settings-view textarea{min-height:32px;border:0;border-radius:8px;padding:6px 8px;background:var(--c-bacPri,var(--panel));box-shadow:inset 0 0 0 1px var(--c-borPri,var(--border));font-size:14px;line-height:20px}.settings-view input:focus,.settings-view select:focus,.settings-view textarea:focus{box-shadow:inset 0 0 0 1px var(--c-bluBorAccPri,#2383e2),0 0 0 1px var(--c-bluBorAccPri,#2383e2)}.settings-view fieldset{margin:12px 0;padding:0 10px 8px;border:0;border-radius:10px;background:var(--ca-bacSecTra,var(--faint))}.settings-view legend{padding:7px 2px 0;font-weight:500}.grid-two{gap:8px}.row{gap:6px}.notice{padding:7px 9px;border-radius:8px;font-size:12px;line-height:16px}.status{margin-top:8px}.modal{border:0;border-radius:12px;box-shadow:var(--c-shaOutLg,0 12px 40px rgba(0,0,0,.2))}
    .settings-view .checkbox input{width:14px;height:14px;min-height:0;padding:0;box-shadow:none;accent-color:var(--c-bluBacAccPri,#2383e2)}
    @media(max-width:600px){.panel{width:100%!important}.resize-handle{display:none}.messages{padding-inline:14px}.grid-two{grid-template-columns:1fr}}
  `;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})(typeof window !== 'undefined' ? window : globalThis);

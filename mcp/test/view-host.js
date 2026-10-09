// The stand-in MCP Apps host of the view check (card #278), bundled for the
// browser by test/view.js: the standard's own host side (`AppBridge` of
// @modelcontextprotocol/ext-apps), the page in a sandboxed iframe of another
// origin, one tool call's input and result handed over — the result without
// `structuredContent`, which a view must not depend on — and the view's
// tools/call forwarded to the MCP server through `window.mcp`, which the
// driver provides. Every message the view sends is recorded as it arrives,
// before the bridge reads it.

import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';

window.viewLog = { sent: [], toolCalls: [], links: [], context: [], messages: [], modes: [] };

window.startHost = async ({ src, tool, args, theme }) => {
  const iframe = document.getElementById('view');
  window.addEventListener('message', (e) => {
    if (e.source === iframe.contentWindow) window.viewLog.sent.push(e.data);
  });
  const bridge = new AppBridge(
    null,
    { name: 'graph-med-view-check', version: '0' },
    { openLinks: {}, serverTools: {}, updateModelContext: { text: {} }, message: { text: {} } },
    { hostContext: { theme, displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] } },
  );
  bridge.oncalltool = async (params) => {
    window.viewLog.toolCalls.push(params);
    return window.mcp('tools/call', params);
  };
  bridge.onopenlink = async ({ url }) => {
    window.viewLog.links.push(url);
    return {};
  };
  bridge.onupdatemodelcontext = async (p) => {
    window.viewLog.context.push(p);
    return {};
  };
  bridge.onmessage = async (p) => {
    window.viewLog.messages.push(p);
    return {};
  };
  bridge.onrequestdisplaymode = async ({ mode }) => {
    window.viewLog.modes.push(mode);
    await bridge.sendHostContextChange({ displayMode: mode });
    return { mode };
  };
  bridge.onsizechange = ({ height }) => {
    if (height) iframe.style.height = `${Math.ceil(height)}px`;
  };
  const initialized = new Promise((resolve) => {
    bridge.oninitialized = resolve;
  });
  await bridge.connect(new PostMessageTransport(iframe.contentWindow, iframe.contentWindow));
  iframe.src = src;
  await initialized;
  await bridge.sendToolInput({ arguments: args });
  const { structuredContent, ...result } = await window.mcp('tools/call', { name: tool, arguments: args });
  await bridge.sendToolResult(result);
  window.bridge = bridge;
};

// The host's requests the view must answer: ping, and the teardown before the
// iframe goes.
window.endHost = async () => {
  const out = {};
  const iframe = document.getElementById('view');
  out.ping = await new Promise((resolve) => {
    const id = 'view-check-ping';
    const on = (e) => {
      if (e.source !== iframe.contentWindow || e.data?.id !== id) return;
      window.removeEventListener('message', on);
      resolve(e.data.result ?? { error: e.data.error });
    };
    window.addEventListener('message', on);
    iframe.contentWindow.postMessage({ jsonrpc: '2.0', id, method: 'ping' }, '*');
    setTimeout(() => resolve({ error: 'no answer in 3 s' }), 3000);
  });
  try {
    out.teardown = await window.bridge.teardownResource({});
  } catch (e) {
    out.teardown = { error: e.message };
  }
  return out;
};

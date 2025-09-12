#!/usr/bin/env node

/**
 * Simple build script for WhatsApp Admin Panel
 * Minifies and bundles JavaScript files for production
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BUILD_DIR = 'dist';
const JS_DIR = 'js';
const MODULES = [
  'config.js',
  'state.js', 
  'api.js',
  'socket.js',
  'ui.js',
  'app.js'
];

/**
 * Minify JavaScript (basic minification)
 * @param {string} code - JavaScript code
 * @returns {string} Minified code
 */
function minifyJS(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s*([{}();,=])\s*/g, '$1') // Remove spaces around operators
    .trim();
}

/**
 * Bundle JavaScript modules
 * @returns {string} Bundled JavaScript
 */
function bundleJS() {
  let bundled = '';
  
  MODULES.forEach(module => {
    const filePath = path.join(JS_DIR, module);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      bundled += `\n// ${module}\n${content}\n`;
    } else {
      console.warn(`Warning: ${filePath} not found`);
    }
  });
  
  return bundled;
}

/**
 * Create production HTML
 * @param {string} bundledJS - Bundled JavaScript
 * @returns {string} Production HTML
 */
function createProductionHTML(bundledJS) {
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Broadcast Ops Console — Admin</title>
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <style>
    :root{
      --bg:#0b141a; --panel:#111b21; --ink:#e9edef; --muted:#aebac1; --accent:#53bdeb; --line:#1f2c34;
      --green:#00a884; --red:#ff6b6b; --yellow:#ffd166; --chip:#202c33; --incoming:#202c33; --outgoing:#005c4b;
    }
    *{box-sizing:border-box}
    html,body{height:100%}
    body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial}
    .app{height:100%;display:grid;grid-template-columns: 360px 1fr 320px}

    /* LEFT: chats list */
    .sidebar{background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column}
    .left-head{padding:12px;border-bottom:1px solid var(--line);display:flex;gap:8px;align-items:center}
    .left-head input{flex:1;background:#111b21;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 10px}
    .tabs{display:flex;gap:6px;padding:8px 12px;border-bottom:1px solid var(--line)}
    .tab{padding:6px 10px;border-radius:999px;background:var(--chip);color:var(--muted);cursor:pointer}
    .tab.active{background:#0e2a36;color:var(--accent)}
    .chatlist{overflow:auto}
    .item{display:grid;grid-template-columns: 44px 1fr auto;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line);cursor:pointer}
    .item:hover{background:#0f1f26}
    .avatar{width:44px;height:44px;border-radius:50%;background:#25313a;display:grid;place-items:center;color:#9cc4ff;font-weight:700}
    .title{font-weight:600}
    .meta{color:var(--muted);font-size:12px}
    .badge{background:#1f2c34;color:#9fe1ff;border:1px solid #2b3b45;font-size:11px;border-radius:999px;padding:2px 8px}
    .unread{background:#1fa855;color:white;border:none}

    /* CENTER: thread */
    .thread{display:flex;flex-direction:column;background:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%23111b21"/><path d="M0 16h32M16 0v32" stroke="%231f2c34" stroke-width="1"/></svg>')}
    .thread-head{display:flex;align-items:center;gap:10px;padding:12px;border-bottom:1px solid var(--line);background:var(--panel)}
    .thread-head .name{font-weight:600}
    .chips{display:flex;gap:6px;flex-wrap:wrap}
    .chip{background:var(--chip);border:1px solid var(--line);color:var(--muted);font-size:11px;border-radius:999px;padding:3px 8px}
    .area{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:8px}
    .msg{max-width:70%;padding:8px 10px;border-radius:10px;position:relative}
    .in{align-self:flex-start;background:var(--incoming)}
    .out{align-self:flex-end;background:var(--outgoing)}
    .stamp{font-size:11px;color:#b7c7ce;opacity:.85;margin-top:2px}
    
    /* Message type indicators */
    .msg[data-type="1"] { border-left: 3px solid #53bdeb; } /* Bot template */
    .msg[data-type="2"] { border-left: 3px solid #00a884; } /* Client */
    .msg[data-type="3"] { border-left: 3px solid #ffd166; } /* AI */
    .msg[data-type="4"] { border-left: 3px solid #ff6b6b; } /* Admin */

    /* composer */
    .composer{display:grid;grid-template-columns: 1fr auto auto;gap:8px;padding:10px;border-top:1px solid var(--line);background:var(--panel)}
    .composer textarea{width:100%;min-height:40px;resize:vertical;background:#0f191f;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px}
    button{border:none;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:600}
    .takeover{background:var(--yellow);color:#1b1b1b}
    .send{background:var(--green);color:#00170f}
    .quick{background:#0f191f;color:var(--muted)}

    /* RIGHT: info */
    .right{background:var(--panel);border-left:1px solid var(--line);display:flex;flex-direction:column}
    .right-head{padding:12px;border-bottom:1px solid var(--line);font-weight:600}
    .section{padding:12px;border-bottom:1px solid var(--line)}
    .row{display:flex;justify-content:space-between;margin:6px 0;color:var(--muted)}
    .tag{background:#0f191f;border:1px solid var(--line);color:#9cc4ff;border-radius:999px;padding:3px 8px;font-size:11px;margin:2px;display:inline-block}
    .buttons{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
    .ghost{background:#0f191f;color:var(--ink);border:1px solid var(--line)}

    /* toast */
    .toast{position:fixed;right:16px;bottom:16px;background:#0f191f;border:1px solid var(--line);padding:10px 12px;border-radius:8px;display:none}
  </style>
</head>
<body>
<div class="app" id="app">

  <!-- LEFT -->
  <aside class="sidebar">
    <div class="left-head">
      <input id="search" placeholder="Search or filter (name, tag)..." />
      <button class="ghost" id="refresh" style="padding: 8px; font-size: 12px;">🔄</button>
      <div id="connection-status" style="width: 8px; height: 8px; border-radius: 50%; background: #666; margin-left: 4px;" title="Connection status"></div>
    </div>
    <div class="tabs">
      <div class="tab active" data-filter="all">All</div>
      <div class="tab" data-filter="unread">Unread</div>
      <div class="tab" data-filter="attention">Attention</div>
    </div>
    <div class="chatlist" id="chatlist"></div>
  </aside>

  <!-- CENTER -->
  <main class="thread">
    <div class="thread-head">
      <div class="avatar" id="av"></div>
      <div>
        <div class="name" id="who">—</div>
        <div class="chips" id="chips"></div>
      </div>
    </div>
    <div class="area" id="area"></div>
    <div class="composer">
      <textarea id="text" placeholder="Write to intervene manually..."></textarea>
      <button class="quick" id="quick">Quick Replies</button>
      <button class="send" id="send">Send</button>
    </div>
  </main>

  <!-- RIGHT -->
  <aside class="right">
    <div class="right-head">Contact Card</div>
    <div class="section" id="profile">
      <div class="row"><span>Source</span><span id="src">Whats</span></div>
      <div class="row"><span>Phone</span><span id="phone">—</span></div>
      <div class="row"><span>Status</span><span id="status">Bot active</span></div>
      <div class="row"><span>Interview</span><span id="interview">—</span></div>
      <div class="row"><span>Last message</span><span id="last">—</span></div>
      <div class="row"><span>Time zone</span><span id="tz">UTC−6</span></div>
      <div style="margin-top:8px">
        <span class="tag">lead</span><span class="tag">fx</span><span class="tag">broadcast</span>
      </div>
      <div class="buttons">
        <button class="ghost" id="toggle">Take control</button>
        <button class="ghost" id="open8n8">Open in 8n8</button>
        <button class="ghost" id="viewThread">View in source</button>
      </div>
    </div>

    <div class="section">
      <div style="font-weight:600;margin-bottom:6px">Notes</div>
      <textarea id="note" style="width:100%;min-height:80px;background:#0f191f;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px" placeholder="Internal notes (not sent to the client)"></textarea>
      <div class="buttons"><button class="ghost" id="saveNote">Save note</button></div>
    </div>

    <div class="section">
      <div style="font-weight:600;margin-bottom:6px">Message Types</div>
      <div style="font-size:11px;color:var(--muted);line-height:1.4">
        <div style="display:flex;align-items:center;margin:4px 0"><span style="width:12px;height:3px;background:#53bdeb;margin-right:6px"></span>Bot Template</div>
        <div style="display:flex;align-items:center;margin:4px 0"><span style="width:12px;height:3px;background:#00a884;margin-right:6px"></span>Client Message</div>
        <div style="display:flex;align-items:center;margin:4px 0"><span style="width:12px;height:3px;background:#ffd166;margin-right:6px"></span>AI Response</div>
        <div style="display:flex;align-items:center;margin:4px 0"><span style="width:12px;height:3px;background:#ff6b6b;margin-right:6px"></span>Admin Intervention</div>
      </div>
    </div>

    <div class="section">
      <div style="font-weight:600;margin-bottom:6px">Quick Actions</div>
      <div class="buttons">
        <button class="ghost" data-quick="Thanks for the reply — here's our Telegram channel: https://t.me/tradetabofficial">Invite to Telegram</button>
        <button class="ghost" data-quick="All good — we'll keep you posted with neutral market commentary only.">Confirm subscription</button>
        <button class="ghost" data-quick="Understood. I've removed you from the list. You can rejoin anytime.">Unsubscribe</button>
      </div>
    </div>
  </aside>
</div>

<div class="toast" id="toast"></div>

<script>
${bundledJS}
</script>

</body>
</html>`;

  return htmlTemplate;
}

/**
 * Main build function
 */
function build() {
  console.log('🚀 Building WhatsApp Admin Panel...');
  
  // Create build directory
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR);
  }
  
  // Bundle JavaScript
  console.log('📦 Bundling JavaScript modules...');
  const bundledJS = bundleJS();
  
  // Create production HTML
  console.log('🏗️ Creating production HTML...');
  const productionHTML = createProductionHTML(bundledJS);
  
  // Write files
  fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), productionHTML);
  fs.writeFileSync(path.join(BUILD_DIR, 'app.js'), bundledJS);
  
  console.log('✅ Build completed successfully!');
  console.log(`📁 Output: ${BUILD_DIR}/index.html`);
  console.log(`📁 Output: ${BUILD_DIR}/app.js`);
}

// Run build
if (require.main === module) {
  build();
}

module.exports = { build, minifyJS, bundleJS, createProductionHTML };

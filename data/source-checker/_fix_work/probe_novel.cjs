const { spawnSync } = require('child_process');
const CLI = 'C:/Users/Taois/.claude/skills/drpy-node-coder/scripts/cli.js';
const URL = 'https://www.23ddw.cc/du/337/337924/';
const r = spawnSync('node', [CLI, 'fetch', URL], { encoding: 'utf8', timeout: 40000, maxBuffer: 30 * 1024 * 1024 });
const lines = (r.stdout || '').split('\n').filter(Boolean);
let j = null;
for (let i = lines.length - 1; i >= 0; i--) { const s = lines[i].trim(); if (s.startsWith('{')) { try { j = JSON.parse(s); break; } catch (_) {} } }
const d = j && j.data;
let html = typeof d === 'string' ? d : (d && d.data) || '';
console.log('html 长度:', html.length);

// 找 #list 块
const idx = html.indexOf('id="list"');
if (idx < 0) { console.log('未找到 id="list"');
  // 试 dd/dt 结构
  const m = html.match(/<dt[^>]*>[\s\S]{0,600}/);
  console.log('dt 块:', m ? m[0].slice(0, 500) : '无');
} else {
  console.log('=== #list 块(前1500字符) ===');
  console.log(html.substring(idx, idx + 1500));
}

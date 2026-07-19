const { spawnSync } = require('child_process');
const CLI = 'C:/Users/Taois/.claude/skills/drpy-node-coder/scripts/cli.js';
const SOURCES = ['立播[盘]','夜猫影视','虎斑[盘]','耐看点播[优]','软鸭短剧[短]','无广告TV','顶点小说[书]','卫星影视','酷爱漫画[画]','木偶[盘]'];
for (const name of SOURCES) {
  const r = spawnSync('node', [CLI, 'resolved', 'spider/js/' + name + '.js'], { encoding: 'utf8', timeout: 40000 });
  const lines = (r.stdout || '').split('\n').filter(Boolean);
  let j = null;
  for (let i = lines.length - 1; i >= 0; i--) { const s = lines[i].trim(); if (s.startsWith('{')) { try { j = JSON.parse(s); break; } catch (_) {} } }
  const d = j && j.data;
  const erji = d && d['二级'];
  let type = '?';
  if (erji === undefined) type = '无二级(模板继承?)';
  else if (typeof erji === 'string') type = 'string:' + erji.slice(0, 30);
  else if (typeof erji === 'object' && erji !== null) {
    if (erji === '*') type = '* (继承模板)';
    else type = 'dict {tabs/lists}';
  } else if (typeof erji === 'function' || /async\s+function|function\s*\(/.test(String(erji))) type = 'async function';
  // resolved 里二级若是 function 会被 toString 或省略，需另读源码判断
  console.log(name + ' -> ' + type + (erji && typeof erji === 'object' ? ' tabs=' + JSON.stringify(erji.tabs).slice(0, 50) : ''));
}

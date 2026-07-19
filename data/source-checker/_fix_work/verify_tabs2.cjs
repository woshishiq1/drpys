const { spawnSync } = require('child_process');
const CLI = 'C:/Users/Taois/.claude/skills/drpy-node-coder/scripts/cli.js';
// 顶点小说 #list 结构: dl > dt(标题) + a>dd(章节)
// 樱花结构不同,已修好,这里只验证顶点
const URL = 'https://www.23ddw.cc/du/337/337924/';

function pdfa(rule) {
  const r = spawnSync('node', [CLI, 'debug', '--rule', rule, '--mode', 'pdfa', '--url', URL], { encoding: 'utf8', timeout: 40000 });
  const lines = (r.stdout || '').split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) { const s = lines[i].trim(); if (s.startsWith('{')) { try { return JSON.parse(s).data; } catch (_) {} } }
  return null;
}
function pdfh(html, rule) {
  const r = spawnSync('node', [CLI, 'debug', '--rule', rule, '--mode', 'pdfh', '--html', html], { encoding: 'utf8', timeout: 20000 });
  const lines = (r.stdout || '').split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) { const s = lines[i].trim(); if (s.startsWith('{')) { try { return JSON.parse(s).data.result; } catch (_) {} } }
  return '?';
}

// 模拟 drpy: p_tab = tabs.split(';')[0], vHeader=$pdfa(html,p_tab), tab_text 取文本
const variants = [
  { tabs: '#list&&dt', tab_text: 'dd&&Text', label: '原写法 tabs=#list&&dt + tab_text=dd&&Text' },
  { tabs: '#list&&dt', tab_text: 'body&&Text', label: 'tabs不变 + tab_text=body&&Text' },
  { tabs: '#list dt', tab_text: 'body&&Text', label: 'tabs=#list dt + tab_text=body&&Text' },
];
for (const v of variants) {
  const p_tab = v.tabs.split(';')[0];
  const header = pdfa(p_tab);
  if (!header) { console.log(v.label + ' -> pdfa null'); continue; }
  const titles = (header.result || []).map(h => pdfh(h, v.tab_text));
  console.log(v.label);
  console.log('  pdfa count=' + header.count + '  tab文本=' + JSON.stringify(titles));
}

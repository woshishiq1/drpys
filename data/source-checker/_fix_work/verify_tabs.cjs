const { spawnSync } = require('child_process');
const CLI = 'C:/Users/Taois/.claude/skills/drpy-node-coder/scripts/cli.js';
const URL = 'http://www.yinghuadm.cn/index.php/vod/detail/id/4425.html';

function pdfa(rule) {
  const r = spawnSync('node', [CLI, 'debug', '--rule', rule, '--mode', 'pdfa', '--url', URL], { encoding: 'utf8', timeout: 40000 });
  const lines = (r.stdout || '').split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) { const s = lines[i].trim(); if (s.startsWith('{')) { try { const j = JSON.parse(s); return j.data; } catch (_) {} } }
  return null;
}

// 模拟 drpy dict 二级：p.tabs.split(';')[0] 当 pdfa 选择器，tab_text 默认 'body&&Text'
const cases = [
  { label: '错误写法 tabs=.xxx&&Text (我之前写的)', tabs: '.play-list-group-switch-item&&Text' },
  { label: '正确写法 tabs=.xxx (模板风格)', tabs: '.play-list-group-switch-item' },
];
const tab_text = 'body&&Text';
for (const c of cases) {
  const p_tab = c.tabs.split(';')[0];
  const header = pdfa(p_tab);
  if (!header) { console.log(c.label + ' -> pdfa 返回 null'); continue; }
  const titles = (header.result || []).map(h => {
    // 用 pdfh 取 tab_text -- 模拟 $pdfh(v, tab_text)
    const r2 = spawnSync('node', [CLI, 'debug', '--rule', tab_text, '--mode', 'pdfh', '--html', h], { encoding: 'utf8', timeout: 20000 });
    const ls = (r2.stdout || '').split('\n').filter(Boolean);
    for (let i = ls.length - 1; i >= 0; i--) { const s = ls[i].trim(); if (s.startsWith('{')) { try { return JSON.parse(s).data.result; } catch (_) {} } }
    return '?';
  });
  console.log(c.label);
  console.log('  -> pdfa count=' + header.count + '  tab 文本=' + JSON.stringify(titles));
}

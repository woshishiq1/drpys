const { spawnSync } = require('child_process');
const CLI = 'C:/Users/Taois/.claude/skills/drpy-node-coder/scripts/cli.js';
const URL = 'http://www.yinghuadm.cn/index.php/vod/detail/id/4425.html';

function pdfa(rule) {
  const r = spawnSync('node', [CLI, 'debug', '--rule', rule, '--mode', 'pdfa', '--url', URL], { encoding: 'utf8', timeout: 40000 });
  const lines = (r.stdout || '').split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) { const s = lines[i].trim(); if (s.startsWith('{')) { try { return JSON.parse(s).data; } catch (_) {} } }
  return null;
}

// 樱花: tabs 候选,看 &&Text 后缀对 pdfa 的影响
const variants = [
  '.play-list-group-switch-item&&Text',   // 我最初的(误以为count=0)
  '.play-list-group-switch-item',           // 修正后
  '.play-list-group-switch-item body',     // 标准
];
for (const rule of variants) {
  const d = pdfa(rule);
  console.log(rule + ' -> count=' + (d ? d.count : 'null'));
}

// 验证 drpy pdfa 对 tabs 中 &&后缀 的真实行为规律
// 规律假设：&& 会被当后代选择器，&& 后是元素选择器(标签/class/id)->pdfa取到元素；&& 后是 Text/Html/属性 ->pdfa取不到
const { spawnSync } = require('child_process');
const CLI = 'C:/Users/Taois/.claude/skills/drpy-node-coder/scripts/cli.js';

function pdfa(url, rule) {
  const r = spawnSync('node', [CLI, 'debug', '--rule', rule, '--mode', 'pdfa', '--url', url], { encoding: 'utf8', timeout: 40000 });
  const lines = (r.stdout || '').split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) { const s = lines[i].trim(); if (s.startsWith('{')) { try { return JSON.parse(s).data.count; } catch (_) {} } }
  return '?';
}

const cases = [
  // [站点, 标签]
  { url: 'http://www.yinghuadm.cn/index.php/vod/detail/id/4425.html', tag: '樱花' },
  { url: 'https://www.23ddw.cc/du/337/337924/', tag: '顶点小说' },
];

// && 后缀分类测试
const suffixes = [
  { s: 'a',       kind: '标签元素',     expect: '>0' },
  { s: 'dt',      kind: '标签元素',     expect: '>0' },
  { s: 'li',      kind: '标签元素',     expect: '>0' },
  { s: 'dd',      kind: '标签元素',     expect: '>0' },
  { s: 'Text',    kind: 'pdfh取文本',   expect: '0' },
  { s: 'Html',    kind: 'pdfh取HTML',   expect: '0' },
  { s: 'href',    kind: 'pdfh取属性',   expect: '0' },
  { s: 'class',   kind: 'class选择器',  expect: '0或>0(视结构)' },
];

for (const c of cases) {
  console.log('==== ' + c.tag + ' ====');
  const base = c.tag === '樱花' ? '.play-list-group-switch-item' : '#list';
  for (const su of suffixes) {
    const rule = base + '&&' + su.s;
    const cnt = pdfa(c.url, rule);
    console.log('  tabs="' + rule + '"  (&&后=' + su.s + '/' + su.kind + ') -> count=' + cnt + '  期望' + su.expect);
  }
}

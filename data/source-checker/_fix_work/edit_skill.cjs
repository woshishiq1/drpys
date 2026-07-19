const fs = require('fs');
const p = 'E:/gitwork/drpy-node-skill/drpy-node-coder/SKILL.md';
let c = fs.readFileSync(p, 'utf8');
const lines = c.split(/\r?\n/);

const multiEngineLine = '| 多引擎源(php/hipy/cat) | 路线 E | `references-multi-engine-sources.md` | `fetch` + curl `?do=py/php/cat&extend=`（**必须带 extend**；hipy 改源需 kill daemon）|';
const hipyDaemonLine = '- **hipy 源改动**：改 `spider/py/*.py` 或 `base/spider.py` 后必须 kill `t4_daemon` 重载（daemon 缓存 module），否则改动不生效；ds/cat 改了直接生效无此问题。见 `references-multi-engine-sources.md`。';

let changed = 0;
// 1. 任务分派表：在"特殊内容"行后插入多引擎行
const idx1 = lines.findIndex(l => l.includes('特殊内容(漫画'));
if (idx1 >= 0 && !lines.some(l => l.includes('多引擎源(php/hipy/cat)'))) {
  lines.splice(idx1 + 1, 0, multiEngineLine);
  changed++;
}
// 2. 强约束：在"DS 加密源"行后插入 hipy daemon 提示
const idx2 = lines.findIndex(l => l.includes('DS 加密源'));
if (idx2 >= 0 && !lines.some(l => l.includes('hipy 源改动'))) {
  lines.splice(idx2 + 1, 0, hipyDaemonLine);
  changed++;
}

if (changed) {
  fs.writeFileSync(p, lines.join('\n'));
  console.log('SKILL.md 已更新，插入 ' + changed + ' 处');
} else {
  console.log('无改动（可能已存在）');
}

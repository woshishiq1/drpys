const { execSync } = require('child_process');
const cli = '"C:/Users/Taois/.claude/skills/drpy-node-coder/scripts/cli.js"';
const root = 'E:/gitwork/drpy-node';
const srcs = ["3Q影视[优]", "卫星影视", "咕咕番", "夜猫影视", "播客[听]", "樱花动漫[优]", "立播[盘]", "虎斑[盘]"];
const results = [];
for (const s of srcs) {
  try {
    const out = execSync(`node ${cli} --root ${root} test "${s}" home`, { timeout: 60000 }).toString();
    const line = out.trim().split('\n').pop();
    const j = JSON.parse(line);
    const d = j.ok ? j.data : {};
    const r = { source: s, success: d.success, item: d.item_count, cls: d.class_count, err: (d.error || '').slice(0, 70) };
    results.push(r);
    console.log(s, '| success=', d.success, '| item=', d.item_count, '| class=', d.class_count, '| err=', (d.error || '').slice(0, 60));
  } catch (e) { results.push({ source: s, success: false, err: 'EXC ' + String(e).slice(0, 60) }); console.log(s, '| EXC', String(e).slice(0, 80)); }
}
const fs = require('fs'), path = require('path');
fs.writeFileSync(path.join(__dirname, 'test_changed.json'), JSON.stringify(results, null, 2));
const ok = results.filter(r => r.success && r.item > 0);
console.log('\n修复成功(item>0):', ok.map(r => r.source).join(', ') || '无');

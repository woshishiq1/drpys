const { execSync } = require('child_process');
const fs = require('fs'), path = require('path');
const all = JSON.parse(fs.readFileSync(path.join(__dirname, 'error_sources.json'), 'utf8'));
const noUrl = all.filter(s => s.file && !(s.homeUrl && /^https?:\/\//.test(s.homeUrl)));
const cli = '"C:/Users/Taois/.claude/skills/drpy-node-coder/scripts/cli.js"';
function resolved(file) {
  try {
    const out = execSync(`node ${cli} --root E:/gitwork/drpy-node resolved "${file}"`, { timeout: 30000 }).toString();
    const j = JSON.parse(out.trim().split('\n').pop());
    return j.ok ? j.data : {};
  } catch (e) { return { err: String(e).slice(0, 80) }; }
}
const res = [];
for (const s of noUrl) {
  const r = resolved(s.file);
  res.push({ name: s.name, key: s.key, file: s.file, lang: s.lang, host: r.host || null, url: r.url || null, err: r.err || null });
  console.log(s.name, '|', s.file, '| host=', r.host || r.err || '-', '| url=', r.url || '-');
}
fs.writeFileSync(path.join(__dirname, 'no_url_resolved.json'), JSON.stringify(res, null, 2));
console.log('\n共', res.length, '个待补源');

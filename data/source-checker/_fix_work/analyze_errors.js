const fs = require('fs');
const path = require('path');
const report = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'report.json'), 'utf8'));
const errs = report.sources.filter(s => s.status === 'error');
console.log('总源数:', report.totalSources, ' 失效:', errs.length);

// message 分布
const msgMap = {};
for (const s of errs) { const m = (s.message || '').slice(0, 80); msgMap[m] = (msgMap[m] || 0) + 1; }
console.log('\n=== message 分布 (top) ===');
for (const [m, c] of Object.entries(msgMap).sort((a, b) => b[1] - a[1])) console.log(String(c).padStart(3), '|', m);

console.log('\n=== 失效源清单 ===');
for (const s of errs) {
  console.log(JSON.stringify({ key: s.key, name: s.name, lang: s.lang, message: s.message }));
}

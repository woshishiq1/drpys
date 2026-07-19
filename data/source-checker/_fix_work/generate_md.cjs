const fs = require('fs'), path = require('path');
const alive = JSON.parse(fs.readFileSync(path.join(__dirname, 'alive_check.json'), 'utf8'));
const all = JSON.parse(fs.readFileSync(path.join(__dirname, 'error_sources.json'), 'utf8'));

// playwright 复检修正
const fix = {
  'https://hifini.net': { alive: true, status: 200, note: 'playwright确认存活' },
  'https://www.kuimh.com': { alive: true, status: 0, note: 'playwright确认存活(重定向)' },
  'http://www.ntdm8.com': { alive: true, status: 200, note: '⚠️域名存活但已被占为诗词站,非原影视站' }
};
for (const r of alive) { if (fix[r.origin]) Object.assign(r, fix[r.origin]); }

const surv = alive.filter(r => r.alive).sort((a, b) => a.name.localeCompare(b.name, 'zh'));
const dead = alive.filter(r => !r.alive);

let md = '# drpy-node 失效源修复候选清单\n\n';
md += '> 生成时间: ' + new Date().toISOString().slice(0, 19) + 'Z\n';
md += '> 数据: report.json 116 个失效源 → 站点存活检测(node 并发 + playwright 复检存疑)\n\n';

md += `## 一、存活可修复站点 (${surv.length} 个)\n\n`;
md += '| # | 站名 | 网址 | lang | 源文件 | 检测状态 | 备注 |\n|---|---|---|---|---|---|---|\n';
surv.forEach((r, i) => { md += `| ${i + 1} | ${r.name} | ${r.origin} | ${r.lang} | ${r.file || '-'} | ${r.status || '-'} | ${r.note || ''} |\n`; });

md += `\n## 二、站点已死亡/不可达 (${dead.length} 个)\n\n`;
md += '| 站名 | 网址 | 原因 |\n|---|---|---|\n';
dead.forEach(r => { md += `| ${r.name} | ${r.origin || '-'} | ${r.error || r.status || '-'} |\n`; });

const api = all.filter(s => !s.file);
md += `\n## 三、纯 API / 模板派生源(无可修改独立 JS,标记放弃,${api.length} 个)\n\n`;
md += 'key 带 `hipy_py_` / `php_` / `catvod_` / `_Appget` 前缀,属 hipy 服务器、PHP 采集、catvod、Appget 模板派生的虚拟源,本地无独立源文件,无法通过改 JS 修复。\n\n';
const grp = {}; for (const s of api) (grp[s.lang] = grp[s.lang] || []).push(s.name);
for (const [l, arr] of Object.entries(grp)) { md += `- **${l}** (${arr.length}): ${arr.join('、')}\n`; }

const noUrl = all.filter(s => s.file && !(s.homeUrl && /^https?:\/\//.test(s.homeUrl)));
md += `\n## 四、有源文件但未提取到完整网址(待 cli resolved 补提取,${noUrl.length} 个)\n\n`;
noUrl.forEach(s => { md += `- ${s.name} | ${s.file} | url=${s.url || '-'} host=${s.host || '-'}\n`; });

md += '\n---\n**下一步**: 对第一部分 ' + surv.length + ' 个存活站点逐个用 playwright + drpy-node-coder CLI 尝试修复。\n';
fs.writeFileSync(path.join(__dirname, '..', '修复候选清单.md'), md);
console.log('已生成 修复候选清单.md');
console.log('存活', surv.length, '死亡', dead.length, '放弃API', api.length, '待补网址', noUrl.length);

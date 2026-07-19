const fs = require('fs');
const path = require('path');
const root = 'E:/gitwork/drpy-node';
const report = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'report.json'), 'utf8'));
const errs = report.sources.filter(s => s.status === 'error');

// 建立文件索引：文件名去 .js + 去上标/修饰符/空白
const dirs = ['spider/js', 'spider/catvod'];
const index = {};
function normName(s) {
  return s.replace(/\.js$/i, '').replace(/[ᴀ-᷿⁰-₟ʰ-˿꜀-ꜟ\s]/g, '');
}
for (const d of dirs) {
  const p = path.join(root, d);
  if (!fs.existsSync(p)) continue;
  for (const f of fs.readdirSync(p)) {
    if (!f.endsWith('.js')) continue;
    const n = normName(f);
    if (!index[n]) index[n] = [];
    index[n].push({ file: f, rel: d + '/' + f, dir: d });
  }
}
function pickByLang(cands, lang) {
  if (lang === 'cat') { const c = cands.find(x => x.dir.includes('catvod')); if (c) return c; }
  const c = cands.find(x => x.dir.includes('/js'));
  return c || cands[0];
}
function matchFile(key, lang) {
  const base = key.replace(/^drpyS_/, '').replace(/\([^)]*\)\s*$/, '');
  const n = normName(base);
  if (index[n]) return pickByLang(index[n], lang);
  return null;
}
function extract(content) {
  const host = content.match(/\bhost\s*:\s*['"`]([^'"`]+)['"`]/);
  const url = content.match(/\burl\s*:\s*['"`]([^'"`]+)['"`]/);
  let homeUrl = null;
  if (url && /^https?:\/\//.test(url[1])) homeUrl = url[1];
  else if (host && url) homeUrl = host[1].replace(/\/+$/, '') + (url[1].startsWith('/') ? url[1] : '/' + url[1]);
  else if (host) homeUrl = host[1];
  else if (url) homeUrl = url[1];
  return { host: host ? host[1] : null, url: url ? url[1] : null, homeUrl };
}
const out = [];
for (const s of errs) {
  const f = matchFile(s.key, s.lang);
  let info = { host: null, url: null, homeUrl: null };
  if (f) { try { info = extract(fs.readFileSync(path.join(root, f.rel), 'utf8')); } catch (e) {} }
  out.push({ key: s.key, name: s.name, lang: s.lang, message: s.message, file: f ? f.rel : null, dir: f ? f.dir : null, host: info.host, url: info.url, homeUrl: info.homeUrl });
}
fs.writeFileSync(path.join(__dirname, 'error_sources.json'), JSON.stringify(out, null, 2));

const found = out.filter(o => o.file).length;
const httpUrl = out.filter(o => o.homeUrl && /^https?:\/\//.test(o.homeUrl)).length;
console.log('失效:', out.length, ' 文件找到:', found, ' 完整http网址:', httpUrl);
const langMap = {}; for (const o of out) langMap[o.lang] = (langMap[o.lang] || 0) + 1;
console.log('lang 分布:', JSON.stringify(langMap));
const fl = {}; for (const o of out) if (o.file) fl[o.lang] = (fl[o.lang] || 0) + 1;
console.log('找到文件按lang:', JSON.stringify(fl));
const missing = out.filter(o => !o.file);
console.log('\n=== 仍未找到文件(' + missing.length + ') ===');
missing.forEach(o => console.log(o.key, '|', o.lang));
console.log('\n=== 有完整http网址(前20) ===');
out.filter(o => o.homeUrl && /^https?:\/\//.test(o.homeUrl)).slice(0, 20).forEach(o => console.log(o.name, '|', o.lang, '|', o.homeUrl));

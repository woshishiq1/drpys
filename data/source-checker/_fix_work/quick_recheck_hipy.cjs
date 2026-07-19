// 重测 hipy 仍失败的源，验证 verify=False 修复效果
const http = require('http');
const fs = require('fs');
const prev = JSON.parse(fs.readFileSync(__dirname + '/recheck_with_ext.json', 'utf8'));
const report = require('../report.json');
const apiUrl = {}; for (const s of report.sources) apiUrl[s.key] = s.api;
const sitesCfg = JSON.parse(fs.readFileSync(__dirname + '/sites.json', 'utf8'));
const sites = Array.isArray(sitesCfg) ? sitesCfg : sitesCfg.sites;
const extMap = {}; for (const s of sites) extMap[s.key] = s.ext;
// hipy 仍失败的（含 ext 空和有 ext）
const targets = prev.filter(r => r.lang === 'hipy' && !r.classOk);

function test(url) {
  return new Promise(res => {
    const u = new URL(url);
    const opts = { hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'GET', timeout: 25000 };
    const req = http.request(opts, r => {
      let b = ''; r.on('data', c => b += c); r.on('end', () => {
        let parsed; try { parsed = JSON.parse(b); } catch (e) {}
        let classOk = parsed && Array.isArray(parsed.class) && parsed.class.length > 0;
        res({ code: r.statusCode, classOk, body: b.slice(0, 160) });
      });
    });
    req.on('error', e => res({ err: e.message }));
    req.on('timeout', () => { req.destroy(); res({ err: 'timeout' }); });
    req.end();
  });
}

(async () => {
  const pool = [...targets];
  const CONC = 6;
  const out = [];
  async function worker() {
    while (pool.length) {
      const t = pool.shift();
      const ext = extMap[t.key];
      let url = apiUrl[t.key];
      if (!url) { out.push({ name: t.name, ext: '?', err: 'no_api' }); continue; }
      if (ext && ext !== '') {
        const extStr = typeof ext === 'object' ? JSON.stringify(ext) : String(ext);
        url = url + '&extend=' + encodeURIComponent(extStr);
      }
      const r = await test(url);
      out.push({ name: t.name, ext: ext && ext !== '' ? '有' : '空', ...r });
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  const ok = out.filter(r => r.classOk);
  const bad = out.filter(r => !r.classOk);
  console.log(`=== hipy 重测: ${out.length}个, 恢复${ok.length}, 仍失败${bad.length} ===`);
  console.log('\n--- 恢复的 ---');
  for (const r of ok) console.log('✅', r.name, '(ext' + r.ext + ')');
  console.log('\n--- 仍失败 ---');
  for (const r of bad) console.log('❌', r.name, '(ext' + r.ext + ') |', r.code || r.err, '|', (r.body || '').slice(0, 90));
})();

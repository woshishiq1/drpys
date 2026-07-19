// 带 extend 参数重测失效源，对比裸测与带 ext 的真实状态
const http = require('http');
const fs = require('fs');
const report = require('../report.json');
const sitesRaw = fs.readFileSync(__dirname + '/sites.json', 'utf8');
const sitesCfg = JSON.parse(sitesRaw);
const sites = Array.isArray(sitesCfg) ? sitesCfg : (sitesCfg.sites || []);

// 建 key->ext 映射
const extMap = {};
for (const s of sites) { extMap[s.key] = s.ext; }

const fail = report.sources.filter(s => s.status !== 'success');

function test(url) {
  return new Promise(res => {
    const u = new URL(url);
    const opts = { hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'GET', timeout: 20000 };
    const req = http.request(opts, r => {
      let b = ''; r.on('data', c => b += c); r.on('end', () => {
        let parsed; try { parsed = JSON.parse(b); } catch (e) {}
        let classOk = parsed && Array.isArray(parsed.class) && parsed.class.length > 0;
        let isErr = b.includes('"error"') || r.statusCode >= 500;
        res({ code: r.statusCode, classOk, isErr, body: b.slice(0, 120) });
      });
    });
    req.on('error', e => res({ err: e.message }));
    req.on('timeout', () => { req.destroy(); res({ err: 'timeout' }); });
    req.end();
  });
}

(async () => {
  const pool = [];
  for (const s of fail) {
    const ext = extMap[s.key];
    pool.push({ s, ext });
  }
  const CONC = 6;
  const results = [];
  async function worker() {
    while (pool.length) {
      const { s, ext } = pool.shift();
      let withExt;
      if (ext && ext !== '') {
        const extStr = typeof ext === 'object' ? JSON.stringify(ext) : String(ext);
        const url = s.api + '&extend=' + encodeURIComponent(extStr);
        withExt = await test(url);
      } else {
        withExt = { noExt: true };
      }
      results.push({ name: s.name, lang: s.lang, key: s.key, ext: ext ? (typeof ext === 'object' ? JSON.stringify(ext) : String(ext)).slice(0, 60) : '(空)', ...withExt });
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));

  // 汇总：按 lang
  console.log('=== 带 extend 重测汇总 ===');
  for (const lang of ['ds', 'php', 'hipy', 'cat']) {
    const arr = results.filter(r => r.lang === lang);
    const hasExt = arr.filter(r => !r.noExt);
    const recovered = hasExt.filter(r => r.classOk);
    const stillBad = hasExt.filter(r => !r.classOk);
    const noExt = arr.filter(r => r.noExt);
    console.log(`[${lang}] 共${arr.length} | 有ext${hasExt.length}(恢复${recovered.length},仍坏${stillBad.length}) | ext空${noExt.length}`);
  }
  console.log('\n=== 带 ext 仍失败的源(真坏或ext失效) ===');
  for (const r of results.filter(r => !r.noExt && !r.classOk)) {
    console.log(`[${r.lang}] ${r.name} | ext=${r.ext} | ${r.code || r.err} | ${(r.body || '').slice(0, 90)}`);
  }
  console.log('\n=== ext 为空的源(需查源是否写死host) ===');
  for (const r of results.filter(r => r.noExt)) {
    console.log(`[${r.lang}] ${r.name} | ${r.key}`);
  }
  fs.writeFileSync(__dirname + '/recheck_with_ext.json', JSON.stringify(results, null, 2));
  console.log('\n详细结果 -> recheck_with_ext.json');
})();

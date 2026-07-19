// 对 report.json 所有失效源重测 home 接口，分类真实状态
const http = require('http');
const fs = require('fs');
const d = require('../report.json');
const fail = d.sources.filter(s => s.status !== 'success');

function test(s) {
  return new Promise(res => {
    const url = new URL(s.api);
    const opts = { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: 'GET', timeout: 15000 };
    const req = http.request(opts, r => {
      let b = ''; r.on('data', c => b += c); r.on('end', () => {
        let parsed; try { parsed = JSON.parse(b); } catch (e) {}
        let classOk = false, listOk = false;
        if (parsed) {
          classOk = Array.isArray(parsed.class) && parsed.class.length > 0;
          listOk = Array.isArray(parsed.list) && parsed.list.length > 0;
        }
        res({ name: s.name, lang: s.lang, key: s.key, api: s.api, code: r.statusCode, classOk, listOk, body: b.slice(0, 180) });
      });
    });
    req.on('error', e => res({ name: s.name, lang: s.lang, key: s.key, api: s.api, err: e.message }));
    req.on('timeout', () => { req.destroy(); res({ name: s.name, lang: s.lang, key: s.key, api: s.api, err: 'timeout' }); });
    req.end();
  });
}

(async () => {
  const pool = [...fail];
  const CONC = 8;
  async function worker() { while (pool.length) { const s = pool.shift(); results.push(await test(s)); } }
  const results = [];
  await Promise.all(Array.from({ length: CONC }, worker));

  console.log('=== 各类型真实状态汇总 ===');
  for (const lang of ['ds', 'php', 'hipy', 'cat', 'unknown']) {
    const arr = results.filter(r => r.lang === lang);
    if (!arr.length) continue;
    const ok = arr.filter(r => r.classOk).length;
    const emptyCls = arr.filter(r => r.code === 200 && !r.classOk && !r.err).length;
    const err = arr.filter(r => r.err || r.code >= 400).length;
    console.log(`[${lang}] 共${arr.length} | class正常${ok} | class空${emptyCls} | 4xx/5xx/异常${err}`);
  }

  console.log('\n=== 需要处理的源(class空或报错) ===');
  for (const r of results) {
    if (!r.classOk) {
      console.log(`[${r.lang}] ${r.name} | ${r.code || r.err} | ${(r.body || '').slice(0, 100)}`);
    }
  }
  fs.writeFileSync(__dirname + '/recheck_all.json', JSON.stringify(results, null, 2));
  console.log('\n详细结果已存 recheck_all.json');
})();

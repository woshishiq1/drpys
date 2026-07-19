const fs = require('fs'), path = require('path'), https = require('https'), http = require('http');
const srcs = JSON.parse(fs.readFileSync(path.join(__dirname, 'error_sources.json'), 'utf8'));
const cand = srcs.filter(s => s.homeUrl && /^https?:\/\//.test(s.homeUrl));
function origin(u) { try { return new URL(u).origin; } catch (e) { return null; } }
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
function check(url) {
  return new Promise(res => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*' }, timeout: 9000, rejectUnauthorized: false }, r => {
      res({ ok: r.statusCode < 500, status: r.statusCode, url });
    });
    req.on('error', e => res({ ok: false, status: 0, error: e.code || e.message, url }));
    req.on('timeout', () => { req.destroy(); res({ ok: false, status: 0, error: 'timeout', url }); });
  });
}
(async () => {
  const q = cand.map(s => ({ s, home: origin(s.homeUrl) }));
  const results = []; let idx = 0;
  async function worker() {
    while (idx < q.length) {
      const item = q[idx++];
      if (!item.home) { results.push({ ...item.s, origin: null, alive: false, reason: 'no-origin' }); continue; }
      const r = await check(item.home);
      results.push({ ...item.s, origin: item.home, alive: r.ok, status: r.status, error: r.error || null });
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  fs.writeFileSync(path.join(__dirname, 'alive_check.json'), JSON.stringify(results, null, 2));
  const alive = results.filter(r => r.alive);
  console.log('候选', cand.length, ' 存活', alive.length, ' 死亡', results.length - alive.length);
  console.log('\n=== 存活清单 ===');
  alive.forEach(r => console.log(r.name, '|', r.origin, '|', r.status));
  console.log('\n=== 死亡清单 ===');
  results.filter(r => !r.alive).forEach(r => console.log(r.name, '|', r.origin, '|', r.error || r.status));
})();

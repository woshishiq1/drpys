const fs = require('fs'), path = require('path'), https = require('https'), http = require('http');
const arr = JSON.parse(fs.readFileSync(path.join(__dirname, 'no_url_resolved.json'), 'utf8'));
function origin(u) { try { return new URL(u).origin; } catch (e) { return null; } }
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
function check(url) {
  return new Promise(res => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': UA }, timeout: 9000, rejectUnauthorized: false }, r => res({ ok: r.statusCode < 500, status: r.statusCode }));
    req.on('error', e => res({ ok: false, status: 0, error: e.code || e.message }));
    req.on('timeout', () => { req.destroy(); res({ ok: false, status: 0, error: 'timeout' }); });
  });
}
(async () => {
  const out = [];
  for (const s of arr) {
    const h = origin(s.host);
    if (!h) { out.push({ ...s, origin: null, alive: false }); console.log(s.name, '| no-origin'); continue; }
    const r = await check(h);
    out.push({ ...s, origin: h, alive: r.ok, status: r.status, error: r.error });
    console.log(s.name, '|', h, '|', r.ok ? 'ALIVE' : 'DEAD', '(' + (r.error || r.status || '') + ')');
  }
  fs.writeFileSync(path.join(__dirname, 'no_url_alive.json'), JSON.stringify(out, null, 2));
  const al = out.filter(x => x.alive);
  console.log('\n存活', al.length + '/' + out.length);
})();

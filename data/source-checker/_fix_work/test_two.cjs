const http = require('http');
const fs = require('fs');
const report = require('../report.json');
const sitesCfg = JSON.parse(fs.readFileSync(__dirname + '/sites.json', 'utf8'));
const sites = Array.isArray(sitesCfg) ? sitesCfg : sitesCfg.sites;
const extMap = {}; for (const s of sites) extMap[s.key] = s.ext;

function test(key) {
  return new Promise(res => {
    const s = report.sources.find(x => x.key === key);
    if (!s) { res('no source'); return; }
    let url = s.api;
    const ext = extMap[key];
    if (ext && ext !== '') {
      const e = typeof ext === 'object' ? JSON.stringify(ext) : String(ext);
      url += '&extend=' + encodeURIComponent(e);
    }
    const req = http.get(url, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => res(b)); });
    req.on('error', e => res('ERR:' + e.message));
    req.setTimeout(30000, () => { req.destroy(); res('timeout'); });
  });
}

(async () => {
  for (const key of ['hipy_py_五八[AG¹]', 'hipy_py_剧透社[盘]', 'hipy_py_玲珑[AG¹]', 'hipy_py_OMOfun[AG¹]']) {
    const r = await test(key);
    console.log('=== ' + key + ' ===');
    console.log(r.slice(0, 450));
    console.log('');
  }
})();

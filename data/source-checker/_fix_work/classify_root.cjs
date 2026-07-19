// 用引擎日志快速分类 10 个未修源：是"一级返回占位(no_data)"还是"二级问题"
const { spawnSync } = require('child_process');
const CLI = 'C:/Users/Taois/.claude/skills/drpy-node-coder/scripts/cli.js';
const SOURCES = ['立播[盘]','夜猫影视','虎斑[盘]','耐看点播[优]','软鸭短剧[短]','无广告TV','顶点小说[书]','卫星影视','酷爱漫画[画]','木偶[盘]'];
for (const name of SOURCES) {
  const r = spawnSync('node', [CLI, 'evaluate', name], { encoding: 'utf8', timeout: 80000 });
  const err = r.stderr || '';
  const orId = (err.match(/orId:(\S+)/) || [])[1] || '-';
  const detailFail = /获取详情页源码失败/.test(err);
  const catEmpty = /分类列表为空/.test(err);
  // 看 category first_item 的 vod_id 是否 no_data
  const r2 = spawnSync('node', [CLI, 'test', name, 'category', '--class-id', '1'], { encoding: 'utf8', timeout: 40000 });
  const ls = (r2.stdout || '').split('\n').filter(Boolean);
  let j2 = null;
  for (let i = ls.length - 1; i >= 0; i--) { const s = ls[i].trim(); if (s.startsWith('{')) { try { j2 = JSON.parse(s); break; } catch (_) {} } }
  let firstVodId = '?', firstName = '?', catCount = '?';
  if (j2 && j2.ok) {
    catCount = j2.data.item_count;
    const it = j2.data.first_item;
    const o = typeof it === 'string' ? JSON.parse(it) : it;
    firstVodId = o.vod_id || o.id || o.url;
    firstName = (o.vod_name || o.title || '').slice(0, 16);
  }
  const catBad = String(firstVodId) === 'no_data' || /无数据|防无限/.test(firstName);
  console.log(name.padEnd(12) + ' cat1_count=' + catCount + ' firstVodId=' + String(firstVodId).slice(0, 30) + ' name=' + firstName + (catBad ? '  <- 一级返回占位' : ''));
}

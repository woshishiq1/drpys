/**
 * 探测详情页真实播放线路 DOM 结构，供调二级选择器参考。
 * 用法: node probe_detail.cjs <详情页URL>
 */
const { spawnSync } = require('child_process');
const CLI = 'C:/Users/Taois/.claude/skills/drpy-node-coder/scripts/cli.js';
const url = process.argv[2];
if (!url) { console.error('用法: node probe_detail.cjs <url>'); process.exit(1); }

const r = spawnSync('node', [CLI, 'fetch', url], { encoding: 'utf8', timeout: 40000, maxBuffer: 30 * 1024 * 1024 });
const lines = (r.stdout || '').split('\n').filter(Boolean);
let j = null;
for (let i = lines.length - 1; i >= 0; i--) { const s = lines[i].trim(); if (s.startsWith('{')) { try { j = JSON.parse(s); break; } catch (_) {} } }
if (!j || !j.ok) { console.error('fetch 失败:', j ? j.error : r.stderr.slice(-300)); process.exit(1); }
const d = j.data;
let html = '';
if (typeof d === 'string') html = d;
else if (d && typeof d === 'object') html = d.data || d.content || d.html || '';
if (typeof html !== 'string') html = String(html || '');
console.log('status:', d && d.status, ' html 长度:', html.length);
if (html.length < 200) { console.log('HTML 过短，可能反爬/错误页:\n', html); process.exit(0); }

// 1. 含 play/tab/list 的 class
const classMatches = [...html.matchAll(/class=["']([^"']*(?:play|playlist|tab|list|module)[^"']*)["']/gi)].map(m => m[1]);
const uniq = [...new Set(classMatches)].filter(c => /play|playlist/i.test(c) || /tab/i.test(c));
console.log('=== 含 play/playlist/tab 的 class ===');
uniq.slice(0, 30).forEach(c => console.log('  .' + c));

// 2. /play/ 或播放链接
const playLinks = [...html.matchAll(/href=["']([^"']*(?:\/play\/|\/vodplay\/|m3u8)[^"']*)["']/gi)].map(m => m[1]);
console.log('\n=== 播放链接数: ' + playLinks.length + ' ===');
[...new Set(playLinks)].slice(0, 5).forEach(l => console.log('  ' + l.slice(0, 120)));

// 3. 线路块片段
const blockM = html.match(/<(?:div|ul|nav)[^>]*class=["'][^"']*(?:playlist|play-list|play_list|playtab|play-tab|module-play)[^"']*["'][\s\S]{0,800}/i);
if (blockM) console.log('\n=== 线路块片段 ===\n' + blockM[0].slice(0, 800));
else console.log('\n=== 未找到 playlist 块,试 module-play ===');

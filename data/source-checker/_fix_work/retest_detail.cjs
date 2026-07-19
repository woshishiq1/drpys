/**
 * 用增强后的 evaluate 重测 11 个 valid=false 源，提取 detail_preview.play_url_diagnosis 用于分组。
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLI = 'C:/Users/Taois/.claude/skills/drpy-node-coder/scripts/cli.js';
const OUT = 'E:/gitwork/drpy-node/data/source-checker/_fix_work';

const SOURCES = ['立播[盘]','樱花动漫[优]','卫星影视','夜猫影视','虎斑[盘]','耐看点播[优]','软鸭短剧[短]','无广告TV','酷爱漫画[画]','顶点小说[书]','木偶[盘]'];

function run(name){
  const t0 = Date.now();
  const r = spawnSync('node', [CLI, 'evaluate', name], { encoding:'utf8', timeout:80000, maxBuffer:20*1024*1024 });
  const lines = (r.stdout||'').split('\n').filter(Boolean);
  let parsed = null;
  for (let i=lines.length-1;i>=0;i--){ const s=lines[i].trim(); if(s.startsWith('{')){ try{parsed=JSON.parse(s);break;}catch(_){} } }
  return { name, duration:Date.now()-t0, parsed };
}

const results = [];
for (const name of SOURCES){
  process.stdout.write('测试 '+name+' ... ');
  const res = run(name);
  const d = res.parsed && res.parsed.data;
  const e = d && d.evaluation;
  const ifs = d && d.interfaces;
  const det = ifs && ifs.detail;
  const dp = det && det.detail_preview;
  const diag = dp && dp.play_url_diagnosis;
  const playErr = ifs && ifs.play && ifs.play.error;
  console.log('score='+(e?e.score:'-')+' detail:'+(det?(det.success?'✓':'✗'):'?')+' play:'+(ifs&&ifs.play?(ifs.play.success?'✓':'✗'):'?')+(diag?' [diag:empty]':'')+' ('+res.duration+'ms)');
  results.push({
    name,
    score: e?e.score:null,
    detail_success: det?det.success:null,
    detail_preview: dp || null,
    play_success: ifs&&ifs.play?ifs.play.success:null,
    play_error: playErr || null,
  });
}

fs.writeFileSync(path.join(OUT,'retest_detail.json'), JSON.stringify({time:new Date().toISOString(),results},null,2), 'utf8');
console.log('\n写出 retest_detail.json');

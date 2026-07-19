/**
 * 纯 drpy-node-coder skill CLI 完整测试（不依赖 MCP）
 * 对"修复候选清单"中已修复的 15 个源，逐个跑 cli evaluate（home->category->detail->search->play 全链路）。
 * 串行执行，每源进程级超时 80s 兜底。
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLI = 'C:/Users/Taois/.claude/skills/drpy-node-coder/scripts/cli.js';
const OUT_DIR = 'E:/gitwork/drpy-node/data/source-checker/_fix_work';

// 已修复源清单（文件名，不含 .js），按报告分组
const SOURCES = [
  { name: '樱花动漫[优]', group: '已成功修复' },
  { name: '卫星影视', group: '已成功修复' },
  { name: '立播[盘]', group: '已成功修复' },
  { name: '播客[听]', group: '已成功修复' },
  { name: '3Q影视[优]', group: '已成功修复' },
  { name: '咕咕番', group: '已成功修复' },
  { name: '夜猫影视', group: '已成功修复' },
  { name: '虎斑[盘]', group: '部分可用' },
  { name: '耐看点播[优]', group: '部分可用' },
  { name: '软鸭短剧[短]', group: '部分可用' },
  { name: '无广告TV', group: '部分可用' },
  { name: '酷爱漫画[画]', group: '部分可用' },
  { name: '顶点小说[书]', group: '部分可用' },
  { name: '木偶[盘]', group: '本就可用' },
  { name: '王子TV', group: '本就可用' },
];

// 针对非影视类源换更贴切的搜索关键词（默认 evaluate 用"斗罗大陆"）
const KEYWORD = {
  '酷爱漫画[画]': '海贼',
  '顶点小说[书]': '修仙',
  '软鸭短剧[短]': '离婚',
  '播客[听]': '故事',
};

function runOne(name) {
  const args = [CLI, 'evaluate', name];
  if (KEYWORD[name]) args.push('--keyword', KEYWORD[name]);
  const t0 = Date.now();
  const r = spawnSync('node', args, {
    encoding: 'utf8',
    timeout: 80000,
    maxBuffer: 20 * 1024 * 1024,
  });
  const dt = Date.now() - t0;
  const stdout = (r.stdout || '').trim();
  const stderr = (r.stderr || '').trim();
  // cli 统一输出单行 JSON {ok,...}。取最后一个 JSON 行。
  const lines = stdout.split('\n').filter(Boolean);
  let parsed = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    const s = lines[i].trim();
    if (s.startsWith('{')) { try { parsed = JSON.parse(s); break; } catch (_) {} }
  }
  let status = 'ok';
  let error = null;
  let data = null;
  if (r.status !== 0 && r.status !== null) {
    status = 'exit_nonzero';
  }
  if (r.error) {
    status = 'process_error';
    error = r.error.message || String(r.error);
  } else if (parsed && parsed.ok === false) {
    status = 'cli_fail';
    error = parsed.error || parsed.message || '(no error msg)';
  } else if (parsed && parsed.ok === true) {
    data = parsed.data;
  } else {
    status = 'parse_fail';
    error = 'stdout 末行非 JSON；stderr 末尾: ' + (stderr ? stderr.split('\n').slice(-3).join(' | ') : '(空)');
  }
  return { name, status, error, data, duration_ms: dt, stderr_tail: stderr ? stderr.split('\n').slice(-2).join(' | ') : '' };
}

const results = [];
const writeProgress = () => {
  const out = {
    test_time: new Date().toISOString(),
    tool: 'drpy-node-coder skill cli.js evaluate (无 MCP)',
    keyword_map: KEYWORD,
    done: results.length,
    total: SOURCES.length,
    results,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'full_test_result.json'), JSON.stringify(out, null, 2), 'utf8');
};

for (const s of SOURCES) {
  process.stdout.write(`[${new Date().toISOString()}] 测试: ${s.name} ... `);
  const res = runOne(s.name);
  res.group = s.group;
  results.push(res);
  const score = res.data && res.data.evaluation ? res.data.evaluation.score : '-';
  const valid = res.data && res.data.evaluation ? res.data.evaluation.valid : false;
  console.log(`score=${score} valid=${valid} (${res.duration_ms}ms) [${res.status}]`);
  writeProgress(); // 增量落盘
}

console.log('\n已写出: ' + path.join(OUT_DIR, 'full_test_result.json'));

// 纠正 skill reference 两处"report.json 裸测"错误说法（按行号替换，规避子串匹配问题）
const fs = require("fs");
const f = "E:/gitwork/drpy-node-skill/drpy-node-coder/references/references-multi-engine-sources.md";
const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);

const new41 = '> 注：`apps/source-checker/index.html`（生成 report.json 的程序）实际**是带 extend 的**--它从 sites 配置的 `ext` 字段取（hipy/php 模板源 ext 由 config.js 从 `config/map.txt` SitesMap 填充）。report.json 里误判的根因是：① 快照过期（修复引擎后没重测）；② 引擎层 SSL/代理 bug；③ source-checker 自身曾有的 bug（fullCheck detail 用固定 ids=1、fetch timeout 不生效、历史报告丢 ext 等，2026-07-18 已修）。**自己复测时仍必须带 extend**，否则裸测模板源报 KeyError host。';
const new142 = '- `report.json` 是快照，状态会变；source-checker 本身带 extend，但旧快照 + 引擎 SSL/代理 bug 曾致失效数虚高（2026-07-18 已修引擎 + source-checker）。修源前建议重新跑一遍检测拿最新清单。';

// 用唯一标记确认行号正确
if (!lines[40].includes('生成脚本若用裸')) { console.log("❌ line41 不匹配预期:", lines[40].slice(0, 40)); process.exit(1); }
if (!lines[141].includes('且若裸测不带 extend')) { console.log("❌ line142 不匹配预期:", lines[141].slice(0, 40)); process.exit(1); }

const before41 = lines[40].slice(0, 30);
const before142 = lines[141].slice(0, 30);
lines[40] = new41;
lines[141] = new142;
fs.writeFileSync(f, lines.join("\r\n"), "utf8");
console.log("✅ skill reference 两处已纠正");
console.log("  line41 旧:", before41, "...");
console.log("  line142 旧:", before142, "...");

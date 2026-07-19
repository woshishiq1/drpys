## 背景

在用本 skill 的 CLI 批量修复 drpy-node 失效源（report.json 中 116 个失效源）的过程中，发现 `test`/`evaluate` 命令在诊断「二级详情有数据但播放线路为空」这类问题时存在盲区，会导致根因误判。本 PR 修复该缺陷并增强诊断能力。

## 修复的缺陷

### evaluate 一级占位误判二级（核心修复）

**此前行为**：当一级（category）解析失败返回占位项（`vod_id="no_data"`、`vod_name="无数据,防无限请求"`）时，evaluate 会把 `no_data` 当作 vod_id 传给 detail，detail 失败后**错误归因为「二级/播放问题」**。

**实测影响**：无广告TV、虎斑、耐看、软鸭、酷爱漫画 5 个源被误归类为「二级选择器没命中」，实际根因在一级。

**修复**：evaluate 检测到 category 首项为占位时，标注 `first_item_is_placeholder=true`、改判 category 失败并阻断 detail 串联，错误信息明确指向「一级选择器未命中站点列表 DOM」。

## 诊断增强

- **`play_url_diagnosis`**：detail 有数据但 `vod_play_url` 为空时，按 item 字段组合分三类根因：
  - `likely_missing_detailUrl`（返回列表项，无播放线路字段）
  - `likely_tabs_or_lists_selector`（dict 已执行但线路空）
  - `unknown`
- **智能默认搜索词**：evaluate 按源名后缀选默认搜索词（漫画->海贼王 / 小说->修仙 / 短剧->离婚 / 音频->故事），不再对非影视源一律搜「斗罗大陆」必然落空。`--keyword ''` 仍可显式跳过搜索。
- **play 跳过原因区分**：区分「详情未通过 / 详情空 / 详情无线路」三种，而非笼统「跳过」。

## 文档

- `references-detail-dict-and-multiep.md` 新增第 4 节「tabs 的 && 后必须是元素选择器」：含 drpy 源码引用（`libs/drpysParser.js` `commonDetailListParse`）、`&&` 在 pdfa 里的后代选择器语义、两种正确写法、樱花+顶点双实测样本。
- `SKILL.md` evaluate 丢分映射、`cli-commands.md` test/evaluate 说明同步更新。

## 验证

- `node --check` 语法通过
- 立播/无广告TV 等源实测诊断输出正确（root_cause 分类符合预期）
- 樱花动漫[优] 用 dict 正确写法修复后，detail count=60、vod_play_from 三段线路、play 通过

## 改动文件

| 文件 | 改动 |
|---|---|
| scripts/commands/test.js | +100 诊断逻辑 |
| references/references-detail-dict-and-multiep.md | +44 第4节 |
| references/cli-commands.md | test/evaluate 说明 |
| SKILL.md | evaluate 丢分映射 |

🤖 Generated with [Claude Code](https://claude.com/claude-code)

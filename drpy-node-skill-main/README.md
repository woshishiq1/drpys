# drpy-node Skills README

> 说明：这份文档用于解释当前 4 个 drpy-node skill 与 `drpy-node-mcp` 的关系、职责边界、调度方式，以及为什么 skill 不会替代 mcp。

---

## 一、整体结构

当前这套 drpy-node 能力由两层组成：

### 1. Skill 层（流程与策略）
负责：
- 判断任务类型
- 决定先做什么、后做什么
- 提供判断标准
- 约束 AI 的工作流

当前已有 4 个 skill：
- `drpy-node-source-workflow`
- `drpy-node-play-debug`
- `drpy-node-source-create`
- `drpy-node-repo-upload`

### 2. MCP 层（执行与工具）
负责：
- 读文件
- 改源码
- 测接口
- 抓网页
- 校验语法
- 上传仓库

主要由 `drpy-node-mcp` 提供能力。

---

## 二、核心关系

一句话理解：

> **Skill 是脑子，MCP 是手脚。**

也可以理解为：
- skill = SOP / 工作流 / 决策逻辑
- mcp = 工具箱 / 执行动作

### Skill 不能替代 MCP
因为 skill 本身不直接提供：
- 文件读写能力
- 网站抓取能力
- 接口测试能力
- 仓库上传能力

### MCP 也不能替代 Skill
因为 mcp 只提供工具，不负责：
- 先评估还是先上传
- 播放是不是假通过
- 什么时候该分流到播放专项
- 标签要不要从简

所以二者关系是：

> **Skill 指导 AI 如何正确使用 MCP。**

---

## 三、4 个 Skill 的职责分工

---

### 1. `drpy-node-source-workflow`

#### 定位
总控工作流 skill。

#### 负责
- 接住用户的 drpy-node 任务
- 先做基线评估
- 判断问题在哪一层
- 决定是否分流到子 skill
- 汇总结果并决定是否进入上传阶段

#### 不负责
- 不深入承担所有 lazy 修复细节
- 不把仓库上传细节全部自己做完
- 不把建源细节全部自己展开

#### 它更像
> 总调度器 / 分诊台 / 主入口

---

### 2. `drpy-node-play-debug`

#### 定位
播放专项 skill。

#### 负责
- lazy 修复
- parse:0 / parse:1 判断
- 直链识别
- `play.html` 误判排查
- 站外线路排查
- 假播放判断

#### 不负责
- 新建源
- 仓库上传
- 全局任务调度

#### 它更像
> 播放链路专家

---

### 3. `drpy-node-source-create`

#### 定位
新建源专项 skill。

#### 负责
- 新建 DS 源
- 模板判断
- 站点分析
- 分类 / 一级 / 搜索 / 二级 / lazy 的分阶段创建
- 产出最小可用新源

#### 不负责
- 播放专项深挖
- 仓库上传
- 总流程调度

#### 它更像
> 建源工程师

---

### 4. `drpy-node-repo-upload`

#### 定位
仓库上传专项 skill。

#### 负责
- 上传仓库
- 替换上传
- 标签修正
- 上传前检查
- 上传后结果回报

#### 不负责
- 深度修源
- 播放专项排查
- 新建源

#### 它更像
> 仓库管理员 / 发布流程守门员

---

## 四、调度关系图

```text
用户请求
   ↓
AI 判断任务类型
   ↓
[Skill 层：流程与策略]
   ├─ drpy-node-source-workflow   （总控）
   ├─ drpy-node-play-debug        （播放专项）
   ├─ drpy-node-source-create     （新建源）
   └─ drpy-node-repo-upload       （仓库上传）
   ↓
[MCP 层：执行工具]
   ├─ evaluate_spider_source
   ├─ test_spider_interface
   ├─ read_file / edit_file / write_file
   ├─ fetch_spider_url
   ├─ validate_spider / check_syntax
   └─ house_file / house_verify
   ↓
结果返回给用户
```

---

## 五、主从调度图

```text
                ┌────────────────────────────┐
                │ drpy-node-source-workflow  │
                │         主 skill           │
                └────────────┬───────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ play-debug     │  │ source-create    │  │ repo-upload      │
│ 播放专项       │  │ 新建源专项       │  │ 仓库专项         │
└───────┬────────┘  └────────┬─────────┘  └────────┬─────────┘
        │                    │                     │
        └──────────────┬─────┴──────────────┬──────┘
                       ▼                    ▼
              ┌────────────────────────────────────┐
              │        drpy-node-mcp 工具层         │
              │  read/edit/test/fetch/validate/... │
              └────────────────────────────────────┘
```

---

## 六、典型任务怎么流转

### 场景 A：用户说“帮我修这个源”

```text
用户
 ↓
drpy-node-source-workflow
 ↓
先评估 evaluate_spider_source
 ↓
判断问题层级
 ├─ 如果是播放问题 → drpy-node-play-debug
 ├─ 如果是普通详情/一级问题 → workflow 自己继续
 └─ 如果修好且用户要上传 → drpy-node-repo-upload
 ↓
调用 mcp 工具执行
 ↓
返回结果
```

---

### 场景 B：用户说“帮我上传这个源”

```text
用户
 ↓
drpy-node-source-workflow 或直接触发 repo-upload
 ↓
repo-upload 检查：
- syntax
- validate
- 是否满足上传条件
 ↓
house_verify / house_file
 ↓
回报 file_id / cid / tags
```

---

### 场景 C：用户说“帮我写个新源”

```text
用户
 ↓
drpy-node-source-workflow 判断为新建任务
 ↓
drpy-node-source-create
 ↓
分析站点 / 判断模板 / 生成规则 / 初测
 ↓
调用 mcp 工具执行
 ↓
返回结果
```

---

## 七、你当前最关心的问题：会不会直接调 MCP 而没先走 Skill？

### 结论
会有这种可能。

### 原因
Skill 不是程序里的“硬入口函数”，而是模型应优先遵守的工作流提示。
MCP 工具是随时可调用的执行能力。

所以现实中会有三种情况：

### 情况 A：理想情况
模型先采用 skill 的工作流，再调用 mcp。

### 情况 B：半理想情况
模型大体按 skill 思路走，但会跳过部分细步骤，直接调用一些 mcp 工具。

### 情况 C：不理想情况
模型直接抓 mcp 工具干活，没有先完整遵守 skill 的流程。

---

## 八、为什么 Skill 仍然有意义

因为没有 skill 时，模型更容易：
- 乱用 mcp
- 少评估
- 少判断
- 假播放也说修好了
- 半成品也上传仓库

而 skill 的作用是：

> **提高 AI 按正确 drpy 工作流使用 mcp 的概率。**

它不是绝对强制，但它能显著提升正确率。

---

## 九、当前这 4 个 Skill 会不会替代 drpy-node-mcp？

### 结论
**不会替代。**

它们应当：

> **相辅相成。**

### 正确关系
- `drpy-node-mcp` = 能力层 / 工具层
- 4 个 skill = 决策层 / 流程层

最终模式是：

> **Skill 指挥 MCP，MCP 执行动作。**

---

## 十、未来是否需要 `references/` 和 `tools/` 目录？

### 当前结论
现在这 4 个 skill **不必须**上 `tools/`。

### `references/` 未来可能有价值
尤其适合：
- `drpy-node-play-debug`
  - 可拆：播放判断规则、常见 lazy fallback 模式
- `drpy-node-repo-upload`
  - 可拆：标签策略、上传红线清单

### 什么时候值得拆 `references/`
当出现这些情况时：
- `SKILL.md` 太长
- 某段规则反复复用
- 某段参数特别多
- 某块知识适合做成单独速查表

---

## 十一、最终建议

你现在不应该追求：

> “skill 替代 mcp”

而应该追求：

> **skill 驯化 mcp，让 mcp 更稳定地服务 drpy 场景。**

这是目前最正确、也最现实的方向。

---

## 十二、一句话版结论

- 这 4 个 skill 不替代 `drpy-node-mcp`
- 它们是 `drpy-node-mcp` 的上层工作流与判断标准
- 主 skill 负责总控，子 skill 负责专项
- mcp 仍然是执行层
- 最理想的模式是：

```text
Skill 决策 → MCP 执行 → Skill 汇总
```

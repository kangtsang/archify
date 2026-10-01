# archify-personal 维护规约（fork 专用）

> **与上游 `AGENTS.md` 的关系**
> 上游 `AGENTS.md` 规定**贡献者行为**与 **live 安装的授权边界**，本文件**不覆盖、不替代**它。
> 两份都生效：动这个仓库时，上游那份管「能不能做/要不要授权」，本文件管「怎么做/做成什么样」。

本 fork 只做**个性化改造**，不修上游 bug、不做功能移植。所有改动必须遵守本文件。

**本文件是硬约束，不是建议。违反任何一条都会让「跟随上游升级」的成本失控。**

---

## 1. 分支模型

```
personal  ← 你的全部工作。永远从最新稳定 tag 切出
main      ← 上游镜像。不在上面提交
```

**规约**

- 个性化改动**只**进 `personal` 分支
- `main` 只作镜像，不提交个性化内容
- **不为每个个性化功能开分支** —— overlay 是一小片改动，单线最易合并上游
- `personal` 必须基于**稳定 tag**，不基于上游未发布的 `main`

**为什么**：分开之后 `git diff <last-tag>..personal` 显示的就是你的个性化，一行不多。diff 越干净，合并上游越像机械操作。

**每次提交前自查**

```bash
git describe --tags                              # 必须显示 vX.Y.Z，不能是 vX.Y.Z-N-g...
git diff <last-tag>..personal --stat -- skills/   # 应只有 personal/* 和极少数 hook 行
```

---

## 2. Overlay 纪律（最重要的一条）

**禁止**直接修改上游文件中的布局/排版逻辑。所有此类改动必须：

1. 放进 `personal/` 目录下的 profile 文件
2. 上游文件**只允许**加一个 import + 一个读取点
3. 不改上游的判断逻辑分支

**为什么**：这是同步成本的决定因素。违反它，升级时冲突会摊到 196 KB 的 `workflow-compiler.mjs` 和 727 KB 的 viewer template 上。

**允许的上游改动白名单**

| 位置 | 允许的改动 |
| --- | --- |
| `personal/*` | 任意 |
| 上游文件中的 import 语句 | 仅新增指向 `personal/` 的 import |
| compiler / renderer 入口 | 仅新增「读取 profile 并下传」的传递代码 |
| 测试、文档 | 任意 |

**禁止**：调整上游常量值、重排逻辑、就地硬编码数值、格式化无关代码。

---

## 3. 同步上游的流程

```bash
git fetch upstream --tags
git switch personal
git merge vX.Y.Z          # 用 tag，不用 upstream/main
```

**为什么用 tag**：上游 `main` 含未发布提交（本 fork 建立时领先 v3.0.1 共 29 个，虽全是文档/赞助无 skill 代码变更，但这个性质随时会变）。

**同步后必过三条门禁，一条不过就不算完成**

```bash
node archify/bin/archify.mjs doctor                                                     # 全绿
node tools/archify-fork.mjs deliver workflow <spec>.json <out>.html --quality showcase  # checksPassed == checkCount, errors == 0
node tools/archify-fork.mjs visual-check <out>.html --json                              # status == "pass"
```

> 路径说明：fork 仓库里 skill 位于 `archify/`（不是发布 ZIP 的顶层 `archify/`），源码在
> `archify/renderers/workflow/workflow-compiler.mjs`。

外加一条一致性检查：`visual-check` 回执里的 `artifact.sha256` 必须与实际交付文件一致。

---

## 4. 环境与门禁

**本机安装的是 `@tt-a1i/archify-dsh@0.1.1`，内含 archify 2.14.0**，路径
`C:\Users\zega\.dsh\profiles\desktop\node_modules\@tt-a1i\archify-dsh\skills\archify`。

**这是 2.14.0，不是本 fork 的 3.0.1。两者不可混用：**

- 2.14.0 下的 `worktree-space-usage-flow.json` 依赖 2.14.0 的绝对坐标；换到 3.0.1 会因 `workflow/column-capacity` 等约束失败
- 本 fork 的改动**只对 3.0.1 生效**

**因此仓库内维护两套 wrapper，按目标运行时显式选择：**

| wrapper | 目标 | 用途 |
| --- | --- | --- |
| `tools/archify-current.mjs` | 2.14.0（已安装） | 日常出图，路径与 `render-wide.mjs` 保持一致 |
| `tools/archify-fork.mjs` | 本 fork（3.0.1） | 验证 fork 改动效果 |

**未完成事项**：DSH 侧接线（`ARCHIFY_SKILL` 指向本 fork）尚未落地。在完成前，fork 改动无法在日常出图路径上生效。

---

## 5. 禁止事项

- ❌ 向本 fork 的上游（`tt-a1i/archify`）推送任何内容
- ❌ 向本 fork 的 `origin`（`kangtsang/archify`）推送，除非明确授权
- ❌ 发布 npm 包
- ❌ 修改 `personal/` 之外的布局/排版逻辑
- ❌ 在 `main` 分支提交个性化内容
- ❌ 用 `upstream/main` 作为合并基准
- ❌ 跳过第 3 节的三条门禁就宣布完成

**推送规则**：「提交」「改完不要提交」都不不等于授权推送。推送永远等明确指令。

---

## 6. 已知技术事实（实测，勿凭记忆推翻）

以下为 2026-09 对 2.14.0 与 3.0.1 的实测结论。若与本节冲突，以实测为准并更新本节。

**两版相同的部分**

- workflow `laneW = 640`（`x=40 width=640`）—— **两个版本完全一致，未变**
- 节点主标签 11px、副标签 8px —— **3.0.1 未提升**。3.0.0 changelog 的 "state text is one step larger" 是 lifecycle 的，不是 workflow
- 泳道标题 10px、边/相位标签 8px、分组标签 7px

**3.0.1 的真实收益**

- `readable-v2`（`schema_version: 2`）：lane 默认宽 712，且**按内容不等高**（106/114…，2.14.0 统一 104）
- 分组框在节点左侧**预留约 50px label 槽**（2.14.0 会用节点盖住 label）
- 数值化约束：8px 端点桩 / 16px 内段 / 28px 直接间距
- `migrate` / `brands` / `finalize` 命令
- update 提醒

**3.0.1 仍然缺的（所以需要我们做）**

- ❌ **宽画布**：手写 `meta.viewBox: [1400, 926]` 后画布变宽，但 **lane 仍为 712、7 个节点坐标逐个相同、24 个走线点一个没变**。`readable-v2` 只认 viewBox 作画布尺寸，**不驱动内容铺开**。compiler 合并逻辑是 `Math.max(authored, required)`。
- ❌ 中文排版档位：两版字号都偏小，无法按语言调节

**迁移到 v2 的注意事项**

- 迁移要求源文件先通过 v1 的 `workflow/column-capacity`（相邻列 28px 直接间距）
- 我们的 JSON 迁不过去：`c0→c1` 预算 208 而实际 248；`c4→c5` 预算 194，而 `合并回目标分支`(需 103) + `归档并注销工作区`(需 117) = 220 —— **这两个中文标签在 fixed-v1 下无法共存**
- 迁移前必须删掉全部 `route` 预设与 `fromSide`/`toSide`/`via`，让编译器自行规划，否则报 `workflow/explicit-pin-conflict`
- 迁移后 `meta.viewBox` 为空，需自行写入

**`@tt-a1i/archify-dsh` 的处置**

- 本机装的 0.1.1 发布于 2026-08-14，**此后上游再未更新该封装**。升级不能等封装，必须自己接线。

---

## 7. 当前状态（2026-09）

- fork 仓库：`E:\workspace\public\archify-personal`
- 分支：`personal`，基于 tag `v3.0.1`（commit `2ab3cae7`）
- remotes：`origin` = `git@github.com:kangtsang/archify.git`，`upstream` = `https://github.com/tt-a1i/archify.git`
- 工作区干净，**尚无任何个性化改动**

---

## 8. 已定位的注入点（改动面已勘察，勿重复调研）

以下位置已勘察确认，**实施时直接引用，不要重新摸索**。

源码：`archify/renderers/workflow/workflow-compiler.mjs`（195,655 B，4,678 行）

**基线常量**

- `L73` `LEGACY_COLUMN_CENTERS = [88, 220, 300, 430, 500, 625]` —— fixed-v1 列心
  （相邻距 132 / 80 / 130 / 70 / 125，与实测的 `column-capacity` 预算完全吻合）
- `L103` `createLegacyLayout()` → `laneX: 40, laneW: 640, nodeW: 92, nodeH: 52`
- `L200` `createReadableLayout(workflow, layoutFeedback)` —— v2 核心，约 427 行

**注入点 1：列位填充（对应原补丁 1 的 a+b）**

v2 是**极小解求解器**，只保证下限、从不填满画布：

```
L202  baselinePitch = 120,  columnStart = 94
L214  每对相邻列推一条 {from, to, minimum: baselinePitch}
L239  同 lane 节点间距下限 = w(from)/2 + 8 + w(to)/2
L275  边直接间距下限      = w(from)/2 + 28 + w(to)/2
L351  colXs 初始化 = columnStart + col * baselinePitch
L360-376  DAG 松弛：colXs[to] = max(colXs[to], colXs[from] + minimum)
L386-394  左侧边界修正 leftShift
L503  laneW = Math.max(640, rightmostLaneWidth, ceil(laneLabelWidth))
L604  requiredWidth = 40 + laneW + 16
```

**插桩位置：`L394` 之后、`L503` 之前。**

**关键数学性质**：所有约束都是**距离下限**，因此**均匀放大列距必然不违反任何约束**。
`laneW` 会因 `rightmostLaneWidth` 自动跟随变宽，画布留白随之消失。**一处改动同时解决 (a) 和 (b)。**

**注入点 2：节点字号（对应原补丁 3）**

```
L962-969  const nodeTextFit = { labelPreferred: 11, labelMinimum: 9,
                                sublabelPreferred: 8, sublabelMinimum: 6,
                                tagPreferred: 7, tagMinimum: 6 }
```

**与 2.14.0 一字不差**，纯配置对象，改动零风险。

**注入点 3：边/图例字号（对应原补丁 4，注意风险）**

`L1390` `fontSize: 7`（边标签）、`L831` `fontSize: 7`（图例）是**散落字面量**，
不属于集中配置。按 overlay 纪律应收拢到 profile 再下传，**不要逐处改字面量**。

**注入点 4：分组框几何 —— 无需改动，原补丁 5 可删**

上游 `L560-575` 在编译期检测标签与节点重叠并自动加高 lane 头：

```
L560  labelRight = labelLeft + textUnits(group.label) * 5.6
L571  overlapsLabel = nodeRight > labelLeft && nodeLeft < labelRight
L574  overlapsLabel ? 11 : 9   → header 让位
```

比原补丁 5 的「居中避让」更根本。**只保留字号改动，删掉整个几何补丁。**

---

## 9. 已实现（2026-09，`personal` 分支）

**overlay 全部落在 `archify/personal/`**（在 skill 目录内，因此 `--sync` 会一起带走）

| 文件 | 作用 |
| --- | --- |
| `personal/profile.json` | 配置：`layout` + `typography` |
| `personal/profile.mjs` | 加载器。**整个 fork 唯一的扩展面**，默认值 = stock 3.0.1 |
| `personal/spec/*.json` | 个人图谱 spec |

**上游文件只被改了 7 处，全部是 import / 读取点：**

1. `workflow-compiler.mjs` 顶部 +2 行 import
2. `createReadableLayout()` 内 `fillWidth` 插桩（约 45 行，本 fork 唯一的算法新增）
3. `nodeTextFit` 展开 `...personalNodeTextFit()`
4. 图例 footprint `fontSize: personalAnnotationFont('legend')`
5. lane 标题 `font-size="${personalAnnotationFont('laneTitle')}"`
6. 相位标签 `font-size="${personalAnnotationFont('phaseLabel')}"`
7. 分组标签 `font-size="${personalAnnotationFont('groupLabel')}"` + 边标签 `'edgeLabel'`

**`fillWidth` 的两条策略**（`evenColumns` 开关）

- `evenColumns: true`（默认）→ 所有列（含**无节点列**）按等距重排。
  **但先做安全校验**：从 `activeConstraints` 反查每一对相邻列的真实约束下限，
  等距步长必须 ≥ 最紧的那个，否则退化为按比例缩放。
  ⚠️ 校验**不能**用求解后的位置差：空列只停在 baseline 位置，其步长不是真实约束。
- `evenColumns: false` → 按比例缩放，保留求解器的相对疏密。

**实测结果**（与当前生产成品对照）

| | fork 3.0.1 + overlay | 生产成品 2.14.0 + 5 步补丁 |
| --- | --- | --- |
| viewBox | 1164×**652** | 1164×590 |
| lane | x=40 w=**1048** | x=70 w=1024 |
| 列心 | 120 / 298.2 / 476.4 / 654.6 / 832.8 / 1011（等距 178.2） | 162…1002（等距 210） |
| 内容底部 | 573 | 573（**完全相同**） |
| 底部留白 | 79px | 17px |
| 字号阶梯 | `8.5, 9.2, 9.5×17, 10.5×4, 12×5, 12.3, 12.7, 13×8` | **逐项相同** |

**门禁**：validate 9/9 checks、composition pass（errors 0 / warnings 0）、
`finalize` 四门全过（validate / deliver / check / browser-check）。

### 已知未解决项（如实记录，不要当作已完成）

- **画布高度 652 vs 590**：差在底部 79px 预留区。已实测该预留**与图例字号无关**
  （7 / 8 / 8.5 三档最小高度都是 652），属 v2 结构性设计。
  收紧它需要改上游 `legendY`/`legendExtraHeight` 逻辑，**违反第 2 节 overlay 纪律**，故不做。
- **`visualReview` 未做**：本会话模型无图像输入能力，无法肉眼复核截图。
  `visual-check` 的自动化回执（containment + capture）为 `pass`，但**不等于**视觉检查通过。
- **2 条走线被建议复核**：`dialog → create` 与 `trial → conflict` 各 3 折弯。
  自动门禁接受，但按交付契约仍需人工在桌面视口追线确认。

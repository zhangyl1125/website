# 产品需求：2026 BDCN Digital Pioneer Award

## 1. 文档约定

- 本文件是产品行为的权威规格。
- “必须”表示验收所需行为；“不得”表示禁止行为。
- 反引号中的英文是已确认文案，必须逐字呈现，不得自动润色。
- 当前代码完成度不在本文件判断，统一见 [`tasks.md`](./tasks.md)。

## 2. 产品目标与范围

平台必须支持 2026 BDCN Digital Pioneer Award 的完整流程：奖项介绍、赛道说明、个人提名、员工投票、组委会评分和后台排名。本轮重点是依据 [`../Yining/spec/需求.md`](../Yining/spec/需求.md) 统一首页、概览、赛道、时间线和提名表单，同时保留既有业务规则。

### 2.1 用户角色

| 角色 | 能力 |
| --- | --- |
| 游客 | 浏览首页、概览和已公开候选人；不能提交提名、投票、评论或评分 |
| 已登录员工（participant/associate） | 浏览；为自己提交提名；按规则投票和评论 |
| manager | 员工能力；可为自己或其他员工提名；管理其有权管理的评选 |
| admin | manager 能力；管理用户、评选、评分和排名 |
| 已分配组委会评委 | 浏览分配给自己的评选并提交评分；未被分配时不能评分 |

### 2.2 页面和访问

| 路径 | 页面 | 游客 | 已登录员工 | manager/admin/评委 |
| --- | --- | --- | --- | --- |
| `/` | 首页首屏和完整概览 | 可查看 | 可查看 | 可查看 |
| `/overview` | 完整概览 | 可查看 | 可查看 | 可查看 |
| `/nominate` | 赛道选择和提名表单 | 可查看，不可提交 | 仅可自荐 | 可自荐或提名他人 |
| `/projects` | 候选人浏览与投票 | 可查看，投票时要求登录 | 可投票 | 可投票；有权限者可进入评分 |
| `/awards`、`/awards/:id` | 评选管理入口 | 不可访问 | 仅获分配评委可进入相应入口 | 按管理权限访问 |
| `/hackathons/:hackathonId/judge` | 组委会评分 | 不可访问 | 仅获分配者 | 按分配或管理权限访问 |
| `/hackathons/:hackathonId/leaderboard` | 排名和评分明细 | 不可访问 | 不可访问 | 按管理权限访问 |

## 3. 全局要求

### DP-GEN-001 — 精确文案

需求指定的英文必须逐字保留，包括现有语法、大小写、空格和标点。翻译层、浏览器翻译保护或后续 AI 修改不得改写这些字符串。

### DP-GEN-002 — 视觉连续性

首页和下方内容必须像同一站点：共用蓝色科技背景、品牌头部、字体体系和一致的玻璃/半透明表面。不得从深蓝首屏突然切换为无衔接的纯白页面。

### DP-GEN-003 — 字体

正文、小字、表单标签和控件统一使用现有 `--app-font-body`（SF Pro/系统字体及中文回退）；大标题可保留展示字号和字重。中英文切换不得因字体冲突产生不必要换行或溢出。

### DP-GEN-004 — 响应式

所有目标页面必须支持至少 1440px、390px 和 320px 宽度。不得出现横向页面滚动、被遮挡的 CTA、不可读的卡片或截断的必需表单文案。

### DP-GEN-005 — 无障碍

- 交互元素必须可通过键盘使用，并有可见焦点。
- 赛道选择必须暴露单选语义和选中状态。
- 标题层级、区块标签和按钮名称必须可被辅助技术识别。
- 文本和控件必须达到 WCAG 2.2 AA 基本对比度。
- 尊重 `prefers-reduced-motion`，不得强制平滑滚动或持续动画。

### DP-GEN-006 — 业务边界

公开界面只展示 Digital Pioneer 相关入口。不得重新引入组织设置、团队、通用创意项目等与本评选无关的导航或业务文案。

## 4. 首页首屏

参考截图：[`1788846036847.png`](../Yining/spec/image/需求/1788846036847.png)。

### DP-HOME-001 — 主标题

首页主标题必须是：

`2026 BDCN Digital Pioneer Award`

不得显示旧标题 `Recognize the work that moves us forward.`。

### DP-HOME-002 — 副文案

首页副文案必须是：

`Recognize people who turn customer insight, bold ideas, and shared effort into meaningful progress and business values.`

### DP-HOME-003 — 下滑引导

首页必须保留 `Get Started` 作为唯一的下滑引导。主按钮点击后滚动到同页概览区；URL 可使用 `/#overview`，直接访问该锚点也必须定位到概览。

- 默认使用平滑滚动。
- 用户启用减少动态效果时立即定位，不使用平滑动画。
- 修饰键点击、中键点击等标准链接行为不得被破坏。
- 不另加“下滑浏览更多信息”控件。

### DP-HOME-004 — 首屏品牌与导航

保留 BOSCH / Digital Award 品牌、概览、个人提名、浏览与投票三个主入口，以及现有语言和账号入口。移动端必须提供可关闭、支持 Escape 的菜单。

## 5. 奖项概览

参考截图：[`1788846095401.png`](../Yining/spec/image/需求/1788846095401.png)。

### DP-OVR-001 — 内容区风格

概览内容必须延续首页蓝色科技背景。主体可使用现有玻璃卡片、阴影和低饱和强调色保证可读性，但不得使用与首屏割裂的大面积纯白底。

### DP-OVR-002 — 标题与介绍

- 删除旧的紫色小标题。
- 主标题必须是：`2026 BDCN Digital Pioneer`
- 主标题下方说明必须是：

`The Digital Pioneer Award honors individuals who actively drive digital transformation and live BDCN High-Performance Culture— delivering customer values, pioneering innovation, and achieving shared success through collaboration.`

### DP-OVR-003 — 插图

右侧使用现有 `AwardLens.tsx` 蓝色水晶奖杯 SVG 作为正式目标插图，不再把它标记为占位图。插图是装饰内容，不得产生冗余朗读。

### DP-OVR-004 — 行动入口位置

`开始提名` 和 `浏览并投票` 必须同时位于赛道说明和时间线之后。概览顶部不得重复出现这两个按钮；底部不得出现额外的“提名一位数字先锋”标题或说明文字。

## 6. 奖项赛道与标准

参考截图：[`1788846148628.png`](../Yining/spec/image/需求/1788846148628.png)。

### DP-TRACK-001 — 固定赛道

平台只使用以下三个赛道值；下拉选项、筛选、投票归类和评分展示必须使用同一值：

1. `Customer Values`（客户价值）
2. `Innovation Breakthrough`（创新破局）
3. `Collaboration to Win`（协作共赢）

### DP-TRACK-002 — 赛道视觉层级

三个赛道名称必须在卡片内居中并明显大于说明和标准正文。不得显示 `VALUE`、`SHIFT`、`UNITE` 等左上角小型代号。页面标题仍保持区块最高层级，但赛道名必须成为每张卡片的首要视觉信息。

### DP-TRACK-003 — 卡片样式

赛道卡不得只是单调的白框黑字。必须复用现有玻璃表面、阴影和三种现有强调色（orchid、persimmon、champagne）建立区分，同时保持正文对比度。不得为此引入新 UI 依赖。

### DP-TRACK-004 — 赛道描述与标准

以下内容是完整、固定的赛道资料。

#### Customer Values

描述：`Turn deep customer understanding into tangible, lasting value.`

- `Deliver end-to-end solutions that create tangible value for customers and users.`
- `Win customers and users with differentiated, market-leading products and services, establishing long-term win-win partnerships to co-grow capabilities and business.`
- `Listen actively, think from the customer perspective, and uncover hidden needs and pain points.`
- `Continuously enhance the customer experience and co-create value. Demonstrate service excellence, resolve issues beyond expectations, and transform challenges into opportunities.`

#### Innovation Breakthrough

描述：`Challenge the status quo, test boldly, and prove innovation through impact.`

- `Deliver a clear breakthrough and show the courage to think outside the box and take smart risks.`
- `Take a broader view of innovation and embed it across the entire value chain.`
- `Pioneer cutting-edge technologies and cross-disciplinary methods to explore better paths.`
- `Use rapid validation and continuous iteration to create sustainable business impact.`

#### Collaboration to Win

描述：`Break boundaries, share ownership, and turn collective effort into shared success.`

- `Live “Discuss – Decide – Do”: when encountering bottlenecks, swiftly align key stakeholders to drive high-quality, decisive actions.`
- `Proactively share information and resources across boundaries to eliminate silos, foster synergy, and achieve the best solution.`
- `Own shared goals and proactively support upstream and downstream work.`
- `Promote and appreciate joint success, enabling the team to win as one and building trust across functions.`

## 7. 评选时间线

参考截图：[`1788846192105.png`](../Yining/spec/image/需求/1788846192105.png)。

### DP-TIME-001 — 阶段文案

四个阶段标签必须逐字显示为：

1. `STEP1：Self-nomination`
2. `STEP2：Associate Voting`
3. `STEP3:Committee Voting`
4. `STEP4:Award Announce & Ceremony`

不得自动统一其中的冒号、空格、大小写或语法。

### DP-TIME-002 — 日期与说明

保留现有日期和说明：

| 阶段 | 日期 | 说明 |
| --- | --- | --- |
| STEP1 | `Oct. 19–30` | `Submit your individual nomination` |
| STEP2 | `Nov. 2–13` | `Ten shortlisted nominees per category` |
| STEP3 | `Nov. 16–30` | `Five finalists per category` |
| STEP4 | `December` | `Winners announced at Townhall` |

时间线在桌面端可横向排列，在窄屏必须顺序纵向排列且保持 STEP1 至 STEP4 顺序。

### DP-TIME-003 — 时间线后的 CTA

时间线结束后只显示 `开始提名` 和 `浏览并投票` 两个入口，分别导航至 `/nominate` 和 `/projects`。

## 8. 提名流程

参考截图：[`1788846706510.png`](../Yining/spec/image/需求/1788846706510.png) 与 [`1788846774738.png`](../Yining/spec/image/需求/1788846774738.png)。

### DP-NOM-001 — 页面起点

提名页面必须直接从“选择奖项赛道”开始。不得显示顶部“提名一位数字先锋”或 `Nominate a Digital Pioneer.` 英雄区。

### DP-NOM-002 — 赛道选择卡

- 初始状态不选择任何赛道，表单不显示。
- 三张卡仅突出居中的赛道名称和选中状态。
- 卡片不得显示左上角小型代号，也不得在未选择时提前展开完整描述或标准。
- 卡片必须支持鼠标、触摸和键盘选择，并使用单选语义。

### DP-NOM-003 — 选择后的内容

选择赛道后，卡片组下方必须出现该赛道的描述和完整评选标准，然后显示提名表单。切换赛道时：

- 描述和标准立即更新。
- `Award Category` 同步更新。
- 已输入的其他表单内容不得被清空。

### DP-NOM-004 — 表单字段与精确文案

字段按以下顺序显示：

| 顺序 | 标签/说明 | 控件 | 必填 |
| --- | --- | --- | --- |
| 1 | `Outlook Name` | 员工本人只读文本；manager/admin 为可搜索员工下拉框 | 是 |
| 2 | `Personal Photo` | 图片文件选择 | 是 |
| 3 | `Award Category` | 下拉框：`Customer Values`, `Innovation Breakthrough`, `Collaboration to Win` | 是 |
| 4 | `Executive Summary (The Elevator Pitch)` | 多行文本 | 是 |
| 4a | `In 3–5 sentences, summarize your key contributions over the past year and explain why you represent the spirit of a Digital Pioneer.` | 字段说明/占位提示 | — |
| 5 | `Details of Core achievement and business impact (*including Financial Figures)` | 多行文本 | 是 |
| 6 | `How you demonstrate BD China culture (especially on you applied category) ?` | 多行文本 | 是 |
| 7 | `Tags you want to add` | 标签输入 | 否 |

### DP-NOM-005 — 表单验证

- 未选择赛道时不得显示可提交表单。
- 字段 1–6 缺失时不得提交，并显示可理解的字段级或汇总错误。
- Personal Photo 仅接受当前支持的 JPEG、PNG、WebP 图片类型。
- Executive Summary 保留当前 1200 字符上限；“3–5 sentences”是内容指导，不做脆弱的自动句子计数。
- Core achievement 保留当前 2400 字符上限。
- Culture demonstration 保留当前 2000 字符上限。
- Tags 接受英文逗号或中文逗号分隔；提交前去空格、去空值和去重，最终最多 5 个。第 6 个唯一标签出现时必须阻止提交并提示上限。

### DP-NOM-006 — 提名权限

- 游客可以查看流程，但提交前必须登录。
- 所有已登录员工都可以为自己提名。
- participant 不得通过修改请求为其他人提名。
- manager/admin 可以从员工目录选择他人，也可以选择自己。
- 前端可用状态和后端授权必须一致；不能只在按钮层控制权限。

### DP-NOM-007 — 原子提交

一次成功提交必须形成一条完整提名，不得先创建空案例再补字段：

1. 验证字段和权限。
2. 上传 Personal Photo。
3. 用一次创建请求提交候选人身份、赛道、三个正文、标签、照片引用和 `submitted` 状态。
4. 创建成功后显示成功反馈并刷新候选人列表。

个人奖项不得为了兼容旧 HackHub 模型而新建可见或隐藏的业务团队；创建接口应允许 `teamId` 为空。上传成功但创建失败时必须明确提示失败，不得把不完整提名显示为已提交。

### DP-NOM-008 — 候选人身份

提名元数据必须包含不可歧义的 `nomineeUserId`。后端根据可信用户/名册数据补全姓名和 Org. code，不信任客户端提交的部门字段。开始投票或评分后，候选人和赛道不得被替换。

## 9. 候选人浏览

### DP-BROWSE-001 — 公开浏览

游客和已登录用户都可以浏览公开且已提交的候选人。公开接口不得泄露草稿、私有评选、评分、注册密钥或内部账号 ID。

### DP-BROWSE-002 — 候选人信息

候选人卡和详情至少显示姓名、部门、赛道、照片、提名内容和标签。部门展示使用 Org. code 第一个 `-` 前的前缀；完整 Org. code 只在已有授权的详情场景显示。

### DP-BROWSE-003 — 筛选与空状态

列表支持姓名/贡献搜索、赛道、标签和部门筛选；多个筛选条件按 AND 组合。部门选项去重、排序并忽略空值。无匹配结果时显示清晰空状态，而不是空白页面。

## 10. 员工投票

### DP-VOTE-001 — 票数上限

每位符合名册资格的员工在每个赛道最多投 4 票，可以少于 4 票。投票和取消投票必须回显实际服务器状态。

### DP-VOTE-002 — 跨部门比例

投满 4 票时至少 2 票必须投给本部门之外的候选人。未投满时允许暂时只有本部门票，以便用户按任意顺序完成选票；系统必须阻止最终形成不满足 50% 跨部门要求的满额选票。

### DP-VOTE-003 — 部门规则

部门取 Org. code 第一个 `-` 之前的字段：

- `BD/DPA-SRE3` → `BD/DPA`
- `BD/BA-AP` → `BD/BA`
- 不含 `-` 时使用完整非空值。

候选人部门必须取被提名人，而不是提交提名的 manager/admin。名册无法唯一匹配时不得猜测，应拒绝投票并给出可处理的错误。

### DP-VOTE-004 — 安全和并发

投票限制必须由后端事务执行，并在并发请求下保持最多 4 票和跨部门约束。前端限制仅用于体验，不能替代后端校验。

## 11. 组委会评分与后台排名

### DP-JUDGE-001 — 评分权限

只有被分配到对应评选的评委可以提交评分。manager/admin 可按既有管理权限查看；未被分配的普通员工不得评分。服务端必须执行授权。

### DP-JUDGE-002 — 评分项

- `Behavior Demonstration`：70%，1–10 整数。
- `Business Impact`：30%，1–10 整数。
- 推荐意见和评论与两项分数作为一次完整评价提交，避免部分保存。

### DP-JUDGE-003 — 计算与排名

- 单评委总分 = Behavior × 70% + Business Impact × 30%。
- 多评委总分 = 所有完整评价加权总分的算术平均值。
- 未完整评分不计入平均值；无完整评分显示 `Not scored`。
- 同分共享名次并采用竞赛排名，例如 1、1、3。
- 员工票数单列，不混入组委会总分。

### DP-JUDGE-004 — 管理视图

有权限的管理者可按赛道筛选排名，查看每位评委的两项分数、推荐和评论，并导出汇总 CSV。

## 12. 错误和空状态

### DP-ERR-001 — 数据加载

首页静态内容不应依赖业务 API 才能显示。候选人、评选或员工目录加载失败时，页面必须显示错误和重试方式，并防止旧请求覆盖新账号/新路由的数据。

### DP-ERR-002 — 无可用评选

没有可提名的评选时，赛道说明仍可查看，但表单区域必须显示 `No nomination window is currently open.`，不得提交到任意历史活动。

### DP-ERR-003 — 上传和提交

照片上传或创建提名失败时必须保留用户仍可安全保留的表单输入，显示服务端或可理解的通用错误，并允许重试。提交期间必须防止重复请求。

### DP-ERR-004 — 未登录动作

游客点击投票时跳转到登录页，并在 `redirect` 中保留目标候选人；登录成功返回后应重新打开对应候选人详情。游客发起提名提交时也必须得到明确登录引导，不得只留下无解释的禁用按钮。

## 13. 明确不做

- 不新增公开“投票规则”独立页面。
- 不恢复组织、团队或通用 HackHub 功能入口。
- 不为本轮 UI 文案修改新增数据库表或第三方 UI 包。
- 不自动润色已确认英文。
- 不把生产部署视为本文档完成的一部分。

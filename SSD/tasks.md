# 实施任务与验收状态

## 1. 状态快照

本清单通过静态检查建立，未在本轮运行应用测试。

- 检查日期：2026-09-08
- 仓库：`../app/`
- 分支：`main`
- 基线提交：`3cc6244`（`修改版本1`）
- 状态口径：基线提交 + 当时可见的未提交工作区

生成清单时可见的未提交文件：

```text
hackhub-api/src/main/java/wtf/hackhub/application/idea/SubmitIdeaUseCase.java
hackhub-api/src/test/java/wtf/hackhub/application/idea/AwardPersistenceIT.java
hackhub-api/src/test/java/wtf/hackhub/application/idea/SubmitIdeaUseCaseTest.java
hackhub-app/src/contexts/uiTranslations.ts
hackhub-app/src/pages/DigitalPioneer.css
hackhub-app/src/pages/LandingPage.css
hackhub-app/src/pages/ProjectShowcase.public.test.tsx
hackhub-app/src/pages/ProjectShowcase.test.tsx
hackhub-app/src/pages/ProjectShowcase.tsx
```

这些修改可能来自人工或其他代理。后续 AI 必须先重新运行 `git -C ../app status --short`，不得按本快照覆盖新变化。

## 2. 状态定义

| 状态 | 含义 |
| --- | --- |
| 已实现 | 当前代码中存在目标行为，并有对应测试或稳定既有证据；不表示本轮重新跑过测试 |
| 待验证 | 代码看似存在，但精确断言、视觉检查或当前工作区测试尚未确认 |
| 待实现 | 当前代码缺失或与已确认需求冲突 |
| 范围外 | 本轮明确不改，避免 AI 扩大范围 |

## 3. 差距清单

| 任务 | 需求 | 状态 | 当前证据或差距 | 最小落点 |
| --- | --- | --- | --- | --- |
| SSD-001 首页精确标题、副文案和滚动 | DP-HOME-001..003 | 待验证 | `LandingPage.tsx` 已有目标标题、副文案、`/#overview` 和 reduced-motion 分支；测试覆盖滚动，但未逐字断言两段文案 | `LandingPage.test.tsx`；必要时仅修正页面文案 |
| SSD-002 首页导航和移动菜单 | DP-HOME-004、DP-GEN-005、DP-GEN-006 | 已实现 | 三入口、Escape 关闭菜单和角色入口已有测试 | 保持现有实现，回归即可 |
| SSD-003 概览标题、说明和正式插图 | DP-OVR-002、DP-OVR-003 | 待验证 | 目标文案和蓝色水晶 `AwardLens` 已存在；现有概览测试只做宽松标题断言，插图需视觉检查 | `DigitalPioneerOverview.test.tsx`、视觉验收 |
| SSD-004 首页与概览视觉连续性 | DP-GEN-002、DP-GEN-003、DP-OVR-001 | 待验证 | 未提交 CSS 已把大内容底改为透明并把关键标题改白；尚未验证正文对比度及 3 个断点 | `LandingPage.css`、`DigitalPioneer.css` |
| SSD-005 概览底部双 CTA | DP-OVR-004、DP-TIME-003 | 已实现 | 两个入口已从 hero 移至赛道和时间线之后，额外 CTA 标题已删除 | 补结构顺序断言可提高保障 |
| SSD-006 概览赛道视觉层级 | DP-TRACK-002、DP-TRACK-003 | 待实现 | 当前 `.dp-track-title` 没有居中；赛道名约 1.5rem，卡片区分仍需按确认标准验收 | `DigitalPioneer.css`，不改赛道数据 |
| SSD-007 赛道内容唯一来源 | DP-TRACK-001、DP-TRACK-004 | 已实现 | 三个名称、描述和标准集中在 `config/digitalPioneer.ts` 并由概览和提名页复用 | 保持单一配置来源 |
| SSD-008 时间线精确标签 | DP-TIME-001、DP-TIME-002 | 待实现 | phase 名称已更新，但组件仍拼成 `01 · Self-nomination`；不符合逐字 `STEP1：Self-nomination` 等标签 | `digitalPioneer.ts`、`DigitalPioneerOverview.tsx` 及测试 |
| SSD-009 提名页直接从赛道开始 | DP-NOM-001 | 已实现 | 顶部提名 hero 已删除；测试断言旧标题不存在 | 保持现有结构 |
| SSD-010 提名赛道卡和选择后详情 | DP-NOM-002、DP-NOM-003 | 待实现 | 小型代号已删除，选择后详情和保留输入已有测试；但卡片仍提前显示简述，名称也未居中 | `ProjectShowcase.tsx`、`DigitalPioneer.css`、现有选择测试 |
| SSD-011 表单字段和 Tags | DP-NOM-004、DP-NOM-005 | 已实现 | 目标字段文案、三种分类、字符上限、中文/英文逗号、去重和最多 5 个标签已有代码及测试 | 增加 Personal Photo 和全部逐字文案断言 |
| SSD-012 participant 自荐前端权限 | DP-NOM-006 | 待实现 | `canNominate` 当前仅允许 admin/manager，participant 按钮被禁用并显示禁止提示 | `ProjectShowcase.tsx`；participant 只能使用自身 ID |
| SSD-013 participant 自荐后端权限 | DP-NOM-006、DP-NOM-008 | 待实现 | `IdeaController.create` 仍有 `hasAnyRole('ADMIN', 'MANAGER')`；未提交 `SubmitIdeaUseCase` 仍显式拒绝 participant 的无 team 提名 | `IdeaController.java`、`SubmitIdeaUseCase.java`；先写角色与伪造 nominee 测试 |
| SSD-014 无 team 原子提名 | DP-NOM-007、DP-NOM-008 | 待验证 | 未提交工作区正在移除兼容 team、改用一次创建并增加单元/集成测试；当前改动尚未运行验证，且受 SSD-013 阻塞 | 保护现有改动，完成测试后再判断 |
| SSD-015 公开候选人浏览 | DP-BROWSE-001、DP-BROWSE-002 | 已实现 | 公共接口、游客详情、投票登录 redirect 和敏感字段收敛已有代码及测试 | 回归公共接口和前端测试 |
| SSD-016 搜索与组合筛选 | DP-BROWSE-003 | 待验证 | 未提交工作区正在增加部门筛选和 AND 组合测试；尚未运行 | `ProjectShowcase.tsx`、`ProjectShowcase.public.test.tsx` |
| SSD-017 每赛道票数、身份和部门 | DP-VOTE-001、DP-VOTE-003、DP-VOTE-004 | 已实现 | 后端按标准化赛道查询、最多 4 票、使用 nominee 身份、按第一个 `-` 解析部门并加锁 | 回归 VoteIdeaUseCase 单元/集成测试 |
| SSD-018 未满额选票顺序 | DP-VOTE-002 | 待实现 | 当前 `ownVotes * 2 > resultingTotal` 对每一步生效，会阻止第一票投本部门；目标只在形成 4 票满额选票时强制至少 2 票跨部门 | `VoteIdeaUseCase.java` 及顺序组合测试 |
| SSD-019 组委会评分和排名 | DP-JUDGE-001..004 | 已实现 | 既有 70/30、分配权限、完整评分、平均分、同分排名和明细实现已记录于交接文档 | 运行 API/集成和前端回归，不重写评分模块 |
| SSD-020 精确英文与语言切换 | DP-GEN-001、DP-GEN-003 | 待验证 | 关键文案多为硬编码且部分有翻译保护；当前测试未覆盖全部精确字符串和切换后不换行 | 对固定英文逐字断言；检查 `uiTranslations.ts` |
| SSD-021 响应式、对比度和无障碍 | DP-GEN-004、DP-GEN-005 | 待验证 | 已有响应式和 reduced-motion CSS；最新透明背景及赛道调整尚无 1440/390/320 新证据 | Playwright/浏览器截图、键盘和 axe/人工对比检查 |
| SSD-022 错误和空状态 | DP-ERR-001、DP-ERR-002、DP-ERR-003、DP-ERR-004 | 待验证 | 加载重试、无评选、上传/提交错误及投票登录 redirect 已有部分实现；游客提名目前只有禁用按钮，没有明确登录引导 | `ProjectShowcase.tsx` 及公开、失败路径测试 |
| SSD-023 当前工作区完整门禁 | 全部 | 待验证 | 本轮只写文档，没有运行测试、lint 或 build | 按第 6 节顺序执行并记录新输出 |

## 4. 推荐实施顺序

后续 AI 一次只处理一组可独立验证的任务：

1. **权限与数据安全**：SSD-012、SSD-013；先覆盖 participant 自荐和伪造他人 nominee 的后端失败测试。
2. **原子提名收口**：SSD-014；在不覆盖现有未提交修改的前提下完成无 team 流程。
3. **业务规则修正**：SSD-018；用不同投票顺序验证满额时的 50% 规则。
4. **精确 UI**：SSD-008、SSD-010、SSD-006；只改配置、现有组件和 CSS。
5. **精确文案与筛选回归**：SSD-001、SSD-003、SSD-016、SSD-020。
6. **错误、视觉和全套门禁**：SSD-022、SSD-004、SSD-021、SSD-023。

不要把所有任务合成一次大改；权限、投票和视觉可分别审阅与回滚。

## 5. 验收场景

| 场景 | Given | When | Then | 需求 |
| --- | --- | --- | --- | --- |
| AC-01 首页进入概览 | 用户位于 `/` | 点击 `Get Started` | URL/锚点指向 `#overview`，概览进入视口；减少动态效果时无平滑动画 | DP-HOME-001..003 |
| AC-02 概览顺序 | 用户查看完整概览 | 从上向下浏览 | 标题/插图 → 三赛道 → 时间线 → 两个 CTA；顶部无重复 CTA | DP-OVR-002..004 |
| AC-03 赛道视觉 | 用户查看概览 | 比较三张卡 | 名称居中且为卡片首要信息，无 VALUE/SHIFT/UNITE，三卡有克制区分 | DP-TRACK-002、DP-TRACK-003 |
| AC-04 时间线 | 用户查看时间线 | 读取四阶段 | 四个 STEP 标签逐字匹配需求，日期和顺序正确 | DP-TIME-001、DP-TIME-002 |
| AC-05 提名初始态 | 用户打开 `/nominate` | 尚未选赛道 | 页面从赛道选择开始，表单和完整赛道详情不显示 | DP-NOM-001、DP-NOM-002 |
| AC-06 选择赛道 | 用户已输入部分内容 | 切换 Award Category | 详情和下拉值同步更新，其他输入保留 | DP-NOM-003 |
| AC-07 Tags | 已有五个唯一标签 | 输入重复标签或第六个唯一标签 | 重复项被去重；第六个唯一标签报错并阻止提交 | DP-NOM-005 |
| AC-08 员工自荐 | participant 已登录 | 提交本人完整资料 | 后端接受，nominee 等于本人，不创建 team，只创建一条完整提名 | DP-NOM-006..008 |
| AC-09 越权他荐 | participant 已登录 | 篡改 nomineeUserId 为他人 | 后端拒绝，数据库和对象状态不出现提名 | DP-NOM-006、DP-NOM-008 |
| AC-10 管理者他荐 | manager/admin 已登录 | 选择有效员工并提交 | 后端接受并以可信目录补全姓名和部门 | DP-NOM-006..008 |
| AC-11 游客投票 | 游客打开公开候选人 | 点击投票 | 跳转登录并保留候选人 redirect | DP-BROWSE-001、DP-VOTE-001、DP-ERR-004 |
| AC-12 部门显示 | Org. code 为 `BD/DPA-SRE3` | 查看卡片或部门筛选 | 展示/筛选部门为 `BD/DPA` | DP-BROWSE-002、DP-BROWSE-003、DP-VOTE-003 |
| AC-13 未满额投票 | 员工首票投本部门 | 提交第 1–3 票 | 只要未形成满额非法选票，允许继续调整 | DP-VOTE-002 |
| AC-14 满额投票 | 员工准备投第 4 票 | 最终跨部门票少于 2 | 后端拒绝；达到至少 2 票时接受 | DP-VOTE-001、DP-VOTE-002、DP-VOTE-004 |
| AC-15 评分权限 | 未分配员工和已分配评委分别登录 | 请求提交评分 | 前者被拒绝，后者可一次保存完整评价并刷新回显 | DP-JUDGE-001、DP-JUDGE-002 |
| AC-16 排名 | 多位评委完成评分 | 管理者查看排名 | 使用 70/30 平均；未评分不排名；同分显示 1、1、3；员工票单列 | DP-JUDGE-003、DP-JUDGE-004 |
| AC-17 小屏和键盘 | 使用 390px/320px 与键盘 | 浏览并完成赛道选择 | 无横向溢出，焦点可见，单选状态可读，CTA 可操作 | DP-GEN-004、DP-GEN-005 |
| AC-18 失败恢复 | API、评选或上传不可用 | 用户加载、提名或重试 | 静态首页仍显示；业务区给出错误/空状态；输入不被无故清空；不重复提交 | DP-ERR-001、DP-ERR-002、DP-ERR-003 |

## 6. 验证命令

在 `../app/` 执行并把日期、命令和结果追加到第 7 节：

```bash
make test-app
make test-api
make test-api-integration
make lint
make build
```

完整栈可用后执行：

```bash
make test-e2e
```

对于纯 CSS/布局变更，还必须保存 1440×900、390×844、320×568 的新截图或等价浏览器证据。历史报告不能替代当前工作区验证。

## 7. 本规格验证记录

| 日期 | 基线 | 命令 | 结果 |
| --- | --- | --- | --- |
| 2026-09-08 | `3cc6244` + 未提交工作区 | 未执行应用命令（本轮仅创建 SSD 文档） | 应用状态保持“待验证” |

## 8. 完成定义

只有同时满足以下条件，相关任务才能从“待验证”改为“已实现”：

- 对应需求 ID 有代码落点和自动化测试；视觉项有新浏览器证据。
- 精确英文与 `requirements.md` 逐字一致。
- 前后端权限一致，越权请求由后端拒绝。
- 当前工作区相关测试、lint 和 build 有新通过输出。
- 1440px、390px、320px 无横向溢出，键盘和 reduced-motion 行为正确。
- 未覆盖任务开始前已有的人工或其他代理修改。

## 9. 明确范围外

- 修改生产数据、执行部署或数据库迁移。
- 更换 AwardLens 为新图片。
- 引入新的组件库、表单库、状态库或动画库。
- 重构与 Digital Pioneer 无关的 HackHub 页面。
- 自动修正需求原文中的英文。

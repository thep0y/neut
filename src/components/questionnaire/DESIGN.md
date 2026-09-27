# Questionnaire 组件设计方案

> 状态:**P1 完成**(单选/多选/自由作答/跳过/快捷键/校验/受控/进度/键盘/无障碍)
> 移植目标:shadcn Base UI 版 `questionnaire`(行为来自 `@shadcn/react` 的 headless 包)
> 关联代码:`src/components/questionnaire/`
> 依赖声明:见文末「第三方依赖」——上游行为来自 `@shadcn/react/questionnaire`,本仓库**不引入**该运行时。

## 1. 概述

多步问卷。上游 `questionnaire.tsx` 只是给 `@shadcn/react/questionnaire` 的 headless 原语
套样式(`cn-questionnaire-*` token);真正的状态机(激活项、答案、校验、进度、键盘)在
headless 包里。本仓库按约定不引入该运行时,因此重写了一份 Solid 版引擎。

关键取舍:问卷的答案**不集中存放在 Root**。每个 `QuestionnaireItem` 自己持有答案注册表与
选中集合,`Root` 只持有激活项/进度/导航,并在提交时读取 DOM 表单(`FormData`)。这与上游
一致,也让答案控件保持原生语义(radio/checkbox/input)。

```
Questionnaire (form)              # Root:激活项、进度、导航、校验、键盘
├── QuestionnaireProgress         # role=progressbar;children 函数可自绘
├── QuestionnaireItem (fieldset)  # 非激活 hidden + inert;注册句柄给 Root
│   ├── QuestionnaireTitle (legend)
│   ├── QuestionnaireDescription
│   ├── QuestionnaireChoices
│   │   ├── QuestionnaireChoice   # 原生 radio/checkbox + 自绘指示器/快捷键
│   │   └── QuestionnaireInput    # 自由作答
│   └── QuestionnaireError
└── QuestionnaireActions
    ├── QuestionnairePrevious / Skip / Next / Submit
```

## 2. SRP 分工

| 关注点 | 文件 |
| --- | --- |
| 类型契约 | `questionnaire.types.ts` |
| context(Root / Item) | `questionnaire.context.ts` |
| 纯函数(快捷键/文档序/输入判定) | `questionnaire.utils.ts` |
| Root 状态机 | `useQuestionnaireRoot.ts` |
| Item 状态机 | `useQuestionnaireItem.ts` |
| Choice / Input 引擎 | `QuestionnaireChoice/useQuestionnaireChoice.ts`、`QuestionnaireInput/useQuestionnaireInput.ts` |
| 各部件的渲染/ARIA | `Questionnaire*/` 各自目录 |

## 3. 已实现行为

- **题目注册与排序**:Item 在 ref 里把命令式句柄注册到 Root,Root 按 `compareDocumentPosition`
  排序;`MutationObserver` 监听动态增删。
- **激活项**:`defaultItem` / 受控 `item` + `onItemChange`;不可用时回退到第一个可用项。
- **导航**:上一题/下一题(先校验,失败则聚焦首个无效控件)/跳过(可选题目)/提交;
  Enter 或 Mod+Enter 提交。
- **答案**:`QuestionnaireChoice`(单选 radio / `multiple` 时 checkbox)、`QuestionnaireInput`
  (选中后才带 `name` 参与 FormData,未选中用 `form=""` 排除)。
- **选中模型**:Item 维护选中集合;受控 `checked` 走 `syncControlledAnswerSelection`,
  非受控走 `setAnswerSelectionFromInteraction`;`defaultChecked`/`defaultValue` 注册为默认值,
  reset 时恢复。
- **校验**:`required` + `invalid` + `touched`;`noValidate` 默认 true(组件校验),
  传 `noValidate={false}` 时才额外走原生 `validity`/`reportValidity`。
- **状态**:`unanswered` / `answered` / `skipped`,`onStatusChange` 在变化时回调;
  `invalid` 时 `aria-invalid`、错误 `role="alert"` 并接入 `aria-describedby`。
- **快捷键**:`shortcuts="letters" | "numbers"`;优先用 `items` 定义里的 choice 顺序,
  否则按渲染顺序;显示在选项右侧,`aria-keyshortcuts` 同步。
- **键盘**:上下箭头在答案间移动(radio 会 `click()`)、左右箭头切题、
  Esc/快捷键支持;可输入控件不劫持方向键。
- **进度**:`role="progressbar"` + `aria-valuenow/min/max/text`,`children` 传函数可拿到
  render state(`current/first/last/total`)自绘。
- **无障碍**:Item 是 `fieldset`、Title 是 `legend`;非激活项 `hidden` + `inert`;
  `data-active/data-status/data-invalid` 等状态属性齐全。

## 4. 复用与内部合并

- **复用现有组件**:导航按钮直接用仓库 `Button`(variant/size 透传);示例用 `Card`/`Dialog`
  组合(与上游一致)。`QuestionnaireActions` 是纯布局辅助。
- **内部合并**:`QuestionnaireChoiceInput` / `ChoiceLabel` / `ChoiceShortcut` 在 styled 版里
  也未作为公共部件导出,本仓库把它们合并进 `QuestionnaireChoice`(原生 input + 指示器 +
  文字 + 快捷键),减少公共面。

## 5. 与上游的差异

- 上游用 Base UI / `@shadcn/react` 的 render 机制(`render={<CardTitle/>}`、
  `UseRenderComponentProps`);本仓库统一用 `component` 多态(Title/Description/Error),
  Progress 的自定义用 children 函数。
- 上游 `cn-questionnaire-*` 主题 token **未作为 token 层移植**,但已按 `apps/v4/registry/styles/style-nova.css`
  里 base/nova 的实际取值逐条内联到组件类名(标题 text-base/leading-snug/font-medium、
  选项 rounded-lg/px-3/py-2.5/gap-2.5、指示器 size-4、快捷键徽标 size-5/mono/0.625rem、
  输入 h-8/rounded-lg、进度 text-xs 等),与截图一致;换 theme 仍需主题 token 层。
- 上游 `Progress`/`Choice` 等把 state 全量映射成 `data-*`;本仓库只映射常用键
  (`data-active/status/invalid/checked/disabled/type/shortcut/filled/empty/visible/hidden`)。
- 上游在 dev 下会校验 `items` 定义与渲染出的 Item/Choice 是否一致(重复名、缺失、顺序不同);
  本仓库暂未实现这些 console 警告。

## 6. 第三方依赖

上游及示例涉及、而本仓库**没有引入**的依赖,以及现状/替代:

| 依赖 | 用在哪 | 现状 | 未来实现 |
| --- | --- | --- | --- |
| `@shadcn/react/questionnaire`(headless) | 全部行为 | 手写 `useQuestionnaireRoot/Item/Choice/Input` 复刻核心语义 | 若要对齐边界情况,可对照其测试用例补 |
| `cn-questionnaire-*`(主题 token) | 全部样式 | 内联 Tailwind 类 | 引入主题 token 后迁移 |
| `zod` | Custom Validation 示例 | dev 示例改为手写校验(等价逻辑) | 需要 schema 校验时由使用方接入 |
| `sonner`(toast) | 各示例提交反馈 | dev 用内联 `role="status"` 结果行替代 | 挂载 Toaster 后可换成 toast |
| `NativeSelect` | Shortcuts 示例的模式选择 | dev 用原生 `<select>` 替代 | 需要统一外观时用仓库 Select |

> 结论:问卷的完整交互与无障碍已在本仓库内实现,**未新增任何运行时依赖**;
> 上表是文字/样式层面的替代,不改变组件行为。

## 7. 示例

`dev/examples/questionnaire.tsx`:Demo、Multiple Selection、Freeform Answer、Explicit Skip、
Shortcuts、Custom Validation、Controlled、Resume、Conditional Items、Navigation State、
Custom Progress、Animated Items、Card、Dialog。

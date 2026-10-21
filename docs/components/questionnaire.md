# Questionnaire

多步问卷：单选/多选/自由作答、跳过、校验、快捷键、进度与键盘导航。

```tsx
import {
    Questionnaire,
    QuestionnaireActions,
    QuestionnaireChoice,
    QuestionnaireChoices,
    QuestionnaireDescription,
    QuestionnaireError,
    QuestionnaireItem,
    QuestionnaireNext,
    QuestionnaireProgress,
    QuestionnairePrevious,
    QuestionnaireSubmit,
    QuestionnaireTitle,
} from "@neut/ui";

<Questionnaire
    defaultItem="name"
    items={[
        { name: "name", required: true, choices: [{ value: "a" }, { value: "b" }] },
        { name: "note" },
    ]}
    shortcuts="letters"
    onSubmit={(event) => console.log(new FormData(event.currentTarget))}
>
    <QuestionnaireProgress />
    <QuestionnaireItem name="name" required>
        <QuestionnaireTitle>你的名字？</QuestionnaireTitle>
        <QuestionnaireDescription>请选择或填写。</QuestionnaireDescription>
        <QuestionnaireChoices>
            <QuestionnaireChoice value="a">A</QuestionnaireChoice>
            <QuestionnaireChoice value="b">B</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
    </QuestionnaireItem>
    <QuestionnaireItem name="note">
        <QuestionnaireTitle>备注</QuestionnaireTitle>
        <QuestionnaireInput type="text" />
    </QuestionnaireItem>
    <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireNext />
        <QuestionnaireSubmit />
    </QuestionnaireActions>
</Questionnaire>;
```

## 根 props

| Prop | 类型 | 说明 |
| :--- | :--- | :--- |
| `defaultItem` | `string` | 非受控初始激活项 |
| `item` | `string` | 受控激活项 |
| `onItemChange` | `(item: string) => void` | 激活项变化 |
| `items` | `QuestionnaireItemDefinition[]` | 题目定义：分配快捷键、校验 name/required 一致性 |
| `shortcuts` | `"letters" \| "numbers"` | 答案快捷键模式 |
| `noValidate` | `boolean`（默认 true） | 关闭浏览器原生校验，走组件校验 |
| `onReset` / `onSubmit` | — | 表单事件 |

## 子部件

| 组件 | 关键 props |
| :--- | :--- |
| `QuestionnaireProgress` | `children` 可传函数：`(state: { current, first, last, total }) => JSX` |
| `QuestionnaireItem` | `name`、`required`、`multiple`、`disabled`、`invalid`、`onStatusChange(status)` |
| `QuestionnaireTitle` / `QuestionnaireDescription` / `QuestionnaireError` | 多态；`id` 参与 `aria-*` 关联 |
| `QuestionnaireChoices` | 选项容器 |
| `QuestionnaireChoice` | `value`、`checked`/`defaultChecked`、`disabled`、`onChange` |
| `QuestionnaireInput` | 原生输入类型；`type` 限定 date/email/number/text/... |
| `QuestionnaireActions` | 导航按钮容器 |
| `QuestionnairePrevious` / `Skip` / `Next` / `Submit` | 自动按题目状态显隐；`variant`/`size` 透传 Button |

## 状态与校验

- 题目状态：`unanswered`、`answered`、`skipped`；变化时回调 `onStatusChange`。
- `required` + `invalid` + `touched`；`invalid` 时设置 `aria-invalid`，错误 `role="alert"` 并接入 `aria-describedby`。
- 非激活项 `hidden` + `inert`；Item 是 `fieldset`、Title 是 `legend`。
- 答案不集中存放在 Root：每个 Item 维护答案注册表；提交时读取表单 `FormData`。
- `QuestionnaireChoice` 单选用 radio、`multiple` 时用 checkbox；未选中的自由输入用 `form=""` 排除出 FormData。

## 键盘

- 上下箭头在答案间移动；左右箭头切题；Enter / Mod+Enter 提交。
- 可输入控件不劫持方向键；Esc 可用于退出输入焦点。
- `shortcuts` 会同步到 `aria-keyshortcuts`。

完整设计见 [Questionnaire DESIGN](../../src/components/questionnaire/DESIGN.md)。

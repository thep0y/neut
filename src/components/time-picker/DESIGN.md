# TimePicker 组件设计方案(SRP)

> 状态:**P1 已实现**(按钮触发 + 弹出滚动列;24h/12h、秒、步长)
> 移植目标:**无上游对应组件**(shadcn 无 TimePicker),按本仓库约定从零设计
> 关联代码:`src/components/time-picker/`

## 1. 背景与目标

- 提供一个生产可用的时间选择器,复用仓库已有组件构建:浮层用 `Popover`,
  触发器用 `Button`/`PopoverTrigger`,不使用任何上游组件库运行时。
- 形态:**按钮触发 + Popover 面板内多列滚动选择**(时/分/秒/AM-PM),
  而不是「一排下拉框」;列在一个面板里连续滚动,触控/键盘体验更好。
- 值模型:`Date | undefined`,只把时间部分当语义,**保留日期部分**,
  与 `DatePicker`/`Calendar` 的类型保持一致。

## 2. 设计目标与 SRP 分解

| 关注点     | 归属文件                                    | 职责                                                                |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------- |
| 类型契约   | `TimePicker/TimePicker.types.ts`            | 只声明 props / context / 事件详情类型                               |
| 纯时间算法 | `TimePicker/time-picker.utils.ts`           | 选项生成、单位读写、12/24 换算、格式化(无 Solid 依赖,可独立测试)    |
| 事件详情   | `TimePicker/create-change-event-details.ts` | 构造 `cancel()` / `isCanceled` 语义                                 |
| 唯一状态源 | `TimePicker/TimePicker.context.ts`          | 受控/非受控值、派生选项、列注册表、Context + `useTimePickerContext` |
| 根组装     | `TimePicker/TimePicker.tsx`                 | 组装 Provider + Popover,默认/自定义子组件二选一                     |
| 触发器     | `TimePickerTrigger/TimePickerTrigger.tsx`   | 复用 `PopoverTrigger` 的 ARIA 与引用,展示格式化时间                 |
| 浮层       | `TimePickerContent/TimePickerContent.tsx`   | 复用 `PopoverContent`,按 units 渲染列,打开时聚焦首列                |
| 单列交互   | `TimePickerColumn/useTimePickerColumn.ts`   | 选项派生、键盘(↑↓/Home/End/←→)、提交、滚动入视                      |
| 单列渲染   | `TimePickerColumn/TimePickerColumn.tsx`     | `role="listbox"` + `aria-activedescendant`                          |
| 选项       | `TimePickerOption/TimePickerOption.tsx`     | `role="option"` + data-* 状态                                       |

### 文件结构

```
src/components/time-picker/
├── index.ts                       # 公开出口
├── DESIGN.md
├── TimePicker/
│   ├── index.ts
│   ├── TimePicker.tsx
│   ├── TimePicker.types.ts
│   ├── TimePicker.context.ts      # createTimePickerState + Context + hook
│   ├── time-picker.utils.ts
│   └── create-change-event-details.ts
├── TimePickerTrigger/
├── TimePickerContent/
├── TimePickerColumn/              # useTimePickerColumn.ts 为交互算法
└── TimePickerOption/
```

## 3. 类型契约

```ts
type TimePickerHourCycle = 12 | 24;
type TimePickerUnit = "hour" | "minute" | "second" | "meridiem";
type TimePickerUnitValue = number | "AM" | "PM";

interface TimePickerProps extends ParentProps {
    value?: Date;
    defaultValue?: Date;
    onValueChange?: (
        value: Date | undefined,
        details: TimePickerChangeEventDetails,
    ) => void;
    hourCycle?: 12 | 24; // 默认 24
    showSeconds?: boolean; // 默认 false
    hourStep?: number;
    minuteStep?: number;
    secondStep?: number; // 默认 1
    locale?: string; // 影响 AM/PM 文案
    disabled?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    formatTime?: (date: Date) => string;
    dir?: "ltr" | "rtl" | "auto";
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}
```

- `onValueChange` 第二参对齐仓库既有的 `ChangeEventDetails`(`reason` / `event`
  / `trigger` / `cancel()` / `allowPropagation()` / `isCanceled`)。
- `TimePickerContextValue` 暴露 `value` / `setUnitValue` / `units` / `getOptions`
  / `getUnitValue` / `getUnitLabel` / `activeUnit` / 列注册表,供自定义子组件复用。

## 4. 状态管理(`TimePicker.context.ts`)

- **受控/非受控**:`props.value !== undefined` 即受控(只回调、不写内部),否则写内部 signal
  并照常回调;与 `DatePicker` 完全一致。
- **时间单位合并**:`withUnit(date, unit, value, hourCycle)` 只改目标字段,其余(含日期)不变。
- **无值基准**:无值时以组件创建时刻为 `baseDate`,首次选择只改动对应字段。
- **列注册表**:Map<unit, HTMLElement>,列挂载时注册、卸载时注销,供左右方向键跨列聚焦。
- **cancel 语义**:先派发 `onValueChange`,回调里 `cancel()` 则组件不提交;非受控才写内部状态。

## 5. 列交互模型

- 焦点停在列本身(`role="listbox"`,`tabindex=0`),选中/高亮用 `aria-activedescendant` 表达
  (与 `Select` 的口径一致,焦点不逐个落在 option 上)。
- 选项与高亮**合一**:↑/↓ 移动即提交(符合时钟选择预期),`aria-selected` 恒等于当前值。
- 键盘:↑/↓ 列内移动(循环)、Home/End 首尾、←/→ 在列之间切换并聚焦、Enter/Space 阻止页面滚动
  (值已提交)、Esc 关闭(由 `PopoverContent` 负责)。
- 步长:选项按 step 生成;若当前值不在步长上(`minuteStep=15` 而值为 :07),不做悬空的
  `aria-activedescendant`,用户交互后才吸附。

## 6. 无障碍(ARIA)

| 元素   | 属性                                                         | 值                                    |
| ------ | ------------------------------------------------------------ | ------------------------------------- |
| 触发器 | `aria-haspopup` / `aria-expanded` / `aria-controls`          | 由 `PopoverTrigger` 提供(`dialog`)    |
| 浮层   | `role`                                                       | `"dialog"`(由 `PopoverContent` 提供)  |
| 列     | `role` / `aria-label` / `tabindex` / `aria-activedescendant` | `"listbox"` / Hour… / `0` / 选中项 id |
| 选项   | `role` / `aria-selected` / `aria-disabled`                   | `"option"` / 当前值 / disabled        |

`data-slot`:`time-picker-columns` / `time-picker-column`;选项输出
`data-selected` / `data-highlighted` / `data-disabled`,接通 `data-*` 变体样式。
（触发器与浮层沿用 `popover-trigger` / `popover-content`,与 `DatePicker` 的做法一致。）

## 7. 边界情况与决策记录

1. **12h 的 12 AM/PM 映射**:内部一律存 24h;12h 列按展示值 1..12 直接生成,避免映射重复项。
2. **`showSeconds`/`minuteStep`**:选项由纯函数生成;`hourStep` 在 12h 下也按展示值步进。
3. **AM/PM 文案**:走 `Intl.DateTimeFormat.formatToParts`,不硬编码英文。
4. **无值时**:以创建时刻为基准,不把整个日期重置为今天零点。
5. **RTL**:`dir="rtl"` 时左右方向键语义反转(仅列切换方向)。
6. **列渲染不用 `ScrollArea`**:`ScrollArea` 的 viewport 固定 `role="region"`,会让 listbox
   的 required-owned-elements 中间夹一层;为保证 ARIA 正确,列用原生滚动容器
   (`overflow-y-auto` + `scrollbar-thin`),它自身就是 listbox。
7. **`DatePicker` 关系**:两者值类型一致,但独立实现;需要「日期+时间」时由使用者组合。
8. **打开时锁定页面滚动**:由 `Popover` 在 `open() && lockScroll()`(`lockScroll` 默认
   `true`)时调用全局 `useScrollLock`(见 `src/hooks/useScrollLock.ts`),锁住文档滚动并拦截
   浮层之外的滚轮/触摸;`[data-slot="popover-content"]` 内仍可滚动,所以时间列照常可用。
   该 hook 已从 context-menu 内部提升为共享 hook,引用计数支持多浮层同时持锁。
9. **列不用 `Select`**:面板要的是「一个复合控件里始终可见的时/分/秒列,连续滚动或方向键调整」。
   `Select` 的模型是「折叠触发器 + 独立浮层」,每个单位一个 `Select` 会退化成一排下拉框,并带来
   多层浮层的开关与焦点归还协调;它的「选中项对齐 / matchWidth / content 常驻以维持 label 注册表」
   等设计也面向单个折叠下拉,并不适合作常显列。因此列自绘为 `role="listbox"`(`aria-activedescendant`
   表达高亮、↑↓ 移动即提交、←→ 跨列聚焦),但与 `Select` 保持同一套 ARIA 口径(`role=option` /
   `data-*` 状态属性)。若确需「一排下拉框」形态,后续可加 `columns="select"` 变体复用 `Select`
   (参考 `Calendar` 的 dropdown caption layout)。

## 8. 分期与待办

- **P1(已完成)**:utils + 根状态/Context + 按钮触发 + Popover 滚动列 + Option + dev 示例。
- **P2(待做)**:`min`/`max` 时间界(禁用越界选项)、清空、可键入的 `TimePickerInput`
  (`parseTime` + `InputGroup`)、表单隐藏 input(`name`/`required`)。
- **P3(待做)**:`parseTime`、`DESIGN.md` 补充、纯算法单测、a11y 走查、可选 `ToggleGroup` 版 AM/PM。

## 9. 使用示例

```tsx
// 开箱即用
<TimePicker value={time()} onValueChange={(v) => setTime(v)} />

// 组合式(自定义触发器 / 接 FieldLabel)
<TimePicker value={time()} onValueChange={(v) => setTime(v)} hourCycle={12}>
  <TimePickerTrigger id="meeting-time" />
  <TimePickerContent />
</TimePicker>
```

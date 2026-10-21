# Calendar 组件设计方案

> 状态:**P1 完成**(single/multiple/range、月份导航、label/dropdown 标题、classNames)
> 移植目标:shadcn 的 `Calendar`（底层是 react-day-picker 的 props 语义）
> 关联代码:`src/components/calendar/`

## 1. 概述

不引入 `react-day-picker`，用纯函数生成月网格、用 `CalendarDay` 渲染每一格：

```
Calendar                  # 受控/非受控 selected 与 month;多月份并排
└── CalendarMonth         # 翻月导航 + 标题 + 星期表头 + 周
    ├── CalendarMonthCaption  # label 或 month/year dropdown
    └── CalendarDay       # 单格:selected/outside/today/disabled/range 状态
```

## 2. SRP 分工

| 关注点 | 文件 |
| --- | --- |
| 类型契约 | `Calendar/Calendar.types.ts` |
| 根状态与多月份编排 | `Calendar/Calendar.tsx` |
| 单月视图 | `Calendar/CalendarMonth.tsx` |
| 标题(文本/下拉) | `Calendar/CalendarMonthCaption.tsx` |
| 单格渲染 | `Calendar/CalendarDay.tsx` |
| 日期算法(月/周/格式) | `Calendar/Calendar.utils.ts` |
| 选项生成(min/max、月份/年份下拉) | `Calendar/Calendar.options.ts` |
| 选择推导(单选/多选/范围) | `Calendar/Calendar.selection.ts` |
| 默认 classNames | `Calendar/Calendar.styles.ts` |

## 3. 状态模型

- `selected` / `defaultSelected`：受控/非受控；类型随 `mode` 变化：
  `Date`、`Date[]`、`{ from?, to? }`。
- `month` / `defaultMonth`：受控/非受控展示月份；`onMonthChange` 在翻月/下拉时触发。
- `commitSelected`：非受控写内部信号，然后总是回调 `onSelect`。
- `numberOfMonths`：从当前月开始并排生成 N 个月。
- `min`/`max`：同时限制日期与月份导航（`canMovePrev` / `canMoveNext`）。

## 4. 渲染

- 网格区间：`startOfWeek(startOfMonth(month))` 到 `endOfWeek(下月前一天)`；
  每 7 天切一周。
- `showOutsideDays=false` 时非本月日期加 hidden 类（仍渲染以保持网格对齐）。
- `showWeekNumber` 显示 ISO 周数。
- `captionLayout="dropdown"` 时标题变成月份/年份下拉，选项受 `min`/`max` 限制。
- `classNames` 的键与 react-day-picker 对齐（见 [Calendar 用法](../../../docs/components/calendar.md)）；
  默认值在 `Calendar.styles.ts`。

## 5. 状态属性

- 按钮：`aria-pressed`、`data-day`、`data-selected-single`、`data-range-start`、
  `data-range-middle`、`data-range-end`；禁用时原生 `disabled`。
- 外层格：`aria-disabled`、`data-selected`。
- classNames 还提供 `outside` / `today` / `disabled` / `range_*` 的样式钩子。

## 6. 已知缺口

- **没有实现** `role="grid"` 与方向键在日期间的 roving focus；每个日期是原生按钮，
  用 Tab 逐个聚焦。需要完整网格键盘语义时需在应用层补，或作为后续迭代。
- 不支持自定义文案函数（只用 `Intl` + `locale`）。
- 没有周数点击/周选择、没有 `fromDate`/`toDate` 之外的复杂范围规则。

# Calendar

日历组件，支持单选、多选与范围选择。没有引入 `react-day-picker`，而是自研渲染与键盘逻辑。

```tsx
import { Calendar } from "@neut/ui";
import { createSignal } from "solid-js";

const [date, setDate] = createSignal<Date | undefined>(new Date());

<Calendar mode="single" selected={date()} onSelect={(next) => setDate(next as Date | undefined)} />;

<Calendar mode="range" defaultSelected={{ from: new Date(), to: undefined }} />;
```

## Props

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `mode` | `"single" \| "multiple" \| "range"` | `"single"` | 选择模式 |
| `selected` / `defaultSelected` | `Date \| Date[] \| DateRange \| undefined` | — | 受控/非受控值 |
| `onSelect` | `(selected) => void` | — | 选择变化 |
| `month` / `defaultMonth` | `Date` | — | 受控/非受控展示月份 |
| `onMonthChange` | `(month: Date) => void` | — | 月份变化 |
| `numberOfMonths` | `number` | `1` | 并排月数 |
| `showOutsideDays` | `boolean` | `true` | 显示上/下月日期 |
| `showWeekNumber` | `boolean` | `false` | 周数列 |
| `weekStartsOn` | `0…6` | `0` | 一周起始（0 = 周日） |
| `captionLayout` | `"label" \| "dropdown"` | `"label"` | 标题或月份/年份下拉 |
| `locale` | `string \| { code? }` | — | Intl locale |
| `min` / `max` | `Date` | — | 可选范围 |
| `disabled` | `boolean \| (date) => boolean` | — | 禁用 |
| `buttonVariant` | `ButtonVariant` | — | 导航按钮样式 |
| `classNames` | `Partial<CalendarClassNames>` | — | 局部类名覆盖 |

`CalendarClassNames` 的键与 shadcn/react-day-picker 对齐：`root`、`months`、`month`、`nav`、
`button_previous`、`button_next`、`month_caption`、`dropdowns`、`dropdown_root`、`dropdown`、
`caption_label`、`month_grid`、`weekdays`、`weekday`、`week`、`week_number_header`、`week_number`、
`day`、`outside`、`disabled`、`hidden`、`today`、`range_start`、`range_middle`、`range_end`。

## 无障碍与状态

- 每个日期是原生 `<button>`，因此可以用 Tab 聚焦、Enter/Space 选择；选中状态用 `aria-pressed`。
- 当前月份由导航按钮切换（`aria-label="Previous month"` / `"Next month"`）。
- **没有实现** `role="grid"` 与方向键在日期间的 roving focus；需要完整网格键盘语义时请自行在
  `Calendar` 外层补充，或使用其他日历组件。
- 范围选择的中间态通过 `data-range-start` / `data-range-middle` / `data-range-end` 表达。
- 今天、禁用、非本月日期不是 `data-*` 属性，而是分别通过 `classNames.today` /
  `classNames.disabled` / `classNames.outside` 加类名；禁用日期同时有原生 `disabled`。

## 与 DatePicker 的关系

[DatePicker](./../components.md) 是 `Popover + Calendar + Button` 的组合；需要独立日历（例如内嵌面板）时直接用 `Calendar`。

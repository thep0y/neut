# TimePicker

时间选择器：小时/分钟/秒列，支持 12/24 小时制、步长、键盘与受控开合。

```tsx
import { TimePicker } from "@neut/ui";
import { createSignal } from "solid-js";

const [value, setValue] = createSignal<Date | undefined>(new Date());

<TimePicker
    value={value()}
    onValueChange={(next, details) => {
        if (details.reason === "clear") setValue(undefined);
        else setValue(next);
    }}
    hourCycle={24}
    minuteStep={5}
    showSeconds={false}
    placeholder="选择时间"
/>;
```

## Props

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `value` | `Date` | — | 受控值 |
| `defaultValue` | `Date` | — | 非受控初始值 |
| `onValueChange` | `(value, details) => void` | — | `value` 可为 `undefined`（清空） |
| `hourCycle` | `12 \| 24` | `24` | 12 小时制额外出现 AM/PM 列 |
| `showSeconds` | `boolean` | `false` | 显示秒列 |
| `hourStep` / `minuteStep` / `secondStep` | `number` | `1` | 列步长 |
| `locale` | `string` | — | 影响 AM/PM 文案 |
| `disabled` / `readOnly` | `boolean` | `false` | 状态 |
| `placeholder` | `string` | — | 触发器占位 |
| `formatTime` | `(date) => string` | 24h `HH:mm[:ss]` | 触发器格式化 |
| `dir` | `"ltr" \| "rtl" \| "auto"` | `"ltr"` | 左右方向键跨列方向 |
| `open` / `defaultOpen` / `onOpenChange` | — | — | 受控开合 |

## 子部件

- `TimePickerTrigger`、`TimePickerContent`、`TimePickerColumn`、`TimePickerOption`
- `useTimePickerContext()`：`value`、`setUnitValue(unit, value, options)`、`units`、`getOptions(unit)`、
  `getUnitValue(unit)`、`activeUnit`、`registerColumn` 等。

## 事件详情

`details.reason`：`"option-press"`、`"keyboard"`、`"clear"`、`"input"`、`"none"`。
`cancel()` 可阻止提交；受控模式下组件本就不提交。

## 键盘

- 列内：`ArrowUp` / `ArrowDown` 环形移动并**立即提交**；`Home` / `End` 跳到首/末项并提交。
- 列间：`ArrowLeft` / `ArrowRight` 聚焦相邻列（受 `dir` 影响）；`Enter` / `Space` 只阻止页面滚动。
- 焦点停在列（`role="listbox"`、`tabindex=0`），当前项用 `aria-activedescendant` 表达；
  选项是 `role="option"`，选中项带 `data-highlighted="true"`。

完整设计见 [TimePicker DESIGN](../../src/components/time-picker/DESIGN.md)。

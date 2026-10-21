# NumberInput

带步进、范围限制与解析/格式化的数字输入。`value === null` 表示空值（与受控的 `undefined` 区分）。

```tsx
import { NumberInput } from "@neut/ui";
import { createSignal } from "solid-js";

const [value, setValue] = createSignal<number | null>(null);

<NumberInput
    value={value()}
    onValueChange={(next, details) => {
        if (details.reason === "blur" && next === null) details.cancel();
        else setValue(next);
    }}
    min={0}
    max={100}
    step={1}
    largeStep={10}
/>;
```

## Props

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `value` | `number \| null` | — | 受控值；`null` 表示空 |
| `defaultValue` | `number \| null` | — | 非受控初始值 |
| `onValueChange` | `(value, details) => void` | — | 值变化；可在 `details.cancel()` 里否决 |
| `min` / `max` | `number` | — | 范围 |
| `step` | `number` | `1` | 按钮/方向键步长 |
| `largeStep` | `number` | `step * 10` | PageUp/PageDown 步长 |
| `parse` | `(text) => number \| null` | 十进制解析 | 解析失败返回 `null` |
| `format` | `(value) => string` | `String(value)` | 失焦/步进后的回显 |
| `disabled` / `readOnly` / `required` / `name` / `id` / `placeholder` | — | — | 原生语义 |

## 事件详情

`details.reason` 取值：`"input"`、`"button-press"`、`"keyboard"`、`"blur"`、`"none"`。
`cancel()` 在组件落状态前调用才有效；`isCanceled` 是实时 getter。

更多取舍见 [NumberInput DESIGN](../../src/components/number-input/DESIGN.md)。

# NumberInput 组件设计方案(SRP)

> 状态:**P1 已实现**(便捷封装:减/加按钮 + 输入框 + 键盘/步进/clamp)
> 移植目标:**base-ui NumberField 的语义**(shadcn 无对应组件)
> 关联代码:`src/components/number-input/`

## 1. 背景与目标

原生 `<input type="number">` 的问题:

- 步进器(spinner)样式丑陋,且各浏览器不统一,shadcn 风格下无法接受。
- 行为不一致:`maxlength` 无效;`e`/`E`/`+`/`-`/`.` 可输入;非法输入时 `value` 变空串;
  滚轮意外改值;`step` 校验与 clamp 时机因浏览器而异;locale 小数点(`.`/`,`)与千分位不统一;
  长按加减没有连续步进。

目标:提供一个风格统一、行为可控的数字输入组件。输入框用 `type="text"` +
`inputmode="decimal"` + `role="spinbutton"`,彻底绕开原生 spinner。

## 2. 复用

| 需要 | 复用 |
| --- | --- |
| 输入组布局 | `InputGroup`、`InputGroupAddon` |
| 输入框 | `InputGroupInput`(内部 `Input`) |
| 减/加按钮 | `InputGroupButton`(内部 `Button`) |
| 图标 | `lucide-solid` 的 `Minus` / `Plus` |
| 事件详情 | 对齐仓库既有的 `ChangeEventDetails`(`reason`/`cancel()`/`isCanceled`) |

## 3. API(P1)

```ts
interface NumberInputProps extends BaseProps {
  value?: number | null; defaultValue?: number | null;
  onValueChange?: (value: number | null, details: NumberInputChangeEventDetails) => void;
  min?: number; max?: number;
  step?: number;        // 按钮/方向键步长,默认 1
  largeStep?: number;   // PageUp/PageDown,默认 step * 10
  disabled?: boolean; readOnly?: boolean; required?: boolean;
  name?: string; placeholder?: string; id?: string;
  "aria-label"?: string;
  format?: (value: number) => string;      // 失焦/步进后回显
  parse?: (text: string) => number | null; // 解析失败返回 null
}
```

## 4. 交互

- **点击/键盘步进**:减/加按钮、↑/↓(`step`)、PageUp/PageDown(`largeStep`)、
  Home/End(`min`/`max`)、Enter 提交并 clamp、Esc 还原显示。
- **输入**:输入过程中即时通知(不 clamp,允许敲入越界中间值);
  **失焦**时 clamp 并重新格式化;空/非法输入在失焦时提交 `null`。
- **受控/非受控**:`props.value !== undefined` 即受控(只回调),否则写内部 signal。
- **按钮禁用**:到达 `min`/`max` 或 `disabled`/`readOnly` 时对应按钮禁用。

## 5. 无障碍

- 输入框:`role="spinbutton"`、`aria-valuenow/min/max`、`inputmode="decimal"`。
- 按钮:`aria-label`("Decrease"/"Increase"),仅图标时由 `Button` 输出 `sr-only` 文本。

## 6. 边界与决策记录

1. **不用 `type="number"`**:见第 1 节;改用文本 + `role="spinbutton"`,由组件负责解析/格式/步进。
2. **输入不即时 clamp**:否则用户无法把 "5" 改成 "15"(min=10 会被立刻顶回);改为失焦/回车收敛。
3. **浮点误差**:`roundToStep` 按 `step` 的小数位数四舍五入(如 `0.1+0.2`)。
4. **解析**:默认接受十进制文本,","作小数点;空、`-`、`.` 视为无效(返回 `null`)。
5. **不做破坏性改动**:`Input type="number"` 保持原样。

## 7. 后续待实现(P2/P3)

- **P2**
  - 可组合 parts:`NumberInputRoot` / `NumberInputInput` / `NumberInputIncrement` /
    `NumberInputDecrement`,以及 `NumberInputGroup`,支持自定义按钮位置/图标/布局。
  - 长按加减**连续步进**(按住持续,可加速)。
  - `Intl.NumberFormat` 格式化与 locale(小数点、千分位、货币/百分比)、精度控制。
  - `allowWheelScrub`(默认关闭,避免误触)。
  - `smallStep`(Alt+方向键)与更细的步进策略。
  - 表单集成:隐藏 input(`name`)提交 canonical 值、`required` 校验。
- **P3**
  - `NumberInputScrubArea`:拖拽调节(对齐 base-ui NumberField.ScrubArea)。
  - `format`/`parse` 的默认实现迁到 `Intl`,并支持 `Intl.NumberFormatOptions`。
  - 纯算法单测(clamp / roundToStep / parse)、a11y 走查、dev 示例补全。

## 8. 使用示例

```tsx
const [qty, setQty] = createSignal<number | null>(1);

// 便捷封装
<NumberInput
  value={qty()}
  onValueChange={(value) => setQty(value)}
  min={1}
  max={99}
  aria-label="Quantity"
/>
```

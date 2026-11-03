# Select

下拉选择。与 shadcn 的用法一致；浮层定位统一用 `side`/`align`，默认通过 `alignItemWithTrigger` 启用“选中项对齐”模型。

```tsx
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@neut/ui";

<Select defaultValue="solid" onValueChange={(value) => console.log(value)}>
    <SelectTrigger class="w-48">
        <SelectValue placeholder="选择框架" />
    </SelectTrigger>
    <SelectContent side="bottom" align="start">
        <SelectItem value="solid">Solid</SelectItem>
        <SelectItem value="react">React</SelectItem>
        <SelectItem value="vue">Vue</SelectItem>
    </SelectContent>
</Select>;
```

## 根 props

| Prop | 类型 | 说明 |
| :--- | :--- | :--- |
| `value` | `T \| null` | 受控值；`null` 表示清空，`undefined` 表示非受控 |
| `defaultValue` | `T` | 非受控初始值 |
| `onValueChange` | `(value: T) => void` | 选择变化 |
| `open` / `defaultOpen` / `onOpenChange` | — | 受控开合 |
| `disabled` | `boolean` | 禁用 |
| `lockScroll` | `boolean`（默认 true） | 打开时锁页面滚动 |

## 子部件

| 部件 | 说明 |
| :--- | :--- |
| `SelectTrigger` | 默认渲染 `Button`（`variant="outline"`）；`role="combobox"`，带 ChevronDown |
| `SelectValue` | 展示当前 label；`placeholder` |
| `SelectContent` | `side`/`align`（默认 `"bottom"`/`"start"`）、`sideOffset`/`alignOffset`、`alignItemWithTrigger`（默认 `true`）、`collisionPadding`；`role="listbox"` |
| `SelectItem` | `value`、`label`、`disabled`；`role="option"` |
| `SelectGroup` / `SelectLabel` / `SelectSeparator` | 分组与分隔 |

## 定位模型

`SelectContent` 的定位 props 与 Popover / Dropdown / Tooltip 保持一致：

```tsx
<SelectContent side="top" align="start">
    …
</SelectContent>

// 关闭“选中项对齐”，退化成普通贴边下拉
<SelectContent side="bottom" align="start" alignItemWithTrigger={false}>
    …
</SelectContent>
```

- **`alignItemWithTrigger`（默认 `true`）**
  - 有选中值时：让选中项本身盖在 trigger 上，避免长列表里“面板打开了但选中项在屏幕外”；
    此时 `side` / `align` / `sideOffset` / `alignOffset` 不生效。
  - 没有选中值时：按 `side` / `align` 贴 trigger 摆放。
- **`alignItemWithTrigger={false}`**：始终按 `side` / `align` 贴边摆放，和 Popover / Dropdown 完全一致。
- 默认 `side="bottom"`、`align="start"`、`sideOffset={4}`、`alignOffset={0}`。
- 渲染元素上会写 `data-side` / `data-align` / `data-placement`；进入选中项对齐时
  `data-side="none"`（与 Base UI 一致）。
- `placement` 是**已弃用**的兼容参数，仍可继续使用，并会推导出对应的
  `data-side`/`data-align`；新代码请直接用 `side`/`align`，1.0 会移除。

> 当前只根据“是否有选中值”切换模式；Base UI 那套“触摸打开 / 视口空间不足时自动回退到
> side/align”尚未实现。

## 行为细节

- `SelectTrigger` 的点击/键盘由 `useSelectTrigger` 处理，`aria-controls` 指向打开时的 listbox。
- `SelectContent` 关闭时**不卸载子节点**，而是用 `visibility` 隐藏；否则 `SelectItem` 注销后
  `SelectValue` 无法再用 item.label 渲染已选值。
- 键盘：`ArrowUp`/`ArrowDown` 移动高亮，`Enter`/`Space` 选择，`Escape` 关闭，`Tab` 关闭。
- 点击外部在捕获阶段监听并 `stopPropagation`，避免点击穿透到下方元素。

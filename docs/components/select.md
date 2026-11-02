# Select

下拉选择。与 shadcn 的用法一致，但定位采用“选中项对齐”模型，`SelectContent` 用 `placement` 而不是 `side`/`align`。

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
    <SelectContent>
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
| `SelectContent` | `placement`（默认 `"bottom-start"`）、`collisionPadding`；`role="listbox"` |
| `SelectItem` | `value`、`label`、`disabled`；`role="option"` |
| `SelectGroup` / `SelectLabel` / `SelectSeparator` | 分组与分隔 |

## 定位模型

- 没有选中值时，按 `placement` 贴 trigger 摆放。
- 有选中值时切换成“选中项对齐”：让选中项本身盖在 trigger 上，避免长列表里出现“面板打开了但选中项在屏幕外”。
- 因此 `SelectContent` 没有 `side`/`align` 两个独立 prop；需要固定位置时用 `placement`。

## 行为细节

- `SelectTrigger` 的点击/键盘由 `useSelectTrigger` 处理，`aria-controls` 指向打开时的 listbox。
- `SelectContent` 关闭时**不卸载子节点**，而是用 `visibility` 隐藏；否则 `SelectItem` 注销后
  `SelectValue` 无法再用 item.label 渲染已选值。
- 键盘：`ArrowUp`/`ArrowDown` 移动高亮，`Enter`/`Space` 选择，`Escape` 关闭，`Tab` 关闭。
- 点击外部在捕获阶段监听并 `stopPropagation`，避免点击穿透到下方元素。

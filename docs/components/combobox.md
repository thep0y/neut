# Combobox

可搜索、可多选的 combobox：组合 `InputGroup` + listbox + 虚拟高亮（`aria-activedescendant`）。

```tsx
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxTrigger,
} from "@neut/ui";
import { createSignal } from "solid-js";

const items = ["React", "Solid", "Svelte", "Vue"];
const [value, setValue] = createSignal<(typeof items)[number] | null>(null);

<Combobox items={items} value={value()} onValueChange={setValue}>
    <ComboboxInput placeholder="选择框架…" showClear>
        <ComboboxTrigger />
    </ComboboxInput>
    <ComboboxContent>
        <ComboboxEmpty>没有匹配项</ComboboxEmpty>
        <ComboboxList>
            {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
    </ComboboxContent>
</Combobox>;
```

## 根 props

| Prop | 类型 | 说明 |
| :--- | :--- | :--- |
| `items` | `T[]` | 数据源；分组时传“分组对象”数组（每项含 `items`），由 `ComboboxCollection` 渲染组内项 |
| `value` / `defaultValue` | `T \| T[] \| null` | 受控/非受控值 |
| `multiple` | `boolean` | 多选（配合 `ComboboxChips`） |
| `onValueChange` | `(value, details) => void` | `details.reason`：item-press / trigger-press / clear-press / input-change / chip-remove / none |
| `open` / `defaultOpen` / `onOpenChange` | — | 开合；`details.reason`：trigger-press / input-focus / input-change / item-press / clear-press / escape-key / outside-press / none |
| `itemToStringValue` | `(item) => string` | 过滤与展示用；默认 `String(item)` |
| `autoHighlight` | `boolean` | 类型中已声明，但当前实现**尚未接线**（打开时 `activeIndex` 仍为 -1）。不要依赖它做首项高亮 |
| `lockScroll` | `boolean`（默认 true） | 打开时锁页面滚动，面板自身仍可滚 |

根组件不渲染 DOM，只提供 context。

## 子部件

| 部件 | 说明 |
| :--- | :--- |
| `ComboboxInput` | 输入框 + 清理按钮；`placeholder`、`showClear`、`disabled`、`aria-invalid` |
| `ComboboxTrigger` | 箭头按钮，打开/关闭 listbox |
| `ComboboxValue` | 展示当前值；`placeholder`，`children` 可传 `(values) => JSX` |
| `ComboboxContent` | 浮层容器；`side`、`align`、`sideOffset`、`alignOffset` |
| `ComboboxList` | `role="listbox"`；`children` 可传 `(item, index) => JSX` |
| `ComboboxItem` | `role="option"`；`value`、`disabled` |
| `ComboboxEmpty` | 空状态；当前实现自带 `hidden` 类，需要调用方用 `class` 覆盖才会显示 |
| `ComboboxGroup` / `ComboboxLabel` | 分组与标题 |
| `ComboboxCollection` | 渲染 `items` 或 context items，并做本地过滤 |
| `ComboboxSeparator` | 分隔线 |
| `ComboboxChips` / `ComboboxChip` / `ComboboxChipsInput` | 多选 chip 输入；Chip 的 `showRemove` 默认 true |
| `useComboboxAnchor()` | 返回一个 ref 设置函数，便于自定义锚点 |

## 键盘

- `ArrowDown` / `ArrowUp` 打开并循环高亮；`Home` / `End` 跳首尾。
- `Enter` 选择当前高亮项；`Escape` 关闭；输入会过滤 `items`。
- 高亮用 `aria-activedescendant` 指向 `ComboboxItem` 的 id，焦点始终在输入框。

## 与 Select 的差异

- Combobox 是**可输入**的，Select 是只读下拉。
- Combobox 的 `onValueChange` 有事件详情，可在 `details.cancel()` 中否决；Select 只回调值。
- 多选/搜索/分组是 Combobox 的能力；Select 的定位采用“选中项对齐”模型。

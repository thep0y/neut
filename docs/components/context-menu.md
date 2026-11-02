# ContextMenu

右键菜单：坐标锚定、子菜单、checkbox/radio 项、typeahead、模态锁滚动。

```tsx
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@neut/ui";

<ContextMenu onOpenChange={(open, details) => console.log(open, details.reason)}>
    <ContextMenuTrigger class="grid h-32 place-items-center border">
        右键点击这里
    </ContextMenuTrigger>
    <ContextMenuContent>
        <ContextMenuLabel>操作</ContextMenuLabel>
        <ContextMenuItem>复制</ContextMenuItem>
        <ContextMenuItem disabled>粘贴</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">删除</ContextMenuItem>
    </ContextMenuContent>
</ContextMenu>;
```

## 根 props

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `open` / `defaultOpen` | `boolean` | — | 受控/非受控开合 |
| `onOpenChange` | `(open, details) => void` | — | `details.reason` 见下 |
| `disabled` | `boolean` | `false` | 忽略交互 |
| `loopFocus` | `boolean` | `true` | 方向键在两端环绕 |
| `highlightItemOnHover` | `boolean` | `true` | 悬停高亮 |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | 方向键映射 |
| `modal` | `boolean` | `true` | 锁页面滚动并拦截菜单外滚轮/触摸；只影响根菜单 |

`details.reason`：`trigger-hover`、`trigger-focus`、`trigger-press`、`outside-press`、`focus-out`、
`list-navigation`、`escape-key`、`item-press`、`close-press`、`sibling-open`、`cancel-open`、
`imperative-action`、`none`。`details.cancel()` 可阻止关闭。

## 子部件

| 部件 | 关键 props |
| :--- | :--- |
| `ContextMenuTrigger` | 默认 `div`；支持 `component`；右键/长按打开 |
| `ContextMenuPortal` | 渲染到 `document.body` |
| `ContextMenuContent` | `side`（默认 right）、`align`（默认 start）、`sideOffset`（0）、`alignOffset`（4）、`collisionPadding`（5）、`finalFocus`（默认 true） |
| `ContextMenuItem` | `inset`、`variant`、`disabled`、`label`、`closeOnClick`（默认 true） |
| `ContextMenuCheckboxItem` | `checked`/`defaultChecked`、`onCheckedChange(checked, details)`、`closeOnClick`（默认 false） |
| `ContextMenuRadioGroup` | `value`/`defaultValue`、`onValueChange(value, details)` |
| `ContextMenuRadioItem` | `value`、`closeOnClick`（默认 false） |
| `ContextMenuGroup` / `ContextMenuLabel` / `ContextMenuSeparator` / `ContextMenuShortcut` | 分组、标题、分隔、快捷键展示 |
| `ContextMenuSub` | `open`/`defaultOpen`、`onOpenChange`、`closeParentOnEsc`（默认 false）、`loopFocus`、`orientation` |
| `ContextMenuSubTrigger` | `inset`、`openOnHover`（默认 true）、`delay`（100）、`closeDelay`（0，内部有 100ms 穿越容忍） |
| `ContextMenuSubContent` | 与 `ContextMenuContent` 相同的位置 props |

## 键盘与交互

- 右键打开：锚点是鼠标坐标（`createVirtualElement`），不是 trigger 元素。
- 上下方向键移动高亮，Home/End 跳首尾，Enter/Space 激活，Escape 关闭，右方向键打开子菜单，左方向键回到父菜单。
- 字符键触发 typeahead（`label` 或子节点文本）。
- 菜单打开时高亮通过 `aria-activedescendant` 表达，焦点留在浮层上；关闭时默认把焦点还给 trigger。
- 子菜单悬停打开/关闭都带防抖，避免指针穿过间隙时闪烁。

完整设计见 [DropdownMenu DESIGN](../../src/components/dropdown-menu/DESIGN.md)（两者共享大量运行时）。

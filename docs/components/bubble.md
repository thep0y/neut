# Bubble

聊天气泡。负责对齐、最大宽度、内容样式与反应行；消息行布局请用 [Message](./message.md)。

```tsx
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@neut/ui";

<Bubble align="end">
    <BubbleContent>你好！</BubbleContent>
</Bubble>
```

## Props

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `align` | `"start" \| "end"` | `"start"` | 气泡在消息行里的对齐 |
| `variant` | `"default" \| "secondary" \| "muted" \| "tinted" \| "outline" \| "ghost" \| "destructive"` | `"default"` | 内容配色 |
| `class` / `classList` | — | — | 样式覆盖 |

根元素带 `data-slot="bubble"`、`data-align`、`data-variant`。

## 子部件

- `BubbleGroup`：多条气泡的容器。
- `BubbleContent`：必须是 `Bubble` 的**直接子元素**——变体样式通过
  `*:data-[slot=bubble-content]:…` 命中直接子级。默认渲染 `div`，可用 `component="button"` / `"a"`。
- `BubbleReactions`：贴在气泡边缘的反应行，`side="top" \| "bottom"`（默认 bottom）、
  `align="start" \| "end"`（默认 end）。展示型 emoji 请加 `role="img"` 与 `aria-label`；
  可点击的请用 Button 并给纯图标按钮 `aria-label`。

更多取舍见 [Bubble DESIGN](../../src/components/bubble/DESIGN.md)。

# ScrollArrows

滚动容器上下边缘的提示箭头，并可选“指针停在边缘时持续滚动”。

```tsx
import { ScrollArrows } from "@neut/ui";
import { createSignal } from "solid-js";

const [scrollEl, setScrollEl] = createSignal<HTMLElement>();

<div class="relative">
    <div ref={setScrollEl} class="max-h-72 overflow-y-auto">…</div>
    <ScrollArrows target={scrollEl} hoverScroll />
</div>;
```

## Props

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `target` | `Accessor<HTMLElement \| undefined>` | — | 滚动容器 |
| `hoverScroll` | `boolean` | `true` | 指针停在容器上/下边缘带时持续滚动 |
| `class` / `upClass` / `downClass` | `string` | — | 箭头样式 |

实现要点：

- 箭头自身始终 `pointer-events-none`，不会抢走边缘列表项的点击。
- 悬停滚动由**容器**按指针坐标驱动；指针按下、滚轮、键盘、离开容器都会立即停止。
- 显隐由 `useScrollEdges` 的迟滞阈值驱动（进入 4px、退出 1px），避免边界抖动。

更多取舍见 [ScrollArrows DESIGN](../../src/components/scroll-arrows/DESIGN.md)。

# Hooks

所有 hooks 都从 `@neut/ui`（或 `@neut/ui/hooks`）导出。

## useScrollLock

浮层打开时锁定页面滚动，关闭后恢复。对齐 Base UI 的 modal 行为。

```ts
import { useScrollLock } from "@neut/ui";

useScrollLock(open, { allowedSelector: '[data-slot="popover-content"]' });
```

- 多个浮层可同时持锁（引用计数），全部释放后才恢复页面滚动。
- 锁定的元素：`html` 自己建立了滚动上下文时锁 `html`，否则锁 `body`（与 positioner 的 `isOverflowElement` 同一口径）。
- 用 `scrollbar-gutter: stable` 抵消滚动条消失带来的抖动；不支持时给 `body` 补右内边距。
- `allowedSelector` 命中的容器内仍可滚动（通常是浮层自身）。

## useScrollEdges

跟踪滚动容器上下是否还有内容，用于滚动提示箭头。

```ts
const { canScrollUp, canScrollDown, refresh } = useScrollEdges(target);
```

- 监听 `scroll`（passive）、`ResizeObserver`（容器与首个子元素）、`MutationObserver`（子节点增删）。
- 使用迟滞阈值：进入（有内容）需超过 4px，退出回落到 1px 以内，避免边界处抖动。
- `target` 为 `Accessor<HTMLElement | undefined>`；元素变化时会重建观察器。

## useFontLoader

按语言加载 Google Fonts 并写入 `data-lang`。

```ts
useFontLoader({
    langs: ["zh-hans", "en"],
    targetRef: document.body, // 可选，默认 document.documentElement
    apply: true,              // false 时只预加载，不改 data-lang
});
```

支持的 `Lang`：`en`、`fr`、`de`、`ru`、`zh-hans`、`zh-hant`、`ja`、`ko`、`hi`、`bn`、`th`、`ar`、`fa`、`he`。

- 只把第一个合法语言写到 `data-lang`（决定字体与行高），其余用于预加载。
- 模块级缓存已加载字体族，避免重复插入 `<link>`。
- 卸载时恢复 `data-lang` 原值。
- 非生产环境遇到未知语言会 `console.warn`。

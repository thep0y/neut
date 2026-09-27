# MessageScroller 组件设计方案

> 状态:**P1 已实现**(结构 + 滚动引擎 + 公开 API 对齐 + 可见性/新回合锚定)
> 移植目标:shadcn Base UI 版 `message-scroller`(行为来自 `@shadcn/react` 的 headless 包)
> 关联代码:`src/components/message-scroller/`

## 1. 概述

会话滚动容器。shadcn 的样式层包装的是 `@shadcn/react` 的 headless 原语,本仓库不能依赖它,
因此在 `useMessageScrollerEngine.ts` 里自研滚动引擎。它只负责**滚动视口**,不拥有消息/AI
状态/持久化。

```
MessageScrollerProvider          # headless 根:滚动状态机 + context(不渲染 DOM)
└── MessageScroller              # 有样式的框架
    ├── MessageScrollerViewport  # 可滚动元素(scroll 事件、保位、ARIA region)
    │   └── MessageScrollerContent   # role="log" 的会话容器
    │       └── MessageScrollerItem  # 行边界(id/anchor/可见性)
    └── MessageScrollerButton    # 滚到开始/结束的控件
```

## 2. SRP 分工

| 关注点 | 文件 |
| --- | --- |
| 类型契约 | `message-scroller.types.ts` |
| context | `message-scroller.context.ts` |
| 滚动引擎 | `useMessageScrollerEngine.ts`(scroll/尺寸/内容观察、定位、跟随、保位、命令、可见性) |
| data 属性工具 | `message-scroller.utils.ts`(`data-scrollable` 的 token 拼接) |
| 消费 hooks | `useMessageScroller.ts`(命令)、`useMessageScrollerScrollable.ts`(start/end)、`useMessageScrollerVisibility.ts`(currentAnchorId/visibleMessageIds) |
| 各部件的渲染/ARIA | `MessageScroller*/` 各自目录 |

## 3. 已实现行为

- **可滚动状态**:scroll + ResizeObserver 维护 `data-scrollable`(空格分隔的
  `start`/`end` token,放得下时缺失)与 `useMessageScrollerScrollable()` 的 `start`/`end`。
  距边缘多少像素仍算「在边缘」由 `scrollEdgeThreshold`(默认 8)控制。
- **命令**:`scrollToStart` / `scrollToEnd` / `scrollToMessage(id, options)`;支持
  `align`(start/center/end/nearest)、`behavior`(auto/smooth)、`scrollMargin`。
  返回 boolean;`scrollToMessage` 在会话尚未挂载任何行时可对目标**排队**,已挂载但 id
  不存在则返回 false(不做重试猜测)。
- **`defaultScrollPosition`**:`start` / `end`(默认) / `last-anchor`(定位到最后一个
  `scrollAnchor` 行,预留 `scrollPreviousItemPeek` 的上下文);`last-anchor` 无锚点或该回合
  放得下时回退到 `end`。
- **`autoScroll`**:读者位于实时边缘时跟随内容增长;用户滚动离开即让位;`scrollToEnd`/
  按钮会重新接管。
- **平滑滚动状态跟踪**:`behavior: "smooth"` 时用 `scrollend`(带超时兜底)恢复状态跟踪,
  避免平滑过程被误判为用户离开实时边缘。
- **`preserveScrollOnPrepend`**(Viewport 的 prop,默认 true):上方插入历史时按高度差补偿
  `scrollTop`,保持可见行。
- **`data-pending-scroll`**:`end`/`last-anchor` 定位应用前隐藏视口,避免跳动;空会话不设置。
- **新回合实时锚定**:带 `scrollAnchor` 的新行追加、且读者原本在实时边缘时,把它放到靠近
  顶部并保留 `scrollPreviousItemPeek`(默认 64);此后回复在下方生长,内容填满视口后
  `autoScroll` 接管。
- **可见性**:`useMessageScrollerVisibility()` 提供 `currentAnchorId` / `visibleMessageIds`,
  **仅在有订阅者时计算**(pay-for-what-you-use);滚动/尺寸/内容变化时重算。
- **无障碍**:Viewport 是 `role="region"` + `aria-label` + `tabindex=0` 的键盘可达区域;
  Content 是 `role="log"` + `aria-relevant="additions"`;Button 无内容可滚时 `inert` 且
  `tabindex=-1`、`data-active="false"`。
- **性能**:Item 带 `content-visibility: auto` 与 `contain-intrinsic-size`,滚动热路径不改
  React/Solid 状态,只更新少数信号与 data 属性。

## 4. 后续待实现

- **Content 的 `spacerClassName` / 内部 spacer**:让「最后一个 anchor 也能顶到视口顶部」,
  需要在尾部预留与内容高度相关的空间;当前靠现有内容高度自然滚动。
- **SSR 防闪烁脚本**(`data-pending-scroll` + 内联脚本);当前为客户端定位。
- `scroll-fade-b` 为静态底部渐隐(shadcn 用滚动驱动动画)。
- 虚拟化示例(交回使用方用 `MessageScrollerViewport` 作为滚动元素)。
- 可见性目前是「滚动时重算」而非 `IntersectionObserver`;大列表可按需替换。

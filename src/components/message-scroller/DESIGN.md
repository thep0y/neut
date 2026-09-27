# MessageScroller 组件设计方案

> 状态:**P1 已实现**(结构 + 滚动引擎核心 + 按钮/ARIA)
> 移植目标:shadcn Base UI 版 `message-scroller`(行为来自 `@shadcn/react` 的 headless 包)
> 关联代码:`src/components/message-scroller/`

## 1. 概述

会话滚动容器。shadcn 的样式层包装的是 `@shadcn/react` 的 headless 原语,本仓库不能依赖它,
因此在 `useMessageScrollerEngine.ts` 里自研滚动引擎。它只负责**滚动视口**,不拥有消息/AI
状态/持久化。

```
MessageScrollerProvider          # headless 根:滚动状态机 + context
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
| 滚动引擎 | `useMessageScrollerEngine.ts`(scroll/尺寸/内容观察、定位、跟随、保位、命令) |
| 消费 hooks | `useMessageScroller.ts`(scrollToStart/End/Message)、`useMessageScrollerScrollable.ts`(start/end) |
| 各部件的渲染/ARIA | `MessageScroller*/` 各自目录 |

## 3. 已实现行为

- **可滚动状态**:scroll + ResizeObserver 维护 `data-scrollable` 与
  `useMessageScrollerScrollable()` 的 `start`/`end`。
- **命令**:`scrollToStart` / `scrollToEnd` / `scrollToMessage(id)`;在 Provider 内任意位置
  可用(包括框架之外的自定义控件)。
- **`defaultScrollPosition`**:`start` / `end`(默认) / `last-anchor`(定位到最后一个
  `scrollAnchor` 行,预留 `scrollPreviousItemPeek` 的上下文)。
- **`autoScroll`**:读者位于实时边缘时跟随内容增长;用户滚动离开即让位;`scrollToEnd`/
  按钮会重新接管。
- **`preserveScrollOnPrepend`**:上方插入历史时按高度差补偿 `scrollTop`,保持可见行。
- **`data-pending-scroll`**:`end`/`last-anchor` 定位应用前隐藏视口,避免跳动。
- **无障碍**:Viewport 是 `role="region"` + `aria-label` + `tabindex=0` 的键盘可达区域;
  Content 是 `role="log"` + `aria-relevant="additions"`;Button 无内容可滚时 `inert` 且
  `tabindex=-1`、`data-active="false"`。

## 4. 后续待实现

- **`useMessageScrollerVisibility`**(`currentAnchorId` / `visibleMessageIds`):按需订阅的可见性追踪。
- **新回合实时锚定**:新出现的 `scrollAnchor` 行靠近顶部、并让流式回复在下方生长
  (当前仅支持打开时的 `last-anchor`,不做实时新回合锚定)。
- **SSR 防闪烁脚本**(`data-pending-scroll` + 内联脚本);当前为客户端定位。
- `scroll-fade-b` 为静态底部渐隐(shadcn 用滚动驱动动画);`scrollbar-thin` 等按仓库口径用
  任意属性实现。
- 虚拟化示例(交回使用方用 `MessageScrollerViewport` 作为滚动元素)、入场动画辅助。

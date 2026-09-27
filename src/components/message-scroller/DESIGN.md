# MessageScroller 组件设计方案

> 状态:**P1 完成**(结构 + 滚动引擎 + 公开 API/行为对齐 + 可见性/锚定/spacer)
> 移植目标:shadcn Base UI 版 `message-scroller`(行为来自 `@shadcn/react` 的 headless 包)
> 关联代码:`src/components/message-scroller/`

## 1. 概述

会话滚动容器。shadcn 的样式层包装的是 `@shadcn/react` 的 headless 原语,本仓库不能依赖它,
因此在 `useMessageScrollerEngine.ts` 里自研滚动引擎(行为按上游 dist 实现逐条移植)。它只负责
**滚动视口**,不拥有消息/AI 状态/持久化。

```
MessageScrollerProvider          # headless 根:滚动状态机 + context(不渲染 DOM)
└── MessageScroller              # 有样式的框架
    ├── MessageScrollerViewport  # 可滚动元素(scroll/意图事件、保位、ARIA region、转发 ref)
    │   └── MessageScrollerContent   # role="log" 的会话容器 + 内部 spacer
    │       └── MessageScrollerItem  # 行边界(id/anchor/可见性)
    └── MessageScrollerButton    # 滚到开始/结束的控件
```

## 2. SRP 分工

| 关注点 | 文件 |
| --- | --- |
| 类型契约 | `message-scroller.types.ts` |
| context | `message-scroller.context.ts` |
| 滚动引擎 | `useMessageScrollerEngine.ts`(状态机模式、锚定、spacer、保位、命令、IO 可见性) |
| data 属性工具 | `message-scroller.utils.ts`(`data-scrollable` 的 token 拼接) |
| 消费 hooks | `useMessageScroller.ts`、`useMessageScrollerScrollable.ts`、`useMessageScrollerVisibility.ts` |
| 各部件的渲染/ARIA | `MessageScroller*/` 各自目录 |
| 滚动渐隐工具 | `src/styles/effects.css`(`scroll-fade` 家族,与 shadcn 同源) |

## 3. 已实现行为

- **模式状态机**:`following-bottom` / `free-scrolling` / `anchored-to-message` /
  `settling-jump`。滚轮、触摸、键盘滚动键(Arrow/Page/Home/End/Space)会**立刻放弃跟随**。
- **可滚动状态**:`data-scrollable`(空格分隔 token)与 `useMessageScrollerScrollable()`;
  距边缘多少像素算「在边缘」由 `scrollEdgeThreshold`(默认 8)控制;内容底部**不含 spacer**。
  跟随输出时对外把 `end` 强制为 `false`(按钮隐藏),回到实时边缘后恢复。
- **命令**:`scrollToStart` / `scrollToEnd` / `scrollToMessage(id, options)`;支持
  `align`(start/center/end/nearest)、`behavior`(auto/smooth)、`scrollMargin`。返回 boolean;
  `scrollToMessage` 在会话未挂载任何行时可**排队**,已挂载但 id 缺失则返回 false。
- **尾部 spacer**:`scrollToElement` 时按目标位置计算所需空间,设置隐藏 spacer 的高度
  (并用负 `margin-top` 抵消 content 的 gap),让靠近结尾的锚定行也能滚到顶部;滚到 start/end
  时清零。Content 通过 `spacerClassName` 暴露其类名。
- **新回合锚定**:新增 `scrollAnchor` 行且读者在实时边缘时,用 `scrollToElement(keepPreviousPeek)`
  把它放到顶部并保留 `scrollPreviousItemPeek`;同时记为 `streamingTurn`。回复生长时
  `reanchorToAnchoredMessage` 原地重锚定,直到读者滚动离开。同批多个新锚点则直接跟随底部。
- **`defaultScrollPosition`**:`start` / `end`(默认) / `last-anchor`;`last-anchor` 无锚点或
  该回合放得下时回退 `end`;`end`/`last-anchor` 在应用前用 `data-pending-scroll` 隐藏视口,
  空会话跳过。
- **`preserveScrollOnPrepend`**(Viewport prop,默认 true):记录首个可见行及其视口位置,
  上方插入历史后按差值补偿 `scrollTop`,而不是靠高度差猜测。
- **`autoScroll`**:仅在 `following-bottom` 模式跟随;`scrollToEnd`/按钮重新接管。
- **可见性**:`useMessageScrollerVisibility()` 提供 `currentAnchorId`(阅读行 = 视口顶部 +
  `scrollMargin` + `scrollPreviousItemPeek`,取之上最后一个锚点)/ `visibleMessageIds`;
  **按需订阅**:首个订阅者建立 `IntersectionObserver`(root = Viewport,rootMargin 同上),
  最后一个移除时断开;不支持 IO 时退化为逐帧测量。
- **无障碍**:Viewport 是 `role="region"` + `aria-label` + `tabindex=0` 的键盘可达区域;
  Content 是 `role="log"` + `aria-relevant="additions"` + `aria-busy`;Button 无内容可滚时
  `inert`、`tabindex=-1`、`data-active="false"`;spacer 为 `aria-hidden`。
- **性能**:Item 带 `content-visibility: auto` 与 `contain-intrinsic-size`;滚动热路径只更新
  少量信号与 data 属性,不重渲染行。

## 4. 示例(dev/examples/)

按上游 `apps/v4/examples/base/message-scroller-*.tsx` 逐一移植,结构/文案/数据对齐:
Chat、Anchoring Turns、Group Chat、Keeping Context Visible、Following the Live Edge、
Opening Position、Loading Earlier Messages、Animating New Messages、Jumping to Messages、
Tracking the Reader's Position、Reading Scroll State、Scroll State、Virtualization。

- `message-scroller.tsx` 只做组合与 UI,复用仓库组件(Card/Empty/ToggleGroup/Slider/
  Tabs/Select/Tooltip/DropdownMenu 等);受限于本仓库没有 HoverCard / motion,
  Tracking 的悬浮大纲改为常驻竖排指示点,动画改用 CSS 关键帧。
- `message-scroller-support.tsx`:本地 `createChat()` + `useScriptedChat` 模拟
  `@shadcn/helpers/ai-sdk` 的「提交 → 流式输出」;`MessageAnimated` 对齐上游结构
  (用户行入场动画、段落切分、muted/ghost 变体),预设与 `@/lib/message-animations` 同名。
- `message-scroller.css`:七个动画预设的 CSS keyframes(含 prefers-reduced-motion 兜底)。
- Virtualization 为自研极简窗口化(仓库不引入 TanStack),用 `MessageScrollerViewport`
  作为滚动元素。

## 5. 未纳入

- **SSR 防闪烁脚本**:`data-pending-scroll` 已实现;把它接到内联脚本属于使用方页面代码
  (`end` 时先滚到底再移除属性),组件不内置 `<script>`。
- `scroll-fade` 依赖 CSS scroll-driven animation,不支持该特性的浏览器退化为静态渐隐
  (上游同款兜底)。

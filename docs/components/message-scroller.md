# MessageScroller

会话式滚动容器：跟随实时边缘、阅读锚点、上方插入历史时保位、尾部 spacer、可见性订阅。
它只负责**滚动视口**，不拥有消息/AI 状态与持久化。

```tsx
import {
    Message,
    MessageScrollerProvider,
    MessageScroller,
    MessageScrollerViewport,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerButton,
} from "@neut/ui";
import { For } from "solid-js";

<MessageScrollerProvider autoScroll defaultScrollPosition="end">
    <MessageScroller>
        <MessageScrollerViewport aria-label="Conversation">
            <MessageScrollerContent>
                <For each={messages()}>
                    {(message) => (
                        <MessageScrollerItem messageId={message.id} scrollAnchor={message.isTurn}>
                            <Message>{message.text}</Message>
                        </MessageScrollerItem>
                    )}
                </For>
            </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="end" />
    </MessageScroller>
</MessageScrollerProvider>;
```

## 结构

```
MessageScrollerProvider          # headless 根：滚动状态机 + context（不渲染 DOM）
└── MessageScroller              # 有样式的框架
    ├── MessageScrollerViewport  # 可滚动元素（role=region，键盘可达）
    │   └── MessageScrollerContent   # role=log 的会话容器 + 内部 spacer
    │       └── MessageScrollerItem  # 行边界（messageId / scrollAnchor）
    └── MessageScrollerButton    # 滚到开始/结束
```

## Provider props

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `autoScroll` | `boolean` | `false` | 读者在实时边缘时内容增长自动跟随；滚动离开后自动让位 |
| `defaultScrollPosition` | `"start" \| "end" \| "last-anchor"` | `"end"` | 打开时停在哪里；`last-anchor` 无锚点或该回合放得下时回退到 `end` |
| `scrollEdgeThreshold` | `number` | `8` | 距任一边缘多少像素仍算“在起点/终点” |
| `scrollPreviousItemPeek` | `number` | `64` | 新回合锚定时额外保留的上一项高度（px） |
| `scrollMargin` | `number` | `0` | `scrollToMessage` / 可见性 / 程序化目标的对齐边距 |

## 子部件 props

| 组件 | 关键 props |
| :--- | :--- |
| `MessageScrollerViewport` | `aria-label`、`preserveScrollOnPrepend`（默认 true） |
| `MessageScrollerContent` | `aria-busy`、`spacerClassName`（内部 spacer 的类名，`aria-hidden`） |
| `MessageScrollerItem` | `messageId`、`scrollAnchor` |
| `MessageScrollerButton` | `direction="start" \| "end"`（默认 end）、`behavior`（默认 smooth）、`variant`/`size` |

## Hooks

```ts
import {
    useMessageScroller,
    useMessageScrollerScrollable,
    useMessageScrollerVisibility,
} from "@neut/ui";
```

- `useMessageScroller()`：完整 context，包括 `scrollToStart` / `scrollToEnd` / `scrollToMessage`、
  `autoscrolling`、`pendingScroll`、`currentAnchorId`、`visibleMessageIds`、`subscribeVisibility`。
- `useMessageScrollerScrollable()`：`{ start, end }`，驱动自定义按钮/提示。
- `useMessageScrollerVisibility()`：`{ currentAnchorId, visibleMessageIds }`，按需建立 `IntersectionObserver`。

## 滚动命令

```ts
scrollToStart({ behavior: "smooth" });
scrollToEnd({ behavior: "auto" });
scrollToMessage("message-id", {
    align: "start",        // start | center | end | nearest
    behavior: "smooth",
    scrollMargin: 16,
});
```

- 返回 `boolean`：无法定位时返回 false。
- 会话尚未挂载任何行时，`scrollToMessage` 可**排队**；已挂载但 id 缺失则返回 false。
- 滚到 start/end 会清零尾部 spacer。

## 状态属性

- `data-scrollable`：空格分隔的 `start` / `end` token。
- `data-pending-scroll`：初始定位尚未应用（此时视口隐藏，避免闪烁）。
- `data-autoscrolling`：正在执行程序化的“滚到最新”。
- 行级：`data-message-id`、`data-scroll-anchor="true" | "false"`。

## 行为要点

- 四种模式：`following-bottom`、`free-scrolling`、`anchored-to-message`、`settling-jump`。
  滚轮、触摸、键盘滚动键会立即放弃跟随。
- `preserveScrollOnPrepend` 记录首个可见行及其视口位置，上方插入历史后按差值补偿 `scrollTop`。
- spacer 让靠近结尾的锚定行也能滚到顶部，并用负 `margin-top` 抵消 content 的 gap。
- Viewport 是 `role="region"` + `aria-label` + `tabindex=0`；Content 是 `role="log"` + `aria-relevant="additions"`；
  Button 在无可滚内容时 `inert`、`tabindex=-1`。

完整设计（状态机、锚定、spacer、与上游差异）见 [MessageScroller DESIGN](../../src/components/message-scroller/DESIGN.md)。

# Message

单条消息的行布局：头像、内容、header、footer 与对齐。

```tsx
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Message,
    MessageAvatar,
    MessageContent,
    MessageFooter,
    MessageGroup,
    MessageHeader,
} from "@neut/ui";

<MessageGroup>
    <Message align="start">
        <MessageAvatar>
            <Avatar>
                <AvatarImage src="/me.png" alt="" />
                <AvatarFallback>ME</AvatarFallback>
            </Avatar>
        </MessageAvatar>
        <MessageContent>
            <MessageHeader>Assistant</MessageHeader>
            <p>你好，有什么可以帮你？</p>
            <MessageFooter>刚刚</MessageFooter>
        </MessageContent>
    </Message>
</MessageGroup>
```

## Props

| 组件 | 关键 props | 说明 |
| :--- | :--- | :--- |
| `Message` | `align="start" \| "end"`（默认 start） | 行布局；`data-align="end"` 时反向排列 |
| `MessageGroup` | — | 多条消息的容器 |
| `MessageAvatar` | — | 头像槽位 |
| `MessageContent` | — | 正文槽位 |
| `MessageHeader` / `MessageFooter` | — | 头/尾槽位 |

所有部件都可多态（`component`），并带 `data-slot`。气泡本身请用 [Bubble](./bubble.md)。

更多取舍见 [Message DESIGN](../../src/components/message/DESIGN.md)。

# Attachment

附件卡片，用于展示文件、图片或待上传对象。移植自 shadcn Base UI 版 `Attachment`。

```tsx
import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentGroup,
    AttachmentMedia,
    AttachmentTitle,
} from "@neut/ui";
```

## 结构

```tsx
<Attachment state="uploading" size="default" orientation="horizontal">
    <AttachmentMedia variant="image">
        <img src="/report.png" alt="" />
    </AttachmentMedia>
    <AttachmentContent>
        <AttachmentTitle>report.png</AttachmentTitle>
        <AttachmentDescription>2.4 MB</AttachmentDescription>
    </AttachmentContent>
    <AttachmentActions>
        <AttachmentAction variant="ghost">Remove</AttachmentAction>
    </AttachmentActions>
</Attachment>
```

可以用 `AttachmentTrigger` 让整张卡片成为可点击/可下载的入口；`AttachmentGroup` 用于堆叠多个附件。

## Props

### Attachment

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `state` | `"idle" \| "uploading" \| "processing" \| "error" \| "done"` | `"done"` | 驱动边框、shimmer 与媒体透明度 |
| `size` | `"default" \| "sm" \| "xs"` | `"default"` | 尺寸 |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | 排列方向 |
| `class` / `classList` | — | — | 样式覆盖 |

根元素带 `data-slot="attachment"` 与 `data-state` / `data-size` / `data-orientation`。

### 子部件

| 部件 | 说明 |
| :--- | :--- |
| `AttachmentGroup` | 附件列表容器 |
| `AttachmentMedia` | 媒体区，`variant="icon" \| "image"`（默认 icon） |
| `AttachmentContent` | 标题 + 描述容器 |
| `AttachmentTitle` / `AttachmentDescription` | 文本行 |
| `AttachmentActions` / `AttachmentAction` | 操作区；`AttachmentAction` 直接复用 `Button` |
| `AttachmentTrigger` | 可点击入口，默认渲染 `button`，支持 `component` |

## 状态与样式

- `state="error"`：媒体区与边框使用 destructive 色。
- `state="uploading"` / `"processing"`：标题使用 `shimmer` 工具类。
- `state="idle"`：边框虚线。
- 所有部件都带 `data-slot`，可用 `data-[state=…]` 做局部覆盖。

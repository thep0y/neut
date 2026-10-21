# Marker

会话中的系统标记、时间分隔线或占位内容。

```tsx
import { Marker, MarkerContent, MarkerIcon } from "@neut/ui";

<Marker variant="separator">
    <MarkerIcon>⏱</MarkerIcon>
    <MarkerContent>Today</MarkerContent>
</Marker>
```

## Props

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `variant` | `"default" \| "separator" \| "border"` | `"default"` | `separator` 两侧加横线；`border` 底部描边 |

子部件：`MarkerIcon`（`span`）、`MarkerContent`（`span`）。根元素带 `data-slot="marker"`。

`markerVariants` 也作为公开导出，便于在自定义元素上复用同一套样式。

更多取舍见 [Marker DESIGN](../../src/components/marker/DESIGN.md)。

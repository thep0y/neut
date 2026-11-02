# Resizable

可调整大小的面板组，行为对齐 `react-resizable-panels` 的常用部分，但完全自研。

```tsx
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@neut/ui";

<ResizablePanelGroup orientation="horizontal" autoSaveId="editor">
    <ResizablePanel defaultSize="30%" minSize={15}>
        Sidebar
    </ResizablePanel>
    <ResizableHandle withHandle />
    <ResizablePanel defaultSize={70}>Editor</ResizablePanel>
</ResizablePanelGroup>;
```

## Props

### ResizablePanelGroup

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | 排列方向 |
| `defaultLayout` | `Record<string, number>` | — | 按 panel id 的初始百分比 |
| `onLayoutChange` | `(layout) => void` | — | 拖拽、键盘、命令都会触发 |
| `autoSaveId` | `string` | — | 自动持久化的 key |
| `storage` | `Storage` | `localStorage` | 持久化介质；不可用时关闭持久化 |
| `keyboardResizeBy` | `number` | `10` | 方向键一次移动的像素 |

### ResizablePanel

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | `string` | 自动 id | 持久化/回调里的键；**持久化请显式提供稳定 id** |
| `defaultSize` | `number \| "25%" \| "25"` | 均分 | 初始尺寸（百分比） |
| `minSize` / `maxSize` | 同上 | `0` / `100` | 约束 |
| `collapsible` | `boolean` | `false` | 可折叠 |
| `collapsedSize` | 同上 | `0` | 折叠后的尺寸 |
| `onResize` / `onCollapse` / `onExpand` | — | — | 面板回调 |
| `panelRef` | `(handle) => void` | — | 命令式句柄 |

句柄方法：`collapse()`、`expand()`、`resize(size)`、`getSize()`、`isCollapsed()`、`isExpanded()`。

### ResizableHandle

`id`、`disabled`、`withHandle`、`onDragging(dragging)`。

## 行为

- 拖拽用 `pointerdown` + `setPointerCapture`，`pointermove` 经 `requestAnimationFrame` 合并后写 store。
- 键盘：方向键按 `keyboardResizeBy`；Home/End 到两端；Enter/Space 切换相邻可折叠面板。
- 嵌套：内层 PanelGroup 提供自己的 context。
- 持久化 key 为 `neut-resizable:<autoSaveId>`；读取失败（隐私模式、损坏 JSON）会回退默认布局。
- 尺寸只支持百分比；`"200px"` 会被当作 200（%），不是像素。

完整设计见 [Resizable DESIGN](../../src/components/resizable/DESIGN.md)。

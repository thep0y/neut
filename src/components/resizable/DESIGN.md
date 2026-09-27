# Resizable 组件设计方案

> 状态:**P1 完成**(拖拽 / 键盘 / 嵌套 / 受控布局 / 持久化 / 命令式句柄)
> 移植目标:shadcn Base UI 版 `resizable`(上游是 `react-resizable-panels` v4 的薄封装)
> 关联代码:`src/components/resizable/`
> 依赖声明:见文末「第三方依赖」——上游核心行为来自 `react-resizable-panels`,本仓库**不引入**该运行时。

## 1. 概述

可调整大小的面板组。上游 `resizable.tsx` 只是给 `react-resizable-panels` 套了一层样式,
所以真正要移植的是 `react-resizable-panels` v4 的行为语义:

```
ResizablePanelGroup           # 根:orientation / defaultLayout / onLayoutChange / autoSaveId
├── ResizablePanel            # 面板:id / defaultSize / minSize / maxSize / collapsible / panelRef
├── ResizableHandle           # 分隔条:拖拽 + 键盘 + withHandle
└── ResizablePanel …
```

本仓库不允许依赖上游运行时,因此在 `useResizablePanelGroup.ts` 里自研布局引擎,并针对
Solid 做了「按 id 的细粒度更新」:尺寸存在 `createStore` 的 `{ [id]: percent }` 里,面板把它
映射成 `flex-grow`,拖拽只改相邻两个面板的两个键,**子节点不重渲染**。

## 2. SRP 分工

| 关注点 | 文件 |
| --- | --- |
| 类型契约 | `resizable.types.ts` |
| 尺寸解析 / 归一化数学 | `resizable.utils.ts`(`parseSize`/`clamp`/`roundPercent`/`normalizeSizes`) |
| context | `resizable.context.ts` |
| 布局引擎 | `useResizablePanelGroup.ts`(注册、约束、拖拽/键盘、命令式、持久化) |
| 根部件 | `ResizablePanelGroup/`(Provider + 框架) |
| 面板部件 | `ResizablePanel/`(注册 meta、映射 flex-grow、panelRef) |
| 分隔条部件 | `ResizableHandle/`(`useResizableHandle.ts` 指针/键盘、`.styles.ts` 类名) |

## 3. 已实现行为

- **方向**:`orientation="horizontal" | "vertical"`,用 `data-orientation` + class 控制 flex 方向。
- **尺寸**:`number` 视为百分比,字符串支持 `"25%"`;`defaultSize` / `minSize` / `maxSize` /
  `collapsedSize`。初始化时把权重归一化到总和 100,并迭代满足上下界(`normalizeSizes`)。
- **拖拽**:handle 用 `pointerdown` + `setPointerCapture`,`pointermove` 经 `requestAnimationFrame`
  合并后才写 store;`px -> %` 用 group 主轴尺寸换算,横向在 RTL 下取反。
- **折叠吸附**:`collapsible` 的面板拖到 `minSize` 以下时贴向 `collapsedSize` 或 `minSize`
  中较近的一端;`collapsedSize` 默认 0。
- **键盘**:方向键按 `keyboardResizeBy`(默认 10px)调整;`Home`/`End` 到两端;
  `Enter`/`Space` 切换相邻可折叠面板;`role="separator"` + `aria-orientation`。
- **光标与触摸**:handle 按方向设置双箭头光标(`cursor-ew-resize` / `cursor-ns-resize`,
  与 react-resizable-panels 在 Chrome/Firefox 下的选择一致)并加 `touch-none`(避免触摸拖动
  触发滚动);拖拽期间注入 `*, *:hover { cursor: … !important }` 全局样式并禁用文本选择,
  保证指针经过面板/文字/链接时仍能感知可拖动。
- **嵌套**:内层 `ResizablePanelGroup` 提供自己的 context,互不影响。
- **受控回调**:`onLayoutChange(layout)` 在初始化与每次变化后触发,`layout` 是
  `{ [panelId]: percent }`;面板可用 `id` 指定键。
- **持久化**:`autoSaveId` + `storage`(默认 `localStorage`)写入 `neut-resizable:<id>`,
  初始化时优先读取。**持久化要求 panel 提供稳定的 `id`**,否则自动 id 在重载后不匹配、
  会回落到 `defaultSize`。
- **命令式句柄**:`panelRef` 暴露 `collapse/expand/resize/getSize/isCollapsed/isExpanded`。
- **无障碍**:group `role="group"`;handle `role="separator"`、`aria-orientation`、
  `aria-valuenow/min/max`、可聚焦、`disabled` 时 `tabIndex=-1`。
- **SSR 友好**:`Panel` 在引擎初始化前用 `defaultSize` 作为 `flex-grow` fallback(未指定则等分),
  引擎在客户端挂载后再归一化,避免首屏塌陷。
- **性能**:store 按 id 精确更新;拖拽走 rAF 合并;handle 通过相邻兄弟节点解析前后面板,
  不额外维护注册表。

## 4. 与上游/示例的差异

- 上游样式里 `aria-[orientation=vertical]:flex-col` 依赖 group 上的 `aria-orientation`;
  但 `role="group"` 并不支持该 ARIA 属性(Biome a11y 也会报),因此本实现改为
  `data-orientation` 驱动 class,handle 仍保留 `aria-orientation`。
- 上游 `cn-resizable-*` 主题 token 未移植;handle / grip 的类名与图标在本仓库内联
  (`GripVertical`),不同 theme 下的圆角/间距可能有出入。
- `aria-valuenow/min/max` 用百分比近似(上游精确到像素),仅用于辅助技术读数。

## 5. 第三方依赖

上游 `resizable.tsx` 的全部行为来自 **`react-resizable-panels`(bvaughn)**。本仓库按约定不引入
任何上游组件/行为运行时,因此**手写**了 Solid 版引擎;下表列出「无法在本仓库内直接实现、
需要第三方或后续补齐」的能力,供未来决策:

| 能力 | 上游来源 | 现状 | 未来实现 |
| --- | --- | --- | --- |
| 完整的像素级约束 | `react-resizable-panels` 的像素快照 + `ResizeObserver` | 只支持百分比;`"200px"` 会被当作 200(%)解析 | 引入像素约束模型:ResizeObserver 记录可用像素,拖拽期间用像素快照换算,避免容器尺寸变化抖动 |
| 更多命令式 API | `PanelImperativeHandle` / group 命令 | 已实现常用 6 个方法 | 视需求补 `getLayout`/`setLayout`/`collapseAll`/`expandAll` |
| 布局持久化的兼容与迁移 | 上游自带 storage 结构与版本 | 简单 JSON,key 前缀 `neut-resizable:` | 需要与上游 `react-resizable-panels:<id>` 兼容时再加读取/迁移 |
| 更严格的 a11y 关联 | `aria-controls` 指向相邻 panel、像素级 `aria-valuenow` | handle 未做 `aria-controls`,值为百分比 | 给 panel 生成稳定 DOM id 并互相关联 |
| SSR/水合一致性 | 上游在客户端计算 | 引擎在客户端初始化,首屏用 defaultSize fallback | 若要严格对齐,需在服务端预计算并序列化布局 |

> 结论:除上表外,常见场景(拖拽、键盘、嵌套、受控、持久化、折叠)均已在本仓库内实现,
> **没有新增任何运行时依赖**。若未来一定要对齐像素级行为,建议单独评估引入
> `react-resizable-panels`(需要框架适配层)或补齐上表的自研像素模型。

## 6. 示例

`dev/examples/resizable.tsx`:Basic(One/Two/Three)、Horizontal、Vertical、With Handle、
Nested、Controlled、Collapsible、Persisted。

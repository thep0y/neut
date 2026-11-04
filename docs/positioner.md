# 定位器（`~/lib/positioner`）

Neut 的浮层不依赖 floating-ui，而是自研了一套更小的定位引擎。入口：

```ts
import { createPositioner, offset, flip, shift } from "~/lib";
```

> `~/lib` 是仓库内别名；`@neut/ui` 包**没有**导出 `/lib` 子路径。安装包使用时，
> 浮层能力已封装在 Tooltip/Popover/Menu 等组件里；只有复制源码或在本仓库内扩展组件时
> 才直接引用 `src/lib/positioner`（并保留 `~/*` 别名）。

## createPositioner

```ts
const pos = createPositioner(reference, floating, {
    placement: "bottom-start", // 默认 "bottom"
    strategy: "absolute",      // 或 "fixed"；不确定时用 "fixed"
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    autoUpdate: true,           // 默认 true，也可以传细粒度配置
});
```

参数：

| 参数 | 类型 | 说明 |
| :--- | :--- | :--- |
| `reference` | `Accessor<ReferenceElement \| null \| undefined>` | 锚点元素或虚拟元素 |
| `floating` | `Accessor<HTMLElement \| null \| undefined>` | 浮层元素 |
| `placement` | `Placement \| Accessor<Placement>` | 首选位置 |
| `strategy` | `"absolute" \| "fixed" \| Accessor` | 定位策略 |
| `middleware` | `Middleware[] \| Accessor` | 按顺序执行 |
| `autoUpdate` | `boolean \| AutoUpdateOptions` | 滚动/尺寸变化时重新计算 |

返回值（全部是 Solid 细粒度信号）：

```ts
interface Positioner {
    x: Accessor<number>;
    y: Accessor<number>;
    placement: Accessor<Placement>;          // middleware 调整后的最终位置
    strategy: Accessor<Strategy>;
    middlewareData: Accessor<MiddlewareData>; // 如 arrow 的偏移
    isPositioned: Accessor<boolean>;          // 首次定位完成前可先隐藏浮层
    update: () => void;
    floatingStyles: Accessor<{ position: Strategy; top: string; left: string; transform: string }>;
}
```

`floatingStyles()` 用 `transform: translate(...)` 而非 `top/left`，避免触发布局。

`createPositioner` 只负责坐标，不负责显隐/动画。实际组件采用两层结构：

```tsx
<div style={pos.floatingStyles()}>   {/* 外层只定位 */}
    <div data-open={open()} class="animate-in …"> {/* 内层做视觉与动画 */}
        …
    </div>
</div>
```

## Middleware

| Middleware | 作用 | 常用参数 |
| :--- | :--- | :--- |
| `offset(value)` | 主轴/交叉轴偏移 | 数字，或 `{ mainAxis, crossAxis, alignmentAxis }` |
| `flip(options?)` | 空间不足时翻到对侧 | `padding`、`fallbackPlacements` |
| `shift(options?)` | 沿视口边界平移 | `padding`、`limiter` |
| `size(options?)` | 把可用空间写入 `middlewareData.size.availableWidth/Height` | `padding`、`apply` |
| `hide(options?)` | 锚点离开视口时标记 `middlewareData.hide` | `padding`、`strategy` |
| `arrow(options)` | 计算箭头相对浮层的偏移 | `element`、`padding` |
| `containingBlockOffset()` | 修正 `absolute` 策略下包含块偏移 | — |

顺序会影响结果。常用顺序：`offset → flip → shift → arrow`；需要限制尺寸时把 `size` 放在 `flip/shift` 之前。

## 自动更新

`autoUpdate(reference, floating, update, options)` 监听：

- 祖先滚动容器 `scroll`（`ancestorScroll`，默认 true）
- 祖先 `ResizeObserver`（`ancestorResize`，默认 true）
- reference/floating 自身尺寸（`elementResize`，默认 true）
- `window.resize`
- `window.visualViewport` 的 `resize` / `scroll`（移动端软键盘、地址栏变化）

虚拟元素没有 DOM 祖先，除非提供 `contextElement`，否则只监听 `window.resize`。

## 虚拟锚点

右键菜单、光标跟随等场景用 `createVirtualElement`：

```ts
const anchor = createVirtualElement({
    x: event.clientX,
    y: event.clientY,
    contextElement: event.currentTarget,
});
```

`contextElement` 让 `autoUpdate` 能找到可滚动祖先（虚拟元素自身没有父节点链）。

## 边界与方向

- `placement` 是 `top` / `right` / `bottom` / `left` 及其 `-start` / `-end` 组合。
- 业务组件的 `side` 额外支持逻辑方向 `inline-start` / `inline-end`，由组件按 `dir` 解析成 left/right（RTL 下相反）。
- `rect` / `boundary` 由 `utils/dom` 计算；有 `visualViewport` 时用它作为边界，
  并叠加 `offsetLeft` / `offsetTop`（`absolute` 还要再加页面滚动），避免软键盘弹出后浮层被键盘盖住。
  `isOverflowElement` 同时被浮层定位与 `useScrollLock` 复用。

# HoverCard 组件设计方案

> 状态:**P1 完成**(延迟开关 / 定位 / 交互内容 / 键盘 / 进出场动画)
> 移植目标:shadcn Base UI 版 `hover-card`(上游 = `@base-ui/react/preview-card` 的薄封装)
> 关联代码:`src/components/hover-card/`
> 依赖声明:见文末「第三方依赖」——上游基于 Base UI PreviewCard,本仓库**不引入**该运行时,复用自研 positioner。

## 1. 概述

HoverCard 用一个可交互的浮层预览链接背后的内容。上游 `hover-card.tsx` 只是给
Base UI 的 `PreviewCard` 套样式;真正要移植的是 PreviewCard 的交互语义:
**悬停/open delay → 打开**,**移出/close delay → 关闭**,**鼠标可移入内容继续停留**,
**键盘 focus 立即打开、Escape 关闭**。

本仓库已有完整的 Tooltip 交互与自研 positioner(`src/lib/positioner`),因此在
`useHoverCardTrigger` / `useHoverCardContent` 里重写一份更贴合预览卡片语义的实现,
而不是复用 Tooltip(语义、ARIA、默认延迟都不同):

```
HoverCard              # 根:open/defaultOpen/onOpenChange + delay/closeDelay,不渲染 DOM
├── HoverCardTrigger   # 悬停/聚焦事件 + reference 注册(默认 <a>,可 component 指定)
└── HoverCardContent   # Portal + positioner + 交互内容 + 进出场动画
```

## 2. SRP 分工

| 关注点 | 文件 |
| --- | --- |
| 类型契约 | `hover-card.types.ts` |
| context | `hover-card.context.ts` |
| side/align → placement、transform-origin | `hover-card.utils.ts` |
| 根状态与延迟计时 | `HoverCard/HoverCard.tsx` |
| Trigger 事件 | `HoverCardTrigger/`(`useHoverCardTrigger.ts`) |
| 定位与挂载生命周期 | `HoverCardContent/`(`useHoverCardContent.ts`) |

## 3. 已实现行为

- **延迟开关**:根 `delay`(默认 700)/`closeDelay`(默认 300);trigger 上的
  `delay`/`closeDelay` 优先(对齐文档「Trigger Delays」)。
- **交互内容**:鼠标移入 content 会取消待关闭计时(`keepOpen`),移出才走 `closeDelay`;
  因此内容里的链接/文字可选可点。
- **键盘**:focus 跳过延迟立即打开,blur 立即关闭,Escape 关闭并阻止冒泡;刚发生
  pointerdown 时忽略随后的浏览器自动 focus,避免点击就把卡片打开。
- **定位**:`side`(默认 bottom)、`align`(默认 center)、`sideOffset`(4)、
  `alignOffset`(4)、`collisionPadding`(8);管线 = offset → flip → shift → hide →
  containingBlockOffset,贴合 trigger 放不下时翻转/贴边,reference 被裁掉时隐藏。
- **进出场**:打开延迟一帧再切 `data-state=open`(保证 transform-origin 已按最终
  placement 算好);关闭靠 `animationend`(带 300ms 兜底)卸载,退场动画播完再移除。
  动画用本仓库既有的 `animate-in/out` + `fade/zoom` + 方向 `slide-in-from-*`。
- **ARIA / data**:`data-slot`(`hover-card`/`hover-card-trigger`/`hover-card-content`)、
  `data-state`、`data-popup-open`、`data-side`、`data-align`;content `role="dialog"` 并有
  稳定 id,trigger 在打开时用 `aria-describedby` 关联。
- **性能**:根只持有开关信号;content 只在打开时挂 Portal;定位用 positioner 的
  autoUpdate;`animationState` 用 rAF 延后一帧,避免同步布局抖动。

## 4. 与上游的差异

- 上游用 Base UI 的 `data-starting-style` / `data-ending-style`,本仓库统一用既有
  `animate-in/out` 工具类 + `animationend` 卸载。
- 上游 `cn-hover-card-content` 主题 token 未移植,颜色用仓库既有的
  `bg-popover` / `text-popover-foreground` / `border`。
- 上游 `PreviewCard.Portal` / `Arrow` 未单独导出(上游 hover-card 也只导出
  Root/Trigger/Popup);本仓库同样只导出 `HoverCard`/`HoverCardTrigger`/`HoverCardContent`。

## 5. 第三方依赖

上游 `hover-card` 的行为来自 **`@base-ui/react/preview-card`**。本仓库按约定不引入任何
上游运行时,复用 `src/lib/positioner` 自研实现。以下 Base UI 能力**目前未实现**,需要
第三方或后续补齐(若补齐,建议做成 Tooltip/HoverCard 共用):

| 能力 | 上游来源 | 现状 | 未来实现 |
| --- | --- | --- | --- |
| `onOpenChangeComplete`(动画完成回调) | Base UI PreviewCard | 只有 `onOpenChange` | 在 Presence 卸载点回调 |
| `disableHoverablePopup`(禁止移入内容保持打开) | Base UI PreviewCard | 内容始终可停留 | 加开关,关闭时 content 不监听 pointer |
| 指针跟踪轴(`trackCursorAxis`) | Base UI PreviewCard | 不跟踪光标 | 可选:按指针 x/y 更新定位 |
| `stickIfOpen`、Portal 容器、`keepMounted` | Base UI PreviewCard | 关闭即卸载、Portal 到 body | 视需求扩展 |
| `delay`/`closeDelay` 的跨组件共享(类似 TooltipGroup) | Base UI 无直接对应 | 单卡片独立 | 目前不需要 |
| logical side 的 RTL | Base UI 逻辑属性 | 已支持 `inline-start`/`inline-end`(按 `dir` 转换) | 保持 |

> 结论:悬停延迟、交互内容、键盘、定位与进出场动画均已在本仓库内实现,
> **未新增任何运行时依赖**。

## 6. 示例

`dev/examples/hover-card.tsx`:Basic(@nextjs 预览)、Sides(left/top/bottom/right)、
Trigger Delays、Positioning(side/align)。

## 7. 关联

`message-scroller` 的 `Tracking the Reader's Position`(悬浮大纲)现已改用本组件,
此前 DESIGN.md 中「缺少 HoverCard」的差异项已消除。

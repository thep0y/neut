# Marker 组件设计方案

> 状态:**已实现**
> 移植目标:shadcn Base UI 版 `marker`(`ui.shadcn.com/docs/components/base/marker`)
> 关联代码:`src/components/marker/`

## 1. 概述

会话中的行内标记：状态、系统提示、带下边框的行、或带标签的分隔条。无状态、纯展示。

```
Marker               # 根:variant + 多态(div / a / button)
├── MarkerIcon       # 装饰性图标槽(aria-hidden)
└── MarkerContent    # 文本内容
```

## 2. SRP 分工

| 关注点 | 文件 |
| --- | --- |
| 变体样式 | `Marker/Marker.styles.ts`(cva:`default` / `separator` / `border`) |
| 多态根 | `Marker/Marker.tsx`(输出 `data-variant` + `group/marker`) |
| 图标槽 | `MarkerIcon/MarkerIcon.tsx`(aria-hidden) |
| 内容槽 | `MarkerContent/MarkerContent.tsx` |

`markerVariants` 一并导出，便于自定义组件复用样式。

## 3. 关键点

- **separator 变体的两侧横线是伪元素**(`before/after`),不是额外 DOM;因此它不需要
  `role="separator"`,文字按普通内容播报(加 `role="separator"` 反而不会朗读文本)。
- **MarkerIcon 是装饰性的**(`aria-hidden`),语义由 `MarkerContent` 承载;纯图标 marker
  需给根加 `aria-label`。
- **多态**:`component="a" | "button"` 让 marker 可点击并获得正确的 role/焦点。
- 与 `shimmer` 工具类组合可实现流式状态文字(见 dev 示例)。

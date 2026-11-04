# Carousel

轮播：横向/纵向、循环、自动播放、键盘导航与指示点。

```tsx
import {
    Carousel,
    CarouselContent,
    CarouselDots,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@neut/ui";

<Carousel loop orientation="horizontal" autoPlay autoPlayInterval={4000}>
    <CarouselContent>
        <CarouselItem>1</CarouselItem>
        <CarouselItem>2</CarouselItem>
        <CarouselItem>3</CarouselItem>
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
    <CarouselDots />
</Carousel>;
```

## Props

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `loop` | `boolean` | `false` | 到末尾后循环 |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | 滚动方向 |
| `autoPlay` | `boolean` | `false` | 自动播放 |
| `autoPlayInterval` | `number` | `3000` | 自动播放间隔（ms） |
| `aria-label` | `string` | `"Carousel"` | 区域标签 |

## 子部件

| 部件 | 说明 |
| :--- | :--- |
| `CarouselContent` | 滚动轨道 |
| `CarouselItem` | 单页；`index` 可选 |
| `CarouselPrevious` / `CarouselNext` | 前后按钮（`disabled` 由边缘状态驱动） |
| `CarouselDots` | 指示点；`role="tablist"`，每个点是带 `aria-selected` 的按钮 |

## 键盘与无障碍

- 根是 `section`，带 `aria-roledescription="carousel"` 与 `aria-label`。
- 左右方向键（水平）或上下方向键（垂直）切换；Home/End 到首/尾。
- 自动播放不会接管用户焦点；指示点按钮有 `aria-label`（"Go to slide n" 等）。
- 触摸/触控笔支持拖拽切页：水平轮播横滑、垂直轮播上下滑；
  位移超过 `max(24px, itemSize * 15%)` 切换，否则回弹。
- 鼠标拖动不接管（保留桌面端文本选择与点击），桌面继续用按钮/键盘。
- 视图使用 `touch-pan-y`（水平）或 `touch-pan-x`（垂直），保留页面的另一方向滚动。
- 未实现“悬停暂停自动播放”；需要时在应用层包一层。

> 轮播的宽度/高度由使用方决定：`CarouselContent` 依赖父容器宽度，`CarouselItem` 默认占满一屏。

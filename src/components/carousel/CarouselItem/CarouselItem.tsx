import { onCleanup, onMount } from "solid-js";
import { clsx } from "~/utils";
import { useCarouselContext } from "../Carousel";
import type { CarouselItemProps } from "./CarouselItem.types";

export const CarouselItem = (props: CarouselItemProps) => {
  const { currentIndex, registerItem, orientation, itemSize, viewportSize } =
    useCarouselContext();

  onMount(() => {
    const unregister = registerItem();
    // 记录注册顺序（简化：由父层传入 index）
    onCleanup(unregister);
  });

  /**
   * 一屏可见的 slide 数量；未测量时保守按 1 个算。
   * 不能只看 currentIndex，否则 basis-1/2 等多图同屏布局会把第二张
   * 可见 slide 也从无障碍树里摘掉。
   */
  const visibleCount = () => {
    const size = itemSize();
    if (size <= 0) return 1;
    return Math.max(1, Math.round(viewportSize() / size));
  };

  /**
   * 未传 index 时无法判断哪一张可见，宁可不隐藏，也不能把所有 slide
   * 都标成 aria-hidden（docs 示例就是不带 index 的写法）。
   */
  const isVisible = () => {
    if (props.index === undefined) return true;
    const start = currentIndex();
    return props.index >= start && props.index < start + visibleCount();
  };

  return (
    <fieldset
      aria-roledescription="slide"
      data-slot="carousel-item"
      aria-label={
        props.index !== undefined ? `Slide ${props.index + 1}` : "Slide"
      }
      aria-hidden={!isVisible()}
      class={clsx(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation() === "horizontal" ? "pl-4" : "pt-4",
        props.class,
      )}
    >
      {props.children}
    </fieldset>
  );
};

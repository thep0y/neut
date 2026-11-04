import { createSignal, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useCarouselContext } from "../Carousel";
import type { CarouselContentProps } from "./CarouselContent.types";
import { useCarouselTouchDrag } from "./useCarouselTouchDrag";
import { useItemSizeMeasure } from "./useItemSizeMeasure";

export const CarouselContent = (props: CarouselContentProps) => {
  const [viewportEl, setViewportEl] = createSignal<HTMLElement>();
  let trackRef: HTMLDivElement | undefined;

  const {
    currentIndex,
    orientation,
    itemSize,
    setItemSize,
    setViewportSize,
    scrollPrev,
    scrollNext,
  } = useCarouselContext();
  const [local, rest] = splitProps(props, ["class", "classList"]);

  useItemSizeMeasure(
    () => viewportEl(),
    () => trackRef,
    orientation,
    setItemSize,
    setViewportSize,
  );

  const drag = useCarouselTouchDrag({
    orientation,
    itemSize,
    scrollPrev,
    scrollNext,
  });

  const translate = () => {
    // translateX = -(index * itemSize) + dragOffset，写成减法以保留原有
    // 未拖动时的 "-0px" 输出；拖动时 dragOffset 为负表示向左拖。
    const offset = currentIndex() * itemSize() - drag.dragOffset();
    return orientation() === "horizontal"
      ? `translate3d(-${offset}px, 0, 0)`
      : `translate3d(0, -${offset}px, 0)`;
  };

  return (
    <div
      ref={(el) => {
        setViewportEl(el);
        drag.attach(el);
      }}
      class={clsx(
        "overflow-hidden",
        orientation() === "horizontal" ? "touch-pan-y" : "touch-pan-x",
      )}
      aria-live="polite"
      aria-atomic="true"
      data-slot="carousel-content"
    >
      <div
        ref={trackRef}
        class={clsx(
          "flex transition-transform duration-500 ease-out",
          drag.dragging() && "transition-none",
          orientation() === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          local.class,
        )}
        classList={local.classList}
        {...rest}
        // transform 由内部提供：用户的 style 必须**合并**而不是覆盖，
        // 否则轮播会因为没有 transform 而完全不再位移。
        // 因此这里放在 spread **之后**，让内部 transform 胜出。
        style={{
          ...(rest.style as Record<string, string>),
          transform: translate(),
        }}
      />
    </div>
  );
};

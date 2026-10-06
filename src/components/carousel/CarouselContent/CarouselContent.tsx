import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useCarouselContext } from "../Carousel";
import type { CarouselContentProps } from "./CarouselContent.types";
import { useItemSizeMeasure } from "./useItemSizeMeasure";

export const CarouselContent = (props: CarouselContentProps) => {
  let viewportRef: HTMLDivElement | undefined;
  let trackRef: HTMLDivElement | undefined;

  const { currentIndex, orientation, itemSize, setItemSize, setViewportSize } =
    useCarouselContext();
  const [local, rest] = splitProps(props, ["class", "classList"]);

  useItemSizeMeasure(
    () => viewportRef,
    () => trackRef,
    orientation,
    setItemSize,
    setViewportSize,
  );

  const translate = () => {
    const offset = currentIndex() * itemSize();
    return orientation() === "horizontal"
      ? `translate3d(-${offset}px, 0, 0)`
      : `translate3d(0, -${offset}px, 0)`;
  };

  return (
    <div
      ref={viewportRef}
      class="overflow-hidden"
      aria-live="polite"
      aria-atomic="true"
      data-slot="carousel-content"
    >
      <div
        ref={trackRef}
        class={clsx(
          "flex transition-transform duration-500 ease-out",
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

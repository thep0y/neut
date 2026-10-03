import { createSignal, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { CarouselContext } from "./Carousel.context";
import type { CarouselProps } from "./Carousel.types";
import { useAutoPlay } from "./useAutoPlay";
import { useCarousel } from "./useCarousel";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import classes from "./Carousel.styles";

export const Carousel = (props: CarouselProps) => {
  const [local, options, rest] = splitProps(
    props,
    ["class", "aria-label"],
    ["loop", "orientation", "autoPlay", "autoPlayInterval"],
  );

  const state = useCarousel(options);
  // 必须是 signal：ref 回调在挂载时才赋值，若按值传出去，
  // 键盘监听会拿到 undefined 且永不补挂（键盘导航曾因此完全失效）
  const [rootRef, setRootRef] = createSignal<HTMLElement | undefined>();

  useAutoPlay(
    options.autoPlay ?? false,
    options.autoPlayInterval ?? 3000,
    state.scrollNext,
  );

  useKeyboardNavigation({
    ref: rootRef,
    orientation: state.orientation,
    scrollPrev: state.scrollPrev,
    scrollNext: state.scrollNext,
    scrollToStart: () => state.scrollTo(0),
    scrollToEnd: () => state.scrollTo(Math.max(state.itemCount() - 1, 0)),
  });

  return (
    <CarouselContext.Provider value={state}>
      <section
        ref={(el) => setRootRef(el)}
        data-slot="carousel"
        aria-label={local["aria-label"] ?? "Carousel"}
        aria-roledescription="carousel"
        class={clsx(classes, local.class)}
        {...rest}
      />
    </CarouselContext.Provider>
  );
};

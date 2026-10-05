import { ChevronRight } from "lucide-solid";
import { mergeProps, splitProps } from "solid-js";
import { Button } from "~/components/button";
import type { MouseEventHandler } from "~/types";
import { callEventHandler, clsx } from "~/utils";
import { useCarouselContext } from "../Carousel";
import type { CarouselNextProps } from "./CarouselNext.types";

export const CarouselNext = (props: CarouselNextProps) => {
  const { scrollNext, canScrollNext, orientation } = useCarouselContext();
  const merged = mergeProps({ variant: "outline", size: "sm" } as const, props);
  const [local, others] = splitProps(merged, [
    "class",
    "classList",
    "onClick",
    "aria-label",
  ]);

  /**
   * 先调用调用方的 onClick（支持 Solid 的 [handler, data] 形式），
   * 再执行内部翻页——否则用户传 onClick 会把翻页整个替换掉
   * （AGENTS.md：暴露事件 prop 时应在内部调用用户回调）。
   */
  const handleClick: MouseEventHandler<"button"> = (event) => {
    // event 在类型上已必填（Solid 的点击事件一定有事件对象），
    // 因此不再需要 `if (!event) return` 这种永远不成立的守卫。
    callEventHandler(local.onClick, event);
    if (event.defaultPrevented) return;
    scrollNext();
  };

  return (
    <Button
      data-slot="carousel-next"
      class={clsx(
        "absolute touch-manipulation rounded-full",
        orientation() === "horizontal" &&
          "active:data-[slot=carousel-next]:translate-y-[calc(-50%+1px)]", // 修复shadcn中存在的bug，active状态会出现异常位移
        orientation() === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        local.class,
      )}
      classList={local.classList}
      aria-label={local["aria-label"] ?? "Next slide"}
      disabled={!canScrollNext()}
      onClick={handleClick}
      icon={<ChevronRight class="cn-rtl-flip" />}
      {...others}
    />
  );
};

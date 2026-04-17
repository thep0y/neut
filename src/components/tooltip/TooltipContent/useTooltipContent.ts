import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { computePosition } from "./TooltipContent.utils";
import { createStore } from "solid-js/store";
import type { TimeoutID } from "~/types";
import { useTooltipContext } from "../Tooltip/Tooltip.context";
import type { TooltipContentProps } from "./TooltipContent.types";

export const useTooltipContent = (
  ref: () => HTMLDivElement | undefined,
  local: () => Required<
    Pick<TooltipContentProps, "side" | "align" | "alignOffset" | "sideOffset">
  >,
) => {
  const { open, triggerRef } = useTooltipContext();

  const [position, setPosition] = createStore({
    top: -9999,
    left: -9999,
    side: local().side,
    align: local().align,
  });
  const [shouldRender, setShouldRender] = createSignal(open());
  let exitTimer: TimeoutID;

  const updatePosition = () => {
    const trigger = triggerRef();
    if (!trigger || !ref()) return;

    const { top, left, side, align } = computePosition(
      trigger,
      ref()!,
      local().side,
      local().align,
      local().alignOffset,
      local().sideOffset,
    );
    setPosition({ top, left, side, align });
  };

  const updatePositionNextFrame = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(updatePosition);
    });
  };

  onMount(() => {
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);
    updatePositionNextFrame();
  });

  onCleanup(() => {
    window.removeEventListener("scroll", updatePosition);
    window.removeEventListener("resize", updatePosition);
  });

  createEffect(() => {
    const isOpen = open();
    if (isOpen) {
      updatePositionNextFrame();
      setShouldRender(true);
    } else {
      const el = ref();
      if (el) {
        el.setAttribute("data-closed", "");
        el.removeAttribute("data-open");
        const onFinish = () => {
          setShouldRender(false);
          el.removeEventListener("animationend", onFinish);
          el.removeEventListener("transitionend", onFinish);
        };
        el.addEventListener("animationend", onFinish);
        el.addEventListener("transitionend", onFinish);
        // 超时保护
        exitTimer = setTimeout(() => setShouldRender(false), 300);
      } else {
        setShouldRender(false);
      }
    }
  });

  onCleanup(() => {
    if (exitTimer) clearTimeout(exitTimer);
  });

  return { shouldRender, position };
};

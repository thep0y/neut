import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import {
  containingBlockOffset,
  createPositioner,
  flip,
  hide,
  offset,
  shift,
} from "~/lib";
import { useHoverCardContext } from "../hover-card.context";
import { toPlacement } from "../hover-card.utils";
import type { HoverCardContentProps } from "../hover-card.types";

/** 未触发 animationend 时的兜底卸载延迟 */
const EXIT_FALLBACK_MS = 300;

/**
 * HoverCardContent 的定位与挂载生命周期:
 * - createPositioner 用 offset/flip/shift/hide/containingBlockOffset 定位;
 * - 打开时延迟一帧再切 animationState,保证 transform-origin 已由最终
 *   placement 算好(否则缩放锚点会先落在错误的边);
 * - 关闭时靠 animationend(带兜底超时)再卸载,让退场动画播完。
 */
export function useHoverCardContent(props: () => HoverCardContentProps) {
  const ctx = useHoverCardContext("HoverCardContent");

  const pos = createPositioner(ctx.reference, ctx.floating, {
    placement: () =>
      toPlacement(
        props().side ?? "bottom",
        props().align ?? "center",
        props().dir,
      ),
    strategy: "fixed",
    middleware: () => [
      offset({
        mainAxis: props().sideOffset ?? 4,
        crossAxis: props().alignOffset ?? 4,
      }),
      flip(),
      shift({ padding: props().collisionPadding ?? 8 }),
      hide(),
      containingBlockOffset(),
    ],
  });

  const isVisible = createMemo(
    () => ctx.open() && !pos.middlewareData().hide?.referenceHidden,
  );

  const [animationState, setAnimationState] = createSignal<"open" | "closed">(
    "closed",
  );
  createEffect(() => {
    if (isVisible()) {
      const raf = requestAnimationFrame(() => setAnimationState("open"));
      onCleanup(() => cancelAnimationFrame(raf));
    } else {
      setAnimationState("closed");
    }
  });

  const [contentElement, setContentElement] = createSignal<HTMLElement>();
  const [mounted, setMounted] = createSignal(isVisible());

  createEffect((wasVisible: boolean) => {
    const visible = isVisible();
    const el = contentElement();
    if (visible) {
      setMounted(true);
    } else if (wasVisible && el) {
      const handleAnimationEnd = (event: AnimationEvent) => {
        if (event.target !== el) return;
        setMounted(false);
      };
      el.addEventListener("animationend", handleAnimationEnd);
      onCleanup(() =>
        el.removeEventListener("animationend", handleAnimationEnd),
      );
      const fallback = window.setTimeout(
        () => setMounted(false),
        EXIT_FALLBACK_MS,
      );
      onCleanup(() => window.clearTimeout(fallback));
    } else if (!visible) {
      setMounted(false);
    }
    return visible;
  }, isVisible());

  return {
    ctx,
    pos,
    mounted,
    animationState,
    contentElement,
    setContentElement,
  };
}

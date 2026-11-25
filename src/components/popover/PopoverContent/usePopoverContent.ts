import { createSignal, createMemo, createEffect, onCleanup } from "solid-js";
import { useEscapeLayer } from "~/hooks";
import { createPositioner, type Positioner } from "~/lib";
import { usePopoverContext } from "../Popover/Popover.context";
import {
  createPopoverMiddleware,
  toPopoverPlacement,
} from "./PopoverContent.utils";
import type { PopoverContentProps } from "./PopoverContent.types";

export interface UsePopoverContentResult {
  ctx: ReturnType<typeof usePopoverContext>;
  pos: Positioner;
  isVisible: () => boolean;
  /** 驱动 data-open/data-closed 的动画状态；打开时比 isVisible 晚一帧。 */
  animationState: () => "open" | "closed";
}

export function usePopoverContent(
  props: () => PopoverContentProps,
): UsePopoverContentResult {
  const ctx = usePopoverContext("PopoverContent");

  useEscapeLayer({
    enabled: ctx.open,
    onEscape: () => ctx.closePopover(),
  });

  const pos = createPositioner(ctx.reference, ctx.floating, {
    placement: () =>
      toPopoverPlacement(props().side ?? "bottom", props().align ?? "center"),
    strategy: "fixed",
    middleware: () =>
      createPopoverMiddleware({
        sideOffset: props().sideOffset ?? 4,
        alignOffset: props().alignOffset ?? 0,
        collisionPadding: props().collisionPadding ?? 8,
      }),
  });

  const isVisible = createMemo(
    () => ctx.open() && !pos.middlewareData().hide?.referenceHidden,
  );

  // 打开时延迟一帧再触发动画 class，给定位计算留出时间。
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

  /**
   * 二级浮层（Select/Combobox/菜单/嵌套 Popover）都 Portal 到 body，
   * 从父 Popover 的 DOM 子树看是“外部”。点击这些浮层内部时不能关掉父层。
   */
  const NESTED_FLOATING_SELECTOR = [
    '[data-slot="select-content"]',
    '[data-slot="combobox-content"]',
    '[data-slot="dropdown-menu-content"]',
    '[data-slot="dropdown-menu-sub-content"]',
    '[data-slot="context-menu-content"]',
    '[data-slot="context-menu-sub-content"]',
    '[data-slot="popover-content"]',
    '[data-slot="hover-card-content"]',
    '[data-slot="tooltip-content"]',
  ].join(",");

  // 打开期间绑定 document 级监听：点击外部关闭 + Escape 关闭。
  createEffect(() => {
    if (!ctx.open()) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const targetElement =
        target instanceof Element ? target : target?.parentElement;
      const insideNestedFloating = !!targetElement?.closest(
        NESTED_FLOATING_SELECTOR,
      );
      if (
        !insideNestedFloating &&
        !ctx.reference()?.contains(target) &&
        !ctx.floating()?.contains(target)
      ) {
        // 不能 stopPropagation：document capture 阶段拦截会让页面其他元素
        // 收不到 pointerdown（Slider/Resizable/第三方拖拽全部失效）。
        ctx.closePopover();
      }
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    onCleanup(() => {
      document.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
    });
  });

  return { ctx, pos, isVisible, animationState };
}

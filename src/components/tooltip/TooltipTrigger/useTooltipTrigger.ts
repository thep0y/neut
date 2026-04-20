import { createEffect, onCleanup, type ChildrenReturn } from "solid-js";
import type { TimeoutID } from "~/types";
import { useTooltipContext } from "../Tooltip/Tooltip.context";

export const useTooltipTrigger = (resolved: ChildrenReturn) => {
  const { setOpen, openDelay, closeDelay, setTriggerRef } = useTooltipContext();

  let openTimer: TimeoutID;
  let closeTimer: TimeoutID;
  let el: HTMLElement | undefined;

  const open = () => {
    clearTimeout(closeTimer);
    openTimer = setTimeout(() => setOpen(true), openDelay);
  };

  const close = () => {
    clearTimeout(openTimer);
    closeTimer = setTimeout(() => setOpen(false), closeDelay);
  };

  createEffect(() => {
    el = resolved() as HTMLElement | undefined;
    if (!el) return;

    const handleMouseEnter = () => open();
    const handleMouseLeave = () => close();
    const handleMouseDown = () => close();

    setTriggerRef(el);
    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("blur", handleMouseLeave);

    onCleanup(() => {
      el!.removeEventListener("mouseenter", handleMouseEnter);
      el!.removeEventListener("mouseleave", handleMouseLeave);
      el!.removeEventListener("mousedown", handleMouseDown);
      el!.removeEventListener("blur", handleMouseLeave);
    });
  });

  onCleanup(() => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
  });
};

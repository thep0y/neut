import { onCleanup, onMount, type ChildrenReturn } from "solid-js";
import type { TimeoutID } from "~/types";
import { useTooltipContext } from "../Tooltip/Tooltip.context";

export const useTooltipTrigger = (resolved: ChildrenReturn) => {
  const { setOpen, openDelay, closeDelay, setTriggerRef } = useTooltipContext();

  let openTimer: TimeoutID;
  let closeTimer: TimeoutID;

  const open = () => {
    clearTimeout(closeTimer);
    openTimer = setTimeout(() => setOpen(true), openDelay);
  };

  const close = () => {
    clearTimeout(openTimer);
    closeTimer = setTimeout(() => setOpen(false), closeDelay);
  };

  const handleMouseEnter = () => open();
  const handleMouseLeave = () => close();
  const handleMouseDown = () => close();

  onMount(() => {
    const el = resolved() as HTMLElement | undefined;
    if (!el) return;

    setTriggerRef(el);
    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("mousedown", handleMouseDown);

    onCleanup(() => {
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("mousedown", handleMouseDown);
    });
  });

  onCleanup(() => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
  });
};

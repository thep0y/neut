import {
  createSignal,
  createUniqueId,
  onCleanup,
  type ParentProps,
} from "solid-js";
import { TooltipContext } from "./Tooltip.context";

export const Tooltip = (
  props: ParentProps & { openDelay?: number; closeDelay?: number },
) => {
  let triggerRef: HTMLElement | undefined;

  const [open, setOpen] = createSignal(false);

  const setTriggerRef = (el: HTMLElement) => {
    triggerRef = el;
  };

  // 临时：把 open signal 直接暴露到 window 上调试
  (window as any).__tooltipOpen = open;
  (window as any).__tooltipSetOpen = setOpen;

  const contentId = createUniqueId();

  const contextValue = {
    open,
    setOpen,
    get triggerRef() {
      return triggerRef;
    },
    setTriggerRef,
    contentId,
    openDelay: props.openDelay ?? 100,
    closeDelay: props.closeDelay ?? 100,
  };

  onCleanup(() => {
    console.trace("Tooltip unmount/cleanup");
  });

  return (
    <TooltipContext.Provider value={contextValue}>
      {props.children}
    </TooltipContext.Provider>
  );
};

import { createSignal, type ParentProps } from "solid-js";
import { TooltipContext } from "./Tooltip.context";

export const Tooltip = (
  props: ParentProps & { openDelay?: number; closeDelay?: number },
) => {
  const [open, setOpen] = createSignal(false);
  const [triggerRef, setTriggerRef] = createSignal<HTMLElement>();

  const contentId = `tooltip-${Math.random().toString(36).slice(2)}`;

  return (
    <TooltipContext.Provider
      value={{
        open,
        setOpen,
        triggerRef,
        setTriggerRef,
        contentId,
        openDelay: props.openDelay ?? 100,
        closeDelay: props.closeDelay ?? 100,
      }}
    >
      {props.children}
    </TooltipContext.Provider>
  );
};

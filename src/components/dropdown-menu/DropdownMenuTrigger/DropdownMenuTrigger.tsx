// classlist-opt-out: Dynamic 的 component 是 Button（子组件会自己处理 classList），实际不丢
import type { ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Button } from "~/components/button";
import { clsx, mergeRefs } from "~/utils";
import { useDropdownMenuTrigger } from "./useDropdownMenuTrigger";
import type { DropdownMenuTriggerProps } from "./DropdownMenuTrigger.types";

/** 默认渲染 Button；点击或方向键/Enter/Space 打开菜单 */
export const DropdownMenuTrigger = <
  T extends ValidComponent = typeof Button<"button">,
>(
  props: DropdownMenuTriggerProps<T>,
) => {
  const ownDisabled = () => Boolean((props as { disabled?: boolean }).disabled);
  const { ctx, attachListeners } = useDropdownMenuTrigger(ownDisabled);

  return (
    <Dynamic
      {...props}
      component={(props.component as ValidComponent) ?? Button<"button">}
      ref={mergeRefs(
        (el: Element) => ctx.setTrigger(el as HTMLElement),
        props.ref,
        attachListeners,
      )}
      disabled={ctx.disabled() || ownDisabled()}
      data-slot="dropdown-menu-trigger"
      aria-haspopup="menu"
      aria-expanded={ctx.open()}
      aria-controls={ctx.open() ? ctx.contentId : undefined}
      data-state={ctx.open() ? "open" : "closed"}
      data-popup-open={ctx.open() ? "" : undefined}
      class={clsx(props.class)}
    />
  );
};

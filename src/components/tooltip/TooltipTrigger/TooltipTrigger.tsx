import type { ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";

import { useTooltipTrigger } from "./useTooltipTrigger";
import type { TooltipTriggerProps } from "./TooltipTrigger.types";

import { Button } from "~/components/button";

/**
 * 合并多个 ref，依次调用，谁都不会覆盖谁。
 *
 * 类型上写成 `Element | ((el: Element) => void)`，是为了匹配 Solid 的 ref
 * 类型约定（调用方在 JSX 里可以写 `ref={myVar}` 也可以写 `ref={(el) => ...}`）。
 * 但组件内部实际拿到的 props.ref，无论调用方是哪种写法，Solid 编译器都会
 * 统一规整成回调函数再转发进来（这是官方文档明确说明的行为：
 * https://docs.solidjs.com/concepts/refs#forwarding-refs），所以这里直接
 * 当函数调用即可，不需要再判断类型。
 */
function mergeRefs(
  ...refs: Array<Element | ((el: Element) => void) | undefined>
) {
  return (el: Element) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(el);
    }
  };
}

export const TooltipTrigger = <
  T extends ValidComponent = typeof Button<"button">,
>(
  props: TooltipTriggerProps<T>,
) => {
  const { ctx, attachListeners } = useTooltipTrigger();

  return (
    <Dynamic
      {...props}
      component={(props.component as ValidComponent) ?? Button<"button">}
      ref={mergeRefs(ctx.setReference, props.ref, attachListeners)}
      aria-describedby={ctx.open() ? ctx.contentId : undefined}
      data-state={ctx.open() ? "open" : "closed"}
      // data-disabled={props.disabled ? "" : undefined}
    />
  );
};

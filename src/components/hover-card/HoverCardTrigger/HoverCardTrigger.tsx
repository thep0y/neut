import { splitProps, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { mergeRefs } from "~/utils";
import { useHoverCardTrigger } from "./useHoverCardTrigger";
import type { HoverCardTriggerProps } from "../hover-card.types";

/** 默认渲染无样式的 <a>;需要按钮/链接样式时用 `component={Button}` 指定 */
export const HoverCardTrigger = <T extends ValidComponent = "a">(
  props: HoverCardTriggerProps<T>,
) => {
  const [local, rest] = splitProps(props, [
    "delay",
    "closeDelay",
    "disabled",
    "component",
  ]);

  const { ctx, attachListeners } = useHoverCardTrigger({
    delay: () => local.delay,
    closeDelay: () => local.closeDelay,
    disabled: () => local.disabled,
  });

  return (
    <Dynamic
      {...rest}
      component={(local.component as ValidComponent) ?? "a"}
      ref={mergeRefs(
        ctx.setReference,
        props.ref as ((el: Element) => void) | undefined,
        attachListeners,
      )}
      data-slot="hover-card-trigger"
      data-state={ctx.open() ? "open" : "closed"}
      data-popup-open={ctx.open() ? "" : undefined}
      aria-describedby={ctx.open() ? ctx.contentId : undefined}
    />
  );
};

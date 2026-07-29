import { mergeProps, Show, splitProps, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { SidebarMenuButtonProps } from "./SidebarMenuButton.types";
import { clsx } from "~/utils";
import { useSidebar } from "../SidebarProvider";
import { sidebarMenuButtonVariants } from "./SidebarMenuButton.styles";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";

export const SidebarMenuButton = <T extends ValidComponent = "button">(
  props: SidebarMenuButtonProps<T>,
) => {
  const { isMobile, state } = useSidebar();

  const merged = mergeProps(
    {
      isActive: false,
      variant: "ghost",
      size: "md",
      component: "button",
    } as const,
    props,
  );

  const [local, others] = splitProps(merged, [
    "component",
    "isActive",
    "variant",
    "size",
    "tooltip",
    "class",
    "classList",
  ]);

  return (
    <Show
      when={local.tooltip}
      fallback={
        <Dynamic
          component={local.component as ValidComponent}
          data-slot="sidebar-menu-button"
          data-sidebar="menu-button"
          data-size={local.size}
          data-active={local.isActive}
          class={clsx(
            sidebarMenuButtonVariants({
              variant: local.variant,
              size: local.size,
            }),
            local.class,
          )}
          {...others}
        />
      }
    >
      <Tooltip>
        <TooltipTrigger
          component={local.component as ValidComponent}
          data-slot="sidebar-menu-button"
          data-sidebar="menu-button"
          data-size={local.size}
          data-active={local.isActive}
          class={clsx(
            sidebarMenuButtonVariants({
              variant: local.variant,
              size: local.size,
            }),
            local.class,
          )}
          {...others}
        />
        <TooltipContent
          side="right"
          align="center"
          hidden={state() !== "collapsed" || isMobile}
          {...(typeof local.tooltip === "string"
            ? { children: local.tooltip }
            : local.tooltip)}
        />
      </Tooltip>
    </Show>
  );
};

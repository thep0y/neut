import { mergeProps, splitProps, type ValidComponent } from "solid-js";
import type { SidebarGroupActionProps } from "./SidebarGroupAction.types";
import { clsx } from "~/utils";
import { Dynamic } from "solid-js/web";

export const SidebarGroupAction = <T extends ValidComponent = "button">(
  props: SidebarGroupActionProps<T>,
) => {
  const merged = mergeProps({ component: "button" } as const, props);

  const [local, others] = splitProps(merged, [
    "component",
    "class",
    "classList",
  ]);

  return (
    <Dynamic
      component={local.component as ValidComponent}
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      class={clsx(
        "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
        local.class,
      )}
      {...others}
    />
  );
};

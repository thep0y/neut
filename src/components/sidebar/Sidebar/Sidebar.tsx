import { mergeProps, Show, splitProps } from "solid-js";
import type { SidebarProps } from "./Sidebar.types";
import { clsx } from "~/utils";
import { useSidebar } from "../SidebarProvider";

export const Sidebar = (props: SidebarProps) => {
  const { isMobile, state } = useSidebar();

  const merged = mergeProps(
    { side: "left", variant: "sidebar", collapsible: "offcanvas" } as const,
    props,
  );

  const [local, others] = splitProps(merged, [
    "side",
    "variant",
    "collapsible",
    "class",
    "classList",
    "children",
  ]);

  return (
    <Show
      when={local.collapsible !== "none"}
      fallback={
        <div
          data-slot="sidebar"
          class={clsx(
            "flex h-full w-(--sidebar-width) flex-col",
            "bg-sidebar text-sidebar-foreground",
            local.class,
          )}
          {...others}
        >
          {local.children}
        </div>
      }
    >
      <Show when={!isMobile} fallback={null}>
        <div
          class="group peer hidden text-sidebar-foreground md:block"
          data-state={state()}
          data-collapsible={state() === "collapsed" ? local.collapsible : ""}
          data-variant={local.variant}
          data-side={local.side}
          data-slot="sidebar"
        >
          {/* This is what handles the sidebar gap on desktop */}
          <div
            data-slot="sidebar-gap"
            class={clsx(
              "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
              "group-data-[collapsible=offcanvas]:w-0",
              "group-data-[side=right]:rotate-180",
              local.variant === "floating" || local.variant === "inset"
                ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
                : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
            )}
          />
          <div
            data-slot="sidebar-container"
            data-side={local.side}
            class={clsx(
              "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:-left-(--sidebar-width) data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:-right-(--sidebar-width) md:flex",
              // Adjust the padding for floating and inset variants.
              local.variant === "floating" || local.variant === "inset"
                ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
                : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
              local.class,
            )}
            {...props}
          >
            <div
              data-sidebar="sidebar"
              data-slot="sidebar-inner"
              class="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
            >
              {local.children}
            </div>
          </div>
        </div>
      </Show>
    </Show>
  );
};

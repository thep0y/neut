import { createEffect, onCleanup, onMount, splitProps } from "solid-js";
import { ChevronRight } from "lucide-solid";
import { clsx } from "~/utils";
import { useContextMenuSubmenu } from "~/components/context-menu/context-menu.context";
import { useContextMenuEntry } from "~/components/context-menu/context-menu.entry";
import { dropdownMenuSubTriggerClass } from "../dropdown-menu.styles";
import type { DropdownMenuSubTriggerProps } from "./DropdownMenuSubTrigger.types";

export function DropdownMenuSubTrigger(props: DropdownMenuSubTriggerProps) {
  const submenu = useContextMenuSubmenu("DropdownMenuSubTrigger");
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "inset",
    "disabled",
    "label",
    "openOnHover",
    "delay",
    "closeDelay",
    "onClick",
  ]);

  const disabled = () => !!local.disabled || submenu.disabled();

  let element: HTMLDivElement | undefined;

  const entry = useContextMenuEntry({
    component: "DropdownMenuSubTrigger",
    element: () => element,
    disabled,
    label: () => local.label,
    hasPopup: () => true,
    openPopup: (reason, event) => submenu.openSubmenu(reason, event),
  });

  onMount(() => {
    submenu.setItemId(entry.id);
    onCleanup(() => submenu.setItemId(undefined));
  });

  let openedViaParent = false;
  createEffect(() => {
    const state = submenu.parentPopup.openPopupState();
    if (state?.id === entry.id) {
      openedViaParent = true;
      return;
    }
    if (openedViaParent && submenu.open()) {
      openedViaParent = false;
      submenu.setOpen(false, state ? "sibling-open" : "list-navigation");
      return;
    }
    if (!submenu.open()) openedViaParent = false;
  });

  let openTimer: number | undefined;
  const clearOpenTimer = () => {
    if (openTimer !== undefined) {
      window.clearTimeout(openTimer);
      openTimer = undefined;
    }
  };
  onCleanup(clearOpenTimer);

  createEffect(() => {
    if (submenu.open()) clearOpenTimer();
  });

  const handlePointerEnter = () => {
    entry.highlight();
    submenu.cancelClose();
    if (disabled()) return;
    if (local.openOnHover === false || submenu.open()) return;
    clearOpenTimer();
    openTimer = window.setTimeout(() => {
      openTimer = undefined;
      submenu.openSubmenu("trigger-hover");
    }, local.delay ?? 100);
  };

  const handlePointerLeave = () => {
    clearOpenTimer();
    if (submenu.open()) submenu.scheduleClose(local.closeDelay ?? 0);
  };

  const handleClick = (e: MouseEvent) => {
    if (disabled()) return;
    local.onClick?.(e);
    if (e.defaultPrevented) return;

    if (submenu.open()) {
      submenu.closeSubmenu("trigger-press", e, false);
    } else {
      submenu.openSubmenu("trigger-press", e);
    }
  };

  return (
    <div
      ref={(el) => {
        element = el;
        submenu.setTrigger(el);
        onCleanup(() => submenu.setTrigger(undefined));
      }}
      id={entry.id}
      role="menuitem"
      aria-haspopup="menu"
      aria-expanded={submenu.open() ? "true" : "false"}
      tabIndex={-1}
      data-slot="dropdown-menu-sub-trigger"
      data-inset={local.inset ? "" : undefined}
      data-open={submenu.open() ? "" : undefined}
      data-highlighted={entry.isActive() ? "" : undefined}
      data-disabled={disabled() ? "" : undefined}
      aria-disabled={disabled() ? "true" : undefined}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={() => entry.highlight()}
      class={clsx(dropdownMenuSubTriggerClass, local.class)}
      {...rest}
    >
      {local.children}
      <ChevronRight class="ml-auto" />
    </div>
  );
}

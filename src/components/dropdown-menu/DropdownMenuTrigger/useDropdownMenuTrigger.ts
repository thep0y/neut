import { onCleanup } from "solid-js";
import { useDropdownMenuContext } from "../DropdownMenu/DropdownMenu.context";

export function useDropdownMenuTrigger() {
  const ctx = useDropdownMenuContext("DropdownMenuTrigger");

  const attachListeners = (el: Element) => {
    const onClick = (event: Event) => {
      if (ctx.disabled()) return;
      ctx.toggle(event);
    };

    const onKeyDown = (event: Event) => {
      if (ctx.disabled()) return;
      const e = event as KeyboardEvent;
      if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) return;
      e.preventDefault();
      if (!ctx.open()) ctx.setOpen(true, e);
    };

    el.addEventListener("click", onClick);
    el.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      el.removeEventListener("click", onClick);
      el.removeEventListener("keydown", onKeyDown);
    });
  };

  return { ctx, attachListeners };
}

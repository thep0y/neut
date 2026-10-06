import { onCleanup } from "solid-js";
import { useDropdownMenuContext } from "../DropdownMenu/DropdownMenu.context";

export function useDropdownMenuTrigger(
  /**
   * 触发器自身的 disabled（根状态之外的 `props.disabled`）。
   * 必须参与守卫：多态渲染成 div/a 时浏览器不会帮忙屏蔽点击，
   * 只判 `ctx.disabled()` 会让"禁用的触发器"照样打开菜单。
   */
  ownDisabled: () => boolean,
) {
  const ctx = useDropdownMenuContext("DropdownMenuTrigger");

  const attachListeners = (el: Element) => {
    const disabled = () => ctx.disabled() || ownDisabled();

    const onClick = (event: Event) => {
      if (disabled()) return;
      ctx.toggle(event);
    };

    const onKeyDown = (event: Event) => {
      if (disabled()) return;
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

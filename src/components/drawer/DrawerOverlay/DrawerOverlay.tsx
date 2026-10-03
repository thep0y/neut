import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useDrawerContext } from "../Drawer/Drawer.context";
import type { DrawerOverlayProps } from "./DrawerOverlay.types";

/** 遮罩：点击关闭（disablePointerDismissal 时除外），随开关淡入淡出 */
export function DrawerOverlay(props: DrawerOverlayProps) {
  const ctx = useDrawerContext("DrawerOverlay");
  const [local, rest] = splitProps(props, ["class", "classList", "onClick"]);

  return (
    <div
      {...rest}
      data-slot="drawer-overlay"
      data-state={ctx.open() ? "open" : "closed"}
      aria-hidden="true"
      style={{
        opacity: ctx.open() ? 1 : 0,
        transition: "opacity 450ms cubic-bezier(0.32, 0.72, 0, 1)",
      }}
      class={clsx(
        "fixed inset-0 z-50 min-h-dvh bg-black/10 select-none supports-backdrop-filter:backdrop-blur-xs",
        local.class,
      )}
      classList={local.classList}
      onClick={(
        event: MouseEvent & {
          currentTarget: HTMLDivElement;
          target: Element;
        },
      ) => {
        // 只转发调用方的 onClick。
        // 「点遮罩关闭」由 Drawer 根组件在 document 上的 pointerdown 捕获统一处理——
        // 这里再关一次会让一次真实点击产生两次 onOpenChange（pointerdown + click），
        // 而且第二次是在已经关闭之后重复回调。
        const userOnClick = local.onClick as
          | ((e: typeof event) => void)
          | undefined;
        userOnClick?.(event);
      }}
    />
  );
}

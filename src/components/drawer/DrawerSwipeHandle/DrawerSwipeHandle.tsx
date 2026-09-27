import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useDrawerContext } from "../Drawer/Drawer.context";
import type { DrawerSwipeHandleProps } from "./DrawerSwipeHandle.types";

/**
 * 拖拽把手。横向抽屉在侧边显示竖条，纵向抽屉在顶部显示横条；
 * 具体方向样式由 Content 上的 data-swipe-axis / direction 通过组选择器驱动。
 */
export function DrawerSwipeHandle(props: DrawerSwipeHandleProps) {
  useDrawerContext("DrawerSwipeHandle");
  const [local, rest] = splitProps(props, ["class", "classList"]);

  return (
    <div
      {...rest}
      data-slot="drawer-swipe-handle"
      aria-hidden="true"
      class={clsx(
        "relative z-10 flex shrink-0 cursor-grab active:cursor-grabbing",
        // 轴向：x 轴是整列的竖条，y 轴是整行的横条
        "group-data-[swipe-axis=x]/drawer-popup:h-full group-data-[swipe-axis=x]/drawer-popup:w-3 group-data-[swipe-axis=x]/drawer-popup:items-center",
        "group-data-[swipe-axis=y]/drawer-popup:h-3 group-data-[swipe-axis=y]/drawer-popup:w-full group-data-[swipe-axis=y]/drawer-popup:justify-center",
        // 方向：决定把手贴在面板哪条边、以及在行/列中的顺序
        "group-data-[swipe-direction=down]/drawer-popup:items-end",
        "group-data-[swipe-direction=left]/drawer-popup:order-last group-data-[swipe-direction=left]/drawer-popup:justify-start",
        "group-data-[swipe-direction=right]/drawer-popup:justify-end",
        "group-data-[swipe-direction=up]/drawer-popup:order-last group-data-[swipe-direction=up]/drawer-popup:items-start",
        "after:block after:shrink-0 after:rounded-full after:bg-muted",
        "group-data-[swipe-axis=x]/drawer-popup:after:h-24 group-data-[swipe-axis=x]/drawer-popup:after:w-1",
        "group-data-[swipe-axis=y]/drawer-popup:after:h-1 group-data-[swipe-axis=y]/drawer-popup:after:w-24",
        local.class,
      )}
      classList={local.classList}
    />
  );
}

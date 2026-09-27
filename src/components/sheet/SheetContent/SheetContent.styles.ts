import type { SheetSide } from "../sheet.types";

/**
 * 贴边面板的基础样式。动画走本仓库既有的 animate-in/out 工具类:
 * 打开时从对应边滑入 + 淡入,关闭时滑出 + 淡出,由 DialogSurface 的
 * onAnimationEnd 负责卸载。
 */
export const contentBase =
  "fixed z-50 flex flex-col gap-4 bg-white dark:bg-neutral-900 text-sm text-neutral-950 dark:text-neutral-50 shadow-lg outline-none select-none duration-200 data-[open=true]:animate-in data-[open=true]:fade-in-0 data-[open=false]:animate-out data-[open=false]:fade-out-0";

const sideStyles: Record<SheetSide, string> = {
  top: "inset-x-0 top-0 h-auto border-b data-[open=true]:slide-in-from-top data-[open=false]:slide-out-to-top",
  bottom:
    "inset-x-0 bottom-0 h-auto border-t data-[open=true]:slide-in-from-bottom data-[open=false]:slide-out-to-bottom",
  left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-[open=true]:slide-in-from-left data-[open=false]:slide-out-to-left",
  right:
    "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm data-[open=true]:slide-in-from-right data-[open=false]:slide-out-to-right",
};

export function sideClasses(side: SheetSide): string {
  return sideStyles[side];
}

/** 右上角关闭按钮位置;左右两侧留白一致,顶部/底部面板也适用 */
export function closeClasses(_side: SheetSide): string {
  return "absolute top-4 right-4";
}

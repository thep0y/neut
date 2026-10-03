import { createSignal, onCleanup } from "solid-js";

/** 与 Tailwind 的 md 断点一致：小于 768px 视为移动端 */
export const MOBILE_BREAKPOINT = 768;

/**
 * 响应式判断是否处于移动端。
 *
 * 原本这里是 `const isMobile = false` 的硬编码（源码里还留着 FIXME），
 * 于是 `openMobile` / `setOpenMobile` 与 `toggleSidebar` 的移动分支全是死代码，
 * 移动端也不会走 Sheet 形态。这里用 matchMedia 订阅断点变化。
 */
export function useIsMobile(): () => boolean {
  const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
  const list =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query)
      : undefined;

  const [isMobile, setIsMobile] = createSignal(list?.matches ?? false);
  if (list) {
    const handleChange = (event: MediaQueryListEvent) =>
      setIsMobile(event.matches);
    list.addEventListener("change", handleChange);
    onCleanup(() => list.removeEventListener("change", handleChange));
  }

  return isMobile;
}

/**
 * MessageScroller 的滚动锚点查找。
 *
 * 单一职责：在「已知的行列表」上判断哪些行是锚点（`data-scroll-anchor="true"`）。
 * 纯函数、不碰 DOM 读写，因此可独立单测。
 */

/** 行的 `data-scroll-anchor` 是否为 true */
function isAnchor(element: HTMLElement): boolean {
  return element.dataset.scrollAnchor === "true";
}

/** 从 `from` 开始往后找第一个锚点行（找不到返回 null） */
export function firstAnchorFrom(
  list: HTMLElement[],
  from: number,
): HTMLElement | null {
  for (let index = from; index < list.length; index += 1) {
    const element = list[index];
    if (element && isAnchor(element)) return element;
  }
  return null;
}

/** 从前往后找第一个「还没被处理过」的锚点行（找不到返回 null） */
export function firstUnhandledAnchor(
  list: HTMLElement[],
  handled: WeakSet<HTMLElement>,
): HTMLElement | null {
  return (
    list.find((element) => isAnchor(element) && !handled.has(element)) ?? null
  );
}

/** 从 `from` 开始，后面是否还有第二个锚点（用于「同批多个新锚点 → 直接跟随底部」） */
export function hasMultipleAnchorsFrom(
  list: HTMLElement[],
  from: number,
): boolean {
  let count = 0;
  for (let index = from; index < list.length; index += 1) {
    if (list[index] && isAnchor(list[index])) {
      count += 1;
      if (count > 1) return true;
    }
  }
  return false;
}

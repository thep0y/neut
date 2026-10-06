/**
 * roving focus 键盘导航的通用实现。
 *
 * 适用范围:Tabs（tablist）与 ToggleGroup 的键盘交互语义完全一致——
 * 方向键在可用的项之间移动焦点，Home/End 跳首尾，`loop` 决定边界是否环绕，
 * disabled 项被跳过，"焦点不在项上时不接管按键"。
 *
 * 抽出来的动因:两个组件此前各自实现了一份近乎逐字的逻辑，
 * 连注释里写的方向映射表都一样，属于典型的"改一处忘一处"风险点。
 *
 * 与 Base UI 一致:方向键只移动焦点、不激活（激活靠 click / Enter / Space），
 * 移动后由调用方通过 `onHighlight` 同步高亮。
 */
export interface RovingNavItem<TValue> {
  value: TValue;
  element: HTMLElement;
  /** accessor，支持运行时 disabled 翻转 */
  disabled: () => boolean;
}

export interface RovingNavOptions<TValue> {
  /** 当前已挂载的项（挂载顺序） */
  getItems: () => RovingNavItem<TValue>[];
  /** 布局方向 */
  orientation: () => "horizontal" | "vertical";
  /** 书写方向；未指定/auto 时按 `getDirection()` 的实际计算值判断 */
  dir: () => "ltr" | "rtl" | "auto" | undefined;
  /** 是否在边界环绕 */
  loop: () => boolean;
  /** 整个组件是否被禁用（禁用时不接管任何按键） */
  disabled?: () => boolean;
  /**
   * 用于判断实际书写方向的目标元素。
   * 默认读 `document.documentElement.dir`；ToggleGroup 传 `event.currentTarget`
   * 以便兼容祖先节点上的 `dir`（读 computedStyle 的 direction）。
   */
  getDirectionElement?: (event: KeyboardEvent) => Element | null;
  /** 焦点移动后同步高亮 */
  onHighlight: (value: TValue) => void;
}

/** 会被导航接管的按键 */
export const ROVING_NAV_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

/** 解析最终生效的书写方向 */
function resolveRTL(
  dir: "ltr" | "rtl" | "auto" | undefined,
  event: KeyboardEvent,
  getDirectionElement: ((event: KeyboardEvent) => Element | null) | undefined,
): boolean {
  if (dir === "rtl") return true;
  if (dir === "ltr") return false;

  // 未指定或 auto：按实际书写方向判断
  const target = getDirectionElement?.(event);
  if (target) {
    return getComputedStyle(target).direction === "rtl";
  }
  return (
    typeof document !== "undefined" && document.documentElement.dir === "rtl"
  );
}

/**
 * 计算下一个应该聚焦的索引。
 *
 * 返回 `undefined` 表示不接管本次按键（方向键与当前布局不匹配，
 * 或焦点不在任何已注册项上）。
 *
 * @param currentIndex 当前聚焦项在**可用项**列表中的下标
 * @param itemCount 可用项数量
 */
export function computeNextIndex(
  key: string,
  currentIndex: number,
  itemCount: number,
  opts: { isVertical: boolean; isRTL: boolean; loop: boolean },
): number | undefined {
  let next: number | undefined;

  switch (key) {
    case "Home":
      next = 0;
      break;
    case "End":
      next = itemCount - 1;
      break;
    case "ArrowLeft":
      // 竖直布局下左右键不构成导航语义
      if (opts.isVertical) return undefined;
      next = currentIndex + (opts.isRTL ? 1 : -1);
      break;
    case "ArrowRight":
      if (opts.isVertical) return undefined;
      next = currentIndex + (opts.isRTL ? -1 : 1);
      break;
    case "ArrowUp":
      if (!opts.isVertical) return undefined;
      next = currentIndex - 1;
      break;
    case "ArrowDown":
      if (!opts.isVertical) return undefined;
      next = currentIndex + 1;
      break;
    default:
      return undefined;
  }

  if (opts.loop) {
    return (next + itemCount) % itemCount;
  }
  return Math.min(itemCount - 1, Math.max(0, next));
}

/**
 * 创建 roving focus 的 keydown 处理器。
 *
 * 调用方负责:① 只在焦点已经落在某项上时才生效（由本函数内部判断）；
 * ② 提供 `onHighlight` 同步高亮。
 */
export function createRovingNavigation<TValue>(
  options: RovingNavOptions<TValue>,
) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (options.disabled?.()) return;
    if (!ROVING_NAV_KEYS.has(event.key)) return;

    const activeEl = document.activeElement as HTMLElement | null;
    // 已被禁用的项不参与导航
    const items = options.getItems().filter((item) => !item.disabled());
    if (items.length === 0) return;

    const currentIndex = items.findIndex((item) => item.element === activeEl);
    if (currentIndex === -1) return;

    const isVertical = options.orientation() === "vertical";
    const isRTL = resolveRTL(options.dir(), event, options.getDirectionElement);

    const nextIndex = computeNextIndex(event.key, currentIndex, items.length, {
      isVertical,
      isRTL,
      loop: options.loop(),
    });
    if (nextIndex === undefined) return;

    // 方向键与当前布局匹配，接管默认滚动行为
    event.preventDefault();

    const nextItem = items[nextIndex];
    nextItem.element.focus();
    options.onHighlight(nextItem.value);
  };

  return { handleKeyDown };
}

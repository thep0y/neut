import type { JSX } from "solid-js";
import {
  type Action,
  isAction,
  type Position,
  type ToastT,
} from "./Toast.types";

/**
 * `action` / `cancel` 既可以是"带 label 的操作对象"，也可以是任意自定义元素。
 * 这里把判定收敛成一个收窄函数：渲染层拿到的要么是可用的 `Action`，
 * 要么是 `undefined`（自定义元素走另一条 Show 分支），避免每个按钮各写一遍守卫。
 */
export function getToastAction(value: ToastT["action"]): Action | undefined {
  return isAction(value) ? value : undefined;
}

/**
 * `title` / `description` 允许写成惰性函数：内容可能是随信号变化的元素。
 * 这里是唯一的求值点，渲染层只消费结果。
 */
export function resolveToastContent(value: ToastT["title"]): JSX.Element {
  return typeof value === "function" ? value() : value;
}

/** 堆叠的纵向朝向：`top-*` 从顶部向下堆，其余从底部向上堆。 */
export function getVerticalAxis(position: Position): "top" | "bottom" {
  return position.startsWith("top") ? "top" : "bottom";
}

/** 只有最前面的一层参与进出场动画、接收指针事件。 */
export function isFrontToast(index: number): boolean {
  return index === 0;
}

/**
 * 非最前层的"堆叠"变换：沿纵向让出 `gap * index` 的位移，并逐层缩小。
 * 缩放下限 0.8，避免层数多时缩到几乎不可见。
 */
export function getCollapsedTransform(options: {
  index: number;
  gap: number;
  position: Position;
}): string | undefined {
  const { index, gap, position } = options;
  if (isFrontToast(index)) return undefined;

  const lift = getVerticalAxis(position) === "bottom" ? -1 : 1;
  const scale = Math.max(0.8, 1 - index * 0.05);
  return `translateY(calc(${lift * gap * index}px)) scale(${scale})`;
}

/**
 * 折叠态用 `grid-area: 1 / 1` 让所有层叠在同一格，靠 transform 错开；
 * 展开态交还给容器的 flex 排列，因此不写这些定位属性。
 */
export function getToastStyle(options: {
  toast: ToastT;
  index: number;
  total: number;
  expanded: boolean;
  position: Position;
  gap: number;
}): JSX.CSSProperties {
  const { toast, index, total, expanded, position, gap } = options;

  return {
    ...toast.style,
    // 越靠前层级越高，避免后加入的层盖住最前面的层
    "z-index": total - index,
    ...(expanded
      ? {}
      : {
          "grid-area": "1 / 1",
          "align-self":
            getVerticalAxis(position) === "bottom" ? "end" : "start",
          transform: getCollapsedTransform({ index, gap, position }),
          "pointer-events": isFrontToast(index) ? "auto" : "none",
        }),
  } as JSX.CSSProperties;
}

/**
 * 进出场动画只给最前面的层（展开时给所有层）：后层在折叠态只是"背景卡片"，
 * 播放位移动画会穿帮。
 */
export function getAnimationClasses(options: {
  index: number;
  expanded: boolean;
  position: Position;
}): string {
  const { index, expanded, position } = options;
  if (!isFrontToast(index) && !expanded) return "";

  const isBottom = getVerticalAxis(position) === "bottom";
  const slideIn = isBottom
    ? "data-[state=open]:slide-in-from-bottom-2"
    : "data-[state=open]:slide-in-from-top-2";
  const slideOut = isBottom
    ? "data-[state=closed]:slide-out-to-bottom"
    : "data-[state=closed]:slide-out-to-top";

  return `${slideIn} ${slideOut} data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:fill-mode-both data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:fill-mode-both`;
}

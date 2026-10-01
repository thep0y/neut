import { For, type JSX } from "solid-js";
import { clsx } from "~/utils";
import { Toast } from "../Toast";
import type { Position, ToastIcons, ToastT } from "../Toast/Toast.types";
import { toasterContainerClass } from "./Toaster.styles";
import type { Offset, ToastOptions } from "./Toaster.types";
import {
  getPositionClass,
  getViewportLayoutClass,
  resolveOffsetStyle,
} from "./Toaster.utils";

export interface ToastViewportProps {
  /** 该视口负责的位置 */
  position: Position;
  /** 展开态：由容器悬停/热键驱动 */
  expanded: boolean;
  /** 视口内的 toast（已按 visibleToasts 截断） */
  toasts: ToastT[];
  gap: number;
  ariaLabel: string;
  offset?: Offset;
  mobileOffset?: Offset;
  style?: JSX.CSSProperties;
  /** Toaster 级配置：逐条 toast 的兜底值 */
  closeButton?: boolean;
  duration?: number;
  icons?: ToastIcons;
  richColors?: boolean;
  toastOptions?: ToastOptions;
  /** 展开态变化（悬停进入/离开） */
  onExpandChange: (expanded: boolean) => void;
  onRemove: (id: string) => void;
}

/**
 * 一个位置上的 toast 视口：live region 语义 + 定位样式 + 逐条渲染。
 *
 * 它同时承担"Toaster 级配置 → 单条 Toast 配置"的优先级解析
 * （单条 > `toastOptions` > 根级），因为这是纯读取、无副作用；
 * 每个属性都写成 getter 表达式，配置变化时仍然逐条响应式更新。
 */
export function ToastViewport(props: ToastViewportProps) {
  return (
    <ol
      data-slot="toaster-viewport"
      data-position={props.position}
      aria-live="polite"
      aria-relevant="additions text"
      aria-atomic="false"
      aria-label={props.ariaLabel}
      tabIndex={-1}
      class={clsx(
        toasterContainerClass,
        getPositionClass(props.position),
        getViewportLayoutClass(props.position, props.expanded),
      )}
      style={{
        gap: `${props.gap}px`,
        ...resolveOffsetStyle(props.position, props.offset, props.mobileOffset),
        ...(props.style as Record<string, string | number>),
      }}
      onMouseEnter={() => props.onExpandChange(true)}
      onMouseLeave={() => props.onExpandChange(false)}
    >
      <For each={props.toasts}>
        {(toast: ToastT, index) => (
          <Toast
            toast={toast}
            index={index()}
            total={props.toasts.length}
            expanded={props.expanded}
            position={props.position}
            gap={props.gap}
            closeButton={
              toast.closeButton ??
              props.toastOptions?.closeButton ??
              props.closeButton ??
              false
            }
            duration={props.toastOptions?.duration ?? props.duration}
            class={props.toastOptions?.class}
            icons={props.icons}
            closeButtonAriaLabel={props.toastOptions?.closeButtonAriaLabel}
            defaultRichColors={props.richColors}
            onRemove={props.onRemove}
          />
        )}
      </For>
    </ol>
  );
}

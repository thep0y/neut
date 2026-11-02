import type { JSX } from "solid-js";
import type {
  Position,
  SwipeDirection,
  ToastIcons,
  ToastClassnames,
  ToastVariant,
} from "../Toast/Toast.types";

export type Offset =
  | {
      top?: string | number;
      right?: string | number;
      bottom?: string | number;
      left?: string | number;
    }
  | string
  | number;

export interface ToastOptions {
  class?: string;
  /** 覆盖 Toaster 级的表面样式 */
  variant?: ToastVariant;
  closeButton?: boolean;
  descriptionClass?: string;
  style?: JSX.CSSProperties;
  cancelButtonStyle?: JSX.CSSProperties;
  actionButtonStyle?: JSX.CSSProperties;
  duration?: number;
  classes?: ToastClassnames;
  closeButtonAriaLabel?: string;
  toasterId?: string;
}

export interface ToasterProps {
  id?: string;
  invert?: boolean;
  /** @deprecated Toast 不再自行设置明暗主题，请直接设置 <html data-theme="..."> */
  theme?: "light" | "dark" | "system";
  position?: Position;
  hotkey?: string[];
  /** 表面样式，默认 `popover`；单条 toast 可用 `variant` 覆盖 */
  variant?: ToastVariant;
  /** @deprecated 使用 `variant`；`true` 等价于 `variant="semantic"` */
  richColors?: boolean;
  expand?: boolean;
  duration?: number;
  gap?: number;
  visibleToasts?: number;
  closeButton?: boolean;
  toastOptions?: ToastOptions;
  class?: string;
  style?: JSX.CSSProperties;
  offset?: Offset;
  mobileOffset?: Offset;
  dir?: "rtl" | "ltr" | "auto";
  swipeDirections?: SwipeDirection[];
  icons?: ToastIcons;
  customAriaLabel?: string;
  containerAriaLabel?: string;
}

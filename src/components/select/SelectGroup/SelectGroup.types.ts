import type { ParentProps } from "solid-js";
import type { BaseProps } from "~/types";

/**
 * SelectGroup 是一个容器部件：除 BaseProps（class / classList / style / dir）
 * 外还要接受 children 与任意透传属性（如 data-*）。
 */
export type SelectGroupProps = BaseProps &
  ParentProps & { [key: `data-${string}`]: unknown };

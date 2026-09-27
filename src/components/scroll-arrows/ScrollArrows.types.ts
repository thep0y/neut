import type { Accessor } from "solid-js";

export interface ScrollArrowsProps {
  /** 滚动容器 accessor；组件内部据此计算上下边缘状态 */
  target: Accessor<HTMLElement | undefined>;
  /**
   * 箭头是否可交互(悬停/按住持续滚动)。默认 false:
   * 箭头只是**装饰性提示**(pointer-events-none),不拦截指针、不会与滚动互相触发。
   * 开启后箭头会覆盖列表边缘并参与指针命中,请确保列表项不依赖该区域点击。
   */
  interactive?: boolean;
  /** 两个箭头共用的额外 class */
  class?: string;
  /** 顶部箭头额外 class(圆角等) */
  upClass?: string;
  /** 底部箭头额外 class(圆角等) */
  downClass?: string;
}

export interface ScrollArrowButtonProps {
  direction: "up" | "down";
  visible: boolean;
  interactive: boolean;
  target: Accessor<HTMLElement | undefined>;
  class?: string;
}

import { createComponent, type JSX } from "solid-js";
import {
  SliderContext,
  type useSliderContext,
} from "~/components/slider/Slider/Slider.context";

/**
 * slider 测试共享脚手架。
 *
 * jsdom 不做布局：`getBoundingClientRect()` 恒为 0，指针拖拽的坐标 → 数值换算
 * 因此无法产生可预期结果。这里显式 stub 这个系统边界（TESTING.md §4.5），
 * 给出一套可控坐标系；同时补上 jsdom 缺失的 Pointer Events capture API。
 */

/** 假 context 的类型：直接取自真实 hook 的返回值，避免和实现里的 interface 漂移 */
export type SliderCtx = ReturnType<typeof useSliderContext>;

/** 造一个 DOMRect（jsdom 没有 DOMRect 构造函数，只能手写） */
export function rect(box: {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width?: number;
  height?: number;
}): DOMRect {
  const top = box.top ?? 0;
  const left = box.left ?? 0;
  const bottom = box.bottom ?? top + (box.height ?? 0);
  const right = box.right ?? left + (box.width ?? 0);
  return {
    top,
    bottom,
    left,
    right,
    width: box.width ?? right - left,
    height: box.height ?? bottom - top,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

/** 让元素报告指定矩形 */
export function stubRect<T extends HTMLElement>(
  el: T,
  box: Parameters<typeof rect>[0],
): T {
  el.getBoundingClientRect = () => rect(box);
  return el;
}

/** jsdom 没有 Pointer Events 的 capture 系列 API，按元素补一份最小实现 */
export function stubPointerCapture(element: HTMLElement): Set<number> {
  const captured = new Set<number>();
  Object.assign(element, {
    setPointerCapture: (id: number) => captured.add(id),
    hasPointerCapture: (id: number) => captured.has(id),
    releasePointerCapture: (id: number) => captured.delete(id),
  });
  return captured;
}

/** 造一个带 pointerId 的 pointer 事件（jsdom 没有 PointerEvent 构造函数） */
export function pointerEvent(
  type: string,
  init: {
    pointerId?: number;
    clientX?: number;
    clientY?: number;
    button?: number;
  } = {},
): PointerEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: init.button ?? 0,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
  });
  Object.defineProperty(event, "pointerId", { value: init.pointerId ?? 1 });
  return event as unknown as PointerEvent;
}

/** 在假 Provider 内渲染一个 hook（用 createComponent 以免把 JSX 带进 .ts 文件） */
export function contextWrapper(value: SliderCtx) {
  return (props: { children: JSX.Element }) =>
    createComponent(SliderContext.Provider, {
      value,
      get children() {
        return props.children;
      },
    });
}

/**
 * 假 Context：只填被测组件用到的字段，其余给安全默认值。
 * 组件渲染/算法测试用它驱动确定性输入，整机行为另由 integration 用例覆盖真实 Provider。
 */
export function fakeCtx(overrides: Partial<SliderCtx> = {}): SliderCtx {
  return {
    values: () => [0],
    min: () => 0,
    max: () => 100,
    step: () => 1,
    orientation: () => "horizontal",
    disabled: () => false,
    activeThumbIndex: () => 0,
    setActiveThumbIndex: () => {},
    updateValue: () => {},
    trackRef: () => undefined,
    setTrackRef: () => {},
    ...overrides,
  };
}

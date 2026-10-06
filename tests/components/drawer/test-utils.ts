import { createComponent, type ParentProps } from "solid-js";
import { vi } from "vitest";
import { DrawerContext } from "~/components/drawer/Drawer/Drawer.context";
import type { DrawerContextValue } from "~/components/drawer/Drawer/Drawer.types";

/**
 * Drawer 测试脚手架。
 *
 * 单测子部件时用一个「假 context」驱动确定性的输入（而不是依赖真实组合），
 * 整机行为另由 `drawer.integration.test.tsx` 覆盖真实组件树。
 * 假 context 不是 mock 被测对象本身（TESTING.md §4.5）：被测的是渲染/接线，
 * 状态机由 Drawer 集成用例覆盖。
 */
export function fakeDrawerContext(
  overrides: Partial<DrawerContextValue> = {},
): DrawerContextValue {
  return {
    open: () => false,
    setOpen: () => {},
    show: () => false,
    setShow: () => {},
    modal: () => true,
    swipeDirection: () => "down",
    showSwipeHandle: () => false,
    disablePointerDismissal: () => false,
    trigger: () => undefined,
    setTrigger: () => {},
    popup: () => undefined,
    setPopup: () => {},
    contentId: "drawer-content-test",
    titleId: () => undefined,
    setTitleId: () => {},
    descriptionId: () => undefined,
    setDescriptionId: () => {},
    restoreFocus: () => {},
    ...overrides,
  };
}

/** DrawerContext 的 Provider 包装（用 createComponent 以免把 JSX 带进 .ts 文件） */
export function drawerContextWrapper(value: DrawerContextValue) {
  return (props: ParentProps) =>
    createComponent(DrawerContext.Provider, {
      value,
      get children() {
        return props.children;
      },
    });
}

/**
 * 让元素报告指定的 offsetWidth / offsetHeight。
 * jsdom 不做布局，这两个值恒为 0，而拖拽阈值依赖面板尺寸，属于系统边界 stub。
 */
export function stubOffsetBox(
  element: HTMLElement,
  box: { offsetWidth?: number; offsetHeight?: number },
): HTMLElement {
  if (box.offsetWidth !== undefined) {
    Object.defineProperty(element, "offsetWidth", {
      configurable: true,
      value: box.offsetWidth,
    });
  }
  if (box.offsetHeight !== undefined) {
    Object.defineProperty(element, "offsetHeight", {
      configurable: true,
      value: box.offsetHeight,
    });
  }
  return element;
}

export interface AnimationFrameStub {
  /** 执行当前排队中的全部帧回调 */
  flush: () => void;
  /** 仍未执行的回调数量（用来验证 onCleanup 取消） */
  pending: () => number;
}

/**
 * 可控的 requestAnimationFrame。
 *
 * DrawerContent 打开时靠 rAF 才切到「打开位置」，jsdom 的真实 rAF 时序不可控，
 * 这里换成手动触发（TESTING.md §4.5：只 stub 系统边界）。
 */
export function stubAnimationFrame(): AnimationFrameStub {
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextHandle = 0;

  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    nextHandle += 1;
    callbacks.set(nextHandle, callback);
    return nextHandle;
  });
  vi.stubGlobal("cancelAnimationFrame", (handle: number) => {
    callbacks.delete(handle);
  });

  return {
    flush: () => {
      for (const [handle, callback] of [...callbacks]) {
        callbacks.delete(handle);
        callback(0);
      }
    },
    pending: () => callbacks.size,
  };
}

/** 等真实的一帧，让 DrawerContent 的入场 rAF 落地 */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

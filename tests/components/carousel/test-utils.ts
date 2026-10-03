import { vi } from "vitest";

/**
 * carousel 测试脚手架。
 *
 * jsdom 不做布局：`offsetWidth` / `offsetHeight` 恒为 0，而 item 尺寸与 viewport
 * 尺寸正是「一屏显示几个」和 track 位移的唯一输入。这里只 stub 这两个系统边界
 * （TESTING.md §4.5），并提供可手动触发的 ResizeObserver 来驱动重新测量。
 */

export interface ResizeObserverInstance {
  /** `observe()` 注册过的元素，按调用顺序 */
  observed: Element[];
  /** `disconnect()` 被调用的次数 */
  disconnectCalls: number;
  /** 手动投递一次回调，模拟尺寸变化 */
  trigger: () => void;
}

export interface ResizeObserverStub {
  instances: ResizeObserverInstance[];
  /** 触发全部实例的回调 */
  triggerAll: () => void;
}

/** 记录型 ResizeObserver：捕获实例、observe 目标与 disconnect 次数 */
export function stubResizeObserver(): ResizeObserverStub {
  const instances: ResizeObserverInstance[] = [];

  class TestResizeObserver {
    private readonly instance: ResizeObserverInstance;

    constructor(private readonly callback: ResizeObserverCallback) {
      this.instance = {
        observed: [],
        disconnectCalls: 0,
        trigger: () => this.callback([], this as unknown as ResizeObserver),
      };
      instances.push(this.instance);
    }

    observe(target: Element) {
      this.instance.observed.push(target);
    }

    unobserve(target: Element) {
      this.instance.observed = this.instance.observed.filter(
        (el) => el !== target,
      );
    }

    disconnect() {
      this.instance.disconnectCalls += 1;
    }
  }

  vi.stubGlobal("ResizeObserver", TestResizeObserver);

  return {
    instances,
    triggerAll: () => {
      for (const instance of instances) instance.trigger();
    },
  };
}

/** jsdom 的属性只有 getter，只能靠 defineProperty 造出非零尺寸 */
export function stubOffsetBox(
  element: HTMLElement,
  box: { width?: number; height?: number },
): HTMLElement {
  if (box.width !== undefined) {
    Object.defineProperty(element, "offsetWidth", {
      configurable: true,
      value: box.width,
    });
  }
  if (box.height !== undefined) {
    Object.defineProperty(element, "offsetHeight", {
      configurable: true,
      value: box.height,
    });
  }
  return element;
}

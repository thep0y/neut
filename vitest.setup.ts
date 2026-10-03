import "@testing-library/jest-dom/vitest";
import { cleanup } from "@solidjs/testing-library";
import { afterEach, vi } from "vitest";

// jsdom 没有实现这些浏览器 API，但组件逻辑依赖它们。
// 这里只提供最小可控实现，让逻辑分支可以在测试里被显式驱动
//（见 TESTING.md §4.5：只 mock 系统边界，不 mock 被测对象）。

// 每个用例后清理 DOM、还原 stub，避免测试互相污染
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

if (!globalThis.ResizeObserver) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver;
}

if (!globalThis.IntersectionObserver) {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver;
}

if (!globalThis.matchMedia) {
  const matchMediaStub = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
  globalThis.matchMedia = matchMediaStub;
}

// jsdom 不实现 scrollIntoView，而菜单在键盘高亮时会调用它
// （"让高亮项滚入视野"）。缺失时调用会抛 TypeError 并被 vitest 记为
// unhandled error，因此补一个空实现。
// 注意：这里不做真实滚动 —— jsdom 没有布局，滚动本身无法验证。
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

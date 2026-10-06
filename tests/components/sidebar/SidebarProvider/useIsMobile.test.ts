import { renderHook } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MOBILE_BREAKPOINT,
  useIsMobile,
} from "~/components/sidebar/SidebarProvider/useIsMobile";

/**
 * `useIsMobile` 用 matchMedia 订阅断点：
 * - 初始值取自 query 的 matches；
 * - 断点跨越时靠 change 事件更新；
 * - 卸载时移除监听。
 *
 * matchMedia 是系统边界，这里用可控替身（TESTING.md §4.5）。
 */
type Listener = (event: MediaQueryListEvent) => void;

function stubMatchMedia(initialMatches: boolean) {
  const listeners = new Set<Listener>();
  const removeEventListener = vi.fn((_type: string, listener: Listener) => {
    listeners.delete(listener);
  });
  const media = {
    matches: initialMatches,
    media: "",
    addEventListener: (_type: string, listener: Listener) => {
      listeners.add(listener);
    },
    removeEventListener,
  };
  const matchMedia = vi.fn((query: string) => {
    media.media = query;
    return media as unknown as MediaQueryList;
  });
  vi.stubGlobal("matchMedia", matchMedia);
  return {
    matchMedia,
    removeEventListener,
    change(matches: boolean) {
      media.matches = matches;
      for (const listener of [...listeners]) {
        listener({ matches } as MediaQueryListEvent);
      }
    },
    listenerCount: () => listeners.size,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useIsMobile", () => {
  it("用 md 断点查询，并把初始 matches 作为当前值", () => {
    const media = stubMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());

    expect(media.matchMedia).toHaveBeenCalledWith(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    );
    expect(result()).toBe(true);
  });

  it("初始不匹配时是 false", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());

    expect(result()).toBe(false);
  });

  it("断点跨越时跟随 change 事件更新", () => {
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());

    media.change(true);
    expect(result()).toBe(true);

    media.change(false);
    expect(result()).toBe(false);
  });

  it("卸载时移除监听", () => {
    const media = stubMatchMedia(false);
    const { cleanup } = renderHook(() => useIsMobile());
    expect(media.listenerCount()).toBe(1);

    cleanup();

    expect(media.listenerCount()).toBe(0);
    expect(media.removeEventListener).toHaveBeenCalled();
  });
});

describe("useIsMobile - 能力缺失时的兜底", () => {
  it("环境没有 matchMedia 时返回 false（不抛错）", () => {
    // jsdom 的 setup 会补 matchMedia，这里显式抹掉模拟老环境/SSR 边界
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(() => useIsMobile());

    expect(result()).toBe(false);
  });

  it("没有 window 时返回 false（SSR 兜底）", () => {
    const original = globalThis.window;
    delete (globalThis as { window?: unknown }).window;
    try {
      const { result } = renderHook(() => useIsMobile());
      expect(result()).toBe(false);
    } finally {
      vi.stubGlobal("window", original);
    }
  });
});

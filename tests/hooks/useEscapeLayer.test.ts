import { fireEvent, renderHook } from "@solidjs/testing-library";
import { createRoot, createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";

/**
 * `useEscapeLayer` 用模块级栈保存当前打开的层，状态会在测试之间残留。
 * 每个用例 `resetModules()` 后重新 import，拿到干净的栈实例。
 */
async function freshModule() {
  vi.resetModules();
  return import("~/hooks/useEscapeLayer");
}

describe("useEscapeLayer", () => {
  it("只有栈顶层收到 Escape", async () => {
    const { useEscapeLayer } = await freshModule();
    const parent = vi.fn();
    const child = vi.fn();

    const parentLayer = renderHook(() =>
      useEscapeLayer({ enabled: () => true, onEscape: parent }),
    );
    const childLayer = renderHook(() =>
      useEscapeLayer({ enabled: () => true, onEscape: child }),
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(child).toHaveBeenCalledTimes(1);
    expect(parent).not.toHaveBeenCalled();

    childLayer.cleanup();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(parent).toHaveBeenCalledTimes(1);

    parentLayer.cleanup();
  });

  it("enabled 切换时入栈/出栈", async () => {
    const { useEscapeLayer } = await freshModule();
    const onEscape = vi.fn();
    const [enabled, setEnabled] = createSignal(false);

    const layer = renderHook(() => useEscapeLayer({ enabled, onEscape }));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).not.toHaveBeenCalled();

    setEnabled(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);

    setEnabled(false);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);

    layer.cleanup();
  });

  it("输入法组合中的 Escape 不处理", async () => {
    const { useEscapeLayer } = await freshModule();
    const onEscape = vi.fn();
    const layer = renderHook(() =>
      useEscapeLayer({ enabled: () => true, onEscape }),
    );

    fireEvent.keyDown(document, { key: "Escape", isComposing: true });

    expect(onEscape).not.toHaveBeenCalled();
    layer.cleanup();
  });

  it("SSR 没有 document 时不注册监听也不抛错", async () => {
    const { useEscapeLayer } = await freshModule();
    const originalDocument = globalThis.document;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: undefined,
    });
    try {
      await new Promise<void>((resolve) => {
        createRoot((dispose) => {
          expect(() =>
            useEscapeLayer({ enabled: () => true, onEscape: () => {} }),
          ).not.toThrow();
          queueMicrotask(() => {
            dispose();
            resolve();
          });
        });
      });
    } finally {
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: originalDocument,
      });
    }
  });

  it("已被 preventDefault 的 Escape 不处理", async () => {
    const { useEscapeLayer } = await freshModule();
    const onEscape = vi.fn();
    const layer = renderHook(() =>
      useEscapeLayer({ enabled: () => true, onEscape }),
    );

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    event.preventDefault();
    document.dispatchEvent(event);

    expect(onEscape).not.toHaveBeenCalled();
    layer.cleanup();
  });
});

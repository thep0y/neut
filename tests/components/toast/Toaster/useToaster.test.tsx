import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import type { Position, ToastT } from "~/components/toast/Toast/Toast.types";
import { useToaster } from "~/components/toast/Toaster/useToaster";

function toast(id: string, extra: Partial<ToastT> = {}): ToastT {
  return { id, title: id, ...extra };
}

function setup(
  init: {
    toasts?: ToastT[];
    toasterId?: string;
    position?: Position;
    visibleToasts?: number;
    expand?: boolean;
    hotkey?: string[];
  } = {},
) {
  const [toasts, setToasts] = createSignal<ToastT[]>(init.toasts ?? []);
  const [toasterId, setToasterId] = createSignal(init.toasterId);
  const [position, setPosition] = createSignal<Position>(
    init.position ?? "bottom-right",
  );
  const [visibleToasts, setVisibleToasts] = createSignal(
    init.visibleToasts ?? 3,
  );
  const [expand, setExpand] = createSignal(init.expand);
  const [hotkey, setHotkey] = createSignal<string[]>(
    init.hotkey ?? ["altKey", "KeyT"],
  );

  const hook = renderHook(() =>
    useToaster({
      toasts,
      toasterId,
      position,
      visibleToasts,
      expand,
      hotkey,
    }),
  );

  return {
    ...hook,
    setToasts,
    setToasterId,
    setPosition,
    setVisibleToasts,
    setExpand,
    setHotkey,
  };
}

describe("useToaster 选择", () => {
  it("未指定 toasterId 时只挑选没有归属的 toast", () => {
    const { result } = setup({
      toasts: [toast("a"), toast("b", { toasterId: "other" }), toast("c")],
    });

    expect(result.visibleToastsForPosition("bottom-right")).toEqual([
      expect.objectContaining({ id: "a" }),
      expect.objectContaining({ id: "c" }),
    ]);
  });

  it("指定 toasterId 时只挑选归属该 id 的 toast", () => {
    const { result } = setup({
      toasterId: "panel",
      toasts: [toast("a"), toast("b", { toasterId: "panel" })],
    });

    expect(result.visibleToastsForPosition("bottom-right")).toEqual([
      expect.objectContaining({ id: "b" }),
    ]);
  });

  it("视口集合 = 默认位置 + toast 自带位置去重", () => {
    const { result } = setup({
      toasts: [
        toast("a", { position: "top-left" }),
        toast("b", { position: "top-left" }),
        toast("c"),
      ],
    });

    expect(result.possiblePositions()).toEqual(["bottom-right", "top-left"]);
  });

  it("没有 toast 指定位置时只有一个视口", () => {
    const { result } = setup({ toasts: [toast("a")] });

    expect(result.possiblePositions()).toEqual(["bottom-right"]);
  });

  it("自带位置的 toast 只出现在自己的视口", () => {
    const { result } = setup({
      toasts: [toast("a", { position: "top-left" }), toast("b")],
    });

    expect(result.visibleToastsForPosition("top-left")).toEqual([
      expect.objectContaining({ id: "a" }),
    ]);
    expect(result.visibleToastsForPosition("bottom-right")).toEqual([
      expect.objectContaining({ id: "b" }),
    ]);
  });

  it("超过 visibleToasts 的部分被截断（新的在前）", () => {
    const { result } = setup({
      visibleToasts: 2,
      toasts: [toast("a"), toast("b"), toast("c")],
    });

    expect(result.visibleToastsForPosition("bottom-right")).toHaveLength(2);
  });

  it("expand 置位时不截断", () => {
    const { result } = setup({
      visibleToasts: 2,
      expand: true,
      toasts: [toast("a"), toast("b"), toast("c")],
    });

    expect(result.visibleToastsForPosition("bottom-right")).toHaveLength(3);
  });

  it("visibleToasts 变化后立即生效", () => {
    const { result, setVisibleToasts } = setup({
      visibleToasts: 1,
      toasts: [toast("a"), toast("b")],
    });

    expect(result.visibleToastsForPosition("bottom-right")).toHaveLength(1);

    setVisibleToasts(5);
    expect(result.visibleToastsForPosition("bottom-right")).toHaveLength(2);
  });
});

describe("useToaster 展开态", () => {
  it("初始为收起", () => {
    const { result } = setup();

    expect(result.expanded()).toBe(false);
  });

  it("热键全部命中时展开", () => {
    const { result } = setup();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { altKey: true, code: "KeyT" }),
    );

    expect(result.expanded()).toBe(true);
  });

  it("只命中部分热键时不展开", () => {
    const { result } = setup();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { altKey: true, code: "KeyX" }),
    );

    expect(result.expanded()).toBe(false);
  });

  it("hotkey 为空数组时任何按键都不展开", () => {
    const { result } = setup({ hotkey: [] });

    document.dispatchEvent(
      new KeyboardEvent("keydown", { altKey: true, code: "KeyT" }),
    );

    expect(result.expanded()).toBe(false);
  });

  it("Escape 收起", () => {
    const { result } = setup();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { altKey: true, code: "KeyT" }),
    );
    expect(result.expanded()).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape" }));
    expect(result.expanded()).toBe(false);
  });

  it("setExpanded 可直接驱动悬停展开/收起", () => {
    const { result } = setup();

    result.setExpanded(true);
    expect(result.expanded()).toBe(true);

    result.setExpanded(false);
    expect(result.expanded()).toBe(false);
  });

  it("卸载后不再响应按键", () => {
    const { result, cleanup } = setup();

    cleanup();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { altKey: true, code: "KeyT" }),
    );

    expect(result.expanded()).toBe(false);
  });
});

import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { useDragCursor } from "~/components/resizable/ResizablePanelGroup/useDragCursor";
import type { ResizableOrientation } from "~/components/resizable/resizable.types";

function dragSheet() {
  return document.querySelector<HTMLStyleElement>("[data-resizable-drag]");
}

function setup(orientation: ResizableOrientation = "horizontal") {
  const [dragging, setDragging] = createSignal(false);
  const [dir, setDir] = createSignal<ResizableOrientation>(orientation);
  const hook = renderHook(() => useDragCursor(dragging, dir));

  return { ...hook, setDragging, setDir };
}

afterEach(() => {
  document.body.style.userSelect = "";
  dragSheet()?.remove();
});

describe("useDragCursor", () => {
  it("未拖拽时不注入任何样式", () => {
    setup();

    expect(dragSheet()).toBeNull();
    expect(document.body.style.userSelect).toBe("");
  });

  it("横向拖拽注入 ew-resize 并禁用文本选择", () => {
    const { setDragging } = setup("horizontal");

    setDragging(true);

    expect(dragSheet()?.textContent).toContain("ew-resize !important");
    expect(document.body.style.userSelect).toBe("none");
  });

  it("纵向拖拽注入 ns-resize", () => {
    const { setDragging } = setup("vertical");

    setDragging(true);

    expect(dragSheet()?.textContent).toContain("ns-resize !important");
  });

  it("拖拽结束后移除样式并还原文本选择", () => {
    document.body.style.userSelect = "text";
    const { setDragging } = setup();

    setDragging(true);
    expect(dragSheet()).not.toBeNull();

    setDragging(false);

    expect(dragSheet()).toBeNull();
    expect(document.body.style.userSelect).toBe("text");
  });

  it("拖拽中切换方向时用最新方向重建样式（旧样式被回收）", () => {
    const { setDragging, setDir } = setup("horizontal");
    setDragging(true);

    setDir("vertical");

    const sheets = document.querySelectorAll("[data-resizable-drag]");
    expect(sheets).toHaveLength(1);
    expect(sheets[0].textContent).toContain("ns-resize !important");
  });

  it("卸载时移除样式并还原文本选择", () => {
    document.body.style.userSelect = "text";
    const { setDragging, cleanup } = setup();
    setDragging(true);

    cleanup();

    expect(dragSheet()).toBeNull();
    expect(document.body.style.userSelect).toBe("text");
  });

  it("初始即拖拽（受控传入 true）也会注入", () => {
    const [dragging] = createSignal(true);
    const [dir] = createSignal<ResizableOrientation>("horizontal");
    const hook = renderHook(() => useDragCursor(dragging, dir));

    // effect 在 renderHook 的 owner 内已经执行
    expect(dragSheet()).not.toBeNull();

    hook.cleanup();
  });
});

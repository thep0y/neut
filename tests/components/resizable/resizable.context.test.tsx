import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import {
  ResizablePanelGroupContext,
  type ResizablePanelGroupContextValue,
  useResizablePanelGroupContext,
} from "~/components/resizable/resizable.context";

/** 构造一个假的 Context 值 */
function fakeContext(): ResizablePanelGroupContextValue {
  return {
    orientation: () => "horizontal",
    sizes: () => ({}),
    groupElement: () => undefined,
    setGroupElement: () => {},
    dragging: () => false,
    keyboardResizeBy: () => 10,
    registerPanel: () => () => {},
    resolveAdjacent: () => undefined,
    setAdjacentSize: () => {},
    nudgeAdjacent: () => {},
    toggleHandleCollapse: () => {},
    groupSizePx: () => 0,
    isRtl: () => false,
    beginDrag: () => {},
    endDrag: () => {},
    commitLayout: () => {},
    setPanelSize: () => {},
    collapsePanel: () => false,
    expandPanel: () => false,
    isPanelCollapsed: () => false,
    getPanelSize: () => 0,
  };
}

describe("useResizablePanelGroupContext", () => {
  it("在 Provider 内可以取到 Context", () => {
    const value = fakeContext();
    let seen: ResizablePanelGroupContextValue | undefined;
    const Probe = () => {
      seen = useResizablePanelGroupContext("Probe");
      return <div />;
    };

    render(() => (
      <ResizablePanelGroupContext.Provider value={value}>
        <Probe />
      </ResizablePanelGroupContext.Provider>
    ));

    expect(seen).toBe(value);
  });

  it("脱离 Provider 使用时抛错并带上组件名", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(() => {
        useResizablePanelGroupContext("ResizableHandle");
        return <div />;
      }),
    ).toThrow("<ResizableHandle> 必须渲染在 <ResizablePanelGroup> 内部");

    spy.mockRestore();
  });
});
